/**
 * 🌟 EVOLUTION API ROUTES
 * API endpoints for all self-evolution features
 */

import { Router } from 'express';
import { EvolutionOrchestrator } from '../services/evolution-orchestrator';
import { OllamaBrain } from '../services/ollama-brain';

const router = Router();

// Singleton instance
let evolutionOrchestrator: EvolutionOrchestrator | null = null;

/**
 * Initialize evolution system
 */
router.post('/initialize', async (req, res) => {
  try {
    const { userId } = req.body;

    if (evolutionOrchestrator) {
      return res.json({
        success: true,
        message: 'Evolution system already initialized',
        status: evolutionOrchestrator.getEvolutionStatus()
      });
    }

    // Create Ollama brain
    const brain = new OllamaBrain({
      model: process.env.OLLAMA_MODEL || 'llama3.2:3b',
      temperature: 0.7
    });

    // Create and initialize evolution orchestrator
    evolutionOrchestrator = new EvolutionOrchestrator(brain, userId || 'default');
    await evolutionOrchestrator.initialize();

    res.json({
      success: true,
      message: '🌟 Evolution system initialized!',
      status: evolutionOrchestrator.getEvolutionStatus()
    });
  } catch (error: any) {
    console.error('Evolution initialization error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get evolution status
 */
router.get('/status', (req, res) => {
  if (!evolutionOrchestrator) {
    return res.status(400).json({
      success: false,
      error: 'Evolution system not initialized'
    });
  }

  res.json({
    success: true,
    status: evolutionOrchestrator.getEvolutionStatus()
  });
});

/**
 * Get evolution report
 */
router.get('/report', async (req, res) => {
  try {
    if (!evolutionOrchestrator) {
      return res.status(400).json({
        success: false,
        error: 'Evolution system not initialized'
      });
    }

    const report = await evolutionOrchestrator.generateEvolutionReport();

    res.json({
      success: true,
      report
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Process message with evolution
 */
router.post('/process', async (req, res) => {
  try {
    if (!evolutionOrchestrator) {
      return res.status(400).json({
        success: false,
        error: 'Evolution system not initialized'
      });
    }

    const { message, context } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'message is required'
      });
    }

    const result = await evolutionOrchestrator.processWithEvolution(message, context);

    res.json({
      success: true,
      result
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Record user feedback
 */
router.post('/feedback', async (req, res) => {
  try {
    if (!evolutionOrchestrator) {
      return res.status(400).json({
        success: false,
        error: 'Evolution system not initialized'
      });
    }

    const { responseId, userMessage, aiResponse, rating, correction } = req.body;

    if (!responseId || !userMessage || !aiResponse || rating === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    await evolutionOrchestrator.recordFeedback(
      responseId,
      userMessage,
      aiResponse,
      rating,
      correction
    );

    res.json({
      success: true,
      message: 'Feedback recorded and learning initiated'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Auto-learn from trending topics
 */
router.post('/learn-trending', async (req, res) => {
  try {
    if (!evolutionOrchestrator) {
      return res.status(400).json({
        success: false,
        error: 'Evolution system not initialized'
      });
    }

    // Run in background
    evolutionOrchestrator.autoLearnTrending();

    res.json({
      success: true,
      message: 'Auto-learning from trending topics started'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Create long-term goal
 */
router.post('/goals', async (req, res) => {
  try {
    if (!evolutionOrchestrator) {
      return res.status(400).json({
        success: false,
        error: 'Evolution system not initialized'
      });
    }

    const { title, description, targetDate } = req.body;

    if (!title || !description || !targetDate) {
      return res.status(400).json({
        success: false,
        error: 'title, description, and targetDate are required'
      });
    }

    const goal = await evolutionOrchestrator.createGoal(
      title,
      description,
      new Date(targetDate)
    );

    res.json({
      success: true,
      goal
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get today's tasks
 */
router.get('/tasks/today', (req, res) => {
  try {
    if (!evolutionOrchestrator) {
      return res.status(400).json({
        success: false,
        error: 'Evolution system not initialized'
      });
    }

    const tasks = evolutionOrchestrator.getTodaysTasks();

    res.json({
      success: true,
      tasks
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get morning briefing
 */
router.get('/briefing/morning', async (req, res) => {
  try {
    if (!evolutionOrchestrator) {
      return res.status(400).json({
        success: false,
        error: 'Evolution system not initialized'
      });
    }

    const briefing = await evolutionOrchestrator.getMorningBriefing();

    res.json({
      success: true,
      briefing
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Enable/disable evolution
 */
router.put('/toggle', (req, res) => {
  try {
    if (!evolutionOrchestrator) {
      return res.status(400).json({
        success: false,
        error: 'Evolution system not initialized'
      });
    }

    const { enabled } = req.body;

    if (enabled === undefined) {
      return res.status(400).json({
        success: false,
        error: 'enabled field is required'
      });
    }

    evolutionOrchestrator.setEvolutionEnabled(enabled);

    res.json({
      success: true,
      message: `Evolution ${enabled ? 'enabled' : 'disabled'}`
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
