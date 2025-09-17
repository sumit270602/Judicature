
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Target, 
  Users, 
  Shield, 
  Zap,
  ArrowRight
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const About = () => {
  const values = [
    {
      icon: Target,
      title: 'Precision',
      description: 'Every feature is designed with legal accuracy and attention to detail.',
    },
    {
      icon: Users,
      title: 'Client-Focused',
      description: 'Built by lawyers, for lawyers, with client satisfaction at the core.',
    },
    {
      icon: Shield,
      title: 'Security First',
      description: 'Enterprise-grade security protecting sensitive legal information.',
    },
    {
      icon: Zap,
      title: 'Innovation',
      description: 'Leveraging cutting-edge AI to transform legal practice.',
    },
  ];

  const milestones = [
    { year: '2020', title: 'Founded', description: 'Started with a vision to modernize legal practice' },
    { year: '2021', title: 'First Release', description: 'Launched MVP with core case management features' },
    { year: '2022', title: 'AI Integration', description: 'Introduced AI-powered document analysis' },
    { year: '2023', title: 'Enterprise Scale', description: 'Serving 1000+ law firms worldwide' },
    { year: '2024', title: 'Next Generation', description: 'Advanced AI assistant and mobile apps' },
  ];

  return (
    <div className="min-h-screen">
      <Header />
      
      <div className="pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-legal-navy text-white">
              🏛️ About Judicature
            </Badge>
            <h1 className="text-4xl font-playfair font-bold text-gray-900 mb-4">
              Transforming Legal Practice Through Technology
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Founded by legal professionals who understood the challenges of modern practice, 
              Judicature bridges the gap between traditional law and innovative technology.
            </p>
          </div>

          {/* Mission Statement */}
          <div className="mb-16">
            <Card className="bg-gradient-to-r from-legal-navy to-blue-800 text-white border-0">
              <CardContent className="p-8 text-center">
                <h2 className="text-3xl font-playfair font-bold mb-4">Our Mission</h2>
                <p className="text-xl text-blue-100 max-w-4xl mx-auto leading-relaxed">
                  To empower legal professionals with intelligent technology that enhances client service, 
                  streamlines operations, and ensures the highest standards of legal practice in the digital age.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Values */}
          <div className="mb-16">
            <h2 className="text-3xl font-playfair font-bold text-center text-gray-900 mb-12">
              Our Core Values
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {values.map((value, index) => (
                <Card key={index} className="text-center border-0 shadow-sm hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="bg-legal-navy p-3 rounded-full w-fit mx-auto mb-4">
                      <value.icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">{value.title}</h3>
                    <p className="text-gray-600 text-sm">{value.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Timeline */}
          <div className="mb-16">
            <h2 className="text-3xl font-playfair font-bold text-center text-gray-900 mb-12">
              Our Journey
            </h2>
            <div className="relative">
              {/* Timeline Line */}
              <div className="absolute left-1/2 transform -translate-x-px h-full w-0.5 bg-legal-navy hidden md:block"></div>
              
              {milestones.map((milestone, index) => (
                <div key={index} className={`relative flex items-center mb-8 ${index % 2 === 0 ? 'md:flex-row-reverse' : ''}`}>
                  {/* Timeline Dot */}
                  <div className="absolute left-1/2 transform -translate-x-1/2 w-4 h-4 bg-legal-navy rounded-full hidden md:block"></div>
                  
                  {/* Content */}
                  <div className={`w-full md:w-5/12 ${index % 2 === 0 ? 'md:pr-8' : 'md:pl-8'}`}>
                    <Card className="border-0 shadow-sm">
                      <CardContent className="p-6">
                        <div className="flex items-center mb-2">
                          <Badge className="bg-legal-gold text-black mr-3">
                            {milestone.year}
                          </Badge>
                          <h3 className="font-semibold text-gray-900">{milestone.title}</h3>
                        </div>
                        <p className="text-gray-600">{milestone.description}</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Team Section */}
          <div className="text-center">
            <h2 className="text-3xl font-playfair font-bold text-gray-900 mb-4">
              Built by Legal Experts
            </h2>
            <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
              Our team combines deep legal expertise with cutting-edge technology to create solutions 
              that truly understand the needs of modern legal practice.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button className="bg-legal-navy hover:bg-legal-navy/90">
                Meet Our Team
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button variant="outline">
                Join Our Mission
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default About;
