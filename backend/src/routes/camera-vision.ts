/**
 * Camera Vision API Routes
 * Real-time visual understanding through camera
 */

import { Router } from 'express';
import { cameraVision } from '../services/camera-vision';

const router = Router();

/**
 * Initialize camera vision
 */
router.post('/initialize', async (req, res) => {
  try {
    await cameraVision.initialize();
    
    res.json({
      success: true,
      message: 'Camera vision initialized',
      ready: cameraVision.isReady()
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Check vision status
 */
router.get('/status', (req, res) => {
  res.json({
    success: true,
    ready: cameraVision.isReady(),
    message: cameraVision.isReady() 
      ? 'Camera vision is ready' 
      : 'Camera vision not available'
  });
});

/**
 * Capture and describe current camera view
 */
router.get('/describe', async (req, res) => {
  try {
    if (!cameraVision.isReady()) {
      return res.status(503).json({
        error: 'Camera vision not available',
        hint: 'Install vision model with: ollama pull llava'
      });
    }

    const description = await cameraVision.describeCurrentView();
    
    res.json({
      success: true,
      description: description
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Answer question about camera view
 */
router.post('/ask', async (req, res) => {
  try {
    const { question } = req.body;
    
    if (!question) {
      return res.status(400).json({ error: 'question is required' });
    }

    if (!cameraVision.isReady()) {
      return res.status(503).json({
        error: 'Camera vision not available',
        hint: 'Install vision model with: ollama pull llava'
      });
    }

    const answer = await cameraVision.answerQuestion(question);
    
    res.json({
      success: true,
      question: question,
      answer: answer
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Capture image from camera
 */
router.post('/capture', async (req, res) => {
  try {
    const imagePath = await cameraVision.captureFromCamera();
    
    res.json({
      success: true,
      imagePath: imagePath,
      message: 'Image captured'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
