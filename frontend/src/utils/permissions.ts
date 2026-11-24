import { User } from '../types'

/**
 * Universal Granular Platform Permissions
 */
export const PERMISSIONS = {
  // Admin & System Privileges
  ADMIN_ACCESS: 'admin:access',
  MANAGE_USERS: 'users:manage',
  MANAGE_CATEGORIES: 'categories:manage',
  VERIFY_COMPANIES: 'companies:verify',
  MODERATE_JOBS: 'jobs:moderate',
  VIEW_AUDIT: 'audit:view',
  MANAGE_SETTINGS: 'settings:manage',

  // Employer & Organization Privileges
  EMPLOYER_ACCESS: 'employer:access',
  POST_JOBS: 'jobs:create',
  EDIT_JOBS: 'jobs:edit',
  DELETE_JOBS: 'jobs:delete',
  VIEW_APPLICATIONS: 'applications:view',
  REVIEW_APPLICATIONS: 'applications:review',
  MANAGE_COMPANY: 'company:manage',

  // Job Seeker Privileges
  SEEKER_ACCESS: 'seeker:access',
  MANAGE_PROFILE: 'profile:manage',
  MANAGE_RESUMES: 'resumes:manage',
  APPLY_JOBS: 'jobs:apply',
  SAVE_JOBS: 'jobs:save',
  VIEW_NOTIFICATIONS: 'notifications:view',
} as const

export type PermissionKey = keyof typeof PERMISSIONS
export type PermissionValue = (typeof PERMISSIONS)[PermissionKey]

/**
 * Standard Role to Permission Mappings
 * Supports default roles plus flexible custom roles (e.g. moderator, recruiter)
 */
export const ROLE_PERMISSIONS: Record<string, string[]> = {
  super_admin: Object.values(PERMISSIONS),
  admin: [
    PERMISSIONS.ADMIN_ACCESS,
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.MANAGE_CATEGORIES,
    PERMISSIONS.VERIFY_COMPANIES,
    PERMISSIONS.MODERATE_JOBS,
    PERMISSIONS.VIEW_AUDIT,
    PERMISSIONS.MANAGE_SETTINGS,
    PERMISSIONS.VIEW_NOTIFICATIONS,
  ],
  moderator: [
    PERMISSIONS.ADMIN_ACCESS,
    PERMISSIONS.VERIFY_COMPANIES,
    PERMISSIONS.MODERATE_JOBS,
    PERMISSIONS.VIEW_AUDIT,
    PERMISSIONS.VIEW_NOTIFICATIONS,
  ],
  employer: [
    PERMISSIONS.EMPLOYER_ACCESS,
    PERMISSIONS.POST_JOBS,
    PERMISSIONS.EDIT_JOBS,
    PERMISSIONS.DELETE_JOBS,
    PERMISSIONS.VIEW_APPLICATIONS,
    PERMISSIONS.REVIEW_APPLICATIONS,
    PERMISSIONS.MANAGE_COMPANY,
    PERMISSIONS.VIEW_NOTIFICATIONS,
  ],
  hiring_manager: [
    PERMISSIONS.EMPLOYER_ACCESS,
    PERMISSIONS.POST_JOBS,
    PERMISSIONS.EDIT_JOBS,
    PERMISSIONS.DELETE_JOBS,
    PERMISSIONS.VIEW_APPLICATIONS,
    PERMISSIONS.REVIEW_APPLICATIONS,
    PERMISSIONS.VIEW_NOTIFICATIONS,
  ],
  recruiter: [
    PERMISSIONS.EMPLOYER_ACCESS,
    PERMISSIONS.POST_JOBS,
    PERMISSIONS.EDIT_JOBS,
    PERMISSIONS.VIEW_APPLICATIONS,
    PERMISSIONS.REVIEW_APPLICATIONS,
    PERMISSIONS.VIEW_NOTIFICATIONS,
  ],
  interviewer: [
    PERMISSIONS.EMPLOYER_ACCESS,
    PERMISSIONS.VIEW_APPLICATIONS,
    PERMISSIONS.REVIEW_APPLICATIONS,
    PERMISSIONS.VIEW_NOTIFICATIONS,
  ],
  member: [
    PERMISSIONS.EMPLOYER_ACCESS,
    PERMISSIONS.VIEW_APPLICATIONS,
    PERMISSIONS.VIEW_NOTIFICATIONS,
  ],
  job_seeker: [
    PERMISSIONS.SEEKER_ACCESS,
    PERMISSIONS.MANAGE_PROFILE,
    PERMISSIONS.MANAGE_RESUMES,
    PERMISSIONS.APPLY_JOBS,
    PERMISSIONS.SAVE_JOBS,
    PERMISSIONS.VIEW_NOTIFICATIONS,
  ],
}

const EMPLOYER_MODULE_PERMS = new Set<string>([
  PERMISSIONS.EMPLOYER_ACCESS,
  PERMISSIONS.POST_JOBS,
  PERMISSIONS.EDIT_JOBS,
  PERMISSIONS.DELETE_JOBS,
  PERMISSIONS.VIEW_APPLICATIONS,
  PERMISSIONS.REVIEW_APPLICATIONS,
  PERMISSIONS.MANAGE_COMPANY,
])

/**
 * Returns localized display label for a system role key.
 */
export const getSystemRoleLabel = (roleName: string, isKhmer: boolean): string => {
  const key = (roleName || '').toLowerCase()
  const labels: Record<string, { en: string; km: string }> = {
    super_admin: { en: 'Super Admin', km: 'អភិបាលជាន់ខ្ពស់' },
    admin: { en: 'Admin', km: 'អភិបាល' },
    moderator: { en: 'Moderator', km: 'អ្នកសម្របសម្រួល' },
    employer: { en: 'Employer', km: 'និយោជក' },
    recruiter: { en: 'Recruiter', km: 'មន្ត្រីជ្រើសរើស' },
    hiring_manager: { en: 'Hiring Manager', km: 'ប្រធានផ្នែក' },
    interviewer: { en: 'Interviewer', km: 'អ្នកសម្ភាសន៍' },
    member: { en: 'Team Member', km: 'សមាជិក' },
    job_seeker: { en: 'Job Seeker', km: 'បេក្ខជនការងារ' },
  }
  const found = labels[key]
  if (found) return isKhmer ? found.km : found.en
  return roleName.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

/**
 * Returns localized display label for a company employee sub-role.
 */
export const getCompanyRoleLabel = (memberRole: string, isKhmer: boolean): string => {
  const key = (memberRole || 'member').toLowerCase()
  const labels: Record<string, { en: string; km: string }> = {
    owner: { en: 'Owner', km: 'ម្ចាស់ក្រុមហ៊ុន' },
    hiring_manager: { en: 'Hiring Manager', km: 'ប្រធានផ្នែក' },
    recruiter: { en: 'Recruiter', km: 'មន្ត្រីជ្រើសរើស' },
    interviewer: { en: 'Interviewer', km: 'អ្នកសម្ភាសន៍' },
    member: { en: 'Team Member', km: 'សមាជិក' },
  }
  const found = labels[key]
  if (found) return isKhmer ? found.km : found.en
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

/**
 * Returns all active permissions for a given user (authoritative backend permissions,
 * respecting Super Admin, custom overrides, role_permissions, and company sub-user roles).
 */
export const getEffectivePermissions = (user: User | null): string[] => {
  if (!user) return []

  // Only Root Super Admin (id === 1 or super_admin role) unconditionally holds all permissions
  if (user.id === 1 || user.roles?.includes('super_admin') || user.role === 'super_admin') {
    return Object.values(PERMISSIONS)
  }

  // If user has explicit custom permissions override (even if empty array)
  if (user.has_custom_permissions && Array.isArray(user.permissions)) {
    return user.permissions
  }

  const memberRole = (user.company?.member_role || user.company_member_role || '').toLowerCase()

  // Trust authoritative permissions returned by the backend API when present
  if (Array.isArray(user.permissions)) {
    if (memberRole && memberRole !== 'owner' && ROLE_PERMISSIONS[memberRole]) {
      const allowedEmp = new Set(ROLE_PERMISSIONS[memberRole])
      return user.permissions.filter((p) => !EMPLOYER_MODULE_PERMS.has(p) || allowedEmp.has(p))
    }
    return user.permissions
  }

  // Client-side fallback when permissions array is omitted
  const perms = new Set<string>()
  const userRoles = user.roles || (user.role ? [user.role] : [])
  for (const r of userRoles) {
    const roleKey = r.toLowerCase()
    if (roleKey === 'super_admin') {
      return Object.values(PERMISSIONS)
    }
    const rolePerms = ROLE_PERMISSIONS[roleKey]
    if (rolePerms) {
      rolePerms.forEach((p) => perms.add(p))
    }
  }

  if (user.custom_role && ROLE_PERMISSIONS[user.custom_role.toLowerCase()]) {
    ROLE_PERMISSIONS[user.custom_role.toLowerCase()].forEach((p) => perms.add(p))
  }

  if (memberRole && memberRole !== 'owner' && ROLE_PERMISSIONS[memberRole]) {
    const allowedEmp = new Set(ROLE_PERMISSIONS[memberRole])
    return Array.from(perms).filter((p) => !EMPLOYER_MODULE_PERMS.has(p) || allowedEmp.has(p))
  }

  return Array.from(perms)
}

/**
 * Checks if a user has a specific permission or any of multiple permissions.
 */
export const hasPermission = (
  user: User | null,
  permission: string | string[]
): boolean => {
  if (!user) return false
  if (user.id === 1 || user.roles?.includes('super_admin') || user.role === 'super_admin') return true

  const userPerms = getEffectivePermissions(user)

  if (Array.isArray(permission)) {
    return permission.some((p) => userPerms.includes(p))
  }

  return userPerms.includes(permission)
}

/**
 * Checks if a user has a specific role or any of multiple roles.
 */
export const hasRole = (
  user: User | null,
  role: string | string[]
): boolean => {
  if (!user) return false
  if (user.id === 1 && (role === 'admin' || role === 'super_admin' || (Array.isArray(role) && role.includes('admin')))) {
    return true
  }

  const userRoles = (user.roles || (user.role ? [user.role] : [])).map((r) => r.toLowerCase())
  if (user.custom_role) {
    userRoles.push(user.custom_role.toLowerCase())
  }

  if (Array.isArray(role)) {
    return role.some((r) => userRoles.includes(r.toLowerCase()))
  }

  return userRoles.includes(role.toLowerCase())
}

/**
 * Evaluates whether a user can access a route or view based on role or permission criteria.
 */
export const canAccess = (
  user: User | null,
  criteria: {
    role?: string[] | string
    requiredRoles?: string[] | string
    permission?: string | string[]
    requiredPermission?: string | string[]
  }
): boolean => {
  if (!user) return false

  // If specific roles are required
  const targetRoles = criteria.requiredRoles || criteria.role
  if (targetRoles) {
    const roles = Array.isArray(targetRoles) ? targetRoles : [targetRoles]
    if (!hasRole(user, roles)) return false
  }

  // If specific permissions are required
  const targetPerms = criteria.requiredPermission || criteria.permission
  if (targetPerms) {
    if (!hasPermission(user, targetPerms)) return false
  }

  return true
}
