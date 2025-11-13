// ============================================================================
// RAGS AI - Backend API Server
// ============================================================================

// Load environment variables FIRST (before any other imports)
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(__dirname, '../.env') });
console.log('🔧 Loaded OLLAMA_MODEL:', process.env.OLLAMA_MODEL);

// Import enhanced services
import { errorHandler } from './services/enhanced-error-handler';
import { performanceMonitor } from './services/performance-monitor';
import { masterIntegration } from './services/master-integration';

// Now import everything else
import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { createServer } from 'http';
import { initializeWebSocketServer } from './services/websocket-server';

// Import routes (after env is loaded)
import notesRoutes from './routes/notes';
import remindersRoutes from './routes/reminders';
import routinesRoutes from './routes/routines';
import voiceRoutes from './routes/voice';
import faceAnimationRoutes from './routes/face-animation';
import realAIRoutes, { registerWebSocketClient } from './routes/real-ai';
import browserControlRoutes from './routes/browser-control';
import cameraVisionRoutes from './routes/camera-vision';
import systemMonitorRoutes from './routes/system-monitor';
import enhancedChatRoutes from './routes/enhanced-chat';
import enhancedControlRoutes from './routes/enhanced-control';

const app: Express = express();
const PORT = process.env.PORT || 3000;

// Create HTTP server
const server = createServer(app);

// Initialize Socket.IO WebSocket server
const webSocketServer = initializeWebSocketServer(server);

// ============================================================================
// MIDDLEWARE
// ============================================================================

// Security
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://ragsai.com', 'tauri://localhost']
    : '*',
  credentials: true,
}));

// Compression
app.use(compression());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Enhanced request logging with timing
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const requestId = Math.random().toString(36).substring(7);
  
  // Add request ID to headers
  res.setHeader('X-Request-ID', requestId);
  
  console.log(`[${requestId}] ${req.method} ${req.path}`);
  
  // Log response time
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${requestId}] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
  });
  
  next();
});

// ============================================================================
// ROUTES
// ============================================================================

app.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'RAGS AI API',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
  });
});

// Enhanced health check with detailed status
app.get('/health', async (req: Request, res: Response) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    services: {
      api: 'operational',
      websocket: connectedClients.size > 0 ? 'operational' : 'idle',
      connectedClients: connectedClients.size,
    },
    version: '1.0.0',
  };
  
  res.json(health);
});

// Detailed system status endpoint
app.get('/api/v1/status', async (req: Request, res: Response) => {
  try {
    const status = {
      success: true,
      server: {
        status: 'running',
        uptime: process.uptime(),
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
      },
      system: {
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
          unit: 'MB',
        },
        cpu: process.cpuUsage(),
      },
      services: {
        websocket: {
          status: 'operational',
          clients: connectedClients.size,
        },
        database: {
          status: process.env.SUPABASE_URL ? 'configured' : 'local_only',
        },
      },
      timestamp: new Date().toISOString(),
    };
    
    res.json(status);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to get system status',
      message: error.message,
    });
  }
});

// API v1 routes
app.use('/api/v1/notes', notesRoutes);
app.use('/api/v1/reminders', remindersRoutes);
app.use('/api/v1/routines', routinesRoutes);
app.use('/api/v1/voice', voiceRoutes);
app.use('/api/v1/vision', require('./routes/vision').default);
app.use('/api/v1/rags', require('./routes/rags').default);

// Face animation routes (shorter path for convenience)
app.use('/api/face', faceAnimationRoutes);
app.use('/api/analyze-emotion', faceAnimationRoutes);
app.use('/api/text-to-phonemes', faceAnimationRoutes);

// Real AI routes (NO DEMO DATA - Only real Ollama AI)
app.use('/api/real-ai', realAIRoutes);

// Browser control routes (NEW - Puppeteer automation)
app.use('/api/browser-control', browserControlRoutes);

// Camera vision routes (NEW - Visual AI)
app.use('/api/camera-vision', cameraVisionRoutes);

// Evolution routes (NEW - Self-evolution features)
app.use('/api/evolution', require('./routes/evolution').default);

// System monitoring routes (NEW - Enhanced monitoring)
app.use('/api/system', systemMonitorRoutes);

// Enhanced chat routes (NEW - ChatGPT-level conversation)
app.use('/api/enhanced-chat', enhancedChatRoutes);

// Enhanced control routes (NEW - Complete automation and AI control)
app.use('/api/enhanced', enhancedControlRoutes);

// ============================================================================
// ERROR HANDLING
// ============================================================================

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
  });
});

// Enhanced global error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  const errorId = Math.random().toString(36).substring(7);
  
  console.error(`❌ [Error ${errorId}]`, {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
  });
  
  // Broadcast error to connected clients if it's critical
  if (err.statusCode >= 500) {
    broadcastToClients({
      type: 'system_error',
      errorId,
      message: 'System error occurred',
      timestamp: new Date().toISOString(),
    });
  }
  
  res.status(err.statusCode || 500).json({
    success: false,
    error: err.message || 'Internal server error',
    errorId,
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// ============================================================================
// WEBSOCKET SETUP (Now handled by Socket.IO service)
// ============================================================================

console.log('🔌 WebSocket server initialized via Socket.IO');

// ============================================================================
// SERVER START
// ============================================================================

server.listen(PORT, () => {
  console.log(`🚀 RAGS AI Backend running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 API URL: http://localhost:${PORT}`);
  console.log(`🔌 WebSocket URL: ws://localhost:${PORT}`);
  
  // Start enhanced monitoring
  console.log('📊 Starting enhanced monitoring systems...');
  performanceMonitor.startMonitoring(5000); // Monitor every 5 seconds
  
  // Initialize master integration system
  console.log('🎯 Initializing Master Integration...');
  masterIntegration.initialize().then(() => {
    console.log('✅ Master Integration ready - RAGS fully enhanced!');
  }).catch(error => {
    console.error('❌ Master Integration failed:', error);
  });
  
  // Setup error handler events
  errorHandler.on('critical-error', (errorReport) => {
    console.log('🚨 CRITICAL ERROR DETECTED:', errorReport.error.message);
    broadcastToClients({
      type: 'critical-error',
      message: 'System experiencing critical error',
      timestamp: new Date().toISOString()
    });
  });
  
  errorHandler.on('recovery', (errorReport) => {
    console.log('✅ ERROR RECOVERED:', errorReport.resolution);
    broadcastToClients({
      type: 'error-recovered',
      message: 'System error resolved',
      timestamp: new Date().toISOString()
    });
  });
  
  // Setup performance alerts
  performanceMonitor.on('alert', (alert) => {
    console.log(`🚨 Performance Alert [${alert.severity}]: ${alert.message}`);
    broadcastToClients({
      type: 'performance-alert',
      alert,
      timestamp: new Date().toISOString()
    });
  });
  
  console.log('✅ Enhanced monitoring systems active');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  performanceMonitor.stopMonitoring();
  wss.close();
  server.close();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  performanceMonitor.stopMonitoring();
  wss.close();
  server.close();
  process.exit(0);
});

export default app;

