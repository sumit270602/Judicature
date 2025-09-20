import React, { useState, useEffect } from 'react';
import { useMessaging } from '../hooks/use-messaging';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { ScrollArea } from '../components/ui/scroll-area';

const MessagingDemo: React.FC = () => {
  const { token, user } = useAuth();
  const {
    sendDirectMessage,
    sendCaseMessage,
    conversations,
    unreadCount,
    fetchConversations,
    fetchConversationMessages,
    isConnected
  } = useMessaging(token);

  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [newDirectMessageUserId, setNewDirectMessageUserId] = useState('');
  const [newCaseMessage, setNewCaseMessage] = useState({
    caseId: '',
    receiverId: '',
    message: ''
  });

  useEffect(() => {
    fetchConversations();
  }, []);

  const handleSelectConversation = async (userId: string) => {
    setSelectedConversation(userId);
    const conversationMessages = await fetchConversationMessages(userId);
    setMessages(conversationMessages);
  };

  const handleSendDirectMessage = () => {
    if (selectedConversation && newMessage.trim()) {
      sendDirectMessage(selectedConversation, newMessage);
      setNewMessage('');
      // Refresh messages after sending
      setTimeout(() => handleSelectConversation(selectedConversation), 500);
    }
  };

  const handleSendNewDirectMessage = () => {
    if (newDirectMessageUserId && newMessage.trim()) {
      sendDirectMessage(newDirectMessageUserId, newMessage);
      setNewMessage('');
      setNewDirectMessageUserId('');
      fetchConversations();
    }
  };

  const handleSendCaseMessage = () => {
    if (newCaseMessage.caseId && newCaseMessage.receiverId && newCaseMessage.message.trim()) {
      sendCaseMessage(newCaseMessage.caseId, newCaseMessage.receiverId, newCaseMessage.message);
      setNewCaseMessage({ caseId: '', receiverId: '', message: '' });
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Enhanced Messaging System</h1>
        <div className="flex items-center gap-4">
          <Badge variant={isConnected ? "default" : "destructive"}>
            {isConnected ? "Connected" : "Disconnected"}
          </Badge>
          <Badge variant="secondary">
            Unread Messages: {unreadCount}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conversations List */}
        <Card>
          <CardHeader>
            <CardTitle>Conversations</CardTitle>
            <Button onClick={fetchConversations} variant="outline" size="sm">
              Refresh
            </Button>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              {conversations.map((conversation) => (
                <div
                  key={conversation._id}
                  className={`p-3 mb-2 rounded-lg cursor-pointer transition-colors ${
                    selectedConversation === conversation._id
                      ? 'bg-blue-100 border-blue-300'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                  onClick={() => handleSelectConversation(conversation._id)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{conversation.participant.name}</h4>
                      <p className="text-sm text-gray-600">{conversation.participant.role}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {conversation.lastMessage.message.substring(0, 50)}...
                      </p>
                    </div>
                    {conversation.unreadCount > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        {conversation.unreadCount}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Message Thread */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              {selectedConversation ? 'Conversation' : 'Select a conversation'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedConversation ? (
              <>
                <ScrollArea className="h-64 mb-4 p-2 border rounded">
                  {messages.map((message) => (
                    <div
                      key={message._id}
                      className={`mb-3 p-2 rounded-lg max-w-xs ${
                        message.sender._id === user?.id
                          ? 'ml-auto bg-blue-500 text-white'
                          : 'bg-gray-200'
                      }`}
                    >
                      <p className="text-sm">{message.message}</p>
                      <p className="text-xs mt-1 opacity-70">
                        {new Date(message.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  ))}
                </ScrollArea>
                <div className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    onKeyPress={(e) => e.key === 'Enter' && handleSendDirectMessage()}
                  />
                  <Button onClick={handleSendDirectMessage}>Send</Button>
                </div>
              </>
            ) : (
              <p className="text-gray-500 text-center py-8">
                Select a conversation to start messaging
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* New Message Forms */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Start New Direct Message */}
        <Card>
          <CardHeader>
            <CardTitle>Start New Direct Message</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              value={newDirectMessageUserId}
              onChange={(e) => setNewDirectMessageUserId(e.target.value)}
              placeholder="User ID to message"
            />
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Your message"
            />
            <Button onClick={handleSendNewDirectMessage} className="w-full">
              Send Direct Message
            </Button>
          </CardContent>
        </Card>

        {/* Send Case Message */}
        <Card>
          <CardHeader>
            <CardTitle>Send Case Message</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              value={newCaseMessage.caseId}
              onChange={(e) => setNewCaseMessage(prev => ({ ...prev, caseId: e.target.value }))}
              placeholder="Case ID"
            />
            <Input
              value={newCaseMessage.receiverId}
              onChange={(e) => setNewCaseMessage(prev => ({ ...prev, receiverId: e.target.value }))}
              placeholder="Receiver ID"
            />
            <Input
              value={newCaseMessage.message}
              onChange={(e) => setNewCaseMessage(prev => ({ ...prev, message: e.target.value }))}
              placeholder="Your message"
            />
            <Button onClick={handleSendCaseMessage} className="w-full">
              Send Case Message
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MessagingDemo;