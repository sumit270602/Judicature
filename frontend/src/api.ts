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
export const register = (data: { 
  name: string; 
  email: string; 
  password: string; 
  role: string;
  // Lawyer-specific fields
  barCouncilId?: string;
  practiceAreas?: string[];
  experience?: number;
  hourlyRate?: number;
  bio?: string;
  phone?: string;
  address?: string;
}) => api.post('/auth/register', data);

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
  // Service-based fields
  selectedService?: string;
  serviceCategory?: string;
  serviceType?: string;
  useServiceBased?: boolean;
}) => api.post('/cases', data);

export const getCases = () => api.get('/cases');

export const getCaseById = (id: string) => api.get(`/cases/${id}`);

export const updateCase = (id: string, data: any) => api.put(`/cases/${id}`, data);

// Case work completion APIs
export const uploadWorkProof = (caseId: string, formData: FormData) => api.post(`/cases/${caseId}/upload-proof`, formData, {
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});

export const resolveCase = (caseId: string, data: { workProofDescription?: string; resolvedAt?: string }) => 
  api.post(`/cases/${caseId}/resolve`, data);

// Recommendation APIs
export const getLawyerRecommendations = (data: {
  caseType: string;
  caseDescription: string;
  priority: string;
}) => api.post('/recommendations/lawyers-for-case', data);

// Service-based lawyer recommendations
export const getServiceBasedLawyerRecommendations = (data: {
  serviceId?: string;
  serviceCategory?: string;
  serviceType?: string;
  caseDescription: string;
  priority: string;
}) => api.post('/recommendations/lawyers-for-service', data);

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

// User Profile APIs
export const updateLawyerProfile = (data: {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  barCouncilId: string;
  practiceAreas: string[];
  experience: number;
  hourlyRate: number;
  bio?: string;
}) => api.put('/users/profile/lawyer', data);

// Legal Services APIs
export const getServiceCategories = () => api.get('/services/categories');

export const createLegalService = (data: {
  category: string;
  serviceType: string;
  title: string;
  description: string;
  pricing: {
    type: 'fixed' | 'hourly' | 'range';
    amount?: number;
    minAmount?: number;
    maxAmount?: number;
    hourlyRate?: number;
    currency?: string;
  };
  estimatedDuration: string;
  requirements?: string[];
  deliverables?: string[];
  metrics?: {
    experienceYears?: number;
    successRate?: number;
    casesHandled?: number;
  };
  availability?: {
    isAcceptingClients?: boolean;
    maxCasesPerMonth?: number;
  };
}) => api.post('/services', data);

export const getLawyerServices = (lawyerId?: string) => 
  lawyerId ? api.get(`/services/lawyer/${lawyerId}`) : api.get('/services/my-services');

export const updateLegalService = (serviceId: string, data: any) => 
  api.put(`/services/${serviceId}`, data);

export const deleteLegalService = (serviceId: string) => 
  api.delete(`/services/${serviceId}`);

export const getServicesByCategory = (category: string, params?: {
  minPrice?: number;
  maxPrice?: number;
  sortBy?: string;
}) => api.get(`/services/category/${category}`, { params });

export const getServicesByType = (serviceType: string, params?: {
  minPrice?: number;
  maxPrice?: number;
  sortBy?: string;
}) => api.get(`/services/type/${serviceType}`, { params });

export const searchServices = (params: {
  query: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: string;
}) => api.get('/services/search', { params });

// Billing APIs
export const getClientPayments = (params?: {
  status?: string;
  page?: number;
  limit?: number;
}) => api.get('/billing/client/payments', { params });

export const getLawyerPayments = (params?: {
  status?: string;
  page?: number;
  limit?: number;
}) => api.get('/billing/lawyer/payments', { params });

export const getPaymentDetails = (paymentId: string) => api.get(`/billing/payment/${paymentId}`);

export const createPaymentOrder = (data: {
  caseId: string;
  amount: number;
  description?: string;
}) => api.post('/billing/create-order', data);

export const verifyPayment = (data: {
  paymentId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}) => api.post('/billing/verify-payment', data); 