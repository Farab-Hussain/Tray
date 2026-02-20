from fastapi import APIRouter, HTTPException

from models.schemas import ChatRequest
from services.ai_service import AIServiceError, ask_ai

router = APIRouter()

SYSTEM_PROMPT = """You are a friendly, helpful support assistant for a job search mobile app.

You help users with:
- Building their resume (fields, summaries, formatting tips)
- Creating job posts (as employers)
- Understanding how AI features work in the app
- Account and subscription questions
- Job search tips and career advice

Rules:
- Be concise (2-4 sentences max per reply)
- If you don't know something app-specific, say \"Let me connect you with our team\"
- Never make up prices or features
- Use a warm, encouraging tone
- If asked something completely unrelated to jobs/careers, gently redirect
"""


@router.post("/message")
async def chat(req: ChatRequest):
    context_note = ""
    if req.user_context:
        context_note = (
            "\n[User context: "
            f"name={req.user_context.get('name', 'unknown')}, "
            f"plan={req.user_context.get('plan', 'free')}]"
        )

    history_text = "\n".join(
        [f"{msg.role}: {msg.content}" for msg in req.history[-10:]]
    )

    user_prompt = (
        f"Conversation history:\n{history_text}\n\n"
        f"User message: {req.message}\n"
        "Reply as the assistant only."
    )

    try:
        reply = await ask_ai(
            system_prompt=SYSTEM_PROMPT + context_note,
            user_prompt=user_prompt,
            provider=req.provider,
            model=req.model,
            max_tokens=300,
            temperature=0.7,
        )
        return {"reply": reply.strip()}
    except AIServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message)
