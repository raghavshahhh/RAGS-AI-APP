/**
 * 🧬 AGENT DNA SYSTEM
 * Autonomous agents with genetic code, evolution, and collaboration
 */

import { EventEmitter } from 'events';
import { OllamaBrain } from './ollama-brain';
import * as fs from 'fs/promises';
import * as path from 'path';
import crypto from 'crypto';

interface AgentDNA {
  id: string;
  name: string;
  species: AgentSpecies;
  generation: number;
  genetic_code: {
    skills: string[];
    personality_traits: string[];
    goal: string;
    specialization: string;
  };
  performance: {
    tasks_completed: number;
    success_rate: number;
    fitness_score: number; // 0-100
    last_active: Date;
  };
  parent_ids?: string[];
  mutations: string[];
  created_at: Date;
}

type AgentSpecies = 
  | 'researcher'
  | 'coder'
  | 'designer'
  | 'analyst'
  | 'negotiator'
  | 'teacher'
  | 'monitor'
  | 'security'
  | 'general';

interface AgentTask {
  id: string;
  description: string;
  assigned_to: string[];
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  result?: any;
  collaboration_data?: {
    messages: Array<{
      from: string;
      to: string;
      message: string;
      timestamp: Date;
    }>;
  };
}

export class AgentDNASystem extends EventEmitter {
  private brain: OllamaBrain;
  private dataDir: string;
  private agents: Map<string, AgentDNA> = new Map();
  private activeTasks: Map<string, AgentTask> = new Map();
  private agentInstances: Map<string, any> = new Map();
  private evolutionHistory: Array<{
    timestamp: Date;
    event: string;
    agents_involved: string[];
  }> = [];

  constructor(brain: OllamaBrain, userId: string = 'default') {
    super();
    this.brain = brain;
    this.dataDir = path.join(process.env.HOME || '', '.rags', 'agent-dna', userId);
  }

  /**
   * Initialize Agent DNA System
   */
  async initialize(): Promise<void> {
    console.log('🧬 Initializing Agent DNA System...');

    await fs.mkdir(this.dataDir, { recursive: true });

    // Load existing agents
    await this.loadAgents();

    // Create default agents if none exist
    if (this.agents.size === 0) {
      await this.createDefaultAgents();
    }

    console.log(`✅ Agent DNA System initialized with ${this.agents.size} agents`);
  }

  /**
   * Create a new agent with DNA
   */
  async createAgent(
    species: AgentSpecies,
    name?: string,
    parentIds?: string[]
  ): Promise<AgentDNA> {
    const id = this.generateAgentId();
    const generation = parentIds ? Math.max(...parentIds.map(pid => {
      const parent = this.agents.get(pid);
      return parent ? parent.generation + 1 : 1;
    })) : 1;

    const dna: AgentDNA = {
      id,
      name: name || `${species}-${id.substring(0, 6)}`,
      species,
      generation,
      genetic_code: await this.generateGeneticCode(species, parentIds),
      performance: {
        tasks_completed: 0,
        success_rate: 0,
        fitness_score: 50,
        last_active: new Date()
      },
      parent_ids: parentIds,
      mutations: [],
      created_at: new Date()
    };

    this.agents.set(id, dna);
    await this.saveAgents();

    this.emit('agent_created', dna);
    console.log(`🧬 Created agent: ${dna.name} (Generation ${generation})`);

    return dna;
  }

  /**
   * Generate genetic code for agent
   */
  private async generateGeneticCode(
    species: AgentSpecies,
    parentIds?: string[]
  ): Promise<AgentDNA['genetic_code']> {
    const speciesTraits: Record<AgentSpecies, any> = {
      researcher: {
        skills: ['web_search', 'data_analysis', 'information_synthesis', 'fact_checking'],
        personality: ['curious', 'methodical', 'thorough'],
        goal: 'Find and synthesize information from multiple sources',
        specialization: 'Research & Information Gathering'
      },
      coder: {
        skills: ['code_generation', 'debugging', 'refactoring', 'testing'],
        personality: ['logical', 'precise', 'problem_solver'],
        goal: 'Write clean, efficient code and fix bugs',
        specialization: 'Software Development'
      },
      designer: {
        skills: ['ui_design', 'ux_analysis', 'color_theory', 'prototyping'],
        personality: ['creative', 'aesthetic', 'user_focused'],
        goal: 'Create beautiful and functional user experiences',
        specialization: 'UI/UX Design'
      },
      analyst: {
        skills: ['data_processing', 'pattern_recognition', 'visualization', 'reporting'],
        personality: ['analytical', 'detail_oriented', 'objective'],
        goal: 'Analyze data and extract actionable insights',
        specialization: 'Data Analysis'
      },
      negotiator: {
        skills: ['email_drafting', 'sentiment_analysis', 'conflict_resolution', 'persuasion'],
        personality: ['diplomatic', 'empathetic', 'strategic'],
        goal: 'Handle communication and negotiations effectively',
        specialization: 'Communication & Negotiation'
      },
      teacher: {
        skills: ['explanation', 'simplification', 'example_generation', 'assessment'],
        personality: ['patient', 'encouraging', 'clear'],
        goal: 'Teach concepts clearly and effectively',
        specialization: 'Education & Training'
      },
      monitor: {
        skills: ['system_monitoring', 'health_checks', 'alerting', 'log_analysis'],
        personality: ['vigilant', 'reliable', 'proactive'],
        goal: 'Monitor systems and detect issues early',
        specialization: 'System Monitoring'
      },
      security: {
        skills: ['threat_detection', 'vulnerability_scanning', 'encryption', 'access_control'],
        personality: ['paranoid', 'thorough', 'protective'],
        goal: 'Protect systems and data from threats',
        specialization: 'Security & Protection'
      },
      general: {
        skills: ['task_execution', 'learning', 'adaptation', 'communication'],
        personality: ['flexible', 'helpful', 'versatile'],
        goal: 'Assist with general tasks and requests',
        specialization: 'General Purpose'
      }
    };

    const baseTraits = speciesTraits[species];

    // If has parents, inherit and mutate
    if (parentIds && parentIds.length > 0) {
      const parents = parentIds.map(id => this.agents.get(id)).filter(Boolean) as AgentDNA[];
      
      // Inherit skills from parents
      const inheritedSkills = new Set<string>();
      parents.forEach(parent => {
        parent.genetic_code.skills.forEach(skill => inheritedSkills.add(skill));
      });

      // Add some mutations (new skills)
      const mutations = baseTraits.skills.filter(() => Math.random() > 0.7);
      mutations.forEach(skill => inheritedSkills.add(skill));

      return {
        skills: Array.from(inheritedSkills),
        personality_traits: [...baseTraits.personality, ...this.generateMutations()],
        goal: baseTraits.goal,
        specialization: baseTraits.specialization
      };
    }

    // New agent, use base traits
    return {
      skills: [...baseTraits.skills],
      personality_traits: [...baseTraits.personality],
      goal: baseTraits.goal,
      specialization: baseTraits.specialization
    };
  }

  /**
   * Clone agent with modifications
   */
  async cloneAgent(agentId: string, modifications?: Partial<AgentDNA['genetic_code']>): Promise<AgentDNA> {
    const parent = this.agents.get(agentId);
    if (!parent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    const clone = await this.createAgent(parent.species, undefined, [agentId]);

    if (modifications) {
      clone.genetic_code = {
        ...clone.genetic_code,
        ...modifications
      };
      
      clone.mutations.push(`Modified: ${Object.keys(modifications).join(', ')}`);
      await this.saveAgents();
    }

    console.log(`🧬 Cloned agent: ${parent.name} → ${clone.name}`);
    return clone;
  }

  /**
   * Assign task to agents
   */
  async assignTask(description: string, agentIds: string[]): Promise<AgentTask> {
    const taskId = crypto.randomUUID();

    const task: AgentTask = {
      id: taskId,
      description,
      assigned_to: agentIds,
      status: 'pending',
      collaboration_data: {
        messages: []
      }
    };

    this.activeTasks.set(taskId, task);

    // Notify agents
    this.emit('task_assigned', {
      taskId,
      agentIds,
      description
    });

    console.log(`📋 Task assigned to ${agentIds.length} agents: ${description}`);

    return task;
  }

  /**
   * Execute task with agent collaboration
   */
  async executeTaskWithCollaboration(taskId: string): Promise<any> {
    const task = this.activeTasks.get(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    task.status = 'in_progress';
    console.log(`🤝 Starting collaborative task: ${task.description}`);

    // Get agents
    const agents = task.assigned_to
      .map(id => this.agents.get(id))
      .filter(Boolean) as AgentDNA[];

    // Phase 1: Planning (agents discuss approach)
    const planningPrompt = `
Task: ${task.description}

Agents involved:
${agents.map(a => `- ${a.name} (${a.species}): ${a.genetic_code.specialization}`).join('\n')}

As a collaborative team, create a plan to accomplish this task.
Each agent should contribute based on their specialization.

Format:
1. [Agent Name]: [Their contribution]
2. [Agent Name]: [Their contribution]
...
`;

    const plan = await this.brain.chat(planningPrompt);
    task.collaboration_data?.messages.push({
      from: 'system',
      to: 'all',
      message: `Plan:\n${plan}`,
      timestamp: new Date()
    });

    // Phase 2: Execution (each agent does their part)
    const results: any[] = [];

    for (const agent of agents) {
      const executionPrompt = `
You are ${agent.name}, a ${agent.species} agent.
Your specialization: ${agent.genetic_code.specialization}
Your skills: ${agent.genetic_code.skills.join(', ')}

Task: ${task.description}
Plan: ${plan}

Execute your part of the task. What do you do?
`;

      const result = await this.brain.chat(executionPrompt);
      
      results.push({
        agent: agent.name,
        contribution: result
      });

      task.collaboration_data?.messages.push({
        from: agent.id,
        to: 'all',
        message: result,
        timestamp: new Date()
      });

      // Update agent performance
      agent.performance.tasks_completed++;
      agent.performance.last_active = new Date();
    }

    // Phase 3: Synthesis (combine results)
    const synthesisPrompt = `
Task: ${task.description}

Agent Contributions:
${results.map(r => `${r.agent}:\n${r.contribution}`).join('\n\n')}

Synthesize these contributions into a final result.
`;

    const finalResult = await this.brain.chat(synthesisPrompt);

    task.status = 'completed';
    task.result = {
      plan,
      contributions: results,
      final_result: finalResult
    };

    // Update agent fitness scores
    agents.forEach(agent => {
      agent.performance.fitness_score = Math.min(100, agent.performance.fitness_score + 5);
    });

    await this.saveAgents();

    console.log(`✅ Collaborative task completed: ${task.description}`);
    this.emit('task_completed', task);

    return task.result;
  }

  /**
   * Natural selection - remove weak agents, keep strong ones
   */
  async naturalSelection(): Promise<void> {
    console.log('🦎 Running natural selection...');

    const agents = Array.from(this.agents.values());
    const weakAgents = agents.filter(a => 
      a.performance.fitness_score < 30 && 
      a.performance.tasks_completed > 5
    );

    for (const agent of weakAgents) {
      console.log(`💀 Removing weak agent: ${agent.name} (fitness: ${agent.performance.fitness_score})`);
      this.agents.delete(agent.id);
      
      this.evolutionHistory.push({
        timestamp: new Date(),
        event: 'agent_died',
        agents_involved: [agent.id]
      });
    }

    // Evolve top performers
    const topAgents = agents
      .filter(a => a.performance.fitness_score > 80)
      .sort((a, b) => b.performance.fitness_score - a.performance.fitness_score)
      .slice(0, 3);

    for (const agent of topAgents) {
      const offspring = await this.cloneAgent(agent.id);
      console.log(`🧬 Top performer ${agent.name} created offspring: ${offspring.name}`);
      
      this.evolutionHistory.push({
        timestamp: new Date(),
        event: 'agent_evolved',
        agents_involved: [agent.id, offspring.id]
      });
    }

    await this.saveAgents();
    this.emit('natural_selection_complete', {
      removed: weakAgents.length,
      evolved: topAgents.length
    });
  }

  /**
   * Get agent by ID
   */
  getAgent(id: string): AgentDNA | undefined {
    return this.agents.get(id);
  }

  /**
   * List all agents
   */
  listAgents(): AgentDNA[] {
    return Array.from(this.agents.values());
  }

  /**
   * Get agents by species
   */
  getAgentsBySpecies(species: AgentSpecies): AgentDNA[] {
    return Array.from(this.agents.values()).filter(a => a.species === species);
  }

  /**
   * Get ecosystem stats
   */
  getEcosystemStats(): any {
    const agents = Array.from(this.agents.values());

    return {
      total_agents: agents.length,
      by_species: agents.reduce((acc, a) => {
        acc[a.species] = (acc[a.species] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      average_fitness: agents.reduce((sum, a) => sum + a.performance.fitness_score, 0) / agents.length,
      total_tasks_completed: agents.reduce((sum, a) => sum + a.performance.tasks_completed, 0),
      max_generation: Math.max(...agents.map(a => a.generation)),
      evolution_events: this.evolutionHistory.length
    };
  }

  // Helper methods

  private generateAgentId(): string {
    return crypto.randomUUID();
  }

  private generateMutations(): string[] {
    const possibleMutations = ['adaptive', 'innovative', 'efficient', 'collaborative'];
    return possibleMutations.filter(() => Math.random() > 0.8);
  }

  private async createDefaultAgents(): Promise<void> {
    console.log('🧬 Creating default agent ecosystem...');

    const species: AgentSpecies[] = [
      'researcher',
      'coder',
      'analyst',
      'general'
    ];

    for (const s of species) {
      await this.createAgent(s);
    }
  }

  private async loadAgents(): Promise<void> {
    try {
      const agentsFile = path.join(this.dataDir, 'agents.json');
      const data = await fs.readFile(agentsFile, 'utf-8');
      const parsed = JSON.parse(data);

      if (parsed.agents) {
        this.agents = new Map(Object.entries(parsed.agents));
      }
      if (parsed.evolution_history) {
        this.evolutionHistory = parsed.evolution_history;
      }

      console.log(`🧬 Loaded ${this.agents.size} agents`);
    } catch (error) {
      console.log('🧬 No existing agents, starting fresh');
    }
  }

  private async saveAgents(): Promise<void> {
    try {
      const agentsFile = path.join(this.dataDir, 'agents.json');
      await fs.writeFile(agentsFile, JSON.stringify({
        agents: Object.fromEntries(this.agents),
        evolution_history: this.evolutionHistory
      }, null, 2));
    } catch (error) {
      console.error('Error saving agents:', error);
    }
  }
}
