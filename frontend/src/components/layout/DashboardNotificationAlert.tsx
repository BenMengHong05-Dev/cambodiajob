import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../../services/api'
import {
  NotificationDetailDialog,
  NotificationItem,
} from './NotificationDetailDialog'
import {
  Bell,
  Calendar,
  Sparkles,
  ArrowRight,
  X,
  CheckCircle2,
  AlertCircle,
  Briefcase,
} from 'lucide-react'

interface DashboardNotificationAlertProps {
  role?: 'job_seeker' | 'employer' | 'admin'
  interviewsCount?: number
}

export const DashboardNotificationAlert: React.FC<DashboardNotificationAlertProps> = ({
  role = 'job_seeker',
  interviewsCount = 0,
}) => {
  const { i18n } = useTranslation()
  const isKhmer = i18n.language === 'km'
  const navigate = useNavigate()

  const [latestNotification, setLatestNotification] = useState<NotificationItem | null>(null)
  const [unreadCount, setUnreadCount] = useState<number>(0)
  const [isDismissed, setIsDismissed] = useState<boolean>(false)
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false)

  useEffect(() => {
    const fetchLatest = async () => {
      try {
        const res = await api.get('/notifications/')
        const data = res.data?.data || {}
        const list = data.notifications || []
        const unread = list.filter((n: any) => !n.is_read)
        setUnreadCount(data.unread_count || unread.length)

        if (unread.length > 0) {
          setLatestNotification(unread[0])
        } else if (list.length > 0) {
          // If none unread, don't show or show only if critical
          setLatestNotification(null)
        }
      } catch (err) {
        // Ignore
      }
    }
    fetchLatest()
  }, [])

  if (isDismissed || (!latestNotification && interviewsCount === 0)) {
    return null
  }

  // Interview alert takes priority if upcoming interviews exist
  const isInterviewAlert = interviewsCount > 0 || latestNotification?.notification_type === 'interview_scheduled'

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border p-4 sm:p-4.5 transition-all shadow-sm backdrop-blur-xl ${
        isInterviewAlert
          ? 'bg-emerald-500/10 border-emerald-400/30 text-emerald-950'
          : 'bg-blue-500/10 border-blue-400/30 text-blue-950'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 relative z-10">
        <div className="flex items-start sm:items-center space-x-3 min-w-0 flex-1">
          {/* Pulsing Icon Badge */}
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-md ${
              isInterviewAlert
                ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-emerald-500/20'
                : 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-blue-500/20'
            }`}
          >
            {isInterviewAlert ? (
              <Calendar className="w-5 h-5 animate-pulse" />
            ) : (
              <Bell className="w-5 h-5 animate-bounce" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center space-x-2">
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase backdrop-blur-md ${
                  isInterviewAlert
                    ? 'bg-emerald-500/15 text-emerald-800 border border-emerald-400/30'
                    : 'bg-blue-500/15 text-blue-800 border border-blue-400/30'
                }`}
              >
                {isInterviewAlert
                  ? (isKhmer ? 'ការសម្ភាសន៍បន្ទាន់' : 'INTERVIEW ALERT')
                  : (isKhmer ? 'ការជូនដំណឹងថ្មី' : 'NEW ALERT')}
              </span>
              {unreadCount > 1 && (
                <span className="text-[11px] font-semibold text-slate-500">
                  +{unreadCount - 1} {isKhmer ? 'ការជូនដំណឹងផ្សេងទៀត' : 'more alerts'}
                </span>
              )}
            </div>

            <h3 className="text-xs sm:text-sm font-bold text-slate-900 mt-1 truncate">
              {isInterviewAlert && interviewsCount > 0
                ? isKhmer
                  ? `អ្នកមានការសម្ភាសន៍ចំនួន ${interviewsCount} ត្រូវបានកំណត់ពេល!`
                  : `You have ${interviewsCount} upcoming interview(s) scheduled!`
                : (isKhmer && latestNotification?.title_km
                    ? latestNotification.title_km
                    : latestNotification?.title)}
            </h3>

            <p className="text-xs text-slate-600 mt-0.5 line-clamp-1">
              {latestNotification?.message ||
                (isKhmer
                  ? 'សូមពិនិត្យព័ត៌មានលម្អិតអំពីកាលវិភាគ និងតំណភ្ជាប់សម្ភាសន៍។'
                  : 'Check your applications and interview schedules for the latest updates.')}
            </p>
          </div>
        </div>

        {/* Action Button & Dismiss */}
        <div className="flex items-center space-x-2 shrink-0 self-end sm:self-auto">
          {latestNotification ? (
            <button
              type="button"
              onClick={async () => {
                if (!latestNotification.is_read) {
                  try {
                    await api.patch(`/notifications/${latestNotification.id}/read/`)
                    setUnreadCount((prev) => Math.max(0, prev - 1))
                  } catch (err) {
                    // Ignore
                  }
                }
                setIsDialogOpen(true)
              }}
              className={`inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white shadow-xs transition cursor-pointer active:scale-95 ${
                isInterviewAlert
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                  : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20'
              }`}
            >
              <span>{isKhmer ? 'មើលព័ត៌មានលម្អិត' : 'View Details'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <Link
              to={
                isInterviewAlert
                  ? '/seeker/applications'
                  : role === 'employer'
                  ? '/employer/applications'
                  : '/seeker/notifications'
              }
              className={`inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white shadow-xs transition ${
                isInterviewAlert
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                  : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20'
              }`}
            >
              <span>{isKhmer ? 'មើលព័ត៌មានលម្អិត' : 'View Details'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}

          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-black/5 transition cursor-pointer"
            title={isKhmer ? 'បិទ' : 'Dismiss'}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Notification Detail Dialog Modal */}
      <NotificationDetailDialog
        notification={latestNotification}
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        role={role}
      />
    </div>
  )
}

