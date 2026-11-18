import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useToast } from '../../app/providers'
import { adminService } from '../../services/admin.service'
import { exportCompaniesToExcel } from '../../utils/excelExport'
import { TablePagination } from '../../components/common/TablePagination'
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
  FileSpreadsheet,
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

  const handleExportExcel = () => {
    if (!companies || companies.length === 0) return
    try {
      exportCompaniesToExcel(filteredCompanies, isKhmer)
      toast.success(
        isKhmer ? 'បានទាញយកទិន្នន័យជោគជ័យ' : 'Excel Exported',
        isKhmer
          ? 'ឯកសារ Microsoft Excel (.xlsx) ត្រូវបានទាញយកទៅកាន់ឧបករណ៍របស់អ្នក'
          : 'Companies exported to Microsoft Excel (.xlsx).'
      )
    } catch (err) {
      toast.error('Export Failed', 'Could not export companies to Excel.')
    }
  }

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
      {/* 1. Header Bar: Title on left, Search on right (Compact, no big space) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-2xs">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              {isKhmer ? 'ផ្ទៀងផ្ទាត់ និងគ្រប់គ្រងក្រុមហ៊ុន' : 'Company Verifications & Management'}
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-gray-200">
              <Building className="w-3 h-3 text-blue-600" />
              <span>{companies.length} {isKhmer ? 'សហគ្រាសសរុប' : 'Companies'}</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {isKhmer
              ? 'ត្រួតពិនិត្យ កែសម្រួល អនុម័ត និងគ្រប់គ្រងទិន្នន័យក្រុមហ៊ុននិយោជកក្នុងប្រព័ន្ធ'
              : 'Review, edit, verify, and manage enterprise employer organizations'}
          </p>
        </div>

        {/* Search Input on Top / Header & Export to Excel */}
        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto w-full sm:w-auto">
          <div className="relative w-full sm:w-64 md:w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={
                isKhmer
                  ? 'ស្វែងរកឈ្មោះក្រុមហ៊ុន, ម្ចាស់ ឬទីតាំង...'
                  : 'Search company, owner, or location...'
              }
              className="w-full pl-8 pr-8 py-1.5 text-xs bg-slate-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-blue-500 font-medium transition text-slate-800 shadow-2xs"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={handleExportExcel}
            disabled={companies.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-semibold transition shadow-2xs cursor-pointer disabled:opacity-50 shrink-0"
            title={isKhmer ? 'ទាញយកបញ្ជីក្រុមហ៊ុនជា Excel (.xlsx)' : 'Export companies to Microsoft Excel (.xlsx)'}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>{isKhmer ? 'នាំចេញជា Excel' : 'Export Excel'}</span>
          </button>
        </div>
      </div>

      {/* 2. Filter Toolbar (Clean pills on right) */}
      <div className="flex items-center justify-between gap-2 bg-white px-4 py-2.5 rounded-2xl border border-gray-200 shadow-2xs overflow-x-auto">
        <span className="text-[11px] font-medium text-slate-400 shrink-0 hidden sm:inline">
          {isKhmer ? 'ច្រោះតាមស្ថានភាព៖' : 'Filter by Status:'}
        </span>

        <div className="flex items-center space-x-1.5 ml-auto">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition cursor-pointer shrink-0 ${
              statusFilter === 'all'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-gray-200'
            }`}
          >
            {isKhmer ? 'ទាំងអស់' : 'All'} ({companies.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition cursor-pointer shrink-0 ${
              statusFilter === 'pending'
                ? 'bg-amber-500 text-white shadow-2xs'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200/70'
            }`}
          >
            {isKhmer ? 'រង់ចាំពិនិត្យ' : 'Pending'} ({pendingCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('verified')}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition cursor-pointer shrink-0 ${
              statusFilter === 'verified'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/70'
            }`}
          >
            {isKhmer ? 'ផ្ទៀងផ្ទាត់រួច' : 'Verified'} ({verifiedCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('rejected')}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition cursor-pointer shrink-0 ${
              statusFilter === 'rejected'
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
                          <div className="w-8 h-8 rounded-xl bg-slate-100 border border-gray-200 flex items-center justify-center font-semibold text-slate-700 text-xs shrink-0 shadow-2xs overflow-hidden">
                            {c.logo_url ? (
                              <img src={getAssetUrl(c.logo_url)} alt={c.name} className="w-full h-full object-cover" />
                            ) : (
                              c.name?.charAt(0) || 'C'
                            )}
                          </div>
                          <h4 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors truncate text-xs">
                            {c.name}
                          </h4>
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
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                            isVerified
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
                            onClick={() => setViewingCompany(c)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition cursor-pointer shadow-2xs"
                            title={isKhmer ? 'ពិនិត្យមើលព័ត៌មានលម្អិតក្រុមហ៊ុន' : 'Inspect Company Information'}
                          >
                            <Eye className="w-3 h-3 text-blue-600" />
                            <span className="hidden sm:inline">{isKhmer ? 'ពិនិត្យ' : 'Inspect'}</span>
                          </button>

                          {/* 1. View Public Link */}
                          <a
                            href={`/companies/${c.slug || c.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-xl text-xs font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 border border-gray-200 transition cursor-pointer shadow-2xs"
                            title={isKhmer ? 'មើលព័ត៌មានលម្អិត' : 'View Public Company Profile'}
                          >
                            <ExternalLink className="w-3 h-3 text-slate-500" />
                            <span className="hidden sm:inline">{isKhmer ? 'មើល' : 'View'}</span>
                          </a>

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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-slate-800 font-bold text-base shrink-0 shadow-2xs overflow-hidden">
                  {viewingCompany.logo_url ? (
                    <img src={getAssetUrl(viewingCompany.logo_url)} alt={viewingCompany.name} className="w-full h-full object-cover" />
                  ) : (
                    viewingCompany.name?.charAt(0) || 'C'
                  )}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-base font-bold text-slate-900">{viewingCompany.name}</h3>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                        viewingCompany.verification_status === 'verified'
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
                  {isKhmer ? 'សិទ្ធិផ្ដាច់មុខរបស់អ្នកគ្រប់គ្រងប្រព័ន្ធ (Admin Authority)' : 'Administrator Sole Authority'}
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

              {/* Description */}
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold text-slate-900">{isKhmer ? 'ការពិពណ៌នាអំពីក្រុមហ៊ុន' : 'Company Overview'}</h4>
                <div className="p-3 bg-slate-50 rounded-xl border border-gray-100 text-slate-600 text-xs leading-relaxed max-h-36 overflow-y-auto">
                  {viewingCompany.description || (isKhmer ? 'មិនមានការពិពណ៌នាអំពីក្រុមហ៊ុនឡើយ' : 'No description provided.')}
                </div>
              </div>
            </div>

            {/* Modal Footer with Direct Admin Decision Actions */}
            <div className="p-4 bg-slate-50 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2">
              <a
                href={`/companies/${viewingCompany.slug || viewingCompany.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold text-slate-600 hover:bg-white transition cursor-pointer shadow-2xs flex items-center space-x-1"
              >
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                <span>{isKhmer ? 'ទំព័រសាធារណៈ' : 'Public Profile'}</span>
              </a>

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

      {/* ================= DELETE CONFIRMATION MODAL ================= */}
      {deleteModalOpen && deletingCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150 p-5 space-y-4">
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
