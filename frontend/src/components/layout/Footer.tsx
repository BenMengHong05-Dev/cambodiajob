import React from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useSiteSettings } from '../../app/providers'
import { Briefcase, MapPin, Mail, Phone, Bell } from 'lucide-react'

export const Footer: React.FC = () => {
  const { t, i18n } = useTranslation()
  const { siteName, logoUrl, footerText, contactEmail, contactPhone, contactAddress, settings } = useSiteSettings()
  const isKhmer = i18n.language === 'km'

  const regions = [
    { km: 'រាជធានីភ្នំពេញ', en: 'Phnom Penh', param: 'Phnom Penh' },
    { km: 'ខេត្តសៀមរាប', en: 'Siem Reap', param: 'Siem Reap' },
    { km: 'ខេត្តបាត់ដំបង', en: 'Battambang', param: 'Battambang' },
    { km: 'ខេត្តព្រះសីហនុ', en: 'Sihanoukville', param: 'Preah Sihanouk' },
    { km: 'ខេត្តកំពង់ចាម', en: 'Kampong Cham', param: 'Kampong Cham' },
    { km: 'ខេត្តកំពត', en: 'Kampot', param: 'Kampot' },
    { km: 'ក្រុងប៉ោយប៉ែត', en: 'Poipet', param: 'Poipet' },
    { km: 'ក្រុងបាវិត', en: 'Bavet', param: 'Bavet' },
  ]

  return (
    <footer className="bg-slate-900 dark:bg-[#050811] text-slate-300 pt-14 pb-10 border-t border-slate-800/90">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-10 mb-10">
          {/* Brand & Overview */}
          <div className="md:col-span-1">
            <div className="flex items-center space-x-2.5 mb-3.5">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={siteName}
                  className="h-9 w-auto max-w-[160px] object-contain shrink-0 brightness-110"
                />
              ) : (
                <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-600/30 shrink-0">
                  <Briefcase className="w-4.5 h-4.5" />
                </div>
              )}
              <span className="font-black text-xl text-white tracking-tight truncate">
                {siteName}
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              {footerText || t('footer.tagline')}
            </p>
            <div className="space-y-2.5 text-xs text-slate-400">
              <div className="flex items-center">
                <MapPin className="w-4 h-4 mr-2.5 text-blue-500 shrink-0" />
                <span>{contactAddress || t('footer.location')}</span>
              </div>
              <div className="flex items-center">
                <Mail className="w-4 h-4 mr-2.5 text-blue-500 shrink-0" />
                <a href={`mailto:${contactEmail}`} className="hover:text-blue-400 transition truncate">
                  {contactEmail}
                </a>
              </div>
              <div className="flex items-center">
                <Phone className="w-4 h-4 mr-2.5 text-blue-500 shrink-0" />
                <a href={`tel:${contactPhone.replace(/\s+/g, '')}`} className="hover:text-blue-400 transition">
                  {contactPhone}
                </a>
              </div>
              <div className="flex items-center">
                <Bell className="w-4 h-4 mr-2.5 text-blue-400 shrink-0" />
                <span className="text-slate-400">
                  {isKhmer ? 'ការជូនដំណឹងតាម Email ភ្លាមៗ' : 'Real-time Email Alerts'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Links for Job Seekers */}
          <div>
            <h4 className="text-xs font-bold text-white tracking-wider uppercase mb-3.5">
              {t('footer.jobSeekers')}
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <Link to="/jobs" className="hover:text-blue-400 hover:translate-x-0.5 transition-all inline-block">
                  {t('footer.searchVacancies')}
                </Link>
              </li>
              <li>
                <Link to="/jobs?experience_level=fresh_graduate" className="hover:text-blue-400 hover:translate-x-0.5 transition-all inline-block">
                  {t('footer.freshGrad')}
                </Link>
              </li>
              <li>
                <Link to="/jobs?workplace_type=remote" className="hover:text-blue-400 hover:translate-x-0.5 transition-all inline-block">
                  {t('footer.remoteWork')}
                </Link>
              </li>
              <li>
                <Link to="/seeker/profile" className="hover:text-blue-400 hover:translate-x-0.5 transition-all inline-block">
                  {t('footer.uploadResume')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Employers */}
          <div>
            <h4 className="text-xs font-bold text-white tracking-wider uppercase mb-3.5">
              {t('footer.employers')}
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <Link to="/employer/jobs/new" className="hover:text-blue-400 hover:translate-x-0.5 transition-all inline-block">
                  {t('footer.postJob')}
                </Link>
              </li>
              <li>
                <Link to="/employer/dashboard" className="hover:text-blue-400 hover:translate-x-0.5 transition-all inline-block">
                  {t('footer.employerPortal')}
                </Link>
              </li>
              <li>
                <Link to="/companies" className="hover:text-blue-400 hover:translate-x-0.5 transition-all inline-block">
                  {t('footer.companyDirectory')}
                </Link>
              </li>
              <li>
                <Link to="/employer/company" className="hover:text-blue-400 hover:translate-x-0.5 transition-all inline-block">
                  {t('footer.companyVerification')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Regions Covered */}
          <div>
            <h4 className="text-xs font-bold text-white tracking-wider uppercase mb-3.5">
              {t('footer.majorRegions')}
            </h4>
            <div className="flex flex-wrap gap-1.5 text-[11px]">
              {regions.map((r) => (
                <Link
                  key={r.en}
                  to={`/jobs?province=${encodeURIComponent(r.param)}`}
                  className="px-2.5 py-1 rounded-lg bg-slate-800/90 text-slate-300 border border-slate-700/60 hover:border-blue-500/50 hover:bg-blue-600/15 hover:text-blue-400 transition-all font-medium"
                >
                  {isKhmer ? r.km : r.en}
                </Link>
              ))}
            </div>
            <p className="mt-3.5 text-[11px] text-slate-400 font-medium">
              {t('footer.timezone')}
            </p>
          </div>
        </div>

        {/* Bottom Bar: Clean copyright and workforce notice without heart icon */}
        <div className="border-t border-slate-800/80 pt-5 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400">
          <p>
            © {new Date().getFullYear()} {siteName}. {t('footer.copyright')}
          </p>
          <p className="mt-2 sm:mt-0 font-medium text-slate-400">
            {t('footer.crafted')}
          </p>
        </div>
      </div>
    </footer>
  )
}
