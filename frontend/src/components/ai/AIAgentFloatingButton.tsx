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
            className="group relative w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/35 hover:shadow-xl hover:shadow-blue-600/45 hover:scale-105 active:scale-95 transition-all duration-200 flex items-center justify-center border-2 border-white/20 cursor-pointer"
            aria-label="Open Career Assistant"
            title={isKhmer ? 'ជំនួយការការងារឆ្លាតវៃ' : 'Career Assistant'}
          >
            {/* Bot Icon */}
            <div className="relative flex items-center justify-center">
              <Bot className="w-6 h-6 sm:w-7 sm:h-7 text-white transition-transform duration-300 group-hover:rotate-12" />
            </div>
          </button>
        </div>
      )}

      {/* The Chat Modal */}
      <AIAgentChatModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  )
}
