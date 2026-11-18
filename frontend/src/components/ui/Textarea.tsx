import React, { forwardRef } from 'react'
import { AlertCircle } from 'lucide-react'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  helperText?: string
  variant?: 'light' | 'dark' | 'glass'
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      error,
      helperText,
      variant = 'light',
      id,
      className = '',
      required,
      disabled,
      rows = 4,
      ...props
    },
    ref
  ) => {
    const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)

    const isDark = variant === 'dark'
    const isGlass = variant === 'glass'

    // Flat Design Container Background & Border
    const containerBg = isGlass
      ? 'bg-white/10 border-white/20 text-white placeholder-slate-300 hover:bg-white/15 focus:bg-white/20 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 backdrop-blur-md'
      : isDark
      ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500 hover:border-slate-600 focus:bg-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
      : 'bg-slate-50 border-gray-200 text-slate-900 placeholder-slate-400 hover:border-gray-300 hover:bg-slate-100/60 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10'

    const errorBorder = error
      ? '!border-red-500 !focus:border-red-500 focus:!ring-red-500/15'
      : ''

    return (
      <div className="w-full space-y-1.5 font-sans">
        {label && (
          <label
            htmlFor={textareaId}
            className={`block text-xs font-semibold ${
              isDark || isGlass ? 'text-slate-300' : 'text-slate-700'
            }`}
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <div className="relative">
          <textarea
            id={textareaId}
            ref={ref}
            rows={rows}
            disabled={disabled}
            required={required}
            className={`w-full p-3.5 text-xs sm:text-sm font-medium rounded-xl border transition-all duration-150 outline-none resize-y leading-relaxed disabled:opacity-50 disabled:bg-slate-100 disabled:cursor-not-allowed ${containerBg} ${errorBorder} ${className}`}
            {...props}
          />

          {error && (
            <div className="absolute top-3 right-3 flex items-center text-red-500">
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
            className={`text-[11px] mt-1 ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            {helperText}
          </p>
        )}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'
