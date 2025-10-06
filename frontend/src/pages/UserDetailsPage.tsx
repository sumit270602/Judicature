import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft,
  User,
  Briefcase,
  DollarSign,
  Calendar,
  Phone,
  Mail,
  MapPin,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { api } from '@/api';
import { toast } from 'sonner';
import Header from '@/components/Header';

interface UserDetails {
  user: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    role: string;
    active: boolean;
    isVerified?: boolean;
    createdAt: string;
    specializations?: string[];
    experience?: string;
    address?: string;
    barRegistrationNumber?: string;
  };
  cases: any[];
  orders: any[];
  payments: any[];
  stats: {
    totalCases: number;
    activeCases: number;
    completedCases: number;
    pendingCases: number;
    totalOrders: number;
    totalEarnings: number;
  };
}

const UserDetailsPage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchUserDetails();
    }
  }, [userId]);

  const fetchUserDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/admin/users/${userId}/details`);
      setUserDetails(response.data);
    } catch (error) {
      console.error('Error fetching user details:', error);
      toast.error('Failed to load user details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-24">
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="h-8 w-8 animate-spin text-gray-500" />
          </div>
        </div>
      </div>
    );
  }

  if (!userDetails) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-24">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">User Not Found</h2>
            <Button onClick={() => navigate('/admin')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Admin Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const { user, cases, orders, payments, stats } = userDetails;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-24">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              onClick={() => navigate('/admin')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">User Details</h1>
              <p className="text-gray-600">{user.role} Profile & Activity</p>
            </div>
          </div>
          <Button onClick={fetchUserDetails} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* User Profile */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Profile Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="text-lg">
                      {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-xl font-semibold">{user.name}</h3>
                    <Badge 
                      variant={
                        user.role === 'admin' ? 'destructive' :
                        user.role === 'lawyer' ? 'default' : 'secondary'
                      }
                    >
                      {user.role}
                    </Badge>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">{user.email}</span>
                  </div>
                  
                  {user.phone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">{user.phone}</span>
                    </div>
                  )}

                  {user.address && (
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">{user.address}</span>
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">Status:</span>
                    <Badge variant={user.active ? 'default' : 'destructive'}>
                      {user.active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>

                  {user.role === 'lawyer' && (
                    <>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">Verification:</span>
                        <Badge variant={user.isVerified ? 'default' : 'secondary'}>
                          {user.isVerified ? 'Verified' : 'Pending'}
                        </Badge>
                      </div>

                      {user.barRegistrationNumber && (
                        <div className="flex items-center space-x-2">
                          <FileText className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">Bar: {user.barRegistrationNumber}</span>
                        </div>
                      )}

                      {user.specializations && user.specializations.length > 0 && (
                        <div>
                          <span className="text-sm font-medium">Specializations:</span>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {user.specializations.map((spec, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {spec}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {user.experience && (
                        <div>
                          <span className="text-sm font-medium">Experience:</span>
                          <p className="text-sm text-gray-600 mt-1">{user.experience}</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Stats Card */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Activity Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Cases</span>
                  <span className="font-semibold">{stats.totalCases}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Active Cases</span>
                  <span className="font-semibold text-blue-600">{stats.activeCases}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Completed Cases</span>
                  <span className="font-semibold text-green-600">{stats.completedCases}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Pending Cases</span>
                  <span className="font-semibold text-orange-600">{stats.pendingCases}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Orders</span>
                  <span className="font-semibold">{stats.totalOrders}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Earnings</span>
                  <span className="font-semibold">₹{stats.totalEarnings.toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Activity Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Cases */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Briefcase className="h-5 w-5 mr-2" />
                  Cases ({cases.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-64 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Case Number</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>
                          {user.role === 'client' ? 'Lawyer' : 'Client'}
                        </TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cases.map((caseItem) => (
                        <TableRow key={caseItem._id}>
                          <TableCell className="font-mono text-sm">
                            {caseItem.caseNumber}
                          </TableCell>
                          <TableCell>
                            <div className="max-w-xs truncate">{caseItem.title}</div>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={
                                caseItem.status === 'active' ? 'default' :
                                caseItem.status === 'completed' ? 'default' :
                                'secondary'
                              }
                              className={
                                caseItem.status === 'active' ? 'bg-blue-100 text-blue-800' :
                                caseItem.status === 'completed' ? 'bg-green-100 text-green-800' :
                                'bg-gray-100 text-gray-800'
                              }
                            >
                              {caseItem.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {user.role === 'client' 
                              ? caseItem.lawyer?.name || caseItem.assignedLawyer?.name || 'Unassigned'
                              : caseItem.client?.name || 'N/A'
                            }
                          </TableCell>
                          <TableCell>
                            ₹{caseItem.totalAmount?.toLocaleString() || 'N/A'}
                          </TableCell>
                          <TableCell>
                            {new Date(caseItem.createdAt).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {cases.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No cases found for this user.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recent Orders */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Orders ({orders.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-64 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order ID</TableHead>
                        <TableHead>Service</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.map((order) => (
                        <TableRow key={order._id}>
                          <TableCell className="font-mono text-sm">
                            {order._id.slice(-8)}
                          </TableCell>
                          <TableCell>
                            <div className="max-w-xs truncate">{order.serviceTitle || 'Legal Service'}</div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={order.status === 'completed' ? 'default' : 'secondary'}>
                              {order.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            ₹{order.amount?.toLocaleString() || 'N/A'}
                          </TableCell>
                          <TableCell>
                            {new Date(order.createdAt).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {orders.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No orders found for this user.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Payment History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSign className="h-5 w-5 mr-2" />
                  Payment History ({payments.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-64 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Transaction ID</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.map((payment) => (
                        <TableRow key={payment._id}>
                          <TableCell className="font-mono text-sm">
                            {payment._id.slice(-8)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {payment.type || 'Payment'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            ₹{payment.amount?.toLocaleString() || 'N/A'}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={
                                payment.status === 'completed' ? 'default' :
                                payment.status === 'pending' ? 'secondary' :
                                'destructive'
                              }
                            >
                              {payment.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(payment.createdAt).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {payments.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No payment history found for this user.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDetailsPage;