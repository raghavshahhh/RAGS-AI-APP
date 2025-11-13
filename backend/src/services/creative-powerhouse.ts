/**
 * 🎨 CREATIVE POWERHOUSE
 * Content generation, AI art studio, and idea generator
 */

import { EventEmitter } from 'events';
import { OllamaBrain } from './ollama-brain';
import * as fs from 'fs/promises';
import * as path from 'path';

interface ContentRequest {
  type: 'blog' | 'social' | 'youtube' | 'presentation' | 'marketing' | 'code_docs' | 'email' | 'resume';
  topic: string;
  tone?: 'professional' | 'casual' | 'friendly' | 'technical' | 'creative';
  length?: 'short' | 'medium' | 'long';
  additionalContext?: string;
}

interface GeneratedContent {
  id: string;
  type: string;
  content: string;
  metadata: {
    word_count: number;
    estimated_reading_time: number;
    tone: string;
    keywords: string[];
  };
  generated_at: Date;
}

interface IdeaRequest {
  category: string;
  constraints?: string[];
  market?: string;
}

interface GeneratedIdea {
  id: string;
  title: string;
  description: string;
  market_analysis: string;
  competitors: string[];
  monetization: string[];
  validation_score: number; // 0-100
  generated_at: Date;
}

export class CreativePowerhouse extends EventEmitter {
  private brain: OllamaBrain;
  private dataDir: string;
  private contentHistory: GeneratedContent[] = [];
  private ideaHistory: GeneratedIdea[] = [];

  constructor(brain: OllamaBrain, userId: string = 'default') {
    super();
    this.brain = brain;
    this.dataDir = path.join(process.env.HOME || '', '.rags', 'creative', userId);
  }

  /**
   * Initialize Creative Powerhouse
   */
  async initialize(): Promise<void> {
    console.log('🎨 Initializing Creative Powerhouse...');

    await fs.mkdir(this.dataDir, { recursive: true });
    await this.loadHistory();

    console.log('✅ Creative Powerhouse initialized');
  }

  /**
   * Generate content based on type
   */
  async generateContent(request: ContentRequest): Promise<GeneratedContent> {
    console.log(`🎨 Generating ${request.type} content: "${request.topic}"`);

    const prompt = this.buildContentPrompt(request);
    const content = await this.brain.chat(prompt);

    const generated: GeneratedContent = {
      id: `content_${Date.now()}`,
      type: request.type,
      content,
      metadata: {
        word_count: content.split(/\s+/).length,
        estimated_reading_time: Math.ceil(content.split(/\s+/).length / 200),
        tone: request.tone || 'professional',
        keywords: await this.extractKeywords(content)
      },
      generated_at: new Date()
    };

    this.contentHistory.push(generated);
    await this.saveHistory();

    this.emit('content_generated', generated);
    console.log(`✅ ${request.type} content generated (${generated.metadata.word_count} words)`);

    return generated;
  }

  /**
   * Generate blog post (research + write)
   */
  async generateBlogPost(topic: string, tone?: string): Promise<GeneratedContent> {
    console.log(`📝 Generating blog post: "${topic}"`);

    // Research phase
    const researchPrompt = `
Research the topic: "${topic}"

Provide:
1. Key points to cover
2. Interesting facts
3. Common misconceptions
4. Practical examples
5. Latest trends

Format as structured research notes.
`;

    const research = await this.brain.chat(researchPrompt);

    // Writing phase
    const writingPrompt = `
Write a comprehensive blog post about: "${topic}"

Research notes:
${research}

Requirements:
- Engaging introduction
- Clear structure with headings
- Practical examples
- Actionable takeaways
- Strong conclusion
- Tone: ${tone || 'professional'}

Write the complete blog post:
`;

    const content = await this.brain.chat(writingPrompt);

    return await this.generateContent({
      type: 'blog',
      topic,
      tone: tone as any || 'professional',
      length: 'long',
      additionalContext: research
    });
  }

  /**
   * Generate social media content
   */
  async generateSocialMedia(topic: string, platform: 'twitter' | 'instagram' | 'linkedin' | 'facebook'): Promise<any> {
    console.log(`📱 Generating ${platform} content: "${topic}"`);

    const platformGuidelines = {
      twitter: 'Max 280 characters, engaging, include 2-3 hashtags',
      instagram: 'Visual description, emoji-rich, 5-10 hashtags',
      linkedin: 'Professional, insightful, 1-2 relevant hashtags',
      facebook: 'Conversational, engaging, question to encourage comments'
    };

    const prompt = `
Create a ${platform} post about: "${topic}"

Guidelines: ${platformGuidelines[platform]}

Provide:
1. Main caption/text
2. Relevant hashtags (separate line)
3. Suggested posting time
4. Call-to-action

Format clearly with labels.
`;

    const result = await this.brain.chat(prompt);

    return {
      platform,
      content: result,
      topic,
      generated_at: new Date()
    };
  }

  /**
   * Generate YouTube script
   */
  async generateYouTubeScript(topic: string, duration: number = 10): Promise<string> {
    console.log(`🎥 Generating YouTube script: "${topic}" (${duration} minutes)`);

    const prompt = `
Create a YouTube video script for: "${topic}"

Duration: ${duration} minutes (~${duration * 150} words)

Structure:
1. HOOK (0:00-0:15) - Attention grabber
2. INTRO (0:15-0:45) - What viewers will learn
3. MAIN CONTENT - Core information with timestamps
4. EXAMPLES - Practical demonstrations
5. CALL-TO-ACTION - Like, subscribe, comment
6. OUTRO - Summary and next steps

Include:
- Timestamps
- On-screen text suggestions
- B-roll suggestions
- Engagement prompts

Write the complete script:
`;

    return await this.brain.chat(prompt);
  }

  /**
   * Generate presentation (PPT structure)
   */
  async generatePresentation(topic: string, slides: number = 10): Promise<any> {
    console.log(`📊 Generating presentation: "${topic}" (${slides} slides)`);

    const prompt = `
Create a presentation outline for: "${topic}"

Number of slides: ${slides}

For each slide provide:
1. Slide number and title
2. Key points (bullet points)
3. Visual suggestions (images/charts)
4. Speaker notes

Format:
SLIDE 1: [Title]
- Point 1
- Point 2
Visual: [Suggestion]
Notes: [Speaker notes]

Create all ${slides} slides:
`;

    const outline = await this.brain.chat(prompt);

    return {
      topic,
      slides: slides,
      outline,
      format: 'ppt',
      generated_at: new Date()
    };
  }

  /**
   * Generate marketing copy
   */
  async generateMarketingCopy(product: string, type: 'landing' | 'ad' | 'email'): Promise<string> {
    console.log(`📢 Generating ${type} copy for: "${product}"`);

    const prompts = {
      landing: `
Create a landing page copy for: "${product}"

Include:
1. Headline (attention-grabbing)
2. Subheadline (benefits)
3. Features section
4. Social proof section
5. Call-to-action
6. FAQ section

Use persuasive copywriting techniques.
`,
      ad: `
Create ad copy for: "${product}"

Variations:
1. Facebook Ad (125 characters)
2. Google Ad (90 characters)
3. Instagram Ad (150 characters with emojis)

Each should have:
- Compelling hook
- Clear benefit
- Strong CTA
`,
      email: `
Create email marketing copy for: "${product}"

Include:
1. Subject line (compelling)
2. Preview text
3. Email body (conversational)
4. Call-to-action button text
5. PS line (urgency/bonus)

Keep it conversational and engaging.
`
    };

    return await this.brain.chat(prompts[type]);
  }

  /**
   * Generate code documentation
   */
  async generateCodeDocs(code: string, language: string): Promise<string> {
    console.log(`📖 Generating documentation for ${language} code`);

    const prompt = `
Generate comprehensive documentation for this ${language} code:

\`\`\`${language}
${code}
\`\`\`

Include:
1. Overview (what it does)
2. Parameters (with types and descriptions)
3. Return value
4. Usage examples
5. Edge cases
6. Complexity analysis

Format in markdown.
`;

    return await this.brain.chat(prompt);
  }

  /**
   * Generate email template
   */
  async generateEmail(purpose: string, tone: 'formal' | 'casual' | 'friendly'): Promise<string> {
    console.log(`✉️ Generating ${tone} email: "${purpose}"`);

    const prompt = `
Create an email for: "${purpose}"

Tone: ${tone}

Include:
1. Subject line
2. Greeting
3. Body (clear and concise)
4. Call-to-action (if needed)
5. Sign-off

Keep it ${tone} and professional.
`;

    return await this.brain.chat(prompt);
  }

  /**
   * Generate resume/portfolio
   */
  async generateResume(profile: {
    name: string;
    skills: string[];
    experience?: string[];
    education?: string[];
  }): Promise<string> {
    console.log(`📄 Generating resume for: ${profile.name}`);

    const prompt = `
Create a professional resume for:

Name: ${profile.name}
Skills: ${profile.skills.join(', ')}
${profile.experience ? `Experience: ${profile.experience.join(', ')}` : ''}
${profile.education ? `Education: ${profile.education.join(', ')}` : ''}

Format:
1. Professional Summary
2. Core Skills
3. Work Experience (with achievements)
4. Education
5. Projects/Portfolio

Make it ATS-friendly and impactful.
`;

    return await this.brain.chat(prompt);
  }

  /**
   * Generate app ideas with validation
   */
  async generateIdeas(request: IdeaRequest, count: number = 10): Promise<GeneratedIdea[]> {
    console.log(`💡 Generating ${count} ${request.category} ideas`);

    const prompt = `
Generate ${count} innovative app/product ideas in the "${request.category}" category.

${request.constraints ? `Constraints: ${request.constraints.join(', ')}` : ''}
${request.market ? `Target market: ${request.market}` : ''}

For each idea provide:
1. Title (catchy name)
2. Description (2-3 sentences)
3. Target audience
4. Key features (3-5)
5. Monetization potential (0-100 score)

Format as JSON array.
`;

    const response = await this.brain.chat(prompt);

    try {
      const ideas = JSON.parse(response);
      const generatedIdeas: GeneratedIdea[] = [];

      for (const idea of ideas.slice(0, count)) {
        // Validate each idea
        const validated = await this.validateIdea(idea);
        generatedIdeas.push(validated);
      }

      this.ideaHistory.push(...generatedIdeas);
      await this.saveHistory();

      return generatedIdeas;
    } catch (error) {
      console.error('Error parsing ideas:', error);
      return [];
    }
  }

  /**
   * Validate and analyze idea
   */
  private async validateIdea(idea: any): Promise<GeneratedIdea> {
    console.log(`🔍 Validating idea: ${idea.title}`);

    const validationPrompt = `
Analyze this app/product idea:

Title: ${idea.title}
Description: ${idea.description}

Provide:
1. Market analysis (demand, trends)
2. Top 3 competitors
3. Monetization strategies (3 options)
4. Validation score (0-100)

Format as structured analysis.
`;

    const validation = await this.brain.chat(validationPrompt);

    return {
      id: `idea_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: idea.title,
      description: idea.description,
      market_analysis: validation,
      competitors: [], // Would extract from validation
      monetization: [], // Would extract from validation
      validation_score: 75, // Would calculate from analysis
      generated_at: new Date()
    };
  }

  /**
   * AI Art Studio - Image generation placeholder
   */
  async generateImagePrompt(description: string, style?: string): Promise<string> {
    console.log(`🎨 Generating image prompt: "${description}"`);

    const prompt = `
Create a detailed image generation prompt for: "${description}"

${style ? `Style: ${style}` : ''}

The prompt should be:
- Highly detailed
- Include lighting, composition, mood
- Specify art style
- Include quality modifiers

Create an optimized prompt for DALL-E/Midjourney:
`;

    return await this.brain.chat(prompt);
  }

  /**
   * Voice cloning script generator
   */
  async generateVoiceScript(purpose: string, emotion: string, duration: number): Promise<string> {
    console.log(`🎙️ Generating voice script: "${purpose}"`);

    const prompt = `
Create a voice script for: "${purpose}"

Emotion: ${emotion}
Duration: ${duration} seconds (~${duration * 3} words)

Requirements:
- Natural speech patterns
- Emotion markers: [${emotion}]
- Pauses marked with [PAUSE]
- Emphasis marked with *word*

Write the script:
`;

    return await this.brain.chat(prompt);
  }

  /**
   * Get statistics
   */
  getStats(): any {
    return {
      content_generated: this.contentHistory.length,
      ideas_generated: this.ideaHistory.length,
      by_type: this.contentHistory.reduce((acc, c) => {
        acc[c.type] = (acc[c.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      total_words: this.contentHistory.reduce((sum, c) => sum + c.metadata.word_count, 0)
    };
  }

  // Private helper methods

  private buildContentPrompt(request: ContentRequest): string {
    const lengthGuides = {
      short: '~300 words',
      medium: '~800 words',
      long: '~1500 words'
    };

    return `
Create ${request.type} content about: "${request.topic}"

Length: ${lengthGuides[request.length || 'medium']}
Tone: ${request.tone || 'professional'}
${request.additionalContext ? `Context: ${request.additionalContext}` : ''}

Requirements based on type:
${this.getTypeRequirements(request.type)}

Create the content:
`;
  }

  private getTypeRequirements(type: string): string {
    const requirements: Record<string, string> = {
      blog: '- Engaging intro\n- Clear structure\n- SEO-friendly\n- Actionable conclusion',
      social: '- Catchy opening\n- Hashtags\n- Call-to-action\n- Emoji if appropriate',
      youtube: '- Hook in first 15 seconds\n- Clear structure\n- Engagement prompts',
      presentation: '- Slide structure\n- Key points\n- Visual suggestions',
      marketing: '- Benefit-focused\n- Persuasive\n- Clear CTA',
      code_docs: '- Technical accuracy\n- Examples\n- Clear explanations',
      email: '- Clear subject\n- Concise body\n- Professional tone',
      resume: '- ATS-friendly\n- Achievement-focused\n- Clear formatting'
    };

    return requirements[type] || '- High quality\n- Well structured\n- Engaging';
  }

  private async extractKeywords(content: string): Promise<string[]> {
    // Simple keyword extraction (could use NLP)
    const words = content.toLowerCase().split(/\s+/);
    const stopWords = new Set(['the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'but']);
    
    const wordFreq = words
      .filter(w => w.length > 4 && !stopWords.has(w))
      .reduce((acc, word) => {
        acc[word] = (acc[word] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    return Object.entries(wordFreq)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([word]) => word);
  }

  private async loadHistory(): Promise<void> {
    try {
      const dataFile = path.join(this.dataDir, 'creative_history.json');
      const data = await fs.readFile(dataFile, 'utf-8');
      const parsed = JSON.parse(data);

      if (parsed.content) this.contentHistory = parsed.content;
      if (parsed.ideas) this.ideaHistory = parsed.ideas;

      console.log(`📚 Loaded ${this.contentHistory.length} content items, ${this.ideaHistory.length} ideas`);
    } catch (error) {
      console.log('📚 No existing creative history');
    }
  }

  private async saveHistory(): Promise<void> {
    try {
      const dataFile = path.join(this.dataDir, 'creative_history.json');
      await fs.writeFile(dataFile, JSON.stringify({
        content: this.contentHistory.slice(-100), // Keep last 100
        ideas: this.ideaHistory.slice(-50) // Keep last 50
      }, null, 2));
    } catch (error) {
      console.error('Error saving creative history:', error);
    }
  }
}
