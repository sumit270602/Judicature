import { useState } from 'react';
import Header from '../components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { 
  MessageCircle, 
  Send, 
  Paperclip, 
  Users, 
  Phone, 
  Video, 
  FileText, 
  Download, 
  Search,
  Filter,
  Clock,
  CheckCircle,
  AlertCircle,
  Calendar,
  Mic,
  Camera,
  Shield,
  Archive
} from 'lucide-react';

const Communication = () => {
  const [message, setMessage] = useState('');
  const [selectedChat, setSelectedChat] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState('active');

  // Enhanced conversation data with case context
  const conversations = [
    {
      id: 1,
      name: 'Sarah Johnson',
      role: 'Client',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
      caseNumber: 'CASE-2024-001',
      caseTitle: 'Employment Contract Review',
      lastMessage: 'The revised contract looks good. When can we finalize?',
      timestamp: '10 minutes ago',
      unread: 2,
      online: true,
      priority: 'High',
      encrypted: true,
      lastActivity: 'Shared document: Employment_Contract_v3.pdf'
    },
    {
      id: 2,
      name: 'Michael Chen',
      role: 'Client',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      caseNumber: 'CASE-2024-002',
      caseTitle: 'Startup Legal Structure',
      lastMessage: 'Can we schedule a video call to discuss the investment terms?',
      timestamp: '2 hours ago',
      unread: 0,
      online: false,
      priority: 'Medium',
      encrypted: true,
      lastActivity: 'Scheduled meeting for Jan 25, 2:00 PM'
    },
    {
      id: 3,
      name: 'Emily Rodriguez',
      role: 'Client',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
      caseNumber: 'CASE-2024-003',
      caseTitle: 'Environmental Compliance',
      lastMessage: 'I\'ve uploaded the environmental impact assessment.',
      timestamp: '1 day ago',
      unread: 1,
      online: true,
      priority: 'High',
      encrypted: true,
      lastActivity: 'Uploaded 3 documents'
    },
    {
      id: 4,
      name: 'David Thompson',
      role: 'Client',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      caseNumber: 'CASE-2024-004',
      caseTitle: 'Property Acquisition',
      lastMessage: 'The due diligence report is ready for review.',
      timestamp: '2 days ago',
      unread: 0,
      online: false,
      priority: 'Medium',
      encrypted: true,
      lastActivity: 'Generated report'
    },
    {
      id: 5,
      name: 'Jennifer Walsh',
      role: 'Associate',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&h=150&fit=crop&crop=face',
      caseNumber: 'INTERNAL',
      caseTitle: 'Team Communication',
      lastMessage: 'The research on patent law precedents is complete.',
      timestamp: '3 hours ago',
      unread: 1,
      online: true,
      priority: 'Normal',
      encrypted: true,
      lastActivity: 'Shared research notes'
    }
  ];

  // Enhanced messages with legal context
  const messages = [
    {
      id: 1,
      sender: 'Sarah Johnson',
      content: 'Hi, I wanted to check on the employment contract review. Have you had a chance to look at the latest version from HR?',
      timestamp: '9:30 AM',
      isClient: true,
      messageType: 'text',
      caseRef: 'CASE-2024-001'
    },
    {
      id: 2,
      sender: 'You',
      content: 'Good morning Sarah! Yes, I\'ve reviewed the contract. There are a few clauses we need to discuss, particularly around the non-compete agreement and intellectual property rights.',
      timestamp: '9:45 AM',
      isClient: false,
      messageType: 'text',
      caseRef: 'CASE-2024-001'
    },
    {
      id: 3,
      sender: 'You',
      content: 'I\'ve prepared a detailed analysis with my recommendations.',
      timestamp: '9:46 AM',
      isClient: false,
      messageType: 'document',
      caseRef: 'CASE-2024-001',
      attachments: [
        { name: 'Contract_Analysis_Sarah_Johnson.pdf', size: '2.3 MB', type: 'pdf' }
      ]
    },
    {
      id: 4,
      sender: 'Sarah Johnson',
      content: 'Thank you! I\'ll review this with my team. The non-compete clause is indeed concerning for our business model.',
      timestamp: '10:15 AM',
      isClient: true,
      messageType: 'text',
      caseRef: 'CASE-2024-001'
    },
    {
      id: 5,
      sender: 'You',
      content: 'I\'ve negotiated similar terms before. We can propose alternative language that protects their interests while preserving your flexibility. Would you like to schedule a call to discuss strategy?',
      timestamp: '10:30 AM',
      isClient: false,
      messageType: 'text',
      caseRef: 'CASE-2024-001'
    },
    {
      id: 6,
      sender: 'Sarah Johnson',
      content: 'Yes, that would be perfect. I\'m available this afternoon after 2 PM.',
      timestamp: '10:35 AM',
      isClient: true,
      messageType: 'text',
      caseRef: 'CASE-2024-001'
    },
    {
      id: 7,
      sender: 'You',
      content: 'Great! I\'ve scheduled a video call for 2:30 PM today. I\'ll send you the updated contract with my proposed changes beforehand.',
      timestamp: '10:40 AM',
      isClient: false,
      messageType: 'meeting',
      caseRef: 'CASE-2024-001',
      meetingDetails: {
        title: 'Contract Review Discussion',
        date: '2024-01-23',
        time: '2:30 PM',
        duration: '60 minutes'
      }
    },
    {
      id: 8,
      sender: 'Sarah Johnson',
      content: 'The revised contract looks good. When can we finalize?',
      timestamp: '4:15 PM',
      isClient: true,
      messageType: 'text',
      caseRef: 'CASE-2024-001'
    }
  ];

  // Document sharing data
  const sharedDocuments = [
    {
      id: 1,
      name: 'Employment_Contract_v3.pdf',
      sharedBy: 'Sarah Johnson',
      sharedAt: '2024-01-23 2:15 PM',
      size: '1.2 MB',
      type: 'pdf',
      caseNumber: 'CASE-2024-001'
    },
    {
      id: 2,
      name: 'Contract_Analysis_Sarah_Johnson.pdf',
      sharedBy: 'You',
      sharedAt: '2024-01-23 9:46 AM',
      size: '2.3 MB',
      type: 'pdf',
      caseNumber: 'CASE-2024-001'
    },
    {
      id: 3,
      name: 'Legal_Precedents_Research.docx',
      sharedBy: 'Jennifer Walsh',
      sharedAt: '2024-01-22 4:30 PM',
      size: '856 KB',
      type: 'docx',
      caseNumber: 'CASE-2024-001'
    }
  ];

  const handleSendMessage = () => {
    if (message.trim()) {
      // Simulate sending message
      setMessage('');
    }
  };

  const selectedConversation = conversations.find(conv => conv.id === selectedChat);
  const filteredConversations = conversations.filter(conv => 
    conv.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.caseTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.caseNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="pt-20 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <Badge className="mb-4 bg-legal-navy text-white">
              💬 Live Communication Hub
            </Badge>
            <h1 className="text-4xl font-playfair font-bold text-gray-900 mb-4">
              Secure Client Communication
            </h1>
            <p className="text-xl text-gray-600">
              Experience Judicature's encrypted messaging system with case-integrated communications, document sharing, and real-time collaboration.
            </p>
          </div>

          {/* Communication Stats */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Active Conversations</p>
                    <p className="text-2xl font-bold text-legal-navy">12</p>
                    <p className="text-xs text-green-600 mt-1">3 new today</p>
                  </div>
                  <MessageCircle className="h-8 w-8 text-legal-navy" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Documents Shared</p>
                    <p className="text-2xl font-bold text-legal-navy">47</p>
                    <p className="text-xs text-blue-600 mt-1">8 this week</p>
                  </div>
                  <FileText className="h-8 w-8 text-legal-navy" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Response Time</p>
                    <p className="text-2xl font-bold text-legal-navy">12m</p>
                    <p className="text-xs text-green-600 mt-1">↓ 15% improvement</p>
                  </div>
                  <Clock className="h-8 w-8 text-legal-navy" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Security Level</p>
                    <p className="text-2xl font-bold text-legal-navy">AES-256</p>
                    <p className="text-xs text-green-600 mt-1">✓ Encrypted</p>
                  </div>
                  <Shield className="h-8 w-8 text-legal-navy" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-4 gap-6">
            {/* Enhanced Conversation List */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <div className="flex items-center justify-between mb-4">
                  <CardTitle className="flex items-center">
                    <Users className="h-5 w-5 mr-2" />
                    Communications
                  </CardTitle>
                  <Button size="sm" variant="outline">
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search conversations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-3 mb-4">
                    <TabsTrigger value="active">Active</TabsTrigger>
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="archived">Archived</TabsTrigger>
                  </TabsList>
                  
                  <div className="space-y-1 max-h-96 overflow-y-auto">
                    {filteredConversations.map((conv) => (
                      <div
                        key={conv.id}
                        onClick={() => setSelectedChat(conv.id)}
                        className={`p-4 cursor-pointer hover:bg-gray-50 border-l-4 transition-colors ${
                          selectedChat === conv.id ? 'border-legal-navy bg-blue-50' : 'border-transparent'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <div className="relative">
                              <img 
                                src={conv.avatar} 
                                alt={conv.name}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                              {conv.online && (
                                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium text-sm truncate">{conv.name}</h4>
                                {conv.encrypted && (
                                  <Shield className="h-3 w-3 text-green-600" />
                                )}
                              </div>
                              <p className="text-xs text-gray-500 mb-1">{conv.role} • {conv.caseNumber}</p>
                              <p className="text-xs text-gray-600 font-medium truncate">{conv.caseTitle}</p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end">
                            {conv.unread > 0 && (
                              <Badge className="bg-legal-navy text-white text-xs mb-1">{conv.unread}</Badge>
                            )}
                            <Badge variant={
                              conv.priority === 'High' ? 'destructive' : 
                              conv.priority === 'Medium' ? 'default' : 
                              'secondary'
                            } className="text-xs">
                              {conv.priority}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-xs text-gray-600 truncate mb-1">{conv.lastMessage}</p>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-gray-400">{conv.timestamp}</p>
                          <p className="text-xs text-gray-500">{conv.lastActivity}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Tabs>
              </CardContent>
            </Card>

            {/* Enhanced Chat Area */}
            <Card className="lg:col-span-3">
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <img 
                        src={selectedConversation?.avatar || 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face'} 
                        alt={selectedConversation?.name || 'User'}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      {selectedConversation?.online && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {selectedConversation?.name || 'Sarah Johnson'}
                        {selectedConversation?.encrypted && (
                          <Shield className="h-4 w-4 text-green-600" />
                        )}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <span>{selectedConversation?.role || 'Client'} • {selectedConversation?.online ? 'Online' : 'Offline'}</span>
                        <span className="text-xs">• {selectedConversation?.caseNumber || 'CASE-2024-001'}</span>
                      </CardDescription>
                      <p className="text-sm font-medium text-legal-navy">{selectedConversation?.caseTitle || 'Employment Contract Review'}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button size="sm" variant="outline">
                      <Phone className="h-4 w-4 mr-2" />
                      Call
                    </Button>
                    <Button size="sm" variant="outline">
                      <Video className="h-4 w-4 mr-2" />
                      Video
                    </Button>
                    <Button size="sm" variant="outline">
                      <Calendar className="h-4 w-4 mr-2" />
                      Schedule
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <Tabs defaultValue="messages" className="flex-1">
                <div className="border-b px-6">
                  <TabsList className="grid w-full grid-cols-3 max-w-md">
                    <TabsTrigger value="messages">Messages</TabsTrigger>
                    <TabsTrigger value="documents">Documents</TabsTrigger>
                    <TabsTrigger value="meetings">Meetings</TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="messages" className="m-0">
                  <CardContent className="p-0">
                    <div className="h-96 overflow-y-auto p-4 space-y-4">
                      {messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.isClient ? 'justify-start' : 'justify-end'}`}
                        >
                          <div className={`max-w-xs lg:max-w-md ${msg.isClient ? 'mr-auto' : 'ml-auto'}`}>
                            {/* Case reference tag */}
                            {msg.caseRef && (
                              <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                                <FileText className="h-3 w-3" />
                                {msg.caseRef}
                              </div>
                            )}
                            
                            <div
                              className={`px-4 py-3 rounded-lg ${
                                msg.isClient
                                  ? 'bg-gray-100 text-gray-900'
                                  : 'bg-legal-navy text-white'
                              }`}
                            >
                              <div className="text-sm leading-relaxed">{msg.content}</div>
                              
                              {/* Attachments */}
                              {msg.attachments && (
                                <div className="mt-2 space-y-1">
                                  {msg.attachments.map((attachment, index) => (
                                    <div key={index} className="flex items-center gap-2 p-2 bg-white/10 rounded border">
                                      <FileText className="h-4 w-4" />
                                      <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium truncate">{attachment.name}</p>
                                        <p className="text-xs opacity-75">{attachment.size}</p>
                                      </div>
                                      <Button size="sm" variant="ghost" className="text-white hover:bg-white/20">
                                        <Download className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Meeting details */}
                              {msg.messageType === 'meeting' && msg.meetingDetails && (
                                <div className="mt-2 p-2 bg-white/10 rounded border">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Calendar className="h-4 w-4" />
                                    <span className="text-xs font-medium">{msg.meetingDetails.title}</span>
                                  </div>
                                  <p className="text-xs opacity-75">
                                    {msg.meetingDetails.date} at {msg.meetingDetails.time}
                                  </p>
                                  <p className="text-xs opacity-75">Duration: {msg.meetingDetails.duration}</p>
                                </div>
                              )}

                              <div
                                className={`text-xs mt-2 flex items-center gap-1 ${
                                  msg.isClient ? 'text-gray-500' : 'text-blue-200'
                                }`}
                              >
                                <Clock className="h-3 w-3" />
                                {msg.timestamp}
                                {!msg.isClient && <CheckCircle className="h-3 w-3 text-green-300" />}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Enhanced Message Input */}
                    <div className="border-t p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Button size="sm" variant="outline">
                          <Paperclip className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Mic className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Camera className="h-4 w-4" />
                        </Button>
                        <div className="flex-1" />
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                          <Shield className="h-3 w-3 text-green-600" />
                          End-to-end encrypted
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Input
                          placeholder="Type your secure message..."
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                          className="flex-1"
                        />
                        <Button onClick={handleSendMessage} className="bg-legal-navy hover:bg-legal-navy/90">
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </TabsContent>

                <TabsContent value="documents" className="m-0">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">Shared Documents</h3>
                        <Button size="sm" className="bg-legal-navy hover:bg-legal-navy/90">
                          <Paperclip className="h-4 w-4 mr-2" />
                          Share Document
                        </Button>
                      </div>
                      
                      <div className="space-y-3">
                        {sharedDocuments.map((doc) => (
                          <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center space-x-3">
                              <div className="p-2 bg-legal-navy/10 rounded-lg">
                                <FileText className="h-5 w-5 text-legal-navy" />
                              </div>
                              <div>
                                <h4 className="font-medium text-sm">{doc.name}</h4>
                                <p className="text-xs text-gray-600">
                                  Shared by {doc.sharedBy} • {doc.sharedAt}
                                </p>
                                <p className="text-xs text-gray-500">{doc.size} • {doc.caseNumber}</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button size="sm" variant="outline">
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </TabsContent>

                <TabsContent value="meetings" className="m-0">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">Scheduled Meetings</h3>
                        <Button size="sm" className="bg-legal-navy hover:bg-legal-navy/90">
                          <Calendar className="h-4 w-4 mr-2" />
                          Schedule Meeting
                        </Button>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-legal-navy/10 rounded-lg">
                              <Video className="h-5 w-5 text-legal-navy" />
                            </div>
                            <div>
                              <h4 className="font-medium text-sm">Contract Review Discussion</h4>
                              <p className="text-xs text-gray-600">Today at 2:30 PM • 60 minutes</p>
                              <p className="text-xs text-gray-500">CASE-2024-001</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button size="sm" variant="outline">Join</Button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-gray-100 rounded-lg">
                              <Phone className="h-5 w-5 text-gray-600" />
                            </div>
                            <div>
                              <h4 className="font-medium text-sm">Settlement Discussion</h4>
                              <p className="text-xs text-gray-600">Jan 25 at 10:00 AM • 45 minutes</p>
                              <p className="text-xs text-gray-500">CASE-2024-001</p>
                            </div>
                          </div>
                          <Badge>Scheduled</Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </TabsContent>
              </Tabs>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Communication;
