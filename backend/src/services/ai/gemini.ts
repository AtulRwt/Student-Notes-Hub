import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { PDFExtract } from 'pdf.js-extract';
import mammoth from 'mammoth';
import https from 'https';
import http from 'http';

// Load environment variables
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY || '';
const FALLBACK_MAX_CHARS = Number(process.env.GEMINI_FALLBACK_MAX_CHARS || 1200);

console.log('ENV DEBUG: First 5 chars of API key:', apiKey.substring(0, 5));
console.log('ENV DEBUG: API key length:', apiKey.length);
console.log('ENV DEBUG: Contains placeholder?', apiKey.includes('your-gemini-api-key-here'));

const isPlaceholder = apiKey.includes('your-gemini-api-key-here');
if (!apiKey || isPlaceholder) {
  console.error('ERROR: Invalid Gemini API key detected.');
  console.error('Please replace the placeholder in your .env file with a valid API key.');
}

const genAI = new GoogleGenerativeAI(apiKey);
const MODEL_NAME = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

interface PDFContent { str: string; [key: string]: any; }
interface PDFPage { content: PDFContent[]; [key: string]: any; }

export interface DocumentMetadata {
  title: string;
  description: string;
  suggestedTags: string[];
  detectedSemester?: string;
  confidence: 'high' | 'medium' | 'low';
}

// MIME types that the Gemini API can natively process via inline data
const GEMINI_NATIVE_MIME_TYPES: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.txt': 'text/plain',
  '.md': 'text/plain',
  '.csv': 'text/plain',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
};

export class GeminiService {
  private pdfExtract;
  private apiKeyValid: boolean;

  constructor() {
    this.pdfExtract = new PDFExtract();
    this.apiKeyValid = !!apiKey && !isPlaceholder;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Private Helpers
  // ─────────────────────────────────────────────────────────────────────────

  /** Get extension from a path or URL (strips query strings). */
  private getExtension(filePathOrUrl: string): string {
    try {
      if (filePathOrUrl.startsWith('http://') || filePathOrUrl.startsWith('https://')) {
        return path.extname(new URL(filePathOrUrl).pathname).toLowerCase();
      }
    } catch { /* fall through */ }
    return path.extname(filePathOrUrl).toLowerCase();
  }

  /** Download a remote URL to a local file, following redirects (up to 5). */
  private downloadFile(url: string, destPath: string, redirectCount = 0): Promise<void> {
    return new Promise((resolve, reject) => {
      if (redirectCount > 5) return reject(new Error('Too many redirects'));

      const protocol = url.startsWith('https') ? https : http;
      const file = fs.createWriteStream(destPath);

      protocol.get(url, (response) => {
        if (response.statusCode && [301, 302, 307, 308].includes(response.statusCode) && response.headers.location) {
          file.close();
          fs.unlink(destPath, () => { /* ignore */ });
          resolve(this.downloadFile(response.headers.location!, destPath, redirectCount + 1));
          return;
        }
        if (response.statusCode !== 200) {
          file.close();
          fs.unlink(destPath, () => { /* ignore */ });
          reject(new Error(`HTTP ${response.statusCode} downloading ${url}`));
          return;
        }
        response.pipe(file);
        file.on('finish', () => { file.close(); resolve(); });
      }).on('error', (err) => { file.close(); fs.unlink(destPath, () => { /* ignore */ }); reject(err); });
    });
  }

  /**
   * Fetch a URL and return its binary content as a base64 string + mime type.
   * Used to pass files directly to the Gemini API without needing local temp files.
   */
  private async fetchAsBase64(url: string): Promise<{ base64: string; mimeType: string } | null> {
    return new Promise((resolve) => {
      const protocol = url.startsWith('https') ? https : http;
      const chunks: Buffer[] = [];

      const handleResponse = (response: any, redirectCount = 0): void => {
        if (redirectCount > 5) { resolve(null); return; }
        if (response.statusCode && [301, 302, 307, 308].includes(response.statusCode) && response.headers.location) {
          const proto2 = response.headers.location.startsWith('https') ? https : http;
          proto2.get(response.headers.location, (r: any) => handleResponse(r, redirectCount + 1)).on('error', () => resolve(null));
          return;
        }
        if (response.statusCode !== 200) { resolve(null); return; }
        const mimeType = (response.headers['content-type'] || 'application/octet-stream').split(';')[0].trim();
        response.on('data', (chunk: Buffer) => chunks.push(chunk));
        response.on('end', () => {
          const buffer = Buffer.concat(chunks);
          resolve({ base64: buffer.toString('base64'), mimeType });
        });
        response.on('error', () => resolve(null));
      };

      protocol.get(url, handleResponse).on('error', () => resolve(null));
    });
  }

  /**
   * Generate a summary directly from a URL using the Gemini API.
   * For supported types (PDF, images, text), passes the file data inline.
   * For unsupported types (PPTX, DOCX, etc.), uses text extraction + summarization.
   */
  async summarizeFileUrl(fileUrl: string): Promise<string> {
    if (!this.apiKeyValid) {
      return 'Summary unavailable (Gemini API key not configured).';
    }

    const ext = this.getExtension(fileUrl);
    const geminiMime = GEMINI_NATIVE_MIME_TYPES[ext];

    try {
      if (geminiMime && fileUrl.startsWith('http')) {
        // ── Strategy 1: Fetch the file and send as inline data to Gemini ──
        console.log(`Fetching ${ext} file for Gemini inline processing: ${fileUrl}`);
        const fetched = await this.fetchAsBase64(fileUrl);

        if (fetched) {
          const model = genAI.getGenerativeModel({ model: MODEL_NAME });
          const result = await model.generateContent([
            {
              inlineData: {
                data: fetched.base64,
                mimeType: fetched.mimeType || geminiMime,
              },
            },
            'Please provide a comprehensive academic summary of this document. Include: key topics covered, main concepts, important points, and any notable conclusions. Format as clear bullet points.',
          ]);
          const text = result.response?.text?.()?.trim();
          if (text) {
            console.log('Gemini inline processing succeeded.');
            return text;
          }
        }
      }

      // ── Strategy 2: Extract text locally and summarize ──
      console.log(`Falling back to local text extraction for: ${fileUrl}`);
      const text = await this.extractTextFromFile(fileUrl);
      if (text && text.trim().length > 30) {
        return await this.summarizeText(text);
      }

      // ── Strategy 3: Summarize from filename/context only ──
      const fileName = fileUrl.split('/').pop()?.split('?')[0] || 'Unknown file';
      return await this.summarizeText(
        `Document file: "${fileName}". The file content could not be extracted. Please provide a brief note that the summary could not be generated for this file type.`
      );
    } catch (error) {
      console.error('Error in summarizeFileUrl:', error);
      return this.generateFallbackSummary('');
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Public Methods
  // ─────────────────────────────────────────────────────────────────────────

  async summarizeText(text: string): Promise<string> {
    try {
      if (!this.apiKeyValid) return this.generateFallbackSummary(text);

      const prompt = `Summarize the following academic content into clear key points and main ideas:\n\n${text}`;
      const model = genAI.getGenerativeModel({ model: MODEL_NAME });
      const result = await model.generateContent(prompt);
      return result.response?.text?.()?.trim() || this.generateFallbackSummary(text);
    } catch (error) {
      console.error('Error generating summary:', error);
      return this.generateFallbackSummary(text);
    }
  }

  async extractDocumentMetadata(text: string, fileName: string): Promise<DocumentMetadata> {
    try {
      if (!this.apiKeyValid) return this.generateFallbackMetadata(text, fileName);

      const prompt = `You are a document analysis AI. Analyze the following document content and extract metadata.

Document Name: ${fileName}
Document Content (first 3000 chars):
${text.substring(0, 3000)}

Return ONLY a valid JSON object:
{
  "title": "concise title (50 chars max)",
  "description": "2-3 sentence description",
  "suggestedTags": ["tag1", "tag2", "tag3"],
  "detectedSemester": "Sem X or null",
  "confidence": "high|medium|low"
}`;

      const model = genAI.getGenerativeModel({ model: MODEL_NAME });
      const result = await model.generateContent(prompt);
      const response = result.response?.text?.() || '';
      const jsonMatch = response.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        const metadata = JSON.parse(jsonMatch[0]);
        return {
          title: metadata.title || this.generateTitleFromFileName(fileName),
          description: metadata.description || 'No description available',
          suggestedTags: Array.isArray(metadata.suggestedTags) ? metadata.suggestedTags : [],
          detectedSemester: metadata.detectedSemester || undefined,
          confidence: metadata.confidence || 'medium',
        };
      }
      return this.generateFallbackMetadata(text, fileName);
    } catch (error) {
      console.error('Error extracting document metadata:', error);
      return this.generateFallbackMetadata(text, fileName);
    }
  }

  /**
   * Extract text from a local file path or remote URL.
   * For remote URLs, downloads to a temp file first.
   */
  async extractTextFromFile(filePath: string): Promise<string> {
    let tempFilePath: string | null = null;
    try {
      if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
        console.log(`Downloading remote file for text extraction: ${filePath}`);
        const tempDir = path.join(process.cwd(), 'uploads', 'tmp');
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

        const fileExtension = this.getExtension(filePath) || '.bin';
        tempFilePath = path.join(tempDir, `temp-${Date.now()}-${Math.round(Math.random() * 1e9)}${fileExtension}`);

        await this.downloadFile(filePath, tempFilePath);
        console.log(`Downloaded to temp: ${tempFilePath}`);
        filePath = tempFilePath;
      }

      const ext = this.getExtension(filePath);
      let text = '';

      if (ext === '.pdf') {
        text = await this.extractTextFromPDF(filePath);
      } else if (['.txt', '.csv', '.md', '.rtf'].includes(ext)) {
        text = fs.readFileSync(filePath, 'utf8');
      } else if (['.docx', '.doc'].includes(ext)) {
        text = await this.extractTextFromWord(filePath);
      } else if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tif', '.tiff', '.svg'].includes(ext)) {
        const name = path.basename(filePath);
        text = `Image file: ${name}. Visual content — text extraction not available.`;
      } else if (['.ppt', '.pptx', '.xls', '.xlsx', '.ods', '.odp', '.odt'].includes(ext)) {
        const name = path.basename(filePath);
        text = `Office document: ${name} (${ext}). Detailed text extraction not available for this format.`;
      } else {
        text = `File: ${path.basename(filePath)} (${ext}).`;
      }

      if (tempFilePath && fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
      return text;
    } catch (error) {
      console.error('Error extracting text from file:', error);
      if (tempFilePath && fs.existsSync(tempFilePath)) {
        try { fs.unlinkSync(tempFilePath); } catch { /* ignore */ }
      }
      return '';
    }
  }

  /** Legacy method — kept for backward compatibility */
  async summarizeFile(filePath: string): Promise<string> {
    try {
      // If it's a URL, use the smarter URL-based summarizer
      if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
        return await this.summarizeFileUrl(filePath);
      }
      // For local files, extract text first
      const text = await this.extractTextFromFile(filePath);
      return await this.summarizeText(text);
    } catch (error) {
      console.error('Error summarizing file:', error);
      return 'Summary unavailable (file could not be processed).';
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Text Extraction Helpers
  // ─────────────────────────────────────────────────────────────────────────

  private async extractTextFromPDF(filePath: string): Promise<string> {
    try {
      const data = await this.pdfExtract.extract(filePath, {});
      return data.pages.map((page: PDFPage) =>
        page.content.map((item: PDFContent) => item.str).join(' ')
      ).join('\n');
    } catch (error) {
      console.error('Error extracting PDF:', error);
      throw error;
    }
  }

  private async extractTextFromWord(filePath: string): Promise<string> {
    try {
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value;
    } catch (error) {
      console.error('Error extracting Word doc:', error);
      throw error;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Fallback Generators
  // ─────────────────────────────────────────────────────────────────────────

  private generateFallbackMetadata(text: string, fileName: string): DocumentMetadata {
    return {
      title: this.generateTitleFromFileName(fileName),
      description: text.split(/[.!?]/).filter(s => s.trim().length > 10).slice(0, 2).join('. ') || 'Document uploaded.',
      suggestedTags: this.extractKeywordsFromText(text),
      confidence: 'low',
    };
  }

  private generateTitleFromFileName(fileName: string): string {
    return fileName
      .replace(/\.[^/.]+$/, '')
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
  }

  private extractKeywordsFromText(text: string): string[] {
    const commonTerms = [
      'algorithm', 'database', 'network', 'programming', 'mathematics',
      'physics', 'chemistry', 'biology', 'history', 'economics',
      'literature', 'computer science', 'engineering', 'statistics',
    ];
    const lower = text.toLowerCase();
    return commonTerms.filter(t => lower.includes(t)).slice(0, 3);
  }

  private generateFallbackSummary(text: string): string {
    if (!text?.trim()) return 'Summary unavailable (no extractable content).';

    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    const bulletLike = lines.filter(l => /^[-•\u2022\u25CF\u25E6\u2219]|^\d+\.|^[a-zA-Z]\)/.test(l));
    if (bulletLike.length >= 3) {
      let out = '';
      for (const l of bulletLike) {
        if ((out + ' ' + l).trim().length > FALLBACK_MAX_CHARS) break;
        out = (out ? out + ' ' : '') + l;
      }
      return `Summary (fallback): ${out}${bulletLike.join(' ').length > out.length ? '…' : ''}`;
    }

    const sentences = text.replace(/\s+/g, ' ').match(/[^.!?]+[.!?]/g) || [text.trim()];
    let composed = '';
    for (const s of sentences) {
      if ((composed + ' ' + s).trim().length > FALLBACK_MAX_CHARS) break;
      composed = (composed ? composed + ' ' : '') + s.trim();
    }
    return `Summary (fallback): ${composed}${text.replace(/\s+/g, ' ').length > composed.length ? '…' : ''}`;
  }
}

export const geminiService = new GeminiService();