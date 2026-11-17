import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  LogIn,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Building2,
  User,
  Shield,
  Briefcase,
} from 'lucide-react'
import { useAuth, useToast } from '../../app/providers'
import { redirectToGoogleOAuth } from '../../utils/googleOAuth'

export const LoginPage: React.FC = () => {
  const { t, i18n } = useTranslation()
  const { login, oauthLogin } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()

  const isKhmer = i18n.language === 'km'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const urlError = params.get('error')
    if (urlError) {
      let desc = urlError
      if (urlError === 'google_token_error' || urlError === 'token_exchange_failed') {
        desc = isKhmer
          ? 'GOOGLE_CLIENT_SECRET ក្នុង backend/.env មិនត្រឹមត្រូវ។ សូមពិនិត្យ backend/.env'
          : 'Invalid Google Client Secret. Please verify GOOGLE_CLIENT_SECRET in backend/.env.'
      } else if (urlError === 'missing_google_client_secret') {
        desc = isKhmer
          ? 'មិនទាន់កំណត់ GOOGLE_CLIENT_SECRET ក្នុង backend/.env ឡើយ។'
          : 'GOOGLE_CLIENT_SECRET is missing in backend/.env.'
      } else if (urlError === 'access_denied') {
        desc = isKhmer ? 'ការអនុញ្ញាត Google ត្រូវបានបោះបង់។' : 'Google sign-in was cancelled.'
      }
      setError(desc)
      toast.error(isKhmer ? 'Google Sign-In បរាជ័យ' : 'Google Sign-In Failed', desc)
    }
  }, [location.search, isKhmer])

  const from = (location.state as any)?.from?.pathname || '/'

  const handleSuccessfulAuth = (user: any) => {
    if (user.roles.includes('admin')) {
      navigate('/admin/dashboard')
    } else if (user.roles.includes('employer')) {
      navigate('/employer/dashboard')
    } else {
      navigate(from === '/login' ? '/seeker/dashboard' : from)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    const loadingToastId = toast.loading(
      isKhmer ? 'កំពុងផ្ទៀងផ្ទាត់ព័ត៌មាន...' : 'Verifying credentials...',
      isKhmer ? 'សូមរង់ចាំបន្តិច' : 'Please wait a moment'
    )

    try {
      const user = await login(email, password)
      toast.dismiss(loadingToastId)
      toast.success(
        isKhmer ? 'ចូលប្រើប្រាស់ជោគជ័យ!' : 'Signed in successfully!',
        isKhmer
          ? `សូមស្វាគមន៍ការវិលត្រឡប់មកវិញ ${user.full_name || ''}`
          : `Welcome back, ${user.full_name || ''}!`
      )
      handleSuccessfulAuth(user)
    } catch (err: any) {
      toast.dismiss(loadingToastId)
      const errorMsg =
        err.response?.data?.error ||
        err.response?.data?.details?.detail ||
        (isKhmer
          ? 'អ៊ីមែល ឬពាក្យសម្ងាត់មិនត្រឹមត្រូវទេ។ សូមពិនិត្យម្តងទៀត។'
          : 'Invalid email address or password. Please verify your credentials.')
      setError(errorMsg)
      toast.error(isKhmer ? 'ការចូលប្រើបានបរាជ័យ' : 'Sign in failed', errorMsg)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGoogleSignIn = () => {
    setError(null)
    setIsGoogleLoading(true)
    toast.loading(
      isKhmer ? 'កំពុងបញ្ជូនទៅកាន់ Google...' : 'Redirecting to Google...',
      isKhmer ? 'សូមរង់ចាំបន្តិច...' : 'Please wait...'
    )
    // Directly redirect to backend Google OAuth callback flow
    redirectToGoogleOAuth('job_seeker')
  }

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200/90 shadow-xl shadow-slate-900/5 p-6 sm:p-10 space-y-5 transition-all">
        {/* Form Header */}
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mb-3 shadow-2xs mx-auto">
            <LogIn className="w-6 h-6" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {t('auth.loginTitle')}
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
            {isKhmer
              ? 'បញ្ចូលព័ត៌មានគណនីរបស់អ្នកដើម្បីចូលប្រើប្រាស់ប្រព័ន្ធ'
              : 'Enter your account details to access your dashboard and recruitment tools'}
          </p>
        </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-start space-x-2 animate-in fade-in duration-150">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 mt-1.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* Email Input */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
                  {t('auth.email')}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.kh"
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-slate-50/60 focus:bg-white border border-gray-200 rounded-xl text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 transition font-normal shadow-2xs"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-700">
                    {t('auth.password')}
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      toast.info(
                        isKhmer ? 'ភ្លេចពាក្យសម្ងាត់' : 'Reset Password',
                        isKhmer
                          ? 'សូមទាក់ទងមកកាន់អ្នកគ្រប់គ្រងប្រព័ន្ធ admin@cambodiajobs.kh ដើម្បីកំណត់ពាក្យសម្ងាត់ឡើងវិញ។'
                          : 'Please contact system support at admin@cambodiajobs.kh to reset your credentials.'
                      )
                    }
                    className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 transition cursor-pointer"
                  >
                    {isKhmer ? 'ភ្លេចពាក្យសម្ងាត់?' : 'Forgot password?'}
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-11 py-2.5 text-xs bg-slate-50/60 focus:bg-white border border-gray-200 rounded-xl text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 transition font-normal shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 transition cursor-pointer"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me Checkbox */}
              <div className="flex items-center justify-between pt-0.5">
                <label className="flex items-center space-x-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="text-xs text-slate-600 font-medium">
                    {isKhmer ? 'ចងចាំគណនីលើឧបករណ៍នេះ' : 'Remember me on this device'}
                  </span>
                </label>
              </div>

              {/* Submit CTA Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white text-xs font-bold transition shadow-md shadow-blue-500/25 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <LogIn className="w-4 h-4" />
                  )}
                  <span>{isSubmitting ? (isKhmer ? 'កំពុងផ្ទៀងផ្ទាត់...' : 'Signing in...') : t('auth.loginBtn')}</span>
                  {!isSubmitting && <ArrowRight className="w-3.5 h-3.5 ml-1" />}
                </button>
              </div>
            </form>

            {/* Divider */}
            <div className="relative my-3.5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 bg-white text-slate-400 font-medium text-[10px] uppercase tracking-wider">
                  {isKhmer ? 'ឬចូលប្រើតាមរយៈ' : 'Or continue with'}
                </span>
              </div>
            </div>

            {/* Google Login Button */}
            <div>
              <button
                type="button"
                disabled={isGoogleLoading || isSubmitting}
                onClick={handleGoogleSignIn}
                className="w-full py-2.5 px-4 rounded-xl border border-gray-200 hover:border-gray-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition shadow-2xs flex items-center justify-center space-x-2.5 cursor-pointer disabled:opacity-50"
              >
                {isGoogleLoading ? (
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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
                )}
                <span>
                  {isGoogleLoading
                    ? isKhmer
                      ? 'កំពុងភ្ជាប់ Google...'
                      : 'Connecting to Google...'
                    : isKhmer
                    ? 'ចូលប្រើប្រាស់តាមរយៈ Google'
                    : 'Continue with Google'}
                </span>
              </button>
            </div>

            {/* Switch to Register */}
            <div className="pt-4 border-t border-gray-100 text-center text-xs text-slate-500">
              {t('auth.noAccount')}{' '}
              <Link
                to="/register"
                className="font-bold text-blue-600 hover:text-blue-700 hover:underline inline-flex items-center gap-1"
              >
                <span>{t('auth.registerHere')}</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
      </div>
    </div>
  )
}
