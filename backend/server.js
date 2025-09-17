const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const apiRoutes = require('./routes/index');
const http = require('http');
const socketio = require('socket.io');
const jwt = require('jsonwebtoken');
const Message = require('./models/Message');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use('/api', apiRoutes);
// app.use(helmet());
// app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));





// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

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
  // Join a room (caseId)
  socket.on('join', ({ caseId }) => {
    socket.join(caseId);
  });

  // Handle sending a message
  socket.on('message', async ({ caseId, receiver, message }) => {
    const msg = new Message({
      sender: socket.user.id,
      receiver,
      caseId,
      message,
    });
    await msg.save();
    io.to(caseId).emit('message', {
      _id: msg._id,
      sender: msg.sender,
      receiver: msg.receiver,
      caseId: msg.caseId,
      message: msg.message,
      createdAt: msg.createdAt,
    });
  });
});

const PORT = process.env.PORT || 5000;


server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 