# Architecture Documentation

## System Overview

The Tray application is a multi-platform consultant booking system consisting of three main components:

1. **React Native Mobile App** - iOS and Android applications
2. **Node.js/Express Backend** - REST API server
3. **Next.js Web Dashboard** - Admin and consultant web interface

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Applications                       │
├──────────────────────┬──────────────────┬───────────────────┤
│  React Native App    │   Next.js Web     │   (Future: API    │
│  (iOS/Android)       │   Dashboard       │    Clients)       │
└──────────┬───────────┴──────────┬────────┴───────────────────┘
           │                      │
           │  HTTPS/REST API      │
           │                      │
           └──────────┬───────────┘
                      │
        ┌─────────────▼─────────────┐
        │   Express.js Backend       │
        │   (Node.js/TypeScript)    │
        └─────────────┬─────────────┘
                      │
        ┌─────────────┼─────────────┐
        │             │             │
   ┌────▼────┐  ┌────▼────┐  ┌────▼────┐
   │ Firebase │  │ Stripe  │  │Cloudinary│
   │ Firestore│  │ Payment │  │  Storage │
   │   Auth   │  │ Gateway │  │          │
   └──────────┘  └─────────┘  └──────────┘
```

---

## Mobile App Architecture

### Technology Stack
- **Framework**: React Native 0.82.1
- **Language**: TypeScript
- **Navigation**: React Navigation 7.x
- **State Management**: React Context API
- **API Client**: Axios + SWR
- **Real-time**: Firebase Firestore
- **Push Notifications**: Firebase Cloud Messaging
- **WebRTC**: react-native-webrtc

### Architecture Layers

```
┌─────────────────────────────────────────┐
│           Presentation Layer             │
│  (Screens, Components, Navigation)      │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│          Business Logic Layer           │
│  (Contexts, Hooks, Services)            │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│           Data Access Layer              │
│  (API Client, Firebase SDK)             │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│          External Services               │
│  (Backend API, Firebase, Stripe)         │
└─────────────────────────────────────────┘
```

### Key Directories

```
app/src/
├── Screen/              # Screen components
│   ├── Auth/           # Authentication screens
│   ├── Student/        # Student role screens
│   ├── Consultant/     # Consultant role screens
│   └── common/         # Shared screens
├── components/          # Reusable components
│   ├── ui/            # UI components
│   ├── shared/        # Shared components
│   └── consultant/    # Consultant-specific
├── contexts/           # React Context providers
├── services/           # API service layer
├── navigator/         # Navigation configuration
├── hooks/             # Custom React hooks
├── lib/               # Utilities and configs
└── constants/         # Constants and styles
```

### State Management Flow

```
User Action
    │
    ▼
Screen Component
    │
    ▼
Hook/Context
    │
    ▼
Service Layer
    │
    ▼
API Client
    │
    ▼
Backend API
    │
    ▼
Response → Update State → Re-render
```

---

## Backend Architecture

### Technology Stack
- **Framework**: Express.js 5.1.0
- **Language**: TypeScript
- **Database**: Firebase Firestore
- **Authentication**: Firebase Admin SDK
- **Payment**: Stripe
- **Storage**: Cloudinary
- **Email**: Nodemailer

### Architecture Layers

```
┌─────────────────────────────────────────┐
│            Route Layer                   │
│  (Express Routes, Middleware)           │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│         Controller Layer                 │
│  (Request/Response Handling)             │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│          Service Layer                   │
│  (Business Logic, Data Processing)      │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│          Model Layer                     │
│  (Data Models, Validation)               │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│         Data Access Layer                │
│  (Firebase SDK, External APIs)           │
└─────────────────────────────────────────┘
```

### Key Directories

```
backend/src/
├── routes/           # Express route definitions
├── controllers/      # Request/response handlers
├── services/         # Business logic
├── models/           # Data models
├── middleware/       # Express middleware
├── utils/            # Utility functions
├── config/           # Configuration files
└── types/            # TypeScript type definitions
```

### Request Flow

```
HTTP Request
    │
    ▼
CORS Middleware
    │
    ▼
Authentication Middleware
    │
    ▼
Validation Middleware
    │
    ▼
Route Handler
    │
    ▼
Controller
    │
    ▼
Service Layer
    │
    ▼
Firebase/External API
    │
    ▼
Response → Controller → Route → Client
```

---

## Web Dashboard Architecture

### Technology Stack
- **Framework**: Next.js 15.5.4
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Authentication**: Firebase Client SDK
- **API Client**: Axios

### Architecture Pattern

```
┌─────────────────────────────────────────┐
│         Next.js App Router              │
│  (Pages, Layouts, Route Handlers)       │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│         Component Layer                  │
│  (React Components, UI Components)      │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│         Context/Hooks Layer             │
│  (Auth Context, Custom Hooks)           │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│         API Client Layer                │
│  (Axios, API Utilities)                 │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│         Backend API                     │
└─────────────────────────────────────────┘
```

---

## Data Flow

### Authentication Flow

```
1. User registers/logs in via Firebase Auth
2. Mobile app receives Firebase ID token
3. Token sent to backend /auth/login
4. Backend verifies token with Firebase Admin
5. Backend returns user data + custom claims
6. Token stored in app state
7. Token included in subsequent API requests
```

### Booking Flow

```
1. Student browses consultants/services
2. Selects service and time slot
3. Creates booking (POST /bookings)
4. Backend creates booking document in Firestore
5. Payment intent created via Stripe
6. Student completes payment
7. Booking status updated to "confirmed"
8. Notifications sent to consultant
9. Reminder scheduled (24h before)
10. Session completion
11. Review submission
```

### Consultant Onboarding Flow

```
1. User requests consultant role
2. Creates consultant profile
3. Profile submitted for admin approval
4. Admin reviews and approves/rejects
5. Consultant applies for services
6. Service applications reviewed
7. Approved services available for booking
8. Consultant sets availability
9. Ready to receive bookings
```

---

## Database Schema

### Firestore Collections

```
users/
  {uid}/
    - email, name, role, createdAt, etc.

consultants/
  {uid}/
    - name, category, rating, profileImage, etc.

consultantProfiles/
  {consultantId}/
    - bio, experience, education, status, etc.

services/
  {serviceId}/
    - title, description, price, duration, consultantId, etc.

bookings/
  {bookingId}/
    - studentId, consultantId, serviceId, date, timeSlot, status, etc.

reviews/
  {reviewId}/
    - studentId, consultantId, rating, comment, etc.

chats/
  {chatId}/
    - participants, lastMessage, etc.

messages/
  {chatId}/
    messages/
      {messageId}/
        - senderId, text, createdAt, etc.

notifications/
  {userId}/
    notifications/
      {notificationId}/
        - type, title, body, read, etc.
```

---

## Security Architecture

### Authentication
- Firebase Authentication for user management
- JWT tokens (Firebase ID tokens) for API authentication
- Role-based access control (student, consultant, admin)

### Authorization
- Middleware checks user roles
- Route-level permissions
- Resource-level permissions (users can only access their own data)

### Data Validation
- Express-validator for request validation
- TypeScript for type safety
- Input sanitization

### Security Best Practices
- HTTPS only in production
- CORS configuration
- Rate limiting (to be implemented)
- SQL injection prevention (using Firestore)
- XSS prevention (input sanitization)

---

## Deployment Architecture

### Development
```
Local Development
├── React Native: Metro Bundler
├── Backend: ts-node-dev (hot reload)
└── Web: Next.js dev server
```

### Production
```
Production Deployment
├── Mobile App: App Store / Play Store
├── Backend: Vercel / AWS / Heroku
├── Web Dashboard: Vercel
└── Firebase: Google Cloud
```

---

## Performance Optimizations

### Backend
- ✅ Pagination for list endpoints
- ✅ In-memory cache with LRU eviction
- ✅ Database query optimization
- ✅ Scheduled job timeouts
- ⚠️ Rate limiting (to be implemented)
- ⚠️ Database indexing optimization

### Mobile App
- ✅ Image caching
- ✅ Lazy loading
- ✅ Pagination support
- ⚠️ Code splitting (to be implemented)
- ⚠️ Bundle size optimization

### Web Dashboard
- ✅ Next.js automatic optimization
- ✅ Server-side rendering
- ⚠️ Image optimization (to be implemented)

---

## Monitoring & Logging

### Current Implementation
- Request logging middleware
- Error logging
- Console logging for debugging

### Recommended Additions
- Application performance monitoring (APM)
- Error tracking (Sentry)
- Analytics (Google Analytics / Mixpanel)
- Uptime monitoring
- Database query monitoring

---

## Scalability Considerations

### Current Limitations
- Single server instance
- In-memory cache (not distributed)
- No load balancing
- No database sharding

### Future Improvements
- Horizontal scaling with load balancer
- Distributed cache (Redis)
- Database read replicas
- CDN for static assets
- Microservices architecture (if needed)

---

## Integration Points

### External Services
1. **Firebase**
   - Authentication
   - Firestore database
   - Cloud Messaging

2. **Stripe**
   - Payment processing
   - Connect accounts for consultants
   - Webhook handling

3. **Cloudinary**
   - Image storage
   - Image transformations

4. **Email Service**
   - Nodemailer for transactional emails
   - OTP delivery

---

## Error Handling

### Backend
- Global error handler middleware
- Try-catch blocks in controllers
- Error logging
- Standardized error responses

### Mobile App
- Error boundaries (to be implemented)
- Toast notifications for errors
- Graceful degradation
- Retry mechanisms

---

## Testing Strategy

### Current State
- Basic Jest setup
- Limited test coverage

### Recommended
- Unit tests for services
- Integration tests for API endpoints
- E2E tests for critical flows
- Component tests for React components
- Performance tests

---

## Future Enhancements

1. **Real-time Features**
   - WebSocket support for live updates
   - Real-time chat improvements
   - Live booking availability

2. **Advanced Features**
   - Video recording of sessions
   - Document sharing
   - Calendar integration
   - Multi-language support

3. **Analytics**
   - User behavior tracking
   - Business intelligence
   - Predictive analytics

4. **Mobile App**
   - Offline support
   - Push notification improvements
   - Background sync

