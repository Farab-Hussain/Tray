from fastapi import APIRouter, HTTPException

from models.schemas import GenerateTextRequest
from services.ai_service import AIServiceError, ask_ai

router = APIRouter()


@router.post("/generate")
async def generate_text(req: GenerateTextRequest):
    try:
        text = await ask_ai(
            system_prompt=req.system_prompt,
            user_prompt=req.user_prompt,
            provider=req.provider,
            model=req.model,
            max_tokens=req.max_tokens,
            json_mode=req.json_mode,
        )
        return {"output": text}
    except AIServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message)
