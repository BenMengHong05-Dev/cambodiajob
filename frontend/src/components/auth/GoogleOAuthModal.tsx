import React, { useState } from 'react'
import { ExternalLink, KeyRound, ShieldAlert, Sparkles, X, Mail, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { getGoogleClientId, setGoogleClientId } from '../../utils/googleOAuth'

interface GoogleOAuthModalProps {
  isOpen: boolean
  onClose: () => void
  onContinue: (clientId: string) => void
  onDemoSignIn?: () => void
  onCustomEmailSignIn?: (email: string, name?: string) => void
  role?: 'job_seeker' | 'employer'
}

export const GoogleOAuthModal: React.FC<GoogleOAuthModalProps> = ({
  isOpen,
  onClose,
  onContinue,
  onDemoSignIn,
  onCustomEmailSignIn,
  role = 'job_seeker',
}) => {
  const [clientIdInput, setClientIdInput] = useState(() => getGoogleClientId())
  const [showSetupGuide, setShowSetupGuide] = useState(false)
  const [showTroubleshoot, setShowTroubleshoot] = useState(true)
  const [customEmail, setCustomEmail] = useState('')
  const [customName, setCustomName] = useState('')
  const [activeTab, setActiveTab] = useState<'oauth' | 'custom'>('oauth')
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173'

  const handleSaveAndLaunch = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = clientIdInput.trim()
    if (!trimmed) {
      setError('Please enter your Google OAuth Client ID.')
      return
    }
    setError(null)
    setGoogleClientId(trimmed)
    onContinue(trimmed)
  }

  const handleCustomEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!customEmail.trim() || !customEmail.includes('@')) {
      setError('Please enter a valid email address.')
      return
    }
    if (onCustomEmailSignIn) {
      onCustomEmailSignIn(customEmail.trim().toLowerCase(), customName.trim() || undefined)
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 bg-slate-100 rounded-xl">
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">Google Authentication</h3>
              <p className="text-[11px] text-slate-500">Sign in securely with your Google identity</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-xs font-bold text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher: Real OAuth vs Instant Sign-In */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('oauth')}
            className={`py-1.5 px-3 text-xs font-bold rounded-lg transition ${
              activeTab === 'oauth'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Google OAuth 2.0 Popup
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('custom')}
            className={`py-1.5 px-3 text-xs font-bold rounded-lg transition ${
              activeTab === 'custom'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Instant Custom Email
          </button>
        </div>

        {error && (
          <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
            {error}
          </div>
        )}

        {activeTab === 'oauth' ? (
          <div className="space-y-3.5">
            {/* Origin Notice Banner */}
            <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-xl text-xs space-y-1">
              <div className="font-bold text-blue-900 flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>Your Current Browser Origin:</span>
              </div>
              <div className="font-mono text-xs bg-white px-2 py-1 rounded border border-blue-200 text-blue-800 select-all font-semibold">
                {currentOrigin}
              </div>
              <p className="text-[10px] text-blue-700">
                This exact origin must be added to <strong>Authorized JavaScript origins</strong> in Google Cloud Console.
              </p>
            </div>

            {/* Input Form for Client ID */}
            <form onSubmit={handleSaveAndLaunch} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Google Web Client ID
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <KeyRound className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="text"
                    value={clientIdInput}
                    onChange={(e) => setClientIdInput(e.target.value)}
                    placeholder="23636444639-xxx.apps.googleusercontent.com"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-500/10 transition font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/25 transition flex items-center justify-center space-x-2"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Open Google OAuth Sign-In Popup</span>
              </button>
            </form>

            {/* Troubleshooting "Access blocked" guide */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowTroubleshoot(!showTroubleshoot)}
                className="w-full text-left flex items-center justify-between text-xs font-bold text-amber-800 bg-amber-50/80 border border-amber-200/90 p-2.5 rounded-xl hover:bg-amber-100/70 transition"
              >
                <div className="flex items-center space-x-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>Fix "Access blocked: Authorisation error"</span>
                </div>
                <span className="text-[10px] text-amber-700 underline font-semibold">
                  {showTroubleshoot ? 'Hide' : 'Show steps'}
                </span>
              </button>

              {showTroubleshoot && (
                <div className="mt-2 p-3 bg-amber-50/50 border border-amber-200 rounded-xl text-[11px] space-y-2 text-slate-700">
                  <div>
                    <strong className="text-amber-900 block font-bold mb-0.5">1. Add Test User (Google Cloud Console):</strong>
                    If your project is in <em>Testing</em> mode, only emails in "Test users" can sign in.
                    <br />
                    Go to <strong>OAuth consent screen</strong> &gt; Scroll to <strong>Test users</strong> &gt; Click <strong>+ ADD USERS</strong> &gt; Add your Gmail.
                  </div>
                  <div>
                    <strong className="text-amber-900 block font-bold mb-0.5">2. Check Authorized JavaScript Origins:</strong>
                    Go to <strong>Credentials</strong> &gt; Click your <strong>OAuth 2.0 Client ID</strong>.
                    <br />
                    Add both:
                    <div className="mt-1 font-mono bg-white p-1 rounded border border-amber-200 select-all text-[10px]">
                      {currentOrigin}
                      <br />
                      http://localhost:5173
                      <br />
                      http://127.0.0.1:5173
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Instant Custom Email Sign-In (Never gets blocked by Google Cloud) */
          <form onSubmit={handleCustomEmailSubmit} className="space-y-3">
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 leading-relaxed">
              Use this option to sign in with your real personal Google email address instantly without waiting for Google Cloud Console approval.
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Your Google Email Address *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-3.5 h-3.5" />
                </div>
                <input
                  type="email"
                  required
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  placeholder="e.g. yourname@gmail.com"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-500/10 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Your Full Name (Optional)
              </label>
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="e.g. Meng Hong"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-500/10 transition"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/25 transition"
            >
              Sign In with this Google Email
            </button>
          </form>
        )}

        {/* Quick Demo Account Button */}
        {onDemoSignIn && (
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">Need instant demo access?</span>
            <button
              type="button"
              onClick={onDemoSignIn}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline"
            >
              1-Click Demo Sign-In
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
