import os
from typing import Optional

from anthropic import AsyncAnthropic
from dotenv import load_dotenv
from openai import AsyncOpenAI

load_dotenv()


class AIServiceError(Exception):
    def __init__(self, message: str, status_code: int = 400):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


def _clean_json_string(text: str) -> str:
    cleaned = text.strip()
    cleaned = cleaned.replace("```json", "").replace("```", "").strip()
    return cleaned


def _status_from_exception(exc: Exception) -> int:
    status_code = getattr(exc, "status_code", None)
    if isinstance(status_code, int):
        return status_code

    message = str(exc).lower()
    if "insufficient_quota" in message or "error code: 429" in message:
        return 429
    if "connection error" in message or "connecterror" in message:
        return 503
    return 400


def _get_openai_client() -> AsyncOpenAI:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise AIServiceError("OPENAI_API_KEY is missing. Set it in fastapi-ai-backend/.env")
    return AsyncOpenAI(api_key=api_key)


def _get_anthropic_client() -> AsyncAnthropic:
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        raise AIServiceError("ANTHROPIC_API_KEY is missing. Set it in fastapi-ai-backend/.env")
    return AsyncAnthropic(api_key=api_key)


async def ask_ai(
    *,
    system_prompt: str,
    user_prompt: str,
    provider: Optional[str] = None,
    model: Optional[str] = None,
    max_tokens: int = 800,
    json_mode: bool = False,
    temperature: float = 0.7,
) -> str:
    selected_provider = (provider or os.getenv("DEFAULT_AI_PROVIDER") or "openai").lower()

    if selected_provider == "openai":
        openai_client = _get_openai_client()
        selected_model = model or os.getenv("OPENAI_MODEL", "gpt-4o-mini")
        response_format = {"type": "json_object"} if json_mode else {"type": "text"}
        try:
            response = await openai_client.chat.completions.create(
                model=selected_model,
                max_tokens=max_tokens,
                temperature=temperature,
                response_format=response_format,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
            )
            return (response.choices[0].message.content or "").strip()
        except Exception as exc:
            raise AIServiceError(
                f"OpenAI request failed: {str(exc)}",
                status_code=_status_from_exception(exc),
            )

    if selected_provider == "claude":
        anthropic_client = _get_anthropic_client()
        selected_model = model or os.getenv("ANTHROPIC_MODEL", "claude-3-5-sonnet-latest")
        if json_mode:
            user_prompt = (
                f"{user_prompt}\n\nReturn ONLY valid JSON. "
                "No markdown, no explanation outside JSON."
            )
        try:
            response = await anthropic_client.messages.create(
                model=selected_model,
                max_tokens=max_tokens,
                temperature=temperature,
                system=system_prompt,
                messages=[{"role": "user", "content": user_prompt}],
            )

            text_chunks = [
                block.text
                for block in response.content
                if hasattr(block, "type") and block.type == "text"
            ]
            return _clean_json_string("".join(text_chunks))
        except Exception as exc:
            raise AIServiceError(
                f"Claude request failed: {str(exc)}",
                status_code=_status_from_exception(exc),
            )

    raise AIServiceError("Unsupported provider. Use 'openai' or 'claude'.")
