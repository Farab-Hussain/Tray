import json
import os

from fastapi import APIRouter, Header, HTTPException

from models.schemas import AdminInsightsRequest
from services.ai_service import AIServiceError, ask_ai

router = APIRouter()


@router.post("/insights")
async def generate_admin_insights(
    req: AdminInsightsRequest, x_admin_ai_secret: str | None = Header(default=None)
):
    required_secret = os.getenv("ADMIN_AI_SHARED_SECRET")
    if required_secret and x_admin_ai_secret != required_secret:
        raise HTTPException(status_code=403, detail="Forbidden")

    system_prompt = """You are an expert workforce marketplace analyst for an admin console.
Return ONLY valid JSON matching this exact structure:
{
  "platform_analytics_intelligence": {
    "dropoff_analysis": [{"stage": "string", "issue": "string", "impact": "high|medium|low", "action": "string"}],
    "top_performing_consultants": [{"name": "string", "reason": "string"}],
    "placement_rate_analysis": {"value_pct": number | null, "status": "strong|developing|critical", "explanation": "string"},
    "revenue_by_role_insight": [{"role": "string", "revenue": number, "insight": "string"}]
  },
  "risk_monitoring": {
    "suspicious_employer_behavior": [{"signal": "string", "risk_level": "high|medium|low", "recommended_action": "string"}],
    "discriminatory_job_description_flags": [{"excerpt": "string", "reason": "string", "recommended_rewrite": "string"}],
    "abnormal_account_activity": [{"signal": "string", "risk_level": "high|medium|low", "recommended_action": "string"}]
  },
  "growth_recommendations": {
    "high_demand_industries": [{"industry": "string", "evidence": "string", "priority": "high|medium|low"}],
    "new_course_categories": [{"category": "string", "why_now": "string"}],
    "underserved_talent_segments": [{"segment": "string", "opportunity": "string", "recommended_program": "string"}]
  }
}
No markdown, no prose outside JSON."""

    user_prompt = (
        "Create admin AI insights using this platform snapshot JSON:\n\n"
        f"{req.snapshot.model_dump_json(indent=2)}"
    )

    try:
        raw_result = await ask_ai(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            provider=req.provider,
            model=req.model,
            max_tokens=1200,
            json_mode=True,
            temperature=0.2,
        )
        return json.loads(raw_result)
    except AIServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message)
    except Exception:
        raise HTTPException(status_code=500, detail="AI returned invalid response")
