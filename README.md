# Tray - Consultant Booking & Job Management Platform

A comprehensive multi-platform application for connecting students with consultants for booking sessions, real-time communication, payment processing, and job management. Built with React Native, Node.js, Next.js, and Firebase.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8+-blue)](https://www.typescriptlang.org/)
[![React Native](https://img.shields.io/badge/React%20Native-0.82.1-61DAFB)](https://reactnative.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green)](https://nodejs.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15.5-black)](https://nextjs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-12.6-orange)](https://firebase.google.com/)

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Platforms](#platforms)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Quick Start](#quick-start)
- [Environment Setup](#environment-setup)
- [Development](#development)
- [Documentation](#documentation)
- [Deployment](#deployment)
- [Contributing](#contributing)

## Overview

**Tray** is a multi-platform consultant booking and job management system that enables:

- **Students** to book consultation sessions, apply for jobs, and communicate with consultants
- **Consultants** to offer services, manage bookings, earn income, and post jobs
- **Recruiters** to post jobs, review applications, and manage candidates
- **Admins** to manage the platform, approve profiles, and monitor analytics

The platform consists of three main components:
1. **Mobile App** (React Native) - iOS and Android apps for all user roles
2. **Backend API** (Node.js/Express) - REST API server with Firebase integration
3. **Web Dashboard** (Next.js) - Admin-only web interface for platform management

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Applications                       │
├──────────────────────┬──────────────────┬───────────────────┤
│  React Native App    │   Next.js Web    │   (Future: API    │
│  (iOS/Android)       │   Dashboard      │    Clients)       │
│  Students,           │   Admin Only     │                   │
│  Consultants,        │                  │                   │
│  Recruiters          │                  │                   │
└──────────┬───────────┴──────────┬────────┴───────────────────┘
           │                      │
           │  HTTPS/REST API      │
           │  (Firebase Auth)     │
           │                      │
           └──────────┬───────────┘
                      │
        ┌─────────────▼─────────────┐
        │   Express.js Backend       │
        │   (Node.js/TypeScript)     │
        │   Port: 4000               │
        └─────────────┬─────────────┘
                      │
        ┌─────────────┼─────────────┐
        │             │             │
   ┌────▼────┐  ┌────▼────┐  ┌────▼────┐
   │ Firebase │  │ Stripe  │  │Cloudinary│
   │ Firestore│  │ Payment │  │  Storage │
   │   Auth   │  │ Gateway │  │          │
   │   FCM    │  │ Connect │  │          │
   │ Storage  │  │ Payouts │  │          │
   └──────────┘  └─────────┘  └──────────┘
```

### Data Flow

1. **Authentication**: Clients authenticate via Firebase Auth, receive ID tokens
2. **API Requests**: ID tokens sent to backend API in Authorization header
3. **Backend Processing**: Backend verifies tokens, processes requests, interacts with Firebase/Stripe/Cloudinary
4. **Real-time Updates**: Mobile app uses Firestore listeners for chat, notifications
5. **Push Notifications**: Backend sends FCM notifications for bookings, messages, calls

## Platforms

### 1. Mobile App (`/app`)
**React Native application for iOS and Android**

- **Roles**: Student, Consultant, Recruiter, Admin
- **Features**: Booking sessions, job management, chat, video/audio calls, payments, reviews
- **Technology**: React Native 0.82.1, React Navigation 7, Firebase SDK, Stripe, WebRTC
- **Documentation**: [app/README.md](./app/README.md)

### 2. Backend API (`/backend`)
**Node.js/Express REST API server**

- **Port**: 4000 (default)
- **Features**: Authentication, booking management, payments, automated payouts, reminders, analytics
- **Technology**: Express 5.1.0, TypeScript, Firebase Admin SDK, Stripe, Cloudinary
- **Documentation**: [backend/README.md](./backend/README.md)

### 3. Web Dashboard (`/web`)
**Next.js admin dashboard**

- **Role**: Admin only
- **Features**: User management, consultant approvals, service applications, analytics, platform settings
- **Technology**: Next.js 15.5.4, React 19, Tailwind CSS 4, Firebase Client SDK
- **Documentation**: [web/README.md](./web/README.md)
- **Note**: Consultant functionality has been moved to the mobile app

### 4. Firebase Configuration (`/firebase`)
**Firebase project configuration**

- Firestore security rules
- Firestore indexes
- Firebase configuration files

## Key Features

### Core Functionality

- **Multi-Role System**: Student, Consultant, Recruiter, and Admin roles with role-based access control
- **Booking Management**: Complete booking lifecycle with automated 24-hour reminders
- **Real-time Communication**: Chat and video/audio calls via WebRTC
- **Payment Processing**: Stripe integration for payments and automated consultant payouts
- **Job Management**: Job posting, applications, resume management, and skill matching
- **Review System**: Rating and review functionality with aggregate calculations
- **Push Notifications**: Firebase Cloud Messaging for real-time updates
- **File Uploads**: Cloudinary integration for profile images, service images, and resumes
- **Offline Support**: Offline message queue and network status handling

### Platform Administration

- **User Management**: View, manage, and monitor all platform users
- **Consultant Approvals**: Review and approve/reject consultant profiles
- **Service Approvals**: Manage consultant service applications
- **Analytics**: Platform-wide metrics, revenue tracking, growth statistics
- **Activity Monitoring**: Track recent platform activities and events

### Performance & Scalability

- **Pagination**: Efficient data loading with pagination on all list endpoints
- **Caching**: LRU cache (max 1000 entries) with automatic cleanup
- **Scheduled Jobs**: Automated reminders (hourly) and payouts (daily at 2 AM)
- **Optimized Queries**: Database query optimization with Firestore indexes
- **Request Timeouts**: Protection against hanging requests

## Technology Stack

### Mobile App
- **Framework**: React Native 0.82.1 (Hermes engine)
- **Language**: TypeScript 5.8
- **React**: React 19.1.1
- **Navigation**: React Navigation 7
- **State Management**: React Context API
- **Authentication**: Firebase Auth (Email/Password, Social Logins)
- **Database**: Firebase Firestore (real-time), Firebase Realtime Database (chat)
- **Storage**: Firebase Storage, Cloudinary
- **Push Notifications**: Firebase Cloud Messaging
- **Payments**: Stripe React Native SDK
- **Calls**: WebRTC (react-native-webrtc)
- **UI**: Custom components with StyleSheet, Lucide React Native icons

### Backend API
- **Runtime**: Node.js ≥ 20
- **Framework**: Express 5.1.0
- **Language**: TypeScript 5.9.3
- **Database**: Firebase Firestore
- **Authentication**: Firebase Admin SDK
- **Storage**: Firebase Storage, Cloudinary
- **Payments**: Stripe (Payment Intents, Connect for payouts)
- **Email**: Nodemailer (SMTP)
- **File Upload**: Multer, multer-storage-cloudinary
- **Validation**: express-validator 7.3.0
- **Testing**: Jest, Supertest

### Web Dashboard
- **Framework**: Next.js 15.5.4 (App Router with Turbopack)
- **React**: React 19.1.0
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4.0
- **Authentication**: Firebase Web SDK
- **HTTP Client**: Axios 1.12.2
- **Icons**: Lucide React

### Infrastructure & Services
- **Database**: Firebase Firestore
- **Authentication**: Firebase Authentication
- **Storage**: Firebase Storage, Cloudinary
- **Payments**: Stripe
- **Push Notifications**: Firebase Cloud Messaging
- **Email**: SMTP (Gmail, AWS SES, etc.)

## Project Structure

```
Tray/
├── app/                           # React Native mobile app (iOS & Android)
│   ├── src/
│   │   ├── Screen/               # Screen components (80+ screens)
│   │   │   ├── Auth/            # Authentication screens
│   │   │   ├── Student/         # Student role screens
│   │   │   ├── Consultant/      # Consultant role screens
│   │   │   ├── Recruiter/       # Recruiter role screens
│   │   │   ├── Admin/           # Admin role screens
│   │   │   └── common/          # Shared screens
│   │   ├── components/          # Reusable components (28+ UI, 4 consultant, 3 shared)
│   │   ├── services/            # API service layer (18 services)
│   │   ├── contexts/            # React Context providers (4 contexts)
│   │   ├── navigator/           # Navigation configuration (8 navigators)
│   │   ├── hooks/               # Custom React hooks (8 hooks)
│   │   ├── lib/                 # Core libraries (firebase, fetcher)
│   │   ├── webrtc/              # WebRTC configuration
│   │   ├── utils/               # Utility functions
│   │   └── constants/           # Constants and styles (81 style files)
│   ├── android/                 # Android native project
│   ├── ios/                     # iOS native project
│   └── README.md                # Mobile app documentation
│
├── backend/                      # Node.js/Express REST API
│   ├── src/
│   │   ├── routes/              # Express route definitions (15 routes)
│   │   ├── controllers/         # Route handlers (17 controllers)
│   │   ├── services/            # Business logic layer (11 services)
│   │   ├── models/              # Data models (7 models)
│   │   ├── middleware/          # Express middleware (3 middleware)
│   │   ├── utils/               # Utility functions (5 utils)
│   │   ├── config/              # Firebase Admin SDK configuration
│   │   ├── app.ts               # Express app configuration
│   │   └── server.ts            # HTTP server with scheduled jobs
│   ├── scripts/                 # Utility scripts (create admin, consultant)
│   └── README.md                # Backend API documentation
│
├── web/                          # Next.js admin dashboard
│   ├── app/                     # Next.js App Router pages
│   │   └── (root)/admin/        # Admin dashboard routes (7 pages)
│   ├── components/
│   │   ├── admin/               # Admin-specific components (9 components)
│   │   ├── shared/              # Shared layout components (4 components)
│   │   └── ui/                  # Generic UI components (14 components)
│   ├── contexts/                # Authentication context
│   ├── utils/                   # API client and utilities
│   └── README.md                # Web dashboard documentation
│
├── firebase/                     # Firebase project configuration
│   ├── firestore.rules          # Firestore security rules
│   ├── firestore.indexes.json   # Firestore indexes
│   └── firebase.json            # Firebase configuration
│
└── README.md                     # This file
```

## Quick Start

### Prerequisites

- **Node.js** ≥ 20
- **npm** or **yarn**
- **Firebase Project** with:
  - Firestore Database enabled
  - Authentication enabled (Email/Password, Social providers)
  - Realtime Database enabled (for chat)
  - Cloud Storage enabled
  - Cloud Messaging enabled
  - Service account JSON file
- **Stripe Account** with:
  - Secret key (test/live)
  - Connect accounts enabled for payouts
- **Cloudinary Account** for media storage
- **SMTP Credentials** for transactional emails
- **iOS Development** (for iOS): Xcode 15+, CocoaPods
- **Android Development** (for Android): Android Studio, SDK 34, Java 17

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Tray
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   # Create .env file with required variables (see Environment Setup)
   npm run dev
   ```
   Backend will run on `http://localhost:4000`

3. **Mobile App Setup**
   ```bash
   cd app
   npm install
   # Create .env file with required variables
   # iOS: cd ios && bundle install && bundle exec pod install && cd ..
   # Android: Ensure Android Studio is set up
   npm start
   # In separate terminal: npm run ios  # or npm run android
   ```

4. **Web Dashboard Setup**
   ```bash
   cd web
   npm install
   # Create .env.local file with required variables
   npm run dev
   ```
   Web dashboard will run on `http://localhost:3000`

5. **Firebase Configuration**
   - Deploy Firestore rules and indexes:
   ```bash
   firebase deploy --only firestore:rules,firestore:indexes
   ```
   - Or manually update in Firebase Console

## Environment Setup

Each platform requires specific environment variables. See detailed documentation:

### Backend Environment Variables

Create `backend/.env`:

```env
PORT=4000
NODE_ENV=development
BASE_URL=http://localhost:4000
SERVICE_ACCOUNT_PATH=./src/config/service-account.json
STRIPE_SECRET_KEY=sk_test_...
PLATFORM_FEE_AMOUNT=5.00
MINIMUM_PAYOUT_AMOUNT=10
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_EMAIL=...
SMTP_PASSWORD=...
```

**Full documentation**: [backend/README.md#environment-variables](./backend/README.md#environment-variables)

### Mobile App Environment Variables

Create `app/.env`:

```env
API_URL=http://localhost:4000  # Use ngrok URL for physical devices
FIREBASE_API_KEY=...
FIREBASE_AUTH_DOMAIN=...
FIREBASE_PROJECT_ID=...
FIREBASE_STORAGE_BUCKET=...
FIREBASE_MESSAGING_SENDER_ID=...
FIREBASE_APP_ID=...
FIREBASE_DATABASE_URL=...
STRIPE_PUBLISHABLE_KEY=pk_test_...
GOOGLE_WEB_CLIENT_ID=...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_UPLOAD_PRESET=...
```

**Full documentation**: [app/README.md#environment-configuration](./app/README.md#environment-configuration)

### Web Dashboard Environment Variables

Create `web/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=...  # Optional
```

**Full documentation**: [web/README.md#environment-variables](./web/README.md#environment-variables)

**Important**: Never commit `.env` files to version control.

## Development

### Running All Platforms

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Mobile App (Metro):**
```bash
cd app
npm start
```

**Terminal 3 - Mobile App (iOS/Android):**
```bash
cd app
npm run ios    # or npm run android
```

**Terminal 4 - Web Dashboard:**
```bash
cd web
npm run dev
```

### Development URLs

- **Backend API**: http://localhost:4000
- **Backend Health Check**: http://localhost:4000/health
- **Web Dashboard**: http://localhost:3000
- **Mobile App**: Metro bundler on port 8081 (default)

### Testing

**Backend Tests:**
```bash
cd backend
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

**Mobile App Tests:**
```bash
cd app
npm test              # Run Jest tests
npm run lint          # Lint code
```

**Web Dashboard Tests:**
```bash
cd web
npm run lint          # ESLint
```

## Documentation

### Platform-Specific Documentation

All documentation is organized by platform:

- **[Mobile App](./app/README.md)** - React Native app setup, features, navigation, components, screens, services
- **[Backend API](./backend/README.md)** - REST API setup, endpoints, services, deployment, scheduled jobs
- **[Web Dashboard](./web/README.md)** - Admin dashboard setup, pages, components, authentication

Each platform's README file contains comprehensive documentation including:
- Project structure and file organization
- Environment configuration
- Installation and setup instructions
- Development workflow
- API endpoints and integrations
- Deployment guides
- Troubleshooting tips

## Deployment

### Backend Deployment

**Production Build:**
```bash
cd backend
npm run build:clean
npm run start:prod
```

**Platforms**: Vercel (serverless), PM2, Docker, Cloud Run, EC2

**Important**: Schedule automated reminders and payouts using Cloud Scheduler or cron.

### Mobile App Deployment

**iOS:**
1. Update version in Xcode (`ios/app.xcworkspace`)
2. Archive and upload via Xcode
3. Submit to App Store Connect

**Android:**
```bash
cd app/android
./gradlew bundleRelease  # AAB for Play Store
# or
./gradlew assembleRelease # APK
```

### Web Dashboard Deployment

**Production Build:**
```bash
cd web
npm run build
npm run start
```

**Platforms**: Vercel (recommended), Netlify, AWS Amplify, Docker

**Post-Deployment:**
- Add deployment URL to Firebase Authorized Domains
- Update backend CORS settings
- Verify environment variables are set

### Deployment Checklist

- [ ] Set production environment variables for all platforms
- [ ] Update Firebase security rules (`firebase/firestore.rules`)
- [ ] Deploy Firestore indexes (`firebase/firestore.indexes.json`)
- [ ] Configure CORS for production domains (backend)
- [ ] Set up SSL/HTTPS certificates
- [ ] Configure Stripe production keys
- [ ] Set up monitoring and logging
- [ ] Configure scheduled jobs (reminders, payouts)
- [ ] Test all critical user flows
- [ ] Verify push notifications work
- [ ] Test payment flows end-to-end

## Features by Role

### Student Features
- Browse consultants and services
- Book consultation sessions
- Manage bookings and cart
- Make payments via Stripe
- Review and rate consultants
- Apply for jobs
- View and manage resume
- Real-time chat with consultants
- Audio/video calls
- Receive push notifications

### Consultant Features
- Manage consultant profile (via mobile app)
- Create and manage services
- Set availability and time slots
- View bookings and clients
- Track earnings and payouts
- Post jobs
- Review job applications
- Real-time chat with students
- Audio/video calls
- Stripe Connect setup for payouts

### Recruiter Features
- Post and manage jobs
- Review job applications
- View application details
- Manage candidate pipeline
- Recruiter dashboard with statistics

### Admin Features
- **Mobile App**: Review refund requests
- **Web Dashboard**: 
  - Platform-wide analytics
  - User management
  - Consultant profile approvals
  - Service application approvals
  - Activity monitoring
  - Platform settings

## System Requirements

### Development

- **Node.js**: ≥ 20
- **npm**: Latest version
- **iOS**: macOS with Xcode 15+, CocoaPods
- **Android**: Android Studio, SDK 34, Java 17
- **Firebase Project**: Configured with all services enabled

### Production

- **Backend**: Node.js 20+ runtime environment
- **Mobile**: iOS 13+ (iPhone/iPad), Android 8+ (API level 26+)
- **Web**: Modern browsers (Chrome, Firefox, Safari, Edge)
- **Firebase**: Blaze plan (for production)
- **Stripe**: Live account with Connect enabled
- **Cloudinary**: Production account

## Performance Optimizations

### Backend
- ✅ Pagination on all list endpoints
- ✅ LRU cache (max 1000 entries) with automatic cleanup
- ✅ Database query optimization with Firestore indexes
- ✅ Scheduled job timeouts (30 min reminders, 2 hour payouts)
- ✅ Request timeout protection (12 seconds for auth)

### Mobile App
- ✅ Image caching
- ✅ Lazy loading and pagination support
- ✅ Offline message queue
- ✅ Network status handling
- ⚠️ Code splitting (to be implemented)

### Web Dashboard
- ✅ Next.js automatic optimization
- ✅ Server-side rendering
- ✅ Auto-refresh with 5-minute intervals
- ⚠️ Image optimization (to be implemented)

## Security

### Authentication
- Firebase Authentication for user management
- JWT tokens (Firebase ID tokens) for API authentication
- Role-based access control (RBAC)
- Email verification support

### Data Security
- Firestore security rules for client-side access control
- Backend middleware for server-side authentication/authorization
- Input validation with express-validator
- CORS configuration
- HTTPS only in production

### Payment Security
- Stripe Payment Intents (secure payment processing)
- Stripe Connect for consultant payouts
- No card data stored on platform
- PCI compliance via Stripe

## Troubleshooting

### Common Issues

**Backend won't start:**
- Verify Firebase service account path is correct
- Check all environment variables are set
- Ensure port 4000 is available
- Review backend logs for errors

**Mobile app build fails:**
- iOS: Run `cd ios && bundle install && bundle exec pod install`
- Android: Clear Gradle cache with `cd android && ./gradlew clean`
- Verify Firebase config files are present (`google-services.json`, `GoogleService-Info.plist`)

**Web dashboard authentication issues:**
- Verify Firebase config in `.env.local`
- Check backend CORS settings
- Ensure backend API URL is correct
- Verify user has admin role in Firestore

**API connection issues:**
- Verify `API_URL` points to correct backend (not localhost for physical devices)
- Check backend server is running: `curl http://localhost:4000/health`
- Verify CORS settings in backend
- Check network logs in browser/console

### Getting Help

- 📖 Check platform-specific README files:
  - [Mobile App README](./app/README.md)
  - [Backend README](./backend/README.md)
  - [Web Dashboard README](./web/README.md)
- 🔍 Review platform-specific documentation for code structure and architecture
- 🐛 Review error logs and browser console
- 💬 Check existing issues or create new ones

## Contributing

We welcome contributions! Please follow these guidelines:

1. **Fork the repository** and create a feature branch
2. **Follow code style**: Use TypeScript, follow existing patterns
3. **Write tests**: Add tests for new features
4. **Update documentation**: Update relevant README files
5. **Test thoroughly**: Test on all affected platforms
6. **Submit a pull request**: Include description of changes

### Development Guidelines

- Follow TypeScript best practices
- Use meaningful commit messages
- Keep components/modules small and focused
- Add JSDoc comments for complex functions
- Follow existing architecture patterns
- Maintain type safety across all platforms
- Handle errors gracefully with user-friendly messages

## License

[Your License Here]

## Project Statistics

- **Total Files**: 300+ TypeScript/JavaScript files
- **Mobile App Screens**: 80+ screens
- **Backend API Endpoints**: 100+ endpoints
- **Components**: 50+ reusable components
- **Services**: 29+ service files (18 mobile, 11 backend)
- **Roles**: 4 roles (Student, Consultant, Recruiter, Admin)

## Support & Resources

### Documentation Links

- [Mobile App README](./app/README.md) - Complete mobile app documentation
- [Backend API README](./backend/README.md) - Complete backend API documentation
- [Web Dashboard README](./web/README.md) - Complete web dashboard documentation

### External Resources

- [React Native Documentation](https://reactnative.dev/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Express.js Documentation](https://expressjs.com/)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Stripe Documentation](https://stripe.com/docs)

## Roadmap

### Planned Features
- [ ] Rate limiting for API endpoints
- [ ] Enhanced test coverage across all platforms
- [ ] Error boundaries for React components
- [ ] Real-time updates via WebSockets
- [ ] Advanced analytics dashboard
- [ ] Multi-language support (i18n)
- [ ] Code splitting for mobile app
- [ ] Image optimization pipeline
- [ ] CDN integration

---

**Built with ❤️ using React Native, Node.js, Next.js, and Firebase**

**Last Updated**: Based on complete project analysis  
**Version**: 1.0.0

