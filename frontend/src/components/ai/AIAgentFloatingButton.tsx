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
      {/* Floating Action Button Group (Telegram Support + AI Assistant) */}
      {!isOpen && (
        <div className="fixed bottom-4 right-4 sm:bottom-5 sm:right-5 z-40 flex flex-col items-center gap-2.5 animate-in fade-in slide-in-from-bottom-2 duration-200">
          {/* Telegram Quick Contact Button */}
          <a
            href="https://t.me/CambodiaJobSupportBot"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gradient-to-tr from-[#0088cc] via-[#24A1DE] to-[#29B6F6] text-white shadow-lg shadow-sky-500/25 hover:shadow-xl hover:shadow-sky-500/40 hover:scale-110 active:scale-95 transition-all duration-200 flex items-center justify-center border border-white/20 cursor-pointer"
            aria-label="Contact on Telegram"
            title={isKhmer ? 'ទាក់ទងតាម Telegram Bot (@CambodiaJobSupportBot)' : 'Chat on Telegram Bot (@CambodiaJobSupportBot)'}
          >
            {/* Subtle glow effect */}
            <span className="absolute -inset-0.5 rounded-full bg-sky-400 opacity-40 blur-xs group-hover:opacity-75 transition-opacity pointer-events-none" />

            {/* Official Telegram Paper Airplane Icon */}
            <div className="relative flex items-center justify-center">
              <svg
                className="w-5 h-5 text-white fill-current transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                viewBox="0 0 24 24"
              >
                <path d="M20.665 3.717l-17.73 6.837c-1.21.486-1.203 1.161-.222 1.462l4.552 1.42 10.532-6.645c.498-.303.953-.14.579.192l-8.533 7.701h-.002l-.002.001-.314 4.692c.46 0 .663-.211.921-.46l2.211-2.15 4.599 3.397c.848.467 1.457.227 1.668-.785l3.019-14.228c.309-1.239-.473-1.8-1.282-1.434z" />
              </svg>
            </div>
          </a>

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
