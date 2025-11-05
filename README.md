# Tray – Complete Monorepo Overview

A full-stack platform connecting students with consultants. It includes a React Native mobile app, a Next.js web portal, and a TypeScript/Express backend with Firebase for auth, data, storage, and messaging, plus Stripe for payments.

---

## Monorepo Structure

```text
Tray/
├─ application/           # React Native mobile app (iOS/Android)
├─ backend/               # Express.js REST API (TypeScript)
├─ web/                   # Next.js 15 Web portal (Admin + Consultant)
├─ firestore.indexes.json # Firestore indexes definition
├─ MOBILE_APP_TEST.md     # Mobile manual test notes
├─ TEST_CHAT_NOTIFICATION.md # FCM testing notes
└─ TEST_RESULTS.md        # Test runs and notes
```

### application/ (React Native)
```text
application/
├─ app.json
├─ index.js
├─ android/                    # Gradle project, google-services.json
├─ ios/                        # Xcode project, GoogleService-Info.plist, Pods
├─ src/
│  ├─ App.tsx
│  ├─ assets/
│  │  ├─ icon/                 # social icons
│  │  └─ image/                # app images (logo, avatar, etc.)
│  ├─ components/
│  │  ├─ consultant/           # multi-step forms & status
│  │  ├─ shared/               # headers, search bar
│  │  └─ ui/                   # reusable UI (buttons, cards, modals)
│  ├─ constants/
│  │  ├─ core/                 # colors, globals
│  │  ├─ data/                 # static lists for UI
│  │  └─ styles/               # co-located style objects per screen/feature
│  ├─ contexts/                # Auth, Chat, Notification providers
│  ├─ hooks/                   # useLogin, useRegister, useChat
│  ├─ lib/                     # axios fetcher, Firebase init
│  ├─ navigator/               # React Navigation stacks/tabs
│  ├─ Screen/
│  │  ├─ Admin/RefundReview/   # Admin refund review
│  │  ├─ Auth/                 # Login/Register/Reset/Verify
│  │  ├─ common/               # Account, Calling, Help, Messages, Notifications
│  │  ├─ Consultant/           # Consultant flows (availability, services, slots)
│  │  ├─ Splash/               # splash screens
│  │  └─ Student/              # Browse, Booking, Cart, Payment, Reviews
│  ├─ services/                # API service modules (booking, chat, payment, etc.)
│  ├─ types/                   # shared types (env, chat)
│  └─ utils/                   # helpers (password, time, toast)
└─ tests, configs, metro/jest/babel
```

Key services in `application/src/services/`:
- booking.service.ts, bookingRequest.service.ts
- chat.Service.ts
- consultant.service.ts, consultantFlow.service.ts
- email.service.ts
- notification.service.ts, notification-storage.service.ts
- payment.service.ts
- review.service.ts, sessionCompletion.service.ts
- upload.service.ts
- user.service.ts

Navigation in `application/src/navigator/`:
- `AuthNavigation`, `RootNavigation`
- `BottomNavigation`, `ConsultantBottomNavigation`
- `HomeStackNavigator`, `ServicesStackNavigator`, `ScreenNavigator`

### backend/ (Express + TypeScript)
```text
backend/
├─ src/
│  ├─ app.ts, server.ts
│  ├─ config/                  # firebase admin config
│  ├─ controllers/             # route handlers (auth, booking, payment, etc.)
│  ├─ functions/               # sendMessageNotification.function.ts
│  ├─ middleware/              # auth, consultant gates
│  ├─ models/                  # consultant, application, profile, review
│  ├─ routes/                  # auth, booking, consultant, payment, review, etc.
│  ├─ services/                # consultant and review domain services
│  └─ utils/                   # email, logger
├─ dist/                       # build output
└─ scripts, configs
```

Routes in `backend/src/routes/`:
- `auth.routes.ts`, `booking.routes.ts`, `consultant.routes.ts`, `consultantFlow.routes.ts`
- `fcm.routes.ts`, `notification.routes.ts`, `payment.routes.ts`, `review.routes.ts`, `upload.routes.ts`

### web/ (Next.js 15 + React 19)
```text
web/
├─ app/
│  ├─ (root)/
│  │  ├─ admin/                # Admin dashboard pages
│  │  └─ consultant/           # Consultant portal pages
│  ├─ layout.tsx               # Root layout
│  └─ login/page.tsx           # Auth entry
├─ components/                 # Admin/Consultant/UI components
├─ config/firebase.ts          # web firebase init
├─ constants/, contexts/       # Auth context, constants
├─ utils/                      # API client & helpers
└─ styles/, tailwind config
```

---

## Features (End-to-End)

### Core Platform
- **Authentication & Roles**: Student, Consultant, Admin via Firebase Auth + backend role checks
- **Profiles**: Create, update, verify consultant profiles, upload avatars and documents
- **Consultant Services**: Create and manage services, availability, slots, and pricing
- **Discovery & Booking**: Browse consultants/services, add to cart, book sessions
- **Chat & Calling**: Real-time chat (Firestore). Voice/video screens present (integration-ready)
- **Notifications**: FCM push notifications for messages, bookings, status changes
- **Payments**: Stripe-based payment flows (PaymentSheet/UI in mobile, payouts tracking in admin)
- **Reviews & Ratings**: Post-session reviews, session completion flows
- **Admin Tools**: Review applications, manage users, services, refunds, analytics

### Mobile App (React Native)
- **Auth**: Login, Register, Email verification, Password reset
- **Student**:
  - Browse services and consultants, search and filter
  - Manage cart and bookings; payment and checkout
  - Chat with consultants; receive notifications
  - Submit reviews and view history
- **Consultant**:
  - Profile creation, status, verification steps
  - Manage availability, services, slots, clients
  - View earnings, notifications, messages
  - Handle session completion and ratings
- **Common**: Account management, profile editing, help center, calling screens

### Web Portal (Next.js)
- **Admin**:
  - Overview dashboard: analytics, activity
  - Users, consultant profiles, service applications (approve/reject)
  - Commission, funds, payouts tables and widgets
  - Settings and support
- **Consultant**:
  - Multi-step profile, status, service management (create/edit)
  - Clients, bookings, transactions views
  - Route guards for roles

### Backend API (Express)
- **Auth**: Token verification (Firebase Admin), profile updates, user retrieval
- **Consultants**: CRUD for profiles, services, applications, availability
- **Bookings**: Create/update bookings, status changes, lists for student/consultant
- **Notifications**: FCM token registration and cleanup
- **Payments**: Stripe integration endpoints for intents/sheets (client-side flows on mobile/web)
- **Reviews**: Post and list reviews
- **Uploads**: Media/document upload endpoints (e.g., Cloudinary-backed)

### Notifications & Messaging
- **Real-time Chat**: Firestore chat with last message, unread counts, typing indicators (UI hooks)
- **Push Notifications**: Cloud Function `sendMessageNotification` for background messages; badge count updates; invalid token cleanup

---

## Tech Stack
- **Mobile**: React Native, TypeScript, React Navigation, RN Firebase, Axios
- **Web**: Next.js 15, React 19, TypeScript, Tailwind CSS, Firebase
- **Backend**: Node.js, Express 5, TypeScript, Firebase Admin, Stripe, Nodemailer, Cloudinary
- **Infra**: Firebase (Auth, Firestore, Storage, FCM)

---

## Setup and Run

### 1) Backend
```bash
cd backend
npm install
npm run build
# Dev
npm run dev
# Prod
npm run start:prod
```

Backend environment (`backend/.env`):
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

### 2) Mobile (React Native)
```bash
cd application
npm install
# iOS pods
cd ios && pod install && cd ..
# Start bundler
npm start
# Run
npm run ios
npm run android
```

Mobile environment (`application/.env`):
```env
API_URL=http://localhost:3000
FIREBASE_API_KEY=your_key
FIREBASE_AUTH_DOMAIN=your_domain
FIREBASE_PROJECT_ID=tray-ed2f7
FIREBASE_STORAGE_BUCKET=your_bucket
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id
```

### 3) Web (Next.js)
```bash
cd web
npm install
npm run dev
# Build + Start
npm run build
npm start
```

Web environment (`web/.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_FIREBASE_API_KEY=your_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tray-ed2f7
```

### 4) Firebase Functions (used within backend project)
- Cloud function source: `backend/src/functions/sendMessageNotification.function.ts`
- Deploy via your chosen pipeline or via Firebase CLI if extracted into a functions project.

---

## API Overview (High-Level)

Base URL (dev): `http://localhost:3000`

- `Auth` (`/auth`): register, login, me, profile update, user lookup
- `Consultant` (`/consultants`, `/consultant-flow`): profile, application, services, availability
- `Booking` (`/bookings`): create, list (student/consultant), update status
- `Payments` (`/payment`): intents/sheets, webhooks (if configured)
- `Notifications` (`/fcm`, `/notification`): token register/delete, list notifications
- `Reviews` (`/review`): create/list
- `Upload` (`/upload`): images/documents

All protected routes require header: `Authorization: Bearer <firebase-id-token>`.

---

## Data Model (Firestore – key collections)
```text
/users/{userId}
  role: 'student' | 'consultant' | 'admin'
  name, email, photoURL, ...
  createdAt, isActive

/users/{userId}/fcmTokens/{tokenId}
  fcmToken, deviceType, createdAt, updatedAt

/chats/{chatId}
  participants: [uid1, uid2]
  lastMessage, lastMessageAt, lastMessageSenderId

/chats/{chatId}/messages/{messageId}
  senderId, text | imageUrl, createdAt, seenBy[]
```

---

## Workflows

### Registration & Profile
1) User signs up (mobile/web) → Firebase Auth + backend user record
2) Consultant completes multi-step profile and submits verification
3) Admin reviews and approves consultant application

### Booking → Chat → Completion
1) Student browses services and books a slot
2) Consultant accepts; chat opens between both parties
3) Session occurs; consultant marks completion → student reviews and rates

### Messaging & Notifications
- Foreground: Firestore listeners update chat in real time
- Background/closed: Cloud Function sends FCM notification; tap opens chat

---

## Scripts
- Mobile: `npm start`, `npm run ios`, `npm run android`, `npm test`
- Backend: `npm run dev`, `npm run build`, `npm start`, `npm test`
- Web: `npm run dev`, `npm run build`, `npm start`, `npm test`

---

## Troubleshooting
- iOS pods: `cd application/ios && pod install && pod repo update`
- Metro cache: `cd application && npm start -- --reset-cache`
- Kill port (3000): `lsof -ti:3000 | xargs kill`
- Firebase Admin errors: verify service account config and project ID
- Push not received: ensure token registered, permissions granted, function deployed

---

## License
Private – All rights reserved.