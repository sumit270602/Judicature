import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { 
  Plus, 
  Edit, 
  Trash2, 
  DollarSign, 
  Clock, 
  Star, 
  TrendingUp, 
  Users, 
  CheckCircle,
  AlertCircle,
  IndianRupee,
  Filter,
  Search,
  Eye,
  BarChart3
} from 'lucide-react';
import { api } from '@/api';
import { toast } from 'sonner';

interface RateCard {
  _id: string;
  serviceType: string;
  practiceArea: string;
  baseRate: number;
  experienceTier: string;
  title: string;
  description: string;
  billingTerms: {
    unit: string;
    minimumCharge: number;
    advancePayment: number;
  };
  jurisdiction: string;
  availability: {
    isActive: boolean;
    maxCases: number;
    responseTime: string;
  };
  complexityMultipliers: {
    simple: number;
    moderate: number;
    complex: number;
  };
  metrics: {
    totalBookings: number;
    successRate: number;
    avgRating: number;
  };
  reviews: Array<{
    client: { name: string };
    rating: number;
    comment: string;
    reviewDate: string;
  }>;
  averageRating: number;
  totalReviews: number;
  lawyer: {
    name: string;
    email: string;
    experience: number;
  };
  createdAt: string;
}

const LawyerRateManagement: React.FC = () => {
  const [rateCards, setRateCards] = useState<RateCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCard, setSelectedCard] = useState<RateCard | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterService, setFilterService] = useState<string>('all');
  
  // Form state
  const [formData, setFormData] = useState({
    serviceType: '',
    practiceArea: '',
    baseRate: '',
    experienceTier: '',
    title: '',
    description: '',
    jurisdiction: '',
    billingUnit: 'hour',
    minimumCharge: '',
    advancePayment: '',
    maxCases: '',
    responseTime: '',
    isActive: true,
    simpleMultiplier: '1.0',
    moderateMultiplier: '1.5',
    complexMultiplier: '2.0'
  });

  const serviceTypes = [
    { value: 'consultation', label: 'Legal Consultation' },
    { value: 'case_handling', label: 'Case Handling' },
    { value: 'document_review', label: 'Document Review' },
    { value: 'court_representation', label: 'Court Representation' },
    { value: 'legal_advice', label: 'Legal Advice' },
    { value: 'contract_drafting', label: 'Contract Drafting' }
  ];

  const experienceTiers = [
    { value: 'junior', label: 'Junior (0-3 years)' },
    { value: 'mid_level', label: 'Mid-Level (4-8 years)' },
    { value: 'senior', label: 'Senior (9-15 years)' },
    { value: 'expert', label: 'Expert (15+ years)' }
  ];

  const practiceAreas = [
    'Corporate Law', 'Criminal Law', 'Family Law', 'Property Law',
    'Civil Litigation', 'Tax Law', 'Labor Law', 'Intellectual Property',
    'Banking Law', 'Real Estate', 'Immigration Law', 'Consumer Law'
  ];

  const jurisdictions = [
    'Delhi', 'Mumbai', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad',
    'Pune', 'Gujarat', 'All India'
  ];

  useEffect(() => {
    fetchRateCards();
  }, []);

  const fetchRateCards = async () => {
    try {
      const response = await api.get('/rate-cards/lawyer');
      setRateCards(response.data.data);
    } catch (error) {
      console.error('Error fetching rate cards:', error);
      toast.error('Failed to fetch rate cards');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const payload = {
        serviceType: formData.serviceType,
        practiceArea: formData.practiceArea,
        baseRate: parseFloat(formData.baseRate),
        experienceTier: formData.experienceTier,
        title: formData.title,
        description: formData.description,
        jurisdiction: formData.jurisdiction,
        billingTerms: {
          unit: formData.billingUnit,
          minimumCharge: parseFloat(formData.minimumCharge) || 0,
          advancePayment: parseFloat(formData.advancePayment) || 0
        },
        availability: {
          isActive: formData.isActive,
          maxCases: parseInt(formData.maxCases) || 10,
          responseTime: formData.responseTime
        },
        complexityMultipliers: {
          simple: parseFloat(formData.simpleMultiplier),
          moderate: parseFloat(formData.moderateMultiplier),
          complex: parseFloat(formData.complexMultiplier)
        }
      };

      await api.post('/rate-cards', payload);
      toast.success('Rate card saved successfully');
      setShowCreateDialog(false);
      resetForm();
      fetchRateCards();
    } catch (error: any) {
      console.error('Error saving rate card:', error);
      toast.error(error.response?.data?.message || 'Failed to save rate card');
    }
  };

  const handleDelete = async (cardId: string) => {
    try {
      await api.delete(`/rate-cards/${cardId}`);
      toast.success('Rate card deleted successfully');
      fetchRateCards();
    } catch (error: any) {
      console.error('Error deleting rate card:', error);
      toast.error(error.response?.data?.message || 'Failed to delete rate card');
    }
  };

  const resetForm = () => {
    setFormData({
      serviceType: '',
      practiceArea: '',
      baseRate: '',
      experienceTier: '',
      title: '',
      description: '',
      jurisdiction: '',
      billingUnit: 'hour',
      minimumCharge: '',
      advancePayment: '',
      maxCases: '',
      responseTime: '',
      isActive: true,
      simpleMultiplier: '1.0',
      moderateMultiplier: '1.5',
      complexMultiplier: '2.0'
    });
  };

  const filteredRateCards = rateCards.filter(card => {
    const matchesSearch = card.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         card.practiceArea.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && card.availability.isActive) ||
                         (filterStatus === 'inactive' && !card.availability.isActive);
    const matchesService = filterService === 'all' || card.serviceType === filterService;
    
    return matchesSearch && matchesStatus && matchesService;
  });

  const totalEarnings = rateCards.reduce((sum, card) => sum + (card.metrics.totalBookings * card.baseRate), 0);
  const averageRating = rateCards.length > 0 
    ? rateCards.reduce((sum, card) => sum + card.averageRating, 0) / rateCards.length 
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Rate Management</h1>
          <p className="text-gray-600">Manage your service rates and pricing</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setShowCreateDialog(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Create Rate Card
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Rate Card</DialogTitle>
              <DialogDescription>
                Set up pricing for your legal services
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleCreateOrUpdate} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="serviceType">Service Type *</Label>
                  <Select value={formData.serviceType} onValueChange={(value) => setFormData({...formData, serviceType: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select service type" />
                    </SelectTrigger>
                    <SelectContent>
                      {serviceTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="practiceArea">Practice Area *</Label>
                  <Select value={formData.practiceArea} onValueChange={(value) => setFormData({...formData, practiceArea: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select practice area" />
                    </SelectTrigger>
                    <SelectContent>
                      {practiceAreas.map(area => (
                        <SelectItem key={area} value={area}>
                          {area}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="baseRate">Base Rate (₹) *</Label>
                  <Input
                    id="baseRate"
                    type="number"
                    value={formData.baseRate}
                    onChange={(e) => setFormData({...formData, baseRate: e.target.value})}
                    placeholder="Enter base rate"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="experienceTier">Experience Tier *</Label>
                  <Select value={formData.experienceTier} onValueChange={(value) => setFormData({...formData, experienceTier: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select tier" />
                    </SelectTrigger>
                    <SelectContent>
                      {experienceTiers.map(tier => (
                        <SelectItem key={tier.value} value={tier.value}>
                          {tier.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="title">Service Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="Brief title for your service"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Detailed description of the service"
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="jurisdiction">Jurisdiction</Label>
                  <Select value={formData.jurisdiction} onValueChange={(value) => setFormData({...formData, jurisdiction: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select jurisdiction" />
                    </SelectTrigger>
                    <SelectContent>
                      {jurisdictions.map(jurisdiction => (
                        <SelectItem key={jurisdiction} value={jurisdiction}>
                          {jurisdiction}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="billingUnit">Billing Unit</Label>
                  <Select value={formData.billingUnit} onValueChange={(value) => setFormData({...formData, billingUnit: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hour">Per Hour</SelectItem>
                      <SelectItem value="case">Per Case</SelectItem>
                      <SelectItem value="document">Per Document</SelectItem>
                      <SelectItem value="consultation">Per Consultation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="minimumCharge">Minimum Charge (₹)</Label>
                  <Input
                    id="minimumCharge"
                    type="number"
                    value={formData.minimumCharge}
                    onChange={(e) => setFormData({...formData, minimumCharge: e.target.value})}
                    placeholder="0"
                  />
                </div>
                
                <div>
                  <Label htmlFor="advancePayment">Advance Payment (%)</Label>
                  <Input
                    id="advancePayment"
                    type="number"
                    value={formData.advancePayment}
                    onChange={(e) => setFormData({...formData, advancePayment: e.target.value})}
                    placeholder="0"
                  />
                </div>
                
                <div>
                  <Label htmlFor="maxCases">Max Cases</Label>
                  <Input
                    id="maxCases"
                    type="number"
                    value={formData.maxCases}
                    onChange={(e) => setFormData({...formData, maxCases: e.target.value})}
                    placeholder="10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="responseTime">Response Time</Label>
                <Select value={formData.responseTime} onValueChange={(value) => setFormData({...formData, responseTime: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select response time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="immediate">Immediate (&lt; 1 hour)</SelectItem>
                    <SelectItem value="same_day">Same Day (&lt; 24 hours)</SelectItem>
                    <SelectItem value="next_day">Next Day (1-2 days)</SelectItem>
                    <SelectItem value="flexible">Flexible (2-7 days)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Complexity Multipliers</Label>
                <div className="grid grid-cols-3 gap-4 mt-2">
                  <div>
                    <Label htmlFor="simpleMultiplier">Simple Cases</Label>
                    <Input
                      id="simpleMultiplier"
                      type="number"
                      step="0.1"
                      value={formData.simpleMultiplier}
                      onChange={(e) => setFormData({...formData, simpleMultiplier: e.target.value})}
                      placeholder="1.0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="moderateMultiplier">Moderate Cases</Label>
                    <Input
                      id="moderateMultiplier"
                      type="number"
                      step="0.1"
                      value={formData.moderateMultiplier}
                      onChange={(e) => setFormData({...formData, moderateMultiplier: e.target.value})}
                      placeholder="1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="complexMultiplier">Complex Cases</Label>
                    <Input
                      id="complexMultiplier"
                      type="number"
                      step="0.1"
                      value={formData.complexMultiplier}
                      onChange={(e) => setFormData({...formData, complexMultiplier: e.target.value})}
                      placeholder="2.0"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({...formData, isActive: checked})}
                />
                <Label htmlFor="isActive">Make this rate card active</Label>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Create Rate Card
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Rate Cards</p>
                <p className="text-2xl font-bold">{rateCards.length}</p>
              </div>
              <DollarSign className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                <p className="text-2xl font-bold">
                  {rateCards.reduce((sum, card) => sum + card.metrics.totalBookings, 0)}
                </p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Rating</p>
                <p className="text-2xl font-bold">{averageRating.toFixed(1)}</p>
              </div>
              <Star className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Earnings</p>
                <p className="text-2xl font-bold">₹{totalEarnings.toLocaleString()}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search rate cards..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filterService} onValueChange={setFilterService}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Services</SelectItem>
                {serviceTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Rate Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRateCards.map((card) => (
          <Card key={card._id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{card.title}</CardTitle>
                  <CardDescription className="mt-1">
                    {card.practiceArea} • {card.serviceType.replace('_', ' ')}
                  </CardDescription>
                </div>
                <Badge variant={card.availability.isActive ? "default" : "secondary"}>
                  {card.availability.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-primary">
                    ₹{card.baseRate.toLocaleString()}
                  </span>
                  <span className="text-sm text-gray-600">
                    per {card.billingTerms.unit}
                  </span>
                </div>
                
                <p className="text-sm text-gray-600 line-clamp-2">
                  {card.description}
                </p>
                
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-400 mr-1" />
                    {card.averageRating.toFixed(1)} ({card.totalReviews})
                  </div>
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-1" />
                    {card.metrics.totalBookings} bookings
                  </div>
                </div>
                
                <Separator />
                
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="text-center">
                    <p className="font-medium">Simple</p>
                    <p className="text-gray-600">₹{(card.baseRate * card.complexityMultipliers.simple).toLocaleString()}</p>
                  </div>
                  <div className="text-center">
                    <p className="font-medium">Moderate</p>
                    <p className="text-gray-600">₹{(card.baseRate * card.complexityMultipliers.moderate).toLocaleString()}</p>
                  </div>
                  <div className="text-center">
                    <p className="font-medium">Complex</p>
                    <p className="text-gray-600">₹{(card.baseRate * card.complexityMultipliers.complex).toLocaleString()}</p>
                  </div>
                </div>
                
                <div className="flex justify-between items-center pt-2">
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-1" />
                    View Details
                  </Button>
                  <div className="flex space-x-1">
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDelete(card._id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredRateCards.length === 0 && (
        <Card className="p-12 text-center">
          <div className="text-gray-500">
            <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No Rate Cards Found</h3>
            <p className="text-sm">
              {searchTerm || filterStatus !== 'all' || filterService !== 'all'
                ? "No rate cards match your current filters."
                : "Create your first rate card to start offering legal services."
              }
            </p>
          </div>
        </Card>
      )}
    </div>
  );
};

export default LawyerRateManagement;