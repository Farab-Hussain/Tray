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

const db = admin.firestore();
const auth = admin.auth();
const storage = admin.storage();

export { admin, db, auth, storage };
