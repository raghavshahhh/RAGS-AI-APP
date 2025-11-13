class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;
  private messageHandlers: Map<string, (data: any) => void> = new Map();

  connect() {
    if (this.ws?.readyState === WebSocket.OPEN) return;

    try {
      this.ws = new WebSocket('ws://localhost:3000');

      this.ws.onopen = () => {
        console.log('✅ WebSocket connected');
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const handler = this.messageHandlers.get(data.type);
          if (handler) handler(data);
        } catch (error) {
          console.warn('Failed to parse WebSocket message:', error);
        }
      };

      this.ws.onerror = (error) => {
        // Silently ignore WebSocket errors (graceful degradation)
        console.debug('WebSocket connection unavailable (optional feature)');
      };

      this.ws.onclose = () => {
        console.debug('WebSocket closed');
        // Don't reconnect automatically - WebSocket is optional
        // if (this.reconnectAttempts < this.maxReconnectAttempts) {
        //   setTimeout(() => {
        //     this.reconnectAttempts++;
        //     this.connect();
        //   }, this.reconnectDelay);
        // }
      };
    } catch (error) {
      console.debug('WebSocket not available (optional feature)');
    }
  }

  send(type: string, data: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, data }));
    }
  }

  on(type: string, handler: (data: any) => void) {
    this.messageHandlers.set(type, handler);
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export const wsService = new WebSocketService();
