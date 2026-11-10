import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { api } from '../../services/api'
import { Bell, CheckCheck } from 'lucide-react'
import { TablePagination } from '../../components/common/TablePagination'

export const SeekerNotificationsPage: React.FC = () => {
  const { t, i18n } = useTranslation()
  const isKhmer = i18n.language === 'km'

  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)

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
    } catch (err) {
      console.error('Failed to mark all as read:', err)
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
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            {isKhmer ? 'ការជូនដំណឹង' : 'Notifications'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {isKhmer
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

      {notifications.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center space-y-3 shadow-2xs">
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto border border-gray-200">
            <Bell className="w-6 h-6" />
          </div>
          <h3 className="text-xs sm:text-sm font-bold text-slate-900">
            {isKhmer ? 'មិនមានការជូនដំណឹងថ្មីទេ' : 'No Notifications'}
          </h3>
          <p className="text-xs text-slate-500">
            {isKhmer ? 'អ្នកបានអានព័ត៌មានទាំងអស់រួចរាល់ហើយ!' : 'You are all caught up!'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100 overflow-hidden shadow-2xs">
            {notifications
              .slice((currentPage - 1) * pageSize, currentPage * pageSize)
              .map((n) => (
              <div
                key={n.id}
                className={`p-4 sm:p-4.5 flex items-start space-x-3.5 transition ${
                  n.is_read ? 'bg-white hover:bg-slate-50/70' : 'bg-blue-50/30 hover:bg-blue-50/50'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    n.is_read
                      ? 'bg-slate-100 text-slate-400 border border-gray-200'
                      : 'bg-blue-50 text-blue-600 border border-gray-200'
                  }`}
                >
                  <Bell className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900">{n.title}</h4>
                    <span className="text-[10px] text-slate-400 whitespace-nowrap">
                      {new Date(n.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{n.message}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <TablePagination
            currentPage={currentPage}
            totalItems={notifications.length}
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
