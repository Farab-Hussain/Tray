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

const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';

// Diagnostic logging to identify root cause
console.log("🔍 Firebase Initialization Diagnostics:");
console.log(`  - NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
console.log(`  - VERCEL: ${process.env.VERCEL || 'not set'}`);
console.log(`  - isProduction: ${isProduction}`);
console.log(`  - SERVICE_ACCOUNT_JSON: ${process.env.SERVICE_ACCOUNT_JSON ? 'SET (length: ' + process.env.SERVICE_ACCOUNT_JSON.length + ')' : 'NOT SET'}`);
console.log(`  - SERVICE_ACCOUNT_PATH: ${process.env.SERVICE_ACCOUNT_PATH || 'not set'}`);

if (!admin.apps.length) {
  try {
    // Option 1: Use SERVICE_ACCOUNT_JSON environment variable (for Vercel/production)
    if (process.env.SERVICE_ACCOUNT_JSON) {
      try {
        const serviceAccount = JSON.parse(process.env.SERVICE_ACCOUNT_JSON);
        
        // Validate required fields
        if (!serviceAccount.project_id || !serviceAccount.private_key || !serviceAccount.client_email) {
          throw new Error('SERVICE_ACCOUNT_JSON is missing required fields: project_id, private_key, or client_email');
        }
        
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
        console.log("✅ Firebase Admin SDK initialized with SERVICE_ACCOUNT_JSON");
      } catch (parseError: any) {
        console.error("❌ Failed to parse SERVICE_ACCOUNT_JSON:", parseError?.message || parseError);
        if (isProduction) {
          throw new Error(`Firebase initialization failed in production: ${parseError?.message || 'Invalid SERVICE_ACCOUNT_JSON'}`);
        }
        throw parseError;
      }
    }
    // Option 2: Use SERVICE_ACCOUNT_PATH or default file path (for local development)
    else {
      // In production, require SERVICE_ACCOUNT_JSON - this is the root cause fix
      if (isProduction) {
        const errorMsg = 'ROOT CAUSE: SERVICE_ACCOUNT_JSON environment variable is required in production but was not set. ' +
          'This is why Firebase authentication is failing. ' +
          'Please configure SERVICE_ACCOUNT_JSON in your Vercel project settings (Settings → Environment Variables). ' +
          'The value should be the entire JSON content from your Firebase service account file as a single string.';
        console.error("❌", errorMsg);
        throw new Error(errorMsg);
      }
      
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
        console.warn("⚠️ No service account file found, attempting default credentials (only works in Google Cloud environments)");
        admin.initializeApp();
        console.log("✅ Firebase Admin SDK initialized with default credentials");
      }
    }
  } catch (error: any) {
    console.error("❌ Failed to initialize Firebase Admin SDK:", error?.message || error);
    
    // In production, don't fall back to default credentials - fail fast
    if (isProduction) {
      console.error("❌ Production environment requires SERVICE_ACCOUNT_JSON. Please set it in Vercel project settings.");
      throw error;
    }
    
    // Final fallback to default initialization (only for non-production)
    try {
      console.warn("⚠️ Attempting fallback to default credentials...");
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

// ROOT CAUSE FIX: Validate Firebase credentials actually work in production
// This prevents silent failures where initialization succeeds but credentials are invalid
if (isProduction && process.env.NODE_ENV !== 'test') {
  setImmediate(async () => {
    try {
      // Test that credentials actually work by making a lightweight API call
      await db.collection('_health_check').limit(1).get();
      console.log('✅ [Firebase] Credentials validated successfully');
    } catch (error: any) {
      // If this is an authentication error, it means credentials are invalid
      if (error?.code === 16 || error?.message?.includes('UNAUTHENTICATED') || error?.message?.includes('authentication')) {
        const errorMsg = 'ROOT CAUSE IDENTIFIED: Firebase credentials are invalid or missing. ' +
          'SERVICE_ACCOUNT_JSON environment variable must be set correctly in Vercel. ' +
          'Current error: ' + (error?.message || 'Unknown authentication error');
        console.error('❌ [Firebase]', errorMsg);
        // Don't throw here as it's async - the health check will catch it
      } else {
        // Other errors (like collection doesn't exist) are OK
        console.log('ℹ️ [Firebase] Credential validation skipped (non-auth error, expected)');
      }
    }
  });
}

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
