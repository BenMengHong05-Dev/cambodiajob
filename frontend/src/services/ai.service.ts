import { api } from './api'
import { AIChatResponse, ApiResponse, AIMatchedJob } from '../types'

export const aiService = {
  /**
   * Send a query to the AI Agent to find jobs, ask questions, or request charts.
   * Supports Google Gemini API key if provided.
   */
  async chat(
    message: string,
    history?: { sender: string; text: string }[],
    apiKey?: string
  ): Promise<AIChatResponse & { provider?: string }> {
    const res = await api.post<ApiResponse<AIChatResponse & { provider?: string }>>('/ai/chat/', {
      message,
      history: history || [],
      api_key: apiKey || undefined,
    })
    return res.data.data
  },

  /**
   * Get AI agent and Gemini configuration status.
   */
  async getStatus(): Promise<{
    gemini_configured: boolean
    provider: string
    default_model: string
    platform: string
  }> {
    const res = await api.get<ApiResponse<{
      gemini_configured: boolean
      provider: string
      default_model: string
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
