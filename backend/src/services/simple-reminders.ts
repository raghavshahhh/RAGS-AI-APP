// ============================================================================
// SIMPLE REMINDERS - Local, Offline Reminder System
// ============================================================================

import * as fs from 'fs/promises';
import * as path from 'path';
import { EventEmitter } from 'events';

interface Reminder {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  remind_at: string; // ISO timestamp
  created_at: string;
  completed: boolean;
  repeat?: 'none' | 'daily' | 'weekly' | 'monthly';
  priority?: 'low' | 'medium' | 'high';
  notified?: boolean;
}

export class SimpleReminders extends EventEmitter {
  private dataDir: string;
  private remindersFile: string;
  private userId: string;
  private checkInterval: NodeJS.Timeout | null = null;

  constructor(userId: string = 'default-user') {
    super();
    this.userId = userId;
    
    const homeDir = process.env.HOME || '';
    this.dataDir = path.join(homeDir, '.rags', 'reminders');
    this.remindersFile = path.join(this.dataDir, `${userId}_reminders.json`);
  }

  async initialize(): Promise<void> {
    try {
      await fs.mkdir(this.dataDir, { recursive: true });
      await this.ensureFile(this.remindersFile, '[]');
      
      // Start checking for due reminders
      this.startChecking();
      
      console.log('⏰ Reminders system initialized');
    } catch (error) {
      console.error('Reminders init failed:', error);
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
   * Create a new reminder
   */
  async addReminder(
    title: string,
    remindAt: Date | string,
    options: {
      description?: string;
      repeat?: 'none' | 'daily' | 'weekly' | 'monthly';
      priority?: 'low' | 'medium' | 'high';
    } = {}
  ): Promise<Reminder> {
    try {
      const reminder: Reminder = {
        id: `rem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        user_id: this.userId,
        title,
        description: options.description,
        remind_at: typeof remindAt === 'string' ? remindAt : remindAt.toISOString(),
        created_at: new Date().toISOString(),
        completed: false,
        repeat: options.repeat || 'none',
        priority: options.priority || 'medium',
        notified: false
      };

      const reminders = await this.readReminders();
      reminders.push(reminder);
      await this.writeReminders(reminders);

      console.log(`✅ Reminder created: ${title}`);
      return reminder;
    } catch (error) {
      console.error('Failed to add reminder:', error);
      throw error;
    }
  }

  /**
   * Get all pending reminders
   */
  async getPendingReminders(): Promise<Reminder[]> {
    const reminders = await this.readReminders();
    return reminders.filter(r => !r.completed);
  }

  /**
   * Get upcoming reminders (next 24 hours)
   */
  async getUpcomingReminders(): Promise<Reminder[]> {
    const reminders = await this.readReminders();
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    return reminders
      .filter(r => !r.completed)
      .filter(r => {
        const remindAt = new Date(r.remind_at);
        return remindAt >= now && remindAt <= tomorrow;
      })
      .sort((a, b) => new Date(a.remind_at).getTime() - new Date(b.remind_at).getTime());
  }

  /**
   * Mark reminder as completed
   */
  async completeReminder(id: string): Promise<void> {
    const reminders = await this.readReminders();
    const reminder = reminders.find(r => r.id === id);
    
    if (reminder) {
      reminder.completed = true;
      await this.writeReminders(reminders);
      console.log(`✅ Reminder completed: ${reminder.title}`);
    }
  }

  /**
   * Delete reminder
   */
  async deleteReminder(id: string): Promise<void> {
    let reminders = await this.readReminders();
    reminders = reminders.filter(r => r.id !== id);
    await this.writeReminders(reminders);
    console.log(`🗑️ Reminder deleted`);
  }

  /**
   * Check for due reminders (runs every minute)
   */
  private startChecking(): void {
    this.checkInterval = setInterval(async () => {
      await this.checkDueReminders();
    }, 60000); // Every minute
  }

  /**
   * Check and emit events for due reminders
   */
  private async checkDueReminders(): Promise<void> {
    try {
      const reminders = await this.readReminders();
      const now = new Date();

      for (const reminder of reminders) {
        if (reminder.completed || reminder.notified) continue;

        const remindAt = new Date(reminder.remind_at);
        if (remindAt <= now) {
          console.log(`⏰ Reminder due: ${reminder.title}`);
          
          this.emit('reminder', reminder);
          
          // Mark as notified
          reminder.notified = true;
          await this.writeReminders(reminders);

          // Handle repeat
          if (reminder.repeat !== 'none') {
            await this.createRepeatReminder(reminder);
          }
        }
      }
    } catch (error) {
      console.error('Error checking reminders:', error);
    }
  }

  /**
   * Create next reminder for repeating reminders
   */
  private async createRepeatReminder(reminder: Reminder): Promise<void> {
    const now = new Date();
    let nextDate = new Date(reminder.remind_at);

    switch (reminder.repeat) {
      case 'daily':
        nextDate.setDate(nextDate.getDate() + 1);
        break;
      case 'weekly':
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
    }

    if (nextDate > now) {
      await this.addReminder(reminder.title, nextDate, {
        description: reminder.description,
        repeat: reminder.repeat,
        priority: reminder.priority
      });
    }
  }

  /**
   * Parse natural language time to Date
   */
  parseNaturalTime(text: string): Date | null {
    const now = new Date();
    const lowerText = text.toLowerCase();

    // Relative times
    if (lowerText.includes('in') && lowerText.includes('minute')) {
      const match = lowerText.match(/in (\d+) minute/);
      if (match) {
        const minutes = parseInt(match[1]);
        return new Date(now.getTime() + minutes * 60 * 1000);
      }
    }

    if (lowerText.includes('in') && lowerText.includes('hour')) {
      const match = lowerText.match(/in (\d+) hour/);
      if (match) {
        const hours = parseInt(match[1]);
        return new Date(now.getTime() + hours * 60 * 60 * 1000);
      }
    }

    // Specific times
    if (lowerText.includes('tomorrow')) {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0); // Default to 9 AM
      return tomorrow;
    }

    if (lowerText.includes('next week')) {
      const nextWeek = new Date(now);
      nextWeek.setDate(nextWeek.getDate() + 7);
      nextWeek.setHours(9, 0, 0, 0);
      return nextWeek;
    }

    return null;
  }

  /**
   * Get stats
   */
  async getStats() {
    const reminders = await this.readReminders();
    const pending = reminders.filter(r => !r.completed);
    const completed = reminders.filter(r => r.completed);
    const upcoming = await this.getUpcomingReminders();

    return {
      total: reminders.length,
      pending: pending.length,
      completed: completed.length,
      upcoming: upcoming.length
    };
  }

  private async readReminders(): Promise<Reminder[]> {
    try {
      const content = await fs.readFile(this.remindersFile, 'utf-8');
      return JSON.parse(content);
    } catch {
      return [];
    }
  }

  private async writeReminders(reminders: Reminder[]): Promise<void> {
    await fs.writeFile(this.remindersFile, JSON.stringify(reminders, null, 2), 'utf-8');
  }

  async stop(): Promise<void> {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }
}

export const simpleReminders = new SimpleReminders();
