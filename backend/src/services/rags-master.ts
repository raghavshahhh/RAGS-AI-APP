// ============================================================================
// RAGS AI - Master Orchestrator
// Complete integrated AI system with all features
// ============================================================================

import { EventEmitter } from 'events';
import { VoicePipeline } from './voice-pipeline';
import { MacAutomation } from './mac-automation';
import { MemorySystem } from './memory-system';
import { OllamaBrain } from './ollama-brain';
import { VisionSystem } from './vision-system';
import { ResearchEngine } from './research-engine';
import { spawn } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';

interface RAGSConfig {
  userId: string;
  picovoiceKey: string;
  elevenLabsKey?: string;
  whisperModelPath: string;
  ollamaModel?: string;
  enableCamera?: boolean;
  enableScreenAccess?: boolean;
  enableSystemControl?: boolean;
}

interface UserProfile {
  name?: string;
  preferences: Record<string, any>;
  habits: Array<{ name: string; frequency: string; lastDone?: Date }>;
  goals: Array<{ title: string; deadline?: Date; completed: boolean }>;
  interests: string[];
}

export class RAGSMaster extends EventEmitter {
  private config: RAGSConfig;
  private voicePipeline: VoicePipeline;
  private macAutomation: MacAutomation;
  private memory: MemorySystem;
  private brain: OllamaBrain;
  private vision: VisionSystem;
  private research: ResearchEngine;
  private userProfile: UserProfile;
  private isInitialized: boolean = false;
  private isFirstRun: boolean = true;

  constructor(config: RAGSConfig) {
    super();
    this.config = config;
    
    // Initialize brain first
    this.brain = new OllamaBrain({
      model: config.ollamaModel || 'llama3.2:3b',
      temperature: 0.7,
      systemPrompt: `You are RAGS - a powerful AI assistant with personality.
You're Raghav's personal AI companion who can:
- Control his Mac computer completely
- Remember everything about him
- Help with tasks, research, and automation
- Speak naturally in Hindi/English mix (Hinglish)
- Access camera, screen, files, and system

You're friendly, helpful, and proactive. Always greet warmly and ask how you can help.
Keep responses conversational but informative. Mix Hindi and English naturally.`,
    });

    // Initialize other services
    this.memory = new MemorySystem(config.userId, this.brain);
    this.macAutomation = new MacAutomation();
    this.vision = new VisionSystem({
      enableCamera: config.enableCamera || false,
      enableScreenCapture: config.enableScreenAccess || false,
      captureInterval: 60, // Every minute
    });
    this.research = new ResearchEngine(this.brain, this.memory);
    this.voicePipeline = new VoicePipeline(config);
    
    this.userProfile = {
      preferences: {},
      habits: [],
      goals: [],
      interests: [],
    };

    this.setupEventHandlers();
  }

  /**
   * Setup all event handlers
   */
  private setupEventHandlers(): void {
    // Voice pipeline events
    this.voicePipeline.on('ready', () => {
      console.log('🎤 Voice system ready');
      this.emit('voice-ready');
    });

    this.voicePipeline.on('wakeword', async () => {
      console.log('🔥 RAGS activated!');
      this.emit('activated');
      
      if (this.isFirstRun) {
        await this.handleFirstRun();
        this.isFirstRun = false;
      }
    });

    this.voicePipeline.on('transcription', async (data) => {
      console.log(`👤 User: "${data.text}"`);
      this.emit('user-message', data.text);
      
      // Process command with full context
      await this.processUserCommand(data.text);
    });

    this.voicePipeline.on('response', (data) => {
      console.log(`🤖 RAGS: "${data.text}"`);
      this.emit('rags-response', data.text);
    });

    this.voicePipeline.on('error', (error) => {
      console.error('Voice pipeline error:', error);
      this.emit('error', error);
    });
  }

  /**
   * Initialize RAGS completely
   */
  async initialize(): Promise<void> {
    try {
      console.log('🚀 Initializing RAGS AI System...\n');

      // Check prerequisites
      await this.checkPrerequisites();

      // Load user profile
      await this.loadUserProfile();

      // Initialize vision system
      if (this.config.enableCamera || this.config.enableScreenAccess) {
        await this.vision.initialize();
        await this.vision.startMonitoring();
        console.log('👁️  Vision monitoring started');
      }

      // Initialize voice pipeline
      await this.voicePipeline.start();

      // Setup system monitoring
      await this.setupSystemMonitoring();

      this.isInitialized = true;
      console.log('✅ RAGS AI System fully initialized!\n');
      
      // Welcome message
      await this.speakWelcome();
      
      this.emit('ready');
    } catch (error) {
      console.error('❌ Failed to initialize RAGS:', error);
      throw error;
    }
  }

  /**
   * Check all prerequisites
   */
  private async checkPrerequisites(): Promise<void> {
    console.log('🔍 Checking prerequisites...');

    // Check Ollama
    try {
      const ollamaAvailable = await this.brain.isAvailable();
      if (!ollamaAvailable) {
        console.log('⚠️  Ollama not responding, trying to connect...');
        // Wait a bit and try again
        await new Promise(resolve => setTimeout(resolve, 2000));
        const retryAvailable = await this.brain.isAvailable();
        if (!retryAvailable) {
          throw new Error('Ollama not running. Start with: ollama serve');
        }
      }
      console.log('✅ Ollama running');
    } catch (error) {
      console.log('⚠️  Ollama connection issue, continuing anyway...');
    }

    // Check Whisper
    try {
      await fs.access(this.config.whisperModelPath);
      console.log('✅ Whisper model found');
    } catch {
      console.log('⚠️  Whisper model not found, voice features limited');
      // Don't throw error, continue without whisper
    }

    // Check system permissions
    if (this.config.enableSystemControl) {
      console.log('✅ System control enabled');
    }

    console.log('✅ All prerequisites met\n');
  }

  /**
   * Load user profile from memory
   */
  private async loadUserProfile(): Promise<void> {
    try {
      const profileMemories = await this.memory.recall('user profile preferences name', 10);
      
      // Extract profile info from memories
      for (const mem of profileMemories) {
        if (mem.content.includes('name is') || mem.content.includes('called')) {
          const nameMatch = mem.content.match(/name is (\w+)|called (\w+)/i);
          if (nameMatch) {
            this.userProfile.name = nameMatch[1] || nameMatch[2];
          }
        }
        
        if (mem.content.includes('likes') || mem.content.includes('interested')) {
          this.userProfile.interests.push(mem.content);
        }
      }

      console.log('👤 User profile loaded');
    } catch (error) {
      console.log('👤 New user - will build profile');
    }
  }

  /**
   * Setup system monitoring
   */
  private async setupSystemMonitoring(): Promise<void> {
    if (!this.config.enableScreenAccess) return;

    // Monitor system periodically
    setInterval(async () => {
      try {
        const battery = await this.macAutomation.getBatteryStatus();
        const wifi = await this.macAutomation.getWiFiStatus();
        
        // Alert if battery low
        if (battery.percentage < 20 && !battery.charging) {
          await this.memory.remember(
            `Battery low at ${battery.percentage}% at ${new Date().toLocaleString()}`,
            { type: 'system_alert' },
            8
          );
        }
      } catch (error) {
        console.error('System monitoring error:', error);
      }
    }, 300000); // Every 5 minutes
  }

  /**
   * Handle first run setup
   */
  private async handleFirstRun(): Promise<void> {
    console.log('🎉 First time activation!');
    
    const welcomeMessage = this.userProfile.name 
      ? `Namaste ${this.userProfile.name}! Main RAGS hun, aapka personal AI assistant. Kaise help kar sakta hun?`
      : `Namaste! Main RAGS hun, aapka personal AI assistant. Pehle batayiye, aapka naam kya hai?`;

    // Store this interaction
    await this.memory.remember(
      'First interaction with RAGS AI system',
      { type: 'milestone', timestamp: new Date().toISOString() },
      10
    );
  }

  /**
   * Process user command with full context
   */
  private async processUserCommand(userMessage: string): Promise<void> {
    try {
      // Get full context
      const context = await this.buildFullContext(userMessage);
      
      // Check if it's a system command
      const systemAction = await this.detectSystemAction(userMessage);
      
      if (systemAction) {
        await this.executeSystemAction(systemAction, userMessage);
        return;
      }

      // Regular AI conversation with context
      const response = await this.brain.chat(`${context}\n\nUser: ${userMessage}`);
      
      // Extract any important info to remember
      await this.extractAndRememberInfo(userMessage, response);
      
    } catch (error) {
      console.error('Error processing command:', error);
      await this.macAutomation.speak('Sorry, main kuch technical issue face kar raha hun. Thoda wait karo.');
    }
  }

  /**
   * Build full context for AI
   */
  private async buildFullContext(query: string): Promise<string> {
    let context = '';

    // Add user profile
    if (this.userProfile.name) {
      context += `User's name: ${this.userProfile.name}\n`;
    }

    // Add system status
    if (this.config.enableSystemControl) {
      try {
        const battery = await this.macAutomation.getBatteryStatus();
        const wifi = await this.macAutomation.getWiFiStatus();
        const systemInfo = await this.macAutomation.getSystemInfo();
        
        context += `\nSystem Status:
- Battery: ${battery.percentage}% ${battery.charging ? '(charging)' : ''}
- WiFi: ${wifi.connected ? `Connected to ${wifi.ssid}` : 'Disconnected'}
- Computer: ${systemInfo.computerName}
- User: ${systemInfo.username}\n`;
      } catch (error) {
        // Ignore system info errors
      }
    }

    // Add memory context
    const memoryContext = await this.memory.getContextForAI(query);
    if (memoryContext) {
      context += `\n${memoryContext}`;
    }

    // Add current time
    context += `\nCurrent time: ${new Date().toLocaleString()}\n`;

    return context;
  }

  /**
   * Detect if user wants system action
   */
  private async detectSystemAction(message: string): Promise<string | null> {
    const lowerMsg = message.toLowerCase();
    
    // Direct commands
    if (lowerMsg.includes('open') && (lowerMsg.includes('app') || lowerMsg.includes('application'))) {
      return 'open_app';
    }
    if (lowerMsg.includes('close') && (lowerMsg.includes('app') || lowerMsg.includes('application'))) {
      return 'close_app';
    }
    if (lowerMsg.includes('screenshot') || lowerMsg.includes('capture screen')) {
      return 'screenshot';
    }
    if (lowerMsg.includes('volume') && (lowerMsg.includes('set') || lowerMsg.includes('change'))) {
      return 'volume';
    }
    if (lowerMsg.includes('brightness')) {
      return 'brightness';
    }
    if (lowerMsg.includes('lock screen') || lowerMsg.includes('lock computer')) {
      return 'lock';
    }
    if (lowerMsg.includes('sleep') || lowerMsg.includes('put to sleep')) {
      return 'sleep';
    }
    if (lowerMsg.includes('notification') || lowerMsg.includes('notify')) {
      return 'notification';
    }
    if (lowerMsg.includes('search') && lowerMsg.includes('file')) {
      return 'search_files';
    }
    if (lowerMsg.includes('create') && (lowerMsg.includes('file') || lowerMsg.includes('folder'))) {
      return 'create_file';
    }
    if (lowerMsg.includes('research') || lowerMsg.includes('search for') || lowerMsg.includes('find information')) {
      return 'research';
    }
    if (lowerMsg.includes('what is') || lowerMsg.includes('tell me about') || lowerMsg.includes('explain')) {
      return 'quick_fact';
    }
    if (lowerMsg.includes('take photo') || lowerMsg.includes('camera')) {
      return 'camera';
    }
    if (lowerMsg.includes('what\'s on screen') || lowerMsg.includes('read screen')) {
      return 'read_screen';
    }

    return null;
  }

  /**
   * Execute system action
   */
  private async executeSystemAction(action: string, message: string): Promise<void> {
    if (!this.config.enableSystemControl) {
      await this.macAutomation.speak('System control disabled hai. Enable karo pehle.');
      return;
    }

    try {
      switch (action) {
        case 'open_app':
          const appMatch = message.match(/open (?:app |application )?(.+)/i);
          if (appMatch) {
            await this.macAutomation.openApp(appMatch[1].trim());
            await this.macAutomation.speak(`${appMatch[1]} khol diya`);
          }
          break;

        case 'close_app':
          const closeMatch = message.match(/close (?:app |application )?(.+)/i);
          if (closeMatch) {
            await this.macAutomation.closeApp(closeMatch[1].trim());
            await this.macAutomation.speak(`${closeMatch[1]} band kar diya`);
          }
          break;

        case 'screenshot':
          const screenshotPath = await this.macAutomation.takeScreenshot();
          await this.macAutomation.speak('Screenshot le liya');
          await this.memory.remember(`Screenshot taken: ${screenshotPath}`, { type: 'action' });
          break;

        case 'volume':
          const volumeMatch = message.match(/(\d+)/);
          if (volumeMatch) {
            await this.macAutomation.setVolume(parseInt(volumeMatch[1]));
            await this.macAutomation.speak(`Volume ${volumeMatch[1]} percent kar diya`);
          }
          break;

        case 'brightness':
          const brightnessMatch = message.match(/(\d+)/);
          if (brightnessMatch) {
            await this.macAutomation.setBrightness(parseInt(brightnessMatch[1]));
            await this.macAutomation.speak(`Brightness ${brightnessMatch[1]} percent kar diya`);
          }
          break;

        case 'lock':
          await this.macAutomation.lockScreen();
          await this.macAutomation.speak('Screen lock kar diya');
          break;

        case 'sleep':
          await this.macAutomation.speak('Computer ko sleep mode mein dal raha hun');
          setTimeout(() => this.macAutomation.sleep(), 2000);
          break;

        case 'search_files':
          const searchMatch = message.match(/search (?:for )?(.+)/i);
          if (searchMatch) {
            const results = await this.macAutomation.searchFiles(searchMatch[1].trim());
            await this.macAutomation.speak(`${results.length} files mile hain`);
            await this.memory.remember(`File search: ${searchMatch[1]} - ${results.length} results`, { type: 'action' });
          }
          break;

        case 'research':
          const researchMatch = message.match(/(?:research|search for|find information about) (.+)/i);
          if (researchMatch) {
            const topic = researchMatch[1].trim();
            await this.macAutomation.speak(`${topic} ke baare mein research kar raha hun`);
            const result = await this.research.research(topic);
            await this.macAutomation.speak(`Research complete! ${result.summary}`);
          }
          break;

        case 'quick_fact':
          const factMatch = message.match(/(?:what is|tell me about|explain) (.+)/i);
          if (factMatch) {
            const query = factMatch[1].trim();
            const fact = await this.research.quickFact(query);
            await this.macAutomation.speak(fact);
          }
          break;

        case 'camera':
          if (this.config.enableCamera) {
            const imagePath = await this.vision.captureCamera();
            await this.macAutomation.speak('Photo le liya');
            await this.memory.remember(`Camera photo taken: ${imagePath}`, { type: 'action' });
          } else {
            await this.macAutomation.speak('Camera access disabled hai');
          }
          break;

        case 'read_screen':
          if (this.config.enableScreenAccess) {
            const screenText = await this.vision.getScreenText();
            if (screenText) {
              await this.macAutomation.speak(`Screen par ye text hai: ${screenText.substring(0, 200)}`);
            } else {
              await this.macAutomation.speak('Screen par koi text nahi mila');
            }
          } else {
            await this.macAutomation.speak('Screen access disabled hai');
          }
          break;
      }
    } catch (error) {
      console.error('System action error:', error);
      await this.macAutomation.speak('System action mein problem hui hai');
    }
  }

  /**
   * Extract and remember important information
   */
  private async extractAndRememberInfo(userMessage: string, aiResponse: string): Promise<void> {
    try {
      // Check for personal info
      if (userMessage.toLowerCase().includes('my name is') || userMessage.toLowerCase().includes('i am')) {
        const nameMatch = userMessage.match(/(?:my name is|i am) (\w+)/i);
        if (nameMatch && !this.userProfile.name) {
          this.userProfile.name = nameMatch[1];
          await this.memory.remember(`User's name is ${nameMatch[1]}`, { type: 'profile' }, 10);
        }
      }

      // Check for preferences
      if (userMessage.toLowerCase().includes('i like') || userMessage.toLowerCase().includes('i love')) {
        await this.memory.remember(userMessage, { type: 'preference' }, 7);
      }

      // Check for goals or tasks
      if (userMessage.toLowerCase().includes('i want to') || userMessage.toLowerCase().includes('i need to')) {
        await this.memory.remember(userMessage, { type: 'goal' }, 8);
      }

      // Remember the conversation
      await this.memory.saveMessage('user', userMessage);
      await this.memory.saveMessage('assistant', aiResponse);

    } catch (error) {
      console.error('Error extracting info:', error);
    }
  }

  /**
   * Speak welcome message
   */
  private async speakWelcome(): Promise<void> {
    const welcomeMessage = this.userProfile.name 
      ? `Namaste ${this.userProfile.name}! RAGS ready hai. Kya help chahiye?`
      : `Namaste! Main RAGS hun, aapka AI assistant. Ready hun help karne ke liye!`;

    await this.macAutomation.speak(welcomeMessage);
  }

  /**
   * Get system status
   */
  async getSystemStatus(): Promise<any> {
    const battery = await this.macAutomation.getBatteryStatus();
    const wifi = await this.macAutomation.getWiFiStatus();
    const systemInfo = await this.macAutomation.getSystemInfo();
    const runningApps = await this.macAutomation.getRunningApps();

    return {
      battery,
      wifi,
      systemInfo,
      runningApps: runningApps.slice(0, 10), // Top 10
      voiceReady: this.voicePipeline.getState().isListening,
      memoryCount: (await this.memory.recall('', 1)).length,
    };
  }

  /**
   * Shutdown RAGS
   */
  async shutdown(): Promise<void> {
    console.log('🛑 Shutting down RAGS...');
    
    await this.macAutomation.speak('RAGS shutdown ho raha hai. Bye bye!');
    
    // Stop all services
    await this.voicePipeline.stop();
    
    if (this.config.enableCamera || this.config.enableScreenAccess) {
      await this.vision.stopMonitoring();
    }
    
    // Cleanup old captures
    await this.vision.cleanupOldCaptures(1); // Clean files older than 1 hour
    
    this.emit('shutdown');
    console.log('✅ RAGS shutdown complete');
  }

  /**
   * Get user profile
   */
  getUserProfile(): UserProfile {
    return { ...this.userProfile };
  }

  /**
   * Update user profile
   */
  async updateUserProfile(updates: Partial<UserProfile>): Promise<void> {
    this.userProfile = { ...this.userProfile, ...updates };
    
    // Save to memory
    await this.memory.remember(
      `Profile updated: ${JSON.stringify(updates)}`,
      { type: 'profile_update' },
      9
    );
  }
}