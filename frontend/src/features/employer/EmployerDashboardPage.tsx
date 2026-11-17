import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth, useToast } from '../../app/providers'
import { employerService } from '../../services/employer.service'
import { companiesService } from '../../services/companies.service'
import { Job, Company, Application } from '../../types'
import { formatSalaryRange } from '../../utils/currency'
import { getAssetUrl } from '../../utils/assets'
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
  UserCheck,
  FileText,
  Video,
  Sparkles,
  Pencil,
  Calendar,
  Phone,
  Mail,
  Download,
  Check,
  Sun,
  Moon,
  Sunrise,
  Eye,
  Lightbulb,
} from 'lucide-react'

export const EmployerDashboardPage: React.FC = () => {
  const { user } = useAuth()
  const { toast } = useToast()
  const { i18n } = useTranslation()
  const isKhmer = i18n.language === 'km'

  const [jobs, setJobs] = useState<Job[]>([])
  const [company, setCompany] = useState<Company | null>(null)
  const [recentApplicants, setRecentApplicants] = useState<Application[]>([])
  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'draft' | 'closed'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [applicantFilter, setApplicantFilter] = useState<'all' | 'submitted' | 'interview' | 'offered'>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Candidate Quick Review Modal State
  const [selectedApplicant, setSelectedApplicant] = useState<any | null>(null)
  const [isUpdatingApplicant, setIsUpdatingApplicant] = useState(false)

  const fetchDashboardData = async (quiet = false) => {
    if (!quiet) setIsLoading(true)
    else setIsRefreshing(true)
    try {
      const [jobsData, comp, applicantsData] = await Promise.all([
        employerService.getEmployerJobs().catch(() => []),
        companiesService.getEmployerCompany().catch(() => null),
        employerService.getRecentApplicants().catch(() => []),
      ])
      setJobs(jobsData || [])
      setCompany(comp)
      setRecentApplicants(applicantsData || [])
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

  // Greeting helper based on local hour
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) {
      return {
        text: isKhmer ? 'អរុណសួស្តី' : 'Good morning',
        icon: Sunrise,
        color: 'text-amber-500',
      }
    }
    if (hour < 18) {
      return {
        text: isKhmer ? 'ទិវាសួស្តី' : 'Good afternoon',
        icon: Sun,
        color: 'text-amber-500',
      }
    }
    return {
      text: isKhmer ? 'សាយ័ណ្ហសួស្តី' : 'Good evening',
      icon: Moon,
      color: 'text-indigo-400',
    }
  }

  const greeting = getGreeting()
  const GreetingIcon = greeting.icon

  // Metrics
  const activeJobsCount = jobs.filter((j) => j.status === 'published').length
  const draftJobsCount = jobs.filter((j) => j.status === 'draft').length
  const closedJobsCount = jobs.filter((j) => j.status === 'closed').length
  const totalApplicationsCount = jobs.reduce((acc, j: any) => acc + (j.applications_count || 0), 0)

  // Funnel counts across recent applicants
  const screeningApplicantsCount = recentApplicants.filter((a) =>
    ['submitted', 'screening', 'reviewing'].includes(a.status)
  ).length
  const interviewApplicantsCount = recentApplicants.filter((a) =>
    ['shortlisted', 'interview', 'interview_scheduled'].includes(a.status) || Boolean((a as any).interview)
  ).length
  const hiredApplicantsCount = recentApplicants.filter((a) => a.status === 'offered').length

  // Extract upcoming scheduled interviews
  const upcomingInterviews = recentApplicants
    .filter((a: any) => a.interview && a.interview.scheduled_at)
    .map((a: any) => ({
      ...a.interview,
      applicant_name: a.applicant_name,
      applicant_avatar: a.applicant_avatar,
      applicant_email: a.applicant_email,
      job_title: a.job_title,
      job_id: a.job_id,
      application_id: a.id,
    }))
    .sort((x: any, y: any) => new Date(x.scheduled_at).getTime() - new Date(y.scheduled_at).getTime())

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

  const filteredApplicants = recentApplicants.filter((a) => {
    if (applicantFilter !== 'all') {
      if (applicantFilter === 'submitted' && !['submitted', 'screening', 'reviewing'].includes(a.status)) return false
      if (
        applicantFilter === 'interview' &&
        !['shortlisted', 'interview', 'interview_scheduled'].includes(a.status) &&
        !Boolean((a as any).interview)
      )
        return false
      if (applicantFilter === 'offered' && a.status !== 'offered') return false
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

  // Update candidate status directly from Quick Modal
  const handleUpdateStatus = async (appId: number, newStatus: string) => {
    setIsUpdatingApplicant(true)
    try {
      await employerService.updateApplicantStatus(appId, newStatus)
      setRecentApplicants((prev) =>
        prev.map((a) => (a.id === appId ? { ...a, status: newStatus as any } : a))
      )
      if (selectedApplicant && selectedApplicant.id === appId) {
        setSelectedApplicant({ ...selectedApplicant, status: newStatus })
      }
      toast.success(
        isKhmer ? 'បានធ្វើបច្ចុប្បន្នភាព' : 'Status Updated',
        isKhmer ? 'ស្ថានភាពបេក្ខជនត្រូវបានកែប្រែដោយជោគជ័យ' : 'Applicant status has been updated.'
      )
    } catch (err) {
      console.error('Failed to update status:', err)
      toast.error(
        isKhmer ? 'បរាជ័យ' : 'Error',
        isKhmer ? 'មិនអាចផ្លាស់ប្តូរស្ថានភាពបេក្ខជនបានទេ' : 'Failed to update candidate status.'
      )
    } finally {
      setIsUpdatingApplicant(false)
    }
  }

  const getDynamicStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>{isKhmer ? 'ផ្សាយផ្ទាល់' : 'Published'}</span>
          </span>
        )
      case 'closed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            <span>{isKhmer ? 'បានបិទ' : 'Closed'}</span>
          </span>
        )
      case 'draft':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span>{isKhmer ? 'សេចក្តីព្រាង' : 'Draft'}</span>
          </span>
        )
    }
  }

  const getApplicantStatusBadge = (status: string) => {
    switch (status) {
      case 'submitted':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            <span>{isKhmer ? 'បានដាក់' : 'Submitted'}</span>
          </span>
        )
      case 'screening':
      case 'reviewing':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span>{isKhmer ? 'កំពុងពិនិត្យ' : 'Reviewing'}</span>
          </span>
        )
      case 'shortlisted':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-teal-50 text-teal-700 border border-teal-200">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
            <span>{isKhmer ? 'សម្រាំង' : 'Shortlisted'}</span>
          </span>
        )
      case 'interview':
      case 'interview_scheduled':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
            <span>{isKhmer ? 'សម្ភាសន៍' : 'Interview'}</span>
          </span>
        )
      case 'offered':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            <span>{isKhmer ? 'ផ្តល់ការងារ' : 'Offered'}</span>
          </span>
        )
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <span>{isKhmer ? 'បដិសេធ' : 'Rejected'}</span>
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200 capitalize">
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
          {isKhmer ? 'កំពុងដំណើរការទាញយកទិន្នន័យជ្រើសរើសបុគ្គលិក...' : 'Loading recruitment overview...'}
        </p>
      </div>
    )
  }

  return (
    <div className="w-full space-y-4 sm:space-y-5 font-sans pb-16">
      {/* 1. Header Bar: Personalized Greeting, Enterprise Brand & Quick Actions */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-2xs relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5 min-w-0">
          <div className="w-12 h-12 rounded-2xl border border-gray-200 bg-slate-50 p-1.5 shrink-0 flex items-center justify-center overflow-hidden shadow-2xs">
            {company?.logo_url ? (
              <img src={getAssetUrl(company.logo_url)} alt={company.name} className="w-full h-full object-contain rounded-xl" />
            ) : (
              <Building className="w-6 h-6 text-blue-600" />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-xs font-semibold text-slate-500">
                <GreetingIcon className={`w-3.5 h-3.5 ${greeting.color}`} />
                <span>
                  {greeting.text}, {user?.full_name || 'Employer'}!
                </span>
              </span>
              {company?.verification_status === 'verified' ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  <span>{isKhmer ? 'ក្រុមហ៊ុនផ្ទៀងផ្ទាត់រួច' : 'Verified Enterprise'}</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                  <ShieldAlert className="w-3 h-3 text-amber-600" />
                  <span>{isKhmer ? 'រង់ចាំផ្ទៀងផ្ទាត់' : 'Pending Verification'}</span>
                </span>
              )}
            </div>

            <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight truncate mt-0.5">
              {company?.name || (isKhmer ? 'ផ្ទាំងគ្រប់គ្រងជ្រើសរើសបុគ្គលិក' : 'Recruitment Dashboard')}
            </h1>

            <p className="text-xs text-slate-500 mt-0.5">
              {isKhmer
                ? `កំពុងផ្សាយ ${activeJobsCount} ការងារសកម្ម និងទទួលបានពាក្យសុំសរុប ${totalApplicationsCount} នាក់។`
                : `Managing ${activeJobsCount} live vacancies with ${totalApplicationsCount} total candidate applications.`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto shrink-0 flex-wrap sm:flex-nowrap w-full md:w-auto">
          <button
            type="button"
            onClick={() => fetchDashboardData(true)}
            disabled={isRefreshing}
            className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-blue-600 border border-gray-200 text-xs font-medium transition shadow-2xs cursor-pointer"
            title={isKhmer ? 'ផ្ទុកទិន្នន័យឡើងវិញ' : 'Refresh'}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
          </button>

          <Link
            to="/employer/jobs"
            className="px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-blue-600 border border-gray-200 text-xs font-semibold transition shadow-2xs flex items-center space-x-1.5 cursor-pointer"
          >
            <Briefcase className="w-3.5 h-3.5 text-slate-500" />
            <span>{isKhmer ? 'ការងារទាំងអស់' : 'All Jobs'}</span>
          </Link>

          <Link
            to="/employer/jobs/new"
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-semibold transition shadow-2xs flex items-center space-x-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isKhmer ? 'ផ្សាយការងារថ្មី' : 'Post Vacancy'}</span>
          </Link>
        </div>
      </div>

      {/* Notification Alert Banner */}
      <DashboardNotificationAlert role="employer" />

      {/* Company Verification Guard Banner (if pending) */}
      {company && company.verification_status !== 'verified' && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
          <div className="flex items-start space-x-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-amber-900">
                {isKhmer ? 'ក្រុមហ៊ុនកំពុងរង់ចាំការអនុម័តពី Admin' : 'Company Awaiting Administrator Confirmation'}
              </h3>
              <p className="text-xs text-amber-800 leading-relaxed mt-0.5">
                {isKhmer
                  ? 'មានតែ Admin ប៉ុណ្ណោះដែលអាចបញ្ជាក់ និងអនុម័តក្រុមហ៊ុនឱ្យដំណើរការ និងផ្សាយការងារលើប្រព័ន្ធបាន។'
                  : 'Only the Platform Administrator can confirm and approve companies to publish live vacancies.'}
              </p>
            </div>
          </div>
          <Link
            to="/employer/company"
            className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-amber-300 text-xs font-semibold text-amber-900 transition shadow-2xs shrink-0 self-start sm:self-auto"
          >
            {isKhmer ? 'ពិនិត្យប្រវត្តិក្រុមហ៊ុន' : 'Review Profile'}
          </Link>
        </div>
      )}

      {/* 2. Four Interactive KPI Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Metric 1: Active Vacancies */}
        <Link
          to="/employer/jobs"
          className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 hover:border-blue-400 transition shadow-2xs group block"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 group-hover:text-slate-800 transition">
              {isKhmer ? 'ការងារកំពុងផ្សាយ' : 'Active Vacancies'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-slate-900 group-hover:text-blue-600 transition">
              {activeJobsCount}
            </span>
            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
              {isKhmer ? 'ផ្សាយផ្ទាល់' : 'Live'}
            </span>
          </div>
        </Link>

        {/* Metric 2: Total Candidates */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 hover:border-indigo-400 transition shadow-2xs group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 group-hover:text-slate-800 transition">
              {isKhmer ? 'បេក្ខជនសរុប' : 'Total Candidates'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-slate-900 group-hover:text-indigo-600 transition">
              {totalApplicationsCount}
            </span>
            <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
              {isKhmer ? 'ពាក្យសុំ' : 'Applicants'}
            </span>
          </div>
        </div>

        {/* Metric 3: Interviews Scheduled */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 hover:border-purple-400 transition shadow-2xs group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 group-hover:text-slate-800 transition">
              {isKhmer ? 'សម្ភាសន៍ដែលបានកំណត់' : 'Interviews'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition">
              <Video className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-slate-900 group-hover:text-purple-600 transition">
              {interviewApplicantsCount}
            </span>
            <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full">
              {upcomingInterviews.length} {isKhmer ? 'ជិតមកដល់' : 'Upcoming'}
            </span>
          </div>
        </div>

        {/* Metric 4: Hired / Offered */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 hover:border-emerald-400 transition shadow-2xs group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 group-hover:text-slate-800 transition">
              {isKhmer ? 'ផ្តល់ការងារជោគជ័យ' : 'Job Offers'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-slate-900 group-hover:text-emerald-600 transition">
              {hiredApplicantsCount}
            </span>
            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
              {isKhmer ? 'សម្រេចចិត្ត' : 'Accepted'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. NEW FEATURE: Upcoming Candidate Interviews Widget */}
      {upcomingInterviews.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2.5 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                <Calendar className="w-4 h-4" />
              </div>
              <h2 className="text-xs sm:text-sm font-bold text-slate-900">
                {isKhmer ? 'កាលវិភាគសម្ភាសន៍បេក្ខជនដែលជិតមកដល់' : 'Upcoming Candidate Interviews'}
              </h2>
            </div>
            <span className="text-[11px] text-purple-700 font-semibold bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
              {upcomingInterviews.length} {isKhmer ? 'កិច្ចសម្ភាសន៍' : 'Scheduled'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {upcomingInterviews.slice(0, 4).map((iv: any, idx: number) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl border border-gray-200 bg-slate-50/70 hover:bg-white hover:border-purple-300 transition flex items-start justify-between gap-3 shadow-2xs"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 truncate">{iv.applicant_name}</span>
                    <span className="text-[10px] px-2 py-0.2 rounded-md bg-purple-100 text-purple-800 font-semibold uppercase">
                      {iv.interview_type || 'Video'}
                    </span>
                  </div>
                  <p className="text-[11px] text-blue-600 font-medium truncate">{iv.job_title}</p>
                  <p className="text-[11px] text-slate-500 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>{new Date(iv.scheduled_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                  </p>
                </div>

                <div className="shrink-0 flex flex-col gap-1.5 items-end">
                  {iv.location_or_link ? (
                    <a
                      href={iv.location_or_link.startsWith('http') ? iv.location_or_link : `https://${iv.location_or_link}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-semibold transition shadow-2xs"
                    >
                      <Video className="w-3 h-3" />
                      <span>{isKhmer ? 'ចូលជួប' : 'Join'}</span>
                    </a>
                  ) : (
                    <span className="text-[10px] text-slate-400">In-person</span>
                  )}
                  <Link
                    to={`/employer/jobs/${iv.job_id}/applications`}
                    className="text-[10px] font-semibold text-slate-500 hover:text-blue-600"
                  >
                    {isKhmer ? 'មើលពាក្យសុំ →' : 'View Application →'}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Main 2-Column Split: Clean 2/3 (left) + 1/3 (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 items-start">
        {/* Left Column (2/3): Recent Applicants & Job Openings */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-5">
          {/* SECTION A: Recent Applicants Across All Vacancies */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xs sm:text-sm font-bold text-slate-900">
                    {isKhmer ? 'បេក្ខជនដាក់ពាក្យចុងក្រោយ' : 'Recent Candidate Applicants'}
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    {isKhmer ? 'បេក្ខជនដែលបានដាក់ពាក្យគ្រប់ការងាររបស់អ្នក' : 'Latest applications across all your job vacancies'}
                  </p>
                </div>
              </div>

              {/* Quick filter pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                {[
                  { id: 'all', label: isKhmer ? 'ទាំងអស់' : 'All', count: recentApplicants.length },
                  { id: 'submitted', label: isKhmer ? 'ថ្មី' : 'New', count: screeningApplicantsCount },
                  { id: 'interview', label: isKhmer ? 'សម្ភាសន៍' : 'Interview', count: interviewApplicantsCount },
                  { id: 'offered', label: isKhmer ? 'ផ្តល់ការងារ' : 'Offered', count: hiredApplicantsCount },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setApplicantFilter(tab.id as any)}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold transition shrink-0 cursor-pointer ${
                      applicantFilter === tab.id
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-gray-200'
                    }`}
                  >
                    {tab.label} ({tab.count})
                  </button>
                ))}
              </div>
            </div>

            {filteredApplicants.length === 0 ? (
              <div className="py-10 text-center px-4 space-y-2">
                <Users className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs text-slate-500 font-medium">
                  {isKhmer ? 'មិនទាន់មានបេក្ខជនដាក់ពាក្យនៅឡើយទេ' : 'No candidate applications received yet.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/70 border-b border-gray-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-2.5 px-4">{isKhmer ? 'បេក្ខជន' : 'Applicant'}</th>
                      <th className="py-2.5 px-4">{isKhmer ? 'ការងារដាក់ពាក្យ' : 'Applied Position'}</th>
                      <th className="py-2.5 px-4 hidden sm:table-cell">{isKhmer ? 'ប្រាក់ខែរំពឹង' : 'Expected'}</th>
                      <th className="py-2.5 px-4">{isKhmer ? 'ស្ថានភាព' : 'Status'}</th>
                      <th className="py-2.5 px-4 text-right">{isKhmer ? 'សកម្មភាព' : 'Action'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs">
                    {filteredApplicants.slice(0, 6).map((app: any) => (
                      <tr key={app.id} className="hover:bg-slate-50/60 transition group">
                        <td className="py-2.5 px-4">
                          <div className="flex items-center space-x-2.5">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500/20 to-blue-500/20 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0 border border-indigo-200">
                              {app.applicant_name?.charAt(0)?.toUpperCase() || 'C'}
                            </div>
                            <div className="min-w-0">
                              <span className="font-bold text-slate-900 group-hover:text-indigo-600 block truncate max-w-[130px]">
                                {app.applicant_name}
                              </span>
                              <span className="text-[10px] text-slate-400 block truncate max-w-[130px]">
                                {app.applicant_province || 'Cambodia'}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 px-4">
                          <Link
                            to={`/employer/jobs/${app.job_id}/applications`}
                            className="font-medium text-slate-800 hover:text-blue-600 transition truncate max-w-[160px] block"
                          >
                            {app.job_title}
                          </Link>
                        </td>
                        <td className="py-2.5 px-4 hidden sm:table-cell text-slate-600">
                          {app.expected_salary ? (
                            <span className="font-semibold text-emerald-700 font-mono text-[11px]">
                              ${app.expected_salary}/mo
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">-</span>
                          )}
                        </td>
                        <td className="py-2.5 px-4">{getApplicantStatusBadge(app.status)}</td>
                        <td className="py-2.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* 1-Click Quick Review Modal Button */}
                            <button
                              type="button"
                              onClick={() => setSelectedApplicant(app)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-[11px] font-semibold transition cursor-pointer"
                              title={isKhmer ? 'ពិនិត្យ និងប្តូរស្ថានភាពបេក្ខជនរហ័ស' : 'Quick review candidate'}
                            >
                              <Eye className="w-3 h-3" />
                              <span>{isKhmer ? 'ពិនិត្យ' : 'Quick Review'}</span>
                            </button>
                            <Link
                              to={`/employer/jobs/${app.job_id}/applications`}
                              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 border border-gray-200 transition"
                              title={isKhmer ? 'ទៅកាន់បញ្ជីបេក្ខជនពេញលេញ' : 'Go to candidate pool'}
                            >
                              <ExternalLink className="w-3 h-3" />
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

          {/* SECTION B: Job Vacancies Table (with Direct Edit Links!) */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
            {/* Header + Tabs */}
            <div className="p-4 sm:p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xs sm:text-sm font-bold text-slate-900">
                  {isKhmer ? 'ការងារដែលបានផ្សាយ និងបេក្ខជន' : 'Job Openings & Candidate Pipeline'}
                </h2>
                <p className="text-[11px] text-slate-500">
                  {isKhmer ? 'គ្រប់គ្រងការផ្សាយការងារ និងពិនិត្យបេក្ខជនដាក់ពាក្យ' : 'Review candidate applications and manage live vacancies'}
                </p>
              </div>

              {/* Status Filter Tabs */}
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
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-gray-200'
                    }`}
                  >
                    {tab.label} ({tab.count})
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Search */}
            <div className="px-4 sm:px-5 py-2.5 bg-slate-50/60 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="relative flex-1 max-w-md">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={isKhmer ? 'ស្វែងរកតាមចំណងជើងការងារ ឬទីតាំង...' : 'Search by job title or location...'}
                  className="w-full pl-9 pr-7 py-1.5 bg-white border border-gray-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition shadow-2xs"
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
              <div className="text-center py-12 px-4 space-y-2">
                <Briefcase className="w-8 h-8 text-slate-300 mx-auto" />
                <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                  {isKhmer ? 'មិនមានការងារក្នុងបញ្ជីនេះទេ' : 'No job vacancies found in this view'}
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {isKhmer ? 'បង្កើតការងារថ្មី ដើម្បីទាក់ទាញបេក្ខជនមានសមត្ថភាព។' : 'Post a job opening to start receiving candidate applications.'}
                </p>
                <Link
                  to="/employer/jobs/new"
                  className="inline-flex items-center px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold mt-1 hover:bg-blue-700 transition shadow-2xs gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isKhmer ? 'ផ្សាយការងារថ្មី' : 'Post Vacancy'}</span>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/70 border-b border-gray-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-2.5 px-4">{isKhmer ? 'តំណែងការងារ' : 'Job Vacancy'}</th>
                      <th className="py-2.5 px-4 hidden md:table-cell">{isKhmer ? 'ទីតាំង' : 'Location'}</th>
                      <th className="py-2.5 px-4 hidden sm:table-cell">{isKhmer ? 'បៀវត្សរ៍' : 'Salary'}</th>
                      <th className="py-2.5 px-4">{isKhmer ? 'ស្ថានភាព' : 'Status'}</th>
                      <th className="py-2.5 px-4 text-center">{isKhmer ? 'បេក្ខជន' : 'Applicants'}</th>
                      <th className="py-2.5 px-4 text-right">{isKhmer ? 'សកម្មភាព' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs">
                    {filteredJobs.slice(0, 6).map((job: any) => (
                      <tr key={job.id} className="hover:bg-slate-50/60 transition group">
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
                          <span className="text-emerald-700 font-semibold text-[11px]">
                            {formatSalaryRange(job.salary_min, job.salary_max, job.salary_currency, job.is_salary_negotiable)}
                          </span>
                        </td>
                        <td className="py-3 px-4">{getDynamicStatusBadge(job.status)}</td>
                        <td className="py-3 px-4 text-center">
                          <Link
                            to={`/employer/jobs/${job.id}/applications`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold transition shadow-2xs"
                          >
                            <Users className="w-3.5 h-3.5 text-indigo-600" />
                            <span>{job.applications_count || 0}</span>
                          </Link>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            {/* Direct Modify / Edit Button */}
                            <Link
                              to={`/employer/jobs/${job.id}/edit`}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 border border-blue-200 rounded-lg transition shadow-2xs"
                              title={isKhmer ? 'កែសម្រួលការងារ' : 'Edit Vacancy'}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Link>
                            <Link
                              to={`/employer/jobs/${job.id}/applications`}
                              className="px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-blue-600 hover:text-white text-slate-700 border border-gray-200 text-[11px] font-semibold transition shadow-2xs"
                            >
                              {isKhmer ? 'បេក្ខជន' : 'Candidates'}
                            </Link>
                            <Link
                              to={`/jobs/${job.slug}`}
                              target="_blank"
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-50 border border-gray-200 rounded-lg transition shadow-2xs"
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
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs p-4 sm:p-5 space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                {isKhmer ? 'កម្រិតបំពេញព័ត៌មានក្រុមហ៊ុន' : 'Profile Strength'}
              </h3>
              <span className="text-xs sm:text-sm font-bold text-blue-600">{companyScore}%</span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-100 rounded-full h-2.5 p-0.5 overflow-hidden border border-gray-200">
              <div
                className="bg-gradient-to-r from-blue-600 to-indigo-600 h-full rounded-full transition-all duration-500 shadow-2xs"
                style={{ width: `${companyScore}%` }}
              />
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
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
            </div>

            <Link
              to="/employer/company"
              className="w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-2xs transition flex items-center justify-center space-x-1.5 cursor-pointer mt-2"
            >
              <span>{isKhmer ? 'កែសម្រួលព័ត៌មានក្រុមហ៊ុន' : 'Update Company Profile'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* AI Hiring Tip Card */}
          <div className="bg-gradient-to-br from-indigo-50/70 to-blue-50/70 rounded-2xl border border-indigo-200/80 p-4 sm:p-5 space-y-2.5 shadow-2xs">
            <div className="flex items-center gap-2 text-indigo-800">
              <Lightbulb className="w-4 h-4 text-indigo-600" />
              <h4 className="text-xs font-bold">{isKhmer ? 'គន្លឹះជ្រើសរើសបុគ្គលិកឆ្នើម' : 'Smart Hiring Insights'}</h4>
            </div>
            <p className="text-[11px] text-indigo-900 leading-relaxed font-normal">
              {isKhmer
                ? 'ការបញ្ជាក់ចន្លោះប្រាក់បៀវត្សច្បាស់លាស់ និងជំនាញចាំបាច់ អាចជួយបង្កើនអត្រាបេក្ខជនដាក់ពាក្យដែលមានសមត្ថភាពរហូតដល់ទៅ ៤៥%។'
                : 'Posting transparent salary ranges and adding at least 3 required skills increases relevant candidate applications by up to 45%.'}
            </p>
          </div>

          {/* Quick Management Shortcuts */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs p-4 sm:p-5 space-y-1">
            <span className="px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              {isKhmer ? 'ផ្លូវកាត់គ្រប់គ្រង' : 'Management Shortcuts'}
            </span>
            <Link
              to="/employer/jobs/new"
              className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-slate-50 text-xs font-medium text-slate-700 hover:text-blue-600 transition"
            >
              <div className="flex items-center space-x-2.5">
                <PlusCircle className="w-4 h-4 text-blue-600" />
                <span>{isKhmer ? 'ចុះផ្សាយការងារថ្មី' : 'Post New Vacancy'}</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            </Link>
            <Link
              to="/employer/jobs"
              className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-slate-50 text-xs font-medium text-slate-700 hover:text-blue-600 transition"
            >
              <div className="flex items-center space-x-2.5">
                <Briefcase className="w-4 h-4 text-blue-600" />
                <span>{isKhmer ? 'គ្រប់គ្រងការងារទាំងអស់' : 'Manage All Vacancies'}</span>
              </div>
              <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                {jobs.length}
              </span>
            </Link>
            <Link
              to="/employer/company"
              className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-slate-50 text-xs font-medium text-slate-700 hover:text-blue-600 transition"
            >
              <div className="flex items-center space-x-2.5">
                <Building className="w-4 h-4 text-blue-600" />
                <span>{isKhmer ? 'ព័ត៌មានស្ថាប័ន' : 'Company Settings'}</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            </Link>
            <Link
              to="/jobs"
              className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-slate-50 text-xs font-medium text-slate-700 hover:text-blue-600 transition"
            >
              <div className="flex items-center space-x-2.5">
                <Search className="w-4 h-4 text-blue-600" />
                <span>{isKhmer ? 'ស្វែងរកការងារលើគេហទំព័រ' : 'Explore Public Jobs'}</span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-slate-300" />
            </Link>
          </div>
        </div>
      </div>

      {/* QUICK CANDIDATE REVIEW MODAL */}
      {selectedApplicant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 max-w-lg w-full shadow-2xl space-y-4 font-sans">
            <div className="flex items-start justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-indigo-500/20 to-blue-500/20 text-indigo-700 font-bold text-base flex items-center justify-center shrink-0 border border-indigo-200">
                  {selectedApplicant.applicant_name?.charAt(0)?.toUpperCase() || 'C'}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{selectedApplicant.applicant_name}</h3>
                  <p className="text-xs text-blue-600 font-medium">{selectedApplicant.job_title}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedApplicant(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Applicant details */}
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-50 border border-gray-100">
                <div className="flex items-center space-x-1.5 text-slate-600">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span className="truncate">{selectedApplicant.applicant_email || 'No email'}</span>
                </div>
                <div className="flex items-center space-x-1.5 text-slate-600">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span className="truncate">{selectedApplicant.applicant_phone || 'No phone'}</span>
                </div>
                <div className="flex items-center space-x-1.5 text-slate-600">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{selectedApplicant.applicant_province || 'Cambodia'}</span>
                </div>
                <div className="flex items-center space-x-1.5 text-slate-600">
                  <span className="font-semibold text-emerald-700">
                    {selectedApplicant.expected_salary ? `$${selectedApplicant.expected_salary}/mo` : 'Negotiable'}
                  </span>
                </div>
              </div>

              {selectedApplicant.applicant_headline && (
                <div>
                  <span className="font-semibold text-slate-700 block mb-0.5">
                    {isKhmer ? 'ចំណងជើងវិជ្ជាជីវៈ' : 'Professional Headline'}:
                  </span>
                  <p className="text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-gray-100 leading-relaxed">
                    {selectedApplicant.applicant_headline}
                  </p>
                </div>
              )}

              {selectedApplicant.cover_letter && (
                <div>
                  <span className="font-semibold text-slate-700 block mb-0.5">
                    {isKhmer ? 'លិខិតអមពាក្យសុំ (Cover Letter)' : 'Cover Letter'}:
                  </span>
                  <p className="text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-gray-100 leading-relaxed max-h-32 overflow-y-auto">
                    {selectedApplicant.cover_letter}
                  </p>
                </div>
              )}

              {/* Status Selector */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  {isKhmer ? 'ប្តូរស្ថានភាពបេក្ខជន' : 'Update Candidate Stage'}:
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'reviewing', label: isKhmer ? 'កំពុងពិនិត្យ' : 'Reviewing', color: 'amber' },
                    { id: 'shortlisted', label: isKhmer ? 'សម្រាំង' : 'Shortlisted', color: 'teal' },
                    { id: 'interview', label: isKhmer ? 'សម្ភាសន៍' : 'Interview', color: 'indigo' },
                    { id: 'offered', label: isKhmer ? 'ផ្តល់ការងារ' : 'Offer Job', color: 'emerald' },
                    { id: 'rejected', label: isKhmer ? 'បដិសេធ' : 'Reject', color: 'rose' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      disabled={isUpdatingApplicant}
                      onClick={() => handleUpdateStatus(selectedApplicant.id, s.id)}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition border cursor-pointer ${
                        selectedApplicant.status === s.id
                          ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                          : 'bg-white hover:bg-slate-50 text-slate-700 border-gray-200'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
              <Link
                to={`/employer/jobs/${selectedApplicant.job_id}/applications`}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <span>{isKhmer ? 'មើលក្នុងបញ្ជីបេក្ខជនពេញលេញ →' : 'View Full Candidate Dossier →'}</span>
              </Link>
              <button
                type="button"
                onClick={() => setSelectedApplicant(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition cursor-pointer"
              >
                {isKhmer ? 'បិទ' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
