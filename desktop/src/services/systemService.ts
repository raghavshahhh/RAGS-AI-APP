/**
 * System Service - Connect to Backend Status APIs
 */

const API_BASE = 'http://localhost:3000';

export interface SystemStatus {
  success: boolean;
  server: {
    status: string;
    uptime: number;
    version: string;
    environment: string;
  };
  system: {
    memory: {
      used: number;
      total: number;
      unit: string;
    };
    cpu: any;
  };
  services: {
    websocket: {
      status: string;
      clients: number;
    };
    database: {
      status: string;
    };
  };
  timestamp: string;
}

export interface HealthStatus {
  status: string;
  timestamp: string;
  uptime: number;
  memory: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
    arrayBuffers: number;
  };
  services: {
    api: string;
    websocket: string;
    connectedClients: number;
  };
  version: string;
}

export const systemService = {
  /**
   * Get detailed system status
   */
  async getStatus(): Promise<SystemStatus | null> {
    try {
      const response = await fetch(`${API_BASE}/api/v1/status`);
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      return null;
    }
  },

  /**
   * Get health check
   */
  async getHealth(): Promise<HealthStatus | null> {
    try {
      const response = await fetch(`${API_BASE}/health`);
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      return null;
    }
  },

  /**
   * Get AI status
   */
  async getAIStatus(): Promise<any> {
    try {
      const response = await fetch(`${API_BASE}/api/real-ai/status`);
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      return null;
    }
  },

  /**
   * Format uptime as human-readable
   */
  formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  },

  /**
   * Format bytes as human-readable
   */
  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }
};
