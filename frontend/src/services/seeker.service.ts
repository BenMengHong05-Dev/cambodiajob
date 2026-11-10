import { api } from './api'
import { SeekerProfile, Education, WorkExperience, Resume, Application, ApiResponse } from '../types'

export const seekerService = {
  async getProfile(): Promise<SeekerProfile> {
    const res = await api.get<ApiResponse<SeekerProfile>>('/seeker/profile/')
    return res.data.data
  },

  async updateProfile(data: Partial<SeekerProfile>): Promise<SeekerProfile> {
    const res = await api.patch<ApiResponse<SeekerProfile>>('/seeker/profile/', data)
    return res.data.data
  },

  async addEducation(data: Omit<Education, 'id'>): Promise<Education> {
    const res = await api.post<ApiResponse<Education>>('/seeker/educations/', data)
    return res.data.data
  },

  async deleteEducation(id: number): Promise<void> {
    await api.delete(`/seeker/educations/${id}/`)
  },

  async addExperience(data: Omit<WorkExperience, 'id'>): Promise<WorkExperience> {
    const res = await api.post<ApiResponse<WorkExperience>>('/seeker/experiences/', data)
    return res.data.data
  },

  async deleteExperience(id: number): Promise<void> {
    await api.delete(`/seeker/experiences/${id}/`)
  },

  async addSkill(skillId: number, proficiencyLevel: string): Promise<void> {
    await api.post('/seeker/skills/', { skill_id: skillId, proficiency_level: proficiencyLevel })
  },

  async deleteSkill(skillId: number): Promise<void> {
    await api.delete(`/seeker/skills/${skillId}/`)
  },

  async getResumes(): Promise<Resume[]> {
    const res = await api.get<ApiResponse<Resume[]>>('/seeker/resumes/')
    return res.data.data
  },

  async uploadResume(formData: FormData): Promise<Resume> {
    const res = await api.post<ApiResponse<Resume>>('/seeker/resumes/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data.data
  },

  async deleteResume(id: number): Promise<void> {
    await api.delete(`/seeker/resumes/${id}/`)
  },

  async getApplications(): Promise<Application[]> {
    const res = await api.get<ApiResponse<Application[]>>('/applications/seeker/')
    return res.data.data
  },

  async withdrawApplication(appId: number): Promise<void> {
    await api.delete(`/applications/seeker/${appId}/`)
  },

  async getSavedJobs(): Promise<any[]> {
    const res = await api.get<ApiResponse<any[]>>('/seeker/saved/')
    return res.data.data
  },
}

