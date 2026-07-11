# FairChance — Complete App Context for Google Play Publishing

**Use this document as context for ChatGPT / assistants when filling Google Play Console forms** (store listing, Data safety, Content ratings, Ads, Target audience, Financial features, Government apps, Health, Sign-in details, etc.).

---

## 1. Product identity

| Item | Value |
|------|--------|
| **Public app name** | FairChance |
| **Android package / applicationId** | `com.fairchance.app` |
| **Current Android version** | versionName `1.0.5`, versionCode `6` |
| **Latest AAB** | `FairChance-1.0.5-v6.aab` (signed release) |
| **Firebase project** | `tray-ed2f7` (legacy internal name; user-facing brand is FairChance) |
| **Backend API** | `https://tray-ecru.vercel.app` |
| **Admin / legal web** | `https://tray-dashboard-eight.vercel.app` |
| **Privacy policy URL** | https://tray-dashboard-eight.vercel.app/privacy-policy |
| **Terms of Service URL** | https://tray-dashboard-eight.vercel.app/terms |
| **Account / data deletion URL** | https://tray-dashboard-eight.vercel.app/delete-user-data |
| **Privacy contact email** | privacy@tray.app |
| **Support** | In-app Help / support form; email via privacy/support channels |

**Important:** Repo and some infrastructure still use the legacy name “Tray”. **All user-facing branding must be FairChance.** Emails should show From name **FairChance**.

---

## 2. What the app is (one paragraph)

FairChance is a **career and consulting marketplace mobile app** for people with justice-involved / fair-chance hiring backgrounds and the professionals who support them. Users can browse consultants, book paid consulting sessions, take courses, apply to jobs, message and call other users, and (as recruiters) post jobs. It is **not** a dating app, social network for entertainment, government app, bank, or health/medical app.

---

## 3. User roles

| Role | Who | Main capabilities |
|------|-----|-------------------|
| **Student** | Job seekers / learners | Browse consultants & courses, book sessions, apply to jobs, chat/call, build profile/resume |
| **Consultant** | Career coaches / advisors | Create profile & services, set availability, manage bookings, create courses (admin approval), chat/call |
| **Recruiter / Hiring manager** | Employers | Company profile, post jobs (paid bundle), review applications |
| **Admin** | Internal staff | Web dashboard only (`/admin`) — approve consultants, services, courses; settings; users |

Users sign up with a role; some can hold multiple roles over time. Active role drives the tab UI.

---

## 4. Core features (by area)

### Auth & account
- Email + password registration and login
- Social login: **Google**, **Apple**, **Facebook** (OAuth / SSO)
- Email verification required for email/password users
- Password reset (OTP / email)
- Profile edit (name, photo, bio, professional info)
- Privacy Policy & Terms opened from app → same web URLs above (no separate in-app copy)

### Student
- Home feed / consultants list & top consultants
- Book services (cart + Stripe payment)
- Courses library & course player (after purchase / access)
- Jobs browse & apply; resume / work eligibility docs
- Platform access fee paywall ($25 one-time, promo codes supported)

### Consultant
- Profile onboarding / verification flow
- My Services (CRUD), Set Availability
- Bookings management
- Course creation → submit for admin approval → published
- Chat / audio-video calling with students

### Recruiter
- Company profile / fair-chance hiring settings
- Job posting with payment ($5 per 3 postings bundle model)
- Application review

### Communication
- In-app messaging (chat)
- Audio and video calls (WebRTC; TURN via Twilio Network Traversal)
- Push notifications (FCM); iOS VoIP / CallKit for incoming calls

### Payments (Stripe)
- One-time **platform access fee** (~$25) for student/consultant roles (waivable / promo codes)
- Booking / session payments
- Course purchases
- Recruiter job posting bundles
- **No ads / AdMob**
- **No loot boxes / random chance purchases**
- **Not a bank**; Stripe processes cards; app does not store full card numbers

### Admin (web only)
- Consultant profile approvals
- Service application approvals
- Course approvals (`/admin/course-approvals`)
- Users, analytics, pricing & promo codes, broadcast email/push

---

## 5. Content & safety characteristics (for Content ratings / Target audience)

| Topic | Truth for FairChance |
|-------|----------------------|
| Category feel | Career marketplace with social/communication features (chat, discover consultants) |
| Dating / sexual content | **No** |
| Public nudity | **No** |
| Graphic violence | **No** |
| Share precise GPS with other users | **No** (no location-sharing social feature; no ACCESS_FINE_LOCATION in manifest) |
| Digital goods / IAP-style purchases | **Yes** (access fee, courses, bookings, job bundles via Stripe) |
| Chance-based purchases | **No** |
| In-app block users | **No** (not implemented) |
| In-app report users/UGC | **No** (not implemented) |
| Chat moderation tools | **No** dedicated moderation UI |
| Friends-only interactions | **No** — users can discover consultants/jobs beyond invited friends |
| Target audience | Adults **18+** (jobs, payments, professional consulting). **Not for children.** Designed for **18 and older**. |
| Government app | **No** |
| Health / medical app | **No** |
| Contains ads | **No** |

**IARC / Content ratings (already generated from questionnaire):** typically Teen / 12+ / 14+ / 16+ by region with “Users Interact” + “In-App Purchases” — consistent with a social-communication style app that has chat and purchases.

---

## 6. Data safety — what is collected / shared

### Collected (transmitted off device to our backend / providers)

| Google Play data type | Collected? | Notes |
|----------------------|------------|--------|
| Name | Yes | Profile |
| Email address | Yes | Account |
| User IDs | Yes | Firebase UID |
| Phone number | Yes if user provides | Profile / contact |
| Address | Possible | Company HQ / profile fields |
| Photos | Yes | Profile, service, course images (Cloudinary) |
| Videos | Yes if used | Calls / media uploads where applicable |
| Voice / audio | Yes during calls | WebRTC calls |
| Other in-app messages | Yes | Chat |
| Purchase history | Yes | Bookings, courses, fees |
| Payment info | Processed by Stripe | App uses Stripe SDK; full PAN not stored by FairChance |
| App interactions / search | Yes | Usage for product functionality |
| Device or other IDs | Yes | FCM / device tokens for push |
| Crash logs / diagnostics | Possible | Logging / crash reporting utilities |
| Precise / approximate location | Generally **No** as a product feature | Do not declare unless you later add location sharing |

### Shared with third parties (service providers — not sold)

| Provider | Purpose |
|----------|---------|
| **Firebase / Google** | Auth, Firestore, FCM, hosting-related |
| **Stripe** | Payments |
| **Cloudinary** | Image/file hosting |
| **Twilio** | TURN/ICE for calls |
| **Email SMTP** | Transactional email (verification, resets, notifications) |
| **Apple / Google / Facebook** | SSO when user chooses social login |

**Data is not sold.** Shared only as needed for app functionality with processors.

### Security & deletion
- **Encrypted in transit:** Yes (HTTPS/TLS)
- **Account creation methods:** Username+password **and** other auth; **OAuth** (Google/Apple/Facebook)
- **Delete account URL:** https://tray-dashboard-eight.vercel.app/delete-user-data  
- Users can also email **privacy@tray.app** for deletion / data requests  
- Some financial records may be retained for legal/tax reasons (stated on deletion page)

---

## 7. Sign-in details for Google Play review

Reviewers **cannot** create accounts. Provide a dedicated test account.

**Recommended declaration (example already prepared):**

| Field | Value |
|-------|--------|
| Name | User Account |
| Email | `metaxoft6@gmail.com` (single `@` — not `@@`) |
| Password | `Test@123` |
| Other info | Email/password login; email verified; Student role; platform access fee already paid/waived; no 2FA/biometrics/QR; core features available without new purchase |

Confirm the checkbox that credentials provide access to restricted/paid parts as applicable.

---

## 8. Store listing assets (repo)

Location: `app/play-store/graphics/`

| Asset | File | Status |
|-------|------|--------|
| App icon 512×512 | `app-icon-512.png` | Ready |
| Feature graphic 1024×500 | `feature-graphic-1024x500.png` | Ready |
| Phone screenshots | — | **Still needed** (upload real device screenshots) |
| Short description | — | Write in Console (~80 chars) |
| Full description | — | Write in Console |

Suggested short description direction:  
*FairChance connects justice-impacted talent with consultants, courses, and fair-chance employers.*

Suggested full description themes: roles (student/consultant/recruiter), booking, courses, jobs, messaging/calls, privacy links.

---

## 9. Tech stack (for accuracy, not for store copy)

- **Mobile:** React Native (iOS + Android)
- **Backend:** Node/Express on Vercel
- **Admin web:** Next.js
- **Auth/DB:** Firebase Auth + Firestore + RTDB (chats)
- **Payments:** Stripe
- **Push:** FCM (+ iOS VoIP)
- **Calls:** react-native-webrtc + Twilio TURN
- **Media:** Cloudinary

Android permissions include: Internet, notifications, camera, microphone, media read (images/video), Bluetooth connect (calls), foreground service for calls — **not** fine location.

---

## 10. Monetization summary (Financial features form)

- App offers **paid digital services**: platform access, consulting bookings, courses, job postings  
- Payments via **Stripe** (cards)  
- **Not** a bank, credit union, or money transmitter as primary purpose  
- **Not** crypto trading / peer-to-peer cash app  
- Promo / discount codes exist for access fee (e.g. nonprofit codes)  
- Declare financial features related to **facilitating payments for services** as Play’s form requires; answer **No** to government apps and health apps

---

## 11. Ads declaration

**Does the app contain ads?** → **No**

---

## 12. Target audience & news apps

- **Target age:** 18+  
- **Appeals to children:** No  
- **Designed for families / kids:** No  
- **News app:** No  

---

## 13. How the in-app Privacy Policy relates to the web page

The app does **not** embed a separate privacy policy screen. Help / Register legal links open:

`https://tray-dashboard-eight.vercel.app/privacy-policy`

So Play Console privacy URL and in-app policy are the **same content**.

---

## 14. Suggested ChatGPT prompt wrapper

Paste this file, then ask:

> Using the FairChance app context above, help me fill Google Play Console section: **[Data safety / Store listing / Financial features / …]**.  
> Ask me only if something is ambiguous. Prefer accurate, conservative disclosures.  
> Output answers in a table: Question → Exact answer to select/type.

---

## 15. Quick “do / don’t” for publishing answers

**Do say:**
- Career / consulting / jobs marketplace  
- Account required; OAuth + password  
- Collects personal, financial (via Stripe), photos, messages, audio for calls, device IDs for push  
- Shares with service providers; does not sell data  
- Encrypted in transit; deletion URL available  
- 18+; no ads; digital purchases yes; loot boxes no  

**Don’t say:**
- Dating app  
- Kids app  
- Government app  
- Health/medical device app  
- We don’t collect any data  
- No account required  
- Contains ads  

---

## 16. Foreground service permissions (Play Console)

### Do not declare Media projection
FairChance does **not** use screen sharing. As of AAB **1.0.4 (versionCode 5)**, `MediaProjectionService` is removed from the merged manifest. Upload that AAB first; Media projection should disappear from the form. Leave Media projection blank if still shown on an older bundle.

### Phone call — declare only this

| Field | Answer |
|-------|--------|
| **What tasks require this permission?** | **Voice over Internet Protocol (VoIP), telecom APIs** only. Do **not** select Other. |
| **Video** | Unlisted YouTube or Google Drive link showing: place/receive an in-app audio or video call, put the app in background or lock the screen, show the ongoing call notification, then return and end the call. |
| **Describe permission use** | Paste the text below. |

**Describe permission use (copy-paste):**

```
FairChance uses FOREGROUND_SERVICE_PHONE_CALL for in-app VoIP audio and video consulting calls (WebRTC). When a user is on a call or receiving an incoming call, CallService runs as a phoneCall foreground service so the call and its notification continue while the app is backgrounded or the screen is locked. The service must start immediately when a call begins or an incoming call arrives so the callee can answer and the media session stays connected. Pausing or restarting the service would drop the live call and prevent reliable incoming-call handling.
```

---

*Generated for Play Console publishing assistance. Keep credentials and promo codes out of public store listing text; use them only in the private Sign-in details declaration.*
