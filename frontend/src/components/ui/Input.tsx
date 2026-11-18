import React, { forwardRef } from 'react'
import { AlertCircle } from 'lucide-react'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  variant?: 'light' | 'dark' | 'glass'
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      variant = 'light',
      id,
      className = '',
      required,
      disabled,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)

    const isDark = variant === 'dark'
    const isGlass = variant === 'glass'

    const containerBg = isGlass
      ? 'bg-white/10 border-white/20 text-white placeholder-slate-300 hover:bg-white/15 focus:bg-white/20 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 backdrop-blur-md'
      : isDark
        ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500 hover:border-slate-600 focus:bg-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
        : 'bg-slate-50 border-gray-200 text-slate-900 placeholder-slate-400 font-medium hover:border-gray-300 hover:bg-slate-100/60 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10'

    const errorBorder = error
      ? '!border-red-500 !focus:border-red-500 focus:!ring-red-500/15'
      : ''

    return (
      <div className="w-full space-y-1.5 font-sans">
        {label && (
          <label
            htmlFor={inputId}
            className={`block text-xs font-semibold ${isDark || isGlass ? 'text-slate-300' : 'text-slate-700'
              }`}
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <div className="relative flex items-center">
          {leftIcon && (
            <div
              className={`absolute left-3.5 flex items-center pointer-events-none ${isGlass ? 'text-slate-300' : isDark ? 'text-slate-400' : 'text-slate-400'
                }`}
            >
              {leftIcon}
            </div>
          )}

          <input
            id={inputId}
            ref={ref}
            disabled={disabled}
            required={required}
            className={`w-full py-2 px-3.5 min-h-[38px] text-xs sm:text-sm rounded-xl border transition-all duration-150 outline-none disabled:opacity-50 disabled:bg-slate-100 disabled:cursor-not-allowed ${leftIcon ? 'pl-10' : ''
              } ${rightIcon || error ? 'pr-10' : ''} ${containerBg} ${errorBorder} ${className}`}
            {...props}
          />

          {rightIcon && !error && (
            <div className="absolute right-3.5 flex items-center text-slate-400">
              {rightIcon}
            </div>
          )}

          {error && (
            <div className="absolute right-3.5 flex items-center text-red-500">
              <AlertCircle className="w-4 h-4" />
            </div>
          )}
        </div>

        {error && (
          <p className="text-xs font-medium text-red-500 flex items-center mt-1">
            <span>{error}</span>
          </p>
        )}

        {helperText && !error && (
          <p
            className={`text-[11px] mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'
              }`}
          >
            {helperText}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

