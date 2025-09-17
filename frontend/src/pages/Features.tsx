
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  Users, 
  Bell, 
  Search, 
  Shield, 
  Clock,
  MessageCircle,
  Calendar,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const Features = () => {
  const features = [
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-legal-navy text-white">
              ⚡ All Features
            </Badge>
            <h1 className="text-4xl font-playfair font-bold text-gray-900 mb-4">
              Complete Feature Overview
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Explore all the powerful features that make Judicature the ultimate legal practice management solution.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-0 shadow-sm"
              >
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-3 rounded-lg ${feature.color} group-hover:scale-110 transition-transform duration-300`}>
                      <feature.icon className="h-6 w-6 text-white" />
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {feature.badge}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg font-semibold text-gray-900 group-hover:text-legal-navy transition-colors">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600 mb-4">
                    {feature.description}
                  </CardDescription>
                  <Button asChild className="w-full bg-legal-navy hover:bg-legal-navy/90">
                    <Link to={feature.link}>
                      Explore Feature
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Features;
