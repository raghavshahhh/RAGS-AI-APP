/**
 * 📊 ENHANCED SYSTEM MONITOR
 * Real-time system monitoring with performance metrics
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Activity, 
  Cpu, 
  HardDrive, 
  Wifi, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  RefreshCw,
  Zap,
  TrendingUp,
} from 'lucide-react';

interface SystemMetrics {
  cpu: { usage: number; cores: number };
  memory: { usage: number; used: number; total: number };
  ollama: { status: string; responseTime: number };
  services: { active: number; errors: number };
  uptime: number;
  responseTime: number;
}

interface PerformanceAlert {
  type: string;
  severity: 'warning' | 'critical';
  message: string;
  timestamp: string;
}

const EnhancedSystemMonitor: React.FC = () => {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch system metrics
  const fetchMetrics = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/system/performance');
      if (response.ok) {
        const data = await response.json();
        setMetrics(data.current ? {
          cpu: { usage: parseFloat(data.current.cpu), cores: 8 },
          memory: { usage: parseFloat(data.current.memory), used: 0, total: 0 },
          ollama: { status: data.current.ollama || 'offline', responseTime: 0 },
          services: { active: 10, errors: 0 },
          uptime: data.uptime || 0,
          responseTime: data.responseTime || 0
        } : null);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch alerts
  const fetchAlerts = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/system/errors');
      if (response.ok) {
        await response.json(); // Parse response but don't use data yet
        // Mock alerts for now - will be populated with real data later
        setAlerts([]);
      }
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    }
  };

  // Auto-refresh effect
  useEffect(() => {
    fetchMetrics();
    fetchAlerts();

    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchMetrics();
        fetchAlerts();
      }, 5000); // Update every 5 seconds

      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  // Manual refresh
  const handleRefresh = () => {
    setIsLoading(true);
    fetchMetrics();
    fetchAlerts();
  };

  // Optimize system
  const handleOptimize = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/system/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'general' })
      });
      
      if (response.ok) {
        // Show success message
        setTimeout(() => fetchMetrics(), 1000);
      }
    } catch (error) {
      console.error('Optimization failed:', error);
    }
  };

  // Get status color
  const getStatusColor = (value: number, type: 'cpu' | 'memory') => {
    if (type === 'cpu' || type === 'memory') {
      if (value > 90) return 'text-red-400';
      if (value > 70) return 'text-yellow-400';
      return 'text-green-400';
    }
    return 'text-blue-400';
  };

  // Format uptime
  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  if (isLoading && !metrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <RefreshCw className="w-8 h-8 text-blue-400" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Activity className="w-6 h-6 text-blue-400" />
          <h2 className="text-xl font-bold text-white">System Monitor</h2>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-1 rounded-lg text-sm transition-colors ${
              autoRefresh 
                ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
            }`}
          >
            Auto Refresh
          </button>
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="p-2 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleOptimize}
            className="px-3 py-2 rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/30 hover:bg-purple-500/30 transition-colors flex items-center space-x-2"
          >
            <Zap className="w-4 h-4" />
            <span>Optimize</span>
          </button>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CPU Usage */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-black/40 backdrop-blur-sm rounded-xl p-4 border border-white/10"
        >
          <div className="flex items-center justify-between mb-2">
            <Cpu className="w-5 h-5 text-blue-400" />
            <span className={`text-sm font-medium ${getStatusColor(metrics?.cpu.usage || 0, 'cpu')}`}>
              {metrics?.cpu.usage.toFixed(1) || '0'}%
            </span>
          </div>
          <h3 className="text-white font-medium">CPU Usage</h3>
          <div className="mt-2 bg-gray-700 rounded-full h-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${metrics?.cpu.usage || 0}%` }}
              className={`h-2 rounded-full ${
                (metrics?.cpu.usage || 0) > 90 ? 'bg-red-400' :
                (metrics?.cpu.usage || 0) > 70 ? 'bg-yellow-400' : 'bg-green-400'
              }`}
            />
          </div>
        </motion.div>

        {/* Memory Usage */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-black/40 backdrop-blur-sm rounded-xl p-4 border border-white/10"
        >
          <div className="flex items-center justify-between mb-2">
            <HardDrive className="w-5 h-5 text-green-400" />
            <span className={`text-sm font-medium ${getStatusColor(metrics?.memory.usage || 0, 'memory')}`}>
              {metrics?.memory.usage.toFixed(1) || '0'}%
            </span>
          </div>
          <h3 className="text-white font-medium">Memory</h3>
          <div className="mt-2 bg-gray-700 rounded-full h-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${metrics?.memory.usage || 0}%` }}
              className={`h-2 rounded-full ${
                (metrics?.memory.usage || 0) > 90 ? 'bg-red-400' :
                (metrics?.memory.usage || 0) > 70 ? 'bg-yellow-400' : 'bg-green-400'
              }`}
            />
          </div>
        </motion.div>

        {/* Ollama Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-black/40 backdrop-blur-sm rounded-xl p-4 border border-white/10"
        >
          <div className="flex items-center justify-between mb-2">
            <Wifi className="w-5 h-5 text-purple-400" />
            {metrics?.ollama.status === 'online' ? (
              <CheckCircle className="w-5 h-5 text-green-400" />
            ) : (
              <XCircle className="w-5 h-5 text-red-400" />
            )}
          </div>
          <h3 className="text-white font-medium">Ollama AI</h3>
          <p className={`text-sm mt-1 ${
            metrics?.ollama.status === 'online' ? 'text-green-400' : 'text-red-400'
          }`}>
            {metrics?.ollama.status || 'Unknown'}
          </p>
        </motion.div>

        {/* Uptime */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-black/40 backdrop-blur-sm rounded-xl p-4 border border-white/10"
        >
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-5 h-5 text-cyan-400" />
            <span className="text-sm font-medium text-cyan-400">
              {formatUptime(metrics?.uptime || 0)}
            </span>
          </div>
          <h3 className="text-white font-medium">Uptime</h3>
          <p className="text-sm text-gray-400 mt-1">System running</p>
        </motion.div>
      </div>

      {/* Performance Chart Placeholder */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-black/40 backdrop-blur-sm rounded-xl p-6 border border-white/10"
      >
        <h3 className="text-white font-medium mb-4 flex items-center space-x-2">
          <TrendingUp className="w-5 h-5 text-blue-400" />
          <span>Performance Trends</span>
        </h3>
        <div className="h-32 flex items-center justify-center text-gray-400">
          <p>Real-time performance chart coming soon...</p>
        </div>
      </motion.div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-black/40 backdrop-blur-sm rounded-xl p-6 border border-white/10"
        >
          <h3 className="text-white font-medium mb-4 flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-yellow-400" />
            <span>System Alerts</span>
          </h3>
          <div className="space-y-2">
            {alerts.map((alert, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border ${
                  alert.severity === 'critical' 
                    ? 'bg-red-500/10 border-red-500/30 text-red-400'
                    : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
                }`}
              >
                <p className="text-sm">{alert.message}</p>
                <p className="text-xs opacity-70 mt-1">{alert.timestamp}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Last Update */}
      <div className="text-center text-sm text-gray-400">
        Last updated: {lastUpdate.toLocaleTimeString()}
      </div>
    </div>
  );
};

export default EnhancedSystemMonitor;
