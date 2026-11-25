import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Dialog } from '../ui/Dialog'
import {
  Calendar,
  Clock,
  MapPin,
  Video,
  Phone,
  ExternalLink,
  Briefcase,
  FileText,
  CheckCircle2,
  Sparkles,
  Copy,
  Check,
  ArrowRight,
  LogIn,
  LogOut,
  ShieldCheck,
  UserCheck,
  Building2,
  Bookmark,
  Activity,
} from 'lucide-react'

export interface NotificationItem {
  id: number
  user_id?: number
  title: string
  title_km?: string
  message: string
  message_km?: string
  notification_type: string
  data?: any
  is_read: boolean | number
  created_at: string
}

export interface NotificationDetailDialogProps {
  notification: NotificationItem | null
  isOpen: boolean
  onClose: () => void
  onMarkAsRead?: (id: number) => void
  role?: 'job_seeker' | 'employer' | 'admin'
}

export const NotificationDetailDialog: React.FC<NotificationDetailDialogProps> = ({
  notification,
  isOpen,
  onClose,
  role = 'job_seeker',
}) => {
  const { i18n } = useTranslation()
  const isKhmer = i18n.language === 'km'
  const navigate = useNavigate()
  const [copiedLink, setCopiedLink] = useState(false)

  if (!notification) return null

  // Safely parse JSON data payload
  const parsedData = (() => {
    if (!notification.data) return {}
    if (typeof notification.data === 'object') return notification.data
    try {
      return JSON.parse(notification.data)
    } catch {
      return {}
    }
  })()

  // Format date and time
  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return ''
    try {
      const d = new Date(dateStr)
      if (isNaN(d.getTime())) return dateStr
      return d.toLocaleString(isKhmer ? 'km-KH' : 'en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return dateStr
    }
  }

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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  // Type styling
  const getTypeConfig = (type: string) => {
    switch (type) {
      case 'interview':
      case 'interview_scheduled':
        return {
          label: isKhmer ? 'ការសម្ភាសន៍ការងារ' : 'Job Interview',
          badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
          iconWrapper: 'bg-emerald-100/90 text-emerald-600 border-emerald-200',
          icon: Calendar,
        }
      case 'application_status':
      case 'application':
        return {
          label: isKhmer ? 'ស្ថានភាពពាក្យសុំ' : 'Application Status',
          badgeClass: 'bg-blue-50 text-blue-700 border-blue-200/80',
          iconWrapper: 'bg-blue-100/90 text-blue-600 border-blue-200',
          icon: Briefcase,
        }
      case 'login':
        return {
          label: isKhmer ? 'ការចូលគណនី' : 'Account Sign-In',
          badgeClass: 'bg-teal-50 text-teal-700 border-teal-200/80',
          iconWrapper: 'bg-teal-100/90 text-teal-600 border-teal-200',
          icon: LogIn,
        }
      case 'logout':
        return {
          label: isKhmer ? 'ការចាកចេញពីគណនី' : 'Account Sign-Out',
          badgeClass: 'bg-slate-100 text-slate-700 border-slate-200/80',
          iconWrapper: 'bg-slate-100 text-slate-600 border-slate-200',
          icon: LogOut,
        }
      case 'security':
        return {
          label: isKhmer ? 'សុវត្ថិភាពគណនី' : 'Security Alert',
          badgeClass: 'bg-rose-50 text-rose-700 border-rose-200/80',
          iconWrapper: 'bg-rose-100/90 text-rose-600 border-rose-200',
          icon: ShieldCheck,
        }
      case 'profile_update':
        return {
          label: isKhmer ? 'បច្ចុប្បន្នភាពប្រវត្តិរូប' : 'Profile Update',
          badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
          iconWrapper: 'bg-indigo-100/90 text-indigo-600 border-indigo-200',
          icon: UserCheck,
        }
      case 'company_update':
        return {
          label: isKhmer ? 'សកម្មភាពក្រុមហ៊ុន' : 'Company Update',
          badgeClass: 'bg-cyan-50 text-cyan-700 border-cyan-200/80',
          iconWrapper: 'bg-cyan-100/90 text-cyan-600 border-cyan-200',
          icon: Building2,
        }
      case 'job_saved':
        return {
          label: isKhmer ? 'ការងារបានរក្សាទុក' : 'Saved Job',
          badgeClass: 'bg-amber-50 text-amber-700 border-amber-200/80',
          iconWrapper: 'bg-amber-100/90 text-amber-600 border-amber-200',
          icon: Bookmark,
        }
      case 'user_activity':
        return {
          label: isKhmer ? 'សកម្មភាពអ្នកប្រើប្រាស់' : 'User Activity',
          badgeClass: 'bg-violet-50 text-violet-700 border-violet-200/80',
          iconWrapper: 'bg-violet-100/90 text-violet-600 border-violet-200',
          icon: Activity,
        }
      case 'new_job':
      case 'job_published':
      case 'job_updated':
      case 'job':
        return {
          label: isKhmer ? 'ការងារថ្មី' : 'Job Vacancy',
          badgeClass: 'bg-sky-50 text-sky-700 border-sky-200/80',
          iconWrapper: 'bg-sky-100/90 text-sky-600 border-sky-200',
          icon: Briefcase,
        }
      default:
        return {
          label: isKhmer ? 'ការជូនដំណឹងប្រព័ន្ធ' : 'System Notice',
          badgeClass: 'bg-purple-50 text-purple-700 border-purple-200/80',
          iconWrapper: 'bg-purple-100/90 text-purple-600 border-purple-200',
          icon: Sparkles,
        }
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'submitted':
        return {
          label: isKhmer ? 'បានដាក់ពាក្យ' : 'Submitted',
          className: 'bg-blue-50 text-blue-700 border-blue-200',
        }
      case 'shortlisted':
        return {
          label: isKhmer ? 'ជាប់សម្រាំង' : 'Shortlisted',
          className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        }
      case 'screening':
      case 'reviewing':
        return {
          label: isKhmer ? 'កំពុងត្រួតពិនិត្យ' : 'Reviewing',
          className: 'bg-amber-50 text-amber-700 border-amber-200',
        }
      case 'interview_scheduled':
        return {
          label: isKhmer ? 'បានកំណត់កាលបរិច្ឆេទសម្ភាសន៍' : 'Interview Scheduled',
          className: 'bg-purple-50 text-purple-700 border-purple-200',
        }
      case 'offered':
        return {
          label: isKhmer ? 'បានទទួលការងារ' : 'Job Offered',
          className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        }
      case 'rejected':
        return {
          label: isKhmer ? 'បដិសេធ' : 'Rejected',
          className: 'bg-rose-50 text-rose-700 border-rose-200',
        }
      default:
        return {
          label: status,
          className: 'bg-slate-100 text-slate-700 border-slate-200',
        }
    }
  }

  const typeConfig = getTypeConfig(notification.notification_type)
  const TypeIcon = typeConfig.icon
  const isUrl = (val: string) =>
    typeof val === 'string' && (val.startsWith('http://') || val.startsWith('https://'))

  const handleActionClick = () => {
    onClose()
    if (parsedData.application_id) {
      if (role === 'employer') {
        navigate('/employer/applications')
      } else {
        navigate('/seeker/applications')
      }
    } else if (parsedData.job_id) {
      navigate(`/jobs/${parsedData.job_id}`)
    } else if (role === 'admin') {
      navigate('/admin/dashboard')
    } else if (role === 'employer') {
      navigate('/employer/dashboard')
    } else {
      navigate('/seeker/applications')
    }
  }

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      icon={<TypeIcon className="w-5 h-5" />}
      iconClassName={typeConfig.iconWrapper}
      title={
        <div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${typeConfig.badgeClass}`}
            >
              {typeConfig.label}
            </span>
            {!notification.is_read ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                <span>{isKhmer ? 'ថ្មី' : 'New'}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                <CheckCircle2 className="w-3 h-3 text-slate-500" />
                <span>{isKhmer ? 'បានអាន' : 'Read'}</span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium mt-1">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>{formatRelativeTime(notification.created_at)}</span>
            <span>•</span>
            <span>{formatDateTime(notification.created_at)}</span>
          </div>
        </div>
      }
      footer={
        <div className="flex items-center justify-between w-full gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-200/90 rounded-xl hover:bg-slate-100 transition cursor-pointer shadow-2xs"
          >
            {isKhmer ? 'បិទ' : 'Close'}
          </button>

          <div className="flex items-center gap-2">
            {parsedData.location_or_link && isUrl(parsedData.location_or_link) && (
              <a
                href={parsedData.location_or_link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition shadow-xs cursor-pointer active:scale-95"
              >
                <Video className="w-3.5 h-3.5" />
                <span>{isKhmer ? 'ចូលរួមសម្ភាសន៍' : 'Join Interview'}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}

            {(parsedData.application_id || parsedData.job_id) && (
              <button
                type="button"
                onClick={handleActionClick}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-xs cursor-pointer active:scale-95"
              >
                <span>
                  {parsedData.application_id
                    ? isKhmer
                      ? 'មើលពាក្យសុំការងារ'
                      : 'View Application'
                    : isKhmer
                    ? 'មើលការងារ'
                    : 'View Vacancy'}
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Notification Title */}
        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
            {isKhmer && notification.title_km
              ? notification.title_km
              : notification.title}
          </h3>
        </div>

        {/* Full Message Body */}
        <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
          {isKhmer && notification.message_km
            ? notification.message_km
            : notification.message}
        </div>

        {/* Rich Payload Detail: Interview Details */}
        {(parsedData.scheduled_at ||
          parsedData.interview_type ||
          parsedData.location_or_link) && (
          <div className="bg-emerald-50/50 border border-emerald-200/80 rounded-2xl p-4 space-y-3">
            <div className="flex items-center space-x-2 text-emerald-800 font-bold text-xs uppercase tracking-wider">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <span>{isKhmer ? 'ព័ត៌មានលម្អិតនៃការសម្ភាសន៍' : 'Interview Schedule Details'}</span>
            </div>

            {parsedData.scheduled_at && (
              <div className="flex items-start space-x-2.5 text-xs text-slate-700 bg-white p-3 rounded-xl border border-emerald-100">
                <Clock className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-900 block">
                    {isKhmer ? 'កាលបរិច្ឆេទ & ពេលវេលា' : 'Date & Time'}
                  </span>
                  <span className="text-slate-600 font-medium">
                    {formatDateTime(parsedData.scheduled_at)}
                  </span>
                </div>
              </div>
            )}

            {parsedData.interview_type && (
              <div className="flex items-center justify-between text-xs bg-white p-3 rounded-xl border border-emerald-100">
                <span className="font-semibold text-slate-700">
                  {isKhmer ? 'ប្រភេទសម្ភាសន៍' : 'Interview Format'}
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-bold border border-emerald-200 text-xs">
                  {parsedData.interview_type === 'video_call' && (
                    <Video className="w-3.5 h-3.5 text-emerald-600" />
                  )}
                  {parsedData.interview_type === 'in_person' && (
                    <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  )}
                  {parsedData.interview_type === 'phone' && (
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  )}
                  <span className="capitalize">
                    {parsedData.interview_type === 'video_call'
                      ? isKhmer
                        ? 'វីដេអូអនឡាញ'
                        : 'Online Video Call'
                      : parsedData.interview_type === 'in_person'
                      ? isKhmer
                        ? 'ជួបផ្ទាល់'
                        : 'In-Person Meeting'
                      : parsedData.interview_type === 'phone'
                      ? isKhmer
                        ? 'តាមទូរស័ព្ទ'
                        : 'Phone Call'
                      : parsedData.interview_type}
                  </span>
                </span>
              </div>
            )}

            {parsedData.location_or_link && (() => {
              const rawLoc = String(parsedData.location_or_link)
              const urlMatch = rawLoc.match(/https?:\/\/[^\s)]+/)
              const extractedUrl = urlMatch ? urlMatch[0] : null
              const coordMatch = rawLoc.match(/(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/)
              const lat = coordMatch ? parseFloat(coordMatch[1]) : null
              const lng = coordMatch ? parseFloat(coordMatch[2]) : null
              const isMapLocation =
                parsedData.interview_type === 'in_person' ||
                (lat !== null && lng !== null) ||
                Boolean(
                  extractedUrl &&
                    (extractedUrl.includes('maps.google.') ||
                      extractedUrl.includes('google.com/maps') ||
                      extractedUrl.includes('openstreetmap.org'))
                )
              const cleanAddress = extractedUrl
                ? rawLoc.replace(`(${extractedUrl})`, '').replace(extractedUrl, '').trim()
                : rawLoc
              const googleMapsHref =
                extractedUrl && (extractedUrl.includes('maps.google.') || extractedUrl.includes('google.com/maps'))
                  ? extractedUrl
                  : lat !== null && lng !== null
                  ? `https://maps.google.com/?q=${lat},${lng}`
                  : `https://maps.google.com/?q=${encodeURIComponent(cleanAddress || rawLoc)}`

              return (
                <div className="bg-white p-3 rounded-xl border border-emerald-100 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-xs text-slate-700 block">
                      {!isMapLocation && isUrl(rawLoc)
                        ? isKhmer
                          ? 'តំណភ្ជាប់ចូលរួម'
                          : 'Meeting Link'
                        : isKhmer
                        ? 'ទីតាំងជួបសម្ភាសន៍'
                        : 'Interview Location'}
                    </span>
                    {isMapLocation && (
                      <a
                        href={googleMapsHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-0.5 rounded-lg border border-blue-200/80 transition shrink-0"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>{isKhmer ? 'បើកក្នុង Google Maps' : 'Open in Maps'}</span>
                      </a>
                    )}
                  </div>

                  {!isMapLocation && isUrl(rawLoc) ? (
                    <div className="flex items-center gap-2">
                      <a
                        href={rawLoc}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 truncate text-xs text-blue-600 hover:text-blue-700 underline font-medium flex items-center gap-1.5"
                      >
                        <Video className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span className="truncate">{rawLoc}</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(rawLoc)}
                        className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition shrink-0 flex items-center gap-1 cursor-pointer"
                        title={isKhmer ? 'ចម្លងតំណភ្ជាប់' : 'Copy link'}
                      >
                        {copiedLink ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-700">{isKhmer ? 'បានចម្លង' : 'Copied'}</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-slate-600" />
                            <span>{isKhmer ? 'ចម្លង' : 'Copy'}</span>
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    <>
                      {cleanAddress && (
                        <div className="flex items-start gap-1.5 text-xs text-slate-700 font-medium">
                          <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{cleanAddress}</span>
                        </div>
                      )}
                      {lat !== null && lng !== null && (
                        <div className="overflow-hidden rounded-xl border border-emerald-200/80 bg-slate-100">
                          <iframe
                            title="Interview Location Map"
                            src={`https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed`}
                            className="w-full h-44 border-0"
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                          />
                        </div>
                      )}
                    </>
                  )}
                </div>
              )
            })()}
          </div>
        )}

        {/* Rich Payload Detail: Application Status Change */}
        {parsedData.status && (
          <div className="bg-blue-50/50 border border-blue-200/80 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-semibold text-slate-700">
                {isKhmer ? 'ស្ថានភាពថ្មី' : 'New Status'}
              </span>
            </div>
            {(() => {
              const badge = getStatusBadge(parsedData.status)
              return (
                <span
                  className={`text-xs font-bold px-3 py-1 rounded-full border ${badge.className}`}
                >
                  {badge.label}
                </span>
              )
            })()}
          </div>
        )}
      </div>
    </Dialog>
  )
}
