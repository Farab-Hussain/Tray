import dotenv from "dotenv";

dotenv.config();

// Firebase Service Account Configuration - Main Project (tray-ed2f7)
// All values are read from .env file for security
// Using unique names to support multiple Firebase projects
export const firebaseConfig = {
  type: process.env.FIREBASE_MAIN_TYPE || "service_account",
  project_id: process.env.FIREBASE_MAIN_PROJECT_ID || "",
  private_key_id: process.env.FIREBASE_MAIN_PRIVATE_KEY_ID || "",
  // Handle private key with newlines - supports both \n and actual newlines
  private_key: process.env.FIREBASE_MAIN_PRIVATE_KEY
    ? process.env.FIREBASE_MAIN_PRIVATE_KEY.replace(/\\n/g, "\n")
    : "",
  client_email: process.env.FIREBASE_MAIN_CLIENT_EMAIL || "",
  client_id: process.env.FIREBASE_MAIN_CLIENT_ID || "",
  auth_uri: process.env.FIREBASE_MAIN_AUTH_URI || "https://accounts.google.com/o/oauth2/auth",
  token_uri: process.env.FIREBASE_MAIN_TOKEN_URI || "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: process.env.FIREBASE_MAIN_AUTH_PROVIDER_X509_CERT_URL || "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: process.env.FIREBASE_MAIN_CLIENT_X509_CERT_URL || "",
  universe_domain: process.env.FIREBASE_MAIN_UNIVERSE_DOMAIN || "googleapis.com",
};

// Validate required Firebase credentials
export const validateFirebaseConfig = (): void => {
  const required = [
    "FIREBASE_MAIN_PROJECT_ID",
    "FIREBASE_MAIN_PRIVATE_KEY",
    "FIREBASE_MAIN_CLIENT_EMAIL",
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required Firebase environment variables: ${missing.join(", ")}. Please check your .env file.`
    );
  }
};

