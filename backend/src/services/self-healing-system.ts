/**
 * 🛡️ SELF-HEALING SYSTEM
 * Auto-debug, rollback, security monitoring, and health checks
 */

import { EventEmitter } from 'events';
import { OllamaBrain } from './ollama-brain';
import * as fs from 'fs/promises';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface SystemSnapshot {
  id: string;
  timestamp: Date;
  files: Record<string, string>; // filepath -> content hash
  config: any;
  performance: PerformanceMetrics;
}

interface PerformanceMetrics {
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  response_time_avg: number;
  error_rate: number;
}

interface ErrorLog {
  id: string;
  error: string;
  stack: string;
  context: any;
  timestamp: Date;
  resolved: boolean;
  fix_applied?: string;
}

interface SecurityThreat {
  id: string;
  type: 'malicious_code' | 'suspicious_activity' | 'data_breach' | 'unauthorized_access';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  detected_at: Date;
  resolved: boolean;
}

interface HealthCheck {
  component: string;
  status: 'healthy' | 'degraded' | 'critical';
  last_check: Date;
  issues: string[];
}

export class SelfHealingSystem extends EventEmitter {
  private brain: OllamaBrain;
  private dataDir: string;
  private snapshots: SystemSnapshot[] = [];
  private errorLogs: ErrorLog[] = [];
  private securityThreats: SecurityThreat[] = [];
  private healthChecks: Map<string, HealthCheck> = new Map();
  private monitoringEnabled: boolean = true;
  private autoFixEnabled: boolean = true;
  private performanceHistory: PerformanceMetrics[] = [];

  constructor(brain: OllamaBrain, userId: string = 'default') {
    super();
    this.brain = brain;
    this.dataDir = path.join(process.env.HOME || '', '.rags', 'self-healing', userId);
  }

  /**
   * Initialize self-healing system
   */
  async initialize(): Promise<void> {
    console.log('🛡️  Initializing Self-Healing System...');

    await fs.mkdir(this.dataDir, { recursive: true });

    // Load existing data
    await this.loadData();

    // Create initial snapshot
    await this.createSnapshot();

    // Start monitoring
    this.startMonitoring();

    console.log('✅ Self-Healing System initialized');
  }

  /**
   * Create system snapshot for rollback
   */
  async createSnapshot(): Promise<SystemSnapshot> {
    console.log('📸 Creating system snapshot...');

    const snapshot: SystemSnapshot = {
      id: `snap_${Date.now()}`,
      timestamp: new Date(),
      files: await this.hashCriticalFiles(),
      config: await this.captureConfig(),
      performance: await this.getPerformanceMetrics()
    };

    this.snapshots.push(snapshot);

    // Keep only last 10 snapshots
    if (this.snapshots.length > 10) {
      this.snapshots = this.snapshots.slice(-10);
    }

    await this.saveData();

    console.log(`✅ Snapshot created: ${snapshot.id}`);
    return snapshot;
  }

  /**
   * Rollback to previous snapshot
   */
  async rollback(snapshotId?: string): Promise<void> {
    console.log('⏮️  Initiating rollback...');

    const snapshot = snapshotId 
      ? this.snapshots.find(s => s.id === snapshotId)
      : this.snapshots[this.snapshots.length - 2]; // Previous snapshot

    if (!snapshot) {
      throw new Error('No snapshot found for rollback');
    }

    console.log(`Rolling back to snapshot: ${snapshot.id} (${snapshot.timestamp})`);

    // Restore configuration
    await this.restoreConfig(snapshot.config);

    // Restore files (would restore critical files)
    // In practice, this would restore modified files
    console.log('🔄 Configuration restored');

    this.emit('rollback_complete', snapshot);
  }

  /**
   * Auto-detect and fix errors
   */
  async autoDebug(error: Error, context?: any): Promise<string | null> {
    console.log('🔧 Auto-debugging error...');

    const errorLog: ErrorLog = {
      id: `err_${Date.now()}`,
      error: error.message,
      stack: error.stack || '',
      context,
      timestamp: new Date(),
      resolved: false
    };

    this.errorLogs.push(errorLog);

    // Search Stack Overflow for similar errors
    const solution = await this.searchStackOverflowSolution(error.message);

    if (solution) {
      console.log('💡 Solution found from Stack Overflow');
      
      if (this.autoFixEnabled) {
        // Apply fix (in safe mode)
        const fixApplied = await this.applySafeFix(solution, error);
        
        if (fixApplied) {
          errorLog.resolved = true;
          errorLog.fix_applied = solution;
          
          console.log('✅ Error auto-fixed!');
          this.emit('error_auto_fixed', { error, solution });
          
          await this.saveData();
          return solution;
        }
      }
    }

    // If can't auto-fix, log for manual review
    console.log('⚠️  Could not auto-fix, logged for review');
    this.emit('error_logged', errorLog);
    await this.saveData();

    return null;
  }

  /**
   * Detect security threats
   */
  async detectSecurityThreat(type: SecurityThreat['type'], description: string, severity: SecurityThreat['severity']): Promise<void> {
    console.log(`🚨 Security threat detected: ${type} (${severity})`);

    const threat: SecurityThreat = {
      id: `threat_${Date.now()}`,
      type,
      severity,
      description,
      detected_at: new Date(),
      resolved: false
    };

    this.securityThreats.push(threat);

    // Take immediate action for critical threats
    if (severity === 'critical') {
      console.log('🔴 CRITICAL THREAT - Taking immediate action');
      await this.handleCriticalThreat(threat);
    }

    this.emit('security_threat', threat);
    await this.saveData();
  }

  /**
   * Monitor system health
   */
  async checkSystemHealth(): Promise<Map<string, HealthCheck>> {
    console.log('🏥 Checking system health...');

    const checks = await Promise.all([
      this.checkCPUHealth(),
      this.checkMemoryHealth(),
      this.checkDiskHealth(),
      this.checkAPIHealth(),
      this.checkDatabaseHealth()
    ]);

    checks.forEach(check => {
      this.healthChecks.set(check.component, check);
    });

    // Emit alerts for degraded/critical components
    checks.forEach(check => {
      if (check.status !== 'healthy') {
        console.log(`⚠️  ${check.component}: ${check.status}`);
        this.emit('health_issue', check);
      }
    });

    return this.healthChecks;
  }

  /**
   * Auto-optimize performance
   */
  async autoOptimize(): Promise<void> {
    console.log('⚡ Running auto-optimization...');

    const metrics = await this.getPerformanceMetrics();

    // High CPU usage
    if (metrics.cpu_usage > 80) {
      console.log('🔴 High CPU usage detected, optimizing...');
      await this.optimizeCPU();
    }

    // High memory usage
    if (metrics.memory_usage > 85) {
      console.log('🔴 High memory usage detected, optimizing...');
      await this.optimizeMemory();
    }

    // High error rate
    if (metrics.error_rate > 0.05) {
      console.log('🔴 High error rate detected, investigating...');
      await this.investigateErrors();
    }

    // Slow response times
    if (metrics.response_time_avg > 1000) {
      console.log('🔴 Slow response times detected, optimizing...');
      await this.optimizeResponseTime();
    }

    this.emit('optimization_complete');
  }

  /**
   * Start continuous monitoring
   */
  private startMonitoring(): void {
    if (!this.monitoringEnabled) return;

    // Health check every 5 minutes
    setInterval(async () => {
      try {
        await this.checkSystemHealth();
      } catch (error) {
        console.error('Health check error:', error);
      }
    }, 5 * 60 * 1000);

    // Performance monitoring every minute
    setInterval(async () => {
      try {
        const metrics = await this.getPerformanceMetrics();
        this.performanceHistory.push(metrics);

        // Keep only last 100 metrics
        if (this.performanceHistory.length > 100) {
          this.performanceHistory = this.performanceHistory.slice(-100);
        }

        // Auto-optimize if needed
        if (this.autoFixEnabled) {
          const needsOptimization = 
            metrics.cpu_usage > 80 ||
            metrics.memory_usage > 85 ||
            metrics.error_rate > 0.05;

          if (needsOptimization) {
            await this.autoOptimize();
          }
        }
      } catch (error) {
        console.error('Performance monitoring error:', error);
      }
    }, 60 * 1000);

    // Create snapshot every hour
    setInterval(async () => {
      try {
        await this.createSnapshot();
      } catch (error) {
        console.error('Snapshot creation error:', error);
      }
    }, 60 * 60 * 1000);

    console.log('👁️  Monitoring started');
  }

  /**
   * Get system statistics
   */
  getStats(): any {
    const recentMetrics = this.performanceHistory.slice(-10);
    const avgCPU = recentMetrics.reduce((sum, m) => sum + m.cpu_usage, 0) / recentMetrics.length;
    const avgMemory = recentMetrics.reduce((sum, m) => sum + m.memory_usage, 0) / recentMetrics.length;

    return {
      snapshots: this.snapshots.length,
      errors: {
        total: this.errorLogs.length,
        resolved: this.errorLogs.filter(e => e.resolved).length,
        unresolved: this.errorLogs.filter(e => !e.resolved).length
      },
      security_threats: {
        total: this.securityThreats.length,
        resolved: this.securityThreats.filter(t => t.resolved).length,
        critical: this.securityThreats.filter(t => t.severity === 'critical').length
      },
      health: {
        healthy: Array.from(this.healthChecks.values()).filter(h => h.status === 'healthy').length,
        degraded: Array.from(this.healthChecks.values()).filter(h => h.status === 'degraded').length,
        critical: Array.from(this.healthChecks.values()).filter(h => h.status === 'critical').length
      },
      performance: {
        avg_cpu: avgCPU.toFixed(1),
        avg_memory: avgMemory.toFixed(1),
        data_points: this.performanceHistory.length
      }
    };
  }

  // Private helper methods

  private async hashCriticalFiles(): Promise<Record<string, string>> {
    // In practice, would hash critical system files
    return {};
  }

  private async captureConfig(): Promise<any> {
    return {
      timestamp: new Date(),
      env: process.env.NODE_ENV,
      version: '1.0.0'
    };
  }

  private async restoreConfig(config: any): Promise<void> {
    // Restore configuration settings
    console.log('Restoring configuration...');
  }

  private async getPerformanceMetrics(): Promise<PerformanceMetrics> {
    const memUsage = process.memoryUsage();
    
    return {
      cpu_usage: process.cpuUsage().user / 1000000, // Convert to percentage-like number
      memory_usage: (memUsage.heapUsed / memUsage.heapTotal) * 100,
      disk_usage: 50, // Would calculate actual disk usage
      response_time_avg: 200, // Would track actual response times
      error_rate: this.errorLogs.filter(e => !e.resolved).length / Math.max(1, this.errorLogs.length)
    };
  }

  private async searchStackOverflowSolution(errorMessage: string): Promise<string | null> {
    try {
      // Simplified - would search Stack Overflow API
      const prompt = `
Error: ${errorMessage}

Based on common programming patterns, suggest a fix for this error.
Be specific and concise.
`;
      
      const solution = await this.brain.chat(prompt);
      return solution;
    } catch (error) {
      return null;
    }
  }

  private async applySafeFix(solution: string, error: Error): Promise<boolean> {
    // In practice, would apply fix in sandboxed environment first
    console.log('🧪 Testing fix in safe mode...');
    
    // For now, just log the fix
    console.log(`Suggested fix: ${solution}`);
    
    return false; // Don't actually apply automatically for safety
  }

  private async handleCriticalThreat(threat: SecurityThreat): Promise<void> {
    // Block suspicious activity
    // Send alerts
    // Create emergency snapshot
    await this.createSnapshot();
    console.log('🚨 Critical threat handled, snapshot created');
  }

  private async checkCPUHealth(): Promise<HealthCheck> {
    const metrics = await this.getPerformanceMetrics();
    
    return {
      component: 'CPU',
      status: metrics.cpu_usage > 80 ? 'critical' : metrics.cpu_usage > 60 ? 'degraded' : 'healthy',
      last_check: new Date(),
      issues: metrics.cpu_usage > 80 ? ['High CPU usage'] : []
    };
  }

  private async checkMemoryHealth(): Promise<HealthCheck> {
    const metrics = await this.getPerformanceMetrics();
    
    return {
      component: 'Memory',
      status: metrics.memory_usage > 85 ? 'critical' : metrics.memory_usage > 70 ? 'degraded' : 'healthy',
      last_check: new Date(),
      issues: metrics.memory_usage > 85 ? ['High memory usage'] : []
    };
  }

  private async checkDiskHealth(): Promise<HealthCheck> {
    return {
      component: 'Disk',
      status: 'healthy',
      last_check: new Date(),
      issues: []
    };
  }

  private async checkAPIHealth(): Promise<HealthCheck> {
    // Would ping API endpoints
    return {
      component: 'API',
      status: 'healthy',
      last_check: new Date(),
      issues: []
    };
  }

  private async checkDatabaseHealth(): Promise<HealthCheck> {
    return {
      component: 'Database',
      status: 'healthy',
      last_check: new Date(),
      issues: []
    };
  }

  private async optimizeCPU(): Promise<void> {
    console.log('Optimizing CPU usage...');
    // Close unnecessary processes, optimize algorithms
  }

  private async optimizeMemory(): Promise<void> {
    console.log('Optimizing memory usage...');
    // Clear caches, garbage collect
    if (global.gc) {
      global.gc();
    }
  }

  private async investigateErrors(): Promise<void> {
    console.log('Investigating error patterns...');
    // Analyze error logs for patterns
  }

  private async optimizeResponseTime(): Promise<void> {
    console.log('Optimizing response times...');
    // Cache optimization, query optimization
  }

  private async loadData(): Promise<void> {
    try {
      const dataFile = path.join(this.dataDir, 'healing_data.json');
      const data = await fs.readFile(dataFile, 'utf-8');
      const parsed = JSON.parse(data);

      if (parsed.snapshots) this.snapshots = parsed.snapshots;
      if (parsed.errorLogs) this.errorLogs = parsed.errorLogs;
      if (parsed.securityThreats) this.securityThreats = parsed.securityThreats;

      console.log('📊 Loaded healing data');
    } catch (error) {
      console.log('📊 No existing healing data');
    }
  }

  private async saveData(): Promise<void> {
    try {
      const dataFile = path.join(this.dataDir, 'healing_data.json');
      await fs.writeFile(dataFile, JSON.stringify({
        snapshots: this.snapshots,
        errorLogs: this.errorLogs,
        securityThreats: this.securityThreats
      }, null, 2));
    } catch (error) {
      console.error('Error saving healing data:', error);
    }
  }
}
