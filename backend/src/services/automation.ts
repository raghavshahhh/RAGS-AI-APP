import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

interface AutomationTask {
  type: 'command' | 'file' | 'browser' | 'app';
  action: string;
  params?: any;
}

export class AutomationService {
  private platform: string;

  constructor() {
    this.platform = process.platform; // 'darwin', 'win32', 'linux'
  }

  /**
   * Execute system command
   */
  async executeCommand(command: string): Promise<{ stdout: string; stderr: string }> {
    try {
      const { stdout, stderr } = await execAsync(command);
      return { stdout, stderr };
    } catch (error: any) {
      console.error('Command execution error:', error);
      throw new Error(`Failed to execute command: ${error.message}`);
    }
  }

  /**
   * Open application
   */
  async openApp(appName: string): Promise<void> {
    try {
      let command: string;

      switch (this.platform) {
        case 'darwin': // macOS
          command = `open -a "${appName}"`;
          break;
        case 'win32': // Windows
          command = `start "" "${appName}"`;
          break;
        case 'linux':
          command = `xdg-open "${appName}"`;
          break;
        default:
          throw new Error('Unsupported platform');
      }

      await execAsync(command);
    } catch (error: any) {
      throw new Error(`Failed to open app: ${error.message}`);
    }
  }

  /**
   * Open URL in default browser
   */
  async openUrl(url: string): Promise<void> {
    try {
      let command: string;

      switch (this.platform) {
        case 'darwin':
          command = `open "${url}"`;
          break;
        case 'win32':
          command = `start "" "${url}"`;
          break;
        case 'linux':
          command = `xdg-open "${url}"`;
          break;
        default:
          throw new Error('Unsupported platform');
      }

      await execAsync(command);
    } catch (error: any) {
      throw new Error(`Failed to open URL: ${error.message}`);
    }
  }

  /**
   * Create file
   */
  async createFile(filePath: string, content: string): Promise<void> {
    try {
      const dir = path.dirname(filePath);
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(filePath, content, 'utf-8');
    } catch (error: any) {
      throw new Error(`Failed to create file: ${error.message}`);
    }
  }

  /**
   * Read file
   */
  async readFile(filePath: string): Promise<string> {
    try {
      return await fs.readFile(filePath, 'utf-8');
    } catch (error: any) {
      throw new Error(`Failed to read file: ${error.message}`);
    }
  }

  /**
   * Delete file
   */
  async deleteFile(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
    } catch (error: any) {
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }

  /**
   * List files in directory
   */
  async listFiles(dirPath: string): Promise<string[]> {
    try {
      return await fs.readdir(dirPath);
    } catch (error: any) {
      throw new Error(`Failed to list files: ${error.message}`);
    }
  }

  /**
   * Set system volume (macOS)
   */
  async setVolume(level: number): Promise<void> {
    if (this.platform !== 'darwin') {
      throw new Error('Volume control only supported on macOS');
    }

    try {
      const volume = Math.max(0, Math.min(100, level));
      await execAsync(`osascript -e "set volume output volume ${volume}"`);
    } catch (error: any) {
      throw new Error(`Failed to set volume: ${error.message}`);
    }
  }

  /**
   * Get system info
   */
  async getSystemInfo(): Promise<any> {
    try {
      let info: any = {
        platform: this.platform,
        hostname: '',
        uptime: process.uptime(),
      };

      if (this.platform === 'darwin') {
        const { stdout } = await execAsync('hostname');
        info.hostname = stdout.trim();
      }

      return info;
    } catch (error: any) {
      throw new Error(`Failed to get system info: ${error.message}`);
    }
  }

  /**
   * Take screenshot (macOS)
   */
  async takeScreenshot(savePath: string): Promise<string> {
    if (this.platform !== 'darwin') {
      throw new Error('Screenshot only supported on macOS');
    }

    try {
      await execAsync(`screencapture "${savePath}"`);
      return savePath;
    } catch (error: any) {
      throw new Error(`Failed to take screenshot: ${error.message}`);
    }
  }

  /**
   * Send notification
   */
  async sendNotification(title: string, message: string): Promise<void> {
    try {
      let command: string;

      switch (this.platform) {
        case 'darwin':
          command = `osascript -e 'display notification "${message}" with title "${title}"'`;
          break;
        case 'win32':
          // Windows notification via PowerShell
          command = `powershell -Command "New-BurntToastNotification -Text '${title}', '${message}'"`;
          break;
        case 'linux':
          command = `notify-send "${title}" "${message}"`;
          break;
        default:
          throw new Error('Unsupported platform');
      }

      await execAsync(command);
    } catch (error: any) {
      console.error('Notification error:', error);
      // Don't throw - notifications are non-critical
    }
  }

  /**
   * Execute automation task
   */
  async executeTask(task: AutomationTask): Promise<any> {
    switch (task.type) {
      case 'command':
        return await this.executeCommand(task.action);
      
      case 'app':
        return await this.openApp(task.action);
      
      case 'browser':
        return await this.openUrl(task.action);
      
      case 'file':
        if (task.params?.operation === 'create') {
          return await this.createFile(task.action, task.params.content);
        } else if (task.params?.operation === 'read') {
          return await this.readFile(task.action);
        } else if (task.params?.operation === 'delete') {
          return await this.deleteFile(task.action);
        }
        break;
      
      default:
        throw new Error('Unknown task type');
    }
  }
}

export const automationService = new AutomationService();

