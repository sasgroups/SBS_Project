// index.js - UPDATED WITH ADMIN WEBSOCKET EVENTS
require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const fileUpload = require('express-fileupload');
const path = require('path');
const { Server } = require("socket.io");
const kioskStatus = require("./routes/kioskStatus");
const configRoutes = require('./routes/configRoutes');
const serialPortsRoute = require('./routes/serialPorts');
const adRoutes = require('./routes/ads');
const adminRoutes = require('./routes/admin');
const flightRoutes = require('./routes/flightRoutes');
const baggageRoutes = require("./routes/baggageRoutes");
const kioskRoutes = require("./routes/kioskRoutes");
const pageTimeoutRoutes = require('./routes/pageTimeoutRoutes');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { 
  cors: { 
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Make io accessible to routes
app.set('socketio', io);

app.use(cors());
app.use(express.json());
app.use(fileUpload());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// In-memory data store for kiosk statuses
const kiosks = new Map();

io.on("connection", (socket) => {
  console.log("🟢 Client connected via Socket.IO:", socket.id);
  
  // Handle kiosk joining
  socket.on('kiosk_join', (kioskId) => {
    socket.join(`kiosk_${kioskId}`);
    console.log(`Kiosk ${kioskId} joined room: kiosk_${kioskId}`);
    
    // Store kiosk connection
    kiosks.set(socket.id, {
      kioskId: kioskId,
      connectedAt: new Date(),
      lastSeen: new Date()
    });
    
    socket.emit('joined', { kioskId, timestamp: new Date().toISOString() });
  });
  
  // Handle admin joining
  socket.on('admin_join', () => {
    console.log('Admin connected:', socket.id);
    socket.emit('admin_joined', { 
      message: 'Admin connected successfully',
      timestamp: new Date().toISOString()
    });
  });
  
  // Handle admin notifications
  socket.on('notify_kiosk', (data) => {
    console.log('Admin notifying kiosk:', data);
    io.to(`kiosk_${data.kioskId}`).emit(data.event, data.data);
  });
  
  socket.on('notify_all', (data) => {
    console.log('Admin notifying all kiosks:', data);
    io.emit(data.event, data.data);
  });
  
  socket.on('force_refresh_all', () => {
    console.log('Admin forcing refresh on all kiosks');
    io.emit('admin_trigger_refresh', {
      timestamp: new Date().toISOString(),
      message: 'Admin triggered manual refresh'
    });
  });
  
  // Handle kiosk heartbeat
  socket.on('kiosk_heartbeat', (data) => {
    const kioskInfo = kiosks.get(socket.id);
    if (kioskInfo) {
      kioskInfo.lastSeen = new Date();
      // Broadcast to dashboard
      io.emit("update_dashboard", Object.fromEntries(kiosks));
    }
  });
  
  socket.on("disconnect", () => {
    console.log("🔴 Client disconnected:", socket.id);
    kiosks.delete(socket.id);
    io.emit("update_dashboard", Object.fromEntries(kiosks));
  });
});

// Routes
app.use("/api/kiosks", kioskStatus(kiosks, io));
app.use('/api/ads', adRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/flights', flightRoutes);
app.use('/api', configRoutes);
app.use('/api/serial-ports', serialPortsRoute);
app.use('/api/page-timeouts', pageTimeoutRoutes);
app.use("/api/baggage", baggageRoutes);
app.use('/api/kiosks', kioskRoutes);

// Default route
app.get("/", (req, res) => {
  res.send("✅ Central Server is running.");
});

const PORT = process.env.PORT || 7000;
server.listen(PORT, () => {
  console.log(`🚀 Central Server running on port ${PORT}`);
});