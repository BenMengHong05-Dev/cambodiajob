import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

export type DialogSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'

export interface DialogProps {
  isOpen: boolean
  onClose: () => void
  title?: React.ReactNode
  description?: React.ReactNode
  icon?: React.ReactNode
  iconClassName?: string
  size?: DialogSize
  children: React.ReactNode
  footer?: React.ReactNode
  closeOnOverlayClick?: boolean
  showCloseButton?: boolean
  className?: string
  contentClassName?: string
  headerClassName?: string
  bodyClassName?: string
  footerClassName?: string
}

const sizeClasses: Record<DialogSize, string> = {
  xs: 'max-w-sm',
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  '2xl': 'max-w-5xl',
  full: 'max-w-6xl',
}

export const Dialog: React.FC<DialogProps> = ({
  isOpen,
  onClose,
  title,
  description,
  icon,
  iconClassName,
  size = 'md',
  children,
  footer,
  closeOnOverlayClick = true,
  showCloseButton = true,
  className = '',
  contentClassName = '',
  headerClassName = '',
  bodyClassName = '',
  footerClassName = '',
}) => {
  const dialogRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Close on ESC key
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Lock body scroll when dialog is open
  useEffect(() => {
    if (isOpen) {
      const prevOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = prevOverflow
      }
    }
  }, [isOpen])

  if (!isOpen || !mounted) return null

  const dialogElement = (
    <div
      className={`fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto ${className}`}
      onClick={() => {
        if (closeOnOverlayClick) onClose()
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        ref={dialogRef}
        onClick={(e) => e.stopPropagation()}
        className={`bg-white rounded-3xl w-full my-auto shadow-2xl border border-gray-100 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150 text-slate-800 font-sans ${sizeClasses[size]} ${contentClassName}`}
      >
        {/* Header Bar */}
        {(title || showCloseButton) && (
          <div
            className={`px-5 py-4.5 sm:px-6 sm:py-5 bg-white border-b border-gray-100 flex items-start justify-between gap-3 shrink-0 ${headerClassName}`}
          >
            <div className="flex items-start space-x-3 min-w-0 flex-1">
              {icon && (
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border border-blue-100 bg-blue-50/80 text-blue-600 shadow-2xs ${
                    iconClassName || ''
                  }`}
                >
                  {icon}
                </div>
              )}
              <div className="min-w-0 flex-1 pt-0.5">
                {typeof title === 'string' ? (
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug tracking-tight">
                    {title}
                  </h3>
                ) : (
                  title
                )}
                {description && (
                  <div className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    {description}
                  </div>
                )}
              </div>
            </div>

            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer shrink-0 active:scale-95"
                title="Close"
                aria-label="Close"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            )}
          </div>
        )}

        {/* Dialog Body */}
        <div
          className={`p-5 sm:p-6 bg-white overflow-y-auto max-h-[75vh] leading-relaxed text-slate-700 ${bodyClassName}`}
        >
          {children}
        </div>

        {/* Optional Footer */}
        {footer && (
          <div
            className={`px-5 py-4 sm:px-6 sm:py-4.5 bg-white border-t border-gray-100 flex items-center justify-end gap-2.5 shrink-0 ${footerClassName}`}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  )

  return createPortal(dialogElement, document.body)
}

/**
 * Composable Subcomponents for flexible multi-section Dialogs
 */
export const DialogHeader: React.FC<{
  title: React.ReactNode
  description?: React.ReactNode
  icon?: React.ReactNode
  iconClassName?: string
  onClose?: () => void
  showCloseButton?: boolean
  className?: string
}> = ({
  title,
  description,
  icon,
  iconClassName,
  onClose,
  showCloseButton = true,
  className = '',
}) => (
  <div
    className={`px-5 py-4.5 sm:px-6 sm:py-5 bg-white border-b border-gray-100 flex items-start justify-between gap-3 shrink-0 ${className}`}
  >
    <div className="flex items-start space-x-3 min-w-0 flex-1">
      {icon && (
        <div
          className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border border-blue-100 bg-blue-50/80 text-blue-600 shadow-2xs ${
            iconClassName || ''
          }`}
        >
          {icon}
        </div>
      )}
      <div className="min-w-0 flex-1 pt-0.5">
        {typeof title === 'string' ? (
          <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug tracking-tight">
            {title}
          </h3>
        ) : (
          title
        )}
        {description && (
          <div className="text-xs text-slate-500 mt-0.5 leading-relaxed">
            {description}
          </div>
        )}
      </div>
    </div>

    {showCloseButton && onClose && (
      <button
        type="button"
        onClick={onClose}
        className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer shrink-0 active:scale-95"
        title="Close"
        aria-label="Close"
      >
        <X className="w-4.5 h-4.5" />
      </button>
    )}
  </div>
)

export const DialogBody: React.FC<{
  children: React.ReactNode
  className?: string
}> = ({ children, className = '' }) => (
  <div
    className={`p-5 sm:p-6 bg-white overflow-y-auto max-h-[75vh] leading-relaxed text-slate-700 ${className}`}
  >
    {children}
  </div>
)

export const DialogFooter: React.FC<{
  children: React.ReactNode
  className?: string
}> = ({ children, className = '' }) => (
  <div
    className={`px-5 py-4 sm:px-6 sm:py-4.5 bg-white border-t border-gray-100 flex items-center justify-end gap-2.5 shrink-0 ${className}`}
  >
    {children}
  </div>
)
