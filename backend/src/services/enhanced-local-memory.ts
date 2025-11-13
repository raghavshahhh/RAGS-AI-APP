// ============================================================================
// RAGS AI - Enhanced Local Memory System with SQLite Fallback
// ============================================================================

import * as fs from 'fs/promises';
import * as path from 'path';
import { EventEmitter } from 'events';

interface Memory {
  id: string;
  user_id: string;
  content: string;
  embedding?: number[];
  metadata: Record<string, any>;
  importance: number;
  created_at: number;
  accessed_at: number;
  access_count: number;
  tags: string[];
}

interface ConversationMessage {
  id: string;
  user_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  session_id: string;
}

interface MemoryStats {
  totalMemories: number;
  totalConversations: number;
  averageImportance: number;
  mostAccessedMemory: Memory | null;
  oldestMemory: Memory | null;
  newestMemory: Memory | null;
}

export class EnhancedLocalMemory extends EventEmitter {
  private userId: string;
  private memoryDir: string;
  private memories: Map<string, Memory> = new Map();
  private conversations: Map<string, ConversationMessage> = new Map();
  private sessionId: string;
  private autosaveInterval: NodeJS.Timeout | null = null;

  constructor(userId: string, storageDir: string = './data/memory') {
    super();
    this.userId = userId;
    this.memoryDir = path.join(storageDir, userId);
    this.sessionId = this.generateSessionId();
  }

  /**
   * Initialize the memory system
   */
  async initialize(): Promise<void> {
    try {
      // Create directories
      await fs.mkdir(this.memoryDir, { recursive: true });
      
      // Load existing memories
      await this.loadMemories();
      await this.loadConversations();
      
      // Start autosave
      this.startAutosave();
      
      console.log(`✅ Enhanced Local Memory initialized for user ${this.userId}`);
      console.log(`📊 Loaded ${this.memories.size} memories and ${this.conversations.size} conversations`);
      
      this.emit('initialized', {
        memories: this.memories.size,
        conversations: this.conversations.size
      });
    } catch (error) {
      console.error('Failed to initialize memory system:', error);
      throw error;
    }
  }

  /**
   * Store a memory
   */
  async remember(
    content: string,
    metadata: Record<string, any> = {},
    importance: number = 5,
    tags: string[] = []
  ): Promise<string> {
    try {
      const id = this.generateId();
      const memory: Memory = {
        id,
        user_id: this.userId,
        content,
        metadata,
        importance,
        created_at: Date.now(),
        accessed_at: Date.now(),
        access_count: 0,
        tags
      };

      this.memories.set(id, memory);
      
      // Save immediately for important memories
      if (importance >= 8) {
        await this.saveMemories();
      }

      console.log(`💾 Memory stored: ${content.substring(0, 50)}...`);
      this.emit('memory_stored', memory);
      
      return id;
    } catch (error) {
      console.error('Failed to store memory:', error);
      throw error;
    }
  }

  /**
   * Recall memories by search query
   */
  async recall(query: string, limit: number = 5): Promise<Memory[]> {
    try {
      const lowerQuery = query.toLowerCase();
      const results: Array<{ memory: Memory; score: number }> = [];

      for (const memory of this.memories.values()) {
        // Simple keyword matching (can be improved with embeddings)
        const contentMatch = memory.content.toLowerCase().includes(lowerQuery);
        const tagsMatch = memory.tags.some(tag => tag.toLowerCase().includes(lowerQuery));
        const metadataMatch = JSON.stringify(memory.metadata).toLowerCase().includes(lowerQuery);

        if (contentMatch || tagsMatch || metadataMatch) {
          // Calculate relevance score
          let score = 0;
          if (contentMatch) score += 10;
          if (tagsMatch) score += 5;
          if (metadataMatch) score += 3;
          score += memory.importance;
          score -= (Date.now() - memory.accessed_at) / (1000 * 60 * 60 * 24); // Decay over time

          results.push({ memory, score });

          // Update access info
          memory.accessed_at = Date.now();
          memory.access_count++;
        }
      }

      // Sort by score and return top results
      const sortedResults = results
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(r => r.memory);

      console.log(`🔍 Found ${sortedResults.length} memories for query: ${query}`);
      return sortedResults;
    } catch (error) {
      console.error('Failed to recall memories:', error);
      return [];
    }
  }

  /**
   * Store conversation message
   */
  async saveMessage(role: 'user' | 'assistant' | 'system', content: string): Promise<string> {
    try {
      const id = this.generateId();
      const message: ConversationMessage = {
        id,
        user_id: this.userId,
        role,
        content,
        timestamp: Date.now(),
        session_id: this.sessionId
      };

      this.conversations.set(id, message);
      
      console.log(`💬 Message saved: ${role} - ${content.substring(0, 50)}...`);
      this.emit('message_saved', message);
      
      return id;
    } catch (error) {
      console.error('Failed to save message:', error);
      throw error;
    }
  }

  /**
   * Get conversation history
   */
  async getConversationHistory(limit: number = 20, sessionId?: string): Promise<ConversationMessage[]> {
    try {
      const targetSessionId = sessionId || this.sessionId;
      const messages = Array.from(this.conversations.values())
        .filter(msg => msg.session_id === targetSessionId)
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, limit)
        .reverse();

      return messages;
    } catch (error) {
      console.error('Failed to get conversation history:', error);
      return [];
    }
  }

  /**
   * Get all sessions
   */
  async getSessions(): Promise<Array<{ session_id: string; message_count: number; last_message: string; timestamp: number }>> {
    try {
      const sessions = new Map<string, { count: number; lastMsg: string; time: number }>();

      for (const msg of this.conversations.values()) {
        const existing = sessions.get(msg.session_id);
        if (!existing || msg.timestamp > existing.time) {
          sessions.set(msg.session_id, {
            count: (existing?.count || 0) + 1,
            lastMsg: msg.content,
            time: msg.timestamp
          });
        }
      }

      return Array.from(sessions.entries())
        .map(([session_id, data]) => ({
          session_id,
          message_count: data.count,
          last_message: data.lastMsg,
          timestamp: data.time
        }))
        .sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error('Failed to get sessions:', error);
      return [];
    }
  }

  /**
   * Search memories by tags
   */
  async searchByTags(tags: string[]): Promise<Memory[]> {
    const results: Memory[] = [];
    const lowerTags = tags.map(t => t.toLowerCase());

    for (const memory of this.memories.values()) {
      const hasTag = memory.tags.some(tag => 
        lowerTags.includes(tag.toLowerCase())
      );
      if (hasTag) {
        results.push(memory);
        memory.accessed_at = Date.now();
        memory.access_count++;
      }
    }

    return results.sort((a, b) => b.importance - a.importance);
  }

  /**
   * Update memory importance
   */
  async updateImportance(memoryId: string, importance: number): Promise<void> {
    const memory = this.memories.get(memoryId);
    if (memory) {
      memory.importance = Math.max(0, Math.min(10, importance));
      await this.saveMemories();
      this.emit('importance_updated', { memoryId, importance });
    }
  }

  /**
   * Delete old, unimportant memories
   */
  async cleanup(daysOld: number = 30, minImportance: number = 5): Promise<number> {
    const cutoffTime = Date.now() - (daysOld * 24 * 60 * 60 * 1000);
    let deletedCount = 0;

    for (const [id, memory] of this.memories.entries()) {
      if (
        memory.created_at < cutoffTime &&
        memory.importance < minImportance &&
        memory.access_count < 3
      ) {
        this.memories.delete(id);
        deletedCount++;
      }
    }

    if (deletedCount > 0) {
      await this.saveMemories();
      console.log(`🗑️  Cleaned up ${deletedCount} old memories`);
      this.emit('cleanup_completed', { deletedCount });
    }

    return deletedCount;
  }

  /**
   * Get memory statistics
   */
  async getStats(): Promise<MemoryStats> {
    const memories = Array.from(this.memories.values());
    
    const stats: MemoryStats = {
      totalMemories: memories.length,
      totalConversations: this.conversations.size,
      averageImportance: memories.reduce((sum, m) => sum + m.importance, 0) / memories.length || 0,
      mostAccessedMemory: memories.sort((a, b) => b.access_count - a.access_count)[0] || null,
      oldestMemory: memories.sort((a, b) => a.created_at - b.created_at)[0] || null,
      newestMemory: memories.sort((a, b) => b.created_at - a.created_at)[0] || null
    };

    return stats;
  }

  /**
   * Export memories to JSON
   */
  async exportToJSON(): Promise<string> {
    const data = {
      userId: this.userId,
      exportedAt: Date.now(),
      memories: Array.from(this.memories.values()),
      conversations: Array.from(this.conversations.values())
    };

    const exportPath = path.join(this.memoryDir, `export_${Date.now()}.json`);
    await fs.writeFile(exportPath, JSON.stringify(data, null, 2));
    
    console.log(`📦 Memories exported to ${exportPath}`);
    return exportPath;
  }

  /**
   * Import memories from JSON
   */
  async importFromJSON(filePath: string): Promise<void> {
    const data = JSON.parse(await fs.readFile(filePath, 'utf-8'));
    
    for (const memory of data.memories || []) {
      this.memories.set(memory.id, memory);
    }
    
    for (const message of data.conversations || []) {
      this.conversations.set(message.id, message);
    }

    await this.saveMemories();
    await this.saveConversations();
    
    console.log(`📥 Imported ${data.memories?.length || 0} memories and ${data.conversations?.length || 0} conversations`);
  }

  /**
   * New session
   */
  newSession(): string {
    this.sessionId = this.generateSessionId();
    console.log(`🆕 New session started: ${this.sessionId}`);
    this.emit('new_session', { sessionId: this.sessionId });
    return this.sessionId;
  }

  /**
   * Shutdown and cleanup
   */
  async shutdown(): Promise<void> {
    if (this.autosaveInterval) {
      clearInterval(this.autosaveInterval);
    }
    
    await this.saveMemories();
    await this.saveConversations();
    
    console.log('💤 Memory system shutdown');
    this.emit('shutdown');
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private async loadMemories(): Promise<void> {
    try {
      const memoriesPath = path.join(this.memoryDir, 'memories.json');
      const data = await fs.readFile(memoriesPath, 'utf-8');
      const memories: Memory[] = JSON.parse(data);
      
      for (const memory of memories) {
        this.memories.set(memory.id, memory);
      }
    } catch (error) {
      // File doesn't exist yet, that's OK
      console.log('No existing memories found, starting fresh');
    }
  }

  private async loadConversations(): Promise<void> {
    try {
      const conversationsPath = path.join(this.memoryDir, 'conversations.json');
      const data = await fs.readFile(conversationsPath, 'utf-8');
      const conversations: ConversationMessage[] = JSON.parse(data);
      
      for (const message of conversations) {
        this.conversations.set(message.id, message);
      }
    } catch (error) {
      console.log('No existing conversations found, starting fresh');
    }
  }

  private async saveMemories(): Promise<void> {
    try {
      const memoriesPath = path.join(this.memoryDir, 'memories.json');
      const memories = Array.from(this.memories.values());
      await fs.writeFile(memoriesPath, JSON.stringify(memories, null, 2));
    } catch (error) {
      console.error('Failed to save memories:', error);
    }
  }

  private async saveConversations(): Promise<void> {
    try {
      const conversationsPath = path.join(this.memoryDir, 'conversations.json');
      const conversations = Array.from(this.conversations.values());
      await fs.writeFile(conversationsPath, JSON.stringify(conversations, null, 2));
    } catch (error) {
      console.error('Failed to save conversations:', error);
    }
  }

  private startAutosave(): void {
    // Autosave every 5 minutes
    this.autosaveInterval = setInterval(async () => {
      await this.saveMemories();
      await this.saveConversations();
      console.log('💾 Autosave completed');
    }, 5 * 60 * 1000);
  }

  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}

export default EnhancedLocalMemory;
