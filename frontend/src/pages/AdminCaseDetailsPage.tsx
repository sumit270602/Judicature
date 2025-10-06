import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  ArrowLeft,
  FileText, 
  User,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Briefcase,
  Phone,
  Mail,
  MapPin,
  Star,
  DollarSign,
  MessageSquare,
  Paperclip,
  Eye,
  Download,
  RefreshCw
} from 'lucide-react';
import { api } from '@/api';
import { toast } from 'sonner';

interface CaseDetails {
  _id: string;
  title: string;
  description: string;
  caseNumber: string;
  status: string;
  priority: string;
  caseType: string;
  client: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    address?: string;
    role: string;
  };
  lawyer?: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    role: string;
    practiceAreas?: string[];
    experience?: number;
  };
  notes?: Array<{
    _id: string;
    content: string;
    addedBy: {
      name: string;
      role: string;
    };
    createdAt: string;
  }>;
  documents?: Array<{
    _id: string;
    fileName: string;
    originalName: string;
    fileSize: number;
    uploadedBy: string;
    createdAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

const AdminCaseDetailsPage: React.FC = () => {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();
  const [caseDetails, setCaseDetails] = useState<CaseDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (caseId) {
      fetchCaseDetails();
    }
  }, [caseId]);

  const fetchCaseDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/admin/cases/${caseId}`);
      setCaseDetails(response.data);
    } catch (error) {
      console.error('Error fetching case details:', error);
      toast.error('Failed to load case details');
      navigate('/admin', { state: { activeTab: 'cases' } });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'open': { class: 'bg-blue-100 text-blue-800', icon: Clock },
      'in_progress': { class: 'bg-yellow-100 text-yellow-800', icon: Clock },
      'pending_review': { class: 'bg-orange-100 text-orange-800', icon: AlertCircle },
      'completed': { class: 'bg-green-100 text-green-800', icon: CheckCircle },
      'closed': { class: 'bg-gray-100 text-gray-800', icon: XCircle },
      'cancelled': { class: 'bg-red-100 text-red-800', icon: XCircle }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.open;
    const IconComponent = config.icon;
    
    return (
      <Badge className={config.class}>
        <IconComponent className="h-4 w-4 mr-1" />
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const colors = {
      'low': 'bg-green-100 text-green-800',
      'medium': 'bg-blue-100 text-blue-800',
      'high': 'bg-orange-100 text-orange-800',
      'urgent': 'bg-red-100 text-red-800'
    };
    return (
      <Badge className={colors[priority as keyof typeof colors] || colors.medium}>
        {priority.toUpperCase()}
      </Badge>
    );
  };

  const getCaseTypeIcon = (caseType: string) => {
    const icons = {
      'civil': Briefcase,
      'criminal': AlertCircle,
      'family': User,
      'corporate': Briefcase,
      'property': FileText,
      'other': FileText
    };
    const IconComponent = icons[caseType as keyof typeof icons] || FileText;
    return <IconComponent className="h-5 w-5" />;
  };

  const handleDownloadDocument = async (documentId: string, filename: string) => {
    try {
      const response = await api.get(`/documents/${documentId}/download`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('Document downloaded successfully');
    } catch (error) {
      console.error('Error downloading document:', error);
      toast.error('Failed to download document');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-6 w-6 animate-spin text-gray-500" />
          <span className="text-gray-500">Loading case details...</span>
        </div>
      </div>
    );
  }

  if (!caseDetails) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">Case Not Found</h3>
        <p className="text-gray-600 mb-4">The requested case could not be found.</p>
        <Button onClick={() => navigate('/admin', { state: { activeTab: 'cases' } })}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Cases
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/admin', { state: { activeTab: 'cases' } })}
            className="p-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{caseDetails.title}</h1>
            <p className="text-gray-600">Case #{caseDetails.caseNumber}</p>
          </div>
        </div>
        <Button onClick={fetchCaseDetails} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Case Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Case Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                {getCaseTypeIcon(caseDetails.caseType)}
                <span className="ml-2">Case Overview</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Status</label>
                  <div className="mt-1">
                    {getStatusBadge(caseDetails.status)}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Priority</label>
                  <div className="mt-1">
                    {getPriorityBadge(caseDetails.priority)}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Case Type</label>
                  <div className="mt-1 capitalize font-medium">
                    {caseDetails.caseType}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Created Date</label>
                  <div className="mt-1 font-medium">
                    {new Date(caseDetails.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <label className="text-sm font-medium text-gray-600">Description</label>
                <p className="mt-2 text-gray-900 leading-relaxed">
                  {caseDetails.description}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Case Notes */}
          {caseDetails.notes && caseDetails.notes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageSquare className="h-5 w-5 mr-2" />
                  Case Notes ({caseDetails.notes.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {caseDetails.notes.map((note) => (
                    <div key={note._id} className="border-l-4 border-blue-200 pl-4 py-2">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">
                          {note.addedBy.name} ({note.addedBy.role})
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(note.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-gray-700">{note.content}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Documents */}
          {caseDetails.documents && caseDetails.documents.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Paperclip className="h-5 w-5 mr-2" />
                  Documents ({caseDetails.documents.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {caseDetails.documents.map((doc) => (
                    <div key={doc._id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <FileText className="h-8 w-8 text-blue-500" />
                        <div>
                          <p className="font-medium">{doc.originalName}</p>
                          <p className="text-sm text-gray-500">
                            {(doc.fileSize / 1024).toFixed(1)} KB • 
                            {new Date(doc.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadDocument(doc._id, doc.originalName)}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Client Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Client Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-blue-100 text-blue-600">
                    {caseDetails.client.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-medium">{caseDetails.client.name}</h3>
                  <p className="text-sm text-gray-500 capitalize">{caseDetails.client.role}</p>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">{caseDetails.client.email}</span>
                </div>
                {caseDetails.client.phone && (
                  <div className="flex items-center space-x-3">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">{caseDetails.client.phone}</span>
                  </div>
                )}
                {caseDetails.client.address && (
                  <div className="flex items-center space-x-3">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">{caseDetails.client.address}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Lawyer Information */}
          {caseDetails.lawyer ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Briefcase className="h-5 w-5 mr-2" />
                  Assigned Lawyer
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-green-100 text-green-600">
                      {caseDetails.lawyer.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium">{caseDetails.lawyer.name}</h3>
                    <p className="text-sm text-gray-500 capitalize">{caseDetails.lawyer.role}</p>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">{caseDetails.lawyer.email}</span>
                  </div>
                  {caseDetails.lawyer.phone && (
                    <div className="flex items-center space-x-3">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{caseDetails.lawyer.phone}</span>
                    </div>
                  )}
                  {caseDetails.lawyer.experience && (
                    <div className="flex items-center space-x-3">
                      <Star className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{caseDetails.lawyer.experience} years experience</span>
                    </div>
                  )}
                </div>
                
                {caseDetails.lawyer.practiceAreas && caseDetails.lawyer.practiceAreas.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-2">Practice Areas</p>
                      <div className="flex flex-wrap gap-1">
                        {caseDetails.lawyer.practiceAreas.map((area, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {area}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Briefcase className="h-5 w-5 mr-2" />
                  Lawyer Assignment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-6">
                  <User className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No lawyer assigned to this case yet.</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Case Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium">Case Created</p>
                  <p className="text-xs text-gray-500">
                    {new Date(caseDetails.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
              {caseDetails.updatedAt !== caseDetails.createdAt && (
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium">Last Updated</p>
                    <p className="text-xs text-gray-500">
                      {new Date(caseDetails.updatedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminCaseDetailsPage;