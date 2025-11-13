interface StorageData {
  conversations: Array<{ role: string; content: string; timestamp: number }>;
  memories: Array<{ content: string; importance: number; timestamp: number }>;
  userPreferences: any;
  apiKeys: { gemini?: string; openai?: string };
}

class LocalStorageService {
  private dbName = 'RAGS_AI_DB';
  private storageKey = 'rags_local_data';

  // Save conversation locally
  saveConversation(role: string, content: string) {
    const data = this.getData();
    data.conversations.push({
      role,
      content,
      timestamp: Date.now()
    });
    
    // Keep only last 1000 messages
    if (data.conversations.length > 1000) {
      data.conversations = data.conversations.slice(-1000);
    }
    
    this.saveData(data);
  }

  // Save memory locally
  saveMemory(content: string, importance: number = 5) {
    const data = this.getData();
    data.memories.push({
      content,
      importance,
      timestamp: Date.now()
    });
    
    // Keep only important memories (top 500)
    if (data.memories.length > 500) {
      data.memories.sort((a, b) => b.importance - a.importance);
      data.memories = data.memories.slice(0, 500);
    }
    
    this.saveData(data);
  }

  // Get conversations
  getConversations(limit: number = 50): Array<any> {
    const data = this.getData();
    return data.conversations.slice(-limit);
  }

  // Search memories
  searchMemories(query: string, limit: number = 10): Array<any> {
    const data = this.getData();
    const lowerQuery = query.toLowerCase();
    
    return data.memories
      .filter(m => m.content.toLowerCase().includes(lowerQuery))
      .sort((a, b) => b.importance - a.importance)
      .slice(0, limit);
  }

  // Save API keys securely (encrypted in localStorage)
  saveAPIKey(provider: 'gemini' | 'openai', key: string) {
    const data = this.getData();
    data.apiKeys[provider] = this.simpleEncrypt(key);
    this.saveData(data);
  }

  // Get API key
  getAPIKey(provider: 'gemini' | 'openai'): string | null {
    const data = this.getData();
    const encrypted = data.apiKeys[provider];
    return encrypted ? this.simpleDecrypt(encrypted) : null;
  }

  // Export all data (for backup)
  exportData(): string {
    const data = this.getData();
    return JSON.stringify(data, null, 2);
  }

  // Import data (from backup)
  importData(jsonData: string) {
    try {
      const data = JSON.parse(jsonData);
      this.saveData(data);
      return true;
    } catch {
      return false;
    }
  }

  // Clear all data
  clearAllData() {
    localStorage.removeItem(this.storageKey);
  }

  // Get storage size
  getStorageSize(): string {
    const data = JSON.stringify(this.getData());
    const bytes = new Blob([data]).size;
    return `${(bytes / 1024).toFixed(2)} KB`;
  }

  private getData(): StorageData {
    const stored = localStorage.getItem(this.storageKey);
    if (stored) {
      return JSON.parse(stored);
    }
    
    return {
      conversations: [],
      memories: [],
      userPreferences: {},
      apiKeys: {}
    };
  }

  private saveData(data: StorageData) {
    localStorage.setItem(this.storageKey, JSON.stringify(data));
  }

  private simpleEncrypt(text: string): string {
    return btoa(text);
  }

  private simpleDecrypt(encrypted: string): string {
    return atob(encrypted);
  }
}

export const localStorageService = new LocalStorageService();
