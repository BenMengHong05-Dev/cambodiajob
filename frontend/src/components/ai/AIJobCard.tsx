import React from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AIMatchedJob } from '../../types'
import { formatSalaryRange } from '../../utils/currency'
import { getAssetUrl } from '../../utils/assets'
import { ArrowRight, MapPin, Sparkles } from 'lucide-react'

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

  return (
    <Link
      to={`/jobs/${job.slug}`}
      className="block w-full bg-white hover:bg-blue-50/40 border border-slate-200/80 hover:border-blue-300 rounded-xl p-3 transition-all duration-200 group text-left cursor-pointer shadow-2xs hover:shadow-xs"
    >
      <div className="flex items-start justify-between gap-2.5">
        <div className="flex items-start gap-2.5 min-w-0 flex-1">
          {/* Company Logo / Avatar */}
          {job.company_logo ? (
            <img
              src={getAssetUrl(job.company_logo)}
              alt={job.company_name}
              className="w-9 h-9 rounded-xl object-cover border border-slate-200/80 shrink-0 bg-white"
              onError={(e) => {
                ;(e.currentTarget as HTMLElement).style.display = 'none'
              }}
            />
          ) : (
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0 border border-blue-200/60">
              {job.company_name?.slice(0, 2).toUpperCase() || 'JB'}
            </div>
          )}

          {/* Job Info */}
          <div className="min-w-0 flex-1">
            <h5 className="font-bold text-xs sm:text-[13px] text-slate-900 group-hover:text-blue-600 transition-colors truncate">
              {jobTitle}
            </h5>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 truncate mt-0.5">
              <span className="font-medium text-slate-600 truncate">{job.company_name}</span>
              <span className="text-slate-300">•</span>
              <span className="truncate flex items-center gap-0.5 text-slate-500">
                <MapPin className="w-2.5 h-2.5 shrink-0 text-slate-400" />
                {job.province || 'Cambodia'}
              </span>
            </div>

            {/* Salary and workplace type */}
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-[11px] font-bold text-emerald-600 font-mono">
                {salaryText}
              </span>
              {job.workplace_type && (
                <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md capitalize font-medium">
                  {job.workplace_type.replace('_', ' ')}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Match Score & Arrow */}
        <div className="flex items-center gap-1 shrink-0 mt-0.5">
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200/60 font-mono flex items-center gap-0.5">
            <Sparkles className="w-2.5 h-2.5 text-amber-500" />
            {matchScore}%
          </span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
        </div>
      </div>
    </Link>
  )
}
