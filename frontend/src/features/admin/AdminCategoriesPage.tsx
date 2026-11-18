import React, { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { adminService } from '../../services/admin.service'
import { useToast } from '../../app/providers'
import { TablePagination } from '../../components/common/TablePagination'
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
  FolderTree,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  Copy,
  CheckCheck,
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
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')

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
      const payload = {
        name_en: formNameEn.trim(),
        name_km: formNameKm.trim(),
        slug: formSlug.trim() || undefined,
        icon: formIcon.trim() || 'briefcase',
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

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
      {/* 1. Header Banner */}
      <div className="glass-card bg-white rounded-2xl p-6 sm:p-7 border border-gray-200/90 shadow-2xs relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1 z-10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <Layers className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                {isKhmer ? 'គ្រប់គ្រងផ្នែកការងារ' : 'Job Categories Management'}
              </h1>
              <p className="text-xs text-slate-500">
                {isKhmer
                  ? 'បង្កើត កែសម្រួល និងគ្រប់គ្រងប្រភេទការងារដែលបង្ហាញនៅលើទំព័រដើម និងទំព័រស្វែងរក'
                  : 'Create, modify, and configure job categories displayed across the homepage and job explorer'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 z-10 shrink-0">
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-md shadow-blue-500/25 active:scale-98 transition flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>{isKhmer ? 'បង្កើតផ្នែកការងារថ្មី' : 'Create New Category'}</span>
          </button>
        </div>
      </div>


      {/* 3. Search, Filter Toolbar & View Mode Toggle */}
      <div className="bg-white rounded-2xl p-3 sm:p-4 border border-gray-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              isKhmer
                ? 'ស្វែងរកផ្នែកការងារ (អង់គ្លេស / ខ្មែរ / slug)...'
                : 'Search categories by name or slug...'
            }
            className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-50/80 border border-gray-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition shadow-2xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Pills & View Switcher */}
        <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2 w-full md:w-auto">
          {/* Status Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <button
              type="button"
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer shrink-0 ${
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
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer shrink-0 ${
                filterType === 'has_jobs'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-emerald-50/80 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/70'
              }`}
            >
              {isKhmer ? 'មានការងារ' : 'With Jobs'} ({categoriesWithJobsCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('empty')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer shrink-0 ${
                filterType === 'empty'
                  ? 'bg-slate-700 text-white shadow-2xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-gray-200'
              }`}
            >
              {isKhmer ? 'គ្មានការងារ' : 'Empty'} ({categories.length - categoriesWithJobsCount})
            </button>
          </div>
        </div>
      </div>

      {/* 4. Main Content: Table View OR Grid View */}
      {isLoading ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-200 shadow-2xs">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500">
            {isKhmer ? 'កំពុងផ្ទុកផ្នែកការងារ...' : 'Loading categories...'}
          </p>
        </div>
      ) : sortedCategories.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-200 shadow-2xs">
          <FolderTree className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-700">
            {isKhmer ? 'រកមិនឃើញផ្នែកការងារទេ' : 'No categories found'}
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {searchQuery
              ? isKhmer
                ? `ពាក្យគន្លឹះ "${searchQuery}" មិនមានលទ្ធផលទេ។`
                : `No categories match query "${searchQuery}".`
              : isKhmer
              ? 'សូមចុចប៊ូតុង "បង្កើតផ្នែកការងារថ្មី" ដើម្បីបន្ថែមប្រភេទការងារដំបូង។'
              : 'Click "Create New Category" to add your first job category.'}
          </p>
        </div>
      ) : (
        /* ======================== 4. PROFESSIONAL LIST TABLE VIEW ======================== */
        <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/90 border-b border-gray-200 text-slate-500 uppercase tracking-wider font-semibold text-[10px]">
                  {/* ID Column */}
                  <th className="py-3 px-4 w-16">
                    <button
                      type="button"
                      onClick={() => handleSort('id')}
                      className="flex items-center gap-1 hover:text-slate-800 transition cursor-pointer"
                    >
                      <span># ID</span>
                      {sortField === 'id' ? (
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

                  {/* Category Name Column */}
                  <th className="py-3 px-4 min-w-[220px]">
                    <button
                      type="button"
                      onClick={() => handleSort('name')}
                      className="flex items-center gap-1 hover:text-slate-800 transition cursor-pointer"
                    >
                      <span>{isKhmer ? 'ឈ្មោះផ្នែកការងារ' : 'Category Name'}</span>
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

                  {/* Slug / URL Path Column */}
                  <th className="py-3 px-4 min-w-[170px]">
                    {isKhmer ? 'ផ្លូវ URL (Slug)' : 'Slug / URL Path'}
                  </th>

                  {/* Icon Identifier */}
                  <th className="py-3 px-3 min-w-[110px] hidden md:table-cell">
                    {isKhmer ? 'រូបតំណាង' : 'Icon Preset'}
                  </th>

                  {/* Vacancies / Job Count Column */}
                  <th className="py-3 px-4 min-w-[130px]">
                    <button
                      type="button"
                      onClick={() => handleSort('jobs_count')}
                      className="flex items-center gap-1 hover:text-slate-800 transition cursor-pointer"
                    >
                      <span>{isKhmer ? 'ការងារសកម្ម' : 'Active Vacancies'}</span>
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

                  {/* Status Column */}
                  <th className="py-3 px-3 min-w-[110px] hidden sm:table-cell">
                    {isKhmer ? 'ស្ថានភាព' : 'Status'}
                  </th>

                  {/* Actions Column */}
                  <th className="py-3 px-4 text-right min-w-[130px]">
                    {isKhmer ? 'សកម្មភាព' : 'Actions'}
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 font-sans">
                {paginatedCategories.map((cat, idx) => {
                  const hasJobs = (cat.jobs_count || 0) > 0
                  const isCopied = copiedSlugId === cat.id

                  return (
                    <tr
                      key={cat.id}
                      className="hover:bg-slate-50/80 transition-colors group cursor-default"
                    >
                      {/* ID */}
                      <td className="py-3 px-4 align-middle text-slate-400 font-mono text-[11px]">
                        #{cat.id}
                      </td>

                      {/* Category Name & Icon */}
                      <td className="py-3 px-4 align-middle">
                        <div className="flex items-center space-x-3">
                          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 border border-blue-100/90 flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-2xs">
                            {renderCategoryIcon(cat.icon || cat.slug, 'w-4 h-4')}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors text-xs truncate">
                              {cat.name_en}
                            </h4>
                            <p className="text-[11px] font-medium text-slate-500 truncate mt-0.5">
                              {cat.name_km}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Slug with Copy Pill */}
                      <td className="py-3 px-4 align-middle">
                        <button
                          type="button"
                          onClick={(e) => handleCopySlug(cat, e)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono transition border cursor-pointer ${
                            isCopied
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-gray-200'
                          }`}
                          title={isKhmer ? 'ចុចដើម្បីចម្លង slug' : 'Click to copy slug'}
                        >
                          {isCopied ? (
                            <CheckCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                          ) : (
                            <Copy className="w-3 h-3 text-slate-400 shrink-0" />
                          )}
                          <span className="truncate max-w-[140px]">/{cat.slug}</span>
                        </button>
                      </td>

                      {/* Icon Preset Name */}
                      <td className="py-3 px-3 align-middle hidden md:table-cell">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-medium">
                          {renderCategoryIcon(cat.icon || cat.slug, 'w-3 h-3 text-slate-500')}
                          <span>{cat.icon || 'briefcase'}</span>
                        </span>
                      </td>

                      {/* Vacancies / Job Count */}
                      <td className="py-3 px-4 align-middle">
                        {hasJobs ? (
                          <Link
                            to={`/jobs?category=${cat.id}`}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition shadow-2xs group/link"
                            title={isKhmer ? 'ចុចមើលការងារទាំងអស់ក្នុងផ្នែកនេះ' : 'View all jobs in this category'}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                            <span>
                              {cat.jobs_count} {isKhmer ? 'ការងារ' : 'vacancies'}
                            </span>
                            <ExternalLink className="w-2.5 h-2.5 opacity-60 group-hover/link:opacity-100" />
                          </Link>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 text-slate-500 border border-slate-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                            <span>0 {isKhmer ? 'ការងារ' : 'vacancies'}</span>
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 align-middle hidden sm:table-cell">
                        {hasJobs ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200/70 text-[10px] font-semibold">
                            {isKhmer ? 'មានការងារសកម្ម' : 'Active Listed'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-50 text-slate-500 border border-slate-200 text-[10px] font-normal">
                            {isKhmer ? 'មិនទាន់មានការងារ' : 'Available'}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 align-middle text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* View Jobs Link */}
                          <Link
                            to={`/jobs?category=${cat.id}`}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition"
                            title={isKhmer ? 'មើលការងារក្នុងផ្នែកនេះ' : 'Explore Jobs'}
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>

                          {/* Quick Edit */}
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(cat)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                            title={isKhmer ? 'កែសម្រួល' : 'Edit Category'}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => {
                              setCategoryToDelete(cat)
                              setDeleteModalOpen(true)
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                            title={isKhmer ? 'លុប' : 'Delete Category'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
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
      )}

      {/* 5. Create / Edit Category Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl border border-gray-200 shadow-2xl max-w-lg w-full overflow-hidden animate-scale-in">
            {/* Modal Header */}
            <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-slate-900">
                    {editingCategory
                      ? isKhmer
                        ? 'កែសម្រួលផ្នែកការងារ'
                        : 'Edit Job Category'
                      : isKhmer
                      ? 'បង្កើតផ្នែកការងារថ្មី'
                      : 'Create New Job Category'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {editingCategory
                      ? isKhmer
                        ? `កែប្រែទិន្នន័យសម្រាប់ #${editingCategory.id}`
                        : `Updating category #${editingCategory.id}`
                      : isKhmer
                      ? 'បញ្ចូលព័ត៌មានផ្នែកការងារថ្មី'
                      : 'Enter details for the new job vacancy category'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveCategory} className="p-6 space-y-4">
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

              {/* Slug with Auto Generator */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">
                    Slug (URL identifier)
                  </label>
                  <button
                    type="button"
                    onClick={handleAutoSlug}
                    className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
                  >
                    {isKhmer ? 'បង្កើតពីឈ្មោះស្វ័យប្រវត្តិ' : 'Auto-generate from English'}
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-mono">
                    /
                  </span>
                  <input
                    type="text"
                    value={formSlug}
                    onChange={(e) => setFormSlug(e.target.value)}
                    placeholder="e.g. information-technology-software"
                    className="w-full pl-6 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 font-mono placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 shadow-2xs"
                  />
                </div>
              </div>

              {/* Icon Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {isKhmer ? 'ជ្រើសរើសរូបតំណាង (Icon)' : 'Select Icon Preset'}
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-36 overflow-y-auto p-1 bg-slate-50/60 rounded-xl border border-slate-200/70">
                  {PRESET_ICONS.map((p) => {
                    const isSelected = formIcon === p.name
                    return (
                      <button
                        key={p.name}
                        type="button"
                        onClick={() => setFormIcon(p.name)}
                        className={`flex flex-col items-center justify-center p-2 rounded-lg text-center transition cursor-pointer ${
                          isSelected
                            ? 'bg-blue-600 text-white shadow-xs font-bold'
                            : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/80'
                        }`}
                        title={p.label}
                      >
                        <div className="mb-1">{p.icon}</div>
                        <span className="text-[9px] truncate max-w-full">
                          {p.name}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Live Preview Card */}
              <div className="pt-2">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  {isKhmer ? 'ទម្រង់បង្ហាញនៅលើទំព័រដើម (Live Card Preview)' : 'Live Preview (Homepage Style)'}
                </label>
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 shadow-2xs flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                      {renderCategoryIcon(formIcon, 'w-4 h-4')}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 line-clamp-1">
                        {formNameEn.trim() || 'Category Name'}
                      </div>
                      <div className="text-[11px] text-slate-500 line-clamp-1">
                        {formNameKm.trim() || 'ឈ្មោះផ្នែកការងារ'} &bull; 0 vacancies
                      </div>
                    </div>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-300" />
                </div>
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
          </div>
        </div>
      )}

      {/* 6. Delete Confirmation Modal */}
      {deleteModalOpen && categoryToDelete && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl border border-gray-200 shadow-2xl max-w-sm w-full p-6 text-center animate-scale-in">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3 shadow-inner">
              <Trash2 className="w-6 h-6 text-rose-600" />
            </div>

            <h3 className="font-bold text-base text-slate-900">
              {isKhmer ? 'បញ្ជាក់ការលុបផ្នែកការងារ?' : 'Delete Job Category?'}
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              {isKhmer
                ? `តើអ្នកប្រាកដជាចង់លុបផ្នែក "${categoryToDelete.name_en}" នេះមែនទេ? ប្រសិនបើមានការងារសកម្មភ្ជាប់ជាមួយ ការងារទាំងនោះនឹងមិនត្រូវបានលុបទេ គ្រាន់តែមិនមានផ្នែកកំណត់ប៉ុណ្ណោះ។`
                : `Are you sure you want to delete "${categoryToDelete.name_en}"? Jobs assigned to this category will not be deleted, but will become unassigned.`}
            </p>

            <div className="mt-5 flex items-center justify-center gap-2.5">
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
          </div>
        </div>
      )}
    </div>
  )
}
