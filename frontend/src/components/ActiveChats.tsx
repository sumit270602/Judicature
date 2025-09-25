import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { 
  MessageCircle, 
  Send, 
  Phone, 
  Video, 
  MoreHorizontal, 
  Search,
  Clock,
  Check,
  CheckCheck,
  Plus,
  User
} from 'lucide-react';
import { useMessaging } from '@/hooks/use-messaging';
import { formatDistanceToNow } from 'date-fns';

interface ChatWindowProps {
  isOpen: boolean;
  onClose: () => void;
  conversation: any;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ isOpen, onClose, conversation }) => {
  const [newMessage, setNewMessage] = useState('');
  const { 
    currentConversation, 
    loadingMessages, 
    sendingMessage, 
    sendDirectMessage,
    loadConversation 
  } = useMessaging();

  React.useEffect(() => {
    if (isOpen && conversation) {
      loadConversation(conversation.participant._id);
    }
  }, [isOpen, conversation, loadConversation]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !conversation) return;
    
    await sendDirectMessage(conversation.participant._id, newMessage);
    setNewMessage('');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .substring(0, 2);
  };

  if (!conversation) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0">
        {/* Chat Header */}
        <DialogHeader className="p-4 border-b bg-gradient-to-r from-legal-navy to-legal-navy/90">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src="/api/placeholder/40/40" />
                <AvatarFallback className="bg-legal-gold text-legal-navy font-semibold">
                  {getInitials(conversation.participant.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <DialogTitle className="text-white text-lg">
                  {conversation.participant.name}
                </DialogTitle>
                <p className="text-legal-gold/80 text-sm capitalize">
                  {conversation.participant.role}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                <Phone className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                <Video className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Chat Messages */}
        <ScrollArea className="flex-1 p-4">
          {loadingMessages ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-legal-navy"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {currentConversation.map((message, index) => {
                const isOwn = message.sender._id === conversation.participant._id ? false : true;
                const showTime = index === 0 || 
                  new Date(message.createdAt).getTime() - new Date(currentConversation[index - 1].createdAt).getTime() > 300000; // 5 minutes

                return (
                  <div key={message._id}>
                    {showTime && (
                      <div className="text-center text-xs text-gray-500 my-4">
                        {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                      </div>
                    )}
                    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] ${isOwn ? 'order-2' : 'order-1'}`}>
                        <div
                          className={`p-3 rounded-lg ${
                            isOwn
                              ? 'bg-legal-navy text-white rounded-br-sm'
                              : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                          }`}
                        >
                          <p className="text-sm">{message.message}</p>
                        </div>
                        <div className={`flex items-center gap-1 mt-1 text-xs text-gray-500 ${
                          isOwn ? 'justify-end' : 'justify-start'
                        }`}>
                          <span>{new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          {isOwn && (
                            <span>
                              {message.isRead ? (
                                <CheckCheck className="h-3 w-3 text-blue-500" />
                              ) : (
                                <Check className="h-3 w-3" />
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                      {!isOwn && (
                        <Avatar className={`h-8 w-8 ${isOwn ? 'order-1 mr-2' : 'order-2 ml-2'} self-end`}>
                          <AvatarImage src="/api/placeholder/32/32" />
                          <AvatarFallback className="text-xs">
                            {getInitials(message.sender.name)}
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  </div>
                );
              })}
              
              {currentConversation.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No messages yet. Start the conversation!</p>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        {/* Message Input */}
        <div className="p-4 border-t bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                className="pr-12"
                disabled={sendingMessage}
              />
            </div>
            <Button 
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || sendingMessage}
              className="bg-legal-navy hover:bg-legal-navy/90"
            >
              {sendingMessage ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

interface ActiveChatsProps {
  className?: string;
}

const ActiveChats: React.FC<ActiveChatsProps> = ({ className = '' }) => {
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [showChatWindow, setShowChatWindow] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const { 
    conversations, 
    unreadCount, 
    loadingConversations, 
    fetchConversations,
    isConnected 
  } = useMessaging();

  const filteredConversations = conversations.filter(conv =>
    conv.participant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.lastMessage.message.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleConversationClick = (conversation: any) => {
    setSelectedConversation(conversation);
    setShowChatWindow(true);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .substring(0, 2);
  };

  const formatMessageTime = (date: string) => {
    const messageDate = new Date(date);
    const now = new Date();
    const diffInHours = (now.getTime() - messageDate.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // Less than a week
      return messageDate.toLocaleDateString([], { weekday: 'short' });
    } else {
      return messageDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  return (
    <>
      <Card className={`${className} h-[600px] flex flex-col`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <MessageCircle className="h-5 w-5 text-legal-navy" />
                Messages
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="ml-2 text-xs px-2 py-1">
                    {unreadCount}
                  </Badge>
                )}
              </CardTitle>
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchConversations}
              disabled={loadingConversations}
            >
              {loadingConversations ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-legal-navy border-t-transparent" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
            </Button>
          </div>
          <CardDescription>
            Your conversations with lawyers and legal team
          </CardDescription>
          
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="pl-10"
            />
          </div>
        </CardHeader>

        <CardContent className="flex-1 p-0">
          <ScrollArea className="h-full">
            {loadingConversations ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-legal-navy"></div>
              </div>
            ) : filteredConversations.length > 0 ? (
              <div className="space-y-1">
                {filteredConversations.map((conversation) => (
                  <div
                    key={conversation._id}
                    onClick={() => handleConversationClick(conversation)}
                    className="flex items-center gap-3 p-4 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-100 last:border-b-0"
                  >
                    <div className="relative">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src="/api/placeholder/48/48" />
                        <AvatarFallback className="bg-legal-gold text-legal-navy font-semibold">
                          {getInitials(conversation.participant.name)}
                        </AvatarFallback>
                      </Avatar>
                      {conversation.participant.role === 'lawyer' && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-legal-navy rounded-full flex items-center justify-center">
                          <User className="h-2 w-2 text-white" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-semibold text-sm text-gray-900 truncate">
                          {conversation.participant.name}
                        </h4>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">
                            {formatMessageTime(conversation.lastMessage.createdAt)}
                          </span>
                          {conversation.unreadCount > 0 && (
                            <Badge variant="destructive" className="text-xs px-2 py-0 h-5 min-w-5">
                              {conversation.unreadCount}
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-gray-600 truncate flex-1">
                          {conversation.lastMessage.message}
                        </p>
                        <Badge variant="outline" className="text-xs px-2 py-0 h-5 capitalize">
                          {conversation.participant.role}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-6">
                <MessageCircle className="h-16 w-16 text-gray-300 mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">No conversations yet</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Start a conversation with your lawyer or legal team
                </p>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Start New Chat
                </Button>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Chat Window */}
      <ChatWindow
        isOpen={showChatWindow}
        onClose={() => setShowChatWindow(false)}
        conversation={selectedConversation}
      />
    </>
  );
};

export default ActiveChats;