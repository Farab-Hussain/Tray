import admin from "firebase-admin";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

// Initialize Firebase Admin SDK using service account key file
// Priority: 1. SERVICE_ACCOUNT_PATH env var, 2. Default path, 3. Fallback to default Firebase initialization
const serviceAccountPath = process.env.SERVICE_ACCOUNT_PATH 
  ? process.env.SERVICE_ACCOUNT_PATH 
  : path.join(__dirname, "tray-ed2f7-firebase-adminsdk-fbsvc-72f6bb8684.json");

console.log("🔑 Loading Firebase service account from:", serviceAccountPath);

if (!admin.apps.length) {
  try {
    // Try to load service account file if path is provided, otherwise use default credentials
    if (process.env.SERVICE_ACCOUNT_PATH || fs.existsSync(serviceAccountPath)) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccountPath),
      });
      console.log("✅ Firebase Admin SDK initialized successfully with service account");
    } else {
      // Use default credentials (for Google Cloud environments or environment variables)
      admin.initializeApp();
      console.log("✅ Firebase Admin SDK initialized successfully with default credentials");
    }
  } catch (error) {
    console.error("❌ Failed to initialize Firebase Admin SDK:", error);
    // Fallback to default initialization
    try {
      admin.initializeApp();
      console.log("✅ Firebase Admin SDK initialized with default credentials (fallback)");
    } catch (fallbackError) {
      console.error("❌ Failed to initialize Firebase Admin SDK (fallback):", fallbackError);
      throw fallbackError;
    }
  }
}

// Initialize Firestore with optimized settings
const db = admin.firestore();

// OPTIMIZATION: Configure Firestore settings for better performance
// These settings help with connection pooling and reduce latency
db.settings({
  // Use persistent connection (default, but explicit for clarity)
  ignoreUndefinedProperties: true, // Ignore undefined properties to avoid errors
  // Enable offline persistence for better performance (caching)
  // Note: Admin SDK doesn't support offline persistence, but we handle caching in our code
});

// OPTIMIZATION: Pre-warm Firestore connection by making a lightweight test query
// This reduces cold start latency for the first real query
if (process.env.NODE_ENV !== 'test') {
  // Run async without blocking server startup
  setImmediate(async () => {
    try {
      // Make a lightweight query to establish connection
      await db.collection('_test').doc('connection').get();
      console.log('✅ [Firestore] Connection pre-warmed');
    } catch (error) {
      // Ignore errors - this is just for optimization
      console.log('ℹ️ [Firestore] Pre-warm skipped (expected if _test collection doesn\'t exist)');
    }
  });
}

// Initialize Auth and Storage
const auth = admin.auth();
const storage = admin.storage();

export { admin, db, auth, storage };
