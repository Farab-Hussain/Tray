import json

from fastapi import APIRouter, HTTPException

from models.schemas import (
    ProfileInsightsRequest,
    ResumeGenerateRequest,
    ResumeScoreRequest,
    ResumeValidateRequest,
)
from services.ai_service import AIServiceError, ask_ai

router = APIRouter()


@router.post("/generate-summary")
async def generate_summary(req: ResumeGenerateRequest):
    system = (
        "You are an expert resume writer with 15 years of experience. "
        "Write concise, impactful resume summaries that get interviews. "
        "Rules: 2-3 sentences max, use active voice, include measurable impact hints, "
        "match the tone requested, no cliches like 'dynamic' or 'passionate'."
    )

    user = f"""Write a resume summary for:
- Job Title: {req.job_title}
- Years of Experience: {req.years_experience}
- Key Skills: {', '.join(req.skills)}
- Industry: {req.industry}
- Tone: {req.tone}"""

    try:
        summary = await ask_ai(
            system_prompt=system,
            user_prompt=user,
            provider=req.provider,
            model=req.model,
            max_tokens=200,
        )
        return {"summary": summary.strip()}
    except AIServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message)


@router.post("/validate-field")
async def validate_field(req: ResumeValidateRequest):
    system = (
        "You are a resume expert. Validate resume fields and return ONLY valid JSON. "
        "No markdown, no explanation outside the JSON. "
        "Return: {\"valid\": bool, \"score\": 1-10, \"issues\": [\"issue1\"], "
        "\"suggestion\": \"improved version or empty string\"}"
    )

    user = f"""Validate this resume field:
Field: {req.field_name}
Value: \"{req.field_value}\"
{f'Context (target role): {req.context}' if req.context else ''}"""

    try:
        result = await ask_ai(
            system_prompt=system,
            user_prompt=user,
            provider=req.provider,
            model=req.model,
            json_mode=True,
            max_tokens=300,
        )
        return json.loads(result)
    except AIServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message)
    except Exception:
        raise HTTPException(status_code=500, detail="AI returned invalid JSON")


@router.post("/score")
async def score_resume(req: ResumeScoreRequest):
    system = (
        "You are an ATS (Applicant Tracking System) expert and hiring manager. "
        "Score resumes and return ONLY valid JSON: "
        "{\"overall_score\": 1-100, \"sections\": {\"summary\": 1-10, \"experience\": 1-10, \"skills\": 1-10}, "
        "\"strengths\": [\"str1\", \"str2\"], \"improvements\": [\"imp1\", \"imp2\"], \"ats_friendly\": bool}"
    )

    user = f"""Score this resume{f' for the role: {req.target_job}' if req.target_job else ''}:
{req.resume_text}"""

    try:
        result = await ask_ai(
            system_prompt=system,
            user_prompt=user,
            provider=req.provider,
            model=req.model,
            json_mode=True,
            max_tokens=500,
        )
        return json.loads(result)
    except AIServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message)
    except Exception:
        raise HTTPException(status_code=500, detail="AI returned invalid JSON")


@router.post("/profile-insights")
async def profile_insights(req: ProfileInsightsRequest):
    system = (
        "You are an expert career coach and profile optimization assistant. "
        "Analyze candidate profile data for job readiness and return ONLY valid JSON. "
        "Do not include markdown. "
        "Return this exact shape: "
        "{\"missing_critical_fields\": [\"field\"], "
        "\"suggested_certifications\": [\"cert\"], "
        "\"suggested_skill_tags\": [\"skill\"], "
        "\"suggested_industries\": [\"industry\"], "
        "\"profile_strengths\": [\"strength\"], "
        "\"next_actions\": [\"action\"]}."
    )

    user = f"""Analyze this candidate profile and return recommendations:
- Name: {req.name or 'N/A'}
- Email present: {'yes' if req.email else 'no'}
- Phone present: {'yes' if req.phone else 'no'}
- Location present: {'yes' if req.location else 'no'}
- Target role: {req.target_role or 'not specified'}
- Skills: {', '.join(req.skills) if req.skills else 'none'}
- Certifications: {', '.join(req.certifications) if req.certifications else 'none'}
- Experience entries: {', '.join(req.experience) if req.experience else 'none'}
- Education entries: {', '.join(req.education) if req.education else 'none'}
- Resume text:
{req.resume_text or 'not provided'}

Rules:
1) Keep each list concise (max 6 items).
2) Suggest realistic certifications for the profile and role.
3) Suggested industries should be broad and practical.
4) Missing fields should focus on high-impact profile gaps.
5) Next actions must be concrete and immediately actionable."""

    try:
        result = await ask_ai(
            system_prompt=system,
            user_prompt=user,
            provider=req.provider,
            model=req.model,
            json_mode=True,
            max_tokens=600,
        )
        return json.loads(result)
    except AIServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message)
    except Exception:
        raise HTTPException(status_code=500, detail="AI returned invalid JSON")
