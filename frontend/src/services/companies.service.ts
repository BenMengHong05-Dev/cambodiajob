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

  async uploadCompanyImage(file: File): Promise<{ url: string; filename: string }> {
    const formData = new FormData()
    formData.append('file', file)
    const res = await api.post<ApiResponse<{ url: string; filename: string }>>('/employer/company/upload/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return (res.data as any).data || res.data
  },
}

