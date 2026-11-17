import React from 'react'
import { Link } from 'react-router-dom'
import { LucideIcon } from 'lucide-react'

export interface QuickAction {
  to: string
  label: string
  icon: LucideIcon
  badge?: React.ReactNode
}

interface QuickActionsProps {
  actions: QuickAction[]
  hint?: React.ReactNode
}

/**
 * Shared dashboard quick-action rail used by Admin, Employer and Job Seeker
 * dashboards to keep navigation and styling consistent across roles.
 */
export const QuickActions: React.FC<QuickActionsProps> = ({ actions, hint }) => (
  <div className="flex flex-wrap items-center justify-between gap-2.5">
    <div className="flex flex-wrap items-center gap-2 text-xs">
      {actions.map((action) => {
        const Icon = action.icon
        return (
          <Link
            key={`${action.to}-${action.label}`}
            to={action.to}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-white/80 hover:bg-white hover:text-blue-600 border border-white/80 hover:border-blue-300/60 shadow-2xs hover:shadow-xs transition-all"
          >
            <Icon className="w-3.5 h-3.5 text-blue-600" />
            <span>{action.label}</span>
            {action.badge != null && (
              <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-bold leading-none">
                {action.badge}
              </span>
            )}
          </Link>
        )
      })}
    </div>
    {hint && (
      <div className="text-[11px] text-slate-400 font-medium hidden sm:block">{hint}</div>
    )}
  </div>
)

export default QuickActions
