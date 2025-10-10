import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

import { 
  Users, 
  Plus, 
  Search, 
  Phone, 
  Mail, 
  Calendar,
  ArrowRight,
  Star,
  FileText,
  MessageCircle,
  BarChart,
  Shield,
  Clock,
  CheckCircle,
  Upload
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const ClientManagement = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [showAddClient, setShowAddClient] = useState(false);

  const features = [
    {
      icon: Users,
      title: 'Centralized Contacts',
      description: 'Store all client information in one secure, organized location with easy access'
    },
    {
      icon: FileText,
      title: 'Case Tracking',
      description: 'Monitor case progress and maintain detailed client history for better outcomes'
    },
    {
      icon: MessageCircle,
      title: 'Communication Hub',
      description: 'Track all interactions and maintain conversation history in one place'
    },
    {
      icon: BarChart,
      title: 'Client Analytics',
      description: 'Gain insights into client engagement and case outcomes with detailed reports'
    },
    {
      icon: Shield,
      title: 'Data Security',
      description: 'Bank-level encryption ensures client data protection and compliance'
    },
    {
      icon: Clock,
      title: 'Time Management',
      description: 'Track billable hours and manage client schedules efficiently'
    }
  ];

  const handleTryNow = () => {
    if (user) {
      localStorage.setItem('redirectFeature', 'client-management');
      if (user.role === 'client') {
        navigate('/dashboard/client');
      } else if (user.role === 'lawyer') {
        navigate('/dashboard/lawyer');
      }
    } else {
      navigate('/register?feature=client-management');
    }
  };
  
  const clients = [
    {
      id: 1,
      name: 'John Smith',
      email: 'john.smith@email.com',
      phone: '+1 (555) 123-4567',
      avatar: 'JS',
      company: 'Smith Enterprises',
      address: '123 Main St, New York, NY 10001',
      dateAdded: '2023-10-15',
      totalCases: 5,
      activeCases: 2,
      totalBilled: '$45,250',
      status: 'Active',
      priority: 'High',
      lastContact: '2023-12-28',
      nextDeadline: '2024-01-15',
      cases: [
        { id: 'C001', title: 'Contract Dispute - ABC Corp', status: 'Active', lastUpdate: '2 days ago', progress: 75 },
        { id: 'C002', title: 'Employment Agreement Review', status: 'Pending', lastUpdate: '1 week ago', progress: 25 }
      ],
      communications: [
        { type: 'email', content: 'Case update regarding contract terms', date: '2023-12-28', from: 'lawyer' },
        { type: 'call', content: '30-minute consultation call', date: '2023-12-26', from: 'client' }
      ]
    },
    {
      id: 2,
      name: 'Sarah Johnson',
      email: 'sarah.johnson@techcorp.com',
      phone: '+1 (555) 234-5678',
      avatar: 'SJ',
      company: 'TechCorp Solutions',
      address: '456 Tech Ave, San Francisco, CA 94102',
      dateAdded: '2023-11-20',
      totalCases: 3,
      activeCases: 1,
      totalBilled: '$28,750',
      status: 'Active',
      priority: 'Medium',
      lastContact: '2023-12-30',
      nextDeadline: '2024-01-20',
      cases: [
        { id: 'C003', title: 'IP Protection Filing', status: 'Active', lastUpdate: 'Today', progress: 60 }
      ],
      communications: [
        { type: 'message', content: 'Document upload confirmation', date: '2023-12-30', from: 'client' }
      ]
    },
    {
      id: 3,
      name: 'Michael Chen',
      email: 'mchen@globalinc.com',
      phone: '+1 (555) 456-7890',
      avatar: 'MC',
      company: 'Global Inc.',
      address: '789 Business Blvd, Chicago, IL 60601',
      dateAdded: '2023-09-10',
      totalCases: 8,
      activeCases: 0,
      totalBilled: '$125,500',
      status: 'Inactive',
      priority: 'Low',
      lastContact: '2023-11-15',
      nextDeadline: null,
      cases: [],
      communications: [
        { type: 'email', content: 'Case closure documentation', date: '2023-11-15', from: 'lawyer' }
      ]
    }
  ];

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="pt-20 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {!selectedClient ? (
            <>
              <div className="mb-8">
                <Badge className="mb-4 bg-legal-navy text-white">
                  👥 Live Client Management
                </Badge>
                <h1 className="text-4xl font-playfair font-bold text-gray-900 mb-4">
                  Client Management System
                </h1>
                <p className="text-xl text-gray-600">
                  Experience how Judicature manages client relationships, tracks cases, and maintains communication history.
                </p>
              </div>

              {/* Stats Dashboard */}
              <div className="grid md:grid-cols-4 gap-6 mb-8">
                <Card className="border-l-4 border-l-blue-500">
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <Users className="h-8 w-8 text-blue-500 mr-3" />
                      <div>
                        <div className="text-2xl font-bold">{clients.length}</div>
                        <div className="text-sm text-gray-600">Total Clients</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-l-4 border-l-green-500">
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <CheckCircle className="h-8 w-8 text-green-500 mr-3" />
                      <div>
                        <div className="text-2xl font-bold">{clients.filter(c => c.status === 'Active').length}</div>
                        <div className="text-sm text-gray-600">Active Clients</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-l-4 border-l-yellow-500">
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <FileText className="h-8 w-8 text-yellow-500 mr-3" />
                      <div>
                        <div className="text-2xl font-bold">{clients.reduce((sum, c) => sum + c.activeCases, 0)}</div>
                        <div className="text-sm text-gray-600">Active Cases</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-l-4 border-l-purple-500">
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <BarChart className="h-8 w-8 text-purple-500 mr-3" />
                      <div>
                        <div className="text-2xl font-bold">$199.5K</div>
                        <div className="text-sm text-gray-600">Total Revenue</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Search and Actions */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search clients by name, email, or company..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button 
                  onClick={() => setShowAddClient(true)}
                  className="bg-legal-navy hover:bg-legal-navy/90"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Client
                </Button>
              </div>

              {/* Client List */}
              <div className="grid gap-4">
                {filteredClients.map((client) => (
                  <Card 
                    key={client.id} 
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => setSelectedClient(client)}
                  >
                    <CardContent className="p-6">
                      <div className="grid md:grid-cols-4 gap-4 items-center">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-legal-navy text-white rounded-full flex items-center justify-center font-medium">
                            {client.avatar}
                          </div>
                          <div>
                            <h3 className="font-semibold">{client.name}</h3>
                            <p className="text-sm text-gray-600">{client.company}</p>
                          </div>
                        </div>
                        
                        <div className="text-center">
                          <div className="text-lg font-semibold text-legal-navy">{client.activeCases}</div>
                          <div className="text-sm text-gray-600">Active Cases</div>
                        </div>
                        
                        <div className="text-center">
                          <div className="text-lg font-semibold">{client.totalBilled}</div>
                          <div className="text-sm text-gray-600">Total Billed</div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <Badge 
                            variant={client.status === 'Active' ? 'default' : 'secondary'}
                            className={client.status === 'Active' ? 'bg-green-100 text-green-800' : ''}
                          >
                            {client.status}
                          </Badge>
                          <div className="flex gap-2">
                            <Button size="sm" variant="ghost">
                              <MessageCircle className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost">
                              <Phone className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost">
                              <Mail className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          ) : (
            /* Client Detail View */
            <div>
              <div className="flex items-center gap-4 mb-8">
                <Button 
                  variant="ghost" 
                  onClick={() => setSelectedClient(null)}
                  className="flex items-center gap-2"
                >
                  ← Back to Clients
                </Button>
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 bg-legal-navy text-white rounded-full flex items-center justify-center text-xl font-medium">
                    {selectedClient.avatar}
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold">{selectedClient.name}</h1>
                    <p className="text-gray-600">{selectedClient.company}</p>
                  </div>
                </div>
              </div>

              {/* Client Info Cards */}
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-semibold mb-4">Contact Information</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        {selectedClient.email}
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        {selectedClient.phone}
                      </div>
                      <div className="flex items-start gap-2">
                        <svg className="h-4 w-4 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>{selectedClient.address}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-semibold mb-4">Case Summary</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Cases:</span>
                        <span className="font-semibold">{selectedClient.totalCases}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Active Cases:</span>
                        <span className="font-semibold text-green-600">{selectedClient.activeCases}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Billed:</span>
                        <span className="font-semibold">{selectedClient.totalBilled}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Next Deadline:</span>
                        <span className="font-semibold">{selectedClient.nextDeadline || 'None'}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-semibold mb-4">Quick Actions</h3>
                    <div className="space-y-2">
                      <Button className="w-full justify-start" variant="outline">
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Send Message
                      </Button>
                      <Button className="w-full justify-start" variant="outline">
                        <Plus className="h-4 w-4 mr-2" />
                        Create New Case
                      </Button>
                      <Button className="w-full justify-start" variant="outline">
                        <Calendar className="h-4 w-4 mr-2" />
                        Schedule Meeting
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Tabs for detailed information */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex gap-4 mb-6 border-b">
                    {['cases', 'communications', 'documents', 'billing'].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`pb-2 px-1 text-sm font-medium capitalize ${
                          activeTab === tab 
                            ? 'border-b-2 border-legal-navy text-legal-navy' 
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>

                  {activeTab === 'cases' && (
                    <div className="space-y-4">
                      <h3 className="font-semibold">Active Cases</h3>
                      {selectedClient.cases.length > 0 ? (
                        selectedClient.cases.map((case_: any) => (
                          <Card key={case_.id} className="border-l-4 border-l-legal-navy">
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="font-medium">{case_.title}</h4>
                                  <p className="text-sm text-gray-600">Case ID: {case_.id}</p>
                                  <p className="text-sm text-gray-500">Last update: {case_.lastUpdate}</p>
                                </div>
                                <div className="text-right">
                                  <Badge variant={case_.status === 'Active' ? 'default' : 'secondary'}>
                                    {case_.status}
                                  </Badge>
                                  <div className="mt-2">
                                    <div className="text-sm text-gray-600">Progress: {case_.progress}%</div>
                                    <div className="w-24 h-2 bg-gray-200 rounded-full mt-1">
                                      <div 
                                        className="h-2 bg-legal-navy rounded-full"
                                        style={{ width: `${case_.progress}%` }}
                                      ></div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      ) : (
                        <p className="text-gray-500 text-center py-8">No active cases</p>
                      )}
                    </div>
                  )}

                  {activeTab === 'communications' && (
                    <div className="space-y-4">
                      <h3 className="font-semibold">Recent Communications</h3>
                      {selectedClient.communications.map((comm: any, index: number) => (
                        <div key={index} className="flex gap-3 p-3 bg-gray-50 rounded">
                          <div className="w-8 h-8 bg-legal-navy rounded-full flex items-center justify-center text-white text-xs">
                            {comm.type === 'email' ? '📧' : comm.type === 'call' ? '📞' : '💬'}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm">{comm.content}</p>
                            <p className="text-xs text-gray-500">{comm.date} • {comm.from}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeTab === 'documents' && (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">Document management integrated with case files</p>
                      <Button className="mt-4" variant="outline">
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Document
                      </Button>
                    </div>
                  )}

                  {activeTab === 'billing' && (
                    <div className="space-y-4">
                      <h3 className="font-semibold">Billing Information</h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <Card className="p-4">
                          <h4 className="font-medium mb-2">Total Billed</h4>
                          <p className="text-2xl font-bold text-legal-navy">{selectedClient.totalBilled}</p>
                        </Card>
                        <Card className="p-4">
                          <h4 className="font-medium mb-2">Payment Status</h4>
                          <Badge className="bg-green-100 text-green-800">Current</Badge>
                        </Card>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6 text-center">
              <Users className="h-8 w-8 text-legal-navy mx-auto mb-2" />
              <div className="text-2xl font-bold">{clients.length}</div>
              <div className="text-sm text-gray-600">Total Clients</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <Users className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold">{clients.filter(c => c.status === 'Active').length}</div>
              <div className="text-sm text-gray-600">Active Clients</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <Calendar className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold">12</div>
              <div className="text-sm text-gray-600">Meetings This Month</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <Mail className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold">47</div>
              <div className="text-sm text-gray-600">Messages</div>
            </CardContent>
          </Card>
        </div>

        {/* Client List */}
        <Card>
          <CardHeader>
            <CardTitle>Client Directory</CardTitle>
            <CardDescription>
              Manage and communicate with your clients
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredClients.map((client) => (
                <div key={client.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-legal-navy rounded-full flex items-center justify-center text-white font-semibold">
                          {client.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{client.name}</h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <span className="flex items-center">
                              <Mail className="h-3 w-3 mr-1" />
                              {client.email}
                            </span>
                            <span className="flex items-center">
                              <Phone className="h-3 w-3 mr-1" />
                              {client.phone}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-center">
                        <div className="text-sm font-semibold">{client.totalCases}</div>
                        <div className="text-xs text-gray-600">Cases</div>
                      </div>
                      <Badge variant={client.status === 'Active' ? 'default' : 'secondary'}>
                        {client.status}
                      </Badge>
                      <Button size="sm" variant="outline">
                        View Details
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientManagement;
