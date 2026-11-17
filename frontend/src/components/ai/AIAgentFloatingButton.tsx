import React, { useState, useEffect } from 'react'
import { AIAgentChatModal } from './AIAgentChatModal'
import { Bot } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export const AIAgentFloatingButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const { i18n } = useTranslation()
  const isKhmer = i18n.language === 'km'

  useEffect(() => {
    const handleOpen = () => setIsOpen(true)
    window.addEventListener('open-cambodiajobs-ai', handleOpen)
    return () => window.removeEventListener('open-cambodiajobs-ai', handleOpen)
  }, [])

  return (
    <>
      {/* Floating Action Button (Career Assistant) */}
      {!isOpen && (
        <div className="fixed bottom-4 right-4 sm:bottom-5 sm:right-5 z-40 flex flex-col items-center gap-2.5 animate-in fade-in slide-in-from-bottom-2 duration-200">
          {/* Floating Action Button */}
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="group relative w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-white text-blue-600 shadow-xl shadow-slate-900/10 hover:shadow-2xl hover:shadow-slate-900/15 hover:scale-105 active:scale-95 transition-all duration-200 flex items-center justify-center border border-slate-200/90 hover:border-blue-300 cursor-pointer"
            aria-label="Open Career Assistant"
            title={isKhmer ? 'ជំនួយការការងារ' : 'Career Assistant'}
          >
            {/* Bot Icon */}
            <div className="relative flex items-center justify-center">
              <Bot className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 transition-transform duration-300 group-hover:rotate-12" />
            </div>
          </button>
        </div>
      )}

      {/* The Chat Modal */}
      <AIAgentChatModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  )
}
