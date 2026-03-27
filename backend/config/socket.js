import { Server } from 'socket.io';

let io = null;

export const initializeSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Join user room for targeted notifications
    socket.on('join', (userId) => {
      socket.join(userId);
      console.log(`User ${userId} joined room`);
    });

    // Join admin room for admin notifications
    socket.on('join-admin', () => {
      socket.join('admin');
      console.log('Admin joined admin room');
    });

    // Join truck tracking room
    socket.on('join-trucking', () => {
      socket.join('trucking');
      console.log('Client joined trucking room');
    });

    // Leave rooms on disconnect
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  return io;
};

// Get IO instance
export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

// Emit notification to specific user
export const emitToUser = (userId, event, data) => {
  if (io) {
    io.to(userId.toString()).emit(event, data);
  }
};

// Emit notification to all admins
export const emitToAdmins = (event, data) => {
  if (io) {
    io.to('admin').emit(event, data);
  }
};

// Emit truck location update
export const emitTruckLocation = (data) => {
  if (io) {
    io.to('trucking').emit('truck-location-update', data);
    io.to('admin').emit('truck-location-update', data);
  }
};

export default io;
