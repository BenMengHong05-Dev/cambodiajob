import React, { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { aiService } from '../../services/ai.service'
import { AIChatMessage, AIMatchedJob, AIChartData } from '../../types'
import { AICareerChart } from './AICareerChart'
import { AIJobCard } from './AIJobCard'
import { useAuth } from '../../app/providers'
import {
  Bot,
  Send,
  X,
  Sparkles,
  RotateCcw,
  Maximize2,
  Minimize2,
  Briefcase,
  KeyRound,
  Check,
  ExternalLink,
  CheckCircle2,
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

  // Google Gemini API Key state
  const [geminiApiKey, setGeminiApiKey] = useState(() => {
    return localStorage.getItem('cambodia_jobs_gemini_api_key') || ''
  })
  const [showKeySettings, setShowKeySettings] = useState(false)
  const [keyInput, setKeyInput] = useState(geminiApiKey)
  const [backendGeminiConfigured, setBackendGeminiConfigured] = useState(false)

  useEffect(() => {
    aiService
      .getStatus()
      .then((st) => {
        setBackendGeminiConfigured(Boolean(st.gemini_configured))
      })
      .catch(() => {})
  }, [])

  const isGeminiConnected = Boolean(geminiApiKey || backendGeminiConfigured)

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
        isKhmer ? '🏢 របៀបផុសការងារ (Employer)' : '🏢 How to post a job',
        isKhmer ? '📝 គន្លឹះរៀបចំ CV' : '📝 CV & Interview tips',
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

  const handleSaveApiKey = () => {
    const clean = keyInput.trim()
    setGeminiApiKey(clean)
    if (clean) {
      localStorage.setItem('cambodia_jobs_gemini_api_key', clean)
    } else {
      localStorage.removeItem('cambodia_jobs_gemini_api_key')
    }
    setShowKeySettings(false)
  }

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

      const res = await aiService.chat(textToSend, historyPayload, geminiApiKey)

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

  const renderFormattedText = (text: string) => {
    const paragraphs = text.split('\n')
    return paragraphs.map((para, pIdx) => {
      const parts = para.split(/(\*\*.*?\*\*)/g)
      return (
        <p key={pIdx} className="mb-1 last:mb-0 leading-relaxed text-xs sm:text-[13px] break-words">
          {parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return (
                <strong key={i} className="font-bold text-slate-900">
                  {part.slice(2, -2)}
                </strong>
              )
            }
            return part
          })}
        </p>
      )
    })
  }

  if (!isOpen) return null

  return (
    <div
      className={`fixed bottom-3 right-3 sm:bottom-5 sm:right-5 z-50 flex flex-col bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden transition-all duration-300 font-sans ${
        isExpanded
          ? 'w-[calc(100vw-24px)] sm:w-[620px] h-[85vh] max-h-[850px]'
          : 'w-[calc(100vw-24px)] sm:w-[410px] h-[580px] max-h-[85vh]'
      }`}
    >
      {/* Sleek Header */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 text-white px-3.5 py-3 flex items-center justify-between shrink-0 shadow-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative shrink-0">
            <div className="w-8 h-8 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 text-white">
              <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 border-2 border-indigo-700 rounded-full"></span>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 truncate">
              <h3 className="font-extrabold text-xs sm:text-sm tracking-tight truncate">
                CambodiaJobs AI
              </h3>
              <span
                className={`text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded-md shrink-0 ${
                  isGeminiConnected
                    ? 'bg-emerald-400/25 text-emerald-100 border border-emerald-300/30'
                    : 'bg-white/20 text-white'
                }`}
              >
                {isGeminiConnected ? 'Gemini' : 'AI'}
              </span>
            </div>
            <p className="text-[10px] text-indigo-100 font-medium truncate">
              {isKhmer ? 'ជំនួយការស្វែងរកការងារ & ប្រព័ន្ធ' : 'Smart Career & Platform Assistant'}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-0.5 text-white/80 shrink-0">
          <button
            onClick={() => setShowKeySettings(!showKeySettings)}
            title="Google Gemini API Key"
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              showKeySettings || isGeminiConnected
                ? 'bg-white/20 text-white'
                : 'hover:bg-white/10 hover:text-white text-white/70'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleClearChat}
            title={isKhmer ? 'លុបសារសន្ទនា' : 'Reset Conversation'}
            className="p-1.5 rounded-lg hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? 'បង្រួម' : 'ពង្រីក'}
            className="p-1.5 rounded-lg hover:bg-white/10 hover:text-white transition-colors hidden sm:block cursor-pointer"
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Google Gemini Settings Dropdown */}
      {showKeySettings && (
        <div className="bg-slate-900 text-white p-3 border-b border-indigo-900/60 animate-in fade-in slide-in-from-top-2 duration-150 shrink-0">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5" /> Google Gemini API Key
            </span>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noreferrer"
              className="text-[10px] text-blue-300 hover:text-blue-200 flex items-center gap-0.5 underline"
            >
              Get Free Key <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>

          <div className="flex gap-1.5">
            <input
              type="password"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="Paste Gemini API key (AIzaSy...)"
              className="flex-1 text-xs px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-hidden focus:ring-1 focus:ring-blue-400 placeholder:text-slate-500 font-mono"
            />
            <button
              onClick={handleSaveApiKey}
              className="px-3 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-500 rounded-xl text-white flex items-center gap-1 transition-all cursor-pointer shadow-xs"
            >
              <Check className="w-3 h-3" /> Save
            </button>
          </div>

          {backendGeminiConfigured && (
            <p className="text-[10px] text-emerald-400 mt-1.5 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Backend default GEMINI_API_KEY is active in .env
            </p>
          )}
        </div>
      )}

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-3.5 space-y-3 bg-slate-50/70">
        {messages.map((msg) => (
          <div key={msg.id} className="w-full">
            {msg.sender === 'user' ? (
              <div className="flex flex-col items-end w-full">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl rounded-tr-xs px-3.5 py-2 text-xs sm:text-[13px] shadow-2xs break-words max-w-[85%]">
                  {msg.text}
                </div>
                <span className="text-[9px] text-slate-400 mt-0.5 px-1">{msg.timestamp}</span>
              </div>
            ) : (
              <div className="flex items-start gap-2 w-full min-w-0">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                  <Bot className="w-3.5 h-3.5" />
                </div>

                <div className="flex-1 min-w-0 space-y-2">
                  <div className="bg-white text-slate-800 border border-slate-200/90 rounded-2xl rounded-tl-xs p-3 shadow-2xs break-words overflow-hidden text-xs sm:text-[13px]">
                    {renderFormattedText(msg.text)}

                    {msg.chart && <AICareerChart chart={msg.chart} />}

                    {/* Compact, Clean Job Cards */}
                    {msg.jobs && msg.jobs.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-slate-100 space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                          <span className="flex items-center gap-1 text-slate-800">
                            <Briefcase className="w-3 h-3 text-blue-600" />
                            {isKhmer ? 'ការងារណែនាំ' : 'Recommended Jobs'}
                          </span>
                          <span className="text-[10px] text-blue-600 font-semibold bg-blue-50 px-1.5 py-0.2 rounded-md">
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

                  <span className="text-[9px] text-slate-400 block px-1">{msg.timestamp}</span>

                  {/* Suggestion Prompt Chips */}
                  {msg.suggested_actions && msg.suggested_actions.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-0.5">
                      {msg.suggested_actions.map((action, i) => (
                        <button
                          key={i}
                          onClick={() => handleSend(action)}
                          className="text-[10px] sm:text-[11px] font-medium px-2 py-1 rounded-lg bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 hover:border-blue-300 shadow-2xs transition-all hover:scale-[1.01] active:scale-[0.98] cursor-pointer"
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
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <Bot className="w-3.5 h-3.5" />
            </div>
            <div className="bg-white border border-slate-200/90 rounded-2xl rounded-tl-xs px-3 py-2 shadow-2xs flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.2s]"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-bounce [animation-delay:0.4s]"></span>
              <span className="text-xs text-slate-500 font-medium ml-1">
                {isKhmer ? 'AI កំពុងវិភាគ...' : 'AI is analyzing...'}
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Field Area */}
      <div className="p-2.5 bg-white border-t border-slate-200/90 shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSend()
          }}
          className="flex items-center gap-1.5"
        >
          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={
              isKhmer
                ? 'សួរអំពីការងារ ជ្រើសរើសបុគ្គលិក តារាងប្រាក់ខែ...'
                : 'Ask about jobs, salaries, hiring...'
            }
            className="flex-1 text-xs sm:text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-blue-500 focus:bg-white text-slate-900 transition-all placeholder:text-slate-400"
          />

          <button
            type="submit"
            disabled={!inputMessage.trim() || isLoading}
            className="p-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:from-blue-700 hover:to-indigo-700 shadow-sm transition-all shrink-0 hover:scale-105 active:scale-95 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>

        <div className="flex items-center justify-between text-[9px] text-slate-400 mt-1.5 px-1">
          <span className="flex items-center gap-1">
            <Sparkles className="w-2.5 h-2.5 text-amber-500" />
            {isGeminiConnected ? 'Google Gemini AI' : 'CambodiaJobs AI'}
          </span>
          <span>English • ភាសាខ្មែរ</span>
        </div>
      </div>
    </div>
  )
}
