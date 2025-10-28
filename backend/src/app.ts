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

// Health check endpoint
app.get("/health", async (req, res) => {
  try {
    await db.collection('_test').doc('health').get();
    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      firebase: "connected"
    });
  } catch (error) {
    res.status(500).json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
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



export default app;
