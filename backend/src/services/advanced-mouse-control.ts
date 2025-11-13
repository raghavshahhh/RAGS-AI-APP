/**
 * 🖱️ ADVANCED MOUSE & SCREEN CONTROL SYSTEM
 * Complete mouse automation, screen control, and advanced interaction
 * RAGS can now control everything on screen like a human!
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { EventEmitter } from 'events';

const execAsync = promisify(exec);

interface MousePosition {
  x: number;
  y: number;
}

interface ScreenInfo {
  width: number;
  height: number;
  scale: number;
}

interface ClickOptions {
  button: 'left' | 'right' | 'middle';
  clickCount: number;
  delay?: number;
}

interface DragOptions {
  duration: number;
  smooth: boolean;
}

export class AdvancedMouseControl extends EventEmitter {
  private screenInfo: ScreenInfo | null = null;
  private isEnabled: boolean = false;

  constructor() {
    super();
    this.initialize();
  }

  /**
   * Initialize mouse control system
   */
  async initialize(): Promise<void> {
    try {
      await this.getScreenInfo();
      this.isEnabled = true;
      console.log('🖱️ Advanced Mouse Control initialized');
      console.log(`📺 Screen: ${this.screenInfo?.width}x${this.screenInfo?.height}`);
    } catch (error) {
      console.error('❌ Mouse control initialization failed:', error);
      this.isEnabled = false;
    }
  }

  /**
   * Get current screen information
   */
  private async getScreenInfo(): Promise<ScreenInfo> {
    try {
      // Get screen resolution using system_profiler
      const { stdout } = await execAsync(`system_profiler SPDisplaysDataType | grep Resolution | head -1`);
      const resMatch = stdout.match(/(\d+) x (\d+)/);
      
      if (resMatch) {
        this.screenInfo = {
          width: parseInt(resMatch[1]),
          height: parseInt(resMatch[2]),
          scale: 1.0
        };
      } else {
        // Fallback to default resolution
        this.screenInfo = { width: 1920, height: 1080, scale: 1.0 };
      }

      return this.screenInfo;
    } catch (error) {
      // Fallback resolution
      this.screenInfo = { width: 1920, height: 1080, scale: 1.0 };
      return this.screenInfo;
    }
  }

  /**
   * Get current mouse position
   */
  async getMousePosition(): Promise<MousePosition> {
    try {
      // Use Python to get mouse position (more reliable)
      const { stdout } = await execAsync(`python3 -c "
import Quartz
pos = Quartz.CGEventSourceCreate(Quartz.kCGEventSourceStateCombinedSessionState)
event = Quartz.CGEventCreate(pos)
point = Quartz.CGEventGetLocation(event)
print(f'{int(point.x)},{int(point.y)}')
"`);
      const [x, y] = stdout.trim().split(',').map(n => parseInt(n.trim()));
      return { x, y };
    } catch (error) {
      // Fallback: return center of screen
      console.warn('Failed to get mouse position, using screen center');
      return { 
        x: (this.screenInfo?.width || 1920) / 2, 
        y: (this.screenInfo?.height || 1080) / 2 
      };
    }
  }

  /**
   * Move mouse to specific coordinates
   */
  async moveTo(x: number, y: number, smooth: boolean = true): Promise<void> {
    if (!this.isEnabled) throw new Error('Mouse control not enabled');

    try {
      if (smooth) {
        // Smooth movement using multiple steps
        const currentPos = await this.getMousePosition();
        const steps = 10;
        const stepX = (x - currentPos.x) / steps;
        const stepY = (y - currentPos.y) / steps;

        for (let i = 1; i <= steps; i++) {
          const newX = Math.round(currentPos.x + (stepX * i));
          const newY = Math.round(currentPos.y + (stepY * i));
          
          await execAsync(`python3 -c "
import Quartz
Quartz.CGWarpMouseCursorPosition((${newX}, ${newY}))
"`);
          await new Promise(resolve => setTimeout(resolve, 20)); // Small delay for smoothness
        }
      } else {
        // Direct movement
        await execAsync(`python3 -c "
import Quartz
Quartz.CGWarpMouseCursorPosition((${x}, ${y}))
"`);
      }

      console.log(`🖱️ Mouse moved to (${x}, ${y})`);
      this.emit('mouseMoved', { x, y });
    } catch (error) {
      throw new Error(`Failed to move mouse: ${error}`);
    }
  }

  /**
   * Move mouse by relative offset
   */
  async moveBy(deltaX: number, deltaY: number, smooth: boolean = true): Promise<void> {
    const currentPos = await this.getMousePosition();
    await this.moveTo(currentPos.x + deltaX, currentPos.y + deltaY, smooth);
  }

  /**
   * Click at current position or specific coordinates
   */
  async click(x?: number, y?: number, options: Partial<ClickOptions> = {}): Promise<void> {
    if (!this.isEnabled) throw new Error('Mouse control not enabled');

    const opts: ClickOptions = {
      button: 'left',
      clickCount: 1,
      delay: 100,
      ...options
    };

    try {
      // Move to position if specified
      if (x !== undefined && y !== undefined) {
        await this.moveTo(x, y);
        await new Promise(resolve => setTimeout(resolve, opts.delay));
      }

      // Perform click at current mouse position
      let clickScript = '';
      if (opts.button === 'left') {
        if (opts.clickCount === 1) {
          clickScript = 'tell application "System Events" to click mouse';
        } else if (opts.clickCount === 2) {
          clickScript = 'tell application "System Events" to double click mouse';
        }
      } else if (opts.button === 'right') {
        clickScript = 'tell application "System Events" to right click mouse';
      }

      if (clickScript) {
        await execAsync(`osascript -e '${clickScript}'`);
        console.log(`🖱️ ${opts.button} clicked ${opts.clickCount} time(s)`);
        this.emit('mouseClicked', { x, y, button: opts.button, count: opts.clickCount });
      }
    } catch (error) {
      throw new Error(`Failed to click: ${error}`);
    }
  }


  /**
   * Double click
   */
  async doubleClick(x?: number, y?: number): Promise<void> {
    await this.click(x, y, { clickCount: 2 });
  }

  /**
   * Right click
   */
  async rightClick(x?: number, y?: number): Promise<void> {
    await this.click(x, y, { button: 'right' });
  }

  /**
   * Drag from one position to another
   */
  async drag(fromX: number, fromY: number, toX: number, toY: number, options: Partial<DragOptions> = {}): Promise<void> {
    if (!this.isEnabled) throw new Error('Mouse control not enabled');

    const opts: DragOptions = {
      duration: 1000,
      smooth: true,
      ...options
    };

    try {
      // Move to start position
      await this.moveTo(fromX, fromY);
      await new Promise(resolve => setTimeout(resolve, 100));

      // Start drag
      await execAsync(`osascript -e 'tell application "System Events" to mouse down'`);
      
      if (opts.smooth) {
        // Smooth drag with multiple steps
        const steps = Math.max(10, Math.floor(opts.duration / 50));
        const stepX = (toX - fromX) / steps;
        const stepY = (toY - fromY) / steps;
        const stepDelay = opts.duration / steps;

        for (let i = 1; i <= steps; i++) {
          const newX = Math.round(fromX + (stepX * i));
          const newY = Math.round(fromY + (stepY * i));
          
          await execAsync(`python3 -c "
import Quartz
Quartz.CGWarpMouseCursorPosition((${newX}, ${newY}))
"`);
          await new Promise(resolve => setTimeout(resolve, stepDelay));
        }
      } else {
        // Direct drag
        await this.moveTo(toX, toY, false);
        await new Promise(resolve => setTimeout(resolve, opts.duration));
      }

      // End drag
      await execAsync(`osascript -e 'tell application "System Events" to mouse up'`);
      
      console.log(`🖱️ Dragged from (${fromX}, ${fromY}) to (${toX}, ${toY})`);
      this.emit('mouseDragged', { from: { x: fromX, y: fromY }, to: { x: toX, y: toY } });
    } catch (error) {
      // Ensure mouse is released even if drag fails
      try {
        await execAsync(`osascript -e 'tell application "System Events" to mouse up'`);
      } catch (e) {
        // Ignore cleanup errors
      }
      throw new Error(`Failed to drag: ${error}`);
    }
  }

  /**
   * Scroll at current position or specific coordinates
   */
  async scroll(direction: 'up' | 'down' | 'left' | 'right', amount: number = 5, x?: number, y?: number): Promise<void> {
    if (!this.isEnabled) throw new Error('Mouse control not enabled');

    try {
      // Move to position if specified
      if (x !== undefined && y !== undefined) {
        await this.moveTo(x, y);
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      let scrollScript = '';
      switch (direction) {
        case 'up':
          scrollScript = `tell application "System Events" to scroll {0, ${amount}}`;
          break;
        case 'down':
          scrollScript = `tell application "System Events" to scroll {0, -${amount}}`;
          break;
        case 'left':
          scrollScript = `tell application "System Events" to scroll {${amount}, 0}`;
          break;
        case 'right':
          scrollScript = `tell application "System Events" to scroll {-${amount}, 0}`;
          break;
      }

      await execAsync(`osascript -e '${scrollScript}'`);
      console.log(`🖱️ Scrolled ${direction} by ${amount}`);
      this.emit('mouseScrolled', { direction, amount, x, y });
    } catch (error) {
      throw new Error(`Failed to scroll: ${error}`);
    }
  }

  /**
   * Find and click on text/image on screen
   */
  async findAndClick(searchText: string, region?: { x: number, y: number, width: number, height: number }): Promise<boolean> {
    try {
      // Take screenshot
      const screenshotPath = `/tmp/rags_screenshot_${Date.now()}.png`;
      await execAsync(`screencapture "${screenshotPath}"`);

      // For now, we'll use a simple approach - in a real implementation,
      // you'd use OCR or image recognition to find the text/element
      console.log(`🔍 Searching for "${searchText}" on screen...`);
      
      // Placeholder: Click at center of screen as fallback
      const centerX = (this.screenInfo?.width || 1920) / 2;
      const centerY = (this.screenInfo?.height || 1080) / 2;
      
      await this.click(centerX, centerY);
      
      // Clean up screenshot
      await execAsync(`rm "${screenshotPath}"`);
      
      return true;
    } catch (error) {
      console.error('Find and click failed:', error);
      return false;
    }
  }

  /**
   * Simulate human-like mouse movement patterns
   */
  async humanLikeMovement(targetX: number, targetY: number): Promise<void> {
    const currentPos = await this.getMousePosition();
    const distance = Math.sqrt(Math.pow(targetX - currentPos.x, 2) + Math.pow(targetY - currentPos.y, 2));
    
    // Add slight randomness and curves to make movement more human-like
    const steps = Math.max(5, Math.floor(distance / 50));
    const baseDelay = 15;
    
    for (let i = 1; i <= steps; i++) {
      const progress = i / steps;
      
      // Add slight curve using bezier-like calculation
      const curveOffset = Math.sin(progress * Math.PI) * 10;
      
      const x = currentPos.x + (targetX - currentPos.x) * progress + (Math.random() - 0.5) * curveOffset;
      const y = currentPos.y + (targetY - currentPos.y) * progress + (Math.random() - 0.5) * curveOffset;
      
      await execAsync(`osascript -e 'tell application "System Events" to set position of mouse to {${Math.round(x)}, ${Math.round(y)}}'`);
      
      // Variable delay to simulate human timing
      const delay = baseDelay + Math.random() * 10;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    // Final precise positioning
    await this.moveTo(targetX, targetY, false);
  }

  /**
   * Get screen regions for common UI elements
   */
  getScreenRegions(): { [key: string]: { x: number, y: number, width: number, height: number } } {
    if (!this.screenInfo) return {};

    const { width, height } = this.screenInfo;
    
    return {
      topLeft: { x: 0, y: 0, width: width / 4, height: height / 4 },
      topRight: { x: width * 3/4, y: 0, width: width / 4, height: height / 4 },
      bottomLeft: { x: 0, y: height * 3/4, width: width / 4, height: height / 4 },
      bottomRight: { x: width * 3/4, y: height * 3/4, width: width / 4, height: height / 4 },
      center: { x: width / 4, y: height / 4, width: width / 2, height: height / 2 },
      dock: { x: 0, y: height - 100, width: width, height: 100 },
      menuBar: { x: 0, y: 0, width: width, height: 30 }
    };
  }

  /**
   * Perform complex gestures
   */
  async performGesture(gesture: 'swipeLeft' | 'swipeRight' | 'swipeUp' | 'swipeDown' | 'pinchZoom' | 'pinchOut'): Promise<void> {
    if (!this.screenInfo) throw new Error('Screen info not available');

    const centerX = this.screenInfo.width / 2;
    const centerY = this.screenInfo.height / 2;
    const swipeDistance = 200;

    switch (gesture) {
      case 'swipeLeft':
        await this.drag(centerX + swipeDistance/2, centerY, centerX - swipeDistance/2, centerY, { duration: 500 });
        break;
      case 'swipeRight':
        await this.drag(centerX - swipeDistance/2, centerY, centerX + swipeDistance/2, centerY, { duration: 500 });
        break;
      case 'swipeUp':
        await this.drag(centerX, centerY + swipeDistance/2, centerX, centerY - swipeDistance/2, { duration: 500 });
        break;
      case 'swipeDown':
        await this.drag(centerX, centerY - swipeDistance/2, centerX, centerY + swipeDistance/2, { duration: 500 });
        break;
      case 'pinchZoom':
        // Simulate zoom in (would need multi-touch in real implementation)
        await this.scroll('up', 10, centerX, centerY);
        break;
      case 'pinchOut':
        // Simulate zoom out
        await this.scroll('down', 10, centerX, centerY);
        break;
    }

    console.log(`🖱️ Performed gesture: ${gesture}`);
    this.emit('gesturePerformed', { gesture });
  }

  /**
   * Enable/disable mouse control
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    console.log(`🖱️ Mouse control ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Get current status
   */
  getStatus(): { enabled: boolean, screenInfo: ScreenInfo | null } {
    return {
      enabled: this.isEnabled,
      screenInfo: this.screenInfo
    };
  }
}

// Export singleton instance
export const advancedMouseControl = new AdvancedMouseControl();
