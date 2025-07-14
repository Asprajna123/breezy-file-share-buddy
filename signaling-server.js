const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const rooms = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    
    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Set());
    }
    
    const room = rooms.get(roomId);
    const existingUsers = Array.from(room);
    
    socket.emit('all-users', existingUsers);
    socket.to(roomId).emit('user-joined', socket.id);
    room.add(socket.id);
    
    console.log(`User ${socket.id} joined room ${roomId}. Room size: ${room.size}`);
  });

  socket.on('offer', ({ offer, targetSocketId }) => {
    socket.to(targetSocketId).emit('offer', {
      offer,
      senderSocketId: socket.id
    });
  });

  socket.on('answer', ({ answer, targetSocketId }) => {
    socket.to(targetSocketId).emit('answer', {
      answer,
      senderSocketId: socket.id
    });
  });

  socket.on('ice-candidate', ({ candidate, targetSocketId }) => {
    socket.to(targetSocketId).emit('ice-candidate', {
      candidate,
      senderSocketId: socket.id
    });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    rooms.forEach((room, roomId) => {
      if (room.has(socket.id)) {
        room.delete(socket.id);
        socket.to(roomId).emit('user-disconnected', socket.id);
        
        if (room.size === 0) {
          rooms.delete(roomId);
        }
      }
    });
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Signaling server running on port ${PORT}`);
});
