import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import { Server } from 'socket.io';

import { connectDB } from './config/db.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { apiLimiter, authLimiter, reportLimiter } from './middleware/rateLimiter.js';
import { sanitizeBody, sanitizeQuery } from './middleware/xssSanitizer.js';
import { leaderboardCache, rewardsCache, badgesCache } from './middleware/cache.js';
import healthRouter from './routes/healthRoutes.js';
import authRouter from './routes/authRoutes.js';
import rewardRouter from './routes/rewardRoutes.js';
import wasteReportRouter from './routes/wasteReportRoutes.js';
import aiRouter from './routes/aiRoutes.js';
import routeRouter from './routes/routeRoutes.js';
import analyticsRouter from './routes/analyticsRoutes.js';
import challengeRouter from './routes/challengeRoutes.js';
import badgeRouter from './routes/badgeRoutes.js';
import truckRouter from './routes/truckRoutes.js';
import notificationRouter from './routes/notificationRoutes.js';
import { initializeBadges } from './controllers/badgeController.js';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger.js';

const app = express();
const server = http.createServer(app);

// Socket.io setup
export const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Store user socket mappings
const userSockets = new Map();

// Socket.io connection handling
io.on('connection', (socket) => {
  // eslint-disable-next-line no-console
  console.log('Client connected:', socket.id);

  // Join user-specific room
  socket.on('join', (userId) => {
    if (userId) {
      userSockets.set(userId, socket.id);
      socket.join(userId);
      // eslint-disable-next-line no-console
      console.log(`User ${userId} joined room`);
    }
  });

  socket.on('disconnect', () => {
    // Remove user from mapping
    for (const [userId, socketId] of userSockets.entries()) {
      if (socketId === socket.id) {
        userSockets.delete(userId);
        break;
      }
    }
    // eslint-disable-next-line no-console
    console.log('Client disconnected:', socket.id);
  });
});

// Export helper to send notifications
export const sendNotification = (userId, notification) => {
  io.to(userId).emit('notification', notification);
};

// Export helper to broadcast to all connected clients (for admin alerts)
export const broadcastToAdmins = (notification) => {
  io.emit('admin_alert', notification);
};

// Apply security middleware
app.use(sanitizeBody);
app.use(sanitizeQuery);
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.cloudinary.com"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
// CORS configuration - must be before other middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));
app.use(apiLimiter);

// Apply rate limiting
app.use('/api/auth', authLimiter);
app.use('/api/reports', reportLimiter);

// Apply caching to specific routes
app.use('/api/rewards/leaderboard', leaderboardCache);
app.use('/api/rewards', rewardsCache);
app.use('/api/badges', badgesCache);

// Routes
app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/rewards', rewardRouter);
app.use('/api/reports', wasteReportRouter);
app.use('/api/ai', aiRouter);
app.use('/api/routes', routeRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/challenges', challengeRouter);
app.use('/api/badges', badgeRouter);
app.use('/api/trucks', truckRouter);
app.use('/api/notifications', notificationRouter);
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// 404 and error handlers
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const start = async () => {
  try {
    await connectDB(process.env.MONGO_URI);

    // Initialize default badges
    await initializeBadges();

    server.listen(PORT, () => {
      // eslint-disable-next-line no-console
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Failed to start server', err);
    process.exit(1);
  }
};

start();

export default app;

