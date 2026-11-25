import React, { useEffect, useState, useRef, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { adminService } from '../../services/admin.service'
import { useToast, useSiteSettings } from '../../app/providers'
import { getAssetUrl } from '../../utils/assets'
import { SiteSettings } from '../../types'
import { AdminPageHeader } from '../../components/layout/dashboard'
import {
  Settings,
  Globe,
  Home,
  Megaphone,
  Share2,
  Upload,
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
  FolderOpen,
  X,
  Link2,
  Type,
  FileText,
  Send,
  CheckCircle2,
  AlertCircle,
  Search,
} from 'lucide-react'

const INITIAL_SETTINGS: SiteSettings = {
  site_name: 'CambodiaJobs',
  site_name_km: 'ការងារកម្ពុជា',
  site_title: "CambodiaJobs | Cambodia's #1 Job Search & Recruitment Platform",
  site_title_km: 'វេទិកាការងារ និងជ្រើសរើសបុគ្គលិកឈានមុខគេនៅកម្ពុជា',
  site_subtitle: 'Find your dream career or hire top talent across Cambodia',
  site_subtitle_km: 'ស្វែងរកការងារក្នុងក្តីស្រមៃ ឬជ្រើសរើសបុគ្គលិកឆ្នើមទូទាំងប្រទេសកម្ពុជា',
  site_description: '',
  site_description_km: '',
  logo_url: null,
  favicon_url: null,
  hero_title: 'Discover Verified Career Opportunities in Cambodia',
  hero_title_km: 'ស្វែងរកឱកាសការងារដែលបានផ្ទៀងផ្ទាត់នៅកម្ពុជា',
  hero_subtitle:
    'Connecting talented professionals with top verified companies across Phnom Penh and all 25 provinces.',
  hero_subtitle_km:
    'តភ្ជាប់បេក្ខជនឆ្នើមជាមួយក្រុមហ៊ុនដែលបានផ្ទៀងផ្ទាត់នៅរាជធានីភ្នំពេញ និងគ្រប់ខេត្តក្រុង។',
  hero_badge_text: '#1 Job Platform in Cambodia',
  hero_badge_text_km: 'វេទិកាការងារលេខ ១ នៅកម្ពុជា',
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
}

interface FieldWrapperProps {
  label: string
  required?: boolean
  hint?: string
  children: React.ReactNode
}

const FieldWrapper: React.FC<FieldWrapperProps> = ({
  label,
  required,
  hint,
  children,
}) => (
  <div className="space-y-1.5">
    <div className="flex items-center justify-between gap-2">
      <label className="text-xs font-bold text-slate-700 tracking-tight flex items-center gap-1">
        <span>{label}</span>
        {required && <span className="text-rose-500 font-bold">*</span>}
      </label>
    </div>
    {children}
    {hint && <p className="text-[11px] text-slate-400 leading-relaxed">{hint}</p>}
  </div>
)

interface StyledInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  hint?: string
  leftIcon?: React.ReactNode
  rightAction?: React.ReactNode
}

const StyledInput: React.FC<StyledInputProps> = ({
  label,
  hint,
  leftIcon,
  rightAction,
  required,
  className = '',
  ...props
}) => (
  <FieldWrapper label={label} required={required} hint={hint}>
    <div className="relative flex items-center group">
      {leftIcon && (
        <span className="absolute left-3.5 text-slate-400 group-focus-within:text-blue-600 transition-colors pointer-events-none flex items-center">
          {leftIcon}
        </span>
      )}
      <input
        required={required}
        className={`w-full min-h-[42px] text-xs sm:text-sm py-2.5 rounded-xl bg-slate-50/75 hover:bg-slate-50 focus:bg-white border border-slate-200/90 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 text-slate-800 placeholder:text-slate-400 font-medium outline-none transition-all duration-150 shadow-2xs ${
          leftIcon ? 'pl-10' : 'px-3.5'
        } ${rightAction ? 'pr-11' : 'pr-3.5'} ${className}`}
        {...props}
      />
      {rightAction && <div className="absolute right-1.5 flex items-center">{rightAction}</div>}
    </div>
  </FieldWrapper>
)

interface StyledTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  hint?: string
}

const StyledTextarea: React.FC<StyledTextareaProps> = ({
  label,
  hint,
  required,
  className = '',
  ...props
}) => (
  <FieldWrapper label={label} required={required} hint={hint}>
    <textarea
      required={required}
      className={`w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl bg-slate-50/75 hover:bg-slate-50 focus:bg-white border border-slate-200/90 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 text-slate-800 placeholder:text-slate-400 font-medium outline-none transition-all duration-150 leading-relaxed resize-y shadow-2xs ${className}`}
      {...props}
    />
  </FieldWrapper>
)

export const AdminSettingsPage: React.FC = () => {
  const { i18n } = useTranslation()
  const isKhmer = i18n.language === 'km'
  const { toast } = useToast()
  const { updateLocalSettings, refreshSettings } = useSiteSettings()

  const [activeTab, setActiveTab] = useState<'branding' | 'homepage' | 'announcement' | 'contact'>(
    'branding'
  )
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)
  const [isDragOverLogo, setIsDragOverLogo] = useState(false)
  const logoInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState<SiteSettings>(INITIAL_SETTINGS)
  const [savedSnapshot, setSavedSnapshot] = useState<string>(JSON.stringify(INITIAL_SETTINGS))

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    setIsLoading(true)
    try {
      const data = await adminService.getSettings()
      if (data) {
        const normalized: SiteSettings = {
          ...INITIAL_SETTINGS,
          ...data,
          announcement_enabled: Boolean(data.announcement_enabled),
        }
        setFormData(normalized)
        setSavedSnapshot(JSON.stringify(normalized))
      }
    } catch (err) {
      console.error('Failed to load site settings:', err)
      toast.error(
        isKhmer ? 'មិនអាចទាញយកការកំណត់បានទេ' : 'Failed to load settings',
        isKhmer ? 'សូមពិនិត្យការតភ្ជាប់ ហើយព្យាយាមម្តងទៀត' : 'Please check your connection and try again'
      )
    } finally {
      setIsLoading(false)
    }
  }

  const hasUnsavedChanges = useMemo(
    () => JSON.stringify(formData) !== savedSnapshot,
    [formData, savedSnapshot]
  )

  const handleChange = (field: keyof SiteSettings, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleFileUpload = async (file: File) => {
    if (!file) return
    setIsUploadingLogo(true)
    try {
      const res = await adminService.uploadLogo(file, 'logo')
      if (res && res.url) {
        const next: SiteSettings = {
          ...formData,
          logo_url: res.url,
          favicon_url: res.url,
        }
        setFormData(next)
        await adminService.updateSettings({ logo_url: res.url, favicon_url: res.url })
        setSavedSnapshot(JSON.stringify(next))
        await refreshSettings()
        toast.success(
          isKhmer ? 'បានផ្ទុកឡើងរូបសញ្ញាជោគជ័យ' : 'Logo & Favicon Updated',
          isKhmer ? 'រូបភាពត្រូវបានរក្សាទុកភ្លាមៗ' : 'Your brand logo and favicon have been saved.'
        )
      }
    } catch (err: any) {
      console.error('Failed to upload logo:', err)
      toast.error(
        isKhmer ? 'បរាជ័យក្នុងការបញ្ចូលរូបភាព' : 'Failed to upload logo',
        err?.response?.data?.details?.file ||
          err?.response?.data?.error ||
          (isKhmer ? 'មិនអាចផ្ទុកឡើងឯកសារបានទេ' : 'Error uploading file from device')
      )
    } finally {
      setIsUploadingLogo(false)
    }
  }

  const handleRemoveImage = async () => {
    const prevLogo = formData.logo_url
    const prevFavicon = formData.favicon_url
    const next: SiteSettings = {
      ...formData,
      logo_url: null,
      favicon_url: null,
    }
    setFormData(next)

    try {
      const res = await adminService.updateSettings({ logo_url: null, favicon_url: null })
      if (res?.data) updateLocalSettings(res.data)
      setSavedSnapshot(JSON.stringify(next))
      await refreshSettings()
      toast.success(
        isKhmer ? 'បានដករូបសញ្ញាចេញ' : 'Logo Removed',
        isKhmer ? 'រូបសញ្ញា និង Favicon ត្រូវបានដកចេញដោយជោគជ័យ' : 'Logo & Favicon removed successfully.'
      )
    } catch (err: any) {
      setFormData((prev) => ({
        ...prev,
        logo_url: prevLogo,
        favicon_url: prevFavicon,
      }))
      toast.error(
        isKhmer ? 'បរាជ័យ' : 'Remove Failed',
        err?.response?.data?.message || (isKhmer ? 'មិនអាចដករូបភាពបានទេ' : 'Could not remove the image.')
      )
    }
  }

  const getBrowserTabTitlePreview = () => {
    const currentTitle = isKhmer
      ? formData.site_title_km || formData.site_title
      : formData.site_title
    const currentName = isKhmer ? formData.site_name_km || formData.site_name : formData.site_name
    if (!currentTitle) return currentName || 'CambodiaJobs'
    if (currentName && currentTitle.toLowerCase().includes(currentName.toLowerCase())) {
      return currentTitle
    }
    return `${currentName || 'CambodiaJobs'} | ${currentTitle}`
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setIsSaving(true)
    try {
      const res = await adminService.updateSettings(formData)
      if (res && res.data) {
        const updated: SiteSettings = {
          ...INITIAL_SETTINGS,
          ...res.data,
          announcement_enabled: Boolean(res.data.announcement_enabled),
        }
        setFormData(updated)
        setSavedSnapshot(JSON.stringify(updated))
        updateLocalSettings(res.data)
        await refreshSettings()
      }
      toast.success(
        isKhmer ? 'បានរក្សាទុកការកំណត់គេហទំព័រ' : 'Settings Saved',
        isKhmer
          ? 'ព័ត៌មាន និងខ្លឹមសារគេហទំព័រត្រូវបានធ្វើបច្ចុប្បន្នភាពភ្លាមៗ'
          : 'Website branding and platform configuration updated successfully.'
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
        <p className="text-xs sm:text-sm text-slate-500 font-medium">
          {isKhmer ? 'កំពុងផ្ទុកការកំណត់ប្រព័ន្ធ...' : 'Loading site settings...'}
        </p>
      </div>
    )
  }

  const tabs = [
    {
      id: 'branding' as const,
      icon: Globe,
      label: isKhmer ? 'ម៉ាកសញ្ញា & អត្តសញ្ញាណ' : 'Branding & Identity',
      desc: isKhmer ? 'Logo និងឈ្មោះគេហទំព័រ' : 'Logo & site identity',
    },
    {
      id: 'homepage' as const,
      icon: Home,
      label: isKhmer ? 'ខ្លឹមសារទំព័រដើម' : 'Home Page Hero',
      desc: isKhmer ? 'Banner និងពាក្យស្វាគមន៍' : 'Hero banner & copy',
    },
    {
      id: 'announcement' as const,
      icon: Megaphone,
      label: isKhmer ? 'របារជូនដំណឹងកំពូល' : 'Top Announcement',
      desc: isKhmer ? 'សារផ្សព្វផ្សាយពិសេស' : 'Global alert banner',
      badge: formData.announcement_enabled
        ? isKhmer
          ? 'សកម្ម'
          : 'Active'
        : undefined,
    },
    {
      id: 'contact' as const,
      icon: Share2,
      label: isKhmer ? 'ទំនាក់ទំនង & បណ្តាញសង្គម' : 'Contact & Social',
      desc: isKhmer ? 'អ៊ីមែល ទូរស័ព្ទ និង Footer' : 'Support & social links',
    },
  ]

  const renderOpenExternalBtn = (url?: string | null) =>
    url ? (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        title={isKhmer ? 'បើកតំណភ្ជាប់' : 'Open link'}
        className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition"
      >
        <ExternalLink className="w-3.5 h-3.5" />
      </a>
    ) : null

  return (
    <div className="w-full space-y-4 sm:space-y-5 font-sans pb-16">
      {/* 1. Header Bar */}
      <AdminPageHeader
        title={isKhmer ? 'ការកំណត់គេហទំព័រ & ម៉ាកសញ្ញា' : 'Website Settings & Branding'}
        subtitle={
          isKhmer
            ? 'កែសម្រួលម៉ាកសញ្ញា រូបសញ្ញា ចំណងជើងទំព័រដើម របារជូនដំណឹង និងព័ត៌មានទំនាក់ទំនង'
            : 'Configure website identity, logos, landing page hero content, and organization contacts'
        }
        badge={{
          icon: Settings,
          text: isKhmer ? 'ការកំណត់ប្រព័ន្ធ' : 'System Config',
        }}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {hasUnsavedChanges && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-bold">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                <span>{isKhmer ? 'មានការផ្លាស់ប្តូរថ្មី' : 'Unsaved changes'}</span>
              </span>
            )}

            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:text-blue-600 text-xs font-semibold shadow-2xs transition cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 text-slate-400" />
              <span>{isKhmer ? 'មើលគេហទំព័រផ្ទាល់' : 'Live Site'}</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>

            <button
              type="button"
              onClick={() => handleSubmit()}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition cursor-pointer active:scale-95 disabled:opacity-50"
            >
              {isSaving ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
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
        }
      />

      {/* 2. Sleek Segmented Tab Bar */}
      <div className="bg-slate-100/90 dark:bg-slate-800/80 p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 grid grid-cols-2 lg:grid-cols-4 gap-1.5">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`h-10 px-3 rounded-xl flex items-center justify-center gap-2 text-xs font-semibold transition-all duration-150 cursor-pointer ${
                isActive
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs border border-slate-200/80 dark:border-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-700/50 border border-transparent'
              }`}
              title={tab.desc}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{tab.label}</span>
              {tab.badge && (
                <span
                  className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 animate-pulse"
                  title={tab.badge}
                />
              )}
            </button>
          )
        })}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* ======================================================== */}
        {/* TAB 1: BRANDING & IDENTITY                               */}
        {/* ======================================================== */}
        {activeTab === 'branding' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 animate-in fade-in duration-150">
            {/* Left 8 Cols: General Platform Identity */}
            <div className="lg:col-span-8 space-y-5">
              <div className="glass-card bg-white/95 rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-sm space-y-6">
                <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 border border-blue-200/70 flex items-center justify-center shrink-0">
                      <Globe className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-slate-900">
                        {isKhmer ? 'អត្តសញ្ញាណ និងចំណងជើងគេហទំព័រ' : 'Site Identity & Metadata'}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {isKhmer
                          ? 'កំណត់ឈ្មោះម៉ាកសញ្ញា ចំណងជើង Browser និងការពិពណ៌នាសម្រាប់ទាំងភាសាអង់គ្លេស និងខ្មែរ'
                          : 'Manage bilingual site names, browser tab titles, and search descriptions'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Group 1: Site Name */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <StyledInput
                    label={isKhmer ? 'ឈ្មោះគេហទំព័រ (អង់គ្លេស)' : 'Platform Name (English)'}
                    required
                    leftIcon={<Type className="w-4 h-4" />}
                    value={formData.site_name}
                    onChange={(e) => handleChange('site_name', e.target.value)}
                    placeholder="CambodiaJobs"
                    hint={isKhmer ? 'បង្ហាញលើ Navbar និង Footer' : 'Shown in the navbar logo and footer'}
                  />

                  <StyledInput
                    label={isKhmer ? 'ឈ្មោះគេហទំព័រ (ខ្មែរ)' : 'Platform Name (Khmer)'}
                    leftIcon={<Type className="w-4 h-4" />}
                    value={formData.site_name_km}
                    onChange={(e) => handleChange('site_name_km', e.target.value)}
                    placeholder="ការងារកម្ពុជា"
                    hint={isKhmer ? 'បង្ហាញពេលប្រើភាសាខ្មែរ' : 'Displayed when Khmer language is active'}
                  />
                </div>

                {/* Group 2: Browser Tab Title */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                  <StyledInput
                    label={isKhmer ? 'ចំណងជើង Browser Tab (អង់គ្លេស)' : 'Browser Tab Title (English)'}
                    required
                    leftIcon={<Globe className="w-4 h-4" />}
                    value={formData.site_title}
                    onChange={(e) => handleChange('site_title', e.target.value)}
                    placeholder="CambodiaJobs | #1 Job Search Platform"
                  />

                  <StyledInput
                    label={isKhmer ? 'ចំណងជើង Browser Tab (ខ្មែរ)' : 'Browser Tab Title (Khmer)'}
                    leftIcon={<Globe className="w-4 h-4" />}
                    value={formData.site_title_km}
                    onChange={(e) => handleChange('site_title_km', e.target.value)}
                    placeholder="វេទិកាការងារឈានមុខគេនៅកម្ពុជា"
                  />
                </div>

                {/* Group 3: Tagline / Slogan */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                  <StyledInput
                    label={isKhmer ? 'ពាក្យស្លោក (អង់គ្លេស)' : 'Tagline / Slogan (English)'}
                    leftIcon={<Sparkles className="w-4 h-4" />}
                    value={formData.site_subtitle}
                    onChange={(e) => handleChange('site_subtitle', e.target.value)}
                    placeholder="Find your dream career in Cambodia"
                  />

                  <StyledInput
                    label={isKhmer ? 'ពាក្យស្លោក (ខ្មែរ)' : 'Tagline / Slogan (Khmer)'}
                    leftIcon={<Sparkles className="w-4 h-4" />}
                    value={formData.site_subtitle_km}
                    onChange={(e) => handleChange('site_subtitle_km', e.target.value)}
                    placeholder="ស្វែងរកការងារក្នុងក្តីស្រមៃនៅកម្ពុជា"
                  />
                </div>

                {/* Group 4: Meta / SEO Description */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                  <StyledTextarea
                    label={isKhmer ? 'ការពិពណ៌នាគេហទំព័រ SEO (អង់គ្លេស)' : 'SEO Description (English)'}
                    rows={3}
                    value={formData.site_description || ''}
                    onChange={(e) => handleChange('site_description', e.target.value)}
                    placeholder="Explore thousands of verified career opportunities across Cambodia..."
                    hint={
                      isKhmer
                        ? 'ប្រើសម្រាប់ Search Engine និងការចែករំលែកតំណ'
                        : 'Used for search engine snippets and link previews'
                    }
                  />

                  <StyledTextarea
                    label={isKhmer ? 'ការពិពណ៌នាគេហទំព័រ SEO (ខ្មែរ)' : 'SEO Description (Khmer)'}
                    rows={3}
                    value={formData.site_description_km || ''}
                    onChange={(e) => handleChange('site_description_km', e.target.value)}
                    placeholder="ស្វែងរកឱកាសការងាររាប់ពាន់កន្លែងដែលមានការផ្ទៀងផ្ទាត់ត្រឹមត្រូវនៅកម្ពុជា..."
                    hint={
                      isKhmer
                        ? 'ការពិពណ៌នាសម្រាប់ការស្វែងរកជាភាសាខ្មែរ'
                        : 'Khmer summary shown on social shares & search results'
                    }
                  />
                </div>
              </div>
            </div>

            {/* Right 4 Cols: Logo, Favicon & Live Brand Previews */}
            <div className="lg:col-span-4 space-y-5">
              <div className="glass-card bg-white/95 rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-sm space-y-5">
                <div className="flex items-center gap-3 pb-3.5 border-b border-slate-100">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200/70 flex items-center justify-center shrink-0">
                    <ImageIcon className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      {isKhmer ? 'រូបសញ្ញា Logo & Favicon' : 'Brand Logo & Favicon'}
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {isKhmer
                        ? 'រូបភាពសម្រាប់ Header និង Browser Tab'
                        : 'Displayed in top navbar & browser tabs'}
                    </p>
                  </div>
                </div>

                {/* Upload Dropzone */}
                {formData.logo_url ? (
                  <div className="space-y-3">
                    <div className="h-36 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100/70 p-4 flex items-center justify-center relative overflow-hidden group">
                      <img
                        src={getAssetUrl(formData.logo_url)}
                        alt="Website Logo"
                        className="max-h-24 max-w-[220px] object-contain transition-transform duration-200 group-hover:scale-105"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => logoInputRef.current?.click()}
                        disabled={isUploadingLogo}
                        className="flex-1 py-2.5 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-60"
                      >
                        <FolderOpen className="w-3.5 h-3.5" />
                        <span>
                          {isUploadingLogo
                            ? isKhmer
                              ? 'កំពុងផ្ទុក...'
                              : 'Uploading...'
                            : isKhmer
                            ? 'ប្តូររូបភាព'
                            : 'Replace Logo'}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="py-2.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-bold flex items-center justify-center gap-1 transition cursor-pointer"
                        title={isKhmer ? 'លុបរូបភាពចេញ' : 'Remove image'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{isKhmer ? 'ដកចេញ' : 'Remove'}</span>
                      </button>
                    </div>
                  </div>
                ) : (
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
                      if (file) handleFileUpload(file)
                    }}
                    onClick={() => logoInputRef.current?.click()}
                    className={`h-40 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-4 transition-all cursor-pointer group ${
                      isDragOverLogo
                        ? 'border-blue-500 bg-blue-50/80'
                        : 'border-slate-200 hover:border-blue-400 bg-slate-50/60 hover:bg-blue-50/30'
                    }`}
                  >
                    <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center mb-2.5 group-hover:scale-105 transition shadow-2xs">
                      <Upload className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-bold text-slate-700 text-center">
                      {isKhmer ? 'ទាញដាក់ ឬចុចជ្រើសរូបភាព' : 'Drop image or click to upload'}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1 text-center">
                      {isKhmer ? 'PNG, SVG, JPG, WEBP (អតិបរមា 5MB)' : 'PNG, SVG, JPG, WEBP (Max 5MB)'}
                    </p>
                  </div>
                )}

                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*,.ico"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFileUpload(file)
                    if (e.target) e.target.value = ''
                  }}
                  className="hidden"
                />

                {/* Live Navbar Preview */}
                <div className="pt-4 border-t border-slate-100 space-y-2">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    {isKhmer ? 'គំរូ Navbar គេហទំព័រ' : 'Navbar Brand Preview'}
                  </span>
                  <div className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 flex items-center justify-between shadow-2xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0 overflow-hidden">
                        {formData.logo_url ? (
                          <img
                            src={getAssetUrl(formData.logo_url)}
                            alt="Brand"
                            className="w-full h-full object-contain p-0.5"
                          />
                        ) : (
                          <Briefcase className="w-4 h-4 text-blue-600" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-extrabold text-slate-900 truncate">
                          {isKhmer ? formData.site_name_km || formData.site_name : formData.site_name}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate">
                          {isKhmer
                            ? formData.site_subtitle_km || formData.site_subtitle
                            : formData.site_subtitle}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Live Browser Tab Preview */}
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    {isKhmer ? 'គំរូ Browser Tab' : 'Browser Tab Preview'}
                  </span>
                  <div className="bg-slate-100/90 p-2 rounded-xl border border-slate-200/70">
                    <div className="inline-flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs max-w-full">
                      <div className="w-4 h-4 rounded shrink-0 overflow-hidden flex items-center justify-center">
                        {formData.favicon_url || formData.logo_url ? (
                          <img
                            src={getAssetUrl(formData.favicon_url || formData.logo_url)}
                            alt="Favicon"
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <Briefcase className="w-3.5 h-3.5 text-blue-600" />
                        )}
                      </div>
                      <span className="text-xs font-semibold text-slate-800 truncate max-w-[190px]">
                        {getBrowserTabTitlePreview()}
                      </span>
                      <X className="w-3 h-3 text-slate-300 shrink-0 ml-1" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: HOME PAGE HERO & CONTENT                          */}
        {/* ======================================================== */}
        {activeTab === 'homepage' && (
          <div className="space-y-5 animate-in fade-in duration-150">
            {/* Live Interactive Hero Banner Preview */}
            <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-lg relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(#60a5fa_1px,transparent_1px)] [background-size:22px_22px] opacity-15 pointer-events-none" />

              <div className="flex items-center justify-between mb-5 pb-3 border-b border-white/10 relative z-10">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-300 flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-blue-400" />
                  <span>{isKhmer ? 'ការមើលសាកល្បងទំព័រដើម' : 'Live Hero Banner Preview'}</span>
                </span>
                <span className="text-[11px] text-slate-300">
                  {isKhmer ? 'បង្ហាញតាមភាសាដែលកំពុងជ្រើសរើស' : 'Live preview for active language'}
                </span>
              </div>

              <div className="max-w-3xl mx-auto text-center space-y-4 py-4 relative z-10">
                {(isKhmer ? formData.hero_badge_text_km || formData.hero_badge_text : formData.hero_badge_text) && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-blue-200 text-xs font-semibold backdrop-blur-md">
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>
                      {isKhmer
                        ? formData.hero_badge_text_km || formData.hero_badge_text
                        : formData.hero_badge_text}
                    </span>
                  </span>
                )}

                <h2 className="text-xl sm:text-3xl font-extrabold tracking-tight leading-snug text-white">
                  {isKhmer
                    ? formData.hero_title_km || formData.hero_title
                    : formData.hero_title || 'Discover Verified Career Opportunities in Cambodia'}
                </h2>

                <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mx-auto leading-relaxed">
                  {isKhmer
                    ? formData.hero_subtitle_km || formData.hero_subtitle
                    : formData.hero_subtitle ||
                      'Connecting talented professionals with top verified companies across Phnom Penh and all 25 provinces.'}
                </p>

                {/* Decorative Search Bar Mockup */}
                <div className="max-w-md mx-auto pt-2">
                  <div className="flex items-center gap-2 bg-white/10 border border-white/20 rounded-xl px-3.5 py-2 text-left text-xs text-slate-300 backdrop-blur-md">
                    <Search className="w-3.5 h-3.5 text-blue-300 shrink-0" />
                    <span className="truncate opacity-80">
                      {isKhmer ? 'ស្វែងរកការងារ ជំនាញ ឬក្រុមហ៊ុន...' : 'Search job titles, skills, or companies...'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Hero Form Card */}
            <div className="glass-card bg-white/95 rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-sm space-y-5">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 border border-blue-200/70 flex items-center justify-center shrink-0">
                  <Home className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">
                    {isKhmer ? 'កែសម្រួលអត្ថបទ Banner ទំព័រដើម' : 'Hero Section Content'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {isKhmer
                      ? 'កែសម្រួលស្លាកខាងលើ ចំណងជើងធំ និងអត្ថបទណែនាំលើទំព័រដំបូង'
                      : 'Customize the top badge, main headline, and value proposition on the home page'}
                  </p>
                </div>
              </div>

              {/* Hero Badge EN & KM */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <StyledInput
                  label={isKhmer ? 'ស្លាកសម្គាល់ខាងលើ Banner (អង់គ្លេស)' : 'Hero Top Badge Text (English)'}
                  leftIcon={<Sparkles className="w-4 h-4" />}
                  value={formData.hero_badge_text || ''}
                  onChange={(e) => handleChange('hero_badge_text', e.target.value)}
                  placeholder="#1 Job Platform in Cambodia"
                />

                <StyledInput
                  label={isKhmer ? 'ស្លាកសម្គាល់ខាងលើ Banner (ខ្មែរ)' : 'Hero Top Badge Text (Khmer)'}
                  leftIcon={<Sparkles className="w-4 h-4" />}
                  value={formData.hero_badge_text_km || ''}
                  onChange={(e) => handleChange('hero_badge_text_km', e.target.value)}
                  placeholder="វេទិកាការងារលេខ ១ នៅកម្ពុជា"
                />
              </div>

              {/* Hero Headline EN & KM */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                <StyledInput
                  label={isKhmer ? 'ចំណងជើងធំលើ Banner (អង់គ្លេស)' : 'Hero Main Headline (English)'}
                  required
                  leftIcon={<Type className="w-4 h-4" />}
                  value={formData.hero_title}
                  onChange={(e) => handleChange('hero_title', e.target.value)}
                  placeholder="Discover Verified Career Opportunities in Cambodia"
                />

                <StyledInput
                  label={isKhmer ? 'ចំណងជើងធំលើ Banner (ខ្មែរ)' : 'Hero Main Headline (Khmer)'}
                  leftIcon={<Type className="w-4 h-4" />}
                  value={formData.hero_title_km}
                  onChange={(e) => handleChange('hero_title_km', e.target.value)}
                  placeholder="ស្វែងរកឱកាសការងារដែលបានផ្ទៀងផ្ទាត់នៅកម្ពុជា"
                />
              </div>

              {/* Hero Subtitle EN & KM */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                <StyledTextarea
                  label={isKhmer ? 'អត្ថបទពន្យល់ខាងក្រោម (អង់គ្លេស)' : 'Hero Subtitle (English)'}
                  rows={3}
                  value={formData.hero_subtitle || ''}
                  onChange={(e) => handleChange('hero_subtitle', e.target.value)}
                  placeholder="Connecting talented professionals with top verified companies across Phnom Penh and all 25 provinces..."
                />

                <StyledTextarea
                  label={isKhmer ? 'អត្ថបទពន្យល់ខាងក្រោម (ខ្មែរ)' : 'Hero Subtitle (Khmer)'}
                  rows={3}
                  value={formData.hero_subtitle_km || ''}
                  onChange={(e) => handleChange('hero_subtitle_km', e.target.value)}
                  placeholder="តភ្ជាប់បេក្ខជនឆ្នើមជាមួយក្រុមហ៊ុនដែលបានផ្ទៀងផ្ទាត់នៅរាជធានីភ្នំពេញ និងគ្រប់ខេត្តក្រុង..."
                />
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: TOP ANNOUNCEMENT BAR                              */}
        {/* ======================================================== */}
        {activeTab === 'announcement' && (
          <div className="glass-card bg-white/95 rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-sm space-y-6 animate-in fade-in duration-150">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 border border-amber-200/70 flex items-center justify-center shrink-0">
                  <Megaphone className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">
                    {isKhmer ? 'របារជូនដំណឹងកំពូលទំព័រ' : 'Global Top Announcement Bar'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {isKhmer
                      ? 'បង្ហាញសារជូនដំណឹង ឬការផ្សព្វផ្សាយពិសេសនៅផ្នែកខាងលើគេបង្អស់នៃគ្រប់ទំព័រ'
                      : 'Broadcast an important notice or event link across the top of the platform'}
                  </p>
                </div>
              </div>

              {/* Clean Status Toggle Card */}
              <label className="inline-flex items-center gap-3 px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200/80 cursor-pointer select-none self-start sm:self-auto">
                <input
                  type="checkbox"
                  checked={Boolean(formData.announcement_enabled)}
                  onChange={(e) => handleChange('announcement_enabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="relative w-10 h-5.5 bg-slate-300 rounded-full peer peer-checked:bg-blue-600 transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:w-4.5 after:h-4.5 after:bg-white after:rounded-full after:shadow-xs after:transition-transform peer-checked:after:translate-x-4.5" />
                <span
                  className={`text-xs font-bold ${
                    formData.announcement_enabled ? 'text-blue-700' : 'text-slate-500'
                  }`}
                >
                  {formData.announcement_enabled
                    ? isKhmer
                      ? 'បើកបង្ហាញ'
                      : 'Active'
                    : isKhmer
                    ? 'បានបិទ'
                    : 'Disabled'}
                </span>
              </label>
            </div>

            {/* Live Preview (Always visible, reflects active/inactive state) */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                {isKhmer ? 'ការមើលសាកល្បងរបារជូនដំណឹង' : 'Banner Preview'}
              </span>
              <div
                className={`p-3.5 rounded-2xl flex items-center justify-between gap-3 px-4 text-xs font-semibold transition-all ${
                  formData.announcement_enabled
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-500 border border-dashed border-slate-300'
                }`}
              >
                <span className="flex items-center gap-2 min-w-0">
                  <Megaphone className="w-4 h-4 shrink-0" />
                  <span className="truncate">
                    {isKhmer
                      ? formData.announcement_text_km ||
                        formData.announcement_text ||
                        'សារជូនដំណឹងសាកល្បងនឹងបង្ហាញនៅទីនេះ...'
                      : formData.announcement_text || 'Your announcement banner text will appear here...'}
                  </span>
                </span>
                {formData.announcement_url && (
                  <span className="underline shrink-0 flex items-center gap-1">
                    <span>{isKhmer ? 'ស្វែងយល់បន្ថែម' : 'Learn more'}</span>
                    <ExternalLink className="w-3 h-3" />
                  </span>
                )}
              </div>
            </div>

            {/* Announcement Text Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              <StyledInput
                label={isKhmer ? 'ខ្លឹមសារសារជូនដំណឹង (អង់គ្លេស)' : 'Announcement Text (English)'}
                leftIcon={<Megaphone className="w-4 h-4" />}
                value={formData.announcement_text || ''}
                onChange={(e) => handleChange('announcement_text', e.target.value)}
                placeholder="Join Cambodia's Biggest Career Fair 2026!"
              />

              <StyledInput
                label={isKhmer ? 'ខ្លឹមសារសារជូនដំណឹង (ខ្មែរ)' : 'Announcement Text (Khmer)'}
                leftIcon={<Megaphone className="w-4 h-4" />}
                value={formData.announcement_text_km || ''}
                onChange={(e) => handleChange('announcement_text_km', e.target.value)}
                placeholder="ចូលរួមពិព័រណ៍ការងារធំបំផុតប្រចាំឆ្នាំ ២០២៦!"
              />
            </div>

            <StyledInput
              label={isKhmer ? 'តំណភ្ជាប់ពេលចុចលើសារ (ជម្រើស)' : 'Destination Link URL (Optional)'}
              leftIcon={<Link2 className="w-4 h-4" />}
              value={formData.announcement_url || ''}
              onChange={(e) => handleChange('announcement_url', e.target.value)}
              placeholder="/jobs or https://cambodiajobs.kh/events"
              rightAction={renderOpenExternalBtn(formData.announcement_url)}
              hint={
                isKhmer
                  ? 'ទុកទទេប្រសិនបើមិនចាំបាច់ភ្ជាប់ទៅកាន់ទំព័រផ្សេង'
                  : 'Leave empty if the banner does not need a clickable link'
              }
            />
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 4: CONTACT & SOCIAL LINKS                            */}
        {/* ======================================================== */}
        {activeTab === 'contact' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 animate-in fade-in duration-150">
            {/* Contact Details Card */}
            <div className="lg:col-span-7 glass-card bg-white/95 rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-sm space-y-4">
              <div className="flex items-center gap-3 pb-3.5 border-b border-slate-100">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 border border-blue-200/70 flex items-center justify-center shrink-0">
                  <Mail className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">
                    {isKhmer ? 'ព័ត៌មានទំនាក់ទំនង និង Footer' : 'Contact Information & Footer'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {isKhmer
                      ? 'បង្ហាញនៅផ្នែកខាងក្រោមគេហទំព័រ និងទំព័រជំនួយការ'
                      : 'Displayed across public support areas and the website footer'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <StyledInput
                  type="email"
                  required
                  label={isKhmer ? 'អ៊ីមែលជំនួយការ' : 'Support Email'}
                  leftIcon={<Mail className="w-4 h-4" />}
                  value={formData.contact_email}
                  onChange={(e) => handleChange('contact_email', e.target.value)}
                  placeholder="support@cambodiajobs.kh"
                />

                <StyledInput
                  type="text"
                  label={isKhmer ? 'លេខទូរស័ព្ទទាក់ទង' : 'Contact Phone'}
                  leftIcon={<Phone className="w-4 h-4" />}
                  value={formData.contact_phone}
                  onChange={(e) => handleChange('contact_phone', e.target.value)}
                  placeholder="+855 23 999 888"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                <StyledInput
                  label={isKhmer ? 'អាសយដ្ឋានការិយាល័យ (អង់គ្លេស)' : 'Office Address (English)'}
                  leftIcon={<MapPin className="w-4 h-4" />}
                  value={formData.contact_address}
                  onChange={(e) => handleChange('contact_address', e.target.value)}
                  placeholder="Phnom Penh, Cambodia"
                />

                <StyledInput
                  label={isKhmer ? 'អាសយដ្ឋានការិយាល័យ (ខ្មែរ)' : 'Office Address (Khmer)'}
                  leftIcon={<MapPin className="w-4 h-4" />}
                  value={formData.contact_address_km}
                  onChange={(e) => handleChange('contact_address_km', e.target.value)}
                  placeholder="រាជធានីភ្នំពេញ, ប្រទេសកម្ពុជា"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                <StyledTextarea
                  label={isKhmer ? 'អត្ថបទ Footer (អង់គ្លេស)' : 'Footer Description (English)'}
                  rows={3}
                  value={formData.footer_text || ''}
                  onChange={(e) => handleChange('footer_text', e.target.value)}
                  placeholder="Connecting ambitious professionals with reputable employers..."
                />

                <StyledTextarea
                  label={isKhmer ? 'អត្ថបទ Footer (ខ្មែរ)' : 'Footer Description (Khmer)'}
                  rows={3}
                  value={formData.footer_text_km || ''}
                  onChange={(e) => handleChange('footer_text_km', e.target.value)}
                  placeholder="តភ្ជាប់អ្នកជំនាញដែលមានទេពកោសល្យជាមួយនិយោជកដែលគួរឱ្យទុកចិត្ត..."
                />
              </div>
            </div>

            {/* Social Media Links Card */}
            <div className="lg:col-span-5 glass-card bg-white/95 rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-sm space-y-4">
              <div className="flex items-center gap-3 pb-3.5 border-b border-slate-100">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200/70 flex items-center justify-center shrink-0">
                  <Share2 className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">
                    {isKhmer ? 'បណ្តាញទំនាក់ទំនងសង្គម' : 'Social Media Channels'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {isKhmer
                      ? 'តំណភ្ជាប់ផ្លូវការសម្រាប់បង្ហាញលើ Footer'
                      : 'Official social profiles linked in the footer'}
                  </p>
                </div>
              </div>

              <StyledInput
                type="url"
                label={isKhmer ? 'តំណភ្ជាប់ទំព័រ Facebook' : 'Facebook Page URL'}
                leftIcon={<Globe className="w-4 h-4 text-[#1877F2]" />}
                value={formData.social_facebook || ''}
                onChange={(e) => handleChange('social_facebook', e.target.value)}
                placeholder="https://facebook.com/cambodiajobs"
                rightAction={renderOpenExternalBtn(formData.social_facebook)}
              />

              <StyledInput
                type="url"
                label={isKhmer ? 'តំណភ្ជាប់ Telegram ជំនួយការ' : 'Telegram Channel / Bot URL'}
                leftIcon={<Send className="w-4 h-4 text-[#229ED9]" />}
                value={formData.social_telegram || ''}
                onChange={(e) => handleChange('social_telegram', e.target.value)}
                placeholder="https://t.me/CambodiaJobSupportBot"
                rightAction={renderOpenExternalBtn(formData.social_telegram)}
              />

              <StyledInput
                type="url"
                label={isKhmer ? 'តំណភ្ជាប់ LinkedIn ក្រុមហ៊ុន' : 'LinkedIn Page URL'}
                leftIcon={<Briefcase className="w-4 h-4 text-[#0A66C2]" />}
                value={formData.social_linkedin || ''}
                onChange={(e) => handleChange('social_linkedin', e.target.value)}
                placeholder="https://linkedin.com/company/cambodiajobs"
                rightAction={renderOpenExternalBtn(formData.social_linkedin)}
              />

              <StyledInput
                type="url"
                label={isKhmer ? 'តំណភ្ជាប់ X (Twitter)' : 'X (Twitter) URL'}
                leftIcon={<FileText className="w-4 h-4 text-slate-700" />}
                value={formData.social_twitter || ''}
                onChange={(e) => handleChange('social_twitter', e.target.value)}
                placeholder="https://x.com/cambodiajobs"
                rightAction={renderOpenExternalBtn(formData.social_twitter)}
              />
            </div>
          </div>
        )}

        {/* Sticky/Bottom Action Bar */}
        <div className="glass-card bg-white/95 rounded-2xl border border-slate-200/90 p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2 text-xs">
            {hasUnsavedChanges ? (
              <span className="inline-flex items-center gap-1.5 font-semibold text-amber-700">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                <span>
                  {isKhmer
                    ? 'អ្នកមានការកែប្រែដែលមិនទាន់បានរក្សាទុក'
                    : 'You have unsaved changes waiting to be published'}
                </span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>
                  {isKhmer ? 'ការកំណត់ទាំងអស់ត្រូវបានរក្សាទុករួចរាល់' : 'All changes are up to date'}
                </span>
              </span>
            )}
          </div>

          <div className="flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={fetchSettings}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 text-xs font-bold transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{isKhmer ? 'កំណត់ឡើងវិញ' : 'Reset'}</span>
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-sm shadow-blue-500/20 transition active:scale-95 disabled:opacity-50 cursor-pointer"
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
                  ? 'រក្សាទុកការកែប្រែទាំងអស់'
                  : 'Save All Changes'}
              </span>
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
