import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff,
  DollarSign,
  Clock,
  FileText,
  Award,
  TrendingUp,
  Users,
  CheckCircle,
  XCircle,
  AlertCircle,
  Briefcase,
  Search,
  Filter
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
  getServiceCategories, 
  createLegalService, 
  getLawyerServices, 
  updateLegalService, 
  deleteLegalService 
} from '@/api';

interface ServiceCategory {
  name: string;
  services: Array<{ type: string; label: string }>;
}

interface ServiceCategories {
  [key: string]: ServiceCategory;
}

interface LegalService {
  _id: string;
  category: string;
  serviceType: string;
  title: string;
  description: string;
  pricing: {
    type: 'fixed' | 'hourly' | 'range';
    amount?: number;
    minAmount?: number;
    maxAmount?: number;
    hourlyRate?: number;
    currency: string;
  };
  estimatedDuration: string;
  requirements: string[];
  deliverables: string[];
  isActive: boolean;
  metrics: {
    experienceYears: number;
    successRate: number;
    casesHandled: number;
    rating: number;
    reviewCount: number;
  };
  availability: {
    isAcceptingClients: boolean;
    maxCasesPerMonth: number;
    currentCaseLoad: number;
  };
  createdAt: string;
  updatedAt: string;
}

const LawyerServiceManagement: React.FC = () => {
  const { toast } = useToast();
  const [services, setServices] = useState<LegalService[]>([]);
  const [categories, setCategories] = useState<ServiceCategories>({});
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<LegalService | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'services' | 'analytics'>('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  
  // Form state
  const [formData, setFormData] = useState({
    category: '',
    serviceType: '',
    title: '',
    description: '',
    pricing: {
      type: 'fixed' as 'fixed' | 'hourly' | 'range',
      amount: '',
      minAmount: '',
      maxAmount: '',
      hourlyRate: '',
      currency: 'INR'
    },
    estimatedDuration: '',
    requirements: [''],
    deliverables: [''],
    metrics: {
      experienceYears: '',
      successRate: '',
      casesHandled: ''
    },
    availability: {
      isAcceptingClients: true,
      maxCasesPerMonth: '10'
    }
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [categoriesRes, servicesRes] = await Promise.all([
        getServiceCategories(),
        getLawyerServices()
      ]);
      
      setCategories(categoriesRes.data.categories);
      setServices(servicesRes.data.services);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load service data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      category: '',
      serviceType: '',
      title: '',
      description: '',
      pricing: {
        type: 'fixed',
        amount: '',
        minAmount: '',
        maxAmount: '',
        hourlyRate: '',
        currency: 'INR'
      },
      estimatedDuration: '',
      requirements: [''],
      deliverables: [''],
      metrics: {
        experienceYears: '',
        successRate: '',
        casesHandled: ''
      },
      availability: {
        isAcceptingClients: true,
        maxCasesPerMonth: '10'
      }
    });
    setEditingService(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const submitData = {
        ...formData,
        requirements: formData.requirements.filter(r => r.trim()),
        deliverables: formData.deliverables.filter(d => d.trim()),
        pricing: {
          ...formData.pricing,
          amount: formData.pricing.amount ? parseFloat(formData.pricing.amount) : undefined,
          minAmount: formData.pricing.minAmount ? parseFloat(formData.pricing.minAmount) : undefined,
          maxAmount: formData.pricing.maxAmount ? parseFloat(formData.pricing.maxAmount) : undefined,
          hourlyRate: formData.pricing.hourlyRate ? parseFloat(formData.pricing.hourlyRate) : undefined,
        },
        metrics: {
          experienceYears: formData.metrics.experienceYears ? parseInt(formData.metrics.experienceYears) : 0,
          successRate: formData.metrics.successRate ? parseFloat(formData.metrics.successRate) : 0,
          casesHandled: formData.metrics.casesHandled ? parseInt(formData.metrics.casesHandled) : 0,
        },
        availability: {
          ...formData.availability,
          maxCasesPerMonth: parseInt(formData.availability.maxCasesPerMonth)
        }
      };

      if (editingService) {
        await updateLegalService(editingService._id, submitData);
        toast({
          title: "Success",
          description: "Service updated successfully"
        });
      } else {
        await createLegalService(submitData);
        toast({
          title: "Success", 
          description: "Service created successfully"
        });
      }

      await loadData();
      setIsCreateDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to save service",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (service: LegalService) => {
    setFormData({
      category: service.category,
      serviceType: service.serviceType,
      title: service.title,
      description: service.description,
      pricing: {
        type: service.pricing.type,
        amount: service.pricing.amount?.toString() || '',
        minAmount: service.pricing.minAmount?.toString() || '',
        maxAmount: service.pricing.maxAmount?.toString() || '',
        hourlyRate: service.pricing.hourlyRate?.toString() || '',
        currency: service.pricing.currency
      },
      estimatedDuration: service.estimatedDuration,
      requirements: service.requirements.length > 0 ? service.requirements : [''],
      deliverables: service.deliverables.length > 0 ? service.deliverables : [''],
      metrics: {
        experienceYears: service.metrics.experienceYears.toString(),
        successRate: service.metrics.successRate.toString(),
        casesHandled: service.metrics.casesHandled.toString()
      },
      availability: {
        isAcceptingClients: service.availability.isAcceptingClients,
        maxCasesPerMonth: service.availability.maxCasesPerMonth.toString()
      }
    });
    setEditingService(service);
    setIsCreateDialogOpen(true);
  };

  const handleDelete = async (serviceId: string) => {
    if (!confirm('Are you sure you want to deactivate this service?')) return;
    
    try {
      await deleteLegalService(serviceId);
      toast({
        title: "Success",
        description: "Service deactivated successfully"
      });
      await loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete service",
        variant: "destructive"
      });
    }
  };

  const handleArrayFieldChange = (field: 'requirements' | 'deliverables', index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  const addArrayField = (field: 'requirements' | 'deliverables') => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const removeArrayField = (field: 'requirements' | 'deliverables', index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const getServiceTypeOptions = () => {
    if (!formData.category || !categories[formData.category]) return [];
    return categories[formData.category].services;
  };

  // Enhanced analytics and filtering functions
  const getServiceAnalytics = () => {
    const totalServices = services.length;
    const activeServices = services.filter(s => s.isActive).length;
    const totalRevenue = services.reduce((sum, s) => {
      if (s.pricing.type === 'fixed' && s.pricing.amount) {
        return sum + (s.pricing.amount * s.metrics.casesHandled);
      }
      return sum;
    }, 0);
    const avgRating = services.reduce((sum, s) => sum + s.metrics.rating, 0) / totalServices;
    const totalCases = services.reduce((sum, s) => sum + s.metrics.casesHandled, 0);
    
    return {
      totalServices,
      activeServices,
      inactiveServices: totalServices - activeServices,
      totalRevenue,
      avgRating: isNaN(avgRating) ? 0 : avgRating,
      totalCases,
      topCategory: Object.keys(categories)[0] || 'None'
    };
  };

  const getFilteredServices = () => {
    return services.filter(service => {
      const matchesSearch = service.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           service.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           service.category.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = filterCategory === 'all' || service.category === filterCategory;
      
      const matchesStatus = filterStatus === 'all' || 
                           (filterStatus === 'active' && service.isActive) ||
                           (filterStatus === 'inactive' && !service.isActive);
      
      return matchesSearch && matchesCategory && matchesStatus;
    });
  };

  const getCategoryDistribution = () => {
    const distribution: Record<string, number> = {};
    services.forEach(service => {
      distribution[service.category] = (distribution[service.category] || 0) + 1;
    });
    return distribution;
  };

  const getFormattedPrice = (service: LegalService) => {
    const { type, amount, minAmount, maxAmount, hourlyRate, currency } = service.pricing;
    const symbol = currency === 'INR' ? '₹' : currency === 'USD' ? '$' : currency;
    
    switch (type) {
      case 'fixed':
        return `${symbol}${amount?.toLocaleString() || 0}`;
      case 'range':
        return `${symbol}${minAmount?.toLocaleString() || 0} - ${symbol}${maxAmount?.toLocaleString() || 0}`;
      case 'hourly':
        return `${symbol}${hourlyRate?.toLocaleString() || 0}/hour`;
      default:
        return 'Price on request';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 border-4 border-legal-navy border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const analytics = getServiceAnalytics();
  const filteredServices = getFilteredServices();
  const categoryDistribution = getCategoryDistribution();

  return (
    <div className="space-y-6">
      {/* Enhanced Header with Analytics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Total Services</p>
                <p className="text-2xl font-bold text-blue-900">{analytics.totalServices}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Active Services</p>
                <p className="text-2xl font-bold text-green-900">{analytics.activeServices}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700">Total Cases</p>
                <p className="text-2xl font-bold text-purple-900">{analytics.totalCases}</p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-700">Avg Rating</p>
                <p className="text-2xl font-bold text-orange-900">{analytics.avgRating.toFixed(1)}</p>
              </div>
              <Award className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Management Interface */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-6 w-6 text-blue-600" />
                Service Management
              </CardTitle>
              <CardDescription>Manage your legal service offerings, pricing, and availability</CardDescription>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700" onClick={resetForm}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Service
                </Button>
              </DialogTrigger>
            </Dialog>
          </div>

          {/* Search and Filter Controls */}
          <div className="flex flex-col lg:flex-row gap-4 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search services by title, description, or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <div className="flex gap-2">
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {Object.entries(categories).map(([key, category]) => (
                    <SelectItem key={key} value={key}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Enhanced Services List */}
          <div className="space-y-4">
            {filteredServices.length > 0 ? (
              <div className="grid gap-4">
                {filteredServices.map((service) => (
                  <Card key={service._id} className={`hover:shadow-md transition-shadow ${!service.isActive ? 'opacity-60' : ''}`}>
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">{service.title}</h3>
                              <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={service.isActive ? "default" : "secondary"}>
                                {service.isActive ? "Active" : "Inactive"}
                              </Badge>
                              <Badge variant="outline">
                                {categories[service.category]?.name || service.category}
                              </Badge>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4 text-green-600" />
                              <span className="font-medium">{getFormattedPrice(service)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-blue-600" />
                              <span>{service.estimatedDuration}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-purple-600" />
                              <span>{service.metrics.casesHandled} cases handled</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span>Rating: {service.metrics.rating.toFixed(1)}/5.0</span>
                            <span>Success Rate: {service.metrics.successRate}%</span>
                            <span>Experience: {service.metrics.experienceYears} years</span>
                            <span className={`${service.availability.isAcceptingClients ? 'text-green-600' : 'text-red-600'}`}>
                              {service.availability.isAcceptingClients ? 'Accepting Clients' : 'Not Accepting Clients'}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(service)}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(service._id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">
                  {searchTerm || filterCategory !== 'all' || filterStatus !== 'all' 
                    ? 'No services found' 
                    : 'No services created yet'}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || filterCategory !== 'all' || filterStatus !== 'all'
                    ? 'Try adjusting your search terms or filters'
                    : 'Create your first legal service offering'}
                </p>
                {!(searchTerm || filterCategory !== 'all' || filterStatus !== 'all') && (
                  <Button onClick={() => {resetForm(); setIsCreateDialogOpen(true);}}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Service
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Service Creation/Edit Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingService ? 'Edit Service' : 'Create New Service'}
              </DialogTitle>
              <DialogDescription>
                {editingService ? 'Update your service details and pricing' : 'Add a new legal service to your offerings'}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Service Category and Type */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Service Category *</Label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, category: value, serviceType: '' }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(categories).map(([key, category]) => (
                        <SelectItem key={key} value={key}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="serviceType">Service Type *</Label>
                  <Select 
                    value={formData.serviceType} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, serviceType: value }))}
                    disabled={!formData.category}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select service type" />
                    </SelectTrigger>
                    <SelectContent>
                      {getServiceTypeOptions().map((service) => (
                        <SelectItem key={service.type} value={service.type}>
                          {service.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Service Title and Description */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Service Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Complete Divorce Case Handling"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Service Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe what your service includes..."
                    rows={3}
                    required
                  />
                </div>
              </div>

              {/* Pricing */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Pricing Structure</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Pricing Type *</Label>
                    <Select 
                      value={formData.pricing.type} 
                      onValueChange={(value: 'fixed' | 'hourly' | 'range') => 
                        setFormData(prev => ({ ...prev, pricing: { ...prev.pricing, type: value } }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fixed">Fixed Price</SelectItem>
                        <SelectItem value="range">Price Range</SelectItem>
                        <SelectItem value="hourly">Hourly Rate</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.pricing.type === 'fixed' && (
                    <div className="space-y-2">
                      <Label htmlFor="amount">Fixed Amount (₹) *</Label>
                      <Input
                        id="amount"
                        type="number"
                        min="0"
                        value={formData.pricing.amount}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          pricing: { ...prev.pricing, amount: e.target.value } 
                        }))}
                        placeholder="10000"
                        required
                      />
                    </div>
                  )}

                  {formData.pricing.type === 'range' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="minAmount">Minimum Amount (₹) *</Label>
                        <Input
                          id="minAmount"
                          type="number"
                          min="0"
                          value={formData.pricing.minAmount}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            pricing: { ...prev.pricing, minAmount: e.target.value } 
                          }))}
                          placeholder="5000"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="maxAmount">Maximum Amount (₹) *</Label>
                        <Input
                          id="maxAmount"
                          type="number"
                          min="0"
                          value={formData.pricing.maxAmount}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            pricing: { ...prev.pricing, maxAmount: e.target.value } 
                          }))}
                          placeholder="20000"
                          required
                        />
                      </div>
                    </div>
                  )}

                  {formData.pricing.type === 'hourly' && (
                    <div className="space-y-2">
                      <Label htmlFor="hourlyRate">Hourly Rate (₹) *</Label>
                      <Input
                        id="hourlyRate"
                        type="number"
                        min="0"
                        value={formData.pricing.hourlyRate}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          pricing: { ...prev.pricing, hourlyRate: e.target.value } 
                        }))}
                        placeholder="2000"
                        required
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Duration and Requirements */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="estimatedDuration">Estimated Duration *</Label>
                  <Input
                    id="estimatedDuration"
                    value={formData.estimatedDuration}
                    onChange={(e) => setFormData(prev => ({ ...prev, estimatedDuration: e.target.value }))}
                    placeholder="e.g., 2-3 weeks"
                    required
                  />
                </div>
              </div>

              {/* Requirements */}
              <div className="space-y-3">
                <Label>Requirements (Documents/Information needed)</Label>
                {formData.requirements.map((req, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={req}
                      onChange={(e) => handleArrayFieldChange('requirements', index, e.target.value)}
                      placeholder="e.g., Marriage certificate, ID proof"
                    />
                    {formData.requirements.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeArrayField('requirements', index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addArrayField('requirements')}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Requirement
                </Button>
              </div>

              {/* Deliverables */}
              <div className="space-y-3">
                <Label>Deliverables (What client will receive)</Label>
                {formData.deliverables.map((del, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={del}
                      onChange={(e) => handleArrayFieldChange('deliverables', index, e.target.value)}
                      placeholder="e.g., Divorce petition filed, Legal consultation"
                    />
                    {formData.deliverables.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeArrayField('deliverables', index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addArrayField('deliverables')}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Deliverable
                </Button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-legal-gold hover:bg-legal-gold/90 text-legal-navy"
                >
                  {editingService ? 'Update Service' : 'Create Service'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
    </div>
  );
};

export default LawyerServiceManagement;