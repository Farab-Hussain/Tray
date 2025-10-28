# Tray Backend API

Express.js REST API server providing backend services for the Tray platform.

## 🎯 Overview

The Tray backend API handles user authentication, booking management, consultant profiles, real-time chat coordination, FCM token management, file uploads, payments, and email services.

## 🛠️ Tech Stack

- **Framework:** Express.js 5.1
- **Language:** TypeScript
- **Database:** Firebase Firestore
- **Authentication:** Firebase Admin SDK
- **File Storage:** Cloudinary
- **Payments:** Stripe
- **Email:** Nodemailer (SMTP)
- **Cloud Storage:** Google Cloud Storage

## 📦 Installation

### Prerequisites

- Node.js 20+
- npm or yarn
- Firebase project credentials
- Cloudinary account (for image uploads)
- Stripe account (for payments)
- SMTP email credentials

### Setup

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Development mode (with auto-reload)
npm run dev

# Production mode
npm run start:prod
```

## 🔧 Configuration

### Environment Variables

Create `.env` file in the root directory:

   ```env
   # Server Configuration
PORT=4000
NODE_ENV=development
BASE_URL=http://localhost:4000

# Email Configuration
SMTP_EMAIL=your_email@gmail.com
SMTP_PASSWORD=your_app_password

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Google Cloud Storage (optional)
GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account.json
```

## 📁 Project Structure

```
src/
├── app.ts                  # Express app configuration
├── server.ts               # Server entry point
├── config/
│   └── firebase.ts        # Firebase Admin initialization
├── controllers/           # Request handlers
│   ├── auth.controller.ts
│   ├── booking.controller.ts
│   ├── consultant.controller.ts
│   ├── consultantFlow.controller.ts
│   ├── fcm.controller.ts
│   ├── payment.controller.ts
│   ├── review.controller.ts
│   └── upload.controller.ts
├── routes/                # API route definitions
│   ├── auth.routes.ts
│   ├── booking.routes.ts
│   ├── consultant.routes.ts
│   ├── consultantFlow.routes.ts
│   ├── fcm.routes.ts
│   ├── payment.routes.ts
│   ├── review.routes.ts
│   └── upload.routes.ts
├── middleware/            # Express middleware
│   ├── authMiddleware.ts
│   └── consultantMiddleware.ts
├── models/                # Data models/interfaces
│   ├── consultant.model.ts
│   ├── consultantApplication.model.ts
│   ├── consultantProfile.model.ts
│   └── review.model.ts
├── services/              # Business logic services
│   ├── email.service.ts
│   ├── storage.service.ts
│   └── stripe.service.ts
└── utils/                 # Utility functions
    ├── email.ts
    └── logger.ts
```

## 🌐 API Endpoints

### Authentication (`/auth`)

#### Register User
```
POST /auth/register
Body: { uid, name, role, email }
Response: { message, user }
```

#### Login
```
POST /auth/login
Body: { idToken }
Response: { valid, user }
```

#### Get Current User
```
GET /auth/me
Headers: Authorization: Bearer <token>
Response: { uid, email, ...profile }
```

#### Get User by ID
```
GET /auth/users/:uid
Response: { uid, name, email, role, profileImage }
```

#### Update Profile
```
PUT /auth/profile
Headers: Authorization: Bearer <token>
Body: { name?, profileImage? }
Response: { message }
```

#### Forgot Password
```
POST /auth/forgot-password
Body: { email }
Response: { message, resetSessionId }
```

#### Verify OTP
```
POST /auth/verify-otp
Body: { resetSessionId, otp }
Response: { message, resetSessionId }
```

#### Reset Password
```
POST /auth/reset-password
Body: { resetSessionId, newPassword }
Response: { message }
```

### Bookings (`/bookings`)

#### Create Booking
```
POST /bookings
Headers: Authorization: Bearer <token>
Body: { consultantId, studentId, serviceId, date, time, amount, quantity }
Response: { booking }
```

#### Get Student Bookings
```
GET /bookings/student
Headers: Authorization: Bearer <token>
Response: { bookings: [...] }
```

#### Get Consultant Bookings
```
GET /bookings/consultant
Headers: Authorization: Bearer <token>
Response: { bookings: [...] }
```

#### Update Booking Status
```
PUT /bookings/:id/status
Headers: Authorization: Bearer <token>
Body: { status, paymentStatus? }
Response: { booking }
```

#### Cancel Booking
```
POST /bookings/:id/cancel
Headers: Authorization: Bearer <token>
Body: { reason? }
Response: { message, refundAmount, refundPercentage }
```

### Consultants (`/consultants`)

#### Get All Consultants
```
GET /consultants
Response: { consultants: [...] }
```

#### Get Top Consultants
```
GET /consultants/top
Response: { topConsultants: [...] }
```

#### Get Consultant Services
```
GET /consultants/:id/services
Response: { services: [...] }
```

### Consultant Flow (`/consultant-flow`)

#### Get Consultant Profile
```
GET /consultant-flow/profiles/:id
Headers: Authorization: Bearer <token>
Response: { profile }
```

#### Get Availability
```
GET /consultant-flow/profiles/:id/availability
Headers: Authorization: Bearer <token>
Response: { availability, availabilitySlots }
```

#### Set Availability Slots
```
PUT /consultant-flow/profiles/:id/availability-slots
Headers: Authorization: Bearer <token>
Body: { availabilitySlots: [...] }
Response: { message }
```

### FCM (Push Notifications) (`/fcm`)

#### Register FCM Token
```
POST /fcm/token
Headers: Authorization: Bearer <token>
Body: { fcmToken, deviceType? }
Response: { success, message }
```

#### Delete FCM Token
```
DELETE /fcm/token
Headers: Authorization: Bearer <token>
Body: { fcmToken? }
Response: { success, message }
```

### Payments (`/payment`)

#### Create Payment Intent
```
POST /payment/create-intent
Headers: Authorization: Bearer <token>
Body: { amount, currency, bookingId }
Response: { clientSecret }
```

### Reviews (`/reviews`)

#### Create Review
```
POST /reviews
Headers: Authorization: Bearer <token>
Body: { consultantId, rating, comment }
Response: { review }
```

#### Get Consultant Reviews
```
GET /reviews/consultant/:id
Response: { reviews: [...] }
```

### Upload (`/upload`)

#### Upload Image
```
POST /upload/image
Headers: Authorization: Bearer <token>
Body: FormData (multipart/form-data)
Response: { url, publicId }
```

## 🔐 Authentication

All protected routes require Firebase ID token:

```http
Authorization: Bearer <firebase-id-token>
```

### Middleware

```typescript
import { authenticateUser } from './middleware/authMiddleware';

router.get('/protected', authenticateUser, controller.handler);
```

## 🗄️ Database Schema

### Firestore Collections

```typescript
// Users
/users/{userId}
  - name: string
  - email: string
  - role: 'student' | 'consultant' | 'admin'
  - profileImage: string | null
  - isActive: boolean
  - createdAt: timestamp
  - updatedAt: timestamp

// FCM Tokens
/users/{userId}/fcmTokens/{tokenId}
  - fcmToken: string
  - deviceType: 'ios' | 'android'
  - createdAt: timestamp
  - updatedAt: timestamp

// Bookings
/bookings/{bookingId}
  - studentId: string
  - consultantId: string
  - serviceId: string
  - date: string
  - time: string
  - amount: number
  - status: 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled'
  - paymentStatus: 'pending' | 'paid' | 'refunded'
  - createdAt: timestamp
  - updatedAt: timestamp

// Consultant Profiles
/consultantProfiles/{profileId}
  - uid: string
  - personalInfo: { fullName, email, bio, experience, profileImage }
  - professionalInfo: { category, title, specialties }
  - status: 'pending' | 'approved' | 'rejected'
  - createdAt: timestamp
```

## 📝 Key Features

### FCM Token Management

Store and manage FCM tokens for push notifications:

```typescript
// Register token
POST /fcm/token
{
  "fcmToken": "device-token",
  "deviceType": "ios"
}

// Delete token (on logout)
DELETE /fcm/token
{
  "fcmToken": "device-token"  // optional, deletes all if omitted
}
```

### Booking Management

Complete booking lifecycle:

1. Student creates booking → `POST /bookings`
2. Consultant views requests → `GET /bookings/consultant`
3. Consultant accepts → `PUT /bookings/:id/status`
4. Chat automatically enabled
5. Student can cancel → `POST /bookings/:id/cancel`

### Image Upload

Handles image uploads via Cloudinary:

```typescript
POST /upload/image
Content-Type: multipart/form-data
Body: { file: <image-file> }
Response: { url: "https://cloudinary.com/...", publicId: "..." }
```

## 🧪 Testing

```bash
# Run tests (if configured)
npm test

# Test authentication
npm run test-auth
```

## 🚀 Development

### Start Development Server

```bash
npm run dev
```

Server runs on: `http://localhost:4000`

### Build for Production

```bash
npm run build
npm run start:prod
```

### Health Check

```bash
GET /health
Response: { status: "healthy", firebase: "connected" }
```

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Kill process on port 4000
lsof -ti:4000 | xargs kill

# Or change PORT in .env
PORT=4001 npm run dev
```

### Firebase Connection Issues

1. Check service account key path in `src/config/firebase.ts`
2. Verify Firebase project ID matches
3. Ensure service account has proper permissions

### Build Errors

```bash
# Clean and rebuild
rm -rf dist node_modules
npm install
npm run build
```

### CORS Issues

CORS is configured to allow all origins in development. For production, update `src/app.ts`:

```typescript
app.use(cors({
  origin: 'https://your-frontend-domain.com',
  credentials: true
}));
```

## 🔒 Security

### Authentication Middleware

All protected routes use `authenticateUser` middleware:

```typescript
router.get('/protected', authenticateUser, (req, res) => {
  const user = req.user; // Decoded Firebase token
  // Handle request
});
```

### Role Authorization

Use `authorizeRole` for role-based access:

```typescript
router.get('/admin', 
  authenticateUser, 
  authorizeRole(['admin']), 
  (req, res) => {
    // Admin-only endpoint
  }
);
```

## 📊 Logging

The backend uses a custom logger:

```typescript
import { Logger } from './utils/logger';

Logger.info('route', 'userId', 'message');
Logger.error('route', 'userId', 'error message', error);
Logger.success('route', 'userId', 'success message');
```

All requests are automatically logged via `requestLogger` middleware.

## 🚢 Deployment

### Build for Production

```bash
npm run build:clean
```

### Environment Setup

Set environment variables on your hosting platform:
- Heroku: `heroku config:set KEY=value`
- AWS: Use environment variables in Lambda/EC2
- DigitalOcean: Set in `.env` file

### Recommended Hosting

- **Heroku** (Easy setup)
- **AWS EC2/Lambda** (Scalable)
- **DigitalOcean App Platform** (Simple)
- **Railway** (Modern)

## 📈 Monitoring

### Health Check Endpoint

```bash
GET /health
```

Returns server status and Firebase connection.

### Error Handling

All errors are caught and returned as JSON:

```json
{
  "error": "Error message"
}
```

## 🔗 Integration

### With Mobile App

The mobile app communicates with this API via:
- Base URL: `API_URL` environment variable
- Authentication: Firebase ID tokens
- Response format: JSON

### With Cloud Functions

Cloud Functions read FCM tokens from Firestore:
- Path: `/users/{userId}/fcmTokens`
- Created by: This backend API
- Used by: Cloud Functions for push notifications

## 📚 Additional Resources

- [Express.js Documentation](https://expressjs.com/)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [Stripe API](https://stripe.com/docs/api)
- [Cloudinary Documentation](https://cloudinary.com/documentation)

## ✅ Status

- ✅ Authentication system complete
- ✅ Booking management complete
- ✅ FCM token management complete
- ✅ Image upload working
- ✅ Payment integration complete
- ✅ Email service configured
- ✅ Consultant flow implemented

## 📝 Development Notes

### Code Style

- Use TypeScript strict mode
- Follow Express.js conventions
- Use async/await for async operations
- Handle errors properly
- Log all important operations

### Adding New Endpoints

1. Create controller in `src/controllers/`
2. Create route in `src/routes/`
3. Add route to `src/app.ts`
4. Add authentication middleware if needed
5. Test endpoint

### Error Handling

```typescript
try {
  // Operation
} catch (error) {
  Logger.error(route, userId, "Error message", error);
  res.status(500).json({ error: error.message });
}
```
