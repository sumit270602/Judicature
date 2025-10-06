import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Scale, User, Briefcase, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';
import { api } from '@/api';

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

const OAuthRoleSelection = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { signInWithOAuth } = useAuth();
  
  const [role, setRole] = useState('client');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [tempToken, setTempToken] = useState('');
  const [userName, setUserName] = useState('');
  
  // Lawyer profile state
  const [lawyerProfile, setLawyerProfile] = useState({
    barCouncilId: '',
    practiceAreas: [] as string[],
    experience: 0,
    hourlyRate: 0,
    bio: '',
    phone: '',
    address: ''
  });

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      toast.error('Invalid OAuth session. Please try signing in again.');
      navigate('/login');
      return;
    }
    
    setTempToken(token);
    
    // Decode token to get user info (basic client-side decode for display)
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.temp && payload.role === 'pending') {
        // Valid temporary token
        console.log('Valid temporary OAuth token');
      } else {
        throw new Error('Invalid token structure');
      }
    } catch (error) {
      toast.error('Invalid OAuth token. Please try signing in again.');
      navigate('/login');
    }
  }, [searchParams, navigate]);

  const togglePracticeArea = (area: string) => {
    setLawyerProfile(prev => ({
      ...prev,
      practiceAreas: prev.practiceAreas.includes(area)
        ? prev.practiceAreas.filter(a => a !== area)
        : [...prev.practiceAreas, area]
    }));
  };

  const validateLawyerProfile = () => {
    if (!lawyerProfile.barCouncilId.trim()) {
      toast.error('Bar Council ID is required');
      return false;
    }
    if (!lawyerProfile.phone.trim()) {
      toast.error('Phone number is required');
      return false;
    }
    if (lawyerProfile.practiceAreas.length === 0) {
      toast.error('Please select at least one practice area');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (role === 'lawyer') {
      setStep(2);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    if (role === 'lawyer' && !validateLawyerProfile()) {
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/auth/oauth/complete', {
        role,
        ...(role === 'lawyer' && { lawyerProfile })
      }, {
        headers: {
          'Authorization': `Bearer ${tempToken}`
        }
      });

      const { token, user } = response.data;
      
      // Use the OAuth sign-in method from AuthContext
      signInWithOAuth(user, token);
      
      toast.success('Registration completed successfully!');
      
      // Navigate to appropriate dashboard
      if (role === 'client') {
        navigate('/dashboard/client');
      } else {
        navigate('/dashboard/lawyer');
      }
      
    } catch (error: any) {
      console.error('OAuth completion error:', error);
      toast.error(error.response?.data?.message || 'Failed to complete registration');
    } finally {
      setLoading(false);
    }
  };

  const renderRoleSelection = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-playfair font-semibold text-legal-navy mb-2">
          Choose Your Role
        </h3>
        <p className="text-sm text-gray-600">
          Select how you'll be using Judicature
        </p>
      </div>

      <RadioGroup value={role} onValueChange={setRole}>
        <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
          <RadioGroupItem value="client" id="client" />
          <Label htmlFor="client" className="flex items-center gap-3 cursor-pointer flex-1">
            <User className="h-5 w-5 text-legal-navy" />
            <div>
              <div className="font-medium text-gray-900">Client</div>
              <div className="text-sm text-gray-500">Seeking legal services</div>
            </div>
          </Label>
        </div>
        
        <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
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

      <Button
        onClick={handleNext}
        className="w-full bg-legal-navy hover:bg-legal-navy/90"
        disabled={loading}
      >
        {role === 'lawyer' ? (
          <>
            Continue to Lawyer Details
            <ArrowRight className="h-4 w-4 ml-2" />
          </>
        ) : (
          <>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Complete Registration
          </>
        )}
      </Button>
    </div>
  );

  const renderLawyerDetails = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-playfair font-semibold text-legal-navy mb-2">
          Lawyer Professional Details
        </h3>
        <p className="text-sm text-gray-600">
          Complete your professional profile
        </p>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="experience">Years of Experience</Label>
          <Input
            id="experience"
            type="number"
            min="0"
            placeholder="Years of experience"
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
            placeholder="Hourly rate in rupees"
            value={lawyerProfile.hourlyRate || ''}
            onChange={(e) => setLawyerProfile(prev => ({ ...prev, hourlyRate: parseInt(e.target.value) || 0 }))}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Practice Areas *</Label>
        <div className="grid grid-cols-2 gap-2">
          {PRACTICE_AREAS.map((area) => (
            <div key={area.value} className="flex items-center space-x-2">
              <input
                type="checkbox"
                id={area.value}
                checked={lawyerProfile.practiceAreas.includes(area.value)}
                onChange={() => togglePracticeArea(area.value)}
                className="rounded border-gray-300"
              />
              <Label htmlFor={area.value} className="text-sm cursor-pointer">
                {area.label}
              </Label>
            </div>
          ))}
        </div>
        {lawyerProfile.practiceAreas.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {lawyerProfile.practiceAreas.map((area) => (
              <Badge key={area} variant="secondary" className="text-xs">
                {PRACTICE_AREAS.find(p => p.value === area)?.label}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Input
          id="address"
          placeholder="Your office/practice address"
          value={lawyerProfile.address}
          onChange={(e) => setLawyerProfile(prev => ({ ...prev, address: e.target.value }))}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">Professional Bio</Label>
        <Textarea
          id="bio"
          placeholder="Tell clients about your expertise and experience..."
          rows={4}
          value={lawyerProfile.bio}
          onChange={(e) => setLawyerProfile(prev => ({ ...prev, bio: e.target.value }))}
        />
      </div>

      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={() => setStep(1)}
          className="flex-1"
        >
          Back
        </Button>
        <Button
          onClick={handleSubmit}
          className="flex-1 bg-legal-navy hover:bg-legal-navy/90"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Creating Profile...
            </>
          ) : (
            'Complete Registration'
          )}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-legal-navy via-blue-900 to-blue-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-legal-navy p-3 rounded-lg">
              <Scale className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-playfair">Complete Your Profile</CardTitle>
          <CardDescription>
            Set up your Judicature account to get started
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {step === 1 ? renderRoleSelection() : renderLawyerDetails()}
        </CardContent>
      </Card>
    </div>
  );
};

export default OAuthRoleSelection;