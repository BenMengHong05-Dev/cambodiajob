import React, { useState, useRef, useEffect, Children, isValidElement, useMemo } from 'react'
import { ChevronDown, Check, AlertCircle, Search, X } from 'lucide-react'

export interface SelectOptionItem {
  value: string | number
  label: string
  description?: string
  icon?: React.ReactNode
  disabled?: boolean
}

export interface SelectProps {
  label?: string
  placeholder?: string
  searchPlaceholder?: string
  noResultsText?: string
  searchable?: boolean
  value?: string | number
  onChange?: (e: any) => void
  options?: SelectOptionItem[]
  children?: React.ReactNode
  error?: string
  helperText?: string
  leftIcon?: React.ReactNode
  variant?: 'light' | 'dark' | 'glass'
  size?: 'sm' | 'md' | 'lg'
  align?: 'left' | 'right'
  disabled?: boolean
  required?: boolean
  className?: string
  id?: string
  name?: string
}

export const Select: React.FC<SelectProps> = ({
  label,
  placeholder = 'Select an option...',
  searchPlaceholder,
  noResultsText,
  searchable,
  value,
  onChange,
  options: propOptions,
  children,
  error,
  helperText,
  leftIcon,
  variant = 'light',
  size = 'md',
  align = 'left',
  disabled = false,
  required = false,
  className = '',
  id,
  name,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // 1. Extract options from either propOptions or children <option> elements
  const options: SelectOptionItem[] = React.useMemo(() => {
    if (propOptions && propOptions.length > 0) {
      return propOptions
    }
    const extracted: SelectOptionItem[] = []
    if (children) {
      Children.forEach(children, (child) => {
        if (isValidElement(child)) {
          const props = child.props as any
          extracted.push({
            value: props.value !== undefined ? props.value : '',
            label: typeof props.children === 'string' ? props.children : String(props.children || ''),
            disabled: props.disabled,
          })
        }
      })
    }
    return extracted
  }, [propOptions, children])

  // Auto-detect searchability: enabled if > 5 options, or if explicitly configured
  const isSearchable = searchable ?? options.length > 5

  // Filter options based on user search query
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options
    const q = searchQuery.toLowerCase().trim()
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) ||
        (opt.description && opt.description.toLowerCase().includes(q))
    )
  }, [options, searchQuery])

  // Find currently selected item
  const selectedOption = options.find((opt) => String(opt.value) === String(value))
  
  // Distinguish true selected value from empty placeholder options like { value: '', label: 'Select...' }
  const isSelected = Boolean(
    selectedOption &&
    selectedOption.value !== '' &&
    selectedOption.value !== undefined &&
    selectedOption.value !== null &&
    value !== '' &&
    value !== undefined &&
    value !== null
  )

  // Reset query and focus search input on open
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('')
      if (isSearchable) {
        setTimeout(() => searchInputRef.current?.focus(), 40)
      }
    }
  }, [isOpen, isSearchable])

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
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

  const handleSelect = (opt: SelectOptionItem) => {
    if (opt.disabled || disabled) return
    setIsOpen(false)

    if (onChange) {
      // Provide standard event target shape so (e) => setVal(e.target.value) works seamlessly
      const syntheticEvent = {
        target: {
          name: name || id,
          value: opt.value,
        },
      }
      onChange(syntheticEvent as any)
    }
  }

  const isDark = variant === 'dark'
  const isGlass = variant === 'glass'

  const sizeClasses = {
    sm: 'py-1.5 px-3 text-xs rounded-xl',
    md: 'py-2 px-3.5 text-xs sm:text-sm rounded-xl min-h-[38px]',
    lg: 'py-2.5 px-4 text-sm sm:text-base rounded-2xl min-h-[44px]',
  }[size]

  const chevronSize = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  }[size]

  const optionPadding = {
    sm: 'px-3 py-1.5 text-xs rounded-lg',
    md: 'px-3 py-2 text-xs sm:text-sm rounded-xl',
    lg: 'px-4 py-2.5 text-sm rounded-xl',
  }[size]

  const popoverAlign = align === 'right' ? 'right-0 left-auto min-w-[190px]' : 'left-0 right-0 min-w-full'

  // Flat Design Trigger styling matching Input & Textarea - stable color when open
  const triggerBg = isGlass
    ? 'bg-white/10 border-white/20 text-white hover:bg-white/15 backdrop-blur-md'
    : isDark
      ? 'bg-slate-900 border-slate-700 text-white hover:border-slate-600'
      : 'bg-slate-50 border-gray-200 text-slate-900 hover:bg-slate-100/60 hover:border-gray-300'

  // Crisp elevated popover surface with defined border & depth
  const popoverBg = isGlass
    ? 'bg-slate-900/98 border border-slate-700 text-white shadow-xl'
    : isDark
      ? 'bg-slate-900 border border-slate-700 text-white shadow-xl'
      : 'bg-white border border-gray-200 text-slate-900 shadow-xl'

  return (
    <div className={`w-full space-y-1.5 font-sans relative ${isOpen ? 'z-[9999]' : 'z-10'} ${className}`} ref={containerRef}>
      {/* Label */}
      {label && (
        <label
          className={`block text-xs font-semibold ${isDark || isGlass ? 'text-slate-300' : 'text-slate-700'
            }`}
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* HeroUI Trigger Button */}
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            !disabled && setIsOpen(!isOpen)
          }
        }}
        className={`w-full ${sizeClasses} border flex items-center justify-between transition-all duration-150 cursor-pointer select-none outline-none ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-100' : triggerBg
          } ${error ? 'border-red-500 focus:ring-red-500/20' : ''}`}
      >
        <div className="flex items-center space-x-2 min-w-0 flex-1 pr-1.5">
          {leftIcon && (
            <span className={`${isGlass ? 'text-slate-300' : 'text-slate-400'} shrink-0 flex items-center`}>
              {leftIcon}
            </span>
          )}

          {!leftIcon && selectedOption && selectedOption.icon && (
            <span className="shrink-0 flex items-center">
              {selectedOption.icon}
            </span>
          )}

          <span
            className={`truncate ${size === 'sm' ? 'text-xs' : 'text-xs sm:text-sm'} ${
              isSelected
                ? isDark || isGlass
                  ? 'text-white font-medium'
                  : 'text-slate-900 font-medium'
                : isGlass
                  ? 'text-slate-300 font-normal'
                  : 'text-slate-400 font-medium'
            }`}
          >
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>

        {/* Chevron Arrow */}
        <ChevronDown
          className={`${chevronSize} shrink-0 ${
            isDark || isGlass ? 'text-slate-300' : 'text-slate-400'
          }`}
        />
      </div>

      {/* HeroUI Dropdown Popover Listbox */}
      {isOpen && (
        <div
          role="listbox"
          style={{ backgroundColor: isDark || isGlass ? undefined : '#ffffff', opacity: 1 }}
          className={`absolute ${popoverAlign} mt-1.5 max-h-72 flex flex-col rounded-2xl border p-1.5 z-[9999] select-popover shadow-2xl animate-in fade-in zoom-in-95 duration-100 ${popoverBg}`}
        >

          {isSearchable && (
            <div className="p-1 pb-1.5 mb-1 border-b border-slate-200/40 dark:border-slate-700/50 shrink-0">
              <div className="relative flex items-center">
                <Search
                  className={`w-3.5 h-3.5 absolute left-2.5 pointer-events-none ${isGlass || isDark ? 'text-slate-400' : 'text-slate-400'
                    }`}
                />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={searchPlaceholder || 'Search options...'}
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => {
                    e.stopPropagation()
                    if (e.key === 'Escape') setIsOpen(false)
                  }}
                  className={`w-full pl-8 pr-7 py-1.5 text-xs rounded-xl border outline-none transition font-normal ${isGlass
                    ? 'bg-white/10 border-white/20 text-white placeholder-slate-400 focus:border-blue-400 focus:bg-white/15'
                    : isDark
                      ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-400 focus:border-blue-500'
                      : 'bg-slate-50 border-gray-200 text-slate-800 placeholder-slate-400 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-100 shadow-2xs'
                    }`}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setSearchQuery('')
                      searchInputRef.current?.focus()
                    }}
                    className={`absolute right-2 p-0.5 rounded-full hover:bg-white/20 transition ${isGlass || isDark ? 'text-slate-400 hover:text-white' : 'text-slate-400 hover:text-slate-600'
                      }`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Options List */}
          <div className="overflow-y-auto max-h-56 space-y-0.5 flex-1 pr-0.5">
            {filteredOptions.length === 0 ? (
              <div className="py-4 text-center text-xs text-slate-400">
                {noResultsText || 'No matching options found'}
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isItemOptionSelected = Boolean(
                  value !== '' &&
                  value !== undefined &&
                  value !== null &&
                  opt.value !== '' &&
                  opt.value !== undefined &&
                  opt.value !== null &&
                  String(opt.value) === String(value)
                )
                return (
                  <div
                    key={String(opt.value)}
                    role="option"
                    aria-selected={isItemOptionSelected}
                    onClick={() => handleSelect(opt)}
                    className={`w-full flex items-center justify-between ${optionPadding} cursor-pointer transition-all border ${opt.disabled
                      ? 'opacity-40 cursor-not-allowed border-transparent'
                      : isItemOptionSelected
                        ? isDark || isGlass
                          ? 'bg-blue-600/25 text-blue-300 font-medium border-blue-500/40 shadow-2xs'
                          : 'bg-blue-50 text-blue-600 font-medium border-blue-200 shadow-2xs'
                        : isDark || isGlass
                          ? 'border-transparent hover:bg-slate-800 text-slate-300 hover:text-white'
                          : 'border-transparent hover:bg-slate-50 text-slate-700 hover:text-slate-900'
                      }`}
                  >
                    <div className="flex items-center space-x-2.5 min-w-0 flex-1 pr-2">
                      {opt.icon && <span className="shrink-0 flex items-center">{opt.icon}</span>}
                      <div className="min-w-0 flex-1 flex items-center justify-between">
                        <p className="truncate leading-tight font-normal text-xs sm:text-sm">{opt.label}</p>
                        {opt.description && opt.description !== opt.label && (
                          <span
                            className={`text-[10px] uppercase font-normal tracking-wider px-1.5 py-0.5 rounded ml-2 shrink-0 ${isDark || isGlass
                              ? 'bg-slate-800 text-slate-400 border border-slate-700'
                              : 'bg-slate-100 text-slate-500 border border-slate-200/70'
                              }`}
                          >
                            {opt.description}
                          </span>
                        )}
                      </div>
                    </div>

                    {isItemOptionSelected && (
                      <Check
                        className={`w-4 h-4 shrink-0 stroke-[2.5] ml-1.5 ${isDark || isGlass ? 'text-blue-400' : 'text-blue-600'
                          }`}
                      />
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <p className="text-xs font-medium text-red-500 flex items-center mt-1">
          <AlertCircle className="w-3.5 h-3.5 mr-1 shrink-0" />
          <span>{error}</span>
        </p>
      )}

      {/* Helper Text */}
      {helperText && !error && (
        <p className={`text-[11px] mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          {helperText}
        </p>
      )}
    </div>
  )
}
