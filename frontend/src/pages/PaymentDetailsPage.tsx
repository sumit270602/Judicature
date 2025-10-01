import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  DollarSign, 
  Calendar, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  CreditCard,
  FileText, 
  User,
  Building,
  Download,
  Eye
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { getPaymentDetails, createPaymentOrder, verifyPayment } from '@/api';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface PaymentDetail {
  _id: string;
  amount: number;
  totalAmount: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  case: {
    _id: string;
    title: string;
    caseNumber: string;
    caseType: string;
  };
  client: {
    name: string;
    email: string;
    phone?: string;
  };
  lawyer: {
    name: string;
    email: string;
    phone?: string;
  };
  invoice?: {
    invoiceNumber: string;
    issueDate: string;
    dueDate: string;
    services: Array<{
      description: string;
      quantity: number;
      rate: number;
      amount: number;
    }>;
    subtotal: number;
    gst: {
      isApplicable: boolean;
      percentage: number;
      amount: number;
    };
    totalAmount: number;
  };
  gateway?: {
    orderId?: string;
    transactionId?: string;
    signature?: string;
  };
  escrow?: {
    releaseDate?: string;
    autoRelease?: boolean;
  };
  statusHistory?: Array<{
    status: string;
    updatedAt: string;
    updatedBy?: string;
    comment?: string;
  }>;
}

const PaymentDetailsPage: React.FC = () => {
  const { paymentId } = useParams<{ paymentId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [payment, setPayment] = useState<PaymentDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  useEffect(() => {
    if (paymentId) {
      fetchPaymentDetails();
    }
  }, [paymentId]);

  const fetchPaymentDetails = async () => {
    try {
      setIsLoading(true);
      const response = await getPaymentDetails(paymentId!);
      
      if (response.data.success) {
        setPayment(response.data.payment);
      } else {
        throw new Error(response.data.message || 'Payment not found');
      }
    } catch (error: any) {
      console.error('Error fetching payment details:', error);
      toast({
        title: "Error Loading Payment",
        description: error.response?.data?.message || "Unable to load payment details.",
        variant: "destructive",
      });
      navigate('/billing');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusConfig = (status: string) => {
    const configs = {
      pending: { 
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200', 
        icon: Clock, 
        label: 'Pending Payment',
        description: 'Payment is waiting to be processed'
      },
      payment_received: { 
        color: 'bg-blue-100 text-blue-800 border-blue-200', 
        icon: CheckCircle, 
        label: 'Payment in Escrow',
        description: 'Payment received and held securely until work completion'
      },
      work_submitted: { 
        color: 'bg-purple-100 text-purple-800 border-purple-200', 
        icon: Eye, 
        label: 'Work Under Review',
        description: 'Lawyer has submitted work, awaiting client approval'
      },
      payment_released: { 
        color: 'bg-green-100 text-green-800 border-green-200', 
        icon: CheckCircle, 
        label: 'Payment Completed',
        description: 'Payment has been released to the lawyer'
      },
      disputed: { 
        color: 'bg-red-100 text-red-800 border-red-200', 
        icon: AlertCircle, 
        label: 'Payment Disputed',
        description: 'Payment is under dispute resolution'
      },
    };

    return configs[status as keyof typeof configs] || configs.pending;
  };

  const handlePayNow = async () => {
    if (!payment) return;

    try {
      setIsProcessingPayment(true);
      
      const response = await createPaymentOrder({
        caseId: payment.case._id,
        amount: payment.totalAmount,
        description: `Payment for case: ${payment.case.title}`
      });

      if (response.data.success) {
        // Initialize Razorpay payment
        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID,
          amount: response.data.order.amount,
          currency: response.data.order.currency,
          name: 'Judicature Legal Services',
          description: `Payment for case: ${payment.case.title}`,
          order_id: response.data.order.id,
          prefill: {
            name: user?.name,
            email: user?.email,
          },
          theme: {
            color: '#1e3a8a'
          },
          handler: async (razorpayResponse: any) => {
            try {
              await verifyPayment({
                paymentId: payment._id,
                razorpayOrderId: razorpayResponse.razorpay_order_id,
                razorpayPaymentId: razorpayResponse.razorpay_payment_id,
                razorpaySignature: razorpayResponse.razorpay_signature
              });

              toast({
                title: "Payment Successful",
                description: "Your payment has been processed and is held in escrow.",
              });

              fetchPaymentDetails(); // Refresh payment details
            } catch (error) {
              toast({
                title: "Payment Verification Failed",
                description: "Payment was made but verification failed. Please contact support.",
                variant: "destructive",
              });
            }
          },
          modal: {
            ondismiss: () => {
              setIsProcessingPayment(false);
            }
          }
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      }
    } catch (error: any) {
      toast({
        title: "Payment Error",
        description: error.response?.data?.message || "Unable to initiate payment. Please try again.",
        variant: "destructive",
      });
      setIsProcessingPayment(false);
    }
  };

  if (isLoading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 pt-24 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (!payment) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 pt-24 p-6">
          <div className="max-w-4xl mx-auto text-center py-12">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
            <h2 className="text-xl font-semibold mb-2">Payment Not Found</h2>
            <p className="text-muted-foreground mb-4">The requested payment could not be found.</p>
            <Button onClick={() => navigate('/billing')}>
              Back to Billing
            </Button>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  const statusConfig = getStatusConfig(payment.status);
  const StatusIcon = statusConfig.icon;

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 pt-24 p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/billing')}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Billing
            </Button>
            
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <DollarSign className="h-8 w-8 text-legal-navy" />
                  <h1 className="text-3xl font-bold text-legal-navy">
                    Payment Details
                  </h1>
                </div>
                <p className="text-muted-foreground">
                  {payment.invoice?.invoiceNumber || `Payment #${payment._id.slice(-6)}`}
                </p>
              </div>
              
              {payment.status === 'pending' && (
                <Button 
                  onClick={handlePayNow}
                  disabled={isProcessingPayment}
                  className="bg-legal-gold hover:bg-legal-gold/90 text-legal-navy"
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  {isProcessingPayment ? 'Processing...' : 'Pay Now'}
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Payment Overview */}
            <div className="lg:col-span-2 space-y-6">
              {/* Status Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <StatusIcon className="h-5 w-5" />
                    Payment Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className={`${statusConfig.color} text-sm px-3 py-1`}>
                        {statusConfig.label}
                      </Badge>
                      <span className="text-2xl font-bold text-legal-navy">
                        {formatCurrency(payment.totalAmount)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {statusConfig.description}
                    </p>
                    
                    {payment.escrow?.releaseDate && payment.status === 'payment_received' && (
                      <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                        <p className="text-sm text-blue-800">
                          <Clock className="h-4 w-4 inline mr-1" />
                          Funds will be automatically released on{' '}
                          {formatDate(payment.escrow.releaseDate)}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Case Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Case Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Case Number:</span>
                      <span className="font-medium">{payment.case.caseNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Case Title:</span>
                      <span className="font-medium">{payment.case.title}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Case Type:</span>
                      <Badge variant="outline">{payment.case.caseType}</Badge>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => navigate(`/case/${payment.case._id}`)}
                      className="w-full mt-3"
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      View Case Details
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Invoice Details */}
              {payment.invoice && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Invoice Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-sm text-muted-foreground">Invoice Number:</span>
                          <p className="font-medium">{payment.invoice.invoiceNumber}</p>
                        </div>
                        <div>
                          <span className="text-sm text-muted-foreground">Issue Date:</span>
                          <p className="font-medium">{formatDate(payment.invoice.issueDate)}</p>
                        </div>
                        <div>
                          <span className="text-sm text-muted-foreground">Due Date:</span>
                          <p className="font-medium">{formatDate(payment.invoice.dueDate)}</p>
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-2">
                        <h4 className="font-medium">Services</h4>
                        {payment.invoice.services.map((service, index) => (
                          <div key={index} className="flex justify-between items-center py-2 border-b last:border-b-0">
                            <div>
                              <p className="font-medium">{service.description}</p>
                              <p className="text-sm text-muted-foreground">
                                Qty: {service.quantity} × {formatCurrency(service.rate)}
                              </p>
                            </div>
                            <span className="font-medium">{formatCurrency(service.amount)}</span>
                          </div>
                        ))}
                      </div>

                      <Separator />

                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Subtotal:</span>
                          <span>{formatCurrency(payment.invoice.subtotal)}</span>
                        </div>
                        {payment.invoice.gst.isApplicable && (
                          <div className="flex justify-between">
                            <span>GST ({payment.invoice.gst.percentage}%):</span>
                            <span>{formatCurrency(payment.invoice.gst.amount)}</span>
                          </div>
                        )}
                        <div className="flex justify-between font-bold text-lg border-t pt-2">
                          <span>Total:</span>
                          <span>{formatCurrency(payment.invoice.totalAmount)}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Lawyer Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Lawyer Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="font-medium">{payment.lawyer.name}</p>
                      <p className="text-sm text-muted-foreground">{payment.lawyer.email}</p>
                      {payment.lawyer.phone && (
                        <p className="text-sm text-muted-foreground">{payment.lawyer.phone}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Timeline */}
              {payment.statusHistory && payment.statusHistory.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Payment Timeline
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {payment.statusHistory.map((history, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <div className={`w-2 h-2 rounded-full mt-2 ${
                            index === 0 ? 'bg-legal-navy' : 'bg-gray-300'
                          }`} />
                          <div className="flex-1">
                            <p className="font-medium text-sm">
                              {history.status.charAt(0).toUpperCase() + history.status.slice(1).replace('_', ' ')}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(history.updatedAt)}
                            </p>
                            {history.comment && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {history.comment}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Transaction Info */}
              {payment.gateway?.transactionId && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building className="h-5 w-5" />
                      Transaction Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div>
                        <span className="text-sm text-muted-foreground">Transaction ID:</span>
                        <p className="font-mono text-sm">{payment.gateway.transactionId}</p>
                      </div>
                      {payment.gateway.orderId && (
                        <div>
                          <span className="text-sm text-muted-foreground">Order ID:</span>
                          <p className="font-mono text-sm">{payment.gateway.orderId}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default PaymentDetailsPage;