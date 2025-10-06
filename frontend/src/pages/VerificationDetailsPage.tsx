import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  FileText,
  Download,
  CheckCircle,
  XCircle,
  Eye,
  AlertCircle
} from 'lucide-react';
import { api } from '@/api';
import { toast } from 'sonner';

interface VerificationUser {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  address?: string;
  createdAt: string;
  isVerified: boolean;
  verificationDate?: string;
  verificationNotes?: string;
  verificationStatus?: string;
  // Lawyer specific fields
  barRegistrationNumber?: string;
  experience?: string;
  specializations?: string[];
}

const VerificationDetailsPage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  
  const [user, setUser] = useState<VerificationUser | null>(null);
  const [documents, setDocuments] = useState<Array<{
    _id: string;
    fileName: string;
    originalName: string;
    mimeType: string;
    fileSize: number;
    documentType: string;
    createdAt: string;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [notes, setNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    if (userId) {
      fetchUserDetails();
    }
  }, [userId]);

  const fetchUserDetails = async () => {
    try {
      setLoading(true);
      
      // Fetch user details
      const userResponse = await api.get(`/admin/users/${userId}/details`);
      setUser(userResponse.data.user);
      
      // Fetch verification documents
      try {
        const docsResponse = await api.get(`/admin/users/${userId}/verification-documents`);
        setDocuments(docsResponse.data);
      } catch (docsError) {
        console.error('Error fetching verification documents:', docsError);
        // Don't show error for documents - they might not exist yet
        setDocuments([]);
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
      toast.error('Failed to load user details');
      navigate('/admin');
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async () => {
    try {
      setActionLoading(true);
      await api.post(`/admin/verifications/${userId}/approve`, {
        notes: notes || 'Approved by admin'
      });
      
      toast.success('User verification approved successfully');
      navigate('/admin', { state: { activeTab: 'verification' } });
    } catch (error) {
      console.error('Error approving verification:', error);
      toast.error('Failed to approve verification');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejection = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    try {
      setActionLoading(true);
      await api.post(`/admin/verifications/${userId}/reject`, {
        reason: rejectionReason
      });
      
      toast.success('User verification rejected');
      navigate('/admin', { state: { activeTab: 'verification' } });
    } catch (error) {
      console.error('Error rejecting verification:', error);
      toast.error('Failed to reject verification');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownloadDocument = async (documentId: string, filename: string) => {
    try {
      const response = await api.get(`/admin/verification-documents/${documentId}/download`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('Document downloaded successfully');
    } catch (error) {
      console.error('Error downloading document:', error);
      toast.error('Failed to download document');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">User Not Found</h3>
        <p className="text-gray-600 mb-4">The requested user could not be found.</p>
        <Button onClick={() => navigate('/admin')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={() => navigate('/admin')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Verification Request</h1>
            <p className="text-gray-600">Review {user.name}'s {user.role} verification</p>
          </div>
        </div>
        
        <Badge variant={user.isVerified ? 'default' : 'secondary'} className="text-sm">
          {user.isVerified ? 'Verified' : 'Pending Verification'}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start space-x-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="text-lg">
                    {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Full Name</label>
                      <p className="text-sm text-gray-900">{user.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Role</label>
                      <p className="text-sm text-gray-900 capitalize">{user.role}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <div>
                        <label className="text-sm font-medium text-gray-700">Email</label>
                        <p className="text-sm text-gray-900">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <div>
                        <label className="text-sm font-medium text-gray-700">Phone</label>
                        <p className="text-sm text-gray-900">{user.phone || 'Not provided'}</p>
                      </div>
                    </div>
                  </div>
                  
                  {user.address && (
                    <div className="flex items-start space-x-2">
                      <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                      <div>
                        <label className="text-sm font-medium text-gray-700">Address</label>
                        <p className="text-sm text-gray-900">{user.address}</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <div>
                      <label className="text-sm font-medium text-gray-700">Registration Date</label>
                      <p className="text-sm text-gray-900">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lawyer Specific Information */}
          {user.role === 'lawyer' && (
            <Card>
              <CardHeader>
                <CardTitle>Professional Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {user.barRegistrationNumber && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Bar Registration Number</label>
                    <p className="text-sm text-gray-900">{user.barRegistrationNumber}</p>
                  </div>
                )}
                
                {user.experience && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Experience</label>
                    <p className="text-sm text-gray-900">{user.experience}</p>
                  </div>
                )}
                
                {user.specializations && user.specializations.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Specializations</label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {user.specializations.map((spec, index) => (
                        <Badge key={index} variant="outline">{spec}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Documents */}
          {documents && documents.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Uploaded Documents
                </CardTitle>
                <CardDescription>
                  Documents uploaded for verification
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {documents.map((doc) => (
                    <div key={doc._id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <FileText className="h-8 w-8 text-blue-500" />
                        <div>
                          <p className="font-medium">{doc.originalName}</p>
                          <p className="text-sm text-gray-500">
                            Type: {doc.documentType} • Size: {(doc.fileSize / 1024).toFixed(1)} KB
                          </p>
                          <p className="text-xs text-gray-400">
                            Uploaded: {new Date(doc.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownloadDocument(doc._id, doc.originalName)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownloadDocument(doc._id, doc.originalName)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Verification Documents
                </CardTitle>
                <CardDescription>
                  No verification documents uploaded yet
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No documents have been uploaded for verification yet.</p>
                  <p className="text-sm mt-2">Ask the user to upload their verification documents.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Actions Panel */}
        <div className="space-y-6">
          {/* Verification Status */}
          <Card>
            <CardHeader>
              <CardTitle>Verification Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                {user.isVerified ? (
                  <>
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                    <h3 className="font-medium text-green-700">Verified</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Verified on {user.verificationDate ? new Date(user.verificationDate).toLocaleDateString() : 'N/A'}
                    </p>
                    {user.verificationNotes && (
                      <p className="text-sm text-gray-600 mt-2 p-2 bg-gray-50 rounded">
                        {user.verificationNotes}
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-12 w-12 text-orange-500 mx-auto mb-3" />
                    <h3 className="font-medium text-orange-700">Pending Verification</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Awaiting admin approval
                    </p>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          {!user.isVerified && (
            <Card>
              <CardHeader>
                <CardTitle>Verification Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Approval Section */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Approval Notes (Optional)
                  </label>
                  <Textarea
                    placeholder="Add any notes for the approval..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                  <Button 
                    onClick={handleApproval}
                    disabled={actionLoading}
                    className="w-full"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {actionLoading ? 'Processing...' : 'Approve Verification'}
                  </Button>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-gray-500">Or</span>
                  </div>
                </div>

                {/* Rejection Section */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Rejection Reason *
                  </label>
                  <Textarea
                    placeholder="Provide reason for rejection..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={3}
                  />
                  <Button 
                    variant="destructive"
                    onClick={handleRejection}
                    disabled={actionLoading || !rejectionReason.trim()}
                    className="w-full"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    {actionLoading ? 'Processing...' : 'Reject Verification'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerificationDetailsPage;