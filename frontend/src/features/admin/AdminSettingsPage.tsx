import React, { useEffect, useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { adminService } from '../../services/admin.service'
import { useToast, useSiteSettings } from '../../app/providers'
import { getAssetUrl } from '../../utils/assets'
import { SiteSettings } from '../../types'
import {
  Settings,
  Globe,
  Home,
  Megaphone,
  Share2,
  Upload,
  Check,
  RotateCcw,
  ExternalLink,
  Save,
  Image as ImageIcon,
  Sparkles,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Eye,
  Trash2,
  Copy,
  CheckCheck,
  FolderOpen,
  Link as LinkIcon,
  X,
  FileImage,
  ArrowRight,
} from 'lucide-react'

export const AdminSettingsPage: React.FC = () => {
  const { i18n } = useTranslation()
  const isKhmer = i18n.language === 'km'
  const { toast } = useToast()
  const { updateLocalSettings, refreshSettings } = useSiteSettings()

  const [activeTab, setActiveTab] = useState<'branding' | 'homepage' | 'announcement' | 'contact'>('branding')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)
  const [isUploadingFavicon, setIsUploadingFavicon] = useState(false)
  const [isDragOverLogo, setIsDragOverLogo] = useState(false)
  const [isDragOverFavicon, setIsDragOverFavicon] = useState(false)

  // Copy URL indicators
  const [copiedLogo, setCopiedLogo] = useState(false)
  const [copiedFavicon, setCopiedFavicon] = useState(false)

  const logoInputRef = useRef<HTMLInputElement>(null)
  const faviconInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState<SiteSettings>({
    site_name: 'CambodiaJobs',
    site_name_km: 'ការងារកម្ពុជា',
    site_title: "Cambodia's Leading Job & Recruitment Platform",
    site_title_km: 'វេទិកាការងារ និងជ្រើសរើសបុគ្គលិកឈានមុខគេនៅកម្ពុជា',
    site_subtitle: 'Find your dream career or hire top talent across Cambodia',
    site_subtitle_km: 'ស្វែងរកការងារក្នុងក្តីស្រមៃ ឬជ្រើសរើសបុគ្គលិកឆ្នើមទូទាំងប្រទេសកម្ពុជា',
    site_description: '',
    site_description_km: '',
    logo_url: null,
    favicon_url: null,
    hero_title: 'Discover Verified Career Opportunities in Cambodia',
    hero_title_km: 'ស្វែងរកឱកាសការងារដែលបានផ្ទៀងផ្ទាត់នៅកម្ពុជា',
    hero_subtitle: 'Connecting talented professionals with top verified companies across Phnom Penh and all 25 provinces.',
    hero_subtitle_km: 'តភ្ជាប់បេក្ខជនឆ្នើមជាមួយក្រុមហ៊ុនដែលបានផ្ទៀងផ្ទាត់នៅរាជធានីភ្នំពេញ និងគ្រប់ខេត្តក្រុង។',
    hero_badge_text: '🇰🇭 #1 Job Platform in Cambodia',
    hero_badge_text_km: '🇰🇭 វេទិកាការងារលេខ ១ នៅកម្ពុជា',
    contact_email: 'support@cambodiajobs.kh',
    contact_phone: '+855 23 999 888',
    contact_address: 'Phnom Penh, Cambodia',
    contact_address_km: 'រាជធានីភ្នំពេញ, ប្រទេសកម្ពុជា',
    footer_text: 'Connecting ambitious professionals with reputable employers across Cambodia since 2026.',
    footer_text_km: 'តភ្ជាប់អ្នកជំនាញដែលមានទេពកោសល្យជាមួយនិយោជកដែលគួរឱ្យទុកចិត្តទូទាំងប្រទេសកម្ពុជា។',
    social_facebook: 'https://facebook.com',
    social_telegram: 'https://t.me/CambodiaJobSupportBot',
    social_linkedin: 'https://linkedin.com',
    social_twitter: '',
    announcement_enabled: false,
    announcement_text: '',
    announcement_text_km: '',
    announcement_url: '',
  })

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    setIsLoading(true)
    try {
      const data = await adminService.getSettings()
      if (data) {
        setFormData({
          ...data,
          announcement_enabled: Boolean(data.announcement_enabled),
        })
      }
    } catch (err) {
      console.error('Failed to load site settings:', err)
      toast.error(
        isKhmer ? 'មិនអាចទាញយកការកំណត់បានទេ' : 'Failed to load settings',
        isKhmer ? 'សូមព្យាយាមម្តងទៀត' : 'Please check your connection'
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (field: keyof SiteSettings, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleFileUpload = async (file: File, type: 'logo' | 'favicon') => {
    if (!file) return

    if (type === 'logo') setIsUploadingLogo(true)
    else setIsUploadingFavicon(true)

    try {
      const res = await adminService.uploadLogo(file, type)
      if (res && res.url) {
        handleChange(type === 'logo' ? 'logo_url' : 'favicon_url', res.url)
        // Refresh global site settings so Navbar/Footer/Admin sidebar show
        // the new image immediately without a full page reload.
        await refreshSettings()
        toast.success(
          isKhmer
            ? `បានផ្ទុកឡើង ${type === 'logo' ? 'រូបសញ្ញា Logo' : 'Favicon'} ដោយជោគជ័យ!`
            : `${type === 'logo' ? 'Logo' : 'Favicon'} uploaded and saved!`,
          isKhmer
            ? 'រូបភាពត្រូវបានរក្សាទុកភ្លាមៗ (ការកែប្រែផ្សេងទៀតត្រូវចុចរក្សាទុក)'
            : 'Image saved automatically (other changes still need Save)'
        )
      }
    } catch (err: any) {
      console.error(`Failed to upload ${type}:`, err)
      toast.error(
        isKhmer ? `បរាជ័យក្នុងការបញ្ចូលរូបភាព ${type}` : `Failed to upload ${type}`,
        err?.response?.data?.details?.file ||
          err?.response?.data?.error ||
          'Error uploading file from PC'
      )
    } finally {
      if (type === 'logo') setIsUploadingLogo(false)
      else setIsUploadingFavicon(false)
    }
  }

  const handleRemoveImage = async (type: 'logo' | 'favicon') => {
    const field = type === 'logo' ? 'logo_url' : 'favicon_url'
    const previous = formData[field]

    handleChange(field, null)

    try {
      const res = await adminService.updateSettings(
        type === 'logo' ? { logo_url: null } : { favicon_url: null }
      )
      if (res?.data) updateLocalSettings(res.data)
      toast.success(
        isKhmer ? 'បានដករូបភាពចេញ' : 'Image Removed',
        isKhmer ? 'រូបភាពត្រូវបានដកចេញ និងរក្សាទុកដោយជោគជ័យ' : 'The image was removed and saved.'
      )
    } catch (err: any) {
      handleChange(field, previous)
      toast.error(
        isKhmer ? 'បរាជ័យ' : 'Remove Failed',
        err?.response?.data?.message || (isKhmer ? 'មិនអាចដករូបភាពបានទេ' : 'Could not remove the image.')
      )
    }
  }

  const handleCopyUrl = (url: string | null | undefined, type: 'logo' | 'favicon') => {
    if (!url) return
    navigator.clipboard.writeText(url)
    if (type === 'logo') {
      setCopiedLogo(true)
      setTimeout(() => setCopiedLogo(false), 2000)
    } else {
      setCopiedFavicon(true)
      setTimeout(() => setCopiedFavicon(false), 2000)
    }
    toast.success(
      isKhmer ? 'បានចម្លង URL' : 'URL Copied',
      isKhmer ? 'តំណភ្ជាប់រូបភាពត្រូវបានចម្លងទៅកាន់ Clipboard' : 'Image URL copied to clipboard'
    )
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setIsSaving(true)

    try {
      const res = await adminService.updateSettings(formData)
      if (res && res.data) {
        setFormData({
          ...res.data,
          announcement_enabled: Boolean(res.data.announcement_enabled),
        })
        updateLocalSettings(res.data)
      }
      toast.success(
        isKhmer ? 'បានរក្សាទុកការកំណត់គេហទំព័រ!' : 'Website settings updated!',
        isKhmer
          ? 'ព័ត៌មាន និងខ្លឹមសារគេហទំព័រត្រូវបានធ្វើបច្ចុប្បន្នភាពភ្លាមៗ'
          : 'Branding and home page content have been updated platform-wide'
      )
    } catch (err) {
      console.error('Failed to update settings:', err)
      toast.error(
        isKhmer ? 'បរាជ័យក្នុងការរក្សាទុក' : 'Save failed',
        isKhmer ? 'សូមពិនិត្យមើលទិន្នន័យ ហើយព្យាយាមម្តងទៀត' : 'Please check your input and try again'
      )
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 font-sans">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-500 font-medium">
          {isKhmer ? 'កំពុងផ្ទុកការកំណត់...' : 'Loading site settings...'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-20 font-sans animate-in fade-in duration-200 max-w-7xl mx-auto">
      {/* 1. Header Card with Live Action Buttons */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-gray-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                {isKhmer ? 'ការកំណត់គេហទំព័រ & ម៉ាកសញ្ញា' : 'Website Settings & Branding'}
              </h1>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                System
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {isKhmer
                ? 'គ្រប់គ្រង Logo, Favicon, ចំណងជើងគេហទំព័រ, ខ្លឹមសារទំព័រដើម, និងព័ត៌មានទំនាក់ទំនង'
                : 'Configure website branding, logos, home page content, and organization contacts'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold shadow-2xs transition active:scale-95 cursor-pointer"
          >
            <Eye className="w-4 h-4 text-slate-400" />
            <span>{isKhmer ? 'មើលគេហទំព័រផ្ទាល់' : 'View Live Site'}</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </a>

          <button
            type="button"
            onClick={() => handleSubmit()}
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-500/25 transition active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>
              {isSaving
                ? isKhmer
                  ? 'កំពុងរក្សាទុក...'
                  : 'Saving...'
                : isKhmer
                ? 'រក្សាទុកការកែប្រែ'
                : 'Save Changes'}
            </span>
          </button>
        </div>
      </div>

      {/* 2. Modern Segmented Navigation Tabs ("taps clear goods this") */}
      <div className="bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200/80 inline-flex flex-wrap items-center gap-1.5 shadow-2xs w-full sm:w-auto">
        {/* Tab 1: Branding & Identity */}
        <button
          type="button"
          onClick={() => setActiveTab('branding')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
            activeTab === 'branding'
              ? 'bg-white text-blue-600 shadow-xs font-bold border border-slate-200/90'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>{isKhmer ? 'ម៉ាកសញ្ញា & អត្តសញ្ញាណ' : 'Branding & Identity'}</span>
        </button>

        {/* Tab 2: Home Page Hero */}
        <button
          type="button"
          onClick={() => setActiveTab('homepage')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
            activeTab === 'homepage'
              ? 'bg-white text-blue-600 shadow-xs font-bold border border-slate-200/90'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <Home className="w-4 h-4" />
          <span>{isKhmer ? 'ខ្លឹមសារទំព័រដើម' : 'Home Page Hero'}</span>
        </button>

        {/* Tab 3: Top Announcement */}
        <button
          type="button"
          onClick={() => setActiveTab('announcement')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
            activeTab === 'announcement'
              ? 'bg-white text-blue-600 shadow-xs font-bold border border-slate-200/90'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <Megaphone className="w-4 h-4" />
          <span>{isKhmer ? 'របារជូនដំណឹងកំពូល' : 'Top Announcement'}</span>
          {formData.announcement_enabled && (
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-0.5" />
          )}
        </button>

        {/* Tab 4: Contact & Social */}
        <button
          type="button"
          onClick={() => setActiveTab('contact')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
            activeTab === 'contact'
              ? 'bg-white text-blue-600 shadow-xs font-bold border border-slate-200/90'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <Share2 className="w-4 h-4" />
          <span>{isKhmer ? 'ទំនាក់ទំនង & បណ្តាញសង្គម' : 'Contact & Social Links'}</span>
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {/* ======================================================== */}
        {/* TAB 1: BRANDING & IDENTITY (LOGO, FAVICON, TITLE, SEO)    */}
        {/* ======================================================== */}
        {activeTab === 'branding' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-150">
            {/* Left 2 Columns: General Platform Information & SEO */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-3xl p-6 sm:p-7 border border-gray-200/90 shadow-2xs space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-blue-600" />
                    <span>{isKhmer ? 'ព័ត៌មានទូទៅនៃគេហទំព័រ' : 'Website General Information'}</span>
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    {isKhmer ? 'បង្ហាញនៅលើ Header & SEO' : 'Header & Metadata'}
                  </span>
                </div>

                {/* Site Name (EN & KM) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 flex items-center justify-between">
                      <span>{isKhmer ? 'ឈ្មោះគេហទំព័រ (English)' : 'Platform Name (English)'}</span>
                      <span className="text-[10px] text-slate-400 font-normal">🇬🇧 EN</span>
                    </label>
                    <input
                      type="text"
                      value={formData.site_name}
                      onChange={(e) => handleChange('site_name', e.target.value)}
                      placeholder="CambodiaJobs"
                      className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl bg-slate-50/60 focus:bg-white border border-gray-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition shadow-2xs"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 flex items-center justify-between">
                      <span>{isKhmer ? 'ឈ្មោះគេហទំព័រ (ភាសាខ្មែរ)' : 'Platform Name (Khmer)'}</span>
                      <span className="text-[10px] text-slate-400 font-normal">🇰🇭 KM</span>
                    </label>
                    <input
                      type="text"
                      value={formData.site_name_km}
                      onChange={(e) => handleChange('site_name_km', e.target.value)}
                      placeholder="ការងារកម្ពុជា"
                      className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl bg-slate-50/60 focus:bg-white border border-gray-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition shadow-2xs"
                    />
                  </div>
                </div>

                {/* Site Title (EN & KM) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 flex items-center justify-between">
                      <span>{isKhmer ? 'ចំណងជើងធំគេហទំព័រ (Title - English)' : 'Website Title (English)'}</span>
                      <span className="text-[10px] text-slate-400 font-normal">🇬🇧 EN</span>
                    </label>
                    <input
                      type="text"
                      value={formData.site_title}
                      onChange={(e) => handleChange('site_title', e.target.value)}
                      placeholder="Cambodia's Leading Job & Recruitment Platform"
                      className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl bg-slate-50/60 focus:bg-white border border-gray-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition shadow-2xs"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 flex items-center justify-between">
                      <span>{isKhmer ? 'ចំណងជើងធំគេហទំព័រ (Title - ភាសាខ្មែរ)' : 'Website Title (Khmer)'}</span>
                      <span className="text-[10px] text-slate-400 font-normal">🇰🇭 KM</span>
                    </label>
                    <input
                      type="text"
                      value={formData.site_title_km}
                      onChange={(e) => handleChange('site_title_km', e.target.value)}
                      placeholder="វេទិកាការងារ និងជ្រើសរើសបុគ្គលិកឈានមុខគេនៅកម្ពុជា"
                      className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl bg-slate-50/60 focus:bg-white border border-gray-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition shadow-2xs"
                    />
                  </div>
                </div>

                {/* Subtitle / Tagline (EN & KM) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 flex items-center justify-between">
                      <span>{isKhmer ? 'ចំណងជើងរង / ពាក្យស្លោក (English)' : 'Subtitle / Tagline (English)'}</span>
                      <span className="text-[10px] text-slate-400 font-normal">🇬🇧 EN</span>
                    </label>
                    <input
                      type="text"
                      value={formData.site_subtitle}
                      onChange={(e) => handleChange('site_subtitle', e.target.value)}
                      placeholder="Find your dream career or hire top talent across Cambodia"
                      className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl bg-slate-50/60 focus:bg-white border border-gray-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition shadow-2xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 flex items-center justify-between">
                      <span>{isKhmer ? 'ចំណងជើងរង / ពាក្យស្លោក (ភាសាខ្មែរ)' : 'Subtitle / Tagline (Khmer)'}</span>
                      <span className="text-[10px] text-slate-400 font-normal">🇰🇭 KM</span>
                    </label>
                    <input
                      type="text"
                      value={formData.site_subtitle_km}
                      onChange={(e) => handleChange('site_subtitle_km', e.target.value)}
                      placeholder="ស្វែងរកការងារក្នុងក្តីស្រមៃ ឬជ្រើសរើសបុគ្គលិកឆ្នើមទូទាំងប្រទេសកម្ពុជា"
                      className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl bg-slate-50/60 focus:bg-white border border-gray-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition shadow-2xs"
                    />
                  </div>
                </div>

                {/* Meta Description EN & KM (SEO) */}
                <div className="space-y-4 pt-3 border-t border-slate-100">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 flex items-center justify-between">
                      <span>{isKhmer ? 'ការពិពណ៌នាគេហទំព័រ (Meta Description - English SEO)' : 'Meta Description (English - SEO)'}</span>
                      <span className="text-[10px] text-slate-400 font-normal">🇬🇧 EN</span>
                    </label>
                    <textarea
                      rows={2}
                      value={formData.site_description || ''}
                      onChange={(e) => handleChange('site_description', e.target.value)}
                      placeholder="CambodiaJobs is the premier job search and talent acquisition platform in Cambodia..."
                      className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl bg-slate-50/60 focus:bg-white border border-gray-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition leading-relaxed shadow-2xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 flex items-center justify-between">
                      <span>{isKhmer ? 'ការពិពណ៌នាគេហទំព័រ (Meta Description - ភាសាខ្មែរ SEO)' : 'Meta Description (Khmer - SEO)'}</span>
                      <span className="text-[10px] text-slate-400 font-normal">🇰🇭 KM</span>
                    </label>
                    <textarea
                      rows={2}
                      value={formData.site_description_km || ''}
                      onChange={(e) => handleChange('site_description_km', e.target.value)}
                      placeholder="CambodiaJobs គឺជាវេទិកាស្វែងរកការងារ និងជ្រើសរើសបុគ្គលិកឈានមុខគេនៅកម្ពុជា..."
                      className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl bg-slate-50/60 focus:bg-white border border-gray-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition leading-relaxed shadow-2xs"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: High-Grade Website Logo & Favicon with "Choose File on PC" + "URL Input" */}
            <div className="space-y-6">
              {/* ==================== 1. WEBSITE LOGO CARD ==================== */}
              <div className="bg-white rounded-3xl p-6 border border-gray-200/90 shadow-2xs space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-blue-600" />
                    <span>{isKhmer ? 'រូបសញ្ញាគេហទំព័រ (Logo)' : 'Website Logo'}</span>
                  </h3>
                  {formData.logo_url && (
                    <button
                      type="button"
                      onClick={() => handleRemoveImage('logo')}
                      className="text-xs text-rose-500 hover:text-rose-700 flex items-center gap-1 cursor-pointer transition"
                      title={isKhmer ? 'ដករូបចេញ' : 'Remove logo'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{isKhmer ? 'ដកចេញ' : 'Remove'}</span>
                    </button>
                  )}
                </div>

                {/* Visual Preview Container */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault()
                    setIsDragOverLogo(true)
                  }}
                  onDragLeave={() => setIsDragOverLogo(false)}
                  onDrop={(e) => {
                    e.preventDefault()
                    setIsDragOverLogo(false)
                    const file = e.dataTransfer.files?.[0]
                    if (file) handleFileUpload(file, 'logo')
                  }}
                  onClick={() => logoInputRef.current?.click()}
                  className={`h-36 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-4 relative overflow-hidden transition-all cursor-pointer group ${
                    isDragOverLogo
                      ? 'border-blue-500 bg-blue-50/80 scale-[1.01]'
                      : 'border-slate-200 hover:border-blue-400 bg-slate-50/80 hover:bg-blue-50/20'
                  }`}
                  title={isKhmer ? 'ចុចដើម្បីជ្រើសរើសរូបពីកុំព្យូទ័រ (Choose File from PC)' : 'Click or drop to choose file from PC'}
                >
                  {formData.logo_url ? (
                    <div className="flex flex-col items-center justify-center w-full h-full">
                      <img
                        src={getAssetUrl(formData.logo_url)}
                        alt="Website Logo"
                        className="max-h-24 max-w-full object-contain transition-transform group-hover:scale-105"
                        onError={() => {
                          toast.error(
                            isKhmer ? 'មិនអាចបង្ហាញរូបភាព Logo បានទេ' : 'Invalid logo URL',
                            isKhmer ? 'សូមពិនិត្យមើលតំណភ្ជាប់រូបភាព' : 'Please verify image URL'
                          )
                        }}
                      />
                      <span className="text-[10px] text-slate-400 font-mono mt-1 truncate max-w-[200px]">
                        {formData.logo_url}
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-center text-slate-400">
                      <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-1.5 shadow-2xs group-hover:scale-110 transition-transform">
                        <Upload className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-bold text-slate-700">
                        {isKhmer ? 'ជ្រើសរើសរូបពី PC ឬអូសទម្លាក់ទីនេះ' : 'Choose File from PC or Drop here'}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        PNG, SVG, JPG, WEBP &bull; Max 5MB
                      </p>
                    </div>
                  )}

                  {/* Uploading Spinner Overlay */}
                  {isUploadingLogo && (
                    <div className="absolute inset-0 bg-white/90 backdrop-blur-xs flex flex-col items-center justify-center gap-1.5">
                      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs font-bold text-blue-600">
                        {isKhmer ? 'កំពុងបញ្ចូលរូបពី PC...' : 'Uploading from PC...'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Primary Button: Choose File on PC */}
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFileUpload(file, 'logo')
                    if (e.target) e.target.value = ''
                  }}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  disabled={isUploadingLogo}
                  className="w-full py-2.5 px-4 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer active:scale-98 disabled:opacity-50 shadow-2xs"
                >
                  <FolderOpen className="w-4 h-4 text-blue-600" />
                  <span>
                    {isUploadingLogo
                      ? isKhmer
                        ? 'កំពុងបញ្ចូល...'
                        : 'Uploading...'
                      : isKhmer
                      ? 'ជ្រើសរើសរូបភាពពី PC (Choose File on PC)'
                      : 'Choose File on PC'}
                  </span>
                </button>

                {/* Input File / Image URL hybrid with attached "Browse PC" button */}
                <div className="space-y-1.5 pt-1">
                  <label className="block text-[11px] font-bold text-slate-600">
                    {isKhmer ? 'ឬបញ្ចូលតំណភ្ជាប់រូបភាព (Or Image URL):' : 'Or Image URL / Path:'}
                  </label>
                  <div className="flex items-center gap-1.5">
                    <div className="relative flex-1">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <LinkIcon className="w-3.5 h-3.5" />
                      </div>
                      <input
                        type="text"
                        value={formData.logo_url || ''}
                        onChange={(e) => handleChange('logo_url', e.target.value)}
                        placeholder="/media/site/logo.png or https://..."
                        className="w-full pl-9 pr-8 py-2 text-xs font-mono rounded-xl bg-slate-50/60 focus:bg-white border border-gray-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 text-slate-700 shadow-2xs transition"
                      />
                      {formData.logo_url && (
                        <button
                          type="button"
                          onClick={() => handleChange('logo_url', null)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-500 cursor-pointer"
                          title="Clear URL"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Attached Browse PC Button */}
                    <button
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      className="px-2.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1 shrink-0 transition cursor-pointer"
                      title={isKhmer ? 'ជ្រើសរើសឯកសារពីកុំព្យូទ័រ' : 'Browse file on computer'}
                    >
                      <FolderOpen className="w-3.5 h-3.5 text-slate-500" />
                      <span className="hidden sm:inline">{isKhmer ? 'ជ្រើសរើស' : 'Browse PC'}</span>
                    </button>

                    {/* Attached Copy URL Button */}
                    {formData.logo_url && (
                      <button
                        type="button"
                        onClick={() => handleCopyUrl(formData.logo_url, 'logo')}
                        className={`p-2 rounded-xl border text-xs font-semibold flex items-center justify-center shrink-0 transition cursor-pointer ${
                          copiedLogo
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-gray-200'
                        }`}
                        title={isKhmer ? 'ចម្លង URL' : 'Copy URL'}
                      >
                        {copiedLogo ? (
                          <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    {isKhmer
                      ? 'ទំហំសមរម្យ: 240×60px (PNG, SVG, JPG, WEBP ក្រោម 5MB)។'
                      : 'Recommended size: 240×60px (PNG, SVG, JPG, WEBP under 5MB).'}
                  </p>
                </div>
              </div>

              {/* ==================== 2. BROWSER FAVICON CARD ==================== */}
              <div className="bg-white rounded-3xl p-6 border border-gray-200/90 shadow-2xs space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    <span>{isKhmer ? 'Favicon (រូបតំណាង Browser)' : 'Browser Favicon'}</span>
                  </h3>
                  {formData.favicon_url && (
                    <button
                      type="button"
                      onClick={() => handleRemoveImage('favicon')}
                      className="text-xs text-rose-500 hover:text-rose-700 flex items-center gap-1 cursor-pointer transition"
                      title={isKhmer ? 'ដករូបចេញ' : 'Remove favicon'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{isKhmer ? 'ដកចេញ' : 'Remove'}</span>
                    </button>
                  )}
                </div>

                {/* Favicon Simulation Mockup (Shows what it looks like on real browser tab) */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault()
                    setIsDragOverFavicon(true)
                  }}
                  onDragLeave={() => setIsDragOverFavicon(false)}
                  onDrop={(e) => {
                    e.preventDefault()
                    setIsDragOverFavicon(false)
                    const file = e.dataTransfer.files?.[0]
                    if (file) handleFileUpload(file, 'favicon')
                  }}
                  onClick={() => faviconInputRef.current?.click()}
                  title={isKhmer ? 'ចុច ឬអូសទម្លាក់ Favicon ពីកុំព្យូទ័រ' : 'Click or drop a favicon file from your computer'}
                  className={`p-3 rounded-2xl border-2 border-dashed cursor-pointer transition ${
                    isDragOverFavicon
                      ? 'border-blue-500 bg-blue-50/80'
                      : 'border-slate-200/80 bg-slate-100 hover:border-blue-400'
                  }`}
                >
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    {isKhmer ? 'ការបង្ហាញលើ Browser Tab (Browser Tab Simulation)' : 'Browser Tab Mockup'}
                  </span>
                  <div className="inline-flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs max-w-full">
                    <div className="w-4 h-4 rounded shrink-0 overflow-hidden flex items-center justify-center">
                      {formData.favicon_url ? (
                        <img
                          src={getAssetUrl(formData.favicon_url)}
                          alt="Favicon"
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <Briefcase className="w-3.5 h-3.5 text-blue-600" />
                      )}
                    </div>
                    <span className="text-xs font-semibold text-slate-800 truncate max-w-[160px]">
                      {formData.site_name || 'CambodiaJobs'}
                    </span>
                    <X className="w-3 h-3 text-slate-400 shrink-0 ml-1" />
                  </div>
                </div>

                {/* Favicon Upload on PC Button */}
                <input
                  ref={faviconInputRef}
                  type="file"
                  accept=".ico,.png,.svg,.jpg"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFileUpload(file, 'favicon')
                    if (e.target) e.target.value = ''
                  }}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => faviconInputRef.current?.click()}
                  disabled={isUploadingFavicon}
                  className="w-full py-2 px-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer active:scale-98 disabled:opacity-50"
                >
                  <FolderOpen className="w-3.5 h-3.5 text-slate-500" />
                  <span>
                    {isUploadingFavicon
                      ? isKhmer
                        ? 'កំពុងបញ្ចូល...'
                        : 'Uploading...'
                      : isKhmer
                      ? 'ជ្រើសរើស Favicon ពី PC (Choose File on PC)'
                      : 'Choose Favicon File on PC'}
                  </span>
                </button>

                {/* Favicon URL Input with Attached Browse PC Button */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <div className="relative flex-1">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <LinkIcon className="w-3.5 h-3.5" />
                      </div>
                      <input
                        type="text"
                        value={formData.favicon_url || ''}
                        onChange={(e) => handleChange('favicon_url', e.target.value)}
                        placeholder="/media/site/favicon.ico or https://..."
                        className="w-full pl-9 pr-8 py-1.5 text-xs font-mono rounded-xl bg-slate-50/60 focus:bg-white border border-gray-200 focus:outline-none focus:border-blue-500 text-slate-700 shadow-2xs transition"
                      />
                      {formData.favicon_url && (
                        <button
                          type="button"
                          onClick={() => handleChange('favicon_url', null)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-500 cursor-pointer"
                          title="Clear URL"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => faviconInputRef.current?.click()}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1 shrink-0 transition cursor-pointer"
                      title={isKhmer ? 'ជ្រើសរើសពីកុំព្យូទ័រ' : 'Browse file on computer'}
                    >
                      <FolderOpen className="w-3.5 h-3.5 text-slate-500" />
                      <span className="hidden sm:inline">{isKhmer ? 'ជ្រើសរើស' : 'Browse'}</span>
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    .ico, .png, or .svg (32×32px recommended)
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: HOME PAGE HERO & CONTENT                          */}
        {/* ======================================================== */}
        {activeTab === 'homepage' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Live Interactive Hero Banner Preview */}
            <div className="bg-gradient-to-b from-blue-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-8 border border-slate-800 shadow-xl relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:24px_24px] opacity-20 pointer-events-none"></div>

              <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10 relative z-10">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-300 flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-blue-400" />
                  {isKhmer ? 'ការមើលសាកល្បងនៃទំព័រដើម (Live Hero Preview)' : 'Live Home Page Banner Preview'}
                </span>
                <span className="text-[11px] text-slate-300">
                  {isKhmer ? 'ទិដ្ឋភាពដែលអ្នកប្រើប្រាស់នឹងឃើញ' : 'Preview reflects your current edits'}
                </span>
              </div>

              <div className="max-w-3xl mx-auto text-center space-y-4 py-6 relative z-10">
                {/* Headline */}
                <h2 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight text-white">
                  {isKhmer
                    ? formData.hero_title_km || formData.hero_title
                    : formData.hero_title || 'Discover Verified Career Opportunities in Cambodia'}
                </h2>

                {/* Subtitle */}
                <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mx-auto leading-relaxed">
                  {isKhmer
                    ? formData.hero_subtitle_km || formData.hero_subtitle
                    : formData.hero_subtitle ||
                      'Connecting talented professionals with top verified companies across Phnom Penh and all 25 provinces.'}
                </p>
              </div>
            </div>

            {/* Inputs for Hero Banner Content */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-gray-200/90 shadow-2xs space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                  <Home className="w-4 h-4 text-blue-600" />
                  <span>{isKhmer ? 'កែសម្រួលអត្ថបទ Banner ទំព័រដើម' : 'Edit Hero Banner Content'}</span>
                </h3>
              </div>

              {/* Hero Title EN & KM */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span>{isKhmer ? 'ចំណងជើងធំលើ Banner (English)' : 'Hero Main Headline (English)'}</span>
                    <span className="text-[10px] text-slate-400 font-normal">🇬🇧 EN</span>
                  </label>
                  <input
                    type="text"
                    value={formData.hero_title}
                    onChange={(e) => handleChange('hero_title', e.target.value)}
                    placeholder="Discover Verified Career Opportunities in Cambodia"
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl bg-slate-50/60 focus:bg-white border border-gray-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition shadow-2xs"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span>{isKhmer ? 'ចំណងជើងធំលើ Banner (ភាសាខ្មែរ)' : 'Hero Main Headline (Khmer)'}</span>
                    <span className="text-[10px] text-slate-400 font-normal">🇰🇭 KM</span>
                  </label>
                  <input
                    type="text"
                    value={formData.hero_title_km}
                    onChange={(e) => handleChange('hero_title_km', e.target.value)}
                    placeholder="ស្វែងរកឱកាសការងារដែលបានផ្ទៀងផ្ទាត់នៅកម្ពុជា"
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl bg-slate-50/60 focus:bg-white border border-gray-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition shadow-2xs"
                  />
                </div>
              </div>

              {/* Hero Subtitle EN & KM */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span>{isKhmer ? 'អត្ថបទពន្យល់ខាងក្រោម (English)' : 'Hero Subtitle / Description (English)'}</span>
                    <span className="text-[10px] text-slate-400 font-normal">🇬🇧 EN</span>
                  </label>
                  <textarea
                    rows={3}
                    value={formData.hero_subtitle || ''}
                    onChange={(e) => handleChange('hero_subtitle', e.target.value)}
                    placeholder="Connecting talented professionals with top verified companies across Phnom Penh and all 25 provinces..."
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl bg-slate-50/60 focus:bg-white border border-gray-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition leading-relaxed shadow-2xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span>{isKhmer ? 'អត្ថបទពន្យល់ខាងក្រោម (ភាសាខ្មែរ)' : 'Hero Subtitle / Description (Khmer)'}</span>
                    <span className="text-[10px] text-slate-400 font-normal">🇰🇭 KM</span>
                  </label>
                  <textarea
                    rows={3}
                    value={formData.hero_subtitle_km || ''}
                    onChange={(e) => handleChange('hero_subtitle_km', e.target.value)}
                    placeholder="តភ្ជាប់បេក្ខជនឆ្នើមជាមួយក្រុមហ៊ុនដែលបានផ្ទៀងផ្ទាត់នៅរាជធានីភ្នំពេញ និងគ្រប់ខេត្តក្រុង..."
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl bg-slate-50/60 focus:bg-white border border-gray-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition leading-relaxed shadow-2xs"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: TOP ANNOUNCEMENT BAR                              */}
        {/* ======================================================== */}
        {activeTab === 'announcement' && (
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-gray-200/90 shadow-2xs space-y-6 animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                  <Megaphone className="w-4 h-4 text-blue-600" />
                  <span>{isKhmer ? 'របារជូនដំណឹងកំពូល (Top Announcement Bar)' : 'Top Announcement Bar'}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isKhmer
                    ? 'បង្ហាញសារជូនដំណឹង ឬការផ្សព្វផ្សាយពិសេសនៅផ្នែកខាងលើគេបង្អស់នៃគេហទំព័រ'
                    : 'Display an alert or promotional banner at the very top of all pages'}
                </p>
              </div>

              {/* Toggle Switch */}
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(formData.announcement_enabled)}
                  onChange={(e) => handleChange('announcement_enabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                <span className="ml-3 text-xs font-bold text-slate-700">
                  {formData.announcement_enabled
                    ? isKhmer
                      ? 'បើកដំណើរការ (Active)'
                      : 'Enabled'
                    : isKhmer
                    ? 'បិទ (Disabled)'
                    : 'Disabled'}
                </span>
              </label>
            </div>

            {/* Live Banner Preview */}
            {formData.announcement_enabled && (
              <div className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl flex items-center justify-between px-4 text-xs font-semibold shadow-sm">
                <span className="flex items-center gap-2 truncate">
                  <Megaphone className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">
                    {isKhmer
                      ? formData.announcement_text_km || formData.announcement_text || 'សារជូនដំណឹងសាកល្បង...'
                      : formData.announcement_text || 'Sample announcement message...'}
                  </span>
                </span>
                {formData.announcement_url && (
                  <span className="underline ml-2 shrink-0 flex items-center gap-1">
                    <span>{isKhmer ? 'ស្វែងយល់បន្ថែម' : 'Learn more'}</span>
                    <ExternalLink className="w-3 h-3" />
                  </span>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>{isKhmer ? 'ខ្លឹមសារសារជូនដំណឹង (English)' : 'Announcement Message (English)'}</span>
                  <span className="text-[10px] text-slate-400 font-normal">🇬🇧 EN</span>
                </label>
                <input
                  type="text"
                  value={formData.announcement_text || ''}
                  onChange={(e) => handleChange('announcement_text', e.target.value)}
                  placeholder="🚀 Join Cambodia's Biggest Career Fair 2026!"
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl bg-slate-50/60 focus:bg-white border border-gray-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition shadow-2xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>{isKhmer ? 'ខ្លឹមសារសារជូនដំណឹង (ភាសាខ្មែរ)' : 'Announcement Message (Khmer)'}</span>
                  <span className="text-[10px] text-slate-400 font-normal">🇰🇭 KM</span>
                </label>
                <input
                  type="text"
                  value={formData.announcement_text_km || ''}
                  onChange={(e) => handleChange('announcement_text_km', e.target.value)}
                  placeholder="🚀 ចូលរួមពិព័រណ៍ការងារធំបំផុតប្រចាំឆ្នាំ ២០២៦!"
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl bg-slate-50/60 focus:bg-white border border-gray-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition shadow-2xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                {isKhmer ? 'តំណភ្ជាប់ចុចលើសារ (Target Link URL)' : 'Target Link URL (Optional)'}
              </label>
              <input
                type="text"
                value={formData.announcement_url || ''}
                onChange={(e) => handleChange('announcement_url', e.target.value)}
                placeholder="/jobs or https://..."
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl bg-slate-50/60 focus:bg-white border border-gray-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition font-mono text-slate-700 shadow-2xs"
              />
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 4: CONTACT & SOCIAL LINKS                            */}
        {/* ======================================================== */}
        {activeTab === 'contact' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in duration-150">
            {/* Contact Details */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-gray-200/90 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-blue-600" />
                  <span>{isKhmer ? 'ព័ត៌មានទំនាក់ទំនងជំនួយការ' : 'Contact & Support Information'}</span>
                </h3>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  {isKhmer ? 'អ៊ីមែលជំនួយការ (Support Email)' : 'Support Email'}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => handleChange('contact_email', e.target.value)}
                    placeholder="support@cambodiajobs.kh"
                    className="w-full text-xs sm:text-sm pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-50/60 focus:bg-white border border-gray-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition shadow-2xs"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  {isKhmer ? 'លេខទូរស័ព្ទទាក់ទង (Contact Phone)' : 'Contact Phone'}
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={formData.contact_phone}
                    onChange={(e) => handleChange('contact_phone', e.target.value)}
                    placeholder="+855 23 999 888"
                    className="w-full text-xs sm:text-sm pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-50/60 focus:bg-white border border-gray-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition shadow-2xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>{isKhmer ? 'អាសយដ្ឋានការិយាល័យ (English)' : 'Physical Address (English)'}</span>
                  <span className="text-[10px] text-slate-400 font-normal">🇬🇧 EN</span>
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={formData.contact_address}
                    onChange={(e) => handleChange('contact_address', e.target.value)}
                    placeholder="Phnom Penh, Cambodia"
                    className="w-full text-xs sm:text-sm pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-50/60 focus:bg-white border border-gray-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition shadow-2xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>{isKhmer ? 'អាសយដ្ឋានការិយាល័យ (ភាសាខ្មែរ)' : 'Physical Address (Khmer)'}</span>
                  <span className="text-[10px] text-slate-400 font-normal">🇰🇭 KM</span>
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={formData.contact_address_km}
                    onChange={(e) => handleChange('contact_address_km', e.target.value)}
                    placeholder="រាជធានីភ្នំពេញ, ប្រទេសកម្ពុជា"
                    className="w-full text-xs sm:text-sm pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-50/60 focus:bg-white border border-gray-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition shadow-2xs"
                  />
                </div>
              </div>

              {/* Footer text */}
              <div className="pt-2 border-t border-slate-100 space-y-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span>{isKhmer ? 'អត្ថបទសង្ខេបខាងក្រោម Footer (English)' : 'Footer Tagline / Text (English)'}</span>
                    <span className="text-[10px] text-slate-400 font-normal">🇬🇧 EN</span>
                  </label>
                  <textarea
                    rows={2}
                    value={formData.footer_text || ''}
                    onChange={(e) => handleChange('footer_text', e.target.value)}
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl bg-slate-50/60 focus:bg-white border border-gray-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition shadow-2xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span>{isKhmer ? 'អត្ថបទសង្ខេបខាងក្រោម Footer (ភាសាខ្មែរ)' : 'Footer Tagline / Text (Khmer)'}</span>
                    <span className="text-[10px] text-slate-400 font-normal">🇰🇭 KM</span>
                  </label>
                  <textarea
                    rows={2}
                    value={formData.footer_text_km || ''}
                    onChange={(e) => handleChange('footer_text_km', e.target.value)}
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl bg-slate-50/60 focus:bg-white border border-gray-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition shadow-2xs"
                  />
                </div>
              </div>
            </div>

            {/* Social Media Links */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-gray-200/90 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-blue-600" />
                  <span>{isKhmer ? 'បណ្តាញទំនាក់ទំនងសង្គម' : 'Social Media Links'}</span>
                </h3>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Facebook Page URL</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="url"
                    value={formData.social_facebook || ''}
                    onChange={(e) => handleChange('social_facebook', e.target.value)}
                    placeholder="https://facebook.com/cambodiajobs"
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl bg-slate-50/60 focus:bg-white border border-gray-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition font-mono text-slate-700 shadow-2xs"
                  />
                  {formData.social_facebook && (
                    <a
                      href={formData.social_facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition shrink-0"
                      title="Open link"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Telegram Support Bot URL</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="url"
                    value={formData.social_telegram || ''}
                    onChange={(e) => handleChange('social_telegram', e.target.value)}
                    placeholder="https://t.me/CambodiaJobSupportBot"
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl bg-slate-50/60 focus:bg-white border border-gray-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition font-mono text-slate-700 shadow-2xs"
                  />
                  {formData.social_telegram && (
                    <a
                      href={formData.social_telegram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition shrink-0"
                      title="Open link"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">LinkedIn Profile / Page URL</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="url"
                    value={formData.social_linkedin || ''}
                    onChange={(e) => handleChange('social_linkedin', e.target.value)}
                    placeholder="https://linkedin.com/company/cambodiajobs"
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl bg-slate-50/60 focus:bg-white border border-gray-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition font-mono text-slate-700 shadow-2xs"
                  />
                  {formData.social_linkedin && (
                    <a
                      href={formData.social_linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition shrink-0"
                      title="Open link"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Twitter / X URL</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="url"
                    value={formData.social_twitter || ''}
                    onChange={(e) => handleChange('social_twitter', e.target.value)}
                    placeholder="https://x.com/cambodiajobs"
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl bg-slate-50/60 focus:bg-white border border-gray-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition font-mono text-slate-700 shadow-2xs"
                  />
                  {formData.social_twitter && (
                    <a
                      href={formData.social_twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition shrink-0"
                      title="Open link"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Save Bar */}
        <div className="mt-8 pt-5 border-t border-slate-200/80 flex items-center justify-between">
          <button
            type="button"
            onClick={fetchSettings}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 text-xs sm:text-sm font-semibold transition cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{isKhmer ? 'កំណត់ឡើងវិញ' : 'Reset to Saved'}</span>
          </button>

          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-500/25 transition active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>
              {isSaving
                ? isKhmer
                  ? 'កំពុងរក្សាទុក...'
                  : 'Saving Changes...'
                : isKhmer
                ? 'រក្សាទុកការកែប្រែទាំងអស់'
                : 'Save All Changes'}
            </span>
          </button>
        </div>
      </form>
    </div>
  )
}
