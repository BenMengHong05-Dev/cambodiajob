import React from 'react'
import { useTranslation } from 'react-i18next'
import { Mail, CheckCircle2, ShieldCheck, Bell } from 'lucide-react'
import { useAuth } from '../../app/providers'

interface EmailNotificationCardProps {
  variant?: 'button' | 'card' | 'pill'
  className?: string
  role?: 'job_seeker' | 'employer' | 'admin'
}

export const EmailNotificationCard: React.FC<EmailNotificationCardProps> = ({
  variant = 'card',
  className = '',
  role = 'job_seeker',
}) => {
  const { i18n } = useTranslation()
  const isKhmer = i18n.language === 'km'
  const { user } = useAuth()

  const userEmail = user?.email || 'your-email@domain.com'

  const titleText = isKhmer
    ? role === 'admin'
      ? 'ប្រព័ន្ធជូនដំណឹងតាម Email របស់ Admin'
      : role === 'employer'
      ? 'ការជូនដំណឹងបេក្ខជនតាម Email'
      : 'ការជូនដំណឹងការងារតាម Email'
    : role === 'admin'
    ? 'Admin Email Alerts Center'
    : role === 'employer'
    ? 'Applicant Email Notifications'
    : 'Job Application Email Alerts'

  const descriptionText = isKhmer
    ? role === 'admin'
      ? `ការជូនដំណឹងសុវត្ថិភាព ការចូលគណនី និងការផ្ទៀងផ្ទាត់ក្រុមហ៊ុនត្រូវបានបញ្ជូនផ្ទាល់ទៅ ${userEmail}`
      : role === 'employer'
      ? `ទទួលដំណឹងភ្លាមៗនៅពេលមានបេក្ខជនថ្មីដាក់ពាក្យ ឬឆ្លើយតបសម្ភាសន៍ផ្ញើទៅ ${userEmail}`
      : `ទទួលបានដំណឹងពាក្យសុំ ស្ថានភាពការងារ (Shortlisted, Offer) និងសុវត្ថិភាពគណនីផ្ញើទៅ ${userEmail}`
    : role === 'admin'
    ? `Real-time security logs, sign-in alerts, and company verification updates are sent directly to ${userEmail}`
    : role === 'employer'
    ? `Instant alerts for new applicants, CV submissions, and interview confirmations sent to ${userEmail}`
    : `Instant updates for submitted applications, shortlist status, interviews, and sign-ins sent to ${userEmail}`

  // 1. Compact Pill variant
  if (variant === 'pill') {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-700 border border-emerald-500/25 text-xs font-semibold shadow-2xs ${className}`}
        title={`Active Email Alerts: ${userEmail}`}
      >
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <Mail className="w-3.5 h-3.5 text-emerald-600" />
        <span className="truncate max-w-[200px]">
          {isKhmer ? 'Email សកម្ម' : 'Email Alerts Active'}
        </span>
      </div>
    )
  }

  // 2. Action Button / Status Badge variant
  if (variant === 'button') {
    return (
      <div
        className={`px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-500/20 flex items-center space-x-2 select-none ${className}`}
        title={`Verified Email Alerts: ${userEmail}`}
      >
        <div className="w-4 h-4 flex items-center justify-center">
          <Mail className="w-3.5 h-3.5 text-blue-100" />
        </div>
        <span className="font-bold tracking-tight">
          {isKhmer ? 'Email ជូនដំណឹងសកម្ម' : 'Email Alerts: Verified'}
        </span>
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300 ml-1" />
      </div>
    )
  }

  // 3. Featured Card variant (Ideal for Dashboard sidebar or status column)
  return (
    <div
      className={`glass-card rounded-2xl border border-blue-400/30 bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-transparent p-4 sm:p-5 relative overflow-hidden shadow-sm ${className}`}
    >
      <div className="absolute -top-10 -right-10 w-28 h-28 bg-blue-500/15 rounded-full blur-xl pointer-events-none" />

      <div className="flex items-start space-x-3.5 relative z-10">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-blue-700 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/25">
          <Mail className="w-5 h-5 text-white" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h3 className="text-xs sm:text-sm font-bold text-slate-900">
              {titleText}
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              {isKhmer ? 'សកម្ម' : 'Active'}
            </span>
          </div>

          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
            {descriptionText}
          </p>

          <div className="mt-3 flex items-center gap-3 pt-2.5 border-t border-slate-200/60 text-[11px] text-slate-500 font-medium">
            <div className="flex items-center gap-1 text-slate-700">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>{isKhmer ? 'សុវត្ថិភាពខ្ពស់' : 'Direct & Secure'}</span>
            </div>
            <span className="text-slate-300">•</span>
            <div className="flex items-center gap-1 text-slate-700">
              <Bell className="w-3.5 h-3.5 text-amber-500" />
              <span>{isKhmer ? 'ជូនដំណឹងភ្លាមៗ' : 'Instant Dispatch'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
