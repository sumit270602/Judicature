
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, CheckCircle, Users, FileText, Clock } from 'lucide-react';

const HeroSection = () => {
  const stats = [
    { icon: Users, label: 'Active Users', value: '10,000+' },
    { icon: FileText, label: 'Cases Managed', value: '50,000+' },
    { icon: Clock, label: 'Time Saved', value: '80%' },
  ];

  const benefits = [
    'AI-Powered Case Analysis',
    'Smart Document Management',
    'Client-Lawyer Communication',
    'Automated Reminders',
  ];

  return (
    <section id="home" className="pt-16 pb-20 bg-gradient-to-br from-legal-navy via-blue-900 to-blue-800 relative overflow-hidden">
      <div className="hero-pattern absolute inset-0"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="text-white animate-fade-up">
            <Badge className="mb-6 bg-legal-gold text-black hover:bg-legal-gold/90">
              🚀 Next-Generation Legal Technology
            </Badge>
            
            <h1 className="text-5xl lg:text-6xl font-playfair font-bold mb-6 leading-tight">
              Revolutionize Your
              <span className="text-legal-gold block">Legal Practice</span>
            </h1>
            
            <p className="text-xl text-blue-100 mb-8 leading-relaxed">
              Streamline case management, enhance client communication, and leverage AI-powered insights to transform your legal workflow. Join thousands of legal professionals already using Judicature.
            </p>

            {/* Benefits List */}
            <div className="grid grid-cols-2 gap-3 mb-8">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-legal-gold flex-shrink-0" />
                  <span className="text-sm text-blue-100">{benefit}</span>
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <Button size="lg" className="bg-legal-gold text-black hover:bg-legal-gold/90 px-8">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-legal-navy px-8">
                Watch Demo
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <stat.icon className="h-8 w-8 text-legal-gold mx-auto mb-2" />
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="text-sm text-blue-200">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Content - Dashboard Preview */}
          <div className="relative animate-float">
            <Card className="p-6 bg-white/10 backdrop-blur-lg border-white/20 shadow-2xl">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-white font-semibold">Dashboard Preview</h3>
                  <Badge className="bg-green-500 text-white">Live</Badge>
                </div>
                
                <div className="space-y-3">
                  <div className="h-4 bg-white/20 rounded animate-pulse"></div>
                  <div className="h-4 bg-white/20 rounded w-3/4 animate-pulse"></div>
                  <div className="h-4 bg-white/20 rounded w-1/2 animate-pulse"></div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4">
                  <Card className="p-3 bg-white/5 border-white/10">
                    <div className="text-legal-gold text-2xl font-bold">247</div>
                    <div className="text-white text-sm">Active Cases</div>
                  </Card>
                  <Card className="p-3 bg-white/5 border-white/10">
                    <div className="text-legal-gold text-2xl font-bold">89%</div>
                    <div className="text-white text-sm">Success Rate</div>
                  </Card>
                </div>
              </div>
            </Card>

            {/* Floating Elements */}
            <div className="absolute -top-4 -right-4 bg-legal-gold p-3 rounded-full animate-pulse">
              <FileText className="h-6 w-6 text-black" />
            </div>
            <div className="absolute -bottom-4 -left-4 bg-green-500 p-3 rounded-full animate-pulse delay-300">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
