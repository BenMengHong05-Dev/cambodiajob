import React, { useEffect, useState } from 'react'
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { jobsService } from '../../services/jobs.service'
import { seekerService } from '../../services/seeker.service'
import { aiService } from '../../services/ai.service'
import { Job, Resume, SeekerProfile } from '../../types'
import { useAuth, usePreferences, useToast } from '../../app/providers'
import { formatSalaryRange } from '../../utils/currency'
import { getAssetUrl } from '../../utils/assets'
import { FacebookVerifiedBadge } from '../../components/common/FacebookVerifiedBadge'
import {
  MapPin,
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
  Target,
  Check,
  DollarSign,
  Award,
  GraduationCap,
  Users,
  Layers,
  Building2,
  ArrowRight,
  Send,
  UploadCloud,
  Plus,
  Loader2,
  Lock,
  FileUp,
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
  const [isUploadingResume, setIsUploadingResume] = useState(false)
  const [showUploadBox, setShowUploadBox] = useState(false)

  // AI & Candidate state
  const [seekerProfile, setSeekerProfile] = useState<SeekerProfile | null>(null)
  const [isGeneratingCoverLetter, setIsGeneratingCoverLetter] = useState(false)

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

  // Optionally fetch seeker profile to compute live AI match score & assist cover letters
  useEffect(() => {
    if (user && (user.roles.includes('job_seeker') || user.roles.includes('admin'))) {
      seekerService
        .getProfile()
        .then((p) => setSeekerProfile(p))
        .catch(() => { })
    }
  }, [user])

  const handleGenerateAICoverLetter = async () => {
    if (!job) return
    setIsGeneratingCoverLetter(true)
    try {
      const skills = seekerProfile?.skills?.map((s) => s.name) || []
      const res = await aiService.generateCoverLetter({
        job_title: isKhmer && job.title_km ? job.title_km : job.title,
        company_name: job.company_name || 'Hiring Team',
        job_description: isKhmer && job.description_km ? job.description_km : job.description,
        candidate_name: user?.full_name || 'Candidate',
        candidate_skills: skills,
        is_khmer: isKhmer,
      })
      if (res) {
        setCoverLetter(res)
        toast.success(
          isKhmer ? '✨ លិខិតត្រូវបានបង្កើត' : '✨ Cover Letter Generated',
          isKhmer
            ? 'លិខិតណែនាំខ្លួនត្រូវបានបង្កើតដោយ AI តាមការងារនេះ!'
            : 'AI has drafted a tailored cover letter!'
        )
      }
    } catch (err: any) {
      toast.error(
        isKhmer ? 'បរាជ័យក្នុងការបង្កើត' : 'Generation Failed',
        err.response?.data?.error || 'Could not generate cover letter.'
      )
    } finally {
      setIsGeneratingCoverLetter(false)
    }
  }

  // Fetch candidate resumes when opening modal
  const openApplyModal = async () => {
    if (!user) {
      navigate('/login', { state: { from: { pathname: `/jobs/${slug}` } } })
      return false
    }
    if (!user.roles.includes('job_seeker') && !user.roles.includes('admin')) {
      toast.info(
        isKhmer ? 'សម្រាប់តែបេក្ខជនស្វែងរកការងារ' : 'Job Seekers Only',
        isKhmer
          ? 'មានតែគណនីបេក្ខជនប៉ុណ្ណោះដែលអាចដាក់ពាក្យសុំការងារបាន។'
          : 'Only job seeker accounts can submit applications.'
      )
      return false
    }

    setIsApplyModalOpen(true)
    setApplyError(null)
    setApplySuccess(false)
    setShowUploadBox(false)
    try {
      const res = await seekerService.getResumes()
      setResumes(res)
      if (res.length > 0) {
        const primary = res.find((r) => r.is_primary) || res[0]
        setSelectedResumeId(primary.id)
      } else {
        setShowUploadBox(true)
      }
    } catch (err) {
      console.error('Failed to load candidate resumes:', err)
      setShowUploadBox(true)
    }
    return true
  }

  // Upload other CV directly from modal dialog
  const handleDirectResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validation
    const allowed = ['.pdf', '.doc', '.docx']
    const ext = '.' + file.name.split('.').pop()?.toLowerCase()
    if (!allowed.includes(ext)) {
      toast.error(
        isKhmer ? 'ប្រភេទឯកសារមិនត្រឹមត្រូវ' : 'Invalid File Type',
        isKhmer ? 'សូមជ្រើសរើសឯកសារជា PDF ឬ DOCX' : 'Please upload a PDF or DOCX file.'
      )
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error(
        isKhmer ? 'ទំហំឯកសារធំពេក' : 'File Too Large',
        isKhmer ? 'ឯកសារត្រូវមានទំហំតូចជាង 5MB' : 'File must be under 5MB.'
      )
      return
    }

    setIsUploadingResume(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('title', file.name)
      const newResume = await seekerService.uploadResume(formData)

      // Update resumes list and automatically select this new resume
      setResumes((prev) => [newResume, ...prev.filter((r) => r.id !== newResume.id)])
      setSelectedResumeId(newResume.id)
      setShowUploadBox(false)

      toast.success(
        isKhmer ? '✨ ផ្ទុកឡើង CV បានជោគជ័យ' : '✨ Resume Uploaded',
        isKhmer
          ? `ឯកសារ "${file.name}" ត្រូវបានជ្រើសរើសសម្រាប់ការដាក់ពាក្យនេះ!`
          : `"${file.name}" is selected for this application!`
      )
    } catch (err: any) {
      toast.error(
        isKhmer ? 'បរាជ័យក្នុងការផ្ទុកឡើង' : 'Upload Failed',
        err.response?.data?.file || err.response?.data?.error || 'Could not upload resume.'
      )
    } finally {
      setIsUploadingResume(false)
      if (e.target) e.target.value = ''
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
      setApplyError(
        err.response?.data?.error || err.response?.data?.details || 'Failed to submit application.'
      )
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
    setJob((prev) => (prev ? { ...prev, is_saved: !isCurrentlySaved } : prev))
    try {
      const updated = await jobsService.toggleSaveJob(job.id, isCurrentlySaved)
      setJob((prev) => (prev ? { ...prev, is_saved: updated } : prev))
      toast.success(
        !isCurrentlySaved
          ? isKhmer
            ? 'បានរក្សាទុកការងារ'
            : 'Job Saved'
          : isKhmer
            ? 'បានដកការងារចេញ'
            : 'Job Removed',
        !isCurrentlySaved
          ? isKhmer
            ? 'ការងារត្រូវបានបន្ថែមក្នុងបញ្ជីរក្សាទុករបស់អ្នក។'
            : 'Vacancy added to your saved jobs.'
          : isKhmer
            ? 'ការងារត្រូវបានដកចេញពីបញ្ជីរក្សាទុក។'
            : 'Vacancy removed from your saved list.'
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
          url,
        })
        return
      } catch {
        // Fallback to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(url)
      toast.success(
        isKhmer ? 'បានចម្លងតំណភ្ជាប់' : 'Link Copied',
        isKhmer ? 'តំណភ្ជាប់ការងារត្រូវបានចម្លងទៅ Clipboard!' : 'Job link copied to clipboard!'
      )
    } catch {
      toast.info(isKhmer ? 'តំណភ្ជាប់:' : 'Job Link:', url)
    }
  }

  // Compute AI match percentage once
  const computeMatchScore = (currentJob: Job) => {
    const cSkills = (seekerProfile?.skills || []).map((s) => s.name.toLowerCase())
    const jSkills = (currentJob.skills || []).map((s) => s.name.toLowerCase())
    if (jSkills.length === 0) return 90
    const matches = jSkills.filter((s) => cSkills.includes(s))
    return Math.max(35, Math.min(98, Math.round((matches.length / jSkills.length) * 100) || 75))
  }

  // ================= SKELETON LOADING STATE =================
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50/70 pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6 animate-pulse">
          <div className="h-4 w-48 bg-slate-200 rounded-md" />
          <div className="bg-white rounded-2xl border border-slate-200/80 p-7 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-2xl bg-slate-200 shrink-0" />
                <div className="space-y-2.5">
                  <div className="h-5 w-28 bg-slate-200 rounded-lg" />
                  <div className="h-7 w-72 bg-slate-200 rounded-lg" />
                  <div className="h-4 w-56 bg-slate-200 rounded-md" />
                </div>
              </div>
              <div className="flex gap-2">
                <div className="w-10 h-10 bg-slate-200 rounded-xl" />
                <div className="w-10 h-10 bg-slate-200 rounded-xl" />
                <div className="w-28 h-10 bg-slate-200 rounded-xl" />
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-100">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 bg-slate-100 rounded-xl" />
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-96 bg-white rounded-2xl border border-slate-200/80" />
            <div className="space-y-6">
              <div className="h-56 bg-white rounded-2xl border border-slate-200/80" />
              <div className="h-56 bg-white rounded-2xl border border-slate-200/80" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ================= ERROR / NOT FOUND STATE =================
  if (error || !job) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 bg-slate-50/50">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200/80 p-8 text-center shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-1.5">
            {isKhmer ? 'រកមិនឃើញឱកាសការងារនេះទេ' : 'Job Vacancy Not Found'}
          </h2>
          <p className="text-sm text-slate-500 mb-6 leading-relaxed">
            {error ||
              (isKhmer
                ? 'ការងារនេះលែងមាន ឬត្រូវបានបិទដោយក្រុមហ៊ុន។'
                : 'This vacancy may have been filled, expired, or removed.')}
          </p>
          <Link
            to="/jobs"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition shadow-xs"
          >
            <span>{isKhmer ? 'ស្វែងរកការងារផ្សេងទៀត' : 'Browse All Jobs'}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    )
  }

  const matchScore = computeMatchScore(job)
  const displayTitle = isKhmer && job.title_km ? job.title_km : job.title
  const displayCategory =
    isKhmer && job.category_name_km ? job.category_name_km : job.category_name_en

  return (
    <div className="min-h-screen bg-slate-50/70 pb-24 sm:pb-16">
      {/* Subtle Top Decorative Backdrop */}
      <div className="h-36 bg-gradient-to-b from-blue-50/80 via-indigo-50/30 to-transparent pointer-events-none absolute inset-x-0 top-0" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 sm:pt-7 space-y-6">
        {/* ================= BREADCRUMBS ================= */}
        <nav className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
          <Link to="/" className="hover:text-blue-600 transition">
            {isKhmer ? 'ទំព័រដើម' : 'Home'}
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <Link to="/jobs" className="hover:text-blue-600 transition">
            {isKhmer ? 'ស្វែងរកការងារ' : 'Jobs'}
          </Link>
          {displayCategory && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
              <span className="text-slate-700 truncate max-w-[220px]">{displayCategory}</span>
            </>
          )}
        </nav>

        {/* ================= HERO HEADER CARD ================= */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">

          <div className="p-5 sm:p-7">
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
              {/* Left: Company Logo + Title + Badges */}
              <div className="flex items-start gap-4 sm:gap-5 min-w-0 flex-1">

                <div className="min-w-0 space-y-2 flex-1">
                  {/* Category + Company Name Row */}
                  <div className="flex flex-wrap items-center gap-2">
                    {displayCategory && (
                      <span className="inline-flex items-center text-[11px] px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/70 font-semibold">
                        {displayCategory}
                      </span>
                    )}
                    <Link
                      to={`/companies/${job.company_slug}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-blue-600 transition"
                    >
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>{job.company_name}</span>
                      {job.company_verification === 'verified' && (
                        <FacebookVerifiedBadge className="w-3.5 h-3.5 shrink-0" title={isKhmer ? 'ក្រុមហ៊ុនផ្ទៀងផ្ទាត់ផ្លូវការ' : 'Verified Employer'} />
                      )}
                    </Link>
                  </div>

                  {/* Job Title */}
                  <h1 className="text-xl sm:text-2xl lg:text-[26px] font-bold text-slate-900 tracking-tight leading-snug">
                    {displayTitle}
                  </h1>

                  {/* Metadata Pills */}
                  <div className="flex flex-wrap items-center gap-2 pt-0.5 text-xs text-slate-600">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100/80 text-slate-700 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                      <span>
                        {job.province}
                        {job.city ? `, ${job.city}` : ''}
                      </span>
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100/80 text-slate-700 font-medium capitalize">
                      <Briefcase className="w-3.5 h-3.5 text-slate-500" />
                      <span>{job.employment_type.replace('_', ' ')}</span>
                    </span>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-indigo-50/70 text-indigo-700 font-medium capitalize">
                      {job.workplace_type.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right: Action Buttons */}
              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={handleShareJob}
                  className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-blue-600 transition cursor-pointer"
                  title={isKhmer ? 'ចែករំលែក' : 'Share Vacancy'}
                >
                  <Share2 className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={handleToggleSave}
                  className={`inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${job.is_saved
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  title={job.is_saved ? 'Saved' : 'Save'}
                >
                  <Bookmark
                    className={`w-4 h-4 ${job.is_saved ? 'fill-amber-500 text-amber-500' : ''}`}
                  />
                  <span className="hidden sm:inline">
                    {job.is_saved
                      ? isKhmer
                        ? 'បានរក្សាទុក'
                        : 'Saved'
                      : isKhmer
                        ? 'រក្សាទុក'
                        : 'Save'}
                  </span>
                </button>

                {/* Admin Moderation Shortcut */}
                {user?.roles?.includes('admin') && (
                  <Link
                    to="/admin/jobs"
                    className="px-3.5 py-2.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold hover:bg-blue-100 transition flex items-center gap-1.5"
                  >
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                    <span>{isKhmer ? 'ត្រួតពិនិត្យ' : 'Moderate'}</span>
                  </Link>
                )}

                {/* Employer Manage Shortcut */}
                {user?.roles?.includes('employer') && user.company?.id === job.company_id && (
                  <Link
                    to="/employer/jobs"
                    className="px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition flex items-center gap-1.5"
                  >
                    <Briefcase className="w-3.5 h-3.5" />
                    <span>{isKhmer ? 'គ្រប់គ្រងការងារនេះ' : 'Manage Job'}</span>
                  </Link>
                )}

                {/* Primary Apply Button (Desktop/Tablet) */}
                {job.has_applied ? (
                  <div className="px-4 py-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs sm:text-sm font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>{t('jobs.applied')}</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={openApplyModal}
                    className="hidden sm:inline-flex px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition shadow-sm shadow-blue-600/20 items-center gap-2 cursor-pointer"
                  >
                    <span>{t('jobs.applyNow')}</span>
                    <Send className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* 4-Card Key Highlights Strip */}
            <div className="mt-6 pt-5 border-t border-slate-100 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {/* Salary Card */}
              <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-blue-50/60 border border-blue-100/80">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <span className="block text-[11px] font-semibold text-blue-700/70 uppercase tracking-wider">
                    {isKhmer ? 'ប្រាក់បៀវត្សរ៍ប្រចាំខែ' : 'Monthly Salary'}
                  </span>
                  <span className="text-sm font-bold text-blue-700 block truncate mt-0.5">
                    {formatSalaryRange(
                      job.salary_min,
                      job.salary_max,
                      job.salary_currency || currency,
                      job.is_salary_negotiable,
                      t('jobs.negotiable')
                    )}
                  </span>
                </div>
              </div>

              {/* Experience Card */}
              <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/60">
                <div className="w-10 h-10 rounded-xl bg-white text-indigo-600 border border-slate-200/80 flex items-center justify-center shrink-0">
                  <Award className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    {isKhmer ? 'បទពិសោធន៍' : 'Experience'}
                  </span>
                  <span className="text-sm font-semibold text-slate-800 block capitalize truncate mt-0.5">
                    {job.experience_level.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {/* Vacancies Card */}
              <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/60">
                <div className="w-10 h-10 rounded-xl bg-white text-emerald-600 border border-slate-200/80 flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    {isKhmer ? 'ចំនួនជ្រើសរើស' : 'Vacancies'}
                  </span>
                  <span className="text-sm font-semibold text-slate-800 block truncate mt-0.5">
                    {job.vacancies_count} {t('jobs.vacancies')}
                  </span>
                </div>
              </div>

              {/* Education Card */}
              <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/60">
                <div className="w-10 h-10 rounded-xl bg-white text-amber-600 border border-slate-200/80 flex items-center justify-center shrink-0">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    {isKhmer ? 'កម្រិតអប់រំ' : 'Education'}
                  </span>
                  <span className="text-sm font-semibold text-slate-800 block truncate mt-0.5">
                    {job.education_level || (isKhmer ? 'មិនកំណត់' : 'Not Specified')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ================= MAIN 2-COLUMN CONTENT ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left Column: Description, Requirements, Skills (2/3 width) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-8 space-y-8">
              {/* Job Description */}
              <section>
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <FileText className="w-4 h-4" />
                  </div>
                  <h2 className="text-base font-bold text-slate-900">{t('jobs.description')}</h2>
                </div>
                {(() => {
                  const desc = isKhmer && job.description_km ? job.description_km : job.description
                  if (desc && /<[a-z][\s\S]*>/i.test(desc)) {
                    return (
                      <div
                        className="text-sm sm:text-[15px] text-slate-600 leading-7 font-normal space-y-2 [&>p]:mb-2 [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:list-decimal [&>ol]:pl-5"
                        dangerouslySetInnerHTML={{ __html: desc }}
                      />
                    )
                  }
                  return (
                    <div className="text-sm sm:text-[15px] text-slate-600 leading-7 whitespace-pre-line font-normal">
                      {desc}
                    </div>
                  )
                })()}
              </section>

              {/* Requirements */}
              {job.requirements && (
                <section className="pt-7 border-t border-slate-100">
                  <div className="flex items-center gap-2.5 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <Layers className="w-4 h-4" />
                    </div>
                    <h2 className="text-base font-bold text-slate-900">{t('jobs.requirements')}</h2>
                  </div>
                  {/<[a-z][\s\S]*>/i.test(job.requirements) ? (
                    <div
                      className="text-sm sm:text-[15px] text-slate-600 leading-7 font-normal space-y-2 [&>p]:mb-2 [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:list-decimal [&>ol]:pl-5"
                      dangerouslySetInnerHTML={{ __html: job.requirements }}
                    />
                  ) : (
                    <div className="text-sm sm:text-[15px] text-slate-600 leading-7 whitespace-pre-line font-normal">
                      {job.requirements}
                    </div>
                  )}
                </section>
              )}

              {/* Skills Badges */}
              {job.skills && job.skills.length > 0 && (
                <section className="pt-7 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <h2 className="text-base font-bold text-slate-900">{t('jobs.skills')}</h2>
                    </div>
                    <span className="text-xs text-slate-400 font-medium">
                      {job.skills.length} {isKhmer ? 'ជំនាញ' : 'skills'}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {job.skills.map((skill) => {
                      const hasSkill = (seekerProfile?.skills || []).some(
                        (cs) => cs.name.toLowerCase() === skill.name.toLowerCase()
                      )
                      return (
                        <span
                          key={skill.id}
                          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition ${hasSkill
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-50 text-slate-700 border-slate-200/80 hover:border-slate-300'
                            }`}
                        >
                          {hasSkill && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                          <span>{skill.name}</span>
                        </span>
                      )
                    })}
                  </div>
                </section>
              )}

              {/* Bottom In-Article Call-to-Action */}
              {!job.has_applied && (
                <div className="pt-7 border-t border-slate-100">
                  <div className="rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 p-5 sm:p-6 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <h3 className="text-sm sm:text-base font-bold">
                        {isKhmer
                          ? 'ចាប់អារម្មណ៍នឹងមុខតំណែងនេះមែនទេ?'
                          : 'Interested in this opportunity?'}
                      </h3>
                      <p className="text-xs text-slate-300">
                        {isKhmer
                          ? `ដាក់ពាក្យឥឡូវនេះ ដើម្បីភ្ជាប់ទំនាក់ទំនងជាមួយ ${job.company_name}`
                          : `Submit your CV directly to ${job.company_name} in under a minute.`}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={openApplyModal}
                      className="shrink-0 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-semibold transition cursor-pointer shadow-sm"
                    >
                      <span>{t('jobs.applyNow')}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Sticky Sidebar (1/3 width) */}
          <div className="space-y-6 lg:sticky lg:top-6">

            {/* About Company Card */}
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-4">
              <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                {isKhmer ? 'អំពីក្រុមហ៊ុន' : 'About Company'}
              </h3>

              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-full border border-slate-200/80 p-0.5 bg-white shrink-0 overflow-hidden shadow-2xs flex items-center justify-center">
                  <img
                    src={
                      getAssetUrl(job.company_logo) ||
                      'https://images.unsplash.com/photo-1541746972996-4e0b0f43e02a?w=120&h=120&fit=crop'
                    }
                    alt={job.company_name}
                    className="w-full h-full rounded-full object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-slate-900 truncate flex items-center gap-1.5">
                    <span className="truncate">{job.company_name}</span>
                    {job.company_verification === 'verified' && (
                      <FacebookVerifiedBadge className="w-4 h-4 shrink-0" title={isKhmer ? 'ក្រុមហ៊ុនផ្ទៀងផ្ទាត់ផ្លូវការ' : 'Verified Employer'} />
                    )}
                  </h4>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 truncate">
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                    <span>{job.province || 'Cambodia'}</span>
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                {job.company_description ||
                  (isKhmer
                    ? 'សហគ្រាសឈានមុខគេកំពុងប្រតិបត្តិការនៅកម្ពុជា។'
                    : 'Leading enterprise operating in Cambodia.')}
              </p>

              <div className="grid grid-cols-1 gap-2 pt-1">
                {job.company_website && (
                  <a
                    href={job.company_website}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition"
                  >
                    <span>{isKhmer ? 'គេហទំព័រក្រុមហ៊ុន' : 'Visit Website'}</span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                  </a>
                )}

                <Link
                  to={`/companies/${job.company_slug}`}
                  className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-800 text-xs font-semibold transition"
                >
                  <span>{isKhmer ? 'មើលប្រវត្តិក្រុមហ៊ុន' : 'View Company Profile'}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                </Link>
              </div>
            </div>

            {/* Similar Vacancies */}
            {job.related_jobs && job.related_jobs.length > 0 && (
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-3.5">
                <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  {isKhmer ? 'ការងារស្រដៀងគ្នា' : 'Similar Vacancies'}
                </h3>
                <div className="space-y-2.5">
                  {job.related_jobs.map((rel: any) => (
                    <Link
                      key={rel.id}
                      to={`/jobs/${rel.slug}`}
                      className="group block p-3.5 rounded-2xl border border-slate-200 hover:border-blue-200 hover:bg-blue-50/30 transition"
                    >
                      <h4 className="text-xs font-bold text-slate-900 line-clamp-1 group-hover:text-blue-600 transition">
                        {rel.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-1 truncate">
                        {rel.company_name} • {rel.province}
                      </p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-[11px] font-bold text-blue-600">
                          {formatSalaryRange(
                            rel.salary_min,
                            rel.salary_max,
                            rel.salary_currency,
                            false
                          )}
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition" />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ================= MOBILE STICKY BOTTOM BAR ================= */}
      <div className="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-3 flex items-center gap-2.5 shadow-lg">
        <button
          type="button"
          onClick={handleToggleSave}
          className={`p-3 rounded-xl border transition cursor-pointer ${job.is_saved
            ? 'bg-amber-50 text-amber-600 border-amber-200'
            : 'bg-white text-slate-600 border-slate-200'
            }`}
          aria-label="Save Job"
        >
          <Bookmark className={`w-5 h-5 ${job.is_saved ? 'fill-amber-500 text-amber-500' : ''}`} />
        </button>

        {job.has_applied ? (
          <div className="flex-1 py-3 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-sm font-semibold flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{t('jobs.applied')}</span>
          </div>
        ) : (
          <button
            type="button"
            onClick={openApplyModal}
            className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition shadow-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>{t('jobs.applyNow')}</span>
            <Send className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* ================= APPLY MODAL DIALOG ================= */}
      {isApplyModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl relative border border-gray-100 animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
            
            {/* Top Gradient Accent Bar */}
            <div className="h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 shrink-0" />

            {/* Modal Header */}
            <div className="px-6 py-5 bg-slate-50/80 border-b border-slate-100 flex items-start justify-between gap-4 shrink-0">
              <div className="min-w-0">
                <div className="flex items-center gap-1 text-xs font-bold text-blue-600">
                  <span className="truncate">{job.company_name}</span>
                  {job.company_verification === 'verified' && (
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  )}
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate mt-0.5">
                  {isKhmer ? 'ដាក់ពាក្យសម្រាប់' : 'Apply for'} {displayTitle}
                </h3>
                <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                  <span className="capitalize">{job.employment_type.replace('_', ' ')}</span>
                  <span>•</span>
                  <span className="capitalize">{job.workplace_type.replace('_', ' ')}</span>
                  <span>•</span>
                  <span>{job.province}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsApplyModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-5">
              {applySuccess ? (
                <div className="py-8 text-center space-y-3">
                  <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-2xs">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <h4 className="text-lg font-extrabold text-slate-900">
                    {isKhmer ? 'ពាក្យសុំត្រូវបានបញ្ជូនដោយជោគជ័យ!' : 'Application Submitted!'}
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
                    {isKhmer
                      ? `អ្នកជ្រើសរើសបុគ្គលិកនៅ ${job.company_name} បានទទួលពាក្យសុំរបស់អ្នករួចរាល់ហើយ។ យើងនឹងជូនដំណឹងអ្នកភ្លាមៗនៅពេលមានការឆ្លើយតប។`
                      : `The hiring team at ${job.company_name} has received your application. You will be notified of any updates.`}
                  </p>
                  <div className="pt-3">
                    <button
                      type="button"
                      onClick={() => setIsApplyModalOpen(false)}
                      className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold transition shadow-xs cursor-pointer"
                    >
                      {isKhmer ? 'បិទផ្ទាំងនេះ' : 'Done & Close'}
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleApplySubmit} className="space-y-5">
                  {applyError && (
                    <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{applyError}</span>
                    </div>
                  )}

                  {/* CV Selection & Choose Other / Upload Section */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-blue-600" />
                        <span>{isKhmer ? 'ជ្រើសរើស CV / Resume *' : 'Select CV / Resume *'}</span>
                      </label>
                    </div>

                    {/* Show Direct File Upload Box */}
                    {showUploadBox || resumes.length === 0 ? (
                      <div className="space-y-2">
                        <div className="relative border-2 border-dashed border-blue-300 hover:border-blue-500 bg-blue-50/40 hover:bg-blue-50/70 rounded-2xl p-5 text-center transition cursor-pointer group">
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx"
                            onChange={handleDirectResumeUpload}
                            disabled={isUploadingResume}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
                          />
                          {isUploadingResume ? (
                            <div className="py-3 flex flex-col items-center space-y-2">
                              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                              <p className="text-xs font-bold text-blue-700">
                                {isKhmer ? 'កំពុងផ្ទុកឡើង និងភ្ជាប់ CV...' : 'Uploading and attaching resume...'}
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto group-hover:scale-105 transition shadow-2xs">
                                <UploadCloud className="w-6 h-6" />
                              </div>
                              <div>
                                <p className="text-xs sm:text-sm font-bold text-slate-800">
                                  {isKhmer ? 'ចុចដើម្បីជ្រើសរើស CV ពីកុំព្យូទ័រ' : 'Click to select CV from your device'}
                                </p>
                                <p className="text-[11px] text-slate-500 mt-0.5">
                                  {isKhmer
                                    ? 'ឬអូសទម្លាក់ឯកសារទីនេះ • គាំទ្រ PDF, DOCX (ក្រោម 5MB)'
                                    : 'or drag & drop file here • PDF, DOCX supported (under 5MB)'}
                                </p>
                              </div>
                              <span className="inline-block px-3 py-1 rounded-lg text-[11px] font-semibold bg-white border border-slate-200 text-slate-700 shadow-2xs">
                                {isKhmer ? 'ជ្រើសរើសឯកសារ' : 'Browse File'}
                              </span>
                            </div>
                          )}
                        </div>

                        {resumes.length > 0 && (
                          <div className="text-center pt-1">
                            <button
                              type="button"
                              onClick={() => setShowUploadBox(false)}
                              className="text-xs font-semibold text-slate-500 hover:text-blue-600 underline cursor-pointer"
                            >
                              ← {isKhmer ? 'ត្រឡប់ទៅជ្រើសរើស CV ក្នុងបញ្ជី' : 'Back to saved resumes'}
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      /* Show Saved Resumes Radio List */
                      <div className="space-y-2">
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                          {resumes.map((r) => {
                            const isSelected = selectedResumeId === r.id
                            const fileSizeFormatted = r.file_size
                              ? `${(r.file_size / 1024).toFixed(0)} KB`
                              : null

                            return (
                              <label
                                key={r.id}
                                onClick={() => setSelectedResumeId(r.id)}
                                className={`flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition ${
                                  isSelected
                                    ? 'border-blue-500 bg-blue-50/50 shadow-2xs ring-2 ring-blue-500/20'
                                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/70'
                                }`}
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  {/* Custom Styled Radio */}
                                  <div
                                    className={`w-4 h-4 rounded-full border flex items-center justify-center transition shrink-0 ${
                                      isSelected
                                        ? 'border-blue-600 bg-blue-600'
                                        : 'border-slate-300 bg-white'
                                    }`}
                                  >
                                    {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                                  </div>

                                  {/* File Icon */}
                                  <div className="w-9 h-9 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-red-600 shrink-0">
                                    <FileText className="w-4 h-4" />
                                  </div>

                                  {/* Title & Meta */}
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                                        {r.title || r.file_name}
                                      </span>
                                      {r.is_primary && (
                                        <span className="px-1.5 py-0.5 text-[10px] font-bold bg-blue-100 text-blue-700 rounded-md shrink-0">
                                          Primary
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                                      {fileSizeFormatted && <span>{fileSizeFormatted}</span>}
                                      {r.created_at && (
                                        <>
                                          <span>•</span>
                                          <span>{new Date(r.created_at).toLocaleDateString()}</span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Active Checkmark Badge */}
                                {isSelected && (
                                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                                    <Check className="w-3.5 h-3.5" />
                                  </div>
                                )}
                              </label>
                            )
                          })}
                        </div>

                        {/* Quick Trigger to Upload Another CV */}
                        <div className="flex items-center justify-between pt-1 px-1">
                          <span className="text-[11px] text-slate-400">
                            {isKhmer ? 'ចង់ប្រើប្រាស់ឯកសារ CV ផ្សេង?' : 'Want to use a different CV?'}
                          </span>
                          <button
                            type="button"
                            onClick={() => setShowUploadBox(true)}
                            className="font-bold text-xs text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>{isKhmer ? 'ជ្រើសរើស CV ផ្សេង' : 'Upload Other CV'}</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Cover Letter with AI Button */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <label className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
                        <span>{isKhmer ? 'លិខិតណែនាំខ្លួន / Cover Letter' : 'Cover Letter / Note'}</span>
                        <span className="text-xs font-normal text-slate-400">
                          ({isKhmer ? 'ស្រេចចិត្ត' : 'Optional'})
                        </span>
                      </label>
                      <button
                        type="button"
                        onClick={handleGenerateAICoverLetter}
                        disabled={isGeneratingCoverLetter}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-semibold shadow-2xs hover:shadow transition cursor-pointer disabled:opacity-50"
                      >
                        <Sparkles
                          className={`w-3.5 h-3.5 ${isGeneratingCoverLetter ? 'animate-spin' : ''}`}
                        />
                        <span>
                          {isGeneratingCoverLetter
                            ? isKhmer
                              ? 'AI កំពុងបង្កើត...'
                              : 'Generating...'
                            : isKhmer
                            ? '✨ AI បង្កើតលិខិត'
                            : '✨ AI Generate'}
                        </span>
                      </button>
                    </div>

                    <div className="relative">
                      <textarea
                        rows={5}
                        value={coverLetter}
                        onChange={(e) => setCoverLetter(e.target.value)}
                        placeholder={
                          isKhmer
                            ? 'សរសេរណែនាំអំពីខ្លួនអ្នកសង្ខេប បទពិសោធន៍ ឬចុច "✨ AI បង្កើតលិខិត" ដើម្បីឱ្យ AI រៀបចំជូនដោយស្វ័យប្រវត្តិ...'
                            : 'Brief note to introduce your strengths and background, or click "✨ AI Generate" to auto-draft...'
                        }
                        className="w-full p-3.5 text-xs sm:text-sm border border-slate-200 rounded-2xl outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-500/10 bg-white transition leading-relaxed resize-none"
                      />
                      {coverLetter && (
                        <div className="text-right text-[10px] text-slate-400 mt-1 pr-1">
                          {coverLetter.length} {isKhmer ? 'តួអក្សរ' : 'characters'}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Modal Footer */}
                  <div className="pt-4 border-t border-slate-100 space-y-3">
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                      <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>
                        {isKhmer
                          ? `ឯកសាររបស់អ្នកត្រូវបានរក្សាសុវត្ថិភាព និងបញ្ជូនទៅកាន់ ${job.company_name} ដោយផ្ទាល់។`
                          : `Your application is encrypted and sent directly to ${job.company_name}.`}
                      </span>
                    </div>

                    <div className="flex items-center justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setIsApplyModalOpen(false)}
                        className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                      >
                        {isKhmer ? 'បោះបង់' : 'Cancel'}
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmittingApply || (!selectedResumeId && resumes.length === 0)}
                        className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-xs sm:text-sm font-bold transition shadow-xs hover:shadow flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmittingApply ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>{isKhmer ? 'កំពុងបញ្ជូន...' : 'Submitting...'}</span>
                          </>
                        ) : (
                          <>
                            <span>{isKhmer ? 'បញ្ជូនពាក្យសុំ' : 'Submit Application'}</span>
                            <Send className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}