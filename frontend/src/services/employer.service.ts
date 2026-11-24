import { api } from './api'
import { Job, Application, ApiResponse } from '../types'

export const employerService = {
  async getEmployerJobs(): Promise<Job[]> {
    const res = await api.get<ApiResponse<Job[]>>('/employer/jobs/')
    return res.data.data
  },

  async getEmployerJob(id: number): Promise<Job> {
    const res = await api.get<ApiResponse<Job>>(`/employer/jobs/${id}/`)
    return res.data.data
  },

  async createJob(data: any): Promise<Job> {
    const res = await api.post<ApiResponse<Job>>('/employer/jobs/', data)
    return res.data.data
  },

  async updateJob(id: number, data: any): Promise<Job> {
    const res = await api.patch<ApiResponse<Job>>(`/employer/jobs/${id}/`, data)
    return res.data.data
  },

  async updateJobStatus(id: number, status: string): Promise<void> {
    await api.patch(`/employer/jobs/${id}/status/`, { status })
  },

  async getJobApplicants(jobId: number): Promise<{ job: Job; applications: Application[] }> {
    const res = await api.get<ApiResponse<{ job: Job; applications: Application[] }>>(
      `/applications/employer/job/${jobId}/`
    )
    return res.data.data
  },

  async getRecentApplicants(): Promise<Application[]> {
    const res = await api.get<ApiResponse<Application[]>>('/applications/employer/recent/')
    return res.data.data
  },

  async getAllApplicants(): Promise<Application[]> {
    const res = await api.get<ApiResponse<Application[]>>('/applications/employer/recent/?limit=all')
    return res.data.data
  },

  async updateApplicantStatus(appId: number, status: string, notes?: string): Promise<void> {
    await api.patch(`/applications/employer/${appId}/status/`, { status, notes })
  },

  async deleteJob(id: number): Promise<void> {
    await api.delete(`/employer/jobs/${id}/`)
  },

  async deleteApplication(appId: number): Promise<void> {
    await api.delete(`/applications/employer/${appId}/status/`)
  },

  async scheduleInterview(
    appId: number,
    data: {
      scheduled_at: string
      location_or_link?: string
      interview_type?: string
      notes?: string
      send_email?: boolean
    }
  ): Promise<any> {
    const res = await api.post(`/interviews/applications/${appId}/interview/`, data)
    return res.data.data
  },
}

