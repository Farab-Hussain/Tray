import express from "express";
import { firebaseConfig } from "./config/config";
import cors from "cors";
import dotenv from "dotenv";
import { db, auth, firebaseApp } from "./config/firebase";
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
import newsletterRoutes from "./routes/newsletter.routes";
import broadcastRoutes from "./routes/broadcast.routes";
import webrtcRoutes from "./routes/webrtc.routes";
import settingsRoutes from "./routes/settings.routes";
import publicProfileRoutes from "./routes/publicProfile.routes";
import { getWebAppUrl } from "./utils/webAppUrl";

dotenv.config();

const app = express();

// CORS Configuration for different environments
const getAllowedOrigins = () => {
  const nodeEnv = process.env.NODE_ENV || 'development';
  
  if (nodeEnv === 'production') {
    // Production: Allow specific domains
    return [
      'https://tray-ecru.vercel.app', // Your Vercel frontend
      'https://www.tray-ecru.vercel.app',
      'https://tray-ai-backend.vercel.app', // FastAPI AI backend
      'https://tray-dashboard-eight.vercel.app', // Web Dashboard
      'https://tray-app.com', // Custom domain
      'https://www.tray-app.com',
      'capacitor://localhost', // Mobile app
      'ionic://localhost'
    ];
  } else if (nodeEnv === 'staging') {
    // Staging: Allow staging domains
    return [
      'https://staging.tray-ecru.vercel.app',
      'http://localhost:3000', // React Native development
      'http://localhost:19006', // React Native Metro bundler
      'exp://192.168.1.100:8081' // Expo development
    ];
  } else {
    // Development: Allow all origins for local development
    return [
      'http://localhost:3000', // Web development
      'http://localhost:19006', // React Native Metro bundler
      'exp://192.168.1.100:8081', // Expo development
      'http://127.0.0.1:19006', // Local React Native
      'http://192.168.1.100:3000', // Local network development
      'ionic://localhost', // Ionic/Capacitor
      'capacitor://localhost' // Capacitor
    ];
  }
};

// Middleware
app.use(
  cors({
    origin: true, // Allow all origins
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'ngrok-skip-browser-warning',
      'Cache-Control',
      'Pragma',
      'X-Requested-With',
      'Origin',
      'Accept'
    ],
    exposedHeaders: [
      'Content-Length',
      'X-Total-Count',
      'X-Page-Count'
    ],
    maxAge: 86400, // 24 hours
    preflightContinue: false
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

// Enhanced request logger to debug CORS and environment issues
app.use((req, res, next) => {
  const origin = req.headers.origin || 'No Origin';
  const host = req.headers.host || 'No Host';
  const method = req.method;
  const path = req.path;
  
  if (process.env.NODE_ENV === 'production') {
    console.log(`🌐 [Request] ${method} ${path} | Origin: ${origin} | Host: ${host}`);
  }
  
  next();
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
      firebase: {
        status: string;
        projectId?: string;
        credentialOk?: boolean;
        hasWebApiKey?: boolean;
        responseTime?: number;
        error?: string;
      };
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
    let credentialOk = false;
    try {
      await auth.createCustomToken("health-probe");
      credentialOk = true;
    } catch {
      credentialOk = false;
    }

    healthCheck.services.firebase = {
      status: "connected",
      projectId: firebaseApp.options.projectId || firebaseConfig.project_id,
      credentialOk,
      hasWebApiKey: Boolean(process.env.FIREBASE_API_KEY?.trim()),
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
app.use("/admin/newsletter", newsletterRoutes);
app.use("/admin/broadcast", broadcastRoutes);
app.use("/webrtc", webrtcRoutes);
app.use("/settings", settingsRoutes);
app.use("/public", publicProfileRoutes);
registerSupportRoutes(app);

/**
 * Email verification links sometimes point at the API host by mistake.
 * Redirect GET /verify-email to the Next.js web app (same query string).
 */
app.get("/verify-email", (req, res) => {
  const webBase = getWebAppUrl();
  const query = req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : "";
  const target = `${webBase}/verify-email${query}`;
  console.log(`↪️ [verify-email] Redirecting to web app: ${target}`);
  return res.redirect(302, target);
});

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
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    route: `${req.method} ${req.path}`
  });
});

export default app;
