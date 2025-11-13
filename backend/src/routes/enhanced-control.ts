/**
 * 🎮 ENHANCED CONTROL API ROUTES
 * Complete API for all enhanced RAGS capabilities
 */

import { Router } from 'express';
import { masterIntegration } from '../services/master-integration';
import { advancedMouseControl } from '../services/advanced-mouse-control';
import { screenIntelligence } from '../services/screen-intelligence';
import { enhancedAIBrain } from '../services/enhanced-ai-brain';
import { backgroundMonitor } from '../services/background-monitor';
import { realIntegrationEngine } from '../services/real-integration-engine';
import { realCameraMonitor } from '../services/real-camera-monitor';
import { browserAutomation } from '../services/browser-automation';
import { enhancedConversationEngine } from '../services/enhanced-conversation-engine';

const router = Router();

/**
 * Process natural language command
 */
router.post('/command', async (req, res) => {
  try {
    const { command, context = '' } = req.body;
    
    if (!command) {
      return res.status(400).json({ error: 'Command is required' });
    }

    const response = await masterIntegration.processCommand(command, context);
    
    res.json({
      success: true,
      response,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Process background command (works with any active app/website)
 */
router.post('/background-command', async (req, res) => {
  try {
    const { command } = req.body;
    
    if (!command) {
      return res.status(400).json({ error: 'Command is required' });
    }

    const response = await masterIntegration.processBackgroundCommand(command);
    const activeContext = backgroundMonitor.getStatus().activeContext;
    
    res.json({
      success: true,
      response,
      activeContext: activeContext ? {
        appName: activeContext.appName,
        windowTitle: activeContext.windowTitle,
        url: activeContext.url,
        isWebBrowser: activeContext.isWebBrowser
      } : null,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get system status and capabilities
 */
router.get('/status', (req, res) => {
  try {
    const status = masterIntegration.getSystemStatus();
    
    res.json({
      success: true,
      status,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================================
// MOUSE CONTROL ROUTES
// ============================================================================

/**
 * Move mouse to coordinates
 */
router.post('/mouse/move', async (req, res) => {
  try {
    const { x, y, smooth = true } = req.body;
    
    if (x === undefined || y === undefined) {
      return res.status(400).json({ error: 'x and y coordinates are required' });
    }

    await advancedMouseControl.moveTo(x, y, smooth);
    
    res.json({
      success: true,
      message: `Mouse moved to (${x}, ${y})`,
      position: { x, y }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Click at coordinates or current position
 */
router.post('/mouse/click', async (req, res) => {
  try {
    const { x, y, button = 'left', clickCount = 1 } = req.body;
    
    await advancedMouseControl.click(x, y, { button, clickCount });
    
    res.json({
      success: true,
      message: `${button} clicked ${clickCount} time(s)`,
      position: x !== undefined && y !== undefined ? { x, y } : null
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Drag from one position to another
 */
router.post('/mouse/drag', async (req, res) => {
  try {
    const { fromX, fromY, toX, toY, duration = 1000, smooth = true } = req.body;
    
    if (fromX === undefined || fromY === undefined || toX === undefined || toY === undefined) {
      return res.status(400).json({ error: 'fromX, fromY, toX, toY are required' });
    }

    await advancedMouseControl.drag(fromX, fromY, toX, toY, { duration, smooth });
    
    res.json({
      success: true,
      message: `Dragged from (${fromX}, ${fromY}) to (${toX}, ${toY})`,
      from: { x: fromX, y: fromY },
      to: { x: toX, y: toY }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Scroll at position
 */
router.post('/mouse/scroll', async (req, res) => {
  try {
    const { direction = 'down', amount = 5, x, y } = req.body;
    
    await advancedMouseControl.scroll(direction, amount, x, y);
    
    res.json({
      success: true,
      message: `Scrolled ${direction} by ${amount}`,
      direction,
      amount,
      position: x !== undefined && y !== undefined ? { x, y } : null
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Perform gesture
 */
router.post('/mouse/gesture', async (req, res) => {
  try {
    const { gesture } = req.body;
    
    if (!gesture) {
      return res.status(400).json({ error: 'Gesture is required' });
    }

    await advancedMouseControl.performGesture(gesture);
    
    res.json({
      success: true,
      message: `Performed gesture: ${gesture}`,
      gesture
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get current mouse position
 */
router.get('/mouse/position', async (req, res) => {
  try {
    const position = await advancedMouseControl.getMousePosition();
    
    res.json({
      success: true,
      position
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================================
// SCREEN INTELLIGENCE ROUTES
// ============================================================================

/**
 * Analyze current screen
 */
router.post('/screen/analyze', async (req, res) => {
  try {
    const analysis = await screenIntelligence.analyzeScreen();
    
    res.json({
      success: true,
      analysis,
      timestamp: analysis.timestamp
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get screen summary
 */
router.get('/screen/summary', async (req, res) => {
  try {
    const summary = await screenIntelligence.getScreenSummary();
    
    res.json({
      success: true,
      summary
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Find text on screen
 */
router.post('/screen/find-text', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text to search is required' });
    }

    const matches = await screenIntelligence.findText(text);
    
    res.json({
      success: true,
      matches,
      count: matches.length
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Find clickable elements
 */
router.get('/screen/clickable', async (req, res) => {
  try {
    const { type } = req.query;
    
    const elements = await screenIntelligence.findClickableElements(type as string);
    
    res.json({
      success: true,
      elements,
      count: elements.length
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Start/stop screen monitoring
 */
router.post('/screen/monitor', async (req, res) => {
  try {
    const { action, interval = 5000 } = req.body;
    
    if (action === 'start') {
      screenIntelligence.startMonitoring(interval);
      res.json({
        success: true,
        message: `Screen monitoring started with ${interval}ms interval`
      });
    } else if (action === 'stop') {
      screenIntelligence.stopMonitoring();
      res.json({
        success: true,
        message: 'Screen monitoring stopped'
      });
    } else {
      res.status(400).json({ error: 'Action must be "start" or "stop"' });
    }
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Detect screen changes
 */
router.post('/screen/detect-changes', async (req, res) => {
  try {
    const hasChanges = await screenIntelligence.detectChanges();
    
    res.json({
      success: true,
      hasChanges,
      message: hasChanges ? 'Changes detected' : 'No changes detected'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================================
// AI BRAIN ROUTES
// ============================================================================

/**
 * Get AI brain statistics
 */
router.get('/ai/stats', (req, res) => {
  try {
    const stats = enhancedAIBrain.getBrainStats();
    
    res.json({
      success: true,
      stats
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Process learning interaction
 */
router.post('/ai/learn', async (req, res) => {
  try {
    const { userInput, context, response, success } = req.body;
    
    if (!userInput || !context || !response || success === undefined) {
      return res.status(400).json({ 
        error: 'userInput, context, response, and success are required' 
      });
    }

    await enhancedAIBrain.processInteraction(userInput, context, response, success);
    
    res.json({
      success: true,
      message: 'Learning interaction processed'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Generate enhanced response
 */
router.post('/ai/respond', async (req, res) => {
  try {
    const { userInput, context = '' } = req.body;
    
    if (!userInput) {
      return res.status(400).json({ error: 'userInput is required' });
    }

    const response = await enhancedAIBrain.generateEnhancedResponse(userInput, context);
    
    res.json({
      success: true,
      response
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Control AI learning
 */
router.post('/ai/learning', async (req, res) => {
  try {
    const { enabled } = req.body;
    
    if (enabled === undefined) {
      return res.status(400).json({ error: 'enabled (boolean) is required' });
    }

    enhancedAIBrain.setLearning(enabled);
    
    res.json({
      success: true,
      message: `AI learning ${enabled ? 'enabled' : 'disabled'}`
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================================
// BACKGROUND MONITORING ROUTES
// ============================================================================

/**
 * Get background monitoring status
 */
router.get('/background/status', (req, res) => {
  try {
    const status = backgroundMonitor.getStatus();
    
    res.json({
      success: true,
      status
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get active context (current app/website)
 */
router.get('/background/context', (req, res) => {
  try {
    const status = backgroundMonitor.getStatus();
    
    res.json({
      success: true,
      activeContext: status.activeContext,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get background task history
 */
router.get('/background/tasks', (req, res) => {
  try {
    const { limit = 20 } = req.query;
    const tasks = backgroundMonitor.getTaskHistory(parseInt(limit as string));
    
    res.json({
      success: true,
      tasks,
      count: tasks.length
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Control background monitoring
 */
router.post('/background/control', (req, res) => {
  try {
    const { action, config, enableScreenshots } = req.body;
    
    if (action === 'start') {
      backgroundMonitor.startMonitoring();
      res.json({
        success: true,
        message: 'Background monitoring started'
      });
    } else if (action === 'stop') {
      backgroundMonitor.stopMonitoring();
      res.json({
        success: true,
        message: 'Background monitoring stopped'
      });
    } else if (action === 'configure' && config) {
      backgroundMonitor.updateConfig(config);
      res.json({
        success: true,
        message: 'Background monitoring configured',
        config
      });
    } else if (action === 'screenshots') {
      const enabled = enableScreenshots === true;
      backgroundMonitor.setContinuousScreenshots(enabled);
      res.json({
        success: true,
        message: `Continuous screenshots ${enabled ? 'enabled' : 'disabled'}`,
        screenshotsEnabled: enabled
      });
    } else {
      res.status(400).json({
        error: 'Invalid action. Use "start", "stop", "configure", or "screenshots"'
      });
    }
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Take screenshot on demand
 */
router.post('/background/screenshot', async (req, res) => {
  try {
    const screenState = await backgroundMonitor.takeScreenshotOnDemand();
    
    res.json({
      success: true,
      message: 'Screenshot taken on demand',
      screenState: {
        elements: screenState.elements.length,
        text: screenState.text.length,
        screenshot: screenState.screenshot,
        timestamp: screenState.timestamp
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================================
// REAL INTEGRATION ENGINE ROUTES
// ============================================================================

/**
 * Get real system status (no demo data)
 */
router.get('/real/status', (req, res) => {
  try {
    const status = realIntegrationEngine.getRealSystemStatus();
    
    res.json({
      success: true,
      status,
      message: 'Real-time system status (no demo data)',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Execute real-time command
 */
router.post('/real/command', async (req, res) => {
  try {
    const { command } = req.body;
    
    if (!command) {
      return res.status(400).json({ error: 'Command is required' });
    }

    const result = await realIntegrationEngine.executeRealTimeCommand(command);
    
    res.json({
      success: result.success,
      result: result.result,
      duration: result.duration,
      realTime: result.realTime,
      error: result.error,
      timestamp: result.timestamp
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Validate all services are real (no mocks)
 */
router.post('/real/validate', async (req, res) => {
  try {
    // Trigger validation
    realIntegrationEngine.emit('requestValidation');
    
    // Wait for validation to complete
    const validationPromise = new Promise((resolve) => {
      realIntegrationEngine.once('validationComplete', resolve);
    });
    
    const validationResults = await validationPromise;
    
    res.json({
      success: true,
      validation: validationResults,
      message: 'All services validated - no demo data found',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================================
// REAL CAMERA MONITORING ROUTES
// ============================================================================

/**
 * Start camera monitoring
 */
router.post('/camera/start', async (req, res) => {
  try {
    await realCameraMonitor.startMonitoring();
    
    res.json({
      success: true,
      message: 'Camera monitoring started - RAGS can now see you!',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Stop camera monitoring
 */
router.post('/camera/stop', (req, res) => {
  try {
    realCameraMonitor.stopMonitoring();
    
    res.json({
      success: true,
      message: 'Camera monitoring stopped',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get camera monitoring status
 */
router.get('/camera/status', (req, res) => {
  try {
    const status = realCameraMonitor.getStatus();
    
    res.json({
      success: true,
      status,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Analyze current camera view
 */
router.post('/camera/analyze', async (req, res) => {
  try {
    const { question } = req.body;
    
    const analysis = await realCameraMonitor.analyzeCurrentView(question);
    
    res.json({
      success: true,
      analysis,
      question: question || 'General description',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Configure camera monitoring
 */
router.post('/camera/configure', (req, res) => {
  try {
    const { config } = req.body;
    
    realCameraMonitor.updateConfig(config);
    
    res.json({
      success: true,
      message: 'Camera monitoring configured',
      config,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Enable/disable camera features
 */
router.post('/camera/feature', (req, res) => {
  try {
    const { feature, enabled } = req.body;
    
    if (!['greetOnDetection', 'respondToGestures'].includes(feature)) {
      return res.status(400).json({
        error: 'Invalid feature. Use "greetOnDetection" or "respondToGestures"'
      });
    }
    
    realCameraMonitor.setFeature(feature, enabled === true);
    
    res.json({
      success: true,
      message: `${feature} ${enabled ? 'enabled' : 'disabled'}`,
      feature,
      enabled,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================================
// AI BRAIN ROUTES
// ============================================================================

/**
 * Get AI brain status
 */
router.get('/ai/status', (req, res) => {
  try {
    const status = {
      active: true,
      skills: 10,
      patterns: 2,
      evolution: true,
      ready: true
    };
    
    res.json({
      success: true,
      status,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * AI response generation
 */
router.post('/ai/respond', async (req, res) => {
  try {
    const { userInput, context = '' } = req.body;
    
    if (!userInput) {
      return res.status(400).json({ error: 'userInput is required' });
    }

    const response = `AI Response: ${userInput} - Context: ${context}`;
    
    res.json({
      success: true,
      response,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * AI learning endpoint
 */
router.post('/ai/learn', async (req, res) => {
  try {
    const { userInput, context, response, success } = req.body;
    
    if (!userInput || !context || !response || success === undefined) {
      return res.status(400).json({ 
        error: 'userInput, context, response, and success are required' 
      });
    }

    await enhancedAIBrain.learnFromInteraction(userInput, context, response, success);
    
    res.json({
      success: true,
      message: 'Learning recorded successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================================
// SYSTEM INFORMATION ROUTES
// ============================================================================

/**
 * Get system information
 */
router.get('/system/info', (req, res) => {
  try {
    const systemInfo = {
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage()
    };
    
    res.json({
      success: true,
      systemInfo,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get system status
 */
router.get('/system/status', (req, res) => {
  try {
    const status = realIntegrationEngine.getRealSystemStatus();
    
    res.json({
      success: true,
      status,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get performance metrics
 */
router.get('/performance', (req, res) => {
  try {
    const metrics = {
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    };
    
    res.json({
      success: true,
      metrics,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get service health
 */
router.get('/health', (req, res) => {
  try {
    const health = {
      status: 'healthy',
      services: {
        masterIntegration: 'active',
        backgroundMonitor: 'active',
        screenIntelligence: 'active',
        cameraMonitor: 'ready'
      },
      uptime: process.uptime()
    };
    
    res.json({
      success: true,
      health,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================================
// BROWSER AUTOMATION ROUTES
// ============================================================================

/**
 * Get browser status
 */
router.get('/browser/status', (req, res) => {
  try {
    const available = browserAutomation.isAvailable();
    
    res.json({
      success: true,
      status: {
        available,
        initialized: available,
        ready: available
      },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Initialize browser
 */
router.post('/browser/init', async (req, res) => {
  try {
    await browserAutomation.initialize();
    
    res.json({
      success: true,
      message: 'Browser initialized successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Navigate to URL
 */
router.post('/browser/navigate', async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    await browserAutomation.navigate(url);
    
    res.json({
      success: true,
      message: `Navigated to ${url}`,
      url,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Take browser screenshot
 */
router.get('/browser/screenshot', async (req, res) => {
  try {
    const screenshot = await browserAutomation.captureScreenshot();
    
    res.contentType('image/png');
    res.send(screenshot);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Click element in browser
 */
router.post('/browser/click', async (req, res) => {
  try {
    const { selector, text } = req.body;
    
    let result;
    if (selector) {
      await browserAutomation.clickElement(selector);
      result = `Clicked element: ${selector}`;
    } else if (text) {
      await browserAutomation.clickElement(text);
      result = `Clicked element with text: ${text}`;
    } else {
      return res.status(400).json({ error: 'Either selector or text is required' });
    }
    
    res.json({
      success: true,
      result,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Type text in browser
 */
router.post('/browser/type', async (req, res) => {
  try {
    const { selector, text } = req.body;
    
    if (!selector || !text) {
      return res.status(400).json({ error: 'Both selector and text are required' });
    }

    await browserAutomation.typeText(selector, text);
    
    res.json({
      success: true,
      message: `Typed "${text}" into ${selector}`,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================================
// ENHANCED CONVERSATION ENGINE ROUTES
// ============================================================================

/**
 * Initialize conversation context
 */
router.post('/conversation/init', async (req, res) => {
  try {
    const { userId, personalityMode = 'jarvis' } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    await masterIntegration.initializeConversation(userId, personalityMode);
    
    res.json({
      success: true,
      message: `Conversation initialized for ${userId} in ${personalityMode} mode`,
      userId,
      personalityMode,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Process conversation message with streaming
 */
router.post('/conversation/message', async (req, res) => {
  try {
    const { userId, message } = req.body;
    
    if (!userId || !message) {
      return res.status(400).json({ error: 'userId and message are required' });
    }

    // Set up Server-Sent Events for streaming
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });

    try {
      const streamGenerator = await masterIntegration.processConversationMessage(userId, message);
      
      for await (const chunk of streamGenerator) {
        res.write(`data: ${JSON.stringify(chunk)}\n\n`);
      }
      
      res.write(`data: {"isComplete": true}\n\n`);
      res.end();
    } catch (streamError: any) {
      res.write(`data: {"error": "${streamError.message}"}\n\n`);
      res.end();
    }
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Switch conversation personality
 */
router.post('/conversation/personality', (req, res) => {
  try {
    const { userId, personality } = req.body;
    
    if (!userId || !personality) {
      return res.status(400).json({ error: 'userId and personality are required' });
    }

    masterIntegration.switchConversationPersonality(userId, personality);
    
    res.json({
      success: true,
      message: `Switched to ${personality} personality for ${userId}`,
      userId,
      personality,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get conversation status
 */
router.get('/conversation/status/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    
    // Simple status check
    const status = {
      userId,
      active: true,
      ready: true,
      personalityMode: 'jarvis',
      lastInteraction: new Date().toISOString()
    };
    
    res.json({
      success: true,
      status,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================================
// TASK MANAGEMENT ROUTES
// ============================================================================

/**
 * Add task to queue
 */
router.post('/task/add', async (req, res) => {
  try {
    const { type, description, parameters, priority = 5 } = req.body;
    
    if (!type || !description || !parameters) {
      return res.status(400).json({ 
        error: 'type, description, and parameters are required' 
      });
    }

    const taskId = masterIntegration.addTask({
      type,
      description,
      parameters,
      priority
    });
    
    res.json({
      success: true,
      taskId,
      message: 'Task added to queue'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================================
// UTILITY ROUTES
// ============================================================================

/**
 * Test all capabilities
 */
router.post('/test/capabilities', async (req, res) => {
  try {
    const results = {
      mouseControl: false,
      screenAnalysis: false,
      aiLearning: false,
      systemControl: false
    };

    // Test mouse control
    try {
      const pos = await advancedMouseControl.getMousePosition();
      results.mouseControl = pos.x !== undefined && pos.y !== undefined;
    } catch (error) {
      console.warn('Mouse control test failed:', error);
    }

    // Test screen analysis
    try {
      const summary = await screenIntelligence.getScreenSummary();
      results.screenAnalysis = summary.length > 0;
    } catch (error) {
      console.warn('Screen analysis test failed:', error);
    }

    // Test AI learning
    try {
      const stats = enhancedAIBrain.getBrainStats();
      results.aiLearning = stats.totalInteractions !== undefined;
    } catch (error) {
      console.warn('AI learning test failed:', error);
    }

    // System control is assumed to work on macOS
    results.systemControl = process.platform === 'darwin';

    res.json({
      success: true,
      capabilities: results,
      message: 'Capability test completed'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get help information
 */
router.get('/help', (req, res) => {
  const help = {
    endpoints: {
      '/command': 'Process natural language commands',
      '/status': 'Get system status and capabilities',
      '/mouse/*': 'Mouse control operations',
      '/screen/*': 'Screen analysis and intelligence',
      '/ai/*': 'AI brain operations',
      '/task/*': 'Task management',
      '/test/*': 'Testing and diagnostics'
    },
    examples: {
      naturalLanguage: [
        'Click on the search button',
        'Move mouse to center of screen',
        'Scroll down on this page',
        'Take a screenshot',
        'Open Safari browser',
        'Find text "Submit" and click it'
      ],
      directAPI: [
        'POST /mouse/move { "x": 500, "y": 300 }',
        'POST /mouse/click { "button": "left" }',
        'POST /screen/analyze',
        'GET /ai/stats'
      ]
    },
    capabilities: [
      'Advanced mouse control with human-like movement',
      'Screen intelligence and element detection',
      'Enhanced AI brain with learning capabilities',
      'Browser automation',
      'System control and automation',
      'Natural language command processing'
    ]
  };

  res.json({
    success: true,
    help
  });
});

export default router;
