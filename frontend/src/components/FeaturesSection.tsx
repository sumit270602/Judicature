
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Users, 
  Bell, 
  Search, 
  Shield, 
  Clock,
  MessageCircle,
  Calendar
} from 'lucide-react';

const FeaturesSection = () => {
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
    <section id="features" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-legal-navy text-white">
            ⚡ Powerful Features
          </Badge>
          <h2 className="text-4xl font-playfair font-bold text-gray-900 mb-4">
            Everything You Need for Modern Legal Practice
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Discover how our comprehensive suite of features can transform your legal workflow and enhance client satisfaction.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-0 shadow-sm cursor-pointer"
              onClick={() => window.location.href = feature.link}
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
                <CardDescription className="text-gray-600">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Feature Highlight */}
        <div className="mt-16">
          <Card className="bg-gradient-to-r from-legal-navy to-blue-800 text-white border-0">
            <CardContent className="p-8">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <Badge className="mb-4 bg-legal-gold text-black">
                    🤖 AI Innovation
                  </Badge>
                  <h3 className="text-3xl font-playfair font-bold mb-4">
                    AI-Powered Legal Assistant
                  </h3>
                  <p className="text-blue-100 mb-6 leading-relaxed">
                    Our advanced AI assistant helps with case research, document drafting, and provides intelligent insights to accelerate your legal work.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {['Smart Suggestions', 'Document Analysis', 'Case Research', 'Legal Insights'].map((tag) => (
                      <Badge key={tag} variant="secondary" className="bg-white/10 text-white border-white/20">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="relative">
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        <span className="text-sm text-blue-100">AI Assistant Active</span>
                      </div>
                      <div className="h-2 bg-white/20 rounded animate-pulse"></div>
                      <div className="h-2 bg-white/20 rounded w-3/4 animate-pulse"></div>
                      <div className="h-2 bg-white/20 rounded w-1/2 animate-pulse"></div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
