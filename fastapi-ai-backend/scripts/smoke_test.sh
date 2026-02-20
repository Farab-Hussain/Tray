#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-http://127.0.0.1:8000}"

echo "[1/7] GET /health"
curl -sS "$BASE_URL/health" | sed 's/^/  /'

echo "\n[2/7] POST /api/chat/message"
curl -sS -X POST "$BASE_URL/api/chat/message" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "openai",
    "message": "hi gpt",
    "history": [],
    "user_context": {"name": "SmokeTest", "plan": "free"}
  }' | sed 's/^/  /'

echo "\n[3/7] POST /api/resume/generate-summary"
curl -sS -X POST "$BASE_URL/api/resume/generate-summary" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "openai",
    "job_title": "Frontend Developer",
    "years_experience": 3,
    "skills": ["React Native", "TypeScript"]
  }' | sed 's/^/  /'

echo "\n[4/7] POST /api/jobpost/generate"
curl -sS -X POST "$BASE_URL/api/jobpost/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "openai",
    "role_title": "Backend Engineer",
    "company_name": "Tray",
    "location": "Remote",
    "job_type": "full-time",
    "experience_level": "mid",
    "required_skills": ["Python", "FastAPI"]
  }' | sed 's/^/  /'

echo "\n[5/7] POST /api/jobpost/extract-skills"
curl -sS -X POST "$BASE_URL/api/jobpost/extract-skills" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "openai",
    "job_description": "We need a Python developer with FastAPI and SQL experience"
  }' | sed 's/^/  /'

echo "\n[6/7] POST /api/autocomplete/suggest"
curl -sS -X POST "$BASE_URL/api/autocomplete/suggest" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "openai",
    "field_type": "skill",
    "partial_text": "py",
    "context": {"industry": "technology"},
    "max_suggestions": 4
  }' | sed 's/^/  /'

echo "\n[7/7] POST /api/resume/profile-insights"
curl -sS -X POST "$BASE_URL/api/resume/profile-insights" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "openai",
    "name": "Alex Johnson",
    "email": "alex@example.com",
    "phone": "",
    "location": "Austin, TX",
    "skills": ["React Native", "JavaScript"],
    "certifications": [],
    "experience": ["Frontend Developer at Acme (2021-2024)"],
    "education": ["BSc Computer Science - State University"],
    "target_role": "Frontend Developer"
  }' | sed 's/^/  /'

echo "\nSmoke test completed."
