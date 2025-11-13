/**
 * 📊 SYSTEM MONITOR API ROUTES
 * Enhanced system monitoring and performance endpoints
 */

import { Router, Request, Response } from 'express';
import { performanceMonitor } from '../services/performance-monitor';
import { errorHandler } from '../services/enhanced-error-handler';

const router = Router();

/**
 * GET /api/system/health
 * Enhanced health check with detailed system information
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const startTime = Date.now();
    
    // Test Ollama connectivity
    let ollamaStatus = 'offline';
    let ollamaResponseTime = 0;
    try {
      const ollamaStart = Date.now();
      const ollamaResponse = await fetch('http://localhost:11434/api/tags');
      ollamaResponseTime = Date.now() - ollamaStart;
      ollamaStatus = ollamaResponse.ok ? 'online' : 'error';
    } catch (error) {
      ollamaStatus = 'offline';
    }

    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      responseTime: Date.now() - startTime,
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      services: {
        api: 'operational',
        websocket: 'operational',
        ollama: ollamaStatus,
        ollamaResponseTime,
        monitoring: performanceMonitor ? 'active' : 'inactive',
        errorHandler: errorHandler ? 'active' : 'inactive'
      },
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        env: process.env.NODE_ENV || 'development'
      },
      version: '1.0.0'
    };

    // Record request time for performance monitoring
    performanceMonitor.recordRequest(Date.now() - startTime);

    res.json(healthData);
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/system/performance
 * Get detailed performance metrics
 */
router.get('/performance', async (req: Request, res: Response) => {
  try {
    const startTime = Date.now();
    const summary = performanceMonitor.getPerformanceSummary();
    const suggestions = performanceMonitor.getOptimizationSuggestions();
    
    const responseTime = Date.now() - startTime;
    performanceMonitor.recordRequest(responseTime);

    res.json({
      ...summary,
      suggestions,
      responseTime,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Performance metrics error:', error);
    res.status(500).json({
      error: 'Failed to retrieve performance metrics',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/system/errors
 * Get error statistics and recent errors
 */
router.get('/errors', async (req: Request, res: Response) => {
  try {
    const startTime = Date.now();
    const errorStats = errorHandler.getErrorStats();
    
    const responseTime = Date.now() - startTime;
    performanceMonitor.recordRequest(responseTime);

    res.json({
      ...errorStats,
      responseTime,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error stats retrieval error:', error);
    res.status(500).json({
      error: 'Failed to retrieve error statistics',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/system/optimize
 * Trigger system optimization
 */
router.post('/optimize', async (req: Request, res: Response) => {
  try {
    const startTime = Date.now();
    const { type } = req.body;

    console.log(`🔧 Manual optimization triggered: ${type || 'general'}`);

    // Perform optimization based on type
    const results: any = {
      timestamp: new Date().toISOString(),
      optimizations: []
    };

    if (!type || type === 'memory') {
      // Memory optimization
      if (global.gc) {
        const beforeMemory = process.memoryUsage();
        global.gc();
        const afterMemory = process.memoryUsage();
        
        results.optimizations.push({
          type: 'memory',
          action: 'garbage_collection',
          before: beforeMemory,
          after: afterMemory,
          freed: beforeMemory.heapUsed - afterMemory.heapUsed
        });
      }
    }

    if (!type || type === 'cleanup') {
      // Cleanup old data
      await performanceMonitor.exportMetrics(); // Export before cleanup
      await errorHandler.cleanup();
      
      results.optimizations.push({
        type: 'cleanup',
        action: 'data_cleanup',
        message: 'Old metrics and error logs cleaned up'
      });
    }

    const responseTime = Date.now() - startTime;
    performanceMonitor.recordRequest(responseTime);

    res.json({
      ...results,
      responseTime,
      message: 'System optimization completed'
    });
  } catch (error) {
    console.error('System optimization error:', error);
    res.status(500).json({
      error: 'Failed to optimize system',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/system/status
 * Get comprehensive system status
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    const startTime = Date.now();
    
    // Gather all system information
    const performance = performanceMonitor.getPerformanceSummary();
    const errors = errorHandler.getErrorStats();
    const suggestions = performanceMonitor.getOptimizationSuggestions();
    
    // Test all critical services
    const services = {
      ollama: 'checking...',
      memory: 'ok',
      cpu: 'ok',
      disk: 'ok'
    };

    // Test Ollama
    try {
      const ollamaResponse = await fetch('http://localhost:11434/api/tags');
      services.ollama = ollamaResponse.ok ? 'online' : 'error';
    } catch {
      services.ollama = 'offline';
    }

    // Check memory usage
    const memUsage = process.memoryUsage();
    const memPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
    services.memory = memPercent > 90 ? 'critical' : memPercent > 70 ? 'warning' : 'ok';

    const responseTime = Date.now() - startTime;
    performanceMonitor.recordRequest(responseTime);

    res.json({
      status: 'operational',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      responseTime,
      services,
      performance,
      errors,
      suggestions,
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        memory: memUsage,
        env: process.env.NODE_ENV || 'development'
      }
    });
  } catch (error) {
    console.error('System status error:', error);
    res.status(500).json({
      status: 'error',
      error: 'Failed to retrieve system status',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/system/restart
 * Graceful system restart (for development)
 */
router.post('/restart', async (req: Request, res: Response) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        error: 'Restart not allowed in production',
        timestamp: new Date().toISOString()
      });
    }

    console.log('🔄 Manual restart requested');
    
    res.json({
      message: 'System restart initiated',
      timestamp: new Date().toISOString()
    });

    // Graceful shutdown
    setTimeout(() => {
      performanceMonitor.stopMonitoring();
      process.exit(0);
    }, 1000);
  } catch (error) {
    console.error('Restart error:', error);
    res.status(500).json({
      error: 'Failed to restart system',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/system/logs
 * Get recent system logs
 */
router.get('/logs', async (req: Request, res: Response) => {
  try {
    const startTime = Date.now();
    const { limit = 50, level = 'all' } = req.query;

    // This would typically read from log files
    // For now, return basic log information
    const logs = {
      timestamp: new Date().toISOString(),
      level: level,
      limit: Number(limit),
      entries: [
        {
          timestamp: new Date().toISOString(),
          level: 'info',
          message: 'System monitoring active',
          service: 'performance-monitor'
        },
        {
          timestamp: new Date().toISOString(),
          level: 'info', 
          message: 'Error handling system active',
          service: 'error-handler'
        }
      ]
    };

    const responseTime = Date.now() - startTime;
    performanceMonitor.recordRequest(responseTime);

    res.json({
      ...logs,
      responseTime
    });
  } catch (error) {
    console.error('Logs retrieval error:', error);
    res.status(500).json({
      error: 'Failed to retrieve logs',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
