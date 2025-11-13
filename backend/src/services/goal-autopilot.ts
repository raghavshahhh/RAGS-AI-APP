/**
 * 🎯 GOAL-ORIENTED AUTOPILOT
 * Long-term goals, autonomous execution, habit formation
 */

import { EventEmitter } from 'events';
import { OllamaBrain } from './ollama-brain';
import * as fs from 'fs/promises';
import * as path from 'path';

interface LongTermGoal {
  id: string;
  title: string;
  description: string;
  target_date: Date;
  milestones: Milestone[];
  progress: number; // 0-100
  status: 'active' | 'completed' | 'paused' | 'failed';
  created_at: Date;
}

interface Milestone {
  id: string;
  title: string;
  tasks: Task[];
  deadline: Date;
  completed: boolean;
}

interface Task {
  id: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  estimated_duration: number; // minutes
  completed: boolean;
  completed_at?: Date;
}

interface DailyRoutine {
  id: string;
  name: string;
  time: string; // HH:MM
  tasks: string[];
  enabled: boolean;
}

interface Habit {
  id: string;
  name: string;
  description: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  streak: number;
  longest_streak: number;
  last_completed: Date;
  total_completions: number;
}

interface ProactiveAction {
  id: string;
  type: 'reminder' | 'suggestion' | 'automation' | 'warning';
  message: string;
  action?: string;
  scheduled_for: Date;
  executed: boolean;
}

export class GoalAutopilot extends EventEmitter {
  private brain: OllamaBrain;
  private dataDir: string;
  private goals: Map<string, LongTermGoal> = new Map();
  private routines: Map<string, DailyRoutine> = new Map();
  private habits: Map<string, Habit> = new Map();
  private proactiveActions: ProactiveAction[] = [];
  private enabled: boolean = true;

  constructor(brain: OllamaBrain, userId: string = 'default') {
    super();
    this.brain = brain;
    this.dataDir = path.join(process.env.HOME || '', '.rags', 'goal-autopilot', userId);
  }

  /**
   * Initialize Goal Autopilot
   */
  async initialize(): Promise<void> {
    console.log('🎯 Initializing Goal Autopilot...');

    await fs.mkdir(this.dataDir, { recursive: true });

    // Load existing data
    await this.loadData();

    // Start autopilot loop
    this.startAutopilot();

    console.log(`✅ Goal Autopilot initialized with ${this.goals.size} goals`);
  }

  /**
   * Create long-term goal with AI-generated roadmap
   */
  async createGoal(title: string, description: string, targetDate: Date): Promise<LongTermGoal> {
    console.log(`🎯 Creating goal: ${title}`);

    // Generate roadmap with AI
    const roadmap = await this.generateRoadmap(title, description, targetDate);

    const goal: LongTermGoal = {
      id: `goal_${Date.now()}`,
      title,
      description,
      target_date: targetDate,
      milestones: roadmap,
      progress: 0,
      status: 'active',
      created_at: new Date()
    };

    this.goals.set(goal.id, goal);
    await this.saveData();

    this.emit('goal_created', goal);
    console.log(`✅ Goal created with ${roadmap.length} milestones`);

    return goal;
  }

  /**
   * Generate AI roadmap for goal
   */
  private async generateRoadmap(title: string, description: string, targetDate: Date): Promise<Milestone[]> {
    const daysUntilTarget = Math.ceil((targetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    const weeksUntilTarget = Math.ceil(daysUntilTarget / 7);

    const prompt = `
Create a detailed roadmap to achieve this goal:

Goal: ${title}
Description: ${description}
Target Date: ${targetDate.toDateString()} (${daysUntilTarget} days from now)

Create a step-by-step roadmap with:
- ${weeksUntilTarget} weekly milestones
- Each milestone should have 3-5 specific tasks
- Tasks should be actionable and measurable
- Arrange in logical order

Format as JSON:
{
  "milestones": [
    {
      "title": "Week 1: ...",
      "tasks": ["Task 1", "Task 2", "Task 3"],
      "week": 1
    }
  ]
}
`;

    try {
      const response = await this.brain.chat(prompt);
      const parsed = JSON.parse(response);

      const milestones: Milestone[] = parsed.milestones.map((m: any, index: number) => {
        const weekOffset = index * 7;
        const deadline = new Date(Date.now() + weekOffset * 24 * 60 * 60 * 1000);

        return {
          id: `milestone_${Date.now()}_${index}`,
          title: m.title,
          tasks: m.tasks.map((t: string, ti: number) => ({
            id: `task_${Date.now()}_${index}_${ti}`,
            description: t,
            priority: 'medium' as const,
            estimated_duration: 60,
            completed: false
          })),
          deadline,
          completed: false
        };
      });

      return milestones;
    } catch (error) {
      console.error('Error generating roadmap:', error);
      
      // Fallback: create simple milestones
      return [{
        id: `milestone_${Date.now()}`,
        title: `Complete: ${title}`,
        tasks: [{
          id: `task_${Date.now()}`,
          description: description,
          priority: 'high',
          estimated_duration: 120,
          completed: false
        }],
        deadline: targetDate,
        completed: false
      }];
    }
  }

  /**
   * Get today's tasks
   */
  getTodaysTasks(): Task[] {
    const today = new Date();
    const tasks: Task[] = [];

    // Get tasks from active goals
    this.goals.forEach(goal => {
      if (goal.status !== 'active') return;

      goal.milestones.forEach(milestone => {
        if (!milestone.completed && milestone.deadline >= today) {
          milestone.tasks
            .filter(t => !t.completed)
            .forEach(t => tasks.push(t));
        }
      });
    });

    // Sort by priority
    return tasks.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Complete task
   */
  async completeTask(taskId: string): Promise<void> {
    let taskFound = false;

    this.goals.forEach(goal => {
      goal.milestones.forEach(milestone => {
        const task = milestone.tasks.find(t => t.id === taskId);
        if (task) {
          task.completed = true;
          task.completed_at = new Date();
          taskFound = true;

          // Check if milestone completed
          const allTasksComplete = milestone.tasks.every(t => t.completed);
          if (allTasksComplete) {
            milestone.completed = true;
            console.log(`✅ Milestone completed: ${milestone.title}`);
          }

          // Update goal progress
          this.updateGoalProgress(goal);
        }
      });
    });

    if (taskFound) {
      await this.saveData();
      this.emit('task_completed', taskId);
    }
  }

  /**
   * Add habit to track
   */
  async addHabit(name: string, description: string, frequency: Habit['frequency']): Promise<Habit> {
    const habit: Habit = {
      id: `habit_${Date.now()}`,
      name,
      description,
      frequency,
      streak: 0,
      longest_streak: 0,
      last_completed: new Date(0),
      total_completions: 0
    };

    this.habits.set(habit.id, habit);
    await this.saveData();

    console.log(`✅ Habit added: ${name}`);
    return habit;
  }

  /**
   * Complete habit (for today)
   */
  async completeHabit(habitId: string): Promise<void> {
    const habit = this.habits.get(habitId);
    if (!habit) return;

    const now = new Date();
    const lastCompleted = habit.last_completed;

    // Check if already completed today
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const lastDate = new Date(lastCompleted.getFullYear(), lastCompleted.getMonth(), lastCompleted.getDate());

    if (today.getTime() === lastDate.getTime()) {
      console.log('⚠️  Habit already completed today');
      return;
    }

    // Check streak
    const daysDiff = Math.floor((now.getTime() - lastCompleted.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff <= 1) {
      habit.streak++;
    } else {
      habit.streak = 1; // Reset streak
    }

    habit.longest_streak = Math.max(habit.longest_streak, habit.streak);
    habit.last_completed = now;
    habit.total_completions++;

    await this.saveData();

    console.log(`✅ Habit completed: ${habit.name} (Streak: ${habit.streak})`);
    this.emit('habit_completed', habit);

    // Celebrate milestones
    if (habit.streak === 7) {
      this.scheduleProactiveAction({
        type: 'suggestion',
        message: `🎉 Awesome! You've maintained ${habit.name} for 7 days straight!`,
        scheduled_for: now
      });
    }
  }

  /**
   * Schedule proactive action
   */
  scheduleProactiveAction(action: Omit<ProactiveAction, 'id' | 'executed'>): void {
    const proactive: ProactiveAction = {
      id: `action_${Date.now()}`,
      executed: false,
      ...action
    };

    this.proactiveActions.push(proactive);
    this.emit('proactive_action_scheduled', proactive);
  }

  /**
   * Execute due proactive actions
   */
  private async executeDueActions(): Promise<void> {
    const now = new Date();

    const dueActions = this.proactiveActions.filter(
      a => !a.executed && a.scheduled_for <= now
    );

    for (const action of dueActions) {
      console.log(`🤖 Executing proactive action: ${action.message}`);
      
      this.emit('proactive_action', action);
      
      if (action.action) {
        // Execute the action (e.g., open app, send notification)
        console.log(`Executing: ${action.action}`);
      }

      action.executed = true;
    }

    if (dueActions.length > 0) {
      await this.saveData();
    }
  }

  /**
   * Generate morning briefing
   */
  async generateMorningBriefing(): Promise<string> {
    const todaysTasks = this.getTodaysTasks();
    const activeGoals = Array.from(this.goals.values()).filter(g => g.status === 'active');
    const pendingHabits = Array.from(this.habits.values()).filter(h => {
      const today = new Date();
      const lastDate = new Date(h.last_completed.getFullYear(), h.last_completed.getMonth(), h.last_completed.getDate());
      return lastDate < new Date(today.getFullYear(), today.getMonth(), today.getDate());
    });

    const briefing = `
🌅 Good Morning! Here's your day:

📋 Today's Tasks (${todaysTasks.length}):
${todaysTasks.slice(0, 5).map((t, i) => `${i + 1}. ${t.description}`).join('\n')}

🎯 Active Goals (${activeGoals.length}):
${activeGoals.map(g => `- ${g.title}: ${g.progress.toFixed(0)}% complete`).join('\n')}

💪 Habits to Complete (${pendingHabits.length}):
${pendingHabits.map(h => `- ${h.name} (Streak: ${h.streak})`).join('\n')}

Have a productive day! 🚀
`;

    return briefing.trim();
  }

  /**
   * Start autopilot loop
   */
  private startAutopilot(): void {
    if (!this.enabled) return;

    // Check and execute proactive actions every minute
    setInterval(async () => {
      try {
        await this.executeDueActions();
      } catch (error) {
        console.error('Autopilot error:', error);
      }
    }, 60 * 1000);

    // Morning briefing at 8 AM
    this.scheduleDailyBriefing();

    // Evening review at 9 PM
    this.scheduleDailyReview();

    console.log('🤖 Autopilot started');
  }

  private scheduleDailyBriefing(): void {
    // Schedule morning briefing
    const now = new Date();
    const tomorrow8AM = new Date(now);
    tomorrow8AM.setDate(tomorrow8AM.getDate() + 1);
    tomorrow8AM.setHours(8, 0, 0, 0);

    this.scheduleProactiveAction({
      type: 'reminder',
      message: 'Morning Briefing Ready',
      action: 'generate_briefing',
      scheduled_for: tomorrow8AM
    });
  }

  private scheduleDailyReview(): void {
    // Schedule evening review
    const now = new Date();
    const today9PM = new Date(now);
    today9PM.setHours(21, 0, 0, 0);

    if (today9PM > now) {
      this.scheduleProactiveAction({
        type: 'reminder',
        message: 'Daily Review Time',
        action: 'generate_review',
        scheduled_for: today9PM
      });
    }
  }

  private updateGoalProgress(goal: LongTermGoal): void {
    const totalTasks = goal.milestones.reduce((sum, m) => sum + m.tasks.length, 0);
    const completedTasks = goal.milestones.reduce(
      (sum, m) => sum + m.tasks.filter(t => t.completed).length,
      0
    );

    goal.progress = (completedTasks / totalTasks) * 100;

    if (goal.progress === 100) {
      goal.status = 'completed';
      console.log(`🎉 Goal completed: ${goal.title}`);
      this.emit('goal_completed', goal);
    }
  }

  /**
   * Get statistics
   */
  getStats(): any {
    const goals = Array.from(this.goals.values());
    const habits = Array.from(this.habits.values());

    return {
      goals: {
        total: goals.length,
        active: goals.filter(g => g.status === 'active').length,
        completed: goals.filter(g => g.status === 'completed').length,
        average_progress: goals.reduce((sum, g) => sum + g.progress, 0) / goals.length
      },
      tasks: {
        today: this.getTodaysTasks().length,
        completed_today: 0 // Would track daily completions
      },
      habits: {
        total: habits.length,
        active_streaks: habits.filter(h => h.streak > 0).length,
        longest_streak: Math.max(...habits.map(h => h.longest_streak), 0)
      },
      proactive_actions: {
        scheduled: this.proactiveActions.filter(a => !a.executed).length,
        executed: this.proactiveActions.filter(a => a.executed).length
      }
    };
  }

  // Data persistence

  private async loadData(): Promise<void> {
    try {
      const dataFile = path.join(this.dataDir, 'autopilot_data.json');
      const data = await fs.readFile(dataFile, 'utf-8');
      const parsed = JSON.parse(data);

      if (parsed.goals) {
        this.goals = new Map(Object.entries(parsed.goals));
      }
      if (parsed.habits) {
        this.habits = new Map(Object.entries(parsed.habits));
      }
      if (parsed.proactiveActions) {
        this.proactiveActions = parsed.proactiveActions;
      }

      console.log(`📊 Loaded autopilot data`);
    } catch (error) {
      console.log('📊 No existing autopilot data');
    }
  }

  private async saveData(): Promise<void> {
    try {
      const dataFile = path.join(this.dataDir, 'autopilot_data.json');
      await fs.writeFile(dataFile, JSON.stringify({
        goals: Object.fromEntries(this.goals),
        habits: Object.fromEntries(this.habits),
        proactiveActions: this.proactiveActions
      }, null, 2));
    } catch (error) {
      console.error('Error saving autopilot data:', error);
    }
  }
}
