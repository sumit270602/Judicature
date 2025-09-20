// Frontend messaging hook example
import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface Message {
  _id: string;
  sender: string;
  receiver?: string;
  caseId?: string;
  message: string;
  messageType: 'direct' | 'case';
  createdAt: string;
  isRead?: boolean;
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

export const useMessaging = (token: string | null) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [directMessages, setDirectMessages] = useState<Message[]>([]);
  const [caseMessages, setCaseMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!token) return;

    const newSocket = io('http://localhost:5000', {
      auth: { token }
    });

    // Listen for direct messages
    newSocket.on('direct_message', (message: Message) => {
      setDirectMessages(prev => [...prev, message]);
      // Update conversations
      fetchConversations();
      fetchUnreadCount();
    });

    // Listen for case messages
    newSocket.on('case_message', (message: Message) => {
      setCaseMessages(prev => [...prev, message]);
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

  // Fetch conversations
  const fetchConversations = async () => {
    if (!token) return;
    
    try {
      const response = await fetch('/api/chat/messages/conversations', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setConversations(data);
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    }
  };

  // Fetch conversation messages
  const fetchConversationMessages = async (userId: string, page = 1) => {
    if (!token) return [];
    
    try {
      const response = await fetch(`/api/chat/messages/conversation/${userId}?page=${page}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      return data.messages;
    } catch (error) {
      console.error('Failed to fetch conversation messages:', error);
      return [];
    }
  };

  // Fetch case messages
  const fetchCaseMessages = async (caseId: string, page = 1) => {
    if (!token) return [];
    
    try {
      const response = await fetch(`/api/chat/messages/case/${caseId}?page=${page}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      return data.messages;
    } catch (error) {
      console.error('Failed to fetch case messages:', error);
      return [];
    }
  };

  // Fetch unread count
  const fetchUnreadCount = async () => {
    if (!token) return;
    
    try {
      const response = await fetch('/api/chat/messages/unread-count', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setUnreadCount(data.unreadCount);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  };

  // Send direct message to specific user
  const sendDirectMessage = (receiverId: string, message: string) => {
    if (socket) {
      socket.emit('direct_message', { receiverId, message });
    }
  };

  // Send message to case group
  const sendCaseMessage = (caseId: string, receiverId: string, message: string) => {
    if (socket) {
      socket.emit('message', { caseId, receiver: receiverId, message });
    }
  };

  // Join case room
  const joinCase = (caseId: string) => {
    if (socket) {
      socket.emit('join', { caseId });
    }
  };

  // Mark message as read
  const markAsRead = (messageId: string) => {
    if (socket) {
      socket.emit('mark_read', { messageId });
    }
  };

  // Initialize conversations on hook load
  useEffect(() => {
    if (token) {
      fetchConversations();
      fetchUnreadCount();
    }
  }, [token]);

  return {
    sendDirectMessage,
    sendCaseMessage,
    joinCase,
    markAsRead,
    fetchConversations,
    fetchConversationMessages,
    fetchCaseMessages,
    fetchUnreadCount,
    directMessages,
    caseMessages,
    conversations,
    unreadCount,
    isConnected: socket?.connected || false
  };
};