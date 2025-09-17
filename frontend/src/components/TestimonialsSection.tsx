
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star } from 'lucide-react';

const TestimonialsSection = () => {
  const testimonials = [
    {
      name: 'Sarah Mitchell',
      role: 'Senior Partner',
      company: 'Mitchell & Associates',
      image: 'https://images.unsplash.com/photo-1494790108755-2616b75b6d1e?w=150&h=150&fit=crop&crop=face',
      rating: 5,
      quote: 'Judicature has revolutionized how we manage our cases. The AI-powered insights have saved us countless hours and improved our client satisfaction dramatically.',
    },
    {
      name: 'David Chen',
      role: 'Managing Attorney',
      company: 'Chen Legal Group',
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      rating: 5,
      quote: 'The client communication features are outstanding. Our clients love being able to track their case progress in real-time and communicate securely.',
    },
    {
      name: 'Emily Rodriguez',
      role: 'Solo Practitioner',
      company: 'Rodriguez Law',
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
      rating: 5,
      quote: 'As a solo practitioner, Judicature gives me the tools of a large firm. The automated reminders and document management are game-changers.',
    },
    {
      name: 'Michael Thompson',
      role: 'Chief Legal Officer',
      company: 'TechCorp Industries',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      rating: 5,
      quote: 'The security and compliance features give us complete confidence. Our legal team is more efficient than ever before.',
    },
    {
      name: 'Jessica Wang',
      role: 'Family Law Attorney',
      company: 'Wang & Partners',
      image: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150&h=150&fit=crop&crop=face',
      rating: 5,
      quote: 'The time tracking and billing integration have streamlined our entire practice. We can focus on what matters most - our clients.',
    },
    {
      name: 'Robert Johnson',
      role: 'Criminal Defense Lawyer',
      company: 'Johnson Defense',
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
      rating: 5,
      quote: 'Judicature understands the legal profession. Every feature is designed with lawyers in mind, making our daily work so much more efficient.',
    },
  ];

  return (
    <section id="testimonials" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-legal-gold text-black">
            ⭐ Client Success Stories
          </Badge>
          <h2 className="text-4xl font-playfair font-bold text-gray-900 mb-4">
            Trusted by Legal Professionals Worldwide
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Join thousands of satisfied legal professionals who have transformed their practice with Judicature.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card 
              key={index} 
              className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-0 shadow-md"
            >
              <CardContent className="p-6">
                {/* Rating */}
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>

                {/* Quote */}
                <blockquote className="text-gray-700 mb-6 leading-relaxed">
                  "{testimonial.quote}"
                </blockquote>

                {/* Author */}
                <div className="flex items-center space-x-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={testimonial.image} alt={testimonial.name} />
                    <AvatarFallback>
                      {testimonial.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold text-gray-900">{testimonial.name}</div>
                    <div className="text-sm text-gray-600">{testimonial.role}</div>
                    <div className="text-sm text-legal-navy font-medium">{testimonial.company}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Stats Section */}
        <div className="mt-16 bg-gray-50 rounded-2xl p-8">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-legal-navy mb-2">10,000+</div>
              <div className="text-gray-600">Active Users</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-legal-navy mb-2">50,000+</div>
              <div className="text-gray-600">Cases Managed</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-legal-navy mb-2">99.9%</div>
              <div className="text-gray-600">Uptime</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-legal-navy mb-2">4.9/5</div>
              <div className="text-gray-600">User Rating</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
