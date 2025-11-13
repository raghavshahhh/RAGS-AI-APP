import { motion } from 'framer-motion';
import { X, Activity, Cpu, HardDrive, Wifi, RefreshCw } from 'lucide-react';
import { RAGSIcon } from './RAGSLogo';
import { useState, useEffect } from 'react';
import { systemService, SystemStatus, HealthStatus } from '../services/systemService';
import toast from 'react-hot-toast';

interface SystemMonitorPanelProps {
  onClose: () => void;
}

export default function SystemMonitorPanel({ onClose }: SystemMonitorPanelProps) {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [aiStatus, setAiStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    fetchData();
    
    if (autoRefresh) {
      const interval = setInterval(fetchData, 5000); // Refresh every 5 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const fetchData = async () => {
    const [statusData, healthData, aiData] = await Promise.all([
      systemService.getStatus(),
      systemService.getHealth(),
      systemService.getAIStatus()
    ]);
    
    setStatus(statusData);
    setHealth(healthData);
    setAiStatus(aiData);
  };

  const refresh = async () => {
    setLoading(true);
    await fetchData();
    setLoading(false);
    toast.success('System data refreshed');
  };

  const getStatusColor = (status: string) => {
    if (status === 'healthy' || status === 'operational' || status === 'running') {
      return 'text-green-400';
    }
    return 'text-yellow-400';
  };

  const getMemoryPercentage = (used: number, total: number) => {
    return Math.round((used / total) * 100);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="glass w-[800px] max-h-[80vh] rounded-3xl p-6 overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <RAGSIcon size={40} />
            <div>
              <h2 className="text-2xl font-bold text-white">System Monitor</h2>
              <p className="text-xs text-muted">Real-time system status</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-3 py-2 rounded-lg transition-colors ${
                autoRefresh ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
              }`}
            >
              {autoRefresh ? 'Auto-Refresh On' : 'Auto-Refresh Off'}
            </button>
            <button
              onClick={refresh}
              disabled={loading}
              className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
            </button>
            <button onClick={onClose} className="text-muted hover:text-white transition-colors">
              <X size={24} />
            </button>
          </div>
        </div>

        {!status && !health ? (
          <div className="text-center text-muted py-8">Loading system data...</div>
        ) : (
          <div className="space-y-4">
            {/* Server Status */}
            {status && (
              <div className="glass p-4 rounded-xl">
                <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <Activity size={16} className="text-primary" />
                  Server Status
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted">Status</p>
                    <p className={`text-lg font-semibold ${getStatusColor(status.server.status)}`}>
                      {status.server.status}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted">Uptime</p>
                    <p className="text-lg font-semibold text-white">
                      {systemService.formatUptime(status.server.uptime)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted">Version</p>
                    <p className="text-lg font-semibold text-white">{status.server.version}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted">Environment</p>
                    <p className="text-lg font-semibold text-white">{status.server.environment}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Memory Usage */}
            {status && (
              <div className="glass p-4 rounded-xl">
                <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <HardDrive size={16} className="text-primary" />
                  Memory Usage
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-white">
                      {status.system.memory.used} / {status.system.memory.total} {status.system.memory.unit}
                    </span>
                    <span className="text-primary font-semibold">
                      {getMemoryPercentage(status.system.memory.used, status.system.memory.total)}%
                    </span>
                  </div>
                  <div className="w-full bg-dark/50 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-primary to-secondary h-3 rounded-full transition-all"
                      style={{ 
                        width: `${getMemoryPercentage(status.system.memory.used, status.system.memory.total)}%` 
                      }}
                    />
                  </div>
                </div>
                
                {health && (
                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-muted">RSS</p>
                      <p className="text-white">{systemService.formatBytes(health.memory.rss)}</p>
                    </div>
                    <div>
                      <p className="text-muted">Heap Used</p>
                      <p className="text-white">{systemService.formatBytes(health.memory.heapUsed)}</p>
                    </div>
                    <div>
                      <p className="text-muted">Heap Total</p>
                      <p className="text-white">{systemService.formatBytes(health.memory.heapTotal)}</p>
                    </div>
                    <div>
                      <p className="text-muted">External</p>
                      <p className="text-white">{systemService.formatBytes(health.memory.external)}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Services */}
            {status && (
              <div className="glass p-4 rounded-xl">
                <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <Wifi size={16} className="text-primary" />
                  Services
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-white">WebSocket</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm ${getStatusColor(status.services.websocket.status)}`}>
                        {status.services.websocket.status}
                      </span>
                      <span className="text-xs text-muted">
                        {status.services.websocket.clients} clients
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white">Database</span>
                    <span className={`text-sm ${getStatusColor(status.services.database.status)}`}>
                      {status.services.database.status}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* AI Status */}
            {aiStatus && (
              <div className="glass p-4 rounded-xl">
                <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <Cpu size={16} className="text-primary" />
                  AI Status
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted">Initialized</p>
                    <p className={`text-lg font-semibold ${aiStatus.initialized ? 'text-green-400' : 'text-red-400'}`}>
                      {aiStatus.initialized ? 'Yes' : 'No'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted">Connected Clients</p>
                    <p className="text-lg font-semibold text-white">
                      {aiStatus.connectedClients || 0}
                    </p>
                  </div>
                  {aiStatus.features && (
                    <>
                      <div>
                        <p className="text-xs text-muted">Vision</p>
                        <p className={`text-sm font-semibold ${aiStatus.features.vision ? 'text-green-400' : 'text-gray-400'}`}>
                          {aiStatus.features.vision ? 'Enabled' : 'Disabled'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted">TTS</p>
                        <p className={`text-sm font-semibold ${aiStatus.features.tts ? 'text-green-400' : 'text-gray-400'}`}>
                          {aiStatus.features.tts ? 'Enabled' : 'Disabled'}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Timestamp */}
            {status && (
              <div className="text-center text-xs text-muted">
                Last updated: {new Date(status.timestamp).toLocaleTimeString()}
              </div>
            )}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
