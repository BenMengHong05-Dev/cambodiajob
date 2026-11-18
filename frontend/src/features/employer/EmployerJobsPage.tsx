import React, { useEffect, useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { employerService } from '../../services/employer.service'
import { Job } from '../../types'
import { formatSalaryRange } from '../../utils/currency'
import { TablePagination } from '../../components/common/TablePagination'
import { Input, Select } from '../../components/ui'
import { useToast } from '../../app/providers'
import { exportJobsToExcel } from '../../utils/excelExport'
import {
  Briefcase,
  PlusCircle,
  Users,
  MapPin,
  Trash2,
  Search,
  AlertTriangle,
  FileSpreadsheet,
  Pencil,
  Sparkles,
  ChevronDown,
  Check,
  X,
  Clock,
  Save,
  CheckCircle2,
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

  // Open status dropdown tracker (jobId => boolean)
  const [openStatusDropdownId, setOpenStatusDropdownId] = useState<number | null>(null)
  const statusDropdownRef = useRef<HTMLDivElement | null>(null)

  // Delete modal state
  const [deleteJobId, setDeleteJobId] = useState<number | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Quick Edit Modal state
  const [quickEditJob, setQuickEditJob] = useState<Job | null>(null)
  const [quickTitle, setQuickTitle] = useState('')
  const [quickSalaryMin, setQuickSalaryMin] = useState('')
  const [quickSalaryMax, setQuickSalaryMax] = useState('')
  const [quickVacancies, setQuickVacancies] = useState(1)
  const [quickStatus, setQuickStatus] = useState<'published' | 'draft' | 'closed'>('published')
  const [isSavingQuickEdit, setIsSavingQuickEdit] = useState(false)

  // Close status dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(e.target as Node)) {
        setOpenStatusDropdownId(null)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

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
      setOpenStatusDropdownId(null)
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

  // Open Quick Edit Modal
  const handleOpenQuickEdit = (job: Job) => {
    setQuickEditJob(job)
    setQuickTitle(job.title || '')
    setQuickSalaryMin(job.salary_min != null ? String(job.salary_min) : '')
    setQuickSalaryMax(job.salary_max != null ? String(job.salary_max) : '')
    setQuickVacancies(job.vacancies_count || 1)
    setQuickStatus((job.status as any) || 'published')
  }

  // Save Quick Edit Modal
  const handleSaveQuickEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!quickEditJob) return
    setIsSavingQuickEdit(true)
    try {
      const payload: any = {
        title: quickTitle.trim(),
        salary_min: quickSalaryMin ? Number(quickSalaryMin) : undefined,
        salary_max: quickSalaryMax ? Number(quickSalaryMax) : undefined,
        vacancies_count: quickVacancies,
        status: quickStatus,
      }
      const updated = await employerService.updateJob(quickEditJob.id, payload)
      setJobs((prev) =>
        prev.map((j) => (j.id === quickEditJob.id ? { ...j, ...updated, ...payload } : j))
      )
      setQuickEditJob(null)
      toast.success(
        isKhmer ? 'កែសម្រួលបានជោគជ័យ' : 'Job Updated',
        isKhmer ? 'ព័ត៌មានការងារត្រូវបានធ្វើបច្ចុប្បន្នភាពដោយជោគជ័យ' : 'Job details modified successfully.'
      )
    } catch (err) {
      console.error('Quick edit failed:', err)
      toast.error(
        isKhmer ? 'បរាជ័យ' : 'Error',
        isKhmer ? 'មិនអាចកែសម្រួលការងារបានទេ។' : 'Failed to update vacancy.'
      )
    } finally {
      setIsSavingQuickEdit(false)
    }
  }

  // Duplicate Job: Clones job title and pre-navigates to create
  const handleDuplicateJob = (job: Job) => {
    navigate('/employer/jobs/new', {
      state: {
        cloneFrom: {
          title: `${job.title} (ចម្លង/Copy)`,
          category_id: job.category_id || (job as any).category?.id,
          employment_type: job.employment_type,
          workplace_type: job.workplace_type,
          experience_level: job.experience_level,
          province: job.province,
          city: job.city,
          salary_min: job.salary_min,
          salary_max: job.salary_max,
          salary_currency: job.salary_currency,
          description: job.description,
          requirements: job.requirements,
        },
      },
    })
    toast.success(
      isKhmer ? 'បានចម្លងព័ត៌មានការងារ' : 'Job Cloned',
      isKhmer ? 'ព័ត៌មានការងារត្រូវបានចម្លងទៅទម្រង់ថ្មី' : 'Job details copied to new vacancy draft.'
    )
  }

  const getDynamicStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>{isKhmer ? 'ផ្សាយផ្ទាល់' : 'Published'}</span>
          </span>
        )
      case 'closed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            <span>{isKhmer ? 'បានបិទ' : 'Closed'}</span>
          </span>
        )
      case 'draft':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span>{isKhmer ? 'សេចក្តីព្រាង' : 'Draft'}</span>
          </span>
        )
    }
  }

  const statusOptions = [
    { value: 'published', label: isKhmer ? 'ផ្សាយផ្ទាល់ (Published)' : 'Published', color: 'emerald' },
    { value: 'draft', label: isKhmer ? 'សេចក្តីព្រាង (Draft)' : 'Draft', color: 'amber' },
    { value: 'closed', label: isKhmer ? 'បិទការជ្រើសរើស (Closed)' : 'Closed', color: 'rose' },
  ]

  // KPI calculations
  const totalJobsCount = jobs.length
  const publishedCount = jobs.filter((j) => j.status === 'published').length
  const draftCount = jobs.filter((j) => j.status === 'draft').length
  const closedCount = jobs.filter((j) => j.status === 'closed').length
  const totalApplicantsCount = jobs.reduce((acc, j) => acc + (j.applications_count || 0), 0)

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      !searchQuery.trim() ||
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.province?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.employment_type?.toLowerCase().includes(searchQuery.toLowerCase())

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
      {/* 1. Header Bar with KPI Metrics & Action Buttons */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>{isKhmer ? 'គ្រប់គ្រងការងារ & ឱកាសជ្រើសរើសបុគ្គលិក' : 'Manage Vacancies & Openings'}</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                {totalJobsCount} {isKhmer ? 'ការងារ' : 'Jobs'}
              </span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {isKhmer
                ? 'បង្កើត កែសម្រួល ប្តូរស្ថានភាព និងត្រួតពិនិត្យបេក្ខជនដាក់ពាក្យទូទាំងប្រទេសកម្ពុជា'
                : 'Create, modify, toggle status, and review candidate applicants across Cambodia'}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 flex-wrap sm:flex-nowrap">
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
      </div>

      {/* 2. Filter and Search Bar */}
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
            { id: 'all', label: isKhmer ? 'ទាំងអស់' : 'All', count: totalJobsCount },
            { id: 'published', label: isKhmer ? 'ផ្សាយផ្ទាល់' : 'Published', count: publishedCount },
            { id: 'draft', label: isKhmer ? 'សេចក្តីព្រាង' : 'Draft', count: draftCount },
            { id: 'closed', label: isKhmer ? 'បានបិទ' : 'Closed', count: closedCount },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setStatusFilter(tab.id)
                setCurrentPage(1)
              }}
              className={`px-3 py-1 rounded-xl text-xs font-semibold transition shrink-0 cursor-pointer flex items-center gap-1.5 ${statusFilter === tab.id
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-gray-200'
                }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${statusFilter === tab.id ? 'bg-white/20 text-white' : 'bg-slate-200/80 text-slate-600'
                  }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 3. Vacancies List */}
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
            .map((job: any) => {
              const isOpenStatus = openStatusDropdownId === job.id

              return (
                <div
                  key={job.id}
                  className={`bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:border-blue-400 transition ${isOpenStatus ? 'relative z-30' : 'relative z-0'
                    }`}
                >
                  {/* Job Info Section */}
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900 hover:text-blue-600 transition truncate">
                        <Link to={`/employer/jobs/${job.id}/applications`}>{job.title}</Link>
                      </h3>
                      {getDynamicStatusBadge(job.status)}
                      {job.workplace_type && (
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200 uppercase font-bold">
                          {job.workplace_type.replace('_', ' ')}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-500">
                      <span className="flex items-center">
                        <MapPin className="w-3 h-3 mr-1 text-slate-400" />
                        <span>{job.province || 'Phnom Penh'}</span>
                      </span>
                      <span>•</span>
                      <span className="capitalize">{job.employment_type?.replace('_', ' ')}</span>
                      <span>•</span>
                      <span className="text-emerald-700 font-bold">
                        {formatSalaryRange(
                          job.salary_min,
                          job.salary_max,
                          job.salary_currency,
                          job.is_salary_negotiable
                        )}
                      </span>
                      <span>•</span>
                      <span className="text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {new Date(job.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                      {job.vacancies_count > 1 && (
                        <>
                          <span>•</span>
                          <span className="text-blue-700 font-medium">
                            {job.vacancies_count} {isKhmer ? 'តំណែង' : 'openings'}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Actions Row - Easy Management & Modify Controls */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                    {/* 1. Status Dropdown Pill (No Text Truncation!) */}
                    <div className={`relative ${isOpenStatus ? 'z-40' : ''}`} ref={isOpenStatus ? statusDropdownRef : undefined}>
                      <button
                        type="button"
                        onClick={() => setOpenStatusDropdownId(isOpenStatus ? null : job.id)}
                        className={`inline-flex items-center justify-between gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition shadow-2xs cursor-pointer ${job.status === 'published'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                          : job.status === 'closed'
                            ? 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
                            : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                          }`}
                        title={isKhmer ? 'ចុចដើម្បីប្តូរស្ថានភាព' : 'Click to change vacancy status'}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${job.status === 'published'
                            ? 'bg-emerald-500'
                            : job.status === 'closed'
                              ? 'bg-rose-500'
                              : 'bg-amber-500'
                            }`}
                        />
                        <span className="truncate max-w-[110px]">
                          {job.status === 'published'
                            ? isKhmer
                              ? 'ផ្សាយផ្ទាល់'
                              : 'Published'
                            : job.status === 'closed'
                              ? isKhmer
                                ? 'បិទការជ្រើសរើស'
                                : 'Closed'
                              : isKhmer
                                ? 'សេចក្តីព្រាង'
                                : 'Draft'}
                        </span>
                        <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                      </button>

                      {isOpenStatus && (
                        <div className="absolute left-0 lg:right-0 lg:left-auto mt-1.5 w-52 bg-white rounded-2xl shadow-2xl border border-slate-200 p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                          <div className="px-2.5 py-1.5 text-[11px] font-bold text-slate-400 border-b border-slate-100 mb-1">
                            {isKhmer ? 'ជ្រើសរើសស្ថានភាពការងារ' : 'Select Vacancy Status'}
                          </div>
                          {statusOptions.map((opt) => (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => handleStatusChange(job.id, opt.value)}
                              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${job.status === opt.value
                                ? 'bg-blue-50 text-blue-700'
                                : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                                }`}
                            >
                              <div className="flex items-center gap-2">
                                <span
                                  className={`w-2 h-2 rounded-full ${opt.value === 'published'
                                    ? 'bg-emerald-500'
                                    : opt.value === 'closed'
                                      ? 'bg-rose-500'
                                      : 'bg-amber-500'
                                    }`}
                                />
                                <span>{opt.label}</span>
                              </div>
                              {job.status === opt.value && <Check className="w-3.5 h-3.5 text-blue-600" />}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* 2. Edit Job Button */}
                    <Link
                      to={`/employer/jobs/${job.id}/edit`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold transition active:scale-95 cursor-pointer"
                      title={isKhmer ? 'កែសម្រួលព័ត៌មានការងារនេះ' : 'Edit job'}
                    >
                      <Pencil className="w-3.5 h-3.5 text-blue-600" />
                      <span>{isKhmer ? 'កែសម្រួល' : 'Edit'}</span>
                    </Link>

                    {/* 3. Review Applicants Button */}
                    <Link
                      to={`/employer/jobs/${job.id}/applications`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-semibold transition active:scale-95 cursor-pointer"
                      title={isKhmer ? 'មើលបេក្ខជនទាំងអស់ដែលបានដាក់ពាក្យ' : 'Review candidates'}
                    >
                      <Users className="w-3.5 h-3.5 text-indigo-600" />
                      <span>
                        {job.applications_count || 0} {isKhmer ? 'បេក្ខជន' : 'Candidates'}
                      </span>
                    </Link>

                    {/* 4. Delete Job Button */}
                    <button
                      type="button"
                      onClick={() => setDeleteJobId(job.id)}
                      className="p-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-gray-200 hover:border-rose-200 rounded-xl transition cursor-pointer"
                      title={isKhmer ? 'លុបការងារនេះ' : 'Delete vacancy'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )
            })}

          {/* Table Pagination */}
          {filteredJobs.length > 0 && (
            <div className="rounded-2xl overflow-visible border border-gray-200 bg-white relative z-20">
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

      {/* QUICK IN-PLACE EDIT MODAL */}
      {quickEditJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 max-w-lg w-full shadow-2xl space-y-4 font-sans">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center">
                  <Pencil className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {isKhmer ? 'កែសម្រួលការងាររហ័ស (Quick Modify)' : 'Quick Edit Vacancy'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {isKhmer ? 'កែប្រែចំណងជើង ប្រាក់បៀវត្ស និងចំនួនជ្រើសរើស' : 'Update title, salary, openings and status'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setQuickEditJob(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveQuickEdit} className="space-y-3.5">
              <Input
                label={isKhmer ? 'ចំណងជើងការងារ (Job Title)' : 'Job Title'}
                required
                value={quickTitle}
                onChange={(e) => setQuickTitle(e.target.value)}
              />

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label={isKhmer ? 'ប្រាក់បៀវត្សអប្បបរមា ($)' : 'Min Salary ($)'}
                  type="number"
                  value={quickSalaryMin}
                  onChange={(e) => setQuickSalaryMin(e.target.value)}
                  placeholder="e.g. 300"
                />
                <Input
                  label={isKhmer ? 'ប្រាក់បៀវត្សអតិបរមា ($)' : 'Max Salary ($)'}
                  type="number"
                  value={quickSalaryMax}
                  onChange={(e) => setQuickSalaryMax(e.target.value)}
                  placeholder="e.g. 600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label={isKhmer ? 'ចំនួនជ្រើសរើស (Openings)' : 'Vacancies Count'}
                  type="number"
                  min={1}
                  value={quickVacancies}
                  onChange={(e) => setQuickVacancies(Number(e.target.value) || 1)}
                />
                <Select
                  label={isKhmer ? 'ស្ថានភាព (Status)' : 'Status'}
                  value={quickStatus}
                  onChange={(e) => setQuickStatus(e.target.value as any)}
                  options={[
                    { value: 'published', label: isKhmer ? 'ផ្សាយផ្ទាល់ (Published)' : 'Published' },
                    { value: 'draft', label: isKhmer ? 'សេចក្តីព្រាង (Draft)' : 'Draft' },
                    { value: 'closed', label: isKhmer ? 'បិទការជ្រើសរើស (Closed)' : 'Closed' },
                  ]}
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                <Link
                  to={`/employer/jobs/${quickEditJob.id}/edit`}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>{isKhmer ? 'កែសម្រួលទម្រង់ពេញលេញ →' : 'Full Form Edit →'}</span>
                </Link>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setQuickEditJob(null)}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-gray-200 transition cursor-pointer"
                  >
                    {isKhmer ? 'បោះបង់' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingQuickEdit}
                    className="px-4 py-1.5 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition shadow-2xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>
                      {isSavingQuickEdit
                        ? isKhmer
                          ? 'កំពុងរក្សាទុក...'
                          : 'Saving...'
                        : isKhmer
                          ? 'រក្សាទុក'
                          : 'Save Changes'}
                    </span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Job Confirmation Modal */}
      {deleteJobId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-sm w-full shadow-2xl space-y-4 font-sans text-center">
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
