import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { seekerService } from '../../services/seeker.service'
import { jobsService } from '../../services/jobs.service'
import { SeekerProfile, Education, Resume, Skill } from '../../types'
import { Select } from '../../components/ui/Select'
import { useToast } from '../../app/providers'
import {
  User,
  Briefcase,
  GraduationCap,
  Award,
  FileText,
  Upload,
  Trash2,
  Plus,
  X,
  AlertTriangle,
  Printer,
  Mail,
  Phone,
  MapPin,
} from 'lucide-react'

export const SeekerProfilePage: React.FC = () => {
  const { t, i18n } = useTranslation()
  const { toast } = useToast()
  const isKhmer = i18n.language === 'km'

  const [profile, setProfile] = useState<SeekerProfile | null>(null)
  const [availableSkills, setAvailableSkills] = useState<Skill[]>([])
  const [provinces, setProvinces] = useState<Array<{ province_en: string; province_km: string }>>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Edit personal info states
  const [fullName, setFullName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [headline, setHeadline] = useState('')
  const [summary, setSummary] = useState('')
  const [province, setProvince] = useState('')
  const [city, setCity] = useState('')
  const [expectedSalary, setExpectedSalary] = useState('')
  const [salaryCurrency, setSalaryCurrency] = useState<'USD' | 'KHR'>('USD')

  // Modals for adding entries
  const [isEduModalOpen, setIsEduModalOpen] = useState(false)
  const [newInstitution, setNewInstitution] = useState('')
  const [newDegree, setNewDegree] = useState('')
  const [newField, setNewField] = useState('')
  const [newEduStart, setNewEduStart] = useState('')
  const [newEduEnd, setNewEduEnd] = useState('')

  const [isExpModalOpen, setIsExpModalOpen] = useState(false)
  const [newCompany, setNewCompany] = useState('')
  const [newJobTitle, setNewJobTitle] = useState('')
  const [newExpLocation, setNewExpLocation] = useState('')
  const [newExpStart, setNewExpStart] = useState('')
  const [newExpEnd, setNewExpEnd] = useState('')
  const [isCurrentExp, setIsCurrentExp] = useState(false)

  // Skill select
  const [selectedSkillId, setSelectedSkillId] = useState<number | ''>('')
  const [skillProficiency, setSkillProficiency] = useState('intermediate')

  // CV Upload
  const [resumeTitle, setResumeTitle] = useState('')
  const [cvFile, setCvFile] = useState<File | null>(null)
  const [isUploadingCv, setIsUploadingCv] = useState(false)

  // In-app Delete Confirmation Modal State
  const [deletingItem, setDeletingItem] = useState<{
    type: 'education' | 'experience' | 'resume'
    id: number
    title: string
  } | null>(null)
  const [isDeletingItem, setIsDeletingItem] = useState(false)
  const [isPreviewCvOpen, setIsPreviewCvOpen] = useState(false)

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [p, skills, locs] = await Promise.all([
        seekerService.getProfile(),
        jobsService.getSkills(),
        jobsService.getLocations(),
      ])
      setProfile(p)
      setAvailableSkills(skills || [])
      setProvinces(locs.provinces || [])

      setFullName(p.full_name || '')
      setPhoneNumber(p.phone_number || '')
      setHeadline(p.headline || '')
      setSummary(p.summary || '')
      setProvince(p.province || '')
      setCity(p.city || '')
      setExpectedSalary(p.expected_salary ? p.expected_salary.toString() : '')
      setSalaryCurrency(p.salary_currency || 'USD')
    } catch (err) {
      console.error('Failed to load profile:', err)
      toast.error(
        isKhmer ? 'បរាជ័យ' : 'Error',
        isKhmer ? 'មិនអាចទាញយកព័ត៌មានប្រវត្តិរូបបានទេ' : 'Failed to load profile data.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSavingProfile(true)
    setMessage(null)
    setErrorMessage(null)
    try {
      await seekerService.updateProfile({
        full_name: fullName,
        phone_number: phoneNumber,
        headline,
        summary,
        province,
        city,
        expected_salary: expectedSalary ? Number(expectedSalary) : undefined,
        salary_currency: salaryCurrency,
      })
      toast.success(
        isKhmer ? 'បានកែប្រែប្រវត្តិរូប' : 'Profile Updated',
        isKhmer ? 'ព័ត៌មានប្រវត្តិរូបត្រូវបានកែប្រែដោយជោគជ័យ!' : 'Profile details updated successfully!'
      )
    } catch (err) {
      toast.error(
        isKhmer ? 'បរាជ័យ' : 'Error',
        isKhmer ? 'បរាជ័យក្នុងការរក្សាទុកព័ត៌មាន។' : 'Failed to save profile.'
      )
    } finally {
      setIsSavingProfile(false)
    }
  }

  const handleAddEducation = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await seekerService.addEducation({
        institution: newInstitution,
        degree: newDegree,
        field_of_study: newField,
        start_date: newEduStart || undefined,
        end_date: newEduEnd || undefined,
        is_current: false,
      })
      setIsEduModalOpen(false)
      setNewInstitution('')
      setNewDegree('')
      setNewField('')
      setNewEduStart('')
      setNewEduEnd('')
      toast.success(
        isKhmer ? 'បានបន្ថែមការអប់រំ' : 'Education Added',
        isKhmer ? 'ប្រវត្តិអប់រំត្រូវបានបន្ថែមដោយជោគជ័យ' : 'Education record added.'
      )
      loadData()
    } catch (err) {
      toast.error(
        isKhmer ? 'បរាជ័យ' : 'Error',
        isKhmer ? 'បរាជ័យក្នុងការបន្ថែមការអប់រំ។' : 'Failed to add education.'
      )
    }
  }

  const handleConfirmDelete = async () => {
    if (!deletingItem) return
    setIsDeletingItem(true)
    try {
      if (deletingItem.type === 'education') {
        await seekerService.deleteEducation(deletingItem.id)
        toast.success(
          isKhmer ? 'បានលុបកំណត់ត្រាអប់រំ' : 'Education Deleted',
          isKhmer ? 'កំណត់ត្រាអប់រំត្រូវបានលុបចេញ' : 'Education entry removed.'
        )
      } else if (deletingItem.type === 'experience') {
        await seekerService.deleteExperience(deletingItem.id)
        toast.success(
          isKhmer ? 'បានលុបបទពិសោធន៍' : 'Experience Deleted',
          isKhmer ? 'បទពិសោធន៍ត្រូវបានលុបចេញ' : 'Work experience removed.'
        )
      } else if (deletingItem.type === 'resume') {
        await seekerService.deleteResume(deletingItem.id)
        toast.success(
          isKhmer ? 'បានលុបឯកសារ CV' : 'CV Deleted',
          isKhmer ? 'ឯកសារ CV ត្រូវបានលុបចេញ' : 'CV file deleted.'
        )
      }
      loadData()
    } catch (err) {
      toast.error(isKhmer ? 'បរាជ័យក្នុងការលុប' : 'Failed to delete item')
    } finally {
      setIsDeletingItem(false)
      setDeletingItem(null)
    }
  }

  const handleAddExperience = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await seekerService.addExperience({
        company_name: newCompany,
        job_title: newJobTitle,
        location: newExpLocation,
        start_date: newExpStart || undefined,
        end_date: isCurrentExp ? undefined : newExpEnd || undefined,
        is_current: isCurrentExp,
      })
      setIsExpModalOpen(false)
      setNewCompany('')
      setNewJobTitle('')
      setNewExpLocation('')
      setNewExpStart('')
      setNewExpEnd('')
      setIsCurrentExp(false)
      toast.success(
        isKhmer ? 'បានបន្ថែមបទពិសោធន៍' : 'Experience Added',
        isKhmer ? 'ប្រវត្តិការងារត្រូវបានបន្ថែមដោយជោគជ័យ' : 'Work experience added.'
      )
      loadData()
    } catch (err) {
      toast.error(
        isKhmer ? 'បរាជ័យ' : 'Error',
        isKhmer ? 'បរាជ័យក្នុងការបន្ថែមបទពិសោធន៍។' : 'Failed to add experience.'
      )
    }
  }



  const handleAddSkill = async () => {
    if (!selectedSkillId) return
    try {
      await seekerService.addSkill(Number(selectedSkillId), skillProficiency)
      toast.success(
        isKhmer ? 'បានបន្ថែមជំនាញ' : 'Skill Added',
        isKhmer ? 'ជំនាញត្រូវបានបន្ថែមក្នុងប្រវត្តិរូបរបស់អ្នក' : 'Skill added to your profile.'
      )
      loadData()
      setSelectedSkillId('')
    } catch (err) {
      toast.error(
        isKhmer ? 'បរាជ័យ' : 'Error',
        isKhmer ? 'បរាជ័យក្នុងការបន្ថែមជំនាញ។' : 'Failed to add skill.'
      )
    }
  }

  const handleDeleteSkill = async (skillId: number) => {
    try {
      await seekerService.deleteSkill(skillId)
      toast.success(
        isKhmer ? 'បានដកជំនាញចេញ' : 'Skill Removed',
        isKhmer ? 'ជំនាញត្រូវបានដកចេញពីប្រវត្តិរូប' : 'Skill removed from profile.'
      )
      loadData()
    } catch (err) {
      toast.error(isKhmer ? 'បរាជ័យក្នុងការដកជំនាញ' : 'Failed to remove skill')
    }
  }

  const handleUploadResume = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!cvFile && !resumeTitle) {
      toast.error(
        isKhmer ? 'សូមជ្រើសរើសឯកសារ' : 'File Required',
        isKhmer ? 'សូមជ្រើសរើសឯកសារ ឬដាក់ឈ្មោះ CV។' : 'Please select a file or provide a CV title.'
      )
      return
    }
    setIsUploadingCv(true)
    try {
      const fd = new FormData()
      if (resumeTitle) fd.append('title', resumeTitle)
      if (cvFile) fd.append('file', cvFile)
      await seekerService.uploadResume(fd)
      setCvFile(null)
      setResumeTitle('')
      toast.success(
        isKhmer ? 'បានផ្ទុកឡើងឯកសារ CV' : 'CV Uploaded',
        isKhmer ? 'ឯកសារ CV ត្រូវបានផ្ទុកឡើងដោយជោគជ័យ' : 'CV file uploaded successfully.'
      )
      loadData()
    } catch (err: any) {
      const msg = err.response?.data?.details?.file?.[0] || (isKhmer ? 'បរាជ័យក្នុងការផ្ទុកឡើងឯកសារ CV។' : 'Failed to upload CV.')
      toast.error(isKhmer ? 'បរាជ័យ' : 'Upload Failed', msg)
    } finally {
      setIsUploadingCv(false)
    }
  }



  if (isLoading) {
    return (
      <div className="py-24 text-center">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="mt-3 text-xs font-medium text-slate-400">
          {isKhmer ? 'កំពុងដំណើរការ...' : 'Loading your profile...'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-5 font-sans w-full pb-16">
      {/* 1. SaaS Page Header */}
      <div className="bg-white dark:bg-slate-900/90 p-4 sm:p-5 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            {isKhmer ? 'ប្រវត្តិរូប និង CV' : 'Profile & Resumes'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {isKhmer
              ? 'គ្រប់គ្រងព័ត៌មានផ្ទាល់ខ្លួន បទពិសោធន៍ការងារ ការអប់រំ ជំនាញ និងឯកសារ CV របស់អ្នក'
              : 'Manage your contact details, professional headline, work history, education, and resume files'}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setIsPreviewCvOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-98 text-white text-xs font-semibold flex items-center space-x-1.5 transition shadow-2xs cursor-pointer"
            title={isKhmer ? 'មើល និងទាញយកប្រវត្តិរូប CV' : 'Preview and Export Resume CV'}
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{isKhmer ? 'បោះពុម្ព ឬ ទាញយក CV' : 'Print / Export CV'}</span>
          </button>
        </div>
      </div>

      {/* 2. Personal Information Card */}
      <div className="bg-white dark:bg-slate-900/90 rounded-2xl border border-gray-200 dark:border-slate-800 p-4 sm:p-5 shadow-2xs space-y-4 text-slate-900 dark:text-slate-100">
        <div className="flex items-center space-x-3 pb-3 border-b border-gray-100 dark:border-slate-800">
          <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-gray-200 dark:border-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 shadow-2xs">
            <User className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
              {isKhmer ? 'ព័ត៌មានផ្ទាល់ខ្លួន' : 'Personal Information'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isKhmer ? 'កែប្រែឈ្មោះ លេខទូរស័ព្ទ និងសេចក្ដីសង្ខេបអំពីខ្លួនអ្នក' : 'Keep your contact and headline details up to date'}
            </p>
          </div>
        </div>

        <form onSubmit={handleUpdateProfile} className="space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {isKhmer ? 'ឈ្មោះពេញ' : 'Full Name'}
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full text-xs p-2.5 bg-white border border-gray-200 rounded-xl text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {isKhmer ? 'លេខទូរស័ព្ទ' : 'Phone Number'}
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+855 12 345 678"
                className="w-full text-xs p-2.5 bg-white border border-gray-200 rounded-xl text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition shadow-2xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {isKhmer ? 'មុខតំណែងជំនាញ' : 'Professional Headline'}
            </label>
            <input
              type="text"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="e.g. Senior Full-Stack Engineer | React & Python Developer"
              className="w-full text-xs p-2.5 bg-white border border-gray-200 rounded-xl text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition shadow-2xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {isKhmer ? 'សេចក្តីសង្ខេប / ជីវប្រវត្តិសង្ខេប' : 'Summary / Bio'}
            </label>
            <textarea
              rows={3}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Brief overview of your experience, career goals, and strengths..."
              className="w-full text-xs p-2.5 bg-white border border-gray-200 rounded-xl text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition shadow-2xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {isKhmer ? 'រាជធានី / ខេត្ត' : 'Province / Municipality'}
              </label>
              <Select
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                placeholder={isKhmer ? 'ជ្រើសរើសខេត្ត' : 'Select Province'}
                options={[
                  { value: '', label: isKhmer ? 'ជ្រើសរើសខេត្ត' : 'Select Province' },
                  ...provinces.map((p) => ({
                    value: p.province_en,
                    label: `${p.province_en} (${p.province_km})`,
                  })),
                ]}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {isKhmer ? 'ប្រាក់ខែរំពឹងទុក' : 'Expected Monthly Salary'}
              </label>
              <input
                type="number"
                value={expectedSalary}
                onChange={(e) => setExpectedSalary(e.target.value)}
                placeholder="e.g. 1500"
                className="w-full text-xs p-2.5 bg-white border border-gray-200 rounded-xl text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {isKhmer ? 'រូបិយប័ណ្ណ' : 'Salary Currency'}
              </label>
              <Select
                value={salaryCurrency}
                onChange={(e) => setSalaryCurrency(e.target.value as any)}
                options={[
                  { value: 'USD', label: 'USD ($)' },
                  { value: 'KHR', label: 'KHR (៛)' },
                ]}
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSavingProfile}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition shadow-2xs disabled:opacity-50 cursor-pointer"
            >
              {isSavingProfile
                ? (isKhmer ? 'កំពុងរក្សាទុក...' : 'Saving...')
                : (isKhmer ? 'រក្សាទុកព័ត៌មាន' : 'Save Profile Details')}
            </button>
          </div>
        </form>
      </div>

      {/* 3. CV & Resume Files Card */}
      <div className="bg-white dark:bg-slate-900/90 rounded-2xl border border-gray-200 dark:border-slate-800 p-4 sm:p-5 shadow-2xs space-y-4 text-slate-900 dark:text-slate-100">
        <div className="flex items-center space-x-3 pb-3 border-b border-gray-100 dark:border-slate-800">
          <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-gray-200 dark:border-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 shadow-2xs">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
              {isKhmer ? 'ឯកសារប្រវត្តិរូប និង CV' : 'CV & Resume Files'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isKhmer ? 'ផ្ទុកឡើងឯកសារ PDF ឬ Word សម្រាប់ដាក់ពាក្យការងារ' : 'Upload your PDF or Word documents for job applications'}
            </p>
          </div>
        </div>

        {/* Existing CVs list */}
        <div className="space-y-2">
          {profile?.resumes && profile.resumes.length > 0 ? (
            profile.resumes.map((resume) => (
              <div
                key={resume.id}
                className="flex items-center justify-between p-3.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800 transition shadow-2xs"
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-blue-100/70 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{resume.title}</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {(resume.file_size / 1024).toFixed(0)} KB • {isKhmer ? 'ផ្ទុកឡើង' : 'Uploaded'} {new Date(resume.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  {resume.is_primary && (
                    <span className="px-2 py-0.5 text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-gray-200 dark:border-blue-800/40 rounded-md shrink-0">
                      {isKhmer ? 'CV ចម្បង' : 'Primary CV'}
                    </span>
                  )}
                </div>

                <button
                  onClick={() => setDeletingItem({ type: 'resume', id: resume.id, title: resume.title })}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition shrink-0 cursor-pointer"
                  title={isKhmer ? 'លុប CV' : 'Delete Resume'}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-400 dark:text-slate-500 italic py-2">
              {isKhmer ? 'មិនទាន់មានឯកសារ CV ផ្ទុកឡើងនៅឡើយទេ។' : 'No resumes uploaded yet.'}
            </p>
          )}
        </div>

        {/* Upload Form */}
        <form onSubmit={handleUploadResume} className="pt-3 border-t border-gray-100 dark:border-slate-800 flex flex-col sm:flex-row gap-3 items-end">
          <div className="flex-1 w-full">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {isKhmer ? 'ចំណងជើង CV' : 'Resume Title'}
            </label>
            <input
              type="text"
              value={resumeTitle}
              onChange={(e) => setResumeTitle(e.target.value)}
              placeholder="e.g. Sokha_Meas_Senior_Developer_CV"
              className="w-full text-xs p-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition shadow-2xs"
            />
          </div>

          <div className="flex-1 w-full">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {isKhmer ? 'ជ្រើសរើសឯកសារ (PDF / DOCX)' : 'Upload File (PDF / DOCX)'}
            </label>
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={(e) => setCvFile(e.target.files?.[0] || null)}
              className="w-full text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 dark:file:bg-blue-950/60 file:text-blue-700 dark:file:text-blue-300 hover:file:bg-blue-100/80 cursor-pointer text-slate-500 dark:text-slate-400 border border-gray-200 dark:border-slate-700 rounded-xl p-1.5 bg-white dark:bg-slate-800 shadow-2xs"
            />
          </div>

          <button
            type="submit"
            disabled={isUploadingCv}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition shrink-0 disabled:opacity-50 flex items-center shadow-2xs cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 mr-1.5" />
            <span>{isUploadingCv ? (isKhmer ? 'កំពុងផ្ទុក...' : 'Uploading...') : (isKhmer ? 'ផ្ទុកឡើង CV' : 'Upload CV')}</span>
          </button>
        </form>
      </div>

      {/* 4. Work Experience Card */}
      <div className="bg-white dark:bg-slate-900/90 rounded-2xl border border-gray-200 dark:border-slate-800 p-4 sm:p-5 shadow-2xs space-y-4 text-slate-900 dark:text-slate-100">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-gray-200 dark:border-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 shadow-2xs">
              <Briefcase className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                {isKhmer ? 'បទពិសោធន៍ការងារ' : 'Work Experience'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isKhmer ? 'ប្រវត្តិការងារ និងតួនាទីកន្លងមក' : 'Career journey and past positions'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsExpModalOpen(true)}
            className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center transition shadow-2xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 mr-1 text-blue-600 dark:text-blue-400" />
            <span>{isKhmer ? 'បន្ថែមបទពិសោធន៍' : 'Add Experience'}</span>
          </button>
        </div>

        <div className="space-y-2">
          {profile?.work_experiences && profile.work_experiences.length > 0 ? (
            profile.work_experiences.map((exp) => (
              <div key={exp.id} className="flex justify-between items-start p-3.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800 transition shadow-2xs">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">{exp.job_title}</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">{exp.company_name} {exp.location ? `• ${exp.location}` : ''}</p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                    {exp.start_date} - {exp.is_current ? (isKhmer ? 'បច្ចុប្បន្ន' : 'Present') : exp.end_date || (isKhmer ? 'បច្ចុប្បន្ន' : 'Present')}
                  </p>
                </div>
                <button
                  onClick={() => setDeletingItem({ type: 'experience', id: exp.id, title: `${exp.job_title} @ ${exp.company_name}` })}
                  className="text-slate-400 hover:text-rose-600 p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition cursor-pointer"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-400 dark:text-slate-500 italic py-2">
              {isKhmer ? 'មិនទាន់មានបទពិសោធន៍ការងារត្រូវបានបន្ថែមនៅឡើយទេ។' : 'No work experiences listed.'}
            </p>
          )}
        </div>
      </div>

      {/* 5. Education Card */}
      <div className="bg-white dark:bg-slate-900/90 rounded-2xl border border-gray-200 dark:border-slate-800 p-4 sm:p-5 shadow-2xs space-y-4 text-slate-900 dark:text-slate-100">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-gray-200 dark:border-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 shadow-2xs">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                {isKhmer ? 'កម្រិតវប្បធម៌ និងការអប់រំ' : 'Education'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isKhmer ? 'សញ្ញាបត្រ សាកលវិទ្យាល័យ និងវិញ្ញាបនបត្រ' : 'Degrees, colleges, and certifications'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsEduModalOpen(true)}
            className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center transition shadow-2xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 mr-1 text-blue-600 dark:text-blue-400" />
            <span>{isKhmer ? 'បន្ថែមការអប់រំ' : 'Add Education'}</span>
          </button>
        </div>

        <div className="space-y-2">
          {profile?.educations && profile.educations.length > 0 ? (
            profile.educations.map((edu) => (
              <div key={edu.id} className="flex justify-between items-start p-3.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800 transition shadow-2xs">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">{edu.degree}</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">{edu.institution} {edu.field_of_study ? `• ${edu.field_of_study}` : ''}</p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                    {edu.start_date} - {edu.end_date || (isKhmer ? 'បច្ចុប្បន្ន' : 'Present')}
                  </p>
                </div>
                <button
                  onClick={() => setDeletingItem({ type: 'education', id: edu.id, title: `${edu.degree} (${edu.institution})` })}
                  className="text-slate-400 hover:text-rose-600 p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition cursor-pointer"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-400 dark:text-slate-500 italic py-2">
              {isKhmer ? 'មិនទាន់មានកំណត់ត្រាអប់រំត្រូវបានបន្ថែមនៅឡើយទេ។' : 'No education records added yet.'}
            </p>
          )}
        </div>
      </div>

      {/* 6. Skills Card */}
      <div className="bg-white dark:bg-slate-900/90 rounded-2xl border border-gray-200 dark:border-slate-800 p-4 sm:p-5 shadow-2xs space-y-4 text-slate-900 dark:text-slate-100">
        <div className="flex items-center space-x-3 pb-3 border-b border-gray-100 dark:border-slate-800">
          <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-gray-200 dark:border-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 shadow-2xs">
            <Award className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
              {isKhmer ? 'ជំនាញ និងសមត្ថភាព' : 'Skills & Competencies'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isKhmer ? 'ជំនាញបច្ចេកទេស និងភាសា' : 'Technical proficiencies and language abilities'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {profile?.skills && profile.skills.length > 0 ? (
            profile.skills.map((s) => (
              <span
                key={s.id}
                className="inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-semibold bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-gray-200 dark:border-blue-800/40"
              >
                <span>{s.name} ({s.proficiency_level})</span>
                <button
                  onClick={() => handleDeleteSkill(s.id)}
                  className="ml-1.5 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                  title="Remove skill"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))
          ) : (
            <p className="text-xs text-slate-400 dark:text-slate-500 italic py-1">
              {isKhmer ? 'មិនទាន់មានជំនាញត្រូវបានបន្ថែមនៅឡើយទេ។' : 'No skills added yet.'}
            </p>
          )}
        </div>

        <div className="pt-3 border-t border-gray-100 flex flex-col sm:flex-row gap-2.5">
          <div className="flex-1">
            <Select
              value={selectedSkillId}
              onChange={(e) => setSelectedSkillId(e.target.value ? Number(e.target.value) : '')}
              placeholder={isKhmer ? 'ជ្រើសរើសជំនាញដើម្បីបន្ថែម...' : 'Select a skill to add...'}
              options={[
                { value: '', label: isKhmer ? 'ជ្រើសរើសជំនាញដើម្បីបន្ថែម...' : 'Select a skill to add...' },
                ...availableSkills.map((sk) => ({
                  value: sk.id,
                  label: `${sk.name} (${sk.category || 'General'})`,
                })),
              ]}
            />
          </div>

          <div className="sm:w-44">
            <Select
              value={skillProficiency}
              onChange={(e) => setSkillProficiency(e.target.value)}
              options={[
                { value: 'beginner', label: isKhmer ? 'កម្រិតដំបូង (Beginner)' : 'Beginner' },
                { value: 'intermediate', label: isKhmer ? 'កម្រិតមធ្យម (Intermediate)' : 'Intermediate' },
                { value: 'advanced', label: isKhmer ? 'កម្រិតខ្ពស់ (Advanced)' : 'Advanced' },
                { value: 'expert', label: isKhmer ? 'កម្រិតជំនាញច្បាស់ (Expert)' : 'Expert' },
                { value: 'fluent', label: isKhmer ? 'ស្ទាត់ជំនាញ (Fluent)' : 'Fluent (Language)' },
                { value: 'native', label: isKhmer ? 'ភាសាកំណើត (Native)' : 'Native (Language)' },
              ]}
            />
          </div>

          <button
            type="button"
            onClick={handleAddSkill}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition shrink-0 shadow-2xs cursor-pointer"
          >
            {isKhmer ? 'បន្ថែមជំនាញ' : 'Add Skill'}
          </button>
        </div>
      </div>

      {/* Modals */}
      {isEduModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-gray-200 text-slate-900 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                {isKhmer ? 'បន្ថែមព័ត៌មានអប់រំ' : 'Add Education'}
              </h3>
              <button onClick={() => setIsEduModalOpen(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddEducation} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isKhmer ? 'គ្រឹះស្ថានសិក្សា / សាកលវិទ្យាល័យ *' : 'Institution *'}
                </label>
                <input
                  type="text"
                  required
                  value={newInstitution}
                  onChange={(e) => setNewInstitution(e.target.value)}
                  placeholder="e.g. Royal University of Phnom Penh (RUPP)"
                  className="w-full text-xs p-2.5 bg-white border border-gray-200 rounded-xl text-slate-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isKhmer ? 'កម្រិតសញ្ញាបត្រ *' : 'Degree *'}
                </label>
                <input
                  type="text"
                  required
                  value={newDegree}
                  onChange={(e) => setNewDegree(e.target.value)}
                  placeholder="e.g. Bachelor of Computer Science"
                  className="w-full text-xs p-2.5 bg-white border border-gray-200 rounded-xl text-slate-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isKhmer ? 'ជំនាញឯកទេស' : 'Field of Study'}
                </label>
                <input
                  type="text"
                  value={newField}
                  onChange={(e) => setNewField(e.target.value)}
                  placeholder="e.g. Software Engineering"
                  className="w-full text-xs p-2.5 bg-white border border-gray-200 rounded-xl text-slate-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition shadow-2xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {isKhmer ? 'កាលបរិច្ឆេទចាប់ផ្តើម' : 'Start Date'}
                  </label>
                  <input
                    type="date"
                    value={newEduStart}
                    onChange={(e) => setNewEduStart(e.target.value)}
                    className="w-full text-xs p-2 bg-white border border-gray-200 rounded-xl text-slate-900 outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {isKhmer ? 'កាលបរិច្ឆេទបញ្ចប់' : 'End Date'}
                  </label>
                  <input
                    type="date"
                    value={newEduEnd}
                    onChange={(e) => setNewEduEnd(e.target.value)}
                    className="w-full text-xs p-2 bg-white border border-gray-200 rounded-xl text-slate-900 outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsEduModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-gray-200 transition shadow-2xs cursor-pointer"
                >
                  {isKhmer ? 'បោះបង់' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-2xs cursor-pointer"
                >
                  {isKhmer ? 'រក្សាទុក' : 'Save Education'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      
      {/* Printable / Exportable CV Modal */}
      {isPreviewCvOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full my-8 shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Action Bar */}
            <div className="p-4 bg-slate-50 border-b border-gray-200 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                  {isKhmer ? 'ប្រវត្តិរូបសង្ខេប CV' : 'Professional Curriculum Vitae (CV)'}
                </h3>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-2xs cursor-pointer transition active:scale-98"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{isKhmer ? 'បោះពុម្ព / Save PDF' : 'Print / Save PDF'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsPreviewCvOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* A4 Resume Body */}
            <div className="p-6 sm:p-8 overflow-y-auto space-y-5 text-slate-900 font-sans">
              {/* CV Header */}
              <div className="border-b border-gray-200 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    {profile?.full_name || 'Candidate Name'}
                  </h1>
                  <p className="text-xs sm:text-sm font-semibold text-blue-600 mt-0.5">
                    {profile?.headline || (isKhmer ? 'បេក្ខជនការងារ' : 'Job Seeker')}
                  </p>
                </div>
                <div className="text-xs text-slate-600 space-y-1">
                  {profile?.email && (
                    <div className="flex items-center space-x-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>{profile.email}</span>
                    </div>
                  )}
                  {profile?.phone_number && (
                    <div className="flex items-center space-x-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{profile.phone_number}</span>
                    </div>
                  )}
                  {profile?.province && (
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{profile.province} {profile.city ? `, ${profile.city}` : ''}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Summary */}
              {profile?.summary && (
                <div className="space-y-1.5">
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    {isKhmer ? 'សេចក្តីសង្ខេបអំពីខ្លួន' : 'Professional Summary'}
                  </h3>
                  <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50 p-3 rounded-xl border border-gray-100">
                    {profile.summary}
                  </p>
                </div>
              )}

              {/* Work Experience */}
              {profile?.work_experiences && profile.work_experiences.length > 0 && (
                <div className="space-y-2.5">
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    {isKhmer ? 'ប្រវត្តិការងារ' : 'Work Experience'}
                  </h3>
                  <div className="space-y-2.5 divide-y divide-gray-100">
                    {profile.work_experiences.map((exp) => (
                      <div key={exp.id} className="pt-2.5 first:pt-0 space-y-0.5">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-slate-900">{exp.job_title}</h4>
                          <span className="text-[11px] text-slate-500 font-medium">
                            {exp.start_date} — {exp.is_current ? (isKhmer ? 'បច្ចុប្បន្ន' : 'Present') : exp.end_date || 'Present'}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-slate-600">
                          {exp.company_name} {exp.location ? `• ${exp.location}` : ''}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Education */}
              {profile?.educations && profile.educations.length > 0 && (
                <div className="space-y-2.5">
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    {isKhmer ? 'កម្រិតវប្បធម៌ និងការអប់រំ' : 'Education'}
                  </h3>
                  <div className="space-y-2.5 divide-y divide-gray-100">
                    {profile.educations.map((edu) => (
                      <div key={edu.id} className="pt-2.5 first:pt-0 space-y-0.5">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-slate-900">{edu.degree}</h4>
                          <span className="text-[11px] text-slate-500 font-medium">
                            {edu.start_date} — {edu.end_date || (isKhmer ? 'បច្ចុប្បន្ន' : 'Present')}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-slate-600">
                          {edu.institution} {edu.field_of_study ? `• ${edu.field_of_study}` : ''}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Skills */}
              {profile?.skills && profile.skills.length > 0 && (
                <div className="space-y-1.5">
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    {isKhmer ? 'ជំនាញ និងសមត្ថភាព' : 'Skills & Proficiencies'}
                  </h3>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {profile.skills.map((s) => (
                      <span
                        key={s.id}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 border border-gray-200"
                      >
                        {s.name} <span className="text-[10px] text-slate-400 font-normal">({s.proficiency_level})</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {isExpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-gray-200 text-slate-900 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                {isKhmer ? 'បន្ថែមបទពិសោធន៍ការងារ' : 'Add Work Experience'}
              </h3>
              <button onClick={() => setIsExpModalOpen(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddExperience} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isKhmer ? 'ឈ្មោះក្រុមហ៊ុន / ស្ថាប័ន *' : 'Company Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={newCompany}
                  onChange={(e) => setNewCompany(e.target.value)}
                  placeholder="e.g. Smart Axiata or ABA Bank"
                  className="w-full text-xs p-2.5 bg-white border border-gray-200 rounded-xl text-slate-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isKhmer ? 'មុខតំណែង *' : 'Job Title *'}
                </label>
                <input
                  type="text"
                  required
                  value={newJobTitle}
                  onChange={(e) => setNewJobTitle(e.target.value)}
                  placeholder="e.g. Frontend Developer"
                  className="w-full text-xs p-2.5 bg-white border border-gray-200 rounded-xl text-slate-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isKhmer ? 'ទីតាំង' : 'Location'}
                </label>
                <input
                  type="text"
                  value={newExpLocation}
                  onChange={(e) => setNewExpLocation(e.target.value)}
                  placeholder="e.g. Phnom Penh"
                  className="w-full text-xs p-2.5 bg-white border border-gray-200 rounded-xl text-slate-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition shadow-2xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {isKhmer ? 'កាលបរិច្ឆេទចាប់ផ្តើម' : 'Start Date'}
                  </label>
                  <input
                    type="date"
                    value={newExpStart}
                    onChange={(e) => setNewExpStart(e.target.value)}
                    className="w-full text-xs p-2 bg-white border border-gray-200 rounded-xl text-slate-900 outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {isKhmer ? 'កាលបរិច្ឆេទបញ្ចប់' : 'End Date'}
                  </label>
                  <input
                    type="date"
                    disabled={isCurrentExp}
                    value={newExpEnd}
                    onChange={(e) => setNewExpEnd(e.target.value)}
                    className="w-full text-xs p-2 bg-white border border-gray-200 rounded-xl text-slate-900 outline-none focus:border-blue-500 disabled:opacity-40"
                  />
                </div>
              </div>

              <label className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={isCurrentExp}
                  onChange={(e) => setIsCurrentExp(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <span>{isKhmer ? 'ខ្ញុំកំពុងបម្រើការងារនៅទីនេះ' : 'I currently work here'}</span>
              </label>

              <div className="flex justify-end space-x-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsExpModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-gray-200 transition shadow-2xs cursor-pointer"
                >
                  {isKhmer ? 'បោះបង់' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-2xs cursor-pointer"
                >
                  {isKhmer ? 'រក្សាទុក' : 'Save Experience'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      
      {/* Printable / Exportable CV Modal */}
      {isPreviewCvOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full my-8 shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Action Bar */}
            <div className="p-4 bg-slate-50 border-b border-gray-200 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                  {isKhmer ? 'ប្រវត្តិរូបសង្ខេប CV' : 'Professional Curriculum Vitae (CV)'}
                </h3>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-2xs cursor-pointer transition active:scale-98"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{isKhmer ? 'បោះពុម្ព / Save PDF' : 'Print / Save PDF'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsPreviewCvOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* A4 Resume Body */}
            <div className="p-6 sm:p-8 overflow-y-auto space-y-5 text-slate-900 font-sans">
              {/* CV Header */}
              <div className="border-b border-gray-200 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    {profile?.full_name || 'Candidate Name'}
                  </h1>
                  <p className="text-xs sm:text-sm font-semibold text-blue-600 mt-0.5">
                    {profile?.headline || (isKhmer ? 'បេក្ខជនការងារ' : 'Job Seeker')}
                  </p>
                </div>
                <div className="text-xs text-slate-600 space-y-1">
                  {profile?.email && (
                    <div className="flex items-center space-x-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>{profile.email}</span>
                    </div>
                  )}
                  {profile?.phone_number && (
                    <div className="flex items-center space-x-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{profile.phone_number}</span>
                    </div>
                  )}
                  {profile?.province && (
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{profile.province} {profile.city ? `, ${profile.city}` : ''}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Summary */}
              {profile?.summary && (
                <div className="space-y-1.5">
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    {isKhmer ? 'សេចក្តីសង្ខេបអំពីខ្លួន' : 'Professional Summary'}
                  </h3>
                  <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50 p-3 rounded-xl border border-gray-100">
                    {profile.summary}
                  </p>
                </div>
              )}

              {/* Work Experience */}
              {profile?.work_experiences && profile.work_experiences.length > 0 && (
                <div className="space-y-2.5">
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    {isKhmer ? 'ប្រវត្តិការងារ' : 'Work Experience'}
                  </h3>
                  <div className="space-y-2.5 divide-y divide-gray-100">
                    {profile.work_experiences.map((exp) => (
                      <div key={exp.id} className="pt-2.5 first:pt-0 space-y-0.5">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-slate-900">{exp.job_title}</h4>
                          <span className="text-[11px] text-slate-500 font-medium">
                            {exp.start_date} — {exp.is_current ? (isKhmer ? 'បច្ចុប្បន្ន' : 'Present') : exp.end_date || 'Present'}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-slate-600">
                          {exp.company_name} {exp.location ? `• ${exp.location}` : ''}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Education */}
              {profile?.educations && profile.educations.length > 0 && (
                <div className="space-y-2.5">
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    {isKhmer ? 'កម្រិតវប្បធម៌ និងការអប់រំ' : 'Education'}
                  </h3>
                  <div className="space-y-2.5 divide-y divide-gray-100">
                    {profile.educations.map((edu) => (
                      <div key={edu.id} className="pt-2.5 first:pt-0 space-y-0.5">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-slate-900">{edu.degree}</h4>
                          <span className="text-[11px] text-slate-500 font-medium">
                            {edu.start_date} — {edu.end_date || (isKhmer ? 'បច្ចុប្បន្ន' : 'Present')}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-slate-600">
                          {edu.institution} {edu.field_of_study ? `• ${edu.field_of_study}` : ''}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Skills */}
              {profile?.skills && profile.skills.length > 0 && (
                <div className="space-y-1.5">
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    {isKhmer ? 'ជំនាញ និងសមត្ថភាព' : 'Skills & Proficiencies'}
                  </h3>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {profile.skills.map((s) => (
                      <span
                        key={s.id}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 border border-gray-200"
                      >
                        {s.name} <span className="text-[10px] text-slate-400 font-normal">({s.proficiency_level})</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* In-app Delete Item Confirmation Modal */}
      {deletingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-xl border border-gray-200 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-gray-200 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {isKhmer ? 'បញ្ជាក់ការលុប' : 'Confirm Deletion'}
                </h3>
                <p className="text-xs text-slate-500">
                  {isKhmer ? 'សកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ' : 'This action cannot be undone'}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-gray-200">
              {isKhmer
                ? `តើអ្នកប្រាកដជាចង់លុប "${deletingItem.title}" នេះមែនទេ?`
                : `Are you sure you want to delete "${deletingItem.title}"?`}
            </p>

            <div className="flex items-center justify-end space-x-2 pt-1">
              <button
                type="button"
                onClick={() => setDeletingItem(null)}
                disabled={isDeletingItem}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-gray-200 transition cursor-pointer disabled:opacity-50"
              >
                {isKhmer ? 'បោះបង់' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeletingItem}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-2xs cursor-pointer transition disabled:opacity-50 flex items-center space-x-1"
              >
                {isDeletingItem ? (
                  <span>{isKhmer ? 'កំពុងលុប...' : 'Deleting...'}</span>
                ) : (
                  <span>{isKhmer ? 'យល់ព្រមលុប' : 'Delete'}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printable / Exportable CV Modal */}
      {isPreviewCvOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full my-8 shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Action Bar */}
            <div className="p-4 bg-slate-50 border-b border-gray-200 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                  {isKhmer ? 'ប្រវត្តិរូបសង្ខេប CV' : 'Professional Curriculum Vitae (CV)'}
                </h3>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-2xs cursor-pointer transition active:scale-98"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{isKhmer ? 'បោះពុម្ព / Save PDF' : 'Print / Save PDF'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsPreviewCvOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* A4 Resume Body */}
            <div className="p-6 sm:p-8 overflow-y-auto space-y-5 text-slate-900 font-sans">
              {/* CV Header */}
              <div className="border-b border-gray-200 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    {profile?.full_name || 'Candidate Name'}
                  </h1>
                  <p className="text-xs sm:text-sm font-semibold text-blue-600 mt-0.5">
                    {profile?.headline || (isKhmer ? 'បេក្ខជនការងារ' : 'Job Seeker')}
                  </p>
                </div>
                <div className="text-xs text-slate-600 space-y-1">
                  {profile?.email && (
                    <div className="flex items-center space-x-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>{profile.email}</span>
                    </div>
                  )}
                  {profile?.phone_number && (
                    <div className="flex items-center space-x-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{profile.phone_number}</span>
                    </div>
                  )}
                  {profile?.province && (
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{profile.province} {profile.city ? `, ${profile.city}` : ''}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Summary */}
              {profile?.summary && (
                <div className="space-y-1.5">
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    {isKhmer ? 'សេចក្តីសង្ខេបអំពីខ្លួន' : 'Professional Summary'}
                  </h3>
                  <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50 p-3 rounded-xl border border-gray-100">
                    {profile.summary}
                  </p>
                </div>
              )}

              {/* Work Experience */}
              {profile?.work_experiences && profile.work_experiences.length > 0 && (
                <div className="space-y-2.5">
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    {isKhmer ? 'ប្រវត្តិការងារ' : 'Work Experience'}
                  </h3>
                  <div className="space-y-2.5 divide-y divide-gray-100">
                    {profile.work_experiences.map((exp) => (
                      <div key={exp.id} className="pt-2.5 first:pt-0 space-y-0.5">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-slate-900">{exp.job_title}</h4>
                          <span className="text-[11px] text-slate-500 font-medium">
                            {exp.start_date} — {exp.is_current ? (isKhmer ? 'បច្ចុប្បន្ន' : 'Present') : exp.end_date || 'Present'}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-slate-600">
                          {exp.company_name} {exp.location ? `• ${exp.location}` : ''}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Education */}
              {profile?.educations && profile.educations.length > 0 && (
                <div className="space-y-2.5">
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    {isKhmer ? 'កម្រិតវប្បធម៌ និងការអប់រំ' : 'Education'}
                  </h3>
                  <div className="space-y-2.5 divide-y divide-gray-100">
                    {profile.educations.map((edu) => (
                      <div key={edu.id} className="pt-2.5 first:pt-0 space-y-0.5">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-slate-900">{edu.degree}</h4>
                          <span className="text-[11px] text-slate-500 font-medium">
                            {edu.start_date} — {edu.end_date || (isKhmer ? 'បច្ចុប្បន្ន' : 'Present')}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-slate-600">
                          {edu.institution} {edu.field_of_study ? `• ${edu.field_of_study}` : ''}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Skills */}
              {profile?.skills && profile.skills.length > 0 && (
                <div className="space-y-1.5">
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    {isKhmer ? 'ជំនាញ និងសមត្ថភាព' : 'Skills & Proficiencies'}
                  </h3>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {profile.skills.map((s) => (
                      <span
                        key={s.id}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 border border-gray-200"
                      >
                        {s.name} <span className="text-[10px] text-slate-400 font-normal">({s.proficiency_level})</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
