import admin from "firebase-admin";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

// Initialize Firebase Admin SDK
// Priority: 
// 1. SERVICE_ACCOUNT_JSON (environment variable with JSON string) - for Vercel/production
// 2. SERVICE_ACCOUNT_PATH (file path) - for local development
// 3. Default path - fallback for local
// 4. Default credentials - for Google Cloud environments

if (!admin.apps.length) {
  try {
    // Option 1: Use SERVICE_ACCOUNT_JSON environment variable (for Vercel/production)
    if (process.env.SERVICE_ACCOUNT_JSON) {
      try {
        const serviceAccount = JSON.parse(process.env.SERVICE_ACCOUNT_JSON);
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
        console.log("✅ Firebase Admin SDK initialized with SERVICE_ACCOUNT_JSON");
      } catch (parseError) {
        console.error("❌ Failed to parse SERVICE_ACCOUNT_JSON:", parseError);
        throw parseError;
      }
    }
    // Option 2: Use SERVICE_ACCOUNT_PATH or default file path (for local development)
    else {
      const serviceAccountPath = process.env.SERVICE_ACCOUNT_PATH 
        ? process.env.SERVICE_ACCOUNT_PATH 
        : path.join(__dirname, "tray-ed2f7-firebase-adminsdk-fbsvc-72f6bb8684.json");

      console.log("🔑 Checking for Firebase service account file at:", serviceAccountPath);

      if (fs.existsSync(serviceAccountPath)) {
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccountPath),
        });
        console.log("✅ Firebase Admin SDK initialized with service account file");
      } else {
        // Option 3: Use default credentials (for Google Cloud environments)
        admin.initializeApp();
        console.log("✅ Firebase Admin SDK initialized with default credentials");
      }
    }
  } catch (error: any) {
    console.error("❌ Failed to initialize Firebase Admin SDK:", error?.message || error);
    // Final fallback to default initialization
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
