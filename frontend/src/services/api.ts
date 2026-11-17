import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1'

// Tokens can live in localStorage ("remember me") or sessionStorage (this session only).
export const getStoredToken = (key: string): string | null =>
  localStorage.getItem(key) || sessionStorage.getItem(key)

const clearStoredTokens = () => {
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
  sessionStorage.removeItem('access_token')
  sessionStorage.removeItem('refresh_token')
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to attach JWT access token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Never attach Authorization header to public auth endpoints
    const isPublicAuthUrl =
      config.url?.includes('/auth/login') ||
      config.url?.includes('/auth/register') ||
      config.url?.includes('/auth/refresh') ||
      config.url?.includes('/auth/oauth')

    if (!isPublicAuthUrl) {
      const token = getStoredToken('access_token')
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`
      }
    } else if (config.headers && config.headers.Authorization) {
      delete config.headers.Authorization
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor to automatically refresh expired token
let isRefreshing = false
let failedQueue: Array<{
  resolve: (value?: unknown) => void
  reject: (reason?: unknown) => void
}> = []

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    // If 401 Unauthorized and not already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (originalRequest.url?.includes('/auth/login') || originalRequest.url?.includes('/auth/refresh')) {
        return Promise.reject(error)
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`
            }
            return api(originalRequest)
          })
          .catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      const refreshToken = getStoredToken('refresh_token')
      if (!refreshToken) {
        isRefreshing = false
        clearStoredTokens()
        window.dispatchEvent(new Event('auth:logout'))
        return Promise.reject(error)
      }

      // Keep the refreshed tokens in the same storage the user originally chose.
      const tokenStorage = localStorage.getItem('refresh_token') ? localStorage : sessionStorage

      try {
        const refreshResponse = await axios.post(`${API_BASE_URL}/auth/refresh/`, {
          refresh_token: refreshToken,
        })

        const { access, refresh } = refreshResponse.data.data
        tokenStorage.setItem('access_token', access)
        if (refresh) {
          tokenStorage.setItem('refresh_token', refresh)
        }

        processQueue(null, access)
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${access}`
        }
        return api(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        clearStoredTokens()
        window.dispatchEvent(new Event('auth:logout'))
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

