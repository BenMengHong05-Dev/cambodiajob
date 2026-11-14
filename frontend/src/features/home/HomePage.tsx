import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { jobsService } from '../../services/jobs.service'
import { seekerService } from '../../services/seeker.service'
import { Job, JobCategory, ProvinceItem } from '../../types'
import { useAuth, usePreferences, useToast } from '../../app/providers'
import { formatSalaryRange } from '../../utils/currency'
import { Button, Input, Select } from '../../components/ui'
import {
  Search,
  MapPin,
  Briefcase,
  Building2,
  TrendingUp,
  Code2,
  Users,
  ShieldCheck,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Clock,
  DollarSign,
  Calculator,
  Compass,
  GraduationCap,
  Utensils,
  Headphones,
  Palette,
  HeartPulse,
  Truck,
  ChevronRight,
  ChevronDown,
  Bookmark,
  Eye,
} from 'lucide-react'

const FALLBACK_THUMBNAILS = [
  'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=700&h=360&fit=crop',
  'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=700&h=360&fit=crop',
  'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=700&h=360&fit=crop',
  'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=700&h=360&fit=crop',
  'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=700&h=360&fit=crop',
  'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=700&h=360&fit=crop',
]

const getJobThumbnail = (job: Job, index: number) => {
  return job.company_banner || FALLBACK_THUMBNAILS[index % FALLBACK_THUMBNAILS.length]
}

export const HomePage: React.FC = () => {
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const { toast } = useToast()
  const { currency } = usePreferences()
  const navigate = useNavigate()
  const location = useLocation()

  const [keyword, setKeyword] = useState('')
  const [selectedProvince, setSelectedProvince] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')

  const [categories, setCategories] = useState<JobCategory[]>([])
  const [provinces, setProvinces] = useState<ProvinceItem[]>([])
  const [featuredJobs, setFeaturedJobs] = useState<Job[]>([])
  const [platformStats, setPlatformStats] = useState<{
    total_jobs: number
    total_companies: number
    provinces_with_jobs: number
  }>({
    total_jobs: 0,
    total_companies: 0,
    provinces_with_jobs: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [showAllCategories, setShowAllCategories] = useState(false)
  const [savedJobIds, setSavedJobIds] = useState<number[]>([])

  const isKhmer = i18n.language === 'km'

  // Sync saved jobs from backend when authenticated user is detected
  useEffect(() => {
    if (user) {
      seekerService
        .getSavedJobs()
        .then((saved) => {
          if (Array.isArray(saved)) {
            setSavedJobIds(saved.map((s) => s.id))
          }
        })
        .catch(() => {})
    } else {
      setSavedJobIds([])
    }
  }, [user])

  const toggleSave = async (id: number, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!user) {
      toast.info(
        isKhmer ? 'សូមចូលប្រើប្រាស់ជាមុន' : 'Sign in required',
        isKhmer ? 'សូមចូលគណនីដើម្បីរក្សាទុកការងារនេះ' : 'Please sign in to bookmark this job vacancy'
      )
      navigate('/login', { state: { from: location } })
      return
    }

    const isCurrentlySaved = savedJobIds.includes(id)

    // Immediate optimistic UI toggle
    setSavedJobIds((prev) =>
      isCurrentlySaved ? prev.filter((x) => x !== id) : [...prev, id]
    )

    try {
      const isSaved = await jobsService.toggleSaveJob(id, isCurrentlySaved)
      setSavedJobIds((prev) => {
        const has = prev.includes(id)
        if (isSaved && !has) return [...prev, id]
        if (!isSaved && has) return prev.filter((x) => x !== id)
        return prev
      })

      if (isSaved) {
        toast.success(
          isKhmer ? 'បានរក្សាទុកការងារ!' : 'Job Saved!',
          isKhmer ? 'បានរក្សាទុកក្នុងបញ្ជីការងាររបស់អ្នក' : 'Vacancy added to your bookmarks'
        )
      } else {
        toast.info(
          isKhmer ? 'បានដកការរក្សាទុក' : 'Bookmark Removed',
          isKhmer ? 'បានដកការងារចេញពីបញ្ជីរបស់អ្នក' : 'Vacancy removed from your bookmarks'
        )
      }
    } catch (err) {
      console.error('Failed to toggle save job:', err)
      // Revert optimistic toggle
      setSavedJobIds((prev) =>
        isCurrentlySaved ? [...prev, id] : prev.filter((x) => x !== id)
      )
      toast.error(
        isKhmer ? 'មានបញ្ហាក្នុងការរក្សាទុក' : 'Save failed',
        isKhmer ? 'សូមព្យាយាមម្តងទៀត' : 'Please try again later'
      )
    }
  }

  const getEmploymentLabel = (type: string) => {
    const labels: Record<string, { en: string; km: string }> = {
      full_time: { en: 'Full-time', km: 'ពេញម៉ោង' },
      part_time: { en: 'Part-time', km: 'ក្រៅម៉ោង' },
      contract: { en: 'Contract', km: 'កិច្ចសន្យា' },
      internship: { en: 'Internship', km: 'កម្មសិក្សា' },
    }
    const val = labels[type]
    if (val) return isKhmer ? val.km : val.en
    return type.replace('_', ' ')
  }

  const getWorkplaceLabel = (type: string) => {
    const labels: Record<string, { en: string; km: string }> = {
      on_site: { en: 'On-site', km: 'នៅកន្លែង' },
      hybrid: { en: 'Hybrid', km: 'កូនកាត់' },
      remote: { en: 'Remote', km: 'ពីចម្ងាយ' },
    }
    const val = labels[type]
    if (val) return isKhmer ? val.km : val.en
    return type.replace('_', ' ')
  }

  const getExperienceLabel = (level: string) => {
    const labels: Record<string, { en: string; km: string }> = {
      fresh_graduate: { en: 'Fresh Grad', km: 'និស្សិតទើបចប់' },
      entry: { en: 'Entry Level', km: 'កម្រិតដំបូង' },
      mid: { en: 'Mid Level', km: 'កម្រិតមធ្យម' },
      senior: { en: 'Senior Level', km: 'កម្រិតខ្ពស់' },
      lead: { en: 'Lead / Director', km: 'អ្នកដឹកនាំ' },
    }
    const val = labels[level]
    if (val) return isKhmer ? val.km : val.en
    return level.replace('_', ' ')
  }

  const getCategoryIcon = (iconName?: string | null) => {
    switch (iconName) {
      case 'Code2':
        return { Icon: Code2, color: 'text-blue-600 bg-blue-50/90 border-blue-100' }
      case 'Building2':
        return { Icon: Building2, color: 'text-emerald-600 bg-emerald-50/90 border-emerald-100' }
      case 'TrendingUp':
        return { Icon: TrendingUp, color: 'text-purple-600 bg-purple-50/90 border-purple-100' }
      case 'Calculator':
        return { Icon: Calculator, color: 'text-amber-600 bg-amber-50/90 border-amber-100' }
      case 'Users':
        return { Icon: Users, color: 'text-rose-600 bg-rose-50/90 border-rose-100' }
      case 'Compass':
        return { Icon: Compass, color: 'text-cyan-600 bg-cyan-50/90 border-cyan-100' }
      case 'GraduationCap':
        return { Icon: GraduationCap, color: 'text-orange-600 bg-orange-50/90 border-orange-100' }
      case 'Utensils':
        return { Icon: Utensils, color: 'text-red-600 bg-red-50/90 border-red-100' }
      case 'Headphones':
        return { Icon: Headphones, color: 'text-indigo-600 bg-indigo-50/90 border-indigo-100' }
      case 'Palette':
        return { Icon: Palette, color: 'text-fuchsia-600 bg-fuchsia-50/90 border-fuchsia-100' }
      case 'HeartPulse':
        return { Icon: HeartPulse, color: 'text-teal-600 bg-teal-50/90 border-teal-100' }
      case 'Truck':
        return { Icon: Truck, color: 'text-slate-700 bg-slate-100 border-slate-200' }
      default:
        return { Icon: Briefcase, color: 'text-blue-600 bg-blue-50/90 border-blue-100' }
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cats, locs, jobsData, statsData] = await Promise.all([
          jobsService.getCategories(),
          jobsService.getLocations({ has_jobs: true }),
          jobsService.getJobs({ page_size: 8 }),
          jobsService
            .getStats()
            .catch(() => ({ total_jobs: 0, total_companies: 0, provinces_with_jobs: 0 })),
        ])
        setCategories(cats)
        setProvinces(locs.provinces)
        setFeaturedJobs(jobsData.results)
        if (statsData) {
          setPlatformStats(statsData)
        }
      } catch (err) {
        console.error('Failed to load home page data:', err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (keyword.trim()) params.append('q', keyword.trim())
    if (selectedProvince) params.append('province', selectedProvince)
    if (selectedCategory) params.append('category', selectedCategory)
    navigate(`/jobs?${params.toString()}`)
  }

  return (
    <div className="space-y-16 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-visible bg-gradient-to-b from-blue-900 via-indigo-900 to-slate-900 text-white pt-20 pb-28 px-4 sm:px-6 lg:px-8 z-30">
        <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-b-3xl">
          <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:24px_24px] opacity-20"></div>
        </div>
        <div className="relative max-w-5xl mx-auto text-center space-y-6">
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
            {t('home.heroTitle')}
          </h1>

          <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-300 leading-relaxed">
            {t('home.heroSubtitle')}
          </p>

          {/* Search Box */}
          <div className="max-w-4xl mx-auto mt-8 bg-white/10 backdrop-blur-md p-2 rounded-2xl border border-white/20 shadow-2xl relative z-40">
            <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-2 items-center">
              <div className="flex-1 w-full">
                <Input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder={t('home.searchPlaceholder')}
                  leftIcon={<Search className="w-4 h-4 text-slate-300" />}
                  variant="glass"
                />
              </div>

              <div className="md:w-56 w-full relative focus-within:z-50">
                <Select
                  value={selectedProvince}
                  onChange={(e) => setSelectedProvince(e.target.value)}
                  placeholder={t('home.allLocations')}
                  searchPlaceholder={isKhmer ? 'ស្វែងរកខេត្ត/រាជធានី...' : 'Search locations...'}
                  noResultsText={isKhmer ? 'រកមិនឃើញខេត្ត/រាជធានី' : 'No matching locations'}
                  searchable={true}
                  leftIcon={<MapPin className="w-4 h-4 text-slate-300" />}
                  variant="glass"
                >
                  <option value="">{t('home.allLocations')}</option>
                  {provinces
                    .filter((p) => (p.jobs_count ?? 0) > 0)
                    .map((p) => (
                      <option key={p.province_en} value={p.province_en}>
                        {isKhmer ? p.province_km : p.province_en}
                      </option>
                    ))}
                </Select>
              </div>

              <div className="md:w-56 w-full relative focus-within:z-50">
                <Select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  placeholder={t('home.allCategories')}
                  searchPlaceholder={isKhmer ? 'ស្វែងរកផ្នែកការងារ...' : 'Search categories...'}
                  noResultsText={isKhmer ? 'រកមិនឃើញផ្នែកការងារ' : 'No matching categories'}
                  searchable={true}
                  leftIcon={<Briefcase className="w-4 h-4 text-slate-300" />}
                  variant="glass"
                >
                  <option value="">{t('home.allCategories')}</option>
                  {categories
                    .filter((c) => (c.jobs_count ?? 0) > 0)
                    .map((c) => (
                      <option key={c.id} value={c.id.toString()}>
                        {isKhmer ? c.name_km : c.name_en}
                      </option>
                    ))}
                </Select>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                className="py-2.5 px-6 shadow-lg shadow-blue-600/40 shrink-0 w-full md:w-auto font-bold"
                leftIcon={<Search className="w-4 h-4" />}
              >
                {t('home.searchBtn')}
              </Button>
            </form>
          </div>

          {/* Quick Metrics (Live Real Database Counts) */}
          <div className="pt-6 grid grid-cols-3 gap-2.5 sm:gap-4 max-w-2xl mx-auto text-center relative z-0">
            {/* 1. Verified Jobs Count */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-3 sm:p-3.5 text-center hover:bg-white/10 transition-all duration-200">
              <span className="block text-xl sm:text-2xl lg:text-3xl font-black text-blue-400">
                {platformStats.total_jobs > 0
                  ? `${platformStats.total_jobs.toLocaleString()}+`
                  : '0'}
              </span>
              <span className="text-[10px] sm:text-[11px] text-slate-300 uppercase font-semibold tracking-wider mt-0.5 block">
                {isKhmer ? 'ការងារផ្ទៀងផ្ទាត់' : 'Verified Jobs'}
              </span>
            </div>

            {/* 2. Registered Companies / Active Employers Count */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-3 sm:p-3.5 text-center hover:bg-white/10 transition-all duration-200">
              <span className="block text-xl sm:text-2xl lg:text-3xl font-black text-emerald-400">
                {platformStats.total_companies > 0
                  ? `${platformStats.total_companies.toLocaleString()}+`
                  : '0'}
              </span>
              <span className="text-[10px] sm:text-[11px] text-slate-300 uppercase font-semibold tracking-wider mt-0.5 block">
                {isKhmer ? 'ក្រុមហ៊ុនសកម្ម' : 'Active Companies'}
              </span>
            </div>

            {/* 3. Provinces with Active Jobs Count */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-3 sm:p-3.5 text-center hover:bg-white/10 transition-all duration-200">
              <span className="block text-xl sm:text-2xl lg:text-3xl font-black text-amber-400">
                {platformStats.provinces_with_jobs}
              </span>
              <span className="text-[10px] sm:text-[11px] text-slate-300 uppercase font-semibold tracking-wider mt-0.5 block">
                {isKhmer ? 'ខេត្ត-រាជធានីមានការងារ' : 'Provinces with Jobs'}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Categories (Compact, Modern Micro-Cards) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 gap-3">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold text-blue-600 mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Trending Sectors</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {t('home.popularCategories')}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Explore opportunities across key sectors in Cambodia
            </p>
          </div>

          <div className="flex items-center space-x-3">
            {categories.length > 8 && (
              <button
                type="button"
                onClick={() => setShowAllCategories(!showAllCategories)}
                className="text-xs font-bold text-slate-700 hover:text-blue-600 bg-slate-100/80 hover:bg-slate-200/80 px-3 py-1.5 rounded-xl transition flex items-center"
              >
                <span>{showAllCategories ? (isKhmer ? 'បង្រួម' : 'Show Less') : (isKhmer ? 'បង្ហាញទាំងអស់' : `Show All (${categories.length})`)}</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 ml-1 transition-transform duration-200 ${
                    showAllCategories ? 'rotate-180' : ''
                  }`}
                />
              </button>
            )}
            <Link
              to="/jobs"
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center transition"
            >
              {t('home.viewAllJobs')}
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>
        </div>

        {/* Compact Micro-Bento Grid: Height is small and sleek, not tall */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-3">
          {categories.slice(0, showAllCategories ? categories.length : 8).map((cat) => {
            const { Icon, color } = getCategoryIcon(cat.icon)
            return (
              <Link
                key={cat.id}
                to={`/jobs?category=${cat.id}`}
                className="group flex items-center justify-between p-3 bg-white hover:bg-slate-50/70 rounded-2xl border border-slate-200/90 hover:border-blue-500/80 hover:shadow-md hover:shadow-blue-500/10 transition-all duration-150 min-h-[58px]"
              >
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  <div
                    className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 shadow-2xs ${color}`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-xs sm:text-[13px] font-bold text-slate-900 group-hover:text-blue-600 transition truncate leading-snug">
                      {isKhmer ? cat.name_km : cat.name_en}
                    </h3>
                    <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium leading-none mt-0.5">
                      {cat.jobs_count || 0} {t('jobs.vacancies')}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
              </Link>
            )
          })}
        </div>
      </section>

      {/* Featured Jobs */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              {t('home.featuredJobs')}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Hand-picked and verified career vacancies updated daily
            </p>
          </div>
          <Link
            to="/jobs"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center"
          >
            {t('home.viewAllJobs')}
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Link>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {featuredJobs.map((job, idx) => {
              const isSaved = savedJobIds.includes(job.id)
              const thumbnail = getJobThumbnail(job, idx)
              const categoryLabel = isKhmer
                ? job.category_name_km || 'ទូទៅ'
                : job.category_name_en || 'General'

              return (
                <div
                  key={job.id}
                  className="group flex flex-col justify-between bg-white rounded-2xl border border-slate-200/90 hover:border-blue-500/80 hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-1 transition-all duration-200 overflow-hidden relative"
                >
                  {/* 1. Top Row: Compact Post Thumbnail Banner */}
                  <div className="relative w-full h-24 sm:h-28 bg-slate-100 shrink-0">
                    <div className="w-full h-full overflow-hidden relative">
                      <Link to={`/jobs/${job.slug}`} className="block w-full h-full">
                        <img
                          src={thumbnail}
                          alt={job.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ease-out"
                          loading="lazy"
                        />
                        {/* Gradient Overlay for contrast */}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/15 to-transparent pointer-events-none" />
                      </Link>
                    </div>

                    {/* Floating Category Pill on Top Left */}
                    <div className="absolute top-2 left-2 z-10 pointer-events-none">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-white/95 text-slate-800 shadow-xs backdrop-blur-md border border-white/50">
                        {categoryLabel}
                      </span>
                    </div>

                    {/* Floating Bookmark Button on Top Right */}
                    <button
                      type="button"
                      onClick={(e) => toggleSave(job.id, e)}
                      className={`absolute top-2 right-2 z-10 w-7 h-7 rounded-full flex items-center justify-center transition-all shadow-md backdrop-blur-md cursor-pointer ${
                        isSaved
                          ? 'bg-blue-600 text-white shadow-blue-500/40 ring-2 ring-white/60 scale-105'
                          : 'bg-white/90 text-slate-700 hover:bg-white hover:text-blue-600 hover:scale-105'
                      }`}
                      title={isSaved ? (isKhmer ? 'ដកការរក្សាទុក' : 'Remove bookmark') : (isKhmer ? 'រក្សាទុកការងារ' : 'Save job')}
                    >
                      <Bookmark className={`w-3 h-3 ${isSaved ? 'fill-white text-white' : ''}`} />
                    </button>

                    {/* Overlapping Company Logo Avatar Badge (z-index above white background) */}
                    <div className="absolute -bottom-3 left-3 z-20">
                      <div className="w-9 h-9 rounded-full bg-white p-0.5 shadow-md ring-2 ring-white overflow-hidden flex items-center justify-center">
                        <img
                          src={
                            job.company_logo ||
                            'https://images.unsplash.com/photo-1541746972996-4e0b0f43e02a?w=80&h=80&fit=crop'
                          }
                          alt={job.company_name}
                          className="w-full h-full object-cover rounded-full"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 2. Middle Section: Listed Information (Compact) */}
                  <div className="p-3 pt-4 flex-1 flex flex-col justify-between relative z-10 bg-white">
                    <div>
                      {/* Company Name & Location row */}
                      <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                        <span className="font-bold text-slate-700 truncate group-hover:text-blue-600 transition-colors pr-2">
                          {job.company_name}
                        </span>
                        <div className="flex items-center text-[10px] text-slate-400 font-medium shrink-0">
                          <MapPin className="w-2.5 h-2.5 mr-0.5 text-slate-400 shrink-0" />
                          <span>{job.province || 'Phnom Penh'}</span>
                        </div>
                      </div>

                      {/* Job Title */}
                      <Link to={`/jobs/${job.slug}`} className="block">
                        <h3 className="text-[13px] sm:text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate leading-tight tracking-tight">
                          {isKhmer && job.title_km ? job.title_km : job.title}
                        </h3>
                      </Link>

                      {/* Job Description (Compact 1 line snippet) */}
                      {job.description && (
                        <p className="text-[11px] text-slate-500 line-clamp-1 mt-1 leading-snug font-normal">
                          {job.description.replace(/<[^>]*>?/gm, '')}
                        </p>
                      )}

                      {/* Meta Badges (rounded-full) */}
                      <div className="flex flex-wrap gap-1 mt-2">
                        <span className="px-2.5 py-0.5 text-[9px] font-semibold rounded-full bg-blue-50/80 text-blue-700 border border-blue-200/50">
                          {getEmploymentLabel(job.employment_type)}
                        </span>
                        <span className="px-2.5 py-0.5 text-[9px] font-semibold rounded-full bg-slate-100 text-slate-700 border border-slate-200/60">
                          {getWorkplaceLabel(job.workplace_type)}
                        </span>
                        <span className="px-2.5 py-0.5 text-[9px] font-semibold rounded-full bg-emerald-50/80 text-emerald-700 border border-emerald-200/50">
                          {getExperienceLabel(job.experience_level)}
                        </span>
                      </div>
                    </div>

                    {/* Salary & Action Buttons */}
                    <div className="mt-2.5 pt-2 border-t border-slate-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400">
                          {isKhmer ? 'ប្រាក់បៀវត្ស' : 'Salary'}
                        </span>
                        <span className="text-xs font-black text-slate-900 group-hover:text-blue-600 transition-colors tracking-tight">
                          {formatSalaryRange(
                            job.salary_min,
                            job.salary_max,
                            job.salary_currency,
                            job.is_salary_negotiable,
                            t('jobs.negotiable')
                          )}
                        </span>
                      </div>

                      {/* TWO COMPACT BUTTONS: VIEW & APPLY (rounded-full) */}
                      <div className="flex items-center gap-1.5">
                        <Link
                          to={`/jobs/${job.slug}`}
                          className="flex-1 py-1.5 px-3 rounded-full border border-slate-200 hover:border-slate-300 bg-slate-50/90 hover:bg-slate-100 text-slate-700 font-bold text-[11px] flex items-center justify-center gap-1 transition-all text-center cursor-pointer shadow-2xs"
                        >
                          <Eye className="w-3 h-3 text-slate-500" />
                          <span>{isKhmer ? 'មើលលម្អិត' : 'View'}</span>
                        </Link>

                        <Link
                          to={`/jobs/${job.slug}`}
                          className="flex-1 py-1.5 px-3 rounded-full bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-bold text-[11px] flex items-center justify-center gap-1 shadow-sm shadow-blue-600/20 hover:shadow-md transition-all text-center cursor-pointer"
                        >
                          <span>{isKhmer ? 'ដាក់ពាក្យ' : 'Apply'}</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}

