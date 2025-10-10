
// Load environment variables FIRST before any other requires
const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const passport = require('passport');
const session = require('express-session');
const apiRoutes = require('./routes/index');
const http = require('http');
const socketio = require('socket.io');
const jwt = require('jsonwebtoken');
const Message = require('./models/Message');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const chromaService = require('./utils/chroma');
const notificationService = require('./utils/notificationService');
const { initializeLawyerVectors } = require('./utils/vectorSync');

// Import models to ensure they're registered
const Payment = require('./models/Payment');
const Invoice = require('./models/Invoice');
const TimeTracking = require('./models/TimeTracking');

// Import OAuth controller to initialize passport strategies (after env vars are loaded)
require('./controllers/oauthController');

const app = express();

// Middleware - order matters!
app.use(helmet());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));
app.use(cors());

// Session configuration for passport
app.use(session({
  secret: process.env.JWT_SECRET || 'fallback-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // Set to true in production with HTTPS
}));

// Initialize passport
app.use(passport.initialize());
app.use(passport.session());

// Special handling for Stripe webhooks - must come before express.json()
app.use('/api/webhook/stripe', express.raw({ type: 'application/json' }));

app.use(express.json());
app.use('/api', apiRoutes);

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  
})
  .then(() => {
    console.log('✅ Connected to MongoDB successfully');
    // Initialize notification service after database connection
    notificationService.initialize();
  })
  .catch((err) => console.error('MongoDB connection error:', err));

// Initialize ChromaDB connection
chromaService.connect()
  .then(() => {
    console.log('✅ ChromaDB connection initialized');
    // Initialize lawyer vectors after ChromaDB connection with Hugging Face embeddings
    setTimeout(() => {
      console.log('🔄 Starting lawyer vector initialization...');
      initializeLawyerVectors();
    }, 3000); // Increased timeout to allow model loading
  })
  .catch((err) => console.error('ChromaDB connection error:', err));

// Health check route
app.get('/', (req, res) => {
  res.send('Judicature Backend API is running');
});

const server = http.createServer(app);
const io = socketio(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('Authentication error'));
  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = user;
    next();
  } catch (err) {
    next(new Error('Authentication error'));
  }
});

io.on('connection', (socket) => {
  
  // Join user's personal room for direct messages
  socket.join(`user_${socket.user.id}`);
  
  // Join case-based rooms (existing functionality)
  socket.on('join', ({ caseId }) => {
    socket.join(`case_${caseId}`);
  });

  // Handle DIRECT one-to-one messages
  socket.on('direct_message', async ({ receiverId, message }) => {
    try {
      // Save direct message to database
      const msg = new Message({
        sender: socket.user.id,
        receiver: receiverId,
        messageType: 'direct',
        message,
      });
      await msg.save();

      // Send to specific receiver only
      io.to(`user_${receiverId}`).emit('direct_message', {
        _id: msg._id,
        sender: msg.sender,
        receiver: msg.receiver,
        message: msg.message,
        messageType: 'direct',
        createdAt: msg.createdAt,
      });

      // Send confirmation back to sender
      socket.emit('message_sent', {
        _id: msg._id,
        receiver: receiverId,
        message: msg.message,
        messageType: 'direct',
        createdAt: msg.createdAt,
      });

    } catch (error) {
      console.error('Direct message error:', error);
      socket.emit('message_error', { error: 'Failed to send direct message' });
    }
  });

  // Handle CASE-BASED group messages (enhanced existing functionality)
  socket.on('message', async ({ caseId, receiver, message }) => {
    try {
      const msg = new Message({
        sender: socket.user.id,
        receiver,
        caseId,
        messageType: 'case',
        message,
      });
      await msg.save();

      // Broadcast to all users in the case
      io.to(`case_${caseId}`).emit('message', {
        _id: msg._id,
        sender: msg.sender,
        receiver: msg.receiver,
        caseId: msg.caseId,
        message: msg.message,
        messageType: 'case',
        createdAt: msg.createdAt,
      });

    } catch (error) {
      console.error('Case message error:', error);
      socket.emit('message_error', { error: 'Failed to send case message' });
    }
  });

  // Mark messages as read
  socket.on('mark_read', async ({ messageId }) => {
    try {
      await Message.findByIdAndUpdate(messageId, {
        isRead: true,
        readAt: new Date()
      });
      socket.emit('message_read', { messageId });
    } catch (error) {
      console.error('Mark read error:', error);
    }
  });

  // Handle user disconnect
  socket.on('disconnect', () => {
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
}); 