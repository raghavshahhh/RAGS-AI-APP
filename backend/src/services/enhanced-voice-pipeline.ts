/**
 * 🎤 ENHANCED VOICE PIPELINE
 * ChatGPT-level voice interaction with streaming, interruption, and natural speech
 */

import { EventEmitter } from 'events';
import { spawn, ChildProcess } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

interface VoiceConfig {
  voice: string;
  speed: number;
  pitch: number;
  volume: number;
  language: string;
  enableBreathing: boolean;
  enableFillers: boolean;
  interruptionSensitivity: number;
}

interface SpeechChunk {
  text: string;
  audioBuffer?: Buffer;
  duration: number;
  emotion: string;
  shouldPause: boolean;
  pauseDuration?: number;
}

interface VoiceActivityResult {
  isActive: boolean;
  confidence: number;
  timestamp: number;
}

export class EnhancedVoicePipeline extends EventEmitter {
  private isPlaying: boolean = false;
  private isSpeaking: boolean = false;
  private isListening: boolean = false;
  private currentProcess: ChildProcess | null = null;
  private audioQueue: SpeechChunk[] = [];
  private vadProcess: ChildProcess | null = null;
  
  private config: VoiceConfig = {
    voice: 'en-IN-PrabhatNeural', // Best Indian English voice
    speed: 1.0,
    pitch: 0,
    volume: 80,
    language: 'en-IN',
    enableBreathing: true,
    enableFillers: true,
    interruptionSensitivity: 0.7
  };

  // Natural pause durations (in milliseconds)
  private readonly PAUSE_DURATIONS = {
    comma: 300,
    period: 500,
    exclamation: 400,
    question: 450,
    ellipsis: 800,
    breath: 200,
    thinking: 1000
  };

  // Breathing sound patterns
  private readonly BREATHING_PATTERNS = [
    { type: 'inhale', duration: 150, volume: 0.1 },
    { type: 'exhale', duration: 200, volume: 0.08 }
  ];

  constructor() {
    super();
    this.setupVoiceActivityDetection();
    this.setupAudioProcessing();
  }

  /**
   * Initialize voice pipeline with configuration
   */
  async initialize(config?: Partial<VoiceConfig>): Promise<void> {
    if (config) {
      this.config = { ...this.config, ...config };
    }

    console.log('🎤 Enhanced Voice Pipeline initializing...');
    
    // Test TTS availability
    await this.testTTSAvailability();
    
    // Setup audio output directory
    const audioDir = path.join(process.cwd(), 'temp', 'audio');
    if (!fs.existsSync(audioDir)) {
      fs.mkdirSync(audioDir, { recursive: true });
    }

    console.log('✅ Enhanced Voice Pipeline initialized');
    this.emit('initialized');
  }

  /**
   * Process streaming text to speech with natural flow
   */
  async processStreamingTTS(textStream: AsyncIterable<string>, emotion: string = 'neutral'): Promise<void> {
    this.isSpeaking = true;
    this.emit('speakingStarted');

    try {
      let textBuffer = '';
      let sentenceCount = 0;

      for await (const chunk of textStream) {
        if (!this.isSpeaking) break; // Allow interruption

        textBuffer += chunk;

        // Process complete sentences or phrases
        const sentences = this.extractCompleteSentences(textBuffer);
        
        for (const sentence of sentences.complete) {
          if (!this.isSpeaking) break;

          // Add natural enhancements
          const enhancedText = this.enhanceTextForSpeech(sentence, emotion, sentenceCount);
          
          // Generate speech chunk
          const speechChunk = await this.generateSpeechChunk(enhancedText, emotion);
          
          // Add to queue and play
          this.audioQueue.push(speechChunk);
          await this.playNextInQueue();

          sentenceCount++;
        }

        textBuffer = sentences.remaining;
      }

      // Process any remaining text
      if (textBuffer.trim() && this.isSpeaking) {
        const enhancedText = this.enhanceTextForSpeech(textBuffer, emotion, sentenceCount);
        const speechChunk = await this.generateSpeechChunk(enhancedText, emotion);
        this.audioQueue.push(speechChunk);
        await this.playNextInQueue();
      }

      // Wait for queue to finish
      await this.waitForQueueCompletion();

    } catch (error) {
      console.error('Streaming TTS error:', error);
      this.emit('error', error);
    } finally {
      this.isSpeaking = false;
      this.emit('speakingEnded');
    }
  }

  /**
   * Speak text with natural enhancements
   */
  async speak(text: string, emotion: string = 'neutral'): Promise<void> {
    if (this.isSpeaking) {
      this.stopSpeaking();
    }

    this.isSpeaking = true;
    this.emit('speakingStarted');

    try {
      // Enhance text for natural speech
      const enhancedText = this.enhanceTextForSpeech(text, emotion);
      
      // Generate and play speech
      const speechChunk = await this.generateSpeechChunk(enhancedText, emotion);
      await this.playSpeechChunk(speechChunk);

    } catch (error) {
      console.error('TTS error:', error);
      this.emit('error', error);
    } finally {
      this.isSpeaking = false;
      this.emit('speakingEnded');
    }
  }

  /**
   * Stop current speech (for interruptions)
   */
  stopSpeaking(): void {
    this.isSpeaking = false;
    this.audioQueue = [];
    
    if (this.currentProcess) {
      this.currentProcess.kill('SIGTERM');
      this.currentProcess = null;
    }

    this.emit('speakingStopped');
    console.log('🛑 Speech interrupted');
  }

  /**
   * Start voice activity detection for interruptions
   */
  startListening(): void {
    if (this.isListening) return;

    this.isListening = true;
    this.setupVoiceActivityDetection();
    this.emit('listeningStarted');
    console.log('👂 Voice activity detection started');
  }

  /**
   * Stop voice activity detection
   */
  stopListening(): void {
    this.isListening = false;
    
    if (this.vadProcess) {
      this.vadProcess.kill('SIGTERM');
      this.vadProcess = null;
    }

    this.emit('listeningStopped');
    console.log('🔇 Voice activity detection stopped');
  }

  /**
   * Enhance text with natural speech elements
   */
  private enhanceTextForSpeech(text: string, emotion: string, sentenceIndex: number = 0): string {
    let enhanced = text;

    // Add breathing at natural points
    if (this.config.enableBreathing && sentenceIndex > 0 && sentenceIndex % 3 === 0) {
      enhanced = '[breath] ' + enhanced;
    }

    // Add emotion-based modifications
    enhanced = this.addEmotionalInflection(enhanced, emotion);

    // Add natural pauses
    enhanced = this.addNaturalPauses(enhanced);

    // Adjust speed markers for emphasis
    enhanced = this.addSpeedVariations(enhanced);

    return enhanced;
  }

  /**
   * Add emotional inflection to text
   */
  private addEmotionalInflection(text: string, emotion: string): string {
    switch (emotion) {
      case 'excited':
      case 'enthusiastic':
        return text.replace(/!/g, '!!').replace(/\./g, '!');
      
      case 'sad':
      case 'empathetic':
        return `<prosody rate="0.8" pitch="-10%">${text}</prosody>`;
      
      case 'angry':
        return `<prosody rate="1.2" pitch="+15%" volume="+10%">${text}</prosody>`;
      
      case 'curious':
        return text.replace(/\?/g, '??').replace(/\./g, '?');
      
      case 'thinking':
        return `<prosody rate="0.9">${text}</prosody>`;
      
      default:
        return text;
    }
  }

  /**
   * Add natural pauses to text
   */
  private addNaturalPauses(text: string): string {
    return text
      .replace(/,/g, '<break time="300ms"/>,')
      .replace(/\./g, '.<break time="500ms"/>')
      .replace(/!/g, '!<break time="400ms"/>')
      .replace(/\?/g, '?<break time="450ms"/>')
      .replace(/\.\.\./g, '...<break time="800ms"/>');
  }

  /**
   * Add speed variations for emphasis
   */
  private addSpeedVariations(text: string): string {
    // Slow down important words
    const importantWords = /(important|critical|amazing|excellent|problem|solution)/gi;
    text = text.replace(importantWords, '<prosody rate="0.8">$1</prosody>');

    // Speed up casual words
    const casualWords = /(actually|basically|literally|like|you know)/gi;
    text = text.replace(casualWords, '<prosody rate="1.2">$1</prosody>');

    return text;
  }

  /**
   * Extract complete sentences from text buffer
   */
  private extractCompleteSentences(text: string): { complete: string[], remaining: string } {
    const sentences = text.split(/([.!?]+)/);
    const complete: string[] = [];
    let remaining = '';

    for (let i = 0; i < sentences.length - 1; i += 2) {
      if (sentences[i + 1]) {
        complete.push(sentences[i] + sentences[i + 1]);
      }
    }

    // Last sentence might be incomplete
    if (sentences.length % 2 === 1) {
      remaining = sentences[sentences.length - 1];
    }

    return { complete, remaining };
  }

  /**
   * Generate speech chunk from text
   */
  private async generateSpeechChunk(text: string, emotion: string): Promise<SpeechChunk> {
    const filename = `speech_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.wav`;
    const filepath = path.join(process.cwd(), 'temp', 'audio', filename);

    // Use Edge TTS for high-quality speech
    const ssml = this.generateSSML(text, emotion);
    
    return new Promise((resolve, reject) => {
      const edgeProcess = spawn('edge-tts', [
        '--voice', this.config.voice,
        '--text', ssml,
        '--write-media', filepath,
        '--write-subtitles', filepath.replace('.wav', '.vtt')
      ]);

      edgeProcess.on('close', (code) => {
        if (code === 0 && fs.existsSync(filepath)) {
          const audioBuffer = fs.readFileSync(filepath);
          const duration = this.estimateAudioDuration(text);
          
          resolve({
            text,
            audioBuffer,
            duration,
            emotion,
            shouldPause: /[.!?]$/.test(text.trim()),
            pauseDuration: this.calculatePauseDuration(text)
          });

          // Cleanup file after a delay
          setTimeout(() => {
            if (fs.existsSync(filepath)) {
              fs.unlinkSync(filepath);
            }
          }, 5000);
        } else {
          reject(new Error(`Edge TTS failed with code ${code}`));
        }
      });

      edgeProcess.on('error', reject);
    });
  }

  /**
   * Generate SSML for enhanced speech
   */
  private generateSSML(text: string, emotion: string): string {
    const rate = this.config.speed;
    const pitch = this.config.pitch;
    const volume = this.config.volume;

    return `
      <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${this.config.language}">
        <prosody rate="${rate}" pitch="${pitch > 0 ? '+' : ''}${pitch}%" volume="${volume}%">
          ${text}
        </prosody>
      </speak>
    `.trim();
  }

  /**
   * Play speech chunk with natural timing
   */
  private async playSpeechChunk(chunk: SpeechChunk): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!chunk.audioBuffer) {
        reject(new Error('No audio buffer available'));
        return;
      }

      // Use system audio player (macOS)
      const tempFile = path.join(process.cwd(), 'temp', 'audio', `temp_${Date.now()}.wav`);
      fs.writeFileSync(tempFile, chunk.audioBuffer);

      this.currentProcess = spawn('afplay', [tempFile]);

      this.currentProcess.on('close', () => {
        // Add natural pause after speech
        if (chunk.shouldPause && chunk.pauseDuration) {
          setTimeout(resolve, chunk.pauseDuration);
        } else {
          resolve();
        }

        // Cleanup
        if (fs.existsSync(tempFile)) {
          fs.unlinkSync(tempFile);
        }
      });

      this.currentProcess.on('error', reject);
    });
  }

  /**
   * Play next item in audio queue
   */
  private async playNextInQueue(): Promise<void> {
    if (this.isPlaying || this.audioQueue.length === 0) return;

    this.isPlaying = true;
    const chunk = this.audioQueue.shift();
    
    if (chunk && this.isSpeaking) {
      try {
        await this.playSpeechChunk(chunk);
      } catch (error) {
        console.error('Audio playback error:', error);
      }
    }

    this.isPlaying = false;

    // Continue with next chunk
    if (this.audioQueue.length > 0 && this.isSpeaking) {
      await this.playNextInQueue();
    }
  }

  /**
   * Wait for audio queue to complete
   */
  private async waitForQueueCompletion(): Promise<void> {
    return new Promise((resolve) => {
      const checkQueue = () => {
        if (this.audioQueue.length === 0 && !this.isPlaying) {
          resolve();
        } else {
          setTimeout(checkQueue, 100);
        }
      };
      checkQueue();
    });
  }

  /**
   * Setup voice activity detection for interruptions
   */
  private setupVoiceActivityDetection(): void {
    if (!this.isListening) return;

    // Use system microphone for VAD (simplified implementation)
    // In production, use proper VAD library like webrtcvad or similar
    console.log('🎯 Voice Activity Detection setup (placeholder)');
    
    // Simulate VAD events
    setInterval(() => {
      if (this.isListening && this.isSpeaking) {
        // Simulate voice activity detection
        const activity = this.simulateVoiceActivity();
        if (activity.isActive && activity.confidence > this.config.interruptionSensitivity) {
          this.emit('voiceActivityDetected', activity);
          this.handleInterruption();
        }
      }
    }, 100);
  }

  /**
   * Handle voice interruption
   */
  private handleInterruption(): void {
    if (this.isSpeaking) {
      console.log('🛑 Voice interruption detected');
      this.stopSpeaking();
      this.emit('interrupted');
    }
  }

  /**
   * Simulate voice activity (replace with real VAD)
   */
  private simulateVoiceActivity(): VoiceActivityResult {
    return {
      isActive: Math.random() > 0.95, // 5% chance of "interruption"
      confidence: Math.random(),
      timestamp: Date.now()
    };
  }

  /**
   * Setup audio processing pipeline
   */
  private setupAudioProcessing(): void {
    // Setup audio processing for real-time effects
    console.log('🔊 Audio processing pipeline setup');
  }

  /**
   * Test TTS availability
   */
  private async testTTSAvailability(): Promise<void> {
    return new Promise((resolve, reject) => {
      const testProcess = spawn('edge-tts', ['--list-voices']);
      
      testProcess.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Edge TTS available');
          resolve();
        } else {
          reject(new Error('Edge TTS not available'));
        }
      });

      testProcess.on('error', () => {
        reject(new Error('Edge TTS not installed'));
      });
    });
  }

  /**
   * Estimate audio duration from text
   */
  private estimateAudioDuration(text: string): number {
    // Rough estimation: ~150 words per minute
    const words = text.split(' ').length;
    const wordsPerSecond = 150 / 60;
    return (words / wordsPerSecond) * 1000; // Convert to milliseconds
  }

  /**
   * Calculate pause duration based on punctuation
   */
  private calculatePauseDuration(text: string): number {
    if (text.includes('...')) return this.PAUSE_DURATIONS.ellipsis;
    if (text.includes('!')) return this.PAUSE_DURATIONS.exclamation;
    if (text.includes('?')) return this.PAUSE_DURATIONS.question;
    if (text.includes('.')) return this.PAUSE_DURATIONS.period;
    if (text.includes(',')) return this.PAUSE_DURATIONS.comma;
    return 0;
  }

  /**
   * Update voice configuration
   */
  updateConfig(config: Partial<VoiceConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('🔧 Voice config updated:', config);
  }

  /**
   * Get current status
   */
  getStatus(): { isPlaying: boolean; isSpeaking: boolean; isListening: boolean; queueLength: number } {
    return {
      isPlaying: this.isPlaying,
      isSpeaking: this.isSpeaking,
      isListening: this.isListening,
      queueLength: this.audioQueue.length
    };
  }
}

export default EnhancedVoicePipeline;
