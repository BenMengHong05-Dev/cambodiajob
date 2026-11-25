import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { employerService } from '../../services/employer.service'
import { Application, Job } from '../../types'
import { Select } from '../../components/ui/Select'
import { useToast } from '../../app/providers'
import { exportApplicantsToExcel } from '../../utils/excelExport'
import { getAssetUrl } from '../../utils/assets'
import { PermissionGuard } from '../../components/auth/PermissionGuard'
import { PERMISSIONS } from '../../utils/permissions'
import {
  Users,
  FileText,
  Phone,
  Mail,
  MapPin,
  Calendar,
  ArrowLeft,
  X,
  ExternalLink,
  Video,
  Sparkles,
  Clipboard,
  Info,
  Trash2,
  DollarSign,
  ChevronDown,
  ChevronUp,
  Download,
  AlertTriangle,
  Search,
  Filter,
  FileSpreadsheet,
  Briefcase,
} from 'lucide-react'
import { TablePagination } from '../../components/common/TablePagination'
import { MapPickerModal } from '../../components/common/MapPickerModal'

export const EmployerApplicationsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const { i18n } = useTranslation()
  const { toast } = useToast()
  const isKhmer = i18n.language === 'km'

  const [job, setJob] = useState<Job | null>(null)
  const [applications, setApplications] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [jobFilter, setJobFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)

  // Expanded details drawer/card for each candidate
  const [expandedAppIds, setExpandedAppIds] = useState<number[]>([])

  // Interview modal
  const [isInterviewModalOpen, setIsInterviewModalOpen] = useState(false)
  const [selectedAppId, setSelectedAppId] = useState<number | null>(null)
  const [scheduledAt, setScheduledAt] = useState('')
  const [locationOrLink, setLocationOrLink] = useState('')
  const [interviewType, setInterviewType] = useState('online')
  const [interviewNotes, setInterviewNotes] = useState('')
  const [sendEmail, setSendEmail] = useState(true)
  const [isScheduling, setIsScheduling] = useState(false)
  const [isGeneratingMeet, setIsGeneratingMeet] = useState(false)
  const [isMapPickerOpen, setIsMapPickerOpen] = useState(false)

  // Delete modal
  const [deleteCandidateId, setDeleteCandidateId] = useState<number | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchApplicants = async () => {
    setIsLoading(true)
    try {
      if (id) {
        const data = await employerService.getJobApplicants(Number(id))
        setJob(data.job)
        setApplications(data.applications || [])
      } else {
        const apps = await employerService.getAllApplicants()
        setJob(null)
        setApplications(apps || [])
      }
    } catch (err) {
      console.error('Failed to load applications:', err)
      toast.error(
        isKhmer ? 'បរាជ័យ' : 'Error',
        isKhmer ? 'មិនអាចទាញយកបញ្ជីបេក្ខជនបានទេ' : 'Could not load candidate applications.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchApplicants()
  }, [id])

  const toggleExpand = (appId: number) => {
    setExpandedAppIds((prev) =>
      prev.includes(appId) ? prev.filter((i) => i !== appId) : [...prev, appId]
    )
  }

  const handleExportExcel = () => {
    if (!applications || applications.length === 0) return
    try {
      exportApplicantsToExcel(applications, job?.title || job?.slug, isKhmer)
      toast.success(
        isKhmer ? 'បានទាញយកទិន្នន័យជោគជ័យ' : 'Excel Exported',
        isKhmer
          ? 'ឯកសារ Microsoft Excel (.xlsx) ត្រូវបានទាញយកទៅកាន់ឧបករណ៍របស់អ្នក'
          : 'Candidate list exported to Microsoft Excel (.xlsx).'
      )
    } catch (err) {
      console.error('Failed to export Excel:', err)
      toast.error(
        isKhmer ? 'បរាជ័យ' : 'Error',
        isKhmer ? 'មិនអាចនាំចេញឯកសារ Excel បានទេ' : 'Failed to export Excel file.'
      )
    }
  }

  const handleStatusChange = async (appId: number, newStatus: string) => {
    try {
      await employerService.updateApplicantStatus(appId, newStatus)
      setApplications((prev) =>
        prev.map((a) => (a.id === appId ? { ...a, status: newStatus as any } : a))
      )
      toast.success(
        isKhmer ? 'ស្ថានភាពត្រូវបានផ្លាស់ប្តូរ' : 'Status Updated',
        isKhmer ? 'ស្ថានភាពបេក្ខជនត្រូវបានកែប្រែដោយជោគជ័យ' : 'Applicant status has been updated successfully.'
      )
    } catch (err: any) {
      console.error('Failed to update status:', err)
      const errorMsg =
        err.response?.data?.details?.status?.[0] ||
        err.response?.data?.error ||
        err.response?.data?.message ||
        (isKhmer ? 'មិនអាចផ្លាស់ប្តូរស្ថានភាពបេក្ខជនបានទេ' : 'Failed to update applicant status.')
      toast.error(
        isKhmer ? 'បរាជ័យ' : 'Error',
        errorMsg
      )
    }
  }

  const handleDeleteApplicant = async () => {
    if (!deleteCandidateId) return
    setIsDeleting(true)
    try {
      await employerService.deleteApplication(deleteCandidateId)
      setApplications((prev) => prev.filter((a) => a.id !== deleteCandidateId))
      setDeleteCandidateId(null)
      toast.success(
        isKhmer ? 'បានដកបេក្ខជនចេញ' : 'Candidate Removed',
        isKhmer ? 'ពាក្យសុំត្រូវបានដកចេញពីបញ្ជីដោយជោគជ័យ' : 'Applicant has been removed from list.'
      )
    } catch (err) {
      toast.error(
        isKhmer ? 'បរាជ័យ' : 'Error',
        isKhmer ? 'មិនអាចដកបេក្ខជនចេញបានទេ' : 'Failed to remove applicant.'
      )
    } finally {
      setIsDeleting(false)
    }
  }

  const handleOpenGoogleMeetNew = () => {
    window.open('https://meet.google.com/new', '_blank', 'noopener,noreferrer')
  }

  const handleGenerateMeetLink = () => {
    const meetUrl = 'https://meet.google.com/new'
    setLocationOrLink(meetUrl)
    window.open(meetUrl, '_blank', 'noopener,noreferrer')
    toast.success(
      isKhmer ? 'បានបើក Google Meet' : 'Google Meet Opened',
      isKhmer
        ? 'តំណភ្ជាប់ត្រូវបានបញ្ចូល និងបើក Google Meet រួចរាល់ (អ្នកអាច Copy លេខកូដបន្ទប់ពិតមកបិទភ្ជាប់បាន)'
        : 'Google Meet opened. You can also copy the created room link and paste it here.'
    )
  }

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText()
      if (text && text.trim().startsWith('http')) {
        setLocationOrLink(text.trim())
        toast.success(
          isKhmer ? 'បានបិទភ្ជាប់តំណភ្ជាប់' : 'Link Pasted',
          isKhmer ? 'តំណភ្ជាប់ Meet ត្រូវបានបញ្ចូលដោយជោគជ័យ' : 'Meet link pasted successfully.'
        )
      } else {
        toast.info(
          isKhmer ? 'មិនមានតំណភ្ជាប់' : 'No Link Found',
          isKhmer ? 'សូមចម្លងតំណភ្ជាប់ពី Google Meet ជាមុនសិន' : 'Please copy the Meet link from Google first.'
        )
      }
    } catch {
      toast.info(
        isKhmer ? 'សូមចុច Ctrl+V' : 'Use Ctrl+V',
        isKhmer ? 'សូមចុច Ctrl+V ដើម្បីបិទភ្ជាប់តំណភ្ជាប់ក្នុងប្រអប់' : 'Press Ctrl+V to paste into the field.'
      )
    }
  }

  const openInterviewModal = (appId: number) => {
    setSelectedAppId(appId)
    const app = applications.find((a) => a.id === appId)
    if (app && app.interview && app.interview.scheduled_at) {
      const d = new Date(app.interview.scheduled_at)
      if (!isNaN(d.getTime())) {
        const localIso = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
        setScheduledAt(localIso)
      } else {
        setScheduledAt('')
      }
      setLocationOrLink(app.interview.location_or_link || '')
      setInterviewType(app.interview.interview_type || 'online')
      setInterviewNotes(app.interview.notes || '')
    } else {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(10, 0, 0, 0)
      const localIso = new Date(tomorrow.getTime() - tomorrow.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
      setScheduledAt(localIso)
      setLocationOrLink('')
      setInterviewType('online')
      setInterviewNotes('')
    }
    setSendEmail(false)
    setIsInterviewModalOpen(true)
  }

  const handleScheduleInterview = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAppId) return
    setIsScheduling(true)
    try {
      const res = await employerService.scheduleInterview(selectedAppId, {
        scheduled_at: scheduledAt,
        location_or_link: locationOrLink,
        interview_type: interviewType,
        notes: interviewNotes,
        send_email: false,
      })
      setIsInterviewModalOpen(false)
      setScheduledAt('')
      setLocationOrLink('')
      setInterviewNotes('')
      toast.success(
        isKhmer ? 'បានកំណត់ការសម្ភាសន៍' : 'Interview Scheduled',
        isKhmer
          ? 'ការណាត់សម្ភាសន៍ត្រូវបានកំណត់ដោយជោគជ័យ'
          : 'Interview has been scheduled successfully.'
      )
      fetchApplicants()
    } catch (err) {
      toast.error(
        isKhmer ? 'បរាជ័យ' : 'Error',
        isKhmer ? 'មិនអាចកំណត់ការសម្ភាសន៍បានទេ' : 'Failed to schedule interview.'
      )
    } finally {
      setIsScheduling(false)
    }
  }

  // Dynamic Status Badge
  const getDynamicStatusBadge = (status: string) => {
    switch (status) {
      case 'submitted':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-normal bg-blue-50 text-blue-700 border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            <span>{isKhmer ? 'បានដាក់ពាក្យ' : 'Submitted'}</span>
          </span>
        )
      case 'screening':
      case 'reviewing':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-normal bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span>{isKhmer ? 'កំពុងត្រួតពិនិត្យ' : 'In Screening'}</span>
          </span>
        )
      case 'shortlisted':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-normal bg-purple-50 text-purple-700 border border-purple-200">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
            <span>{isKhmer ? 'ជាប់បញ្ជីសម្រាំង' : 'Shortlisted'}</span>
          </span>
        )
      case 'interview':
      case 'interview_scheduled':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-normal bg-indigo-50 text-indigo-700 border border-indigo-200">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            <span>{isKhmer ? 'ណាត់សម្ភាសន៍' : 'Interview Scheduled'}</span>
          </span>
        )
      case 'offered':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-normal bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            <span>{isKhmer ? 'ផ្តល់ការងារ' : 'Job Offered'}</span>
          </span>
        )
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-normal bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            <span>{isKhmer ? 'មិនជ្រើសរើស' : 'Rejected'}</span>
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-gray-200 capitalize">
            {status}
          </span>
        )
    }
  }

  const normalizeAppStatus = (st?: string) => {
    if (!st) return 'submitted'
    if (st === 'screening') return 'reviewing'
    if (st === 'interview_scheduled') return 'interview'
    return st
  }

  const candidateStatusOptions = [
    { value: 'submitted', label: isKhmer ? 'បានដាក់ពាក្យ' : 'Submitted' },
    { value: 'reviewing', label: isKhmer ? 'កំពុងត្រួតពិនិត្យ' : 'In Review' },
    { value: 'shortlisted', label: isKhmer ? 'ជាប់បញ្ជីសម្រាំង' : 'Shortlisted' },
    { value: 'interview', label: isKhmer ? 'ណាត់សម្ភាសន៍' : 'Interview Scheduled' },
    { value: 'offered', label: isKhmer ? 'ផ្តល់ការងារ' : 'Offered' },
    { value: 'rejected', label: isKhmer ? 'បដិសេធ' : 'Rejected' },
  ]

  const interviewTypeOptions = [
    {
      value: 'online',
      label: isKhmer ? 'សម្ភាសន៍តាមវីដេអូ Google Meet' : 'Online Video (Google Meet)',
    },
    {
      value: 'in_person',
      label: isKhmer ? 'ជួបផ្ទាល់នៅការិយាល័យ' : 'In-Person (Office Headquarters)',
    },
  ]

  const distinctJobs = Array.from(
    new Map(
      applications
        .filter((a) => a.job_id && a.job_title)
        .map((a) => [String(a.job_id), { id: String(a.job_id), title: String(a.job_title) }])
    ).values()
  )

  // Filter candidates
  const filteredApplicants = applications.filter((app) => {
    const matchesQuery =
      !searchQuery.trim() ||
      app.applicant_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.applicant_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.applicant_headline?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.job_title?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus =
      statusFilter === 'all' ||
      normalizeAppStatus(app.status) === normalizeAppStatus(statusFilter)
    const matchesJob = id || jobFilter === 'all' || String(app.job_id) === jobFilter
    return matchesQuery && matchesStatus && matchesJob
  })

  if (isLoading) {
    return (
      <div className="py-24 text-center font-sans">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="mt-3 text-xs font-normal text-slate-500">
          {isKhmer ? 'កំពុងដំណើរការទាញយកបញ្ជីបេក្ខជន...' : 'Loading candidate applications...'}
        </p>
      </div>
    )
  }

  return (
    <div className="w-full space-y-4 sm:space-y-5 font-sans pb-16">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-2xs">
        <div className="space-y-1">
          <Link
            to={id ? '/employer/jobs' : '/employer/dashboard'}
            className="inline-flex items-center text-xs font-medium text-slate-500 hover:text-blue-600 transition mb-0.5"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            <span>
              {id
                ? isKhmer
                  ? 'ត្រឡប់ទៅការងារទាំងអស់'
                  : 'Back to Vacancies'
                : isKhmer
                  ? 'ត្រឡប់ទៅផ្ទាំងគ្រប់គ្រង'
                  : 'Back to Dashboard'}
            </span>
          </Link>
          <div className="flex items-center space-x-2">
            <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              {job?.title ||
                (id
                  ? isKhmer
                    ? 'គ្រប់គ្រងបេក្ខជន'
                    : 'Applicant Pipeline'
                  : isKhmer
                    ? 'បេក្ខជនទាំងអស់ទូទាំងក្រុមហ៊ុន'
                    : 'All Company Applicants')}
            </h1>
            {job?.slug && (
              <Link
                to={`/jobs/${job.slug}`}
                target="_blank"
                className="text-slate-400 hover:text-blue-600 transition"
                title="View Public Job"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
          <p className="text-xs text-slate-500">
            {isKhmer
              ? 'គ្រប់គ្រង ពិនិត្យប្រវត្តិរូប CV និងកំណត់ការសម្ភាសន៍ជាមួយបេក្ខជន'
              : 'Review candidate profiles, check resumes/CVs, and schedule interviews'}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 border border-gray-200 text-xs font-semibold flex items-center space-x-1.5 shadow-2xs">
            <Users className="w-3.5 h-3.5 text-blue-600" />
            <span>{applications.length} {isKhmer ? 'បេក្ខជនបានដាក់ពាក្យ' : 'Total Applicants'}</span>
          </div>

          <button
            type="button"
            onClick={handleExportExcel}
            disabled={applications.length === 0}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center space-x-1.5 transition shadow-2xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            title={isKhmer ? 'ទាញយកទិន្នន័យបេក្ខជនទាំងអស់ជា Microsoft Excel (.xlsx)' : 'Export candidate pipeline to Microsoft Excel (.xlsx)'}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>{isKhmer ? 'នាំចេញជា Excel' : 'Export Excel'}</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-gray-200 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setCurrentPage(1)
              }}
              placeholder={isKhmer ? 'ស្វែងរកតាមឈ្មោះ អ៊ីមែល ឬមុខតំណែង...' : 'Search by name, email, or vacancy...'}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-gray-200 rounded-xl text-slate-800 placeholder-slate-400 font-medium outline-none focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition"
            />
          </div>
          {!id && distinctJobs.length > 0 && (
            <select
              value={jobFilter}
              onChange={(e) => {
                setJobFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="px-3 py-1.5 text-xs bg-slate-50 border border-gray-200 rounded-xl text-slate-700 font-semibold outline-none focus:bg-white focus:border-blue-500 max-w-xs cursor-pointer"
            >
              <option value="all">{isKhmer ? 'ការងារទាំងអស់' : 'All Vacancies'}</option>
              {distinctJobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
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
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold transition shrink-0 cursor-pointer ${statusFilter === tab.id
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
      {filteredApplicants.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center space-y-2 shadow-2xs">
          <Users className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-xs sm:text-sm font-bold text-slate-900">
            {isKhmer ? 'រកមិនឃើញបេក្ខជនទេ' : 'No applicants found'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {applications.length === 0
              ? isKhmer
                ? 'មិនទាន់មានបេក្ខជនដាក់ពាក្យស្នើសុំការងារនេះនៅឡើយទេ។'
                : 'No candidates have submitted an application for this vacancy yet.'
              : isKhmer
                ? 'សូមសាកល្បងផ្លាស់ប្តូរតម្រងស្វែងរក។'
                : 'Try clearing your search query or selecting a different status filter.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredApplicants
            .slice((currentPage - 1) * pageSize, currentPage * pageSize)
            .map((app: any) => {
              const isExpanded = expandedAppIds.includes(app.id)

              return (
                <div
                  key={app.id}
                  className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 shadow-2xs space-y-4 hover:border-blue-400 transition"
                >
                  {/* 1. Main Candidate Header Row */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex items-start space-x-3.5">
                      {/* Avatar */}
                      <div className="w-11 h-11 rounded-full bg-blue-50 text-blue-700 border border-gray-200 font-semibold flex items-center justify-center text-sm shrink-0 shadow-2xs">
                        {app.applicant_avatar ? (
                          <img
                            src={getAssetUrl(app.applicant_avatar)}
                            alt={app.applicant_name}
                            className="w-full h-full object-cover rounded-full"
                          />
                        ) : (
                          <span>{app.applicant_name?.charAt(0) || 'C'}</span>
                        )}
                      </div>

                      {/* Details */}
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-xs sm:text-sm font-bold text-slate-900">{app.applicant_name}</h3>
                          {getDynamicStatusBadge(app.status)}
                          {!id && app.job_title && (
                            <Link
                              to={`/employer/jobs/${app.job_id}/applications`}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200/80 transition"
                            >
                              <Briefcase className="w-3 h-3 text-slate-400" />
                              <span className="truncate max-w-[180px]">{app.job_title}</span>
                            </Link>
                          )}
                        </div>

                        <p className="text-xs text-slate-500">
                          {app.applicant_headline || (isKhmer ? 'បេក្ខជនការងារ' : 'Candidate Professional')}
                        </p>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-0.5">
                          <span className="flex items-center">
                            <Mail className="w-3 h-3 mr-1 text-slate-400" />
                            <span>{app.applicant_email}</span>
                          </span>
                          {app.applicant_phone && (
                            <span className="flex items-center">
                              <Phone className="w-3 h-3 mr-1 text-slate-400" />
                              <span>{app.applicant_phone}</span>
                            </span>
                          )}
                          {app.applicant_province && (
                            <span className="flex items-center">
                              <MapPin className="w-3 h-3 mr-1 text-slate-400" />
                              <span>{app.applicant_province}</span>
                            </span>
                          )}
                          {app.expected_salary && (
                            <span className="flex items-center text-emerald-700 font-semibold">
                              <DollarSign className="w-3 h-3 mr-0.5 text-emerald-600" />
                              <span>
                                {isKhmer ? 'ប្រាក់ខែរំពឹងទុក:' : 'Expected:'} ${Number(app.expected_salary).toLocaleString()}
                              </span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Top Action Controls: Status Switcher, Interview, Delete */}
                    <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto shrink-0">
                      <PermissionGuard permission={PERMISSIONS.REVIEW_APPLICATIONS}>
                        {/* Status Dropdown */}
                        <div className="w-36">
                          <Select
                            size="sm"
                            searchable={false}
                            value={normalizeAppStatus(app.status)}
                            onChange={(e) => handleStatusChange(app.id, e.target.value)}
                            options={candidateStatusOptions}
                            className="[&_[role=button]]:h-8"
                          />
                        </div>

                        {/* Schedule Interview Button (Blue) */}
                        <button
                          type="button"
                          onClick={() => openInterviewModal(app.id)}
                          className="h-8 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 border border-gray-200 text-blue-700 text-xs font-semibold transition inline-flex items-center space-x-1 cursor-pointer shadow-2xs whitespace-nowrap"
                        >
                          <Calendar className="w-3.5 h-3.5 text-blue-600" />
                          <span>{isKhmer ? 'សម្ភាសន៍' : 'Interview'}</span>
                        </button>
                      </PermissionGuard>

                      {/* View Details Toggle Button */}
                      <button
                        type="button"
                        onClick={() => toggleExpand(app.id)}
                        className="h-8 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-gray-200 text-slate-700 text-xs font-semibold transition inline-flex items-center space-x-1 cursor-pointer shadow-2xs whitespace-nowrap"
                      >
                        <FileText className="w-3.5 h-3.5 text-slate-500" />
                        <span>{isExpanded ? (isKhmer ? 'បិទ' : 'Hide') : (isKhmer ? 'ព័ត៌មាន CV' : 'View CV')}</span>
                        {isExpanded ? <ChevronUp className="w-3 h-3 ml-0.5" /> : <ChevronDown className="w-3 h-3 ml-0.5" />}
                      </button>

                      {/* Delete Applicant Button (Red) */}
                      <PermissionGuard permission={PERMISSIONS.REVIEW_APPLICATIONS}>
                        <button
                          type="button"
                          onClick={() => setDeleteCandidateId(app.id)}
                          className="h-8 w-8 inline-flex items-center justify-center text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-gray-200 rounded-xl transition cursor-pointer shadow-2xs"
                          title={isKhmer ? 'លុបបេក្ខជន' : 'Remove candidate'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </PermissionGuard>
                    </div>
                  </div>

                  {/* 2. Cover Letter Snippet */}
                  {app.cover_letter && (
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-gray-100 text-xs text-slate-700 leading-relaxed">
                      <span className="font-semibold block text-slate-800 mb-1">
                        {isKhmer ? 'លិខិតបញ្ជាក់ចំណាប់អារម្មណ៍ (Cover Note):' : 'Cover Letter:'}
                      </span>
                      <p className="whitespace-pre-line text-slate-600">{app.cover_letter}</p>
                    </div>
                  )}

                  {/* 3. Interview Scheduled Notification Box & Calendar Sync */}
                  {app.interview && (
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50/90 via-indigo-50/40 to-blue-50/80 border border-blue-200/90 text-xs text-slate-800 space-y-3 shadow-2xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                            <Calendar className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 text-xs sm:text-sm">
                                {isKhmer ? 'កាលវិភាគសម្ភាសន៍បានកំណត់' : 'Interview Scheduled'}
                              </span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 border border-blue-200 uppercase tracking-wide">
                                {app.interview.interview_type === 'online'
                                  ? (isKhmer ? 'វីដេអូអនឡាញ' : 'Online Video')
                                  : app.interview.interview_type === 'in_person'
                                    ? (isKhmer ? 'នៅការិយាល័យ' : 'In-Person')
                                    : (isKhmer ? 'ទូរស័ព្ទ' : 'Phone')}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 font-medium mt-0.5">
                              {new Date(app.interview.scheduled_at).toLocaleString(isKhmer ? 'km-KH' : 'en-US', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                        </div>

                        {/* Right actions: Reschedule */}
                        <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto">
                          <PermissionGuard permission={PERMISSIONS.REVIEW_APPLICATIONS}>
                            <button
                              type="button"
                              onClick={() => openInterviewModal(app.id)}
                              className="px-2.5 py-1 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-semibold transition shadow-2xs cursor-pointer"
                            >
                              {isKhmer ? 'កែប្រែកាលបរិច្ឆេទ' : 'Reschedule'}
                            </button>
                          </PermissionGuard>
                        </div>
                      </div>

                      {/* Location or meeting link */}
                      {app.interview.location_or_link && (
                        <div className="pt-2 border-t border-blue-100 flex flex-wrap items-center gap-2 text-xs">
                          <span className="font-semibold text-slate-600">
                            {app.interview.location_or_link.startsWith('http')
                              ? (isKhmer ? 'តំណភ្ជាប់ប្រជុំ:' : 'Meeting Link:')
                              : (isKhmer ? 'ទីតាំងជួបផ្ទាល់:' : 'Office Location:')}
                          </span>
                          {app.interview.location_or_link.startsWith('http') ? (
                            <a
                              href={app.interview.location_or_link}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-blue-700 font-bold hover:underline"
                            >
                              <Video className="w-3.5 h-3.5 text-blue-600" />
                              <span className="truncate max-w-sm">{app.interview.location_or_link}</span>
                              <ExternalLink className="w-3 h-3 ml-0.5" />
                            </a>
                          ) : (
                            <span className="font-medium text-slate-800">{app.interview.location_or_link}</span>
                          )}
                        </div>
                      )}

                      {/* Interview Notes if provided */}
                      {app.interview.notes && (
                        <div className="bg-white/80 p-2.5 rounded-xl border border-blue-100 text-[11px] text-slate-600 italic">
                          <span className="font-semibold text-slate-700 not-italic">
                            {isKhmer ? 'កំណត់ចំណាំ:' : 'Notes:'}
                          </span>{' '}
                          {app.interview.notes}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 4. EXPANDABLE SECTION: Detailed Seeker Information & CV */}
                  {isExpanded && (
                    <div className="pt-3 border-t border-gray-100 space-y-4 animate-in fade-in duration-200">
                      {/* Summary */}
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

                      {/* Key Skills */}
                      {app.skills && app.skills.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                            {isKhmer ? 'ជំនាញដែលបេក្ខជនមាន' : 'Candidate Skills'}
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {app.skills.map((sk: any, idx: number) => (
                              <span
                                key={idx}
                                className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 border border-gray-200"
                              >
                                {sk.skill_name || sk.name}
                                {sk.years_experience ? ` (${sk.years_experience}y)` : ''}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Work Experiences */}
                      {app.experiences && app.experiences.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                            {isKhmer ? 'បទពិសោធន៍ការងារកន្លងមក' : 'Work Experience History'}
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {app.experiences.map((exp: any, idx: number) => (
                              <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-gray-100 text-xs space-y-0.5">
                                <p className="font-semibold text-slate-800">{exp.job_title}</p>
                                <p className="text-[11px] text-slate-500">{exp.company_name}</p>
                                <p className="text-[10px] text-slate-400">
                                  {exp.start_date} –{' '}
                                  {exp.is_current
                                    ? isKhmer
                                      ? 'បច្ចុប្បន្ន'
                                      : 'Present'
                                    : exp.end_date || (isKhmer ? 'កន្លងមក' : 'Past')}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Education */}
                      {app.educations && app.educations.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                            {isKhmer ? 'កម្រិតវប្បធម៌ & ការអប់រំ' : 'Education History'}
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {app.educations.map((edu: any, idx: number) => (
                              <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-gray-100 text-xs space-y-0.5">
                                <p className="font-semibold text-slate-800">{edu.degree} in {edu.field_of_study}</p>
                                <p className="text-[11px] text-slate-500">{edu.school}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 5. Bottom Card Footer: Application Timestamp & Direct CV Link */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-xs">
                    <span className="text-slate-400">
                      {isKhmer ? 'បានដាក់ពាក្យនៅ ' : 'Applied on '}{' '}
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
                        <span>{isKhmer ? 'ទាញយក / មើលឯកសារ CV' : 'View / Download CV'}</span>
                        <ExternalLink className="w-3 h-3 text-blue-400" />
                      </a>
                    ) : (
                      <span className="text-slate-400 italic text-[11px]">
                        {isKhmer ? 'មិនបានភ្ជាប់ឯកសារ CV ដាច់ដោយឡែកទេ' : 'Profile application (no CV attachment)'}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}

          {/* Pagination */}
          <TablePagination
            currentPage={currentPage}
            totalItems={filteredApplicants.length}
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

      {/* Schedule Interview Modal */}
      {isInterviewModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-2xl max-w-lg w-full overflow-hidden animate-scale-in font-sans">
            {/* Modal Header */}
            <div className="px-6 py-5 bg-white border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-slate-900">
                    {isKhmer ? 'កំណត់កាលវិភាគសម្ភាសន៍' : 'Schedule Candidate Interview'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {isKhmer ? 'កំណត់កាលបរិច្ឆេទ ទម្រង់ និងទីតាំងសម្ភាសន៍' : 'Set date, format, and interview details'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsInterviewModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Candidate Recipient Banner */}
              {selectedAppId && (() => {
                const app = applications.find((a) => a.id === selectedAppId)
                if (!app) return null
                return (
                  <div className="p-3 bg-slate-50/80 rounded-2xl border border-slate-200/80 flex items-center justify-between">
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-2xs">
                        {app.applicant_name?.charAt(0).toUpperCase() || 'C'}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 text-xs truncate">{app.applicant_name}</div>
                        <div className="text-[11px] text-slate-400 truncate">{app.applicant_email}</div>
                      </div>
                    </div>
                    {app.applicant_province && (
                      <span className="text-[10px] font-semibold text-slate-600 bg-white px-2.5 py-0.5 rounded-full border border-slate-200 shrink-0 shadow-2xs">
                        {app.applicant_province}
                      </span>
                    )}
                  </div>
                )
              })()}

              <form onSubmit={handleScheduleInterview} className="space-y-4">
                {/* 1. Date & Time (Full Row) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {isKhmer ? 'កាលបរិច្ឆេទ & ម៉ោងសម្ភាសន៍' : 'Date & Time'}{' '}
                    <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className="w-full px-3.5 py-2 min-h-[38px] text-xs sm:text-sm bg-slate-50 border border-gray-200 rounded-xl text-slate-900 placeholder:text-slate-400 font-medium outline-none hover:border-gray-300 hover:bg-slate-100/60 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition"
                  />
                </div>

                {/* 2. Interview Format Dropdown (Full Row) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {isKhmer ? 'ទម្រង់សម្ភាសន៍' : 'Interview Format'}
                  </label>
                  <Select
                    value={interviewType}
                    onChange={(e) => {
                      const nextType = e.target.value
                      setInterviewType(nextType)
                      if (nextType === 'in_person' && locationOrLink.startsWith('http')) {
                        setLocationOrLink('')
                      }
                    }}
                    options={interviewTypeOptions}
                  />
                </div>

                {/* 3. Meeting Link or Location */}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      {interviewType === 'online'
                        ? isKhmer
                          ? 'តំណភ្ជាប់បន្ទប់ Google Meet'
                          : 'Google Meet Room Link'
                        : isKhmer
                          ? 'ទីតាំងការិយាល័យសម្ភាសន៍'
                          : 'Office Interview Location'}
                    </label>
                    {interviewType === 'online' ? (
                      <button
                        type="button"
                        onClick={handleGenerateMeetLink}
                        disabled={isGeneratingMeet}
                        className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition cursor-pointer shrink-0 disabled:opacity-60"
                      >
                        {isGeneratingMeet ? (
                          <div className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Sparkles className="w-3.5 h-3.5" />
                        )}
                        <span>
                          {isGeneratingMeet
                            ? isKhmer
                              ? 'កំពុងបង្កើត...'
                              : 'Generating...'
                            : isKhmer
                              ? 'បង្កើតតំណភ្ជាប់'
                              : 'Generate Link'}
                        </span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsMapPickerOpen(true)}
                        className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition cursor-pointer shrink-0"
                      >
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{isKhmer ? 'បើកផែនទី' : 'Open Map'}</span>
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      value={locationOrLink}
                      onChange={(e) => setLocationOrLink(e.target.value)}
                      placeholder={
                        interviewType === 'online'
                          ? 'https://meet.google.com/xxx-yyyy-zzz'
                          : isKhmer
                            ? 'ឧ. អគារការិយាល័យកណ្តាល ជាន់ទី ៣...'
                            : 'e.g. Head Office, 3rd Floor...'
                      }
                      className="w-full pl-3.5 pr-9 py-2 min-h-[38px] text-xs sm:text-sm bg-slate-50 border border-gray-200 rounded-xl text-slate-900 placeholder:text-slate-400 font-medium outline-none hover:border-gray-300 hover:bg-slate-100/60 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition"
                    />
                    {locationOrLink ? (
                      <button
                        type="button"
                        onClick={() => setLocationOrLink('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                        title={isKhmer ? 'សម្អាត' : 'Clear'}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      interviewType === 'online' && (
                        <button
                          type="button"
                          onClick={handlePasteClipboard}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                          title={isKhmer ? 'បិទភ្ជាប់តំណភ្ជាប់' : 'Paste link'}
                        >
                          <Clipboard className="w-3.5 h-3.5" />
                        </button>
                      )
                    )}
                  </div>
                  {interviewType === 'online' && (
                    <div className="mt-1.5 space-y-1">
                      {locationOrLink && locationOrLink.startsWith('http') ? (
                        <div className="flex items-center justify-between text-[11px] text-emerald-600 font-medium bg-emerald-50/70 border border-emerald-100 px-2.5 py-1 rounded-lg">
                          <span className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            {isKhmer ? 'តំណភ្ជាប់បន្ទប់ត្រៀមរួចជាស្រេច' : 'Meeting link verified'}
                          </span>
                          <a
                            href={locationOrLink}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 hover:underline inline-flex items-center gap-1 font-bold"
                          >
                            <span>{isKhmer ? 'សាកល្បងបើកតំណភ្ជាប់' : 'Test Link'}</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
                          <Info className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                          <span>
                            {isKhmer
                              ? 'Google Meet តម្រូវឱ្យបង្កើតបន្ទប់លើ Google ជាមុន (ចុច "បង្កើតបន្ទប់លើ Meet" រួច Copy តំណភ្ជាប់មកបិទភ្ជាប់ទីនេះ)'
                              : 'Google Meet requires creating the room on Google first (click "Create Room on Meet" then copy and paste the link here)'}
                          </span>
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* 4. Notes for Candidate */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {isKhmer ? 'កំណត់សម្គាល់សម្រាប់បេក្ខជន (ស្រេចចិត្ត)' : 'Notes for Candidate (Optional)'}
                  </label>
                  <textarea
                    rows={3}
                    value={interviewNotes}
                    onChange={(e) => setInterviewNotes(e.target.value)}
                    placeholder={isKhmer ? 'ឧ. សូមត្រៀម Portfolio ឬ Resume និងឧបករណ៍ភ្ជាប់អ៊ីនធឺណិត...' : 'e.g. Please bring your portfolio and resume...'}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-gray-200 rounded-xl text-slate-900 placeholder:text-slate-400 font-medium outline-none hover:border-gray-300 hover:bg-slate-100/60 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition resize-none"
                  />
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsInterviewModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition cursor-pointer"
                  >
                    {isKhmer ? 'បោះបង់' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    disabled={isScheduling}
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-500/20 active:scale-98 transition flex items-center gap-1.5 disabled:opacity-60 cursor-pointer"
                  >
                    {isScheduling ? (
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Calendar className="w-3.5 h-3.5 text-white" />
                    )}
                    <span>
                      {isScheduling
                        ? isKhmer
                          ? 'កំពុងកំណត់...'
                          : 'Scheduling...'
                        : isKhmer
                          ? 'បញ្ជាក់កាលវិភាគ'
                          : 'Confirm Schedule'}
                    </span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Map Picker Modal for In-Person Interviews */}
      <MapPickerModal
        isOpen={isMapPickerOpen}
        onClose={() => setIsMapPickerOpen(false)}
        onSelectLocation={(formattedLocation) => setLocationOrLink(formattedLocation)}
      />

      {/* Delete Candidate Confirmation Modal */}
      {deleteCandidateId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl border border-gray-100 p-6 max-w-sm w-full shadow-2xl space-y-4 font-sans text-center">
            <div className="w-11 h-11 rounded-full bg-rose-50 text-rose-600 border border-gray-200 flex items-center justify-center mx-auto shadow-2xs">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                {isKhmer ? 'តើអ្នកប្រាកដជាចង់ដកបេក្ខជននេះចេញ?' : 'Remove Candidate Application?'}
              </h3>
              <p className="text-xs text-slate-500">
                {isKhmer
                  ? 'សកម្មភាពនេះនឹងលុបពាក្យស្នើសុំរបស់បេក្ខជននេះចេញពីតារាងជ្រើសរើស។'
                  : 'This application will be removed from your recruitment pipeline.'}
              </p>
            </div>
            <div className="flex justify-center space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteCandidateId(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-gray-200 transition cursor-pointer shadow-2xs"
              >
                {isKhmer ? 'បោះបង់' : 'Cancel'}
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteApplicant}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 transition shadow-2xs cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? (isKhmer ? 'កំពុងលុប...' : 'Removing...') : isKhmer ? 'លុបចេញ' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
