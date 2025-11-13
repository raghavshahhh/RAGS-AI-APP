// ============================================================================
// PLUGIN FRAMEWORK - Extensibility system for custom skills
// ============================================================================

import { EventEmitter } from 'events';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';

const execAsync = promisify(exec);

interface Plugin {
  id: string;
  name: string;
  description: string;
  version: string;
  commands: PluginCommand[];
  enabled: boolean;
  author?: string;
}

interface PluginCommand {
  trigger: string;
  description: string;
  handler: string; // Script path or function name
  type: 'script' | 'function' | 'api';
}

interface PluginResult {
  success: boolean;
  output?: any;
  error?: string;
}

export class PluginFramework extends EventEmitter {
  private plugins: Map<string, Plugin> = new Map();
  private pluginsDir: string;

  constructor() {
    super();
    const homeDir = process.env.HOME || '';
    this.pluginsDir = path.join(homeDir, '.rags', 'plugins');
  }

  async initialize(): Promise<void> {
    try {
      await fs.mkdir(this.pluginsDir, { recursive: true });
      await this.loadPlugins();
      console.log('🔌 Plugin framework initialized');
    } catch (error) {
      console.error('Plugin framework init failed:', error);
    }
  }

  /**
   * Register a new plugin
   */
  async registerPlugin(plugin: Plugin): Promise<void> {
    this.plugins.set(plugin.id, plugin);
    
    // Save plugin config
    const pluginFile = path.join(this.pluginsDir, `${plugin.id}.json`);
    await fs.writeFile(pluginFile, JSON.stringify(plugin, null, 2), 'utf-8');
    
    console.log(`✅ Plugin registered: ${plugin.name}`);
    this.emit('plugin_registered', plugin);
  }

  /**
   * Load all plugins from directory
   */
  private async loadPlugins(): Promise<void> {
    try {
      const files = await fs.readdir(this.pluginsDir);
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const content = await fs.readFile(path.join(this.pluginsDir, file), 'utf-8');
          const plugin: Plugin = JSON.parse(content);
          this.plugins.set(plugin.id, plugin);
          console.log(`📦 Loaded plugin: ${plugin.name}`);
        }
      }
    } catch (error) {
      // Plugins dir doesn't exist yet
    }
  }

  /**
   * Execute plugin command
   */
  async executeCommand(pluginId: string, commandTrigger: string, args?: any): Promise<PluginResult> {
    try {
      const plugin = this.plugins.get(pluginId);
      
      if (!plugin) {
        return { success: false, error: 'Plugin not found' };
      }

      if (!plugin.enabled) {
        return { success: false, error: 'Plugin is disabled' };
      }

      const command = plugin.commands.find(cmd => cmd.trigger === commandTrigger);
      
      if (!command) {
        return { success: false, error: 'Command not found' };
      }

      console.log(`🔌 Executing: ${plugin.name} -> ${command.trigger}`);

      let output: any;

      switch (command.type) {
        case 'script':
          output = await this.executeScript(command.handler, args);
          break;
        case 'api':
          output = await this.callAPI(command.handler, args);
          break;
        case 'function':
          output = await this.executeFunction(command.handler, args);
          break;
        default:
          return { success: false, error: 'Unknown command type' };
      }

      this.emit('command_executed', { plugin: pluginId, command: commandTrigger, output });

      return { success: true, output };
    } catch (error) {
      console.error('Plugin execution failed:', error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Execute shell script
   */
  private async executeScript(scriptPath: string, args?: any): Promise<string> {
    const fullPath = path.join(this.pluginsDir, 'scripts', scriptPath);
    const argsStr = args ? JSON.stringify(args) : '{}';
    
    const { stdout } = await execAsync(`bash "${fullPath}" '${argsStr}'`);
    return stdout.trim();
  }

  /**
   * Call external API
   */
  private async callAPI(endpoint: string, data?: any): Promise<any> {
    const axios = require('axios');
    const response = await axios.post(endpoint, data);
    return response.data;
  }

  /**
   * Execute JavaScript function
   */
  private async executeFunction(functionName: string, args?: any): Promise<any> {
    // This would require dynamic imports
    // For now, return placeholder
    console.log(`Function: ${functionName}(${JSON.stringify(args)})`);
    return { executed: functionName };
  }

  /**
   * Find plugin by command trigger
   */
  findPluginByCommand(trigger: string): { plugin: Plugin; command: PluginCommand } | null {
    for (const [id, plugin] of this.plugins) {
      const command = plugin.commands.find(cmd => cmd.trigger === trigger);
      if (command) {
        return { plugin, command };
      }
    }
    return null;
  }

  /**
   * Get all plugins
   */
  getAllPlugins(): Plugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Enable/disable plugin
   */
  async togglePlugin(pluginId: string, enabled: boolean): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (plugin) {
      plugin.enabled = enabled;
      await this.registerPlugin(plugin); // Save
      console.log(`${enabled ? '✅' : '❌'} Plugin ${plugin.name} ${enabled ? 'enabled' : 'disabled'}`);
    }
  }

  /**
   * Create default example plugins
   */
  async createExamplePlugins(): Promise<void> {
    // Example 1: Thumbnail generator
    const thumbnailPlugin: Plugin = {
      id: 'thumbnail-generator',
      name: 'Thumbnail Generator',
      description: 'Generate thumbnails from images',
      version: '1.0.0',
      author: 'RAGS',
      enabled: true,
      commands: [
        {
          trigger: 'generate thumbnail',
          description: 'Create thumbnail from image',
          handler: 'thumbnail.sh',
          type: 'script'
        }
      ]
    };

    // Example 2: Expense tracker
    const expensePlugin: Plugin = {
      id: 'expense-tracker',
      name: 'Expense Tracker',
      description: 'Track and fetch expenses',
      version: '1.0.0',
      author: 'RAGS',
      enabled: true,
      commands: [
        {
          trigger: 'fetch expenses',
          description: 'Get expense summary',
          handler: 'expenses.sh',
          type: 'script'
        }
      ]
    };

    await this.registerPlugin(thumbnailPlugin);
    await this.registerPlugin(expensePlugin);

    console.log('✅ Example plugins created');
  }
}

export const pluginFramework = new PluginFramework();
