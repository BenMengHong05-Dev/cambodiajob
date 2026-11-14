import React, { useState, useEffect } from 'react'
import { AIAgentChatModal } from './AIAgentChatModal'
import { Bot, Sparkles } from 'lucide-react'

export const AIAgentFloatingButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const handleOpen = () => setIsOpen(true)
    window.addEventListener('open-cambodiajobs-ai', handleOpen)
    return () => window.removeEventListener('open-cambodiajobs-ai', handleOpen)
  }, [])

  return (
    <>
      {/* Sleek Minimal Floating Action Button (Icon Only) - Hidden when modal is open */}
      {!isOpen && (
        <div className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-40 group animate-in fade-in duration-200">
          <button
            onClick={() => setIsOpen(true)}
            className="relative w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-indigo-700 text-white shadow-xl shadow-blue-600/35 hover:shadow-2xl hover:shadow-blue-600/50 hover:scale-110 active:scale-95 transition-all duration-300 flex items-center justify-center border border-white/25 cursor-pointer"
            aria-label="Open AI Assistant"
            title="AI Assistant"
          >
            {/* Animated Glow Halo */}
            <span className="absolute -inset-1 rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 opacity-60 blur-xs group-hover:opacity-100 transition-opacity animate-pulse pointer-events-none"></span>

            <div className="relative flex items-center justify-center">
              <Bot className="w-6 h-6 text-white transition-transform duration-200 group-hover:rotate-6" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 border-2 border-indigo-700 rounded-full"></span>
              <Sparkles className="absolute -bottom-1 -left-1.5 w-3.5 h-3.5 text-amber-300 animate-pulse" />
            </div>
          </button>
        </div>
      )}

      {/* The Chat Modal */}
      <AIAgentChatModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  )
}
