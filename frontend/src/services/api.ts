import axios from 'axios';

const API_BASE_URL = 'http://localhost:5005/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add debugging
api.interceptors.request.use(
  (config) => {
    console.log('🚀 API Request:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', response.config.url, response.status);
    return response;
  },
  (error) => {
    console.error('❌ API Error:', error.message);
    console.error('❌ Error Details:', error.response?.data || 'No response data');
    return Promise.reject(error);
  }
);

// Simple API calls - no cache busting for stability
export const roomAPI = {
  getAll: () => api.get('/rooms'),
  getById: (id: number) => api.get(`/rooms/${id}`),
  create: (data: any) => api.post('/rooms', data),
  update: (id: number, data: any) => api.put(`/rooms/${id}`, data),
  delete: (id: number) => api.delete(`/rooms/${id}`),
  getAvailable: () => api.get('/rooms/available'),
};

export const studentAPI = {
  getAll: () => api.get('/students'),
  getById: (id: number) => api.get(`/students/${id}`),
  create: (data: any) => api.post('/students', data),
  update: (id: number, data: any) => api.put(`/students/${id}`, data),
  delete: (id: number) => api.delete(`/students/${id}`),
  assignToRoom: (studentId: number, roomId: number) => 
    api.post('/students/assign', { student_id: studentId, room_id: roomId }),
  removeFromRoom: (studentId: number) => 
    api.delete(`/students/${studentId}/room`),
  getUnassigned: () => api.get('/students/unassigned'),
  getStudentsInRoom: (roomId: number) => api.get(`/students/room/${roomId}`),
};

export const paymentAPI = {
  getAll: () => api.get('/payments'),
  getByStudentId: (studentId: number) => api.get(`/payments/student/${studentId}`),
  create: (data: any) => api.post('/payments', data),
  updateStatus: (id: number, status: string, paymentDate?: string) => 
    api.put(`/payments/${id}`, { status, payment_date: paymentDate }),
  getPending: () => api.get('/payments/pending'),
  getDueInWeek: () => api.get('/payments/due-in-week'),
  getOverdue: () => api.get('/payments/overdue'),
  sendReminders: () => api.post('/payments/send-reminders'),
  sendWarnings: () => api.post('/payments/send-warnings'),
  createMonthlyPayments: () => api.post('/payments/create-monthly'),
};

export default api;
