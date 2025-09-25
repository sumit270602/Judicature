import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Search, 
  Filter, 
  Star, 
  MapPin, 
  Clock, 
  DollarSign, 
  FileText, 
  MessageSquare,
  CheckCircle,
  Award,
  Briefcase,
  Users,
  TrendingUp,
  Phone,
  Mail
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useToast } from '@/hooks/use-toast';
import { 
  getServiceCategories, 
  getServicesByCategory, 
  getServicesByType, 
  searchServices 
} from '@/api';

interface ServiceCategory {
  name: string;
  services: Array<{ type: string; label: string }>;
}

interface ServiceCategories {
  [key: string]: ServiceCategory;
}

interface LawyerProfile {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  barCouncilId: string;
  experience: number;
  verificationStatus: string;
  profilePicture?: string;
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
  lawyer: LawyerProfile;
}

const ServiceDiscovery: React.FC = () => {
  const { toast } = useToast();
  const [categories, setCategories] = useState<ServiceCategories>({});
  const [services, setServices] = useState<LegalService[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [sortBy, setSortBy] = useState('rating');
  const [selectedService, setSelectedService] = useState<LegalService | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (Object.keys(categories).length > 0) {
      loadServices();
    }
  }, [categories, selectedCategory, sortBy]);

  const loadCategories = async () => {
    try {
      const response = await getServiceCategories();
      setCategories(response.data.categories);
    } catch (error) {
      console.error('Error loading categories:', error);
      toast({
        title: "Error",
        description: "Failed to load service categories",
        variant: "destructive"
      });
    }
  };

  const loadServices = async () => {
    try {
      setLoading(true);
      let response;
      
      if (searchQuery.trim()) {
        response = await searchServices({
          query: searchQuery,
          category: selectedCategory || undefined,
          minPrice: priceRange.min ? parseInt(priceRange.min) : undefined,
          maxPrice: priceRange.max ? parseInt(priceRange.max) : undefined,
          sortBy
        });
      } else if (selectedCategory) {
        response = await getServicesByCategory(selectedCategory, {
          minPrice: priceRange.min ? parseInt(priceRange.min) : undefined,
          maxPrice: priceRange.max ? parseInt(priceRange.max) : undefined,
          sortBy
        });
      } else {
        // Load all categories
        const allServices: LegalService[] = [];
        for (const categoryKey of Object.keys(categories)) {
          try {
            const categoryResponse = await getServicesByCategory(categoryKey, { sortBy });
            allServices.push(...categoryResponse.data.services);
          } catch (error) {
            console.error(`Error loading ${categoryKey}:`, error);
          }
        }
        response = { data: { services: allServices } };
      }
      
      setServices(response.data.services || []);
    } catch (error) {
      console.error('Error loading services:', error);
      toast({
        title: "Error",
        description: "Failed to load services",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadServices();
  };

  const handleFilterChange = () => {
    loadServices();
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

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'personal_family': return <Users className="h-5 w-5" />;
      case 'criminal_property': return <Briefcase className="h-5 w-5" />;
      case 'civil_debt': return <FileText className="h-5 w-5" />;
      case 'corporate_law': return <TrendingUp className="h-5 w-5" />;
      default: return <Star className="h-5 w-5" />;
    }
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-legal-navy/5 to-legal-gold/5 pt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-playfair font-bold text-legal-navy mb-4">
              Find Legal Services
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Browse and compare legal services from verified lawyers. 
              Get transparent pricing and find the right lawyer for your needs.
            </p>
          </div>

          {/* Search and Filters */}
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* Search Bar */}
                <div className="flex gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search for legal services..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    />
                  </div>
                  <Button onClick={handleSearch} className="bg-legal-navy hover:bg-legal-navy/90">
                    Search
                  </Button>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-4">
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Categories</SelectItem>
                      {Object.entries(categories).map(([key, category]) => (
                        <SelectItem key={key} value={key}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="flex gap-2">
                    <Input
                      placeholder="Min Price"
                      type="number"
                      value={priceRange.min}
                      onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                      className="w-24"
                    />
                    <Input
                      placeholder="Max Price"
                      type="number"
                      value={priceRange.max}
                      onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                      className="w-24"
                    />
                  </div>

                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rating">Best Rated</SelectItem>
                      <SelectItem value="price_low">Price: Low to High</SelectItem>
                      <SelectItem value="price_high">Price: High to Low</SelectItem>
                      <SelectItem value="experience">Most Experienced</SelectItem>
                      <SelectItem value="cases">Most Cases</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button variant="outline" onClick={handleFilterChange}>
                    <Filter className="h-4 w-4 mr-2" />
                    Apply Filters
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Category Tabs */}
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mb-8">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="" className="flex items-center gap-2">
                <Star className="h-4 w-4" />
                All
              </TabsTrigger>
              {Object.entries(categories).map(([key, category]) => (
                <TabsTrigger key={key} value={key} className="flex items-center gap-2">
                  {getCategoryIcon(key)}
                  <span className="hidden sm:inline">{category.name.split(' / ')[0]}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {/* Results */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-legal-navy border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : services.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Services Found</h3>
                <p className="text-gray-600">Try adjusting your search criteria or filters</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="flex items-center justify-between mb-6">
                <p className="text-gray-600">
                  Found {services.length} service{services.length !== 1 ? 's' : ''}
                  {selectedCategory && ` in ${categories[selectedCategory]?.name}`}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {services.map((service) => (
                  <Card key={service._id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg mb-2">{service.title}</CardTitle>
                          <CardDescription className="line-clamp-2">
                            {service.description}
                          </CardDescription>
                        </div>
                        <Badge variant="secondary" className="ml-2">
                          {categories[service.category]?.name || service.category}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {/* Lawyer Info */}
                      <div className="flex items-center gap-3 mb-4">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={service.lawyer.profilePicture} />
                          <AvatarFallback className="bg-legal-navy text-white">
                            {service.lawyer.name.split(' ').map(n => n.charAt(0)).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="font-medium">{service.lawyer.name}</div>
                          <div className="text-sm text-gray-500">
                            {service.lawyer.experience} years experience
                          </div>
                        </div>
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Verified
                        </Badge>
                      </div>

                      {/* Service Details */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-gray-400" />
                            <span className="font-semibold text-legal-navy">
                              {getFormattedPrice(service)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-sm">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span>{service.metrics.rating.toFixed(1)}</span>
                            <span className="text-gray-500">({service.metrics.reviewCount})</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="h-4 w-4" />
                          <span>{service.estimatedDuration}</span>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Award className="h-4 w-4" />
                          <span>{service.metrics.casesHandled} cases handled</span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 mt-6">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              className="flex-1"
                              onClick={() => setSelectedService(service)}
                            >
                              <FileText className="h-4 w-4 mr-2" />
                              View Details
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                            {selectedService && (
                              <>
                                <DialogHeader>
                                  <DialogTitle className="flex items-center gap-3">
                                    <Avatar className="h-12 w-12">
                                      <AvatarImage src={selectedService.lawyer.profilePicture} />
                                      <AvatarFallback className="bg-legal-navy text-white">
                                        {selectedService.lawyer.name.split(' ').map(n => n.charAt(0)).join('')}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <div className="text-xl">{selectedService.title}</div>
                                      <div className="text-sm font-normal text-gray-600">
                                        by {selectedService.lawyer.name}
                                      </div>
                                    </div>
                                  </DialogTitle>
                                </DialogHeader>

                                <div className="space-y-6">
                                  {/* Service Description */}
                                  <div>
                                    <h4 className="font-semibold mb-2">Service Description</h4>
                                    <p className="text-gray-600">{selectedService.description}</p>
                                  </div>

                                  {/* Pricing */}
                                  <div className="bg-legal-navy/5 p-4 rounded-lg">
                                    <div className="flex items-center justify-between mb-2">
                                      <h4 className="font-semibold">Pricing</h4>
                                      <Badge className="bg-legal-gold text-legal-navy">
                                        {getFormattedPrice(selectedService)}
                                      </Badge>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                      <Clock className="h-4 w-4" />
                                      <span>Estimated Duration: {selectedService.estimatedDuration}</span>
                                    </div>
                                  </div>

                                  {/* Requirements */}
                                  {selectedService.requirements.length > 0 && (
                                    <div>
                                      <h4 className="font-semibold mb-2">Requirements</h4>
                                      <ul className="list-disc list-inside space-y-1 text-gray-600">
                                        {selectedService.requirements.map((req, index) => (
                                          <li key={index}>{req}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}

                                  {/* Deliverables */}
                                  {selectedService.deliverables.length > 0 && (
                                    <div>
                                      <h4 className="font-semibold mb-2">What You'll Get</h4>
                                      <ul className="list-disc list-inside space-y-1 text-gray-600">
                                        {selectedService.deliverables.map((del, index) => (
                                          <li key={index}>{del}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}

                                  {/* Lawyer Info */}
                                  <div className="border-t pt-4">
                                    <h4 className="font-semibold mb-3">About the Lawyer</h4>
                                    <div className="space-y-2">
                                      <div className="flex items-center gap-2">
                                        <Award className="h-4 w-4 text-gray-400" />
                                        <span>{selectedService.lawyer.experience} years of experience</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <FileText className="h-4 w-4 text-gray-400" />
                                        <span>Bar Council ID: {selectedService.lawyer.barCouncilId}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Star className="h-4 w-4 text-yellow-400" />
                                        <span>
                                          {selectedService.metrics.rating.toFixed(1)} rating 
                                          ({selectedService.metrics.reviewCount} reviews)
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <TrendingUp className="h-4 w-4 text-gray-400" />
                                        <span>{selectedService.metrics.casesHandled} cases handled</span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Contact Actions */}
                                  <div className="flex gap-3 pt-4 border-t">
                                    <Button className="flex-1 bg-legal-navy hover:bg-legal-navy/90">
                                      <MessageSquare className="h-4 w-4 mr-2" />
                                      Message Lawyer
                                    </Button>
                                    <Button 
                                      variant="outline" 
                                      className="flex-1"
                                      onClick={() => window.location.href = `tel:${selectedService.lawyer.phone}`}
                                    >
                                      <Phone className="h-4 w-4 mr-2" />
                                      Call Now
                                    </Button>
                                  </div>
                                </div>
                              </>
                            )}
                          </DialogContent>
                        </Dialog>
                        <Button className="flex-1 bg-legal-gold hover:bg-legal-gold/90 text-legal-navy">
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Contact
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default ServiceDiscovery;