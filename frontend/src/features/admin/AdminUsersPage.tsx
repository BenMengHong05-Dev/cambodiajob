import React, { useEffect, useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth, useToast } from '../../app/providers'
import { adminService } from '../../services/admin.service'
import { TablePagination } from '../../components/common/TablePagination'
import { AdminPageHeader } from '../../components/layout/dashboard'
import { Dialog } from '../../components/ui/Dialog'
import {
  Users,
  Key,
  ShieldCheck,
  Crown,
  Briefcase,
  User as UserIcon,
  CheckCircle2,
  XCircle,
  Trash2,
  Pencil,
  Eye,
  Plus,
  RefreshCw,
  X,
  Lock,
  AlertTriangle,
  Copy,
  Check,
  Building,
  Sliders,
  Layers,
} from 'lucide-react'
import { getAssetUrl } from '../../utils/assets'
import { ROLE_PERMISSIONS, getSystemRoleLabel, getCompanyRoleLabel } from '../../utils/permissions'

interface UserRecord {
  id: number
  email: string
  full_name: string
  phone_number: string | null
  avatar_url?: string | null
  is_active: boolean
  role?: string
  roles?: string[]
  permissions?: string[]
  has_custom_permissions?: boolean
  company_id?: number | null
  company_name?: string | null
  company_member_role?: string | null
  created_at: string
  updated_at?: string
}

interface RoleRecord {
  id: number
  name: string
  description: string
  user_count: number
  permissions: string[]
}

const DEFAULT_SYSTEM_CATALOG = [
  {
    category: 'Administration & Security',
    categoryKm: 'ការគ្រប់គ្រងប្រព័ន្ធ & សុវត្ថិភាព',
    permissions: [
      { key: 'admin:access', name: 'Admin Console Access', nameKm: 'ចូលប្រើផ្ទាំង Admin', description: 'Access admin console overview and core tools' },
      { key: 'users:manage', name: 'Manage Users & Accounts', nameKm: 'គ្រប់គ្រងអ្នកប្រើប្រាស់ & គណនី', description: 'Create, edit, suspend, and assign roles to users' },
      { key: 'categories:manage', name: 'Manage Job Categories', nameKm: 'គ្រប់គ្រងផ្នែកការងារ', description: 'Create, edit, and organize job industries and categories' },
      { key: 'companies:verify', name: 'Verify Companies', nameKm: 'ផ្ទៀងផ្ទាត់ក្រុមហ៊ុន', description: 'Review and approve/reject business profiles' },
      { key: 'jobs:moderate', name: 'Moderate Vacancies', nameKm: 'ត្រួតពិនិត្យការងារ', description: 'Approve, feature, pause, or remove job listings' },
      { key: 'audit:view', name: 'View Audit Logs', nameKm: 'មើលកំណត់ត្រាប្រព័ន្ធ', description: 'Inspect administrative actions and system security logs' },
      { key: 'settings:manage', name: 'Platform Settings', nameKm: 'ការកំណត់ប្រព័ន្ធ', description: 'Manage branding, SEO, contact info, and website settings' },
    ]
  },
  {
    category: 'Employer & Vacancy Management',
    categoryKm: 'និយោជក & ការគ្រប់គ្រងការងារ',
    permissions: [
      { key: 'employer:access', name: 'Employer Workspace Access', nameKm: 'ចូលប្រើផ្ទាំងនិយោជក', description: 'Access employer recruitment workspace' },
      { key: 'jobs:create', name: 'Post Vacancies', nameKm: 'ចុះផ្សាយការងារថ្មី', description: 'Create new job postings on the portal' },
      { key: 'jobs:edit', name: 'Edit Vacancies', nameKm: 'កែសម្រួលការងារ', description: 'Modify details and requirements of job postings' },
      { key: 'jobs:delete', name: 'Delete/Close Vacancies', nameKm: 'លុប/បិទការងារ', description: 'Delete or permanently close vacancies' },
      { key: 'applications:view', name: 'View Applications', nameKm: 'មើលបេក្ខជនដាក់ពាក្យ', description: 'View incoming candidate resumes and submissions' },
      { key: 'applications:review', name: 'Review & Process Candidates', nameKm: 'វាយតម្លៃ & ដំណើរការបេក្ខជន', description: 'Shortlist, reject, hire, and schedule interviews' },
      { key: 'company:manage', name: 'Manage Company Profile', nameKm: 'គ្រប់គ្រងព័ត៌មានក្រុមហ៊ុន', description: 'Edit organization profile, branding, and details' },
    ]
  },
  {
    category: 'Candidate & Seeker Services',
    categoryKm: 'សេវាបេក្ខជន & អ្នកស្វែងរកការងារ',
    permissions: [
      { key: 'seeker:access', name: 'Seeker Workspace Access', nameKm: 'ចូលប្រើផ្ទាំងបេក្ខជន', description: 'Access candidate portal and dashboard' },
      { key: 'profile:manage', name: 'Manage Candidate Profile', nameKm: 'គ្រប់គ្រងប្រវត្តិរូបផ្ទាល់ខ្លួន', description: 'Update work experience, education, and skills' },
      { key: 'resumes:manage', name: 'Manage Resumes & CVs', nameKm: 'គ្រប់គ្រង CV & ឯកសារ', description: 'Upload, create, print, and download CVs' },
      { key: 'jobs:apply', name: 'Apply for Vacancies', nameKm: 'ដាក់ពាក្យសុំការងារ', description: 'Submit applications and cover letters to employers' },
      { key: 'jobs:save', name: 'Bookmark Vacancies', nameKm: 'រក្សាទុកការងារ', description: 'Save favorite job postings to wishlist' },
    ]
  },
  {
    category: 'System & Notifications',
    categoryKm: 'ប្រព័ន្ធ & ការជូនដំណឹង',
    permissions: [
      { key: 'notifications:view', name: 'Receive Notifications', nameKm: 'ទទួលការជូនដំណឹង', description: 'View system notifications and real-time updates' },
    ]
  }
]

export const AdminUsersPage: React.FC = () => {
  const { i18n } = useTranslation()
  const isKhmer = i18n.language === 'km'
  const { toast } = useToast()
  const { user: currentUser, refreshUser } = useAuth()

  // Navigation tab: 'users' or 'roles'
  const [activeTab, setActiveTab] = useState<'users' | 'roles'>('users')

  // User list states
  const [users, setUsers] = useState<UserRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchUser, setSearchUser] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all')
  const [actionInProgress, setActionInProgress] = useState<number | null>(null)

  // Roles & Permissions states
  const [rolesData, setRolesData] = useState<RoleRecord[]>([])
  const [permissionsCatalog, setPermissionsCatalog] = useState(DEFAULT_SYSTEM_CATALOG)
  const [isLoadingRoles, setIsLoadingRoles] = useState(false)

  // Role permissions modal
  const [editingRole, setEditingRole] = useState<RoleRecord | null>(null)
  const [rolePermsSelection, setRolePermsSelection] = useState<string[]>([])
  const [roleDescription, setRoleDescription] = useState('')
  const [isSavingRolePerms, setIsSavingRolePerms] = useState(false)

  // Create & Delete Role modals
  const [isCreateRoleOpen, setIsCreateRoleOpen] = useState(false)
  const [newRoleName, setNewRoleName] = useState('')
  const [newRoleDesc, setNewRoleDesc] = useState('')
  const [newRolePerms, setNewRolePerms] = useState<string[]>([])
  const [isCreatingRole, setIsCreatingRole] = useState(false)
  const [deletingRole, setDeletingRole] = useState<RoleRecord | null>(null)
  const [isDeletingRole, setIsDeletingRole] = useState(false)

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)

  // Modal states
  const [viewingUser, setViewingUser] = useState<UserRecord | null>(null)
  const [fullUserDetails, setFullUserDetails] = useState<any>(null)
  const [isLoadingUserDetail, setIsLoadingUserDetail] = useState(false)
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null)
  const [isCreatingUser, setIsCreatingUser] = useState(false)
  const [deletingUser, setDeletingUser] = useState<UserRecord | null>(null)

  // Form states for Edit User
  const [editFullName, setEditFullName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editIsActive, setEditIsActive] = useState(true)
  const [editRole, setEditRole] = useState<string>('job_seeker')
  const [editCompanyId, setEditCompanyId] = useState<number | null>(null)
  const [editCompanyRole, setEditCompanyRole] = useState<string>('recruiter')
  const [editPassword, setEditPassword] = useState('')
  const [useCustomUserPerms, setUseCustomUserPerms] = useState(false)
  const [editUserPermissions, setEditUserPermissions] = useState<string[]>([])
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false)

  // Form states for Create User
  const [newFullName, setNewFullName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [newRole, setNewRole] = useState<string>('job_seeker')
  const [newCompanyId, setNewCompanyId] = useState<number | null>(null)
  const [newCompanyRole, setNewCompanyRole] = useState<string>('recruiter')
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false)

  // Available companies for assignment
  const [availableCompanies, setAvailableCompanies] = useState<any[]>([])

  // Copy email feedback
  const [copiedId, setCopiedId] = useState<number | null>(null)

  const loadUsers = async (quiet = false) => {
    if (!quiet) setIsLoading(true)

    try {
      const [data, comps] = await Promise.all([
        adminService.getUsers(),
        adminService.getCompanies().catch(() => []),
      ])
      setUsers(data || [])
      setAvailableCompanies(comps || [])
    } catch (err) {
      console.error('Failed to load users:', err)
      toast.error('Error', isKhmer ? 'មិនអាចទាញយកបញ្ជីអ្នកប្រើប្រាស់បានទេ' : 'Failed to load user list.')
    } finally {
      setIsLoading(false)
    }
  }

  const loadRoles = async () => {
    setIsLoadingRoles(true)
    try {
      const res = await adminService.getRolesAndPermissions()
      if (res) {
        setRolesData(res.roles || [])
        if (res.catalog && res.catalog.length > 0) {
          setPermissionsCatalog(res.catalog)
        }
      }
    } catch (err) {
      console.error('Failed to load roles and permissions:', err)
    } finally {
      setIsLoadingRoles(false)
    }
  }

  useEffect(() => {
    loadUsers()
    loadRoles()
  }, [])

  // Helper: Get single role cleanly (preserves custom DB roles)
  const getUserRole = (u: UserRecord): string => {
    if (u.id === 1) return 'super_admin'
    const r = (u.role || (u.roles && u.roles[0]) || 'job_seeker').toLowerCase()
    return r || 'job_seeker'
  }

  // Get active role default permissions
  const getRoleDefaultPermissions = (roleName: string): string[] => {
    const roleRecord = rolesData.find((r) => r.name.toLowerCase() === roleName.toLowerCase())
    if (roleRecord && roleRecord.permissions) {
      return roleRecord.permissions
    }
    return ROLE_PERMISSIONS[roleName.toLowerCase()] || []
  }

  // Filtered users calculation by search and status
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const q = searchUser.toLowerCase().trim()
      const role = getUserRole(u)
      const matchesSearch =
        !q ||
        u.full_name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.phone_number?.toLowerCase().includes(q) ||
        role.toLowerCase().includes(q)

      if (!matchesSearch) return false

      if (filterStatus === 'active') return u.is_active
      if (filterStatus === 'inactive') return !u.is_active

      return true
    })
  }, [users, searchUser, filterStatus])

  // Quick Toggle Status
  const handleToggleUserStatus = async (userId: number, currentStatus: boolean) => {
    if (userId === 1 || userId === currentUser?.id) {
      toast.error(
        'Action Forbidden',
        isKhmer ? 'អ្នកមិនអាចផ្អាកគណនី root admin ឬគណនីផ្ទាល់ខ្លួនបានទេ' : 'Cannot suspend root admin or your own account.'
      )
      return
    }

    setActionInProgress(userId)
    try {
      await adminService.toggleUserStatus(userId)
      toast.success(
        isKhmer ? 'ស្ថានភាពគណនីត្រូវបានកែប្រែ' : 'User Status Updated',
        isKhmer
          ? `គណនីត្រូវបាន ${currentStatus ? 'ផ្អាកជាបណ្ដោះអាសន្ន' : 'បើកដំណើរការឡើងវិញ'}`
          : `User account has been ${currentStatus ? 'suspended' : 'reactivated'}.`
      )
      loadUsers(true)
    } catch (err) {
      toast.error('Operation Failed', 'Could not update user status.')
    } finally {
      setActionInProgress(null)
    }
  }

  // Single Delete
  const handleConfirmDelete = async () => {
    if (!deletingUser) return
    if (deletingUser.id === 1 || deletingUser.id === currentUser?.id) {
      toast.error(
        'Action Forbidden',
        isKhmer ? 'មិនអាចលុបគណនីនេះបានទេ' : 'This account cannot be deleted.'
      )
      setDeletingUser(null)
      return
    }

    setActionInProgress(deletingUser.id)
    try {
      await adminService.deleteUser(deletingUser.id)
      toast.success(
        isKhmer ? 'បានលុបគណនីជោគជ័យ' : 'Account Deleted',
        isKhmer ? `គណនី ${deletingUser.email} ត្រូវបានលុបចេញពីប្រព័ន្ធ` : `User ${deletingUser.email} was permanently deleted.`
      )
      setDeletingUser(null)
      loadUsers(true)
      loadRoles()
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to delete user.'
      toast.error('Delete Failed', msg)
    } finally {
      setActionInProgress(null)
    }
  }

  // Open Edit Modal
  const openEditModal = (u: UserRecord) => {
    setEditingUser(u)
    setEditFullName(u.full_name || '')
    setEditEmail(u.email || '')
    setEditPhone(u.phone_number || '')
    setEditIsActive(u.is_active)
    const currentRole = getUserRole(u)
    const normalizedRole = currentRole === 'super_admin' ? 'admin' : currentRole
    setEditRole(normalizedRole)
    setEditCompanyId(u.company_id || null)
    setEditCompanyRole(u.company_member_role || 'recruiter')
    setEditPassword('')

    if (u.has_custom_permissions) {
      setUseCustomUserPerms(true)
      setEditUserPermissions(u.permissions || [])
    } else {
      setUseCustomUserPerms(false)
      setEditUserPermissions(u.permissions || getRoleDefaultPermissions(normalizedRole))
    }
  }

  // Handle Edit Submit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser) return

    if (!editFullName.trim() || !editEmail.trim()) {
      toast.error('Validation Error', 'Full Name and Email are required.')
      return
    }

    setIsSubmittingEdit(true)
    try {
      const payload: any = {
        full_name: editFullName.trim(),
        email: editEmail.trim().toLowerCase(),
        phone_number: editPhone.trim() || null,
        is_active: editIsActive,
        role: editRole,
        roles: [editRole],
        has_custom_permissions: useCustomUserPerms,
        permissions: useCustomUserPerms ? editUserPermissions : [],
      }
      const selectedRoleHasEmployerAccess =
        editRole === 'employer' || getRoleDefaultPermissions(editRole).includes('employer:access')
      if (selectedRoleHasEmployerAccess) {
        payload.company_id = editCompanyId || null
        payload.company_member_role = editCompanyRole || 'recruiter'
      } else {
        payload.company_id = null
      }
      if (editPassword.trim()) {
        payload.password = editPassword.trim()
      }

      await adminService.updateUser(editingUser.id, payload)
      toast.success(
        isKhmer ? 'បានកែប្រែជោគជ័យ' : 'User Updated',
        isKhmer ? `គណនី ${editFullName} ត្រូវបានធ្វើបច្ចុប្បន្នភាព` : `Account for ${editFullName} has been saved.`
      )
      setEditingUser(null)
      loadUsers(true)
      loadRoles()

      // If updating current logged in admin user, refresh session to update sidebar immediately
      if (editingUser.id === currentUser?.id) {
        await refreshUser()
      }
    } catch (err: any) {
      const msg = err.response?.data?.email || err.response?.data?.detail || 'Failed to update user.'
      toast.error('Update Failed', String(msg))
    } finally {
      setIsSubmittingEdit(false)
    }
  }

  // Open View Modal
  const handleOpenViewUser = async (u: UserRecord) => {
    setViewingUser(u)
    setIsLoadingUserDetail(true)
    setFullUserDetails(null)
    try {
      const details = await adminService.getUser(u.id)
      setFullUserDetails(details)
    } catch (err) {
      console.error('Failed to load user full details:', err)
    } finally {
      setIsLoadingUserDetail(false)
    }
  }

  // Handle Create User Submit
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newFullName.trim() || !newEmail.trim() || !newPassword.trim()) {
      toast.error('Validation Error', 'Full Name, Email, and Password are required.')
      return
    }
    if (newPassword.length < 6) {
      toast.error('Validation Error', 'Password must be at least 6 characters.')
      return
    }

    setIsSubmittingCreate(true)
    try {
      const createPayload: any = {
        full_name: newFullName.trim(),
        email: newEmail.trim().toLowerCase(),
        password: newPassword,
        phone_number: newPhone.trim() || undefined,
        role: newRole,
        roles: [newRole],
      }
      const newRoleHasEmployerAccess =
        newRole === 'employer' || getRoleDefaultPermissions(newRole).includes('employer:access')
      if (newRoleHasEmployerAccess && newCompanyId) {
        createPayload.company_id = newCompanyId
        createPayload.company_member_role = newCompanyRole || 'recruiter'
      }

      await adminService.createUser(createPayload)
      toast.success(
        isKhmer ? 'បានបង្កើតគណនីថ្មី' : 'User Created',
        isKhmer ? `គណនី ${newFullName} ត្រូវបានបង្កើតដោយជោគជ័យ` : `Account for ${newFullName} created successfully.`
      )
      setIsCreatingUser(false)
      setNewFullName('')
      setNewEmail('')
      setNewPassword('')
      setNewPhone('')
      setNewRole('job_seeker')
      setNewCompanyId(null)
      setNewCompanyRole('recruiter')
      loadUsers(true)
      loadRoles()
    } catch (err: any) {
      const msg = err.response?.data?.email || err.response?.data?.detail || 'Failed to create user.'
      toast.error('Creation Failed', String(msg))
    } finally {
      setIsSubmittingCreate(false)
    }
  }

  // Open Role Permissions Modal
  const openRolePermsModal = (role: RoleRecord) => {
    setEditingRole(role)
    setRoleDescription(role.description || '')
    setRolePermsSelection(role.permissions || [])
  }

  // Save Role Permissions
  const handleSaveRolePerms = async () => {
    if (!editingRole) return
    setIsSavingRolePerms(true)
    try {
      await adminService.updateRolePermissions(editingRole.id, {
        description: roleDescription,
        permissions: rolePermsSelection,
      })
      toast.success(
        isKhmer ? 'បានធ្វើបច្ចុប្បន្នភាពសិទ្ធិតួនាទី' : 'Role Permissions Saved',
        isKhmer ? `សិទ្ធិសម្រាប់តួនាទី ${editingRole.name} ត្រូវបានធ្វើបច្ចុប្បន្នភាព` : `Permissions for ${editingRole.name} updated successfully.`
      )
      setEditingRole(null)
      loadRoles()
      loadUsers(true)
      await refreshUser()
    } catch (err: any) {
      toast.error('Update Failed', 'Failed to update role permissions.')
    } finally {
      setIsSavingRolePerms(false)
    }
  }

  const handleCopyEmail = (u: UserRecord) => {
    navigator.clipboard.writeText(u.email)
    setCopiedId(u.id)
    setTimeout(() => setCopiedId(null), 1800)
  }

  // Create Custom Role
  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault()
    const cleanSlug = newRoleName
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '')
    if (!cleanSlug || cleanSlug.length < 2) {
      toast.error(
        isKhmer ? 'ឈ្មោះតួនាទីមិនត្រឹមត្រូវ' : 'Invalid Role Name',
        isKhmer
          ? 'សូមបញ្ចូលឈ្មោះតួនាទីជាអក្សរឡាតាំងយ៉ាងតិច ២ តួអក្សរ។'
          : 'Role key must contain at least 2 alphanumeric characters.'
      )
      return
    }
    setIsCreatingRole(true)
    try {
      await adminService.createRole({
        name: cleanSlug,
        description: newRoleDesc.trim(),
        permissions: newRolePerms,
      })
      toast.success(
        isKhmer ? 'បានបង្កើតតួនាទីថ្មី' : 'Role Created',
        isKhmer
          ? `តួនាទី "${cleanSlug}" ត្រូវបានបង្កើតដោយជោគជ័យ`
          : `Role "${cleanSlug}" has been created successfully.`
      )
      setIsCreateRoleOpen(false)
      setNewRoleName('')
      setNewRoleDesc('')
      setNewRolePerms([])
      loadRoles()
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.detail ||
        (isKhmer ? 'មិនអាចបង្កើតតួនាទីបានទេ' : 'Failed to create role.')
      toast.error(isKhmer ? 'បង្កើតតួនាទីបរាជ័យ' : 'Creation Failed', String(msg))
    } finally {
      setIsCreatingRole(false)
    }
  }

  // Delete Custom Role
  const handleConfirmDeleteRole = async () => {
    if (!deletingRole) return
    setIsDeletingRole(true)
    try {
      await adminService.deleteRole(deletingRole.id)
      toast.success(
        isKhmer ? 'បានលុបតួនាទីជោគជ័យ' : 'Role Deleted',
        isKhmer
          ? `តួនាទី "${deletingRole.name}" ត្រូវបានលុបចេញពីប្រព័ន្ធ`
          : `Role "${deletingRole.name}" was deleted.`
      )
      setDeletingRole(null)
      loadRoles()
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.detail ||
        (isKhmer ? 'មិនអាចលុបតួនាទីនេះបានទេ' : 'Failed to delete role.')
      toast.error(isKhmer ? 'លុបតួនាទីបរាជ័យ' : 'Delete Failed', String(msg))
    } finally {
      setIsDeletingRole(false)
    }
  }

  // Role Badge helper
  const getRoleBadge = (u: UserRecord) => {
    const role = getUserRole(u)
    if (role === 'super_admin') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 shadow-2xs">
          <Crown className="w-2.5 h-2.5 text-amber-500" />
          <span>{getSystemRoleLabel('super_admin', isKhmer)}</span>
        </span>
      )
    }
    if (role === 'admin' || u.permissions?.includes('admin:access')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs">
          <ShieldCheck className="w-2.5 h-2.5 text-blue-600" />
          <span>{getSystemRoleLabel(role, isKhmer)}</span>
        </span>
      )
    }
    if (role === 'employer' || u.permissions?.includes('employer:access')) {
      return (
        <div className="space-y-1">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200 shadow-2xs">
            <Briefcase className="w-2.5 h-2.5 text-sky-600" />
            <span>{getSystemRoleLabel(role, isKhmer)}</span>
          </span>
          {u.company_name && (
            <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium">
              <Building className="w-2.5 h-2.5 text-slate-400 shrink-0" />
              <span className="truncate max-w-[130px] font-semibold text-slate-700">{u.company_name}</span>
              {u.company_member_role && (
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-bold shrink-0">
                  {getCompanyRoleLabel(u.company_member_role, isKhmer)}
                </span>
              )}
            </div>
          )}
        </div>
      )
    }
    return (
      <span
        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border shadow-2xs ${
          role === 'job_seeker'
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : 'bg-purple-50 text-purple-700 border-purple-200'
        }`}
      >
        <UserIcon className={`w-2.5 h-2.5 ${role === 'job_seeker' ? 'text-emerald-600' : 'text-purple-600'}`} />
        <span>{getSystemRoleLabel(role, isKhmer)}</span>
      </span>
    )
  }

  const totalCount = users.length
  const activeCount = useMemo(() => users.filter((u) => u.is_active).length, [users])
  const inactiveCount = useMemo(() => users.filter((u) => !u.is_active).length, [users])

  // Toggle permission helper for checkboxes
  const togglePermissionInList = (list: string[], setList: (val: string[]) => void, permKey: string) => {
    if (list.includes(permKey)) {
      setList(list.filter((k) => k !== permKey))
    } else {
      setList([...list, permKey])
    }
  }

  if (isLoading && rolesData.length === 0) {
    return (
      <div className="py-28 text-center font-sans">
        <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="mt-3.5 text-xs font-semibold text-slate-500">
          {isKhmer ? 'កំពុងដំណើរការទាញយកទិន្នន័យ...' : 'Loading user records & permissions...'}
        </p>
      </div>
    )
  }

  return (
    <div className="w-full space-y-4 font-sans pb-12">
      {/* 1. Header Bar: Using AdminPageHeader */}
      <AdminPageHeader
        title={isKhmer ? 'គ្រប់គ្រងអ្នកប្រើប្រាស់ & សិទ្ធិ' : 'Users & Access Control'}
        subtitle={
          isKhmer
            ? 'ត្រួតពិនិត្យគណនី កំណត់តួនាទី និងបែងចែកសិទ្ធិប្រើប្រាស់ម៉ឺនុយប្រព័ន្ធ'
            : 'Govern user accounts, assign roles, and customize granular permissions'
        }
        badge={{
          icon: Users,
          text: `${totalCount} ${isKhmer ? 'គណនី' : 'Accounts'} • ${rolesData.length} ${isKhmer ? 'តួនាទី' : 'Roles'}`,
        }}
        searchValue={activeTab === 'users' ? searchUser : ''}
        onSearchChange={activeTab === 'users' ? setSearchUser : undefined}
        searchPlaceholder={
          isKhmer
            ? 'ស្វែងរកឈ្មោះ, អ៊ីមែល ឬលេខ...'
            : 'Search name, email, or phone...'
        }
        actions={
          <div className="flex items-center gap-2">
            {activeTab === 'users' ? (
              <button
                type="button"
                onClick={() => setIsCreatingUser(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition shadow-2xs cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5 text-white" />
                <span>{isKhmer ? 'បង្កើតគណនី' : 'Add User'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={loadRoles}
                disabled={isLoadingRoles}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition cursor-pointer shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isLoadingRoles ? 'animate-spin' : ''}`} />
                <span>{isKhmer ? 'ផ្ទុកឡើងវិញ' : 'Refresh Matrix'}</span>
              </button>
            )}
          </div>
        }
      />

      {/* 2. Top Navigation Tabs: Users Accounts vs Roles & Permissions */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-2 rounded-2xl shadow-2xs">
        <div className="flex items-center space-x-1">
          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className={`inline-flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition cursor-pointer ${
              activeTab === 'users'
                ? 'border-blue-600 text-blue-600 bg-blue-50/40 rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>{isKhmer ? 'បញ្ជីគណនីអ្នកប្រើប្រាស់' : 'User Accounts'}</span>
            <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-600 font-mono">
              {totalCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('roles')}
            className={`inline-flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition cursor-pointer ${
              activeTab === 'roles'
                ? 'border-blue-600 text-blue-600 bg-blue-50/40 rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>{isKhmer ? 'តួនាទី និងសិទ្ធិប្រព័ន្ធ' : 'Roles & Permissions Matrix'}</span>
            <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] bg-blue-100 text-blue-700 font-mono">
              {rolesData.length}
            </span>
          </button>
        </div>
      </div>

      {/* ========================================================
          TAB 1: USER ACCOUNTS
      ======================================================== */}
      {activeTab === 'users' && (
        <div className="space-y-3.5">
          {/* Filter Toolbar */}
          <div className="flex items-center justify-between gap-2 bg-white px-4 py-2.5 rounded-2xl border border-gray-200 shadow-2xs overflow-x-auto">
            <span className="text-[11px] font-medium text-slate-400 shrink-0 hidden sm:inline">
              {isKhmer ? 'ច្រោះតាមស្ថានភាព៖' : 'Filter by Status:'}
            </span>

            <div className="flex items-center space-x-1.5 ml-auto">
              <button
                type="button"
                onClick={() => setFilterStatus('all')}
                className={`px-3 py-1 rounded-xl text-xs font-semibold transition cursor-pointer shrink-0 ${
                  filterStatus === 'all'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-gray-200'
                }`}
              >
                {isKhmer ? 'ទាំងអស់' : 'All'} ({totalCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('active')}
                className={`px-3 py-1 rounded-xl text-xs font-semibold transition cursor-pointer shrink-0 ${
                  filterStatus === 'active'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/70'
                }`}
              >
                {isKhmer ? 'សកម្ម' : 'Active'} ({activeCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('inactive')}
                className={`px-3 py-1 rounded-xl text-xs font-semibold transition cursor-pointer shrink-0 ${
                  filterStatus === 'inactive'
                    ? 'bg-rose-600 text-white shadow-2xs'
                    : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/70'
                }`}
              >
                {isKhmer ? 'ផ្អាក' : 'Suspended'} ({inactiveCount})
              </button>
            </div>
          </div>

          {/* SaaS Users Data Table */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-gray-200 text-slate-500 uppercase tracking-wider font-normal text-[10px]">
                    <th className="py-2.5 px-4 font-normal">{isKhmer ? 'អ្នកប្រើប្រាស់' : 'User Account'}</th>
                    <th className="py-2.5 px-3.5 font-normal">{isKhmer ? 'តួនាទី' : 'Role'}</th>
                    <th className="py-2.5 px-3.5 font-normal">{isKhmer ? 'សិទ្ធិប្រព័ន្ធ' : 'Permissions'}</th>
                    <th className="py-2.5 px-3.5 font-normal">{isKhmer ? 'លេខទូរស័ព្ទ' : 'Phone'}</th>
                    <th className="py-2.5 px-3.5 font-normal">{isKhmer ? 'កាលបរិច្ឆេទបង្កើត' : 'Joined Date'}</th>
                    <th className="py-2.5 px-3.5 font-normal">{isKhmer ? 'ស្ថានភាព' : 'Status'}</th>
                    <th className="py-2.5 px-4 font-normal text-right">{isKhmer ? 'សកម្មភាព' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-sans">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center text-slate-400">
                        <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                        <p className="text-xs font-normal text-slate-700">
                          {isKhmer ? 'រកមិនឃើញគណនីអ្នកប្រើប្រាស់ទេ' : 'No user records found'}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-1">
                          {isKhmer ? 'សូមសាកល្បងស្វែងរកដោយពាក្យគន្លឹះផ្សេង' : 'Try adjusting your search query.'}
                        </p>
                        {searchUser && (
                          <button
                            type="button"
                            onClick={() => setSearchUser('')}
                            className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-normal text-blue-600 bg-blue-50 hover:bg-blue-100 transition cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>{isKhmer ? 'ជម្រះការស្វែងរក' : 'Clear Search'}</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ) : (
                    filteredUsers
                      .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                      .map((u) => {
                        const isRootAdmin = u.id === 1
                        const isSelf = u.id === currentUser?.id
                        const canDeleteOrSuspend = !isRootAdmin && !isSelf
                        const hasCustom = u.has_custom_permissions
                        const permCount = u.permissions ? u.permissions.length : 0

                        return (
                          <tr key={u.id} className="hover:bg-slate-50/70 transition">
                            {/* User Account */}
                            <td className="py-3 px-4">
                              <div className="flex items-center space-x-3">
                                {u.avatar_url ? (
                                  <div className="w-8 h-8 rounded-full border border-gray-200 bg-white flex items-center justify-center shrink-0 shadow-2xs overflow-hidden">
                                    <img
                                      src={getAssetUrl(u.avatar_url)}
                                      alt={u.full_name}
                                      className="w-full h-full object-cover rounded-full"
                                    />
                                  </div>
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-semibold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                                    {u.full_name?.charAt(0)?.toUpperCase() || 'U'}
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <div className="flex items-center space-x-1.5">
                                    <span className="font-medium text-slate-900 truncate block text-xs">
                                      {u.full_name}
                                    </span>
                                    {isRootAdmin && (
                                      <span title="Super Admin" className="inline-flex items-center">
                                        <Crown className="w-3 h-3 text-amber-500 shrink-0" />
                                      </span>
                                    )}
                                    {isSelf && (
                                      <span className="text-[9px] px-1.5 py-0.2 bg-blue-50 text-blue-700 rounded-md font-medium">
                                        {isKhmer ? 'អ្នក' : 'You'}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center space-x-1 text-slate-400 text-[11px] font-normal">
                                    <span className="truncate max-w-[170px] font-mono">{u.email}</span>
                                    <button
                                      type="button"
                                      onClick={() => handleCopyEmail(u)}
                                      className="hover:text-blue-600 transition cursor-pointer"
                                      title="Copy email"
                                    >
                                      {copiedId === u.id ? (
                                        <Check className="w-3 h-3 text-emerald-600" />
                                      ) : (
                                        <Copy className="w-3 h-3 text-slate-300 hover:text-slate-500" />
                                      )}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Role */}
                            <td className="py-3 px-3.5 whitespace-nowrap">
                              {getRoleBadge(u)}
                            </td>

                            {/* Permissions Summary Badge */}
                            <td className="py-3 px-3.5 whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => openEditModal(u)}
                                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium transition cursor-pointer ${
                                  hasCustom
                                    ? 'bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100'
                                    : 'bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200'
                                }`}
                                title={isKhmer ? 'ចុចដើម្បីកែប្រែសិទ្ធិ' : 'Click to customize permissions'}
                              >
                                <Key className="w-2.5 h-2.5" />
                                <span>
                                  {hasCustom
                                    ? `${isKhmer ? 'កំណត់ដោយឡែក' : 'Custom'} (${permCount})`
                                    : `${isKhmer ? 'តាមតួនាទី' : 'Role'} (${permCount})`}
                                </span>
                              </button>
                            </td>

                            {/* Phone */}
                            <td className="py-3 px-3.5 whitespace-nowrap text-slate-600 font-mono text-[11px]">
                              {u.phone_number || '—'}
                            </td>

                            {/* Joined Date */}
                            <td className="py-3 px-3.5 whitespace-nowrap text-slate-500 text-[11px]">
                              {new Date(u.created_at).toLocaleDateString()}
                            </td>

                            {/* Status */}
                            <td className="py-3 px-3.5 whitespace-nowrap">
                              {canDeleteOrSuspend ? (
                                <button
                                  type="button"
                                  disabled={actionInProgress === u.id}
                                  onClick={() => handleToggleUserStatus(u.id, u.is_active)}
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium transition cursor-pointer ${
                                    u.is_active
                                      ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                                      : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                                  }`}
                                  title={isKhmer ? 'ចុចដើម្បីបិទ/បើកដំណើរការ' : 'Toggle active status'}
                                >
                                  {u.is_active ? (
                                    <>
                                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                      <span>{isKhmer ? 'សកម្ម' : 'Active'}</span>
                                    </>
                                  ) : (
                                    <>
                                      <XCircle className="w-3 h-3 text-rose-600" />
                                      <span>{isKhmer ? 'ផ្អាក' : 'Suspended'}</span>
                                    </>
                                  )}
                                </button>
                              ) : (
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                                    u.is_active
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                                  }`}
                                >
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  <span>{isKhmer ? 'សកម្ម' : 'Active'}</span>
                                </span>
                              )}
                            </td>

                            {/* Actions */}
                            <td className="py-3 px-4 whitespace-nowrap text-right">
                              <div className="flex items-center justify-end space-x-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleOpenViewUser(u)}
                                  className="w-7 h-7 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center transition border border-gray-200 cursor-pointer"
                                  title={isKhmer ? 'មើលព័ត៌មានលម្អិត' : 'View dossier'}
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => openEditModal(u)}
                                  className="w-7 h-7 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 flex items-center justify-center transition border border-blue-200 cursor-pointer"
                                  title={isKhmer ? 'កែប្រែគណនី & សិទ្ធិ' : 'Edit account & permissions'}
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>

                                {canDeleteOrSuspend && (
                                  <button
                                    type="button"
                                    onClick={() => setDeletingUser(u)}
                                    className="w-7 h-7 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center justify-center transition border border-rose-200 cursor-pointer"
                                    title={isKhmer ? 'លុបគណនី' : 'Delete user'}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        )
                      })
                  )}
                </tbody>
              </table>
            </div>

            {filteredUsers.length > 0 && (
              <TablePagination
                currentPage={currentPage}
                pageSize={pageSize}
                totalItems={filteredUsers.length}
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
                pageSizeOptions={[25, 50, 100]}
              />
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 2: ROLES & PERMISSIONS MATRIX
      ======================================================== */}
      {activeTab === 'roles' && (
        <div className="space-y-6">
          {/* Top Action Bar for Custom Roles */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>{isKhmer ? 'គ្រប់គ្រងតួនាទី និងសិទ្ធិប្រព័ន្ធ' : 'System Roles & Access Control'}</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {isKhmer
                  ? 'បង្កើតតួនាទីថ្មី កែសម្រួលសិទ្ធិលំនាំដើមតាមតួនាទី ឬត្រួតពិនិត្យតារាងសិទ្ធិទាំងអស់'
                  : 'Create custom roles, configure role-level privilege sets, and inspect the full access matrix'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setNewRoleName('')
                setNewRoleDesc('')
                setNewRolePerms([])
                setIsCreateRoleOpen(true)
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold shadow-xs transition cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isKhmer ? 'បង្កើតតួនាទីថ្មី' : 'Create Custom Role'}</span>
            </button>
          </div>

          {/* Section 1: Role Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {rolesData.map((role) => {
              const rName = role.name.toLowerCase()
              const isSuper = rName.includes('admin') || role.permissions.includes('admin:access')
              const isEmployerRole = rName.includes('employer') || role.permissions.includes('employer:access')
              const isCoreRole = role.id <= 3 || ['job_seeker', 'employer', 'admin'].includes(rName)

              const RoleIcon = isSuper ? ShieldCheck : isEmployerRole ? Briefcase : rName === 'job_seeker' ? UserIcon : Key
              const accentColor = isSuper
                ? 'border-blue-200 bg-blue-50/40 text-blue-700'
                : isEmployerRole
                ? 'border-sky-200 bg-sky-50/40 text-sky-700'
                : rName === 'job_seeker'
                ? 'border-emerald-200 bg-emerald-50/40 text-emerald-700'
                : 'border-purple-200 bg-purple-50/40 text-purple-700'

              const defaultRoleDescKm: Record<string, string> = {
                admin: 'អភិបាលប្រព័ន្ធសម្រាប់ត្រួតពិនិត្យក្រុមហ៊ុន ការងារ អ្នកប្រើប្រាស់ និងការកំណត់',
                employer: 'និយោជក និងក្រុមហ៊ុនសម្រាប់ផ្សាយការងារ និងគ្រប់គ្រងបេក្ខជនដាក់ពាក្យ',
                job_seeker: 'អ្នកស្វែងរកការងារសម្រាប់បង្កើតប្រវត្តិរូប CV និងដាក់ពាក្យការងារ',
              }

              return (
                <div
                  key={role.id}
                  className="bg-white rounded-2xl border border-gray-200 p-5 shadow-2xs flex flex-col justify-between hover:shadow-md transition"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${accentColor}`}>
                          <RoleIcon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm font-bold text-slate-900 truncate">
                            {getSystemRoleLabel(role.name, isKhmer)}
                          </h3>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                            <span className="font-mono">ID #{role.id}</span>
                            {!isCoreRole && (
                              <span className="px-1.5 py-0.2 rounded bg-purple-50 text-purple-700 border border-purple-200 text-[9px] font-bold">
                                {isKhmer ? 'តួនាទីផ្ទាល់ខ្លួន' : 'Custom'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
                        {role.user_count} {isKhmer ? 'នាក់' : 'users'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 font-normal leading-relaxed min-h-[38px]">
                      {isKhmer && defaultRoleDescKm[rName]
                        ? defaultRoleDescKm[rName]
                        : role.description || (isKhmer ? 'តួនាទីស្តង់ដារក្នុងប្រព័ន្ធ' : 'Standard system role')}
                    </p>

                    {/* Enabled permissions summary */}
                    <div className="pt-2 border-t border-gray-100">
                      <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1.5">
                        <span className="font-medium">{isKhmer ? 'សិទ្ធិត្រូវបានបើក' : 'Active Privileges'}</span>
                        <span className="font-bold text-blue-600">
                          {role.permissions.length} {isKhmer ? 'សិទ្ធិ' : 'perms'}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                        {role.permissions.length === 0 ? (
                          <span className="text-[11px] text-slate-400 italic">
                            {isKhmer ? 'មិនទាន់មានសិទ្ធិត្រូវបានផ្តល់ទេ' : 'No privileges assigned yet'}
                          </span>
                        ) : (
                          role.permissions.map((p) => {
                            const foundPerm = permissionsCatalog
                              .flatMap((c) => c.permissions)
                              .find((item: any) => item.key === p)
                            return (
                              <span
                                key={p}
                                title={p}
                                className="px-2 py-0.5 rounded-md text-[10px] bg-slate-50 text-slate-700 border border-slate-200/80 font-medium"
                              >
                                {foundPerm ? (isKhmer ? foundPerm.nameKm : foundPerm.name) : p}
                              </span>
                            )
                          })
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 mt-3 border-t border-gray-100 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openRolePermsModal(role)}
                      className="flex-1 py-2 px-3 rounded-xl bg-slate-50 hover:bg-blue-50 text-blue-600 hover:text-blue-700 border border-blue-200 text-xs font-semibold flex items-center justify-center space-x-1.5 transition cursor-pointer"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      <span>{isKhmer ? 'កំណត់សិទ្ធិតួនាទីនេះ' : 'Configure Permissions'}</span>
                    </button>
                    {!isCoreRole && (
                      <button
                        type="button"
                        onClick={() => setDeletingRole(role)}
                        title={isKhmer ? 'លុបតួនាទីនេះ' : 'Delete custom role'}
                        className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition cursor-pointer shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Section 2: Complete System Permissions Catalog & Matrix */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                  <Key className="w-4 h-4 text-blue-600" />
                  <span>{isKhmer ? 'តារាងសិទ្ធិប្រព័ន្ធលម្អិត' : 'System Permissions Matrix'}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isKhmer
                    ? 'បញ្ជីសិទ្ធិទាំងអស់ដែលគ្រប់គ្រងការបង្ហាញម៉ឺនុយរបារចំហៀង និងមុខងារក្នុងផ្ទាំងនីមួយៗ'
                    : 'Universal granular permissions governing sidebar items and module access across portals'}
                </p>
              </div>
            </div>

            <div className="divide-y divide-gray-200">
              {permissionsCatalog.map((cat, cIdx) => (
                <div key={cIdx} className="p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <Layers className="w-4 h-4 text-slate-500" />
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      {isKhmer ? cat.categoryKm : cat.category}
                    </h4>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50/60 text-slate-500 text-[10px] uppercase font-medium">
                          <th className="py-2 px-3 font-medium">{isKhmer ? 'កូដសិទ្ធិ' : 'Permission Key'}</th>
                          <th className="py-2 px-3 font-medium">{isKhmer ? 'ឈ្មោះ & ការពិពណ៌នា' : 'Title & Purpose'}</th>
                          {rolesData.map((r) => (
                            <th key={r.id} className="py-2 px-3 text-center font-medium">
                              {getSystemRoleLabel(r.name, isKhmer)}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 font-sans">
                        {cat.permissions.map((p: any) => (
                          <tr key={p.key} className="hover:bg-slate-50/50 transition">
                            <td className="py-2 px-3 whitespace-nowrap">
                              <span className="font-mono text-[11px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                                {p.key}
                              </span>
                            </td>
                            <td className="py-2 px-3">
                              <div className="font-medium text-slate-900 text-xs">
                                {isKhmer ? p.nameKm : p.name}
                              </div>
                              <div className="text-[11px] text-slate-400">
                                {isKhmer && p.descriptionKm ? p.descriptionKm : p.description}
                              </div>
                            </td>
                            {rolesData.map((r) => {
                              const hasPerm = r.permissions.includes(p.key)
                              return (
                                <td key={r.id} className="py-2 px-3 text-center">
                                  {hasPerm ? (
                                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-700">
                                      <Check className="w-3 h-3" />
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-100 text-slate-300">
                                      —
                                    </span>
                                  )}
                                </td>
                              )
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 1: EDIT USER & PERMISSIONS (Standard White Dialog)
      ======================================================== */}
      <Dialog
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        size="lg"
        title={
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center shrink-0">
              <Pencil className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                {isKhmer ? 'កែប្រែគណនី & សិទ្ធិអ្នកប្រើប្រាស់' : 'Edit User & Permissions'}
              </h3>
              <span className="text-[11px] text-slate-400 font-normal">
                ID #{editingUser?.id} • {editingUser?.email}
              </span>
            </div>
          </div>
        }
        footer={
          <div className="flex items-center justify-end space-x-2 w-full">
            <button
              type="button"
              onClick={() => setEditingUser(null)}
              className="px-3.5 py-1.5 rounded-xl border border-gray-200 text-xs font-normal text-slate-600 hover:bg-slate-50 transition cursor-pointer"
            >
              {isKhmer ? 'បោះបង់' : 'Cancel'}
            </button>
            <button
              type="button"
              disabled={isSubmittingEdit}
              onClick={handleSaveEdit}
              className="px-4 py-1.5 rounded-xl text-xs font-normal text-white bg-blue-600 hover:bg-blue-700 active:scale-95 transition shadow-2xs cursor-pointer disabled:opacity-60"
            >
              {isSubmittingEdit
                ? isKhmer ? 'កំពុងរក្សាទុក...' : 'Saving...'
                : isKhmer ? 'រក្សាទុកការកែប្រែ' : 'Save Changes'}
            </button>
          </div>
        }
      >
        <form onSubmit={handleSaveEdit} className="space-y-4 text-xs font-sans">
          {/* User Basic Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-normal text-slate-700 mb-1">
                {isKhmer ? 'ឈ្មោះពេញ' : 'Full Name'} *
              </label>
              <input
                type="text"
                required
                value={editFullName}
                onChange={(e) => setEditFullName(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-xl outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 font-normal transition text-slate-800 shadow-2xs"
              />
            </div>
            <div>
              <label className="block text-xs font-normal text-slate-700 mb-1">
                {isKhmer ? 'អ៊ីមែល' : 'Email Address'} *
              </label>
              <input
                type="email"
                required
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-xl outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 font-normal transition text-slate-800 shadow-2xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-normal text-slate-700 mb-1">
                {isKhmer ? 'លេខទូរស័ព្ទ' : 'Phone Number'}
              </label>
              <input
                type="text"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                placeholder="+855 12 345 678"
                className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-xl outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 font-normal transition text-slate-800 shadow-2xs"
              />
            </div>
            <div>
              <label className="block text-xs font-normal text-slate-700 mb-1">
                {isKhmer ? 'ប្ដូរពាក្យសម្ងាត់' : 'Reset Password'}
              </label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder={isKhmer ? 'ទុកនៅទទេបើមិនចង់ប្ដូរ' : 'Leave empty to keep unchanged'}
                  className="w-full pl-8 pr-3.5 py-2 text-xs bg-white border border-gray-200 rounded-xl outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 font-normal transition text-slate-800 shadow-2xs"
                />
              </div>
            </div>
          </div>

          {/* Role Assignment */}
          <div>
            <label className="block text-xs font-normal text-slate-700 mb-1.5">
              {isKhmer ? 'កំណត់តួនាទីចម្បង' : 'Primary User Role'} *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(rolesData.length > 0
                ? rolesData.map((r) => ({ key: r.name, perms: r.permissions || [] }))
                : [
                    { key: 'job_seeker', perms: [] },
                    { key: 'employer', perms: ['employer:access'] },
                    { key: 'admin', perms: ['admin:access'] },
                  ]
              ).map((role) => {
                const keyLower = role.key.toLowerCase()
                const isSelected = editRole.toLowerCase() === keyLower
                const Icon =
                  keyLower === 'admin' || role.perms.includes('admin:access')
                    ? ShieldCheck
                    : keyLower === 'employer' || role.perms.includes('employer:access')
                    ? Briefcase
                    : keyLower === 'job_seeker'
                    ? UserIcon
                    : Key
                return (
                  <button
                    key={role.key}
                    type="button"
                    onClick={() => {
                      setEditRole(role.key)
                      if (!useCustomUserPerms) {
                        setEditUserPermissions(getRoleDefaultPermissions(role.key))
                      }
                    }}
                    className={`p-2 rounded-xl border text-left flex items-center space-x-2 transition cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50 border-blue-400 text-blue-700 shadow-2xs font-medium'
                        : 'bg-white border-gray-200 text-slate-600 hover:bg-slate-50 font-normal'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span className="text-[11px] truncate">{getSystemRoleLabel(role.key, isKhmer)}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Company Assignment for Employers */}
          {(editRole === 'employer' || getRoleDefaultPermissions(editRole).includes('employer:access')) && (
            <div className="p-3 bg-slate-50 rounded-xl border border-blue-200/60 space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                <Building className="w-3.5 h-3.5 text-blue-600" />
                <span>{isKhmer ? 'ភ្ជាប់ទៅកាន់ក្រុមហ៊ុន (ជម្រើស)' : 'Assign to Company (Optional)'}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-normal text-slate-600 mb-1">
                    {isKhmer ? 'ក្រុមហ៊ុន' : 'Company'}
                  </label>
                  <select
                    value={editCompanyId || ''}
                    onChange={(e) => setEditCompanyId(e.target.value ? Number(e.target.value) : null)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-200 rounded-lg outline-none focus:border-blue-500 font-normal"
                  >
                    <option value="">-- {isKhmer ? 'គ្មានក្រុមហ៊ុន / ឯករាជ្យ' : 'None / Independent'} --</option>
                    {availableCompanies.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-normal text-slate-600 mb-1">
                    {isKhmer ? 'តួនាទីក្នុងក្រុមហ៊ុន' : 'Role in Company'}
                  </label>
                  <select
                    value={editCompanyRole}
                    onChange={(e) => setEditCompanyRole(e.target.value)}
                    disabled={!editCompanyId}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-200 rounded-lg outline-none focus:border-blue-500 font-normal disabled:opacity-50"
                  >
                    <option value="recruiter">{isKhmer ? 'មន្ត្រីជ្រើសរើស' : 'Recruiter'}</option>
                    <option value="hiring_manager">{isKhmer ? 'ប្រធានផ្នែក' : 'Hiring Manager'}</option>
                    <option value="interviewer">{isKhmer ? 'អ្នកសម្ភាសន៍' : 'Interviewer'}</option>
                    <option value="member">{isKhmer ? 'សមាជិក' : 'Team Member'}</option>
                    <option value="owner">{isKhmer ? 'ម្ចាស់ក្រុមហ៊ុន' : 'Company Owner'}</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Granular Permission Customization Box */}
          <div className="p-4 rounded-xl border border-gray-200 bg-slate-50/60 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Key className="w-4 h-4 text-blue-600" />
                <span className="font-semibold text-slate-900 text-xs">
                  {isKhmer ? 'សិទ្ធិប្រើប្រាស់ម៉ឺនុយប្រព័ន្ធ' : 'Granular Permissions Override'}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-[11px] text-slate-500 font-normal">
                  {useCustomUserPerms
                    ? isKhmer ? 'សិទ្ធិកំណត់ដោយឡែក' : 'Custom Override Active'
                    : isKhmer ? 'សិទ្ធិតាមតួនាទី' : 'Using Role Defaults'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const nextVal = !useCustomUserPerms
                    setUseCustomUserPerms(nextVal)
                    if (nextVal && editUserPermissions.length === 0) {
                      setEditUserPermissions(getRoleDefaultPermissions(editRole))
                    }
                  }}
                  className={`w-9 h-5 flex items-center rounded-full p-0.5 transition cursor-pointer ${
                    useCustomUserPerms ? 'bg-blue-600' : 'bg-slate-300'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition ${
                      useCustomUserPerms ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              {useCustomUserPerms
                ? isKhmer
                  ? 'អ្នកអាចធីកជ្រើសរើស ឬដកសិទ្ធិចេញពីគណនីនេះបានដោយឡែក។ របារចំហៀង (Sidebar) របស់គាត់នឹងបង្ហាញតែម៉ឺនុយដែលបានផ្ដល់សិទ្ធិប៉ុណ្ណោះ។'
                  : 'Customize individual permissions for this specific user. Their sidebar navigation will strictly follow these granted permissions.'
                : isKhmer
                ? `គណនីនេះនឹងទទួលសិទ្ធិដោយស្វ័យប្រវត្តិតាមតួនាទី ${getSystemRoleLabel(editRole, isKhmer)} (${getRoleDefaultPermissions(editRole).length} សិទ្ធិ)។`
                : `User automatically inherits default permissions assigned to ${getSystemRoleLabel(editRole, isKhmer)} (${getRoleDefaultPermissions(editRole).length} permissions).`}
            </p>

            {useCustomUserPerms && (
              <div className="pt-2 border-t border-gray-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-700">
                    {isKhmer ? 'ជ្រើសរើសសិទ្ធិ៖' : 'Granted Privileges:'} ({editUserPermissions.length})
                  </span>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => {
                        const allKeys: string[] = []
                        permissionsCatalog.forEach((c) => c.permissions.forEach((p: any) => allKeys.push(p.key)))
                        setEditUserPermissions(allKeys)
                      }}
                      className="text-[10px] text-blue-600 hover:underline cursor-pointer"
                    >
                      {isKhmer ? 'ផ្ដល់ទាំងអស់' : 'Grant All'}
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => setEditUserPermissions(getRoleDefaultPermissions(editRole))}
                      className="text-[10px] text-slate-600 hover:underline cursor-pointer"
                    >
                      {isKhmer ? 'កំណត់តាមតួនាទី' : 'Reset to Role Defaults'}
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => setEditUserPermissions([])}
                      className="text-[10px] text-rose-600 hover:underline cursor-pointer"
                    >
                      {isKhmer ? 'ដកទាំងអស់' : 'Clear All'}
                    </button>
                  </div>
                </div>

                <div className="max-h-60 overflow-y-auto space-y-3 pr-1">
                  {permissionsCatalog.map((cat, idx) => (
                    <div key={idx} className="bg-white p-2.5 rounded-xl border border-gray-200/80">
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                        {isKhmer ? cat.categoryKm : cat.category}
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {cat.permissions.map((p: any) => {
                          const isChecked = editUserPermissions.includes(p.key)
                          return (
                            <label
                              key={p.key}
                              className={`flex items-start space-x-2 p-1.5 rounded-lg border text-left cursor-pointer transition ${
                                isChecked
                                  ? 'bg-blue-50/70 border-blue-200 text-blue-900'
                                  : 'bg-slate-50/50 border-gray-100 text-slate-600 hover:bg-slate-100/50'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() =>
                                  togglePermissionInList(editUserPermissions, setEditUserPermissions, p.key)
                                }
                                className="mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                              />
                              <div className="min-w-0">
                                <span className="text-[11px] font-medium block truncate">
                                  {isKhmer ? p.nameKm : p.name}
                                </span>
                                <span className="text-[9px] font-mono text-slate-400 block truncate">
                                  {p.key}
                                </span>
                              </div>
                            </label>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Account Status Toggle */}
          <div className="pt-2 flex items-center justify-between border-t border-gray-100">
            <div>
              <span className="block font-normal text-slate-800 text-xs">
                {isKhmer ? 'ស្ថានភាពគណនី' : 'Account Status'}
              </span>
              <span className="text-[11px] text-slate-400 font-normal">
                {editIsActive
                  ? isKhmer ? 'គណនីអាចចូលប្រើប្រាស់បាន' : 'Account has full login access'
                  : isKhmer ? 'គណនីត្រូវបានផ្អាកមិនអាចចូលបាន' : 'Account is suspended from login'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setEditIsActive(!editIsActive)}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition cursor-pointer ${
                editIsActive ? 'bg-emerald-600' : 'bg-slate-300'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition ${
                  editIsActive ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </form>
      </Dialog>

      {/* ========================================================
          MODAL 2: CONFIGURE ROLE PERMISSIONS (Standard White Dialog)
      ======================================================== */}
      <Dialog
        isOpen={!!editingRole}
        onClose={() => setEditingRole(null)}
        size="xl"
        title={
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center shrink-0">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                {isKhmer
                  ? `កែប្រែសិទ្ធិតួនាទី៖ ${editingRole ? getSystemRoleLabel(editingRole.name, true) : ''}`
                  : `Configure Role: ${editingRole ? getSystemRoleLabel(editingRole.name, false) : ''}`}
              </h3>
              <span className="text-[11px] text-slate-400 font-normal">
                {editingRole?.user_count} {isKhmer ? 'អ្នកប្រើប្រាស់ដែលកំពុងប្រើតួនាទីនេះ' : 'users currently assigned to this role'}
              </span>
            </div>
          </div>
        }
        footer={
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center space-x-2 text-xs text-slate-500">
              <span>
                {rolePermsSelection.length} {isKhmer ? 'សិទ្ធិត្រូវបានជ្រើសរើស' : 'permissions selected'}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setEditingRole(null)}
                className="px-3.5 py-1.5 rounded-xl border border-gray-200 text-xs font-normal text-slate-600 hover:bg-slate-50 transition cursor-pointer"
              >
                {isKhmer ? 'បោះបង់' : 'Cancel'}
              </button>
              <button
                type="button"
                disabled={isSavingRolePerms}
                onClick={handleSaveRolePerms}
                className="px-4 py-1.5 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 transition shadow-2xs cursor-pointer disabled:opacity-60"
              >
                {isSavingRolePerms
                  ? isKhmer ? 'កំពុងរក្សាទុក...' : 'Saving...'
                  : isKhmer ? 'រក្សាទុកសិទ្ធិតួនាទី' : 'Save Role Permissions'}
              </button>
            </div>
          </div>
        }
      >
        <div className="space-y-4 text-xs font-sans">
          {/* Role Description input */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              {isKhmer ? 'ការពិពណ៌នាតួនាទី' : 'Role Description'}
            </label>
            <input
              type="text"
              value={roleDescription}
              onChange={(e) => setRoleDescription(e.target.value)}
              placeholder="Description of responsibilities and access..."
              className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-xl outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 font-normal transition text-slate-800 shadow-2xs"
            />
          </div>

          {/* Quick presets */}
          <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-gray-200">
            <span className="text-xs text-slate-600 font-medium">
              {isKhmer ? 'ជ្រើសរើសសិទ្ធិសម្រាប់តួនាទីនេះ' : 'Toggle Permissions for this Role:'}
            </span>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => {
                  const allKeys: string[] = []
                  permissionsCatalog.forEach((c) => c.permissions.forEach((p: any) => allKeys.push(p.key)))
                  setRolePermsSelection(allKeys)
                }}
                className="text-[11px] text-blue-600 hover:underline font-medium cursor-pointer"
              >
                {isKhmer ? 'ជ្រើសរើសទាំងអស់' : 'Select All'}
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => setRolePermsSelection([])}
                className="text-[11px] text-rose-600 hover:underline font-medium cursor-pointer"
              >
                {isKhmer ? 'ដកចេញទាំងអស់' : 'Deselect All'}
              </button>
            </div>
          </div>

          {/* Categorized Permissions Grid */}
          <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
            {permissionsCatalog.map((cat, cIdx) => (
              <div key={cIdx} className="bg-white rounded-xl border border-gray-200 p-3.5 space-y-2">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                    <Layers className="w-3.5 h-3.5 text-blue-600" />
                    <span>{isKhmer ? cat.categoryKm : cat.category}</span>
                  </h4>
                  <span className="text-[10px] text-slate-400">
                    {cat.permissions.filter((p: any) => rolePermsSelection.includes(p.key)).length} / {cat.permissions.length} {isKhmer ? 'សកម្ម' : 'active'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
                  {cat.permissions.map((p: any) => {
                    const isChecked = rolePermsSelection.includes(p.key)
                    return (
                      <div
                        key={p.key}
                        onClick={() => togglePermissionInList(rolePermsSelection, setRolePermsSelection, p.key)}
                        className={`p-2.5 rounded-xl border flex items-start space-x-2.5 transition cursor-pointer ${
                          isChecked
                            ? 'bg-blue-50/70 border-blue-300 text-blue-900 shadow-2xs'
                            : 'bg-slate-50/50 border-gray-100 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer pointer-events-none"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-xs text-slate-900">
                              {isKhmer ? p.nameKm : p.name}
                            </span>
                            <span className="text-[9px] font-mono text-slate-400 shrink-0">
                              {p.key}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-2">
                            {isKhmer && p.descriptionKm ? p.descriptionKm : p.description}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Dialog>

      {/* ========================================================
          MODAL 3: CREATE USER ACCOUNT (Standard White Dialog)
      ======================================================== */}
      <Dialog
        isOpen={isCreatingUser}
        onClose={() => setIsCreatingUser(false)}
        size="md"
        title={
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center shrink-0">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                {isKhmer ? 'បង្កើតគណនីអ្នកប្រើប្រាស់ថ្មី' : 'Create New User Account'}
              </h3>
              <span className="text-[11px] text-slate-400 font-normal">
                {isKhmer ? 'បញ្ចូលព័ត៌មាន និងកំណត់តួនាទី' : 'Register an account and assign roles'}
              </span>
            </div>
          </div>
        }
        footer={
          <div className="flex items-center justify-end space-x-2 w-full">
            <button
              type="button"
              onClick={() => setIsCreatingUser(false)}
              className="px-3.5 py-1.5 rounded-xl border border-gray-200 text-xs font-normal text-slate-600 hover:bg-slate-50 transition cursor-pointer"
            >
              {isKhmer ? 'បោះបង់' : 'Cancel'}
            </button>
            <button
              type="button"
              disabled={isSubmittingCreate}
              onClick={handleCreateUser}
              className="px-4 py-1.5 rounded-xl text-xs font-normal text-white bg-blue-600 hover:bg-blue-700 active:scale-95 transition shadow-2xs cursor-pointer disabled:opacity-60"
            >
              {isSubmittingCreate
                ? isKhmer ? 'កំពុងបង្កើត...' : 'Creating...'
                : isKhmer ? 'បង្កើតគណនី' : 'Create Account'}
            </button>
          </div>
        }
      >
        <form onSubmit={handleCreateUser} className="space-y-3.5 text-xs font-sans">
          <div>
            <label className="block text-xs font-normal text-slate-700 mb-1">
              {isKhmer ? 'ឈ្មោះពេញ' : 'Full Name'} *
            </label>
            <input
              type="text"
              required
              value={newFullName}
              onChange={(e) => setNewFullName(e.target.value)}
              placeholder="e.g. Sok Dara"
              className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-xl outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition font-normal shadow-2xs text-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-normal text-slate-700 mb-1">
              {isKhmer ? 'អ៊ីមែល' : 'Email Address'} *
            </label>
            <input
              type="email"
              required
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-xl outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition font-normal shadow-2xs text-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-normal text-slate-700 mb-1">
              {isKhmer ? 'ពាក្យសម្ងាត់' : 'Password'} *
            </label>
            <div className="relative">
              <Lock className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min. 6 characters"
                className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-gray-200 rounded-xl outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition font-normal shadow-2xs text-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-normal text-slate-700 mb-1">
              {isKhmer ? 'លេខទូរស័ព្ទ' : 'Phone Number'}
            </label>
            <input
              type="text"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              placeholder="+855 12 345 678"
              className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-xl outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition font-normal shadow-2xs text-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-normal text-slate-700 mb-1.5">
              {isKhmer ? 'កំណត់តួនាទី' : 'Assign Role'} *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(rolesData.length > 0
                ? rolesData.map((r) => ({ key: r.name, perms: r.permissions || [] }))
                : [
                    { key: 'job_seeker', perms: [] },
                    { key: 'employer', perms: ['employer:access'] },
                    { key: 'admin', perms: ['admin:access'] },
                  ]
              ).map((role) => {
                const keyLower = role.key.toLowerCase()
                const isSelected = newRole.toLowerCase() === keyLower
                const Icon =
                  keyLower === 'admin' || role.perms.includes('admin:access')
                    ? ShieldCheck
                    : keyLower === 'employer' || role.perms.includes('employer:access')
                    ? Briefcase
                    : keyLower === 'job_seeker'
                    ? UserIcon
                    : Key
                return (
                  <button
                    key={role.key}
                    type="button"
                    onClick={() => setNewRole(role.key)}
                    className={`p-2.5 rounded-xl border text-left flex items-center space-x-2 transition cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50 border-blue-300 text-blue-700 font-medium'
                        : 'bg-slate-50 border-gray-200 text-slate-600 hover:bg-slate-100 font-normal'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span className="text-[11px] truncate">{getSystemRoleLabel(role.key, isKhmer)}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Company Assignment for Employers */}
          {(newRole === 'employer' || getRoleDefaultPermissions(newRole).includes('employer:access')) && (
            <div className="p-3 bg-slate-50 rounded-xl border border-blue-200/60 space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                <Building className="w-3.5 h-3.5 text-blue-600" />
                <span>{isKhmer ? 'ភ្ជាប់ទៅកាន់ក្រុមហ៊ុន (ជម្រើស)' : 'Assign to Company (Optional)'}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-normal text-slate-600 mb-1">
                    {isKhmer ? 'ក្រុមហ៊ុន' : 'Company'}
                  </label>
                  <select
                    value={newCompanyId || ''}
                    onChange={(e) => setNewCompanyId(e.target.value ? Number(e.target.value) : null)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-200 rounded-lg outline-none focus:border-blue-500 font-normal"
                  >
                    <option value="">-- {isKhmer ? 'គ្មានក្រុមហ៊ុន / ឯករាជ្យ' : 'None / Independent'} --</option>
                    {availableCompanies.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-normal text-slate-600 mb-1">
                    {isKhmer ? 'តួនាទីក្នុងក្រុមហ៊ុន' : 'Role in Company'}
                  </label>
                  <select
                    value={newCompanyRole}
                    onChange={(e) => setNewCompanyRole(e.target.value)}
                    disabled={!newCompanyId}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-200 rounded-lg outline-none focus:border-blue-500 font-normal disabled:opacity-50"
                  >
                    <option value="recruiter">{isKhmer ? 'មន្ត្រីជ្រើសរើស' : 'Recruiter'}</option>
                    <option value="hiring_manager">{isKhmer ? 'ប្រធានផ្នែក' : 'Hiring Manager'}</option>
                    <option value="interviewer">{isKhmer ? 'អ្នកសម្ភាសន៍' : 'Interviewer'}</option>
                    <option value="member">{isKhmer ? 'សមាជិក' : 'Team Member'}</option>
                    <option value="owner">{isKhmer ? 'ម្ចាស់ក្រុមហ៊ុន' : 'Company Owner'}</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </form>
      </Dialog>

      {/* ========================================================
          MODAL 4: VIEW USER DOSSIER (Standard White Dialog)
      ======================================================== */}
      <Dialog
        isOpen={!!viewingUser}
        onClose={() => {
          setViewingUser(null)
          setFullUserDetails(null)
        }}
        size="lg"
        title={
          viewingUser && (
            <div className="flex items-center space-x-3">
              {viewingUser.avatar_url ? (
                <div className="w-10 h-10 rounded-full border border-slate-200/80 bg-white flex items-center justify-center shrink-0 shadow-2xs overflow-hidden">
                  <img
                    src={getAssetUrl(viewingUser.avatar_url)}
                    alt={viewingUser.full_name}
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold text-sm flex items-center justify-center shadow-2xs">
                  {viewingUser.full_name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              )}
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-sm font-bold text-slate-900">{viewingUser.full_name}</h3>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      viewingUser.is_active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    {viewingUser.is_active ? 'Active' : 'Suspended'}
                  </span>
                </div>
                <div className="flex items-center space-x-2 mt-0.5">
                  <span className="text-[11px] text-slate-400 font-normal">ID #{viewingUser.id}</span>
                  <span>•</span>
                  {getRoleBadge(viewingUser)}
                </div>
              </div>
            </div>
          )
        }
        footer={
          <div className="flex items-center justify-end space-x-2 w-full">
            <button
              type="button"
              onClick={() => {
                setViewingUser(null)
                setFullUserDetails(null)
              }}
              className="px-3.5 py-1.5 rounded-xl border border-gray-200 text-xs font-normal text-slate-600 hover:bg-slate-50 transition cursor-pointer"
            >
              {isKhmer ? 'បិទ' : 'Close'}
            </button>
            {viewingUser && (
              <button
                type="button"
                onClick={() => {
                  const target = viewingUser
                  setViewingUser(null)
                  setFullUserDetails(null)
                  openEditModal(target)
                }}
                className="px-4 py-1.5 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition shadow-2xs cursor-pointer flex items-center space-x-1.5"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>{isKhmer ? 'កែប្រែគណនី & សិទ្ធិ' : 'Edit Account & Permissions'}</span>
              </button>
            )}
          </div>
        }
      >
        {viewingUser && (
          <div className="space-y-4 text-xs font-sans">
            {/* Account Overview Box */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50/80 p-3.5 rounded-xl border border-gray-100">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">{isKhmer ? 'អ៊ីមែល' : 'Email Address'}</span>
                <span className="font-mono text-slate-800 text-[11px] font-medium break-all">{viewingUser.email}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">{isKhmer ? 'លេខទូរស័ព្ទ' : 'Phone'}</span>
                <span className="text-slate-800 font-medium">{viewingUser.phone_number || '—'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">{isKhmer ? 'កាលបរិច្ឆេទចុះឈ្មោះ' : 'Registered Date'}</span>
                <span className="text-slate-800 font-medium">{new Date(viewingUser.created_at).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Active Permissions Section */}
            <div className="p-3.5 rounded-xl border border-gray-100 bg-white space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                  <Key className="w-3.5 h-3.5 text-blue-600" />
                  <span>{isKhmer ? 'សិទ្ធិប្រើប្រាស់សកម្ម' : 'Active System Permissions'}</span>
                </span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  viewingUser.has_custom_permissions
                    ? 'bg-purple-50 text-purple-700 border border-purple-200'
                    : 'bg-slate-100 text-slate-700'
                }`}>
                  {viewingUser.has_custom_permissions
                    ? isKhmer ? 'សិទ្ធិកំណត់ដោយឡែក' : 'Custom Override'
                    : isKhmer ? 'សិទ្ធិតាមតួនាទី' : 'Role Inherited'}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {(viewingUser.permissions || []).map((p) => (
                  <span
                    key={p}
                    className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-slate-50 text-slate-700 border border-slate-200"
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>

            {/* Loading indicator for full details */}
            {isLoadingUserDetail && (
              <div className="py-8 text-center text-slate-400">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs">{isKhmer ? 'កំពុងទាញយកព័ត៌មានលម្អិត...' : 'Loading dossier details...'}</p>
              </div>
            )}

            {/* Seeker Profile details if available */}
            {!isLoadingUserDetail && fullUserDetails?.seeker_profile && (
              <div className="space-y-3 pt-1">
                <div className="bg-blue-50/50 p-3.5 rounded-xl border border-blue-100 space-y-2">
                  <div className="flex items-center space-x-2">
                    <Briefcase className="w-4 h-4 text-blue-600" />
                    <h4 className="text-xs font-bold text-slate-900">
                      {fullUserDetails.seeker_profile.headline || (isKhmer ? 'បេក្ខជនស្វែងរកការងារ' : 'Job Candidate')}
                    </h4>
                  </div>
                  {fullUserDetails.seeker_profile.summary && (
                    <p className="text-slate-600 text-xs leading-relaxed italic">
                      "{fullUserDetails.seeker_profile.summary}"
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Employer company details if available */}
            {!isLoadingUserDetail && fullUserDetails?.employer_company && (
              <div className="bg-slate-50 p-3.5 rounded-xl border border-gray-100 space-y-2">
                <div className="flex items-center space-x-2">
                  <Building className="w-4 h-4 text-blue-600" />
                  <h4 className="text-xs font-bold text-slate-900">
                    {fullUserDetails.employer_company.name}
                  </h4>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px] block uppercase">{isKhmer ? 'វិស័យ' : 'Industry'}</span>
                    <span className="text-slate-700 font-medium">{fullUserDetails.employer_company.industry || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block uppercase">{isKhmer ? 'ទីតាំង' : 'Location'}</span>
                    <span className="text-slate-700 font-medium">{fullUserDetails.employer_company.province || 'Phnom Penh'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Dialog>

      {/* ========================================================
          MODAL 5: DELETE CONFIRMATION (Standard White Dialog)
      ======================================================== */}
      <Dialog
        isOpen={!!deletingUser}
        onClose={() => setDeletingUser(null)}
        size="sm"
        title={
          <div className="flex items-center space-x-2 text-rose-600">
            <AlertTriangle className="w-4 h-4" />
            <span className="font-semibold text-sm">
              {isKhmer ? 'លុបគណនីអ្នកប្រើប្រាស់' : 'Delete User Account'}
            </span>
          </div>
        }
        footer={
          <div className="flex items-center justify-end space-x-2 w-full">
            <button
              type="button"
              onClick={() => setDeletingUser(null)}
              className="px-3.5 py-1.5 rounded-xl border border-gray-200 text-xs font-normal text-slate-600 hover:bg-slate-50 transition cursor-pointer"
            >
              {isKhmer ? 'បោះបង់' : 'Cancel'}
            </button>
            <button
              type="button"
              disabled={actionInProgress === deletingUser?.id}
              onClick={handleConfirmDelete}
              className="px-4 py-1.5 rounded-xl text-xs font-normal text-white bg-rose-600 hover:bg-rose-700 active:scale-95 transition shadow-2xs cursor-pointer disabled:opacity-60"
            >
              {actionInProgress === deletingUser?.id
                ? isKhmer ? 'កំពុងលុប...' : 'Deleting...'
                : isKhmer ? 'លុបគណនីជាអចិន្ត្រៃយ៍' : 'Yes, Delete Account'}
            </button>
          </div>
        }
      >
        <p className="text-xs text-slate-600 leading-relaxed font-normal">
          {isKhmer
            ? `តើអ្នកពិតជាចង់លុបគណនី "${deletingUser?.full_name}" (${deletingUser?.email}) មែនទេ? សកម្មភាពនេះមិនអាចត្រឡប់វិញបានឡើយ។`
            : `Are you sure you want to permanently delete "${deletingUser?.full_name}" (${deletingUser?.email})? This action cannot be undone.`}
        </p>
      </Dialog>

      {/* ========================================================
          MODAL 6: CREATE CUSTOM ROLE (Standard White Dialog)
      ======================================================== */}
      <Dialog
        isOpen={isCreateRoleOpen}
        onClose={() => setIsCreateRoleOpen(false)}
        size="xl"
        title={
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center shrink-0">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                {isKhmer ? 'បង្កើតតួនាទីផ្ទាល់ខ្លួនថ្មី' : 'Create Custom Role'}
              </h3>
              <span className="text-[11px] text-slate-400 font-normal">
                {isKhmer
                  ? 'កំណត់ឈ្មោះតួនាទី និងជ្រើសរើសសិទ្ធិប្រើប្រាស់ប្រព័ន្ធ'
                  : 'Define a role identifier and grant initial module permissions'}
              </span>
            </div>
          </div>
        }
        footer={
          <div className="flex items-center justify-between w-full">
            <span className="text-xs text-slate-500">
              {newRolePerms.length} {isKhmer ? 'សិទ្ធិត្រូវបានជ្រើសរើស' : 'permissions selected'}
            </span>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setIsCreateRoleOpen(false)}
                className="px-3.5 py-1.5 rounded-xl border border-gray-200 text-xs font-normal text-slate-600 hover:bg-slate-50 transition cursor-pointer"
              >
                {isKhmer ? 'បោះបង់' : 'Cancel'}
              </button>
              <button
                type="submit"
                form="create-role-form"
                disabled={isCreatingRole}
                className="px-4 py-1.5 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 transition shadow-2xs cursor-pointer disabled:opacity-60"
              >
                {isCreatingRole
                  ? isKhmer ? 'កំពុងបង្កើត...' : 'Creating...'
                  : isKhmer ? 'បង្កើតតួនាទី' : 'Create Role'}
              </button>
            </div>
          </div>
        }
      >
        <form id="create-role-form" onSubmit={handleCreateRole} className="space-y-4 text-xs font-sans">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                {isKhmer ? 'ឈ្មោះតួនាទី (ឧ. moderator)' : 'Role Identifier (e.g. moderator)'} *
              </label>
              <input
                type="text"
                required
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
                placeholder="e.g. moderator, auditor, hr_support"
                className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-xl outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 font-normal transition text-slate-800 shadow-2xs"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                {isKhmer ? 'ការពិពណ៌នា' : 'Role Description'}
              </label>
              <input
                type="text"
                value={newRoleDesc}
                onChange={(e) => setNewRoleDesc(e.target.value)}
                placeholder={isKhmer ? 'តួនាទីត្រួតពិនិត្យការងារ និងក្រុមហ៊ុន...' : 'Short summary of responsibilities...'}
                className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-xl outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 font-normal transition text-slate-800 shadow-2xs"
              />
            </div>
          </div>

          <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-gray-200">
            <span className="text-xs text-slate-600 font-medium">
              {isKhmer ? 'ជ្រើសរើសសិទ្ធិដំបូងសម្រាប់តួនាទីនេះ' : 'Initial Privileges for this Role:'}
            </span>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => {
                  const allKeys: string[] = []
                  permissionsCatalog.forEach((c) => c.permissions.forEach((p: any) => allKeys.push(p.key)))
                  setNewRolePerms(allKeys)
                }}
                className="text-[11px] text-blue-600 hover:underline font-medium cursor-pointer"
              >
                {isKhmer ? 'ជ្រើសរើសទាំងអស់' : 'Select All'}
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => setNewRolePerms([])}
                className="text-[11px] text-rose-600 hover:underline font-medium cursor-pointer"
              >
                {isKhmer ? 'ដកចេញទាំងអស់' : 'Deselect All'}
              </button>
            </div>
          </div>

          <div className="space-y-3 max-h-[45vh] overflow-y-auto pr-1">
            {permissionsCatalog.map((cat, cIdx) => (
              <div key={cIdx} className="bg-white rounded-xl border border-gray-200 p-3 space-y-2">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5 border-b border-gray-100 pb-1.5">
                  <Layers className="w-3.5 h-3.5 text-blue-600" />
                  <span>{isKhmer ? cat.categoryKm : cat.category}</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {cat.permissions.map((p: any) => {
                    const isChecked = newRolePerms.includes(p.key)
                    return (
                      <div
                        key={p.key}
                        onClick={() => togglePermissionInList(newRolePerms, setNewRolePerms, p.key)}
                        className={`p-2 rounded-xl border flex items-start space-x-2 transition cursor-pointer ${
                          isChecked
                            ? 'bg-blue-50/70 border-blue-300 text-blue-900'
                            : 'bg-slate-50/50 border-gray-100 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 pointer-events-none"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-xs text-slate-900">
                              {isKhmer ? p.nameKm : p.name}
                            </span>
                            <span className="text-[9px] font-mono text-slate-400 shrink-0">{p.key}</span>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-2">
                            {isKhmer && p.descriptionKm ? p.descriptionKm : p.description}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </form>
      </Dialog>

      {/* ========================================================
          MODAL 7: DELETE CUSTOM ROLE CONFIRMATION
      ======================================================== */}
      <Dialog
        isOpen={!!deletingRole}
        onClose={() => setDeletingRole(null)}
        size="sm"
        title={
          <div className="flex items-center space-x-2 text-rose-600">
            <AlertTriangle className="w-4 h-4" />
            <span className="font-semibold text-sm">
              {isKhmer ? 'លុបតួនាទីផ្ទាល់ខ្លួន' : 'Delete Custom Role'}
            </span>
          </div>
        }
        footer={
          <div className="flex items-center justify-end space-x-2 w-full">
            <button
              type="button"
              onClick={() => setDeletingRole(null)}
              className="px-3.5 py-1.5 rounded-xl border border-gray-200 text-xs font-normal text-slate-600 hover:bg-slate-50 transition cursor-pointer"
            >
              {isKhmer ? 'បោះបង់' : 'Cancel'}
            </button>
            <button
              type="button"
              disabled={isDeletingRole || (deletingRole?.user_count || 0) > 0}
              onClick={handleConfirmDeleteRole}
              className="px-4 py-1.5 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 active:scale-95 transition shadow-2xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDeletingRole
                ? isKhmer ? 'កំពុងលុប...' : 'Deleting...'
                : isKhmer ? 'បញ្ជាក់ការលុប' : 'Confirm Delete'}
            </button>
          </div>
        }
      >
        <div className="space-y-2.5 text-xs text-slate-600 leading-relaxed font-normal">
          <p>
            {isKhmer
              ? `តើអ្នកពិតជាចង់លុបតួនាទី "${deletingRole?.name}" ចេញពីប្រព័ន្ធមែនទេ?`
              : `Are you sure you want to delete the custom role "${deletingRole?.name}"?`}
          </p>
          {(deletingRole?.user_count || 0) > 0 && (
            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 font-medium">
              {isKhmer
                ? `តួនាទីនេះកំពុងមានអ្នកប្រើប្រាស់ ${deletingRole?.user_count} នាក់។ សូមផ្លាស់ប្តូរតួនាទីរបស់ពួកគេជាមុនសិនមុននឹងលុប។`
                : `This role is still assigned to ${deletingRole?.user_count} user(s). Reassign those users before deleting this role.`}
            </div>
          )}
        </div>
      </Dialog>
    </div>
  )
}
export default AdminUsersPage
