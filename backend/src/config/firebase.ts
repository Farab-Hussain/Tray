import * as admin from "firebase-admin";
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

let firebaseApp: admin.app.App;

// Initialize Firebase Admin SDK with credentials from .env
if (!admin.apps.length) {
  try {
    // Validate credentials are loaded from .env
    if (!firebaseConfig.project_id || !firebaseConfig.private_key || !firebaseConfig.client_email) {
      throw new Error('Firebase credentials from .env are missing or incomplete. Please check your .env file has FIREBASE_MAIN_* variables set.');
    }
    
    // Validate private key format
    if (firebaseConfig.private_key && !firebaseConfig.private_key.includes('BEGIN PRIVATE KEY')) {
      console.error("❌ [Firebase] Private key format appears invalid (missing BEGIN PRIVATE KEY header)");
    }
    
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: firebaseConfig.project_id,
    });
    console.log("✅ Firebase Admin SDK initialized successfully");
    console.log(`✅ Project ID: ${firebaseConfig.project_id}`);
    
    // Test Messaging (dry run) - this validates credentials
    firebaseApp.messaging().send({
      token: 'test-token-to-validate-credentials',
      data: { test: 'true' }
    }, true)
      .then(() => {
        console.log("✅ [Auth Test] Messaging access: OK");
      })
      .catch((error: any) => {
        if (error.code === 'messaging/invalid-registration-token' || error.code === 'messaging/registration-token-not-registered') {
          console.log("✅ [Auth Test] Messaging access: OK (Credentials verified)");
        } else {
          console.error("❌ [Auth Test] Messaging failed with AUTH ERROR:", error.message);
          console.error("❌ [Auth Test] Error Code:", error.code);
        }
      });
  } catch (error: any) {
    console.error("❌ Failed to initialize Firebase Admin SDK:", error?.message || error);
    throw error;
  }
} else {
  firebaseApp = admin.app();
}

// Initialize sub-services using the explicit app instance
const db = firebaseApp.firestore();
const auth = firebaseApp.auth();
const storage = firebaseApp.storage();

// Configure Firestore settings
try {
  db.settings({
    ignoreUndefinedProperties: true,
  });
} catch (error: any) {
  if (!error?.message?.includes('already been initialized')) {
    console.warn('⚠️ Firestore settings warning:', error?.message);
  }
}

export { admin, db, auth, storage, firebaseApp };
