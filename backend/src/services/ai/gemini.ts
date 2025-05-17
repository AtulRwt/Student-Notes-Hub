import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { JSDOM } from 'jsdom';
import { PDFExtract } from 'pdf.js-extract';
import mammoth from 'mammoth';

// Load environment variables
dotenv.config();

// Initialize the Google Generative AI client
const apiKey = process.env.GEMINI_API_KEY || '';

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

// Default model to use for summarization
const MODEL_NAME = "gemini-1.5-flash";

interface PDFContent {
  str: string;
  [key: string]: any;
}

interface PDFPage {
  content: PDFContent[];
  [key: string]: any;
}

export class GeminiService {
  private model;
  private pdfExtract;
  private apiKeyValid: boolean;
  
  constructor() {
    // Initialize the model
    this.model = genAI.getGenerativeModel({ model: MODEL_NAME });
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
        throw new Error('Invalid Gemini API key. Please replace the placeholder in your .env file with a valid API key from https://makersuite.google.com/app/apikey');
      }
      
      const prompt = `Summarize the following text into key points and main ideas. Focus on academic content and key concepts:
      
${text}`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error generating summary:', error);
      throw new Error('Failed to generate summary: ' + (error instanceof Error ? error.message : 'Unknown error'));
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
      } else if (['.ppt', '.pptx', '.xls', '.xlsx'].includes(fileExtension)) {
        throw new Error('Office document processing not implemented for this file type');
      } else {
        throw new Error(`Unsupported file type: ${fileExtension}`);
      }
    } catch (error) {
      console.error('Error extracting text from file:', error);
      throw new Error('Failed to extract text from file');
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
      throw new Error('Failed to summarize file');
    }
  }
}

// Export a singleton instance of the service
export const geminiService = new GeminiService(); 