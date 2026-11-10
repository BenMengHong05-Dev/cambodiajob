import { api } from './api'
import { ApiResponse } from '../types'

export const adminService = {
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

  async createUser(data: { full_name: string; email: string; password: string; phone_number?: string; roles?: string[] }): Promise<any> {
    const res = await api.post<ApiResponse<any>>('/admin/users/', data)
    return res.data
  },

  async updateUser(userId: number, data: { full_name?: string; email?: string; phone_number?: string; is_active?: boolean; password?: string; roles?: string[] }): Promise<any> {
    const res = await api.patch<ApiResponse<any>>(`/admin/users/${userId}/`, data)
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

  async getJobs(): Promise<any[]> {
    const res = await api.get<ApiResponse<any[]>>('/admin/jobs/')
    return res.data.data
  },

  async moderateJob(jobId: number, status: 'approved' | 'rejected' | 'pending'): Promise<void> {
    await api.patch(`/admin/jobs/${jobId}/moderation/`, { moderation_status: status })
  },

  async deleteJob(jobId: number): Promise<any> {
    const res = await api.delete<ApiResponse<any>>(`/admin/jobs/${jobId}/moderation/`)
    return res.data
  },

  async getAuditLogs(): Promise<any[]> {
    const res = await api.get<ApiResponse<any[]>>('/admin/audit/')
    return res.data.data
  },
}

