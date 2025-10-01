import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  DollarSign, 
  FileText, 
  Search, 
  Filter, 
  Download,
  ArrowLeft,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  CreditCard,
  Eye
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { getClientPayments, getPaymentDetails, createPaymentOrder, verifyPayment } from '@/api';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface Payment {
  _id: string;
  amount: number;
  totalAmount: number;
  status: string;
  createdAt: string;
  case: {
    _id?: string;
    title: string;
    caseNumber: string;
  };
  lawyer: {
    name: string;
    email: string;
  };
  invoice?: {
    invoiceNumber: string;
    dueDate: string;
  };
  gateway?: {
    transactionId?: string;
  };
}

const BillingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [payments, setPayments] = useState<Payment[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentStats, setPaymentStats] = useState<any>(null);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  useEffect(() => {
    fetchPayments();
  }, []);

  useEffect(() => {
    filterPayments();
  }, [payments, searchTerm, statusFilter]);

  const fetchPayments = async () => {
    try {
      setIsLoading(true);
      const response = await getClientPayments({ limit: 100 });
      
      if (response.data.success) {
        setPayments(response.data.payments || []);
        setPaymentStats(response.data.stats || []);
      }
    } catch (error: any) {
      console.error('Error fetching payments:', error);
      toast({
        title: "Error Loading Payments",
        description: "Unable to load payment information. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterPayments = () => {
    let filtered = payments;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(payment => 
        payment.case?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.case?.caseNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.lawyer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.invoice?.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(payment => payment.status === statusFilter);
    }

    setFilteredPayments(filtered);
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
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    const configs = {
      pending: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock, label: 'Pending' },
      payment_received: { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: Clock, label: 'In Escrow' },
      payment_released: { color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle, label: 'Completed' },
      work_submitted: { color: 'bg-purple-100 text-purple-800 border-purple-200', icon: Eye, label: 'Under Review' },
      disputed: { color: 'bg-red-100 text-red-800 border-red-200', icon: AlertCircle, label: 'Disputed' },
    };

    const config = configs[status as keyof typeof configs] || configs.pending;
    const Icon = config.icon;

    return (
      <Badge variant="outline" className={`${config.color} text-xs`}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const handlePayNow = async (payment: Payment) => {
    try {
      const response = await createPaymentOrder({
        caseId: payment.case._id || '',
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
          handler: async (response: any) => {
            try {
              await verifyPayment({
                paymentId: payment._id,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature
              });

              toast({
                title: "Payment Successful",
                description: "Your payment has been processed and is held in escrow.",
              });

              fetchPayments(); // Refresh payments
            } catch (error) {
              toast({
                title: "Payment Verification Failed",
                description: "Payment was made but verification failed. Please contact support.",
                variant: "destructive",
              });
            }
          },
          prefill: {
            name: user?.name,
            email: user?.email,
          },
          theme: {
            color: '#1e3a8a'
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
    }
  };

  const calculateTotalsByStatus = () => {
    const totals = {
      pending: 0,
      paid: 0,
      overdue: 0,
      total: 0
    };

    payments.forEach(payment => {
      const amount = payment.totalAmount || payment.amount || 0;
      totals.total += amount;

      if (payment.status === 'pending') {
        totals.pending += amount;
      } else if (payment.status === 'payment_released') {
        totals.paid += amount;
      }
    });

    return totals;
  };

  const totals = calculateTotalsByStatus();

  if (isLoading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 pt-24 p-6">
          <div className="max-w-6xl mx-auto">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="h-24 bg-gray-200 rounded"></div>
                <div className="h-24 bg-gray-200 rounded"></div>
                <div className="h-24 bg-gray-200 rounded"></div>
              </div>
              <div className="h-96 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 pt-24 p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/dashboard/client')}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
            
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="h-8 w-8 text-legal-navy" />
              <h1 className="text-3xl font-bold text-legal-navy">Billing & Payments</h1>
            </div>
            <p className="text-muted-foreground">
              Manage your invoices, payments, and billing history
            </p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="border-l-4 border-l-yellow-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
                <Clock className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{formatCurrency(totals.pending)}</div>
                <p className="text-xs text-muted-foreground">Amount due</p>
              </CardContent>
            </Card>
            
            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Paid</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{formatCurrency(totals.paid)}</div>
                <p className="text-xs text-muted-foreground">Successfully paid</p>
              </CardContent>
            </Card>
            
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total</CardTitle>
                <DollarSign className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{formatCurrency(totals.total)}</div>
                <p className="text-xs text-muted-foreground">All transactions</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search by case, invoice, or lawyer..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-48">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Payments</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="payment_received">In Escrow</SelectItem>
                    <SelectItem value="payment_released">Completed</SelectItem>
                    <SelectItem value="work_submitted">Under Review</SelectItem>
                    <SelectItem value="disputed">Disputed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Payments Table */}
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>
                {filteredPayments.length} payment{filteredPayments.length !== 1 ? 's' : ''} found
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredPayments.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice/Payment</TableHead>
                        <TableHead>Case</TableHead>
                        <TableHead>Lawyer</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPayments.map((payment) => (
                        <TableRow key={payment._id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {payment.invoice?.invoiceNumber || `Payment #${payment._id.slice(-6)}`}
                              </div>
                              {payment.gateway?.transactionId && (
                                <div className="text-xs text-muted-foreground">
                                  ID: {payment.gateway.transactionId}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{payment.case.title}</div>
                              <div className="text-xs text-muted-foreground">{payment.case.caseNumber}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{payment.lawyer.name}</div>
                              <div className="text-xs text-muted-foreground">{payment.lawyer.email}</div>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            {formatCurrency(payment.totalAmount || payment.amount)}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(payment.status)}
                          </TableCell>
                          <TableCell>{formatDate(payment.createdAt)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {payment.status === 'pending' && (
                                <Button 
                                  size="sm" 
                                  onClick={() => handlePayNow(payment)}
                                  className="bg-legal-gold hover:bg-legal-gold/90 text-legal-navy"
                                >
                                  <CreditCard className="h-3 w-3 mr-1" />
                                  Pay Now
                                </Button>
                              )}
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => navigate(`/payment/${payment._id}`)}
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                View
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <DollarSign className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No payments found</h3>
                  <p className="text-gray-500 mb-4">
                    {searchTerm || statusFilter !== 'all' 
                      ? 'No payments match your search criteria.' 
                      : 'You haven\'t made any payments yet.'}
                  </p>
                  {(searchTerm || statusFilter !== 'all') && (
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setSearchTerm('');
                        setStatusFilter('all');
                      }}
                    >
                      Clear Filters
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default BillingPage;