import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  FileText, 
  User, 
  Phone, 
  Mail, 
  Briefcase, 
  Download, 
  Upload, 
  CheckCircle,
  DollarSign,
  AlertCircle,
  Eye,
  FileCheck,
  Banknote,
  Shield,
  MessageSquare
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getCaseById, getCaseDocuments, downloadDocument, uploadWorkProof, resolveCase } from '@/api';
import { useAuth } from '@/hooks/use-auth';
import { useMessaging } from '@/hooks/use-messaging';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import LinkedInMessaging from '@/components/LinkedInMessaging';

// Types
interface CaseDocument {
  id: string;
  name: string;
  uploadedBy: string;
  uploadedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  type: 'client_document' | 'work_proof';
}

interface CaseService {
  _id: string;
  serviceType: string;
  description: string;
  amount: number;
  currency: string;
  status: 'pending' | 'in_progress' | 'completed';
}

interface CaseData {
  _id: string;
  caseNumber: string;
  title: string;
  description: string;
  caseType: string;
  priority: string;
  status: string;
  progress: number;
  client: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
  };
  lawyer?: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
  };
  createdAt: string;
  updatedAt: string;
  nextHearing?: string;
  documents: string[];
  agreedPricing?: {
    amount: number;
    currency: string;
    type: string;
  };
  selectedService?: CaseService;
  workProof?: {
    uploadedAt: string;
    documentId: string;
    description: string;
  };
}

const CaseDetailsView: React.FC = () => {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { loadConversation } = useMessaging();
  
  const [caseData, setCaseData] = useState<CaseData | null>(null);
  const [documents, setDocuments] = useState<CaseDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [showProofDialog, setShowProofDialog] = useState(false);
  const [showResolveDialog, setShowResolveDialog] = useState(false);
  const [proofDescription, setProofDescription] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [showMessaging, setShowMessaging] = useState(false);

  useEffect(() => {
    if (caseId) {
      fetchCaseData();
      fetchDocuments();
    }
  }, [caseId]);

  const fetchCaseData = async () => {
    try {
      const response = await getCaseById(caseId!);
      setCaseData(response.data.case);
    } catch (error: any) {
      console.error('Error fetching case:', error);
      toast({
        title: "Error",
        description: "Failed to load case details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchDocuments = async () => {
    try {
      const response = await getCaseDocuments(caseId!);
      setDocuments(response.data.documents || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

  const handleDownloadDocument = async (documentId: string, filename: string) => {
    try {
      const response = await downloadDocument(documentId);
      
      // Create blob URL and trigger download
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Success",
        description: "Document downloaded successfully",
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Error",
        description: "Failed to download document",
        variant: "destructive",
      });
    }
  };

  const handleUploadProof = async () => {
    if (!proofFile || !proofDescription.trim()) {
      toast({
        title: "Error", 
        description: "Please select a file and add a description",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploadingProof(true);
      
      const formData = new FormData();
      formData.append('workProof', proofFile);
      formData.append('description', proofDescription);

      await uploadWorkProof(caseId!, formData);

      toast({
        title: "Success",
        description: "Work proof uploaded successfully",
      });

      setShowProofDialog(false);
      setProofFile(null);
      setProofDescription('');
      fetchDocuments();
      fetchCaseData();

    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to upload proof",
        variant: "destructive",
      });
    } finally {
      setUploadingProof(false);
    }
  };

  const handleResolveCase = async () => {
    if (!caseData?.workProof) {
      toast({
        title: "Error",
        description: "Please upload work proof before resolving the case",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await resolveCase(caseId!, { 
        workProofDescription: 'Work completed and proof submitted',
        resolvedAt: new Date().toISOString()
      });
      
      if (response.data.success) {
        setCaseData(response.data.case);
        toast({
          title: "Case Resolved",
          description: response.data.message || "Payment request has been automatically generated for the client",
        });
        setShowResolveDialog(false);
      }
    } catch (error: any) {
      console.error('Resolve error:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to resolve case",
        variant: "destructive",
      });
    }
  };

  // Handle messaging to client
  const handleMessageClient = async () => {
    if (!caseData?.client?._id) {
      toast({
        title: "Error",
        description: "No client assigned to this case",
        variant: "destructive",
      });
      return;
    }

    try {
      // Load existing conversation with the client (this will create one if it doesn't exist)
      await loadConversation(caseData.client._id);
      
      toast({
        title: "Success",
        description: "Opening conversation with client",
      });
    } catch (error) {
      console.error('Error loading conversation:', error);
      toast({
        title: "Error",
        description: "Failed to open conversation",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-orange-100 text-orange-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gradient-to-br from-legal-navy/5 to-legal-gold/5 pt-24 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-legal-navy mx-auto mb-4"></div>
            <p className="text-legal-navy">Loading case details...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (!caseData) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gradient-to-br from-legal-navy/5 to-legal-gold/5 pt-24 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-legal-navy mb-4">Case Not Found</h2>
            <p className="text-muted-foreground mb-6">The case you're looking for doesn't exist or you don't have access to it.</p>
            <Button onClick={() => navigate('/dashboard/lawyer')} className="bg-legal-navy hover:bg-legal-navy/90">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-legal-navy/5 to-legal-gold/5 pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Section */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <Button 
                variant="outline" 
                onClick={() => navigate('/dashboard/lawyer')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
              
              <div className="flex items-center gap-3">
                <Badge variant={getPriorityColor(caseData.priority)} className="capitalize">
                  {caseData.priority} Priority
                </Badge>
                <Badge className={`capitalize ${getStatusColor(caseData.status)}`}>
                  {caseData.status}
                </Badge>
              </div>
            </div>
            
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-legal-navy">{caseData.title}</h1>
                  <Badge variant="outline" className="font-mono text-sm">
                    {caseData.caseNumber}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Created {new Date(caseData.createdAt).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    Updated {new Date(caseData.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Case Information */}
            <div className="lg:col-span-2 space-y-6">
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="services">Services</TabsTrigger>
                  <TabsTrigger value="documents">Documents</TabsTrigger>
                  <TabsTrigger value="timeline">Timeline</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                  {/* Case Overview */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Briefcase className="h-5 w-5" />
                        Case Overview
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="font-medium text-sm text-muted-foreground mb-2">Description</h4>
                        <p className="text-sm leading-relaxed">{caseData.description}</p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <h4 className="font-medium text-sm text-muted-foreground mb-1">Case Type</h4>
                          <p className="text-sm font-medium capitalize">{caseData.caseType}</p>
                        </div>
                        <div>
                          <h4 className="font-medium text-sm text-muted-foreground mb-1">Progress</h4>
                          <div className="flex items-center gap-2">
                            <Progress value={caseData.progress || 0} className="flex-1" />
                            <span className="text-sm font-medium">{caseData.progress || 0}%</span>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium text-sm text-muted-foreground mb-1">Next Hearing</h4>
                          <p className="text-sm font-medium">
                            {caseData.nextHearing ? new Date(caseData.nextHearing).toLocaleDateString() : 'TBD'}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Client Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Client Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-legal-navy/10 rounded-full flex items-center justify-center">
                          <User className="h-6 w-6 text-legal-navy" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold">{caseData.client.name}</h3>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Mail className="h-4 w-4" />
                              {caseData.client.email}
                            </span>
                            {caseData.client.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="h-4 w-4" />
                                {caseData.client.phone}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="services" className="space-y-6">
                  {/* Service Details */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Briefcase className="h-5 w-5" />
                        Service Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {caseData.selectedService ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-medium text-sm text-muted-foreground mb-1">Service Type</h4>
                              <p className="text-sm font-medium capitalize">{caseData.selectedService.serviceType}</p>
                            </div>
                            <div>
                              <h4 className="font-medium text-sm text-muted-foreground mb-1">Status</h4>
                              <Badge variant="outline" className="capitalize">
                                {caseData.selectedService.status}
                              </Badge>
                            </div>
                          </div>
                          <div>
                            <h4 className="font-medium text-sm text-muted-foreground mb-2">Description</h4>
                            <p className="text-sm leading-relaxed">{caseData.selectedService.description}</p>
                          </div>
                        </div>
                      ) : caseData.agreedPricing ? (
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-medium text-sm text-muted-foreground mb-2">Agreed Pricing</h4>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-green-700 border-green-300">
                                {caseData.agreedPricing.currency || 'INR'} {caseData.agreedPricing.amount?.toLocaleString() || '0'}
                              </Badge>
                              <span className="text-xs text-muted-foreground capitalize">
                                ({caseData.agreedPricing.type || 'fixed'})
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No service details available</p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="documents" className="space-y-6">
                  {/* Work Completion Proof (for resolved cases) */}
                  {caseData?.status === 'resolved' && caseData?.workProof && (
                    <Card className="border-green-200 bg-green-50">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-green-800">
                          <FileCheck className="h-5 w-5" />
                          Work Completion Proof
                        </CardTitle>
                        <CardDescription className="text-green-700">
                          Document(s) submitted by the lawyer as proof of completed work
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between p-4 bg-white border border-green-200 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 rounded-lg">
                              <FileCheck className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-green-900">Work Completion Document</p>
                              <p className="text-xs text-green-700">
                                Submitted on {new Date(caseData.workProof.uploadedAt).toLocaleDateString()}
                              </p>
                              {caseData.workProof.description && (
                                <p className="text-xs text-green-600 mt-1">
                                  {caseData.workProof.description}
                                </p>
                              )}
                            </div>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="border-green-600 text-green-600 hover:bg-green-100"
                            onClick={() => handleDownloadDocument(caseData.workProof!.documentId, 'work-proof-document')}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download Proof
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Regular Documents */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText className="h-5 w-5" />
                          Case Documents ({documents.length})
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {documents.length > 0 ? (
                        <div className="space-y-3">
                          {documents.map((doc) => (
                            <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                              <div className="flex items-center gap-3">
                                <FileText className="h-5 w-5 text-muted-foreground" />
                                <div>
                                  <p className="text-sm font-medium">{doc.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    Uploaded by {doc.uploadedBy} on {new Date(doc.uploadedAt).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge 
                                  variant={doc.status === 'approved' ? 'default' : doc.status === 'pending' ? 'secondary' : 'destructive'}
                                  className="text-xs"
                                >
                                  {doc.status}
                                </Badge>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleDownloadDocument(doc.id, doc.name)}
                                >
                                  <Download className="h-4 w-4 mr-1" />
                                  Download
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No case documents uploaded yet</p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="timeline" className="space-y-6">
                  {/* Timeline */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Case Timeline
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          <div className="h-2 w-2 bg-green-500 rounded-full mt-2"></div>
                          <div>
                            <p className="text-sm font-medium">Case Created</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(caseData.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        {caseData.workProof && (
                          <div className="flex items-start gap-3">
                            <div className="h-2 w-2 bg-blue-500 rounded-full mt-2"></div>
                            <div>
                              <p className="text-sm font-medium">Work Proof Uploaded</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(caseData.workProof.uploadedAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        )}
                        {caseData.status === 'resolved' && (
                          <div className="flex items-start gap-3">
                            <div className="h-2 w-2 bg-orange-500 rounded-full mt-2"></div>
                            <div>
                              <p className="text-sm font-medium">Case Resolved - Payment Processing</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(caseData.updatedAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        )}
                        {caseData.status === 'completed' && (
                          <div className="flex items-start gap-3">
                            <div className="h-2 w-2 bg-green-600 rounded-full mt-2"></div>
                            <div>
                              <p className="text-sm font-medium">Case Completed</p>
                              <p className="text-xs text-muted-foreground">
                                Payment received and case closed
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            {/* Right Column - Actions */}
            <div className="space-y-6">
              {/* Lawyer Information - Only show for clients */}
              {user?.role === 'client' && caseData.lawyer && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Your Lawyer
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-legal-navy rounded-full flex items-center justify-center">
                        <User className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{caseData.lawyer.name}</h3>
                        <p className="text-sm text-muted-foreground">Legal Counsel</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{caseData.lawyer.email}</span>
                      </div>
                      {caseData.lawyer.phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>{caseData.lawyer.phone}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-4 border-t">
                      <Button 
                        className="w-full justify-start bg-blue-600 hover:bg-blue-700"
                        onClick={() => setShowMessaging(true)}
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Message Lawyer
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Case Actions */}
              {user?.role === 'lawyer' && caseData.status !== 'completed' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Case Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Message Client Button */}
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={handleMessageClient}
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Message Client
                    </Button>

                    {!caseData.workProof && caseData.status !== 'resolved' && (
                      <Dialog open={showProofDialog} onOpenChange={setShowProofDialog}>
                        <DialogTrigger asChild>
                          <Button className="w-full justify-start bg-blue-600 hover:bg-blue-700">
                            <Upload className="h-4 w-4 mr-2" />
                            Upload Work Proof
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Upload Work Completion Proof</DialogTitle>
                            <DialogDescription>
                              Upload documents or proof showing the work has been completed
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="proof-file">Select File</Label>
                              <Input
                                id="proof-file"
                                type="file"
                                accept=".pdf,.doc,.docx,.jpg,.png"
                                onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                              />
                            </div>
                            <div>
                              <Label htmlFor="proof-description">Description</Label>
                              <Textarea
                                id="proof-description"
                                placeholder="Describe the work completed..."
                                value={proofDescription}
                                onChange={(e) => setProofDescription(e.target.value)}
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button 
                              onClick={handleUploadProof} 
                              disabled={uploadingProof || !proofFile || !proofDescription.trim()}
                            >
                              {uploadingProof ? 'Uploading...' : 'Upload Proof'}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    )}

                    {caseData.workProof && caseData.status !== 'resolved' && (
                      <Dialog open={showResolveDialog} onOpenChange={setShowResolveDialog}>
                        <DialogTrigger asChild>
                          <Button className="w-full justify-start bg-green-600 hover:bg-green-700">
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Mark as Resolved
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Resolve Case & Request Payment</DialogTitle>
                            <DialogDescription>
                              This will mark the case as resolved and automatically generate a payment request for the client.
                            </DialogDescription>
                          </DialogHeader>
                          {(caseData.agreedPricing || caseData.selectedService) && (
                            <Alert>
                              <DollarSign className="h-4 w-4" />
                              <AlertDescription>
                                Payment request will be generated for{' '}
                                <strong>
                                  {caseData.agreedPricing 
                                    ? `${caseData.agreedPricing.currency || 'INR'} ${caseData.agreedPricing.amount?.toLocaleString() || '0'}`
                                    : `${caseData.selectedService?.currency || 'INR'} ${caseData.selectedService?.amount?.toLocaleString() || '0'}`
                                  }
                                </strong>
                              </AlertDescription>
                            </Alert>
                          )}
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setShowResolveDialog(false)}>
                              Cancel
                            </Button>
                            <Button onClick={handleResolveCase} className="bg-green-600 hover:bg-green-700">
                              Resolve & Request Payment
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    )}

                    {caseData.status === 'resolved' && (
                      <Alert>
                        <Banknote className="h-4 w-4" />
                        <AlertDescription>
                          Case resolved. Payment request sent to client. Waiting for payment confirmation.
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Case Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Case Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Documents</span>
                    <span className="font-medium">{documents.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Days Active</span>
                    <span className="font-medium">
                      {Math.ceil((new Date().getTime() - new Date(caseData.createdAt).getTime()) / (1000 * 60 * 60 * 24))}
                    </span>
                  </div>
                  {caseData.agreedPricing && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Agreed Amount</span>
                      <span className="font-medium text-green-600">
                        {caseData.agreedPricing.currency || 'INR'} {caseData.agreedPricing.amount?.toLocaleString() || '0'}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
      <Footer />
      
      {/* Messaging Component */}
      <LinkedInMessaging
        isOpen={showMessaging}
        onClose={() => setShowMessaging(false)}
        targetUserId={user?.role === 'client' ? caseData?.lawyer?._id : caseData?.client?._id}
        targetUser={user?.role === 'client' ? 
          (caseData?.lawyer ? {
            _id: caseData.lawyer._id,
            name: caseData.lawyer.name,
            role: 'lawyer'
          } : undefined) : 
          (caseData?.client ? {
            _id: caseData.client._id,
            name: caseData.client.name,
            role: 'client'
          } : undefined)
        }
      />
    </>
  );
};

export default CaseDetailsView;