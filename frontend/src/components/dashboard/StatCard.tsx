import React from 'react'
import { Link } from 'react-router-dom'
import { LucideIcon } from 'lucide-react'

export type StatAccent = 'blue' | 'indigo' | 'sky' | 'amber' | 'emerald' | 'purple'

const ACCENTS: Record<StatAccent, { tile: string; glow: string; hover: string }> = {
  blue: {
    tile: 'from-blue-500/10 to-indigo-500/10 border-blue-400/20 text-blue-600 group-hover:bg-blue-600',
    glow: 'bg-blue-400/10',
    hover: 'group-hover:text-blue-600',
  },
  indigo: {
    tile: 'from-indigo-500/10 to-purple-500/10 border-indigo-400/20 text-indigo-600 group-hover:bg-indigo-600',
    glow: 'bg-indigo-400/10',
    hover: 'group-hover:text-indigo-600',
  },
  sky: {
    tile: 'from-sky-500/10 to-blue-500/10 border-sky-400/20 text-sky-600 group-hover:bg-sky-600',
    glow: 'bg-sky-400/10',
    hover: 'group-hover:text-sky-600',
  },
  amber: {
    tile: 'from-amber-500/15 to-orange-500/15 border-amber-400/30 text-amber-600 group-hover:bg-amber-500',
    glow: 'bg-amber-400/10',
    hover: 'group-hover:text-amber-600',
  },
  emerald: {
    tile: 'from-emerald-500/10 to-teal-500/10 border-emerald-400/20 text-emerald-600 group-hover:bg-emerald-600',
    glow: 'bg-emerald-400/10',
    hover: 'group-hover:text-emerald-600',
  },
  purple: {
    tile: 'from-purple-500/10 to-fuchsia-500/10 border-purple-400/20 text-purple-600 group-hover:bg-purple-600',
    glow: 'bg-purple-400/10',
    hover: 'group-hover:text-purple-600',
  },
}

export type StatTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger'

const TONES: Record<StatTone, string> = {
  neutral: 'text-slate-500 dark:text-slate-300 bg-white/80 dark:bg-slate-800/80 border-slate-200/60 dark:border-slate-700',
  info: 'text-blue-700 dark:text-blue-300 bg-blue-500/10 border-blue-400/25',
  success: 'text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border-emerald-400/30',
  warning: 'text-amber-700 dark:text-amber-300 bg-amber-500/15 border-amber-400/30',
  danger: 'text-rose-700 dark:text-rose-300 bg-rose-500/10 border-rose-400/30',
}

interface StatCardProps {
  label: string
  value: React.ReactNode
  icon: LucideIcon
  accent?: StatAccent
  badge?: React.ReactNode
  tone?: StatTone
  to?: string
  title?: string
  valueClassName?: string
  subtext?: React.ReactNode
}

/**
 * Unified KPI metric card used by the Admin, Employer and Job Seeker dashboards.
 * Keeps spacing, glass styling, icon tiles and badges consistent across roles.
 */
export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon: Icon,
  accent = 'blue',
  badge,
  tone = 'neutral',
  to,
  title,
  valueClassName,
  subtext,
}) => {
  const a = ACCENTS[accent]

  const content = (
    <>
      <div
        className={`absolute -right-8 -top-8 w-24 h-24 ${a.glow} rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`}
      />
      <div className="flex items-center justify-between gap-1.5 relative z-10">
        <span className="text-xs font-semibold text-slate-500 group-hover:text-slate-800 transition-colors truncate">
          {label}
        </span>
        <div
          className={`w-8 h-8 rounded-xl bg-gradient-to-br ${a.tile} border flex items-center justify-center group-hover:scale-105 group-hover:text-white transition-all duration-200 shadow-inner shrink-0`}
        >
          <Icon className="w-3.5 h-3.5" />
        </div>
      </div>
      <div className="mt-2.5 flex items-baseline justify-between gap-1.5 relative z-10">
        <span
          className={`text-xl sm:text-2xl font-extrabold tracking-tight transition-colors ${
            valueClassName || `text-slate-900 ${a.hover}`
          }`}
        >
          {value}
        </span>
        {badge != null && (
          <span
            className={`text-[10px] font-semibold border px-1.5 py-0.5 rounded-full shadow-2xs whitespace-nowrap shrink-0 ${TONES[tone]}`}
          >
            {badge}
          </span>
        )}
      </div>
      {subtext != null && (
        <div className="mt-2 pt-1.5 border-t border-slate-100/90 text-[10px] sm:text-[11px] text-slate-500 font-medium relative z-10">
          {subtext}
        </div>
      )}
    </>
  )

  const baseClass =
    'glass-card-hover p-3 sm:p-3.5 rounded-2xl relative overflow-hidden group block'

  if (to) {
    return (
      <Link to={to} title={title} className={baseClass}>
        {content}
      </Link>
    )
  }

  return (
    <div title={title} className={baseClass}>
      {content}
    </div>
  )
}

export default StatCard
