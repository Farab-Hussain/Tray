import * as admin from 'firebase-admin';

// Initialize Firebase Admin
admin.initializeApp();

// Import and export the function
export { sendMessageNotification } from './sendMessageNotification';

