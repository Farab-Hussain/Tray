import dotenv from "dotenv";
import app from "./app";
import { db, auth } from "./config/firebase";
import { sendAppointmentReminders } from "./services/reminder.service";
import { processAutomatedPayouts } from "./services/payout.service";

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

const PORT = process.env.PORT || 4000;


app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Local URL (ngrok): ${process.env.BASE_URL}`);
  console.log(`🌍 Public URL (ngrok): ${process.env.BASE_URL}`);
  console.log(`❤️  Health check: ${process.env.BASE_URL}/health`);
  
  // Run Firebase verification after server starts
  await verifyFirebaseConnection();
  
  // Setup scheduled reminder job (runs every hour)
  setupReminderScheduler();
  
  // Setup scheduled payout job (runs daily at 2 AM)
  setupPayoutScheduler();
  
  console.log("✨ Server startup completed!");
});

/**
 * Setup scheduled job to send appointment reminders
 * Runs every hour to check for bookings 24 hours away
 */
function setupReminderScheduler() {
  console.log("⏰ Setting up appointment reminder scheduler...");
  
  // Run immediately on startup (for testing)
  // In production, you might want to skip this
  // sendAppointmentReminders().catch(err => {
  //   console.error("❌ Error running initial reminder check:", err);
  // });
  
  // Schedule to run every hour
  setInterval(async () => {
    try {
      console.log("⏰ Running scheduled reminder check...");
      await sendAppointmentReminders();
    } catch (error) {
      console.error("❌ Error in scheduled reminder check:", error);
    }
  }, 60 * 60 * 1000); // 1 hour in milliseconds
  
  console.log("✅ Reminder scheduler set up (runs every hour)");
}

/**
 * Setup scheduled job to process automated payouts
 * Runs daily at 2 AM
 */
function setupPayoutScheduler() {
  console.log("💰 Setting up automated payout scheduler...");
  
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
  setTimeout(() => {
    // Run payout processing
    processAutomatedPayouts().catch(err => {
      console.error("❌ Error running payout processing:", err);
    });
    
    // Then schedule to run daily
    setInterval(async () => {
      try {
        console.log("💰 Running scheduled payout processing...");
        await processAutomatedPayouts();
      } catch (error) {
        console.error("❌ Error in scheduled payout processing:", error);
      }
    }, 24 * 60 * 60 * 1000); // 24 hours
  }, msUntil2AM);
  
  console.log(`✅ Payout scheduler set up (runs daily at 2 AM, first run in ${Math.round(msUntil2AM / 1000 / 60)} minutes)`);
}
