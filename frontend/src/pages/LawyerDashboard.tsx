import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Calendar, Clock, FileText, Users, DollarSign, AlertCircle, Briefcase, MessageSquare, Bell, TrendingUp, User, Shield, Upload } from 'lucide-react';
import { useLawyerDashboard, useRealTimeUpdates } from '@/hooks/useDashboard';
import { useAuth } from '@/hooks/use-auth';
import { api } from '@/api';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import MessagingTrigger from '@/components/MessagingTrigger';
import LawyerProfileManagement from '@/components/LawyerProfileManagement';
import LawyerServiceManagement from '@/components/LawyerServiceManagement';
import LawyerOnboarding from '@/components/LawyerOnboarding';
import OrderManagement from '@/components/OrderManagement';
import PaymentRequests from '@/components/PaymentRequests';
import CreatePaymentRequest from '@/components/CreatePaymentRequest';

// Dashboard stats type
interface DashboardStats {
  activeCases: number;
  todayHearings: number;
  pendingTasks: number;
  monthlyRevenue: number;
}

// Case interface
interface Case {
  _id: string;
  title: string;
  client: {
    name: string;
    email: string;
  };
  status: 'active' | 'pending' | 'in_progress' | 'resolved' | 'completed' | 'closed';
  priority: 'high' | 'medium' | 'low';
  nextHearing?: string;
  progress: number;
  workProof?: {
    documentId: string;
    uploadedAt: string;
    description: string;
  };
}

// Header stats cards component
const LawyerHeaderCards = ({ stats }: { stats: DashboardStats }) => (
  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
    <Card className="border-l-4 border-l-legal-navy">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Active Cases</CardTitle>
        <Briefcase className="h-4 w-4 text-legal-navy" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-legal-navy">{stats.activeCases}</div>
        <p className="text-xs text-muted-foreground">+2 from last month</p>
      </CardContent>
    </Card>
    
    <Card className="border-l-4 border-l-legal-gold">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Today's Hearings</CardTitle>
        <Calendar className="h-4 w-4 text-legal-gold" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-legal-gold">{stats.todayHearings}</div>
        <p className="text-xs text-muted-foreground">3 scheduled this week</p>
      </CardContent>
    </Card>
    
    <Card className="border-l-4 border-l-orange-500">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
        <AlertCircle className="h-4 w-4 text-orange-500" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-orange-500">{stats.pendingTasks}</div>
        <p className="text-xs text-muted-foreground">5 due this week</p>
      </CardContent>
    </Card>
    
    <Card className="border-l-4 border-l-green-500">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
        <DollarSign className="h-4 w-4 text-green-500" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-green-500">${stats.monthlyRevenue.toLocaleString()}</div>
        <p className="text-xs text-muted-foreground">+12% from last month</p>
      </CardContent>
    </Card>
  </div>
);

// Enhanced Case Management component with tabs
const EnhancedCaseManagement = ({ cases }: { cases: Case[] }) => {
  const pendingCases = cases.filter(c => ['active', 'pending', 'in_progress'].includes(c.status));
  const resolvedCases = cases.filter(c => c.status === 'resolved');
  const completedCases = cases.filter(c => ['completed', 'closed'].includes(c.status));

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-purple-100 text-purple-800';
      case 'resolved': return 'bg-orange-100 text-orange-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const CaseTable = ({ cases, showWorkProofColumn = false }: { cases: Case[], showWorkProofColumn?: boolean }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Case Title</TableHead>
          <TableHead>Client</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Priority</TableHead>
          <TableHead>Progress</TableHead>
          {showWorkProofColumn && <TableHead>Work Status</TableHead>}
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {cases.length === 0 ? (
          <TableRow>
            <TableCell colSpan={showWorkProofColumn ? 7 : 6} className="text-center py-8 text-muted-foreground">
              No cases found
            </TableCell>
          </TableRow>
        ) : (
          cases.map((case_) => (
            <TableRow key={case_._id}>
              <TableCell className="font-medium">{case_.title}</TableCell>
              <TableCell>{case_.client?.name || 'N/A'}</TableCell>
              <TableCell>
                <Badge className={`capitalize ${getStatusColor(case_.status)}`}>
                  {case_.status === 'resolved' ? 'Payment Processing' : case_.status}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge 
                  variant={case_.priority === 'high' ? 'destructive' : case_.priority === 'medium' ? 'default' : 'secondary'}
                >
                  {case_.priority}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Progress value={case_.progress} className="w-16" />
                  <span className="text-sm">{case_.progress}%</span>
                </div>
              </TableCell>
              {showWorkProofColumn && (
                <TableCell>
                  <div className="flex items-center gap-1">
                    {case_.status === 'resolved' ? (
                      <Badge variant="outline" className="text-green-600">
                        <Upload className="h-3 w-3 mr-1" />
                        Proof Submitted
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-gray-500">
                        Pending
                      </Badge>
                    )}
                  </div>
                </TableCell>
              )}
              <TableCell>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.location.href = `/case/${case_._id}/view`}
                  >
                    View Details
                  </Button>
                  {case_.status === 'resolved' && (
                    <Badge variant="secondary" className="text-xs">
                      Payment Pending
                    </Badge>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Briefcase className="h-5 w-5" />
          Case Management
        </CardTitle>
        <CardDescription>Manage your cases and track work completion</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Pending ({pendingCases.length})
            </TabsTrigger>
            <TabsTrigger value="resolved" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Payment Processing ({resolvedCases.length})
            </TabsTrigger>
            <TabsTrigger value="completed" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Completed ({completedCases.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-4">
            <div className="mb-4">
              <h3 className="text-lg font-semibold">Active & Pending Cases</h3>
              <p className="text-sm text-muted-foreground">Cases requiring your attention and work completion</p>
            </div>
            <CaseTable cases={pendingCases} showWorkProofColumn={true} />
          </TabsContent>

          <TabsContent value="resolved" className="mt-4">
            <div className="mb-4">
              <h3 className="text-lg font-semibold">Resolved Cases - Payment Processing</h3>
              <p className="text-sm text-muted-foreground">Work completed, waiting for client payment confirmation</p>
            </div>
            <CaseTable cases={resolvedCases} />
          </TabsContent>

          <TabsContent value="completed" className="mt-4">
            <div className="mb-4">
              <h3 className="text-lg font-semibold">Completed Cases</h3>
              <p className="text-sm text-muted-foreground">Successfully completed and paid cases</p>
            </div>
            <CaseTable cases={completedCases} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

// Client List component
const ClientList = () => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Users className="h-5 w-5" />
        Recent Clients
      </CardTitle>
      <CardDescription>Your most recent client interactions</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        {[
          { name: 'John Smith', case: 'Property Dispute', lastContact: '2 hours ago', avatar: '/api/placeholder/32/32' },
          { name: 'Sarah Johnson', case: 'Contract Review', lastContact: '1 day ago', avatar: '/api/placeholder/32/32' },
          { name: 'Michael Brown', case: 'Business Formation', lastContact: '3 days ago', avatar: '/api/placeholder/32/32' },
          { name: 'Emma Wilson', case: 'Employment Issue', lastContact: '1 week ago', avatar: '/api/placeholder/32/32' },
        ].map((client, index) => (
          <div key={index} className="flex items-center space-x-4">
            <Avatar>
              <AvatarImage src={client.avatar} />
              <AvatarFallback>{client.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-1">
              <p className="text-sm font-medium">{client.name}</p>
              <p className="text-xs text-muted-foreground">{client.case}</p>
            </div>
            <div className="text-xs text-muted-foreground">{client.lastContact}</div>
          </div>
        ))}
      </div>
      <Separator className="my-4" />
      <Button variant="outline" className="w-full">
        <MessageSquare className="mr-2 h-4 w-4" />
        View All Clients
      </Button>
    </CardContent>
  </Card>
);

// Court Schedule component
const CourtSchedule = () => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Calendar className="h-5 w-5" />
        Upcoming Schedule
      </CardTitle>
      <CardDescription>Your court hearings and deadlines</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        {[
          { title: 'Smith vs. Johnson', type: 'Hearing', date: 'Today 2:00 PM', court: 'District Court A' },
          { title: 'Contract Review Deadline', type: 'Deadline', date: 'Tomorrow 5:00 PM', court: 'Client Submission' },
          { title: 'Brown Property Case', type: 'Hearing', date: 'Dec 28, 10:00 AM', court: 'District Court B' },
        ].map((item, index) => (
          <div key={index} className="flex items-start space-x-3">
            <div className={`w-2 h-2 rounded-full mt-2 ${item.type === 'Hearing' ? 'bg-legal-navy' : 'bg-orange-500'}`} />
            <div className="flex-1">
              <p className="text-sm font-medium">{item.title}</p>
              <p className="text-xs text-muted-foreground">{item.court}</p>
              <p className="text-xs text-legal-navy font-medium">{item.date}</p>
            </div>
          </div>
        ))}
      </div>
      <Separator className="my-4" />
      <Button variant="outline" className="w-full">
        <Calendar className="mr-2 h-4 w-4" />
        View Full Calendar
      </Button>
    </CardContent>
  </Card>
);

// Legal Research component
const LegalResearch = () => (
  <Card className="mb-6">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <FileText className="h-5 w-5" />
        AI Legal Research
      </CardTitle>
      <CardDescription>AI-powered research tools and case law search</CardDescription>
    </CardHeader>
    <CardContent>
      <Tabs defaultValue="recent" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="recent">Recent Searches</TabsTrigger>
          <TabsTrigger value="saved">Saved Research</TabsTrigger>
        </TabsList>
        <TabsContent value="recent" className="space-y-4">
          {[
            { query: 'Property dispute precedents', date: '2 hours ago', results: 15 },
            { query: 'Contract law amendments 2024', date: '1 day ago', results: 8 },
            { query: 'Employment termination cases', date: '3 days ago', results: 23 },
          ].map((search, index) => (
            <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
              <div>
                <p className="text-sm font-medium">{search.query}</p>
                <p className="text-xs text-muted-foreground">{search.date} • {search.results} results</p>
              </div>
              <Button variant="ghost" size="sm">View</Button>
            </div>
          ))}
        </TabsContent>
        <TabsContent value="saved" className="space-y-4">
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No saved research yet</p>
          </div>
        </TabsContent>
      </Tabs>
      <Button className="w-full mt-4">
        <FileText className="mr-2 h-4 w-4" />
        Start New Research
      </Button>
    </CardContent>
  </Card>
);

// Document Management component
const DocumentManagement = () => (
  <Card className="mb-6">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <FileText className="h-5 w-5" />
        Document Management
      </CardTitle>
      <CardDescription>Templates, storage, and document sharing</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center p-4 border-2 border-dashed border-muted rounded-lg">
          <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm font-medium">Templates</p>
          <p className="text-xs text-muted-foreground">12 available</p>
        </div>
        <div className="text-center p-4 border-2 border-dashed border-muted rounded-lg">
          <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm font-medium">Recent Files</p>
          <p className="text-xs text-muted-foreground">8 documents</p>
        </div>
      </div>
      <div className="space-y-2">
        {[
          { name: 'Contract Template v2.docx', size: '2.3 MB', modified: '2 hours ago' },
          { name: 'Client Agreement.pdf', size: '1.8 MB', modified: '1 day ago' },
          { name: 'Case Summary Report.docx', size: '3.1 MB', modified: '3 days ago' },
        ].map((doc, index) => (
          <div key={index} className="flex items-center justify-between p-2 rounded hover:bg-muted">
            <div className="flex items-center gap-3">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{doc.name}</p>
                <p className="text-xs text-muted-foreground">{doc.size} • {doc.modified}</p>
              </div>
            </div>
            <Button variant="ghost" size="sm">Open</Button>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

// Enhanced Payments & Escrow Management component
const PaymentsEscrowManagement = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setIsLoading(true);
        const { data } = await api.get('/orders');
        setOrders(data.orders || []);
      } catch (error) {
        console.error('Failed to fetch orders:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const formatCurrency = (amount: number, currency: string = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: 0,
    }).format(amount / 100);
  };

  const getTotalEarnings = () => {
    return orders
      .filter(order => order.status === 'completed')
      .reduce((total, order) => total + order.amount, 0);
  };

  const getPendingEscrow = () => {
    return orders
      .filter(order => order.escrowStatus === 'held')
      .reduce((total, order) => total + order.amount, 0);
  };

  if (isLoading) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Loading...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-legal-navy" />
          Escrow & Payments
        </CardTitle>
        <CardDescription>Manage client payments and escrow funds</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Payment Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="text-center p-4 border rounded-lg bg-green-50">
              <div className="text-lg font-bold text-green-600">
                {formatCurrency(getTotalEarnings())}
              </div>
              <div className="text-sm text-green-700">Total Earnings</div>
            </div>
            <div className="text-center p-4 border rounded-lg bg-blue-50">
              <div className="text-lg font-bold text-blue-600">
                {formatCurrency(getPendingEscrow())}
              </div>
              <div className="text-sm text-blue-700">Pending in Escrow</div>
            </div>
          </div>

          {/* Recent Orders */}
          <div>
            <h4 className="text-sm font-medium mb-3">Recent Client Orders</h4>
            <div className="space-y-2">
              {orders.length > 0 ? orders.slice(0, 3).map((order) => (
                <div key={order._id} className="flex justify-between items-center p-3 border rounded-lg">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{order.orderId}</p>
                    <p className="text-xs text-muted-foreground">
                      Client: {order.client?.name}
                    </p>
                    <Badge variant="outline" className="mt-1">
                      {order.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {formatCurrency(order.amount, order.currency)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {order.serviceType.replace('_', ' ')}
                    </p>
                  </div>
                </div>
              )) : (
                <div className="text-center py-4 text-muted-foreground">
                  <Shield className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No client orders yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm">
              <Upload className="mr-2 h-4 w-4" />
              Upload Work
            </Button>
            <Button variant="outline" size="sm">
              <DollarSign className="mr-2 h-4 w-4" />
              View Payouts
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Team Collaboration component
const TeamCollaboration = () => (
  <Card className="mb-6">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Users className="h-5 w-5" />
        Team Collaboration
      </CardTitle>
      <CardDescription>Task delegation and internal messaging</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Bell className="h-5 w-5 text-orange-500" />
          <div className="flex-1">
            <p className="text-sm font-medium">3 new notifications</p>
            <p className="text-xs text-muted-foreground">Team updates and mentions</p>
          </div>
        </div>
        
        <Separator />
        
        <div>
          <h4 className="text-sm font-medium mb-2">Recent Activity</h4>
          <div className="space-y-2">
            {[
              { user: 'Sarah Miller', action: 'completed research task', time: '2h ago' },
              { user: 'John Davis', action: 'updated case notes', time: '4h ago' },
              { user: 'Emma Thompson', action: 'shared new document', time: '1d ago' },
            ].map((activity, index) => (
              <div key={index} className="flex items-center gap-3">
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-xs">{activity.user.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-xs">
                    <span className="font-medium">{activity.user}</span> {activity.action}
                  </p>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <Button variant="outline" className="w-full">
          <MessageSquare className="mr-2 h-4 w-4" />
          Open Team Chat
        </Button>
      </div>
    </CardContent>
  </Card>
);

// Analytics component
const Analytics = () => (
  <Card className="mb-6">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <TrendingUp className="h-5 w-5" />
        Analytics & Reports
      </CardTitle>
      <CardDescription>Performance metrics and insights</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-muted rounded-lg">
            <p className="text-2xl font-bold text-legal-navy">85%</p>
            <p className="text-xs text-muted-foreground">Case Win Rate</p>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <p className="text-2xl font-bold text-green-600">$45k</p>
            <p className="text-xs text-muted-foreground">This Quarter</p>
          </div>
        </div>
        
        <div>
          <h4 className="text-sm font-medium mb-2">Case Distribution</h4>
          <div className="space-y-2">
            {[
              { type: 'Property Law', count: 8, percentage: 40 },
              { type: 'Contract Law', count: 6, percentage: 30 },
              { type: 'Business Law', count: 4, percentage: 20 },
              { type: 'Employment Law', count: 2, percentage: 10 },
            ].map((item, index) => (
              <div key={index}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{item.type}</span>
                  <span>{item.count} cases</span>
                </div>
                <Progress value={item.percentage} className="h-2" />
              </div>
            ))}
          </div>
        </div>
        
        <Button variant="outline" className="w-full">
          <TrendingUp className="mr-2 h-4 w-4" />
          View Detailed Reports
        </Button>
      </div>
    </CardContent>
  </Card>
);

const LawyerDashboard: React.FC = () => {
  const { user } = useAuth();
  const { stats, cases, isLoading, error } = useLawyerDashboard();
  
  // Set up real-time updates
  useRealTimeUpdates(user?.id || '', 'lawyer');

  // Loading state
  if (isLoading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gradient-to-br from-legal-navy/5 to-legal-gold/5 pt-24 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-300 rounded w-1/4 mb-4"></div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-32 bg-gray-300 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  // Error state
  if (error) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gradient-to-br from-legal-navy/5 to-legal-gold/5 pt-24 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-legal-navy mb-2">Error Loading Dashboard</h2>
              <p className="text-slate-600">Unable to load dashboard data. Please try again.</p>
              <Button 
                onClick={() => window.location.reload()} 
                className="mt-4 bg-legal-gold hover:bg-legal-gold/90 text-legal-navy"
              >
                Retry
              </Button>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  // Default values if data not loaded yet
  const defaultStats: DashboardStats = {
    activeCases: 0,
    todayHearings: 0,
    pendingTasks: 0,
    monthlyRevenue: 0
  };

  const displayStats = stats || defaultStats;
  const displayCases = cases || [];

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-legal-navy/5 to-legal-gold/5 pt-24 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-legal-navy mb-2">Lawyer Dashboard</h1>
              <p className="text-slate-600">Welcome back! Here's your practice overview for today.</p>
            </div>
            <MessagingTrigger />
          </div>

          {/* Dashboard Tabs */}
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-8">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="payments" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Payments & Escrow
              </TabsTrigger>
              <TabsTrigger value="services" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Services & Pricing
              </TabsTrigger>
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Professional Profile
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview">
              {/* Stats Cards */}
              <LawyerHeaderCards stats={displayStats} />
              
              {/* Main Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Main Content */}
                <div className="lg:col-span-2 space-y-6">
                  <EnhancedCaseManagement cases={displayCases} />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <ClientList />
                    <CourtSchedule />
                  </div>
                  
                  <LegalResearch />
                  <DocumentManagement />
                </div>
                
                {/* Right Column - Sidebar */}
                <div className="space-y-6">
                  <PaymentsEscrowManagement />
                  <TeamCollaboration />
                  <Analytics />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="payments">
              <div className="space-y-6">
                <LawyerOnboarding user={user} />
                
                <Tabs defaultValue="requests" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="requests">Payment Requests</TabsTrigger>
                    <TabsTrigger value="create">Create Request</TabsTrigger>
                    <TabsTrigger value="orders">Orders & Escrow</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="requests" className="space-y-4">
                    <PaymentRequests userRole="lawyer" />
                  </TabsContent>
                  
                  <TabsContent value="create" className="space-y-4">
                    <CreatePaymentRequest />
                  </TabsContent>
                  
                  <TabsContent value="orders" className="space-y-4">
                    <OrderManagement userRole="lawyer" userId={user?.id || ''} />
                  </TabsContent>
                </Tabs>
              </div>
            </TabsContent>
            
            <TabsContent value="services">
              <LawyerServiceManagement />
            </TabsContent>
            
            <TabsContent value="profile">
              <LawyerProfileManagement />
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default LawyerDashboard;