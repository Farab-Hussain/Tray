import json

from fastapi import APIRouter, HTTPException

from models.schemas import AutocompleteRequest
from services.ai_service import AIServiceError, ask_ai

router = APIRouter()

FIELD_PROMPTS = {
    "job_title": (
        "Suggest {n} professional job titles that start with or relate to '{text}'. "
        "Context: {ctx}. Return ONLY JSON array of strings: [\"title1\", \"title2\"]"
    ),
    "skill": (
        "Suggest {n} professional skills related to '{text}' for a resume. "
        "Context: {ctx}. Return ONLY JSON array: [\"skill1\", \"skill2\"]"
    ),
    "responsibility": (
        "Suggest {n} strong resume bullet points (action verb + result) containing '{text}'. "
        "Context: {ctx}. Return ONLY JSON array: [\"Built X that resulted in Y\"]"
    ),
    "company_desc": (
        "Suggest {n} professional company description completions for: '{text}'. "
        "Context: {ctx}. Return ONLY JSON array of short phrases: [\"phrase1\", \"phrase2\"]"
    ),
}


@router.post("/suggest")
async def suggest(req: AutocompleteRequest):
    if len(req.partial_text.strip()) < 2:
        return {"suggestions": []}

    prompt_template = FIELD_PROMPTS.get(
        req.field_type,
        "Suggest {n} completions for '{text}'. Return ONLY JSON array.",
    )

    prompt = prompt_template.format(
        n=req.max_suggestions,
        text=req.partial_text,
        ctx=json.dumps(req.context) if req.context else "general",
    )

    system = "You are an autocomplete engine. Return ONLY valid JSON array of strings. No markdown."

    try:
        result = await ask_ai(
            system_prompt=system,
            user_prompt=prompt,
            provider=req.provider,
            model=req.model,
            max_tokens=200,
            temperature=0.3,
        )
        clean = result.strip().replace("```json", "").replace("```", "").strip()
        suggestions = json.loads(clean)
        if not isinstance(suggestions, list):
            return {"suggestions": []}
        return {"suggestions": suggestions[: req.max_suggestions]}
    except AIServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message)
    except Exception:
        return {"suggestions": []}
