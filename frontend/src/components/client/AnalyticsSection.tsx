import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  DollarSign,
  Clock,
  CheckCircle,
  FileText,
  User,
  PieChart,
  Target,
  Award,
  Activity
} from 'lucide-react';
import { api } from '@/api';
import { toast } from 'sonner';

interface AnalyticsData {
  caseMetrics: {
    totalCases: number;
    activeCases: number;
    completedCases: number;
    averageResolutionTime: number;
    successRate: number;
    casesByType: Array<{
      type: string;
      count: number;
      percentage: number;
    }>;
    casesByStatus: Array<{
      status: string;
      count: number;
      percentage: number;
    }>;
  };
  financialMetrics: {
    totalSpent: number;
    averageServiceCost: number;
    monthlySpending: Array<{
      month: string;
      amount: number;
    }>;
    spendingByService: Array<{
      service: string;
      amount: number;
      percentage: number;
    }>;
  };
  performanceMetrics: {
    responseTime: number;
    satisfaction: number;
    recommendations: number;
    lawyerRating: number;
  };
  timeline: Array<{
    date: string;
    event: string;
    type: 'case' | 'payment' | 'meeting' | 'document';
    description: string;
  }>;
}

const AnalyticsSection: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('6m'); // 1m, 3m, 6m, 1y

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  const fetchAnalyticsData = async () => {
    try {
      const response = await api.get(`/dashboard/client/analytics?timeRange=${timeRange}`);
      setAnalyticsData(response.data.analytics);
    } catch (error) {
      console.error('Failed to fetch analytics data:', error);
      
      // Mock data for demonstration
      setAnalyticsData({
        caseMetrics: {
          totalCases: 12,
          activeCases: 3,
          completedCases: 9,
          averageResolutionTime: 45,
          successRate: 85,
          casesByType: [
            { type: 'Contract Dispute', count: 4, percentage: 33 },
            { type: 'Property Law', count: 3, percentage: 25 },
            { type: 'Family Law', count: 2, percentage: 17 },
            { type: 'Corporate Law', count: 2, percentage: 17 },
            { type: 'Other', count: 1, percentage: 8 }
          ],
          casesByStatus: [
            { status: 'Completed', count: 9, percentage: 75 },
            { status: 'In Progress', count: 2, percentage: 17 },
            { status: 'Pending', count: 1, percentage: 8 }
          ]
        },
        financialMetrics: {
          totalSpent: 125000,
          averageServiceCost: 10400,
          monthlySpending: [
            { month: 'Jan', amount: 15000 },
            { month: 'Feb', amount: 22000 },
            { month: 'Mar', amount: 18000 },
            { month: 'Apr', amount: 25000 },
            { month: 'May', amount: 20000 },
            { month: 'Jun', amount: 25000 }
          ],
          spendingByService: [
            { service: 'Legal Consultation', amount: 45000, percentage: 36 },
            { service: 'Document Review', amount: 30000, percentage: 24 },
            { service: 'Court Representation', amount: 35000, percentage: 28 },
            { service: 'Contract Drafting', amount: 15000, percentage: 12 }
          ]
        },
        performanceMetrics: {
          responseTime: 2.5,
          satisfaction: 4.8,
          recommendations: 95,
          lawyerRating: 4.9
        },
        timeline: [
          {
            date: '2024-09-15',
            event: 'Case Resolved',
            type: 'case',
            description: 'Contract dispute case successfully resolved'
          },
          {
            date: '2024-09-10',
            event: 'Payment Completed',
            type: 'payment',
            description: 'Payment of ₹25,000 processed for legal services'
          },
          {
            date: '2024-09-05',
            event: 'Document Submitted',
            type: 'document',
            description: 'Property deed review completed'
          }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ 
    title, 
    value, 
    change,
    changeType,
    icon: Icon, 
    color 
  }: {
    title: string;
    value: string | number;
    change?: string;
    changeType?: 'up' | 'down';
    icon: React.ElementType;
    color: string;
  }) => (
    <Card className={`border-l-4 ${color}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {change && (
              <div className={`flex items-center text-sm ${
                changeType === 'up' ? 'text-green-600' : 'text-red-600'
              }`}>
                {changeType === 'up' ? (
                  <TrendingUp className="h-4 w-4 mr-1" />
                ) : (
                  <TrendingDown className="h-4 w-4 mr-1" />
                )}
                {change}
              </div>
            )}
          </div>
          <Icon className="h-8 w-8 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  );

  const ProgressBar = ({ label, value, color }: { label: string; value: number; color: string }) => (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <Progress value={value} className={`h-2 ${color}`} />
    </div>
  );

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Analytics & Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-legal-navy"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analyticsData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Analytics & Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium">No analytics data available</h3>
            <p className="text-muted-foreground">
              Analytics will be available once you have more case activity.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Analytics & Insights
            </CardTitle>
            <CardDescription>
              Comprehensive analysis of your legal services and case performance
            </CardDescription>
          </div>
          
          <div className="flex gap-2">
            {['1m', '3m', '6m', '1y'].map((range) => (
              <Button
                key={range}
                variant={timeRange === range ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeRange(range)}
              >
                {range === '1y' ? '1 Year' : range.replace('m', ' Months')}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="cases">Case Analytics</TabsTrigger>
            <TabsTrigger value="financial">Financial</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>
          
          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Total Cases"
                value={analyticsData.caseMetrics.totalCases}
                change="+2 this month"
                changeType="up"
                icon={FileText}
                color="border-l-blue-500"
              />
              <StatCard
                title="Success Rate"
                value={`${analyticsData.caseMetrics.successRate}%`}
                change="+5% improvement"
                changeType="up"
                icon={Target}
                color="border-l-green-500"
              />
              <StatCard
                title="Total Spent"
                value={`₹${analyticsData.financialMetrics.totalSpent.toLocaleString()}`}
                change="+₹25k this month"
                changeType="up"
                icon={DollarSign}
                color="border-l-purple-500"
              />
              <StatCard
                title="Avg Resolution"
                value={`${analyticsData.caseMetrics.averageResolutionTime} days`}
                change="-5 days faster"
                changeType="up"
                icon={Clock}
                color="border-l-orange-500"
              />
            </div>
            
            {/* Recent Activity Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.timeline.map((item, index) => (
                    <div key={index} className="flex items-start gap-3 pb-4 last:pb-0 border-b last:border-b-0">
                      <div className="p-2 rounded-full bg-blue-50 text-blue-600">
                        {item.type === 'case' && <FileText className="h-4 w-4" />}
                        {item.type === 'payment' && <DollarSign className="h-4 w-4" />}
                        {item.type === 'meeting' && <Calendar className="h-4 w-4" />}
                        {item.type === 'document' && <FileText className="h-4 w-4" />}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{item.event}</h4>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(item.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Case Analytics Tab */}
          <TabsContent value="cases" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Cases by Type */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    Cases by Type
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {analyticsData.caseMetrics.casesByType.map((item, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{item.type}</span>
                        <span>{item.count} cases ({item.percentage}%)</span>
                      </div>
                      <Progress value={item.percentage} className="h-2" />
                    </div>
                  ))}
                </CardContent>
              </Card>
              
              {/* Cases by Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    Cases by Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {analyticsData.caseMetrics.casesByStatus.map((item, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{item.status}</span>
                        <span>{item.count} cases ({item.percentage}%)</span>
                      </div>
                      <Progress value={item.percentage} className="h-2" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Financial Tab */}
          <TabsContent value="financial" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Monthly Spending */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Monthly Spending Trend
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analyticsData.financialMetrics.monthlySpending.map((item, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-sm font-medium">{item.month}</span>
                        <div className="text-right">
                          <div className="text-sm font-semibold">₹{item.amount.toLocaleString()}</div>
                          <div className="w-24 bg-gray-200 rounded-full h-2 mt-1">
                            <div 
                              className="bg-blue-500 h-2 rounded-full" 
                              style={{ width: `${(item.amount / 25000) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              {/* Spending by Service */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Spending by Service
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {analyticsData.financialMetrics.spendingByService.map((item, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{item.service}</span>
                        <span>₹{item.amount.toLocaleString()} ({item.percentage}%)</span>
                      </div>
                      <Progress value={item.percentage} className="h-2" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Response Time"
                value={`${analyticsData.performanceMetrics.responseTime}h`}
                change="-0.5h improvement"
                changeType="up"
                icon={Clock}
                color="border-l-blue-500"
              />
              <StatCard
                title="Satisfaction"
                value={`${analyticsData.performanceMetrics.satisfaction}/5`}
                change="+0.2 increase"
                changeType="up"
                icon={Award}
                color="border-l-green-500"
              />
              <StatCard
                title="Recommendations"
                value={`${analyticsData.performanceMetrics.recommendations}%`}
                change="+5% increase"
                changeType="up"
                icon={Target}
                color="border-l-purple-500"
              />
              <StatCard
                title="Lawyer Rating"
                value={`${analyticsData.performanceMetrics.lawyerRating}/5`}
                change="Excellent"
                changeType="up"
                icon={User}
                color="border-l-orange-500"
              />
            </div>
            
            {/* Performance Metrics Details */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <ProgressBar 
                  label="Case Resolution Efficiency" 
                  value={analyticsData.caseMetrics.successRate} 
                  color="bg-green-500" 
                />
                <ProgressBar 
                  label="Client Satisfaction Score" 
                  value={(analyticsData.performanceMetrics.satisfaction / 5) * 100} 
                  color="bg-blue-500" 
                />
                <ProgressBar 
                  label="Recommendation Rate" 
                  value={analyticsData.performanceMetrics.recommendations} 
                  color="bg-purple-500" 
                />
                <ProgressBar 
                  label="Lawyer Performance Rating" 
                  value={(analyticsData.performanceMetrics.lawyerRating / 5) * 100} 
                  color="bg-orange-500" 
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default AnalyticsSection;