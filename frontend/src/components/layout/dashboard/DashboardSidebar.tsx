import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Briefcase, ExternalLink, LogOut, X } from 'lucide-react'
import { useAuth, useSiteSettings } from '../../../app/providers'
import { canAccess } from '../../../utils/permissions'
import { DashboardNavItem } from './types'
import { useDashboard } from './DashboardContext'

export interface DashboardSidebarProps {
  navItems?: DashboardNavItem[]
  workspaceLabel?: {
    en: string
    km: string
  }
  isCollapsed?: boolean
  mobileMenuOpen?: boolean
  onCloseMobile?: () => void
  onLogout?: () => void
}

export const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
  navItems: propNavItems,
  workspaceLabel: propWorkspaceLabel,
  isCollapsed: propIsCollapsed,
  mobileMenuOpen: propMobileMenuOpen,
  onCloseMobile: propOnCloseMobile,
  onLogout: propOnLogout,
}) => {
  const context = useDashboard()
  const { user } = useAuth()
  const { siteName, logoUrl } = useSiteSettings()
  const { i18n } = useTranslation()
  const location = useLocation()
  const isKhmer = i18n.language === 'km'

  const isCollapsed = propIsCollapsed ?? context.isCollapsed
  const mobileMenuOpen = propMobileMenuOpen ?? context.mobileMenuOpen
  const onCloseMobile = propOnCloseMobile ?? (() => context.setMobileMenuOpen(false))
  const onLogout = propOnLogout ?? context.handleLogout
  const workspaceLabel = propWorkspaceLabel ?? context.workspaceLabel
  const rawNavItems = propNavItems ?? context.navItems

  // Filter items by user role and permissions
  const accessibleNavItems = rawNavItems.filter((item) =>
    canAccess(user, {
      role: item.requiredRoles,
      permission: item.permission,
    })
  )

  const isNavActive = (item: DashboardNavItem) => {
    if (item.isActive) {
      return item.isActive(location.pathname)
    }
    if (item.exact) {
      return location.pathname === item.path
    }
    return location.pathname.startsWith(item.path)
  }

  return (
    <aside
      className={`fixed md:sticky top-0 z-50 md:z-40 inset-y-0 left-0 ${
        isCollapsed ? 'md:w-[56px]' : 'md:w-64'
      } w-72 glass-sidebar bg-white/95 md:bg-white/75 backdrop-blur-2xl border-r border-slate-200/80 flex flex-col justify-between shrink-0 shadow-2xl md:shadow-[4px_0_30px_rgba(15,23,42,0.03)] transition-transform md:transition-all duration-300 h-screen overflow-x-hidden ${
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}
    >
      {/* Sidebar Brand Header */}
      <div
        className={`h-16 flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 bg-white/40 dark:bg-slate-950/90 backdrop-blur-md shrink-0 transition-all ${
          isCollapsed ? 'justify-center px-1' : 'px-5'
        }`}
      >
        {!isCollapsed ? (
          <Link to="/" className="flex items-center space-x-3 text-left flex-1 min-w-0 group">
            {logoUrl ? (
              <div className="w-9 h-9 rounded-xl bg-white border border-slate-200/80 flex items-center justify-center p-1 shrink-0 shadow-2xs group-hover:scale-105 transition-transform overflow-hidden">
                <img
                  src={logoUrl}
                  alt={siteName}
                  className="w-full h-full object-contain"
                />
              </div>
            ) : (
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-500/20 shrink-0 group-hover:scale-105 transition-transform">
                <Briefcase className="w-4 h-4" />
              </div>
            )}
            <div className="text-left flex-1 min-w-0">
              <span className="text-base font-bold tracking-tight text-slate-900 block leading-tight truncate">
                {siteName}
              </span>
            </div>
          </Link>
        ) : (
          <Link
            to="/"
            className="w-9 h-9 rounded-xl flex items-center justify-center font-bold group hover:scale-105 transition-transform"
            title={siteName}
          >
            {logoUrl ? (
              <div className="w-9 h-9 rounded-xl bg-white border border-slate-200/80 flex items-center justify-center p-1 shadow-2xs group-hover:scale-105 transition-transform overflow-hidden">
                <img
                  src={logoUrl}
                  alt={siteName}
                  className="w-full h-full object-contain"
                />
              </div>
            ) : (
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-500/20">
                <Briefcase className="w-4 h-4" />
              </div>
            )}
          </Link>
        )}

        {/* Mobile Close Button */}
        <button
          type="button"
          onClick={onCloseMobile}
          className="md:hidden p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100/80 rounded-xl transition cursor-pointer"
          title={isKhmer ? 'បិទ' : 'Close'}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Links */}
      <div className={`flex flex-col flex-1 overflow-y-auto ${isCollapsed ? 'p-1.5' : 'p-3.5'}`}>
        <nav className="space-y-1.5 text-left">
          {!isCollapsed && workspaceLabel && (
            <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400/90 block mb-2 text-left">
              {isKhmer ? workspaceLabel.km : workspaceLabel.en}
            </span>
          )}
          {accessibleNavItems.map((item) => {
            const Icon = item.icon
            const active = isNavActive(item)

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onCloseMobile}
                title={isCollapsed ? (isKhmer ? item.nameKm : item.name) : undefined}
                className={`group flex items-center rounded-xl text-xs transition-all duration-150 ${
                  isCollapsed
                    ? 'justify-center w-10 h-10 mx-auto'
                    : 'space-x-3 px-3.5 py-2.5 text-left'
                } ${
                  active
                    ? 'bg-blue-600 text-white font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    active ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'
                  }`}
                />
                {!isCollapsed && (
                  <span className="flex-1 text-left truncate">
                    {isKhmer ? item.nameKm : item.name}
                  </span>
                )}
                {!isCollapsed && item.badge !== undefined && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 shrink-0">
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Footer Sidebar actions */}
      <div
        className={`border-t border-slate-200/80 dark:border-slate-800 bg-white/40 dark:bg-slate-950/90 backdrop-blur-md space-y-1 text-left shrink-0 ${
          isCollapsed ? 'p-1.5' : 'p-3'
        }`}
      >
        {/* Public Website Link */}
        <Link
          to="/"
          onClick={onCloseMobile}
          title={isCollapsed ? (isKhmer ? 'ត្រឡប់ទៅគេហទំព័រ' : 'Go to Website') : undefined}
          className={`w-full flex items-center rounded-xl text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all ${
            isCollapsed ? 'justify-center w-10 h-10 mx-auto' : 'space-x-2.5 px-3 py-2 text-left'
          }`}
        >
          <ExternalLink className="w-4 h-4 shrink-0 text-slate-400" />
          {!isCollapsed && (
            <span className="flex-1 text-left">
              {isKhmer ? 'មើលគេហទំព័រការងារ' : 'Public Website'}
            </span>
          )}
        </Link>

        {/* Sign Out */}
        <button
          type="button"
          onClick={onLogout}
          title={isCollapsed ? (isKhmer ? 'ចាកចេញ' : 'Sign Out') : undefined}
          className={`w-full flex items-center rounded-xl text-xs font-medium text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-all cursor-pointer ${
            isCollapsed ? 'justify-center w-10 h-10 mx-auto' : 'space-x-2.5 px-3 py-2 text-left'
          }`}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!isCollapsed && (
            <span className="flex-1 text-left">{isKhmer ? 'ចាកចេញ' : 'Sign Out'}</span>
          )}
        </button>
      </div>
    </aside>
  )
}
