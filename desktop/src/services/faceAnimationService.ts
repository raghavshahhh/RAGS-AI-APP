/**
 * Face Animation Service
 * Connects 3D face with backend TTS, voice pipeline, and emotion detection
 */

import axios from 'axios';

const BACKEND_URL = 'http://localhost:3000';

export interface EmotionData {
  emotion: 'happy' | 'sad' | 'surprised' | 'thinking' | 'excited' | 'curious' | 'neutral' | 'angry';
  confidence: number;
}

export interface SpeechData {
  text: string;
  audioBuffer?: ArrayBuffer;
  duration?: number;
  phonemes?: string[];
}

export interface VoiceActivityData {
  isListening: boolean;
  isSpeaking: boolean;
  audioLevel: number;
  audioData?: Float32Array;
}

class FaceAnimationService {
  private ws: WebSocket | null = null;
  private audioContext: AudioContext | null = null;
  private audioAnalyser: AnalyserNode | null = null;
  private currentEmotion: EmotionData = { emotion: 'neutral', confidence: 1.0 };
  private voiceActivity: VoiceActivityData = {
    isListening: false,
    isSpeaking: false,
    audioLevel: 0
  };

  // Event listeners
  private emotionListeners: ((emotion: EmotionData) => void)[] = [];
  private voiceListeners: ((voice: VoiceActivityData) => void)[] = [];
  private speechListeners: ((speech: SpeechData) => void)[] = [];

  constructor() {
    this.initializeAudioContext();
  }

  /**
   * Initialize Web Audio API for audio analysis
   */
  private initializeAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.audioAnalyser = this.audioContext.createAnalyser();
      this.audioAnalyser.fftSize = 256;
      console.log('✅ Audio context initialized');
    } catch (error) {
      console.error('Failed to initialize audio context:', error);
    }
  }

  /**
   * Connect to backend WebSocket for real-time updates
   */
  connectToBackend() {
    // WebSocket is optional - gracefully skip if not available
    try {
      this.ws = new WebSocket('ws://localhost:3000');

      this.ws.onopen = () => {
        console.log('✅ WebSocket connected (optional feature)');
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleBackendMessage(data);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.debug('WebSocket unavailable (optional feature)');
      };

      this.ws.onclose = () => {
        console.debug('WebSocket closed (optional feature)');
        // Don't auto-reconnect - WebSocket is optional
      };
    } catch (error) {
      console.debug('WebSocket not available (optional feature)');
    }
  }

  /**
   * Handle messages from backend
   */
  private handleBackendMessage(data: any) {
    switch (data.type) {
      case 'emotion':
        this.updateEmotion(data.emotion, data.confidence);
        break;
      case 'speaking_start':
        this.updateVoiceActivity({ isSpeaking: true });
        break;
      case 'speaking_end':
        this.updateVoiceActivity({ isSpeaking: false });
        break;
      case 'listening_start':
        this.updateVoiceActivity({ isListening: true });
        break;
      case 'listening_end':
        this.updateVoiceActivity({ isListening: false });
        break;
      case 'speech':
        this.notifySpeech(data);
        break;
      case 'audio_data':
        this.processAudioData(data.audioData);
        break;
    }
  }

  /**
   * Update emotion state
   */
  updateEmotion(emotion: string, confidence: number = 1.0) {
    this.currentEmotion = {
      emotion: emotion as any,
      confidence
    };
    this.emotionListeners.forEach(listener => listener(this.currentEmotion));
  }

  /**
   * Update voice activity
   */
  updateVoiceActivity(update: Partial<VoiceActivityData>) {
    this.voiceActivity = {
      ...this.voiceActivity,
      ...update
    };
    this.voiceListeners.forEach(listener => listener(this.voiceActivity));
  }

  /**
   * Process audio data for lip-sync
   */
  private processAudioData(audioData: number[]) {
    if (!this.audioAnalyser) return;

    const dataArray = new Float32Array(audioData);
    
    // Calculate audio level
    const sum = dataArray.reduce((acc, val) => acc + Math.abs(val), 0);
    const audioLevel = sum / dataArray.length;

    this.updateVoiceActivity({
      audioLevel,
      audioData: dataArray
    });
  }

  /**
   * Notify speech listeners
   */
  private notifySpeech(speechData: SpeechData) {
    this.speechListeners.forEach(listener => listener(speechData));
  }

  /**
   * Analyze text for emotion detection
   */
  async analyzeTextEmotion(text: string): Promise<EmotionData> {
    try {
      const response = await axios.post(`${BACKEND_URL}/api/analyze-emotion`, { text });
      const emotion = response.data.emotion;
      this.updateEmotion(emotion.type, emotion.confidence);
      return emotion;
    } catch (error) {
      console.error('Failed to analyze emotion:', error);
      return { emotion: 'neutral', confidence: 0.5 };
    }
  }

  /**
   * Get phonemes from text for lip-sync
   */
  async getPhonemes(text: string): Promise<string[]> {
    try {
      const response = await axios.post(`${BACKEND_URL}/api/text-to-phonemes`, { text });
      return response.data.phonemes;
    } catch (error) {
      console.error('Failed to get phonemes:', error);
      // Fallback: simple phoneme estimation
      return this.estimatePhonemes(text);
    }
  }

  /**
   * Simple phoneme estimation (fallback)
   */
  private estimatePhonemes(text: string): string[] {
    const phonemes: string[] = [];
    const words = text.toLowerCase().split(' ');

    for (const word of words) {
      for (const char of word) {
        if ('aeiou'.includes(char)) {
          phonemes.push(char.toUpperCase());
        } else if ('bpmw'.includes(char)) {
          phonemes.push('M');
        } else if ('fv'.includes(char)) {
          phonemes.push('F');
        } else if ('sz'.includes(char)) {
          phonemes.push('S');
        } else {
          phonemes.push('rest');
        }
      }
      phonemes.push('rest');
    }

    return phonemes;
  }

  /**
   * Start listening for voice input
   */
  async startListening() {
    try {
      await axios.post(`${BACKEND_URL}/api/voice/start-listening`);
      this.updateVoiceActivity({ isListening: true });
    } catch (error) {
      console.error('Failed to start listening:', error);
    }
  }

  /**
   * Stop listening
   */
  async stopListening() {
    try {
      await axios.post(`${BACKEND_URL}/api/voice/stop-listening`);
      this.updateVoiceActivity({ isListening: false });
    } catch (error) {
      console.error('Failed to stop listening:', error);
    }
  }

  /**
   * Speak text with TTS
   */
  async speak(text: string) {
    try {
      // Analyze emotion from text
      await this.analyzeTextEmotion(text);

      // Get phonemes for lip-sync
      const phonemes = await this.getPhonemes(text);

      // Request TTS from backend
      const response = await axios.post(`${BACKEND_URL}/api/voice/speak`, {
        text,
        phonemes
      }, {
        responseType: 'arraybuffer'
      });

      this.updateVoiceActivity({ isSpeaking: true });

      // Notify speech listeners
      this.notifySpeech({
        text,
        audioBuffer: response.data,
        phonemes
      });

      // Play audio
      if (this.audioContext) {
        const audioBuffer = await this.audioContext.decodeAudioData(response.data);
        const source = this.audioContext.createBufferSource();
        source.buffer = audioBuffer;
        
        // Connect to analyser for real-time audio data
        source.connect(this.audioAnalyser!);
        this.audioAnalyser!.connect(this.audioContext.destination);
        
        source.start(0);
        
        source.onended = () => {
          this.updateVoiceActivity({ isSpeaking: false });
        };

        // Start audio analysis loop
        this.startAudioAnalysis();
      }
    } catch (error) {
      console.error('Failed to speak:', error);
      this.updateVoiceActivity({ isSpeaking: false });
    }
  }

  /**
   * Start real-time audio analysis for lip-sync
   */
  private startAudioAnalysis() {
    if (!this.audioAnalyser) return;

    const bufferLength = this.audioAnalyser.frequencyBinCount;
    const dataArray = new Float32Array(bufferLength);

    const analyze = () => {
      if (!this.voiceActivity.isSpeaking) return;

      this.audioAnalyser!.getFloatTimeDomainData(dataArray);
      this.processAudioData(Array.from(dataArray));

      requestAnimationFrame(analyze);
    };

    analyze();
  }

  /**
   * Event listeners
   */
  onEmotionChange(callback: (emotion: EmotionData) => void) {
    this.emotionListeners.push(callback);
  }

  onVoiceActivityChange(callback: (voice: VoiceActivityData) => void) {
    this.voiceListeners.push(callback);
  }

  onSpeech(callback: (speech: SpeechData) => void) {
    this.speechListeners.push(callback);
  }

  /**
   * Get current state
   */
  getCurrentEmotion(): EmotionData {
    return this.currentEmotion;
  }

  getVoiceActivity(): VoiceActivityData {
    return this.voiceActivity;
  }

  /**
   * Cleanup
   */
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

// Export singleton instance
export const faceAnimationService = new FaceAnimationService();
export default faceAnimationService;

