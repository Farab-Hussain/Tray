# Tray Web Dashboard

Next.js 15 application delivering Tray's browser-based admin experience for platform administration. The dashboard integrates with Firebase authentication and the Tray backend API, providing comprehensive admin tooling for analytics, user management, consultant profile approvals, service application management, and platform administration.

## Overview

The Tray Web Dashboard is a modern, responsive web application built with Next.js 15, React 19, and Tailwind CSS 4. It provides an administrative interface for managing the Tray platform through a clean, intuitive web interface. All consultant and student functionality is available in the mobile app.

## Key Features

### Admin Dashboard
- **Analytics & Statistics**: Platform-wide metrics, revenue tracking, user counts, growth deltas
- **User Management**: View, manage, and monitor all platform users
- **Consultant Profiles**: Review, approve, or reject consultant profile applications
- **Service Applications**: Manage consultant service applications with approval workflow
- **Activity Monitoring**: Track recent platform activities and events
- **Settings**: Configure platform settings and preferences

### Core Functionality
- **Firebase Authentication**: Email/password authentication with Firebase Web SDK (admin only)
- **Role-Based Access Control**: Admin-only access with route protection
- **Real-time Updates**: Auto-refresh for dashboard statistics
- **Responsive Design**: Mobile, tablet, and desktop support
- **API Integration**: Comprehensive backend API integration via Axios

## Tech Stack

- **Framework**: Next.js 15.5.4 (App Router with Turbopack)
- **React**: React 19.1.0 with TypeScript 5
- **Styling**: Tailwind CSS 4.0
- **Authentication**: Firebase Web SDK (Firebase Auth)
- **HTTP Client**: Axios 1.12.2
- **Icons**: Lucide React 0.544.0
- **Fonts**: Geist Sans & Geist Mono (Google Fonts)

## Prerequisites

- **Node.js** ≥ 20
- **npm** or **yarn** package manager
- **Firebase Project** with Authentication enabled
- **Backend API**: Running Tray backend server accessible via `NEXT_PUBLIC_API_URL`
- **Environment Variables**: Create `.env.local` file (see Environment Variables section)
- **Admin Account**: Valid admin user account in Firebase

## Project Structure

```
web/
├── app/                            # Next.js App Router pages
│   ├── layout.tsx                  # Root layout with fonts
│   ├── (root)/                     # Main application routes
│   │   ├── layout.tsx              # Root layout with AuthProvider and sidebar
│   │   ├── page.tsx                # Home page (redirects admin to /admin)
│   │   │
│   │   └── admin/                  # Admin dashboard routes (7 pages)
│   │       ├── layout.tsx          # Admin layout with AdminRouteGuard
│   │       ├── page.tsx            # Admin dashboard (stats, activities)
│   │       ├── users/
│   │       │   └── page.tsx        # User management page
│   │       ├── consultant-profiles/
│   │       │   └── page.tsx        # Consultant profile approvals
│   │       ├── service-applications/
│   │       │   └── page.tsx        # Service application approvals
│   │       ├── analytics/
│   │       │   └── page.tsx        # Analytics dashboard
│   │       ├── activity/
│   │       │   └── page.tsx        # Activity log
│   │       └── settings/
│   │           └── page.tsx        # Platform settings
│   │   └── consultant/             # Consultant routes (6 pages, legacy)
│   │       ├── page.tsx            # Consultant dashboard
│   │       ├── profile/
│   │       ├── services/
│   │       ├── applications/
│   │       └── status/
│   │
│   ├── login/
│   │   └── page.tsx                # Firebase email/password login
│   ├── verify-email/
│   │   └── page.tsx                # Email verification page
│   └── api/
│       └── verify-email/           # Email verification API route
│
├── components/
│   ├── admin/                      # Admin-specific components (9 components)
│   │   ├── AdminRouteGuard.tsx     # Admin route protection
│   │   ├── AdminCard.tsx           # Admin dashboard cards
│   │   ├── AdminActionCard.tsx     # Action cards for dashboard
│   │   ├── AdminSection.tsx        # Section wrapper component
│   │   ├── AdminStatItem.tsx       # Statistics display component
│   │   ├── AdminStatsCard.tsx      # Statistics card container
│   │   ├── AdminTable.tsx          # Data table component
│   │   ├── AdminWidget.tsx         # Dashboard widget component
│   │   └── ApprovalModal.tsx       # Approval/rejection modal
│   │
│   ├── consultant/                 # Consultant-specific components (6 components)
│   │   ├── ProfileCard.tsx
│   │   ├── MultiStepProfileForm.tsx
│   │   ├── ConsultantRouteGuard.tsx
│   │   ├── ServicesStepIndicator.tsx
│   │   ├── ApplicationCard.tsx
│   │   └── ProfileStatusBadge.tsx
│   │
│   ├── shared/                     # Shared layout components (4 components)
│   │   ├── Header.tsx              # Top header/navigation
│   │   ├── LeftSide.tsx            # Left sidebar navigation
│   │   ├── RightSide.tsx           # Right sidebar (notifications, etc.)
│   │   └── MobileHeader.tsx        # Mobile header component
│   │
│   ├── ui/                         # Generic UI components (14 components)
│   └── custom/                     # Custom components (1 component)
│       └── Button.tsx              # Custom button component
│   │   ├── StatCard.tsx            # Statistics card
│   │   ├── StatusBadge.tsx         # Status badge
│   │   ├── Dropdown.tsx            # Dropdown select component
│   │   ├── ServiceCard.tsx         # Service card display
│   │   ├── ServiceIcon.tsx         # Service icon component
│   │   ├── ServicesTop.tsx         # Services page header
│   │   ├── BookingRow.tsx          # Booking row component
│   │   ├── ClientList.tsx          # Client list component
│   │   ├── CommissionRow.tsx       # Commission row component
│   │   ├── ConsultantPayoutRow.tsx # Consultant payout row
│   │   ├── FundsTransactionsTable.tsx # Transactions table
│   │   └── TransactionRow.tsx      # Transaction row component
│   │
│   └── custom/                     # Custom components
│       └── Button.tsx              # Custom button component
│
├── contexts/
│   └── AuthContext.tsx             # Authentication context provider
│
├── utils/
│   ├── api.ts                      # Axios client + API helpers
│   └── index.ts                    # Utility functions (formatting, etc.)
│
├── config/
│   └── firebase.ts                 # Firebase Web SDK configuration
│
├── constants/
│   └── index.ts                    # Application constants (routes, labels, etc.)
│
├── types/
│   └── index.ts                    # TypeScript type definitions
│
├── hooks/
│   └── useKeyboardAvoidance.ts     # Keyboard avoidance hook for mobile
│
├── styles/
│   └── globals.css                 # Global styles + Tailwind imports
│
├── public/
│   ├── icons/
│   │   └── logo.svg                # Application logo
│   └── images/
│       ├── banner.png              # Banner image
│       └── services.png            # Services image
│
├── package.json                    # Dependencies and scripts
├── next.config.ts                  # Next.js configuration
├── tailwind.config.js              # Tailwind CSS configuration
├── tsconfig.json                   # TypeScript configuration
├── eslint.config.mjs               # ESLint configuration
├── postcss.config.mjs              # PostCSS configuration
└── README.md                       # This file
```

## Environment Variables

Create a `.env.local` file in the `web/` directory (same level as `package.json`):

```env
# Backend REST API Base URL
NEXT_PUBLIC_API_URL=http://localhost:4000
# OR use ngrok URL for mobile development
# NEXT_PUBLIC_API_URL=https://your-ngrok-url.ngrok.io

# Firebase Web SDK Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id  # Optional (for Analytics)
```

**Important Notes:**
- All variables are prefixed with `NEXT_PUBLIC_` because they're used in the browser
- Never commit `.env.local` to version control
- For mobile testing, use ngrok URL or deployed backend URL (not localhost)
- Firebase configuration must match the backend's Firebase project

## Installation

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Environment Variables

- Create `.env.local` file in `web/` directory
- Add all required environment variables (see Environment Variables section)
- Verify Firebase configuration matches your Firebase project

### 3. Verify Backend Connection

- Ensure the Tray backend API is running
- Verify `NEXT_PUBLIC_API_URL` points to the correct backend URL
- Test connection: `curl http://localhost:4000/health`

## Development

### Start Development Server

```bash
npm run dev
```

This starts the development server with Turbopack at `http://localhost:3000`.

### Development with External Access

```bash
npm run dev:external
```

This makes the dev server accessible on your local network (`0.0.0.0`), useful for testing on mobile devices or other computers on the same network.

### Available Scripts

- `npm run dev` - Start development server with Turbopack (default: `localhost:3000`)
- `npm run dev:external` - Start dev server accessible on local network
- `npm run build` - Build production bundle with Turbopack
- `npm run start` - Start production server (requires build first)
- `npm run lint` - Run ESLint

### Troubleshooting Turbopack

If Turbopack runs into incompatibilities, temporarily fall back to standard Next.js dev:

```bash
# Edit package.json to remove --turbopack flag
# Or use next dev directly
npx next dev
```

## Authentication Flow

### Login Process

1. User navigates to `/login`
2. User enters admin email and password
3. Firebase Web SDK authenticates user
4. Firebase ID token is obtained
5. Token is sent to backend `/auth/login` endpoint
6. Backend returns user profile data with role
7. Token and user data stored in `localStorage`
8. User redirected to `/admin` dashboard (admin role required)

### Email Verification

1. Admin user receives Firebase verification email
2. Clicks verification link
3. Link opens `/verify-email` page with verification token
4. Page processes verification via Firebase Web SDK
5. User redirected to admin dashboard after successful verification

### Route Protection

- **Admin Routes**: Protected by `AdminRouteGuard` component
  - Checks authentication status
  - Verifies user role is `admin`
  - Redirects to login if not authenticated or not admin
  - Non-admin users are denied access

### Session Management

- Token stored in `localStorage` as `authToken`
- User data stored in `localStorage` as `user`
- Token automatically included in API requests via Axios interceptor
- On 401 response, user is logged out and redirected to login
- AuthContext manages global authentication state

## Pages and Routes

### Public Routes

- `/` - Home page (redirects admin to `/admin`, others to login)
- `/login` - Firebase email/password login (admin only)
- `/verify-email` - Email verification page

### Admin Routes (`/admin`)

All routes require admin authentication:

- `/admin` - Admin dashboard (stats, activities)
- `/admin/users` - User management
- `/admin/consultant-profiles` - Consultant profile approvals
- `/admin/service-applications` - Service application approvals
- `/admin/analytics` - Platform analytics
- `/admin/activity` - Activity log
- `/admin/settings` - Platform settings

**Note**: Non-admin users attempting to access admin routes will be redirected to login or shown an access denied message.

## Components

### Admin Components (`components/admin/`)

- **AdminRouteGuard**: Route protection for admin pages (verifies admin role)
- **AdminCard**: Dashboard card component
- **AdminActionCard**: Action card with icon and description
- **AdminSection**: Section wrapper with header
- **AdminStatItem**: Individual statistic display
- **AdminStatsCard**: Container for multiple statistics
- **AdminTable**: Data table with sorting and filtering
- **AdminWidget**: Dashboard widget component
- **ApprovalModal**: Modal for approving/rejecting consultant profiles and service applications

### Shared Components (`components/shared/`)

- **Header**: Top navigation header
- **LeftSide**: Left sidebar navigation menu
- **RightSide**: Right sidebar (notifications, user menu)
- **MobileHeader**: Mobile-optimized header

### UI Components (`components/ui/`)

- **StatCard**: Statistics card with trend indicators
- **StatusBadge**: Status badge component
- **Dropdown**: Dropdown select component
- **ServiceCard**: Service card display
- **ServiceIcon**: Service icon component
- **ServicesTop**: Services page header section
- **BookingRow**: Booking row component
- **ClientList**: Client list component
- **CommissionRow**: Commission display row
- **ConsultantPayoutRow**: Consultant payout row
- **FundsTransactionsTable**: Transactions table
- **TransactionRow**: Transaction row component

## API Integration

### API Client (`utils/api.ts`)

The API client uses Axios with automatic token injection:

```typescript
import { api } from '@/utils/api';
```

#### Request Interceptor
- Automatically adds `Authorization: Bearer <token>` header
- Reads token from `localStorage.getItem('authToken')`

#### Response Interceptor
- Handles 401 errors (unauthorized)
- Clears `localStorage` and redirects to `/login` on 401

### API Helpers

The `utils/api.ts` file exports domain-specific API helpers:

- **authAPI**: Authentication operations
  - `login(idToken)`, `getMe()`, `updateProfile(data)`
  - `getAllUsers()`, `updateUserStatus()`, `adminDeleteUser()`
  - `changePassword()`, `createAdminUser()`

- **consultantFlowAPI**: Consultant onboarding flow (for admin approvals)
  - `getAllProfiles(status)`, `approveProfile(uid)`, `rejectProfile(uid)`
  - `getAllApplications(status, consultantId)`, `approveApplication(id)`, `rejectApplication(id)`
  - `getDashboardStats()`, `getAnalytics()`

- **consultantAPI**: Consultant CRUD operations (for admin management)
  - `getAll()`, `getById(uid)`, `getTop()`
  - `addService(data)`, `getConsultantServices(consultantId)`
  - `updateService(serviceId, data)`, `deleteService(serviceId)`

- **bookingAPI**: Booking operations (for admin monitoring)
  - `getMyBookings()`, `updateStatus(id, status)`

- **reviewAPI**: Review operations (for admin monitoring)
  - `getConsultantReviews(consultantId)`, `update(id, data)`

- **activityAPI**: Activity logging (for admin dashboard)
  - `getRecentActivities(limit)`

### Extending API Helpers

When adding new backend endpoints:

1. Add helper function to appropriate API object in `utils/api.ts`
2. Use typed interfaces from `types/index.ts`
3. Follow existing patterns for error handling
4. Update TypeScript types if needed

## Styling & UI

### Tailwind CSS 4

- Tailwind CSS 4.0 imported via `styles/globals.css`
- Custom theme configuration in `tailwind.config.js`
- Custom color palette and design tokens

### Custom CSS Variables

Defined in `styles/globals.css`:
- `--background`: Page background color
- `--foreground`: Text color
- `--green`, `--yellow`, `--lightGreen`, `--lightYellow`: Brand colors
- `--Red`, `--black`, `--gray`: Additional colors

### Responsive Design

- Mobile-first approach
- Breakpoints: `sm` (640px), `md` (768px), `lg` (1024px), `xl` (1280px)
- Custom scrollbar styles for better mobile experience
- Horizontal scrolling for tables on small screens

### Component Styling

- Utility-first CSS with Tailwind
- Reusable component classes
- Consistent spacing and typography
- Custom scrollbar styles for better UX

## State Management

### Authentication State

Managed via `AuthContext` (`contexts/AuthContext.tsx`):
- Global `user` state
- `loading` state for auth checks
- `login(idToken)` function
- `logout()` function
- `refreshUser()` function

### Local State

- React `useState` for component-specific state
- No global state management library (Redux, Zustand, etc.)
- Consider adding Zustand or Context API for complex state if needed

### Data Fetching

- Direct API calls in components using `useEffect`
- Auto-refresh for dashboard statistics (5-minute intervals)
- Loading and error states handled per component

## TypeScript

### Type Definitions

All types defined in `types/index.ts`:
- **User types**: `User`, authentication types
- **Service types**: `Service`, `BackendService`, `ServiceStatus`
- **Application types**: `BackendApplication`, `ApplicationStatus`
- **Profile types**: `ConsultantProfileInput`, `ConsultantProfile`
- **Booking types**: `Booking`, `BookingStatus`
- **UI types**: `ButtonProps`, `StatusBadgeProps`, `DropdownProps`
- **API types**: `ApiResponse<T>`, `PaginatedResponse<T>`

### Type Safety

- Strict TypeScript configuration
- All components and utilities are typed
- API responses are typed using interfaces
- Error handling uses typed error objects

## Testing

### Manual Testing Checklist

- **Authentication**:
  - [ ] Login with valid admin credentials
  - [ ] Login with invalid credentials
  - [ ] Email verification flow
  - [ ] Logout functionality
  - [ ] Token expiration handling
  - [ ] Non-admin user access denial

- **Admin Dashboard**:
  - [ ] Dashboard statistics load correctly
  - [ ] Recent activities display
  - [ ] User management page
  - [ ] Consultant profile approvals (approve/reject)
  - [ ] Service application approvals (approve/reject)
  - [ ] Analytics page
  - [ ] Activity log page
  - [ ] Settings page

- **Responsive Design**:
  - [ ] Mobile layout (320px - 640px)
  - [ ] Tablet layout (640px - 1024px)
  - [ ] Desktop layout (1024px+)
  - [ ] Horizontal scrolling for tables on mobile
  - [ ] Touch interactions work correctly

### Automated Testing

Currently no automated tests. Recommended additions:
- Unit tests for utility functions (`utils/index.ts`)
- Component tests for UI components
- Integration tests for API integration
- E2E tests for critical admin flows (Playwright, Cypress)

## Building for Production

### 1. Build Production Bundle

```bash
npm run build
```

This:
- Compiles TypeScript to JavaScript
- Optimizes assets and images
- Generates static pages where possible
- Creates production bundle in `.next/` directory

### 2. Start Production Server

```bash
npm run start
```

Starts the production server on port 3000 (default).

### 3. Production Checklist

- [ ] Set production environment variables
- [ ] Verify `NEXT_PUBLIC_API_URL` points to production backend
- [ ] Update Firebase authorized domains with production URL
- [ ] Test authentication flow end-to-end
- [ ] Verify all API endpoints work correctly
- [ ] Test responsive design on multiple devices
- [ ] Check browser console for errors
- [ ] Verify images load correctly
- [ ] Test logout and token expiration scenarios
- [ ] Verify HTTPS is enabled (required for Firebase auth)
- [ ] Test admin-only access control

## Deployment

### Vercel (Recommended)

The easiest deployment option for Next.js:

1. **Connect Repository**: Link your GitHub/GitLab repository to Vercel
2. **Configure Environment Variables**: Add all `NEXT_PUBLIC_*` variables in Vercel dashboard
3. **Deploy**: Vercel automatically detects Next.js and deploys
4. **Update Firebase**: Add Vercel deployment URL to Firebase authorized domains

```bash
# Install Vercel CLI (optional)
npm i -g vercel

# Deploy
vercel
```

### Other Platforms

- **Netlify**: Similar to Vercel, supports Next.js out of the box
- **AWS Amplify**: Deploy Next.js applications to AWS
- **Docker**: Containerize and deploy to any container platform
- **Traditional Server**: Build and run with `npm run build && npm run start`

### Post-Deployment

- Add deployment URL to Firebase Authorized Domains
- Update backend CORS settings to allow deployment URL
- Verify all environment variables are set correctly
- Test authentication flow on production
- Verify admin-only access control works
- Monitor error logs and performance

## Performance Optimizations

### Next.js Optimizations

- **Automatic Code Splitting**: Next.js automatically splits code per route
- **Image Optimization**: Next.js Image component optimizes images
- **Static Generation**: Use static generation where possible
- **Server Components**: Default to server components for better performance

### Additional Optimizations

- **Lazy Loading**: Load heavy components on demand
- **Memoization**: Use React.memo for expensive components
- **Debouncing**: Debounce search inputs and filters
- **Pagination**: Implement pagination for large data lists
- **Caching**: Cache API responses in localStorage for offline support

## Troubleshooting

### Firebase Authentication Issues

**Problem**: Login fails or redirects incorrectly

**Solutions**:
- Verify Firebase configuration in `.env.local` matches Firebase Console
- Check Firebase Authorized Domains includes your domain
- Ensure `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` is correct
- Verify Firebase Authentication is enabled in Firebase Console
- Check browser console for Firebase errors
- Verify user has admin role in Firebase/Firestore

### API Connection Issues

**Problem**: API requests fail or timeout

**Solutions**:
- Verify `NEXT_PUBLIC_API_URL` is correct
- Check backend server is running and accessible
- Verify CORS settings in backend allow your domain
- Check browser console for network errors
- Test backend health endpoint: `curl http://localhost:4000/health`

### Build Errors

**Problem**: Production build fails

**Solutions**:
- Check TypeScript errors: `npm run lint`
- Verify all environment variables are set
- Check for missing dependencies: `npm install`
- Review Next.js build output for specific errors
- Ensure all imports are correct and files exist

### Styling Issues

**Problem**: Styles not applying correctly

**Solutions**:
- Verify Tailwind CSS configuration in `tailwind.config.js`
- Check `styles/globals.css` is imported in root layout
- Ensure PostCSS is configured correctly
- Clear `.next` cache: `rm -rf .next && npm run build`
- Check for conflicting CSS classes

### Access Control Issues

**Problem**: Non-admin users can access admin routes

**Solutions**:
- Verify `AdminRouteGuard` is properly implemented
- Check backend returns correct role in `/auth/login` and `/auth/me`
- Ensure user has `role: 'admin'` in Firestore
- Review route protection logic in `AdminRouteGuard.tsx`

## Extending the Dashboard

### Adding New Admin Pages

1. Create page file: `app/(root)/admin/my-feature/page.tsx`
2. Add route to navigation in `components/shared/LeftSide.tsx`
3. Create API helpers in `utils/api.ts` if needed
4. Add TypeScript types in `types/index.ts`
5. Update this README with new route
6. Ensure `AdminRouteGuard` protects the route

### Adding New Components

1. Create component file in appropriate directory:
   - `components/admin/` for admin-specific components
   - `components/ui/` for generic UI components
   - `components/shared/` for shared layout components
2. Export component and add TypeScript types
3. Follow existing component patterns
4. Add component to appropriate page

### Best Practices

- **Consistent Styling**: Use Tailwind utility classes consistently
- **Type Safety**: Always type components and functions
- **Error Handling**: Handle errors gracefully with user-friendly messages
- **Loading States**: Show loading indicators for async operations
- **Responsive Design**: Ensure components work on all screen sizes
- **Accessibility**: Use semantic HTML and ARIA attributes
- **Code Organization**: Keep components small and focused
- **API Integration**: Centralize API calls in `utils/api.ts`
- **Security**: Always verify admin role in routes and API calls

## Resources

### Documentation

- [Next.js 15 Documentation](https://nextjs.org/docs)
- [React 19 Documentation](https://react.dev)
- [Tailwind CSS 4 Documentation](https://tailwindcss.com/docs)
- [Firebase Web SDK](https://firebase.google.com/docs/web/setup)
- [Axios Documentation](https://axios-http.com/docs/intro)

### Related Documentation

- Backend API README: `../backend/README.md`
- Mobile App README: `../app/README.md` (consultant/student functionality)
- Complete Project Documentation: `../Docs/COMPLETE_PROJECT_DOCUMENTATION.md`
- API Documentation: `../Docs/API_DOCUMENTATION.md`

## Support

For issues, questions, or contributions:
- Check inline comments in components and utilities
- Review browser console for errors
- Verify backend API is accessible and responding
- Check Firebase Console for authentication errors
- Coordinate with backend and mobile app teams
- Keep environment variables secure and up to date
- **Note**: For consultant/student features, use the mobile app

---

**Last Updated**: Based on complete web dashboard codebase analysis  
**Version**: 0.1.0  
**Next.js**: 15.5.4  
**React**: 19.1.0  
**TypeScript**: 5.x

**Note**: This dashboard is admin-only. All consultant and student functionality has been moved to the mobile app (`../app/README.md`).
