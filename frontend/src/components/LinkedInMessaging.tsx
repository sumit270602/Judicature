import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { 
  MessageCircle, 
  Send, 
  X, 
  Minimize2, 
  Maximize2,
  Search,
  MoreHorizontal,
  Phone,
  Video,
  Paperclip,
  Smile,
  Image as ImageIcon
} from 'lucide-react';
import { useMessaging } from '@/hooks/use-messaging';
import { formatDistanceToNow } from 'date-fns';

interface LinkedInMessagingProps {
  isOpen: boolean;
  onClose: () => void;
  targetUserId?: string; // Optional: pre-select conversation with this user
  targetUser?: { _id: string; name: string; role: string }; // Optional: user info for new conversations
}

const LinkedInMessaging: React.FC<LinkedInMessagingProps> = ({ isOpen, onClose, targetUserId, targetUser }) => {
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  
  const { 
    conversations, 
    currentConversation,
    loadingConversations, 
    loadingMessages,
    sendingMessage,
    sendDirectMessage,
    loadConversation,
    fetchConversations,
    isConnected 
  } = useMessaging();

  useEffect(() => {
    if (isOpen) {
      fetchConversations();
    }
  }, [isOpen, fetchConversations]);

  // Auto-select conversation when targetUserId is provided
  useEffect(() => {
    if (targetUserId && isOpen && !selectedConversation) {
      const targetConversation = conversations.find(
        conv => conv.participant._id === targetUserId
      );
      if (targetConversation) {
        handleConversationClick(targetConversation);
      } else if (targetUser) {
        // Create a virtual conversation for the target user if no existing conversation
        const virtualConversation = {
          _id: `virtual-${targetUser._id}`,
          participant: targetUser,
          lastMessage: { message: 'Start a new conversation', createdAt: new Date().toISOString() },
          unreadCount: 0
        };
        setSelectedConversation(virtualConversation);
        loadConversation(targetUserId);
      }
    }
  }, [targetUserId, targetUser, conversations, selectedConversation, isOpen]);

  const handleConversationClick = (conversation: any) => {
    setSelectedConversation(conversation);
    loadConversation(conversation.participant._id);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;
    
    await sendDirectMessage(selectedConversation.participant._id, newMessage);
    setNewMessage('');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .substring(0, 2);
  };

  const formatTime = (date: string) => {
    const messageDate = new Date(date);
    const now = new Date();
    const diffInHours = (now.getTime() - messageDate.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'now';
    } else if (diffInHours < 24) {
      return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) {
      return messageDate.toLocaleDateString([], { weekday: 'short' });
    } else {
      return messageDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.participant.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-0 right-4 z-50">
      {/* Messaging Window */}
      <div 
        className={`bg-white rounded-t-lg shadow-2xl border border-gray-200 transition-all duration-300 ${
          isMinimized ? 'h-12' : 'h-[600px]'
        } w-[800px] flex flex-col`}
        style={{ 
          boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.15)',
          borderBottom: 'none'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white rounded-t-lg">
          <div className="flex items-center gap-3">
            <MessageCircle className="h-5 w-5 text-blue-600" />
            <span className="font-semibold text-gray-900">Messaging</span>
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(!isMinimized)}
              className="text-gray-500 hover:text-gray-700 h-8 w-8 p-0"
            >
              {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {!isMinimized && (
          <div className="flex flex-1 overflow-hidden">
            {/* Conversation List Sidebar */}
            <div className="w-80 border-r border-gray-200 flex flex-col">
              {/* Search */}
              <div className="p-3 border-b border-gray-100">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search messages"
                    className="pl-10 h-9 text-sm border-gray-300 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Conversations */}
              <ScrollArea className="flex-1">
                {loadingConversations ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  </div>
                ) : filteredConversations.length > 0 ? (
                  <div>
                    {filteredConversations.map((conversation) => (
                      <div
                        key={conversation._id}
                        onClick={() => handleConversationClick(conversation)}
                        className={`flex items-center gap-3 p-3 cursor-pointer transition-colors hover:bg-gray-50 ${
                          selectedConversation?._id === conversation._id ? 'bg-blue-50 border-r-2 border-blue-600' : ''
                        }`}
                      >
                        <div className="relative">
                          <Avatar className="h-11 w-11">
                            <AvatarImage src="/api/placeholder/44/44" />
                            <AvatarFallback className="bg-blue-600 text-white text-sm font-medium">
                              {getInitials(conversation.participant.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-medium text-sm text-gray-900 truncate">
                              {conversation.participant.name}
                            </h4>
                            <span className="text-xs text-gray-500 flex-shrink-0">
                              {formatTime(conversation.lastMessage.createdAt)}
                            </span>
                          </div>
                          
                          <p className="text-sm text-gray-600 truncate">
                            {conversation.lastMessage.message}
                          </p>
                          
                          {conversation.unreadCount > 0 && (
                            <div className="w-2 h-2 bg-blue-600 rounded-full mt-1"></div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center p-6">
                    <MessageCircle className="h-12 w-12 text-gray-300 mb-3" />
                    <p className="text-sm text-gray-500">No conversations yet</p>
                  </div>
                )}
              </ScrollArea>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col">
              {selectedConversation ? (
                <>
                  {/* Chat Header */}
                  <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src="/api/placeholder/40/40" />
                        <AvatarFallback className="bg-blue-600 text-white font-medium">
                          {getInitials(selectedConversation.participant.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold text-gray-900 text-sm">
                          {selectedConversation.participant.name}
                        </h3>
                        <p className="text-xs text-gray-500 capitalize">
                          {selectedConversation.participant.role}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700">
                        <Phone className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700">
                        <Video className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Messages */}
                  <ScrollArea className="flex-1 p-4">
                    {loadingMessages ? (
                      <div className="flex items-center justify-center h-32">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {currentConversation.map((message, index) => {
                          const isOwn = message.sender._id !== selectedConversation.participant._id;
                          const showAvatar = !isOwn && (index === currentConversation.length - 1 || 
                            currentConversation[index + 1]?.sender._id !== message.sender._id);

                          return (
                            <div key={message._id} className={`flex gap-2 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                              {!isOwn && (
                                <Avatar className={`h-8 w-8 ${showAvatar ? 'visible' : 'invisible'}`}>
                                  <AvatarImage src="/api/placeholder/32/32" />
                                  <AvatarFallback className="bg-blue-600 text-white text-xs">
                                    {getInitials(message.sender.name)}
                                  </AvatarFallback>
                                </Avatar>
                              )}
                              
                              <div className={`max-w-[70%] ${isOwn ? 'order-1' : 'order-2'}`}>
                                <div
                                  className={`px-4 py-2 rounded-2xl text-sm ${
                                    isOwn
                                      ? 'bg-blue-600 text-white'
                                      : 'bg-gray-200 text-gray-900'
                                  }`}
                                >
                                  {message.message}
                                </div>
                                <div className={`text-xs text-gray-500 mt-1 px-2 ${
                                  isOwn ? 'text-right' : 'text-left'
                                }`}>
                                  {new Date(message.createdAt).toLocaleTimeString([], { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  })}
                                </div>
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
                  <div className="p-4 border-t border-gray-200 bg-white">
                    <div className="flex items-end gap-3">
                      <div className="flex-1 bg-gray-100 rounded-2xl px-4 py-2">
                        <Input
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Write a message..."
                          onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                          className="border-0 bg-transparent p-0 focus-visible:ring-0 text-sm"
                          disabled={sendingMessage}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700">
                          <Paperclip className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700">
                          <ImageIcon className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700">
                          <Smile className="h-4 w-4" />
                        </Button>
                      </div>
                      <Button 
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim() || sendingMessage}
                        size="sm"
                        className={`h-8 w-8 p-0 rounded-full ${
                          newMessage.trim() 
                            ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        {sendingMessage ? (
                          <div className="h-3 w-3 animate-spin rounded-full border border-white border-t-transparent" />
                        ) : (
                          <Send className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-center p-8">
                  <div>
                    <MessageCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="font-semibold text-gray-900 mb-2">Choose a conversation</h3>
                    <p className="text-sm text-gray-500">
                      Select a conversation from the sidebar to start messaging
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LinkedInMessaging;