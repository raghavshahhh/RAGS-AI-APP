// ============================================================================
// RAGS AI - Agent Decision Engine (Phase 2)
// ============================================================================

import { EventEmitter } from 'events';
import { OllamaBrain } from './ollama-brain';
import { MemorySystem } from './memory-system';

export interface AgentAction {
  id: string;
  type: 'system' | 'content' | 'social' | 'life' | 'custom';
  name: string;
  description: string;
  parameters: Record<string, any>;
  priority: number; // 1-10
  status: 'pending' | 'executing' | 'completed' | 'failed';
  result?: any;
  error?: string;
  createdAt: Date;
  executedAt?: Date;
}

export interface AgentDecision {
  intent: string;
  confidence: number;
  actions: AgentAction[];
  reasoning: string;
}

export class AgentEngine extends EventEmitter {
  private brain: OllamaBrain;
  private memory: MemorySystem;
  private availableActions: Map<string, Function>;
  private actionQueue: AgentAction[] = [];

  constructor(brain: OllamaBrain, memory: MemorySystem) {
    super();
    this.brain = brain;
    this.memory = memory;
    this.availableActions = new Map();
    this.registerDefaultActions();
  }

  /**
   * Process user input and decide what actions to take
   */
  async decide(userInput: string): Promise<AgentDecision> {
    console.log('🤖 Agent analyzing request...');

    // Get context from memory
    const context = await this.memory.getContextForAI(userInput);

    // Build decision prompt
    const prompt = `You are RAGS, an AI agent that can perform actions.

${context}

User request: "${userInput}"

Available actions:
${Array.from(this.availableActions.keys()).map(name => `- ${name}`).join('\n')}

Analyze the request and respond in JSON format:
{
  "intent": "what user wants to do",
  "confidence": 0-1,
  "actions": [
    {
      "name": "action_name",
      "parameters": {"key": "value"},
      "priority": 1-10
    }
  ],
  "reasoning": "why these actions"
}

If no actions needed, set actions to empty array.`;

    try {
      const response = await this.brain.chat(prompt);
      
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const decision = JSON.parse(jsonMatch[0]);

      // Convert to AgentDecision format
      const agentDecision: AgentDecision = {
        intent: decision.intent || 'unknown',
        confidence: decision.confidence || 0.5,
        actions: (decision.actions || []).map((a: any) => ({
          id: this.generateActionId(),
          type: this.inferActionType(a.name),
          name: a.name,
          description: '',
          parameters: a.parameters || {},
          priority: a.priority || 5,
          status: 'pending',
          createdAt: new Date(),
        })),
        reasoning: decision.reasoning || 'No reasoning provided',
      };

      console.log(`✅ Decision made: ${agentDecision.actions.length} actions planned`);
      this.emit('decision', agentDecision);

      return agentDecision;
    } catch (error: any) {
      console.error('❌ Decision failed:', error.message);
      
      return {
        intent: 'error',
        confidence: 0,
        actions: [],
        reasoning: `Failed to parse decision: ${error.message}`,
      };
    }
  }

  /**
   * Execute a single action
   */
  async executeAction(action: AgentAction): Promise<any> {
    console.log(`⚡ Executing: ${action.name}`);
    
    action.status = 'executing';
    this.emit('action:start', action);

    try {
      const actionFunc = this.availableActions.get(action.name);
      
      if (!actionFunc) {
        throw new Error(`Action '${action.name}' not found`);
      }

      const result = await actionFunc(action.parameters);
      
      action.status = 'completed';
      action.result = result;
      action.executedAt = new Date();
      
      console.log(`✅ Completed: ${action.name}`);
      this.emit('action:complete', action);

      return result;
    } catch (error: any) {
      action.status = 'failed';
      action.error = error.message;
      
      console.error(`❌ Failed: ${action.name}`, error.message);
      this.emit('action:error', action, error);

      throw error;
    }
  }

  /**
   * Execute multiple actions in sequence
   */
  async executeActions(actions: AgentAction[]): Promise<any[]> {
    const results: any[] = [];

    // Sort by priority (higher first)
    const sortedActions = [...actions].sort((a, b) => b.priority - a.priority);

    for (const action of sortedActions) {
      try {
        const result = await this.executeAction(action);
        results.push(result);
      } catch (error) {
        // Continue with other actions even if one fails
        results.push(null);
      }
    }

    return results;
  }

  /**
   * Add action to queue
   */
  queueAction(action: AgentAction): void {
    this.actionQueue.push(action);
    this.emit('queue:add', action);
    console.log(`📥 Action queued: ${action.name} (${this.actionQueue.length} in queue)`);
  }

  /**
   * Process action queue
   */
  async processQueue(): Promise<void> {
    if (this.actionQueue.length === 0) {
      console.log('📭 Queue empty');
      return;
    }

    console.log(`📤 Processing ${this.actionQueue.length} queued actions...`);

    while (this.actionQueue.length > 0) {
      const action = this.actionQueue.shift()!;
      await this.executeAction(action);
    }

    console.log('✅ Queue processed');
  }

  /**
   * Register an action handler
   */
  registerAction(name: string, handler: Function): void {
    this.availableActions.set(name, handler);
    console.log(`✅ Registered action: ${name}`);
  }

  /**
   * Register default system actions
   */
  private registerDefaultActions(): void {
    // System control actions
    this.registerAction('open_app', async (params: any) => {
      const { appName } = params;
      console.log(`Opening app: ${appName}`);
      // Implementation in automation.ts
      return { success: true, app: appName };
    });

    this.registerAction('close_app', async (params: any) => {
      const { appName } = params;
      console.log(`Closing app: ${appName}`);
      return { success: true, app: appName };
    });

    this.registerAction('search_web', async (params: any) => {
      const { query } = params;
      console.log(`Searching web: ${query}`);
      return { success: true, query };
    });

    // Content creation actions
    this.registerAction('generate_image', async (params: any) => {
      const { prompt } = params;
      console.log(`Generating image: ${prompt}`);
      return { success: true, prompt };
    });

    this.registerAction('generate_content', async (params: any) => {
      const { type, topic } = params;
      console.log(`Generating ${type} about: ${topic}`);
      return { success: true, type, topic };
    });

    // Life management actions
    this.registerAction('create_reminder', async (params: any) => {
      const { title, time } = params;
      console.log(`Creating reminder: ${title} at ${time}`);
      return { success: true, title, time };
    });

    this.registerAction('create_note', async (params: any) => {
      const { title, content } = params;
      console.log(`Creating note: ${title}`);
      return { success: true, title };
    });

    this.registerAction('track_habit', async (params: any) => {
      const { habit } = params;
      console.log(`Tracking habit: ${habit}`);
      return { success: true, habit };
    });

    // Communication actions
    this.registerAction('send_message', async (params: any) => {
      const { to, message } = params;
      console.log(`Sending message to ${to}`);
      return { success: true, to };
    });

    this.registerAction('post_social', async (params: any) => {
      const { platform, content } = params;
      console.log(`Posting to ${platform}`);
      return { success: true, platform };
    });
  }

  /**
   * Infer action type from name
   */
  private inferActionType(name: string): AgentAction['type'] {
    if (name.includes('app') || name.includes('system')) return 'system';
    if (name.includes('generate') || name.includes('create_content')) return 'content';
    if (name.includes('post') || name.includes('social')) return 'social';
    if (name.includes('reminder') || name.includes('note') || name.includes('habit')) return 'life';
    return 'custom';
  }

  /**
   * Generate unique action ID
   */
  private generateActionId(): string {
    return `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get available actions list
   */
  getAvailableActions(): string[] {
    return Array.from(this.availableActions.keys());
  }

  /**
   * Clear action queue
   */
  clearQueue(): void {
    this.actionQueue = [];
    console.log('🗑️ Action queue cleared');
  }
}
