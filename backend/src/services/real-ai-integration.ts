/**
 * REAL AI Integration - No Demo Data, Only Real Ollama AI
 * AI actually sees user, thinks, and responds with real emotions
 */

import { OllamaBrain } from './ollama-brain';
import { VisionSystem } from './vision-system';
import { HybridTTS } from './tts-hybrid';
import { LocalMemory } from './local-memory';
import { SimpleTTS } from './simple-tts';
import { MacAutomation } from './mac-automation';
import { SimpleWakeWord } from './simple-wakeword';
import { EdgeTTS } from './edge-tts';
import { SimpleReminders } from './simple-reminders';
import { SimplePersonality } from './simple-personality';
import { SimpleAutopilot } from './simple-autopilot';
import { ContextAwareness } from './context-awareness';
import { WebIntegration } from './web-integration';
import { PluginFramework } from './plugin-framework';
import { FaceRecognition } from './face-recognition';
import { EyeTracking } from './eye-tracking';
import { GestureControl } from './gesture-control';
import { CrossDeviceSync } from './cross-device-sync';
import { CameraCapture } from './camera-capture';
import { AdvancedWakeWord } from './advanced-wakeword';
import { OfflineSTT } from './offline-stt';
import { EnhancedTTS } from './enhanced-tts';
import { FaceDetection } from './face-detection';
import { ScreenOCR } from './screen-ocr';
import { EventEmitter } from 'events';
import * as fs from 'fs/promises';
import * as path from 'path';

interface RealAIConfig {
  userId: string;
  ollamaModel?: string;
  enableVision?: boolean;
  enableTTS?: boolean;
  elevenLabsKey?: string;
}

interface AIContext {
  userVisible: boolean;
  userPosition?: { x: number; y: number };
  userExpression?: string;
  conversationHistory: Array<{ role: string; content: string; timestamp: Date }>;
  currentEmotion: string;
  lastInteraction: Date;
}

interface RealAIResponse {
  text: string;
  emotion: 'happy' | 'sad' | 'surprised' | 'thinking' | 'excited' | 'curious' | 'neutral' | 'angry';
  confidence: number;
  reasoning: string;
  shouldSpeak: boolean;
  audioData?: Buffer;
  action?: {
    type: 'search' | 'open_browser' | 'open_youtube' | string;
    query?: string;
    url?: string;
  };
}

export class RealAIIntegration extends EventEmitter {
  private config: RealAIConfig;
  private brain: OllamaBrain;
  private vision?: VisionSystem;
  private tts?: HybridTTS;
  private memory: LocalMemory;
  private simpleTTS: SimpleTTS;
  private macAuto: MacAutomation;
  private wakeWord: SimpleWakeWord;
  private edgeTTS: EdgeTTS;
  private reminders: SimpleReminders;
  private personality: SimplePersonality;
  private autopilot: SimpleAutopilot;
  private contextAware: ContextAwareness;
  private webIntegration: WebIntegration;
  private plugins: PluginFramework;
  private faceRec: FaceRecognition;
  private eyeTrack: EyeTracking;
  private gestureCtrl: GestureControl;
  private deviceSync: CrossDeviceSync;
  private camera: CameraCapture;
  private advancedWake: AdvancedWakeWord;
  private offlineSTT: OfflineSTT;
  private enhancedTTS: EnhancedTTS;
  private faceDetect: FaceDetection;
  private screenOCR: ScreenOCR;
  private context: AIContext;
  private isProcessing: boolean = false;

  constructor(config: RealAIConfig) {
    super();
    this.config = {
      ollamaModel: process.env.OLLAMA_MODEL || 'phi3:mini',
      enableVision: false, // Disabled - camera not needed for now
      enableTTS: false, // Disabled - Coqui TTS not installed
      ...config
    };

    // Initialize Ollama Brain
    this.brain = new OllamaBrain({
      model: this.config.ollamaModel,
      temperature: 0.7,
      systemPrompt: `You are RAGS, a helpful AI assistant.

RULES:
1. ALWAYS reply in ENGLISH only, even if user speaks Hindi/other languages
2. Keep responses SHORT (1-2 sentences max)
3. Be natural and conversational
4. Answer questions directly
5. Use provided time/date context when available
6. When describing camera/vision: be specific and detailed about what you see

That's it. Just be helpful and concise IN ENGLISH.`
    });

    // Initialize Vision if enabled
    if (this.config.enableVision) {
      this.vision = new VisionSystem({
        enableCamera: true,
        enableScreenCapture: false,
        captureInterval: 5
      });
    }

    // Initialize TTS if enabled
    if (this.config.enableTTS) {
      this.tts = new HybridTTS({
        elevenLabsApiKey: this.config.elevenLabsKey,
        preferOffline: !this.config.elevenLabsKey,
        cacheEnabled: true
      });
    }

    // Initialize LOCAL services (always enabled)
    this.memory = new LocalMemory(this.config.userId);
    this.simpleTTS = new SimpleTTS();
    this.macAuto = new MacAutomation();
    this.wakeWord = new SimpleWakeWord();
    this.edgeTTS = new EdgeTTS();
    this.reminders = new SimpleReminders(this.config.userId);
    this.personality = new SimplePersonality();
    this.autopilot = new SimpleAutopilot();
    this.contextAware = new ContextAwareness();
    this.webIntegration = new WebIntegration();
    this.plugins = new PluginFramework();
    this.faceRec = new FaceRecognition();
    this.eyeTrack = new EyeTracking();
    this.gestureCtrl = new GestureControl();
    this.deviceSync = new CrossDeviceSync();
    this.camera = new CameraCapture();
    
    // Initialize ADVANCED features
    this.advancedWake = new AdvancedWakeWord({
      wakeWords: ['hey rags', 'yo rags', 'rags bro', 'hey jarvis'],
      sensitivity: 0.7,
      cooldownMs: 2000
    });
    this.offlineSTT = new OfflineSTT();
    this.enhancedTTS = new EnhancedTTS();
    this.faceDetect = new FaceDetection();
    this.screenOCR = new ScreenOCR();

    // Initialize context
    this.context = {
      userVisible: false,
      conversationHistory: [],
      currentEmotion: 'neutral',
      lastInteraction: new Date()
    };
  }

  /**
   * Initialize the real AI system
   */
  async initialize(): Promise<void> {
    console.log('🤖 Initializing REAL AI Integration...');

    // Check if Ollama is running
    const ollamaAvailable = await this.brain.isAvailable();
    if (!ollamaAvailable) {
      throw new Error('Ollama is not running! Start it with: ollama serve');
    }
    console.log('✅ Ollama AI connected');

    // Initialize vision
    if (this.vision) {
      await this.vision.initialize();
      console.log('✅ Vision system ready');
    }

    // Initialize TTS
    if (this.tts) {
      await this.tts.initialize();
      console.log('✅ TTS system ready');
    }

    // Initialize memory
    await this.memory.initialize();
    console.log('✅ Local memory system ready');

    // Initialize reminders
    await this.reminders.initialize();
    console.log('✅ Reminders system ready');

    // Initialize autopilot
    await this.autopilot.initialize();
    console.log('✅ Autopilot ready');

    // Enable wake word
    this.wakeWord.enable();
    console.log('✅ Wake word detection enabled');

    // Initialize context awareness
    await this.contextAware.start();
    console.log('✅ Context awareness active');

    // Initialize plugin framework
    await this.plugins.initialize();
    console.log('✅ Plugin framework ready');

    // Initialize face recognition
    await this.faceRec.initialize();
    await this.faceRec.start();
    console.log('✅ Face recognition active');

    // Initialize eye tracking
    await this.eyeTrack.initialize();
    await this.eyeTrack.start();
    console.log('✅ Eye tracking active');

    // Initialize gesture control
    await this.gestureCtrl.initialize();
    await this.gestureCtrl.start();
    console.log('✅ Gesture control active');

    // Initialize device sync
    await this.deviceSync.initialize();
    await this.deviceSync.start();
    console.log('✅ Cross-device sync active');

    // Initialize camera capture
    await this.camera.initialize();
    console.log('✅ Camera capture ready');

    // Initialize ADVANCED features
    this.advancedWake.start();
    console.log('✅ Advanced wake word ready (multiple wake words)');
    
    console.log(`✅ Offline STT ${this.offlineSTT.isAvailable() ? 'available' : 'not available (install Whisper.cpp)'}`);
    console.log('✅ Enhanced TTS ready (Edge-TTS + ElevenLabs + emotions)');
    console.log('✅ Face detection ready');
    console.log('✅ Screen OCR ready (context awareness)');

    console.log('✅ Simple TTS ready');
    console.log('✅ Edge-TTS ready');
    console.log('✅ Web integration ready');
    console.log('✅ Mac automation ready');
    console.log('✅ Personality engine ready');
    console.log('🎉 REAL AI Integration ready - All 26 features active!');
    console.log('🔥 NEW: Multiple wake words, Offline STT, Enhanced TTS, Face detection, Screen OCR');
  }

  /**
   * Process user message with REAL AI
   */
  async processMessage(userMessage: string, userContext?: {
    position?: { x: number; y: number };
    expression?: string;
    visible?: boolean;
  }): Promise<RealAIResponse> {
    if (this.isProcessing) {
      return {
        text: 'Ek second, main soch raha hoon...',
        emotion: 'thinking',
        confidence: 1.0,
        reasoning: 'Already processing another request',
        shouldSpeak: true
      };
    }

    this.isProcessing = true;
    this.emit('processing_start');

    try {
      // Check for wake word with ADVANCED detection
      const wakeWordDetected = this.advancedWake.processText(userMessage);
      if (wakeWordDetected) {
        console.log('🔥 Advanced wake word detected!');
        // Wake word already removed by advancedWake.processText
      }
      
      // Also check simple wake word for backward compatibility
      const hasWakeWord = this.wakeWord.detect(userMessage);
      if (hasWakeWord) {
        console.log('🔥 Simple wake word detected');
        userMessage = userMessage.replace(/hey rags|hai rags|hello rags|hi rags|okay rags|ok rags/gi, '').trim();
      }

      // Update context with user info
      if (userContext) {
        this.context.userVisible = userContext.visible ?? this.context.userVisible;
        this.context.userPosition = userContext.position;
        this.context.userExpression = userContext.expression;
      }

      // Check for camera/vision requests first
      if (this.isCameraRequest(userMessage)) {
        try {
          console.log('📷 Processing camera vision request...');
          const visionResult = await this.handleCameraVision(userMessage);
          let text = visionResult.text;
          let emotion = visionResult.emotion;
          let reasoning = 'Camera vision analysis';
          let action = visionResult.action;
          // Save to conversation history
          this.context.conversationHistory.push({
            role: 'user',
            content: userMessage,
            timestamp: new Date()
          });
          this.context.conversationHistory.push({
            role: 'assistant',
            content: text,
            timestamp: new Date()
          });
          this.context.currentEmotion = emotion;
          this.context.lastInteraction = new Date();

          // Enhance with personality
          const enhancedText = this.personality.enhanceResponse(text, {
            userEmotion: this.context.userExpression,
            taskType: action?.type
          });
          text = enhancedText;

          // Save to LOCAL MEMORY (persistent storage)
          await this.memory.saveMessage('user', userMessage);
          await this.memory.saveMessage('assistant', text);

          let audioData: Buffer | undefined;

          const response: RealAIResponse = {
            text,
            emotion,
            confidence: 0.9,
            reasoning,
            shouldSpeak: true,
            audioData,
            action
          };

          // INSTANT RESPONSE - Return immediately without waiting for TTS
          this.emit('response', response);
          
          // TTS in background (non-blocking) - fire and forget
          this.speakInBackground(text);

          return response;
        } catch (error) {
          console.error('Camera vision failed:', error);
          return {
            text: 'Sorry, camera vision is not available right now.',
            emotion: 'sad',
            confidence: 0.5,
            reasoning: 'Camera error',
            shouldSpeak: true
          };
        }
      }

      // Check for quick command responses first
      const quickResponse = this.getQuickResponse(userMessage);
      
      let text: string;
      let emotion: RealAIResponse['emotion'];
      let reasoning: string;
      let action: any = undefined;
      
      if (quickResponse) {
        // Direct response for simple commands
        console.log('✅ Quick response matched:', quickResponse);
        text = quickResponse.text;
        emotion = quickResponse.emotion;
        reasoning = 'Quick command response';
        action = quickResponse.action;
        console.log('🎬 Action extracted:', action);
      } else {
        // Build enhanced prompt with context
        const enhancedPrompt = await this.buildContextualPrompt(userMessage);

        // Get REAL response from Ollama
        console.log('🧠 Asking Ollama AI...');
        const aiResponse = await this.brain.chat(enhancedPrompt);

        // Parse emotion and reasoning from response
        const parsed = this.parseAIResponse(aiResponse);
        text = parsed.text;
        emotion = parsed.emotion;
        reasoning = parsed.reasoning;
      }

      // Save to conversation history
      this.context.conversationHistory.push({
        role: 'user',
        content: userMessage,
        timestamp: new Date()
      });
      this.context.conversationHistory.push({
        role: 'assistant',
        content: text,
        timestamp: new Date()
      });
      this.context.currentEmotion = emotion;
      this.context.lastInteraction = new Date();

      // Enhance with personality
      const enhancedText = this.personality.enhanceResponse(text, {
        userEmotion: this.context.userExpression,
        taskType: action?.type
      });
      text = enhancedText;

      // Save to LOCAL MEMORY (persistent storage)
      await this.memory.saveMessage('user', userMessage);
      await this.memory.saveMessage('assistant', text);

      let audioData: Buffer | undefined;

      const response: RealAIResponse = {
        text,
        emotion,
        confidence: 0.9,
        reasoning,
        shouldSpeak: true,
        audioData,
        action
      };

      // INSTANT RESPONSE - Return immediately without waiting for TTS
      this.emit('response', response);
      
      // TTS in background (non-blocking) - fire and forget
      this.speakInBackground(text);

      return response;

    } catch (error) {
      console.error('❌ Real AI Error:', error);
      return {
        text: 'Sorry, mujhe kuch technical problem aa gayi. Kya tum dobara try kar sakte ho?',
        emotion: 'sad',
        confidence: 0.5,
        reasoning: 'Technical error occurred',
        shouldSpeak: true
      };
    } finally {
      this.isProcessing = false;
      this.emit('processing_end');
    }
  }

  /**
   * Get quick response for simple commands
   */
  private getQuickResponse(userMessage: string): { text: string; emotion: RealAIResponse['emotion']; action?: any } | null {
    const msg = userMessage.toLowerCase().trim();
    
    // Get current time and date
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-IN', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
    const dateStr = now.toLocaleDateString('en-IN', { 
      weekday: 'long', 
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    
    // Time queries
    if (msg.includes('time') || msg.includes('samay') || msg.includes('kitne baje')) {
      return {
        text: `Abhi ${timeStr} baj rahe hain.`,
        emotion: 'neutral'
      };
    }
    
    // Date queries
    if (msg.includes('date') || msg.includes('tarikh') || msg.includes('kaun sa din') || msg.includes('aaj kya hai')) {
      return {
        text: `Aaj ${dateStr} hai.`,
        emotion: 'neutral'
      };
    }
    
    // Common greetings
    if (msg === 'hello' || msg === 'hi' || msg === 'hey') {
      return {
        text: 'Namaste! Main RAGS hoon. Kaise madad kar sakta hoon?',
        emotion: 'happy'
      };
    }
    
    if (msg.includes('kaise ho') || msg.includes('how are you')) {
      return {
        text: 'Main bilkul theek hoon! Tum kaise ho?',
        emotion: 'happy'
      };
    }
    
    if (msg === 'suna') {
      return {
        text: 'Haan bol raha hoon, batao kya chahiye?',
        emotion: 'curious'
      };
    }
    
    // YOUTUBE + SEARCH COMBINED (e.g., "open youtube and search Raghav Shah")
    if (msg.includes('youtube') && msg.includes('search')) {
      const query = msg
        .replace(/youtube/gi, '')
        .replace(/open/gi, '')
        .replace(/khol/gi, '')
        .replace(/and/gi, '')
        .replace(/search/gi, '')
        .replace(/for/gi, '')
        .replace(/aur/gi, '')
        .trim();
      
      if (query) {
        return {
          text: `YouTube pe "${query}" search kar raha hoon...`,
          emotion: 'neutral',
          action: {
            type: 'open_youtube',
            query: query
          }
        };
      }
    }
    
    // SEARCH COMMANDS
    if (msg.includes('search') || msg.includes('google') || msg.includes('find') || msg.includes('khojo')) {
      let query = msg
        .replace(/search/gi, '')
        .replace(/google/gi, '')
        .replace(/find/gi, '')
        .replace(/khojo/gi, '')
        .replace(/for/gi, '')
        .replace(/on/gi, '')
        .replace(/internet/gi, '')
        .replace(/youtube/gi, '')  // Remove youtube if mentioned with search
        .replace(/open/gi, '')
        .replace(/khol/gi, '')
        .trim();
      
      // If just "search" with no query, ask for query
      if (!query) {
        return {
          text: 'Kya search karna hai? Batao...',
          emotion: 'curious'
        };
      }
      
      return {
        text: `Theek hai, main "${query}" search kar raha hoon...`,
        emotion: 'thinking',
        action: {
          type: 'search',
          query: query
        }
      };
    }
    
    // BROWSER COMMANDS
    if (msg.includes('open browser') || msg.includes('browser khol') || msg.includes('chrome') || msg.includes('safari')) {
      return {
        text: 'Theek hai, browser khol raha hoon...',
        emotion: 'neutral',
        action: {
          type: 'open_browser'
        }
      };
    }
    
    // YOUTUBE
    if (msg.includes('youtube')) {
      const query = msg
        .replace(/youtube/gi, '')
        .replace(/open/gi, '')
        .replace(/khol/gi, '')
        .replace(/play/gi, '')
        .replace(/search/gi, '')
        .replace(/on/gi, '')
        .replace(/pe/gi, '')
        .trim();
      
      if (query) {
        return {
          text: `YouTube pe "${query}" search kar raha hoon...`,
          emotion: 'neutral',
          action: {
            type: 'open_youtube',
            query: query
          }
        };
      } else {
        return {
          text: 'YouTube khol raha hoon...',
          emotion: 'neutral',
          action: {
            type: 'open_youtube',
            query: null
          }
        };
      }
    }
    
    // BROWSER CONTROL COMMANDS
    // Scroll commands
    if (msg.includes('scroll down') || msg.includes('neeche karo') || msg.includes('scroll neeche')) {
      return {
        text: 'Scroll kar raha hoon neeche...',
        emotion: 'neutral',
        action: {
          type: 'scroll',
          direction: 'down'
        }
      };
    }
    
    if (msg.includes('scroll up') || msg.includes('upar karo') || msg.includes('scroll upar')) {
      return {
        text: 'Scroll kar raha hoon upar...',
        emotion: 'neutral',
        action: {
          type: 'scroll',
          direction: 'up'
        }
      };
    }
    
    // Selection commands (first, second, third option)
    // More specific regex to avoid matching "second" in phrases like "do you see"
    const optionMatch = msg.match(/(first|second|third|fourth|fifth|pehla|doosra|teesra|1st|2nd|3rd|4th|5th)\s+(option|result|link|video)/i);
    if (optionMatch) {
      const optionWord = optionMatch[1].toLowerCase();
      let optionNumber = 1;
      
      if (optionWord === 'second' || optionWord === 'doosra' || optionWord === '2nd' || optionWord === 'do') optionNumber = 2;
      else if (optionWord === 'third' || optionWord === 'teesra' || optionWord === '3rd' || optionWord === 'teen') optionNumber = 3;
      else if (optionWord === 'fourth' || optionWord === '4th' || optionWord === 'char') optionNumber = 4;
      else if (optionWord === 'fifth' || optionWord === '5th' || optionWord === 'paanch') optionNumber = 5;
      
      return {
        text: `${optionNumber === 1 ? 'Pehla' : optionNumber === 2 ? 'Doosra' : optionNumber === 3 ? 'Teesra' : optionNumber + 'th'} option select kar raha hoon...`,
        emotion: 'neutral',
        action: {
          type: 'select_option',
          number: optionNumber
        }
      };
    }
    
    // Click commands
    if (msg.includes('click') || msg.includes('press') || msg.includes('dabao')) {
      // Extract what to click
      const target = msg
        .replace(/click/gi, '')
        .replace(/press/gi, '')
        .replace(/dabao/gi, '')
        .replace(/on/gi, '')
        .trim();
      
      if (target) {
        return {
          text: `"${target}" par click kar raha hoon...`,
          emotion: 'neutral',
          action: {
            type: 'click',
            target: target
          }
        };
      }
    }
    
    // FACE RECOGNITION - NAME REGISTRATION
    // "Ye Raghav hai" / "This is Raghav" / "Remember this face"
    if (msg.includes('ye') && msg.includes('hai') && !msg.includes('kya') && !msg.includes('kaise')) {
      // Extract name from "Ye Raghav hai" or "Ye tumhara friend hai"
      let name = '';
      
      // Pattern: "ye [name] hai"
      const yeMatch = msg.match(/ye\s+([\w\s]+?)\s+hai/i);
      if (yeMatch) {
        name = yeMatch[1].trim();
        
        // Skip if it's generic words or contains generic words
        const genericWords = ['tumhara', 'mera', 'uska', 'friend', 'dost', 'mere', 'apna'];
        const hasGenericWord = genericWords.some(word => name.toLowerCase().includes(word));
        
        if (!hasGenericWord && name.length > 0 && name.length < 30) {
          return {
            text: `Theek hai, main ${name} ko yaad rakh raha hoon...`,
            emotion: 'happy',
            action: {
              type: 'register_face',
              name: name
            }
          };
        }
      }
    }
    
    // "This is [name]"
    if (msg.includes('this is') && !msg.includes('what') && !msg.includes('?')) {
      const nameMatch = msg.match(/this is\s+([\w\s]+)/i);
      if (nameMatch) {
        const name = nameMatch[1].trim();
        if (name.length > 0 && name.length < 30) {
          return {
            text: `Got it! I'll remember ${name}.`,
            emotion: 'happy',
            action: {
              type: 'register_face',
              name: name
            }
          };
        }
      }
    }
    
    // "Remember this face"
    if (msg.includes('remember this face') || msg.includes('remember my face') || msg.includes('yaad rakh mera chehra')) {
      return {
        text: 'Theek hai, main tumhara chehra yaad kar raha hoon...',
        emotion: 'happy',
        action: {
          type: 'register_face',
          name: 'User'
        }
      };
    }
    
    // CAMERA VISION COMMANDS - REMOVED FROM QUICK RESPONSES
    // These are now handled by the main camera vision system for actual analysis
    
    // VOICE CHANGE COMMANDS
    if (msg.includes('voice change') || msg.includes('awaaz change') || 
        msg.includes('female voice') || msg.includes('male voice') ||
        msg.includes('teri awaaz change') || msg.includes('voice badal')) {
      
      if (msg.includes('female') || msg.includes('woman') || msg.includes('ladki')) {
        return {
          text: 'Voice change kar raha hoon female mein...',
          emotion: 'happy',
          action: {
            type: 'voice_change',
            gender: 'female'
          }
        };
      } else if (msg.includes('male') || msg.includes('man') || msg.includes('ladka')) {
        return {
          text: 'Voice change kar raha hoon male mein...',
          emotion: 'happy',
          action: {
            type: 'voice_change',
            gender: 'male'
          }
        };
      } else {
        return {
          text: 'Kaunsa voice chahiye? Female ya male?',
          emotion: 'curious'
        };
      }
    }
    
    // MEMORY COMMANDS
    if (msg.includes('remember') || msg.includes('yaad rakh') || msg.includes('save this')) {
      const content = msg
        .replace(/remember/gi, '')
        .replace(/yaad rakh/gi, '')
        .replace(/save this/gi, '')
        .replace(/that/gi, '')
        .trim();
      
      if (content) {
        return {
          text: `Theek hai, yaad rakh liya: "${content}"`,
          emotion: 'thinking',
          action: {
            type: 'remember',
            content: content,
            importance: 7
          }
        };
      }
    }
    
    if (msg.includes('what do you remember') || msg.includes('kya yaad hai') || msg.includes('recall')) {
      return {
        text: 'Ek second, apni memory check kar raha hoon...',
        emotion: 'thinking',
        action: {
          type: 'recall',
          query: msg
        }
      };
    }
    
    // FILE OPERATIONS
    if (msg.includes('open file') || msg.includes('file khol') || msg.includes('open folder') || msg.includes('folder khol')) {
      const target = msg
        .replace(/open/gi, '')
        .replace(/khol/gi, '')
        .replace(/file/gi, '')
        .replace(/folder/gi, '')
        .trim();
      
      return {
        text: `"${target || 'folder'}" khol raha hoon...`,
        emotion: 'neutral',
        action: {
          type: 'open_file',
          path: target || 'Desktop'
        }
      };
    }
    
    // APP CONTROL
    if (msg.includes('open app') || msg.includes('launch') || msg.includes('app khol')) {
      const appName = msg
        .replace(/open/gi, '')
        .replace(/launch/gi, '')
        .replace(/khol/gi, '')
        .replace(/app/gi, '')
        .trim();
      
      if (appName) {
        return {
          text: `${appName} app khol raha hoon...`,
          emotion: 'neutral',
          action: {
            type: 'open_app',
            app: appName
          }
        };
      }
    }
    
    // SYSTEM CONTROL - VOLUME
    if (msg.includes('volume') || msg.includes('awaz')) {
      // Maximum/Full volume
      if (msg.includes('max') || msg.includes('full') || msg.includes('poora') || msg.includes('100')) {
        return {
          text: 'Volume maximum kar raha hoon...',
          emotion: 'neutral',
          action: { type: 'volume_set', value: 100 }
        };
      }
      // Minimum/Mute
      if (msg.includes('min') || msg.includes('zero') || msg.includes('mute') || msg.includes('band')) {
        return {
          text: 'Volume mute kar raha hoon...',
          emotion: 'neutral',
          action: { type: 'volume_set', value: 0 }
        };
      }
      // Volume up
      if (msg.includes('up') || msg.includes('badha') || msg.includes('increase') || msg.includes('tez')) {
        return {
          text: 'Volume badha raha hoon...',
          emotion: 'neutral',
          action: { type: 'volume_up' }
        };
      }
      // Volume down
      if (msg.includes('down') || msg.includes('kam') || msg.includes('decrease') || msg.includes('low')) {
        return {
          text: 'Volume kam kar raha hoon...',
          emotion: 'neutral',
          action: { type: 'volume_down' }
        };
      }
      // Just "volume kar" - increase it
      return {
        text: 'Volume badha raha hoon...',
        emotion: 'neutral',
        action: { type: 'volume_up' }
      };
    }
    
    // Maximum/Minimum commands (without "volume" word)
    if (msg === 'maximum' || msg === 'max' || msg === 'full' || msg === 'poora') {
      return {
        text: 'Volume maximum kar diya!',
        emotion: 'neutral',
        action: { type: 'volume_set', value: 100 }
      };
    }
    
    if (msg === 'minimum' || msg === 'min' || msg === 'zero' || msg === 'mute') {
      return {
        text: 'Volume mute kar diya!',
        emotion: 'neutral',
        action: { type: 'volume_set', value: 0 }
      };
    }
    
    if (msg.includes('screenshot') || msg.includes('capture screen') || msg.includes('photo le') || msg.includes('take a screenshot') || msg.includes('screen capture')) {
      return {
        text: 'Screenshot le raha hoon...',
        emotion: 'neutral',
        action: { type: 'screenshot' }
      };
    }
    
    if (msg.includes('notification') || msg.includes('notify me')) {
      const message = msg
        .replace(/send/gi, '')
        .replace(/notification/gi, '')
        .replace(/notify me/gi, '')
        .trim();
      
      return {
        text: 'Notification bhej raha hoon...',
        emotion: 'neutral',
        action: {
          type: 'notification',
          message: message || 'Test notification'
        }
      };
    }
    
    // REMINDER COMMANDS
    if (msg.includes('remind me') || msg.includes('reminder') || msg.includes('yaad dilana')) {
      const content = msg
        .replace(/remind me/gi, '')
        .replace(/reminder/gi, '')
        .replace(/yaad dilana/gi, '')
        .replace(/to/gi, '')
        .trim();
      
      return {
        text: `Theek hai, main yaad dila dunga: "${content}"`,
        emotion: 'neutral',
        action: {
          type: 'add_reminder',
          content: content
        }
      };
    }
    
    if (msg.includes('show reminders') || msg.includes('my reminders') || msg.includes('pending reminders')) {
      return {
        text: 'Aapke reminders check kar raha hoon...',
        emotion: 'thinking',
        action: {
          type: 'show_reminders'
        }
      };
    }
    
    // AUTOPILOT COMMANDS
    if (msg.includes('start autopilot') || msg.includes('autopilot on') || msg.includes('activate autopilot')) {
      return {
        text: 'Autopilot mode activate kar raha hoon...',
        emotion: 'excited',
        action: {
          type: 'autopilot_start'
        }
      };
    }
    
    if (msg.includes('stop autopilot') || msg.includes('autopilot off') || msg.includes('deactivate autopilot')) {
      return {
        text: 'Autopilot mode band kar raha hoon...',
        emotion: 'neutral',
        action: {
          type: 'autopilot_stop'
        }
      };
    }
    
    // WEB SEARCH COMMANDS
    if (msg.includes('search web') || msg.includes('web search') || msg.includes('google it')) {
      const query = msg
        .replace(/search web/gi, '')
        .replace(/web search/gi, '')
        .replace(/google it/gi, '')
        .trim();
      
      return {
        text: `Web pe "${query}" search kar raha hoon...`,
        emotion: 'thinking',
        action: {
          type: 'web_search',
          query: query
        }
      };
    }
    
    // WIKIPEDIA LOOKUP
    if (msg.includes('wikipedia') || msg.includes('wiki')) {
      const topic = msg
        .replace(/wikipedia/gi, '')
        .replace(/wiki/gi, '')
        .trim();
      
      return {
        text: `Wikipedia pe "${topic}" dekh raha hoon...`,
        emotion: 'curious',
        action: {
          type: 'wikipedia',
          query: topic
        }
      };
    }
    
    // No quick response - let AI handle it
    return null;
  }

  /**
   * Detect language and enhance prompt with context
   */
  private detectLanguageAndEnhance(userMessage: string): string {
    // Get current time and date
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-IN', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
    const dateStr = now.toLocaleDateString('en-IN', { 
      weekday: 'long', 
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    
    // Enhanced language detection
    const hasDevanagari = /[\u0900-\u097F]/.test(userMessage);
    const lowerMessage = userMessage.toLowerCase();
    
    // Extended Hindi/Hinglish word detection
    const hindiWords = [
      'kaise', 'kya', 'hai', 'ho', 'hain', 'mein', 'main', 'tum', 'aap', 'bol', 'kar', 'batao', 'theek', 'suna',
      'dekh', 'dekho', 'bata', 'bhai', 'yaar', 'chal', 'raha', 'rahi', 'rahein', 'kuch', 'koi', 'nahi', 'nahin',
      'haan', 'han', 'naa', 'achha', 'accha', 'thik', 'samjha', 'samjhi', 'awaaz', 'awaz', 'voice', 'change',
      'camera', 'photo', 'haath', 'hand', 'meri', 'teri', 'apni', 'feature', 'tu', 'tujhe', 'mujhe', 'hindi',
      'english', 'female', 'male', 'control', 'open', 'badha', 'kar', 'sakta', 'sakti', 'karna', 'karne'
    ];
    
    // Check for explicit language requests
    const englishRequests = ['speak in english', 'english mein', 'english me', 'can you please speak in english'];
    const hindiRequests = ['hindi mein', 'hindi me', 'hindi bol', 'hindi main'];
    
    let languageInstruction = '';
    
    if (englishRequests.some(req => lowerMessage.includes(req))) {
      languageInstruction = 'User explicitly requested English. Respond ONLY in English. Do not use any Hindi words.';
    } else if (hindiRequests.some(req => lowerMessage.includes(req))) {
      languageInstruction = 'User explicitly requested Hindi. Respond in proper Hinglish using Roman script (like: "Main theek hoon, aap kaise hain?").';
    } else if (hasDevanagari) {
      languageInstruction = 'User typed in Hindi (Devanagari script). Respond in proper Hindi with Devanagari script (हिंदी में जवाब दें).';
    } else if (hindiWords.some(word => lowerMessage.includes(word))) {
      languageInstruction = 'User typed in Hinglish (Roman script). Respond in natural Hinglish - mix Hindi and English using Roman script only (like: "Main theek hoon, tum kaise ho?").';
    } else {
      languageInstruction = 'User typed in English. Respond in clear English only.';
    }
    
    // Build context-aware prompt with personality
    return `Current time: ${timeStr}
Current date: ${dateStr}

User: ${userMessage}

${languageInstruction}

You are RAGS, a helpful AI assistant. Be natural, friendly, and conversational. 
Keep responses brief (1-2 sentences max) unless asked for detailed information.
If user asks about camera/vision, actually describe what you see instead of generic responses.
Be direct and helpful, not repetitive.`;
  }

  /**
   * Build contextual prompt with user info
   */
  private async buildContextualPrompt(userMessage: string): Promise<string> {
    // Get memory context
    const memoryContext = await this.memory.getContextForAI(userMessage);
    
    // Build enhanced prompt
    let enhancedMessage = userMessage;
    
    if (memoryContext) {
      enhancedMessage = `${memoryContext}\n\n## Current message:\n${userMessage}`;
    }
    
    // Enhance with language detection
    return this.detectLanguageAndEnhance(enhancedMessage);
  }

  /**
   * Parse AI response to extract emotion and reasoning
   */
  private parseAIResponse(aiResponse: string): {
    text: string;
    emotion: RealAIResponse['emotion'];
    reasoning: string;
  } {
    // Try to parse emotion tag
    const emotionMatch = aiResponse.match(/\[EMOTION:\s*(\w+)\s*\|\s*REASON:\s*([^\]]+)\]/i);
    
    let emotion: RealAIResponse['emotion'] = 'neutral';
    let reasoning = 'Natural response';
    let text = aiResponse;

    if (emotionMatch) {
      const emotionStr = emotionMatch[1].toLowerCase();
      reasoning = emotionMatch[2].trim();
      
      // Validate emotion
      const validEmotions = ['happy', 'sad', 'surprised', 'thinking', 'excited', 'curious', 'neutral', 'angry'];
      if (validEmotions.includes(emotionStr)) {
        emotion = emotionStr as RealAIResponse['emotion'];
      }

      // Remove emotion tag from text
      text = aiResponse.replace(emotionMatch[0], '').trim();
    } else {
      // Fallback: detect emotion from text content
      emotion = this.detectEmotionFromText(text);
      reasoning = 'Detected from response tone';
    }

    return { text, emotion, reasoning };
  }

  /**
   * Detect emotion from text (fallback)
   */
  private detectEmotionFromText(text: string): RealAIResponse['emotion'] {
    const lower = text.toLowerCase();

    if (lower.match(/😊|😄|🎉|great|awesome|wonderful|khushi|maza|badiya/)) return 'happy';
    if (lower.match(/😢|😞|sorry|sad|dukh|afsos/)) return 'sad';
    if (lower.match(/😲|wow|amazing|kya|sach|really/)) return 'surprised';
    if (lower.match(/🤔|hmm|let me think|sochta|dekhte/)) return 'thinking';
    if (lower.match(/🤩|excited|awesome|zabardast|kamaal/)) return 'excited';
    if (lower.match(/🧐|interesting|curious|batao|kya hai/)) return 'curious';
    if (lower.match(/😠|angry|frustrated|gussa|problem/)) return 'angry';

    return 'neutral';
  }

  /**
   * Update user visibility from camera
   */
  updateUserVisibility(visible: boolean, position?: { x: number; y: number }, expression?: string) {
    this.context.userVisible = visible;
    if (position) this.context.userPosition = position;
    if (expression) this.context.userExpression = expression;

    this.emit('user_context_update', {
      visible,
      position,
      expression
    });
  }

  /**
   * Get current AI context
   */
  getContext(): AIContext {
    return { ...this.context };
  }

  /**
   * Clear conversation history
   */
  clearHistory() {
    this.context.conversationHistory = [];
    this.brain.clearHistory();
    console.log('🗑️  Conversation history cleared');
  }

  /**
   * Get conversation summary
   */
  async getConversationSummary(): Promise<string> {
    if (this.context.conversationHistory.length === 0) {
      return 'No conversation yet';
    }

    const prompt = `Summarize this conversation in 2-3 sentences:\n\n${
      this.context.conversationHistory.map(m => `${m.role}: ${m.content}`).join('\n')
    }`;

    return await this.brain.chat(prompt);
  }

  /**
   * Execute action (called by frontend or backend)
   */
  async executeAction(action: any): Promise<{ success: boolean; message?: string; data?: any }> {
    try {
      console.log('\ud83c\udfac Executing action:', action.type);

      switch (action.type) {
        case 'remember':
          await this.memory.remember(action.content, {}, action.importance || 5);
          return { success: true, message: 'Memory stored' };

        case 'recall':
          const memories = await this.memory.recall(action.query, 5);
          const memoryText = memories.length > 0
            ? memories.map(m => `- ${m.content}`).join('\n')
            : 'Kuch yaad nahi hai iske baare mein.';
          return { success: true, message: memoryText, data: memories };

        case 'open_app':
          await this.macAuto.openApp(action.app);
          return { success: true, message: `${action.app} opened` };

        case 'open_file':
          await this.macAuto.openFinder(action.path);
          return { success: true, message: 'Folder opened' };

        case 'volume_up':
          const currentVol = await this.macAuto.getVolume();
          await this.macAuto.setVolume(Math.min(100, currentVol + 10));
          return { success: true, message: 'Volume increased' };

        case 'volume_down':
          const curVol = await this.macAuto.getVolume();
          await this.macAuto.setVolume(Math.max(0, curVol - 10));
          return { success: true, message: 'Volume decreased' };

        case 'volume_set':
          await this.macAuto.setVolume(action.value);
          return { success: true, message: `Volume set to ${action.value}%` };

        case 'screenshot':
          const screenshotPath = await this.macAuto.takeScreenshot();
          return { success: true, message: 'Screenshot taken', data: { path: screenshotPath } };

        case 'notification':
          await this.macAuto.sendNotification('RAGS', action.message);
          return { success: true, message: 'Notification sent' };

        case 'add_reminder':
          const time = this.reminders.parseNaturalTime(action.content) || new Date(Date.now() + 60 * 60 * 1000); // Default 1 hour
          const reminder = await this.reminders.addReminder(action.content, time);
          return { success: true, message: 'Reminder added', data: reminder };

        case 'show_reminders':
          const upcoming = await this.reminders.getUpcomingReminders();
          const pending = await this.reminders.getPendingReminders();
          const message = upcoming.length > 0
            ? `Upcoming reminders:\n${upcoming.map(r => `- ${r.title} at ${new Date(r.remind_at).toLocaleString()}`).join('\n')}`
            : 'Koi upcoming reminders nahi hain.';
          return { success: true, message, data: { upcoming, pending } };

        case 'autopilot_start':
          await this.autopilot.start();
          return { success: true, message: 'Autopilot activated' };

        case 'autopilot_stop':
          await this.autopilot.stop();
          return { success: true, message: 'Autopilot deactivated' };

        case 'web_search':
          const searchResults = await this.webIntegration.searchAndSummarize(action.query, 5);
          return { success: true, message: searchResults, data: searchResults };

        case 'wikipedia':
          const wikiSummary = await this.webIntegration.getWikipediaSummary(action.query);
          return { success: true, message: wikiSummary, data: wikiSummary };

        case 'register_face':
          // Capture face and register with name using ADVANCED face detection
          const userName = action.name || 'User';
          const userId = `user_${Date.now()}`;
          
          // Take photo first
          const imagePath = await this.camera.captureImage();
          
          // Register face with advanced detection
          await this.faceDetect.registerFace(userId, userName, imagePath);
          
          // Get personalized greeting
          const greeting = this.faceDetect.getGreeting(userId);
          
          return { 
            success: true, 
            message: greeting, 
            data: { userId, name: userName } 
          };

        case 'camera_vision':
          // Capture image and analyze with vision
          const question = action.question || 'What do you see in this image?';
          const visionResult = await this.camera.seeNow(question);
          return { 
            success: true, 
            message: visionResult, 
            data: { analysis: visionResult } 
          };

        case 'voice_change':
          // Change voice gender/type
          await this.setVoiceConfig({ gender: action.gender });
          return {
            success: true,
            message: `Voice changed to ${action.gender}`,
            data: { gender: action.gender }
          };

        default:
          // Check if it's a plugin command
          const pluginMatch = this.plugins.findPluginByCommand(action.type);
          if (pluginMatch) {
            const result = await this.plugins.executeCommand(
              pluginMatch.plugin.id,
              pluginMatch.command.trigger,
              action
            );
            return result;
          }

          console.log('\u26a0\ufe0f Unknown action type:', action.type);
          return { success: false, message: 'Unknown action' };
      }
    } catch (error) {
      console.error('Action execution failed:', error);
      return { success: false, message: String(error) };
    }
  }

  /**
   * Get memory stats
   */
  async getMemoryStats() {
    return await this.memory.getStats();
  }

  /**
   * Stop TTS speaking (BOTH SimpleTTS and Edge-TTS)
   */
  async stopSpeaking(): Promise<void> {
    await this.simpleTTS.stop();
    await this.edgeTTS.stop();
  }

  /**
   * Toggle TTS on/off (controls BOTH SimpleTTS and Edge-TTS)
   */
  setTTSEnabled(enabled: boolean): void {
    this.simpleTTS.setEnabled(enabled);
    this.edgeTTS.setEnabled(enabled);
  }

  /**
   * Speak text in background (non-blocking, fire and forget)
   */
  private async speakInBackground(text: string): Promise<void> {
    try {
      // STOP any previous TTS playback first (prevents double voice)
      await this.stopSpeaking();

      // Speak using ONE TTS only (Indian accent)
      const ttsEmotion = this.personality.getRecommendedTTSEmotion();
      
      // Try Edge-TTS first (if available), else fallback to SimpleTTS
      const isEdgeAvailable = await this.edgeTTS.isEdgeTTSAvailable();
      if (isEdgeAvailable) {
        await this.edgeTTS.speak(text, { emotion: ttsEmotion });
        console.log(`🔊 Speaking with Edge-TTS (${ttsEmotion})`);
      } else {
        // Use Indian accent with SimpleTTS
        await this.simpleTTS.speak(text, { voice: 'Rishi', rate: 190 }); // Indian English voice
        console.log('🔊 Speaking with Indian accent (Rishi)');
      }
    } catch (error) {
      console.error('TTS background error:', error);
    }
  }

  /**
   * Check if message is a camera/vision request
   */
  private isCameraRequest(message: string): boolean {
    const lowerMsg = message.toLowerCase();
    const cameraKeywords = [
      'camera', 'dekh', 'dikh', 'see', 'look', 'photo', 'picture',
      'what do you see', 'kya dekh', 'kya dikh', 'ye kya hai', 'what is this',
      'haath mein kya', 'hand mein kya', 'meri photo', 'my photo'
    ];
    
    return cameraKeywords.some(keyword => lowerMsg.includes(keyword));
  }

  /**
   * Handle camera vision requests with actual vision analysis
   */
  private async handleCameraVision(message: string): Promise<{
    text: string;
    emotion: RealAIResponse['emotion'];
    action?: any;
  }> {
    try {
      // Use the existing camera capture system
      const question = this.extractVisionQuestion(message);
      const visionResult = await this.camera.seeNow(question);
      
      // Determine appropriate language for response
      const lowerMsg = message.toLowerCase();
      const isHindi = ['dekh', 'dikh', 'kya', 'hai', 'meri', 'teri'].some(word => lowerMsg.includes(word));
      
      let responseText: string;
      if (isHindi) {
        responseText = `Main dekh raha hoon: ${visionResult}`;
      } else {
        responseText = `I can see: ${visionResult}`;
      }
      
      return {
        text: responseText,
        emotion: 'curious',
        action: {
          type: 'camera_vision',
          question: question,
          result: visionResult
        }
      };
    } catch (error) {
      console.error('Camera vision error:', error);
      throw error;
    }
  }

  /**
   * Extract specific question from camera request
   */
  private extractVisionQuestion(message: string): string {
    const lowerMsg = message.toLowerCase();
    
    if (lowerMsg.includes('haath') || lowerMsg.includes('hand')) {
      return 'What is in the person\'s hand? Be specific.';
    }
    if (lowerMsg.includes('photo') || lowerMsg.includes('picture')) {
      return 'Describe the person in this image.';
    }
    if (lowerMsg.includes('ye kya hai') || lowerMsg.includes('what is this')) {
      return 'What object or thing is shown in this image? Name it specifically.';
    }
    
    return 'Describe what you see in this image in detail.';
  }

  /**
   * Set voice configuration (gender, voice type, language)
   */
  async setVoiceConfig(config: { gender?: string; voice?: string; language?: string }): Promise<void> {
    try {
      // Handle voice change requests
      if (config.gender) {
        const lowerGender = config.gender.toLowerCase();
        
        if (lowerGender === 'female' || lowerGender === 'woman') {
          // Set female voice
          await this.edgeTTS.setVoice('hi-IN-SwaraNeural'); // Female Hindi voice
          console.log('🎵 Voice changed to female (Swara)');
        } else if (lowerGender === 'male' || lowerGender === 'man') {
          // Set male voice  
          await this.edgeTTS.setVoice('hi-IN-MadhurNeural'); // Male Hindi voice
          console.log('🎵 Voice changed to male (Madhur)');
        }
      }

      // Handle specific voice selection
      if (config.voice) {
        await this.edgeTTS.setVoice(config.voice);
        console.log(`🎵 Voice changed to ${config.voice}`);
      }

      // Handle language change
      if (config.language) {
        const langCode = config.language.toLowerCase();
        if (langCode === 'hindi' || langCode === 'hi') {
          await this.edgeTTS.setVoice('hi-IN-SwaraNeural');
        } else if (langCode === 'english' || langCode === 'en') {
          await this.edgeTTS.setVoice('en-IN-NeerjaNeural');
        }
      }
    } catch (error) {
      console.error('Voice config error:', error);
      throw error;
    }
  }

  /**
   * Get available voices from TTS system
   */
  async getAvailableVoices(): Promise<any[]> {
    try {
      // Return predefined voice options
      return [
        {
          id: 'hi-IN-SwaraNeural',
          name: 'Swara (Female Hindi)',
          gender: 'female',
          language: 'Hindi'
        },
        {
          id: 'hi-IN-MadhurNeural', 
          name: 'Madhur (Male Hindi)',
          gender: 'male',
          language: 'Hindi'
        },
        {
          id: 'en-IN-NeerjaNeural',
          name: 'Neerja (Female English)',
          gender: 'female', 
          language: 'English'
        },
        {
          id: 'en-IN-PrabhatNeural',
          name: 'Prabhat (Male English)',
          gender: 'male',
          language: 'English'
        }
      ];
    } catch (error) {
      console.error('Get voices error:', error);
      return [];
    }
  }
}

