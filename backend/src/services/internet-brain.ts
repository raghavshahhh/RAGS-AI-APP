/**
 * 🌐 INTERNET BRAIN
 * Real-time learning from the internet with source credibility
 */

import { EventEmitter } from 'events';
import { OllamaBrain } from './ollama-brain';
import axios from 'axios';
import * as fs from 'fs/promises';
import * as path from 'path';

interface Source {
  url: string;
  domain: string;
  trust_score: number; // 0-100
  last_accessed: Date;
  success_count: number;
  failure_count: number;
}

interface LearnedKnowledge {
  id: string;
  topic: string;
  content: string;
  sources: Array<{
    url: string;
    trust_score: number;
    accessed_at: Date;
  }>;
  credibility_score: number;
  learned_at: Date;
  expires_at?: Date;
  tags: string[];
}

interface TrendingTopic {
  topic: string;
  source: string;
  score: number;
  timestamp: Date;
}

export class InternetBrain extends EventEmitter {
  private brain: OllamaBrain;
  private dataDir: string;
  private sources: Map<string, Source> = new Map();
  private knowledge: Map<string, LearnedKnowledge> = new Map();
  private trendingTopics: TrendingTopic[] = [];
  private learningEnabled: boolean = true;

  // Predefined trust scores for known domains
  private trustedDomains: Record<string, number> = {
    'wikipedia.org': 90,
    'github.com': 85,
    'stackoverflow.com': 85,
    'mdn.mozilla.org': 95,
    'docs.python.org': 95,
    'reactjs.org': 90,
    'nodejs.org': 90,
    'arxiv.org': 80,
    'nature.com': 85,
    'sciencedirect.com': 85,
    'news.ycombinator.com': 75,
    'reddit.com': 60, // Variable quality
    'medium.com': 50, // Variable quality
    'dev.to': 60,
    'freecodecamp.org': 80
  };

  constructor(brain: OllamaBrain, userId: string = 'default') {
    super();
    this.brain = brain;
    this.dataDir = path.join(process.env.HOME || '', '.rags', 'internet-brain', userId);
  }

  /**
   * Initialize Internet Brain
   */
  async initialize(): Promise<void> {
    console.log('🌐 Initializing Internet Brain...');

    await fs.mkdir(this.dataDir, { recursive: true });

    // Load existing knowledge
    await this.loadKnowledge();

    // Initialize trusted sources
    this.initializeTrustedSources();

    console.log(`✅ Internet Brain initialized with ${this.knowledge.size} learned topics`);
  }

  /**
   * Learn from the internet about a topic
   */
  async learnTopic(topic: string, maxSources: number = 5): Promise<LearnedKnowledge> {
    console.log(`🧠 Learning about: ${topic}`);

    // Search multiple sources
    const sources = await this.searchMultipleSources(topic, maxSources);

    // Fetch and analyze content
    const contents = await Promise.all(
      sources.map(async (source) => {
        try {
          const content = await this.fetchContent(source.url);
          return {
            url: source.url,
            content,
            trust_score: source.trust_score
          };
        } catch (error) {
          console.warn(`Failed to fetch ${source.url}`);
          return null;
        }
      })
    );

    const validContents = contents.filter(Boolean) as any[];

    if (validContents.length === 0) {
      throw new Error('No valid sources found');
    }

    // Synthesize knowledge from multiple sources
    const synthesizedKnowledge = await this.synthesizeKnowledge(topic, validContents);

    // Detect contradictions
    const contradictions = await this.detectContradictions(validContents);

    // Calculate credibility score
    const credibilityScore = this.calculateCredibility(validContents);

    // Create learned knowledge entry
    const knowledge: LearnedKnowledge = {
      id: this.generateKnowledgeId(),
      topic,
      content: synthesizedKnowledge,
      sources: validContents.map(c => ({
        url: c.url,
        trust_score: c.trust_score,
        accessed_at: new Date()
      })),
      credibility_score: credibilityScore,
      learned_at: new Date(),
      tags: await this.extractTags(topic, synthesizedKnowledge)
    };

    // Store knowledge
    this.knowledge.set(knowledge.id, knowledge);
    await this.saveKnowledge();

    this.emit('knowledge_learned', knowledge);
    console.log(`✅ Learned about ${topic} (credibility: ${credibilityScore.toFixed(0)}%)`);

    return knowledge;
  }

  /**
   * Fetch trending topics from various sources
   */
  async fetchTrendingTopics(): Promise<TrendingTopic[]> {
    console.log('📈 Fetching trending topics...');

    const trending: TrendingTopic[] = [];

    try {
      // Hacker News
      const hnTrending = await this.fetchHackerNewsTrending();
      trending.push(...hnTrending);

      // GitHub Trending (mock - would need GitHub API)
      // const ghTrending = await this.fetchGitHubTrending();
      // trending.push(...ghTrending);

      // Reddit popular (would need Reddit API)
      // const redditTrending = await this.fetchRedditTrending();
      // trending.push(...redditTrending);

    } catch (error) {
      console.error('Error fetching trending topics:', error);
    }

    this.trendingTopics = trending;
    this.emit('trending_updated', trending);

    return trending;
  }

  /**
   * Auto-learn from trending topics
   */
  async autoLearnTrending(maxTopics: number = 3): Promise<void> {
    if (!this.learningEnabled) {
      console.log('⏸️  Auto-learning is disabled');
      return;
    }

    console.log('🤖 Auto-learning from trending topics...');

    const trending = await this.fetchTrendingTopics();
    const topTopics = trending
      .sort((a, b) => b.score - a.score)
      .slice(0, maxTopics);

    for (const topic of topTopics) {
      try {
        await this.learnTopic(topic.topic, 3);
        console.log(`📚 Auto-learned: ${topic.topic}`);
      } catch (error) {
        console.warn(`Failed to auto-learn ${topic.topic}`);
      }

      // Rate limit
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  /**
   * Search knowledge base
   */
  searchKnowledge(query: string): LearnedKnowledge[] {
    const results: LearnedKnowledge[] = [];
    const lowerQuery = query.toLowerCase();

    for (const knowledge of this.knowledge.values()) {
      const topicMatch = knowledge.topic.toLowerCase().includes(lowerQuery);
      const tagMatch = knowledge.tags.some(tag => tag.toLowerCase().includes(lowerQuery));
      const contentMatch = knowledge.content.toLowerCase().includes(lowerQuery);

      if (topicMatch || tagMatch || contentMatch) {
        results.push(knowledge);
      }
    }

    return results.sort((a, b) => b.credibility_score - a.credibility_score);
  }

  /**
   * Detect expired knowledge
   */
  async detectExpiredKnowledge(): Promise<LearnedKnowledge[]> {
    console.log('🔍 Checking for expired knowledge...');

    const expired: LearnedKnowledge[] = [];
    const now = new Date();

    for (const knowledge of this.knowledge.values()) {
      // Check if explicitly expired
      if (knowledge.expires_at && knowledge.expires_at < now) {
        expired.push(knowledge);
        continue;
      }

      // Check if topic suggests version/dated info
      const hasVersion = /v?\d+\.\d+|\d{4}/.test(knowledge.topic);
      if (hasVersion) {
        // Check if it's been more than 6 months
        const monthsOld = (now.getTime() - knowledge.learned_at.getTime()) / (1000 * 60 * 60 * 24 * 30);
        if (monthsOld > 6) {
          expired.push(knowledge);
        }
      }
    }

    if (expired.length > 0) {
      console.log(`⚠️  Found ${expired.length} expired knowledge entries`);
      
      // Mark as outdated
      expired.forEach(k => {
        k.tags.push('outdated');
      });

      await this.saveKnowledge();
    }

    return expired;
  }

  /**
   * Refresh expired knowledge
   */
  async refreshKnowledge(knowledgeId: string): Promise<LearnedKnowledge> {
    const old = this.knowledge.get(knowledgeId);
    if (!old) {
      throw new Error(`Knowledge ${knowledgeId} not found`);
    }

    console.log(`🔄 Refreshing knowledge: ${old.topic}`);

    // Learn again with fresh data
    const fresh = await this.learnTopic(old.topic);

    // Remove old entry
    this.knowledge.delete(knowledgeId);

    return fresh;
  }

  /**
   * Get source trust score
   */
  getSourceTrustScore(url: string): number {
    const source = this.sources.get(url);
    if (source) {
      return source.trust_score;
    }

    // Check domain trust
    const domain = new URL(url).hostname.replace('www.', '');
    return this.trustedDomains[domain] || 50; // Default neutral score
  }

  /**
   * Update source trust based on performance
   */
  updateSourceTrust(url: string, success: boolean): void {
    let source = this.sources.get(url);
    
    if (!source) {
      const domain = new URL(url).hostname.replace('www.', '');
      source = {
        url,
        domain,
        trust_score: this.trustedDomains[domain] || 50,
        last_accessed: new Date(),
        success_count: 0,
        failure_count: 0
      };
    }

    if (success) {
      source.success_count++;
      // Gradually increase trust (max 95)
      source.trust_score = Math.min(95, source.trust_score + 1);
    } else {
      source.failure_count++;
      // Decrease trust faster
      source.trust_score = Math.max(10, source.trust_score - 3);
    }

    source.last_accessed = new Date();
    this.sources.set(url, source);
  }

  /**
   * Get statistics
   */
  getStats(): any {
    const knowledge = Array.from(this.knowledge.values());

    return {
      total_knowledge: knowledge.length,
      average_credibility: knowledge.reduce((sum, k) => sum + k.credibility_score, 0) / knowledge.length,
      total_sources: this.sources.size,
      trending_topics: this.trendingTopics.length,
      top_topics: knowledge
        .sort((a, b) => b.credibility_score - a.credibility_score)
        .slice(0, 10)
        .map(k => ({ topic: k.topic, credibility: k.credibility_score }))
    };
  }

  // Private helper methods

  private async searchMultipleSources(topic: string, maxSources: number): Promise<Source[]> {
    const sources: Source[] = [];

    // Wikipedia
    sources.push({
      url: `https://en.wikipedia.org/wiki/${encodeURIComponent(topic.replace(/ /g, '_'))}`,
      domain: 'wikipedia.org',
      trust_score: 90,
      last_accessed: new Date(),
      success_count: 0,
      failure_count: 0
    });

    // More sources can be added here (GitHub, Stack Overflow, etc.)

    return sources.slice(0, maxSources);
  }

  private async fetchContent(url: string): Promise<string> {
    try {
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'RAGS-AI/1.0'
        }
      });

      this.updateSourceTrust(url, true);
      return response.data;
    } catch (error) {
      this.updateSourceTrust(url, false);
      throw error;
    }
  }

  private async synthesizeKnowledge(topic: string, sources: any[]): Promise<string> {
    const prompt = `
Synthesize knowledge about "${topic}" from multiple sources.

Sources (with trust scores):
${sources.map((s, i) => `
Source ${i + 1} (Trust: ${s.trust_score}%):
${s.content.substring(0, 500)}...
`).join('\n')}

Create a comprehensive, accurate summary that:
1. Combines information from all sources
2. Prioritizes higher-trust sources
3. Identifies common themes
4. Is concise but complete

Summary:
`;

    return await this.brain.chat(prompt);
  }

  private async detectContradictions(sources: any[]): Promise<string[]> {
    // Simple contradiction detection (can be enhanced)
    const contradictions: string[] = [];

    // This would analyze sources for conflicting information
    // For now, return empty array
    return contradictions;
  }

  private calculateCredibility(sources: any[]): number {
    const avgTrust = sources.reduce((sum, s) => sum + s.trust_score, 0) / sources.length;
    const sourceCount = sources.length;

    // More sources = higher credibility (up to a point)
    const sourceBonus = Math.min(20, sourceCount * 5);

    return Math.min(100, avgTrust + sourceBonus);
  }

  private async extractTags(topic: string, content: string): Promise<string[]> {
    const tags: string[] = [topic.toLowerCase()];

    // Simple keyword extraction
    const keywords = ['programming', 'ai', 'web', 'mobile', 'design', 'data', 'security'];
    keywords.forEach(kw => {
      if (content.toLowerCase().includes(kw)) {
        tags.push(kw);
      }
    });

    return [...new Set(tags)];
  }

  private async fetchHackerNewsTrending(): Promise<TrendingTopic[]> {
    try {
      const response = await axios.get('https://hacker-news.firebaseio.com/v0/topstories.json');
      const topIds = response.data.slice(0, 10);

      const stories = await Promise.all(
        topIds.map(async (id: number) => {
          const story = await axios.get(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
          return story.data;
        })
      );

      return stories.map(story => ({
        topic: story.title,
        source: 'hackernews',
        score: story.score || 0,
        timestamp: new Date(story.time * 1000)
      }));
    } catch (error) {
      console.error('Error fetching Hacker News:', error);
      return [];
    }
  }

  private initializeTrustedSources(): void {
    Object.entries(this.trustedDomains).forEach(([domain, trustScore]) => {
      this.sources.set(domain, {
        url: `https://${domain}`,
        domain,
        trust_score: trustScore,
        last_accessed: new Date(),
        success_count: 0,
        failure_count: 0
      });
    });
  }

  private generateKnowledgeId(): string {
    return `k_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  private async loadKnowledge(): Promise<void> {
    try {
      const knowledgeFile = path.join(this.dataDir, 'knowledge.json');
      const data = await fs.readFile(knowledgeFile, 'utf-8');
      const parsed = JSON.parse(data);

      if (parsed.knowledge) {
        this.knowledge = new Map(Object.entries(parsed.knowledge));
      }
      if (parsed.sources) {
        this.sources = new Map(Object.entries(parsed.sources));
      }

      console.log(`📚 Loaded ${this.knowledge.size} knowledge entries`);
    } catch (error) {
      console.log('📚 No existing knowledge, starting fresh');
    }
  }

  private async saveKnowledge(): Promise<void> {
    try {
      const knowledgeFile = path.join(this.dataDir, 'knowledge.json');
      await fs.writeFile(knowledgeFile, JSON.stringify({
        knowledge: Object.fromEntries(this.knowledge),
        sources: Object.fromEntries(this.sources)
      }, null, 2));
    } catch (error) {
      console.error('Error saving knowledge:', error);
    }
  }
}
