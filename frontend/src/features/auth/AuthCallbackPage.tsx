import React, { useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth, useToast } from '../../app/providers'
import { authService } from '../../services/auth.service'
import { Loader2 } from 'lucide-react'

export const AuthCallbackPage: React.FC = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { refreshUser } = useAuth()
  const { toast } = useToast()
  const { i18n } = useTranslation()
  const isKhmer = i18n.language === 'km'
  const processedRef = useRef(false)

  useEffect(() => {
    if (processedRef.current) return
    processedRef.current = true

    const error = searchParams.get('error')
    const access = searchParams.get('access')
    const refresh = searchParams.get('refresh')
    const name = searchParams.get('name')

    if (error) {
      let desc = error
      if (error === 'missing_google_client_secret') {
        desc = isKhmer
          ? 'មិនទាន់កំណត់ GOOGLE_CLIENT_SECRET ក្នុង backend .env ឡើយ។ សូមកំណត់ SECRET នៅក្នុង backend/.env'
          : 'GOOGLE_CLIENT_SECRET is missing in backend/.env. Please configure it.'
      } else if (error === 'missing_google_client_id') {
        desc = isKhmer
          ? 'មិនទាន់កំណត់ GOOGLE_CLIENT_ID ក្នុង backend .env ឡើយ។'
          : 'GOOGLE_CLIENT_ID is missing in backend/.env.'
      } else if (error === 'google_token_error' || error === 'token_exchange_failed') {
        desc = isKhmer
          ? 'GOOGLE_CLIENT_SECRET ក្នុង backend/.env មិនត្រឹមត្រូវ ឬផុតកំណត់។ សូមពិនិត្យមើល Google Cloud Console។'
          : 'Invalid Google Client Secret or code exchange failed. Please verify GOOGLE_CLIENT_SECRET in backend/.env.'
      } else if (error === 'access_denied') {
        desc = isKhmer ? 'ការអនុញ្ញាត Google ត្រូវបានបោះបង់។' : 'Google sign-in was cancelled.'
      } else if (error === 'deleted_client') {
        desc = isKhmer
          ? 'OAuth Client ត្រូវបានលុបចេញពី Google Cloud Console'
          : 'OAuth Client was deleted in Google Cloud Console'
      }

      toast.error(isKhmer ? 'Google Sign-In បរាជ័យ' : 'Google Sign-In Failed', desc)
      navigate('/login', { replace: true })
      return
    }

    if (access && refresh) {
      localStorage.setItem('access_token', access)
      localStorage.setItem('refresh_token', refresh)

      authService
        .getCurrentUser()
        .then(async (user) => {
          await refreshUser()
          toast.success(
            isKhmer ? 'ចូលប្រើប្រាស់ជោគជ័យ!' : 'Signed in with Google!',
            isKhmer
              ? `សូមស្វាគមន៍ ${user.full_name || name || ''}`
              : `Welcome, ${user.full_name || name || ''}!`
          )
          if (user.roles?.includes('admin')) {
            navigate('/admin/dashboard', { replace: true })
          } else if (user.roles?.includes('employer')) {
            navigate('/employer/dashboard', { replace: true })
          } else {
            navigate('/seeker/dashboard', { replace: true })
          }
        })
        .catch((err) => {
          console.error('Failed to load user in OAuth callback:', err)
          navigate('/login', { replace: true })
        })
    } else {
      navigate('/login', { replace: true })
    }
  }, [searchParams, navigate, refreshUser, toast, isKhmer])

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mb-4 text-blue-600 shadow-sm animate-pulse">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
      <h2 className="text-lg font-bold text-slate-900 mb-1">
        {isKhmer ? 'កំពុងផ្ទៀងផ្ទាត់គណនី Google...' : 'Authenticating with Google...'}
      </h2>
      <p className="text-xs text-slate-500 max-w-sm">
        {isKhmer
          ? 'សូមរង់ចាំបន្តិច ប្រព័ន្ធកំពុងរៀបចំការចូលប្រើប្រាស់របស់អ្នក។'
          : 'Please wait a moment while we set up your secure session.'}
      </p>
    </div>
  )
}
