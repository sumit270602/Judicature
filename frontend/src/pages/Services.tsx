import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Users, 
  MessageCircle, 
  Calendar,
  Bell, 
  Shield, 
  Search, 
  Clock,
  ArrowRight,
  CheckCircle,
  TrendingUp,
  Briefcase,
  Scale,
  Home,
  Gavel,
  Building,
  Settings
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useAuth } from '@/hooks/use-auth';
import { useNavigate } from 'react-router-dom';

const Services = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Platform Features - from FeaturesSection
  const platformFeatures = [
    {
      icon: FileText,
      title: 'AI Case Analysis',
      description: 'Intelligent document analysis and case summarization powered by advanced AI technology.',
      badge: 'AI Powered',
      color: 'bg-blue-500',
      link: '/case-analysis'
    },
    {
      icon: Users,
      title: 'Client Management',
      description: 'Comprehensive client profiles, communication history, and relationship management tools.',
      badge: 'Essential',
      color: 'bg-green-500',
      link: '/client-management'
    },
    {
      icon: MessageCircle,
      title: 'Real-time Communication',
      description: 'Secure messaging between lawyers and clients with document sharing capabilities.',
      badge: 'Secure',
      color: 'bg-purple-500',
      link: '/communication'
    },
    {
      icon: Calendar,
      title: 'Smart Scheduling',
      description: 'Automated appointment booking, calendar integration, and reminder notifications.',
      badge: 'Automated',
      color: 'bg-orange-500',
      link: '/scheduling'
    },
    {
      icon: Bell,
      title: 'Intelligent Alerts',
      description: 'Proactive notifications for deadlines, court dates, and important case updates.',
      badge: 'Smart',
      color: 'bg-red-500',
      link: '/alerts'
    },
    {
      icon: Shield,
      title: 'Enterprise Security',
      description: 'Bank-level encryption, compliance standards, and secure data management.',
      badge: 'Secure',
      color: 'bg-indigo-500',
      link: '/security'
    },
    {
      icon: Search,
      title: 'Advanced Search',
      description: 'Powerful search across all cases, documents, and client information with AI filters.',
      badge: 'Enhanced',
      color: 'bg-teal-500',
      link: '/search'
    },
    {
      icon: Clock,
      title: 'Time Tracking',
      description: 'Automated time tracking for billable hours with detailed reporting and analytics.',
      badge: 'Automated',
      color: 'bg-yellow-500',
      link: '/time-tracking'
    },
  ];

  // Legal Service Categories
  const serviceCategories = [
    { 
      id: 'personal_family', 
      name: 'Personal / Family Law',
      description: 'Divorce, custody, family disputes',
      icon: '👨‍👩‍👧‍👦',
      color: 'bg-pink-500',
      services: ['Divorce', 'Family Dispute', 'Child Custody', 'Muslim Law', 'Medical Negligence', 'Motor Accident']
    },
    { 
      id: 'criminal_property', 
      name: 'Criminal / Property Law',
      description: 'Criminal cases, property disputes',
      icon: '⚖️',
      color: 'bg-red-500',
      services: ['Criminal Case', 'Property Dispute', 'Landlord Tenant', 'Cyber Crime', 'Wills Trusts', 'Labour Service']
    },
    { 
      id: 'civil_debt', 
      name: 'Civil / Debt Matters',
      description: 'Documentation, consumer cases',
      icon: '📋',
      color: 'bg-blue-500',
      services: ['Documentation', 'Consumer Court', 'Civil Case', 'Cheque Bounce', 'Recovery']
    },
    { 
      id: 'corporate_law', 
      name: 'Corporate Law',
      description: 'Business, trademark, compliance',
      icon: '🏢',
      color: 'bg-purple-500',
      services: ['Arbitration', 'Trademark Copyright', 'Customs Excise', 'Startup Legal', 'Banking Finance', 'GST Matters', 'Corporate Compliance']
    },
    { 
      id: 'others', 
      name: 'Other Services',
      description: 'Specialized legal services',
      icon: '🔧',
      color: 'bg-gray-500',
      services: ['Armed Forces Tribunal', 'Supreme Court', 'Insurance Claims', 'Immigration', 'International Law', 'Other']
    }
  ];

  const handleServiceSelect = (categoryId: string) => {
    if (user) {
      navigate(`/create-case?category=${categoryId}`);
    } else {
      navigate('/register');
    }
  };

  const handleFeatureSelect = (link: string) => {
    if (user) {
      navigate(link);
    } else {
      navigate('/register');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-24 pb-16 bg-gradient-to-br from-legal-navy via-blue-900 to-blue-800 relative overflow-hidden">
        <div className="hero-pattern absolute inset-0"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center text-white">
            <Badge className="mb-6 bg-legal-gold text-black hover:bg-legal-gold/90">
              ⚡ Comprehensive Legal Solutions
            </Badge>
            <h1 className="text-5xl lg:text-6xl font-playfair font-bold mb-6 leading-tight">
              Everything You Need for
              <span className="text-legal-gold block">Modern Legal Practice</span>
            </h1>
            <p className="text-xl text-blue-100 mb-8 leading-relaxed max-w-3xl mx-auto">
              Discover our comprehensive suite of features and legal services designed to transform your legal workflow and enhance client satisfaction.
            </p>
            
            {!user && (
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  className="bg-legal-gold text-black hover:bg-legal-gold/90 px-8"
                  onClick={() => navigate('/register')}
                >
                  Get Started Today
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-white text-white hover:bg-white hover:text-legal-navy px-8"
                  onClick={() => navigate('/about')}
                >
                  Learn More
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Platform Features Section */}
        <section className="mb-20">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-legal-navy text-white">
              🚀 Platform Features
            </Badge>
            <h2 className="text-4xl font-playfair font-bold text-gray-900 mb-4">
              Advanced Legal Technology Platform
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Powerful tools and features designed to streamline your legal practice and improve efficiency.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {platformFeatures.map((feature, index) => (
              <Card key={index} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <div className={`${feature.color} p-3 rounded-lg`}>
                      <feature.icon className="h-6 w-6 text-white" />
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {feature.badge}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm text-gray-600 mb-4">
                    {feature.description}
                  </CardDescription>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full group-hover:bg-legal-navy group-hover:text-white transition-colors"
                    onClick={() => handleFeatureSelect(feature.link)}
                  >
                    {user ? 'Try Now' : 'Learn More'}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Legal Services Section */}
        <section>
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-legal-gold text-black">
              ⚖️ Legal Services
            </Badge>
            <h2 className="text-4xl font-playfair font-bold text-gray-900 mb-4">
              Complete Legal Service Directory
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Browse our comprehensive range of legal services across all major practice areas. 
              {user ? ' Click on any category to start a new case.' : ' Sign up to connect with qualified legal professionals.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {serviceCategories.map((category) => (
              <Card key={category.id} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`${category.color} p-3 rounded-lg`}>
                      <span className="text-2xl">{category.icon}</span>
                    </div>
                    <div>
                      <CardTitle className="text-xl">{category.name}</CardTitle>
                      <CardDescription className="text-sm">
                        {category.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 mb-6">
                    {category.services.slice(0, 4).map((service, idx) => (
                      <div key={idx} className="flex items-center text-sm text-gray-600">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                        {service}
                      </div>
                    ))}
                    {category.services.length > 4 && (
                      <div className="text-sm text-gray-500 italic">
                        +{category.services.length - 4} more services
                      </div>
                    )}
                  </div>
                  <Button 
                    className="w-full group-hover:bg-legal-navy group-hover:text-white transition-colors"
                    variant="outline"
                    onClick={() => handleServiceSelect(category.id)}
                  >
                    {user ? 'Start Case' : 'Get Started'}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        {!user && (
          <section className="mt-20 text-center">
            <Card className="bg-gradient-to-br from-legal-navy to-blue-800 text-white border-none">
              <CardContent className="py-16 px-8">
                <h3 className="text-3xl font-bold mb-4">
                  Ready to Transform Your Legal Practice?
                </h3>
                <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
                  Join thousands of legal professionals who have revolutionized their practice with Judicature's comprehensive platform.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    size="lg" 
                    className="bg-legal-gold text-black hover:bg-legal-gold/90 px-8"
                    onClick={() => navigate('/register')}
                  >
                    Start Free Trial
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="border-white text-white hover:bg-white hover:text-legal-navy px-8"
                    onClick={() => navigate('/contact')}
                  >
                    Contact Sales
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default Services;