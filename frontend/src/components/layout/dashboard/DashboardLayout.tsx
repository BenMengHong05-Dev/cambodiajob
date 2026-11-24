import React from 'react'
import { Outlet, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../../app/providers'
import { canAccess } from '../../../utils/permissions'
import { AIAgentFloatingButton } from '../../ai/AIAgentFloatingButton'
import { DashboardSidebar } from './DashboardSidebar'
import { DashboardNavbar } from './DashboardNavbar'
import { DashboardProvider, useDashboard } from './DashboardContext'
import { DashboardLayoutProps } from './types'

const DashboardLayoutContent: React.FC<{ children?: React.ReactNode }> = ({
  children,
}) => {
  const { mobileMenuOpen, setMobileMenuOpen } = useDashboard()

  return (
    <div className="workspace-layout min-h-screen bg-slate-50/70 dark:bg-slate-950 flex flex-col md:flex-row text-slate-800 dark:text-slate-100 font-sans relative">
      {/* Platform-Wide Ambient Glowing Light Mesh Backdrop */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10 dark:opacity-20">
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

      {/* One Unified Sidebar Component - can be called anywhere */}
      <DashboardSidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* One Unified Navbar Component - can be called anywhere */}
        <DashboardNavbar />

        {/* Page Content Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 w-full">
          {children || <Outlet />}
        </main>

        <AIAgentFloatingButton />
      </div>
    </div>
  )
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  role,
  requiredRole,
  requiredPermission,
  navItems,
  workspaceLabel,
  portalBadge,
  profileMenuItems,
  notificationRole,
  profileSubtitle,
  children,
}) => {
  const { user, isLoading } = useAuth()
  const location = useLocation()

  // 1. Loading State
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50/70">
        <div className="w-9 h-9 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // 2. Unauthenticated check
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  const effectiveRole =
    role || (Array.isArray(requiredRole) ? requiredRole[0] : requiredRole)

  // 3. Permission and Role Check
  const isPermitted = canAccess(user, {
    role: requiredRole,
    permission: requiredPermission,
  })

  if (!isPermitted) {
    // Intelligent redirect to highest authorized dashboard
    if (
      user.id === 1 ||
      user.roles?.includes('admin') ||
      user.roles?.includes('super_admin') ||
      canAccess(user, { permission: 'admin:access' })
    ) {
      return <Navigate to="/admin/dashboard" replace />
    }
    if (
      user.roles?.includes('employer') ||
      canAccess(user, { permission: 'employer:access' })
    ) {
      return <Navigate to="/employer/dashboard" replace />
    }
    if (
      user.roles?.includes('job_seeker') ||
      canAccess(user, { permission: 'seeker:access' })
    ) {
      return <Navigate to="/seeker/dashboard" replace />
    }
    return <Navigate to="/" replace />
  }

  return (
    <DashboardProvider
      role={effectiveRole}
      navItems={navItems}
      workspaceLabel={workspaceLabel}
      portalBadge={portalBadge}
      profileMenuItems={profileMenuItems}
      notificationRole={notificationRole}
      profileSubtitle={profileSubtitle}
    >
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </DashboardProvider>
  )
}
