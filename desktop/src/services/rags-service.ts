import axios from 'axios';
import { invoke } from '@tauri-apps/api/tauri';

const RAGS_API_URL = 'http://localhost:3000';
const API_TIMEOUT = 5000;

class RAGSService {
  private isRunning: boolean = false;

  // Check if RAGS backend is running
  async checkStatus() {
    try {
      const response = await axios.get(`${RAGS_API_URL}/health`, { timeout: 2000 });
      this.isRunning = response.status === 200;
      return this.isRunning;
    } catch (error) {
      this.isRunning = false;
      return false;
    }
  }

  // Start RAGS backend
  async start() {
    try {
      // First start the backend server
      const result = await invoke('start_rags');
      console.log('RAGS start result:', result);
      
      // Wait for backend to be ready
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Check if backend is running
      const backendRunning = await this.checkStatus();
      if (!backendRunning) {
        throw new Error('Backend failed to start');
      }
      
      // Initialize RAGS AI system
      const response = await axios.post(`${RAGS_API_URL}/api/v1/rags/start`);
      if (!response.data.success) {
        throw new Error(response.data.error);
      }
      
      this.isRunning = true;
      return true;
    } catch (error) {
      console.error('Failed to start RAGS:', error);
      return false;
    }
  }

  // Stop RAGS backend
  async stop() {
    try {
      // Stop RAGS AI system
      await axios.post(`${RAGS_API_URL}/api/v1/rags/stop`);
      
      // Stop backend server
      const result = await invoke('stop_rags');
      console.log('RAGS stop result:', result);
      
      this.isRunning = false;
      return true;
    } catch (error) {
      console.error('Failed to stop RAGS:', error);
      return false;
    }
  }

  // Get RAGS system status
  async getSystemStatus() {
    try {
      const response = await axios.get(`${RAGS_API_URL}/api/v1/rags/status`);
      return response.data;
    } catch (error) {
      return {
        running: false,
        status: {
          isListening: false,
          isProcessing: false,
          battery: { percentage: 0, charging: false },
          wifi: { connected: false },
          memory: 0
        }
      };
    }
  }

  // Send voice command
  async sendCommand(command: string) {
    try {
      const response = await axios.post(`${RAGS_API_URL}/api/v1/rags/command`, {
        command,
        timestamp: new Date().toISOString(),
      });
      return response.data;
    } catch (error) {
      console.error('Voice command failed:', error);
      throw error;
    }
  }

  // Activate voice (simulate "Hey RAGS")
  async activateVoice() {
    try {
      const response = await axios.post(`${RAGS_API_URL}/api/v1/voice/activate`);
      return response.data;
    } catch (error) {
      console.error('Voice activation failed:', error);
      throw error;
    }
  }

  // Get conversation history
  async getHistory() {
    try {
      const response = await axios.get(`${RAGS_API_URL}/api/v1/voice/history`);
      return response.data;
    } catch (error) {
      return [];
    }
  }

  // Research query
  async research(query: string) {
    try {
      const response = await axios.post(`${RAGS_API_URL}/api/v1/voice/research`, {
        query,
      });
      return response.data;
    } catch (error) {
      console.error('Research failed:', error);
      throw error;
    }
  }

  // System commands
  async systemCommand(command: string, params?: any) {
    try {
      const response = await axios.post(`${RAGS_API_URL}/api/v1/voice/system`, {
        command,
        params,
      });
      return response.data;
    } catch (error) {
      console.error('System command failed:', error);
      throw error;
    }
  }

  get isBackendRunning() {
    return this.isRunning;
  }
}

export const ragsService = new RAGSService();