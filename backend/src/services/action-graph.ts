// ============================================================================
// RAGS AI - Action Graph System (Phase 2)
// Chains multiple actions together with dependencies
// ============================================================================

import { EventEmitter } from 'events';
import { AgentAction, AgentEngine } from './agent-engine';

export interface ActionNode {
  id: string;
  action: AgentAction;
  dependencies: string[]; // IDs of actions that must complete first
  status: 'waiting' | 'ready' | 'executing' | 'completed' | 'failed';
  result?: any;
  error?: string;
}

export interface ActionGraph {
  id: string;
  name: string;
  description: string;
  nodes: Map<string, ActionNode>;
  edges: Map<string, string[]>; // actionId -> dependent actionIds
  status: 'pending' | 'executing' | 'completed' | 'failed';
  createdAt: Date;
  completedAt?: Date;
}

export class ActionGraphEngine extends EventEmitter {
  private agent: AgentEngine;
  private graphs: Map<string, ActionGraph> = new Map();

  constructor(agent: AgentEngine) {
    super();
    this.agent = agent;
  }

  /**
   * Create a new action graph
   */
  createGraph(name: string, description: string): ActionGraph {
    const graph: ActionGraph = {
      id: this.generateGraphId(),
      name,
      description,
      nodes: new Map(),
      edges: new Map(),
      status: 'pending',
      createdAt: new Date(),
    };

    this.graphs.set(graph.id, graph);
    console.log(`📊 Created graph: ${name}`);

    return graph;
  }

  /**
   * Add action to graph with dependencies
   */
  addActionToGraph(
    graphId: string,
    action: AgentAction,
    dependencies: string[] = []
  ): ActionNode {
    const graph = this.graphs.get(graphId);
    if (!graph) {
      throw new Error(`Graph ${graphId} not found`);
    }

    const node: ActionNode = {
      id: action.id,
      action,
      dependencies,
      status: dependencies.length > 0 ? 'waiting' : 'ready',
    };

    graph.nodes.set(node.id, node);

    // Add edges for dependencies
    dependencies.forEach(depId => {
      if (!graph.edges.has(depId)) {
        graph.edges.set(depId, []);
      }
      graph.edges.get(depId)!.push(node.id);
    });

    console.log(`➕ Added action to graph: ${action.name}`);
    return node;
  }

  /**
   * Execute action graph with dependency resolution
   */
  async executeGraph(graphId: string): Promise<void> {
    const graph = this.graphs.get(graphId);
    if (!graph) {
      throw new Error(`Graph ${graphId} not found`);
    }

    console.log(`🚀 Executing graph: ${graph.name}`);
    graph.status = 'executing';
    this.emit('graph:start', graph);

    try {
      // Execute nodes in dependency order
      while (this.hasReadyNodes(graph)) {
        const readyNodes = this.getReadyNodes(graph);

        // Execute ready nodes in parallel
        await Promise.all(
          readyNodes.map(node => this.executeNode(graph, node))
        );
      }

      // Check if all nodes completed
      const allCompleted = Array.from(graph.nodes.values()).every(
        node => node.status === 'completed'
      );

      if (allCompleted) {
        graph.status = 'completed';
        graph.completedAt = new Date();
        console.log(`✅ Graph completed: ${graph.name}`);
        this.emit('graph:complete', graph);
      } else {
        throw new Error('Some nodes failed to complete');
      }
    } catch (error: any) {
      graph.status = 'failed';
      console.error(`❌ Graph failed: ${graph.name}`, error.message);
      this.emit('graph:error', graph, error);
      throw error;
    }
  }

  /**
   * Execute a single node
   */
  private async executeNode(graph: ActionGraph, node: ActionNode): Promise<void> {
    console.log(`⚡ Executing node: ${node.action.name}`);
    
    node.status = 'executing';
    this.emit('node:start', node);

    try {
      const result = await this.agent.executeAction(node.action);
      
      node.status = 'completed';
      node.result = result;
      
      console.log(`✅ Node completed: ${node.action.name}`);
      this.emit('node:complete', node);

      // Update dependent nodes
      this.updateDependentNodes(graph, node.id);
    } catch (error: any) {
      node.status = 'failed';
      node.error = error.message;
      
      console.error(`❌ Node failed: ${node.action.name}`, error.message);
      this.emit('node:error', node, error);

      // Mark dependent nodes as failed
      this.failDependentNodes(graph, node.id);
      
      throw error;
    }
  }

  /**
   * Check if graph has ready nodes
   */
  private hasReadyNodes(graph: ActionGraph): boolean {
    return Array.from(graph.nodes.values()).some(
      node => node.status === 'ready'
    );
  }

  /**
   * Get all ready nodes
   */
  private getReadyNodes(graph: ActionGraph): ActionNode[] {
    return Array.from(graph.nodes.values()).filter(
      node => node.status === 'ready'
    );
  }

  /**
   * Update nodes that depend on completed node
   */
  private updateDependentNodes(graph: ActionGraph, completedNodeId: string): void {
    const dependentIds = graph.edges.get(completedNodeId) || [];

    dependentIds.forEach(depId => {
      const node = graph.nodes.get(depId);
      if (!node) return;

      // Check if all dependencies are completed
      const allDepsCompleted = node.dependencies.every(depId => {
        const depNode = graph.nodes.get(depId);
        return depNode?.status === 'completed';
      });

      if (allDepsCompleted && node.status === 'waiting') {
        node.status = 'ready';
        console.log(`✅ Node ready: ${node.action.name}`);
      }
    });
  }

  /**
   * Mark dependent nodes as failed
   */
  private failDependentNodes(graph: ActionGraph, failedNodeId: string): void {
    const dependentIds = graph.edges.get(failedNodeId) || [];

    dependentIds.forEach(depId => {
      const node = graph.nodes.get(depId);
      if (node && node.status !== 'completed') {
        node.status = 'failed';
        node.error = `Dependency ${failedNodeId} failed`;
        
        // Recursively fail dependent nodes
        this.failDependentNodes(graph, depId);
      }
    });
  }

  /**
   * Create a common workflow graph
   */
  createWorkflowGraph(workflow: 'morning' | 'content' | 'analysis'): ActionGraph {
    const graph = this.createGraph(
      `${workflow}_workflow`,
      `Automated ${workflow} workflow`
    );

    if (workflow === 'morning') {
      // Morning routine graph
      const checkWeather: AgentAction = {
        id: this.generateActionId(),
        type: 'system',
        name: 'check_weather',
        description: 'Get weather forecast',
        parameters: {},
        priority: 10,
        status: 'pending',
        createdAt: new Date(),
      };

      const checkCalendar: AgentAction = {
        id: this.generateActionId(),
        type: 'life',
        name: 'check_calendar',
        description: 'Get today\'s schedule',
        parameters: {},
        priority: 10,
        status: 'pending',
        createdAt: new Date(),
      };

      const generateBriefing: AgentAction = {
        id: this.generateActionId(),
        type: 'content',
        name: 'generate_briefing',
        description: 'Generate morning briefing',
        parameters: {},
        priority: 5,
        status: 'pending',
        createdAt: new Date(),
      };

      this.addActionToGraph(graph.id, checkWeather);
      this.addActionToGraph(graph.id, checkCalendar);
      this.addActionToGraph(graph.id, generateBriefing, [checkWeather.id, checkCalendar.id]);
    }

    return graph;
  }

  /**
   * Generate unique graph ID
   */
  private generateGraphId(): string {
    return `graph_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique action ID
   */
  private generateActionId(): string {
    return `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get graph by ID
   */
  getGraph(graphId: string): ActionGraph | undefined {
    return this.graphs.get(graphId);
  }

  /**
   * List all graphs
   */
  listGraphs(): ActionGraph[] {
    return Array.from(this.graphs.values());
  }

  /**
   * Delete graph
   */
  deleteGraph(graphId: string): void {
    this.graphs.delete(graphId);
    console.log(`🗑️ Deleted graph: ${graphId}`);
  }

  /**
   * Visualize graph as ASCII
   */
  visualizeGraph(graphId: string): string {
    const graph = this.graphs.get(graphId);
    if (!graph) return 'Graph not found';

    let output = `\n📊 ${graph.name}\n`;
    output += `Status: ${graph.status}\n\n`;

    graph.nodes.forEach(node => {
      const deps = node.dependencies.length > 0 
        ? ` (depends on: ${node.dependencies.join(', ')})`
        : '';
      
      const status = {
        waiting: '⏳',
        ready: '🟢',
        executing: '⚡',
        completed: '✅',
        failed: '❌',
      }[node.status];

      output += `${status} ${node.action.name}${deps}\n`;
    });

    return output;
  }
}
