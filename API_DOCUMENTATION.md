# API Documentation

## Base URL
- **Development**: `http://localhost:4000` or your ngrok URL
- **Production**: Your production server URL

## Authentication
Most endpoints require authentication via Firebase ID token in the Authorization header:
```
Authorization: Bearer <firebase-id-token>
```

---

## Authentication Endpoints

### POST /auth/register
Register a new user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe",
  "role": "student"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "user": {
    "uid": "user-id",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "student"
  }
}
```

### POST /auth/login
Login with Firebase credentials.

**Request Body:**
```json
{
  "idToken": "firebase-id-token"
}
```

**Response:**
```json
{
  "user": {
    "uid": "user-id",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "student"
  }
}
```

### GET /auth/me
Get current user details (requires authentication).

**Response:**
```json
{
  "user": {
    "uid": "user-id",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "student"
  }
}
```

### PUT /auth/profile
Update user profile (requires authentication).

**Request Body:**
```json
{
  "name": "Updated Name",
  "phone": "+1234567890"
}
```

### POST /auth/forgot-password
Request password reset OTP.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

### POST /auth/verify-otp
Verify OTP for password reset.

**Request Body:**
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

### POST /auth/reset-password
Reset password after OTP verification.

**Request Body:**
```json
{
  "email": "user@example.com",
  "otp": "123456",
  "newPassword": "newpassword123"
}
```

---

## Consultant Endpoints

### GET /consultants
Get all consultants with pagination.

**Query Parameters:**
- `page` (optional, default: 1) - Page number
- `limit` (optional, default: 20, max: 100) - Items per page

**Response:**
```json
{
  "consultants": [
    {
      "uid": "consultant-id",
      "name": "Consultant Name",
      "category": "Career Counseling",
      "rating": 4.5,
      "totalReviews": 10,
      "profileImage": "https://..."
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "totalPages": 3,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

### GET /consultants/top
Get top-rated consultant.

**Response:**
```json
{
  "topConsultants": [
    {
      "uid": "consultant-id",
      "name": "Top Consultant",
      "category": "Career Counseling",
      "rating": 5.0,
      "totalReviews": 25,
      "profileImage": "https://..."
    }
  ]
}
```

### GET /consultants/:uid
Get consultant by ID.

**Response:**
```json
{
  "consultant": {
    "uid": "consultant-id",
    "name": "Consultant Name",
    "category": "Career Counseling",
    "rating": 4.5,
    "totalReviews": 10,
    "profileImage": "https://...",
    "bio": "Consultant bio...",
    "availability": {}
  }
}
```

### GET /consultants/:consultantId/services
Get all services for a specific consultant.

**Response:**
```json
{
  "services": [
    {
      "id": "service-id",
      "title": "Service Title",
      "description": "Service description",
      "duration": 60,
      "price": 100,
      "imageUrl": "https://..."
    }
  ]
}
```

### GET /consultants/services/all
Get all services from all consultants with pagination.

**Query Parameters:**
- `page` (optional, default: 1) - Page number
- `limit` (optional, default: 20, max: 100) - Items per page

**Response:**
```json
{
  "services": [
    {
      "id": "service-id",
      "title": "Service Title",
      "description": "Service description",
      "duration": 60,
      "price": 100,
      "imageUrl": "https://...",
      "consultant": {
        "uid": "consultant-id",
        "name": "Consultant Name",
        "category": "Career Counseling",
        "rating": 4.5,
        "totalReviews": 10,
        "profileImage": "https://..."
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

### GET /consultants/services/:serviceId
Get service by ID.

**Response:**
```json
{
  "service": {
    "id": "service-id",
    "title": "Service Title",
    "description": "Service description",
    "duration": 60,
    "price": 100,
    "imageUrl": "https://..."
  }
}
```

---

## Booking Endpoints

### POST /bookings
Create a new booking (requires authentication).

**Request Body:**
```json
{
  "consultantId": "consultant-id",
  "serviceId": "service-id",
  "date": "2024-01-15",
  "timeSlot": "10:00",
  "duration": 60
}
```

**Response:**
```json
{
  "booking": {
    "id": "booking-id",
    "studentId": "student-id",
    "consultantId": "consultant-id",
    "serviceId": "service-id",
    "date": "2024-01-15",
    "timeSlot": "10:00",
    "status": "pending",
    "paymentStatus": "pending"
  }
}
```

### GET /bookings/student
Get all bookings for the authenticated student.

**Response:**
```json
{
  "bookings": [
    {
      "id": "booking-id",
      "consultantId": "consultant-id",
      "serviceId": "service-id",
      "date": "2024-01-15",
      "timeSlot": "10:00",
      "status": "confirmed",
      "paymentStatus": "paid"
    }
  ]
}
```

### GET /bookings/consultant
Get all bookings for the authenticated consultant.

**Response:**
```json
{
  "bookings": [
    {
      "id": "booking-id",
      "studentId": "student-id",
      "serviceId": "service-id",
      "date": "2024-01-15",
      "timeSlot": "10:00",
      "status": "pending"
    }
  ]
}
```

### PUT /bookings/:bookingId/status
Update booking status (requires authentication).

**Request Body:**
```json
{
  "status": "confirmed"
}
```

**Valid statuses:** `pending`, `confirmed`, `accepted`, `approved`, `completed`, `cancelled`

### POST /bookings/:bookingId/cancel
Cancel a booking (requires authentication).

**Response:**
```json
{
  "message": "Booking cancelled successfully"
}
```

---

## Review Endpoints

### POST /reviews
Create a review (requires authentication, student only).

**Request Body:**
```json
{
  "consultantId": "consultant-id",
  "rating": 5,
  "comment": "Great service!",
  "recommend": true
}
```

**Response:**
```json
{
  "message": "Review created successfully",
  "review": {
    "id": "review-id",
    "studentId": "student-id",
    "consultantId": "consultant-id",
    "rating": 5,
    "comment": "Great service!",
    "recommend": true
  }
}
```

### GET /reviews/consultant/:consultantId
Get all reviews for a consultant with pagination.

**Query Parameters:**
- `page` (optional, default: 1) - Page number
- `limit` (optional, default: 20, max: 100) - Items per page

**Response:**
```json
{
  "reviews": [
    {
      "id": "review-id",
      "studentId": "student-id",
      "consultantId": "consultant-id",
      "rating": 5,
      "comment": "Great service!",
      "studentName": "Student Name",
      "studentProfileImage": "https://..."
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "totalPages": 3,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

### GET /reviews/my-reviews
Get reviews written by the authenticated user (requires authentication).

**Response:**
```json
{
  "reviews": [
    {
      "id": "review-id",
      "consultantId": "consultant-id",
      "rating": 5,
      "comment": "Great service!",
      "consultantName": "Consultant Name",
      "consultantProfileImage": "https://..."
    }
  ]
}
```

### PUT /reviews/:reviewId
Update a review (requires authentication).

**Request Body:**
```json
{
  "rating": 4,
  "comment": "Updated comment"
}
```

### DELETE /reviews/:reviewId
Delete a review (requires authentication).

**Response:**
```json
{
  "message": "Review deleted successfully"
}
```

---

## Payment Endpoints

### GET /payment/config
Get Stripe publishable key.

**Response:**
```json
{
  "publishableKey": "pk_test_...",
  "mode": "test"
}
```

### POST /payment/create-payment-intent
Create a payment intent (requires authentication).

**Request Body:**
```json
{
  "amount": 10000,
  "currency": "usd",
  "bookingId": "booking-id"
}
```

**Response:**
```json
{
  "clientSecret": "pi_xxx_secret_xxx"
}
```

### POST /payment/webhook
Stripe webhook endpoint (handled by Stripe).

---

## Upload Endpoints

### POST /upload/profile-image
Upload profile image (requires authentication, multipart/form-data).

**Request:**
- `image` (file) - Image file

**Response:**
```json
{
  "imageUrl": "https://cloudinary.com/...",
  "message": "Profile image uploaded successfully"
}
```

### POST /upload/service-image
Upload service image (requires authentication, multipart/form-data).

**Request:**
- `image` (file) - Image file

**Response:**
```json
{
  "imageUrl": "https://cloudinary.com/...",
  "message": "Service image uploaded successfully"
}
```

---

## Consultant Flow Endpoints

### GET /consultant-flow/status
Get consultant verification status (requires authentication).

**Response:**
```json
{
  "hasProfile": true,
  "profileStatus": "approved",
  "hasApplications": true,
  "applications": [
    {
      "id": "application-id",
      "serviceId": "service-id",
      "status": "approved"
    }
  ]
}
```

### POST /consultant-flow/profiles
Create consultant profile (requires authentication).

**Request Body:**
```json
{
  "name": "Consultant Name",
  "category": "Career Counseling",
  "bio": "Consultant bio...",
  "experience": "5 years",
  "education": "MBA"
}
```

### GET /consultant-flow/profiles/:consultantId
Get consultant profile.

**Response:**
```json
{
  "profile": {
    "consultantId": "consultant-id",
    "name": "Consultant Name",
    "category": "Career Counseling",
    "bio": "Consultant bio...",
    "status": "approved"
  }
}
```

### PUT /consultant-flow/profiles/:consultantId/availability-slots
Set availability slots (requires authentication).

**Request Body:**
```json
{
  "availabilitySlots": [
    {
      "date": "2024-01-15",
      "timeSlots": ["10:00", "11:00", "14:00"]
    }
  ]
}
```

---

## Notification Endpoints

### POST /notifications/send-message
Send message notification (requires authentication).

**Request Body:**
```json
{
  "receiverId": "user-id",
  "chatId": "chat-id",
  "messageText": "Hello!",
  "senderName": "Sender Name"
}
```

### POST /notifications/send-call
Send call notification (requires authentication).

**Request Body:**
```json
{
  "receiverId": "user-id",
  "callId": "call-id",
  "callType": "audio",
  "callerId": "caller-id",
  "callerName": "Caller Name"
}
```

---

## FCM Endpoints

### POST /fcm/register
Register FCM token (requires authentication).

**Request Body:**
```json
{
  "fcmToken": "fcm-token-string"
}
```

### DELETE /fcm/token
Delete FCM token (requires authentication).

**Request Body:**
```json
{
  "fcmToken": "fcm-token-string"
}
```

---

## Analytics Endpoints

### GET /analytics/consultant
Get consultant analytics (requires authentication, consultant only).

**Query Parameters:**
- `period` (optional, default: "month") - `week`, `month`, or `year`

**Response:**
```json
{
  "totalBookings": 50,
  "totalEarnings": 5000,
  "averageRating": 4.5,
  "totalReviews": 25
}
```

### GET /analytics/admin
Get admin analytics (requires authentication, admin only).

**Response:**
```json
{
  "totalUsers": 1000,
  "totalConsultants": 50,
  "totalBookings": 500,
  "totalRevenue": 50000
}
```

---

## Support Endpoints

### POST /support
Send support message (requires authentication).

**Request Body:**
```json
{
  "subject": "Issue with booking",
  "message": "I'm having trouble with...",
  "category": "booking"
}
```

**Response:**
```json
{
  "message": "Support ticket created successfully",
  "ticketId": "ticket-id"
}
```

---

## Health Check

### GET /health
Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:00:00Z",
  "uptime": 3600,
  "environment": "development",
  "services": {
    "firebase": {
      "status": "connected",
      "responseTime": 50
    }
  },
  "memory": {
    "used": 100,
    "total": 512,
    "percentage": 19
  }
}
```

---

## Error Responses

All endpoints may return error responses in the following format:

```json
{
  "error": "Error message description"
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

## Rate Limiting

Currently, there is no rate limiting implemented. Consider adding rate limiting for production use.

## Pagination

Most list endpoints support pagination with the following query parameters:
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20, max varies by endpoint)

Pagination response includes:
- `page` - Current page
- `limit` - Items per page
- `total` - Total items
- `totalPages` - Total number of pages
- `hasNextPage` - Boolean indicating if there are more pages
- `hasPrevPage` - Boolean indicating if there are previous pages

