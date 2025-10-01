import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  FileText, 
  CheckCircle, 
  XCircle, 
  CreditCard,
  User,
  Calendar
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/api';

interface PaymentRequest {
  _id: string;
  requestId: string;
  lawyer: {
    _id: string;
    name: string;
    email: string;
  };
  client: {
    _id: string;
    name: string;
    email: string;
  };
  amount: number;
  totalAmount: number;
  serviceType: string;
  description: string;
  status: 'pending' | 'accepted' | 'paid' | 'completed' | 'cancelled' | 'rejected';
  requestedAt: string;
  expiresAt: string;
  metadata: {
    urgency: 'low' | 'medium' | 'high';
    estimatedDeliveryDays: number;
  };
}

interface PaymentRequestsProps {
  userRole: 'lawyer' | 'client';
}

const PaymentRequests: React.FC<PaymentRequestsProps> = ({ userRole }) => {
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchPaymentRequests();
  }, []);

  const fetchPaymentRequests = async () => {
    try {
      const { data } = await api.get('/payment-requests');
      setRequests(data.data.requests);
    } catch (error) {
      console.error('Failed to fetch payment requests:', error);
      toast.error('Failed to load payment requests');
    } finally {
      setLoading(false);
    }
  };

  const handleRespondToRequest = async (requestId: string, action: 'accept' | 'reject') => {
    try {
      setActionLoading(requestId);
      await api.post(`/payment-requests/${requestId}/respond`, { action });
      
      toast.success(`Payment request ${action}ed successfully`);
      fetchPaymentRequests();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to respond to request');
    } finally {
      setActionLoading(null);
    }
  };

  const handleProceedWithPayment = async (requestId: string) => {
    try {
      setActionLoading(requestId);
      const { data } = await api.post(`/payment-requests/${requestId}/pay`);
      
      if (data.success) {
        toast.success('Payment initiated successfully');
        fetchPaymentRequests();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to initiate payment');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: PaymentRequest['status']) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Pending' },
      accepted: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle, label: 'Accepted' },
      paid: { color: 'bg-green-100 text-green-800', icon: CreditCard, label: 'Paid' },
      completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Completed' },
      cancelled: { color: 'bg-gray-100 text-gray-800', icon: XCircle, label: 'Cancelled' },
      rejected: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Rejected' }
    };

    const config = statusConfig[status];
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-16 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FileText className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {userRole === 'lawyer' ? 'No payment requests sent' : 'No payment requests received'}
          </h3>
          <p className="text-gray-500 text-center">
            {userRole === 'lawyer' 
              ? 'Start by creating a payment request for your clients'
              : 'Payment requests from lawyers will appear here'
            }
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-legal-navy">Payment Requests</h2>
        <Badge variant="outline">{requests.length} requests</Badge>
      </div>

      <div className="space-y-4">
        {requests.map((request) => (
          <Card key={request._id} className="border-l-4 border-l-legal-navy">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-legal-navy">{request.requestId}</span>
                    {getStatusBadge(request.status)}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-4 mt-2">
                    <span className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      {userRole === 'lawyer' ? request.client.name : request.lawyer.name}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {formatDate(request.requestedAt)}
                    </span>
                  </CardDescription>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-legal-navy">
                    ₹{request.totalAmount.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-500">
                    Base: ₹{request.amount.toLocaleString()}
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">
                  Service: {request.serviceType.replace('_', ' ').toUpperCase()}
                </h4>
                <p className="text-gray-600">{request.description}</p>
              </div>

              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>Estimated delivery: {request.metadata.estimatedDeliveryDays} days</span>
                <span>Expires: {formatDate(request.expiresAt)}</span>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 pt-4">
                {userRole === 'client' && request.status === 'pending' && (
                  <>
                    <Button
                      onClick={() => handleRespondToRequest(request.requestId, 'accept')}
                      disabled={actionLoading === request.requestId}
                      className="flex-1"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Accept
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleRespondToRequest(request.requestId, 'reject')}
                      disabled={actionLoading === request.requestId}
                      className="flex-1"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                  </>
                )}

                {userRole === 'client' && request.status === 'accepted' && (
                  <Button
                    onClick={() => handleProceedWithPayment(request.requestId)}
                    disabled={actionLoading === request.requestId}
                    className="w-full"
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Proceed with Payment
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default PaymentRequests;