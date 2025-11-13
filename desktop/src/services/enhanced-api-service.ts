// ============================================================================
// Enhanced API Service - Better Error Handling & Retry Logic
// ============================================================================

import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';

interface RequestConfig extends AxiosRequestConfig {
  retries?: number;
  retryDelay?: number;
  skipRetry?: boolean;
}

interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp?: string;
}

interface ConnectionStatus {
  connected: boolean;
  lastCheck: number;
  latency: number;
}

export class EnhancedAPIService {
  private api: AxiosInstance;
  private baseURL: string;
  private connectionStatus: ConnectionStatus = {
    connected: false,
    lastCheck: 0,
    latency: 0,
  };
  private requestQueue: Array<() => Promise<any>> = [];
  private isProcessingQueue: boolean = false;
  private maxQueueSize: number = 50;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private eventListeners: Map<string, Set<Function>> = new Map();

  constructor(baseURL: string = 'http://localhost:3000') {
    this.baseURL = baseURL;
    this.api = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor
    this.api.interceptors.request.use(
      (config) => {
        config.headers['X-Client-ID'] = this.getClientId();
        config.headers['X-Request-Time'] = Date.now().toString();
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.api.interceptors.response.use(
      (response) => {
        // Calculate latency
        const requestTime = parseInt(response.config.headers['X-Request-Time'] as string);
        const latency = Date.now() - requestTime;
        this.connectionStatus.latency = latency;

        return response;
      },
      (error) => this.handleError(error)
    );

    // Start health checks
    this.startHealthChecks();
  }

  /**
   * Make API request with retry logic
   */
  private async requestWithRetry<T>(
    config: RequestConfig
  ): Promise<APIResponse<T>> {
    const maxRetries = config.retries || 3;
    const retryDelay = config.retryDelay || 1000;
    let lastError: any;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await this.api.request<APIResponse<T>>(config);
        
        // Update connection status
        this.connectionStatus.connected = true;
        this.connectionStatus.lastCheck = Date.now();
        
        return response.data;
      } catch (error: any) {
        lastError = error;

        // Don't retry on certain errors
        if (
          config.skipRetry ||
          error.response?.status === 400 ||
          error.response?.status === 401 ||
          error.response?.status === 403 ||
          error.response?.status === 404
        ) {
          break;
        }

        // Wait before retrying
        if (attempt < maxRetries) {
          const delay = retryDelay * Math.pow(2, attempt);
          console.log(`⚠️ Request failed, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
          await this.sleep(delay);
        }
      }
    }

    // All retries failed
    this.connectionStatus.connected = false;
    throw lastError;
  }

  /**
   * GET request
   */
  async get<T = any>(url: string, config: RequestConfig = {}): Promise<APIResponse<T>> {
    return this.requestWithRetry<T>({ ...config, method: 'GET', url });
  }

  /**
   * POST request
   */
  async post<T = any>(url: string, data?: any, config: RequestConfig = {}): Promise<APIResponse<T>> {
    return this.requestWithRetry<T>({ ...config, method: 'POST', url, data });
  }

  /**
   * PUT request
   */
  async put<T = any>(url: string, data?: any, config: RequestConfig = {}): Promise<APIResponse<T>> {
    return this.requestWithRetry<T>({ ...config, method: 'PUT', url, data });
  }

  /**
   * DELETE request
   */
  async delete<T = any>(url: string, config: RequestConfig = {}): Promise<APIResponse<T>> {
    return this.requestWithRetry<T>({ ...config, method: 'DELETE', url });
  }

  /**
   * Send chat message to AI
   */
  async chat(message: string): Promise<APIResponse<{ text: string; action?: any; emotion?: string }>> {
    try {
      const response = await this.post('/api/real-ai/chat', { message });
      
      if (response.success) {
        this.emit('chat_response', response.data);
      }
      
      return response;
    } catch (error: any) {
      console.error('Chat error:', error);
      return {
        success: false,
        error: error.message || 'Failed to send message',
      };
    }
  }

  /**
   * Initialize AI system
   */
  async initializeAI(userId: string = 'user1'): Promise<APIResponse> {
    return this.post('/api/real-ai/initialize', { userId }, { retries: 1 });
  }

  /**
   * Camera vision request
   */
  async analyzeCamera(question: string): Promise<APIResponse<{ answer: string }>> {
    return this.post('/api/camera-vision/ask', { question });
  }

  /**
   * Browser control
   */
  async browserControl(action: string, params?: any): Promise<APIResponse> {
    return this.post(`/api/browser-control/${action}`, params);
  }

  /**
   * Get system status
   */
  async getStatus(): Promise<APIResponse<{
    server: any;
    system: any;
    services: any;
  }>> {
    return this.get('/api/v1/status', { skipRetry: true });
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const startTime = Date.now();
      const response = await this.api.get('/health', { timeout: 5000 });
      
      this.connectionStatus.connected = response.status === 200;
      this.connectionStatus.lastCheck = Date.now();
      this.connectionStatus.latency = Date.now() - startTime;
      
      this.emit('connection_status', this.connectionStatus);
      
      return this.connectionStatus.connected;
    } catch (error) {
      this.connectionStatus.connected = false;
      this.connectionStatus.lastCheck = Date.now();
      this.emit('connection_status', this.connectionStatus);
      return false;
    }
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): ConnectionStatus {
    return { ...this.connectionStatus };
  }

  /**
   * Add to request queue
   */
  private async addToQueue<T>(request: () => Promise<T>): Promise<T> {
    if (this.requestQueue.length >= this.maxQueueSize) {
      throw new Error('Request queue is full');
    }

    return new Promise((resolve, reject) => {
      this.requestQueue.push(async () => {
        try {
          const result = await request();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      this.processQueue();
    });
  }

  /**
   * Process request queue
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.requestQueue.length > 0) {
      const request = this.requestQueue.shift();
      if (request) {
        try {
          await request();
        } catch (error) {
          console.error('Queue request failed:', error);
        }
        
        // Small delay between requests
        await this.sleep(100);
      }
    }

    this.isProcessingQueue = false;
  }

  /**
   * Start periodic health checks
   */
  private startHealthChecks(): void {
    // Initial check
    this.healthCheck();

    // Check every 10 seconds
    this.healthCheckInterval = setInterval(() => {
      this.healthCheck();
    }, 10000);
  }

  /**
   * Stop health checks
   */
  stopHealthChecks(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  /**
   * Event emitter
   */
  on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);
  }

  /**
   * Remove event listener
   */
  off(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(callback);
    }
  }

  /**
   * Emit event
   */
  private emit(event: string, data?: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }

  /**
   * Handle errors
   */
  private handleError(error: AxiosError): Promise<never> {
    if (error.response) {
      // Server responded with error
      console.error('API Error:', error.response.status, error.response.data);
      this.emit('api_error', {
        status: error.response.status,
        data: error.response.data,
      });
    } else if (error.request) {
      // Request made but no response
      console.error('Network Error: No response from server');
      this.connectionStatus.connected = false;
      this.emit('network_error', { message: 'No response from server' });
    } else {
      // Error in request setup
      console.error('Request Error:', error.message);
    }

    return Promise.reject(error);
  }

  /**
   * Utilities
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private getClientId(): string {
    let clientId = localStorage.getItem('rags_client_id');
    if (!clientId) {
      clientId = `client_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      localStorage.setItem('rags_client_id', clientId);
    }
    return clientId;
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.stopHealthChecks();
    this.eventListeners.clear();
    this.requestQueue = [];
  }
}

// Export singleton instance
export const apiService = new EnhancedAPIService();
export default apiService;
