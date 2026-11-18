import React, { useState, useRef, useEffect } from 'react'
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth, useToast, useSiteSettings } from '../../app/providers'
import { Button } from '../ui/Button'
import { LanguageDropdown } from './LanguageDropdown'
import { getAssetUrl } from '../../utils/assets'
import {
  Briefcase,
  Building,
  User as UserIcon,
  LogOut,
  PlusCircle,
  Shield,
  FileText,
  Bookmark,
  Menu,
  X,
  LayoutDashboard,
  Users,
  Layers,
  Megaphone,
  ExternalLink,
} from 'lucide-react'

export const Navbar: React.FC = () => {
  const { t, i18n } = useTranslation()
  const { user, logout } = useAuth()
  const { settings, siteName, logoUrl } = useSiteSettings()
  const { toast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  const isKhmer = i18n.language === 'km'
  const userAvatar = user?.avatar_url || user?.seeker_profile?.avatar_url || user?.company?.logo_url

  const getRoleLabel = () => {
    if (!user) return ''
    if (user.roles?.includes('admin')) return isKhmer ? 'អភិបាល' : 'Admin'
    if (user.roles?.includes('employer')) return isKhmer ? 'និយោជក' : 'Employer'
    return isKhmer ? 'បេក្ខជន' : 'Job Seeker'
  }

  const getDashboardPath = () => {
    if (!user) return '/login'
    if (user.roles?.includes('admin')) return '/admin/dashboard'
    if (user.roles?.includes('employer')) return '/employer/dashboard'
    return '/seeker/dashboard'
  }

  // Close user dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false)
      }
    }
    if (userDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [userDropdownOpen])

  const handleLogout = async () => {
    await logout()
    setUserDropdownOpen(false)
    setMobileMenuOpen(false)
    toast.info(
      isKhmer ? 'បានចាកចេញ' : 'Signed Out',
      isKhmer ? 'អ្នកបានចាកចេញពីគណនីដោយសុវត្ថិភាព' : 'You have been signed out successfully'
    )
    navigate('/')
  }

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${isActive
      ? 'text-blue-600 bg-blue-50/80 font-extrabold'
      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
    }`

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 font-sans shadow-xs">
      {/* Top Announcement Bar if enabled */}
      {settings?.announcement_enabled && (
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white text-xs py-2 px-4 shadow-xs">
          <div className="max-w-7xl mx-auto flex items-center justify-center text-center gap-2">
            <Megaphone className="w-3.5 h-3.5 shrink-0" />
            <span className="font-medium truncate">
              {isKhmer
                ? settings.announcement_text_km || settings.announcement_text
                : settings.announcement_text}
            </span>
            {settings.announcement_url && (
              <a
                href={settings.announcement_url}
                className="underline ml-1 font-bold hover:text-blue-100 flex items-center gap-0.5 inline-flex shrink-0"
              >
                <span>{isKhmer ? 'ស្វែងយល់បន្ថែម' : 'Learn more'}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center space-x-2.5 group shrink-0">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={siteName}
                className="h-9 w-auto max-w-[160px] object-contain shrink-0 group-hover:scale-105 transition-transform"
              />
            ) : (
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                <Briefcase className="w-4 h-4" />
              </div>
            )}
            <div className="flex items-center">
              <span className="font-black text-lg sm:text-xl tracking-tight text-slate-900 truncate max-w-[200px] sm:max-w-none">
                {siteName}
              </span>
            </div>
          </Link>

          {/* Navigation Links with Active Highlighting */}
          <nav className="hidden md:flex items-center space-x-1">
            <NavLink to="/" end className={navLinkClass}>
              {t('nav.home')}
            </NavLink>
            <NavLink to="/jobs" className={navLinkClass}>
              {t('nav.jobs')}
            </NavLink>
            <NavLink to="/companies" className={navLinkClass}>
              {t('nav.companies')}
            </NavLink>
          </nav>

          {/* Right Header Controls */}
          <div className="hidden lg:flex items-center space-x-3">
            <LanguageDropdown variant="light" />

            {/* Logged-in Profile Avatar vs Guest Buttons */}
            {user ? (
              <div className="flex items-center">
                {/* Profile Avatar with Role-Specific Dropdown Menu (3 Cases) */}
                <div className="relative" ref={userMenuRef}>
                  <button
                    type="button"
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center justify-center rounded-full transition-transform active:scale-95 focus:outline-none cursor-pointer"
                    title={user.full_name}
                    aria-label="User account menu"
                  >
                    {userAvatar ? (
                      <div className="w-9 h-9 rounded-full border border-slate-200/80 bg-white flex items-center justify-center shrink-0 shadow-xs overflow-hidden">
                        <img
                          src={getAssetUrl(userAvatar)}
                          alt={user.full_name}
                          className="w-full h-full object-cover rounded-full"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none'
                          }}
                        />
                      </div>
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-semibold text-sm flex items-center justify-center shadow-xs">
                        {user.full_name?.charAt(0) || 'U'}
                      </div>
                    )}
                  </button>

                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-200 p-2 z-[9999] animate-in fade-in zoom-in-95 duration-100">
                      <div className="px-3 py-2 border-b border-slate-100 mb-1 flex items-center space-x-2.5">
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
                            {user.full_name?.charAt(0) || 'U'}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-slate-900 truncate">{user.full_name}</p>
                          <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                        </div>
                      </div>

                      {/* CASE 1: Job Seeker (Role 1) */}
                      {user.roles.includes('job_seeker') && (
                        <div className="space-y-0.5">
                          <Link
                            to="/seeker/dashboard"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center px-3 py-2 rounded-xl text-xs font-normal text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition"
                          >
                            <LayoutDashboard className="w-3.5 h-3.5 mr-2.5 text-slate-400" />
                            <span>{t('nav.dashboard')}</span>
                          </Link>
                          <Link
                            to="/seeker/profile"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center px-3 py-2 rounded-xl text-xs font-normal text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition"
                          >
                            <UserIcon className="w-3.5 h-3.5 mr-2.5 text-slate-400" />
                            {t('nav.profile')}
                          </Link>
                          <Link
                            to="/seeker/applications"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center px-3 py-2 rounded-xl text-xs font-normal text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition"
                          >
                            <FileText className="w-3.5 h-3.5 mr-2.5 text-slate-400" />
                            {t('nav.myApplications')}
                          </Link>
                          <Link
                            to="/seeker/saved"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center px-3 py-2 rounded-xl text-xs font-normal text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition"
                          >
                            <Bookmark className="w-3.5 h-3.5 mr-2.5 text-blue-500" />
                            {t('nav.savedJobs')}
                          </Link>
                        </div>
                      )}

                      {/* CASE 2: Employer (Role 2) */}
                      {user.roles.includes('employer') && (
                        <div className="space-y-0.5">
                          <Link
                            to="/employer/dashboard"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center px-3 py-2 rounded-xl text-xs font-normal text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition"
                          >
                            <LayoutDashboard className="w-3.5 h-3.5 mr-2.5 text-slate-400" />
                            {t('nav.dashboard')}
                          </Link>
                          <Link
                            to="/employer/jobs"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center px-3 py-2 rounded-xl text-xs font-normal text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition"
                          >
                            <Briefcase className="w-3.5 h-3.5 mr-2.5 text-slate-400" />
                            {t('nav.manageJobs')}
                          </Link>
                          <Link
                            to="/employer/jobs/new"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center px-3 py-2 rounded-xl text-xs font-normal text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition"
                          >
                            <PlusCircle className="w-3.5 h-3.5 mr-2.5 text-slate-400" />
                            {t('nav.postJob')}
                          </Link>
                          <Link
                            to="/employer/company"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center px-3 py-2 rounded-xl text-xs font-normal text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition"
                          >
                            <Building className="w-3.5 h-3.5 mr-2.5 text-slate-400" />
                            {isKhmer ? 'ព័ត៌មានក្រុមហ៊ុន' : 'Company Profile'}
                          </Link>
                        </div>
                      )}

                      {/* CASE 3: Admin (Role 3) */}
                      {user.roles.includes('admin') && (
                        <div className="space-y-0.5">
                          <Link
                            to="/admin/dashboard"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center px-3 py-2 rounded-xl text-xs font-medium text-blue-600 hover:bg-blue-50 transition"
                          >
                            <LayoutDashboard className="w-3.5 h-3.5 mr-2.5 text-blue-500" />
                            {isKhmer ? 'ផ្ទាំងគ្រប់គ្រងទូទៅ' : 'Admin Dashboard'}
                          </Link>
                          <Link
                            to="/admin/categories"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center px-3 py-2 rounded-xl text-xs font-normal text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition"
                          >
                            <Layers className="w-3.5 h-3.5 mr-2.5 text-slate-400" />
                            {isKhmer ? 'ផ្នែកការងារ' : 'Job Categories'}
                          </Link>
                          <Link
                            to="/admin/companies"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center px-3 py-2 rounded-xl text-xs font-normal text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition"
                          >
                            <Building className="w-3.5 h-3.5 mr-2.5 text-slate-400" />
                            {isKhmer ? 'ផ្ទៀងផ្ទាត់ក្រុមហ៊ុន' : 'Companies'}
                          </Link>
                          <Link
                            to="/admin/jobs"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center px-3 py-2 rounded-xl text-xs font-normal text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition"
                          >
                            <Briefcase className="w-3.5 h-3.5 mr-2.5 text-slate-400" />
                            {isKhmer ? 'ត្រួតពិនិត្យការងារ' : 'Job Vacancies'}
                          </Link>
                          <Link
                            to="/admin/users"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center px-3 py-2 rounded-xl text-xs font-normal text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition"
                          >
                            <Users className="w-3.5 h-3.5 mr-2.5 text-slate-400" />
                            {isKhmer ? 'គ្រប់គ្រងអ្នកប្រើប្រាស់' : 'Users & Roles'}
                          </Link>
                        </div>
                      )}

                      <div className="border-t border-slate-100 my-1" />

                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full flex items-center px-3 py-2 rounded-xl text-xs font-normal text-red-600 hover:bg-red-50 text-left transition cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5 mr-2.5" />
                        {t('nav.logout')}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Single Modern Sign In Button */
              <div className="flex items-center">
                <Link to="/login">
                  <Button variant="primary" size="sm">
                    {t('nav.signIn')}
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Right Controls: Language Dropdown + Menu Toggle */}
          <div className="flex lg:hidden items-center space-x-2">
            <LanguageDropdown variant="light" />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 py-3 px-2 space-y-2 bg-white/95">
            <nav className="flex flex-col space-y-1 font-semibold text-xs text-slate-700">
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-xl hover:bg-slate-50 hover:text-blue-600"
              >
                {t('nav.home')}
              </Link>
              <Link
                to="/jobs"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-xl hover:bg-slate-50 hover:text-blue-600"
              >
                {t('nav.jobs')}
              </Link>
              <Link
                to="/companies"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-xl hover:bg-slate-50 hover:text-blue-600"
              >
                {t('nav.companies')}
              </Link>
            </nav>

            <div className="border-t border-slate-100 pt-2">
              {user ? (
                <div className="space-y-1">
                  <div className="px-3 py-2 bg-slate-50 rounded-xl flex items-center space-x-2.5">
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
                        {user.full_name?.charAt(0) || 'U'}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-900 truncate">{user.full_name}</p>
                      <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                    </div>
                  </div>
                  {/* CASE 1: Job Seeker (Role 1) */}
                  {user.roles.includes('job_seeker') && (
                    <>
                      <Link
                        to="/seeker/dashboard"
                        onClick={() => setMobileMenuOpen(false)}
                        className="block px-3 py-1.5 text-xs font-normal text-slate-700 hover:bg-slate-50"
                      >
                        {t('nav.dashboard')}
                      </Link>
                      <Link
                        to="/seeker/profile"
                        onClick={() => setMobileMenuOpen(false)}
                        className="block px-3 py-1.5 text-xs font-normal text-slate-700 hover:bg-slate-50"
                      >
                        {t('nav.profile')}
                      </Link>
                      <Link
                        to="/seeker/applications"
                        onClick={() => setMobileMenuOpen(false)}
                        className="block px-3 py-1.5 text-xs font-normal text-slate-700 hover:bg-slate-50"
                      >
                        {t('nav.myApplications')}
                      </Link>
                      <Link
                        to="/seeker/saved"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center px-3 py-1.5 text-xs font-normal text-slate-700 hover:bg-slate-50"
                      >
                        <Bookmark className="w-3.5 h-3.5 mr-2 text-blue-500" />
                        {t('nav.savedJobs')}
                      </Link>
                    </>
                  )}

                  {/* CASE 2: Employer (Role 2) */}
                  {user.roles.includes('employer') && (
                    <>
                      <Link
                        to="/employer/dashboard"
                        onClick={() => setMobileMenuOpen(false)}
                        className="block px-3 py-1.5 text-xs font-normal text-slate-700 hover:bg-slate-50"
                      >
                        {t('nav.dashboard')}
                      </Link>
                      <Link
                        to="/employer/jobs"
                        onClick={() => setMobileMenuOpen(false)}
                        className="block px-3 py-1.5 text-xs font-normal text-slate-700 hover:bg-slate-50"
                      >
                        {t('nav.manageJobs')}
                      </Link>
                      <Link
                        to="/employer/jobs/new"
                        onClick={() => setMobileMenuOpen(false)}
                        className="block px-3 py-1.5 text-xs font-normal text-slate-700 hover:bg-slate-50"
                      >
                        {t('nav.postJob')}
                      </Link>
                      <Link
                        to="/employer/company"
                        onClick={() => setMobileMenuOpen(false)}
                        className="block px-3 py-1.5 text-xs font-normal text-slate-700 hover:bg-slate-50"
                      >
                        {isKhmer ? 'ព័ត៌មានក្រុមហ៊ុន' : 'Company Profile'}
                      </Link>
                    </>
                  )}

                  {/* CASE 3: Admin (Role 3) */}
                  {user.roles.includes('admin') && (
                    <>
                      <Link
                        to="/admin/dashboard"
                        onClick={() => setMobileMenuOpen(false)}
                        className="block px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50"
                      >
                        {isKhmer ? 'ផ្ទាំងគ្រប់គ្រង Admin' : 'Admin Dashboard'}
                      </Link>
                      <Link
                        to="/admin/categories"
                        onClick={() => setMobileMenuOpen(false)}
                        className="block px-3 py-1.5 text-xs font-normal text-slate-700 hover:bg-slate-50"
                      >
                        {isKhmer ? 'ផ្នែកការងារ' : 'Job Categories'}
                      </Link>
                      <Link
                        to="/admin/companies"
                        onClick={() => setMobileMenuOpen(false)}
                        className="block px-3 py-1.5 text-xs font-normal text-slate-700 hover:bg-slate-50"
                      >
                        {isKhmer ? 'ផ្ទៀងផ្ទាត់ក្រុមហ៊ុន' : 'Companies'}
                      </Link>
                      <Link
                        to="/admin/jobs"
                        onClick={() => setMobileMenuOpen(false)}
                        className="block px-3 py-1.5 text-xs font-normal text-slate-700 hover:bg-slate-50"
                      >
                        {isKhmer ? 'ត្រួតពិនិត្យការងារ' : 'Job Vacancies'}
                      </Link>
                      <Link
                        to="/admin/users"
                        onClick={() => setMobileMenuOpen(false)}
                        className="block px-3 py-1.5 text-xs font-normal text-slate-700 hover:bg-slate-50"
                      >
                        {isKhmer ? 'គ្រប់គ្រងអ្នកប្រើប្រាស់' : 'Users & Roles'}
                      </Link>
                    </>
                  )}
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                  >
                    {t('nav.logout')}
                  </button>
                </div>
              ) : (
                <div className="pt-1">
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="primary" size="sm" fullWidth>
                      {t('nav.signIn')}
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
