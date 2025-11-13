import { Router } from 'express';
import { RAGSMaster } from '../services/rags-master';

const router = Router();
let ragsMaster: RAGSMaster | null = null;

// Initialize RAGS
router.post('/start', async (req, res) => {
  try {
    if (ragsMaster) {
      return res.json({ success: true, message: 'RAGS already running' });
    }

    ragsMaster = new RAGSMaster({
      userId: 'default-user',
      picovoiceKey: process.env.PICOVOICE_ACCESS_KEY || '',
      elevenLabsKey: process.env.ELEVENLABS_API_KEY,
      whisperModelPath: process.env.WHISPER_MODEL_PATH || '/opt/homebrew/bin/whisper',
      ollamaModel: process.env.OLLAMA_MODEL || 'llama3.2:3b',
      enableCamera: true,
      enableScreenAccess: true,
      enableSystemControl: true,
    });

    await ragsMaster.initialize();
    
    res.json({ 
      success: true, 
      message: 'RAGS AI started successfully',
      status: ragsMaster.getSystemStatus()
    });
  } catch (error: any) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Stop RAGS
router.post('/stop', async (req, res) => {
  try {
    if (ragsMaster) {
      await ragsMaster.shutdown();
      ragsMaster = null;
    }
    res.json({ success: true, message: 'RAGS stopped' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get status
router.get('/status', async (req, res) => {
  try {
    if (!ragsMaster) {
      return res.json({ 
        success: true, 
        running: false,
        status: 'stopped'
      });
    }

    const status = await ragsMaster.getSystemStatus();
    res.json({ 
      success: true, 
      running: true,
      status 
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Send command
router.post('/command', async (req, res) => {
  try {
    if (!ragsMaster) {
      return res.status(400).json({ 
        success: false, 
        error: 'RAGS not running' 
      });
    }

    const { command } = req.body;
    // Process command through RAGS
    res.json({ 
      success: true, 
      message: 'Command processed',
      command 
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;