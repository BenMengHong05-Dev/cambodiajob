import React, { useState } from 'react'
import { Outlet, Navigate, Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../app/providers'
import { LanguageDropdown } from '../components/layout/LanguageDropdown'
import { NotificationDropdown } from '../components/layout/NotificationDropdown'
import { AIAgentFloatingButton } from '../components/ai/AIAgentFloatingButton'
import {
  LayoutDashboard,
  User,
  FileText,
  Bookmark,
  Bell,
  LogOut,
  ChevronRight,
  Menu,
  X,
  Briefcase,
  Search,
  Globe,
} from 'lucide-react'

export const SeekerLayout: React.FC = () => {
  const { user, isLoading, logout } = useAuth()
  const { i18n } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
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

  if (!user.roles.includes('job_seeker')) {
    if (user.roles.includes('admin')) {
      return <Navigate to="/admin/dashboard" replace />
    }
    if (user.roles.includes('employer')) {
      return <Navigate to="/employer/dashboard" replace />
    }
    return <Navigate to="/" replace />
  }

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  const navItems = [
    { name: 'Dashboard', nameKm: 'ផ្ទាំងគ្រប់គ្រង', path: '/seeker/dashboard', icon: LayoutDashboard },
    { name: 'Profile & Resumes', nameKm: 'ប្រវត្តិរូប និង CV', path: '/seeker/profile', icon: User },
    { name: 'My Applications', nameKm: 'ពាក្យសុំការងារ', path: '/seeker/applications', icon: FileText },
    { name: 'Saved Vacancies', nameKm: 'ការងាររក្សាទុក', path: '/seeker/saved', icon: Bookmark },
    { name: 'Notifications', nameKm: 'ការជូនដំណឹង', path: '/seeker/notifications', icon: Bell },
  ]

  const currentNav = navItems.find((n) => location.pathname.startsWith(n.path))

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

      {/* Mobile Top Header (Glassmorphic) */}
      <div className="md:hidden h-16 flex items-center justify-between px-4 glass-topbar bg-white/80 backdrop-blur-xl border-b border-white/80 shadow-xs shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20">
            <Briefcase className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-sm text-slate-900 block leading-tight">
              Cambodia<span className="text-blue-600">Jobs</span>
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {/* Mobile Website Button */}
          <Link
            to="/"
            className="p-1.5 text-slate-600 hover:text-blue-600 rounded-xl bg-white/80 border border-white/80 hover:bg-white transition shadow-2xs"
            title={isKhmer ? 'គេហទំព័រ' : 'Website'}
          >
            <Globe className="w-4 h-4 text-blue-600" />
          </Link>
          <LanguageDropdown />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-600 hover:text-slate-900 rounded-xl bg-white/80 border border-white/80 hover:bg-white transition shadow-2xs"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Desktop & Mobile Sidebar (Clear Glass Design) */}
      <aside
        className={`${
          mobileMenuOpen ? 'block' : 'hidden'
        } md:block fixed md:sticky top-0 z-40 inset-y-0 left-0 ${
          isCollapsed ? 'md:w-[56px]' : 'md:w-64'
        } glass-sidebar bg-white/75 backdrop-blur-2xl border-r border-white/80 flex flex-col justify-between shrink-0 shadow-[4px_0_30px_rgba(15,23,42,0.03)] transition-all duration-300 h-screen overflow-x-hidden`}
      >
        {/* Sidebar Brand Header */}
        <div
          className={`h-16 flex items-center border-b border-white/80 bg-white/40 backdrop-blur-md shrink-0 transition-all ${
            isCollapsed ? 'justify-center px-1' : 'px-5'
          }`}
        >
          {!isCollapsed ? (
            <Link to="/" className="flex items-center space-x-3 text-left w-full group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-500/20 shrink-0 group-hover:scale-105 transition-transform">
                <Briefcase className="w-4 h-4" />
              </div>
              <div className="text-left flex-1 min-w-0">
                <span className="text-base font-bold tracking-tight text-slate-900 block leading-tight">
                  Cambodia<span className="text-blue-600">Jobs</span>
                </span>
              </div>
            </Link>
          ) : (
            <Link
              to="/"
              className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-500/20 group hover:scale-105 transition-transform"
              title="CambodiaJobs"
            >
              <Briefcase className="w-4 h-4" />
            </Link>
          )}
        </div>

        {/* Navigation Links (Scrollable with Frosted Glass Hover) */}
        <div className={`flex flex-col flex-1 overflow-y-auto ${isCollapsed ? 'p-1.5' : 'p-3.5'}`}>
          <nav className="space-y-1.5 text-left">
            {!isCollapsed && (
              <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400/90 block mb-2 text-left">
                {isKhmer ? 'កន្លែងការងារ' : 'Career Workspace'}
              </span>
            )}
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname.startsWith(item.path)

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  title={isKhmer ? item.nameKm : item.name}
                  className={`flex items-center rounded-xl text-xs transition-all duration-150 ${
                    isCollapsed
                      ? 'justify-center w-10 h-10 mx-auto'
                      : 'space-x-3 px-3.5 py-2.5 text-left'
                  } ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow-md shadow-blue-500/20'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/80 border border-transparent hover:border-white/80 font-medium hover:shadow-2xs'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  {!isCollapsed && (
                    <span className="flex-1 text-left truncate">{isKhmer ? item.nameKm : item.name}</span>
                  )}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Footer Sidebar actions */}
        <div
          className={`border-t border-white/80 bg-white/30 backdrop-blur-md space-y-1.5 text-left shrink-0 ${
            isCollapsed ? 'p-1.5' : 'p-3.5'
          }`}
        >
          <button
            type="button"
            onClick={handleLogout}
            title={isKhmer ? 'ចាកចេញ' : 'Sign Out'}
            className={`w-full flex items-center rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-500/10 border border-transparent hover:border-rose-200/50 transition-all cursor-pointer ${
              isCollapsed ? 'justify-center w-10 h-10 mx-auto' : 'space-x-3 px-3.5 py-2.5 text-left'
            }`}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span className="flex-1 text-left">{isKhmer ? 'ចាកចេញ' : 'Sign Out'}</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar Header (Clear Glass Design) */}
        <header className="sticky top-0 z-30 h-16 glass-topbar bg-white/75 backdrop-blur-2xl border-b border-white/80 px-4 sm:px-6 flex items-center justify-between shadow-xs shrink-0">
          <div className="flex items-center space-x-2 text-xs font-medium text-slate-500">
            <button
              type="button"
              onClick={toggleSidebar}
              className="hidden md:flex p-2 rounded-xl border border-white/80 bg-white/70 hover:bg-white text-slate-600 hover:text-blue-600 transition shadow-2xs cursor-pointer items-center justify-center mr-1"
              title={isCollapsed ? (isKhmer ? 'ពង្រីកមឺនុយ' : 'Expand Sidebar') : (isKhmer ? 'បង្រួមមឺនុយ' : 'Collapse Sidebar')}
            >
              <Menu className="w-4.5 h-4.5" />
            </button>
            <span className="font-bold text-slate-800 text-sm">
              {isKhmer ? (currentNav?.nameKm || 'ផ្ទាំងគ្រប់គ្រង') : (currentNav?.name || 'Dashboard')}
            </span>
          </div>

          <div className="flex items-center space-x-2.5 sm:space-x-3">
            {/* Button Go Back to Website */}
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/80 bg-white/80 hover:bg-white text-xs font-semibold text-slate-700 hover:text-blue-600 transition shadow-2xs backdrop-blur-md"
              title={isKhmer ? 'ត្រឡប់ទៅគេហទំព័រ' : 'Go to Website'}
            >
              <Globe className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden sm:inline">{isKhmer ? 'គេហទំព័រ' : 'Website'}</span>
            </Link>

            <NotificationDropdown role="job_seeker" />
            <LanguageDropdown />

            {/* Profile Avatar Trigger */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500/10 to-indigo-500/10 text-blue-700 font-bold border border-blue-400/30 backdrop-blur-md flex items-center justify-center hover:ring-2 hover:ring-blue-300 transition shadow-2xs cursor-pointer"
                title={user.full_name}
              >
                {user.full_name?.charAt(0) || 'U'}
              </button>

              {profileDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setProfileDropdownOpen(false)} />
                  <div className="absolute right-0 mt-2.5 w-60 rounded-2xl glass-dropdown bg-white/85 backdrop-blur-2xl shadow-2xl shadow-blue-950/10 border border-white/90 p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3 py-2.5 border-b border-slate-100/80">
                      <p className="text-xs font-bold text-slate-900 truncate">{user.full_name}</p>
                      <p className="text-[11px] font-medium text-slate-500 truncate mt-0.5">{user.email}</p>
                    </div>

                    <div className="mt-1 space-y-0.5">
                      <Link
                        to="/seeker/profile"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center space-x-2 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-white/80 hover:text-blue-600 rounded-xl transition"
                      >
                        <User className="w-4 h-4 text-slate-400" />
                        <span>My Profile</span>
                      </Link>
                      <Link
                        to="/seeker/applications"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center space-x-2 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-white/80 hover:text-blue-600 rounded-xl transition"
                      >
                        <FileText className="w-4 h-4 text-slate-400" />
                        <span>My Applications</span>
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
