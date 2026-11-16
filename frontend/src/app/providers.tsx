import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Currency } from '../types'
import { authService } from '../services/auth.service'
import { useTranslation } from 'react-i18next'
import { ToastProvider, useToast } from '../components/ui/Toast'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  role: 'job_seeker' | 'employer' | 'admin' | null
  isJobSeeker: boolean
  isEmployer: boolean
  isAdmin: boolean
  isSuperAdmin: boolean
  dashboardPath: string
  login: (email: string, pass: string) => Promise<User>
  register: (payload: any) => Promise<User>
  oauthLogin: (payload: {
    provider: 'google' | 'linkedin' | 'telegram'
    email: string
    full_name?: string
    avatar_url?: string
    role?: 'job_seeker' | 'employer'
  }) => Promise<User>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

export type ThemeMode = 'light' | 'dark'

interface PreferencesContextType {
  currency: Currency
  setCurrency: (c: Currency) => void
  language: string
  setLanguage: (lang: string) => void
  theme: ThemeMode
  setTheme: (t: ThemeMode) => void
  toggleTheme: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)
const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined)

export const Providers: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const { i18n } = useTranslation()

  const [currency, setCurrencyState] = useState<Currency>(() => {
    return (localStorage.getItem('app_currency') as Currency) || 'USD'
  })

  const [language, setLanguageState] = useState<string>(() => {
    return localStorage.getItem('app_language') || 'en'
  })

  const [theme, setThemeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('app_theme') as ThemeMode
    if (saved === 'dark' || saved === 'light') return saved
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark'
    }
    return 'light'
  })

  const setCurrency = (c: Currency) => {
    setCurrencyState(c)
    localStorage.setItem('app_currency', c)
  }

  const setTheme = (t: ThemeMode) => {
    setThemeState(t)
    localStorage.setItem('app_theme', t)
    if (t === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [theme])

  const setLanguage = (lang: string) => {
    setLanguageState(lang)
    i18n.changeLanguage(lang)
    localStorage.setItem('app_language', lang)
    document.documentElement.lang = lang
    if (lang === 'km') {
      document.documentElement.classList.add('khmer-font')
    } else {
      document.documentElement.classList.remove('khmer-font')
    }
  }

  useEffect(() => {
    document.documentElement.lang = language
    if (language === 'km') {
      document.documentElement.classList.add('khmer-font')
    } else {
      document.documentElement.classList.remove('khmer-font')
    }
  }, [language])

  const refreshUser = async () => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      setUser(null)
      setIsLoading(false)
      return
    }
    try {
      const u = await authService.getCurrentUser()
      setUser(u)
    } catch {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    refreshUser()

    const handleLogoutEvent = () => {
      setUser(null)
    }
    window.addEventListener('auth:logout', handleLogoutEvent)
    return () => window.removeEventListener('auth:logout', handleLogoutEvent)
  }, [])

  const login = async (email: string, pass: string) => {
    setIsLoading(true)
    try {
      const res = await authService.login({ email, password: pass })
      setUser(res.user)
      return res.user
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (payload: any) => {
    setIsLoading(true)
    try {
      const res = await authService.register(payload)
      setUser(res.user)
      return res.user
    } finally {
      setIsLoading(false)
    }
  }

  const oauthLogin = async (payload: {
    provider: 'google' | 'linkedin' | 'telegram'
    email: string
    full_name?: string
    avatar_url?: string
    role?: 'job_seeker' | 'employer'
  }) => {
    setIsLoading(true)
    try {
      const res = await authService.oauthLogin(payload)
      setUser(res.user)
      return res.user
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    await authService.logout()
    setUser(null)
  }

  // Unified Single-Role Evaluation
  const role: 'job_seeker' | 'employer' | 'admin' | null = user
    ? user.id === 1 || user.roles?.includes('admin') || (user as any).role === 'admin'
      ? 'admin'
      : user.roles?.includes('employer') || (user as any).role === 'employer'
      ? 'employer'
      : 'job_seeker'
    : null

  const isJobSeeker = role === 'job_seeker'
  const isEmployer = role === 'employer'
  const isAdmin = role === 'admin'
  const isSuperAdmin = user?.id === 1

  const dashboardPath = isAdmin
    ? '/admin/dashboard'
    : isEmployer
    ? '/employer/dashboard'
    : '/seeker/dashboard'

  return (
    <PreferencesContext.Provider value={{ currency, setCurrency, language, setLanguage, theme, setTheme, toggleTheme }}>
      <AuthContext.Provider
        value={{
          user,
          isLoading,
          role,
          isJobSeeker,
          isEmployer,
          isAdmin,
          isSuperAdmin,
          dashboardPath,
          login,
          register,
          oauthLogin,
          logout,
          refreshUser,
        }}
      >
        <ToastProvider>
          {children}
        </ToastProvider>
      </AuthContext.Provider>
    </PreferencesContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within Providers')
  return context
}

export const usePreferences = () => {
  const context = useContext(PreferencesContext)
  if (!context) throw new Error('usePreferences must be used within Providers')
  return context
}

export { useToast }

