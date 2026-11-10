import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  UserPlus,
  User,
  Building2,
  Mail,
  Lock,
  Phone,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Briefcase,
  Check,
} from 'lucide-react'
import { useAuth, useToast } from '../../app/providers'
import { triggerGoogleOAuth } from '../../utils/googleOAuth'

export const RegisterPage: React.FC = () => {
  const { t, i18n } = useTranslation()
  const { register, oauthLogin } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  const isKhmer = i18n.language === 'km'

  const [role, setRole] = useState<'job_seeker' | 'employer'>('job_seeker')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [companyName, setCompanyName] = useState('')
  const [agreeTerms, setAgreeTerms] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)

  // Live Password Strength Meter
  const getPasswordStrength = () => {
    if (!password) return 0
    let score = 0
    if (password.length >= 8) score += 1
    if (/[0-9]/.test(password)) score += 1
    if (/[A-Z]/.test(password) || /[a-z]/.test(password)) score += 1
    if (/[^A-Za-z0-9]/.test(password)) score += 1
    return score
  }

  const strength = getPasswordStrength()
  const strengthLabels = [
    '',
    isKhmer ? 'ខ្សោយ (Weak)' : 'Weak',
    isKhmer ? 'មធ្យម (Fair)' : 'Fair',
    isKhmer ? 'ល្អ (Good)' : 'Good',
    isKhmer ? 'ខ្លាំង (Strong)' : 'Strong',
  ]
  const strengthColors = ['bg-slate-200', 'bg-rose-500', 'bg-amber-500', 'bg-blue-600', 'bg-emerald-600']

  const handleSuccessfulAuth = (user: any) => {
    if (user.roles.includes('employer')) {
      navigate('/employer/dashboard')
    } else {
      navigate('/seeker/dashboard')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!agreeTerms) {
      setError(
        isKhmer
          ? 'សូមយល់ព្រមតាមលក្ខខណ្ឌប្រើប្រាស់ ដើម្បីបង្កើតគណនី។'
          : 'You must agree to the Terms of Service to create an account.'
      )
      return
    }

    if (role === 'employer' && !companyName.trim()) {
      setError(
        isKhmer
          ? 'សូមបញ្ចូលឈ្មោះក្រុមហ៊ុន ឬស្ថាប័នរបស់អ្នក។'
          : 'Please provide your company or enterprise organization name.'
      )
      return
    }

    setIsSubmitting(true)

    const loadingToastId = toast.loading(
      isKhmer ? 'កំពុងបង្កើតគណនី...' : 'Creating your account...',
      isKhmer ? 'សូមរង់ចាំបន្តិច' : 'Please wait a moment'
    )

    try {
      const user = await register({
        email,
        password,
        full_name: fullName,
        phone_number: phoneNumber || undefined,
        role,
        company_name: role === 'employer' ? companyName.trim() : undefined,
      })
      toast.dismiss(loadingToastId)
      toast.success(
        isKhmer ? 'បង្កើតគណនីជោគជ័យ!' : 'Account created successfully!',
        isKhmer ? `សូមស្វាគមន៍ ${user.full_name || ''} មកកាន់ CambodiaJobs!` : `Welcome, ${user.full_name || ''}!`
      )
      handleSuccessfulAuth(user)
    } catch (err: any) {
      toast.dismiss(loadingToastId)
      const errorMsg =
        err.response?.data?.error ||
        err.response?.data?.details?.email?.[0] ||
        (isKhmer
          ? 'ការចុះឈ្មោះមិនជោគជ័យទេ។ សូមពិនិត្យព័ត៌មានរបស់អ្នកម្តងទៀត។'
          : 'Registration failed. Please check your details.')
      setError(errorMsg)
      toast.error(isKhmer ? 'ការចុះឈ្មោះបរាជ័យ' : 'Registration failed', errorMsg)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGoogleSignUp = async () => {
    setError(null)
    setIsGoogleLoading(true)

    const loadingToastId = toast.loading(
      isKhmer ? 'កំពុងបើកផ្ទាំង Google...' : 'Connecting to Google...',
      isKhmer ? 'សូមជ្រើសរើសគណនី Google របស់អ្នក' : 'Please select your Google account'
    )

    try {
      const googleUser = await triggerGoogleOAuth()
      const user = await oauthLogin({
        provider: 'google',
        email: googleUser.email,
        full_name: googleUser.name,
        avatar_url: googleUser.picture,
        role: role,
      })
      toast.dismiss(loadingToastId)
      toast.success(
        isKhmer ? 'ចុះឈ្មោះជោគជ័យ!' : 'Account created with Google!',
        isKhmer
          ? `សូមស្វាគមន៍ ${user.full_name || googleUser.name} មកកាន់ CambodiaJobs!`
          : `Welcome, ${user.full_name || googleUser.name}!`
      )
      handleSuccessfulAuth(user)
    } catch (err: any) {
      toast.dismiss(loadingToastId)
      console.error('Google Sign-Up Error:', err)
      const errorMsg =
        err.message === 'MISSING_CLIENT_ID'
          ? isKhmer
            ? 'មិនទាន់កំណត់ Google Client ID នៅក្នុងប្រព័ន្ធឡើយ។'
            : 'Google Client ID is missing. Please check .env configuration.'
          : isKhmer
          ? 'ការចុះឈ្មោះតាមរយៈ Google ត្រូវបានបោះបង់ ឬមានបញ្ហាផ្ទៀងផ្ទាត់។'
          : err.message || 'Google sign-up was cancelled or encountered an issue.'
      setError(errorMsg)
      toast.error(isKhmer ? 'Google Sign-Up បរាជ័យ' : 'Google Sign-Up Failed', errorMsg)
    } finally {
      setIsGoogleLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="w-full max-w-4xl bg-white rounded-3xl border border-gray-200 shadow-xl shadow-slate-900/5 overflow-hidden grid grid-cols-1 lg:grid-cols-12 transition-all">
        {/* Left Column: Visual Showcase (Royal Blue Gradient) */}
        <div className="lg:col-span-5 bg-gradient-to-br from-blue-700 via-blue-800 to-slate-900 text-white p-8 sm:p-10 flex flex-col justify-between relative overflow-hidden">
          {/* Ambient Glows */}
          <div className="absolute -top-20 -left-20 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

          {/* Top Brand Block */}
          <div className="relative z-10 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[11px] font-semibold text-blue-100">
              <Sparkles className="w-3.5 h-3.5 text-blue-300" />
              <span>{isKhmer ? 'ចូលរួមជាមួយសហគមន៍ការងារ' : 'Join CambodiaJobs Today'}</span>
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
                {isKhmer ? 'ចាប់ផ្តើមដំណើរការងារថ្មី' : 'Start Your Journey'}
              </h1>
              <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed font-normal">
                {isKhmer
                  ? 'បង្កើតគណនីតែមួយ ដើម្បីស្វែងរកការងារដែលស័ក្តិសម ឬជ្រើសរើសបុគ្គលិកឆ្នើមសម្រាប់អាជីវកម្មរបស់អ្នក។'
                  : 'A single account to explore verified career opportunities or discover top talent across Cambodia.'}
              </p>
            </div>

            {/* Benefits List */}
            <div className="space-y-3 pt-2">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 rounded-lg bg-blue-500/20 border border-blue-400/30 flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-300" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">
                    {isKhmer ? 'ប្រព័ន្ធមានសុវត្ថិភាព និងការអនុម័តច្បាស់លាស់' : 'Safe & Admin-Approved Platform'}
                  </h4>
                  <p className="text-[11px] text-blue-200/80 leading-normal">
                    {isKhmer ? 'មានតែក្រុមហ៊ុនដែលបានផ្ទៀងផ្ទាត់ប៉ុណ្ណោះដែលអាចផ្សាយការងារ' : 'Strict verification prevents duplicate & fake posts'}
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 rounded-lg bg-blue-500/20 border border-blue-400/30 flex items-center justify-center shrink-0 mt-0.5">
                  <Briefcase className="w-3.5 h-3.5 text-blue-300" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">
                    {isKhmer ? 'ប្រវត្តិរូបសង្ខេបស្ដង់ដារ (Modern CV)' : 'Smart Portfolio & Resumes'}
                  </h4>
                  <p className="text-[11px] text-blue-200/80 leading-normal">
                    {isKhmer ? 'ភ្ជាប់ជំនាញ ការសិក្សា និងបទពិសោធន៍' : 'Showcase your skills & experience effectively'}
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 rounded-lg bg-blue-500/20 border border-blue-400/30 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-300" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">
                    {isKhmer ? 'ទិន្នន័យជាក់ស្ដែង និងលឿនរហ័ស' : 'Real-Time Recruitment'}
                  </h4>
                  <p className="text-[11px] text-blue-200/80 leading-normal">
                    {isKhmer ? 'ទទួលដំណឹងភ្លាមៗនៅពេលមានការឆ្លើយតប' : 'Instant status updates on applications'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Card */}
          <div className="relative z-10 mt-8 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-blue-100">
            <span className="font-medium">{isKhmer ? 'ឥតគិតថ្លៃ ១០០% សម្រាប់បេក្ខជន' : '100% Free for Candidates'}</span>
            <span className="font-mono text-[11px] text-blue-300">CambodiaJobs Platform</span>
          </div>
        </div>

        {/* Right Column: Modern Registration Form */}
        <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-center bg-white">
          <div className="max-w-md w-full mx-auto space-y-4">
            {/* Header */}
            <div>
              <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mb-2.5 shadow-2xs">
                <UserPlus className="w-5 h-5" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                {t('auth.registerTitle')}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {isKhmer
                  ? 'ជ្រើសរើសប្រភេទគណនីរបស់អ្នក ហើយបំពេញព័ត៌មានខាងក្រោម'
                  : 'Select your account role and fill in your credentials to get started'}
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-start space-x-2 animate-in fade-in duration-150">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 mt-1.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Interactive Role Switcher Tabs (Small, Clear & Beautiful) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-800">
                {isKhmer ? 'ប្រភេទគណនីរបស់អ្នក៖' : t('auth.accountType', 'Account Type:')}
              </label>
              <div className="grid grid-cols-2 gap-3">
                {/* Option 1: Job Seeker */}
                <button
                  type="button"
                  onClick={() => setRole('job_seeker')}
                  className={`p-3 sm:p-3.5 rounded-2xl text-left transition-all duration-200 cursor-pointer relative border flex flex-col justify-between ${
                    role === 'job_seeker'
                      ? 'border-2 border-blue-500 bg-blue-50/20 ring-4 ring-blue-500/10 shadow-xs'
                      : 'border border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60 shadow-2xs'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2.5">
                    <div
                      className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all duration-200 ${
                        role === 'job_seeker'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      <User className="w-4 h-4" />
                    </div>
                    {role === 'job_seeker' && (
                      <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xs animate-in zoom-in-75 duration-150">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    )}
                  </div>
                  <div>
                    <h4 className={`text-xs sm:text-sm font-bold leading-tight ${
                      role === 'job_seeker' ? 'text-slate-900' : 'text-slate-800'
                    }`}>
                      {isKhmer ? 'បេក្ខជនស្វែងរកការងារ' : t('auth.roleJobSeeker', 'Job Seeker')}
                    </h4>
                    <p className={`text-[10px] sm:text-[11px] leading-normal mt-0.5 ${
                      role === 'job_seeker' ? 'text-blue-700/80 font-medium' : 'text-slate-500'
                    }`}>
                      {isKhmer ? 'ស្វែងរកការងារ & ដាក់ពាក្យ' : t('auth.seekerDesc', 'Find jobs & apply')}
                    </p>
                  </div>
                </button>

                {/* Option 2: Employer */}
                <button
                  type="button"
                  onClick={() => setRole('employer')}
                  className={`p-3 sm:p-3.5 rounded-2xl text-left transition-all duration-200 cursor-pointer relative border flex flex-col justify-between ${
                    role === 'employer'
                      ? 'border-2 border-blue-500 bg-blue-50/20 ring-4 ring-blue-500/10 shadow-xs'
                      : 'border border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60 shadow-2xs'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2.5">
                    <div
                      className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center transition-all duration-200 ${
                        role === 'employer'
                          ? 'bg-blue-600 text-white rounded-full shadow-xs'
                          : 'bg-slate-100 text-slate-500 rounded-xl'
                      }`}
                    >
                      <Building2 className="w-4 h-4" />
                    </div>
                    {role === 'employer' && (
                      <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xs animate-in zoom-in-75 duration-150">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    )}
                  </div>
                  <div>
                    <h4 className={`text-xs sm:text-sm font-bold leading-tight ${
                      role === 'employer' ? 'text-slate-900' : 'text-slate-800'
                    }`}>
                      {isKhmer ? 'និយោជក / ក្រុមហ៊ុន' : t('auth.roleEmployer', 'Employer / Company')}
                    </h4>
                    <p className={`text-[10px] sm:text-[11px] leading-normal mt-0.5 ${
                      role === 'employer' ? 'text-blue-700/80 font-medium' : 'text-slate-500'
                    }`}>
                      {isKhmer ? 'ផ្សាយការងារ & រើសបុគ្គលិក' : t('auth.employerDesc', 'Post jobs & hire talent')}
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Full Name */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
                  {t('auth.fullName')} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={isKhmer ? 'ឧ. សុខ ចាន់ថន' : 'e.g. John Doe'}
                    className="w-full pl-10 pr-3.5 py-2 text-xs bg-slate-50/60 focus:bg-white border border-gray-200 rounded-xl text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 transition font-normal shadow-2xs"
                  />
                </div>
              </div>

              {/* Employer Company Name */}
              {role === 'employer' && (
                <div className="space-y-1 animate-in fade-in duration-150">
                  <label className="block text-xs font-semibold text-slate-700">
                    {t('auth.companyName')} <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder={isKhmer ? 'ឧ. ធនាគារ អេស៊ីលីដា ភីអិលស៊ី' : 'e.g. ACLEDA Bank Plc.'}
                      className="w-full pl-10 pr-3.5 py-2 text-xs bg-slate-50/60 focus:bg-white border border-gray-200 rounded-xl text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 transition font-normal shadow-2xs"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 block">
                    {isKhmer
                      ? 'ក្រុមហ៊ុននឹងត្រូវពិនិត្យ និងអនុម័តដោយ Admin មុនពេលអាចចុះផ្សាយការងារ'
                      : 'Company requires Administrator approval before publishing live vacancies'}
                  </span>
                </div>
              )}

              {/* Email Address */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
                  {t('auth.email')} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.kh"
                    className="w-full pl-10 pr-3.5 py-2 text-xs bg-slate-50/60 focus:bg-white border border-gray-200 rounded-xl text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 transition font-normal shadow-2xs"
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
                  {isKhmer ? 'លេខទូរស័ព្ទ (ជាជម្រើស)' : 'Phone Number (Optional)'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="012 345 678"
                    className="w-full pl-10 pr-3.5 py-2 text-xs bg-slate-50/60 focus:bg-white border border-gray-200 rounded-xl text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 transition font-normal shadow-2xs"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
                  {t('auth.password')} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-11 py-2 text-xs bg-slate-50/60 focus:bg-white border border-gray-200 rounded-xl text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 transition font-normal shadow-2xs"
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

                {/* Password Strength Meter */}
                {password && (
                  <div className="pt-1 space-y-1 animate-in fade-in duration-150">
                    <div className="grid grid-cols-4 gap-1 h-1">
                      {[1, 2, 3, 4].map((step) => (
                        <div
                          key={step}
                          className={`rounded-full h-full transition-all ${
                            strength >= step ? strengthColors[strength] : 'bg-slate-200'
                          }`}
                        />
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-slate-400 font-medium">
                        {isKhmer ? 'កម្រិតសុវត្ថិភាពពាក្យសម្ងាត់៖' : 'Password strength:'}
                      </span>
                      <span
                        className={`font-semibold ${
                          strength <= 1
                            ? 'text-rose-600'
                            : strength === 2
                            ? 'text-amber-600'
                            : strength === 3
                            ? 'text-blue-600'
                            : 'text-emerald-600'
                        }`}
                      >
                        {strengthLabels[strength]}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Terms Checkbox */}
              <div className="pt-1">
                <label className="flex items-start space-x-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="w-3.5 h-3.5 mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="text-xs text-slate-600 leading-snug">
                    {isKhmer ? 'ខ្ញុំយល់ព្រមតាម ' : 'I agree to the '}
                    <span className="text-blue-600 font-semibold">{isKhmer ? 'លក្ខខណ្ឌប្រើប្រាស់' : 'Terms of Service'}</span>
                    {isKhmer ? ' និង ' : ' and '}
                    <span className="text-blue-600 font-semibold">{isKhmer ? 'គោលការណ៍ឯកជនភាព' : 'Privacy Policy'}</span>
                  </span>
                </label>
              </div>

              {/* Submit CTA Button */}
              <div className="pt-1">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white text-xs font-bold transition shadow-md shadow-blue-500/25 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <UserPlus className="w-4 h-4" />
                  )}
                  <span>{isSubmitting ? (isKhmer ? 'កំពុងបង្កើតគណនី...' : 'Creating account...') : t('auth.registerBtn')}</span>
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
                  {isKhmer ? 'ឬចុះឈ្មោះតាមរយៈ' : 'Or register with'}
                </span>
              </div>
            </div>

            {/* Google Register Button */}
            <div>
              <button
                type="button"
                disabled={isGoogleLoading || isSubmitting}
                onClick={handleGoogleSignUp}
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
                    ? `ចុះឈ្មោះជា ${role === 'employer' ? 'និយោជក' : 'បេក្ខជន'} តាម Google`
                    : `Sign up as ${role === 'employer' ? 'Employer' : 'Candidate'} with Google`}
                </span>
              </button>
            </div>

            {/* Switch to Login */}
            <div className="pt-3 border-t border-gray-100 text-center text-xs text-slate-500">
              {t('auth.haveAccount')}{' '}
              <Link
                to="/login"
                className="font-bold text-blue-600 hover:text-blue-700 hover:underline inline-flex items-center gap-1"
              >
                <span>{t('auth.signInHere')}</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
