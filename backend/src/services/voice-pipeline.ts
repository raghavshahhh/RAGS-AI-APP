// ============================================================================
// RAGS AI - Complete Voice Pipeline
// Wake Word → STT → LLM → TTS → Speaker
// ============================================================================

import { EventEmitter } from 'events';
import { WakeWordEngine } from './wakeword-porcupine';
import { WhisperLocalSTT } from './stt-whisper-local';
import { HybridTTS } from './tts-hybrid';
import { OllamaBrain } from './ollama-brain';
import { MemorySystem } from './memory-system';
import { PvRecorder } from '@picovoice/pvrecorder-node';
import * as fs from 'fs/promises';
import * as path from 'path';
import { spawn } from 'child_process';

export interface PipelineConfig {
  userId: string;
  picovoiceKey: string;
  elevenLabsKey?: string;
  whisperModelPath: string;
  ollamaModel?: string;
  autoStart?: boolean;
}

interface PipelineState {
  isListening: boolean;
  isProcessing: boolean;
  isResponding: boolean;
  lastInteraction: Date | null;
}

export class VoicePipeline extends EventEmitter {
  private config: PipelineConfig;
  private state: PipelineState;

  // Core components
  private wakeWord: WakeWordEngine;
  private stt: WhisperLocalSTT;
  private tts: HybridTTS;
  private brain: OllamaBrain;
  private memory: MemorySystem;

  // Audio recording
  private recorder: PvRecorder | null = null;
  private isRecording: boolean = false;
  private audioBuffer: Int16Array[] = [];

  constructor(config: PipelineConfig) {
    super();
    this.config = config;
    this.state = {
      isListening: false,
      isProcessing: false,
      isResponding: false,
      lastInteraction: null,
    };

    // Initialize components
    this.wakeWord = new WakeWordEngine({
      accessKey: config.picovoiceKey,
      sensitivity: 0.7,
    });

    this.stt = new WhisperLocalSTT({
      modelPath: config.whisperModelPath,
      language: 'auto',
      threads: 4,
    });

    this.tts = new HybridTTS({
      elevenLabsApiKey: config.elevenLabsKey,
      preferOffline: false,
      cacheEnabled: true,
    });

    this.brain = new OllamaBrain({
      model: config.ollamaModel || 'llama3.2:3b',
      temperature: 0.7,
    });

    this.memory = new MemorySystem(config.userId, this.brain);

    this.setupEventHandlers();
  }

  /**
   * Setup event handlers for all components
   */
  private setupEventHandlers(): void {
    // Wake word detected
    this.wakeWord.on('wakeword', async (data) => {
      console.log('🔥 Wake word detected!');
      this.emit('wakeword', data);
      await this.startListeningForCommand();
    });

    // Errors
    this.wakeWord.on('error', (error) => {
      console.error('Wake word error:', error);
      this.emit('error', { component: 'wakeword', error });
    });
  }

  /**
   * Start the complete voice pipeline
   */
  async start(): Promise<void> {
    try {
      console.log('🚀 Starting RAGS Voice Pipeline...');

      // Initialize all components
      await this.stt.initialize();
      await this.tts.initialize();

      // Check if Ollama is available
      try {
        const ollamaAvailable = await this.brain.isAvailable();
        if (!ollamaAvailable) {
          console.log('⚠️  Ollama not responding, continuing without AI brain...');
        } else {
          console.log('✅ Ollama connected');
        }
      } catch (error) {
        console.log('⚠️  Ollama connection issue, continuing anyway...');
      }

      // Start wake word detection
      await this.wakeWord.start();

      this.state.isListening = true;
      this.emit('ready');

      console.log('✅ RAGS is now listening for "Hey RAGS"...');
    } catch (error) {
      console.error('❌ Failed to start voice pipeline:', error);
      this.emit('error', { component: 'pipeline', error });
      throw error;
    }
  }

  /**
   * Stop the voice pipeline
   */
  async stop(): Promise<void> {
    console.log('🛑 Stopping voice pipeline...');

    this.state.isListening = false;

    if (this.isRecording) {
      await this.stopRecording();
    }

    await this.wakeWord.stop();

    this.emit('stopped');
    console.log('✅ Voice pipeline stopped');
  }

  /**
   * Start listening for user command after wake word
   */
  private async startListeningForCommand(): Promise<void> {
    try {
      console.log('🎤 Listening for command...');
      this.emit('listening');

      // Play acknowledgment sound (optional)
      await this.playBeep();

      // Start recording
      await this.startRecording();

      // Record for 5 seconds or until silence
      await this.recordWithVAD(5000);

      // Stop recording
      const audioFile = await this.stopRecording();

      // Process the command
      await this.processCommand(audioFile);
    } catch (error) {
      console.error('Failed to listen for command:', error);
      this.emit('error', { component: 'listening', error });
    }
  }

  /**
   * Start audio recording
   */
  private async startRecording(): Promise<void> {
    this.recorder = new PvRecorder(512, -1); // Default device
    this.recorder.start();
    this.isRecording = true;
    this.audioBuffer = [];
  }

  /**
   * Record with Voice Activity Detection
   */
  private async recordWithVAD(maxDuration: number): Promise<void> {
    const startTime = Date.now();
    let silenceFrames = 0;
    const silenceThreshold = 20; // Frames of silence before stopping

    while (this.isRecording && Date.now() - startTime < maxDuration) {
      const frame = await this.recorder!.read();
      this.audioBuffer.push(frame);

      // Simple VAD: check if frame has audio
      const hasAudio = frame.some(sample => Math.abs(sample) > 500);
      
      if (!hasAudio) {
        silenceFrames++;
        if (silenceFrames > silenceThreshold) {
          console.log('🔇 Silence detected, stopping recording');
          break;
        }
      } else {
        silenceFrames = 0;
      }

      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }

  /**
   * Stop recording and save to file
   */
  private async stopRecording(): Promise<string> {
    if (!this.recorder) {
      throw new Error('Recorder not initialized');
    }

    this.recorder.stop();
    this.recorder.release();
    this.isRecording = false;

    // Save audio buffer to WAV file
    const audioFile = path.join(process.cwd(), 'temp', `command_${Date.now()}.wav`);
    await this.saveWAV(audioFile, this.audioBuffer);

    this.audioBuffer = [];
    this.recorder = null;

    return audioFile;
  }

  /**
   * Process voice command
   */
  private async processCommand(audioFile: string): Promise<void> {
    try {
      this.state.isProcessing = true;
      this.emit('processing');

      // 1. Speech to Text
      console.log('🎤 Transcribing...');
      const transcription = await this.stt.transcribe(audioFile);
      const userMessage = transcription.text;

      console.log(`User said: "${userMessage}"`);
      this.emit('transcription', { text: userMessage });

      // Save user message to memory
      await this.memory.saveMessage('user', userMessage);

      // 2. Get context from memory
      const context = await this.memory.getContextForAI(userMessage);

      // 3. Generate AI response
      console.log('🧠 Thinking...');
      const aiResponse = await this.brain.chat(
        context ? `${context}\n\nUser: ${userMessage}` : userMessage
      );

      console.log(`RAGS: "${aiResponse}"`);
      this.emit('response', { text: aiResponse });

      // Save AI response to memory
      await this.memory.saveMessage('assistant', aiResponse);

      // 4. Text to Speech
      this.state.isResponding = true;
      this.emit('speaking');

      console.log('🔊 Speaking...');
      const audioBuffer = await this.tts.speak({
        text: aiResponse,
        stability: 0.5,
        similarity: 0.75,
      });

      // 5. Play audio
      await this.playAudio(audioBuffer);

      this.state.isResponding = false;
      this.state.isProcessing = false;
      this.state.lastInteraction = new Date();

      this.emit('complete');

      // Cleanup
      await fs.unlink(audioFile).catch(() => {});
    } catch (error) {
      console.error('Failed to process command:', error);
      this.state.isProcessing = false;
      this.state.isResponding = false;
      this.emit('error', { component: 'processing', error });
    }
  }

  /**
   * Play audio buffer through speakers
   */
  private async playAudio(audioBuffer: Buffer): Promise<void> {
    return new Promise((resolve, reject) => {
      const tempFile = path.join(process.cwd(), 'temp', `response_${Date.now()}.mp3`);

      fs.writeFile(tempFile, audioBuffer)
        .then(() => {
          // Play using afplay (macOS) or other player
          const player = spawn('afplay', [tempFile]);

          player.on('close', async () => {
            await fs.unlink(tempFile).catch(() => {});
            resolve();
          });

          player.on('error', reject);
        })
        .catch(reject);
    });
  }

  /**
   * Play acknowledgment beep
   */
  private async playBeep(): Promise<void> {
    // Simple beep sound (optional)
    // You can add a beep.mp3 file or generate one
  }

  /**
   * Save audio buffer to WAV file
   */
  private async saveWAV(filename: string, buffer: Int16Array[]): Promise<void> {
    // Simple WAV file creation
    // This is a simplified version - you may want to use a library
    const samples = buffer.flatMap(arr => Array.from(arr));
    const wavBuffer = Buffer.alloc(44 + samples.length * 2);

    // WAV header
    wavBuffer.write('RIFF', 0);
    wavBuffer.writeUInt32LE(36 + samples.length * 2, 4);
    wavBuffer.write('WAVE', 8);
    wavBuffer.write('fmt ', 12);
    wavBuffer.writeUInt32LE(16, 16);
    wavBuffer.writeUInt16LE(1, 20);
    wavBuffer.writeUInt16LE(1, 22);
    wavBuffer.writeUInt32LE(16000, 24);
    wavBuffer.writeUInt32LE(32000, 28);
    wavBuffer.writeUInt16LE(2, 32);
    wavBuffer.writeUInt16LE(16, 34);
    wavBuffer.write('data', 36);
    wavBuffer.writeUInt32LE(samples.length * 2, 40);

    // Write samples
    for (let i = 0; i < samples.length; i++) {
      wavBuffer.writeInt16LE(samples[i], 44 + i * 2);
    }

    await fs.writeFile(filename, wavBuffer);
  }

  /**
   * Get current state
   */
  getState(): PipelineState {
    return { ...this.state };
  }
}

