import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

from routers import ai, autocomplete, chatbot, jobpost, resume

app = FastAPI(
    title="Tray AI FastAPI Backend",
    description="AI-powered API for Resume, Job Posts, Chatbot, and Autocomplete",
    version="1.0.0",
)

allowed_origins = os.getenv("ALLOWED_ORIGINS", "*")
origin_list = [origin.strip() for origin in allowed_origins.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origin_list if origin_list else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ai.router, prefix="/api/ai", tags=["AI"])
app.include_router(resume.router, prefix="/api/resume", tags=["Resume"])
app.include_router(jobpost.router, prefix="/api/jobpost", tags=["Job Post"])
app.include_router(chatbot.router, prefix="/api/chat", tags=["Chatbot"])
app.include_router(autocomplete.router, prefix="/api/autocomplete", tags=["Autocomplete"])


@app.get("/health")
async def health():
    return {"status": "ok", "message": "FastAPI AI backend is running"}
