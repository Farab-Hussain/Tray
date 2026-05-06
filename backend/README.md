# Tray Backend API

Node.js/TypeScript REST API service that powers Tray's multi-platform consultant booking and job management system. The API is stateless, uses Firebase Admin SDK as the system of record, and exposes a comprehensive REST surface for mobile and web clients.

## Overview

The Tray backend provides a complete set of APIs for authentication, consultant onboarding, booking management, Stripe payments, job posting and applications, automated reminders, analytics, notifications, and content storage. Built with Express 5, TypeScript, and Firebase Admin SDK.

## Key Features

### Core Functionality
- **Multi-Role Authentication**: Student, Consultant, Recruiter, and Admin roles with role-based access control
- **Consultant Management**: Complete onboarding flow with profile creation, verification, and service applications
- **Booking System**: Full lifecycle booking management with automated reminders
- **Payment Processing**: Stripe integration for payment intents and automated consultant payouts
- **Job Management**: Job posting, applications, resume management, and skill matching
- **Real-time Notifications**: Firebase Cloud Messaging (FCM) integration
- **Review System**: Rating and review functionality with aggregate calculations
- **Analytics**: Consultant and admin analytics with revenue tracking
- **File Uploads**: Cloudinary integration for images and resume files
- **Automated Tasks**: Scheduled reminders and payouts

### Technical Highlights
- Express 5 + TypeScript running on Node 20
- Firebase Admin SDK for auth, Firestore, Realtime Database, Storage, and FCM
- Domain-driven architecture with controllers/services separation
- Stripe integration for payments and automated payouts with configurable platform fees
- Cloudinary-backed media uploads with multer
- Transactional email templates via Nodemailer
- In-memory LRU cache (max 1000 entries) with automatic cleanup
- Request logging middleware and structured Logger utility
- Comprehensive error handling and validation
- Scheduled jobs with timeout protection and graceful shutdown

## Tech Stack

- **Runtime**: Node.js ≥ 20
- **Framework**: Express 5.1.0
- **Language**: TypeScript 5.9.3
- **Database**: Firebase Firestore
- **Authentication**: Firebase Admin SDK
- **Storage**: Firebase Storage, Cloudinary
- **Payment**: Stripe (Payment Intents, Connect)
- **Email**: Nodemailer
- **File Upload**: Multer, multer-storage-cloudinary
- **Validation**: express-validator 7.3.0
- **Testing**: Jest, Supertest
- **Deployment**: Vercel serverless (optional)

## Prerequisites

- **Node.js** ≥ 20 (npm or nvm recommended)
- **Firebase Project** with:
  - Firestore Database enabled
  - Authentication enabled
  - Realtime Database enabled (for chat)
  - Cloud Storage enabled
  - Cloud Messaging enabled
  - Service account JSON file
- **Stripe Account** with:
  - Secret key (test/live)
  - Connect accounts enabled for payouts
- **Cloudinary Account** for media storage
- **SMTP Credentials** (Gmail, AWS SES, etc.) for transactional emails
- **Environment Variables**: Create `.env` file (see Environment Variables section)

## Project Structure

```
backend/
├── src/
│   ├── app.ts                      # Express app configuration, middleware, route wiring
│   ├── server.ts                   # HTTP server bootstrap with scheduled jobs
│   │
│   ├── config/
│   │   ├── firebase.ts             # Firebase Admin SDK initialization
│   │   └── *.json                  # Service account JSON (DO NOT COMMIT)
│   │
│   ├── routes/                     # Express route definitions (15 route files)
│   │   ├── auth.routes.ts          # Authentication routes
│   │   ├── consultant.routes.ts    # Consultant CRUD and services
│   │   ├── consultantFlow.routes.ts # Consultant onboarding flow
│   │   ├── booking.routes.ts       # Booking management
│   │   ├── payment.routes.ts       # Stripe payments and payouts
│   │   ├── job.routes.ts           # Job posting and applications
│   │   ├── resume.routes.ts        # Resume management
│   │   ├── review.routes.ts        # Review and rating
│   │   ├── upload.routes.ts        # File uploads
│   │   ├── fcm.routes.ts           # FCM token management
│   │   ├── notification.routes.ts  # Push notifications
│   │   ├── reminder.routes.ts      # Reminder triggers
│   │   ├── analytics.routes.ts     # Analytics endpoints
│   │   ├── activity.routes.ts      # Activity logging
│   │   └── support.routes.ts       # Support tickets
│   │
│   ├── controllers/                # Route handlers (17 controller files)
│   │   ├── auth.Controller.ts      # Auth operations (register, login, profile)
│   │   ├── consultant.controller.ts # Consultant CRUD
│   │   ├── consultantFlow.controller.ts # Onboarding flow
│   │   ├── booking.controller.ts   # Booking operations
│   │   ├── payment.controller.ts   # Stripe payment intents
│   │   ├── payout.controller.ts    # Payout management
│   │   ├── job.controller.ts       # Job CRUD and search
│   │   ├── jobApplication.controller.ts # Job applications
│   │   ├── resume.controller.ts    # Resume operations
│   │   ├── review.controller.ts    # Review operations
│   │   ├── upload.controller.ts    # File upload handling
│   │   ├── fcm.controller.ts       # FCM token management
│   │   ├── notification.controller.ts # Push notification sending
│   │   ├── reminder.controller.ts  # Reminder triggers
│   │   ├── analytics.controller.ts # Analytics data
│   │   ├── activity.controller.ts  # Activity logging
│   │   └── support.controller.ts   # Support tickets
│   │
│   ├── services/                   # Business logic layer (11 service files)
│   │   ├── consultant.service.ts   # Consultant business logic
│   │   ├── consultantFlow.service.ts # Consultant flow orchestration
│   │   ├── payment.service.ts      # Payment processing logic
│   │   ├── payout.service.ts       # Automated payout processing
│   │   ├── job.service.ts          # Job business logic
│   │   ├── jobApplication.service.ts # Job application logic
│   │   ├── resume.service.ts       # Resume operations
│   │   ├── review.service.ts       # Review aggregation and calculations
│   │   ├── reminder.service.ts     # Appointment reminder service
│   │   ├── analytics.service.ts    # Analytics data aggregation
│   │   └── platformSettings.service.ts # Platform settings
│   │
│   ├── models/                     # Data models and type definitions (7 model files)
│   │   ├── consultant.model.ts
│   │   ├── consultantProfile.model.ts
│   │   ├── consultantApplication.model.ts
│   │   ├── job.model.ts
│   │   ├── jobApplication.model.ts
│   │   ├── resume.model.ts
│   │   └── review.model.ts
│   │
│   ├── middleware/                 # Express middleware (3 files)
│   │   ├── authMiddleware.ts       # Authentication and authorization
│   │   ├── consultantMiddleware.ts # Consultant-specific middleware
│   │   └── validation.ts           # Request validation (express-validator)
│   │
│   ├── utils/                      # Utility functions (6 files)
│   │   ├── logger.ts               # Structured logging utility
│   │   ├── email.ts                # Email sending (Nodemailer)
│   │   ├── cache.ts                # In-memory LRU cache
│   │   ├── stripeClient.ts         # Stripe client configuration
│   │   ├── skillMatching.ts        # Job-resume skill matching
│   │   └── serialization.ts        # Data serialization utilities
│   │
│   ├── functions/                  # Firebase Cloud Functions (optional)
│   │   └── sendMessageNotification.function.ts
│   │
│   ├── types/                      # TypeScript type definitions
│   │   └── express.d.ts            # Express type extensions
│   │
│   └── __tests__/                  # Jest test files
│       ├── health.test.ts
│       └── validation.test.ts
│
├── scripts/                        # Operational scripts
│   ├── createAdmin.ts              # Create admin user script
│   └── createConsultant.ts         # Create consultant script
│
├── dist/                           # Compiled JavaScript (generated by build)
├── node_modules/
│
├── package.json                    # Dependencies and scripts
├── tsconfig.json                   # TypeScript configuration
├── jest.config.js                  # Jest test configuration
├── vercel.json                     # Vercel serverless config (optional)
├── serverless.ts                   # Serverless entry point (optional)
├── .env                            # Environment variables (DO NOT COMMIT)
└── README.md                       # This file
```

## Environment Variables

Create a `.env` file in the `backend/` directory with the following variables:

```env
# Server Configuration
PORT=4000                           # Server port (default: 4000)
NODE_ENV=development                # Environment: development, production
BASE_URL=https://tray-ecru.vercel.app     # Base URL for emails/links (use ngrok URL for mobile dev)

# Firebase Configuration
SERVICE_ACCOUNT_PATH=./src/config/tray-ed2f7-firebase-adminsdk-*.json  # Path to service account JSON
# OR use default Firebase initialization (Google Cloud environments)
# GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...      # Stripe secret key (test or live)
PLATFORM_FEE_AMOUNT=5.00           # Platform fee percentage (default: 5.00)
MINIMUM_PAYOUT_AMOUNT=10           # Minimum payout amount in USD (default: 10)

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email Configuration (SMTP)
SMTP_HOST=smtp.gmail.com           # SMTP host (default: smtp.gmail.com)
SMTP_PORT=587                      # SMTP port (default: 587)
SMTP_EMAIL=your_email@gmail.com    # SMTP email/username
SMTP_USER=your_email@gmail.com     # SMTP username (usually same as email)
SMTP_PASSWORD=your_app_password    # SMTP password or app-specific password
SMTP_FROM=noreply@tray.com         # From email address

# Twilio Network Traversal Service
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_TOKEN_TTL=3600              # Optional, defaults to 3600 seconds
TWILIO_REGION=global               # Optional. Pin to a region like frankfurt or singapore

# Firebase Cloud Messaging (Optional)
FCM_SERVER_KEY=your_fcm_server_key # Optional - Firebase Admin handles most push duties
```

**Important Notes:**
- Never commit `.env` file or service account JSON files to version control
- For mobile development, use an ngrok URL or deployed backend URL (not localhost)
- Copy service account JSON to `src/config/` or set `SERVICE_ACCOUNT_PATH` to secure location
- When SMTP credentials are missing, emails are logged but not sent (useful for development)
- Twilio credentials must stay on the backend only. The mobile app should request `/webrtc/ice-servers` and receive short-lived ICE servers, not your Twilio auth token

## Twilio Network Traversal Service

Tray uses `react-native-webrtc` for audio and video calls, so production call reliability depends on STUN and TURN.

### Recommended Flow

1. Backend reads `TWILIO_ACCOUNT_SID` and `TWILIO_AUTH_TOKEN`
2. Backend creates a Twilio Network Traversal token
3. Backend returns the `ice_servers` array to the mobile app
4. Mobile app passes those ICE servers into `RTCPeerConnection`

### Backend Route

- `GET /webrtc/ice-servers`

This route is authenticated and returns Twilio ICE servers for the app to use.

### Why Twilio

- Better call reliability on mobile data, office Wi-Fi, and restrictive networks
- No need to self-host and maintain TURN infrastructure
- Short-lived credentials are safer than hardcoding TURN usernames and passwords
- Global infrastructure helps the app behave consistently across regions

## Installation

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Environment Variables

- Create `.env` file in `backend/` directory
- Add all required environment variables (see Environment Variables section)
- Ensure Firebase service account JSON is in place

### 3. Verify Firebase Configuration

```bash
# Test Firebase connection
npm run test-auth
```

### 4. Build TypeScript (Optional for Development)

```bash
npm run build
```

The build process automatically copies service account JSON files to `dist/config/`.

## Development

### Start Development Server

```bash
npm run dev
```

This starts the server with `ts-node-dev` for auto-reload on file changes.

The server will:
- Start on port 4000 (or PORT from .env)
- Verify Firebase connection
- Setup scheduled jobs (reminders hourly, payouts daily at 2 AM)
- Log startup information

### Available Scripts

- `npm run dev` - Start development server with auto-reload
- `npm run build` - Build TypeScript to JavaScript (outputs to `dist/`)
- `npm run build:clean` - Clean build (removes dist/ first)
- `npm start` - Start production server (requires build first)
- `npm run start:prod` - Start production server with NODE_ENV=production
- `npm test` - Run Jest tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report
- `npm run create-admin` - Create admin user (interactive script)
- `npm run create-consultant` - Create consultant user (interactive script)
- `npm run test-auth` - Test Firebase authentication connection

## API Endpoints

### Base URL
- Development: `http://localhost:4000` (or ngrok URL)
- Production: Your deployed backend URL

### Authentication
Most endpoints require Firebase ID token in Authorization header:
```
Authorization: Bearer <firebase-id-token>
```

### Health Check
- `GET /` - Simple health check response
- `GET /health` - Detailed health check with Firebase connection status, memory usage, uptime

### Authentication Routes (`/auth`)
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login with Firebase ID token, returns user data
- `GET /auth/me` - Get current user details (authenticated)
- `GET /auth/admin/users` - Get all users with pagination (admin only)
- `GET /auth/users/:uid` - Get user by UID (public, for fetching names)
- `PUT /auth/profile` - Update user profile (authenticated)
- `DELETE /auth/account` - Soft delete user account (authenticated)
- `POST /auth/forgot-password` - Request password reset OTP via email
- `POST /auth/verify-otp` - Verify OTP for password reset
- `POST /auth/reset-password` - Reset password after OTP verification
- `POST /auth/resend-verification-email` - Resend email verification (authenticated)
- `POST /auth/verify-email` - Verify email with token
- `POST /auth/request-consultant-role` - Request consultant role access (authenticated)
- `POST /auth/switch-role` - Switch active role (authenticated)
- `POST /auth/change-password` - Change password (authenticated)
- `POST /auth/admin/create-admin` - Create admin user (admin only)

### Consultant Routes (`/consultants`)
- `GET /consultants` - Get all consultants (paginated, filterable)
- `GET /consultants/top` - Get top-rated consultants
- `GET /consultants/:uid` - Get consultant by UID
- `POST /consultants/set-top` - Set top consultant (admin only)
- `POST /consultants/services` - Add consultant service (authenticated)
- `GET /consultants/services/default` - Get default platform services
- `GET /consultants/services/available` - Get services consultants can apply for
- `GET /consultants/services/all` - Get all services from all consultants
- `GET /consultants/services` - Get services (paginated, filterable)
- `GET /consultants/services/:serviceId` - Get service by ID
- `GET /consultants/:consultantId/services` - Get consultant's services
- `PUT /consultants/services/:serviceId` - Update service (authenticated)
- `DELETE /consultants/services/:serviceId` - Delete service (authenticated)

### Consultant Flow Routes (`/consultant-flow`)
- `GET /consultant-flow/status` - Get consultant status (authenticated)
- `POST /consultant-flow/profiles` - Create consultant profile (authenticated)
- `GET /consultant-flow/profiles/:uid` - Get consultant profile
- `GET /consultant-flow/profiles/:uid/availability` - Get consultant availability (public)
- `PUT /consultant-flow/profiles/:uid` - Update consultant profile (authenticated)
- `PUT /consultant-flow/profiles/:uid/availability-slots` - Set availability slots (authenticated)
- `DELETE /consultant-flow/profiles/:uid/availability-slots` - Delete availability slot (authenticated)
- `GET /consultant-flow/profiles` - Get all profiles (admin only, paginated)
- `POST /consultant-flow/profiles/:uid/approve` - Approve consultant profile (admin only)
- `POST /consultant-flow/profiles/:uid/reject` - Reject consultant profile (admin only)
- `POST /consultant-flow/applications` - Create service application (authenticated)
- `PUT /consultant-flow/applications/:id` - Update application (authenticated)
- `GET /consultant-flow/applications/my` - Get my applications (authenticated)
- `GET /consultant-flow/applications/:id` - Get application by ID (authenticated)
- `DELETE /consultant-flow/applications/:id` - Delete application (authenticated)
- `GET /consultant-flow/applications` - Get all applications (admin only, paginated)
- `POST /consultant-flow/applications/:id/approve` - Approve application (admin only)
- `POST /consultant-flow/applications/:id/reject` - Reject application (admin only)
- `GET /consultant-flow/verification-status` - Get verification status (authenticated)
- `GET /consultant-flow/verification/:uid` - Get verification details

### Booking Routes (`/bookings`)
- `POST /bookings` - Create booking (authenticated)
- `GET /bookings/student` - Get student bookings (authenticated)
- `GET /bookings/consultant` - Get consultant bookings (authenticated)
- `GET /bookings/consultant/:consultantId/booked-slots` - Get booked slots (public, for availability checking)
- `GET /bookings/my-consultants` - Get my consultants (authenticated)
- `PUT /bookings/:bookingId/status` - Update booking status (authenticated)
- `POST /bookings/:bookingId/cancel` - Cancel booking (authenticated)
- `GET /bookings/has-access/:consultantId` - Check access to consultant (authenticated)
- `GET /bookings/debug` - Debug endpoint (authenticated, for testing)

### Payment Routes (`/payment`)
- `POST /payment/webhook` - Stripe webhook handler (raw body)
- `POST /payment/create-payment-intent` - Create Stripe payment intent
- `GET /payment/config` - Get Stripe configuration (publishable key)
- `POST /payment/connect/create-account` - Create Stripe Connect account (authenticated)
- `GET /payment/connect/account-status` - Get Connect account status (authenticated)
- `POST /payment/transfer` - Transfer to consultant (authenticated)
- `GET /payment/platform-fee` - Get platform fee configuration
- `PUT /payment/platform-fee` - Update platform fee (admin only)
- `POST /payment/payouts/process` - Trigger payout processing (authenticated)
- `GET /payment/payouts/history` - Get payout history (authenticated)

### Job Routes (`/jobs`)
- `GET /jobs` - Get all active jobs (paginated, filterable, public)
- `GET /jobs/search` - Search jobs (public)
- `GET /jobs/my` - Get my posted jobs (authenticated)
- `POST /jobs` - Create job posting (authenticated, admin/recruiter/consultant only)
- `GET /jobs/:id` - Get job details (public)
- `GET /jobs/:id/match-score` - Get match score for current user (authenticated)
- `PUT /jobs/:id` - Update job (authenticated)
- `DELETE /jobs/:id` - Delete job (authenticated)
- `POST /jobs/:id/apply` - Apply for job (authenticated)
- `GET /jobs/applications/my` - Get my applications (authenticated)
- `GET /jobs/:id/applications` - Get applications for job (authenticated, sorted by rating)
- `PUT /jobs/applications/:id/status` - Update application status (authenticated)
- `GET /jobs/applications/:id` - Get application by ID (authenticated)

### Resume Routes (`/resumes`)
- `POST /resumes` - Create/update resume (authenticated)
- `GET /resumes/my` - Get my resume (authenticated)
- `GET /resumes/:id` - Get resume by ID (authenticated)
- `PUT /resumes` - Update resume (authenticated)
- `PUT /resumes/skills` - Update resume skills (authenticated)
- `DELETE /resumes` - Delete resume (authenticated)

### Review Routes (`/reviews`)
- `GET /reviews/consultant/:consultantId` - Get consultant reviews (paginated, public)
- `POST /reviews` - Create review (authenticated)
- `GET /reviews/my-reviews` - Get my reviews (authenticated)
- `PUT /reviews/:reviewId` - Update review (authenticated)
- `DELETE /reviews/:reviewId` - Delete review (authenticated)
- `GET /reviews/admin/all` - Get all reviews (admin only, paginated)

### Upload Routes (`/upload`)
- `POST /upload/profile-image` - Upload profile image (authenticated, multipart/form-data)
- `POST /upload/consultant-image` - Upload consultant image (authenticated, multipart/form-data)
- `POST /upload/service-image` - Upload service image (authenticated, multipart/form-data)
- `POST /upload/file` - Upload resume file (authenticated, multipart/form-data)
- `DELETE /upload/profile-image` - Delete profile image (authenticated)
- `DELETE /upload/consultant-image` - Delete consultant image (authenticated)
- `POST /upload/upload-signature` - Get upload signature (authenticated, for direct Cloudinary upload)

### FCM Routes (`/fcm`)
- `POST /fcm/token` - Register FCM token (authenticated)
- `DELETE /fcm/token` - Delete FCM token (authenticated)

### Notification Routes (`/notifications`)
- `POST /notifications/send-message` - Send message notification (authenticated)
- `POST /notifications/send-call` - Send call notification (authenticated)

### Reminder Routes (`/reminders`)
- `POST /reminders/send` - Trigger reminder processing (authenticated, for cron/admin)

### Analytics Routes (`/analytics`)
- `GET /analytics/consultant` - Get consultant analytics (authenticated, with period filter: week/month/year)

### Activity Routes (`/admin/activities`)
- `GET /admin/activities/recent` - Get recent activities (authenticated, admin)

### Support Routes (`/support`)
- Support ticket management endpoints
- `POST /support/contact` - Submit support contact form (authenticated)
- `POST /support/submit` - Submit support ticket (authenticated, legacy endpoint, same as /contact)
- Both endpoints accept support requests and send notifications
- See `src/routes/support.routes.ts` for full implementation

## Scheduled Jobs

The server automatically runs scheduled jobs:

### Appointment Reminders
- **Frequency**: Every hour
- **Function**: `sendAppointmentReminders()` from `src/services/reminder.service.ts`
- **Purpose**: Sends email and push notifications for bookings 24 hours before appointment
- **Timeout**: 30 minutes max execution time
- **Error Handling**: Errors are logged but don't stop the scheduler

### Automated Payouts
- **Frequency**: Daily at 2:00 AM
- **Function**: `processAutomatedPayouts()` from `src/services/payout.service.ts`
- **Purpose**: Processes completed bookings, applies platform fees, creates Stripe transfers
- **Timeout**: 2 hours max execution time
- **Error Handling**: Errors are logged but don't stop the scheduler

Both scheduled jobs have:
- Timeout protection to prevent hanging
- Graceful error handling
- Cleanup on process shutdown (SIGTERM, SIGINT)

## Data Models

### Firestore Collections

#### `/users/{userId}`
- Core user account metadata
- Roles: `student`, `consultant`, `recruiter`, `admin`
- Subcollection: `/fcmTokens/{tokenId}` - Device tokens for push notifications

#### `/consultantProfiles/{profileId}`
- Consultant profile data
- Status: `pending`, `approved`, `rejected`
- Bio, experience, education, certifications

#### `/consultantApplications/{applicationId}`
- Service application records
- Links consultant to platform services
- Status: `pending`, `approved`, `rejected`

#### `/bookings/{bookingId}`
- Booking details, status, payment info
- Flags: `reminderSent`, `paymentStatus`
- Session metadata

#### `/services/{serviceId}`
- Service catalog entries
- Referenced by bookings and analytics

#### `/payouts/{payoutId}`
- Stripe transfer history
- Booking associations
- Platform fee calculations

#### `/jobs/{jobId}`
- Job postings
- Requirements, salary, location

#### `/jobApplications/{applicationId}`
- Job application records
- Status: `pending`, `reviewing`, `accepted`, `rejected`
- Match score for ranking

#### `/resumes/{userId}`
- Resume data for students
- Skills, experience, education

#### `/reviews/{reviewId}`
- Review and rating records
- Used for aggregate calculations

#### `/chats/{chatId}`
- Chat metadata (managed by mobile app)
- Last message info

## Middleware

### Authentication (`authMiddleware.ts`)
- Verifies Firebase ID tokens
- Supports optional email verification check
- Role-based authorization (`authorizeRole`)
- Request timeout protection (12 seconds)
- Comprehensive error handling and logging

### Validation (`validation.ts`)
- Request validation using `express-validator`
- Validates all input fields
- Returns detailed error messages
- Sanitizes input data

### Consultant Middleware (`consultantMiddleware.ts`)
- Consultant-specific checks and validations

## Services

### Business Logic Services

- **consultant.service.ts**: Consultant CRUD operations, top consultants, service management
- **consultantFlow.service.ts**: Consultant onboarding orchestration, profile/application workflows
- **payment.service.ts**: Payment intent creation, Stripe operations
- **payout.service.ts**: Automated payout processing, platform fee calculations, Stripe transfers
- **job.service.ts**: Job CRUD, search, matching
- **jobApplication.service.ts**: Application processing, status updates, match score calculation
- **resume.service.ts**: Resume operations, skill extraction
- **review.service.ts**: Review aggregation, rating calculations
- **reminder.service.ts**: Appointment reminder processing (email + push)
- **analytics.service.ts**: Analytics data aggregation for consultants and admins
- **platformSettings.service.ts**: Platform-wide settings management

## Utilities

### Logger (`utils/logger.ts`)
- Structured logging with route, user ID, and message
- Methods: `info`, `success`, `error`, `warn`
- Request logging middleware for automatic request/response logging

### Email (`utils/email.ts`)
- Nodemailer configuration
- Email template helpers for onboarding, application lifecycle
- Graceful fallback when SMTP credentials are missing

### Cache (`utils/cache.ts`)
- In-memory LRU cache (max 1000 entries)
- TTL (Time To Live) support
- Automatic cleanup of expired entries every 5 minutes
- Graceful shutdown handling

### Stripe Client (`utils/stripeClient.ts`)
- Stripe client initialization and configuration

### Skill Matching (`utils/skillMatching.ts`)
- Job-resume skill matching algorithm
- Match score calculation

### Serialization (`utils/serialization.ts`)
- Data serialization utilities
- Converts Firestore timestamps and complex objects to JSON-compatible formats

## Error Handling

### Global Error Handler
- Catches all unhandled errors
- Returns appropriate HTTP status codes
- Detailed error messages in development
- Generic messages in production

### Error Response Format
```json
{
  "error": "Error message",
  "message": "Detailed message (development only)"
}
```

### Validation Errors
- Returns 400 with detailed field-level errors
- Uses express-validator error format

## Testing

### Run Tests
```bash
npm test                 # Run all tests
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report
```

### Test Structure
- Tests in `src/__tests__/`
- Jest configuration in `jest.config.js`
- Test timeout: 10 seconds
- Coverage reports: text, lcov, html

### Current Test Coverage
- Health check tests
- Validation tests
- Expand with service and controller tests

## Building for Production

### 1. Build TypeScript
```bash
npm run build:clean
```

This:
- Removes `dist/` directory
- Compiles TypeScript to JavaScript
- Generates source maps and declarations
- Copies service account JSON to `dist/config/`

### 2. Verify Build Output
```bash
ls -la dist/
```

Ensure:
- All compiled `.js` files are present
- Service account JSON is in `dist/config/`
- No TypeScript compilation errors

### 3. Start Production Server
```bash
npm run start:prod
```

Or with PM2:
```bash
pm2 start dist/server.js --name tray-backend
```

### 4. Production Checklist
- [ ] Set production environment variables
- [ ] Use production Stripe keys
- [ ] Configure production Firebase project
- [ ] Set up SSL/HTTPS
- [ ] Configure CORS for production domains
- [ ] Set up monitoring and logging (CloudWatch, Stackdriver, etc.)
- [ ] Schedule reminders and payouts via Cloud Scheduler or cron
- [ ] Set up health check monitoring
- [ ] Configure rate limiting (recommended)
- [ ] Review and update platform fees/thresholds
- [ ] Test all critical user flows
- [ ] Verify scheduled jobs are running
- [ ] Set up backup strategy for Firestore

## Deployment

### Vercel (Serverless)
The project includes `vercel.json` for serverless deployment:

```bash
vercel deploy
```

### Other Platforms
- **PM2**: `pm2 start dist/server.js`
- **Docker**: Create Dockerfile and deploy to container platform
- **Cloud Run**: Deploy as containerized service
- **EC2/VM**: Traditional server deployment with systemd

### Scheduled Jobs in Production
Use external schedulers since serverless functions don't run continuously:
- **Google Cloud Scheduler**: HTTP trigger to `/reminders/send` and `/payment/payouts/process`
- **AWS EventBridge**: Schedule Lambda to call endpoints
- **cron**: Traditional cron job with `curl` or HTTP client

## Monitoring & Logging

### Request Logging
- All requests automatically logged via `requestLogger` middleware
- Logs: method, path, status, duration, user ID
- Sanitizes sensitive data (passwords, tokens)

### Structured Logging
Use `Logger` utility in controllers/services:
```typescript
Logger.info('GET /users', userId, 'User fetched successfully');
Logger.error('POST /bookings', userId, 'Booking failed', error);
```

### Health Check Monitoring
Monitor `/health` endpoint:
- Firebase connection status
- Memory usage
- Server uptime
- Response times

### Production Logging
- Redirect logs to CloudWatch, Stackdriver, or similar
- Set up log aggregation and search
- Configure alerts for errors and high response times

## Performance Optimizations

### Caching
- In-memory LRU cache (1000 entries max)
- Automatic TTL-based expiration
- Cache user profiles and frequently accessed data

### Pagination
- All list endpoints support pagination
- Query params: `page`, `limit`
- Default limit: 50 items per page

### Firestore Optimization
- Optimized Firestore settings
- Connection pre-warming on startup
- Index creation for compound queries
- Efficient query patterns

### Request Timeouts
- Auth middleware: 12 seconds
- Reminder job: 30 minutes
- Payout job: 2 hours
- Prevents hanging requests

## Security

### Authentication
- Firebase ID token verification
- Role-based access control (RBAC)
- Optional email verification checks

### Input Validation
- All inputs validated with express-validator
- Input sanitization
- SQL injection protection (using Firestore, not applicable)
- XSS prevention via input sanitization

### CORS
- Configurable CORS settings
- Production: restrict to specific origins
- Development: allow all origins

### Environment Variables
- Never commit `.env` files
- Never commit service account JSON
- Use secure secret management in production

### Recommendations
- [ ] Rate limiting (to be implemented)
- [ ] HTTPS only in production
- [ ] Regular security audits
- [ ] Dependency updates

## Extending the API

### Adding New Routes

1. Create route file in `src/routes/`
```typescript
import express from "express";
import { authenticateUser } from "../middleware/authMiddleware";
import * as controller from "../controllers/my.controller";

const router = express.Router();
router.get("/", authenticateUser(), controller.getItems);
export default router;
```

2. Create controller in `src/controllers/`
```typescript
export const getItems = async (req, res) => {
  // Controller logic
};
```

3. Create service in `src/services/` (if business logic needed)
```typescript
export const getItems = async () => {
  // Business logic
};
```

4. Register route in `src/app.ts`
```typescript
import myRoutes from "./routes/my.routes";
app.use("/my", myRoutes);
```

### Best Practices
- Keep business logic in services, not controllers
- Controllers should validate input, call services, shape responses
- Use middleware for authentication and validation
- Return consistent error response format
- Log important operations with Logger utility
- Update this README when adding new features

## Troubleshooting

### Firebase Connection Issues
**Problem**: Firebase initialization fails

**Solutions**:
- Verify service account JSON path is correct
- Check SERVICE_ACCOUNT_PATH environment variable
- Ensure service account has required permissions
- Verify Firebase project is configured correctly

### Stripe Payment Issues
**Problem**: Payment intents fail

**Solutions**:
- Verify STRIPE_SECRET_KEY is set correctly
- Check Stripe account is active
- Verify webhook endpoint is accessible
- Check Stripe dashboard for error logs

### Email Not Sending
**Problem**: Emails not delivered

**Solutions**:
- Verify SMTP credentials are correct
- Check email service (Gmail, SES) settings
- For Gmail, use app-specific password
- Check email is not in spam
- When credentials missing, emails are logged but not sent (expected in dev)

### Scheduled Jobs Not Running
**Problem**: Reminders/payouts not executing

**Solutions**:
- Check server logs for errors
- Verify server is running continuously
- For serverless, use external scheduler (Cloud Scheduler, cron)
- Check job timeout settings
- Verify job endpoints are accessible

### Build Errors
**Problem**: TypeScript compilation fails

**Solutions**:
- Run `npm install` to ensure dependencies are installed
- Check TypeScript version compatibility
- Review `tsconfig.json` settings
- Check for syntax errors in source files

## Resources

### Documentation
- [Express 5](https://expressjs.com/)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [Stripe Payments & Connect](https://stripe.com/docs/connect)
- [Cloudinary Upload API](https://cloudinary.com/documentation)
- [Nodemailer](https://nodemailer.com/about/)
- [TypeScript](https://www.typescriptlang.org/docs/)
- [Jest](https://jestjs.io/docs/getting-started)

### Related Documentation
- Mobile App README: `../app/README.md`
- Web Dashboard README: `../web/README.md`
- Complete Project Documentation: `../Docs/COMPLETE_PROJECT_DOCUMENTATION.md`
- API Documentation: `../Docs/API_DOCUMENTATION.md`
- Architecture Documentation: `../Docs/ARCHITECTURE.md`

## Support

For issues, questions, or contributions:
- Check inline comments in `controllers/` and `services/`
- Review error logs in server console
- Check Firebase Console for Firestore errors
- Coordinate with mobile (`app/`) and web (`web/`) teams
- Keep secrets secure and update platform fees/thresholds before going live

---

**Last Updated**: Based on complete backend codebase analysis  
**Version**: 1.0.0  
**Node.js**: ≥ 20  
**Express**: 5.1.0  
**TypeScript**: 5.9.3
