import React from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AIMatchedJob } from '../../types'
import { usePreferences } from '../../app/providers'
import { formatSalaryRange } from '../../utils/currency'
import { Building, ArrowRight, Sparkles, MapPin } from 'lucide-react'

interface AIJobCardProps {
  job: AIMatchedJob
  onSelect?: (job: AIMatchedJob) => void
}

export const AIJobCard: React.FC<AIJobCardProps> = ({ job }) => {
  const { i18n } = useTranslation()
  const isKhmer = i18n.language === 'km'

  const jobTitle = isKhmer && job.title_km ? job.title_km : job.title
  const salaryText = formatSalaryRange(
    job.salary_min,
    job.salary_max,
    job.salary_currency,
    job.is_salary_negotiable,
    isKhmer ? 'ចរចាបាន' : 'Negotiable'
  )

  const matchScore = job.match_score || 70
  const matchBadgeColor =
    matchScore >= 85
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : matchScore >= 70
      ? 'bg-blue-50 text-blue-700 border-blue-200'
      : 'bg-slate-100 text-slate-700 border-slate-200'

  return (
    <Link
      to={`/jobs/${job.slug}`}
      className="block w-full bg-slate-50/80 hover:bg-blue-50/40 border border-slate-200/90 hover:border-blue-300 rounded-xl p-2.5 transition-all duration-200 group text-left cursor-pointer shadow-2xs hover:shadow-xs"
    >
      {/* Main Info Row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {/* Compact Logo */}
          {job.company_logo ? (
            <img
              src={job.company_logo}
              alt={job.company_name}
              className="w-8 h-8 rounded-lg object-cover border border-slate-200/80 shrink-0 bg-white"
              onError={(e) => {
                ;(e.currentTarget as HTMLElement).style.display = 'none'
              }}
            />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0 border border-blue-200/60">
              {job.company_name?.slice(0, 2).toUpperCase() || 'JB'}
            </div>
          )}

          {/* Title and Company */}
          <div className="min-w-0 flex-1">
            <h5 className="font-bold text-xs text-slate-900 group-hover:text-blue-600 transition-colors truncate leading-snug">
              {jobTitle}
            </h5>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 truncate mt-0.5">
              <span className="truncate max-w-[130px] font-medium text-slate-600">
                {job.company_name}
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-500 truncate flex items-center gap-0.5">
                <MapPin className="w-2.5 h-2.5 shrink-0 text-slate-400" />
                {job.province || 'Cambodia'}
              </span>
            </div>
          </div>
        </div>

        {/* Match Score Badge */}
        <div className="flex items-center gap-1 shrink-0">
          <span
            className={`text-[10px] font-black px-1.5 py-0.5 rounded-md border font-mono flex items-center gap-0.5 ${matchBadgeColor}`}
          >
            <Sparkles className="w-2.5 h-2.5 text-amber-500" />
            {matchScore}%
          </span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-transform shrink-0" />
        </div>
      </div>

      {/* Meta Footer: Salary & Job Type */}
      <div className="flex items-center justify-between text-[10px] mt-2 pt-1.5 border-t border-slate-200/60 text-slate-500">
        <span className="font-semibold text-emerald-700 font-mono">
          {salaryText}
        </span>
        <span className="capitalize text-slate-500">
          {job.workplace_type?.replace('_', ' ')} • {job.employment_type?.replace('_', ' ')}
        </span>
      </div>
    </Link>
  )
}
