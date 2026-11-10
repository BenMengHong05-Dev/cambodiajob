import { api } from './api'
import { Job, JobCategory, JobLocation, ProvinceItem, Skill, PaginatedResponse, ApiResponse } from '../types'

export interface JobFilterParams {
  q?: string
  category?: string
  province?: string
  employment_type?: string
  workplace_type?: string
  experience_level?: string
  salary_min?: number
  currency?: string
  sort?: string
  page?: number
  page_size?: number
}

export const jobsService = {
  async getJobs(params: JobFilterParams = {}): Promise<PaginatedResponse<Job>> {
    const res = await api.get<ApiResponse<PaginatedResponse<Job>>>('/jobs/', { params })
    return res.data.data
  },

  async getJobBySlug(slug: string): Promise<Job> {
    const res = await api.get<ApiResponse<Job>>(`/jobs/${slug}/`)
    return res.data.data
  },

  async toggleSaveJob(jobId: number, isSaved: boolean): Promise<boolean> {
    if (isSaved) {
      await api.delete(`/jobs/${jobId}/save/`)
      return false
    } else {
      await api.post(`/jobs/${jobId}/save/`)
      return true
    }
  },

  async applyJob(jobId: number, data: { resume_id?: number | null; cover_letter?: string }): Promise<any> {
    const res = await api.post(`/applications/apply/${jobId}/`, data)
    return res.data
  },

  async getCategories(params?: { has_jobs?: boolean }): Promise<JobCategory[]> {
    const res = await api.get<ApiResponse<JobCategory[]>>('/categories/', { params })
    return res.data.data
  },

  async getLocations(params?: { has_jobs?: boolean }): Promise<{ locations: JobLocation[]; provinces: ProvinceItem[] }> {
    const res = await api.get<ApiResponse<{ locations: JobLocation[]; provinces: ProvinceItem[] }>>('/locations/', { params })
    return res.data.data
  },

  async getSkills(category?: string): Promise<Skill[]> {
    const res = await api.get<ApiResponse<Skill[]>>('/skills/', { params: { category } })
    return res.data.data
  },

  async createSkill(data: { name: string; category?: string }): Promise<Skill> {
    const res = await api.post<ApiResponse<Skill>>('/skills/', data)
    return res.data.data
  },

  async getStats(): Promise<{ total_jobs: number; total_companies: number; provinces_with_jobs: number }> {
    const res = await api.get<ApiResponse<{ total_jobs: number; total_companies: number; provinces_with_jobs: number }>>('/jobs/stats/')
    return res.data.data
  },
}

