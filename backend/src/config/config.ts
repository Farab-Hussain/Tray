import dotenv from "dotenv";

dotenv.config();

// Firebase Service Account Configuration
// All values are read from .env file for security
export const firebaseConfig = {
  type: process.env.FIREBASE_TYPE ,
  project_id: process.env.FIREBASE_PROJECT_ID ,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID ,
  // Handle private key with newlines - supports both \n and actual newlines
  private_key: process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
    : undefined,
  client_email: process.env.FIREBASE_CLIENT_EMAIL ,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: process.env.FIREBASE_AUTH_URI ,
  token_uri: process.env.FIREBASE_TOKEN_URI ,
  auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL ,
  client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL ,
  universe_domain: process.env.FIREBASE_UNIVERSE_DOMAIN ,
};

// Validate required Firebase credentials
export const validateFirebaseConfig = (): void => {
  const required = [
    "FIREBASE_PROJECT_ID",
    "FIREBASE_PRIVATE_KEY",
    "FIREBASE_CLIENT_EMAIL",
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required Firebase environment variables: ${missing.join(", ")}. Please check your .env file.`
    );
  }
};

