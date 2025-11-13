/**
 * 🧠 META-LEARNING SYSTEM
 * AI that learns from its own mistakes and improves itself
 */

import { EventEmitter } from 'events';
import { OllamaBrain } from './ollama-brain';
import * as fs from 'fs/promises';
import * as path from 'path';

interface ResponseFeedback {
  responseId: string;
  userMessage: string;
  aiResponse: string;
  userRating: number; // 1-10
  userCorrection?: string;
  timestamp: Date;
  context: any;
}

interface LearningPattern {
  pattern: string;
  successRate: number;
  examples: Array<{
    input: string;
    output: string;
    rating: number;
  }>;
  lastUpdated: Date;
}

interface PromptTemplate {
  id: string;
  template: string;
  useCase: string;
  performance: number; // 0-100
  usageCount: number;
  successCount: number;
}

export class MetaLearningSystem extends EventEmitter {
  private brain: OllamaBrain;
  private dataDir: string;
  private feedbackLog: ResponseFeedback[] = [];
  private learningPatterns: Map<string, LearningPattern> = new Map();
  private promptTemplates: Map<string, PromptTemplate> = new Map();
  private improvementHistory: Array<{
    timestamp: Date;
    improvement: string;
    impact: number;
  }> = [];

  constructor(brain: OllamaBrain, userId: string = 'default') {
    super();
    this.brain = brain;
    this.dataDir = path.join(process.env.HOME || '', '.rags', 'meta-learning', userId);
  }

  /**
   * Initialize meta-learning system
   */
  async initialize(): Promise<void> {
    console.log('🧠 Initializing Meta-Learning System...');

    // Create data directory
    await fs.mkdir(this.dataDir, { recursive: true });

    // Load existing learning data
    await this.loadLearningData();

    // Initialize default prompt templates
    this.initializePromptTemplates();

    console.log('✅ Meta-Learning System initialized');
  }

  /**
   * Self-Critique: Rate own response
   */
  async selfCritique(userMessage: string, aiResponse: string, context?: any): Promise<number> {
    const critiquePrompt = `
You are a self-aware AI critiquing your own response.

User asked: "${userMessage}"
You responded: "${aiResponse}"

Rate your response from 1-10 based on:
- Relevance (Did you answer the question?)
- Clarity (Was it easy to understand?)
- Completeness (Did you cover everything?)
- Tone (Was it appropriate?)
- Accuracy (Was the information correct?)

Respond with ONLY a number (1-10) and a brief reason.
Format: "RATING: X/10 - Reason"
`;

    try {
      const critique = await this.brain.chat(critiquePrompt);
      const match = critique.match(/RATING:\s*(\d+)/i);
      const rating = match ? parseInt(match[1]) : 7;

      // Store self-critique
      this.emit('self_critique', {
        userMessage,
        aiResponse,
        rating,
        critique,
        timestamp: new Date()
      });

      return rating;
    } catch (error) {
      console.error('Self-critique error:', error);
      return 7; // Default neutral rating
    }
  }

  /**
   * Record user feedback
   */
  async recordFeedback(
    responseId: string,
    userMessage: string,
    aiResponse: string,
    userRating: number,
    userCorrection?: string,
    context?: any
  ): Promise<void> {
    const feedback: ResponseFeedback = {
      responseId,
      userMessage,
      aiResponse,
      userRating,
      userCorrection,
      timestamp: new Date(),
      context
    };

    this.feedbackLog.push(feedback);

    // Save to disk
    await this.saveFeedback(feedback);

    // Analyze patterns
    await this.analyzeAndLearn(feedback);

    // Emit event
    this.emit('feedback_recorded', feedback);

    console.log(`📊 Feedback recorded: ${userRating}/10`);
  }

  /**
   * Analyze feedback and learn patterns
   */
  private async analyzeAndLearn(feedback: ResponseFeedback): Promise<void> {
    // Extract patterns from successful responses
    if (feedback.userRating >= 8) {
      await this.extractSuccessPattern(feedback);
    }

    // Learn from mistakes
    if (feedback.userRating <= 5 && feedback.userCorrection) {
      await this.learnFromMistake(feedback);
    }

    // Update prompt performance
    await this.updatePromptPerformance(feedback);
  }

  /**
   * Extract success patterns
   */
  private async extractSuccessPattern(feedback: ResponseFeedback): Promise<void> {
    const patternKey = this.categorizeMessage(feedback.userMessage);

    let pattern = this.learningPatterns.get(patternKey);
    if (!pattern) {
      pattern = {
        pattern: patternKey,
        successRate: 0,
        examples: [],
        lastUpdated: new Date()
      };
    }

    pattern.examples.push({
      input: feedback.userMessage,
      output: feedback.aiResponse,
      rating: feedback.userRating
    });

    // Keep only top 10 examples
    pattern.examples.sort((a, b) => b.rating - a.rating);
    pattern.examples = pattern.examples.slice(0, 10);

    // Calculate success rate
    const totalRating = pattern.examples.reduce((sum, ex) => sum + ex.rating, 0);
    pattern.successRate = totalRating / pattern.examples.length / 10;
    pattern.lastUpdated = new Date();

    this.learningPatterns.set(patternKey, pattern);

    console.log(`✅ Success pattern learned: ${patternKey} (${(pattern.successRate * 100).toFixed(1)}%)`);
  }

  /**
   * Learn from mistakes
   */
  private async learnFromMistake(feedback: ResponseFeedback): Promise<void> {
    const improvementPrompt = `
I made a mistake:

User: "${feedback.userMessage}"
My response: "${feedback.aiResponse}"
User said: "${feedback.userCorrection}"
Rating: ${feedback.userRating}/10

What should I learn from this? Provide a concise lesson.
`;

    try {
      const lesson = await this.brain.chat(improvementPrompt);

      this.improvementHistory.push({
        timestamp: new Date(),
        improvement: lesson,
        impact: (10 - feedback.userRating) / 10 // Higher impact for worse ratings
      });

      // Keep last 50 improvements
      if (this.improvementHistory.length > 50) {
        this.improvementHistory = this.improvementHistory.slice(-50);
      }

      console.log(`📚 Lesson learned: ${lesson.substring(0, 100)}...`);

      this.emit('lesson_learned', {
        lesson,
        originalMessage: feedback.userMessage,
        correction: feedback.userCorrection
      });
    } catch (error) {
      console.error('Error learning from mistake:', error);
    }
  }

  /**
   * Optimize prompt for specific use case
   */
  async optimizePrompt(useCase: string, basePrompt: string): Promise<string> {
    // Get relevant success patterns
    const relevantPatterns = Array.from(this.learningPatterns.values())
      .filter(p => p.successRate > 0.7)
      .sort((a, b) => b.successRate - a.successRate)
      .slice(0, 5);

    if (relevantPatterns.length === 0) {
      return basePrompt;
    }

    // Get improvement lessons
    const recentLessons = this.improvementHistory
      .slice(-10)
      .map(h => h.improvement)
      .join('\n');

    const optimizationPrompt = `
Improve this AI system prompt for better performance:

Current prompt:
${basePrompt}

Successful patterns I've learned:
${relevantPatterns.map(p => `- ${p.pattern}: ${(p.successRate * 100).toFixed(0)}% success`).join('\n')}

Recent lessons:
${recentLessons}

Create an optimized version of the prompt that incorporates these learnings.
Keep it concise and effective.
`;

    try {
      const optimizedPrompt = await this.brain.chat(optimizationPrompt);
      
      console.log('🔧 Prompt optimized for:', useCase);
      
      return optimizedPrompt.trim();
    } catch (error) {
      console.error('Prompt optimization error:', error);
      return basePrompt;
    }
  }

  /**
   * A/B test two prompts
   */
  async abTestPrompts(
    promptA: string,
    promptB: string,
    testMessage: string
  ): Promise<{ winner: 'A' | 'B'; scoreA: number; scoreB: number }> {
    console.log('🧪 Running A/B test...');

    // Save current system prompt
    const originalPrompt = this.brain['config'].systemPrompt;

    try {
      // Test prompt A
      this.brain['config'].systemPrompt = promptA;
      const responseA = await this.brain.chat(testMessage);
      const scoreA = await this.selfCritique(testMessage, responseA);

      // Test prompt B
      this.brain['config'].systemPrompt = promptB;
      const responseB = await this.brain.chat(testMessage);
      const scoreB = await this.selfCritique(testMessage, responseB);

      const winner = scoreA > scoreB ? 'A' : 'B';

      console.log(`🏆 A/B Test winner: Prompt ${winner} (A: ${scoreA}/10, B: ${scoreB}/10)`);

      this.emit('ab_test_complete', {
        winner,
        scoreA,
        scoreB,
        promptA,
        promptB
      });

      return { winner, scoreA, scoreB };
    } finally {
      // Restore original prompt
      this.brain['config'].systemPrompt = originalPrompt;
    }
  }

  /**
   * Get performance metrics
   */
  getMetrics(): {
    totalFeedback: number;
    averageRating: number;
    patternsLearned: number;
    improvementsCount: number;
    topPatterns: Array<{ pattern: string; successRate: number }>;
  } {
    const avgRating = this.feedbackLog.length > 0
      ? this.feedbackLog.reduce((sum, f) => sum + f.userRating, 0) / this.feedbackLog.length
      : 0;

    const topPatterns = Array.from(this.learningPatterns.values())
      .sort((a, b) => b.successRate - a.successRate)
      .slice(0, 5)
      .map(p => ({
        pattern: p.pattern,
        successRate: p.successRate
      }));

    return {
      totalFeedback: this.feedbackLog.length,
      averageRating: avgRating,
      patternsLearned: this.learningPatterns.size,
      improvementsCount: this.improvementHistory.length,
      topPatterns
    };
  }

  /**
   * Generate improvement report
   */
  async generateImprovementReport(): Promise<string> {
    const metrics = this.getMetrics();

    const report = `
📊 META-LEARNING REPORT

Performance Metrics:
- Total Feedback: ${metrics.totalFeedback}
- Average Rating: ${metrics.averageRating.toFixed(2)}/10
- Patterns Learned: ${metrics.patternsLearned}
- Improvements Made: ${metrics.improvementsCount}

Top Success Patterns:
${metrics.topPatterns.map((p, i) => 
  `${i + 1}. ${p.pattern}: ${(p.successRate * 100).toFixed(0)}% success`
).join('\n')}

Recent Improvements:
${this.improvementHistory.slice(-5).map((h, i) => 
  `${i + 1}. ${h.improvement.substring(0, 100)}...`
).join('\n')}

Status: ${metrics.averageRating >= 8 ? '🟢 Excellent' : metrics.averageRating >= 6 ? '🟡 Good' : '🔴 Needs Improvement'}
`;

    return report.trim();
  }

  // Helper methods

  private categorizeMessage(message: string): string {
    const lower = message.toLowerCase();
    
    if (lower.includes('search') || lower.includes('find')) return 'search';
    if (lower.includes('remember') || lower.includes('yaad')) return 'memory';
    if (lower.includes('remind')) return 'reminder';
    if (lower.includes('open') || lower.includes('launch')) return 'automation';
    if (lower.includes('what') || lower.includes('kya')) return 'question';
    if (lower.includes('how') || lower.includes('kaise')) return 'howto';
    if (lower.match(/hello|hi|hey|namaste/)) return 'greeting';
    
    return 'general';
  }

  private initializePromptTemplates(): void {
    const defaultTemplates: PromptTemplate[] = [
      {
        id: 'default',
        template: 'You are RAGS, a helpful AI assistant.',
        useCase: 'general',
        performance: 70,
        usageCount: 0,
        successCount: 0
      },
      {
        id: 'technical',
        template: 'You are RAGS, a technical expert AI assistant specialized in programming and technology.',
        useCase: 'coding',
        performance: 75,
        usageCount: 0,
        successCount: 0
      },
      {
        id: 'friendly',
        template: 'You are RAGS, a friendly and casual AI assistant who speaks in Hinglish.',
        useCase: 'casual',
        performance: 80,
        usageCount: 0,
        successCount: 0
      }
    ];

    defaultTemplates.forEach(t => this.promptTemplates.set(t.id, t));
  }

  private async updatePromptPerformance(feedback: ResponseFeedback): Promise<void> {
    // Update performance metrics for active prompts
    this.promptTemplates.forEach((template, id) => {
      if (template.usageCount > 0) {
        template.performance = (template.successCount / template.usageCount) * 100;
      }
    });
  }

  private async loadLearningData(): Promise<void> {
    try {
      const dataFile = path.join(this.dataDir, 'learning_data.json');
      const data = await fs.readFile(dataFile, 'utf-8');
      const parsed = JSON.parse(data);

      if (parsed.patterns) {
        this.learningPatterns = new Map(Object.entries(parsed.patterns));
      }
      if (parsed.improvements) {
        this.improvementHistory = parsed.improvements;
      }

      console.log(`📚 Loaded ${this.learningPatterns.size} patterns, ${this.improvementHistory.length} improvements`);
    } catch (error) {
      // No existing data, start fresh
      console.log('📝 Starting with fresh learning data');
    }
  }

  private async saveFeedback(feedback: ResponseFeedback): Promise<void> {
    try {
      const feedbackFile = path.join(this.dataDir, 'feedback.jsonl');
      await fs.appendFile(feedbackFile, JSON.stringify(feedback) + '\n');

      // Also save aggregated learning data
      const dataFile = path.join(this.dataDir, 'learning_data.json');
      await fs.writeFile(dataFile, JSON.stringify({
        patterns: Object.fromEntries(this.learningPatterns),
        improvements: this.improvementHistory
      }, null, 2));
    } catch (error) {
      console.error('Error saving feedback:', error);
    }
  }
}
