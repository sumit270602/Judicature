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
  Scale,
  Settings
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
      {/* Enhanced Profile Header */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
            <div className="relative">
              <Avatar className="h-24 w-24 ring-4 ring-white shadow-lg">
                <AvatarImage src="/api/placeholder/96/96" />
                <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white text-2xl font-bold">
                  {profile.name.split(' ').map(n => n.charAt(0)).join('')}
                </AvatarFallback>
              </Avatar>
              {!isEditing && (
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute -bottom-1 -right-1 h-8 w-8 p-0 rounded-full bg-white shadow-md hover:shadow-lg"
                >
                  <Camera className="h-4 w-4" />
                </Button>
              )}
            </div>
            
            <div className="flex-1 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <h2 className="text-3xl font-bold text-gray-900">{profile.name}</h2>
                {getVerificationBadge()}
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-blue-600" />
                  <span>{profile.email}</span>
                </div>
                {profile.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-green-600" />
                    <span>{profile.phone}</span>
                  </div>
                )}
                {profile.barCouncilId && (
                  <div className="flex items-center gap-2">
                    <Scale className="h-4 w-4 text-amber-600" />
                    <span>Bar ID: {profile.barCouncilId}</span>
                  </div>
                )}
              </div>

              {/* Professional Summary */}
              <div className="flex flex-wrap gap-4 text-sm">
                {profile.experience > 0 && (
                  <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-full">
                    <Briefcase className="h-4 w-4 text-purple-600" />
                    <span className="font-medium">{profile.experience} years experience</span>
                  </div>
                )}
                {profile.hourlyRate > 0 && (
                  <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-full">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <span className="font-medium">₹{profile.hourlyRate}/hour</span>
                  </div>
                )}
                {profile.practiceAreas.length > 0 && (
                  <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-full">
                    <Award className="h-4 w-4 text-indigo-600" />
                    <span className="font-medium">{profile.practiceAreas.length} practice areas</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex flex-col gap-3">
              {!isEditing && (
                <Button
                  onClick={() => setIsEditing(true)}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              )}
              <Button variant="outline" className="bg-white/50">
                <FileText className="h-4 w-4 mr-2" />
                View Public Profile
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Profile Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Profile Completeness Card */}
        <Card className={profileCompleteness === 100 ? "bg-green-50 border-green-200" : "bg-yellow-50 border-yellow-200"}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-full ${profileCompleteness === 100 ? 'bg-green-100' : 'bg-yellow-100'}`}>
                  {profileCompleteness === 100 ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Profile Completeness</h3>
                  <p className="text-sm text-gray-600">
                    {profileCompleteness === 100 ? 'Your profile is complete!' : 'Complete your profile for better visibility'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{profileCompleteness}%</p>
              </div>
            </div>
            <Progress 
              value={profileCompleteness} 
              className={`h-2 ${profileCompleteness === 100 ? 'bg-green-200' : 'bg-yellow-200'}`}
            />
            {profileCompleteness < 100 && (
              <div className="mt-3 text-xs text-gray-600">
                Complete missing sections to reach 100%
              </div>
            )}
          </CardContent>
        </Card>

        {/* Verification Status Card */}
        <Card className={
          profile.verificationStatus === 'verified' ? "bg-green-50 border-green-200" :
          profile.verificationStatus === 'rejected' ? "bg-red-50 border-red-200" :
          "bg-blue-50 border-blue-200"
        }>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-full ${
                  profile.verificationStatus === 'verified' ? 'bg-green-100' :
                  profile.verificationStatus === 'rejected' ? 'bg-red-100' :
                  'bg-blue-100'
                }`}>
                  {profile.verificationStatus === 'verified' ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : profile.verificationStatus === 'rejected' ? (
                    <X className="h-5 w-5 text-red-600" />
                  ) : (
                    <Clock className="h-5 w-5 text-blue-600" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Verification Status</h3>
                  <p className="text-sm text-gray-600">
                    {profile.verificationStatus === 'verified' ? 'Your account is verified' :
                     profile.verificationStatus === 'rejected' ? 'Verification rejected' :
                     'Verification in progress'}
                  </p>
                </div>
              </div>
            </div>
            
            {profile.verificationStatus === 'pending' && (
              <div className="space-y-3">
                <p className="text-xs text-gray-600">
                  Upload your bar council certificate and other documents to complete verification.
                </p>
                <Button variant="outline" size="sm" className="w-full bg-white">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Documents
                </Button>
              </div>
            )}
            
            {profile.verificationStatus === 'rejected' && (
              <div className="space-y-3">
                <p className="text-xs text-red-600">
                  Please review the feedback and resubmit your documents.
                </p>
                <Button variant="outline" size="sm" className="w-full bg-white border-red-200">
                  <FileText className="h-4 w-4 mr-2" />
                  View Feedback
                </Button>
              </div>
            )}
            
            {profile.verificationStatus === 'verified' && (
              <div className="flex items-center gap-2 text-xs text-green-600">
                <CheckCircle className="h-3 w-3" />
                <span>Verified by Judicature team</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

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

      {/* Enhanced Action Buttons */}
      {isEditing && (
        <Card className="bg-gray-50">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <AlertCircle className="h-4 w-4" />
                <span>Make sure all required fields are filled correctly</span>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={loading}
                  className="bg-white"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel Changes
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={loading || !profile.name || !profile.email || !profile.barCouncilId}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Saving Profile...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Profile
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Additional Profile Actions */}
      {!isEditing && (
        <Card className="bg-gradient-to-r from-gray-50 to-gray-100">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Profile Management</h3>
                <p className="text-sm text-gray-600">Manage your professional presence and settings</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" size="sm" className="bg-white">
                  <Upload className="h-4 w-4 mr-2" />
                  Update Photo
                </Button>
                <Button variant="outline" size="sm" className="bg-white">
                  <FileText className="h-4 w-4 mr-2" />
                  Download CV
                </Button>
                <Button variant="outline" size="sm" className="bg-white">
                  <Settings className="h-4 w-4 mr-2" />
                  Privacy Settings
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default LawyerProfileManagement;