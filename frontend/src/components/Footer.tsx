
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Scale } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const footerLinks = {
    Product: [
      { name: 'Features', href: '/features' },
      { name: 'Pricing', href: '/pricing' },
      { name: 'Security', href: '/security' },
      { name: 'Search', href: '/search' },
      { name: 'Time Tracking', href: '/time-tracking' }
    ],
    Company: [
      { name: 'About', href: '/about' },
      { name: 'Contact', href: '/contact' },
      { name: 'Testimonials', href: '/testimonials' },
      { name: 'Blog', href: '#' },
      { name: 'Careers', href: '#' }
    ],
    Support: [
      { name: 'Help Center', href: '#' },
      { name: 'Documentation', href: '#' },
      { name: 'Contact Support', href: '/contact' },
      { name: 'Community', href: '#' },
      { name: 'Status', href: '#' }
    ],
    Legal: [
      { name: 'Privacy Policy', href: '#' },
      { name: 'Terms of Service', href: '#' },
      { name: 'Cookie Policy', href: '#' },
      { name: 'GDPR', href: '#' },
      { name: 'Compliance', href: '#' }
    ],
  };

  return (
    <footer className="bg-legal-navy text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Newsletter Section */}
        <div className="py-12 border-b border-blue-800">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-2xl font-playfair font-bold mb-2">
                Stay Updated with Legal Tech News
              </h3>
              <p className="text-blue-200">
                Get the latest updates on legal technology, new features, and industry insights.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                placeholder="Enter your email"
                className="bg-white/10 border-white/20 text-white placeholder:text-blue-200"
              />
              <Button className="bg-legal-gold text-black hover:bg-legal-gold/90 px-8">
                Subscribe
              </Button>
            </div>
          </div>
        </div>

        {/* Main Footer Content */}
        <div className="py-12">
          <div className="grid lg:grid-cols-6 gap-8">
            {/* Brand Section */}
            <div className="lg:col-span-2">
              <Link to="/" className="flex items-center space-x-2 mb-4">
                <div className="bg-legal-gold p-2 rounded-lg">
                  <Scale className="h-6 w-6 text-black" />
                </div>
                <span className="text-2xl font-playfair font-bold">
                  Judicature
                </span>
              </Link>
              <p className="text-blue-200 mb-6 leading-relaxed">
                Empowering legal professionals with cutting-edge technology to deliver exceptional client service and streamline practice management.
              </p>
              <div className="flex space-x-4">
                <Button variant="ghost" size="sm" className="text-blue-200 hover:text-white hover:bg-white/10">
                  Twitter
                </Button>
                <Button variant="ghost" size="sm" className="text-blue-200 hover:text-white hover:bg-white/10">
                  LinkedIn
                </Button>
                <Button variant="ghost" size="sm" className="text-blue-200 hover:text-white hover:bg-white/10">
                  Facebook
                </Button>
              </div>
            </div>

            {/* Footer Links */}
            {Object.entries(footerLinks).map(([category, links]) => (
              <div key={category}>
                <h4 className="font-semibold mb-4">{category}</h4>
                <ul className="space-y-2">
                  {links.map((link) => (
                    <li key={link.name}>
                      {link.href.startsWith('#') ? (
                        <a
                          href={link.href}
                          className="text-blue-200 hover:text-white transition-colors text-sm"
                        >
                          {link.name}
                        </a>
                      ) : (
                        <Link
                          to={link.href}
                          className="text-blue-200 hover:text-white transition-colors text-sm"
                        >
                          {link.name}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Section */}
        <div className="py-6 border-t border-blue-800">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-blue-200 text-sm mb-4 md:mb-0">
              © 2024 Judicature. All rights reserved. Built with ❤️ for legal professionals.
            </div>
            <div className="flex items-center space-x-6 text-sm text-blue-200">
              <Link to="/security" className="hover:text-white transition-colors">
                Security
              </Link>
              <a href="#" className="hover:text-white transition-colors">
                Compliance
              </a>
              <a href="#" className="hover:text-white transition-colors">
                SOC 2 Type II
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
