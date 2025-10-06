import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  DollarSign, 
  TrendingUp, 
  CreditCard, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  RefreshCw,
  Download,
  Eye,
  IndianRupee
} from 'lucide-react';
import { api } from '@/api';
import { toast } from 'sonner';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface FinancialAnalytics {
  dailyRevenue: Array<{
    _id: { year: number; month: number; day: number };
    revenue: number;
    transactions: number;
  }>;
  paymentMethods: Array<{
    _id: string;
    count: number;
    amount: number;
  }>;
  pendingOperations: {
    paymentRequests: number;
    pendingPayouts: number;
    disputedPayments: number;
  };
  monthlyStats: {
    totalRevenue: number;
    transactionCount: number;
    averageTransaction: number;
  };
}

interface Payment {
  _id: string;
  amount: number;
  status: string;
  paymentMethod: string;
  client: {
    name: string;
    email: string;
  };
  createdAt: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const LoadingSkeleton = ({ count = 3, height = "h-20" }: { count?: number; height?: string }) => (
  <div className="space-y-3">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className={`animate-pulse bg-gray-200 rounded-lg ${height}`} />
    ))}
  </div>
);

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(amount);
};

const FinancialOperationsAdmin = () => {
  const [analytics, setAnalytics] = useState<FinancialAnalytics | null>(null);
  const [recentPayments, setRecentPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentsLoading, setPaymentsLoading] = useState(true);

  useEffect(() => {
    fetchFinancialAnalytics();
    fetchRecentPayments();
  }, []);

  const fetchFinancialAnalytics = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/analytics/financial');
      setAnalytics(response.data);
    } catch (error) {
      console.error('Failed to fetch financial analytics:', error);
      toast.error('Failed to fetch financial analytics');
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentPayments = async () => {
    try {
      setPaymentsLoading(true);
      // This would fetch recent payments - for now we'll simulate
      // const response = await api.get('/admin/payments/recent');
      // setRecentPayments(response.data);
      setRecentPayments([]);
    } catch (error) {
      console.error('Failed to fetch recent payments:', error);
      toast.error('Failed to fetch recent payments');
    } finally {
      setPaymentsLoading(false);
    }
  };

  if (loading) return <LoadingSkeleton count={4} height="h-64" />;
  if (!analytics) return <div>Failed to load financial data</div>;

  // Process data for charts
  const revenueData = analytics.dailyRevenue.map(item => ({
    date: `${item._id.day}/${item._id.month}`,
    revenue: item.revenue,
    transactions: item.transactions
  }));

  const paymentMethodData = analytics.paymentMethods.map(item => ({
    name: item._id || 'Unknown',
    value: item.amount,
    count: item.count
  }));

  return (
    <div className="space-y-6">
      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Monthly Revenue</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(analytics.monthlyStats.totalRevenue)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Transactions</p>
                <p className="text-2xl font-bold text-blue-600">
                  {analytics.monthlyStats.transactionCount}
                </p>
              </div>
              <CreditCard className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Transaction</p>
                <p className="text-2xl font-bold text-purple-600">
                  {formatCurrency(analytics.monthlyStats.averageTransaction)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Operations</p>
                <p className="text-2xl font-bold text-orange-600">
                  {analytics.pendingOperations.paymentRequests + analytics.pendingOperations.pendingPayouts}
                </p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Operations Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Financial Operations</CardTitle>
          <CardDescription>Operations requiring attention or approval</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Payment Requests</p>
                <p className="text-2xl font-bold text-blue-600">
                  {analytics.pendingOperations.paymentRequests}
                </p>
              </div>
              <Clock className="h-6 w-6 text-blue-600" />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Pending Payouts</p>
                <p className="text-2xl font-bold text-green-600">
                  {analytics.pendingOperations.pendingPayouts}
                </p>
              </div>
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Disputed Payments</p>
                <p className="text-2xl font-bold text-red-600">
                  {analytics.pendingOperations.disputedPayments}
                </p>
              </div>
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Revenue Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Revenue Trend</CardTitle>
            <CardDescription>Revenue and transaction count over the last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'revenue' ? formatCurrency(Number(value)) : value,
                    name === 'revenue' ? 'Revenue' : 'Transactions'
                  ]}
                />
                <Line type="monotone" dataKey="revenue" stroke="#8884d8" />
                <Line type="monotone" dataKey="transactions" stroke="#82ca9d" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Payment Methods Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Methods Distribution</CardTitle>
            <CardDescription>Revenue by payment method</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={paymentMethodData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {paymentMethodData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Revenue']} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Payment Methods Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Methods Breakdown</CardTitle>
          <CardDescription>Detailed breakdown of payment methods usage</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Payment Method</TableHead>
                <TableHead>Transaction Count</TableHead>
                <TableHead>Total Amount</TableHead>
                <TableHead>Average Amount</TableHead>
                <TableHead>Percentage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {analytics.paymentMethods.map((method) => {
                const totalRevenue = analytics.paymentMethods.reduce((sum, m) => sum + m.amount, 0);
                const percentage = totalRevenue > 0 ? (method.amount / totalRevenue * 100).toFixed(1) : '0';
                const avgAmount = method.count > 0 ? method.amount / method.count : 0;
                
                return (
                  <TableRow key={method._id}>
                    <TableCell>
                      <div className="font-medium">
                        {method._id || 'Unknown'}
                      </div>
                    </TableCell>
                    <TableCell>{method.count}</TableCell>
                    <TableCell>{formatCurrency(method.amount)}</TableCell>
                    <TableCell>{formatCurrency(avgAmount)}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{percentage}%</Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Latest payment activities on the platform</CardDescription>
            </div>
            <div className="flex space-x-2">
              <Button onClick={fetchRecentPayments} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {paymentsLoading ? (
            <LoadingSkeleton count={5} height="h-16" />
          ) : recentPayments.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transaction ID</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentPayments.map((payment) => (
                  <TableRow key={payment._id}>
                    <TableCell>
                      <div className="font-mono text-sm">{payment._id.slice(-8)}</div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{payment.client.name}</div>
                        <div className="text-sm text-gray-500">{payment.client.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>{formatCurrency(payment.amount)}</TableCell>
                    <TableCell>{payment.paymentMethod}</TableCell>
                    <TableCell>
                      <Badge variant={payment.status === 'completed' ? 'default' : 'secondary'}>
                        {payment.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(payment.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No recent transactions found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FinancialOperationsAdmin;