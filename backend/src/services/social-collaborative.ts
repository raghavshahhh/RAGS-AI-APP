/**
 * 🌍 SOCIAL & COLLABORATIVE SYSTEM
 * Multi-user support, AI-to-AI communication, community brain
 */

import { EventEmitter } from 'events';
import { OllamaBrain } from './ollama-brain';
import * as fs from 'fs/promises';
import * as path from 'path';

interface UserProfile {
  id: string;
  name: string;
  role: 'owner' | 'family' | 'guest';
  permissions: string[];
  created_at: Date;
  last_active: Date;
}

interface SharedKnowledge {
  id: string;
  content: string;
  shared_by: string;
  category: string;
  privacy: 'public' | 'family' | 'private';
  created_at: Date;
}

interface AIMessage {
  id: string;
  from_ai: string;
  to_ai: string;
  message: string;
  timestamp: Date;
  response?: string;
}

interface CommunityContribution {
  id: string;
  user_id: string;
  type: 'knowledge' | 'pattern' | 'solution';
  content: string;
  anonymized: boolean;
  upvotes: number;
  created_at: Date;
}

export class SocialCollaborative extends EventEmitter {
  private brain: OllamaBrain;
  private dataDir: string;
  private users: Map<string, UserProfile> = new Map();
  private sharedKnowledge: SharedKnowledge[] = [];
  private aiMessages: AIMessage[] = [];
  private communityContributions: CommunityContribution[] = [];
  private aiNetwork: Map<string, any> = new Map(); // Other AI instances

  constructor(brain: OllamaBrain, userId: string = 'default') {
    super();
    this.brain = brain;
    this.dataDir = path.join(process.env.HOME || '', '.rags', 'social', userId);
  }

  /**
   * Initialize Social & Collaborative system
   */
  async initialize(): Promise<void> {
    console.log('🌍 Initializing Social & Collaborative System...');

    await fs.mkdir(this.dataDir, { recursive: true });
    await this.loadData();

    console.log(`✅ Social system initialized with ${this.users.size} users`);
  }

  /**
   * Create new user profile
   */
  async createUser(name: string, role: UserProfile['role']): Promise<UserProfile> {
    console.log(`👤 Creating user: ${name} (${role})`);

    const userId = `user_${Date.now()}`;
    const permissions = this.getDefaultPermissions(role);

    const user: UserProfile = {
      id: userId,
      name,
      role,
      permissions,
      created_at: new Date(),
      last_active: new Date()
    };

    this.users.set(userId, user);
    await this.saveData();

    this.emit('user_created', user);
    console.log(`✅ User created: ${name}`);

    return user;
  }

  /**
   * Share knowledge with other users
   */
  async shareKnowledge(
    userId: string,
    content: string,
    category: string,
    privacy: SharedKnowledge['privacy']
  ): Promise<SharedKnowledge> {
    console.log(`📤 ${userId} sharing knowledge: ${category}`);

    const knowledge: SharedKnowledge = {
      id: `knowledge_${Date.now()}`,
      content,
      shared_by: userId,
      category,
      privacy,
      created_at: new Date()
    };

    this.sharedKnowledge.push(knowledge);
    await this.saveData();

    this.emit('knowledge_shared', knowledge);
    console.log(`✅ Knowledge shared: ${category} (${privacy})`);

    return knowledge;
  }

  /**
   * Get accessible knowledge for user
   */
  getAccessibleKnowledge(userId: string): SharedKnowledge[] {
    const user = this.users.get(userId);
    if (!user) return [];

    return this.sharedKnowledge.filter(k => {
      if (k.privacy === 'private' && k.shared_by !== userId) return false;
      if (k.privacy === 'family' && user.role === 'guest') return false;
      return true;
    });
  }

  /**
   * Send message to another AI
   */
  async sendAIMessage(toAI: string, message: string, fromAI: string = 'RAGS'): Promise<AIMessage> {
    console.log(`🤖 ${fromAI} → ${toAI}: ${message.substring(0, 50)}...`);

    const aiMessage: AIMessage = {
      id: `msg_${Date.now()}`,
      from_ai: fromAI,
      to_ai: toAI,
      message,
      timestamp: new Date()
    };

    // Check if target AI is in network
    if (this.aiNetwork.has(toAI)) {
      // Simulate AI communication
      const response = await this.simulateAIResponse(toAI, message);
      aiMessage.response = response;
    } else {
      console.log(`⚠️  AI ${toAI} not in network`);
    }

    this.aiMessages.push(aiMessage);
    await this.saveData();

    this.emit('ai_message_sent', aiMessage);

    return aiMessage;
  }

  /**
   * Register remote AI in network
   */
  async registerAI(aiId: string, aiInfo: {
    name: string;
    capabilities: string[];
    endpoint?: string;
  }): Promise<void> {
    console.log(`🔗 Registering AI: ${aiInfo.name}`);

    this.aiNetwork.set(aiId, {
      ...aiInfo,
      registered_at: new Date(),
      last_seen: new Date()
    });

    await this.saveData();

    this.emit('ai_registered', { aiId, aiInfo });
    console.log(`✅ AI registered: ${aiInfo.name}`);
  }

  /**
   * Collaborate with another AI on a problem
   */
  async collaborateWithAI(aiId: string, problem: string): Promise<any> {
    console.log(`🤝 Collaborating with ${aiId} on: ${problem}`);

    // Get AI's perspective
    const perspective = await this.sendAIMessage(
      aiId,
      `Help me solve: ${problem}`,
      'RAGS'
    );

    // Combine with own analysis
    const ownAnalysisPrompt = `
Problem: ${problem}

Another AI's perspective:
${perspective.response}

Provide your analysis and combine it with theirs for a comprehensive solution:
`;

    const combinedSolution = await this.brain.chat(ownAnalysisPrompt);

    console.log('✅ Collaborative solution generated');

    return {
      problem,
      ais_involved: ['RAGS', aiId],
      individual_perspectives: {
        RAGS: combinedSolution,
        [aiId]: perspective.response
      },
      combined_solution: combinedSolution,
      timestamp: new Date()
    };
  }

  /**
   * Contribute to community brain (anonymized)
   */
  async contributeToGlobalBrain(
    userId: string,
    type: CommunityContribution['type'],
    content: string,
    anonymize: boolean = true
  ): Promise<CommunityContribution> {
    console.log(`🌐 Contributing to global brain: ${type}`);

    // Anonymize if requested
    const anonymizedContent = anonymize 
      ? await this.anonymizeContent(content)
      : content;

    const contribution: CommunityContribution = {
      id: `contrib_${Date.now()}`,
      user_id: anonymize ? 'anonymous' : userId,
      type,
      content: anonymizedContent,
      anonymized: anonymize,
      upvotes: 0,
      created_at: new Date()
    };

    this.communityContributions.push(contribution);
    await this.saveData();

    this.emit('community_contribution', contribution);
    console.log(`✅ Contributed to global brain (${anonymize ? 'anonymized' : 'public'})`);

    return contribution;
  }

  /**
   * Search global brain
   */
  async searchGlobalBrain(query: string): Promise<CommunityContribution[]> {
    console.log(`🔍 Searching global brain: "${query}"`);

    const lowerQuery = query.toLowerCase();

    const results = this.communityContributions
      .filter(c => c.content.toLowerCase().includes(lowerQuery))
      .sort((a, b) => b.upvotes - a.upvotes)
      .slice(0, 10);

    console.log(`Found ${results.length} contributions`);

    return results;
  }

  /**
   * Upvote contribution
   */
  async upvoteContribution(contributionId: string): Promise<void> {
    const contribution = this.communityContributions.find(c => c.id === contributionId);
    if (contribution) {
      contribution.upvotes++;
      await this.saveData();
      console.log(`👍 Upvoted contribution: ${contributionId}`);
    }
  }

  /**
   * Get user permissions
   */
  getUserPermissions(userId: string): string[] {
    const user = this.users.get(userId);
    return user?.permissions || [];
  }

  /**
   * Check if user has permission
   */
  hasPermission(userId: string, permission: string): boolean {
    const permissions = this.getUserPermissions(userId);
    return permissions.includes(permission) || permissions.includes('*');
  }

  /**
   * Get network status
   */
  getNetworkStatus(): any {
    return {
      total_users: this.users.size,
      users_by_role: Array.from(this.users.values()).reduce((acc, u) => {
        acc[u.role] = (acc[u.role] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      shared_knowledge: this.sharedKnowledge.length,
      ai_network_size: this.aiNetwork.size,
      ai_messages: this.aiMessages.length,
      community_contributions: this.communityContributions.length,
      top_contributors: this.getTopContributors(5)
    };
  }

  /**
   * Get statistics
   */
  getStats(): any {
    return {
      users: this.users.size,
      shared_knowledge: this.sharedKnowledge.length,
      ai_network: this.aiNetwork.size,
      messages_exchanged: this.aiMessages.length,
      community_contributions: this.communityContributions.length,
      collaboration_count: this.aiMessages.filter(m => m.response).length
    };
  }

  // Private helper methods

  private getDefaultPermissions(role: UserProfile['role']): string[] {
    const permissionSets: Record<string, string[]> = {
      owner: ['*'], // All permissions
      family: [
        'read_knowledge',
        'share_knowledge',
        'create_goals',
        'use_ai',
        'contribute_community'
      ],
      guest: [
        'read_public_knowledge',
        'use_ai'
      ]
    };

    return permissionSets[role] || [];
  }

  private async simulateAIResponse(aiId: string, message: string): Promise<string> {
    const aiInfo = this.aiNetwork.get(aiId);
    if (!aiInfo) return 'AI not available';

    // Simulate response from another AI
    const simulatedPrompt = `
You are ${aiInfo.name}, an AI with capabilities: ${aiInfo.capabilities.join(', ')}

You received this message: "${message}"

Respond from your perspective:
`;

    return await this.brain.chat(simulatedPrompt);
  }

  private async anonymizeContent(content: string): Promise<string> {
    const anonymizePrompt = `
Anonymize this content by removing personal information:

${content}

Replace:
- Names with [PERSON]
- Locations with [LOCATION]
- Dates with [DATE]
- Email/phone with [CONTACT]

Keep the knowledge/pattern intact:
`;

    return await this.brain.chat(anonymizePrompt);
  }

  private getTopContributors(limit: number): Array<{ user_id: string; contributions: number }> {
    const counts = this.communityContributions.reduce((acc, c) => {
      if (c.user_id !== 'anonymous') {
        acc[c.user_id] = (acc[c.user_id] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([user_id, contributions]) => ({ user_id, contributions }));
  }

  private async loadData(): Promise<void> {
    try {
      const dataFile = path.join(this.dataDir, 'social_data.json');
      const data = await fs.readFile(dataFile, 'utf-8');
      const parsed = JSON.parse(data);

      if (parsed.users) {
        this.users = new Map(Object.entries(parsed.users));
      }
      if (parsed.sharedKnowledge) {
        this.sharedKnowledge = parsed.sharedKnowledge;
      }
      if (parsed.aiMessages) {
        this.aiMessages = parsed.aiMessages;
      }
      if (parsed.aiNetwork) {
        this.aiNetwork = new Map(Object.entries(parsed.aiNetwork));
      }
      if (parsed.communityContributions) {
        this.communityContributions = parsed.communityContributions;
      }

      console.log(`📊 Loaded social data`);
    } catch (error) {
      console.log('📊 No existing social data');
    }
  }

  private async saveData(): Promise<void> {
    try {
      const dataFile = path.join(this.dataDir, 'social_data.json');
      await fs.writeFile(dataFile, JSON.stringify({
        users: Object.fromEntries(this.users),
        sharedKnowledge: this.sharedKnowledge,
        aiMessages: this.aiMessages.slice(-100), // Keep last 100
        aiNetwork: Object.fromEntries(this.aiNetwork),
        communityContributions: this.communityContributions.slice(-500) // Keep last 500
      }, null, 2));
    } catch (error) {
      console.error('Error saving social data:', error);
    }
  }
}
