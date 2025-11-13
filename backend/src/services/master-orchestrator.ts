// ============================================================================
// RAGS AI - Master Orchestrator (Integration Layer)
// Connects all services together
// ============================================================================

import { OllamaBrain } from './ollama-brain';
import { MemorySystem } from './memory-system';
import { AgentEngine } from './agent-engine';
import { ActionGraphEngine } from './action-graph';
import { AutopilotEngine } from './autopilot';
import { ContentGenerator } from './content-generator';
import { SocialMediaManager } from './social-media-manager';
import { PersonalityEngine } from './personality-engine';
import { MacAutomation } from './mac-automation';
import { AutomationService } from './automation';
import { VoicePipeline, PipelineConfig } from './voice-pipeline';
import { EventEmitter } from 'events';

export interface RAGSConfig {
  userId: string;
  picovoiceKey: string;
  elevenLabsKey?: string;
  openaiKey?: string;
  whisperModelPath: string;
  ollamaModel?: string;
  socialTokens?: {
    instagram?: string;
    twitter?: string;
    linkedin?: string;
  };
}

export class MasterOrchestrator extends EventEmitter {
  // Core AI services
  private brain: OllamaBrain;
  private memory: MemorySystem;
  
  // Agent services
  private agent: AgentEngine;
  private actionGraph: ActionGraphEngine;
  private autopilot: AutopilotEngine;
  
  // Content & Social
  private contentGenerator: ContentGenerator;
  private socialManager: SocialMediaManager;
  
  // Personality & Automation
  private personality: PersonalityEngine;
  private macAuto: MacAutomation;
  private automation: AutomationService;
  
  // Voice pipeline
  private voicePipeline: VoicePipeline;
  
  // State
  private isInitialized = false;
  private config: RAGSConfig;

  constructor(config: RAGSConfig) {
    super();
    this.config = config;

    // Initialize all services
    this.brain = new OllamaBrain({
      model: config.ollamaModel || 'llama3.2:3b',
    });

    this.memory = new MemorySystem(config.userId, this.brain);
    
    this.agent = new AgentEngine(this.brain, this.memory);
    this.actionGraph = new ActionGraphEngine(this.agent);
    this.autopilot = new AutopilotEngine(this.agent, this.actionGraph, this.memory);
    
    this.contentGenerator = new ContentGenerator(this.brain, config.openaiKey);
    this.socialManager = new SocialMediaManager(this.contentGenerator, config.socialTokens);
    
    this.personality = new PersonalityEngine(this.brain, this.memory);
    this.macAuto = new MacAutomation();
    this.automation = new AutomationService();
    
    // Voice pipeline
    const pipelineConfig: PipelineConfig = {
      userId: config.userId,
      picovoiceKey: config.picovoiceKey,
      elevenLabsKey: config.elevenLabsKey,
      whisperModelPath: config.whisperModelPath,
      ollamaModel: config.ollamaModel,
      autoStart: false,
    };
    
    this.voicePipeline = new VoicePipeline(pipelineConfig);

    // Register advanced actions
    this.registerAdvancedActions();
    
    // Setup event forwarding
    this.setupEventForwarding();
  }

  /**
   * Initialize RAGS
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('⚠️ RAGS already initialized');
      return;
    }

    console.log('🚀 Initializing RAGS AI...');

    try {
      // Check Ollama availability
      const ollamaAvailable = await this.brain.isAvailable();
      if (!ollamaAvailable) {
        throw new Error('Ollama is not running. Please start Ollama first.');
      }

      // Load memory
      await this.memory.remember(
        'RAGS AI initialized successfully',
        { type: 'system', event: 'initialization' },
        8
      );

      this.isInitialized = true;
      console.log('✅ RAGS AI initialized successfully!');
      this.emit('initialized');
    } catch (error: any) {
      console.error('❌ Initialization failed:', error.message);
      throw error;
    }
  }

  /**
   * Start voice pipeline
   */
  async startVoice(): Promise<void> {
    console.log('🎤 Starting voice pipeline...');
    await this.voicePipeline.start();
    this.emit('voice:started');
  }

  /**
   * Stop voice pipeline
   */
  async stopVoice(): Promise<void> {
    console.log('🛑 Stopping voice pipeline...');
    await this.voicePipeline.stop();
    this.emit('voice:stopped');
  }

  /**
   * Start autopilot mode
   */
  startAutopilot(): void {
    console.log('🤖 Starting autopilot mode...');
    this.autopilot.start();
    this.emit('autopilot:started');
  }

  /**
   * Stop autopilot mode
   */
  stopAutopilot(): void {
    console.log('🛑 Stopping autopilot mode...');
    this.autopilot.stop();
    this.emit('autopilot:stopped');
  }

  /**
   * Process user command (text or voice)
   */
  async processCommand(input: string): Promise<string> {
    console.log(`💬 Processing: "${input}"`);

    try {
      // Save to memory
      await this.memory.saveMessage('user', input);

      // Get personality response
      const personalityResponse = await this.personality.respond(input);

      // Decide on actions
      const decision = await this.agent.decide(input);

      // Execute actions if any
      if (decision.actions.length > 0) {
        console.log(`⚡ Executing ${decision.actions.length} actions...`);
        await this.agent.executeActions(decision.actions);
      }

      // Save assistant response
      await this.memory.saveMessage('assistant', personalityResponse.text);

      this.emit('command:processed', { input, response: personalityResponse.text });

      return personalityResponse.text;
    } catch (error: any) {
      console.error('❌ Command processing failed:', error.message);
      return `Sorry bhai, kuch error ho gaya: ${error.message}`;
    }
  }

  /**
   * Generate and post content
   */
  async autoPostContent(topic: string, platforms: string[] = ['instagram']): Promise<void> {
    console.log(`📱 Auto-posting: "${topic}" to ${platforms.join(', ')}`);

    try {
      const posts = await this.socialManager.autoPost(topic, platforms);
      
      console.log(`✅ Posted to ${posts.length} platforms`);
      this.emit('content:posted', posts);

      // Remember this
      await this.memory.remember(
        `Auto-posted content about "${topic}" to ${platforms.join(', ')}`,
        { type: 'content', topic, platforms, posts: posts.length },
        7
      );
    } catch (error: any) {
      console.error('❌ Auto-post failed:', error.message);
      throw error;
    }
  }

  /**
   * Execute Mac automation
   */
  async executeMacAutomation(action: string, params: any): Promise<any> {
    console.log(`🖥️ Mac automation: ${action}`);

    switch (action) {
      case 'open_app':
        return await this.macAuto.openApp(params.appName);
      
      case 'close_app':
        return await this.macAuto.closeApp(params.appName);
      
      case 'take_screenshot':
        return await this.macAuto.takeScreenshot(params.savePath);
      
      case 'set_volume':
        return await this.macAuto.setVolume(params.level);
      
      case 'send_notification':
        return await this.macAuto.sendNotification(params.title, params.message);
      
      case 'run_shortcut':
        return await this.macAuto.runShortcut(params.shortcutName, params.input);
      
      default:
        throw new Error(`Unknown Mac automation: ${action}`);
    }
  }

  /**
   * Get RAGS status
   */
  async getStatus(): Promise<{
    initialized: boolean;
    voice: any;
    autopilot: any;
    personality: any;
    memory: any;
  }> {
    const history = await this.memory.getConversationHistory();
    return {
      initialized: this.isInitialized,
      voice: this.voicePipeline.getState(),
      autopilot: this.autopilot.getStatus(),
      personality: this.personality.getPersonalityStats(),
      memory: {
        conversationCount: history.length,
      },
    };
  }

  /**
   * Register advanced actions with real implementations
   */
  private registerAdvancedActions(): void {
    // Content generation actions
    this.agent.registerAction('generate_instagram_post', async (params: any) => {
      const content = await this.contentGenerator.generateInstagramPost(params.topic);
      return content;
    });

    this.agent.registerAction('generate_twitter_thread', async (params: any) => {
      const tweets = await this.contentGenerator.generateTwitterThread(params.topic, params.count || 5);
      return tweets;
    });

    this.agent.registerAction('generate_blog_post', async (params: any) => {
      const blog = await this.contentGenerator.generateBlogPost(params.topic);
      return blog;
    });

    // Social media actions
    this.agent.registerAction('post_to_instagram', async (params: any) => {
      return await this.socialManager.postToInstagram(params.content, params.imageUrl);
    });

    this.agent.registerAction('auto_post_content', async (params: any) => {
      return await this.socialManager.autoPost(params.topic, params.platforms || ['instagram']);
    });

    // Mac automation actions
    this.agent.registerAction('mac_open_app', async (params: any) => {
      return await this.macAuto.openApp(params.appName);
    });

    this.agent.registerAction('mac_take_screenshot', async (params: any) => {
      return await this.macAuto.takeScreenshot();
    });

    this.agent.registerAction('mac_set_volume', async (params: any) => {
      return await this.macAuto.setVolume(params.level);
    });

    this.agent.registerAction('mac_run_shortcut', async (params: any) => {
      return await this.macAuto.runShortcut(params.shortcutName, params.input);
    });

    // Life management actions (enhanced)
    this.agent.registerAction('get_life_score', async () => {
      return this.personality.getLifeScore();
    });

    this.agent.registerAction('generate_motivation', async () => {
      return await this.personality.generateMotivation();
    });

    this.agent.registerAction('suggest_activities', async () => {
      return this.personality.suggestActivities();
    });

    console.log('✅ Registered all advanced actions');
  }

  /**
   * Setup event forwarding from all services
   */
  private setupEventForwarding(): void {
    // Forward agent events
    this.agent.on('decision', (decision) => {
      this.emit('agent:decision', decision);
    });

    this.agent.on('action:complete', (action) => {
      this.emit('agent:action', action);
    });

    // Forward autopilot events
    this.autopilot.on('routine:start', (routine) => {
      this.emit('autopilot:routine', routine);
    });

    // Forward voice pipeline events
    this.voicePipeline.on('wakeword', () => {
      this.emit('voice:wakeword');
    });

    this.voicePipeline.on('transcription', (text) => {
      this.emit('voice:transcription', text);
    });

    this.voicePipeline.on('response', (text) => {
      this.emit('voice:response', text);
    });
  }

  /**
   * Shutdown RAGS
   */
  async shutdown(): Promise<void> {
    console.log('👋 Shutting down RAGS...');

    await this.stopVoice();
    this.stopAutopilot();

    // Save final memory
    await this.memory.remember(
      'RAGS AI shut down',
      { type: 'system', event: 'shutdown' },
      6
    );

    console.log('✅ RAGS shut down successfully');
    this.emit('shutdown');
  }

  // Expose services for advanced usage
  get services() {
    return {
      brain: this.brain,
      memory: this.memory,
      agent: this.agent,
      actionGraph: this.actionGraph,
      autopilot: this.autopilot,
      contentGenerator: this.contentGenerator,
      socialManager: this.socialManager,
      personality: this.personality,
      macAuto: this.macAuto,
      automation: this.automation,
      voicePipeline: this.voicePipeline,
    };
  }
}
