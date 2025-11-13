/**
 * 👁️ REAL CAMERA MONITORING SERVICE
 * Real-time user detection, gesture recognition, and interaction
 * NO DEMO DATA - Everything is real working!
 */

import { EventEmitter } from 'events';
import { cameraVision } from './camera-vision';
import { macAutomation } from './mac-automation';

interface UserDetection {
  userPresent: boolean;
  confidence: number;
  timestamp: Date;
  description: string;
}

interface GestureDetection {
  gesture: string | null;
  confidence: number;
  timestamp: Date;
  description: string;
}

interface CameraMonitorConfig {
  enabled: boolean;
  checkInterval: number; // milliseconds
  gestureCheckInterval: number; // milliseconds
  greetOnDetection: boolean;
  respondToGestures: boolean;
  autoStart: boolean;
}

export class RealCameraMonitor extends EventEmitter {
  private config: CameraMonitorConfig;
  private isMonitoring: boolean = false;
  private userCheckInterval: NodeJS.Timeout | null = null;
  private gestureCheckInterval: NodeJS.Timeout | null = null;
  private lastUserDetection: UserDetection | null = null;
  private lastGestureDetection: GestureDetection | null = null;
  private userGreeted: boolean = false;

  constructor() {
    super();
    this.config = {
      enabled: process.env.CAMERA_MONITORING_ENABLED === 'true',
      checkInterval: 8000, // Check for user every 8 seconds (optimized)
      gestureCheckInterval: 6000, // Check for gestures every 6 seconds (optimized)
      greetOnDetection: true,
      respondToGestures: true,
      autoStart: false
    };
    
    console.log('👁️ Real Camera Monitor initialized');
  }

  /**
   * Initialize camera monitoring
   */
  async initialize(): Promise<void> {
    try {
      console.log('🔧 Initializing Real Camera Monitor...');
      
      // Initialize camera vision
      await cameraVision.initialize();
      
      if (!cameraVision.isReady()) {
        console.log('⚠️ Camera vision not ready - install llava model');
        console.log('📥 Run: ollama pull llava');
        this.config.enabled = false;
        return;
      }

      console.log('✅ Real Camera Monitor ready');
      
      if (this.config.autoStart) {
        await this.startMonitoring();
      }
    } catch (error) {
      console.error('❌ Camera Monitor initialization failed:', error);
      this.config.enabled = false;
    }
  }

  /**
   * Start real-time camera monitoring
   */
  async startMonitoring(): Promise<void> {
    if (!this.config.enabled) {
      throw new Error('Camera monitoring is disabled');
    }

    if (this.isMonitoring) {
      console.log('⚠️ Camera monitoring already active');
      return;
    }

    this.isMonitoring = true;
    this.userGreeted = false;
    
    console.log('👁️ Starting real-time camera monitoring...');
    console.log(`🔍 User detection: every ${this.config.checkInterval}ms`);
    console.log(`👋 Gesture detection: every ${this.config.gestureCheckInterval}ms`);

    // Start user presence monitoring
    this.userCheckInterval = setInterval(async () => {
      try {
        await this.checkUserPresence();
      } catch (error) {
        console.error('❌ User presence check failed:', error);
      }
    }, this.config.checkInterval);

    // Start gesture monitoring
    this.gestureCheckInterval = setInterval(async () => {
      try {
        await this.checkForGestures();
      } catch (error) {
        console.error('❌ Gesture check failed:', error);
      }
    }, this.config.gestureCheckInterval);

    console.log('✅ Real camera monitoring started');
    this.emit('monitoringStarted');
  }

  /**
   * Stop camera monitoring
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;
    
    if (this.userCheckInterval) {
      clearInterval(this.userCheckInterval);
      this.userCheckInterval = null;
    }

    if (this.gestureCheckInterval) {
      clearInterval(this.gestureCheckInterval);
      this.gestureCheckInterval = null;
    }

    console.log('🛑 Camera monitoring stopped');
    this.emit('monitoringStopped');
  }

  /**
   * Check for user presence in camera
   */
  private async checkUserPresence(): Promise<void> {
    try {
      console.log('👁️ Checking for user presence...');
      
      const detection = await cameraVision.detectUserPresence();
      
      const userDetection: UserDetection = {
        userPresent: detection.userPresent,
        confidence: detection.confidence,
        timestamp: new Date(),
        description: detection.description
      };

      // Check if user status changed
      const statusChanged = !this.lastUserDetection || 
        this.lastUserDetection.userPresent !== userDetection.userPresent;

      this.lastUserDetection = userDetection;

      if (statusChanged) {
        if (userDetection.userPresent) {
          console.log('👤 User detected in camera!');
          console.log(`📝 Description: ${userDetection.description}`);
          
          this.emit('userDetected', userDetection);
          
          // Greet user if enabled and not already greeted
          if (this.config.greetOnDetection && !this.userGreeted) {
            await this.greetUser();
            this.userGreeted = true;
          }
        } else {
          console.log('👻 User left camera view');
          this.emit('userLeft', userDetection);
          this.userGreeted = false; // Reset greeting for next time
        }
      }
    } catch (error) {
      console.error('❌ User presence check error:', error);
    }
  }

  /**
   * Check for hand gestures
   */
  private async checkForGestures(): Promise<void> {
    // Only check for gestures if user is present
    if (!this.lastUserDetection?.userPresent) {
      return;
    }

    try {
      console.log('👋 Checking for gestures...');
      
      const detection = await cameraVision.detectGesture();
      
      const gestureDetection: GestureDetection = {
        gesture: detection.gesture,
        confidence: detection.confidence,
        timestamp: new Date(),
        description: detection.description
      };

      // Only respond to gestures with good confidence
      if (gestureDetection.gesture && gestureDetection.confidence > 0.6) {
        console.log(`👋 Gesture detected: ${gestureDetection.gesture} (${Math.round(gestureDetection.confidence * 100)}%)`);
        console.log(`📝 Description: ${gestureDetection.description}`);
        
        this.lastGestureDetection = gestureDetection;
        this.emit('gestureDetected', gestureDetection);
        
        // Respond to gesture if enabled
        if (this.config.respondToGestures) {
          await this.respondToGesture(gestureDetection.gesture);
        }
      }
    } catch (error) {
      console.error('❌ Gesture check error:', error);
    }
  }

  /**
   * Greet user when detected
   */
  private async greetUser(): Promise<void> {
    try {
      const greetings = [
        'Hello! I can see you! 👋',
        'Hey there! Great to see you! 😊',
        'Hi! I detected you in the camera! 👁️',
        'Hello! Wave your hand if you can see this message! 👋',
        'Hey! I\'m watching and ready to help! 🤖'
      ];
      
      const greeting = greetings[Math.floor(Math.random() * greetings.length)];
      
      console.log(`🤖 RAGS: ${greeting}`);
      
      // Send notification
      await macAutomation.sendNotification('RAGS Camera', greeting);
      
      // Speak greeting if TTS is available
      try {
        await macAutomation.speak(greeting);
      } catch (error) {
        console.log('⚠️ TTS not available for greeting');
      }
      
      this.emit('userGreeted', greeting);
    } catch (error) {
      console.error('❌ Failed to greet user:', error);
    }
  }

  /**
   * Respond to detected gestures
   */
  private async respondToGesture(gesture: string): Promise<void> {
    try {
      let response = '';
      
      switch (gesture) {
        case 'wave':
          response = 'I see you waving! Hello there! 👋';
          break;
        case 'thumbs_up':
          response = 'Thumbs up! That\'s awesome! 👍';
          break;
        case 'peace':
          response = 'Peace sign detected! ✌️ Peace out!';
          break;
        case 'pointing':
          response = 'I see you pointing! What are you showing me? 👉';
          break;
        case 'greeting':
          response = 'Hello to you too! Nice to meet you! 😊';
          break;
        default:
          response = `I detected a ${gesture} gesture! Cool! 🤖`;
      }
      
      console.log(`🤖 RAGS Response: ${response}`);
      
      // Send notification
      await macAutomation.sendNotification('RAGS Gesture Response', response);
      
      // Speak response if TTS is available
      try {
        await macAutomation.speak(response);
      } catch (error) {
        console.log('⚠️ TTS not available for gesture response');
      }
      
      this.emit('gestureResponse', { gesture, response });
    } catch (error) {
      console.error('❌ Failed to respond to gesture:', error);
    }
  }

  /**
   * Take photo and analyze on demand
   */
  async analyzeCurrentView(question?: string): Promise<string> {
    try {
      if (question) {
        return await cameraVision.answerQuestion(question);
      } else {
        return await cameraVision.describeCurrentView();
      }
    } catch (error: any) {
      console.error('❌ Camera analysis failed:', error);
      throw error;
    }
  }

  /**
   * Get current monitoring status
   */
  getStatus(): {
    enabled: boolean;
    monitoring: boolean;
    cameraReady: boolean;
    lastUserDetection: UserDetection | null;
    lastGestureDetection: GestureDetection | null;
    config: CameraMonitorConfig;
  } {
    return {
      enabled: this.config.enabled,
      monitoring: this.isMonitoring,
      cameraReady: cameraVision.isReady(),
      lastUserDetection: this.lastUserDetection,
      lastGestureDetection: this.lastGestureDetection,
      config: this.config
    };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<CameraMonitorConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    console.log('🔧 Camera monitor config updated:', newConfig);
    
    // Restart monitoring if intervals changed
    if ((newConfig.checkInterval || newConfig.gestureCheckInterval) && this.isMonitoring) {
      this.stopMonitoring();
      setTimeout(() => this.startMonitoring(), 1000);
    }
  }

  /**
   * Enable/disable specific features
   */
  setFeature(feature: 'greetOnDetection' | 'respondToGestures', enabled: boolean): void {
    this.config[feature] = enabled;
    console.log(`🔧 ${feature} ${enabled ? 'enabled' : 'disabled'}`);
  }
}

// Export singleton
export const realCameraMonitor = new RealCameraMonitor();
