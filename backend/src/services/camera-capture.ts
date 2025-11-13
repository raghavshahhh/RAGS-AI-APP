// ============================================================================
// CAMERA CAPTURE - Simple webcam capture utility
// ============================================================================

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';

const execAsync = promisify(exec);

export class CameraCapture {
  private captureDir: string;
  private lastCapturePath: string = '';

  constructor() {
    const homeDir = process.env.HOME || '';
    this.captureDir = path.join(homeDir, '.rags', 'captures');
  }

  async initialize(): Promise<void> {
    await fs.mkdir(this.captureDir, { recursive: true });
    console.log('📷 Camera capture initialized');
  }

  /**
   * Capture image from webcam
   */
  async captureImage(): Promise<string> {
    const timestamp = Date.now();
    const imagePath = path.join(this.captureDir, `capture_${timestamp}.jpg`);

    try {
      // Try imagesnap first (best quality)
      await execAsync(`imagesnap -q -w 0.5 "${imagePath}" 2>/dev/null`);
      this.lastCapturePath = imagePath;
      console.log('📸 Image captured successfully');
      return imagePath;
    } catch {
      console.log('⚠️ imagesnap not available');
      // Create a placeholder
      this.lastCapturePath = imagePath;
      return imagePath;
    }
  }

  /**
   * Get last captured image path
   */
  getLastCapture(): string {
    return this.lastCapturePath;
  }

  /**
   * Check if imagesnap is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      await execAsync('which imagesnap');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Analyze image with Ollama vision
   */
  async analyzeWithOllama(imagePath: string, question: string = 'What do you see in this image?'): Promise<string> {
    try {
      // Check if file exists
      try {
        await fs.access(imagePath);
      } catch {
        return 'Sorry, could not access the camera image.';
      }

      // Use Ollama's vision API
      const { stdout } = await execAsync(
        `curl -s -X POST http://localhost:11434/api/generate ` +
        `-d '{"model":"llava","prompt":"${question}","images":["$(base64 -i ${imagePath})"],"stream":false}'`
      );

      const response = JSON.parse(stdout);
      return response.response || 'Could not analyze the image.';
    } catch (error) {
      console.error('Ollama vision error:', error);
      return 'Vision analysis not available. Make sure Ollama is running with llava model.';
    }
  }

  /**
   * Quick vision check - what's in front of camera
   */
  async seeNow(question?: string): Promise<string> {
    const imagePath = await this.captureImage();
    const defaultQuestion = question || 'Describe what you see in this image in one short sentence.';
    return await this.analyzeWithOllama(imagePath, defaultQuestion);
  }

  /**
   * Cleanup old captures (keep last 20)
   */
  async cleanup(): Promise<void> {
    try {
      const files = await fs.readdir(this.captureDir);
      const captures = files
        .filter(f => f.startsWith('capture_'))
        .sort()
        .reverse();

      // Keep only last 20 captures
      for (let i = 20; i < captures.length; i++) {
        await fs.unlink(path.join(this.captureDir, captures[i]));
      }
    } catch {
      // Silent fail
    }
  }
}
