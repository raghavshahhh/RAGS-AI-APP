/**
 * 🔌 WEBSOCKET SERVER
 * Real-time communication between frontend and backend
 */

import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { masterIntegration } from './master-integration';
import { realCameraMonitor } from './real-camera-monitor';
import { backgroundMonitor } from './background-monitor';

export class WebSocketServer {
  private io: SocketIOServer;
  private connectedClients: Set<string> = new Set();

  constructor(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: ["http://localhost:1420", "http://localhost:8081", "http://localhost:3000"],
        methods: ["GET", "POST"],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    this.setupEventHandlers();
    this.setupMasterIntegrationEvents();
    console.log('🔌 WebSocket server initialized');
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket) => {
      console.log(`👤 Client connected: ${socket.id}`);
      this.connectedClients.add(socket.id);

      // Send welcome message with system status
      socket.emit('system_status', {
        type: 'welcome',
        message: 'Connected to RAGS AI',
        capabilities: masterIntegration.getSystemStatus().capabilities,
        timestamp: new Date().toISOString()
      });

      // Handle client events
      socket.on('request_status', () => {
        socket.emit('system_status', {
          type: 'status_update',
          status: masterIntegration.getSystemStatus(),
          timestamp: new Date().toISOString()
        });
      });

      socket.on('start_camera', async () => {
        try {
          await realCameraMonitor.startMonitoring();
          socket.emit('camera_status', {
            type: 'camera_started',
            message: 'Camera monitoring started',
            timestamp: new Date().toISOString()
          });
        } catch (error: any) {
          socket.emit('error', {
            type: 'camera_error',
            message: error.message,
            timestamp: new Date().toISOString()
          });
        }
      });

      socket.on('stop_camera', async () => {
        try {
          await realCameraMonitor.stopMonitoring();
          socket.emit('camera_status', {
            type: 'camera_stopped',
            message: 'Camera monitoring stopped',
            timestamp: new Date().toISOString()
          });
        } catch (error: any) {
          socket.emit('error', {
            type: 'camera_error',
            message: error.message,
            timestamp: new Date().toISOString()
          });
        }
      });

      socket.on('send_command', async (data) => {
        try {
          const { command, context = '' } = data;
          const response = await masterIntegration.processCommand(command, context);
          
          socket.emit('command_response', {
            type: 'command_result',
            command,
            response,
            timestamp: new Date().toISOString()
          });
        } catch (error: any) {
          socket.emit('error', {
            type: 'command_error',
            message: error.message,
            timestamp: new Date().toISOString()
          });
        }
      });

      socket.on('disconnect', () => {
        console.log(`👋 Client disconnected: ${socket.id}`);
        this.connectedClients.delete(socket.id);
      });
    });
  }

  private setupMasterIntegrationEvents(): void {
    // User detection events
    masterIntegration.on('userDetected', (data) => {
      this.broadcast('user_detected', {
        type: 'user_presence',
        detected: true,
        confidence: data.confidence,
        timestamp: new Date().toISOString()
      });
    });

    masterIntegration.on('userGreeted', (greeting) => {
      this.broadcast('user_greeted', {
        type: 'greeting',
        message: greeting,
        timestamp: new Date().toISOString()
      });
    });

    // Gesture detection events
    masterIntegration.on('gestureDetected', (gesture) => {
      this.broadcast('gesture_detected', {
        type: 'gesture',
        gesture: gesture.gesture,
        confidence: gesture.confidence,
        timestamp: new Date().toISOString()
      });
    });

    masterIntegration.on('gestureResponse', (response) => {
      this.broadcast('gesture_response', {
        type: 'gesture_response',
        response: response.response,
        timestamp: new Date().toISOString()
      });
    });

    // Mouse events
    masterIntegration.on('mouseAction', (action) => {
      this.broadcast('mouse_action', {
        type: 'mouse_event',
        action: action.type,
        data: action.data,
        timestamp: new Date().toISOString()
      });
    });

    // Background monitoring events
    backgroundMonitor.on('contextChanged', (context) => {
      this.broadcast('context_changed', {
        type: 'context_update',
        context,
        timestamp: new Date().toISOString()
      });
    });

    // Conversation events
    masterIntegration.on('conversationStarted', (data) => {
      this.broadcast('conversation_started', {
        type: 'conversation_event',
        userId: data.userId,
        timestamp: new Date().toISOString()
      });
    });

    masterIntegration.on('responseGenerated', (data) => {
      this.broadcast('response_generated', {
        type: 'ai_response',
        text: data.text,
        timestamp: new Date().toISOString()
      });
    });
  }

  private broadcast(event: string, data: any): void {
    this.io.emit(event, data);
  }

  public sendToClient(clientId: string, event: string, data: any): void {
    this.io.to(clientId).emit(event, data);
  }

  public getConnectedClients(): number {
    return this.connectedClients.size;
  }

  public close(): void {
    this.io.close();
    console.log('🔌 WebSocket server closed');
  }
}

// Export singleton instance (will be initialized in main server)
export let webSocketServer: WebSocketServer | null = null;

export function initializeWebSocketServer(httpServer: HTTPServer): WebSocketServer {
  webSocketServer = new WebSocketServer(httpServer);
  return webSocketServer;
}
