import axios from 'axios';
import { API_URL, FASTAPI_AI_PROVIDER, FASTAPI_AI_URL } from '@env';

export type AIProvider = 'openai' | 'claude';

const normalizeBaseUrl = (url?: string) => (url || '').trim().replace(/\/+$/, '');
const aiBaseUrl = normalizeBaseUrl(FASTAPI_AI_URL);

const getAIBaseUrlOrThrow = () => {
  if (!aiBaseUrl) {
    throw new Error(
      'FASTAPI_AI_URL is missing. Set FASTAPI_AI_URL in app/.env to your FastAPI server URL.'
    );
  }
  return aiBaseUrl;
};

const aiApi = axios.create({
  // Keep instance creation stable; enforce URL presence per request.
  baseURL: aiBaseUrl || normalizeBaseUrl(API_URL),
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

const getProvider = (provider?: AIProvider): AIProvider => {
  if (provider) return provider;
  if (FASTAPI_AI_PROVIDER === 'claude') return 'claude';
  return 'openai';
};

const aiPost = async <T = any>(path: string, payload: Record<string, any>) => {
  const baseUrl = getAIBaseUrlOrThrow();
  try {
    const response = await aiApi.post(path, payload, { baseURL: baseUrl });
    return response.data as T;
  } catch (err: any) {
    const status = err?.response?.status;
    if (status === 404) {
      throw new Error(
        `FastAPI route not found (404) at ${baseUrl}${path}. Check FASTAPI_AI_URL and FastAPI server startup.`
      );
    }
    throw err;
  }
};

const aiGet = async <T = any>(path: string) => {
  const baseUrl = getAIBaseUrlOrThrow();
  const response = await aiApi.get(path, { baseURL: baseUrl });
  return response.data as T;
};

export const AIService = {
  async health() {
    return aiGet('/health');
  },

  async generateResumeSummary(payload: {
    job_title: string;
    years_experience: number;
    skills: string[];
    industry?: string;
    tone?: string;
    provider?: AIProvider;
    model?: string;
  }) {
    return aiPost('/api/resume/generate-summary', {
      ...payload,
      provider: getProvider(payload.provider),
    });
  },

  async validateResumeField(payload: {
    field_name: string;
    field_value: string;
    context?: string;
    provider?: AIProvider;
    model?: string;
  }) {
    return aiPost('/api/resume/validate-field', {
      ...payload,
      provider: getProvider(payload.provider),
    });
  },

  async scoreResume(payload: {
    resume_text: string;
    target_job?: string;
    provider?: AIProvider;
    model?: string;
  }) {
    return aiPost('/api/resume/score', {
      ...payload,
      provider: getProvider(payload.provider),
    });
  },

  async profileInsights(payload: {
    name?: string;
    email?: string;
    phone?: string;
    location?: string;
    skills?: string[];
    certifications?: string[];
    experience?: string[];
    education?: string[];
    target_role?: string;
    resume_text?: string;
    provider?: AIProvider;
    model?: string;
  }) {
    return aiPost('/api/resume/profile-insights', {
      ...payload,
      provider: getProvider(payload.provider),
    });
  },

  async generateJobPost(payload: {
    role_title: string;
    company_name: string;
    company_description?: string;
    location: string;
    job_type: string;
    experience_level: string;
    required_skills: string[];
    nice_to_have?: string[];
    responsibilities?: string[];
    salary_range?: string;
    tone?: string;
    provider?: AIProvider;
    model?: string;
  }) {
    return aiPost('/api/jobpost/generate', {
      ...payload,
      provider: getProvider(payload.provider),
    });
  },

  async improveJobPost(payload: {
    existing_post: string;
    improvement_type: string;
    provider?: AIProvider;
    model?: string;
  }) {
    return aiPost('/api/jobpost/improve', {
      ...payload,
      provider: getProvider(payload.provider),
    });
  },

  async extractJobSkills(payload: {
    job_description: string;
    provider?: AIProvider;
    model?: string;
  }) {
    return aiPost('/api/jobpost/extract-skills', {
      ...payload,
      provider: getProvider(payload.provider),
    });
  },

  async chatbotMessage(payload: {
    message: string;
    history?: Array<{ role: 'user' | 'assistant'; content: string }>;
    user_context?: Record<string, string>;
    provider?: AIProvider;
    model?: string;
  }) {
    return aiPost('/api/chat/message', {
      ...payload,
      provider: getProvider(payload.provider),
    });
  },

  async autocomplete(payload: {
    field_type: string;
    partial_text: string;
    context?: Record<string, string>;
    max_suggestions?: number;
    provider?: AIProvider;
    model?: string;
  }) {
    return aiPost('/api/autocomplete/suggest', {
      ...payload,
      provider: getProvider(payload.provider),
    });
  },

  async generateGeneric(payload: {
    system_prompt: string;
    user_prompt: string;
    max_tokens?: number;
    json_mode?: boolean;
    provider?: AIProvider;
    model?: string;
  }) {
    return aiPost('/api/ai/generate', {
      ...payload,
      provider: getProvider(payload.provider),
    });
  },
};
