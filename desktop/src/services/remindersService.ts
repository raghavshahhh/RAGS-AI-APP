/**
 * Reminders Service - Connect to Backend API
 */

const API_BASE = 'http://localhost:3000/api/v1';

export interface Reminder {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  remind_at: string;
  repeat: 'none' | 'daily' | 'weekly' | 'monthly';
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'completed' | 'snoozed';
  created_at: string;
  completed_at?: string;
}

export const remindersService = {
  /**
   * Get all reminders
   */
  async getAllReminders(status?: string): Promise<Reminder[]> {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    
    const response = await fetch(`${API_BASE}/reminders?${params}`, {
      headers: { 'Authorization': 'Bearer mock-token' }
    });
    
    if (!response.ok) {
      // If backend not available, return mock data
      return [];
    }
    
    const data = await response.json();
    return data.reminders || [];
  },

  /**
   * Create reminder
   */
  async createReminder(reminder: Partial<Reminder>): Promise<Reminder> {
    const response = await fetch(`${API_BASE}/reminders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer mock-token'
      },
      body: JSON.stringify(reminder)
    });
    
    const data = await response.json();
    return data.reminder;
  },

  /**
   * Update reminder
   */
  async updateReminder(id: string, updates: Partial<Reminder>): Promise<Reminder> {
    const response = await fetch(`${API_BASE}/reminders/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer mock-token'
      },
      body: JSON.stringify(updates)
    });
    
    const data = await response.json();
    return data.reminder;
  },

  /**
   * Complete reminder
   */
  async completeReminder(id: string): Promise<Reminder> {
    const response = await fetch(`${API_BASE}/reminders/${id}/complete`, {
      method: 'POST',
      headers: { 'Authorization': 'Bearer mock-token' }
    });
    
    const data = await response.json();
    return data.reminder;
  },

  /**
   * Snooze reminder
   */
  async snoozeReminder(id: string, minutes: number = 10): Promise<Reminder> {
    const response = await fetch(`${API_BASE}/reminders/${id}/snooze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer mock-token'
      },
      body: JSON.stringify({ minutes })
    });
    
    const data = await response.json();
    return data.reminder;
  },

  /**
   * Delete reminder
   */
  async deleteReminder(id: string): Promise<void> {
    await fetch(`${API_BASE}/reminders/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': 'Bearer mock-token' }
    });
  }
};
