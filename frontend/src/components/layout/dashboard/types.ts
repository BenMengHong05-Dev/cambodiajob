import React from 'react'
import { UserRole } from '../../../types'

export interface DashboardNavItem {
  name: string
  nameKm: string
  path: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string | number
  permission?: string
  requiredRoles?: UserRole[]
  exact?: boolean
  isActive?: (pathname: string) => boolean
}

export interface ProfileMenuItem {
  label: string
  labelKm?: string
  path: string
  icon: React.ComponentType<{ className?: string }>
  permission?: string
  requiredRoles?: UserRole[]
}

export interface PortalBadgeConfig {
  label: string
  labelKm: string
  className?: string
}

export interface DashboardLayoutProps {
  /**
   * Primary role identifier (e.g. 'admin', 'employer', 'job_seeker', or custom role).
   * Automatically resolves navItems, portalBadge, and workspaceLabel if omitted.
   */
  role?: string

  /**
   * Primary role required to access this dashboard.
   * Can be a single role, an array of allowed roles, or omitted if using permissions.
   */
  requiredRole?: UserRole | UserRole[]

  /**
   * Granular permission(s) required to access this dashboard.
   */
  requiredPermission?: string | string[]

  /**
   * Optional custom navigation links displayed in the sidebar (falls back to role default).
   */
  navItems?: DashboardNavItem[]

  /**
   * Workspace section title shown above nav items.
   */
  workspaceLabel?: {
    en: string
    km: string
  }

  /**
   * Portal badge shown next to title in mobile view.
   */
  portalBadge?: PortalBadgeConfig

  /**
   * Links displayed in the top navbar profile dropdown.
   */
  profileMenuItems?: ProfileMenuItem[]

  /**
   * Notification role passed to NotificationDropdown.
   */
  notificationRole?: 'admin' | 'employer' | 'job_seeker'

  /**
   * Primary profile path for avatar click fallback.
   */
  profilePath?: string

  /**
   * Custom subtitle displayed under user name in profile dropdown (e.g. company name).
   */
  profileSubtitle?: string

  /**
   * Optional custom children instead of <Outlet />.
   */
  children?: React.ReactNode
}
