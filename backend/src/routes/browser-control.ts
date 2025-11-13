/**
 * Browser Control API Routes
 * NEW - Does not affect existing routes
 */

import { Router } from 'express';
import { browserAutomation } from '../services/browser-automation';

const router = Router();

/**
 * Initialize browser automation
 */
router.post('/initialize', async (req, res) => {
  try {
    await browserAutomation.initialize();
    
    res.json({
      success: true,
      message: 'Browser automation initialized',
      available: browserAutomation.isAvailable()
    });
  } catch (error: any) {
    console.error('Browser automation init failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      hint: 'Puppeteer might not be installed'
    });
  }
});

/**
 * Check browser automation status
 */
router.get('/status', (req, res) => {
  res.json({
    success: true,
    available: browserAutomation.isAvailable(),
    message: browserAutomation.isAvailable() 
      ? 'Browser automation is active' 
      : 'Browser automation not started'
  });
});

/**
 * Navigate to URL
 */
router.post('/navigate', async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'url is required' });
    }

    if (!browserAutomation.isAvailable()) {
      return res.status(503).json({ 
        error: 'Browser automation not available',
        hint: 'Call /initialize first'
      });
    }

    await browserAutomation.navigate(url);
    
    res.json({
      success: true,
      message: `Navigated to ${url}`
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Scroll page
 */
router.post('/scroll', async (req, res) => {
  try {
    const { direction, amount } = req.body;
    
    if (!browserAutomation.isAvailable()) {
      return res.status(503).json({ 
        error: 'Browser automation not available'
      });
    }

    await browserAutomation.scroll(direction || 'down', amount || 500);
    
    res.json({
      success: true,
      message: `Scrolled ${direction || 'down'}`
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Select Nth option on page
 */
router.post('/select-option', async (req, res) => {
  try {
    const { optionNumber } = req.body;
    
    if (!optionNumber) {
      return res.status(400).json({ error: 'optionNumber is required' });
    }

    if (!browserAutomation.isAvailable()) {
      return res.status(503).json({ 
        error: 'Browser automation not available'
      });
    }

    await browserAutomation.selectOption(optionNumber);
    
    res.json({
      success: true,
      message: `Selected option ${optionNumber}`
    });
  } catch (error: any) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

/**
 * Click element by text or selector
 */
router.post('/click', async (req, res) => {
  try {
    const { target } = req.body;
    
    if (!target) {
      return res.status(400).json({ error: 'target is required' });
    }

    if (!browserAutomation.isAvailable()) {
      return res.status(503).json({ 
        error: 'Browser automation not available'
      });
    }

    await browserAutomation.clickElement(target);
    
    res.json({
      success: true,
      message: `Clicked ${target}`
    });
  } catch (error: any) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

/**
 * Type text
 */
router.post('/type', async (req, res) => {
  try {
    const { text, selector } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'text is required' });
    }

    if (!browserAutomation.isAvailable()) {
      return res.status(503).json({ 
        error: 'Browser automation not available'
      });
    }

    await browserAutomation.typeText(text, selector);
    
    res.json({
      success: true,
      message: `Typed: ${text}`
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Capture screenshot
 */
router.get('/screenshot', async (req, res) => {
  try {
    if (!browserAutomation.isAvailable()) {
      return res.status(503).json({ 
        error: 'Browser automation not available'
      });
    }

    const screenshot = await browserAutomation.captureScreenshot();
    
    res.contentType('image/png');
    res.send(screenshot);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get page content
 */
router.get('/content', async (req, res) => {
  try {
    if (!browserAutomation.isAvailable()) {
      return res.status(503).json({ 
        error: 'Browser automation not available'
      });
    }

    const content = await browserAutomation.getPageContent();
    
    res.json({
      success: true,
      content
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
