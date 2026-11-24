import React from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ShieldAlert, ArrowLeft } from 'lucide-react'
import { useAuth } from '../../app/providers'

interface PermissionGuardProps {
  permission: string | string[]
  children: React.ReactNode
  fallback?: React.ReactNode
}

/**
 * Conditionally renders children if the authenticated user possesses the required permission(s).
 */
export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  permission,
  children,
  fallback = null,
}) => {
  const { hasPermission, isLoading } = useAuth()

  if (isLoading) return null
  if (!hasPermission(permission)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

interface RoleGuardProps {
  roles: string[] | string
  children: React.ReactNode
  fallback?: React.ReactNode
}

/**
 * Conditionally renders children if the authenticated user has at least one of the specified roles.
 */
export const RoleGuard: React.FC<RoleGuardProps> = ({
  roles,
  children,
  fallback = null,
}) => {
  const { hasRole, isLoading } = useAuth()

  if (isLoading) return null
  if (!hasRole(roles)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

/**
 * Route-level permission barrier showing a crisp, localized Access Restricted notice
 * with a navigation button back to the user's primary dashboard.
 */
export const RoutePermissionGuard: React.FC<{
  permission: string | string[]
  children: React.ReactNode
}> = ({ permission, children }) => {
  const { hasPermission, isLoading, dashboardPath } = useAuth()
  const { i18n } = useTranslation()
  const isKhmer = i18n.language === 'km'

  if (isLoading) return null

  if (!hasPermission(permission)) {
    return (
      <div className="max-w-lg mx-auto my-14 bg-white rounded-3xl border border-slate-200 p-8 text-center shadow-sm space-y-4 font-sans">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-base sm:text-lg font-bold text-slate-900">
            {isKhmer ? 'អ្នកមិនមានសិទ្ធិចូលប្រើទំព័រនេះទេ' : 'Access Restricted'}
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            {isKhmer
              ? 'តួនាទី ឬសិទ្ធិបច្ចុប្បន្នរបស់អ្នកមិនអនុញ្ញាតឱ្យបើកមើលផ្នែកនេះទេ។ សូមទាក់ទងអ្នកគ្រប់គ្រងប្រព័ន្ធ ឬម្ចាស់ក្រុមហ៊ុនដើម្បីស្នើសុំសិទ្ធិបន្ថែម។'
              : 'Your current role or permission set does not grant access to this module. Contact your administrator or company owner if you need elevated privileges.'}
          </p>
        </div>
        <Link
          to={dashboardPath}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-2xs transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{isKhmer ? 'ត្រឡប់ទៅផ្ទាំងគ្រប់គ្រង' : 'Back to Dashboard'}</span>
        </Link>
      </div>
    )
  }

  return <>{children}</>
}
