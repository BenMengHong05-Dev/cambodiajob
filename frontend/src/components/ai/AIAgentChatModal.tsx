import React, { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { aiService } from '../../services/ai.service'
import { AIChatMessage } from '../../types'
import { AICareerChart } from './AICareerChart'
import { AIJobCard } from './AIJobCard'
import {
  Bot,
  Send,
  X,
  Sparkles,
  RotateCcw,
  Maximize2,
  Minimize2,
  Briefcase,
} from 'lucide-react'

interface AIAgentChatModalProps {
  isOpen: boolean
  onClose: () => void
}

export const AIAgentChatModal: React.FC<AIAgentChatModalProps> = ({ isOpen, onClose }) => {
  const { i18n } = useTranslation()
  const isKhmer = i18n.language === 'km'

  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  const getInitialMessages = (): AIChatMessage[] => [
    {
      id: 'welcome-1',
      sender: 'agent',
      text: isKhmer
        ? 'សួស្តី! ខ្ញុំជា **ជំនួយការ AI ប្រចាំវេទិកា CambodiaJobs**។ ខ្ញុំអាចជួយអ្នកស្វែងរកការងារ ផ្តល់គន្លឹះរៀបចំ CV បង្ហាញតារាងប្រាក់ខែ និងជួយដល់ការប្រកាសរើសបុគ្គលិក។'
        : 'Hello! I am your **CambodiaJobs Platform AI Assistant**.\n\nI can help you search verified jobs, analyze salary benchmarks, guide employers on posting vacancies, or provide career & CV tips.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggested_actions: [
        isKhmer ? '🎯 ការងារ IT នៅភ្នំពេញ' : '🎯 Tech jobs in Phnom Penh',
        isKhmer ? '📊 តារាងប្រាក់ខែទីផ្សារកម្ពុជា' : '📊 Salary Benchmark Chart',
        isKhmer ? '💬 ជំនួយតាម Telegram' : '💬 Telegram Support',
        isKhmer ? '🏢 របៀបផុសការងារ (Employer)' : '🏢 How to post a job',
      ],
    },
  ]

  const [messages, setMessages] = useState<AIChatMessage[]>(() => {
    try {
      const saved = sessionStorage.getItem('cambodia_jobs_ai_chat')
      return saved ? JSON.parse(saved) : getInitialMessages()
    } catch {
      return getInitialMessages()
    }
  })

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (isOpen) {
      scrollToBottom()
      setTimeout(() => inputRef.current?.focus(), 150)
    }
  }, [isOpen, messages, isLoading])

  useEffect(() => {
    try {
      sessionStorage.setItem('cambodia_jobs_ai_chat', JSON.stringify(messages))
    } catch (e) {
      console.warn('Failed to save chat to session storage', e)
    }
  }, [messages])

  const handleSend = async (customText?: string) => {
    const textToSend = (customText || inputMessage).trim()
    if (!textToSend || isLoading) return

    const userMsg: AIChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    setMessages((prev) => [...prev, userMsg])
    if (!customText) setInputMessage('')
    setIsLoading(true)

    try {
      const historyPayload = messages.slice(-4).map((m) => ({
        sender: m.sender,
        text: m.text,
      }))

      const res = await aiService.chat(textToSend, historyPayload)

      const agentMsg: AIChatMessage = {
        id: `agent-${Date.now()}`,
        sender: 'agent',
        text: res.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        jobs: res.matched_jobs,
        chart: res.chart,
        suggested_actions: res.suggested_actions,
      }

      setMessages((prev) => [...prev, agentMsg])
    } catch (error) {
      console.error('AI chat error:', error)
      const errorMsg: AIChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'agent',
        text: isKhmer
          ? 'សូមអភ័យទោស ប្រព័ន្ធមានបញ្ហាក្នុងការតភ្ជាប់បណ្តោះអាសន្ន។ សូមព្យាយាមម្តងទៀត!'
          : 'Sorry, I encountered a temporary connection issue. Please try again!',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
      setMessages((prev) => [...prev, errorMsg])
    } finally {
      setIsLoading(false)
    }
  }

  const handleClearChat = () => {
    const fresh = getInitialMessages()
    setMessages(fresh)
    sessionStorage.removeItem('cambodia_jobs_ai_chat')
  }

  // Enhanced rich text formatter for high-quality chat content
  const renderFormattedText = (text: string) => {
    const lines = text.split('\n')

    const parseInline = (lineContent: string) => {
      // Split on **bold** and `code`
      const segments = lineContent.split(/(\*\*.*?\*\*|`.*?`)/g)
      return segments.map((seg, sIdx) => {
        if (seg.startsWith('**') && seg.endsWith('**')) {
          return (
            <strong key={sIdx} className="font-bold text-slate-900">
              {seg.slice(2, -2)}
            </strong>
          )
        }
        if (seg.startsWith('`') && seg.endsWith('`')) {
          return (
            <code
              key={sIdx}
              className="px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-mono text-[11px] border border-indigo-100"
            >
              {seg.slice(1, -1)}
            </code>
          )
        }
        return seg
      })
    }

    return (
      <div className="space-y-1.5 leading-relaxed text-slate-700 text-xs sm:text-[13px]">
        {lines.map((line, idx) => {
          const trimmed = line.trim()
          if (!trimmed) {
            return <div key={idx} className="h-1.5" />
          }

          // Bullet points (- or *)
          if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            return (
              <div key={idx} className="flex items-start gap-2 pl-1">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0 mt-1.5" />
                <span className="flex-1">{parseInline(trimmed.slice(2))}</span>
              </div>
            )
          }

          // Numbered lists (e.g. 1. )
          const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/)
          if (numMatch) {
            return (
              <div key={idx} className="flex items-start gap-2 pl-1">
                <span className="font-bold text-indigo-600 font-mono text-[11px] shrink-0 min-w-4">
                  {numMatch[1]}.
                </span>
                <span className="flex-1">{parseInline(numMatch[2])}</span>
              </div>
            )
          }

          // Regular paragraph line
          return (
            <p key={idx} className="break-words">
              {parseInline(line)}
            </p>
          )
        })}
      </div>
    )
  }

  if (!isOpen) return null

  return (
    <div
      className={`fixed bottom-3 right-3 sm:bottom-5 sm:right-5 z-50 flex flex-col bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden transition-all duration-300 font-sans ${
        isExpanded
          ? 'w-[calc(100vw-24px)] sm:w-[620px] h-[85vh] max-h-[850px]'
          : 'w-[calc(100vw-24px)] sm:w-[420px] h-[590px] max-h-[85vh]'
      }`}
    >
      {/* Sleek, Clean Header */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 text-white px-4 py-3 flex items-center justify-between shrink-0 shadow-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative shrink-0">
            <div className="w-8 h-8 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 text-white shadow-xs">
              <Bot className="w-4 h-4 text-white" />
            </div>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm tracking-tight truncate">
                CambodiaJobs AI
              </h3>
              <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-white/20 text-white shrink-0 border border-white/20">
                AI
              </span>
            </div>
            <p className="text-[11px] text-indigo-100 font-medium truncate">
              {isKhmer ? 'ជំនួយការស្វែងរកការងារ & ប្រព័ន្ធ' : 'Smart Career & Platform Assistant'}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 text-white/90 shrink-0">
          {/* Direct Telegram Support Link */}
          <a
            href="https://t.me/cambodiajobs_support"
            target="_blank"
            rel="noopener noreferrer"
            title={isKhmer ? 'ជំនួយការផ្ទាល់តាម Telegram (@cambodiajobs_support)' : 'Live Telegram Support (@cambodiajobs_support)'}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-[#24A1DE]/40 text-white text-xs font-semibold transition-all cursor-pointer border border-white/15 hover:border-white/25 active:scale-95"
          >
            <svg className="w-3.5 h-3.5 fill-current text-sky-200" viewBox="0 0 24 24">
              <path d="M20.665 3.717l-17.73 6.837c-1.21.486-1.203 1.161-.222 1.462l4.552 1.42 10.532-6.645c.498-.303.953-.14.579.192l-8.533 7.701h-.002l-.002.001-.314 4.692c.46 0 .663-.211.921-.46l2.211-2.15 4.599 3.397c.848.467 1.457.227 1.668-.785l3.019-14.228c.309-1.239-.473-1.8-1.282-1.434z" />
            </svg>
            <span className="hidden sm:inline">Telegram</span>
          </a>

          {/* Distinct, Clear Chat Button */}
          <button
            type="button"
            onClick={handleClearChat}
            title={isKhmer ? 'សម្អាតការសន្ទនា' : 'Clear chat history'}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-all cursor-pointer border border-white/15 hover:border-white/25 active:scale-95"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isKhmer ? 'សម្អាត' : 'Clear'}</span>
          </button>

          {/* Expand / Minimize Toggle */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? 'បង្រួម' : 'ពង្រីក'}
            className="p-1.5 rounded-xl hover:bg-white/15 text-white transition-colors hidden sm:flex items-center justify-center cursor-pointer border border-transparent hover:border-white/15"
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            title={isKhmer ? 'បិទ' : 'Close'}
            className="p-1.5 rounded-xl hover:bg-white/15 text-white transition-colors flex items-center justify-center cursor-pointer border border-transparent hover:border-white/15"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Stream with Beautiful Content Styling */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-3.5 sm:p-4 space-y-3.5 bg-slate-50/70">
        {messages.map((msg) => (
          <div key={msg.id} className="w-full">
            {msg.sender === 'user' ? (
              <div className="flex flex-col items-end w-full">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl rounded-tr-xs px-4 py-2.5 text-xs sm:text-[13px] shadow-sm leading-relaxed max-w-[85%] break-words">
                  {msg.text}
                </div>
                <span className="text-[10px] text-slate-400 mt-1 px-1">{msg.timestamp}</span>
              </div>
            ) : (
              <div className="flex items-start gap-2.5 w-full min-w-0">
                <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm shadow-indigo-500/20">
                  <Bot className="w-4 h-4" />
                </div>

                <div className="flex-1 min-w-0 space-y-2">
                  <div className="bg-white text-slate-800 border border-slate-200/90 rounded-2xl rounded-tl-xs p-3.5 shadow-xs break-words overflow-hidden">
                    {renderFormattedText(msg.text)}

                    {/* Interactive Career / Salary Chart */}
                    {msg.chart && <AICareerChart chart={msg.chart} />}

                    {/* Matched Job Vacancies */}
                    {msg.jobs && msg.jobs.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                          <span className="flex items-center gap-1.5 text-slate-900">
                            <Briefcase className="w-3.5 h-3.5 text-blue-600" />
                            {isKhmer ? 'ការងារណែនាំ' : 'Recommended Jobs'}
                          </span>
                          <span className="text-[10px] text-blue-700 font-bold bg-blue-50 border border-blue-200/60 px-2 py-0.5 rounded-full">
                            {msg.jobs.length} {isKhmer ? 'កន្លែង' : 'matches'}
                          </span>
                        </div>

                        <div className="space-y-1.5">
                          {msg.jobs.map((job) => (
                            <AIJobCard key={job.id} job={job} />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <span className="text-[10px] text-slate-400 block px-1">{msg.timestamp}</span>

                  {/* Suggestion Prompt Chips */}
                  {msg.suggested_actions && msg.suggested_actions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {msg.suggested_actions.map((action, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => handleSend(action)}
                          className="text-xs font-semibold px-3 py-1.5 rounded-full bg-white hover:bg-indigo-50/80 text-slate-700 hover:text-indigo-700 border border-slate-200/90 hover:border-indigo-300 shadow-2xs hover:shadow-xs transition-all hover:scale-[1.01] active:scale-[0.98] cursor-pointer"
                        >
                          {action}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-indigo-500/20">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-white border border-slate-200/90 rounded-2xl rounded-tl-xs px-4 py-2.5 shadow-xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce" />
              <span className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.2s]" />
              <span className="w-2 h-2 rounded-full bg-purple-600 animate-bounce [animation-delay:0.4s]" />
              <span className="text-xs text-slate-600 font-medium ml-1">
                {isKhmer ? 'AI កំពុងវិភាគ...' : 'AI is analyzing...'}
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Field Area */}
      <div className="p-3 bg-white border-t border-slate-200/90 shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSend()
          }}
          className="flex items-center gap-2"
        >
          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={
              isKhmer
                ? 'សួរអំពីការងារ ជ្រើសរើសបុគ្គលិក តារាងប្រាក់ខែ...'
                : 'Ask about jobs, salaries, hiring tips...'
            }
            className="flex-1 text-xs sm:text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 focus:bg-white text-slate-900 transition-all placeholder:text-slate-400"
          />

          <button
            type="submit"
            disabled={!inputMessage.trim() || isLoading}
            className="p-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:from-blue-700 hover:to-indigo-700 shadow-sm transition-all shrink-0 hover:scale-105 active:scale-95 cursor-pointer"
            title={isKhmer ? 'ផ្ញើសារ' : 'Send'}
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

        <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 px-1 font-medium">
          <span className="flex items-center gap-1.5 text-slate-500">
            <Sparkles className="w-3 h-3 text-indigo-500" />
            CambodiaJobs AI Platform
          </span>
          <span className="text-slate-400">English • ភាសាខ្មែរ</span>
        </div>
      </div>
    </div>
  )
}
