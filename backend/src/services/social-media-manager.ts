// ============================================================================
// RAGS AI - Social Media Manager (Phase 5)
// ============================================================================

import axios from 'axios';
import { ContentGenerator, GeneratedContent } from './content-generator';

export interface SocialPost {
  id: string;
  platform: 'instagram' | 'twitter' | 'linkedin' | 'tiktok';
  content: string;
  mediaUrl?: string;
  scheduledFor?: Date;
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  publishedAt?: Date;
  analytics?: PostAnalytics;
}

export interface PostAnalytics {
  likes: number;
  comments: number;
  shares: number;
  views: number;
  engagement: number; // percentage
}

export class SocialMediaManager {
  private instagramToken?: string;
  private twitterToken?: string;
  private linkedinToken?: string;
  private contentGenerator: ContentGenerator;

  constructor(contentGenerator: ContentGenerator, tokens?: {
    instagram?: string;
    twitter?: string;
    linkedin?: string;
  }) {
    this.contentGenerator = contentGenerator;
    this.instagramToken = tokens?.instagram;
    this.twitterToken = tokens?.twitter;
    this.linkedinToken = tokens?.linkedin;
  }

  /**
   * Post to Instagram
   */
  async postToInstagram(content: string, imageUrl: string): Promise<SocialPost> {
    if (!this.instagramToken) {
      throw new Error('Instagram access token not configured');
    }

    console.log('📸 Posting to Instagram...');

    try {
      // Step 1: Create media container
      const containerResponse = await axios.post(
        `https://graph.instagram.com/v18.0/me/media`,
        {
          image_url: imageUrl,
          caption: content,
          access_token: this.instagramToken,
        }
      );

      const containerId = containerResponse.data.id;

      // Step 2: Publish media
      const publishResponse = await axios.post(
        `https://graph.instagram.com/v18.0/me/media_publish`,
        {
          creation_id: containerId,
          access_token: this.instagramToken,
        }
      );

      const post: SocialPost = {
        id: publishResponse.data.id,
        platform: 'instagram',
        content,
        mediaUrl: imageUrl,
        status: 'published',
        publishedAt: new Date(),
      };

      console.log('✅ Posted to Instagram:', post.id);
      return post;
    } catch (error: any) {
      console.error('❌ Instagram post failed:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Post to Twitter
   */
  async postToTwitter(content: string, mediaUrl?: string): Promise<SocialPost> {
    if (!this.twitterToken) {
      throw new Error('Twitter access token not configured');
    }

    console.log('🐦 Posting to Twitter...');

    try {
      const response = await axios.post(
        'https://api.twitter.com/2/tweets',
        {
          text: content,
          // media: mediaUrl ? { media_ids: [mediaId] } : undefined,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.twitterToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const post: SocialPost = {
        id: response.data.data.id,
        platform: 'twitter',
        content,
        mediaUrl,
        status: 'published',
        publishedAt: new Date(),
      };

      console.log('✅ Posted to Twitter:', post.id);
      return post;
    } catch (error: any) {
      console.error('❌ Twitter post failed:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Post to LinkedIn
   */
  async postToLinkedIn(content: string, mediaUrl?: string): Promise<SocialPost> {
    if (!this.linkedinToken) {
      throw new Error('LinkedIn access token not configured');
    }

    console.log('💼 Posting to LinkedIn...');

    try {
      // Get user ID first
      const meResponse = await axios.get('https://api.linkedin.com/v2/me', {
        headers: {
          'Authorization': `Bearer ${this.linkedinToken}`,
        },
      });

      const userId = meResponse.data.id;

      // Create post
      const response = await axios.post(
        'https://api.linkedin.com/v2/ugcPosts',
        {
          author: `urn:li:person:${userId}`,
          lifecycleState: 'PUBLISHED',
          specificContent: {
            'com.linkedin.ugc.ShareContent': {
              shareCommentary: {
                text: content,
              },
              shareMediaCategory: 'NONE',
            },
          },
          visibility: {
            'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
          },
        },
        {
          headers: {
            'Authorization': `Bearer ${this.linkedinToken}`,
            'Content-Type': 'application/json',
            'X-Restli-Protocol-Version': '2.0.0',
          },
        }
      );

      const post: SocialPost = {
        id: response.data.id,
        platform: 'linkedin',
        content,
        mediaUrl,
        status: 'published',
        publishedAt: new Date(),
      };

      console.log('✅ Posted to LinkedIn:', post.id);
      return post;
    } catch (error: any) {
      console.error('❌ LinkedIn post failed:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Auto-post content with AI generation
   */
  async autoPost(topic: string, platforms: string[] = ['instagram']): Promise<SocialPost[]> {
    console.log(`🤖 Auto-posting about "${topic}" to ${platforms.join(', ')}`);

    const posts: SocialPost[] = [];

    for (const platform of platforms) {
      try {
        // Generate content for platform
        let content: GeneratedContent;

        switch (platform) {
          case 'instagram':
            content = await this.contentGenerator.generateInstagramPost(topic);
            // Generate image
            const imageUrl = await this.contentGenerator.generateImage(
              `${topic} - Instagram post visual`
            );
            const instaPost = await this.postToInstagram(content.text, imageUrl);
            posts.push(instaPost);
            break;

          case 'twitter':
            const tweets = await this.contentGenerator.generateTwitterThread(topic, 1);
            if (tweets.length > 0) {
              const twitterPost = await this.postToTwitter(tweets[0].text);
              posts.push(twitterPost);
            }
            break;

          case 'linkedin':
            content = await this.contentGenerator.generateLinkedInPost(topic);
            const linkedinPost = await this.postToLinkedIn(content.text);
            posts.push(linkedinPost);
            break;
        }

        console.log(`✅ Posted to ${platform}`);
      } catch (error: any) {
        console.error(`❌ Failed to post to ${platform}:`, error.message);
      }
    }

    return posts;
  }

  /**
   * Get Instagram analytics
   */
  async getInstagramAnalytics(postId: string): Promise<PostAnalytics> {
    if (!this.instagramToken) {
      throw new Error('Instagram access token not configured');
    }

    try {
      const response = await axios.get(
        `https://graph.instagram.com/v18.0/${postId}/insights`,
        {
          params: {
            metric: 'engagement,impressions,reach,likes,comments,shares',
            access_token: this.instagramToken,
          },
        }
      );

      const data = response.data.data;

      return {
        likes: data.find((d: any) => d.name === 'likes')?.values[0]?.value || 0,
        comments: data.find((d: any) => d.name === 'comments')?.values[0]?.value || 0,
        shares: data.find((d: any) => d.name === 'shares')?.values[0]?.value || 0,
        views: data.find((d: any) => d.name === 'impressions')?.values[0]?.value || 0,
        engagement: data.find((d: any) => d.name === 'engagement')?.values[0]?.value || 0,
      };
    } catch (error: any) {
      console.error('❌ Failed to get Instagram analytics:', error.message);
      throw error;
    }
  }

  /**
   * Schedule post for later
   */
  schedulePost(post: SocialPost, scheduledFor: Date): SocialPost {
    post.scheduledFor = scheduledFor;
    post.status = 'scheduled';

    // In real implementation, this would save to database
    // and use a job queue (like BullMQ) to publish at scheduled time

    console.log(`📅 Post scheduled for ${scheduledFor.toLocaleString()}`);
    return post;
  }

  /**
   * Get content calendar
   */
  getContentCalendar(startDate: Date, endDate: Date): SocialPost[] {
    // In real implementation, this would query database
    // for scheduled posts in date range
    return [];
  }

  /**
   * Generate content calendar for week
   */
  async generateWeeklyCalendar(topics: string[]): Promise<SocialPost[]> {
    console.log('📅 Generating weekly content calendar...');

    const calendar: SocialPost[] = [];
    const now = new Date();

    for (let i = 0; i < topics.length; i++) {
      const topic = topics[i];
      const scheduledDate = new Date(now.getTime() + i * 24 * 60 * 60 * 1000); // Each day

      // Generate content
      const content = await this.contentGenerator.generateInstagramPost(topic);

      const post: SocialPost = {
        id: `scheduled_${Date.now()}_${i}`,
        platform: 'instagram',
        content: content.text,
        scheduledFor: scheduledDate,
        status: 'draft',
      };

      calendar.push(post);
    }

    console.log(`✅ Generated ${calendar.length} posts for the week`);
    return calendar;
  }

  /**
   * Analyze best posting times
   */
  async analyzeBestPostingTimes(platform: string): Promise<{ hour: number; day: string }[]> {
    // In real implementation, this would analyze historical data
    // and return optimal posting times based on engagement

    const defaultTimes = {
      instagram: [
        { hour: 11, day: 'Monday' },
        { hour: 14, day: 'Wednesday' },
        { hour: 18, day: 'Friday' },
      ],
      twitter: [
        { hour: 9, day: 'Monday' },
        { hour: 12, day: 'Tuesday' },
        { hour: 17, day: 'Thursday' },
      ],
      linkedin: [
        { hour: 8, day: 'Tuesday' },
        { hour: 12, day: 'Wednesday' },
        { hour: 17, day: 'Thursday' },
      ],
    };

    return (defaultTimes as any)[platform] || [];
  }

  /**
   * Get engagement rate
   */
  calculateEngagementRate(analytics: PostAnalytics): number {
    if (analytics.views === 0) return 0;
    
    const totalEngagement = analytics.likes + analytics.comments + analytics.shares;
    return (totalEngagement / analytics.views) * 100;
  }
}
