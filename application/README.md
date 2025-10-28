# Tray Mobile Application

React Native mobile application for iOS and Android connecting students with consultants.

## 📱 Overview

The Tray mobile app enables students to book consulting sessions, communicate via real-time chat, manage bookings, and make payments. Consultants can manage their profiles, accept bookings, communicate with students, and track earnings.

## 🎯 Features

### Student Features
- ✅ User authentication (Register, Login, Forgot Password)
- ✅ Browse consultants by category and rating
- ✅ Book consultation sessions with available slots
- ✅ Real-time chat messaging with consultants
- ✅ View booking history and manage bookings
- ✅ Payment integration with Stripe
- ✅ Reviews and ratings system
- ✅ Profile management
- ✅ Push notifications for new messages

### Consultant Features
- ✅ Consultant registration and verification flow
- ✅ Profile management with professional info
- ✅ Service creation and management
- ✅ Availability and slot management
- ✅ Accept/reject booking requests
- ✅ Real-time chat with students
- ✅ Manage clients and bookings
- ✅ Earnings tracking
- ✅ Review management
- ✅ Push notifications for bookings and messages

### Common Features
- ✅ Real-time chat messaging
- ✅ Push notifications
- ✅ Audio and video calling (UI ready)
- ✅ Profile management
- ✅ Account settings
- ✅ Help & support

## 🛠️ Tech Stack

- **Framework:** React Native 0.82
- **Language:** TypeScript
- **Navigation:** React Navigation (Stack, Bottom Tabs)
- **State Management:** React Context API
- **Backend Communication:** Axios + Custom fetcher
- **Database:** Firebase Realtime Database (Real-time chat)
- **Authentication:** Firebase Auth
- **Push Notifications:** Firebase Cloud Messaging (FCM)
- **Payments:** Stripe React Native SDK
- **Image Handling:** React Native Image Picker, Cloudinary
- **UI Components:** Lucide React Native icons, Custom components
- **Storage:** AsyncStorage (local data)

## 📦 Installation

### Prerequisites

- Node.js 20+
- npm or yarn
- Xcode (for iOS)
- Android Studio (for Android)
- CocoaPods (for iOS)

### Setup

```bash
# Install dependencies
npm install

# iOS - Install CocoaPods
cd ios
pod install
cd ..

# Start Metro bundler
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android
```

## 🔧 Configuration

### Environment Variables

Create `.env` file in the root directory:

```env
# API Configuration
API_URL=http://localhost:4000

# Firebase Configuration
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=tray-ed2f7.firebaseapp.com
FIREBASE_PROJECT_ID=tray-ed2f7
FIREBASE_STORAGE_BUCKET=tray-ed2f7.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id
FIREBASE_DATABASE_URL=https://tray-ed2f7-default-rtdb.firebaseio.com/

# Stripe Configuration
STRIPE_PUBLISHABLE_KEY=pk_test_...
```

## 📁 Project Structure

```
src/
├── Screen/              # Application screens
│   ├── Auth/           # Authentication screens
│   ├── Student/        # Student-specific screens
│   ├── Consultant/     # Consultant-specific screens
│   ├── common/         # Shared screens (Chat, Account, etc.)
│   └── Splash/         # Splash screens
├── components/         # Reusable UI components
│   ├── ui/            # UI components (Button, Card, etc.)
│   └── shared/        # Shared components (Header, etc.)
├── contexts/          # React Context providers
│   ├── AuthContext.tsx
│   ├── ChatContext.tsx
│   └── NotificationContext.tsx
├── services/          # API and service layers
│   ├── user.service.ts
│   ├── consultant.service.ts
│   ├── booking.service.ts
│   ├── chat.Service.ts
│   └── notification.service.ts
├── hooks/             # Custom React hooks
│   └── useChat.ts
├── lib/               # Firebase and third-party configs
│   ├── firebase.ts
│   └── fetcher.ts
├── types/             # TypeScript type definitions
│   ├── chatTypes.ts
│   └── env.d.ts
├── constants/         # Constants and styles
│   ├── styles/
│   └── core/
├── utils/             # Utility functions
│   ├── time.ts
│   └── toast.ts
├── navigator/         # Navigation configuration
└── App.tsx            # Root component
```

## 🚀 Key Features Implementation

### Real-time Chat

The app uses Firebase Realtime Database for real-time messaging (database URL: `https://tray-ed2f7-default-rtdb.firebaseio.com/`):

```typescript
// Listen for messages
const { messages, sendMessage } = useChat(chatId);

// Send message
sendMessage({
  chatId,
  senderId: userId,
  text: messageText,
  type: 'text',
  seenBy: [userId],
});
```

**Features:**
- Real-time message updates
- Unread message counter
- Last message preview
- Profile images in chat list
- Message seen/unseen status

### Push Notifications

Integrated with Firebase Cloud Messaging:

- **Foreground:** Messages appear instantly via Firestore listeners
- **Background:** Cloud Functions send push notifications
- **Closed:** Push notifications wake the app

**Setup:**
1. User logs in → FCM token obtained
2. Token registered with backend via `/fcm/token`
3. Cloud Functions send notifications when messages arrive

### Booking Flow

```
1. Student browses consultants
2. Student selects service and time slot
3. Student makes payment
4. Booking request sent to consultant
5. Consultant accepts/rejects
6. If accepted → Chat enabled automatically
7. Student can message consultant
```

## 📱 Screens

### Authentication Screens
- Login
- Register
- Forgot Password
- Email Verification
- Reset Password

### Student Screens
- Home (Browse consultants)
- Services (View consultant services)
- Booking Slots (Select appointment time)
- Payment Screen
- Consultant Bookings (View bookings with consultant)
- Booked Consultants (List of consultants)
- All Reviews
- My Reviews
- Session Rating

### Consultant Screens
- Home (Booking requests)
- Services (Manage services)
- Availability (Set working hours)
- Slots (Manage time slots)
- Clients (Student list)
- Messages (Chat list)
- Reviews (Consultant reviews)
- Earnings (Revenue tracking)
- Applications (Service applications)
- Verification (Onboarding flow)

### Common Screens
- Chat Screen (Individual conversation)
- Messages (Chat list)
- Account (Profile management)
- Edit Profile
- Notifications
- Help

## 🔐 Authentication Flow

```typescript
// Login
const { signInWithEmail, user } = useAuth();

// Check authentication status
useEffect(() => {
  if (user) {
    // User is logged in
    // Navigate to home
  }
}, [user]);
```

## 💬 Chat Implementation

### Creating/Opening Chat

```typescript
const { openChatWith, chats } = useChatContext();

// Open chat with user
const chatId = await openChatWith(otherUserId);

// Navigate to chat screen
navigation.navigate('ChatScreen', { chatId, otherUserId });
```

### Sending Messages

```typescript
const { messages, sendMessage } = useChat(chatId);

const handleSend = async () => {
  await sendMessage({
    chatId,
    senderId: userId,
    text: messageText,
    type: 'text',
    seenBy: [userId],
  });
};
```

## 🔔 Push Notifications Setup

### Enable Notifications

1. Rebuild iOS app to link native modules:
   ```bash
   npm run ios
   ```

2. Uncomment in `src/App.tsx`:
   ```typescript
   import { NotificationProvider } from './contexts/NotificationContext';
   import * as NotificationService from './services/notification.service';
   
   NotificationService.setupBackgroundMessageHandler();
   
   // And wrap app:
   <NotificationProvider>
     <NavigationContainer>...
   </NotificationProvider>
   ```

3. Reload app

## 🔌 API Integration

The app communicates with the backend API using a custom fetcher:

```typescript
import { fetcher } from './lib/fetcher';

// GET request
const data = await fetcher('/endpoint');

// POST request
await fetcher('/endpoint', {
  method: 'POST',
  body: JSON.stringify({ data }),
});
```

**Base URL:** Configured in `.env` as `API_URL`

## 🎨 Styling

The app uses a centralized styling system:

```typescript
import { screenStyles } from '../constants/styles/screenStyles';
import { COLORS } from '../constants/core/colors';

// Use in components
<View style={screenStyles.container}>
  <Text style={{ color: COLORS.green }}>Hello</Text>
</View>
```

## 📦 Dependencies

### Core
- `react-native`: 0.82.0
- `react`: 19.1.1
- `typescript`: ^5.8.3

### Navigation
- `@react-navigation/native`: ^7.1.18
- `@react-navigation/stack`: ^7.4.9
- `@react-navigation/bottom-tabs`: ^7.4.8

### Firebase
- `firebase`: ^12.3.0
- `@react-native-firebase/app`: ^23.4.1
- `@react-native-firebase/messaging`: ^23.4.1

### Other
- `axios`: ^1.12.2
- `@stripe/stripe-react-native`: ^0.54.1
- `react-native-image-picker`: ^8.2.1
- `react-native-calendars`: ^1.1313.0

See `package.json` for complete list.

## 🧪 Testing

```bash
# Run tests
npm test

# Run linter
npm run lint
```

## 🐛 Troubleshooting

### iOS Build Issues

```bash
# Clean and reinstall pods
cd ios
rm -rf Pods Podfile.lock
pod install
cd ..

# Clean build folder
npm run ios -- --reset-cache
```

### Android Build Issues

```bash
# Clean gradle
cd android
./gradlew clean
cd ..

# Reset Metro cache
npm start -- --reset-cache
```

### Firebase Native Module Error

- Rebuild the app: `npm run ios` or `npm run android`
- Ensure pods are installed: `cd ios && pod install`

### Chat Not Loading

- Check Realtime Database rules in Firebase Console
- Verify Firebase configuration in `.env` (including `databaseURL`)
- Check network connectivity
- Verify Realtime Database is enabled in Firebase Console

### Push Notifications Not Working

- Verify FCM token is registered (check console logs)
- Ensure notification permissions are granted
- Check Cloud Function is deployed
- Verify backend `/fcm/token` endpoint is working

## 🚢 Building for Production

### iOS

```bash
# Build release
cd ios
xcodebuild -workspace tray.xcworkspace \
  -scheme tray \
  -configuration Release \
  -archivePath build/tray.xcarchive archive

# Create IPA (in Xcode)
```

### Android

```bash
# Build APK
cd android
./gradlew assembleRelease

# Build AAB (for Play Store)
./gradlew bundleRelease
```

## 📊 Key Metrics

- **App Size:** Varies by platform
- **Target iOS:** 14.0+
- **Target Android:** API 21+
- **Minimum Node:** 20+

## 🔗 Related Documentation

- [Backend API Documentation](../backend/README.md)
- [Cloud Functions Documentation](../functions/README.md)
- [Main README](../README.md)

## 📝 Development Notes

### State Management

- **Context API:** Used for global state (Auth, Chat, Notifications)
- **Local State:** `useState` for component-specific state
- **No Redux:** Context API is sufficient for this app size

### Code Organization

- **Screens:** Feature-based organization
- **Components:** Reusable UI components
- **Services:** API communication layer
- **Hooks:** Custom business logic hooks

### Best Practices

- Always use TypeScript types
- Handle loading and error states
- Use React hooks properly
- Follow existing code patterns
- Keep components small and focused

## ✅ Status

- ✅ Core features implemented
- ✅ Real-time chat working
- ✅ Push notifications ready (require iOS rebuild)
- ✅ Booking system complete
- ✅ Payment integration complete
- ✅ Profile management complete
