/**
 * 🎯 CONTEXT AWARENESS ENGINE
 * 360° awareness, predictive intelligence, emotional understanding
 */

import { EventEmitter } from 'events';
import { OllamaBrain } from './ollama-brain';
import * as fs from 'fs/promises';
import * as path from 'path';

interface UserContext {
  // Physical context
  position?: { x: number; y: number };
  device?: string;
  platform?: string;
  screen_size?: { width: number; height: number };
  
  // Temporal context
  time_of_day?: 'morning' | 'afternoon' | 'evening' | 'night';
  day_of_week?: string;
  timezone?: string;
  
  // Behavioral context
  activity?: string;
  focus_level?: number; // 0-100
  interaction_frequency?: number;
  
  // Emotional context
  mood?: string;
  stress_level?: number; // 0-100
  energy_level?: number; // 0-100
  
  // Cognitive context
  attention_span?: number;
  comprehension_level?: number;
  preferred_detail_level?: 'brief' | 'detailed' | 'technical';
}

interface EnvironmentContext {
  // System context
  cpu_usage?: number;
  memory_usage?: number;
  battery_level?: number;
  network_status?: 'online' | 'offline' | 'slow';
  
  // Application context
  active_window?: string;
  open_apps?: string[];
  recent_files?: string[];
  
  // External context
  weather?: string;
  location?: string;
  noise_level?: number;
}

interface PredictiveInsight {
  id: string;
  prediction: string;
  confidence: number; // 0-100
  based_on: string[];
  timestamp: Date;
  category: 'action' | 'need' | 'question' | 'issue';
}

interface EmotionalState {
  primary_emotion: string;
  intensity: number; // 0-100
  triggers: string[];
  suggested_response_tone: string;
  detected_at: Date;
}

interface ContextSnapshot {
  id: string;
  user_context: UserContext;
  environment_context: EnvironmentContext;
  emotional_state?: EmotionalState;
  predictions: PredictiveInsight[];
  timestamp: Date;
}

export class ContextAwarenessEngine extends EventEmitter {
  private brain: OllamaBrain;
  private dataDir: string;
  private currentContext: UserContext = {};
  private environmentContext: EnvironmentContext = {};
  private contextHistory: ContextSnapshot[] = [];
  private patterns: Map<string, any> = new Map();
  private predictions: PredictiveInsight[] = [];

  constructor(brain: OllamaBrain, userId: string = 'default') {
    super();
    this.brain = brain;
    this.dataDir = path.join(process.env.HOME || '', '.rags', 'context-awareness', userId);
  }

  /**
   * Initialize Context Awareness Engine
   */
  async initialize(): Promise<void> {
    console.log('🎯 Initializing Context Awareness Engine...');

    await fs.mkdir(this.dataDir, { recursive: true });
    await this.loadData();

    // Start context monitoring
    this.startContextMonitoring();

    console.log('✅ Context Awareness Engine initialized');
  }

  /**
   * Update user context
   */
  async updateUserContext(context: Partial<UserContext>): Promise<void> {
    this.currentContext = { ...this.currentContext, ...context };
    
    // Detect patterns
    await this.detectPatterns();
    
    // Generate predictions
    await this.generatePredictions();
    
    this.emit('context_updated', this.currentContext);
  }

  /**
   * Update environment context
   */
  async updateEnvironmentContext(context: Partial<EnvironmentContext>): Promise<void> {
    this.environmentContext = { ...this.environmentContext, ...context };
    this.emit('environment_updated', this.environmentContext);
  }

  /**
   * Get complete 360° context
   */
  get360Context(): {
    user: UserContext;
    environment: EnvironmentContext;
    emotional?: EmotionalState;
    predictions: PredictiveInsight[];
  } {
    return {
      user: this.currentContext,
      environment: this.environmentContext,
      emotional: this.detectEmotionalState(),
      predictions: this.predictions
    };
  }

  /**
   * Detect emotional state from context
   */
  detectEmotionalState(): EmotionalState | undefined {
    const context = this.currentContext;
    
    // Simple emotion detection based on available signals
    let emotion = 'neutral';
    let intensity = 50;
    const triggers: string[] = [];

    if (context.stress_level && context.stress_level > 70) {
      emotion = 'stressed';
      intensity = context.stress_level;
      triggers.push('high stress level');
    } else if (context.energy_level && context.energy_level < 30) {
      emotion = 'tired';
      intensity = 100 - context.energy_level;
      triggers.push('low energy');
    } else if (context.focus_level && context.focus_level > 80) {
      emotion = 'focused';
      intensity = context.focus_level;
      triggers.push('high focus');
    }

    if (triggers.length === 0) return undefined;

    return {
      primary_emotion: emotion,
      intensity,
      triggers,
      suggested_response_tone: this.getSuggestedTone(emotion),
      detected_at: new Date()
    };
  }

  /**
   * Generate predictive insights
   */
  async generatePredictions(): Promise<PredictiveInsight[]> {
    const context = this.get360Context();
    
    const predictionPrompt = `
Based on this user context, predict what the user might need or do next:

User Context:
- Time: ${context.user.time_of_day || 'unknown'}
- Activity: ${context.user.activity || 'unknown'}
- Mood: ${context.emotional?.primary_emotion || 'neutral'}
- Focus: ${context.user.focus_level || 50}/100

Environment:
- Battery: ${context.environment.battery_level || 100}%
- Network: ${context.environment.network_status || 'online'}
- Active: ${context.environment.active_window || 'unknown'}

Predict (as JSON array):
[
  {
    "prediction": "User will likely...",
    "confidence": 75,
    "category": "action",
    "based_on": ["pattern 1", "pattern 2"]
  }
]

Limit to top 3 predictions:
`;

    try {
      const response = await this.brain.chat(predictionPrompt);
      const predictions = JSON.parse(response);
      
      this.predictions = predictions.map((p: any) => ({
        id: `pred_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        prediction: p.prediction,
        confidence: p.confidence,
        based_on: p.based_on || [],
        timestamp: new Date(),
        category: p.category
      }));

      return this.predictions;
    } catch (error) {
      console.error('Error generating predictions:', error);
      return [];
    }
  }

  /**
   * Detect behavioral patterns
   */
  private async detectPatterns(): Promise<void> {
    // Analyze recent context history for patterns
    const recentHistory = this.contextHistory.slice(-50);
    
    if (recentHistory.length < 10) return;

    // Time-based patterns
    const timePatterns = this.analyzeTimePatterns(recentHistory);
    if (timePatterns) {
      this.patterns.set('time_patterns', timePatterns);
    }

    // Activity patterns
    const activityPatterns = this.analyzeActivityPatterns(recentHistory);
    if (activityPatterns) {
      this.patterns.set('activity_patterns', activityPatterns);
    }

    this.emit('patterns_detected', {
      time: timePatterns,
      activity: activityPatterns
    });
  }

  /**
   * Analyze time-based patterns
   */
  private analyzeTimePatterns(history: ContextSnapshot[]): any {
    const timeActivity: Record<string, string[]> = {};

    for (const snapshot of history) {
      const time = snapshot.user_context.time_of_day;
      const activity = snapshot.user_context.activity;
      
      if (time && activity) {
        if (!timeActivity[time]) {
          timeActivity[time] = [];
        }
        timeActivity[time].push(activity);
      }
    }

    return timeActivity;
  }

  /**
   * Analyze activity patterns
   */
  private analyzeActivityPatterns(history: ContextSnapshot[]): any {
    const activityFrequency: Record<string, number> = {};

    for (const snapshot of history) {
      const activity = snapshot.user_context.activity;
      if (activity) {
        activityFrequency[activity] = (activityFrequency[activity] || 0) + 1;
      }
    }

    return activityFrequency;
  }

  /**
   * Get context-aware response tone
   */
  getResponseTone(): string {
    const emotional = this.detectEmotionalState();
    const context = this.currentContext;

    if (emotional) {
      return this.getSuggestedTone(emotional.primary_emotion);
    }

    if (context.time_of_day === 'morning') {
      return 'energetic and motivating';
    } else if (context.time_of_day === 'night') {
      return 'calm and concise';
    } else if (context.focus_level && context.focus_level > 70) {
      return 'direct and efficient';
    }

    return 'friendly and balanced';
  }

  /**
   * Predict user needs
   */
  async predictUserNeeds(): Promise<string[]> {
    const predictions = await this.generatePredictions();
    return predictions
      .filter(p => p.category === 'need' && p.confidence > 60)
      .map(p => p.prediction);
  }

  /**
   * Proactive suggestions based on context
   */
  async getProactiveSuggestions(): Promise<string[]> {
    const context = this.get360Context();
    const suggestions: string[] = [];

    // Battery low
    if (context.environment.battery_level && context.environment.battery_level < 20) {
      suggestions.push('Your battery is low. Would you like me to enable power saving mode?');
    }

    // Night time and active
    if (context.user.time_of_day === 'night' && context.user.activity) {
      suggestions.push('It\'s late. Consider wrapping up for better sleep.');
    }

    // High stress detected
    if (context.emotional?.primary_emotion === 'stressed' && context.emotional.intensity > 70) {
      suggestions.push('You seem stressed. Would you like a quick breathing exercise or break reminder?');
    }

    // Low focus during work hours
    if (context.user.focus_level && context.user.focus_level < 40 && 
        context.user.time_of_day === 'afternoon') {
      suggestions.push('Focus seems low. Try the Pomodoro technique or take a short walk.');
    }

    return suggestions;
  }

  /**
   * Multi-modal understanding (placeholder for vision + audio + text)
   */
  async processMultiModal(data: {
    text?: string;
    image?: Buffer;
    audio?: Buffer;
  }): Promise<any> {
    console.log('🔄 Processing multi-modal input...');

    // Placeholder for future vision/audio integration
    const analysis: any = {};

    if (data.text) {
      analysis.text_analysis = {
        content: data.text,
        sentiment: await this.analyzeSentiment(data.text),
        intent: await this.detectIntent(data.text)
      };
    }

    if (data.image) {
      analysis.image_analysis = {
        note: 'Image processing would be integrated with vision model'
      };
    }

    if (data.audio) {
      analysis.audio_analysis = {
        note: 'Audio processing would be integrated with speech model'
      };
    }

    return analysis;
  }

  /**
   * Analyze sentiment from text
   */
  private async analyzeSentiment(text: string): Promise<string> {
    const prompt = `
Analyze the sentiment of this text:

"${text}"

Sentiment (one word): [positive/negative/neutral]
`;

    const response = await this.brain.chat(prompt);
    return response.toLowerCase().trim();
  }

  /**
   * Detect intent from text
   */
  private async detectIntent(text: string): Promise<string> {
    const prompt = `
What is the user's intent in this message?

"${text}"

Intent (one phrase):
`;

    return await this.brain.chat(prompt);
  }

  /**
   * Get statistics
   */
  getStats(): any {
    return {
      context_snapshots: this.contextHistory.length,
      patterns_detected: this.patterns.size,
      active_predictions: this.predictions.length,
      current_emotional_state: this.detectEmotionalState()?.primary_emotion || 'neutral',
      context_completeness: this.calculateContextCompleteness()
    };
  }

  /**
   * Create context snapshot
   */
  private createSnapshot(): ContextSnapshot {
    return {
      id: `snapshot_${Date.now()}`,
      user_context: { ...this.currentContext },
      environment_context: { ...this.environmentContext },
      emotional_state: this.detectEmotionalState(),
      predictions: [...this.predictions],
      timestamp: new Date()
    };
  }

  /**
   * Start context monitoring
   */
  private startContextMonitoring(): void {
    // Take snapshot every minute
    setInterval(() => {
      const snapshot = this.createSnapshot();
      this.contextHistory.push(snapshot);
      
      // Keep last 1000 snapshots
      if (this.contextHistory.length > 1000) {
        this.contextHistory = this.contextHistory.slice(-1000);
      }

      this.saveData();
    }, 60000); // Every minute
  }

  /**
   * Calculate context completeness
   */
  private calculateContextCompleteness(): number {
    const userFields = Object.keys(this.currentContext).length;
    const envFields = Object.keys(this.environmentContext).length;
    const totalPossible = 20; // Approximate total possible fields

    return Math.round(((userFields + envFields) / totalPossible) * 100);
  }

  /**
   * Get suggested tone for emotion
   */
  private getSuggestedTone(emotion: string): string {
    const tones: Record<string, string> = {
      stressed: 'calm and supportive',
      tired: 'gentle and concise',
      focused: 'direct and efficient',
      happy: 'energetic and engaging',
      sad: 'empathetic and supportive',
      neutral: 'friendly and balanced'
    };

    return tones[emotion] || 'friendly and balanced';
  }

  /**
   * Load data
   */
  private async loadData(): Promise<void> {
    try {
      const dataFile = path.join(this.dataDir, 'context_data.json');
      const data = await fs.readFile(dataFile, 'utf-8');
      const parsed = JSON.parse(data);

      if (parsed.contextHistory) {
        this.contextHistory = parsed.contextHistory;
      }
      if (parsed.patterns) {
        this.patterns = new Map(Object.entries(parsed.patterns));
      }

      console.log(`📚 Loaded ${this.contextHistory.length} context snapshots`);
    } catch (error) {
      console.log('📚 No existing context data');
    }
  }

  /**
   * Save data
   */
  private async saveData(): Promise<void> {
    try {
      const dataFile = path.join(this.dataDir, 'context_data.json');
      await fs.writeFile(dataFile, JSON.stringify({
        contextHistory: this.contextHistory.slice(-1000), // Keep last 1000
        patterns: Object.fromEntries(this.patterns)
      }, null, 2));
    } catch (error) {
      console.error('Error saving context data:', error);
    }
  }
}
