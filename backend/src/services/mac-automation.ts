// ============================================================================
// RAGS AI - macOS Automation Service (Phase 4)
// System control, Shortcuts integration, file management
// ============================================================================

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

export class MacAutomation {
  private platform: string;

  constructor() {
    this.platform = process.platform;
    
    if (this.platform !== 'darwin') {
      console.warn('⚠️ Mac automation features only work on macOS');
    }
  }

  /**
   * Open application by name
   */
  async openApp(appName: string): Promise<void> {
    console.log(`📱 Opening ${appName}...`);
    
    await execAsync(`open -a "${appName}"`);
    console.log(`✅ Opened ${appName}`);
  }

  /**
   * Close application
   */
  async closeApp(appName: string): Promise<void> {
    console.log(`🚪 Closing ${appName}...`);
    
    await execAsync(`osascript -e 'quit app "${appName}"'`);
    console.log(`✅ Closed ${appName}`);
  }

  /**
   * Get list of running applications
   */
  async getRunningApps(): Promise<string[]> {
    const { stdout } = await execAsync(
      `osascript -e 'tell application "System Events" to get name of every process whose background only is false'`
    );
    
    return stdout.trim().split(', ').filter(Boolean);
  }

  /**
   * Execute AppleScript
   */
  async executeAppleScript(script: string): Promise<string> {
    console.log('🍎 Executing AppleScript...');
    
    const { stdout } = await execAsync(`osascript -e '${script}'`);
    return stdout.trim();
  }

  /**
   * Run Shortcuts automation
   */
  async runShortcut(shortcutName: string, input?: string): Promise<string> {
    console.log(`⚡ Running shortcut: ${shortcutName}`);
    
    let command = `shortcuts run "${shortcutName}"`;
    if (input) {
      command += ` -i "${input}"`;
    }
    
    const { stdout } = await execAsync(command);
    console.log(`✅ Shortcut completed`);
    
    return stdout.trim();
  }

  /**
   * List all available shortcuts
   */
  async listShortcuts(): Promise<string[]> {
    const { stdout } = await execAsync('shortcuts list');
    return stdout.trim().split('\n').filter(Boolean);
  }

  /**
   * Set system volume (0-100)
   */
  async setVolume(level: number): Promise<void> {
    const volume = Math.max(0, Math.min(100, level));
    console.log(`🔊 Setting volume to ${volume}%`);
    
    await execAsync(`osascript -e "set volume output volume ${volume}"`);
  }

  /**
   * Get current volume
   */
  async getVolume(): Promise<number> {
    const { stdout } = await execAsync(
      `osascript -e "output volume of (get volume settings)"`
    );
    return parseInt(stdout.trim());
  }

  /**
   * Mute/unmute system
   */
  async setMute(mute: boolean): Promise<void> {
    console.log(`🔇 ${mute ? 'Muting' : 'Unmuting'} system`);
    
    await execAsync(`osascript -e "set volume ${mute ? 'with' : 'without'} output muted"`);
  }

  /**
   * Set screen brightness (0-100)
   */
  async setBrightness(level: number): Promise<void> {
    const brightness = Math.max(0, Math.min(100, level)) / 100;
    console.log(`💡 Setting brightness to ${level}%`);
    
    await execAsync(`brightness ${brightness}`);
  }

  /**
   * Take screenshot
   */
  async takeScreenshot(savePath?: string): Promise<string> {
    const defaultPath = path.join(
      process.env.HOME || '',
      'Desktop',
      `Screenshot-${Date.now()}.png`
    );
    
    const finalPath = savePath || defaultPath;
    console.log(`📸 Taking screenshot: ${finalPath}`);
    
    await execAsync(`screencapture "${finalPath}"`);
    console.log(`✅ Screenshot saved`);
    
    return finalPath;
  }

  /**
   * Take screenshot of specific area
   */
  async takeScreenshotInteractive(): Promise<string> {
    const savePath = path.join(
      process.env.HOME || '',
      'Desktop',
      `Screenshot-${Date.now()}.png`
    );
    
    console.log(`📸 Interactive screenshot mode`);
    await execAsync(`screencapture -i "${savePath}"`);
    
    return savePath;
  }

  /**
   * Record screen
   */
  async recordScreen(duration: number = 10): Promise<string> {
    const savePath = path.join(
      process.env.HOME || '',
      'Desktop',
      `Recording-${Date.now()}.mov`
    );
    
    console.log(`🎥 Recording screen for ${duration} seconds...`);
    
    // Using screencapture with video
    await execAsync(`screencapture -v -T ${duration} "${savePath}"`);
    
    console.log(`✅ Recording saved: ${savePath}`);
    return savePath;
  }

  /**
   * Send notification
   */
  async sendNotification(title: string, message: string, sound: boolean = true): Promise<void> {
    console.log(`🔔 Sending notification: ${title}`);
    
    const soundPart = sound ? ' sound name "default"' : '';
    await execAsync(
      `osascript -e 'display notification "${message}" with title "${title}"${soundPart}'`
    );
  }

  /**
   * Show alert dialog
   */
  async showAlert(title: string, message: string): Promise<void> {
    await execAsync(
      `osascript -e 'display alert "${title}" message "${message}"'`
    );
  }

  /**
   * Open Finder at path
   */
  async openFinder(dirPath: string): Promise<void> {
    console.log(`📁 Opening Finder at: ${dirPath}`);
    await execAsync(`open "${dirPath}"`);
  }

  /**
   * Create new Finder window
   */
  async newFinderWindow(): Promise<void> {
    await execAsync(`osascript -e 'tell application "Finder" to make new Finder window'`);
  }

  /**
   * Get clipboard content
   */
  async getClipboard(): Promise<string> {
    const { stdout } = await execAsync('pbpaste');
    return stdout;
  }

  /**
   * Set clipboard content
   */
  async setClipboard(content: string): Promise<void> {
    console.log('📋 Setting clipboard');
    await execAsync(`echo "${content}" | pbcopy`);
  }

  /**
   * Open URL in default browser
   */
  async openURL(url: string): Promise<void> {
    console.log(`🌐 Opening URL: ${url}`);
    await execAsync(`open "${url}"`);
  }

  /**
   * Open file with default app
   */
  async openFile(filePath: string): Promise<void> {
    console.log(`📄 Opening file: ${filePath}`);
    await execAsync(`open "${filePath}"`);
  }

  /**
   * Get battery status
   */
  async getBatteryStatus(): Promise<{
    percentage: number;
    charging: boolean;
    timeRemaining?: string;
  }> {
    const { stdout } = await execAsync('pmset -g batt');
    
    const percentMatch = stdout.match(/(\d+)%/);
    const percentage = percentMatch ? parseInt(percentMatch[1]) : 0;
    
    const charging = stdout.includes('AC Power');
    
    return { percentage, charging };
  }

  /**
   * Get WiFi status
   */
  async getWiFiStatus(): Promise<{
    connected: boolean;
    ssid?: string;
  }> {
    try {
      const { stdout } = await execAsync(
        '/System/Library/PrivateFrameworks/Apple80211.framework/Versions/Current/Resources/airport -I'
      );
      
      const ssidMatch = stdout.match(/\sSSID: (.+)/);
      const ssid = ssidMatch ? ssidMatch[1].trim() : undefined;
      
      return {
        connected: !!ssid,
        ssid,
      };
    } catch {
      return { connected: false };
    }
  }

  /**
   * Play system sound
   */
  async playSound(soundName: string = 'Glass'): Promise<void> {
    await execAsync(`afplay /System/Library/Sounds/${soundName}.aiff`);
  }

  /**
   * Speak text (TTS)
   */
  async speak(text: string, voice: string = 'Samantha'): Promise<void> {
    console.log(`🗣️ Speaking: "${text}"`);
    await execAsync(`say -v "${voice}" "${text}"`);
  }

  /**
   * Empty trash
   */
  async emptyTrash(): Promise<void> {
    console.log('🗑️ Emptying trash...');
    await execAsync(
      `osascript -e 'tell application "Finder" to empty trash'`
    );
    console.log('✅ Trash emptied');
  }

  /**
   * Lock screen
   */
  async lockScreen(): Promise<void> {
    console.log('🔒 Locking screen...');
    await execAsync(
      'pmset displaysleepnow'
    );
  }

  /**
   * Sleep computer
   */
  async sleep(): Promise<void> {
    console.log('😴 Putting computer to sleep...');
    await execAsync('pmset sleepnow');
  }

  /**
   * Get system info
   */
  async getSystemInfo(): Promise<{
    macOSVersion: string;
    computerName: string;
    username: string;
    uptime: string;
  }> {
    const [versionOut, nameOut, usernameOut, uptimeOut] = await Promise.all([
      execAsync('sw_vers -productVersion'),
      execAsync('scutil --get ComputerName'),
      execAsync('whoami'),
      execAsync('uptime'),
    ]);

    return {
      macOSVersion: versionOut.stdout.trim(),
      computerName: nameOut.stdout.trim(),
      username: usernameOut.stdout.trim(),
      uptime: uptimeOut.stdout.trim(),
    };
  }

  /**
   * Create file/folder
   */
  async createFile(filePath: string, content: string = ''): Promise<void> {
    console.log(`📝 Creating file: ${filePath}`);
    
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(filePath, content, 'utf-8');
    
    console.log('✅ File created');
  }

  /**
   * Create folder
   */
  async createFolder(dirPath: string): Promise<void> {
    console.log(`📁 Creating folder: ${dirPath}`);
    await fs.mkdir(dirPath, { recursive: true });
    console.log('✅ Folder created');
  }

  /**
   * Delete file/folder
   */
  async deleteItem(itemPath: string): Promise<void> {
    console.log(`🗑️ Deleting: ${itemPath}`);
    
    const stats = await fs.stat(itemPath);
    
    if (stats.isDirectory()) {
      await fs.rm(itemPath, { recursive: true, force: true });
    } else {
      await fs.unlink(itemPath);
    }
    
    console.log('✅ Deleted');
  }

  /**
   * Move item to trash (safer than delete)
   */
  async moveToTrash(itemPath: string): Promise<void> {
    console.log(`🗑️ Moving to trash: ${itemPath}`);
    
    await execAsync(
      `osascript -e 'tell application "Finder" to delete POSIX file "${itemPath}"'`
    );
    
    console.log('✅ Moved to trash');
  }

  /**
   * Rename file/folder
   */
  async renameItem(oldPath: string, newName: string): Promise<void> {
    const dir = path.dirname(oldPath);
    const newPath = path.join(dir, newName);
    
    console.log(`✏️ Renaming: ${oldPath} -> ${newName}`);
    await fs.rename(oldPath, newPath);
    console.log('✅ Renamed');
  }

  /**
   * Get file info
   */
  async getFileInfo(filePath: string): Promise<{
    name: string;
    size: number;
    created: Date;
    modified: Date;
    isDirectory: boolean;
  }> {
    const stats = await fs.stat(filePath);
    
    return {
      name: path.basename(filePath),
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime,
      isDirectory: stats.isDirectory(),
    };
  }

  /**
   * List directory contents
   */
  async listDirectory(dirPath: string): Promise<string[]> {
    return await fs.readdir(dirPath);
  }

  /**
   * Search files
   */
  async searchFiles(query: string, dirPath: string = '~'): Promise<string[]> {
    console.log(`🔍 Searching for: ${query}`);
    
    const { stdout } = await execAsync(
      `mdfind -onlyin "${dirPath}" "${query}" | head -20`
    );
    
    return stdout.trim().split('\n').filter(Boolean);
  }
}

export const macAutomation = new MacAutomation();
