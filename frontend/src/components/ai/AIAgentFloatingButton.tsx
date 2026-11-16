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
      {/* Floating Action Button (AI Assistant) */}
      {!isOpen && (
        <div className="fixed bottom-4 right-4 sm:bottom-5 sm:right-5 z-40 flex flex-col items-center gap-2.5 animate-in fade-in slide-in-from-bottom-2 duration-200">
          {/* AI Assistant Floating Action Button */}
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="group relative w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-600/30 hover:shadow-xl hover:shadow-indigo-600/40 hover:scale-110 active:scale-95 transition-all duration-200 flex items-center justify-center border border-white/20 cursor-pointer"
            aria-label="Open AI Assistant"
            title={isKhmer ? 'ជំនួយការ AI' : 'AI Assistant'}
          >
            {/* Subtle pulsing background glow */}
            <span className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 opacity-40 blur-xs group-hover:opacity-75 transition-opacity pointer-events-none" />

            {/* Bot Icon */}
            <div className="relative flex items-center justify-center">
              <Bot className="w-5 h-5 text-white transition-transform duration-300 group-hover:rotate-12" />
            </div>
          </button>
        </div>
      )}

      {/* The Chat Modal */}
      <AIAgentChatModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  )
}
