import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { api } from '../../services/api'
import {
  Bell,
  CheckCheck,
  ChevronRight,
  Calendar,
  Briefcase,
  Trash2,
  LogIn,
  LogOut,
  ShieldCheck,
  UserCheck,
  Building2,
  Bookmark,
  Activity,
  Sparkles,
} from 'lucide-react'
import { TablePagination } from '../../components/common/TablePagination'
import {
  NotificationDetailDialog,
  NotificationItem,
} from '../../components/layout/NotificationDetailDialog'
import { useAuth } from '../../app/providers'
import { useToast } from '../../components/ui/Toast'

export interface NotificationsPageProps {
  role?: 'job_seeker' | 'employer' | 'admin'
}

export const NotificationsPage: React.FC<NotificationsPageProps> = ({ role: propRole }) => {
  const { i18n } = useTranslation()
  const { role: authRole } = useAuth()
  const { toast } = useToast()
  const isKhmer = i18n.language === 'km'
  const portalRole = propRole || authRole || 'job_seeker'

  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [selectedNotification, setSelectedNotification] = useState<NotificationItem | null>(null)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)

  const fetchNotifications = async () => {
    setIsLoading(true)
    try {
      const res = await api.get('/notifications/')
      setNotifications(res.data.data.notifications || [])
      setUnreadCount(res.data.data.unread_count || 0)
    } catch (err) {
      console.error('Failed to load notifications:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [])

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/read-all/')
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
      setUnreadCount(0)
      window.dispatchEvent(new Event('notifications:refresh'))
    } catch (err) {
      console.error('Failed to mark all as read:', err)
    }
  }

  const handleOpenDetail = async (item: NotificationItem) => {
    if (!item.is_read) {
      try {
        await api.patch(`/notifications/${item.id}/read/`)
        setNotifications((prev) =>
          prev.map((n) => (n.id === item.id ? { ...n, is_read: true } : n))
        )
        setUnreadCount((prev) => Math.max(0, prev - 1))
        window.dispatchEvent(new Event('notifications:refresh'))
      } catch (err) {
        console.error('Failed to mark read:', err)
      }
    }
    setSelectedNotification({ ...item, is_read: true })
    setIsDetailDialogOpen(true)
  }

  const handleDeleteNotification = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation()
    setDeletingId(id)
    try {
      await api.delete(`/notifications/${id}/`)
      const target = notifications.find((n) => n.id === id)
      setNotifications((prev) => prev.filter((n) => n.id !== id))
      if (target && !target.is_read) {
        setUnreadCount((prev) => Math.max(0, prev - 1))
      }
      window.dispatchEvent(new Event('notifications:refresh'))
      if (selectedNotification?.id === id) {
        setIsDetailDialogOpen(false)
        setSelectedNotification(null)
      }
    } catch (err) {
      console.error('Failed to delete notification:', err)
      toast.error(
        isKhmer ? 'មិនអាចលុបការជូនដំណឹងបានទេ' : 'Failed to delete notification'
      )
    } finally {
      setDeletingId(null)
    }
  }

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'unread') return !n.is_read
    if (filter === 'read') return Boolean(n.is_read)
    return true
  })
  const readCount = notifications.length - unreadCount

  const getNotificationIcon = (type: string, isRead: boolean | number) => {
    switch (type) {
      case 'interview':
      case 'interview_scheduled':
        return (
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              isRead
                ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/80'
                : 'bg-emerald-100 text-emerald-700 border border-emerald-300 shadow-2xs'
            }`}
          >
            <Calendar className="w-4.5 h-4.5" />
          </div>
        )
      case 'login':
        return (
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              isRead
                ? 'bg-teal-50 text-teal-600 border border-teal-200/80'
                : 'bg-teal-100 text-teal-700 border border-teal-300 shadow-2xs'
            }`}
          >
            <LogIn className="w-4.5 h-4.5" />
          </div>
        )
      case 'logout':
        return (
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              isRead
                ? 'bg-slate-100 text-slate-500 border border-slate-200'
                : 'bg-slate-200 text-slate-700 border border-slate-300 shadow-2xs'
            }`}
          >
            <LogOut className="w-4.5 h-4.5" />
          </div>
        )
      case 'security':
        return (
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              isRead
                ? 'bg-rose-50 text-rose-600 border border-rose-200/80'
                : 'bg-rose-100 text-rose-700 border border-rose-300 shadow-2xs'
            }`}
          >
            <ShieldCheck className="w-4.5 h-4.5" />
          </div>
        )
      case 'profile_update':
        return (
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              isRead
                ? 'bg-indigo-50 text-indigo-600 border border-indigo-200/80'
                : 'bg-indigo-100 text-indigo-700 border border-indigo-300 shadow-2xs'
            }`}
          >
            <UserCheck className="w-4.5 h-4.5" />
          </div>
        )
      case 'company_update':
        return (
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              isRead
                ? 'bg-cyan-50 text-cyan-600 border border-cyan-200/80'
                : 'bg-cyan-100 text-cyan-700 border border-cyan-300 shadow-2xs'
            }`}
          >
            <Building2 className="w-4.5 h-4.5" />
          </div>
        )
      case 'job_saved':
        return (
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              isRead
                ? 'bg-amber-50 text-amber-600 border border-amber-200/80'
                : 'bg-amber-100 text-amber-700 border border-amber-300 shadow-2xs'
            }`}
          >
            <Bookmark className="w-4.5 h-4.5" />
          </div>
        )
      case 'user_activity':
        return (
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              isRead
                ? 'bg-violet-50 text-violet-600 border border-violet-200/80'
                : 'bg-violet-100 text-violet-700 border border-violet-300 shadow-2xs'
            }`}
          >
            <Activity className="w-4.5 h-4.5" />
          </div>
        )
      case 'welcome':
        return (
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              isRead
                ? 'bg-purple-50 text-purple-600 border border-purple-200/80'
                : 'bg-purple-100 text-purple-700 border border-purple-300 shadow-2xs'
            }`}
          >
            <Sparkles className="w-4.5 h-4.5" />
          </div>
        )
      case 'application_status':
      case 'application':
      case 'new_job':
      case 'job_published':
      case 'job_updated':
      case 'job':
        return (
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              isRead
                ? 'bg-blue-50 text-blue-600 border border-blue-200/80'
                : 'bg-blue-100 text-blue-700 border border-blue-300 shadow-2xs'
            }`}
          >
            <Briefcase className="w-4.5 h-4.5" />
          </div>
        )
      default:
        return (
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              isRead
                ? 'bg-slate-100 text-slate-500 border border-slate-200'
                : 'bg-purple-100 text-purple-700 border border-purple-300 shadow-2xs'
            }`}
          >
            <Bell className="w-4.5 h-4.5" />
          </div>
        )
    }
  }

  if (isLoading) {
    return (
      <div className="py-20 text-center font-sans">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="mt-3 text-xs font-medium text-slate-500">
          {isKhmer ? 'កំពុងដំណើរការ...' : 'Loading notifications...'}
        </p>
      </div>
    )
  }

  return (
    <div className="w-full space-y-4 sm:space-y-5 font-sans pb-16">
      {/* SaaS Header Bar - Full Width & Compact Title */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-2xs flex flex-col gap-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              {isKhmer ? 'ការជូនដំណឹង' : 'Notifications'}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {portalRole === 'admin'
                ? isKhmer
                  ? 'តាមដានសកម្មភាពប្រព័ន្ធ ការស្នើសុំផ្ទៀងផ្ទាត់ក្រុមហ៊ុន និងសវនកម្មសុវត្ថិភាព'
                  : 'Monitor system alerts, company verifications, and platform security events'
                : portalRole === 'employer'
                ? isKhmer
                  ? 'តាមដានពាក្យសុំការងារថ្មីៗ ការអញ្ជើញសម្ភាសន៍ និងស្ថានភាពក្រុមហ៊ុន'
                  : 'Track new candidate applications, interview updates, and team activity'
                : isKhmer
                ? 'តាមដានព័ត៌មានបច្ចុប្បន្នភាពនៃពាក្យសុំ និងការអញ្ជើញសម្ភាសន៍ពីនិយោជក'
                : 'Stay updated with your applications and employer interview invitations'}
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="px-3.5 py-1.5 rounded-xl border border-gray-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition flex items-center self-start sm:self-auto shadow-2xs cursor-pointer hover:text-blue-600"
            >
              <CheckCheck className="w-4 h-4 mr-1.5 text-blue-600" />
              <span>{isKhmer ? 'សម្គាល់ថាបានអានទាំងអស់' : 'Mark all as read'}</span>
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-slate-100">
          {(
            [
              { key: 'all', label: isKhmer ? 'ទាំងអស់' : 'All', count: notifications.length },
              { key: 'unread', label: isKhmer ? 'មិនទាន់អាន' : 'Unread', count: unreadCount },
              { key: 'read', label: isKhmer ? 'បានអានរួច' : 'Read', count: readCount },
            ] as const
          ).map((tab) => {
            const active = filter === tab.key
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setFilter(tab.key)
                  setCurrentPage(1)
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  active
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-md text-[10px] ${
                    active ? 'bg-white/20 text-white' : 'bg-white text-slate-600'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {filteredNotifications.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center space-y-3 shadow-2xs">
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto border border-gray-200">
            <Bell className="w-6 h-6" />
          </div>
          <h3 className="text-xs sm:text-sm font-bold text-slate-900">
            {filter === 'unread'
              ? isKhmer
                ? 'មិនមានការជូនដំណឹងដែលមិនទាន់អានទេ'
                : 'No unread notifications'
              : filter === 'read'
              ? isKhmer
                ? 'មិនមានការជូនដំណឹងដែលបានអានរួចទេ'
                : 'No read notifications'
              : isKhmer
              ? 'មិនមានការជូនដំណឹងថ្មីទេ'
              : 'No Notifications'}
          </h3>
          <p className="text-xs text-slate-500">
            {isKhmer ? 'អ្នកបានអានព័ត៌មានទាំងអស់រួចរាល់ហើយ!' : 'You are all caught up!'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100 overflow-hidden shadow-2xs">
            {filteredNotifications
              .slice((currentPage - 1) * pageSize, currentPage * pageSize)
              .map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleOpenDetail(n)}
                  className={`p-4 sm:p-4.5 flex items-start space-x-3.5 transition cursor-pointer group ${
                    n.is_read
                      ? 'bg-white hover:bg-slate-50/80'
                      : 'bg-blue-50/25 hover:bg-blue-50/45'
                  }`}
                >
                  {getNotificationIcon(n.notification_type, n.is_read)}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-blue-600 transition truncate">
                          {isKhmer && n.title_km ? n.title_km : n.title}
                        </h4>
                        {!n.is_read && (
                          <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 whitespace-nowrap shrink-0">
                        {new Date(n.created_at).toLocaleString(isKhmer ? 'km-KH' : 'en-US')}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed line-clamp-2">
                      {isKhmer && n.message_km ? n.message_km : n.message}
                    </p>
                  </div>

                  <div className="shrink-0 self-center flex items-center gap-2">
                    <span className="text-xs text-blue-600 font-semibold inline-flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span>{isKhmer ? 'លម្អិត' : 'View'}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                    <button
                      type="button"
                      disabled={deletingId === n.id}
                      onClick={(e) => handleDeleteNotification(e, n.id)}
                      title={isKhmer ? 'លុបការជូនដំណឹង' : 'Delete notification'}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer disabled:opacity-40"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
          </div>

          {/* Pagination */}
          <TablePagination
            currentPage={currentPage}
            totalItems={filteredNotifications.length}
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

      {/* Notification Detail Dialog Modal */}
      <NotificationDetailDialog
        notification={selectedNotification}
        isOpen={isDetailDialogOpen}
        onClose={() => {
          setIsDetailDialogOpen(false)
          setSelectedNotification(null)
        }}
        role={portalRole}
      />
    </div>
  )
}

export const SeekerNotificationsPage = NotificationsPage
