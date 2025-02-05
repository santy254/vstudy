const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
require('dotenv').config();

const setupChatSockets = require('./sockets/chatsocket');
const setupVideoChatSockets = require('./sockets/Videochatsocket');
// Import route files
const authRoutes = require('./routes/auth');
const groupRoutes = require('./routes/group');
const taskRoutes = require('./routes/task');
const messageRoutes = require('./routes/message');
const videosessionRoutes = require('./routes/videosession');
const settingsRoutes = require('./routes/settings');


const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "https://virtualstudygroup.netlify.app",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  },
});


// Middleware
app.use(express.json());
app.use(
  cors({
    origin: ["https://virtualstudygroup.netlify.app"], // Allow frontend domain
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,  // Allow cookies & authentication headers
  })
);

app.use(express.urlencoded({ extended: true }));
app.set('io', io);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Define Routes
app.use('/api/auth', authRoutes);
app.use('/api/group', groupRoutes);
app.use('/api/task', taskRoutes);
app.use('/api/message', messageRoutes);
app.use('/api/videosession', videosessionRoutes);
app.use('/api/settings', settingsRoutes);


// Root route for testing
app.get('/', (req, res) => {
  res.send('Welcome to the Virtual Study Group API!');
});

setupChatSockets(io);
setupVideoChatSockets(io);

// Connect to MongoDB Atlas using Mongoose
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected successfully!'))
.catch((err) => console.error('MongoDB connection error:', err));

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

 
 
  



  // New Notification Event
  socket.on('newNotification', (notification) => {
    io.emit('newNotification', notification);
    console.log('New notification:', notification);
  });

  // Disconnect Event
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('Global error handler:', err.message);
  res.status(500).json({ message: 'Server Error', error: err.message });
});

// Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
