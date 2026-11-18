import React, { useState } from 'react'
import { Outlet, Navigate, Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth, useSiteSettings } from '../app/providers'
import { LanguageDropdown } from '../components/layout/LanguageDropdown'
import { NotificationDropdown } from '../components/layout/NotificationDropdown'
import { AIAgentFloatingButton } from '../components/ai/AIAgentFloatingButton'
import { getAssetUrl } from '../utils/assets'
import {
  Shield,
  Users,
  Building,
  Briefcase,
  FileSearch,
  LogOut,
  ChevronRight,
  Menu,
  X,
  LayoutDashboard,
  Layers,
  ExternalLink,
  Settings,
} from 'lucide-react'

export const AdminLayout: React.FC = () => {
  const { user, isLoading, logout } = useAuth()
  const { siteName, logoUrl } = useSiteSettings()
  const { i18n } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(
    () => localStorage.getItem('dashboard_sidebar_collapsed') === 'true'
  )
  const userAvatar = user?.avatar_url

  const toggleSidebar = () => {
    setIsCollapsed((prev) => {
      const next = !prev
      localStorage.setItem('dashboard_sidebar_collapsed', String(next))
      return next
    })
  }

  const isKhmer = i18n.language === 'km'

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50/70">
        <div className="w-9 h-9 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (!user.roles.includes('admin')) {
    if (user.roles.includes('employer')) {
      return <Navigate to="/employer/dashboard" replace />
    }
    if (user.roles.includes('job_seeker')) {
      return <Navigate to="/seeker/dashboard" replace />
    }
    return <Navigate to="/" replace />
  }

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  const navItems = [
    { name: 'Platform Dashboard', nameKm: 'ផ្ទាំងទូទៅ', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Job Categories', nameKm: 'ផ្នែកការងារ & បង្កើត', path: '/admin/categories', icon: Layers },
    { name: 'Company Verifications', nameKm: 'ផ្ទៀងផ្ទាត់ក្រុមហ៊ុន', path: '/admin/companies', icon: Building },
    { name: 'Job Moderation', nameKm: 'ត្រួតពិនិត្យការងារ', path: '/admin/jobs', icon: Briefcase },
    { name: 'User Management', nameKm: 'គ្រប់គ្រងអ្នកប្រើប្រាស់', path: '/admin/users', icon: Users },
    { name: 'System Audit Logs', nameKm: 'កំណត់ត្រាប្រព័ន្ធ', path: '/admin/audit', icon: FileSearch },
    { name: 'Settings', nameKm: 'ការកំណត់', path: '/admin/settings', icon: Settings },
  ]

  const isItemActive = (path: string) => {
    if (path === '/admin/dashboard') {
      return location.pathname === '/admin/dashboard' || location.pathname === '/admin'
    }
    return location.pathname.startsWith(path)
  }

  const currentNav = navItems.find((n) => isItemActive(n.path))

  return (
    <div className="workspace-layout min-h-screen bg-slate-50/70 flex flex-col md:flex-row text-slate-800 font-sans relative">
      {/* Platform-Wide Ambient Glowing Light Mesh Backdrop */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
        <div
          className="absolute -top-28 right-1/4 w-[520px] h-[520px] bg-gradient-to-br from-blue-200/35 via-indigo-100/25 to-transparent rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: '9s' }}
        />
        <div className="absolute top-[350px] -left-20 w-[450px] h-[450px] bg-gradient-to-tr from-sky-200/30 via-blue-100/20 to-transparent rounded-full blur-3xl" />
        <div className="absolute -bottom-24 right-10 w-[550px] h-[550px] bg-gradient-to-tl from-indigo-100/30 via-purple-100/20 to-transparent rounded-full blur-3xl" />
      </div>

      {/* Mobile Drawer Backdrop Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 md:hidden animate-in fade-in duration-200"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Admin Desktop & Mobile Sidebar (Clear Glass Design) */}
      <aside
        className={`fixed md:sticky top-0 z-50 md:z-40 inset-y-0 left-0 ${isCollapsed ? 'md:w-[56px]' : 'md:w-64'
          } w-72 glass-sidebar bg-white/95 md:bg-white/75 backdrop-blur-2xl border-r border-slate-200/80 flex flex-col justify-between shrink-0 shadow-2xl md:shadow-[4px_0_30px_rgba(15,23,42,0.03)] transition-transform md:transition-all duration-300 h-screen overflow-x-hidden ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          }`}
      >
        {/* Admin Brand Header */}
        <div
          className={`h-16 flex items-center justify-between border-b border-slate-200/80 bg-white/40 backdrop-blur-md shrink-0 transition-all ${isCollapsed ? 'justify-center px-1' : 'px-5'
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
            onClick={() => setMobileMenuOpen(false)}
            className="md:hidden p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100/80 rounded-xl transition cursor-pointer"
            title={isKhmer ? 'បិទ' : 'Close'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>



        {/* Navigation (Scrollable with Frosted Glass Hover) */}
        <div className={`flex flex-col flex-1 overflow-y-auto ${isCollapsed ? 'p-1.5' : 'p-3.5'}`}>
          <nav className="space-y-1.5 text-left">
            {!isCollapsed && (
              <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400/90 block mb-2 text-left">
                {isKhmer ? 'ផ្ទាំងគ្រប់គ្រងរដ្ឋបាល' : 'System Governance'}
              </span>
            )}
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = isItemActive(item.path)

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  title={isCollapsed ? (isKhmer ? item.nameKm : item.name) : undefined}
                  className={`group flex items-center rounded-xl text-xs transition-all duration-150 ${isCollapsed
                    ? 'justify-center w-10 h-10 mx-auto'
                    : 'space-x-3 px-3.5 py-2.5 text-left'
                    } ${isActive
                      ? 'bg-blue-600 text-white font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium'
                    }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'}`} />
                  {!isCollapsed && (
                    <span className="flex-1 text-left truncate">{isKhmer ? item.nameKm : item.name}</span>
                  )}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Footer Admin actions (System Style) */}
        <div
          className={`border-t border-slate-200/80 bg-white/40 backdrop-blur-md space-y-1 text-left shrink-0 ${isCollapsed ? 'p-1.5' : 'p-3'
            }`}
        >
          {/* Public Website Link */}
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            title={isCollapsed ? (isKhmer ? 'ត្រឡប់ទៅគេហទំព័រ' : 'Go to Website') : undefined}
            className={`w-full flex items-center rounded-xl text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all ${isCollapsed ? 'justify-center w-10 h-10 mx-auto' : 'space-x-2.5 px-3 py-2 text-left'
              }`}
          >
            <ExternalLink className="w-4 h-4 shrink-0 text-slate-400" />
            {!isCollapsed && <span className="flex-1 text-left">{isKhmer ? 'មើលគេហទំព័រការងារ' : 'Public Website'}</span>}
          </Link>

          {/* Sign Out */}
          <button
            type="button"
            onClick={handleLogout}
            title={isCollapsed ? (isKhmer ? 'ចាកចេញ' : 'Sign Out') : undefined}
            className={`w-full flex items-center rounded-xl text-xs font-medium text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-all cursor-pointer ${isCollapsed ? 'justify-center w-10 h-10 mx-auto' : 'space-x-2.5 px-3 py-2 text-left'
              }`}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span className="flex-1 text-left">{isKhmer ? 'ចាកចេញ' : 'Sign Out'}</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar Header (Unified Mobile & Desktop) */}
        <header className="sticky top-0 z-30 h-16 glass-topbar bg-white/80 backdrop-blur-2xl border-b border-slate-200/80 px-3.5 sm:px-6 flex items-center justify-between shadow-xs shrink-0">
          <div className="flex items-center space-x-2.5 text-xs font-medium text-slate-500 min-w-0">
            {/* Mobile Hamburger Menu Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-xl border border-slate-200/80 bg-white/80 hover:bg-white text-slate-700 hover:text-blue-600 transition shadow-2xs cursor-pointer items-center justify-center shrink-0 active:scale-95"
              title={isKhmer ? 'បើកមឺនុយ' : 'Open Menu'}
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Mobile View Title & Portal Badge (System Style) */}
            <div className="flex items-center space-x-1.5 md:hidden min-w-0">
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200/70 shrink-0">
                {isKhmer ? 'អភិបាល' : 'Admin'}
              </span>
              <span className="font-bold text-slate-800 text-sm truncate">
                {isKhmer ? (currentNav?.nameKm || 'ផ្ទាំងគ្រប់គ្រង') : (currentNav?.name || 'Dashboard')}
              </span>
            </div>

            {/* Desktop Sidebar Collapse Toggle */}
            <button
              type="button"
              onClick={toggleSidebar}
              className="hidden md:flex p-2 rounded-xl border border-slate-200/80 bg-white/70 hover:bg-white text-slate-600 hover:text-blue-600 transition shadow-2xs cursor-pointer items-center justify-center ml-1"
              title={isCollapsed ? (isKhmer ? 'ពង្រីកមឺនុយ' : 'Expand Sidebar') : (isKhmer ? 'បង្រួមមឺនុយ' : 'Collapse Sidebar')}
            >
              <Menu className="w-4.5 h-4.5" />
            </button>
            <span className="hidden md:inline font-bold text-slate-800 text-sm">
              {isKhmer ? (currentNav?.nameKm || 'ផ្ទាំងគ្រប់គ្រង') : (currentNav?.name || 'Dashboard')}
            </span>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
            <NotificationDropdown role="admin" />
            <LanguageDropdown />

            {/* Profile Avatar Trigger */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="w-9 h-9 rounded-full flex items-center justify-center transition shadow-2xs cursor-pointer active:scale-95 overflow-hidden"
                title={user.full_name}
              >
                {userAvatar ? (
                  <img
                    src={getAssetUrl(userAvatar)}
                    alt={user.full_name}
                    className="w-full h-full object-cover rounded-full border border-slate-200/80 bg-white"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none'
                    }}
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-500/10 to-indigo-500/10 text-blue-700 font-bold border border-blue-400/30 backdrop-blur-md flex items-center justify-center">
                    {user.full_name?.charAt(0) || 'A'}
                  </div>
                )}
              </button>

              {profileDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-[9998]" onClick={() => setProfileDropdownOpen(false)} />
                  <div className="absolute right-0 mt-2.5 w-60 rounded-2xl bg-white shadow-2xl border border-slate-200 p-2 z-[9999] animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3 py-2.5 border-b border-slate-100/80 flex items-center space-x-2.5">
                      {userAvatar ? (
                        <div className="w-8 h-8 rounded-full border border-slate-200/80 bg-white flex items-center justify-center shrink-0 shadow-2xs overflow-hidden">
                          <img
                            src={getAssetUrl(userAvatar)}
                            alt={user.full_name}
                            className="w-full h-full object-cover rounded-full"
                          />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                          {user.full_name?.charAt(0) || 'A'}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-900 truncate">{user.full_name}</p>
                        <p className="text-[11px] font-medium text-slate-500 truncate mt-0.5">{user.email}</p>
                      </div>
                    </div>

                    <div className="mt-1 space-y-0.5">
                      <Link
                        to="/admin/dashboard"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center space-x-2 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-white/80 hover:text-blue-600 rounded-xl transition"
                      >
                        <Shield className="w-4 h-4 text-slate-400" />
                        <span>Admin Console</span>
                      </Link>
                    </div>

                    <div className="mt-1 pt-1 border-t border-slate-100/80">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center space-x-2 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-500/10 rounded-xl transition"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page Content Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 w-full">
          <Outlet />
        </main>
        <AIAgentFloatingButton />
      </div>
    </div>
  )
}
