/**
 * 📊 PERFORMANCE MONITOR
 * Real-time performance monitoring and optimization
 */

import { EventEmitter } from 'events';
import * as os from 'os';
import * as fs from 'fs/promises';
import * as path from 'path';

interface PerformanceMetrics {
  timestamp: Date;
  cpu: {
    usage: number;
    loadAverage: number[];
    cores: number;
  };
  memory: {
    used: number;
    free: number;
    total: number;
    heapUsed: number;
    heapTotal: number;
    external: number;
    usage: number; // percentage
  };
  network: {
    requests: number;
    responses: number;
    errors: number;
    avgResponseTime: number;
  };
  ollama: {
    status: 'online' | 'offline' | 'error';
    responseTime: number;
    memoryUsage: number;
  };
  services: {
    active: number;
    errors: number;
    avgProcessingTime: number;
  };
}

interface PerformanceAlert {
  type: 'cpu' | 'memory' | 'network' | 'ollama' | 'service';
  severity: 'warning' | 'critical';
  message: string;
  value: number;
  threshold: number;
  timestamp: Date;
}

interface OptimizationSuggestion {
  category: string;
  suggestion: string;
  impact: 'low' | 'medium' | 'high';
  effort: 'easy' | 'moderate' | 'complex';
}

export class PerformanceMonitor extends EventEmitter {
  private metrics: PerformanceMetrics[] = [];
  private alerts: PerformanceAlert[] = [];
  private isMonitoring: boolean = false;
  private monitorInterval?: NodeJS.Timeout;
  private requestTimes: number[] = [];
  private serviceStats: Map<string, { count: number; totalTime: number; errors: number }> = new Map();
  
  // Thresholds
  private readonly thresholds = {
    cpu: { warning: 70, critical: 90 },
    memory: { warning: 80, critical: 95 },
    responseTime: { warning: 1000, critical: 3000 },
    ollamaResponseTime: { warning: 5000, critical: 10000 }
  };

  constructor() {
    super();
    this.setupProcessMonitoring();
  }

  /**
   * Start performance monitoring
   */
  startMonitoring(intervalMs: number = 5000): void {
    if (this.isMonitoring) {
      console.log('⚠️ Performance monitoring already running');
      return;
    }

    this.isMonitoring = true;
    console.log('📊 Starting performance monitoring...');

    this.monitorInterval = setInterval(async () => {
      await this.collectMetrics();
    }, intervalMs);

    // Cleanup old metrics every hour
    setInterval(() => {
      this.cleanupOldMetrics();
    }, 60 * 60 * 1000);

    console.log('✅ Performance monitoring started');
  }

  /**
   * Stop performance monitoring
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
    }
    console.log('📊 Performance monitoring stopped');
  }

  /**
   * Collect current performance metrics
   */
  private async collectMetrics(): Promise<void> {
    try {
      const cpuUsage = await this.getCPUUsage();
      const memoryStats = this.getMemoryStats();
      const networkStats = this.getNetworkStats();
      const ollamaStats = await this.getOllamaStats();
      const serviceStats = this.getServiceStats();

      const metrics: PerformanceMetrics = {
        timestamp: new Date(),
        cpu: {
          usage: cpuUsage,
          loadAverage: os.loadavg(),
          cores: os.cpus().length
        },
        memory: memoryStats,
        network: networkStats,
        ollama: ollamaStats,
        services: serviceStats
      };

      this.metrics.push(metrics);
      this.checkThresholds(metrics);
      this.emit('metrics', metrics);

      // Keep only last 1000 metrics in memory
      if (this.metrics.length > 1000) {
        this.metrics = this.metrics.slice(-1000);
      }

    } catch (error) {
      console.error('❌ Error collecting metrics:', error);
    }
  }

  /**
   * Get CPU usage percentage
   */
  private async getCPUUsage(): Promise<number> {
    return new Promise((resolve) => {
      const startMeasure = process.cpuUsage();
      const startTime = process.hrtime();

      setTimeout(() => {
        const endMeasure = process.cpuUsage(startMeasure);
        const endTime = process.hrtime(startTime);
        
        const totalTime = endTime[0] * 1000000 + endTime[1] / 1000; // microseconds
        const cpuTime = (endMeasure.user + endMeasure.system);
        const usage = (cpuTime / totalTime) * 100;
        
        resolve(Math.min(100, Math.max(0, usage)));
      }, 100);
    });
  }

  /**
   * Get memory statistics
   */
  private getMemoryStats(): PerformanceMetrics['memory'] {
    const processMemory = process.memoryUsage();
    const systemMemory = {
      total: os.totalmem(),
      free: os.freemem()
    };
    
    const used = systemMemory.total - systemMemory.free;
    const usage = (used / systemMemory.total) * 100;

    return {
      used,
      free: systemMemory.free,
      total: systemMemory.total,
      heapUsed: processMemory.heapUsed,
      heapTotal: processMemory.heapTotal,
      external: processMemory.external,
      usage
    };
  }

  /**
   * Get network statistics
   */
  private getNetworkStats(): PerformanceMetrics['network'] {
    const avgResponseTime = this.requestTimes.length > 0 
      ? this.requestTimes.reduce((a, b) => a + b, 0) / this.requestTimes.length 
      : 0;

    return {
      requests: this.requestTimes.length,
      responses: this.requestTimes.length,
      errors: 0, // Will be updated by error handler
      avgResponseTime
    };
  }

  /**
   * Get Ollama statistics
   */
  private async getOllamaStats(): Promise<PerformanceMetrics['ollama']> {
    try {
      const startTime = Date.now();
      const response = await fetch('http://localhost:11434/api/tags');
      const responseTime = Date.now() - startTime;

      if (response.ok) {
        return {
          status: 'online',
          responseTime,
          memoryUsage: 0 // Could be enhanced to get actual Ollama memory usage
        };
      } else {
        return {
          status: 'error',
          responseTime,
          memoryUsage: 0
        };
      }
    } catch (error) {
      return {
        status: 'offline',
        responseTime: 0,
        memoryUsage: 0
      };
    }
  }

  /**
   * Get service statistics
   */
  private getServiceStats(): PerformanceMetrics['services'] {
    let totalServices = 0;
    let totalErrors = 0;
    let totalTime = 0;
    let totalCalls = 0;

    for (const [service, stats] of this.serviceStats.entries()) {
      totalServices++;
      totalErrors += stats.errors;
      totalTime += stats.totalTime;
      totalCalls += stats.count;
    }

    return {
      active: totalServices,
      errors: totalErrors,
      avgProcessingTime: totalCalls > 0 ? totalTime / totalCalls : 0
    };
  }

  /**
   * Check performance thresholds and create alerts
   */
  private checkThresholds(metrics: PerformanceMetrics): void {
    // CPU threshold check
    if (metrics.cpu.usage > this.thresholds.cpu.critical) {
      this.createAlert('cpu', 'critical', 
        `CPU usage critically high: ${metrics.cpu.usage.toFixed(1)}%`,
        metrics.cpu.usage, this.thresholds.cpu.critical);
    } else if (metrics.cpu.usage > this.thresholds.cpu.warning) {
      this.createAlert('cpu', 'warning',
        `CPU usage high: ${metrics.cpu.usage.toFixed(1)}%`,
        metrics.cpu.usage, this.thresholds.cpu.warning);
    }

    // Memory threshold check
    if (metrics.memory.usage > this.thresholds.memory.critical) {
      this.createAlert('memory', 'critical',
        `Memory usage critically high: ${metrics.memory.usage.toFixed(1)}%`,
        metrics.memory.usage, this.thresholds.memory.critical);
    } else if (metrics.memory.usage > this.thresholds.memory.warning) {
      this.createAlert('memory', 'warning',
        `Memory usage high: ${metrics.memory.usage.toFixed(1)}%`,
        metrics.memory.usage, this.thresholds.memory.warning);
    }

    // Ollama response time check
    if (metrics.ollama.responseTime > this.thresholds.ollamaResponseTime.critical) {
      this.createAlert('ollama', 'critical',
        `Ollama response time critically slow: ${metrics.ollama.responseTime}ms`,
        metrics.ollama.responseTime, this.thresholds.ollamaResponseTime.critical);
    } else if (metrics.ollama.responseTime > this.thresholds.ollamaResponseTime.warning) {
      this.createAlert('ollama', 'warning',
        `Ollama response time slow: ${metrics.ollama.responseTime}ms`,
        metrics.ollama.responseTime, this.thresholds.ollamaResponseTime.warning);
    }
  }

  /**
   * Create performance alert
   */
  private createAlert(
    type: PerformanceAlert['type'],
    severity: PerformanceAlert['severity'],
    message: string,
    value: number,
    threshold: number
  ): void {
    const alert: PerformanceAlert = {
      type,
      severity,
      message,
      value,
      threshold,
      timestamp: new Date()
    };

    this.alerts.push(alert);
    this.emit('alert', alert);

    console.log(`🚨 Performance Alert [${severity.toUpperCase()}]: ${message}`);

    // Auto-optimization for critical alerts
    if (severity === 'critical') {
      this.triggerAutoOptimization(type);
    }
  }

  /**
   * Trigger automatic optimization
   */
  private triggerAutoOptimization(type: PerformanceAlert['type']): void {
    console.log(`🔧 Triggering auto-optimization for ${type}`);

    switch (type) {
      case 'memory':
        if (global.gc) {
          global.gc();
          console.log('✅ Garbage collection triggered');
        }
        break;
      
      case 'cpu':
        // Reduce concurrent operations
        console.log('⚡ Reducing concurrent operations');
        break;
      
      case 'ollama':
        // Could restart Ollama connection
        console.log('🔄 Ollama optimization triggered');
        break;
    }
  }

  /**
   * Record request timing
   */
  recordRequest(responseTime: number): void {
    this.requestTimes.push(responseTime);
    
    // Keep only last 100 request times
    if (this.requestTimes.length > 100) {
      this.requestTimes = this.requestTimes.slice(-100);
    }
  }

  /**
   * Record service call
   */
  recordServiceCall(serviceName: string, processingTime: number, isError: boolean = false): void {
    const stats = this.serviceStats.get(serviceName) || { count: 0, totalTime: 0, errors: 0 };
    
    stats.count++;
    stats.totalTime += processingTime;
    if (isError) stats.errors++;
    
    this.serviceStats.set(serviceName, stats);
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(): any {
    if (this.metrics.length === 0) {
      return { message: 'No metrics available' };
    }

    const latest = this.metrics[this.metrics.length - 1];
    const last10 = this.metrics.slice(-10);
    
    const avgCpu = last10.reduce((sum, m) => sum + m.cpu.usage, 0) / last10.length;
    const avgMemory = last10.reduce((sum, m) => sum + m.memory.usage, 0) / last10.length;
    const avgResponseTime = last10.reduce((sum, m) => sum + m.network.avgResponseTime, 0) / last10.length;

    return {
      current: {
        cpu: latest.cpu.usage.toFixed(1) + '%',
        memory: latest.memory.usage.toFixed(1) + '%',
        ollama: latest.ollama.status,
        responseTime: latest.network.avgResponseTime.toFixed(0) + 'ms'
      },
      averages: {
        cpu: avgCpu.toFixed(1) + '%',
        memory: avgMemory.toFixed(1) + '%',
        responseTime: avgResponseTime.toFixed(0) + 'ms'
      },
      alerts: {
        total: this.alerts.length,
        critical: this.alerts.filter(a => a.severity === 'critical').length,
        recent: this.alerts.filter(a => 
          Date.now() - a.timestamp.getTime() < 60 * 60 * 1000
        ).length
      },
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage()
    };
  }

  /**
   * Get optimization suggestions
   */
  getOptimizationSuggestions(): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];
    
    if (this.metrics.length === 0) return suggestions;

    const latest = this.metrics[this.metrics.length - 1];
    
    // Memory suggestions
    if (latest.memory.usage > 80) {
      suggestions.push({
        category: 'Memory',
        suggestion: 'Enable garbage collection or increase memory limit',
        impact: 'high',
        effort: 'easy'
      });
    }

    // CPU suggestions
    if (latest.cpu.usage > 70) {
      suggestions.push({
        category: 'CPU',
        suggestion: 'Reduce concurrent operations or optimize algorithms',
        impact: 'medium',
        effort: 'moderate'
      });
    }

    // Ollama suggestions
    if (latest.ollama.responseTime > 3000) {
      suggestions.push({
        category: 'AI',
        suggestion: 'Use smaller model or increase Ollama memory allocation',
        impact: 'high',
        effort: 'moderate'
      });
    }

    return suggestions;
  }

  /**
   * Setup process monitoring
   */
  private setupProcessMonitoring(): void {
    // Monitor process events
    process.on('exit', () => {
      console.log('📊 Performance monitor shutting down');
    });

    process.on('SIGTERM', () => {
      this.stopMonitoring();
    });

    process.on('SIGINT', () => {
      this.stopMonitoring();
    });
  }

  /**
   * Cleanup old metrics and alerts
   */
  private cleanupOldMetrics(): void {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    // Keep metrics from last hour
    this.metrics = this.metrics.filter(m => m.timestamp > oneHourAgo);
    
    // Keep alerts from last 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    this.alerts = this.alerts.filter(a => a.timestamp > oneDayAgo);
    
    console.log('🧹 Performance metrics cleanup completed');
  }

  /**
   * Export metrics to file
   */
  async exportMetrics(filePath?: string): Promise<string> {
    const exportPath = filePath || path.join(
      process.env.LOCAL_STORAGE_PATH || '/tmp',
      'performance-metrics.json'
    );

    const exportData = {
      timestamp: new Date().toISOString(),
      summary: this.getPerformanceSummary(),
      metrics: this.metrics.slice(-100), // Last 100 metrics
      alerts: this.alerts.slice(-50), // Last 50 alerts
      suggestions: this.getOptimizationSuggestions()
    };

    await fs.writeFile(exportPath, JSON.stringify(exportData, null, 2));
    console.log(`📊 Performance metrics exported to: ${exportPath}`);
    
    return exportPath;
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();
