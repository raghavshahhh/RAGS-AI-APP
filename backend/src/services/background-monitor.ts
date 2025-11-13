/**
 * 🔍 BACKGROUND MONITORING SERVICE
 * Continuously monitors screen, apps, and websites in background
 * Allows RAGS to work with any active application
 */

import { EventEmitter } from 'events';
import { exec } from 'child_process';
import { promisify } from 'util';
import { screenIntelligence } from './screen-intelligence';

const execAsync = promisify(exec);
import { advancedMouseControl } from './advanced-mouse-control';
import { browserAutomation } from './browser-automation';
import { macAutomation } from './mac-automation';

interface ActiveContext {
  appName: string;
  windowTitle: string;
  url?: string;
  processId: number;
  bundleId: string;
  isWebBrowser: boolean;
  timestamp: Date;
}

interface ScreenState {
  elements: any[];
  text: string[];
  activeContext: ActiveContext;
  screenshot: string;
  hash: string;
  timestamp: Date;
}

interface BackgroundTask {
  id: string;
  command: string;
  context: ActiveContext;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: any;
  error?: string;
  timestamp: Date;
}

export class BackgroundMonitor extends EventEmitter {
  private isMonitoring: boolean = false;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private currentScreenState: ScreenState | null = null;
  private activeContext: ActiveContext | null = null;
  private backgroundTasks: BackgroundTask[] = [];
  private taskQueue: BackgroundTask[] = [];
  private isProcessingTasks: boolean = false;

  // Configuration - Optimized for performance
  private config = {
    monitorInterval: 5000, // Check every 5 seconds (reduced from 2s)
    screenChangeThreshold: 0.1, // 10% change to trigger update
    maxTaskHistory: 50, // Reduced from 100
    enableContinuousScreenshot: false, // ❌ DISABLED - No more continuous screenshots!
    enableActiveAppTracking: true,
    enableWebsiteTracking: true
  };

  constructor() {
    super();
    this.initialize();
  }

  /**
   * Initialize background monitoring
   */
  async initialize(): Promise<void> {
    try {
      console.log('🔍 Initializing Background Monitor...');
      
      // Start monitoring immediately
      await this.startMonitoring();
      
      // Setup task processing
      this.startTaskProcessing();
      
      console.log('✅ Background Monitor initialized');
      this.emit('initialized');
    } catch (error) {
      console.error('❌ Background Monitor initialization failed:', error);
      throw error;
    }
  }

  /**
   * Start continuous background monitoring
   */
  async startMonitoring(): Promise<void> {
    if (this.isMonitoring) {
      console.log('⚠️ Background monitoring already active');
      return;
    }

    this.isMonitoring = true;
    console.log('🔍 Starting background monitoring...');

    // Initial scan
    await this.scanCurrentState();

    // Start continuous monitoring
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.scanCurrentState();
      } catch (error) {
        console.error('❌ Background monitoring error:', error);
        this.emit('monitoringError', error);
      }
    }, this.config.monitorInterval);

    console.log(`✅ Background monitoring active (${this.config.monitorInterval}ms interval)`);
    this.emit('monitoringStarted');
  }

  /**
   * Stop background monitoring
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    console.log('🛑 Background monitoring stopped');
    this.emit('monitoringStopped');
  }

  /**
   * Scan current system state
   */
  async scanCurrentState(): Promise<void> {
    try {
      // Get active application context
      const newContext = await this.getActiveContext();
      
      // Check if context changed
      const contextChanged = !this.activeContext || 
        this.activeContext.appName !== newContext.appName ||
        this.activeContext.windowTitle !== newContext.windowTitle ||
        this.activeContext.url !== newContext.url;

      if (contextChanged) {
        console.log(`🔄 Context changed: ${newContext.appName} - ${newContext.windowTitle}`);
        this.activeContext = newContext;
        this.emit('contextChanged', newContext);
      }

      // Analyze screen only when explicitly requested (no continuous screenshots)
      if (this.config.enableContinuousScreenshot) {
        console.log('📸 Taking screenshot for screen analysis...');
        const screenAnalysis = await screenIntelligence.analyzeScreen();
        
        const newScreenState: ScreenState = {
          elements: screenAnalysis.elements,
          text: screenAnalysis.text,
          activeContext: newContext,
          screenshot: screenAnalysis.screenshot,
          hash: this.generateScreenHash(screenAnalysis),
          timestamp: new Date()
        };

        // Check for significant screen changes
        if (this.hasSignificantScreenChange(newScreenState)) {
          console.log('📺 Significant screen change detected');
          this.currentScreenState = newScreenState;
          this.emit('screenChanged', newScreenState);
        }
      } else {
        // Only track context changes without screenshots
        console.log('🔍 Monitoring context only (screenshots disabled)');
      }

    } catch (error) {
      console.error('❌ Failed to scan current state:', error);
    }
  }

  /**
   * Get active application context
   */
  async getActiveContext(): Promise<ActiveContext> {
    try {
      // Get active application info
      const { stdout: appInfo } = await execAsync(`
        osascript -e '
        tell application "System Events"
          set frontApp to first application process whose frontmost is true
          set appName to name of frontApp
          set appBundle to bundle identifier of frontApp
          set appPID to unix id of frontApp
          try
            set windowTitle to name of front window of frontApp
          on error
            set windowTitle to ""
          end try
          return appName & "|" & appBundle & "|" & appPID & "|" & windowTitle
        end tell'
      `);

      const [appName, bundleId, processId, windowTitle] = appInfo.trim().split('|');
      
      // Check if it's a web browser and get URL
      let url: string | undefined;
      const isWebBrowser = this.isWebBrowser(bundleId);
      
      if (isWebBrowser) {
        url = await this.getCurrentURL(appName);
      }

      return {
        appName: appName || 'Unknown',
        windowTitle: windowTitle || '',
        url,
        processId: parseInt(processId) || 0,
        bundleId: bundleId || '',
        isWebBrowser,
        timestamp: new Date()
      };

    } catch (error) {
      console.error('❌ Failed to get active context:', error);
      return {
        appName: 'Unknown',
        windowTitle: '',
        processId: 0,
        bundleId: '',
        isWebBrowser: false,
        timestamp: new Date()
      };
    }
  }

  /**
   * Check if app is a web browser
   */
  private isWebBrowser(bundleId: string): boolean {
    const browserBundles = [
      'com.google.Chrome',
      'com.google.Chrome.beta',
      'com.google.Chrome.dev',
      'com.google.Chrome.canary',
      'com.apple.Safari',
      'org.mozilla.firefox',
      'com.microsoft.edgemac',
      'com.operasoftware.Opera',
      'com.brave.Browser',
      'com.vivaldi.Vivaldi'
    ];
    
    return browserBundles.includes(bundleId);
  }

  /**
   * Get current URL from browser
   */
  async getCurrentURL(appName: string): Promise<string | undefined> {
    try {
      let script = '';
      
      if (appName.includes('Chrome') || appName.includes('Brave')) {
        script = `
          tell application "${appName}"
            if (count of windows) > 0 then
              return URL of active tab of front window
            end if
          end tell
        `;
      } else if (appName === 'Safari') {
        script = `
          tell application "Safari"
            if (count of windows) > 0 then
              return URL of current tab of front window
            end if
          end tell
        `;
      } else if (appName === 'Firefox') {
        // Firefox doesn't support AppleScript well, use alternative method
        return undefined;
      }

      if (script) {
        const { stdout } = await execAsync(`osascript -e '${script}'`);
        return stdout.trim() || undefined;
      }

    } catch (error) {
      console.warn('⚠️ Failed to get current URL:', error);
    }
    
    return undefined;
  }

  /**
   * Generate screen hash for change detection
   */
  private generateScreenHash(analysis: any): string {
    const content = JSON.stringify({
      elementCount: analysis.elements.length,
      textLength: analysis.text.join('').length,
      elementTypes: analysis.elements.map((e: any) => e.type).sort()
    });
    
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return hash.toString();
  }

  /**
   * Check if screen has significant changes
   */
  private hasSignificantScreenChange(newState: ScreenState): boolean {
    if (!this.currentScreenState) return true;

    // Compare hashes
    if (this.currentScreenState.hash !== newState.hash) {
      return true;
    }

    // Compare element counts
    const oldCount = this.currentScreenState.elements.length;
    const newCount = newState.elements.length;
    const changeRatio = Math.abs(oldCount - newCount) / Math.max(oldCount, 1);
    
    return changeRatio > this.config.screenChangeThreshold;
  }

  /**
   * Process command in background context
   */
  async processBackgroundCommand(command: string, targetContext?: ActiveContext): Promise<string> {
    try {
      const context = targetContext || this.activeContext;
      if (!context) {
        throw new Error('No active context available');
      }

      console.log(`🎯 Processing background command: "${command}" in ${context.appName}`);

      // Create background task
      const task: BackgroundTask = {
        id: `bg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        command,
        context,
        status: 'pending',
        timestamp: new Date()
      };

      // Add to queue
      this.taskQueue.push(task);
      this.backgroundTasks.push(task);

      // Keep task history manageable
      if (this.backgroundTasks.length > this.config.maxTaskHistory) {
        this.backgroundTasks = this.backgroundTasks.slice(-this.config.maxTaskHistory);
      }

      this.emit('taskQueued', task);

      // Wait for task completion (with timeout)
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Background task timeout'));
        }, 30000); // 30 second timeout

        const checkCompletion = () => {
          const updatedTask = this.backgroundTasks.find(t => t.id === task.id);
          if (updatedTask?.status === 'completed') {
            clearTimeout(timeout);
            resolve(updatedTask.result || 'Task completed successfully');
          } else if (updatedTask?.status === 'failed') {
            clearTimeout(timeout);
            reject(new Error(updatedTask.error || 'Task failed'));
          } else {
            setTimeout(checkCompletion, 100);
          }
        };

        checkCompletion();
      });

    } catch (error) {
      console.error('❌ Background command processing failed:', error);
      throw error;
    }
  }

  /**
   * Start task processing queue
   */
  private startTaskProcessing(): void {
    setInterval(async () => {
      if (!this.isProcessingTasks && this.taskQueue.length > 0) {
        await this.processNextTask();
      }
    }, 100);
  }

  /**
   * Process next task in queue
   */
  private async processNextTask(): Promise<void> {
    if (this.taskQueue.length === 0) return;

    this.isProcessingTasks = true;
    const task = this.taskQueue.shift()!;

    try {
      console.log(`⚡ Processing background task: ${task.command}`);
      task.status = 'processing';
      this.emit('taskProcessing', task);

      // Execute the command based on context
      const result = await this.executeContextualCommand(task.command, task.context);
      
      task.status = 'completed';
      task.result = result;
      
      console.log(`✅ Background task completed: ${task.id}`);
      this.emit('taskCompleted', task);

    } catch (error: any) {
      task.status = 'failed';
      task.error = error.message;
      
      console.error(`❌ Background task failed: ${task.id}`, error);
      this.emit('taskFailed', task);
    } finally {
      this.isProcessingTasks = false;
    }
  }

  /**
   * Execute command based on active context
   */
  private async executeContextualCommand(command: string, context: ActiveContext): Promise<string> {
    const cmd = command.toLowerCase();

    // Browser-specific commands
    if (context.isWebBrowser && context.url) {
      if (cmd.includes('scroll')) {
        const direction = cmd.includes('up') ? 'up' : 'down';
        await advancedMouseControl.scroll(direction, 5);
        return `Scrolled ${direction} in ${context.appName}`;
      }
      
      if (cmd.includes('click') && cmd.includes('button')) {
        const buttonText = this.extractButtonText(command);
        if (buttonText) {
          const found = await advancedMouseControl.findAndClick(buttonText);
          return found ? `Clicked "${buttonText}" in ${context.appName}` : `Button "${buttonText}" not found`;
        }
      }
      
      if (cmd.includes('navigate') || cmd.includes('go to')) {
        const url = this.extractURL(command);
        if (url) {
          await this.navigateInBrowser(url, context.appName);
          return `Navigated to ${url} in ${context.appName}`;
        }
      }
    }

    // General app commands
    if (cmd.includes('screenshot')) {
      const path = await macAutomation.takeScreenshot();
      return `Screenshot saved: ${path}`;
    }

    if (cmd.includes('type')) {
      const text = this.extractTextToType(command);
      if (text) {
        await this.typeInActiveApp(text);
        return `Typed "${text}" in ${context.appName}`;
      }
    }

    if (cmd.includes('press') && cmd.includes('key')) {
      const key = this.extractKeyPress(command);
      if (key) {
        await this.pressKeyInActiveApp(key);
        return `Pressed ${key} in ${context.appName}`;
      }
    }

    // Mouse commands
    if (cmd.includes('click')) {
      const coords = this.extractCoordinates(command);
      if (coords) {
        await advancedMouseControl.click(coords.x, coords.y);
        return `Clicked at (${coords.x}, ${coords.y}) in ${context.appName}`;
      } else {
        // Click at current mouse position
        await advancedMouseControl.click();
        return `Clicked in ${context.appName}`;
      }
    }

    if (cmd.includes('move mouse')) {
      const coords = this.extractCoordinates(command);
      if (coords) {
        await advancedMouseControl.moveTo(coords.x, coords.y, true);
        return `Mouse moved to (${coords.x}, ${coords.y})`;
      }
    }

    // Default: try to find and interact with text on screen
    const searchText = this.extractSearchText(command);
    if (searchText) {
      const found = await advancedMouseControl.findAndClick(searchText);
      return found ? `Found and clicked "${searchText}" in ${context.appName}` : `"${searchText}" not found on screen`;
    }

    return `Command processed in ${context.appName}`;
  }

  /**
   * Navigate in browser
   */
  private async navigateInBrowser(url: string, browserName: string): Promise<void> {
    try {
      if (browserName.includes('Chrome') || browserName.includes('Brave')) {
        await execAsync(`osascript -e 'tell application "${browserName}" to set URL of active tab of front window to "${url}"'`);
      } else if (browserName === 'Safari') {
        await execAsync(`osascript -e 'tell application "Safari" to set URL of current tab of front window to "${url}"'`);
      }
    } catch (error) {
      console.error('Failed to navigate in browser:', error);
      throw error;
    }
  }

  /**
   * Type text in active app
   */
  private async typeInActiveApp(text: string): Promise<void> {
    await execAsync(`osascript -e 'tell application "System Events" to keystroke "${text}"'`);
  }

  /**
   * Press key in active app
   */
  private async pressKeyInActiveApp(key: string): Promise<void> {
    const keyMap: { [key: string]: string } = {
      'enter': 'return',
      'space': 'space',
      'tab': 'tab',
      'escape': 'escape',
      'backspace': 'delete',
      'delete': 'forward delete'
    };

    const mappedKey = keyMap[key.toLowerCase()] || key;
    await execAsync(`osascript -e 'tell application "System Events" to key code ${this.getKeyCode(mappedKey)}'`);
  }

  /**
   * Get key code for AppleScript
   */
  private getKeyCode(key: string): number {
    const keyCodes: { [key: string]: number } = {
      'return': 36,
      'space': 49,
      'tab': 48,
      'escape': 53,
      'delete': 51,
      'forward delete': 117
    };

    return keyCodes[key] || 49; // Default to space
  }

  // Helper methods for text extraction
  private extractButtonText(command: string): string | null {
    const match = command.match(/click (?:on )?(?:the )?(?:button )?["']?([^"']+)["']?/i);
    return match ? match[1].trim() : null;
  }

  private extractURL(command: string): string | null {
    const match = command.match(/(https?:\/\/[^\s]+|www\.[^\s]+|[^\s]+\.[a-z]{2,})/i);
    return match ? match[1] : null;
  }

  private extractTextToType(command: string): string | null {
    const match = command.match(/type ["']?([^"']+)["']?/i);
    return match ? match[1] : null;
  }

  private extractKeyPress(command: string): string | null {
    const match = command.match(/press (?:the )?(?:key )?["']?([^"']+)["']?/i);
    return match ? match[1].trim() : null;
  }

  private extractCoordinates(command: string): { x: number, y: number } | null {
    const match = command.match(/(\d+)[,\s]+(\d+)/);
    return match ? { x: parseInt(match[1]), y: parseInt(match[2]) } : null;
  }

  private extractSearchText(command: string): string | null {
    // Try to extract meaningful text from various command patterns
    const patterns = [
      /find (?:and click )?["']?([^"']+)["']?/i,
      /click (?:on )?["']?([^"']+)["']?/i,
      /select ["']?([^"']+)["']?/i,
      /["']([^"']+)["']/i
    ];

    for (const pattern of patterns) {
      const match = command.match(pattern);
      if (match) return match[1].trim();
    }

    return null;
  }

  /**
   * Get current monitoring status
   */
  getStatus(): any {
    return {
      isMonitoring: this.isMonitoring,
      activeContext: this.activeContext,
      currentScreenState: this.currentScreenState ? {
        elementCount: this.currentScreenState.elements.length,
        textLength: this.currentScreenState.text.join('').length,
        timestamp: this.currentScreenState.timestamp
      } : null,
      taskQueue: {
        pending: this.taskQueue.length,
        processing: this.isProcessingTasks,
        total: this.backgroundTasks.length
      },
      config: this.config
    };
  }

  /**
   * Enable/disable continuous screenshots
   */
  setContinuousScreenshots(enabled: boolean): void {
    this.config.enableContinuousScreenshot = enabled;
    console.log(`📸 Continuous screenshots ${enabled ? 'ENABLED' : 'DISABLED'}`);
    
    if (enabled) {
      console.log('⚠️ WARNING: This will take screenshots every 2 seconds!');
    } else {
      console.log('✅ Screenshots will only be taken when explicitly requested');
    }
  }

  /**
   * Take screenshot on demand (not continuous)
   */
  async takeScreenshotOnDemand(): Promise<any> {
    try {
      console.log('📸 Taking screenshot on demand...');
      const screenAnalysis = await screenIntelligence.analyzeScreen();
      
      const screenState: ScreenState = {
        elements: screenAnalysis.elements,
        text: screenAnalysis.text,
        activeContext: this.activeContext || await this.getActiveContext(),
        screenshot: screenAnalysis.screenshot,
        hash: this.generateScreenHash(screenAnalysis),
        timestamp: new Date()
      };

      this.currentScreenState = screenState;
      this.emit('screenshotTaken', screenState);
      
      return screenState;
    } catch (error) {
      console.error('❌ Failed to take screenshot on demand:', error);
      throw error;
    }
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<typeof this.config>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Restart monitoring with new interval if changed
    if (newConfig.monitorInterval && this.isMonitoring) {
      this.stopMonitoring();
      setTimeout(() => this.startMonitoring(), 100);
    }
    
    console.log('🔧 Background monitor config updated:', newConfig);
  }

  /**
   * Get task history
   */
  getTaskHistory(limit: number = 20): BackgroundTask[] {
    return this.backgroundTasks.slice(-limit);
  }

  /**
   * Clear task history
   */
  clearTaskHistory(): void {
    this.backgroundTasks = [];
    console.log('🗑️ Background task history cleared');
  }
}

// Export singleton instance
export const backgroundMonitor = new BackgroundMonitor();
