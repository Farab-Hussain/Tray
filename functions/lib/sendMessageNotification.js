"use strict";
/**
 * Firebase Cloud Function to send push notifications when a new message is sent
 *
 * DEPLOYMENT:
 * 1. Install Firebase Functions CLI: npm install -g firebase-tools
 * 2. Login: firebase login
 * 3. Initialize functions: firebase init functions
 * 4. Copy this file to your functions/src directory
 * 5. Deploy: firebase deploy --only functions:sendMessageNotification
 *
 * REQUIRED INSTALL:
 * npm install firebase-functions firebase-admin
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMessageNotification = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const db = admin.firestore();
/**
 * Cloud Function that triggers when a new message is created in Firestore
 * Sends FCM push notification to the recipient
 */
exports.sendMessageNotification = functions.firestore
    .document('chats/{chatId}/messages/{messageId}')
    .onCreate(async (snap, context) => {
    try {
        const newMessage = snap.data();
        const chatId = context.params.chatId;
        const messageId = context.params.messageId;
        console.log('📨 New message created:', messageId);
        console.log('💬 Message text:', newMessage.text);
        console.log('👤 Sender ID:', newMessage.senderId);
        // Skip if message doesn't have required fields
        if (!newMessage.senderId || !newMessage.text) {
            console.log('⚠️ Skipping - message missing required fields');
            return null;
        }
        // Get chat document to find participants
        const chatDoc = await db.collection('chats').doc(chatId).get();
        if (!chatDoc.exists) {
            console.log('⚠️ Chat document not found:', chatId);
            return null;
        }
        const chatData = chatDoc.data();
        const participants = (chatData === null || chatData === void 0 ? void 0 : chatData.participants) || [];
        console.log('👥 Chat participants:', participants);
        // Find the recipient (not the sender)
        const recipientId = participants.find((p) => p !== newMessage.senderId);
        if (!recipientId) {
            console.log('⚠️ Could not find recipient');
            return null;
        }
        console.log('📤 Recipient ID:', recipientId);
        // Get recipient's FCM tokens from Firestore
        const fcmTokensRef = db
            .collection('users')
            .doc(recipientId)
            .collection('fcmTokens');
        const tokensSnapshot = await fcmTokensRef.get();
        if (tokensSnapshot.empty) {
            console.log('⚠️ No FCM tokens found for recipient:', recipientId);
            return null;
        }
        // Get sender's name for the notification
        let senderName = 'Someone';
        try {
            const senderDoc = await db.collection('users').doc(newMessage.senderId).get();
            if (senderDoc.exists) {
                const senderData = senderDoc.data();
                senderName = (senderData === null || senderData === void 0 ? void 0 : senderData.name) || (senderData === null || senderData === void 0 ? void 0 : senderData.displayName) || 'Someone';
            }
        }
        catch (error) {
            console.log('⚠️ Could not fetch sender name:', error);
        }
        // Prepare notification payload
        const notification = {
            title: senderName,
            body: newMessage.text || 'New message',
        };
        const data = {
            chatId: chatId,
            senderId: newMessage.senderId,
            messageId: messageId,
            type: 'chat_message',
        };
        // Get all FCM tokens for the recipient
        const tokens = tokensSnapshot.docs.map((doc) => doc.data().fcmToken).filter(Boolean);
        if (tokens.length === 0) {
            console.log('⚠️ No valid FCM tokens found');
            return null;
        }
        console.log('📱 Sending notification to tokens:', tokens);
        // Send notifications to all devices
        const message = {
            tokens,
            notification: notification,
            data: data,
            apns: {
                payload: {
                    aps: {
                        sound: 'default',
                        badge: 1,
                        'content-available': 1,
                    },
                },
            },
            android: {
                notification: {
                    sound: 'default',
                    channelId: 'chat_messages',
                },
                priority: 'high',
            },
        };
        const responses = await admin.messaging().sendEachForMulticast(message);
        console.log('✅ Notification sent successfully');
        console.log('📊 Response:', responses);
        // Handle failed tokens (clean up invalid tokens)
        const failedTokens = [];
        if (responses.responses) {
            responses.responses.forEach((result, index) => {
                if (result.error) {
                    console.error('❌ Failed to send to token:', tokens[index], result.error);
                    if (result.error.code === 'messaging/invalid-registration-token' ||
                        result.error.code === 'messaging/registration-token-not-registered') {
                        failedTokens.push(tokensSnapshot.docs[index].ref);
                    }
                }
            });
        }
        // Clean up failed tokens
        if (failedTokens.length > 0) {
            console.log('🧹 Removing invalid tokens:', failedTokens.length);
            const batch = db.batch();
            failedTokens.forEach((tokenRef) => {
                batch.delete(tokenRef);
            });
            await batch.commit();
        }
        return null;
    }
    catch (error) {
        console.error('❌ Error sending notification:', error);
        return null;
    }
});
//# sourceMappingURL=sendMessageNotification.js.map