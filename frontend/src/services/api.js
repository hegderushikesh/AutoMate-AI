import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 120000, // 120s for local Ollama LLM inferences
});

// Response interceptor for clear error extraction
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const errorMsg =
      error.response?.data?.detail ||
      error.response?.data?.message ||
      error.message ||
      'An unexpected network error occurred';
    return Promise.reject(new Error(errorMsg));
  }
);

export const api = {
  // System Health
  getHealth: () => apiClient.get('/health'),

  // Vehicles & Variants
  getVehicles: (params) => apiClient.get('/vehicles', { params }),
  getVehicleDetails: (id) => apiClient.get(`/vehicles/${id}`),
  createVehicle: (data) => apiClient.post('/vehicles', data),
  getVehicleVariants: (vehicleId) => apiClient.get(`/vehicles/${vehicleId}/variants`),
  addVariant: (vehicleId, data) => apiClient.post(`/vehicles/${vehicleId}/variants`, data),

  // Documents
  getDocuments: () => apiClient.get('/documents'),
  uploadDocument: (formData) =>
    apiClient.post('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getDocumentChunks: (docId) => apiClient.get(`/documents/${docId}/chunks`),
  deleteDocument: (docId) => apiClient.delete(`/documents/${docId}`),

  // RAG Chat
  sendMessage: (payload) => apiClient.post('/chat/message', payload),
  getChatSessions: () => apiClient.get('/chat/sessions'),
  createSession: (title, vehicleId) =>
    apiClient.post('/chat/sessions', null, { params: { title, vehicle_id: vehicleId } }),
  getSessionMessages: (sessionId) => apiClient.get(`/chat/sessions/${sessionId}/messages`),

  // Comparison
  compareVehicles: (vehicleIds) =>
    apiClient.post('/compare/vehicles', { vehicle_ids: vehicleIds }),
  compareVariants: (variantIds) =>
    apiClient.post('/compare/variants', { variant_ids: variantIds }),
};

export default api;
