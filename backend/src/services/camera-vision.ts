/**
 * Camera Vision Service - Real-time visual understanding
 * Uses Ollama vision models (llava) or Gemini Vision
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import axios from 'axios';

const execAsync = promisify(exec);

interface VisionResponse {
  description: string;
  objects: string[];
  text?: string;
  confidence: number;
}

export class CameraVision {
  private visionProvider: string;
  private visionModel: string;
  private ollamaBaseUrl: string;
  private geminiApiKey: string | undefined;
  private tempDir: string;
  private isEnabled: boolean;

  constructor() {
    this.visionProvider = process.env.VISION_PROVIDER || 'ollama';
    this.visionModel = process.env.VISION_MODEL || 'llava:latest';
    this.ollamaBaseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    this.geminiApiKey = process.env.GEMINI_API_KEY;
    this.tempDir = path.join(process.cwd(), 'temp');
    this.isEnabled = process.env.VISION_ENABLED === 'true';
    
    console.log(`👁️  Camera Vision initialized (provider: ${this.visionProvider})`);
  }

  /**
   * Initialize vision system
   */
  async initialize(): Promise<void> {
    // Create temp directory
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create temp directory:', error);
    }

    // Check if vision model is available
    if (this.visionProvider === 'ollama') {
      const hasModel = await this.checkVisionModel();
      if (hasModel) {
        console.log('✅ Camera vision ready');
      } else {
        console.log('⚠️  Camera vision not available - no vision model');
      }
    } else {
      console.log('⚠️  Camera vision disabled - provider not ollama');
      this.isEnabled = false;
    }
  }

  /**
   * Check if Ollama vision model is available
   */
  private async checkVisionModel(): Promise<boolean> {
    try {
      const { stdout } = await execAsync('ollama list');
      const hasLlava = stdout.toLowerCase().includes('llava');
      const hasVision = stdout.toLowerCase().includes('vision');
      
      if (!hasLlava && !hasVision) {
        console.log('⚠️  No vision model found!');
        console.log('📥 Install with: ollama pull llava');
        this.isEnabled = false;
        return false;
      }
      
      console.log('✅ Vision model available');
      this.isEnabled = true; // Enable vision when model is found
      return true;
    } catch (error) {
      console.error('Failed to check vision model:', error);
      this.isEnabled = false;
      return false;
    }
  }

  /**
   * Capture image from camera
   */
  async captureFromCamera(): Promise<string> {
    const filename = `camera_${Date.now()}.jpg`;
    const filepath = path.join(this.tempDir, filename);

    try {
      // Use imagesnap (Mac) to capture from camera
      // Install with: brew install imagesnap
      await execAsync(`imagesnap -q "${filepath}"`);
      console.log('📷 Camera image captured');
      return filepath;
    } catch (error: any) {
      // Fallback: Use screenshot if camera fails
      console.log('⚠️  Camera capture failed, using screenshot');
      return await this.captureScreenshot();
    }
  }

  /**
   * Capture screenshot as fallback
   */
  async captureScreenshot(): Promise<string> {
    const filename = `screen_${Date.now()}.png`;
    const filepath = path.join(this.tempDir, filename);

    try {
      await execAsync(`screencapture -x "${filepath}"`);
      console.log('📸 Screenshot captured');
      return filepath;
    } catch (error) {
      throw new Error('Failed to capture image');
    }
  }

  /**
   * Analyze image with vision AI
   */
  async analyzeImage(imagePath: string, question?: string): Promise<VisionResponse> {
    if (!this.isEnabled) {
      throw new Error('Vision system is disabled');
    }

    // Read image as base64
    const imageData = await fs.readFile(imagePath);
    const base64Image = imageData.toString('base64');

    if (this.visionProvider === 'ollama') {
      return await this.analyzeWithOllama(base64Image, question);
    } else if (this.visionProvider === 'gemini' && this.geminiApiKey) {
      return await this.analyzeWithGemini(base64Image, question);
    } else {
      // Fallback: Use regular text model with description
      return await this.analyzeWithTextModel(imagePath, question);
    }
  }

  /**
   * Analyze with Ollama vision model (llava)
   */
  private async analyzeWithOllama(base64Image: string, question?: string): Promise<VisionResponse> {
    try {
      const prompt = question 
        ? `Answer this question in ENGLISH: ${question}. Be specific and detailed.`
        : 'Describe what you see in this image in detail in ENGLISH.';
      
      const response = await axios.post(
        `${this.ollamaBaseUrl}/api/generate`,
        {
          model: 'llava',  // Or llava:13b, llava:34b
          prompt: prompt,
          images: [base64Image],
          stream: false
        },
        { timeout: 60000 } // 60 seconds for vision analysis
      );

      const description = response.data.response;

      return {
        description: description,
        objects: this.extractObjects(description),
        confidence: 0.85
      };
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error('Vision model not found. Install with: ollama pull llava');
      }
      throw new Error(`Vision analysis failed: ${error.message}`);
    }
  }

  /**
   * Analyze with Gemini Vision
   */
  private async analyzeWithGemini(base64Image: string, question?: string): Promise<VisionResponse> {
    if (!this.geminiApiKey || this.geminiApiKey === 'your_gemini_key_here') {
      throw new Error('Gemini API key not configured');
    }

    try {
      const prompt = question 
        ? `Answer this question in ENGLISH: ${question}. Be specific and detailed.`
        : 'Describe what you see in this image in detail in ENGLISH.';
      
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent?key=${this.geminiApiKey}`,
        {
          contents: [{
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: 'image/jpeg',
                  data: base64Image
                }
              }
            ]
          }]
        },
        { timeout: 30000 }
      );

      const description = response.data.candidates[0].content.parts[0].text;

      return {
        description: description,
        objects: this.extractObjects(description),
        confidence: 0.9
      };
    } catch (error: any) {
      throw new Error(`Gemini vision failed: ${error.message}`);
    }
  }

  /**
   * Fallback: Use text model with generic description
   */
  private async analyzeWithTextModel(imagePath: string, question?: string): Promise<VisionResponse> {
    return {
      description: 'Vision model not available. Install with: ollama pull llava',
      objects: [],
      confidence: 0
    };
  }

  /**
   * Extract object names from description and detect gestures
   */
  private extractObjects(description: string): string[] {
    // Enhanced extraction - look for people, gestures, and objects
    const commonObjects = [
      'person', 'people', 'man', 'woman', 'child', 'face', 'head',
      'hand', 'hands', 'finger', 'fingers', 'arm', 'arms',
      'wave', 'waving', 'greeting', 'hello', 'hi',
      'thumbs up', 'peace sign', 'pointing', 'gesture',
      'smile', 'smiling', 'happy', 'sad', 'angry',
      'laptop', 'computer', 'phone', 'mobile', 'tablet',
      'book', 'pen', 'paper', 'desk', 'chair', 'table',
      'cup', 'glass', 'bottle', 'food', 'plate',
      'car', 'vehicle', 'bike', 'bicycle',
      'dog', 'cat', 'animal', 'bird',
      'tree', 'plant', 'flower', 'building', 'house',
      'screen', 'monitor', 'keyboard', 'mouse'
    ];

    const found: string[] = [];
    const lowerDesc = description.toLowerCase();

    for (const obj of commonObjects) {
      if (lowerDesc.includes(obj)) {
        found.push(obj);
      }
    }

    return [...new Set(found)];
  }

  /**
   * Detect specific gestures from camera
   */
  async detectGesture(): Promise<{
    gesture: string | null;
    confidence: number;
    description: string;
  }> {
    try {
      // Capture image
      const imagePath = await this.captureFromCamera();

      // Analyze for gestures specifically
      const result = await this.analyzeImage(imagePath, 
        'Is the person waving their hand, giving thumbs up, making peace sign, or any other hand gesture? Describe the gesture clearly.'
      );

      // Clean up temp file
      await fs.unlink(imagePath).catch(() => {});

      const description = result.description.toLowerCase();
      let gesture = null;
      let confidence = 0;

      // Detect specific gestures
      if (description.includes('wave') || description.includes('waving')) {
        gesture = 'wave';
        confidence = 0.8;
      } else if (description.includes('thumbs up') || description.includes('thumb up')) {
        gesture = 'thumbs_up';
        confidence = 0.8;
      } else if (description.includes('peace') || description.includes('victory')) {
        gesture = 'peace';
        confidence = 0.8;
      } else if (description.includes('pointing')) {
        gesture = 'pointing';
        confidence = 0.7;
      } else if (description.includes('hello') || description.includes('greeting')) {
        gesture = 'greeting';
        confidence = 0.7;
      }

      return {
        gesture,
        confidence,
        description: result.description
      };
    } catch (error: any) {
      console.error('Gesture detection error:', error);
      return {
        gesture: null,
        confidence: 0,
        description: `Error detecting gesture: ${error.message}`
      };
    }
  }

  /**
   * Check if user is present in camera view
   */
  async detectUserPresence(): Promise<{
    userPresent: boolean;
    confidence: number;
    description: string;
  }> {
    try {
      // Capture image
      const imagePath = await this.captureFromCamera();

      // Analyze for person detection
      const result = await this.analyzeImage(imagePath, 
        'Is there a person visible in this image? Describe if you can see a person, their face, or any part of them.'
      );

      // Clean up temp file
      await fs.unlink(imagePath).catch(() => {});

      const description = result.description.toLowerCase();
      const userPresent = description.includes('person') || 
                         description.includes('people') || 
                         description.includes('man') || 
                         description.includes('woman') || 
                         description.includes('face') ||
                         description.includes('human');

      return {
        userPresent,
        confidence: userPresent ? 0.8 : 0.2,
        description: result.description
      };
    } catch (error: any) {
      console.error('User presence detection error:', error);
      return {
        userPresent: false,
        confidence: 0,
        description: `Error detecting user: ${error.message}`
      };
    }
  }

  /**
   * Answer question about camera view
   */
  async answerQuestion(question: string): Promise<string> {
    try {
      // Capture image
      const imagePath = await this.captureFromCamera();

      // Analyze with question
      const result = await this.analyzeImage(imagePath, question);

      // Clean up temp file
      await fs.unlink(imagePath).catch(() => {});

      return result.description;
    } catch (error: any) {
      console.error('Vision error:', error);
      throw error;
    }
  }

  /**
   * Get current camera view description
   */
  async describeCurrentView(): Promise<string> {
    return await this.answerQuestion('Describe what you see in detail.');
  }

  /**
   * Check if vision system is ready
   */
  isReady(): boolean {
    return this.isEnabled;
  }
}

// Export singleton
export const cameraVision = new CameraVision();
