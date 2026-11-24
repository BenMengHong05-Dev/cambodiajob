import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useToast } from '../../app/providers'
import { adminService } from '../../services/admin.service'
import { TablePagination } from '../../components/common/TablePagination'
import { AdminPageHeader } from '../../components/layout/dashboard'
import { Dialog } from '../../components/ui/Dialog'
import { FacebookVerifiedBadge } from '../../components/common/FacebookVerifiedBadge'
import { getAssetUrl } from '../../utils/assets'
import {
  Building,
  Check,
  X,
  Search,
  MapPin,
  Mail,
  Calendar,
  ShieldCheck,
  Clock,
  XCircle,
  ExternalLink,
  Trash2,
  Briefcase,
  AlertTriangle,
  Eye,
  Globe,
  Phone,
  Shield,
  Users,
  Plus,
  UserPlus,
  Lock,
  FileText,
  CheckCircle2,
  Pencil,
} from 'lucide-react'

export const AdminCompaniesPage: React.FC = () => {
  const { toast } = useToast()
  const { i18n } = useTranslation()
  const isKhmer = i18n.language === 'km'

  const [companies, setCompanies] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'verified' | 'rejected'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [isLoading, setIsLoading] = useState(true)
  const [actionInProgress, setActionInProgress] = useState<number | null>(null)

  // Company Inspection Detail Modal State
  const [viewingCompany, setViewingCompany] = useState<any | null>(null)
  const [companyMembers, setCompanyMembers] = useState<any[]>([])
  const [isLoadingMembers, setIsLoadingMembers] = useState(false)
  const [showAddMember, setShowAddMember] = useState(false)
  const [newMemberName, setNewMemberName] = useState('')
  const [newMemberEmail, setNewMemberEmail] = useState('')
  const [newMemberPassword, setNewMemberPassword] = useState('')
  const [newMemberPhone, setNewMemberPhone] = useState('')
  const [newMemberRole, setNewMemberRole] = useState('recruiter')
  const [isAddingMember, setIsAddingMember] = useState(false)

  const loadCompanyMembers = async (companyId: number) => {
    setIsLoadingMembers(true)
    try {
      const res = await adminService.getCompanyMembers(companyId)
      setCompanyMembers(res.data || [])
    } catch (err) {
      console.error('Failed to load company members:', err)
      setCompanyMembers([])
    } finally {
      setIsLoadingMembers(false)
    }
  }

  // Edit Company State
  const [editingCompany, setEditingCompany] = useState<any | null>(null)
  const [editName, setEditName] = useState('')
  const [editIndustry, setEditIndustry] = useState('')
  const [editProvince, setEditProvince] = useState('')
  const [editAddress, setEditAddress] = useState('')
  const [editWebsite, setEditWebsite] = useState('')
  const [editCompanySize, setEditCompanySize] = useState('10-50')
  const [editDescription, setEditDescription] = useState('')
  const [editVerificationStatus, setEditVerificationStatus] = useState<'pending' | 'verified' | 'rejected'>('verified')
  const [isUpdatingCompany, setIsUpdatingCompany] = useState(false)

  const handleOpenEditCompany = (c: any) => {
    setEditingCompany(c)
    setEditName(c.name || '')
    setEditIndustry(c.industry || '')
    setEditProvince(c.province || '')
    setEditAddress(c.address || '')
    setEditWebsite(c.website || '')
    setEditCompanySize(c.company_size || '10-50')
    setEditDescription(c.description || '')
    setEditVerificationStatus(c.verification_status || 'verified')
  }

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCompany) return
    setIsUpdatingCompany(true)
    try {
      await adminService.updateCompany(editingCompany.id, {
        name: editName.trim(),
        industry: editIndustry.trim(),
        province: editProvince.trim(),
        address: editAddress.trim(),
        website: editWebsite.trim(),
        company_size: editCompanySize,
        description: editDescription,
        verification_status: editVerificationStatus,
      })
      toast.success(
        isKhmer ? 'បានកែសម្រួលជោគជ័យ' : 'Company Updated',
        isKhmer ? 'ព័ត៌មានក្រុមហ៊ុនត្រូវបានកែប្រែដោយជោគជ័យ។' : 'Company profile has been updated successfully.'
      )
      setEditingCompany(null)
      loadCompanies()
      if (viewingCompany && viewingCompany.id === editingCompany.id) {
        setViewingCompany((prev: any) => ({
          ...prev,
          name: editName.trim(),
          industry: editIndustry.trim(),
          province: editProvince.trim(),
          address: editAddress.trim(),
          website: editWebsite.trim(),
          company_size: editCompanySize,
          description: editDescription,
          verification_status: editVerificationStatus,
        }))
      }
    } catch (err: any) {
      console.error('Failed to update company:', err)
      toast.error(
        isKhmer ? 'បរាជ័យ' : 'Update Failed',
        err?.response?.data?.message || (isKhmer ? 'មិនអាចកែសម្រួលព័ត៌មានក្រុមហ៊ុនបានទេ។' : 'Failed to update company information.')
      )
    } finally {
      setIsUpdatingCompany(false)
    }
  }

  const handleOpenViewingCompany = (c: any) => {
    setViewingCompany(c)
    setShowAddMember(false)
    loadCompanyMembers(c.id)
  }

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!viewingCompany) return
    if (!newMemberEmail.trim()) {
      toast.error('Validation Error', 'Email is required.')
      return
    }
    setIsAddingMember(true)
    try {
      await adminService.addCompanyMember(viewingCompany.id, {
        full_name: newMemberName.trim() || undefined,
        email: newMemberEmail.trim().toLowerCase(),
        password: newMemberPassword.trim() || undefined,
        phone_number: newMemberPhone.trim() || undefined,
        role: newMemberRole,
      })
      toast.success(
        isKhmer ? 'បានបន្ថែមបុគ្គលិក' : 'Employee Added',
        isKhmer ? 'បុគ្គលិកត្រូវបានភ្ជាប់ជាមួយក្រុមហ៊ុនដោយជោគជ័យ' : 'Sub-user employee has been added to the company.'
      )
      setNewMemberName('')
      setNewMemberEmail('')
      setNewMemberPassword('')
      setNewMemberPhone('')
      setNewMemberRole('recruiter')
      setShowAddMember(false)
      loadCompanyMembers(viewingCompany.id)
    } catch (err: any) {
      const msg = err.response?.data?.email || err.response?.data?.detail || err.response?.data?.message || 'Failed to add employee.'
      toast.error('Action Failed', String(msg))
    } finally {
      setIsAddingMember(false)
    }
  }

  const handleRemoveMember = async (userId: number) => {
    if (!viewingCompany) return
    if (!confirm(isKhmer ? 'តើអ្នកពិតជាចង់ដកបុគ្គលិកនេះចេញពីក្រុមហ៊ុនមែនទេ?' : 'Are you sure you want to remove this employee from the company?')) return
    try {
      await adminService.removeCompanyMember(viewingCompany.id, userId)
      toast.success(
        isKhmer ? 'បានដកបុគ្គលិក' : 'Employee Removed',
        isKhmer ? 'បុគ្គលិកត្រូវបានដកចេញពីក្រុមហ៊ុនដោយជោគជ័យ' : 'Employee has been removed from the company.'
      )
      loadCompanyMembers(viewingCompany.id)
    } catch (err: any) {
      toast.error('Error', 'Could not remove member.')
    }
  }

  const handleUpdateMemberRole = async (userId: number, role: string) => {
    if (!viewingCompany) return
    try {
      await adminService.updateCompanyMemberRole(viewingCompany.id, userId, role)
      toast.success(
        isKhmer ? 'កែប្រែតួនាទីជោគជ័យ' : 'Role Updated',
        isKhmer ? `បានផ្លាស់ប្តូរតួនាទីទៅជា ${role.toUpperCase()}` : `Role updated to ${role.toUpperCase()}`
      )
      setCompanyMembers((prev: any[]) =>
        prev.map((m: any) => (m.user_id === userId ? { ...m, member_role: role } : m))
      )
    } catch (err: any) {
      toast.error('Error', err.response?.data?.detail || 'Failed to update member role')
    }
  }

  // Delete Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deletingCompany, setDeletingCompany] = useState<any | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const loadCompanies = async () => {
    setIsLoading(true)
    try {
      const data = await adminService.getCompanies()
      setCompanies(data || [])
    } catch (err) {
      console.error('Failed to load companies:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadCompanies()
  }, [])

  const handleVerifyCompany = async (companyId: number, status: 'verified' | 'rejected') => {
    setActionInProgress(companyId)
    try {
      await adminService.verifyCompany(companyId, status)
      toast.success(
        isKhmer ? 'ការផ្ទៀងផ្ទាត់សហគ្រាស' : 'Enterprise Verification',
        status === 'verified'
          ? isKhmer
            ? 'ក្រុមហ៊ុនត្រូវបានអនុម័ត និងផ្ទៀងផ្ទាត់ជោគជ័យ!'
            : 'Company approved and verified successfully!'
          : isKhmer
            ? 'ការផ្ទៀងផ្ទាត់ត្រូវបានបដិសេធ។'
            : 'Company verification rejected.'
      )
      if (viewingCompany && viewingCompany.id === companyId) {
        setViewingCompany({ ...viewingCompany, verification_status: status })
      }
      loadCompanies()
    } catch (err) {
      toast.error('Action Failed', 'Could not complete company verification.')
    } finally {
      setActionInProgress(null)
    }
  }

  // Open Delete Modal
  const handleOpenDelete = (c: any) => {
    setDeletingCompany(c)
    setDeleteModalOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!deletingCompany) return
    setIsDeleting(true)
    try {
      await adminService.deleteCompany(deletingCompany.id)
      toast.success(
        isKhmer ? 'បានលុប' : 'Deleted',
        isKhmer
          ? `ក្រុមហ៊ុន "${deletingCompany.name}" ត្រូវបានលុបជោគជ័យ!`
          : `Company "${deletingCompany.name}" deleted successfully!`
      )
      setDeleteModalOpen(false)
      loadCompanies()
    } catch (err: any) {
      toast.error(
        isKhmer ? 'បរាជ័យ' : 'Error',
        err.response?.data?.message || 'Could not delete company.'
      )
    } finally {
      setIsDeleting(false)
    }
  }

  const filteredCompanies = companies.filter((c) => {
    const matchesStatus = statusFilter === 'all' || c.verification_status === statusFilter
    const q = search.toLowerCase().trim()
    const matchesSearch =
      !q ||
      c.name?.toLowerCase().includes(q) ||
      c.owner_name?.toLowerCase().includes(q) ||
      c.owner_email?.toLowerCase().includes(q) ||
      c.industry?.toLowerCase().includes(q) ||
      c.province?.toLowerCase().includes(q)

    return matchesStatus && matchesSearch
  })

  const pendingCount = companies.filter((c) => c.verification_status === 'pending').length
  const verifiedCount = companies.filter((c) => c.verification_status === 'verified').length
  const rejectedCount = companies.filter((c) => c.verification_status === 'rejected').length

  if (isLoading) {
    return (
      <div className="py-24 text-center font-sans">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="mt-3 text-xs font-normal text-slate-400">
          {isKhmer ? 'កំពុងដំណើរការទាញយកក្រុមហ៊ុន...' : 'Loading companies...'}
        </p>
      </div>
    )
  }

  return (
    <div className="w-full space-y-3.5 font-sans pb-12">
      {/* 1. Header Bar: Using AdminPageHeader */}
      <AdminPageHeader
        title={isKhmer ? 'ផ្ទៀងផ្ទាត់ និងគ្រប់គ្រងក្រុមហ៊ុន' : 'Company Verifications & Management'}
        subtitle={
          isKhmer
            ? 'ត្រួតពិនិត្យ កែសម្រួល អនុម័ត និងគ្រប់គ្រងទិន្នន័យក្រុមហ៊ុននិយោជកក្នុងប្រព័ន្ធ'
            : 'Review, edit, verify, and manage enterprise employer organizations'
        }
        badge={{
          icon: Building,
          text: `${companies.length} ${isKhmer ? 'សហគ្រាសសរុប' : 'Companies'}`,
        }}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder={
          isKhmer
            ? 'ស្វែងរកឈ្មោះក្រុមហ៊ុន, ម្ចាស់ ឬទីតាំង...'
            : 'Search company, owner, or location...'
        }
      />

      {/* 2. Filter Toolbar (Clean pills on right) */}
      <div className="flex items-center justify-between gap-2 bg-white px-4 py-2.5 rounded-2xl border border-gray-200 shadow-2xs overflow-x-auto">
        <span className="text-[11px] font-medium text-slate-400 shrink-0 hidden sm:inline">
          {isKhmer ? 'ច្រោះតាមស្ថានភាព៖' : 'Filter by Status:'}
        </span>

        <div className="flex items-center space-x-1.5 ml-auto">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition cursor-pointer shrink-0 ${statusFilter === 'all'
              ? 'bg-blue-600 text-white shadow-2xs'
              : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-gray-200'
              }`}
          >
            {isKhmer ? 'ទាំងអស់' : 'All'} ({companies.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition cursor-pointer shrink-0 ${statusFilter === 'pending'
              ? 'bg-amber-500 text-white shadow-2xs'
              : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200/70'
              }`}
          >
            {isKhmer ? 'រង់ចាំពិនិត្យ' : 'Pending'} ({pendingCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('verified')}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition cursor-pointer shrink-0 ${statusFilter === 'verified'
              ? 'bg-emerald-600 text-white shadow-2xs'
              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/70'
              }`}
          >
            {isKhmer ? 'ផ្ទៀងផ្ទាត់រួច' : 'Verified'} ({verifiedCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('rejected')}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition cursor-pointer shrink-0 ${statusFilter === 'rejected'
              ? 'bg-rose-600 text-white shadow-2xs'
              : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/70'
              }`}
          >
            {isKhmer ? 'បដិសេធ' : 'Rejected'} ({rejectedCount})
          </button>
        </div>
      </div>

      {/* 3. Modern SaaS Data Table (Clean, Compact, Standard UI) */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-gray-200 text-slate-500 uppercase tracking-wider font-semibold text-[10px]">
                <th className="py-2.5 px-4">{isKhmer ? 'ក្រុមហ៊ុន' : 'Company'}</th>
                <th className="py-2.5 px-3">{isKhmer ? 'ទីតាំង' : 'Location'}</th>
                <th className="py-2.5 px-3">{isKhmer ? 'អ៊ីមែល' : 'Email'}</th>
                <th className="py-2.5 px-3">{isKhmer ? 'ការងារ' : 'Openings'}</th>
                <th className="py-2.5 px-3">{isKhmer ? 'កាលបរិច្ឆេទ' : 'Registered'}</th>
                <th className="py-2.5 px-3">{isKhmer ? 'ស្ថានភាព' : 'Status'}</th>
                <th className="py-2.5 px-4 text-right">{isKhmer ? 'សកម្មភាព' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {filteredCompanies.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Building className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="text-xs font-normal text-slate-700">
                      {isKhmer ? 'មិនមានទិន្នន័យក្រុមហ៊ុនទេ' : 'No companies found'}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {isKhmer ? 'សូមសាកល្បងស្វែងរកដោយពាក្យគន្លឹះផ្សេង' : 'Try adjusting your search or filters.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredCompanies
                  .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                  .map((c) => {
                    const isVerified = c.verification_status === 'verified'
                    const isPending = c.verification_status === 'pending'

                    return (
                      <tr key={c.id} className="hover:bg-slate-50/70 transition-colors group">
                        {/* Column 1: Company Logo & Title Only */}
                        <td className="py-2.5 px-4 align-middle">
                          <div className="flex items-center space-x-2.5">
                            <div className="w-8 h-8 rounded-full bg-slate-100 border border-gray-200 flex items-center justify-center font-semibold text-slate-700 text-xs shrink-0 shadow-2xs overflow-hidden">
                              {c.logo_url ? (
                                <img src={getAssetUrl(c.logo_url)} alt={c.name} className="w-full h-full object-cover rounded-full" />
                              ) : (
                                c.name?.charAt(0) || 'C'
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 min-w-0">
                              <h4 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors truncate text-xs">
                                {c.name}
                              </h4>
                              {isVerified && (
                                <FacebookVerifiedBadge
                                  className="w-3.5 h-3.5 shrink-0"
                                  title={isKhmer ? 'ក្រុមហ៊ុនផ្ទៀងផ្ទាត់ផ្លូវការ' : 'Officially Verified Company'}
                                />
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Column 2: Location Only */}
                        <td className="py-2.5 px-3 align-middle whitespace-nowrap">
                          <div className="flex items-center space-x-1.5 text-slate-700 font-normal">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{c.province || 'Phnom Penh'}</span>
                          </div>
                        </td>

                        {/* Column 3: Email Only */}
                        <td className="py-2.5 px-3 align-middle whitespace-nowrap">
                          <div className="flex items-center space-x-1.5 text-slate-600 font-normal text-xs">
                            <Mail className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                            <span className="truncate">{c.owner_email || 'contact@company.kh'}</span>
                          </div>
                        </td>

                        {/* Column 4: Jobs Count */}
                        <td className="py-2.5 px-3 align-middle whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 bg-slate-50 px-2 py-0.5 rounded-md border border-gray-200">
                            <Briefcase className="w-3 h-3 text-slate-400" />
                            <span>{c.jobs_count || 0}</span>
                          </span>
                        </td>

                        {/* Column 5: Registered Date */}
                        <td className="py-2.5 px-3 align-middle text-slate-500 font-normal whitespace-nowrap">
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{new Date(c.created_at).toLocaleDateString()}</span>
                          </div>
                        </td>

                        {/* Column 6: Status Badge (Dynamic colors) */}
                        <td className="py-2.5 px-3 align-middle whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${isVerified
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : isPending
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                              }`}
                          >
                            {isVerified ? (
                              <ShieldCheck className="w-3 h-3 text-emerald-600" />
                            ) : isPending ? (
                              <Clock className="w-3 h-3 text-amber-600" />
                            ) : (
                              <XCircle className="w-3 h-3 text-rose-600" />
                            )}
                            <span>
                              {isVerified
                                ? isKhmer ? 'ផ្ទៀងផ្ទាត់រួច' : 'Verified'
                                : isPending
                                  ? isKhmer ? 'រង់ចាំពិនិត្យ' : 'Pending'
                                  : isKhmer ? 'បដិសេធ' : 'Rejected'}
                            </span>
                          </span>
                        </td>

                        {/* Column 7: Actions: Inspect (Blue), View (Slate), Approve (Green), Delete (Red) */}
                        <td className="py-2.5 px-4 align-middle text-right whitespace-nowrap">
                          <div className="flex items-center justify-end space-x-1.5">
                            {/* 0. Inspect Full Company Profile */}
                            <button
                              type="button"
                              onClick={() => handleOpenViewingCompany(c)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition cursor-pointer shadow-2xs"
                              title={isKhmer ? 'ពិនិត្យមើលព័ត៌មានលម្អិតក្រុមហ៊ុន' : 'Inspect Company Information'}
                            >
                              <Eye className="w-3 h-3 text-blue-600" />
                              <span className="hidden sm:inline">{isKhmer ? 'ពិនិត្យ' : 'Inspect'}</span>
                            </button>

                            {/* 1. Edit Company Information */}
                            <button
                              type="button"
                              onClick={() => handleOpenEditCompany(c)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition cursor-pointer shadow-2xs"
                              title={isKhmer ? 'កែសម្រួលព័ត៌មានក្រុមហ៊ុន' : 'Edit Company Information'}
                            >
                              <Pencil className="w-3 h-3 text-amber-600" />
                              <span className="hidden sm:inline">{isKhmer ? 'កែប្រែ' : 'Edit'}</span>
                            </button>

                            {/* 2. Approve Button (Green Base) */}
                            {!isVerified ? (
                              <button
                                type="button"
                                disabled={actionInProgress === c.id}
                                onClick={() => handleVerifyCompany(c.id, 'verified')}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-xl text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition cursor-pointer shadow-2xs disabled:opacity-50"
                                title={isKhmer ? 'អនុម័តក្រុមហ៊ុន' : 'Approve Company'}
                              >
                                <Check className="w-3 h-3 text-emerald-600" />
                                <span className="hidden sm:inline">{isKhmer ? 'អនុម័ត' : 'Approve'}</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled={actionInProgress === c.id}
                                onClick={() => handleVerifyCompany(c.id, 'rejected')}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-xl text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition cursor-pointer shadow-2xs disabled:opacity-50"
                                title={isKhmer ? 'បដិសេធ' : 'Reject Company'}
                              >
                                <X className="w-3 h-3 text-amber-600" />
                                <span className="hidden sm:inline">{isKhmer ? 'បដិសេធ' : 'Reject'}</span>
                              </button>
                            )}

                            {/* 3. Delete Button (Red Base) */}
                            <button
                              type="button"
                              onClick={() => handleOpenDelete(c)}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-xl text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition cursor-pointer shadow-2xs"
                              title={isKhmer ? 'លុបក្រុមហ៊ុន' : 'Delete Company'}
                            >
                              <Trash2 className="w-3 h-3 text-rose-600" />
                              <span className="hidden sm:inline">{isKhmer ? 'លុប' : 'Delete'}</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Pagination: Left Select 25 50 100, Right buttons */}
        {filteredCompanies.length > 0 && (
          <TablePagination
            currentPage={currentPage}
            pageSize={pageSize}
            totalItems={filteredCompanies.length}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            pageSizeOptions={[25, 50, 100]}
          />
        )}
      </div>

      {/* ================= COMPANY INSPECTION MODAL ================= */}
      {viewingCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full bg-white border border-gray-200 flex items-center justify-center text-slate-800 font-bold text-base shrink-0 shadow-2xs overflow-hidden">
                  {viewingCompany.logo_url ? (
                    <img src={getAssetUrl(viewingCompany.logo_url)} alt={viewingCompany.name} className="w-full h-full object-cover rounded-full" />
                  ) : (
                    viewingCompany.name?.charAt(0) || 'C'
                  )}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-base font-bold text-slate-900">{viewingCompany.name}</h3>
                      {viewingCompany.verification_status === 'verified' && (
                        <FacebookVerifiedBadge
                          className="w-4 h-4 shrink-0"
                          title={isKhmer ? 'ក្រុមហ៊ុនផ្ទៀងផ្ទាត់ផ្លូវការ' : 'Officially Verified Company'}
                        />
                      )}
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${viewingCompany.verification_status === 'verified'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : viewingCompany.verification_status === 'pending'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                    >
                      {viewingCompany.verification_status === 'verified' ? (
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      ) : viewingCompany.verification_status === 'pending' ? (
                        <Clock className="w-3 h-3 text-amber-600" />
                      ) : (
                        <XCircle className="w-3 h-3 text-rose-600" />
                      )}
                      <span>
                        {viewingCompany.verification_status === 'verified'
                          ? isKhmer ? 'ផ្ទៀងផ្ទាត់រួច' : 'Verified'
                          : viewingCompany.verification_status === 'pending'
                            ? isKhmer ? 'រង់ចាំពិនិត្យ' : 'Pending'
                            : isKhmer ? 'បដិសេធ' : 'Rejected'}
                      </span>
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">
                    ID #{viewingCompany.id} • /{viewingCompany.slug || `company-${viewingCompany.id}`}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setViewingCompany(null)}
                className="w-8 h-8 rounded-xl bg-white hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition cursor-pointer border border-gray-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Exclusive Admin Authority Notice Banner */}
            <div className="mx-5 mt-4 p-3 rounded-xl bg-blue-50/80 border border-blue-200 text-blue-900 text-xs flex items-start space-x-2.5">
              <Shield className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-semibold block text-blue-900">
                  {isKhmer ? 'សិទ្ធិផ្ដាច់មុខរបស់អ្នកគ្រប់គ្រងប្រព័ន្ធ' : 'Administrator Sole Authority'}
                </span>
                <p className="text-[11px] text-blue-700 leading-relaxed font-normal">
                  {isKhmer
                    ? 'មានតែ Admin ប៉ុណ្ណោះដែលអាចបញ្ជាក់ អនុម័ត ឬដកហូតសិទ្ធិក្រុមហ៊ុនក្នុងការប្រើប្រាស់ប្រព័ន្ធ និងផ្សាយការងារ។ ក្រុមហ៊ុនដែលមិនទាន់អនុម័ត មិនអាចផ្សាយការងារបានឡើយ។'
                    : 'Only Platform Administrators can verify and approve employer companies to use this platform and recruit candidates. Unapproved companies cannot publish vacancies.'}
                </p>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 text-xs font-sans">
              {/* Grid 1: Basic Company Attributes */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-50 p-3 rounded-xl border border-gray-100 space-y-1">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">{isKhmer ? 'វិស័យ' : 'Industry'}</span>
                  <p className="font-semibold text-slate-800 text-xs truncate">{viewingCompany.industry || '—'}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-gray-100 space-y-1">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">{isKhmer ? 'ទំហំក្រុមហ៊ុន' : 'Company Size'}</span>
                  <p className="font-semibold text-slate-800 text-xs">{viewingCompany.company_size || '10-50'}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-gray-100 space-y-1">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">{isKhmer ? 'ទីតាំង / ខេត្ត' : 'Location'}</span>
                  <p className="font-semibold text-slate-800 text-xs truncate">{viewingCompany.province || 'Phnom Penh'}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-gray-100 space-y-1">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">{isKhmer ? 'ការងារផ្សាយ' : 'Jobs Posted'}</span>
                  <p className="font-semibold text-blue-600 text-xs">{viewingCompany.jobs_count || 0}</p>
                </div>
              </div>

              {/* Account Owner & Contact Details */}
              <div className="bg-slate-50/80 p-4 rounded-xl border border-gray-100 space-y-2.5">
                <h4 className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-blue-600" />
                  <span>{isKhmer ? 'ព័ត៌មានគណនីម្ចាស់ក្រុមហ៊ុន' : 'Company Account Owner & Contact'}</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="text-slate-400">{isKhmer ? 'ឈ្មោះអ្នកតំណាង៖' : 'Owner Name:'}</span>
                    <span className="font-semibold text-slate-800">{viewingCompany.owner_name || '—'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-slate-400">{isKhmer ? 'អ៊ីមែលទំនាក់ទំនង៖' : 'Contact Email:'}</span>
                    <span className="font-mono text-slate-800">{viewingCompany.owner_email || '—'}</span>
                  </div>
                  {viewingCompany.website && (
                    <div className="flex items-center space-x-2 sm:col-span-2">
                      <span className="text-slate-400">{isKhmer ? 'គេហទំព័រ៖' : 'Website:'}</span>
                      <a
                        href={viewingCompany.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline flex items-center space-x-1"
                      >
                        <Globe className="w-3 h-3" />
                        <span>{viewingCompany.website}</span>
                      </a>
                    </div>
                  )}
                  {viewingCompany.address && (
                    <div className="flex items-start space-x-2 sm:col-span-2">
                      <span className="text-slate-400 shrink-0">{isKhmer ? 'អាសយដ្ឋាន៖' : 'Address:'}</span>
                      <span className="text-slate-700">{viewingCompany.address}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* National ID Card & Verification Document */}
              <div className="bg-slate-50/80 p-4 rounded-xl border border-gray-100 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                    <Shield className="w-3.5 h-3.5 text-blue-600" />
                    <span>{isKhmer ? 'អត្តសញ្ញាណប័ណ្ណសញ្ជាតិខ្មែរ' : 'National ID Card Document'}</span>
                  </h4>
                  {viewingCompany.national_id_card ? (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>{isKhmer ? 'បានភ្ជាប់ឯកសារ' : 'Document Attached'}</span>
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                      {isKhmer ? 'មិនទាន់មានឯកសារ' : 'Missing ID Card'}
                    </span>
                  )}
                </div>

                {viewingCompany.national_id_card ? (
                  <div className="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-gray-200">
                    {viewingCompany.national_id_card.toLowerCase().endsWith('.pdf') ? (
                      <div className="w-12 h-12 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center shrink-0">
                        <FileText className="w-6 h-6 text-rose-600" />
                      </div>
                    ) : (
                      <div className="w-16 h-12 rounded-lg bg-slate-100 border border-gray-200 overflow-hidden flex items-center justify-center shrink-0">
                        <img
                          src={getAssetUrl(viewingCompany.national_id_card)}
                          alt="National ID Card"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <span className="text-xs font-semibold text-slate-800 block truncate">
                        {viewingCompany.national_id_card.split('/').pop()}
                      </span>
                      <a
                        href={getAssetUrl(viewingCompany.national_id_card)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:text-blue-700 hover:underline inline-flex items-center gap-1 mt-0.5"
                      >
                        <span>{isKhmer ? 'បើកពិនិត្យឯកសារច្បាប់ដើម' : 'Inspect Full Document'}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 italic">
                    {isKhmer ? 'ក្រុមហ៊ុននេះមិនទាន់បានផ្ទុកឡើងរូបភាពអត្តសញ្ញាណប័ណ្ណនៅឡើយទេ។' : 'No National ID Card uploaded yet.'}
                  </p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold text-slate-900">{isKhmer ? 'ការពិពណ៌នាអំពីក្រុមហ៊ុន' : 'Company Overview'}</h4>
                <div className="p-3 bg-slate-50 rounded-xl border border-gray-100 text-slate-600 text-xs leading-relaxed max-h-48 overflow-y-auto">
                  {viewingCompany.description ? (
                    /<[a-z][\s\S]*>/i.test(viewingCompany.description) ? (
                      <div
                        className="space-y-1.5 leading-relaxed [&>p]:mb-1.5 [&>p:last-child]:mb-0 [&>ul]:list-disc [&>ul]:pl-4 [&>ol]:list-decimal [&>ol]:pl-4 font-normal"
                        dangerouslySetInnerHTML={{ __html: viewingCompany.description }}
                      />
                    ) : (
                      <div className="whitespace-pre-line font-normal">{viewingCompany.description}</div>
                    )
                  ) : (
                    <span className="text-slate-400 italic">
                      {isKhmer ? 'មិនមានការពិពណ៌នាអំពីក្រុមហ៊ុនឡើយ' : 'No description provided.'}
                    </span>
                  )}
                </div>
              </div>

              {/* Company Employees & Sub-Users Section */}
              <div className="space-y-3 pt-2 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-blue-600" />
                    <h4 className="text-xs font-bold text-slate-900">
                      {isKhmer ? 'បុគ្គលិក & ក្រុមការងារក្រុមហ៊ុន' : 'Company Employees & Sub-Users'}
                    </h4>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                      {companyMembers.length}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddMember(!showAddMember)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>{showAddMember ? (isKhmer ? 'បិទ' : 'Cancel') : (isKhmer ? 'បន្ថែមបុគ្គលិក' : 'Add Sub-User')}</span>
                  </button>
                </div>

                {/* Add Sub-User Employee Form */}
                {showAddMember && (
                  <form onSubmit={handleAddMember} className="p-3.5 bg-blue-50/50 rounded-xl border border-blue-200/80 space-y-3 text-xs">
                    <h5 className="font-bold text-blue-900 text-xs flex items-center gap-1.5">
                      <UserPlus className="w-3.5 h-3.5 text-blue-600" />
                      <span>{isKhmer ? 'បង្កើត ឬភ្ជាប់បុគ្គលិកថ្មីទៅក្រុមហ៊ុន' : 'Create or Link Sub-User Employee'}</span>
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-medium text-slate-700 mb-1">
                          {isKhmer ? 'ឈ្មោះពេញ' : 'Full Name'} *
                        </label>
                        <input
                          type="text"
                          required
                          value={newMemberName}
                          onChange={(e) => setNewMemberName(e.target.value)}
                          placeholder="e.g. Sok Dara"
                          className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-200 rounded-lg outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-slate-700 mb-1">
                          {isKhmer ? 'អ៊ីមែល' : 'Email Address'} *
                        </label>
                        <input
                          type="email"
                          required
                          value={newMemberEmail}
                          onChange={(e) => setNewMemberEmail(e.target.value)}
                          placeholder="name@company.com"
                          className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-200 rounded-lg outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-slate-700 mb-1">
                          {isKhmer ? 'ពាក្យសម្ងាត់' : 'Password (for new user)'}
                        </label>
                        <input
                          type="password"
                          value={newMemberPassword}
                          onChange={(e) => setNewMemberPassword(e.target.value)}
                          placeholder="Min 6 characters"
                          className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-200 rounded-lg outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-slate-700 mb-1">
                          {isKhmer ? 'តួនាទីក្នុងក្រុមហ៊ុន' : 'Role in Company'}
                        </label>
                        <select
                          value={newMemberRole}
                          onChange={(e) => setNewMemberRole(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-200 rounded-lg outline-none focus:border-blue-500"
                        >
                          <option value="recruiter">{isKhmer ? 'មន្ត្រីជ្រើសរើស' : 'Recruiter'}</option>
                          <option value="hiring_manager">{isKhmer ? 'ប្រធានផ្នែក' : 'Hiring Manager'}</option>
                          <option value="interviewer">{isKhmer ? 'អ្នកសម្ភាសន៍' : 'Interviewer'}</option>
                          <option value="member">{isKhmer ? 'សមាជិក' : 'Team Member'}</option>
                          <option value="owner">{isKhmer ? 'ម្ចាស់ក្រុមហ៊ុន' : 'Company Owner'}</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowAddMember(false)}
                        className="px-3 py-1 rounded-lg border border-gray-200 text-slate-600 hover:bg-white text-xs font-normal"
                      >
                        {isKhmer ? 'បោះបង់' : 'Cancel'}
                      </button>
                      <button
                        type="submit"
                        disabled={isAddingMember}
                        className="px-3.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition disabled:opacity-50"
                      >
                        {isAddingMember ? (isKhmer ? 'កំពុងបញ្ចូល...' : 'Adding...') : (isKhmer ? 'រក្សាទុកបុគ្គលិក' : 'Save Employee')}
                      </button>
                    </div>
                  </form>
                )}

                {/* Sub-Users List Table */}
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  {isLoadingMembers ? (
                    <div className="py-6 text-center text-xs text-slate-400">
                      {isKhmer ? 'កំពុងទាញយកទិន្នន័យបុគ្គលិក...' : 'Loading employees...'}
                    </div>
                  ) : companyMembers.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-400">
                      {isKhmer ? 'មិនទាន់មានបុគ្គលិកត្រូវបានភ្ជាប់ជាមួយក្រុមហ៊ុននេះនៅឡើយទេ' : 'No sub-user employees assigned to this company yet.'}
                    </div>
                  ) : (
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-gray-200 text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                          <th className="py-2 px-3">{isKhmer ? 'បុគ្គលិក' : 'Employee'}</th>
                          <th className="py-2 px-3">{isKhmer ? 'តួនាទី' : 'Role'}</th>
                          <th className="py-2 px-3 text-right">{isKhmer ? 'សកម្មភាព' : 'Action'}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {companyMembers.map((m: any) => (
                          <tr key={m.member_id} className="hover:bg-slate-50/70 transition">
                            <td className="py-2 px-3">
                              <span className="font-bold text-slate-900 block truncate">{m.full_name}</span>
                              <span className="text-[10px] text-slate-400 font-mono block truncate">{m.email}</span>
                            </td>
                            <td className="py-2 px-3">
                              <select
                                value={m.member_role}
                                onChange={(e) => handleUpdateMemberRole(m.user_id, e.target.value)}
                                className={`px-2 py-0.5 rounded-full text-[9.5px] font-bold uppercase tracking-wide border cursor-pointer outline-none ${
                                  m.member_role === 'owner'
                                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                                    : m.member_role === 'hiring_manager'
                                      ? 'bg-purple-50 text-purple-700 border-purple-200'
                                      : m.member_role === 'recruiter'
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                        : 'bg-blue-50 text-blue-700 border-blue-200'
                                }`}
                              >
                                <option value="owner">{isKhmer ? 'ម្ចាស់ក្រុមហ៊ុន' : 'OWNER'}</option>
                                <option value="hiring_manager">{isKhmer ? 'ប្រធានផ្នែក' : 'HIRING MANAGER'}</option>
                                <option value="recruiter">{isKhmer ? 'មន្ត្រីជ្រើសរើស' : 'RECRUITER'}</option>
                                <option value="interviewer">{isKhmer ? 'អ្នកសម្ភាសន៍' : 'INTERVIEWER'}</option>
                                <option value="member">{isKhmer ? 'សមាជិក' : 'MEMBER'}</option>
                              </select>
                            </td>
                            <td className="py-2 px-3 text-right">
                              <button
                                type="button"
                                onClick={() => handleRemoveMember(m.user_id)}
                                className="p-1 rounded-md text-rose-500 hover:bg-rose-50 transition cursor-pointer"
                                title={isKhmer ? 'ដកបុគ្គលិក' : 'Remove Employee'}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer with Direct Admin Decision Actions */}
            <div className="p-4 bg-slate-50 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <a
                  href={`/companies/${viewingCompany.slug || viewingCompany.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold text-slate-600 hover:bg-white transition cursor-pointer shadow-2xs flex items-center space-x-1"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                  <span>{isKhmer ? 'ទំព័រសាធារណៈ' : 'Public Profile'}</span>
                </a>

                <button
                  type="button"
                  onClick={() => {
                    const comp = viewingCompany
                    setViewingCompany(null)
                    handleOpenEditCompany(comp)
                  }}
                  className="px-3 py-1.5 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 text-xs font-semibold text-amber-700 transition cursor-pointer shadow-2xs flex items-center space-x-1"
                  title={isKhmer ? 'កែសម្រួលព័ត៌មានក្រុមហ៊ុន' : 'Edit Company Information'}
                >
                  <Pencil className="w-3.5 h-3.5 text-amber-600" />
                  <span>{isKhmer ? 'កែប្រែ' : 'Edit'}</span>
                </button>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setViewingCompany(null)}
                  className="px-3.5 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold text-slate-600 hover:bg-white transition cursor-pointer shadow-2xs"
                >
                  {isKhmer ? 'បិទ' : 'Close'}
                </button>

                {viewingCompany.verification_status !== 'verified' ? (
                  <button
                    type="button"
                    disabled={actionInProgress === viewingCompany.id}
                    onClick={() => handleVerifyCompany(viewingCompany.id, 'verified')}
                    className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition cursor-pointer shadow-2xs flex items-center space-x-1.5 disabled:opacity-50"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>
                      {isKhmer ? 'អនុម័តក្រុមហ៊ុនឱ្យប្រើប្រាស់ប្រព័ន្ធ' : 'Approve & Authorize Company'}
                    </span>
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={actionInProgress === viewingCompany.id}
                    onClick={() => handleVerifyCompany(viewingCompany.id, 'rejected')}
                    className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition cursor-pointer shadow-2xs flex items-center space-x-1.5 disabled:opacity-50"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>
                      {isKhmer ? 'បដិសេធ / ដកហូតសិទ្ធិ' : 'Revoke / Reject Verification'}
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= EDIT COMPANY INFORMATION MODAL ================= */}
      {editingCompany && (
        <Dialog
          isOpen={!!editingCompany}
          onClose={() => setEditingCompany(null)}
          size="lg"
          icon={<Building className="w-5 h-5 text-blue-600" />}
          iconClassName="bg-blue-50 text-blue-600 border border-blue-200"
          title={
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  {isKhmer ? 'កែសម្រួលព័ត៌មានក្រុមហ៊ុន' : 'Edit Company Information'}
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
                  ID #{editingCompany.id}
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <p className="text-xs text-slate-400 font-normal">
                  {editingCompany.name} • {editingCompany.owner_email || ''}
                </p>
                {editingCompany.verification_status === 'verified' && (
                  <FacebookVerifiedBadge
                    className="w-3.5 h-3.5 shrink-0"
                    title={isKhmer ? 'ក្រុមហ៊ុនផ្ទៀងផ្ទាត់ផ្លូវការ' : 'Officially Verified Company'}
                  />
                )}
              </div>
            </div>
          }
        >
          <form onSubmit={handleSaveCompany} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Company Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isKhmer ? 'ឈ្មោះក្រុមហ៊ុន *' : 'Company Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-gray-200 rounded-xl text-slate-900 outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition"
                />
              </div>

              {/* Industry */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isKhmer ? 'វិស័យអាជីវកម្ម' : 'Industry'}
                </label>
                <input
                  type="text"
                  value={editIndustry}
                  onChange={(e) => setEditIndustry(e.target.value)}
                  placeholder={isKhmer ? 'ឧ. Technology, Banking...' : 'e.g. Technology, Banking...'}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-gray-200 rounded-xl text-slate-900 outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition"
                />
              </div>

              {/* Province / City */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isKhmer ? 'រាជធានី / ខេត្ត' : 'Province / Location'}
                </label>
                <input
                  type="text"
                  value={editProvince}
                  onChange={(e) => setEditProvince(e.target.value)}
                  placeholder={isKhmer ? 'ឧ. Phnom Penh, Siem Reap...' : 'e.g. Phnom Penh, Siem Reap...'}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-gray-200 rounded-xl text-slate-900 outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition"
                />
              </div>

              {/* Company Size */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isKhmer ? 'ទំហំបុគ្គលិកក្រុមហ៊ុន' : 'Company Size'}
                </label>
                <select
                  value={editCompanySize}
                  onChange={(e) => setEditCompanySize(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-gray-200 rounded-xl text-slate-900 outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition cursor-pointer"
                >
                  <option value="1-10">1-10 {isKhmer ? 'នាក់' : 'employees'}</option>
                  <option value="10-50">10-50 {isKhmer ? 'នាក់' : 'employees'}</option>
                  <option value="50-100">50-100 {isKhmer ? 'នាក់' : 'employees'}</option>
                  <option value="100-500">100-500 {isKhmer ? 'នាក់' : 'employees'}</option>
                  <option value="500+">500+ {isKhmer ? 'នាក់' : 'employees'}</option>
                </select>
              </div>

              {/* Website */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isKhmer ? 'គេហទំព័រ (Website)' : 'Website URL'}
                </label>
                <input
                  type="text"
                  value={editWebsite}
                  onChange={(e) => setEditWebsite(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-gray-200 rounded-xl text-slate-900 outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition"
                />
              </div>

              {/* Verification Status */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isKhmer ? 'ស្ថានភាពផ្ទៀងផ្ទាត់' : 'Verification Status'}
                </label>
                <select
                  value={editVerificationStatus}
                  onChange={(e) => setEditVerificationStatus(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-gray-200 rounded-xl text-slate-900 outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition cursor-pointer font-medium"
                >
                  <option value="verified">{isKhmer ? 'ផ្ទៀងផ្ទាត់រួច' : 'Verified'}</option>
                  <option value="pending">{isKhmer ? 'រង់ចាំពិនិត្យ' : 'Pending'}</option>
                  <option value="rejected">{isKhmer ? 'បដិសេធ' : 'Rejected'}</option>
                </select>
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {isKhmer ? 'អាសយដ្ឋានក្រុមហ៊ុនលម្អិត' : 'Detailed Office Address'}
              </label>
              <input
                type="text"
                value={editAddress}
                onChange={(e) => setEditAddress(e.target.value)}
                placeholder={isKhmer ? 'ឧ. អគារលេខ #123 មហាវិថីព្រះមុនីវង្ស...' : 'e.g. Building #123, Monivong Blvd...'}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-gray-200 rounded-xl text-slate-900 outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {isKhmer ? 'ការពិពណ៌នាអំពីក្រុមហ៊ុន' : 'Company Description'}
              </label>
              <textarea
                rows={4}
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder={isKhmer ? 'រៀបរាប់ព័ត៌មាន បេសកកម្ម និងប្រវត្តិក្រុមហ៊ុន...' : 'Company background, culture, and overview...'}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-gray-200 rounded-xl text-slate-900 outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition resize-none leading-relaxed"
              />
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setEditingCompany(null)}
                className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
              >
                {isKhmer ? 'បោះបង់' : 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={isUpdatingCompany}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-500/20 active:scale-98 transition cursor-pointer disabled:opacity-60 flex items-center gap-1.5"
              >
                {isUpdatingCompany ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                <span>
                  {isUpdatingCompany
                    ? isKhmer
                      ? 'កំពុងរក្សាទុក...'
                      : 'Saving...'
                    : isKhmer
                    ? 'រក្សាទុកការកែប្រែ'
                    : 'Save Changes'}
                </span>
              </button>
            </div>
          </form>
        </Dialog>
      )}

      {/* ================= DELETE CONFIRMATION MODAL ================= */}
      {deleteModalOpen && deletingCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150 p-6 space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-slate-900">
                  {isKhmer ? 'តើអ្នកប្រាកដជាចង់លុបក្រុមហ៊ុននេះ?' : 'Delete Company?'}
                </h3>
                <p className="text-xs font-normal text-slate-500 leading-relaxed">
                  {isKhmer ? (
                    <>
                      តើអ្នកពិតជាចង់លុប <strong className="text-slate-800 font-semibold">"{deletingCompany.name}"</strong> មែនទេ?
                      រាល់ការងារផ្សាយ និងពាក្យសុំដែលពាក់ព័ន្ធទាំងអស់នឹងត្រូវលុបជាអចិន្ត្រៃយ៍។ សកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ។
                    </>
                  ) : (
                    <>
                      Are you sure you want to permanently delete <strong className="text-slate-800 font-semibold">"{deletingCompany.name}"</strong>?
                      All associated job vacancies and applicant records will be permanently removed.
                    </>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                disabled={isDeleting}
                className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer shadow-2xs"
              >
                {isKhmer ? 'បោះបង់' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition shadow-2xs cursor-pointer disabled:opacity-50 flex items-center space-x-1"
              >
                {isDeleting ? (
                  <span>{isKhmer ? 'កំពុងលុប...' : 'Deleting...'}</span>
                ) : (
                  <span>{isKhmer ? 'លុបក្រុមហ៊ុន' : 'Delete Company'}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
