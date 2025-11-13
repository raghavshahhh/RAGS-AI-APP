// ============================================================================
// SCREEN OCR - Read text from screen and analyze context
// ============================================================================

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import Tesseract from 'tesseract.js';

const execAsync = promisify(exec);

interface OCRResult {
  text: string;
  confidence: number;
  words: Array<{
    text: string;
    confidence: number;
  }>;
}

interface ScreenContext {
  activeApp: string;
  screenText: string;
  suggestions: string[];
  category: 'coding' | 'browsing' | 'writing' | 'media' | 'other';
}

export class ScreenOCR {
  private tempDir: string;
  private worker: Tesseract.Worker | null = null;

  constructor() {
    const homeDir = process.env.HOME || '';
    this.tempDir = path.join(homeDir, '.rags', 'temp', 'screenshots');
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
      
      // Initialize Tesseract worker
      this.worker = await Tesseract.createWorker('eng');
      console.log('✅ Screen OCR initialized');
    } catch (error) {
      console.error('Screen OCR init failed:', error);
    }
  }

  /**
   * Take screenshot and read text
   */
  async readScreen(): Promise<OCRResult> {
    try {
      console.log('📸 Taking screenshot...');
      
      const screenshotPath = path.join(this.tempDir, `screen_${Date.now()}.png`);
      
      // Take screenshot using macOS screencapture
      await execAsync(`screencapture -x "${screenshotPath}"`);
      
      // Read text from screenshot
      const result = await this.readImage(screenshotPath);
      
      // Cleanup
      await fs.unlink(screenshotPath).catch(() => {});
      
      return result;
    } catch (error) {
      console.error('Screen reading failed:', error);
      throw error;
    }
  }

  /**
   * Read text from image file
   */
  async readImage(imagePath: string): Promise<OCRResult> {
    if (!this.worker) {
      throw new Error('OCR worker not initialized');
    }

    try {
      console.log('🔍 Reading text from image...');
      
      const { data } = await this.worker.recognize(imagePath);
      
      const words = data.words.map(w => ({
        text: w.text,
        confidence: w.confidence
      }));

      console.log(`✅ OCR complete: ${data.text.substring(0, 50)}...`);
      
      return {
        text: data.text,
        confidence: data.confidence,
        words
      };
    } catch (error) {
      console.error('OCR failed:', error);
      throw error;
    }
  }

  /**
   * Get full screen context (app + text + suggestions)
   */
  async getScreenContext(): Promise<ScreenContext> {
    try {
      // Get active app
      const { stdout: appName } = await execAsync(
        'osascript -e \'tell application "System Events" to get name of first application process whose frontmost is true\''
      );
      const activeApp = appName.trim();

      // Read screen text
      const ocrResult = await this.readScreen();
      const screenText = ocrResult.text;

      // Determine category
      const category = this.categorizeApp(activeApp, screenText);

      // Generate suggestions
      const suggestions = this.generateSuggestions(category, activeApp, screenText);

      console.log(`📊 Screen context: ${activeApp} (${category})`);

      return {
        activeApp,
        screenText,
        suggestions,
        category
      };
    } catch (error) {
      console.error('Failed to get screen context:', error);
      throw error;
    }
  }

  /**
   * Categorize app and content
   */
  private categorizeApp(appName: string, screenText: string): ScreenContext['category'] {
    const lowerApp = appName.toLowerCase();
    const lowerText = screenText.toLowerCase();

    // Coding
    if (lowerApp.includes('code') || lowerApp.includes('terminal') || 
        lowerApp.includes('iterm') || lowerText.includes('function') ||
        lowerText.includes('const') || lowerText.includes('import')) {
      return 'coding';
    }

    // Browsing
    if (lowerApp.includes('safari') || lowerApp.includes('chrome') || 
        lowerApp.includes('firefox') || lowerApp.includes('browser')) {
      return 'browsing';
    }

    // Writing
    if (lowerApp.includes('notes') || lowerApp.includes('word') || 
        lowerApp.includes('pages') || lowerApp.includes('notion')) {
      return 'writing';
    }

    // Media
    if (lowerApp.includes('spotify') || lowerApp.includes('music') || 
        lowerApp.includes('youtube') || lowerApp.includes('vlc')) {
      return 'media';
    }

    return 'other';
  }

  /**
   * Generate smart suggestions based on context
   */
  private generateSuggestions(
    category: ScreenContext['category'],
    appName: string,
    screenText: string
  ): string[] {
    const suggestions: string[] = [];

    switch (category) {
      case 'coding':
        suggestions.push('Search for documentation');
        suggestions.push('Explain this code');
        suggestions.push('Find bugs');
        suggestions.push('Suggest improvements');
        break;

      case 'browsing':
        suggestions.push('Summarize this page');
        suggestions.push('Search related topics');
        suggestions.push('Save this for later');
        suggestions.push('Take notes');
        break;

      case 'writing':
        suggestions.push('Check grammar');
        suggestions.push('Improve writing');
        suggestions.push('Generate ideas');
        suggestions.push('Create outline');
        break;

      case 'media':
        suggestions.push('Play similar music');
        suggestions.push('Create playlist');
        suggestions.push('Find lyrics');
        suggestions.push('Adjust volume');
        break;

      default:
        suggestions.push('What can I help with?');
        suggestions.push('Take a break');
        suggestions.push('Check reminders');
        break;
    }

    return suggestions;
  }

  /**
   * Search for text on screen
   */
  async findTextOnScreen(searchText: string): Promise<boolean> {
    try {
      const result = await this.readScreen();
      return result.text.toLowerCase().includes(searchText.toLowerCase());
    } catch {
      return false;
    }
  }

  /**
   * Cleanup
   */
  async cleanup(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
    }
  }
}

export const screenOCR = new ScreenOCR();
