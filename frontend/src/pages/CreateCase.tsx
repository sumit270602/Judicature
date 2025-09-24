import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ArrowLeft, 
  Briefcase, 
  User, 
  Star, 
  Award, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  Brain,
  Upload,
  File,
  X
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { createCase, getLawyerRecommendations, uploadCaseDocument } from '@/api';

// Types
interface LawyerRecommendation {
  lawyer: {
    _id: string;
    name: string;
    email: string;
    specializations?: string[];
    practiceAreas?: string[];
    experience?: number;
    verificationStatus: 'pending' | 'verified' | 'rejected';
  };
  similarity: number;
  specializations: string[];
  experience: number;
  rating: number;
  casesWon: number;
}

interface CaseFormData {
  title: string;
  description: string;
  caseType: string;
  priority: string;
  lawyer?: string;
}

const CreateCase: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  // Debug logging
  useEffect(() => {
    console.log('CreateCase component loaded');
    console.log('Current user:', user);
    console.log('Token in localStorage:', localStorage.getItem('token'));
  }, [user]);
  
  const [formData, setFormData] = useState<CaseFormData>({
    title: '',
    description: '',
    caseType: '',
    priority: 'medium',
    lawyer: undefined
  });
  
  const [recommendations, setRecommendations] = useState<LawyerRecommendation[]>([]);
  const [selectedLawyer, setSelectedLawyer] = useState<string | null>(null);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<CaseFormData>>({});
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);

  const caseTypes = [
    { value: 'civil', label: 'Civil Law' },
    { value: 'criminal', label: 'Criminal Law' },
    { value: 'family', label: 'Family Law' },
    { value: 'corporate', label: 'Corporate Law' },
    { value: 'other', label: 'Other' }
  ];

  const priorities = [
    { value: 'low', label: 'Low Priority' },
    { value: 'medium', label: 'Medium Priority' },
    { value: 'high', label: 'High Priority' }
  ];

  // Fetch lawyer recommendations when case type and description are available
  useEffect(() => {
    const fetchRecommendations = async () => {
      if (formData.caseType && formData.description.length > 20) {
        setIsLoadingRecommendations(true);
        try {
          const response = await getLawyerRecommendations({
            caseType: formData.caseType,
            caseDescription: formData.description,
            priority: formData.priority
          });
          
          if (response.data) {
            setRecommendations(response.data.lawyers || []);
          }
        } catch (error: any) {
          console.error('Error fetching recommendations:', error);
          console.error('Recommendations error response:', error.response?.data);
          // Don't show error toast for recommendations, just log it
        } finally {
          setIsLoadingRecommendations(false);
        }
      }
    };

    const timeoutId = setTimeout(fetchRecommendations, 500); // Debounce
    return () => clearTimeout(timeoutId);
  }, [formData.caseType, formData.description]);

  const handleInputChange = (field: keyof CaseFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<CaseFormData> = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Case title is required';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Case description is required';
    } else if (formData.description.length < 20) {
      newErrors.description = 'Description must be at least 20 characters';
    }
    
    if (!formData.caseType) {
      newErrors.caseType = 'Case type is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      const caseData = {
        ...formData,
        lawyer: selectedLawyer || undefined
      };

      const response = await createCase(caseData);

      if (response.data.success) {
        const createdCase = response.data.case;
        
        // Upload files if any are selected
        if (selectedFiles.length > 0) {
          await uploadCaseFiles(createdCase._id);
        }
        
        toast({
          title: "Case Created Successfully!",
          description: selectedLawyer 
            ? "Your case has been created and assigned to a lawyer." 
            : "Your case has been created. You can assign a lawyer later.",
        });
        navigate('/dashboard/client');
      } else {
        toast({
          title: "Error Creating Case",
          description: response.data.message || "Something went wrong. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Case creation error:', error);
      console.error('Error response:', error.response);
      console.error('Error data:', error.response?.data);
      
      let errorMessage = "Network error. Please check your connection and try again.";
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 401) {
        errorMessage = "Please log in to create a case.";
      } else if (error.response?.status === 403) {
        errorMessage = "You don't have permission to create cases.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Error Creating Case",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLawyerSelect = (lawyerId: string) => {
    setSelectedLawyer(selectedLawyer === lawyerId ? null : lawyerId);
  };

  // File handling functions
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB limit
      const isValidType = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg',
        'image/png',
        'image/gif'
      ].includes(file.type);
      
      if (!isValidSize) {
        toast({
          title: "File too large",
          description: `${file.name} exceeds 10MB limit`,
          variant: "destructive",
        });
        return false;
      }
      
      if (!isValidType) {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not a supported file type`,
          variant: "destructive",
        });
        return false;
      }
      
      return true;
    });

    setSelectedFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Upload files to backend after case creation
  const uploadCaseFiles = async (caseId: string) => {
    if (selectedFiles.length === 0) return;
    
    setIsUploadingFiles(true);
    
    try {
      for (const file of selectedFiles) {
        const formData = new FormData();
        formData.append('document', file);
        formData.append('caseId', caseId);

        const response = await uploadCaseDocument(formData);

        if (!response.data.success) {
          throw new Error(response.data.message || `Failed to upload ${file.name}`);
        }
      }
      
      toast({
        title: "Files Uploaded",
        description: `${selectedFiles.length} file(s) uploaded successfully`,
      });
    } catch (error: any) {
      console.error('File upload error:', error);
      const errorMessage = error.response?.data?.message || error.message || "Some files failed to upload";
      toast({
        title: "File Upload Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsUploadingFiles(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 pt-24 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/dashboard/client')}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
            
            <div className="flex items-center gap-3 mb-2">
              <Briefcase className="h-8 w-8 text-legal-navy" />
              <h1 className="text-3xl font-bold text-legal-navy">Create New Case</h1>
            </div>
            <p className="text-muted-foreground">
              Fill in the details below to create your new legal case. We'll recommend the best lawyers for your needs.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Case Form */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Case Information</CardTitle>
                  <CardDescription>
                    Provide detailed information about your legal matter
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <form onSubmit={handleSubmit}>
                    {/* Case Title */}
                    <div className="space-y-2">
                      <Label htmlFor="title">Case Title *</Label>
                      <Input
                        id="title"
                        placeholder="e.g., Property Dispute with Neighbor"
                        value={formData.title}
                        onChange={(e) => handleInputChange('title', e.target.value)}
                        className={errors.title ? 'border-red-500' : ''}
                      />
                      {errors.title && (
                        <p className="text-sm text-red-500">{errors.title}</p>
                      )}
                    </div>

                    {/* Case Type */}
                    <div className="space-y-2">
                      <Label htmlFor="caseType">Case Type *</Label>
                      <Select
                        value={formData.caseType}
                        onValueChange={(value) => handleInputChange('caseType', value)}
                      >
                        <SelectTrigger className={errors.caseType ? 'border-red-500' : ''}>
                          <SelectValue placeholder="Select case type" />
                        </SelectTrigger>
                        <SelectContent>
                          {caseTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.caseType && (
                        <p className="text-sm text-red-500">{errors.caseType}</p>
                      )}
                    </div>

                    {/* Priority */}
                    <div className="space-y-2">
                      <Label htmlFor="priority">Priority Level</Label>
                      <Select
                        value={formData.priority}
                        onValueChange={(value) => handleInputChange('priority', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {priorities.map((priority) => (
                            <SelectItem key={priority.value} value={priority.value}>
                              {priority.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Case Description */}
                    <div className="space-y-2">
                      <Label htmlFor="description">Case Description *</Label>
                      <Textarea
                        id="description"
                        placeholder="Describe your legal matter in detail. Include relevant facts, timeline, and what outcome you're seeking..."
                        rows={6}
                        value={formData.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        className={errors.description ? 'border-red-500' : ''}
                      />
                      <div className="flex justify-between items-center">
                        {errors.description ? (
                          <p className="text-sm text-red-500">{errors.description}</p>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            {formData.description.length}/500 characters
                          </p>
                        )}
                        {formData.description.length > 20 && formData.caseType && (
                          <div className="flex items-center gap-2 text-sm text-green-600">
                            <Brain className="h-4 w-4" />
                            AI recommendations enabled
                          </div>
                        )}
                      </div>
                    </div>

                    {/* File Upload Section */}
                    <div className="space-y-2">
                      <Label>Supporting Documents</Label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <input
                          type="file"
                          multiple
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
                          onChange={handleFileSelect}
                          className="hidden"
                          id="file-upload"
                        />
                        <label
                          htmlFor="file-upload"
                          className="cursor-pointer flex flex-col items-center gap-2"
                        >
                          <Upload className="h-8 w-8 text-gray-400" />
                          <p className="text-sm text-gray-600">
                            Click to upload files or drag and drop
                          </p>
                          <p className="text-xs text-gray-500">
                            PDF, DOC, DOCX, JPG, PNG, GIF up to 10MB each
                          </p>
                        </label>
                      </div>
                      
                      {/* Selected Files Display */}
                      {selectedFiles.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Selected Files:</p>
                          <div className="space-y-2">
                            {selectedFiles.map((file, index) => (
                              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded border">
                                <div className="flex items-center gap-2">
                                  <File className="h-4 w-4 text-gray-500" />
                                  <span className="text-sm truncate">{file.name}</span>
                                  <span className="text-xs text-gray-500">
                                    ({(file.size / 1024 / 1024).toFixed(1)}MB)
                                  </span>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeFile(index)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Submit Button */}
                    <div className="flex gap-4 pt-4">
                      <Button 
                        type="submit" 
                        disabled={isSubmitting || isUploadingFiles}
                        className="flex-1"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating Case...
                          </>
                        ) : isUploadingFiles ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Uploading Files...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Create Case
                            {selectedFiles.length > 0 && (
                              <span className="ml-1 text-xs">
                                (+{selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''})
                              </span>
                            )}
                          </>
                        )}
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={() => navigate('/dashboard/client')}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Lawyer Recommendations */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Recommended Lawyers
                  </CardTitle>
                  <CardDescription>
                    AI-powered lawyer recommendations based on your case. Only verified lawyers are shown.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {formData.caseType && formData.description.length > 20 ? (
                    <>
                      {isLoadingRecommendations ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin text-legal-navy" />
                          <span className="ml-2">Finding best lawyers...</span>
                        </div>
                      ) : recommendations.length > 0 ? (
                        <ScrollArea className="h-96">
                          <div className="space-y-4">
                            {recommendations.map((rec) => (
                              <div 
                                key={rec.lawyer._id}
                                className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                                  selectedLawyer === rec.lawyer._id 
                                    ? 'border-legal-navy bg-legal-navy/5' 
                                    : 'border-gray-200'
                                }`}
                                onClick={() => handleLawyerSelect(rec.lawyer._id)}
                              >
                                <div className="flex items-start gap-3">
                                  <Avatar className="h-10 w-10">
                                    <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${rec.lawyer.name}`} />
                                    <AvatarFallback>
                                      {rec.lawyer.name.split(' ').map(n => n[0]).join('')}
                                    </AvatarFallback>
                                  </Avatar>
                                  
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <h4 className="font-medium text-sm truncate">
                                        {rec.lawyer.name}
                                      </h4>
                                      {rec.lawyer.verificationStatus === 'verified' && (
                                        <Badge variant="secondary" className="text-xs">
                                          <CheckCircle className="h-3 w-3 mr-1" />
                                          Verified
                                        </Badge>
                                      )}
                                    </div>
                                    
                                    <div className="space-y-2">
                                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                        <div className="flex items-center gap-1">
                                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                          {rec.rating.toFixed(1)}
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <Award className="h-3 w-3" />
                                          {rec.casesWon} wins
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <Clock className="h-3 w-3" />
                                          {rec.experience}y exp
                                        </div>
                                      </div>
                                      
                                      <div className="flex flex-wrap gap-1">
                                        {rec.specializations.slice(0, 2).map((spec, idx) => (
                                          <Badge key={idx} variant="outline" className="text-xs">
                                            {spec}
                                          </Badge>
                                        ))}
                                      </div>
                                      
                                      <div className="text-xs text-legal-navy font-medium">
                                        {Math.round(rec.similarity * 100)}% match
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p className="text-sm">No verified lawyer recommendations found.</p>
                          <p className="text-xs">Only verified lawyers are shown. You can still create the case without assigning a lawyer.</p>
                        </div>
                      )}
                      
                      {selectedLawyer && (
                        <Alert className="mt-4">
                          <CheckCircle className="h-4 w-4" />
                          <AlertDescription>
                            You've selected a lawyer. They will be automatically assigned to your case.
                          </AlertDescription>
                        </Alert>
                      )}
                    </>
                  ) : (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Fill in the case type and description (min 20 characters) to see lawyer recommendations.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default CreateCase;