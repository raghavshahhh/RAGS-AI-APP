/**
 * 🛡️ ENHANCED ERROR HANDLER
 * Advanced error handling, recovery, and logging system
 */

import { EventEmitter } from 'events';
import * as fs from 'fs/promises';
import * as path from 'path';

interface ErrorContext {
  service: string;
  method: string;
  timestamp: Date;
  userId?: string;
  requestId?: string;
  metadata?: any;
}

interface ErrorReport {
  id: string;
  error: Error;
  context: ErrorContext;
  severity: 'low' | 'medium' | 'high' | 'critical';
  recoveryAttempts: number;
  resolved: boolean;
  resolution?: string;
}

interface RecoveryStrategy {
  errorType: string;
  strategy: (error: Error, context: ErrorContext) => Promise<boolean>;
  maxAttempts: number;
  cooldown: number; // milliseconds
}

export class EnhancedErrorHandler extends EventEmitter {
  private errorLog: ErrorReport[] = [];
  private recoveryStrategies: Map<string, RecoveryStrategy> = new Map();
  private errorCounts: Map<string, number> = new Map();
  private lastErrors: Map<string, Date> = new Map();
  private logDir: string;
  private crashRecoveryEnabled: boolean;
  private autoRestartEnabled: boolean;

  constructor() {
    super();
    this.logDir = process.env.LOCAL_STORAGE_PATH + '/error-logs' || '/tmp/rags-errors';
    this.crashRecoveryEnabled = process.env.CRASH_RECOVERY === 'true';
    this.autoRestartEnabled = process.env.AUTO_RESTART === 'true';
    
    this.initializeRecoveryStrategies();
    this.setupGlobalErrorHandlers();
  }

  /**
   * Initialize built-in recovery strategies
   */
  private initializeRecoveryStrategies(): void {
    // Ollama connection recovery
    this.addRecoveryStrategy('OLLAMA_CONNECTION_ERROR', async (error, context) => {
      console.log('🔄 Attempting Ollama reconnection...');
      try {
        const response = await fetch('http://localhost:11434/api/tags');
        if (response.ok) {
          console.log('✅ Ollama reconnected successfully');
          return true;
        }
      } catch (e) {
        console.log('❌ Ollama still unavailable');
      }
      return false;
    }, 3, 5000);

    // Memory cleanup recovery
    this.addRecoveryStrategy('MEMORY_ERROR', async (error, context) => {
      console.log('🧹 Performing memory cleanup...');
      if (global.gc) {
        global.gc();
        console.log('✅ Garbage collection performed');
        return true;
      }
      return false;
    }, 2, 10000);

    // File system recovery
    this.addRecoveryStrategy('FILE_SYSTEM_ERROR', async (error, context) => {
      console.log('📁 Checking file system permissions...');
      try {
        const testPath = path.join(this.logDir, 'test-write.tmp');
        await fs.writeFile(testPath, 'test');
        await fs.unlink(testPath);
        console.log('✅ File system accessible');
        return true;
      } catch (e) {
        console.log('❌ File system still inaccessible');
        return false;
      }
    }, 2, 3000);

    // Network recovery
    this.addRecoveryStrategy('NETWORK_ERROR', async (error, context) => {
      console.log('🌐 Testing network connectivity...');
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        const response = await fetch('https://httpbin.org/status/200', { 
          signal: controller.signal 
        });
        clearTimeout(timeoutId);
        if (response.ok) {
          console.log('✅ Network connectivity restored');
          return true;
        }
      } catch (e) {
        console.log('❌ Network still unavailable');
      }
      return false;
    }, 3, 5000);
  }

  /**
   * Setup global error handlers
   */
  private setupGlobalErrorHandlers(): void {
    // Uncaught exceptions
    process.on('uncaughtException', (error) => {
      this.handleError(error, {
        service: 'global',
        method: 'uncaughtException',
        timestamp: new Date()
      }, 'critical');
    });

    // Unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      const error = reason instanceof Error ? reason : new Error(String(reason));
      this.handleError(error, {
        service: 'global',
        method: 'unhandledRejection',
        timestamp: new Date()
      }, 'high');
    });

    // Memory warnings
    process.on('warning', (warning) => {
      if (warning.name === 'MaxListenersExceededWarning' || 
          warning.name === 'DeprecationWarning') {
        this.handleError(new Error(warning.message), {
          service: 'global',
          method: 'warning',
          timestamp: new Date()
        }, 'medium');
      }
    });
  }

  /**
   * Add a custom recovery strategy
   */
  addRecoveryStrategy(
    errorType: string, 
    strategy: (error: Error, context: ErrorContext) => Promise<boolean>,
    maxAttempts: number = 3,
    cooldown: number = 5000
  ): void {
    this.recoveryStrategies.set(errorType, {
      errorType,
      strategy,
      maxAttempts,
      cooldown
    });
  }

  /**
   * Handle an error with context and severity
   */
  async handleError(
    error: Error, 
    context: ErrorContext, 
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ): Promise<void> {
    const errorId = this.generateErrorId();
    const errorReport: ErrorReport = {
      id: errorId,
      error,
      context,
      severity,
      recoveryAttempts: 0,
      resolved: false
    };

    // Add to error log
    this.errorLog.push(errorReport);
    
    // Update error counts
    const errorKey = `${context.service}:${error.name}`;
    this.errorCounts.set(errorKey, (this.errorCounts.get(errorKey) || 0) + 1);
    this.lastErrors.set(errorKey, new Date());

    // Log the error
    await this.logError(errorReport);

    // Emit error event
    this.emit('error', errorReport);

    // Attempt recovery based on severity
    if (severity === 'high' || severity === 'critical') {
      await this.attemptRecovery(errorReport);
    }

    // Handle critical errors
    if (severity === 'critical') {
      await this.handleCriticalError(errorReport);
    }

    console.log(`🚨 Error handled: ${error.message} [${severity.toUpperCase()}]`);
  }

  /**
   * Attempt error recovery
   */
  private async attemptRecovery(errorReport: ErrorReport): Promise<void> {
    const errorType = this.classifyError(errorReport.error);
    const strategy = this.recoveryStrategies.get(errorType);

    if (!strategy) {
      console.log(`⚠️ No recovery strategy for error type: ${errorType}`);
      return;
    }

    const errorKey = `${errorReport.context.service}:${errorReport.error.name}`;
    const lastError = this.lastErrors.get(errorKey);
    
    // Check cooldown
    if (lastError && Date.now() - lastError.getTime() < strategy.cooldown) {
      console.log(`⏳ Recovery cooldown active for ${errorType}`);
      return;
    }

    // Attempt recovery
    for (let attempt = 1; attempt <= strategy.maxAttempts; attempt++) {
      console.log(`🔄 Recovery attempt ${attempt}/${strategy.maxAttempts} for ${errorType}`);
      
      try {
        const recovered = await strategy.strategy(errorReport.error, errorReport.context);
        errorReport.recoveryAttempts = attempt;
        
        if (recovered) {
          errorReport.resolved = true;
          errorReport.resolution = `Recovered using ${errorType} strategy on attempt ${attempt}`;
          console.log(`✅ Recovery successful for ${errorType}`);
          this.emit('recovery', errorReport);
          return;
        }
      } catch (recoveryError) {
        console.log(`❌ Recovery attempt ${attempt} failed:`, recoveryError.message);
      }

      // Wait before next attempt
      if (attempt < strategy.maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }

    console.log(`❌ All recovery attempts failed for ${errorType}`);
  }

  /**
   * Handle critical errors
   */
  private async handleCriticalError(errorReport: ErrorReport): Promise<void> {
    console.log('🚨 CRITICAL ERROR DETECTED - Initiating emergency protocols');

    // Save current state
    await this.saveEmergencyState();

    // Notify all connected clients
    this.emit('critical-error', errorReport);

    // Auto-restart if enabled
    if (this.autoRestartEnabled) {
      console.log('🔄 Auto-restart enabled - Restarting in 5 seconds...');
      setTimeout(() => {
        process.exit(1); // PM2 or similar will restart
      }, 5000);
    }
  }

  /**
   * Classify error type for recovery strategy selection
   */
  private classifyError(error: Error): string {
    const message = error.message.toLowerCase();
    const stack = error.stack?.toLowerCase() || '';

    if (message.includes('ollama') || message.includes('11434')) {
      return 'OLLAMA_CONNECTION_ERROR';
    }
    if (message.includes('memory') || message.includes('heap')) {
      return 'MEMORY_ERROR';
    }
    if (message.includes('enoent') || message.includes('permission') || message.includes('file')) {
      return 'FILE_SYSTEM_ERROR';
    }
    if (message.includes('network') || message.includes('timeout') || message.includes('fetch')) {
      return 'NETWORK_ERROR';
    }
    if (message.includes('websocket') || message.includes('connection')) {
      return 'CONNECTION_ERROR';
    }

    return 'GENERIC_ERROR';
  }

  /**
   * Log error to file system
   */
  private async logError(errorReport: ErrorReport): Promise<void> {
    try {
      await fs.mkdir(this.logDir, { recursive: true });
      
      const logEntry = {
        timestamp: errorReport.context.timestamp.toISOString(),
        id: errorReport.id,
        service: errorReport.context.service,
        method: errorReport.context.method,
        severity: errorReport.severity,
        error: {
          name: errorReport.error.name,
          message: errorReport.error.message,
          stack: errorReport.error.stack
        },
        context: errorReport.context,
        recoveryAttempts: errorReport.recoveryAttempts,
        resolved: errorReport.resolved
      };

      const logFile = path.join(this.logDir, `errors-${new Date().toISOString().split('T')[0]}.json`);
      const existingLogs = await this.readLogFile(logFile);
      existingLogs.push(logEntry);
      
      await fs.writeFile(logFile, JSON.stringify(existingLogs, null, 2));
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
  }

  /**
   * Read existing log file
   */
  private async readLogFile(logFile: string): Promise<any[]> {
    try {
      const content = await fs.readFile(logFile, 'utf-8');
      return JSON.parse(content);
    } catch {
      return [];
    }
  }

  /**
   * Save emergency state
   */
  private async saveEmergencyState(): Promise<void> {
    try {
      const emergencyState = {
        timestamp: new Date().toISOString(),
        errorLog: this.errorLog.slice(-10), // Last 10 errors
        errorCounts: Object.fromEntries(this.errorCounts),
        memoryUsage: process.memoryUsage(),
        uptime: process.uptime(),
        version: process.version
      };

      const emergencyFile = path.join(this.logDir, 'emergency-state.json');
      await fs.writeFile(emergencyFile, JSON.stringify(emergencyState, null, 2));
      console.log('💾 Emergency state saved');
    } catch (error) {
      console.error('Failed to save emergency state:', error);
    }
  }

  /**
   * Generate unique error ID
   */
  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get error statistics
   */
  getErrorStats(): any {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    const recentErrors = this.errorLog.filter(e => e.context.timestamp > last24h);
    const criticalErrors = recentErrors.filter(e => e.severity === 'critical');
    const resolvedErrors = recentErrors.filter(e => e.resolved);

    return {
      total: this.errorLog.length,
      last24h: recentErrors.length,
      critical: criticalErrors.length,
      resolved: resolvedErrors.length,
      resolutionRate: recentErrors.length > 0 ? (resolvedErrors.length / recentErrors.length) * 100 : 0,
      topErrors: Array.from(this.errorCounts.entries())
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5),
      uptime: process.uptime()
    };
  }

  /**
   * Clear old error logs
   */
  async cleanup(): Promise<void> {
    // Keep only last 1000 errors in memory
    if (this.errorLog.length > 1000) {
      this.errorLog = this.errorLog.slice(-1000);
    }

    // Clear old error counts (older than 7 days)
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    for (const [key, date] of this.lastErrors.entries()) {
      if (date < weekAgo) {
        this.errorCounts.delete(key);
        this.lastErrors.delete(key);
      }
    }

    console.log('🧹 Error handler cleanup completed');
  }
}

// Export singleton instance
export const errorHandler = new EnhancedErrorHandler();

// Helper function for easy error handling
export const handleError = (
  error: Error, 
  context: Partial<ErrorContext>, 
  severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
) => {
  const fullContext: ErrorContext = {
    service: 'unknown',
    method: 'unknown',
    timestamp: new Date(),
    ...context
  };
  
  return errorHandler.handleError(error, fullContext, severity);
};

// Decorator for automatic error handling
export function withErrorHandling(service: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      try {
        return await method.apply(this, args);
      } catch (error) {
        await handleError(error, {
          service,
          method: propertyName,
          timestamp: new Date()
        });
        throw error; // Re-throw after handling
      }
    };
  };
}
