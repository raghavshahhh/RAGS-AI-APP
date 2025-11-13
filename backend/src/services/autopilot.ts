// ============================================================================
// RAGS AI - Autopilot Mode (Phase 2)
// Automated routines and scheduled tasks
// ============================================================================

import { EventEmitter } from 'events';
import { AgentEngine, AgentAction } from './agent-engine';
import { ActionGraphEngine } from './action-graph';
import { MemorySystem } from './memory-system';

export interface AutopilotRoutine {
  id: string;
  name: string;
  description: string;
  trigger: 'time' | 'event' | 'condition';
  schedule?: string; // cron-like: '0 9 * * *' = 9 AM daily
  eventType?: string;
  condition?: () => Promise<boolean>;
  actions: AgentAction[];
  enabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
  runCount: number;
}

export class AutopilotEngine extends EventEmitter {
  private agent: AgentEngine;
  private actionGraph: ActionGraphEngine;
  private memory: MemorySystem;
  private routines: Map<string, AutopilotRoutine> = new Map();
  private timers: Map<string, NodeJS.Timeout> = new Map();
  private isRunning = false;

  constructor(
    agent: AgentEngine,
    actionGraph: ActionGraphEngine,
    memory: MemorySystem
  ) {
    super();
    this.agent = agent;
    this.actionGraph = actionGraph;
    this.memory = memory;
    this.registerDefaultRoutines();
  }

  /**
   * Start autopilot mode
   */
  start(): void {
    if (this.isRunning) {
      console.log('⚠️ Autopilot already running');
      return;
    }

    this.isRunning = true;
    console.log('🤖 Autopilot mode ACTIVATED');
    this.emit('autopilot:start');

    // Start all enabled routines
    this.routines.forEach(routine => {
      if (routine.enabled) {
        this.scheduleRoutine(routine);
      }
    });
  }

  /**
   * Stop autopilot mode
   */
  stop(): void {
    this.isRunning = false;
    console.log('🛑 Autopilot mode DEACTIVATED');
    this.emit('autopilot:stop');

    // Clear all timers
    this.timers.forEach(timer => clearTimeout(timer));
    this.timers.clear();
  }

  /**
   * Create a new routine
   */
  createRoutine(
    name: string,
    description: string,
    trigger: AutopilotRoutine['trigger'],
    actions: AgentAction[],
    options: Partial<AutopilotRoutine> = {}
  ): AutopilotRoutine {
    const routine: AutopilotRoutine = {
      id: this.generateRoutineId(),
      name,
      description,
      trigger,
      actions,
      enabled: true,
      runCount: 0,
      ...options,
    };

    this.routines.set(routine.id, routine);
    console.log(`✅ Created routine: ${name}`);

    if (this.isRunning && routine.enabled) {
      this.scheduleRoutine(routine);
    }

    return routine;
  }

  /**
   * Schedule a routine based on its trigger
   */
  private scheduleRoutine(routine: AutopilotRoutine): void {
    if (routine.trigger === 'time' && routine.schedule) {
      const delay = this.parseSchedule(routine.schedule);
      
      const timer = setTimeout(async () => {
        await this.executeRoutine(routine.id);
        
        // Reschedule if still enabled
        if (routine.enabled && this.isRunning) {
          this.scheduleRoutine(routine);
        }
      }, delay);

      this.timers.set(routine.id, timer);
      
      const nextRun = new Date(Date.now() + delay);
      routine.nextRun = nextRun;
      
      console.log(`⏰ Scheduled: ${routine.name} at ${nextRun.toLocaleString()}`);
    }

    if (routine.trigger === 'event' && routine.eventType) {
      this.on(routine.eventType, async () => {
        await this.executeRoutine(routine.id);
      });
    }

    if (routine.trigger === 'condition' && routine.condition) {
      // Check condition every minute
      const timer = setInterval(async () => {
        if (routine.condition && await routine.condition()) {
          await this.executeRoutine(routine.id);
        }
      }, 60000); // Check every minute

      this.timers.set(routine.id, timer as any);
    }
  }

  /**
   * Execute a routine
   */
  async executeRoutine(routineId: string): Promise<void> {
    const routine = this.routines.get(routineId);
    if (!routine) {
      console.error(`Routine ${routineId} not found`);
      return;
    }

    console.log(`🚀 Executing routine: ${routine.name}`);
    this.emit('routine:start', routine);

    try {
      // Execute all actions
      await this.agent.executeActions(routine.actions);

      routine.lastRun = new Date();
      routine.runCount++;

      console.log(`✅ Routine completed: ${routine.name}`);
      this.emit('routine:complete', routine);

      // Store in memory
      await this.memory.remember(
        `Completed routine: ${routine.name}`,
        { type: 'routine', routineId: routine.id },
        6
      );
    } catch (error: any) {
      console.error(`❌ Routine failed: ${routine.name}`, error.message);
      this.emit('routine:error', routine, error);
    }
  }

  /**
   * Register default routines
   */
  private registerDefaultRoutines(): void {
    // Morning routine - 9 AM daily
    this.createRoutine(
      'Morning Briefing',
      'Daily morning routine with weather, news, and schedule',
      'time',
      [
        {
          id: this.generateActionId(),
          type: 'system',
          name: 'check_weather',
          description: 'Get weather',
          parameters: {},
          priority: 10,
          status: 'pending',
          createdAt: new Date(),
        },
        {
          id: this.generateActionId(),
          type: 'life',
          name: 'check_calendar',
          description: 'Get schedule',
          parameters: {},
          priority: 10,
          status: 'pending',
          createdAt: new Date(),
        },
        {
          id: this.generateActionId(),
          type: 'content',
          name: 'generate_briefing',
          description: 'Create briefing',
          parameters: {},
          priority: 5,
          status: 'pending',
          createdAt: new Date(),
        },
      ],
      { schedule: '0 9 * * *', enabled: false } // Disabled by default
    );

    // Evening routine - 8 PM daily
    this.createRoutine(
      'Evening Reflection',
      'Daily reflection and tomorrow planning',
      'time',
      [
        {
          id: this.generateActionId(),
          type: 'life',
          name: 'review_day',
          description: 'Review today',
          parameters: {},
          priority: 10,
          status: 'pending',
          createdAt: new Date(),
        },
        {
          id: this.generateActionId(),
          type: 'life',
          name: 'plan_tomorrow',
          description: 'Plan tomorrow',
          parameters: {},
          priority: 9,
          status: 'pending',
          createdAt: new Date(),
        },
      ],
      { schedule: '0 20 * * *', enabled: false }
    );

    // Content posting - 10 AM, 2 PM, 6 PM daily
    this.createRoutine(
      'Auto Post Content',
      'Automatically post scheduled content',
      'time',
      [
        {
          id: this.generateActionId(),
          type: 'social',
          name: 'post_scheduled_content',
          description: 'Post content',
          parameters: {},
          priority: 10,
          status: 'pending',
          createdAt: new Date(),
        },
      ],
      { schedule: '0 10,14,18 * * *', enabled: false }
    );
  }

  /**
   * Parse schedule string to milliseconds delay
   * Simple parser for common patterns
   */
  private parseSchedule(schedule: string): number {
    // Parse basic cron-like syntax: 'minute hour day month dayofweek'
    // Examples:
    // '0 9 * * *' = 9 AM daily
    // '30 14 * * *' = 2:30 PM daily
    // '0 */4 * * *' = Every 4 hours

    const parts = schedule.split(' ');
    const minute = parseInt(parts[0]) || 0;
    const hour = parseInt(parts[1]) || 0;

    const now = new Date();
    const target = new Date();
    target.setHours(hour, minute, 0, 0);

    // If time has passed today, schedule for tomorrow
    if (target <= now) {
      target.setDate(target.getDate() + 1);
    }

    return target.getTime() - now.getTime();
  }

  /**
   * Enable routine
   */
  enableRoutine(routineId: string): void {
    const routine = this.routines.get(routineId);
    if (routine) {
      routine.enabled = true;
      if (this.isRunning) {
        this.scheduleRoutine(routine);
      }
      console.log(`✅ Enabled routine: ${routine.name}`);
    }
  }

  /**
   * Disable routine
   */
  disableRoutine(routineId: string): void {
    const routine = this.routines.get(routineId);
    if (routine) {
      routine.enabled = false;
      const timer = this.timers.get(routineId);
      if (timer) {
        clearTimeout(timer);
        this.timers.delete(routineId);
      }
      console.log(`🛑 Disabled routine: ${routine.name}`);
    }
  }

  /**
   * Delete routine
   */
  deleteRoutine(routineId: string): void {
    this.disableRoutine(routineId);
    this.routines.delete(routineId);
    console.log(`🗑️ Deleted routine: ${routineId}`);
  }

  /**
   * List all routines
   */
  listRoutines(): AutopilotRoutine[] {
    return Array.from(this.routines.values());
  }

  /**
   * Get routine by ID
   */
  getRoutine(routineId: string): AutopilotRoutine | undefined {
    return this.routines.get(routineId);
  }

  /**
   * Generate unique routine ID
   */
  private generateRoutineId(): string {
    return `routine_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique action ID
   */
  private generateActionId(): string {
    return `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get autopilot status
   */
  getStatus(): {
    isRunning: boolean;
    routineCount: number;
    activeRoutines: number;
    nextRun?: Date;
  } {
    const routines = Array.from(this.routines.values());
    const activeRoutines = routines.filter(r => r.enabled);
    const nextRun = activeRoutines
      .map(r => r.nextRun)
      .filter(Boolean)
      .sort((a, b) => a!.getTime() - b!.getTime())[0];

    return {
      isRunning: this.isRunning,
      routineCount: routines.length,
      activeRoutines: activeRoutines.length,
      nextRun,
    };
  }
}
