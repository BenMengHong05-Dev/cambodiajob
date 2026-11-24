import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { companiesService } from '../../services/companies.service'
import { Company } from '../../types'
import { getAssetUrl } from '../../utils/assets'
import { FacebookVerifiedBadge } from '../../components/common/FacebookVerifiedBadge'
import {
  Search,
  Building2,
  MapPin,
  Briefcase,
  ShieldCheck,
  ArrowRight,
  Users,
  X,
  RotateCcw,
} from 'lucide-react'

const FALLBACK_BANNERS = [
  'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&h=300&fit=crop',
  'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=300&fit=crop',
  'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&h=300&fit=crop',
  'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=300&fit=crop',
  'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=800&h=300&fit=crop',
  'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&h=300&fit=crop',
]

const getInitials = (name: string) => {
  if (!name) return 'CO'
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

export const CompaniesPage: React.FC = () => {
  const { i18n } = useTranslation()
  const isKhmer = i18n.language === 'km'

  const [companies, setCompanies] = useState<Company[]>([])
  const [q, setQ] = useState('')
  const [selectedIndustry, setSelectedIndustry] = useState<string>('all')
  const [isLoading, setIsLoading] = useState(true)

  const fetchCompanies = async () => {
    setIsLoading(true)
    try {
      const data = await companiesService.getCompanies({
        q: q || undefined,
        industry: selectedIndustry !== 'all' ? selectedIndustry : undefined,
      })
      setCompanies(data.results || [])
    } catch (err) {
      console.error('Failed to load companies:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCompanies()
    }, 250)
    return () => clearTimeout(timer)
  }, [q, selectedIndustry])

  const industries = [
    { id: 'all', labelEn: 'All Industries', labelKm: 'គ្រប់វិស័យ' },
    { id: 'Telecommunications & Internet', labelEn: 'Telecom & Tech', labelKm: 'ទូរគមនាគមន៍' },
    { id: 'Commercial Banking', labelEn: 'Banking', labelKm: 'ធនាគារ' },
    { id: 'Fintech & Microfinance', labelEn: 'Fintech', labelKm: 'បច្ចេកវិទ្យាហិរញ្ញវត្ថុ' },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-6 font-sans">
      {/* 1. Header Section: Title on Left, Total Count Badge on Right (Similar to Jobs Page) */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {isKhmer ? 'ស្វែងរកស្ថាប័ន និងក្រុមហ៊ុនឈានមុខនៅកម្ពុជា' : 'Top Employers & Companies in Cambodia'}
          </h1>
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100/90 text-xs font-semibold text-slate-600 shrink-0 self-start sm:self-auto">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>
            {isKhmer ? 'មានក្រុមហ៊ុនសរុប' : 'Total Companies:'}{' '}
            <strong className="text-slate-900 font-extrabold">{companies.length}</strong>
          </span>
        </div>
      </div>

      {/* 2. Search & Industry Filters Bar (Bottom of Title, Similar to Jobs Page) */}
      <div className="w-full">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            fetchCompanies()
          }}
          className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 lg:gap-4"
        >
          {/* Left: Compact Search Input + Search Button */}
          <div className="flex items-center gap-2 w-full lg:w-auto">
            <div className="relative flex items-center w-full sm:w-72 md:w-80 lg:w-96">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
              <input
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={
                  isKhmer
                    ? 'ស្វែងរកតាមឈ្មោះក្រុមហ៊ុន ឬវិស័យ...'
                    : 'Search company by name or industry...'
                }
                className="w-full pl-10 pr-9 py-2 text-xs sm:text-sm text-slate-800 placeholder-slate-400 font-medium outline-none bg-white border border-slate-200 rounded-xl min-h-[38px] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 shadow-2xs transition-all"
              />
              {q && (
                <button
                  type="button"
                  onClick={() => setQ('')}
                  className="absolute right-3 text-slate-400 hover:text-slate-600 p-0.5 transition cursor-pointer"
                  title={isKhmer ? 'សម្អាត' : 'Clear'}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Search Button (Beside Input on the Left) */}
            <button
              type="submit"
              className="px-4.5 py-2 min-h-[38px] bg-blue-600 hover:bg-blue-700 active:scale-98 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs shadow-blue-600/20 transition-all shrink-0 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Search className="w-4 h-4" />
              <span>{isKhmer ? 'ស្វែងរក' : 'Search'}</span>
            </button>
          </div>

          {/* Right: Industry Filter Pills (Companies Page Filter Action) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none shrink-0">
            {industries.map((ind) => {
              const isActive = selectedIndustry === ind.id
              return (
                <button
                  key={ind.id}
                  type="button"
                  onClick={() => setSelectedIndustry(ind.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white font-bold shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200/90 hover:bg-slate-50 hover:text-slate-900 shadow-2xs'
                  }`}
                >
                  {isKhmer ? ind.labelKm : ind.labelEn}
                </button>
              )
            })}

            {/* Reset Filter Button if active */}
            {(q || selectedIndustry !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setQ('')
                  setSelectedIndustry('all')
                }}
                className="text-xs font-bold text-slate-500 hover:text-red-600 flex items-center px-2.5 py-2 rounded-xl bg-white border border-slate-200/90 shadow-2xs hover:bg-red-50 hover:border-red-200 transition cursor-pointer shrink-0"
                title={isKhmer ? 'កំណត់ឡើងវិញ' : 'Reset All'}
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1" />
                <span>{isKhmer ? 'កំណត់ឡើងវិញ' : 'Reset'}</span>
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Loading Skeleton: 4 Columns */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4.5">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <div
              key={n}
              className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden animate-pulse flex flex-col justify-between"
            >
              <div>
                <div className="h-28 bg-slate-100" />
                <div className="px-4 -mt-7 flex justify-between items-end">
                  <div className="w-14 h-14 rounded-full bg-slate-200 shadow-md border-0" />
                  <div className="w-16 h-5 rounded-full bg-slate-100" />
                </div>
                <div className="p-4 space-y-2.5">
                  <div className="h-4 bg-slate-200 rounded-md w-3/4" />
                  <div className="h-3 bg-slate-100 rounded-md w-1/3" />
                  <div className="flex gap-2 pt-1">
                    <div className="h-5 w-20 bg-slate-100 rounded-lg" />
                    <div className="h-5 w-16 bg-slate-100 rounded-lg" />
                  </div>
                  <div className="h-3 bg-slate-100 rounded-md w-full mt-2" />
                  <div className="h-3 bg-slate-100 rounded-md w-4/5" />
                </div>
              </div>
              <div className="p-4 pt-0">
                <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                  <div className="h-4 w-16 bg-slate-100 rounded" />
                  <div className="h-8 w-24 bg-slate-100 rounded-xl" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : companies.length === 0 ? (
        /* Empty State */
        <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-200 p-8 max-w-md mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 text-slate-400 flex items-center justify-center mx-auto mb-3 shadow-2xs">
            <Building2 className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-800">
            {isKhmer ? 'រកមិនឃើញក្រុមហ៊ុនទេ' : 'No companies found'}
          </h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            {isKhmer
              ? 'សូមសាកល្បងស្វែងរកដោយប្រើពាក្យគន្លឹះផ្សេង ឬដកតម្រងចេញ។'
              : 'Try adjusting your search keyword or clearing the industry filter.'}
          </p>
          {(q || selectedIndustry !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setQ('')
                setSelectedIndustry('all')
              }}
              className="mt-4 px-4 py-2 rounded-xl text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 transition"
            >
              {isKhmer ? 'កំណត់ឡើងវិញ' : 'Reset Filters'}
            </button>
          )}
        </div>
      ) : (
        /* 4-Column Grid: icon profile rounded and not border */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4.5">
          {companies.map((company, index) => {
            const bannerImg =
              company.banner_url || FALLBACK_BANNERS[index % FALLBACK_BANNERS.length]
            const openJobs = company.jobs_count || 0

            return (
              <Link
                key={company.id}
                to={`/companies/${company.slug}`}
                className="group relative bg-white rounded-3xl border border-slate-200/85 shadow-xs hover:border-blue-400/80 hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between overflow-hidden"
              >
                {/* 1. Cinematic Banner */}
                <div>
                  <div className="relative h-28 w-full overflow-hidden bg-slate-100">
                    <img
                      src={getAssetUrl(bannerImg)}
                      alt={`${company.name} banner`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-900/25 to-transparent" />

                    {/* Openings count pill on top right */}
                    {openJobs > 0 ? (
                      <span className="absolute top-2.5 right-2.5 z-10 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/95 text-white backdrop-blur-md shadow-sm border border-emerald-400/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        <Briefcase className="w-3 h-3 text-white" />
                        <span>
                          {openJobs} {isKhmer ? 'ការងារ' : 'Openings'}
                        </span>
                      </span>
                    ) : (
                      <span className="absolute top-2.5 right-2.5 z-10 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-black/40 text-white/90 backdrop-blur-md border border-white/20">
                        <Briefcase className="w-3 h-3 text-white/70" />
                        <span>
                          0 {isKhmer ? 'ការងារ' : 'Jobs'}
                        </span>
                      </span>
                    )}
                  </div>

                  {/* 2. Rounded Profile Icon with NO Border */}
                  <div className="px-4 -mt-7 relative z-10 flex items-end justify-between">
                    <div className="w-14 h-14 rounded-full bg-white shadow-md overflow-hidden shrink-0 flex items-center justify-center p-0.5 border-0 ring-0 group-hover:scale-105 group-hover:shadow-lg transition-transform duration-300">
                      {company.logo_url ? (
                        <img
                          src={getAssetUrl(company.logo_url)}
                          alt={company.name}
                          className="w-full h-full object-cover rounded-full border-0"
                        />
                      ) : (
                        <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 text-white flex items-center justify-center font-black text-xs shadow-inner border-0">
                          {getInitials(company.name)}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 3. Company Info Section */}
                  <div className="p-4 pt-2.5 space-y-2.5 flex-1">
                    {/* Name & Title */}
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3
                          className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate tracking-tight"
                          title={company.name}
                        >
                          {company.name}
                        </h3>
                        {company.verification_status === 'verified' && (
                          <FacebookVerifiedBadge
                            className="w-4 h-4 shrink-0"
                            title={isKhmer ? 'ក្រុមហ៊ុនផ្ទៀងផ្ទាត់ផ្លូវការ' : 'Officially Verified Company'}
                          />
                        )}
                      </div>

                      {/* Industry */}
                      <p className="text-[11px] font-semibold text-blue-600/90 truncate mt-0.5">
                        {company.industry ||
                          (isKhmer ? 'ពាណិជ្ជកម្ម & សេវាកម្ម' : 'Business & Services')}
                      </p>
                    </div>

                    {/* Metadata Badges */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                      <span className="inline-flex items-center text-[10px] font-medium text-slate-600 bg-slate-50 border border-slate-200/60 px-2 py-0.5 rounded-lg">
                        <MapPin className="w-3 h-3 mr-1 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[95px]">
                          {company.province || 'Phnom Penh'}
                        </span>
                      </span>

                      {company.company_size && (
                        <span className="inline-flex items-center text-[10px] font-medium text-slate-600 bg-slate-50 border border-slate-200/60 px-2 py-0.5 rounded-lg">
                          <Users className="w-3 h-3 mr-1 text-slate-400 shrink-0" />
                          <span>{company.company_size}</span>
                        </span>
                      )}
                    </div>

                    {/* Description Clamp */}
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed min-h-[2.25rem] pt-0.5 font-normal">
                      {company.description
                        ? company.description.replace(/<[^>]*>?/gm, '')
                        : isKhmer
                        ? 'ស្ថាប័ន ឬក្រុមហ៊ុនកំពុងជ្រើសរើសបុគ្គលិកឆ្នើមនៅកម្ពុជា។'
                        : 'Verified employer hiring top talent in Cambodia.'}
                    </p>
                  </div>
                </div>

                {/* 4. Action Footer with Strong Rounded Button */}
                <div className="p-4 pt-0">
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      {openJobs > 0 ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span>{openJobs} {isKhmer ? 'ការងារ' : 'Open'}</span>
                        </span>
                      ) : (
                        <span className="text-xs font-medium text-slate-400">
                          {isKhmer ? 'គ្មានការងារ' : 'No jobs'}
                        </span>
                      )}
                    </div>

                    <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs shadow-blue-500/20 group-hover:shadow-md group-hover:shadow-blue-500/30">
                      <span>{isKhmer ? 'មើលព័ត៌មាន' : 'View'}</span>
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
