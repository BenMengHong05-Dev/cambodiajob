import React from 'react'
import { usePreferences } from '../../app/providers'
import { useTranslation } from 'react-i18next'
import { Sun, Moon } from 'lucide-react'

export interface ThemeToggleProps {
  className?: string
  variant?: 'light' | 'dark' | 'glass'
  size?: 'sm' | 'md'
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  className = '',
  variant = 'light',
  size = 'md',
}) => {
  const { theme, toggleTheme } = usePreferences()
  const { i18n } = useTranslation()
  const isKhmer = i18n.language === 'km'
  const isDark = theme === 'dark'

  const sizeClasses = size === 'sm' ? 'w-8 h-8 p-1.5' : 'w-9 h-9 p-2'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`relative inline-flex items-center justify-center rounded-full transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/40 select-none ${
        variant === 'glass'
          ? 'bg-white/40 dark:bg-slate-800/60 border border-white/60 dark:border-slate-700/60 text-slate-700 dark:text-slate-200 hover:bg-white/70 dark:hover:bg-slate-800/90 shadow-2xs'
          : isDark
          ? 'bg-slate-800/90 border border-slate-700/90 text-amber-400 hover:bg-slate-800 hover:border-amber-400/40 shadow-sm hover:scale-105 active:scale-95'
          : 'bg-white/90 border border-slate-200/90 text-slate-600 hover:text-blue-600 hover:border-blue-400/40 hover:bg-white shadow-2xs hover:scale-105 active:scale-95'
      } ${sizeClasses} ${className}`}
      title={
        isDark
          ? isKhmer
            ? 'ប្ដូរទៅទម្រង់ភ្លឺ (Light Mode)'
            : 'Switch to Light Mode'
          : isKhmer
          ? 'ប្ដូរទៅទម្រង់ងងឹត (Dark Mode)'
          : 'Switch to Dark Mode'
      }
      aria-label="Toggle Dark / Light Mode"
    >
      <div className="relative w-4 h-4 flex items-center justify-center">
        {isDark ? (
          <Sun className="w-4 h-4 text-amber-400 transition-transform duration-300 rotate-0 scale-100" />
        ) : (
          <Moon className="w-4 h-4 text-slate-600 dark:text-slate-300 transition-transform duration-300 -rotate-12 scale-100" />
        )}
      </div>
    </button>
  )
}
