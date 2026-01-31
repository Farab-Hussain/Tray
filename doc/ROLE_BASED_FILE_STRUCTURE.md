# Tray Platform - Role-Based File Structure

This document provides a comprehensive overview of all files and components organized by user role in the Tray platform.

---

## 🎓 STUDENT ROLE FILES & COMPONENTS

### 📱 Mobile App (React Native)

#### **Screens**
```
app/src/Screen/Student/
├── Availability/
│   └── StudentAvailability.tsx              # Student availability management
├── Booking/
│   └── BookingScreen.tsx                    # Consultation booking interface
├── Cart/
│   └── CartScreen.tsx                       # Service cart management
├── Consultants/
│   ├── AllConsultants.tsx                   # Browse all consultants
│   ├── ConsultantDetailScreen.tsx           # View consultant details
│   └── ConsultantProfileScreen.tsx          # Consultant profile view
├── Home/
│   └── StudentHome.tsx                      # Student dashboard
├── Jobs/
│   ├── ApplicationDetailScreen.tsx          # Job application details
│   ├── AppliedJobsScreen.tsx                # View applied jobs
│   ├── JobDetailScreen.tsx                  # Job details view
│   ├── JobSearchScreen.tsx                  # Job search interface
│   └── JobsScreen.tsx                       # Main jobs screen
├── Payment/
│   └── PaymentScreen.tsx                    # Payment processing
├── Profile/
│   └── StudentProfile.tsx                   # Student profile management
├── Review/
│   ├── AllReviews.tsx                       # View all reviews
│   ├── EditReview.tsx                       # Edit existing review
│   ├── ReviewScreen.tsx                     # Write new review
│   └── ReviewsScreen.tsx                    # Reviews list
├── Services/
│   └── ServicesScreen.tsx                   # Services listing
├── SessionRating/
│   └── SessionRatingScreen.tsx              # Rate completed sessions
```

#### **Styles**
```
app/src/constants/styles/
├── studentProfileStyles.ts                  # Student profile styling
└── studentAvailabilityStyles.ts             # Availability screen styling
```

#### **Services**
```
app/src/services/
├── resume.service.ts                        # Resume management
├── job.service.ts                           # Job applications
├── booking.service.ts                       # Booking management
└── payment.service.ts                       # Payment processing
```

### 🌐 Web App (Next.js)

#### **Student Components**
```
web/components/student/                      # Student-specific components
```

### 🔧 Backend (Node.js/Express)

#### **Models**
```
backend/src/models/
├── resume.model.ts                          # Resume data structure
├── jobApplication.model.ts                  # Job application model
└── review.model.ts                          # Review data model
```

#### **Controllers**
```
backend/src/controllers/
├── resume.controller.ts                     # Resume CRUD operations
├── jobApplication.controller.ts             # Job application handling
├── booking.controller.ts                    # Booking management
├── payment.controller.ts                   # Payment processing
└── review.controller.ts                    # Review management
```

#### **Services**
```
backend/src/services/
├── resume.service.ts                        # Resume business logic
├── booking.service.ts                       # Booking business logic
├── payment.service.ts                       # Payment processing
└── notification.service.ts                 # Student notifications
```

#### **Routes**
```
backend/src/routes/
├── resume.routes.ts                         # Resume endpoints
├── job.routes.ts                            # Job-related endpoints
├── booking.routes.ts                        # Booking endpoints
└── payment.routes.ts                        # Payment endpoints
```

---

## 👨‍💼 CONSULTANT ROLE FILES & COMPONENTS

### 📱 Mobile App (React Native)

#### **Screens**
```
app/src/Screen/Consultant/
├── Account/
│   └── AccountSettings.tsx                 # Consultant account settings
├── Applications/
│   ├── ConsultantApplicationsScreen.tsx     # View consultant applications
│   └── consultantApplicationsScreenStyles.ts # Application screen styles
├── Availability/
│   └── ConsultantAvailability.tsx           # Manage availability
├── Clients/
│   └── ConsultantClients.tsx                # View client list
├── Dashboard/
│   └── ConsultantDashboard.tsx              # Consultant dashboard
├── Earnings/
│   └── Earnings.tsx                         # Earnings overview
├── Home/
│   └── ConsultantHome.tsx                   # Consultant home screen
├── Jobs/
│   ├── ConsultantJobApplications.tsx        # Job applications view
│   ├── ConsultantJobs.tsx                  # Jobs list
│   ├── MyJobsScreen.tsx                    # My posted jobs
│   └── consultantJobsScreenStyles.ts       # Jobs screen styles
├── Messages/
│   └── ConsultantMessages.tsx               # Message management
├── Notifications/
│   └── ConsultantNotifications.tsx          # Notification center
├── Payment/
│   └── StripePaymentSetup.tsx               # Stripe payment setup
├── Profile/
│   ├── ConsultantProfile.tsx                # Profile management
│   └── ConsultantProfileFlow.tsx            # Profile creation flow
├── Reviews/
│   └── ConsultantReviews.tsx               # View reviews
├── ServiceSetup/
│   └── ServiceSetup.tsx                     # Service configuration
├── Services/
│   └── ConsultantServices.tsx              # Services management
├── SessionCompletion/
│   └── SessionCompletion.tsx               # Complete sessions
├── Slots/
│   └── ConsultantSlots.tsx                  # Time slot management
├── Verification/
│   └── ConsultantVerification.tsx          # Verification process
└── PendingApproval.tsx                      # Pending approval screen
```

#### **Styles**
```
app/src/constants/styles/
├── consultantFlowStyles.ts                  # Consultant flow styling
├── consultantVerificationFlowStyles.ts      # Verification flow styles
├── consultantMyJobsScreenStyles.ts          # Jobs screen styles
├── ConsultantServiceCard.styles.ts          # Service card styling
├── consultantNotificationsStyles.ts         # Notifications styling
├── consultantStyles.ts                      # General consultant styles
├── consultantSlotsStyles.ts                 # Time slots styling
├── consultantCard.ts                        # Consultant card styles
├── consultantServicesStyles.ts              # Services styling
├── consultantApplicationsScreenStyles.ts     # Applications styling
├── consultantProfileFlowStyles.ts          # Profile flow styles
```

#### **Services**
```
app/src/services/
├── consultant.service.ts                    # Consultant API calls
└── consultantFlow.service.ts                # Consultant flow logic
```

#### **Data**
```
app/src/constants/data/
└── ConsultantProfileListData.ts             # Consultant profile data
```

### 🌐 Web App (Next.js)

#### **Consultant Components**
```
web/components/consultant/                   # Consultant-specific components
web/components/ui/
└── ConsultantPayoutRow.tsx                  # Payout row component
```

### 🔧 Backend (Node.js/Express)

#### **Models**
```
backend/src/models/
├── consultant.model.ts                       # Consultant data model
├── consultantProfile.model.ts                # Consultant profile model
└── consultantApplication.model.ts            # Consultant application model
```

#### **Controllers**
```
backend/src/controllers/
├── consultant.controller.ts                  # Consultant CRUD operations
└── consultantFlow.controller.ts             # Consultant flow management
```

#### **Services**
```
backend/src/services/
├── consultant.service.ts                    # Consultant business logic
└── consultantFlow.service.ts                # Consultant flow logic
```

#### **Routes**
```
backend/src/routes/
├── consultant.routes.ts                     # Consultant endpoints
└── consultantFlow.routes.ts                 # Consultant flow endpoints
```

#### **Middleware**
```
backend/src/middleware/
└── consultantMiddleware.ts                   # Consultant authentication
```

---

## 🏢 RECRUITER ROLE FILES & COMPONENTS

### 📱 Mobile App (React Native)

#### **Screens**
```
app/src/Screen/Recruiter/
├── Home/
│   └── RecruiterHome.tsx                    # Recruiter dashboard
├── Jobs/
│   ├── RecruiterJobs.tsx                    # Job management
│   ├── JobPostScreen.tsx                    # Post new job
│   ├── JobEditScreen.tsx                    # Edit existing job
│   ├── JobApplicationsScreen.tsx           # View applications
│   └── JobDetailScreen.tsx                  # Job details
└── Profile/
    └── RecruiterProfile.tsx                 # Recruiter profile
```

#### **Styles**
```
app/src/constants/styles/
├── recruiterJobsStyles.ts                    # Jobs screen styles
├── recruiterMyJobsScreenStyles.ts           # My jobs styles
├── recruiterHomeStyles.ts                    # Home screen styles
└── recruiterProfileStyles.ts                 # Profile styles
```

#### **Data**
```
app/src/constants/data/
└── RecruiterProfileListData.ts              # Recruiter profile data
```

### 🔧 Backend (Node.js/Express)

#### **Controllers**
```
backend/src/controllers/
├── job.controller.ts                        # Job posting management
└── jobApplication.controller.ts             # Application management
```

#### **Services**
```
backend/src/services/
├── job.service.ts                           # Job business logic
└── skillMatching.ts                        # Skill matching algorithm
```

#### **Routes**
```
backend/src/routes/
└── job.routes.ts                            # Job-related endpoints
```

---

## 🔧 ADMIN ROLE FILES & COMPONENTS

### 📱 Mobile App (React Native)

#### **Screens**
```
app/src/Screen/Admin/
└── RefundReview/
    └── AdminRefundReview.tsx                # Refund request review
```

### 🌐 Web App (Next.js)

#### **Admin Pages**
```
web/app/(root)/admin/
├── activity/                                # Activity monitoring
├── analytics/                               # Analytics dashboard
├── consultant-profiles/                     # Consultant management
├── service-applications/                    # Service application review
├── settings/                                # Admin settings
├── users/                                   # User management
├── layout.tsx                               # Admin layout
└── page.tsx                                 # Admin dashboard
```

#### **Admin Components**
```
web/components/admin/
├── AdminRouteGuard.tsx                      # Route protection
├── AdminActionCard.tsx                      # Action cards
├── AdminCard.tsx                            # General admin cards
├── AdminTable.tsx                            # Data tables
├── AdminSection.tsx                          # Page sections
├── AdminWidget.tsx                           # Dashboard widgets
├── AdminStatsCard.tsx                        # Statistics cards
└── AdminStatItem.tsx                        # Individual stats
```

### 🔧 Backend (Node.js/Express)

#### **Controllers**
```
backend/src/controllers/
├── analytics.controller.ts                  # Analytics data
├── activity.controller.ts                   # Activity tracking
├── payout.controller.ts                     # Payout management
└── support.controller.ts                    # Support tickets
```

#### **Services**
```
backend/src/services/
├── analytics.service.ts                     # Analytics processing
├── payout.service.ts                        # Payout calculations
└── reminder.service.ts                      # Automated reminders
```

#### **Routes**
```
backend/src/routes/
├── analytics.routes.ts                      # Analytics endpoints
├── activity.routes.ts                       # Activity endpoints
└── payout.routes.ts                         # Payout endpoints
```

---

## 🔄 SHARED COMPONENTS & SERVICES

### 🔐 Authentication
```
backend/src/
├── controllers/auth.Controller.ts           # Authentication controller
├── middleware/authMiddleware.ts             # Authentication middleware
├── routes/auth.routes.ts                     # Auth endpoints
└── services/auth.service.ts                  # Auth business logic
```

### 📁 File Management
```
backend/src/
├── controllers/upload.controller.ts         # File upload controller
├── routes/upload.routes.ts                   # Upload endpoints
└── services/upload.service.ts                # Upload business logic
```

### 💬 Communication
```
backend/src/
├── controllers/notification.controller.ts    # Notifications
├── controllers/fcm.controller.ts            # Push notifications
├── routes/notification.routes.ts             # Notification endpoints
├── routes/fcm.routes.ts                      # FCM endpoints
├── services/notification.service.ts          # Notification logic
├── services/chat.Service.ts                  # Chat functionality
└── services/call.service.ts                  # Video/audio calls
```

### 📊 Analytics & Monitoring
```
backend/src/
├── controllers/analytics.controller.ts       # Analytics data
├── routes/analytics.routes.ts                # Analytics endpoints
└── services/analytics.service.ts             # Analytics processing
```

---

## 📋 SUMMARY

### **Student Role**: 25+ files
- Core functionality: Profile, Jobs, Bookings, Payments, Reviews
- Focus on job searching and consultation booking

### **Consultant Role**: 40+ files  
- Core functionality: Profile, Services, Availability, Earnings, Clients
- Focus on service delivery and client management

### **Recruiter Role**: 10+ files
- Core functionality: Job Posting, Application Management, Profile
- Focus on talent acquisition and job management

### **Admin Role**: 20+ files
- Core functionality: Analytics, User Management, Monitoring, Support
- Focus on platform oversight and operations

### **Shared Services**: 15+ files
- Authentication, File Management, Communication, Analytics
- Common infrastructure supporting all roles

---

**Last Updated**: Comprehensive file analysis across all platform components  
**Total Files Analyzed**: 100+ role-specific files and components
