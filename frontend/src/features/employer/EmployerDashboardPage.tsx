import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { employerService } from '../../services/employer.service'
import { companiesService } from '../../services/companies.service'
import { Job, Company } from '../../types'
import { formatSalaryRange } from '../../utils/currency'
import { DashboardNotificationAlert } from '../../components/layout/DashboardNotificationAlert'
import {
  Briefcase,
  Users,
  Building,
  PlusCircle,
  ShieldCheck,
  Clock,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  MapPin,
  ExternalLink,
  ShieldAlert,
  Search,
  Plus,
  RefreshCw,
  X,
  TrendingUp,
} from 'lucide-react'

export const EmployerDashboardPage: React.FC = () => {
  const { i18n } = useTranslation()
  const isKhmer = i18n.language === 'km'

  const [jobs, setJobs] = useState<Job[]>([])
  const [company, setCompany] = useState<Company | null>(null)
  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'draft' | 'closed'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchDashboardData = async (quiet = false) => {
    if (!quiet) setIsLoading(true)
    else setIsRefreshing(true)
    try {
      const [jobsData, comp] = await Promise.all([
        employerService.getEmployerJobs(),
        companiesService.getEmployerCompany(),
      ])
      setJobs(jobsData || [])
      setCompany(comp)
    } catch (err) {
      console.error('Failed to load employer dashboard:', err)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const activeJobsCount = jobs.filter((j) => j.status === 'published').length
  const draftJobsCount = jobs.filter((j) => j.status === 'draft').length
  const closedJobsCount = jobs.filter((j) => j.status === 'closed').length
  const totalApplicationsCount = jobs.reduce((acc, j: any) => acc + (j.applications_count || 0), 0)

  const filteredJobs = jobs.filter((j) => {
    if (filterStatus !== 'all' && j.status !== filterStatus) return false
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const titleMatch = j.title?.toLowerCase().includes(q)
      const locMatch = j.province?.toLowerCase().includes(q)
      return titleMatch || locMatch
    }
    return true
  })

  const calculateCompanyStrength = () => {
    if (!company) return 30
    let score = 20
    if (company.name) score += 20
    if (company.logo_url) score += 20
    if (company.industry) score += 15
    if (company.province || company.address) score += 15
    if (company.description) score += 10
    return Math.min(score, 100)
  }

  const companyScore = calculateCompanyStrength()

  const getDynamicStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-700 border border-emerald-400/25 backdrop-blur-md shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
            <span>{isKhmer ? 'ផ្សាយផ្ទាល់' : 'Published'}</span>
          </span>
        )
      case 'closed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-700 border border-rose-400/25 backdrop-blur-md shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            <span>{isKhmer ? 'បានបិទ' : 'Closed'}</span>
          </span>
        )
      case 'draft':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100/80 text-slate-700 border border-slate-200/70 backdrop-blur-md">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            <span>{isKhmer ? 'សេចក្តីព្រាង' : 'Draft'}</span>
          </span>
        )
    }
  }

  if (isLoading) {
    return (
      <div className="py-24 text-center font-sans">
        <div className="w-9 h-9 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="mt-3.5 text-xs font-semibold text-slate-500 tracking-wide">
          {isKhmer ? 'កំពុងដំណើរការទាញយកទិន្នន័យជ្រើសរើសបុគ្គលិក...' : 'Loading recruitment overview...'}
        </p>
      </div>
    )
  }

  return (
    <div className="relative w-full space-y-4 sm:space-y-5 font-sans pb-16">
      {/* Ambient glowing mesh backdrop for glassmorphism refraction */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
        <div
          className="absolute -top-24 right-1/4 w-[480px] h-[480px] bg-gradient-to-br from-blue-200/40 via-indigo-200/25 to-transparent rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: '8s' }}
        />
        <div className="absolute top-[380px] -left-20 w-[420px] h-[420px] bg-gradient-to-tr from-sky-200/35 via-blue-100/25 to-transparent rounded-full blur-3xl" />
        <div className="absolute -bottom-20 right-10 w-[500px] h-[500px] bg-gradient-to-tl from-indigo-100/35 via-purple-100/20 to-transparent rounded-full blur-3xl" />
      </div>

      {/* 1. Glassmorphic Header Bar with Clear Glass Finish */}
      <div className="glass-header p-4 sm:p-5 rounded-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Decorative inner corner sheen */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-gradient-to-bl from-blue-400/15 via-indigo-300/10 to-transparent rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center space-x-3.5 min-w-0 relative z-10">
          <div className="w-12 h-12 rounded-2xl border border-white/90 bg-white/90 p-1.5 shrink-0 flex items-center justify-center overflow-hidden shadow-inner">
            {company?.logo_url ? (
              <img src={company.logo_url} alt={company.name} className="w-full h-full object-contain rounded-xl" />
            ) : (
              <Building className="w-6 h-6 text-blue-600" />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight truncate">
                {company?.name || (isKhmer ? 'ផ្ទាំងគ្រប់គ្រងជ្រើសរើសបុគ្គលិក' : 'Recruitment Overview')}
              </h1>
              {company?.verification_status === 'verified' ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-700 border border-emerald-400/25 backdrop-blur-md shadow-2xs shrink-0">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  <span>{isKhmer ? 'ផ្ទៀងផ្ទាត់រួច' : 'Verified'}</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-700 border border-amber-400/25 backdrop-blur-md shadow-2xs shrink-0">
                  <ShieldAlert className="w-3 h-3 text-amber-600" />
                  <span>{isKhmer ? 'រង់ចាំផ្ទៀងផ្ទាត់' : 'Pending'}</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              {isKhmer
                ? 'តាមដានការផ្សាយការងារ បេក្ខជនដាក់ពាក្យ និងដំណើរការជ្រើសរើសបុគ្គលិកជាក់ស្តែង'
                : 'Monitor job openings, candidate applicants, and real-time recruitment progress'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2.5 shrink-0 self-start md:self-auto relative z-10">
          <Link
            to="/employer/company"
            className="px-3.5 py-2 rounded-xl bg-white/80 backdrop-blur-md hover:bg-white text-slate-700 hover:text-blue-600 border border-white/80 hover:border-blue-300/60 text-xs font-semibold transition-all duration-200 shadow-2xs hover:shadow-xs flex items-center space-x-1.5 cursor-pointer"
          >
            <Building className="w-3.5 h-3.5 text-slate-400" />
            <span>{isKhmer ? 'ព័ត៌មានក្រុមហ៊ុន' : 'Company Profile'}</span>
          </Link>
          <Link
            to="/employer/jobs/new"
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:bg-gradient-to-r hover:from-blue-700 hover:to-indigo-700 active:scale-98 text-white text-xs font-semibold transition-all duration-200 shadow-md shadow-blue-500/20 flex items-center space-x-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isKhmer ? 'ផ្សាយការងារថ្មី' : 'Post Vacancy'}</span>
          </Link>
          <button
            type="button"
            onClick={() => fetchDashboardData(true)}
            disabled={isRefreshing}
            className="p-2.5 rounded-xl bg-white/80 backdrop-blur-md hover:bg-white text-slate-600 hover:text-blue-600 border border-white/80 text-xs font-medium transition-all shadow-2xs hover:shadow-xs cursor-pointer"
            title={isKhmer ? 'ផ្ទុកទិន្នន័យឡើងវិញ' : 'Refresh'}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Notification Alert Banner (if any) */}
      <DashboardNotificationAlert role="employer" />

      {/* Company Verification Status Banner (Admin confirmation authority) */}
      {company && company.verification_status !== 'verified' && (
        <div className="p-4.5 rounded-2xl bg-amber-500/10 backdrop-blur-xl border border-amber-400/30 text-amber-950 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 relative overflow-hidden">
          <div className="flex items-start space-x-3.5 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-400/30 text-amber-700 flex items-center justify-center shrink-0 shadow-inner">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-amber-900">
                {isKhmer ? 'ក្រុមហ៊ុនកំពុងរង់ចាំការអនុម័តពី Admin (Awaiting Admin Confirmation)' : 'Company Awaiting Administrator Confirmation'}
              </h3>
              <p className="text-xs text-amber-800 leading-relaxed mt-0.5 font-normal">
                {isKhmer
                  ? 'មានតែ Admin ប៉ុណ្ណោះដែលអាចបញ្ជាក់ និងអនុម័តក្រុមហ៊ុនឱ្យដំណើរការ និងផ្សាយការងារលើប្រព័ន្ធបាន។ សូមរង់ចាំការពិនិត្យពី Admin។'
                  : 'Only the Platform Administrator can confirm and approve companies to use this platform and recruit candidates. Your account is pending Admin review.'}
              </p>
            </div>
          </div>
          <Link
            to="/employer/company"
            className="px-3.5 py-1.5 rounded-xl bg-white/90 hover:bg-white border border-amber-300/80 text-xs font-semibold text-amber-900 transition shadow-2xs shrink-0 self-start sm:self-auto relative z-10"
          >
            {isKhmer ? 'ពិនិត្យប្រវត្តិក្រុមហ៊ុន' : 'Review Company Profile'}
          </Link>
        </div>
      )}

      {/* 2. Glassmorphic 4-Column Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Metric 1: Published Vacancies */}
        <div className="glass-card-hover p-4 sm:p-5 rounded-2xl relative overflow-hidden group">
          <div className="absolute -right-8 -top-8 w-24 h-24 bg-blue-400/10 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
          <div className="flex items-center justify-between relative z-10">
            <span className="text-xs font-semibold text-slate-500 group-hover:text-slate-800 transition-colors">
              {isKhmer ? 'ការងារកំពុងផ្សាយ' : 'Active Vacancies'}
            </span>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-400/20 text-blue-600 flex items-center justify-center group-hover:scale-105 group-hover:bg-blue-600 group-hover:text-white transition-all duration-200 shadow-inner">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3.5 flex items-baseline justify-between relative z-10">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors tracking-tight">
              {activeJobsCount}
            </span>
            <span className="text-[10px] font-semibold text-slate-500 bg-white/80 border border-slate-200/60 backdrop-blur-xs px-2 py-0.5 rounded-full shadow-2xs">
              {isKhmer ? 'ផ្សាយផ្ទាល់' : 'Live now'}
            </span>
          </div>
        </div>

        {/* Metric 2: Total Candidates */}
        <div className="glass-card-hover p-4 sm:p-5 rounded-2xl relative overflow-hidden group">
          <div className="absolute -right-8 -top-8 w-24 h-24 bg-indigo-400/10 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
          <div className="flex items-center justify-between relative z-10">
            <span className="text-xs font-semibold text-slate-500 group-hover:text-slate-800 transition-colors">
              {isKhmer ? 'បេក្ខជនសរុប' : 'Total Candidates'}
            </span>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-400/20 text-indigo-600 flex items-center justify-center group-hover:scale-105 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-200 shadow-inner">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3.5 flex items-baseline justify-between relative z-10">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors tracking-tight">
              {totalApplicationsCount}
            </span>
            <span className="text-[10px] font-semibold text-slate-500 bg-white/80 border border-slate-200/60 backdrop-blur-xs px-2 py-0.5 rounded-full shadow-2xs">
              {isKhmer ? 'ពាក្យសុំ' : 'Applicants'}
            </span>
          </div>
        </div>

        {/* Metric 3: Draft Positions */}
        <div className="glass-card-hover p-4 sm:p-5 rounded-2xl relative overflow-hidden group">
          <div className="absolute -right-8 -top-8 w-24 h-24 bg-amber-400/10 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
          <div className="flex items-center justify-between relative z-10">
            <span className="text-xs font-semibold text-slate-500 group-hover:text-slate-800 transition-colors">
              {isKhmer ? 'ការងារព្រាង' : 'Draft Positions'}
            </span>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-400/20 text-amber-600 flex items-center justify-center group-hover:scale-105 group-hover:bg-amber-600 group-hover:text-white transition-all duration-200 shadow-inner">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3.5 flex items-baseline justify-between relative z-10">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 group-hover:text-amber-600 transition-colors tracking-tight">
              {draftJobsCount}
            </span>
            <span className="text-[10px] font-semibold text-slate-500 bg-white/80 border border-slate-200/60 backdrop-blur-xs px-2 py-0.5 rounded-full shadow-2xs">
              {isKhmer ? 'មិនទាន់ផ្សាយ' : 'Unpublished'}
            </span>
          </div>
        </div>

        {/* Metric 4: Organization Location */}
        <div className="glass-card-hover p-4 sm:p-5 rounded-2xl relative overflow-hidden group">
          <div className="absolute -right-8 -top-8 w-24 h-24 bg-sky-400/10 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
          <div className="flex items-center justify-between relative z-10">
            <span className="text-xs font-semibold text-slate-500 group-hover:text-slate-800 transition-colors">
              {isKhmer ? 'ទីតាំងស្ថាប័ន' : 'Headquarters'}
            </span>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500/10 to-blue-500/10 border border-sky-400/20 text-sky-600 flex items-center justify-center group-hover:scale-105 group-hover:bg-sky-600 group-hover:text-white transition-all duration-200 shadow-inner">
              <MapPin className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3.5 flex items-baseline justify-between relative z-10">
            <span className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-sky-600 transition-colors tracking-tight truncate max-w-[130px]">
              {company?.province || 'Phnom Penh'}
            </span>
            <span className="text-[10px] font-semibold text-slate-500 bg-white/80 border border-slate-200/60 backdrop-blur-xs px-2 py-0.5 rounded-full shadow-2xs">
              Cambodia
            </span>
          </div>
        </div>
      </div>

      {/* 2.5 Active Recruitment Status Highlight Strip */}
      <div className="glass-card p-4 rounded-2xl border border-white/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 relative overflow-hidden">
        <div className="flex items-center space-x-3.5 min-w-0 relative z-10">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-400/25 text-blue-600 flex items-center justify-center shrink-0 shadow-inner">
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
              {isKhmer ? 'ស្ថានភាពជ្រើសរើសបុគ្គលិកសកម្ម' : 'Active Recruitment Status'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 truncate">
              {isKhmer
                ? `បច្ចុប្បន្នកំពុងផ្សាយ ${activeJobsCount} ការងារ និងទទួលបានបេក្ខជនសរុប ${totalApplicationsCount} នាក់។`
                : `Currently running ${activeJobsCount} live vacancies with ${totalApplicationsCount} candidates received.`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-start md:self-auto relative z-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-white/80 border border-white/80 shadow-2xs">
            <Briefcase className="w-3.5 h-3.5 text-blue-600" />
            <span>{activeJobsCount} {isKhmer ? 'ការងារសកម្ម' : 'Active'}</span>
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-white/80 border border-white/80 shadow-2xs">
            <Users className="w-3.5 h-3.5 text-indigo-600" />
            <span>{totalApplicationsCount} {isKhmer ? 'បេក្ខជន' : 'Candidates'}</span>
          </span>
          <Link
            to="/employer/jobs/new"
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 transition shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isKhmer ? 'បន្ថែមការងារ' : 'Post Vacancy'}</span>
          </Link>
        </div>
      </div>

      {/* 3. Main 2-Column Split: Clean, Compact, Blue & Slate */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 items-start">
        {/* Left Column (2/3): Job Openings & Candidate Pipeline */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-5">
          <div className="glass-card rounded-2xl border border-white/90 shadow-sm overflow-hidden">
            {/* Header + Tabs */}
            <div className="p-4 sm:p-5 border-b border-slate-200/60 bg-white/50 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xs sm:text-sm font-bold text-slate-800">
                  {isKhmer ? 'ការងារដែលបានផ្សាយ និងបេក្ខជន' : 'Job Openings & Candidate Pipeline'}
                </h2>
                <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
                  {isKhmer ? 'គ្រប់គ្រងការផ្សាយការងារ និងពិនិត្យបេក្ខជនដាក់ពាក្យ' : 'Review candidate applications and manage live vacancies'}
                </p>
              </div>

              {/* Status Filter Tabs with Frosted Glass styling */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                {[
                  { id: 'all', label: isKhmer ? 'ទាំងអស់' : 'All', count: jobs.length },
                  { id: 'published', label: isKhmer ? 'ផ្សាយផ្ទាល់' : 'Active', count: activeJobsCount },
                  { id: 'draft', label: isKhmer ? 'សេចក្តីព្រាង' : 'Draft', count: draftJobsCount },
                  { id: 'closed', label: isKhmer ? 'បានបិទ' : 'Closed', count: closedJobsCount },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setFilterStatus(tab.id as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition shrink-0 cursor-pointer ${
                      filterStatus === tab.id
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white/70 hover:bg-white text-slate-600 hover:text-slate-900 border border-white/80 shadow-2xs'
                    }`}
                  >
                    {tab.label} ({tab.count})
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Search within Employer Jobs */}
            <div className="px-4 sm:px-5 py-2.5 bg-slate-50/50 backdrop-blur-xs border-b border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="relative flex-1 max-w-md">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={isKhmer ? 'ស្វែងរកតាមចំណងជើងការងារ ឬទីតាំង...' : 'Search by job title or location...'}
                  className="w-full pl-9 pr-7 py-1.5 bg-white/80 backdrop-blur-md border border-white/90 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition shadow-2xs"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <span className="text-xs font-medium text-slate-500 shrink-0">
                {isKhmer ? `បង្ហាញ ${filteredJobs.length} ការងារ` : `Showing ${filteredJobs.length} vacancies`}
              </span>
            </div>

            {/* Jobs List Content */}
            {filteredJobs.length === 0 ? (
              <div className="text-center py-14 px-4 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-400/20 text-blue-600 flex items-center justify-center mx-auto shadow-inner">
                  <Briefcase className="w-6 h-6" />
                </div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                  {isKhmer ? 'មិនមានការងារក្នុងបញ្ជីនេះទេ' : 'No job vacancies found in this view'}
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {isKhmer ? 'បង្កើតការងារថ្មី ដើម្បីទាក់ទាញបេក្ខជនមានសមត្ថភាព។' : 'Post a job opening to start receiving candidate applications.'}
                </p>
                <Link
                  to="/employer/jobs/new"
                  className="inline-flex items-center px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold mt-1 hover:bg-blue-700 transition shadow-xs gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isKhmer ? 'ផ្សាយការងារថ្មី' : 'Post Vacancy'}</span>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/70 border-b border-slate-200/60 text-[11px] font-bold text-slate-500 uppercase tracking-wider backdrop-blur-xs">
                      <th className="py-3 px-4">{isKhmer ? 'តំណែងការងារ' : 'Job Vacancy'}</th>
                      <th className="py-3 px-4 hidden md:table-cell">{isKhmer ? 'ទីតាំង' : 'Location'}</th>
                      <th className="py-3 px-4 hidden sm:table-cell">{isKhmer ? 'បៀវត្សរ៍' : 'Salary'}</th>
                      <th className="py-3 px-4">{isKhmer ? 'ស្ថានភាព' : 'Status'}</th>
                      <th className="py-3 px-4 text-center">{isKhmer ? 'បេក្ខជន' : 'Applicants'}</th>
                      <th className="py-3 px-4 text-right">{isKhmer ? 'សកម្មភាព' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredJobs.slice(0, 5).map((job: any) => (
                      <tr key={job.id} className="hover:bg-blue-50/40 transition-colors group">
                        <td className="py-3 px-4">
                          <div className="space-y-0.5">
                            <Link
                              to={`/employer/jobs/${job.id}/applications`}
                              className="font-bold text-slate-900 group-hover:text-blue-600 transition block max-w-xs truncate"
                            >
                              {job.title}
                            </Link>
                            <span className="text-[11px] text-slate-400 capitalize">
                              {job.employment_type?.replace('_', ' ')}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 hidden md:table-cell text-slate-600">
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            {job.province}
                          </span>
                        </td>
                        <td className="py-3 px-4 hidden sm:table-cell">
                          <span className="text-blue-600 font-semibold bg-blue-50/80 px-2 py-0.5 rounded-md border border-blue-200/60 text-[11px]">
                            {formatSalaryRange(job.salary_min, job.salary_max, job.salary_currency, job.is_salary_negotiable)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {getDynamicStatusBadge(job.status)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Link
                            to={`/employer/jobs/${job.id}/applications`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-700 border border-blue-400/25 font-bold transition shadow-2xs backdrop-blur-xs"
                          >
                            <Users className="w-3.5 h-3.5 text-blue-600" />
                            <span>{job.applications_count || 0}</span>
                          </Link>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            <Link
                              to={`/employer/jobs/${job.id}/applications`}
                              className="px-2.5 py-1 rounded-lg bg-white/80 hover:bg-blue-600 hover:text-white text-slate-700 border border-slate-200/70 text-[11px] font-semibold transition-all shadow-2xs"
                            >
                              {isKhmer ? 'ពិនិត្យបេក្ខជន' : 'Review'}
                            </Link>
                            <Link
                              to={`/jobs/${job.slug}`}
                              target="_blank"
                              className="p-1 text-slate-400 hover:text-blue-600 hover:bg-white border border-slate-200/70 rounded-lg transition shadow-2xs"
                              title={isKhmer ? 'មើលការផ្សាយ' : 'View Post'}
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (1/3): Company Profile Strength & Quick Management Shortcuts */}
        <div className="space-y-4 sm:space-y-5">
          {/* Company Profile Strength Card */}
          <div className="glass-card rounded-2xl border border-white/90 shadow-sm p-4 sm:p-5 space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                {isKhmer ? 'កម្រិតបំពេញព័ត៌មានក្រុមហ៊ុន' : 'Profile Strength'}
              </h3>
              <span className="text-xs sm:text-sm font-bold text-blue-600">{companyScore}%</span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-200/50 backdrop-blur-xs rounded-full h-2.5 p-0.5 overflow-hidden border border-white/80">
              <div
                className="bg-gradient-to-r from-blue-600 to-indigo-600 h-full rounded-full transition-all duration-500 shadow-2xs"
                style={{ width: `${companyScore}%` }}
              />
            </div>

            <p className="text-[11px] sm:text-xs text-slate-500 leading-relaxed">
              {isKhmer
                ? 'ព័ត៌មានក្រុមហ៊ុនកាន់តែលម្អិត ជួយបង្កើនទំនុកចិត្ត និងទាក់ទាញបេក្ខជនឆ្នើមៗ។'
                : 'A comprehensive company profile establishes credibility and attracts top-tier talent.'}
            </p>

            <div className="space-y-2 text-xs font-medium">
              <div className="flex items-center space-x-2 text-slate-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>{isKhmer ? 'គណនីស្ថាប័នបានចុះឈ្មោះ' : 'Company account registered'}</span>
              </div>
              <div className="flex items-center space-x-2 text-slate-700">
                {company?.logo_url ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                ) : (
                  <div className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0" />
                )}
                <span>{isKhmer ? 'ឡូហ្គោស្ថាប័ន' : 'Official brand logo'}</span>
              </div>
              <div className="flex items-center space-x-2 text-slate-700">
                {company?.industry ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                ) : (
                  <div className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0" />
                )}
                <span>{isKhmer ? 'វិស័យអាជីវកម្ម' : 'Industry specialization'}</span>
              </div>
              <div className="flex items-center space-x-2 text-slate-700">
                {company?.province || company?.address ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                ) : (
                  <div className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0" />
                )}
                <span>{isKhmer ? 'ទីតាំង និងអាសយដ្ឋាន' : 'Headquarters location'}</span>
              </div>
              <div className="flex items-center space-x-2 text-slate-700">
                {company?.description ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                ) : (
                  <div className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0" />
                )}
                <span>{isKhmer ? 'ការពិពណ៌នាអំពីក្រុមហ៊ុន' : 'About company overview'}</span>
              </div>
            </div>

            <Link
              to="/employer/company"
              className="w-full py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-semibold text-xs shadow-xs transition flex items-center justify-center space-x-1.5 cursor-pointer mt-2"
            >
              <span>{isKhmer ? 'កែសម្រួលព័ត៌មានក្រុមហ៊ុន' : 'Update Company Profile'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Quick Management Shortcuts */}
          <div className="glass-card rounded-2xl border border-white/90 shadow-sm p-4 sm:p-5 space-y-1">
            <span className="px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              {isKhmer ? 'ផ្លូវកាត់គ្រប់គ្រង' : 'Management Shortcuts'}
            </span>
            <Link
              to="/employer/jobs/new"
              className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-white/80 border border-transparent hover:border-white/80 text-xs font-medium text-slate-700 hover:text-blue-600 transition shadow-2xs hover:shadow-xs"
            >
              <div className="flex items-center space-x-2.5">
                <PlusCircle className="w-4 h-4 text-blue-600" />
                <span>{isKhmer ? 'ចុះផ្សាយការងារថ្មី' : 'Post New Vacancy'}</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            </Link>
            <Link
              to="/employer/jobs"
              className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-white/80 border border-transparent hover:border-white/80 text-xs font-medium text-slate-700 hover:text-blue-600 transition shadow-2xs hover:shadow-xs"
            >
              <div className="flex items-center space-x-2.5">
                <Briefcase className="w-4 h-4 text-blue-600" />
                <span>{isKhmer ? 'គ្រប់គ្រងការងារទាំងអស់' : 'Manage All Vacancies'}</span>
              </div>
              <span className="text-[10px] font-semibold text-blue-600 bg-blue-500/10 border border-blue-400/20 px-2 py-0.5 rounded-full">{jobs.length}</span>
            </Link>
            <Link
              to="/employer/company"
              className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-white/80 border border-transparent hover:border-white/80 text-xs font-medium text-slate-700 hover:text-blue-600 transition shadow-2xs hover:shadow-xs"
            >
              <div className="flex items-center space-x-2.5">
                <Building className="w-4 h-4 text-blue-600" />
                <span>{isKhmer ? 'ព័ត៌មានស្ថាប័ន' : 'Company Profile Settings'}</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            </Link>
            <Link
              to="/jobs"
              className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-white/80 border border-transparent hover:border-white/80 text-xs font-medium text-slate-700 hover:text-blue-600 transition shadow-2xs hover:shadow-xs"
            >
              <div className="flex items-center space-x-2.5">
                <Search className="w-4 h-4 text-blue-600" />
                <span>{isKhmer ? 'មើលការងារលើទំព័រមុខ' : 'Explore Public Jobs Board'}</span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-slate-300" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
