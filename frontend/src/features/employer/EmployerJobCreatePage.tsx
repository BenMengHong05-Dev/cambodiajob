import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
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
} from 'lucide-react'

export const EmployerJobCreatePage: React.FC = () => {
  const navigate = useNavigate()
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

  // Custom Skill Input States
  const [customSkillInput, setCustomSkillInput] = useState('')
  const [isAddingSkill, setIsAddingSkill] = useState(false)
  const [skillSearch, setSkillSearch] = useState('')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [company, setCompany] = useState<Company | null>(null)
  const [isLoadingCompany, setIsLoadingCompany] = useState(true)

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

  const toggleSkill = (id: number) => {
    setSelectedSkillIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    )
  }

  const handleAddCustomSkill = async () => {
    const trimmed = customSkillInput.trim()
    if (!trimmed) return

    // 1. Check if it already exists in the loaded list
    const existing = skills.find(
      (s) => s.name.toLowerCase() === trimmed.toLowerCase()
    )
    if (existing) {
      if (!selectedSkillIds.includes(existing.id)) {
        setSelectedSkillIds((prev) => [...prev, existing.id])
      }
      setCustomSkillInput('')
      return
    }

    // 2. Create in backend and select
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Strict Admin approval check: only approved companies can post jobs
    if (company && company.verification_status !== 'verified') {
      setError(
        isKhmer
          ? 'ក្រុមហ៊ុនរបស់អ្នកកំពុងរង់ចាំការអនុម័តពី Admin។ មានតែក្រុមហ៊ុនដែលត្រូវបានអនុម័តដោយ Admin ប៉ុណ្ណោះដែលអាចចុះផ្សាយការងារបាន។'
          : 'Your company is awaiting Administrator confirmation. Only verified companies approved by the Platform Administrator can post job vacancies.'
      )
      return
    }

    setIsSubmitting(true)

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
        status: 'published',
      })
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

  // Options for Select components (font-normal)
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

        <span className="text-[11px] font-medium text-slate-400">
          {isKhmer ? 'ការបង្កើតឱកាសការងារថ្មី' : 'Create New Job Opening'}
        </span>
      </div>

      {/* Main Form Container: w-full Pure White */}
      <div className="w-full bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 shadow-2xs space-y-5 sm:space-y-6">
        {/* Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-slate-50 border border-gray-200 text-blue-600 flex items-center justify-center shrink-0 shadow-2xs">
              <Briefcase className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                {isKhmer ? 'ចុះផ្សាយឱកាសការងារថ្មី' : 'Post New Job Vacancy'}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                {isKhmer
                  ? 'បញ្ជាក់ព័ត៌មានលម្អិតអំពីតួនាទី ប្រាក់បៀវត្ស លក្ខខណ្ឌតម្រូវ និងជំនាញចាំបាច់'
                  : 'Specify vacancy details, salary, requirements, and required skills'}
              </p>
            </div>
          </div>

          <div className="hidden sm:block">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold bg-blue-50 text-blue-700 border border-gray-200 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>{isKhmer ? 'ផ្សាយផ្ទាល់ភ្លាមៗ' : 'Instant Publish'}</span>
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

        {/* Company Verification Guard Alert */}
        {!isLoadingCompany && company && company.verification_status !== 'verified' && (
          <div className="p-4 rounded-xl bg-amber-50/90 border border-amber-200 text-amber-900 text-xs flex items-start space-x-3 shadow-2xs animate-in fade-in duration-150">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-bold text-amber-900 text-xs">
                {isKhmer
                  ? 'ក្រុមហ៊ុនកំពុងរង់ចាំការអនុម័តពី Admin (Awaiting Admin Confirmation)'
                  : 'Company Awaiting Administrator Confirmation'}
              </h4>
              <p className="text-amber-800 leading-relaxed font-normal text-xs">
                {isKhmer
                  ? 'មានតែ Admin ប៉ុណ្ណោះដែលអាចផ្ទៀងផ្ទាត់ និងអនុម័តក្រុមហ៊ុនឱ្យដំណើរការ និងចុះផ្សាយឱកាសការងារលើប្រព័ន្ធនេះ។ គណនីក្រុមហ៊ុនរបស់អ្នកកំពុងស្ថិតក្នុងការត្រួតពិនិត្យ ដូច្នេះមិនទាន់អាចចុះផ្សាយការងារបាននៅឡើយទេ។'
                  : 'Only the Platform Administrator has the authority to confirm and approve companies to use this platform and recruit candidates. Your company is currently awaiting verification, so vacancy publishing is restricted until approved.'}
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
          {/* SECTION 1: Job Titles (4-Column Grid) */}
          <div className="space-y-3">
            <h2 className="text-xs sm:text-sm font-bold text-slate-900 pb-1.5 border-b border-gray-100">
              {isKhmer ? '១. ចំណងជើងការងារ' : '1. Job Title & Identification'}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              <div className="sm:col-span-2 lg:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isKhmer ? 'ចំណងជើងការងារ (អង់គ្លេស)' : 'Job Title (English)'} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Senior Frontend Developer"
                  className="w-full text-xs p-2.5 bg-white border border-gray-200 rounded-xl text-slate-800 placeholder-slate-400 font-medium outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition shadow-2xs"
                />
              </div>

              <div className="sm:col-span-2 lg:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isKhmer ? 'ចំណងជើងការងារ (ខ្មែរ) (ស្រេចចិត្ត)' : 'Job Title (Khmer) (Optional)'}
                </label>
                <input
                  type="text"
                  value={titleKm}
                  onChange={(e) => setTitleKm(e.target.value)}
                  placeholder="ឧ. អ្នកបង្កើតគេហទំព័រជាន់ខ្ពស់"
                  className="w-full text-xs p-2.5 bg-white border border-gray-200 rounded-xl text-slate-800 placeholder-slate-400 font-medium outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition shadow-2xs"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: Category & Location (4-Column Grid) */}
          <div className="space-y-3">
            <h2 className="text-xs sm:text-sm font-bold text-slate-900 pb-1.5 border-b border-gray-100">
              {isKhmer ? '២. ផ្នែកការងារ និងទីតាំង' : '2. Category & Location'}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              <div className="col-span-1">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isKhmer ? 'ផ្នែកការងារ' : 'Job Category'} <span className="text-rose-500">*</span>
                </label>
                <Select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : '')}
                  options={categoryOptions}
                />
              </div>

              <div className="col-span-1">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isKhmer ? 'ខេត្ត / រាជធានី' : 'Province / City'} <span className="text-rose-500">*</span>
                </label>
                <Select
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  options={provinceOptions}
                />
              </div>

              <div className="sm:col-span-2 lg:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isKhmer ? 'ខណ្ឌ / ស្រុក / តំបន់' : 'District / Khan / Area'}
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder={isKhmer ? 'ឧ. ខណ្ឌដូនពេញ ឬ BKK1' : 'e.g. Doun Penh or BKK1'}
                  className="w-full text-xs p-2.5 bg-white border border-gray-200 rounded-xl text-slate-800 placeholder-slate-400 font-medium outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition shadow-2xs"
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: Work Attributes (4-Column Grid: 1 col each) */}
          <div className="space-y-3">
            <h2 className="text-xs sm:text-sm font-bold text-slate-900 pb-1.5 border-b border-gray-100">
              {isKhmer ? '៣. លក្ខខណ្ឌការងារ និងកម្រិតបទពិសោធន៍' : '3. Employment & Experience Level'}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              <div className="col-span-1">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isKhmer ? 'ប្រភេទការងារ' : 'Employment Type'}
                </label>
                <Select
                  value={employmentType}
                  onChange={(e) => setEmploymentType(e.target.value)}
                  options={employmentTypeOptions}
                />
              </div>

              <div className="col-span-1">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isKhmer ? 'ទម្រង់កន្លែងធ្វើការ' : 'Workplace Type'}
                </label>
                <Select
                  value={workplaceType}
                  onChange={(e) => setWorkplaceType(e.target.value)}
                  options={workplaceTypeOptions}
                />
              </div>

              <div className="col-span-1">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isKhmer ? 'កម្រិតបទពិសោធន៍' : 'Experience Level'}
                </label>
                <Select
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value)}
                  options={experienceLevelOptions}
                />
              </div>

              <div className="col-span-1">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isKhmer ? 'កម្រិតអប់រំ' : 'Education Level'}
                </label>
                <Select
                  value={educationLevel}
                  onChange={(e) => setEducationLevel(e.target.value)}
                  options={educationLevelOptions}
                />
              </div>
            </div>
          </div>

          {/* SECTION 4: Monthly Salary Specifications (4-Column Grid: 1 col each) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/70 border border-gray-200 space-y-3.5 shadow-2xs">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                {isKhmer ? 'លក្ខខណ្ឌប្រាក់បៀវត្សប្រចាំខែ' : 'Monthly Salary Specifications'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              <div className="col-span-1">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isKhmer ? 'រូបិយប័ណ្ណ' : 'Currency'}
                </label>
                <Select
                  value={salaryCurrency}
                  onChange={(e) => setSalaryCurrency(e.target.value as any)}
                  options={currencyOptions}
                />
              </div>

              <div className="col-span-1">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isKhmer ? 'ប្រាក់ខែទាបបំផុត' : 'Min Salary'}
                </label>
                <input
                  type="number"
                  value={salaryMin}
                  onChange={(e) => setSalaryMin(e.target.value)}
                  placeholder={salaryCurrency === 'USD' ? 'e.g. 800' : 'e.g. 3000000'}
                  className="w-full text-xs p-2.5 bg-white border border-gray-200 rounded-xl text-slate-800 placeholder-slate-400 font-medium outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition shadow-2xs"
                />
              </div>

              <div className="col-span-1">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isKhmer ? 'ប្រាក់ខែខ្ពស់បំផុត' : 'Max Salary'}
                </label>
                <input
                  type="number"
                  value={salaryMax}
                  onChange={(e) => setSalaryMax(e.target.value)}
                  placeholder={salaryCurrency === 'USD' ? 'e.g. 1500' : 'e.g. 5000000'}
                  className="w-full text-xs p-2.5 bg-white border border-gray-200 rounded-xl text-slate-800 placeholder-slate-400 font-medium outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition shadow-2xs"
                />
              </div>

              <div className="col-span-1">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isKhmer ? 'ចំនួនជ្រើសរើស' : 'Vacancies'}
                </label>
                <input
                  type="number"
                  min={1}
                  value={vacanciesCount}
                  onChange={(e) => setVacanciesCount(Number(e.target.value) || 1)}
                  className="w-full text-xs p-2.5 bg-white border border-gray-200 rounded-xl text-slate-800 font-medium outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition shadow-2xs"
                />
              </div>

              <div className="col-span-1 sm:col-span-2 lg:col-span-4 pt-1">
                <label className="flex items-center space-x-2 text-xs font-medium text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isSalaryNegotiable}
                    onChange={(e) => setIsSalaryNegotiable(e.target.checked)}
                    className="w-3.5 h-3.5 text-blue-600 rounded border-gray-300 focus:ring-1 focus:ring-blue-200"
                  />
                  <span>
                    {isKhmer
                      ? 'ប្រាក់បៀវត្សអាចចរចាបានតាមសមត្ថភាព និងបទពិសោធន៍ជាក់ស្តែងរបស់បេក្ខជន'
                      : 'Salary is negotiable based on candidate experience'}
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* SECTION 5: Descriptions & Requirements (4-Column Grid) */}
          <div className="space-y-4">
            <h2 className="text-xs sm:text-sm font-bold text-slate-900 pb-1.5 border-b border-gray-100">
              {isKhmer ? '៤. ការពិពណ៌នាការងារ និងលក្ខខណ្ឌជ្រើសរើស' : '4. Job Description & Qualifications'}
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-3.5">
              <div className="lg:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isKhmer ? 'ការពិពណ៌នាការងារ (អង់គ្លេស)' : 'Job Description (English)'} <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={5}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detailed description of responsibilities and day-to-day work..."
                  className="w-full text-xs p-2.5 bg-white border border-gray-200 rounded-xl text-slate-800 placeholder-slate-400 font-medium outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition shadow-2xs"
                />
              </div>

              <div className="lg:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isKhmer ? 'ការពិពណ៌នាការងារ (ខ្មែរ) (ស្រេចចិត្ត)' : 'Job Description (Khmer) (Optional)'}
                </label>
                <textarea
                  rows={5}
                  value={descriptionKm}
                  onChange={(e) => setDescriptionKm(e.target.value)}
                  placeholder="ការពិពណ៌នាអំពីតួនាទី និងភារកិច្ចជាភាសាខ្មែរ..."
                  className="w-full text-xs p-2.5 bg-white border border-gray-200 rounded-xl text-slate-800 placeholder-slate-400 font-medium outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition shadow-2xs"
                />
              </div>

              <div className="lg:col-span-4">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isKhmer ? 'លក្ខខណ្ឌតម្រូវ និងគុណវុឌ្ឍិ' : 'Requirements & Qualifications'}
                </label>
                <textarea
                  rows={4}
                  value={requirements}
                  onChange={(e) => setRequirements(e.target.value)}
                  placeholder="- 2+ years of relevant experience&#10;- Bachelor's degree in related field&#10;- Fluency in Khmer and English"
                  className="w-full text-xs p-2.5 bg-white border border-gray-200 rounded-xl text-slate-800 placeholder-slate-400 font-medium outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition shadow-2xs"
                />
              </div>
            </div>
          </div>

          {/* SECTION 6: REQUIRED SKILLS (4-Column Grid) */}
          <div className="space-y-3 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1.5 border-b border-gray-100">
              <div>
                <h2 className="text-xs sm:text-sm font-bold text-slate-900">
                  {isKhmer ? '៥. ជំនាញដែលត្រូវការ (Required Skills)' : '5. Select Required Skills'}
                </h2>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {isKhmer
                    ? 'ជ្រើសរើសពីបញ្ជី ឬវាយបញ្ចូលជំនាញថ្មីប្រសិនបើគ្មានក្នុងជម្រើស'
                    : 'Choose from preset skills or type to add custom skills if not found'}
                </p>
              </div>

              {/* Input for custom skill if not available in list */}
              <div className="flex items-center gap-1.5 w-full sm:w-auto">
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
                  placeholder={
                    isKhmer
                      ? 'វាយបញ្ចូលជំនាញបើគ្មានក្នុងជម្រើស...'
                      : 'Type skill if not in list...'
                  }
                  className="flex-1 sm:w-60 text-xs p-2 bg-white border border-gray-200 rounded-xl text-slate-800 placeholder-slate-400 font-medium outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition shadow-2xs"
                />
                <button
                  type="button"
                  onClick={handleAddCustomSkill}
                  disabled={!customSkillInput.trim() || isAddingSkill}
                  className="inline-flex items-center gap-1 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-gray-200 rounded-xl text-xs font-semibold transition cursor-pointer disabled:opacity-50 shrink-0 shadow-2xs"
                >
                  {isAddingSkill ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Plus className="w-3.5 h-3.5" />
                  )}
                  <span>{isKhmer ? 'បន្ថែម' : 'Add'}</span>
                </button>
              </div>
            </div>

            {/* Currently Selected Skills Display */}
            {selectedSkillIds.length > 0 && (
              <div className="p-3 bg-blue-50/50 rounded-2xl border border-gray-200 space-y-1.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-blue-900">
                    {isKhmer ? 'ជំនាញដែលបានជ្រើសរើស' : 'Selected Skills'} ({selectedSkillIds.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedSkillIds([])}
                    className="text-[10px] font-semibold text-blue-600 hover:text-rose-600 transition cursor-pointer"
                  >
                    {isKhmer ? 'លុបទាំងអស់' : 'Clear All'}
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {selectedSkillIds.map((id) => {
                    const s = skills.find((item) => item.id === id)
                    if (!s) return null
                    return (
                      <span
                        key={id}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold bg-white text-blue-700 border border-gray-200 shadow-2xs"
                      >
                        <Tag className="w-3 h-3 text-blue-500" />
                        <span>{s.name}</span>
                        <button
                          type="button"
                          onClick={() => toggleSkill(id)}
                          className="text-slate-400 hover:text-rose-600 transition cursor-pointer ml-0.5"
                          title="Remove"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Available Skills in 4-Column Grid */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-slate-500">
                  {isKhmer ? 'បញ្ជីជំនាញដែលមានស្រាប់ (ចុចដើម្បីជ្រើសរើស):' : 'Available Skills (Click to select):'}
                </span>
                {skills.length > 15 && (
                  <input
                    type="text"
                    value={skillSearch}
                    onChange={(e) => setSkillSearch(e.target.value)}
                    placeholder={isKhmer ? 'ស្វែងរកជំនាញ...' : 'Filter skills...'}
                    className="text-[11px] px-2 py-0.5 bg-slate-50 border border-gray-200 rounded-md text-slate-700 font-medium outline-none focus:border-blue-500 shadow-2xs"
                  />
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 max-h-56 overflow-y-auto p-3 border border-gray-200 rounded-2xl bg-slate-50/40 shadow-2xs">
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
                          : 'bg-white text-slate-600 border border-gray-200 hover:bg-slate-100 hover:border-blue-300'
                      }`}
                    >
                      <span className="truncate">{s.name}</span>
                      {isSelected && <Check className="w-3 h-3 shrink-0 ml-1 text-white" />}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* ACTION FOOTER BAR: Cancel & Post */}
          <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => navigate('/employer/jobs')}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-gray-200 transition cursor-pointer shadow-2xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{isKhmer ? 'បោះបង់' : 'Cancel'}</span>
            </button>

            <button
              type="submit"
              disabled={isSubmitting || (company !== null && company.verification_status !== 'verified')}
              className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs transition shadow-2xs ${
                company !== null && company.verification_status !== 'verified'
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 active:scale-95 text-white cursor-pointer disabled:opacity-50'
              }`}
            >
              {isSubmitting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : company !== null && company.verification_status !== 'verified' ? (
                <ShieldAlert className="w-3.5 h-3.5 text-slate-500" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              <span>
                {isSubmitting
                  ? isKhmer
                    ? 'កំពុងចុះផ្សាយ...'
                    : 'Publishing Vacancy...'
                  : company !== null && company.verification_status !== 'verified'
                  ? isKhmer
                    ? 'រង់ចាំ Admin អនុម័តក្រុមហ៊ុន'
                    : 'Awaiting Admin Approval to Post'
                  : isKhmer
                  ? 'ចុះផ្សាយការងារ (Post Vacancy)'
                  : 'Post Job Vacancy'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
