import React from 'react'
import { Search, X } from 'lucide-react'

export interface AdminPageHeaderProps {
  title: string
  subtitle?: string
  badge?: {
    icon?: React.ComponentType<{ className?: string }>
    text: string
    variant?: 'blue' | 'emerald' | 'amber' | 'slate'
  }
  secondaryBadge?: {
    text: string
    variant?: 'blue' | 'emerald' | 'amber' | 'slate'
  }
  searchValue?: string
  onSearchChange?: (val: string) => void
  searchPlaceholder?: string
  actions?: React.ReactNode
}

export const AdminPageHeader: React.FC<AdminPageHeaderProps> = ({
  title,
  subtitle,
  badge,
  secondaryBadge,
  searchValue,
  onSearchChange,
  searchPlaceholder,
  actions,
}) => {
  const getBadgeClass = (variant?: 'blue' | 'emerald' | 'amber' | 'slate') => {
    switch (variant) {
      case 'emerald':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200'
      case 'amber':
        return 'bg-amber-50 text-amber-800 border-amber-200'
      case 'slate':
        return 'bg-slate-100 text-slate-700 border-slate-200'
      case 'blue':
      default:
        return 'bg-blue-50 text-blue-700 border-gray-200'
    }
  }

  const BadgeIcon = badge?.icon

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-2xs">
      <div>
        <div className="flex items-center space-x-2 flex-wrap gap-y-1">
          <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            {title}
          </h1>
          {badge && (
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${getBadgeClass(
                badge.variant
              )}`}
            >
              {BadgeIcon && <BadgeIcon className="w-3 h-3" />}
              <span>{badge.text}</span>
            </span>
          )}
          {secondaryBadge && (
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getBadgeClass(
                secondaryBadge.variant || 'emerald'
              )}`}
            >
              {secondaryBadge.text}
            </span>
          )}
        </div>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>

      {(onSearchChange !== undefined || actions) && (
        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto w-full sm:w-auto">
          {onSearchChange !== undefined && (
            <div className="relative w-full sm:w-64 md:w-72">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchValue || ''}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={searchPlaceholder || 'Search...'}
                className="w-full pl-8 pr-8 py-1.5 text-xs bg-slate-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-blue-500 font-medium transition text-slate-800 shadow-2xs"
              />
              {searchValue && (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
          {actions}
        </div>
      )}
    </div>
  )
}
