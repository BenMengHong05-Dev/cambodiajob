import React, { useEffect, useState } from 'react'
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { jobsService } from '../../services/jobs.service'
import { seekerService } from '../../services/seeker.service'
import { Job, Resume } from '../../types'
import { useAuth, usePreferences, useToast } from '../../app/providers'
import { formatSalaryRange } from '../../utils/currency'
import {
  MapPin,
  Building2,
  Briefcase,
  Bookmark,
  Share2,
  CheckCircle2,
  ShieldCheck,
  FileText,
  AlertCircle,
  X,
  ExternalLink,
  ChevronRight,
  Sparkles,
} from 'lucide-react'

export const JobDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>()
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const { toast } = useToast()
  const { currency } = usePreferences()
  const navigate = useNavigate()
  const location = useLocation()

  const [job, setJob] = useState<Job | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Apply Modal state
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false)
  const [resumes, setResumes] = useState<Resume[]>([])
  const [selectedResumeId, setSelectedResumeId] = useState<number | null>(null)
  const [coverLetter, setCoverLetter] = useState('')
  const [isSubmittingApply, setIsSubmittingApply] = useState(false)
  const [applySuccess, setApplySuccess] = useState(false)
  const [applyError, setApplyError] = useState<string | null>(null)

  const isKhmer = i18n.language === 'km'

  useEffect(() => {
    if (!slug) return
    const fetchJob = async () => {
      setIsLoading(true)
      try {
        const data = await jobsService.getJobBySlug(slug)
        setJob(data)
      } catch (err: any) {
        setError(err.response?.data?.error || 'Job not found.')
      } finally {
        setIsLoading(false)
      }
    }
    fetchJob()
  }, [slug])

  // Fetch candidate resumes when opening modal
  const openApplyModal = async () => {
    if (!user) {
      navigate('/login', { state: { from: { pathname: `/jobs/${slug}` } } })
      return
    }
    if (!user.roles.includes('job_seeker') && !user.roles.includes('admin')) {
      toast.info(
        isKhmer ? 'សម្រាប់តែបេក្ខជនស្វែងរកការងារ' : 'Job Seekers Only',
        isKhmer
          ? 'មានតែគណនីបេក្ខជនប៉ុណ្ណោះដែលអាចដាក់ពាក្យសុំការងារបាន។'
          : 'Only job seeker accounts can submit applications.'
      )
      return
    }

    setIsApplyModalOpen(true)
    setApplyError(null)
    setApplySuccess(false)
    try {
      const res = await seekerService.getResumes()
      setResumes(res)
      if (res.length > 0) {
        const primary = res.find((r) => r.is_primary) || res[0]
        setSelectedResumeId(primary.id)
      }
    } catch (err) {
      console.error('Failed to load candidate resumes:', err)
    }
  }

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!job) return
    setIsSubmittingApply(true)
    setApplyError(null)
    try {
      await jobsService.applyJob(job.id, {
        resume_id: selectedResumeId,
        cover_letter: coverLetter,
      })
      setApplySuccess(true)
      setJob((prev) => (prev ? { ...prev, has_applied: true } : prev))
      setTimeout(() => {
        setIsApplyModalOpen(false)
      }, 1800)
    } catch (err: any) {
      setApplyError(err.response?.data?.error || err.response?.data?.details || 'Failed to submit application.')
    } finally {
      setIsSubmittingApply(false)
    }
  }

  const handleToggleSave = async () => {
    if (!job) return
    if (!user) {
      navigate('/login', { state: { from: location } })
      return
    }
    if (!user.roles.includes('job_seeker') && !user.roles.includes('admin')) {
      toast.info(
        isKhmer ? 'សម្រាប់តែបេក្ខជនស្វែងរកការងារ' : 'Job Seekers Only',
        isKhmer
          ? 'មានតែគណនីបេក្ខជនប៉ុណ្ណោះដែលអាចរក្សាទុកការងារបាន។'
          : 'Only job seeker accounts can save and bookmark job vacancies.'
      )
      return
    }
    const isCurrentlySaved = !!job.is_saved
    // Optimistic update
    setJob((prev) => (prev ? { ...prev, is_saved: !isCurrentlySaved } : prev))
    try {
      const updated = await jobsService.toggleSaveJob(job.id, isCurrentlySaved)
      setJob((prev) => (prev ? { ...prev, is_saved: updated } : prev))
      toast.success(
        !isCurrentlySaved
          ? isKhmer ? 'បានរក្សាទុកការងារ' : 'Job Saved'
          : isKhmer ? 'បានដកការងារចេញ' : 'Job Removed',
        !isCurrentlySaved
          ? isKhmer ? 'ការងារត្រូវបានបន្ថែមក្នុងបញ្ជីរក្សាទុករបស់អ្នក។' : 'Vacancy added to your saved jobs.'
          : isKhmer ? 'ការងារត្រូវបានដកចេញពីបញ្ជីរក្សាទុក។' : 'Vacancy removed from your saved list.'
      )
    } catch (err) {
      console.error('Failed to toggle save:', err)
      setJob((prev) => (prev ? { ...prev, is_saved: isCurrentlySaved } : prev))
    }
  }

  const handleShareJob = async () => {
    const url = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({
          title: job?.title || 'Job Vacancy',
          text: `Job Opportunity: ${job?.title} at ${job?.company_name}`,
          url: url,
        })
        return
      } catch (err) {
        // Fallback to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(url)
      toast.success(
        isKhmer ? 'បានចម្លងតំណភ្ជាប់' : 'Link Copied',
        isKhmer ? 'តំណភ្ជាប់ការងារត្រូវបានចម្លងទៅ Clipboard!' : 'Job link copied to clipboard!'
      )
    } catch (err) {
      toast.info(isKhmer ? 'តំណភ្ជាប់:' : 'Job Link:', url)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-3 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-xs text-slate-400">
          {isKhmer ? 'កំពុងផ្ទុកទិន្នន័យ...' : 'Loading...'}
        </p>
      </div>
    )
  }

  if (error || !job) {
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center">
        <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-900 mb-1">
          {isKhmer ? 'រកមិនឃើញឱកាសការងារនេះទេ' : 'Job Vacancy Not Found'}
        </h2>
        <p className="text-xs text-slate-500 mb-6">
          {error || (isKhmer ? 'ការងារនេះលែងមាន ឬត្រូវបានបិទ។' : 'This vacancy is no longer available.')}
        </p>
        <Link
          to="/jobs"
          className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition"
        >
          {isKhmer ? 'ត្រឡប់ទៅបញ្ជីការងារ' : 'Back to Jobs'}
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 sm:pt-7 space-y-6">

        {/* Clean Breadcrumbs */}
        <nav className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
          <Link to="/" className="hover:text-slate-600 transition">
            {isKhmer ? 'ទំព័រដើម' : 'Home'}
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <Link to="/jobs" className="hover:text-slate-600 transition">
            {isKhmer ? 'ស្វែងរកការងារ' : 'Jobs'}
          </Link>
          {job.category_name_km || job.category_name_en ? (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
              <span className="text-slate-600 truncate max-w-[200px]">
                {isKhmer && job.category_name_km ? job.category_name_km : job.category_name_en}
              </span>
            </>
          ) : null}
        </nav>

        {/* ================= CLEAN HEADER CARD ================= */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-7 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5">
            
            {/* Logo + Title + Metadata */}
            <div className="flex items-start gap-4 sm:gap-5 min-w-0">
              <img
                src={
                  job.company_logo ||
                  'https://images.unsplash.com/photo-1541746972996-4e0b0f43e02a?w=120&h=120&fit=crop'
                }
                alt={job.company_name}
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-contain border border-slate-200/70 p-1 bg-white shrink-0 shadow-2xs"
              />

              <div className="min-w-0 space-y-1">
                {/* Company Name & Verified */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Link
                    to={`/companies/${job.company_slug}`}
                    className="text-xs sm:text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline inline-flex items-center gap-1"
                  >
                    <span>{job.company_name}</span>
                    {job.company_verification === 'verified' && (
                      <span title="Verified Employer">
                        <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      </span>
                    )}
                  </Link>

                  {(job.category_name_km || job.category_name_en) && (
                    <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium">
                      {isKhmer && job.category_name_km ? job.category_name_km : job.category_name_en}
                    </span>
                  )}
                </div>

                {/* Job Title */}
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-tight">
                  {isKhmer && job.title_km ? job.title_km : job.title}
                </h1>

                {/* Metadata Row */}
                <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{job.province}{job.city ? `, ${job.city}` : ''}</span>
                  </span>
                  <span>•</span>
                  <span className="capitalize">{job.employment_type.replace('_', ' ')}</span>
                  <span>•</span>
                  <span className="capitalize">{job.workplace_type.replace('_', ' ')}</span>
                  <span>•</span>
                  <span className="capitalize">{job.experience_level.replace('_', ' ')}</span>
                </div>
              </div>
            </div>

            {/* Compact Action Buttons */}
            <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto pt-2 sm:pt-0">
              {/* Share Button */}
              <button
                type="button"
                onClick={handleShareJob}
                className="p-2.5 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50 text-slate-600 hover:text-blue-600 transition cursor-pointer"
                title={isKhmer ? 'ចែករំលែក' : 'Share Vacancy'}
              >
                <Share2 className="w-4 h-4" />
              </button>

              {/* Bookmark Button */}
              <button
                type="button"
                onClick={handleToggleSave}
                className={`p-2.5 rounded-xl border transition cursor-pointer ${
                  job.is_saved
                    ? 'bg-amber-50 text-amber-600 border-amber-200'
                    : 'bg-white text-slate-600 border-slate-200/80 hover:bg-slate-50'
                }`}
                title={job.is_saved ? 'Saved' : 'Save'}
              >
                <Bookmark className={`w-4 h-4 ${job.is_saved ? 'fill-current text-amber-500' : ''}`} />
              </button>

              {/* Admin Moderation Shortcut */}
              {user?.roles?.includes('admin') && (
                <Link
                  to="/admin/jobs"
                  className="px-3.5 py-2 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold hover:bg-blue-100 transition flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                  <span>{isKhmer ? 'ត្រួតពិនិត្យការងារ (Admin)' : 'Moderate (Admin)'}</span>
                </Link>
              )}

              {/* Employer Manage Shortcut */}
              {user?.roles?.includes('employer') && user.company?.id === job.company_id && (
                <Link
                  to="/employer/jobs"
                  className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition flex items-center gap-1.5"
                >
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>{isKhmer ? 'គ្រប់គ្រងការងារនេះ' : 'Manage'}</span>
                </Link>
              )}

              {/* Compact Apply Button */}
              {job.has_applied ? (
                <div className="px-3.5 py-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{t('jobs.applied')}</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={openApplyModal}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <span>{t('jobs.applyNow')}</span>
                </button>
              )}
            </div>
          </div>

          {/* Clean 4-Item Summary Row */}
          <div className="mt-6 pt-5 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                {isKhmer ? 'ប្រាក់បៀវត្សរ៍ប្រចាំខែ' : 'Monthly Salary'}
              </span>
              <span className="text-sm font-bold text-blue-600 mt-0.5 block truncate">
                {formatSalaryRange(
                  job.salary_min,
                  job.salary_max,
                  job.salary_currency,
                  job.is_salary_negotiable,
                  t('jobs.negotiable')
                )}
              </span>
            </div>

            <div>
              <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                {isKhmer ? 'បទពិសោធន៍' : 'Experience'}
              </span>
              <span className="text-sm font-semibold text-slate-800 mt-0.5 block capitalize truncate">
                {job.experience_level.replace('_', ' ')}
              </span>
            </div>

            <div>
              <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                {isKhmer ? 'ចំនួនជ្រើសរើស' : 'Vacancies'}
              </span>
              <span className="text-sm font-semibold text-slate-800 mt-0.5 block truncate">
                {job.vacancies_count} {t('jobs.vacancies')}
              </span>
            </div>

            <div>
              <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                {isKhmer ? 'កម្រិតអប់រំ' : 'Education'}
              </span>
              <span className="text-sm font-semibold text-slate-800 mt-0.5 block truncate">
                {job.education_level || (isKhmer ? 'មិនកំណត់' : 'Not Specified')}
              </span>
            </div>
          </div>
        </div>

        {/* ================= 2-COLUMN CONTENT ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Left Column: Job Description, Requirements, Skills (2/3 width) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-7 shadow-2xs space-y-6">
              
              {/* Job Description */}
              <div>
                <h2 className="text-sm font-bold text-slate-900 mb-3">
                  {t('jobs.description')}
                </h2>
                <div className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line font-normal">
                  {isKhmer && job.description_km ? job.description_km : job.description}
                </div>
              </div>

              {/* Requirements (if available) */}
              {job.requirements && (
                <div className="pt-6 border-t border-slate-100">
                  <h2 className="text-sm font-bold text-slate-900 mb-3">
                    {t('jobs.requirements')}
                  </h2>
                  <div className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line font-normal">
                    {job.requirements}
                  </div>
                </div>
              )}

              {/* Skills Badges */}
              {job.skills && job.skills.length > 0 && (
                <div className="pt-6 border-t border-slate-100">
                  <h2 className="text-sm font-bold text-slate-900 mb-3">
                    {t('jobs.skills')}
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {job.skills.map((skill) => (
                      <span
                        key={skill.id}
                        className="px-3 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200/60"
                      >
                        {skill.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: About Company & Related Jobs (1/3 width) */}
          <div className="space-y-6">
            
            {/* About Company Card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {isKhmer ? 'អំពីក្រុមហ៊ុន' : 'About Company'}
              </h3>

              <div className="flex items-center gap-3">
                <img
                  src={
                    job.company_logo ||
                    'https://images.unsplash.com/photo-1541746972996-4e0b0f43e02a?w=120&h=120&fit=crop'
                  }
                  alt={job.company_name}
                  className="w-11 h-11 rounded-xl object-contain border border-slate-200/70 p-0.5 shrink-0"
                />
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 truncate">
                    {job.company_name}
                  </h4>
                  <p className="text-[11px] text-slate-400 truncate">
                    {job.province || 'Cambodia'}
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">
                {job.company_description ||
                  (isKhmer
                    ? 'សហគ្រាសឈានមុខគេកំពុងប្រតិបត្តិការនៅកម្ពុជា។'
                    : 'Leading enterprise operating in Cambodia.')}
              </p>

              <div className="space-y-2 pt-1">
                {job.company_website && (
                  <a
                    href={job.company_website}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-slate-200/80 hover:bg-slate-50 text-slate-700 text-xs font-medium transition"
                  >
                    <span>{isKhmer ? 'គេហទំព័រក្រុមហ៊ុន' : 'Visit Website'}</span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                  </a>
                )}

                <Link
                  to={`/companies/${job.company_slug}`}
                  className="w-full inline-flex items-center justify-center py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-xs font-medium transition text-center"
                >
                  {isKhmer ? 'មើលប្រវត្តិក្រុមហ៊ុន' : 'View Company Profile'}
                </Link>
              </div>
            </div>

            {/* Similar Vacancies (if any) */}
            {job.related_jobs && job.related_jobs.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {isKhmer ? 'ការងារស្រដៀងគ្នា' : 'Similar Vacancies'}
                </h3>
                <div className="space-y-2.5">
                  {job.related_jobs.map((rel: any) => (
                    <Link
                      key={rel.id}
                      to={`/jobs/${rel.slug}`}
                      className="block p-3 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition"
                    >
                      <h4 className="text-xs font-semibold text-slate-900 line-clamp-1 hover:text-blue-600">
                        {rel.title}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {rel.company_name} • {rel.province}
                      </p>
                      <span className="text-[11px] font-bold text-blue-600 mt-1 block">
                        {formatSalaryRange(rel.salary_min, rel.salary_max, rel.salary_currency, false)}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ================= APPLY MODAL ================= */}
      {isApplyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl relative border border-slate-100 animate-in zoom-in-95 duration-150">
            <button
              type="button"
              onClick={() => setIsApplyModalOpen(false)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-5">
              <span className="text-[11px] font-semibold text-blue-600 block">
                {job.company_name}
              </span>
              <h3 className="text-base font-bold text-slate-900 mt-0.5">
                {isKhmer ? 'ដាក់ពាក្យសម្រាប់មុខតំណែង' : 'Apply for'} {job.title}
              </h3>
            </div>

            {applySuccess ? (
              <div className="py-6 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h4 className="text-sm font-bold text-slate-900">
                  {isKhmer ? 'ពាក្យសុំត្រូវបានបញ្ជូនដោយជោគជ័យ!' : 'Application Submitted!'}
                </h4>
                <p className="text-xs text-slate-500">
                  {isKhmer
                    ? `អ្នកជ្រើសរើសបុគ្គលិកនៅ ${job.company_name} បានទទួលពាក្យសុំរបស់អ្នករួចរាល់ហើយ។`
                    : `Recruiter at ${job.company_name} has received your application.`}
                </p>
              </div>
            ) : (
              <form onSubmit={handleApplySubmit} className="space-y-4">
                {applyError && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
                    {applyError}
                  </div>
                )}

                {/* CV Selection */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    {isKhmer ? 'ជ្រើសរើស CV / Resume *' : 'Select CV / Resume *'}
                  </label>
                  {resumes.length === 0 ? (
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
                      {isKhmer
                        ? 'អ្នកមិនទាន់មាន CV ក្នុងគណនីទេ។ '
                        : "You haven't uploaded a CV yet. "}
                      <Link to="/seeker/profile" className="font-semibold underline text-blue-600">
                        {isKhmer ? 'បញ្ចូល CV' : 'Upload CV'}
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                      {resumes.map((r) => (
                        <label
                          key={r.id}
                          className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition text-xs ${
                            selectedResumeId === r.id
                              ? 'border-blue-500 bg-blue-50/50'
                              : 'border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            <input
                              type="radio"
                              name="selectedResume"
                              checked={selectedResumeId === r.id}
                              onChange={() => setSelectedResumeId(r.id)}
                              className="text-blue-600"
                            />
                            <FileText className="w-4 h-4 text-slate-400" />
                            <span className="font-medium text-slate-800">{r.title}</span>
                          </div>
                          {r.is_primary && (
                            <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-blue-100 text-blue-700 rounded">
                              Primary
                            </span>
                          )}
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                {/* Cover Letter */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    {isKhmer
                      ? 'កំណត់ចំណាំផ្ញើទៅអ្នកជ្រើសរើស (ជម្រើស)'
                      : 'Cover Letter / Note (Optional)'}
                  </label>
                  <textarea
                    rows={3}
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value)}
                    placeholder={
                      isKhmer
                        ? 'សរសេរណែនាំអំពីខ្លួនអ្នកសង្ខេប...'
                        : 'Brief note to introduce yourself...'
                    }
                    className="w-full p-2.5 text-xs border border-slate-200 rounded-xl outline-none focus:border-blue-500 transition"
                  />
                </div>

                <div className="flex items-center justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsApplyModalOpen(false)}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                  >
                    {isKhmer ? 'បោះបង់' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingApply || (resumes.length === 0 && !selectedResumeId)}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmittingApply
                      ? isKhmer ? 'កំពុងបញ្ជូន...' : 'Submitting...'
                      : isKhmer ? 'បញ្ជូនពាក្យសុំ' : 'Submit Application'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
