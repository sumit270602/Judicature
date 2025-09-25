import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar, FileText, User, DollarSign, Bell, Briefcase, Download, Upload, Shield, Settings, AlertCircle, Bot, Send, Sparkles, FileUp, ArrowRight, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useClientDashboard, useRealTimeUpdates, type Case } from '@/hooks/useDashboard';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { downloadDocument } from '@/api';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import MessagingTrigger from '@/components/MessagingTrigger';

// Client dashboard stats
interface ClientDashboardStats {
  activeCases: number;
  nextCourtDate: string;
  aiAssistantAvailable: boolean;
}

// Header stats cards for clients
const ClientHeaderCards = ({ stats }: { stats: ClientDashboardStats }) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
    <Card className="border-l-4 border-l-legal-navy">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Active Cases</CardTitle>
        <Briefcase className="h-4 w-4 text-legal-navy" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-legal-navy">{stats.activeCases}</div>
        <p className="text-xs text-muted-foreground">Your ongoing legal matters</p>
      </CardContent>
    </Card>
    
    <Card className="border-l-4 border-l-legal-gold">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Next Court Date</CardTitle>
        <Calendar className="h-4 w-4 text-legal-gold" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-legal-gold">{stats.nextCourtDate}</div>
        <p className="text-xs text-muted-foreground">Upcoming appearance</p>
      </CardContent>
    </Card>
    
    <Dialog>
      <DialogTrigger asChild>
        <Card className="border-l-4 border-l-blue-500 cursor-pointer hover:bg-gray-50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Legal Assistant</CardTitle>
            <Bot className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">Available</div>
            <p className="text-xs text-muted-foreground">Get instant legal guidance</p>
          </CardContent>
        </Card>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-blue-500" />
            AI Legal Assistant
          </DialogTitle>
          <DialogDescription>
            Get instant answers to your legal questions and guidance on your cases
          </DialogDescription>
        </DialogHeader>
        <AIAssistantChat />
      </DialogContent>
    </Dialog>
  </div>
);

// AI-Powered Case Filing component
// AI Case Filing Dialog Component
const AICaseFilingDialog = ({ 
  isOpen, 
  onClose, 
  onSubmit 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onSubmit: (caseData: any) => void;
}) => {
  const [step, setStep] = useState(1);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiGeneratedContent, setAiGeneratedContent] = useState({
    title: '',
    description: '',
    caseType: '',
    priority: 'medium' as 'high' | 'medium' | 'low'
  });
  const [editableContent, setEditableContent] = useState({
    title: '',
    description: '',
    caseType: '',
    priority: 'medium' as 'high' | 'medium' | 'low'
  });
  const { toast } = useToast();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setUploadedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const simulateAIAnalysis = async () => {
    setIsAnalyzing(true);
    
    // Simulate AI processing time
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Mock AI-generated content based on uploaded files
    const mockContent = {
      title: "Contract Dispute Resolution",
      description: "This case involves a contractual disagreement regarding payment terms and service delivery. Based on the uploaded documents, there appears to be a breach of contract that requires legal intervention to resolve the dispute and recover damages.",
      caseType: "civil",
      priority: "medium" as const
    };
    
    setAiGeneratedContent(mockContent);
    setEditableContent(mockContent);
    setIsAnalyzing(false);
    setStep(2);
    
    toast({
      title: "AI Analysis Complete",
      description: "Your case has been analyzed and a draft has been generated.",
    });
  };

  const handleSubmitCase = async () => {
    try {
      // Create FormData for file uploads
      const formData = new FormData();
      formData.append('title', editableContent.title);
      formData.append('description', editableContent.description);
      formData.append('caseType', editableContent.caseType);
      formData.append('priority', editableContent.priority);
      
      uploadedFiles.forEach((file, index) => {
        formData.append(`documents`, file);
      });

      onSubmit(formData);
      onClose();
      
      toast({
        title: "Case Filed Successfully",
        description: "Your AI-generated case has been submitted for review.",
      });
    } catch (error) {
      toast({
        title: "Filing Failed",
        description: "There was an error filing your case. Please try again.",
        variant: "destructive",
      });
    }
  };

  const resetDialog = () => {
    setStep(1);
    setUploadedFiles([]);
    setIsAnalyzing(false);
    setAiGeneratedContent({ title: '', description: '', caseType: '', priority: 'medium' });
    setEditableContent({ title: '', description: '', caseType: '', priority: 'medium' });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) { resetDialog(); onClose(); } }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Bot className="h-6 w-6 text-indigo-600" />
            AI-Powered Case Filing
          </DialogTitle>
          <DialogDescription>
            Upload your documents and let AI help you create a professional case filing
          </DialogDescription>
        </DialogHeader>

        {/* Progress Indicator */}
        <div className="flex items-center justify-between mb-6">
          {[
            { num: 1, title: "Upload Documents", active: step >= 1, completed: step > 1 },
            { num: 2, title: "AI Analysis", active: step >= 2, completed: step > 2 },
            { num: 3, title: "Review & Submit", active: step >= 3, completed: false }
          ].map((s, index) => (
            <div key={s.num} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                s.completed ? 'bg-green-500 text-white' : 
                s.active ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {s.completed ? '✓' : s.num}
              </div>
              <span className={`ml-2 text-sm ${s.active ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                {s.title}
              </span>
              {index < 2 && <ArrowRight className="mx-4 h-4 w-4 text-gray-400" />}
            </div>
          ))}
        </div>

        {/* Step 1: File Upload */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="border-2 border-dashed border-indigo-200 rounded-lg p-8 text-center hover:border-indigo-300 transition-colors">
              <input
                type="file"
                multiple
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <FileUp className="h-12 w-12 text-indigo-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload Case Documents</h3>
                <p className="text-gray-600 mb-4">
                  Drag and drop files here, or click to browse
                </p>
                <p className="text-sm text-gray-500">
                  Supported formats: PDF, DOC, DOCX, JPG, PNG, TXT
                </p>
              </label>
            </div>

            {/* Uploaded Files List */}
            {uploadedFiles.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">Uploaded Files ({uploadedFiles.length})</h4>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium truncate">{file.name}</span>
                        <span className="text-xs text-gray-500">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        className="h-6 w-6 p-0 hover:bg-red-100"
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <Button
                onClick={simulateAIAnalysis}
                disabled={uploadedFiles.length === 0}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                <Bot className="mr-2 h-4 w-4" />
                Analyze with AI
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: AI Analysis */}
        {step === 2 && isAnalyzing && (
          <div className="text-center py-12 space-y-4">
            <div className="relative">
              <div className="w-16 h-16 mx-auto bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                <Bot className="h-8 w-8 text-white animate-pulse" />
              </div>
              <div className="absolute inset-0 w-16 h-16 mx-auto border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin"></div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">AI is analyzing your documents...</h3>
            <p className="text-gray-600">This may take a few moments. Please wait.</p>
            <div className="flex justify-center items-center space-x-1">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 0.2}s` }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Review & Edit */}
        {step === 2 && !isAnalyzing && (
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-5 w-5 text-green-600" />
                <h4 className="font-semibold text-green-900">AI Analysis Complete</h4>
              </div>
              <p className="text-green-700 text-sm">
                Based on your documents, I've generated a case draft. Please review and edit as needed.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Case Title</label>
                <Input
                  value={editableContent.title}
                  onChange={(e) => setEditableContent(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Case Type</label>
                <select
                  value={editableContent.caseType}
                  onChange={(e) => setEditableContent(prev => ({ ...prev, caseType: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Select case type</option>
                  <option value="civil">Civil</option>
                  <option value="criminal">Criminal</option>
                  <option value="family">Family</option>
                  <option value="corporate">Corporate</option>
                  <option value="employment">Employment</option>
                  <option value="real-estate">Real Estate</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Case Description</label>
              <Textarea
                value={editableContent.description}
                onChange={(e) => setEditableContent(prev => ({ ...prev, description: e.target.value }))}
                className="w-full min-h-32"
                rows={6}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Priority Level</label>
              <div className="flex gap-4">
                {[
                  { value: 'low', label: 'Low', color: 'bg-gray-100 text-gray-700' },
                  { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-700' },
                  { value: 'high', label: 'High', color: 'bg-red-100 text-red-700' }
                ].map((priority) => (
                  <button
                    key={priority.value}
                    onClick={() => setEditableContent(prev => ({ ...prev, priority: priority.value as any }))}
                    className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                      editableContent.priority === priority.value 
                        ? 'border-indigo-500 bg-indigo-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    } ${priority.color}`}
                  >
                    {priority.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ArrowRight className="mr-2 h-4 w-4 rotate-180" />
                Back to Upload
              </Button>
              <Button
                onClick={handleSubmitCase}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
                disabled={!editableContent.title || !editableContent.description || !editableContent.caseType}
              >
                <FileText className="mr-2 h-4 w-4" />
                File Case
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

const AICaseFiling = ({ 
  navigate, 
  onCaseSubmit 
}: { 
  navigate: (path: string) => void;
  onCaseSubmit?: (caseData: any) => void;
}) => {
  const [showDialog, setShowDialog] = useState(false);

  return (
    <>
      <AICaseFilingDialog 
        isOpen={showDialog}
        onClose={() => setShowDialog(false)}
        onSubmit={onCaseSubmit || (() => {})}
      />
      
      <Card className="mb-6 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border-2 border-indigo-200 hover:border-indigo-300 transition-all duration-300 hover:shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-md">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  AI-Powered Case Filing
                </h3>
                <p className="text-sm text-slate-600">Let AI help you file your case effortlessly</p>
              </div>
            </div>
            <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-none text-xs">
              <Zap className="w-3 h-3 mr-1" />
              Smart Filing
            </Badge>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-center">
            {/* Process Steps - Horizontal Layout */}
            <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { icon: FileUp, title: "Upload", desc: "Share documents" },
                { icon: Bot, title: "AI Analysis", desc: "Smart processing" },
                { icon: FileText, title: "Auto-Filing", desc: "Ready to submit" }
              ].map((step, index) => (
                <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-white/80 border border-indigo-100">
                  <div className="p-2 bg-indigo-100 rounded-lg flex-shrink-0">
                    <step.icon className="h-4 w-4 text-indigo-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">{step.title}</p>
                    <p className="text-xs text-gray-600 truncate">{step.desc}</p>
                  </div>
                  {index < 2 && (
                    <ArrowRight className="h-4 w-4 text-gray-400 flex-shrink-0 hidden md:block" />
                  )}
                </div>
              ))}
            </div>
            
            {/* Action Button */}
            <div className="flex flex-col items-center lg:items-end gap-2">
              <Button 
                onClick={() => setShowDialog(true)}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 w-full lg:w-auto"
              >
                <Bot className="mr-2 h-4 w-4" />
                Start AI Filing
              </Button>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  500+ filed
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                  95% success
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
};

// My Cases Table component
const MyCasesTable = ({ cases, navigate }: { cases: Case[]; navigate: (path: string) => void }) => (
  <Card className="mb-6">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Briefcase className="h-5 w-5" />
        My Cases
      </CardTitle>
      <CardDescription>Overview of your legal matters</CardDescription>
    </CardHeader>
    <CardContent>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Case Title</TableHead>
            <TableHead>Lawyer</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Progress</TableHead>
            <TableHead>Next Hearing</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {cases.length > 0 ? cases.map((case_) => (
            <TableRow key={case_._id}>
              <TableCell className="font-medium">{case_.title}</TableCell>
              <TableCell>{case_.lawyer?.name || 'Not assigned'}</TableCell>
              <TableCell>
                <Badge 
                  variant={case_.status === 'active' ? 'default' : case_.status === 'pending' ? 'secondary' : 'outline'}
                >
                  {case_.status}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Progress value={case_.progress || 0} className="w-16" />
                  <span className="text-sm">{case_.progress || 0}%</span>
                </div>
              </TableCell>
              <TableCell className="text-sm">
                {case_.nextHearing ? new Date(case_.nextHearing).toLocaleDateString() : 'TBD'}
              </TableCell>
              <TableCell>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate(`/case/${case_._id}`)}
                >
                  View Details
                </Button>
              </TableCell>
            </TableRow>
          )) : (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                No cases found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </CardContent>
  </Card>
);

// Document Vault component
const DocumentVault = ({ 
  documents, 
  uploadDocument, 
  isUploading 
}: { 
  documents: any[]; 
  uploadDocument: (data: FormData) => void; 
  isUploading: boolean;
}) => {
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [downloadingDocId, setDownloadingDocId] = useState<string | null>(null);
  const { toast } = useToast();

  // Handle file upload
  const handleFileUpload = async () => {
    if (!selectedFile) return;

    try {
      const formData = new FormData();
      formData.append('document', selectedFile);

      uploadDocument(formData);
      
      toast({
        title: "Upload Started",
        description: "Document is being uploaded",
      });
      
      setShowUploadDialog(false);
      setSelectedFile(null);
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload document",
        variant: "destructive",
      });
    }
  };

  // Download document function (reused from CaseDetails)
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

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Document Vault
        </CardTitle>
        <CardDescription>Your legal documents and case files</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div 
            className="text-center p-4 border-2 border-dashed border-muted rounded-lg hover:border-legal-navy transition-colors cursor-pointer"
            onClick={() => setShowUploadDialog(true)}
          >
            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm font-medium">Upload Document</p>
            <p className="text-xs text-muted-foreground">Drag & drop or click to browse</p>
          </div>
          <div className="text-center p-4 border rounded-lg bg-muted/50">
            <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm font-medium">Total Documents</p>
            <p className="text-2xl font-bold text-legal-navy">{documents?.length || 0}</p>
          </div>
        </div>
        
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Your Documents</h4>
          {documents && documents.length > 0 ? documents.map((doc, index) => (
            <div key={doc._id || index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
              <div className="flex items-center gap-3">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{doc.originalName || doc.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {doc.type || 'Document'} • {doc.size || 'Unknown size'} • {new Date(doc.uploadDate || doc.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleDownloadDocument(doc._id, doc.originalName || doc.name)}
                  disabled={downloadingDocId === doc._id}
                >
                  {downloadingDocId === doc._id ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-legal-navy border-t-transparent" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleDownloadDocument(doc._id, doc.originalName || doc.name)}
                >
                  View
                </Button>
              </div>
            </div>
          )) : (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No documents uploaded yet</p>
              <p className="text-xs">Click the upload area above to add your first document</p>
            </div>
          )}
        </div>

        {/* Upload Dialog */}
        <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Document</DialogTitle>
              <DialogDescription>
                Select a document to upload to your document vault
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <input
                  type="file"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="w-full p-2 border rounded-lg"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
                />
                {selectedFile && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleFileUpload} 
                  disabled={!selectedFile || isUploading}
                >
                  {isUploading ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};



// AI Assistant Chat component
const AIAssistantChat = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! I'm your AI Legal Assistant. I can help answer questions about your cases, explain legal terms, and provide guidance on legal processes. How can I assist you today?",
      sender: 'ai',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const commonQuestions = [
    "What should I expect at my court hearing?",
    "How do I prepare for my case?",
    "What documents do I need?",
    "Explain legal terms in my case",
    "What are my rights in this situation?"
  ];

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: messages.length + 1,
      text: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse = {
        id: messages.length + 2,
        text: "I understand your question. While I can provide general legal information, please remember that this doesn't constitute legal advice. For your specific situation, I recommend discussing this with your assigned lawyer. Would you like me to help you prepare questions to ask them?",
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 2000);
  };

  const handleQuestionClick = (question: string) => {
    setInputMessage(question);
  };

  return (
    <div className="flex flex-col h-[500px]">
      {/* Chat Messages */}
      <ScrollArea className="flex-1 p-4 border rounded-lg mb-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-lg ${
                  message.sender === 'user'
                    ? 'bg-legal-navy text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <p className="text-sm">{message.text}</p>
                <p className="text-xs opacity-70 mt-1">
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-gray-100 p-3 rounded-lg">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Common Questions */}
      <div className="mb-4">
        <p className="text-sm font-medium mb-2">Quick Questions:</p>
        <div className="flex flex-wrap gap-2">
          {commonQuestions.map((question, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              onClick={() => handleQuestionClick(question)}
              className="text-xs"
            >
              {question}
            </Button>
          ))}
        </div>
      </div>

      {/* Message Input */}
      <div className="flex gap-2">
        <Input
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Ask me anything about your legal matters..."
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          className="flex-1"
        />
        <Button onClick={handleSendMessage} disabled={!inputMessage.trim() || isTyping}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

// Client Calendar component
const ClientCalendar = () => (
  <Card className="mb-6">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Calendar className="h-5 w-5" />
        Calendar & Appointments
      </CardTitle>
      <CardDescription>Your schedule and important dates</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-2">{day}</div>
          ))}
        </div>
        
        <div className="border rounded-lg p-4 space-y-3">
          <h4 className="text-sm font-medium">Upcoming Events</h4>
          {[
            { date: 'Dec 22', time: '2:00 PM', event: 'Court Hearing', type: 'hearing' },
            { date: 'Dec 24', time: '10:00 AM', event: 'Lawyer Meeting', type: 'meeting' },
            { date: 'Dec 28', time: '3:00 PM', event: 'Document Review', type: 'task' },
          ].map((item, index) => (
            <div key={index} className="flex items-center gap-3 p-2 border rounded">
              <div className={`w-3 h-3 rounded-full ${
                item.type === 'hearing' ? 'bg-red-500' :
                item.type === 'meeting' ? 'bg-blue-500' :
                'bg-green-500'
              }`} />
              <div className="flex-1">
                <p className="text-sm font-medium">{item.event}</p>
                <p className="text-xs text-muted-foreground">{item.date} at {item.time}</p>
              </div>
            </div>
          ))}
        </div>
        
        <Button variant="outline" className="w-full">
          <Calendar className="mr-2 h-4 w-4" />
          View Full Calendar
        </Button>
      </div>
    </CardContent>
  </Card>
);

// Billing & Payments component
const BillingPayments = () => (
  <Card className="mb-6">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <DollarSign className="h-5 w-5" />
        Billing & Payments
      </CardTitle>
      <CardDescription>Invoices and payment history</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        <div className="flex justify-between items-center p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg border border-green-200">
          <div>
            <p className="text-sm font-medium text-green-800">Account Status</p>
            <p className="text-xs text-green-600">All payments up to date</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-green-700">$0</p>
            <p className="text-xs text-green-600">Outstanding</p>
          </div>
        </div>
        
        <div>
          <h4 className="text-sm font-medium mb-3">Recent Invoices</h4>
          <div className="space-y-2">
            {[
              { invoice: 'INV-2024-001', amount: '$2,500', date: 'Dec 15, 2024', status: 'Paid' },
              { invoice: 'INV-2024-002', amount: '$1,800', date: 'Nov 30, 2024', status: 'Paid' },
              { invoice: 'INV-2024-003', amount: '$3,200', date: 'Nov 15, 2024', status: 'Paid' },
            ].map((invoice, index) => (
              <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                <div>
                  <p className="text-sm font-medium">{invoice.invoice}</p>
                  <p className="text-xs text-muted-foreground">{invoice.date}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{invoice.amount}</p>
                  <Badge variant="outline" className="text-xs">
                    {invoice.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <Button variant="outline" className="w-full">
          <DollarSign className="mr-2 h-4 w-4" />
          View Payment History
        </Button>
      </div>
    </CardContent>
  </Card>
);

// Notifications component
const NotificationsDrawer = () => (
  <Card className="mb-6">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Bell className="h-5 w-5" />
        Notifications
        <Badge variant="destructive" className="ml-auto">3</Badge>
      </CardTitle>
      <CardDescription>Important updates and alerts</CardDescription>
    </CardHeader>
    <CardContent>
      <ScrollArea className="h-60">
        <div className="space-y-3">
          {[
            {
              title: 'Court hearing reminder',
              message: 'Your hearing for Smith vs. Johnson is tomorrow at 2:00 PM',
              time: '2 hours ago',
              type: 'urgent',
              unread: true
            },
            {
              title: 'Document received',
              message: 'Your lawyer has shared new case documents',
              time: '5 hours ago',
              type: 'info',
              unread: true
            },
            {
              title: 'Payment confirmation',
              message: 'Invoice INV-2024-001 payment has been processed',
              time: '1 day ago',
              type: 'success',
              unread: false
            },
            {
              title: 'Case update',
              message: 'Progress update available on your property case',
              time: '2 days ago',
              type: 'info',
              unread: true
            }
          ].map((notification, index) => (
            <div
              key={index}
              className={`p-3 border rounded-lg ${
                notification.unread ? 'bg-blue-50 border-blue-200' : 'bg-muted/30'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-2 h-2 rounded-full mt-2 ${
                  notification.type === 'urgent' ? 'bg-red-500' :
                  notification.type === 'success' ? 'bg-green-500' :
                  'bg-blue-500'
                }`} />
                <div className="flex-1">
                  <p className="text-sm font-medium">{notification.title}</p>
                  <p className="text-xs text-muted-foreground mb-1">{notification.message}</p>
                  <p className="text-xs text-muted-foreground">{notification.time}</p>
                </div>
                {notification.unread && (
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                )}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
      <Button variant="outline" className="w-full mt-4">
        <Bell className="mr-2 h-4 w-4" />
        Mark All as Read
      </Button>
    </CardContent>
  </Card>
);

// Profile & Settings component
const ClientProfileSettings = ({ user }: { user: any }) => {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .substring(0, 2);
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Profile & Settings
        </CardTitle>
        <CardDescription>Manage your account and preferences</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user?.avatar || "/api/placeholder/64/64"} />
              <AvatarFallback>{user?.name ? getInitials(user.name) : 'U'}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{user?.name || 'User'}</p>
              <p className="text-xs text-muted-foreground">{user?.email || 'user@example.com'}</p>
              <Badge variant="outline" className="mt-1">
                <Shield className="w-3 h-3 mr-1" />
                {user?.isVerified ? 'Verified' : 'Unverified'}
              </Badge>
            </div>
          </div>
          
          <Separator />
          
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Personal Information</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Full Name:</span>
                <span>{user?.name || 'Not provided'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email:</span>
                <span>{user?.email || 'Not provided'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Phone:</span>
                <span>{user?.phone || 'Not provided'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Address:</span>
                <span>{user?.address || 'Not provided'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Member Since:</span>
                <span>{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}</span>
              </div>
            </div>
          </div>
          
          <Separator />
          
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Quick Settings</h4>
            {[
              { label: 'Personal Information', icon: User },
              { label: 'Security & KYC', icon: Shield },
              { label: 'Notifications', icon: Bell },
              { label: 'Privacy Settings', icon: Settings }
            ].map((item, index) => (
              <button
                key={index}
                className="w-full flex items-center gap-3 p-2 text-sm hover:bg-muted rounded"
              >
                <item.icon className="h-4 w-4 text-muted-foreground" />
                {item.label}
              </button>
            ))}
          </div>
          
          <Separator />
          
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span>Account Status</span>
              <Badge variant="default">Active</Badge>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span>Two-Factor Auth</span>
              <Badge variant="outline">Enabled</Badge>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span>KYC Status</span>
              <Badge variant="default">Verified</Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const ClientDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { stats, cases, documents, isLoading, error, uploadDocument, isUploading } = useClientDashboard();
  

  
  // Set up real-time updates
  useRealTimeUpdates(user?.id || '', 'client');

  // Loading state
  if (isLoading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gradient-to-br from-legal-navy/5 to-legal-gold/5 p-6">
          <div className="max-w-6xl mx-auto">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-300 rounded w-1/4 mb-4"></div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {[...Array(3)].map((_, i) => (
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
        <div className="min-h-screen bg-gradient-to-br from-legal-navy/5 to-legal-gold/5 p-6">
          <div className="max-w-6xl mx-auto">
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
  const defaultStats: ClientDashboardStats = {
    activeCases: 0,
    nextCourtDate: 'None scheduled',
    aiAssistantAvailable: true
  };

  const displayStats = stats || defaultStats;
  const displayCases = cases || [];

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-legal-navy/5 to-legal-gold/5 pt-24 p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-legal-navy mb-2">Client Dashboard</h1>
              <p className="text-slate-600">Track your cases, communicate with your lawyers, and manage your legal matters.</p>
            </div>
            <div className="flex items-center gap-3">
              <MessagingTrigger />
              <Button 
                onClick={() => navigate('/create-case')} 
                className="bg-legal-gold hover:bg-legal-gold/90 text-legal-navy font-medium px-6 py-2"
              >
                <Briefcase className="mr-2 h-4 w-4" />
                Create New Case
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <ClientHeaderCards stats={displayStats} />
          
          {/* AI Case Filing Section */}
          <AICaseFiling navigate={navigate} onCaseSubmit={(caseData) => {
            console.log('Case submitted:', caseData);
            // Handle case submission - could refresh cases or navigate
          }} />
          
          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Main Content */}
            <div className="lg:col-span-2 space-y-6">
              <MyCasesTable cases={displayCases} navigate={navigate} />
              <DocumentVault 
                documents={documents || []} 
                uploadDocument={uploadDocument}
                isUploading={isUploading}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ClientCalendar />
                <BillingPayments />
              </div>
            </div>
            
            {/* Right Column - Sidebar */}
            <div className="space-y-6">
              <NotificationsDrawer />
              <ClientProfileSettings user={user} />
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default ClientDashboard; 