import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { seekerService } from '../../services/seeker.service'
import { jobsService } from '../../services/jobs.service'
import { SeekerProfile, Education, Resume, Skill } from '../../types'
import { Select, Input, Textarea, Dialog } from '../../components/ui'
import { useToast, useAuth } from '../../app/providers'
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
  DollarSign,
  Save,
  Building,
  CheckCircle2,
  Sparkles,
  Globe,
  Download,
} from 'lucide-react'
import { getAssetUrl } from '../../utils/assets'

export const SeekerProfilePage: React.FC = () => {
  const { t, i18n } = useTranslation()
  const { toast } = useToast()
  const { user } = useAuth()
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
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            {isKhmer ? 'ប្រវត្តិរូប និង CV' : 'Profile & Resumes'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {isKhmer
              ? 'គ្រប់គ្រងព័ត៌មានផ្ទាល់ខ្លួន បទពិសោធន៍ការងារ ការអប់រំ ជំនាញ និងឯកសារ CV របស់អ្នក'
              : 'Manage your contact details, professional headline, work history, education, and resume files'}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setIsPreviewCvOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white text-xs font-semibold flex items-center space-x-1.5 transition shadow-2xs cursor-pointer"
            title={isKhmer ? 'មើល និងទាញយកប្រវត្តិរូប CV' : 'Preview and Export Resume CV'}
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{isKhmer ? 'បោះពុម្ព ឬ ទាញយក CV' : 'Print / Export CV'}</span>
          </button>
        </div>
      </div>

      {/* 2. Personal Information Card */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 shadow-2xs space-y-4 text-slate-900">
        <div className="flex items-center space-x-3 pb-3 border-b border-gray-100">
          <div className="w-9 h-9 rounded-xl bg-blue-50 border border-gray-200 text-blue-600 flex items-center justify-center shrink-0 shadow-2xs">
            <User className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs sm:text-sm font-bold text-slate-900">
              {isKhmer ? 'ព័ត៌មានផ្ទាល់ខ្លួន' : 'Personal Information'}
            </h2>
            <p className="text-xs text-slate-500">
              {isKhmer ? 'កែប្រែឈ្មោះ លេខទូរស័ព្ទ និងសេចក្ដីសង្ខេបអំពីខ្លួនអ្នក' : 'Keep your contact and headline details up to date'}
            </p>
          </div>
        </div>

        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={isKhmer ? 'ឈ្មោះពេញ' : 'Full Name'}
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder={isKhmer ? 'បញ្ចូលឈ្មោះពេញរបស់អ្នក' : 'Enter your full name'}
              leftIcon={<User className="w-4 h-4" />}
            />

            <Input
              label={isKhmer ? 'លេខទូរស័ព្ទ' : 'Phone Number'}
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+855 12 345 678"
              leftIcon={<Phone className="w-4 h-4" />}
            />
          </div>

          <Input
            label={isKhmer ? 'មុខតំណែងជំនាញ' : 'Professional Headline'}
            type="text"
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            placeholder="e.g. Senior Full-Stack Engineer | React & Python Developer"
            leftIcon={<Briefcase className="w-4 h-4" />}
          />

          <Textarea
            label={isKhmer ? 'សេចក្តីសង្ខេប / ជីវប្រវត្តិសង្ខេប' : 'Summary / Bio'}
            rows={3}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Brief overview of your experience, career goals, and strengths..."
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select
              label={isKhmer ? 'រាជធានី / ខេត្ត' : 'Province / Municipality'}
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

            <Input
              label={isKhmer ? 'ប្រាក់ខែរំពឹងទុក' : 'Expected Monthly Salary'}
              type="number"
              value={expectedSalary}
              onChange={(e) => setExpectedSalary(e.target.value)}
              placeholder="e.g. 1500"
              leftIcon={<DollarSign className="w-4 h-4" />}
            />

            <Select
              label={isKhmer ? 'រូបិយប័ណ្ណ' : 'Salary Currency'}
              value={salaryCurrency}
              onChange={(e) => setSalaryCurrency(e.target.value as any)}
              options={[
                { value: 'USD', label: 'USD ($)' },
                { value: 'KHR', label: 'KHR (៛)' },
              ]}
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSavingProfile}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-semibold text-xs transition shadow-xs hover:shadow-md disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>
                {isSavingProfile
                  ? (isKhmer ? 'កំពុងរក្សាទុក...' : 'Saving...')
                  : (isKhmer ? 'រក្សាទុកព័ត៌មាន' : 'Save Profile Details')}
              </span>
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 shadow-2xs space-y-4 text-slate-900 z-20">
        <div className="flex items-center space-x-3 pb-3 border-b border-gray-100">
          <div className="w-9 h-9 rounded-xl bg-blue-50 border border-gray-200 text-blue-600 flex items-center justify-center shrink-0 shadow-2xs">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs sm:text-sm font-bold text-slate-900">
              {isKhmer ? 'ឯកសារប្រវត្តិរូប និង CV' : 'CV & Resume Files'}
            </h2>
            <p className="text-xs text-slate-500">
              {isKhmer ? 'ផ្ទុកឡើងឯកសារ PDF ឬ Word សម្រាប់ដាក់ពាក្យការងារ' : 'Upload your PDF or Word documents for job applications'}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          {profile?.resumes && profile.resumes.length > 0 ? (
            profile.resumes.map((resume) => (
              <div
                key={resume.id}
                className="flex items-center justify-between p-3.5 rounded-xl border border-gray-200 bg-slate-50/60 hover:bg-slate-50 transition shadow-2xs"
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-blue-100/70 text-blue-700 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <h4 className="text-xs font-bold text-slate-900 truncate">{resume.title}</h4>
                    <p className="text-[11px] text-slate-500">
                      {(resume.file_size / 1024).toFixed(0)} KB • {isKhmer ? 'ផ្ទុកឡើង' : 'Uploaded'} {new Date(resume.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  {resume.is_primary && (
                    <span className="px-2 py-0.5 text-[10px] font-semibold bg-blue-50 text-blue-700 border border-gray-200 rounded-md shrink-0">
                      {isKhmer ? 'CV ចម្បង' : 'Primary CV'}
                    </span>
                  )}
                </div>

                <button
                  onClick={() => setDeletingItem({ type: 'resume', id: resume.id, title: resume.title })}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition shrink-0 cursor-pointer"
                  title={isKhmer ? 'លុប CV' : 'Delete Resume'}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-400 italic py-2">
              {isKhmer ? 'មិនទាន់មានឯកសារ CV ផ្ទុកឡើងនៅឡើយទេ។' : 'No resumes uploaded yet.'}
            </p>
          )}
        </div>

        {/* Upload Form */}
        <form onSubmit={handleUploadResume} className="pt-3 border-t border-gray-100 flex flex-col sm:flex-row gap-3 items-end">
          <div className="flex-1 w-full">
            <Input
              label={isKhmer ? 'ចំណងជើង CV' : 'Resume Title'}
              type="text"
              value={resumeTitle}
              onChange={(e) => setResumeTitle(e.target.value)}
              placeholder="e.g. Sokha_Meas_Senior_Developer_CV"
              leftIcon={<FileText className="w-4 h-4" />}
            />
          </div>

          <div className="flex-1 w-full space-y-1.5 font-sans">
            <label className="block text-xs font-semibold text-slate-700">
              {isKhmer ? 'ជ្រើសរើសឯកសារ' : 'Upload File (PDF / DOCX)'}
            </label>
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={(e) => setCvFile(e.target.files?.[0] || null)}
              className="w-full text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100/80 cursor-pointer text-slate-500 border border-gray-200 rounded-xl p-1 bg-slate-50 hover:bg-slate-100/60 min-h-[38px] transition"
            />
          </div>

          <button
            type="submit"
            disabled={isUploadingCv}
            className="px-4 py-2 min-h-[38px] bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition shrink-0 disabled:opacity-50 flex items-center shadow-xs cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 mr-1.5" />
            <span>{isUploadingCv ? (isKhmer ? 'កំពុងផ្ទុក...' : 'Uploading...') : (isKhmer ? 'ផ្ទុកឡើង CV' : 'Upload CV')}</span>
          </button>
        </form>
      </div>

      {/* 4. Work Experience Card */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 shadow-2xs space-y-4 text-slate-900">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-gray-200 text-blue-600 flex items-center justify-center shrink-0 shadow-2xs">
              <Briefcase className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-bold text-slate-900">
                {isKhmer ? 'បទពិសោធន៍ការងារ' : 'Work Experience'}
              </h2>
              <p className="text-xs text-slate-500">
                {isKhmer ? 'ប្រវត្តិការងារ និងតួនាទីកន្លងមក' : 'Career journey and past positions'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsExpModalOpen(true)}
            className="px-3 py-1.5 rounded-xl border border-gray-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center transition shadow-2xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 mr-1 text-blue-600" />
            <span>{isKhmer ? 'បន្ថែមបទពិសោធន៍' : 'Add Experience'}</span>
          </button>
        </div>

        <div className="space-y-2">
          {profile?.work_experiences && profile.work_experiences.length > 0 ? (
            profile.work_experiences.map((exp) => (
              <div key={exp.id} className="flex justify-between items-start p-3.5 rounded-xl border border-gray-200 bg-slate-50/60 hover:bg-slate-50 transition shadow-2xs">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{exp.job_title}</h4>
                  <p className="text-xs text-slate-600 mt-0.5">{exp.company_name} {exp.location ? `• ${exp.location}` : ''}</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {exp.start_date} - {exp.is_current ? (isKhmer ? 'បច្ចុប្បន្ន' : 'Present') : exp.end_date || (isKhmer ? 'បច្ចុប្បន្ន' : 'Present')}
                  </p>
                </div>
                <button
                  onClick={() => setDeletingItem({ type: 'experience', id: exp.id, title: `${exp.job_title} @ ${exp.company_name}` })}
                  className="text-slate-400 hover:text-rose-600 p-1.5 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-400 italic py-2">
              {isKhmer ? 'មិនទាន់មានបទពិសោធន៍ការងារត្រូវបានបន្ថែមនៅឡើយទេ។' : 'No work experiences listed.'}
            </p>
          )}
        </div>
      </div>

      {/* 5. Education Card */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 shadow-2xs space-y-4 text-slate-900">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-gray-200 text-blue-600 flex items-center justify-center shrink-0 shadow-2xs">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-bold text-slate-900">
                {isKhmer ? 'កម្រិតវប្បធម៌ និងការអប់រំ' : 'Education'}
              </h2>
              <p className="text-xs text-slate-500">
                {isKhmer ? 'សញ្ញាបត្រ សាកលវិទ្យាល័យ និងវិញ្ញាបនបត្រ' : 'Degrees, colleges, and certifications'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsEduModalOpen(true)}
            className="px-3 py-1.5 rounded-xl border border-gray-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center transition shadow-2xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 mr-1 text-blue-600" />
            <span>{isKhmer ? 'បន្ថែមការអប់រំ' : 'Add Education'}</span>
          </button>
        </div>

        <div className="space-y-2">
          {profile?.educations && profile.educations.length > 0 ? (
            profile.educations.map((edu) => (
              <div key={edu.id} className="flex justify-between items-start p-3.5 rounded-xl border border-gray-200 bg-slate-50/60 hover:bg-slate-50 transition shadow-2xs">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{edu.degree}</h4>
                  <p className="text-xs text-slate-600 mt-0.5">{edu.institution} {edu.field_of_study ? `• ${edu.field_of_study}` : ''}</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {edu.start_date} - {edu.end_date || (isKhmer ? 'បច្ចុប្បន្ន' : 'Present')}
                  </p>
                </div>
                <button
                  onClick={() => setDeletingItem({ type: 'education', id: edu.id, title: `${edu.degree} (${edu.institution})` })}
                  className="text-slate-400 hover:text-rose-600 p-1.5 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-400 italic py-2">
              {isKhmer ? 'មិនទាន់មានកំណត់ត្រាអប់រំត្រូវបានបន្ថែមនៅឡើយទេ។' : 'No education records added yet.'}
            </p>
          )}
        </div>
      </div>

      {/* 6. Skills Card */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 shadow-2xs space-y-4 text-slate-900">
        <div className="flex items-center space-x-3 pb-3 border-b border-gray-100">
          <div className="w-9 h-9 rounded-xl bg-blue-50 border border-gray-200 text-blue-600 flex items-center justify-center shrink-0 shadow-2xs">
            <Award className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs sm:text-sm font-bold text-slate-900">
              {isKhmer ? 'ជំនាញ និងសមត្ថភាព' : 'Skills & Competencies'}
            </h2>
            <p className="text-xs text-slate-500">
              {isKhmer ? 'ជំនាញបច្ចេកទេស និងភាសា' : 'Technical proficiencies and language abilities'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {profile?.skills && profile.skills.length > 0 ? (
            profile.skills.map((s) => (
              <span
                key={s.id}
                className="inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-semibold bg-blue-50 text-blue-700 border border-gray-200"
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
            <p className="text-xs text-slate-400 italic py-1">
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
                { value: 'beginner', label: isKhmer ? 'កម្រិតដំបូង' : 'Beginner' },
                { value: 'intermediate', label: isKhmer ? 'កម្រិតមធ្យម' : 'Intermediate' },
                { value: 'advanced', label: isKhmer ? 'កម្រិតខ្ពស់' : 'Advanced' },
                { value: 'expert', label: isKhmer ? 'កម្រិតជំនាញច្បាស់' : 'Expert' },
                { value: 'fluent', label: isKhmer ? 'ស្ទាត់ជំនាញ' : 'Fluent' },
                { value: 'native', label: isKhmer ? 'ភាសាកំណើត' : 'Native' },
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

      {/* Standard White Modals */}
      {/* Add Education Dialog */}
      <Dialog
        isOpen={isEduModalOpen}
        onClose={() => setIsEduModalOpen(false)}
        size="sm"
        title={isKhmer ? 'បន្ថែមព័ត៌មានអប់រំ' : 'Add Education'}
        icon={<GraduationCap className="w-5 h-5 text-blue-600" />}
      >
        <form onSubmit={handleAddEducation} className="space-y-3.5">
          <Input
            label={isKhmer ? 'គ្រឹះស្ថានសិក្សា / សាកលវិទ្យាល័យ' : 'Institution'}
            required
            value={newInstitution}
            onChange={(e) => setNewInstitution(e.target.value)}
            placeholder="e.g. Royal University of Phnom Penh (RUPP)"
            leftIcon={<GraduationCap className="w-4 h-4" />}
          />

          <Input
            label={isKhmer ? 'កម្រិតសញ្ញាបត្រ' : 'Degree'}
            required
            value={newDegree}
            onChange={(e) => setNewDegree(e.target.value)}
            placeholder="e.g. Bachelor of Computer Science"
          />

          <Input
            label={isKhmer ? 'ជំនាញឯកទេស' : 'Field of Study'}
            value={newField}
            onChange={(e) => setNewField(e.target.value)}
            placeholder="e.g. Software Engineering"
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label={isKhmer ? 'កាលបរិច្ឆេទចាប់ផ្តើម' : 'Start Date'}
              type="date"
              value={newEduStart}
              onChange={(e) => setNewEduStart(e.target.value)}
            />
            <Input
              label={isKhmer ? 'កាលបរិច្ឆេទបញ្ចប់' : 'End Date'}
              type="date"
              value={newEduEnd}
              onChange={(e) => setNewEduEnd(e.target.value)}
            />
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
      </Dialog>

      {/* Add Experience Dialog */}
      <Dialog
        isOpen={isExpModalOpen}
        onClose={() => setIsExpModalOpen(false)}
        size="sm"
        title={isKhmer ? 'បន្ថែមបទពិសោធន៍ការងារ' : 'Add Work Experience'}
        icon={<Briefcase className="w-5 h-5 text-blue-600" />}
      >
        <form onSubmit={handleAddExperience} className="space-y-3.5">
          <Input
            label={isKhmer ? 'ឈ្មោះក្រុមហ៊ុន / ស្ថាប័ន' : 'Company Name'}
            required
            value={newCompany}
            onChange={(e) => setNewCompany(e.target.value)}
            placeholder="e.g. Smart Axiata or ABA Bank"
            leftIcon={<Briefcase className="w-4 h-4" />}
          />

          <Input
            label={isKhmer ? 'មុខតំណែង' : 'Job Title'}
            required
            value={newJobTitle}
            onChange={(e) => setNewJobTitle(e.target.value)}
            placeholder="e.g. Frontend Developer"
          />

          <Input
            label={isKhmer ? 'ទីតាំង' : 'Location'}
            value={newExpLocation}
            onChange={(e) => setNewExpLocation(e.target.value)}
            placeholder="e.g. Phnom Penh"
            leftIcon={<MapPin className="w-4 h-4" />}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label={isKhmer ? 'កាលបរិច្ឆេទចាប់ផ្តើម' : 'Start Date'}
              type="date"
              value={newExpStart}
              onChange={(e) => setNewExpStart(e.target.value)}
            />
            <Input
              label={isKhmer ? 'កាលបរិច្ឆេទបញ្ចប់' : 'End Date'}
              type="date"
              disabled={isCurrentExp}
              value={newExpEnd}
              onChange={(e) => setNewExpEnd(e.target.value)}
            />
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
      </Dialog>

      {/* Delete Item Confirmation Dialog */}
      <Dialog
        isOpen={Boolean(deletingItem)}
        onClose={() => setDeletingItem(null)}
        size="xs"
        title={isKhmer ? 'បញ្ជាក់ការលុប' : 'Confirm Deletion'}
        description={isKhmer ? 'សកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ' : 'This action cannot be undone'}
        icon={<AlertTriangle className="w-5 h-5 text-rose-600" />}
        iconClassName="bg-rose-50 border-rose-200"
        footer={
          <div className="flex items-center justify-end space-x-2 w-full">
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
        }
      >
        <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-gray-200">
          {isKhmer
            ? `តើអ្នកប្រាកដជាចង់លុប "${deletingItem?.title}" នេះមែនទេ?`
            : `Are you sure you want to delete "${deletingItem?.title}"?`}
        </p>
      </Dialog>

      {/* Printable / Exportable CV Modal */}
      {isPreviewCvOpen && (
        <div

          className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-900/40 backdrop-blur-xs animate-in fade-in overflow-y-auto"
        >
          <div id="printable-cv-modal-wrapper" className=" bg-white rounded-2xl sm:rounded-3xl max-w-5xl w-full my-auto shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[96vh]">
            {/* Modal Action Bar (Clean White, No Tabs) */}
            <div className="no-print p-3.5 sm:px-6 bg-white border-b border-slate-200/90 flex items-center justify-between gap-3 shrink-0 text-slate-900">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 border border-blue-200/80 flex items-center justify-center shadow-2xs">
                  <FileText className="w-4.5 h-4.5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight">
                      {isKhmer ? 'ប្រវត្តិរូបសង្ខេប CV' : 'Curriculum Vitae (CV)'}
                    </h3>

                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {isKhmer ? 'ទម្រង់ A4 ស្តង់ដារ • អាចបោះពុម្ព ឬ Save ជា PDF' : 'Standard A4 Format • Print or Save as PDF'}
                  </span>
                </div>
              </div>

              {/* Action Buttons (Print / Save & Close) */}
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold flex items-center space-x-2 shadow-sm hover:shadow-md transition-all cursor-pointer active:scale-95"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{isKhmer ? 'បោះពុម្ព' : 'Print '}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsPreviewCvOpen(false)}
                  className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition cursor-pointer"
                  title={isKhmer ? 'បិទ' : 'Close'}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Scrollable Container with Pristine Pure White A4 Sheet */}
            <div className="p-3 sm:p-6 md:p-8 overflow-y-auto bg-slate-100/90 flex justify-center">
              {(() => {
                const candidateName = profile?.full_name || fullName || user?.full_name || 'MengHong Ben'
                const candidateEmail = profile?.email || user?.email || 'contact@cambodiajob.site'
                const candidatePhone = profile?.phone_number || phoneNumber || user?.phone_number || '+855 12 345 678'
                const candidateHeadline = profile?.headline || headline || (isKhmer ? 'អ្នកជំនាញ Full-Stack Developer' : 'Full Stack Developer')
                const candidateLocation = profile?.province || province ? `${profile?.province || province}${profile?.city || city ? `, ${profile?.city || city}` : ''}` : (isKhmer ? 'រាជធានីភ្នំពេញ' : 'Phnom Penh, Cambodia')
                const candidateSalary = profile?.expected_salary || expectedSalary
                const candidateCurrency = profile?.salary_currency || salaryCurrency || 'USD'
                const candidateAvatar = profile?.avatar_url || user?.avatar_url
                const candidateGender = profile?.gender
                const candidateSummary = profile?.summary || summary

                return (
                  <div className=" printable-cv-sheet cv-two-column-layout bg-white rounded-2xl shadow-xl overflow-hidden max-w-[850px] w-full flex flex-col md:flex-row min-h-[1080px] print:min-h-0 print:h-full print:rounded-none text-slate-800 border border-slate-200/90 print:border-none">
                    {/* LEFT SIDEBAR (Candidate Info, Contact, Education, Skills) - PURE WHITE WITH SOFT BORDER */}
                    <div className="cv-left-sidebar p-6 sm:p-7 pt-7 sm:pt-8 print:p-2 print:pt-2.5 space-y-6 print:space-y-2.5 md:w-[35%] shrink-0 flex flex-col justify-between bg-white text-slate-800 border-r border-slate-200/90">
                      <div className="space-y-6 print:space-y-2.5">
                        {/* Profile Avatar (Rounded-Full) */}
                        <div className="flex flex-col items-center text-center">
                          {candidateAvatar ? (
                            <div className="w-24 h-24 sm:w-28 sm:h-28 print:w-18 print:h-18 rounded-full overflow-hidden shadow-md shrink-0 border-2 border-blue-600/30 ring-4 ring-blue-50/80 mx-auto">
                              <img
                                src={getAssetUrl(candidateAvatar)}
                                alt={candidateName}
                                className="w-full h-full object-cover rounded-full"
                              />
                            </div>
                          ) : (
                            <div className="w-24 h-24 sm:w-28 sm:h-28 print:w-18 print:h-18 rounded-full flex items-center justify-center font-black text-3xl print:text-2xl shadow-md shrink-0 bg-gradient-to-br from-blue-600 to-indigo-600 text-white ring-4 ring-blue-50/80 mx-auto">
                              {candidateName.charAt(0)}
                            </div>
                          )}

                          {/* Mobile-only name display */}
                          <div className="md:hidden print:hidden mt-3">
                            <h2 className="text-lg font-black text-slate-900">{candidateName}</h2>
                            <p className="text-xs font-semibold text-blue-600">{candidateHeadline}</p>
                          </div>
                        </div>

                        {/* Contact Information */}
                        <div className="space-y-3 print:space-y-1.5 pt-2 print:pt-0">
                          <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5 pb-1 print:pb-0.5 border-b border-slate-200">
                            <Mail className="w-3.5 h-3.5 text-blue-600" />
                            <span>{isKhmer ? 'ទំនាក់ទំនង' : 'Contact'}</span>
                          </h4>
                          <div className="space-y-2 print:space-y-1 text-xs print:text-[11px]">
                            {candidateEmail && (
                              <div className="flex items-start space-x-2.5">
                                <div className="w-5 h-5 print:w-4 print:h-4 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                                  <Mail className="w-3 h-3 print:w-2.5 print:h-2.5" />
                                </div>
                                <span className="break-all font-medium text-slate-700">{candidateEmail}</span>
                              </div>
                            )}

                            {candidatePhone && (
                              <div className="flex items-center space-x-2.5">
                                <div className="w-5 h-5 print:w-4 print:h-4 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                  <Phone className="w-3 h-3 print:w-2.5 print:h-2.5" />
                                </div>
                                <span className="font-medium text-slate-700">{candidatePhone}</span>
                              </div>
                            )}

                            {candidateLocation && (
                              <div className="flex items-center space-x-2.5">
                                <div className="w-5 h-5 print:w-4 print:h-4 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                  <MapPin className="w-3 h-3 print:w-2.5 print:h-2.5" />
                                </div>
                                <span className="font-medium text-slate-700">{candidateLocation}</span>
                              </div>
                            )}

                            {candidateSalary && (
                              <div className="flex items-center space-x-2.5">
                                <div className="w-5 h-5 print:w-4 print:h-4 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                                  <DollarSign className="w-3 h-3 print:w-2.5 print:h-2.5" />
                                </div>
                                <span className="font-bold text-emerald-700">
                                  {candidateCurrency === 'USD' ? `$${Number(candidateSalary).toLocaleString()}` : `${Number(candidateSalary).toLocaleString()} ៛`} / {isKhmer ? 'ខែ' : 'mo'}
                                </span>
                              </div>
                            )}

                            {candidateGender && (
                              <div className="flex items-center space-x-2.5">
                                <div className="w-5 h-5 print:w-4 print:h-4 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                  <User className="w-3 h-3 print:w-2.5 print:h-2.5" />
                                </div>
                                <span className="font-medium text-slate-700">
                                  {isKhmer ? (candidateGender === 'male' ? 'ភេទ: ប្រុស' : candidateGender === 'female' ? 'ភេទ: ស្រី' : candidateGender) : `Gender: ${candidateGender}`}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Education Section (Sidebar) */}
                        <div className="space-y-3 print:space-y-1.5 pt-2 print:pt-0 print-avoid-break">
                          <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5 pb-1 print:pb-0.5 border-b border-slate-200">
                            <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
                            <span>{isKhmer ? 'កម្រិតវប្បធម៌' : 'Education'}</span>
                          </h4>
                          <div className="space-y-3 print:space-y-1.5">
                            {profile?.educations && profile.educations.length > 0 ? (
                              profile.educations.map((edu) => (
                                <div key={edu.id} className="space-y-0.5">
                                  <h5 className="font-bold text-xs print:text-[11px] text-slate-900">{edu.degree}</h5>
                                  <p className="text-[11px] print:text-[10px] font-medium text-slate-600">
                                    {edu.institution}
                                  </p>
                                  {edu.field_of_study && (
                                    <p className="text-[10px] print:text-[9px] text-slate-500">
                                      {edu.field_of_study}
                                    </p>
                                  )}
                                  <span className="inline-block px-2 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-700 border border-slate-200/80">
                                    {edu.start_date} — {edu.end_date || (isKhmer ? 'បច្ចុប្បន្ន' : 'Present')}
                                  </span>
                                </div>
                              ))
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setIsPreviewCvOpen(false)
                                  setIsEduModalOpen(true)
                                }}
                                className="no-print text-left text-[11px] text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer font-semibold"
                              >
                                <Plus className="w-3 h-3" />
                                <span>{isKhmer ? '+ បន្ថើមកម្រិតវប្បធម៌' : '+ Add Education'}</span>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Skills Section (Sidebar) */}
                        <div className="space-y-3 print:space-y-1.5 pt-2 print:pt-0 print-avoid-break">
                          <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5 pb-1 print:pb-0.5 border-b border-slate-200">
                            <Award className="w-3.5 h-3.5 text-blue-600" />
                            <span>{isKhmer ? 'ជំនាញ និងសមត្ថភាព' : 'Skills & Proficiencies'}</span>
                          </h4>
                          <div className="flex flex-wrap gap-1.5 print:gap-1">
                            {profile?.skills && profile.skills.length > 0 ? (
                              profile.skills.map((s) => (
                                <span
                                  key={s.id}
                                  className="inline-flex items-center gap-1 px-2.5 print:px-1.5 py-1 print:py-0.5 rounded-lg text-[10px] print:text-[9px] font-bold bg-blue-50/80 text-blue-800 border border-blue-200/80 shadow-2xs"
                                >
                                  <span>{s.name}</span>
                                  {s.proficiency_level && (
                                    <span className="text-[8px] print:text-[7px] px-1 py-0.2 rounded uppercase font-semibold bg-white text-blue-600 border border-blue-200">
                                      {s.proficiency_level}
                                    </span>
                                  )}
                                </span>
                              ))
                            ) : (
                              <p className="text-[11px] italic text-slate-400">
                                {isKhmer ? 'មិនទាន់បានបន្ថែមជំនាញ' : 'No skills added yet'}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Languages */}
                      <div className="pt-4 print:pt-2 border-t border-slate-200 text-[10px] print:text-[9px] space-y-1 print:space-y-0.5">
                        <span className="font-bold uppercase tracking-wider block text-slate-500">
                          {isKhmer ? 'ភាសា' : 'Languages'}
                        </span>
                        <div className="flex flex-wrap gap-2 print:gap-1.5 pt-1 font-medium text-slate-700">
                          <span className="flex items-center gap-1">
                            <Globe className="w-3 h-3 print:w-2.5 print:h-2.5 text-blue-600" />
                            <span>Khmer (Native)</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <Globe className="w-3 h-3 print:w-2.5 print:h-2.5 text-indigo-600" />
                            <span>English (Professional)</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* RIGHT MAIN CONTENT (Header, Summary, Experience) - PURE WHITE */}
                    <div className="cv-right-content p-6 sm:p-9 pt-7 sm:pt-8 print:p-2.5 print:pt-2.5 md:w-[65%] flex flex-col justify-between space-y-6 print:space-y-2.5 bg-white">
                      <div className="space-y-6 print:space-y-2.5">
                        {/* Executive Header */}
                        <div className="hidden md:block print:block pb-4 print:pb-1.5 border-b border-slate-100">
                          <h1 className="text-2xl sm:text-3xl print:text-xl font-black text-slate-900 tracking-tight">
                            {candidateName}
                          </h1>
                          <p className="text-xs sm:text-sm print:text-xs font-bold text-blue-600 uppercase tracking-wider mt-1 print:mt-0.5">
                            {candidateHeadline}
                          </p>
                          <div className="h-1 w-16 print:w-12 print:h-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full mt-2.5 print:mt-1" />
                        </div>

                        {/* Professional Summary */}
                        {candidateSummary && (
                          <div className="space-y-2 print:space-y-1 print-avoid-break">
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-4 print:w-1.5 print:h-3 rounded-full bg-blue-600 shrink-0" />
                              <h3 className="text-xs sm:text-sm print:text-[11px] font-black uppercase tracking-wider text-slate-900">
                                {isKhmer ? 'សេចក្តីសង្ខេបវិជ្ជាជីវៈ' : 'Professional Summary'}
                              </h3>
                            </div>
                            <div className="text-xs sm:text-sm print:text-[10px] text-slate-700 leading-relaxed space-y-2 print:space-y-1 border-l-2 border-blue-500/70 pl-3.5 print:pl-2.5 py-0.5 print:py-0">
                              {candidateSummary.split('\n\n').map((para, i) => (
                                <p key={i} className="whitespace-pre-line">
                                  {para.trim()}
                                </p>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Work Experience Timeline */}
                        <div className="space-y-3 print:space-y-1.5 print-avoid-break">
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-4 print:w-1.5 print:h-3 rounded-full bg-blue-600 shrink-0" />
                            <h3 className="text-xs sm:text-sm print:text-[11px] font-black uppercase tracking-wider text-slate-900">
                              {isKhmer ? 'ប្រវត្តិការងារ' : 'Work Experience'}
                            </h3>
                          </div>

                          <div className="space-y-4 print:space-y-2 pl-2 pt-1 print:pt-0">
                            {profile?.work_experiences && profile.work_experiences.length > 0 ? (
                              profile.work_experiences.map((exp) => (
                                <div
                                  key={exp.id}
                                  className="relative pl-5 print:pl-4 border-l-2 border-blue-200/90 pb-4 print:pb-2 last:pb-0 space-y-1 print:space-y-0.5"
                                >
                                  <div className="absolute -left-[5px] top-1.5 print:top-1 w-2 h-2 print:w-1.5 print:h-1.5 rounded-full bg-blue-600 ring-2 ring-white" />
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                                    <h4 className="text-xs sm:text-sm print:text-[11px] font-bold text-slate-900">
                                      {exp.job_title}
                                    </h4>
                                    <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] print:text-[8px] font-bold bg-blue-50 text-blue-700 border border-blue-200/80 self-start sm:self-auto shrink-0">
                                      {exp.start_date} — {exp.is_current ? (isKhmer ? 'បច្ចុប្បន្ន' : 'Present') : exp.end_date || 'Present'}
                                    </span>
                                  </div>
                                  <p className="text-xs print:text-[10px] font-semibold text-slate-600 flex items-center gap-1.5">
                                    <Building className="w-3.5 h-3.5 print:w-3 print:h-3 text-slate-400 shrink-0" />
                                    <span>{exp.company_name}</span>
                                    {exp.location && (
                                      <>
                                        <span className="text-slate-300">•</span>
                                        <MapPin className="w-3 h-3 print:w-2.5 print:h-2.5 text-slate-400 shrink-0" />
                                        <span>{exp.location}</span>
                                      </>
                                    )}
                                  </p>
                                </div>
                              ))
                            ) : (
                              <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center space-y-1.5">
                                <p className="text-xs text-slate-400">
                                  {isKhmer ? 'មិនទាន់មានប្រវត្តិការងារដែលបានកត់ត្រានៅឡើយ' : 'No work experience added yet'}
                                </p>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setIsPreviewCvOpen(false)
                                    setIsExpModalOpen(true)
                                  }}
                                  className="no-print text-xs font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 cursor-pointer"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>{isKhmer ? 'បន្ថែមបទពិសោធន៍ការងារ' : 'Add Experience'}</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Official Verification Footer */}
                      <div className="pt-6 print:pt-2 border-t border-slate-200/80 flex items-center justify-between text-[10px] print:text-[8px] text-slate-400 font-medium">
                        <span className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 print:w-3 print:h-3 text-emerald-600 shrink-0" />
                          <span className="font-semibold text-slate-600">
                            {isKhmer ? 'ប្រវត្តិរូបបេក្ខជនផ្ទៀងផ្ទាត់ផ្លូវការ' : 'Verified Candidate Profile'}
                          </span>
                        </span>
                        <span>CambodiaJobs Career Portal • {new Date().toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                )
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
