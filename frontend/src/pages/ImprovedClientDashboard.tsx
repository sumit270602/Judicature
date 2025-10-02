import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Briefcase, 
  Calendar, 
  CreditCard, 
  User, 
  Bell,
  TrendingUp,
  Clock,
  CheckCircle,
  DollarSign,
  FileText,
  Shield,
  MessageSquare,
  Bot,
  MessageCircle,
  Plus
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CaseManagementSection from '@/components/client/CaseManagementSection';
import PaymentsSection from '@/components/client/PaymentsSection';
import ProfileSettingsSection from '@/components/client/ProfileSettingsSection';
import NotificationsMessagesSection from '@/components/client/NotificationsMessagesSection';
import AnalyticsSection from '@/components/client/AnalyticsSection';
import AiAssistantSection from '@/components/AiAssistantSection';
import AICaseBuilder from '@/components/AICaseBuilder';
import { useAuth } from '@/hooks/use-auth';
import { useMessaging } from '@/hooks/use-messaging';
import { useNavigate } from 'react-router-dom';
import { api } from '@/api';
import { toast } from 'sonner';
import LinkedInMessaging from '@/components/LinkedInMessaging';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowRight } from 'lucide-react';

// Services Modal Component
const ServicesModal: React.FC<{ navigate: any }> = ({ navigate }) => {
  const serviceCategories = [
    { 
      id: 'personal_family', 
      name: 'Personal / Family Law',
      description: 'Divorce, custody, family disputes',
      icon: '👨‍👩‍👧‍👦',
      services: ['divorce', 'family_dispute', 'child_custody', 'muslim_law', 'medical_negligence', 'motor_accident']
    },
    { 
      id: 'criminal_property', 
      name: 'Criminal / Property Law',
      description: 'Criminal cases, property disputes',
      icon: '⚖️',
      services: ['criminal_case', 'property_dispute', 'landlord_tenant', 'cyber_crime', 'wills_trusts', 'labour_service']
    },
    { 
      id: 'civil_debt', 
      name: 'Civil / Debt Matters',
      description: 'Documentation, consumer cases',
      icon: '📋',
      services: ['documentation', 'consumer_court', 'civil_case', 'cheque_bounce', 'recovery']
    },
    { 
      id: 'corporate_law', 
      name: 'Corporate Law',
      description: 'Business, trademark, compliance',
      icon: '🏢',
      services: ['arbitration', 'trademark_copyright', 'customs_excise', 'startup_legal', 'banking_finance', 'gst_matters', 'corporate_compliance']
    },
    { 
      id: 'others', 
      name: 'Other Services',
      description: 'Specialized legal services',
      icon: '🔧',
      services: ['armed_forces_tribunal', 'supreme_court', 'insurance_claims', 'immigration', 'international_law', 'other']
    }
  ];

  const formatServiceName = (service: string) => {
    return service.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const handleServiceSelect = (categoryId: string, serviceType: string) => {
    navigate(`/create-case?category=${categoryId}&service=${serviceType}`);
  };

  return (
    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-xl">
          <Shield className="h-6 w-6 text-legal-navy" />
          Legal Services Directory
        </DialogTitle>
        <DialogDescription>
          Browse our comprehensive legal services and select the one that best matches your needs
        </DialogDescription>
      </DialogHeader>

      <div className="mt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {serviceCategories.map((category) => (
            <Card key={category.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-lg">
                  <span className="text-2xl">{category.icon}</span>
                  {category.name}
                </CardTitle>
                <CardDescription>{category.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {category.services.map((service) => (
                    <Button
                      key={service}
                      variant="ghost"
                      className="w-full justify-start text-left hover:bg-legal-gold/10"
                      onClick={() => handleServiceSelect(category.id, service)}
                    >
                      <ArrowRight className="mr-2 h-4 w-4 text-legal-gold" />
                      {formatServiceName(service)}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DialogContent>
  );
};

interface DashboardStats {
  totalCases: number;
  activeCases: number;
  completedCases: number;
  pendingPayments: number;
  nextCourtDate: string | null;
  totalSpent: number;
  unreadNotifications: number;
}

interface RecentActivity {
  _id: string;
  type: 'case_update' | 'payment_request' | 'court_date' | 'message';
  title: string;
  description: string;
  timestamp: string;
  caseId?: string;
  paymentId?: string;
}

const ImprovedClientDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalCases: 0,
    activeCases: 0,
    completedCases: 0,
    pendingPayments: 0,
    nextCourtDate: null,
    totalSpent: 0,
    unreadNotifications: 0
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('overview');
  const [isMessagingOpen, setIsMessagingOpen] = useState(false);
  
  const { unreadCount } = useMessaging();
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsResponse, activityResponse] = await Promise.all([
        api.get('/dashboard/client/stats'),
        api.get('/dashboard/client/recent-activity').catch(() => ({ data: { activities: [] } }))
      ]);
      
      setStats(statsResponse.data.stats || stats);
      setRecentActivity(activityResponse.data.activities || []);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: RecentActivity['type']) => {
    const iconMap = {
      case_update: Briefcase,
      payment_request: CreditCard,
      court_date: Calendar,
      message: MessageSquare
    };
    return iconMap[type] || Bell;
  };

  const getActivityColor = (type: RecentActivity['type']) => {
    const colorMap = {
      case_update: 'text-blue-600',
      payment_request: 'text-green-600',
      court_date: 'text-red-600',
      message: 'text-purple-600'
    };
    return colorMap[type] || 'text-gray-600';
  };

  const StatCard = ({ title, value, icon: Icon, description, color, trend }: {
    title: string;
    value: string | number;
    icon: React.ElementType;
    description: string;
    color: string;
    trend?: string;
  }) => (
    <Card className={`border-l-4 ${color} hover:shadow-md transition-shadow`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
        {trend && (
          <div className="flex items-center text-xs text-green-600 mt-1">
            <TrendingUp className="h-3 w-3 mr-1" />
            {trend}
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-legal-navy"></div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Welcome back, {user?.name?.split(' ')[0] || 'Client'}
              </h1>
              <p className="text-gray-600 text-lg">
                Here's what's happening with your legal matters today.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white font-medium px-6 py-2.5 w-full sm:w-auto"
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Access Services
                  </Button>
                </DialogTrigger>
                <ServicesModal navigate={navigate} />
              </Dialog>
              <Button
                onClick={() => navigate('/create-case')}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2.5 w-full sm:w-auto"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Case
              </Button>
              <Button
                onClick={() => setIsMessagingOpen(true)}
                variant="outline"
                className="relative font-medium px-6 py-2.5 w-full sm:w-auto"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Messages
                {unreadCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
                  >
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Badge>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <Tabs 
          value={activeSection} 
          onValueChange={setActiveSection}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-3 md:grid-cols-7 lg:w-auto lg:inline-flex">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="cases" className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Cases
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Payments
            </TabsTrigger>
            <TabsTrigger value="ai-assistant" className="flex items-center gap-2">
              <Bot className="h-4 w-4" />
              AI Assistant
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              {stats.unreadNotifications > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 text-xs">
                  {stats.unreadNotifications}
                </Badge>
              )}
              Notifications
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Total Cases"
                value={stats.totalCases}
                icon={Briefcase}
                description="All your cases"
                color="border-l-blue-500"
              />
              <StatCard
                title="Active Cases"
                value={stats.activeCases}
                icon={Clock}
                description="Currently in progress"
                color="border-l-yellow-500"
              />
              <StatCard
                title="Completed Cases"
                value={stats.completedCases}
                icon={CheckCircle}
                description="Successfully resolved"
                color="border-l-green-500"
              />
              <StatCard
                title="Pending Payments"
                value={`₹${stats.pendingPayments}`}
                icon={DollarSign}
                description="Outstanding payments"
                color="border-l-red-500"
              />
            </div>

            {/* AI Case Builder Section */}
            <AICaseBuilder />

            {/* Quick Actions & Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Quick Actions */}
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Quick Actions
                  </CardTitle>
                  <CardDescription>
                    Common tasks and shortcuts
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => setActiveSection('cases')}
                  >
                    <Briefcase className="h-4 w-4 mr-2" />
                    View All Cases
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => setActiveSection('payments')}
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Check Payments
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => setIsMessagingOpen(true)}
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Message Lawyer
                    {unreadCount > 0 && (
                      <Badge variant="destructive" className="ml-auto h-5 w-5 p-0 text-xs">
                        {unreadCount}
                      </Badge>
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => setActiveSection('profile')}
                  >
                    <User className="h-4 w-4 mr-2" />
                    Update Profile
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule Meeting
                  </Button>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Recent Activity
                  </CardTitle>
                  <CardDescription>
                    Latest updates on your cases and payments
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {recentActivity.length === 0 ? (
                    <div className="text-center py-8">
                      <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium">No recent activity</h3>
                      <p className="text-muted-foreground">
                        Activity updates will appear here
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {recentActivity.slice(0, 5).map((activity) => {
                        const Icon = getActivityIcon(activity.type);
                        const colorClass = getActivityColor(activity.type);
                        
                        return (
                          <div 
                            key={activity._id} 
                            className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                            onClick={() => {
                              if (activity.caseId) {
                                navigate(`/case/${activity.caseId}/view`);
                              }
                            }}
                          >
                            <div className={`p-2 rounded-full bg-gray-100 ${colorClass}`}>
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-sm">{activity.title}</h4>
                              <p className="text-sm text-muted-foreground">{activity.description}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(activity.timestamp).toLocaleString()}
                              </p>
                              {activity.caseId && (
                                <p className="text-xs text-blue-600 mt-1">Click to view case details →</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Upcoming Events */}
            {stats.nextCourtDate && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Upcoming Events
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg">
                    <Calendar className="h-8 w-8 text-blue-600" />
                    <div>
                      <h4 className="font-medium">Next Court Hearing</h4>
                      <p className="text-muted-foreground">{stats.nextCourtDate}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Case Management Tab */}
          <TabsContent value="cases">
            <CaseManagementSection />
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments">
            <PaymentsSection />
          </TabsContent>

          {/* AI Assistant Tab */}
          <TabsContent value="ai-assistant">
            <AiAssistantSection />
          </TabsContent>

          {/* Notifications & Messages Tab */}
          <TabsContent value="notifications">
            <NotificationsMessagesSection />
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <AnalyticsSection />
          </TabsContent>

          {/* Profile & Settings Tab */}
          <TabsContent value="profile">
            <ProfileSettingsSection />
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
      
      {/* LinkedIn-style Messaging Window */}
      <LinkedInMessaging
        isOpen={isMessagingOpen}
        onClose={() => setIsMessagingOpen(false)}
      />
    </div>
  );
};

export default ImprovedClientDashboard;