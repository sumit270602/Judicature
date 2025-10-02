import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Types
export interface DashboardStats {
  activeCases: number;
  todayHearings: number;
  pendingTasks: number;
  monthlyRevenue: number;
}

export interface ClientDashboardStats {
  totalCases: number;
  activeCases: number;
  completedCases: number;
  pendingPayments: number;
  nextCourtDate: string;
  aiAssistantAvailable: boolean;
}

export interface Case {
  _id: string;
  title: string;
  description: string;
  caseType: string;
  status: 'active' | 'pending' | 'closed';
  priority: 'high' | 'medium' | 'low';
  client: {
    _id: string;
    name: string;
    email: string;
  };
  lawyer?: {
    _id: string;
    name: string;
    email: string;
  };
  nextHearing?: string;
  progress: number; // Added progress field
  createdAt: string;
  updatedAt: string;
}

export interface TimelineEvent {
  _id: string;
  caseId: string;
  title: string;
  description: string;
  type: 'update' | 'document' | 'hearing' | 'payment';
  createdAt: string;
}

export interface Document {
  _id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  caseId?: string;
  uploadedBy: string;
  uploadedAt: string;
  url: string;
}

export interface UploadResponse {
  document: Document;
  message: string;
}

// API functions
const dashboardAPI = {
  // Lawyer Dashboard APIs
  getLawyerStats: async (): Promise<DashboardStats> => {
    const { data } = await axios.get(`${API_BASE_URL}/dashboard/lawyer/stats`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    return data;
  },

  getLawyerCases: async (): Promise<Case[]> => {
    const { data } = await axios.get(`${API_BASE_URL}/cases`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    return data.cases || [];
  },

  // Client Dashboard APIs
  getClientStats: async (): Promise<ClientDashboardStats> => {
    const { data } = await axios.get(`${API_BASE_URL}/dashboard/client/stats`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    return data;
  },

  getClientCases: async (): Promise<Case[]> => {
    const { data } = await axios.get(`${API_BASE_URL}/cases`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    return data.cases || [];
  },

  getTimelineEvents: async (caseId?: string): Promise<TimelineEvent[]> => {
    const url = caseId 
      ? `${API_BASE_URL}/cases/${caseId}/timeline` 
      : `${API_BASE_URL}/dashboard/timeline`;
    
    const { data } = await axios.get(url, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    return data.events || [];
  },

  // Document APIs
  uploadDocument: async (formData: FormData): Promise<UploadResponse> => {
    const { data } = await axios.post(`${API_BASE_URL}/documents/case/upload`, formData, {
      headers: { 
        Authorization: `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'multipart/form-data'
      }
    });
    return data;
  },

  getDocuments: async (caseId?: string): Promise<Document[]> => {
    const url = caseId 
      ? `${API_BASE_URL}/documents/case/${caseId}` 
      : `${API_BASE_URL}/documents/my-documents`;
    
    const { data } = await axios.get(url, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    return data.documents || [];
  },

  // Case management
  updateCase: async (caseId: string, updates: Partial<Case>): Promise<Case> => {
    const { data } = await axios.put(`${API_BASE_URL}/cases/${caseId}`, updates, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    return data.case;
  },

  createCase: async (caseData: Partial<Case>): Promise<Case> => {
    const { data } = await axios.post(`${API_BASE_URL}/cases`, caseData, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    return data.case;
  }
};

// Custom hooks
export const useLawyerDashboard = () => {
  const queryClient = useQueryClient();

  const statsQuery = useQuery({
    queryKey: ['lawyer', 'stats'],
    queryFn: dashboardAPI.getLawyerStats,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const casesQuery = useQuery({
    queryKey: ['lawyer', 'cases'],
    queryFn: dashboardAPI.getLawyerCases,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  const updateCaseMutation = useMutation({
    mutationFn: ({ caseId, updates }: { caseId: string; updates: Partial<Case> }) =>
      dashboardAPI.updateCase(caseId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lawyer', 'cases'] });
      queryClient.invalidateQueries({ queryKey: ['lawyer', 'stats'] });
    },
  });

  const createCaseMutation = useMutation({
    mutationFn: dashboardAPI.createCase,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lawyer', 'cases'] });
      queryClient.invalidateQueries({ queryKey: ['lawyer', 'stats'] });
    },
  });

  return {
    stats: statsQuery.data,
    cases: casesQuery.data,
    isLoading: statsQuery.isLoading || casesQuery.isLoading,
    error: statsQuery.error || casesQuery.error,
    updateCase: updateCaseMutation.mutate,
    createCase: createCaseMutation.mutate,
    isUpdating: updateCaseMutation.isPending || createCaseMutation.isPending,
  };
};

export const useClientDashboard = () => {
  const queryClient = useQueryClient();

  const statsQuery = useQuery({
    queryKey: ['client', 'stats'],
    queryFn: dashboardAPI.getClientStats,
    staleTime: 5 * 60 * 1000,
  });

  const casesQuery = useQuery({
    queryKey: ['client', 'cases'],
    queryFn: dashboardAPI.getClientCases,
    staleTime: 2 * 60 * 1000,
  });

  const timelineQuery = useQuery({
    queryKey: ['client', 'timeline'],
    queryFn: () => dashboardAPI.getTimelineEvents(),
    staleTime: 1 * 60 * 1000, // 1 minute
  });

  const documentsQuery = useQuery({
    queryKey: ['client', 'documents'],
    queryFn: () => dashboardAPI.getDocuments(),
    staleTime: 5 * 60 * 1000,
  });

  const uploadDocumentMutation = useMutation({
    mutationFn: dashboardAPI.uploadDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client', 'documents'] });
    },
  });

  return {
    stats: statsQuery.data,
    cases: casesQuery.data,
    timeline: timelineQuery.data,
    documents: documentsQuery.data,
    isLoading: statsQuery.isLoading || casesQuery.isLoading || timelineQuery.isLoading,
    error: statsQuery.error || casesQuery.error || timelineQuery.error,
    uploadDocument: uploadDocumentMutation.mutate,
    isUploading: uploadDocumentMutation.isPending,
  };
};

// Real-time updates hook using WebSocket
export const useRealTimeUpdates = (userId: string, userRole: 'lawyer' | 'client') => {
  const queryClient = useQueryClient();
  const [socket, setSocket] = useState<WebSocket | null>(null);

  useEffect(() => {
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:5000';
    const ws = new WebSocket(`${wsUrl}?userId=${userId}&role=${userRole}`);
    
    ws.onopen = () => {
      console.log('WebSocket connected for dashboard updates');
      setSocket(ws);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      // Handle different types of real-time updates
      switch (data.type) {
        case 'case_update':
          queryClient.invalidateQueries({ queryKey: [userRole, 'cases'] });
          queryClient.invalidateQueries({ queryKey: [userRole, 'stats'] });
          break;
        case 'new_message':
          queryClient.invalidateQueries({ queryKey: [userRole, 'timeline'] });
          break;
        case 'document_uploaded':
          queryClient.invalidateQueries({ queryKey: [userRole, 'documents'] });
          break;
        case 'hearing_scheduled':
          queryClient.invalidateQueries({ queryKey: [userRole, 'stats'] });
          queryClient.invalidateQueries({ queryKey: [userRole, 'cases'] });
          break;
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => {
      ws.close();
    };
  }, [userId, userRole, queryClient]);

  return socket;
};