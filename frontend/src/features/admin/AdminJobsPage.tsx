import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useToast } from '../../app/providers'
import { adminService } from '../../services/admin.service'
import { formatSalaryRange } from '../../utils/currency'
import { exportJobsToExcel } from '../../utils/excelExport'
import { TablePagination } from '../../components/common/TablePagination'
import {
  Briefcase,
  Check,
  X,
  Search,
  MapPin,
  Calendar,
  ExternalLink,
  CheckCircle2,
  Clock,
  XCircle,
  Trash2,
  Users,
  AlertTriangle,
  FileSpreadsheet,
} from 'lucide-react'

export const AdminJobsPage: React.FC = () => {
  const { toast } = useToast()
  const { i18n } = useTranslation()
  const isKhmer = i18n.language === 'km'

  const [jobs, setJobs] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [isLoading, setIsLoading] = useState(true)
  const [actionInProgress, setActionInProgress] = useState<number | null>(null)

  // Delete Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deletingJob, setDeletingJob] = useState<any | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const loadJobs = async () => {
    setIsLoading(true)
    try {
      const data = await adminService.getJobs()
      setJobs(data || [])
    } catch (err) {
      console.error('Failed to load jobs for moderation:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadJobs()
  }, [])

  const handleModerateJob = async (jobId: number, status: 'approved' | 'rejected') => {
    setActionInProgress(jobId)
    try {
      await adminService.moderateJob(jobId, status)
      toast.success(
        isKhmer ? 'ការត្រួតពិនិត្យការងារ' : 'Job Moderation',
        status === 'approved'
          ? (isKhmer ? 'ការងារត្រូវបានអនុម័ត និងផ្សាយជាសាធារណៈ!' : 'Job vacancy approved and published!')
          : (isKhmer ? 'ការងារត្រូវបានបដិសេធ។' : 'Job vacancy rejected.')
      )
      loadJobs()
    } catch (err) {
      toast.error('Action Failed', 'Could not update job moderation status.')
    } finally {
      setActionInProgress(null)
    }
  }

  const handleOpenDelete = (job: any) => {
    setDeletingJob(job)
    setDeleteModalOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!deletingJob) return
    setIsDeleting(true)
    try {
      await adminService.deleteJob(deletingJob.id)
      toast.success(
        isKhmer ? 'បានលុប' : 'Deleted',
        isKhmer
          ? `ការងារ "${deletingJob.title}" ត្រូវបានលុបជោគជ័យ!`
          : `Job vacancy "${deletingJob.title}" deleted successfully!`
      )
      setDeleteModalOpen(false)
      loadJobs()
    } catch (err: any) {
      toast.error(
        isKhmer ? 'បរាជ័យ' : 'Error',
        err.response?.data?.message || 'Could not delete job vacancy.'
      )
    } finally {
      setIsDeleting(false)
    }
  }

  const filteredJobs = jobs.filter((j) => {
    const matchesStatus = statusFilter === 'all' || j.moderation_status === statusFilter
    const q = search.toLowerCase().trim()
    const matchesSearch =
      !q ||
      j.title?.toLowerCase().includes(q) ||
      j.title_km?.toLowerCase().includes(q) ||
      j.company_name?.toLowerCase().includes(q) ||
      j.province?.toLowerCase().includes(q)

    return matchesStatus && matchesSearch
  })

  const pendingCount = jobs.filter((j) => j.moderation_status === 'pending').length
  const approvedCount = jobs.filter((j) => j.moderation_status === 'approved').length
  const rejectedCount = jobs.filter((j) => j.moderation_status === 'rejected').length

  const handleExportExcel = () => {
    if (!jobs || jobs.length === 0) return
    try {
      exportJobsToExcel(filteredJobs, isKhmer)
      toast.success(
        isKhmer ? 'បានទាញយកទិន្នន័យជោគជ័យ' : 'Excel Exported',
        isKhmer
          ? 'ឯកសារ Microsoft Excel (.xlsx) ត្រូវបានទាញយកទៅកាន់ឧបករណ៍របស់អ្នក'
          : 'Jobs exported to Microsoft Excel (.xlsx).'
      )
    } catch (err) {
      toast.error('Export Failed', 'Could not export jobs to Excel.')
    }
  }

  if (isLoading) {
    return (
      <div className="py-24 text-center font-sans">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="mt-3 text-xs font-normal text-slate-400">
          {isKhmer ? 'កំពុងដំណើរការទាញយកការងារ...' : 'Loading vacancies...'}
        </p>
      </div>
    )
  }

  return (
    <div className="w-full space-y-3.5 font-sans pb-12">
      {/* 1. Header Bar: Title on left, Search on right (Compact, unified) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-2xs">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              {isKhmer ? 'ត្រួតពិនិត្យ និងគ្រប់គ្រងការងារ' : 'Job Moderation & Vacancies'}
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-gray-200">
              <Briefcase className="w-3 h-3 text-blue-600" />
              <span>{jobs.length} {isKhmer ? 'ការងារសរុប' : 'Total'}</span>
            </span>
            {pendingCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                {pendingCount} {isKhmer ? 'រង់ចាំពិនិត្យ' : 'Pending'}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {isKhmer
              ? 'ត្រួតពិនិត្យការងារដែលបានផ្សាយដោយនិយោជកមុននឹងបង្ហាញជាសាធារណៈលើវេទិកា'
              : 'Review and moderate job postings before they go live on the public directory'}
          </p>
        </div>

        {/* Search Input on Top / Header & Export to Excel */}
        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto w-full sm:w-auto">
          <div className="relative w-full sm:w-64 md:w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={
                isKhmer
                  ? 'ស្វែងរកតាមចំណងជើង ឬឈ្មោះក្រុមហ៊ុន...'
                  : 'Search job title or company...'
              }
              className="w-full pl-8 pr-8 py-1.5 text-xs bg-slate-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-blue-500 font-medium transition text-slate-800 shadow-2xs"
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

          <button
            type="button"
            onClick={handleExportExcel}
            disabled={jobs.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-semibold transition shadow-2xs cursor-pointer disabled:opacity-50 shrink-0"
            title={isKhmer ? 'ទាញយកបញ្ជីការងារជា Excel (.xlsx)' : 'Export jobs to Microsoft Excel (.xlsx)'}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>{isKhmer ? 'នាំចេញជា Excel' : 'Export Excel'}</span>
          </button>
        </div>
      </div>

      {/* 2. Filter Toolbar (Clean pills on right) */}
      <div className="flex items-center justify-between gap-2 bg-white px-4 py-2.5 rounded-2xl border border-gray-200 shadow-2xs overflow-x-auto">
        <span className="text-[11px] font-medium text-slate-400 shrink-0 hidden sm:inline">
          {isKhmer ? 'ច្រោះតាមស្ថានភាព៖' : 'Filter by Status:'}
        </span>

        <div className="flex items-center space-x-1.5 ml-auto">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition cursor-pointer shrink-0 ${statusFilter === 'all'
              ? 'bg-blue-600 text-white shadow-2xs'
              : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-gray-200'
              }`}
          >
            {isKhmer ? 'ទាំងអស់' : 'All'} ({jobs.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1 rounded-xl text-xs font-normal transition cursor-pointer shrink-0 ${statusFilter === 'pending'
              ? 'bg-amber-500 text-white shadow-2xs'
              : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200/70'
              }`}
          >
            {isKhmer ? 'រង់ចាំអនុម័ត' : 'Pending'} ({pendingCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('approved')}
            className={`px-3 py-1 rounded-xl text-xs font-normal transition cursor-pointer shrink-0 ${statusFilter === 'approved'
              ? 'bg-emerald-600 text-white shadow-2xs'
              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/70'
              }`}
          >
            {isKhmer ? 'អនុម័តរួច' : 'Approved'} ({approvedCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('rejected')}
            className={`px-3 py-1 rounded-xl text-xs font-normal transition cursor-pointer shrink-0 ${statusFilter === 'rejected'
              ? 'bg-rose-600 text-white shadow-2xs'
              : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/70'
              }`}
          >
            {isKhmer ? 'បដិសេធ' : 'Rejected'} ({rejectedCount})
          </button>
        </div>
      </div>

      {/* 3. Modern SaaS Data Table (Clean, Compact, Standard UI) */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-gray-200 text-slate-500 uppercase tracking-wider font-normal text-[10px]">
                <th className="py-2.5 px-4">{isKhmer ? 'ការងារ' : 'Job Vacancy'}</th>
                <th className="py-2.5 px-3">{isKhmer ? 'ក្រុមហ៊ុន & ទីតាំង' : 'Company & Location'}</th>
                <th className="py-2.5 px-3">{isKhmer ? 'ប្រាក់ខែ' : 'Salary Range'}</th>
                <th className="py-2.5 px-3">{isKhmer ? 'បេក្ខជន' : 'Applicants'}</th>
                <th className="py-2.5 px-3">{isKhmer ? 'កាលបរិច្ឆេទ' : 'Published'}</th>
                <th className="py-2.5 px-3">{isKhmer ? 'ស្ថានភាព' : 'Status'}</th>
                <th className="py-2.5 px-4 text-right">{isKhmer ? 'សកម្មភាព' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-sans">
              {filteredJobs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Briefcase className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="text-xs font-normal text-slate-700">
                      {isKhmer ? 'មិនមានទិន្នន័យការងារទេ' : 'No jobs found'}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {isKhmer ? 'សូមសាកល្បងស្វែងរកដោយពាក្យគន្លឹះផ្សេង' : 'Try adjusting your search or filters.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredJobs
                  .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                  .map((j) => {
                    const isApproved = j.moderation_status === 'approved'
                    const isPending = j.moderation_status === 'pending'

                    return (
                      <tr key={j.id} className="hover:bg-slate-50/70 transition-colors group">
                        {/* Column 1: Job Title */}
                        <td className="py-2.5 px-4 align-middle">
                          <div className="space-y-0.5 max-w-sm">
                            <Link
                              to={`/jobs/${j.slug}`}
                              className="font-medium text-slate-800 group-hover:text-blue-600 transition-colors block text-xs line-clamp-1"
                            >
                              {isKhmer && j.title_km ? j.title_km : j.title}
                            </Link>
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="px-2 py-0.2 rounded-md text-[10px] font-normal bg-blue-50 text-blue-700 border border-blue-200/50">
                                {j.employment_type?.replace('_', ' ') || 'Full Time'}
                              </span>
                              <span className="px-2 py-0.2 rounded-md text-[10px] font-normal bg-slate-100 text-slate-600 border border-gray-200">
                                {j.workplace_type || 'On Site'}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Column 2: Company & Location */}
                        <td className="py-2.5 px-3 align-middle">
                          <div className="space-y-0.5">
                            <span className="font-normal text-slate-800 block truncate">
                              {j.company_name}
                            </span>
                            <div className="flex items-center space-x-1 text-slate-400 text-[11px]">
                              <MapPin className="w-3 h-3 shrink-0" />
                              <span>{j.province || 'Phnom Penh'}</span>
                            </div>
                          </div>
                        </td>

                        {/* Column 3: Salary */}
                        <td className="py-2.5 px-3 align-middle whitespace-nowrap">
                          <span className="font-normal text-slate-700 text-xs">
                            {formatSalaryRange(
                              j.salary_min,
                              j.salary_max,
                              j.salary_currency,
                              j.is_salary_negotiable,
                              isKhmer ? 'ចរចា' : 'Negotiable'
                            )}
                          </span>
                        </td>

                        {/* Column 4: Applicants Count */}
                        <td className="py-2.5 px-3 align-middle whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 text-[11px] font-normal text-slate-600 bg-slate-50 px-2 py-0.5 rounded-md border border-gray-200">
                            <Users className="w-3 h-3 text-slate-400" />
                            <span>{j.applications_count || 0}</span>
                          </span>
                        </td>

                        {/* Column 5: Published Date */}
                        <td className="py-2.5 px-3 align-middle text-slate-500 font-normal whitespace-nowrap">
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{new Date(j.created_at).toLocaleDateString()}</span>
                          </div>
                        </td>

                        {/* Column 6: Status Badge */}
                        <td className="py-2.5 px-3 align-middle whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-normal border ${isApproved
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : isPending
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                              }`}
                          >
                            {isApproved ? (
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            ) : isPending ? (
                              <Clock className="w-3 h-3 text-amber-600" />
                            ) : (
                              <XCircle className="w-3 h-3 text-rose-600" />
                            )}
                            <span>
                              {isApproved
                                ? isKhmer ? 'អនុម័តរួច' : 'Approved'
                                : isPending
                                  ? isKhmer ? 'រង់ចាំអនុម័ត' : 'Pending'
                                  : isKhmer ? 'បដិសេធ' : 'Rejected'}
                            </span>
                          </span>
                        </td>

                        {/* Column 7: Actions: View (Blue), Approve (Green), Delete (Red) */}
                        <td className="py-2.5 px-4 align-middle text-right whitespace-nowrap">
                          <div className="flex items-center justify-end space-x-1.5">
                            {/* View public job page */}
                            <Link
                              to={`/jobs/${j.slug}`}
                              target="_blank"
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-normal text-slate-600 hover:text-blue-600 bg-white hover:bg-slate-50 border border-gray-200 transition shadow-2xs"
                              title={isKhmer ? 'មើលការងារសាធារណៈ' : 'View Public Vacancy'}
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span className="hidden sm:inline">{isKhmer ? 'មើល' : 'View'}</span>
                            </Link>

                            {/* Approve / Reject Button */}
                            {!isApproved ? (
                              <button
                                type="button"
                                disabled={actionInProgress === j.id}
                                onClick={() => handleModerateJob(j.id, 'approved')}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-normal text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition cursor-pointer shadow-2xs disabled:opacity-50"
                                title={isKhmer ? 'អនុម័តការងារ' : 'Approve Job'}
                              >
                                <Check className="w-3 h-3 text-emerald-600" />
                                <span className="hidden sm:inline">{isKhmer ? 'អនុម័ត' : 'Approve'}</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled={actionInProgress === j.id}
                                onClick={() => handleModerateJob(j.id, 'rejected')}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-normal text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition cursor-pointer shadow-2xs disabled:opacity-50"
                                title={isKhmer ? 'បដិសេធ' : 'Reject Job'}
                              >
                                <X className="w-3 h-3 text-amber-600" />
                                <span className="hidden sm:inline">{isKhmer ? 'បដិសេធ' : 'Reject'}</span>
                              </button>
                            )}

                            {/* Delete Button (Red) */}
                            <button
                              type="button"
                              onClick={() => handleOpenDelete(j)}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-normal text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition cursor-pointer shadow-2xs"
                              title={isKhmer ? 'លុបការងារ' : 'Delete Vacancy'}
                            >
                              <Trash2 className="w-3 h-3 text-rose-600" />
                              <span className="hidden sm:inline">{isKhmer ? 'លុប' : 'Delete'}</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Pagination: Left Select 25 50 100, Right buttons */}
        {filteredJobs.length > 0 && (
          <TablePagination
            currentPage={currentPage}
            pageSize={pageSize}
            totalItems={filteredJobs.length}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            pageSizeOptions={[25, 50, 100]}
          />
        )}
      </div>

      {/* ================= DELETE CONFIRMATION MODAL ================= */}
      {deleteModalOpen && deletingJob && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150 p-6 space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-medium text-slate-900">
                  {isKhmer ? 'តើអ្នកប្រាកដជាចង់លុបការងារនេះ?' : 'Delete Job Vacancy?'}
                </h3>
                <p className="text-xs font-normal text-slate-500 leading-relaxed">
                  {isKhmer ? (
                    <>
                      តើអ្នកពិតជាចង់លុបការងារ <strong className="text-slate-800 font-medium">"{deletingJob.title}"</strong> របស់ក្រុមហ៊ុន <strong className="text-slate-800 font-medium">{deletingJob.company_name}</strong> មែនទេ?
                      រាល់ពាក្យសុំការងាររបស់បេក្ខជនទាំងអស់ដែលពាក់ព័ន្ធនឹងត្រូវលុបជាអចិន្ត្រៃយ៍។
                    </>
                  ) : (
                    <>
                      Are you sure you want to permanently delete vacancy <strong className="text-slate-800 font-medium">"{deletingJob.title}"</strong> from <strong className="text-slate-800 font-medium">{deletingJob.company_name}</strong>?
                      All candidate applications for this opening will be permanently removed.
                    </>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                disabled={isDeleting}
                className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-normal text-slate-600 hover:bg-slate-50 transition cursor-pointer"
              >
                {isKhmer ? 'បោះបង់' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-normal transition shadow-2xs cursor-pointer disabled:opacity-50 flex items-center space-x-1"
              >
                {isDeleting ? (
                  <span>{isKhmer ? 'កំពុងលុប...' : 'Deleting...'}</span>
                ) : (
                  <span>{isKhmer ? 'លុបការងារ' : 'Delete Vacancy'}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
