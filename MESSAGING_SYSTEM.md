# Enhanced One-to-One Messaging System

## 🚀 Features Implemented

### ✅ **Backend Enhancements**

1. **Updated Message Model** (`models/Message.js`)
   - Added `messageType` field: `'direct'` or `'case'`
   - Conditional validation for `receiver` (required for direct messages)
   - Conditional validation for `caseId` (required for case messages)
   - Added `isRead` and `readAt` fields for message status
   - Optimized database indexes for performance

2. **Enhanced Socket.IO Implementation** (`server.js`)
   - **Personal Rooms**: Each user joins `user_${userId}` room for direct messages
   - **Case Rooms**: Users join `case_${caseId}` rooms for group discussions
   - **Direct Messaging**: `direct_message` event for one-to-one communication
   - **Case Messaging**: Enhanced existing `message` event with messageType
   - **Message Read Status**: `mark_read` event to track message reads
   - **Error Handling**: Proper error responses for failed messages

3. **New API Routes** (`routes/messages.js`)
   - `GET /api/messages/conversations` - Get all conversation partners
   - `GET /api/messages/conversation/:userId` - Get messages with specific user
   - `GET /api/messages/case/:caseId` - Get case-based messages
   - `POST /api/messages/direct` - Send direct message via REST
   - `GET /api/messages/unread-count` - Get unread message count

### ✅ **Frontend Enhancements**

1. **Enhanced Messaging Hook** (`hooks/use-messaging.ts`)
   - TypeScript support with proper interfaces
   - Separate handling for direct and case messages
   - Conversation management with unread counts
   - Real-time message updates and error handling

2. **Demo Component** (`pages/MessagingDemo.tsx`)
   - Complete messaging interface with conversation list
   - Real-time message display with sender/receiver distinction
   - Forms for starting new conversations and sending case messages
   - Connection status and unread count indicators

## 📋 **How It Works**

### **Direct Messaging Flow:**
```
1. User A wants to message User B
2. Frontend: sendDirectMessage(userB_id, "Hello!")
3. Socket emits: 'direct_message' event
4. Server saves message with messageType: 'direct'
5. Server sends to: io.to(`user_${userB_id}`)
6. Only User B receives the message
7. User A gets confirmation via 'message_sent' event
```

### **Case Messaging Flow:**
```
1. Users join case room: socket.join(`case_${caseId}`)
2. Frontend: sendCaseMessage(caseId, receiverId, "Case update")
3. Socket emits: 'message' event
4. Server saves message with messageType: 'case'
5. Server broadcasts to: io.to(`case_${caseId}`)
6. All case participants receive the message
```

## 🔧 **API Endpoints**

### **WebSocket Events**

| Event | Direction | Data | Description |
|-------|-----------|------|-------------|
| `direct_message` | Client → Server | `{ receiverId, message }` | Send direct message |
| `direct_message` | Server → Client | `{ _id, sender, receiver, message, messageType, createdAt }` | Receive direct message |
| `message` | Client → Server | `{ caseId, receiver, message }` | Send case message |
| `message` | Server → Client | `{ _id, sender, receiver, caseId, message, messageType, createdAt }` | Receive case message |
| `join` | Client → Server | `{ caseId }` | Join case room |
| `mark_read` | Client → Server | `{ messageId }` | Mark message as read |

### **REST Endpoints**

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/messages/conversations` | Get conversation list with unread counts |
| `GET` | `/api/messages/conversation/:userId` | Get message history with specific user |
| `GET` | `/api/messages/case/:caseId` | Get messages for specific case |
| `POST` | `/api/messages/direct` | Send direct message via REST |
| `GET` | `/api/messages/unread-count` | Get total unread message count |

## 🎯 **Usage Examples**

### **Frontend Implementation**

```tsx
import { useMessaging } from '../hooks/use-messaging';
import { useAuth } from '../contexts/AuthContext';

const ChatComponent = () => {
  const { token } = useAuth();
  const { 
    sendDirectMessage, 
    sendCaseMessage, 
    conversations, 
    unreadCount 
  } = useMessaging(token);

  // Send direct message
  const handleDirectMessage = () => {
    sendDirectMessage('user123', 'Hello there!');
  };

  // Send case message
  const handleCaseMessage = () => {
    sendCaseMessage('case456', 'receiver789', 'Case update');
  };

  return (
    <div>
      <p>Unread Messages: {unreadCount}</p>
      {conversations.map(conv => (
        <div key={conv._id}>
          {conv.participant.name} ({conv.unreadCount} unread)
        </div>
      ))}
    </div>
  );
};
```

## 🔐 **Security Features**

- **JWT Authentication**: All socket connections require valid JWT tokens
- **User Validation**: Messages are validated against authenticated user
- **Room Isolation**: Users can only access their personal rooms and joined case rooms
- **Message Ownership**: Users can only send messages as themselves

## 🚀 **Getting Started**

1. **Start the Backend**: `npm start` in `/backend`
2. **Start the Frontend**: `npm run dev` in `/frontend`
3. **Visit**: `http://localhost:3000/messaging` to test the demo
4. **Login Required**: Must be authenticated to use messaging features

## 📱 **Demo Page**

Visit `/messaging` route to see the enhanced messaging system in action:
- View active conversations
- Send direct messages to users
- Send case-based group messages
- Real-time message updates
- Connection status monitoring

## 🔄 **Migration Notes**

- **Existing Messages**: Old messages will still work (defaults to messageType: 'case')
- **Backward Compatibility**: Original `message` event still supported
- **Database**: New fields added with proper defaults and validation
- **Frontend**: New hook is backward compatible with existing usage

## 🎉 **Benefits**

1. **True Privacy**: Direct messages are only seen by sender and receiver
2. **Organized Communication**: Clear separation between private and case discussions  
3. **Real-time Updates**: Instant message delivery and read status
4. **Scalable Architecture**: Efficient room-based message routing
5. **Rich Features**: Conversation history, unread counts, message status