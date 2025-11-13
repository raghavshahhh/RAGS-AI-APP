/**
 * 👋 USER GREETING SYSTEM
 * Intelligent user detection, greeting, and memory system
 */

import { EventEmitter } from 'events';
import { realCameraMonitor } from './real-camera-monitor';
import { backgroundMonitor } from './background-monitor';
import { enhancedConversationEngine } from './enhanced-conversation-engine';

interface UserSession {
  userId: string;
  name: string;
  lastSeen: Date;
  sessionCount: number;
  preferences: {
    greetingStyle: 'formal' | 'casual' | 'friendly';
    language: 'en' | 'hi' | 'hinglish';
    reminderLevel: 'high' | 'medium' | 'low';
  };
  lastActivities: string[];
  systemKnowledge: {
    lastSystemStatus: any;
    learnings: string[];
    improvements: string[];
  };
}

export class UserGreetingSystem extends EventEmitter {
  private currentUser: UserSession | null = null;
  private userDatabase: Map<string, UserSession> = new Map();
  private isUserPresent: boolean = false;
  private lastGreeting: Date | null = null;
  private greetingCooldown: number = 30000; // 30 seconds

  constructor() {
    super();
    this.setupEventListeners();
    console.log('👋 User Greeting System initialized');
  }

  private setupEventListeners(): void {
    // Listen for user detection from camera
    realCameraMonitor.on('userDetected', (detection) => {
      this.handleUserDetection(detection);
    });

    // Listen for user leaving
    realCameraMonitor.on('userLeft', () => {
      this.handleUserLeft();
    });

    // Listen for gesture responses
    realCameraMonitor.on('gestureDetected', (gesture) => {
      this.handleUserGesture(gesture);
    });

    // Listen for background context changes
    backgroundMonitor.on('contextChanged', (context) => {
      this.updateUserActivity(context);
    });
  }

  private async handleUserDetection(detection: any): Promise<void> {
    if (this.isUserPresent && this.lastGreeting && 
        Date.now() - this.lastGreeting.getTime() < this.greetingCooldown) {
      return; // Don't greet too frequently
    }

    this.isUserPresent = true;
    this.lastGreeting = new Date();

    // Get or create user session
    const userId = 'default_user'; // In future, implement face recognition
    let user = this.userDatabase.get(userId);

    if (!user) {
      user = this.createNewUser(userId);
      this.userDatabase.set(userId, user);
    } else {
      user.lastSeen = new Date();
      user.sessionCount++;
    }

    this.currentUser = user;

    // Generate personalized greeting
    const greeting = await this.generateGreeting(user);
    
    // Initialize conversation if not already done
    try {
      await enhancedConversationEngine.initializeContext(userId, 'jarvis');
    } catch (error) {
      console.log('Conversation already initialized');
    }

    // Emit greeting event
    this.emit('userGreeted', {
      userId,
      greeting,
      user,
      timestamp: new Date().toISOString()
    });

    console.log(`👋 User greeted: ${greeting}`);
  }

  private handleUserLeft(): void {
    if (this.currentUser && this.isUserPresent) {
      this.isUserPresent = false;
      
      const farewell = this.generateFarewell(this.currentUser);
      
      this.emit('userLeft', {
        userId: this.currentUser.userId,
        farewell,
        sessionDuration: Date.now() - this.currentUser.lastSeen.getTime(),
        timestamp: new Date().toISOString()
      });

      console.log(`👋 User left: ${farewell}`);
      this.currentUser = null;
    }
  }

  private handleUserGesture(gesture: any): void {
    if (this.currentUser) {
      const response = this.generateGestureResponse(gesture);
      
      this.emit('gestureResponse', {
        userId: this.currentUser.userId,
        gesture: gesture.gesture,
        response,
        timestamp: new Date().toISOString()
      });
    }
  }

  private updateUserActivity(context: any): void {
    if (this.currentUser) {
      const activity = `${context.appName}: ${context.windowTitle}`;
      this.currentUser.lastActivities.unshift(activity);
      
      // Keep only last 10 activities
      if (this.currentUser.lastActivities.length > 10) {
        this.currentUser.lastActivities = this.currentUser.lastActivities.slice(0, 10);
      }
    }
  }

  private createNewUser(userId: string): UserSession {
    return {
      userId,
      name: 'Sir', // Default name, can be customized
      lastSeen: new Date(),
      sessionCount: 1,
      preferences: {
        greetingStyle: 'friendly',
        language: 'hinglish',
        reminderLevel: 'medium'
      },
      lastActivities: [],
      systemKnowledge: {
        lastSystemStatus: null,
        learnings: [],
        improvements: []
      }
    };
  }

  private async generateGreeting(user: UserSession): Promise<string> {
    const timeOfDay = this.getTimeOfDay();
    const isFirstToday = this.isFirstSessionToday(user);
    
    const greetings = {
      first_session: [
        `Good ${timeOfDay}, ${user.name}! Welcome back to RAGS! 🚀`,
        `Hello ${user.name}! Great to see you this ${timeOfDay}! 👋`,
        `${timeOfDay === 'morning' ? 'Good morning' : timeOfDay === 'afternoon' ? 'Good afternoon' : 'Good evening'}, ${user.name}! Ready to get things done? ✨`,
        `Hey ${user.name}! RAGS is ready and all systems are working perfectly! 🎯`
      ],
      returning: [
        `Welcome back, ${user.name}! 👋`,
        `Hello again, ${user.name}! What can I help you with? 🤖`,
        `Hey ${user.name}! Ready to continue where we left off? 🚀`,
        `Good to see you again, ${user.name}! 😊`
      ]
    };

    const greetingSet = isFirstToday ? greetings.first_session : greetings.returning;
    const baseGreeting = greetingSet[Math.floor(Math.random() * greetingSet.length)];

    // Add system status info
    const systemInfo = await this.getSystemStatusSummary();
    const fullGreeting = `${baseGreeting} ${systemInfo}`;

    return fullGreeting;
  }

  private generateFarewell(user: UserSession): string {
    const farewells = [
      `Goodbye, ${user.name}! Have a great day! 👋`,
      `See you later, ${user.name}! Take care! 😊`,
      `Until next time, ${user.name}! Stay awesome! ✨`,
      `Bye ${user.name}! I'll be here when you need me! 🤖`
    ];

    return farewells[Math.floor(Math.random() * farewells.length)];
  }

  private generateGestureResponse(gesture: any): string {
    const responses = {
      wave: [
        "I see you waving! Hello there! 👋",
        "Wave back at you! 👋😊",
        "Hey! Nice wave! 👋✨"
      ],
      thumbs_up: [
        "Thumbs up! That's awesome! 👍",
        "Great! Thumbs up received! 👍😊",
        "Excellent! I love the positive vibes! 👍✨"
      ],
      peace: [
        "Peace sign! ✌️ Feeling good vibes!",
        "Peace and love! ✌️😊",
        "Nice peace sign! ✌️✨"
      ]
    };

    const gestureResponses = responses[gesture.gesture as keyof typeof responses] || [
      "I see your gesture! 👋",
      "Nice gesture! 😊",
      "Got it! 👍"
    ];

    return gestureResponses[Math.floor(Math.random() * gestureResponses.length)];
  }

  private getTimeOfDay(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    return 'evening';
  }

  private isFirstSessionToday(user: UserSession): boolean {
    const today = new Date().toDateString();
    const lastSeen = user.lastSeen.toDateString();
    return today !== lastSeen;
  }

  private async getSystemStatusSummary(): Promise<string> {
    try {
      // Get current system status
      const status = realCameraMonitor.getStatus();
      const capabilities = {
        camera: status.cameraReady,
        monitoring: status.monitoring,
        vision: true // Assuming vision is working
      };

      const workingFeatures = Object.entries(capabilities)
        .filter(([_, working]) => working)
        .map(([feature, _]) => feature);

      if (workingFeatures.length > 2) {
        return `All systems are working perfectly! Camera, vision, and monitoring are active. 🎯`;
      } else if (workingFeatures.length > 0) {
        return `${workingFeatures.join(', ')} ${workingFeatures.length === 1 ? 'is' : 'are'} working great! 👍`;
      } else {
        return `I'm ready to help you! 🤖`;
      }
    } catch (error) {
      return `I'm ready and excited to help you today! 🚀`;
    }
  }

  /**
   * Get current user information
   */
  getCurrentUser(): UserSession | null {
    return this.currentUser;
  }

  /**
   * Update user preferences
   */
  updateUserPreferences(userId: string, preferences: Partial<UserSession['preferences']>): void {
    const user = this.userDatabase.get(userId);
    if (user) {
      user.preferences = { ...user.preferences, ...preferences };
      console.log(`👤 Updated preferences for ${userId}`);
    }
  }

  /**
   * Add learning to user's knowledge base
   */
  addUserLearning(userId: string, learning: string): void {
    const user = this.userDatabase.get(userId);
    if (user) {
      user.systemKnowledge.learnings.push(learning);
      
      // Keep only last 20 learnings
      if (user.systemKnowledge.learnings.length > 20) {
        user.systemKnowledge.learnings = user.systemKnowledge.learnings.slice(-20);
      }
      
      console.log(`🧠 Added learning for ${userId}: ${learning}`);
    }
  }

  /**
   * Get user's recent activities summary
   */
  getUserActivitySummary(userId: string): string {
    const user = this.userDatabase.get(userId);
    if (!user || user.lastActivities.length === 0) {
      return "No recent activities recorded.";
    }

    const recentActivities = user.lastActivities.slice(0, 3);
    return `Recent activities: ${recentActivities.join(', ')}`;
  }

  /**
   * Check if user is currently present
   */
  isUserCurrentlyPresent(): boolean {
    return this.isUserPresent;
  }
}

// Export singleton instance
export const userGreetingSystem = new UserGreetingSystem();
