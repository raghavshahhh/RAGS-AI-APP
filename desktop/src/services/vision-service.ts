/**
 * Vision Service - REAL AI Integration
 * No demo data - All powered by Ollama Vision AI
 */

interface VisionAnalysisResult {
  success: boolean;
  description?: string;
  emotion?: string;
  confidence?: number;
  model?: string;
  error?: string;
  suggestion?: string;
}

interface EmotionAnalysisResult {
  success: boolean;
  emotion?: string;
  confidence?: number;
  analysis?: string;
  error?: string;
}

class VisionService {
  private readonly BACKEND_URL = 'http://localhost:3000/api/v1/vision';

  /**
   * Analyze image with REAL Ollama Vision AI
   * Detects faces, emotions, objects, and scene
   */
  async analyzeImage(imageData: string, prompt?: string): Promise<string> {
    try {
      console.log('🔍 Sending image to Ollama Vision AI for analysis...');

      const response = await fetch(`${this.BACKEND_URL}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: imageData,
          prompt: prompt
        }),
      });

      const data: VisionAnalysisResult = await response.json();

      if (data.success && data.description) {
        console.log('✅ Vision AI analysis complete');
        return data.description;
      }

      // Handle errors
      if (data.error) {
        console.error('❌ Vision AI error:', data.error);

        if (data.suggestion) {
          return `Error: ${data.error}\n\nSuggestion: ${data.suggestion}`;
        }

        return `Vision AI error: ${data.error}`;
      }

      return 'Image analysis failed';
    } catch (error: any) {
      console.error('❌ Vision service error:', error);

      if (error.message?.includes('fetch')) {
        return 'Backend server not running. Please start the backend server.';
      }

      return `Error: ${error.message}`;
    }
  }

  /**
   * Analyze facial emotions from image using REAL AI
   */
  async analyzeEmotion(imageData: string): Promise<EmotionAnalysisResult> {
    try {
      console.log('😊 Analyzing facial emotions with Ollama Vision AI...');

      const response = await fetch(`${this.BACKEND_URL}/analyze-emotion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageData }),
      });

      const data: EmotionAnalysisResult = await response.json();

      if (data.success) {
        console.log(`✅ Detected emotion: ${data.emotion} (${data.confidence})`);
        return data;
      }

      return {
        success: false,
        error: data.error || 'Emotion analysis failed'
      };
    } catch (error: any) {
      console.error('❌ Emotion analysis error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Real-time face tracking for continuous emotion detection
   */
  async trackFace(imageData: string, previousEmotion?: string): Promise<string> {
    try {
      const response = await fetch(`${this.BACKEND_URL}/track-face`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: imageData,
          previousEmotion
        }),
      });

      const data = await response.json();

      if (data.success && data.emotion) {
        return data.emotion;
      }

      return previousEmotion || 'neutral';
    } catch (error) {
      console.error('❌ Face tracking error:', error);
      return previousEmotion || 'neutral';
    }
  }

  /**
   * Capture and analyze image in one call
   */
  async captureAndAnalyze(imageData: string): Promise<{
    image: string;
    description: string;
    emotion?: string;
  }> {
    const description = await this.analyzeImage(imageData);
    const emotionResult = await this.analyzeEmotion(imageData);

    return {
      image: imageData,
      description,
      emotion: emotionResult.emotion
    };
  }

  /**
   * Check if Ollama Vision is available
   */
  async checkAvailability(): Promise<boolean> {
    try {
      const response = await fetch(`${this.BACKEND_URL}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
          prompt: 'test'
        }),
      });

      return response.ok;
    } catch (error) {
      return false;
    }
  }
}

export const visionService = new VisionService();
