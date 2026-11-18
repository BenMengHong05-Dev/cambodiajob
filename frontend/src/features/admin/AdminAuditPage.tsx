import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { adminService } from '../../services/admin.service'
import { TablePagination } from '../../components/common/TablePagination'
import {
  FileSearch,
  Search,
  X,
  Eye,
  Clock,
} from 'lucide-react'

export const AdminAuditPage: React.FC = () => {
  const { i18n } = useTranslation()
  const isKhmer = i18n.language === 'km'

  const [auditLogs, setAuditLogs] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [entityFilter, setEntityFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [isLoading, setIsLoading] = useState(true)

  // Selected Log for Inspector Modal
  const [selectedLog, setSelectedLog] = useState<any | null>(null)

  const loadLogs = async () => {
    setIsLoading(true)
    try {
      const data = await adminService.getAuditLogs()
      setAuditLogs(data || [])
    } catch (err) {
      console.error('Failed to load audit logs:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadLogs()
  }, [])

  const filteredLogs = auditLogs.filter((log) => {
    const matchesEntity = entityFilter === 'all' || log.entity_type?.toLowerCase() === entityFilter.toLowerCase()
    const q = search.toLowerCase().trim()
    const matchesSearch =
      !q ||
      log.action?.toLowerCase().includes(q) ||
      log.entity_type?.toLowerCase().includes(q) ||
      log.user_name?.toLowerCase().includes(q) ||
      log.user_email?.toLowerCase().includes(q) ||
      log.details?.toLowerCase().includes(q)

    return matchesEntity && matchesSearch
  })

  const companyCount = auditLogs.filter((l) => l.entity_type === 'company').length
  const jobCount = auditLogs.filter((l) => l.entity_type === 'job').length
  const userCount = auditLogs.filter((l) => l.entity_type === 'user').length

  const getActionBadgeColor = (action: string) => {
    const act = action?.toLowerCase() || ''
    if (act.includes('delete') || act.includes('reject')) {
      return 'bg-rose-50 text-rose-700 border-rose-200'
    }
    if (act.includes('verify') || act.includes('approve') || act.includes('create')) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    }
    if (act.includes('update') || act.includes('edit')) {
      return 'bg-blue-50 text-blue-700 border-blue-200'
    }
    return 'bg-slate-100 text-slate-700 border-slate-200'
  }

  if (isLoading) {
    return (
      <div className="py-24 text-center font-sans">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="mt-3 text-xs font-normal text-slate-400">
          {isKhmer ? 'កំពុងដំណើរការទាញយកកំណត់ហេតុ...' : 'Loading audit logs...'}
        </p>
      </div>
    )
  }

  return (
    <div className="w-full space-y-3.5 font-sans pb-12">
      {/* 1. Header Bar: Title on left, Search on right (Compact, unified) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-base sm:text-lg font-bold text-slate-900">
              {isKhmer ? 'កំណត់ត្រាប្រព័ន្ធ និងសវនកម្ម' : 'System Audit Trail & Operations'}
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-normal bg-blue-50 text-blue-700 border border-blue-200">
              <FileSearch className="w-3 h-3 text-blue-600" />
              <span>{auditLogs.length} {isKhmer ? 'ព្រឹត្តិការណ៍' : 'Events'}</span>
            </span>
          </div>
          <p className="text-[11px] font-normal text-slate-500 mt-0.5">
            {isKhmer
              ? 'តាមដានរាល់សកម្មភាពរដ្ឋបាល ការកែប្រែស្ថានភាព និងការផ្លាស់ប្តូរទិន្នន័យក្នុងប្រព័ន្ធ'
              : 'Immutable record of administrative operations, moderation decisions, and system events'}
          </p>
        </div>

        {/* Search Input on Top / Header */}
        <div className="relative w-full sm:w-72 md:w-80 shrink-0">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              isKhmer
                ? 'ស្វែងរកសកម្មភាព, ធាតុ ឬអ្នកដំណើរការ...'
                : 'Search action, entity, or actor...'
            }
            className="w-full pl-8 pr-8 py-1.5 text-xs bg-slate-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-blue-500 font-normal transition text-slate-800"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Filter Toolbar (Entity Pills on right) */}
      <div className="flex items-center justify-between gap-2 bg-white px-4 py-2.5 rounded-2xl border border-gray-200 shadow-2xs overflow-x-auto">
        <span className="text-[11px] font-normal text-slate-400 shrink-0 hidden sm:inline">
          {isKhmer ? 'ច្រោះតាមធាតុប្រព័ន្ធ៖' : 'Filter by Entity:'}
        </span>

        <div className="flex items-center space-x-1.5 ml-auto">
          <button
            type="button"
            onClick={() => setEntityFilter('all')}
            className={`px-3 py-1 rounded-xl text-xs font-normal transition cursor-pointer shrink-0 ${entityFilter === 'all'
              ? 'bg-blue-600 text-white shadow-2xs'
              : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-gray-200'
              }`}
          >
            {isKhmer ? 'ទាំងអស់' : 'All'} ({auditLogs.length})
          </button>
          <button
            type="button"
            onClick={() => setEntityFilter('company')}
            className={`px-3 py-1 rounded-xl text-xs font-normal transition cursor-pointer shrink-0 ${entityFilter === 'company'
              ? 'bg-blue-600 text-white shadow-2xs'
              : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-gray-200'
              }`}
          >
            {isKhmer ? 'ក្រុមហ៊ុន' : 'Company'} ({companyCount})
          </button>
          <button
            type="button"
            onClick={() => setEntityFilter('job')}
            className={`px-3 py-1 rounded-xl text-xs font-normal transition cursor-pointer shrink-0 ${entityFilter === 'job'
              ? 'bg-blue-600 text-white shadow-2xs'
              : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-gray-200'
              }`}
          >
            {isKhmer ? 'ការងារ' : 'Job'} ({jobCount})
          </button>
          <button
            type="button"
            onClick={() => setEntityFilter('user')}
            className={`px-3 py-1 rounded-xl text-xs font-normal transition cursor-pointer shrink-0 ${entityFilter === 'user'
              ? 'bg-blue-600 text-white shadow-2xs'
              : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-gray-200'
              }`}
          >
            {isKhmer ? 'អ្នកប្រើប្រាស់' : 'User'} ({userCount})
          </button>
        </div>
      </div>

      {/* 3. Modern SaaS Data Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-gray-200 text-slate-500 uppercase tracking-wider font-normal text-[10px]">
                <th className="py-2.5 px-4">{isKhmer ? 'សកម្មភាព' : 'Action'}</th>
                <th className="py-2.5 px-3">{isKhmer ? 'ធាតុប្រព័ន្ធ' : 'Target Entity'}</th>
                <th className="py-2.5 px-3">{isKhmer ? 'ដំណើរការដោយ' : 'Triggered By'}</th>
                <th className="py-2.5 px-3">{isKhmer ? 'ព័ត៌មានលម្អិត' : 'Details Payload'}</th>
                <th className="py-2.5 px-3">{isKhmer ? 'កាលបរិច្ឆេទ' : 'Timestamp'}</th>
                <th className="py-2.5 px-4 text-right">{isKhmer ? 'សកម្មភាព' : 'Inspect'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-sans">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <FileSearch className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="text-xs font-normal text-slate-700">
                      {isKhmer ? 'មិនមានកំណត់ត្រាទេ' : 'No audit records found'}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {isKhmer ? 'សូមសាកល្បងស្វែងរកដោយពាក្យគន្លឹះផ្សេង' : 'Try adjusting your search or filters.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredLogs
                  .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                  .map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/70 transition-colors group">
                      {/* Action */}
                      <td className="py-2.5 px-4 align-middle whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-normal border uppercase tracking-wide ${getActionBadgeColor(log.action)}`}>
                          {log.action?.replace(/_/g, ' ')}
                        </span>
                      </td>

                      {/* Target Entity */}
                      <td className="py-2.5 px-3 align-middle whitespace-nowrap">
                        <span className="font-medium text-slate-800 text-xs capitalize">
                          {log.entity_type}
                        </span>
                        <span className="text-slate-400 text-xs ml-1 font-mono">
                          #{log.entity_id}
                        </span>
                      </td>

                      {/* Triggered By */}
                      <td className="py-2.5 px-3 align-middle">
                        <div className="space-y-0.5 max-w-[180px]">
                          <span className="font-normal text-slate-800 block truncate text-xs">
                            {log.user_name || 'System Administrator'}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono block truncate">
                            {log.user_email || 'admin@cambodiajobs.kh'}
                          </span>
                        </div>
                      </td>

                      {/* Details Snippet */}
                      <td className="py-2.5 px-3 align-middle max-w-xs">
                        <span className="text-[11px] text-slate-500 font-mono truncate block bg-slate-50 px-2 py-1 rounded-md border border-gray-100">
                          {log.details ? log.details.slice(0, 50) + (log.details.length > 50 ? '...' : '') : '-'}
                        </span>
                      </td>

                      {/* Timestamp */}
                      <td className="py-2.5 px-3 align-middle text-slate-500 font-normal whitespace-nowrap">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{new Date(log.created_at).toLocaleString()}</span>
                        </div>
                      </td>

                      {/* Inspect Payload Button (Blue Base) */}
                      <td className="py-2.5 px-4 align-middle text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setSelectedLog(log)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-normal text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition cursor-pointer shadow-2xs"
                          title={isKhmer ? 'មើលព័ត៌មានលម្អិត' : 'View Payload Details'}
                        >
                          <Eye className="w-3 h-3 text-blue-600" />
                          <span className="hidden sm:inline">{isKhmer ? 'លម្អិត' : 'Inspect'}</span>
                        </button>
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Pagination: Left Select 25 50 100, Right buttons */}
        {filteredLogs.length > 0 && (
          <TablePagination
            currentPage={currentPage}
            pageSize={pageSize}
            totalItems={filteredLogs.length}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            pageSizeOptions={[25, 50, 100]}
          />
        )}
      </div>

      {/* ================= INSPECT LOG MODAL ================= */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-white">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center">
                  <FileSearch className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-slate-800">
                    {isKhmer ? 'ព័ត៌មានលម្អិតព្រឹត្តិការណ៍សវនកម្ម' : 'Audit Event Payload'}
                  </h3>
                  <p className="text-[11px] font-normal text-slate-400 font-mono">
                    ID #{selectedLog.id} • {selectedLog.action}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-gray-100">
                <div>
                  <span className="text-[10px] font-normal uppercase text-slate-400 block">
                    {isKhmer ? 'ធាតុប្រព័ន្ធ' : 'Target Entity'}
                  </span>
                  <span className="font-medium text-slate-800 text-xs">
                    {selectedLog.entity_type} #{selectedLog.entity_id}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-normal uppercase text-slate-400 block">
                    {isKhmer ? 'កាលបរិច្ឆេទ & ម៉ោង' : 'Timestamp'}
                  </span>
                  <span className="font-normal text-slate-700 text-xs">
                    {new Date(selectedLog.created_at).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-normal uppercase text-slate-400 block">
                    {isKhmer ? 'អ្នកដំណើរការ' : 'Triggered By'}
                  </span>
                  <span className="font-medium text-slate-800 text-xs">
                    {selectedLog.user_name || 'System Operator'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-normal uppercase text-slate-400 block">
                    {isKhmer ? 'អ៊ីមែល' : 'Email'}
                  </span>
                  <span className="font-normal text-slate-600 font-mono text-[11px]">
                    {selectedLog.user_email || 'system@cambodiajobs.kh'}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-normal text-slate-600 block">
                  {isKhmer ? 'ទិន្នន័យ Payload (JSON)' : 'Structured Details Payload (JSON)'}
                </span>
                <pre className="p-3 rounded-xl bg-slate-900 text-emerald-400 font-mono text-[11px] overflow-x-auto max-h-60 leading-relaxed">
                  {(() => {
                    try {
                      return JSON.stringify(JSON.parse(selectedLog.details), null, 2)
                    } catch {
                      return selectedLog.details || 'No additional payload provided.'
                    }
                  })()}
                </pre>
              </div>

              <div className="flex justify-end pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setSelectedLog(null)}
                  className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-normal transition shadow-2xs cursor-pointer"
                >
                  {isKhmer ? 'បិទ' : 'Close'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
