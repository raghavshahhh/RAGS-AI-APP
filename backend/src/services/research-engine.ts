// ============================================================================
// RAGS AI - Research Engine (Web Search + Knowledge)
// ============================================================================

import axios from 'axios';
import { OllamaBrain } from './ollama-brain';
import { MemorySystem } from './memory-system';

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  source: string;
}

interface ResearchResult {
  query: string;
  summary: string;
  sources: SearchResult[];
  keyPoints: string[];
  timestamp: Date;
}

export class ResearchEngine {
  private brain: OllamaBrain;
  private memory: MemorySystem;

  constructor(brain: OllamaBrain, memory: MemorySystem) {
    this.brain = brain;
    this.memory = memory;
  }

  /**
   * Research a topic comprehensively
   */
  async research(query: string): Promise<ResearchResult> {
    console.log(`🔍 Researching: "${query}"`);

    try {
      // 1. Search for information
      const searchResults = await this.searchWeb(query);

      // 2. Analyze and summarize findings
      const analysis = await this.analyzeResults(query, searchResults);

      // 3. Extract key points
      const keyPoints = await this.extractKeyPoints(analysis);

      // 4. Create comprehensive summary
      const summary = await this.createSummary(query, analysis, keyPoints);

      const result: ResearchResult = {
        query,
        summary,
        sources: searchResults,
        keyPoints,
        timestamp: new Date(),
      };

      // 5. Store research in memory
      await this.storeResearch(result);

      console.log(`✅ Research completed for: "${query}"`);
      return result;

    } catch (error) {
      console.error('Research failed:', error);
      throw error;
    }
  }

  /**
   * Search web for information
   */
  private async searchWeb(query: string): Promise<SearchResult[]> {
    try {
      // Using DuckDuckGo Instant Answer API (free, no API key needed)
      const response = await axios.get(`https://api.duckduckgo.com/`, {
        params: {
          q: query,
          format: 'json',
          no_html: '1',
          skip_disambig: '1',
        },
        timeout: 10000,
      });

      const results: SearchResult[] = [];

      // Process instant answer
      if (response.data.Abstract) {
        results.push({
          title: response.data.Heading || 'DuckDuckGo Instant Answer',
          url: response.data.AbstractURL || '',
          snippet: response.data.Abstract,
          source: 'DuckDuckGo',
        });
      }

      // Process related topics
      if (response.data.RelatedTopics) {
        response.data.RelatedTopics.slice(0, 5).forEach((topic: any) => {
          if (topic.Text && topic.FirstURL) {
            results.push({
              title: topic.Text.split(' - ')[0] || 'Related Topic',
              url: topic.FirstURL,
              snippet: topic.Text,
              source: 'DuckDuckGo',
            });
          }
        });
      }

      return results;

    } catch (error) {
      console.error('Web search failed:', error);
      
      // Fallback: Use AI knowledge
      return await this.searchWithAI(query);
    }
  }

  /**
   * Fallback search using AI knowledge
   */
  private async searchWithAI(query: string): Promise<SearchResult[]> {
    try {
      const prompt = `Provide comprehensive information about: ${query}

Please structure your response as factual information with sources where possible.
Include key facts, recent developments, and important details.`;

      const aiResponse = await this.brain.chat(prompt);

      return [{
        title: `AI Knowledge: ${query}`,
        url: '',
        snippet: aiResponse,
        source: 'Ollama AI',
      }];

    } catch (error) {
      console.error('AI search failed:', error);
      return [];
    }
  }

  /**
   * Analyze search results
   */
  private async analyzeResults(query: string, results: SearchResult[]): Promise<string> {
    if (results.length === 0) {
      return `No specific information found for "${query}". This might be a very specific or recent topic.`;
    }

    const combinedContent = results
      .map(r => `Source: ${r.source}\nTitle: ${r.title}\nContent: ${r.snippet}`)
      .join('\n\n');

    const prompt = `Analyze the following search results for the query: "${query}"

${combinedContent}

Provide a comprehensive analysis that:
1. Synthesizes the key information
2. Identifies important facts and trends
3. Notes any conflicting information
4. Highlights the most reliable sources
5. Provides context and background

Analysis:`;

    return await this.brain.chat(prompt);
  }

  /**
   * Extract key points from analysis
   */
  private async extractKeyPoints(analysis: string): Promise<string[]> {
    const prompt = `Extract the most important key points from this analysis:

${analysis}

Provide 5-7 bullet points that capture the essential information:`;

    const response = await this.brain.chat(prompt);
    
    return response
      .split('\n')
      .filter(line => line.trim().startsWith('-') || line.trim().startsWith('•'))
      .map(line => line.replace(/^[-•]\s*/, '').trim())
      .filter(point => point.length > 0);
  }

  /**
   * Create comprehensive summary
   */
  private async createSummary(query: string, analysis: string, keyPoints: string[]): Promise<string> {
    const prompt = `Create a clear, comprehensive summary for the research query: "${query}"

Based on this analysis:
${analysis}

Key points:
${keyPoints.map(p => `• ${p}`).join('\n')}

Provide a summary that:
1. Directly answers the query
2. Is easy to understand
3. Includes the most important information
4. Is conversational and engaging
5. Mentions reliability of sources

Summary:`;

    return await this.brain.chat(prompt);
  }

  /**
   * Store research in memory
   */
  private async storeResearch(result: ResearchResult): Promise<void> {
    try {
      // Store the research summary
      await this.memory.remember(
        `Research on "${result.query}": ${result.summary}`,
        {
          type: 'research',
          query: result.query,
          timestamp: result.timestamp.toISOString(),
          sources: result.sources.length,
        },
        8 // High importance
      );

      // Store key points separately
      for (const point of result.keyPoints) {
        await this.memory.remember(
          `${result.query}: ${point}`,
          {
            type: 'research_fact',
            query: result.query,
            timestamp: result.timestamp.toISOString(),
          },
          7
        );
      }

      console.log('💾 Research stored in memory');

    } catch (error) {
      console.error('Failed to store research:', error);
    }
  }

  /**
   * Get previous research on topic
   */
  async getPreviousResearch(query: string): Promise<ResearchResult[]> {
    try {
      const memories = await this.memory.recall(`research ${query}`, 5);
      
      return memories
        .filter(m => m.metadata?.type === 'research')
        .map(m => ({
          query: m.metadata?.query || query,
          summary: m.content,
          sources: [],
          keyPoints: [],
          timestamp: new Date(m.metadata?.timestamp || Date.now()),
        }));

    } catch (error) {
      console.error('Failed to get previous research:', error);
      return [];
    }
  }

  /**
   * Quick fact lookup
   */
  async quickFact(query: string): Promise<string> {
    console.log(`⚡ Quick fact lookup: "${query}"`);

    try {
      // First check memory for existing knowledge
      const memories = await this.memory.recall(query, 3);
      
      if (memories.length > 0) {
        const relevantInfo = memories
          .map(m => m.content)
          .join(' ');
        
        const prompt = `Based on what I remember: ${relevantInfo}

Answer this question briefly: ${query}`;
        
        return await this.brain.chat(prompt);
      }

      // If no memory, do quick research
      const results = await this.searchWeb(query);
      
      if (results.length > 0) {
        const quickInfo = results[0].snippet;
        
        const prompt = `Based on this information: ${quickInfo}

Provide a brief, direct answer to: ${query}`;
        
        return await this.brain.chat(prompt);
      }

      // Fallback to AI knowledge
      return await this.brain.chat(`Provide a brief answer to: ${query}`);

    } catch (error) {
      console.error('Quick fact lookup failed:', error);
      return `Sorry, I couldn't find information about "${query}" right now.`;
    }
  }

  /**
   * Research with follow-up questions
   */
  async deepResearch(initialQuery: string, followUpQuestions: string[] = []): Promise<ResearchResult> {
    console.log(`🔬 Deep research: "${initialQuery}"`);

    // Start with initial research
    let result = await this.research(initialQuery);

    // Generate follow-up questions if none provided
    if (followUpQuestions.length === 0) {
      followUpQuestions = await this.generateFollowUpQuestions(initialQuery, result.summary);
    }

    // Research follow-up questions
    for (const question of followUpQuestions.slice(0, 3)) { // Limit to 3 follow-ups
      console.log(`🔍 Follow-up: "${question}"`);
      
      const followUpResult = await this.research(question);
      
      // Merge results
      result.sources.push(...followUpResult.sources);
      result.keyPoints.push(...followUpResult.keyPoints);
      result.summary += `\n\n**${question}**\n${followUpResult.summary}`;
    }

    // Create final comprehensive summary
    result.summary = await this.createFinalSummary(initialQuery, result);

    return result;
  }

  /**
   * Generate follow-up questions
   */
  private async generateFollowUpQuestions(query: string, summary: string): Promise<string[]> {
    const prompt = `Based on this research query: "${query}"

And this summary:
${summary}

Generate 3 important follow-up questions that would provide deeper understanding:`;

    const response = await this.brain.chat(prompt);
    
    return response
      .split('\n')
      .filter(line => line.includes('?'))
      .map(line => line.replace(/^\d+\.\s*/, '').trim())
      .slice(0, 3);
  }

  /**
   * Create final comprehensive summary
   */
  private async createFinalSummary(query: string, result: ResearchResult): Promise<string> {
    const prompt = `Create a final comprehensive summary for: "${query}"

Based on all this research:
${result.summary}

Key points:
${result.keyPoints.map(p => `• ${p}`).join('\n')}

Sources: ${result.sources.length} sources consulted

Provide a well-structured, comprehensive summary that covers all aspects:`;

    return await this.brain.chat(prompt);
  }
}