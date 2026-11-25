import React, { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { adminService } from '../../services/admin.service'
import { useToast } from '../../app/providers'
import { TablePagination } from '../../components/common/TablePagination'
import { AdminPageHeader } from '../../components/layout/dashboard'
import { Dialog } from '../../components/ui'
import {
  Layers,
  Plus,
  Search,
  Edit2,
  Trash2,
  Briefcase,
  ExternalLink,
  Code,
  Laptop,
  Calculator,
  Building2,
  GraduationCap,
  Headphones,
  Wrench,
  Palette,
  ShoppingBag,
  Truck,
  Shield,
  HeartPulse,
  Sparkles,
  TrendingUp,
  X,
  Check,
  AlertTriangle,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  Copy,
  CheckCheck,
  CheckCircle2,
  Clock,
} from 'lucide-react'

interface JobCategory {
  id: number
  name_en: string
  name_km: string
  slug: string
  icon?: string
  jobs_count: number
}

type SortField = 'id' | 'name' | 'jobs_count'
type SortOrder = 'asc' | 'desc'

// Icon helper to render appropriate visual icon by name
const renderCategoryIcon = (iconName?: string, className: string = 'w-4 h-4') => {
  const icon = (iconName || '').toLowerCase()
  if (icon.includes('code') || icon.includes('dev') || icon.includes('it') || icon.includes('tech')) {
    return <Code className={className} />
  }
  if (icon.includes('calculator') || icon.includes('account') || icon.includes('audit')) {
    return <Calculator className={className} />
  }
  if (icon.includes('bank') || icon.includes('financ') || icon.includes('building')) {
    return <Building2 className={className} />
  }
  if (icon.includes('headphone') || icon.includes('support') || icon.includes('call') || icon.includes('service')) {
    return <Headphones className={className} />
  }
  if (icon.includes('education') || icon.includes('teach') || icon.includes('school') || icon.includes('grad')) {
    return <GraduationCap className={className} />
  }
  if (icon.includes('palette') || icon.includes('design') || icon.includes('creative') || icon.includes('art')) {
    return <Palette className={className} />
  }
  if (icon.includes('wrench') || icon.includes('engineer') || icon.includes('construct')) {
    return <Wrench className={className} />
  }
  if (icon.includes('shop') || icon.includes('store') || icon.includes('sale') || icon.includes('retail')) {
    return <ShoppingBag className={className} />
  }
  if (icon.includes('truck') || icon.includes('logist') || icon.includes('deliver')) {
    return <Truck className={className} />
  }
  if (icon.includes('shield') || icon.includes('secur') || icon.includes('legal')) {
    return <Shield className={className} />
  }
  if (icon.includes('health') || icon.includes('medic') || icon.includes('doctor') || icon.includes('nurse')) {
    return <HeartPulse className={className} />
  }
  if (icon.includes('laptop')) {
    return <Laptop className={className} />
  }
  return <Briefcase className={className} />
}

const PRESET_ICONS = [
  { name: 'code', label: 'Tech / Code', icon: <Code className="w-4 h-4" /> },
  { name: 'briefcase', label: 'General / Business', icon: <Briefcase className="w-4 h-4" /> },
  { name: 'calculator', label: 'Accounting / Finance', icon: <Calculator className="w-4 h-4" /> },
  { name: 'building', label: 'Banking / Corporate', icon: <Building2 className="w-4 h-4" /> },
  { name: 'headphones', label: 'Support / CS', icon: <Headphones className="w-4 h-4" /> },
  { name: 'graduation-cap', label: 'Education / Training', icon: <GraduationCap className="w-4 h-4" /> },
  { name: 'palette', label: 'Design / Media', icon: <Palette className="w-4 h-4" /> },
  { name: 'wrench', label: 'Engineering / Trades', icon: <Wrench className="w-4 h-4" /> },
  { name: 'shopping-bag', label: 'Sales / Retail', icon: <ShoppingBag className="w-4 h-4" /> },
  { name: 'heart-pulse', label: 'Healthcare / Medical', icon: <HeartPulse className="w-4 h-4" /> },
  { name: 'truck', label: 'Logistics / Supply', icon: <Truck className="w-4 h-4" /> },
  { name: 'shield', label: 'Security / Legal', icon: <Shield className="w-4 h-4" /> },
]

export const AdminCategoriesPage: React.FC = () => {
  const { i18n } = useTranslation()
  const isKhmer = i18n.language === 'km'
  const { toast } = useToast()

  const [categories, setCategories] = useState<JobCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'has_jobs' | 'empty'>('all')

  // Sorting
  const [sortField, setSortField] = useState<SortField>('id')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Copy slug indicator
  const [copiedSlugId, setCopiedSlugId] = useState<number | null>(null)

  // Create / Edit Modal State
  const [modalOpen, setModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<JobCategory | null>(null)
  const [formNameEn, setFormNameEn] = useState('')
  const [formNameKm, setFormNameKm] = useState('')
  const [formSlug, setFormSlug] = useState('')
  const [formIcon, setFormIcon] = useState('briefcase')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // Delete confirmation
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<JobCategory | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const loadCategories = async () => {
    setIsLoading(true)
    try {
      const data = await adminService.getCategories()
      setCategories(data || [])
    } catch (err: any) {
      console.error('Failed to load categories:', err)
      toast.error(
        isKhmer ? 'កំហុស' : 'Error',
        isKhmer ? 'បរាជ័យក្នុងការទាញយកផ្នែកការងារ' : 'Failed to load categories'
      )
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadCategories()
  }, [])

  // Reset pagination when search or filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, filterType])

  const handleOpenCreateModal = () => {
    setEditingCategory(null)
    setFormNameEn('')
    setFormNameKm('')
    setFormSlug('')
    setFormIcon('briefcase')
    setFormError(null)
    setModalOpen(true)
  }

  const handleOpenEditModal = (cat: JobCategory) => {
    setEditingCategory(cat)
    setFormNameEn(cat.name_en)
    setFormNameKm(cat.name_km)
    setFormSlug(cat.slug)
    setFormIcon(cat.icon || 'briefcase')
    setFormError(null)
    setModalOpen(true)
  }

  const handleAutoSlug = () => {
    if (!formNameEn.trim()) return
    const generated = formNameEn
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
    setFormSlug(generated)
  }

  const handleCopySlug = (cat: JobCategory, e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(cat.slug)
    setCopiedSlugId(cat.id)
    toast.success(
      isKhmer ? 'បានចម្លង Slug' : 'Slug Copied',
      isKhmer ? `/${cat.slug} ត្រូវបានចម្លងទៅកាន់ Clipboard` : `/${cat.slug} copied to clipboard`
    )
    setTimeout(() => {
      setCopiedSlugId((current) => (current === cat.id ? null : current))
    }, 2000)
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (!formNameEn.trim()) {
      setFormError(isKhmer ? 'សូមបញ្ចូលឈ្មោះជាភាសាអង់គ្លេស' : 'English name is required')
      return
    }
    if (!formNameKm.trim()) {
      setFormError(isKhmer ? 'សូមបញ្ចូលឈ្មោះជាភាសាខ្មែរ' : 'Khmer name is required')
      return
    }

    setIsSubmitting(true)
    try {
      const generatedSlug = formNameEn
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')

      const payload = {
        name_en: formNameEn.trim(),
        name_km: formNameKm.trim(),
        slug: formSlug.trim() || generatedSlug || undefined,
        icon: editingCategory?.icon || formIcon || 'briefcase',
      }

      if (editingCategory) {
        await adminService.updateCategory(editingCategory.id, payload)
        toast.success(
          isKhmer ? 'ជោគជ័យ' : 'Success',
          isKhmer ? 'បានកែសម្រួលផ្នែកការងារជោគជ័យ' : 'Category updated successfully'
        )
      } else {
        await adminService.createCategory(payload)
        toast.success(
          isKhmer ? 'ជោគជ័យ' : 'Success',
          isKhmer ? 'បានបង្កើតផ្នែកការងារថ្មីជោគជ័យ' : 'Category created successfully'
        )
      }

      setModalOpen(false)
      loadCategories()
    } catch (err: any) {
      console.error('Failed to save category:', err)
      const msg = err.response?.data?.error || err.response?.data?.slug?.[0] || 'Failed to save category'
      setFormError(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return
    setIsDeleting(true)
    try {
      await adminService.deleteCategory(categoryToDelete.id)
      toast.success(
        isKhmer ? 'ជោគជ័យ' : 'Success',
        isKhmer ? 'បានលុបផ្នែកការងារជោគជ័យ' : 'Category deleted successfully'
      )
      setDeleteModalOpen(false)
      setCategoryToDelete(null)
      loadCategories()
    } catch (err: any) {
      console.error('Failed to delete category:', err)
      toast.error(
        isKhmer ? 'កំហុស' : 'Error',
        isKhmer ? 'មិនអាចលុបផ្នែកការងារបានទេ' : 'Failed to delete category'
      )
    } finally {
      setIsDeleting(false)
    }
  }

  // Filter & Search
  const filteredCategories = useMemo(() => {
    return categories.filter((cat) => {
      const query = searchQuery.toLowerCase().trim()
      const matchesSearch =
        !query ||
        cat.name_en.toLowerCase().includes(query) ||
        cat.name_km.toLowerCase().includes(query) ||
        cat.slug.toLowerCase().includes(query)

      if (!matchesSearch) return false

      if (filterType === 'has_jobs') return (cat.jobs_count || 0) > 0
      if (filterType === 'empty') return (cat.jobs_count || 0) === 0
      return true
    })
  }, [categories, searchQuery, filterType])

  // Sorting
  const sortedCategories = useMemo(() => {
    return [...filteredCategories].sort((a, b) => {
      let comparison = 0
      if (sortField === 'id') {
        comparison = a.id - b.id
      } else if (sortField === 'name') {
        comparison = a.name_en.localeCompare(b.name_en)
      } else if (sortField === 'jobs_count') {
        comparison = (a.jobs_count || 0) - (b.jobs_count || 0)
      }
      return sortOrder === 'asc' ? comparison : -comparison
    })
  }, [filteredCategories, sortField, sortOrder])

  // Paginated categories for Table view
  const paginatedCategories = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return sortedCategories.slice(start, start + pageSize)
  }, [sortedCategories, currentPage, pageSize])

  const categoriesWithJobsCount = useMemo(() => {
    return categories.filter((c) => (c.jobs_count || 0) > 0).length
  }, [categories])

  if (isLoading) {
    return (
      <div className="py-24 text-center font-sans">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="mt-3 text-xs font-normal text-slate-400">
          {isKhmer ? 'កំពុងផ្ទុកផ្នែកការងារ...' : 'Loading categories...'}
        </p>
      </div>
    )
  }

  return (
    <div className="w-full space-y-3.5 font-sans pb-12">
      {/* 1. Header Bar: Using AdminPageHeader */}
      <AdminPageHeader
        title={isKhmer ? 'គ្រប់គ្រងផ្នែកការងារ' : 'Job Categories & Sectors'}
        subtitle={
          isKhmer
            ? 'បង្កើត កែសម្រួល និងគ្រប់គ្រងប្រភេទការងារដែលបង្ហាញនៅលើទំព័រដើម និងទំព័រស្វែងរក'
            : 'Review and manage career categories and sectors before they appear live on the directory'
        }
        badge={{
          icon: Layers,
          text: `${categories.length} ${isKhmer ? 'ផ្នែកសរុប' : 'Total'}`,
        }}
        secondaryBadge={
          categoriesWithJobsCount > 0
            ? {
                text: `${categoriesWithJobsCount} ${isKhmer ? 'មានការងារ' : 'With Jobs'}`,
                variant: 'emerald',
              }
            : undefined
        }
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder={
          isKhmer ? 'ស្វែងរកផ្នែកការងារ...' : 'Search categories by name or slug...'
        }
        actions={
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition shadow-2xs cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5 text-white" />
            <span>{isKhmer ? 'បង្កើតផ្នែកការងារ' : 'Create Category'}</span>
          </button>
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
            onClick={() => setFilterType('all')}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition cursor-pointer shrink-0 ${
              filterType === 'all'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-gray-200'
            }`}
          >
            {isKhmer ? 'ទាំងអស់' : 'All'} ({categories.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('has_jobs')}
            className={`px-3 py-1 rounded-xl text-xs font-normal transition cursor-pointer shrink-0 ${
              filterType === 'has_jobs'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/70'
            }`}
          >
            {isKhmer ? 'មានការងារ' : 'With Jobs'} ({categoriesWithJobsCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('empty')}
            className={`px-3 py-1 rounded-xl text-xs font-normal transition cursor-pointer shrink-0 ${
              filterType === 'empty'
                ? 'bg-slate-700 text-white shadow-2xs'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-gray-200'
            }`}
          >
            {isKhmer ? 'គ្មានការងារ' : 'Empty'} ({categories.length - categoriesWithJobsCount})
          </button>
        </div>
      </div>

      {/* 3. Modern SaaS Data Table (Clean, Compact, Standard UI - Exactly matching Job Moderation) */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-gray-200 text-slate-500 uppercase tracking-wider font-normal text-[10px]">
                <th className="py-2.5 px-4">
                  <button
                    type="button"
                    onClick={() => handleSort('name')}
                    className="flex items-center gap-1 hover:text-slate-800 transition cursor-pointer"
                  >
                    <span>{isKhmer ? 'ឈ្មោះផ្នែកការងារ (អង់គ្លេស)' : 'Category Title (EN)'}</span>
                    {sortField === 'name' ? (
                      sortOrder === 'asc' ? (
                        <ChevronUp className="w-3 h-3 text-blue-600" />
                      ) : (
                        <ChevronDown className="w-3 h-3 text-blue-600" />
                      )
                    ) : (
                      <ArrowUpDown className="w-2.5 h-2.5 text-slate-400" />
                    )}
                  </button>
                </th>
                <th className="py-2.5 px-3">{isKhmer ? 'ឈ្មោះផ្នែកការងារ (ខ្មែរ)' : 'Category Title (KH)'}</th>
                <th className="py-2.5 px-3">
                  <button
                    type="button"
                    onClick={() => handleSort('jobs_count')}
                    className="flex items-center gap-1 hover:text-slate-800 transition cursor-pointer"
                  >
                    <span>{isKhmer ? 'ចំនួនការងារ' : 'Total Jobs'}</span>
                    {sortField === 'jobs_count' ? (
                      sortOrder === 'asc' ? (
                        <ChevronUp className="w-3 h-3 text-blue-600" />
                      ) : (
                        <ChevronDown className="w-3 h-3 text-blue-600" />
                      )
                    ) : (
                      <ArrowUpDown className="w-2.5 h-2.5 text-slate-400" />
                    )}
                  </button>
                </th>
                <th className="py-2.5 px-3">{isKhmer ? 'ស្ថានភាព' : 'Status'}</th>
                <th className="py-2.5 px-4 text-right">{isKhmer ? 'សកម្មភាព' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-sans">
              {paginatedCategories.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <Briefcase className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="text-xs font-normal text-slate-700">
                      {isKhmer ? 'មិនមានទិន្នន័យផ្នែកការងារទេ' : 'No categories found'}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {searchQuery
                        ? isKhmer
                          ? `ពាក្យគន្លឹះ "${searchQuery}" មិនមានលទ្ធផលទេ។`
                          : `No categories match query "${searchQuery}".`
                        : isKhmer
                        ? 'សូមចុចប៊ូតុង "បង្កើតផ្នែកការងារ" ដើម្បីបន្ថែមប្រភេទការងារដំបូង។'
                        : 'Click "Create Category" to add your first job category.'}
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedCategories.map((cat) => {
                  const hasJobs = (cat.jobs_count || 0) > 0

                  return (
                    <tr key={cat.id} className="hover:bg-slate-50/70 transition-colors group">
                      {/* Column 1: Category Title (EN) */}
                      <td className="py-2.5 px-4 align-middle">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(cat)}
                          className="font-medium text-blue-600 hover:text-blue-700 transition-colors block text-xs line-clamp-1 text-left cursor-pointer"
                        >
                          {cat.name_en}
                        </button>
                      </td>

                      {/* Column 2: Category Title (KH) */}
                      <td className="py-2.5 px-3 align-middle">
                        <span className="font-normal text-slate-800 block truncate text-xs">
                          {cat.name_km || '—'}
                        </span>
                      </td>

                      {/* Column 3: Total Jobs */}
                      <td className="py-2.5 px-3 align-middle whitespace-nowrap">
                        <span className="font-normal text-slate-700 text-xs">
                          {cat.jobs_count || 0} {isKhmer ? 'ការងារ' : 'Jobs'}
                        </span>
                      </td>

                      {/* Column 4: Status (Have Job មានការងារ / Not Job គ្មានការងារ) */}
                      <td className="py-2.5 px-3 align-middle whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-normal border ${
                            hasJobs
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-50 text-slate-600 border-gray-200'
                          }`}
                        >
                          {hasJobs ? (
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Clock className="w-3 h-3 text-slate-400" />
                          )}
                          <span>
                            {hasJobs
                              ? isKhmer ? 'មានការងារ' : 'Have Job'
                              : isKhmer ? 'គ្មានការងារ' : 'Not Job'}
                          </span>
                        </span>
                      </td>

                      {/* Column 5: Actions: [View (White/Grey)] [Edit (Amber)] [Delete (Red)] */}
                      <td className="py-2.5 px-4 align-middle text-right whitespace-nowrap">
                        <div className="flex items-center justify-end space-x-1.5">
                          {/* View Button */}
                          {hasJobs && (
                            <Link
                              to={`/jobs?category=${cat.id}`}
                              target="_blank"
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-normal text-slate-600 hover:text-blue-600 bg-white hover:bg-slate-50 border border-gray-200 transition shadow-2xs"
                              title={isKhmer ? 'មើលការងារក្នុងផ្នែកនេះ' : 'View Category Jobs'}
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span className="hidden sm:inline">{isKhmer ? 'មើល' : 'View'}</span>
                            </Link>
                          )}

                          {/* Edit Button (Amber) */}
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(cat)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-normal text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition cursor-pointer shadow-2xs"
                            title={isKhmer ? 'កែសម្រួលផ្នែកការងារ' : 'Edit Category'}
                          >
                            <Edit2 className="w-3 h-3 text-amber-600" />
                            <span className="hidden sm:inline">{isKhmer ? 'កែប្រែ' : 'Edit'}</span>
                          </button>

                          {/* Delete Button (Red) */}
                          <button
                            type="button"
                            onClick={() => {
                              setCategoryToDelete(cat)
                              setDeleteModalOpen(true)
                            }}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-normal text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition cursor-pointer shadow-2xs"
                            title={isKhmer ? 'លុបផ្នែកការងារ' : 'Delete Category'}
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

        {/* Table Pagination */}
        <TablePagination
          currentPage={currentPage}
          pageSize={pageSize}
          totalItems={sortedCategories.length}
          onPageChange={(page) => setCurrentPage(page)}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize)
            setCurrentPage(1)
          }}
          pageSizeOptions={[10, 25, 50, 100]}
        />
      </div>

      {/* 5. Create / Edit Category Dialog */}
      <Dialog
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        size="md"
        icon={<Layers className="w-5 h-5 text-blue-600" />}
        title={
          editingCategory
            ? isKhmer
              ? 'កែសម្រួលផ្នែកការងារ'
              : 'Edit Job Category'
            : isKhmer
            ? 'បង្កើតផ្នែកការងារថ្មី'
            : 'Create New Job Category'
        }
        description={
          editingCategory
            ? isKhmer
              ? `កែប្រែទិន្នន័យសម្រាប់ #${editingCategory.id}`
              : `Updating category #${editingCategory.id}`
            : isKhmer
            ? 'បញ្ចូលព័ត៌មានផ្នែកការងារថ្មី'
            : 'Enter details for the new job vacancy category'
        }
      >
        <form onSubmit={handleSaveCategory} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{formError}</span>
            </div>
          )}

          {/* Name English */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {isKhmer ? 'ឈ្មោះផ្នែកការងារ (អង់គ្លេស)' : 'Category Name (English)'}{' '}
              <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formNameEn}
              onChange={(e) => setFormNameEn(e.target.value)}
              placeholder="e.g. Information Technology & Software"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 shadow-2xs"
            />
          </div>

          {/* Name Khmer */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {isKhmer ? 'ឈ្មោះផ្នែកការងារ (ខ្មែរ)' : 'Category Name (Khmer)'}{' '}
              <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formNameKm}
              onChange={(e) => setFormNameKm(e.target.value)}
              placeholder="ឧ. បច្ចេកវិទ្យាព័ត៌មាន & កម្មវិធី"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 shadow-2xs"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition cursor-pointer"
            >
              {isKhmer ? 'បោះបង់' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-500/20 active:scale-98 transition flex items-center gap-1.5 disabled:opacity-60 cursor-pointer"
            >
              {isSubmitting ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5 text-white" />
              )}
              <span>
                {editingCategory
                  ? isKhmer
                    ? 'រក្សាទុកការកែប្រែ'
                    : 'Update Category'
                  : isKhmer
                  ? 'បង្កើតផ្នែកការងារ'
                  : 'Create Category'}
              </span>
            </button>
          </div>
        </form>
      </Dialog>

      {/* 6. Delete Confirmation Dialog */}
      <Dialog
        isOpen={deleteModalOpen && Boolean(categoryToDelete)}
        onClose={() => setDeleteModalOpen(false)}
        size="xs"
        icon={<Trash2 className="w-5 h-5 text-rose-600" />}
        iconClassName="bg-rose-50 border-rose-100"
        title={isKhmer ? 'បញ្ជាក់ការលុបផ្នែកការងារ?' : 'Delete Job Category?'}
        footer={
          <div className="flex items-center justify-end gap-2.5 w-full">
            <button
              type="button"
              onClick={() => setDeleteModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition cursor-pointer"
            >
              {isKhmer ? 'ទេ, បោះបង់' : 'Cancel'}
            </button>
            <button
              type="button"
              onClick={handleDeleteCategory}
              disabled={isDeleting}
              className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-md shadow-rose-500/25 active:scale-98 transition flex items-center gap-1.5 disabled:opacity-60 cursor-pointer"
            >
              {isDeleting && (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              <span>{isKhmer ? 'យល់ព្រមលុប' : 'Yes, Delete'}</span>
            </button>
          </div>
        }
      >
        <p className="text-xs text-slate-500 leading-relaxed">
          {isKhmer
            ? `តើអ្នកប្រាកដជាចង់លុបផ្នែក "${categoryToDelete?.name_en}" នេះមែនទេ? ប្រសិនបើមានការងារសកម្មភ្ជាប់ជាមួយ ការងារទាំងនោះនឹងមិនត្រូវបានលុបទេ គ្រាន់តែមិនមានផ្នែកកំណត់ប៉ុណ្ណោះ។`
            : `Are you sure you want to delete "${categoryToDelete?.name_en}"? Jobs assigned to this category will not be deleted, but will become unassigned.`}
        </p>
      </Dialog>
    </div>
  )
}
