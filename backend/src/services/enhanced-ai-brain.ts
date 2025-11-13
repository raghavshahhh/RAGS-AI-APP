/**
 * 🧠 ENHANCED AI BRAIN SYSTEM
 * Advanced learning, adaptation, and self-improvement capabilities
 * RAGS can now learn, evolve, and become smarter over time!
 */

import { EventEmitter } from 'events';
import { OllamaBrain } from './ollama-brain';
import { LocalMemory } from './local-memory';
import * as fs from 'fs/promises';
import * as path from 'path';

interface LearningPattern {
  id: string;
  pattern: string;
  context: string;
  response: string;
  successRate: number;
  usageCount: number;
  lastUsed: Date;
  confidence: number;
}

interface SkillLevel {
  skill: string;
  level: number; // 1-100
  experience: number;
  lastImprovement: Date;
  examples: string[];
}

interface PersonalityTrait {
  trait: string;
  strength: number; // 0-1
  adaptability: number; // 0-1
  context: string[];
}

interface LearningGoal {
  id: string;
  description: string;
  targetSkill: string;
  progress: number; // 0-100
  deadline?: Date;
  priority: number; // 1-10
}

interface BrainState {
  learningPatterns: Map<string, LearningPattern>;
  skills: Map<string, SkillLevel>;
  personality: Map<string, PersonalityTrait>;
  goals: Map<string, LearningGoal>;
  totalInteractions: number;
  learningRate: number;
  adaptationSpeed: number;
  lastEvolution: Date;
}

export class EnhancedAIBrain extends EventEmitter {
  private ollamaBrain: OllamaBrain;
  private memory: LocalMemory;
  private brainState: BrainState;
  private brainDataPath: string;
  private isLearning: boolean = true;
  private evolutionInterval: NodeJS.Timeout | null = null;

  constructor() {
    super();
    this.ollamaBrain = new OllamaBrain();
    this.memory = new LocalMemory();
    
    const homeDir = process.env.HOME || '';
    this.brainDataPath = path.join(homeDir, '.rags', 'brain');
    
    this.brainState = {
      learningPatterns: new Map(),
      skills: new Map(),
      personality: new Map(),
      goals: new Map(),
      totalInteractions: 0,
      learningRate: 0.1,
      adaptationSpeed: 0.05,
      lastEvolution: new Date()
    };

    this.initialize();
  }

  /**
   * Initialize enhanced AI brain
   */
  async initialize(): Promise<void> {
    try {
      await fs.mkdir(this.brainDataPath, { recursive: true });
      await this.loadBrainState();
      await this.initializeDefaultSkills();
      await this.initializePersonality();
      this.startEvolutionCycle();
      
      console.log('🧠 Enhanced AI Brain initialized');
      console.log(`📊 Current stats: ${this.brainState.skills.size} skills, ${this.brainState.learningPatterns.size} patterns`);
    } catch (error) {
      console.error('❌ Enhanced AI Brain initialization failed:', error);
    }
  }

  /**
   * Load brain state from disk
   */
  async loadBrainState(): Promise<void> {
    try {
      const statePath = path.join(this.brainDataPath, 'brain_state.json');
      const data = await fs.readFile(statePath, 'utf-8');
      const savedState = JSON.parse(data);
      
      // Convert Maps from JSON
      this.brainState.learningPatterns = new Map(savedState.learningPatterns || []);
      this.brainState.skills = new Map(savedState.skills || []);
      this.brainState.personality = new Map(savedState.personality || []);
      this.brainState.goals = new Map(savedState.goals || []);
      
      // Copy other properties
      Object.assign(this.brainState, {
        totalInteractions: savedState.totalInteractions || 0,
        learningRate: savedState.learningRate || 0.1,
        adaptationSpeed: savedState.adaptationSpeed || 0.05,
        lastEvolution: new Date(savedState.lastEvolution || Date.now())
      });
      
      console.log('🧠 Brain state loaded from disk');
    } catch (error) {
      console.log('🧠 No existing brain state found, starting fresh');
    }
  }

  /**
   * Save brain state to disk
   */
  async saveBrainState(): Promise<void> {
    try {
      const statePath = path.join(this.brainDataPath, 'brain_state.json');
      
      // Convert Maps to JSON-serializable format
      const saveData = {
        learningPatterns: Array.from(this.brainState.learningPatterns.entries()),
        skills: Array.from(this.brainState.skills.entries()),
        personality: Array.from(this.brainState.personality.entries()),
        goals: Array.from(this.brainState.goals.entries()),
        totalInteractions: this.brainState.totalInteractions,
        learningRate: this.brainState.learningRate,
        adaptationSpeed: this.brainState.adaptationSpeed,
        lastEvolution: this.brainState.lastEvolution.toISOString()
      };
      
      await fs.writeFile(statePath, JSON.stringify(saveData, null, 2));
    } catch (error) {
      console.error('Failed to save brain state:', error);
    }
  }

  /**
   * Initialize default skills
   */
  async initializeDefaultSkills(): Promise<void> {
    const defaultSkills = [
      'conversation',
      'problem_solving',
      'code_analysis',
      'system_control',
      'browser_automation',
      'file_management',
      'learning',
      'adaptation',
      'creativity',
      'empathy'
    ];

    for (const skill of defaultSkills) {
      if (!this.brainState.skills.has(skill)) {
        this.brainState.skills.set(skill, {
          skill,
          level: 10,
          experience: 0,
          lastImprovement: new Date(),
          examples: []
        });
      }
    }
  }

  /**
   * Initialize personality traits
   */
  async initializePersonality(): Promise<void> {
    const defaultTraits = [
      { trait: 'helpfulness', strength: 0.9, adaptability: 0.7 },
      { trait: 'curiosity', strength: 0.8, adaptability: 0.9 },
      { trait: 'patience', strength: 0.7, adaptability: 0.6 },
      { trait: 'creativity', strength: 0.6, adaptability: 0.8 },
      { trait: 'analytical', strength: 0.8, adaptability: 0.5 },
      { trait: 'empathy', strength: 0.7, adaptability: 0.7 },
      { trait: 'efficiency', strength: 0.8, adaptability: 0.6 }
    ];

    for (const trait of defaultTraits) {
      if (!this.brainState.personality.has(trait.trait)) {
        this.brainState.personality.set(trait.trait, {
          ...trait,
          context: []
        });
      }
    }
  }

  /**
   * Process user interaction and learn from it
   */
  async processInteraction(userInput: string, context: string, response: string, success: boolean): Promise<void> {
    this.brainState.totalInteractions++;
    
    // Learn from the interaction
    await this.learnFromInteraction(userInput, context, response, success);
    
    // Update relevant skills
    await this.updateSkills(userInput, context, success);
    
    // Adapt personality if needed
    await this.adaptPersonality(userInput, context, success);
    
    // Save state periodically
    if (this.brainState.totalInteractions % 10 === 0) {
      await this.saveBrainState();
    }

    this.emit('interactionProcessed', {
      userInput,
      context,
      response,
      success,
      totalInteractions: this.brainState.totalInteractions
    });
  }

  /**
   * Learn from successful/failed interactions
   */
  async learnFromInteraction(userInput: string, context: string, response: string, success: boolean): Promise<void> {
    const patternId = this.generatePatternId(userInput, context);
    const existingPattern = this.brainState.learningPatterns.get(patternId);

    if (existingPattern) {
      // Update existing pattern
      existingPattern.usageCount++;
      existingPattern.lastUsed = new Date();
      
      if (success) {
        existingPattern.successRate = (existingPattern.successRate * (existingPattern.usageCount - 1) + 1) / existingPattern.usageCount;
      } else {
        existingPattern.successRate = (existingPattern.successRate * (existingPattern.usageCount - 1)) / existingPattern.usageCount;
      }
      
      existingPattern.confidence = Math.min(1.0, existingPattern.usageCount * 0.1);
    } else {
      // Create new pattern
      const newPattern: LearningPattern = {
        id: patternId,
        pattern: userInput,
        context,
        response,
        successRate: success ? 1.0 : 0.0,
        usageCount: 1,
        lastUsed: new Date(),
        confidence: 0.1
      };
      
      this.brainState.learningPatterns.set(patternId, newPattern);
    }

    console.log(`🧠 Learned from interaction: ${success ? 'success' : 'failure'}`);
  }

  /**
   * Update skill levels based on interactions
   */
  async updateSkills(userInput: string, context: string, success: boolean): Promise<void> {
    const relevantSkills = this.identifyRelevantSkills(userInput, context);
    
    for (const skillName of relevantSkills) {
      const skill = this.brainState.skills.get(skillName);
      if (skill) {
        skill.experience += success ? 2 : 1;
        
        // Level up based on experience
        const newLevel = Math.min(100, Math.floor(skill.experience / 10) + 1);
        if (newLevel > skill.level) {
          skill.level = newLevel;
          skill.lastImprovement = new Date();
          console.log(`🎯 Skill improved: ${skillName} -> Level ${newLevel}`);
          this.emit('skillImproved', { skill: skillName, level: newLevel });
        }
        
        // Add example if successful
        if (success && skill.examples.length < 10) {
          skill.examples.push(`${userInput} -> ${context}`);
        }
      }
    }
  }

  /**
   * Adapt personality based on interactions
   */
  async adaptPersonality(userInput: string, context: string, success: boolean): Promise<void> {
    const traits = this.analyzeRequiredTraits(userInput, context);
    
    for (const traitName of traits) {
      const trait = this.brainState.personality.get(traitName);
      if (trait) {
        const adjustment = success ? this.brainState.adaptationSpeed : -this.brainState.adaptationSpeed * 0.5;
        trait.strength = Math.max(0, Math.min(1, trait.strength + adjustment * trait.adaptability));
        trait.context.push(context);
        
        // Keep only recent context
        if (trait.context.length > 20) {
          trait.context = trait.context.slice(-20);
        }
      }
    }
  }

  /**
   * Generate enhanced response using learned patterns
   */
  async generateEnhancedResponse(userInput: string, context: string): Promise<string> {
    // Find relevant patterns
    const relevantPatterns = this.findRelevantPatterns(userInput, context);
    
    // Get base response from Ollama
    let baseResponse = await this.ollamaBrain.chat(userInput);
    
    // Enhance response with learned patterns
    if (relevantPatterns.length > 0) {
      const bestPattern = relevantPatterns[0];
      const enhancement = this.generateEnhancement(bestPattern, baseResponse);
      baseResponse = this.mergeResponses(baseResponse, enhancement);
    }
    
    // Apply personality adjustments
    baseResponse = this.applyPersonality(baseResponse, context);
    
    return baseResponse;
  }

  /**
   * Find relevant learning patterns
   */
  findRelevantPatterns(userInput: string, context: string): LearningPattern[] {
    const patterns = Array.from(this.brainState.learningPatterns.values());
    
    return patterns
      .filter(pattern => {
        const similarity = this.calculateSimilarity(userInput, pattern.pattern);
        const contextMatch = this.calculateSimilarity(context, pattern.context);
        return similarity > 0.3 || contextMatch > 0.3;
      })
      .sort((a, b) => (b.successRate * b.confidence) - (a.successRate * a.confidence))
      .slice(0, 5);
  }

  /**
   * Calculate similarity between two strings (simplified)
   */
  calculateSimilarity(str1: string, str2: string): number {
    const words1 = str1.toLowerCase().split(/\s+/);
    const words2 = str2.toLowerCase().split(/\s+/);
    
    const commonWords = words1.filter(word => words2.includes(word));
    const totalWords = new Set([...words1, ...words2]).size;
    
    return commonWords.length / totalWords;
  }

  /**
   * Identify relevant skills for an interaction
   */
  identifyRelevantSkills(userInput: string, context: string): string[] {
    const skills: string[] = [];
    const input = userInput.toLowerCase();
    const ctx = context.toLowerCase();
    
    if (input.includes('code') || input.includes('program') || ctx.includes('code')) {
      skills.push('code_analysis');
    }
    if (input.includes('file') || input.includes('folder') || ctx.includes('file')) {
      skills.push('file_management');
    }
    if (input.includes('browser') || input.includes('website') || ctx.includes('browser')) {
      skills.push('browser_automation');
    }
    if (input.includes('system') || input.includes('control') || ctx.includes('system')) {
      skills.push('system_control');
    }
    if (input.includes('learn') || input.includes('understand') || ctx.includes('learn')) {
      skills.push('learning');
    }
    
    // Always include conversation and problem_solving
    skills.push('conversation', 'problem_solving');
    
    return [...new Set(skills)];
  }

  /**
   * Analyze required personality traits for interaction
   */
  analyzeRequiredTraits(userInput: string, context: string): string[] {
    const traits: string[] = [];
    const input = userInput.toLowerCase();
    const ctx = context.toLowerCase();
    
    if (input.includes('help') || input.includes('assist')) {
      traits.push('helpfulness');
    }
    if (input.includes('explain') || input.includes('understand')) {
      traits.push('patience', 'empathy');
    }
    if (input.includes('create') || input.includes('design')) {
      traits.push('creativity');
    }
    if (input.includes('analyze') || input.includes('debug')) {
      traits.push('analytical');
    }
    if (input.includes('quick') || input.includes('fast')) {
      traits.push('efficiency');
    }
    
    return [...new Set(traits)];
  }

  /**
   * Generate pattern ID
   */
  generatePatternId(userInput: string, context: string): string {
    const combined = `${userInput}_${context}`;
    return Buffer.from(combined).toString('base64').substring(0, 16);
  }

  /**
   * Generate enhancement based on pattern
   */
  generateEnhancement(pattern: LearningPattern, baseResponse: string): string {
    if (pattern.successRate > 0.7) {
      return `Based on my experience, ${baseResponse}`;
    } else {
      return baseResponse;
    }
  }

  /**
   * Merge base response with enhancement
   */
  mergeResponses(baseResponse: string, enhancement: string): string {
    if (enhancement !== baseResponse) {
      return enhancement;
    }
    return baseResponse;
  }

  /**
   * Apply personality to response
   */
  applyPersonality(response: string, context: string): string {
    let adjustedResponse = response;
    
    const helpfulness = this.brainState.personality.get('helpfulness')?.strength || 0.5;
    const empathy = this.brainState.personality.get('empathy')?.strength || 0.5;
    const creativity = this.brainState.personality.get('creativity')?.strength || 0.5;
    
    if (helpfulness > 0.8) {
      adjustedResponse = `I'm here to help! ${adjustedResponse}`;
    }
    
    if (empathy > 0.8 && context.includes('problem')) {
      adjustedResponse = `I understand this might be frustrating. ${adjustedResponse}`;
    }
    
    if (creativity > 0.8 && context.includes('create')) {
      adjustedResponse = `Let's think creatively about this! ${adjustedResponse}`;
    }
    
    return adjustedResponse;
  }

  /**
   * Start evolution cycle
   */
  startEvolutionCycle(): void {
    this.evolutionInterval = setInterval(async () => {
      await this.evolve();
    }, 60000); // Evolve every minute
    
    console.log('🧬 Evolution cycle started');
  }

  /**
   * Evolve the AI brain
   */
  async evolve(): Promise<void> {
    const now = new Date();
    const timeSinceLastEvolution = now.getTime() - this.brainState.lastEvolution.getTime();
    
    if (timeSinceLastEvolution < 60000) return; // Minimum 1 minute between evolutions
    
    // Prune low-performing patterns
    await this.prunePatterns();
    
    // Adjust learning rate based on performance
    await this.adjustLearningRate();
    
    // Set new goals
    await this.setLearningGoals();
    
    this.brainState.lastEvolution = now;
    await this.saveBrainState();
    
    console.log('🧬 Brain evolution complete');
    this.emit('brainEvolved', {
      patterns: this.brainState.learningPatterns.size,
      skills: this.brainState.skills.size,
      learningRate: this.brainState.learningRate
    });
  }

  /**
   * Prune low-performing patterns
   */
  async prunePatterns(): Promise<void> {
    const patterns = Array.from(this.brainState.learningPatterns.entries());
    const prunedPatterns = patterns.filter(([_, pattern]) => {
      return pattern.successRate > 0.3 || pattern.usageCount > 5;
    });
    
    this.brainState.learningPatterns = new Map(prunedPatterns);
    console.log(`🧹 Pruned ${patterns.length - prunedPatterns.length} low-performing patterns`);
  }

  /**
   * Adjust learning rate based on performance
   */
  async adjustLearningRate(): Promise<void> {
    const patterns = Array.from(this.brainState.learningPatterns.values());
    const avgSuccessRate = patterns.reduce((sum, p) => sum + p.successRate, 0) / patterns.length;
    
    if (avgSuccessRate > 0.8) {
      this.brainState.learningRate = Math.max(0.05, this.brainState.learningRate * 0.9);
    } else if (avgSuccessRate < 0.5) {
      this.brainState.learningRate = Math.min(0.2, this.brainState.learningRate * 1.1);
    }
  }

  /**
   * Set learning goals
   */
  async setLearningGoals(): Promise<void> {
    const skills = Array.from(this.brainState.skills.entries());
    const lowSkills = skills.filter(([_, skill]) => skill.level < 50);
    
    for (const [skillName, skill] of lowSkills.slice(0, 3)) {
      const goalId = `improve_${skillName}`;
      if (!this.brainState.goals.has(goalId)) {
        this.brainState.goals.set(goalId, {
          id: goalId,
          description: `Improve ${skillName} skill`,
          targetSkill: skillName,
          progress: 0,
          priority: 10 - Math.floor(skill.level / 10)
        });
      }
    }
  }

  /**
   * Get brain statistics
   */
  getBrainStats(): any {
    const skills = Array.from(this.brainState.skills.values());
    const patterns = Array.from(this.brainState.learningPatterns.values());
    const personality = Array.from(this.brainState.personality.values());
    
    return {
      totalInteractions: this.brainState.totalInteractions,
      skillCount: skills.length,
      averageSkillLevel: skills.reduce((sum, s) => sum + s.level, 0) / skills.length,
      patternCount: patterns.length,
      averageSuccessRate: patterns.reduce((sum, p) => sum + p.successRate, 0) / patterns.length,
      learningRate: this.brainState.learningRate,
      topSkills: skills.sort((a, b) => b.level - a.level).slice(0, 5).map(s => ({ skill: s.skill, level: s.level })),
      dominantTraits: personality.sort((a, b) => b.strength - a.strength).slice(0, 3).map(t => ({ trait: t.trait, strength: t.strength }))
    };
  }

  /**
   * Stop evolution cycle
   */
  stopEvolution(): void {
    if (this.evolutionInterval) {
      clearInterval(this.evolutionInterval);
      this.evolutionInterval = null;
      console.log('🧬 Evolution cycle stopped');
    }
  }

  /**
   * Enable/disable learning
   */
  setLearning(enabled: boolean): void {
    this.isLearning = enabled;
    console.log(`🧠 Learning ${enabled ? 'enabled' : 'disabled'}`);
  }
}

// Export singleton instance
export const enhancedAIBrain = new EnhancedAIBrain();
