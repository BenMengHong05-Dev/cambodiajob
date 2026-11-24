import { api } from './api'
import { ApiResponse, SiteSettings } from '../types'

export const adminService = {
  async getPublicSettings(): Promise<SiteSettings> {
    const res = await api.get<ApiResponse<SiteSettings>>('/site-settings/')
    return res.data.data
  },

  async getSettings(): Promise<SiteSettings> {
    const res = await api.get<ApiResponse<SiteSettings>>('/admin/settings/')
    return res.data.data
  },

  async updateSettings(data: Partial<SiteSettings>): Promise<{ success: boolean; data: SiteSettings; message: string }> {
    const res = await api.patch<{ success: boolean; data: SiteSettings; message: string }>('/admin/settings/', data)
    return res.data
  },

  async uploadLogo(file: File, type: 'logo' | 'favicon' = 'logo'): Promise<{ success: boolean; url: string; filename: string; message: string }> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', type)
    const res = await api.post<{ success: boolean; url: string; filename: string; message: string }>(
      '/admin/settings/upload-logo/',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )
    return res.data
  },
  async getDashboard(): Promise<any> {
    const res = await api.get<ApiResponse<any>>('/admin/dashboard/')
    return res.data.data
  },

  async getUsers(): Promise<any[]> {
    const res = await api.get<ApiResponse<any[]>>('/admin/users/')
    return res.data.data
  },

  async getUser(userId: number): Promise<any> {
    const res = await api.get<ApiResponse<any>>(`/admin/users/${userId}/`)
    return res.data.data
  },

  async createUser(data: { full_name: string; email: string; password: string; phone_number?: string; role?: string; roles?: string[]; permissions?: string[] }): Promise<any> {
    const res = await api.post<ApiResponse<any>>('/admin/users/', data)
    return res.data
  },

  async updateUser(userId: number, data: { full_name?: string; email?: string; phone_number?: string; is_active?: boolean; password?: string; role?: string; roles?: string[]; permissions?: string[] | null; has_custom_permissions?: boolean }): Promise<any> {
    const res = await api.patch<ApiResponse<any>>(`/admin/users/${userId}/`, data)
    return res.data
  },

  async getRolesAndPermissions(): Promise<{
    roles: Array<{
      id: number
      name: string
      description: string
      user_count: number
      permissions: string[]
    }>
    catalog: Array<{
      category: string
      categoryKm: string
      permissions: Array<{
        key: string
        name: string
        nameKm: string
        description: string
        descriptionKm?: string
      }>
    }>
  }> {
    const res = await api.get<ApiResponse<any>>('/admin/roles/')
    return res.data.data
  },

  async updateRolePermissions(roleId: number, data: { description?: string; permissions: string[] }): Promise<any> {
    const res = await api.put<ApiResponse<any>>(`/admin/roles/${roleId}/`, data)
    return res.data
  },

  async createRole(data: { name: string; description?: string; permissions?: string[] }): Promise<any> {
    const res = await api.post<ApiResponse<any>>('/admin/roles/', data)
    return res.data
  },

  async deleteRole(roleId: number): Promise<any> {
    const res = await api.delete<ApiResponse<any>>(`/admin/roles/${roleId}/`)
    return res.data
  },

  async deleteUser(userId: number): Promise<any> {
    const res = await api.delete<ApiResponse<any>>(`/admin/users/${userId}/`)
    return res.data
  },

  async bulkDeleteUsers(userIds: number[]): Promise<any> {
    const res = await api.post<ApiResponse<any>>('/admin/users/bulk-delete/', { user_ids: userIds })
    return res.data
  },

  async toggleUserStatus(userId: number): Promise<void> {
    await api.patch(`/admin/users/${userId}/status/`)
  },

  async getCompanies(): Promise<any[]> {
    const res = await api.get<ApiResponse<any[]>>('/admin/companies/')
    return res.data.data
  },

  async getCompany(companyId: number): Promise<any> {
    const res = await api.get<ApiResponse<any>>(`/admin/companies/${companyId}/`)
    return res.data.data
  },

  async updateCompany(companyId: number, data: any): Promise<any> {
    const res = await api.patch<ApiResponse<any>>(`/admin/companies/${companyId}/`, data)
    return res.data
  },

  async deleteCompany(companyId: number): Promise<any> {
    const res = await api.delete<ApiResponse<any>>(`/admin/companies/${companyId}/`)
    return res.data
  },

  async verifyCompany(companyId: number, status: 'verified' | 'rejected' | 'pending'): Promise<void> {
    await api.patch(`/admin/companies/${companyId}/verification/`, { verification_status: status })
  },

  async getCompanyMembers(companyId: number): Promise<{ success: boolean; data: any[]; company: any }> {
    const res = await api.get<ApiResponse<any>>(`/admin/companies/${companyId}/members/`)
    return res.data as any
  },

  async addCompanyMember(companyId: number, data: { full_name?: string; email: string; password?: string; phone_number?: string; role?: string }): Promise<any> {
    const res = await api.post<ApiResponse<any>>(`/admin/companies/${companyId}/members/`, data)
    return res.data
  },

  async removeCompanyMember(companyId: number, userId: number): Promise<any> {
    const res = await api.delete<ApiResponse<any>>(`/admin/companies/${companyId}/members/${userId}/`)
    return res.data
  },

  async updateCompanyMemberRole(companyId: number, userId: number, role: string): Promise<any> {
    const res = await api.patch<ApiResponse<any>>(`/admin/companies/${companyId}/members/${userId}/`, { role })
    return res.data
  },

  async getJobs(): Promise<any[]> {
    const res = await api.get<ApiResponse<any[]>>('/admin/jobs/')
    return res.data.data
  },

  async moderateJob(jobId: number, status: 'approved' | 'rejected' | 'pending'): Promise<void> {
    await api.patch(`/admin/jobs/${jobId}/moderation/`, { moderation_status: status })
  },

  async updateJob(jobId: number, data: any): Promise<any> {
    const res = await api.patch<ApiResponse<any>>(`/admin/jobs/${jobId}/`, data)
    return res.data
  },

  async deleteJob(jobId: number): Promise<any> {
    const res = await api.delete<ApiResponse<any>>(`/admin/jobs/${jobId}/moderation/`)
    return res.data
  },

  async getAuditLogs(): Promise<any[]> {
    const res = await api.get<ApiResponse<any[]>>('/admin/audit/')
    return res.data.data
  },

  async getCategories(params?: { has_jobs?: boolean }): Promise<any[]> {
    const res = await api.get<ApiResponse<any[]>>('/admin/categories/', { params })
    return res.data.data
  },

  async createCategory(data: { name_en: string; name_km: string; slug?: string; icon?: string }): Promise<any> {
    const res = await api.post<ApiResponse<any>>('/admin/categories/', data)
    return res.data
  },

  async updateCategory(categoryId: number, data: { name_en?: string; name_km?: string; slug?: string; icon?: string }): Promise<any> {
    const res = await api.put<ApiResponse<any>>(`/admin/categories/${categoryId}/`, data)
    return res.data
  },

  async deleteCategory(categoryId: number): Promise<any> {
    const res = await api.delete<ApiResponse<any>>(`/admin/categories/${categoryId}/`)
    return res.data
  },
}

