import React from 'react'
import { useTranslation } from 'react-i18next'
import { Moon, Sun } from 'lucide-react'
import { usePreferences } from '../../app/providers'

interface ThemeToggleProps {
  className?: string
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '' }) => {
  const { theme, toggleTheme } = usePreferences()
  const { i18n } = useTranslation()
  const isKhmer = i18n.language === 'km'
  const isDark = theme === 'dark'

  const label = isDark
    ? isKhmer
      ? 'ប្តូរទៅផ្ទៃភ្លឺ'
      : 'Switch to Light Mode'
    : isKhmer
    ? 'ប្តូរទៅផ្ទៃងងឹត'
    : 'Switch to Dark Mode'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={label}
      aria-label={label}
      className={`p-2 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-amber-400 hover:text-blue-600 dark:hover:text-amber-300 transition shadow-2xs cursor-pointer flex items-center justify-center active:scale-95 ${className}`}
    >
      {isDark ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
    </button>
  )
}
