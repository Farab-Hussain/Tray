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
│   │   ├── Screen/               # Screen components (72 screens)
│   │   │   ├── Auth/            # Authentication screens
│   │   │   ├── Student/         # Student role screens
│   │   │   ├── Consultant/      # Consultant role screens
│   │   │   ├── Recruiter/       # Recruiter role screens
│   │   │   ├── Admin/           # Admin role screens
│   │   │   └── common/          # Shared screens
│   │   ├── components/          # Reusable components (29 UI, 4 consultant, 3 shared)
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
│   │   └── (root)/admin/        # Admin dashboard routes (7 admin pages + 6 consultant pages)
│   ├── components/
│   │   ├── admin/               # Admin-specific components (9 components)
│   │   ├── consultant/          # Consultant-specific components (6 components)
│   │   ├── shared/              # Shared layout components (4 components)
│   │   ├── ui/                  # Generic UI components (14 components)
│   │   └── custom/              # Custom components (1 component)
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

## Complete File Structure & Documentation

### 📱 Mobile App (`/app`)

#### Core Application Files
- **`App.tsx`** - Main application entry point, initializes providers (Auth, Chat, Notification, Network), Stripe integration, error boundaries
- **`app.json`** - React Native app configuration (name: "Tray", displayName: "Tray")
- **`package.json`** - Dependencies and scripts for React Native app

#### Source Directory (`/app/src`)

##### Screens (`/app/src/Screen`) - 72 Total Screens

**Authentication Screens (`/Screen/Auth/`) - 6 screens:**
- Login screens (email/password, social login)
- Registration screens
- Email verification
- Password reset
- Forgot password

**Student Screens (`/Screen/Student/`) - 20 screens:**
- **`Home/home.tsx`** - Student dashboard/home screen
- **`Profile/StudentProfile.tsx`** - Student profile management
- **`Availability/StudentAvailability.tsx`** - Set work availability
- **`Consultants/AllConsultants.tsx`** - Browse all consultants
- **`Consultants/BookedConsultants.tsx`** - View booked consultants
- **`Consultants/ConsultantBookings.tsx`** - Manage bookings
- **`Services/Services.tsx`** - Browse consultant services
- **`Booking/BookingSlots.tsx`** - Select booking time slots
- **`Cart/Cart.tsx`** - Shopping cart for bookings
- **`Payment/PaymentScreen.tsx`** - Stripe payment processing
- **`Jobs/JobListScreen.tsx`** - Browse available jobs
- **`Jobs/JobDetailScreen.tsx`** - View job details
- **`Jobs/MyApplicationsScreen.tsx`** - Track job applications
- **`Jobs/ApplicationDetailScreen.tsx`** - View application details
- **`Jobs/ResumeScreen.tsx`** - Resume creation and management
- **`Review/AllReviews.tsx`** - View all reviews
- **`Review/MyReviews.tsx`** - User's reviews
- **`Review/EditReview.tsx`** - Edit existing reviews
- **`Review/ReviewEmployer.tsx`** - Review employers
- **`SessionRating/SessionRatingScreen.tsx`** - Rate completed sessions

**Consultant Screens (`/Screen/Consultant/`) - 24 screens:**
- **`Home/ConsultantHome.tsx`** - Consultant dashboard
- **`Dashboard/ConsultantDashboard.tsx`** - Analytics and overview
- **`Profile/ConsultantProfile.tsx`** - Profile management
- **`Profile/ConsultantProfileFlow.tsx`** - Onboarding flow
- **`Verification/ConsultantVerificationFlow.tsx`** - Verification process
- **`PendingApproval.tsx`** - Waiting for admin approval
- **`Services/ConsultantServices.tsx`** - Manage services
- **`ServiceSetup/ConsultantServiceSetupScreen.tsx`** - Create/edit services
- **`Applications/BrowseServicesScreen.tsx`** - Browse service applications
- **`Applications/ConsultantApplicationsScreen.tsx`** - Service applications
- **`Availability/ConsultantAvailability.tsx`** - Set availability
- **`Slots/ConsultantSlots.tsx`** - Manage time slots
- **`Clients/MyClients.tsx`** - View all clients
- **`Earnings/Earnings.tsx`** - Earnings dashboard and analytics
- **`Payment/StripePaymentSetup.tsx`** - Stripe Connect setup
- **`Jobs/MyJobsScreen.tsx`** - Posted jobs
- **`Jobs/AllApplicationsScreen.tsx`** - All job applications
- **`Jobs/JobApplicationsScreen.tsx`** - Applications for specific job
- **`Jobs/ApplicationReviewScreen.tsx`** - Review applications
- **`Messages/ConsultantMessages.tsx`** - Chat interface
- **`Notifications/ConsultantNotifications.tsx`** - Notification center
- **`Reviews/ConsultantReviews.tsx`** - View reviews received
- **`SessionCompletion/ConsultantSessionCompletion.tsx`** - Complete sessions
- **`Account/ConsultantAccount.tsx`** - Account settings

**Recruiter Screens (`/Screen/Recruiter/`) - 7 screens:**
- Recruiter dashboard
- Job posting screens
- Application management
- Candidate review screens
- Recruiter profile

**Admin Screens (`/Screen/Admin/`) - 1 screen:**
- **`AdminRefundRequests.tsx`** - Review and process refund requests

**Common Screens (`/Screen/common/`) - 12 screens:**
- Chat screens (conversation list, chat interface)
- Call screens (video/audio call interface)
- Profile screens (shared profile components)
- Settings screens
- Help/Support screens
- Notification screens
- Search screens

**Splash Screens (`/Screen/Splash/`) - 2 screens:**
- App loading/splash screen
- Initialization screen

##### Components (`/app/src/components`) - 36 Total Components

**UI Components (`/components/ui/`) - 29 components:**
- **`Button.tsx`** - Reusable button component
- **`Input.tsx`** - Text input component
- **`Card.tsx`** - Card container component
- **`Modal.tsx`** - Modal dialog component
- **`LoadingSpinner.tsx`** - Loading indicator
- **`ErrorBoundary.tsx`** - Error boundary wrapper
- **`OfflineOverlay.tsx`** - Network status overlay
- **`Toast.tsx`** - Toast notification wrapper
- **`Avatar.tsx`** - User avatar component
- **`Badge.tsx`** - Badge/status indicator
- **`Checkbox.tsx`** - Checkbox input
- **`RadioButton.tsx`** - Radio button input
- **`Switch.tsx`** - Toggle switch
- **`Picker.tsx`** - Dropdown picker
- **`DatePicker.tsx`** - Date selection component
- **`TimePicker.tsx`** - Time selection component
- **`ImagePicker.tsx`** - Image selection component
- **`FilePicker.tsx`** - File selection component
- **`Rating.tsx`** - Star rating component
- **`ProgressBar.tsx`** - Progress indicator
- **`Skeleton.tsx`** - Loading skeleton
- **`EmptyState.tsx`** - Empty state placeholder
- **`SearchBar.tsx`** - Search input component
- **`Filter.tsx`** - Filter component
- **`Pagination.tsx`** - Pagination controls
- **`Tabs.tsx`** - Tab navigation component
- **`Accordion.tsx`** - Expandable accordion
- **`Tooltip.tsx`** - Tooltip component
- **`Divider.tsx`** - Visual divider

**Consultant Components (`/components/consultant/`) - 4 components:**
- **`ServiceCard.tsx`** - Service display card
- **`AvailabilityCard.tsx`** - Availability display
- **`EarningsCard.tsx`** - Earnings summary card
- **`ClientCard.tsx`** - Client information card

**Shared Components (`/components/shared/`) - 3 components:**
- **`Header.tsx`** - Shared header component
- **`Footer.tsx`** - Shared footer component
- **`NavigationBar.tsx`** - Navigation bar component

##### Services (`/app/src/services`) - 18 Service Files

- **`booking.service.ts`** - Booking CRUD operations, slot management
- **`bookingRequest.service.ts`** - Booking request management
- **`call.service.ts`** - WebRTC call initiation and management
- **`chat.Service.ts`** - Real-time chat messaging
- **`consultant.service.ts`** - Consultant profile and data management
- **`consultantFlow.service.ts`** - Consultant onboarding flow
- **`email.service.ts`** - Email sending functionality
- **`job.service.ts`** - Job posting and management
- **`notification-storage.service.ts`** - Local notification storage
- **`notification.service.ts`** - Push notification management
- **`offline-message-queue.service.ts`** - Offline message queuing
- **`payment.service.ts`** - Stripe payment processing
- **`resume.service.ts`** - Resume CRUD operations
- **`review.service.ts`** - Review and rating management
- **`sessionCompletion.service.ts`** - Session completion workflow
- **`support.service.ts`** - Support ticket management
- **`upload.service.ts`** - File upload to Cloudinary/Firebase
- **`user.service.ts`** - User profile and authentication

##### Contexts (`/app/src/contexts`) - 4 Context Providers

- **`AuthContext.tsx`** - Authentication state management, user session
- **`ChatContext.tsx`** - Real-time chat state, message management
- **`NetworkContext.tsx`** - Network connectivity status
- **`NotificationContext.tsx`** - Push notification state and handlers

##### Navigation (`/app/src/navigator`) - 8 Navigator Files

- **`RootNavigation.tsx`** - Root navigation container
- **`AuthNavigation.tsx`** - Authentication flow navigation
- **`BottomNavigation.tsx`** - Student bottom tab navigation
- **`ConsultantBottomNavigation.tsx`** - Consultant bottom tab navigation
- **`HomeStackNavigator.tsx`** - Home stack navigation
- **`ServicesStackNavigator.tsx`** - Services stack navigation
- **`ScreenNavigator.tsx`** - Screen navigation configuration
- **`navigationRef.ts`** - Navigation reference for programmatic navigation

##### Hooks (`/app/src/hooks`) - 8 Custom Hooks

- **`useAutoRefresh.ts`** - Auto-refresh data hook
- **`useChat.ts`** - Chat functionality hook
- **`useLogin.ts`** - Login logic hook
- **`usePagination.ts`** - Pagination logic hook
- **`useRefresh.ts`** - Pull-to-refresh hook
- **`useRegister.ts`** - Registration logic hook
- **`useSocialLogin.ts`** - Social authentication hook

##### Libraries (`/app/src/lib`)

- **`firebase.ts`** - Firebase SDK initialization and configuration
- **`fetcher.ts`** - API client with axios, authentication headers, error handling

##### WebRTC (`/app/src/webrtc`)

- **`webrtc.config.ts`** - WebRTC configuration for video/audio calls
- **`config/webrtc.config.example.ts`** - Example WebRTC configuration

##### Utilities (`/app/src/utils`) - 11 Utility Files

- Environment validation utilities
- Date/time formatting
- Currency formatting
- Image processing
- File handling
- Validation helpers
- Error handling utilities
- Network utilities
- Storage utilities
- String manipulation
- Type guards

##### Constants (`/app/src/constants`)

**Styles (`/constants/styles/`) - 81 Style Files:**
- Component-specific style files
- Theme configuration
- Color constants
- Typography styles
- Spacing constants
- Layout styles

**Core (`/constants/core/`) - 2 Files:**
- App configuration constants
- Feature flags

**Data (`/constants/data/`) - 5 Files:**
- Static data (job categories, skills, etc.)
- Dropdown options
- Default values

##### Types (`/app/src/types`)

- **`chatTypes.ts`** - Chat-related TypeScript types
- **`env.d.ts`** - Environment variable type definitions
- **`svg.d.ts`** - SVG module type definitions

##### Assets (`/app/src/assets`)

- **`icon/`** - App icons (3 PNG files, 1 SVG)
- **`image/`** - Images (6 PNG files)
- **`font/`** - Custom fonts
- **`videos/`** - Video assets (1 MP4)

##### Configuration Files

- **`styles/global.css`** - Global CSS styles
- **`config/webrtc.config.ts`** - WebRTC configuration

---

### 🔧 Backend API (`/backend`)

#### Core Application Files

- **`package.json`** - Backend dependencies and scripts
- **`vercel.json`** - Vercel deployment configuration
- **`tsconfig.json`** - TypeScript configuration

#### Source Directory (`/backend/src`)

##### Routes (`/backend/src/routes`) - 15 Route Files

- **`activity.routes.ts`** - Activity tracking endpoints
- **`analytics.routes.ts`** - Analytics and reporting endpoints
- **`auth.routes.ts`** - Authentication endpoints (login, register, social)
- **`booking.routes.ts`** - Booking management endpoints
- **`consultant.routes.ts`** - Consultant profile endpoints
- **`consultantFlow.routes.ts`** - Consultant onboarding endpoints
- **`fcm.routes.ts`** - Firebase Cloud Messaging endpoints
- **`job.routes.ts`** - Job posting and management endpoints
- **`notification.routes.ts`** - Notification management endpoints
- **`payment.routes.ts`** - Payment processing endpoints
- **`reminder.routes.ts`** - Appointment reminder endpoints
- **`resume.routes.ts`** - Resume management endpoints
- **`review.routes.ts`** - Review and rating endpoints
- **`support.routes.ts`** - Support ticket endpoints
- **`upload.routes.ts`** - File upload endpoints

##### Controllers (`/backend/src/controllers`) - 17 Controller Files

- **`activity.controller.ts`** - Activity tracking logic
- **`analytics.controller.ts`** - Analytics calculation and aggregation
- **`auth.Controller.ts`** - Authentication logic (login, register, token verification)
- **`booking.controller.ts`** - Booking CRUD operations, slot management
- **`consultant.controller.ts`** - Consultant profile management
- **`consultantFlow.controller.ts`** - Consultant onboarding workflow
- **`fcm.controller.ts`** - Push notification sending
- **`job.controller.ts`** - Job CRUD operations
- **`jobApplication.controller.ts`** - Job application management
- **`notification.controller.ts`** - Notification management
- **`payment.controller.ts`** - Stripe payment processing
- **`payout.controller.ts`** - Consultant payout management
- **`reminder.controller.ts`** - Automated reminder scheduling
- **`resume.controller.ts`** - Resume CRUD operations
- **`review.controller.ts`** - Review and rating management
- **`support.controller.ts`** - Support ticket handling
- **`upload.controller.ts`** - File upload handling (Cloudinary)

##### Services (`/backend/src/services`) - 11 Service Files

- **`analytics.service.ts`** - Analytics calculations, metrics aggregation
- **`consultant.service.ts`** - Consultant business logic
- **`consultantFlow.service.ts`** - Consultant onboarding logic
- **`job.service.ts`** - Job business logic, matching algorithms
- **`jobApplication.service.ts`** - Application processing, skill matching
- **`payment.service.ts`** - Stripe integration, payment intents
- **`payout.service.ts`** - Automated payout processing, Stripe Connect
- **`platformSettings.service.ts`** - Platform configuration management
- **`reminder.service.ts`** - Automated reminder scheduling and sending
- **`resume.service.ts`** - Resume processing and parsing
- **`review.service.ts`** - Review aggregation, rating calculations

##### Models (`/backend/src/models`) - 7 Model Files

- **`consultant.model.ts`** - Consultant data model and validation
- **`consultantApplication.model.ts`** - Consultant application model
- **`consultantProfile.model.ts`** - Consultant profile model
- **`job.model.ts`** - Job posting model
- **`jobApplication.model.ts`** - Job application model
- **`resume.model.ts`** - Resume data model
- **`review.model.ts`** - Review and rating model

##### Middleware (`/backend/src/middleware`) - 3 Middleware Files

- **`authMiddleware.ts`** - Firebase token verification, user authentication
- **`consultantMiddleware.ts`** - Consultant role verification
- **`validation.ts`** - Request validation using express-validator

##### Utilities (`/backend/src/utils`) - 6 Utility Files

- Error handling utilities
- Date/time utilities
- Validation helpers
- Email utilities
- File processing utilities
- Payment utilities

##### Configuration (`/backend/src/config`)

- **`config.ts`** - Application configuration
- **`firebase.ts`** - Firebase Admin SDK initialization
- **`service-account.json`** - Firebase service account credentials (not in repo)

##### Core Application Files

- **`app.ts`** - Express application setup, middleware configuration, route registration
- **`server.ts`** - HTTP server initialization, scheduled jobs (reminders, payouts), Firebase verification

##### Functions (`/backend/src/functions`)

- **`sendMessageNotification.function.ts`** - FCM notification sending function

##### Tests (`/backend/src/__tests__`)

- **`health.test.ts`** - Health check endpoint tests
- **`validation.test.ts`** - Validation middleware tests

##### Scripts (`/backend/scripts`)

- **`createAdmin.ts`** - Script to create admin users
- **`createConsultant.ts`** - Script to create consultant users

---

### 🌐 Web Dashboard (`/web`)

#### Core Application Files

- **`package.json`** - Next.js dependencies and scripts
- **`next.config.js`** - Next.js configuration
- **`tailwind.config.js`** - Tailwind CSS configuration
- **`tsconfig.json`** - TypeScript configuration

#### App Directory (`/web/app`)

##### Admin Pages (`/app/(root)/admin`) - 7 Admin Pages

- **`page.tsx`** - Admin dashboard home
- **`layout.tsx`** - Admin layout wrapper
- **`users/page.tsx`** - User management page
- **`consultant-profiles/page.tsx`** - Consultant approval page
- **`service-applications/page.tsx`** - Service application approvals
- **`analytics/page.tsx`** - Analytics dashboard
- **`activity/page.tsx`** - Activity monitoring
- **`settings/page.tsx`** - Platform settings

##### Public Pages (`/app`) - 8 Public Pages

- **`page.tsx`** - Landing/home page
- **`layout.tsx`** - Root layout
- **`login/page.tsx`** - Admin login page
- **`verify-email/page.tsx`** - Email verification page
- **`privacy-policy/page.tsx`** - Privacy policy page
- **`terms/page.tsx`** - Terms of service page
- **`delete-user-data/page.tsx`** - Data deletion request page
- **`api/verify-email/`** - Email verification API route

#### Components (`/web/components`)

##### Admin Components (`/components/admin`) - 9 Components

- User management components
- Consultant approval components
- Service application components
- Analytics visualization components
- Activity feed components
- Settings form components

##### Consultant Components (`/components/consultant`) - 6 Components

- Consultant profile components
- Service management components
- Application review components

##### Shared Components (`/components/shared`) - 4 Components

- **`Layout.tsx`** - Shared layout wrapper
- **`Header.tsx`** - Dashboard header
- **`Sidebar.tsx`** - Navigation sidebar
- **`Footer.tsx`** - Dashboard footer

##### UI Components (`/components/ui`) - 14 Components

- **`Button.tsx`** - Button component
- **`Input.tsx`** - Input component
- **`Card.tsx`** - Card component
- **`Modal.tsx`** - Modal component
- **`Table.tsx`** - Data table component
- **`Chart.tsx`** - Chart visualization
- **`Badge.tsx`** - Badge component
- **`Avatar.tsx`** - Avatar component
- **`Dropdown.tsx`** - Dropdown menu
- **`Pagination.tsx`** - Pagination controls
- **`Loading.tsx`** - Loading spinner
- **`EmptyState.tsx`** - Empty state
- **`Alert.tsx`** - Alert component
- **`Tooltip.tsx`** - Tooltip component

##### Custom Components (`/components/custom`) - 1 Component

- Custom business logic components

#### Contexts (`/web/contexts`)

- **`AuthContext.tsx`** - Authentication context for admin users

#### Utilities (`/web/utils`)

- **`api.ts`** - API client with axios
- **`auth.ts`** - Authentication utilities
- **`format.ts`** - Data formatting utilities

---

### 🔥 Firebase Configuration (`/firebase`)

- **`firestore.rules`** - Firestore security rules for data access control
- **`firestore.indexes.json`** - Firestore database indexes for query optimization
- **`firebase.json`** - Firebase project configuration

---

### 📄 Root Level Files

- **`README.md`** - This comprehensive documentation file
- **`ABOUT.md`** - Project description and technology stack overview
- **`FEATURE_CHECKLIST.md`** - Complete feature implementation checklist with timeline estimates
- **`.gitignore`** - Git ignore patterns
- **`.env.example`** - Example environment variable files (if present)

---

## File Count Summary

### Mobile App (`/app`)
- **Screens**: 72 screens (6 Auth + 20 Student + 24 Consultant + 7 Recruiter + 1 Admin + 12 Common + 2 Splash)
- **Components**: 36 components (29 UI + 4 Consultant + 3 Shared)
- **Services**: 18 service files
- **Contexts**: 4 context providers
- **Navigators**: 8 navigation files
- **Hooks**: 8 custom hooks
- **Style Files**: 81 style files
- **Utility Files**: 11 utility files
- **Total TypeScript/TSX Files**: ~250+ files

### Backend API (`/backend`)
- **Routes**: 15 route files
- **Controllers**: 17 controller files
- **Services**: 11 service files
- **Models**: 7 model files
- **Middleware**: 3 middleware files
- **Utils**: 6 utility files
- **Tests**: 2+ test files
- **Total TypeScript Files**: ~60+ files

### Web Dashboard (`/web`)
- **Pages**: 21 pages (7 admin + 8 public + 6 consultant)
- **Components**: 32 components (9 admin + 6 consultant + 4 shared + 14 UI)
- **Total TypeScript/TSX Files**: ~60+ files

### Total Project Files
- **Total TypeScript/JavaScript Files**: 370+ files
- **Total Configuration Files**: 20+ files
- **Total Documentation Files**: 5+ files
- **Grand Total**: 395+ files

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
BASE_URL=https://tray-ecru.vercel.app
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
NEXT_PUBLIC_API_URL=https://tray-ecru.vercel.app
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

## API Endpoints Overview

### Authentication Endpoints (`/api/auth`)
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/social-login` - Social authentication (Google, Facebook, Apple)
- `POST /api/auth/verify-email` - Email verification
- `POST /api/auth/reset-password` - Password reset
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update user profile

### Booking Endpoints (`/api/booking`)
- `GET /api/booking` - Get user bookings (paginated)
- `POST /api/booking` - Create new booking
- `GET /api/booking/:id` - Get booking details
- `PUT /api/booking/:id` - Update booking
- `DELETE /api/booking/:id` - Cancel booking
- `GET /api/booking/slots/:consultantId` - Get available time slots
- `POST /api/booking/complete/:id` - Mark booking as complete

### Consultant Endpoints (`/api/consultant`)
- `GET /api/consultant` - List consultants (paginated, filtered)
- `GET /api/consultant/:id` - Get consultant details
- `PUT /api/consultant/profile` - Update consultant profile
- `POST /api/consultant/availability` - Set availability
- `GET /api/consultant/services/:id` - Get consultant services
- `POST /api/consultant/apply` - Apply to become consultant
- `GET /api/consultant/earnings` - Get earnings data

### Job Endpoints (`/api/job`)
- `GET /api/job` - List jobs (paginated, filtered)
- `POST /api/job` - Create job posting
- `GET /api/job/:id` - Get job details
- `PUT /api/job/:id` - Update job
- `DELETE /api/job/:id` - Delete job
- `POST /api/job/:id/apply` - Apply for job
- `GET /api/job/applications/:jobId` - Get job applications
- `GET /api/job/my-applications` - Get user's applications

### Payment Endpoints (`/api/payment`)
- `POST /api/payment/create-intent` - Create Stripe payment intent
- `POST /api/payment/confirm` - Confirm payment
- `GET /api/payment/config` - Get Stripe publishable key
- `POST /api/payment/refund` - Process refund
- `GET /api/payment/history` - Get payment history

### Review Endpoints (`/api/review`)
- `GET /api/review/:consultantId` - Get consultant reviews
- `POST /api/review` - Create review
- `PUT /api/review/:id` - Update review
- `DELETE /api/review/:id` - Delete review
- `GET /api/review/employer/:employerId` - Get employer reviews

### Resume Endpoints (`/api/resume`)
- `GET /api/resume` - Get user's resume
- `POST /api/resume` - Create/update resume
- `DELETE /api/resume` - Delete resume
- `GET /api/resume/:id` - Get resume by ID

### Upload Endpoints (`/api/upload`)
- `POST /api/upload/image` - Upload image to Cloudinary
- `POST /api/upload/document` - Upload document
- `POST /api/upload/resume` - Upload resume PDF

### Notification Endpoints (`/api/notification`)
- `GET /api/notification` - Get notifications (paginated)
- `PUT /api/notification/:id/read` - Mark as read
- `PUT /api/notification/read-all` - Mark all as read
- `POST /api/notification/register-token` - Register FCM token

### Analytics Endpoints (`/api/analytics`)
- `GET /api/analytics/dashboard` - Get dashboard metrics (admin)
- `GET /api/analytics/revenue` - Get revenue statistics
- `GET /api/analytics/users` - Get user statistics
- `GET /api/analytics/bookings` - Get booking statistics

### Reminder Endpoints (`/api/reminder`)
- `POST /api/reminder/send` - Send manual reminder
- `GET /api/reminder/scheduled` - Get scheduled reminders

### Support Endpoints (`/api/support`)
- `POST /api/support/ticket` - Create support ticket
- `GET /api/support/tickets` - Get user's tickets
- `PUT /api/support/ticket/:id` - Update ticket

## Data Models

### User Model
```typescript
{
  uid: string;                    // Firebase Auth UID
  email: string;
  role: 'student' | 'consultant' | 'recruiter' | 'admin';
  displayName: string;
  photoURL?: string;
  phoneNumber?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Consultant Model
```typescript
{
  userId: string;                 // Reference to User
  status: 'pending' | 'approved' | 'rejected';
  bio: string;
  specialties: string[];
  experience: number;
  education: string[];
  certifications: string[];
  hourlyRate: number;
  stripeAccountId?: string;       // Stripe Connect account
  rating: number;                  // Average rating
  totalReviews: number;
  createdAt: Timestamp;
  approvedAt?: Timestamp;
}
```

### Booking Model
```typescript
{
  id: string;
  studentId: string;
  consultantId: string;
  serviceId: string;
  date: Timestamp;
  startTime: string;
  endTime: string;
  duration: number;                // Minutes
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  paymentIntentId: string;          // Stripe Payment Intent
  amount: number;
  platformFee: number;
  consultantEarning: number;
  createdAt: Timestamp;
}
```

### Job Model
```typescript
{
  id: string;
  recruiterId: string;
  title: string;
  description: string;
  company: string;
  location: string;
  jobType: 'full-time' | 'part-time' | 'contract' | 'internship';
  salary?: {
    min: number;
    max: number;
    currency: string;
  };
  requirements: string[];
  skills: string[];
  status: 'active' | 'closed' | 'draft';
  createdAt: Timestamp;
  expiresAt?: Timestamp;
}
```

### Resume Model
```typescript
{
  userId: string;
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address?: string;
  };
  summary: string;
  skills: {
    hard: string[];
    soft: string[];
  };
  workHistory: Array<{
    company: string;
    position: string;
    startDate: string;
    endDate?: string;
    description: string;
  }>;
  education: Array<{
    institution: string;
    degree: string;
    field: string;
    graduationDate: string;
  }>;
  certifications: Array<{
    name: string;
    issuer: string;
    date: string;
  }>;
  languages: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Review Model
```typescript
{
  id: string;
  reviewerId: string;              // Student who wrote review
  revieweeId: string;              // Consultant or Employer
  revieweeType: 'consultant' | 'employer';
  rating: number;                  // 1-5 stars
  comment: string;
  bookingId?: string;              // If review is for booking
  jobId?: string;                  // If review is for job
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

## Third-Party Integrations

### Firebase Services
- **Firebase Authentication**: Email/password, Google, Facebook, Apple Sign-In
- **Firestore Database**: Primary database for all data
- **Firebase Realtime Database**: Real-time chat messages
- **Firebase Storage**: File storage (images, documents)
- **Firebase Cloud Messaging (FCM)**: Push notifications
- **Firebase Admin SDK**: Server-side Firebase operations

### Stripe Integration
- **Payment Intents**: Secure payment processing for bookings
- **Stripe Connect**: Consultant payout system
- **Webhooks**: Payment status updates
- **Customer Portal**: Subscription management (future)

### Cloudinary Integration
- **Image Upload**: Profile images, service images
- **Document Upload**: Resume PDFs, certificates
- **Image Transformation**: Automatic resizing and optimization
- **CDN Delivery**: Fast image delivery

### Email Service (Nodemailer)
- **SMTP Configuration**: Gmail, AWS SES, or custom SMTP
- **Transactional Emails**: 
  - Welcome emails
  - Email verification
  - Booking confirmations
  - Appointment reminders
  - Password reset

## Scheduled Jobs & Automation

### Automated Reminders (`/backend/src/services/reminder.service.ts`)
- **Frequency**: Runs every hour
- **Function**: Sends 24-hour appointment reminders
- **Method**: Email + Push notifications
- **Timeout**: 30 minutes per run

### Automated Payouts (`/backend/src/services/payout.service.ts`)
- **Frequency**: Daily at 2:00 AM
- **Function**: Processes consultant payouts via Stripe Connect
- **Minimum Amount**: Configurable (default $10)
- **Method**: Stripe Transfer API
- **Timeout**: 2 hours per run

## Project Statistics

- **Total Files**: 395+ files (370+ TypeScript/JavaScript + 20+ config + 5+ docs)
- **Mobile App Screens**: 72 screens across all roles
- **Backend API Routes**: 15 route files with 100+ endpoints
- **Backend Controllers**: 17 controller files
- **Backend Services**: 11 service files
- **Mobile App Components**: 36 reusable components (29 UI, 4 consultant, 3 shared)
- **Mobile App Services**: 18 service files
- **Web Dashboard Components**: 32 components (9 admin, 6 consultant, 4 shared, 14 UI)
- **Web Dashboard Pages**: 21 pages (7 admin pages + 6 consultant pages + 8 public/auth pages)
- **Roles**: 4 roles (Student, Consultant, Recruiter, Admin)
- **API Endpoints**: 100+ REST API endpoints
- **Data Models**: 7 primary data models
- **Third-Party Integrations**: 4 major services (Firebase, Stripe, Cloudinary, Email)

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

## Development Workflow

### Code Organization Principles

1. **Separation of Concerns**: Clear separation between UI, business logic, and data layers
2. **Type Safety**: Full TypeScript implementation across all platforms
3. **Reusability**: Shared components and utilities across platforms
4. **Modularity**: Feature-based organization with clear boundaries
5. **Consistency**: Consistent naming conventions and file structure

### Build & Scripts

#### Mobile App Scripts (`/app/package.json`)
```bash
npm start                    # Start Metro bundler
npm run ios                  # Run on iOS simulator
npm run android              # Run on Android emulator
npm test                     # Run Jest tests
npm run lint                 # Run ESLint
npm run generate-icons       # Generate app icons
npm run wrap-console         # Wrap console statements for production
npm run verify-production    # Verify production build
npm run setup-keystore      # Setup Android keystore
```

#### Backend Scripts (`/backend/package.json`)
```bash
npm run dev                  # Development server with hot reload
npm run build                # Build TypeScript to JavaScript
npm run build:clean          # Clean build (remove dist first)
npm start                    # Start production server
npm run start:prod           # Start with NODE_ENV=production
npm test                     # Run Jest tests
npm run test:watch           # Watch mode for tests
npm run test:coverage        # Generate coverage report
npm run create-admin         # Create admin user script
npm run create-consultant    # Create consultant user script
```

#### Web Dashboard Scripts (`/web/package.json`)
```bash
npm run dev                  # Development server with Turbopack
npm run dev:external         # Development server accessible externally
npm run build                # Production build with Turbopack
npm start                    # Start production server
npm run lint                 # Run ESLint
```

### Environment Configuration

#### Mobile App Environment Variables
Required in `app/.env`:
- `API_URL` - Backend API URL (use ngrok for physical devices)
- `FIREBASE_API_KEY` - Firebase web API key
- `FIREBASE_AUTH_DOMAIN` - Firebase auth domain
- `FIREBASE_PROJECT_ID` - Firebase project ID
- `FIREBASE_STORAGE_BUCKET` - Firebase storage bucket
- `FIREBASE_MESSAGING_SENDER_ID` - FCM sender ID
- `FIREBASE_APP_ID` - Firebase app ID
- `FIREBASE_DATABASE_URL` - Realtime Database URL
- `STRIPE_PUBLISHABLE_KEY` - Stripe publishable key
- `GOOGLE_WEB_CLIENT_ID` - Google OAuth client ID
- `CLOUDINARY_CLOUD_NAME` - Cloudinary cloud name
- `CLOUDINARY_UPLOAD_PRESET` - Cloudinary upload preset

#### Backend Environment Variables
Required in `backend/.env`:
- `PORT` - Server port (default: 4000)
- `NODE_ENV` - Environment (development/production)
- `BASE_URL` - Public backend URL
- `SERVICE_ACCOUNT_PATH` - Path to Firebase service account JSON
- `STRIPE_SECRET_KEY` - Stripe secret key
- `PLATFORM_FEE_AMOUNT` - Platform fee percentage (default: 5.00)
- `MINIMUM_PAYOUT_AMOUNT` - Minimum payout amount (default: 10)
- `CLOUDINARY_CLOUD_NAME` - Cloudinary cloud name
- `CLOUDINARY_API_KEY` - Cloudinary API key
- `CLOUDINARY_API_SECRET` - Cloudinary API secret
- `SMTP_HOST` - SMTP server host
- `SMTP_PORT` - SMTP server port
- `SMTP_EMAIL` - SMTP sender email
- `SMTP_PASSWORD` - SMTP password

#### Web Dashboard Environment Variables
Required in `web/.env.local`:
- `NEXT_PUBLIC_API_URL` - Backend API URL
- `NEXT_PUBLIC_FIREBASE_API_KEY` - Firebase web API key
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` - Firebase auth domain
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID` - Firebase project ID
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` - Firebase storage bucket
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` - FCM sender ID
- `NEXT_PUBLIC_FIREBASE_APP_ID` - Firebase app ID
- `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` - Google Analytics ID (optional)

### Testing Strategy

#### Backend Testing
- **Framework**: Jest with Supertest
- **Coverage**: Unit tests for services, integration tests for routes
- **Test Files**: Located in `/backend/src/__tests__/`
- **Commands**: 
  - `npm test` - Run all tests
  - `npm run test:watch` - Watch mode
  - `npm run test:coverage` - Coverage report

#### Mobile App Testing
- **Framework**: Jest with React Native Testing Library
- **Coverage**: Component tests, service tests
- **Commands**: `npm test` - Run Jest tests

#### Web Dashboard Testing
- **Linting**: ESLint for code quality
- **Framework**: Jest (to be implemented)
- **Commands**: `npm run lint` - Run ESLint

### Code Quality Tools

#### Linting
- **Mobile App**: ESLint with React Native config
- **Backend**: ESLint with TypeScript config
- **Web Dashboard**: ESLint with Next.js config

#### Type Checking
- **All Platforms**: TypeScript strict mode enabled
- **Type Definitions**: Comprehensive type definitions across all platforms

#### Formatting
- **Mobile App**: Prettier (configured)
- **Backend**: Prettier (configured)
- **Web Dashboard**: Prettier (configured)

## Database Schema

### Firestore Collections

#### `users`
- Document ID: Firebase Auth UID
- Fields: email, role, displayName, photoURL, phoneNumber, createdAt, updatedAt

#### `consultants`
- Document ID: Auto-generated
- Fields: userId, status, bio, specialties, experience, education, certifications, hourlyRate, stripeAccountId, rating, totalReviews, createdAt, approvedAt

#### `bookings`
- Document ID: Auto-generated
- Fields: studentId, consultantId, serviceId, date, startTime, endTime, duration, status, paymentIntentId, amount, platformFee, consultantEarning, createdAt

#### `services`
- Document ID: Auto-generated
- Fields: consultantId, title, description, price, duration, category, status, createdAt

#### `jobs`
- Document ID: Auto-generated
- Fields: recruiterId, title, description, company, location, jobType, salary, requirements, skills, status, createdAt, expiresAt

#### `jobApplications`
- Document ID: Auto-generated
- Fields: jobId, applicantId, resumeId, status, matchScore, appliedAt, reviewedAt

#### `resumes`
- Document ID: Auto-generated
- Fields: userId, personalInfo, summary, skills, workHistory, education, certifications, languages, createdAt, updatedAt

#### `reviews`
- Document ID: Auto-generated
- Fields: reviewerId, revieweeId, revieweeType, rating, comment, bookingId, jobId, createdAt, updatedAt

#### `notifications`
- Document ID: Auto-generated
- Fields: userId, type, title, message, data, read, createdAt

#### `chatMessages`
- Collection: `chats/{chatId}/messages`
- Document ID: Auto-generated
- Fields: senderId, receiverId, message, type, timestamp, read

### Firestore Indexes

Required composite indexes (defined in `firebase/firestore.indexes.json`):
- Bookings by consultant and date
- Bookings by student and status
- Jobs by status and createdAt
- Job applications by jobId and status
- Reviews by revieweeId and createdAt
- Notifications by userId and createdAt

## Security Features

### Authentication & Authorization
- **Firebase Authentication**: Secure user authentication
- **JWT Tokens**: Firebase ID tokens for API authentication
- **Role-Based Access Control**: Middleware enforces role permissions
- **Token Verification**: Backend verifies all tokens before processing requests

### Data Security
- **Firestore Security Rules**: Client-side access control
- **Backend Validation**: Server-side validation for all inputs
- **Input Sanitization**: express-validator for request validation
- **CORS Configuration**: Restricted to allowed origins
- **HTTPS Enforcement**: All production traffic over HTTPS

### Payment Security
- **Stripe Payment Intents**: Secure payment processing
- **PCI Compliance**: No card data stored on platform
- **Stripe Connect**: Secure consultant payouts
- **Webhook Verification**: Stripe webhook signature verification

## Performance Optimizations

### Backend Optimizations
- **Pagination**: All list endpoints support pagination (default: 20 items)
- **LRU Cache**: In-memory cache with 1000 entry limit
- **Database Indexes**: Optimized Firestore queries with indexes
- **Request Timeouts**: 12-second timeout for auth operations
- **Scheduled Job Timeouts**: 30 min for reminders, 2 hours for payouts

### Mobile App Optimizations
- **Image Caching**: Automatic image caching
- **Lazy Loading**: Lazy load screens and components
- **Pagination**: Paginated lists for large datasets
- **Offline Queue**: Offline message queue for chat
- **Network Detection**: Automatic network status handling

### Web Dashboard Optimizations
- **Next.js SSR**: Server-side rendering for better performance
- **Auto-Refresh**: 5-minute auto-refresh intervals
- **Code Splitting**: Automatic code splitting by Next.js
- **Image Optimization**: Next.js Image component (to be fully implemented)

## Monitoring & Logging

### Backend Logging
- **Console Logging**: Structured console logs
- **Error Logging**: Comprehensive error logging
- **Request Logging**: API request/response logging (development)
- **Firebase Verification**: Connection verification on startup

### Mobile App Logging
- **Development Logs**: Console logs in development mode
- **Production Logs**: Suppressed in production builds
- **Error Boundaries**: Error boundary for crash prevention
- **Network Logging**: Network request logging (development)

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
- [ ] Intake quiz system for consultant matching
- [ ] Course/training library
- [ ] Goal tracking system
- [ ] Subscription system for job access
- [ ] Enhanced student profile fields
- [ ] Document locker system
- [ ] Lead matching for consultants
- [ ] Communication broadcast tools

### Known Limitations
- Code splitting not yet implemented in mobile app
- Image optimization partially implemented in web dashboard
- Some student profile fields from requirements not yet implemented
- Course/training system not yet implemented
- Subscription system not yet implemented

---

**Built with ❤️ using React Native, Node.js, Next.js, and Firebase**

**Last Updated**: Based on complete project analysis  
**Version**: 1.0.0  
**Total Project Files**: 395+ files  
**Lines of Code**: ~50,000+ lines


