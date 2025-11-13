/**
 * Mac System Access Service
 * Provides system-level control for macOS
 * Requires user permissions
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';

const execAsync = promisify(exec);

interface SystemCommand {
  action: string;
  params?: any;
}

interface SystemResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export class MacSystemService {
  private enabled: boolean;
  private allowedActions: Set<string>;

  constructor() {
    this.enabled = process.env.SYSTEM_ACCESS_ENABLED === 'true';
    const actions = process.env.ALLOWED_ACTIONS || 'open_app,search_files';
    this.allowedActions = new Set(actions.split(','));
    
    console.log('🖥️  Mac System Access:', this.enabled ? 'Enabled' : 'Disabled');
    console.log('✅ Allowed actions:', Array.from(this.allowedActions).join(', '));
  }

  /**
   * Execute system command
   */
  async execute(command: SystemCommand): Promise<SystemResponse> {
    if (!this.enabled) {
      return {
        success: false,
        error: 'System access is disabled',
      };
    }

    if (!this.allowedActions.has(command.action)) {
      return {
        success: false,
        error: `Action '${command.action}' is not allowed`,
      };
    }

    try {
      switch (command.action) {
        case 'open_app':
          return await this.openApp(command.params.name);
        
        case 'search_files':
          return await this.searchFiles(command.params.query);
        
        case 'run_command':
          return await this.runCommand(command.params.command);
        
        case 'control_music':
          return await this.controlMusic(command.params.action);
        
        case 'get_system_info':
          return await this.getSystemInfo();
        
        case 'list_apps':
          return await this.listApplications();
        
        case 'get_wifi_info':
          return await this.getWifiInfo();
        
        case 'set_volume':
          return await this.setVolume(command.params.level);
        
        case 'take_screenshot':
          return await this.takeScreenshot(command.params.path);
        
        default:
          return {
            success: false,
            error: `Unknown action: ${command.action}`,
          };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Open macOS application
   */
  private async openApp(appName: string): Promise<SystemResponse> {
    try {
      const { stdout } = await execAsync(`open -a "${appName}"`);
      return {
        success: true,
        data: { message: `Opened ${appName}`, output: stdout },
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to open ${appName}: ${error.message}`,
      };
    }
  }

  /**
   * Search files using Spotlight (mdfind)
   */
  private async searchFiles(query: string): Promise<SystemResponse> {
    try {
      const { stdout } = await execAsync(`mdfind "${query}" | head -20`);
      const files = stdout.trim().split('\n').filter(f => f);
      
      return {
        success: true,
        data: {
          query,
          count: files.length,
          files: files.slice(0, 10), // Return top 10
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Search failed: ${error.message}`,
      };
    }
  }

  /**
   * Run safe terminal command
   */
  private async runCommand(command: string): Promise<SystemResponse> {
    // Whitelist of safe commands
    const safeCommands = ['ls', 'pwd', 'date', 'whoami', 'uptime', 'df', 'top'];
    const cmd = command.trim().split(' ')[0];
    
    if (!safeCommands.includes(cmd)) {
      return {
        success: false,
        error: `Command '${cmd}' is not allowed for security`,
      };
    }

    try {
      const { stdout, stderr } = await execAsync(command);
      return {
        success: true,
        data: { output: stdout || stderr },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Control music (Apple Music / Spotify)
   */
  private async controlMusic(action: string): Promise<SystemResponse> {
    try {
      let script = '';
      
      switch (action) {
        case 'play':
          script = 'tell application "Music" to play';
          break;
        case 'pause':
          script = 'tell application "Music" to pause';
          break;
        case 'next':
          script = 'tell application "Music" to next track';
          break;
        case 'previous':
          script = 'tell application "Music" to previous track';
          break;
        case 'current':
          script = 'tell application "Music" to get name of current track';
          break;
        default:
          return { success: false, error: 'Unknown music action' };
      }

      const { stdout } = await execAsync(`osascript -e '${script}'`);
      return {
        success: true,
        data: { action, result: stdout.trim() },
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Music control failed: ${error.message}`,
      };
    }
  }

  /**
   * Get system information
   */
  private async getSystemInfo(): Promise<SystemResponse> {
    try {
      const [hostname, osVersion, uptime, memory] = await Promise.all([
        execAsync('hostname'),
        execAsync('sw_vers -productVersion'),
        execAsync('uptime'),
        execAsync('sysctl -n hw.memsize'),
      ]);

      return {
        success: true,
        data: {
          hostname: hostname.stdout.trim(),
          osVersion: osVersion.stdout.trim(),
          uptime: uptime.stdout.trim(),
          totalMemory: Math.round(parseInt(memory.stdout) / 1024 / 1024 / 1024) + ' GB',
          platform: 'macOS',
          arch: process.arch,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * List installed applications
   */
  private async listApplications(): Promise<SystemResponse> {
    try {
      const { stdout } = await execAsync('ls /Applications | grep .app');
      const apps = stdout.trim().split('\n').map(app => app.replace('.app', ''));
      
      return {
        success: true,
        data: {
          count: apps.length,
          apps: apps.slice(0, 20), // Top 20
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get WiFi information
   */
  private async getWifiInfo(): Promise<SystemResponse> {
    try {
      const { stdout } = await execAsync('/System/Library/PrivateFrameworks/Apple80211.framework/Versions/Current/Resources/airport -I');
      const lines = stdout.split('\n');
      const info: any = {};
      
      lines.forEach(line => {
        const [key, ...value] = line.trim().split(':');
        if (key && value.length) {
          info[key.trim()] = value.join(':').trim();
        }
      });

      return {
        success: true,
        data: {
          ssid: info.SSID || 'Not connected',
          signal: info['agrCtlRSSI'] || 'N/A',
          channel: info.channel || 'N/A',
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Set system volume
   */
  private async setVolume(level: number): Promise<SystemResponse> {
    try {
      const volume = Math.max(0, Math.min(100, level));
      await execAsync(`osascript -e "set volume output volume ${volume}"`);
      
      return {
        success: true,
        data: { volume, message: `Volume set to ${volume}%` },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Take screenshot
   */
  private async takeScreenshot(savePath?: string): Promise<SystemResponse> {
    try {
      const filename = savePath || `/tmp/screenshot_${Date.now()}.png`;
      await execAsync(`screencapture -x "${filename}"`);
      
      return {
        success: true,
        data: { path: filename, message: 'Screenshot saved' },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Parse natural language command
   */
  async parseCommand(text: string): Promise<SystemCommand | null> {
    const input = text.toLowerCase();

    // Open app
    if (input.match(/open|launch|start/)) {
      const apps = ['safari', 'chrome', 'firefox', 'music', 'spotify', 'notes', 'calendar', 'mail'];
      const app = apps.find(a => input.includes(a));
      if (app) {
        return {
          action: 'open_app',
          params: { name: app.charAt(0).toUpperCase() + app.slice(1) },
        };
      }
    }

    // Search files
    if (input.match(/search|find|locate/)) {
      const query = input.replace(/search|find|locate|for|file|files/g, '').trim();
      if (query) {
        return {
          action: 'search_files',
          params: { query },
        };
      }
    }

    // Music control
    if (input.match(/play|pause|next|previous|music/)) {
      if (input.includes('play')) return { action: 'control_music', params: { action: 'play' } };
      if (input.includes('pause')) return { action: 'control_music', params: { action: 'pause' } };
      if (input.includes('next')) return { action: 'control_music', params: { action: 'next' } };
      if (input.includes('previous')) return { action: 'control_music', params: { action: 'previous' } };
    }

    // Volume
    if (input.match(/volume|sound/)) {
      const match = input.match(/(\d+)/);
      if (match) {
        return {
          action: 'set_volume',
          params: { level: parseInt(match[1]) },
        };
      }
    }

    // System info
    if (input.match(/system|info|about|mac/)) {
      return { action: 'get_system_info', params: {} };
    }

    return null;
  }
}

export default MacSystemService;

