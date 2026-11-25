import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useToast } from '../../app/providers'
import { adminService } from '../../services/admin.service'
import { formatSalaryRange } from '../../utils/currency'
import { TablePagination } from '../../components/common/TablePagination'
import { AdminPageHeader } from '../../components/layout/dashboard'
import { Dialog } from '../../components/ui/Dialog'
import { FacebookVerifiedBadge } from '../../components/common/FacebookVerifiedBadge'
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
  Pencil,
  Building,
} from 'lucide-react'

const CAMBODIA_PROVINCES = [
  'Phnom Penh',
  'Siem Reap',
  'Battambang',
  'Sihanoukville',
  'Kampot',
  'Kandal',
  'Kampong Cham',
  'Kampong Chhnang',
  'Kampong Speu',
  'Kampong Thom',
  'Kep',
  'Koh Kong',
  'Kratie',
  'Mondulkiri',
  'Odor Meanchey',
  'Pailin',
  'Preah Vihear',
  'Prey Veng',
  'Pursat',
  'Ratanakiri',
  'Stung Treng',
  'Svay Rieng',
  'Takeo',
  'Tboung Khmum',
]

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

  // Categories for Job Form
  const [categories, setCategories] = useState<any[]>([])

  // Edit Job State
  const [editingJob, setEditingJob] = useState<any | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editTitleKm, setEditTitleKm] = useState('')
  const [editCategoryId, setEditCategoryId] = useState<number | string>('')
  const [editEmploymentType, setEditEmploymentType] = useState('full_time')
  const [editWorkplaceType, setEditWorkplaceType] = useState('on_site')
  const [editExperienceLevel, setEditExperienceLevel] = useState('entry')
  const [editProvince, setEditProvince] = useState('Phnom Penh')
  const [editSalaryMin, setEditSalaryMin] = useState<string>('')
  const [editSalaryMax, setEditSalaryMax] = useState<string>('')
  const [editSalaryCurrency, setEditSalaryCurrency] = useState('USD')
  const [editIsSalaryNegotiable, setEditIsSalaryNegotiable] = useState(false)
  const [editVacanciesCount, setEditVacanciesCount] = useState<number>(1)
  const [editStatus, setEditStatus] = useState('published')
  const [editModerationStatus, setEditModerationStatus] = useState('approved')
  const [editDescription, setEditDescription] = useState('')
  const [editRequirements, setEditRequirements] = useState('')
  const [isUpdatingJob, setIsUpdatingJob] = useState(false)

  const loadCategories = async () => {
    try {
      const data = await adminService.getCategories()
      setCategories(data || [])
    } catch (err) {
      console.error('Failed to load categories:', err)
    }
  }

  const handleOpenEditJob = (job: any) => {
    setEditingJob(job)
    setEditTitle(job.title || '')
    setEditTitleKm(job.title_km || '')
    setEditCategoryId(job.category_id || '')
    setEditEmploymentType(job.employment_type || 'full_time')
    setEditWorkplaceType(job.workplace_type || 'on_site')
    setEditExperienceLevel(job.experience_level || 'entry')
    setEditProvince(job.province || 'Phnom Penh')
    setEditSalaryMin(job.salary_min !== null && job.salary_min !== undefined ? String(job.salary_min) : '')
    setEditSalaryMax(job.salary_max !== null && job.salary_max !== undefined ? String(job.salary_max) : '')
    setEditSalaryCurrency(job.salary_currency || 'USD')
    setEditIsSalaryNegotiable(Boolean(job.is_salary_negotiable))
    setEditVacanciesCount(job.vacancies_count || 1)
    setEditStatus(job.status || 'published')
    setEditModerationStatus(job.moderation_status || 'approved')
    setEditDescription(job.description || '')
    setEditRequirements(job.requirements || '')
  }

  const handleSaveJob = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingJob) return
    setIsUpdatingJob(true)
    try {
      await adminService.updateJob(editingJob.id, {
        title: editTitle.trim(),
        title_km: editTitleKm.trim() || null,
        category_id: editCategoryId ? Number(editCategoryId) : null,
        employment_type: editEmploymentType,
        workplace_type: editWorkplaceType,
        experience_level: editExperienceLevel,
        province: editProvince,
        salary_min: editSalaryMin ? Number(editSalaryMin) : null,
        salary_max: editSalaryMax ? Number(editSalaryMax) : null,
        salary_currency: editSalaryCurrency,
        is_salary_negotiable: editIsSalaryNegotiable,
        vacancies_count: editVacanciesCount,
        status: editStatus,
        moderation_status: editModerationStatus,
        description: editDescription,
        requirements: editRequirements,
      })
      toast.success(
        isKhmer ? 'បានកែប្រែជោគជ័យ' : 'Job Updated',
        isKhmer ? 'ព័ត៌មានការងារត្រូវបានធ្វើបច្ចុប្បន្នភាពដោយជោគជ័យ។' : 'Job vacancy has been updated successfully.'
      )
      setEditingJob(null)
      loadJobs()
    } catch (err: any) {
      toast.error(
        isKhmer ? 'បរាជ័យ' : 'Error',
        err?.response?.data?.message || (isKhmer ? 'មិនអាចកែប្រែព័ត៌មានការងារបានទេ។' : 'Failed to update job vacancy.')
      )
    } finally {
      setIsUpdatingJob(false)
    }
  }

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
    loadCategories()
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
      {/* 1. Header Bar: Using AdminPageHeader */}
      <AdminPageHeader
        title={isKhmer ? 'ត្រួតពិនិត្យ និងគ្រប់គ្រងការងារ' : 'Job Moderation & Vacancies'}
        subtitle={
          isKhmer
            ? 'ត្រួតពិនិត្យការងារដែលបានផ្សាយដោយនិយោជកមុននឹងបង្ហាញជាសាធារណៈលើវេទិកា'
            : 'Review and moderate job postings before they go live on the public directory'
        }
        badge={{
          icon: Briefcase,
          text: `${jobs.length} ${isKhmer ? 'ការងារសរុប' : 'Total'}`,
        }}
        secondaryBadge={
          pendingCount > 0
            ? {
                text: `${pendingCount} ${isKhmer ? 'រង់ចាំពិនិត្យ' : 'Pending'}`,
                variant: 'amber',
              }
            : undefined
        }
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder={
          isKhmer
            ? 'ស្វែងរកតាមចំណងជើង ឬឈ្មោះក្រុមហ៊ុន...'
            : 'Search job title or company...'
        }
      />

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
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="font-normal text-slate-800 block truncate">
                                {j.company_name}
                              </span>
                              {j.company_verification_status === 'verified' && (
                                <FacebookVerifiedBadge
                                  className="w-3.5 h-3.5 shrink-0"
                                  title={isKhmer ? 'ក្រុមហ៊ុនផ្ទៀងផ្ទាត់ផ្លូវការ' : 'Officially Verified Company'}
                                />
                              )}
                            </div>
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
                          <Link
                            to={`/admin/applications?job_id=${j.id}&company_id=${j.company_id}`}
                            title={isKhmer ? 'មើលបេក្ខជនដាក់ពាក្យ' : 'View job applications'}
                            className="inline-flex items-center gap-1 text-[11px] font-normal text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 dark:hover:bg-blue-950/40 dark:hover:text-blue-400 px-2 py-0.5 rounded-md border border-gray-200 dark:border-slate-700 transition-colors"
                          >
                            <Users className="w-3 h-3 text-slate-400" />
                            <span>{j.applications_count || 0}</span>
                          </Link>
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
                            {/* Edit Job Vacancy Button */}
                            <button
                              type="button"
                              onClick={() => handleOpenEditJob(j)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition cursor-pointer shadow-2xs"
                              title={isKhmer ? 'កែសម្រួលព័ត៌មានការងារ' : 'Edit Job Vacancy'}
                            >
                              <Pencil className="w-3 h-3 text-amber-600" />
                              <span className="hidden sm:inline">{isKhmer ? 'កែប្រែ' : 'Edit'}</span>
                            </button>

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

      {/* ================= EDIT JOB VACANCY MODAL ================= */}
      {editingJob && (
        <Dialog
          isOpen={!!editingJob}
          onClose={() => !isUpdatingJob && setEditingJob(null)}
          size="lg"
          icon={<Briefcase className="w-5 h-5 text-blue-600" />}
          iconClassName="bg-blue-50 text-blue-600 border border-blue-200"
          title={
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  {isKhmer ? 'កែសម្រួលព័ត៌មានការងារ' : 'Edit Job Vacancy'}
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
                  ID #{editingJob.id}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 font-normal">
                {editingJob.company_name} • {editingJob.title}
              </p>
            </div>
          }
        >
          <form onSubmit={handleSaveJob} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Job Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isKhmer ? 'ចំណងជើងការងារ *' : 'Job Title *'}
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder={isKhmer ? 'ឧ. Senior Full-Stack Engineer' : 'e.g. Senior Full-Stack Engineer'}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-gray-200 rounded-xl text-slate-900 outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition"
                />
              </div>

              {/* Job Title Khmer */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isKhmer ? 'ចំណងជើងការងារ (ភាសាខ្មែរ)' : 'Job Title (Khmer)'}
                </label>
                <input
                  type="text"
                  value={editTitleKm}
                  onChange={(e) => setEditTitleKm(e.target.value)}
                  placeholder={isKhmer ? 'ឧ. វិស្វករកម្មវិធីជាន់ខ្ពស់' : 'e.g. វិស្វករកម្មវិធីជាន់ខ្ពស់'}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-gray-200 rounded-xl text-slate-900 outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition"
                />
              </div>

              {/* Job Category */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isKhmer ? 'ផ្នែកការងារ' : 'Job Category'}
                </label>
                <select
                  value={editCategoryId}
                  onChange={(e) => setEditCategoryId(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-gray-200 rounded-xl text-slate-900 outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition cursor-pointer"
                >
                  <option value="">{isKhmer ? 'ជ្រើសរើសផ្នែកការងារ' : 'Select Category'}</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {isKhmer && c.name_km ? c.name_km : c.name_en}
                    </option>
                  ))}
                </select>
              </div>

              {/* Province / Location */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isKhmer ? 'រាជធានី / ខេត្ត' : 'Province / Location'}
                </label>
                <select
                  value={editProvince}
                  onChange={(e) => setEditProvince(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-gray-200 rounded-xl text-slate-900 outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition cursor-pointer"
                >
                  {CAMBODIA_PROVINCES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              {/* Employment Type */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isKhmer ? 'ប្រភេទការងារ' : 'Employment Type'}
                </label>
                <select
                  value={editEmploymentType}
                  onChange={(e) => setEditEmploymentType(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-gray-200 rounded-xl text-slate-900 outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition cursor-pointer"
                >
                  <option value="full_time">{isKhmer ? 'ពេញម៉ោង' : 'Full Time'}</option>
                  <option value="part_time">{isKhmer ? 'ក្រៅម៉ោង' : 'Part Time'}</option>
                  <option value="contract">{isKhmer ? 'កិច្ចសន្យា' : 'Contract'}</option>
                  <option value="internship">{isKhmer ? 'កម្មសិក្សា' : 'Internship'}</option>
                  <option value="freelance">{isKhmer ? 'ឯករាជ្យ' : 'Freelance'}</option>
                </select>
              </div>

              {/* Workplace Type */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isKhmer ? 'ទម្រង់ការងារ' : 'Workplace Type'}
                </label>
                <select
                  value={editWorkplaceType}
                  onChange={(e) => setEditWorkplaceType(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-gray-200 rounded-xl text-slate-900 outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition cursor-pointer"
                >
                  <option value="on_site">{isKhmer ? 'ធ្វើការនៅការិយាល័យ' : 'On-Site'}</option>
                  <option value="hybrid">{isKhmer ? 'កូនកាត់ (Hybrid)' : 'Hybrid'}</option>
                  <option value="remote">{isKhmer ? 'ពីចម្ងាយ (Remote)' : 'Remote'}</option>
                </select>
              </div>

              {/* Experience Level */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isKhmer ? 'កម្រិតបទពិសោធន៍' : 'Experience Level'}
                </label>
                <select
                  value={editExperienceLevel}
                  onChange={(e) => setEditExperienceLevel(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-gray-200 rounded-xl text-slate-900 outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition cursor-pointer"
                >
                  <option value="entry">{isKhmer ? 'ទើបបញ្ចប់ការសិក្សា' : 'Entry Level'}</option>
                  <option value="junior">{isKhmer ? 'កម្រិតដំបូង (Junior)' : 'Junior'}</option>
                  <option value="mid">{isKhmer ? 'កម្រិតមធ្យម (Mid-Level)' : 'Mid-Level'}</option>
                  <option value="senior">{isKhmer ? 'កម្រិតជាន់ខ្ពស់ (Senior)' : 'Senior'}</option>
                  <option value="lead">{isKhmer ? 'ប្រធានក្រុម / អ្នកគ្រប់គ្រង' : 'Lead / Manager'}</option>
                  <option value="executive">{isKhmer ? 'នាយកប្រតិបត្តិ' : 'Executive'}</option>
                </select>
              </div>

              {/* Vacancies Count */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isKhmer ? 'ចំនួនជ្រើសរើស (នាក់)' : 'Vacancies Count'}
                </label>
                <input
                  type="number"
                  min={1}
                  value={editVacanciesCount}
                  onChange={(e) => setEditVacanciesCount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-gray-200 rounded-xl text-slate-900 outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition"
                />
              </div>

              {/* Salary Min */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isKhmer ? 'ប្រាក់បៀវត្សអប្បបរមា' : 'Min Salary'} ({editSalaryCurrency})
                </label>
                <input
                  type="number"
                  disabled={editIsSalaryNegotiable}
                  value={editSalaryMin}
                  onChange={(e) => setEditSalaryMin(e.target.value)}
                  placeholder="e.g. 500"
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-gray-200 rounded-xl text-slate-900 outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition disabled:opacity-50"
                />
              </div>

              {/* Salary Max */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isKhmer ? 'ប្រាក់បៀវត្សអតិបរមា' : 'Max Salary'} ({editSalaryCurrency})
                </label>
                <input
                  type="number"
                  disabled={editIsSalaryNegotiable}
                  value={editSalaryMax}
                  onChange={(e) => setEditSalaryMax(e.target.value)}
                  placeholder="e.g. 1500"
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-gray-200 rounded-xl text-slate-900 outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition disabled:opacity-50"
                />
              </div>

              {/* Currency & Negotiable */}
              <div className="sm:col-span-2 flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-2.5 rounded-xl border border-gray-200">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-slate-700">
                    {isKhmer ? 'រូបិយប័ណ្ណ៖' : 'Currency:'}
                  </span>
                  <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="currency"
                      value="USD"
                      checked={editSalaryCurrency === 'USD'}
                      onChange={() => setEditSalaryCurrency('USD')}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span>USD ($)</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="currency"
                      value="KHR"
                      checked={editSalaryCurrency === 'KHR'}
                      onChange={() => setEditSalaryCurrency('KHR')}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span>KHR (៛)</span>
                  </label>
                </div>

                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editIsSalaryNegotiable}
                    onChange={(e) => setEditIsSalaryNegotiable(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>{isKhmer ? 'ប្រាក់បៀវត្សចរចាបាន' : 'Salary is negotiable'}</span>
                </label>
              </div>

              {/* Status & Moderation Status */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isKhmer ? 'ស្ថានភាពផ្សាយ' : 'Publishing Status'}
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-gray-200 rounded-xl text-slate-900 outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition cursor-pointer font-medium"
                >
                  <option value="published">{isKhmer ? 'កំពុងផ្សាយ' : 'Published'}</option>
                  <option value="draft">{isKhmer ? 'សេចក្តីព្រាង' : 'Draft'}</option>
                  <option value="closed">{isKhmer ? 'បិទការជ្រើសរើស' : 'Closed'}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isKhmer ? 'ស្ថានភាពត្រួតពិនិត្យ' : 'Moderation Status'}
                </label>
                <select
                  value={editModerationStatus}
                  onChange={(e) => setEditModerationStatus(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-gray-200 rounded-xl text-slate-900 outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition cursor-pointer font-medium"
                >
                  <option value="approved">{isKhmer ? 'អនុម័តរួច' : 'Approved'}</option>
                  <option value="pending">{isKhmer ? 'រង់ចាំអនុម័ត' : 'Pending'}</option>
                  <option value="rejected">{isKhmer ? 'បដិសេធ' : 'Rejected'}</option>
                </select>
              </div>
            </div>

            {/* Job Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {isKhmer ? 'ការពិពណ៌នាអំពីការងារ' : 'Job Description'}
              </label>
              <textarea
                rows={4}
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder={isKhmer ? 'រៀបរាប់អំពីការទទួលខុសត្រូវ និងព័ត៌មានលម្អិតនៃការងារ...' : 'Job overview, key responsibilities, and team context...'}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-gray-200 rounded-xl text-slate-900 outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition resize-none leading-relaxed"
              />
            </div>

            {/* Job Requirements */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {isKhmer ? 'តម្រូវការការងារ' : 'Job Requirements'}
              </label>
              <textarea
                rows={3}
                value={editRequirements}
                onChange={(e) => setEditRequirements(e.target.value)}
                placeholder={isKhmer ? 'ជំនាញចាំបាច់ បទពិសោធន៍ និងគុណវុឌ្ឍិដែលត្រូវការ...' : 'Required skills, qualifications, and criteria...'}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-gray-200 rounded-xl text-slate-900 outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition resize-none leading-relaxed"
              />
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
              <a
                href={`/jobs/${editingJob.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer shadow-2xs flex items-center space-x-1"
              >
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                <span>{isKhmer ? 'ទំព័រសាធារណៈ' : 'Public Vacancy'}</span>
              </a>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingJob(null)}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  {isKhmer ? 'បោះបង់' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingJob}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-500/20 active:scale-98 transition cursor-pointer disabled:opacity-60 flex items-center gap-1.5"
                >
                  {isUpdatingJob ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {isUpdatingJob
                      ? isKhmer
                        ? 'កំពុងរក្សាទុក...'
                        : 'Saving...'
                      : isKhmer
                      ? 'រក្សាទុកការកែប្រែ'
                      : 'Save Changes'}
                  </span>
                </button>
              </div>
            </div>
          </form>
        </Dialog>
      )}

      {/* ================= DELETE CONFIRMATION MODAL ================= */}
      {deleteModalOpen && deletingJob && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150 p-6 space-y-4">
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
