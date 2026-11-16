import React from 'react'
import { useTranslation } from 'react-i18next'
import { ExternalLink, ArrowRight, Bell } from 'lucide-react'

interface TelegramConnectButtonProps {
  variant?: 'button' | 'card' | 'pill'
  className?: string
  role?: 'job_seeker' | 'admin'
}

export const TelegramConnectButton: React.FC<TelegramConnectButtonProps> = ({
  variant = 'button',
  className = '',
  role = 'job_seeker',
}) => {
  const { i18n } = useTranslation()
  const isKhmer = i18n.language === 'km'

  const telegramUrl = 'https://t.me/CambodiaJobSupportBot'

  const buttonText = isKhmer
    ? role === 'admin'
      ? 'ភ្ជាប់ Telegram ជូនដំណឹង'
      : 'ភ្ជាប់ជាមួយ Telegram'
    : role === 'admin'
    ? 'Connect Telegram Alerts'
    : 'Connect with Telegram'

  const descriptionText = isKhmer
    ? role === 'admin'
      ? 'ទទួលដំណឹងប្រព័ន្ធ ការផ្ទៀងផ្ទាត់ និងការត្រួតពិនិត្យការងារភ្លាមៗតាម Telegram Bot (@CambodiaJobSupportBot)'
      : 'ទទួលដំណឹងពាក្យសុំការងារ កាលវិភាគសម្ភាសន៍ និងជំនួយការស្វែងរកការងារផ្ទាល់តាម Telegram Bot'
    : role === 'admin'
    ? 'Get real-time platform security, enterprise verification, and moderation alerts directly via @CambodiaJobSupportBot.'
    : 'Receive instant job alerts, application updates, and interview notifications directly via @CambodiaJobSupportBot.'

  const TelegramIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
    <svg className={`${className} fill-current shrink-0`} viewBox="0 0 24 24">
      <path d="M20.665 3.717l-17.73 6.837c-1.21.486-1.203 1.161-.222 1.462l4.552 1.42 10.532-6.645c.498-.303.953-.14.579.192l-8.533 7.701h-.002l-.002.001-.314 4.692c.46 0 .663-.211.921-.46l2.211-2.15 4.599 3.397c.848.467 1.457.227 1.668-.785l3.019-14.228c.309-1.239-.473-1.8-1.282-1.434z" />
    </svg>
  )

  // 1. Header or Toolbar Button variant
  if (variant === 'button') {
    return (
      <a
        href={telegramUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#0088cc] via-[#24A1DE] to-[#29B6F6] hover:from-[#0077b5] hover:to-[#24A1DE] text-white text-xs font-semibold shadow-md shadow-sky-500/20 active:scale-98 transition-all duration-200 flex items-center space-x-1.5 cursor-pointer group ${className}`}
        title={isKhmer ? 'ភ្ជាប់ទៅកាន់ Telegram Bot (@CambodiaJobSupportBot)' : 'Connect to Telegram Bot (@CambodiaJobSupportBot)'}
      >
        <div className="w-4 h-4 flex items-center justify-center transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5">
          <TelegramIcon className="w-3.5 h-3.5 text-white" />
        </div>
        <span className="font-bold tracking-tight">{buttonText}</span>
        <ExternalLink className="w-3 h-3 text-sky-100 opacity-80" />
      </a>
    )
  }

  // 2. Compact Pill variant
  if (variant === 'pill') {
    return (
      <a
        href={telegramUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#24A1DE]/10 hover:bg-[#24A1DE]/20 text-[#0088cc] hover:text-[#0077b5] border border-[#24A1DE]/30 text-xs font-bold transition shadow-2xs ${className}`}
        title="@CambodiaJobSupportBot"
      >
        <TelegramIcon className="w-3.5 h-3.5" />
        <span>{buttonText}</span>
      </a>
    )
  }

  // 3. Featured Card variant (Ideal for Dashboard sidebar or notification row)
  return (
    <div
      className={`glass-card rounded-2xl border border-sky-400/30 bg-gradient-to-br from-sky-500/10 via-blue-500/5 to-transparent p-4 sm:p-5 relative overflow-hidden shadow-sm ${className}`}
    >
      <div className="absolute -top-10 -right-10 w-28 h-28 bg-[#24A1DE]/15 rounded-full blur-xl pointer-events-none" />

      <div className="flex items-start space-x-3.5 relative z-10">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#0088cc] via-[#24A1DE] to-[#29B6F6] text-white flex items-center justify-center shrink-0 shadow-md shadow-sky-500/25">
          <TelegramIcon className="w-5 h-5 text-white" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="text-xs sm:text-sm font-bold text-slate-900">
              {buttonText}
            </h3>
            <span className="px-2 py-0.2 rounded-full text-[9px] font-extrabold uppercase bg-[#24A1DE]/15 text-[#0088cc] border border-[#24A1DE]/30">
              Bot
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            {descriptionText}
          </p>

          <div className="mt-3">
            <a
              href={telegramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#0088cc] to-[#24A1DE] hover:from-[#0077b5] hover:to-[#1e96d1] text-white text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
            >
              <TelegramIcon className="w-3.5 h-3.5" />
              <span>{isKhmer ? 'ភ្ជាប់ឥឡូវនេះ' : 'Connect Now'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
