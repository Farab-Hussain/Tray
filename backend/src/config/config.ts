import dotenv from "dotenv";

dotenv.config();

/** Normalize private keys from .env / Vercel (escaped \\n, quotes, etc.) */
export function normalizePrivateKey(raw: string | undefined): string {
  if (!raw) return "";
  return raw
    .trim()
    .replace(/^["']|["']$/g, "")
    .replace(/\\\\n/g, "\n")
    .replace(/\\n/g, "\n");
}

function envFirst(...keys: string[]): string {
  for (const key of keys) {
    const value = process.env[key]?.trim();
    if (value) return value;
  }
  return "";
}

// Firebase Service Account Configuration - Main Project (tray-ed2f7)
// FIREBASE_MAIN_* preferred; FIREBASE_* supported for Vercel legacy env names
export const firebaseConfig = {
  type: envFirst("FIREBASE_MAIN_TYPE") || "service_account",
  project_id: envFirst("FIREBASE_MAIN_PROJECT_ID", "FIREBASE_PROJECT_ID"),
  private_key_id: envFirst(
    "FIREBASE_MAIN_PRIVATE_KEY_ID",
    "FIREBASE_PRIVATE_KEY_ID",
  ),
  private_key: normalizePrivateKey(
    envFirst("FIREBASE_MAIN_PRIVATE_KEY", "FIREBASE_PRIVATE_KEY"),
  ),
  client_email: envFirst(
    "FIREBASE_MAIN_CLIENT_EMAIL",
    "FIREBASE_CLIENT_EMAIL",
  ),
  client_id: envFirst("FIREBASE_MAIN_CLIENT_ID", "FIREBASE_CLIENT_ID"),
  auth_uri: process.env.FIREBASE_MAIN_AUTH_URI || "https://accounts.google.com/o/oauth2/auth",
  token_uri: process.env.FIREBASE_MAIN_TOKEN_URI || "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: process.env.FIREBASE_MAIN_AUTH_PROVIDER_X509_CERT_URL || "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: envFirst(
    "FIREBASE_MAIN_CLIENT_X509_CERT_URL",
    "FIREBASE_CLIENT_X509_CERT_URL",
  ),
  universe_domain:
    envFirst("FIREBASE_MAIN_UNIVERSE_DOMAIN") || "googleapis.com",
};

// Validate required Firebase credentials
export const validateFirebaseConfig = (): void => {
  const missing: string[] = [];
  if (!firebaseConfig.project_id) {
    missing.push("FIREBASE_MAIN_PROJECT_ID or FIREBASE_PROJECT_ID");
  }
  if (!firebaseConfig.private_key) {
    missing.push("FIREBASE_MAIN_PRIVATE_KEY or FIREBASE_PRIVATE_KEY");
  }
  if (!firebaseConfig.client_email) {
    missing.push("FIREBASE_MAIN_CLIENT_EMAIL or FIREBASE_CLIENT_EMAIL");
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required Firebase environment variables: ${missing.join(", ")}. Please check your .env file.`,
    );
  }

  if (!process.env.FIREBASE_API_KEY?.trim()) {
    console.warn(
      "⚠️ FIREBASE_API_KEY is not set — ID token REST fallback will not work on login.",
    );
  }
};

