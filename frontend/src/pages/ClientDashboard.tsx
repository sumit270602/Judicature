import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar, Clock, FileText, User, DollarSign, Bell, Briefcase, MessageSquare, Download, Upload, Shield, Settings, AlertCircle } from 'lucide-react';
import { useClientDashboard, useRealTimeUpdates, type Case } from '@/hooks/useDashboard';
import { useAuth } from '@/hooks/use-auth';

// Client dashboard stats
interface ClientDashboardStats {
  activeCases: number;
  nextCourtDate: string;
  pendingActions: number;
}

// Timeline event interface
interface TimelineEvent {
  _id: string;
  title: string;
  description: string;
  createdAt: string;
  type: 'update' | 'document' | 'hearing' | 'payment';
}

// Header stats cards for clients
const ClientHeaderCards = ({ stats }: { stats: ClientDashboardStats }) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
    <Card className="border-l-4 border-l-legal-navy">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Active Cases</CardTitle>
        <Briefcase className="h-4 w-4 text-legal-navy" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-legal-navy">{stats.activeCases}</div>
        <p className="text-xs text-muted-foreground">Your ongoing legal matters</p>
      </CardContent>
    </Card>
    
    <Card className="border-l-4 border-l-legal-gold">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Next Court Date</CardTitle>
        <Calendar className="h-4 w-4 text-legal-gold" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-legal-gold">{stats.nextCourtDate}</div>
        <p className="text-xs text-muted-foreground">Upcoming appearance</p>
      </CardContent>
    </Card>
    
    <Card className="border-l-4 border-l-orange-500">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Pending Actions</CardTitle>
        <Bell className="h-4 w-4 text-orange-500" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-orange-500">{stats.pendingActions}</div>
        <p className="text-xs text-muted-foreground">Items requiring attention</p>
      </CardContent>
    </Card>
  </div>
);

// Case Timeline Feed component
const CaseTimelineFeed = ({ events }: { events: TimelineEvent[] }) => (
  <Card className="mb-6">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Clock className="h-5 w-5" />
        Case Timeline Feed
      </CardTitle>
      <CardDescription>Recent updates on your cases</CardDescription>
    </CardHeader>
    <CardContent>
      <ScrollArea className="h-80">
        <div className="space-y-4">
          {events.length > 0 ? events.map((event) => (
            <div key={event._id} className="flex items-start space-x-4">
              <div className={`w-2 h-2 rounded-full mt-2 ${
                event.type === 'update' ? 'bg-blue-500' :
                event.type === 'document' ? 'bg-green-500' :
                event.type === 'hearing' ? 'bg-legal-navy' :
                'bg-orange-500'
              }`} />
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium">{event.title}</p>
                <p className="text-xs text-muted-foreground">{event.description}</p>
                <p className="text-xs text-legal-navy">{new Date(event.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          )) : (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No recent updates</p>
            </div>
          )}
        </div>
      </ScrollArea>
      <Button variant="outline" className="w-full mt-4">
        <Clock className="mr-2 h-4 w-4" />
        View All Updates
      </Button>
    </CardContent>
  </Card>
);

// My Cases Table component
const MyCasesTable = ({ cases }: { cases: Case[] }) => (
  <Card className="mb-6">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Briefcase className="h-5 w-5" />
        My Cases
      </CardTitle>
      <CardDescription>Overview of your legal matters</CardDescription>
    </CardHeader>
    <CardContent>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Case Title</TableHead>
            <TableHead>Lawyer</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Progress</TableHead>
            <TableHead>Next Hearing</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {cases.length > 0 ? cases.map((case_) => (
            <TableRow key={case_._id}>
              <TableCell className="font-medium">{case_.title}</TableCell>
              <TableCell>{case_.lawyer?.name || 'Not assigned'}</TableCell>
              <TableCell>
                <Badge 
                  variant={case_.status === 'active' ? 'default' : case_.status === 'pending' ? 'secondary' : 'outline'}
                >
                  {case_.status}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Progress value={case_.progress || 0} className="w-16" />
                  <span className="text-sm">{case_.progress || 0}%</span>
                </div>
              </TableCell>
              <TableCell className="text-sm">
                {case_.nextHearing ? new Date(case_.nextHearing).toLocaleDateString() : 'TBD'}
              </TableCell>
              <TableCell>
                <Button variant="outline" size="sm">View Details</Button>
              </TableCell>
            </TableRow>
          )) : (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                No cases found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </CardContent>
  </Card>
);

// Document Vault component
const DocumentVault = () => (
  <Card className="mb-6">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <FileText className="h-5 w-5" />
        Document Vault
      </CardTitle>
      <CardDescription>Your legal documents and case files</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="text-center p-4 border-2 border-dashed border-muted rounded-lg hover:border-legal-navy transition-colors cursor-pointer">
          <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm font-medium">Upload Document</p>
          <p className="text-xs text-muted-foreground">Drag & drop or click to browse</p>
        </div>
        <div className="text-center p-4 border rounded-lg bg-muted/50">
          <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm font-medium">Total Documents</p>
          <p className="text-2xl font-bold text-legal-navy">15</p>
        </div>
      </div>
      
      <div className="space-y-2">
        <h4 className="text-sm font-medium">Recent Documents</h4>
        {[
          { name: 'Property Agreement.pdf', size: '2.1 MB', date: '2 days ago', type: 'Contract' },
          { name: 'Case Evidence Photos.zip', size: '5.3 MB', date: '1 week ago', type: 'Evidence' },
          { name: 'Court Filing Form.pdf', size: '1.2 MB', date: '2 weeks ago', type: 'Filing' },
        ].map((doc, index) => (
          <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
            <div className="flex items-center gap-3">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{doc.name}</p>
                <p className="text-xs text-muted-foreground">{doc.type} • {doc.size} • {doc.date}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm">
                <Download className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">View</Button>
            </div>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

// Client AI Help component
const ClientAIHelp = () => (
  <Card className="mb-6">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <MessageSquare className="h-5 w-5" />
        AI Legal Assistant
      </CardTitle>
      <CardDescription>Get quick answers to your legal questions</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        <div className="bg-gradient-to-r from-legal-navy/10 to-blue-100 p-4 rounded-lg">
          <h4 className="text-sm font-medium mb-2">Ask anything about your case</h4>
          <p className="text-xs text-muted-foreground mb-3">Our AI can help explain legal terms, processes, and answer questions about your case.</p>
          <Button className="w-full">
            <MessageSquare className="mr-2 h-4 w-4" />
            Start AI Chat
          </Button>
        </div>
        
        <div>
          <h4 className="text-sm font-medium mb-3">Frequently Asked Questions</h4>
          <div className="space-y-2">
            {[
              'What happens at my next court hearing?',
              'How long does my type of case usually take?',
              'What documents do I need to prepare?',
              'How are legal fees calculated?'
            ].map((question, index) => (
              <button
                key={index}
                className="w-full text-left p-2 text-sm hover:bg-muted rounded border"
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);

// Client Calendar component
const ClientCalendar = () => (
  <Card className="mb-6">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Calendar className="h-5 w-5" />
        Calendar & Appointments
      </CardTitle>
      <CardDescription>Your schedule and important dates</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-2">{day}</div>
          ))}
        </div>
        
        <div className="border rounded-lg p-4 space-y-3">
          <h4 className="text-sm font-medium">Upcoming Events</h4>
          {[
            { date: 'Dec 22', time: '2:00 PM', event: 'Court Hearing', type: 'hearing' },
            { date: 'Dec 24', time: '10:00 AM', event: 'Lawyer Meeting', type: 'meeting' },
            { date: 'Dec 28', time: '3:00 PM', event: 'Document Review', type: 'task' },
          ].map((item, index) => (
            <div key={index} className="flex items-center gap-3 p-2 border rounded">
              <div className={`w-3 h-3 rounded-full ${
                item.type === 'hearing' ? 'bg-red-500' :
                item.type === 'meeting' ? 'bg-blue-500' :
                'bg-green-500'
              }`} />
              <div className="flex-1">
                <p className="text-sm font-medium">{item.event}</p>
                <p className="text-xs text-muted-foreground">{item.date} at {item.time}</p>
              </div>
            </div>
          ))}
        </div>
        
        <Button variant="outline" className="w-full">
          <Calendar className="mr-2 h-4 w-4" />
          View Full Calendar
        </Button>
      </div>
    </CardContent>
  </Card>
);

// Billing & Payments component
const BillingPayments = () => (
  <Card className="mb-6">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <DollarSign className="h-5 w-5" />
        Billing & Payments
      </CardTitle>
      <CardDescription>Invoices and payment history</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        <div className="flex justify-between items-center p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg border border-green-200">
          <div>
            <p className="text-sm font-medium text-green-800">Account Status</p>
            <p className="text-xs text-green-600">All payments up to date</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-green-700">$0</p>
            <p className="text-xs text-green-600">Outstanding</p>
          </div>
        </div>
        
        <div>
          <h4 className="text-sm font-medium mb-3">Recent Invoices</h4>
          <div className="space-y-2">
            {[
              { invoice: 'INV-2024-001', amount: '$2,500', date: 'Dec 15, 2024', status: 'Paid' },
              { invoice: 'INV-2024-002', amount: '$1,800', date: 'Nov 30, 2024', status: 'Paid' },
              { invoice: 'INV-2024-003', amount: '$3,200', date: 'Nov 15, 2024', status: 'Paid' },
            ].map((invoice, index) => (
              <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                <div>
                  <p className="text-sm font-medium">{invoice.invoice}</p>
                  <p className="text-xs text-muted-foreground">{invoice.date}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{invoice.amount}</p>
                  <Badge variant="outline" className="text-xs">
                    {invoice.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <Button variant="outline" className="w-full">
          <DollarSign className="mr-2 h-4 w-4" />
          View Payment History
        </Button>
      </div>
    </CardContent>
  </Card>
);

// Notifications component
const NotificationsDrawer = () => (
  <Card className="mb-6">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Bell className="h-5 w-5" />
        Notifications
        <Badge variant="destructive" className="ml-auto">3</Badge>
      </CardTitle>
      <CardDescription>Important updates and alerts</CardDescription>
    </CardHeader>
    <CardContent>
      <ScrollArea className="h-60">
        <div className="space-y-3">
          {[
            {
              title: 'Court hearing reminder',
              message: 'Your hearing for Smith vs. Johnson is tomorrow at 2:00 PM',
              time: '2 hours ago',
              type: 'urgent',
              unread: true
            },
            {
              title: 'Document received',
              message: 'Your lawyer has shared new case documents',
              time: '5 hours ago',
              type: 'info',
              unread: true
            },
            {
              title: 'Payment confirmation',
              message: 'Invoice INV-2024-001 payment has been processed',
              time: '1 day ago',
              type: 'success',
              unread: false
            },
            {
              title: 'Case update',
              message: 'Progress update available on your property case',
              time: '2 days ago',
              type: 'info',
              unread: true
            }
          ].map((notification, index) => (
            <div
              key={index}
              className={`p-3 border rounded-lg ${
                notification.unread ? 'bg-blue-50 border-blue-200' : 'bg-muted/30'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-2 h-2 rounded-full mt-2 ${
                  notification.type === 'urgent' ? 'bg-red-500' :
                  notification.type === 'success' ? 'bg-green-500' :
                  'bg-blue-500'
                }`} />
                <div className="flex-1">
                  <p className="text-sm font-medium">{notification.title}</p>
                  <p className="text-xs text-muted-foreground mb-1">{notification.message}</p>
                  <p className="text-xs text-muted-foreground">{notification.time}</p>
                </div>
                {notification.unread && (
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                )}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
      <Button variant="outline" className="w-full mt-4">
        <Bell className="mr-2 h-4 w-4" />
        Mark All as Read
      </Button>
    </CardContent>
  </Card>
);

// Profile & Settings component
const ClientProfileSettings = () => (
  <Card className="mb-6">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <User className="h-5 w-5" />
        Profile & Settings
      </CardTitle>
      <CardDescription>Manage your account and preferences</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src="/api/placeholder/64/64" />
            <AvatarFallback>JS</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium">John Smith</p>
            <p className="text-xs text-muted-foreground">john.smith@email.com</p>
            <Badge variant="outline" className="mt-1">
              <Shield className="w-3 h-3 mr-1" />
              Verified
            </Badge>
          </div>
        </div>
        
        <Separator />
        
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Quick Settings</h4>
          {[
            { label: 'Personal Information', icon: User },
            { label: 'Security & KYC', icon: Shield },
            { label: 'Notifications', icon: Bell },
            { label: 'Privacy Settings', icon: Settings }
          ].map((item, index) => (
            <button
              key={index}
              className="w-full flex items-center gap-3 p-2 text-sm hover:bg-muted rounded"
            >
              <item.icon className="h-4 w-4 text-muted-foreground" />
              {item.label}
            </button>
          ))}
        </div>
        
        <Separator />
        
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span>Account Status</span>
            <Badge variant="default">Active</Badge>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span>Two-Factor Auth</span>
            <Badge variant="outline">Enabled</Badge>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span>KYC Status</span>
            <Badge variant="default">Verified</Badge>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);

const ClientDashboard: React.FC = () => {
  const { user } = useAuth();
  const { stats, cases, timeline, documents, isLoading, error, uploadDocument, isUploading } = useClientDashboard();
  
  // Set up real-time updates
  useRealTimeUpdates(user?.id || '', 'client');

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/4 mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-300 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Dashboard</h2>
            <p className="text-gray-600">Unable to load dashboard data. Please try again.</p>
            <Button 
              onClick={() => window.location.reload()} 
              className="mt-4"
            >
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Default values if data not loaded yet
  const defaultStats: ClientDashboardStats = {
    activeCases: 0,
    nextCourtDate: 'None scheduled',
    pendingActions: 0
  };

  const displayStats = stats || defaultStats;
  const displayCases = cases || [];
  const displayTimeline = timeline || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-legal-navy mb-2">Client Dashboard</h1>
          <p className="text-muted-foreground">Track your cases, communicate with your lawyers, and manage your legal matters.</p>
        </div>

        {/* Stats Cards */}
        <ClientHeaderCards stats={displayStats} />
        
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <CaseTimelineFeed events={displayTimeline} />
            <MyCasesTable cases={displayCases} />
            <DocumentVault />
            <ClientAIHelp />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ClientCalendar />
              <BillingPayments />
            </div>
          </div>
          
          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            <NotificationsDrawer />
            <ClientProfileSettings />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard; 