import React, { forwardRef } from 'react'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'gradient'
  size?: 'xs' | 'sm' | 'md' | 'lg'
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  fullWidth?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    // Base styles
    const baseStyles =
      'inline-flex items-center justify-center font-sans font-semibold transition-all duration-200 select-none focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]'

    // Size variants
    const sizeStyles = {
      xs: 'px-2.5 py-1 text-xs rounded-lg gap-1.5',
      sm: 'px-3.5 py-1.5 text-xs rounded-xl gap-2',
      md: 'px-4 py-2.5 text-xs sm:text-sm rounded-xl gap-2',
      lg: 'px-6 py-3 text-sm sm:text-base rounded-2xl gap-2.5',
    }

    // Color variants
    const variantStyles = {
      primary:
        'bg-blue-600 hover:bg-blue-500 text-white shadow-sm shadow-blue-500/20 hover:shadow-md hover:shadow-blue-500/30 focus:ring-blue-500 border border-blue-500/40',
      secondary:
        'bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700 focus:ring-slate-400',
      outline:
        'bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:border-slate-400 focus:ring-slate-400',
      ghost:
        'bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white border border-transparent focus:ring-slate-400',
      danger:
        'bg-red-600 hover:bg-red-500 text-white shadow-sm shadow-red-500/20 hover:shadow-md hover:shadow-red-500/30 border border-red-500/40 focus:ring-red-500',
      gradient:
        'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:via-indigo-500 hover:to-blue-600 text-white shadow-md shadow-blue-600/25 hover:shadow-lg hover:shadow-blue-600/35 border border-white/10 focus:ring-indigo-500',
    }

    const widthStyle = fullWidth ? 'w-full' : ''

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${widthStyle} ${className}`}
        {...props}
      >
        {isLoading ? (
          <>
            <svg
              className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <span>Loading...</span>
          </>
        ) : (
          <>
            {leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>}
            <span>{children}</span>
            {rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'

