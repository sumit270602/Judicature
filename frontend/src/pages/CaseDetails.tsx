import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  FileText, 
  User, 
  Phone, 
  Mail, 
  MapPin,
  Briefcase, 
  Download, 
  Upload, 
  Shield, 
  AlertCircle,
  CheckCircle,
  Star,
  Award,
  MessageSquare,
  Eye,
  Edit,
  Share,
  Printer,
  ExternalLink,
  Settings,
  X
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getCaseById, getCaseDocuments, downloadDocument, uploadCaseDocument, updateCase } from '@/api';
import { useAuth } from '@/hooks/use-auth';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import LinkedInMessaging from '@/components/LinkedInMessaging';
import { useMessaging } from '@/hooks/use-messaging';

// Types
interface CaseDocument {
  id: string;
  name: string;
  uploadedBy: string;
  uploadedAt: string;
  status: 'pending' | 'approved' | 'rejected';
}

interface Lawyer {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  practiceAreas: string[];
  experience: number;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  bio?: string;
}

interface Client {
  _id: string;
  name: string;
  email: string;
  phone?: string;
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
  client: Client;
  lawyer?: Lawyer;
  createdAt: string;
  updatedAt: string;
  nextHearing?: string;
  documents: string[];
  agreedPricing?: {
    amount: number;
    currency: string;
    type: string;
  };
}

const CaseDetails: React.FC = () => {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [caseData, setCaseData] = useState<CaseData | null>(null);
  const [documents, setDocuments] = useState<CaseDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [documentsLoading, setDocumentsLoading] = useState(false);
    const [downloadingDocId, setDownloadingDocId] = useState<string | null>(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [showMessaging, setShowMessaging] = useState(false);

  // Get messaging hook
  const { sendDirectMessage, loadConversation } = useMessaging();

  // Handle messaging to lawyer
  const handleMessageLawyer = async () => {
    if (!caseData?.lawyer?._id) {
      toast({
        title: "Error",
        description: "No lawyer assigned to this case",
        variant: "destructive",
      });
      return;
    }

    try {
      // Load existing conversation with the lawyer (this will create one if it doesn't exist)
      await loadConversation(caseData.lawyer._id);
      
      // Open messaging popup
      setShowMessaging(true);
    } catch (error) {
      console.error('Error loading conversation:', error);
      // Still open messaging popup - the conversation will be created when first message is sent
      setShowMessaging(true);
    }
  };

  // Fetch case details and documents

  // Fetch case details and documents
  useEffect(() => {
    const fetchCaseData = async () => {
      if (!caseId) return;
      
      try {
        setLoading(true);
        const [caseResponse, documentsResponse] = await Promise.all([
          getCaseById(caseId),
          getCaseDocuments(caseId)
        ]);

        if (caseResponse.data.success) {
          setCaseData(caseResponse.data.case);
        }

        if (documentsResponse.data.success) {
          const docs = documentsResponse.data.documents || [];
          // Documents received from API
          setDocuments(docs);
        }
      } catch (error: any) {
        console.error('Error fetching case data:', error);
        toast({
          title: "Error Loading Case",
          description: error.response?.data?.message || "Failed to load case details",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCaseData();
  }, [caseId, toast]);

  // Download document
  const handleDownloadDocument = async (docId: string, fileName: string) => {
    if (!docId || docId === 'undefined') {
      toast({
        title: "Download Failed",
        description: "Invalid document ID",
        variant: "destructive",
      });
      return;
    }

    try {
      setDownloadingDocId(docId);
      const response = await downloadDocument(docId);
      
      // Create blob and download
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Download Started",
        description: `${fileName} is being downloaded`,
      });
    } catch (error: any) {
      console.error('Download error:', error);
      toast({
        title: "Download Failed",
        description: error.response?.data?.message || "Failed to download document",
        variant: "destructive",
      });
    } finally {
      setDownloadingDocId(null);
    }
  };

  // Handle file upload
  const handleFileUpload = async () => {
    if (!selectedFile || !caseId) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('document', selectedFile);
      formData.append('caseId', caseId);

      const response = await uploadCaseDocument(formData);
      
      if (response.data.success) {
        toast({
          title: "Upload Successful",
          description: "Document uploaded successfully",
        });
        
        // Refresh documents list
        const documentsResponse = await getCaseDocuments(caseId);
        if (documentsResponse.data.success) {
          setDocuments(documentsResponse.data.documents || []);
        }
        
        setShowUploadDialog(false);
        setSelectedFile(null);
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: error.response?.data?.message || "Failed to upload document",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  // Handle case update
  const handleUpdateCase = async (updates: any) => {
    if (!caseId) return;

    try {
      const response = await updateCase(caseId, updates);
      
      if (response.data.success) {
        setCaseData(response.data.case);
        toast({
          title: "Case Updated",
          description: "Case details updated successfully",
        });
        setShowEditDialog(false);
      }
    } catch (error: any) {
      console.error('Update error:', error);
      toast({
        title: "Update Failed",
        description: error.response?.data?.message || "Failed to update case",
        variant: "destructive",
      });
    }
  };

  // Handle case completion (for lawyers)
  const handleCompleteCase = async () => {
    if (!caseId || !user || user.role !== 'lawyer') return;

    try {
      const response = await updateCase(caseId, { status: 'completed' });
      
      if (response.data.success) {
        setCaseData(response.data.case);
        toast({
          title: "Case Completed",
          description: response.data.message || "Case marked as completed successfully. Payment request has been generated automatically.",
        });
      }
    } catch (error: any) {
      console.error('Complete case error:', error);
      toast({
        title: "Completion Failed",
        description: error.response?.data?.message || "Failed to complete case",
        variant: "destructive",
      });
    }
  };

  // Handle share case
  const handleShareCase = () => {
    if (!caseData) return;
    
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      toast({
        title: "Link Copied",
        description: "Case link copied to clipboard",
      });
    }).catch(() => {
      toast({
        title: "Copy Failed",
        description: "Failed to copy link to clipboard",
        variant: "destructive",
      });
    });
  };

  // Handle print case
  const handlePrintCase = () => {
    window.print();
  };

  // Handle schedule meeting
  const handleScheduleMeeting = () => {
    // This would typically open a calendar/scheduling interface
    toast({
      title: "Schedule Meeting",
      description: "Meeting scheduling feature coming soon",
    });
  };

  // Handle add note
  const handleAddNote = (note: string) => {
    // This would typically add a note to the case
    toast({
      title: "Note Added",
      description: "Note added to case successfully",
    });
    setShowNoteDialog(false);
  };

  // Handle document preview
  const handlePreviewDocument = (docId: string, docName: string) => {
    // For now, we'll just show a toast. In a real implementation, 
    // this would open a document viewer
    toast({
      title: "Document Preview",
      description: `Opening preview for ${docName}`,
    });
  };

  // Find Lawyer Modal State
  const [showFindLawyerDialog, setShowFindLawyerDialog] = useState(false);
  const [lawyers, setLawyers] = useState<any[]>([]);
  const [isLoadingLawyers, setIsLoadingLawyers] = useState(false);
  const [selectedLawyerId, setSelectedLawyerId] = useState<string>('');

  // Handle find lawyer
  const handleFindLawyer = async () => {
    setShowFindLawyerDialog(true);
    setIsLoadingLawyers(true);
    
    try {
      // Preparing case data for lawyer recommendations
      
      // Get lawyer recommendations for this case
      const response = await fetch('/api/recommendations/lawyers-for-case', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          caseType: caseData?.caseType,
          caseDescription: caseData?.description
        })
      });
      
      // Processing API response
      
      if (response.ok) {
        const data = await response.json();
        // Lawyer recommendations received
        setLawyers(data.lawyers || []);
      } else {
        const errorText = await response.text();
        console.error('API Error:', response.status, errorText);
        throw new Error(`Failed to fetch lawyers: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.error('Error fetching lawyers:', error);
      toast({
        title: "Error",
        description: "Failed to load lawyer recommendations. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingLawyers(false);
    }
  };

  // Assign lawyer to case
  const handleAssignLawyer = async () => {
    if (!selectedLawyerId || !caseId) return;
    
    try {
      const response = await fetch(`/api/cases/${caseId}/assign-lawyer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ lawyerId: selectedLawyerId })
      });
      
      if (response.ok) {
        toast({
          title: "Success",
          description: "Lawyer assigned successfully!",
        });
        setShowFindLawyerDialog(false);
        // Refresh case data
        window.location.reload();
      } else {
        throw new Error('Failed to assign lawyer');
      }
    } catch (error) {
      console.error('Error assigning lawyer:', error);
      toast({
        title: "Error",
        description: "Failed to assign lawyer. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      case 'completed': return 'bg-emerald-100 text-emerald-800';
      case 'on hold': return 'bg-orange-100 text-orange-800';
      default: return 'bg-blue-100 text-blue-800';
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
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-legal-navy mb-2">Case Not Found</h2>
            <p className="text-gray-600 mb-4">The requested case could not be found.</p>
            <Button onClick={() => navigate('/dashboard/client')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
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
      <div className="min-h-screen bg-gradient-to-br from-legal-navy/5 to-legal-gold/5 pt-24 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-4 mb-4">
              <Button 
                variant="ghost" 
                onClick={() => navigate('/dashboard/client')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleShareCase}>
                  <Share className="h-4 w-4 mr-2" />
                  Share
                </Button>
                <Button variant="outline" size="sm" onClick={handlePrintCase}>
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
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
              
              <div className="flex items-center gap-3">
                <Badge variant={getPriorityColor(caseData.priority)} className="capitalize">
                  {caseData.priority} Priority
                </Badge>
                <Badge className={`capitalize ${getStatusColor(caseData.status)}`}>
                  {caseData.status}
                </Badge>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Case Information */}
            <div className="lg:col-span-2 space-y-6">
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
                  
                  {/* Agreed Pricing Information */}
                  {caseData.agreedPricing && (
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-2">Agreed Pricing</h4>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-green-700 border-green-300">
                          {caseData.agreedPricing.currency} {caseData.agreedPricing.amount}
                        </Badge>
                        <span className="text-xs text-muted-foreground capitalize">
                          ({caseData.agreedPricing.type})
                        </span>
                      </div>
                    </div>
                  )}
                  
                  <Separator />
                  
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

              {/* Documents */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Documents ({documents.length})
                    </div>
                    <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Upload className="h-4 w-4 mr-2" />
                          Upload New
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Upload Document</DialogTitle>
                          <DialogDescription>
                            Upload a new document for this case
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="document">Select Document</Label>
                            <Input
                              id="document"
                              type="file"
                              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                              accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
                            Cancel
                          </Button>
                          <Button 
                            onClick={handleFileUpload} 
                            disabled={!selectedFile || uploading}
                          >
                            {uploading ? "Uploading..." : "Upload"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </CardTitle>
                  <CardDescription>
                    Case-related documents and files
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {documents.length > 0 ? (
                    <div className="space-y-3">
                      {documents.filter(doc => doc.id && doc.id !== 'undefined').map((doc) => (
                        <div 
                          key={doc.id} 
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium truncate">{doc.name}</p>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                <span>Uploaded by {doc.uploadedBy}</span>
                                <span>{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                                <Badge 
                                  variant={doc.status === 'approved' ? 'default' : doc.status === 'pending' ? 'secondary' : 'destructive'}
                                  className="text-xs"
                                >
                                  {doc.status}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownloadDocument(doc.id, doc.name)}
                              disabled={downloadingDocId === doc.id}
                            >
                              {downloadingDocId === doc.id ? (
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                              ) : (
                                <Download className="h-4 w-4" />
                              )}
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handlePreviewDocument(doc.id, doc.name)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="text-sm">No documents uploaded yet</p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-2"
                        onClick={() => setShowUploadDialog(true)}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload First Document
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Lawyer & Client Info */}
            <div className="space-y-6">
              {/* Assigned Lawyer */}
              {caseData.lawyer ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Assigned Lawyer
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 mb-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${caseData.lawyer.name}`} />
                        <AvatarFallback>
                          {caseData.lawyer.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{caseData.lawyer.name}</h3>
                          {caseData.lawyer.verificationStatus === 'verified' && (
                            <Badge variant="secondary" className="text-xs">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Verified
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            4.8
                          </div>
                          <div className="flex items-center gap-1">
                            <Award className="h-3 w-3" />
                            {caseData.lawyer.experience}y exp
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <a href={`mailto:${caseData.lawyer.email}`} className="text-blue-600 hover:underline">
                          {caseData.lawyer.email}
                        </a>
                      </div>
                      {caseData.lawyer.phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <a href={`tel:${caseData.lawyer.phone}`} className="text-blue-600 hover:underline">
                            {caseData.lawyer.phone}
                          </a>
                        </div>
                      )}
                    </div>

                    {caseData.lawyer.practiceAreas && caseData.lawyer.practiceAreas.length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium mb-2">Practice Areas</h4>
                        <div className="flex flex-wrap gap-1">
                          {caseData.lawyer.practiceAreas.map((area, index) => (
                            <Badge key={index} variant="outline" className="text-xs capitalize">
                              {area}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {caseData.lawyer.bio && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium mb-2">About</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">{caseData.lawyer.bio}</p>
                      </div>
                    )}

                    <div className="flex gap-2 mt-4">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={handleMessageLawyer}
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Message
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        <Phone className="h-4 w-4 mr-2" />
                        Call
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      No Lawyer Assigned
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        No lawyer has been assigned to this case yet. You can request lawyer recommendations or wait for automatic assignment.
                      </AlertDescription>
                    </Alert>
                    <Dialog open={showFindLawyerDialog} onOpenChange={setShowFindLawyerDialog}>
                      <DialogTrigger asChild>
                        <Button 
                          className="w-full mt-4 bg-legal-gold hover:bg-legal-gold/90 text-legal-navy"
                          onClick={handleFindLawyer}
                        >
                          <User className="h-4 w-4 mr-2" />
                          Find Lawyer
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <User className="h-5 w-5" />
                            Find & Assign Lawyer
                          </DialogTitle>
                          <DialogDescription>
                            Select a lawyer from our recommended professionals for this case.
                          </DialogDescription>
                        </DialogHeader>
                        
                        <div className="flex-1 overflow-hidden">
                          {isLoadingLawyers ? (
                            <div className="flex items-center justify-center py-12">
                              <div className="text-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-legal-navy mx-auto mb-3"></div>
                                <span className="text-legal-navy font-medium">Finding the best lawyers for your case...</span>
                                <p className="text-sm text-muted-foreground mt-1">Analyzing profiles and expertise</p>
                              </div>
                            </div>
                          ) : lawyers.length > 0 ? (
                            <ScrollArea className="h-96 pr-4">
                              <div className="space-y-4">
                                {lawyers.map((rec) => (
                                  <div 
                                    key={rec.lawyer._id}
                                    className={`group relative border-2 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-lg ${
                                      selectedLawyerId === rec.lawyer._id 
                                        ? 'border-legal-navy bg-gradient-to-br from-legal-navy/5 to-legal-navy/10 shadow-md' 
                                        : 'border-gray-200 hover:border-legal-navy/30 bg-white'
                                    }`}
                                    onClick={() => setSelectedLawyerId(rec.lawyer._id)}
                                  >
                                    {/* Selection Indicator */}
                                    {selectedLawyerId === rec.lawyer._id && (
                                      <div className="absolute -top-2 -right-2 z-10">
                                        <div className="bg-legal-navy text-white rounded-full p-1">
                                          <CheckCircle className="h-4 w-4" />
                                        </div>
                                      </div>
                                    )}

                                    <div className="p-4">
                                      {/* Header Section */}
                                      <div className="flex items-start gap-4 mb-3">
                                        <Avatar className="h-12 w-12 ring-2 ring-gray-100 group-hover:ring-legal-navy/20 transition-all">
                                          <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${rec.lawyer.name}`} />
                                          <AvatarFallback className="text-sm font-semibold bg-gradient-to-br from-legal-navy to-legal-navy/80 text-white">
                                            {rec.lawyer.name.split(' ').map((n: string) => n[0]).join('')}
                                          </AvatarFallback>
                                        </Avatar>
                                        
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-base font-bold text-gray-900 truncate">
                                              {rec.lawyer.name}
                                            </h3>
                                            {rec.lawyer.verificationStatus === 'verified' && (
                                              <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100 text-xs">
                                                <CheckCircle className="h-3 w-3 mr-1" />
                                                Verified
                                              </Badge>
                                            )}
                                          </div>
                                          
                                          {/* Statistics Row */}
                                          <div className="flex items-center gap-4 text-sm">
                                            <div className="flex items-center gap-1">
                                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                              <span className="font-semibold">{rec.rating.toFixed(1)}</span>
                                            </div>
                                            <div className="flex items-center gap-1 text-green-600">
                                              <Award className="h-3 w-3" />
                                              <span className="font-semibold">{rec.casesWon}</span>
                                              <span>wins</span>
                                            </div>
                                            <div className="flex items-center gap-1 text-blue-600">
                                              <Clock className="h-3 w-3" />
                                              <span className="font-semibold">{rec.experience}</span>
                                              <span>y exp</span>
                                            </div>
                                          </div>
                                        </div>

                                        {/* Match Score */}
                                        <div className="text-center">
                                          <div className="bg-legal-navy text-white rounded-full px-2 py-1 text-xs font-bold">
                                            {Math.round(rec.similarity * 100)}%
                                          </div>
                                          <div className="text-xs text-muted-foreground mt-1">match</div>
                                        </div>
                                      </div>

                                      {/* Specializations */}
                                      <div className="border-t pt-3">
                                        <div className="flex flex-wrap gap-1">
                                          {rec.specializations.slice(0, 3).map((spec: string, idx: number) => (
                                            <Badge key={idx} variant="outline" className="text-xs px-2 py-1 bg-legal-navy/5 border-legal-navy/20">
                                              {spec}
                                            </Badge>
                                          ))}
                                          {rec.specializations.length > 3 && (
                                            <Badge variant="outline" className="text-xs px-2 py-1 bg-gray-100 border-gray-300">
                                              +{rec.specializations.length - 3}
                                            </Badge>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </ScrollArea>
                          ) : (
                            <div className="text-center py-12 text-muted-foreground">
                              <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                              <p className="text-sm">No lawyer recommendations available.</p>
                              <p className="text-xs">Please try again later or contact support.</p>
                            </div>
                          )}
                        </div>
                        
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setShowFindLawyerDialog(false)}>
                            Cancel
                          </Button>
                          <Button 
                            className="bg-legal-navy hover:bg-legal-navy/90"
                            onClick={handleAssignLawyer}
                            disabled={!selectedLawyerId || isLoadingLawyers}
                          >
                            Assign Selected Lawyer
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </CardContent>
                </Card>
              )}

              {/* Case Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Case Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Case Details
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Edit Case Details</DialogTitle>
                        <DialogDescription>
                          Update case information
                        </DialogDescription>
                      </DialogHeader>
                      <EditCaseForm 
                        caseData={caseData} 
                        onSave={handleUpdateCase}
                        onCancel={() => setShowEditDialog(false)}
                      />
                    </DialogContent>
                  </Dialog>
                  
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => setShowUploadDialog(true)}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Document
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={handleScheduleMeeting}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule Meeting
                  </Button>
                  
                  <Dialog open={showNoteDialog} onOpenChange={setShowNoteDialog}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Add Note
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Note</DialogTitle>
                        <DialogDescription>
                          Add a note to this case
                        </DialogDescription>
                      </DialogHeader>
                      <AddNoteForm 
                        onSave={handleAddNote}
                        onCancel={() => setShowNoteDialog(false)}
                      />
                    </DialogContent>
                  </Dialog>

                  {/* Case Completion Button - Only for lawyers */}
                  {user?.role === 'lawyer' && caseData.status !== 'completed' && caseData.status !== 'closed' && (
                    <div className="space-y-2">
                      <Button 
                        className="w-full justify-start bg-green-600 hover:bg-green-700 text-white"
                        onClick={handleCompleteCase}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Mark Case Complete
                      </Button>
                      {caseData.agreedPricing && (
                        <p className="text-xs text-muted-foreground px-2">
                          💰 Auto payment request will be created for {caseData.agreedPricing.currency} {caseData.agreedPricing.amount}
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Stats */}
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
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Last Update</span>
                    <span className="font-medium">
                      {Math.ceil((new Date().getTime() - new Date(caseData.updatedAt).getTime()) / (1000 * 60 * 60 * 24))} days ago
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
      <Footer />
      
      {/* LinkedIn-style Messaging */}
      <LinkedInMessaging
        isOpen={showMessaging}
        onClose={() => setShowMessaging(false)}
        targetUserId={caseData?.lawyer?._id}
        targetUser={caseData?.lawyer ? {
          _id: caseData.lawyer._id,
          name: caseData.lawyer.name,
          role: 'lawyer'
        } : undefined}
      />
    </>
  );
};

// Edit Case Form Component
const EditCaseForm: React.FC<{
  caseData: CaseData | null;
  onSave: (updates: any) => void;
  onCancel: () => void;
}> = ({ caseData, onSave, onCancel }) => {
  const [title, setTitle] = useState(caseData?.title || '');
  const [description, setDescription] = useState(caseData?.description || '');
  const [priority, setPriority] = useState(caseData?.priority || 'medium');
  const [status, setStatus] = useState(caseData?.status || 'active');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      title,
      description,
      priority,
      status
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Case Title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter case title"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter case description"
          rows={3}
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="priority">Priority</Label>
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="on hold">On Hold</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          Save Changes
        </Button>
      </DialogFooter>
    </form>
  );
};

// Add Note Form Component
const AddNoteForm: React.FC<{
  onSave: (note: string) => void;
  onCancel: () => void;
}> = ({ onSave, onCancel }) => {
  const [note, setNote] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (note.trim()) {
      onSave(note.trim());
      setNote('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="note">Note</Label>
        <Textarea
          id="note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Enter your note here..."
          rows={4}
        />
      </div>
      
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={!note.trim()}>
          Add Note
        </Button>
      </DialogFooter>
    </form>
  );
};

export default CaseDetails;