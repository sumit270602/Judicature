import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Button,
} from '@/components/ui/button';
import {
  Badge,
} from '@/components/ui/badge';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Input,
} from '@/components/ui/input';
import {
  Textarea,
} from '@/components/ui/textarea';
import {
  ArrowLeft,
  MessageSquare,
  Phone,
  Mail,
  MapPin,
  Calendar,
  CreditCard,
  FileText,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  User,
  Building,
  Send,
  Paperclip,
} from 'lucide-react';
import LinkedInMessaging from '@/components/LinkedInMessaging';

interface Client {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  dateOfBirth?: string;
  occupation?: string;
  company?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relation: string;
  };
  registrationDate: string;
  lastContact: string;
  totalCases: number;
  activeCases: number;
  completedCases: number;
  totalPaid: number;
  pendingPayments: number;
  preferredCommunication: string;
  notes?: string;
  status: 'active' | 'inactive';
  avatar?: string;
}

interface Case {
  _id: string;
  caseNumber: string;
  title: string;
  category: string;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
  nextHearing?: string;
  totalAmount: number;
  paidAmount: number;
  description: string;
}

interface Payment {
  _id: string;
  amount: number;
  status: string;
  date: string;
  method: string;
  caseId: string;
  caseTitle: string;
  description: string;
}

interface Message {
  _id: string;
  content: string;
  sender: 'lawyer' | 'client';
  timestamp: string;
  read: boolean;
  attachments?: string[];
}

const LawyerClientDetails: React.FC = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const [client, setClient] = useState<Client | null>(null);
  const [cases, setCases] = useState<Case[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [messageAttachments, setMessageAttachments] = useState<File[]>([]);
  const [isMessagingOpen, setIsMessagingOpen] = useState(false);

  useEffect(() => {
    fetchClientDetails();
    fetchClientMessages();
  }, [clientId]);

  const fetchClientDetails = async () => {
    try {
      setLoading(true);
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const apiUrl = `${baseUrl}/dashboard/lawyer/clients/${clientId}`;
      console.log('Environment VITE_API_URL:', import.meta.env.VITE_API_URL);
      console.log('Using base URL:', baseUrl);
      console.log('Fetching client details from:', apiUrl);
      console.log('Client ID:', clientId);
      
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (response.ok) {
        const clientData = await response.json();
        console.log('Client data received:', clientData);
        setClient(clientData);
        // Set cases and payments from the response since they're included
        if (clientData.cases) {
          setCases(clientData.cases);
        }
        if (clientData.payments) {
          setPayments(clientData.payments);
        }
      } else {
        console.error('Failed to fetch client details:', response.status, response.statusText);
        const errorData = await response.text();
        console.error('Error details:', errorData);
        alert(`Error fetching client: ${response.status} - ${errorData}`);
        setClient(null);
      }
    } catch (error) {
      console.error('Error fetching client details:', error);
      alert(`Network error: ${error.message}`);
      setClient(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchClientCases = async () => {
    // Cases are now fetched as part of fetchClientDetails
    // This function is kept for backward compatibility but not needed
  };

  const fetchClientPayments = async () => {
    // Payments are now fetched as part of fetchClientDetails
    // This function is kept for backward compatibility but not needed
  };

  const fetchClientMessages = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/messages/client/${clientId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const messagesData = await response.json();
        setMessages(messagesData);
      } else {
        // Mock data
        setMessages([
          {
            _id: '1',
            content: 'Hello, I wanted to check on the progress of my case.',
            sender: 'client',
            timestamp: '2024-10-01T10:30:00Z',
            read: true
          },
          {
            _id: '2',
            content: 'Hi John, I\'ve reviewed the latest documents. We\'re making good progress and should have an update by Friday.',
            sender: 'lawyer',
            timestamp: '2024-10-01T14:45:00Z',
            read: true
          },
          {
            _id: '3',
            content: 'Thank you for the update. I have some additional documents to share.',
            sender: 'client',
            timestamp: '2024-10-02T09:15:00Z',
            read: false
          }
        ]);
      }
    } catch (error) {
      console.error('Error fetching client messages:', error);
      setMessages([]);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      const formData = new FormData();
      formData.append('content', newMessage);
      formData.append('recipientId', clientId!);
      formData.append('recipientType', 'client');
      
      messageAttachments.forEach((file, index) => {
        formData.append(`attachments`, file);
      });

      const response = await fetch(`${import.meta.env.VITE_API_URL}/messages/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (response.ok) {
        const newMsg: Message = {
          _id: Date.now().toString(),
          content: newMessage,
          sender: 'lawyer',
          timestamp: new Date().toISOString(),
          read: true,
          attachments: messageAttachments.map(file => file.name)
        };
        
        setMessages(prev => [...prev, newMsg]);
        setNewMessage('');
        setMessageAttachments([]);
        setMessageDialogOpen(false);

        // Show success notification
        window.dispatchEvent(new CustomEvent('showNotification', {
          detail: {
            type: 'success',
            message: 'Message sent successfully'
          }
        }));
      }
    } catch (error) {
      console.error('Error sending message:', error);
      window.dispatchEvent(new CustomEvent('showNotification', {
        detail: {
          type: 'error',
          message: 'Failed to send message'
        }
      }));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-purple-100 text-purple-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <div className="h-64 bg-gray-200 rounded-lg"></div>
              </div>
              <div className="lg:col-span-2">
                <div className="h-96 bg-gray-200 rounded-lg"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Client Not Found</h1>
          <p className="text-gray-600 mb-6">The requested client could not be found.</p>
          <Button onClick={() => navigate('/dashboard/lawyer')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => navigate('/dashboard/lawyer')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{client.name}</h1>
              <p className="text-gray-600">Client Details & History</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => window.location.href = `tel:${client.phone}`}>
              <Phone className="h-4 w-4 mr-2" />
              Call
            </Button>
            <Button variant="outline" onClick={() => window.location.href = `mailto:${client.email}`}>
              <Mail className="h-4 w-4 mr-2" />
              Email
            </Button>
            <Button 
              className="bg-legal-navy hover:bg-legal-navy/90"
              onClick={() => setIsMessagingOpen(true)}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Message Client
            </Button>

          </div>
        </div>

        {/* Client Overview Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Client Profile Card */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Client Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={client.avatar} />
                  <AvatarFallback className="text-lg">
                    {client.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-lg">{client.name}</h3>
                  <Badge className={getStatusColor(client.status)}>
                    {client.status === 'active' ? 'Active Client' : 'Inactive'}
                  </Badge>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{client.email}</span>
                </div>
                {client.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">{client.phone}</span>
                  </div>
                )}
                {client.address && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">{client.address}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">Client since {new Date(client.registrationDate).toLocaleDateString()}</span>
                </div>
              </div>

              {client.notes && (
                <div className="pt-3 border-t">
                  <h4 className="font-medium text-sm mb-2">Notes</h4>
                  <p className="text-sm text-gray-600">{client.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="lg:col-span-2 grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Cases</p>
                    <p className="text-2xl font-bold">{client.totalCases}</p>
                  </div>
                  <FileText className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Active Cases</p>
                    <p className="text-2xl font-bold text-blue-600">{client.activeCases}</p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Paid</p>
                    <p className="text-2xl font-bold text-green-600">${client.totalPaid.toLocaleString()}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Pending Payments</p>
                    <p className="text-2xl font-bold text-orange-600">${client.pendingPayments.toLocaleString()}</p>
                  </div>
                  <Clock className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Detailed Information Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="cases">Cases ({cases.length})</TabsTrigger>
            <TabsTrigger value="payments">Payments ({payments.length})</TabsTrigger>
            <TabsTrigger value="messages">Messages ({messages.filter(m => !m.read).length})</TabsTrigger>
            <TabsTrigger value="details">Personal Details</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <div>
                        <p className="text-sm font-medium">Case updated</p>
                        <p className="text-xs text-gray-500">Personal Injury Claim - 2 hours ago</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <div>
                        <p className="text-sm font-medium">Message received</p>
                        <p className="text-xs text-gray-500">Client inquiry - 1 day ago</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                      <div>
                        <p className="text-sm font-medium">Payment pending</p>
                        <p className="text-xs text-gray-500">$2,500 - 3 days ago</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Communication Preferences</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium">Preferred Method</label>
                      <p className="text-sm text-gray-600">{client.preferredCommunication}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Last Contact</label>
                      <p className="text-sm text-gray-600">{new Date(client.lastContact).toLocaleString()}</p>
                    </div>
                    {client.emergencyContact && (
                      <div className="pt-3 border-t">
                        <label className="text-sm font-medium">Emergency Contact</label>
                        <div className="text-sm text-gray-600">
                          <p>{client.emergencyContact.name} ({client.emergencyContact.relation})</p>
                          <p>{client.emergencyContact.phone}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="cases" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Client Cases</CardTitle>
                <CardDescription>All cases associated with this client</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Case Number</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Next Hearing</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cases.map((case_) => (
                      <TableRow key={case_._id}>
                        <TableCell className="font-medium">{case_.caseNumber}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{case_.title}</p>
                            <p className="text-sm text-gray-500">{case_.description}</p>
                          </div>
                        </TableCell>
                        <TableCell>{case_.category}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(case_.status)}>
                            {case_.status.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getPriorityColor(case_.priority)}>
                            {case_.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">${case_.totalAmount.toLocaleString()}</p>
                            <p className="text-sm text-gray-500">Paid: ${case_.paidAmount.toLocaleString()}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {case_.nextHearing ? new Date(case_.nextHearing).toLocaleDateString() : 'TBD'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Payment History</CardTitle>
                <CardDescription>All payments and transactions</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Case</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Description</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment) => (
                      <TableRow key={payment._id}>
                        <TableCell>{new Date(payment.date).toLocaleDateString()}</TableCell>
                        <TableCell className="font-medium">${payment.amount.toLocaleString()}</TableCell>
                        <TableCell>{payment.method}</TableCell>
                        <TableCell>{payment.caseTitle}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(payment.status)}>
                            {payment.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{payment.description}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="messages" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Message History</CardTitle>
                <CardDescription>Communication thread with client</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {messages.map((message) => (
                    <div
                      key={message._id}
                      className={`flex ${message.sender === 'lawyer' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.sender === 'lawyer'
                            ? 'bg-legal-navy text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p className={`text-xs mt-1 ${
                          message.sender === 'lawyer' ? 'text-gray-200' : 'text-gray-500'
                        }`}>
                          {new Date(message.timestamp).toLocaleString()}
                        </p>
                        {message.attachments && message.attachments.length > 0 && (
                          <div className="mt-2">
                            {message.attachments.map((attachment, index) => (
                              <div key={index} className="text-xs underline">
                                📎 {attachment}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="details" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Full Name</label>
                    <p className="text-sm">{client.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Email Address</label>
                    <p className="text-sm">{client.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Phone Number</label>
                    <p className="text-sm">{client.phone}</p>
                  </div>
                  {client.dateOfBirth && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Date of Birth</label>
                      <p className="text-sm">{new Date(client.dateOfBirth).toLocaleDateString()}</p>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium text-gray-600">Address</label>
                    <p className="text-sm">{client.address}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Professional Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {client.occupation && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Occupation</label>
                      <p className="text-sm">{client.occupation}</p>
                    </div>
                  )}
                  {client.company && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Company</label>
                      <p className="text-sm">{client.company}</p>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium text-gray-600">Client Since</label>
                    <p className="text-sm">{new Date(client.registrationDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Account Status</label>
                    <Badge className={getStatusColor(client.status)}>
                      {client.status === 'active' ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* LinkedIn-style Messaging */}
      <LinkedInMessaging
        isOpen={isMessagingOpen}
        onClose={() => setIsMessagingOpen(false)}
        targetUserId={client?._id}
        targetUser={client ? {
          _id: client._id,
          name: client.name,
          role: 'client'
        } : undefined}
      />
    </div>
  );
};

export default LawyerClientDetails;