import { api } from './api'
import { AIChatResponse, ApiResponse, AIMatchedJob } from '../types'

export const aiService = {
  /**
   * Send a query to the AI Agent to find jobs, ask questions, or request charts.
   * Supports Google Gemini, OpenAI / ChatGPT, DeepSeek, or any custom API key.
   */
  async chat(
    message: string,
    history?: { sender: string; text: string }[],
    apiKey?: string,
    provider?: string,
    model?: string,
    baseUrl?: string
  ): Promise<AIChatResponse & { provider?: string; model?: string }> {
    const res = await api.post<ApiResponse<AIChatResponse & { provider?: string; model?: string }>>('/ai/chat/', {
      message,
      history: history || [],
      api_key: apiKey || undefined,
      provider: provider || undefined,
      model: model || undefined,
      base_url: baseUrl || undefined,
    })
    return res.data.data
  },

  /**
   * Get Universal AI gateway and provider configuration status.
   */
  async getStatus(): Promise<{
    ai_configured?: boolean
    gemini_configured: boolean
    provider: string
    model?: string
    default_model?: string
    supported_providers?: string[]
    platform: string
  }> {
    const res = await api.get<ApiResponse<{
      ai_configured?: boolean
      gemini_configured: boolean
      provider: string
      model?: string
      default_model?: string
      supported_providers?: string[]
      platform: string
    }>>('/ai/status/')
    return res.data.data
  },

  /**
   * Fetch personalized AI-matched jobs for the logged-in seeker.
   */
  async getProfileMatches(): Promise<{
    matched_jobs: AIMatchedJob[]
    skills_analyzed: string[]
    total: number
  }> {
    const res = await api.get<ApiResponse<{
      matched_jobs: AIMatchedJob[]
      skills_analyzed: string[]
      total: number
    }>>('/ai/profile-match/')
    return res.data.data
  },

  /**
   * Fetch live Cambodia job market salary distribution & skill demand.
   */
  async getMarketChart(): Promise<any> {
    const res = await api.get<ApiResponse<any>>('/ai/market-chart/')
    return res.data.data
  },

  /**
   * Generate an intelligent, personalized Cover Letter tailored to a vacancy.
   */
  async generateCoverLetter(payload: {
    job_title: string
    company_name: string
    job_description?: string
    candidate_name?: string
    candidate_skills?: string[]
    experience_summary?: string
    is_khmer?: boolean
    api_key?: string
  }): Promise<string> {
    const res = await api.post<ApiResponse<{ cover_letter: string }>>(
      '/ai/generate-cover-letter/',
      payload
    )
    return res.data.data.cover_letter
  },

  /**
   * AI-powered Job Creation: generates complete job specifications automatically
   * from prompt/title including bilingual English & Khmer titles, descriptions,
   * requirements, salary estimates, category, and matched skills.
   */
  async generateJob(payload: {
    prompt: string
    industry?: string
    experience_level?: string
    workplace_type?: string
  }): Promise<{
    title: string
    title_km?: string
    category_id?: number
    employment_type?: string
    workplace_type?: string
    experience_level?: string
    education_level?: string
    province?: string
    salary_min?: number
    salary_max?: number
    salary_currency?: 'USD' | 'KHR'
    vacancies_count?: number
    description: string
    description_km?: string
    requirements: string
    recommended_skills?: string[]
    skill_ids?: number[]
  }> {
    const res = await api.post<ApiResponse<any>>('/ai/generate-job/', payload)
    return res.data.data
  },
}
