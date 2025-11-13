// ============================================================================
// EYE TRACKING - Attention-based triggering and focus detection
// ============================================================================

import { EventEmitter } from 'events';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface EyeData {
  looking: boolean;
  attention: number; // 0-100
  focusPoint?: { x: number; y: number };
  blinkRate?: number;
  gazeDirection?: 'center' | 'left' | 'right' | 'up' | 'down';
}

interface AttentionTrigger {
  duration: number; // milliseconds
  threshold: number; // attention level
  callback: () => void;
}

export class EyeTracking extends EventEmitter {
  private enabled: boolean = false;
  private checkInterval: NodeJS.Timeout | null = null;
  private lastEyeData: EyeData | null = null;
  private triggers: AttentionTrigger[] = [];
  private attentionStartTime: number | null = null;

  constructor() {
    super();
  }

  /**
   * Initialize eye tracking
   */
  async initialize(): Promise<void> {
    console.log('👁️ Eye tracking initialized (simulated mode)');
    console.log('⚠️ Note: Full eye tracking requires specialized hardware');
  }

  /**
   * Start eye tracking
   */
  async start(): Promise<void> {
    if (this.enabled) return;

    this.enabled = true;
    console.log('👀 Eye tracking started');

    // Check eye status every 1 second
    this.checkInterval = setInterval(async () => {
      await this.detectEyes();
    }, 1000);

    // Initial detection
    await this.detectEyes();
  }

  /**
   * Stop eye tracking
   */
  stop(): void {
    this.enabled = false;
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    console.log('🛑 Eye tracking stopped');
  }

  /**
   * Detect eye position and attention (simulated)
   * In production, integrate with:
   * - Tobii Eye Tracker
   * - Gazepoint
   * - EyeTribe
   * - Or webcam-based libraries like webgazer.js
   */
  private async detectEyes(): Promise<void> {
    if (!this.enabled) return;

    try {
      // Simulate eye detection based on system activity
      const eyeData = await this.simulateEyeDetection();

      // Check if data changed
      if (this.hasEyeDataChanged(eyeData)) {
        this.lastEyeData = eyeData;
        this.emit('eye_data', eyeData);

        if (eyeData.looking) {
          // User is looking at screen
          if (!this.attentionStartTime) {
            this.attentionStartTime = Date.now();
            this.emit('attention_gained');
            console.log('👁️ User attention detected');
          }

          // Check triggers
          this.checkTriggers(eyeData);
        } else {
          // User looked away
          if (this.attentionStartTime) {
            this.attentionStartTime = null;
            this.emit('attention_lost');
            console.log('👻 User attention lost');
          }
        }

        // Emit specific gaze events
        if (eyeData.gazeDirection) {
          this.emit('gaze_direction', eyeData.gazeDirection);
        }
      }
    } catch (error) {
      // Silent fail
    }
  }

  /**
   * Enhanced eye detection using system activity and cursor position
   */
  private async simulateEyeDetection(): Promise<EyeData> {
    try {
      // Check if user is active (mouse/keyboard activity)
      const { stdout } = await execAsync(`ioreg -c IOHIDSystem | awk '/HIDIdleTime/ {print $NF/1000000000; exit}'`);
      const idleTime = parseFloat(stdout.trim());

      // User is "looking" if idle time is less than 30 seconds
      const looking = idleTime < 30;
      const attention = looking ? Math.min(100, 100 - (idleTime * 3)) : 0;

      // Get cursor position to estimate gaze direction
      let gazeDirection: EyeData['gazeDirection'] = 'center';
      try {
        const { stdout: posStr } = await execAsync(`osascript -e 'tell application "System Events" to return position of mouse'`);
        const [x, y] = posStr.trim().split(',').map(n => parseInt(n.trim()));
        
        // Get screen resolution
        const { stdout: screenStr } = await execAsync(`system_profiler SPDisplaysDataType | grep Resolution | awk '{print $2, $4}'`);
        const [screenWidth, screenHeight] = screenStr.trim().split(' ').map(n => parseInt(n));
        
        // Estimate gaze based on cursor position
        const xRatio = x / screenWidth;
        const yRatio = y / screenHeight;
        
        if (xRatio < 0.3) gazeDirection = 'left';
        else if (xRatio > 0.7) gazeDirection = 'right';
        else if (yRatio < 0.3) gazeDirection = 'up';
        else if (yRatio > 0.7) gazeDirection = 'down';
        else gazeDirection = 'center';
      } catch {
        // Default to center
        gazeDirection = 'center';
      }

      return {
        looking,
        attention: Math.max(0, attention),
        gazeDirection,
        blinkRate: looking ? 15 : 0,
        focusPoint: gazeDirection === 'center' ? { x: 0.5, y: 0.5 } : undefined
      };
    } catch {
      // Default to not looking
      return {
        looking: false,
        attention: 0,
        gazeDirection: 'center',
        blinkRate: 0
      };
    }
  }

  /**
   * Check if eye data changed significantly
   */
  private hasEyeDataChanged(newData: EyeData): boolean {
    if (!this.lastEyeData) return true;
    return newData.looking !== this.lastEyeData.looking ||
           Math.abs(newData.attention - this.lastEyeData.attention) > 10;
  }

  /**
   * Check attention triggers
   */
  private checkTriggers(eyeData: EyeData): void {
    if (!this.attentionStartTime) return;

    const attentionDuration = Date.now() - this.attentionStartTime;

    for (const trigger of this.triggers) {
      if (attentionDuration >= trigger.duration && 
          eyeData.attention >= trigger.threshold) {
        trigger.callback();
      }
    }
  }

  /**
   * Register attention-based trigger
   */
  registerTrigger(duration: number, threshold: number, callback: () => void): void {
    this.triggers.push({ duration, threshold, callback });
    console.log(`✅ Trigger registered: ${duration}ms, ${threshold}% attention`);
  }

  /**
   * Clear all triggers
   */
  clearTriggers(): void {
    this.triggers = [];
  }

  /**
   * Get current eye data
   */
  getCurrentEyeData(): EyeData | null {
    return this.lastEyeData ? { ...this.lastEyeData } : null;
  }

  /**
   * Is user currently looking at screen
   */
  isUserLooking(): boolean {
    return this.lastEyeData?.looking || false;
  }

  /**
   * Get current attention level (0-100)
   */
  getAttentionLevel(): number {
    return this.lastEyeData?.attention || 0;
  }

  /**
   * Get attention duration in milliseconds
   */
  getAttentionDuration(): number {
    return this.attentionStartTime ? Date.now() - this.attentionStartTime : 0;
  }

  /**
   * Is eye tracking enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Install instructions for real eye tracking
   */
  static getInstallInstructions(): string {
    return `
Eye Tracking Setup Instructions:

For Full Eye Tracking, you need:

1. Hardware:
   - Tobii Eye Tracker 5
   - Gazepoint GP3
   - EyeTribe Tracker
   - Or use webcam-based solution

2. Software (Webcam-based):
   npm install webgazer

3. For Mac with Tobii:
   - Install Tobii Experience
   - Enable API access
   - Use tobii-stream-engine-node

Current Mode: Simulated (based on system activity)
    `.trim();
  }
}

export const eyeTracking = new EyeTracking();
