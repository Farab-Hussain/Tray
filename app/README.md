# Tray Mobile App

React Native application that delivers Tray’s cross-platform mobile experience for students, consultants, and admin staff. The app provides scheduling, video sessions, real-time messaging, notifications, payments, and role-based navigation backed by Firebase services.

## Highlights

- Multi-role experience with dedicated stacks for students, consultants, and administrators.
- React Navigation-powered routing with nested stacks and bottom tabs (`src/navigator`).
- WebRTC calling flow (`src/Screen/common/Calling`, `src/webrtc`) with configurable TURN/STUN.
- Firebase authentication, Firestore, and Realtime Database integration (`src/lib/firebase`).
- Stripe payments and Apple/Google/Facebook social logins.
- Offline-aware chat queue and network status handling (`src/services/offline-message-queue.service.ts`, `src/contexts/NetworkContext.tsx`).
- Notification handling with Firebase Cloud Messaging and custom toast system.

## Tech Stack

- React Native 0.82 (Hermes) with React 19 and TypeScript 5.
- State handled through React Context providers (`AuthProvider`, `ChatProvider`, `NotificationProvider`, `NetworkProvider`).
- API/data access via Axios + SWR, Firebase modular SDK, and custom service layer (`src/services`).
- UI components and shared design tokens under `src/components` and `src/constants/styles`.
- Tooling: Metro, ESLint, Prettier, Jest, patch-package.

## Prerequisites

- Node.js ≥ 20 and npm (recommended with nvm).
- Watchman (macOS) for Metro.
- Xcode 15+ with Cocoapods (`brew install cocoapods`) for iOS builds.
- Android Studio with SDK 34, Android NDK, and properly configured emulator or USB debugging.
- Ruby (via rbenv/asdf) to install bundler for iOS pods.
- Java 17 (required by React Native 0.82 Gradle tooling).

## Project Structure

```
app/
├── src/
│   ├── App.tsx                  # App bootstrap, providers, navigation container
│   ├── navigator/               # Root, auth, tab, and stack navigators
│   ├── Screen/                  # Role-based screens (Student, Consultant, Admin, common flows)
│   ├── contexts/                # Auth, chat, notification, and network providers
│   ├── services/                # API integrations (booking, payment, chat, notifications, WebRTC)
│   ├── webrtc/                  # Peer configuration and ICE server helpers
│   ├── components/              # Reusable UI + domain-specific components
│   ├── constants/               # Style tokens, mock data, global config
│   ├── hooks/                   # Auth/chat hooks
│   ├── lib/firebase.ts          # Firebase bootstrap
│   └── utils/                   # Helpers (password validation, toast, time formatting)
├── android/                     # Native Android project (includes google-services.json)
├── ios/                         # Native iOS project (includes GoogleService-Info.plist, Pods/)
├── connect-device.sh            # Helper to pair Android device with Metro
└── patches/                     # patch-package overrides (react-native-incall-manager)
```

## Environment Configuration

Create an `.env` file in `app/` (same level as `package.json`) and populate the required values. The file is typed by `src/types/env.d.ts` and consumed via `react-native-dotenv`.

Example:

```env
API_URL=https://api.yourdomain.com
FIREBASE_API_KEY=...
FIREBASE_AUTH_DOMAIN=...
FIREBASE_PROJECT_ID=...
FIREBASE_STORAGE_BUCKET=...
FIREBASE_MESSAGING_SENDER_ID=...
FIREBASE_APP_ID=...
FIREBASE_DATABASE_URL=...
STRIPE_PUBLISHABLE_KEY=pk_live_...
GOOGLE_WEB_CLIENT_ID=...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_UPLOAD_PRESET=...
```

Additional configuration:

- **Firebase native files**: keep `android/app/google-services.json` and `ios/GoogleService-Info.plist` aligned with the `.env` values.
- **WebRTC**: update `src/config/webrtc.config.ts` or set `REACT_NATIVE_TURN_*` environment variables to point to your Coturn deployment (`docs/COTURN_SETUP.md` explains the setup).
- **Patch updates**: when upgrading dependencies, re-run `npx patch-package` if the fix in `patches/` needs adjustment.

## Installation

1. Install JS dependencies:
   ```sh
   npm install
   ```
   `postinstall` automatically runs `patch-package`.

2. iOS native deps (first run and whenever Pods change):
   ```sh
   cd ios
   bundle install          # once
   bundle exec pod install
   cd ..
   ```

3. Ensure environment variables and Firebase native files are in place before launching.

## Development Workflow

Start Metro in the project root:

```sh
npm start
```

### Run on Android

```sh
npm run android
```

- Use `connect-device.sh` to pair a physical device with Metro if USB debugging is enabled:
  ```sh
  ./connect-device.sh
  ```
- For Gradle cache issues clear with `cd android && ./gradlew clean`.

### Run on iOS

```sh
npm run ios
```

- Launches the default simulator. To target a device specify `--device "Device Name"`.
- If you hit build errors, open `ios/app.xcworkspace` in Xcode, ensure signing teams are configured, and re-run Pods.

### Debugging & Dev Tools

- Shake device / `Cmd+D` (iOS) / `Cmd+M` (Android emulator) for the React Native dev menu.
- Network logs and offline status surface in the Metro console from the Network Context.
- Use Reactotron/Flipper if desired (not preconfigured).

## Testing & Quality

- Lint: `npm run lint`
- Unit tests: `npm test` (Jest). The suite currently covers app bootstrapping; expand with screen/service tests as features evolve.
- Formatting: Prettier shares config via `.prettierrc.js`. Integrate with editors or run `npx prettier --write .`.

## Release Notes

- **Android**: update versioning in `android/app/build.gradle`. Bundle via `cd android && ./gradlew bundleRelease`.
- **iOS**: adjust version/build in Xcode. Archive from `app.xcworkspace`.
- Ensure Stripe keys, Firebase configs, and TURN server credentials are production-ready before building release artifacts.

## Troubleshooting

- **Firebase config errors**: the app throws descriptive errors in dev if required keys are missing. Verify `.env` and native config files.
- **WebRTC connection issues**: confirm your TURN server credentials and that `TURN_SERVER.enabled = true`.
- **Notifications**: FCM requires APNs certificates for iOS; ensure `ios/GoogleService-Info.plist` includes the correct bundle identifier.
- **Metro bundler not reachable on device**: re-run `./connect-device.sh` or manually set the debug server host in the dev menu.

## Conventions & Next Steps

- Keep new modules typed; export types under `src/types`.
- Surface new domain logic through the `services/` layer so UI stays declarative.
- Extend Jest coverage for services (mocks for Firebase/Stripe) and add Detox/E2E when readiness permits.

For deeper context on roadmap and cross-platform alignment, coordinate with the backend and web teams and keep this README up to date as architecture or setup steps evolve.
