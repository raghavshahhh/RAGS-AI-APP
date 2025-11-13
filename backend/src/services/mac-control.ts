// Mac System Control - M1 Optimized
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

class MacControl {
  // Volume Control
  async setVolume(level: number) {
    await execAsync(`osascript -e "set volume output volume ${level}"`);
  }

  async getVolume(): Promise<number> {
    const { stdout } = await execAsync(`osascript -e "output volume of (get volume settings)"`);
    return parseInt(stdout.trim());
  }

  // Brightness Control
  async setBrightness(level: number) {
    await execAsync(`brightness ${level / 100}`);
  }

  // App Control
  async openApp(appName: string) {
    await execAsync(`open -a "${appName}"`);
  }

  async closeApp(appName: string) {
    await execAsync(`osascript -e 'quit app "${appName}"'`);
  }

  // Browser Control
  async openURL(url: string) {
    await execAsync(`open "${url}"`);
  }

  // File Operations
  async openFile(path: string) {
    await execAsync(`open "${path}"`);
  }

  async listFiles(directory: string = '~'): Promise<string[]> {
    const { stdout } = await execAsync(`ls -1 ${directory}`);
    return stdout.trim().split('\n');
  }

  // System Info
  async getSystemInfo() {
    const [cpu, memory, disk] = await Promise.all([
      execAsync(`sysctl -n machdep.cpu.brand_string`),
      execAsync(`vm_stat | grep "Pages free" | awk '{print $3}' | sed 's/\\.//'`),
      execAsync(`df -h / | tail -1 | awk '{print $5}'`)
    ]);

    return {
      cpu: cpu.stdout.trim(),
      memory: memory.stdout.trim(),
      disk: disk.stdout.trim()
    };
  }

  // Notifications
  async notify(title: string, message: string) {
    await execAsync(`osascript -e 'display notification "${message}" with title "${title}"'`);
  }

  // Screenshot
  async takeScreenshot(path: string = '~/Desktop/screenshot.png') {
    await execAsync(`screencapture -x "${path}"`);
    return path;
  }

  // Clipboard
  async copyToClipboard(text: string) {
    await execAsync(`echo "${text}" | pbcopy`);
  }

  async getClipboard(): Promise<string> {
    const { stdout } = await execAsync(`pbpaste`);
    return stdout;
  }

  // WiFi Control
  async getWiFiStatus() {
    const { stdout } = await execAsync(`networksetup -getairportnetwork en0`);
    return stdout.trim();
  }

  // Do Not Disturb
  async enableDND() {
    await execAsync(`defaults -currentHost write ~/Library/Preferences/ByHost/com.apple.notificationcenterui doNotDisturb -boolean true`);
  }

  async disableDND() {
    await execAsync(`defaults -currentHost write ~/Library/Preferences/ByHost/com.apple.notificationcenterui doNotDisturb -boolean false`);
  }
}

export const macControl = new MacControl();
