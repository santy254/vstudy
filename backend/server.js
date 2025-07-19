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
const notificationRoutes = require('./routes/notification');
const dashboardRoutes = require('./routes/dashboard');

const CourseRoutes = require('./routes/CourseRoutes'); // adjust path as needed
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "http://192.168.1.104:3000", // Your local network IP
      /^http:\/\/192\.168\.1\.\d+:3000$/, // Allow any IP in your subnet
      /^http:\/\/10\.\d+\.\d+\.\d+:3000$/, // Allow 10.x.x.x subnet
      /^http:\/\/172\.16\.\d+\.\d+:3000$/ // Allow 172.16.x.x subnet
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  },
});


// Middleware
app.use(express.json());
const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:3000",
  "http://192.168.1.104:3000", // Your local network IP
  /^http:\/\/192\.168\.1\.\d+:3000$/, // Allow any IP in your subnet
  /^http:\/\/10\.\d+\.\d+\.\d+:3000$/, // Allow 10.x.x.x subnet
  /^http:\/\/172\.16\.\d+\.\d+:3000$/ // Allow 172.16.x.x subnet
];
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

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
app.use('/api/notifications', notificationRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.use('/api/courses', CourseRoutes);
// Root route for testing
app.get('/', (req, res) => {
  res.send('Welcome to the Virtual Study Group API!');
});

setupChatSockets(io);
setupVideoChatSockets(io);

// Connect to MongoDB Atlas using Mongoose
mongoose.connect(process.env.MONGO_URI)
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
const PORT = process.env.PORT || 5002;
const HOST = process.env.HOST || '0.0.0.0'; // Listen on all interfaces

server.listen(PORT, HOST, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`📱 Mobile access: http://192.168.1.104:${PORT}`); // Your actual IP address
  console.log(`🌐 Network access: http://${HOST}:${PORT}`);
});
