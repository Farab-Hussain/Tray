import dotenv from "dotenv";
import app from "./app";
import { db, auth } from "./config/firebase";
import { sendAppointmentReminders } from "./services/reminder.service";
import { processAutomatedPayouts } from "./services/payout.service";
import { isVoipPushConfigured } from "./services/voipPush.service";
import { createTwilioIceServers } from "./services/webrtc.service";

dotenv.config();

// Verification logging
console.log("🔍 Starting server verification...");

// Environment variables verification
console.log("📋 Environment Variables Check:");
console.log(`  - PORT: ${process.env.PORT || 'Not set'}`);
console.log(`  - NODE_ENV: ${process.env.NODE_ENV || 'development'}`);

// Firebase connection verification
const verifyFirebaseConnection = async () => {
  try {
    console.log("🔥 Verifying Firebase connection...");
    
    // Test Firestore connection
    const testDoc = await db.collection('_test').doc('connection').get();
    console.log("  - Firestore: ✅ Connected");
    
    // Test Auth connection
    await auth.listUsers(1);
    console.log("  - Authentication: ✅ Connected");
    
    console.log("🎉 Firebase verification completed successfully!");
  } catch (error) {
    console.error("❌ Firebase verification failed:", error);
  }
};

const verifyCallingServices = async () => {
  console.log("📞 Verifying calling services...");

  const voipReady = isVoipPushConfigured();
  const apnsProduction = process.env.APNS_PRODUCTION === "true";
  console.log(
    `  - VoIP push (APNS): ${voipReady ? "✅ Configured" : "❌ Not configured — set APNS_KEY_ID, APNS_TEAM_ID, and APNS_AUTH_KEY_PATH or APNS_KEY"}`,
  );
  if (voipReady) {
    console.log(
      `  - APNS environment: ${apnsProduction ? "production" : "sandbox (development)"}`,
    );
    console.log(`  - APNS bundle: ${process.env.APNS_BUNDLE_ID || "app.tray.com"}`);
  }

  const hasTwilioEnv =
    Boolean(process.env.TWILIO_ACCOUNT_SID?.trim()) &&
    Boolean(process.env.TWILIO_AUTH_TOKEN?.trim());

  if (!hasTwilioEnv) {
    console.log(
      "  - Twilio TURN: ❌ Not configured — set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN",
    );
    return;
  }

  try {
    const twilio = await createTwilioIceServers();
    console.log(
      `  - Twilio TURN: ✅ OK (${twilio.iceServers.length} ICE servers, ttl ${twilio.ttl}s)`,
    );
  } catch (error: any) {
    console.log(
      `  - Twilio TURN: ❌ Failed — ${error?.message || "unknown error"}`,
    );
  }
};

const PORT = process.env.PORT || 4000;


app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Local URL (ngrok): ${process.env.BASE_URL}`);
  console.log(`🌍 Public URL (ngrok): ${process.env.BASE_URL}`);
  console.log(`❤️  Health check: ${process.env.BASE_URL}/health`);
  
  // Run Firebase verification after server starts
  await verifyFirebaseConnection();
  await verifyCallingServices();
  
  // Setup scheduled reminder job (runs every hour)
  setupReminderScheduler();
  
  // Setup scheduled payout job (runs daily at 2 AM)
  setupPayoutScheduler();
  
  console.log("✨ Server startup completed!");
});

// Store interval references for cleanup
let reminderInterval: NodeJS.Timeout | null = null;
let payoutInterval: NodeJS.Timeout | null = null;
let payoutTimeout: NodeJS.Timeout | null = null;

/**
 * Setup scheduled job to send appointment reminders
 * Runs every hour to check for bookings 24 hours away
 * Improved with error handling, timeout, and cleanup support
 */
function setupReminderScheduler() {
  console.log("⏰ Setting up appointment reminder scheduler...");
  
  // Clear any existing interval
  if (reminderInterval) {
    clearInterval(reminderInterval);
  }
  
  // Run immediately on startup (for testing)
  // In production, you might want to skip this
  // sendAppointmentReminders().catch(err => {
  //   console.error("❌ Error running initial reminder check:", err);
  // });
  
  // Schedule to run every hour with improved error handling
  reminderInterval = setInterval(async () => {
    const startTime = Date.now();
    try {
      console.log("⏰ Running scheduled reminder check...");
      
      // Add timeout to prevent hanging (30 minutes max)
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Reminder check timeout after 30 minutes')), 30 * 60 * 1000);
      });
      
      await Promise.race([
        sendAppointmentReminders(),
        timeoutPromise
      ]);
      
      const duration = Date.now() - startTime;
      console.log(`✅ Reminder check completed in ${duration}ms`);
    } catch (error: any) {
      const duration = Date.now() - startTime;
      console.error(`❌ Error in scheduled reminder check (after ${duration}ms):`, error?.message || error);
      
      // Don't let errors crash the scheduler - it will retry on next interval
      // In production, consider sending alerts for repeated failures
    }
  }, 60 * 60 * 1000); // 1 hour in milliseconds
  
  console.log("✅ Reminder scheduler set up (runs every hour)");
}

/**
 * Setup scheduled job to process automated payouts
 * Runs daily at 2 AM
 * Improved with error handling, timeout, and cleanup support
 */
function setupPayoutScheduler() {
  console.log("💰 Setting up automated payout scheduler...");
  
  // Clear any existing timeouts/intervals
  if (payoutTimeout) {
    clearTimeout(payoutTimeout);
  }
  if (payoutInterval) {
    clearInterval(payoutInterval);
  }
  
  // Calculate time until next 2 AM
  const now = new Date();
  const next2AM = new Date();
  next2AM.setHours(2, 0, 0, 0);
  
  // If it's already past 2 AM today, schedule for tomorrow
  if (now.getTime() >= next2AM.getTime()) {
    next2AM.setDate(next2AM.getDate() + 1);
  }
  
  const msUntil2AM = next2AM.getTime() - now.getTime();
  
  // Schedule first run
  payoutTimeout = setTimeout(() => {
    const startTime = Date.now();
    
    // Run payout processing with timeout protection
    Promise.race([
      processAutomatedPayouts(),
      new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Payout processing timeout after 2 hours')), 2 * 60 * 60 * 1000);
      })
    ]).then(() => {
      const duration = Date.now() - startTime;
      console.log(`✅ Initial payout processing completed in ${duration}ms`);
    }).catch(err => {
      const duration = Date.now() - startTime;
      console.error(`❌ Error running initial payout processing (after ${duration}ms):`, err?.message || err);
    });
    
    // Then schedule to run daily
    payoutInterval = setInterval(async () => {
      const startTime = Date.now();
      try {
        console.log("💰 Running scheduled payout processing...");
        
        // Add timeout to prevent hanging (2 hours max)
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Payout processing timeout after 2 hours')), 2 * 60 * 60 * 1000);
        });
        
        await Promise.race([
          processAutomatedPayouts(),
          timeoutPromise
        ]);
        
        const duration = Date.now() - startTime;
        console.log(`✅ Payout processing completed in ${duration}ms`);
      } catch (error: any) {
        const duration = Date.now() - startTime;
        console.error(`❌ Error in scheduled payout processing (after ${duration}ms):`, error?.message || error);
        
        // Don't let errors crash the scheduler - it will retry on next interval
        // In production, consider sending alerts for repeated failures
      }
    }, 24 * 60 * 60 * 1000); // 24 hours
  }, msUntil2AM);
  
  console.log(`✅ Payout scheduler set up (runs daily at 2 AM, first run in ${Math.round(msUntil2AM / 1000 / 60)} minutes)`);
}

/**
 * Cleanup function for graceful shutdown
 * Clears all scheduled jobs
 */
export function cleanupSchedulers() {
  console.log("🧹 Cleaning up scheduled jobs...");
  
  if (reminderInterval) {
    clearInterval(reminderInterval);
    reminderInterval = null;
    console.log("✅ Reminder scheduler stopped");
  }
  
  if (payoutInterval) {
    clearInterval(payoutInterval);
    payoutInterval = null;
    console.log("✅ Payout interval scheduler stopped");
  }
  
  if (payoutTimeout) {
    clearTimeout(payoutTimeout);
    payoutTimeout = null;
    console.log("✅ Payout timeout scheduler stopped");
  }
}

// Graceful shutdown handlers
process.on('SIGTERM', () => {
  console.log("🛑 SIGTERM received, shutting down gracefully...");
  cleanupSchedulers();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log("🛑 SIGINT received, shutting down gracefully...");
  cleanupSchedulers();
  process.exit(0);
});
