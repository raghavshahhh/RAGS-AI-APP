import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Voice API
export const voiceAPI = {
  startListening: () => api.post('/voice/start'),
  stopListening: () => api.post('/voice/stop'),
  sendAudio: (audioBlob: Blob) => {
    const formData = new FormData();
    formData.append('audio', audioBlob);
    return api.post('/voice/process', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// Notes API
export const notesAPI = {
  getAll: () => api.get('/notes'),
  create: (note: { title: string; content: string }) => api.post('/notes', note),
  update: (id: string, note: Partial<{ title: string; content: string }>) =>
    api.put(`/notes/${id}`, note),
  delete: (id: string) => api.delete(`/notes/${id}`),
};

// Reminders API
export const remindersAPI = {
  getAll: () => api.get('/reminders'),
  create: (reminder: { title: string; time: string }) =>
    api.post('/reminders', reminder),
  update: (id: string, reminder: Partial<{ title: string; time: string }>) =>
    api.put(`/reminders/${id}`, reminder),
  delete: (id: string) => api.delete(`/reminders/${id}`),
};

// Routines API
export const routinesAPI = {
  getAll: () => api.get('/routines'),
  create: (routine: { name: string; actions: any[] }) =>
    api.post('/routines', routine),
  update: (id: string, routine: Partial<{ name: string; actions: any[] }>) =>
    api.put(`/routines/${id}`, routine),
  delete: (id: string) => api.delete(`/routines/${id}`),
  execute: (id: string) => api.post(`/routines/${id}/execute`),
};

// Health check
export const healthCheck = () => api.get('/health');

export default api;

