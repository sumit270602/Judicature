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
  AlertCircle
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-playfair font-bold text-legal-navy">Legal Services Management</h2>
          <p className="text-gray-600">Manage your service offerings and pricing</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-legal-navy hover:bg-legal-navy/90" onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add New Service
            </Button>
          </DialogTrigger>
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

      {/* Services List */}
      {services.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Services Yet</h3>
            <p className="text-gray-600 mb-4">Start by creating your first legal service offering</p>
            <Button 
              onClick={() => setIsCreateDialogOpen(true)}
              className="bg-legal-navy hover:bg-legal-navy/90"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Service
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Your Services ({services.length})</CardTitle>
            <CardDescription>Manage your legal service offerings</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Pricing</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Performance</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.map((service) => (
                  <TableRow key={service._id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{service.title}</div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {service.description}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {categories[service.category]?.name || service.category}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{getFormattedPrice(service)}</div>
                      <div className="text-sm text-gray-500">{service.estimatedDuration}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {service.isActive ? (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <XCircle className="h-3 w-3 mr-1" />
                            Inactive
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm">
                          ⭐ {service.metrics.rating.toFixed(1)} ({service.metrics.reviewCount})
                        </div>
                        <div className="text-sm text-gray-500">
                          {service.metrics.casesHandled} cases
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(service)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(service._id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default LawyerServiceManagement;