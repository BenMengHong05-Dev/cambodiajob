import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../app/providers'
import { seekerService } from '../../services/seeker.service'
import { jobsService } from '../../services/jobs.service'
import { Application, Job, SeekerProfile } from '../../types'
import { formatSalaryRange } from '../../utils/currency'
import { StatCard } from '../../components/dashboard/StatCard'
import { FacebookVerifiedBadge } from '../../components/common/FacebookVerifiedBadge'
import { getAssetUrl } from '../../utils/assets'
import {
  Briefcase,
  FileText,
  Calendar,
  Bookmark,
  CheckCircle2,
  Clock,
  ArrowRight,
  Building,
  Video,
  ChevronRight,
  FileCheck,
  Search,
  User,
  ExternalLink,
  MapPin,
  Sparkles,
  RefreshCw,
  Bell,
} from 'lucide-react'

export const SeekerDashboardPage: React.FC = () => {
  const { user } = useAuth()
  const { i18n } = useTranslation()
  const isKhmer = i18n.language === 'km'

  const [profile, setProfile] = useState<SeekerProfile | null>(null)
  const [applications, setApplications] = useState<Application[]>([])
  const [savedJobs, setSavedJobs] = useState<any[]>([])
  const [recommendedJobs, setRecommendedJobs] = useState<Job[]>([])
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all')
  const [appSearchQuery, setAppSearchQuery] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const loadDashboardData = async (quiet = false) => {
    if (!quiet) setIsLoading(true)
    else setIsRefreshing(true)
    try {
      const [profData, appsData, savedData, jobsRes] = await Promise.all([
        seekerService.getProfile().catch(() => null),
        seekerService.getApplications().catch(() => []),
        seekerService.getSavedJobs().catch(() => []),
        jobsService.getJobs({ page_size: 4 }).catch(() => ({ results: [] } as any)),
      ])
      setProfile(profData)
      setApplications(appsData || [])
      setSavedJobs(savedData || [])
      setRecommendedJobs(jobsRes?.results || [])
    } catch (err) {
      console.error('Failed to load seeker dashboard data:', err)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    loadDashboardData()
  }, [])

  const calculateCompleteness = () => {
    if (!profile) return 30
    let score = 20
    if (profile.headline) score += 15
    if (profile.summary) score += 15
    if (profile.province) score += 10
    if (profile.educations && profile.educations.length > 0) score += 15
    if (profile.work_experiences && profile.work_experiences.length > 0) score += 15
    if (profile.skills && profile.skills.length > 0) score += 10
    return Math.min(score, 100)
  }

  const profileScore = calculateCompleteness()

  const upcomingInterviews = applications
    .flatMap((app: any) =>
      (app.interviews || []).map((iv: any) => ({
        ...iv,
        job_title: app.job_title,
        company_name: app.company_name,
        company_logo: app.company_logo,
      }))
    )
    .filter((iv: any) => iv.status === 'scheduled')

  const submittedCount = applications.length
  const inReviewCount = applications.filter((a) =>
    ['submitted', 'screening', 'reviewing'].includes(a.status)
  ).length
  const interviewCount = applications.filter((a) =>
    ['shortlisted', 'interview', 'interview_scheduled'].includes(a.status)
  ).length
  const offeredCount = applications.filter((a) => a.status === 'offered').length
  const savedCount = savedJobs.length

  // Filtered applications list
  const filteredApplications = applications.filter((app: any) => {
    if (selectedStatusFilter !== 'all') {
      if (selectedStatusFilter === 'reviewing' && !['submitted', 'screening', 'reviewing'].includes(app.status)) return false
      if (selectedStatusFilter === 'interview' && !['shortlisted', 'interview', 'interview_scheduled'].includes(app.status)) return false
      if (selectedStatusFilter === 'offered' && app.status !== 'offered') return false
      if (selectedStatusFilter === 'rejected' && app.status !== 'rejected') return false
    }
    if (appSearchQuery.trim()) {
      const q = appSearchQuery.toLowerCase()
      const titleMatch = app.job_title?.toLowerCase().includes(q)
      const compMatch = app.company_name?.toLowerCase().includes(q)
      return titleMatch || compMatch
    }
    return true
  })

  // Dynamic Greeting based on Cambodian local hour
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return isKhmer ? 'អរុណសួស្តី' : 'Good morning'
    if (hour < 18) return isKhmer ? 'ទិវាសួស្តី' : 'Good afternoon'
    return isKhmer ? 'សាយណ្ហសួស្តី' : 'Good evening'
  }

  const getDynamicStatusBadge = (status: string) => {
    switch (status) {
      case 'submitted':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/80 shadow-2xs whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            <span className="whitespace-nowrap">{isKhmer ? 'បានដាក់ពាក្យ' : 'Submitted'}</span>
          </span>
        )
      case 'screening':
      case 'reviewing':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/80 shadow-2xs whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span className="whitespace-nowrap">{isKhmer ? 'កំពុងត្រួតពិនិត្យ' : 'In Review'}</span>
          </span>
        )
      case 'shortlisted':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-violet-50 text-violet-700 border border-violet-200/80 shadow-2xs whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
            <span className="whitespace-nowrap">{isKhmer ? 'ជាប់បញ្ជីសម្រាំង' : 'Shortlisted'}</span>
          </span>
        )
      case 'interview':
      case 'interview_scheduled':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/80 shadow-2xs whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
            <span className="whitespace-nowrap">{isKhmer ? 'ណាត់សម្ភាសន៍' : 'Interview'}</span>
          </span>
        )
      case 'offered':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce" />
            <span className="whitespace-nowrap">{isKhmer ? 'បានទទួលការងារ' : 'Offer Received'}</span>
          </span>
        )
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200/80 shadow-2xs whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            <span className="whitespace-nowrap">{isKhmer ? 'មិនបានជ្រើសរើស' : 'Not Selected'}</span>
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 whitespace-nowrap capitalize">
            {status}
          </span>
        )
    }
  }

  if (isLoading) {
    return (
      <div className="py-24 text-center font-sans">
        <div className="w-9 h-9 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="mt-3.5 text-xs font-semibold text-slate-500 tracking-wide">
          {isKhmer ? 'កំពុងដំណើរការទិន្នន័យ...' : 'Loading your workspace...'}
        </p>
      </div>
    )
  }

  const candidateDisplayName = profile?.full_name || user?.full_name || 'Candidate'

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

      {/* 1. Glassmorphic Hero Header Bar with Personalized Greeting */}
      <div className="glass-header p-4 sm:p-5 rounded-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-gradient-to-bl from-blue-400/15 via-indigo-300/10 to-transparent rounded-full blur-2xl pointer-events-none" />

        <div className="min-w-0 relative z-10">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight truncate">
              {getGreeting()}, {candidateDisplayName} 👋
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-700 border border-blue-400/25 backdrop-blur-md shadow-2xs shrink-0">
              <User className="w-3 h-3 text-blue-600" />
              <span>{isKhmer ? 'បេក្ខជនការងារ' : 'Job Seeker'}</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            {isKhmer
              ? `តាមដានស្ថានភាពពាក្យសុំការងារ ${submittedCount} កន្លែង និងការណាត់សម្ភាសន៍របស់អ្នក។`
              : `Tracking ${submittedCount} job applications and active career milestones.`}
          </p>
        </div>

        <div className="flex items-center space-x-2.5 shrink-0 self-start md:self-auto relative z-10">
          <Link
            to="/seeker/profile"
            className="px-3.5 py-2 rounded-xl bg-white/80 backdrop-blur-md hover:bg-white text-slate-700 hover:text-blue-600 border border-white/80 hover:border-blue-300/60 text-xs font-semibold transition-all duration-200 shadow-2xs hover:shadow-xs flex items-center space-x-1.5 cursor-pointer"
          >
            <FileCheck className="w-3.5 h-3.5 text-slate-400" />
            <span>{isKhmer ? 'កែប្រែ CV' : 'Edit Resume'}</span>
          </Link>
          <Link
            to="/jobs"
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:bg-gradient-to-r hover:from-blue-700 hover:to-indigo-700 active:scale-98 text-white text-xs font-semibold transition-all duration-200 shadow-md shadow-blue-500/20 flex items-center space-x-1.5 cursor-pointer"
          >
            <Search className="w-3.5 h-3.5" />
            <span>{isKhmer ? 'រកការងារថ្មី' : 'Find Jobs'}</span>
          </Link>
          <button
            type="button"
            onClick={() => loadDashboardData(true)}
            disabled={isRefreshing}
            title={isKhmer ? 'ផ្ទុកទិន្នន័យឡើងវិញ' : 'Refresh dashboard'}
            className="p-2 rounded-xl bg-white/80 hover:bg-white text-slate-600 hover:text-blue-600 border border-white/80 shadow-2xs transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. Glassmorphic 4-Column Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Metric 1: Total Submitted */}
        <StatCard
          to="/seeker/applications"
          label={isKhmer ? 'ពាក្យសុំបានដាក់' : 'Applied Jobs'}
          value={submittedCount}
          icon={Briefcase}
          accent="blue"
          badge={isKhmer ? 'សរុប' : 'Total'}
        />

        {/* Metric 2: Under Review */}
        <StatCard
          to="/seeker/applications"
          label={isKhmer ? 'កំពុងត្រួតពិនិត្យ' : 'In Screening'}
          value={inReviewCount}
          icon={Clock}
          accent="amber"
          badge={isKhmer ? 'ដំណើរការ' : 'Active'}
          tone="warning"
        />

        {/* Metric 3: Interviews */}
        <StatCard
          to="/seeker/applications"
          label={isKhmer ? 'ការសម្ភាសន៍' : 'Interviews'}
          value={interviewCount}
          icon={Calendar}
          accent="indigo"
          badge={isKhmer ? 'ជិតមកដល់' : 'Scheduled'}
          tone="info"
        />

        {/* Metric 4: Saved Jobs */}
        <StatCard
          to="/seeker/saved"
          label={isKhmer ? 'ការងាររក្សាទុក' : 'Saved Jobs'}
          value={savedCount}
          icon={Bookmark}
          accent="sky"
          badge={isKhmer ? 'កត់ចំណាំ' : 'Bookmarked'}
        />
      </div>

      {/* 4. Upcoming Interview Banner (if any) */}
      {upcomingInterviews.length > 0 && (
        <div className="glass-card p-4 sm:p-5 rounded-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-3.5 border-l-4 border-l-indigo-600">
          <div className="flex items-center space-x-3.5 min-w-0 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-400/30 text-indigo-600 flex items-center justify-center shrink-0 shadow-inner">
              <Video className="w-5 h-5 text-indigo-600 animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-500/15 text-indigo-700 border border-indigo-400/30 uppercase">
                  {isKhmer ? 'ការសម្ភាសន៍បន្ទាប់' : 'Next Interview'}
                </span>
                <span className="text-xs font-semibold text-slate-600">
                  {new Date(upcomingInterviews[0].scheduled_at).toLocaleString(isKhmer ? 'km-KH' : 'en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 mt-0.5 truncate">
                {upcomingInterviews[0].job_title} @ {upcomingInterviews[0].company_name}
              </h3>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0 self-start md:self-auto relative z-10">
            {upcomingInterviews[0].location_or_link && upcomingInterviews[0].location_or_link.startsWith('http') && (
              <a
                href={upcomingInterviews[0].location_or_link}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition"
              >
                <Video className="w-3.5 h-3.5" />
                <span>{isKhmer ? 'ចូលបន្ទប់សម្ភាសន៍' : 'Join Call'}</span>
              </a>
            )}
            <Link
              to="/seeker/applications"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/80 hover:bg-white border border-white/80 text-xs font-semibold text-slate-700 hover:text-blue-600 transition shadow-2xs"
            >
              <span>{isKhmer ? 'មើលព័ត៌មានលម្អិត' : 'View Details'}</span>
            </Link>
          </div>
        </div>
      )}

      {/* 5. Main 2-Column Split: Clean 2/3 (left) + 1/3 (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 items-start">
        {/* Left Column (2/3): Applications & Recommendations */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-5">
          {/* Active Applications Section */}
          <div className="glass-card rounded-2xl border border-white/90 shadow-sm overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-200/60 bg-white/50 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-2xs shrink-0">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xs sm:text-sm font-bold text-slate-900">
                    {isKhmer ? 'ពាក្យសុំការងារចុងក្រោយ' : 'Recent Applications'}
                  </h2>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {isKhmer ? 'ស្ថានភាពពាក្យសុំការងារដែលបានដាក់' : 'Tracking your current recruitment status'}
                  </p>
                </div>
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                {[
                  { id: 'all', label: isKhmer ? 'ទាំងអស់' : 'All', count: applications.length },
                  { id: 'reviewing', label: isKhmer ? 'កំពុងត្រួតពិនិត្យ' : 'In Review', count: inReviewCount },
                  { id: 'interview', label: isKhmer ? 'សម្ភាសន៍' : 'Interview', count: interviewCount },
                  { id: 'offered', label: isKhmer ? 'បានការងារ' : 'Offered', count: offeredCount },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSelectedStatusFilter(tab.id)}
                    className={`px-3 py-1 rounded-xl text-xs font-semibold transition shrink-0 cursor-pointer ${
                      selectedStatusFilter === tab.id
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'bg-white/80 hover:bg-white text-slate-600 hover:text-slate-900 border border-slate-200/80 shadow-2xs'
                    }`}
                  >
                    {tab.label} <span className="opacity-80">({tab.count})</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Search */}
            <div className="px-4 sm:px-5 py-2.5 bg-slate-50/80 border-b border-slate-200/70 flex items-center justify-between gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={appSearchQuery}
                  onChange={(e) => setAppSearchQuery(e.target.value)}
                  placeholder={isKhmer ? 'ស្វែងរកតាមការងារ ឬក្រុមហ៊ុន...' : 'Search applied role or company...'}
                  className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 transition shadow-2xs"
                />
              </div>
              <Link
                to="/seeker/applications"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition shrink-0 group"
              >
                <span>{isKhmer ? 'មើលទាំងអស់' : 'View all'}</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            {filteredApplications.length === 0 ? (
              <div className="text-center py-14 px-4 space-y-2.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-400/20 text-blue-600 flex items-center justify-center mx-auto shadow-inner">
                  <Briefcase className="w-6 h-6" />
                </div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                  {isKhmer ? 'មិនមានពាក្យសុំក្នុងប្រភេទនេះទេ' : 'No applications found in this view'}
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {isKhmer ? 'ស្វែងរកឱកាសការងារថ្មីៗ និងចាប់ផ្តើមដាក់ពាក្យ។' : 'Discover vacancies and apply to advance your career path.'}
                </p>
                <Link
                  to="/jobs"
                  className="inline-flex items-center px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold mt-1 transition shadow-xs gap-1.5"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>{isKhmer ? 'ស្វែងរកការងារ' : 'Explore Jobs'}</span>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/90 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-3 px-4 min-w-[240px]">{isKhmer ? 'តំណែងការងារ និងក្រុមហ៊ុន' : 'Job & Company'}</th>
                      <th className="py-3 px-4 hidden md:table-cell whitespace-nowrap min-w-[120px]">{isKhmer ? 'ទីតាំង' : 'Location'}</th>
                      <th className="py-3 px-4 hidden sm:table-cell whitespace-nowrap min-w-[140px]">{isKhmer ? 'ប្រាក់ខែ' : 'Salary'}</th>
                      <th className="py-3 px-4 whitespace-nowrap min-w-[140px]">{isKhmer ? 'ស្ថានភាព' : 'Status'}</th>
                      <th className="py-3 px-4 hidden lg:table-cell whitespace-nowrap min-w-[120px]">{isKhmer ? 'កាលបរិច្ឆេទ' : 'Applied Date'}</th>
                      <th className="py-3 px-4 text-right whitespace-nowrap min-w-[85px]">{isKhmer ? 'សកម្មភាព' : 'Action'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredApplications.slice(0, 5).map((app: any) => (
                      <tr key={app.id} className="hover:bg-blue-50/30 transition-colors group">
                        <td className="py-3.5 px-4 min-w-[240px]">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 shadow-2xs p-1 shrink-0 flex items-center justify-center overflow-hidden">
                              {app.company_logo ? (
                                <img src={getAssetUrl(app.company_logo)} alt={app.company_name} className="w-full h-full object-contain rounded-lg" />
                              ) : (
                                <Building className="w-4 h-4 text-slate-400" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <Link
                                to={`/jobs/${app.job_slug}`}
                                className="font-bold text-slate-900 group-hover:text-blue-600 transition truncate block max-w-xs text-xs sm:text-sm"
                              >
                                {app.job_title}
                              </Link>
                              <span className="text-[11px] text-slate-500 font-medium block truncate">
                                {app.company_name}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 hidden md:table-cell text-slate-600 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            {app.province}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 hidden sm:table-cell whitespace-nowrap">
                          {app.salary_min ? (
                            <span className="inline-flex items-center px-3 py-1 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-xs font-bold shadow-2xs whitespace-nowrap">
                              {formatSalaryRange(app.salary_min, app.salary_max, app.salary_currency)}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-xl bg-slate-100/80 text-slate-500 text-xs font-medium border border-slate-200/60 whitespace-nowrap">
                              {isKhmer ? 'ចរចា' : 'Negotiable'}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {getDynamicStatusBadge(app.status)}
                        </td>
                        <td className="py-3.5 px-4 hidden lg:table-cell text-slate-500 text-xs whitespace-nowrap">
                          {new Date(app.created_at).toLocaleDateString(isKhmer ? 'km-KH' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <Link
                            to={`/jobs/${app.job_slug}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-blue-600 text-slate-700 hover:text-white border border-slate-200/90 hover:border-blue-600 text-xs font-semibold transition-all duration-150 shadow-2xs hover:shadow-xs group/btn cursor-pointer"
                          >
                            <span>{isKhmer ? 'មើល' : 'View'}</span>
                            <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover/btn:text-white group-hover/btn:translate-x-0.5 transition-all" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Recommended Jobs */}
          <div className="glass-card rounded-2xl border border-white/90 shadow-sm p-4 sm:p-5 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shadow-2xs shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                    {isKhmer ? 'ការងារណែនាំសម្រាប់អ្នក' : 'Recommended Jobs For You'}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {isKhmer ? 'ស្របតាមជំនាញ និងទីផ្សារការងារកម្ពុជា' : 'Matching your experience and preferences'}
                  </p>
                </div>
              </div>
              <Link to="/jobs" className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition group">
                <span>{isKhmer ? 'មើលបន្ថែម' : 'Explore more'}</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            {recommendedJobs.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400 font-normal">
                {isKhmer ? 'មិនទាន់មានការងារណែនាំនៅឡើយទេ' : 'No recommended jobs available right now.'}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                {recommendedJobs.slice(0, 4).map((job) => (
                  <Link
                    key={job.id}
                    to={`/jobs/${job.slug}`}
                    className="bg-white/85 hover:bg-white p-4 sm:p-4.5 rounded-2xl border border-slate-200/80 hover:border-blue-400/70 transition-all duration-200 shadow-2xs hover:shadow-md flex flex-col justify-between group cursor-pointer relative overflow-hidden"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-start gap-3">
                        <div className="w-11 h-11 rounded-xl bg-white border border-slate-200 shadow-2xs p-1.5 shrink-0 flex items-center justify-center overflow-hidden group-hover:scale-105 transition-transform">
                          {job.company_logo ? (
                            <img
                              src={getAssetUrl(job.company_logo)}
                              alt={job.company_name}
                              className="w-full h-full object-contain rounded-lg"
                            />
                          ) : (
                            <Building className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200/60 uppercase tracking-wide inline-block truncate max-w-[200px]">
                            {isKhmer
                              ? job.category_name_km || job.category_name_en || 'ឱកាសការងារ'
                              : job.category_name_en || job.category_name_km || 'Opportunity'}
                          </span>
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1 mt-1">
                            {isKhmer && job.title_km ? job.title_km : job.title}
                          </h4>
                          <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
                            <p className="text-xs text-slate-500 font-medium truncate">
                              {job.company_name}
                            </p>
                            {(job as any).company_verification === 'verified' && (
                              <FacebookVerifiedBadge
                                className="w-3.5 h-3.5"
                                title={isKhmer ? 'ក្រុមហ៊ុនបានផ្ទៀងផ្ទាត់' : 'Verified Organization'}
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-bold text-xs shadow-2xs whitespace-nowrap">
                        {formatSalaryRange(job.salary_min, job.salary_max, job.salary_currency, job.is_salary_negotiable)}
                      </span>
                      <span className="text-slate-500 text-xs font-medium flex items-center gap-1 shrink-0 whitespace-nowrap">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{job.province}</span>
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (1/3): Profile Strength, AI Market Intelligence & Shortcuts */}
        <div className="space-y-4 sm:space-y-5">
          {/* Profile Strength Card */}
          <div className="glass-card rounded-2xl border border-white/90 shadow-sm p-4 sm:p-5 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-2xs">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                  {isKhmer ? 'កម្រិតបំពេញ CV' : 'Profile Strength'}
                </h3>
              </div>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  profileScore >= 80
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                    : profileScore >= 50
                    ? 'bg-blue-50 text-blue-700 border border-blue-200/60'
                    : 'bg-amber-50 text-amber-700 border border-amber-200/60'
                }`}
              >
                {profileScore}%
              </span>
            </div>

            {/* Progress Bar with luminous gradient track */}
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200/60">
              <div
                className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${profileScore}%` }}
              />
            </div>

            <p className="text-[11px] sm:text-xs text-slate-500 leading-relaxed">
              {isKhmer
                ? 'បំពេញប្រវត្តិរូបឱ្យបានពេញលេញ ដើម្បីបង្កើនឱកាសទទួលបានការសម្ភាសន៍។'
                : 'Complete your profile credentials to increase recruiter profile visibility.'}
            </p>

            {/* Checklist */}
            <div className="space-y-2 text-xs">
              {[
                {
                  done: true,
                  label: isKhmer ? 'គណនីបានផ្ទៀងផ្ទាត់' : 'Account active & verified',
                },
                {
                  done: !!(profile?.headline || profile?.summary),
                  label: isKhmer ? 'ចំណងជើង និងសេចក្ដីសង្ខេប' : 'Professional summary',
                },
                {
                  done: !!(profile?.work_experiences && profile.work_experiences.length > 0),
                  label: isKhmer ? 'បទពិសោធន៍ការងារ' : 'Work experience',
                },
                {
                  done: !!(profile?.educations && profile.educations.length > 0),
                  label: isKhmer ? 'កម្រិតវប្បធម៌' : 'Education history',
                },
                {
                  done: !!(profile?.skills && profile.skills.length > 0),
                  label: isKhmer ? 'ជំនាញឯកទេស' : 'Key skills listed',
                },
              ].map((item, idx) => (
                <Link
                  key={idx}
                  to="/seeker/profile"
                  className={`flex items-center justify-between p-2 rounded-xl border transition-colors ${
                    item.done
                      ? 'bg-emerald-50/40 border-emerald-200/50 text-slate-800 hover:bg-emerald-50/70'
                      : 'bg-slate-50/60 border-slate-200/60 text-slate-500 hover:bg-blue-50/40 hover:border-blue-200/60'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {item.done ? (
                      <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
                        <CheckCircle2 className="w-3 h-3 text-white" />
                      </div>
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-slate-300 bg-white flex items-center justify-center shrink-0">
                        <div className="w-1 h-1 rounded-full bg-slate-300" />
                      </div>
                    )}
                    <span className={`truncate text-xs ${item.done ? 'font-medium text-slate-800' : 'text-slate-600'}`}>
                      {item.label}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-semibold shrink-0 px-1.5 py-0.5 rounded ${
                      item.done
                        ? 'text-emerald-700 bg-emerald-100/70'
                        : 'text-blue-600 bg-blue-50'
                    }`}
                  >
                    {item.done ? (isKhmer ? 'រួចរាល់' : 'Done') : (isKhmer ? '+ បន្ថែម' : '+ Add')}
                  </span>
                </Link>
              ))}
            </div>

            <Link
              to="/seeker/profile"
              className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-semibold text-xs shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-2"
            >
              <span>{isKhmer ? 'កែលម្អប្រវត្តិរូប' : 'Update Profile'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Career Workspace Shortcuts */}
          <div className="glass-card rounded-2xl border border-white/90 shadow-sm p-4 sm:p-5 space-y-1">
            <span className="px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              {isKhmer ? 'ផ្លូវកាត់ការងាររហ័ស' : 'Quick Career Shortcuts'}
            </span>
            <Link
              to="/jobs"
              className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-slate-50 text-xs font-medium text-slate-700 hover:text-blue-600 transition"
            >
              <div className="flex items-center space-x-2.5">
                <Search className="w-4 h-4 text-blue-600" />
                <span>{isKhmer ? 'ស្វែងរកការងារថ្មី' : 'Browse Open Positions'}</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            </Link>
            <Link
              to="/seeker/applications"
              className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-slate-50 text-xs font-medium text-slate-700 hover:text-blue-600 transition"
            >
              <div className="flex items-center space-x-2.5">
                <FileText className="w-4 h-4 text-indigo-600" />
                <span>{isKhmer ? 'តាមដានពាក្យសុំការងារ' : 'My Applications'}</span>
              </div>
              <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                {submittedCount}
              </span>
            </Link>
            <Link
              to="/seeker/saved"
              className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-slate-50 text-xs font-medium text-slate-700 hover:text-blue-600 transition"
            >
              <div className="flex items-center space-x-2.5">
                <Bookmark className="w-4 h-4 text-sky-600" />
                <span>{isKhmer ? 'ការងារដែលបានរក្សាទុក' : 'Saved Jobs'}</span>
              </div>
              <span className="text-[10px] font-semibold text-sky-600 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-full">
                {savedCount}
              </span>
            </Link>
            <Link
              to="/seeker/notifications"
              className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-slate-50 text-xs font-medium text-slate-700 hover:text-blue-600 transition"
            >
              <div className="flex items-center space-x-2.5">
                <Bell className="w-4 h-4 text-purple-600" />
                <span>{isKhmer ? 'ការជូនដំណឹងទាំងអស់' : 'Notifications'}</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
