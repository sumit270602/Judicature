
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { FileText, Upload, Brain, Download } from 'lucide-react';

const CaseAnalysis = () => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [analysisResult, setAnalysisResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

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
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Badge className="mb-4 bg-legal-navy text-white">
            🤖 AI-Powered Analysis
          </Badge>
          <h1 className="text-4xl font-playfair font-bold text-gray-900 mb-4">
            AI Case Analysis
          </h1>
          <p className="text-xl text-gray-600">
            Upload your legal documents and get intelligent analysis powered by advanced AI technology.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Upload className="h-5 w-5 mr-2" />
                Document Upload
              </CardTitle>
              <CardDescription>
                Upload legal documents for AI analysis (PDF, DOCX supported)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="file-upload">Select Document</Label>
                <Input
                  id="file-upload"
                  type="file"
                  accept=".pdf,.docx,.doc"
                  onChange={handleFileUpload}
                />
              </div>
              
              {uploadedFile && (
                <div className="flex items-center space-x-2 p-3 bg-green-50 rounded-lg">
                  <FileText className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-800">{uploadedFile.name}</span>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="case-description">Case Description (Optional)</Label>
                <Textarea
                  id="case-description"
                  placeholder="Provide additional context about your case..."
                  rows={3}
                />
              </div>

              <Button 
                onClick={handleAnalyze}
                disabled={!uploadedFile || loading}
                className="w-full bg-legal-navy hover:bg-legal-navy/90"
              >
                {loading ? (
                  <>
                    <Brain className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Brain className="h-4 w-4 mr-2" />
                    Analyze Document
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Results Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Analysis Results
              </CardTitle>
              <CardDescription>
                AI-generated insights and recommendations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analysisResult ? (
                <div className="space-y-4">
                  <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded-lg">
                    {analysisResult}
                  </pre>
                  <Button variant="outline" className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Download Report
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Upload a document and click "Analyze" to see AI-powered insights here.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Features Section */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">AI Analysis Features</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6 text-center">
                <Brain className="h-12 w-12 text-legal-navy mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Smart Summarization</h3>
                <p className="text-sm text-gray-600">
                  Get concise summaries of complex legal documents
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <FileText className="h-12 w-12 text-legal-navy mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Key Issue Detection</h3>
                <p className="text-sm text-gray-600">
                  Identify critical legal issues and potential risks
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <Download className="h-12 w-12 text-legal-navy mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Actionable Insights</h3>
                <p className="text-sm text-gray-600">
                  Receive specific recommendations and next steps
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CaseAnalysis;
