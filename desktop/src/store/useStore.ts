import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  type?: 'system' | 'user' | 'assistant';
  content: string;
  timestamp: Date;
  emotion?: string;
  error?: boolean;
}

interface SystemStatus {
  backend: 'connected' | 'disconnected' | 'error';
  ollama: 'ready' | 'unavailable' | 'loading';
  websocket: 'connected' | 'disconnected';
  lastHealthCheck: number;
}

interface Settings {
  theme: 'dark' | 'light';
  volume: number;
  voiceEnabled: boolean;
  cameraEnabled: boolean;
  notificationsEnabled: boolean;
}

interface Store {
  // Voice state
  isListening: boolean;
  setIsListening: (value: boolean) => void;
  isSpeaking: boolean;
  setIsSpeaking: (value: boolean) => void;
  
  // Messages
  messages: Message[];
  addMessage: (message: Message) => void;
  clearMessages: () => void;
  deleteMessage: (id: string) => void;
  
  // System status
  systemStatus: SystemStatus;
  updateSystemStatus: (status: Partial<SystemStatus>) => void;
  
  // Settings
  settings: Settings;
  updateSettings: (settings: Partial<Settings>) => void;
  
  // Errors
  errors: Array<{ id: string; message: string; timestamp: number }>;
  addError: (message: string) => void;
  clearErrors: () => void;
  
  // Connection
  isConnected: boolean;
  setIsConnected: (value: boolean) => void;
  latency: number;
  setLatency: (value: number) => void;
  
  // UI State
  activePanel: 'chat' | 'automate' | 'schedule' | 'settings' | null;
  setActivePanel: (panel: 'chat' | 'automate' | 'schedule' | 'settings' | null) => void;
}

export const useStore = create<Store>()(persist(
  (set) => ({
    // Voice state
    isListening: false,
    setIsListening: (value) => set({ isListening: value }),
    isSpeaking: false,
    setIsSpeaking: (value) => set({ isSpeaking: value }),
    
    // Messages
    messages: [],
    addMessage: (message) => set((state) => ({
      messages: [...state.messages, message].slice(-100) // Keep last 100 messages
    })),
    clearMessages: () => set({ messages: [] }),
    deleteMessage: (id) => set((state) => ({
      messages: state.messages.filter(m => m.id !== id)
    })),
    
    // System status
    systemStatus: {
      backend: 'disconnected',
      ollama: 'unavailable',
      websocket: 'disconnected',
      lastHealthCheck: 0,
    },
    updateSystemStatus: (status) => set((state) => ({
      systemStatus: { ...state.systemStatus, ...status, lastHealthCheck: Date.now() }
    })),
    
    // Settings
    settings: {
      theme: 'dark',
      volume: 0.7,
      voiceEnabled: true,
      cameraEnabled: true,
      notificationsEnabled: true,
    },
    updateSettings: (settings) => set((state) => ({
      settings: { ...state.settings, ...settings }
    })),
    
    // Errors
    errors: [],
    addError: (message) => set((state) => ({
      errors: [
        ...state.errors,
        { id: Date.now().toString(), message, timestamp: Date.now() }
      ].slice(-10) // Keep last 10 errors
    })),
    clearErrors: () => set({ errors: [] }),
    
    // Connection
    isConnected: false,
    setIsConnected: (value) => set({ isConnected: value }),
    latency: 0,
    setLatency: (value) => set({ latency: value }),
    
    // UI State
    activePanel: null,
    setActivePanel: (panel) => set({ activePanel: panel }),
  }),
  {
    name: 'rags-storage',
    storage: createJSONStorage(() => localStorage),
    partialize: (state) => ({
      // Only persist these fields
      settings: state.settings,
      messages: state.messages.slice(-20), // Persist last 20 messages
    }),
  }
));

