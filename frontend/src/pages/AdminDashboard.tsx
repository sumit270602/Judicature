import React, { useState, useEffect, Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Calendar, 
  Clock, 
  FileText, 
  Users, 
  DollarSign, 
  AlertCircle, 
  Briefcase, 
  MessageSquare, 
  Bell, 
  TrendingUp, 
  User, 
  Shield, 
  CheckCircle, 
  Settings, 
  Search, 
  Download, 
  CreditCard, 
  X, 
  RefreshCw,
  Activity,
  BarChart3,
  Database,
  Server,
  UserCheck,
  UserX,
  Gavel,
  Eye
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { api } from '@/api';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { NotificationSystem } from '@/components/NotificationPopup';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

// Import admin-specific components
import CaseManagementAdmin from '@/components/admin/CaseManagementAdmin';
import FinancialOperationsAdmin from '@/components/admin/FinancialOperationsAdmin';
import SystemHealthAdmin from '@/components/admin/SystemHealthAdmin';
import VerificationManagementAdmin from '@/components/admin/VerificationManagementAdmin';
import PlatformNotificationsAdmin from '@/components/admin/PlatformNotificationsAdmin';
import EnhancedUserManagement from '@/components/admin/EnhancedUserManagement';
import ServiceManagementAdmin from '@/components/admin/ServiceManagementAdmin';

// Import chart components (would need to install recharts)
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

// Dashboard stats interface
interface AdminOverview {
  users: {
    total: number;
    lawyers: number;
    clients: number;
    verifiedLawyers: number;
    pendingVerifications: number;
    activeToday: number;
  };
  cases: {
    total: number;
    active: number;
    completed: number;
    thisMonth: number;
  };
  financial: {
    totalRevenue: number;
    monthlyRevenue: number;
    pendingPayments: number;
    totalOrders: number;
    completedOrders: number;
  };
  system: {
    errorNotifications: number;
    systemAlerts: number;
    uptime: number;
  };
}

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  verified: boolean;
  active: boolean;
  createdAt: string;
  lastActive?: string;
}

interface PaginatedUsers {
  users: User[];
  pagination: {
    current: number;
    pages: number;
    total: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

interface AnalyticsData {
  dailyRegistrations: Array<{
    _id: { year: number; month: number; day: number };
    count: number;
  }>;
  roleDistribution: Array<{
    _id: string;
    count: number;
  }>;
  activeUsersByDay: Array<{
    _id: { year: number; month: number; day: number };
    count: number;
  }>;
}

// Colors for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

// Loading skeleton component
const LoadingSkeleton = ({ count = 3, height = "h-20" }: { count?: number; height?: string }) => (
  <div className="space-y-3">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className={`animate-pulse bg-gray-200 rounded-lg ${height}`} />
    ))}
  </div>
);

// Stats Card Component
const StatsCard = ({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  description, 
  color = "text-blue-600" 
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: string;
  description?: string;
  color?: string;
}) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className={`h-4 w-4 ${color}`} />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      {trend && (
        <p className="text-xs text-muted-foreground">
          {trend}
        </p>
      )}
      {description && (
        <p className="text-xs text-gray-600 mt-1">{description}</p>
      )}
    </CardContent>
  </Card>
);

// User Management Component
const UserManagement = () => {
  const [users, setUsers] = useState<PaginatedUsers | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    role: 'all',
    verified: 'all',
    search: ''
  });
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchUsers();
  }, [page, filters]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(filters.role !== 'all' && { role: filters.role }),
        ...(filters.verified !== 'all' && { verified: filters.verified }),
        ...(filters.search && { search: filters.search })
      });

      const response = await api.get(`/admin/users?${query}`);
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusToggle = async (userId: string, currentStatus: boolean) => {
    try {
      await api.put(`/admin/users/${userId}/status`, { active: !currentStatus });
      toast.success(`User ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      fetchUsers();
    } catch (error) {
      console.error('Failed to toggle user status:', error);
      toast.error('Failed to update user status');
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex items-center space-x-2">
          <Search className="h-4 w-4" />
          <Input
            placeholder="Search users..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="w-64"
          />
        </div>
        
        <Select value={filters.role} onValueChange={(value) => setFilters({ ...filters, role: value })}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="client">Clients</SelectItem>
            <SelectItem value="lawyer">Lawyers</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.verified} onValueChange={(value) => setFilters({ ...filters, verified: value })}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Verification" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="true">Verified</SelectItem>
            <SelectItem value="false">Unverified</SelectItem>
          </SelectContent>
        </Select>

        <Button onClick={fetchUsers} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>
            Manage all platform users, their roles and verification status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <LoadingSkeleton count={5} height="h-16" />
          ) : users ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Verified</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users?.users?.map((user) => (
                    <TableRow key={user._id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`} />
                            <AvatarFallback>
                              {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.role === 'lawyer' ? 'default' : 'secondary'}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.active ? 'default' : 'destructive'}>
                          {user.active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.role === 'lawyer' ? (
                          <Badge variant={user.verified ? 'default' : 'secondary'}>
                            {user.verified ? 'Verified' : 'Pending'}
                          </Badge>
                        ) : (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(user.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusToggle(user._id, user.active)}
                          >
                            {user.active ? (
                              <UserX className="h-4 w-4" />
                            ) : (
                              <UserCheck className="h-4 w-4" />
                            )}
                          </Button>
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-gray-600">
                  Showing {users?.users?.length || 0} of {users?.pagination?.total || 0} users
                </p>
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPage(page - 1)}
                    disabled={!users?.pagination?.hasPrev}
                  >
                    Previous
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPage(page + 1)}
                    disabled={!users?.pagination?.hasNext}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No users found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Enhanced Analytics Dashboard Component
const AnalyticsDashboard = () => {
  const [userAnalytics, setUserAnalytics] = useState<AnalyticsData | null>(null);
  const [caseAnalytics, setCaseAnalytics] = useState<any>(null);
  const [financialAnalytics, setFinancialAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllAnalytics();
  }, []);

  const fetchAllAnalytics = async () => {
    try {
      setLoading(true);
      const [userResponse, caseResponse, financialResponse] = await Promise.all([
        api.get('/admin/analytics/users'),
        api.get('/admin/analytics/cases'),
        api.get('/admin/analytics/financial')
      ]);
      
      setUserAnalytics(userResponse.data);
      setCaseAnalytics(caseResponse.data);
      setFinancialAnalytics(financialResponse.data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      toast.error('Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSkeleton count={4} height="h-64" />;
  if (!userAnalytics || !caseAnalytics || !financialAnalytics) {
    return <div>Failed to load analytics</div>;
  }

  // Process data for charts
  const registrationData = userAnalytics?.dailyRegistrations?.map(item => ({
    date: `${item._id.day}/${item._id.month}`,
    registrations: item.count
  })) || [];

  const roleData = userAnalytics?.roleDistribution?.map(item => ({
    name: item._id,
    value: item.count
  })) || [];

  const caseStatusData = caseAnalytics?.casesByStatus?.map((item: any) => ({
    name: item._id,
    value: item.count
  })) || [];

  const dailyCasesData = caseAnalytics?.dailyCaseCreation?.map((item: any) => ({
    date: `${item._id.day}/${item._id.month}`,
    cases: item.count
  })) || [];

  const revenueData = financialAnalytics?.dailyRevenue?.map((item: any) => ({
    date: `${item._id.day}/${item._id.month}`,
    revenue: item.revenue,
    transactions: item.transactions
  })) || [];

  return (
    <div className="space-y-6">
      {/* Analytics Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-2xl font-bold">{roleData.reduce((sum, item) => sum + item.value, 0)}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Cases</p>
                <p className="text-2xl font-bold">{caseAnalytics?.totalCases || 0}</p>
              </div>
              <Briefcase className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Monthly Revenue</p>
                <p className="text-2xl font-bold">₹{((financialAnalytics?.monthlyStats?.totalRevenue || 0) / 1000).toFixed(1)}k</p>
              </div>
              <DollarSign className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Resolution</p>
                <p className="text-2xl font-bold">{caseAnalytics?.averageResolutionDays || 0}d</p>
              </div>
              <Clock className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Primary Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Registration Trends */}
        <Card>
          <CardHeader>
            <CardTitle>User Registration Trends</CardTitle>
            <CardDescription>Daily user registrations over the last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={registrationData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="registrations" stroke="#3B82F6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Case Creation Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Case Creation Trends</CardTitle>
            <CardDescription>Daily case creation over the last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={dailyCasesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="cases" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Distribution Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Role Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>User Role Distribution</CardTitle>
            <CardDescription>Distribution of users by role</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={roleData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {roleData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Case Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Case Status Distribution</CardTitle>
            <CardDescription>Distribution of cases by current status</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={caseStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {caseStatusData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Analytics */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue & Transaction Analytics</CardTitle>
          <CardDescription>Revenue and transaction trends over the last 30 days</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip 
                formatter={(value: any, name: string) => [
                  name === 'revenue' ? `₹${value}` : value,
                  name === 'revenue' ? 'Revenue' : 'Transactions'
                ]}
              />
              <Line 
                yAxisId="left" 
                type="monotone" 
                dataKey="revenue" 
                stroke="#F59E0B" 
                strokeWidth={3}
                name="revenue"
              />
              <Line 
                yAxisId="right" 
                type="monotone" 
                dataKey="transactions" 
                stroke="#6366F1" 
                strokeWidth={2}
                name="transactions"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Detailed Analytics Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Case Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Count</TableHead>
                  <TableHead>Percentage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {caseAnalytics?.casesByCategory?.map((category: any) => {
                  const percentage = (category.count / (caseAnalytics?.totalCases || 1) * 100).toFixed(1);
                  return (
                    <TableRow key={category._id}>
                      <TableCell className="font-medium">{category._id || 'Uncategorized'}</TableCell>
                      <TableCell>{category.count}</TableCell>
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

        <Card>
          <CardHeader>
            <CardTitle>Financial Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Revenue</span>
                <span className="font-semibold">₹{((financialAnalytics?.monthlyStats?.totalRevenue || 0) / 1000).toFixed(1)}k</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Transaction Count</span>
                <span className="font-semibold">{financialAnalytics?.monthlyStats?.transactionCount || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Average Transaction</span>
                <span className="font-semibold">₹{(financialAnalytics?.monthlyStats?.averageTransaction || 0).toFixed(0)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Pending Payments</span>
                <span className="font-semibold text-orange-600">{financialAnalytics?.pendingOperations?.paymentRequests || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Disputed Payments</span>
                <span className="font-semibold text-red-600">{financialAnalytics?.pendingOperations?.disputedPayments || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Refresh Button */}
      <div className="flex justify-center">
        <Button onClick={fetchAllAnalytics} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh All Analytics
        </Button>
      </div>
    </div>
  );
};

// Main Admin Dashboard Component
const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [loading, setLoading] = useState(true);

  // Redirect if not admin
  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/dashboard/client');
      return;
    }
  }, [user, navigate]);

  useEffect(() => {
    fetchOverview();
  }, []);

  const fetchOverview = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/overview');
      setOverview(response.data);
    } catch (error) {
      console.error('Failed to fetch admin overview:', error);
      toast.error('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access this area.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-8 pt-24">
        {/* Dashboard Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600">Comprehensive platform management and analytics</p>
          </div>
          <div className="flex space-x-2">
            <Button onClick={fetchOverview} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>

        {loading ? (
          <LoadingSkeleton count={4} height="h-32" />
        ) : overview ? (
          <>
            {/* Overview Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
              <StatsCard
                title="Total Users"
                value={overview?.users?.total || 0}
                icon={Users}
                trend={`${overview?.users?.activeToday || 0} active today`}
                color="text-blue-600"
              />
              <StatsCard
                title="Pending Verifications"
                value={overview?.users?.pendingVerifications || 0}
                icon={UserCheck}
                trend={`${overview?.users?.verifiedLawyers || 0} verified lawyers`}
                color="text-orange-600"
              />
              <StatsCard
                title="Active Cases"
                value={overview?.cases?.active || 0}
                icon={Briefcase}
                trend={`${overview?.cases?.thisMonth || 0} this month`}
                color="text-green-600"
              />
              <StatsCard
                title="Monthly Revenue"
                value={`₹${((overview?.financial?.monthlyRevenue || 0) / 1000).toFixed(1)}k`}
                icon={DollarSign}
                trend={`Total: ₹${((overview?.financial?.totalRevenue || 0) / 1000).toFixed(1)}k`}
                color="text-yellow-600"
              />
              <StatsCard
                title="System Health"
                value={(overview?.system?.errorNotifications || 0) === 0 ? "Good" : "Issues"}
                icon={Activity}
                trend={`${Math.floor((overview?.system?.uptime || 0) / 3600)}h uptime`}
                color={(overview?.system?.errorNotifications || 0) === 0 ? "text-green-600" : "text-red-600"}
              />
            </div>

            {/* Detailed Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="h-5 w-5 mr-2" />
                    User Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span>Total Lawyers</span>
                    <span className="font-semibold">{overview?.users?.lawyers || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Verified Lawyers</span>
                    <span className="font-semibold text-green-600">{overview?.users?.verifiedLawyers || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pending Verifications</span>
                    <span className="font-semibold text-orange-600">{overview?.users?.pendingVerifications || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Clients</span>
                    <span className="font-semibold">{overview?.users?.clients || 0}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Gavel className="h-5 w-5 mr-2" />
                    Case Management
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span>Total Cases</span>
                    <span className="font-semibold">{overview?.cases?.total || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Active Cases</span>
                    <span className="font-semibold text-blue-600">{overview?.cases?.active || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Completed Cases</span>
                    <span className="font-semibold text-green-600">{overview?.cases?.completed || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Success Rate</span>
                    <span className="font-semibold">
                      {(overview?.cases?.total || 0) > 0 
                        ? Math.round(((overview?.cases?.completed || 0) / (overview?.cases?.total || 1)) * 100)
                        : 0}%
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CreditCard className="h-5 w-5 mr-2" />
                    Financial Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span>Total Revenue</span>
                    <span className="font-semibold">₹{((overview?.financial?.totalRevenue || 0) / 1000).toFixed(1)}k</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pending Payments</span>
                    <span className="font-semibold text-orange-600">{overview?.financial?.pendingPayments || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Orders</span>
                    <span className="font-semibold">{overview?.financial?.totalOrders || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Completion Rate</span>
                    <span className="font-semibold">
                      {(overview?.financial?.totalOrders || 0) > 0
                        ? Math.round(((overview?.financial?.completedOrders || 0) / (overview?.financial?.totalOrders || 1)) * 100)
                        : 0}%
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Dashboard Tabs */}
            <Tabs defaultValue="users" className="space-y-4">
              <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8 gap-1">
                <TabsTrigger value="users" className="text-xs lg:text-sm">Users</TabsTrigger>
                <TabsTrigger value="verifications" className="text-xs lg:text-sm">Verifications</TabsTrigger>
                <TabsTrigger value="analytics" className="text-xs lg:text-sm">Analytics</TabsTrigger>
                <TabsTrigger value="cases" className="text-xs lg:text-sm">Cases</TabsTrigger>
                <TabsTrigger value="services" className="text-xs lg:text-sm">Services</TabsTrigger>
                <TabsTrigger value="financial" className="text-xs lg:text-sm">Financial</TabsTrigger>
                <TabsTrigger value="notifications" className="text-xs lg:text-sm">Notifications</TabsTrigger>
                <TabsTrigger value="system" className="text-xs lg:text-sm">System</TabsTrigger>
              </TabsList>

              <TabsContent value="users">
                <EnhancedUserManagement />
              </TabsContent>

              <TabsContent value="verifications">
                <VerificationManagementAdmin />
              </TabsContent>

              <TabsContent value="analytics">
                <AnalyticsDashboard />
              </TabsContent>

              <TabsContent value="cases">
                <CaseManagementAdmin />
              </TabsContent>

              <TabsContent value="services">
                <ServiceManagementAdmin />
              </TabsContent>

              <TabsContent value="financial">
                <FinancialOperationsAdmin />
              </TabsContent>

              <TabsContent value="notifications">
                <PlatformNotificationsAdmin />
              </TabsContent>

              <TabsContent value="system">
                <SystemHealthAdmin />
              </TabsContent>
            </Tabs>
          </>
        ) : (
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Failed to Load Dashboard</h3>
            <p className="text-gray-600 mb-4">There was an error loading the dashboard data.</p>
            <Button onClick={fetchOverview}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        )}
      </div>
      <Footer />
      <NotificationSystem />
    </div>
  );
};

export default AdminDashboard;