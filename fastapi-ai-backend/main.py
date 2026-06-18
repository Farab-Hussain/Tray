import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

from cors_origins import get_allowed_origins
from routers import admin_ai, ai, autocomplete, chatbot, jobpost, resume

app = FastAPI(
    title="Tray AI FastAPI Backend",
    description="AI-powered API for Resume, Job Posts, Chatbot, and Autocomplete",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_allowed_origins(),
    allow_origin_regex=(
        r"^https?://("
        r"localhost|127\.0\.0\.1|"
        r"192\.168\.\d{1,3}\.\d{1,3}|"
        r"10\.\d{1,3}\.\d{1,3}\.\d{1,3}|"
        r"172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}"
        r")(:\d+)?$"
        r"|^exp://.*"
        r"|^https?://[a-z0-9-]+\.(ngrok-free\.dev|ngrok\.io|ngrok\.app)(:\d+)?$"
    )
    if os.getenv("NODE_ENV", "development") != "production"
    or os.getenv("CORS_ALLOW_LOCALHOST") == "true"
    else None,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ai.router, prefix="/api/ai", tags=["AI"])
app.include_router(admin_ai.router, prefix="/api/admin-ai", tags=["Admin AI"])
app.include_router(resume.router, prefix="/api/resume", tags=["Resume"])
app.include_router(jobpost.router, prefix="/api/jobpost", tags=["Job Post"])
app.include_router(chatbot.router, prefix="/api/chat", tags=["Chatbot"])
app.include_router(autocomplete.router, prefix="/api/autocomplete", tags=["Autocomplete"])


@app.get("/health")
async def health():
    return {"status": "ok", "message": "FastAPI AI backend is running"}
