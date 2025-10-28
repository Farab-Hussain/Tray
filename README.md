# Tray - Complete Application Suite

A comprehensive platform connecting students with consultants, featuring real-time chat, booking management, and push notifications.

## 📁 Repository Structure

```
Tray/
├── application/    # React Native Mobile App (iOS/Android)
├── backend/        # Express.js Backend API (TypeScript)
├── functions/      # Firebase Cloud Functions (Push Notifications)
└── web/           # Next.js Web Dashboard (TypeScript)
```

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Complete Architecture                     │
└─────────────────────────────────────────────────────────────────┘

┌──────────────┐      ┌─────────────┐      ┌──────────────┐
│  Application │      │   Backend   │      │   Functions   │
│  (Mobile)    │◄────►│    API      │      │    (Cloud)    │
└──────────────┘      └─────────────┘      └──────────────┘
        │                     │                      │
        │                     │                      │
        ▼                     ▼                      ▼
┌───────────────────────────────────────────────────────────┐
│              Firebase Services                             │
├───────────────────────────────────────────────────────────┤
│  • Firestore (Real-time database)                         │
│  • Firebase Auth (User authentication)                    │
│  • FCM (Push notifications)                               │
│  • Firebase Storage (Image uploads)                       │
└───────────────────────────────────────────────────────────┘
        ▲
        │
┌──────────────┐
│  Web Portal  │
│  (Dashboard) │
└──────────────┘
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 20+ installed
- **npm** or **yarn** package manager
- **Firebase CLI** (for deploying functions)
- **Xcode** (for iOS development)
- **Android Studio** (for Android development)
- **Firebase Project** configured (`tray-ed2f7`)

### Installation

Each repository runs independently:

```bash
# 1. Mobile Application
cd application
npm install
cd ios && pod install && cd ..

# 2. Backend API
cd backend
npm install
npm run build

# 3. Cloud Functions
cd functions
npm install
npm run build

# 4. Web Dashboard
cd web
npm install
```

---

## 📱 1. Application (React Native Mobile App)

**Location:** `application/`  
**Type:** React Native (TypeScript)  
**Platforms:** iOS & Android

### Features

- ✅ User authentication (Student/Consultant roles)
- ✅ Real-time chat messaging
- ✅ Booking management
- ✅ Push notifications
- ✅ Profile management
- ✅ Payment integration (Stripe)
- ✅ Service booking
- ✅ Reviews & ratings

### Tech Stack

- React Native 0.82
- TypeScript
- Firebase (Auth, Firestore, FCM)
- React Navigation
- Axios
- React Native Firebase

### Setup

```bash
cd application

# Install dependencies
npm install

# iOS - Install pods
cd ios && pod install && cd ..

# Start Metro bundler
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android
```

### Environment Variables

Create `.env` in `application/`:

```env
API_URL=http://localhost:3000
FIREBASE_API_KEY=your_key
FIREBASE_AUTH_DOMAIN=your_domain
FIREBASE_PROJECT_ID=tray-ed2f7
FIREBASE_STORAGE_BUCKET=your_bucket
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id
```

### Key Features Implementation

- **Real-time Chat:** Firestore listeners for instant messaging
- **Push Notifications:** FCM integration with badge counters
- **Booking Flow:** Student booking → Consultant acceptance → Chat enabled
- **Profile Images:** Consultant and student profile images in chat

---

## 🔧 2. Backend (Express.js API)

**Location:** `backend/`  
**Type:** Express.js (TypeScript)  
**Port:** Default 3000 (configurable)

### Features

- ✅ RESTful API endpoints
- ✅ Firebase Admin SDK integration
- ✅ User authentication & authorization
- ✅ Booking management
- ✅ Consultant profile management
- ✅ FCM token management
- ✅ File uploads (Cloudinary)
- ✅ Email service (Nodemailer)

### Tech Stack

- Express.js 5.1
- TypeScript
- Firebase Admin SDK
- Cloudinary (Image storage)
- Stripe (Payments)
- Nodemailer (Email)

### Setup

```bash
cd backend

# Install dependencies
npm install

# Build TypeScript
npm run build

# Development mode
npm run dev

# Production mode
npm run start:prod
```

### API Endpoints

#### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - User login
- `GET /auth/me` - Get current user
- `GET /auth/users/:uid` - Get user by ID
- `PUT /auth/profile` - Update profile

#### Bookings
- `POST /bookings` - Create booking
- `GET /bookings/student` - Get student bookings
- `GET /bookings/consultant` - Get consultant bookings
- `PUT /bookings/:id/status` - Update booking status

#### FCM (Push Notifications)
- `POST /fcm/token` - Register FCM token
- `DELETE /fcm/token` - Delete FCM token

#### Consultants
- `GET /consultants` - Get all consultants
- `GET /consultants/top` - Get top consultants
- `GET /consultants/:id/services` - Get consultant services

See `backend/src/routes/` for complete API documentation.

---

## ☁️ 3. Functions (Firebase Cloud Functions)

**Location:** `functions/`  
**Type:** Firebase Cloud Functions (TypeScript)  
**Deployment:** Firebase Hosting

### Features

- ✅ Automatic push notifications on new messages
- ✅ Badge count updates
- ✅ Invalid token cleanup
- ✅ Firestore triggers

### Tech Stack

- Firebase Functions
- Firebase Admin SDK
- TypeScript

### Setup

```bash
cd functions

# Install dependencies
npm install

# Build TypeScript
npm run build

# Local testing (emulator)
npm run serve

# Deploy to Firebase
npx firebase-tools login
npx firebase-tools deploy --only functions:sendMessageNotification
```

### Functions

#### `sendMessageNotification`
- **Trigger:** Firestore `onCreate` on `chats/{chatId}/messages/{messageId}`
- **Action:** Sends FCM push notification to message recipient
- **Auto-runs:** When app is in background/closed

See `functions/README.md` for detailed documentation.

---

## 💻 4. Web (Next.js Dashboard)

**Location:** `web/`  
**Type:** Next.js (TypeScript)  
**Framework:** Next.js 15

### Features

- ✅ Admin dashboard
- ✅ Analytics & monitoring
- ✅ User management
- ✅ Business insights

### Tech Stack

- Next.js 15.5
- React 19
- TypeScript
- Tailwind CSS
- Firebase

### Setup

```bash
cd web

# Install dependencies
npm install

# Development mode
npm run dev

# Production build
npm run build
npm start
```

### Access

- **Development:** http://localhost:3000
- **External Access:** http://0.0.0.0:3000

---

## 🔄 How Components Work Together

### 1. User Registration Flow

```
User registers in Mobile App
    ↓
Backend creates user in Firestore
    ↓
User receives confirmation
```

### 2. Booking & Chat Flow

```
Student books consultant
    ↓
Backend creates booking
    ↓
Consultant accepts booking
    ↓
Chat automatically enabled
    ↓
Users can message each other
```

### 3. Real-time Messaging Flow

```
User A sends message
    ↓
Message saved to Firestore
    ↓
Firestore listener updates User B (if app open)
    ↓
Cloud Function triggers (if app closed/background)
    ↓
Push notification sent to User B
```

### 4. Push Notification Flow

```
New message created
    ↓
Cloud Function triggers automatically
    ↓
Function finds recipient's FCM tokens
    ↓
Sends push notification
    ↓
Badge count updates
    ↓
User taps notification
    ↓
App opens to chat screen
```

---

## 🗄️ Database Schema

### Firestore Collections

```
/users/{userId}
  - name: string
  - email: string
  - role: 'student' | 'consultant' | 'admin'
  - profileImage: string
  - isActive: boolean
  - createdAt: timestamp
  
/users/{userId}/fcmTokens/{tokenId}
  - fcmToken: string
  - deviceType: 'ios' | 'android'
  - createdAt: timestamp
  - updatedAt: timestamp

/chats/{chatId}
  - participants: [uid1, uid2]
  - lastMessage: string
  - lastMessageAt: timestamp
  - lastMessageSenderId: string

/chats/{chatId}/messages/{messageId}
  - senderId: string
  - text: string
  - type: 'text' | 'image'
  - createdAt: timestamp
  - seenBy: [userId, ...]
```

---

## 🔐 Environment Setup

### Application (.env)

```env
API_URL=http://localhost:3000
FIREBASE_API_KEY=your_key
FIREBASE_AUTH_DOMAIN=your_domain
FIREBASE_PROJECT_ID=tray-ed2f7
FIREBASE_STORAGE_BUCKET=your_bucket
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id
```

### Backend (.env)

```env
PORT=3000
NODE_ENV=development
FIREBASE_PROJECT_ID=tray-ed2f7
SMTP_EMAIL=your_email
SMTP_PASSWORD=your_password
STRIPE_SECRET_KEY=your_stripe_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Web (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_FIREBASE_API_KEY=your_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tray-ed2f7
```

---

## 🚢 Deployment

### Application (Mobile)

**iOS:**
```bash
cd application/ios
xcodebuild -workspace tray.xcworkspace -scheme tray -configuration Release
```

**Android:**
```bash
cd application/android
./gradlew assembleRelease
```

### Backend API

```bash
cd backend
npm run build
npm run start:prod
```

Deploy to your preferred hosting (Heroku, AWS, DigitalOcean, etc.)

### Cloud Functions

```bash
cd functions
npx firebase-tools login
npx firebase-tools deploy --only functions
```

### Web Dashboard

```bash
cd web
npm run build
npm start
```

Deploy to Vercel, Netlify, or your preferred hosting.

---

## 🧪 Testing

### Application

```bash
cd application
npm test
```

### Backend

```bash
cd backend
npm test
```

### Web

```bash
cd web
npm test
```

---

## 📊 Monitoring

### Backend API

- Health check: `GET /health`
- Logs: Check console output
- Errors: Check error logs

### Cloud Functions

```bash
# View logs
cd functions
npx firebase-tools functions:log

# Or Firebase Console
# https://console.firebase.google.com/project/tray-ed2f7/functions/logs
```

### Firestore

Monitor in Firebase Console → Firestore → Data

---

## 🐛 Troubleshooting

### Application Issues

**iOS Build Fails:**
```bash
cd application/ios
pod install
pod repo update
```

**Metro Bundler Issues:**
```bash
cd application
npm start -- --reset-cache
```

**Firebase Native Module Error:**
- Rebuild iOS app: `npm run ios`
- Check pods installed: `cd ios && pod install`

### Backend Issues

**Port Already in Use:**
- Change PORT in `.env`
- Kill process: `lsof -ti:3000 | xargs kill`

**Firebase Admin Error:**
- Check service account key path
- Verify Firebase project ID

### Functions Issues

**Function Not Triggering:**
- Check Firestore rules allow writes
- Verify function is deployed
- Check Firebase Console logs

**Notification Not Received:**
- Verify FCM token registered
- Check notification permissions
- Verify device has internet

---

## 📚 Key Features Documentation

### Real-time Chat

- Uses Firestore listeners for instant updates
- Supports text messages
- Shows unread message counts
- Displays last message preview
- Profile images in chat header

### Push Notifications

- Automatic notifications when app closed/background
- Badge count on app icon
- Opens chat on notification tap
- No notifications when app is foreground

### Booking System

- Students book consultants
- Consultants accept/reject bookings
- Chat enabled after acceptance
- Booking history management
- Payment integration

---

## 🔗 Related Documentation

- **Application:** See `application/README.md`
- **Backend:** See `backend/README.md`
- **Functions:** See `functions/README.md`
- **Web:** See `web/README.md`

---

## 🛠️ Development Workflow

### Running Everything Locally

```bash
# Terminal 1: Backend API
cd backend
npm run dev

# Terminal 2: Mobile App
cd application
npm start
# Then run on simulator

# Terminal 3: Web Dashboard (optional)
cd web
npm run dev

# Terminal 4: Firebase Emulators (optional)
cd functions
npm run serve
```

### Making Changes

1. **Application:** Edit → Hot reload automatically
2. **Backend:** Edit → Server restarts (ts-node-dev)
3. **Functions:** Edit → Build → Deploy
4. **Web:** Edit → Hot reload automatically

---

## 📝 API Documentation

### Base URL
- **Development:** `http://localhost:3000`
- **Production:** `https://api.tray.com` (configure in production)

### Authentication

All protected routes require Firebase ID token in header:
```
Authorization: Bearer <firebase-id-token>
```

---

## 🆘 Support

### Common Issues

1. **"Native module not found"** - Rebuild app after installing packages
2. **"FCM token not registered"** - Check backend `/fcm/token` endpoint
3. **"Push notifications not working"** - Verify Cloud Function is deployed
4. **"Chat not loading"** - Check Firestore rules and permissions

### Getting Help

- Check Firebase Console logs
- Review error messages in console
- Verify environment variables
- Check network connectivity

---

## ✅ Current Status

- ✅ Mobile Application (iOS/Android) - Complete
- ✅ Backend API (REST) - Complete
- ✅ Cloud Functions (Push Notifications) - Ready to deploy
- ✅ Web Dashboard (Next.js) - Complete
- ✅ Real-time Chat - Implemented
- ✅ Push Notifications - Implemented
- ✅ Booking System - Complete
- ✅ Payment Integration - Complete

---

## 📄 License

Private - All Rights Reserved

---