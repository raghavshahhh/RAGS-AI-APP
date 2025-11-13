/**
 * Browser Automation Service - Controls external browsers
 * Uses Puppeteer to control Chrome/Chromium
 * DOES NOT break existing functionality
 */

import puppeteer, { Browser, Page } from 'puppeteer';

export class BrowserAutomation {
  private browser: Browser | null = null;
  private activePage: Page | null = null;
  private isEnabled: boolean = false;

  constructor() {
    console.log('🌐 Browser Automation initialized (not started)');
  }

  /**
   * Initialize browser automation (optional)
   */
  async initialize(): Promise<void> {
    try {
      console.log('🚀 Starting browser automation...');
      
      // Launch browser in background
      this.browser = await puppeteer.launch({
        headless: false, // Show browser window
        defaultViewport: null,
        args: [
          '--start-maximized',
          '--disable-blink-features=AutomationControlled'
        ]
      });

      console.log('✅ Browser automation ready');
      this.isEnabled = true;
    } catch (error) {
      console.warn('⚠️ Browser automation not available:', error);
      this.isEnabled = false;
    }
  }

  /**
   * Check if automation is available
   */
  isAvailable(): boolean {
    return this.isEnabled && this.browser !== null;
  }

  /**
   * Get or create active page
   */
  private async getActivePage(): Promise<Page> {
    if (!this.browser) {
      throw new Error('Browser not initialized');
    }

    // Get existing page or create new one
    const pages = await this.browser.pages();
    if (pages.length > 0) {
      this.activePage = pages[pages.length - 1]; // Use last active page
    } else {
      this.activePage = await this.browser.newPage();
    }

    return this.activePage;
  }

  /**
   * Navigate to URL
   */
  async navigate(url: string): Promise<void> {
    const page = await this.getActivePage();
    await page.goto(url, { waitUntil: 'networkidle2' });
    console.log(`📄 Navigated to: ${url}`);
  }

  /**
   * Scroll page
   */
  async scroll(direction: 'up' | 'down', amount: number = 500): Promise<void> {
    const page = await this.getActivePage();
    
    if (direction === 'down') {
      await page.evaluate((amt) => {
        window.scrollBy({ top: amt, behavior: 'smooth' });
      }, amount);
      console.log(`📜 Scrolled down ${amount}px`);
    } else {
      await page.evaluate((amt) => {
        window.scrollBy({ top: -amt, behavior: 'smooth' });
      }, amount);
      console.log(`📜 Scrolled up ${amount}px`);
    }
  }

  /**
   * Select Nth option/result on page
   * UNIVERSAL - Works on ANY website!
   */
  async selectOption(optionNumber: number): Promise<void> {
    const page = await this.getActivePage();
    const url = page.url();
    
    console.log(`🎯 Selecting option ${optionNumber} on ${url}`);

    // Try multiple strategies to find the Nth clickable element
    const clicked = await page.evaluate((n) => {
      // Strategy 1: Try site-specific patterns first
      let elements: Element[] = [];
      
      // YouTube
      if (window.location.href.includes('youtube.com/results')) {
        elements = Array.from(document.querySelectorAll('ytd-video-renderer a#video-title'));
      }
      // YouTube homepage
      else if (window.location.href.includes('youtube.com') && !window.location.href.includes('watch')) {
        elements = Array.from(document.querySelectorAll('ytd-rich-item-renderer a#video-title-link, ytd-grid-video-renderer a#video-title'));
      }
      // Google search
      else if (window.location.href.includes('google.com/search')) {
        elements = Array.from(document.querySelectorAll('div.g a[href], div.Gx5Zad a[href]'));
      }
      // Strategy 2: Generic - find ALL clickable elements
      else {
        // Get all potentially clickable elements
        const candidates = [
          ...Array.from(document.querySelectorAll('a[href]')),
          ...Array.from(document.querySelectorAll('button')),
          ...Array.from(document.querySelectorAll('[role="button"]')),
          ...Array.from(document.querySelectorAll('[onclick]')),
          ...Array.from(document.querySelectorAll('.btn, .button')),
          ...Array.from(document.querySelectorAll('[class*="link"]')),
          ...Array.from(document.querySelectorAll('[class*="item"]'))
        ];
        
        // Filter visible and clickable elements
        elements = candidates.filter(el => {
          const htmlEl = el as HTMLElement;
          const rect = htmlEl.getBoundingClientRect();
          const style = window.getComputedStyle(htmlEl);
          
          return (
            rect.width > 0 &&
            rect.height > 0 &&
            style.display !== 'none' &&
            style.visibility !== 'hidden' &&
            style.opacity !== '0' &&
            rect.top >= 0 &&
            rect.top < window.innerHeight
          );
        });
      }
      
      // Remove duplicates
      elements = Array.from(new Set(elements));
      
      // Click the Nth element
      if (elements[n - 1]) {
        const target = elements[n - 1] as HTMLElement;
        
        // Scroll into view first
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Wait a bit for scroll
        setTimeout(() => {
          target.click();
        }, 300);
        
        return true;
      }
      
      return false;
    }, optionNumber);

    if (clicked) {
      // Wait for navigation/action
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log(`✅ Clicked option #${optionNumber} (universal)`);
    } else {
      throw new Error(`Could not find option #${optionNumber} on this page`);
    }
  }

  /**
   * Click element by text or selector
   * UNIVERSAL - Works on ANY website!
   */
  async clickElement(target: string): Promise<void> {
    const page = await this.getActivePage();
    
    console.log(`🖱️ Clicking: ${target}`);

    try {
      // Try multiple strategies to find and click the element
      const clicked = await page.evaluate((text) => {
        const searchText = text.toLowerCase().trim();
        
        // Strategy 1: Exact text match in common clickable elements
        const selectors = [
          'a', 'button', 
          '[role="button"]', '[role="link"]',
          'input[type="button"]', 'input[type="submit"]',
          '.btn', '.button', '[class*="btn"]',
          'div[onclick]', 'span[onclick]',
          '[class*="click"]', '[class*="link"]'
        ];
        
        for (const selector of selectors) {
          const elements = Array.from(document.querySelectorAll(selector));
          
          for (const el of elements) {
            const htmlEl = el as HTMLElement;
            const elText = (htmlEl.textContent || htmlEl.getAttribute('aria-label') || '').toLowerCase();
            
            if (elText.includes(searchText)) {
              // Check if visible
              const rect = htmlEl.getBoundingClientRect();
              const style = window.getComputedStyle(htmlEl);
              
              if (rect.width > 0 && rect.height > 0 && 
                  style.display !== 'none' && 
                  style.visibility !== 'hidden') {
                
                // Scroll into view and click
                htmlEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                
                setTimeout(() => {
                  htmlEl.click();
                }, 300);
                
                return true;
              }
            }
          }
        }
        
        // Strategy 2: Try aria-label
        const ariaElements = Array.from(document.querySelectorAll('[aria-label]'));
        for (const el of ariaElements) {
          const label = (el.getAttribute('aria-label') || '').toLowerCase();
          if (label.includes(searchText)) {
            const htmlEl = el as HTMLElement;
            htmlEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setTimeout(() => htmlEl.click(), 300);
            return true;
          }
        }
        
        // Strategy 3: Try placeholder text (for inputs)
        const inputs = Array.from(document.querySelectorAll('input, textarea'));
        for (const input of inputs) {
          const placeholder = (input.getAttribute('placeholder') || '').toLowerCase();
          if (placeholder.includes(searchText)) {
            const htmlEl = input as HTMLElement;
            htmlEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setTimeout(() => htmlEl.click(), 300);
            return true;
          }
        }
        
        return false;
      }, target);

      if (clicked) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log(`✅ Clicked: ${target} (universal)`);
        return;
      }

      // Strategy 4: Try as CSS selector (advanced users)
      try {
        await page.click(target);
        console.log(`✅ Clicked selector: ${target}`);
        return;
      } catch (e) {
        // Selector didn't work
      }

      throw new Error(`Could not find clickable element: "${target}"`);
    } catch (error: any) {
      throw new Error(`Could not click: ${target} - ${error.message}`);
    }
  }

  /**
   * Type text into input field
   */
  async typeText(text: string, selector?: string): Promise<void> {
    const page = await this.getActivePage();
    
    if (selector) {
      await page.type(selector, text);
    } else {
      // Find first visible input
      await page.evaluate((txt) => {
        const input = document.querySelector('input[type="text"], input[type="search"], textarea') as HTMLInputElement;
        if (input) {
          input.value = txt;
          input.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }, text);
    }
    
    console.log(`⌨️ Typed: ${text}`);
  }

  /**
   * Capture screenshot of current page
   */
  async captureScreenshot(): Promise<Buffer> {
    const page = await this.getActivePage();
    const screenshot = await page.screenshot({ fullPage: false });
    console.log('📸 Screenshot captured');
    return screenshot as Buffer;
  }

  /**
   * Get page content/text
   */
  async getPageContent(): Promise<string> {
    const page = await this.getActivePage();
    const content = await page.evaluate(() => document.body.innerText);
    return content;
  }

  /**
   * Close browser
   */
  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.activePage = null;
      this.isEnabled = false;
      console.log('🔒 Browser automation closed');
    }
  }
}

// Export singleton instance
export const browserAutomation = new BrowserAutomation();
