import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Currency, SiteSettings } from '../types'
import { authService } from '../services/auth.service'
import { adminService } from '../services/admin.service'
import { useTranslation } from 'react-i18next'
import { ToastProvider, useToast } from '../components/ui/Toast'
import { getAssetUrl } from '../utils/assets'
import {
  hasPermission as utilHasPermission,
  hasRole as utilHasRole,
  canAccess as utilCanAccess,
  getEffectivePermissions,
} from '../utils/permissions'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  role: 'job_seeker' | 'employer' | 'admin' | null
  isJobSeeker: boolean
  isEmployer: boolean
  isAdmin: boolean
  isSuperAdmin: boolean
  dashboardPath: string
  permissions: string[]
  hasPermission: (permission: string | string[]) => boolean
  hasRole: (role: string | string[]) => boolean
  canAccess: (criteria: { requiredRoles?: string[] | string; requiredPermission?: string | string[] }) => boolean
  login: (email: string, pass: string, remember?: boolean) => Promise<User>
  register: (payload: any, remember?: boolean) => Promise<User>
  oauthLogin: (payload: {
    provider: 'google' | 'linkedin'
    email: string
    full_name?: string
    avatar_url?: string
    role?: 'job_seeker' | 'employer'
  }, remember?: boolean) => Promise<User>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

interface PreferencesContextType {
  currency: Currency
  setCurrency: (c: Currency) => void
  language: string
  setLanguage: (lang: string) => void
  theme: 'light' | 'dark'
  setTheme: (theme: 'light' | 'dark') => void
  toggleTheme: () => void
}

export interface SiteSettingsContextType {
  settings: SiteSettings | null
  isLoading: boolean
  refreshSettings: () => Promise<void>
  updateLocalSettings: (newSettings: SiteSettings) => void
  siteName: string
  siteTitle: string
  siteSubtitle: string
  siteDescription: string
  logoUrl?: string | null
  faviconUrl?: string | null
  heroTitle: string
  heroSubtitle: string
  heroBadgeText?: string | null
  contactEmail: string
  contactPhone: string
  contactAddress: string
  footerText: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)
const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined)
const SiteSettingsContext = createContext<SiteSettingsContextType | undefined>(undefined)

export const Providers: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const { i18n } = useTranslation()

  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null)
  const [isSettingsLoading, setIsSettingsLoading] = useState<boolean>(true)

  const refreshSettings = async () => {
    try {
      const data = await adminService.getPublicSettings()
      if (data) {
        setSiteSettings(data)
      }
    } catch (err) {
      console.warn('Failed to fetch public site settings:', err)
    } finally {
      setIsSettingsLoading(false)
    }
  }

  const updateLocalSettings = (newSettings: SiteSettings) => {
    setSiteSettings(newSettings)
  }

  useEffect(() => {
    refreshSettings()
  }, [])

  const [currency, setCurrencyState] = useState<Currency>(() => {
    return (localStorage.getItem('app_currency') as Currency) || 'USD'
  })

  const [language, setLanguageState] = useState<string>(() => {
    return localStorage.getItem('app_language') || 'en'
  })

  const [theme, setThemeState] = useState<'light' | 'dark'>(() => {
    return localStorage.getItem('app_theme') === 'dark' ? 'dark' : 'light'
  })

  const setCurrency = (c: Currency) => {
    setCurrencyState(c)
    localStorage.setItem('app_currency', c)
  }

  const setTheme = (nextTheme: 'light' | 'dark') => {
    setThemeState(nextTheme)
    localStorage.setItem('app_theme', nextTheme)
    document.documentElement.classList.toggle('dark', nextTheme === 'dark')
  }

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
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
    const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token')
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
      sessionStorage.removeItem('access_token')
      sessionStorage.removeItem('refresh_token')
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

  const login = async (email: string, pass: string, remember: boolean = true) => {
    setIsLoading(true)
    try {
      const res = await authService.login({ email, password: pass }, remember)
      setUser(res.user)
      return res.user
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (payload: any, remember: boolean = true) => {
    setIsLoading(true)
    try {
      const res = await authService.register(payload, remember)
      setUser(res.user)
      return res.user
    } finally {
      setIsLoading(false)
    }
  }

  const oauthLogin = async (payload: {
    provider: 'google' | 'linkedin'
    email: string
    full_name?: string
    avatar_url?: string
    role?: 'job_seeker' | 'employer'
  }, remember: boolean = true) => {
    setIsLoading(true)
    try {
      const res = await authService.oauthLogin(payload, remember)
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

  // Unified Single-Role Evaluation (supports custom DB roles carrying portal access permissions)
  const role: 'job_seeker' | 'employer' | 'admin' | null = user
    ? user.id === 1 ||
      user.roles?.includes('super_admin') ||
      user.roles?.includes('admin') ||
      (user as any).role === 'admin' ||
      user.permissions?.includes('admin:access')
      ? 'admin'
      : user.roles?.includes('employer') ||
        (user as any).role === 'employer' ||
        user.permissions?.includes('employer:access')
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

  const isKm = language === 'km'
  const siteName = (isKm ? siteSettings?.site_name_km : siteSettings?.site_name) || siteSettings?.site_name || 'CambodiaJobs'
  const siteTitle = (isKm ? siteSettings?.site_title_km : siteSettings?.site_title) || siteSettings?.site_title || "Cambodia's Leading Job & Recruitment Platform"
  const siteSubtitle = (isKm ? siteSettings?.site_subtitle_km : siteSettings?.site_subtitle) || siteSettings?.site_subtitle || 'Find your dream career or hire top talent across Cambodia'
  const siteDescription = (isKm ? siteSettings?.site_description_km : siteSettings?.site_description) || siteSettings?.site_description || ''
  const heroTitle = (isKm ? siteSettings?.hero_title_km : siteSettings?.hero_title) || siteSettings?.hero_title || 'Discover Verified Career Opportunities in Cambodia'
  const heroSubtitle = (isKm ? siteSettings?.hero_subtitle_km : siteSettings?.hero_subtitle) || siteSettings?.hero_subtitle || 'Connecting talented professionals with top verified companies across Phnom Penh and all 25 provinces.'
  const heroBadgeText = (isKm ? siteSettings?.hero_badge_text_km : siteSettings?.hero_badge_text) || siteSettings?.hero_badge_text || '🇰🇭 #1 Job Platform in Cambodia'
  const contactEmail = siteSettings?.contact_email || 'support@cambodiajobs.kh'
  const contactPhone = siteSettings?.contact_phone || '+855 23 999 888'
  const contactAddress = (isKm ? siteSettings?.contact_address_km : siteSettings?.contact_address) || siteSettings?.contact_address || 'Phnom Penh, Cambodia'
  const footerText = (isKm ? siteSettings?.footer_text_km : siteSettings?.footer_text) || siteSettings?.footer_text || 'Connecting ambitious professionals with reputable employers across Cambodia since 2026.'
  const logoUrl = siteSettings?.logo_url ? getAssetUrl(siteSettings.logo_url) : null
  const faviconUrl = siteSettings?.favicon_url ? getAssetUrl(siteSettings.favicon_url) : null

  // Update document title and favicon dynamically
  useEffect(() => {
    if (siteTitle) {
      if (siteName && siteTitle.toLowerCase().includes(siteName.toLowerCase())) {
        document.title = siteTitle
      } else if (siteName) {
        document.title = `${siteName} | ${siteTitle}`
      } else {
        document.title = siteTitle
      }
    } else if (siteName) {
      document.title = siteName
    }
    const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement
    if (link) {
      link.href = faviconUrl || '/favicon.svg?v=2'
    }
  }, [siteName, siteTitle, faviconUrl])

  return (
    <PreferencesContext.Provider value={{ currency, setCurrency, language, setLanguage, theme, setTheme, toggleTheme }}>
      <SiteSettingsContext.Provider
        value={{
          settings: siteSettings,
          isLoading: isSettingsLoading,
          refreshSettings,
          updateLocalSettings,
          siteName,
          siteTitle,
          siteSubtitle,
          siteDescription,
          logoUrl,
          faviconUrl,
          heroTitle,
          heroSubtitle,
          heroBadgeText,
          contactEmail,
          contactPhone,
          contactAddress,
          footerText,
        }}
      >
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
            permissions: getEffectivePermissions(user),
            hasPermission: (perm: string | string[]) => utilHasPermission(user, perm),
            hasRole: (r: string | string[]) => utilHasRole(user, r),
            canAccess: (criteria: { requiredRoles?: string[] | string; requiredPermission?: string | string[] }) =>
              utilCanAccess(user, criteria),
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
      </SiteSettingsContext.Provider>
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

export const useSiteSettings = () => {
  const context = useContext(SiteSettingsContext)
  if (!context) throw new Error('useSiteSettings must be used within Providers')
  return context
}

export { useToast }

