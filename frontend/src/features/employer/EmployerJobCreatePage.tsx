import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useToast } from '../../app/providers'
import { employerService } from '../../services/employer.service'
import { jobsService } from '../../services/jobs.service'
import { companiesService } from '../../services/companies.service'
import { JobCategory, Skill, Company } from '../../types'
import { Select } from '../../components/ui/Select'
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
} from 'lucide-react'

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
  const [skillSearch, setSkillSearch] = useState('')

  const [isLoadingJob, setIsLoadingJob] = useState(isEditMode)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [company, setCompany] = useState<Company | null>(null)
  const [isLoadingCompany, setIsLoadingCompany] = useState(true)

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

  const handleAddCustomSkill = async () => {
    const trimmed = customSkillInput.trim()
    if (!trimmed) return

    // Check if it already exists
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
    { value: 'internship', label: isKhmer ? 'កម្មសិក្សា (Internship)' : 'Internship' },
    { value: 'contract', label: isKhmer ? 'កិច្ចសន្យា (Contract)' : 'Contract' },
    { value: 'freelance', label: isKhmer ? 'ការងារឯករាជ្យ (Freelance)' : 'Freelance' },
  ]

  const workplaceTypeOptions = [
    { value: 'on_site', label: isKhmer ? 'នៅការិយាល័យ (On-Site)' : 'On-Site' },
    { value: 'hybrid', label: isKhmer ? 'កាត់ការិយាល័យ/ផ្ទះ (Hybrid)' : 'Hybrid' },
    { value: 'remote', label: isKhmer ? 'ពីចម្ងាយទាំងស្រុង (Remote)' : 'Remote' },
  ]

  const experienceLevelOptions = [
    { value: 'fresh_graduate', label: isKhmer ? 'និស្សិតទើបបញ្ចប់ (Fresh Graduate)' : 'Fresh Graduate' },
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

  // Filter skills for preset list
  const filteredSkills = skills.filter((s) =>
    s.name.toLowerCase().includes(skillSearch.toLowerCase())
  )

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
              ? 'ការកែសម្រួលឱកាសការងារ (Edit Vacancy)'
              : 'Editing Vacancy'
            : isKhmer
            ? 'ការបង្កើតឱកាសការងារថ្មី (Post Vacancy)'
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

          <div className="hidden sm:block">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold border shadow-2xs ${
                jobStatus === 'published'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : jobStatus === 'closed'
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  jobStatus === 'published'
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
                  ? 'ក្រុមហ៊ុនកំពុងរង់ចាំការអនុម័តពី Admin (Awaiting Admin Confirmation)'
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
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-gray-200 rounded-xl text-slate-900 placeholder:text-slate-400 font-medium outline-none focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition shadow-2xs"
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
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-gray-200 rounded-xl text-slate-900 placeholder:text-slate-400 font-medium outline-none focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition shadow-2xs"
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
                {isKhmer ? 'ចំនួនជ្រើសរើស (Openings) *' : 'Vacancies Count *'}
              </label>
              <input
                type="number"
                min={1}
                required
                value={vacanciesCount}
                onChange={(e) => setVacanciesCount(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-gray-200 rounded-xl text-slate-900 font-medium outline-none focus:bg-white focus:border-blue-500 shadow-2xs"
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
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-gray-200 rounded-xl text-slate-900 placeholder:text-slate-400 font-medium outline-none focus:bg-white focus:border-blue-500 shadow-2xs"
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
                  {isKhmer ? 'អាចចរចាបាន (Negotiable)' : 'Negotiable'}
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
                  className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-xl text-slate-900 font-medium outline-none focus:border-blue-500 shadow-2xs"
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
                  className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-xl text-slate-900 font-medium outline-none focus:border-blue-500 shadow-2xs"
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
                {isKhmer ? 'ការពិពណ៌នាអំពីការងារ (Job Description) *' : 'Job Description *'}
              </label>
              <textarea
                required
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Outline roles, core responsibilities, day-to-day tasks..."
                className="w-full p-3.5 text-xs bg-slate-50 border border-gray-200 rounded-2xl text-slate-900 placeholder:text-slate-400 font-medium outline-none focus:bg-white focus:border-blue-500 shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {isKhmer ? 'ការពិពណ៌នាជាភាសាខ្មែរ (Description in Khmer)' : 'Job Description (Khmer)'}
              </label>
              <textarea
                rows={4}
                value={descriptionKm}
                onChange={(e) => setDescriptionKm(e.target.value)}
                placeholder="រៀបរាប់អំពីតួនាទី និងភារកិច្ចចម្បងៗ..."
                className="w-full p-3.5 text-xs bg-slate-50 border border-gray-200 rounded-2xl text-slate-900 placeholder:text-slate-400 font-medium outline-none focus:bg-white focus:border-blue-500 shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {isKhmer ? 'លក្ខខណ្ឌតម្រូវការងារ (Requirements & Qualifications)' : 'Requirements & Qualifications'}
              </label>
              <textarea
                rows={4}
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
                placeholder="Required education, years of experience, technical skills, languages..."
                className="w-full p-3.5 text-xs bg-slate-50 border border-gray-200 rounded-2xl text-slate-900 placeholder:text-slate-400 font-medium outline-none focus:bg-white focus:border-blue-500 shadow-2xs"
              />
            </div>
          </div>

          {/* SECTION 7: Required Skills Selector */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  {isKhmer ? 'ជំនាញចាំបាច់ (Required Skills)' : 'Required Skills'}
                </label>
                <p className="text-[11px] text-slate-400">
                  {isKhmer ? 'ជ្រើសរើសជំនាញដែលត្រូវការសម្រាប់តួនាទីនេះ' : 'Select technologies & qualifications'}
                </p>
              </div>

              {/* Add Custom Skill */}
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={customSkillInput}
                  onChange={(e) => setCustomSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddCustomSkill()
                    }
                  }}
                  placeholder={isKhmer ? '+ បញ្ចូលជំនាញថ្មី...' : '+ Custom skill...'}
                  className="text-xs px-2.5 py-1 bg-slate-50 border border-gray-200 rounded-xl text-slate-800 placeholder:text-slate-400 font-medium outline-none focus:bg-white focus:border-blue-500 shadow-2xs"
                />
                <button
                  type="button"
                  onClick={handleAddCustomSkill}
                  disabled={isAddingSkill || !customSkillInput.trim()}
                  className="px-2.5 py-1 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold transition cursor-pointer disabled:opacity-50"
                >
                  {isKhmer ? 'បន្ថែម' : 'Add'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 max-h-52 overflow-y-auto p-3 border border-gray-200 rounded-2xl bg-slate-50/50 shadow-2xs">
              {filteredSkills.map((s) => {
                const isSelected = selectedSkillIds.includes(s.id)
                return (
                  <button
                    type="button"
                    key={s.id}
                    onClick={() => toggleSkill(s.id)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer text-left ${
                      isSelected
                        ? 'bg-blue-600 text-white border border-blue-600 shadow-2xs'
                        : 'bg-white text-slate-700 border border-gray-200 hover:bg-slate-100 hover:border-blue-300'
                    }`}
                  >
                    <span className="truncate">{s.name}</span>
                    {isSelected && <Check className="w-3 h-3 shrink-0 ml-1 text-white" />}
                  </button>
                )
              })}
            </div>
          </div>

          {/* SECTION 8: NEW - Explicit Job Status & Visibility Selector */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-gray-200 space-y-3 shadow-2xs">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-600" />
              <label className="text-xs font-bold text-slate-900">
                {isKhmer ? 'ស្ថានភាពការងារ និងការផ្សាយជាសាធារណៈ (Publishing Status)' : 'Publishing Status & Visibility'}
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Option 1: Published */}
              <button
                type="button"
                onClick={() => setJobStatus('published')}
                className={`p-3 rounded-xl border text-left transition cursor-pointer flex items-start gap-2.5 ${
                  jobStatus === 'published'
                    ? 'bg-emerald-50/80 border-emerald-400 text-emerald-950 ring-2 ring-emerald-400/20 shadow-2xs'
                    : 'bg-white border-gray-200 hover:bg-slate-100 text-slate-700'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center shrink-0 ${
                    jobStatus === 'published'
                      ? 'border-emerald-600 bg-emerald-600 text-white'
                      : 'border-slate-300'
                  }`}
                >
                  {jobStatus === 'published' && <Check className="w-2.5 h-2.5" />}
                </div>
                <div>
                  <span className="text-xs font-bold block">
                    {isKhmer ? 'ផ្សាយផ្ទាល់ (Published)' : 'Published (Live)'}
                  </span>
                  <span className="text-[11px] text-slate-500 leading-tight block mt-0.5">
                    {isKhmer ? 'ការងារនឹងបង្ហាញជាសាធារណៈភ្លាមៗ ដើម្បីទទួលបេក្ខជន' : 'Immediately visible to job seekers'}
                  </span>
                </div>
              </button>

              {/* Option 2: Draft */}
              <button
                type="button"
                onClick={() => setJobStatus('draft')}
                className={`p-3 rounded-xl border text-left transition cursor-pointer flex items-start gap-2.5 ${
                  jobStatus === 'draft'
                    ? 'bg-amber-50/80 border-amber-400 text-amber-950 ring-2 ring-amber-400/20 shadow-2xs'
                    : 'bg-white border-gray-200 hover:bg-slate-100 text-slate-700'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center shrink-0 ${
                    jobStatus === 'draft'
                      ? 'border-amber-600 bg-amber-600 text-white'
                      : 'border-slate-300'
                  }`}
                >
                  {jobStatus === 'draft' && <Check className="w-2.5 h-2.5" />}
                </div>
                <div>
                  <span className="text-xs font-bold block">
                    {isKhmer ? 'សេចក្តីព្រាង (Draft)' : 'Draft (Unpublished)'}
                  </span>
                  <span className="text-[11px] text-slate-500 leading-tight block mt-0.5">
                    {isKhmer ? 'រក្សាទុកជាព្រាង មិនទាន់ផ្សាយជាសាធារណៈ' : 'Saved privately, hidden from seekers'}
                  </span>
                </div>
              </button>

              {/* Option 3: Closed */}
              <button
                type="button"
                onClick={() => setJobStatus('closed')}
                className={`p-3 rounded-xl border text-left transition cursor-pointer flex items-start gap-2.5 ${
                  jobStatus === 'closed'
                    ? 'bg-rose-50/80 border-rose-400 text-rose-950 ring-2 ring-rose-400/20 shadow-2xs'
                    : 'bg-white border-gray-200 hover:bg-slate-100 text-slate-700'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center shrink-0 ${
                    jobStatus === 'closed'
                      ? 'border-rose-600 bg-rose-600 text-white'
                      : 'border-slate-300'
                  }`}
                >
                  {jobStatus === 'closed' && <Check className="w-2.5 h-2.5" />}
                </div>
                <div>
                  <span className="text-xs font-bold block">
                    {isKhmer ? 'បិទការជ្រើសរើស (Closed)' : 'Closed'}
                  </span>
                  <span className="text-[11px] text-slate-500 leading-tight block mt-0.5">
                    {isKhmer ? 'បិទមិនទទួលពាក្យសុំបណ្ដោះអាសន្ន' : 'Stop accepting new applications'}
                  </span>
                </div>
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
                className={`inline-flex items-center justify-center gap-2 px-5 py-2 rounded-xl font-semibold text-xs transition shadow-2xs ${
                  !isEditMode && company !== null && company.verification_status !== 'verified'
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
                      ? 'រក្សាទុក & ផ្សាយផ្ទាល់ការងារ (Save & Post)'
                      : 'Save & Post Vacancy'
                    : isKhmer
                    ? 'ចុះផ្សាយការងារឥឡូវនេះ (Publish Live)'
                    : 'Publish Vacancy Now'}
                </span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
