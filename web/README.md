# Tray Web Dashboard

Next.js 15 application delivering Tray’s browser-based experience for administrators and consultants. The dashboard reuses the shared Firebase authentication layer, integrates with the Tray backend API, and provides role-aware tooling for analytics, onboarding, and service management.

## Highlights

- **App Router + React 19** with Turbopack dev/build pipeline.
- **Firebase email/password auth** that exchanges ID tokens with Tray’s backend via Axios interceptors.
- **Role-separated route groups** (`/admin`, `/consultant`) guarded by custom wrappers.
- **Operational widgets** for analytics, applications, payouts, notifications, and consultant lifecycle monitoring.
- **Tailwind CSS v4** theming layered with custom tokens and responsive scroll behavior.
- **Shared utilities** (`AuthContext`, `utils/api.ts`, `constants/`) to keep session state and design tokens consistent.

## Tech Stack

- Next.js 15.5 (app directory, server components where possible)
- React 19 with TypeScript 5
- Tailwind CSS 4
- Firebase Web SDK (`firebase/app`, `firebase/auth`)
- Axios + Lucide React

## Project Structure

```
web/
├── app/
│   ├── (root)/               # Public routes and core dashboards
│   │   ├── admin/            # Admin landing + sub-pages (analytics, users, settings…)
│   │   └── consultant/       # Consultant workspace (profile, services, applications)
│   ├── login/                # Firebase email/password login
│   ├── verify-email/         # Firebase email verification landing
│   └── layout.tsx            # Root layout + providers
├── components/
│   ├── admin/ | consultant/  # Role-specific UI widgets & guards
│   ├── shared/               # Shell/header/sidebar components
│   └── ui/                   # Generic cards, tables, status chips, dropdowns
├── contexts/AuthContext.tsx  # Client-side auth provider + token persistence
├── utils/api.ts              # Axios client + domain helpers (auth, bookings, reviews, etc.)
├── config/firebase.ts        # Browser-only Firebase initialization
├── constants/                # Routes, labels, enums, tokens
├── types/                    # Shared TypeScript interfaces
├── hooks/                    # Reusable hooks (e.g., input keyboard avoidance)
├── styles/globals.css        # Tailwind entry + global overrides
├── next.config.ts            # Image domains, CORS headers, experimental toggles
└── tailwind.config.js        # Tailwind content globs + color palette
```

> Default navigation redirects `/` to `/admin`. Use explicit URLs when testing consultant flows.

## Environment Variables

Create `web/.env.local` (never commit) and supply:

```env
# Backend REST API base URL
NEXT_PUBLIC_API_URL=https://api.your-tray-domain.com

# Firebase Web SDK configuration
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=...
```

All variables are public—do not place secrets here.

- `AuthContext` expects the backend `/auth/login` + `/auth/me` endpoints to return user records with a `role` (`admin` or `consultant`).
- The Axios instance injects the `authToken` from `localStorage` and clears storage + redirects to `/login` when it receives a 401.
- Update `next.config.ts` if you host images outside of `res.cloudinary.com` or `via.placeholder.com`.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server with Turbopack (`http://localhost:3000`). |
| `npm run dev:external` | Same as dev but accessible on the local network (`0.0.0.0`). |
| `npm run build` | Produce a production build (`.next/`). |
| `npm run start` | Serve the compiled build. |
| `npm run lint` | Run ESLint using `eslint.config.mjs`. |

If Turbopack runs into incompatibilities, temporarily fall back to `next dev`.

## Authentication Flow

1. Users sign in on `/login` via Firebase email/password.
2. A Firebase ID token is exchanged with Tray’s backend (`authAPI.login`), which returns profile metadata.
3. `AuthContext` stores the token + user data in `localStorage`; guards protect role routes on subsequent visits.
4. `/verify-email` processes Firebase email verification links (`mode=verifyEmail`) so users can complete verification from the web.

## Styling & UI

- Tailwind 4 pipeline imported through `styles/globals.css`.
- Custom CSS variables define brand colors, typography, and scroll experiences.
- Component hierarchy separates role-specific components (`components/admin|consultant`) from generic UI primitives.
- Tables and dashboards include scrollbar overrides to remain responsive on mobile/tablet breakpoints.

## API Usage

- `utils/api.ts` centralizes Axios setup (headers, interceptors, error handling).
- Domain helpers (`authAPI`, `consultantFlowAPI`, `consultantAPI`, `bookingAPI`, `reviewAPI`) wrap backend endpoints.
- Extend these modules when new backend controllers are added to keep request logic consistent.

## Deployment Notes

- Vercel is the easiest deployment target; ensure environment variables are configured in the project settings.
- Add production and preview URLs to the Firebase Auth authorized domain list.
- Backend must allow CORS from the web origin; `next.config.ts` currently sets permissive headers for local builds.
- Production builds require HTTPS for Firebase auth redirects.

## Testing Checklist

- `/login` invalid credentials, locked accounts, and role-based redirects.
- Admin dashboard flows: analytics, consultant profiles, activity, service applications, payouts.
- Consultant flows: multi-step profile form, service CRUD, status tracking.
- `/verify-email` for valid, expired, and malformed links.
- Responsive behavior on laptop, tablet, and mobile widths.

## Extending the Dashboard

- Add new admin pages under `app/(root)/admin/<feature>/page.tsx` and connect them to backend endpoints through `utils/api.ts`.
- Consultant additions should reuse the form/components in `components/consultant` to maintain UX parity.
- For complex state, consider promoting local state to contexts or a lightweight store (e.g., Zustand) while keeping auth centralized.
- Document new environment variables or backend dependencies in this README to keep the team synchronized.

---

For backend endpoint details, reference `../backend/README.md`. Keep this document updated whenever you add routes, environment variables, or significant architectural changes. ***
