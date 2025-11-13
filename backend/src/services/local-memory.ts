// ============================================================================
// LOCAL MEMORY SYSTEM - 100% Offline (No Supabase!)
// ============================================================================

import * as fs from 'fs/promises';
import * as path from 'path';
import axios from 'axios';

interface Memory {
  id: string;
  user_id: string;
  content: string;
  embedding?: number[];
  metadata: Record<string, any>;
  importance: number;
  created_at: string;
  accessed_at: string;
  access_count: number;
}

interface ConversationMessage {
  id: string;
  user_id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  session_id: string;
}

interface Session {
  session_id: string;
  user_id: string;
  started_at: string;
  last_activity: string;
  message_count: number;
}

export class LocalMemory {
  private userId: string;
  private sessionId: string;
  private dataDir: string;
  private memoriesFile: string;
  private conversationsFile: string;
  private sessionsFile: string;
  private ollamaUrl: string;
  private initialized: boolean = false;

  constructor(userId: string = 'default-user') {
    this.userId = userId;
    this.sessionId = this.generateSessionId();
    this.ollamaUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    
    const homeDir = process.env.HOME || process.env.USERPROFILE || '';
    this.dataDir = path.join(homeDir, '.rags', 'memory');
    
    this.memoriesFile = path.join(this.dataDir, `${userId}_memories.json`);
    this.conversationsFile = path.join(this.dataDir, `${userId}_conversations.json`);
    this.sessionsFile = path.join(this.dataDir, `${userId}_sessions.json`);
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    try {
      await fs.mkdir(this.dataDir, { recursive: true });
      await this.ensureFile(this.memoriesFile, '[]');
      await this.ensureFile(this.conversationsFile, '[]');
      await this.ensureFile(this.sessionsFile, '[]');
      await this.createSession();
      this.initialized = true;
      console.log('💾 Local memory initialized:', this.dataDir);
    } catch (error) {
      console.error('Memory init failed:', error);
    }
  }

  private async ensureFile(filepath: string, defaultContent: string): Promise<void> {
    try {
      await fs.access(filepath);
    } catch {
      await fs.writeFile(filepath, defaultContent, 'utf-8');
    }
  }

  private async readJSON<T>(filepath: string): Promise<T[]> {
    try {
      const content = await fs.readFile(filepath, 'utf-8');
      return JSON.parse(content) as T[];
    } catch {
      return [];
    }
  }

  private async writeJSON<T>(filepath: string, data: T[]): Promise<void> {
    await fs.writeFile(filepath, JSON.stringify(data, null, 2), 'utf-8');
  }

  private async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await axios.post(`${this.ollamaUrl}/api/embeddings`, {
        model: 'llama3.2:3b',
        prompt: text
      }, { timeout: 10000 });
      return response.data.embedding || [];
    } catch {
      return [];
    }
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (!a || !b || a.length === 0 || b.length === 0 || a.length !== b.length) return 0;
    let dotProduct = 0, normA = 0, normB = 0;
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  async remember(content: string, metadata: Record<string, any> = {}, importance: number = 5): Promise<void> {
    await this.initialize();
    try {
      const embedding = await this.generateEmbedding(content);
      const memory: Memory = {
        id: `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        user_id: this.userId,
        content,
        embedding,
        metadata,
        importance,
        created_at: new Date().toISOString(),
        accessed_at: new Date().toISOString(),
        access_count: 0
      };
      const memories = await this.readJSON<Memory>(this.memoriesFile);
      memories.push(memory);
      await this.writeJSON(this.memoriesFile, memories);
      console.log('✅ Memory stored:', content.substring(0, 50));
    } catch (error) {
      console.error('Memory store failed:', error);
    }
  }

  async recall(query: string, limit: number = 5): Promise<Memory[]> {
    await this.initialize();
    try {
      const memories = await this.readJSON<Memory>(this.memoriesFile);
      if (memories.length === 0) return [];
      
      const queryEmbedding = await this.generateEmbedding(query);
      if (queryEmbedding.length === 0) {
        const queryLower = query.toLowerCase();
        return memories
          .filter(m => m.content.toLowerCase().includes(queryLower))
          .sort((a, b) => b.importance - a.importance)
          .slice(0, limit);
      }
      
      const scored = memories
        .map(mem => ({
          memory: mem,
          score: mem.embedding && mem.embedding.length > 0 
            ? this.cosineSimilarity(queryEmbedding, mem.embedding)
            : 0
        }))
        .filter(item => item.score > 0.3)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
      
      for (const item of scored) {
        item.memory.accessed_at = new Date().toISOString();
        item.memory.access_count++;
      }
      await this.writeJSON(this.memoriesFile, memories);
      
      console.log(`🔍 Found ${scored.length} memories for: ${query.substring(0, 30)}`);
      return scored.map(item => item.memory);
    } catch (error) {
      console.error('Recall failed:', error);
      return [];
    }
  }

  async saveMessage(role: 'user' | 'assistant', content: string): Promise<void> {
    await this.initialize();
    try {
      const message: ConversationMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        user_id: this.userId,
        role,
        content,
        timestamp: new Date().toISOString(),
        session_id: this.sessionId
      };
      const conversations = await this.readJSON<ConversationMessage>(this.conversationsFile);
      conversations.push(message);
      await this.writeJSON(this.conversationsFile, conversations);
      await this.updateSession();
    } catch (error) {
      console.error('Save message failed:', error);
    }
  }

  async getConversationHistory(limit: number = 20): Promise<ConversationMessage[]> {
    await this.initialize();
    try {
      const conversations = await this.readJSON<ConversationMessage>(this.conversationsFile);
      return conversations
        .filter(msg => msg.session_id === this.sessionId)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit)
        .reverse();
    } catch {
      return [];
    }
  }

  async getContextForAI(currentQuery: string): Promise<string> {
    await this.initialize();
    try {
      const recentMessages = await this.getConversationHistory(10);
      const relevantMemories = await this.recall(currentQuery, 5);

      let context = '';
      if (relevantMemories.length > 0) {
        context += '## What I remember:\n';
        relevantMemories.forEach(mem => context += `- ${mem.content}\n`);
        context += '\n';
      }
      if (recentMessages.length > 0) {
        context += '## Recent chat:\n';
        recentMessages.forEach(msg => 
          context += `${msg.role === 'user' ? 'User' : 'RAGS'}: ${msg.content}\n`
        );
      }
      return context;
    } catch {
      return '';
    }
  }

  private async createSession(): Promise<void> {
    try {
      const sessions = await this.readJSON<Session>(this.sessionsFile);
      sessions.push({
        session_id: this.sessionId,
        user_id: this.userId,
        started_at: new Date().toISOString(),
        last_activity: new Date().toISOString(),
        message_count: 0
      });
      await this.writeJSON(this.sessionsFile, sessions);
    } catch (error) {
      console.error('Create session failed:', error);
    }
  }

  private async updateSession(): Promise<void> {
    try {
      const sessions = await this.readJSON<Session>(this.sessionsFile);
      const session = sessions.find(s => s.session_id === this.sessionId);
      if (session) {
        session.last_activity = new Date().toISOString();
        session.message_count++;
        await this.writeJSON(this.sessionsFile, sessions);
      }
    } catch (error) {
      console.error('Update session failed:', error);
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async newSession(): Promise<void> {
    this.sessionId = this.generateSessionId();
    await this.createSession();
    console.log('🆕 New session started');
  }

  async getStats() {
    await this.initialize();
    try {
      const memories = await this.readJSON<Memory>(this.memoriesFile);
      const conversations = await this.readJSON<ConversationMessage>(this.conversationsFile);
      const sessions = await this.readJSON<Session>(this.sessionsFile);
      return {
        total_memories: memories.length,
        total_conversations: conversations.length,
        total_sessions: sessions.length,
        current_session_messages: conversations.filter(m => m.session_id === this.sessionId).length
      };
    } catch {
      return { total_memories: 0, total_conversations: 0, total_sessions: 0, current_session_messages: 0 };
    }
  }
}

export const localMemory = new LocalMemory();
