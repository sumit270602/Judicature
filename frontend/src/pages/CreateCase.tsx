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
  X,
  Phone,
  Mail
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { createCase, getLawyerRecommendations, uploadCaseDocument, getServiceCategories, getServicesByCategory, getServiceBasedLawyerRecommendations } from '@/api';

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
  // Service-specific fields for service-based recommendations
  services?: Array<{
    id: string;
    title: string;
    description: string;
    pricing: {
      type: 'fixed' | 'hourly' | 'range';
      amount?: number;
      minAmount?: number;
      maxAmount?: number;
      hourlyRate?: number;
    };
    estimatedDuration?: string;
    category: string;
    serviceType: string;
  }>;
}

interface CaseFormData {
  title: string;
  description: string;
  caseType: string;
  priority: string;
  lawyer?: string;
  // Service-based fields
  serviceCategory?: string;
  serviceType?: string;
  selectedService?: string;
  useServiceBased?: boolean;
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

  // Load service categories on component mount
  useEffect(() => {
    const loadServiceCategories = async () => {
      try {
        const response = await getServiceCategories();
        if (response.data?.categories) {
          setServiceCategories(response.data.categories);
        }
      } catch (error) {
        console.error('Error loading service categories:', error);
      }
    };

    loadServiceCategories();
  }, []);

  const [formData, setFormData] = useState<CaseFormData>({
    title: '',
    description: '',
    caseType: '',
    priority: 'medium',
    lawyer: undefined,
    serviceCategory: undefined,
    serviceType: undefined,
    selectedService: undefined,
    useServiceBased: true // Default to service-based case creation
  });
  
  const [recommendations, setRecommendations] = useState<LawyerRecommendation[]>([]);
  const [selectedLawyer, setSelectedLawyer] = useState<string | null>(null);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<CaseFormData & { serviceCategory?: string; serviceType?: string; }>>({});
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  
  // Service-based state
  const [serviceCategories, setServiceCategories] = useState<any>({});
  const [availableServices, setAvailableServices] = useState<any[]>([]);
  const [isLoadingServices, setIsLoadingServices] = useState(false);

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

  // Load services when category is selected
  useEffect(() => {
    const loadServices = async () => {
      if (formData.serviceCategory) {
        setIsLoadingServices(true);
        try {
          const response = await getServicesByCategory(formData.serviceCategory);
          if (response.data?.services) {
            setAvailableServices(response.data.services);
          }
        } catch (error) {
          console.error('Error loading services:', error);
          setAvailableServices([]);
        } finally {
          setIsLoadingServices(false);
        }
      } else {
        setAvailableServices([]);
      }
    };

    loadServices();
  }, [formData.serviceCategory]);

  // Fetch lawyer recommendations when case details are available
  useEffect(() => {
    const fetchRecommendations = async () => {
      if (formData.description.length > 20) {
        setIsLoadingRecommendations(true);
        try {
          let response;
          
          // Use service-based recommendations if service is selected
          if (formData.useServiceBased && (formData.serviceCategory || formData.serviceType || formData.selectedService)) {
            response = await getServiceBasedLawyerRecommendations({
              serviceId: formData.selectedService,
              serviceCategory: formData.serviceCategory,
              serviceType: formData.serviceType,
              caseDescription: formData.description,
              priority: formData.priority
            });
          } 
          // Fall back to traditional case type recommendations
          else if (formData.caseType) {
            response = await getLawyerRecommendations({
              caseType: formData.caseType,
              caseDescription: formData.description,
              priority: formData.priority
            });
          }
          // If service-based is enabled but no service selected yet, and no case type, show general recommendations
          else if (formData.useServiceBased && !formData.caseType) {
            // Auto-set a default case type to get some recommendations
            const defaultCaseType = 'other';
            response = await getLawyerRecommendations({
              caseType: defaultCaseType,
              caseDescription: formData.description,
              priority: formData.priority
            });
          }
          
          if (response?.data) {
            console.log('Recommendations response:', response.data);
            console.log('Lawyers found:', response.data.lawyers?.length || 0);
            setRecommendations(response.data.lawyers || []);
          } else {
            console.log('No response data received');
          }
        } catch (error: any) {
          console.error('Error fetching recommendations:', error);
          console.error('Recommendations error response:', error.response?.data);
          console.error('Request details:', {
            useServiceBased: formData.useServiceBased,
            serviceCategory: formData.serviceCategory,
            serviceType: formData.serviceType,
            caseType: formData.caseType,
            descriptionLength: formData.description.length
          });
          // Don't show error toast for recommendations, just log it
        } finally {
          setIsLoadingRecommendations(false);
        }
      }
    };

    const timeoutId = setTimeout(fetchRecommendations, 500); // Debounce
    return () => clearTimeout(timeoutId);
  }, [formData.caseType, formData.description, formData.serviceCategory, formData.serviceType, formData.selectedService, formData.useServiceBased, formData.priority]);

  const handleInputChange = (field: keyof CaseFormData, value: string | boolean) => {
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
    
    // Validate case type or service selection
    if (formData.useServiceBased) {
      if (!formData.serviceCategory) {
        newErrors.serviceCategory = 'Service category is required';
      }
      if (!formData.serviceType) {
        newErrors.serviceType = 'Specific service is required';
      }
    } else {
      if (!formData.caseType) {
        newErrors.caseType = 'Case type is required';
      }
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
        lawyer: selectedLawyer || undefined,
        // Include service data if using service-based creation
        ...(formData.useServiceBased && {
          selectedService: formData.selectedService,
          serviceCategory: formData.serviceCategory,
          serviceType: formData.serviceType
        })
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Case Form */}
            <div className="space-y-6">
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

                    {/* Service Selection Mode Toggle */}
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="useServiceBased"
                          checked={formData.useServiceBased}
                          onChange={(e) => handleInputChange('useServiceBased', e.target.checked)}
                        />
                        <Label htmlFor="useServiceBased" className="text-sm">
                          Use service-based case creation (Recommended)
                        </Label>
                      </div>
                      <p className="text-sm text-gray-600">
                        Service-based creation helps you find lawyers who specialize in your specific legal need with transparent pricing.
                      </p>
                    </div>

                    {/* Service Selection - Show when service-based is enabled */}
                    {formData.useServiceBased && (
                      <>
                        {/* Service Category */}
                        <div className="space-y-2">
                          <Label htmlFor="serviceCategory">Legal Service Category *</Label>
                          <Select
                            value={formData.serviceCategory || ''}
                            onValueChange={(value) => {
                              handleInputChange('serviceCategory', value);
                              // Reset dependent fields
                              handleInputChange('serviceType', '');
                              handleInputChange('selectedService', '');
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select service category" />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(serviceCategories).map(([key, category]: [string, any]) => (
                                <SelectItem key={key} value={key}>
                                  {category.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Service Type */}
                        {formData.serviceCategory && serviceCategories[formData.serviceCategory] && (
                          <div className="space-y-2">
                            <Label htmlFor="serviceType">Specific Service *</Label>
                            <Select
                              value={formData.serviceType || ''}
                              onValueChange={(value) => {
                                handleInputChange('serviceType', value);
                                // Auto-set case type based on service category
                                const categoryToCaseType: { [key: string]: string } = {
                                  'personal_family': 'family',
                                  'criminal_property': 'criminal',
                                  'civil_debt': 'civil',
                                  'corporate_law': 'corporate',
                                  'others': 'other'
                                };
                                handleInputChange('caseType', categoryToCaseType[formData.serviceCategory] || 'other');
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select specific service" />
                              </SelectTrigger>
                              <SelectContent>
                                {serviceCategories[formData.serviceCategory].services.map((service: any) => (
                                  <SelectItem key={service.type} value={service.type}>
                                    {service.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </>
                    )}

                    {/* Traditional Case Type - Show when service-based is disabled */}
                    {!formData.useServiceBased && (
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
                    )}

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
                  {((formData.caseType) || (formData.useServiceBased && (formData.serviceCategory || formData.serviceType))) && formData.description.length > 20 ? (
                    <>
                      {isLoadingRecommendations ? (
                        <div className="flex items-center justify-center py-12">
                          <div className="text-center">
                            <Loader2 className="h-8 w-8 animate-spin text-legal-navy mx-auto mb-3" />
                            <span className="text-legal-navy font-medium">Finding the best lawyers for you...</span>
                            <p className="text-sm text-muted-foreground mt-1">Analyzing profiles and expertise</p>
                          </div>
                        </div>
                      ) : recommendations.length > 0 ? (
                        <ScrollArea className="h-96">
                          <div className="space-y-6">
                            {recommendations.map((rec) => (
                              <div 
                                key={rec.lawyer._id}
                                className={`group relative border-2 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] ${
                                  selectedLawyer === rec.lawyer._id 
                                    ? 'border-legal-navy bg-gradient-to-br from-legal-navy/5 to-legal-navy/10 shadow-md' 
                                    : 'border-gray-200 hover:border-legal-navy/30 bg-white'
                                }`}
                                onClick={() => handleLawyerSelect(rec.lawyer._id)}
                              >
                                {/* Selection Indicator */}
                                {selectedLawyer === rec.lawyer._id && (
                                  <div className="absolute -top-2 -right-2 z-10">
                                    <div className="bg-legal-navy text-white rounded-full p-1">
                                      <CheckCircle className="h-4 w-4" />
                                    </div>
                                  </div>
                                )}

                                <div className="p-6">
                                  {/* Header Section */}
                                  <div className="flex items-start gap-4 mb-4">
                                    <Avatar className="h-16 w-16 ring-2 ring-gray-100 group-hover:ring-legal-navy/20 transition-all">
                                      <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${rec.lawyer.name}`} />
                                      <AvatarFallback className="text-lg font-semibold bg-gradient-to-br from-legal-navy to-legal-navy/80 text-white">
                                        {rec.lawyer.name.split(' ').map(n => n[0]).join('')}
                                      </AvatarFallback>
                                    </Avatar>
                                    
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-lg font-bold text-gray-900 truncate">
                                          {rec.lawyer.name}
                                        </h3>
                                        {rec.lawyer.verificationStatus === 'verified' && (
                                          <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100">
                                            <CheckCircle className="h-3 w-3 mr-1" />
                                            Verified
                                          </Badge>
                                        )}
                                      </div>
                                      
                                      {/* Statistics Row */}
                                      <div className="flex items-center gap-6 text-sm">
                                        <div className="flex items-center gap-1">
                                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                          <span className="font-semibold">{rec.rating.toFixed(1)}</span>
                                          <span className="text-muted-foreground">rating</span>
                                        </div>
                                        <div className="flex items-center gap-1 text-green-600">
                                          <Award className="h-4 w-4" />
                                          <span className="font-semibold">{rec.casesWon}</span>
                                          <span>wins</span>
                                        </div>
                                        <div className="flex items-center gap-1 text-blue-600">
                                          <Clock className="h-4 w-4" />
                                          <span className="font-semibold">{rec.experience}</span>
                                          <span>years exp</span>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Match Score */}
                                    <div className="text-center">
                                      <div className="bg-legal-navy text-white rounded-full px-3 py-1 text-sm font-bold">
                                        {Math.round(rec.similarity * 100)}%
                                      </div>
                                      <div className="text-xs text-muted-foreground mt-1">match</div>
                                    </div>
                                  </div>

                                  {/* Services/Pricing Section */}
                                  {rec.services && rec.services.length > 0 ? (
                                    <div className="border-t pt-4">
                                      <div className="flex items-center gap-2 mb-3">
                                        <div className="h-2 w-2 bg-legal-navy rounded-full"></div>
                                        <span className="text-sm font-semibold text-legal-navy">Available Services & Rates</span>
                                      </div>
                                      
                                      <div className="grid gap-3">
                                        {rec.services.slice(0, 2).map((service: any, idx: number) => (
                                          <div key={idx} className="bg-gradient-to-r from-gray-50 to-gray-100/50 p-4 rounded-lg border border-gray-200">
                                            <div className="flex justify-between items-start gap-3">
                                              <div className="flex-1">
                                                <h4 className="font-semibold text-gray-900 mb-1">{service.title}</h4>
                                                {service.estimatedDuration && (
                                                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    {service.estimatedDuration}
                                                  </p>
                                                )}
                                              </div>
                                              
                                              <div className="text-right">
                                                {service.pricing.type === 'fixed' && (
                                                  <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full">
                                                    <span className="text-lg font-bold">₹{service.pricing.amount?.toLocaleString()}</span>
                                                    <span className="text-sm ml-1">fixed</span>
                                                  </div>
                                                )}
                                                {service.pricing.type === 'hourly' && (
                                                  <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                                                    <span className="text-lg font-bold">₹{service.pricing.hourlyRate?.toLocaleString()}</span>
                                                    <span className="text-sm ml-1">/hour</span>
                                                  </div>
                                                )}
                                                {service.pricing.type === 'range' && (
                                                  <div className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-center">
                                                    <div className="text-sm font-bold">
                                                      ₹{service.pricing.minAmount?.toLocaleString()} - ₹{service.pricing.maxAmount?.toLocaleString()}
                                                    </div>
                                                    <div className="text-xs">range</div>
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                          </div>
                                        ))}
                                        
                                        {rec.services.length > 2 && (
                                          <div className="text-center text-sm text-muted-foreground bg-gray-50 py-2 rounded-lg border border-dashed border-gray-300">
                                            <span className="font-medium">+{rec.services.length - 2} more services available</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="border-t pt-4">
                                      {/* Specializations with Enhanced Display */}
                                      <div className="flex items-center gap-2 mb-3">
                                        <div className="h-2 w-2 bg-legal-navy rounded-full"></div>
                                        <span className="text-sm font-semibold text-legal-navy">Legal Expertise</span>
                                      </div>
                                      <div className="grid gap-3 mb-4">
                                        <div className="bg-gradient-to-r from-blue-50 to-blue-100/50 p-4 rounded-lg border border-blue-200">
                                          <div className="flex justify-between items-start gap-3">
                                            <div className="flex-1">
                                              <h4 className="font-semibold text-gray-900 mb-2">General Legal Consultation</h4>
                                              <div className="flex flex-wrap gap-2 mb-2">
                                                {rec.specializations.slice(0, 4).map((spec, idx) => (
                                                  <Badge key={idx} variant="outline" className="text-xs px-2 py-1 bg-white/70 border-blue-300 text-blue-800">
                                                    {spec}
                                                  </Badge>
                                                ))}
                                                {rec.specializations.length > 4 && (
                                                  <Badge variant="outline" className="text-xs px-2 py-1 bg-white/70 border-blue-300 text-blue-800">
                                                    +{rec.specializations.length - 4} more areas
                                                  </Badge>
                                                )}
                                              </div>
                                              <p className="text-sm text-muted-foreground flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                Initial consultation: 30-60 minutes
                                              </p>
                                            </div>
                                            
                                            <div className="text-right">
                                              <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                                                <span className="text-lg font-bold">₹{(2000 + rec.experience * 100).toLocaleString()}</span>
                                                <span className="text-sm ml-1">/hour</span>
                                              </div>
                                              <div className="text-xs text-muted-foreground mt-1">Base rate</div>
                                            </div>
                                          </div>
                                        </div>
                                        
                                        {/* Additional service estimation */}
                                        <div className="bg-gradient-to-r from-green-50 to-green-100/50 p-3 rounded-lg border border-green-200">
                                          <div className="flex justify-between items-center">
                                            <div className="flex-1">
                                              <h5 className="font-medium text-gray-900 text-sm">Case Handling & Representation</h5>
                                              <p className="text-xs text-muted-foreground">Full case management and court representation</p>
                                            </div>
                                            <div className="text-right">
                                              <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm">
                                                <span className="font-bold">₹{(15000 + rec.experience * 500).toLocaleString()}</span>
                                                <span className="text-xs ml-1">+ fees</span>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                      
                                      {/* Contact Info */}
                                      <div className="bg-gray-50 p-3 rounded-lg">
                                        <div className="flex items-center justify-between text-sm">
                                          <span className="text-muted-foreground">Contact for detailed quote</span>
                                          <div className="flex items-center gap-2 text-legal-navy">
                                            <Phone className="h-3 w-3" />
                                            <Mail className="h-3 w-3" />
                                            <span className="font-medium">Available</span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {/* Hover Effect Overlay */}
                                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-legal-navy/0 to-legal-navy/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
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
                        {formData.useServiceBased 
                          ? "Select a service category and add a description (min 20 characters) to see lawyer recommendations."
                          : "Fill in the case type and description (min 20 characters) to see lawyer recommendations."
                        }
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