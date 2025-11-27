# Tray Mobile App

React Native application that delivers Tray's cross-platform mobile experience for students, consultants, recruiters, and administrators. The app provides booking sessions, job management, video/audio calls, real-time messaging, notifications, payments, and role-based navigation backed by Firebase services.

## Overview

Tray is a multi-platform consultant booking and job management system connecting students with consultants for booking sessions, while also supporting job posting and application workflows for recruiters. The mobile app supports multiple user roles with dedicated interfaces and workflows for each role.

## Key Features

### Multi-Role System
- **Student**: Browse consultants, book sessions, manage bookings, apply for jobs, review consultants
- **Consultant**: Manage services, availability, bookings, earnings, post jobs, review applications
- **Recruiter**: Post jobs, manage applications, review candidates, track job listings
- **Admin**: Review refunds, manage platform operations

### Core Functionality
- **Booking Management**: Complete booking lifecycle with automated reminders
- **Real-time Communication**: Chat and video/audio calls via WebRTC
- **Payment Processing**: Stripe integration for payments and automated consultant payouts
- **Job System**: Job posting, application management, and candidate review
- **Review System**: Rating and review functionality with aggregate calculations
- **Push Notifications**: Firebase Cloud Messaging for real-time updates
- **File Uploads**: Cloudinary integration for profile and service images
- **Offline Support**: Offline-aware chat queue and network status handling

## Tech Stack

- **Framework**: React Native 0.82.1 (Hermes engine)
- **Language**: TypeScript 5.8
- **React**: React 19.1.1
- **Navigation**: React Navigation 7 (Stack, Bottom Tabs, Drawer)
- **State Management**: React Context API (AuthProvider, ChatProvider, NotificationProvider, NetworkProvider)
- **API Client**: Axios + SWR for data fetching
- **Firebase**: 
  - Firebase Authentication (Email/Password, Social Logins)
  - Firestore (Real-time database)
  - Firebase Cloud Messaging (Push notifications)
  - Firebase Realtime Database (Chat)
- **Payment**: Stripe React Native SDK
- **Video/Audio Calls**: WebRTC with react-native-webrtc
- **Social Auth**: Apple, Google, Facebook Sign-In
- **Image Handling**: Cloudinary, react-native-image-picker
- **Storage**: AsyncStorage for local data persistence
- **UI Libraries**: 
  - react-native-calendars (Calendar/date picker)
  - lucide-react-native (Icons)
  - react-native-toast-message (Toast notifications)
- **Tooling**: Metro bundler, ESLint, Prettier, Jest, patch-package

## Prerequisites

- **Node.js** ≥ 20 (recommended with nvm)
- **npm** or **yarn** package manager
- **Watchman** (macOS) for Metro bundler file watching
- **iOS Development**:
  - Xcode 15+ with iOS SDK
  - CocoaPods (`brew install cocoapods`)
  - Ruby (via rbenv/asdf) for bundler
- **Android Development**:
  - Android Studio with SDK 34
  - Android NDK
  - Java 17 (required by React Native 0.82 Gradle tooling)
  - Configured emulator or USB debugging enabled
- **Firebase Project**: Configured Firebase project with Firestore, Authentication, Cloud Messaging, and Realtime Database enabled
- **Backend API**: Running backend server (Node.js/Express) accessible via API_URL

## Project Structure

```
app/
├── src/
│   ├── App.tsx                    # Main app component with Stripe provider and context providers
│   ├── index.js                   # App entry point with FCM background handler
│   │
│   ├── Screen/                    # Screen components organized by role (72 screens total)
│   │   ├── Admin/
│   │   │   └── RefundReview/      # Admin refund review screen
│   │   ├── Auth/                  # Authentication screens
│   │   │   ├── Login.tsx
│   │   │   ├── Register.tsx
│   │   │   ├── ForgotPassword.tsx
│   │   │   ├── Verify.tsx         # OTP verification
│   │   │   ├── ResetPassword.tsx
│   │   │   └── EmailVerification.tsx
│   │   ├── Splash/                # Splash screens
│   │   ├── Student/               # Student role screens
│   │   │   ├── Home/
│   │   │   ├── Consultants/       # Browse/book consultants
│   │   │   ├── Services/          # Browse services
│   │   │   ├── Booking/           # Booking slots
│   │   │   ├── Cart/              # Shopping cart
│   │   │   ├── Payment/           # Payment processing
│   │   │   ├── Review/            # Review consultants
│   │   │   ├── Jobs/              # Job browsing and applications
│   │   │   ├── Profile/
│   │   │   └── SessionRating/
│   │   ├── Consultant/            # Consultant role screens
│   │   │   ├── Home/              # Consultant dashboard
│   │   │   ├── Services/          # Manage services
│   │   │   ├── Availability/      # Set availability
│   │   │   ├── Slots/             # Manage time slots
│   │   │   ├── Clients/           # View clients
│   │   │   ├── Earnings/          # View earnings
│   │   │   ├── Jobs/              # Post jobs, manage applications
│   │   │   ├── Applications/      # Service applications
│   │   │   ├── Profile/           # Consultant profile flow
│   │   │   ├── Verification/      # Verification flow
│   │   │   ├── ServiceSetup/      # Service setup
│   │   │   ├── Reviews/           # View reviews
│   │   │   ├── SessionCompletion/
│   │   │   ├── Payment/           # Stripe Connect setup
│   │   │   └── PendingApproval.tsx
│   │   ├── Recruiter/             # Recruiter role screens
│   │   │   ├── Home/              # Recruiter dashboard
│   │   │   ├── Jobs/              # Post jobs, manage applications
│   │   │   └── Profile/
│   │   └── common/                # Shared screens across roles
│   │       ├── Account/           # Account management
│   │       ├── Messages/          # Chat screens
│   │       ├── Calling/           # Audio/video calling
│   │       ├── Notifications/
│   │       ├── Help/
│   │       └── Profile/
│   │
│   ├── navigator/                 # Navigation configuration
│   │   ├── RootNavigation.tsx     # Root stack (Splash → Auth/Screen)
│   │   ├── AuthNavigation.tsx     # Auth stack (Login, Register, etc.)
│   │   ├── ScreenNavigator.tsx    # Main screen navigator
│   │   ├── BottomNavigation.tsx   # Student bottom tabs
│   │   ├── ConsultantBottomNavigation.tsx  # Consultant bottom tabs
│   │   ├── HomeStackNavigator.tsx # Home stack navigator
│   │   ├── ServicesStackNavigator.tsx
│   │   └── navigationRef.ts       # Navigation reference for programmatic navigation
│   │
│   ├── components/                # Reusable UI components
│   │   ├── ui/                    # Generic UI components
│   │   │   ├── AppButton.tsx
│   │   │   ├── Loader.tsx
│   │   │   ├── CustomAlert.tsx
│   │   │   ├── ImageUpload.tsx
│   │   │   ├── ConsultantCard.tsx
│   │   │   ├── ServiceCard.tsx
│   │   │   ├── CartCard.tsx
│   │   │   ├── Message.tsx        # Chat message component
│   │   │   ├── NotificationItem.tsx
│   │   │   ├── ReviewCard.tsx
│   │   │   ├── PaymentModal.tsx
│   │   │   ├── StatCard.tsx
│   │   │   ├── ErrorBoundary.tsx
│   │   │   ├── OfflineOverlay.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   ├── ErrorDisplay.tsx
│   │   │   ├── LoadingState.tsx
│   │   │   ├── StatusBadge.tsx
│   │   │   ├── PasswordStrengthIndicator.tsx
│   │   │   ├── RefreshableScrollView.tsx
│   │   │   ├── LoadMoreButton.tsx
│   │   │   ├── SummaryCard.tsx
│   │   │   ├── Summary.tsx
│   │   │   ├── ProfileList.tsx
│   │   │   ├── TopConsultantCard.tsx
│   │   │   ├── ConsultantServiceCard.tsx
│   │   │   ├── LeadCard.tsx
│   │   │   ├── PaymentResultModal.tsx
│   │   │   └── CancelBookingModal.tsx
│   │   │   └── ... (29 UI components total)
│   │   ├── consultant/            # Consultant-specific components
│   │   │   ├── ServiceApplicationForm.tsx
│   │   │   ├── FormComponents.tsx
│   │   │   ├── StatusComponents.tsx
│   │   │   └── StepIndicator.tsx
│   │   └── shared/                # Shared components
│   │       ├── HomeHeader.tsx
│   │       ├── ScreenHeader.tsx
│   │       └── SearchBar.tsx
│   │
│   ├── contexts/                  # React Context providers
│   │   ├── AuthContext.tsx        # Authentication state, user data, role management
│   │   ├── ChatContext.tsx        # Chat state, messages, typing indicators
│   │   ├── NotificationContext.tsx # Notification state, unread counts
│   │   └── NetworkContext.tsx     # Network connectivity status
│   │
│   ├── services/                  # API service layer
│   │   ├── booking.service.ts     # Booking operations
│   │   ├── bookingRequest.service.ts
│   │   ├── call.service.ts        # WebRTC call management
│   │   ├── chat.Service.ts        # Chat functionality
│   │   ├── consultant.service.ts  # Consultant data fetching
│   │   ├── consultantFlow.service.ts # Consultant onboarding
│   │   ├── email.service.ts
│   │   ├── job.service.ts         # Job posting and applications
│   │   ├── notification.service.ts # FCM notification management
│   │   ├── notification-storage.service.ts
│   │   ├── offline-message-queue.service.ts # Offline message queue
│   │   ├── payment.service.ts     # Payment processing
│   │   ├── resume.service.ts      # Resume management
│   │   ├── review.service.ts      # Review operations
│   │   ├── sessionCompletion.service.ts
│   │   ├── support.service.ts     # Support tickets
│   │   ├── upload.service.ts      # File upload to Cloudinary
│   │   └── user.service.ts        # User operations
│   │
│   ├── hooks/                     # Custom React hooks
│   │   ├── useAuth.ts (via AuthContext)
│   │   ├── useChat.ts             # Chat hook
│   │   ├── useLogin.ts            # Login hook
│   │   ├── useRegister.ts         # Registration hook
│   │   ├── useSocialLogin.ts      # Social login hook
│   │   ├── usePagination.ts       # Pagination hook
│   │   ├── useRefresh.ts          # Refresh hook
│   │   └── useAutoRefresh.ts      # Auto-refresh hook
│   │
│   ├── lib/                       # Core libraries
│   │   ├── fetcher.ts             # API client with Axios (token injection, retry logic)
│   │   └── firebase.ts            # Firebase configuration
│   │
│   ├── webrtc/                    # WebRTC configuration
│   │   └── peer.ts                # Peer connection management
│   │
│   ├── config/                    # Configuration files
│   │   ├── webrtc.config.ts       # WebRTC TURN/STUN configuration
│   │   └── webrtc.config.example.ts
│   │
│   ├── constants/                 # Constants and configuration
│   │   ├── core/
│   │   │   ├── colors.ts          # Color constants
│   │   │   └── global.ts          # Global constants
│   │   ├── data/                  # Mock data and constants
│   │   │   ├── currencies.ts
│   │   │   ├── ConsultantProfileListData.ts
│   │   │   └── ProfileListData.ts
│   │   └── styles/                # Style definitions (81 style files)
│   │       ├── appStyles.ts
│   │       ├── statCardStyles.ts
│   │       ├── recruiterHomeStyles.ts
│   │       └── ... (81 style files total)
│   │
│   ├── utils/                     # Utility functions
│   │   ├── alertUtils.ts
│   │   ├── dateUtils.ts           # Date formatting utilities
│   │   ├── passwordValidation.ts
│   │   ├── statusUtils.ts
│   │   ├── time.ts
│   │   └── toast.ts               # Toast notification utility
│   │
│   ├── types/                     # TypeScript type definitions
│   │   ├── chatTypes.ts
│   │   ├── env.d.ts               # Environment variable types
│   │   └── svg.d.ts
│   │
│   └── assets/                    # Static assets
│       ├── font/
│       ├── icon/
│       ├── image/
│       └── videos/
│
├── android/                       # Native Android project
│   ├── app/
│   │   ├── src/
│   │   ├── build.gradle
│   │   └── google-services.json   # Firebase config (DO NOT COMMIT)
│   └── build.gradle
│
├── ios/                           # Native iOS project
│   ├── app/
│   │   ├── AppDelegate.swift
│   │   ├── Info.plist
│   │   └── Images.xcassets/
│   ├── GoogleService-Info.plist   # Firebase config (DO NOT COMMIT)
│   ├── Podfile
│   └── app.xcworkspace/
│
├── patches/                       # patch-package overrides
│   └── react-native-incall-manager+3.3.0.patch
│
├── scripts/                       # Build and utility scripts
├── __tests__/                     # Jest test files
├── .vscode/                       # VS Code configuration
├── node_modules/
│
├── package.json                   # Dependencies and scripts
├── tsconfig.json                  # TypeScript configuration
├── babel.config.js                # Babel configuration
├── metro.config.js                # Metro bundler configuration
├── jest.config.js                 # Jest test configuration
├── .eslintrc.js                   # ESLint configuration
├── .prettierrc.js                 # Prettier configuration
├── .watchmanconfig                # Watchman configuration
├── .gitignore                     # Git ignore rules
├── app.json                       # App metadata
├── Gemfile                        # Ruby dependencies for iOS
├── connect-device.sh              # Helper script for Android device connection
└── README.md                      # This file
```

## Environment Configuration

Create an `.env` file in the `app/` directory (same level as `package.json`) with the following variables:

```env
# Backend API
API_URL=https://api.yourdomain.com

# Firebase Configuration
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id
FIREBASE_DATABASE_URL=https://your_project.firebaseio.com

# Stripe Configuration
STRIPE_PUBLISHABLE_KEY=pk_live_... or pk_test_...

# Social Authentication
GOOGLE_WEB_CLIENT_ID=your_google_client_id

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_UPLOAD_PRESET=your_upload_preset
```

**Important Notes:**
- The `.env` file is typed by `src/types/env.d.ts` and consumed via `react-native-dotenv`
- For mobile development, use an ngrok URL or your deployed backend URL (localhost won't work on physical devices)
- Firebase native config files (`android/app/google-services.json` and `ios/GoogleService-Info.plist`) must be aligned with `.env` values
- WebRTC: Update `src/config/webrtc.config.ts` with your TURN/STUN server configuration if needed

## Installation

### 1. Install JavaScript Dependencies

```bash
npm install
```

The `postinstall` script automatically runs `patch-package` to apply patches.

### 2. iOS Native Dependencies

```bash
cd ios
bundle install              # Install Ruby dependencies (first time only)
bundle exec pod install     # Install CocoaPods dependencies
cd ..
```

**Note:** Run `pod install` whenever you update CocoaPods dependencies or add new native modules.

### 3. Android Setup

- Open Android Studio and let it sync Gradle dependencies
- Ensure Android SDK 34 is installed
- Configure Android NDK if needed
- Set up an Android emulator or enable USB debugging on a physical device

### 4. Environment Variables

- Create `.env` file with required variables (see Environment Configuration)
- Ensure Firebase native config files are in place:
  - `android/app/google-services.json`
  - `ios/GoogleService-Info.plist`

## Development Workflow

### Start Metro Bundler

```bash
npm start
```

This starts the Metro bundler on port 8081 (default).

### Run on iOS

```bash
npm run ios
```

- Launches the default iOS simulator
- To target a specific device: `npm run ios -- --device "Device Name"`
- To target a specific simulator: `npm run ios -- --simulator "iPhone 15 Pro"`
- If you encounter build errors:
  1. Open `ios/app.xcworkspace` in Xcode
  2. Ensure signing teams are configured
  3. Run `cd ios && bundle exec pod install` again

### Run on Android

```bash
npm run android
```

- Requires an Android emulator running or a device connected via USB with debugging enabled
- To connect a physical device with Metro:
  ```bash
  ./connect-device.sh
  ```
- For Gradle cache issues:
  ```bash
  cd android && ./gradlew clean && cd ..
  ```

### Debugging & Dev Tools

- **React Native Dev Menu**:
  - iOS: Shake device or `Cmd+D` in simulator
  - Android: Shake device or `Cmd+M` in emulator
  - Select "Debug" to open Chrome DevTools

- **Network Logging**: Network status and API requests are logged in Metro console via NetworkContext

- **Debugging Tools**: Reactotron or Flipper can be integrated (not preconfigured)

## Available Scripts

- `npm start` - Start Metro bundler
- `npm run android` - Run on Android
- `npm run ios` - Run on iOS
- `npm test` - Run Jest tests
- `npm run lint` - Run ESLint
- `npm run generate-icons` - Generate app icons (if script exists)

## Navigation Structure

### Root Navigation Flow

```
Splash Screen
  ↓
Splash Main (Role Selection)
  ↓
┌─────────────────┬─────────────────┐
│   Auth Stack    │   Screen Stack  │
│  (if logged out)│  (if logged in) │
└─────────────────┴─────────────────┘
```

### Auth Stack

- Login
- Register (with role selection)
- ForgotPassword
- Verify (OTP)
- ResetPassword
- EmailVerification

### Main Screen Stack (Role-Based)

#### Student Tabs
- **Menu** → Home, Services, Consultants, Jobs
- **Services** → Browse services
- **Messages** → Chat list
- **Notifications** → Notifications
- **Account** → Profile and settings

#### Consultant Tabs
- **Home** → Consultant dashboard
- **Services** → Manage services
- **Availability** → Set availability
- **Messages** → Chat list
- **Account** → Profile and settings

#### Common Screens (accessible from all roles)
- Chat Screen (individual chat)
- Calling Screen (audio call)
- Video Calling Screen (video call)
- Notifications
- Help
- Edit Profile
- Change Password
- Change Username

### Role-Based Routing

The app uses role-based navigation where:
- Each role has dedicated bottom tabs
- Common screens are shared across roles
- Role switching is handled via `AuthContext.switchRole()`
- Consultant onboarding flow includes profile creation, verification, and service setup

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

### Consultant Features
- Manage consultant profile
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
- Review refund requests
- Platform administration

## Testing & Quality

### Linting

```bash
npm run lint
```

### Unit Tests

```bash
npm test
```

Currently covers app bootstrapping. Expand with:
- Service layer tests (with mocks for Firebase/Stripe)
- Component tests
- Screen tests

### Code Formatting

Prettier configuration is in `.prettierrc.js`. Format code with:

```bash
npx prettier --write .
```

Or integrate with your editor for automatic formatting.

## Building for Production

### Android Release Build

1. Update version in `android/app/build.gradle`:
   ```gradle
   versionCode 2
   versionName "2.0.0"
   ```

2. Create release bundle (AAB):
   ```bash
   cd android
   ./gradlew bundleRelease
   cd ..
   ```
   Output: `android/app/build/outputs/bundle/release/app-release.aab`

3. Or create APK:
   ```bash
   cd android
   ./gradlew assembleRelease
   cd ..
   ```
   Output: `android/app/build/outputs/apk/release/app-release.apk`

### iOS Release Build

1. Open `ios/app.xcworkspace` in Xcode
2. Update version and build number in Xcode
3. Select "Any iOS Device" as target
4. Product → Archive
5. Follow prompts to distribute via App Store or TestFlight

### Pre-Release Checklist

- [ ] Set production environment variables
- [ ] Update Stripe keys to production
- [ ] Verify Firebase config files are production
- [ ] Test WebRTC/TURN server credentials
- [ ] Test all critical user flows
- [ ] Verify push notifications work
- [ ] Test payment flows end-to-end
- [ ] Check offline functionality
- [ ] Review and update version numbers

## Troubleshooting

### Firebase Configuration Errors

**Problem:** App throws errors about missing Firebase keys

**Solution:**
- Verify `.env` file has all required Firebase variables
- Ensure `android/app/google-services.json` and `ios/GoogleService-Info.plist` are present
- Check that Firebase project is properly configured
- Restart Metro bundler after changing `.env`

### WebRTC Connection Issues

**Problem:** Video/audio calls fail to connect

**Solution:**
- Verify TURN/STUN server configuration in `src/config/webrtc.config.ts`
- Check that `TURN_SERVER.enabled = true` if using TURN
- Ensure TURN server credentials are correct
- Test WebRTC connection in browser first

### Push Notifications Not Working

**Problem:** Push notifications don't arrive

**Solution:**
- iOS: Ensure APNs certificates are configured in Firebase Console
- Android: Verify `google-services.json` includes correct package name
- Check that FCM server key is configured in backend
- Ensure app has notification permissions
- Verify device has internet connection

### Metro Bundler Not Reachable on Device

**Problem:** Physical device can't connect to Metro

**Solution:**
- Run `./connect-device.sh` to pair device with Metro
- Or manually set debug server host in React Native Dev Menu:
  - Dev Menu → Settings → Debug server host
  - Enter your computer's IP address and port (e.g., `192.168.1.100:8081`)
- Ensure device and computer are on the same network
- Check firewall settings

### Build Errors

**iOS:**
- Run `cd ios && bundle exec pod install`
- Clean build folder in Xcode: Product → Clean Build Folder
- Delete `ios/Pods` and `ios/Podfile.lock`, then reinstall

**Android:**
- Run `cd android && ./gradlew clean`
- Invalidate caches in Android Studio: File → Invalidate Caches / Restart
- Delete `android/.gradle` and rebuild

### API Connection Issues

**Problem:** API requests fail with connection errors

**Solution:**
- Verify `API_URL` in `.env` is correct (not localhost for physical devices)
- Use ngrok or deployed backend URL for mobile development
- Check backend server is running and accessible
- Review API error logs in Metro console

## Architecture Patterns

### State Management

- **React Context API** for global state (Auth, Chat, Notifications, Network)
- **Local State** (useState) for component-specific state
- **SWR** for data fetching with caching and revalidation
- **AsyncStorage** for persistent local storage

### API Communication

- **Axios** instance with interceptors for:
  - Automatic Firebase ID token injection
  - Request/response logging
  - Automatic retry logic
  - Error handling and toast notifications
- **SWR** hooks for data fetching with automatic caching

### Navigation

- **React Navigation 7** with:
  - Stack Navigator for screen flows
  - Bottom Tab Navigator for role-based tabs
  - Deep linking support via `navigationRef`

### Error Handling

- Global error handling via Axios interceptors
- Toast notifications for user-facing errors
- Graceful fallbacks for offline scenarios
- Error boundaries (to be implemented)

## Conventions & Best Practices

### Code Organization

- **Screens**: Organized by role in `src/Screen/`
- **Components**: Reusable UI in `src/components/ui/`, role-specific in subdirectories
- **Services**: Business logic and API calls in `src/services/`
- **Utils**: Pure utility functions in `src/utils/`
- **Types**: TypeScript types in `src/types/`

### TypeScript

- Use TypeScript for all new files
- Export types under `src/types/`
- Avoid `any` type; use proper types or `unknown`

### Component Structure

- Keep components small and focused
- Use functional components with hooks
- Extract reusable logic into custom hooks
- Surface business logic through service layer

### Styling

- Style definitions in `src/constants/styles/`
- Use consistent naming: `*Styles.ts` files
- Reuse common styles across components

### Service Layer

- All API calls go through service layer
- Services handle data transformation
- Services return typed data
- Handle errors at service level when appropriate

## Future Enhancements

- [ ] Error boundaries for React components
- [ ] Enhanced test coverage (services, components, screens)
- [ ] E2E testing with Detox
- [ ] Code splitting for performance
- [ ] Image optimization pipeline
- [ ] Advanced analytics integration
- [ ] Multi-language support (i18n)
- [ ] Accessibility improvements
- [ ] Performance monitoring
- [ ] Crash reporting integration

## Resources

### Documentation

- [React Native Docs](https://reactnative.dev/docs/getting-started)
- [React Navigation Docs](https://reactnavigation.org/docs/getting-started)
- [Firebase React Native Docs](https://rnfirebase.io/)
- [Stripe React Native Docs](https://stripe.dev/stripe-react-native/)
- [WebRTC React Native](https://github.com/react-native-webrtc/react-native-webrtc)

### Related Documentation

- Backend API documentation: `../backend/README.md`
- Web dashboard documentation: `../web/README.md`
- Complete project documentation: `../Docs/COMPLETE_PROJECT_DOCUMENTATION.md`

## Support

For issues, questions, or contributions:
- Check existing documentation in `../Docs/`
- Review codebase architecture in `../Docs/ARCHITECTURE.md`
- Coordinate with backend and web teams for cross-platform alignment

---

**Last Updated**: Based on complete codebase analysis  
**Version**: 0.0.1  
**React Native**: 0.82.1  
**TypeScript**: 5.8
