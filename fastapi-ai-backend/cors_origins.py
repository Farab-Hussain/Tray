import os
import re

PRODUCTION_ORIGINS = [
    "https://tray-ecru.vercel.app",
    "https://tray-ai-backend.vercel.app",
    "https://tray-dashboard-eight.vercel.app",
    "https://tray-app.com",
    "https://www.tray-app.com",
]

DEVELOPMENT_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:4000",
    "http://localhost:8000",
    "http://localhost:19006",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:4000",
    "http://127.0.0.1:8000",
    "http://127.0.0.1:19006",
    "capacitor://localhost",
    "ionic://localhost",
]

LOCAL_NETWORK_ORIGIN = re.compile(
    r"^https?://("
    r"localhost|127\.0\.0\.1|"
    r"192\.168\.\d{1,3}\.\d{1,3}|"
    r"10\.\d{1,3}\.\d{1,3}\.\d{1,3}|"
    r"172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}"
    r")(:\d+)?$"
)

EXPO_ORIGIN = re.compile(r"^exp://")
NGROK_ORIGIN = re.compile(
    r"^https?://[a-z0-9-]+\.(ngrok-free\.dev|ngrok\.io|ngrok\.app)(:\d+)?$",
    re.IGNORECASE,
)


def _parse_extra_origins() -> list[str]:
    raw = os.getenv("CORS_ALLOWED_ORIGINS") or os.getenv("ALLOWED_ORIGINS", "")
    if raw.strip() == "*":
        return []
    return [origin.strip() for origin in raw.split(",") if origin.strip()]


def get_allowed_origins() -> list[str]:
    node_env = os.getenv("NODE_ENV", "development")
    extras = _parse_extra_origins()

    base = list(PRODUCTION_ORIGINS)
    if node_env != "production":
        base.extend(DEVELOPMENT_ORIGINS)

    return list(dict.fromkeys([*base, *extras]))


def is_origin_allowed(origin: str | None) -> bool:
    if not origin:
        return True

    if origin in get_allowed_origins():
        return True

    if LOCAL_NETWORK_ORIGIN.match(origin) or EXPO_ORIGIN.match(origin):
        return True

    node_env = os.getenv("NODE_ENV", "development")
    if node_env != "production" or os.getenv("CORS_ALLOW_LOCALHOST") == "true":
        return bool(NGROK_ORIGIN.match(origin))

    return False
