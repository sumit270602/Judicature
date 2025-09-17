
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Send, Paperclip, Users, Phone, Video } from 'lucide-react';

const Communication = () => {
  const [message, setMessage] = useState('');
  const [selectedChat, setSelectedChat] = useState(1);

  const conversations = [
    {
      id: 1,
      name: 'John Smith',
      role: 'Client',
      lastMessage: 'Thank you for the update on my case.',
      timestamp: '2 hours ago',
      unread: 2,
      online: true
    },
    {
      id: 2,
      name: 'Sarah Johnson',
      role: 'Client',
      lastMessage: 'When can we schedule our next meeting?',
      timestamp: '1 day ago',
      unread: 0,
      online: false
    },
    {
      id: 3,
      name: 'Michael Brown',
      role: 'Client',
      lastMessage: 'I have uploaded the requested documents.',
      timestamp: '3 days ago',
      unread: 1,
      online: true
    }
  ];

  const messages = [
    {
      id: 1,
      sender: 'John Smith',
      content: 'Hello, I wanted to check on the status of my case.',
      timestamp: '10:30 AM',
      isClient: true
    },
    {
      id: 2,
      sender: 'You',
      content: 'Hi John, I have some good news. We received a response from the opposing counsel and they are interested in settling.',
      timestamp: '10:45 AM',
      isClient: false
    },
    {
      id: 3,
      sender: 'John Smith',
      content: 'That\'s great news! What are the next steps?',
      timestamp: '11:00 AM',
      isClient: true
    },
    {
      id: 4,
      sender: 'You',
      content: 'I\'ll review their offer and we can schedule a call to discuss the details. Are you available tomorrow afternoon?',
      timestamp: '11:15 AM',
      isClient: false
    },
    {
      id: 5,
      sender: 'John Smith',
      content: 'Thank you for the update on my case.',
      timestamp: '2:30 PM',
      isClient: true
    }
  ];

  const handleSendMessage = () => {
    if (message.trim()) {
      console.log('Sending message:', message);
      setMessage('');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Badge className="mb-4 bg-legal-navy text-white">
            💬 Secure Communication
          </Badge>
          <h1 className="text-4xl font-playfair font-bold text-gray-900 mb-4">
            Client Communication
          </h1>
          <p className="text-xl text-gray-600">
            Secure messaging platform for lawyer-client communication with document sharing.
          </p>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Conversation List */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Conversations
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-1">
                {conversations.map((conv) => (
                  <div
                    key={conv.id}
                    onClick={() => setSelectedChat(conv.id)}
                    className={`p-4 cursor-pointer hover:bg-gray-50 border-l-4 ${
                      selectedChat === conv.id ? 'border-legal-navy bg-blue-50' : 'border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-legal-navy rounded-full flex items-center justify-center text-white text-sm font-semibold">
                          {conv.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <div className="font-medium text-sm">{conv.name}</div>
                          <div className="text-xs text-gray-500">{conv.role}</div>
                        </div>
                      </div>
                      {conv.unread > 0 && (
                        <Badge className="bg-legal-navy text-white text-xs">{conv.unread}</Badge>
                      )}
                    </div>
                    <div className="text-xs text-gray-600 truncate">{conv.lastMessage}</div>
                    <div className="text-xs text-gray-400 mt-1">{conv.timestamp}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Chat Area */}
          <Card className="lg:col-span-3">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-legal-navy rounded-full flex items-center justify-center text-white font-semibold">
                    JS
                  </div>
                  <div>
                    <CardTitle className="text-lg">John Smith</CardTitle>
                    <CardDescription>Client • Online</CardDescription>
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
                </div>
              </div>
            </CardHeader>
            
            {/* Messages */}
            <CardContent className="p-0">
              <div className="h-96 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.isClient ? 'justify-start' : 'justify-end'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        msg.isClient
                          ? 'bg-gray-100 text-gray-900'
                          : 'bg-legal-navy text-white'
                      }`}
                    >
                      <div className="text-sm">{msg.content}</div>
                      <div
                        className={`text-xs mt-1 ${
                          msg.isClient ? 'text-gray-500' : 'text-blue-200'
                        }`}
                      >
                        {msg.timestamp}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Message Input */}
              <div className="border-t p-4">
                <div className="flex items-center space-x-2">
                  <Button size="sm" variant="outline">
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <Input
                    placeholder="Type your message..."
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
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Communication;
