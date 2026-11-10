import React from 'react'
import { usePreferences } from '../../app/providers'

export interface LanguageDropdownProps {
  className?: string
  variant?: 'light' | 'dark' | 'glass'
  size?: 'sm' | 'md'
  showGlobe?: boolean
}

// 1. UK Flag SVG Icon (English)
export const UKFlagIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 32 32" className={`shrink-0 rounded-full shadow-2xs ${className}`} aria-hidden="true">
    <mask id="uk-flag-mask">
      <circle cx="16" cy="16" r="16" fill="#fff" />
    </mask>
    <g mask="url(#uk-flag-mask)">
      <rect width="32" height="32" fill="#012169" />
      <path d="M0,0 L32,32 M32,0 L0,32" stroke="#ffffff" strokeWidth="6" strokeLinecap="square" />
      <path d="M0,0 L32,32 M32,0 L0,32" stroke="#c8102e" strokeWidth="3.5" strokeLinecap="square" />
      <path d="M16,0 V32 M0,16 H32" stroke="#ffffff" strokeWidth="9" />
      <path d="M16,0 V32 M0,16 H32" stroke="#c8102e" strokeWidth="5.5" />
    </g>
  </svg>
)

// 2. Cambodia Flag SVG Icon (Khmer)
export const KhmerFlagIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 32 32" className={`shrink-0 rounded-full shadow-2xs ${className}`} aria-hidden="true">
    <mask id="kh-flag-mask">
      <circle cx="16" cy="16" r="16" fill="#fff" />
    </mask>
    <g mask="url(#kh-flag-mask)">
      {/* Top Blue Stripe */}
      <rect x="0" y="0" width="32" height="8" fill="#032ea1" />
      {/* Middle Red Stripe */}
      <rect x="0" y="8" width="32" height="16" fill="#e00025" />
      {/* Bottom Blue Stripe */}
      <rect x="0" y="24" width="32" height="8" fill="#032ea1" />
      {/* Angkor Wat Silhouette in White */}
      <g fill="#ffffff">
        <rect x="7" y="20.5" width="18" height="1.8" rx="0.5" />
        <rect x="8.5" y="19.2" width="15" height="1.3" />
        <rect x="9.5" y="17.2" width="13" height="2" />
        {/* Main Central Tower */}
        <polygon points="16,9.5 14.5,13.2 17.5,13.2" />
        <rect x="14.8" y="13.2" width="2.4" height="4" />
        {/* Left Tower */}
        <polygon points="12,12 11,14.8 13,14.8" />
        <rect x="11.2" y="14.8" width="1.6" height="2.4" />
        {/* Right Tower */}
        <polygon points="20,12 19,14.8 21,14.8" />
        <rect x="19.2" y="14.8" width="1.6" height="2.4" />
      </g>
    </g>
  </svg>
)

export const LanguageDropdown: React.FC<LanguageDropdownProps> = ({ className = '' }) => {
  const { language, setLanguage } = usePreferences()

  return (
    <div
      className={`inline-flex items-center p-0.5 rounded-full bg-white/80 backdrop-blur-md border border-white/80 shadow-2xs gap-0.5 ${className}`}
    >
      <button
        type="button"
        onClick={() => setLanguage('en')}
        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-150 cursor-pointer ${
          language === 'en'
            ? 'bg-white shadow-xs scale-105 ring-1 ring-blue-500/25'
            : 'opacity-50 hover:opacity-100 hover:bg-white/60'
        }`}
        title="English"
        aria-label="Switch to English"
      >
        <UKFlagIcon className="w-5 h-5" />
      </button>

      <button
        type="button"
        onClick={() => setLanguage('km')}
        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-150 cursor-pointer ${
          language === 'km'
            ? 'bg-white shadow-xs scale-105 ring-1 ring-blue-500/25'
            : 'opacity-50 hover:opacity-100 hover:bg-white/60'
        }`}
        title="ភាសាខ្មែរ"
        aria-label="ប្តូរទៅជាភាសាខ្មែរ"
      >
        <KhmerFlagIcon className="w-5 h-5" />
      </button>
    </div>
  )
}
