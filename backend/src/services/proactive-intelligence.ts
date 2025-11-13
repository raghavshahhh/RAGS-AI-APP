/**
 * 🧠 PROACTIVE INTELLIGENCE SERVICE
 * Background learning and proactive suggestions like ChatGPT
 */

import { EventEmitter } from 'events';
import { OllamaBrain } from './ollama-brain';
import { LocalMemory } from './local-memory';
import EnhancedConversationEngine from './enhanced-conversation-engine';

interface ProactiveSuggestion {
  type: 'reminder' | 'suggestion' | 'information' | 'task' | 'learning';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  message: string;
  action?: string;
  data?: any;
  timestamp: Date;
  userId: string;
}

interface LearningTopic {
  topic: string;
  relevance: number;
  lastUpdated: Date;
  sources: string[];
  keyPoints: string[];
}

interface UserPattern {
  userId: string;
  workingHours: { start: number; end: number };
  preferredBreakTimes: number[];
  commonTasks: string[];
  interests: string[];
  productivity_patterns: {
    mostProductiveHour: number;
    leastProductiveHour: number;
    averageSessionLength: number;
  };
}

export class ProactiveIntelligence extends EventEmitter {
  private ollamaBrain: OllamaBrain;
  private memory: LocalMemory;
  private conversationEngine: EnhancedConversationEngine;
  private isActive: boolean = false;
  private learningInterval: NodeJS.Timeout | null = null;
  private suggestionInterval: NodeJS.Timeout | null = null;
  
  private userPatterns: Map<string, UserPattern> = new Map();
  private pendingSuggestions: Map<string, ProactiveSuggestion[]> = new Map();
  private learningTopics: LearningTopic[] = [];

  // Time-based suggestion triggers
  private readonly TIME_TRIGGERS = {
    morning: { hour: 9, message: "Good morning! Ready to start the day?" },
    lunch: { hour: 13, message: "Lunch time! Want me to order something?" },
    evening: { hour: 18, message: "Wrapping up for the day?" },
    lateNight: { hour: 22, message: "Working late? Don't forget to take breaks!" }
  };

  // Learning sources for background intelligence
  private readonly LEARNING_SOURCES = [
    'https://github.com/trending',
    'https://news.ycombinator.com',
    'https://dev.to',
    'https://stackoverflow.com/questions/tagged/javascript',
    'https://reddit.com/r/programming'
  ];

  constructor() {
    super();
    this.ollamaBrain = new OllamaBrain();
    this.memory = new LocalMemory();
    this.conversationEngine = new EnhancedConversationEngine();
    this.setupEventHandlers();
  }

  /**
   * Start proactive intelligence system
   */
  async start(): Promise<void> {
    if (this.isActive) return;

    this.isActive = true;
    console.log('🧠 Proactive Intelligence starting...');

    // Start background learning (every 30 minutes)
    this.learningInterval = setInterval(() => {
      this.performBackgroundLearning();
    }, 30 * 60 * 1000);

    // Start proactive suggestions (every 5 minutes)
    this.suggestionInterval = setInterval(() => {
      this.generateProactiveSuggestions();
    }, 5 * 60 * 1000);

    // Start time-based triggers (every minute)
    setInterval(() => {
      this.checkTimeBasedTriggers();
    }, 60 * 1000);

    console.log('✅ Proactive Intelligence active');
    this.emit('started');
  }

  /**
   * Stop proactive intelligence system
   */
  stop(): void {
    this.isActive = false;

    if (this.learningInterval) {
      clearInterval(this.learningInterval);
      this.learningInterval = null;
    }

    if (this.suggestionInterval) {
      clearInterval(this.suggestionInterval);
      this.suggestionInterval = null;
    }

    console.log('🛑 Proactive Intelligence stopped');
    this.emit('stopped');
  }

  /**
   * Register user activity for pattern learning
   */
  async registerUserActivity(userId: string, activity: {
    type: 'chat' | 'task' | 'break' | 'work';
    content?: string;
    duration?: number;
    timestamp?: Date;
  }): Promise<void> {
    const timestamp = activity.timestamp || new Date();
    
    // Update user patterns
    await this.updateUserPatterns(userId, activity, timestamp);
    
    // Store activity in memory
    await this.memory.remember(`User activity: ${activity.type}`, {
      userId,
      activityType: activity.type,
      content: activity.content,
      duration: activity.duration,
      hour: timestamp.getHours(),
      dayOfWeek: timestamp.getDay()
    });

    // Generate contextual suggestions
    await this.generateContextualSuggestions(userId, activity);
  }

  /**
   * Get pending suggestions for user
   */
  getPendingSuggestions(userId: string): ProactiveSuggestion[] {
    return this.pendingSuggestions.get(userId) || [];
  }

  /**
   * Mark suggestion as handled
   */
  markSuggestionHandled(userId: string, suggestionIndex: number): void {
    const suggestions = this.pendingSuggestions.get(userId) || [];
    suggestions.splice(suggestionIndex, 1);
    this.pendingSuggestions.set(userId, suggestions);
  }

  /**
   * Perform background learning from various sources
   */
  private async performBackgroundLearning(): Promise<void> {
    if (!this.isActive) return;

    console.log('📚 Starting background learning session...');

    try {
      // Learn from trending topics
      await this.learnFromTrendingTopics();
      
      // Learn from user conversations
      await this.learnFromConversations();
      
      // Update knowledge base
      await this.updateKnowledgeBase();

      console.log('✅ Background learning completed');
      this.emit('learningCompleted', this.learningTopics);

    } catch (error) {
      console.error('Background learning error:', error);
    }
  }

  /**
   * Learn from trending topics (simulated)
   */
  private async learnFromTrendingTopics(): Promise<void> {
    // Simulate learning from trending topics
    const trendingTopics = [
      'React 19 new features',
      'AI coding assistants',
      'TypeScript 5.3 updates',
      'Node.js performance optimization',
      'WebAssembly in production'
    ];

    for (const topic of trendingTopics) {
      const existingTopic = this.learningTopics.find(t => t.topic === topic);
      
      if (existingTopic) {
        existingTopic.relevance += 0.1;
        existingTopic.lastUpdated = new Date();
      } else {
        this.learningTopics.push({
          topic,
          relevance: 0.8,
          lastUpdated: new Date(),
          sources: ['github-trending'],
          keyPoints: [`New developments in ${topic}`]
        });
      }
    }

    // Keep only top 50 topics
    this.learningTopics = this.learningTopics
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, 50);
  }

  /**
   * Learn from user conversations
   */
  private async learnFromConversations(): Promise<void> {
    try {
      // Get recent conversations from memory
      const recentMemories = await this.memory.recall('conversation', 20);
      
      for (const memory of recentMemories) {
        // Extract topics and interests
        const topics = await this.extractTopicsFromText(memory.content);
        
        for (const topic of topics) {
          const existingTopic = this.learningTopics.find(t => t.topic === topic);
          
          if (existingTopic) {
            existingTopic.relevance += 0.05;
            existingTopic.lastUpdated = new Date();
          } else {
            this.learningTopics.push({
              topic,
              relevance: 0.6,
              lastUpdated: new Date(),
              sources: ['user-conversation'],
              keyPoints: [`User showed interest in ${topic}`]
            });
          }
        }
      }
    } catch (error) {
      console.error('Conversation learning error:', error);
    }
  }

  /**
   * Extract topics from text using AI
   */
  private async extractTopicsFromText(text: string): Promise<string[]> {
    try {
      const prompt = `Extract 3-5 key topics or technologies mentioned in this text. Return only the topic names, one per line:\n\n${text}`;
      const response = await this.ollamaBrain.chat(prompt);
      
      return response.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .slice(0, 5);
    } catch (error) {
      console.error('Topic extraction error:', error);
      return [];
    }
  }

  /**
   * Update knowledge base with learned information
   */
  private async updateKnowledgeBase(): Promise<void> {
    try {
      // Store learning topics in memory
      for (const topic of this.learningTopics.slice(0, 10)) {
        await this.memory.remember(`Learned topic: ${topic.topic}`, {
          type: 'learning',
          topic: topic.topic,
          relevance: topic.relevance,
          sources: topic.sources,
          keyPoints: topic.keyPoints
        });
      }
    } catch (error) {
      console.error('Knowledge base update error:', error);
    }
  }

  /**
   * Generate proactive suggestions for all users
   */
  private async generateProactiveSuggestions(): Promise<void> {
    if (!this.isActive) return;

    console.log('💡 Generating proactive suggestions...');

    for (const [userId, pattern] of this.userPatterns) {
      try {
        await this.generateUserSpecificSuggestions(userId, pattern);
      } catch (error) {
        console.error(`Suggestion generation error for ${userId}:`, error);
      }
    }
  }

  /**
   * Generate suggestions specific to a user
   */
  private async generateUserSpecificSuggestions(userId: string, pattern: UserPattern): Promise<void> {
    const suggestions: ProactiveSuggestion[] = [];
    const currentHour = new Date().getHours();

    // Productivity suggestions
    if (currentHour === pattern.productivity_patterns.mostProductiveHour) {
      suggestions.push({
        type: 'suggestion',
        priority: 'medium',
        title: 'Peak Productivity Time',
        message: 'This is your most productive hour! Want to tackle that important task?',
        userId,
        timestamp: new Date()
      });
    }

    // Break reminders
    if (pattern.preferredBreakTimes.includes(currentHour)) {
      suggestions.push({
        type: 'reminder',
        priority: 'low',
        title: 'Break Time',
        message: 'Time for a break! You\'ve been working hard.',
        userId,
        timestamp: new Date()
      });
    }

    // Learning suggestions based on interests
    const relevantTopics = this.learningTopics
      .filter(topic => pattern.interests.some(interest => 
        topic.topic.toLowerCase().includes(interest.toLowerCase())
      ))
      .slice(0, 2);

    for (const topic of relevantTopics) {
      suggestions.push({
        type: 'learning',
        priority: 'low',
        title: 'New Learning',
        message: `I learned something interesting about ${topic.topic}. Want to know more?`,
        data: topic,
        userId,
        timestamp: new Date()
      });
    }

    // Store suggestions
    const existingSuggestions = this.pendingSuggestions.get(userId) || [];
    this.pendingSuggestions.set(userId, [...existingSuggestions, ...suggestions]);

    // Emit suggestions
    if (suggestions.length > 0) {
      this.emit('suggestionsGenerated', userId, suggestions);
    }
  }

  /**
   * Generate contextual suggestions based on current activity
   */
  private async generateContextualSuggestions(userId: string, activity: any): Promise<void> {
    const suggestions: ProactiveSuggestion[] = [];

    // Code-related suggestions
    if (activity.type === 'chat' && activity.content?.includes('code')) {
      const relevantTopics = this.learningTopics
        .filter(topic => topic.topic.includes('React') || topic.topic.includes('JavaScript'))
        .slice(0, 1);

      for (const topic of relevantTopics) {
        suggestions.push({
          type: 'suggestion',
          priority: 'medium',
          title: 'Coding Tip',
          message: `Btw, there's a new ${topic.topic} feature that might help with this!`,
          data: topic,
          userId,
          timestamp: new Date()
        });
      }
    }

    // Task completion suggestions
    if (activity.type === 'task' && activity.duration && activity.duration > 60) {
      suggestions.push({
        type: 'suggestion',
        priority: 'low',
        title: 'Great Work!',
        message: 'You\'ve been focused for a while. Want me to summarize what you accomplished?',
        userId,
        timestamp: new Date()
      });
    }

    // Store contextual suggestions
    if (suggestions.length > 0) {
      const existingSuggestions = this.pendingSuggestions.get(userId) || [];
      this.pendingSuggestions.set(userId, [...existingSuggestions, ...suggestions]);
      this.emit('contextualSuggestions', userId, suggestions);
    }
  }

  /**
   * Check for time-based triggers
   */
  private checkTimeBasedTriggers(): void {
    const currentHour = new Date().getHours();
    const currentMinute = new Date().getMinutes();

    // Only trigger on the hour
    if (currentMinute !== 0) return;

    for (const [triggerName, trigger] of Object.entries(this.TIME_TRIGGERS)) {
      if (currentHour === trigger.hour) {
        // Generate time-based suggestions for all users
        for (const userId of this.userPatterns.keys()) {
          const suggestion: ProactiveSuggestion = {
            type: 'reminder',
            priority: 'low',
            title: `${triggerName.charAt(0).toUpperCase() + triggerName.slice(1)} Check-in`,
            message: trigger.message,
            userId,
            timestamp: new Date()
          };

          const existingSuggestions = this.pendingSuggestions.get(userId) || [];
          this.pendingSuggestions.set(userId, [...existingSuggestions, suggestion]);
          this.emit('timeBasedSuggestion', userId, suggestion);
        }
      }
    }
  }

  /**
   * Update user patterns based on activity
   */
  private async updateUserPatterns(userId: string, activity: any, timestamp: Date): Promise<void> {
    let pattern = this.userPatterns.get(userId);
    
    if (!pattern) {
      pattern = {
        userId,
        workingHours: { start: 9, end: 17 },
        preferredBreakTimes: [11, 15],
        commonTasks: [],
        interests: [],
        productivity_patterns: {
          mostProductiveHour: 10,
          leastProductiveHour: 14,
          averageSessionLength: 45
        }
      };
    }

    const hour = timestamp.getHours();

    // Update working hours
    if (activity.type === 'work' || activity.type === 'chat') {
      if (hour < pattern.workingHours.start) {
        pattern.workingHours.start = hour;
      }
      if (hour > pattern.workingHours.end) {
        pattern.workingHours.end = hour;
      }
    }

    // Update common tasks
    if (activity.type === 'task' && activity.content) {
      if (!pattern.commonTasks.includes(activity.content)) {
        pattern.commonTasks.push(activity.content);
        // Keep only last 10 tasks
        pattern.commonTasks = pattern.commonTasks.slice(-10);
      }
    }

    // Update interests based on chat content
    if (activity.type === 'chat' && activity.content) {
      const topics = await this.extractTopicsFromText(activity.content);
      for (const topic of topics) {
        if (!pattern.interests.includes(topic)) {
          pattern.interests.push(topic);
          // Keep only last 20 interests
          pattern.interests = pattern.interests.slice(-20);
        }
      }
    }

    this.userPatterns.set(userId, pattern);
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers(): void {
    this.on('suggestionsGenerated', (userId: string, suggestions: ProactiveSuggestion[]) => {
      console.log(`💡 Generated ${suggestions.length} suggestions for ${userId}`);
    });

    this.on('learningCompleted', (topics: LearningTopic[]) => {
      console.log(`📚 Learned about ${topics.length} topics`);
    });
  }

  /**
   * Get learning statistics
   */
  getLearningStats(): {
    totalTopics: number;
    recentTopics: LearningTopic[];
    topSources: string[];
  } {
    const recentTopics = this.learningTopics
      .filter(topic => {
        const daysSinceUpdate = (Date.now() - topic.lastUpdated.getTime()) / (1000 * 60 * 60 * 24);
        return daysSinceUpdate <= 7;
      })
      .slice(0, 10);

    const sourceCounts = this.learningTopics.reduce((acc, topic) => {
      topic.sources.forEach(source => {
        acc[source] = (acc[source] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);

    const topSources = Object.entries(sourceCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([source]) => source);

    return {
      totalTopics: this.learningTopics.length,
      recentTopics,
      topSources
    };
  }

  /**
   * Get user pattern for debugging
   */
  getUserPattern(userId: string): UserPattern | undefined {
    return this.userPatterns.get(userId);
  }
}

export default ProactiveIntelligence;
