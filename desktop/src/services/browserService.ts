/**
 * Browser Control Service - Connect to Backend API
 */

const API_BASE = 'http://localhost:3000/api/browser-control';

export const browserService = {
  /**
   * Initialize browser automation
   */
  async initialize(): Promise<{ success: boolean; available: boolean }> {
    try {
      const response = await fetch(`${API_BASE}/initialize`, {
        method: 'POST'
      });
      return await response.json();
    } catch (error) {
      return { success: false, available: false };
    }
  },

  /**
   * Get status
   */
  async getStatus(): Promise<{ success: boolean; available: boolean }> {
    try {
      const response = await fetch(`${API_BASE}/status`);
      return await response.json();
    } catch (error) {
      return { success: false, available: false };
    }
  },

  /**
   * Navigate to URL
   */
  async navigate(url: string): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await fetch(`${API_BASE}/navigate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      return await response.json();
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  },

  /**
   * Scroll page
   */
  async scroll(direction: 'up' | 'down', amount: number = 500): Promise<{ success: boolean }> {
    try {
      const response = await fetch(`${API_BASE}/scroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ direction, amount })
      });
      return await response.json();
    } catch (error) {
      return { success: false };
    }
  },

  /**
   * Click element
   */
  async click(target: string): Promise<{ success: boolean }> {
    try {
      const response = await fetch(`${API_BASE}/click`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target })
      });
      return await response.json();
    } catch (error) {
      return { success: false };
    }
  },

  /**
   * Type text
   */
  async type(text: string, selector?: string): Promise<{ success: boolean }> {
    try {
      const response = await fetch(`${API_BASE}/type`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, selector })
      });
      return await response.json();
    } catch (error) {
      return { success: false };
    }
  },

  /**
   * Select option
   */
  async selectOption(optionNumber: number): Promise<{ success: boolean }> {
    try {
      const response = await fetch(`${API_BASE}/select-option`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ optionNumber })
      });
      return await response.json();
    } catch (error) {
      return { success: false };
    }
  },

  /**
   * Capture screenshot
   */
  async screenshot(): Promise<Blob | null> {
    try {
      const response = await fetch(`${API_BASE}/screenshot`);
      if (response.ok) {
        return await response.blob();
      }
      return null;
    } catch (error) {
      return null;
    }
  },

  /**
   * Get page content
   */
  async getContent(): Promise<{ success: boolean; content?: any }> {
    try {
      const response = await fetch(`${API_BASE}/content`);
      return await response.json();
    } catch (error) {
      return { success: false };
    }
  }
};
