import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Menu, X, LogOut, User as UserIcon, KeyRound, Shield } from 'lucide-react'
import { useAuth } from '../../../app/providers'
import { LanguageDropdown } from '../LanguageDropdown'
import { NotificationDropdown } from '../NotificationDropdown'
import { ThemeToggle } from '../ThemeToggle'
import { AccountSettingsDialog } from '../AccountSettingsDialog'
import { getAssetUrl } from '../../../utils/assets'
import { canAccess, getCompanyRoleLabel, getSystemRoleLabel } from '../../../utils/permissions'
import { DashboardNavItem, PortalBadgeConfig, ProfileMenuItem } from './types'
import { useDashboard } from './DashboardContext'

export interface DashboardNavbarProps {
  navItems?: DashboardNavItem[]
  portalBadge?: PortalBadgeConfig
  profileMenuItems?: ProfileMenuItem[]
  notificationRole?: 'admin' | 'employer' | 'job_seeker'
  profileSubtitle?: string
  isCollapsed?: boolean
  onToggleSidebar?: () => void
  onOpenMobile?: () => void
  onLogout?: () => void
}

export const DashboardNavbar: React.FC<DashboardNavbarProps> = ({
  navItems: propNavItems,
  portalBadge: propPortalBadge,
  profileMenuItems: propProfileMenuItems,
  notificationRole: propNotificationRole,
  profileSubtitle: propProfileSubtitle,
  isCollapsed: propIsCollapsed,
  onToggleSidebar: propOnToggleSidebar,
  onOpenMobile: propOnOpenMobile,
  onLogout: propOnLogout,
}) => {
  const context = useDashboard()
  const { user, isSuperAdmin } = useAuth()
  const { i18n } = useTranslation()
  const location = useLocation()
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
  const [accountModalOpen, setAccountModalOpen] = useState(false)
  const isKhmer = i18n.language === 'km'

  const primaryRoleKey =
    user?.id === 1 || user?.roles?.includes('super_admin')
      ? 'super_admin'
      : user?.roles?.[0] || user?.role || 'job_seeker'

  const navItems = propNavItems ?? context.navItems
  const portalBadge = propPortalBadge ?? context.portalBadge
  const profileMenuItems = propProfileMenuItems ?? context.profileMenuItems
  const notificationRole = propNotificationRole ?? context.notificationRole
  const profileSubtitle = propProfileSubtitle ?? context.profileSubtitle
  const isCollapsed = propIsCollapsed ?? context.isCollapsed
  const onToggleSidebar = propOnToggleSidebar ?? context.toggleSidebar
  const onOpenMobile = propOnOpenMobile ?? (() => context.setMobileMenuOpen(true))
  const onLogout = propOnLogout ?? context.handleLogout

  const userAvatar =
    user?.avatar_url || user?.seeker_profile?.avatar_url || user?.company?.logo_url

  // Find currently active nav item to display title
  const currentNav = navItems.find((n) => {
    if (n.isActive) return n.isActive(location.pathname)
    if (n.exact) return location.pathname === n.path
    return location.pathname.startsWith(n.path)
  })

  // Filter accessible profile menu items
  const accessibleMenuItems = (profileMenuItems || []).filter((item) =>
    canAccess(user, {
      role: item.requiredRoles,
      permission: item.permission,
    })
  )

  const defaultRoleInitial = user?.roles?.includes('admin')
    ? 'A'
    : user?.roles?.includes('employer')
    ? 'H'
    : 'U'

  return (
    <header className="sticky top-0 z-30 h-16 glass-topbar bg-white/80 backdrop-blur-2xl border-b border-slate-200/80 px-3.5 sm:px-6 flex items-center justify-between shadow-xs shrink-0">
      <div className="flex items-center space-x-2.5 text-xs font-medium text-slate-500 min-w-0">
        {/* Mobile Hamburger Menu Toggle */}
        <button
          type="button"
          onClick={onOpenMobile}
          className="md:hidden p-2 rounded-xl border border-slate-200/80 bg-white/80 hover:bg-white text-slate-700 hover:text-blue-600 transition shadow-2xs cursor-pointer items-center justify-center shrink-0 active:scale-95"
          title={
            context.mobileMenuOpen
              ? isKhmer
                ? 'បិទមឺនុយ'
                : 'Close Menu'
              : isKhmer
              ? 'បើកមឺនុយ'
              : 'Open Menu'
          }
        >
          {context.mobileMenuOpen ? (
            <X className="w-5 h-5" />
          ) : (
            <Menu className="w-5 h-5" />
          )}
        </button>

        {/* Mobile View Title & Portal Badge */}
        <div className="flex items-center space-x-1.5 md:hidden min-w-0">
          {portalBadge && (
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md shrink-0 ${
                portalBadge.className ||
                'bg-blue-50 text-blue-700 border border-blue-200/70'
              }`}
            >
              {isKhmer ? portalBadge.labelKm : portalBadge.label}
            </span>
          )}
          <span className="font-bold text-slate-800 text-sm truncate">
            {isKhmer
              ? currentNav?.nameKm || 'ផ្ទាំងគ្រប់គ្រង'
              : currentNav?.name || 'Dashboard'}
          </span>
        </div>

        {/* Desktop Sidebar Collapse Toggle */}
        <button
          type="button"
          onClick={onToggleSidebar}
          className="hidden md:flex p-2 rounded-xl border border-slate-200/80 bg-white/70 hover:bg-white text-slate-600 hover:text-blue-600 transition shadow-2xs cursor-pointer items-center justify-center ml-1 active:scale-95"
          title={
            isCollapsed
              ? isKhmer
                ? 'ពង្រីកមឺនុយ'
                : 'Expand Sidebar'
              : isKhmer
              ? 'បង្រួមមឺនុយ'
              : 'Collapse Sidebar'
          }
        >
          {isCollapsed ? (
            <X className="w-4.5 h-4.5" />
          ) : (
            <Menu className="w-4.5 h-4.5" />
          )}
        </button>
        <span className="hidden md:inline font-bold text-slate-800 text-sm">
          {isKhmer
            ? currentNav?.nameKm || 'ផ្ទាំងគ្រប់គ្រង'
            : currentNav?.name || 'Dashboard'}
        </span>
      </div>

      <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
        <NotificationDropdown role={notificationRole} />
        <ThemeToggle />
        <LanguageDropdown />

        {/* Profile Avatar Trigger */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="w-9 h-9 rounded-full flex items-center justify-center transition shadow-2xs cursor-pointer active:scale-95 overflow-hidden"
            title={user?.full_name}
          >
            {userAvatar ? (
              <img
                src={getAssetUrl(userAvatar)}
                alt={user?.full_name || 'User'}
                className="w-full h-full object-cover rounded-full border border-slate-200/80 bg-white"
                onError={(e) => {
                  ;(e.target as HTMLElement).style.display = 'none'
                }}
              />
            ) : (
              <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-500/10 to-indigo-500/10 text-blue-700 font-bold border border-blue-400/30 backdrop-blur-md flex items-center justify-center">
                {user?.full_name?.charAt(0) || defaultRoleInitial}
              </div>
            )}
          </button>

          {profileDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-[9998]"
                onClick={() => setProfileDropdownOpen(false)}
              />
              <div className="absolute right-0 mt-2.5 w-60 rounded-2xl bg-white shadow-2xl border border-slate-200 p-2 z-[9999] animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-2.5 border-b border-slate-100/80 flex items-center space-x-2.5">
                  {userAvatar ? (
                    <div className="w-8 h-8 rounded-full border border-slate-200/80 bg-white flex items-center justify-center shrink-0 shadow-2xs overflow-hidden">
                      <img
                        src={getAssetUrl(userAvatar)}
                        alt={user?.full_name || 'User'}
                        className="w-full h-full object-cover rounded-full"
                      />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                      {user?.full_name?.charAt(0) || defaultRoleInitial}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {user?.full_name}
                    </p>
                    <p className="text-[11px] font-medium text-slate-500 truncate mt-0.5">
                      {profileSubtitle || user?.email}
                    </p>
                    <div className="flex flex-wrap items-center gap-1 mt-1.5">
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200/70">
                        <Shield className="w-2.5 h-2.5" />
                        <span>
                          {isSuperAdmin
                            ? getSystemRoleLabel('super_admin', isKhmer)
                            : getSystemRoleLabel(primaryRoleKey, isKhmer)}
                        </span>
                      </span>
                      {user?.company_member_role && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/70">
                          {getCompanyRoleLabel(user.company_member_role, isKhmer)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {accessibleMenuItems.length > 0 && (
                  <div className="mt-1 space-y-0.5">
                    {accessibleMenuItems.map((item) => {
                      const Icon = item.icon || UserIcon
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center space-x-2 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-white/80 hover:text-blue-600 rounded-xl transition"
                        >
                          <Icon className="w-4 h-4 text-slate-400" />
                          <span>
                            {isKhmer && item.labelKm ? item.labelKm : item.label}
                          </span>
                        </Link>
                      )
                    })}
                  </div>
                )}

                <div className="mt-1 pt-1 border-t border-slate-100/80 space-y-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setProfileDropdownOpen(false)
                      setAccountModalOpen(true)
                    }}
                    className="w-full flex items-center space-x-2 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 rounded-xl transition cursor-pointer"
                  >
                    <KeyRound className="w-4 h-4 text-slate-400" />
                    <span>{isKhmer ? 'គណនី និងសុវត្ថិភាព' : 'Account & Security'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setProfileDropdownOpen(false)
                      onLogout()
                    }}
                    className="w-full flex items-center space-x-2 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-500/10 rounded-xl transition cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>{isKhmer ? 'ចាកចេញ' : 'Sign Out'}</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <AccountSettingsDialog
        isOpen={accountModalOpen}
        onClose={() => setAccountModalOpen(false)}
      />
    </header>
  )
}
