import {
  LayoutDashboard,
  Layers,
  Building,
  Briefcase,
  Users,
  FileSearch,
  Settings,
  Shield,
  PlusCircle,
  User,
  FileText,
  Bookmark,
  Bell,
} from 'lucide-react'
import { PERMISSIONS, hasPermission } from '../../../utils/permissions'
import { DashboardNavItem, PortalBadgeConfig, ProfileMenuItem } from './types'
import { User as UserType } from '../../../types'

export const ADMIN_NAV_ITEMS: DashboardNavItem[] = [
  {
    name: 'Platform Dashboard',
    nameKm: 'ផ្ទាំងទូទៅ',
    path: '/admin/dashboard',
    icon: LayoutDashboard,
    permission: PERMISSIONS.ADMIN_ACCESS,
    isActive: (pathname) =>
      pathname === '/admin/dashboard' || pathname === '/admin',
  },
  {
    name: 'Job Categories',
    nameKm: 'ផ្នែកការងារ & បង្កើត',
    path: '/admin/categories',
    icon: Layers,
    permission: PERMISSIONS.MANAGE_CATEGORIES,
  },
  {
    name: 'Company Verifications',
    nameKm: 'ផ្ទៀងផ្ទាត់ក្រុមហ៊ុន',
    path: '/admin/companies',
    icon: Building,
    permission: PERMISSIONS.VERIFY_COMPANIES,
  },
  {
    name: 'Job Moderation',
    nameKm: 'ត្រួតពិនិត្យការងារ',
    path: '/admin/jobs',
    icon: Briefcase,
    permission: PERMISSIONS.MODERATE_JOBS,
  },
  {
    name: 'User Management',
    nameKm: 'គ្រប់គ្រងអ្នកប្រើប្រាស់',
    path: '/admin/users',
    icon: Users,
    permission: PERMISSIONS.MANAGE_USERS,
  },
  {
    name: 'System Audit Logs',
    nameKm: 'កំណត់ត្រាប្រព័ន្ធ',
    path: '/admin/audit',
    icon: FileSearch,
    permission: PERMISSIONS.VIEW_AUDIT,
  },
  {
    name: 'Settings',
    nameKm: 'ការកំណត់',
    path: '/admin/settings',
    icon: Settings,
    permission: PERMISSIONS.MANAGE_SETTINGS,
  },
  {
    name: 'Notifications',
    nameKm: 'ការជូនដំណឹង',
    path: '/admin/notifications',
    icon: Bell,
    permission: PERMISSIONS.VIEW_NOTIFICATIONS,
  },
]

export const ADMIN_PROFILE_MENU_ITEMS: ProfileMenuItem[] = [
  {
    label: 'Admin Console',
    labelKm: 'កុងសូលអភិបាល',
    path: '/admin/dashboard',
    icon: Shield,
    permission: PERMISSIONS.ADMIN_ACCESS,
  },
]

export const EMPLOYER_NAV_ITEMS: DashboardNavItem[] = [
  {
    name: 'Dashboard Overview',
    nameKm: 'ផ្ទាំងគ្រប់គ្រង',
    path: '/employer/dashboard',
    icon: LayoutDashboard,
    permission: PERMISSIONS.EMPLOYER_ACCESS,
  },
  {
    name: 'Manage Vacancies',
    nameKm: 'គ្រប់គ្រងការងារ',
    path: '/employer/jobs',
    icon: Briefcase,
    permission: PERMISSIONS.EMPLOYER_ACCESS,
    isActive: (pathname) => pathname === '/employer/jobs' || pathname.endsWith('/edit'),
  },
  {
    name: 'All Applicants',
    nameKm: 'បេក្ខជនទាំងអស់',
    path: '/employer/applications',
    icon: Users,
    permission: PERMISSIONS.VIEW_APPLICATIONS,
    isActive: (pathname) =>
      pathname === '/employer/applications' || pathname.endsWith('/applications'),
  },
  {
    name: 'Post New Vacancy',
    nameKm: 'ចុះផ្សាយការងារថ្មី',
    path: '/employer/jobs/new',
    icon: PlusCircle,
    permission: PERMISSIONS.POST_JOBS,
  },
  {
    name: 'Company Profile',
    nameKm: 'ព័ត៌មានក្រុមហ៊ុន',
    path: '/employer/company',
    icon: Building,
    permission: PERMISSIONS.MANAGE_COMPANY,
  },
  {
    name: 'Notifications',
    nameKm: 'ការជូនដំណឹង',
    path: '/employer/notifications',
    icon: Bell,
    permission: PERMISSIONS.VIEW_NOTIFICATIONS,
  },
]

export const EMPLOYER_PROFILE_MENU_ITEMS: ProfileMenuItem[] = [
  {
    label: 'Recruitment Overview',
    labelKm: 'ទិដ្ឋភាពទូទៅនៃការជ្រើសរើស',
    path: '/employer/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Company Profile',
    labelKm: 'ព័ត៌មានក្រុមហ៊ុន',
    path: '/employer/company',
    icon: Building,
  },
]

export const SEEKER_NAV_ITEMS: DashboardNavItem[] = [
  {
    name: 'Dashboard',
    nameKm: 'ផ្ទាំងគ្រប់គ្រង',
    path: '/seeker/dashboard',
    icon: LayoutDashboard,
    permission: PERMISSIONS.SEEKER_ACCESS,
  },
  {
    name: 'Profile & Resumes',
    nameKm: 'ប្រវត្តិរូប និង CV',
    path: '/seeker/profile',
    icon: User,
    permission: PERMISSIONS.MANAGE_PROFILE,
  },
  {
    name: 'My Applications',
    nameKm: 'ពាក្យសុំការងារ',
    path: '/seeker/applications',
    icon: FileText,
    permission: PERMISSIONS.APPLY_JOBS,
  },
  {
    name: 'Saved Vacancies',
    nameKm: 'ការងាររក្សាទុក',
    path: '/seeker/saved',
    icon: Bookmark,
    permission: PERMISSIONS.SAVE_JOBS,
  },
  {
    name: 'Notifications',
    nameKm: 'ការជូនដំណឹង',
    path: '/seeker/notifications',
    icon: Bell,
    permission: PERMISSIONS.VIEW_NOTIFICATIONS,
  },
]

export const SEEKER_PROFILE_MENU_ITEMS: ProfileMenuItem[] = [
  {
    label: 'My Profile',
    labelKm: 'ប្រវត្តិរូបរបស់ខ្ញុំ',
    path: '/seeker/profile',
    icon: User,
  },
  {
    label: 'My Applications',
    labelKm: 'ពាក្យសុំការងាររបស់ខ្ញុំ',
    path: '/seeker/applications',
    icon: FileText,
  },
]

export interface RoleDashboardConfig {
  role: string
  navItems: DashboardNavItem[]
  profileMenuItems: ProfileMenuItem[]
  workspaceLabel: { en: string; km: string }
  portalBadge: PortalBadgeConfig
  notificationRole: 'admin' | 'employer' | 'job_seeker'
  defaultPath: string
}

export const ROLE_CONFIGS: Record<string, RoleDashboardConfig> = {
  admin: {
    role: 'admin',
    navItems: ADMIN_NAV_ITEMS,
    profileMenuItems: ADMIN_PROFILE_MENU_ITEMS,
    workspaceLabel: { en: 'Administration', km: 'ការគ្រប់គ្រង' },
    portalBadge: {
      label: 'Admin',
      labelKm: 'អភិបាល',
      className: 'bg-indigo-50 text-indigo-700 border border-indigo-200/70',
    },
    notificationRole: 'admin',
    defaultPath: '/admin/dashboard',
  },
  super_admin: {
    role: 'super_admin',
    navItems: ADMIN_NAV_ITEMS,
    profileMenuItems: ADMIN_PROFILE_MENU_ITEMS,
    workspaceLabel: { en: 'Super Admin', km: 'អភិបាលជាន់ខ្ពស់' },
    portalBadge: {
      label: 'Super Admin',
      labelKm: 'អភិបាលជាន់ខ្ពស់',
      className: 'bg-purple-50 text-purple-700 border border-purple-200/70',
    },
    notificationRole: 'admin',
    defaultPath: '/admin/dashboard',
  },
  moderator: {
    role: 'moderator',
    navItems: ADMIN_NAV_ITEMS.filter((item) =>
      [
        '/admin/dashboard',
        '/admin/companies',
        '/admin/jobs',
        '/admin/audit',
      ].includes(item.path)
    ),
    profileMenuItems: ADMIN_PROFILE_MENU_ITEMS,
    workspaceLabel: { en: 'Moderation', km: 'ការសម្របសម្រួល' },
    portalBadge: {
      label: 'Moderator',
      labelKm: 'អ្នកសម្របសម្រួល',
      className: 'bg-amber-50 text-amber-700 border border-amber-200/70',
    },
    notificationRole: 'admin',
    defaultPath: '/admin/dashboard',
  },
  employer: {
    role: 'employer',
    navItems: EMPLOYER_NAV_ITEMS,
    profileMenuItems: EMPLOYER_PROFILE_MENU_ITEMS,
    workspaceLabel: { en: 'Employer Workspace', km: 'កន្លែងនិយោជក' },
    portalBadge: {
      label: 'Employer',
      labelKm: 'និយោជក',
      className: 'bg-blue-50 text-blue-700 border border-blue-200/70',
    },
    notificationRole: 'employer',
    defaultPath: '/employer/dashboard',
  },
  recruiter: {
    role: 'recruiter',
    navItems: EMPLOYER_NAV_ITEMS.filter((item) =>
      ['/employer/dashboard', '/employer/jobs', '/employer/jobs/new'].includes(
        item.path
      )
    ),
    profileMenuItems: EMPLOYER_PROFILE_MENU_ITEMS,
    workspaceLabel: { en: 'Recruiter Hub', km: 'មជ្ឈមណ្ឌលជ្រើសរើស' },
    portalBadge: {
      label: 'Recruiter',
      labelKm: 'អ្នកជ្រើសរើស',
      className: 'bg-cyan-50 text-cyan-700 border border-cyan-200/70',
    },
    notificationRole: 'employer',
    defaultPath: '/employer/dashboard',
  },
  job_seeker: {
    role: 'job_seeker',
    navItems: SEEKER_NAV_ITEMS,
    profileMenuItems: SEEKER_PROFILE_MENU_ITEMS,
    workspaceLabel: { en: 'Career Workspace', km: 'កន្លែងការងារ' },
    portalBadge: {
      label: 'Seeker',
      labelKm: 'បេក្ខជន',
      className: 'bg-teal-50 text-teal-700 border border-teal-200/70',
    },
    notificationRole: 'job_seeker',
    defaultPath: '/seeker/dashboard',
  },
}

/**
 * Resolves the configuration for a given role or user.
 */
export const getDashboardConfigForRole = (
  role?: string,
  user?: UserType | null
): RoleDashboardConfig => {
  // If specific role requested
  if (role && ROLE_CONFIGS[role]) {
    return ROLE_CONFIGS[role]
  }

  // Detect role from user (respects custom DB roles carrying portal permissions)
  if (user) {
    if (
      user.id === 1 ||
      user.roles?.includes('super_admin') ||
      user.roles?.includes('admin') ||
      user.role === 'admin' ||
      hasPermission(user, PERMISSIONS.ADMIN_ACCESS)
    ) {
      return ROLE_CONFIGS.admin
    }
    if (
      user.roles?.includes('employer') ||
      user.role === 'employer' ||
      hasPermission(user, PERMISSIONS.EMPLOYER_ACCESS)
    ) {
      return ROLE_CONFIGS.employer
    }
    if (user.custom_role && ROLE_CONFIGS[user.custom_role]) {
      return ROLE_CONFIGS[user.custom_role]
    }
    return ROLE_CONFIGS.job_seeker
  }

  // Default fallback
  return ROLE_CONFIGS.job_seeker
}
