import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { companiesService } from '../../services/companies.service'
import { Company } from '../../types'
import { formatSalaryRange } from '../../utils/currency'
import { useToast } from '../../app/providers'
import {
  Building2,
  MapPin,
  Globe,
  ShieldCheck,
  Briefcase,
  ExternalLink,
  ArrowRight,
  Users,
  Share2,
  ChevronRight,
} from 'lucide-react'

export const CompanyDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>()
  const { i18n } = useTranslation()
  const isKhmer = i18n.language === 'km'
  const { toast } = useToast()

  const [company, setCompany] = useState<(Company & { jobs: any[] }) | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!slug) return
    const fetch = async () => {
      try {
        const data = await companiesService.getCompanyBySlug(slug)
        setCompany(data)
      } catch (err) {
        console.error('Failed to load company detail:', err)
      } finally {
        setIsLoading(false)
      }
    }
    fetch()
  }, [slug])

  const handleShare = async () => {
    const url = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({
          title: company?.name || 'Company Profile',
          text: `Explore career opportunities at ${company?.name} on CambodiaJobs`,
          url: url,
        })
        return
      } catch (err) {
        // Fallback to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(url)
      toast.success(
        isKhmer ? 'បានចម្លងតំណភ្ជាប់' : 'Link Copied',
        isKhmer ? 'តំណភ្ជាប់កម្រងព័ត៌មានក្រុមហ៊ុនត្រូវបានចម្លង!' : 'Company link copied to clipboard!'
      )
    } catch {
      toast.info(isKhmer ? 'តំណភ្ជាប់:' : 'Link:', url)
    }
  }

  const getInitials = (name: string) => {
    if (!name) return 'CO'
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return name.slice(0, 2).toUpperCase()
  }

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-3 font-sans">
        <div className="w-8 h-8 border-3 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="text-xs font-semibold text-slate-400">
          {isKhmer ? 'កំពុងផ្ទុកព័ត៌មានក្រុមហ៊ុន...' : 'Loading company profile...'}
        </p>
      </div>
    )
  }

  if (!company) {
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center font-sans">
        <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 text-slate-400 flex items-center justify-center mx-auto mb-3 shadow-2xs">
          <Building2 className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-slate-800 mb-1.5">
          {isKhmer ? 'រកមិនឃើញក្រុមហ៊ុនទេ' : 'Company Not Found'}
        </h2>
        <p className="text-xs text-slate-500 mb-6">
          {isKhmer ? 'ក្រុមហ៊ុននេះប្រហែលជាត្រូវបានបិទ ឬផ្លាស់ប្តូរតំណភ្ជាប់។' : 'This company is no longer available.'}
        </p>
        <Link
          to="/companies"
          className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
        >
          {isKhmer ? 'ត្រឡប់ទៅបញ្ជីក្រុមហ៊ុន' : 'Return to Company Directory'}
        </Link>
      </div>
    )
  }

  const openJobsCount = company.jobs?.length || 0

  return (
    <div className="min-h-screen bg-slate-50/50 pb-16 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 sm:pt-7 space-y-6">
        
        {/* Clean Breadcrumbs */}
        <nav className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
          <Link to="/" className="hover:text-slate-600 transition">
            {isKhmer ? 'ទំព័រដើម' : 'Home'}
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <Link to="/companies" className="hover:text-slate-600 transition">
            {isKhmer ? 'ស្ថាប័ន & ក្រុមហ៊ុន' : 'Companies'}
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <span className="text-slate-700 font-semibold truncate max-w-[200px] sm:max-w-none">
            {company.name}
          </span>
        </nav>

        {/* ================= CLEAN COMPANY PROFILE CARD ================= */}
        <div className="bg-white rounded-3xl border border-slate-200/85 shadow-xs overflow-hidden">
          {/* Cover Banner */}
          <div className="h-36 sm:h-48 md:h-56 bg-slate-900 relative overflow-hidden">
            {company.banner_url ? (
              <img
                src={company.banner_url}
                alt={company.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-blue-700 via-indigo-700 to-sky-600" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-900/25 to-transparent" />

            {/* Hiring status pill on top right */}
            <div className="absolute top-3.5 right-3.5 sm:right-5">
              {openJobsCount > 0 ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/95 text-white backdrop-blur-md shadow-sm border border-emerald-400/30">
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  <span>
                    {openJobsCount} {isKhmer ? 'ការងារកំពុងជ្រើសរើស' : 'Open Positions'}
                  </span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-black/40 text-white/90 backdrop-blur-md border border-white/15">
                  <span>{isKhmer ? 'មិនទាន់មានការងារ' : 'No Openings'}</span>
                </span>
              )}
            </div>
          </div>

          {/* Body Section */}
          <div className="px-6 sm:px-8 pb-7 pt-0">
            {/* Top Row: Avatar overlapping cover on left, Action buttons on right */}
            <div className="flex items-end justify-between -mt-11 sm:-mt-14 mb-3">
              {/* Rounded-full Logo Avatar (NO Border, Pure White Ring) */}
              <div className="w-22 h-22 sm:w-26 sm:h-26 rounded-full bg-white shadow-xl overflow-hidden shrink-0 flex items-center justify-center p-0.5 border-0 ring-4 ring-white relative z-10">
                {company.logo_url ? (
                  <img
                    src={company.logo_url}
                    alt={company.name}
                    className="w-full h-full object-cover rounded-full border-0"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 text-white flex items-center justify-center font-black text-xl sm:text-2xl shadow-inner border-0">
                    {getInitials(company.name)}
                  </div>
                )}
              </div>

              {/* Action Buttons Hub (Aligned on the right) */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleShare}
                  className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-blue-600 transition shadow-2xs cursor-pointer"
                  title={isKhmer ? 'ចែករំលែក' : 'Share Profile'}
                >
                  <Share2 className="w-4 h-4" />
                </button>

                {company.website && (
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>{isKhmer ? 'គេហទំព័រផ្លូវការ' : 'Website'}</span>
                    <ExternalLink className="w-3 h-3 text-white/80" />
                  </a>
                )}
              </div>
            </div>

            {/* Company Info (Strictly on White Background - No overlap with banner!) */}
            <div className="space-y-2 mt-2">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {company.name}
                </h1>
                {company.verification_status === 'verified' && (
                  <span
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200/70 shadow-2xs"
                    title={isKhmer ? 'ស្ថាប័នបានផ្ទៀងផ្ទាត់' : 'Verified Organization'}
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                    <span>{isKhmer ? 'ផ្ទៀងផ្ទាត់' : 'Verified'}</span>
                  </span>
                )}
              </div>

              {/* Meta Chips */}
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 pt-0.5">
                <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{company.province || 'Phnom Penh'}</span>
                </span>
                <span>•</span>
                <span className="font-semibold text-slate-700">
                  {company.industry || (isKhmer ? 'ពាណិជ្ជកម្ម & សេវាកម្ម' : 'General Business')}
                </span>
                {company.company_size && (
                  <>
                    <span>•</span>
                    <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>{company.company_size} {isKhmer ? 'បុគ្គលិក' : 'employees'}</span>
                    </span>
                  </>
                )}
              </div>

              {/* Company Description (Bio) */}
              {company.description && (
                <div className="pt-3 border-t border-slate-100 mt-3">
                  <div
                    className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal space-y-1.5"
                    dangerouslySetInnerHTML={{ __html: company.description }}
                  />
                </div>
              )}

              {/* Address */}
              {company.address && (
                <div className="pt-1 text-xs text-slate-500 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{company.address}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ================= OPEN POSITIONS SECTION ================= */}
        <div className="space-y-3.5 pt-1">
          <div className="flex items-center justify-between pb-1">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Briefcase className="w-3.5 h-3.5" />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                {isKhmer ? 'ឱកាសការងារកំពុងជ្រើសរើស' : 'Open Positions'}
              </h2>
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
                {openJobsCount}
              </span>
            </div>
          </div>

          {company.jobs && company.jobs.length > 0 ? (
            <div className="space-y-3">
              {company.jobs.map((job: any) => (
                <Link
                  key={job.id}
                  to={`/jobs/${job.slug}`}
                  className="block bg-white rounded-2xl p-5 border border-slate-200/80 hover:border-blue-400/80 hover:shadow-md transition-all duration-200 group"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1.5">
                      <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-blue-600 transition">
                        {job.title}
                      </h3>

                      {/* Metadata Chips */}
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-slate-50 border border-slate-200/60 font-medium">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{job.province}</span>
                        </span>
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-slate-50 border border-slate-200/60 font-medium capitalize">
                          <Briefcase className="w-3 h-3 text-slate-400" />
                          <span>{job.employment_type?.replace('_', ' ')}</span>
                        </span>
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-slate-50 border border-slate-200/60 font-medium capitalize">
                          <Building2 className="w-3 h-3 text-slate-400" />
                          <span>{job.workplace_type?.replace('_', ' ')}</span>
                        </span>
                      </div>
                    </div>

                    {/* Salary & Action Button */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      <span className="text-xs sm:text-sm font-bold text-blue-600 bg-blue-50 border border-blue-100 px-3 py-1 rounded-xl shrink-0">
                        {formatSalaryRange(
                          job.salary_min,
                          job.salary_max,
                          job.salary_currency,
                          job.is_salary_negotiable
                        )}
                      </span>

                      <span className="px-3.5 py-2 rounded-xl bg-slate-100 group-hover:bg-blue-600 text-slate-700 group-hover:text-white text-xs font-bold transition-all flex items-center gap-1 shadow-2xs">
                        <span>{isKhmer ? 'មើលការងារ' : 'View Job'}</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-8 text-center space-y-1.5">
              <Briefcase className="w-7 h-7 text-slate-300 mx-auto" />
              <h4 className="text-xs font-semibold text-slate-600">
                {isKhmer ? 'មិនទាន់មានឱកាសការងារនៅឡើយទេ' : 'No Open Vacancies Currently'}
              </h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {isKhmer
                  ? 'ស្ថាប័ននេះមិនទាន់មានការងារបើកជ្រើសរើសនៅពេលនេះទេ។'
                  : 'This company does not have any active postings at this time.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
