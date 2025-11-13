// ============================================================================
// WEB INTEGRATION - Real-time web search, scraping, API integration
// ============================================================================

import { exec } from 'child_process';
import { promisify } from 'util';
import axios from 'axios';

const execAsync = promisify(exec);

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

interface WebContent {
  url: string;
  title: string;
  content: string;
  summary?: string;
}

export class WebIntegration {
  private userAgent: string;

  constructor() {
    this.userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36';
  }

  /**
   * Search web (using DuckDuckGo - no API key needed)
   */
  async search(query: string, limit: number = 5): Promise<SearchResult[]> {
    try {
      console.log(`🔍 Searching web: "${query}"`);
      
      // Use DuckDuckGo instant answer API
      const response = await axios.get('https://api.duckduckgo.com/', {
        params: {
          q: query,
          format: 'json',
          no_html: 1
        },
        headers: { 'User-Agent': this.userAgent }
      });

      const results: SearchResult[] = [];

      // Add related topics
      if (response.data.RelatedTopics) {
        for (const topic of response.data.RelatedTopics.slice(0, limit)) {
          if (topic.Text && topic.FirstURL) {
            results.push({
              title: topic.Text.split(' - ')[0] || '',
              url: topic.FirstURL,
              snippet: topic.Text
            });
          }
        }
      }

      // Add abstract as first result if available
      if (response.data.Abstract) {
        results.unshift({
          title: response.data.Heading || query,
          url: response.data.AbstractURL || '',
          snippet: response.data.Abstract
        });
      }

      console.log(`✅ Found ${results.length} results`);
      return results;
    } catch (error) {
      console.error('Web search failed:', error);
      return [];
    }
  }

  /**
   * Fetch and extract webpage content
   */
  async fetchPage(url: string): Promise<WebContent | null> {
    try {
      console.log(`📥 Fetching: ${url}`);

      const response = await axios.get(url, {
        headers: { 'User-Agent': this.userAgent },
        timeout: 10000
      });

      const html = response.data;

      // Basic content extraction (remove HTML tags)
      const content = html
        .replace(/<script[^>]*>.*?<\/script>/gi, '')
        .replace(/<style[^>]*>.*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, 5000); // Limit content

      // Extract title
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      const title = titleMatch ? titleMatch[1] : 'Unknown';

      console.log(`✅ Fetched: ${title}`);

      return {
        url,
        title,
        content
      };
    } catch (error) {
      console.error(`Failed to fetch ${url}:`, error);
      return null;
    }
  }

  /**
   * Search and summarize (combines search + fetch + summarize)
   */
  async searchAndSummarize(query: string, maxResults: number = 3): Promise<string> {
    try {
      // Search
      const results = await this.search(query, maxResults);
      
      if (results.length === 0) {
        return 'No results found.';
      }

      // Compile summary from snippets
      let summary = `Search results for "${query}":\n\n`;
      
      results.forEach((result, index) => {
        summary += `${index + 1}. ${result.title}\n`;
        summary += `   ${result.snippet.substring(0, 150)}...\n`;
        if (result.url) {
          summary += `   🔗 ${result.url}\n`;
        }
        summary += '\n';
      });

      return summary;
    } catch (error) {
      console.error('Search and summarize failed:', error);
      return 'Failed to search and summarize.';
    }
  }

  /**
   * Get Wikipedia summary
   */
  async getWikipediaSummary(topic: string): Promise<string> {
    try {
      const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(topic)}`;
      
      const response = await axios.get(url, {
        headers: { 'User-Agent': this.userAgent }
      });

      if (response.data.extract) {
        return response.data.extract;
      }

      return 'No Wikipedia summary found.';
    } catch (error) {
      return 'Wikipedia lookup failed.';
    }
  }

  /**
   * Get YouTube video info (using oEmbed)
   */
  async getYouTubeInfo(videoId: string): Promise<any> {
    try {
      const response = await axios.get('https://www.youtube.com/oembed', {
        params: {
          url: `https://www.youtube.com/watch?v=${videoId}`,
          format: 'json'
        }
      });

      return {
        title: response.data.title,
        author: response.data.author_name,
        thumbnail: response.data.thumbnail_url
      };
    } catch (error) {
      console.error('YouTube info failed:', error);
      return null;
    }
  }

  /**
   * Search GitHub repositories
   */
  async searchGitHub(query: string, limit: number = 5): Promise<any[]> {
    try {
      const response = await axios.get('https://api.github.com/search/repositories', {
        params: {
          q: query,
          sort: 'stars',
          order: 'desc',
          per_page: limit
        },
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': this.userAgent
        }
      });

      return response.data.items.map((repo: any) => ({
        name: repo.name,
        fullName: repo.full_name,
        description: repo.description,
        url: repo.html_url,
        stars: repo.stargazers_count,
        language: repo.language
      }));
    } catch (error) {
      console.error('GitHub search failed:', error);
      return [];
    }
  }

  /**
   * Get current trending topics
   */
  async getTrending(category: 'tech' | 'news' | 'general' = 'tech'): Promise<string[]> {
    // This would integrate with news APIs or RSS feeds
    // For now, return placeholder
    return [
      'AI developments',
      'Latest tech releases',
      'Popular GitHub projects'
    ];
  }

  /**
   * Check if URL is accessible
   */
  async isUrlAccessible(url: string): Promise<boolean> {
    try {
      await axios.head(url, { timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }
}

export const webIntegration = new WebIntegration();
