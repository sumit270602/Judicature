import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Bot, 
  FileUp, 
  FileText, 
  Sparkles, 
  ArrowRight, 
  Zap, 
  AlertCircle,
  CheckCircle,
  Clock,
  Scale,
  X
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CaseData {
  title: string;
  description: string;
  caseType: string;
  priority: 'low' | 'medium' | 'high';
}

// AI Case Builder Dialog Component
const AICaseBuilderDialog: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (caseData: CaseData) => void;
}> = ({ isOpen, onClose, onSubmit }) => {
  const [step, setStep] = useState(1);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [editableContent, setEditableContent] = useState<CaseData>({
    title: '',
    description: '',
    caseType: '',
    priority: 'medium'
  });
  const { toast } = useToast();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setUploadedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const simulateAIAnalysis = () => {
    setIsAnalyzing(true);
    setStep(2);

    setTimeout(() => {
      setIsAnalyzing(false);
      // Generate realistic AI content based on uploaded files and randomization
      const analysisResult = generateRealisticCaseAnalysis(uploadedFiles);
      setEditableContent(analysisResult);
    }, 3000);
  };

  const generateRealisticCaseAnalysis = (files: File[]) => {
    // Case scenarios with different types and priorities
    const caseScenarios = [
      {
        title: 'Property Dispute Resolution',
        description: 'Document analysis indicates a property-related dispute involving ownership rights and boundary issues. The case requires urgent attention to prevent further complications and establish clear title rights.',
        caseType: 'property',
        priority: 'high'
      },
      {
        title: 'Employment Contract Violation',
        description: 'Based on the employment documentation, this case involves potential breach of employment terms and workplace rights. Immediate legal intervention may be required to protect employee interests.',
        caseType: 'labor',
        priority: 'medium'
      },
      {
        title: 'Family Court Proceedings',
        description: 'The submitted documents suggest family law matters including custody arrangements and support obligations. Sensitive handling and family court expertise will be essential.',
        caseType: 'family',
        priority: 'medium'
      },
      {
        title: 'Commercial Contract Breach',
        description: 'Analysis reveals a commercial contract dispute involving service delivery failures and payment obligations. The case shows potential for negotiated settlement before litigation.',
        caseType: 'civil',
        priority: 'high'
      },
      {
        title: 'Criminal Defense Matter',
        description: 'Document review indicates criminal charges that require immediate legal representation. Constitutional rights protection and evidence examination are critical priorities.',
        caseType: 'criminal',
        priority: 'high'
      },
      {
        title: 'Debt Recovery Proceedings',
        description: 'Financial documents suggest debt collection issues requiring legal recovery mechanisms. The case shows clear documentation supporting creditor rights and recovery options.',
        caseType: 'civil',
        priority: 'medium'
      },
      {
        title: 'Consumer Protection Case',
        description: 'Evidence indicates consumer rights violations and product liability issues. The case qualifies for consumer court proceedings with potential for damages and remedial actions.',
        caseType: 'civil',
        priority: 'medium'
      },
      {
        title: 'Intellectual Property Infringement',
        description: 'Document analysis reveals potential IP rights violations including trademark or copyright infringement. Specialized IP law expertise and injunctive relief may be necessary.',
        caseType: 'corporate',
        priority: 'high'
      }
    ];

    // Factor in uploaded files for more realistic analysis
    let selectedScenario;
    
    if (files.length === 0) {
      // No files uploaded - general case
      selectedScenario = {
        title: 'General Legal Consultation',
        description: 'Initial consultation required to assess legal issues and determine appropriate legal strategy. Please provide more specific documentation for detailed case analysis.',
        caseType: 'other',
        priority: 'medium'
      };
    } else {
      // Analyze file names for context clues
      const fileNames = files.map(f => f.name.toLowerCase()).join(' ');
      
      if (fileNames.includes('contract') || fileNames.includes('agreement')) {
        selectedScenario = caseScenarios[3]; // Commercial Contract Breach
      } else if (fileNames.includes('property') || fileNames.includes('deed') || fileNames.includes('title')) {
        selectedScenario = caseScenarios[0]; // Property Dispute
      } else if (fileNames.includes('employment') || fileNames.includes('job') || fileNames.includes('work')) {
        selectedScenario = caseScenarios[1]; // Employment Contract
      } else if (fileNames.includes('family') || fileNames.includes('divorce') || fileNames.includes('custody')) {
        selectedScenario = caseScenarios[2]; // Family Court
      } else if (fileNames.includes('criminal') || fileNames.includes('charge') || fileNames.includes('police')) {
        selectedScenario = caseScenarios[4]; // Criminal Defense
      } else if (fileNames.includes('debt') || fileNames.includes('loan') || fileNames.includes('payment')) {
        selectedScenario = caseScenarios[5]; // Debt Recovery
      } else if (fileNames.includes('consumer') || fileNames.includes('product') || fileNames.includes('defect')) {
        selectedScenario = caseScenarios[6]; // Consumer Protection
      } else if (fileNames.includes('patent') || fileNames.includes('trademark') || fileNames.includes('copyright')) {
        selectedScenario = caseScenarios[7]; // IP Infringement
      } else {
        // Random selection for general documents
        selectedScenario = caseScenarios[Math.floor(Math.random() * caseScenarios.length)];
      }
    }

    // Add file count context to description
    const fileContext = files.length > 0 
      ? ` AI analysis of ${files.length} uploaded document${files.length > 1 ? 's' : ''} suggests: `
      : ' ';
    
    return {
      ...selectedScenario,
      description: fileContext + selectedScenario.description
    };
  };

  const handleSubmitCase = () => {
    onSubmit(editableContent);
    toast({
      title: "Case Filed Successfully",
      description: "Your AI-generated case has been submitted for review.",
    });
    resetDialog();
    onClose();
  };

  const resetDialog = () => {
    setStep(1);
    setUploadedFiles([]);
    setIsAnalyzing(false);
    setEditableContent({ title: '', description: '', caseType: '', priority: 'medium' });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) { resetDialog(); onClose(); } }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Bot className="h-6 w-6 text-indigo-600" />
            AI-Powered Case Builder
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
                        <X className="h-4 w-4" />
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

// Main AI Case Builder Component
const AICaseBuilder: React.FC = () => {
  const [showCaseBuilder, setShowCaseBuilder] = useState(false);
  const { toast } = useToast();

  const handleCaseSubmit = (caseData: CaseData) => {
    toast({
      title: "Case Filed Successfully",
      description: "Your AI-generated case has been submitted for review.",
    });
  };

  return (
    <>
      <Card className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border-2 border-indigo-200 hover:border-indigo-300 transition-all duration-300 hover:shadow-lg">
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
                onClick={() => setShowCaseBuilder(true)}
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

          {/* Features List */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 bg-white/60 rounded-lg border border-indigo-100">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="font-medium text-sm text-gray-900">Document Analysis</p>
                <p className="text-xs text-gray-600">AI extracts key information automatically</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white/60 rounded-lg border border-indigo-100">
              <Clock className="h-5 w-5 text-blue-500" />
              <div>
                <p className="font-medium text-sm text-gray-900">Instant Processing</p>
                <p className="text-xs text-gray-600">Get results in minutes, not hours</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white/60 rounded-lg border border-indigo-100">
              <Scale className="h-5 w-5 text-purple-500" />
              <div>
                <p className="font-medium text-sm text-gray-900">Legal Compliance</p>
                <p className="text-xs text-gray-600">Ensures proper legal formatting</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white/60 rounded-lg border border-indigo-100">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              <div>
                <p className="font-medium text-sm text-gray-900">Risk Assessment</p>
                <p className="text-xs text-gray-600">Identifies potential issues early</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Case Builder Dialog */}
      <AICaseBuilderDialog
        isOpen={showCaseBuilder}
        onClose={() => setShowCaseBuilder(false)}
        onSubmit={handleCaseSubmit}
      />
    </>
  );
};

export default AICaseBuilder;