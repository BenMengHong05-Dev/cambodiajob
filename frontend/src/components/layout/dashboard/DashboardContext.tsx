import React, { createContext, useContext, useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../../app/providers'
import {
  DashboardNavItem,
  PortalBadgeConfig,
  ProfileMenuItem,
} from './types'
import { getDashboardConfigForRole } from './navConfig'

export interface DashboardContextValue {
  isCollapsed: boolean
  toggleSidebar: () => void
  setIsCollapsed: (val: boolean) => void
  mobileMenuOpen: boolean
  setMobileMenuOpen: (val: boolean) => void
  navItems: DashboardNavItem[]
  workspaceLabel?: { en: string; km: string }
  portalBadge?: PortalBadgeConfig
  profileMenuItems?: ProfileMenuItem[]
  notificationRole?: 'admin' | 'employer' | 'job_seeker'
  profileSubtitle?: string
  handleLogout: () => Promise<void>
  role?: string
}

const DashboardContext = createContext<DashboardContextValue | null>(null)

export interface DashboardProviderProps {
  role?: string
  navItems?: DashboardNavItem[]
  workspaceLabel?: { en: string; km: string }
  portalBadge?: PortalBadgeConfig
  profileMenuItems?: ProfileMenuItem[]
  notificationRole?: 'admin' | 'employer' | 'job_seeker'
  profileSubtitle?: string
  children: React.ReactNode
}

export const DashboardProvider: React.FC<DashboardProviderProps> = ({
  role,
  navItems: customNavItems,
  workspaceLabel: customWorkspaceLabel,
  portalBadge: customPortalBadge,
  profileMenuItems: customProfileMenuItems,
  notificationRole: customNotificationRole,
  profileSubtitle: customProfileSubtitle,
  children,
}) => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(
    () => localStorage.getItem('dashboard_sidebar_collapsed') === 'true'
  )

  const toggleSidebar = () => {
    setIsCollapsed((prev) => {
      const next = !prev
      localStorage.setItem('dashboard_sidebar_collapsed', String(next))
      return next
    })
  }

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  // Resolve config based on role or active user
  const defaultConfig = useMemo(
    () => getDashboardConfigForRole(role, user),
    [role, user]
  )

  const navItems = customNavItems || defaultConfig.navItems
  const workspaceLabel = customWorkspaceLabel || defaultConfig.workspaceLabel
  const portalBadge = customPortalBadge || defaultConfig.portalBadge
  const profileMenuItems =
    customProfileMenuItems || defaultConfig.profileMenuItems
  const notificationRole =
    customNotificationRole || defaultConfig.notificationRole
  const profileSubtitle =
    customProfileSubtitle || user?.company?.name || user?.email

  const value: DashboardContextValue = {
    isCollapsed,
    toggleSidebar,
    setIsCollapsed,
    mobileMenuOpen,
    setMobileMenuOpen,
    navItems,
    workspaceLabel,
    portalBadge,
    profileMenuItems,
    notificationRole,
    profileSubtitle,
    handleLogout,
    role: role || defaultConfig.role,
  }

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  )
}

/**
 * Hook to access dashboard state anywhere.
 * If used outside DashboardProvider, provides seamless fallback from useAuth() & navConfig.
 */
export const useDashboard = (): DashboardContextValue => {
  const context = useContext(DashboardContext)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(
    () => localStorage.getItem('dashboard_sidebar_collapsed') === 'true'
  )

  const toggleSidebar = () => {
    setIsCollapsed((prev) => {
      const next = !prev
      localStorage.setItem('dashboard_sidebar_collapsed', String(next))
      return next
    })
  }

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  if (context) {
    return context
  }

  // Graceful standalone fallback
  const defaultConfig = getDashboardConfigForRole(undefined, user)

  return {
    isCollapsed,
    toggleSidebar,
    setIsCollapsed,
    mobileMenuOpen,
    setMobileMenuOpen,
    navItems: defaultConfig.navItems,
    workspaceLabel: defaultConfig.workspaceLabel,
    portalBadge: defaultConfig.portalBadge,
    profileMenuItems: defaultConfig.profileMenuItems,
    notificationRole: defaultConfig.notificationRole,
    profileSubtitle: user?.company?.name || user?.email,
    handleLogout,
    role: defaultConfig.role,
  }
}
