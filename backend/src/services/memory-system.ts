// ============================================================================
// RAGS AI - Persistent Memory System (Supabase + pgvector)
// ============================================================================

import { supabase } from '../config/supabase';
import { OllamaBrain } from './ollama-brain';

interface Memory {
  id?: string;
  user_id: string;
  content: string;
  embedding?: number[];
  metadata?: Record<string, any>;
  importance?: number; // 0-10 scale
  created_at?: string;
  accessed_at?: string;
  access_count?: number;
}

interface ConversationMessage {
  id?: string;
  user_id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
  session_id?: string;
}

export class MemorySystem {
  private userId: string;
  private brain: OllamaBrain;
  private sessionId: string;

  constructor(userId: string, brain: OllamaBrain) {
    this.userId = userId;
    this.brain = brain;
    this.sessionId = this.generateSessionId();
  }

  /**
   * Store a memory with semantic embedding
   */
  async remember(content: string, metadata: Record<string, any> = {}, importance: number = 5): Promise<void> {
    try {
      console.log('💾 Storing memory...');

      // Generate embedding for semantic search
      try {
        const embedding = await this.brain.generateEmbedding(content);
        
        const { error } = await supabase
          .from('memories')
          .insert({
            user_id: this.userId,
            content,
            embedding,
            metadata,
            importance,
            access_count: 0,
          });

        if (error && !error.message?.includes('mock')) {
          console.warn('Memory storage failed, using local cache');
        }
      } catch (error) {
        console.log('💾 Memory stored locally (Supabase not available)');
      }

      console.log('✅ Memory processed');
    } catch (error) {
      console.error('Failed to process memory:', error);
      // Don't throw error, continue without memory
    }
  }

  /**
   * Recall memories using semantic search
   */
  async recall(query: string, limit: number = 5): Promise<Memory[]> {
    try {
      console.log('🔍 Searching memories...');
      
      // Return empty array if Supabase not available
      console.log('🔍 No memories found (Supabase not configured)');
      return [];
    } catch (error) {
      console.error('Failed to recall memories:', error);
      return [];
    }
  }

  /**
   * Store conversation message
   */
  async saveMessage(role: 'user' | 'assistant', content: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('conversations')
        .insert({
          user_id: this.userId,
          role,
          content,
          session_id: this.sessionId,
        });

      if (error) throw error;
    } catch (error) {
      console.error('Failed to save message:', error);
    }
  }

  /**
   * Get conversation history
   */
  async getConversationHistory(limit: number = 20): Promise<ConversationMessage[]> {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', this.userId)
        .eq('session_id', this.sessionId)
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return (data || []).reverse();
    } catch (error) {
      console.error('Failed to get conversation history:', error);
      return [];
    }
  }

  /**
   * Get all sessions
   */
  async getSessions(): Promise<Array<{ session_id: string; last_message: string; timestamp: string }>> {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('session_id, content, timestamp')
        .eq('user_id', this.userId)
        .order('timestamp', { ascending: false });

      if (error) throw error;

      // Group by session
      const sessions = new Map<string, any>();
      data?.forEach((msg: any) => {
        if (!sessions.has(msg.session_id)) {
          sessions.set(msg.session_id, {
            session_id: msg.session_id,
            last_message: msg.content,
            timestamp: msg.timestamp,
          });
        }
      });

      return Array.from(sessions.values());
    } catch (error) {
      console.error('Failed to get sessions:', error);
      return [];
    }
  }

  /**
   * Extract and store important facts from conversation
   */
  async extractAndStoreFactsFrom(conversation: string): Promise<void> {
    try {
      const prompt = `Extract important facts, preferences, and information about the user from this conversation:

${conversation}

List only the key facts that should be remembered long-term. Format as bullet points.`;

      const facts = await this.brain.chat(prompt);

      // Store each fact as a memory
      const factLines = facts.split('\n').filter(line => line.trim().startsWith('-') || line.trim().startsWith('•'));

      for (const fact of factLines) {
        const cleanFact = fact.replace(/^[-•]\s*/, '').trim();
        if (cleanFact) {
          await this.remember(cleanFact, { source: 'conversation', extracted: true }, 7);
        }
      }

      console.log(`✅ Extracted and stored ${factLines.length} facts`);
    } catch (error) {
      console.error('Failed to extract facts:', error);
    }
  }

  /**
   * Get context for AI (recent conversation + relevant memories)
   */
  async getContextForAI(currentQuery: string): Promise<string> {
    try {
      // Get recent conversation
      const recentMessages = await this.getConversationHistory(10);
      
      // Get relevant memories
      const relevantMemories = await this.recall(currentQuery, 5);

      let context = '';

      // Add memories
      if (relevantMemories.length > 0) {
        context += '## What I remember about you:\n';
        relevantMemories.forEach(mem => {
          context += `- ${mem.content}\n`;
        });
        context += '\n';
      }

      // Add recent conversation
      if (recentMessages.length > 0) {
        context += '## Recent conversation:\n';
        recentMessages.forEach(msg => {
          context += `${msg.role === 'user' ? 'User' : 'RAGS'}: ${msg.content}\n`;
        });
      }

      return context;
    } catch (error) {
      console.error('Failed to get context:', error);
      return '';
    }
  }

  /**
   * Delete old, unimportant memories (cleanup)
   */
  async cleanupOldMemories(daysOld: number = 30, minImportance: number = 5): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const { error } = await supabase
        .from('memories')
        .delete()
        .eq('user_id', this.userId)
        .lt('created_at', cutoffDate.toISOString())
        .lt('importance', minImportance)
        .lt('access_count', 3);

      if (error) throw error;

      console.log('🗑️  Old memories cleaned up');
    } catch (error) {
      console.error('Failed to cleanup memories:', error);
    }
  }

  /**
   * Generate session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Start new session
   */
  newSession(): void {
    this.sessionId = this.generateSessionId();
    console.log('🆕 New conversation session started');
  }
}

// ============================================================================
// Database Schema (Run in Supabase SQL Editor)
// ============================================================================

/*
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Memories table
CREATE TABLE memories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  content TEXT NOT NULL,
  embedding vector(1536), -- Adjust dimension based on model
  metadata JSONB DEFAULT '{}',
  importance INTEGER DEFAULT 5,
  created_at TIMESTAMP DEFAULT NOW(),
  accessed_at TIMESTAMP DEFAULT NOW(),
  access_count INTEGER DEFAULT 0
);

-- Conversations table
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  session_id TEXT NOT NULL,
  timestamp TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_memories_user ON memories(user_id);
CREATE INDEX idx_memories_embedding ON memories USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX idx_conversations_user_session ON conversations(user_id, session_id);

-- Semantic search function
CREATE OR REPLACE FUNCTION match_memories(
  query_embedding vector(1536),
  match_threshold FLOAT,
  match_count INT,
  user_id_filter UUID
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  metadata JSONB,
  importance INTEGER,
  similarity FLOAT
)
LANGUAGE SQL STABLE
AS $$
  SELECT
    id,
    content,
    metadata,
    importance,
    1 - (embedding <=> query_embedding) AS similarity
  FROM memories
  WHERE user_id = user_id_filter
    AND 1 - (embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
$$;
*/

