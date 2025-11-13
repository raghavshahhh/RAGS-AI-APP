// ============================================================================
// RAGS AI - Vision System (Camera + Screen Access)
// ============================================================================

import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';

const execAsync = promisify(exec);

interface VisionConfig {
  enableCamera: boolean;
  enableScreenCapture: boolean;
  captureInterval?: number; // seconds
}

export class VisionSystem {
  private config: VisionConfig;
  private isMonitoring: boolean = false;
  private cameraProcess: any = null;
  private lastScreenshot: string = '';
  private lastCameraCapture: string = '';

  constructor(config: VisionConfig) {
    this.config = {
      captureInterval: 30, // Default 30 seconds
      ...config,
    };
  }

  /**
   * Initialize vision system
   */
  async initialize(): Promise<void> {
    console.log('👁️  Initializing vision system...');

    if (this.config.enableCamera) {
      await this.checkCameraPermissions();
    }

    if (this.config.enableScreenCapture) {
      await this.checkScreenPermissions();
    }

    console.log('✅ Vision system ready');
  }

  /**
   * Check camera permissions
   */
  private async checkCameraPermissions(): Promise<void> {
    try {
      // Test camera access
      await execAsync('system_profiler SPCameraDataType');
      console.log('✅ Camera permissions granted');
    } catch (error) {
      console.warn('⚠️  Camera permissions may be required');
    }
  }

  /**
   * Check screen recording permissions
   */
  private async checkScreenPermissions(): Promise<void> {
    try {
      // Test screen capture
      const testPath = path.join(process.cwd(), 'temp', 'test_screen.png');
      await execAsync(`screencapture -x "${testPath}"`);
      await fs.unlink(testPath).catch(() => {});
      console.log('✅ Screen recording permissions granted');
    } catch (error) {
      console.warn('⚠️  Screen recording permissions may be required');
    }
  }

  /**
   * Start continuous monitoring
   */
  async startMonitoring(): Promise<void> {
    if (this.isMonitoring) return;

    console.log('👁️  Starting vision monitoring...');
    this.isMonitoring = true;

    // Start periodic captures
    this.scheduleCaptures();
  }

  /**
   * Stop monitoring
   */
  async stopMonitoring(): Promise<void> {
    console.log('👁️  Stopping vision monitoring...');
    this.isMonitoring = false;

    if (this.cameraProcess) {
      this.cameraProcess.kill();
      this.cameraProcess = null;
    }
  }

  /**
   * Schedule periodic captures
   */
  private scheduleCaptures(): void {
    if (!this.isMonitoring) return;

    setTimeout(async () => {
      try {
        if (this.config.enableScreenCapture) {
          await this.captureScreen();
        }

        if (this.config.enableCamera) {
          await this.captureCamera();
        }

        // Schedule next capture
        this.scheduleCaptures();
      } catch (error) {
        console.error('Vision capture error:', error);
        // Continue monitoring despite errors
        this.scheduleCaptures();
      }
    }, (this.config.captureInterval || 30) * 1000);
  }

  /**
   * Capture current screen
   */
  async captureScreen(): Promise<string> {
    const filename = `screen_${Date.now()}.png`;
    const filepath = path.join(process.cwd(), 'temp', filename);

    try {
      await execAsync(`screencapture -x "${filepath}"`);
      this.lastScreenshot = filepath;
      console.log('📸 Screen captured');
      return filepath;
    } catch (error) {
      console.error('Screen capture failed:', error);
      throw error;
    }
  }

  /**
   * Capture from camera
   */
  async captureCamera(): Promise<string> {
    const filename = `camera_${Date.now()}.jpg`;
    const filepath = path.join(process.cwd(), 'temp', filename);

    try {
      // Use imagesnap (install with: brew install imagesnap)
      await execAsync(`imagesnap -q "${filepath}"`);
      this.lastCameraCapture = filepath;
      console.log('📷 Camera captured');
      return filepath;
    } catch (error) {
      console.error('Camera capture failed:', error);
      // Try alternative method
      return await this.captureCameraAlternative();
    }
  }

  /**
   * Alternative camera capture method
   */
  private async captureCameraAlternative(): Promise<string> {
    const filename = `camera_${Date.now()}.jpg`;
    const filepath = path.join(process.cwd(), 'temp', filename);

    try {
      // Use ffmpeg if available
      await execAsync(`ffmpeg -f avfoundation -video_size 640x480 -framerate 1 -i "0" -vframes 1 -y "${filepath}"`);
      this.lastCameraCapture = filepath;
      return filepath;
    } catch (error) {
      console.error('Alternative camera capture failed:', error);
      throw error;
    }
  }

  /**
   * Analyze current screen content
   */
  async analyzeScreen(): Promise<{
    screenshot: string;
    analysis: string;
  }> {
    const screenshot = await this.captureScreen();
    
    // Here you could integrate with vision AI models
    // For now, return basic info
    const analysis = `Screen captured at ${new Date().toLocaleString()}`;
    
    return {
      screenshot,
      analysis,
    };
  }

  /**
   * Analyze camera feed
   */
  async analyzeCamera(): Promise<{
    image: string;
    analysis: string;
  }> {
    const image = await this.captureCamera();
    
    // Here you could integrate with vision AI models
    // For now, return basic info
    const analysis = `Camera image captured at ${new Date().toLocaleString()}`;
    
    return {
      image,
      analysis,
    };
  }

  /**
   * Get current screen text (OCR)
   */
  async getScreenText(): Promise<string> {
    try {
      const screenshot = await this.captureScreen();
      
      // Use tesseract for OCR (install with: brew install tesseract)
      const { stdout } = await execAsync(`tesseract "${screenshot}" stdout`);
      
      return stdout.trim();
    } catch (error) {
      console.error('OCR failed:', error);
      return '';
    }
  }

  /**
   * Detect if user is present (using camera)
   */
  async detectUserPresence(): Promise<boolean> {
    try {
      const image = await this.captureCamera();
      
      // Simple presence detection - check if image has content
      const stats = await fs.stat(image);
      const isPresent = stats.size > 10000; // Basic size check
      
      console.log(`👤 User presence: ${isPresent ? 'Detected' : 'Not detected'}`);
      return isPresent;
    } catch (error) {
      console.error('Presence detection failed:', error);
      return false;
    }
  }

  /**
   * Get active window info
   */
  async getActiveWindow(): Promise<{
    app: string;
    title: string;
  }> {
    try {
      const { stdout: app } = await execAsync(
        `osascript -e 'tell application "System Events" to get name of first application process whose frontmost is true'`
      );
      
      const { stdout: title } = await execAsync(
        `osascript -e 'tell application "System Events" to get title of front window of first application process whose frontmost is true'`
      );

      return {
        app: app.trim(),
        title: title.trim(),
      };
    } catch (error) {
      return {
        app: 'Unknown',
        title: 'Unknown',
      };
    }
  }

  /**
   * Monitor specific app activity
   */
  async monitorAppActivity(appName: string): Promise<{
    isRunning: boolean;
    isFrontmost: boolean;
    windowTitle?: string;
  }> {
    try {
      const { stdout: processes } = await execAsync(
        `osascript -e 'tell application "System Events" to get name of every process'`
      );
      
      const isRunning = processes.includes(appName);
      
      if (!isRunning) {
        return { isRunning: false, isFrontmost: false };
      }

      const { stdout: frontApp } = await execAsync(
        `osascript -e 'tell application "System Events" to get name of first application process whose frontmost is true'`
      );
      
      const isFrontmost = frontApp.trim() === appName;
      
      let windowTitle;
      if (isFrontmost) {
        try {
          const { stdout: title } = await execAsync(
            `osascript -e 'tell application "System Events" to get title of front window of application process "${appName}"'`
          );
          windowTitle = title.trim();
        } catch {
          // Window title not available
        }
      }

      return {
        isRunning,
        isFrontmost,
        windowTitle,
      };
    } catch (error) {
      console.error('App monitoring failed:', error);
      return { isRunning: false, isFrontmost: false };
    }
  }

  /**
   * Get last captured files
   */
  getLastCaptures(): {
    screenshot: string;
    camera: string;
  } {
    return {
      screenshot: this.lastScreenshot,
      camera: this.lastCameraCapture,
    };
  }

  /**
   * Cleanup old capture files
   */
  async cleanupOldCaptures(olderThanHours: number = 24): Promise<void> {
    try {
      const tempDir = path.join(process.cwd(), 'temp');
      const files = await fs.readdir(tempDir);
      
      const cutoffTime = Date.now() - (olderThanHours * 60 * 60 * 1000);
      
      for (const file of files) {
        if (file.startsWith('screen_') || file.startsWith('camera_')) {
          const filepath = path.join(tempDir, file);
          const stats = await fs.stat(filepath);
          
          if (stats.mtime.getTime() < cutoffTime) {
            await fs.unlink(filepath);
            console.log(`🗑️  Cleaned up old capture: ${file}`);
          }
        }
      }
    } catch (error) {
      console.error('Cleanup failed:', error);
    }
  }
}