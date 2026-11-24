import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../app/providers'
import { adminService } from '../../services/admin.service'
import { AdminLineChart } from './AdminLineChart'
import { StatCard } from '../../components/dashboard/StatCard'
import { FacebookVerifiedBadge } from '../../components/common/FacebookVerifiedBadge'
import { PermissionGuard } from '../../components/auth/PermissionGuard'
import { PERMISSIONS, getSystemRoleLabel } from '../../utils/permissions'
import { getAssetUrl } from '../../utils/assets'
import {
  Users,
  Building2,
  Briefcase,
  FileCheck,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  History,
  Plus,
  CheckCircle2,
  Video,
  TrendingUp,
  Award,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react'

export const AdminDashboardPage: React.FC = () => {
  const { user, isSuperAdmin } = useAuth()
  const { i18n } = useTranslation()
  const isKhmer = i18n.language === 'km'

  const primaryRoleKey =
    user?.id === 1 || user?.roles?.includes('super_admin')
      ? 'super_admin'
      : user?.roles?.[0] || user?.role || 'admin'

  const [data, setData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const loadDashboard = async (quiet = false) => {
    if (!quiet) setIsLoading(true)
    else setIsRefreshing(true)

    try {
      const dash = await adminService.getDashboard()
      setData(dash)
    } catch (err) {
      console.error('Failed to load admin dashboard:', err)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    loadDashboard()
  }, [])

  const formatRelativeTime = (dateStr: string) => {
    try {
      const diffMs = Date.now() - new Date(dateStr).getTime()
      const diffMin = Math.floor(diffMs / 60000)
      if (diffMin < 1) return isKhmer ? 'អម្បាញ់មិញ' : 'Just now'
      if (diffMin < 60) return isKhmer ? `${diffMin} នាទីមុន` : `${diffMin}m ago`
      const diffHour = Math.floor(diffMin / 60)
      if (diffHour < 24) return isKhmer ? `${diffHour} ម៉ោងមុន` : `${diffHour}h ago`
      const diffDay = Math.floor(diffHour / 24)
      return isKhmer ? `${diffDay} ថ្ងៃមុន` : `${diffDay}d ago`
    } catch {
      return ''
    }
  }

  const getApplicationStatusBadge = (status: string) => {
    switch (status) {
      case 'submitted':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-700 border border-blue-400/25 backdrop-blur-md shadow-2xs">
            {isKhmer ? 'បានដាក់ពាក្យ' : 'Submitted'}
          </span>
        )
      case 'shortlisted':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-700 border border-emerald-400/25 backdrop-blur-md shadow-2xs">
            {isKhmer ? 'ជាប់សម្រាំង' : 'Shortlisted'}
          </span>
        )
      case 'screening':
      case 'reviewing':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-700 border border-amber-400/25 backdrop-blur-md shadow-2xs">
            {isKhmer ? 'កំពុងត្រួតពិនិត្យ' : 'Reviewing'}
          </span>
        )
      case 'interview_scheduled':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/10 text-purple-700 border border-purple-400/25 backdrop-blur-md shadow-2xs">
            {isKhmer ? 'សម្ភាសន៍' : 'Interview'}
          </span>
        )
      case 'offered':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-700 border border-emerald-400/25 backdrop-blur-md shadow-2xs">
            {isKhmer ? 'បានទទួលការងារ' : 'Offered'}
          </span>
        )
      case 'rejected':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-700 border border-rose-400/25 backdrop-blur-md shadow-2xs">
            {isKhmer ? 'បដិសេធ' : 'Rejected'}
          </span>
        )
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-100/80 text-slate-700 border border-slate-200/70 backdrop-blur-md capitalize">
            {status}
          </span>
        )
    }
  }

  if (isLoading) {
    return (
      <div className="py-24 text-center font-sans">
        <div className="w-9 h-9 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="mt-3.5 text-xs font-semibold text-slate-500 tracking-wide">
          {isKhmer ? 'កំពុងដំណើរការទាញយកផ្ទាំងគ្រប់គ្រង...' : 'Loading administration intelligence...'}
        </p>
      </div>
    )
  }

  const stats = data?.stats || {}
  const recentApplications = data?.recent_applications || []
  const recentCompanies = data?.recent_companies || []
  const recentAuditLogs = data?.recent_audit_logs || []

  const pendingReviewTotal =
    (stats.pending_verifications || 0) + (stats.pending_moderation_jobs || 0)

  const formatAuditLabel = (log: any) => {
    const action = (log.action || '').toLowerCase()
    const target = log.target_name || (log.entity_id ? `#${log.entity_id}` : '')
    const map: Record<string, { en: string; km: string }> = {
      verify_company: { en: 'Verified company', km: 'បានផ្ទៀងផ្ទាត់ក្រុមហ៊ុន' },
      approve_company: { en: 'Approved company', km: 'បានអនុម័តក្រុមហ៊ុន' },
      reject_company: { en: 'Rejected company', km: 'បានបដិសេធក្រុមហ៊ុន' },
      moderate_job: { en: 'Moderated job', km: 'បានត្រួតពិនិត្យការងារ' },
      approve_job: { en: 'Approved job', km: 'បានអនុម័តការងារ' },
      reject_job: { en: 'Rejected job', km: 'បានបដិសេធការងារ' },
      feature_job: { en: 'Featured job', km: 'បានដាក់ការងារពិសេស' },
      create_user: { en: 'Created user', km: 'បានបង្កើតគណនី' },
      update_user: { en: 'Updated user', km: 'បានកែប្រែគណនី' },
      update_user_roles: { en: 'Updated user role/perms', km: 'បានកែប្រែតួនាទី និងសិទ្ធិ' },
      toggle_user_status: { en: 'Toggled user status', km: 'បានប្តូរស្ថានភាពគណនី' },
      delete_user: { en: 'Deleted user', km: 'បានលុបគណនី' },
      create_role: { en: 'Created role', km: 'បានបង្កើតតួនាទី' },
      delete_role: { en: 'Deleted role', km: 'បានលុបតួនាទី' },
      update_role_permissions: { en: 'Updated role permissions', km: 'បានកែប្រែសិទ្ធិតួនាទី' },
      update_settings: { en: 'Updated settings', km: 'បានកែប្រែការកំណត់ប្រព័ន្ធ' },
      create_category: { en: 'Created category', km: 'បានបង្កើតផ្នែកការងារ' },
      update_category: { en: 'Updated category', km: 'បានកែប្រែផ្នែកការងារ' },
      delete_category: { en: 'Deleted category', km: 'បានលុបផ្នែកការងារ' },
    }
    const entry = map[action]
    const baseText = entry
      ? isKhmer
        ? entry.km
        : entry.en
      : action.replace(/_/g, ' ')
    return target ? `${baseText}: ${target}` : baseText
  }

  return (
    <div className="relative w-full space-y-4 sm:space-y-5 font-sans pb-16">
      {/* 1. Executive Admin Command Header */}
      <div className="glass-card rounded-2xl border border-white/90 shadow-sm p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1.5 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200/80">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>
                {isSuperAdmin
                  ? getSystemRoleLabel('super_admin', isKhmer)
                  : getSystemRoleLabel(primaryRoleKey, isKhmer)}
              </span>
            </span>
            <span className="text-[11px] font-medium text-slate-400">
              {new Date().toLocaleDateString(isKhmer ? 'km-KH' : 'en-US', {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight truncate">
            {isKhmer
              ? `សួស្តី ${user?.full_name || 'អ្នកគ្រប់គ្រង'} — មជ្ឈមណ្ឌលគ្រប់គ្រងប្រព័ន្ធ`
              : `Welcome back, ${user?.full_name || 'Administrator'}`}
          </h1>
          <p className="text-xs text-slate-500">
            {isKhmer
              ? 'តាមដានទិដ្ឋភាពទូទៅ ការផ្ទៀងផ្ទាត់ក្រុមហ៊ុន ការត្រួតពិនិត្យការងារ និងសុវត្ថិភាពតួនាទី'
              : 'Monitor platform growth, enterprise verifications, job moderation, and RBAC security'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <PermissionGuard permission={PERMISSIONS.VERIFY_COMPANIES}>
            <Link
              to="/admin/companies"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 hover:text-blue-600 border border-slate-200 text-xs font-semibold shadow-2xs transition"
            >
              <Building2 className="w-3.5 h-3.5 text-indigo-600" />
              <span>{isKhmer ? 'ផ្ទៀងផ្ទាត់ក្រុមហ៊ុន' : 'Verify Companies'}</span>
              {(stats.pending_verifications || 0) > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                  {stats.pending_verifications}
                </span>
              )}
            </Link>
          </PermissionGuard>

          <PermissionGuard permission={PERMISSIONS.MODERATE_JOBS}>
            <Link
              to="/admin/jobs"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 hover:text-blue-600 border border-slate-200 text-xs font-semibold shadow-2xs transition"
            >
              <Briefcase className="w-3.5 h-3.5 text-sky-600" />
              <span>{isKhmer ? 'ត្រួតពិនិត្យការងារ' : 'Moderate Jobs'}</span>
              {(stats.pending_moderation_jobs || 0) > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                  {stats.pending_moderation_jobs}
                </span>
              )}
            </Link>
          </PermissionGuard>

          <PermissionGuard permission={PERMISSIONS.MANAGE_USERS}>
            <Link
              to="/admin/users"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition"
            >
              <Users className="w-3.5 h-3.5" />
              <span>{isKhmer ? 'អ្នកប្រើ និងតួនាទី' : 'Users & Roles'}</span>
            </Link>
          </PermissionGuard>

          <button
            type="button"
            onClick={() => loadDashboard(true)}
            disabled={isRefreshing}
            title={isKhmer ? 'ផ្ទុកទិន្នន័យឡើងវិញ' : 'Refresh dashboard'}
            className="p-2 rounded-xl bg-white hover:bg-slate-50 text-slate-600 hover:text-blue-600 border border-slate-200 shadow-2xs transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. Consolidated 6 Executive KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        {/* Metric 1: Total Users */}
        <StatCard
          to="/admin/users"
          label={isKhmer ? 'អ្នកប្រើប្រាស់សរុប' : 'Total Users'}
          value={stats.total_users || 0}
          icon={Users}
          accent="blue"
          badge={isKhmer ? 'គណនី' : 'Accounts'}
          subtext={
            <div className="flex items-center justify-between w-full">
              <span className="truncate">{isKhmer ? 'គណនីប្រព័ន្ធ' : 'Accounts'}</span>
              <span className="text-blue-600 text-[10px] font-semibold shrink-0">
                {isKhmer ? 'សកម្ម' : 'Active'}
              </span>
            </div>
          }
        />

        {/* Metric 2: Registered Companies */}
        <StatCard
          to="/admin/companies"
          label={isKhmer ? 'ក្រុមហ៊ុនចុះឈ្មោះ' : 'Enterprises'}
          value={stats.total_companies || 0}
          icon={Building2}
          accent="indigo"
          badge={isKhmer ? 'សហគ្រាស' : 'Companies'}
          subtext={
            <div className="flex items-center justify-between w-full">
              <span className="truncate">{isKhmer ? 'សហគ្រាសដៃគូ' : 'Partners'}</span>
              <span className="text-indigo-600 text-[10px] font-semibold shrink-0">
                {isKhmer ? 'ផ្ទៀងផ្ទាត់' : 'Verified'}
              </span>
            </div>
          }
        />

        {/* Metric 3: Published Jobs & Moderation Queue (Combines Published Jobs + Pending Review) */}
        <StatCard
          to="/admin/jobs"
          label={isKhmer ? 'ការងារផ្សាយ & ពិនិត្យ' : 'Published & Review'}
          value={stats.published_jobs || 0}
          icon={Briefcase}
          accent="sky"
          badge={
            pendingReviewTotal > 0 ? (
              <span className="text-amber-700 font-medium">
                {pendingReviewTotal} {isKhmer ? 'រង់ចាំ' : 'Pending'}
              </span>
            ) : (
              isKhmer ? 'ផ្សាយផ្ទាល់' : 'Live now'
            )
          }
          tone={pendingReviewTotal > 0 ? 'warning' : 'success'}
          subtext={
            <div className="flex items-center justify-between w-full">
              <span className="truncate">{isKhmer ? 'រង់ចាំពិនិត្យ' : 'Pending'}</span>
              <span
                className={`font-semibold text-[10px] px-1.5 py-0.5 rounded shrink-0 ${
                  pendingReviewTotal > 0
                    ? 'text-amber-700 bg-amber-50 border border-amber-200'
                    : 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                }`}
              >
                {pendingReviewTotal > 0
                  ? `${pendingReviewTotal}`
                  : (isKhmer ? '0 (រួចរាល់)' : '0 Clear')}
              </span>
            </div>
          }
        />

        {/* Metric 4: Completed Placements & Success Rate (Combines Completed Applications + Placement Rate) */}
        <StatCard
          label={isKhmer ? 'ពាក្យសុំជោគជ័យ' : 'Completed Placements'}
          value={stats.completed_applications || 0}
          icon={CheckCircle2}
          accent="emerald"
          badge={isKhmer ? 'ផ្តល់ការងារ' : 'Offered'}
          tone="success"
          subtext={
            <div className="flex items-center justify-between w-full">
              <span className="truncate">{isKhmer ? 'អត្រាជោគជ័យ' : 'Success'}</span>
              <span className="font-bold text-emerald-700 text-[10px] bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 shrink-0">
                {stats.placement_rate || 0}%
              </span>
            </div>
          }
        />

        {/* Metric 5: Total Applications */}
        <StatCard
          label={isKhmer ? 'ពាក្យសុំការងារសរុប' : 'Total Applications'}
          value={stats.total_applications || 0}
          icon={FileCheck}
          accent="indigo"
          badge={isKhmer ? 'ដាក់ពាក្យ' : 'Candidates'}
          tone="info"
          subtext={
            <div className="flex items-center justify-between w-full">
              <span className="truncate">{isKhmer ? 'បេក្ខជនសរុប' : 'Submissions'}</span>
              <span className="text-slate-400 text-[10px] font-semibold shrink-0">
                {isKhmer ? 'សរុប' : 'Total'}
              </span>
            </div>
          }
        />

        {/* Metric 6: Total Interviews Conducted */}
        <StatCard
          label={isKhmer ? 'ការសម្ភាសន៍សរុប' : 'Total Interviews'}
          value={stats.total_interviews || 0}
          icon={Video}
          accent="purple"
          badge={isKhmer ? 'សម្ភាសន៍' : 'Scheduled'}
          tone="info"
          subtext={
            <div className="flex items-center justify-between w-full">
              <span className="truncate">{isKhmer ? 'សម្ភាសន៍ Meet' : 'Google Meet'}</span>
              <span className="text-purple-600 text-[10px] font-semibold shrink-0">
                {isKhmer ? 'តាម Meet' : 'Meet'}
              </span>
            </div>
          }
        />
      </div>

      {/* 3. Attention Alert Banner if pending items exist */}
      {pendingReviewTotal > 0 && (
        <div className="bg-amber-500/10 backdrop-blur-xl border border-amber-400/30 text-amber-950 rounded-2xl p-4 sm:p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 shadow-sm relative overflow-hidden">
          <div className="flex items-center space-x-3.5 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 text-amber-700 flex items-center justify-center shrink-0 shadow-inner">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-amber-950">
                {isKhmer ? 'ត្រូវការការត្រួតពិនិត្យជាបន្ទាន់' : 'Immediate Administrative Attention Required'}
              </h4>
              <p className="text-xs text-amber-900/80 mt-0.5">
                {isKhmer
                  ? `មានក្រុមហ៊ុនចំនួន ${stats.pending_verifications || 0} និងការផ្សាយការងារ ${stats.pending_moderation_jobs || 0} កំពុងរង់ចាំការអនុម័តពីអភិបាល។`
                  : `${stats.pending_verifications || 0} enterprises and ${stats.pending_moderation_jobs || 0} job vacancies await your moderation approval.`}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0 relative z-10">
            {stats.pending_verifications > 0 && (
              <Link
                to="/admin/companies"
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 transition shadow-xs"
              >
                {isKhmer ? 'ពិនិត្យក្រុមហ៊ុន' : 'Verify Companies'}
              </Link>
            )}
            {stats.pending_moderation_jobs > 0 && (
              <Link
                to="/admin/jobs"
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-white/90 hover:bg-white hover:text-blue-600 border border-slate-200/70 active:scale-95 transition shadow-2xs"
              >
                {isKhmer ? 'ពិនិត្យការងារ' : 'Review Jobs'}
              </Link>
            )}
          </div>
        </div>
      )}

      {/* 4. Core Content: 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-start">
        {/* Left Column (7 cols): Analytics Chart + Recent Applications */}
        <div className="lg:col-span-7 space-y-4 sm:space-y-5">
          {/* Real Database Line Chart (Compact) */}
          <AdminLineChart analytics={data?.analytics} />

          {/* Card: Recent Candidate Submissions */}
          <div className="glass-card rounded-2xl border border-white/90 shadow-sm p-4 sm:p-5 space-y-3.5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/60">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-400/25 text-blue-600 flex items-center justify-center shrink-0 shadow-inner">
                  <FileCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-800">
                    {isKhmer ? 'ពាក្យសុំការងារចុងក្រោយ' : 'Recent Candidate Submissions'}
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    {isKhmer ? 'បេក្ខជនដែលបានដាក់ពាក្យថ្មីៗក្នុងប្រព័ន្ធ' : 'Latest candidate applications across all companies'}
                  </p>
                </div>
              </div>

              <Link
                to="/admin/jobs"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center space-x-1 transition"
              >
                <span>{isKhmer ? 'មើលការងារទាំងអស់' : 'View Jobs'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Candidate Applications Table */}
            <div className="overflow-x-auto">
              {recentApplications.length === 0 ? (
                <div className="py-10 text-center text-xs text-slate-400 font-normal">
                  {isKhmer ? 'មិនទាន់មានពាក្យសុំការងារនៅឡើយទេ' : 'No candidate applications found.'}
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/70 border-b border-slate-200/60 text-[10px] font-bold text-slate-500 uppercase tracking-wider backdrop-blur-xs">
                      <th className="py-2.5 px-3">{isKhmer ? 'បេក្ខជន' : 'Applicant'}</th>
                      <th className="py-2.5 px-3">{isKhmer ? 'ការងារ & ក្រុមហ៊ុន' : 'Role & Company'}</th>
                      <th className="py-2.5 px-3">{isKhmer ? 'ស្ថានភាព' : 'Status'}</th>
                      <th className="py-2.5 px-3 text-right">{isKhmer ? 'កាលបរិច្ឆេទ' : 'Time'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {recentApplications.slice(0, 5).map((app: any) => (
                      <tr key={app.id} className="hover:bg-blue-50/40 transition-colors group">
                        <td className="py-2.5 px-3">
                          <div className="flex items-center space-x-2">
                            {app.applicant_avatar ? (
                              <div className="w-8 h-8 rounded-full border border-slate-200/80 bg-white flex items-center justify-center shrink-0 shadow-2xs overflow-hidden">
                                <img
                                  src={getAssetUrl(app.applicant_avatar)}
                                  alt={app.applicant_name}
                                  className="w-full h-full object-cover rounded-full"
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.display = 'none'
                                  }}
                                />
                              </div>
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                                {app.applicant_name?.charAt(0)?.toUpperCase() || 'U'}
                              </div>
                            )}
                            <span className="font-bold text-slate-900 group-hover:text-blue-600 transition truncate max-w-[120px] block">
                              {app.applicant_name}
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="min-w-0">
                            <span className="font-semibold text-slate-800 block truncate max-w-[160px]">
                              {app.job_title}
                            </span>
                            <span className="text-[10px] text-slate-400 block truncate max-w-[160px]">
                              {app.company_name}
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          {getApplicationStatusBadge(app.status)}
                        </td>
                        <td className="py-2.5 px-3 text-right text-[10px] text-slate-400 whitespace-nowrap">
                          {formatRelativeTime(app.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Enterprises + Audit Trail */}
        <div className="lg:col-span-5 space-y-4 sm:space-y-5">
          {/* Card: Recently Registered Companies */}
          <div className="glass-card rounded-2xl border border-white/90 shadow-sm p-4 sm:p-5 space-y-3.5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/60">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-400/25 text-blue-600 flex items-center justify-center shrink-0 shadow-inner">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-800">
                    {isKhmer ? 'ក្រុមហ៊ុនចុះឈ្មោះថ្មីៗ' : 'Registered Enterprises'}
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    {isKhmer ? 'សហគ្រាស និងស្ថាប័នដៃគូក្នុងប្រព័ន្ធ' : 'Employer organizations & partners'}
                  </p>
                </div>
              </div>

              <Link
                to="/admin/companies"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center space-x-1 transition"
              >
                <span>{isKhmer ? 'គ្រប់គ្រង' : 'Manage'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Registered Enterprises Table */}
            <div className="overflow-x-auto">
              {recentCompanies.length === 0 ? (
                <div className="py-10 text-center text-xs text-slate-400 font-normal">
                  {isKhmer ? 'មិនមានក្រុមហ៊ុនចុះឈ្មោះនៅឡើយទេ' : 'No companies registered yet.'}
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/70 border-b border-slate-200/60 text-[10px] font-bold text-slate-500 uppercase tracking-wider backdrop-blur-xs">
                      <th className="py-2.5 px-3">{isKhmer ? 'សហគ្រាស' : 'Enterprise'}</th>
                      <th className="py-2.5 px-3 text-center">{isKhmer ? 'ស្ថានភាព' : 'Status'}</th>
                      <th className="py-2.5 px-3 text-right">{isKhmer ? 'សកម្មភាព' : 'Action'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {recentCompanies.slice(0, 5).map((comp: any) => {
                      const isVerified = comp.verification_status === 'verified'
                      const isRejected = comp.verification_status === 'rejected'
                      return (
                        <tr key={comp.id} className="hover:bg-blue-50/40 transition-colors group">
                          <td className="py-2.5 px-3">
                            <div className="flex items-center space-x-2.5">
                              {comp.logo_url ? (
                                <div className="w-8 h-8 rounded-full border border-slate-200/80 bg-white flex items-center justify-center shrink-0 shadow-2xs overflow-hidden">
                                  <img
                                    src={getAssetUrl(comp.logo_url)}
                                    alt={comp.name}
                                    className="w-full h-full object-cover rounded-full"
                                    onError={(e) => {
                                      const target = e.currentTarget
                                      target.style.display = 'none'
                                      if (target.parentElement) {
                                        target.parentElement.className =
                                          'w-8 h-8 rounded-full bg-blue-500/10 text-blue-600 border border-blue-400/25 flex items-center justify-center shrink-0 shadow-2xs'
                                        target.parentElement.innerHTML =
                                          '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>'
                                      }
                                    }}
                                  />
                                </div>
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-600 border border-blue-400/25 flex items-center justify-center shrink-0 shadow-2xs">
                                  <Building2 className="w-4 h-4" />
                                </div>
                              )}
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-slate-900 group-hover:text-blue-600 transition block truncate max-w-[125px]">
                                    {comp.name}
                                  </span>
                                  {isVerified && (
                                    <FacebookVerifiedBadge
                                      className="w-3.5 h-3.5"
                                      title={isKhmer ? 'ក្រុមហ៊ុនបានផ្ទៀងផ្ទាត់' : 'Verified Organization'}
                                    />
                                  )}
                                </div>
                                <span className="text-[10px] text-slate-400 block truncate max-w-[140px]">
                                  {comp.industry || (isKhmer ? 'សហគ្រាស' : 'Enterprise')}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border backdrop-blur-md shadow-2xs ${isVerified
                                  ? 'bg-emerald-500/10 text-emerald-700 border-emerald-400/25'
                                  : isRejected
                                    ? 'bg-rose-500/10 text-rose-700 border-rose-400/25'
                                    : 'bg-amber-500/10 text-amber-700 border-amber-400/25'
                                }`}
                            >
                              {isVerified
                                ? isKhmer ? 'ផ្ទៀងផ្ទាត់រួច' : 'Verified'
                                : isRejected
                                  ? isKhmer ? 'បដិសេធ' : 'Rejected'
                                  : isKhmer ? 'រង់ចាំ' : 'Pending'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <Link
                              to="/admin/companies"
                              className="px-2.5 py-1 rounded-lg bg-white/80 hover:bg-blue-600 hover:text-white text-slate-700 border border-slate-200/70 text-[10px] font-semibold transition-all shadow-2xs"
                            >
                              {isKhmer ? 'ពិនិត្យ' : 'Review'}
                            </Link>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Card: Live Audit Stream / Activity */}
          <div className="glass-card rounded-2xl border border-white/90 shadow-sm p-4 sm:p-5 space-y-3.5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/60">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-slate-500/10 to-slate-700/10 border border-slate-400/20 text-slate-700 flex items-center justify-center shrink-0 shadow-inner">
                  <History className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-800">
                    {isKhmer ? 'កំណត់ហេតុប្រព័ន្ធចុងក្រោយ' : 'System Audit Activity'}
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    {isKhmer ? 'សកម្មភាពរដ្ឋបាលចុងក្រោយបង្អស់' : 'Administrative audit event history'}
                  </p>
                </div>
              </div>

              <Link
                to="/admin/audit"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center space-x-1 transition"
              >
                <span>{isKhmer ? 'មើលកំណត់ហេតុ' : 'View Audit'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Audit event rows with Frosted Glass strip */}
            <div className="space-y-2">
              {recentAuditLogs.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  {isKhmer ? 'មិនទាន់មានកំណត់ហេតុសកម្មភាពទេ' : 'No audit entries recorded.'}
                </div>
              ) : (
                recentAuditLogs.slice(0, 5).map((log: any) => (
                  <div
                    key={log.id}
                    className="p-2.5 rounded-xl bg-white/70 hover:bg-white/90 border border-white/80 shadow-2xs transition-all flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-semibold text-[11px] text-slate-800 truncate">
                          {formatAuditLabel(log)}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 block truncate mt-0.5">
                        {isKhmer ? 'ដោយ ' : 'By '}
                        {log.user_name || log.user_email || (isKhmer ? 'អ្នកគ្រប់គ្រង' : 'Administrator')}
                      </span>
                    </div>

                    <span className="text-[10px] text-slate-400 shrink-0">
                      {formatRelativeTime(log.created_at)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
