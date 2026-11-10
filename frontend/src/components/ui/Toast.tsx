import React, { createContext, useContext, useState, useCallback } from 'react'
import { CheckCircle2, AlertCircle, Info, Loader2, X } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'info' | 'loading'

export interface ToastMessage {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number
}

interface ToastContextType {
  toast: {
    success: (title: string, message?: string, duration?: number) => string
    error: (title: string, message?: string, duration?: number) => string
    info: (title: string, message?: string, duration?: number) => string
    loading: (title: string, message?: string) => string
    dismiss: (id: string) => void
  }
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const addToast = useCallback(
    (type: ToastType, title: string, message?: string, duration = 4000) => {
      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const newToast: ToastMessage = { id, type, title, message, duration }

      setToasts((prev) => [...prev, newToast])

      if (duration > 0 && type !== 'loading') {
        setTimeout(() => {
          dismiss(id)
        }, duration)
      }

      return id
    },
    [dismiss]
  )

  const toast = {
    success: (title: string, message?: string, duration = 4000) =>
      addToast('success', title, message, duration),
    error: (title: string, message?: string, duration = 5000) =>
      addToast('error', title, message, duration),
    info: (title: string, message?: string, duration = 4000) =>
      addToast('info', title, message, duration),
    loading: (title: string, message?: string) =>
      addToast('loading', title, message, 0),
    dismiss,
  }

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast Notification Container */}
      <div
        aria-live="assertive"
        className="fixed top-4 right-4 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
      >
        {toasts.map((t) => {
          const isSuccess = t.type === 'success'
          const isError = t.type === 'error'
          const isInfo = t.type === 'info'
          const isLoading = t.type === 'loading'

          return (
            <div
              key={t.id}
              role="alert"
              className="pointer-events-auto flex items-start space-x-3 bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-xl shadow-slate-900/10 border border-slate-200/90 text-slate-800 animate-in fade-in slide-in-from-top-3 duration-200 transition-all font-sans"
            >
              {/* Type Badge Icon */}
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                  isSuccess
                    ? 'bg-emerald-50 text-emerald-600 border-emerald-200/80'
                    : isError
                    ? 'bg-rose-50 text-rose-600 border-rose-200/80'
                    : isLoading
                    ? 'bg-blue-50 text-blue-600 border-blue-200/80'
                    : 'bg-indigo-50 text-indigo-600 border-indigo-200/80'
                }`}
              >
                {isSuccess && <CheckCircle2 className="w-5 h-5 stroke-[2.2]" />}
                {isError && <AlertCircle className="w-5 h-5 stroke-[2.2]" />}
                {isLoading && <Loader2 className="w-5 h-5 animate-spin" />}
                {isInfo && <Info className="w-5 h-5 stroke-[2.2]" />}
              </div>

              {/* Text details */}
              <div className="flex-1 min-w-0 pt-0.5">
                <h4 className="text-xs font-bold text-slate-900 leading-tight truncate">
                  {t.title}
                </h4>
                {t.message && (
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                    {t.message}
                  </p>
                )}
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition shrink-0"
                aria-label="Close notification"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

