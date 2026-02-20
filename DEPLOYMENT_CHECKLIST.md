# Tray Deployment Checklist

This checklist covers:
- `backend` (Node/Express on Vercel)
- `fastapi-ai-backend` (FastAPI on Vercel)
- `app` (React Native mobile release config)

## 1) Pre-Push Local Verification

From repo root:

```bash
# Node backend build
cd backend
npm run build
cd ..

# FastAPI syntax check
python3 -m py_compile fastapi-ai-backend/main.py fastapi-ai-backend/routers/*.py fastapi-ai-backend/services/*.py

# Mobile lint check (targeted)
cd app
npx eslint src/services/ai.service.ts src/Screen/common/Jobs/PostJobScreen.tsx src/Screen/Recruiter/Jobs/JobApplicationsScreen.tsx src/Screen/Student/Jobs/ResumeScreen.tsx
cd ..
```

## 2) Deploy `backend` (Node API)

From `backend/`:

```bash
vercel login
vercel link
vercel --prod
```

Make sure all backend Vercel env vars are set (Firebase, Stripe, etc).

## 3) Deploy `fastapi-ai-backend` (FastAPI AI API)

From `fastapi-ai-backend/`:

```bash
vercel login
vercel link
vercel env add OPENAI_API_KEY production
vercel env add ANTHROPIC_API_KEY production
vercel env add DEFAULT_AI_PROVIDER production
vercel env add OPENAI_MODEL production
vercel env add ANTHROPIC_MODEL production
vercel env add ALLOWED_ORIGINS production
vercel --prod
```

Quick verification:

```bash
curl https://<fastapi-project>.vercel.app/health
```

## 4) Configure Mobile App For Production

In `app/.env`:

```env
API_URL=https://<backend-project>.vercel.app
FASTAPI_AI_URL=https://<fastapi-project>.vercel.app
FASTAPI_AI_PROVIDER=openai
```

Then rebuild the app:

```bash
cd app
npm run ios
# or
npm run android
```

## 5) Final Smoke Flow

Test in app:
- Recruiter Post Job:
  - Generate with AI
  - Improve with AI
  - Optimize with AI
- Recruiter Applications:
  - Run AI Ranking
  - Talent Shortage Advice when no ready-now candidates
- Student Resume/Profile:
  - Resume score
  - Profile AI Insights
- Help Chat:
  - OpenAI/Claude provider toggle

## 6) Security

- Never commit `.env` files.
- If any API key was exposed, rotate immediately.
