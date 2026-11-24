import React, { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useToast } from '../../app/providers'
import { employerService } from '../../services/employer.service'
import { jobsService } from '../../services/jobs.service'
import { companiesService } from '../../services/companies.service'
import { aiService } from '../../services/ai.service'
import { JobCategory, Skill, Company } from '../../types'
import { Select } from '../../components/ui/Select'
import { Dialog } from '../../components/ui/Dialog'
import {
  Briefcase,
  AlertCircle,
  ArrowLeft,
  Send,
  Plus,
  X,
  DollarSign,
  Sparkles,
  Loader2,
  Tag,
  Check,
  ShieldAlert,
  ShieldCheck,
  Save,
  Globe,
  Radio,
  Wand2,
  Lightbulb,
  RefreshCw,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react'

const AI_SAMPLE_PROMPTS = [
  {
    title_en: 'Senior Full-Stack Developer (React & Python)',
    title_km: 'អ្នកអភិវឌ្ឍន៍ Full-Stack ជាន់ខ្ពស់',
    prompt: 'Senior Full-Stack Developer with 3+ years experience in React, Python Django, PostgreSQL, $1500-$2500 in Phnom Penh, hybrid',
  },
  {
    title_en: 'Digital Marketing & Social Media Specialist',
    title_km: 'មន្ត្រីទីផ្សារឌីជីថល និងបណ្តាញសង្គម',
    prompt: 'Digital Marketing Specialist experienced in Facebook Ads, TikTok content, SEO, $600-$1000 in Phnom Penh, full-time',
  },
  {
    title_en: 'Senior Accountant & Tax Specialist',
    title_km: 'មន្ត្រីគណនេយ្យ និងពន្ធដារជាន់ខ្ពស់',
    prompt: 'Senior Accountant with experience in GDT tax filing, monthly financial reports, QuickBooks, $800-$1400 in Phnom Penh',
  },
  {
    title_en: 'UI/UX & Graphic Designer',
    title_km: 'អ្នករចនា UI/UX និងក្រាហ្វិក',
    prompt: 'UI/UX Designer proficient in Figma, Adobe Illustrator, mobile & web mockups, $700-$1300, hybrid or remote',
  },
  {
    title_en: 'HR & Talent Acquisition Executive',
    title_km: 'មន្ត្រីធនធានមនុស្ស និងជ្រើសរើសបុគ្គលិក',
    prompt: 'HR Officer handling end-to-end recruitment, labor law compliance, staff onboarding, $500-$900 in Phnom Penh',
  },
]

const POPULAR_SKILL_SUGGESTIONS = [
  'Khmer Language',
  'English (Professional)',
  'Communication',
  'Microsoft Office',
  'Customer Service',
  'React.js',
  'Node.js',
  'Accounting',
]

export const EmployerJobCreatePage: React.FC = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id?: string }>()
  const isEditMode = Boolean(id)
  const { toast } = useToast()
  const { i18n } = useTranslation()
  const isKhmer = i18n.language === 'km'

  const [categories, setCategories] = useState<JobCategory[]>([])
  const [provinces, setProvinces] = useState<Array<{ province_en: string; province_km: string }>>([])
  const [skills, setSkills] = useState<Skill[]>([])

  // Form Fields
  const [title, setTitle] = useState('')
  const [titleKm, setTitleKm] = useState('')
  const [categoryId, setCategoryId] = useState<number | ''>('')
  const [employmentType, setEmploymentType] = useState('full_time')
  const [workplaceType, setWorkplaceType] = useState('on_site')
  const [experienceLevel, setExperienceLevel] = useState('entry')
  const [educationLevel, setEducationLevel] = useState('')
  const [province, setProvince] = useState('Phnom Penh')
  const [city, setCity] = useState('')
  const [salaryMin, setSalaryMin] = useState('')
  const [salaryMax, setSalaryMax] = useState('')
  const [salaryCurrency, setSalaryCurrency] = useState<'USD' | 'KHR'>('USD')
  const [isSalaryNegotiable, setIsSalaryNegotiable] = useState(false)
  const [vacanciesCount, setVacanciesCount] = useState(1)
  const [description, setDescription] = useState('')
  const [descriptionKm, setDescriptionKm] = useState('')
  const [requirements, setRequirements] = useState('')
  const [selectedSkillIds, setSelectedSkillIds] = useState<number[]>([])

  // Status Field: published (live), draft, or closed
  const [jobStatus, setJobStatus] = useState<'published' | 'draft' | 'closed'>('published')

  // Custom Skill Input States
  const [customSkillInput, setCustomSkillInput] = useState('')
  const [isAddingSkill, setIsAddingSkill] = useState(false)

  const [isLoadingJob, setIsLoadingJob] = useState(isEditMode)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [company, setCompany] = useState<Company | null>(null)
  const [isLoadingCompany, setIsLoadingCompany] = useState(true)

  // AI Creation States
  const [searchParams] = useSearchParams()
  const [isAiModalOpen, setIsAiModalOpen] = useState(searchParams.get('ai') === 'true')
  const [aiPrompt, setAiPrompt] = useState('')
  const [isAiGenerating, setIsAiGenerating] = useState(false)
  const [aiGeneratedData, setAiGeneratedData] = useState<any | null>(null)
  const [aiError, setAiError] = useState<string | null>(null)

  const handleGenerateWithAi = async (customPrompt?: string) => {
    const textToUse = (typeof customPrompt === 'string' ? customPrompt : aiPrompt).trim()
    if (!textToUse) {
      setAiError(isKhmer ? 'សូមបញ្ចូលចំណងជើងការងារ ឬ Prompt ជាមុនសិន' : 'Please enter a job title or prompt first.')
      return
    }

    setAiError(null)
    setIsAiGenerating(true)
    setAiGeneratedData(null)

    try {
      const result = await aiService.generateJob({
        prompt: textToUse,
        industry: company?.industry || undefined,
      })
      setAiGeneratedData(result)
    } catch (err: any) {
      console.error('Failed to generate job with AI:', err)
      setAiError(
        err.response?.data?.message ||
        (isKhmer
          ? 'មិនអាចបង្កើតការងារដោយ AI បានទេ។ សូមសាកល្បងម្តងទៀត។'
          : 'Failed to generate vacancy with AI. Please try again.')
      )
    } finally {
      setIsAiGenerating(false)
    }
  }

  const handleApplyAiData = () => {
    if (!aiGeneratedData) return

    if (aiGeneratedData.title) setTitle(aiGeneratedData.title)
    if (aiGeneratedData.title_km) setTitleKm(aiGeneratedData.title_km)
    if (aiGeneratedData.category_id) setCategoryId(aiGeneratedData.category_id)
    if (aiGeneratedData.employment_type) setEmploymentType(aiGeneratedData.employment_type)
    if (aiGeneratedData.workplace_type) setWorkplaceType(aiGeneratedData.workplace_type)
    if (aiGeneratedData.experience_level) setExperienceLevel(aiGeneratedData.experience_level)
    if (aiGeneratedData.education_level) setEducationLevel(aiGeneratedData.education_level)
    if (aiGeneratedData.province) setProvince(aiGeneratedData.province)
    if (aiGeneratedData.salary_min != null) setSalaryMin(String(aiGeneratedData.salary_min))
    if (aiGeneratedData.salary_max != null) setSalaryMax(String(aiGeneratedData.salary_max))
    if (aiGeneratedData.salary_currency) setSalaryCurrency(aiGeneratedData.salary_currency)
    if (aiGeneratedData.vacancies_count) setVacanciesCount(aiGeneratedData.vacancies_count)
    if (aiGeneratedData.description) setDescription(aiGeneratedData.description)
    if (aiGeneratedData.description_km) setDescriptionKm(aiGeneratedData.description_km)
    if (aiGeneratedData.requirements) setRequirements(aiGeneratedData.requirements)
    if (Array.isArray(aiGeneratedData.skill_ids) && aiGeneratedData.skill_ids.length > 0) {
      setSelectedSkillIds(aiGeneratedData.skill_ids)
    }

    setIsAiModalOpen(false)
    toast.success(
      isKhmer ? 'ជោគជ័យ' : 'Success',
      isKhmer
        ? 'ព័ត៌មានការងារត្រូវបានបង្កើត និងបំពេញដោយស្វ័យប្រវត្តិតាមរយៈ AI!'
        : 'Job vacancy specifications auto-filled successfully by AI!'
    )
  }

  // 1. Load Catalogs
  useEffect(() => {
    const loadCatalogs = async () => {
      try {
        const [cats, locs, sks, comp] = await Promise.all([
          jobsService.getCategories(),
          jobsService.getLocations(),
          jobsService.getSkills(),
          companiesService.getEmployerCompany(),
        ])
        setCategories(cats || [])
        setProvinces(locs.provinces || [])
        setSkills(sks || [])
        setCompany(comp)
      } catch (err) {
        console.error('Failed to load catalogs:', err)
      } finally {
        setIsLoadingCompany(false)
      }
    }
    loadCatalogs()
  }, [])

  // 2. Load Existing Job in Edit Mode
  useEffect(() => {
    if (!id) return
    const loadExistingJob = async () => {
      setIsLoadingJob(true)
      try {
        const job = await employerService.getEmployerJob(Number(id))
        if (job) {
          setTitle(job.title || '')
          setTitleKm(job.title_km || '')
          setCategoryId(job.category_id || (job as any).category?.id || '')
          setEmploymentType(job.employment_type || 'full_time')
          setWorkplaceType(job.workplace_type || 'on_site')
          setExperienceLevel(job.experience_level || 'entry')
          setEducationLevel(job.education_level || '')
          setProvince(job.province || 'Phnom Penh')
          setCity(job.city || '')
          setSalaryMin(job.salary_min != null ? String(job.salary_min) : '')
          setSalaryMax(job.salary_max != null ? String(job.salary_max) : '')
          setSalaryCurrency(job.salary_currency || 'USD')
          setIsSalaryNegotiable(Boolean(job.is_salary_negotiable))
          setVacanciesCount(job.vacancies_count || 1)
          setDescription(job.description || '')
          setDescriptionKm(job.description_km || '')
          setRequirements(job.requirements || '')
          setJobStatus((job.status as any) || 'published')
          if (job.skills && Array.isArray(job.skills)) {
            setSelectedSkillIds(
              job.skills.map((s: any) => (typeof s === 'object' ? s.id : Number(s)))
            )
          }
        }
      } catch (err) {
        console.error('Failed to load existing job:', err)
        toast.error(
          isKhmer ? 'បរាជ័យ' : 'Error',
          isKhmer ? 'មិនអាចទាញយកទិន្នន័យការងារដើម្បីកែសម្រួលបានទេ' : 'Failed to load vacancy data.'
        )
        navigate('/employer/jobs')
      } finally {
        setIsLoadingJob(false)
      }
    }
    loadExistingJob()
  }, [id, isKhmer, navigate, toast])

  const toggleSkill = (id: number) => {
    setSelectedSkillIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    )
  }

  const handleRemoveSkill = (skillId: number) => {
    setSelectedSkillIds((prev) => prev.filter((id) => id !== skillId))
  }

  const handleAddCustomSkill = async (skillNameToAdd?: string) => {
    const raw = typeof skillNameToAdd === 'string' ? skillNameToAdd : customSkillInput
    const trimmed = raw.trim()
    if (!trimmed) return

    // Check if it already exists in available skills
    const existing = skills.find((s) => s.name.toLowerCase() === trimmed.toLowerCase())
    if (existing) {
      if (!selectedSkillIds.includes(existing.id)) {
        setSelectedSkillIds((prev) => [...prev, existing.id])
      }
      setCustomSkillInput('')
      return
    }

    setIsAddingSkill(true)
    try {
      const created = await jobsService.createSkill({ name: trimmed })
      if (created) {
        setSkills((prev) => [...prev, created])
        setSelectedSkillIds((prev) => [...prev, created.id])
        setCustomSkillInput('')
      }
    } catch (err) {
      console.error('Failed to create skill:', err)
      const fallbackId = Date.now()
      const fallbackSkill: Skill = { id: fallbackId, name: trimmed, category: 'Custom' }
      setSkills((prev) => [...prev, fallbackSkill])
      setSelectedSkillIds((prev) => [...prev, fallbackId])
      setCustomSkillInput('')
    } finally {
      setIsAddingSkill(false)
    }
  }

  const handleSkillInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      handleAddCustomSkill()
    } else if (e.key === 'Backspace' && !customSkillInput && selectedSkillIds.length > 0) {
      const lastId = selectedSkillIds[selectedSkillIds.length - 1]
      handleRemoveSkill(lastId)
    }
  }

  const handleFormSubmit = async (e: React.FormEvent, overrideStatus?: 'published' | 'draft' | 'closed') => {
    e.preventDefault()
    setError(null)

    const finalStatus = overrideStatus || jobStatus

    // In Create mode, only verified companies can post
    if (!isEditMode && company && company.verification_status !== 'verified') {
      setError(
        isKhmer
          ? 'ក្រុមហ៊ុនរបស់អ្នកកំពុងរង់ចាំការអនុម័តពី Admin។ មានតែក្រុមហ៊ុនដែលត្រូវបានអនុម័តដោយ Admin ប៉ុណ្ណោះដែលអាចចុះផ្សាយការងារបាន។'
          : 'Your company is awaiting Administrator confirmation. Only verified companies approved by the Platform Administrator can post job vacancies.'
      )
      return
    }

    setIsSubmitting(true)

    // Edit Mode: Update existing vacancy
    if (isEditMode && id) {
      try {
        await employerService.updateJob(Number(id), {
          title: title.trim(),
          title_km: titleKm.trim() || undefined,
          category_id: categoryId ? Number(categoryId) : undefined,
          employment_type: employmentType,
          workplace_type: workplaceType,
          experience_level: experienceLevel,
          education_level: educationLevel || undefined,
          province,
          city: city.trim() || undefined,
          salary_min: salaryMin ? Number(salaryMin) : undefined,
          salary_max: salaryMax ? Number(salaryMax) : undefined,
          salary_currency: salaryCurrency,
          is_salary_negotiable: isSalaryNegotiable,
          vacancies_count: vacanciesCount,
          description: description.trim(),
          description_km: descriptionKm.trim() || undefined,
          requirements: requirements.trim() || undefined,
          skill_ids: selectedSkillIds,
          status: finalStatus,
        })
        toast.success(
          isKhmer ? 'កែសម្រួលបានជោគជ័យ' : 'Job Updated',
          isKhmer
            ? finalStatus === 'published'
              ? 'ការងារត្រូវបានកែប្រែ និងផ្សាយផ្ទាល់ដោយជោគជ័យ'
              : 'ព័ត៌មានការងារត្រូវបានធ្វើបច្ចុប្បន្នភាពដោយជោគជ័យ'
            : finalStatus === 'published'
              ? 'Job vacancy updated and posted live!'
              : 'Job vacancy has been updated successfully.'
        )
        navigate('/employer/jobs')
      } catch (err: any) {
        setError(
          err.response?.data?.error ||
          (isKhmer
            ? 'មិនអាចកែប្រែការងារបានទេ។ សូមពិនិត្យផ្ទៀងផ្ទាត់ទិន្នន័យ។'
            : 'Failed to update vacancy. Please review your changes.')
        )
      } finally {
        setIsSubmitting(false)
      }
      return
    }

    // Create Mode: Post new vacancy
    try {
      await employerService.createJob({
        title: title.trim(),
        title_km: titleKm.trim() || undefined,
        category_id: categoryId ? Number(categoryId) : undefined,
        employment_type: employmentType,
        workplace_type: workplaceType,
        experience_level: experienceLevel,
        education_level: educationLevel || undefined,
        province,
        city: city.trim() || undefined,
        salary_min: salaryMin ? Number(salaryMin) : undefined,
        salary_max: salaryMax ? Number(salaryMax) : undefined,
        salary_currency: salaryCurrency,
        is_salary_negotiable: isSalaryNegotiable,
        vacancies_count: vacanciesCount,
        description: description.trim(),
        description_km: descriptionKm.trim() || undefined,
        requirements: requirements.trim() || undefined,
        skill_ids: selectedSkillIds,
        status: finalStatus,
      })
      toast.success(
        isKhmer ? 'បានចុះផ្សាយ' : 'Job Posted',
        isKhmer
          ? finalStatus === 'published'
            ? 'ឱកាសការងារថ្មីត្រូវបានចុះផ្សាយផ្ទាល់ដោយជោគជ័យ'
            : 'ការងារត្រូវបានរក្សាទុកជាសេចក្តីព្រាងដោយជោគជ័យ'
          : finalStatus === 'published'
            ? 'New job vacancy posted live!'
            : 'Job saved as draft.'
      )
      navigate('/employer/jobs')
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
        (isKhmer
          ? 'មិនអាចចុះផ្សាយការងារបានទេ។ សូមពិនិត្យផ្ទៀងផ្ទាត់ទិន្នន័យដែលបានបំពេញ។'
          : 'Failed to post vacancy. Please review the form fields.')
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  // Options for Select components
  const categoryOptions = [
    { value: '', label: isKhmer ? 'ជ្រើសរើសផ្នែកការងារ' : 'Select Category' },
    ...categories.map((c) => ({
      value: c.id,
      label: isKhmer ? c.name_km || c.name_en : c.name_en,
    })),
  ]

  const provinceOptions = provinces.map((p) => ({
    value: p.province_en,
    label: isKhmer ? `${p.province_km} (${p.province_en})` : `${p.province_en} (${p.province_km})`,
  }))

  const employmentTypeOptions = [
    { value: 'full_time', label: isKhmer ? 'ពេញម៉ោង (Full-Time)' : 'Full-Time' },
    { value: 'part_time', label: isKhmer ? 'ក្រៅម៉ោង (Part-Time)' : 'Part-Time' },
    { value: 'internship', label: isKhmer ? 'កម្មសិក្សា' : 'Internship' },
    { value: 'contract', label: isKhmer ? 'កិច្ចសន្យា' : 'Contract' },
    { value: 'freelance', label: isKhmer ? 'ការងារឯករាជ្យ' : 'Freelance' },
  ]

  const workplaceTypeOptions = [
    { value: 'on_site', label: isKhmer ? 'នៅការិយាល័យ (On-Site)' : 'On-Site' },
    { value: 'hybrid', label: isKhmer ? 'កូនកាត់' : 'Hybrid' },
    { value: 'remote', label: isKhmer ? 'ពីចម្ងាយ' : 'Remote' },
  ]

  const experienceLevelOptions = [
    { value: 'fresh_graduate', label: isKhmer ? 'និស្សិតទើបបញ្ចប់' : 'Fresh Graduate' },
    { value: 'entry', label: isKhmer ? 'កម្រិតដំបូង (Entry Level: 0-1 yr)' : 'Entry Level (0-1 yr)' },
    { value: 'mid', label: isKhmer ? 'កម្រិតមធ្យម (Mid Level: 2-4 yrs)' : 'Mid Level (2-4 yrs)' },
    { value: 'senior', label: isKhmer ? 'កម្រិតជាន់ខ្ពស់ (Senior: 5+ yrs)' : 'Senior Level (5+ yrs)' },
    { value: 'lead', label: isKhmer ? 'ប្រធានក្រុមការងារ (Lead / Principal)' : 'Lead / Principal' },
    { value: 'executive', label: isKhmer ? 'ថ្នាក់ដឹកនាំ (Executive / Director)' : 'Executive / Director' },
  ]

  const educationLevelOptions = [
    { value: '', label: isKhmer ? 'កម្រិតអប់រំ (ទាំងអស់)' : 'Any Education Level' },
    { value: 'high_school', label: isKhmer ? 'មធ្យមសិក្សាទុតិយភូមិ' : 'High School' },
    { value: 'associate', label: isKhmer ? 'បរិញ្ញាបត្ររង' : 'Associate Degree' },
    { value: 'bachelor', label: isKhmer ? 'បរិញ្ញាបត្រ' : 'Bachelor Degree' },
    { value: 'master', label: isKhmer ? 'អនុបណ្ឌិត' : 'Master Degree' },
    { value: 'doctorate', label: isKhmer ? 'បណ្ឌិត' : 'Doctorate / PhD' },
  ]

  const currencyOptions = [
    { value: 'USD', label: 'USD ($)' },
    { value: 'KHR', label: 'KHR (៛)' },
  ]

  if (isLoadingJob) {
    return (
      <div className="py-24 text-center font-sans">
        <div className="w-9 h-9 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="mt-3.5 text-xs font-semibold text-slate-500">
          {isKhmer ? 'កំពុងទាញយកព័ត៌មានការងារដើម្បីកែសម្រួល...' : 'Loading vacancy details for editing...'}
        </p>
      </div>
    )
  }

  return (
    <div className="w-full space-y-4 font-sans pb-16">
      {/* Top Navigation: Clean Back Button */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate('/employer/jobs')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition shadow-2xs cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{isKhmer ? 'ត្រឡប់ទៅការងារទាំងអស់' : 'Back to Vacancies'}</span>
        </button>

        <span className="text-[11px] font-semibold text-slate-400">
          {isEditMode
            ? isKhmer
              ? 'ការកែសម្រួលឱកាសការងារ'
              : 'Editing Vacancy'
            : isKhmer
              ? 'ការបង្កើតឱកាសការងារថ្មី'
              : 'Create New Job Opening'}
        </span>
      </div>

      {/* Main Form Container: Pure White with Crisp Border */}
      <div className="w-full bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 shadow-2xs space-y-5 sm:space-y-6">
        {/* Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0 shadow-2xs">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                {isEditMode
                  ? isKhmer
                    ? 'កែសម្រួលព័ត៌មានការងារ និងផ្សាយ'
                    : 'Edit & Post Job Vacancy'
                  : isKhmer
                    ? 'ចុះផ្សាយឱកាសការងារថ្មី'
                    : 'Post New Job Vacancy'}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                {isEditMode
                  ? isKhmer
                    ? 'ធ្វើបច្ចុប្បន្នភាពព័ត៌មានលម្អិត ប្រាក់បៀវត្ស លក្ខខណ្ឌ និងផ្សាយការងារឡើងវិញ'
                    : 'Update vacancy specifications, salary, requirements, and re-post or publish live'
                  : isKhmer
                    ? 'បញ្ជាក់ព័ត៌មានលម្អិតអំពីតួនាទី ប្រាក់បៀវត្ស លក្ខខណ្ឌតម្រូវ និងជំនាញចាំបាច់'
                    : 'Specify vacancy details, salary, requirements, and required skills'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsAiModalOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 active:scale-95 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              <span>{isKhmer ? 'បង្កើតការងារដោយ AI' : 'Generate with AI'}</span>
            </button>

            <div className="hidden sm:block">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold border shadow-2xs ${jobStatus === 'published'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : jobStatus === 'closed'
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${jobStatus === 'published'
                    ? 'bg-emerald-500'
                    : jobStatus === 'closed'
                      ? 'bg-rose-500'
                      : 'bg-amber-500'
                    }`}
                />
                <span>
                  {jobStatus === 'published'
                    ? isKhmer
                      ? 'ស្ថានភាព: ផ្សាយផ្ទាល់'
                      : 'Status: Published'
                    : jobStatus === 'closed'
                      ? isKhmer
                        ? 'ស្ថានភាព: បានបិទ'
                        : 'Status: Closed'
                      : isKhmer
                        ? 'ស្ថានភាព: សេចក្តីព្រាង'
                        : 'Status: Draft'}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* AI Auto-Generate Prompt Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50/90 via-indigo-50/70 to-purple-50/90 border border-indigo-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-blue-500/30">
              <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">
                  {isKhmer ? 'បង្កើតការងារស្វ័យប្រវត្តិតាមរយៈ AI' : 'Auto-Generate Vacancy with AI'}
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-600 text-white tracking-wide uppercase">
                  AI Smart
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                {isKhmer
                  ? 'បញ្ចូល Prompt សង្ខេប (ឧ. មុខតំណែង បទពិសោធន៍ ប្រាក់ខែ) AI នឹងបង្កើតទិន្នន័យការងារ និងជំនាញទាំងអស់ដោយស្វ័យប្រវត្តិ។'
                  : 'Enter a short prompt (e.g. role, experience, salary), and AI will draft full descriptions, requirements, and match skills automatically.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsAiModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 active:scale-95 transition-all cursor-pointer shrink-0"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>{isKhmer ? 'សរសេរ Prompt បង្កើត' : 'Create with Prompt'}</span>
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 flex items-start shadow-2xs animate-in fade-in duration-150">
            <AlertCircle className="w-4 h-4 mr-2 mt-0.5 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Company Verification Guard Alert (only in create mode) */}
        {!isEditMode && !isLoadingCompany && company && company.verification_status !== 'verified' && (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start space-x-3 shadow-2xs">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-bold text-amber-900 text-xs">
                {isKhmer
                  ? 'ក្រុមហ៊ុនកំពុងរង់ចាំការអនុម័តពីអ្នកគ្រប់គ្រង'
                  : 'Company Awaiting Administrator Confirmation'}
              </h4>
              <p className="text-amber-800 leading-relaxed font-normal text-xs">
                {isKhmer
                  ? 'ក្រុមហ៊ុនរបស់អ្នកកំពុងរង់ចាំការអនុម័តពី Admin។ បន្ទាប់ពី Admin ផ្ទៀងផ្ទាត់រួច អ្នកនឹងអាចចុះផ្សាយការងារថ្មីៗបានភ្លាមៗ។'
                  : 'Your company profile is awaiting approval from the Platform Admin. You will be able to post once approved.'}
              </p>
            </div>
          </div>
        )}

        <form onSubmit={(e) => handleFormSubmit(e)} className="space-y-5">
          {/* SECTION 1: Job Title */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {isKhmer ? 'ចំណងជើងការងារ (អង់គ្លេស) *' : 'Job Title (English) *'}
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Senior Frontend Developer"
                className="w-full px-3.5 py-2 min-h-[38px] text-xs sm:text-sm bg-slate-50 border border-gray-200 rounded-xl text-slate-900 placeholder:text-slate-400 font-medium outline-none hover:border-gray-300 hover:bg-slate-100/60 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {isKhmer ? 'ចំណងជើងការងារ (ភាសាខ្មែរ)' : 'Job Title (Khmer)'}
              </label>
              <input
                type="text"
                value={titleKm}
                onChange={(e) => setTitleKm(e.target.value)}
                placeholder="ឧ. អ្នកអភិវឌ្ឍន៍គេហទំព័រជាន់ខ្ពស់"
                className="w-full px-3.5 py-2 min-h-[38px] text-xs sm:text-sm bg-slate-50 border border-gray-200 rounded-xl text-slate-900 placeholder:text-slate-400 font-medium outline-none hover:border-gray-300 hover:bg-slate-100/60 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition"
              />
            </div>
          </div>

          {/* SECTION 2: Category & Employment Type */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {isKhmer ? 'ផ្នែកការងារ *' : 'Job Category *'}
              </label>
              <Select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : '')}
                options={categoryOptions}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {isKhmer ? 'ប្រភេទការងារ *' : 'Employment Type *'}
              </label>
              <Select
                value={employmentType}
                onChange={(e) => setEmploymentType(e.target.value)}
                options={employmentTypeOptions}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {isKhmer ? 'ទម្រង់ការងារ *' : 'Workplace Type *'}
              </label>
              <Select
                value={workplaceType}
                onChange={(e) => setWorkplaceType(e.target.value)}
                options={workplaceTypeOptions}
              />
            </div>
          </div>

          {/* SECTION 3: Experience, Education & Vacancies Count */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {isKhmer ? 'កម្រិតបទពិសោធន៍ *' : 'Experience Level *'}
              </label>
              <Select
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value)}
                options={experienceLevelOptions}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {isKhmer ? 'កម្រិតអប់រំ' : 'Education Level'}
              </label>
              <Select
                value={educationLevel}
                onChange={(e) => setEducationLevel(e.target.value)}
                options={educationLevelOptions}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {isKhmer ? 'ចំនួនជ្រើសរើស *' : 'Vacancies Count *'}
              </label>
              <input
                type="number"
                min={1}
                required
                value={vacanciesCount}
                onChange={(e) => setVacanciesCount(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-3.5 py-2 min-h-[38px] text-xs sm:text-sm bg-slate-50 border border-gray-200 rounded-xl text-slate-900 font-medium outline-none hover:border-gray-300 hover:bg-slate-100/60 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition"
              />
            </div>
          </div>

          {/* SECTION 4: Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {isKhmer ? 'ខេត្ត / រាជធានី *' : 'Province / City *'}
              </label>
              <Select
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                options={provinceOptions}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {isKhmer ? 'ខណ្ឌ / ស្រុក / អាសយដ្ឋាន' : 'District / Address Detail'}
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Khan Daun Penh, Phnom Penh"
                className="w-full px-3.5 py-2 min-h-[38px] text-xs sm:text-sm bg-slate-50 border border-gray-200 rounded-xl text-slate-900 placeholder:text-slate-400 font-medium outline-none hover:border-gray-300 hover:bg-slate-100/60 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition"
              />
            </div>
          </div>

          {/* SECTION 5: Salary Information */}
          <div className="p-4 rounded-2xl bg-slate-50/70 border border-gray-200 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                <span>{isKhmer ? 'ព័ត៌មានប្រាក់បៀវត្ស' : 'Compensation & Salary Range'}</span>
              </span>
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isSalaryNegotiable}
                  onChange={(e) => setIsSalaryNegotiable(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-xs font-semibold text-slate-600">
                  {isKhmer ? 'អាចចរចាបាន' : 'Negotiable'}
                </span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  {isKhmer ? 'ប្រាក់បៀវត្សអប្បបរមា' : 'Minimum Salary'}
                </label>
                <input
                  type="number"
                  value={salaryMin}
                  onChange={(e) => setSalaryMin(e.target.value)}
                  placeholder="e.g. 500"
                  className="w-full px-3.5 py-2 min-h-[38px] text-xs sm:text-sm bg-slate-50 border border-gray-200 rounded-xl text-slate-900 font-medium outline-none hover:border-gray-300 hover:bg-slate-100/60 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  {isKhmer ? 'ប្រាក់បៀវត្សអតិបរមា' : 'Maximum Salary'}
                </label>
                <input
                  type="number"
                  value={salaryMax}
                  onChange={(e) => setSalaryMax(e.target.value)}
                  placeholder="e.g. 1000"
                  className="w-full px-3.5 py-2 min-h-[38px] text-xs sm:text-sm bg-slate-50 border border-gray-200 rounded-xl text-slate-900 font-medium outline-none hover:border-gray-300 hover:bg-slate-100/60 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  {isKhmer ? 'រូបិយប័ណ្ណ' : 'Currency'}
                </label>
                <Select
                  value={salaryCurrency}
                  onChange={(e) => setSalaryCurrency(e.target.value as any)}
                  options={currencyOptions}
                />
              </div>
            </div>
          </div>

          {/* SECTION 6: Job Description & Requirements */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {isKhmer ? 'ការពិពណ៌នាអំពីការងារ *' : 'Job Description *'}
              </label>
              <textarea
                required
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Outline roles, core responsibilities, day-to-day tasks..."
                className="w-full p-3.5 text-xs sm:text-sm bg-slate-50 border border-gray-200 rounded-xl text-slate-900 placeholder:text-slate-400 font-medium outline-none resize-y leading-relaxed hover:border-gray-300 hover:bg-slate-100/60 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {isKhmer ? 'ការពិពណ៌នាជាភាសាខ្មែរ' : 'Job Description (Khmer)'}
              </label>
              <textarea
                rows={4}
                value={descriptionKm}
                onChange={(e) => setDescriptionKm(e.target.value)}
                placeholder="រៀបរាប់អំពីតួនាទី និងភារកិច្ចចម្បងៗ..."
                className="w-full p-3.5 text-xs sm:text-sm bg-slate-50 border border-gray-200 rounded-xl text-slate-900 placeholder:text-slate-400 font-medium outline-none resize-y leading-relaxed hover:border-gray-300 hover:bg-slate-100/60 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {isKhmer ? 'លក្ខខណ្ឌតម្រូវការងារ' : 'Requirements & Qualifications'}
              </label>
              <textarea
                rows={4}
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
                placeholder="Required education, years of experience, technical skills, languages..."
                className="w-full p-3.5 text-xs sm:text-sm bg-slate-50 border border-gray-200 rounded-xl text-slate-900 placeholder:text-slate-400 font-medium outline-none resize-y leading-relaxed hover:border-gray-300 hover:bg-slate-100/60 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition"
              />
            </div>
          </div>

          {/* SECTION 7: Required Skills (Input Type Tag Writer) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/70 border border-gray-200 space-y-3.5 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <div>
                <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-blue-600" />
                  <span>{isKhmer ? 'ជំនាញចាំបាច់' : 'Required Skills'}</span>
                </label>
                <p className="text-[11px] text-slate-400">
                  {isKhmer
                    ? 'វាយបញ្ចូលជំនាញដែលត្រូវការ រួចចុច Enter ឬចុចប៊ូតុង "បន្ថែម"'
                    : 'Type skill name and press Enter or click "Add"'}
                </p>
              </div>

              {selectedSkillIds.length > 0 && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200/60">
                    {selectedSkillIds.length} {isKhmer ? 'ជំនាញបានជ្រើស' : 'selected'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedSkillIds([])}
                    className="text-[11px] text-slate-400 hover:text-rose-600 font-medium transition cursor-pointer"
                  >
                    {isKhmer ? 'សម្អាតទាំងអស់' : 'Clear all'}
                  </button>
                </div>
              )}
            </div>

            {/* Input Field Box */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={customSkillInput}
                  onChange={(e) => setCustomSkillInput(e.target.value)}
                  onKeyDown={handleSkillInputKeyDown}
                  placeholder={
                    isKhmer
                      ? 'វាយឈ្មោះជំនាញ (ឧទាហរណ៍: React.js, English, Photoshop...) រួចចុច Enter'
                      : 'Type a skill (e.g. React.js, English, Photoshop...) and press Enter'
                  }
                  className="w-full pl-3.5 pr-10 py-2.5 min-h-[42px] text-xs sm:text-sm bg-white border border-gray-200 rounded-xl text-slate-900 placeholder:text-slate-400 font-medium outline-none hover:border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition shadow-2xs"
                />
                {customSkillInput && (
                  <button
                    type="button"
                    onClick={() => setCustomSkillInput('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => handleAddCustomSkill()}
                disabled={isAddingSkill || !customSkillInput.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 min-h-[42px] rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-semibold transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs shrink-0"
              >
                {isAddingSkill ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Plus className="w-3.5 h-3.5" />
                )}
                <span>{isKhmer ? 'បន្ថែម' : 'Add'}</span>
              </button>
            </div>

            {/* Selected Skills Chips Container */}
            {selectedSkillIds.length > 0 ? (
              <div className="flex flex-wrap gap-2 pt-1">
                {selectedSkillIds.map((id) => {
                  const s = skills.find((item) => item.id === id) || { id, name: `Skill #${id}` }
                  return (
                    <span
                      key={id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold shadow-2xs group animate-in fade-in zoom-in-95 duration-100"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      <span>{s.name}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(id)}
                        className="p-0.5 rounded-md hover:bg-blue-200/70 text-blue-500 hover:text-blue-800 transition cursor-pointer ml-0.5"
                        title={isKhmer ? 'លុបជំនាញនេះ' : 'Remove skill'}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )
                })}
              </div>
            ) : (
              <div className="py-2.5 px-3 rounded-xl bg-white border border-dashed border-gray-200 text-center">
                <p className="text-[11px] text-slate-400">
                  {isKhmer
                    ? 'មិនទាន់មានជំនាញដែលបានបញ្ចូលនៅឡើយទេ។ សូមវាយបញ្ចូលខាងលើ ឬជ្រើសរើសពីការណែនាំខាងក្រោម។'
                    : 'No skills added yet. Type above or pick from suggestions below.'}
                </p>
              </div>
            )}

            {/* Popular Suggestions */}
            <div className="pt-2 border-t border-gray-200/60">
              <span className="block text-[11px] font-semibold text-slate-500 mb-2">
                {isKhmer ? 'ជំនាញដែលពេញនិយម:' : 'Suggested Skills:'}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {POPULAR_SKILL_SUGGESTIONS.map((sug) => {
                  const matchingSkill = skills.find((s) => s.name.toLowerCase() === sug.toLowerCase())
                  const isSelected = matchingSkill ? selectedSkillIds.includes(matchingSkill.id) : false

                  return (
                    <button
                      type="button"
                      key={sug}
                      onClick={() => {
                        if (isSelected && matchingSkill) {
                          handleRemoveSkill(matchingSkill.id)
                        } else {
                          handleAddCustomSkill(sug)
                        }
                      }}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                        isSelected
                          ? 'bg-blue-600 text-white border border-blue-600 shadow-2xs'
                          : 'bg-white hover:bg-slate-100 text-slate-600 border border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {isSelected ? (
                        <Check className="w-3 h-3 text-white" />
                      ) : (
                        <Plus className="w-2.5 h-2.5 text-slate-400" />
                      )}
                      <span>{sug}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* SECTION 8: NEW - Explicit Job Status & Visibility Selector */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/70 border border-gray-200 space-y-3.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-slate-500" />
                <label className="text-xs font-bold text-slate-800">
                  {isKhmer ? 'ស្ថានភាពការងារ និងការផ្សាយជាសាធារណៈ' : 'Publishing Status & Visibility'}
                </label>
              </div>
              <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
                {isKhmer ? 'ជ្រើសរើសស្ថានភាពដើម្បីកំណត់ភាពមើលឃើញនៃការងារ' : 'Control vacancy visibility'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Option 1: Published */}
              <button
                type="button"
                onClick={() => setJobStatus('published')}
                className={`group relative p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 bg-white ${
                  jobStatus === 'published'
                    ? 'border-emerald-500/80 ring-2 ring-emerald-500/10 shadow-2xs'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-slate-50/50 text-slate-700'
                }`}
              >
                <div className="flex items-start justify-between w-full gap-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition ${
                        jobStatus === 'published'
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                          : 'bg-slate-100/70 text-slate-400 group-hover:text-slate-600'
                      }`}
                    >
                      <Globe className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold block text-slate-900">
                        {isKhmer ? 'ផ្សាយផ្ទាល់' : 'Published'}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium block">
                        (Live / Public)
                      </span>
                    </div>
                  </div>

                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 transition ${
                      jobStatus === 'published'
                        ? 'border-emerald-500 bg-emerald-500 text-white'
                        : 'border-gray-300 bg-white group-hover:border-gray-400'
                    }`}
                  >
                    {jobStatus === 'published' && <Check className="w-2.5 h-2.5 stroke-[2.5]" />}
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed font-normal">
                  {isKhmer
                    ? 'ការងារនឹងបង្ហាញជាសាធារណៈភ្លាមៗ ដើម្បីទទួលពាក្យពីបេក្ខជន'
                    : 'Immediately visible to job seekers across Cambodia'}
                </p>
              </button>

              {/* Option 2: Draft */}
              <button
                type="button"
                onClick={() => setJobStatus('draft')}
                className={`group relative p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 bg-white ${
                  jobStatus === 'draft'
                    ? 'border-amber-500/80 ring-2 ring-amber-500/10 shadow-2xs'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-slate-50/50 text-slate-700'
                }`}
              >
                <div className="flex items-start justify-between w-full gap-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition ${
                        jobStatus === 'draft'
                          ? 'bg-amber-50 text-amber-600 border border-amber-100'
                          : 'bg-slate-100/70 text-slate-400 group-hover:text-slate-600'
                      }`}
                    >
                      <Save className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold block text-slate-900">
                        {isKhmer ? 'សេចក្តីព្រាង' : 'Draft'}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium block">
                        (Unpublished)
                      </span>
                    </div>
                  </div>

                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 transition ${
                      jobStatus === 'draft'
                        ? 'border-amber-500 bg-amber-500 text-white'
                        : 'border-gray-300 bg-white group-hover:border-gray-400'
                    }`}
                  >
                    {jobStatus === 'draft' && <Check className="w-2.5 h-2.5 stroke-[2.5]" />}
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed font-normal">
                  {isKhmer
                    ? 'រក្សាទុកជាព្រាងឯកជន មិនទាន់ផ្សាយជាសាធារណៈ'
                    : 'Saved privately for further review before posting'}
                </p>
              </button>

              {/* Option 3: Closed */}
              <button
                type="button"
                onClick={() => setJobStatus('closed')}
                className={`group relative p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 bg-white ${
                  jobStatus === 'closed'
                    ? 'border-slate-400 ring-2 ring-slate-400/10 shadow-2xs'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-slate-50/50 text-slate-700'
                }`}
              >
                <div className="flex items-start justify-between w-full gap-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition ${
                        jobStatus === 'closed'
                          ? 'bg-slate-100 text-slate-600 border border-slate-200'
                          : 'bg-slate-100/70 text-slate-400 group-hover:text-slate-600'
                      }`}
                    >
                      <X className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold block text-slate-900">
                        {isKhmer ? 'បិទការជ្រើសរើស' : 'Closed'}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium block">
                        (Archive)
                      </span>
                    </div>
                  </div>

                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 transition ${
                      jobStatus === 'closed'
                        ? 'border-slate-600 bg-slate-600 text-white'
                        : 'border-gray-300 bg-white group-hover:border-gray-400'
                    }`}
                  >
                    {jobStatus === 'closed' && <Check className="w-2.5 h-2.5 stroke-[2.5]" />}
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed font-normal">
                  {isKhmer
                    ? 'បិទការងារមិនទទួលពាក្យសុំបណ្ដោះអាសន្ន ឬបំពេញរួចរាល់'
                    : 'Stop accepting applications and archive vacancy'}
                </p>
              </button>
            </div>
          </div>

          {/* ACTION FOOTER BAR: Cancel, Save Draft, and Save & Publish Live! */}
          <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => navigate('/employer/jobs')}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-gray-200 transition cursor-pointer shadow-2xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{isKhmer ? 'បោះបង់' : 'Cancel'}</span>
            </button>

            <div className="flex items-center gap-2.5">
              {/* Option to Save Draft */}
              <button
                type="button"
                disabled={isSubmitting}
                onClick={(e) => handleFormSubmit(e, 'draft')}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-gray-200 transition shadow-2xs cursor-pointer disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5 inline mr-1.5" />
                <span>{isKhmer ? 'រក្សាទុកជាព្រាង' : 'Save as Draft'}</span>
              </button>

              {/* Primary Action Button: Save & Publish Live! */}
              <button
                type="button"
                disabled={isSubmitting || (!isEditMode && company !== null && company.verification_status !== 'verified')}
                onClick={(e) => handleFormSubmit(e, 'published')}
                className={`inline-flex items-center justify-center gap-2 px-5 py-2 rounded-xl font-semibold text-xs transition shadow-2xs ${!isEditMode && company !== null && company.verification_status !== 'verified'
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 active:scale-95 text-white cursor-pointer disabled:opacity-50'
                  }`}
              >
                {isSubmitting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>
                  {isSubmitting
                    ? isKhmer
                      ? 'កំពុងរក្សាទុក...'
                      : 'Saving...'
                    : isEditMode
                      ? isKhmer
                        ? 'រក្សាទុក និងផ្សាយផ្ទាល់ការងារ'
                        : 'Save & Post Vacancy'
                      : isKhmer
                        ? 'ចុះផ្សាយការងារឥឡូវនេះ'
                        : 'Publish Vacancy Now'}
                </span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* ================= AI CREATE JOB MODAL ================= */}
      <Dialog
        isOpen={isAiModalOpen}
        onClose={() => !isAiGenerating && setIsAiModalOpen(false)}
        size="lg"
        icon={<Sparkles className="w-5 h-5 text-indigo-600" />}
        iconClassName="bg-indigo-50 border border-indigo-200/70"
        title={
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-slate-900 font-bold">
              {isKhmer ? 'បង្កើតការងារដោយស្វ័យប្រវត្តិតាមរយៈ AI' : 'Create Job with AI Assistant'}
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/80 tracking-wide uppercase">
              AI Smart
            </span>
          </div>
        }
        description={
          isKhmer
            ? 'គ្រាន់តែសរសេរ Prompt ឬចំណងជើងការងារ AI នឹងរៀបចំព័ត៌មានការងារ ប្រាក់ខែ កម្រិតបទពិសោធន៍ ជំនាញ និងលក្ខខណ្ឌទាំងអស់ដោយស្វ័យប្រវត្តិ។'
            : 'Just write a prompt or job title. AI automatically infers role details, salary range, experience, workplace type, and matched skills.'
        }
        footer={
          <div className="flex items-center justify-between gap-3 w-full">
            <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
              {isKhmer
                ? 'ស្វ័យប្រវត្តិ 100% ពី Prompt របស់អ្នក'
                : '100% automated from your prompt'}
            </span>
            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                disabled={isAiGenerating}
                onClick={() => setIsAiModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition cursor-pointer disabled:opacity-50"
              >
                {isKhmer ? 'បោះបង់' : 'Cancel'}
              </button>
              <button
                type="button"
                disabled={isAiGenerating || !aiPrompt.trim()}
                onClick={() => handleGenerateWithAi()}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs active:scale-95 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAiGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>{isKhmer ? 'AI កំពុងរៀបចំ...' : 'Generating...'}</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4 text-indigo-100" />
                    <span>
                      {aiGeneratedData
                        ? isKhmer
                          ? 'បង្កើតម្តងទៀត'
                          : 'Regenerate'
                        : isKhmer
                        ? 'បង្កើតទិន្នន័យការងារដោយ AI'
                        : 'Generate with AI'}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        }
      >
        <div className="space-y-4 font-sans">
          {/* Prompt Input Card */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
                <span>{isKhmer ? 'បញ្ចូល Prompt ឬចំណងជើងការងារ' : 'Enter Job Prompt or Title'}</span>
                <span className="text-rose-500">*</span>
              </label>
              {aiPrompt && !isAiGenerating && (
                <button
                  type="button"
                  onClick={() => setAiPrompt('')}
                  className="text-[11px] font-semibold text-slate-400 hover:text-slate-600 inline-flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <X className="w-3 h-3" />
                  <span>{isKhmer ? 'សម្អាត' : 'Clear'}</span>
                </button>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200/90 focus-within:border-indigo-400 focus-within:ring-4 focus-within:ring-indigo-500/10 bg-white shadow-2xs overflow-hidden transition-all">
              <textarea
                rows={4}
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && aiPrompt.trim() && !isAiGenerating) {
                    e.preventDefault()
                    handleGenerateWithAi()
                  }
                }}
                disabled={isAiGenerating}
                placeholder={
                  isKhmer
                    ? 'ឧទាហរណ៍៖ Senior Full-Stack Developer (React & Python), បទពិសោធន៍ ៣ ឆ្នាំឡើង, ប្រាក់ខែ $1,500 - $2,500 នៅភ្នំពេញ, ពេញម៉ោង...'
                    : 'e.g. Senior Full-Stack Developer with 3+ years experience in React & Python Django, $1,500 - $2,500 in Phnom Penh, hybrid...'
                }
                className="w-full px-4 pt-3.5 pb-2 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 font-medium leading-relaxed bg-transparent focus:outline-none resize-none"
              />
              <div className="px-4 py-2 bg-slate-50/75 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>
                  {isKhmer
                    ? 'AI នឹងកំណត់ចំណងជើង ប្រាក់ខែ ជំនាញ និងលក្ខខណ្ឌដោយស្វ័យប្រវត្តិ'
                    : 'Auto-detects title, salary, level, workplace & skills'}
                </span>
                <span className="hidden sm:inline text-[10px] font-semibold text-slate-400">
                  Ctrl + Enter
                </span>
              </div>
            </div>
          </div>

          {/* Quick Prompt Templates */}
          <div className="p-3.5 rounded-2xl bg-slate-50/75 border border-slate-200/80 space-y-2.5">
            <span className="block text-xs font-bold text-slate-700">
              {isKhmer ? 'គំរូ Prompt រហ័ស (ចុចដើម្បីបង្កើតភ្លាមៗ)' : 'Quick AI Prompts (Click to generate)'}
            </span>
            <div className="flex flex-wrap gap-2">
              {AI_SAMPLE_PROMPTS.map((sample, idx) => {
                const isSelected = aiPrompt === sample.prompt
                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={isAiGenerating}
                    onClick={() => {
                      setAiPrompt(sample.prompt)
                      handleGenerateWithAi(sample.prompt)
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer disabled:opacity-50 ${
                      isSelected
                        ? 'bg-indigo-50 text-indigo-700 border-indigo-300 shadow-2xs'
                        : 'bg-white hover:bg-indigo-50/60 text-slate-700 hover:text-indigo-700 border-slate-200/90 hover:border-indigo-200 shadow-2xs'
                    }`}
                  >
                    {isKhmer ? sample.title_km : sample.title_en}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Generating Shimmer Indicator */}
          {isAiGenerating && (
            <div className="p-3.5 rounded-2xl bg-indigo-50/50 border border-indigo-200/70 flex items-center gap-3 animate-pulse">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900">
                  {isKhmer ? 'AI កំពុងវិភាគ Prompt និងបង្កើតព័ត៌មានការងារ...' : 'AI is analyzing your prompt & crafting the job post...'}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {isKhmer ? 'សូមរង់ចាំបន្តិច' : 'Structuring responsibilities, skills, and market salary range'}
                </p>
              </div>
            </div>
          )}

          {/* Error inside modal */}
          {aiError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-medium text-rose-700 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{aiError}</span>
            </div>
          )}

          {/* AI Result Preview Card */}
          {aiGeneratedData && (
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/80 border border-indigo-200/80 space-y-3.5 shadow-2xs animate-in fade-in duration-200">
              <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-200/80">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="text-xs font-bold text-slate-900">
                    {isKhmer ? 'លទ្ធផលបង្កើតដោយ AI (សូមត្រួតពិនិត្យ)' : 'AI Generated Preview'}
                  </span>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {isKhmer ? 'រួចរាល់' : 'Ready to Apply'}
                </span>
              </div>

              <div>
                <h4 className="text-sm sm:text-base font-extrabold text-slate-900">{aiGeneratedData.title}</h4>
                {aiGeneratedData.title_km && (
                  <p className="text-xs font-medium text-slate-600 mt-0.5">{aiGeneratedData.title_km}</p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                {aiGeneratedData.salary_min != null && (
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                    ${aiGeneratedData.salary_min} - ${aiGeneratedData.salary_max || aiGeneratedData.salary_min} USD
                  </span>
                )}
                {aiGeneratedData.workplace_type && (
                  <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 font-semibold capitalize">
                    {aiGeneratedData.workplace_type.replace('_', ' ')}
                  </span>
                )}
                {aiGeneratedData.experience_level && (
                  <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold capitalize">
                    {aiGeneratedData.experience_level}
                  </span>
                )}
                {aiGeneratedData.province && (
                  <span className="px-2.5 py-1 rounded-lg bg-white text-slate-700 border border-slate-200 font-semibold">
                    {aiGeneratedData.province}
                  </span>
                )}
              </div>

              {Array.isArray(aiGeneratedData.recommended_skills) && aiGeneratedData.recommended_skills.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-700 block">
                    {isKhmer ? 'ជំនាញដែលបានផ្គូផ្គង៖' : 'Matched Skills:'}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {aiGeneratedData.recommended_skills.map((s: string, idx: number) => (
                      <span
                        key={idx}
                        className="px-2.5 py-0.5 rounded-lg bg-white border border-slate-200 text-slate-700 text-[11px] font-semibold"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-2.5 flex items-center justify-end gap-2 border-t border-slate-200/80">
                <button
                  type="button"
                  onClick={() => setAiGeneratedData(null)}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                >
                  {isKhmer ? 'បដិសេធ' : 'Discard'}
                </button>
                <button
                  type="button"
                  onClick={handleApplyAiData}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isKhmer ? 'អនុវត្តទៅលើទម្រង់ការងារ' : 'Apply to Form'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </Dialog>
    </div>
  )
}
