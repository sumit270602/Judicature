import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Scale, Eye, EyeOff, User, Briefcase, Award, FileText, ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { LawyerProfile } from '@/types/auth';
import OAuthProviders from '@/components/auth/OAuthProviders';
import Header from '@/components/Header';

const PRACTICE_AREAS = [
  { value: 'civil', label: 'Civil Law' },
  { value: 'criminal', label: 'Criminal Law' },
  { value: 'family', label: 'Family Law' },
  { value: 'corporate', label: 'Corporate Law' },
  { value: 'property', label: 'Property Law' },
  { value: 'labor', label: 'Labor Law' },
  { value: 'tax', label: 'Tax Law' },
  { value: 'constitutional', label: 'Constitutional Law' },
  { value: 'intellectual', label: 'Intellectual Property' },
  { value: 'other', label: 'Other' }
];

const EnhancedRegister = () => {
  // Basic registration fields
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('client');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Lawyer-specific fields
  const [lawyerProfile, setLawyerProfile] = useState<LawyerProfile>({
    barCouncilId: '',
    practiceAreas: [],
    experience: 0,
    hourlyRate: 0,
    bio: '',
    phone: '',
    address: ''
  });
  
  const [loading, setLoading] = useState(false);
  const { signUp, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      if (user.role === 'client') {
        navigate('/client-dashboard');
      } else if (user.role === 'lawyer') {
        navigate('/lawyer-dashboard');
      } else {
        navigate('/');
      }
    }
  }, [user, navigate]);

  const validateStep = (currentStep: number): boolean => {
    switch (currentStep) {
      case 1:
        if (!name.trim() || !email.trim() || !password || !confirmPassword) {
          toast({
            title: "Validation Error",
            description: "Please fill in all required fields",
            variant: "destructive"
          });
          return false;
        }
        if (password !== confirmPassword) {
          toast({
            title: "Validation Error", 
            description: "Passwords do not match",
            variant: "destructive"
          });
          return false;
        }
        if (password.length < 6) {
          toast({
            title: "Validation Error",
            description: "Password must be at least 6 characters",
            variant: "destructive"
          });
          return false;
        }
        return true;
        
      case 2:
        if (role === 'lawyer') {
          if (!lawyerProfile.barCouncilId.trim() || !lawyerProfile.phone.trim()) {
            toast({
              title: "Validation Error",
              description: "Bar Council ID and phone number are required for lawyers",
              variant: "destructive"
            });
            return false;
          }
          if (lawyerProfile.practiceAreas.length === 0) {
            toast({
              title: "Validation Error", 
              description: "Please select at least one practice area",
              variant: "destructive"
            });
            return false;
          }
        }
        return true;
        
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const togglePracticeArea = (area: string) => {
    setLawyerProfile(prev => ({
      ...prev,
      practiceAreas: prev.practiceAreas.includes(area)
        ? prev.practiceAreas.filter(a => a !== area)
        : [...prev.practiceAreas, area]
    }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep(step)) return;

    setLoading(true);
    
    try {
      const userData = {
        name: name.trim(),
        email: email.trim(),
        password,
        role,
        ...(role === 'lawyer' && lawyerProfile)
      };

      const { error } = await signUp(name.trim(), email.trim(), password, role, role === 'lawyer' ? lawyerProfile : undefined);
      
      if (error) {
        toast({
          title: "Registration Failed",
          description: error.message || 'Failed to create account',
          variant: "destructive"
        });
      } else {
        toast({
          title: "Registration Successful",
          description: role === 'lawyer' 
            ? "Your account has been created. Please wait for verification to access all features."
            : "Welcome to Judicature! Your account has been created successfully.",
        });
      }
    } catch (err) {
      toast({
        title: "Registration Failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    }
    
    setLoading(false);
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {[1, 2, 3].map((stepNum) => {
        const isActive = step === stepNum;
        const isCompleted = step > stepNum;
        const shouldShow = role === 'client' ? stepNum <= 2 : true;
        
        if (!shouldShow) return null;
        
        return (
          <div key={stepNum} className="flex items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                isCompleted
                  ? 'bg-legal-navy text-white'
                  : isActive
                  ? 'bg-legal-gold text-legal-navy'
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              {isCompleted ? <Check className="w-5 h-5" /> : stepNum}
            </div>
            {stepNum < (role === 'client' ? 2 : 3) && (
              <div className={`w-12 h-1 mx-2 ${
                step > stepNum ? 'bg-legal-navy' : 'bg-gray-200'
              }`} />
            )}
          </div>
        );
      })}
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-xl font-playfair font-semibold text-legal-navy mb-2">Basic Information</h3>
        <p className="text-sm text-gray-600">Let's start with your basic details</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Full Name *</Label>
        <Input
          id="name"
          placeholder="Enter your full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="email">Email Address *</Label>
        <Input
          id="email"
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <div className="space-y-3">
        <Label>I am a: *</Label>
        <RadioGroup value={role} onValueChange={setRole}>
          <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
            <RadioGroupItem value="client" id="client" />
            <Label htmlFor="client" className="flex items-center gap-3 cursor-pointer flex-1">
              <User className="h-5 w-5 text-legal-navy" />
              <div>
                <div className="font-medium text-gray-900">Client</div>
                <div className="text-sm text-gray-500">Seeking legal services</div>
              </div>
            </Label>
          </div>
          <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
            <RadioGroupItem value="lawyer" id="lawyer" />
            <Label htmlFor="lawyer" className="flex items-center gap-3 cursor-pointer flex-1">
              <Briefcase className="h-5 w-5 text-legal-gold" />
              <div>
                <div className="font-medium text-gray-900">Lawyer</div>
                <div className="text-sm text-gray-500">Providing legal services</div>
              </div>
            </Label>
          </div>
        </RadioGroup>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password *</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Create a password (min 6 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm Password *</Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="Confirm your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => {
    if (role === 'client') {
      return (
        <div className="space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mb-4">
              <Check className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-playfair font-semibold text-legal-navy mb-2">Ready to Get Started!</h3>
            <p className="text-gray-600">Your client account is ready to be created.</p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="text-center mb-6">
          <h3 className="text-xl font-playfair font-semibold text-legal-navy mb-2">Professional Information</h3>
          <p className="text-sm text-gray-600">Tell us about your legal practice</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="barCouncilId">Bar Council ID *</Label>
            <Input
              id="barCouncilId"
              placeholder="Enter your Bar Council ID"
              value={lawyerProfile.barCouncilId}
              onChange={(e) => setLawyerProfile(prev => ({ ...prev, barCouncilId: e.target.value }))}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number *</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="Enter your phone number"
              value={lawyerProfile.phone}
              onChange={(e) => setLawyerProfile(prev => ({ ...prev, phone: e.target.value }))}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Office Address</Label>
          <Textarea
            id="address"
            placeholder="Enter your office address"
            value={lawyerProfile.address}
            onChange={(e) => setLawyerProfile(prev => ({ ...prev, address: e.target.value }))}
            rows={2}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="experience">Years of Experience</Label>
            <Input
              id="experience"
              type="number"
              min="0"
              max="50"
              placeholder="Years of practice"
              value={lawyerProfile.experience || ''}
              onChange={(e) => setLawyerProfile(prev => ({ ...prev, experience: parseInt(e.target.value) || 0 }))}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="hourlyRate">Hourly Rate (₹)</Label>
            <Input
              id="hourlyRate"
              type="number"
              min="0"
              placeholder="Your hourly rate"
              value={lawyerProfile.hourlyRate || ''}
              onChange={(e) => setLawyerProfile(prev => ({ ...prev, hourlyRate: parseInt(e.target.value) || 0 }))}
            />
          </div>
        </div>

        <div className="space-y-3">
          <Label>Practice Areas * (Select at least one)</Label>
          <div className="grid grid-cols-2 gap-2">
            {PRACTICE_AREAS.map((area) => (
              <div
                key={area.value}
                className={`p-3 border rounded-lg cursor-pointer transition-all hover:shadow-sm ${
                  lawyerProfile.practiceAreas.includes(area.value)
                    ? 'border-legal-navy bg-legal-navy/5'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => togglePracticeArea(area.value)}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{area.label}</span>
                  {lawyerProfile.practiceAreas.includes(area.value) && (
                    <Check className="h-4 w-4 text-legal-navy" />
                  )}
                </div>
              </div>
            ))}
          </div>
          {lawyerProfile.practiceAreas.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {lawyerProfile.practiceAreas.map((area) => (
                <Badge key={area} variant="secondary" className="bg-legal-navy/10 text-legal-navy">
                  {PRACTICE_AREAS.find(p => p.value === area)?.label}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderStep3 = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-xl font-playfair font-semibold text-legal-navy mb-2">Professional Bio</h3>
        <p className="text-sm text-gray-600">Tell potential clients about yourself</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">Professional Bio</Label>
        <Textarea
          id="bio"
          placeholder="Tell us about your legal expertise, specializations, and what makes you unique..."
          value={lawyerProfile.bio}
          onChange={(e) => setLawyerProfile(prev => ({ ...prev, bio: e.target.value }))}
          rows={4}
          className="resize-none"
        />
        <p className="text-xs text-gray-500">This will be shown to potential clients</p>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <div className="flex items-start gap-3">
          <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900 mb-2">Next Steps After Registration</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Upload verification documents (Bar Council certificate, etc.)</li>
              <li>• Admin will review your application within 24-48 hours</li>
              <li>• Once verified, you can start accepting cases</li>
              <li>• Update your profile anytime from your dashboard</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

  const totalSteps = role === 'client' ? 2 : 3;
  const isLastStep = step === totalSteps;

  return (
    <div className="min-h-screen bg-gradient-to-br from-legal-navy via-blue-900 to-blue-800">
      <Header />
      <div className="flex items-center justify-center min-h-screen p-4 pt-20">
      <div className="w-full max-w-2xl">
        <Card className="shadow-2xl border-0 backdrop-blur-sm bg-white/95">
          <CardHeader className="text-center space-y-4 pb-6">
            <div className="flex items-center justify-center">
              <div className="bg-gradient-to-br from-legal-navy to-blue-800 p-4 rounded-2xl shadow-lg">
                <Scale className="h-10 w-10 text-white" />
              </div>
            </div>
            <CardTitle className="text-3xl font-playfair font-bold text-gray-900">
              Join Judicature
            </CardTitle>
            <CardDescription className="text-lg text-gray-600">
              Create your account to get started with our comprehensive legal platform
            </CardDescription>
          </CardHeader>
        
          <CardContent className="p-8">
          {renderStepIndicator()}
          
          <form onSubmit={handleRegister} className="space-y-6">
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}

            <div className="flex justify-between pt-6">
              {step > 1 ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
              ) : (
                <div />
              )}

              {!isLastStep ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  className="bg-legal-navy hover:bg-legal-navy/90 flex items-center gap-2"
                >
                  Next
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button 
                  type="submit" 
                  className="bg-legal-gold hover:bg-legal-gold/90 text-legal-navy font-semibold flex items-center gap-2"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-legal-navy border-t-transparent rounded-full animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      <Award className="h-4 w-4" />
                      Create {role === 'lawyer' ? 'Lawyer' : 'Client'} Account
                    </>
                  )}
                </Button>
              )}
            </div>
          </form>
          
          <OAuthProviders className="mt-6" disabled={loading} buttonText="Sign up with Google" />
          
          <div className="mt-6 text-center space-y-2">
            <div className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-legal-navy hover:underline font-medium">
                Sign in
              </Link>
            </div>
          </div>
        </CardContent>
        </Card>
      </div>
      </div>
    </div>
  );
};

export default EnhancedRegister;