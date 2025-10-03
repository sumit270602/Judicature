import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Calendar, Clock, FileText, Users, DollarSign, AlertCircle, Briefcase, MessageSquare, Bell, TrendingUp, User, Shield, Upload, CheckCircle, Settings, Search, Download, CreditCard, X, RefreshCw } from 'lucide-react';
import { useLawyerDashboard, useRealTimeUpdates } from '@/hooks/useDashboard';
import { useAuth } from '@/hooks/use-auth';
import { api } from '@/api';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import MessagingTrigger from '@/components/MessagingTrigger';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import LawyerProfileManagement from '@/components/LawyerProfileManagement';
import { NotificationSystem } from '@/components/NotificationPopup';
import LawyerServiceManagement from '@/components/LawyerServiceManagement';
import LawyerOnboarding from '@/components/LawyerOnboarding';
import OrderManagement from '@/components/OrderManagement';
import PaymentRequests from '@/components/PaymentRequests';
import CreatePaymentRequest from '@/components/CreatePaymentRequest';

// Dashboard stats type
interface DashboardStats {
  activeCases: number;
  todayHearings: number;
  pendingTasks: number;
  monthlyRevenue: number;
  totalCases: number;
  resolvedCases: number;
  totalClients: number;
  completedOrders: number;
  successRate: number;
}

/**
 * Custom pagination hook for handling paginated data
 * @param items - Array of items to paginate
 * @param itemsPerPage - Number of items per page (default: 10)
 * @returns Pagination utilities and current page items
 */
const usePagination = function <T>(items: T[], itemsPerPage: number = 10) {
  const [currentPage, setCurrentPage] = useState(1);
  
  const totalPages = Math.ceil(items.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = items.slice(startIndex, endIndex);
  
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };
  
  const nextPage = () => goToPage(currentPage + 1);
  const prevPage = () => goToPage(currentPage - 1);
  
  return {
    currentItems,
    currentPage,
    totalPages,
    totalItems: items.length,
    itemsPerPage,
    goToPage,
    nextPage,
    prevPage,
    hasNext: currentPage < totalPages,
    hasPrev: currentPage > 1
  };
};

/**
 * Loading skeleton component for displaying loading states
 * @param count - Number of skeleton items to show
 * @param height - Height class for skeleton items
 */
const LoadingSkeleton = ({ count = 3, height = "h-20" }: { count?: number; height?: string }) => (
  <div className="space-y-3">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className={`animate-pulse bg-gray-200 rounded-lg ${height}`} />
    ))}
  </div>
);

/**
 * Reusable pagination component
 * @param currentPage - Current active page number
 * @param totalPages - Total number of pages
 * @param onPageChange - Function to handle page changes
 * @param totalItems - Total number of items
 * @param itemsPerPage - Number of items per page
 */
const PaginationComponent = ({ 
  currentPage, 
  totalPages, 
  onPageChange, 
  totalItems, 
  itemsPerPage 
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  itemsPerPage: number;
}) => {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between mt-6">
      <div className="text-sm text-gray-600">
        Showing {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)} to{' '}
        {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} items
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          Previous
        </Button>
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          const page = i + 1;
          return (
            <Button
              key={page}
              variant={page === currentPage ? "default" : "outline"}
              size="sm"
              onClick={() => onPageChange(page)}
            >
              {page}
            </Button>
          );
        })}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Next
        </Button>
      </div>
    </div>
  );
};

// Type definitions
interface Client {
  _id: string;
  name: string;
  email: string;
  lastContact: string;
  casesCount: number;
  activeCases: number;
  caseTypes?: string[];
}

interface Document {
  _id: string;
  originalName: string;
  mimeType: string;
  fileSize: number;
  uploadedAt: string;
  caseTitle?: string;
  caseId?: string;
  caseStatus?: string;
}

interface Notification {
  _id: string;
  type: 'case_update' | 'payment_received' | 'hearing_reminder' | 'document_uploaded' | 'client_message';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  urgent?: boolean;
}

// Case interface
interface Case {
  _id: string;
  title: string;
  client: {
    name: string;
    email: string;
  };
  status: 'active' | 'pending' | 'in_progress' | 'resolved' | 'completed' | 'closed';
  priority: 'high' | 'medium' | 'low';
  nextHearing?: string;
  progress: number;
  caseNumber?: string;
  createdAt?: string;
  updatedAt?: string;
  workProof?: {
    documentId: string;
    uploadedAt: string;
    description: string;
  };
}

// Header stats cards component
const LawyerHeaderCards = ({ stats }: { stats: DashboardStats }) => (
  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
    <Card className="border-l-4 border-l-legal-navy">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Active Cases</CardTitle>
        <Briefcase className="h-4 w-4 text-legal-navy" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-legal-navy">{stats.activeCases}</div>
        <p className="text-xs text-muted-foreground">
          {stats.totalCases > 0 ? `${Math.round((stats.activeCases / stats.totalCases) * 100)}%` : '0%'} of total cases
        </p>
      </CardContent>
    </Card>
    
    <Card className="border-l-4 border-l-legal-gold">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Today's Hearings</CardTitle>
        <Calendar className="h-4 w-4 text-legal-gold" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-legal-gold">{stats.todayHearings}</div>
        <p className="text-xs text-muted-foreground">Scheduled for today</p>
      </CardContent>
    </Card>
    
    <Card className="border-l-4 border-l-orange-500">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
        <AlertCircle className="h-4 w-4 text-orange-500" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-orange-500">{stats.pendingTasks}</div>
        <p className="text-xs text-muted-foreground">Requires attention</p>
      </CardContent>
    </Card>
    
    <Card className="border-l-4 border-l-green-500">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
        <DollarSign className="h-4 w-4 text-green-500" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-green-500">₹{stats.monthlyRevenue.toLocaleString()}</div>
        <p className="text-xs text-muted-foreground">This month's earnings</p>
      </CardContent>
    </Card>
  </div>
);

// Enhanced Case Management component with tabs
const EnhancedCaseManagement = ({ cases }: { cases: Case[] }) => {
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Enhanced case filtering with search
  const getFilteredCases = () => {
    let filtered = cases;
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(c => 
        c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.caseNumber?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(c => c.status === filterStatus);
    }
    
    // Sort cases
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return new Date(b.updatedAt || b.createdAt || '').getTime() - new Date(a.updatedAt || a.createdAt || '').getTime();
        case 'priority':
          const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
          return (priorityOrder[b.priority as keyof typeof priorityOrder] || 0) - (priorityOrder[a.priority as keyof typeof priorityOrder] || 0);
        case 'progress':
          return b.progress - a.progress;
        default:
          return 0;
      }
    });
  };
  
  // Enhanced case filtering for stats
  const filteredCases = getFilteredCases();
  const pagination = usePagination(filteredCases, 6); // 6 cases per page
  
  const pendingCases = cases.filter(c => ['active', 'pending', 'in_progress'].includes(c.status));
  const processingCases = cases.filter(c => c.status === 'resolved');
  const completedCases = cases.filter(c => ['completed', 'closed'].includes(c.status));

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-purple-100 text-purple-800';
      case 'resolved': return 'bg-orange-100 text-orange-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleCaseAction = async (caseId: string, action: string) => {
    switch (action) {
      case 'view':
        window.location.href = `/case/${caseId}/view`;
        break;
      case 'edit':
        window.location.href = `/case/${caseId}/edit`;
        break;
      case 'upload-proof':
        // Open upload work proof modal
        const uploadEvent = new CustomEvent('openWorkProofUpload', { detail: { caseId } });
        window.dispatchEvent(uploadEvent);
        break;
      case 'mark-resolved':
        // Update case status to resolved
        try {
          await api.put(`/cases/${caseId}`, { status: 'resolved' });
          window.location.reload();
        } catch (error) {
          console.error('Error updating case status:', error);
        }
        break;
      case 'send-payment-request':
        window.location.href = `/payment-requests/create?caseId=${caseId}`;
        break;
    }
  };

  const CaseTable = ({ cases, showWorkProofColumn = false }: { cases: Case[], showWorkProofColumn?: boolean }) => (
    <div className="space-y-4">
      {/* Search and Filter Controls */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search cases..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-64"
            />
          </div>
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border rounded-md text-sm"
          >
            <option value="all">All Cases</option>
            <option value="pending">Pending</option>
            <option value="active">Active</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Processing Payment</option>
            <option value="completed">Completed</option>
          </select>
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border rounded-md text-sm"
          >
            <option value="recent">Most Recent</option>
            <option value="priority">By Priority</option>
            <option value="progress">By Progress</option>
          </select>
        </div>
        <div className="text-sm text-muted-foreground">
          {pagination.totalItems} case{pagination.totalItems !== 1 ? 's' : ''} total
        </div>
      </div>
      
      {loading ? (
        <LoadingSkeleton count={6} height="h-16" />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Case Title</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Last Updated</TableHead>
                {showWorkProofColumn && <TableHead>Work Status</TableHead>}
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagination.currentItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={showWorkProofColumn ? 8 : 7} className="text-center py-8 text-muted-foreground">
                    No cases found matching your criteria
                  </TableCell>
                </TableRow>
              ) : (
                pagination.currentItems.map((case_) => (
            <TableRow 
              key={case_._id} 
              className={`hover:bg-gray-50 transition-colors cursor-pointer ${selectedCaseId === case_._id ? 'bg-blue-50' : ''}`}
              onClick={() => setSelectedCaseId(selectedCaseId === case_._id ? null : case_._id)}
            >
              <TableCell className="font-medium">
                <div>
                  <p className="font-medium">{case_.title}</p>
                  {case_.nextHearing && (
                    <p className="text-xs text-muted-foreground">
                      Next hearing: {new Date(case_.nextHearing).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div>
                  <p className="text-sm font-medium">{case_.client?.name || 'N/A'}</p>
                  <p className="text-xs text-muted-foreground">{case_.client?.email}</p>
                </div>
              </TableCell>
              <TableCell>
                <Badge className={`capitalize ${getStatusColor(case_.status)}`}>
                  {case_.status === 'resolved' ? 'Payment Processing' : case_.status.replace('_', ' ')}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge 
                  variant={case_.priority === 'high' ? 'destructive' : case_.priority === 'medium' ? 'default' : 'secondary'}
                >
                  {case_.priority}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Progress value={case_.progress} className="w-16" />
                  <span className="text-sm">{case_.progress}%</span>
                </div>
              </TableCell>
              <TableCell>
                <p className="text-xs text-muted-foreground">
                  {case_.updatedAt ? new Date(case_.updatedAt).toLocaleDateString() : 'N/A'}
                </p>
              </TableCell>
              {showWorkProofColumn && (
                <TableCell>
                  <div className="flex items-center gap-1">
                    {case_.workProof ? (
                      <Badge variant="outline" className="text-green-600">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Submitted
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-gray-500">
                        Pending
                      </Badge>
                    )}
                  </div>
                </TableCell>
              )}
              <TableCell onClick={(e) => e.stopPropagation()}>
                <div className="flex gap-1 flex-wrap">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleCaseAction(case_._id, 'view')}
                  >
                    <FileText className="h-3 w-3 mr-1" />
                    View
                  </Button>
                  {case_.status === 'active' && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleCaseAction(case_._id, 'upload-proof')}
                    >
                      <Upload className="h-3 w-3 mr-1" />
                      Submit Work
                    </Button>
                  )}
                  {case_.status === 'resolved' && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleCaseAction(case_._id, 'send-payment-request')}
                    >
                      <DollarSign className="h-3 w-3 mr-1" />
                      Request Payment
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
          
    <PaginationComponent
      currentPage={pagination.currentPage}
      totalPages={pagination.totalPages}
      onPageChange={pagination.goToPage}
      totalItems={pagination.totalItems}
      itemsPerPage={pagination.itemsPerPage}
    />
    </>
      )}
    </div>
  );

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Briefcase className="h-5 w-5" />
          Case Management
        </CardTitle>
        <CardDescription>Manage your cases and track work completion</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Pending ({pendingCases.length})
            </TabsTrigger>
            <TabsTrigger value="resolved" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Payment Processing ({processingCases.length})
            </TabsTrigger>
            <TabsTrigger value="completed" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Completed ({completedCases.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-4">
            <div className="mb-4">
              <h3 className="text-lg font-semibold">Active & Pending Cases</h3>
              <p className="text-sm text-muted-foreground">Cases requiring your attention and work completion</p>
            </div>
            <CaseTable cases={pendingCases} showWorkProofColumn={true} />
          </TabsContent>

          <TabsContent value="resolved" className="mt-4">
            <div className="mb-4">
              <h3 className="text-lg font-semibold">Resolved Cases - Payment Processing</h3>
              <p className="text-sm text-muted-foreground">Work completed, waiting for client payment confirmation</p>
            </div>
            <CaseTable cases={processingCases} />
          </TabsContent>

          <TabsContent value="completed" className="mt-4">
            <div className="mb-4">
              <h3 className="text-lg font-semibold">Completed Cases</h3>
              <p className="text-sm text-muted-foreground">Successfully completed and paid cases</p>
            </div>
            <CaseTable cases={completedCases} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

// Enhanced AI Legal Research & Chatbot Component
const LegalResearch = () => {
  const [activeTab, setActiveTab] = useState('assistant');
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [recentResearches, setRecentResearches] = useState([]);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const [researchHistory, setResearchHistory] = useState<any[]>([]);
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  const [caseLawSuggestions, setCaseLawSuggestions] = useState<any[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    fetchRecentResearches();
    fetchResearchHistory();
    loadSuggestedQuestions();
  }, []);

  const fetchRecentResearches = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/ai/research/recent`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setRecentResearches(data.researches || []);
      }
    } catch (error) {
      console.error('Error fetching recent researches:', error);
    }
  };

  const fetchResearchHistory = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/ai/research/history`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setResearchHistory(data.history || []);
      }
    } catch (error) {
      console.error('Error fetching research history:', error);
    }
  };

  const loadSuggestedQuestions = () => {
    const suggestions = [
      "What are the recent amendments to the Indian Contract Act?",
      "Explain the doctrine of precedent in Indian law",
      "What are the requirements for filing a civil suit?",
      "How to draft a non-disclosure agreement?",
      "What are the consumer protection laws in India?",
      "Explain the process of trademark registration",
      "What are the penalties for breach of contract?",
      "How to file for divorce under Hindu Marriage Act?",
      "What is the procedure for company incorporation?",
      "Explain intellectual property rights in India",
      "What are the labor law compliance requirements?",
      "How to handle property disputes effectively?"
    ];
    setSuggestedQuestions(suggestions);
  };

  const handleSendMessage = async (messageText: string = query) => {
    if (!messageText.trim()) return;

    setIsLoading(true);
    const userMessage = { 
      type: 'user', 
      content: messageText, 
      timestamp: new Date().toISOString(),
      id: Date.now().toString()
    };
    setMessages(prev => [...prev, userMessage]);
    
    // Add typing indicator
    const typingMessage = {
      type: 'ai',
      content: 'AI is typing...',
      timestamp: new Date().toISOString(),
      id: 'typing-indicator',
      isTyping: true
    };
    setMessages(prev => [...prev, typingMessage]);

    try {
      const formData = new FormData();
      formData.append('message', messageText);
      formData.append('context', 'legal_research');
      if (file) {
        formData.append('document', file);
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/ai/legal-research`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        const aiMessage = { 
          type: 'ai', 
          content: data.response,
          timestamp: new Date().toISOString(),
          id: Date.now().toString() + '_ai',
          citations: data.citations || [],
          caseLaws: data.caseLaws || [],
          relatedTopics: data.relatedTopics || []
        };
        // Remove typing indicator and add AI response
        setMessages(prev => prev.filter(msg => msg.id !== 'typing-indicator').concat([aiMessage]));
        
        // Update case law suggestions if provided
        if (data.caseLaws && data.caseLaws.length > 0) {
          setCaseLawSuggestions(data.caseLaws);
        }
      } else {
        // If API call fails, try fallback response
        throw new Error('API call failed');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Provide intelligent fallback responses based on query content
      let fallbackResponse = 'I apologize, but I encountered an error while processing your request. Please try again.';
      
      const queryLower = messageText.toLowerCase();
      if (queryLower.includes('contract') || queryLower.includes('agreement')) {
        fallbackResponse = 'For contract-related queries, I recommend reviewing the Indian Contract Act, 1872. Key considerations include offer, acceptance, consideration, and legal capacity of parties. Would you like me to elaborate on any specific aspect?';
      } else if (queryLower.includes('divorce') || queryLower.includes('marriage')) {
        fallbackResponse = 'For matrimonial matters, relevant laws include the Hindu Marriage Act, 1955, Special Marriage Act, 1954, and Divorce Act, 1869. The grounds and procedures vary based on religion and circumstances. What specific aspect would you like to know more about?';
      } else if (queryLower.includes('property') || queryLower.includes('real estate')) {
        fallbackResponse = 'Property law in India involves multiple acts including Transfer of Property Act, 1882, Registration Act, 1908, and various state-specific laws. Are you dealing with purchase, sale, rental, or ownership disputes?';
      } else if (queryLower.includes('criminal') || queryLower.includes('fir') || queryLower.includes('police')) {
        fallbackResponse = 'For criminal matters, the primary laws are Indian Penal Code, 1860, and Code of Criminal Procedure, 1973. The process typically involves FIR, investigation, chargesheet, and trial. What specific criminal law question do you have?';
      } else if (queryLower.includes('employment') || queryLower.includes('job') || queryLower.includes('salary')) {
        fallbackResponse = 'Employment law in India is governed by various acts including Industrial Relations Code, 2020, and Minimum Wages Act, 1948. Key areas include termination, wages, working conditions, and dispute resolution. What employment issue are you facing?';
      }
      
      const errorMessage = {
        type: 'ai',
        content: fallbackResponse,
        timestamp: new Date().toISOString(),
        id: Date.now().toString() + '_fallback',
        isFallback: true
      };
      // Remove typing indicator and add fallback response
      setMessages(prev => prev.filter(msg => msg.id !== 'typing-indicator').concat([errorMessage]));
    } finally {
      setIsLoading(false);
      setQuery('');
      setFile(null);
    }
  };

  const handleDocumentAnalysis = async () => {
    if (!file) return;

    setIsAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append('document', file);
      formData.append('analysisType', 'comprehensive');

      const response = await fetch(`${import.meta.env.VITE_API_URL}/ai/document-analysis`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getToken()}`
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        setAnalysisResults(data);
      }
    } catch (error) {
      console.error('Error analyzing document:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const clearConversation = () => {
    setMessages([]);
    setAnalysisResults(null);
    setCaseLawSuggestions([]);
  };

  const saveResearch = async () => {
    try {
      const researchData = {
        messages,
        query: messages[0]?.content || '',
        timestamp: new Date().toISOString()
      };

      await fetch(`${import.meta.env.VITE_API_URL}/ai/research/save`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(researchData)
      });
    } catch (error) {
      console.error('Error saving research:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* AI Research Header */}
      <Card className="bg-gradient-to-r from-indigo-50 to-blue-50 border-indigo-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-100 rounded-full">
                <FileText className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">AI Legal Research Assistant</h2>
                <p className="text-gray-600">Powered by advanced legal AI for comprehensive research</p>
              </div>
            </div>
            <div className="flex gap-2">
              {messages.length > 0 && (
                <Button variant="outline" size="sm" onClick={saveResearch}>
                  <Upload className="h-4 w-4 mr-2" />
                  Save Research
                </Button>
              )}
              {messages.length > 0 && (
                <Button variant="outline" size="sm" onClick={clearConversation}>
                  Clear Chat
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chat Interface */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Legal Research Chat
              </CardTitle>
              <CardDescription>Ask questions about laws, cases, procedures, and legal documents</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="assistant">Chat</TabsTrigger>
                  <TabsTrigger value="analysis">Analysis</TabsTrigger>
                  <TabsTrigger value="cases">Case Law</TabsTrigger>
                  <TabsTrigger value="history">History</TabsTrigger>
                </TabsList>
          
          <TabsContent value="assistant" className="space-y-4">
            <div className="border rounded-lg p-4 min-h-[300px] max-h-[400px] overflow-y-auto bg-gray-50">
              {messages.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Ask me anything about legal research, case law, or document analysis</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message, index) => (
                    <div key={message.id || index} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                      {message.isTyping ? (
                        <div className="bg-white border p-3 rounded-lg max-w-[80%]">
                          <div className="flex items-center gap-2">
                            <div className="flex gap-1">
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                            </div>
                            <span className="text-xs text-gray-500">AI is analyzing your query...</span>
                          </div>
                        </div>
                      ) : (
                        <div className={`p-3 rounded-lg max-w-[80%] ${
                          message.type === 'user' 
                            ? 'bg-blue-600 text-white' 
                            : message.isFallback
                              ? 'bg-yellow-50 border border-yellow-200'
                              : 'bg-white border'
                        }`}>
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          {message.timestamp && (
                            <p className={`text-xs mt-1 ${
                              message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                            }`}>
                              {new Date(message.timestamp).toLocaleTimeString()}
                            </p>
                          )}
                          {message.isFallback && (
                            <div className="flex items-center gap-1 mt-2">
                              <AlertCircle className="h-3 w-3 text-yellow-600" />
                              <span className="text-xs text-yellow-600">Offline response</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask a legal question..."
                className="flex-1 px-3 py-2 border rounded-md"
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              />
              <Button onClick={() => handleSendMessage()} disabled={isLoading || !query.trim()}>
                Send
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="analysis" className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-sm text-muted-foreground mb-4">Upload a legal document for AI analysis</p>
              <input
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="hidden"
                id="document-upload"
              />
              <label htmlFor="document-upload">
                <Button variant="outline" asChild>
                  <span>Choose File</span>
                </Button>
              </label>
              {file && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-700">Selected: {file.name}</p>
                  <Button 
                    size="sm" 
                    className="mt-2" 
                    onClick={handleDocumentAnalysis}
                    disabled={isAnalyzing}
                  >
                    {isAnalyzing ? 'Analyzing...' : 'Start Analysis'}
                  </Button>
                </div>
              )}
            </div>
            
            {analysisResults && (
              <Card className="bg-blue-50 border-blue-200">
                <CardHeader>
                  <CardTitle className="text-blue-800">Document Analysis Results</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Summary</h4>
                    <p className="text-sm text-gray-700">{analysisResults.summary}</p>
                  </div>
                  {analysisResults.keyPoints && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Key Points</h4>
                      <ul className="list-disc list-inside space-y-1">
                        {analysisResults.keyPoints.map((point: string, index: number) => (
                          <li key={index} className="text-sm text-gray-700">{point}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {analysisResults.legalIssues && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Legal Issues Identified</h4>
                      <div className="space-y-2">
                        {analysisResults.legalIssues.map((issue: any, index: number) => (
                          <Badge key={index} variant="outline" className="mr-2">
                            {issue}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="cases" className="space-y-4">
            {caseLawSuggestions.length > 0 ? (
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900">Relevant Case Laws</h3>
                {caseLawSuggestions.map((caselaw: any, index: number) => (
                  <Card key={index} className="border-l-4 border-l-indigo-500">
                    <CardContent className="p-4">
                      <h4 className="font-semibold text-gray-900 mb-2">{caselaw.title}</h4>
                      <p className="text-sm text-gray-600 mb-2">{caselaw.citation}</p>
                      <p className="text-sm text-gray-700 mb-3">{caselaw.summary}</p>
                      <div className="flex gap-2">
                        <Badge variant="secondary">{caselaw.court}</Badge>
                        <Badge variant="outline">{caselaw.year}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No case law suggestions yet</p>
                <p className="text-sm">Ask a legal question to get relevant case law recommendations</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            {researchHistory.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No research history available</p>
              </div>
            ) : (
              <div className="space-y-3">
                {researchHistory.map((research: any, index) => (
                  <Card key={index} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 mb-1">{research.query}</h4>
                          <p className="text-sm text-gray-600 mb-2">{research.summary}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>{new Date(research.createdAt).toLocaleDateString()}</span>
                            <span>{research.messageCount} messages</span>
                            {research.documentAnalyzed && <span>Document analyzed</span>}
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Continue
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  </div>

        {/* Sidebar with Quick Actions and Suggestions */}
        <div className="space-y-6">
          {/* Quick Legal Questions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Quick Legal Questions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {suggestedQuestions.slice(0, 4).map((question, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="w-full text-left h-auto p-3 text-xs"
                  onClick={() => {
                    setQuery(question);
                    handleSendMessage(question);
                  }}
                >
                  {question}
                </Button>
              ))}
            </CardContent>
          </Card>

          {/* Research Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Research Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Researches</span>
                <Badge variant="secondary">{researchHistory.length}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Documents Analyzed</span>
                <Badge variant="secondary">
                  {researchHistory.filter(r => r.documentAnalyzed).length}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Case Laws Found</span>
                <Badge variant="secondary">{caseLawSuggestions.length}</Badge>
              </div>
            </CardContent>
          </Card>


        </div>
      </div>
    </div>
  );
};

// Enhanced Payments & Escrow Management component
const PaymentsEscrowManagement = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'pending' | 'completed' | 'escrow'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setIsLoading(true);
        const { data } = await api.get('/orders');
        setOrders(data.orders || []);
      } catch (error) {
        console.error('Failed to fetch orders:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const formatCurrency = (amount: number, currency: string = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: 0,
    }).format(amount / 100);
  };

  const getTotalEarnings = () => {
    return orders
      .filter(order => order.status === 'completed')
      .reduce((total, order) => total + order.amount, 0);
  };

  const getPendingEscrow = () => {
    return orders
      .filter(order => order.escrowStatus === 'held')
      .reduce((total, order) => total + order.amount, 0);
  };

  const getFilteredOrders = () => {
    let filtered = orders;
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(order => 
        order.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.client?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.serviceType.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply tab filter
    switch (activeTab) {
      case 'pending':
        filtered = filtered.filter(order => ['pending', 'in_progress'].includes(order.status));
        break;
      case 'completed':
        filtered = filtered.filter(order => order.status === 'completed');
        break;
      case 'escrow':
        filtered = filtered.filter(order => order.escrowStatus === 'held');
        break;
      default:
        break;
    }
    
    return filtered;
  };

  const getPaymentStats = () => {
    const totalRevenue = getTotalEarnings();
    const pendingPayments = orders
      .filter(order => ['pending', 'in_progress'].includes(order.status))
      .reduce((total, order) => total + order.amount, 0);
    const escrowAmount = getPendingEscrow();
    const completedThisMonth = orders
      .filter(order => {
        const orderDate = new Date(order.createdAt);
        const now = new Date();
        return order.status === 'completed' && 
               orderDate.getMonth() === now.getMonth() &&
               orderDate.getFullYear() === now.getFullYear();
      })
      .reduce((total, order) => total + order.amount, 0);
    
    return { totalRevenue, pendingPayments, escrowAmount, completedThisMonth };
  };

  if (isLoading) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Loading...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const stats = getPaymentStats();
  const filteredOrders = getFilteredOrders();

  return (
    <div className="space-y-6">
      {/* Payment Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Total Revenue</p>
                <p className="text-2xl font-bold text-green-900">
                  {formatCurrency(stats.totalRevenue)}
                </p>
                <p className="text-xs text-green-600 mt-1">All time earnings</p>
              </div>
              <div className="h-12 w-12 bg-green-200 rounded-full flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">This Month</p>
                <p className="text-2xl font-bold text-blue-900">
                  {formatCurrency(stats.completedThisMonth)}
                </p>
                <p className="text-xs text-blue-600 mt-1">Completed payments</p>
              </div>
              <div className="h-12 w-12 bg-blue-200 rounded-full flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-blue-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-700">Pending</p>
                <p className="text-2xl font-bold text-orange-900">
                  {formatCurrency(stats.pendingPayments)}
                </p>
                <p className="text-xs text-orange-600 mt-1">Awaiting completion</p>
              </div>
              <div className="h-12 w-12 bg-orange-200 rounded-full flex items-center justify-center">
                <Clock className="h-6 w-6 text-orange-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700">Escrow</p>
                <p className="text-2xl font-bold text-purple-900">
                  {formatCurrency(stats.escrowAmount)}
                </p>
                <p className="text-xs text-purple-600 mt-1">Secured funds</p>
              </div>
              <div className="h-12 w-12 bg-purple-200 rounded-full flex items-center justify-center">
                <Shield className="h-6 w-6 text-purple-700" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Management */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Management
              </CardTitle>
              <CardDescription>Track and manage all client payments</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => {/* Handle create invoice */}}>
                <FileText className="h-4 w-4 mr-2" />
                Create Invoice
              </Button>
              <Button size="sm" variant="outline" onClick={() => {/* Handle payment request */}}>
                <DollarSign className="h-4 w-4 mr-2" />
                Request Payment
              </Button>
            </div>
          </div>
          
          {/* Filters and Search */}
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by order ID, client, or service..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="quarter">This Quarter</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)} className="mt-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="pending">Pending ({orders.filter(o => ['pending', 'in_progress'].includes(o.status)).length})</TabsTrigger>
              <TabsTrigger value="completed">Completed ({orders.filter(o => o.status === 'completed').length})</TabsTrigger>
              <TabsTrigger value="escrow">Escrow ({orders.filter(o => o.escrowStatus === 'held').length})</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>

        <CardContent>
          {/* Payment List */}
          <div className="space-y-4">
            {filteredOrders.length > 0 ? (
              filteredOrders.map((order) => (
                <Card key={order._id} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm">{order.orderId}</p>
                          <Badge 
                            variant={order.status === 'completed' ? 'default' : 
                                   order.status === 'pending' ? 'secondary' : 'outline'}
                          >
                            {order.status.replace('_', ' ').toUpperCase()}
                          </Badge>
                          {order.escrowStatus === 'held' && (
                            <Badge variant="outline" className="bg-purple-50 text-purple-700">
                              Escrow
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          <User className="h-4 w-4 inline mr-1" />
                          Client: {order.client?.name || 'Unknown'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          <Briefcase className="h-4 w-4 inline mr-1" />
                          Service: {order.serviceType.replace('_', ' ')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Created: {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      
                      <div className="flex flex-col items-end space-y-2">
                        <div className="text-right">
                          <p className="text-lg font-bold">
                            {formatCurrency(order.amount, order.currency)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {order.paymentMethod || 'Online Payment'}
                          </p>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm">
                            View Details
                          </Button>
                          {order.status === 'pending' && (
                            <Button variant="outline" size="sm">
                              Send Reminder
                            </Button>
                          )}
                          {order.status === 'completed' && (
                            <Button variant="outline" size="sm">
                              Download Invoice
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-12">
                <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">
                  {searchTerm ? 'No payments found' : 'No payments yet'}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm 
                    ? 'Try adjusting your search terms'
                    : 'Payments will appear here as clients make orders'
                  }
                </p>
                {searchTerm && (
                  <Button variant="outline" onClick={() => setSearchTerm('')}>
                    Clear Search
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Analytics component
const Analytics = () => (
  <Card className="mb-6">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <TrendingUp className="h-5 w-5" />
        Analytics & Reports
      </CardTitle>
      <CardDescription>Performance metrics and insights</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-muted rounded-lg">
            <p className="text-2xl font-bold text-legal-navy">85%</p>
            <p className="text-xs text-muted-foreground">Case Win Rate</p>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <p className="text-2xl font-bold text-green-600">$45k</p>
            <p className="text-xs text-muted-foreground">This Quarter</p>
          </div>
        </div>
        
        <div>
          <h4 className="text-sm font-medium mb-2">Case Distribution</h4>
          <div className="space-y-2">
            {[
              { type: 'Property Law', count: 8, percentage: 40 },
              { type: 'Contract Law', count: 6, percentage: 30 },
              { type: 'Business Law', count: 4, percentage: 20 },
              { type: 'Employment Law', count: 2, percentage: 10 },
            ].map((item, index) => (
              <div key={index}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{item.type}</span>
                  <span>{item.count} cases</span>
                </div>
                <Progress value={item.percentage} className="h-2" />
              </div>
            ))}
          </div>
        </div>
        
        <Button variant="outline" className="w-full">
          <TrendingUp className="mr-2 h-4 w-4" />
          View Detailed Reports
        </Button>
      </div>
    </CardContent>
  </Card>
);

// Enhanced Quick Actions for Lawyers
const LawyerQuickActions = ({ onTabChange }: { onTabChange: (tab: string) => void }) => {
  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'create-case':
        window.location.href = '/cases/create';
        break;
      case 'upload-document':
        // Switch to documents tab and trigger upload
        onTabChange('documents');
        setTimeout(() => {
          const uploadEvent = new CustomEvent('triggerDocumentUpload');
          window.dispatchEvent(uploadEvent);
        }, 100);
        break;
      case 'send-payment-request':
        // Switch to payments tab
        onTabChange('payments');
        break;
      case 'schedule-hearing':
        // Switch to cases tab for hearing management
        onTabChange('cases');
        break;
      case 'view-clients':
        // Switch to clients tab
        onTabChange('clients');
        break;
      case 'compose-message':
        // Open messaging system
        const messageEvent = new CustomEvent('openMessaging');
        window.dispatchEvent(messageEvent);
        break;
      case 'ai-research':
        // Switch to AI research tab
        onTabChange('research');
        break;
      case 'view-documents':
        // Switch to documents tab
        onTabChange('documents');
        break;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Lawyer Quick Actions
        </CardTitle>
        <CardDescription>Essential tools for your legal practice</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button 
          variant="outline" 
          className="w-full justify-start hover:bg-legal-navy/5 transition-colors"
          onClick={() => handleQuickAction('create-case')}
        >
          <FileText className="h-4 w-4 mr-2" />
          Create New Case
        </Button>
        <Button 
          variant="outline" 
          className="w-full justify-start hover:bg-legal-navy/5 transition-colors"
          onClick={() => handleQuickAction('upload-document')}
        >
          <Upload className="h-4 w-4 mr-2" />
          Upload Work Proof
        </Button>
        <Button 
          variant="outline" 
          className="w-full justify-start hover:bg-legal-navy/5 transition-colors"
          onClick={() => handleQuickAction('send-payment-request')}
        >
          <DollarSign className="h-4 w-4 mr-2" />
          Send Payment Request
        </Button>
        <Button 
          variant="outline" 
          className="w-full justify-start hover:bg-legal-navy/5 transition-colors"
          onClick={() => handleQuickAction('ai-research')}
        >
          <FileText className="h-4 w-4 mr-2" />
          AI Legal Research
        </Button>
        <Button 
          variant="outline" 
          className="w-full justify-start hover:bg-legal-navy/5 transition-colors"
          onClick={() => handleQuickAction('view-clients')}
        >
          <Users className="h-4 w-4 mr-2" />
          Manage Clients
        </Button>
        <Button 
          variant="outline" 
          className="w-full justify-start hover:bg-legal-navy/5 transition-colors"
          onClick={() => handleQuickAction('view-documents')}
        >
          <Briefcase className="h-4 w-4 mr-2" />
          Document Vault
        </Button>
        <Button 
          variant="outline" 
          className="w-full justify-start hover:bg-legal-navy/5 transition-colors"
          onClick={() => handleQuickAction('compose-message')}
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          Message Client
        </Button>
      </CardContent>
    </Card>
  );
};

// Enhanced Recent Activities for Lawyers
const LawyerRecentActivities = ({ activities }: { activities: any[] }) => {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'case_received': return Briefcase;
      case 'case_resolved': return CheckCircle;
      case 'payment_request_sent': return DollarSign;
      case 'payment_received': return CreditCard;
      case 'new_order': return FileText;
      case 'notification': return Bell;
      default: return Bell;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'case_received': return 'text-blue-600';
      case 'case_resolved': return 'text-green-600';
      case 'payment_request_sent': return 'text-orange-600';
      case 'payment_received': return 'text-emerald-600';
      case 'new_order': return 'text-purple-600';
      case 'notification': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Recent Activities
        </CardTitle>
        <CardDescription>Latest updates and actions in your practice</CardDescription>
      </CardHeader>
      <CardContent>
        {activities && activities.length === 0 ? (
          <div className="text-center py-8">
            <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium">No recent activity</h3>
            <p className="text-muted-foreground">Activity updates will appear here</p>
          </div>
        ) : (
          <>
            <div className="max-h-80 overflow-y-auto space-y-4">
              {(activities || []).map((activity) => {
                const Icon = getActivityIcon(activity.type);
                const colorClass = getActivityColor(activity.type);
                
                return (
                  <div 
                    key={activity._id} 
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => {
                      if (activity.caseId) {
                        window.location.href = `/case/${activity.caseId}/view`;
                      }
                    }}
                  >
                    <div className={`p-2 rounded-full bg-gray-100 ${colorClass}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm">{activity.title}</h4>
                      <p className="text-sm text-muted-foreground">{activity.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(activity.createdAt).toLocaleString()}
                      </p>
                      {activity.caseId && (
                        <p className="text-xs text-blue-600 mt-1">Click to view case details →</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

const ClientList = ({ clients }: { clients: Client[] }) => {
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('recent');

  // Filter and sort clients based on search term and sort option
  const filteredAndSortedClients = useMemo(() => {
    if (!clients) return [];
    
    let filtered = clients.filter(client =>
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client.caseTypes && client.caseTypes.some((type: string) => 
        type.toLowerCase().includes(searchTerm.toLowerCase())
      ))
    );

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'cases':
          return (b.casesCount || 0) - (a.casesCount || 0);
        case 'recent':
        default:
          return new Date(b.lastContact).getTime() - new Date(a.lastContact).getTime();
      }
    });
  }, [clients, searchTerm, sortBy]);

  const pagination = usePagination(filteredAndSortedClients, 6); // 6 clients per page

  // Simulate loading when search/sort changes
  useEffect(() => {
    if (searchTerm || sortBy !== 'recent') {
      setLoading(true);
      const timeoutId = setTimeout(() => {
        setLoading(false);
      }, 300);
      return () => clearTimeout(timeoutId);
    }
  }, [searchTerm, sortBy]);

  const formatLastContact = (date: string) => {
    const now = new Date();
    const contactDate = new Date(date);
    const diffTime = Math.abs(now.getTime() - contactDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    return contactDate.toLocaleDateString();
  };

  const handleClientDetails = (client: any) => {
    // Navigate to dedicated client details page
    window.location.href = `/lawyer/clients/${client._id}`;
  };

  const handleSendMessage = (client: any) => {
    // Open messaging system with LinkedIn-style interface
    const messageEvent = new CustomEvent('openMessaging', { 
      detail: { 
        recipientId: client._id, 
        recipientName: client.name,
        recipientType: 'client'
      } 
    });
    window.dispatchEvent(messageEvent);
  };

  const getFilteredAndSortedClients = () => {
    let filtered = clients;
    
    // Search filter
    if (searchTerm) {
      filtered = clients.filter(client => 
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Sort clients
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return new Date(b.lastContact).getTime() - new Date(a.lastContact).getTime();
        case 'name':
          return a.name.localeCompare(b.name);
        case 'cases':
          return (b.casesCount || 0) - (a.casesCount || 0);
        default:
          return 0;
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Clients ({filteredAndSortedClients.length})
        </CardTitle>
        <CardDescription>Manage your client relationships</CardDescription>
        
        {/* Search and Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-2 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search clients by name, email, or case type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Recent Activity</SelectItem>
              <SelectItem value="name">Name (A-Z)</SelectItem>
              <SelectItem value="cases">Most Cases</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <LoadingSkeleton count={6} height="h-20" />
        ) : (
          <div className="space-y-4">
            {filteredAndSortedClients && filteredAndSortedClients.length > 0 ? (
              pagination.currentItems.map((client) => (
              <div key={client._id} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <Avatar>
                  <AvatarFallback>{client.name.split(' ').map((n: string) => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">{client.name}</p>
                  <p className="text-xs text-muted-foreground">{client.email}</p>
                  <p className="text-xs text-muted-foreground">
                    {client.casesCount} total cases • {client.activeCases} active
                  </p>
                  {client.caseTypes && client.caseTypes.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {client.caseTypes.slice(0, 2).map((type: string, index: number) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {type}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end space-y-2">
                  <div className="text-xs text-muted-foreground">
                    {formatLastContact(client.lastContact)}
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleClientDetails(client)}
                      disabled={isLoadingDetails}
                    >
                      View Details
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        // Open messaging window
                        const event = new CustomEvent('openMessaging', { 
                          detail: { clientId: client._id, clientName: client.name } 
                        });
                        window.dispatchEvent(event);
                      }}
                    >
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">
                {searchTerm ? 'No clients found' : 'No clients yet'}
              </h3>
              <p className="text-muted-foreground">
                {searchTerm 
                  ? 'Try adjusting your search terms or clear the search'
                  : 'Clients will appear here as you work on cases'
                }
              </p>
              {searchTerm && (
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setSearchTerm('')}
                >
                  Clear Search
                </Button>
              )}
              </div>
            )}
            
            {pagination.totalPages > 1 && (
              <PaginationComponent
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                onPageChange={pagination.goToPage}
                totalItems={pagination.totalItems}
                itemsPerPage={pagination.itemsPerPage}
              />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};



// Enhanced Real-time Document Management & Vault Component
const DocumentManagement = () => {
  const [documents, setDocuments] = useState<any[]>([]);
  const [cases, setCases] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'pdf' | 'doc' | 'image' | 'other'>('all');
  const [filterCase, setFilterCase] = useState<'all' | string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size' | 'case'>('date');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedCase, setSelectedCase] = useState<string>('');
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [uploadDescription, setUploadDescription] = useState<string>('');

  useEffect(() => {
    fetchDocuments();
    fetchCases();
    
    // Listen for document upload trigger from quick actions
    const handleDocumentUpload = () => {
      setUploadDialogOpen(true);
    };
    
    window.addEventListener('triggerDocumentUpload', handleDocumentUpload);
    
    return () => {
      window.removeEventListener('triggerDocumentUpload', handleDocumentUpload);
    };
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/documents/lawyer`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents || []);
      } else {
        // Mock data for development
        setDocuments([
          {
            _id: '1',
            originalName: 'Case_Evidence_001.pdf',
            filename: 'case-evidence-001.pdf',
            mimeType: 'application/pdf',
            fileSize: 2480000,
            uploadedAt: '2024-10-01T10:30:00Z',
            uploadedBy: 'lawyer',
            caseId: 'case-1',
            caseTitle: 'Personal Injury Claim',
            caseStatus: 'active',
            category: 'evidence',
            description: 'Medical records and accident report'
          },
          {
            _id: '2',
            originalName: 'Contract_Draft_v2.docx',
            filename: 'contract-draft-v2.docx',
            mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            fileSize: 890000,
            uploadedAt: '2024-09-28T14:20:00Z',
            uploadedBy: 'lawyer',
            caseId: 'case-2',
            caseTitle: 'Contract Dispute Resolution',
            caseStatus: 'in_progress',
            category: 'legal_document',
            description: 'Updated contract terms for settlement'
          },
          {
            _id: '3',
            originalName: 'Client_Statement.pdf',
            filename: 'client-statement.pdf',
            mimeType: 'application/pdf',
            fileSize: 1250000,
            uploadedAt: '2024-09-25T09:15:00Z',
            uploadedBy: 'client',
            caseId: 'case-1',
            caseTitle: 'Personal Injury Claim',
            caseStatus: 'active',
            category: 'statement',
            description: 'Written statement from client regarding the incident'
          }
        ]);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCases = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/cases/lawyer`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCases(data.cases || []);
      } else {
        // Mock cases for development
        setCases([
          { _id: 'case-1', title: 'Personal Injury Claim', status: 'active' },
          { _id: 'case-2', title: 'Contract Dispute Resolution', status: 'in_progress' },
          { _id: 'case-3', title: 'Employment Law Case', status: 'pending' }
        ]);
      }
    } catch (error) {
      console.error('Error fetching cases:', error);
      setCases([]);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('pdf')) return <FileText className="h-5 w-5 text-red-500" />;
    if (mimeType.includes('word') || mimeType.includes('document')) return <FileText className="h-5 w-5 text-blue-500" />;
    if (mimeType.includes('image')) return <FileText className="h-5 w-5 text-green-500" />;
    return <FileText className="h-5 w-5 text-gray-500" />;
  };

  const getFileCategory = (mimeType: string) => {
    if (mimeType.includes('pdf')) return 'pdf';
    if (mimeType.includes('word') || mimeType.includes('document')) return 'doc';
    if (mimeType.includes('image')) return 'image';
    return 'other';
  };

  const handleDownload = async (documentId: string, filename: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/documents/download/${documentId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Download failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
    }
  };

  const handleUpload = async (files: FileList | null, description: string = '', category: string = 'general') => {
    if (!files || files.length === 0 || !selectedCase) return;
    
    setIsUploading(true);
    
    try {
      const formData = new FormData();
      
      Array.from(files).forEach((file, index) => {
        formData.append(`files`, file);
      });
      
      formData.append('caseId', selectedCase);
      formData.append('description', description);
      formData.append('category', category);

      const response = await fetch(`${import.meta.env.VITE_API_URL}/documents/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        
        // Add new documents to the list
        setDocuments(prev => [...data.documents, ...prev]);
        
        // Show success notification
        import('@/services/notificationService').then(({ notificationService }) => {
          notificationService.createDocumentNotification(
            { name: files[0].name },
            cases.find(c => c._id === selectedCase)
          );
        });
        
        setUploadDialogOpen(false);
        setSelectedCase('');
        setSelectedFiles(null);
        setUploadDescription('');
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Error uploading documents:', error);
      
      // Show error notification
      import('@/services/notificationService').then(({ notificationService }) => {
        notificationService.addNotification({
          title: 'Upload Failed',
          message: 'Failed to upload documents. Please try again.',
          type: 'error',
          read: false,
          priority: 'medium',
          category: 'system'
        });
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Simulate real-time document updates
  useEffect(() => {
    const interval = setInterval(() => {
      // Check for new documents every 30 seconds
      fetchDocuments();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Filter and sort documents
  const getFilteredDocuments = () => {
    let filtered = documents;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(doc => 
        doc.originalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.caseTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply case filter
    if (filterCase !== 'all') {
      filtered = filtered.filter(doc => doc.caseId === filterCase);
    }

    // Apply type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(doc => getFileCategory(doc.mimeType) === filterType);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.originalName.localeCompare(b.originalName);
        case 'size':
          return b.fileSize - a.fileSize;
        case 'case':
          return a.caseTitle.localeCompare(b.caseTitle);
        case 'date':
        default:
          return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
      }
    });

    return filtered;
  };

  const getDocumentStats = () => {
    const totalSize = documents.reduce((sum, doc) => sum + doc.fileSize, 0);
    const typeCount = {
      pdf: documents.filter(doc => getFileCategory(doc.mimeType) === 'pdf').length,
      doc: documents.filter(doc => getFileCategory(doc.mimeType) === 'doc').length,
      image: documents.filter(doc => getFileCategory(doc.mimeType) === 'image').length,
      other: documents.filter(doc => getFileCategory(doc.mimeType) === 'other').length,
    };

    const caseCount = new Set(documents.map(doc => doc.caseId)).size;
    const recentUploads = documents.filter(doc => {
      const uploadDate = new Date(doc.uploadedAt);
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return uploadDate > weekAgo;
    }).length;
    
    return { 
      totalCount: documents.length, 
      totalSize, 
      typeCount, 
      caseCount,
      recentUploads
    };
  };

  const stats = getDocumentStats();
  const filteredDocs = getFilteredDocuments();
  const documentPagination = usePagination(filteredDocs, 8); // 8 documents per page

  // Simulate loading when search/filter changes
  useEffect(() => {
    if (searchTerm || filterType !== 'all' || sortBy !== 'date') {
      setLoading(true);
      const timeoutId = setTimeout(() => {
        setLoading(false);
      }, 300);
      return () => clearTimeout(timeoutId);
    }
  }, [searchTerm, filterType, sortBy]);

  return (
    <div className="space-y-6">
      {/* Document Vault Header & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Total Documents</p>
                <p className="text-2xl font-bold text-blue-900">{stats.totalCount}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Storage Used</p>
                <p className="text-2xl font-bold text-green-900">{formatFileSize(stats.totalSize)}</p>
              </div>
              <Upload className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700">PDF Documents</p>
                <p className="text-2xl font-bold text-purple-900">{stats.typeCount.pdf}</p>
              </div>
              <FileText className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-700">Word Docs</p>
                <p className="text-2xl font-bold text-orange-900">{stats.typeCount.doc}</p>
              </div>
              <FileText className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Document Management */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-6 w-6 text-blue-600" />
                Document Vault
              </CardTitle>
              <CardDescription>Secure document storage and management</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => fetchDocuments()}
                disabled={loading}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Documents
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Upload Documents</DialogTitle>
                    <DialogDescription>
                      Select files and associate them with a case
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Select Case</label>
                      <Select value={selectedCase} onValueChange={setSelectedCase}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a case..." />
                        </SelectTrigger>
                        <SelectContent>
                          {cases.map(caseItem => (
                            <SelectItem key={caseItem._id} value={caseItem._id}>
                              {caseItem.title || `Case #${caseItem.caseNumber}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium mb-2 block">Documents</label>
                      <Input
                        type="file"
                        multiple
                        onChange={(e) => setSelectedFiles(e.target.files)}
                        disabled={isUploading}
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium mb-2 block">Description (Optional)</label>
                      <Input
                        placeholder="Brief description of the documents..."
                        value={uploadDescription}
                        onChange={(e) => setUploadDescription(e.target.value)}
                      />
                    </div>

                    {isUploading && (
                      <div className="flex items-center gap-2 text-sm text-blue-600">
                        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                        Uploading documents...
                      </div>
                    )}
                    
                    <div className="flex gap-2 pt-2">
                      <Button 
                        onClick={() => handleUpload(selectedFiles, uploadDescription)}
                        disabled={isUploading || !selectedCase || !selectedFiles}
                        className="flex-1"
                      >
                        {isUploading ? 'Uploading...' : 'Upload'}
                      </Button>
                      <Button variant="outline" onClick={() => {
                        setUploadDialogOpen(false);
                        setSelectedCase('');
                        setSelectedFiles(null);
                        setUploadDescription('');
                      }}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              <Button variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                Templates
              </Button>
            </div>
          </div>

          {/* Search and Filter Controls */}
          <div className="flex flex-col lg:flex-row gap-4 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search documents by name or case..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <div className="flex gap-2">
              <Select value={filterCase} onValueChange={setFilterCase}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Filter by case" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cases</SelectItem>
                  {cases.map(caseItem => (
                    <SelectItem key={caseItem._id} value={caseItem._id}>
                      {caseItem.title || `Case #${caseItem.caseNumber}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="File type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="doc">Documents</SelectItem>
                  <SelectItem value="image">Images</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="size">Size</SelectItem>
                  <SelectItem value="case">Case</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Document Grid */}
          <div className="space-y-4">
            {loading ? (
              <LoadingSkeleton count={8} height="h-16" />
            ) : filteredDocs.length > 0 ? (
              <>
                <div className="grid gap-3">
                  {documentPagination.currentItems.map((doc) => (
                  <Card key={doc._id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="flex-shrink-0">
                            {getFileIcon(doc.mimeType)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{doc.originalName}</p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                              <span>{formatFileSize(doc.fileSize)}</span>
                              <span>{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                              <span className="flex items-center gap-1">
                                <Briefcase className="h-3 w-3" />
                                {doc.caseTitle}
                              </span>
                            </div>
                            {doc.caseStatus && (
                              <Badge variant="outline" className="mt-2 text-xs">
                                {doc.caseStatus}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownload(doc._id, doc.originalName)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  ))}
                </div>
                
                {documentPagination.totalPages > 1 && (
                  <PaginationComponent
                    currentPage={documentPagination.currentPage}
                    totalPages={documentPagination.totalPages}
                    onPageChange={documentPagination.goToPage}
                    totalItems={documentPagination.totalItems}
                    itemsPerPage={documentPagination.itemsPerPage}
                  />
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">
                  {searchTerm ? 'No documents found' : 'No documents yet'}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm 
                    ? 'Try adjusting your search terms or filters'
                    : 'Upload documents to start building your document vault'
                  }
                </p>
                {searchTerm ? (
                  <Button variant="outline" onClick={() => setSearchTerm('')}>
                    Clear Search
                  </Button>
                ) : (
                  <Button onClick={() => setUploadDialogOpen(true)}>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload First Document
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Enhanced Real-time Notifications System Component
const Notifications = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'case' | 'payment' | 'message' | 'document'>('all');
  const [toastNotifications, setToastNotifications] = useState<any[]>([]);
  const [showAllNotifications, setShowAllNotifications] = useState(false);

  useEffect(() => {
    // Import and use the notification service
    import('@/services/notificationService').then(({ notificationService }) => {
      // Load existing notifications
      const existingNotifications = notificationService.getNotifications();
      setNotifications(existingNotifications);
      setIsLoading(false);

      // Listen for new notifications
      const handleNewNotification = (notification: any) => {
        setNotifications(prev => [notification, ...prev]);
      };

      const handleNotificationRead = (notification: any) => {
        setNotifications(prev => 
          prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
        );
      };

      const handleAllNotificationsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      };

      notificationService.on('notificationAdded', handleNewNotification);
      notificationService.on('notificationRead', handleNotificationRead);
      notificationService.on('allNotificationsRead', handleAllNotificationsRead);

      return () => {
        notificationService.off('notificationAdded', handleNewNotification);
        notificationService.off('notificationRead', handleNotificationRead);
        notificationService.off('allNotificationsRead', handleAllNotificationsRead);
      };
    });
  }, []);

  const markAsRead = (notificationId: string) => {
    import('@/services/notificationService').then(({ notificationService }) => {
      notificationService.markAsRead(notificationId);
    });
  };

  const markAllAsRead = () => {
    import('@/services/notificationService').then(({ notificationService }) => {
      notificationService.markAllAsRead();
    });
  };

  const deleteNotification = (notificationId: string) => {
    import('@/services/notificationService').then(({ notificationService }) => {
      notificationService.deleteNotification(notificationId);
    });
  };

  const removeToastNotification = (toastId: string) => {
    setToastNotifications(prev => prev.filter(toast => toast.toastId !== toastId));
  };

  const getNotificationIcon = (category: string) => {
    switch (category) {
      case 'case': return Briefcase;
      case 'payment': return DollarSign;
      case 'message': return MessageSquare;
      case 'document': return FileText;
      case 'system': return Settings;
      default: return Bell;
    }
  };

  const getNotificationColor = (type: string, priority: string = 'medium') => {
    if (priority === 'high') return 'red';
    
    switch (type) {
      case 'success': return 'green';
      case 'warning': return 'yellow';
      case 'error': return 'red';
      default: return 'blue';
    }
  };

  const getFilteredNotifications = () => {
    let filtered = notifications;
    
    switch (filter) {
      case 'unread':
        filtered = notifications.filter(n => !n.read);
        break;
      case 'case':
        filtered = notifications.filter(n => n.category === 'case');
        break;
      case 'payment':
        filtered = notifications.filter(n => n.category === 'payment');
        break;
      case 'message':
        filtered = notifications.filter(n => n.category === 'message');
        break;
      case 'document':
        filtered = notifications.filter(n => n.category === 'document');
        break;
    }
    
    return filtered;
  };

  const getNotificationStats = () => {
    const unreadCount = notifications.filter(n => !n.read).length;
    const todayCount = notifications.filter(n => {
      const notifDate = new Date(n.timestamp);
      const today = new Date();
      return notifDate.toDateString() === today.toDateString();
    }).length;
    
    return { unreadCount, todayCount, totalCount: notifications.length };
  };

  const stats = getNotificationStats();
  const filteredNotifications = getFilteredNotifications();

  return (
    <>
      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md">
        {toastNotifications.map((toast) => {
          const Icon = getNotificationIcon(toast.type);
          const color = getNotificationColor(toast.type, toast.priority);
          
          return (
            <Card key={toast.toastId} className={`bg-white shadow-lg border-l-4 border-l-${color}-500 animate-in slide-in-from-right`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-full bg-${color}-100`}>
                    <Icon className={`h-4 w-4 text-${color}-600`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm">{toast.title}</h4>
                    <p className="text-sm text-gray-600">{toast.message}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => removeToastNotification(toast.toastId)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Notifications Panel */}
      <div className="space-y-6">
        {/* Notification Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700">Unread</p>
                  <p className="text-2xl font-bold text-blue-900">{stats.unreadCount}</p>
                </div>
                <Bell className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700">Today</p>
                  <p className="text-2xl font-bold text-green-900">{stats.todayCount}</p>
                </div>
                <Calendar className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-700">Total</p>
                  <p className="text-2xl font-bold text-purple-900">{stats.totalCount}</p>
                </div>
                <MessageSquare className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Notification Center */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notification Center
                </CardTitle>
                <CardDescription>Stay updated with real-time alerts and updates</CardDescription>
              </div>
              <div className="flex gap-2">
                {stats.unreadCount > 0 && (
                  <Button size="sm" variant="outline" onClick={markAllAsRead}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Mark All Read
                  </Button>
                )}
                <Button size="sm" variant="outline">
                  <Settings className="h-4 w-4 mr-2" />
                  Preferences
                </Button>
              </div>
            </div>

            {/* Filter Tabs */}
            <Tabs value={filter} onValueChange={(value: any) => setFilter(value)} className="mt-4">
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="all">All ({notifications.length})</TabsTrigger>
                <TabsTrigger value="unread">Unread ({stats.unreadCount})</TabsTrigger>
                <TabsTrigger value="case">Cases</TabsTrigger>
                <TabsTrigger value="payment">Payments</TabsTrigger>
                <TabsTrigger value="message">Messages</TabsTrigger>
                <TabsTrigger value="document">Documents</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>

          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg border">
                    <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">
                  {filter === 'all' ? 'No notifications' : `No ${filter} notifications`}
                </h3>
                <p className="text-muted-foreground">
                  {filter === 'all' 
                    ? "You'll receive updates here as they come in"
                    : `No ${filter} notifications to show`
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredNotifications.slice(0, 10).map((notification: any) => {
                  const Icon = getNotificationIcon(notification.category);
                  const color = getNotificationColor(notification.type, notification.priority);
                  
                  return (
                    <Card 
                      key={notification.id} 
                      className={`transition-all hover:shadow-md cursor-pointer group ${
                        !notification.read 
                          ? `bg-${color}-50 border-l-4 border-l-${color}-500` 
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => {
                        if (!notification.read) {
                          markAsRead(notification.id);
                        }
                        if (notification.actionUrl) {
                          window.location.href = notification.actionUrl;
                        }
                      }}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-full bg-${color}-100 flex-shrink-0`}>
                            <Icon className={`h-4 w-4 text-${color}-600`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <h4 className={`font-semibold text-sm ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
                                {notification.title}
                              </h4>
                              <div className="flex items-center gap-2">
                                {notification.priority === 'high' && (
                                  <Badge variant="destructive" className="text-xs">High Priority</Badge>
                                )}
                                {!notification.read && (
                                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteNotification(notification.id);
                                  }}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                            <div className="flex items-center justify-between mt-2">
                              <p className="text-xs text-gray-500">
                                {new Date(notification.timestamp).toLocaleString()}
                              </p>
                              {notification.actionUrl && notification.actionLabel && (
                                <Button 
                                  variant="link" 
                                  size="sm" 
                                  className="h-auto p-0 text-xs"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    window.location.href = notification.actionUrl;
                                  }}
                                >
                                  {notification.actionLabel}
                                </Button>
                              )}
                            </div>
                            <Badge variant="outline" className="mt-2 text-xs">
                              {notification.category}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}

                {filteredNotifications.length > 5 && (
                  <div className="pt-4 border-t">
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => setShowAllNotifications(!showAllNotifications)}
                    >
                      <Bell className="h-4 w-4 mr-2" />
                      {showAllNotifications 
                        ? 'Show Less' 
                        : `View All ${filter !== 'all' ? filter + ' ' : ''}Notifications (${filteredNotifications.length})`
                      }
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
};

const LawyerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [loadedTabs, setLoadedTabs] = useState(new Set(['overview']));
  
  // Only load data for overview initially and other tabs when visited
  const shouldLoadData = (tabName: string) => loadedTabs.has(tabName);
  
  const { stats, cases, recentActivity, clients, documents, isLoading, error } = useLawyerDashboard();
  
  // Set up real-time updates
  useRealTimeUpdates(user?.id || '', 'lawyer');

  // Handle tab change and lazy loading
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (!loadedTabs.has(tab)) {
      setLoadedTabs(prev => new Set(prev).add(tab));
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gradient-to-br from-legal-navy/5 to-legal-gold/5 pt-24 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-300 rounded w-1/4 mb-4"></div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-32 bg-gray-300 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  // Error state
  if (error) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gradient-to-br from-legal-navy/5 to-legal-gold/5 pt-24 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-legal-navy mb-2">Error Loading Dashboard</h2>
              <p className="text-slate-600">Unable to load dashboard data. Please try again.</p>
              <Button 
                onClick={() => window.location.reload()} 
                className="mt-4 bg-legal-gold hover:bg-legal-gold/90 text-legal-navy"
              >
                Retry
              </Button>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  // Default values if data not loaded yet
  const defaultStats: DashboardStats = {
    activeCases: 0,
    todayHearings: 0,
    pendingTasks: 0,
    monthlyRevenue: 0,
    totalCases: 0,
    resolvedCases: 0,
    totalClients: 0,
    completedOrders: 0,
    successRate: 0
  };

  const displayStats = stats || defaultStats;
  const displayCases = cases || [];

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-legal-navy/5 to-legal-gold/5 pt-24 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-legal-navy mb-2">Lawyer Dashboard</h1>
              <p className="text-slate-600">Welcome back! Here's your practice overview for today.</p>
            </div>
            <MessagingTrigger />
          </div>

          {/* Dashboard Tabs */}
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-9 mb-8">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="cases" className="flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Cases
              </TabsTrigger>
              <TabsTrigger value="clients" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Clients
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Notifications
              </TabsTrigger>
              <TabsTrigger value="research" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                AI Research
              </TabsTrigger>
              <TabsTrigger value="documents" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Documents
              </TabsTrigger>
              <TabsTrigger value="payments" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Payments
              </TabsTrigger>
              <TabsTrigger value="services" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Services
              </TabsTrigger>
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Profile
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview">
              {/* Stats Cards */}
              <LawyerHeaderCards stats={displayStats} />
              
              {/* Quick Actions & Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Quick Actions */}
                <LawyerQuickActions onTabChange={handleTabChange} />
                
                {/* Recent Activities */}
                <div className="lg:col-span-2">
                  <LawyerRecentActivities activities={recentActivity || []} />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="cases">
              <div className="space-y-6">
                <Suspense fallback={<LoadingSkeleton count={6} height="h-20" />}>
                  <EnhancedCaseManagement cases={displayCases} />
                </Suspense>
              </div>
            </TabsContent>
            
            <TabsContent value="clients">
              <div className="space-y-6">
                <Suspense fallback={<LoadingSkeleton count={6} height="h-20" />}>
                  {shouldLoadData('clients') ? (
                    <ClientList clients={clients || []} />
                  ) : (
                    <div className="text-center py-8">
                      <div className="animate-pulse">Loading clients...</div>
                    </div>
                  )}
                </Suspense>
              </div>
            </TabsContent>
            
            <TabsContent value="notifications">
              <div className="space-y-6">
                <Suspense fallback={<LoadingSkeleton count={4} height="h-16" />}>
                  <Notifications />
                </Suspense>
              </div>
            </TabsContent>
            
            <TabsContent value="analytics">
              <div className="space-y-6">
                <Analytics />
              </div>
            </TabsContent>
            
            <TabsContent value="research">
              <div className="space-y-6">
                <Suspense fallback={<LoadingSkeleton count={4} height="h-24" />}>
                  <LegalResearch />
                </Suspense>
              </div>
            </TabsContent>
            
            <TabsContent value="documents">
              <div className="space-y-6">
                <Suspense fallback={<LoadingSkeleton count={8} height="h-16" />}>
                  {shouldLoadData('documents') ? (
                    <DocumentManagement />
                  ) : (
                    <div className="text-center py-8">
                      <div className="animate-pulse">Loading documents...</div>
                    </div>
                  )}
                </Suspense>
              </div>
            </TabsContent>
            
            <TabsContent value="payments">
              <div className="space-y-6">
                <Suspense fallback={<LoadingSkeleton count={6} height="h-20" />}>
                  <LawyerOnboarding user={user} />
                  
                  <Tabs defaultValue="requests" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="requests">Payment Requests</TabsTrigger>
                      <TabsTrigger value="create">Create Request</TabsTrigger>
                      <TabsTrigger value="orders">Orders & Escrow</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="requests" className="space-y-4">
                      <PaymentRequests userRole="lawyer" />
                    </TabsContent>
                    
                    <TabsContent value="create" className="space-y-4">
                      <CreatePaymentRequest />
                    </TabsContent>
                    
                    <TabsContent value="orders" className="space-y-4">
                      <OrderManagement userRole="lawyer" userId={user?.id || ''} />
                    </TabsContent>
                  </Tabs>
                </Suspense>
              </div>
            </TabsContent>
            
            <TabsContent value="services">
              <Suspense fallback={<LoadingSkeleton count={5} height="h-24" />}>
                <LawyerServiceManagement />
              </Suspense>
            </TabsContent>
            
            <TabsContent value="profile">
              <Suspense fallback={<LoadingSkeleton count={4} height="h-20" />}>
                <LawyerProfileManagement />
              </Suspense>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <Footer />
      <NotificationSystem />
    </>
  );
};

export default LawyerDashboard;