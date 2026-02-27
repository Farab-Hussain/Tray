# FastAPI AI Backend

Separate AI backend for the Tray mobile app with provider switching between OpenAI and Claude.

## Features

- `POST /api/resume/generate-summary`
- `POST /api/resume/validate-field`
- `POST /api/resume/score`
- `POST /api/resume/profile-insights`
- `POST /api/jobpost/generate`
- `POST /api/jobpost/improve`
- `POST /api/jobpost/extract-skills`
- `POST /api/chat/message`
- `POST /api/autocomplete/suggest`
- `POST /api/ai/generate` (generic)
- `POST /api/admin-ai/insights`
- `GET /health`

## Provider Selection

Each request can include:

```json
{
  "provider": "openai",
  "model": "gpt-4o-mini"
}
```

or

```json
{
  "provider": "claude",
  "model": "claude-3-5-sonnet-latest"
}
```

If omitted, backend uses `DEFAULT_AI_PROVIDER` from `.env`.

## Run Locally

```bash
cd fastapi-ai-backend
python3.12 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip setuptools wheel
pip install -r requirements.txt
cp .env.example .env
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## Python Version Note

- Recommended: `Python 3.12` (or `3.13`)
- If you created `.venv` with `3.14`, recreate it:

```bash
deactivate 2>/dev/null || true
rm -rf .venv
python3.12 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip setuptools wheel
pip install -r requirements.txt
```

## Quick Test

```bash
curl -X POST http://localhost:8000/api/ai/generate \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "openai",
    "system_prompt": "You are concise.",
    "user_prompt": "Say hello in one line."
  }'
```

## Smoke Test All AI Routes

With server running:

```bash
./scripts/smoke_test.sh
```

## Deploy FastAPI AI Backend To Vercel (Production)

From `fastapi-ai-backend/`:

```bash
# 1) Login and link project
vercel login
vercel link

# 2) Set production env vars
vercel env add OPENAI_API_KEY production
vercel env add ANTHROPIC_API_KEY production
vercel env add DEFAULT_AI_PROVIDER production
vercel env add OPENAI_MODEL production
vercel env add ANTHROPIC_MODEL production
vercel env add ALLOWED_ORIGINS production

# 3) Deploy
vercel --prod
```

Expected routes in production:
- `GET /health`
- `POST /api/chat/message`
- `POST /api/resume/*`
- `POST /api/jobpost/*`
- `POST /api/autocomplete/suggest`
- `POST /api/ai/generate`

After deploy, set your app env:
- `app/.env` -> `FASTAPI_AI_URL=https://<your-fastapi-project>.vercel.app`

Important:
- Set `ALLOWED_ORIGINS` to your production app/web domains (comma-separated).
- Rotate compromised API keys immediately if they were ever exposed.
- Optional hardening: set `ADMIN_AI_SHARED_SECRET` in both `backend/.env` and
  `fastapi-ai-backend/.env` so only your backend proxy can call `/api/admin-ai/insights`.
