// Import the functions you need from the SDKs you need
import { initializeApp, type FirebaseApp } from "firebase/app";
import { initializeAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getDatabase, type Database } from "firebase/database";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import {
  FIREBASE_API_KEY,
  FIREBASE_AUTH_DOMAIN,
  FIREBASE_PROJECT_ID,
  FIREBASE_STORAGE_BUCKET,
  FIREBASE_MESSAGING_SENDER_ID,
  FIREBASE_APP_ID,
  FIREBASE_DATABASE_URL,
} from "@env";

// Import React Native persistence
// @ts-ignore - TypeScript doesn't resolve RN-specific exports correctly
import { getReactNativePersistence } from "@firebase/auth";

// Log Firebase config loading (minimal logging for security)
if (__DEV__) {
  console.log('🔥 [Firebase] Loading config for', Platform.OS.toUpperCase());
  console.log('🔥 [Firebase] Project ID:', FIREBASE_PROJECT_ID);
}

// Validate Firebase config
const missingConfig: string[] = [];
if (!FIREBASE_API_KEY || FIREBASE_API_KEY.trim() === '') {
  missingConfig.push('FIREBASE_API_KEY');
}
if (!FIREBASE_PROJECT_ID || FIREBASE_PROJECT_ID.trim() === '') {
  missingConfig.push('FIREBASE_PROJECT_ID');
}
if (!FIREBASE_AUTH_DOMAIN || FIREBASE_AUTH_DOMAIN.trim() === '') {
  missingConfig.push('FIREBASE_AUTH_DOMAIN');
}

if (missingConfig.length > 0) {
  const errorMessage = `❌ [Firebase] Missing required configuration: ${missingConfig.join(', ')}\n\nPlease check your .env file and ensure all Firebase configuration variables are set.`;
    if (__DEV__) {
    console.error(errorMessage)
  };
  
  // In production, we should not throw to prevent app crash, but log the error
  // In development, throw to alert developers immediately
  if (__DEV__) {
    throw new Error(`Firebase configuration incomplete. Missing: ${missingConfig.join(', ')}`);
  }
}

const firebaseConfig = {
  apiKey: FIREBASE_API_KEY,
  authDomain: FIREBASE_AUTH_DOMAIN,
  projectId: FIREBASE_PROJECT_ID,
  storageBucket: FIREBASE_STORAGE_BUCKET,
  messagingSenderId: FIREBASE_MESSAGING_SENDER_ID,
  appId: FIREBASE_APP_ID,
  databaseURL: FIREBASE_DATABASE_URL,
};

// Initialize Firebase
let app: FirebaseApp;
let auth: Auth;
let firestore: Firestore;
let database: Database;

try {
  app = initializeApp(firebaseConfig);
  if (__DEV__) {
    console.log('✅ [Firebase] App initialized successfully');
  }
} catch (error: any) {
  // App already initialized (hot reload)
  if (error.code === 'app/already-initialized') {
    if (__DEV__) {
      console.log('ℹ️ [Firebase] App already initialized, using existing instance');
    }
    app = require("firebase/app").getApp();
  } else {
    console.error('❌ [Firebase] App initialization error:', error.message || error);
    throw error;
  }
}

// Initialize Auth with AsyncStorage persistence for React Native
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
  if (__DEV__) {
    console.log('✅ [Firebase] Auth initialized successfully');
  }
} catch (error: any) {
  // Auth already initialized (hot reload)
  if (error.code === 'auth/already-initialized') {
    if (__DEV__) {
      console.log('ℹ️ [Firebase] Auth already initialized, using existing instance');
    }
    auth = require("firebase/auth").getAuth(app);
  } else {
    console.error('❌ [Firebase] Auth initialization error:', error.message || error);
    throw error;
  }
}

// Initialize Firestore
try {
  firestore = getFirestore(app);
} catch {
  // Firestore already initialized
  firestore = require("firebase/firestore").getFirestore(app);
}

// Initialize Realtime Database
try {
  database = getDatabase(app);
  if (__DEV__) {
    console.log('✅ [Firebase] Database initialized successfully');
  }
} catch (error: any) {
  // Database already initialized
  if (error.code === 'database/already-initialized') {
    if (__DEV__) {
      console.log('ℹ️ [Firebase] Database already initialized, using existing instance');
    }
    database = require("firebase/database").getDatabase(app);
  } else {
    console.error('❌ [Firebase] Database initialization error:', error.message || error);
    database = require("firebase/database").getDatabase(app);
  }
}

export default app;
export { auth, firestore, database };