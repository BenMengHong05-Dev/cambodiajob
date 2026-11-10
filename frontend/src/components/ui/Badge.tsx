import React from 'react'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'neutral' | 'outline' | 'purple'
  size?: 'xs' | 'sm' | 'md'
  dot?: boolean
  pulse?: boolean
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'sm',
  dot = false,
  pulse = false,
  className = '',
  ...props
}) => {
  const sizeStyles = {
    xs: 'px-1.5 py-0.5 text-[10px] rounded-md gap-1',
    sm: 'px-2.5 py-1 text-xs rounded-lg gap-1.5',
    md: 'px-3 py-1.5 text-xs sm:text-sm rounded-xl gap-2',
  }

  const variantStyles = {
    primary: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20',
    success: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20',
    warning: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20',
    danger: 'bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/20',
    purple: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-500/20',
    neutral: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700',
    outline: 'bg-transparent text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700',
  }

  const dotColors = {
    primary: 'bg-blue-500',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-red-500',
    purple: 'bg-purple-500',
    neutral: 'bg-slate-400',
    outline: 'bg-slate-500',
  }

  return (
    <span
      className={`inline-flex items-center font-medium font-sans ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColors[variant]} ${
            pulse ? 'animate-ping' : ''
          }`}
        />
      )}
      {children}
    </span>
  )
}

