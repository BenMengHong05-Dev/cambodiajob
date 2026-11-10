import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { employerService } from '../../services/employer.service'
import { Job } from '../../types'
import { formatSalaryRange } from '../../utils/currency'
import { TablePagination } from '../../components/common/TablePagination'
import { Select } from '../../components/ui/Select'
import { useToast } from '../../app/providers'
import { exportJobsToExcel } from '../../utils/excelExport'
import {
  Briefcase,
  PlusCircle,
  Users,
  MapPin,
  ExternalLink,
  Trash2,
  Search,
  AlertTriangle,
  FileSpreadsheet,
} from 'lucide-react'

export const EmployerJobsPage: React.FC = () => {
  const { i18n } = useTranslation()
  const { toast } = useToast()
  const navigate = useNavigate()
  const isKhmer = i18n.language === 'km'

  const [jobs, setJobs] = useState<Job[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)

  // Delete modal state
  const [deleteJobId, setDeleteJobId] = useState<number | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchJobs = async () => {
    setIsLoading(true)
    try {
      const data = await employerService.getEmployerJobs()
      setJobs(data || [])
    } catch (err) {
      console.error('Failed to load employer jobs:', err)
      toast.error(
        isKhmer ? 'បរាជ័យ' : 'Error',
        isKhmer ? 'មិនអាចទាញយកទិន្នន័យការងារបានទេ' : 'Failed to load vacancies.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchJobs()
  }, [])

  const handleStatusChange = async (jobId: number, newStatus: string) => {
    try {
      await employerService.updateJobStatus(jobId, newStatus)
      setJobs((prev) =>
        prev.map((j) => (j.id === jobId ? { ...j, status: newStatus as any } : j))
      )
      toast.success(
        isKhmer ? 'ស្ថានភាពត្រូវបានផ្លាស់ប្តូរ' : 'Status Updated',
        isKhmer ? 'ស្ថានភាពការងារត្រូវបានកែប្រែដោយជោគជ័យ' : 'Job status has been updated successfully.'
      )
    } catch (err) {
      toast.error(
        isKhmer ? 'បរាជ័យ' : 'Error',
        isKhmer ? 'មិនអាចផ្លាស់ប្តូរស្ថានភាពការងារបានទេ' : 'Failed to change vacancy status.'
      )
    }
  }

  const handleExportExcel = () => {
    if (!jobs || jobs.length === 0) return
    try {
      exportJobsToExcel(jobs, isKhmer)
      toast.success(
        isKhmer ? 'បានទាញយកទិន្នន័យជោគជ័យ' : 'Excel Exported',
        isKhmer
          ? 'ឯកសារ Microsoft Excel (.xlsx) ត្រូវបានទាញយកទៅកាន់ឧបករណ៍របស់អ្នក'
          : 'Vacancies list exported to Microsoft Excel (.xlsx).'
      )
    } catch (err) {
      toast.error(
        isKhmer ? 'បរាជ័យ' : 'Error',
        isKhmer ? 'មិនអាចនាំចេញឯកសារ Excel បានទេ' : 'Failed to export vacancies.'
      )
    }
  }

  const handleDeleteJob = async () => {
    if (!deleteJobId) return
    setIsDeleting(true)
    try {
      await employerService.deleteJob(deleteJobId)
      setJobs((prev) => prev.filter((j) => j.id !== deleteJobId))
      setDeleteJobId(null)
      toast.success(
        isKhmer ? 'បានលុបការងារ' : 'Job Deleted',
        isKhmer ? 'ការងារត្រូវបានលុបចេញពីប្រព័ន្ធដោយជោគជ័យ' : 'Job vacancy has been deleted.'
      )
    } catch (err) {
      toast.error(
        isKhmer ? 'បរាជ័យ' : 'Error',
        isKhmer ? 'មិនអាចលុបការងារបានទេ' : 'Failed to delete vacancy.'
      )
    } finally {
      setIsDeleting(false)
    }
  }

  const getDynamicStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-gray-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>{isKhmer ? 'ផ្សាយផ្ទាល់' : 'Published'}</span>
          </span>
        )
      case 'closed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-gray-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            <span>{isKhmer ? 'បានបិទ' : 'Closed'}</span>
          </span>
        )
      case 'draft':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-gray-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span>{isKhmer ? 'សេចក្តីព្រាង' : 'Draft'}</span>
          </span>
        )
    }
  }

  const statusOptions = [
    { value: 'published', label: isKhmer ? 'ផ្សាយផ្ទាល់ (Published)' : 'Published' },
    { value: 'draft', label: isKhmer ? 'សេចក្តីព្រាង (Draft)' : 'Draft' },
    { value: 'closed', label: isKhmer ? 'បិទការជ្រើសរើស (Closed)' : 'Closed' },
  ]

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      !searchQuery.trim() ||
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.province?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === 'all' || job.status === statusFilter
    return matchesSearch && matchesStatus
  })

  if (isLoading) {
    return (
      <div className="py-24 text-center font-sans">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="mt-3 text-xs font-medium text-slate-500">
          {isKhmer ? 'កំពុងដំណើរការទាញយកទិន្នន័យការងារ...' : 'Loading vacancies...'}
        </p>
      </div>
    )
  }

  return (
    <div className="w-full space-y-4 sm:space-y-5 font-sans pb-16">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-2xs">
        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            {isKhmer ? 'គ្រប់គ្រងការងារ & ឱកាសជ្រើសរើសបុគ្គលិក' : 'Manage Vacancies & Openings'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {isKhmer
              ? 'បង្កើត កែសម្រួល ប្តូរស្ថានភាព និងត្រួតពិនិត្យបេក្ខជនដាក់ពាក្យទូទាំងប្រទេសកម្ពុជា'
              : 'Create, publish, toggle status, and review candidate applicants across Cambodia'}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleExportExcel}
            disabled={jobs.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 font-semibold text-xs transition shadow-2xs cursor-pointer disabled:opacity-50"
            title={isKhmer ? 'ទាញយកបញ្ជីការងារជា Excel (.xlsx)' : 'Export vacancies to Microsoft Excel (.xlsx)'}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>{isKhmer ? 'នាំចេញជា Excel' : 'Export Excel'}</span>
          </button>

          <Link
            to="/employer/jobs/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-semibold text-xs transition shadow-2xs cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>{isKhmer ? 'ផ្សាយការងារថ្មី' : 'Post New Vacancy'}</span>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-gray-200 shadow-2xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isKhmer ? 'ស្វែងរកតាមចំណងជើង ឬទីតាំង...' : 'Search vacancy by title or location...'}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-gray-200 rounded-xl text-slate-800 placeholder-slate-400 font-medium outline-none focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {[
            { id: 'all', label: isKhmer ? 'ទាំងអស់' : 'All' },
            { id: 'published', label: isKhmer ? 'ផ្សាយផ្ទាល់' : 'Published' },
            { id: 'draft', label: isKhmer ? 'សេចក្តីព្រាង' : 'Draft' },
            { id: 'closed', label: isKhmer ? 'បានបិទ' : 'Closed' },
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

      {/* Vacancies List */}
      {filteredJobs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center space-y-3 shadow-2xs">
          <Briefcase className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-xs sm:text-sm font-bold text-slate-900">
            {jobs.length === 0
              ? isKhmer
                ? 'មិនទាន់មានការងារត្រូវបានផ្សាយនៅឡើយទេ'
                : 'No Job Postings Yet'
              : isKhmer
              ? 'រកមិនឃើញការងារតាមការស្វែងរកទេ'
              : 'No matching vacancies'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {jobs.length === 0
              ? isKhmer
                ? 'ចាប់ផ្តើមដោយការផ្សាយឱកាសការងារដំបូងដើម្បីទទួលបានបេក្ខជនឆ្នើមទូទាំងប្រទេស។'
                : 'Get started by posting your first job opening to reach qualified professionals.'
              : isKhmer
              ? 'សូមសាកល្បងផ្លាស់ប្តូរពាក្យគន្លឹះស្វែងរក។'
              : 'Try clearing your search query or selecting a different status filter.'}
          </p>
          {jobs.length === 0 && (
            <Link
              to="/employer/jobs/new"
              className="inline-flex items-center gap-1.5 mt-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition shadow-2xs"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>{isKhmer ? 'ផ្សាយការងារថ្មី' : 'Create Job Vacancy'}</span>
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredJobs
            .slice((currentPage - 1) * pageSize, currentPage * pageSize)
            .map((job: any) => (
            <div
              key={job.id}
              className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-blue-400 transition"
            >
              {/* Job Info */}
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 hover:text-blue-600 transition truncate">
                    <Link to={`/employer/jobs/${job.id}/applications`}>{job.title}</Link>
                  </h3>
                  {getDynamicStatusBadge(job.status)}
                </div>

                <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-500">
                  <span className="flex items-center">
                    <MapPin className="w-3 h-3 mr-1 text-slate-400" />
                    <span>{job.province || 'Phnom Penh'}</span>
                  </span>
                  <span>•</span>
                  <span className="capitalize">{job.employment_type?.replace('_', ' ')}</span>
                  <span>•</span>
                  <span className="text-emerald-700 font-semibold">
                    {formatSalaryRange(job.salary_min, job.salary_max, job.salary_currency, job.is_salary_negotiable)}
                  </span>
                  <span>•</span>
                  <span className="text-slate-400">
                    {new Date(job.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>

              {/* Actions Row */}
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {/* Dynamic Status Dropdown */}
                <div className="w-36">
                  <Select
                    value={job.status}
                    onChange={(e) => handleStatusChange(job.id, e.target.value)}
                    options={statusOptions}
                  />
                </div>

                {/* Review Applicants Button (Blue) */}
                <Link
                  to={`/employer/jobs/${job.id}/applications`}
                  className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-gray-200 text-xs font-semibold transition flex items-center space-x-1 shadow-2xs"
                >
                  <Users className="w-3.5 h-3.5 text-blue-600" />
                  <span>{job.applications_count || 0} {isKhmer ? 'បេក្ខជន' : 'Candidates'}</span>
                </Link>

                {/* View Public Link (Blue) */}
                <Link
                  to={`/jobs/${job.slug}`}
                  target="_blank"
                  className="p-1.5 text-blue-600 hover:bg-blue-50 border border-gray-200 rounded-xl transition shadow-2xs"
                  title="View Public Post"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>

                {/* Delete Job Button (Red) */}
                <button
                  type="button"
                  onClick={() => setDeleteJobId(job.id)}
                  className="p-1.5 text-rose-600 hover:bg-rose-50 border border-gray-200 rounded-xl transition cursor-pointer shadow-2xs"
                  title={isKhmer ? 'លុបការងារ' : 'Delete vacancy'}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}

          {/* Table Pagination: Left Select 25 50 100, Right buttons */}
          {filteredJobs.length > 0 && (
            <div className="rounded-2xl overflow-hidden border border-slate-200/80 shadow-2xs">
              <TablePagination
                currentPage={currentPage}
                pageSize={pageSize}
                totalItems={filteredJobs.length}
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
                pageSizeOptions={[25, 50, 100]}
              />
            </div>
          )}
        </div>
      )}

      {/* Delete Job Confirmation Modal */}
      {deleteJobId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 max-w-sm w-full shadow-2xl space-y-4 font-sans text-center">
            <div className="w-11 h-11 rounded-full bg-rose-50 text-rose-600 border border-gray-200 flex items-center justify-center mx-auto shadow-2xs">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                {isKhmer ? 'តើអ្នកប្រាកដជាចង់លុបការងារនេះ?' : 'Delete Job Vacancy?'}
              </h3>
              <p className="text-xs text-slate-500">
                {isKhmer
                  ? 'សកម្មភាពនេះនឹងលុបការងារ និងទិន្នន័យពាក្យសុំទាំងអស់ដែលពាក់ព័ន្ធ។'
                  : 'This will permanently remove this vacancy and its applicant links.'}
              </p>
            </div>
            <div className="flex justify-center space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteJobId(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-gray-200 transition cursor-pointer shadow-2xs"
              >
                {isKhmer ? 'បោះបង់' : 'Cancel'}
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteJob}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 transition shadow-2xs cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? (isKhmer ? 'កំពុងលុប...' : 'Deleting...') : isKhmer ? 'លុបការងារ' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
