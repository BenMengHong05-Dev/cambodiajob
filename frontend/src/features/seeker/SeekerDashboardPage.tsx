import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../app/providers'
import { seekerService } from '../../services/seeker.service'
import { jobsService } from '../../services/jobs.service'
import { Application, Job, SeekerProfile } from '../../types'
import { formatSalaryRange } from '../../utils/currency'
import { DashboardNotificationAlert } from '../../components/layout/DashboardNotificationAlert'
import {
  Briefcase,
  FileText,
  Calendar,
  Bookmark,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  Building,
  Video,
  Sparkles,
  ChevronRight,
  FileCheck,
  Search,
  User,
  ExternalLink,
  MapPin,
} from 'lucide-react'

export const SeekerDashboardPage: React.FC = () => {
  const { user } = useAuth()
  const { i18n } = useTranslation()
  const navigate = useNavigate()
  const isKhmer = i18n.language === 'km'

  const [profile, setProfile] = useState<SeekerProfile | null>(null)
  const [applications, setApplications] = useState<Application[]>([])
  const [savedJobs, setSavedJobs] = useState<any[]>([])
  const [recommendedJobs, setRecommendedJobs] = useState<Job[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadDashboardData = async () => {
      setIsLoading(true)
      try {
        const [profData, appsData, savedData, jobsRes] = await Promise.all([
          seekerService.getProfile().catch(() => null),
          seekerService.getApplications().catch(() => []),
          seekerService.getSavedJobs().catch(() => []),
          jobsService.getJobs({ page_size: 3 }).catch(() => ({ results: [] } as any)),
        ])
        setProfile(profData)
        setApplications(appsData || [])
        setSavedJobs(savedData || [])
        setRecommendedJobs(jobsRes?.results || [])
      } catch (err) {
        console.error('Failed to load seeker dashboard data:', err)
      } finally {
        setIsLoading(false)
      }
    }
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
  const inReviewCount = applications.filter((a) => ['submitted', 'screening', 'reviewing'].includes(a.status)).length
  const interviewCount = applications.filter((a) => ['shortlisted', 'interview', 'interview_scheduled'].includes(a.status)).length
  const savedCount = savedJobs.length

  const getDynamicStatusBadge = (status: string) => {
    switch (status) {
      case 'submitted':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/10 text-blue-700 border border-blue-400/25 backdrop-blur-md shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            <span>{isKhmer ? 'បានដាក់ពាក្យ' : 'Submitted'}</span>
          </span>
        )
      case 'screening':
      case 'reviewing':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-700 border border-amber-400/25 backdrop-blur-md shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span>{isKhmer ? 'កំពុងត្រួតពិនិត្យ' : 'In Review'}</span>
          </span>
        )
      case 'shortlisted':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-500/10 text-purple-700 border border-purple-400/25 backdrop-blur-md shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
            <span>{isKhmer ? 'ជាប់បញ្ជីសម្រាំង' : 'Shortlisted'}</span>
          </span>
        )
      case 'interview':
      case 'interview_scheduled':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/10 text-indigo-700 border border-indigo-400/25 backdrop-blur-md shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            <span>{isKhmer ? 'ណាត់សម្ភាសន៍' : 'Interview'}</span>
          </span>
        )
      case 'offered':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-700 border border-emerald-400/25 backdrop-blur-md shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            <span>{isKhmer ? 'បានទទួលការងារ' : 'Offer Received'}</span>
          </span>
        )
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-700 border border-rose-400/25 backdrop-blur-md shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            <span>{isKhmer ? 'មិនបានជ្រើសរើស' : 'Not Selected'}</span>
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100/80 text-slate-700 border border-slate-200/70 backdrop-blur-md capitalize">
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
        {/* Subtle decorative inner corner sheen */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-gradient-to-bl from-blue-400/15 via-indigo-300/10 to-transparent rounded-full blur-2xl pointer-events-none" />

        <div className="min-w-0 relative z-10">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight truncate">
              {isKhmer ? 'ផ្ទាំងគ្រប់គ្រងបេក្ខជន' : 'Candidate Dashboard'}
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-700 border border-blue-400/25 backdrop-blur-md shadow-2xs shrink-0">
              <User className="w-3 h-3 text-blue-600" />
              <span>{isKhmer ? 'បេក្ខជនការងារ' : 'Job Seeker'}</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            {isKhmer
              ? `សូមស្វាគមន៍ការវិលត្រឡប់មកវិញ, ${profile?.full_name || user?.full_name || ''}។ តាមដានពាក្យសុំ និងឱកាសការងាររបស់អ្នក។`
              : `Welcome back, ${profile?.full_name || user?.full_name || ''}. Track your active applications and upcoming interviews.`}
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
        </div>
      </div>

      {/* Dashboard Notification Alert Banner */}
      <DashboardNotificationAlert role="job_seeker" interviewsCount={upcomingInterviews.length} />

      {/* 2. Glassmorphic 4-Column Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Metric 1: Total Submitted */}
        <Link
          to="/seeker/applications"
          className="glass-card-hover p-4 sm:p-5 rounded-2xl relative overflow-hidden group block cursor-pointer"
        >
          <div className="absolute -right-8 -top-8 w-24 h-24 bg-blue-400/10 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
          <div className="flex items-center justify-between relative z-10">
            <span className="text-xs font-semibold text-slate-500 group-hover:text-slate-800 transition-colors">
              {isKhmer ? 'ពាក្យសុំបានដាក់' : 'Applied Jobs'}
            </span>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-400/20 text-blue-600 flex items-center justify-center group-hover:scale-105 group-hover:bg-blue-600 group-hover:text-white transition-all duration-200 shadow-inner">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3.5 flex items-baseline justify-between relative z-10">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors tracking-tight">
              {submittedCount}
            </span>
            <span className="text-[10px] font-semibold text-slate-500 bg-white/80 border border-slate-200/60 backdrop-blur-xs px-2 py-0.5 rounded-full shadow-2xs">
              {isKhmer ? 'សរុប' : 'Total'}
            </span>
          </div>
        </Link>

        {/* Metric 2: Under Review */}
        <Link
          to="/seeker/applications"
          className="glass-card-hover p-4 sm:p-5 rounded-2xl relative overflow-hidden group block cursor-pointer"
        >
          <div className="absolute -right-8 -top-8 w-24 h-24 bg-amber-400/10 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
          <div className="flex items-center justify-between relative z-10">
            <span className="text-xs font-semibold text-slate-500 group-hover:text-slate-800 transition-colors">
              {isKhmer ? 'កំពុងត្រួតពិនិត្យ' : 'In Screening'}
            </span>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-400/20 text-amber-600 flex items-center justify-center group-hover:scale-105 group-hover:bg-amber-600 group-hover:text-white transition-all duration-200 shadow-inner">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3.5 flex items-baseline justify-between relative z-10">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 group-hover:text-amber-600 transition-colors tracking-tight">
              {inReviewCount}
            </span>
            <span className="text-[10px] font-semibold text-slate-500 bg-white/80 border border-slate-200/60 backdrop-blur-xs px-2 py-0.5 rounded-full shadow-2xs">
              {isKhmer ? 'ដំណើរការ' : 'Active'}
            </span>
          </div>
        </Link>

        {/* Metric 3: Interviews */}
        <Link
          to="/seeker/applications"
          className="glass-card-hover p-4 sm:p-5 rounded-2xl relative overflow-hidden group block cursor-pointer"
        >
          <div className="absolute -right-8 -top-8 w-24 h-24 bg-indigo-400/10 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
          <div className="flex items-center justify-between relative z-10">
            <span className="text-xs font-semibold text-slate-500 group-hover:text-slate-800 transition-colors">
              {isKhmer ? 'ការសម្ភាសន៍' : 'Interviews'}
            </span>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-400/20 text-indigo-600 flex items-center justify-center group-hover:scale-105 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-200 shadow-inner">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3.5 flex items-baseline justify-between relative z-10">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors tracking-tight">
              {interviewCount}
            </span>
            <span className="text-[10px] font-semibold text-slate-500 bg-white/80 border border-slate-200/60 backdrop-blur-xs px-2 py-0.5 rounded-full shadow-2xs">
              {isKhmer ? 'ជិតមកដល់' : 'Scheduled'}
            </span>
          </div>
        </Link>

        {/* Metric 4: Saved Jobs */}
        <Link
          to="/seeker/saved"
          className="glass-card-hover p-4 sm:p-5 rounded-2xl relative overflow-hidden group block cursor-pointer"
        >
          <div className="absolute -right-8 -top-8 w-24 h-24 bg-sky-400/10 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
          <div className="flex items-center justify-between relative z-10">
            <span className="text-xs font-semibold text-slate-500 group-hover:text-slate-800 transition-colors">
              {isKhmer ? 'ការងាររក្សាទុក' : 'Saved Jobs'}
            </span>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500/10 to-blue-500/10 border border-sky-400/20 text-sky-600 flex items-center justify-center group-hover:scale-105 group-hover:bg-sky-600 group-hover:text-white transition-all duration-200 shadow-inner">
              <Bookmark className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3.5 flex items-baseline justify-between relative z-10">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 group-hover:text-sky-600 transition-colors tracking-tight">
              {savedCount}
            </span>
            <span className="text-[10px] font-semibold text-slate-500 bg-white/80 border border-slate-200/60 backdrop-blur-xs px-2 py-0.5 rounded-full shadow-2xs">
              {isKhmer ? 'កត់ចំណាំ' : 'Bookmarked'}
            </span>
          </div>
        </Link>
      </div>

      {/* 3. Glassmorphic Candidate Career Progress Strip */}
      <div className="glass-card p-4 sm:p-5 rounded-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-3.5">
        <div className="flex items-center space-x-3.5 min-w-0 relative z-10">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-400/25 text-blue-600 flex items-center justify-center shrink-0 shadow-inner">
            {upcomingInterviews.length > 0 ? (
              <Video className="w-4 h-4 text-blue-600" />
            ) : (
              <TrendingUp className="w-4 h-4 text-blue-600" />
            )}
          </div>
          <div className="min-w-0">
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
              {upcomingInterviews.length > 0
                ? (isKhmer ? 'ការសម្ភាសន៍បន្ទាប់' : 'Upcoming Interview Scheduled')
                : (isKhmer ? 'ដំណើរការស្វែងរក និងដាក់ពាក្យការងារ' : 'Active Career Search & Job Tracking')}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 truncate">
              {upcomingInterviews.length > 0
                ? `${upcomingInterviews[0].job_title} @ ${upcomingInterviews[0].company_name} • ${new Date(upcomingInterviews[0].scheduled_at).toLocaleString(isKhmer ? 'km-KH' : 'en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`
                : (isKhmer
                    ? `បច្ចុប្បន្នបានដាក់ពាក្យ ${submittedCount} កន្លែង និងមាន ${interviewCount} កំពុងដំណើរការសម្ភាសន៍។`
                    : `Currently tracking ${submittedCount} job applications with ${interviewCount} in interview stages.`)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0 self-start md:self-auto relative z-10">
          {upcomingInterviews.length > 0 ? (
            <>
              {upcomingInterviews[0].location_or_link && upcomingInterviews[0].location_or_link.startsWith('http') && (
                <a
                  href={upcomingInterviews[0].location_or_link}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition"
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>{isKhmer ? 'ចូលបន្ទប់សម្ភាសន៍' : 'Join Call'}</span>
                </a>
              )}
              {upcomingInterviews[0].google_calendar_url && (
                <a
                  href={upcomingInterviews[0].google_calendar_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/80 hover:bg-white border border-white/80 text-slate-700 hover:text-blue-600 text-xs font-semibold shadow-2xs transition"
                  title="Sync with Google Calendar"
                >
                  <span>📅 Google Cal</span>
                </a>
              )}
              <Link
                to="/seeker/applications"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/80 hover:bg-white border border-white/80 text-xs font-semibold text-slate-700 hover:text-blue-600 transition shadow-2xs"
              >
                <span>{isKhmer ? 'មើលព័ត៌មានលម្អិត' : 'View Details'}</span>
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/seeker/applications"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/80 hover:bg-white border border-white/80 text-xs font-semibold text-slate-700 hover:text-blue-600 transition shadow-2xs"
              >
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                <span>{submittedCount} {isKhmer ? 'ពាក្យសុំ' : 'Applications'}</span>
              </Link>
              <Link
                to="/seeker/saved"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/80 hover:bg-white border border-white/80 text-xs font-semibold text-slate-700 hover:text-blue-600 transition shadow-2xs"
              >
                <Bookmark className="w-3.5 h-3.5 text-blue-600" />
                <span>{savedCount} {isKhmer ? 'ការងាររក្សាទុក' : 'Saved'}</span>
              </Link>
              <Link
                to="/jobs"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white text-xs font-semibold shadow-xs transition"
              >
                <Search className="w-3 h-3" />
                <span>{isKhmer ? 'រកការងារ' : 'Find Jobs'}</span>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* 4. Main 2-Column Split: Clean 2/3 (left) + 1/3 (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 items-start">
        {/* Left Column (2/3): Applications & Recommendations */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-5">
          {/* Active Applications Section */}
          <div className="glass-card rounded-2xl border border-white/90 shadow-sm overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-200/60 bg-white/50 backdrop-blur-md flex items-center justify-between">
              <div>
                <h2 className="text-xs sm:text-sm font-bold text-slate-900">
                  {isKhmer ? 'ពាក្យសុំការងារចុងក្រោយ' : 'Recent Applications'}
                </h2>
                <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
                  {isKhmer ? 'ស្ថានភាពពាក្យសុំការងារដែលបានដាក់' : 'Tracking your current recruitment status'}
                </p>
              </div>
              <Link
                to="/seeker/applications"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center space-x-1 transition"
              >
                <span>{isKhmer ? 'មើលទាំងអស់' : 'View all'}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {applications.length === 0 ? (
              <div className="text-center py-14 px-4 space-y-2.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-400/20 text-blue-600 flex items-center justify-center mx-auto shadow-inner">
                  <Briefcase className="w-6 h-6" />
                </div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                  {isKhmer ? 'មិនទាន់មានពាក្យសុំការងារទេ' : 'No applications submitted yet'}
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
                    <tr className="bg-slate-50/70 border-b border-slate-200/60 text-[11px] font-bold text-slate-500 uppercase tracking-wider backdrop-blur-xs">
                      <th className="py-3 px-4">{isKhmer ? 'តំណែងការងារ និងក្រុមហ៊ុន' : 'Job & Company'}</th>
                      <th className="py-3 px-4 hidden md:table-cell">{isKhmer ? 'ទីតាំង' : 'Location'}</th>
                      <th className="py-3 px-4 hidden sm:table-cell">{isKhmer ? 'ប្រាក់ខែ' : 'Salary'}</th>
                      <th className="py-3 px-4">{isKhmer ? 'ស្ថានភាព' : 'Status'}</th>
                      <th className="py-3 px-4 hidden lg:table-cell">{isKhmer ? 'កាលបរិច្ឆេទ' : 'Applied Date'}</th>
                      <th className="py-3 px-4 text-right">{isKhmer ? 'សកម្មភាព' : 'Action'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {applications.slice(0, 5).map((app: any) => (
                      <tr key={app.id} className="hover:bg-blue-50/40 transition-colors group">
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-9 h-9 rounded-xl bg-white/90 border border-white/90 shadow-2xs p-1 shrink-0 flex items-center justify-center overflow-hidden">
                              {app.company_logo ? (
                                <img src={app.company_logo} alt={app.company_name} className="w-full h-full object-contain rounded-lg" />
                              ) : (
                                <Building className="w-4 h-4 text-slate-400" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <Link
                                to={`/jobs/${app.job_slug}`}
                                className="font-bold text-slate-900 group-hover:text-blue-600 transition truncate block max-w-xs"
                              >
                                {app.job_title}
                              </Link>
                              <span className="text-[11px] text-slate-500 font-medium">
                                {app.company_name}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 hidden md:table-cell text-slate-600">
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            {app.province}
                          </span>
                        </td>
                        <td className="py-3 px-4 hidden sm:table-cell">
                          {app.salary_min ? (
                            <span className="text-blue-600 font-semibold bg-blue-50/80 px-2 py-0.5 rounded-md border border-blue-200/60 text-[11px]">
                              {formatSalaryRange(app.salary_min, app.salary_max, app.salary_currency)}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">{isKhmer ? 'ចរចា' : 'Negotiable'}</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {getDynamicStatusBadge(app.status)}
                        </td>
                        <td className="py-3 px-4 hidden lg:table-cell text-slate-400 text-[11px]">
                          {new Date(app.created_at).toLocaleDateString(isKhmer ? 'km-KH' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Link
                            to={`/jobs/${app.job_slug}`}
                            className="inline-flex items-center px-2.5 py-1 rounded-lg bg-white/80 hover:bg-blue-600 hover:text-white text-slate-600 border border-slate-200/70 text-[11px] font-semibold transition-all shadow-2xs"
                          >
                            <span>{isKhmer ? 'មើល' : 'View'}</span>
                            <ExternalLink className="w-3 h-3 ml-1" />
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
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                  {isKhmer ? 'ការងារណែនាំសម្រាប់អ្នក' : 'Recommended Jobs'}
                </h3>
                <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
                  {isKhmer ? 'ស្របតាមជំនាញ និងទីតាំងរបស់អ្នក' : 'Matching your experience and preferences'}
                </p>
              </div>
              <Link to="/jobs" className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition">
                {isKhmer ? 'មើលបន្ថែម' : 'Explore more'} &rarr;
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {recommendedJobs.slice(0, 3).map((job) => (
                <Link
                  key={job.id}
                  to={`/jobs/${job.slug}`}
                  className="glass-card-hover p-3.5 rounded-xl border border-white/90 shadow-2xs hover:border-blue-400/60 transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-1">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-700 border border-blue-400/20 uppercase tracking-wide inline-block">
                      {job.category_name_en || 'Opportunity'}
                    </span>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-blue-600 transition line-clamp-1 mt-1">
                      {job.title}
                    </h4>
                    <p className="text-xs text-slate-500 truncate">{job.company_name}</p>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-blue-600 font-semibold">
                      {formatSalaryRange(job.salary_min, job.salary_max, job.salary_currency, job.is_salary_negotiable)}
                    </span>
                    <span className="text-slate-400 text-[11px]">{job.province}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (1/3): Profile Strength & Shortcuts */}
        <div className="space-y-4 sm:space-y-5">
          {/* Profile Strength Card */}
          <div className="glass-card rounded-2xl border border-white/90 shadow-sm p-4 sm:p-5 space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                {isKhmer ? 'កម្រិតបំពេញ CV' : 'Profile Strength'}
              </h3>
              <span className="text-xs sm:text-sm font-bold text-blue-600">{profileScore}%</span>
            </div>

            {/* Progress Bar with luminous gradient track */}
            <div className="w-full bg-slate-200/50 backdrop-blur-xs rounded-full h-2.5 p-0.5 overflow-hidden border border-white/80">
              <div
                className="bg-gradient-to-r from-blue-600 to-indigo-600 h-full rounded-full transition-all duration-500 shadow-2xs"
                style={{ width: `${profileScore}%` }}
              />
            </div>

            <p className="text-[11px] sm:text-xs text-slate-500 leading-relaxed">
              {isKhmer
                ? 'បំពេញប្រវត្តិរូបឱ្យបានពេញលេញ ដើម្បីបង្កើនឱកាសទទួលបានការសម្ភាសន៍។'
                : 'Complete your profile credentials to increase recruiter profile visibility.'}
            </p>

            <div className="space-y-2 text-xs font-medium">
              <div className="flex items-center space-x-2 text-slate-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>{isKhmer ? 'គណនីបានផ្ទៀងផ្ទាត់' : 'Account active & verified'}</span>
              </div>
              <div className="flex items-center space-x-2 text-slate-700">
                {profile?.headline ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                ) : (
                  <div className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0" />
                )}
                <span>{isKhmer ? 'ចំណងជើង និងសេចក្ដីសង្ខេប' : 'Professional summary'}</span>
              </div>
              <div className="flex items-center space-x-2 text-slate-700">
                {profile?.work_experiences && profile.work_experiences.length > 0 ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                ) : (
                  <div className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0" />
                )}
                <span>{isKhmer ? 'បទពិសោធន៍ការងារ' : 'Work experience'}</span>
              </div>
              <div className="flex items-center space-x-2 text-slate-700">
                {profile?.educations && profile.educations.length > 0 ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                ) : (
                  <div className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0" />
                )}
                <span>{isKhmer ? 'កម្រិតវប្បធម៌' : 'Education history'}</span>
              </div>
              <div className="flex items-center space-x-2 text-slate-700">
                {profile?.skills && profile.skills.length > 0 ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                ) : (
                  <div className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0" />
                )}
                <span>{isKhmer ? 'ជំនាញឯកទេស' : 'Key skills listed'}</span>
              </div>
            </div>

            <Link
              to="/seeker/profile"
              className="w-full py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-semibold text-xs shadow-xs transition flex items-center justify-center space-x-1.5 cursor-pointer mt-2"
            >
              <span>{isKhmer ? 'កែសម្រួលប្រវត្តិរូប' : 'Update Profile'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Quick Links Card */}
          <div className="glass-card rounded-2xl border border-white/90 shadow-sm p-4 sm:p-5 space-y-1">
            <span className="px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              {isKhmer ? 'ផ្លូវកាត់' : 'Quick Links'}
            </span>
            <Link
              to="/seeker/saved"
              className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-white/80 border border-transparent hover:border-white/80 text-xs font-medium text-slate-700 hover:text-blue-600 transition shadow-2xs hover:shadow-xs"
            >
              <div className="flex items-center space-x-2.5">
                <Bookmark className="w-4 h-4 text-blue-600" />
                <span>{isKhmer ? 'ការងាររក្សាទុក' : 'Saved Vacancies'}</span>
              </div>
              <span className="text-[10px] font-semibold text-blue-600 bg-blue-500/10 border border-blue-400/20 px-2 py-0.5 rounded-full">{savedCount}</span>
            </Link>
            <Link
              to="/seeker/profile"
              className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-white/80 border border-transparent hover:border-white/80 text-xs font-medium text-slate-700 hover:text-blue-600 transition shadow-2xs hover:shadow-xs"
            >
              <div className="flex items-center space-x-2.5">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>{isKhmer ? 'គ្រប់គ្រងឯកសារ CV' : 'Manage Resume Files'}</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            </Link>
            <Link
              to="/seeker/notifications"
              className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-white/80 border border-transparent hover:border-white/80 text-xs font-medium text-slate-700 hover:text-blue-600 transition shadow-2xs hover:shadow-xs"
            >
              <div className="flex items-center space-x-2.5">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span>{isKhmer ? 'ការជូនដំណឹង' : 'Notifications'}</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
