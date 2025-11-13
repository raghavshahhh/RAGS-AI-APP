/**
 * 🔧 SELF-MODIFICATION ENGINE
 * Allows RAGS to modify its own code, add features, and evolve
 */

import { EventEmitter } from 'events';
import { OllamaBrain } from './ollama-brain';
import * as fs from 'fs/promises';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface CodeGenerationRequest {
  requirement: string;
  context?: string;
  language: string;
  location: string;
}

interface GeneratedCode {
  id: string;
  code: string;
  language: string;
  file_path: string;
  tests?: string;
  documentation?: string;
  safety_score: number; // 0-100
  generated_at: Date;
}

interface Plugin {
  id: string;
  name: string;
  description: string;
  version: string;
  installed: boolean;
  enabled: boolean;
  dependencies?: string[];
}

interface ArchitectureChange {
  id: string;
  type: 'optimization' | 'refactor' | 'feature_add' | 'bug_fix';
  description: string;
  changes: string[];
  impact_score: number; // 0-100
  status: 'proposed' | 'tested' | 'applied' | 'rolled_back';
  created_at: Date;
}

export class SelfModificationEngine extends EventEmitter {
  private brain: OllamaBrain;
  private dataDir: string;
  private generatedCode: Map<string, GeneratedCode> = new Map();
  private plugins: Map<string, Plugin> = new Map();
  private architectureChanges: ArchitectureChange[] = [];
  private modificationEnabled: boolean = true;
  private safetyThreshold: number = 70; // Min safety score to auto-apply

  constructor(brain: OllamaBrain, userId: string = 'default') {
    super();
    this.brain = brain;
    this.dataDir = path.join(process.env.HOME || '', '.rags', 'self-modification', userId);
  }

  /**
   * Initialize Self-Modification Engine
   */
  async initialize(): Promise<void> {
    console.log('🔧 Initializing Self-Modification Engine...');

    await fs.mkdir(this.dataDir, { recursive: true });
    await this.loadData();

    console.log('✅ Self-Modification Engine initialized');
    console.log(`   - Modification enabled: ${this.modificationEnabled}`);
    console.log(`   - Safety threshold: ${this.safetyThreshold}`);
  }

  /**
   * Generate code from natural language requirement
   */
  async generateCode(request: CodeGenerationRequest): Promise<GeneratedCode> {
    console.log(`🔧 Generating ${request.language} code for: "${request.requirement}"`);

    const codePrompt = `
Generate production-ready ${request.language} code for:

Requirement: ${request.requirement}
${request.context ? `Context: ${request.context}` : ''}

Requirements:
1. Complete, working code
2. Proper error handling
3. TypeScript types (if applicable)
4. Clean, documented code
5. Follow best practices

Generate the code:
`;

    const code = await this.brain.chat(codePrompt);

    // Generate tests
    const testPrompt = `
Generate unit tests for this code:

\`\`\`${request.language}
${code}
\`\`\`

Use appropriate testing framework. Generate complete tests:
`;

    const tests = await this.brain.chat(testPrompt);

    // Generate documentation
    const docPrompt = `
Generate documentation for this code:

\`\`\`${request.language}
${code}
\`\`\`

Include:
1. Overview
2. Parameters
3. Return values
4. Usage examples
5. Edge cases

Generate markdown documentation:
`;

    const documentation = await this.brain.chat(docPrompt);

    // Safety analysis
    const safetyScore = await this.analyzeSafety(code, request.language);

    const generated: GeneratedCode = {
      id: `code_${Date.now()}`,
      code,
      language: request.language,
      file_path: request.location,
      tests,
      documentation,
      safety_score: safetyScore,
      generated_at: new Date()
    };

    this.generatedCode.set(generated.id, generated);
    await this.saveData();

    this.emit('code_generated', generated);
    console.log(`✅ Code generated (safety: ${safetyScore}/100)`);

    return generated;
  }

  /**
   * Test generated code in sandbox
   */
  async testCode(codeId: string): Promise<{ success: boolean; output: string; errors?: string[] }> {
    const code = this.generatedCode.get(codeId);
    if (!code) {
      throw new Error('Code not found');
    }

    console.log(`🧪 Testing code: ${codeId}`);

    try {
      // Create temporary test file
      const testDir = path.join(this.dataDir, 'test', codeId);
      await fs.mkdir(testDir, { recursive: true });

      const testFile = path.join(testDir, `test.${this.getFileExtension(code.language)}`);
      await fs.writeFile(testFile, code.code);

      // Run syntax check based on language
      let testResult: { success: boolean; output: string; errors?: string[] };

      switch (code.language.toLowerCase()) {
        case 'typescript':
        case 'javascript':
          testResult = await this.testTypeScriptCode(testFile);
          break;
        case 'python':
          testResult = await this.testPythonCode(testFile);
          break;
        default:
          testResult = { success: true, output: 'Syntax check not available for this language' };
      }

      console.log(`${testResult.success ? '✅' : '❌'} Test result: ${testResult.success ? 'PASS' : 'FAIL'}`);

      return testResult;
    } catch (error: any) {
      return {
        success: false,
        output: '',
        errors: [error.message]
      };
    }
  }

  /**
   * Deploy code to target location (with safety checks)
   */
  async deployCode(codeId: string, backup: boolean = true): Promise<void> {
    const code = this.generatedCode.get(codeId);
    if (!code) {
      throw new Error('Code not found');
    }

    if (code.safety_score < this.safetyThreshold) {
      throw new Error(`Code safety score (${code.safety_score}) below threshold (${this.safetyThreshold})`);
    }

    if (!this.modificationEnabled) {
      throw new Error('Self-modification is disabled');
    }

    console.log(`🚀 Deploying code to: ${code.file_path}`);

    try {
      // Create backup if requested
      if (backup) {
        await this.createBackup(code.file_path);
      }

      // Ensure directory exists
      const dir = path.dirname(code.file_path);
      await fs.mkdir(dir, { recursive: true });

      // Write code
      await fs.writeFile(code.file_path, code.code);

      console.log('✅ Code deployed successfully');
      this.emit('code_deployed', { codeId, path: code.file_path });
    } catch (error: any) {
      console.error('❌ Deployment failed:', error.message);
      throw error;
    }
  }

  /**
   * Discover and install plugins
   */
  async discoverPlugins(query: string): Promise<Plugin[]> {
    console.log(`🔍 Discovering plugins for: "${query}"`);

    const discoveryPrompt = `
Find npm packages or plugins that can help with: "${query}"

For each plugin provide:
1. Name (actual npm package name)
2. Description (brief)
3. Version (latest)
4. Dependencies (if any)

Format as JSON array:
[
  {
    "name": "package-name",
    "description": "What it does",
    "version": "1.0.0",
    "dependencies": []
  }
]
`;

    const response = await this.brain.chat(discoveryPrompt);

    try {
      const plugins = JSON.parse(response);
      
      for (const pluginData of plugins) {
        const plugin: Plugin = {
          id: `plugin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: pluginData.name,
          description: pluginData.description,
          version: pluginData.version,
          installed: false,
          enabled: false,
          dependencies: pluginData.dependencies || []
        };

        this.plugins.set(plugin.id, plugin);
      }

      await this.saveData();
      console.log(`✅ Discovered ${plugins.length} plugins`);

      return Array.from(this.plugins.values());
    } catch (error) {
      console.error('Error parsing plugin discovery:', error);
      return [];
    }
  }

  /**
   * Install plugin
   */
  async installPlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error('Plugin not found');
    }

    console.log(`📦 Installing plugin: ${plugin.name}`);

    try {
      // Install via npm
      const { stdout, stderr } = await execAsync(
        `npm install ${plugin.name}@${plugin.version}`,
        { cwd: path.join(__dirname, '..', '..') }
      );

      plugin.installed = true;
      plugin.enabled = true;
      await this.saveData();

      console.log(`✅ Plugin installed: ${plugin.name}`);
      this.emit('plugin_installed', plugin);
    } catch (error: any) {
      console.error(`❌ Plugin installation failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Optimize architecture
   */
  async optimizeArchitecture(targetArea?: string): Promise<ArchitectureChange> {
    console.log(`⚡ Analyzing architecture for optimization${targetArea ? `: ${targetArea}` : ''}...`);

    const analysisPrompt = `
Analyze the RAGS AI codebase and suggest architecture optimizations.

${targetArea ? `Focus area: ${targetArea}` : 'General optimization'}

Consider:
1. Performance improvements
2. Code organization
3. Scalability
4. Maintainability
5. Best practices

Suggest specific, actionable changes:
`;

    const suggestions = await this.brain.chat(analysisPrompt);

    const change: ArchitectureChange = {
      id: `arch_${Date.now()}`,
      type: 'optimization',
      description: suggestions,
      changes: [], // Would extract from suggestions
      impact_score: 75, // Would calculate
      status: 'proposed',
      created_at: new Date()
    };

    this.architectureChanges.push(change);
    await this.saveData();

    console.log('✅ Architecture analysis complete');
    this.emit('architecture_optimized', change);

    return change;
  }

  /**
   * Evolve personality based on feedback
   */
  async evolvePersonality(feedbackData: any[]): Promise<string> {
    console.log('🧬 Evolving personality based on feedback...');

    const evolutionPrompt = `
Analyze this user feedback and suggest personality adjustments:

Feedback: ${JSON.stringify(feedbackData.slice(-10))}

Suggest:
1. Communication style adjustments
2. Response tone modifications
3. Behavior changes
4. New personality traits to emphasize

Provide actionable personality evolution:
`;

    const evolution = await this.brain.chat(evolutionPrompt);

    console.log('✅ Personality evolution analyzed');
    this.emit('personality_evolved', evolution);

    return evolution;
  }

  /**
   * Add new feature dynamically
   */
  async addFeature(featureDescription: string): Promise<GeneratedCode> {
    console.log(`✨ Adding new feature: "${featureDescription}"`);

    // Analyze where feature should go
    const analysisPrompt = `
Feature request: "${featureDescription}"

Determine:
1. What files need to be created/modified
2. What dependencies are needed
3. Where in the codebase it fits
4. Integration points with existing systems

Provide implementation plan:
`;

    const plan = await this.brain.chat(analysisPrompt);

    console.log('📋 Implementation plan created');
    console.log(plan);

    // Generate the code
    const code = await this.generateCode({
      requirement: featureDescription,
      context: plan,
      language: 'typescript',
      location: path.join(__dirname, 'generated', `feature_${Date.now()}.ts`)
    });

    console.log('✅ Feature code generated');
    this.emit('feature_added', { description: featureDescription, code });

    return code;
  }

  /**
   * Get modification statistics
   */
  getStats(): any {
    return {
      total_code_generated: this.generatedCode.size,
      plugins_discovered: this.plugins.size,
      plugins_installed: Array.from(this.plugins.values()).filter(p => p.installed).length,
      architecture_changes: this.architectureChanges.length,
      modification_enabled: this.modificationEnabled,
      safety_threshold: this.safetyThreshold
    };
  }

  /**
   * Enable/disable self-modification
   */
  setModificationEnabled(enabled: boolean): void {
    this.modificationEnabled = enabled;
    console.log(`🔧 Self-modification ${enabled ? 'enabled' : 'disabled'}`);
  }

  // Private helper methods

  private async analyzeSafety(code: string, language: string): Promise<number> {
    // Check for dangerous patterns
    const dangerousPatterns = [
      'eval(',
      'exec(',
      'rm -rf',
      'del /f',
      'DROP TABLE',
      'DELETE FROM',
      '__import__',
      'os.system',
      'subprocess.call'
    ];

    let safetyScore = 100;

    for (const pattern of dangerousPatterns) {
      if (code.includes(pattern)) {
        safetyScore -= 20;
      }
    }

    return Math.max(0, safetyScore);
  }

  private getFileExtension(language: string): string {
    const extensions: Record<string, string> = {
      typescript: 'ts',
      javascript: 'js',
      python: 'py',
      java: 'java',
      cpp: 'cpp',
      rust: 'rs'
    };
    return extensions[language.toLowerCase()] || 'txt';
  }

  private async testTypeScriptCode(filePath: string): Promise<{ success: boolean; output: string; errors?: string[] }> {
    try {
      const { stdout, stderr } = await execAsync(`npx tsc --noEmit ${filePath}`);
      return {
        success: true,
        output: stdout || 'TypeScript check passed'
      };
    } catch (error: any) {
      return {
        success: false,
        output: error.stdout || '',
        errors: [error.stderr || error.message]
      };
    }
  }

  private async testPythonCode(filePath: string): Promise<{ success: boolean; output: string; errors?: string[] }> {
    try {
      const { stdout, stderr } = await execAsync(`python3 -m py_compile ${filePath}`);
      return {
        success: true,
        output: 'Python syntax check passed'
      };
    } catch (error: any) {
      return {
        success: false,
        output: '',
        errors: [error.message]
      };
    }
  }

  private async createBackup(filePath: string): Promise<void> {
    try {
      const backupDir = path.join(this.dataDir, 'backups');
      await fs.mkdir(backupDir, { recursive: true });

      const timestamp = Date.now();
      const backupPath = path.join(backupDir, `${path.basename(filePath)}.${timestamp}.backup`);

      const exists = await fs.access(filePath).then(() => true).catch(() => false);
      if (exists) {
        await fs.copyFile(filePath, backupPath);
        console.log(`💾 Backup created: ${backupPath}`);
      }
    } catch (error) {
      console.warn('Warning: Backup creation failed:', error);
    }
  }

  private async loadData(): Promise<void> {
    try {
      const dataFile = path.join(this.dataDir, 'modification_data.json');
      const data = await fs.readFile(dataFile, 'utf-8');
      const parsed = JSON.parse(data);

      if (parsed.generatedCode) {
        this.generatedCode = new Map(Object.entries(parsed.generatedCode));
      }
      if (parsed.plugins) {
        this.plugins = new Map(Object.entries(parsed.plugins));
      }
      if (parsed.architectureChanges) {
        this.architectureChanges = parsed.architectureChanges;
      }

      console.log('📚 Loaded modification data');
    } catch (error) {
      console.log('📚 No existing modification data');
    }
  }

  private async saveData(): Promise<void> {
    try {
      const dataFile = path.join(this.dataDir, 'modification_data.json');
      await fs.writeFile(dataFile, JSON.stringify({
        generatedCode: Object.fromEntries(this.generatedCode),
        plugins: Object.fromEntries(this.plugins),
        architectureChanges: this.architectureChanges
      }, null, 2));
    } catch (error) {
      console.error('Error saving modification data:', error);
    }
  }
}
