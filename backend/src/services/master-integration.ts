/**
 * 🎯 MASTER INTEGRATION SERVICE
 * Seamlessly integrates all enhanced RAGS features
 * Complete automation, learning, and control system
 */

import { EventEmitter } from 'events';
import { advancedMouseControl } from './advanced-mouse-control';
import { screenIntelligence } from './screen-intelligence';
import { enhancedAIBrain } from './enhanced-ai-brain';
import { browserAutomation } from './browser-automation';
import { macAutomation } from './mac-automation';
import { backgroundMonitor } from './background-monitor';
import { realIntegrationEngine } from './real-integration-engine';
import { realCameraMonitor } from './real-camera-monitor';
import { enhancedConversationEngine } from './enhanced-conversation-engine';
import { userGreetingSystem } from './user-greeting-system';

interface TaskRequest {
  id: string;
  type: 'screen_control' | 'browser_automation' | 'system_control' | 'learning' | 'analysis';
  description: string;
  parameters: any;
  priority: number;
  timestamp: Date;
}

interface TaskResult {
  id: string;
  success: boolean;
  result: any;
  error?: string;
  duration: number;
  timestamp: Date;
}

interface SystemCapabilities {
  mouseControl: boolean;
  screenAnalysis: boolean;
  browserAutomation: boolean;
  systemControl: boolean;
  aiLearning: boolean;
  backgroundMonitoring: boolean;
  realTimeIntegration: boolean;
  cameraMonitoring: boolean;
  conversationEngine: boolean;
  userGreeting: boolean;
}

export class MasterIntegration extends EventEmitter {
  private capabilities: SystemCapabilities;
  private taskQueue: TaskRequest[] = [];
  private isProcessing: boolean = false;
  private processingInterval: NodeJS.Timeout | null = null;

  constructor() {
    super();
    this.capabilities = {
      mouseControl: false,
      screenAnalysis: false,
      browserAutomation: false,
      systemControl: false,
      aiLearning: false,
      backgroundMonitoring: false,
      realTimeIntegration: false,
      cameraMonitoring: false,
      conversationEngine: false,
      userGreeting: false
    };
    this.initialize();
  }

  /**
   * Initialize master integration
   */
  async initialize(): Promise<void> {
    try {
      console.log('🎯 Initializing Master Integration...');

      // Initialize all subsystems
      await this.initializeSubsystems();
      
      // Start task processing
      this.startTaskProcessing();
      
      // Setup event listeners
      this.setupEventListeners();
      
      console.log('✅ Master Integration initialized');
      console.log('🚀 RAGS is now fully enhanced and ready!');
      
      this.emit('systemReady', this.capabilities);
    } catch (error) {
      console.error('❌ Master Integration initialization failed:', error);
    }
  }

  /**
   * Initialize all subsystems
   */
  async initializeSubsystems(): Promise<void> {
    try {
      // Initialize mouse control
      await advancedMouseControl.initialize();
      this.capabilities.mouseControl = true;
      console.log('✅ Mouse control ready');
    } catch (error) {
      console.warn('⚠️ Mouse control initialization failed:', error);
    }

    try {
      // Initialize screen intelligence
      await screenIntelligence.initialize();
      this.capabilities.screenAnalysis = true;
      console.log('✅ Screen intelligence ready');
    } catch (error) {
      console.warn('⚠️ Screen intelligence initialization failed:', error);
    }

    try {
      // Initialize browser automation
      await browserAutomation.initialize();
      this.capabilities.browserAutomation = true;
      console.log('✅ Browser automation ready');
    } catch (error) {
      console.warn('⚠️ Browser automation initialization failed:', error);
    }

    try {
      // Initialize enhanced AI brain
      await enhancedAIBrain.initialize();
      this.capabilities.aiLearning = true;
      console.log('✅ Enhanced AI brain ready');
    } catch (error) {
      console.warn('⚠️ Enhanced AI brain initialization failed:', error);
    }

    // System control is always available on macOS
    this.capabilities.systemControl = true;
    console.log('✅ System control ready');

    try {
      // Initialize background monitoring
      await backgroundMonitor.initialize();
      this.capabilities.backgroundMonitoring = true;
      console.log('✅ Background monitoring ready');
    } catch (error) {
      console.warn('⚠️ Background monitoring initialization failed:', error);
    }

    try {
      // Initialize real integration engine
      await realIntegrationEngine.initialize();
      this.capabilities.realTimeIntegration = true;
      console.log('✅ Real-time integration ready');
    } catch (error) {
      console.warn('⚠️ Real-time integration initialization failed:', error);
    }

    try {
      // Initialize real camera monitoring
      await realCameraMonitor.initialize();
      this.capabilities.cameraMonitoring = true;
      console.log('✅ Real camera monitoring ready');
    } catch (error) {
      console.warn('⚠️ Real camera monitoring initialization failed:', error);
    }

    try {
      // Enhanced conversation engine is ready by default
      this.capabilities.conversationEngine = true;
      console.log('✅ Enhanced conversation engine ready');
    } catch (error) {
      console.warn('⚠️ Conversation engine initialization failed:', error);
    }

    try {
      // User greeting system is ready by default
      this.capabilities.userGreeting = true;
      console.log('✅ User greeting system ready');
    } catch (error) {
      console.warn('⚠️ User greeting system initialization failed:', error);
    }
  }

  /**
   * Setup event listeners for subsystems
   */
  setupEventListeners(): void {
    // Mouse control events
    advancedMouseControl.on('mouseMoved', (data) => {
      this.emit('mouseAction', { type: 'moved', data });
    });

    advancedMouseControl.on('mouseClicked', (data) => {
      this.emit('mouseAction', { type: 'clicked', data });
    });

    // Screen intelligence events
    screenIntelligence.on('screenAnalyzed', (analysis) => {
      this.emit('screenUpdate', analysis);
    });

    screenIntelligence.on('screenChanged', (analysis) => {
      this.emit('screenChanged', analysis);
    });

    // AI brain events
    enhancedAIBrain.on('skillImproved', (data) => {
      this.emit('aiImprovement', { type: 'skill', data });
    });

    enhancedAIBrain.on('brainEvolved', (data) => {
      this.emit('aiImprovement', { type: 'evolution', data });
    });

    // Background monitoring events
    backgroundMonitor.on('contextChanged', (context) => {
      this.emit('contextChanged', context);
      console.log(`🔄 Active context: ${context.appName} - ${context.windowTitle}`);
    });

    backgroundMonitor.on('screenChanged', (screenState) => {
      this.emit('screenChanged', screenState);
    });

    backgroundMonitor.on('taskCompleted', (task) => {
      this.emit('backgroundTaskCompleted', task);
      console.log(`✅ Background task completed: ${task.command}`);
    });

    // Real camera monitoring events
    realCameraMonitor.on('userDetected', (detection) => {
      this.emit('userDetected', detection);
      console.log(`👤 User detected in camera: ${detection.description}`);
    });

    realCameraMonitor.on('userLeft', (detection) => {
      this.emit('userLeft', detection);
      console.log('👻 User left camera view');
    });

    realCameraMonitor.on('gestureDetected', (gesture) => {
      this.emit('gestureDetected', gesture);
      console.log(`👋 Gesture detected: ${gesture.gesture} (${Math.round(gesture.confidence * 100)}%)`);
    });

    realCameraMonitor.on('userGreeted', (greeting) => {
      this.emit('userGreeted', greeting);
      console.log(`🤖 User greeted: ${greeting}`);
    });

    realCameraMonitor.on('gestureResponse', (response) => {
      this.emit('gestureResponse', response);
      console.log(`🤖 Gesture response: ${response.response}`);
    });

    // Enhanced conversation engine events
    enhancedConversationEngine.on('conversationStarted', (data) => {
      this.emit('conversationStarted', data);
      console.log(`💬 Conversation started with user: ${data.userId}`);
    });

    enhancedConversationEngine.on('responseGenerated', (data) => {
      this.emit('responseGenerated', data);
      console.log(`🎭 Response generated: ${data.text.substring(0, 50)}...`);
    });

    enhancedConversationEngine.on('streamingComplete', (data) => {
      this.emit('streamingComplete', data);
      console.log(`✅ Streaming complete for user: ${data.userId}`);
    });

    // User greeting system events
    userGreetingSystem.on('userGreeted', (data) => {
      this.emit('userGreeted', data);
      console.log(`👋 User greeted: ${data.greeting}`);
    });

    userGreetingSystem.on('userLeft', (data) => {
      this.emit('userLeft', data);
      console.log(`👋 User left: ${data.farewell}`);
    });

    userGreetingSystem.on('gestureResponse', (data) => {
      this.emit('gestureResponse', data);
      console.log(`👋 Gesture response: ${data.response}`);
    });
  }

  /**
   * Process background command (works with any active app/website)
   */
  async processBackgroundCommand(userInput: string): Promise<string> {
    try {
      if (!this.capabilities.backgroundMonitoring) {
        throw new Error('Background monitoring not available');
      }

      console.log(`🔍 Processing background command: "${userInput}"`);
      
      // Use background monitor to process command in current context
      const result = await backgroundMonitor.processBackgroundCommand(userInput);
      
      // Learn from the interaction
      if (this.capabilities.aiLearning) {
        const context = backgroundMonitor.getStatus().activeContext;
        const contextString = context ? `Active app: ${context.appName}, Window: ${context.windowTitle}` : '';
        await enhancedAIBrain.processInteraction(userInput, contextString, result, true);
      }

      return result;
    } catch (error: any) {
      console.error('Background command processing failed:', error);
      return `Sorry, I couldn't process that command in the background: ${error.message}`;
    }
  }

  /**
   * Process natural language commands
   */
  async processCommand(userInput: string, context: string = ''): Promise<string> {
    try {
      console.log(`🎯 Processing command: "${userInput}"`);
      
      // Analyze screen first for context
      let screenContext = '';
      if (this.capabilities.screenAnalysis) {
        try {
          const analysis = await screenIntelligence.analyzeScreen();
          screenContext = await screenIntelligence.getScreenSummary();
        } catch (error) {
          console.warn('Screen analysis failed:', error);
        }
      }

      // Enhanced AI processing with screen context
      const fullContext = `${context}\n\nScreen Context:\n${screenContext}`;
      let response = '';
      
      if (this.capabilities.aiLearning) {
        response = await enhancedAIBrain.generateEnhancedResponse(userInput, fullContext);
      } else {
        response = await this.fallbackProcessing(userInput);
      }

      // Detect and execute actions
      const actions = await this.detectActions(userInput, screenContext);
      let actionResults = [];

      for (const action of actions) {
        try {
          const result = await this.executeAction(action);
          actionResults.push(result);
        } catch (error) {
          console.error('Action execution failed:', error);
          actionResults.push({ success: false, error: error.message });
        }
      }

      // Learn from the interaction
      if (this.capabilities.aiLearning) {
        const success = actionResults.every(r => r.success !== false);
        await enhancedAIBrain.processInteraction(userInput, fullContext, response, success);
      }

      // Combine response with action results
      if (actionResults.length > 0) {
        const actionSummary = actionResults.map(r => r.success ? '✅' : '❌').join(' ');
        response += `\n\nActions performed: ${actionSummary}`;
      }

      return response;

    } catch (error) {
      console.error('Command processing failed:', error);
      return `Sorry, I encountered an error: ${error.message}`;
    }
  }

  /**
   * Detect actions from user input
   */
  async detectActions(userInput: string, screenContext: string): Promise<any[]> {
    const input = userInput.toLowerCase();
    const actions = [];

    // Mouse/Click actions
    if (input.includes('click') || input.includes('press')) {
      const target = this.extractTarget(userInput);
      if (target) {
        actions.push({
          type: 'click',
          target: target,
          method: input.includes('right') ? 'right' : 'left'
        });
      }
    }

    // Mouse movement
    if (input.includes('move mouse') || input.includes('cursor')) {
      const coords = this.extractCoordinates(userInput);
      if (coords) {
        actions.push({
          type: 'move_mouse',
          x: coords.x,
          y: coords.y
        });
      }
    }

    // Scroll actions
    if (input.includes('scroll')) {
      const direction = input.includes('up') ? 'up' : 
                      input.includes('down') ? 'down' :
                      input.includes('left') ? 'left' :
                      input.includes('right') ? 'right' : 'down';
      
      actions.push({
        type: 'scroll',
        direction: direction,
        amount: this.extractNumber(userInput) || 5
      });
    }

    // Browser actions
    if (input.includes('open') && (input.includes('browser') || input.includes('website') || input.includes('url'))) {
      const url = this.extractURL(userInput);
      if (url) {
        actions.push({
          type: 'browser_navigate',
          url: url
        });
      }
    }

    // System actions
    if (input.includes('open app') || input.includes('launch')) {
      const appName = this.extractAppName(userInput);
      if (appName) {
        actions.push({
          type: 'open_app',
          appName: appName
        });
      }
    }

    // Screenshot
    if (input.includes('screenshot') || input.includes('capture screen')) {
      actions.push({
        type: 'screenshot'
      });
    }

    // Find and click
    if (input.includes('find') && input.includes('click')) {
      const searchText = this.extractSearchText(userInput);
      if (searchText) {
        actions.push({
          type: 'find_and_click',
          searchText: searchText
        });
      }
    }

    return actions;
  }

  /**
   * Execute detected action
   */
  async executeAction(action: any): Promise<any> {
    console.log(`🎯 Executing action: ${action.type}`);

    switch (action.type) {
      case 'click':
        if (this.capabilities.mouseControl) {
          if (action.target) {
            // Find target on screen and click
            const elements = await screenIntelligence.findText(action.target);
            if (elements.length > 0) {
              const element = elements[0];
              const centerX = element.position.x + element.position.width / 2;
              const centerY = element.position.y + element.position.height / 2;
              
              if (action.method === 'right') {
                await advancedMouseControl.rightClick(centerX, centerY);
              } else {
                await advancedMouseControl.click(centerX, centerY);
              }
              return { success: true, message: `Clicked on ${action.target}` };
            }
          }
        }
        return { success: false, error: 'Target not found or mouse control unavailable' };

      case 'move_mouse':
        if (this.capabilities.mouseControl) {
          await advancedMouseControl.moveTo(action.x, action.y, true);
          return { success: true, message: `Mouse moved to (${action.x}, ${action.y})` };
        }
        return { success: false, error: 'Mouse control unavailable' };

      case 'scroll':
        if (this.capabilities.mouseControl) {
          await advancedMouseControl.scroll(action.direction, action.amount);
          return { success: true, message: `Scrolled ${action.direction}` };
        }
        return { success: false, error: 'Mouse control unavailable' };

      case 'browser_navigate':
        if (this.capabilities.browserAutomation) {
          await browserAutomation.navigate(action.url);
          return { success: true, message: `Navigated to ${action.url}` };
        }
        return { success: false, error: 'Browser automation unavailable' };

      case 'open_app':
        if (this.capabilities.systemControl) {
          await macAutomation.openApp(action.appName);
          return { success: true, message: `Opened ${action.appName}` };
        }
        return { success: false, error: 'System control unavailable' };

      case 'screenshot':
        if (this.capabilities.systemControl) {
          const path = await macAutomation.takeScreenshot();
          return { success: true, message: `Screenshot saved: ${path}` };
        }
        return { success: false, error: 'System control unavailable' };

      case 'find_and_click':
        if (this.capabilities.mouseControl && this.capabilities.screenAnalysis) {
          const found = await advancedMouseControl.findAndClick(action.searchText);
          return { success: found, message: found ? `Found and clicked ${action.searchText}` : `Could not find ${action.searchText}` };
        }
        return { success: false, error: 'Required capabilities unavailable' };

      default:
        return { success: false, error: `Unknown action type: ${action.type}` };
    }
  }

  /**
   * Start task processing queue
   */
  startTaskProcessing(): void {
    this.processingInterval = setInterval(async () => {
      if (!this.isProcessing && this.taskQueue.length > 0) {
        await this.processNextTask();
      }
    }, 100);
  }

  /**
   * Process next task in queue
   */
  async processNextTask(): Promise<void> {
    if (this.taskQueue.length === 0) return;

    this.isProcessing = true;
    const task = this.taskQueue.shift()!;
    
    try {
      const startTime = Date.now();
      const result = await this.executeTask(task);
      const duration = Date.now() - startTime;

      const taskResult: TaskResult = {
        id: task.id,
        success: true,
        result,
        duration,
        timestamp: new Date()
      };

      this.emit('taskCompleted', taskResult);
    } catch (error) {
      const taskResult: TaskResult = {
        id: task.id,
        success: false,
        result: null,
        error: error.message,
        duration: 0,
        timestamp: new Date()
      };

      this.emit('taskFailed', taskResult);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Execute a specific task
   */
  async executeTask(task: TaskRequest): Promise<any> {
    switch (task.type) {
      case 'screen_control':
        return await this.executeScreenControlTask(task);
      case 'browser_automation':
        return await this.executeBrowserTask(task);
      case 'system_control':
        return await this.executeSystemTask(task);
      case 'learning':
        return await this.executeLearningTask(task);
      case 'analysis':
        return await this.executeAnalysisTask(task);
      default:
        throw new Error(`Unknown task type: ${task.type}`);
    }
  }

  /**
   * Execute screen control task
   */
  async executeScreenControlTask(task: TaskRequest): Promise<any> {
    const { action, parameters } = task.parameters;
    
    switch (action) {
      case 'analyze':
        return await screenIntelligence.analyzeScreen();
      case 'find_text':
        return await screenIntelligence.findText(parameters.text);
      case 'click_element':
        return await advancedMouseControl.findAndClick(parameters.target);
      default:
        throw new Error(`Unknown screen control action: ${action}`);
    }
  }

  /**
   * Execute browser task
   */
  async executeBrowserTask(task: TaskRequest): Promise<any> {
    const { action, parameters } = task.parameters;
    
    switch (action) {
      case 'navigate':
        return await browserAutomation.navigate(parameters.url);
      case 'scroll':
        return await browserAutomation.scroll(parameters.direction, parameters.amount);
      case 'click':
        return await browserAutomation.clickElement(parameters.target);
      default:
        throw new Error(`Unknown browser action: ${action}`);
    }
  }

  /**
   * Execute system task
   */
  async executeSystemTask(task: TaskRequest): Promise<any> {
    const { action, parameters } = task.parameters;
    
    switch (action) {
      case 'open_app':
        return await macAutomation.openApp(parameters.appName);
      case 'screenshot':
        return await macAutomation.takeScreenshot(parameters.path);
      case 'notification':
        return await macAutomation.sendNotification(parameters.title, parameters.message);
      default:
        throw new Error(`Unknown system action: ${action}`);
    }
  }

  /**
   * Execute learning task
   */
  async executeLearningTask(task: TaskRequest): Promise<any> {
    const { action, parameters } = task.parameters;
    
    switch (action) {
      case 'process_interaction':
        return await enhancedAIBrain.processInteraction(
          parameters.input,
          parameters.context,
          parameters.response,
          parameters.success
        );
      case 'get_stats':
        return enhancedAIBrain.getBrainStats();
      default:
        throw new Error(`Unknown learning action: ${action}`);
    }
  }

  /**
   * Execute analysis task
   */
  async executeAnalysisTask(task: TaskRequest): Promise<any> {
    const { action, parameters } = task.parameters;
    
    switch (action) {
      case 'screen_summary':
        return await screenIntelligence.getScreenSummary();
      case 'detect_changes':
        return await screenIntelligence.detectChanges();
      default:
        throw new Error(`Unknown analysis action: ${action}`);
    }
  }

  /**
   * Fallback processing when AI brain is unavailable
   */
  async fallbackProcessing(userInput: string): Promise<string> {
    const input = userInput.toLowerCase();
    
    if (input.includes('hello') || input.includes('hi')) {
      return 'Hello! I\'m RAGS, your enhanced AI assistant. I can control your screen, automate tasks, and learn from our interactions.';
    }
    
    if (input.includes('help')) {
      return 'I can help you with:\n- Screen control and mouse automation\n- Browser automation\n- System control\n- File management\n- Learning and adaptation\n\nJust tell me what you need!';
    }
    
    return 'I understand you want me to help with something. Could you be more specific about what you\'d like me to do?';
  }

  // Helper methods for extracting information from user input
  extractTarget(input: string): string | null {
    const clickMatch = input.match(/click (?:on )?["']?([^"']+)["']?/i);
    return clickMatch ? clickMatch[1].trim() : null;
  }

  extractCoordinates(input: string): { x: number, y: number } | null {
    const coordMatch = input.match(/(\d+)[,\s]+(\d+)/);
    return coordMatch ? { x: parseInt(coordMatch[1]), y: parseInt(coordMatch[2]) } : null;
  }

  extractNumber(input: string): number | null {
    const numMatch = input.match(/(\d+)/);
    return numMatch ? parseInt(numMatch[1]) : null;
  }

  extractURL(input: string): string | null {
    const urlMatch = input.match(/(https?:\/\/[^\s]+|www\.[^\s]+|[^\s]+\.[a-z]{2,})/i);
    return urlMatch ? urlMatch[1] : null;
  }

  extractAppName(input: string): string | null {
    const appMatch = input.match(/(?:open|launch) (?:app )?["']?([^"']+)["']?/i);
    return appMatch ? appMatch[1].trim() : null;
  }

  extractSearchText(input: string): string | null {
    const searchMatch = input.match(/(?:search|find|look for) (?:for )?["']?([^"']+)["']?/i);
    return searchMatch ? searchMatch[1].trim() : null;
  }

  /**
   * Start camera monitoring
   */
  async startCameraMonitoring(): Promise<void> {
    if (!this.capabilities.cameraMonitoring) {
      throw new Error('Camera monitoring not available');
    }
    
    await realCameraMonitor.startMonitoring();
    console.log('👁️ Camera monitoring started');
  }

  /**
   * Stop camera monitoring
   */
  stopCameraMonitoring(): void {
    realCameraMonitor.stopMonitoring();
    console.log('🛑 Camera monitoring stopped');
  }

  /**
   * Analyze current camera view
   */
  async analyzeCameraView(question?: string): Promise<string> {
    if (!this.capabilities.cameraMonitoring) {
      throw new Error('Camera monitoring not available');
    }
    
    return await realCameraMonitor.analyzeCurrentView(question);
  }

  /**
   * Get camera monitoring status
   */
  getCameraStatus(): any {
    return realCameraMonitor.getStatus();
  }

  /**
   * Configure camera monitoring
   */
  configureCameraMonitoring(config: any): void {
    realCameraMonitor.updateConfig(config);
  }

  /**
   * Initialize conversation context for user
   */
  async initializeConversation(userId: string, personalityMode: 'work' | 'chill' | 'teacher' | 'coach' | 'jarvis' = 'jarvis'): Promise<void> {
    if (!this.capabilities.conversationEngine) {
      throw new Error('Conversation engine not available');
    }
    
    await enhancedConversationEngine.initializeContext(userId, personalityMode);
  }

  /**
   * Process message with streaming response
   */
  async processConversationMessage(userId: string, message: string): Promise<AsyncGenerator<any, void, unknown>> {
    if (!this.capabilities.conversationEngine) {
      throw new Error('Conversation engine not available');
    }
    
    return await enhancedConversationEngine.processMessage(userId, message);
  }

  /**
   * Switch conversation personality
   */
  switchConversationPersonality(userId: string, personality: 'work' | 'chill' | 'teacher' | 'coach' | 'jarvis'): void {
    if (!this.capabilities.conversationEngine) {
      throw new Error('Conversation engine not available');
    }
    
    enhancedConversationEngine.switchPersonality(userId, personality);
  }

  /**
   * Get system status with camera info
   */
  getSystemStatus(): {
    capabilities: SystemCapabilities;
    taskQueue: {
      pending: number;
      processing: boolean;
    };
    cameraStatus?: any;
  } {
    const status: any = {
      capabilities: this.capabilities,
      taskQueue: {
        pending: this.taskQueue.length,
        processing: this.isProcessing
      }
    };

    if (this.capabilities.cameraMonitoring) {
      status.cameraStatus = realCameraMonitor.getStatus();
    }

    return status;
  }

  /**
   * Add task to queue
   */
  addTask(task: Omit<TaskRequest, 'id' | 'timestamp'>): string {
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fullTask: TaskRequest = {
      ...task,
      id: taskId,
      timestamp: new Date()
    };

    this.taskQueue.push(fullTask);
    this.taskQueue.sort((a, b) => b.priority - a.priority);

    return taskId;
  }

  /**
   * Stop all processing
   */
  stop(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
    
    screenIntelligence.stopMonitoring();
    enhancedAIBrain.stopEvolution();
    
    console.log('🛑 Master Integration stopped');
  }
}

// Export singleton instance
export const masterIntegration = new MasterIntegration();
