import React, { useEffect, useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { companiesService } from '../../services/companies.service'
import { jobsService } from '../../services/jobs.service'
import { Company } from '../../types'
import { Select } from '../../components/ui/Select'
import { useToast, useAuth } from '../../app/providers'
import { getAssetUrl } from '../../utils/assets'
import { Editor } from '@tinymce/tinymce-react'
import { FacebookVerifiedBadge } from '../../components/common/FacebookVerifiedBadge'
import {
  Building2,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Upload,
  Link as LinkIcon,
  Image as ImageIcon,
  MapPin,
  Trash2,
  Loader2,
  Eye,
  Users,
  Briefcase,
  UserPlus,
  UserCheck,
  Plus,
  X,
  Lock,
  Mail,
  Phone,
  Shield,
  ShieldAlert,
  FileText,
  ExternalLink,
  AtSign,
  UserCog,
  ChevronDown,
  Check,
} from 'lucide-react'

const getInitials = (str: string) => {
  if (!str) return 'CO'
  const parts = str.trim().split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return str.slice(0, 2).toUpperCase()
}

export const EmployerCompanyProfilePage: React.FC = () => {
  const { toast } = useToast()
  const { user } = useAuth()
  const { i18n } = useTranslation()
  const isKhmer = i18n.language === 'km'

  const [company, setCompany] = useState<Company | null>(null)
  const [provinces, setProvinces] = useState<Array<{ province_en: string; province_km: string }>>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  // Form Fields
  const [name, setName] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [bannerUrl, setBannerUrl] = useState('')
  const [description, setDescription] = useState('')
  const [website, setWebsite] = useState('')
  const [industry, setIndustry] = useState('')
  const [companySize, setCompanySize] = useState('11-50')
  const [province, setProvince] = useState('Phnom Penh')
  const [city, setCity] = useState('')
  const [address, setAddress] = useState('')

  // National ID Card Verification
  const [nationalIdCard, setNationalIdCard] = useState('')
  const [isUploadingIdCard, setIsUploadingIdCard] = useState(false)
  const idCardInputRef = useRef<HTMLInputElement>(null)

  // Upload States & Mode Toggles
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)
  const [isUploadingBanner, setIsUploadingBanner] = useState(false)
  const [showLogoUrlInput, setShowLogoUrlInput] = useState(false)
  const [showBannerUrlInput, setShowBannerUrlInput] = useState(false)

  // Sub-user Employees & Team Management
  const [activeTab, setActiveTab] = useState<'profile' | 'team'>('profile')
  const [members, setMembers] = useState<any[]>([])
  const [myRole, setMyRole] = useState('owner')
  const [isLoadingMembers, setIsLoadingMembers] = useState(false)
  const [showAddMemberModal, setShowAddMemberModal] = useState(false)
  const [newMemberUsername, setNewMemberUsername] = useState('')
  const [newMemberDomain, setNewMemberDomain] = useState('@gmail.com')
  const [newMemberName, setNewMemberName] = useState('')
  const [newMemberEmail, setNewMemberEmail] = useState('')
  const [newMemberPassword, setNewMemberPassword] = useState('')
  const [newMemberPhone, setNewMemberPhone] = useState('')
  const [newMemberRole, setNewMemberRole] = useState('recruiter')
  const [isAddingMember, setIsAddingMember] = useState(false)

  // Sub-user Role Change & Account Edit States
  const [updatingMemberId, setUpdatingMemberId] = useState<number | null>(null)
  const [editingMember, setEditingMember] = useState<any | null>(null)
  const [editMemberName, setEditMemberName] = useState('')
  const [editMemberPhone, setEditMemberPhone] = useState('')
  const [editMemberPassword, setEditMemberPassword] = useState('')
  const [editMemberRole, setEditMemberRole] = useState('recruiter')
  const [isSavingMember, setIsSavingMember] = useState(false)

  // Permission check: only company owner or system admin can edit profile or manage team
  const canManage = myRole === 'owner' || user?.role === 'admin' || user?.roles?.includes('admin') || user?.id === 1

  // Derive company owner email and sub-user email suffix (e.g. 'hr@gmail.com' -> '.hr@gmail.com')
  const ownerMember = members.find((m) => m.member_role === 'owner')
  const baseCompanyEmail = (ownerMember?.email || user?.email || 'hr@gmail.com').toLowerCase().trim()
  const [compUserPart, compDomainPart] = baseCompanyEmail.includes('@')
    ? baseCompanyEmail.split('@')
    : ['hr', 'gmail.com']
  const subUserEmailSuffix = `.${compUserPart}@${compDomainPart}`

  const logoInputRef = useRef<HTMLInputElement>(null)
  const bannerInputRef = useRef<HTMLInputElement>(null)

  const loadMembers = async () => {
    setIsLoadingMembers(true)
    try {
      const res = await companiesService.getCompanyMembers()
      const list = Array.isArray(res) ? res : Array.isArray((res as any)?.data) ? (res as any).data : []
      setMembers(list)
      if ((res as any)?.my_role) setMyRole((res as any).my_role)
    } catch (err) {
      console.error('Failed to load company members:', err)
    } finally {
      setIsLoadingMembers(false)
    }
  }

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault()

    // Determine effective email from username + company suffix
    const rawUser = newMemberUsername.trim().toLowerCase().replace(/\s+/g, '')
    let effectiveEmail = ''
    if (rawUser.includes('@')) {
      effectiveEmail = rawUser
    } else if (rawUser) {
      if (rawUser.endsWith(`.${compUserPart}`)) {
        effectiveEmail = `${rawUser}@${compDomainPart}`
      } else {
        effectiveEmail = `${rawUser}${subUserEmailSuffix}`
      }
    }
    if (!effectiveEmail && newMemberEmail.trim()) {
      effectiveEmail = newMemberEmail.trim().toLowerCase()
    }

    if (!effectiveEmail) {
      toast.error(
        isKhmer ? 'ព័ត៌មានមិនគ្រប់គ្រាន់' : 'Validation Error',
        isKhmer ? 'សូមបញ្ចូលឈ្មោះគណនីបុគ្គលិក' : 'Employee username is required.'
      )
      return
    }

    // Auto-generate a readable full name if user hasn't typed one
    const effectiveName =
      newMemberName.trim() ||
      rawUser
        .split('@')[0]
        .split('.')[0]
        .replace(/[._]/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase()) ||
      'Team Member'

    if (newMemberPassword.trim() && newMemberPassword.trim().length < 4) {
      toast.error(
        isKhmer ? 'ពាក្យសម្ងាត់ខ្លីពេក' : 'Password Too Short',
        isKhmer ? 'ពាក្យសម្ងាត់ត្រូវមានយ៉ាងហោចណាស់ ៤ តួអក្សរ' : 'Password must be at least 4 characters.'
      )
      return
    }
    setIsAddingMember(true)
    try {
      await companiesService.addCompanyMember({
        full_name: effectiveName,
        email: effectiveEmail,
        password: newMemberPassword.trim() || undefined,
        phone_number: newMemberPhone.trim() || undefined,
        role: newMemberRole,
      })
      toast.success(
        isKhmer ? 'បានបន្ថែមបុគ្គលិកជោគជ័យ' : 'Employee Added',
        isKhmer ? `គណនី ${effectiveEmail} ត្រូវបានបង្កើត និងភ្ជាប់ជាមួយក្រុមហ៊ុនរួចរាល់` : `Sub-user employee ${effectiveEmail} has been added to your company team.`
      )
      setNewMemberUsername('')
      setNewMemberName('')
      setNewMemberEmail('')
      setNewMemberPassword('')
      setNewMemberPhone('')
      setNewMemberRole('recruiter')
      setShowAddMemberModal(false)
      loadMembers()
    } catch (err: any) {
      const data = err.response?.data
      let msg = data?.error && data?.error !== 'Request failed' ? data.error : null
      if (!msg && data?.details) {
        if (typeof data.details === 'string') {
          msg = data.details
        } else if (typeof data.details === 'object') {
          const firstVal = Object.values(data.details)[0]
          msg = Array.isArray(firstVal) ? firstVal[0] : String(firstVal)
        }
      }
      if (!msg) {
        msg = data?.detail || data?.message || (isKhmer ? 'មិនអាចបញ្ចូលបុគ្គលិកបានទេ សូមព្យាយាមម្តងទៀត' : 'Failed to add employee.')
      }
      toast.error(isKhmer ? 'បរាជ័យក្នុងការបញ្ចូលបុគ្គលិក' : 'Action Failed', String(msg))
    } finally {
      setIsAddingMember(false)
    }
  }

  const handleRemoveMember = async (userId: number) => {
    if (!confirm(isKhmer ? 'តើអ្នកប្រាកដជាចង់ដកបុគ្គលិកនេះចេញពីក្រុមហ៊ុន?' : 'Are you sure you want to remove this employee from your company team?')) return
    try {
      await companiesService.removeCompanyMember(userId)
      toast.success(
        isKhmer ? 'បានដកបុគ្គលិក' : 'Employee Removed',
        isKhmer ? 'បុគ្គលិកត្រូវបានដកចេញពីក្រុមការងាររួចរាល់' : 'Employee removed from company team successfully.'
      )
      loadMembers()
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Could not remove employee.'
      toast.error('Error', String(msg))
    }
  }

  const handleUpdateMemberRole = async (userId: number, role: string) => {
    setUpdatingMemberId(userId)
    try {
      await companiesService.updateCompanyMemberRole(userId, role)
      toast.success(
        isKhmer ? 'កែប្រែតួនាទីជោគជ័យ' : 'Role Updated',
        isKhmer ? `បានផ្លាស់ប្តូរតួនាទីបុគ្គលិកទៅជា ${role.toUpperCase()} រួចរាល់` : `Employee role updated to ${role.toUpperCase()}.`
      )
      setMembers((prev) =>
        prev.map((m) => (m.user_id === userId ? { ...m, member_role: role } : m))
      )
      if (editingMember?.user_id === userId) {
        setEditingMember((prev: any) => prev ? { ...prev, member_role: role } : null)
        setEditMemberRole(role)
      }
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.response?.data?.message || (isKhmer ? 'មិនអាចកែប្រែតួនាទីបានទេ' : 'Failed to update member role.')
      toast.error(isKhmer ? 'បរាជ័យក្នុងការកែប្រែ' : 'Action Failed', String(msg))
      loadMembers()
    } finally {
      setUpdatingMemberId(null)
    }
  }

  const handleOpenEditMember = (m: any) => {
    setEditingMember(m)
    setEditMemberName(m.full_name || '')
    setEditMemberPhone(m.phone_number || '')
    setEditMemberPassword('')
    setEditMemberRole(m.member_role || 'recruiter')
  }

  const handleSaveMemberAccount = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!editingMember) return
    setIsSavingMember(true)
    try {
      const payload: any = {
        full_name: editMemberName.trim(),
        phone_number: editMemberPhone.trim(),
        role: editMemberRole,
      }
      if (editMemberPassword.trim()) {
        payload.password = editMemberPassword.trim()
      }
      await companiesService.updateCompanyMember(editingMember.user_id, payload)
      toast.success(
        isKhmer ? 'កែប្រែគណនីជោគជ័យ' : 'Account Updated',
        isKhmer ? `គណនីបុគ្គលិកត្រូវបានកែប្រែដោយជោគជ័យ` : `Employee account has been updated successfully.`
      )
      setMembers((prev) =>
        prev.map((m) =>
          m.user_id === editingMember.user_id
            ? { ...m, full_name: editMemberName.trim() || m.full_name, phone_number: editMemberPhone.trim(), member_role: editMemberRole }
            : m
        )
      )
      setEditingMember(null)
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.response?.data?.message || (isKhmer ? 'មិនអាចកែប្រែគណនីបានទេ' : 'Failed to update account.')
      toast.error(isKhmer ? 'បរាជ័យក្នុងការកែប្រែ' : 'Action Failed', String(msg))
      loadMembers()
    } finally {
      setIsSavingMember(false)
    }
  }

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [comp, locs] = await Promise.all([
        companiesService.getEmployerCompany(),
        jobsService.getLocations(),
      ])
      setCompany(comp)
      setProvinces(locs.provinces || [])

      if (comp) {
        setName(comp.name || '')
        setLogoUrl(comp.logo_url || '')
        setBannerUrl(comp.banner_url || '')
        setNationalIdCard(comp.national_id_card || '')
        setDescription(comp.description || '')
        setWebsite(comp.website || '')
        setIndustry(comp.industry || '')
        setCompanySize(comp.company_size || '11-50')
        setProvince(comp.province || 'Phnom Penh')
        setCity(comp.city || '')
        setAddress(comp.address || '')

        if (comp.logo_url && !comp.logo_url.startsWith('/media/')) {
          setShowLogoUrlInput(true)
        }
        if (comp.banner_url && !comp.banner_url.startsWith('/media/')) {
          setShowBannerUrlInput(true)
        }
      }
    } catch (err) {
      console.error('Failed to load company profile:', err)
      toast.error('Error', 'Could not load company profile data.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    loadMembers()
  }, [])

  // Handle Logo Upload
  const handleLogoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Invalid File', 'Please select a valid image file (PNG, JPG, WEBP, SVG).')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File Too Large', 'Logo image size must be under 5MB.')
      return
    }

    setIsUploadingLogo(true)
    try {
      const res = await companiesService.uploadCompanyImage(file, 'logo')
      if (res && res.url) {
        setLogoUrl(res.url)
        setShowLogoUrlInput(true)
        toast.success(
          isKhmer ? 'បានផ្ទុកឡើងរូបសញ្ញា' : 'Logo Uploaded',
          isKhmer ? 'រូបសញ្ញាក្រុមហ៊ុនត្រូវបានផ្ទុកឡើង និងរក្សាទុកដោយជោគជ័យ' : 'Company logo uploaded and saved.'
        )
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.details?.file ||
        err?.response?.data?.error ||
        'Failed to upload logo image.'
      toast.error('Upload Failed', String(msg))
    } finally {
      setIsUploadingLogo(false)
      if (logoInputRef.current) logoInputRef.current.value = ''
    }
  }

  // Handle Banner Upload
  const handleBannerFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Invalid File', 'Please select a valid image file (PNG, JPG, WEBP, SVG).')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File Too Large', 'Banner image size must be under 5MB.')
      return
    }

    setIsUploadingBanner(true)
    try {
      const res = await companiesService.uploadCompanyImage(file, 'banner')
      if (res && res.url) {
        setBannerUrl(res.url)
        setShowBannerUrlInput(true)
        toast.success(
          isKhmer ? 'បានផ្ទុកឡើងផ្ទាំងរូបភាព' : 'Banner Uploaded',
          isKhmer ? 'ផ្ទាំងរូបភាពក្រុមហ៊ុនត្រូវបានផ្ទុកឡើង និងរក្សាទុកដោយជោគជ័យ' : 'Company banner uploaded and saved.'
        )
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.details?.file ||
        err?.response?.data?.error ||
        'Failed to upload banner image.'
      toast.error('Upload Failed', String(msg))
    } finally {
      setIsUploadingBanner(false)
      if (bannerInputRef.current) bannerInputRef.current.value = ''
    }
  }

  // Handle National ID Card Upload
  const handleIdCardFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'application/pdf']
    if (!allowed.includes(file.type) && !file.name.match(/\.(jpg|jpeg|png|webp|pdf)$/i)) {
      toast.error('Invalid File', 'Please select a valid image (PNG, JPG, WEBP) or PDF document.')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File Too Large', 'National ID Card file must be under 5MB.')
      return
    }

    setIsUploadingIdCard(true)
    try {
      const res = await companiesService.uploadCompanyImage(file, 'id_card')
      if (res && res.url) {
        setNationalIdCard(res.url)
        toast.success(
          isKhmer ? 'បានផ្ទុកឡើងអត្តសញ្ញាណប័ណ្ណ' : 'ID Card Uploaded',
          isKhmer
            ? 'រូបភាពអត្តសញ្ញាណប័ណ្ណសញ្ជាតិខ្មែរត្រូវបានផ្ទុកឡើង និងរក្សាទុកដោយជោគជ័យ'
            : 'National ID Card uploaded and saved successfully.'
        )
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.file ||
        err?.response?.data?.details?.file ||
        err?.response?.data?.error ||
        'Failed to upload National ID Card.'
      toast.error('Upload Failed', String(msg))
    } finally {
      setIsUploadingIdCard(false)
      if (idCardInputRef.current) idCardInputRef.current.value = ''
    }
  }

  const handleRemoveImage = async (type: 'logo' | 'banner') => {
    const previousLogo = logoUrl
    const previousBanner = bannerUrl

    if (type === 'logo') setLogoUrl('')
    else setBannerUrl('')

    try {
      const updated = await companiesService.updateEmployerCompany(
        type === 'logo' ? { logo_url: null } : { banner_url: null }
      )
      if (updated) {
        setCompany(updated)
        setLogoUrl(updated.logo_url || '')
        setBannerUrl(updated.banner_url || '')
      }
      toast.success(
        isKhmer ? 'បានដករូបភាពចេញ' : 'Image Removed',
        isKhmer ? 'រូបភាពត្រូវបានដកចេញ និងរក្សាទុកដោយជោគជ័យ' : 'The image was removed and saved.'
      )
    } catch {
      // Revert the preview if the server failed to clear the image.
      setLogoUrl(previousLogo)
      setBannerUrl(previousBanner)
      toast.error(
        isKhmer ? 'បរាជ័យ' : 'Remove Failed',
        isKhmer ? 'មិនអាចដករូបភាពបានទេ។ សូមព្យាយាមម្តងទៀត។' : 'Could not remove the image. Please try again.'
      )
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('Validation Error', isKhmer ? 'សូមបញ្ចូលឈ្មោះក្រុមហ៊ុន' : 'Company name is required.')
      return
    }

    if (!nationalIdCard || !nationalIdCard.trim()) {
      toast.error(
        isKhmer ? 'ទិន្នន័យចាំបាច់' : 'Validation Error',
        isKhmer
          ? 'សូមផ្ទុកឡើងរូបភាពអត្តសញ្ញាណប័ណ្ណសញ្ជាតិខ្មែរ (National ID Card) របស់តំណាងក្រុមហ៊ុន។'
          : 'National ID Card upload is required to verify your enterprise identity.'
      )
      return
    }

    setIsSaving(true)
    setMessage(null)
    try {
      const updated = await companiesService.updateEmployerCompany({
        name: name.trim(),
        // Send null (not undefined) so an intentionally removed image is cleared in the DB.
        logo_url: logoUrl.trim() || null,
        banner_url: bannerUrl.trim() || null,
        national_id_card: nationalIdCard.trim() || null,
        description,
        website: website.trim() || undefined,
        industry: industry.trim() || undefined,
        company_size: companySize || undefined,
        province,
        city: city.trim() || undefined,
        address: address.trim() || undefined,
      })
      if (updated) {
        setCompany(updated)
        setLogoUrl(updated.logo_url || '')
        setBannerUrl(updated.banner_url || '')
        setNationalIdCard(updated.national_id_card || '')
      }
      toast.success(
        isKhmer ? 'បានរក្សាទុក' : 'Changes Saved',
        isKhmer ? 'ព័ត៌មានក្រុមហ៊ុនត្រូវបានកែប្រែដោយជោគជ័យ!' : 'Company profile updated successfully!'
      )
      setMessage(isKhmer ? 'ព័ត៌មានក្រុមហ៊ុនត្រូវបានកែប្រែដោយជោគជ័យ!' : 'Company profile updated successfully!')
      setTimeout(() => setMessage(null), 3500)
    } catch (err: any) {
      toast.error('Save Failed', 'Could not save company profile changes.')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="py-20 text-center font-sans">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="mt-3 text-xs text-slate-500">
          {isKhmer ? 'កំពុងដំណើរការទាញយកទិន្នន័យ...' : 'Loading organization profile...'}
        </p>
      </div>
    )
  }

  const companySizeOptions = [
    { value: '1-10', label: '1-10 Employees' },
    { value: '11-50', label: '11-50 Employees' },
    { value: '51-200', label: '51-200 Employees' },
    { value: '201-500', label: '201-500 Employees' },
    { value: '500-1000', label: '500-1000 Employees' },
    { value: '1000+', label: '1000+ Employees' },
  ]

  const provinceOptions = provinces.map((p) => ({
    value: p.province_en,
    label: `${p.province_en} (${p.province_km})`,
  }))

  const previewBanner = bannerUrl || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=300&fit=crop'

  return (
    <div className="w-full space-y-5 font-sans pb-16">
      {/* Toast Notification Alert */}
      {message && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-800 flex items-center shadow-2xs animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-600 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Top Header Card - Clean, Simple, Light */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-slate-50 border border-gray-200 text-blue-600 flex items-center justify-center shrink-0 shadow-2xs">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              {isKhmer ? 'កម្រងព័ត៌មានក្រុមហ៊ុន & ម៉ាកយីហោ' : 'Company Profile & Branding'}
            </h1>
            <p className="text-xs text-slate-500">
              {isKhmer
                ? 'គ្រប់គ្រងម៉ាកយីហោ រូបភាព និងព័ត៌មានស្ថាប័នរបស់អ្នកដែលបង្ហាញជូនបេក្ខជន'
                : 'Manage organization details, visual identity, and candidate-facing information'}
            </p>
          </div>
        </div>

        <div className="shrink-0">
          {company?.verification_status === 'verified' ? (
            <FacebookVerifiedBadge
              showText={true}
              text={isKhmer ? 'ផ្ទៀងផ្ទាត់ផ្លូវការ' : 'Officially Verified'}
              title={isKhmer ? 'ស្ថាប័នបានផ្ទៀងផ្ទាត់ផ្លូវការ' : 'Officially Verified Organization'}
              className="w-4 h-4"
            />
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold bg-amber-50 text-amber-700 border border-gray-200">
              <span>{isKhmer ? 'រង់ចាំការផ្ទៀងផ្ទាត់' : 'Pending Verification'}</span>
            </span>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center space-x-2 border-b border-gray-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${activeTab === 'profile'
            ? 'bg-blue-600 text-white shadow-2xs'
            : 'bg-white text-slate-600 hover:bg-slate-50 border border-gray-200'
            }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>{isKhmer ? 'ព័ត៌មានក្រុមហ៊ុន & ម៉ាកយីហោ' : 'Company Profile & Branding'}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('team')
            loadMembers()
          }}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${activeTab === 'team'
            ? 'bg-blue-600 text-white shadow-2xs'
            : 'bg-white text-slate-600 hover:bg-slate-50 border border-gray-200'
            }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>{isKhmer ? 'បុគ្គលិក និងក្រុមការងារ' : 'Team & Sub-Users'}</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeTab === 'team' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'}`}>
            {members.length}
          </span>
        </button>
      </div>

      {activeTab === 'team' ? (
        <div className="space-y-4">
          {/* Team Header & Actions */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                {isKhmer ? 'គ្រប់គ្រងបុគ្គលិក និងអ្នកជ្រើសរើស' : 'Company Sub-Users'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {isKhmer
                  ? 'បង្កើតគណនីបុគ្គលិក ឬភ្ជាប់អ្នកជ្រើសរើសដើម្បីជួយគ្រប់គ្រងការងារ និងបេក្ខជនក្នុងក្រុមហ៊ុន'
                  : 'Add sub-user employees to manage jobs, screen candidates, and conduct interviews.'}
              </p>
            </div>
            {canManage ? (
              <button
                type="button"
                onClick={() => setShowAddMemberModal(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-semibold text-xs transition cursor-pointer shadow-2xs shrink-0"
              >
                <UserPlus className="w-4 h-4" />
                <span>{isKhmer ? 'បន្ថែមបុគ្គលិកថ្មី' : 'Add Employee'}</span>
              </button>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 shadow-2xs shrink-0">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                <span>{isKhmer ? 'សិទ្ធិត្រឹមតែមើល' : 'View-Only'}</span>
              </span>
            )}
          </div>

          {/* Members Table */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
            {isLoadingMembers ? (
              <div className="py-16 text-center text-xs text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
                <span>{isKhmer ? 'កំពុងទាញយកទិន្នន័យក្រុមការងារ...' : 'Loading company team...'}</span>
              </div>
            ) : members.length === 0 ? (
              <div className="py-16 text-center text-slate-400">
                <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                <p className="text-xs font-semibold text-slate-700">
                  {isKhmer ? 'មិនទាន់មានបុគ្គលិកបន្ថែមនៅឡើយទេ' : 'No sub-user employees yet'}
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  {isKhmer ? 'ចុចលើប៊ូតុង "បន្ថែមបុគ្គលិកថ្មី" ដើម្បីបង្កើតគណនីសម្រាប់ក្រុមការងារ' : 'Click "Add Sub-User Employee" to invite colleagues.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse font-sans">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-gray-200 text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                      <th className="py-3 px-4">{isKhmer ? 'បុគ្គលិក' : 'Employee'}</th>
                      <th className="py-3 px-3">{isKhmer ? 'ទំនាក់ទំនង' : 'Contact'}</th>
                      <th className="py-3 px-3">{isKhmer ? 'តួនាទីក្នុងក្រុមហ៊ុន' : 'Role'}</th>
                      <th className="py-3 px-3">{isKhmer ? 'កាលបរិច្ឆេទ' : 'Joined'}</th>
                      <th className="py-3 px-4 text-right">{isKhmer ? 'សកម្មភាព' : 'Action'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {members.map((m: any) => {
                      const isOwner = m.member_role === 'owner'
                      return (
                        <tr key={m.member_id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-2.5">
                              <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                                {m.full_name?.charAt(0)?.toUpperCase() || 'E'}
                              </div>
                              <div>
                                <span className="font-bold text-slate-900 block truncate max-w-[160px]">
                                  {m.full_name}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono block truncate max-w-[160px]">
                                  {m.email}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <span className="text-slate-600 text-[11px]">
                              {m.phone_number || (isKhmer ? 'គ្មានលេខ' : 'No phone')}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            {isOwner ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
                                <Shield className="w-3 h-3 text-amber-600" />
                                <span>OWNER</span>
                              </span>
                            ) : canManage ? (
                              <div className="relative inline-flex items-center">
                                {updatingMemberId === m.user_id ? (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-500 animate-pulse">
                                    <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
                                    <span>{isKhmer ? 'កំពុងប្តូរ...' : 'Updating...'}</span>
                                  </span>
                                ) : (
                                  <div className="relative group">
                                    <select
                                      value={m.member_role}
                                      onChange={(e) => handleUpdateMemberRole(m.user_id, e.target.value)}
                                      className={`appearance-none cursor-pointer pl-2.5 pr-6 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider outline-none transition border shadow-2xs ${
                                        m.member_role === 'recruiter'
                                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100/70 focus:ring-2 focus:ring-emerald-200'
                                          : m.member_role === 'hiring_manager'
                                            ? 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100/70 focus:ring-2 focus:ring-purple-200'
                                            : m.member_role === 'interviewer'
                                              ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100/70 focus:ring-2 focus:ring-blue-200'
                                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 focus:ring-2 focus:ring-slate-200'
                                      }`}
                                      title={isKhmer ? 'ចុចដើម្បីប្តូរតួនាទី' : 'Click to change role'}
                                    >
                                      <option value="recruiter">{isKhmer ? 'មន្ត្រីជ្រើសរើស' : 'Recruiter'}</option>
                                      <option value="hiring_manager">{isKhmer ? 'ប្រធានផ្នែក' : 'Hiring Manager'}</option>
                                      <option value="interviewer">{isKhmer ? 'អ្នកសម្ភាសន៍' : 'Interviewer'}</option>
                                      <option value="member">{isKhmer ? 'សមាជិក' : 'Team Member'}</option>
                                    </select>
                                    <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 opacity-60 group-hover:opacity-100" />
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                  m.member_role === 'hiring_manager'
                                    ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                    : m.member_role === 'recruiter'
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                      : 'bg-blue-50 text-blue-700 border border-blue-200'
                                }`}
                              >
                                <span>{m.member_role?.replace('_', ' ')}</span>
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-[11px] text-slate-400 whitespace-nowrap">
                            {new Date(m.created_at).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {!isOwner && canManage && (
                              <div className="inline-flex items-center gap-1.5 justify-end">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditMember(m)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-blue-600 hover:bg-blue-50 border border-blue-200 transition cursor-pointer text-xs"
                                  title={isKhmer ? 'កែប្រែគណនីបុគ្គលិក' : 'Edit Employee Account'}
                                >
                                  <UserCog className="w-3.5 h-3.5" />
                                  <span className="hidden sm:inline">{isKhmer ? 'កែប្រែគណនី' : 'Edit Account'}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveMember(m.user_id)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-rose-600 hover:bg-rose-50 border border-rose-200 transition cursor-pointer text-xs"
                                  title={isKhmer ? 'ដកចេញពីក្រុមហ៊ុន' : 'Remove from team'}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span className="hidden sm:inline">{isKhmer ? 'ដកចេញ' : 'Remove'}</span>
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Add Sub-User Employee Modal */}
          {showAddMemberModal && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
              <div className="bg-white rounded-3xl border border-gray-100 shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col">
                <div className="px-6 py-5 bg-white border-b border-gray-100 flex items-center justify-between shrink-0">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-50/80 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0 shadow-2xs">
                      <UserPlus className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                        {isKhmer ? 'បង្កើត / បន្ថែមបុគ្គលិកថ្មី' : 'Add Sub-User Employee'}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {isKhmer ? 'ផ្តល់សិទ្ធិជ្រើសរើសបុគ្គលិកក្នុងក្រុមហ៊ុន' : 'Authorize a team member to manage hiring'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddMemberModal(false)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                  >
                    <X className="w-4.5 h-4.5" />
                  </button>
                </div>

                <form onSubmit={handleAddMember} className="p-6 space-y-4 text-xs font-sans bg-white">
                  {/* Unified Username with Fixed Company Email Suffix */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                      {isKhmer ? 'ឈ្មោះគណនីបុគ្គលិក' : 'Employee Username'} <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex rounded-xl border border-gray-200 overflow-hidden shadow-2xs focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100 transition bg-white">
                      <div className="relative flex-1">
                        <AtSign className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          required
                          value={newMemberUsername}
                          onChange={(e) => {
                            const val = e.target.value.toLowerCase().replace(/\s+/g, '')
                            setNewMemberUsername(val)
                            if (!newMemberName.trim()) {
                              const raw = val.split('@')[0].split('.')[0]
                              if (raw) {
                                setNewMemberName(raw.replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()))
                              }
                            }
                          }}
                          placeholder="e.g. heng"
                          className="w-full pl-8 pr-3 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 outline-none font-normal"
                        />
                      </div>
                      <div className="px-3.5 py-2.5 text-xs bg-slate-50 border-l border-gray-200 text-slate-700 font-mono font-semibold select-none flex items-center shrink-0">
                        <span className="text-blue-600">{subUserEmailSuffix}</span>
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1.5 flex items-center gap-1">
                      <span>{isKhmer ? 'អ៊ីមែលចូលប្រើប្រាស់:' : 'Login email:'}</span>
                      <strong className="text-blue-600 font-semibold font-mono">
                        {newMemberUsername.trim()
                          ? newMemberUsername.includes('@')
                            ? newMemberUsername.trim()
                            : newMemberUsername.endsWith(`.${compUserPart}`)
                              ? `${newMemberUsername.trim()}@${compDomainPart}`
                              : `${newMemberUsername.trim()}${subUserEmailSuffix}`
                          : `e.g. heng${subUserEmailSuffix}`}
                      </strong>
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                      {isKhmer ? 'ឈ្មោះពេញរបស់បុគ្គលិក' : 'Full Name'}
                    </label>
                    <input
                      type="text"
                      value={newMemberName}
                      onChange={(e) => setNewMemberName(e.target.value)}
                      placeholder="e.g. Heng Piseth"
                      className="w-full px-3.5 py-2.5 text-xs bg-white border border-gray-200 rounded-xl text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition shadow-2xs font-normal"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                      {isKhmer ? 'ពាក្យសម្ងាត់' : 'Password (for new user)'}
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="password"
                        value={newMemberPassword}
                        onChange={(e) => setNewMemberPassword(e.target.value)}
                        placeholder="At least 4 characters"
                        className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-white border border-gray-200 rounded-xl text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition shadow-2xs font-normal"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      {isKhmer
                        ? 'យ៉ាងហោចណាស់ ៤ តួអក្សរ (ទុកទទេប្រសិនបើប្រើគណនីមានស្រាប់)'
                        : 'Minimum 4 characters (leave blank if assigning existing user)'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                      {isKhmer ? 'លេខទូរស័ព្ទ' : 'Phone Number'}
                    </label>
                    <input
                      type="text"
                      value={newMemberPhone}
                      onChange={(e) => setNewMemberPhone(e.target.value)}
                      placeholder="+855 12 345 678"
                      className="w-full px-3.5 py-2.5 text-xs bg-white border border-gray-200 rounded-xl text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition shadow-2xs font-normal"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                      {isKhmer ? 'តួនាទីក្នុងក្រុមហ៊ុន' : 'Role in Company'} <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={newMemberRole}
                      onChange={(e) => setNewMemberRole(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs bg-white border border-gray-200 rounded-xl text-slate-800 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition shadow-2xs font-normal cursor-pointer"
                    >
                      <option value="recruiter">{isKhmer ? 'មន្ត្រីជ្រើសរើសបុគ្គលិក' : 'Recruiter'}</option>
                      <option value="hiring_manager">{isKhmer ? 'ប្រធានផ្នែកជ្រើសរើស' : 'Hiring Manager'}</option>
                      <option value="interviewer">{isKhmer ? 'អ្នកសម្ភាសន៍បេក្ខជន' : 'Interviewer'}</option>
                      <option value="member">{isKhmer ? 'សមាជិកក្រុមការងារ' : 'Team Member'}</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-end space-x-2.5 pt-4 border-t border-gray-100 bg-white">
                    <button
                      type="button"
                      onClick={() => setShowAddMemberModal(false)}
                      className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition shadow-2xs cursor-pointer"
                    >
                      {isKhmer ? 'បោះបង់' : 'Cancel'}
                    </button>
                    <button
                      type="submit"
                      disabled={isAddingMember}
                      className="px-4.5 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 transition shadow-2xs shadow-blue-500/20 cursor-pointer disabled:opacity-60 flex items-center space-x-1.5"
                    >
                      {isAddingMember && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      <span>
                        {isAddingMember
                          ? isKhmer ? 'កំពុងបញ្ចូល...' : 'Adding...'
                          : isKhmer ? 'រក្សាទុកបុគ្គលិក' : 'Save Employee'}
                      </span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Edit Employee Account Modal */}
          {editingMember && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
              <div className="bg-white rounded-3xl border border-gray-100 shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col">
                <div className="px-6 py-5 bg-white border-b border-gray-100 flex items-center justify-between shrink-0">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-50/80 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0 shadow-2xs">
                      <UserCog className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                        {isKhmer ? 'កែប្រែគណនីបុគ្គលិក' : 'Edit Employee Account'}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {isKhmer ? 'កែសម្រួលឈ្មោះ លេខទូរស័ព្ទ ពាក្យសម្ងាត់ និងតួនាទី' : 'Update name, contact, password, and system role'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditingMember(null)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                  >
                    <X className="w-4.5 h-4.5" />
                  </button>
                </div>

                <form onSubmit={handleSaveMemberAccount} className="p-6 space-y-4 text-xs font-sans bg-white max-h-[80vh] overflow-y-auto">
                  {/* Account Summary Banner */}
                  <div className="p-3.5 bg-slate-50/80 border border-slate-200/80 rounded-2xl flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-2xs">
                      {getInitials(editMemberName || editingMember.email)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-slate-800 font-bold text-xs truncate">{editMemberName || editingMember.email}</p>
                      <p className="text-slate-500 font-mono text-[11px] truncate flex items-center gap-1 mt-0.5">
                        <Mail className="w-3 h-3 text-slate-400" />
                        <span>{editingMember.email}</span>
                      </p>
                    </div>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600 shadow-2xs shrink-0">
                      {editingMember.member_role}
                    </span>
                  </div>

                  {/* Full Name Input */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                      {isKhmer ? 'ឈ្មោះពេញរបស់បុគ្គលិក' : 'Full Name'} <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={editMemberName}
                      onChange={(e) => setEditMemberName(e.target.value)}
                      placeholder="e.g. Sok Dara"
                      className="w-full px-3.5 py-2.5 text-xs bg-white border border-gray-200 rounded-xl text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition shadow-2xs font-normal"
                    />
                  </div>

                  {/* Phone Number Input */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                      {isKhmer ? 'លេខទូរស័ព្ទ' : 'Phone Number'}
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={editMemberPhone}
                        onChange={(e) => setEditMemberPhone(e.target.value)}
                        placeholder="+855 12 345 678"
                        className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-white border border-gray-200 rounded-xl text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition shadow-2xs font-normal"
                      />
                    </div>
                  </div>

                  {/* Password Reset (Optional) */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                      {isKhmer ? 'ពាក្យសម្ងាត់ថ្មី (ជម្រើស)' : 'New Password (Optional)'}
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="password"
                        value={editMemberPassword}
                        onChange={(e) => setEditMemberPassword(e.target.value)}
                        placeholder={isKhmer ? 'ទុកទទេប្រសិនបើមិនចង់ប្តូរពាក្យសម្ងាត់' : 'Leave blank to keep current password'}
                        className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-white border border-gray-200 rounded-xl text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition shadow-2xs font-normal"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      {isKhmer ? 'យ៉ាងហោចណាស់ ៤ តួអក្សរ' : 'Minimum 4 characters'}
                    </p>
                  </div>

                  {/* Role Option Cards */}
                  <div className="space-y-2.5 pt-1">
                    <label className="block text-xs font-semibold text-slate-800 mb-1">
                      {isKhmer ? 'តួនាទីក្នុងក្រុមហ៊ុន' : 'Role in Company'} <span className="text-rose-500">*</span>
                    </label>

                    {[
                      {
                        id: 'recruiter',
                        titleKm: 'មន្ត្រីជ្រើសរើសបុគ្គលិក',
                        titleEn: 'Recruiter',
                        descKm: 'សិទ្ធិ៖ ចុះផ្សាយការងារថ្មី, កែប្រែការងារ, មើល និងវាយតម្លៃបេក្ខជនទាំងអស់',
                        descEn: 'Can post & edit job vacancies, view & review job applications',
                      },
                      {
                        id: 'hiring_manager',
                        titleKm: 'ប្រធានផ្នែកជ្រើសរើស',
                        titleEn: 'Hiring Manager',
                        descKm: 'សិទ្ធិ៖ គ្រប់គ្រងការងារពេញលេញ (បង្កើត, កែប្រែ, លុប) និងអនុម័តបេក្ខជន',
                        descEn: 'Full job vacancy lifecycle (create, edit, delete) & candidate approvals',
                      },
                      {
                        id: 'interviewer',
                        titleKm: 'អ្នកសម្ភាសន៍បេក្ខជន',
                        titleEn: 'Interviewer',
                        descKm: 'សិទ្ធិ៖ មើលបេក្ខជន និងវាយតម្លៃសម្ភាសន៍ (គ្មានសិទ្ធិផុសការងារ ឬកែប្រែក្រុមហ៊ុនទេ)',
                        descEn: 'View applicants & conduct interviews (view-only company access)',
                      },
                      {
                        id: 'member',
                        titleKm: 'សមាជិកក្រុមការងារ',
                        titleEn: 'Team Member',
                        descKm: 'សិទ្ធិទូទៅក្នុងក្រុមការងាររបស់ក្រុមហ៊ុន',
                        descEn: 'General collaborative member permissions',
                      },
                    ].map((roleOpt) => {
                      const isSelected = editMemberRole === roleOpt.id
                      return (
                        <div
                          key={roleOpt.id}
                          onClick={() => setEditMemberRole(roleOpt.id)}
                          className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                            isSelected
                              ? 'border-blue-600 bg-blue-50/40 ring-2 ring-blue-100 shadow-2xs'
                              : 'border-gray-200 bg-white hover:border-blue-200 hover:bg-slate-50/50'
                          }`}
                        >
                          <div className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition ${
                            isSelected ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300 bg-white'
                          }`}>
                            {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-slate-900">
                                {isKhmer ? roleOpt.titleKm : roleOpt.titleEn}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                              {isKhmer ? roleOpt.descKm : roleOpt.descEn}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end space-x-2.5 pt-4 border-t border-gray-100 bg-white">
                    <button
                      type="button"
                      onClick={() => setEditingMember(null)}
                      className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition shadow-2xs cursor-pointer"
                    >
                      {isKhmer ? 'បោះបង់' : 'Cancel'}
                    </button>
                    <button
                      type="submit"
                      disabled={isSavingMember}
                      className="px-4.5 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 transition shadow-2xs shadow-blue-500/20 cursor-pointer disabled:opacity-60 flex items-center space-x-1.5"
                    >
                      {isSavingMember && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      <span>
                        {isSavingMember
                          ? isKhmer ? 'កំពុងរក្សាទុក...' : 'Saving...'
                          : isKhmer ? 'រក្សាទុកការកែប្រែ' : 'Save Changes'}
                      </span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
          {/* Main 12-Column Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-start">
            {/* ================= LEFT COLUMN: Visual Assets & Live Preview (lg:col-span-4) ================= */}
            <div className="lg:col-span-4 space-y-4 sm:space-y-5">
              {/* 1. Visual Branding Card */}
              <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 space-y-4 shadow-2xs">
                <div className="flex items-center justify-between pb-2.5 border-b border-gray-100">
                  <h2 className="text-xs sm:text-sm font-bold text-slate-900">
                    {isKhmer ? 'រូបភាពម៉ាកយីហោ' : 'Brand Assets'}
                  </h2>
                  <span className="text-[10px] text-slate-400">PNG, JPG, WEBP (Max 5MB)</span>
                </div>

                {/* Logo Section */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700">
                      {isKhmer ? 'រូបសញ្ញាក្រុមហ៊ុន' : 'Company Logo'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowLogoUrlInput(!showLogoUrlInput)}
                      className="text-[11px] text-blue-600 hover:text-blue-700 cursor-pointer inline-flex items-center gap-1 font-medium"
                    >
                      <LinkIcon className="w-3 h-3" />
                      <span>{showLogoUrlInput ? (isKhmer ? 'បិទ URL' : 'Hide URL') : (isKhmer ? 'បញ្ចូល URL' : 'Enter URL')}</span>
                    </button>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="relative w-14 h-14 rounded-xl bg-slate-50 border border-gray-200 overflow-hidden flex items-center justify-center shrink-0 shadow-2xs">
                      {logoUrl ? (
                        <img src={getAssetUrl(logoUrl)} alt="Logo" className="w-full h-full object-cover" />
                      ) : (
                        <Building2 className="w-6 h-6 text-slate-300" />
                      )}
                      {isUploadingLogo && (
                        <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                          <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 space-y-1">
                      <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleLogoFileChange}
                      />
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={isUploadingLogo}
                          onClick={() => logoInputRef.current?.click()}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-gray-200 transition cursor-pointer disabled:opacity-50 shadow-2xs"
                        >
                          <Upload className="w-3 h-3 text-slate-500" />
                          <span>{isUploadingLogo ? (isKhmer ? 'កំពុងផ្ទុក...' : 'Uploading...') : (isKhmer ? 'ជ្រើសរើសរូប' : 'Upload')}</span>
                        </button>
                        {logoUrl && (
                          <button
                            type="button"
                            onClick={() => handleRemoveImage('logo')}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 border border-gray-200 transition cursor-pointer shadow-2xs"
                            title="Remove Logo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {showLogoUrlInput && (
                    <input
                      type="url"
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                      placeholder="https://example.com/logo.png"
                      className="w-full text-xs p-2 bg-white border border-gray-200 rounded-xl text-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition shadow-2xs"
                    />
                  )}
                </div>

                {/* Banner Section */}
                <div className="space-y-2 pt-2 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700">
                      {isKhmer ? 'ផ្ទាំងរូបភាពក្រុមហ៊ុន' : 'Cover Banner'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowBannerUrlInput(!showBannerUrlInput)}
                      className="text-[11px] text-blue-600 hover:text-blue-700 cursor-pointer inline-flex items-center gap-1 font-medium"
                    >
                      <LinkIcon className="w-3 h-3" />
                      <span>{showBannerUrlInput ? (isKhmer ? 'បិទ URL' : 'Hide URL') : (isKhmer ? 'បញ្ចូល URL' : 'Enter URL')}</span>
                    </button>
                  </div>

                  <div className="relative w-full h-20 rounded-xl bg-slate-50 border border-gray-200 overflow-hidden flex items-center justify-center shadow-2xs">
                    {bannerUrl ? (
                      <img src={getAssetUrl(bannerUrl)} alt="Banner" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex items-center space-x-1.5 text-slate-400 text-xs">
                        <ImageIcon className="w-4 h-4 text-slate-300" />
                        <span className="text-[11px]">{isKhmer ? 'គ្មានរូបភាពផ្ទាំង' : 'No banner set'}</span>
                      </div>
                    )}
                    {isUploadingBanner && (
                      <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                        <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <input
                      ref={bannerInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleBannerFileChange}
                    />
                    <button
                      type="button"
                      disabled={isUploadingBanner}
                      onClick={() => bannerInputRef.current?.click()}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-gray-200 transition cursor-pointer disabled:opacity-50 shadow-2xs"
                    >
                      <Upload className="w-3 h-3 text-slate-500" />
                      <span>{isUploadingBanner ? (isKhmer ? 'កំពុងផ្ទុក...' : 'Uploading...') : (isKhmer ? 'ជ្រើសរើសរូប' : 'Upload Banner')}</span>
                    </button>
                    {bannerUrl && (
                      <button
                        type="button"
                        onClick={() => handleRemoveImage('banner')}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 border border-gray-200 transition cursor-pointer shadow-2xs"
                        title="Remove Banner"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {showBannerUrlInput && (
                    <input
                      type="url"
                      value={bannerUrl}
                      onChange={(e) => setBannerUrl(e.target.value)}
                      placeholder="https://example.com/banner.png"
                      className="w-full text-xs p-2 bg-white border border-gray-200 rounded-xl text-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition shadow-2xs"
                    />
                  )}
                </div>
              </div>

              {/* 2. Live Public Card Preview */}
              <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                  <div className="flex items-center space-x-1.5">
                    <Eye className="w-3.5 h-3.5 text-slate-500" />
                    <h2 className="text-xs sm:text-sm font-bold text-slate-900">
                      {isKhmer ? 'ទិដ្ឋភាពបង្ហាញជាសាធារណៈ' : 'Public Card Preview'}
                    </h2>
                  </div>
                  <span className="text-[10px] text-blue-600 font-semibold">
                    {isKhmer ? 'ទម្រង់ផ្ទាល់' : 'Live Preview'}
                  </span>
                </div>

                {/* Mini Card simulating the Public Directory */}
                <div className="rounded-xl border border-gray-200 overflow-hidden bg-white shadow-2xs">
                  {/* Banner */}
                  <div className="relative h-20 w-full overflow-hidden bg-slate-100">
                    <img
                      src={getAssetUrl(previewBanner)}
                      alt="Preview Banner"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
                    <span className="absolute top-2 right-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-600/90 text-white">
                      <Briefcase className="w-2.5 h-2.5" />
                      <span>{company?.jobs_count || 1} {isKhmer ? 'ការងារ' : 'Jobs'}</span>
                    </span>
                  </div>

                  {/* Logo & Info */}
                  <div className="px-3 -mt-6 relative z-10 flex items-end">
                    <div className="w-12 h-12 rounded-full bg-white p-0.5 border border-gray-200 shadow-2xs overflow-hidden shrink-0">
                      {logoUrl ? (
                        <img src={getAssetUrl(logoUrl)} alt="Logo" className="w-full h-full object-cover rounded-full" />
                      ) : (
                        <div className="w-full h-full rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                          {getInitials(name || 'Company')}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-3 pt-2 space-y-1">
                    <div className="flex items-center space-x-1">
                      <span className="text-xs font-bold text-slate-800 truncate">
                        {name || (isKhmer ? 'ឈ្មោះក្រុមហ៊ុន' : 'Company Name')}
                      </span>
                      {company?.verification_status === 'verified' && (
                        <FacebookVerifiedBadge className="w-4 h-4 shrink-0" title={isKhmer ? 'ផ្ទៀងផ្ទាត់ផ្លូវការ' : 'Verified'} />
                      )}
                    </div>

                    <p className="text-[11px] text-slate-500 truncate">
                      {industry || (isKhmer ? 'វិស័យចម្បង' : 'Primary Industry')}
                    </p>

                    <div className="flex items-center gap-1.5 pt-1">
                      <span className="inline-flex items-center text-[10px] text-slate-500 bg-slate-50 border border-gray-100 px-1.5 py-0.5 rounded">
                        <MapPin className="w-2.5 h-2.5 mr-0.5 text-slate-400" />
                        <span>{province || 'Phnom Penh'}</span>
                      </span>
                      <span className="inline-flex items-center text-[10px] text-slate-500 bg-slate-50 border border-gray-100 px-1.5 py-0.5 rounded">
                        <Users className="w-2.5 h-2.5 mr-0.5 text-slate-400" />
                        <span>{companySize}</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ================= RIGHT COLUMN: Form Details (lg:col-span-8) ================= */}
            <div className="lg:col-span-8 space-y-4 sm:space-y-5">
              {/* Permission Banner for Sub-Users (Interviewer, Recruiter, etc.) */}
              {!canManage && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start space-x-3 text-amber-900 text-xs shadow-2xs">
                  <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-slate-900 mb-0.5">
                      {isKhmer ? 'សិទ្ធិត្រឹមតែមើល' : 'View-Only Mode'}
                    </h4>
                    <p className="text-slate-600 leading-relaxed">
                      {isKhmer
                        ? `លោកអ្នកកំពុងចូលប្រើប្រាស់ជាតួនាទីបុគ្គលិក (${myRole === 'interviewer' ? 'អ្នកសម្ភាសន៍' : myRole})។ មានតែម្ចាស់ក្រុមហ៊ុន ឬអ្នកគ្រប់គ្រងប្រព័ន្ធទេដែលអាចកែប្រែព័ត៌មានក្រុមហ៊ុន និងគ្រប់គ្រងបុគ្គលិកបាន។`
                        : `You are viewing this company profile with ${myRole} permissions. Only company owner or administrator can modify details or manage team members.`}
                    </p>
                  </div>
                </div>
              )}

              {/* 1. General Organization Info */}
              <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 space-y-4 shadow-2xs">
                <h2 className="text-xs sm:text-sm font-bold text-slate-900 pb-2 border-b border-gray-100">
                  {isKhmer ? '១. ព័ត៌មានទូទៅរបស់ក្រុមហ៊ុន' : '1. General Corporate Information'}
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Legal Name */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {isKhmer ? 'ឈ្មោះក្រុមហ៊ុនផ្លូវការ' : 'Company Legal Name'} <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      disabled={!canManage}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Royal Academy of Cambodia"
                      className="w-full text-xs p-2.5 bg-white border border-gray-200 rounded-xl text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition shadow-2xs disabled:bg-slate-50 disabled:text-slate-500"
                    />
                  </div>

                  {/* Website */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {isKhmer ? 'គេហទំព័រផ្លូវការ' : 'Official Website'}
                    </label>
                    <input
                      type="url"
                      disabled={!canManage}
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder="https://www.example.com.kh"
                      className="w-full text-xs p-2.5 bg-white border border-gray-200 rounded-xl text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition shadow-2xs disabled:bg-slate-50 disabled:text-slate-500"
                    />
                  </div>

                  {/* Industry */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {isKhmer ? 'វិស័យចម្បង' : 'Primary Industry'}
                    </label>
                    <input
                      type="text"
                      disabled={!canManage}
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      placeholder={isKhmer ? 'ឧ. ទូរគមនាគមន៍ ឬ ធនាគារ' : 'e.g. Telecommunications or Banking'}
                      className="w-full text-xs p-2.5 bg-white border border-gray-200 rounded-xl text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition shadow-2xs disabled:bg-slate-50 disabled:text-slate-500"
                    />
                  </div>

                  {/* Company Size */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {isKhmer ? 'ទំហំក្រុមហ៊ុន' : 'Company Size'}
                    </label>
                    <Select
                      value={companySize}
                      onChange={(e) => setCompanySize(e.target.value)}
                      options={companySizeOptions}
                    />
                  </div>
                </div>
              </div>

              {/* 2. Official Cambodian National ID Card Verification */}
              <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 space-y-4 shadow-2xs">
                <div className="flex items-center justify-between gap-3 pb-3 border-b border-gray-100">
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center shrink-0 shadow-2xs">
                      <ShieldCheck className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight truncate">
                        {isKhmer ? '២. អត្តសញ្ញាណប័ណ្ណសញ្ជាតិខ្មែរ' : '2. Cambodian National ID Card'}
                      </h2>
                      <p className="text-[11px] text-slate-500 truncate">
                        {isKhmer
                          ? 'ឯកសារផ្លូវការផ្ទៀងផ្ទាត់ម្ចាស់ក្រុមហ៊ុន ឬតំណាងស្របច្បាប់'
                          : 'Official identity document for company verification'}
                      </p>
                    </div>
                  </div>
                  {nationalIdCard ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>{isKhmer ? 'បានបញ្ចូល' : 'Uploaded'}</span>
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 shrink-0">
                      * {isKhmer ? 'ចាំបាច់' : 'Required'}
                    </span>
                  )}
                </div>

                {nationalIdCard ? (
                  <div className="space-y-3">
                    {nationalIdCard.toLowerCase().endsWith('.pdf') ? (
                      <div className="p-5 rounded-xl bg-slate-50/70 border border-slate-200/80 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-11 h-11 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center shrink-0">
                            <FileText className="w-5 h-5 text-rose-600" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-slate-800 block truncate">
                              {nationalIdCard.split('/').pop()}
                            </span>
                            <span className="text-[11px] text-slate-400 block">
                              {isKhmer ? 'ឯកសារ PDF' : 'PDF Document'}
                            </span>
                          </div>
                        </div>
                        <a
                          href={getAssetUrl(nationalIdCard)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-blue-600 bg-white hover:bg-blue-50 border border-blue-200 transition shrink-0 shadow-2xs"
                        >
                          <span>{isKhmer ? 'បើកមើល' : 'Open PDF'}</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    ) : (
                      <div className="relative rounded-xl border border-slate-200/90 bg-slate-50/70 p-3 flex items-center justify-center overflow-hidden">
                        <img
                          src={getAssetUrl(nationalIdCard)}
                          alt="Cambodian National ID Card"
                          className="max-h-68 w-auto max-w-full object-contain rounded-lg shadow-xs"
                        />
                        {isUploadingIdCard && (
                          <div className="absolute inset-0 bg-white/80 flex items-center justify-center backdrop-blur-xs">
                            <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <a
                        href={getAssetUrl(nationalIdCard)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>{isKhmer ? 'មើលរូបភាពទំហំពេញ' : 'View Full Size'}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>

                      {canManage && (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={isUploadingIdCard}
                            onClick={() => idCardInputRef.current?.click()}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition cursor-pointer disabled:opacity-50"
                          >
                            <Upload className="w-3.5 h-3.5 text-slate-500" />
                            <span>
                              {isUploadingIdCard
                                ? isKhmer ? 'កំពុងផ្ទុកឡើង...' : 'Uploading...'
                                : isKhmer ? 'ប្តូរអត្តសញ្ញាណប័ណ្ណថ្មី' : 'Change'}
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setNationalIdCard('')}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-rose-600 hover:bg-rose-50 rounded-xl border border-rose-200 transition cursor-pointer text-xs font-semibold"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>{isKhmer ? 'លុបចេញ' : 'Remove'}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => {
                      if (canManage) idCardInputRef.current?.click()
                    }}
                    className={`border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-6 sm:p-8 text-center transition bg-slate-50/50 hover:bg-blue-50/20 group ${
                      canManage ? 'cursor-pointer' : 'opacity-60 cursor-not-allowed'
                    }`}
                  >
                    {isUploadingIdCard ? (
                      <div className="py-3 flex flex-col items-center space-y-2">
                        <Loader2 className="w-7 h-7 text-blue-600 animate-spin" />
                        <span className="text-xs text-slate-500 font-medium">
                          {isKhmer ? 'កំពុងបញ្ចូលឯកសារអត្តសញ្ញាណប័ណ្ណ...' : 'Uploading National ID Card...'}
                        </span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center mx-auto group-hover:scale-105 transition shadow-2xs">
                          <Upload className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-slate-800 block">
                            {isKhmer
                              ? 'ចុចដើម្បីផ្ទុកឡើងអត្តសញ្ញាណប័ណ្ណសញ្ជាតិខ្មែរ'
                              : 'Click to Upload Cambodian National ID Card'}
                          </span>
                          <span className="text-[11px] text-slate-400 block mt-0.5">
                            {isKhmer
                              ? 'PNG, JPG, WEBP ឬ PDF (អតិបរមា 5MB) • ផ្នែកខាងមុខច្បាស់លាស់'
                              : 'PNG, JPG, WEBP, PDF (Max 5MB) • Clear front side'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <input
                  ref={idCardInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/jpg,application/pdf"
                  className="hidden"
                  onChange={handleIdCardFileChange}
                />
              </div>

              {/* 3. Location & Office Address */}
              <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 space-y-4 shadow-2xs">
                <h2 className="text-xs sm:text-sm font-bold text-slate-900 pb-2 border-b border-gray-100">
                  {isKhmer ? '៣. ទីតាំង និងអាសយដ្ឋាន' : '3. Location & Address'}
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {isKhmer ? 'ខេត្ត / រាជធានី' : 'Province / City'}
                    </label>
                    <Select
                      value={province}
                      onChange={(e) => setProvince(e.target.value)}
                      options={provinceOptions}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {isKhmer ? 'អាសយដ្ឋានការិយាល័យ' : 'Office Street Address'}
                    </label>
                    <input
                      type="text"
                      disabled={!canManage}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder={
                        isKhmer
                          ? 'ឧ. ផ្ទះលេខ 464A មហាវិថីព្រះមុនីវង្ស សង្កាត់ទន្លេបាសាក់'
                          : 'e.g. No. 464A, Monivong Blvd, Sangkat Tonle Bassac'
                      }
                      className="w-full text-xs p-2.5 bg-white border border-gray-200 rounded-xl text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition shadow-2xs disabled:bg-slate-50 disabled:text-slate-500"
                    />
                  </div>
                </div>
              </div>

              {/* 4. TinyMCE Rich Editor for Company Description */}
              <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                  <h2 className="text-xs sm:text-sm font-bold text-slate-900">
                    {isKhmer ? '៤. អំពីក្រុមហ៊ុន និងវប្បធម៌ការងារ' : '4. About Organization & Culture'}
                  </h2>
                  <span className="text-[10px] text-slate-400">TinyMCE Editor</span>
                </div>

                <div className="rounded-xl border border-gray-200 overflow-hidden shadow-2xs">
                  <Editor
                    tinymceScriptSrc="https://cdnjs.cloudflare.com/ajax/libs/tinymce/6.8.2/tinymce.min.js"
                    value={description}
                    disabled={!canManage}
                    onEditorChange={(newContent) => {
                      if (canManage) setDescription(newContent)
                    }}
                    init={{
                      height: 250,
                      menubar: false,
                      plugins: [
                        'advlist',
                        'autolink',
                        'lists',
                        'link',
                        'searchreplace',
                        'table',
                        'wordcount',
                      ],
                      toolbar: canManage
                        ? 'undo redo | bold italic underline | ' +
                          'bullist numlist | alignleft aligncenter alignright | ' +
                          'link table | removeformat'
                        : false,
                      content_style:
                        'body { font-family: "Plus Jakarta Sans", "Kantumruy Pro", sans-serif; font-size: 13px; color: #334155; line-height: 1.6; }',
                      branding: false,
                      promotion: false,
                      placeholder: isKhmer
                        ? 'រៀបរាប់អំពីប្រវត្តិក្រុមហ៊ុន បេសកកម្ម វប្បធម៌ការងារ និងឱកាសរីកចម្រើន...'
                        : 'Describe your company culture, achievements, and career opportunities...',
                    }}
                  />
                </div>
              </div>

              {/* 5. Action Save Bar */}
              <div className="flex items-center justify-between bg-white rounded-2xl border border-gray-200 p-4 shadow-2xs">
                <p className="text-[11px] text-slate-500">
                  {canManage
                    ? isKhmer
                      ? 'ព័ត៌មានដែលបានកែប្រែ នឹងធ្វើបច្ចុប្បន្នភាពលើទំព័រស្វែងរកភ្លាមៗ'
                      : 'Saved changes update immediately across the public company directory'
                    : isKhmer
                      ? 'គណនីរបស់អ្នកមានសិទ្ធិត្រឹមតែមើល មិនអាចកែប្រែទិន្នន័យបានទេ។'
                      : 'Your account has view-only access. You cannot edit company profile information.'}
                </p>

                {canManage ? (
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-semibold text-xs transition shadow-2xs disabled:opacity-50 flex items-center space-x-1.5 cursor-pointer"
                  >
                    {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>
                      {isSaving
                        ? isKhmer
                          ? 'កំពុងរក្សាទុក...'
                          : 'Saving...'
                        : isKhmer
                          ? 'រក្សាទុកព័ត៌មាន'
                          : 'Save Changes'}
                    </span>
                    {!isSaving && <ArrowRight className="w-3.5 h-3.5" />}
                  </button>
                ) : (
                  <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200">
                    {isKhmer ? 'សិទ្ធិត្រឹមតែមើល' : 'View-Only Access'}
                  </span>
                )}
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  )
}
