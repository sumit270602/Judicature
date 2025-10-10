import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Menu, Scale, User, LogOut, LayoutDashboard } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [address, setAddress] = useState("/");
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const goToDashboard = () => {
    if (user?.role === 'client') {
      navigate('/dashboard/client');
    } else if (user?.role === 'lawyer') {
      navigate('/dashboard/lawyer');
    } else if (user?.role === 'admin') {
      navigate('/dashboard/admin');
    }
  };

  const getDashboardPath = () => {
    if (user?.role === 'client') {
      return '/dashboard/client';
    } else if (user?.role === 'lawyer') {
      return '/dashboard/lawyer';
    } else if (user?.role === 'admin') {
      return '/dashboard/admin';
    }
    return '/';
  };

  // Legal service categories for authenticated users
  const legalServices = [
    {
      category: "Personal & Family Law",
      services: [
        { name: "Divorce", href: "/services?category=family&type=divorce" },
        { name: "Family Dispute", href: "/services?category=family&type=dispute" },
        { name: "Child Custody", href: "/services?category=family&type=custody" },
        { name: "Adoption", href: "/services?category=family&type=adoption" },
        { name: "Property Settlement", href: "/services?category=family&type=property" }
      ]
    },
    {
      category: "Corporate Law",
      services: [
        { name: "Business Registration", href: "/services?category=corporate&type=registration" },
        { name: "Contract Review", href: "/services?category=corporate&type=contract" },
        { name: "Compliance", href: "/services?category=corporate&type=compliance" },
        { name: "Mergers & Acquisitions", href: "/services?category=corporate&type=ma" }
      ]
    },
    {
      category: "Criminal Law",
      services: [
        { name: "Criminal Defense", href: "/services?category=criminal&type=defense" },
        { name: "Bail Applications", href: "/services?category=criminal&type=bail" },
        { name: "Appeals", href: "/services?category=criminal&type=appeals" }
      ]
    },
    {
      category: "Civil Law",
      services: [
        { name: "Property Disputes", href: "/services?category=civil&type=property" },
        { name: "Consumer Protection", href: "/services?category=civil&type=consumer" },
        { name: "Tort Claims", href: "/services?category=civil&type=tort" }
      ]
    }
  ];

  // Dynamic navigation based on authentication status
  const navigation = user ? [
    { name: 'Dashboard', href: getDashboardPath() },
    { name: 'About', href: '/about' },
    { name: 'Testimonials', href: '/testimonials' },
    { name: 'Contact', href: '/contact' },
  ] : [
    { name: 'Home', href: '/' },
    { name: 'Services', href: '/services' },
    { name: 'Features', href: '/features' },
    { name: 'About', href: '/about' },
    { name: 'Testimonials', href: '/testimonials' },
    { name: 'Pricing', href: '/pricing' },
    { name: 'Contact', href: '/contact' },
  ];

  const handleClick = () => {

    // if (user) {
    //   if (user.address === 'client') {
    //     setAddress('/dashboard/client');
    //   } else if (user.address === 'lawyer') {
    //     setAddress('/dashboard/lawyer');
    //   }
    // } else {
    //   setAddress('/');
    // }
    setAddress('/');
  }

  return (
    <header className="fixed top-0 w-full bg-white/95 backdrop-blur-sm border-b border-gray-200 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to={address} onClick={handleClick} className="flex items-center space-x-2">
            <div className="bg-legal-navy p-2 rounded-lg">
              <Scale className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-playfair font-bold text-legal-navy">
              Judicature
            </span>
          </Link>

          {/* Desktop Navigation */}
          <NavigationMenu className="hidden md:flex">
            <NavigationMenuList>
              {navigation.map((item) => (
                <NavigationMenuItem key={item.name}>
                  <NavigationMenuLink asChild>
                    <Link
                      to={item.href}
                      className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50"
                    >
                      {item.name}
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              ))}
              
              {/* Services Dropdown for Authenticated Users */}
              {user && (
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="h-10 px-4 py-2 text-sm font-medium">
                    Services
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="grid gap-3 p-6 w-[800px] grid-cols-2">
                      {legalServices.map((category) => (
                        <div key={category.category} className="space-y-2">
                          <h4 className="text-sm font-semibold text-legal-navy border-b border-gray-200 pb-1">
                            {category.category}
                          </h4>
                          <ul className="space-y-1">
                            {category.services.map((service) => (
                              <li key={service.name}>
                                <NavigationMenuLink asChild>
                                  <Link
                                    to={service.href}
                                    className="block select-none space-y-1 rounded-md p-2 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground text-sm"
                                  >
                                    {service.name}
                                  </Link>
                                </NavigationMenuLink>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              )}
            </NavigationMenuList>
          </NavigationMenu>

          {/* Auth Buttons / User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <User className="h-4 w-4 mr-2" />
                    {user.email}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={goToDashboard}>
                    <LayoutDashboard className="h-4 w-4 mr-2" />
                    Go to Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => signOut()}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/login">Login</Link>
                </Button>
                <Button size="sm" className="bg-legal-navy hover:bg-legal-navy/90" asChild>
                  <Link to="/register">Get Started</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="sm">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <div className="flex flex-col space-y-4 mt-8">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className="text-lg font-medium hover:text-legal-navy transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}
                
                {/* Mobile Services for Authenticated Users */}
                {user && (
                  <div className="space-y-4">
                    <div className="text-lg font-medium text-legal-navy border-b border-gray-200 pb-2">
                      Services
                    </div>
                    {legalServices.map((category) => (
                      <div key={category.category} className="space-y-2">
                        <h4 className="text-sm font-semibold text-gray-700">
                          {category.category}
                        </h4>
                        <ul className="space-y-1 ml-4">
                          {category.services.map((service) => (
                            <li key={service.name}>
                              <Link
                                to={service.href}
                                className="text-sm text-gray-600 hover:text-legal-navy transition-colors"
                                onClick={() => setIsOpen(false)}
                              >
                                {service.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
                <div className="pt-4 border-t space-y-2">
                  {user ? (
                    <>
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start"
                        onClick={goToDashboard}
                      >
                        <LayoutDashboard className="h-4 w-4 mr-2" />
                        Go to Dashboard
                      </Button>
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start"
                        onClick={() => signOut()}
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign Out
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="ghost" className="w-full justify-start" asChild>
                        <Link to="/login">
                          <User className="h-4 w-4 mr-2" />
                          Login
                        </Link>
                      </Button>
                      <Button className="w-full bg-legal-navy hover:bg-legal-navy/90" asChild>
                        <Link to="/register">Get Started</Link>
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default Header;
