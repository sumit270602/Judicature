import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './use-auth';
import { useToast } from './use-toast';

interface Message {
  _id: string;
  sender: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  receiver?: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  caseId?: string;
  message: string;
  messageType: 'direct' | 'case';
  createdAt: string;
  isRead?: boolean;
  readAt?: string;
}

interface Conversation {
  _id: string;
  participant: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  lastMessage: Message;
  unreadCount: number;
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const useMessaging = () => {
  const { user, token } = useAuth();
  const { toast } = useToast();
  
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [directMessages, setDirectMessages] = useState<Message[]>([]);
  const [caseMessages, setCaseMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Message[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);

  useEffect(() => {
    if (!token || !user) return;

    const newSocket = io('http://localhost:5000', {
      auth: { token }
    });

    newSocket.on('connect', () => {
      console.log('Connected to chat server');
      setIsConnected(true);
      fetchConversations();
      fetchUnreadCount();
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from chat server');
      setIsConnected(false);
    });

    // Listen for direct messages
    newSocket.on('direct_message', (message: Message) => {
      setDirectMessages(prev => [...prev, message]);
      setCurrentConversation(prev => {
        const isCurrentUser = message.sender._id === getCurrentConversationUserId() || 
                             message.receiver?._id === getCurrentConversationUserId();
        return isCurrentUser ? [...prev, message] : prev;
      });
      
      fetchConversations();
      fetchUnreadCount();
      
      // Show notification if not current conversation
      if (message.sender._id !== getCurrentConversationUserId()) {
        toast({
          title: "New Message",
          description: `${message.sender.name}: ${message.message.substring(0, 50)}...`,
        });
      }
    });

    // Listen for case messages
    newSocket.on('message', (message: Message) => {
      setCaseMessages(prev => [...prev, message]);
    });

    // Listen for message sent confirmation
    newSocket.on('message_sent', () => {
      setSendingMessage(false);
    });

    // Listen for errors
    newSocket.on('message_error', (error: any) => {
      setSendingMessage(false);
      toast({
        title: "Message Error",
        description: error.error || "Failed to send message",
        variant: "destructive",
      });
    });

    // Listen for message sent confirmation
    newSocket.on('message_sent', (message: Message) => {
      setDirectMessages(prev => [...prev, message]);
    });

    // Listen for message errors
    newSocket.on('message_error', (error: { error: string }) => {
      console.error('Message error:', error.error);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [token]);

  // Helper functions
  const getCurrentConversationUserId = useCallback(() => {
    return localStorage.getItem('currentConversationUserId');
  }, []);

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    if (!token) return;
    
    setLoadingConversations(true);
    try {
      const response = await fetch(`${API_BASE}/chat/messages/conversations`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setConversations(data || []);
        
        // Update unread count
        const totalUnread = (data || []).reduce((sum: number, conv: Conversation) => sum + conv.unreadCount, 0);
        setUnreadCount(totalUnread);
      } else {
        // If request fails, set empty conversations
        setConversations([]);
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
      setConversations([]);
      setUnreadCount(0);
      toast({
        title: "Error",
        description: "Failed to load conversations",
        variant: "destructive",
      });
    } finally {
      setLoadingConversations(false);
    }
  }, [token, toast]);

  // Load specific conversation
  const loadConversation = useCallback(async (userId: string) => {
    if (!token) return;
    
    setLoadingMessages(true);
    localStorage.setItem('currentConversationUserId', userId);
    
    try {
      const response = await fetch(`${API_BASE}/chat/messages/conversation/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCurrentConversation(data.messages || []);
        fetchConversations(); // Refresh to update unread counts
      } else {
        // If request fails, set empty conversation
        setCurrentConversation([]);
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
      setCurrentConversation([]);
      toast({
        title: "Error",
        description: "Failed to load conversation",
        variant: "destructive",
      });
    } finally {
      setLoadingMessages(false);
    }
  }, [token, toast, fetchConversations]);

  // Send direct message
  const sendDirectMessage = useCallback(async (receiverId: string, message: string) => {
    if (!socket || !message.trim()) return;
    
    setSendingMessage(true);
    
    try {
      // Send via socket for real-time delivery
      socket.emit('direct_message', {
        receiverId,
        message: message.trim()
      });
      
      // Add optimistic message to current conversation
      const optimisticMessage: Message = {
        _id: `temp-${Date.now()}`,
        sender: {
          _id: user?.id || '',
          name: user?.name || '',
          email: user?.email || '',
          role: user?.role || 'client'
        },
        receiver: {
          _id: receiverId,
          name: '',
          email: '',
          role: ''
        },
        message: message.trim(),
        messageType: 'direct',
        isRead: false,
        createdAt: new Date().toISOString()
      };
      
      setCurrentConversation(prev => [...prev, optimisticMessage]);
      
    } catch (error) {
      setSendingMessage(false);
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
  }, [socket, user, toast]);

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    if (!token) return;
    
    try {
      const response = await fetch(`${API_BASE}/chat/messages/unread-count`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  }, [token]);

  // Send message to case group
  const sendCaseMessage = useCallback((caseId: string, receiverId: string, message: string) => {
    if (socket) {
      socket.emit('message', { caseId, receiver: receiverId, message });
    }
  }, [socket]);

  // Join case room
  const joinCase = useCallback((caseId: string) => {
    if (socket) {
      socket.emit('join', { caseId });
    }
  }, [socket]);

  // Mark message as read
  const markAsRead = useCallback((messageId: string) => {
    if (socket) {
      socket.emit('mark_read', { messageId });
    }
  }, [socket]);

  // Start new conversation
  const startConversation = useCallback((userId: string) => {
    localStorage.setItem('currentConversationUserId', userId);
    setCurrentConversation([]);
    loadConversation(userId);
  }, [loadConversation]);

  return {
    // Connection state
    socket,
    isConnected,
    
    // Data
    conversations,
    currentConversation,
    directMessages,
    caseMessages,
    unreadCount,
    
    // Loading states
    loadingConversations,
    loadingMessages,
    sendingMessage,
    
    // Actions
    sendDirectMessage,
    sendCaseMessage,
    joinCase,
    markAsRead,
    loadConversation,
    startConversation,
    fetchConversations,
    fetchUnreadCount
  };
};