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

export const authService = {
  async login(payload: LoginPayload): Promise<AuthResponseData> {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    const res = await api.post<ApiResponse<AuthResponseData>>('/auth/login/', payload)
    const data = res.data.data
    localStorage.setItem('access_token', data.access)
    localStorage.setItem('refresh_token', data.refresh)
    return data
  },

  async register(payload: RegisterPayload): Promise<AuthResponseData> {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    const res = await api.post<ApiResponse<AuthResponseData>>('/auth/register/', payload)
    const data = res.data.data
    localStorage.setItem('access_token', data.access)
    localStorage.setItem('refresh_token', data.refresh)
    return data
  },

  async oauthLogin(payload: {
    provider: 'google' | 'linkedin'
    email: string
    full_name?: string
    avatar_url?: string
    role?: 'job_seeker' | 'employer'
  }): Promise<AuthResponseData> {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    const res = await api.post<ApiResponse<AuthResponseData>>('/auth/oauth/', payload)
    const data = res.data.data
    localStorage.setItem('access_token', data.access)
    localStorage.setItem('refresh_token', data.refresh)
    return data
  },

  async getCurrentUser(): Promise<User> {
    const res = await api.get<ApiResponse<User>>('/auth/me/')
    return res.data.data
  },

  async logout(): Promise<void> {
    const refresh = localStorage.getItem('refresh_token')
    try {
      if (refresh) {
        await api.post('/auth/logout/', { refresh_token: refresh })
      }
    } catch {
      // Ignore error during logout
    } finally {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
    }
  },
}

