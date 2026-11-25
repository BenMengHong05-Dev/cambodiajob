import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../../services/api'
import {
  NotificationDetailDialog,
  NotificationItem,
} from './NotificationDetailDialog'
import {
  Bell,
  CheckCheck,
  Calendar,
  Briefcase,
  FileText,
  AlertCircle,
  ExternalLink,
  Sparkles,
  Eye,
  LogIn,
  LogOut,
  ShieldCheck,
  UserCheck,
  Building2,
  Bookmark,
  Activity,
} from 'lucide-react'

interface NotificationDropdownProps {
  role?: 'job_seeker' | 'employer' | 'admin'
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ role = 'job_seeker' }) => {
  const { i18n } = useTranslation()
  const isKhmer = i18n.language === 'km'
  const navigate = useNavigate()

  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState<number>(0)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [selectedNotification, setSelectedNotification] = useState<NotificationItem | null>(null)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState<boolean>(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications/')
      const data = res.data?.data || {}
      setNotifications(data.notifications || [])
      setUnreadCount(data.unread_count || 0)
    } catch (err) {
      // Quiet fail if not authenticated
    }
  }

  // Initial fetch, 15-second polling, visibility sync, and instant custom event refresh
  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 15000)
    const handleRefresh = () => fetchNotifications()
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') fetchNotifications()
    }
    window.addEventListener('notifications:refresh', handleRefresh)
    document.addEventListener('visibilitychange', handleVisibility)
    return () => {
      clearInterval(interval)
      window.removeEventListener('notifications:refresh', handleRefresh)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [])

  // Close when clicked outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  const handleOpenDetail = async (item: NotificationItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()

    // Mark as read immediately in state & on server if unread
    if (!item.is_read) {
      try {
        await api.patch(`/notifications/${item.id}/read/`)
        setNotifications((prev) =>
          prev.map((n) => (n.id === item.id ? { ...n, is_read: true } : n))
        )
        setUnreadCount((prev) => Math.max(0, prev - 1))
      } catch (err) {
        console.error('Failed to mark read:', err)
      }
    }

    setSelectedNotification({ ...item, is_read: true })
    setIsDetailDialogOpen(true)
    setIsOpen(false)
  }

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/notifications/read-all/')
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
      setUnreadCount(0)
    } catch (err) {
      console.error('Failed to mark all read:', err)
    }
  }

  const formatRelativeTime = (dateString: string) => {
    try {
      const diffMs = Date.now() - new Date(dateString).getTime()
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

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'interview':
      case 'interview_scheduled':
        return (
          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Calendar className="w-4 h-4" />
          </div>
        )
      case 'login':
        return (
          <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-600 dark:bg-teal-950/60 dark:text-teal-400 flex items-center justify-center shrink-0">
            <LogIn className="w-4 h-4" />
          </div>
        )
      case 'logout':
        return (
          <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 flex items-center justify-center shrink-0">
            <LogOut className="w-4 h-4" />
          </div>
        )
      case 'security':
        return (
          <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
        )
      case 'profile_update':
        return (
          <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <UserCheck className="w-4 h-4" />
          </div>
        )
      case 'company_update':
        return (
          <div className="w-8 h-8 rounded-xl bg-cyan-100 text-cyan-600 dark:bg-cyan-950/60 dark:text-cyan-400 flex items-center justify-center shrink-0">
            <Building2 className="w-4 h-4" />
          </div>
        )
      case 'job_saved':
        return (
          <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Bookmark className="w-4 h-4" />
          </div>
        )
      case 'user_activity':
        return (
          <div className="w-8 h-8 rounded-xl bg-violet-100 text-violet-600 dark:bg-violet-950/60 dark:text-violet-400 flex items-center justify-center shrink-0">
            <Activity className="w-4 h-4" />
          </div>
        )
      case 'application_status':
      case 'application':
      case 'new_job':
      case 'job_published':
      case 'job_updated':
      case 'job':
        return (
          <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Briefcase className="w-4 h-4" />
          </div>
        )
      default:
        return (
          <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
        )
    }
  }

  return (
    <div className={`relative inline-block text-left ${isOpen ? 'z-[9999]' : 'z-10'}`} ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen)
          if (!isOpen) fetchNotifications()
        }}
        className={`w-9 h-9 rounded-full flex items-center justify-center transition-all relative border cursor-pointer ${
          isOpen
            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-transparent shadow-md shadow-blue-500/20'
            : 'bg-white/80 hover:bg-white text-slate-700 hover:text-blue-600 border-white/80 hover:border-blue-300/80 shadow-2xs backdrop-blur-md'
        }`}
        title={isKhmer ? 'ការជូនដំណឹង' : 'Notifications'}
        aria-label="Notifications"
      >
        <Bell className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-12' : ''}`} />

        {/* Unread Alert Badge */}
        {unreadCount > 0 && (
          <>
            {/* Pulsing Alert Ping */}
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping opacity-75 pointer-events-none" />
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-rose-600 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-xs border-2 border-white pointer-events-none">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </>
        )}
      </button>

      {/* Dropdown Panel (Clean White Elevated Surface) */}
      {isOpen && (
        <div className="absolute right-0 mt-2.5 w-80 sm:w-96 rounded-2xl bg-white shadow-2xl border border-slate-200 z-[9999] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="px-4 py-3 bg-white border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-slate-900 text-sm">
                {isKhmer ? 'ការជូនដំណឹង' : 'Notifications'}
              </span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-700 border border-rose-400/25">
                  {unreadCount} {isKhmer ? 'ថ្មី' : 'new'}
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 transition flex items-center space-x-1 cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>{isKhmer ? 'សម្គាល់ថាអានរួច' : 'Mark all read'}</span>
              </button>
            )}
          </div>

          {/* List of Notifications */}
          <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-100/80">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
                  <Bell className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-slate-700">
                  {isKhmer ? 'មិនមានការជូនដំណឹងថ្មីទេ' : 'No new notifications'}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {isKhmer ? 'អ្នកបានអានព័ត៌មានទាំងអស់រួចរាល់ហើយ' : 'You are all caught up!'}
                </p>
              </div>
            ) : (
              notifications.slice(0, 8).map((item) => {
                const isUnread = !item.is_read

                return (
                  <div
                    key={item.id}
                    onClick={(e) => handleOpenDetail(item, e)}
                    className={`p-3.5 flex items-start space-x-3 transition cursor-pointer hover:bg-blue-50/50 group ${
                      isUnread ? 'bg-blue-50/30' : 'bg-transparent'
                    }`}
                  >
                    {/* Icon */}
                    {getNotificationIcon(item.notification_type)}

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition truncate">
                          {isKhmer && item.title_km ? item.title_km : item.title}
                        </h4>
                        <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                          {formatRelativeTime(item.created_at)}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 leading-relaxed">
                        {isKhmer && item.message_km ? item.message_km : item.message}
                      </p>
                    </div>

                    {/* Unread Indicator Dot */}
                    {isUnread && (
                      <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-1.5 shadow-xs" />
                    )}
                  </div>
                )
              })
            )}
          </div>

          {/* Footer View All */}
          <div className="p-2.5 bg-white/60 backdrop-blur-md border-t border-white/80 text-center">
            <Link
              to={
                role === 'admin'
                  ? '/admin/notifications'
                  : role === 'employer'
                  ? '/employer/notifications'
                  : '/seeker/notifications'
              }
              onClick={() => setIsOpen(false)}
              className="inline-flex items-center justify-center space-x-1.5 text-xs font-bold text-slate-700 hover:text-blue-600 transition py-1"
            >
              <span>{isKhmer ? 'មើលការជូនដំណឹងទាំងអស់' : 'View all notifications'}</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      )}

      {/* Notification Detail Dialog Modal */}
      <NotificationDetailDialog
        notification={selectedNotification}
        isOpen={isDetailDialogOpen}
        onClose={() => {
          setIsDetailDialogOpen(false)
          setSelectedNotification(null)
        }}
        role={role}
      />
    </div>
  )
}

