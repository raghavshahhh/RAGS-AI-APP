/**
 * Notes Service - Connect to Backend API
 */

const API_BASE = 'http://localhost:3000/api/v1';

export interface Note {
  id: string;
  user_id: string;
  title: string;
  content: string;
  folder: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export const notesService = {
  /**
   * Get all notes
   */
  async getAllNotes(folder?: string, search?: string): Promise<Note[]> {
    const params = new URLSearchParams();
    if (folder) params.append('folder', folder);
    if (search) params.append('search', search);
    
    const response = await fetch(`${API_BASE}/notes?${params}`, {
      headers: { 'Authorization': 'Bearer mock-token' }
    });
    
    if (!response.ok) {
      // If backend not available, return mock data
      return [];
    }
    
    const data = await response.json();
    return data.notes || [];
  },

  /**
   * Get single note
   */
  async getNote(id: string): Promise<Note> {
    const response = await fetch(`${API_BASE}/notes/${id}`, {
      headers: { 'Authorization': 'Bearer mock-token' }
    });
    
    const data = await response.json();
    return data.note;
  },

  /**
   * Create new note
   */
  async createNote(note: Partial<Note>): Promise<Note> {
    const response = await fetch(`${API_BASE}/notes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer mock-token'
      },
      body: JSON.stringify(note)
    });
    
    const data = await response.json();
    return data.note;
  },

  /**
   * Update note
   */
  async updateNote(id: string, updates: Partial<Note>): Promise<Note> {
    const response = await fetch(`${API_BASE}/notes/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer mock-token'
      },
      body: JSON.stringify(updates)
    });
    
    const data = await response.json();
    return data.note;
  },

  /**
   * Delete note
   */
  async deleteNote(id: string): Promise<void> {
    await fetch(`${API_BASE}/notes/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': 'Bearer mock-token' }
    });
  },

  /**
   * Get folders
   */
  async getFolders(): Promise<string[]> {
    const response = await fetch(`${API_BASE}/notes/folders/list`, {
      headers: { 'Authorization': 'Bearer mock-token' }
    });
    
    if (!response.ok) return ['default'];
    
    const data = await response.json();
    return data.folders || ['default'];
  }
};
