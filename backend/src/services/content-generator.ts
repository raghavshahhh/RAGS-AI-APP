// ============================================================================
// RAGS AI - Content Generation Service (Phase 5)
// ============================================================================

import { OllamaBrain } from './ollama-brain';
import axios from 'axios';

export interface ContentRequest {
  type: 'post' | 'caption' | 'script' | 'blog' | 'tweet';
  topic: string;
  platform?: 'instagram' | 'twitter' | 'linkedin' | 'tiktok';
  tone?: 'professional' | 'casual' | 'funny' | 'inspirational';
  length?: 'short' | 'medium' | 'long';
  includeHashtags?: boolean;
  includeEmojis?: boolean;
}

export interface GeneratedContent {
  text: string;
  hashtags?: string[];
  imagePrompt?: string;
  platform: string;
  metadata: {
    wordCount: number;
    characterCount: number;
    estimatedReadTime?: number;
  };
}

export class ContentGenerator {
  private brain: OllamaBrain;
  private openaiKey?: string;

  constructor(brain: OllamaBrain, openaiKey?: string) {
    this.brain = brain;
    this.openaiKey = openaiKey;
  }

  /**
   * Generate social media content
   */
  async generateContent(request: ContentRequest): Promise<GeneratedContent> {
    console.log(`📝 Generating ${request.type} about: ${request.topic}`);

    const prompt = this.buildPrompt(request);
    const response = await this.brain.chat(prompt);

    const content = this.parseResponse(response, request);
    console.log(`✅ Generated ${content.metadata.wordCount} words`);

    return content;
  }

  /**
   * Generate Instagram post
   */
  async generateInstagramPost(topic: string, tone: string = 'casual'): Promise<GeneratedContent> {
    return this.generateContent({
      type: 'post',
      topic,
      platform: 'instagram',
      tone: tone as any,
      includeHashtags: true,
      includeEmojis: true,
    });
  }

  /**
   * Generate Twitter thread
   */
  async generateTwitterThread(topic: string, tweetCount: number = 5): Promise<GeneratedContent[]> {
    const prompt = `Create a Twitter thread about "${topic}" with ${tweetCount} tweets.

Requirements:
- Each tweet must be under 280 characters
- First tweet should be attention-grabbing
- Include relevant hashtags
- Use emojis appropriately
- End with a CTA

Format each tweet as:
Tweet 1: [content]
Tweet 2: [content]
...`;

    const response = await this.brain.chat(prompt);
    
    // Parse tweets
    const tweetMatches = response.match(/Tweet \d+: (.*?)(?=Tweet \d+:|$)/gs);
    
    if (!tweetMatches) {
      throw new Error('Failed to parse tweets');
    }

    return tweetMatches.map((match, index) => {
      const text = match.replace(/Tweet \d+: /, '').trim();
      return {
        text,
        platform: 'twitter',
        metadata: {
          wordCount: text.split(' ').length,
          characterCount: text.length,
        },
      };
    });
  }

  /**
   * Generate LinkedIn post
   */
  async generateLinkedInPost(topic: string): Promise<GeneratedContent> {
    return this.generateContent({
      type: 'post',
      topic,
      platform: 'linkedin',
      tone: 'professional',
      length: 'medium',
      includeHashtags: true,
      includeEmojis: false,
    });
  }

  /**
   * Generate video script
   */
  async generateVideoScript(topic: string, duration: number = 60): Promise<GeneratedContent> {
    const prompt = `Create a ${duration}-second video script about "${topic}".

Structure:
- Hook (0-5 sec): Attention grabber
- Introduction (5-15 sec): What's this about
- Main Content (15-50 sec): Key points
- Call to Action (50-60 sec): What to do next

Include:
- Timestamps
- Visual suggestions
- Music/sound notes
- Text overlay ideas

Format professionally.`;

    const response = await this.brain.chat(prompt);

    return {
      text: response,
      platform: 'video',
      metadata: {
        wordCount: response.split(' ').length,
        characterCount: response.length,
        estimatedReadTime: Math.ceil(duration / 150), // Words per second
      },
    };
  }

  /**
   * Generate blog post
   */
  async generateBlogPost(topic: string, keywords?: string[]): Promise<GeneratedContent> {
    const keywordText = keywords ? `\nTarget keywords: ${keywords.join(', ')}` : '';
    
    const prompt = `Write a comprehensive blog post about "${topic}".${keywordText}

Structure:
1. Catchy title
2. Introduction (hook the reader)
3. Main sections with subheadings (H2, H3)
4. Examples and actionable tips
5. Conclusion with CTA

Style:
- SEO-optimized
- Easy to read (short paragraphs)
- Include bullet points
- Engaging tone
- 1000-1500 words

Start writing:`;

    const response = await this.brain.chat(prompt, { temperature: 0.7 });

    return {
      text: response,
      platform: 'blog',
      metadata: {
        wordCount: response.split(' ').length,
        characterCount: response.length,
        estimatedReadTime: Math.ceil(response.split(' ').length / 200),
      },
    };
  }

  /**
   * Generate image using DALL-E 3
   */
  async generateImage(prompt: string, size: '1024x1024' | '1792x1024' | '1024x1792' = '1024x1024'): Promise<string> {
    if (!this.openaiKey) {
      throw new Error('OpenAI API key not configured');
    }

    console.log(`🎨 Generating image: ${prompt}`);

    try {
      const response = await axios.post(
        'https://api.openai.com/v1/images/generations',
        {
          model: 'dall-e-3',
          prompt,
          n: 1,
          size,
          quality: 'hd',
        },
        {
          headers: {
            'Authorization': `Bearer ${this.openaiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const imageUrl = response.data.data[0].url;
      console.log(`✅ Image generated: ${imageUrl}`);

      return imageUrl;
    } catch (error: any) {
      console.error('❌ Image generation failed:', error.message);
      throw error;
    }
  }

  /**
   * Generate hashtags
   */
  async generateHashtags(topic: string, count: number = 10): Promise<string[]> {
    const prompt = `Generate ${count} relevant, trending hashtags for content about "${topic}".

Requirements:
- Mix of popular and niche hashtags
- No spaces in hashtags
- Include # symbol
- Prioritize discoverability

Just list the hashtags, one per line.`;

    const response = await this.brain.chat(prompt);
    
    const hashtags = response
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.startsWith('#'))
      .slice(0, count);

    return hashtags;
  }

  /**
   * Optimize content for platform
   */
  optimizeForPlatform(content: string, platform: string): string {
    switch (platform) {
      case 'twitter':
        return content.slice(0, 280); // Twitter limit
      
      case 'instagram':
        return content.slice(0, 2200); // Instagram caption limit
      
      case 'linkedin':
        return content.slice(0, 3000); // LinkedIn limit
      
      case 'tiktok':
        return content.slice(0, 150); // TikTok caption limit
      
      default:
        return content;
    }
  }

  /**
   * Extract keywords from content
   */
  async extractKeywords(content: string): Promise<string[]> {
    const prompt = `Extract the 10 most important keywords from this content:

${content}

List only the keywords, one per line.`;

    const response = await this.brain.chat(prompt);
    
    return response
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .slice(0, 10);
  }

  /**
   * Build prompt for content generation
   */
  private buildPrompt(request: ContentRequest): string {
    const platformInstructions = this.getPlatformInstructions(request.platform!);
    const toneInstructions = this.getToneInstructions(request.tone!);
    const lengthInstructions = this.getLengthInstructions(request.length!);

    return `Create ${request.type} content about "${request.topic}".

Platform: ${request.platform}
${platformInstructions}

Tone: ${request.tone}
${toneInstructions}

Length: ${request.length}
${lengthInstructions}

${request.includeHashtags ? 'Include 5-10 relevant hashtags at the end.' : ''}
${request.includeEmojis ? 'Use emojis appropriately to enhance engagement.' : ''}

Write the content now:`;
  }

  private getPlatformInstructions(platform: string): string {
    const instructions: Record<string, string> = {
      instagram: '- Square or portrait format\n- Visual storytelling\n- Hook in first line\n- Max 2200 characters',
      twitter: '- Concise and punchy\n- Under 280 characters\n- Thread-friendly',
      linkedin: '- Professional tone\n- Thought leadership\n- Max 3000 characters',
      tiktok: '- Short and catchy\n- Video script format\n- Hook in first 3 seconds',
    };
    return instructions[platform] || '';
  }

  private getToneInstructions(tone: string): string {
    const instructions: Record<string, string> = {
      professional: 'Formal, authoritative, credible',
      casual: 'Friendly, conversational, relatable',
      funny: 'Humorous, witty, entertaining',
      inspirational: 'Motivational, uplifting, empowering',
    };
    return instructions[tone] || '';
  }

  private getLengthInstructions(length: string): string {
    const instructions: Record<string, string> = {
      short: '50-100 words',
      medium: '100-300 words',
      long: '300-500 words',
    };
    return instructions[length] || '';
  }

  private parseResponse(response: string, request: ContentRequest): GeneratedContent {
    let text = response.trim();
    let hashtags: string[] = [];

    // Extract hashtags if present
    if (request.includeHashtags) {
      const hashtagMatches = text.match(/#\w+/g);
      if (hashtagMatches) {
        hashtags = hashtagMatches;
        // Remove hashtags from main text
        text = text.replace(/#\w+/g, '').trim();
      }
    }

    // Optimize for platform
    text = this.optimizeForPlatform(text, request.platform!);

    return {
      text,
      hashtags,
      platform: request.platform!,
      metadata: {
        wordCount: text.split(' ').length,
        characterCount: text.length,
      },
    };
  }
}
