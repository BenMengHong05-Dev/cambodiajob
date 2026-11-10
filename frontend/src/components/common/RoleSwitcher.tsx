import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../app/providers'
import { Shield, Briefcase, User, Sparkles, ChevronDown, Check } from 'lucide-react'

interface DemoRole {
  role: 'admin' | 'hr' | 'employee'
  label: string
  labelKm: string
  sublabel: string
  email: string
  icon: React.ElementType
  color: string
  badgeBg: string
  path: string
}

const DEMO_ROLES: DemoRole[] = [
  {
    role: 'admin',
    label: 'Administrator',
    labelKm: 'អ្នកគ្រប់គ្រងប្រព័ន្ធ',
    sublabel: 'Serey Vathanak • System Admin',
    email: 'admin@cambodiajobs.kh',
    icon: Shield,
    color: 'text-indigo-600',
    badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    path: '/admin/dashboard',
  },
  {
    role: 'hr',
    label: 'HR / Recruiter',
    labelKm: 'ធនធានមនុស្ស / ជ្រើសរើស',
    sublabel: 'Dara Chan • Smart Axiata',
    email: 'recruiter@smart.com.kh',
    icon: Briefcase,
    color: 'text-blue-600',
    badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
    path: '/employer/dashboard',
  },
  {
    role: 'employee',
    label: 'Employee / Seeker',
    labelKm: 'បុគ្គលិក / បេក្ខជនការងារ',
    sublabel: 'Sokha Meas • Candidate',
    email: 'sokha.meas@gmail.com',
    icon: User,
    color: 'text-emerald-600',
    badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    path: '/seeker/dashboard',
  },
]

export const RoleSwitcher: React.FC = () => {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const [isSwitching, setIsSwitching] = useState(false)

  // Determine current active role
  const currentRole = DEMO_ROLES.find((r) => {
    if (!user) return false
    if (r.role === 'admin' && user.roles.includes('admin')) return true
    if (r.role === 'hr' && user.roles.includes('employer')) return true
    if (r.role === 'employee' && user.roles.includes('job_seeker')) return true
    return false
  }) || DEMO_ROLES[1]

  const handleSwitchRole = async (target: DemoRole) => {
    if (user?.email === target.email) {
      setIsOpen(false)
      navigate(target.path)
      return
    }

    setIsSwitching(true)
    try {
      await login(target.email, 'Password123!')
      setIsOpen(false)
      navigate(target.path)
    } catch (err) {
      console.error('Failed to switch demo role:', err)
    } finally {
      setIsSwitching(false)
    }
  }

  const ActiveIcon = currentRole.icon

  return (
    <div className="relative inline-block text-left font-sans">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isSwitching}
        className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200 shadow-xs hover:border-slate-300 hover:bg-slate-50 transition text-xs font-semibold text-slate-700"
        title="Switch between the 3 UI roles (Admin, HR, Employee)"
      >
        <span className={`w-2 h-2 rounded-full ${currentRole.role === 'admin' ? 'bg-amber-500' : currentRole.role === 'hr' ? 'bg-blue-600' : 'bg-emerald-500'}`} />
        <ActiveIcon className={`w-3.5 h-3.5 ${currentRole.color}`} />
        <span className="hidden sm:inline font-bold text-slate-900">{currentRole.label}</span>
        <span className="text-[10px] px-1.5 py-0.2 rounded font-medium bg-slate-100 text-slate-500">
          Role
        </span>
        <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-3 py-2 border-b border-slate-100 mb-1">
              <div className="flex items-center space-x-1.5 text-blue-600">
                <Sparkles className="w-3.5 h-3.5" />
                <span className="text-[11px] font-bold uppercase tracking-wider">Select Role UI Experience</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">Switch between the 3 distinct roles:</p>
            </div>

            <div className="space-y-1">
              {DEMO_ROLES.map((item) => {
                const Icon = item.icon
                const isCurrent = user?.email === item.email
                return (
                  <button
                    key={item.role}
                    type="button"
                    onClick={() => handleSwitchRole(item)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition ${
                      isCurrent
                        ? 'bg-slate-100/90 text-slate-900 font-bold'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${item.badgeBg}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                          <span>{item.label}</span>
                          <span className="text-[10px] text-slate-400 font-normal">({item.labelKm})</span>
                        </div>
                        <div className="text-[10px] text-slate-500 truncate max-w-[160px]">
                          {item.sublabel}
                        </div>
                      </div>
                    </div>
                    {isCurrent && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
                  </button>
                )
              })}
            </div>

            <div className="mt-2 pt-2 border-t border-slate-100 px-3 py-1 text-[10px] text-slate-400 text-center">
              Demonstration switcher for Admin, HR & Employee roles
            </div>
          </div>
        </>
      )}
    </div>
  )
}

