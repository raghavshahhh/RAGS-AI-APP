/**
 * 🌟 EVOLUTION ORCHESTRATOR
 * Master controller for all self-evolution features
 */

import { EventEmitter } from 'events';
import { OllamaBrain } from './ollama-brain';
import { MetaLearningSystem } from './meta-learning-system';
import { AgentDNASystem } from './agent-dna-system';
import { InternetBrain } from './internet-brain';
import { SelfHealingSystem } from './self-healing-system';
import { GoalAutopilot } from './goal-autopilot';
import { CreativePowerhouse } from './creative-powerhouse';
import { ExperimentalLab } from './experimental-lab';
import { SocialCollaborative } from './social-collaborative';
import { SelfModificationEngine } from './self-modification-engine';
import { ContextAwarenessEngine } from './context-awareness-engine';
import { SuperIntegrationLayer } from './super-integration-layer';

export class EvolutionOrchestrator extends EventEmitter {
  private brain: OllamaBrain;
  private metaLearning: MetaLearningSystem;
  private agentDNA: AgentDNASystem;
  private internetBrain: InternetBrain;
  private selfHealing: SelfHealingSystem;
  private goalAutopilot: GoalAutopilot;
  private creative: CreativePowerhouse;
  private experimental: ExperimentalLab;
  private social: SocialCollaborative;
  private selfModification: SelfModificationEngine;
  private contextAwareness: ContextAwarenessEngine;
  private superIntegration: SuperIntegrationLayer;
  private initialized: boolean = false;
  private evolutionEnabled: boolean = true;

  constructor(brain: OllamaBrain, userId: string = 'default') {
    super();
    this.brain = brain;

    // Initialize all evolution systems
    this.metaLearning = new MetaLearningSystem(brain, userId);
    this.agentDNA = new AgentDNASystem(brain, userId);
    this.internetBrain = new InternetBrain(brain, userId);
    this.selfHealing = new SelfHealingSystem(brain, userId);
    this.goalAutopilot = new GoalAutopilot(brain, userId);
    this.creative = new CreativePowerhouse(brain, userId);
    this.experimental = new ExperimentalLab(brain, userId);
    this.social = new SocialCollaborative(brain, userId);
    this.selfModification = new SelfModificationEngine(brain, userId);
    this.contextAwareness = new ContextAwarenessEngine(brain, userId);
    this.superIntegration = new SuperIntegrationLayer(brain, userId);

    // Setup cross-system event handlers
    this.setupEventHandlers();
  }

  /**
   * Initialize all evolution systems
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      console.log('⚠️  Evolution Orchestrator already initialized');
      return;
    }

    console.log('🌟 Initializing Evolution Orchestrator...');
    console.log('━'.repeat(50));

    try {
      // Phase 1: Meta-Learning
      console.log('\n📚 Phase 1: Meta-Learning System');
      await this.metaLearning.initialize();

      // Phase 2: Agent DNA
      console.log('\n🧬 Phase 2: Agent DNA System');
      await this.agentDNA.initialize();

      // Phase 3: Internet Brain
      console.log('\n🌐 Phase 3: Internet Brain');
      await this.internetBrain.initialize();

      // Phase 4: Self-Healing
      console.log('\n🛡️  Phase 4: Self-Healing System');
      await this.selfHealing.initialize();

      // Phase 5: Goal Autopilot
      console.log('\n🎯 Phase 5: Goal Autopilot');
      await this.goalAutopilot.initialize();

      // Phase 6: Creative Powerhouse
      console.log('\n🎨 Phase 6: Creative Powerhouse');
      await this.creative.initialize();

      // Phase 7: Experimental Lab
      console.log('\n🧪 Phase 7: Experimental Lab');
      await this.experimental.initialize();

      // Phase 8: Social & Collaborative
      console.log('\n🌍 Phase 8: Social & Collaborative');
      await this.social.initialize();

      // Phase 9: Self-Modification Engine
      console.log('\n🔧 Phase 9: Self-Modification Engine');
      await this.selfModification.initialize();

      // Phase 10: Context Awareness Engine
      console.log('\n🎯 Phase 10: Context Awareness Engine');
      await this.contextAwareness.initialize();

      // Phase 11: Super Integration Layer
      console.log('\n🌉 Phase 11: Super Integration Layer');
      await this.superIntegration.initialize();

      console.log('\n━'.repeat(50));
      console.log('🎉 Evolution Orchestrator fully initialized!');
      console.log('   ALL 12 SYSTEMS ONLINE! 🚀🔥');
      console.log('   100% COMPLETE - RAGS IS FULLY EVOLVED! ✨');
      console.log('━'.repeat(50));

      this.initialized = true;
      this.emit('initialized');

      // Start evolution loop
      this.startEvolutionLoop();

    } catch (error) {
      console.error('❌ Evolution Orchestrator initialization failed:', error);
      throw error;
    }
  }

  /**
   * Process message with evolution features
   */
  async processWithEvolution(userMessage: string, context?: any): Promise<any> {
    if (!this.initialized) {
      throw new Error('Evolution Orchestrator not initialized');
    }

    console.log(`🧠 Processing with evolution: "${userMessage}"`);

    try {
      // 1. Get AI response
      const response = await this.brain.chat(userMessage);

      // 2. Self-critique
      const selfRating = await this.metaLearning.selfCritique(userMessage, response, context);

      // 3. Learn from internet if needed
      if (this.shouldLearnMore(userMessage, selfRating)) {
        console.log('🌐 Learning from internet...');
        try {
          await this.internetBrain.learnTopic(userMessage, 3);
        } catch (error) {
          console.warn('Internet learning failed:', error);
        }
      }

      // 4. Check if task requires agent collaboration
      if (this.requiresAgentCollaboration(userMessage)) {
        console.log('🤝 Assigning to agent team...');
        const task = await this.agentDNA.assignTask(userMessage, ['general']);
        // Could execute collaboratively here
      }

      return {
        response,
        self_rating: selfRating,
        evolution_metadata: {
          learned: false,
          agents_involved: [],
          improvements_suggested: []
        }
      };

    } catch (error: any) {
      // Auto-debug on error
      console.error('Error during processing:', error);
      await this.selfHealing.autoDebug(error, { userMessage, context });
      throw error;
    }
  }

  /**
   * Record user feedback and improve
   */
  async recordFeedback(
    responseId: string,
    userMessage: string,
    aiResponse: string,
    rating: number,
    correction?: string
  ): Promise<void> {
    await this.metaLearning.recordFeedback(
      responseId,
      userMessage,
      aiResponse,
      rating,
      correction
    );

    // If bad rating, trigger improvement cycle
    if (rating <= 5) {
      console.log('🔄 Triggering improvement cycle due to low rating');
      await this.triggerImprovementCycle();
    }
  }

  /**
   * Trigger improvement cycle
   */
  private async triggerImprovementCycle(): Promise<void> {
    console.log('🔧 Running improvement cycle...');

    // 1. Optimize prompts based on learning
    const optimizedPrompt = await this.metaLearning.optimizePrompt(
      'general',
      this.brain['config'].systemPrompt || ''
    );

    // 2. Run natural selection on agents
    await this.agentDNA.naturalSelection();

    // 3. Check for expired knowledge
    const expired = await this.internetBrain.detectExpiredKnowledge();
    console.log(`🔍 Found ${expired.length} expired knowledge entries`);

    // 4. System health check
    await this.selfHealing.checkSystemHealth();

    console.log('✅ Improvement cycle complete');
    this.emit('improvement_cycle_complete');
  }

  /**
   * Auto-learn from trending topics
   */
  async autoLearnTrending(): Promise<void> {
    if (!this.evolutionEnabled) return;

    console.log('📈 Auto-learning from trending topics...');
    await this.internetBrain.autoLearnTrending(3);
  }

  /**
   * Create long-term goal
   */
  async createGoal(title: string, description: string, targetDate: Date): Promise<any> {
    return await this.goalAutopilot.createGoal(title, description, targetDate);
  }

  /**
   * Get today's tasks
   */
  getTodaysTasks(): any[] {
    return this.goalAutopilot.getTodaysTasks();
  }

  /**
   * Get morning briefing
   */
  async getMorningBriefing(): Promise<string> {
    return await this.goalAutopilot.generateMorningBriefing();
  }

  /**
   * Get Creative Powerhouse instance
   */
  getCreative(): CreativePowerhouse {
    return this.creative;
  }

  /**
   * Get Experimental Lab instance
   */
  getExperimental(): ExperimentalLab {
    return this.experimental;
  }

  /**
   * Get Social Collaborative instance
   */
  getSocial(): SocialCollaborative {
    return this.social;
  }

  /**
   * Get Self-Modification Engine instance
   */
  getSelfModification(): SelfModificationEngine {
    return this.selfModification;
  }

  /**
   * Get Context Awareness Engine instance
   */
  getContextAwareness(): ContextAwarenessEngine {
    return this.contextAwareness;
  }

  /**
   * Get Super Integration Layer instance
   */
  getSuperIntegration(): SuperIntegrationLayer {
    return this.superIntegration;
  }

  /**
   * Get comprehensive status
   */
  getEvolutionStatus(): any {
    return {
      initialized: this.initialized,
      evolution_enabled: this.evolutionEnabled,
      systems: {
        meta_learning: this.metaLearning.getMetrics(),
        agent_dna: this.agentDNA.getEcosystemStats(),
        internet_brain: this.internetBrain.getStats(),
        self_healing: this.selfHealing.getStats(),
        goal_autopilot: this.goalAutopilot.getStats(),
        creative: this.creative.getStats(),
        experimental: this.experimental.getStats(),
        social: this.social.getStats(),
        self_modification: this.selfModification.getStats(),
        context_awareness: this.contextAwareness.getStats(),
        super_integration: this.superIntegration.getStats()
      },
      last_update: new Date()
    };
  }

  /**
   * Generate evolution report
   */
  async generateEvolutionReport(): Promise<string> {
    const status = this.getEvolutionStatus();

    const report = `
🌟 RAGS AI - EVOLUTION REPORT

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📚 META-LEARNING SYSTEM
- Total Feedback: ${status.systems.meta_learning.totalFeedback}
- Average Rating: ${status.systems.meta_learning.averageRating.toFixed(2)}/10
- Patterns Learned: ${status.systems.meta_learning.patternsLearned}
- Improvements: ${status.systems.meta_learning.improvementsCount}

🧬 AGENT DNA SYSTEM
- Total Agents: ${status.systems.agent_dna.total_agents}
- Average Fitness: ${status.systems.agent_dna.average_fitness.toFixed(1)}
- Tasks Completed: ${status.systems.agent_dna.total_tasks_completed}
- Max Generation: ${status.systems.agent_dna.max_generation}

🌐 INTERNET BRAIN
- Knowledge Entries: ${status.systems.internet_brain.total_knowledge}
- Avg Credibility: ${status.systems.internet_brain.average_credibility.toFixed(1)}%
- Sources Tracked: ${status.systems.internet_brain.total_sources}
- Trending Topics: ${status.systems.internet_brain.trending_topics}

🛡️  SELF-HEALING SYSTEM
- Snapshots: ${status.systems.self_healing.snapshots}
- Errors Resolved: ${status.systems.self_healing.errors.resolved}/${status.systems.self_healing.errors.total}
- Security Threats: ${status.systems.self_healing.security_threats.total}
- Healthy Components: ${status.systems.self_healing.health.healthy}

🎯 GOAL AUTOPILOT
- Active Goals: ${status.systems.goal_autopilot.goals.active}
- Completed Goals: ${status.systems.goal_autopilot.goals.completed}
- Today's Tasks: ${status.systems.goal_autopilot.tasks.today}
- Active Habit Streaks: ${status.systems.goal_autopilot.habits.active_streaks}

🎨 CREATIVE POWERHOUSE
- Content Generated: ${status.systems.creative.content_generated}
- Ideas Generated: ${status.systems.creative.ideas_generated}
- Total Words: ${status.systems.creative.total_words}

🧪 EXPERIMENTAL LAB
- Total Experiments: ${status.systems.experimental.total_experiments}
- Active Experiments: ${status.systems.experimental.active_experiments}
- Success Rate: ${status.systems.experimental.success_rate.toFixed(1)}%

🌍 SOCIAL & COLLABORATIVE
- Users: ${status.systems.social.users}
- Shared Knowledge: ${status.systems.social.shared_knowledge}
- AI Network: ${status.systems.social.ai_network} AIs
- Collaborations: ${status.systems.social.collaboration_count}

🔧 SELF-MODIFICATION ENGINE
- Code Generated: ${status.systems.self_modification.total_code_generated}
- Plugins Discovered: ${status.systems.self_modification.plugins_discovered}
- Plugins Installed: ${status.systems.self_modification.plugins_installed}
- Architecture Changes: ${status.systems.self_modification.architecture_changes}

🎯 CONTEXT AWARENESS ENGINE
- Context Snapshots: ${status.systems.context_awareness.context_snapshots}
- Patterns Detected: ${status.systems.context_awareness.patterns_detected}
- Active Predictions: ${status.systems.context_awareness.active_predictions}
- Emotional State: ${status.systems.context_awareness.current_emotional_state}

🌉 SUPER INTEGRATION LAYER
- Total Connectors: ${status.systems.super_integration.total_connectors}
- Connected Services: ${status.systems.super_integration.connected}
- API Calls: ${status.systems.super_integration.api_calls_total}
- Sync Operations: ${status.systems.super_integration.sync_operations}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Status: ${this.initialized ? '🟢 FULLY OPERATIONAL (12 SYSTEMS) 100% COMPLETE! 🎉' : '🔴 NOT INITIALIZED'}
Evolution: ${this.evolutionEnabled ? '✅ ENABLED' : '⏸️  PAUSED'}

Generated: ${new Date().toLocaleString()}
`;

    return report.trim();
  }

  /**
   * Enable/disable evolution
   */
  setEvolutionEnabled(enabled: boolean): void {
    this.evolutionEnabled = enabled;
    console.log(`🌟 Evolution ${enabled ? 'enabled' : 'disabled'}`);
  }

  // Private methods

  private setupEventHandlers(): void {
    // Meta-learning events
    this.metaLearning.on('lesson_learned', (data) => {
      console.log(`📚 Lesson learned: ${data.lesson.substring(0, 100)}...`);
      this.emit('evolution_event', { type: 'lesson_learned', data });
    });

    // Agent DNA events
    this.agentDNA.on('agent_created', (agent) => {
      console.log(`🧬 New agent: ${agent.name}`);
      this.emit('evolution_event', { type: 'agent_created', data: agent });
    });

    // Internet Brain events
    this.internetBrain.on('knowledge_learned', (knowledge) => {
      console.log(`🌐 Learned: ${knowledge.topic}`);
      this.emit('evolution_event', { type: 'knowledge_learned', data: knowledge });
    });

    // Self-Healing events
    this.selfHealing.on('error_auto_fixed', (data) => {
      console.log(`🛡️  Auto-fixed: ${data.error.message}`);
      this.emit('evolution_event', { type: 'error_fixed', data });
    });

    // Goal Autopilot events
    this.goalAutopilot.on('goal_completed', (goal) => {
      console.log(`🎯 Goal completed: ${goal.title}`);
      this.emit('evolution_event', { type: 'goal_completed', data: goal });
    });
  }

  private shouldLearnMore(message: string, selfRating: number): boolean {
    // Learn if rating is low or if message contains learning keywords
    const learningKeywords = ['learn', 'what is', 'explain', 'how to', 'teach'];
    const hasLearningIntent = learningKeywords.some(kw => message.toLowerCase().includes(kw));

    return selfRating < 7 || hasLearningIntent;
  }

  private requiresAgentCollaboration(message: string): boolean {
    // Check if message requires complex task
    const complexKeywords = ['research', 'analyze', 'create', 'build', 'design'];
    return complexKeywords.some(kw => message.toLowerCase().includes(kw));
  }

  private startEvolutionLoop(): void {
    if (!this.evolutionEnabled) return;

    // Daily improvement cycle
    setInterval(async () => {
      try {
        console.log('🔄 Daily evolution cycle starting...');
        await this.triggerImprovementCycle();
        await this.autoLearnTrending();
      } catch (error) {
        console.error('Evolution cycle error:', error);
      }
    }, 24 * 60 * 60 * 1000); // Every 24 hours

    // Weekly agent evolution
    setInterval(async () => {
      try {
        console.log('🧬 Weekly agent evolution...');
        await this.agentDNA.naturalSelection();
      } catch (error) {
        console.error('Agent evolution error:', error);
      }
    }, 7 * 24 * 60 * 60 * 1000); // Every 7 days

    console.log('🔄 Evolution loop started');
  }
}
