import React from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { useAuth } from './providers'
import { PublicLayout } from '../layouts/PublicLayout'
import { SeekerLayout } from '../layouts/SeekerLayout'
import { EmployerLayout } from '../layouts/EmployerLayout'
import { AdminLayout } from '../layouts/AdminLayout'
import { RoutePermissionGuard } from '../components/auth/PermissionGuard'
import { PERMISSIONS, hasPermission } from '../utils/permissions'

// Public Pages
import { HomePage } from '../features/home/HomePage'
import { JobsPage } from '../features/jobs/JobsPage'
import { JobDetailPage } from '../features/jobs/JobDetailPage'
import { CompaniesPage } from '../features/companies/CompaniesPage'
import { CompanyDetailPage } from '../features/companies/CompanyDetailPage'
import { LoginPage } from '../features/auth/LoginPage'
import { RegisterPage } from '../features/auth/RegisterPage'
import { AuthCallbackPage } from '../features/auth/AuthCallbackPage'

// Seeker Pages
import { SeekerDashboardPage } from '../features/seeker/SeekerDashboardPage'
import { SeekerProfilePage } from '../features/seeker/SeekerProfilePage'
import { SeekerApplicationsPage } from '../features/seeker/SeekerApplicationsPage'
import { SeekerSavedJobsPage } from '../features/seeker/SeekerSavedJobsPage'
import { NotificationsPage, SeekerNotificationsPage } from '../features/seeker/SeekerNotificationsPage'

// Employer Pages
import { EmployerDashboardPage } from '../features/employer/EmployerDashboardPage'
import { EmployerJobsPage } from '../features/employer/EmployerJobsPage'
import { EmployerJobCreatePage } from '../features/employer/EmployerJobCreatePage'
import { EmployerApplicationsPage } from '../features/employer/EmployerApplicationsPage'
import { EmployerCompanyProfilePage } from '../features/employer/EmployerCompanyProfilePage'

// Admin Pages
import { AdminDashboardPage } from '../features/admin/AdminDashboardPage'
import { AdminCategoriesPage } from '../features/admin/AdminCategoriesPage'
import { AdminCompaniesPage } from '../features/admin/AdminCompaniesPage'
import { AdminJobsPage } from '../features/admin/AdminJobsPage'
import { AdminApplicationsPage } from '../features/admin/AdminApplicationsPage'
import { AdminUsersPage } from '../features/admin/AdminUsersPage'
import { AdminAuditPage } from '../features/admin/AdminAuditPage'
import { AdminSettingsPage } from '../features/admin/AdminSettingsPage'

// Smart router: 3 Cases for Dashboard based on 3 Roles
const RoleDashboardRedirect: React.FC = () => {
  const { user, isLoading } = useAuth()
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace />
  // Case 3: Admin / Super Admin or Custom Admin Role
  if (
    user.id === 1 ||
    user.roles?.includes('super_admin') ||
    user.roles?.includes('admin') ||
    hasPermission(user, PERMISSIONS.ADMIN_ACCESS)
  ) {
    return <Navigate to="/admin/dashboard" replace />
  }
  // Case 2: Employer or Sub-user / Custom Employer Role
  if (
    user.roles?.includes('employer') ||
    hasPermission(user, PERMISSIONS.EMPLOYER_ACCESS)
  ) {
    return <Navigate to="/employer/dashboard" replace />
  }
  // Case 1: Job Seeker (Role 1)
  return <Navigate to="/seeker/dashboard" replace />
}

export const router = createBrowserRouter([
  // Public Routes
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'dashboard', element: <RoleDashboardRedirect /> },
      { path: 'jobs', element: <JobsPage /> },
      { path: 'jobs/:slug', element: <JobDetailPage /> },
      { path: 'companies', element: <CompaniesPage /> },
      { path: 'companies/:slug', element: <CompanyDetailPage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
      { path: 'auth/callback', element: <AuthCallbackPage /> },
      { path: 'auth/google/callback', element: <AuthCallbackPage /> },
    ],
  },

  // Job Seeker / Employee Protected Routes
  {
    path: '/seeker',
    element: <SeekerLayout />,
    children: [
      { index: true, element: <Navigate to="/seeker/dashboard" replace /> },
      { path: 'dashboard', element: <SeekerDashboardPage /> },
      {
        path: 'profile',
        element: (
          <RoutePermissionGuard permission={PERMISSIONS.MANAGE_PROFILE}>
            <SeekerProfilePage />
          </RoutePermissionGuard>
        ),
      },
      {
        path: 'applications',
        element: (
          <RoutePermissionGuard permission={PERMISSIONS.APPLY_JOBS}>
            <SeekerApplicationsPage />
          </RoutePermissionGuard>
        ),
      },
      {
        path: 'saved',
        element: (
          <RoutePermissionGuard permission={PERMISSIONS.SAVE_JOBS}>
            <SeekerSavedJobsPage />
          </RoutePermissionGuard>
        ),
      },
      {
        path: 'notifications',
        element: (
          <RoutePermissionGuard permission={PERMISSIONS.VIEW_NOTIFICATIONS}>
            <SeekerNotificationsPage role="job_seeker" />
          </RoutePermissionGuard>
        ),
      },
    ],
  },

  // Employer Protected Routes
  {
    path: '/employer',
    element: <EmployerLayout />,
    children: [
      { index: true, element: <Navigate to="/employer/dashboard" replace /> },
      { path: 'dashboard', element: <EmployerDashboardPage /> },
      {
        path: 'jobs',
        element: (
          <RoutePermissionGuard permission={PERMISSIONS.EMPLOYER_ACCESS}>
            <EmployerJobsPage />
          </RoutePermissionGuard>
        ),
      },
      {
        path: 'jobs/new',
        element: (
          <RoutePermissionGuard permission={PERMISSIONS.POST_JOBS}>
            <EmployerJobCreatePage />
          </RoutePermissionGuard>
        ),
      },
      {
        path: 'jobs/:id/edit',
        element: (
          <RoutePermissionGuard permission={PERMISSIONS.EDIT_JOBS}>
            <EmployerJobCreatePage />
          </RoutePermissionGuard>
        ),
      },
      {
        path: 'applications',
        element: (
          <RoutePermissionGuard permission={PERMISSIONS.VIEW_APPLICATIONS}>
            <EmployerApplicationsPage />
          </RoutePermissionGuard>
        ),
      },
      {
        path: 'jobs/:id/applications',
        element: (
          <RoutePermissionGuard permission={PERMISSIONS.VIEW_APPLICATIONS}>
            <EmployerApplicationsPage />
          </RoutePermissionGuard>
        ),
      },
      {
        path: 'company',
        element: (
          <RoutePermissionGuard permission={PERMISSIONS.MANAGE_COMPANY}>
            <EmployerCompanyProfilePage />
          </RoutePermissionGuard>
        ),
      },
      {
        path: 'notifications',
        element: (
          <RoutePermissionGuard permission={PERMISSIONS.VIEW_NOTIFICATIONS}>
            <NotificationsPage role="employer" />
          </RoutePermissionGuard>
        ),
      },
    ],
  },

  // Admin Protected Routes
  {
    path: '/admin',
    element: <AdminLayout />,
    children: [
      { index: true, element: <Navigate to="/admin/dashboard" replace /> },
      { path: 'dashboard', element: <AdminDashboardPage /> },
      {
        path: 'categories',
        element: (
          <RoutePermissionGuard permission={PERMISSIONS.MANAGE_CATEGORIES}>
            <AdminCategoriesPage />
          </RoutePermissionGuard>
        ),
      },
      {
        path: 'companies',
        element: (
          <RoutePermissionGuard permission={PERMISSIONS.VERIFY_COMPANIES}>
            <AdminCompaniesPage />
          </RoutePermissionGuard>
        ),
      },
      {
        path: 'jobs',
        element: (
          <RoutePermissionGuard permission={PERMISSIONS.MODERATE_JOBS}>
            <AdminJobsPage />
          </RoutePermissionGuard>
        ),
      },
      {
        path: 'applications',
        element: (
          <RoutePermissionGuard permission={PERMISSIONS.ADMIN_ACCESS}>
            <AdminApplicationsPage />
          </RoutePermissionGuard>
        ),
      },
      {
        path: 'users',
        element: (
          <RoutePermissionGuard permission={PERMISSIONS.MANAGE_USERS}>
            <AdminUsersPage />
          </RoutePermissionGuard>
        ),
      },
      {
        path: 'audit',
        element: (
          <RoutePermissionGuard permission={PERMISSIONS.VIEW_AUDIT}>
            <AdminAuditPage />
          </RoutePermissionGuard>
        ),
      },
      {
        path: 'settings',
        element: (
          <RoutePermissionGuard permission={PERMISSIONS.MANAGE_SETTINGS}>
            <AdminSettingsPage />
          </RoutePermissionGuard>
        ),
      },
      {
        path: 'notifications',
        element: (
          <RoutePermissionGuard permission={PERMISSIONS.VIEW_NOTIFICATIONS}>
            <NotificationsPage role="admin" />
          </RoutePermissionGuard>
        ),
      },
    ],
  },

  // Fallback
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
])

