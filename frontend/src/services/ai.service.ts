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
}
