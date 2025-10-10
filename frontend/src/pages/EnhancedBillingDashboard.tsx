import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  CreditCard, 
  Receipt, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Eye,
  Download,
  RefreshCw,
  Filter,
  Calendar,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Shield,
  FileText,
  Users,
  Building,
  IndianRupee
} from 'lucide-react';
import { api } from '@/api';
import { toast } from 'sonner';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts';

interface PaymentSummary {
  totalPayments: number;
  totalAmount: number;
  totalBaseAmount: number;
  totalFees: number;
  totalGST: number;
  avgPaymentAmount: number;
  pendingPayments: number;
  completedPayments: number;
  escrowedPayments: number;
}

interface Payment {
  _id: string;
  client: {
    name: string;
    email: string;
  };
  lawyer: {
    name: string;
    email: string;
  };
  case: {
    title: string;
    caseNumber: string;
  };
  amount: number;
  type: string;
  status: string;
  description: string;
  createdAt: string;
  paidAt?: string;
  dueDate: string;
  breakdown: {
    baseAmount: number;
    platformFee: number;
    gstAmount: number;
    totalAmount: number;
  };
  escrow: {
    enabled: boolean;
    releasedAt?: string;
  };
  razorpayPaymentId?: string;
  invoice?: {
    invoiceNumber: string;
    invoiceDate: string;
  };
}

interface DashboardData {
  summary: PaymentSummary;
  statusDistribution: Array<{
    _id: string;
    count: number;
    totalAmount: number;
  }>;
  typeDistribution: Array<{
    _id: string;
    count: number;
    totalAmount: number;
    avgAmount: number;
  }>;
  dailyTrend: Array<{
    _id: string;
    count: number;
    amount: number;
    baseAmount: number;
  }>;
  recentTransactions: Payment[];
  complianceMetrics: {
    totalTransactions: number;
    clearAML: number;
    verifiedKYC: number;
    complianceRate: number;
  };
}

const EnhancedBillingDashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<string>('');

  const periods = [
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: '90d', label: 'Last 90 days' },
    { value: '1y', label: 'Last year' }
  ];

  const statusColors = {
    'pending': '#f59e0b',
    'paid': '#10b981',
    'paid_escrowed': '#3b82f6',
    'released': '#06d6a0',
    'failed': '#ef4444',
    'cancelled': '#6b7280'
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06d6a0'];

  useEffect(() => {
    fetchDashboardData();
    setCurrentUserRole(localStorage.getItem('userRole') || 'client');
  }, [selectedPeriod]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/enhanced-billing/dashboard?period=${selectedPeriod}`);
      setDashboardData(response.data.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateInvoice = async (paymentId: string) => {
    try {
      const response = await api.get(`/enhanced-billing/${paymentId}/invoice`);
      toast.success('Invoice generated successfully');
      // You could open the invoice in a new tab or download it
    } catch (error: any) {
      console.error('Error generating invoice:', error);
      toast.error(error.response?.data?.message || 'Failed to generate invoice');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getStatusBadgeColor = (status: string) => {
    const colors = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'paid': 'bg-green-100 text-green-800',
      'paid_escrowed': 'bg-blue-100 text-blue-800',
      'released': 'bg-emerald-100 text-emerald-800',
      'failed': 'bg-red-100 text-red-800',
      'cancelled': 'bg-gray-100 text-gray-800'
    };
    return colors[status as keyof typeof colors] || colors.pending;
  };

  const getPaymentTypeLabel = (type: string) => {
    const labels = {
      'consultation_fee': 'Consultation Fee',
      'service_fee': 'Service Fee',
      'court_fee': 'Court Fee',
      'document_fee': 'Document Fee',
      'retainer_fee': 'Retainer Fee',
      'work_completion': 'Work Completion'
    };
    return labels[type as keyof typeof labels] || type;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load dashboard data. Please try refreshing the page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const { summary, statusDistribution, typeDistribution, dailyTrend, recentTransactions, complianceMetrics } = dashboardData;

  // Calculate growth rate (mock calculation for demo)
  const growthRate = summary.totalAmount > 0 ? 
    ((summary.totalAmount - summary.totalBaseAmount) / summary.totalBaseAmount * 100) : 0;

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Payment Dashboard</h1>
          <p className="text-gray-600">Track your payment performance and financial metrics</p>
        </div>
        <div className="flex items-center space-x-4">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {periods.map(period => (
                <SelectItem key={period.value} value={period.value}>
                  {period.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={fetchDashboardData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-3xl font-bold">{formatCurrency(summary.totalAmount)}</p>
                <div className="flex items-center mt-2">
                  {growthRate >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                  )}
                  <span className={`text-sm ${growthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {Math.abs(growthRate).toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="p-3 bg-primary/10 rounded-full">
                <DollarSign className="h-8 w-8 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Payments</p>
                <p className="text-3xl font-bold">{summary.totalPayments}</p>
                <p className="text-sm text-gray-600 mt-2">
                  Avg: {formatCurrency(summary.avgPaymentAmount)}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <CreditCard className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Platform Fees</p>
                <p className="text-3xl font-bold">{formatCurrency(summary.totalFees)}</p>
                <p className="text-sm text-gray-600 mt-2">
                  GST: {formatCurrency(summary.totalGST)}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <Receipt className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Compliance Rate</p>
                <p className="text-3xl font-bold">{(complianceMetrics.complianceRate * 100).toFixed(1)}%</p>
                <p className="text-sm text-gray-600 mt-2">
                  {complianceMetrics.clearAML}/{complianceMetrics.totalTransactions} Clear
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Shield className="h-8 w-8 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Pending Payments</h3>
              <Clock className="h-5 w-5 text-yellow-500" />
            </div>
            <div className="text-2xl font-bold text-yellow-600">
              {summary.pendingPayments}
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Awaiting client payment
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Escrowed Payments</h3>
              <CreditCard className="h-5 w-5 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-blue-600">
              {summary.escrowedPayments}
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Held in escrow
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Completed Payments</h3>
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
            <div className="text-2xl font-bold text-green-600">
              {summary.completedPayments}
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Successfully processed
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="analytics" className="space-y-6">
        <TabsList>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="transactions">Recent Transactions</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>

        <TabsContent value="analytics">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Payment Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Trend</CardTitle>
                <CardDescription>Daily payment volume over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={dailyTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="_id" 
                      tickFormatter={(value) => format(new Date(value), 'MMM dd')}
                    />
                    <YAxis tickFormatter={(value) => `₹${value.toLocaleString()}`} />
                    <Tooltip 
                      formatter={(value: number) => [formatCurrency(value), 'Amount']}
                      labelFormatter={(label) => format(new Date(label as string), 'MMM dd, yyyy')}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="amount" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Status Distribution</CardTitle>
                <CardDescription>Breakdown by payment status</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart
                    width={400}
                    height={300}
                  >
                    <Pie
                      data={statusDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {statusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => [value, 'Count']} />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Payment Type Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Types</CardTitle>
                <CardDescription>Revenue by payment type</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={typeDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="_id" 
                      tickFormatter={(value) => getPaymentTypeLabel(value)}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis tickFormatter={(value) => `₹${value.toLocaleString()}`} />
                    <Tooltip 
                      formatter={(value: number) => [formatCurrency(value), 'Amount']}
                      labelFormatter={(label) => getPaymentTypeLabel(label as string)}
                    />
                    <Bar dataKey="totalAmount" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Key Metrics Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Financial Summary</CardTitle>
                <CardDescription>Breakdown of revenue components</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Base Revenue</span>
                    <span className="text-lg font-bold">{formatCurrency(summary.totalBaseAmount)}</span>
                  </div>
                  <Progress value={(summary.totalBaseAmount / summary.totalAmount) * 100} className="h-2" />
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Platform Fees</span>
                    <span className="text-lg font-bold">{formatCurrency(summary.totalFees)}</span>
                  </div>
                  <Progress value={(summary.totalFees / summary.totalAmount) * 100} className="h-2" />
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">GST</span>
                    <span className="text-lg font-bold">{formatCurrency(summary.totalGST)}</span>
                  </div>
                  <Progress value={(summary.totalGST / summary.totalAmount) * 100} className="h-2" />
                  
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold">Total Revenue</span>
                      <span className="text-xl font-bold text-primary">{formatCurrency(summary.totalAmount)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Latest payment activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentTransactions.map((payment) => (
                  <div key={payment._id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="font-medium">{payment.description}</h4>
                        <Badge className={getStatusBadgeColor(payment.status)}>
                          {payment.status.replace('_', ' ')}
                        </Badge>
                        <Badge variant="outline">
                          {getPaymentTypeLabel(payment.type)}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center space-x-6 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-1" />
                          {currentUserRole === 'lawyer' ? payment.client.name : payment.lawyer.name}
                        </div>
                        <div className="flex items-center">
                          <Building className="h-4 w-4 mr-1" />
                          {payment.case.title}
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {format(new Date(payment.createdAt), 'MMM dd, yyyy')}
                        </div>
                        {payment.escrow.enabled && (
                          <Badge variant="outline" className="text-blue-600">
                            Escrow
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-lg font-bold">{formatCurrency(payment.amount)}</p>
                        <p className="text-sm text-gray-600">
                          Base: {formatCurrency(payment.breakdown.baseAmount)}
                        </p>
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedPayment(payment);
                            setShowPaymentDialog(true);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Details
                        </Button>
                        
                        {payment.status === 'paid' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleGenerateInvoice(payment._id)}
                          >
                            <FileText className="h-4 w-4 mr-1" />
                            Invoice
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Compliance Overview</CardTitle>
                <CardDescription>RBI and regulatory compliance status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">AML Cleared</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-bold">{complianceMetrics.clearAML}</span>
                      <span className="text-sm text-gray-600">/ {complianceMetrics.totalTransactions}</span>
                    </div>
                  </div>
                  <Progress value={(complianceMetrics.clearAML / complianceMetrics.totalTransactions) * 100} className="h-3" />
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">KYC Verified</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-bold">{complianceMetrics.verifiedKYC}</span>
                      <span className="text-sm text-gray-600">/ {complianceMetrics.totalTransactions}</span>
                    </div>
                  </div>
                  <Progress value={(complianceMetrics.verifiedKYC / complianceMetrics.totalTransactions) * 100} className="h-3" />
                  
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold">Overall Compliance</span>
                      <span className="text-xl font-bold text-green-600">
                        {(complianceMetrics.complianceRate * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Data Localization</CardTitle>
                <CardDescription>RBI data residency compliance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="font-medium">Payment Data</span>
                    </div>
                    <Badge className="bg-green-100 text-green-800">India</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="font-medium">Transaction Logs</span>
                    </div>
                    <Badge className="bg-green-100 text-green-800">India</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="font-medium">Audit Trail</span>
                    </div>
                    <Badge className="bg-green-100 text-green-800">India</Badge>
                  </div>
                  
                  <Alert>
                    <Shield className="h-4 w-4" />
                    <AlertDescription>
                      All sensitive payment data is stored within Indian jurisdiction as per RBI guidelines.
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Payment Details Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-2xl">
          {selectedPayment && (
            <>
              <DialogHeader>
                <DialogTitle>Payment Details</DialogTitle>
                <DialogDescription>
                  Transaction ID: {selectedPayment.razorpayPaymentId || selectedPayment._id}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-3">Payment Information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Amount:</span>
                        <span className="font-medium">{formatCurrency(selectedPayment.amount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Base Amount:</span>
                        <span>{formatCurrency(selectedPayment.breakdown.baseAmount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Platform Fee:</span>
                        <span>{formatCurrency(selectedPayment.breakdown.platformFee)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>GST:</span>
                        <span>{formatCurrency(selectedPayment.breakdown.gstAmount)}</span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span className="font-medium">Total:</span>
                        <span className="font-bold">{formatCurrency(selectedPayment.breakdown.totalAmount)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-3">Transaction Details</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Status:</span>
                        <Badge className={getStatusBadgeColor(selectedPayment.status)}>
                          {selectedPayment.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Type:</span>
                        <span>{getPaymentTypeLabel(selectedPayment.type)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Created:</span>
                        <span>{format(new Date(selectedPayment.createdAt), 'MMM dd, yyyy HH:mm')}</span>
                      </div>
                      {selectedPayment.paidAt && (
                        <div className="flex justify-between">
                          <span>Paid:</span>
                          <span>{format(new Date(selectedPayment.paidAt), 'MMM dd, yyyy HH:mm')}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>Due Date:</span>
                        <span>{format(new Date(selectedPayment.dueDate), 'MMM dd, yyyy')}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-3">Case & Parties</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Case:</span>
                      <span>{selectedPayment.case.title}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Case Number:</span>
                      <span>{selectedPayment.case.caseNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Client:</span>
                      <span>{selectedPayment.client.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Lawyer:</span>
                      <span>{selectedPayment.lawyer.name}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-3">Description</h4>
                  <p className="text-sm text-gray-600">{selectedPayment.description}</p>
                </div>
                
                {selectedPayment.escrow.enabled && (
                  <Alert>
                    <Shield className="h-4 w-4" />
                    <AlertDescription>
                      This payment is held in escrow and will be released upon work completion approval.
                      {selectedPayment.escrow.releasedAt && (
                        <span className="block mt-1">
                          Released on {format(new Date(selectedPayment.escrow.releasedAt), 'MMM dd, yyyy HH:mm')}
                        </span>
                      )}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EnhancedBillingDashboard;