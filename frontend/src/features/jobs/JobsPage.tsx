import React, { useEffect, useState } from 'react'
import { Link, useSearchParams, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { jobsService, JobFilterParams } from '../../services/jobs.service'
import { Job, JobCategory, ProvinceItem } from '../../types'
import { useAuth, usePreferences, useToast } from '../../app/providers'
import { formatSalaryRange } from '../../utils/currency'
import { getAssetUrl } from '../../utils/assets'
import { FacebookVerifiedBadge } from '../../components/common/FacebookVerifiedBadge'
import { Select } from '../../components/ui'
import { TablePagination } from '../../components/common/TablePagination'
import {
  Search,
  MapPin,
  Briefcase,
  Filter,
  Bookmark,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ShieldCheck,
  Check,
  ArrowRight,
  LayoutGrid,
  List,
  X,
  Sparkles,
  Eye,
  SlidersHorizontal,
  Bell,
  Clock,
  Building2,
} from 'lucide-react'

export const JobsPage: React.FC = () => {
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const { toast } = useToast()
  const { currency } = usePreferences()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const location = useLocation()

  const isKhmer = i18n.language === 'km'

  const getEmploymentLabel = (type: string) => {
    const labels: Record<string, { en: string; km: string }> = {
      full_time: { en: 'Full-time', km: 'ពេញម៉ោង' },
      part_time: { en: 'Part-time', km: 'ក្រៅម៉ោង' },
      contract: { en: 'Contract', km: 'កិច្ចសន្យា' },
      internship: { en: 'Internship', km: 'កម្មសិក្សា' },
      freelance: { en: 'Freelance', km: 'ការងារឯករាជ្យ' },
    }
    const val = labels[type]
    if (val) return isKhmer ? val.km : val.en
    return type.replace('_', ' ')
  }

  const getWorkplaceLabel = (type: string) => {
    const labels: Record<string, { en: string; km: string }> = {
      on_site: { en: 'On-site', km: 'នៅកន្លែងធ្វើការ' },
      hybrid: { en: 'Hybrid', km: 'កូនកាត់' },
      remote: { en: 'Remote', km: 'ពីចម្ងាយ' },
    }
    const val = labels[type]
    if (val) return isKhmer ? val.km : val.en
    return type.replace('_', ' ')
  }

  const getExperienceLabel = (level: string) => {
    const labels: Record<string, { en: string; km: string }> = {
      fresh_graduate: { en: 'Fresh Grad', km: 'និស្សិតទើបចប់' },
      entry: { en: 'Entry Level', km: 'កម្រិតដំបូង' },
      mid: { en: 'Mid Level', km: 'កម្រិតមធ្យម' },
      senior: { en: 'Senior Level', km: 'កម្រិតខ្ពស់' },
      lead: { en: 'Lead / Director', km: 'អ្នកដឹកនាំ' },
    }
    const val = labels[level]
    if (val) return isKhmer ? val.km : val.en
    return level.replace('_', ' ')
  }

  const formatJobDate = (dateStr?: string | null) => {
    if (!dateStr) return isKhmer ? 'ថ្មីៗនេះ' : 'Recently'
    try {
      const date = new Date(dateStr)
      if (isNaN(date.getTime())) return isKhmer ? 'ថ្មីៗនេះ' : 'Recently'
      const now = new Date()
      const diffMs = now.getTime() - date.getTime()
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
      const diffDays = Math.floor(diffHours / 24)

      if (diffHours < 1) return isKhmer ? 'ទើបតែបង្ហោះ' : 'Just now'
      if (diffHours < 24) return isKhmer ? `${diffHours} ម៉ោងមុន` : `${diffHours}h ago`
      if (diffDays === 1) return isKhmer ? 'ម្សិលមិញ' : 'Yesterday'
      if (diffDays < 7) return isKhmer ? `${diffDays} ថ្ងៃមុន` : `${diffDays}d ago`
      if (diffDays < 30) return isKhmer ? `${Math.floor(diffDays / 7)} សប្តាហ៍មុន` : `${Math.floor(diffDays / 7)}w ago`

      return date.toLocaleDateString(isKhmer ? 'km-KH' : 'en-US', {
        month: 'short',
        day: 'numeric',
      })
    } catch {
      return isKhmer ? 'ថ្មីៗនេះ' : 'Recently'
    }
  }

  // Filter states
  const [q, setQ] = useState(searchParams.get('q') || '')
  const [category, setCategory] = useState(searchParams.get('category') || '')
  const [province, setProvince] = useState(searchParams.get('province') || '')
  const [employmentType, setEmploymentType] = useState(searchParams.get('employment_type') || '')
  const [workplaceType, setWorkplaceType] = useState(searchParams.get('workplace_type') || '')
  const [experienceLevel, setExperienceLevel] = useState(searchParams.get('experience_level') || '')
  const [salaryMin, setSalaryMin] = useState(searchParams.get('salary_min') || '')
  const [sort, setSort] = useState(searchParams.get('sort') || 'newest')
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1)
  const [pageSize, setPageSize] = useState(25)
  const [viewMode, setViewMode] = useState<'table' | 'grid'>(
    () => (localStorage.getItem('jobs_view_mode') as 'table' | 'grid') || 'table'
  )
  const [isMoreFiltersOpen, setIsMoreFiltersOpen] = useState(
    Boolean(searchParams.get('workplace_type') || searchParams.get('experience_level'))
  )

  const extraFiltersCount = [
    workplaceType && workplaceType !== 'remote' ? 1 : 0,
    experienceLevel ? 1 : 0,
    ['part_time', 'contract', 'freelance'].includes(employmentType) ? 1 : 0,
  ].reduce((a, b) => a + b, 0)

  // Job Alert Modal State
  const [isJobAlertOpen, setIsJobAlertOpen] = useState(false)
  const [alertEmail, setAlertEmail] = useState(user?.email || '')
  const [alertFrequency, setAlertFrequency] = useState('daily')
  const [isSubmittingAlert, setIsSubmittingAlert] = useState(false)

  // Data states
  const [jobs, setJobs] = useState<Job[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [categories, setCategories] = useState<JobCategory[]>([])
  const [provinces, setProvinces] = useState<ProvinceItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Fetch catalogs on mount
  useEffect(() => {
    const fetchCatalogs = async () => {
      try {
        const [cats, locs] = await Promise.all([
          jobsService.getCategories({ has_jobs: true }),
          jobsService.getLocations({ has_jobs: true }),
        ])
        setCategories(cats || [])
        setProvinces(locs.provinces || [])
      } catch (err) {
        console.error('Failed to load catalogs:', err)
      }
    }
    fetchCatalogs()
  }, [])

  // Fetch jobs
  const fetchJobs = async () => {
    setIsLoading(true)
    try {
      const params: JobFilterParams = {
        q: q || undefined,
        category: category || undefined,
        province: province || undefined,
        employment_type: employmentType || undefined,
        workplace_type: workplaceType || undefined,
        experience_level: experienceLevel || undefined,
        salary_min: salaryMin ? Number(salaryMin) : undefined,
        sort: sort || undefined,
        page,
        page_size: pageSize,
      }
      const data = await jobsService.getJobs(params)
      setJobs(data.results || [])
      setTotalCount(data.count || 0)
      setTotalPages(data.total_pages || Math.ceil((data.count || 0) / pageSize) || 1)
    } catch (err) {
      console.error('Failed to fetch jobs:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchJobs()
  }, [q, category, province, employmentType, workplaceType, experienceLevel, salaryMin, sort, page, pageSize])

  const handleApplyFilters = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    const newParams = new URLSearchParams()
    if (q) newParams.set('q', q)
    if (category) newParams.set('category', category)
    if (province) newParams.set('province', province)
    if (employmentType) newParams.set('employment_type', employmentType)
    if (workplaceType) newParams.set('workplace_type', workplaceType)
    if (experienceLevel) newParams.set('experience_level', experienceLevel)
    if (salaryMin) newParams.set('salary_min', salaryMin)
    if (sort) newParams.set('sort', sort)
    setSearchParams(newParams)
  }

  const handleResetFilters = () => {
    setQ('')
    setCategory('')
    setProvince('')
    setEmploymentType('')
    setWorkplaceType('')
    setExperienceLevel('')
    setSalaryMin('')
    setSort('newest')
    setPage(1)
    setSearchParams({})
  }

  const handleCreateJobAlert = (e: React.FormEvent) => {
    e.preventDefault()
    if (!alertEmail.trim()) {
      toast.error(
        isKhmer ? 'សូមបញ្ចូលអ៊ីមែល' : 'Email Required',
        isKhmer ? 'សូមបញ្ចូលអាសយដ្ឋានអ៊ីមែលរបស់អ្នកដើម្បីទទួលបានការជូនដំណឹង។' : 'Please provide your email address.'
      )
      return
    }

    setIsSubmittingAlert(true)
    try {
      const existingAlerts = JSON.parse(localStorage.getItem('cambodia_job_alerts') || '[]')
      const newAlert = {
        id: Date.now(),
        email: alertEmail,
        keyword: q || 'All Vacancies',
        category: category || 'All Categories',
        province: province || 'All Locations',
        frequency: alertFrequency,
        created_at: new Date().toISOString(),
      }
      localStorage.setItem('cambodia_job_alerts', JSON.stringify([newAlert, ...existingAlerts]))

      toast.success(
        isKhmer ? 'បានបង្កើតការជូនដំណឹងការងារជោគជ័យ' : 'Job Alert Created',
        isKhmer
          ? `ការងារថ្មីៗនឹងត្រូវផ្ញើជូនដំណឹងទៅកាន់ ${alertEmail} (${alertFrequency === 'daily' ? 'រៀងរាល់ថ្ងៃ' : 'រៀងរាល់សប្តាហ៍'})`
          : `We will notify ${alertEmail} when new matching vacancies are posted!`
      )
      setIsJobAlertOpen(false)
    } catch (err) {
      toast.error(isKhmer ? 'បរាជ័យ' : 'Failed to create job alert')
    } finally {
      setIsSubmittingAlert(false)
    }
  }

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== page) {
      setPage(newPage)
      window.scrollTo({ top: 120, behavior: 'smooth' })
    }
  }

  const handleToggleSave = async (job: Job, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!user) {
      toast.info(
        isKhmer ? 'សូមចូលប្រើប្រាស់ជាមុន' : 'Sign in required',
        isKhmer ? 'សូមចូលគណនីដើម្បីរក្សាទុកការងារនេះ' : 'Please sign in to bookmark this job vacancy'
      )
      navigate('/login', { state: { from: location } })
      return
    }
    if (!user.roles.includes('job_seeker')) {
      toast.info(
        isKhmer ? 'សម្រាប់តែបេក្ខជនស្វែងរកការងារ' : 'Job Seekers Only',
        isKhmer
          ? 'មានតែគណនីបេក្ខជនប៉ុណ្ណោះដែលអាចរក្សាទុកការងារបាន។'
          : 'Only job seeker accounts can save and bookmark vacancies.'
      )
      return
    }
    const isCurrentlySaved = !!job.is_saved
    setJobs((prev) =>
      prev.map((j) => (j.id === job.id ? { ...j, is_saved: !isCurrentlySaved } : j))
    )
    try {
      const updated = await jobsService.toggleSaveJob(job.id, isCurrentlySaved)
      setJobs((prev) =>
        prev.map((j) => (j.id === job.id ? { ...j, is_saved: updated } : j))
      )
      if (updated) {
        toast.success(
          isKhmer ? 'បានរក្សាទុកការងារ!' : 'Job Saved!',
          isKhmer && job.title_km ? job.title_km : job.title
        )
      } else {
        toast.info(
          isKhmer ? 'បានដកការរក្សាទុក' : 'Bookmark Removed',
          isKhmer && job.title_km ? job.title_km : job.title
        )
      }
    } catch (err) {
      console.error('Failed to toggle save:', err)
      setJobs((prev) =>
        prev.map((j) => (j.id === job.id ? { ...j, is_saved: isCurrentlySaved } : j))
      )
      toast.error(
        isKhmer ? 'មានបញ្ហាក្នុងការរក្សាទុក' : 'Save failed',
        isKhmer ? 'សូមព្យាយាមម្តងទៀត' : 'Please try again later'
      )
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 font-sans space-y-6">
      {/* 1. Header Section: Title on Left, Button Filter & Header Controls on Right */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {t('jobs.title')}
          </h1>
        </div>

        {/* Right of Title Page: Button Filter (More Filters) + Actions + Count */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Button Filter (More Filters toggle) */}
          <button
            type="button"
            onClick={() => setIsMoreFiltersOpen(!isMoreFiltersOpen)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer border ${isMoreFiltersOpen || extraFiltersCount > 0
              ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-xs'
              : 'bg-white text-slate-700 border-slate-200/90 hover:bg-slate-50 shadow-2xs'
              }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" />
            <span>{isKhmer ? 'តម្រងបន្ថែម' : 'More Filters'}</span>
            {extraFiltersCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] font-black flex items-center justify-center">
                {extraFiltersCount}
              </span>
            )}
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform duration-200 ${isMoreFiltersOpen ? 'rotate-180 text-blue-600' : 'text-slate-400'
                }`}
            />
          </button>

          {/* View Mode Toggle: List Table vs Grid */}
          <div className="flex items-center p-0.5 bg-white rounded-xl border border-slate-200/90 shadow-2xs">
            <button
              type="button"
              onClick={() => {
                setViewMode('table')
                localStorage.setItem('jobs_view_mode', 'table')
              }}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${viewMode === 'table'
                ? 'bg-blue-600 text-white shadow-xs font-bold'
                : 'text-slate-400 hover:text-slate-700'
                }`}
              title={isKhmer ? 'ទិដ្ឋភាពតារាង' : 'List Table View'}
              aria-label="Table view"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                setViewMode('grid')
                localStorage.setItem('jobs_view_mode', 'grid')
              }}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${viewMode === 'grid'
                ? 'bg-blue-600 text-white shadow-xs font-bold'
                : 'text-slate-400 hover:text-slate-700'
                }`}
              title={isKhmer ? 'ទិដ្ឋភាពក្រឡា' : 'Grid Cards View'}
              aria-label="Grid view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>

          {/* Sort Selector */}
          <div className="w-32 sm:w-36 shrink-0 relative focus-within:z-40">
            <Select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              size="sm"
              variant="light"
              align="right"
            >
              <option value="newest">{isKhmer ? 'ថ្មីបំផុត' : 'Newest'}</option>
              <option value="highest_salary">{isKhmer ? 'ប្រាក់បៀវត្សខ្ពស់' : 'Highest Salary'}</option>
              <option value="lowest_salary">{isKhmer ? 'ប្រាក់បៀវត្សទាប' : 'Lowest Salary'}</option>
            </Select>
          </div>

          {/* Reset All Filters Button */}
          {(q || province || category || employmentType || workplaceType || experienceLevel) && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-xs font-bold text-slate-500 hover:text-red-600 flex items-center px-2.5 py-1.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs hover:bg-red-50 hover:border-red-200 transition cursor-pointer"
              title={isKhmer ? 'កំណត់ឡើងវិញ' : 'Reset All'}
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              <span>{isKhmer ? 'កំណត់ឡើងវិញ' : 'Reset'}</span>
            </button>
          )}

          {/* Total Opportunities Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100/90 text-xs font-semibold text-slate-600 shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>
              {isKhmer ? 'មានការងារសរុប' : 'Total Opportunities:'}{' '}
              <strong className="text-slate-900 font-extrabold">{totalCount}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* 2. Search & Filters Bar (Bottom of Title) */}
      <div className="w-full">
        <form onSubmit={handleApplyFilters} className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 lg:gap-4">
          {/* Left: Compact, Well-Proportioned Search Input + Search Button */}
          <div className="flex items-center gap-2 w-full lg:w-auto">
            <div className="relative flex items-center w-full sm:w-72 md:w-80 lg:w-96">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
              <input
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={
                  isKhmer
                    ? 'ស្វែងរកតាមចំណងជើងការងារ ក្រុមហ៊ុន ឬជំនាញ...'
                    : 'Search by job title, company, or skills...'
                }
                className="w-full pl-10 pr-9 py-2 text-xs sm:text-sm text-slate-800 placeholder-slate-400 font-medium outline-none bg-white border border-slate-200 rounded-xl min-h-[38px] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 shadow-2xs transition-all"
              />
              {q && (
                <button
                  type="button"
                  onClick={() => setQ('')}
                  className="absolute right-3 text-slate-400 hover:text-slate-600 p-0.5 transition cursor-pointer"
                  title={isKhmer ? 'សម្អាត' : 'Clear'}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Search Button (Beside Input on the Left) */}
            <button
              type="submit"
              className="px-4.5 py-2 min-h-[38px] bg-blue-600 hover:bg-blue-700 active:scale-98 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs shadow-blue-600/20 transition-all shrink-0 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Search className="w-4 h-4" />
              <span>{isKhmer ? 'ស្វែងរក' : 'Search'}</span>
            </button>
          </div>

          {/* Right: Two Filter Dropdowns (Location & Category) */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
            {/* Location / Province Select */}
            <div className="w-full sm:w-44 lg:w-48 shrink-0 relative focus-within:z-50">
              <Select
                value={province}
                onChange={(e) => {
                  setProvince(e.target.value)
                  setPage(1)
                }}
                placeholder={t('home.allLocations')}
                searchPlaceholder={isKhmer ? 'ស្វែងរកខេត្ត/រាជធានី...' : 'Search locations...'}
                noResultsText={isKhmer ? 'រកមិនឃើញខេត្ត/រាជធានី' : 'No matching locations'}
                searchable={true}
                leftIcon={<MapPin className="w-4 h-4 text-slate-400" />}
                size="sm"
                variant="light"
              >
                <option value="">{t('home.allLocations')}</option>
                {provinces
                  .filter((p) => (p.jobs_count ?? 0) > 0)
                  .map((p) => (
                    <option key={p.province_en} value={p.province_en}>
                      {isKhmer ? p.province_km : p.province_en}
                    </option>
                  ))}
              </Select>
            </div>

            {/* Category Select */}
            <div className="w-full sm:w-44 lg:w-48 shrink-0 relative focus-within:z-50">
              <Select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value)
                  setPage(1)
                }}
                placeholder={t('home.allCategories')}
                searchPlaceholder={isKhmer ? 'ស្វែងរកផ្នែកការងារ...' : 'Search categories...'}
                noResultsText={isKhmer ? 'រកមិនឃើញផ្នែកការងារ' : 'No matching categories'}
                searchable={true}
                leftIcon={<Briefcase className="w-4 h-4 text-slate-400" />}
                size="sm"
                variant="light"
              >
                <option value="">{t('home.allCategories')}</option>
                {categories
                  .filter((c) => (c.jobs_count ?? 0) > 0)
                  .map((c) => (
                    <option key={c.id} value={c.id.toString()}>
                      {isKhmer ? c.name_km : c.name_en}
                    </option>
                  ))}
              </Select>
            </div>
          </div>
        </form>
      </div>

      {/* 3. Collapsible More Filters Panel (Opens below search & badge filters) */}

      {/* Collapsible More Filters Panel */}
      {isMoreFiltersOpen && (
        <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-sm space-y-3.5 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Workplace Type */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <span className="text-xs font-bold text-slate-500 w-32 shrink-0">
              {isKhmer ? 'កន្លែងធ្វើការ:' : 'Workplace:'}
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: '', label: isKhmer ? 'ទាំងអស់' : 'All' },
                { id: 'on_site', label: isKhmer ? 'នៅកន្លែងធ្វើការ' : 'On-site' },
                { id: 'hybrid', label: isKhmer ? 'កូនកាត់' : 'Hybrid' },
                { id: 'remote', label: isKhmer ? 'ពីចម្ងាយ' : 'Remote' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setWorkplaceType(item.id)
                    setPage(1)
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${workplaceType === item.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Experience Level */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-2.5 border-t border-slate-100">
            <span className="text-xs font-bold text-slate-500 w-32 shrink-0">
              {isKhmer ? 'កម្រិតបទពិសោធន៍:' : 'Experience Level:'}
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: '', label: isKhmer ? 'ទាំងអស់' : 'All' },
                { id: 'fresh_graduate', label: isKhmer ? 'និស្សិតទើបចប់' : 'Fresh Grad' },
                { id: 'entry', label: isKhmer ? 'កម្រិតដំបូង' : 'Entry Level' },
                { id: 'mid', label: isKhmer ? 'កម្រិតមធ្យម' : 'Mid Level' },
                { id: 'senior', label: isKhmer ? 'កម្រិតខ្ពស់' : 'Senior Level' },
                { id: 'lead', label: isKhmer ? 'អ្នកដឹកនាំ' : 'Lead / Director' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setExperienceLevel(item.id)
                    setPage(1)
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${experienceLevel === item.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Other Employment Types */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-2.5 border-t border-slate-100">
            <span className="text-xs font-bold text-slate-500 w-32 shrink-0">
              {isKhmer ? 'ប្រភេទផ្សេងទៀត:' : 'Other Types:'}
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: 'part_time', label: isKhmer ? 'ក្រៅម៉ោង' : 'Part-time' },
                { id: 'contract', label: isKhmer ? 'កិច្ចសន្យា' : 'Contract' },
                { id: 'freelance', label: isKhmer ? 'ឯករាជ្យ' : 'Freelance' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setEmploymentType(employmentType === item.id ? '' : item.id)
                    setPage(1)
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${employmentType === item.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. Jobs List / 4-Column Grid View */}
      {isLoading ? (
        viewMode === 'table' ? (
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/90 text-slate-500 uppercase tracking-wider font-bold text-[10px]">
                    <th className="py-3.5 px-4 sm:px-5 min-w-[260px] sm:min-w-[320px]">
                      {isKhmer ? 'ការងារ & ក្រុមហ៊ុន' : 'Job Vacancy & Company'}
                    </th>
                    <th className="py-3.5 px-4 min-w-[140px]">
                      {isKhmer ? 'ផ្នែកការងារ' : 'Category'}
                    </th>
                    <th className="py-3.5 px-4 min-w-[140px]">
                      {isKhmer ? 'លក្ខខណ្ឌការងារ' : 'Work Type'}
                    </th>
                    <th className="py-3.5 px-4 min-w-[120px]">
                      {isKhmer ? 'ទីតាំង' : 'Location'}
                    </th>
                    <th className="py-3.5 px-4 min-w-[130px]">
                      {isKhmer ? 'ប្រាក់បៀវត្ស' : 'Salary Range'}
                    </th>
                    <th className="py-3.5 px-4 min-w-[100px]">
                      {isKhmer ? 'កាលបរិច្ឆេទ' : 'Published'}
                    </th>
                    <th className="py-3.5 px-4 sm:px-5 min-w-[130px] text-right">
                      {isKhmer ? 'សកម្មភាព' : 'Action'}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                    <tr key={n} className="animate-pulse">
                      <td className="py-3.5 px-4 sm:px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-xl bg-slate-200 shrink-0" />
                          <div className="space-y-1.5 flex-1">
                            <div className="h-4 bg-slate-200 rounded w-44" />
                            <div className="h-3 bg-slate-100 rounded w-28" />
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="h-6 bg-slate-100 rounded-lg w-24" />
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <div className="h-4 bg-slate-100 rounded w-16" />
                          <div className="h-4 bg-slate-100 rounded w-14" />
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="h-4 bg-slate-100 rounded w-20" />
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="h-4 bg-slate-200 rounded w-24" />
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="h-4 bg-slate-100 rounded w-16" />
                      </td>
                      <td className="py-3.5 px-4 sm:px-5 text-right">
                        <div className="h-8 bg-slate-100 rounded-xl w-24 ml-auto" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div
                key={n}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden animate-pulse flex flex-col justify-between"
              >
                <div>
                  <div className="w-full aspect-[16/9] bg-slate-200" />
                  <div className="p-4 space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-slate-300 shrink-0" />
                      <div className="space-y-1.5 flex-1">
                        <div className="h-4 bg-slate-200 rounded-md w-3/4" />
                        <div className="h-3 bg-slate-100 rounded-md w-1/2" />
                      </div>
                    </div>
                    <div className="h-3 bg-slate-100 rounded-md w-full" />
                  </div>
                </div>
                <div className="p-4 pt-0">
                  <div className="h-9 bg-slate-100 rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        )
      ) : jobs.length === 0 ? (
        /* Empty State */
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200 p-8 max-w-lg mx-auto">
          <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900 mb-1">
            {t('jobs.noJobsFound')}
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            {isKhmer
              ? 'សូមសាកល្បងផ្លាស់ប្តូរតម្រង ឬស្វែងរកពាក្យគន្លឹះផ្សេងទៀត។'
              : 'Try loosening your filters or searching for different keywords.'}
          </p>
          <button
            onClick={handleResetFilters}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition shadow-sm cursor-pointer"
          >
            {t('jobs.clearFilters')}
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* 4-Column Card Grid (Full-width 4 cards per row on desktop) */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="group bg-white rounded-2xl border border-slate-200/90 hover:border-blue-500/80 hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-1 transition-all duration-200 overflow-hidden flex flex-col justify-between"
            >
              <div>
                {/* 1. Compact Thumbnail Banner */}
                <div className="relative w-full h-24 sm:h-28 bg-slate-100 shrink-0">
                  <div className="w-full h-full overflow-hidden relative">
                    <Link to={`/jobs/${job.slug}`} className="block w-full h-full">
                      <img
                        src={
                          getAssetUrl(job.company_banner) ||
                          `https://images.unsplash.com/photo-${[
                            '1497366216548-37526070297c',
                            '1497215728101-856f4ea42174',
                            '1486406146926-c627a92ad1ab',
                            '1522071820081-009f0129c71c',
                            '1557804506-669a67965ba0',
                            '1504384308090-c894fdcc538d',
                          ][job.id % 6]
                          }?w=600&h=340&fit=crop`
                        }
                        alt={job.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/15 to-slate-950/20" />
                    </Link>
                  </div>

                  {/* Floating Top-Left: Location */}
                  <div className="absolute top-2 left-2 z-10 pointer-events-none">
                    <span className="inline-flex items-center text-[9px] font-bold text-white bg-slate-900/70 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/20 shadow-xs">
                      <MapPin className="w-2.5 h-2.5 mr-0.5 text-blue-400 shrink-0" />
                      {job.province || 'Phnom Penh'}
                    </span>
                  </div>

                  {/* Floating Top-Right: Bookmark Button (Job Seekers & Guests only) */}
                  {(!user || user.roles.includes('job_seeker')) && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handleToggleSave(job, e)
                      }}
                      className={`absolute top-2 right-2 z-10 w-7 h-7 rounded-full flex items-center justify-center transition backdrop-blur-md border shadow-xs cursor-pointer ${job.is_saved
                        ? 'bg-blue-600 text-white border-blue-500'
                        : 'bg-slate-900/60 hover:bg-slate-900/90 text-white border-white/25'
                        }`}
                      title={
                        job.is_saved
                          ? isKhmer
                            ? 'ដកការរក្សាទុក'
                            : 'Remove bookmark'
                          : isKhmer
                            ? 'រក្សាទុកការងារ'
                            : 'Save job'
                      }
                    >
                      <Bookmark
                        className={`w-3 h-3 ${job.is_saved ? 'fill-white stroke-white' : ''
                          }`}
                      />
                    </button>
                  )}

                  {/* Overlapping Company Logo Avatar Badge (z-index above white background) */}
                  <div className="absolute -bottom-3 left-3 z-20">
                    <div className="w-9 h-9 rounded-full bg-white p-0.5 shadow-md ring-2 ring-white overflow-hidden flex items-center justify-center">
                      <img
                        src={
                          getAssetUrl(job.company_logo) ||
                          'https://images.unsplash.com/photo-1541746972996-4e0b0f43e02a?w=120&h=120&fit=crop'
                        }
                        alt={job.company_name}
                        className="w-full h-full object-cover rounded-full"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Content Body (Compact & relative z-10) */}
                <div className="p-3 pt-4 relative z-10 bg-white">
                  <div>
                    {/* Company Name & Location row */}
                    <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                      <span className="font-bold text-slate-700 truncate group-hover:text-blue-600 transition-colors pr-2">
                        {job.company_name}
                      </span>
                      <span className="inline-block text-[10px] font-black text-emerald-600 shrink-0">
                        {formatSalaryRange(
                          job.salary_min,
                          job.salary_max,
                          job.salary_currency,
                          job.is_salary_negotiable,
                          t('jobs.negotiable')
                        )}
                      </span>
                    </div>

                    {/* Title */}
                    <Link to={`/jobs/${job.slug}`} className="block">
                      <h2 className="text-[13px] sm:text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate leading-tight tracking-tight">
                        {isKhmer && job.title_km ? job.title_km : job.title}
                      </h2>
                    </Link>

                    {/* Job Description Snippet (Compact 1 line) */}
                    {job.description && (
                      <p className="text-[11px] text-slate-500 line-clamp-1 mt-1 leading-snug font-normal">
                        {job.description.replace(/<[^>]*>?/gm, '')}
                      </p>
                    )}

                    {/* Workplace and Experience Badges (rounded-full) */}
                    <div className="flex flex-wrap items-center gap-1 mt-2 pt-2 border-t border-slate-100">
                      <span className="px-2.5 py-0.5 rounded-full text-[9px] font-semibold bg-blue-50/80 text-blue-700 border border-blue-200/50">
                        {getEmploymentLabel(job.employment_type)}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[9px] font-semibold bg-purple-50 text-purple-700 border border-purple-100">
                        {getWorkplaceLabel(job.workplace_type)}
                      </span>

                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Action Buttons: View & Apply (rounded-full) */}
              <div className="p-3 pt-0 flex items-center gap-1.5">
                <Link
                  to={`/jobs/${job.slug}`}
                  className="flex-1 py-1.5 px-3 rounded-full border border-slate-200 hover:border-slate-300 bg-slate-50/90 hover:bg-slate-100 text-slate-700 font-bold text-[11px] flex items-center justify-center gap-1 transition-all text-center cursor-pointer shadow-2xs"
                >
                  <Eye className="w-3 h-3 text-slate-500" />
                  <span>{isKhmer ? 'មើលលម្អិត' : 'View'}</span>
                </Link>

                <Link
                  to={`/jobs/${job.slug}`}
                  className="flex-1 py-1.5 px-3 rounded-full bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-bold text-[11px] flex items-center justify-center gap-1 shadow-sm shadow-blue-600/20 hover:shadow-md transition-all text-center cursor-pointer"
                >
                  <span>{isKhmer ? 'ដាក់ពាក្យ' : 'Apply'}</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List Table View */
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/90 text-slate-500 uppercase tracking-wider font-bold text-[10px]">
                  <th className="py-3.5 px-4 sm:px-5 min-w-[260px] sm:min-w-[320px]">
                    {isKhmer ? 'ការងារ & ក្រុមហ៊ុន' : 'Job Vacancy & Company'}
                  </th>
                  <th className="py-3.5 px-4 min-w-[140px]">
                    {isKhmer ? 'ផ្នែកការងារ' : 'Category'}
                  </th>
                  <th className="py-3.5 px-4 min-w-[140px]">
                    {isKhmer ? 'លក្ខខណ្ឌការងារ' : 'Work Type'}
                  </th>
                  <th className="py-3.5 px-4 min-w-[130px]">
                    {isKhmer ? 'ទីតាំង' : 'Location'}
                  </th>
                  <th className="py-3.5 px-4 min-w-[140px]">
                    {isKhmer ? 'ប្រាក់បៀវត្ស' : 'Salary Range'}
                  </th>
                  <th className="py-3.5 px-4 min-w-[110px]">
                    {isKhmer ? 'កាលបរិច្ឆេទ' : 'Published'}
                  </th>
                  <th className="py-3.5 px-4 sm:px-5 min-w-[140px] text-right">
                    {isKhmer ? 'សកម្មភាព' : 'Action'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-sans">
                {jobs.map((job) => (
                  <tr
                    key={job.id}
                    onClick={() => navigate(`/jobs/${job.slug}`)}
                    className="hover:bg-blue-50/40 transition-colors group cursor-pointer"
                  >
                    {/* 1. Job Vacancy & Company */}
                    <td className="py-3.5 px-4 sm:px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-white border border-slate-200 p-1 shadow-2xs shrink-0 flex items-center justify-center overflow-hidden">
                          <img
                            src={
                              getAssetUrl(job.company_logo) ||
                              'https://images.unsplash.com/photo-1541746972996-4e0b0f43e02a?w=120&h=120&fit=crop'
                            }
                            alt={job.company_name}
                            className="w-full h-full object-contain rounded-lg"
                          />
                        </div>
                        <div className="min-w-0 max-w-[280px] sm:max-w-[340px]">
                          <Link
                            to={`/jobs/${job.slug}`}
                            onClick={(e) => e.stopPropagation()}
                            className="font-bold text-sm text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1 leading-snug tracking-tight block"
                          >
                            {isKhmer && job.title_km ? job.title_km : job.title}
                          </Link>
                          <div className="flex items-center gap-1.5 mt-0.5 text-slate-500 text-xs">
                            <span className="font-medium text-slate-600 truncate max-w-[200px]">
                              {job.company_name}
                            </span>
                            {job.company_verification === 'verified' && (
                              <FacebookVerifiedBadge className="w-3.5 h-3.5 shrink-0" title={isKhmer ? 'ក្រុមហ៊ុនបានផ្ទៀងផ្ទាត់' : 'Verified Company'} />
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* 2. Category */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200/60 max-w-[160px] truncate">
                        {(isKhmer && job.category_name_km ? job.category_name_km : job.category_name_en) ||
                          (isKhmer ? 'ទូទៅ' : 'General')}
                      </span>
                    </td>

                    {/* 3. Work Type */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1 items-start">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200/60">
                          {getEmploymentLabel(job.employment_type)}
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200/60">
                          {getWorkplaceLabel(job.workplace_type)}
                        </span>
                      </div>
                    </td>

                    {/* 4. Location */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center text-xs font-medium text-slate-600">
                        <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[130px]">
                          {job.province || 'Phnom Penh'}
                        </span>
                      </div>
                    </td>

                    {/* 5. Salary Range */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {formatSalaryRange(
                          job.salary_min,
                          job.salary_max,
                          job.salary_currency,
                          job.is_salary_negotiable,
                          t('jobs.negotiable')
                        )}
                      </div>
                      {job.is_salary_negotiable && (
                        <span className="text-[10px] text-slate-400 font-medium block">
                          {isKhmer ? 'អាចចរចាបាន' : 'Negotiable'}
                        </span>
                      )}
                    </td>

                    {/* 6. Published */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center text-xs text-slate-500 font-medium">
                        <Clock className="w-3.5 h-3.5 mr-1 text-slate-400 shrink-0" />
                        <span>{formatJobDate(job.published_at || job.created_at)}</span>
                      </div>
                    </td>

                    {/* 7. Action */}
                    <td className="py-3.5 px-4 sm:px-5 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                        {(!user || user.roles.includes('job_seeker')) && (
                          <button
                            type="button"
                            onClick={(e) => handleToggleSave(job, e)}
                            className={`p-1.5 rounded-lg flex items-center justify-center transition border cursor-pointer ${job.is_saved
                              ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                              : 'bg-white text-slate-400 hover:text-blue-600 hover:bg-blue-50 border-slate-200 shadow-2xs'
                              }`}
                            title={
                              job.is_saved
                                ? isKhmer
                                  ? 'ដកការរក្សាទុក'
                                  : 'Remove bookmark'
                                : isKhmer
                                  ? 'រក្សាទុកការងារ'
                                  : 'Save job'
                            }
                          >
                            <Bookmark
                              className={`w-3.5 h-3.5 ${job.is_saved ? 'fill-white stroke-white' : ''
                                }`}
                            />
                          </button>
                        )}

                        <Link
                          to={`/jobs/${job.slug}`}
                          className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs hover:shadow transition-all"
                        >
                          <span>{isKhmer ? 'ដាក់ពាក្យ' : 'Apply'}</span>
                          <ArrowRight className="w-3 h-3 ml-1" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. Pagination Controls (Transparent background, no shadow, matching dashboard UI) */}
      {totalCount > 0 && (
        <TablePagination
          currentPage={page}
          pageSize={pageSize}
          totalItems={totalCount}
          pageSizeOptions={[25, 50, 100]}
          onPageChange={handlePageChange}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize)
            setPage(1)
            window.scrollTo({ top: 120, behavior: 'smooth' })
          }}
          transparent
        />
      )}

      {/* Job Alert Subscription Modal */}
      {isJobAlertOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 text-slate-900 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 border border-gray-200 text-blue-600 flex items-center justify-center">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                    {isKhmer ? 'បង្កើតការជូនដំណឹងការងារ' : 'Create Job Alert'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {isKhmer ? 'ទទួលបានឱកាសការងារថ្មីៗតាមអ៊ីមែល' : 'Receive matching vacancies in your inbox'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsJobAlertOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateJobAlert} className="space-y-3.5">
              {/* Active criteria snapshot */}
              <div className="p-3 bg-slate-50 rounded-xl border border-gray-100 space-y-1.5 text-xs text-slate-600">
                <span className="font-semibold text-slate-700 block text-[11px]">
                  {isKhmer ? 'លក្ខខណ្ឌការងារដែលបានជ្រើសរើស:' : 'Active Filter Criteria:'}
                </span>
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  <span className="px-2 py-0.5 rounded-md bg-white border border-gray-200 text-[11px]">
                    {q ? `Keyword: "${q}"` : (isKhmer ? 'ការងារទាំងអស់' : 'All Roles')}
                  </span>
                  {category && (
                    <span className="px-2 py-0.5 rounded-md bg-white border border-gray-200 text-[11px]">
                      {category}
                    </span>
                  )}
                  {province && (
                    <span className="px-2 py-0.5 rounded-md bg-white border border-gray-200 text-[11px]">
                      {province}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isKhmer ? 'អាសយដ្ឋានអ៊ីមែលរបស់អ្នក *' : 'Email Address *'}
                </label>
                <input
                  type="email"
                  required
                  value={alertEmail}
                  onChange={(e) => setAlertEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full text-xs p-2.5 bg-white border border-gray-200 rounded-xl text-slate-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isKhmer ? 'ភាពញឹកញាប់នៃការជូនដំណឹង' : 'Notification Frequency'}
                </label>
                <select
                  value={alertFrequency}
                  onChange={(e) => setAlertFrequency(e.target.value)}
                  className="w-full text-xs p-2.5 bg-white border border-gray-200 rounded-xl text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition shadow-2xs"
                >
                  <option value="daily">{isKhmer ? 'រៀងរាល់ថ្ងៃ' : 'Daily digest'}</option>
                  <option value="weekly">{isKhmer ? 'រៀងរាល់សប្តាហ៍' : 'Weekly digest'}</option>
                </select>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsJobAlertOpen(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-gray-200 transition cursor-pointer"
                >
                  {isKhmer ? 'បោះបង់' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAlert}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-2xs cursor-pointer transition disabled:opacity-50 flex items-center space-x-1.5"
                >
                  <Bell className="w-3.5 h-3.5" />
                  <span>{isKhmer ? 'ជាវការជូនដំណឹង' : 'Subscribe Alert'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
