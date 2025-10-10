import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { PDFExtract } from 'pdf.js-extract';
import mammoth from 'mammoth';

// Load environment variables
dotenv.config();

// Initialize the Google Generative AI client
const apiKey = process.env.GEMINI_API_KEY || '';
// Configure fallback summary length (characters)
const FALLBACK_MAX_CHARS = Number(process.env.GEMINI_FALLBACK_MAX_CHARS || 1200);

// Enhanced debugging for API key issues
console.log('ENV DEBUG: First 5 chars of API key:', apiKey.substring(0, 5));
console.log('ENV DEBUG: API key length:', apiKey.length);
console.log('ENV DEBUG: Contains placeholder?', apiKey.includes('your-gemini-api-key-here'));

// Check if the API key is missing or still has the placeholder value
const isPlaceholder = apiKey.includes('your-gemini-api-key-here');
if (!apiKey || isPlaceholder) {
  console.error('ERROR: Invalid Gemini API key detected.');
  console.error('Please replace the placeholder in your .env file with a valid API key.');
  console.error('Get a key from: https://makersuite.google.com/app/apikey');
}

const genAI = new GoogleGenerativeAI(apiKey);

// Default model to use for summarization (override via env)
const MODEL_NAME = process.env.GEMINI_MODEL || "gemini-2.5-flash";

interface PDFContent {
  str: string;
  [key: string]: any;
}

interface PDFPage {
  content: PDFContent[];
  [key: string]: any;
}

export class GeminiService {
  private pdfExtract;
  private apiKeyValid: boolean;
  
  constructor() {
    this.pdfExtract = new PDFExtract();
    this.apiKeyValid = !!apiKey && !isPlaceholder; // Track if we have a valid API key
  }

  /**
   * Generate a summary from text content
   * @param text The text content to summarize
   * @returns A summarized version of the text
   */
  async summarizeText(text: string): Promise<string> {
    try {
      // Check if API key is valid before making the request
      if (!this.apiKeyValid) {
        console.warn('Gemini summarizeText: API key invalid or missing. Returning fallback summary.');
        return this.generateFallbackSummary(text);
      }
      
      const prompt = `Summarize the following text into key points and main ideas. Focus on academic content and key concepts:
      
${text}`;

      const model = genAI.getGenerativeModel({ model: MODEL_NAME });
      const result = await model.generateContent(prompt);
      const textOut = result.response?.text?.() || '';
      return textOut.toString().trim();
    } catch (error) {
      console.error('Error generating summary:', error);
      return this.generateFallbackSummary(text);
    }
  }

  /**
   * Extract text content from a file based on its type
   * @param filePath Path to the file
   * @returns Extracted text content
   */
  async extractTextFromFile(filePath: string): Promise<string> {
    try {
      const fileExtension = path.extname(filePath).toLowerCase();
      
      if (fileExtension === '.pdf') {
        return await this.extractTextFromPDF(filePath);
      } else if (fileExtension === '.txt') {
        return fs.readFileSync(filePath, 'utf8');
      } else if (['.docx', '.doc'].includes(fileExtension)) {
        return await this.extractTextFromWord(filePath);
      } else if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tif', '.tiff'].includes(fileExtension)) {
        // Image formats: no OCR implemented; return a placeholder to allow fallback summarization
        const name = path.basename(filePath);
        console.warn(`Image file provided without OCR support: ${name}`);
        return `Image file (${name}). Text extraction is not supported in this environment.`;
      } else if (['.ppt', '.pptx', '.xls', '.xlsx'].includes(fileExtension)) {
        console.warn(`Office document type not implemented for extraction: ${fileExtension}`);
        return `Office document (${fileExtension}) provided. Text extraction is not implemented.`;
      } else {
        console.warn(`Unsupported file type for extraction: ${fileExtension}`);
        return `Unsupported file type (${fileExtension}).`;
      }
    } catch (error) {
      console.error('Error extracting text from file:', error);
      // Return empty to let caller produce a generic fallback summary instead of failing the flow
      return '';
    }
  }

  /**
   * Extract text from a PDF file
   * @param filePath Path to the PDF file
   * @returns Extracted text content
   */
  private async extractTextFromPDF(filePath: string): Promise<string> {
    try {
      const data = await this.pdfExtract.extract(filePath, {});
      return data.pages.map((page: PDFPage) => 
        page.content.map((item: PDFContent) => item.str).join(' ')
      ).join('\n');
    } catch (error) {
      console.error('Error extracting text from PDF:', error);
      throw new Error('Failed to extract text from PDF');
    }
  }

  /**
   * Extract text from a Word document
   * @param filePath Path to the Word file
   * @returns Extracted text content
   */
  private async extractTextFromWord(filePath: string): Promise<string> {
    try {
      console.log(`Extracting text from Word document: ${filePath}`);
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value;
    } catch (error) {
      console.error('Error extracting text from Word document:', error);
      throw new Error('Failed to extract text from Word document');
    }
  }

  /**
   * Generate a summary from a file
   * @param filePath Path to the file to summarize
   * @returns A summarized version of the file content
   */
  async summarizeFile(filePath: string): Promise<string> {
    try {
      const text = await this.extractTextFromFile(filePath);
      return await this.summarizeText(text);
    } catch (error) {
      console.error('Error summarizing file:', error);
      // Fall back to a generic message if extraction or summarization fails
      return 'Summary unavailable (AI service not configured or file could not be processed).';
    }
  }

  /**
   * Create a lightweight fallback summary when AI is unavailable.
   */
  private generateFallbackSummary(text: string): string {
    if (!text || text.trim().length === 0) {
      return 'Summary unavailable (no extractable content).';
    }
    // Try to extract a few bullet/numbered lines if present
    const lines = text
      .split(/\r?\n/)
      .map(l => l.trim())
      .filter(l => l.length > 0);
    const bulletLike = lines.filter(l => /^[-•\u2022\u25CF\u25E6\u2219]|^\d+\.|^[a-zA-Z]\)/.test(l));
    if (bulletLike.length >= 3) {
      let out = '';
      for (const l of bulletLike) {
        if ((out + ' ' + l).trim().length > FALLBACK_MAX_CHARS) break;
        out = (out ? out + ' ' : '') + l;
      }
      return `Summary (fallback): ${out}${bulletLike.join(' ').length > out.length ? '…' : ''}`;
    }
    // Otherwise progressively add sentences until limit
    const sentences = text
      .replace(/\s+/g, ' ')
      .match(/[^.!?]+[.!?]/g) || [text.trim()];
    let composed = '';
    for (const s of sentences) {
      if ((composed + ' ' + s).trim().length > FALLBACK_MAX_CHARS) break;
      composed = (composed ? composed + ' ' : '') + s.trim();
    }
    return `Summary (fallback): ${composed}${text.replace(/\s+/g, ' ').length > composed.length ? '…' : ''}`;
  }
}

// Export a singleton instance of the service
export const geminiService = new GeminiService(); 