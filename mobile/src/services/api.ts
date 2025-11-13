import axios from 'axios';

// Change this to your backend URL
const API_BASE_URL = __DEV__ 
  ? 'http://localhost:3000' 
  : 'https://your-production-api.com';

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
    // Add auth token if available
    // const token = await AsyncStorage.getItem('auth_token');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Voice API
export const voiceAPI = {
  startListening: () => api.post('/voice/start'),
  stopListening: () => api.post('/voice/stop'),
  sendAudio: (audioUri: string) => {
    const formData = new FormData();
    formData.append('audio', {
      uri: audioUri,
      type: 'audio/wav',
      name: 'recording.wav',
    } as any);
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
export const healthCheck = async () => {
  try {
    const response = await api.get('/health');
    return response.data;
  } catch (error) {
    return { status: 'offline' };
  }
};

export default api;

