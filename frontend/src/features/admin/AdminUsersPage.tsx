import React, { useEffect, useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth, useToast } from '../../app/providers'
import { adminService } from '../../services/admin.service'
import { exportUsersToExcel } from '../../utils/excelExport'
import { TablePagination } from '../../components/common/TablePagination'
import {
  Users,
  Search,
  UserX,
  UserCheck,
  Mail,
  Phone,
  Calendar,
  Shield,
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
  GraduationCap,
  FileText,
  Award,
  MapPin,
  Building,
  ExternalLink,
  Download,
  FileSpreadsheet,
} from 'lucide-react'
import { getAssetUrl } from '../../utils/assets'

interface UserRecord {
  id: number
  email: string
  full_name: string
  phone_number: string | null
  avatar_url?: string | null
  is_active: boolean
  created_at: string
  updated_at?: string
  role?: string
  roles: string[]
}

export const AdminUsersPage: React.FC = () => {
  const { toast } = useToast()
  const { user: currentUser } = useAuth()
  const { i18n } = useTranslation()
  const isKhmer = i18n.language === 'km'

  const [users, setUsers] = useState<UserRecord[]>([])
  const [searchUser, setSearchUser] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [actionInProgress, setActionInProgress] = useState<number | null>(null)

  // Modal States
  const [viewingUser, setViewingUser] = useState<UserRecord | null>(null)
  const [fullUserDetails, setFullUserDetails] = useState<any | null>(null)
  const [isLoadingUserDetail, setIsLoadingUserDetail] = useState(false)
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null)
  const [deletingUser, setDeletingUser] = useState<UserRecord | null>(null)
  const [isCreatingUser, setIsCreatingUser] = useState(false)

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

  // Form states for Edit (One single role per user)
  const [editFullName, setEditFullName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editIsActive, setEditIsActive] = useState(true)
  const [editRole, setEditRole] = useState<'job_seeker' | 'employer' | 'admin'>('job_seeker')
  const [editPassword, setEditPassword] = useState('')
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false)

  // Form states for Create (One single role per user)
  const [newFullName, setNewFullName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [newRole, setNewRole] = useState<'job_seeker' | 'employer' | 'admin'>('job_seeker')
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false)

  // Copy email feedback
  const [copiedId, setCopiedId] = useState<number | null>(null)

  const loadUsers = async (quiet = false) => {
    if (!quiet) setIsLoading(true)
    else setIsRefreshing(true)

    try {
      const data = await adminService.getUsers()
      setUsers(data || [])
    } catch (err) {
      console.error('Failed to load users:', err)
      toast.error('Error', isKhmer ? 'មិនអាចទាញយកបញ្ជីអ្នកប្រើប្រាស់បានទេ' : 'Failed to load user list.')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  // Helper: Every user has exactly ONE single role
  const getUserRole = (u: UserRecord): 'super_admin' | 'admin' | 'employer' | 'job_seeker' => {
    if (u.id === 1) return 'super_admin'
    const r = (u.role || (u.roles && u.roles[0]) || 'job_seeker').toLowerCase()
    if (r.includes('admin')) return 'admin'
    if (r.includes('employer')) return 'employer'
    return 'job_seeker'
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
    setEditRole(currentRole === 'super_admin' ? 'admin' : currentRole)
    setEditPassword('')
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
    } catch (err: any) {
      const msg = err.response?.data?.email || err.response?.data?.detail || 'Failed to update user.'
      toast.error('Update Failed', String(msg))
    } finally {
      setIsSubmittingEdit(false)
    }
  }

  // Handle Create User Submit (Single Role)
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
      await adminService.createUser({
        full_name: newFullName.trim(),
        email: newEmail.trim().toLowerCase(),
        password: newPassword,
        phone_number: newPhone.trim() || undefined,
        role: newRole,
        roles: [newRole],
      } as any)
      toast.success(
        isKhmer ? 'បានបង្កើតគណនីថ្មី' : 'User Created',
        isKhmer ? `គណនី ${newFullName} ត្រូវបានបង្កើតដោយជោគជ័យ` : `Account for ${newFullName} created successfully.`
      )
      setIsCreatingUser(false)
      // reset form
      setNewFullName('')
      setNewEmail('')
      setNewPassword('')
      setNewPhone('')
      setNewRole('job_seeker')
      loadUsers(true)
    } catch (err: any) {
      const msg = err.response?.data?.email || err.response?.data?.detail || 'Failed to create user.'
      toast.error('Creation Failed', String(msg))
    } finally {
      setIsSubmittingCreate(false)
    }
  }

  // Copy email
  const handleCopyEmail = (u: UserRecord) => {
    navigator.clipboard.writeText(u.email)
    setCopiedId(u.id)
    setTimeout(() => setCopiedId(null), 1800)
  }

  // Single Role Badge renderer - Exactly ONE role per user
  const getRoleBadge = (u: UserRecord) => {
    const role = getUserRole(u)
    if (role === 'super_admin') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-normal bg-amber-50 text-amber-700 border border-amber-200 shadow-2xs">
          <Crown className="w-2.5 h-2.5 text-amber-500" />
          <span>Super Admin</span>
        </span>
      )
    }
    if (role === 'admin') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-normal bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs">
          <ShieldCheck className="w-2.5 h-2.5 text-blue-600" />
          <span>Admin</span>
        </span>
      )
    }
    if (role === 'employer') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-normal bg-sky-50 text-sky-700 border border-sky-200 shadow-2xs">
          <Briefcase className="w-2.5 h-2.5 text-sky-600" />
          <span>Employer</span>
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-normal bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
        <UserIcon className="w-2.5 h-2.5 text-emerald-600" />
        <span>Job Seeker</span>
      </span>
    )
  }

  // Count summaries
  const totalCount = users.length
  const activeCount = useMemo(() => users.filter((u) => u.is_active).length, [users])
  const inactiveCount = useMemo(() => users.filter((u) => !u.is_active).length, [users])

  const handleExportExcel = () => {
    if (!users || users.length === 0) return
    try {
      exportUsersToExcel(filteredUsers, isKhmer)
      toast.success(
        isKhmer ? 'បានទាញយកទិន្នន័យជោគជ័យ' : 'Excel Exported',
        isKhmer
          ? 'ឯកសារ Microsoft Excel (.xlsx) ត្រូវបានទាញយកទៅកាន់ឧបករណ៍របស់អ្នក'
          : 'User accounts exported to Microsoft Excel (.xlsx).'
      )
    } catch (err) {
      toast.error('Export Failed', 'Could not export user accounts.')
    }
  }

  if (isLoading) {
    return (
      <div className="py-28 text-center font-sans">
        <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="mt-3.5 text-xs font-semibold text-slate-500">
          {isKhmer ? 'កំពុងដំណើរការទាញយកទិន្នន័យ...' : 'Loading user records...'}
        </p>
      </div>
    )
  }

  return (
    <div className="w-full space-y-3.5 font-sans pb-12">
      {/* 1. Header Bar: Title on left, Search & Create on right (Following Job Categories UI) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-2xs">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              {isKhmer ? 'គ្រប់គ្រងអ្នកប្រើប្រាស់' : 'User Management'}
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-gray-200">
              <Users className="w-3 h-3 text-blue-600" />
              <span>{totalCount} {isKhmer ? 'គណនីសរុប' : 'Total'}</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {isKhmer
              ? 'ត្រួតពិនិត្យ និងគ្រប់គ្រងសិទ្ធិប្រើប្រាស់គណនីក្នុងប្រព័ន្ធ'
              : 'Govern user credentials, roles, account status, and platform access'}
          </p>
        </div>

        {/* Search Input, Export & Create User Button */}
        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto w-full sm:w-auto">
          <div className="relative w-full sm:w-64 md:w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchUser}
              onChange={(e) => setSearchUser(e.target.value)}
              placeholder={
                isKhmer
                  ? 'ស្វែងរកឈ្មោះ, អ៊ីមែល ឬលេខ...'
                  : 'Search name, email, or phone...'
              }
              className="w-full pl-8 pr-8 py-1.5 text-xs bg-slate-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-blue-500 font-medium transition text-slate-800 shadow-2xs"
            />
            {searchUser && (
              <button
                type="button"
                onClick={() => setSearchUser('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={handleExportExcel}
            disabled={users.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold shadow-2xs transition cursor-pointer shrink-0 disabled:opacity-50"
            title={isKhmer ? 'ទាញយកទិន្នន័យជា Excel (.xlsx)' : 'Export users to Microsoft Excel (.xlsx)'}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>{isKhmer ? 'នាំចេញជា Excel' : 'Export Excel'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsCreatingUser(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition shadow-2xs cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5 text-white" />
            <span>{isKhmer ? 'បង្កើតគណនី' : 'Add User'}</span>
          </button>
        </div>
      </div>

      {/* 2. Filter Toolbar (Clean pills matching Job Categories UI) */}
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

      {/* Main SaaS Data Table (Clean, Compact, standard padding & typography) */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-gray-200 text-slate-500 uppercase tracking-wider font-normal text-[10px]">
                <th className="py-2.5 px-4 font-normal">{isKhmer ? 'អ្នកប្រើប្រាស់' : 'User Account'}</th>
                <th className="py-2.5 px-3.5 font-normal">{isKhmer ? 'តួនាទី' : 'Role'}</th>
                <th className="py-2.5 px-3.5 font-normal">{isKhmer ? 'លេខទូរស័ព្ទ' : 'Phone'}</th>
                <th className="py-2.5 px-3.5 font-normal">{isKhmer ? 'កាលបរិច្ឆេទបង្កើត' : 'Joined Date'}</th>
                <th className="py-2.5 px-3.5 font-normal">{isKhmer ? 'ស្ថានភាព' : 'Status'}</th>
                <th className="py-2.5 px-4 font-normal text-right">{isKhmer ? 'សកម្មភាព' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-sans">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-400">
                    <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="text-xs font-normal text-slate-700">
                      {isKhmer ? 'រកមិនឃើញគណនីអ្នកប្រើប្រាស់ទេ' : 'No user records found'}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {isKhmer
                        ? 'សូមសាកល្បងស្វែងរកដោយពាក្យគន្លឹះផ្សេង'
                        : 'Try adjusting your search query.'}
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
                    const role = getUserRole(u)

                    return (
                      <tr
                        key={u.id}
                        className="hover:bg-slate-50/80 transition-colors group"
                      >

                        {/* User Account */}
                        <td className="py-2.5 px-3.5 align-middle font-normal">
                          <div className="flex items-center space-x-2.5">
                            {u.avatar_url ? (
                              <div className="w-8 h-8 rounded-full border border-slate-200/80 bg-white flex items-center justify-center shrink-0 shadow-2xs overflow-hidden">
                                <img
                                  src={getAssetUrl(u.avatar_url)}
                                  alt={u.full_name}
                                  className="w-full h-full object-cover rounded-full"
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.display = 'none'
                                  }}
                                />
                              </div>
                            ) : (
                              <div
                                className={`w-8 h-8 rounded-full text-white font-medium text-xs flex items-center justify-center shrink-0 shadow-2xs ${isRootAdmin
                                  ? 'bg-amber-500 ring-2 ring-amber-200'
                                  : role === 'admin'
                                    ? 'bg-blue-600'
                                    : role === 'employer'
                                      ? 'bg-sky-600'
                                      : 'bg-emerald-600'
                                  }`}
                              >
                                {u.full_name?.charAt(0)?.toUpperCase() || 'U'}
                              </div>
                            )}
                            <div className="min-w-0 max-w-xs">
                              <div className="flex items-center space-x-1.5">
                                <h4 className="font-medium text-slate-800 group-hover:text-blue-600 transition-colors truncate text-xs">
                                  {u.full_name}
                                </h4>
                                {isSelf && (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-normal bg-blue-100 text-blue-800 uppercase">
                                    {isKhmer ? 'អ្នក' : 'You'}
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-400 font-normal flex items-center space-x-1 mt-0.5">
                                <Mail className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                                <span className="truncate">{u.email}</span>
                                <button
                                  type="button"
                                  onClick={() => handleCopyEmail(u)}
                                  className="text-slate-400 hover:text-slate-600 cursor-pointer ml-1"
                                  title="Copy Email"
                                >
                                  {copiedId === u.id ? (
                                    <Check className="w-2.5 h-2.5 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-2.5 h-2.5" />
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Role Badges (Exactly one role per user) */}
                        <td className="py-2.5 px-3.5 align-middle whitespace-nowrap font-normal">
                          {getRoleBadge(u)}
                        </td>

                        {/* Phone */}
                        <td className="py-2.5 px-3.5 align-middle text-slate-600 whitespace-nowrap font-normal">
                          <div className="flex items-center space-x-1">
                            <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{u.phone_number || '—'}</span>
                          </div>
                        </td>

                        {/* Joined Date */}
                        <td className="py-2.5 px-3.5 align-middle text-slate-600 whitespace-nowrap font-normal">
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{new Date(u.created_at).toLocaleDateString()}</span>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-2.5 px-3.5 align-middle whitespace-nowrap font-normal">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-normal border ${u.is_active
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                              }`}
                          >
                            {u.is_active ? (
                              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                            ) : (
                              <XCircle className="w-2.5 h-2.5 text-rose-600" />
                            )}
                            <span>
                              {u.is_active
                                ? isKhmer ? 'សកម្ម' : 'Active'
                                : isKhmer ? 'បានផ្អាក' : 'Suspended'}
                            </span>
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-2.5 px-3.5 align-middle text-right whitespace-nowrap font-normal">
                          <div className="flex items-center justify-end space-x-1">
                            {/* 1. View Button */}
                            <button
                              type="button"
                              onClick={() => handleOpenViewUser(u)}
                              className="p-1 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer"
                              title={isKhmer ? 'មើលព័ត៌មានលម្អិត' : 'View Account Details'}
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {/* 2. Edit Button */}
                            <button
                              type="button"
                              onClick={() => openEditModal(u)}
                              className="p-1 rounded-lg text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition cursor-pointer"
                              title={isKhmer ? 'កែប្រែព័ត៌មាន' : 'Edit User & Roles'}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>

                            {/* 3. Toggle Status Button */}
                            <button
                              type="button"
                              disabled={!canDeleteOrSuspend || actionInProgress === u.id}
                              onClick={() => handleToggleUserStatus(u.id, u.is_active)}
                              className={`p-1 rounded-lg transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${u.is_active
                                ? 'text-amber-600 hover:text-amber-800 hover:bg-amber-50'
                                : 'text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50'
                                }`}
                              title={
                                !canDeleteOrSuspend
                                  ? 'Protected'
                                  : u.is_active
                                    ? isKhmer ? 'ផ្អាកគណនី' : 'Suspend Account'
                                    : isKhmer ? 'បើកដំណើរការឡើងវិញ' : 'Reactivate Account'
                              }
                            >
                              {u.is_active ? (
                                <UserX className="w-3.5 h-3.5" />
                              ) : (
                                <UserCheck className="w-3.5 h-3.5" />
                              )}
                            </button>

                            {/* 4. Delete Button */}
                            <button
                              type="button"
                              disabled={!canDeleteOrSuspend || actionInProgress === u.id}
                              onClick={() => setDeletingUser(u)}
                              className="p-1 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                              title={
                                !canDeleteOrSuspend
                                  ? isKhmer ? 'មិនអាចលុបគណនីនេះបានទេ' : 'Root super admin & own account cannot be deleted'
                                  : isKhmer ? 'លុបគណនី' : 'Delete Account'
                              }
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Pagination: Left Select 25 50 100, Right buttons */}
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

      {/* ==================== MODAL 1: VIEW USER / CANDIDATE DOSSIER ==================== */}
      {viewingUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
              <div className="flex items-center space-x-3">
                {viewingUser.avatar_url ? (
                  <div className="w-11 h-11 rounded-full border border-slate-200/80 bg-white flex items-center justify-center shrink-0 shadow-2xs overflow-hidden">
                    <img
                      src={getAssetUrl(viewingUser.avatar_url)}
                      alt={viewingUser.full_name}
                      className="w-full h-full object-cover rounded-full"
                    />
                  </div>
                ) : (
                  <div className="w-11 h-11 rounded-full bg-blue-600 text-white font-bold text-base flex items-center justify-center shadow-2xs">
                    {viewingUser.full_name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                )}
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-base font-bold text-slate-900">{viewingUser.full_name}</h3>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${viewingUser.is_active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                    >
                      {viewingUser.is_active ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Active</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3 text-rose-600" />
                          <span>Suspended</span>
                        </>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 mt-0.5">
                    <span className="text-[11px] text-slate-400 font-normal">ID #{viewingUser.id}</span>
                    <span>•</span>
                    <div className="scale-90 origin-left">
                      {getRoleBadge(viewingUser)}
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setViewingUser(null)
                  setFullUserDetails(null)
                }}
                className="w-7 h-7 rounded-lg bg-white hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition cursor-pointer border border-gray-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs font-sans">
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

              {/* Loading indicator for full details */}
              {isLoadingUserDetail && (
                <div className="py-8 text-center text-slate-400">
                  <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-xs">{isKhmer ? 'កំពុងទាញយកព័ត៌មានលម្អិតបេក្ខជន/ក្រុមហ៊ុន...' : 'Loading candidate & organization dossier...'}</p>
                </div>
              )}

              {/* SECTION: JOB SEEKER DOSSIER */}
              {!isLoadingUserDetail && fullUserDetails?.seeker_profile && (
                <div className="space-y-4 pt-1">
                  {/* Headline & Bio */}
                  <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        <Briefcase className="w-4 h-4 text-blue-600" />
                        <h4 className="text-xs font-bold text-slate-900">
                          {fullUserDetails.seeker_profile.headline || (isKhmer ? 'បេក្ខជនស្វែងរកការងារ' : 'Job Candidate')}
                        </h4>
                      </div>
                      <div className="flex items-center space-x-2 text-[11px] text-slate-600">
                        {fullUserDetails.seeker_profile.province && (
                          <span className="flex items-center space-x-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            <span>{fullUserDetails.seeker_profile.province}</span>
                          </span>
                        )}
                        {fullUserDetails.seeker_profile.expected_salary && (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                            ${fullUserDetails.seeker_profile.expected_salary} / {fullUserDetails.seeker_profile.salary_currency || 'USD'}
                          </span>
                        )}
                      </div>
                    </div>
                    {fullUserDetails.seeker_profile.summary && (
                      <p className="text-slate-600 leading-relaxed text-xs border-t border-blue-100/60 pt-2">
                        {fullUserDetails.seeker_profile.summary}
                      </p>
                    )}
                  </div>

                  {/* Skills */}
                  {fullUserDetails.seeker_profile.skills && fullUserDetails.seeker_profile.skills.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                        <Award className="w-3.5 h-3.5 text-blue-600" />
                        <span>{isKhmer ? 'ជំនាញ និងកម្រិតសមត្ថភាព' : 'Candidate Skills & Proficiencies'}</span>
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {fullUserDetails.seeker_profile.skills.map((s: any) => (
                          <span
                            key={s.id}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200"
                          >
                            <span>{s.name}</span>
                            {s.proficiency_level && (
                              <span className="text-[10px] text-blue-600 font-semibold uppercase">
                                ({s.proficiency_level})
                              </span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Work Experience */}
                  {fullUserDetails.seeker_profile.work_experiences && fullUserDetails.seeker_profile.work_experiences.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                        <Briefcase className="w-3.5 h-3.5 text-blue-600" />
                        <span>{isKhmer ? 'បទពិសោធន៍ការងារ' : 'Work Experience'}</span>
                      </h4>
                      <div className="space-y-2">
                        {fullUserDetails.seeker_profile.work_experiences.map((we: any) => (
                          <div key={we.id} className="p-3 rounded-xl bg-slate-50 border border-gray-100 space-y-1">
                            <div className="flex items-center justify-between font-semibold text-slate-900 text-xs">
                              <span>{we.job_title} • <strong className="text-blue-600">{we.company_name}</strong></span>
                              <span className="text-[10px] text-slate-400 font-normal">
                                {we.start_date} - {we.is_current ? (isKhmer ? 'បច្ចុប្បន្ន' : 'Present') : we.end_date || '—'}
                              </span>
                            </div>
                            {we.location && (
                              <span className="text-[10px] text-slate-400 flex items-center space-x-1">
                                <MapPin className="w-3 h-3" />
                                <span>{we.location}</span>
                              </span>
                            )}
                            {we.description && (
                              <p className="text-slate-600 text-[11px] leading-relaxed pt-1">{we.description}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Education */}
                  {fullUserDetails.seeker_profile.educations && fullUserDetails.seeker_profile.educations.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                        <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
                        <span>{isKhmer ? 'ប្រវត្តិការសិក្សា' : 'Education History'}</span>
                      </h4>
                      <div className="space-y-2">
                        {fullUserDetails.seeker_profile.educations.map((edu: any) => (
                          <div key={edu.id} className="p-3 rounded-xl bg-slate-50 border border-gray-100 space-y-0.5">
                            <div className="flex items-center justify-between font-semibold text-slate-900 text-xs">
                              <span>{edu.degree} in {edu.field_of_study || 'General Studies'}</span>
                              <span className="text-[10px] text-slate-400 font-normal">
                                {edu.start_date} - {edu.end_date || 'Graduated'}
                              </span>
                            </div>
                            <p className="text-blue-600 text-xs font-medium">{edu.institution}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Resumes & CVs */}
                  {fullUserDetails.seeker_profile.resumes && fullUserDetails.seeker_profile.resumes.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                        <FileText className="w-3.5 h-3.5 text-blue-600" />
                        <span>{isKhmer ? 'ប្រវត្តិរូបសង្ខេប (CV / Resumes)' : 'Uploaded Resumes'}</span>
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {fullUserDetails.seeker_profile.resumes.map((cv: any) => (
                          <div key={cv.id} className="p-3 rounded-xl bg-slate-50 border border-gray-100 flex items-center justify-between">
                            <div className="flex items-center space-x-2 min-w-0">
                              <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                              <div className="min-w-0">
                                <p className="font-semibold text-slate-900 text-xs truncate">{cv.title || 'Resume File'}</p>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  {cv.file_size ? `${Math.round(cv.file_size / 1024)} KB` : 'PDF'} • {cv.is_primary ? 'Primary CV' : 'Secondary'}
                                </span>
                              </div>
                            </div>
                            {cv.file_path && (
                              <a
                                href={cv.file_path}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 rounded-lg bg-white border border-gray-200 text-slate-600 hover:text-blue-600 shadow-2xs transition"
                                title="Download CV"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* SECTION: EMPLOYER COMPANY DETAILS */}
              {!isLoadingUserDetail && fullUserDetails?.employer_company && (
                <div className="bg-slate-50/80 p-4 rounded-xl border border-gray-100 space-y-3">
                  <div className="flex items-center space-x-2">
                    <Building className="w-4 h-4 text-blue-600" />
                    <h4 className="text-xs font-bold text-slate-900">
                      {isKhmer ? 'ក្រុមហ៊ុននិយោជកដែលគ្រប់គ្រង' : 'Associated Employer Company'}
                    </h4>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-400 text-[10px] block uppercase font-semibold">{isKhmer ? 'ឈ្មោះក្រុមហ៊ុន' : 'Company Name'}</span>
                      <span className="font-bold text-slate-900 text-xs">{fullUserDetails.employer_company.name}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block uppercase font-semibold">{isKhmer ? 'ស្ថានភាពផ្ទៀងផ្ទាត់' : 'Verification Status'}</span>
                      <span className={`inline-flex items-center gap-1 font-semibold text-xs ${fullUserDetails.employer_company.verification_status === 'verified'
                        ? 'text-emerald-700'
                        : 'text-amber-700'
                        }`}>
                        {fullUserDetails.employer_company.verification_status === 'verified' ? 'Verified' : 'Pending Approval'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block uppercase font-semibold">{isKhmer ? 'វិស័យ' : 'Industry'}</span>
                      <span className="text-slate-700">{fullUserDetails.employer_company.industry || '—'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block uppercase font-semibold">{isKhmer ? 'ទីតាំង' : 'Location'}</span>
                      <span className="text-slate-700">{fullUserDetails.employer_company.province || 'Phnom Penh'}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 bg-slate-50 border-t border-gray-100 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => {
                  setViewingUser(null)
                  setFullUserDetails(null)
                }}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 border border-gray-200 hover:bg-white transition cursor-pointer shadow-2xs"
              >
                {isKhmer ? 'បិទ' : 'Close'}
              </button>
              <button
                type="button"
                onClick={() => {
                  const target = viewingUser
                  setViewingUser(null)
                  setFullUserDetails(null)
                  openEditModal(target)
                }}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition cursor-pointer shadow-2xs"
              >
                {isKhmer ? 'កែប្រែគណនី' : 'Edit This User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL 2: EDIT USER ==================== */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center">
                  <Pencil className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-slate-900">
                    {isKhmer ? 'កែប្រែគណនីអ្នកប្រើប្រាស់' : 'Edit User Account'}
                  </h3>
                  <span className="text-[11px] text-slate-400 font-normal">ID #{editingUser.id} • {editingUser.email}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="w-7 h-7 rounded-lg bg-white hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition cursor-pointer border border-gray-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-5 space-y-3.5 text-xs font-sans">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-normal text-slate-700 mb-1">
                  {isKhmer ? 'ឈ្មោះពេញ' : 'Full Name'} *
                </label>
                <input
                  type="text"
                  required
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-blue-500 font-normal transition text-slate-800"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-normal text-slate-700 mb-1">
                  {isKhmer ? 'អ៊ីមែល' : 'Email Address'} *
                </label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-blue-500 font-normal transition text-slate-800"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-normal text-slate-700 mb-1">
                  {isKhmer ? 'លេខទូរស័ព្ទ' : 'Phone Number'}
                </label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="+855 12 345 678"
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-blue-500 font-normal transition text-slate-800"
                />
              </div>

              {/* Role Assignment - One Single Role Only */}
              <div>
                <label className="block text-xs font-normal text-slate-700 mb-1.5">
                  {isKhmer ? 'កំណត់តួនាទី (មួយគត់)' : 'User Role (Single Role)'} *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: 'job_seeker', label: isKhmer ? 'បេក្ខជន' : 'Job Seeker', icon: UserIcon },
                    { key: 'employer', label: isKhmer ? 'និយោជក' : 'Employer', icon: Briefcase },
                    { key: 'admin', label: isKhmer ? 'អភិបាល' : 'Admin', icon: Shield },
                  ].map((role) => {
                    const isSelected = editRole === role.key
                    const Icon = role.icon
                    return (
                      <button
                        key={role.key}
                        type="button"
                        onClick={() => setEditRole(role.key as any)}
                        className={`p-2 rounded-xl border text-left flex items-center space-x-2 transition cursor-pointer ${isSelected
                          ? 'bg-blue-50 border-blue-400 text-blue-700 shadow-2xs font-normal'
                          : 'bg-white border-gray-200 text-slate-600 hover:bg-slate-50 font-normal'
                          }`}
                      >
                        <Icon className="w-3.5 h-3.5 shrink-0" />
                        <span className="text-[11px]">{role.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Reset Password */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-normal text-slate-700">
                    {isKhmer ? 'ប្ដូរពាក្យសម្ងាត់' : 'Reset Password'}
                  </label>
                  <span className="text-[10px] text-slate-400 font-normal">
                    {isKhmer ? 'ទុកនៅទទេបើមិនចង់ប្ដូរ' : 'Leave empty to keep unchanged'}
                  </span>
                </div>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    placeholder={isKhmer ? 'បញ្ចូលពាក្យសម្ងាត់ថ្មី (យ៉ាងហោច ៦ តួ)' : 'Enter new password (min. 6 characters)'}
                    className="w-full pl-8 pr-3.5 py-1.5 text-xs bg-slate-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-blue-500 font-normal transition text-slate-800"
                  />
                </div>
              </div>

              {/* Status Toggle */}
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
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition cursor-pointer ${editIsActive ? 'bg-emerald-600' : 'bg-slate-300'
                    }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition ${editIsActive ? 'translate-x-5' : 'translate-x-0'
                      }`}
                  />
                </button>
              </div>

              {/* Modal Buttons */}
              <div className="pt-3 flex items-center justify-end space-x-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-3.5 py-1.5 rounded-xl border border-gray-200 text-xs font-normal text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  {isKhmer ? 'បោះបង់' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEdit}
                  className="px-4 py-1.5 rounded-xl text-xs font-normal text-white bg-blue-600 hover:bg-blue-700 active:scale-95 transition shadow-2xs cursor-pointer disabled:opacity-60"
                >
                  {isSubmittingEdit
                    ? isKhmer ? 'កំពុងរក្សាទុក...' : 'Saving...'
                    : isKhmer ? 'រក្សាទុកការកែប្រែ' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL 3: CREATE USER ==================== */}
      {isCreatingUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-slate-900">
                    {isKhmer ? 'បង្កើតគណនីអ្នកប្រើប្រាស់ថ្មី' : 'Create New User Account'}
                  </h3>
                  <span className="text-[11px] text-slate-400 font-normal">
                    {isKhmer ? 'បញ្ចូលព័ត៌មាន និងកំណត់សិទ្ធិតែមួយ' : 'Register an account and assign a single role'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreatingUser(false)}
                className="w-7 h-7 rounded-lg bg-white hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition cursor-pointer border border-gray-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-5 space-y-3.5 text-xs font-sans">
              {/* Full Name */}
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
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-blue-500 transition font-normal"
                />
              </div>

              {/* Email */}
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
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-blue-500 transition font-normal"
                />
              </div>

              {/* Password */}
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
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-blue-500 transition font-normal"
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-normal text-slate-700 mb-1">
                  {isKhmer ? 'លេខទូរស័ព្ទ' : 'Phone Number'}
                </label>
                <input
                  type="text"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="+855 12 345 678"
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-blue-500 transition font-normal"
                />
              </div>

              {/* Role (Single Role Enforced) */}
              <div>
                <label className="block text-xs font-normal text-slate-700 mb-1.5">
                  {isKhmer ? 'កំណត់តួនាទី' : 'Assign Role'} *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: 'job_seeker', label: 'Job Seeker', icon: UserIcon },
                    { key: 'employer', label: 'Employer', icon: Briefcase },
                    { key: 'admin', label: 'Admin', icon: Shield },
                  ].map((role) => {
                    const isSelected = newRole === role.key
                    const Icon = role.icon
                    return (
                      <button
                        key={role.key}
                        type="button"
                        onClick={() => setNewRole(role.key as 'job_seeker' | 'employer' | 'admin')}
                        className={`p-2.5 rounded-xl border text-left flex items-center space-x-2 transition cursor-pointer ${isSelected
                          ? 'bg-blue-50 border-blue-300 text-blue-700 font-medium'
                          : 'bg-slate-50 border-gray-200 text-slate-600 hover:bg-slate-100 font-normal'
                          }`}
                      >
                        <Icon className="w-3.5 h-3.5 shrink-0" />
                        <span className="text-[11px]">{role.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="pt-3 flex items-center justify-end space-x-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsCreatingUser(false)}
                  className="px-3.5 py-1.5 rounded-xl border border-gray-200 text-xs font-normal text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  {isKhmer ? 'បោះបង់' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCreate}
                  className="px-4 py-1.5 rounded-xl text-xs font-normal text-white bg-blue-600 hover:bg-blue-700 active:scale-95 transition shadow-2xs cursor-pointer disabled:opacity-60"
                >
                  {isSubmittingCreate
                    ? isKhmer ? 'កំពុងបង្កើត...' : 'Creating...'
                    : isKhmer ? 'បង្កើតគណនី' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL 4: DELETE CONFIRMATION ==================== */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 text-center">
              <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center mx-auto mb-3">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-medium text-slate-900">
                {isKhmer ? 'តើអ្នកប្រាកដជាចង់លុបគណនីនេះ?' : 'Permanently Delete User?'}
              </h3>
              <p className="text-xs text-slate-500 font-normal mt-1.5 leading-relaxed">
                {isKhmer
                  ? `គណនី "${deletingUser.full_name}" (${deletingUser.email}) នឹងត្រូវបានលុបចេញជាអចិន្ត្រៃយ៍ពីប្រព័ន្ធ។ សកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ។`
                  : `Are you sure you want to permanently delete "${deletingUser.full_name}" (${deletingUser.email})? All associated seeker or employer profiles will be removed.`}
              </p>
            </div>

            <div className="p-4 bg-slate-50/60 border-t border-gray-100 flex items-center justify-center space-x-2.5">
              <button
                type="button"
                onClick={() => setDeletingUser(null)}
                className="px-3.5 py-1.5 rounded-xl border border-gray-200 text-xs font-normal text-slate-600 hover:bg-white transition cursor-pointer"
              >
                {isKhmer ? 'បោះបង់' : 'Cancel'}
              </button>
              <button
                type="button"
                disabled={actionInProgress === deletingUser.id}
                onClick={handleConfirmDelete}
                className="px-4 py-1.5 rounded-xl text-xs font-normal text-white bg-rose-600 hover:bg-rose-700 active:scale-95 transition shadow-2xs cursor-pointer disabled:opacity-60"
              >
                {actionInProgress === deletingUser.id
                  ? isKhmer ? 'កំពុងលុប...' : 'Deleting...'
                  : isKhmer ? 'លុបគណនីជាអចិន្ត្រៃយ៍' : 'Yes, Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
