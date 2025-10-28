// Import the functions you need from the SDKs you need
import { initializeApp, type FirebaseApp } from "firebase/app";
import { initializeAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getDatabase, type Database } from "firebase/database";
import AsyncStorage from '@react-native-async-storage/async-storage';
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
} catch {
  // App already initialized (hot reload)
  app = require("firebase/app").getApp();
}

// Initialize Auth with AsyncStorage persistence for React Native
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
} catch (error: any) {
  // Auth already initialized (hot reload)
  if (error.code === 'auth/already-initialized') {
    auth = require("firebase/auth").getAuth(app);
  } else {
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
} catch {
  // Database already initialized
  database = require("firebase/database").getDatabase(app);
}

export default app;
export { auth, firestore, database };