# Backend Setup Guide for Push Notifications

## 📋 What I've Added to Your Backend

### New Files Created:

1. ✅ `src/controllers/fcm.controller.ts` - FCM token management controller
2. ✅ `src/routes/fcm.routes.ts` - FCM routes
3. ✅ `src/functions/sendMessageNotification.function.ts` - Cloud Function for push notifications

### Files Modified:

1. ✅ `src/app.ts` - Added FCM routes

## 🔧 What You Need to Do

### Step 1: Rebuild Backend

```bash
cd traybackend
npm run build
```

### Step 2: Deploy Cloud Function (Optional but Recommended)

The Cloud Function automatically sends push notifications when new messages are created.

**Install Firebase CLI:**
```bash
npm install -g firebase-tools
firebase login
```

**Deploy Function:**
```bash
firebase deploy --only functions:sendMessageNotification
```

**OR** If you're using Firebase Functions separately:

1. Copy `src/functions/sendMessageNotification.function.ts` to your Firebase Functions project
2. Install dependencies: `npm install firebase-functions firebase-admin`
3. Deploy: `firebase deploy --only functions`

### Step 3: Test the Setup

1. **Start your backend:**
   ```bash
   npm run dev
   ```

2. **Test FCM token registration:**
   - Login to your app
   - Check console logs for: "✅ FCM token registered with backend"

3. **Test push notifications:**
   - Send a message to another user
   - If the Cloud Function is deployed, they'll receive a push notification

## 🎯 How It Works

```
User sends message
    ↓
Message saved to Firestore
    ↓
Cloud Function triggers automatically
    ↓
Function finds recipient's FCM tokens from /users/{userId}/fcmTokens
    ↓
Sends push notification to recipient's device
    ↓
Recipient sees notification with badge count
```

## 📱 API Endpoints

### POST /fcm/token
Register FCM token for current user

**Request:**
```json
{
  "fcmToken": "device-token-here",
  "deviceType": "ios"
}
```

**Response:**
```json
{
  "success": true,
  "message": "FCM token registered"
}
```

### DELETE /fcm/token
Delete FCM token(s) for current user

**Request:**
```json
{
  "fcmToken": "device-token-here"  // optional, deletes all if not provided
}
```

**Response:**
```json
{
  "success": true,
  "message": "FCM token deleted"
}
```

## 🗃️ Database Structure

Firestore should have:

```
/users
  /{userId}
    /fcmTokens
      /{auto-generated-doc-id}
        - fcmToken: string
        - deviceType: string ('ios' | 'android')
        - createdAt: timestamp
        - updatedAt: timestamp
```

This structure is automatically created by the `registerFCMToken` controller.

## ✅ Frontend Already Configured

The frontend automatically:
1. ✅ Requests notification permissions
2. ✅ Gets FCM token
3. ✅ Registers token with backend (`/fcm/token`)
4. ✅ Handles foreground notifications
5. ✅ Handles background notifications
6. ✅ Refreshes chat list every 30 seconds

## 🐛 Troubleshooting

### "No FCM tokens found for recipient"
- User hasn't logged in yet
- FCM token wasn't registered
- Check POST `/fcm/token` endpoint is working

### "Cloud Function not triggering"
- Check Firebase Functions logs in Firebase Console
- Verify Cloud Function is deployed
- Check Firestore rules allow writes

### "Notification not received"
- Check device has internet connection
- Verify FCM token is valid
- Check notification permissions are granted in device settings

## 📝 Next Steps

1. ✅ Rebuild backend: `npm run build`
2. ✅ Deploy Cloud Function (optional)
3. ✅ Test with real devices
4. ✅ Monitor logs for errors