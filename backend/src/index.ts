// ============================================================================
// RAGS AI - Backend API Server (Clean Version)
// ============================================================================

// Load environment variables FIRST
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(__dirname, '../.env') });

// Import enhanced services
import { errorHandler } from './services/enhanced-error-handler';
import { performanceMonitor } from './services/performance-monitor';
import { masterIntegration } from './services/master-integration';

// Express and HTTP
import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { createServer } from 'http';
import { initializeWebSocketServer } from './services/websocket-server';

// Import routes
import notesRoutes from './routes/notes';
import remindersRoutes from './routes/reminders';
import routinesRoutes from './routes/routines';
import voiceRoutes from './routes/voice';
import faceAnimationRoutes from './routes/face-animation';
import realAIRoutes from './routes/real-ai';
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
    : ['http://localhost:1420', 'http://localhost:8081', 'http://localhost:3000', 'tauri://localhost'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

// Compression
app.use(compression());

// Body parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

// ============================================================================
// ROUTES
// ============================================================================

// Health check
app.get('/', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'RAGS AI Backend is running!',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    capabilities: masterIntegration.getSystemStatus().capabilities
  });
});

// API routes
app.use('/api/notes', notesRoutes);
app.use('/api/reminders', remindersRoutes);
app.use('/api/routines', routinesRoutes);
app.use('/api/voice', voiceRoutes);
app.use('/api/face-animation', faceAnimationRoutes);
app.use('/api/real-ai', realAIRoutes);
app.use('/api/browser-control', browserControlRoutes);
app.use('/api/camera-vision', cameraVisionRoutes);
app.use('/api/system-monitor', systemMonitorRoutes);
app.use('/api/enhanced-chat', enhancedChatRoutes);
app.use('/api/enhanced', enhancedControlRoutes);

// Catch-all for undefined routes
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.originalUrl,
    timestamp: new Date().toISOString()
  });
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  const errorId = errorHandler.handleError(err, {
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
  });

  res.status(err.statusCode || 500).json({
    success: false,
    error: err.message || 'Internal server error',
    errorId,
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// ============================================================================
// SERVER START
// ============================================================================

server.listen(PORT, async () => {
  console.log(`🚀 RAGS AI Backend running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 API URL: http://localhost:${PORT}`);
  console.log(`🔌 WebSocket URL: ws://localhost:${PORT}`);
  
  // Start enhanced monitoring
  console.log('📊 Starting enhanced monitoring systems...');
  performanceMonitor.startMonitoring(5000);
  
  // Initialize master integration system
  console.log('🎯 Initializing master integration...');
  try {
    await masterIntegration.initialize();
    console.log('✅ Master Integration initialized');
    console.log('🚀 RAGS is now fully enhanced and ready!');
  } catch (error) {
    console.error('❌ Failed to initialize master integration:', error);
  }
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down RAGS AI Backend...');
  
  performanceMonitor.stopMonitoring();
  webSocketServer.close();
  
  server.close(() => {
    console.log('✅ Server closed gracefully');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  
  performanceMonitor.stopMonitoring();
  webSocketServer.close();
  
  server.close(() => {
    console.log('✅ Server closed gracefully');
    process.exit(0);
  });
});

export default app;
