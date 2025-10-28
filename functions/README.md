# Firebase Cloud Functions - Push Notifications Service

## 📋 Overview

This directory contains Firebase Cloud Functions that handle push notifications for the Tray messaging system. When a user sends a message in the chat, these functions automatically trigger and send push notifications to the recipient.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Complete System Flow                     │
└─────────────────────────────────────────────────────────────┘

┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   Frontend  │      │   Backend    │      │  Functions  │
│  (tray/)    │ ───▶ │ (traybackend)│      │ (functions) │
└─────────────┘      └──────────────┘      └─────────────┘
     │                      │                      │
     │                      │                      │
     ▼                      ▼                      ▼
  ┌─────────────────────────────────────────────────────┐
  │              Firebase Services                      │
  ├─────────────────────────────────────────────────────┤
  │  • Firestore (Real-time database)                   │
  │  • Firebase Auth (User authentication)              │
  │  • FCM (Push notifications)                         │
  └─────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Node.js 20+ installed
- Firebase CLI installed
- Firebase project configured (`tray-ed2f7`)

### Installation

```bash
cd functions
npm install
```

### Build

```bash
npm run build
```

### Deploy

```bash
# From the functions directory:
cd functions

# Login to Firebase (first time only)
npx firebase-tools login

# Deploy the function
npx firebase-tools deploy --only functions:sendMessageNotification
```

## 📁 Project Structure

```
functions/
├── src/
│   ├── index.ts                    # Function entry point
│   └── sendMessageNotification.ts  # Main notification function
├── lib/                            # Compiled JavaScript (generated)
├── package.json                    # Dependencies
├── tsconfig.json                   # TypeScript config
├── firebase.json                   # Firebase configuration
└── .firebaserc                     # Firebase project config
```

## 🔧 Functions

### `sendMessageNotification`

**Trigger:** Firestore document creation  
**Path:** `chats/{chatId}/messages/{messageId}`  
**Type:** `onCreate`

#### What It Does:

1. **Listens** for new messages in Firestore
2. **Identifies** the recipient (opposite participant in chat)
3. **Fetches** recipient's FCM tokens from Firestore
4. **Sends** push notification to recipient's device(s)
5. **Cleans up** invalid/expired tokens automatically

#### Notification Payload:

```json
{
  "notification": {
    "title": "Sender Name",
    "body": "Message text"
  },
  "data": {
    "chatId": "chat_id",
    "senderId": "sender_uid",
    "messageId": "message_id",
    "type": "chat_message"
  },
  "apns": {
    "payload": {
      "aps": {
        "sound": "default",
        "badge": 1
      }
    }
  }
}
```

#### Database Schema Required:

```
/users/{userId}/fcmTokens/{tokenId}
  - fcmToken: string
  - deviceType: string ('ios' | 'android')
  - createdAt: timestamp
  - updatedAt: timestamp
```

## 🔄 How It Works

### Step-by-Step Flow:

```
1. User A sends message to User B
   ↓
2. Message saved to Firestore: chats/{chatId}/messages/{messageId}
   ↓
3. Cloud Function automatically triggers (onCreate)
   ↓
4. Function extracts recipient ID from chat participants
   ↓
5. Function queries /users/{recipientId}/fcmTokens for tokens
   ↓
6. Function sends FCM notification to all recipient's devices
   ↓
7. Recipient receives push notification (if app in background/closed)
   ↓
8. Badge count updates on app icon
```

### When Notifications Are Sent:

- ✅ **App in background** - Notification sent
- ✅ **App closed/terminated** - Notification sent
- ❌ **App in foreground** - No notification (Firestore listener handles updates)

## 🧪 Testing

### Local Testing (Emulator)

```bash
# Start Firebase emulators
npm run serve

# Or with full emulator suite
npx firebase-tools emulators:start
```

### Manual Testing

1. Deploy function to Firebase
2. Send message from User A to User B
3. Check Firebase Console → Functions → Logs
4. Verify notification received on User B's device

### View Logs

```bash
# View live logs
npx firebase-tools functions:log --only sendMessageNotification

# Or check in Firebase Console
# https://console.firebase.google.com/project/tray-ed2f7/functions/logs
```

## 🔍 Monitoring & Debugging

### Check Function Status

```bash
npx firebase-tools functions:list
```

### View Function Details

```bash
npx firebase-tools functions:describe sendMessageNotification
```

### Common Issues

#### Issue: Function not triggering
- **Check:** Firestore rules allow writes
- **Check:** Function is deployed successfully
- **Check:** Message document structure matches expected format

#### Issue: Notification not received
- **Check:** FCM tokens are stored in Firestore
- **Check:** Recipient has granted notification permissions
- **Check:** FCM token is still valid (not expired)

#### Issue: Invalid tokens error
- **Solution:** Function automatically removes invalid tokens
- **Check:** User re-registers FCM token via `/fcm/token` endpoint

## 🔐 Security

### Firestore Rules Required:

```javascript
// Allow reading FCM tokens (for Cloud Function)
match /users/{userId}/fcmTokens/{tokenId} {
  allow read: if request.auth != null && request.auth.uid == userId;
  allow write: if request.auth != null && request.auth.uid == userId;
}

// Allow writing messages (for app)
match /chats/{chatId}/messages/{messageId} {
  allow read, create: if request.auth != null && 
    request.auth.uid in get(/databases/$(database)/documents/chats/$(chatId)).data.participants;
}
```

## 📦 Dependencies

```json
{
  "firebase-admin": "^12.0.0",    // Firebase Admin SDK
  "firebase-functions": "^5.0.0"  // Firebase Functions SDK
}
```

## 🚢 Deployment

### Production Deployment

```bash
# Build TypeScript
npm run build

# Deploy to Firebase
npx firebase-tools deploy --only functions:sendMessageNotification

# Deploy all functions
npx firebase-tools deploy --only functions
```

### Environment Configuration

The function uses the default Firebase Admin SDK initialization. No additional environment variables needed if running on Firebase.

## 🔗 Integration

### With Backend API (`traybackend/`)

The backend API manages FCM tokens via endpoints:
- `POST /fcm/token` - Register FCM token
- `DELETE /fcm/token` - Delete FCM token

See `traybackend/src/controllers/fcm.controller.ts`

### With Frontend (`tray/`)

The frontend:
- Requests notification permissions
- Gets FCM token from device
- Registers token with backend API
- Handles incoming notifications

See `tray/src/services/notification.service.ts`

## 📊 Metrics & Analytics

### Monitor in Firebase Console:

1. **Function Invocations:** Total number of times function runs
2. **Execution Time:** Average time per execution
3. **Errors:** Failed executions
4. **FCM Delivery:** Successful notification sends

Access: Firebase Console → Functions → Dashboard

## 🛠️ Development

### Making Changes

```bash
# Edit source files in src/
# Build changes
npm run build

# Deploy changes
npx firebase-tools deploy --only functions:sendMessageNotification
```

### Adding New Functions

1. Create new function file in `src/`
2. Export from `src/index.ts`
3. Build and deploy

## 📝 API Reference

### Function: sendMessageNotification

**Type:** Firestore Trigger (onCreate)  
**Path:** `chats/{chatId}/messages/{messageId}`

**Inputs:**
- `chatId` - Chat document ID
- `messageId` - Message document ID
- Message document data (senderId, text, createdAt, etc.)

**Outputs:**
- Returns `null` (void function)
- Sends FCM notification to recipient
- Logs execution details

**Error Handling:**
- Silently handles missing data
- Logs errors for debugging
- Removes invalid FCM tokens automatically

## 🔄 Updates & Maintenance

### Updating Dependencies

```bash
npm update firebase-admin firebase-functions
npm run build
npx firebase-tools deploy --only functions
```

### Scaling

Cloud Functions automatically scale based on:
- Number of messages sent
- Concurrent function invocations
- Firebase's auto-scaling limits

## 📚 Additional Resources

- [Firebase Functions Documentation](https://firebase.google.com/docs/functions)
- [FCM Documentation](https://firebase.google.com/docs/cloud-messaging)
- [Firestore Triggers](https://firebase.google.com/docs/functions/firestore-events)

## 🆘 Support

For issues or questions:
1. Check Firebase Console logs
2. Verify Firestore data structure
3. Check function logs
4. Review error messages in console

## ✅ Status

- ✅ Function code complete
- ✅ TypeScript compilation working
- ✅ Deployment configuration ready
- ⏳ Ready to deploy to Firebase

