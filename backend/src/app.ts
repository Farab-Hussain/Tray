import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { db, auth } from "./config/firebase";
import authRouter from "./routes/auth.routes";
import { requestLogger } from "./utils/logger";
import consultantRoutes from "./routes/consultant.routes";
import bookingRoutes from "./routes/booking.routes";
import reviewRoutes from "./routes/review.routes";
import consultantFlowRoutes from "./routes/consultantFlow.routes";
import paymentRoutes from './routes/payment.routes';
import uploadRoutes from './routes/upload.routes';
import fcmRoutes from './routes/fcm.routes';
import notificationRoutes from './routes/notification.routes';
import reminderRoutes from './routes/reminder.routes';
import analyticsRoutes from './routes/analytics.routes';
import registerSupportRoutes from './routes/support.routes';

dotenv.config();

const app = express();

// Middleware
app.use(
  cors({
    origin: true, // Allow all origins in development
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'ngrok-skip-browser-warning',
      'Cache-Control',
      'Pragma'
    ]
  })
);
app.use(express.json());
app.use(requestLogger); // Auto-log all requests

// Routes
app.get("/", (req, res) => {
  res.send("🚀 Backend running with Firebase");
});

// Health check endpoint with detailed monitoring
app.get("/health", async (req, res) => {
  const startTime = Date.now();
  const healthCheck: {
    status: string;
    timestamp: string;
    uptime: number;
    environment: string;
    services: {
      firebase: { status: string; responseTime?: number; error?: string };
    };
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
  } = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
    services: {
      firebase: { status: "unknown" },
    },
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      percentage: Math.round(
        (process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100
      ),
    },
  };

  // Check Firebase connection
  try {
    const firebaseStart = Date.now();
    await db.collection('_test').doc('health').get();
    const firebaseResponseTime = Date.now() - firebaseStart;
    healthCheck.services.firebase = {
      status: "connected",
      responseTime: firebaseResponseTime,
    };
  } catch (error) {
    healthCheck.status = "unhealthy";
    healthCheck.services.firebase = {
      status: "disconnected",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }

  const responseTime = Date.now() - startTime;
  const statusCode = healthCheck.status === "healthy" ? 200 : 503;

  res.status(statusCode).json({
    ...healthCheck,
    responseTime,
  });
});

// Auth routes
app.use("/auth", authRouter);
app.use("/consultants", consultantRoutes);
app.use("/bookings", bookingRoutes);
app.use("/reviews", reviewRoutes);
app.use("/consultant-flow", consultantFlowRoutes);
app.use("/payment", paymentRoutes);
app.use("/upload", uploadRoutes);
app.use("/fcm", fcmRoutes);
app.use("/notifications", notificationRoutes);
app.use("/reminders", reminderRoutes);
app.use("/analytics", analyticsRoutes);
registerSupportRoutes(app);

// Global error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('❌ Unhandled error:', err);

  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred',
  });
});

export default app;
