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
  RotateCcw,
  Maximize2,
  Minimize2,
  Briefcase,
  Mail,
  ExternalLink,
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
        ? 'សួស្តី! ខ្ញុំជា **ជំនួយការប្រចាំវេទិកា CambodiaJobs**។ ខ្ញុំអាចជួយអ្នកស្វែងរកការងារ ផ្តល់គន្លឹះរៀបចំ CV បង្ហាញតារាងប្រាក់ខែ និងជួយដល់ការប្រកាសរើសបុគ្គលិក។'
        : 'Hello! I am your **CambodiaJobs Platform Assistant**.\n\nI can help you search verified jobs, analyze salary benchmarks, guide employers on posting vacancies, or provide career & CV tips.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggested_actions: [
        isKhmer ? '🎯 ការងារ IT នៅភ្នំពេញ' : '🎯 Tech jobs in Phnom Penh',
        isKhmer ? '📊 តារាងប្រាក់ខែទីផ្សារកម្ពុជា' : '📊 Salary Benchmark Chart',
        isKhmer ? '📧 ជំនួយការគាំទ្រ' : '📧 Email Support',
        isKhmer ? '🏢 របៀបផុសការងារ' : '🏢 How to post a job',
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
    } catch (error: any) {
      console.error('AI chat error:', error)
      const isRateLimit = error?.response?.status === 429
      const retryAfter = error?.response?.data?.retry_after
      const errorMsg: AIChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'agent',
        text: isRateLimit
          ? isKhmer
            ? `⚠️ អ្នកបានផ្ញើសំណើញឹកញាប់ពេក (ប្រព័ន្ធកំណត់ត្រឹម ១០ សំណើក្នុង ១ នាទីដើម្បីការពារ Spam)។ ${retryAfter ? `សូមរង់ចាំប្រហែល ${retryAfter} វិនាទី!` : 'សូមរង់ចាំមួយភ្លែតសិន!'}`
            : `⚠️ Rate limit reached: Maximum 10 requests per minute to prevent spam. ${retryAfter ? `Please wait about ${retryAfter}s before trying again!` : 'Please wait a moment!'}`
          : isKhmer
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

  // Enhanced rich text formatter for high-quality chat content with clickable links
  const renderFormattedText = (text: string) => {
    // Pre-process: merge multi-line or spaced markdown links where [label] is split from (url)
    const normalizedText = (text || '')
      .replace(/\[([^\]]+)\]\s*\n\s*\(((?:https?:\/\/|\/)[^\s)]+)\)/g, '[$1]($2)')
      .replace(/\[([^\]]+)\]\s+\(((?:https?:\/\/|\/)[^\s)]+)\)/g, '[$1]($2)')

    const lines = normalizedText.split('\n')

    const parseInline = (lineContent: string) => {
      // Token regex matching:
      // 1. Markdown link: [Title](url)
      // 2. Bold: **text**
      // 3. Code: `code`
      // 4. Bare URL: https://...
      const tokenRegex = /(\[[^\]]+\]\((?:https?:\/\/|\/)[^\s)]+\)|\*\*[^*]+\*\*|`[^`]+`|https?:\/\/[^\s<]+[^<.,:;"')\]\s])/g
      const parts = lineContent.split(tokenRegex)

      return parts.map((part, pIdx) => {
        if (!part) return null

        // 1. Markdown Link: [Title](url)
        const mdLinkMatch = part.match(/^\[([^\]]+)\]\(((?:https?:\/\/|\/)[^\s)]+)\)$/)
        if (mdLinkMatch) {
          const linkTitle = mdLinkMatch[1]
          const linkUrl = mdLinkMatch[2]
          return (
            <a
              key={pIdx}
              href={linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-800 bg-blue-50/90 hover:bg-blue-100/90 px-2 py-0.5 rounded-lg border border-blue-200/70 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-2xs hover:shadow-xs cursor-pointer mx-0.5 no-underline group"
              title={linkUrl}
            >
              <span className="group-hover:underline underline-offset-2">{linkTitle}</span>
              <ExternalLink className="w-3 h-3 text-blue-500 group-hover:text-blue-700 shrink-0 transition-colors" />
            </a>
          )
        }

        // 2. Bare URL: https://...
        if (part.startsWith('http://') || part.startsWith('https://')) {
          return (
            <a
              key={pIdx}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-800 underline decoration-blue-300 hover:decoration-blue-600 underline-offset-2 mx-0.5 cursor-pointer break-all"
            >
              <span>{part}</span>
              <ExternalLink className="w-3 h-3 text-blue-500 shrink-0" />
            </a>
          )
        }

        // 3. Bold text: **text**
        if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
          return (
            <strong key={pIdx} className="font-bold text-slate-900">
              {part.slice(2, -2)}
            </strong>
          )
        }

        // 4. Inline Code: `code`
        if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
          return (
            <code
              key={pIdx}
              className="px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-mono text-[11px] border border-indigo-100"
            >
              {part.slice(1, -1)}
            </code>
          )
        }

        return part
      })
    }

    return (
      <div className="space-y-1.5 leading-relaxed text-slate-700 text-xs sm:text-[13px]">
        {lines.map((line, idx) => {
          const trimmed = line.trim()
          if (!trimmed) {
            return <div key={idx} className="h-1.5" />
          }

          // Horizontal divider (--- or ***)
          if (trimmed === '---' || trimmed === '***') {
            return <hr key={idx} className="my-2 border-slate-200/90" />
          }

          // Headings (###, ##, #)
          if (trimmed.startsWith('### ')) {
            return (
              <h4 key={idx} className="font-bold text-slate-900 text-xs sm:text-[13px] mt-2 mb-1 flex items-center gap-1.5">
                {parseInline(trimmed.slice(4))}
              </h4>
            )
          }
          if (trimmed.startsWith('## ')) {
            return (
              <h3 key={idx} className="font-bold text-slate-900 text-sm sm:text-[14px] mt-2.5 mb-1.5 flex items-center gap-1.5 border-b border-slate-100 pb-1">
                {parseInline(trimmed.slice(3))}
              </h3>
            )
          }
          if (trimmed.startsWith('# ')) {
            return (
              <h2 key={idx} className="font-extrabold text-slate-900 text-sm sm:text-[15px] mt-3 mb-1.5 flex items-center gap-1.5">
                {parseInline(trimmed.slice(2))}
              </h2>
            )
          }

          // Bullet points (-, *, •)
          if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('• ')) {
            const content = trimmed.slice(2).trim()
            return (
              <div key={idx} className="flex items-start gap-2 pl-1 my-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0 mt-1.5" />
                <span className="flex-1 min-w-0 leading-relaxed">{parseInline(content)}</span>
              </div>
            )
          }

          // Numbered lists (e.g. 1. )
          const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/)
          if (numMatch) {
            return (
              <div key={idx} className="flex items-start gap-2 pl-1 my-0.5">
                <span className="font-bold text-blue-600 font-mono text-[11px] shrink-0 min-w-4">
                  {numMatch[1]}.
                </span>
                <span className="flex-1 min-w-0 leading-relaxed">{parseInline(numMatch[2])}</span>
              </div>
            )
          }

          // Regular paragraph line
          return (
            <p key={idx} className="break-words leading-relaxed">
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
      className={`fixed bottom-3 right-3 sm:bottom-5 sm:right-5 z-[9999] flex flex-col bg-white rounded-3xl shadow-2xl shadow-slate-900/15 border border-slate-200/80 overflow-hidden transition-all duration-300 font-sans ${
        isExpanded
          ? 'w-[calc(100vw-24px)] sm:w-[680px] h-[85vh] max-h-[850px]'
          : 'w-[calc(100vw-24px)] sm:w-[460px] h-[620px] max-h-[88vh]'
      }`}
    >
      {/* Sleek, Clean, Spacious White Header */}
      <div className="bg-white/95 backdrop-blur-md border-b border-slate-100 px-5 py-3.5 flex items-center justify-between shrink-0 shadow-2xs">
        {/* Left: AI Avatar + Title */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative shrink-0">
            <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200/90 text-blue-600 flex items-center justify-center shadow-xs">
              <Bot className="w-5 h-5 text-blue-600" />
            </div>
          </div>

          <div className="min-w-0">
            <h3 className="font-bold text-sm sm:text-[15px] tracking-tight text-slate-900 whitespace-nowrap">
              CambodiaJobs
            </h3>
            <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
              {isKhmer ? 'ជំនួយការការងារឆ្លាតវៃ' : 'Smart Career Assistant'}
            </p>
          </div>
        </div>

        {/* Right: Spacious, minimal icon buttons */}
        <div className="flex items-center gap-1.5 text-slate-400 shrink-0">
          {/* Clear Chat Icon Button */}
          <button
            type="button"
            onClick={handleClearChat}
            title={isKhmer ? 'សម្អាតការសន្ទនា' : 'Clear chat history'}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer active:scale-95"
            aria-label="Clear chat"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Expand / Minimize Toggle */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? (isKhmer ? 'បង្រួម' : 'Minimize') : (isKhmer ? 'ពង្រីក' : 'Expand')}
            className="w-8 h-8 rounded-xl hidden sm:flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer active:scale-95"
            aria-label="Toggle size"
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            title={isKhmer ? 'បិទ' : 'Close'}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer active:scale-95 ml-0.5"
            aria-label="Close chat"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>

      {/* Messages Stream with Beautiful Content Styling & Generous Spacing */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-5 space-y-4 bg-slate-50/60">
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
                <div className="w-7 h-7 rounded-xl bg-white border border-slate-200/90 text-blue-600 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                  <Bot className="w-4 h-4 text-blue-600" />
                </div>

                <div className="flex-1 min-w-0 space-y-2">
                  <div className="bg-white text-slate-800 border border-slate-200/80 rounded-2xl rounded-tl-xs p-4 shadow-xs break-words overflow-hidden">
                    {renderFormattedText(msg.text)}

                    {/* Interactive Career / Salary Chart */}
                    {msg.chart && <AICareerChart chart={msg.chart} />}

                    {/* Matched Job Vacancies */}
                    {msg.jobs && msg.jobs.length > 0 && (
                      <div className="mt-3.5 pt-3 border-t border-slate-100 space-y-2.5">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-800 px-0.5">
                          <span className="flex items-center gap-1.5 text-slate-900">
                            <Briefcase className="w-3.5 h-3.5 text-blue-600" />
                            {isKhmer ? 'ការងារណែនាំ' : 'Recommended Jobs'}
                          </span>
                          <span className="text-[10px] text-blue-700 font-bold bg-blue-50 border border-blue-200/60 px-2 py-0.5 rounded-full">
                            {msg.jobs.length} {isKhmer ? 'កន្លែង' : 'matches'}
                          </span>
                        </div>

                        <div className="space-y-2">
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
                    <div className="flex flex-wrap gap-2 pt-1">
                      {msg.suggested_actions.map((action, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => handleSend(action)}
                          className="text-xs font-semibold px-3.5 py-1.5 rounded-full bg-white hover:bg-blue-50/80 text-slate-700 hover:text-blue-700 border border-slate-200/90 hover:border-blue-300 shadow-2xs hover:shadow-xs transition-all hover:scale-[1.01] active:scale-[0.98] cursor-pointer"
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
            <div className="w-7 h-7 rounded-xl bg-white border border-slate-200/90 text-blue-600 flex items-center justify-center shrink-0 shadow-2xs">
              <Bot className="w-4 h-4 text-blue-600" />
            </div>
            <div className="bg-white border border-slate-200/80 rounded-2xl rounded-tl-xs px-4 py-3 shadow-xs flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce" />
              <span className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.2s]" />
              <span className="w-2 h-2 rounded-full bg-purple-600 animate-bounce [animation-delay:0.4s]" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Field Area */}
      <div className="p-3.5 sm:p-4 bg-white border-t border-slate-100 shrink-0">
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
            className="flex-1 text-xs sm:text-sm px-4 py-2.5 bg-slate-50 border border-slate-200/90 rounded-2xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white text-slate-900 transition-all placeholder:text-slate-400"
          />

          <button
            type="submit"
            disabled={!inputMessage.trim() || isLoading}
            className="w-10 h-10 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:from-blue-700 hover:to-indigo-700 shadow-sm transition-all shrink-0 flex items-center justify-center hover:scale-105 active:scale-95 cursor-pointer"
            title={isKhmer ? 'ផ្ញើសារ' : 'Send'}
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  )
}
