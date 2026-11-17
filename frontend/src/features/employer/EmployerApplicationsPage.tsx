import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { employerService } from '../../services/employer.service'
import { Application, Job } from '../../types'
import { Select } from '../../components/ui/Select'
import { useToast } from '../../app/providers'
import { exportApplicantsToExcel } from '../../utils/excelExport'
import { getAssetUrl } from '../../utils/assets'
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
  Trash2,
  DollarSign,
  ChevronDown,
  ChevronUp,
  Download,
  AlertTriangle,
  Search,
  Filter,
  FileSpreadsheet,
} from 'lucide-react'
import { TablePagination } from '../../components/common/TablePagination'

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

  // Delete modal
  const [deleteCandidateId, setDeleteCandidateId] = useState<number | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchApplicants = async () => {
    if (!id) return
    setIsLoading(true)
    try {
      const data = await employerService.getJobApplicants(Number(id))
      setJob(data.job)
      setApplications(data.applications || [])
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
    } catch (err) {
      toast.error(
        isKhmer ? 'បរាជ័យ' : 'Error',
        isKhmer ? 'មិនអាចផ្លាស់ប្តូរស្ថានភាពបេក្ខជនបានទេ' : 'Failed to update applicant status.'
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
      setLocationOrLink('https://meet.google.com/new')
      setInterviewType('online')
      setInterviewNotes('')
    }
    setSendEmail(true)
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
        send_email: sendEmail,
      })
      setIsInterviewModalOpen(false)
      setScheduledAt('')
      setLocationOrLink('')
      setInterviewNotes('')
      toast.success(
        isKhmer ? 'បានកំណត់ការសម្ភាសន៍' : 'Interview Scheduled',
        isKhmer
          ? 'ការណាត់សម្ភាសន៍ត្រូវបានកំណត់ និងបានបញ្ជូនអ៊ីមែល Sync Calendar ជូនបេក្ខជន'
          : 'Interview has been scheduled and calendar invitation email sent to candidate.'
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

  const candidateStatusOptions = [
    { value: 'submitted', label: isKhmer ? 'បានដាក់ពាក្យ (Submitted)' : 'Submitted' },
    { value: 'screening', label: isKhmer ? 'កំពុងត្រួតពិនិត្យ (Screening)' : 'In Screening' },
    { value: 'shortlisted', label: isKhmer ? 'ជាប់បញ្ជីសម្រាំង (Shortlisted)' : 'Shortlisted' },
    { value: 'interview_scheduled', label: isKhmer ? 'ណាត់សម្ភាសន៍ (Interview)' : 'Interview Scheduled' },
    { value: 'offered', label: isKhmer ? 'ផ្តល់ការងារ (Offered)' : 'Offered' },
    { value: 'rejected', label: isKhmer ? 'បដិសេធ (Rejected)' : 'Rejected' },
  ]

  const interviewTypeOptions = [
    { value: 'online', label: 'Online Video (Google Meet / Zoom)' },
    { value: 'in_person', label: 'In-Person (Office Headquarters)' },
    { value: 'phone', label: 'Phone Screening' },
  ]

  // Filter candidates
  const filteredApplicants = applications.filter((app) => {
    const matchesQuery =
      !searchQuery.trim() ||
      app.applicant_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.applicant_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.applicant_headline?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === 'all' || app.status === statusFilter
    return matchesQuery && matchesStatus
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
            to="/employer/jobs"
            className="inline-flex items-center text-xs font-medium text-slate-500 hover:text-blue-600 transition mb-0.5"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            <span>{isKhmer ? 'ត្រឡប់ទៅការងារទាំងអស់' : 'Back to Vacancies'}</span>
          </Link>
          <div className="flex items-center space-x-2">
            <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              {job?.title || (isKhmer ? 'គ្រប់គ្រងបេក្ខជន' : 'Applicant Pipeline')}
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-gray-200 shadow-2xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isKhmer ? 'ស្វែងរកតាមឈ្មោះ អ៊ីមែល ឬជំនាញ...' : 'Search by name, email, or headline...'}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-gray-200 rounded-xl text-slate-800 placeholder-slate-400 font-medium outline-none focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {[
            { id: 'all', label: isKhmer ? 'ទាំងអស់' : 'All' },
            { id: 'submitted', label: isKhmer ? 'បានដាក់' : 'Submitted' },
            { id: 'screening', label: isKhmer ? 'ត្រួតពិនិត្យ' : 'Screening' },
            { id: 'shortlisted', label: isKhmer ? 'ជាប់សម្រាំង' : 'Shortlisted' },
            { id: 'interview_scheduled', label: isKhmer ? 'សម្ភាសន៍' : 'Interview' },
            { id: 'offered', label: isKhmer ? 'ផ្តល់ការងារ' : 'Offered' },
            { id: 'rejected', label: isKhmer ? 'បដិសេធ' : 'Rejected' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
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
                      <div className="flex items-center space-x-2">
                        <h3 className="text-xs sm:text-sm font-bold text-slate-900">{app.applicant_name}</h3>
                        {getDynamicStatusBadge(app.status)}
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
                    {/* Status Dropdown */}
                    <div className="w-36">
                      <Select
                        value={app.status}
                        onChange={(e) => handleStatusChange(app.id, e.target.value)}
                        options={candidateStatusOptions}
                      />
                    </div>

                    {/* Schedule Interview Button (Blue) */}
                    <button
                      type="button"
                      onClick={() => openInterviewModal(app.id)}
                      className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 border border-gray-200 text-blue-700 text-xs font-semibold transition flex items-center space-x-1 cursor-pointer shadow-2xs"
                    >
                      <Calendar className="w-3.5 h-3.5 text-blue-600" />
                      <span>{isKhmer ? 'សម្ភាសន៍' : 'Interview'}</span>
                    </button>

                    {/* View Details Toggle Button */}
                    <button
                      type="button"
                      onClick={() => toggleExpand(app.id)}
                      className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-gray-200 text-slate-700 text-xs font-semibold transition flex items-center space-x-1 cursor-pointer shadow-2xs"
                    >
                      <FileText className="w-3.5 h-3.5 text-slate-500" />
                      <span>{isExpanded ? (isKhmer ? 'បិទ' : 'Hide') : (isKhmer ? 'ព័ត៌មាន CV' : 'View CV')}</span>
                      {isExpanded ? <ChevronUp className="w-3 h-3 ml-0.5" /> : <ChevronDown className="w-3 h-3 ml-0.5" />}
                    </button>

                    {/* Delete Applicant Button (Red) */}
                    <button
                      type="button"
                      onClick={() => setDeleteCandidateId(app.id)}
                      className="p-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-gray-200 rounded-xl transition cursor-pointer shadow-2xs"
                      title={isKhmer ? 'លុបបេក្ខជន' : 'Remove candidate'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
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

                      {/* Right actions: 1-Click Calendar Sync & Edit */}
                      <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto">
                        {app.interview.google_calendar_url && (
                          <a
                            href={app.interview.google_calendar_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white hover:bg-slate-50 border border-gray-200 text-slate-700 text-[11px] font-semibold transition shadow-2xs"
                            title={isKhmer ? 'Sync ជាមួយ Google Calendar' : 'Sync with Google Calendar'}
                          >
                            <span>📅 Google Cal</span>
                          </a>
                        )}
                        {app.interview.outlook_calendar_url && (
                          <a
                            href={app.interview.outlook_calendar_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white hover:bg-slate-50 border border-gray-200 text-slate-700 text-[11px] font-semibold transition shadow-2xs"
                            title={isKhmer ? 'Sync ជាមួយ Outlook Calendar' : 'Sync with Outlook Calendar'}
                          >
                            <span>📅 Outlook</span>
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => openInterviewModal(app.id)}
                          className="px-2.5 py-1 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-semibold transition shadow-2xs cursor-pointer"
                        >
                          {isKhmer ? 'កែប្រែកាលបរិច្ឆេទ' : 'Reschedule'}
                        </button>
                      </div>
                    </div>

                    {/* Location or meeting link */}
                    {app.interview.location_or_link && (
                      <div className="pt-2 border-t border-blue-100 flex flex-wrap items-center gap-2 text-xs">
                        <span className="font-semibold text-slate-600">
                          {app.interview.location_or_link.startsWith('http')
                            ? (isKhmer ? 'តំណភ្ជាប់ប្រជុំ (Meeting Link):' : 'Meeting Link:')
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
                                {exp.start_date} – {exp.is_current ? 'Present' : exp.end_date || 'Past'}
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
                    {new Date(app.created_at).toLocaleDateString('en-US', {
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 max-w-lg w-full shadow-2xl space-y-4 font-sans">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                    {isKhmer ? 'កំណត់កាលវិភាគសម្ភាសន៍' : 'Schedule Candidate Interview'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {isKhmer ? 'កំណត់កាលបរិច្ឆេទ ទីតាំង និង Sync ជាមួយប្រតិទិន' : 'Set date, location and sync with Google/Outlook calendars'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsInterviewModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Candidate Recipient Banner */}
            {selectedAppId && (() => {
              const app = applications.find((a) => a.id === selectedAppId)
              if (!app) return null
              return (
                <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-[11px] shrink-0">
                      {app.applicant_name?.charAt(0) || 'C'}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 truncate">{app.applicant_name}</div>
                      <div className="text-[11px] text-slate-500 truncate">{app.applicant_email}</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-blue-700 bg-white px-2 py-0.5 rounded-md border border-blue-200 shrink-0">
                    {app.applicant_province || 'Cambodia'}
                  </span>
                </div>
              )
            })()}

            <form onSubmit={handleScheduleInterview} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isKhmer ? 'កាលបរិច្ឆេទ & ម៉ោងសម្ភាសន៍' : 'Interview Date & Time'} *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="w-full text-xs p-2.5 bg-white border border-gray-200 rounded-xl text-slate-800 font-medium outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isKhmer ? 'ទម្រង់សម្ភាសន៍' : 'Interview Type'}
                </label>
                <Select
                  value={interviewType}
                  onChange={(e) => setInterviewType(e.target.value)}
                  options={interviewTypeOptions}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">
                    {isKhmer ? 'តំណភ្ជាប់ប្រជុំ (Link) ឬទីតាំងការិយាល័យ' : 'Meeting Link or Office Location'}
                  </label>
                  <button
                    type="button"
                    onClick={() => setLocationOrLink('https://meet.google.com/new')}
                    className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Video className="w-3 h-3" />
                    <span>+ Google Meet</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={locationOrLink}
                  onChange={(e) => setLocationOrLink(e.target.value)}
                  placeholder="e.g. https://meet.google.com/abc-defg-hij or Monivong Blvd, Phnom Penh"
                  className="w-full text-xs p-2.5 bg-white border border-gray-200 rounded-xl text-slate-800 font-medium outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isKhmer ? 'កំណត់សម្គាល់សម្រាប់បេក្ខជន (ស្រេចចិត្ត)' : 'Notes for Candidate (Optional)'}
                </label>
                <textarea
                  rows={2}
                  value={interviewNotes}
                  onChange={(e) => setInterviewNotes(e.target.value)}
                  placeholder={isKhmer ? 'ឧ. សូមត្រៀម Portfolio ឬ Resume មកជាមួយ...' : 'e.g. Please have your portfolio ready...'}
                  className="w-full text-xs p-2.5 bg-white border border-gray-200 rounded-xl text-slate-800 font-medium outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition shadow-2xs"
                />
              </div>

              {/* Automated Email Invitation Option with Calendar Sync */}
              <div className="p-3 bg-slate-50/80 rounded-xl border border-gray-200 flex items-start space-x-2.5">
                <input
                  type="checkbox"
                  id="sendEmail"
                  checked={sendEmail}
                  onChange={(e) => setSendEmail(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 mt-0.5 focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="sendEmail" className="text-xs text-slate-700 cursor-pointer">
                  <span className="font-bold text-slate-900 block">
                    {isKhmer ? 'ផ្ញើអ៊ីមែលអញ្ជើញស្វ័យប្រវត្តិ (Automated Email Template)' : 'Send Automated Email Invitation'}
                  </span>
                  <span className="text-slate-500 text-[11px] block mt-0.5">
                    {isKhmer
                      ? 'បេក្ខជននឹងទទួលបាន Email ផ្លូវការដែលមានប៊ូតុង 1-Click Sync ទៅកាន់ Google Calendar & Outlook'
                      : 'Candidate will receive an email with direct 1-click Google Calendar & Outlook Sync buttons.'}
                  </span>
                </label>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsInterviewModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-gray-200 transition shadow-2xs cursor-pointer"
                >
                  {isKhmer ? 'បោះបង់' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isScheduling}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition shadow-2xs cursor-pointer disabled:opacity-50 flex items-center space-x-1.5"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>
                    {isScheduling
                      ? isKhmer
                        ? 'កំពុងកំណត់...'
                        : 'Scheduling...'
                      : isKhmer
                      ? 'បញ្ជាក់កាលវិភាគ & ផ្ញើ Email'
                      : 'Confirm & Send Invitation'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Candidate Confirmation Modal */}
      {deleteCandidateId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 max-w-sm w-full shadow-2xl space-y-4 font-sans text-center">
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
