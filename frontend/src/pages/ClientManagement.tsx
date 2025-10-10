import React, { useState } from 'react';
import Header from '../components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
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

const ClientManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<number | null>(null);

  // Mock client data with comprehensive details
  const clients = [
    {
      id: 1,
      name: 'Sarah Johnson',
      email: 'sarah.johnson@techcorp.com',
      phone: '+1 (555) 123-4567',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
      company: 'TechCorp Industries',
      address: '123 Business Ave, New York, NY 10001',
      dateAdded: '2024-01-15',
      totalCases: 5,
      activeCases: 2,
      totalBilled: '$47,500',
      status: 'Active',
      lastContact: '2024-01-20',
      priority: 'High',
      cases: [
        { id: 101, title: 'Employment Contract Review', status: 'Active', type: 'Employment', dateCreated: '2024-01-15', value: '$15,000' },
        { id: 102, title: 'Intellectual Property Dispute', status: 'Active', type: 'IP Law', dateCreated: '2024-01-10', value: '$25,000' },
        { id: 103, title: 'Non-Disclosure Agreement', status: 'Completed', type: 'Contract', dateCreated: '2023-12-20', value: '$3,500' },
        { id: 104, title: 'Corporate Merger Advisory', status: 'Completed', type: 'Corporate', dateCreated: '2023-11-15', value: '$45,000' },
        { id: 105, title: 'Trade Secret Protection', status: 'On Hold', type: 'IP Law', dateCreated: '2024-01-05', value: '$8,000' }
      ],
      communications: [
        { id: 1, type: 'Email', subject: 'Contract Review Update', date: '2024-01-20', status: 'Sent' },
        { id: 2, type: 'Call', subject: 'Case Strategy Discussion', date: '2024-01-18', status: 'Completed' },
        { id: 3, type: 'Meeting', subject: 'Initial Consultation', date: '2024-01-15', status: 'Completed' }
      ]
    },
    {
      id: 2,
      name: 'Michael Chen',
      email: 'michael.chen@startupventures.com',
      phone: '+1 (555) 987-6543',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      company: 'StartupVentures LLC',
      address: '456 Innovation Blvd, San Francisco, CA 94105',
      dateAdded: '2023-12-10',
      totalCases: 3,
      activeCases: 1,
      totalBilled: '$28,750',
      status: 'Active',
      lastContact: '2024-01-19',
      priority: 'Medium',
      cases: [
        { id: 201, title: 'Startup Formation & Structure', status: 'Active', type: 'Corporate', dateCreated: '2024-01-12', value: '$12,500' },
        { id: 202, title: 'Investment Agreement Review', status: 'Completed', type: 'Finance', dateCreated: '2023-12-15', value: '$18,000' },
        { id: 203, title: 'Terms of Service Draft', status: 'Completed', type: 'Contract', dateCreated: '2023-12-10', value: '$4,250' }
      ],
      communications: [
        { id: 1, type: 'Email', subject: 'Investment Terms Review', date: '2024-01-19', status: 'Sent' },
        { id: 2, type: 'Video Call', subject: 'Corporate Structure Planning', date: '2024-01-16', status: 'Completed' }
      ]
    },
    {
      id: 3,
      name: 'Emily Rodriguez',
      email: 'emily.rodriguez@globalmanufacturing.com',
      phone: '+1 (555) 456-7890',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
      company: 'Global Manufacturing Corp',
      address: '789 Industrial Way, Chicago, IL 60601',
      dateAdded: '2023-11-20',
      totalCases: 7,
      activeCases: 3,
      totalBilled: '$89,500',
      status: 'Active',
      lastContact: '2024-01-21',
      priority: 'High',
      cases: [
        { id: 301, title: 'Environmental Compliance Review', status: 'Active', type: 'Regulatory', dateCreated: '2024-01-08', value: '$22,000' },
        { id: 302, title: 'Labor Union Negotiations', status: 'Active', type: 'Employment', dateCreated: '2024-01-03', value: '$35,000' },
        { id: 303, title: 'Supply Chain Contract Dispute', status: 'Active', type: 'Contract', dateCreated: '2023-12-28', value: '$28,000' }
      ],
      communications: [
        { id: 1, type: 'Email', subject: 'Compliance Update Required', date: '2024-01-21', status: 'Received' },
        { id: 2, type: 'Meeting', subject: 'Union Negotiation Strategy', date: '2024-01-20', status: 'Completed' }
      ]
    },
    {
      id: 4,
      name: 'David Thompson',
      email: 'david.thompson@realestatepro.com',
      phone: '+1 (555) 321-0987',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      company: 'Real Estate Professionals',
      address: '321 Property Lane, Miami, FL 33101',
      dateAdded: '2023-10-15',
      totalCases: 4,
      activeCases: 1,
      totalBilled: '$31,200',
      status: 'Active',
      lastContact: '2024-01-17',
      priority: 'Medium',
      cases: [
        { id: 401, title: 'Commercial Property Purchase', status: 'Active', type: 'Real Estate', dateCreated: '2024-01-01', value: '$18,500' },
        { id: 402, title: 'Zoning Variance Application', status: 'Completed', type: 'Real Estate', dateCreated: '2023-12-05', value: '$8,700' }
      ],
      communications: [
        { id: 1, type: 'Email', subject: 'Property Due Diligence', date: '2024-01-17', status: 'Sent' }
      ]
    }
  ];

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedClientData = selectedClient ? clients.find(c => c.id === selectedClient) : null;

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
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Total Clients</p>
                        <p className="text-2xl font-bold text-legal-navy">247</p>
                        <p className="text-xs text-green-600 mt-1">↑ 12% this month</p>
                      </div>
                      <Users className="h-8 w-8 text-legal-navy" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Active Cases</p>
                        <p className="text-2xl font-bold text-legal-navy">89</p>
                        <p className="text-xs text-blue-600 mt-1">7 new this week</p>
                      </div>
                      <FileText className="h-8 w-8 text-legal-navy" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Revenue MTD</p>
                        <p className="text-2xl font-bold text-legal-navy">$485K</p>
                        <p className="text-xs text-green-600 mt-1">↑ 8.2% vs last month</p>
                      </div>
                      <BarChart className="h-8 w-8 text-legal-navy" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Satisfaction</p>
                        <p className="text-2xl font-bold text-legal-navy">4.9</p>
                        <p className="text-xs text-yellow-600 mt-1">★★★★★ Average</p>
                      </div>
                      <Star className="h-8 w-8 text-legal-navy" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Search and Actions */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search clients by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2">
                  <Button className="bg-legal-navy hover:bg-legal-navy/90">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Client
                  </Button>
                  <Button variant="outline">
                    <Upload className="h-4 w-4 mr-2" />
                    Import
                  </Button>
                </div>
              </div>

              {/* Client List */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Client Directory ({filteredClients.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {filteredClients.map((client) => (
                      <div key={client.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex items-center space-x-4">
                          <img 
                            src={client.avatar} 
                            alt={client.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-gray-900">{client.name}</h3>
                              <Badge variant={client.priority === 'High' ? 'destructive' : client.priority === 'Medium' ? 'default' : 'secondary'} className="text-xs">
                                {client.priority}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600">{client.email}</p>
                            <p className="text-sm text-gray-500">{client.company}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-6 text-sm">
                          <div className="text-center">
                            <div className="text-gray-500">Cases</div>
                            <div className="text-sm font-semibold">{client.totalCases}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-gray-500">Active</div>
                            <div className="text-sm font-semibold">{client.activeCases}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-gray-500">Billed</div>
                            <div className="text-sm font-semibold">{client.totalBilled}</div>
                          </div>
                          <Badge variant={client.status === 'Active' ? 'default' : 'secondary'}>
                            {client.status}
                          </Badge>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => setSelectedClient(client.id)}
                          >
                            View Details
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
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
              </div>

              {selectedClientData && (
                <div className="space-y-6">
                  {/* Client Header */}
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-4">
                          <img 
                            src={selectedClientData.avatar} 
                            alt={selectedClientData.name}
                            className="w-16 h-16 rounded-full object-cover"
                          />
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <h1 className="text-2xl font-bold text-gray-900">{selectedClientData.name}</h1>
                              <Badge variant={selectedClientData.priority === 'High' ? 'destructive' : selectedClientData.priority === 'Medium' ? 'default' : 'secondary'}>
                                {selectedClientData.priority} Priority
                              </Badge>
                              <Badge variant={selectedClientData.status === 'Active' ? 'default' : 'secondary'}>
                                {selectedClientData.status}
                              </Badge>
                            </div>
                            <p className="text-gray-600">{selectedClientData.company}</p>
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                              <div className="flex items-center gap-1">
                                <Mail className="h-4 w-4" />
                                {selectedClientData.email}
                              </div>
                              <div className="flex items-center gap-1">
                                <Phone className="h-4 w-4" />
                                {selectedClientData.phone}
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                Client since {new Date(selectedClientData.dateAdded).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Mail className="h-4 w-4 mr-2" />
                            Email
                          </Button>
                          <Button variant="outline" size="sm">
                            <Phone className="h-4 w-4 mr-2" />
                            Call
                          </Button>
                          <Button className="bg-legal-navy hover:bg-legal-navy/90" size="sm">
                            <Plus className="h-4 w-4 mr-2" />
                            New Case
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Client Stats */}
                  <div className="grid md:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-legal-navy">{selectedClientData.totalCases}</div>
                          <div className="text-sm text-gray-600">Total Cases</div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">{selectedClientData.activeCases}</div>
                          <div className="text-sm text-gray-600">Active Cases</div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">{selectedClientData.totalBilled}</div>
                          <div className="text-sm text-gray-600">Total Billed</div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-600">{new Date(selectedClientData.lastContact).toLocaleDateString()}</div>
                          <div className="text-sm text-gray-600">Last Contact</div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Tabbed Content */}
                  <Tabs defaultValue="cases" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="cases">Cases & Matters</TabsTrigger>
                      <TabsTrigger value="communications">Communications</TabsTrigger>
                      <TabsTrigger value="billing">Billing & Invoices</TabsTrigger>
                    </TabsList>

                    <TabsContent value="cases" className="space-y-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center justify-between">
                            <span>Cases & Matters</span>
                            <Button size="sm" className="bg-legal-navy hover:bg-legal-navy/90">
                              <Plus className="h-4 w-4 mr-2" />
                              New Case
                            </Button>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {selectedClientData.cases.map((case_) => (
                              <div key={case_.id} className="flex items-center justify-between p-4 border rounded-lg">
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-semibold">{case_.title}</h4>
                                    <Badge variant={
                                      case_.status === 'Active' ? 'default' : 
                                      case_.status === 'Completed' ? 'secondary' : 
                                      'outline'
                                    }>
                                      {case_.status}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-gray-600">{case_.type} • Created {new Date(case_.dateCreated).toLocaleDateString()}</p>
                                </div>
                                <div className="text-right">
                                  <div className="text-lg font-semibold text-legal-navy">{case_.value}</div>
                                  <Button size="sm" variant="outline">View Details</Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="communications" className="space-y-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center justify-between">
                            <span>Communication History</span>
                            <Button size="sm" className="bg-legal-navy hover:bg-legal-navy/90">
                              <MessageCircle className="h-4 w-4 mr-2" />
                              New Message
                            </Button>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {selectedClientData.communications.map((comm) => (
                              <div key={comm.id} className="flex items-center justify-between p-4 border rounded-lg">
                                <div className="flex items-center gap-3">
                                  <div className="p-2 bg-legal-navy/10 rounded-full">
                                    {comm.type === 'Email' && <Mail className="h-4 w-4 text-legal-navy" />}
                                    {comm.type === 'Call' && <Phone className="h-4 w-4 text-legal-navy" />}
                                    {comm.type === 'Meeting' && <Calendar className="h-4 w-4 text-legal-navy" />}
                                    {comm.type === 'Video Call' && <MessageCircle className="h-4 w-4 text-legal-navy" />}
                                  </div>
                                  <div>
                                    <h4 className="font-semibold">{comm.subject}</h4>
                                    <p className="text-sm text-gray-600">{comm.type} • {new Date(comm.date).toLocaleDateString()}</p>
                                  </div>
                                </div>
                                <Badge variant={comm.status === 'Completed' ? 'default' : 'secondary'}>
                                  {comm.status}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="billing" className="space-y-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center justify-between">
                            <span>Billing & Payment History</span>
                            <Button size="sm" className="bg-legal-navy hover:bg-legal-navy/90">
                              <Plus className="h-4 w-4 mr-2" />
                              Create Invoice
                            </Button>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid md:grid-cols-2 gap-6">
                            <div>
                              <h4 className="font-semibold mb-3">Payment Summary</h4>
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Total Billed:</span>
                                  <span className="font-semibold">{selectedClientData.totalBilled}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Outstanding:</span>
                                  <span className="font-semibold text-red-600">$5,200</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Paid:</span>
                                  <span className="font-semibold text-green-600">$42,300</span>
                                </div>
                              </div>
                            </div>
                            <div>
                              <h4 className="font-semibold mb-3">Recent Invoices</h4>
                              <div className="space-y-2">
                                <div className="flex justify-between items-center p-2 border rounded">
                                  <span>INV-2024-001</span>
                                  <Badge variant="default">Paid</Badge>
                                </div>
                                <div className="flex justify-between items-center p-2 border rounded">
                                  <span>INV-2024-002</span>
                                  <Badge variant="outline">Pending</Badge>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </Tabs>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientManagement;