import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  User, 
  Briefcase, 
  Award, 
  Phone, 
  Mail, 
  MapPin,
  Edit,
  Save,
  X,
  CheckCircle,
  AlertCircle,
  Upload,
  Camera,
  FileText,
  Clock,
  DollarSign,
  Scale
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { updateLawyerProfile } from '@/api';

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

interface LawyerProfile {
  name: string;
  email: string;
  phone: string;
  address: string;
  barCouncilId: string;
  practiceAreas: string[];
  experience: number;
  hourlyRate: number;
  bio: string;
  verificationStatus: 'pending' | 'verified' | 'rejected';
}

const LawyerProfileManagement: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<LawyerProfile>({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
    barCouncilId: user?.barCouncilId || '',
    practiceAreas: user?.practiceAreas || [],
    experience: user?.experience || 0,
    hourlyRate: user?.hourlyRate || 0,
    bio: user?.bio || '',
    verificationStatus: user?.verificationStatus || 'pending'
  });

  const getProfileCompleteness = () => {
    const requiredFields = ['name', 'email', 'phone', 'barCouncilId'];
    const optionalFields = ['address', 'bio'];
    const arrayFields = ['practiceAreas'];
    const numberFields = ['experience', 'hourlyRate'];

    let completed = 0;
    let total = requiredFields.length + optionalFields.length + arrayFields.length + numberFields.length;

    // Check required fields
    requiredFields.forEach(field => {
      if (profile[field as keyof LawyerProfile]) completed++;
    });

    // Check optional fields
    optionalFields.forEach(field => {
      if (profile[field as keyof LawyerProfile]) completed++;
    });

    // Check array fields
    arrayFields.forEach(field => {
      if (profile[field as keyof LawyerProfile] && (profile[field as keyof LawyerProfile] as string[]).length > 0) {
        completed++;
      }
    });

    // Check number fields
    numberFields.forEach(field => {
      if (profile[field as keyof LawyerProfile] && (profile[field as keyof LawyerProfile] as number) > 0) {
        completed++;
      }
    });

    return Math.round((completed / total) * 100);
  };

  const togglePracticeArea = (area: string) => {
    setProfile(prev => ({
      ...prev,
      practiceAreas: prev.practiceAreas.includes(area)
        ? prev.practiceAreas.filter(a => a !== area)
        : [...prev.practiceAreas, area]
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const updateData = {
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        address: profile.address,
        barCouncilId: profile.barCouncilId,
        practiceAreas: profile.practiceAreas,
        experience: profile.experience,
        hourlyRate: profile.hourlyRate,
        bio: profile.bio
      };

      await updateLawyerProfile(updateData);
      
      toast({
        title: "Profile Updated",
        description: "Your professional profile has been updated successfully.",
      });
      setIsEditing(false);
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.response?.data?.message || "Failed to update profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset to original values
    setProfile({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      address: user?.address || '',
      barCouncilId: user?.barCouncilId || '',
      practiceAreas: user?.practiceAreas || [],
      experience: user?.experience || 0,
      hourlyRate: user?.hourlyRate || 0,
      bio: user?.bio || '',
      verificationStatus: user?.verificationStatus || 'pending'
    });
    setIsEditing(false);
  };

  const getVerificationBadge = () => {
    switch (profile.verificationStatus) {
      case 'verified':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Verified
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            <X className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
    }
  };

  const profileCompleteness = getProfileCompleteness();

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar className="h-20 w-20">
                  <AvatarImage src="/api/placeholder/80/80" />
                  <AvatarFallback className="bg-legal-navy text-white text-xl font-semibold">
                    {profile.name.split(' ').map(n => n.charAt(0)).join('')}
                  </AvatarFallback>
                </Avatar>
                {!isEditing && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute -bottom-1 -right-1 h-8 w-8 p-0 rounded-full bg-white"
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-playfair font-bold text-legal-navy">{profile.name}</h2>
                  {getVerificationBadge()}
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    {profile.email}
                  </div>
                  {profile.phone && (
                    <div className="flex items-center gap-1">
                      <Phone className="h-4 w-4" />
                      {profile.phone}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {!isEditing && (
                <Button
                  onClick={() => setIsEditing(true)}
                  className="bg-legal-navy hover:bg-legal-navy/90"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Profile Completeness */}
      {profileCompleteness < 100 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Your profile is {profileCompleteness}% complete. Complete your profile to improve visibility to potential clients.
            <Progress value={profileCompleteness} className="mt-2" />
          </AlertDescription>
        </Alert>
      )}

      {/* Verification Status */}
      {profile.verificationStatus !== 'verified' && (
        <Alert className={profile.verificationStatus === 'rejected' ? 'border-red-200 bg-red-50' : 'border-yellow-200 bg-yellow-50'}>
          <FileText className="h-4 w-4" />
          <AlertDescription>
            {profile.verificationStatus === 'pending' && (
              <>
                Your account is pending verification. Upload your verification documents to complete the process.
                <Button variant="link" className="p-0 h-auto font-normal text-legal-navy">
                  Upload Documents
                </Button>
              </>
            )}
            {profile.verificationStatus === 'rejected' && (
              <>
                Your verification was rejected. Please review the feedback and resubmit your documents.
                <Button variant="link" className="p-0 h-auto font-normal text-red-600">
                  View Feedback
                </Button>
              </>
            )}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-legal-navy" />
              Basic Information
            </CardTitle>
            <CardDescription>Your personal and contact details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={profile.name}
                  onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                  disabled={!isEditing}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                  disabled={!isEditing}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={profile.phone}
                  onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                  disabled={!isEditing}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="address">Office Address</Label>
                <Textarea
                  id="address"
                  value={profile.address}
                  onChange={(e) => setProfile(prev => ({ ...prev, address: e.target.value }))}
                  disabled={!isEditing}
                  rows={3}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Professional Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-legal-navy" />
              Professional Details
            </CardTitle>
            <CardDescription>Your legal practice information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="barCouncilId">Bar Council ID *</Label>
              <Input
                id="barCouncilId"
                value={profile.barCouncilId}
                onChange={(e) => setProfile(prev => ({ ...prev, barCouncilId: e.target.value }))}
                disabled={!isEditing}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="experience">Years of Experience</Label>
                <div className="relative">
                  <Input
                    id="experience"
                    type="number"
                    min="0"
                    max="50"
                    value={profile.experience}
                    onChange={(e) => setProfile(prev => ({ ...prev, experience: parseInt(e.target.value) || 0 }))}
                    disabled={!isEditing}
                  />
                  <Clock className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="hourlyRate">Hourly Rate (₹)</Label>
                <div className="relative">
                  <Input
                    id="hourlyRate"
                    type="number"
                    min="0"
                    value={profile.hourlyRate}
                    onChange={(e) => setProfile(prev => ({ ...prev, hourlyRate: parseInt(e.target.value) || 0 }))}
                    disabled={!isEditing}
                  />
                  <DollarSign className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Practice Areas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scale className="h-5 w-5 text-legal-navy" />
              Practice Areas
            </CardTitle>
            <CardDescription>Areas of legal expertise</CardDescription>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <div className="grid grid-cols-2 gap-2">
                {PRACTICE_AREAS.map((area) => (
                  <div
                    key={area.value}
                    className={`p-3 border rounded-lg cursor-pointer transition-all hover:shadow-sm ${
                      profile.practiceAreas.includes(area.value)
                        ? 'border-legal-navy bg-legal-navy/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => togglePracticeArea(area.value)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{area.label}</span>
                      {profile.practiceAreas.includes(area.value) && (
                        <CheckCircle className="h-4 w-4 text-legal-navy" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {profile.practiceAreas.length > 0 ? (
                  profile.practiceAreas.map((area) => (
                    <Badge key={area} variant="secondary" className="bg-legal-navy/10 text-legal-navy">
                      {PRACTICE_AREAS.find(p => p.value === area)?.label}
                    </Badge>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">No practice areas selected</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Professional Bio */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-legal-navy" />
              Professional Bio
            </CardTitle>
            <CardDescription>Tell potential clients about yourself</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Textarea
                placeholder="Describe your legal expertise, specializations, achievements, and what makes you unique..."
                value={profile.bio}
                onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                disabled={!isEditing}
                rows={6}
                className="resize-none"
              />
              <p className="text-xs text-gray-500">
                {profile.bio.length}/500 characters
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      {isEditing && (
        <div className="flex items-center justify-end gap-3 pt-6">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={loading}
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading}
            className="bg-legal-gold hover:bg-legal-gold/90 text-legal-navy"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-legal-navy border-t-transparent rounded-full animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

export default LawyerProfileManagement;