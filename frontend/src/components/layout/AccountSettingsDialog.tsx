import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  User as UserIcon,
  Lock,
  Mail,
  Phone,
  Shield,
  Eye,
  EyeOff,
  CheckCircle2,
  Loader2,
  Building2,
} from 'lucide-react'
import { Dialog } from '../ui/Dialog'
import { useAuth } from '../../app/providers'
import { authService } from '../../services/auth.service'
import { useToast } from '../ui/Toast'
import { getCompanyRoleLabel, getSystemRoleLabel } from '../../utils/permissions'

export interface AccountSettingsDialogProps {
  isOpen: boolean
  onClose: () => void
  initialTab?: 'account' | 'password'
}

export const AccountSettingsDialog: React.FC<AccountSettingsDialogProps> = ({
  isOpen,
  onClose,
  initialTab = 'account',
}) => {
  const { user, refreshUser, isSuperAdmin } = useAuth()
  const { i18n } = useTranslation()
  const { toast } = useToast()
  const isKhmer = i18n.language === 'km'

  const [activeTab, setActiveTab] = useState<'account' | 'password'>(initialTab)
  const [fullName, setFullName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [isSavingProfile, setIsSavingProfile] = useState(false)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPw, setShowCurrentPw] = useState(false)
  const [showNewPw, setShowNewPw] = useState(false)
  const [showConfirmPw, setShowConfirmPw] = useState(false)
  const [isSavingPassword, setIsSavingPassword] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab)
      setFullName(user?.full_name || '')
      setPhoneNumber(user?.phone_number || '')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    }
  }, [isOpen, initialTab, user])

  const primaryRoleKey =
    user?.id === 1 || user?.roles?.includes('super_admin')
      ? 'super_admin'
      : user?.roles?.[0] || user?.role || 'job_seeker'

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName.trim()) {
      toast.error(
        isKhmer ? 'ត្រូវការឈ្មោះពេញ' : 'Full name is required',
        isKhmer ? 'សូមបញ្ចូលឈ្មោះពេញរបស់អ្នក។' : 'Please enter your full name.'
      )
      return
    }
    setIsSavingProfile(true)
    try {
      await authService.updateMe({
        full_name: fullName.trim(),
        phone_number: phoneNumber.trim(),
      })
      await refreshUser()
      toast.success(
        isKhmer ? 'បានរក្សាទុកព័ត៌មានគណនី' : 'Account updated',
        isKhmer
          ? 'ព័ត៌មានផ្ទាល់ខ្លួនរបស់អ្នកត្រូវបានកែប្រែដោយជោគជ័យ។'
          : 'Your account details have been updated successfully.'
      )
      onClose()
    } catch (err: any) {
      toast.error(
        isKhmer ? 'មិនអាចរក្សាទុកបានទេ' : 'Update failed',
        err?.response?.data?.message ||
          (isKhmer ? 'សូមព្យាយាមម្តងទៀត។' : 'Unable to update account details.')
      )
    } finally {
      setIsSavingProfile(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentPassword || !newPassword) {
      toast.error(
        isKhmer ? 'សូមបំពេញគ្រប់ប្រអប់' : 'Missing fields',
        isKhmer
          ? 'សូមបញ្ចូលពាក្យសម្ងាត់បច្ចុប្បន្ន និងពាក្យសម្ងាត់ថ្មី។'
          : 'Please enter both current and new password.'
      )
      return
    }
    if (newPassword.length < 6) {
      toast.error(
        isKhmer ? 'ពាក្យសម្ងាត់ខ្លីពេក' : 'Password too short',
        isKhmer
          ? 'ពាក្យសម្ងាត់ថ្មីត្រូវមានយ៉ាងតិច 6 តួអក្សរ។'
          : 'New password must be at least 6 characters.'
      )
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error(
        isKhmer ? 'ពាក្យសម្ងាត់មិនត្រូវគ្នា' : 'Passwords do not match',
        isKhmer
          ? 'សូមបញ្ជាក់ពាក្យសម្ងាត់ថ្មីឱ្យដូចគ្នា។'
          : 'Confirm password must match the new password.'
      )
      return
    }

    setIsSavingPassword(true)
    try {
      await authService.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      toast.success(
        isKhmer ? 'បានប្តូរពាក្យសម្ងាត់ដោយជោគជ័យ' : 'Password changed',
        isKhmer
          ? 'ពាក្យសម្ងាត់ថ្មីរបស់អ្នកត្រូវបានធ្វើបច្ចុប្បន្នភាព។'
          : 'Your password has been updated securely.'
      )
      onClose()
    } catch (err: any) {
      toast.error(
        isKhmer ? 'មិនអាចប្តូរពាក្យសម្ងាត់បានទេ' : 'Password change failed',
        err?.response?.data?.message ||
          (isKhmer
            ? 'ពាក្យសម្ងាត់បច្ចុប្បន្នមិនត្រឹមត្រូវ។'
            : 'Current password is incorrect or invalid.')
      )
    } finally {
      setIsSavingPassword(false)
    }
  }

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      icon={
        activeTab === 'account' ? (
          <UserIcon className="w-5 h-5 text-blue-600" />
        ) : (
          <Lock className="w-5 h-5 text-indigo-600" />
        )
      }
      iconClassName="bg-blue-50 border border-blue-100"
      title={isKhmer ? 'ការកំណត់គណនី និងសុវត្ថិភាព' : 'Account & Security'}
      description={
        isKhmer
          ? 'គ្រប់គ្រងឈ្មោះ លេខទូរស័ព្ទ និងពាក្យសម្ងាត់គណនីរបស់អ្នក'
          : 'Manage your display name, phone number, and password'
      }
    >
      <div className="space-y-5 font-sans">
        {/* Tabs */}
        <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-100 border border-slate-200/80">
          <button
            type="button"
            onClick={() => setActiveTab('account')}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === 'account'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/70'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserIcon className="w-3.5 h-3.5" />
            <span>{isKhmer ? 'ព័ត៌មានគណនី' : 'Account Info'}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('password')}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === 'password'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/70'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>{isKhmer ? 'ប្តូរពាក្យសម្ងាត់' : 'Change Password'}</span>
          </button>
        </div>

        {activeTab === 'account' ? (
          <form onSubmit={handleSaveProfile} className="space-y-4">
            {/* Role & Email Summary */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2 text-xs text-slate-600 min-w-0">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate font-medium text-slate-800">{user?.email}</span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200/80">
                    <Shield className="w-3 h-3" />
                    <span>
                      {isSuperAdmin
                        ? getSystemRoleLabel('super_admin', isKhmer)
                        : getSystemRoleLabel(primaryRoleKey, isKhmer)}
                    </span>
                  </span>
                  {user?.company_member_role && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/80">
                      <Building2 className="w-3 h-3" />
                      <span>{getCompanyRoleLabel(user.company_member_role, isKhmer)}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {isKhmer ? 'ឈ្មោះពេញ' : 'Full Name'}
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={isKhmer ? 'បញ្ចូលឈ្មោះពេញ' : 'Enter your full name'}
                  className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {isKhmer ? 'លេខទូរស័ព្ទ' : 'Phone Number'}
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder={isKhmer ? 'ឧ. 012 345 678' : 'e.g. +855 12 345 678'}
                  className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                {isKhmer ? 'បោះបង់' : 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={isSavingProfile}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-bold shadow-xs transition cursor-pointer"
              >
                {isSavingProfile ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                )}
                <span>{isKhmer ? 'រក្សាទុកការផ្លាស់ប្តូរ' : 'Save Changes'}</span>
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {isKhmer ? 'ពាក្យសម្ងាត់បច្ចុប្បន្ន' : 'Current Password'}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showCurrentPw ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2.5 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {isKhmer ? 'ពាក្យសម្ងាត់ថ្មី (យ៉ាងតិច 6 តួ)' : 'New Password (min 6 characters)'}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showNewPw ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2.5 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {isKhmer ? 'បញ្ជាក់ពាក្យសម្ងាត់ថ្មី' : 'Confirm New Password'}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showConfirmPw ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2.5 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                {isKhmer ? 'បោះបង់' : 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={isSavingPassword}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-xs font-bold shadow-xs transition cursor-pointer"
              >
                {isSavingPassword ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                )}
                <span>{isKhmer ? 'ធ្វើបច្ចុប្បន្នភាពពាក្យសម្ងាត់' : 'Update Password'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </Dialog>
  )
}
