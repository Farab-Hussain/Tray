from typing import Dict, List, Literal, Optional

from pydantic import BaseModel, Field


class AIRequestOptions(BaseModel):
    provider: Optional[Literal["openai", "claude"]] = None
    model: Optional[str] = None


class ResumeGenerateRequest(AIRequestOptions):
    job_title: str
    years_experience: int
    skills: List[str]
    industry: Optional[str] = "technology"
    tone: Optional[str] = "professional"


class ResumeValidateRequest(AIRequestOptions):
    field_name: str
    field_value: str
    context: Optional[str] = None


class ResumeScoreRequest(AIRequestOptions):
    resume_text: str
    target_job: Optional[str] = None


class ProfileInsightsRequest(AIRequestOptions):
    name: Optional[str] = ""
    email: Optional[str] = ""
    phone: Optional[str] = ""
    location: Optional[str] = ""
    skills: List[str] = Field(default_factory=list)
    certifications: List[str] = Field(default_factory=list)
    experience: List[str] = Field(default_factory=list)
    education: List[str] = Field(default_factory=list)
    target_role: Optional[str] = None
    resume_text: Optional[str] = None


class JobPostRequest(AIRequestOptions):
    role_title: str
    company_name: str
    company_description: Optional[str] = None
    location: str
    job_type: str
    experience_level: str
    required_skills: List[str]
    nice_to_have: List[str] = Field(default_factory=list)
    responsibilities: List[str] = Field(default_factory=list)
    salary_range: Optional[str] = None
    tone: Optional[str] = "professional"


class JobPostImproveRequest(AIRequestOptions):
    existing_post: str
    improvement_type: str


class JobPostExtractSkillsRequest(AIRequestOptions):
    job_description: str


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(AIRequestOptions):
    message: str
    history: List[ChatMessage] = Field(default_factory=list)
    user_context: Dict[str, str] = Field(default_factory=dict)


class AutocompleteRequest(AIRequestOptions):
    field_type: str
    partial_text: str
    context: Dict[str, str] = Field(default_factory=dict)
    max_suggestions: int = 4


class GenerateTextRequest(AIRequestOptions):
    system_prompt: str
    user_prompt: str
    max_tokens: int = 800
    json_mode: bool = False


class PlatformAnalyticsSnapshot(BaseModel):
    total_users: int = 0
    active_consultants: int = 0
    total_bookings: int = 0
    completed_bookings: int = 0
    cancelled_bookings: int = 0
    total_revenue: float = 0
    revenue_this_month: float = 0
    bookings_growth_pct: float = 0
    revenue_growth_pct: float = 0
    pending_applications: int = 0
    top_consultants: List[str] = Field(default_factory=list)
    placement_rate_pct: Optional[float] = None
    revenue_by_role: Dict[str, float] = Field(default_factory=dict)
    dropoff_points: List[str] = Field(default_factory=list)
    suspicious_signals: List[str] = Field(default_factory=list)
    recent_job_descriptions: List[str] = Field(default_factory=list)
    abnormal_activity_signals: List[str] = Field(default_factory=list)
    high_demand_industries: List[str] = Field(default_factory=list)
    underserved_segments: List[str] = Field(default_factory=list)


class AdminInsightsRequest(AIRequestOptions):
    snapshot: PlatformAnalyticsSnapshot
