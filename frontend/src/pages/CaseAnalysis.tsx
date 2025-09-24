
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { FileText, Upload, Brain, Download, ArrowRight, CheckCircle, Clock, Zap } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const CaseAnalysis = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [analysisResult, setAnalysisResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const features = [
    {
      icon: Brain,
      title: 'AI-Powered Analysis',
      description: 'Advanced machine learning algorithms analyze your legal documents with 95% accuracy'
    },
    {
      icon: Clock,
      title: 'Instant Results',
      description: 'Get comprehensive case analysis in minutes, not hours or days'
    },
    {
      icon: CheckCircle,
      title: 'Legal Accuracy',
      description: 'Built by legal experts with verified precedents and case law database'
    },
    {
      icon: Zap,
      title: 'Smart Recommendations',
      description: 'Receive actionable insights and strategic recommendations for your case'
    }
  ];

  const handleTryNow = () => {
    if (user) {
      // User is logged in, redirect to dashboard with feature context
      localStorage.setItem('redirectFeature', 'case-analysis');
      if (user.role === 'client') {
        navigate('/dashboard/client');
      } else if (user.role === 'lawyer') {
        navigate('/dashboard/lawyer');
      }
    } else {
      // User not logged in, go to registration with feature context
      navigate('/register?feature=case-analysis');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
    }
  };

  const handleAnalyze = async () => {
    if (!uploadedFile) return;
    
    setLoading(true);
    // Simulate AI analysis
    setTimeout(() => {
      setAnalysisResult(`
AI Analysis Summary:

Case Type: Contract Dispute
Strength: Medium-High (7/10)
Key Issues Identified:
• Breach of contract terms in section 4.2
• Unclear termination clauses
• Potential for damages claim

Recommended Actions:
1. Gather additional documentation
2. Review termination notice requirements
3. Consider mediation before litigation

Legal Precedents Found: 3 relevant cases
Estimated Timeline: 6-12 months
      `);
      setLoading(false);
    }, 2000);
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
