import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  IndianRupee, 
  Clock, 
  FileText, 
  Eye,
  Download,
  CheckCircle,
  AlertCircle,
  XCircle,
  CreditCard,
  Calendar,
  TrendingDown,
  Banknote,
  Receipt,
  Star,
  MessageCircle,
  Shield
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Payment {
  _id: string;
  caseId: {
    _id: string;
    title: string;
    caseNumber: string;
  };
  lawyerId: {
    _id: string;
    name: string;
    email: string;
  };
  amount: number;
  gstAmount: number;
  totalAmount: number;
  status: 'pending' | 'received' | 'work_submitted' | 'approved' | 'released' | 'disputed';
  paymentMethod: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  escrowHoldingPeriod: number;
  workSubmission?: {
    description: string;
    lawyerNotes: string;
    documents: string[];
    submittedAt: string;
  };
  clientReview?: {
    approved: boolean;
    feedback: string;
    rating?: number;
  };
  dispute?: {
    reason: string;
    status: string;
    raisedAt: string;
    resolution?: string;
  };
  escrow?: {
    releaseDate: string;
  };
  invoice?: {
    id: string;
    url: string;
  };
  disputeReason?: string;
  createdAt: string;
  updatedAt: string;
}

interface PaymentStats {
  totalPaid: number;
  totalPending: number;
  totalCases: number;
  averagePayment: number;
}

const PaymentHistory: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<PaymentStats>({
    totalPaid: 0,
    totalPending: 0,
    totalCases: 0,
    averagePayment: 0
  });
  const [loading, setLoading] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [showDisputeDialog, setShowDisputeDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    page: 1,
    limit: 10
  });
  const { toast } = useToast();

  // Review form
  const [reviewForm, setReviewForm] = useState({
    approved: true,
    feedback: '',
    rating: 5
  });

  // Dispute form
  const [disputeForm, setDisputeForm] = useState({
    reason: ''
  });

  // Razorpay options
  const [razorpayOptions, setRazorpayOptions] = useState(null);

  useEffect(() => {
    fetchPayments();
    loadRazorpayScript();
  }, [filters]);

  const loadRazorpayScript = () => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
  };

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key]) queryParams.append(key, filters[key]);
      });

      const response = await fetch(`/api/billing/client/payments?${queryParams}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      const data = await response.json();
      if (data.success) {
        setPayments(data.payments);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast({
        title: "Error",
        description: "Failed to load payment history",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createPaymentOrder = async (caseId, amount, serviceId) => {
    try {
      const response = await fetch('/api/billing/payment/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          caseId,
          amount,
          serviceId,
          description: 'Legal service payment'
        })
      });

      const data = await response.json();
      if (data.success) {
        const options = {
          key: data.payment.razorpayKeyId,
          amount: data.payment.amount * 100, // Convert to paise
          currency: data.payment.currency,
          name: 'Judicature Legal Services',
          description: 'Secure legal service payment',
          order_id: data.payment.razorpayOrderId,
          handler: function (response) {
            verifyPayment(data.payment.id, response);
          },
          prefill: {
            name: 'Client Name',
            email: 'client@example.com',
            contact: '9999999999'
          },
          theme: {
            color: '#3B82F6'
          },
          modal: {
            ondismiss: function() {
              toast({
                title: "Payment Cancelled",
                description: "Payment was cancelled by user",
                variant: "destructive"
              });
            }
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        toast({
          title: "Error",
          description: data.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error creating payment order:', error);
      toast({
        title: "Error",
        description: "Failed to initiate payment",
        variant: "destructive"
      });
    }
  };

  const verifyPayment = async (paymentId, razorpayResponse) => {
    try {
      const response = await fetch('/api/billing/payment/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          paymentId,
          razorpayPaymentId: razorpayResponse.razorpay_payment_id,
          razorpayOrderId: razorpayResponse.razorpay_order_id,
          razorpaySignature: razorpayResponse.razorpay_signature
        })
      });

      const data = await response.json();
      if (data.success) {
        fetchPayments();
        toast({
          title: "Payment Successful",
          description: "Your payment has been processed and is now in escrow"
        });
      } else {
        toast({
          title: "Payment Verification Failed",
          description: data.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      toast({
        title: "Error",
        description: "Payment verification failed",
        variant: "destructive"
      });
    }
  };

  const approveWork = async () => {
    if (!selectedPayment) return;

    try {
      const response = await fetch(`/api/billing/payment/${selectedPayment._id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(reviewForm)
      });

      const data = await response.json();
      if (data.success) {
        setShowReviewDialog(false);
        setReviewForm({
          approved: true,
          feedback: '',
          rating: 5
        });
        fetchPayments();
        toast({
          title: "Success",
          description: reviewForm.approved ? 
            "Work approved and payment released" : 
            "Work rejected and payment disputed"
        });
      } else {
        toast({
          title: "Error",
          description: data.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error approving work:', error);
      toast({
        title: "Error",
        description: "Failed to process work approval",
        variant: "destructive"
      });
    }
  };

  const raiseDispute = async () => {
    if (!selectedPayment) return;

    try {
      const response = await fetch(`/api/billing/payment/${selectedPayment._id}/dispute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(disputeForm)
      });

      const data = await response.json();
      if (data.success) {
        setShowDisputeDialog(false);
        setDisputeForm({ reason: '' });
        fetchPayments();
        toast({
          title: "Success",
          description: "Dispute raised successfully"
        });
      } else {
        toast({
          title: "Error",
          description: data.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error raising dispute:', error);
      toast({
        title: "Error",
        description: "Failed to raise dispute",
        variant: "destructive"
      });
    }
  };

  const formatCurrency = (amount) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending_payment: { 
        color: 'bg-yellow-100 text-yellow-800', 
        label: 'Payment Required',
        icon: <CreditCard className="w-3 h-3" />
      },
      payment_received: { 
        color: 'bg-blue-100 text-blue-800', 
        label: 'Payment Secured',
        icon: <Shield className="w-3 h-3" />
      },
      work_submitted: { 
        color: 'bg-purple-100 text-purple-800', 
        label: 'Work Completed',
        icon: <FileText className="w-3 h-3" />
      },
      client_reviewing: { 
        color: 'bg-orange-100 text-orange-800', 
        label: 'Review Required',
        icon: <Eye className="w-3 h-3" />
      },
      approved: { 
        color: 'bg-green-100 text-green-800', 
        label: 'Approved',
        icon: <CheckCircle className="w-3 h-3" />
      },
      payment_released: { 
        color: 'bg-emerald-100 text-emerald-800', 
        label: 'Completed',
        icon: <Receipt className="w-3 h-3" />
      },
      disputed: { 
        color: 'bg-red-100 text-red-800', 
        label: 'Disputed',
        icon: <AlertCircle className="w-3 h-3" />
      },
      refunded: { 
        color: 'bg-gray-100 text-gray-800', 
        label: 'Refunded',
        icon: <TrendingDown className="w-3 h-3" />
      },
      cancelled: { 
        color: 'bg-gray-100 text-gray-800', 
        label: 'Cancelled',
        icon: <XCircle className="w-3 h-3" />
      }
    };

    const config = statusConfig[status] || statusConfig.pending_payment;
    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  const getStatusActions = (payment) => {
    const actions = [];

    switch (payment.status) {
      case 'pending_payment':
        actions.push(
          <Button
            key="pay-now"
            size="sm"
            onClick={() => createPaymentOrder(payment.case._id, payment.amount, payment.serviceId)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <CreditCard className="w-4 h-4 mr-2" />
            Pay Now
          </Button>
        );
        break;
      
      case 'work_submitted':
        actions.push(
          <Button
            key="review-work"
            size="sm"
            onClick={() => {
              setSelectedPayment(payment);
              setShowReviewDialog(true);
            }}
            className="bg-green-600 hover:bg-green-700"
          >
            <Eye className="w-4 h-4 mr-2" />
            Review Work
          </Button>
        );
        break;
      
      case 'received':
        actions.push(
          <Badge key="waiting" className="bg-blue-100 text-blue-800">
            Awaiting Work
          </Badge>
        );
        break;

      case 'released':
        actions.push(
          <Badge key="completed" className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Completed
          </Badge>
        );
        break;

      default:
        if (['received', 'work_submitted'].includes(payment.status)) {
          actions.push(
            <Button
              key="dispute"
              variant="outline"
              size="sm"
              className="text-red-600 hover:text-red-700"
              onClick={() => {
                setSelectedPayment(payment);
                setShowDisputeDialog(true);
              }}
            >
              <AlertCircle className="w-4 h-4 mr-2" />
              Dispute
            </Button>
          );
        }
    }

    return actions;
  };

  const getTotalPaid = () => {
    return stats.totalPaid || 0;
  };

  const getPendingPayments = () => {
    return stats.totalPending || 0;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payment History</h1>
          <p className="text-gray-600 mt-1">Track your legal service payments and transactions</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Paid</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(getTotalPaid())}
                </p>
              </div>
              <Receipt className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Payments</p>
                <p className="text-2xl font-bold text-orange-600">
                  {formatCurrency(getPendingPayments())}
                </p>
              </div>
              <Clock className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Cases</p>
                <p className="text-2xl font-bold text-blue-600">
                  {payments.filter(p => ['received', 'work_submitted'].includes(p.status)).length}
                </p>
              </div>
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {payments.filter(p => p.status === 'released').length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <Select value={filters.status} onValueChange={(value) => 
              setFilters(prev => ({ ...prev, status: value }))
            }>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Status</SelectItem>
                <SelectItem value="pending_payment">Payment Required</SelectItem>
                <SelectItem value="received">Payment Secured</SelectItem>
                <SelectItem value="work_submitted">Work Completed</SelectItem>
                <SelectItem value="released">Completed</SelectItem>
                <SelectItem value="disputed">Disputed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Payments List */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : payments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Banknote className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No payment history found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {payments.map(payment => (
                <div key={payment._id} className="border rounded-lg p-6 hover:bg-gray-50">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{payment.caseId?.title}</h3>
                        {getStatusBadge(payment.status)}
                      </div>
                      <p className="text-gray-600 mb-2">
                        Payment ID: {payment._id}
                      </p>
                      <p className="text-sm text-gray-500 mb-3">
                        Lawyer: {payment.lawyerId?.name} • {payment.lawyerId?.email}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900 mb-1">
                        {formatCurrency(payment.totalAmount)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {payment.gstAmount > 0 && (
                          <>Incl. GST (18%)</>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Payment Details */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                    <div>
                      <span className="text-gray-500">Service Amount:</span>
                      <div className="font-medium">{formatCurrency(payment.amount)}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">GST:</span>
                      <div className="font-medium">{formatCurrency(payment.gstAmount)}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Created:</span>
                      <div className="font-medium">
                        {new Date(payment.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500">Payment Method:</span>
                      <div className="font-medium capitalize">
                        {payment.paymentMethod || 'Not selected'}
                      </div>
                    </div>
                  </div>

                  {/* Work Submission */}
                  {payment.workSubmission && (
                    <div className="bg-blue-50 rounded-lg p-4 mb-4">
                      <h4 className="font-semibold text-blue-900 mb-2">Work Completed</h4>
                      <p className="text-blue-800 mb-2">{payment.workSubmission.description}</p>
                      <p className="text-sm text-blue-600">
                        Completed: {new Date(payment.workSubmission.submittedAt).toLocaleString()}
                      </p>
                      {payment.workSubmission.documents?.length > 0 && (
                        <div className="mt-3">
                          <p className="text-sm text-blue-600 mb-2">Deliverables:</p>
                          <div className="flex flex-wrap gap-2">
                            {payment.workSubmission.documents.map((doc, index) => (
                              <Badge key={index} variant="outline" className="text-blue-600">
                                <FileText className="w-3 h-3 mr-1" />
                                {doc}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Client Review */}
                  {payment.clientReview && (
                    <div className={`rounded-lg p-4 mb-4 ${
                      payment.clientReview.approved ? 'bg-green-50' : 'bg-red-50'
                    }`}>
                      <h4 className={`font-semibold mb-2 ${
                        payment.clientReview.approved ? 'text-green-900' : 'text-red-900'
                      }`}>
                        Your Review
                      </h4>
                      <p className={`mb-2 ${
                        payment.clientReview.approved ? 'text-green-800' : 'text-red-800'
                      }`}>
                        {payment.clientReview.feedback}
                      </p>
                      {payment.clientReview.rating && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">Rating:</span>
                          <div className="flex">
                            {Array.from({ length: 5 }, (_, i) => (
                              <Star 
                                key={i} 
                                className={`w-4 h-4 ${
                                  i < payment.clientReview.rating 
                                    ? 'text-yellow-400 fill-current' 
                                    : 'text-gray-300'
                                }`} 
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Dispute Information */}
                  {payment.dispute && (
                    <div className="bg-red-50 rounded-lg p-4 mb-4">
                      <h4 className="font-semibold text-red-900 mb-2">Dispute Information</h4>
                      <p className="text-red-800 mb-2">{payment.dispute.reason}</p>
                      <p className="text-sm text-red-600">
                        Status: {payment.dispute.status} • 
                        Raised: {new Date(payment.dispute.raisedAt).toLocaleDateString()}
                      </p>
                      {payment.dispute.resolution && (
                        <div className="mt-2 p-2 bg-white rounded border">
                          <p className="text-sm text-gray-700">{payment.dispute.resolution}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Escrow Information */}
                  {payment.status === 'received' && (
                    <div className="bg-blue-50 rounded-lg p-4 mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Shield className="w-5 h-5 text-blue-600" />
                        <h4 className="font-semibold text-blue-900">Escrow Protection</h4>
                      </div>
                      <p className="text-blue-800 text-sm">
                        Your payment is secured in escrow and will be released to the lawyer only after work completion and your approval.
                      </p>
                      {payment.escrow?.releaseDate && (
                        <p className="text-blue-600 text-sm mt-1">
                          Auto-release date: {new Date(payment.escrow.releaseDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-4 border-t">
                    {getStatusActions(payment)}
                    {payment.invoice && (
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Invoice
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Work Review Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review Work Completion</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedPayment?.workSubmission && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Work Submitted</h4>
                <p className="text-gray-700 mb-2">{selectedPayment.workSubmission.description}</p>
                {selectedPayment.workSubmission.lawyerNotes && (
                  <div className="mt-2">
                    <p className="text-sm font-medium text-gray-600">Lawyer's Notes:</p>
                    <p className="text-sm text-gray-700">{selectedPayment.workSubmission.lawyerNotes}</p>
                  </div>
                )}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium mb-2">Approval Decision</label>
              <div className="flex gap-4">
                <Button
                  variant={reviewForm.approved ? "default" : "outline"}
                  onClick={() => setReviewForm(prev => ({ ...prev, approved: true }))}
                  className="flex-1"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve Work
                </Button>
                <Button
                  variant={!reviewForm.approved ? "default" : "outline"}
                  onClick={() => setReviewForm(prev => ({ ...prev, approved: false }))}
                  className="flex-1"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject Work
                </Button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Rating</label>
              <div className="flex gap-1">
                {Array.from({ length: 5 }, (_, i) => (
                  <Button
                    key={i}
                    variant="ghost"
                    size="sm"
                    onClick={() => setReviewForm(prev => ({ ...prev, rating: i + 1 }))}
                    className="p-1"
                  >
                    <Star 
                      className={`w-6 h-6 ${
                        i < reviewForm.rating 
                          ? 'text-yellow-400 fill-current' 
                          : 'text-gray-300'
                      }`} 
                    />
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Feedback</label>
              <Textarea
                value={reviewForm.feedback}
                onChange={(e) => setReviewForm(prev => ({ 
                  ...prev, 
                  feedback: e.target.value 
                }))}
                placeholder="Share your feedback about the work quality..."
                rows={4}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button 
                onClick={approveWork} 
                className={`flex-1 ${
                  reviewForm.approved 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {reviewForm.approved ? 'Approve & Release Payment' : 'Reject & Dispute'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowReviewDialog(false)} 
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dispute Dialog */}
      <Dialog open={showDisputeDialog} onOpenChange={setShowDisputeDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Raise Dispute</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Reason for Dispute</label>
              <Textarea
                value={disputeForm.reason}
                onChange={(e) => setDisputeForm(prev => ({ 
                  ...prev, 
                  reason: e.target.value 
                }))}
                placeholder="Explain the reason for the dispute..."
                rows={4}
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button 
                onClick={raiseDispute} 
                className="flex-1 bg-red-600 hover:bg-red-700"
                disabled={!disputeForm.reason.trim()}
              >
                Raise Dispute
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowDisputeDialog(false)} 
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PaymentHistory;