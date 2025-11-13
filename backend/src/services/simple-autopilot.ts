// ============================================================================
// SIMPLE AUTOPILOT - Basic Automation & Routines
// ============================================================================

import { EventEmitter } from 'events';
import * as fs from 'fs/promises';
import * as path from 'path';

interface AutopilotRoutine {
  id: string;
  name: string;
  description: string;
  actions: string[]; // List of commands to execute
  schedule?: string; // cron-like or simple: "daily-9am", "hourly", etc.
  enabled: boolean;
  lastRun?: string;
  runCount: number;
}

export class SimpleAutopilot extends EventEmitter {
  private dataDir: string;
  private routinesFile: string;
  private isRunning: boolean = false;
  private checkInterval: NodeJS.Timeout | null = null;

  constructor() {
    super();
    const homeDir = process.env.HOME || '';
    this.dataDir = path.join(homeDir, '.rags', 'autopilot');
    this.routinesFile = path.join(this.dataDir, 'routines.json');
  }

  async initialize(): Promise<void> {
    try {
      await fs.mkdir(this.dataDir, { recursive: true });
      await this.ensureFile(this.routinesFile, '[]');
      console.log('🤖 Autopilot initialized');
    } catch (error) {
      console.error('Autopilot init failed:', error);
    }
  }

  private async ensureFile(filepath: string, defaultContent: string): Promise<void> {
    try {
      await fs.access(filepath);
    } catch {
      await fs.writeFile(filepath, defaultContent, 'utf-8');
    }
  }

  /**
   * Start autopilot - runs scheduled routines
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('⚠️ Autopilot already running');
      return;
    }

    this.isRunning = true;
    console.log('🤖 Autopilot STARTED');
    
    // Check routines every 5 minutes
    this.checkInterval = setInterval(async () => {
      await this.checkScheduledRoutines();
    }, 5 * 60 * 1000);

    this.emit('started');
  }

  /**
   * Stop autopilot
   */
  async stop(): Promise<void> {
    this.isRunning = false;
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    console.log('🛑 Autopilot STOPPED');
    this.emit('stopped');
  }

  /**
   * Create a new routine
   */
  async createRoutine(
    name: string,
    description: string,
    actions: string[],
    schedule?: string
  ): Promise<AutopilotRoutine> {
    const routine: AutopilotRoutine = {
      id: `routine_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      description,
      actions,
      schedule,
      enabled: true,
      runCount: 0
    };

    const routines = await this.readRoutines();
    routines.push(routine);
    await this.writeRoutines(routines);

    console.log(`✅ Routine created: ${name}`);
    return routine;
  }

  /**
   * Get all routines
   */
  async getRoutines(): Promise<AutopilotRoutine[]> {
    return await this.readRoutines();
  }

  /**
   * Enable/disable routine
   */
  async toggleRoutine(id: string, enabled: boolean): Promise<void> {
    const routines = await this.readRoutines();
    const routine = routines.find(r => r.id === id);
    
    if (routine) {
      routine.enabled = enabled;
      await this.writeRoutines(routines);
      console.log(`${enabled ? '✅' : '❌'} Routine ${routine.name} ${enabled ? 'enabled' : 'disabled'}`);
    }
  }

  /**
   * Run a routine manually
   */
  async runRoutine(id: string): Promise<void> {
    const routines = await this.readRoutines();
    const routine = routines.find(r => r.id === id);
    
    if (!routine) {
      console.log('⚠️ Routine not found');
      return;
    }

    console.log(`🤖 Running routine: ${routine.name}`);
    
    // Emit event for each action
    for (const action of routine.actions) {
      this.emit('action', { routine: routine.name, action });
      console.log(`  ▶️ ${action}`);
    }

    // Update stats
    routine.lastRun = new Date().toISOString();
    routine.runCount++;
    await this.writeRoutines(routines);

    this.emit('routine_completed', routine);
  }

  /**
   * Delete routine
   */
  async deleteRoutine(id: string): Promise<void> {
    let routines = await this.readRoutines();
    routines = routines.filter(r => r.id !== id);
    await this.writeRoutines(routines);
    console.log('🗑️ Routine deleted');
  }

  /**
   * Check and run scheduled routines
   */
  private async checkScheduledRoutines(): Promise<void> {
    const routines = await this.readRoutines();
    const now = new Date();

    for (const routine of routines) {
      if (!routine.enabled || !routine.schedule) continue;

      if (this.shouldRunRoutine(routine, now)) {
        await this.runRoutine(routine.id);
      }
    }
  }

  /**
   * Check if routine should run based on schedule
   */
  private shouldRunRoutine(routine: AutopilotRoutine, now: Date): boolean {
    if (!routine.schedule) return false;
    if (!routine.lastRun) return true; // Never run before

    const lastRun = new Date(routine.lastRun);
    const hoursSinceLastRun = (now.getTime() - lastRun.getTime()) / (1000 * 60 * 60);

    switch (routine.schedule) {
      case 'hourly':
        return hoursSinceLastRun >= 1;
      case 'daily-9am':
        return now.getHours() === 9 && hoursSinceLastRun >= 23;
      case 'daily-6pm':
        return now.getHours() === 18 && hoursSinceLastRun >= 23;
      case 'weekly':
        return hoursSinceLastRun >= 168; // 7 days
      default:
        return false;
    }
  }

  /**
   * Create default helpful routines
   */
  async createDefaultRoutines(): Promise<void> {
    // Morning routine
    await this.createRoutine(
      'Morning Briefing',
      'Daily morning update at 9 AM',
      [
        'Good morning! Time to start the day.',
        'Check reminders for today',
        'Weather update'
      ],
      'daily-9am'
    );

    // Evening routine
    await this.createRoutine(
      'Evening Summary',
      'Daily evening summary at 6 PM',
      [
        'Good evening! Here\'s your day summary.',
        'Pending tasks check',
        'Tomorrow\'s schedule preview'
      ],
      'daily-6pm'
    );

    console.log('✅ Default routines created');
  }

  private async readRoutines(): Promise<AutopilotRoutine[]> {
    try {
      const content = await fs.readFile(this.routinesFile, 'utf-8');
      return JSON.parse(content);
    } catch {
      return [];
    }
  }

  private async writeRoutines(routines: AutopilotRoutine[]): Promise<void> {
    await fs.writeFile(this.routinesFile, JSON.stringify(routines, null, 2), 'utf-8');
  }

  isActive(): boolean {
    return this.isRunning;
  }
}

export const simpleAutopilot = new SimpleAutopilot();
