import React, { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { adminService } from '../../services/admin.service'
import { useToast } from '../../app/providers'
import { AdminPageHeader } from '../../components/layout/dashboard'
import { Select } from '../../components/ui/Select'
import { TablePagination } from '../../components/common/TablePagination'
import { FacebookVerifiedBadge } from '../../components/common/FacebookVerifiedBadge'
import { getAssetUrl } from '../../utils/assets'
import {
  Users,
  Search,
  Building2,
  Briefcase,
  Mail,
  Phone,
  MapPin,
  DollarSign,
  Calendar,
  FileText,
  ChevronDown,
  ChevronUp,
  Download,
  ExternalLink,
  RefreshCw,
  Video,
  CheckCircle2,
  Clock,
} from 'lucide-react'

export const AdminApplicationsPage: React.FC = () => {
  const { i18n } = useTranslation()
  const { toast } = useToast()
  const isKhmer = i18n.language === 'km'
  const [searchParams, setSearchParams] = useSearchParams()

  const [applications, setApplications] = useState<any[]>([])
  const [companies, setCompanies] = useState<Array<{ id: number; name: string }>>([])
  const [jobs, setJobs] = useState<Array<{ id: number; title: string; company_id: number }>>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const [searchQuery, setSearchQuery] = useState('')
  const [companyFilter, setCompanyFilter] = useState<string>(searchParams.get('company_id') || 'all')
  const [jobFilter, setJobFilter] = useState<string>(searchParams.get('job_id') || 'all')
  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get('status') || 'all')
  const [expandedAppIds, setExpandedAppIds] = useState<number[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)

  const fetchApplications = async (quiet = false) => {
    if (!quiet) setIsLoading(true)
    else setIsRefreshing(true)

    try {
      const data = await adminService.getApplications()
      setApplications(data?.applications || [])
      setCompanies(data?.companies || [])
      setJobs(data?.jobs || [])
    } catch (err) {
      console.error('Failed to load admin applications:', err)
      toast.error(
        isKhmer ? 'បរាជ័យ' : 'Error',
        isKhmer ? 'មិនអាចទាញយកបញ្ជីបេក្ខជនដាក់ពាក្យបានទេ' : 'Failed to load job seeker applications.'
      )
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    fetchApplications()
  }, [])

  const toggleExpand = (appId: number) => {
    setExpandedAppIds((prev) =>
      prev.includes(appId) ? prev.filter((id) => id !== appId) : [...prev, appId]
    )
  }

  const normalizeStatus = (st?: string) => {
    if (!st) return 'submitted'
    if (st === 'screening') return 'reviewing'
    if (st === 'interview_scheduled') return 'interview'
    return st
  }

  const getStatusBadge = (status: string) => {
    switch (normalizeStatus(status)) {
      case 'submitted':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            <span>{isKhmer ? 'បានដាក់ពាក្យ' : 'Submitted'}</span>
          </span>
        )
      case 'reviewing':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span>{isKhmer ? 'កំពុងត្រួតពិនិត្យ' : 'Reviewing'}</span>
          </span>
        )
      case 'shortlisted':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
            <span>{isKhmer ? 'ជាប់សម្រាំង' : 'Shortlisted'}</span>
          </span>
        )
      case 'interview':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            <span>{isKhmer ? 'ណាត់សម្ភាសន៍' : 'Interview'}</span>
          </span>
        )
      case 'offered':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            <span>{isKhmer ? 'ផ្តល់ការងារ' : 'Offered'}</span>
          </span>
        )
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            <span>{isKhmer ? 'បដិសេធ' : 'Rejected'}</span>
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200 capitalize">
            {status}
          </span>
        )
    }
  }

  const companyOptions = useMemo(
    () => [
      { value: 'all', label: isKhmer ? 'ក្រុមហ៊ុនទាំងអស់' : 'All Companies' },
      ...companies.map((c) => ({ value: String(c.id), label: c.name })),
    ],
    [companies, isKhmer]
  )

  const jobOptions = useMemo(() => {
    const scopedJobs =
      companyFilter === 'all'
        ? jobs
        : jobs.filter((j) => String(j.company_id) === companyFilter)
    return [
      { value: 'all', label: isKhmer ? 'ការងារទាំងអស់' : 'All Job Vacancies' },
      ...scopedJobs.map((j) => ({ value: String(j.id), label: j.title })),
    ]
  }, [jobs, companyFilter, isKhmer])

  const filteredApplications = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return applications.filter((app) => {
      if (companyFilter !== 'all' && String(app.company_id) !== companyFilter) return false
      if (jobFilter !== 'all' && String(app.job_id) !== jobFilter) return false
      if (statusFilter !== 'all' && normalizeStatus(app.status) !== statusFilter) return false
      if (q) {
        const hit =
          app.applicant_name?.toLowerCase().includes(q) ||
          app.applicant_email?.toLowerCase().includes(q) ||
          app.job_title?.toLowerCase().includes(q) ||
          app.company_name?.toLowerCase().includes(q)
        if (!hit) return false
      }
      return true
    })
  }, [applications, companyFilter, jobFilter, statusFilter, searchQuery])

  const handleCompanyFilterChange = (val: string) => {
    setCompanyFilter(val)
    setJobFilter('all')
    setCurrentPage(1)
    const next = new URLSearchParams(searchParams)
    if (val === 'all') next.delete('company_id')
    else next.set('company_id', val)
    next.delete('job_id')
    setSearchParams(next, { replace: true })
  }

  const handleJobFilterChange = (val: string) => {
    setJobFilter(val)
    setCurrentPage(1)
    const next = new URLSearchParams(searchParams)
    if (val === 'all') next.delete('job_id')
    else next.set('job_id', val)
    setSearchParams(next, { replace: true })
  }

  const interviewCount = applications.filter((a) => normalizeStatus(a.status) === 'interview').length
  const offeredCount = applications.filter((a) => normalizeStatus(a.status) === 'offered').length
  const reviewingCount = applications.filter((a) =>
    ['submitted', 'reviewing', 'shortlisted'].includes(normalizeStatus(a.status))
  ).length

  if (isLoading) {
    return (
      <div className="py-24 text-center font-sans">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="mt-3 text-xs font-medium text-slate-500">
          {isKhmer ? 'កំពុងទាញយកទិន្នន័យបេក្ខជនដាក់ពាក្យ...' : 'Loading all candidate applications...'}
        </p>
      </div>
    )
  }

  return (
    <div className="w-full space-y-4 sm:space-y-5 font-sans pb-16">
      {/* Header */}
      <AdminPageHeader
        title={isKhmer ? 'បេក្ខជនដាក់ពាក្យការងារទាំងអស់' : 'All Job Seeker Applications'}
        subtitle={
          isKhmer
            ? 'តាមដាន និងពិនិត្យបេក្ខជនដែលបានដាក់ពាក្យស្នើសុំការងារតាមក្រុមហ៊ុន និងមុខតំណែងនីមួយៗ'
            : 'Inspect job seeker applications across every registered company and job vacancy'
        }
        badge={{
          icon: Users,
          text: `${applications.length} ${isKhmer ? 'ពាក្យសុំ' : 'Applications'}`,
        }}
        actions={
          <button
            type="button"
            onClick={() => fetchApplications(true)}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition shadow-2xs cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
            <span>{isKhmer ? 'ផ្ទុកឡើងវិញ' : 'Refresh'}</span>
          </button>
        }
      />

      {/* Compact Summary Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 flex items-center justify-between shadow-2xs">
          <div>
            <p className="text-[11px] font-semibold text-slate-500">
              {isKhmer ? 'ពាក្យសុំសរុប' : 'Total Applications'}
            </p>
            <p className="text-xl font-bold text-slate-900 mt-0.5">{applications.length}</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 border border-blue-200/70 flex items-center justify-center">
            <Users className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 flex items-center justify-between shadow-2xs">
          <div>
            <p className="text-[11px] font-semibold text-slate-500">
              {isKhmer ? 'កំពុងដំណើរការពិនិត្យ' : 'In Review Pipeline'}
            </p>
            <p className="text-xl font-bold text-slate-900 mt-0.5">{reviewingCount}</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 border border-amber-200/70 flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 flex items-center justify-between shadow-2xs">
          <div>
            <p className="text-[11px] font-semibold text-slate-500">
              {isKhmer ? 'បានណាត់សម្ភាសន៍' : 'Interviews Scheduled'}
            </p>
            <p className="text-xl font-bold text-slate-900 mt-0.5">{interviewCount}</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200/70 flex items-center justify-center">
            <Video className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 flex items-center justify-between shadow-2xs">
          <div>
            <p className="text-[11px] font-semibold text-slate-500">
              {isKhmer ? 'បានផ្តល់ការងារ' : 'Jobs Offered'}
            </p>
            <p className="text-xl font-bold text-slate-900 mt-0.5">{offeredCount}</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/70 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setCurrentPage(1)
              }}
              placeholder={
                isKhmer
                  ? 'ស្វែងរកឈ្មោះបេក្ខជន អ៊ីមែល ការងារ ឬក្រុមហ៊ុន...'
                  : 'Search applicant, email, job title, or company...'
              }
              className="w-full min-h-[38px] pl-10 pr-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-blue-500 transition"
            />
          </div>

          <div className="md:col-span-3">
            <Select
              value={companyFilter}
              onChange={(e) => handleCompanyFilterChange(e.target.value)}
              options={companyOptions}
              leftIcon={<Building2 className="w-4 h-4" />}
              searchable
              searchPlaceholder={isKhmer ? 'ស្វែងរកក្រុមហ៊ុន...' : 'Search company...'}
            />
          </div>

          <div className="md:col-span-4">
            <Select
              value={jobFilter}
              onChange={(e) => handleJobFilterChange(e.target.value)}
              options={jobOptions}
              leftIcon={<Briefcase className="w-4 h-4" />}
              searchable
              searchPlaceholder={isKhmer ? 'ស្វែងរកមុខតំណែង...' : 'Search vacancy...'}
            />
          </div>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 scrollbar-none">
          {[
            { id: 'all', label: isKhmer ? 'ទាំងអស់' : 'All' },
            { id: 'submitted', label: isKhmer ? 'បានដាក់' : 'Submitted' },
            { id: 'reviewing', label: isKhmer ? 'ត្រួតពិនិត្យ' : 'Reviewing' },
            { id: 'shortlisted', label: isKhmer ? 'ជាប់សម្រាំង' : 'Shortlisted' },
            { id: 'interview', label: isKhmer ? 'សម្ភាសន៍' : 'Interview' },
            { id: 'offered', label: isKhmer ? 'ផ្តល់ការងារ' : 'Offered' },
            { id: 'rejected', label: isKhmer ? 'បដិសេធ' : 'Rejected' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setStatusFilter(tab.id)
                setCurrentPage(1)
                const next = new URLSearchParams(searchParams)
                if (tab.id === 'all') next.delete('status')
                else next.set('status', tab.id)
                setSearchParams(next, { replace: true })
              }}
              className={`px-3 py-1 rounded-xl text-xs font-semibold transition shrink-0 cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Applications List */}
      {filteredApplications.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center space-y-2 shadow-2xs">
          <Users className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-xs sm:text-sm font-bold text-slate-900">
            {isKhmer ? 'រកមិនឃើញបេក្ខជនដាក់ពាក្យទេ' : 'No Applications Found'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {isKhmer
              ? 'សាកល្បងផ្លាស់ប្តូរក្រុមហ៊ុន ការងារ ឬតម្រងស្ថានភាពផ្សេងទៀត។'
              : 'Try clearing your search or selecting another company, job, or status filter.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredApplications
            .slice((currentPage - 1) * pageSize, currentPage * pageSize)
            .map((app: any) => {
              const isExpanded = expandedAppIds.includes(app.id)

              return (
                <div
                  key={app.id}
                  className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 shadow-2xs space-y-3.5 hover:border-blue-400 transition"
                >
                  {/* Candidate Header Row */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3.5">
                    <div className="flex items-start space-x-3.5 min-w-0">
                      <div className="w-11 h-11 rounded-full bg-blue-50 text-blue-700 border border-gray-200 font-bold flex items-center justify-center text-sm shrink-0 overflow-hidden">
                        {app.applicant_avatar ? (
                          <img
                            src={getAssetUrl(app.applicant_avatar)}
                            alt={app.applicant_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span>{app.applicant_name?.charAt(0)?.toUpperCase() || 'C'}</span>
                        )}
                      </div>

                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                            {app.applicant_name}
                          </h3>
                          {getStatusBadge(app.status)}
                        </div>

                        <p className="text-xs text-slate-500">
                          {app.applicant_headline || (isKhmer ? 'បេក្ខជនស្វែងរកការងារ' : 'Job Seeker')}
                        </p>

                        {/* Applied Company & Position */}
                        <div className="flex flex-wrap items-center gap-2 pt-0.5">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-slate-50 border border-slate-200/80 text-[11px] font-bold text-slate-800">
                            <Building2 className="w-3 h-3 text-blue-600 shrink-0" />
                            <span>{app.company_name}</span>
                            {app.company_verification === 'verified' && (
                              <FacebookVerifiedBadge
                                className="w-3.5 h-3.5 shrink-0"
                                title={isKhmer ? 'ក្រុមហ៊ុនបានផ្ទៀងផ្ទាត់' : 'Verified Company'}
                              />
                            )}
                          </span>

                          <Link
                            to={`/jobs/${app.job_slug}`}
                            target="_blank"
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200/80 text-[11px] font-semibold text-blue-700 transition"
                          >
                            <Briefcase className="w-3 h-3 shrink-0" />
                            <span>{isKhmer && app.job_title_km ? app.job_title_km : app.job_title}</span>
                            <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                          </Link>
                        </div>

                        {/* Contact Metadata */}
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-1">
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span>{app.applicant_email}</span>
                          </span>
                          {app.applicant_phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span>{app.applicant_phone}</span>
                            </span>
                          )}
                          {app.applicant_province && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              <span>{app.applicant_province}</span>
                            </span>
                          )}
                          {app.expected_salary && (
                            <span className="flex items-center gap-0.5 text-emerald-700 font-semibold">
                              <DollarSign className="w-3 h-3 text-emerald-600" />
                              <span>
                                {isKhmer ? 'ប្រាក់ខែរំពឹងទុក:' : 'Expected:'} $
                                {Number(app.expected_salary).toLocaleString()}
                              </span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-start">
                      <button
                        type="button"
                        onClick={() => toggleExpand(app.id)}
                        className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-gray-200 text-slate-700 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        <FileText className="w-3.5 h-3.5 text-slate-500" />
                        <span>
                          {isExpanded
                            ? isKhmer
                              ? 'បិទព័ត៌មាន'
                              : 'Hide CV'
                            : isKhmer
                            ? 'មើលព័ត៌មាន CV'
                            : 'View CV'}
                        </span>
                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>

                  {/* Cover Letter */}
                  {app.cover_letter && (
                    <div className="p-3 rounded-xl bg-slate-50 border border-gray-100 text-xs text-slate-700 leading-relaxed">
                      <span className="font-semibold block text-slate-800 mb-0.5">
                        {isKhmer ? 'លិខិតបញ្ជាក់ចំណាប់អារម្មណ៍:' : 'Cover Letter:'}
                      </span>
                      <p className="whitespace-pre-line text-slate-600">{app.cover_letter}</p>
                    </div>
                  )}

                  {/* Scheduled Interview Info */}
                  {app.interview && (
                    <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-200/70 text-xs flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
                        <span className="font-bold text-slate-800">
                          {isKhmer ? 'កាលវិភាគសម្ភាសន៍:' : 'Interview Scheduled:'}
                        </span>
                        <span className="text-slate-600 font-medium">
                          {new Date(app.interview.scheduled_at).toLocaleString(
                            isKhmer ? 'km-KH' : 'en-US',
                            { dateStyle: 'medium', timeStyle: 'short' }
                          )}
                        </span>
                      </div>
                      {app.interview.location_or_link && (
                        <span className="text-[11px] font-semibold text-blue-700 truncate max-w-xs">
                          {app.interview.location_or_link}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Expanded CV / Profile Details */}
                  {isExpanded && (
                    <div className="pt-3 border-t border-gray-100 space-y-3.5 animate-in fade-in duration-150">
                      {app.applicant_summary && (
                        <div className="space-y-1">
                          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                            {isKhmer ? 'សេចក្តីសង្ខេបអំពីបេក្ខជន' : 'Professional Summary'}
                          </span>
                          <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-gray-100">
                            {app.applicant_summary}
                          </p>
                        </div>
                      )}

                      {app.skills && app.skills.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                            {isKhmer ? 'ជំនាញ' : 'Skills'}
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {app.skills.map((sk: any, idx: number) => (
                              <span
                                key={idx}
                                className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 border border-gray-200"
                              >
                                {sk.skill_name || sk.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {app.experiences && app.experiences.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                            {isKhmer ? 'បទពិសោធន៍ការងារ' : 'Work Experience'}
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {app.experiences.map((exp: any, idx: number) => (
                              <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-gray-100 text-xs">
                                <p className="font-semibold text-slate-800">{exp.job_title}</p>
                                <p className="text-[11px] text-slate-500">{exp.company_name}</p>
                                <p className="text-[10px] text-slate-400">
                                  {exp.start_date} –{' '}
                                  {exp.is_current
                                    ? isKhmer
                                      ? 'បច្ចុប្បន្ន'
                                      : 'Present'
                                    : exp.end_date || ''}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {app.educations && app.educations.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                            {isKhmer ? 'ការអប់រំ' : 'Education'}
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {app.educations.map((edu: any, idx: number) => (
                              <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-gray-100 text-xs">
                                <p className="font-semibold text-slate-800">
                                  {edu.degree} {edu.field_of_study ? `— ${edu.field_of_study}` : ''}
                                </p>
                                <p className="text-[11px] text-slate-500">{edu.school}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-2.5 border-t border-gray-100 text-xs">
                    <span className="text-slate-400">
                      {isKhmer ? 'បានដាក់ពាក្យនៅ ' : 'Applied on '}
                      {new Date(app.created_at).toLocaleDateString(isKhmer ? 'km-KH' : 'en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>

                    {app.resume_path ? (
                      <a
                        href={getAssetUrl(app.resume_path)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-gray-200 font-semibold transition shadow-2xs"
                      >
                        <Download className="w-3.5 h-3.5 text-blue-600" />
                        <span>{isKhmer ? 'ទាញយក / មើល CV' : 'View / Download CV'}</span>
                        <ExternalLink className="w-3 h-3 text-blue-400" />
                      </a>
                    ) : (
                      <span className="text-slate-400 italic text-[11px]">
                        {isKhmer ? 'ដាក់ពាក្យតាមប្រវត្តិរូប' : 'Profile application'}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}

          <TablePagination
            currentPage={currentPage}
            totalItems={filteredApplications.length}
            pageSize={pageSize}
            pageSizeOptions={[25, 50, 100]}
            onPageChange={(p) => setCurrentPage(p)}
            onPageSizeChange={(s) => {
              setPageSize(s)
              setCurrentPage(1)
            }}
          />
        </div>
      )}
    </div>
  )
}
export default AdminApplicationsPage
