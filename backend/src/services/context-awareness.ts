// ============================================================================
// CONTEXT AWARENESS - Detects what user is doing
// ============================================================================

import { exec } from 'child_process';
import { promisify } from 'util';
import { EventEmitter } from 'events';

const execAsync = promisify(exec);

interface ContextInfo {
  activeApp: string;
  appCategory: 'coding' | 'browsing' | 'writing' | 'design' | 'communication' | 'media' | 'other';
  windowTitle: string;
  suggestedActions: string[];
  timestamp: Date;
}

export class ContextAwareness extends EventEmitter {
  private currentContext: ContextInfo | null = null;
  private checkInterval: NodeJS.Timeout | null = null;
  private enabled: boolean = false;

  // App to category mapping
  private appCategories: Record<string, ContextInfo['appCategory']> = {
    'Code': 'coding',
    'Visual Studio Code': 'coding',
    'Xcode': 'coding',
    'PyCharm': 'coding',
    'WebStorm': 'coding',
    'Sublime Text': 'coding',
    'Atom': 'coding',
    
    'Safari': 'browsing',
    'Chrome': 'browsing',
    'Firefox': 'browsing',
    'Brave Browser': 'browsing',
    'Arc': 'browsing',
    
    'Pages': 'writing',
    'Word': 'writing',
    'TextEdit': 'writing',
    'Notion': 'writing',
    'Bear': 'writing',
    'Notes': 'writing',
    
    'Figma': 'design',
    'Sketch': 'design',
    'Adobe Photoshop': 'design',
    'Adobe Illustrator': 'design',
    
    'Slack': 'communication',
    'Discord': 'communication',
    'Messages': 'communication',
    'Mail': 'communication',
    'Telegram': 'communication',
    'WhatsApp': 'communication',
    
    'Spotify': 'media',
    'Music': 'media',
    'VLC': 'media',
    'QuickTime Player': 'media',
  };

  constructor() {
    super();
  }

  /**
   * Start monitoring user context
   */
  async start(): Promise<void> {
    this.enabled = true;
    console.log('🧠 Context awareness started');
    
    // Check context every 10 seconds
    this.checkInterval = setInterval(async () => {
      await this.updateContext();
    }, 10000);

    // Initial check
    await this.updateContext();
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    this.enabled = false;
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    console.log('🛑 Context awareness stopped');
  }

  /**
   * Get active window information (macOS)
   */
  private async getActiveWindow(): Promise<{ app: string; title: string }> {
    try {
      // Get active app
      const { stdout: appOutput } = await execAsync(`
        osascript -e 'tell application "System Events" to get name of first application process whose frontmost is true'
      `);
      const app = appOutput.trim();

      // Get window title
      const { stdout: titleOutput } = await execAsync(`
        osascript -e 'tell application "${app}" to get name of front window' 2>/dev/null || echo "No title"
      `);
      const title = titleOutput.trim();

      return { app, title };
    } catch (error) {
      return { app: 'Unknown', title: '' };
    }
  }

  /**
   * Update current context
   */
  private async updateContext(): Promise<void> {
    if (!this.enabled) return;

    try {
      const { app, title } = await this.getActiveWindow();
      
      // Determine category
      const category = this.appCategories[app] || 'other';
      
      // Generate smart suggestions
      const suggestions = this.generateSuggestions(app, category, title);

      const newContext: ContextInfo = {
        activeApp: app,
        appCategory: category,
        windowTitle: title,
        suggestedActions: suggestions,
        timestamp: new Date()
      };

      // Check if context changed significantly
      if (this.hasContextChanged(newContext)) {
        this.currentContext = newContext;
        this.emit('context_changed', newContext);
        console.log(`📱 Context: ${app} (${category})`);
      }
    } catch (error) {
      console.error('Context update failed:', error);
    }
  }

  /**
   * Check if context changed meaningfully
   */
  private hasContextChanged(newContext: ContextInfo): boolean {
    if (!this.currentContext) return true;
    return (
      newContext.activeApp !== this.currentContext.activeApp ||
      newContext.appCategory !== this.currentContext.appCategory
    );
  }

  /**
   * Generate smart suggestions based on context
   */
  private generateSuggestions(app: string, category: string, title: string): string[] {
    const suggestions: string[] = [];

    switch (category) {
      case 'coding':
        suggestions.push('Search documentation');
        suggestions.push('Explain this code');
        suggestions.push('Debug help');
        suggestions.push('Generate comments');
        break;

      case 'browsing':
        suggestions.push('Summarize this page');
        suggestions.push('Find related articles');
        suggestions.push('Save important info');
        break;

      case 'writing':
        suggestions.push('Improve writing');
        suggestions.push('Grammar check');
        suggestions.push('Continue writing');
        suggestions.push('Summarize document');
        break;

      case 'design':
        suggestions.push('Color palette ideas');
        suggestions.push('Design inspiration');
        suggestions.push('Export assets');
        break;

      case 'communication':
        suggestions.push('Draft reply');
        suggestions.push('Summarize messages');
        suggestions.push('Schedule followup');
        break;

      case 'media':
        suggestions.push('Find similar content');
        suggestions.push('Create playlist');
        break;
    }

    return suggestions;
  }

  /**
   * Get current context
   */
  getCurrentContext(): ContextInfo | null {
    return this.currentContext ? { ...this.currentContext } : null;
  }

  /**
   * Check if user is doing specific activity
   */
  isUserDoing(activity: 'coding' | 'browsing' | 'writing'): boolean {
    return this.currentContext?.appCategory === activity;
  }

  /**
   * Get smart reminder based on context
   */
  getContextualReminder(): string | null {
    if (!this.currentContext) return null;

    const { appCategory, windowTitle } = this.currentContext;

    // Example smart reminders
    if (appCategory === 'coding' && windowTitle.includes('proposal')) {
      return 'You were writing a proposal yesterday — want to continue?';
    }

    if (appCategory === 'writing') {
      return 'Remember to save your work!';
    }

    return null;
  }

  isEnabled(): boolean {
    return this.enabled;
  }
}

export const contextAwareness = new ContextAwareness();
