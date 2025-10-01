import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  CreditCard, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Download, 
  Upload,
  RefreshCw,
  DollarSign,
  FileText,
  Shield,
  Eye,
  MessageSquare
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { api } from '@/api';

interface Order {
  _id: string;
  orderId: string;
  client: {
    _id: string;
    name: string;
    email: string;
  };
  lawyer: {
    _id: string;
    name: string;
    email: string;
  };
  serviceType: string;
  amount: number;
  currency: string;
  description: string;
  status: 'pending' | 'paid' | 'in_progress' | 'completed' | 'disputed' | 'cancelled' | 'refunded';
  paymentStatus: 'pending' | 'processing' | 'succeeded' | 'requires_action' | 'failed';
  escrowStatus: 'held' | 'released' | 'disputed';
  stripePaymentIntentId?: string;
  totalAmount: number;
  platformFee: number;
  createdAt: string;
  paidAt?: string;
  completedAt?: string;
  deliverables: Array<{
    _id: string;
    filename: string;
    status: 'pending' | 'accepted' | 'rejected';
    uploadedAt: string;
  }>;
}

interface OrderManagementProps {
  userRole: 'client' | 'lawyer';
  userId: string;
}

const OrderManagement: React.FC<OrderManagementProps> = ({ userRole, userId }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/orders');
      setOrders(data.orders || []);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'paid': case 'in_progress': return 'bg-blue-500';
      case 'completed': return 'bg-green-500';
      case 'disputed': return 'bg-red-500';
      case 'cancelled': case 'refunded': return 'bg-gray-500';
      default: return 'bg-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'paid': case 'in_progress': return <CreditCard className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'disputed': return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const handleReleaseFunds = async (orderId: string) => {
    try {
      await api.post(`/orders/${orderId}/release-funds`);
      toast.success('Funds released to lawyer successfully');
      fetchOrders();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to release funds');
    }
  };

  const handleDisputeOrder = async (orderId: string, reason: string) => {
    try {
      await api.post(`/orders/${orderId}/dispute`, { reason });
      toast.success('Dispute raised successfully');
      fetchOrders();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to raise dispute');
    }
  };

  const formatCurrency = (amount: number, currency: string = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(amount / 100);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading Orders...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Orders Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-legal-navy" />
            {userRole === 'client' ? 'My Orders' : 'Client Orders'}
          </CardTitle>
          <CardDescription>
            {userRole === 'client' 
              ? 'Track your legal service orders and payments'
              : 'Manage client orders and deliverables'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-legal-navy">
                {orders.filter(o => o.status === 'pending').length}
              </div>
              <div className="text-sm text-muted-foreground">Pending</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {orders.filter(o => o.status === 'in_progress').length}
              </div>
              <div className="text-sm text-muted-foreground">In Progress</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {orders.filter(o => o.status === 'completed').length}
              </div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-legal-gold">
                {formatCurrency(orders.reduce((sum, o) => sum + o.totalAmount, 0))}
              </div>
              <div className="text-sm text-muted-foreground">Total Value</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      <div className="space-y-4">
        {orders.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No orders found</p>
            </CardContent>
          </Card>
        ) : (
          orders.map((order) => (
            <Card key={order._id} className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold">{order.orderId}</h3>
                      <Badge className={`${getStatusColor(order.status)} text-white`}>
                        {getStatusIcon(order.status)}
                        <span className="ml-1 capitalize">{order.status.replace('_', ' ')}</span>
                      </Badge>
                      {order.escrowStatus === 'held' && (
                        <Badge variant="outline" className="text-blue-600 border-blue-600">
                          <Shield className="h-3 w-3 mr-1" />
                          Escrow Protected
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{order.description}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Service: {order.serviceType.replace('_', ' ')}</span>
                      <span>•</span>
                      <span>{userRole === 'client' ? `Lawyer: ${order.lawyer.name}` : `Client: ${order.client.name}`}</span>
                      <span>•</span>
                      <span>Created: {format(new Date(order.createdAt), 'MMM dd, yyyy')}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-legal-navy">
                      {formatCurrency(order.totalAmount, order.currency)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Platform fee: {formatCurrency(order.platformFee, order.currency)}
                    </div>
                  </div>
                </div>

                {/* Deliverables */}
                {order.deliverables.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium mb-2">Deliverables</h4>
                    <div className="space-y-2">
                      {order.deliverables.map((deliverable) => (
                        <div key={deliverable._id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            <span className="text-sm">{deliverable.filename}</span>
                            <Badge variant={deliverable.status === 'accepted' ? 'default' : 'secondary'}>
                              {deliverable.status}
                            </Badge>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              <Download className="h-4 w-4 mr-1" />
                              Download
                            </Button>
                            {userRole === 'client' && deliverable.status === 'pending' && (
                              <>
                                <Button size="sm" variant="default">
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Accept
                                </Button>
                                <Button size="sm" variant="destructive">
                                  <AlertCircle className="h-4 w-4 mr-1" />
                                  Reject
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <Separator className="my-4" />
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-1" />
                      View Details
                    </Button>
                    {userRole === 'client' && order.status === 'in_progress' && (
                      <Button variant="outline" size="sm">
                        <MessageSquare className="h-4 w-4 mr-1" />
                        Contact Lawyer
                      </Button>
                    )}
                    {userRole === 'lawyer' && order.status === 'paid' && (
                      <Button variant="outline" size="sm">
                        <Upload className="h-4 w-4 mr-1" />
                        Upload Deliverable
                      </Button>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {userRole === 'client' && order.status === 'completed' && order.escrowStatus === 'held' && (
                      <Button 
                        size="sm" 
                        onClick={() => handleReleaseFunds(order.orderId)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Release Funds
                      </Button>
                    )}
                    {(order.status === 'in_progress' || order.status === 'completed') && (
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => handleDisputeOrder(order.orderId, 'Quality concerns')}
                      >
                        <AlertCircle className="h-4 w-4 mr-1" />
                        Dispute
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Refresh Button */}
      <div className="text-center">
        <Button variant="outline" onClick={fetchOrders}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Orders
        </Button>
      </div>
    </div>
  );
};

export default OrderManagement;