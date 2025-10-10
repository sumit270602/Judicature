import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  Mail,
  Shield,
  Settings,
  Sparkles,
  FileText
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
  const [searchParams] = useSearchParams();

  // Debug logging
  useEffect(() => {
    // CreateCase component initialized
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

  const [formData, setFormData] = useState<CaseFormData>(() => {
    // Initialize with URL parameters if available
    const category = searchParams.get('category');
    const service = searchParams.get('service');
    
    return {
      title: '',
      description: '',
      caseType: '',
      priority: 'medium',
      lawyer: undefined,
      serviceCategory: category || undefined,
      serviceType: service || undefined,
      selectedService: undefined,
      useServiceBased: true // Default to service-based case creation
    };
  });

  // Show toast for pre-selected service
  useEffect(() => {
    const category = searchParams.get('category');
    const service = searchParams.get('service');
    
    if (category && service) {
      toast({
        title: "Service Pre-selected",
        description: `You've selected ${service.replace(/_/g, ' ')} from ${category.replace(/_/g, ' ')} category.`,
      });
    }
  }, [searchParams, toast]);
  
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
        // Fetching lawyer recommendations based on case details
        
        try {
          let response;
          
          // Use service-based recommendations if service is selected
          if (formData.useServiceBased && (formData.serviceCategory || formData.serviceType || formData.selectedService)) {
            // Making service-based recommendation call
            const requestData = {
              serviceId: formData.selectedService,
              serviceCategory: formData.serviceCategory,
              serviceType: formData.serviceType,
              caseDescription: formData.description,
              priority: formData.priority
            };
            // Service request prepared
            
            response = await getServiceBasedLawyerRecommendations(requestData);
          } 
          // Fall back to traditional case type recommendations
          else if (formData.caseType) {
            // Making case-type recommendation call
            const requestData = {
              caseType: formData.caseType,
              caseDescription: formData.description,
              priority: formData.priority
            };
            // Case type request prepared
            
            response = await getLawyerRecommendations(requestData);
          }
          // If service-based is enabled but no service selected yet, and no case type, show general recommendations
          else if (formData.useServiceBased && !formData.caseType) {
            console.log('🔄 Making default recommendation call');
            // Auto-set a default case type to get some recommendations
            const defaultCaseType = 'other';
            response = await getLawyerRecommendations({
              caseType: defaultCaseType,
              caseDescription: formData.description,
              priority: formData.priority
            });
          }
          
          console.log('📊 Raw API response:', response);
          
          if (response?.data) {
            console.log('✅ Recommendations response:', response.data);
            console.log('👨‍💼 Lawyers found:', response.data.lawyers?.length || 0);
            console.log('👨‍💼 Lawyers data:', response.data.lawyers);
            setRecommendations(response.data.lawyers || []);
          } else {
            console.log('❌ No response data received');
            setRecommendations([]);
          }
        } catch (error: any) {
          console.error('❌ Error fetching recommendations:', error);
          console.error('❌ Error response:', error.response?.data);
          console.error('❌ Error status:', error.response?.status);
          console.error('❌ Request details:', {
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Header />
      
      <main className="container mx-auto px-4 pt-24 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Enhanced Header with Progress */}
          <div className="relative mb-12">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/dashboard/client')}
              className="mb-6 hover:bg-blue-50 text-blue-600 border-blue-200"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
            
            {/* Main Title Section */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full mb-4">
                <Briefcase className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-3">
                Legal Services Hub
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Create your legal case or browse our comprehensive legal services. Our AI-powered platform connects you with expert lawyers tailored to your specific needs.
              </p>
              
              {/* Service Pre-selection Indicator */}
              {formData.serviceCategory && formData.serviceType && (
                <div className="mt-4 inline-block">
                  <div className="bg-green-50 border border-green-200 rounded-full px-4 py-2">
                    <div className="flex items-center gap-2 text-green-700">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">
                        Service Selected: {formData.serviceType.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Progress Steps */}
            <div className="flex justify-center mb-8">
              <div className="flex items-center space-x-4 bg-white rounded-full px-6 py-3 shadow-lg border">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${formData.title || formData.serviceCategory ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
                    1
                  </div>
                  <span className="text-sm font-medium text-gray-700">Service & Details</span>
                </div>
                <div className="w-8 h-px bg-gray-300"></div>
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${formData.description.length > 20 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
                    2
                  </div>
                  <span className="text-sm font-medium text-gray-700">Description</span>
                </div>
                <div className="w-8 h-px bg-gray-300"></div>
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${recommendations.length > 0 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
                    3
                  </div>
                  <span className="text-sm font-medium text-gray-700">Lawyer Match</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Left Column - Service Selection & Case Details */}
            <div className="xl:col-span-2 space-y-6">
              {/* Service Selection Card */}
              <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-blue-50/30 backdrop-blur">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="p-2 bg-blue-500 rounded-lg">
                      <Shield className="h-5 w-5 text-white" />
                    </div>
                    Legal Service Selection
                  </CardTitle>
                  <CardDescription className="text-base">
                    Choose your legal service category and specific service type for personalized lawyer recommendations
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <form onSubmit={handleSubmit}>
                    {/* Enhanced Service Toggle */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 mb-6">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="p-2 bg-blue-500 rounded-lg">
                          <Sparkles className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-blue-900">Service-Based Legal Solutions</h3>
                          <p className="text-blue-700 text-sm">Get matched with specialized lawyers and transparent pricing</p>
                        </div>
                        <div className="ml-auto">
                          <input
                            type="checkbox"
                            id="useServiceBased"
                            checked={formData.useServiceBased}
                            onChange={(e) => handleInputChange('useServiceBased', e.target.checked)}
                            className="w-5 h-5 text-blue-600 rounded"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Service Selection Grid */}
                    {formData.useServiceBased && (
                      <div className="space-y-6">
                        {/* Service Category Selection */}
                        <div className="space-y-3">
                          <Label className="text-lg font-semibold flex items-center gap-2">
                            <Shield className="h-5 w-5 text-blue-500" />
                            Legal Service Category *
                          </Label>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {Object.entries(serviceCategories).map(([key, category]: [string, any]) => (
                              <div
                                key={key}
                                onClick={() => {
                                  handleInputChange('serviceCategory', key);
                                  handleInputChange('serviceType', '');
                                  handleInputChange('selectedService', '');
                                }}
                                className={`p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md ${
                                  formData.serviceCategory === key
                                    ? 'border-blue-500 bg-blue-50 shadow-md'
                                    : 'border-gray-200 hover:border-blue-300'
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <div className="text-2xl">{category.icon || '⚖️'}</div>
                                  <div>
                                    <h3 className="font-medium text-gray-900">{category.name}</h3>
                                    <p className="text-sm text-gray-600">{category.description}</p>
                                  </div>
                                  {formData.serviceCategory === key && (
                                    <CheckCircle className="h-5 w-5 text-blue-500 ml-auto" />
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Specific Service Selection */}
                        {formData.serviceCategory && serviceCategories[formData.serviceCategory] && (
                          <div className="space-y-3">
                            <Label className="text-lg font-semibold flex items-center gap-2">
                              <Settings className="h-5 w-5 text-indigo-500" />
                              Specific Service *
                            </Label>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                              {serviceCategories[formData.serviceCategory].services.map((service: any) => (
                                <div
                                  key={service.type}
                                  onClick={() => {
                                    handleInputChange('serviceType', service.type);
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
                                  className={`p-3 border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-sm ${
                                    formData.serviceType === service.type
                                      ? 'border-indigo-500 bg-indigo-50 shadow-sm'
                                      : 'border-gray-200 hover:border-indigo-300'
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">{service.label}</span>
                                    {formData.serviceType === service.type && (
                                      <CheckCircle className="h-4 w-4 text-indigo-500" />
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                  </form>
                </CardContent>
              </Card>

              {/* Case Details Card */}
              <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-indigo-50/30 backdrop-blur">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="p-2 bg-indigo-500 rounded-lg">
                      <FileText className="h-5 w-5 text-white" />
                    </div>
                    Case Details
                  </CardTitle>
                  <CardDescription className="text-base">
                    Provide comprehensive information about your legal matter for better recommendations
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <form onSubmit={handleSubmit}>
                    {/* Case Title */}
                    <div className="space-y-3">
                      <Label htmlFor="title" className="text-base font-semibold">Case Title *</Label>
                      <Input
                        id="title"
                        placeholder="e.g., Property Dispute with Neighbor"
                        value={formData.title}
                        onChange={(e) => handleInputChange('title', e.target.value)}
                        className={`text-base p-4 ${errors.title ? 'border-red-500' : 'border-gray-200 focus:border-indigo-500'}`}
                      />
                      {errors.title && (
                        <p className="text-sm text-red-500 flex items-center gap-1">
                          <AlertCircle className="h-4 w-4" />
                          {errors.title}
                        </p>
                      )}
                    </div>

                    {/* Traditional Case Type - Show when service-based is disabled */}
                    {!formData.useServiceBased && (
                      <div className="space-y-3">
                        <Label htmlFor="caseType" className="text-base font-semibold">Case Type *</Label>
                        <Select
                          value={formData.caseType}
                          onValueChange={(value) => handleInputChange('caseType', value)}
                        >
                          <SelectTrigger className={`text-base p-4 ${errors.caseType ? 'border-red-500' : 'border-gray-200'}`}>
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
                          <p className="text-sm text-red-500 flex items-center gap-1">
                            <AlertCircle className="h-4 w-4" />
                            {errors.caseType}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Priority Level */}
                    <div className="space-y-3">
                      <Label htmlFor="priority" className="text-base font-semibold">Priority Level</Label>
                      <div className="grid grid-cols-3 gap-3">
                        {priorities.map((priority) => (
                          <div
                            key={priority.value}
                            onClick={() => handleInputChange('priority', priority.value)}
                            className={`p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 text-center ${
                              formData.priority === priority.value
                                ? 'border-indigo-500 bg-indigo-50'
                                : 'border-gray-200 hover:border-indigo-300'
                            }`}
                          >
                            <div className={`text-2xl mb-2 ${
                              priority.value === 'high' ? '🔴' : 
                              priority.value === 'medium' ? '🟡' : '🟢'
                            }`}>
                              {priority.value === 'high' ? '🔴' : 
                               priority.value === 'medium' ? '🟡' : '🟢'}
                            </div>
                            <span className="text-sm font-medium">{priority.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Case Description */}
                    <div className="space-y-3">
                      <Label htmlFor="description" className="text-base font-semibold">Case Description *</Label>
                      <div className="relative">
                        <Textarea
                          id="description"
                          placeholder="Describe your legal matter in detail. Include relevant facts, timeline, and what outcome you're seeking... (minimum 20 characters)"
                          rows={6}
                          value={formData.description}
                          onChange={(e) => handleInputChange('description', e.target.value)}
                          className={`text-base p-4 resize-none ${
                            errors.description ? 'border-red-500' : 
                            formData.description.length > 20 ? 'border-green-500 focus:border-green-500' : 
                            'border-gray-200 focus:border-indigo-500'
                          }`}
                        />
                        <div className="absolute bottom-3 right-3 text-xs text-gray-500">
                          {formData.description.length}/500
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        {errors.description ? (
                          <p className="text-sm text-red-500 flex items-center gap-1">
                            <AlertCircle className="h-4 w-4" />
                            {errors.description}
                          </p>
                        ) : (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            {formData.description.length >= 20 && (
                              <>
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                <span className="text-green-600">Description looks good!</span>
                              </>
                            )}
                          </div>
                        )}
                        {formData.description.length > 20 && (formData.caseType || formData.serviceType) && (
                          <div className="flex items-center gap-2 text-sm">
                            <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-600 rounded-full">
                              <Brain className="h-4 w-4" />
                              <span>AI Analysis Ready</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Enhanced File Upload Section */}
                    <div className="space-y-3">
                      <Label className="text-base font-semibold">Supporting Documents</Label>
                      <div className="relative">
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
                          className="cursor-pointer group block w-full"
                        >
                          <div className="border-2 border-dashed border-gray-300 group-hover:border-indigo-400 rounded-xl p-8 text-center transition-colors duration-200">
                            <div className="flex flex-col items-center gap-4">
                              <div className="p-3 bg-gray-100 group-hover:bg-indigo-100 rounded-full transition-colors duration-200">
                                <Upload className="h-8 w-8 text-gray-400 group-hover:text-indigo-500 transition-colors duration-200" />
                              </div>
                              <div>
                                <p className="text-base font-medium text-gray-700 group-hover:text-indigo-600 transition-colors duration-200">
                                  Click to upload files or drag and drop
                                </p>
                                <p className="text-sm text-gray-500 mt-1">
                                  PDF, DOC, DOCX, JPG, PNG, GIF up to 10MB each
                                </p>
                              </div>
                            </div>
                          </div>
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
                                key={rec.lawyer?._id || Math.random()}
                                className={`group relative border-2 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] ${
                                  selectedLawyer === rec.lawyer?._id 
                                    ? 'border-legal-navy bg-gradient-to-br from-legal-navy/5 to-legal-navy/10 shadow-md' 
                                    : 'border-gray-200 hover:border-legal-navy/30 bg-white'
                                }`}
                                onClick={() => rec.lawyer?._id && handleLawyerSelect(rec.lawyer._id)}
                              >
                                {/* Selection Indicator */}
                                {selectedLawyer === rec.lawyer?._id && (
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
                                      <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${rec.lawyer?.name || 'Unknown'}`} />
                                      <AvatarFallback className="text-lg font-semibold bg-gradient-to-br from-legal-navy to-legal-navy/80 text-white">
                                        {(rec.lawyer?.name || 'UN').split(' ').map(n => n[0]).join('')}
                                      </AvatarFallback>
                                    </Avatar>
                                    
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-lg font-bold text-gray-900 truncate">
                                          {rec.lawyer?.name || 'Unknown Lawyer'}
                                        </h3>
                                        {rec.lawyer?.verificationStatus === 'verified' && (
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
                                          <span className="font-semibold">{(rec.rating || 0).toFixed(1)}</span>
                                          <span className="text-muted-foreground">rating</span>
                                        </div>
                                        <div className="flex items-center gap-1 text-green-600">
                                          <Award className="h-4 w-4" />
                                          <span className="font-semibold">{rec.casesWon || 0}</span>
                                          <span>wins</span>
                                        </div>
                                        <div className="flex items-center gap-1 text-blue-600">
                                          <Clock className="h-4 w-4" />
                                          <span className="font-semibold">{rec.experience || 0}</span>
                                          <span>years exp</span>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Match Score */}
                                    <div className="text-center">
                                      <div className="bg-legal-navy text-white rounded-full px-3 py-1 text-sm font-bold">
                                        {Math.round((rec.similarity || 0) * 100)}%
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
                                                {(rec.specializations || []).slice(0, 4).map((spec, idx) => (
                                                  <Badge key={idx} variant="outline" className="text-xs px-2 py-1 bg-white/70 border-blue-300 text-blue-800">
                                                    {spec}
                                                  </Badge>
                                                ))}
                                                {(rec.specializations || []).length > 4 && (
                                                  <Badge variant="outline" className="text-xs px-2 py-1 bg-white/70 border-blue-300 text-blue-800">
                                                    +{(rec.specializations || []).length - 4} more areas
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
                                                <span className="text-lg font-bold">₹{(2000 + (rec.experience || 0) * 100).toLocaleString()}</span>
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
                                                <span className="font-bold">₹{(15000 + (rec.experience || 0) * 500).toLocaleString()}</span>
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