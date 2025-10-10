import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { FileText, Upload, Brain, Download, ArrowRight, CheckCircle, Clock, Zap } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const CaseAnalysis = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedCaseType, setSelectedCaseType] = useState('');
  const [caseDescription, setCaseDescription] = useState('');

  const features = [
    {
      icon: Brain,
      title: 'Document Intelligence',
      description: 'Extract key information, entities, and legal concepts automatically from your documents'
    },
    {
      icon: Clock,
      title: 'Real-time Processing',
      description: 'Watch as AI analyzes your documents in real-time with live progress indicators'
    },
    {
      icon: CheckCircle,
      title: 'Legal Precedent Matching',
      description: 'Connect your case with relevant precedents and similar cases from our database'
    },
    {
      icon: Zap,
      title: 'Strategic Insights',
      description: 'Get actionable recommendations, risk assessments, and next steps for your case'
    }
  ];

  const caseTypes = [
    { value: 'civil', label: 'Civil Law' },
    { value: 'criminal', label: 'Criminal Law' },
    { value: 'family', label: 'Family Law' },
    { value: 'corporate', label: 'Corporate Law' },
    { value: 'property', label: 'Property Law' },
    { value: 'labor', label: 'Labor Law' }
  ];

  const mockAnalysisResults = {
    summary: 'This appears to be a commercial contract dispute involving breach of service agreement terms. The analysis indicates potential for damages claim with moderate to high success probability.',
    keyFindings: [
      'Breach of Section 4.2 - Service Level Agreement terms',
      'Insufficient notice period for contract termination',
      'Material adverse impact on business operations documented',
      'Multiple instances of non-performance identified'
    ],
    riskAssessment: {
      overall: 'Medium-High',
      litigation: '75%',
      settlement: '85%',
      damages: '$45,000 - $125,000'
    },
    recommendations: [
      'Gather additional performance documentation',
      'Review termination clause requirements (Section 7.3)',
      'Consider demand letter before formal litigation',
      'Evaluate mediation as cost-effective alternative'
    ],
    precedents: [
      { case: 'Smith v. ABC Corp (2022)', relevance: '92%' },
      { case: 'Johnson Industries v. XYZ Ltd (2021)', relevance: '87%' },
      { case: 'Tech Solutions v. Global Services (2020)', relevance: '81%' }
    ],
    timeline: '6-12 months',
    confidenceScore: 87
  };

  const handleTryNow = () => {
    if (user) {
      setCurrentStep(2); // Move to upload step
    } else {
      navigate('/login?feature=case-analysis');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setUploadedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleStartAnalysis = async () => {
    if (uploadedFiles.length === 0 || !selectedCaseType) return;
    
    setLoading(true);
    setCurrentStep(3);
    
    // Simulate progressive AI analysis
    setTimeout(() => {
      setAnalysisResult(mockAnalysisResults);
      setLoading(false);
      setCurrentStep(4);
    }, 4000);
  };

  const handleCreateCase = () => {
    // Navigate to case creation with pre-filled data
    navigate('/create-case', { 
      state: { 
        aiAnalysis: analysisResult,
        caseType: selectedCaseType,
        description: caseDescription,
        documents: uploadedFiles 
      } 
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-legal-navy to-blue-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-4 bg-legal-gold text-black">
                🤖 AI-Powered
              </Badge>
              <h1 className="text-5xl font-playfair font-bold mb-6">
                AI Case Analysis
              </h1>
              <p className="text-xl text-blue-100 mb-8 leading-relaxed">
                Transform your legal workflow with intelligent document analysis. 
                Get comprehensive case insights, risk assessments, and strategic 
                recommendations in minutes, not hours.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Button 
                  size="lg" 
                  className="bg-legal-gold text-black hover:bg-legal-gold/90"
                  onClick={handleTryNow}
                >
                  {user ? 'Analyze Your Case Now' : 'Start Free Trial'}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-legal-navy">
                  Watch Demo
                </Button>
              </div>
              <div className="flex items-center gap-6 text-sm text-blue-200">
                <span>✓ No credit card required</span>
                <span>✓ 5-minute setup</span>
                <span>✓ 95% accuracy rate</span>
              </div>
            </div>
            <div className="relative">
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardContent className="p-8">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-legal-gold rounded-full flex items-center justify-center">
                        <Brain className="h-5 w-5 text-black" />
                      </div>
                      <div>
                        <h4 className="font-semibold">AI Analysis Complete</h4>
                        <p className="text-sm text-blue-200">Contract review finished in 2.3 minutes</p>
                      </div>
                    </div>
                    <div className="bg-white/10 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm">Case Strength</span>
                        <span className="text-green-400 font-semibold">Strong (8/10)</span>
                      </div>
                      <div className="w-full bg-white/20 rounded-full h-2">
                        <div className="bg-green-400 h-2 rounded-full w-4/5"></div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="bg-white/10 rounded p-3">
                        <div className="text-legal-gold font-semibold">12</div>
                        <div className="text-blue-200">Issues Found</div>
                      </div>
                      <div className="bg-white/10 rounded p-3">
                        <div className="text-legal-gold font-semibold">6-8</div>
                        <div className="text-blue-200">Months Est.</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-playfair font-bold text-gray-900 mb-4">
              Why Legal Professionals Choose Our AI Analysis
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Powered by advanced machine learning and trained on millions of legal documents
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="mx-auto w-16 h-16 bg-legal-navy rounded-full flex items-center justify-center mb-4">
                    <feature.icon className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-playfair font-bold text-gray-900 mb-4">
              How AI Case Analysis Works
            </h2>
            <p className="text-xl text-gray-600">
              Simple 3-step process to get professional case insights
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Upload className="h-10 w-10 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4">1. Upload Documents</h3>
              <p className="text-gray-600">
                Securely upload your legal documents, contracts, or case files. 
                Supports PDF, Word, and other common formats.
              </p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Brain className="h-10 w-10 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4">2. AI Analysis</h3>
              <p className="text-gray-600">
                Our AI analyzes your documents using legal precedents, 
                case law, and advanced natural language processing.
              </p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Download className="h-10 w-10 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4">3. Get Insights</h3>
              <p className="text-gray-600">
                Receive comprehensive analysis with risk assessment, 
                recommendations, and strategic insights for your case.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive AI Analysis Workflow */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-playfair font-bold mb-4">Experience AI Case Analysis Live</h2>
            <p className="text-xl text-gray-600">See how our AI analyzes legal documents in real-time</p>
          </div>

          {/* Step Indicator */}
          <div className="flex justify-center mb-8">
            <div className="flex items-center space-x-4">
              {[1, 2, 3, 4].map((step) => (
                <div key={step} className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep >= step 
                      ? 'bg-legal-navy text-white' 
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {step}
                  </div>
                  {step < 4 && (
                    <div className={`w-12 h-0.5 mx-2 ${
                      currentStep > step ? 'bg-legal-navy' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Left Side - Interactive Demo */}
            <Card className="p-8 shadow-xl">
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="text-center">
                    <FileText className="h-16 w-16 text-legal-navy mx-auto mb-4" />
                    <h3 className="text-2xl font-bold mb-2">Start Your Analysis</h3>
                    <p className="text-gray-600">
                      {user ? "Upload your legal documents to begin AI analysis" : "Sign in to try our AI case analysis tool"}
                    </p>
                  </div>
                  <Button 
                    onClick={handleTryNow}
                    className="w-full bg-legal-navy hover:bg-legal-navy/90 py-3"
                  >
                    {user ? 'Start Analysis' : 'Sign In to Try'}
                  </Button>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-6">
                  <h3 className="text-xl font-bold">Upload Documents & Case Details</h3>
                  
                  <div>
                    <Label>Case Type</Label>
                    <select 
                      className="w-full mt-2 p-3 border rounded-lg"
                      value={selectedCaseType}
                      onChange={(e) => setSelectedCaseType(e.target.value)}
                    >
                      <option value="">Select case type...</option>
                      {caseTypes.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label>Case Description</Label>
                    <Textarea 
                      placeholder="Briefly describe your case..."
                      value={caseDescription}
                      onChange={(e) => setCaseDescription(e.target.value)}
                      className="mt-2"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label>Upload Documents</Label>
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx,.txt"
                      onChange={handleFileUpload}
                      className="w-full mt-2 p-3 border rounded-lg"
                    />
                  </div>

                  {uploadedFiles.length > 0 && (
                    <div className="space-y-2">
                      <p className="font-medium">Uploaded Files:</p>
                      {uploadedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span className="text-sm">{file.name}</span>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => removeFile(index)}
                          >
                            ×
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  <Button 
                    onClick={handleStartAnalysis}
                    disabled={uploadedFiles.length === 0 || !selectedCaseType}
                    className="w-full bg-legal-navy hover:bg-legal-navy/90"
                  >
                    Start AI Analysis
                  </Button>
                </div>
              )}

              {currentStep === 3 && loading && (
                <div className="text-center py-12 space-y-4">
                  <div className="relative">
                    <div className="w-20 h-20 mx-auto bg-gradient-to-br from-legal-navy to-blue-600 rounded-full flex items-center justify-center">
                      <Brain className="h-10 w-10 text-white animate-pulse" />
                    </div>
                    <div className="absolute inset-0 w-20 h-20 mx-auto border-4 border-legal-navy border-t-transparent rounded-full animate-spin"></div>
                  </div>
                  <h3 className="text-xl font-bold">AI Analysis in Progress</h3>
                  <div className="space-y-2">
                    <p className="text-gray-600">🔍 Extracting document content...</p>
                    <p className="text-gray-600">🧠 Analyzing legal concepts...</p>
                    <p className="text-gray-600">⚖️ Matching legal precedents...</p>
                    <p className="text-gray-600">📊 Generating insights...</p>
                  </div>
                </div>
              )}

              {currentStep === 4 && analysisResult && (
                <div className="space-y-6">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <h4 className="font-semibold text-green-900">Analysis Complete!</h4>
                    </div>
                    <p className="text-green-700 text-sm">
                      Confidence Score: {analysisResult.confidenceScore}% | Processing Time: 3.2 seconds
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Executive Summary</h4>
                      <p className="text-gray-700 text-sm bg-gray-50 p-3 rounded">
                        {analysisResult.summary}
                      </p>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Risk Assessment</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="bg-blue-50 p-2 rounded">
                          <span className="font-medium">Success Rate:</span> {analysisResult.riskAssessment.litigation}
                        </div>
                        <div className="bg-green-50 p-2 rounded">
                          <span className="font-medium">Settlement:</span> {analysisResult.riskAssessment.settlement}
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Key Findings</h4>
                      <ul className="text-sm space-y-1">
                        {analysisResult.keyFindings.slice(0, 2).map((finding: string, index: number) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-legal-navy">•</span>
                            <span>{finding}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <Button 
                    onClick={handleCreateCase}
                    className="w-full bg-legal-navy hover:bg-legal-navy/90"
                  >
                    Create Case from Analysis
                  </Button>
                </div>
              )}
            </Card>

            {/* Right Side - Benefits & Features */}
            <div className="space-y-8">
              <div>
                <h3 className="text-2xl font-bold mb-6">Real Judicature AI Features</h3>
                <div className="grid gap-4">
                  {features.map((feature, index) => (
                    <Card key={index} className="p-4 border-l-4 border-l-legal-navy">
                      <div className="flex items-start gap-3">
                        <feature.icon className="h-6 w-6 text-legal-navy flex-shrink-0 mt-1" />
                        <div>
                          <h4 className="font-semibold mb-1">{feature.title}</h4>
                          <p className="text-gray-600 text-sm">{feature.description}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              <div className="bg-legal-navy text-white p-6 rounded-xl">
                <h4 className="font-bold text-lg mb-3">What makes our AI special?</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Trained on 500,000+ legal documents
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    87% accuracy in precedent matching
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Real-time processing and analysis
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Integrated with case management
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-playfair font-bold text-gray-900 mb-6">
            Ready to Analyze Your Case?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Join thousands of legal professionals using AI to make better case decisions
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-legal-navy hover:bg-legal-navy/90"
              onClick={handleTryNow}
            >
              {user ? 'Go to Dashboard' : 'Start Your Free Trial'}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            {!user && (
              <Button variant="outline" size="lg" onClick={() => navigate('/contact')}>
                Contact Sales
              </Button>
            )}
          </div>
          {!user && (
            <p className="text-sm text-gray-500 mt-4">
              Free trial includes 3 document analyses • No credit card required
            </p>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default CaseAnalysis;
