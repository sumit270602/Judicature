
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Check,
  X,
  Star,
  Users,
  Building,
  Zap
} from 'lucide-react';
import { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const Pricing = () => {
  const [isAnnual, setIsAnnual] = useState(false);

  const plans = [
    {
      name: 'Starter',
      icon: Users,
      description: 'Perfect for solo practitioners and small firms',
      monthlyPrice: 49,
      annualPrice: 39,
      features: [
        'Up to 50 active cases',
        'Basic client management',
        'Document storage (5GB)',
        'Email support',
        'Basic reporting',
        'Mobile app access'
      ],
      limitations: [
        'AI case analysis',
        'Advanced integrations',
        'Custom workflows'
      ],
      popular: false,
      color: 'bg-blue-500'
    },
    {
      name: 'Professional',
      icon: Building,
      description: 'Ideal for growing law firms and legal teams',
      monthlyPrice: 99,
      annualPrice: 79,
      features: [
        'Unlimited active cases',
        'Advanced client management',
        'Document storage (50GB)',
        'AI-powered case analysis',
        'Priority email & chat support',
        'Advanced reporting & analytics',
        'Calendar integration',
        'Time tracking & billing',
        'Team collaboration tools'
      ],
      limitations: [
        'White-label options',
        'Custom integrations'
      ],
      popular: true,
      color: 'bg-legal-navy'
    },
    {
      name: 'Enterprise',
      icon: Zap,
      description: 'Complete solution for large firms and organizations',
      monthlyPrice: 199,
      annualPrice: 159,
      features: [
        'Everything in Professional',
        'Unlimited document storage',
        'Custom AI training',
        'White-label solution',
        'Dedicated account manager',
        '24/7 phone support',
        'Custom integrations',
        'Advanced security features',
        'Single sign-on (SSO)',
        'Custom workflows',
        'API access'
      ],
      limitations: [],
      popular: false,
      color: 'bg-legal-gold'
    }
  ];

  return (
    <div className="min-h-screen">
      <Header />
      
      <div className="pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-legal-navy text-white">
              💰 Simple Pricing
            </Badge>
            <h1 className="text-4xl font-playfair font-bold text-gray-900 mb-4">
              Choose Your Perfect Plan
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Start with a free trial, then choose the plan that scales with your practice. 
              All plans include our core features with no hidden fees.
            </p>

            {/* Billing Toggle */}
            <div className="flex items-center justify-center space-x-4">
              <Label htmlFor="billing-toggle" className="text-sm">Monthly</Label>
              <Switch
                id="billing-toggle"
                checked={isAnnual}
                onCheckedChange={setIsAnnual}
              />
              <Label htmlFor="billing-toggle" className="text-sm">
                Annual 
                <Badge className="ml-2 bg-green-500 text-white text-xs">Save 20%</Badge>
              </Label>
            </div>
          </div>

          {/* Plans */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {plans.map((plan, index) => (
              <Card 
                key={index} 
                className={`relative border-0 shadow-lg hover:shadow-xl transition-all duration-300 ${
                  plan.popular ? 'ring-2 ring-legal-navy scale-105' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-legal-navy text-white px-4 py-1">
                      <Star className="w-3 h-3 mr-1" />
                      Most Popular
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-4">
                  <div className={`p-3 rounded-full w-fit mx-auto mb-4 ${plan.color}`}>
                    <plan.icon className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl font-playfair">{plan.name}</CardTitle>
                  <CardDescription className="text-gray-600">
                    {plan.description}
                  </CardDescription>
                  <div className="mt-4">
                    <div className="text-4xl font-bold text-gray-900">
                      ${isAnnual ? plan.annualPrice : plan.monthlyPrice}
                      <span className="text-lg text-gray-600 font-normal">/month</span>
                    </div>
                    {isAnnual && (
                      <div className="text-sm text-gray-500">
                        Billed annually (${plan.annualPrice * 12}/year)
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent>
                  <Button 
                    className={`w-full mb-6 ${
                      plan.popular 
                        ? 'bg-legal-navy hover:bg-legal-navy/90' 
                        : 'bg-gray-900 hover:bg-gray-800'
                    }`}
                  >
                    Start Free Trial
                  </Button>

                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-900 text-sm">What's included:</h4>
                    {plan.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-center space-x-3">
                        <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span className="text-sm text-gray-600">{feature}</span>
                      </div>
                    ))}
                    {plan.limitations.length > 0 && (
                      <>
                        <h4 className="font-semibold text-gray-900 text-sm mt-6">Not included:</h4>
                        {plan.limitations.map((limitation, limitIndex) => (
                          <div key={limitIndex} className="flex items-center space-x-3">
                            <X className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            <span className="text-sm text-gray-400">{limitation}</span>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* FAQ Section */}
          <div className="text-center">
            <h2 className="text-3xl font-playfair font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <div className="grid md:grid-cols-2 gap-8 mt-12">
              <Card className="text-left border-0 shadow-sm">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-gray-900 mb-2">Can I change plans anytime?</h3>
                  <p className="text-gray-600 text-sm">
                    Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately, 
                    and we'll prorate any billing differences.
                  </p>
                </CardContent>
              </Card>
              <Card className="text-left border-0 shadow-sm">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-gray-900 mb-2">Is there a free trial?</h3>
                  <p className="text-gray-600 text-sm">
                    Absolutely! All plans come with a 14-day free trial. No credit card required to start.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Pricing;
