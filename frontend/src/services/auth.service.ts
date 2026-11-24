import { api } from './api'
import { ApiResponse, User } from '../types'

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  email: string
  password: string
  full_name: string
  phone_number?: string
  role: 'job_seeker' | 'employer'
  company_name?: string
}

export interface AuthResponseData {
  user: User
  access: string
  refresh: string
}

const clearStoredTokens = () => {
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
  sessionStorage.removeItem('access_token')
  sessionStorage.removeItem('refresh_token')
}

const persistTokens = (data: AuthResponseData, remember: boolean) => {
  clearStoredTokens()
  const storage = remember ? localStorage : sessionStorage
  storage.setItem('access_token', data.access)
  storage.setItem('refresh_token', data.refresh)
}

export const authService = {
  async login(payload: LoginPayload, remember: boolean = true): Promise<AuthResponseData> {
    clearStoredTokens()
    const res = await api.post<ApiResponse<AuthResponseData>>('/auth/login/', payload)
    const data = res.data.data
    persistTokens(data, remember)
    return data
  },

  async register(payload: RegisterPayload, remember: boolean = true): Promise<AuthResponseData> {
    clearStoredTokens()
    const res = await api.post<ApiResponse<AuthResponseData>>('/auth/register/', payload)
    const data = res.data.data
    persistTokens(data, remember)
    return data
  },

  async oauthLogin(payload: {
    provider: 'google' | 'linkedin'
    email: string
    full_name?: string
    avatar_url?: string
    role?: 'job_seeker' | 'employer'
  }, remember: boolean = true): Promise<AuthResponseData> {
    clearStoredTokens()
    const res = await api.post<ApiResponse<AuthResponseData>>('/auth/oauth/', payload)
    const data = res.data.data
    persistTokens(data, remember)
    return data
  },

  async getCurrentUser(): Promise<User> {
    const res = await api.get<ApiResponse<User>>('/auth/me/')
    return res.data.data
  },

  async updateMe(payload: { full_name?: string; phone_number?: string }): Promise<User> {
    const res = await api.patch<ApiResponse<User>>('/auth/me/', payload)
    return res.data.data
  },

  async changePassword(payload: { current_password: string; new_password: string }): Promise<{ success: boolean; message: string }> {
    const res = await api.post<{ success: boolean; message: string }>('/auth/change-password/', payload)
    return res.data
  },

  async logout(): Promise<void> {
    const refresh = localStorage.getItem('refresh_token') || sessionStorage.getItem('refresh_token')
    try {
      if (refresh) {
        await api.post('/auth/logout/', { refresh_token: refresh })
      }
    } catch {
      // Ignore error during logout
    } finally {
      clearStoredTokens()
    }
  },
}

