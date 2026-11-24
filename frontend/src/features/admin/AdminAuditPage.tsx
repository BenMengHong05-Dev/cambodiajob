import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { adminService } from '../../services/admin.service'
import { TablePagination } from '../../components/common/TablePagination'
import { AdminPageHeader } from '../../components/layout/dashboard'
import { Dialog } from '../../components/ui/Dialog'
import {
  FileSearch,
  Eye,
  Clock,
  Copy,
  Check,
  Shield,
  ShieldCheck,
  Building,
  Briefcase,
  User,
  Users,
  Settings,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Globe,
  FolderTree,
  Image as ImageIcon,
  Sliders,
  Sparkles,
  ArrowRight,
  ExternalLink,
} from 'lucide-react'

// Friendly permission dictionary
const PERMISSION_LABELS: Record<string, { km: string; en: string }> = {
  'admin:access': { km: 'ចូលប្រើប្រព័ន្ធគ្រប់គ្រង', en: 'Admin Portal Access' },
  'users:manage': { km: 'គ្រប់គ្រងគណនីអ្នកប្រើប្រាស់', en: 'Manage User Accounts' },
  'categories:manage': { km: 'គ្រប់គ្រងផ្នែកការងារ និងជំនាញ', en: 'Manage Job Categories' },
  'companies:verify': { km: 'ផ្ទៀងផ្ទាត់ និងអនុម័តក្រុមហ៊ុន', en: 'Verify & Approve Companies' },
  'jobs:moderate': { km: 'ត្រួតពិនិត្យ និងអនុម័តការងារ', en: 'Moderate Job Postings' },
  'audit:view': { km: 'មើលកំណត់ត្រាសវនកម្មប្រព័ន្ធ', en: 'View System Audit Trail' },
  'settings:manage': { km: 'គ្រប់គ្រងការកំណត់គេហទំព័រ', en: 'Manage Site Settings' },
  'notifications:view': { km: 'មើល និងគ្រប់គ្រងការជូនដំណឹង', en: 'View & Manage Notifications' },
}

export const AdminAuditPage: React.FC = () => {
  const { i18n } = useTranslation()
  const isKhmer = i18n.language === 'km'

  const [auditLogs, setAuditLogs] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [entityFilter, setEntityFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [isLoading, setIsLoading] = useState(true)

  // Selected Log for Inspector Modal
  const [selectedLog, setSelectedLog] = useState<any | null>(null)
  const [copiedPayload, setCopiedPayload] = useState(false)

  const loadLogs = async () => {
    setIsLoading(true)
    try {
      const data = await adminService.getAuditLogs()
      setAuditLogs(data || [])
    } catch (err) {
      console.error('Failed to load audit logs:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadLogs()
  }, [])

  // Safely parse details
  const parseDetails = (raw: any): any => {
    if (!raw) return null
    if (typeof raw === 'object') return raw
    try {
      return JSON.parse(raw)
    } catch {
      return null
    }
  }

  // Format relative time
  const formatTimeAgo = (dateStr: string) => {
    if (!dateStr) return ''
    const now = new Date().getTime()
    const past = new Date(dateStr).getTime()
    const diff = Math.max(0, Math.floor((now - past) / 1000))

    if (diff < 60) return isKhmer ? 'មុននេះបន្តិច' : 'Just now'
    if (diff < 3600) {
      const mins = Math.floor(diff / 60)
      return isKhmer ? `${mins} នាទីមុន` : `${mins}m ago`
    }
    if (diff < 86400) {
      const hours = Math.floor(diff / 3600)
      return isKhmer ? `${hours} ម៉ោងមុន` : `${hours}h ago`
    }
    const days = Math.floor(diff / 86400)
    if (days === 1) return isKhmer ? 'ម្សិលមិញ' : 'Yesterday'
    if (days < 30) return isKhmer ? `${days} ថ្ងៃមុន` : `${days}d ago`
    return new Date(dateStr).toLocaleDateString()
  }

  // Interpret human-readable activity info
  const getLogInfo = (log: any) => {
    const act = (log.action || '').toLowerCase()
    const details = parseDetails(log.details) || {}
    const targetName = log.target_name || details.deleted_company_name || details.company_name || details.deleted_job_title || details.job_title || details.name || details.role || (details.email ? details.email : '')
    const targetId = log.entity_id ? `#${log.entity_id}` : ''

    // Role permissions
    if (act.includes('role')) {
      const roleName = details.role || details.name || targetName || (isKhmer ? 'តួនាទី' : 'Role')
      const permCount = Array.isArray(details.permissions) ? details.permissions.length : 0
      return {
        badgeText: isKhmer ? 'សិទ្ធិតួនាទី' : 'ROLE PERMISSIONS',
        badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        icon: Shield,
        iconBg: 'bg-indigo-50 text-indigo-600 border-indigo-100',
        title: act.includes('create')
          ? isKhmer ? 'បង្កើតតួនាទីថ្មី' : 'Created System Role'
          : isKhmer ? 'កែប្រែសិទ្ធិតួនាទី' : 'Updated Role Permissions',
        description: isKhmer
          ? `បានកែសម្រួលសិទ្ធិចំនួន ${permCount} សម្រាប់តួនាទី "${roleName}"`
          : `Configured ${permCount} permissions for "${roleName}" role`,
        targetLabel: isKhmer ? 'តួនាទី' : 'Role',
        targetName: `${roleName} ${targetId}`.trim(),
        category: 'role',
      }
    }

    // Site settings & branding
    if (act.includes('settings') || act.includes('logo')) {
      const isLogo = act.includes('logo')
      return {
        badgeText: isKhmer ? 'ការកំណត់គេហទំព័រ' : 'SITE CONFIGURATION',
        badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
        icon: isLogo ? ImageIcon : Settings,
        iconBg: 'bg-purple-50 text-purple-600 border-purple-100',
        title: isLogo
          ? isKhmer ? 'ផ្ទុកឡើងរូបសញ្ញាគេហទំព័រ' : 'Uploaded Site Logo'
          : isKhmer ? 'កែប្រែការកំណត់គេហទំព័រ' : 'Updated Site Settings',
        description: isLogo
          ? isKhmer ? `បានផ្លាស់ប្តូររូបសញ្ញា ${details.type || 'Branding'} របស់ប្រព័ន្ធ` : `Updated ${details.type || 'Branding'} asset`
          : isKhmer ? 'បានធ្វើបច្ចុប្បន្នភាពព័ត៌មាន និងការកំណត់ទូទៅរបស់ប្រព័ន្ធ' : 'Updated platform configuration and metadata',
        targetLabel: isKhmer ? 'ការកំណត់' : 'Settings',
        targetName: isKhmer ? 'ប្រព័ន្ធទូទៅ (Site Settings)' : 'System Settings',
        category: 'settings',
      }
    }

    // Company operations
    if (act.includes('company') || log.entity_type === 'company') {
      const cName = targetName || (isKhmer ? 'ក្រុមហ៊ុន' : 'Company')
      if (act.includes('verification') || act.includes('verify')) {
        const isApproved = details.status === 'verified'
        return {
          badgeText: isApproved ? (isKhmer ? 'អនុម័តក្រុមហ៊ុន' : 'COMPANY VERIFIED') : (isKhmer ? 'បដិសេធក្រុមហ៊ុន' : 'COMPANY REJECTED'),
          badgeColor: isApproved ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200',
          icon: isApproved ? ShieldCheck : XCircle,
          iconBg: isApproved ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100',
          title: isApproved ? (isKhmer ? 'អនុម័ត និងផ្ទៀងផ្ទាត់ក្រុមហ៊ុន' : 'Approved Company Verification') : (isKhmer ? 'បដិសេធការផ្ទៀងផ្ទាត់ក្រុមហ៊ុន' : 'Rejected Company Verification'),
          description: isApproved
            ? isKhmer ? `បានអនុម័តក្រុមហ៊ុន "${cName}" ឱ្យប្រើប្រាស់ប្រព័ន្ធពេញលេញ` : `Approved enterprise profile for "${cName}"`
            : isKhmer ? `បានបដិសេធការផ្ទៀងផ្ទាត់ក្រុមហ៊ុន "${cName}"` : `Rejected verification for "${cName}"`,
          targetLabel: isKhmer ? 'ក្រុមហ៊ុន' : 'Company',
          targetName: `${cName} ${targetId}`.trim(),
          category: 'company',
        }
      }
      if (act.includes('delete')) {
        return {
          badgeText: isKhmer ? 'លុបក្រុមហ៊ុន' : 'COMPANY DELETED',
          badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
          icon: Trash2,
          iconBg: 'bg-rose-50 text-rose-600 border-rose-100',
          title: isKhmer ? 'លុបក្រុមហ៊ុនចេញពីប្រព័ន្ធ' : 'Deleted Company Profile',
          description: isKhmer ? `បានលុបក្រុមហ៊ុន "${cName}" ចេញពីប្រព័ន្ធជាអចិន្ត្រៃយ៍` : `Permanently removed company "${cName}"`,
          targetLabel: isKhmer ? 'ក្រុមហ៊ុន' : 'Company',
          targetName: `${cName} ${targetId}`.trim(),
          category: 'company',
        }
      }
      return {
        badgeText: isKhmer ? 'កែប្រែក្រុមហ៊ុន' : 'COMPANY UPDATED',
        badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
        icon: Building,
        iconBg: 'bg-blue-50 text-blue-600 border-blue-100',
        title: isKhmer ? 'កែសម្រួលព័ត៌មានក្រុមហ៊ុន' : 'Updated Company Information',
        description: isKhmer ? `បានកែសម្រួលទិន្នន័យក្រុមហ៊ុន "${cName}"` : `Updated company profile for "${cName}"`,
        targetLabel: isKhmer ? 'ក្រុមហ៊ុន' : 'Company',
        targetName: `${cName} ${targetId}`.trim(),
        category: 'company',
      }
    }

    // Job operations
    if (act.includes('job') || log.entity_type === 'job') {
      const jTitle = targetName || (isKhmer ? 'ការងារ' : 'Job')
      if (act.includes('delete')) {
        return {
          badgeText: isKhmer ? 'លុបការងារ' : 'JOB DELETED',
          badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
          icon: Trash2,
          iconBg: 'bg-rose-50 text-rose-600 border-rose-100',
          title: isKhmer ? 'លុបការងារចេញពីប្រព័ន្ធ' : 'Deleted Job Listing',
          description: isKhmer ? `បានលុបការងារ "${jTitle}" ចេញពីប្រព័ន្ធ` : `Permanently deleted job "${jTitle}"`,
          targetLabel: isKhmer ? 'ការងារ' : 'Job',
          targetName: `${jTitle} ${targetId}`.trim(),
          category: 'job',
        }
      }
      const isApproved = details.status === 'published'
      return {
        badgeText: isApproved ? (isKhmer ? 'អនុម័តការងារ' : 'JOB APPROVED') : (isKhmer ? 'ត្រួតពិនិត្យការងារ' : 'JOB MODERATED'),
        badgeColor: isApproved ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200',
        icon: Briefcase,
        iconBg: isApproved ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100',
        title: isKhmer ? 'ត្រួតពិនិត្យ និងអនុម័តការងារ' : 'Moderated Job Listing',
        description: isKhmer ? `បានកែប្រែស្ថានភាពការងារ "${jTitle}" ទៅជា ${details.status || 'Active'}` : `Set job listing "${jTitle}" status to ${details.status || 'Active'}`,
        targetLabel: isKhmer ? 'ការងារ' : 'Job',
        targetName: `${jTitle} ${targetId}`.trim(),
        category: 'job',
      }
    }

    // User operations
    if (act.includes('user') || log.entity_type === 'user') {
      const uName = targetName || details.name || details.email || (isKhmer ? 'អ្នកប្រើប្រាស់' : 'User')
      if (act.includes('delete')) {
        return {
          badgeText: isKhmer ? 'លុបអ្នកប្រើប្រាស់' : 'USER DELETED',
          badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
          icon: Trash2,
          iconBg: 'bg-rose-50 text-rose-600 border-rose-100',
          title: isKhmer ? 'លុបគណនីអ្នកប្រើប្រាស់' : 'Deleted User Account',
          description: isKhmer ? `បានលុបគណនី "${uName}" ចេញពីប្រព័ន្ធ` : `Permanently deleted user "${uName}"`,
          targetLabel: isKhmer ? 'អ្នកប្រើប្រាស់' : 'User',
          targetName: `${uName} ${targetId}`.trim(),
          category: 'user',
        }
      }
      if (act.includes('status') || act.includes('toggle')) {
        const isActive = details.is_active === true
        return {
          badgeText: isActive ? (isKhmer ? 'បើកដំណើរការគណនី' : 'USER ACTIVATED') : (isKhmer ? 'ផ្អាកគណនី' : 'USER SUSPENDED'),
          badgeColor: isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200',
          icon: isActive ? CheckCircle2 : XCircle,
          iconBg: isActive ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100',
          title: isActive ? (isKhmer ? 'បើកដំណើរការគណនី' : 'Activated User Account') : (isKhmer ? 'ផ្អាកដំណើរការគណនី' : 'Suspended User Account'),
          description: isKhmer
            ? `បានផ្លាស់ប្តូរស្ថានភាពគណនី "${uName}" ទៅជា ${isActive ? 'ដំណើរការ (Active)' : 'ផ្អាក (Suspended)'}`
            : `Set account "${uName}" status to ${isActive ? 'Active' : 'Suspended'}`,
          targetLabel: isKhmer ? 'អ្នកប្រើប្រាស់' : 'User',
          targetName: `${uName} ${targetId}`.trim(),
          category: 'user',
        }
      }
      return {
        badgeText: isKhmer ? 'កែប្រែអ្នកប្រើប្រាស់' : 'USER UPDATED',
        badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
        icon: User,
        iconBg: 'bg-blue-50 text-blue-600 border-blue-100',
        title: isKhmer ? 'កែសម្រួលគណនីអ្នកប្រើប្រាស់' : 'Updated User Profile',
        description: isKhmer ? `បានកែប្រែព័ត៌មានគណនី "${uName}"` : `Updated profile details for "${uName}"`,
        targetLabel: isKhmer ? 'អ្នកប្រើប្រាស់' : 'User',
        targetName: `${uName} ${targetId}`.trim(),
        category: 'user',
      }
    }

    // Category operations
    if (act.includes('category') || log.entity_type === 'category') {
      const catName = targetName || (isKhmer ? 'ផ្នែកការងារ' : 'Category')
      return {
        badgeText: isKhmer ? 'ផ្នែកការងារ' : 'JOB CATEGORY',
        badgeColor: 'bg-teal-50 text-teal-700 border-teal-200',
        icon: FolderTree,
        iconBg: 'bg-teal-50 text-teal-600 border-teal-100',
        title: act.includes('create')
          ? isKhmer ? 'បង្កើតផ្នែកការងារថ្មី' : 'Created Job Category'
          : act.includes('delete')
          ? isKhmer ? 'លុបផ្នែកការងារ' : 'Deleted Job Category'
          : isKhmer ? 'កែប្រែផ្នែកការងារ' : 'Updated Job Category',
        description: isKhmer ? `បានចាត់ចែងលើផ្នែកការងារ "${catName}"` : `Managed job category "${catName}"`,
        targetLabel: isKhmer ? 'ផ្នែកការងារ' : 'Category',
        targetName: `${catName} ${targetId}`.trim(),
        category: 'category',
      }
    }

    // Default fallback
    return {
      badgeText: act.replace(/_/g, ' ').toUpperCase() || 'SYSTEM EVENT',
      badgeColor: 'bg-slate-100 text-slate-700 border-slate-200',
      icon: Sparkles,
      iconBg: 'bg-slate-100 text-slate-600 border-slate-200',
      title: act.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
      description: isKhmer ? `សកម្មភាពរដ្ឋបាលលើ ${log.entity_type} ${targetId}` : `System administrative event on ${log.entity_type} ${targetId}`,
      targetLabel: log.entity_type || 'System',
      targetName: `${targetName || log.entity_type} ${targetId}`.trim(),
      category: log.entity_type || 'other',
    }
  }

  // Filter logs
  const filteredLogs = auditLogs.filter((log) => {
    const info = getLogInfo(log)
    const matchesEntity = entityFilter === 'all' || info.category === entityFilter
    const q = search.toLowerCase().trim()
    const matchesSearch =
      !q ||
      log.action?.toLowerCase().includes(q) ||
      log.entity_type?.toLowerCase().includes(q) ||
      log.user_name?.toLowerCase().includes(q) ||
      log.user_email?.toLowerCase().includes(q) ||
      log.target_name?.toLowerCase().includes(q) ||
      info.title.toLowerCase().includes(q) ||
      info.description.toLowerCase().includes(q)

    return matchesEntity && matchesSearch
  })

  // Entity Counts
  const counts = {
    all: auditLogs.length,
    role: auditLogs.filter((l) => getLogInfo(l).category === 'role').length,
    settings: auditLogs.filter((l) => getLogInfo(l).category === 'settings').length,
    company: auditLogs.filter((l) => getLogInfo(l).category === 'company').length,
    job: auditLogs.filter((l) => getLogInfo(l).category === 'job').length,
    user: auditLogs.filter((l) => getLogInfo(l).category === 'user').length,
    category: auditLogs.filter((l) => getLogInfo(l).category === 'category').length,
  }

  if (isLoading) {
    return (
      <div className="py-24 text-center font-sans">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="mt-3 text-xs font-normal text-slate-400">
          {isKhmer ? 'កំពុងដំណើរការទាញយកកំណត់ហេតុ...' : 'Loading audit logs...'}
        </p>
      </div>
    )
  }

  return (
    <div className="w-full space-y-3.5 font-sans pb-12">
      {/* 1. Header Bar: Using AdminPageHeader */}
      <AdminPageHeader
        title={isKhmer ? 'កំណត់ត្រាប្រព័ន្ធ និងសវនកម្ម' : 'System Audit Trail & Operations'}
        subtitle={
          isKhmer
            ? 'តាមដានរាល់សកម្មភាពរដ្ឋបាល ការកែប្រែស្ថានភាព និងការផ្លាស់ប្តូរទិន្នន័យក្នុងប្រព័ន្ធ'
            : 'Immutable record of administrative operations, moderation decisions, and system events'
        }
        badge={{
          icon: FileSearch,
          text: `${auditLogs.length} ${isKhmer ? 'ព្រឹត្តិការណ៍' : 'Events'}`,
        }}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder={
          isKhmer
            ? 'ស្វែងរកសកម្មភាព, ធាតុ ឬអ្នកដំណើរការ...'
            : 'Search action, entity, or actor...'
        }
      />

      {/* 2. Filter Toolbar (Quick Pills) */}
      <div className="flex items-center justify-between gap-2 bg-white px-4 py-2.5 rounded-2xl border border-gray-200 shadow-2xs overflow-x-auto">
        <span className="text-[11px] font-medium text-slate-400 shrink-0 hidden sm:inline">
          {isKhmer ? 'ច្រោះតាមប្រភេទសកម្មភាព៖' : 'Filter by Activity:'}
        </span>

        <div className="flex items-center space-x-1.5 ml-auto">
          <button
            type="button"
            onClick={() => { setEntityFilter('all'); setCurrentPage(1) }}
            className={`px-3 py-1 rounded-xl text-xs font-medium transition cursor-pointer shrink-0 ${
              entityFilter === 'all'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-gray-200'
            }`}
          >
            {isKhmer ? 'ទាំងអស់' : 'All'} ({counts.all})
          </button>

          <button
            type="button"
            onClick={() => { setEntityFilter('role'); setCurrentPage(1) }}
            className={`px-3 py-1 rounded-xl text-xs font-medium transition cursor-pointer shrink-0 ${
              entityFilter === 'role'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-gray-200'
            }`}
          >
            {isKhmer ? 'សិទ្ធិ & តួនាទី' : 'Roles'} ({counts.role})
          </button>

          <button
            type="button"
            onClick={() => { setEntityFilter('settings'); setCurrentPage(1) }}
            className={`px-3 py-1 rounded-xl text-xs font-medium transition cursor-pointer shrink-0 ${
              entityFilter === 'settings'
                ? 'bg-purple-600 text-white shadow-2xs'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-gray-200'
            }`}
          >
            {isKhmer ? 'ការកំណត់' : 'Settings'} ({counts.settings})
          </button>

          <button
            type="button"
            onClick={() => { setEntityFilter('company'); setCurrentPage(1) }}
            className={`px-3 py-1 rounded-xl text-xs font-medium transition cursor-pointer shrink-0 ${
              entityFilter === 'company'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-gray-200'
            }`}
          >
            {isKhmer ? 'ក្រុមហ៊ុន' : 'Company'} ({counts.company})
          </button>

          <button
            type="button"
            onClick={() => { setEntityFilter('job'); setCurrentPage(1) }}
            className={`px-3 py-1 rounded-xl text-xs font-medium transition cursor-pointer shrink-0 ${
              entityFilter === 'job'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-gray-200'
            }`}
          >
            {isKhmer ? 'ការងារ' : 'Job'} ({counts.job})
          </button>

          <button
            type="button"
            onClick={() => { setEntityFilter('user'); setCurrentPage(1) }}
            className={`px-3 py-1 rounded-xl text-xs font-medium transition cursor-pointer shrink-0 ${
              entityFilter === 'user'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-gray-200'
            }`}
          >
            {isKhmer ? 'អ្នកប្រើប្រាស់' : 'User'} ({counts.user})
          </button>
        </div>
      </div>

      {/* 3. Modern Human-Readable Activity Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-gray-200 text-slate-500 uppercase tracking-wider font-semibold text-[10px]">
                <th className="py-3 px-4 min-w-[280px]">{isKhmer ? 'សកម្មភាព និងសេចក្តីលម្អិត' : 'Action & Activity Message'}</th>
                <th className="py-3 px-3 min-w-[150px]">{isKhmer ? 'ធាតុប្រព័ន្ធ / គោលដៅ' : 'Target Entity'}</th>
                <th className="py-3 px-3 min-w-[160px]">{isKhmer ? 'ដំណើរការដោយ' : 'Triggered By'}</th>
                <th className="py-3 px-3 min-w-[130px]">{isKhmer ? 'កាលបរិច្ឆេទ' : 'Timestamp'}</th>
                <th className="py-3 px-4 text-right whitespace-nowrap">{isKhmer ? 'សកម្មភាព' : 'Inspect'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-sans">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-14 text-center text-slate-400">
                    <FileSearch className="w-9 h-9 mx-auto text-slate-300 mb-2" />
                    <p className="text-xs font-semibold text-slate-700">
                      {isKhmer ? 'មិនមានកំណត់ត្រាទេ' : 'No audit records found'}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {isKhmer ? 'សូមសាកល្បងស្វែងរកដោយពាក្យគន្លឹះផ្សេង' : 'Try adjusting your search or filters.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredLogs
                  .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                  .map((log) => {
                    const info = getLogInfo(log)
                    const IconComp = info.icon

                    return (
                      <tr key={log.id} className="hover:bg-slate-50/80 transition-colors group">
                        {/* 1. Action & Message */}
                        <td className="py-3 px-4 align-middle">
                          <div className="flex items-start gap-3">
                            <div className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 ${info.iconBg}`}>
                              <IconComp className="w-4 h-4" />
                            </div>
                            <div className="min-w-0 flex-1 space-y-0.5">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className={`inline-flex items-center px-1.5 py-0.2 rounded-md text-[9px] font-semibold border uppercase tracking-wider ${info.badgeColor}`}>
                                  {info.badgeText}
                                </span>
                                <span className="font-bold text-slate-900 text-xs">
                                  {info.title}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-600 line-clamp-1 leading-relaxed">
                                {info.description}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* 2. Target Entity */}
                        <td className="py-3 px-3 align-middle whitespace-nowrap">
                          <div className="space-y-0.5">
                            <span className="font-semibold text-slate-800 text-xs block truncate max-w-[170px]" title={info.targetName}>
                              {info.targetName}
                            </span>
                            <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono">
                              <span className="capitalize">{info.targetLabel}</span>
                              {log.entity_id && (
                                <span className="text-blue-600 font-medium">#{log.entity_id}</span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* 3. Triggered By */}
                        <td className="py-3 px-3 align-middle">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[11px] font-bold shrink-0 border border-blue-200">
                              {(log.user_name || 'A').charAt(0).toUpperCase()}
                            </div>
                            <div className="space-y-0.2 min-w-0 max-w-[150px]">
                              <span className="font-semibold text-slate-800 block truncate text-xs">
                                {log.user_name || 'System Administrator'}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono block truncate">
                                {log.user_email || 'admin@gmail.com'}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* 4. Timestamp */}
                        <td className="py-3 px-3 align-middle whitespace-nowrap">
                          <div className="space-y-0.5">
                            <span className="text-xs font-medium text-slate-700 block">
                              {formatTimeAgo(log.created_at)}
                            </span>
                            <div className="flex items-center space-x-1 text-[10px] text-slate-400 font-normal">
                              <Clock className="w-3 h-3 text-slate-300 shrink-0" />
                              <span>{new Date(log.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          </div>
                        </td>

                        {/* 5. Inspect Button */}
                        <td className="py-3 px-4 align-middle text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => setSelectedLog(log)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition cursor-pointer shadow-2xs active:scale-98"
                            title={isKhmer ? 'ពិនិត្យមើលព័ត៌មានលម្អិត' : 'View Activity Details'}
                          >
                            <Eye className="w-3.5 h-3.5 text-blue-600" />
                            <span>{isKhmer ? 'លម្អិត' : 'Inspect'}</span>
                          </button>
                        </td>
                      </tr>
                    )
                  })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Pagination */}
        {filteredLogs.length > 0 && (
          <TablePagination
            currentPage={currentPage}
            pageSize={pageSize}
            totalItems={filteredLogs.length}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            pageSizeOptions={[25, 50, 100]}
          />
        )}
      </div>

      {/* ================= INSPECT LOG MODAL (Clean Visual Card Inspector - NO Raw JSON) ================= */}
      {selectedLog && (() => {
        const info = getLogInfo(selectedLog)
        const details = parseDetails(selectedLog.details) || {}
        const IconComp = info.icon

        return (
          <Dialog
            isOpen={true}
            onClose={() => setSelectedLog(null)}
            size="lg"
            title={
              <div className="flex items-center space-x-2.5">
                <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${info.iconBg}`}>
                  <IconComp className="w-4.5 h-4.5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm sm:text-base font-bold text-slate-900">
                      {info.title}
                    </h3>
                    <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border uppercase ${info.badgeColor}`}>
                      {info.badgeText}
                    </span>
                  </div>
                  <p className="text-[11px] font-normal text-slate-400 font-mono mt-0.5">
                    Log #{selectedLog.id} • {new Date(selectedLog.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            }
            footer={
              <div className="flex items-center justify-between w-full">
                <button
                  type="button"
                  onClick={() => {
                    const text = JSON.stringify(details, null, 2)
                    navigator.clipboard.writeText(text)
                    setCopiedPayload(true)
                    setTimeout(() => setCopiedPayload(false), 2000)
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  {copiedPayload ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">{isKhmer ? 'បានចម្លងទិន្នន័យ' : 'Payload Copied'}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                      <span>{isKhmer ? 'ចម្លងទិន្នន័យ' : 'Copy Payload'}</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedLog(null)}
                  className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition shadow-md shadow-blue-500/20 cursor-pointer"
                >
                  {isKhmer ? 'បិទ' : 'Close'}
                </button>
              </div>
            }
          >
            <div className="space-y-4 text-xs font-sans">
              {/* 1. Context Overview Cards (2x2 Grid) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Performed By */}
                <div className="p-3 bg-slate-50 rounded-xl border border-gray-100 flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 border border-blue-200 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    {(selectedLog.user_name || 'A').charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400 block">
                      {isKhmer ? 'អ្នកដំណើរការ' : 'Triggered By'}
                    </span>
                    <span className="font-bold text-slate-900 text-xs block truncate">
                      {selectedLog.user_name || 'System Administrator'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono block truncate">
                      {selectedLog.user_email || 'admin@gmail.com'}
                    </span>
                  </div>
                </div>

                {/* Target Entity */}
                <div className="p-3 bg-slate-50 rounded-xl border border-gray-100 flex items-start gap-2.5">
                  <div className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 ${info.iconBg}`}>
                    <IconComp className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400 block">
                      {isKhmer ? 'គោលដៅ / ធាតុប្រព័ន្ធ' : 'Target Entity'}
                    </span>
                    <span className="font-bold text-slate-900 text-xs block truncate">
                      {info.targetName}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono block">
                      {info.targetLabel} {selectedLog.entity_id ? `#${selectedLog.entity_id}` : ''}
                    </span>
                  </div>
                </div>

                {/* Timestamp */}
                <div className="p-3 bg-slate-50 rounded-xl border border-gray-100 flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center shrink-0 mt-0.5">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400 block">
                      {isKhmer ? 'កាលបរិច្ឆេទ & ម៉ោង' : 'Execution Timestamp'}
                    </span>
                    <span className="font-bold text-slate-900 text-xs block">
                      {new Date(selectedLog.created_at).toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      {formatTimeAgo(selectedLog.created_at)}
                    </span>
                  </div>
                </div>

                {/* Origin Network / IP */}
                <div className="p-3 bg-slate-50 rounded-xl border border-gray-100 flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shrink-0 mt-0.5">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400 block">
                      {isKhmer ? 'ប្រភពតភ្ជាប់' : 'Client Origin / IP'}
                    </span>
                    <span className="font-bold text-slate-900 text-xs block font-mono">
                      {selectedLog.ip_address || '127.0.0.1 (Internal Admin)'}
                    </span>
                    <span className="text-[10px] text-emerald-600 font-medium block">
                      {isKhmer ? 'ផ្ទៀងផ្ទាត់សិទ្ធិជោគជ័យ' : 'Authenticated & Audited'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. Natural Language Activity Summary Banner */}
              <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-100 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-blue-950 mb-0.5">
                    {isKhmer ? 'សេចក្តីសង្ខេបនៃសកម្មភាព' : 'Activity Summary'}
                  </h4>
                  <p className="text-xs text-blue-800 leading-relaxed font-normal">
                    {isKhmer
                      ? `អ្នកប្រើប្រាស់ "${selectedLog.user_name || 'Admin'}" បានដំណើរការ ${info.title} លើ ${info.targetLabel} "${info.targetName}"។ ${info.description}`
                      : `User "${selectedLog.user_name || 'Admin'}" performed ${info.title} on ${info.targetLabel} "${info.targetName}". ${info.description}`}
                  </p>
                </div>
              </div>

              {/* 3. Human-Readable Changes Breakdown (NO RAW JSON) */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-slate-500" />
                  <span>{isKhmer ? 'ព័ត៌មានលម្អិតបម្រែបម្រួល' : 'Activity Details & Changes'}</span>
                </h4>

                {/* Case A: Permissions list */}
                {Array.isArray(details.permissions) && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-gray-200 space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700">
                        {isKhmer ? `សិទ្ធិដែលបានកំណត់ (${details.permissions.length})` : `Active Permissions Assigned (${details.permissions.length})`}
                      </span>
                      <span className="text-[10px] font-mono text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full font-semibold">
                        {details.role || 'Role'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {details.permissions.map((perm: string) => {
                        const label = PERMISSION_LABELS[perm]
                        return (
                          <div
                            key={perm}
                            className="flex items-center gap-2 p-2 rounded-lg bg-white border border-gray-100 shadow-2xs text-xs"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <div className="min-w-0 flex-1">
                              <span className="font-semibold text-slate-800 block truncate text-[11px]">
                                {label ? (isKhmer ? label.km : label.en) : perm}
                              </span>
                              <span className="text-[9px] font-mono text-slate-400 block truncate">
                                {perm}
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Case B: Site Settings modified keys */}
                {Array.isArray(details.updated_keys) && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-gray-200 space-y-2">
                    <span className="text-xs font-semibold text-slate-700 block">
                      {isKhmer ? 'ផ្នែកនៃការកំណត់ដែលបានកែប្រែ៖' : 'Modified Settings Fields:'}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {details.updated_keys.map((k: string) => (
                        <span
                          key={k}
                          className="px-2.5 py-1 rounded-lg bg-white border border-gray-200 text-xs font-medium text-slate-700 shadow-2xs"
                        >
                          ⚙️ {k.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Case C: Uploaded Logo / Asset */}
                {details.file_url && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-gray-200 flex items-center gap-3">
                    <div className="w-16 h-16 rounded-lg bg-white border border-gray-200 p-1 flex items-center justify-center shrink-0 overflow-hidden">
                      <img src={details.file_url} alt="Uploaded logo" className="max-w-full max-h-full object-contain" />
                    </div>
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <span className="text-xs font-bold text-slate-800 block">
                        {isKhmer ? 'រូបភាពដែលបានផ្ទុកឡើង' : 'Uploaded Asset Preview'}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono block truncate">
                        {details.file_url}
                      </span>
                    </div>
                  </div>
                )}

                {/* Case D: Company / User updated fields */}
                {Array.isArray(details.updated_fields) && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-gray-200 space-y-2">
                    <span className="text-xs font-semibold text-slate-700 block">
                      {isKhmer ? 'ផ្នែកទិន្នន័យដែលបានកែប្រែ៖' : 'Updated Data Fields:'}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {details.updated_fields.map((f: string) => (
                        <span
                          key={f}
                          className="px-2.5 py-1 rounded-lg bg-white border border-gray-200 text-xs font-medium text-blue-700 shadow-2xs capitalize"
                        >
                          ✏️ {f.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Case E: Status / State Change */}
                {(details.status !== undefined || details.is_active !== undefined) && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-gray-200 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700">
                      {isKhmer ? 'ស្ថានភាពថ្មីបន្ទាប់ពីកែប្រែ' : 'Updated Entity Status'}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold border ${
                        details.status === 'verified' || details.status === 'published' || details.is_active === true
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}
                    >
                      {details.status || (details.is_active ? 'Active' : 'Suspended')}
                    </span>
                  </div>
                )}

                {/* Case F: Deletion confirmation card */}
                {(details.deleted_company_name || details.deleted_job_title || (selectedLog.action || '').toLowerCase().includes('delete')) && (
                  <div className="p-3.5 bg-rose-50/70 rounded-xl border border-rose-200 flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <h5 className="text-xs font-bold text-rose-900">
                        {isKhmer ? 'ការលុបធាតុជាអចិន្ត្រៃយ៍' : 'Permanent Deletion Record'}
                      </h5>
                      <p className="text-xs text-rose-700 mt-0.5">
                        {details.deleted_company_name
                          ? isKhmer ? `ក្រុមហ៊ុន "${details.deleted_company_name}" ត្រូវបានលុបចេញពីមូលដ្ឋានទិន្នន័យ។` : `Company "${details.deleted_company_name}" has been permanently removed.`
                          : details.deleted_job_title
                          ? isKhmer ? `ការងារ "${details.deleted_job_title}" ត្រូវបានលុបចេញពីប្រព័ន្ធ។` : `Job listing "${details.deleted_job_title}" has been permanently removed.`
                          : isKhmer ? 'ទិន្នន័យត្រូវបានលុបចេញពីប្រព័ន្ធដោយជោគជ័យ។' : 'Entity was successfully deleted.'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Fallback Key-Value Card if details has any other attributes */}
                {Object.keys(details).length > 0 &&
                  !Array.isArray(details.permissions) &&
                  !Array.isArray(details.updated_keys) &&
                  !Array.isArray(details.updated_fields) &&
                  !details.file_url &&
                  !details.deleted_company_name &&
                  !details.deleted_job_title && (
                    <div className="p-3 bg-slate-50 rounded-xl border border-gray-200 divide-y divide-gray-100">
                      {Object.entries(details).map(([key, val]) => (
                        <div key={key} className="py-1.5 flex items-center justify-between text-xs first:pt-0 last:pb-0">
                          <span className="font-semibold text-slate-600 capitalize">
                            {key.replace(/_/g, ' ')}
                          </span>
                          <span className="font-medium text-slate-800">
                            {typeof val === 'boolean' ? (val ? 'True' : 'False') : String(val)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
              </div>
            </div>
          </Dialog>
        )
      })()}
    </div>
  )
}
