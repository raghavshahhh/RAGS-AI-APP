// ============================================================================
// Enhanced WebSocket Service - Real-time Communication
// ============================================================================

type MessageHandler = (data: any) => void;
type EventType = 'connected' | 'disconnected' | 'error' | 'message' | 'heartbeat' | 'reconnecting';

interface WebSocketConfig {
  url: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
  debug?: boolean;
}

export class EnhancedWebSocketService {
  private ws: WebSocket | null = null;
  private config: Required<WebSocketConfig>;
  private reconnectAttempts: number = 0;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private messageHandlers: Map<string, Set<MessageHandler>> = new Map();
  private eventHandlers: Map<EventType, Set<Function>> = new Map();
  private isConnecting: boolean = false;
  private shouldReconnect: boolean = true;
  private messageQueue: any[] = [];
  private clientId: string | null = null;

  constructor(config: WebSocketConfig) {
    this.config = {
      url: config.url,
      reconnectInterval: config.reconnectInterval || 3000,
      maxReconnectAttempts: config.maxReconnectAttempts || 10,
      heartbeatInterval: config.heartbeatInterval || 30000,
      debug: config.debug || false,
    };
  }

  /**
   * Connect to WebSocket server
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.log('Already connected');
        resolve();
        return;
      }

      if (this.isConnecting) {
        this.log('Connection already in progress');
        return;
      }

      this.isConnecting = true;
      this.log(`Connecting to ${this.config.url}...`);

      try {
        this.ws = new WebSocket(this.config.url);

        this.ws.onopen = () => {
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.log('✅ Connected to WebSocket');
          this.emit('connected', {});
          this.startHeartbeat();
          this.processMessageQueue();
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
          } catch (error) {
            this.log('Failed to parse message:', error);
          }
        };

        this.ws.onerror = (error) => {
          this.isConnecting = false;
          this.log('❌ WebSocket error:', error);
          this.emit('error', { error });
          reject(error);
        };

        this.ws.onclose = (event) => {
          this.isConnecting = false;
          this.log(`🔌 WebSocket closed (code: ${event.code}, reason: ${event.reason})`);
          this.emit('disconnected', { code: event.code, reason: event.reason });
          this.stopHeartbeat();

          if (this.shouldReconnect && this.reconnectAttempts < this.config.maxReconnectAttempts) {
            this.scheduleReconnect();
          }
        };
      } catch (error) {
        this.isConnecting = false;
        this.log('Failed to create WebSocket:', error);
        reject(error);
      }
    });
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect(): void {
    this.shouldReconnect = false;
    this.stopHeartbeat();
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.ws) {
      this.ws.close(1000, 'Client disconnecting');
      this.ws = null;
    }

    this.log('Disconnected');
  }

  /**
   * Send message
   */
  send(type: string, data?: any): void {
    const message = {
      type,
      ...data,
      timestamp: new Date().toISOString(),
    };

    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
      this.log('📤 Sent:', type);
    } else {
      // Queue message for later
      this.messageQueue.push(message);
      this.log('📝 Queued message:', type);
    }
  }

  /**
   * Subscribe to specific message type
   */
  on(type: string, handler: MessageHandler): void {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, new Set());
    }
    this.messageHandlers.get(type)!.add(handler);
    this.log(`Subscribed to: ${type}`);
  }

  /**
   * Unsubscribe from message type
   */
  off(type: string, handler: MessageHandler): void {
    const handlers = this.messageHandlers.get(type);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.messageHandlers.delete(type);
      }
    }
  }

  /**
   * Subscribe to events
   */
  addEventListener(event: EventType, handler: Function): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);
  }

  /**
   * Unsubscribe from events
   */
  removeEventListener(event: EventType, handler: Function): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  /**
   * Get connection state
   */
  getState(): 'connecting' | 'open' | 'closing' | 'closed' {
    if (!this.ws) return 'closed';
    
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING:
        return 'connecting';
      case WebSocket.OPEN:
        return 'open';
      case WebSocket.CLOSING:
        return 'closing';
      case WebSocket.CLOSED:
        return 'closed';
      default:
        return 'closed';
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Get client ID
   */
  getClientId(): string | null {
    return this.clientId;
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Handle incoming message
   */
  private handleMessage(data: any): void {
    this.log('📥 Received:', data.type || 'unknown');

    // Handle special message types
    switch (data.type) {
      case 'connected':
        this.clientId = data.clientId;
        this.log(`Client ID: ${this.clientId}`);
        break;

      case 'heartbeat':
        // Respond to heartbeat
        this.send('pong');
        break;

      case 'error':
        this.log('Server error:', data.error);
        break;
    }

    // Emit to specific handlers
    const handlers = this.messageHandlers.get(data.type);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          this.log('Handler error:', error);
        }
      });
    }

    // Emit generic message event
    this.emit('message', data);
  }

  /**
   * Emit event to listeners
   */
  private emit(event: EventType, data: any): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          this.log('Event handler error:', error);
        }
      });
    }
  }

  /**
   * Schedule reconnection
   */
  private scheduleReconnect(): void {
    this.reconnectAttempts++;
    const delay = Math.min(
      this.config.reconnectInterval * Math.pow(1.5, this.reconnectAttempts - 1),
      30000
    );

    this.log(`🔄 Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.config.maxReconnectAttempts})...`);
    this.emit('reconnecting', { attempt: this.reconnectAttempts, delay });

    this.reconnectTimeout = setTimeout(() => {
      this.connect().catch(error => {
        this.log('Reconnection failed:', error);
      });
    }, delay);
  }

  /**
   * Start heartbeat
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();
    
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected()) {
        this.send('ping');
      }
    }, this.config.heartbeatInterval);
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Process queued messages
   */
  private processMessageQueue(): void {
    if (this.messageQueue.length === 0) return;

    this.log(`Processing ${this.messageQueue.length} queued messages...`);
    
    while (this.messageQueue.length > 0 && this.isConnected()) {
      const message = this.messageQueue.shift();
      if (message && this.ws) {
        this.ws.send(JSON.stringify(message));
      }
    }
  }

  /**
   * Debug logging
   */
  private log(...args: any[]): void {
    if (this.config.debug) {
      console.log('[WebSocket]', ...args);
    }
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.disconnect();
    this.messageHandlers.clear();
    this.eventHandlers.clear();
    this.messageQueue = [];
  }
}

// Export singleton instance
export const wsService = new EnhancedWebSocketService({
  url: 'ws://localhost:3000',
  debug: true,
});

export default wsService;
