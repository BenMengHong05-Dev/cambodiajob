import React, { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight, ChevronDown, Check } from 'lucide-react'

export interface TablePaginationProps {
  currentPage: number
  pageSize: number
  totalItems: number
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  pageSizeOptions?: number[]
  className?: string
  transparent?: boolean
}

export const TablePagination: React.FC<TablePaginationProps> = ({
  currentPage,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [25, 50, 100],
  className = '',
  transparent = false,
}) => {
  const { i18n } = useTranslation()
  const isKhmer = i18n.language === 'km'
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown on click outside or escape key
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsDropdownOpen(false)
      }
    }

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isDropdownOpen])

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))

  // Generate page numbers with ellipsis windowing
  const getPageNumbers = (): (number | string)[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }

    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, '...', totalPages]
    }

    if (currentPage >= totalPages - 3) {
      return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
    }

    return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages]
  }

  const pages = getPageNumbers()

  return (
    <div
      className={
        transparent
          ? `py-3 px-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-sans ${className}`
          : `px-5 py-3.5 bg-white/80 backdrop-blur-md border-t border-slate-200/70 rounded-b-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-sans ${className}`
      }
    >
      {/* Left Side: Summary text first, Page size select dropdown second */}
      <div className="flex items-center gap-3">
        {/* Page Summary Context - First */}
        <div className="text-xs text-slate-500 font-medium select-none">
          <span>
            {isKhmer ? 'ទំព័រទី' : 'Page'}{' '}
            <strong className="text-slate-700 font-bold">{currentPage}</strong>{' '}
            {isKhmer ? 'នៃ' : 'of'}{' '}
            <strong className="text-slate-700 font-bold">{totalPages}</strong>
            {totalItems > 0 && (
              <span className="text-slate-400 ml-1">
                ({totalItems} {isKhmer ? 'ទិន្នន័យ' : 'items'})
              </span>
            )}
          </span>
        </div>

        {/* Flat Design Page Size Select */}
        <div className="relative inline-flex items-center" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsDropdownOpen((prev) => !prev)}
            aria-expanded={isDropdownOpen}
            aria-haspopup="listbox"
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition select-none outline-none ${
              isDropdownOpen
                ? 'bg-white border-blue-500 ring-2 ring-blue-500/10 text-slate-900'
                : 'bg-slate-50 border-gray-200 text-slate-700 hover:border-gray-300 hover:bg-slate-100/60'
            }`}
            title={isKhmer ? 'ជ្រើសរើសចំនួនទិន្នន័យក្នុងមួយទំព័រ' : 'Rows per page'}
          >
            <span>
              {pageSize} <span className="font-normal text-slate-400">/ {isKhmer ? 'ទំព័រ' : 'page'}</span>
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform duration-200 ${
                isDropdownOpen ? 'rotate-180 text-blue-600' : 'text-slate-400'
              }`}
            />
          </button>

          {isDropdownOpen && (
            <div
              role="listbox"
              style={{ backgroundColor: '#ffffff', opacity: 1 }}
              className="absolute left-0 bottom-full mb-2 w-32 bg-white border border-gray-200 rounded-xl shadow-xl p-1 z-[99999] select-popover animate-in fade-in zoom-in-95 duration-100"
            >
              <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-1">
                {isKhmer ? 'ចំនួនក្នុង១ទំព័រ' : 'Rows per page'}
              </div>
              <div className="space-y-0.5">
                {pageSizeOptions.map((opt) => {
                  const isSelected = opt === pageSize
                  return (
                    <button
                      key={opt}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => {
                        onPageSizeChange(opt)
                        onPageChange(1)
                        setIsDropdownOpen(false)
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-lg cursor-pointer transition ${
                        isSelected
                          ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-100'
                          : 'border border-transparent hover:bg-slate-100 text-slate-700 hover:text-slate-900 font-medium'
                      }`}
                    >
                      <span>
                        {opt} <span className="text-[11px] font-normal text-slate-400">/ {isKhmer ? 'ទំព័រ' : 'page'}</span>
                      </span>
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-blue-600 stroke-[2.5]" />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Side: Previous icon, Center numbers, Next icon */}
      <div className="flex items-center space-x-1.5 self-center sm:self-auto">
        {/* Previous Button (Icon Prev) */}
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="w-9 h-9 rounded-full border border-slate-200/80 bg-white hover:bg-slate-50 text-slate-700 hover:text-blue-600 hover:border-blue-200 shadow-2xs disabled:opacity-25 disabled:pointer-events-none transition-all flex items-center justify-center cursor-pointer active:scale-95"
          title={isKhmer ? 'ទំព័រមុន' : 'Previous page'}
          aria-label="Previous page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Center: Page Numbers */}
        <div className="flex items-center space-x-1">
          {pages.map((p, idx) => {
            if (typeof p === 'string') {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="w-8 text-center text-slate-400 select-none font-bold text-xs"
                >
                  ...
                </span>
              )
            }

            const isCurrent = p === currentPage
            return (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange(p)}
                className={`w-9 h-9 rounded-full text-xs font-bold transition-all flex items-center justify-center cursor-pointer ${
                  isCurrent
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 border-0 ring-0 scale-100'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/80 hover:border-slate-300 shadow-2xs active:scale-95'
                }`}
              >
                {p}
              </button>
            )
          })}
        </div>

        {/* Next Button (Icon Next) */}
        <button
          type="button"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="w-9 h-9 rounded-full border border-slate-200/80 bg-white hover:bg-slate-50 text-slate-700 hover:text-blue-600 hover:border-blue-200 shadow-2xs disabled:opacity-25 disabled:pointer-events-none transition-all flex items-center justify-center cursor-pointer active:scale-95"
          title={isKhmer ? 'ទំព័របន្ទាប់' : 'Next page'}
          aria-label="Next page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
