# Tray Backend API

Node.js/TypeScript service that powers Tray’s core platform features: authentication, consultant onboarding, bookings, Stripe payments, reminders, analytics, notifications, and content storage. The API is stateless, uses Firebase Admin as the system of record, and exposes a REST surface for mobile and web clients.

## Highlights

- Express 5 + TypeScript running on Node 20 with strict linting via the TypeScript compiler.
- Firebase Admin SDK for auth, Firestore, Realtime Database, Storage, and FCM token distribution.
- Domain-driven controllers/services covering auth, consultant workflows, bookings, payouts, notifications, and reporting.
- Stripe integration for payment intents plus automated consultant payouts with configurable platform fees.
- Cloudinary-backed media uploads with multer storage, and transactional email templates via Nodemailer.
- Reminder engine that emails + pushes 24 hr appointment notices, and analytics endpoints for consultants/admins.
- Drop-in logging middleware (`requestLogger`) and structured `Logger` utility to trace routes and user actions.

## Project Layout

```
backend/
├── src/
│   ├── app.ts                 # Express app + middleware and route wiring
│   ├── server.ts              # HTTP server bootstrap
│   ├── config/firebase.ts     # Firebase Admin initialization (service account aware)
│   ├── controllers/           # Route handlers grouped by domain
│   ├── services/              # Business logic (analytics, reminders, payouts, etc.)
│   ├── routes/                # Express routers mounted under /auth, /bookings, ...
│   ├── middleware/            # Authentication + role guards
│   ├── models/                # Firestore data helpers/types
│   ├── utils/                 # Logger + email helpers
│   └── functions/             # Optional Firebase Cloud Function samples
├── scripts/                   # Operational scripts (e.g. create-admin placeholder)
├── dist/                      # Compiled JavaScript output (created by `npm run build`)
├── package.json               # Scripts and dependency manifest
└── tsconfig.json              # TypeScript build settings
```

Key entry points:

- `src/app.ts` wires CORS, JSON parsing, request logging, health checks, and feature routers.
- `src/config/firebase.ts` loads a service account JSON path from `SERVICE_ACCOUNT_PATH` or falls back to the bundled key; exports Firestore/Storage/Auth handles.
- `src/utils/logger.ts` supplies `Logger.info/success/error/warn` and an Express `requestLogger`.
- `src/services/` encapsulate longer-running processes (analytics, reminders, payouts, consultant flow orchestration).

## Prerequisites

- Node.js ≥ 20 and npm (nvm recommended).
- Firebase project with Admin service account (Firestore + Realtime Database enabled).
- Stripe account with secret key and connected accounts enabled for payouts.
- Cloudinary credentials (or alternative storage if you swap out the uploader).
- SMTP credentials (Gmail, SES, etc.) for transactional email; when absent, emails are logged but not sent.
- Optionally, Google Cloud Storage auth if you extend file handling.

## Environment Variables

Create `backend/.env` before running locally. The runtime reads the following keys (defaults indicated where applicable):

| Category | Variable | Notes |
| --- | --- | --- |
| Server | `PORT` (default `4000`), `NODE_ENV`, `BASE_URL` | `PORT` must be open for the API; `BASE_URL` is used in emails/links |
| Firebase | `SERVICE_ACCOUNT_PATH` | Absolute/relative path to service account JSON; falls back to `src/config/*.json` |
| Stripe | `STRIPE_SECRET_KEY`, `PLATFORM_FEE_AMOUNT` (default `5.00`), `MINIMUM_PAYOUT_AMOUNT` (default `10`) | Required for payments and automated payouts |
| Cloudinary | `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Used by `upload.controller.ts` |
| Email | `SMTP_HOST` (`smtp.gmail.com`), `SMTP_PORT` (`587`), `SMTP_EMAIL`/`SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM` | Without credentials, email helpers no-op |
| Notifications | `FCM_SERVER_KEY` (optional – Firebase Admin handles most push duties) | Useful if you integrate REST FCM calls |
| Misc | `GOOGLE_APPLICATION_CREDENTIALS` (if running on GCP) | Honors standard GOOGLE_APPLICATION_CREDENTIALS semantics |

Copy `src/config/tray-ed2f7-firebase-adminsdk-*.json` to a secure location or supply your own service account path. Keep secrets out of version control.

## Installation & Runbook

```sh
# 1. Install dependencies
npm install

# 2. Run locally with ts-node-dev autoreload
npm run dev

# 3. Build TypeScript -> dist/
npm run build        # or npm run build:clean

# 4. Start compiled server
npm run start        # uses dist/server.js
npm run start:prod   # sets NODE_ENV=production
```

Helpful scripts:

- `npm run create-admin` (placeholder script to seed admin users; extend `scripts/createAdmin.ts`).
- `npm run copy-files` runs postbuild to ensure service-account JSON lands in `dist/config/`.
- `npm run test-auth` executes a quick token-verification sanity check (no formal test suite yet).

Server exposes:

- `GET /` – sanity response.
- `GET /health` – verifies Firestore connectivity and returns timestamp/status.

## Feature Modules

### Authentication & Users (`/auth`)

- Registration persists user metadata in Firestore and validates role assignments.
- Login verifies Firebase ID tokens and returns merged profile data.
- Profile updates allow name/avatar changes; soft-delete flips `isActive`.
- Password recovery implements OTP email with Firestore-backed reset sessions (`/auth/forgot-password`, `/auth/verify-otp`, `/auth/reset-password`).

### Consultant Lifecycle (`/consultants`, `/consultant-flow`)

- CRUD endpoints for consultant listings, top consultants, and service catalogs.
- Onboarding flow stores profile drafts, handles approvals/rejections, and emails updates.
- Availability, applications, verification, and payout metadata live under `consultantFlow` controllers/services.

### Bookings & Sessions (`/bookings`)

- Full lifecycle endpoints for students and consultants: create, list, status updates, cancellations.
- Refund calculations, payment status tracking, and last-message metadata updates feed downstream services.
- Reminder service (`src/services/reminder.service.ts`) sends 24 hr email/push notifications and marks `reminderSent` flags.

### Payments & Payouts (`/payment`, `payout.service.ts`)

- Stripe payment intents created via `/payment/create-intent`.
- Automated consultant payouts aggregate completed, paid bookings, apply platform fees, create Stripe transfers, and persist payout documents (call `processAutomatedPayouts()` from cron or admin tooling).

### Notifications (`/fcm`, `/notifications`)

- Token registration and removal for device-specific FCM tokens (`/fcm/token`).
- Explicit push notifications for chat messages and incoming calls (`/notifications/send-message`, `/notifications/send-call`) with device-specific payloads, APNS/Android categories, and invalid-token cleanup.
- Optional Cloud Function (`functions/sendMessageNotification.function.ts`) if you migrate notifications to Firebase Functions instead of the REST endpoint.

### Reviews & Ratings (`/reviews`)

- Students create reviews, fetch consultant feedback, and update aggregate rating counters referenced in analytics.

### Analytics & Reporting (`/analytics`, `/consultant-flow/admin/analytics`)

- Consultant analytics summarise revenue, booking counts, top services, retention, and trends by period (`week|month|year`).
- Admin analytics return platform-wide metrics (user counts, bookings, revenue, growth deltas, recent activity).

### Reminders (`/reminders/send`)

- Authenticated admin endpoint triggers reminder processing manually—ideal for cron jobs, Cloud Scheduler, or testing.
- Reminders send both email and push notifications to students/consultants, then patch bookings with timestamps.

### File Uploads (`/upload/image`)

- Handles multipart uploads via multer, streams assets to Cloudinary, and returns URL + public ID.

## Data Model Cheatsheet

Primary Firestore collections consumed by the API:

- `/users/{userId}` – core account metadata and nested `/fcmTokens/{tokenId}`.
- `/consultantProfiles/{profileId}` & `/consultantApplications/{applicationId}` – onboarding records.
- `/bookings/{bookingId}` – booking details, reminder/payment flags, session metadata.
- `/payouts/{payoutId}` – Stripe transfer history and booking associations.
- `/services/{serviceId}` – referenced by bookings/analytics (populated elsewhere).
- `/chats/{chatId}` – message data for notification triggers (managed by mobile app).

Ensure indexes exist for compound queries (e.g., `bookings` filters on `status` and `paymentStatus`). Keep Firestore rules aligned with server logic to prevent unauthorized access.

## Observability & Error Handling

- `requestLogger` logs method, path, status, and duration by default.
- Use `Logger.info/success/warn/error(route, userId, message, error?)` inside controllers/services for structured breadcrumbs. Consider redirecting output to Stackdriver/CloudWatch when deploying.
- Standard error responses follow `{ error: string }`. Extend with error codes if clients require more granularity.

## Emails & Messaging

- `src/utils/email.ts` centralizes Nodemailer configuration, verifies credentials on boot, and exposes helper functions for consultant onboarding and application lifecycle.
- When SMTP creds are missing, the transport logs warnings and returns gracefully (OTP codes fall back to console logging in development).

## Deployment Checklist

1. **Secrets:** Provide production `.env`, Stripe key, Cloudinary creds, SMTP account, and secure service account file.
2. **Build:** `npm run build:clean` to refresh the `dist/` bundle.
3. **Copy Service Account:** Ensure `dist/config/` contains your service account JSON or set `SERVICE_ACCOUNT_PATH`.
4. **Start:** `npm run start:prod` (or integrate with PM2, systemd, Docker, etc.).
5. **Cron / Scheduler:** Schedule reminders (`POST /reminders/send`) and payouts (`processAutomatedPayouts`) using Cloud Scheduler, GitHub Actions, or similar.
6. **Monitoring:** Ping `/health` and tail logs for `Logger.error` events; optional third-party uptime checks.

## Extending the API

- Add new routes under `src/routes/` and pair them with controllers/services; register them in `src/app.ts`.
- Keep business logic in services; controllers should validate input, call service functions, and shape responses.
- For long-running jobs, prefer idempotent services that can be invoked via HTTP or scheduled workers.
- Update this README whenever new modules, env vars, or operational steps are introduced.

## Resources

- Express 5: https://expressjs.com/
- Firebase Admin SDK: https://firebase.google.com/docs/admin/setup
- Stripe Payments & Connect: https://stripe.com/docs/connect
- Cloudinary Upload API: https://cloudinary.com/documentation
- Nodemailer: https://nodemailer.com/about/

---

Questions or gotchas? Check inline comments across `controllers/` and `services/`, and coordinate updates with the mobile (`app/`) and web (`web/`) teams. Keep secrets secure and revisit platform fees/thresholds before going live.