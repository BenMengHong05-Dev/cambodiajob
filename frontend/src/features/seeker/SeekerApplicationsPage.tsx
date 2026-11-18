import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { seekerService } from '../../services/seeker.service'
import { Application } from '../../types'
import { useToast } from '../../app/providers'
import {
  FileText,
  Calendar,
  ExternalLink,
  MapPin,
  Briefcase,
  Search,
  Trash2,
  AlertTriangle,
  Video,
} from 'lucide-react'
import { TablePagination } from '../../components/common/TablePagination'
import { getAssetUrl } from '../../utils/assets'

export const SeekerApplicationsPage: React.FC = () => {
  const { i18n } = useTranslation()
  const { toast } = useToast()
  const isKhmer = i18n.language === 'km'

  const [applications, setApplications] = useState<Application[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)

  // Withdraw / Delete modal state
  const [withdrawAppId, setWithdrawAppId] = useState<number | null>(null)
  const [isWithdrawing, setIsWithdrawing] = useState(false)

  const fetchApplications = async () => {
    setIsLoading(true)
    try {
      const data = await seekerService.getApplications()
      setApplications(data || [])
    } catch (err) {
      console.error('Failed to load applications:', err)
      toast.error(
        isKhmer ? 'បរាជ័យ' : 'Error',
        isKhmer ? 'មិនអាចទាញយកពាក្យសុំបានទេ' : 'Failed to load applications.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchApplications()
  }, [])

  const handleWithdraw = async () => {
    if (!withdrawAppId) return
    setIsWithdrawing(true)
    try {
      await seekerService.withdrawApplication(withdrawAppId)
      setApplications((prev) => prev.filter((a) => a.id !== withdrawAppId))
      setWithdrawAppId(null)
      toast.success(
        isKhmer ? 'បានដកពាក្យសុំ' : 'Application Withdrawn',
        isKhmer ? 'ពាក្យសុំការងាររបស់អ្នកត្រូវបានដកចេញដោយជោគជ័យ' : 'Your job application has been withdrawn.'
      )
    } catch (err) {
      toast.error(
        isKhmer ? 'បរាជ័យ' : 'Error',
        isKhmer ? 'មិនអាចដកពាក្យសុំបានទេ' : 'Failed to withdraw application.'
      )
    } finally {
      setIsWithdrawing(false)
    }
  }

  const getDynamicStatusBadge = (status: string) => {
    switch (status) {
      case 'submitted':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-gray-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            <span>{isKhmer ? 'បានដាក់ពាក្យ' : 'Submitted'}</span>
          </span>
        )
      case 'screening':
      case 'reviewing':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-gray-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span>{isKhmer ? 'កំពុងត្រួតពិនិត្យ' : 'Under Review'}</span>
          </span>
        )
      case 'shortlisted':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-700 border border-gray-200">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
            <span>{isKhmer ? 'ជាប់បញ្ជីសម្រាំង' : 'Shortlisted'}</span>
          </span>
        )
      case 'interview':
      case 'interview_scheduled':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-gray-200">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            <span>{isKhmer ? 'ណាត់សម្ភាសន៍' : 'Interview Scheduled'}</span>
          </span>
        )
      case 'offered':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-gray-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            <span>{isKhmer ? 'បានទទួលការងារ' : 'Offer Extended'}</span>
          </span>
        )
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-gray-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            <span>{isKhmer ? 'មិនបានជ្រើសរើស' : 'Not Selected'}</span>
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 border border-gray-200 capitalize">
            <span>{status}</span>
          </span>
        )
    }
  }

  const renderApplicationPipeline = (status: string) => {
    if (status === 'rejected') {
      return (
        <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-200/80 flex items-center justify-between text-xs text-rose-700">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span className="font-semibold">
              {isKhmer ? 'ពាក្យសុំមិនត្រូវបានជ្រើសរើសទេ' : 'Application Not Selected'}
            </span>
            <span className="text-slate-500 text-[11px] hidden sm:inline">
              {isKhmer ? '— និយោជកបានបញ្ចប់ការជ្រើសរើសសម្រាប់តំណែងនេះ។' : '— The employer moved forward with other applicants.'}
            </span>
          </div>
          <span className="text-[10px] font-semibold text-rose-600 bg-white px-2 py-0.5 rounded-md border border-rose-200">
            {isKhmer ? 'បិទដំណើរការ' : 'Closed'}
          </span>
        </div>
      )
    }

    const steps = [
      { key: 'submitted', labelKm: 'បានដាក់ពាក្យ', labelEn: 'Submitted' },
      { key: 'screening', labelKm: 'ត្រួតពិនិត្យ', labelEn: 'Under Review' },
      { key: 'shortlisted', labelKm: 'ជាប់សម្រាំង', labelEn: 'Shortlisted' },
      { key: 'interview', labelKm: 'សម្ភាសន៍', labelEn: 'Interview' },
      { key: 'offered', labelKm: 'ផ្តល់ការងារ', labelEn: 'Offer' },
    ]

    const getStepIndex = (st: string) => {
      switch (st) {
        case 'submitted': return 0
        case 'screening':
        case 'reviewing': return 1
        case 'shortlisted': return 2
        case 'interview':
        case 'interview_scheduled': return 3
        case 'offered': return 4
        default: return 0
      }
    }

    const currentIdx = getStepIndex(status)

    return (
      <div className="p-3 sm:p-3.5 bg-slate-50/70 rounded-xl border border-gray-200/90 space-y-2">
        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
            <span>{isKhmer ? 'វឌ្ឍនភាពដំណើរការជ្រើសរើស' : 'Hiring Progress Pipeline'}</span>
          </span>
          <span className="text-blue-600 font-bold">
            {isKhmer ? `ដំណាក់កាលទី ${currentIdx + 1} នៃ 5` : `Stage ${currentIdx + 1} of 5`}
          </span>
        </div>

        {/* Stepper Bar */}
        <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
          {steps.map((s, idx) => {
            const isCompleted = idx < currentIdx
            const isCurrent = idx === currentIdx
            return (
              <div key={s.key} className="space-y-1">
                <div
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    isCompleted
                      ? 'bg-blue-600'
                      : isCurrent
                      ? 'bg-blue-600 ring-2 ring-blue-200'
                      : 'bg-slate-200'
                  }`}
                />
                <p
                  className={`text-[10px] sm:text-[11px] truncate text-center ${
                    isCurrent
                      ? 'font-bold text-blue-700'
                      : isCompleted
                      ? 'font-semibold text-slate-700'
                      : 'text-slate-400'
                  }`}
                >
                  {isKhmer ? s.labelKm : s.labelEn}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="py-20 text-center font-sans">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="mt-3 text-xs font-medium text-slate-500">
          {isKhmer ? 'កំពុងដំណើរការទាញយកពាក្យសុំ...' : 'Loading applications...'}
        </p>
      </div>
    )
  }

  return (
    <div className="w-full space-y-4 sm:space-y-5 font-sans pb-16">
      {/* Header Bar - Full Width & Compact Title */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            {isKhmer ? 'ពាក្យសុំការងាររបស់ខ្ញុំ' : 'My Job Applications'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {isKhmer
              ? 'តាមដានស្ថានភាពត្រួតពិនិត្យពាក្យសុំ និងការណាត់ជួបសម្ភាសន៍របស់អ្នក'
              : 'Track the review status and interview invitations of your job applications'}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 border border-gray-200 text-xs font-semibold flex items-center space-x-1.5 shadow-2xs">
            <Briefcase className="w-3.5 h-3.5 text-blue-600" />
            <span>{applications.length} {isKhmer ? 'ពាក្យសុំសរុប' : 'Applications'}</span>
          </div>

          <Link
            to="/jobs"
            className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition shadow-2xs flex items-center space-x-1 cursor-pointer"
          >
            <Search className="w-3.5 h-3.5" />
            <span>{isKhmer ? 'ស្វែងរកការងារ' : 'Find Jobs'}</span>
          </Link>
        </div>
      </div>

      {/* Applications List */}
      {applications.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center space-y-3 shadow-2xs">
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto border border-gray-200">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-xs sm:text-sm font-bold text-slate-900">
            {isKhmer ? 'មិនទាន់មានពាក្យសុំការងារនៅឡើយទេ' : 'No Applications Yet'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {isKhmer
              ? 'អ្នកមិនទាន់បានដាក់ពាក្យសុំការងារណាមួយនៅឡើយទេ។ ចាប់ផ្តើមស្វែងរកឱកាសការងារថ្មីៗ។'
              : "You haven't submitted any job applications yet. Start exploring active vacancies across Cambodia."}
          </p>
          <Link
            to="/jobs"
            className="inline-flex items-center space-x-1.5 mt-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition shadow-2xs"
          >
            <Search className="w-3.5 h-3.5" />
            <span>{isKhmer ? 'ស្វែងរកការងារ' : 'Find Jobs'}</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {applications
            .slice((currentPage - 1) * pageSize, currentPage * pageSize)
            .map((app: any) => (
            <div
              key={app.id}
              className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 shadow-2xs hover:border-blue-400 hover:shadow-xs transition space-y-3.5 group"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start space-x-3.5 flex-1 min-w-0">
                  <img
                    src={
                      getAssetUrl(app.company_logo) ||
                      'https://images.unsplash.com/photo-1541746972996-4e0b0f43e02a?w=80&h=80&fit=crop'
                    }
                    alt={app.company_name}
                    className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl object-contain border border-gray-200 bg-slate-50 p-1 shrink-0"
                  />
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-blue-600 transition truncate">
                        <Link to={`/jobs/${app.job_slug}`}>{app.job_title}</Link>
                      </h3>
                      {getDynamicStatusBadge(app.status)}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span className="font-semibold text-slate-700">{app.company_name}</span>
                      <span>•</span>
                      <span className="flex items-center">
                        <MapPin className="w-3.5 h-3.5 mr-0.5 text-slate-400" />
                        <span>{app.province}</span>
                      </span>
                      {app.salary_min && (
                        <>
                          <span>•</span>
                          <span className="text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded-md border border-gray-200 text-[11px] sm:text-xs">
                            ${Number(app.salary_min).toLocaleString()} - ${Number(app.salary_max).toLocaleString()}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right controls */}
                <div className="flex items-center space-x-2 shrink-0 self-start sm:self-auto">
                  <Link
                    to={`/jobs/${app.job_slug}`}
                    className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-gray-200 text-slate-700 text-xs font-semibold transition flex items-center space-x-1 shadow-2xs"
                  >
                    <span>{isKhmer ? 'មើលការងារ' : 'View Job'}</span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                  </Link>

                  {app.status === 'submitted' && (
                    <button
                      type="button"
                      onClick={() => setWithdrawAppId(app.id)}
                      className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-gray-200 text-rose-700 text-xs font-semibold transition flex items-center space-x-1 cursor-pointer shadow-2xs"
                      title={isKhmer ? 'ដកពាក្យសុំ' : 'Withdraw Application'}
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                      <span>{isKhmer ? 'ដកពាក្យ' : 'Withdraw'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Interactive Hiring Pipeline Progress Stepper */}
              {renderApplicationPipeline(app.status)}

              {/* Cover Letter excerpt */}
              {app.cover_letter && (
                <div className="p-3 bg-slate-50 rounded-xl border border-gray-100 text-xs text-slate-600">
                  <span className="font-semibold text-slate-700 block mb-0.5">
                    {isKhmer ? 'លិខិតភ្ជាប់:' : 'Cover Letter Note:'}
                  </span>
                  <p className="line-clamp-2">{app.cover_letter}</p>
                </div>
              )}

              {/* Scheduled Interviews banner & Calendar Sync */}
              {app.interviews && app.interviews.length > 0 && (
                <div className="space-y-2.5">
                  {app.interviews.map((iv: any) => (
                    <div
                      key={iv.id}
                      className="p-4 rounded-2xl bg-gradient-to-r from-blue-50/90 via-indigo-50/40 to-blue-50/80 border border-blue-200 shadow-2xs space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                            <Calendar className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 text-xs sm:text-sm">
                                {isKhmer ? 'កាលវិភាគសម្ភាសន៍ការងារ' : 'Interview Scheduled'}
                              </span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 border border-blue-200 uppercase tracking-wide">
                                {iv.interview_type === 'online'
                                  ? (isKhmer ? 'វីដេអូអនឡាញ' : 'Online Video')
                                  : iv.interview_type === 'in_person'
                                  ? (isKhmer ? 'នៅការិយាល័យ' : 'In-Person')
                                  : (isKhmer ? 'ទូរស័ព្ទ' : 'Phone')}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 font-medium mt-0.5">
                              {new Date(iv.scheduled_at).toLocaleString(isKhmer ? 'km-KH' : 'en-US', {
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

                        {/* Calendar Sync & Direct Join Buttons */}
                        <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto">
                          {iv.location_or_link && iv.location_or_link.startsWith('http') && (
                            <a
                              href={iv.location_or_link}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-2xs transition"
                            >
                              <Video className="w-3.5 h-3.5" />
                              <span>{isKhmer ? 'ចូលរួមសម្ភាសន៍' : 'Join Interview'}</span>
                            </a>
                          )}
                          {iv.google_calendar_url && (
                            <a
                              href={iv.google_calendar_url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-gray-200 text-slate-700 text-xs font-semibold transition shadow-2xs"
                              title={isKhmer ? 'Sync ជាមួយ Google Calendar' : 'Sync to Google Calendar'}
                            >
                              <span>📅 Google Cal</span>
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Location/Link row */}
                      {iv.location_or_link && (
                        <div className="pt-2 border-t border-blue-100 flex flex-wrap items-center gap-2 text-xs">
                          <span className="font-semibold text-slate-600">
                            {iv.location_or_link.startsWith('http')
                              ? (isKhmer ? 'តំណភ្ជាប់បន្ទប់សម្ភាសន៍:' : 'Meeting Link:')
                              : (isKhmer ? 'ទីតាំងការិយាល័យសម្ភាសន៍:' : 'Office Location:')}
                          </span>
                          {iv.location_or_link.startsWith('http') ? (
                            <a
                              href={iv.location_or_link}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-blue-700 font-bold hover:underline"
                            >
                              <span className="truncate max-w-sm">{iv.location_or_link}</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span className="font-medium text-slate-800">{iv.location_or_link}</span>
                          )}
                        </div>
                      )}

                      {/* Notes row */}
                      {iv.notes && (
                        <div className="bg-white/80 p-2.5 rounded-xl border border-blue-100 text-[11px] text-slate-600 italic">
                          <span className="font-semibold text-slate-700 not-italic">
                            {isKhmer ? 'ការណែនាំពីនិយោជក:' : 'Employer Note:'}
                          </span>{' '}
                          {iv.notes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Footer info: Applied Date and Attached CV */}
              <div className="pt-2.5 border-t border-gray-100 flex flex-wrap items-center justify-between text-xs text-slate-400">
                <div>
                  {isKhmer ? 'បានដាក់ពាក្យនៅ ' : 'Applied on '}{' '}
                  {new Date(app.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </div>
                {app.resume_title && (
                  <div className="flex items-center text-slate-500 font-medium">
                    <FileText className="w-3.5 h-3.5 mr-1 text-slate-400" />
                    <span>{isKhmer ? 'CV ភ្ជាប់:' : 'Attached CV:'} {app.resume_title}</span>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Pagination */}
          <TablePagination
            currentPage={currentPage}
            totalItems={applications.length}
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

      {/* Withdraw Confirmation Modal */}
      {withdrawAppId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-sm w-full shadow-2xl space-y-4 font-sans text-center">
            <div className="w-11 h-11 rounded-full bg-rose-50 text-rose-600 border border-gray-200 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                {isKhmer ? 'ដកពាក្យសុំការងារនេះ?' : 'Withdraw Job Application?'}
              </h3>
              <p className="text-xs text-slate-500">
                {isKhmer
                  ? 'តើអ្នកប្រាកដជាចង់ដកពាក្យសុំការងារនេះចេញពីប្រព័ន្ធមែនទេ?'
                  : 'Are you sure you want to withdraw this application?'}
              </p>
            </div>
            <div className="flex justify-center space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setWithdrawAppId(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-gray-200 transition cursor-pointer shadow-2xs"
              >
                {isKhmer ? 'បោះបង់' : 'Cancel'}
              </button>
              <button
                type="button"
                disabled={isWithdrawing}
                onClick={handleWithdraw}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 transition shadow-2xs cursor-pointer disabled:opacity-50"
              >
                {isWithdrawing ? (isKhmer ? 'កំពុងដក...' : 'Withdrawing...') : isKhmer ? 'ដកពាក្យ' : 'Withdraw'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
