import { api } from './api'
import { Company, PaginatedResponse, ApiResponse } from '../types'

export const companiesService = {
  async getCompanies(params: { q?: string; industry?: string; province?: string; page?: number } = {}): Promise<PaginatedResponse<Company>> {
    const res = await api.get<ApiResponse<PaginatedResponse<Company>>>('/companies/', { params })
    return res.data.data
  },

  async getCompanyBySlug(slug: string): Promise<Company & { jobs: any[] }> {
    const res = await api.get<ApiResponse<Company & { jobs: any[] }>>(`/companies/${slug}/`)
    return res.data.data
  },

  async getEmployerCompany(): Promise<Company | null> {
    const res = await api.get<ApiResponse<Company | null>>('/employer/company/')
    return res.data.data
  },

  async updateEmployerCompany(data: Partial<Company>): Promise<Company> {
    const res = await api.patch<ApiResponse<Company>>('/employer/company/', data)
    return res.data.data
  },

  async uploadCompanyImage(file: File, type: 'logo' | 'banner' | 'id_card' | 'national_id' = 'logo'): Promise<{ url: string; filename: string; saved?: boolean }> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', type)
    const res = await api.post<ApiResponse<{ url: string; filename: string; saved?: boolean }>>('/employer/company/upload/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return (res.data as any).data || res.data
  },

  async getCompanyMembers(): Promise<{ success: boolean; data: any[]; my_role: string }> {
    const res = await api.get<ApiResponse<any[]>>('/employer/company/members/')
    return res.data as any
  },

  async addCompanyMember(data: { full_name: string; email: string; password?: string; phone_number?: string; role?: string }): Promise<any> {
    const res = await api.post<ApiResponse<any>>('/employer/company/members/', data)
    return res.data
  },

  async removeCompanyMember(userId: number): Promise<any> {
    const res = await api.delete<ApiResponse<any>>(`/employer/company/members/${userId}/`)
    return res.data
  },

  async updateCompanyMember(userId: number, data: { full_name?: string; phone_number?: string; password?: string; email?: string; role?: string }): Promise<any> {
    const res = await api.patch<ApiResponse<any>>(`/employer/company/members/${userId}/`, data)
    return res.data
  },

  async updateCompanyMemberRole(userId: number, role: string): Promise<any> {
    const res = await api.patch<ApiResponse<any>>(`/employer/company/members/${userId}/`, { role })
    return res.data
  },
}

