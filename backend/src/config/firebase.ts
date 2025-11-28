import admin from "firebase-admin";
import { firebaseConfig, validateFirebaseConfig } from "./config";

// Validate Firebase configuration from environment variables
validateFirebaseConfig();

// Debug: Log what's being loaded (without exposing secrets)
console.log("🔍 [Firebase Config] Loading credentials from .env:");
console.log(`  - Project ID: ${process.env.FIREBASE_MAIN_PROJECT_ID ? '✅ Set' : '❌ Missing'}`);
console.log(`  - Client Email: ${process.env.FIREBASE_MAIN_CLIENT_EMAIL ? '✅ Set' : '❌ Missing'}`);
console.log(`  - Private Key: ${process.env.FIREBASE_MAIN_PRIVATE_KEY ? '✅ Set (' + process.env.FIREBASE_MAIN_PRIVATE_KEY.length + ' chars)' : '❌ Missing'}`);

// Create service account object from config
const serviceAccount = {
  type: firebaseConfig.type,
  project_id: firebaseConfig.project_id,
  private_key_id: firebaseConfig.private_key_id,
  private_key: firebaseConfig.private_key,
  client_email: firebaseConfig.client_email,
  client_id: firebaseConfig.client_id,
  auth_uri: firebaseConfig.auth_uri,
  token_uri: firebaseConfig.token_uri,
  auth_provider_x509_cert_url: firebaseConfig.auth_provider_x509_cert_url,
  client_x509_cert_url: firebaseConfig.client_x509_cert_url,
  universe_domain: firebaseConfig.universe_domain,
} as admin.ServiceAccount;

// Initialize Firebase Admin SDK with credentials from .env
// ROOT CAUSE FIX: Check if already initialized to prevent collisions
if (!admin.apps.length) {
  try {
    // Validate credentials are loaded from .env
    if (!firebaseConfig.project_id || !firebaseConfig.private_key || !firebaseConfig.client_email) {
      throw new Error('Firebase credentials from .env are missing or incomplete. Please check your .env file has FIREBASE_MAIN_* variables set.');
    }
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log("✅ Firebase Admin SDK initialized with credentials from .env");
    console.log(`✅ Project: ${serviceAccount.projectId || (serviceAccount as any).project_id}`);
    console.log(`✅ Service Account: ${(serviceAccount as any).client_email}`);
    
    // ROOT CAUSE FIX: Immediately test credentials to catch invalid keys early
    // This prevents silent failures
    const testDb = admin.firestore();
    testDb.collection('_credential_test').limit(1).get()
      .then(() => {
        console.log("✅ [ROOT CAUSE] Firebase credentials are VALID and working");
      })
      .catch((error: any) => {
        if (error?.code === 16 || error?.message?.includes('UNAUTHENTICATED')) {
          console.error("❌ [ROOT CAUSE] Firebase credentials from .env are INVALID!");
          console.error("❌ [ROOT CAUSE] The service account key in your .env file is expired, disabled, or invalid.");
          console.error("❌ [ROOT CAUSE] SOLUTION:");
          console.error("   1. Go to: https://console.firebase.google.com/project/tray-ed2f7/settings/serviceaccounts/adminsdk");
          console.error("   2. Click 'Generate New Private Key'");
          console.error("   3. Download the JSON file");
          console.error("   4. Update your .env file with the new FIREBASE_MAIN_* values");
          console.error("   5. Restart your server");
          console.error(`   Error details: ${error?.message}`);
        }
      });
  } catch (error: any) {
    console.error("❌ Failed to initialize Firebase Admin SDK:", error?.message || error);
    throw error;
  }
}

// Initialize Firestore with optimized settings
const db = admin.firestore();

// OPTIMIZATION: Configure Firestore settings for better performance
// These settings help with connection pooling and reduce latency
// ROOT CAUSE FIX: Only call settings() once (handles hot reload in development)
try {
  db.settings({
    // Use persistent connection (default, but explicit for clarity)
    ignoreUndefinedProperties: true, // Ignore undefined properties to avoid errors
    // Enable offline persistence for better performance (caching)
    // Note: Admin SDK doesn't support offline persistence, but we handle caching in our code
  });
} catch (error: any) {
  // Settings already applied (common during hot reload in development)
  // This is safe to ignore
  if (!error?.message?.includes('already been initialized')) {
    console.warn('⚠️ Firestore settings warning:', error?.message);
  }
}

// Validate Firebase credentials work (async check)
if (process.env.NODE_ENV !== 'test') {
  setImmediate(async () => {
    try {
      // Test that credentials actually work by making a lightweight API call
      await db.collection('_health_check').limit(1).get();
      console.log('✅ [Firebase] Credentials validated successfully');
    } catch (error: any) {
      // If this is an authentication error, it means credentials are invalid
      if (error?.code === 16 || error?.message?.includes('UNAUTHENTICATED') || error?.message?.includes('authentication')) {
        console.error('❌ [Firebase] Authentication error:', error?.message || 'Unknown authentication error');
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
