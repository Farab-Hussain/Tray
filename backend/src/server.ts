import dotenv from "dotenv";
import app from "./app";
import { db, auth } from "./config/firebase";

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
  
  console.log("✨ Server startup completed!");
});
