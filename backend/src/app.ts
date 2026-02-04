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
import activityRoutes from './routes/activity.routes';
import jobRoutes from './routes/job.routes';
import resumeRoutes from './routes/resume.routes';
import studentRoutes from './routes/student.routes';
import authorizationDocumentRoutes from './routes/authorizationDocument.routes';
import consultantContentRoutes from "./routes/consultantContent.routes";
import fileSecurityRoutes from "./routes/fileSecurity.routes";
import companyRoutes from "./routes/company.routes";
import courseRoutes from "./routes/course.routes";

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

// Only parse JSON for non-multipart requests
// Multer will handle multipart/form-data, so we need to skip JSON parsing for those
app.use((req, res, next) => {
  if (req.headers['content-type']?.includes('multipart/form-data')) {
    // Skip JSON parsing for multipart requests - multer will handle it
    next();
  } else {
    // Parse JSON for other requests
    express.json()(req, res, next);
  }
});

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
      email: { status: string; configured?: boolean; error?: string };
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
      email: { status: "unknown" },
    },
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      percentage: Math.round(
        (process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100
      ),
    },
  };
  
  // Check email configuration
  try {
    const SMTP_USER = process.env.SMTP_USER || process.env.SMTP_EMAIL;
    const SMTP_PASSWORD = process.env.SMTP_PASSWORD || process.env.SMTP_PASS;
    const isEmailConfigured = SMTP_USER && SMTP_PASSWORD && SMTP_USER !== "no-reply@tray.com";
    
    if (isEmailConfigured) {
      healthCheck.services.email = {
        status: "configured",
        configured: true,
      };
    } else {
      healthCheck.services.email = {
        status: "not_configured",
        configured: false,
        error: "SMTP credentials not set. Please configure SMTP_USER/SMTP_EMAIL and SMTP_PASSWORD in environment variables.",
      };
      healthCheck.status = "unhealthy";
    }
  } catch (emailError: any) {
    healthCheck.services.email = {
      status: "error",
      configured: false,
      error: emailError.message || "Unknown error",
    };
  }

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
app.use("/student", studentRoutes); 
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
app.use("/admin/activities", activityRoutes);
app.use("/jobs", jobRoutes);
app.use("/resumes", resumeRoutes);
app.use("/authorization-documents", authorizationDocumentRoutes);
app.use("/consultant-content", consultantContentRoutes);
app.use("/files", fileSecurityRoutes);
app.use("/companies", companyRoutes);
app.use("/courses", courseRoutes);
registerSupportRoutes(app);

// 404 handler for unmatched routes
app.use((req: express.Request, res: express.Response) => {
  console.log(`❌ [404] Route not found: ${req.method} ${req.path}`);
  res.status(404).json({
    error: 'Route not found',
    path: req.path,
    method: req.method
  });
});

// Global error handler (must be last)
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('❌ [Global Error Handler] Unhandled error:', err);
  console.error('❌ [Global Error Handler] Route:', `${req.method} ${req.path}`);
  console.error('❌ [Global Error Handler] Stack:', err.stack);

  // Don't send response if headers already sent
  if (res.headersSent) {
    return next(err);
  }

  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred',
  });
});

export default app;
