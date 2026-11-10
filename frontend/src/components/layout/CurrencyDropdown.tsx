import React, { useState, useRef, useEffect } from 'react'
import { usePreferences } from '../../app/providers'
import { ChevronDown, Check } from 'lucide-react'

interface CurrencyDropdownProps {
  variant?: 'light' | 'dark'
}

export const CurrencyDropdown: React.FC<CurrencyDropdownProps> = ({ variant = 'light' }) => {
  const { currency, setCurrency } = usePreferences()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false)
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  const isDark = variant === 'dark'

  const currencies = [
    { code: 'USD', symbol: '$', label: 'USD ($)' },
    { code: 'KHR', symbol: '៛', label: 'KHR (៛)' },
  ]

  const current = currencies.find((c) => c.code === currency) || currencies[0]

  const triggerClasses = isDark
    ? 'bg-slate-800/80 hover:bg-slate-700/80 border-slate-700/80 text-slate-200'
    : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 hover:text-slate-900 shadow-sm'

  const menuClasses = isDark
    ? 'bg-slate-900 border-slate-800 text-white shadow-xl shadow-black/40'
    : 'bg-white border-slate-100 text-slate-800 shadow-xl'

  return (
    <div className="relative inline-block text-left font-sans" ref={dropdownRef}>
      {/* Modern, Clean Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center space-x-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-xl border transition-all duration-150 focus:outline-none ${triggerClasses}`}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <span className="font-bold text-blue-500">{current.symbol}</span>
        <span className="font-bold">{current.code}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform duration-200 text-slate-400 ${
            isOpen ? 'rotate-180 text-blue-500' : ''
          }`}
        />
      </button>

      {/* Clean, Direct Menu */}
      {isOpen && (
        <div
          className={`absolute right-0 mt-1.5 w-32 rounded-xl border p-1 z-50 animate-in fade-in zoom-in-95 duration-100 ${menuClasses}`}
        >
          {currencies.map((c) => {
            const isSelected = c.code === currency
            return (
              <button
                key={c.code}
                type="button"
                onClick={() => {
                  setCurrency(c.code as 'USD' | 'KHR')
                  setIsOpen(false)
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  isSelected
                    ? isDark
                      ? 'bg-blue-600/20 text-blue-400 font-semibold'
                      : 'bg-blue-50 text-blue-600 font-semibold'
                    : isDark
                    ? 'hover:bg-slate-800 text-slate-300'
                    : 'hover:bg-slate-100 text-slate-700'
                }`}
              >
                <span>{c.label}</span>
                {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
