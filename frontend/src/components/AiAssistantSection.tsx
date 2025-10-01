import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bot, 
  Send, 
  FileUp, 
  FileText, 
  Sparkles, 
  ArrowRight, 
  Zap, 
  Plus,
  MessageCircle,
  Brain,
  Scale,
  AlertCircle,
  CheckCircle,
  Clock,
  X
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

interface CaseData {
  title: string;
  description: string;
  caseType: string;
  priority: 'low' | 'medium' | 'high';
}

// AI Legal Assistant Chat Component
const AIAssistantChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hello! I'm your AI Legal Assistant. I can help answer questions about your cases, explain legal terms, and provide guidance on legal processes. How can I assist you today?",
      sender: 'ai',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const commonQuestions = [
    "What should I expect at my court hearing?",
    "How do I prepare for my case?",
    "What documents do I need?",
    "Explain legal terms in my case",
    "What are my rights in this situation?"
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: messages.length + 1,
      text: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Simulate AI response with more realistic delays and responses
    setTimeout(() => {
      const responses = [
        "I understand your question. While I can provide general legal information, please remember that this doesn't constitute legal advice. For your specific situation, I recommend discussing this with your assigned lawyer. Would you like me to help you prepare questions to ask them?",
        "That's a great question. Based on general legal principles, here's what you should know... However, every case is unique, so it's important to consult with your legal counsel for advice specific to your situation.",
        "I can help explain that concept. Let me break it down for you in simple terms... Remember, this is general information and shouldn't replace professional legal advice from your attorney.",
        "For preparation, I recommend gathering these documents and information... Your lawyer will provide more specific guidance based on your case details."
      ];
      
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      
      const aiResponse: Message = {
        id: messages.length + 2,
        text: randomResponse,
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
    <div className="flex flex-col h-[600px]">
      {/* Chat Header */}
      <div className="flex items-center gap-2 p-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="p-2 bg-blue-500 rounded-lg">
          <Bot className="h-5 w-5 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">AI Legal Assistant</h3>
          <p className="text-xs text-gray-600">Your 24/7 legal guidance companion</p>
        </div>
        <Badge className="ml-auto bg-green-100 text-green-700">Online</Badge>
      </div>

      {/* Chat Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-lg ${
                  message.sender === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-900 border'
                }`}
              >
                <p className="text-sm leading-relaxed">{message.text}</p>
                <p className="text-xs opacity-70 mt-1">
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-gray-100 p-3 rounded-lg border">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Common Questions */}
      <div className="p-4 border-t bg-gray-50">
        <p className="text-sm font-medium mb-2 text-gray-700">Quick Questions:</p>
        <div className="flex flex-wrap gap-2">
          {commonQuestions.map((question, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              onClick={() => handleQuestionClick(question)}
              className="text-xs hover:bg-blue-50 hover:border-blue-300"
            >
              {question}
            </Button>
          ))}
        </div>
      </div>

      {/* Message Input */}
      <div className="flex gap-2 p-4 border-t">
        <Input
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Ask me anything about your legal matters..."
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          className="flex-1"
        />
        <Button 
          onClick={handleSendMessage} 
          disabled={!inputMessage.trim() || isTyping}
          className="bg-blue-500 hover:bg-blue-600"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

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
      // Simulate AI-generated content
      setEditableContent({
        title: 'Contract Dispute Resolution',
        description: 'Based on the uploaded documents, this appears to be a commercial contract dispute involving breach of service agreement terms. The case involves monetary damages and requires immediate legal attention to preserve rights and remedies.',
        caseType: 'civil',
        priority: 'high'
      });
    }, 3000);
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

// Main AI Assistant Section Component
const AiAssistantSection: React.FC = () => {

  return (
    <div className="space-y-6">
      {/* AI Assistant Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">AI Legal Assistant</h2>
          <p className="text-gray-600">Get instant legal guidance and build cases with AI</p>
        </div>
        <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
          <Brain className="w-3 h-3 mr-1" />
          AI Powered
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-blue-500" />
            AI Legal Assistant
          </CardTitle>
          <CardDescription>
            Get instant answers to your legal questions and guidance on your cases
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AIAssistantChat />
        </CardContent>
      </Card>
    </div>
  );
};

export default AiAssistantSection;