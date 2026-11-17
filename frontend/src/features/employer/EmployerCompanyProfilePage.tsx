import React, { useEffect, useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { companiesService } from '../../services/companies.service'
import { jobsService } from '../../services/jobs.service'
import { Company } from '../../types'
import { Select } from '../../components/ui/Select'
import { useToast } from '../../app/providers'
import { getAssetUrl } from '../../utils/assets'
import { Editor } from '@tinymce/tinymce-react'
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

  // Upload States & Mode Toggles
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)
  const [isUploadingBanner, setIsUploadingBanner] = useState(false)
  const [showLogoUrlInput, setShowLogoUrlInput] = useState(false)
  const [showBannerUrlInput, setShowBannerUrlInput] = useState(false)

  const logoInputRef = useRef<HTMLInputElement>(null)
  const bannerInputRef = useRef<HTMLInputElement>(null)

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
      const res = await companiesService.uploadCompanyImage(file)
      if (res && res.url) {
        setLogoUrl(res.url)
        toast.success(
          isKhmer ? 'បានផ្ទុកឡើងរូបសញ្ញា' : 'Logo Uploaded',
          isKhmer ? 'រូបសញ្ញាក្រុមហ៊ុនត្រូវបានផ្ទុកឡើងដោយជោគជ័យ' : 'Company logo has been uploaded.'
        )
      }
    } catch (err: any) {
      const msg = err.response?.data?.file || 'Failed to upload logo image.'
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
      const res = await companiesService.uploadCompanyImage(file)
      if (res && res.url) {
        setBannerUrl(res.url)
        toast.success(
          isKhmer ? 'បានផ្ទុកឡើងផ្ទាំងរូបភាព' : 'Banner Uploaded',
          isKhmer ? 'ផ្ទាំងរូបភាពក្រុមហ៊ុនត្រូវបានផ្ទុកឡើងដោយជោគជ័យ' : 'Company banner has been uploaded.'
        )
      }
    } catch (err: any) {
      const msg = err.response?.data?.file || 'Failed to upload banner image.'
      toast.error('Upload Failed', String(msg))
    } finally {
      setIsUploadingBanner(false)
      if (bannerInputRef.current) bannerInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setMessage(null)
    try {
      await companiesService.updateEmployerCompany({
        name: name.trim(),
        logo_url: logoUrl.trim() || undefined,
        banner_url: bannerUrl.trim() || undefined,
        description,
        website: website.trim() || undefined,
        industry: industry.trim() || undefined,
        company_size: companySize || undefined,
        province,
        city: city.trim() || undefined,
        address: address.trim() || undefined,
      })
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
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 border border-gray-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>{isKhmer ? 'ផ្ទៀងផ្ទាត់រួច' : 'Verified'}</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold bg-amber-50 text-amber-700 border border-gray-200">
              <span>{isKhmer ? 'រង់ចាំការផ្ទៀងផ្ទាត់' : 'Pending Verification'}</span>
            </span>
          )}
        </div>
      </div>

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
                    {isKhmer ? 'រូបសញ្ញា (Logo)' : 'Company Logo'}
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
                          onClick={() => setLogoUrl('')}
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
                    {isKhmer ? 'ផ្ទាំងរូបភាព (Banner)' : 'Cover Banner'}
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
                      onClick={() => setBannerUrl('')}
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
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
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
            {/* 1. General Organization Info */}
            <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 space-y-4 shadow-2xs">
              <h2 className="text-xs sm:text-sm font-bold text-slate-900 pb-2 border-b border-gray-100">
                {isKhmer ? 'ព័ត៌មានទូទៅរបស់ក្រុមហ៊ុន' : 'General Information'}
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
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Royal Academy of Cambodia"
                    className="w-full text-xs p-2.5 bg-white border border-gray-200 rounded-xl text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition shadow-2xs"
                  />
                </div>

                {/* Website */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {isKhmer ? 'គេហទំព័រផ្លូវការ' : 'Official Website'}
                  </label>
                  <input
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://www.example.com.kh"
                    className="w-full text-xs p-2.5 bg-white border border-gray-200 rounded-xl text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition shadow-2xs"
                  />
                </div>

                {/* Industry */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {isKhmer ? 'វិស័យចម្បង' : 'Primary Industry'}
                  </label>
                  <input
                    type="text"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    placeholder={isKhmer ? 'ឧ. ទូរគមនាគមន៍ ឬ ធនាគារ' : 'e.g. Telecommunications or Banking'}
                    className="w-full text-xs p-2.5 bg-white border border-gray-200 rounded-xl text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition shadow-2xs"
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

            {/* 2. Location & Office Address */}
            <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 space-y-4 shadow-2xs">
              <h2 className="text-xs sm:text-sm font-bold text-slate-900 pb-2 border-b border-gray-100">
                {isKhmer ? 'ទីតាំង និងអាសយដ្ឋាន' : 'Location & Address'}
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
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder={
                      isKhmer
                        ? 'ឧ. ផ្ទះលេខ 464A មហាវិថីព្រះមុនីវង្ស សង្កាត់ទន្លេបាសាក់'
                        : 'e.g. No. 464A, Monivong Blvd, Sangkat Tonle Bassac'
                    }
                    className="w-full text-xs p-2.5 bg-white border border-gray-200 rounded-xl text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition shadow-2xs"
                  />
                </div>
              </div>
            </div>

            {/* 3. TinyMCE Rich Editor for Company Description */}
            <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <h2 className="text-xs sm:text-sm font-bold text-slate-900">
                  {isKhmer ? 'អំពីក្រុមហ៊ុន និងវប្បធម៌ការងារ' : 'About Organization & Culture'}
                </h2>
                <span className="text-[10px] text-slate-400">TinyMCE Editor</span>
              </div>

              <div className="rounded-xl border border-gray-200 overflow-hidden shadow-2xs">
                <Editor
                  tinymceScriptSrc="https://cdnjs.cloudflare.com/ajax/libs/tinymce/6.8.2/tinymce.min.js"
                  value={description}
                  onEditorChange={(newContent) => setDescription(newContent)}
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
                    toolbar:
                      'undo redo | bold italic underline | ' +
                      'bullist numlist | alignleft aligncenter alignright | ' +
                      'link table | removeformat',
                    content_style:
                      'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 13px; color: #334155; line-height: 1.6; }',
                    branding: false,
                    promotion: false,
                    placeholder: isKhmer
                      ? 'រៀបរាប់អំពីប្រវត្តិក្រុមហ៊ុន បេសកកម្ម វប្បធម៌ការងារ និងឱកាសរីកចម្រើន...'
                      : 'Describe your company culture, achievements, and career opportunities...',
                  }}
                />
              </div>
            </div>

            {/* 4. Action Save Bar */}
            <div className="flex items-center justify-between bg-white rounded-2xl border border-gray-200 p-4 shadow-2xs">
              <p className="text-[11px] text-slate-500">
                {isKhmer
                  ? 'ព័ត៌មានដែលបានកែប្រែ នឹងធ្វើបច្ចុប្បន្នភាពលើទំព័រស្វែងរកភ្លាមៗ'
                  : 'Saved changes update immediately across the public company directory'}
              </p>

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
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
