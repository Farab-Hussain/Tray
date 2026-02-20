import json

from fastapi import APIRouter, HTTPException

from models.schemas import JobPostExtractSkillsRequest, JobPostImproveRequest, JobPostRequest
from services.ai_service import AIServiceError, ask_ai

router = APIRouter()


@router.post("/generate")
async def generate_job_post(req: JobPostRequest):
    system = (
        "You are an expert HR copywriter and talent acquisition specialist. "
        "Write compelling, inclusive job posts that attract top candidates. "
        "Structure: 1) Role Overview (2-3 sentences), 2) What You'll Do (4-6 bullets), "
        "3) What We're Looking For (required + nice-to-have), 4) What We Offer, "
        "5) Short company culture note. Use gender-neutral language always."
    )

    user = f"""Create a complete job posting:
- Role: {req.role_title} ({req.experience_level} level)
- Company: {req.company_name}
{f'- About Company: {req.company_description}' if req.company_description else ''}
- Location: {req.location} | Type: {req.job_type}
- Required Skills: {', '.join(req.required_skills)}
{f'- Nice to Have: {", ".join(req.nice_to_have)}' if req.nice_to_have else ''}
{f'- Key Responsibilities: {", ".join(req.responsibilities)}' if req.responsibilities else ''}
{f'- Salary: {req.salary_range}' if req.salary_range else ''}
- Writing Tone: {req.tone}"""

    try:
        post = await ask_ai(
            system_prompt=system,
            user_prompt=user,
            provider=req.provider,
            model=req.model,
            max_tokens=900,
        )
        return {"job_post": post.strip(), "word_count": len(post.split())}
    except AIServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message)


@router.post("/improve")
async def improve_job_post(req: JobPostImproveRequest):
    improvement_instructions = {
        "clarity": "Make it clearer and easier to understand. Remove jargon.",
        "tone": "Make the tone more engaging and human, less corporate.",
        "inclusivity": "Make it fully gender-neutral and inclusive for all backgrounds.",
        "length": "Tighten it up. Remove filler and keep only essential information.",
        "seo": "Optimize for job board SEO without keyword stuffing.",
    }

    instruction = improvement_instructions.get(req.improvement_type, "Improve the overall quality.")
    system = f"You are an expert job post editor. {instruction} Return only the improved post."
    user = f"Improve this job post:\n\n{req.existing_post}"

    try:
        improved = await ask_ai(
            system_prompt=system,
            user_prompt=user,
            provider=req.provider,
            model=req.model,
            max_tokens=900,
        )
        return {"improved_post": improved.strip()}
    except AIServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message)


@router.post("/extract-skills")
async def extract_skills_from_post(req: JobPostExtractSkillsRequest):
    system = (
        "Extract skills from a job post. Return ONLY valid JSON: "
        "{\"required_skills\": [\"skill1\"], \"nice_to_have\": [\"skill1\"], "
        "\"experience_years\": \"X-Y years or null\", \"key_responsibilities\": [\"resp1\"]}"
    )

    try:
        result = await ask_ai(
            system_prompt=system,
            user_prompt=req.job_description,
            provider=req.provider,
            model=req.model,
            json_mode=True,
            max_tokens=400,
        )
        return json.loads(result)
    except AIServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message)
    except Exception:
        raise HTTPException(status_code=500, detail="AI returned invalid JSON")
