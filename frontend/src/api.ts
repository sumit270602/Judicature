import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: API_URL,
});

// Attach JWT token to requests if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth APIs
export const register = (data: { name: string; email: string; password: string; role: string }) =>
  api.post('/auth/register', data);

export const login = (data: { email: string; password: string }) =>
  api.post('/auth/login', data);

export const getMe = () => api.get('/auth/me');

// Case APIs
export const createCase = (data: {
  title: string;
  description: string;
  caseType: string;
  priority: string;
  lawyer?: string;
}) => api.post('/cases', data);

export const getCases = () => api.get('/cases');

export const getCaseById = (id: string) => api.get(`/cases/${id}`);

export const updateCase = (id: string, data: any) => api.put(`/cases/${id}`, data);

// Recommendation APIs
export const getLawyerRecommendations = (data: {
  caseType: string;
  caseDescription: string;
  priority: string;
}) => api.post('/recommendations/lawyers-for-case', data);

// Document APIs
export const uploadCaseDocument = (formData: FormData) => api.post('/documents/case/upload', formData, {
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});

export const getCaseDocuments = (caseId: string) => api.get(`/documents/case/${caseId}`);

export const downloadDocument = (documentId: string) => api.get(`/documents/download/${documentId}`, {
  responseType: 'blob',
}); 