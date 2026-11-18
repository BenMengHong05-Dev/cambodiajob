export type UserRole = 'job_seeker' | 'employer' | 'admin'

export interface User {
  id: number
  email: string
  full_name: string
  phone_number?: string | null
  avatar_url?: string | null
  is_active: boolean
  roles: UserRole[]
  seeker_profile?: {
    id: number
    headline?: string | null
    avatar_url?: string | null
    province?: string | null
    city?: string | null
  } | null
  company?: {
    id: number
    name: string
    slug: string
    logo_url?: string | null
    verification_status: 'pending' | 'verified' | 'rejected'
    member_role: string
  } | null
}

export type Currency = 'USD' | 'KHR'

export type EmploymentType =
  | 'full_time'
  | 'part_time'
  | 'internship'
  | 'contract'
  | 'freelance'

export type WorkplaceType = 'on_site' | 'remote' | 'hybrid'

export type ExperienceLevel =
  | 'fresh_graduate'
  | 'entry'
  | 'mid'
  | 'senior'
  | 'lead'
  | 'executive'

export type ApplicationStatus =
  | 'submitted'
  | 'reviewing'
  | 'shortlisted'
  | 'interview'
  | 'offered'
  | 'rejected'
  | 'withdrawn'

export interface JobLocation {
  id: number
  province_en: string
  province_km: string
  city_en?: string | null
  city_km?: string | null
  jobs_count?: number
}

export interface ProvinceItem {
  province_en: string
  province_km: string
  jobs_count?: number
}

export interface JobCategory {
  id: number
  name_en: string
  name_km: string
  slug: string
  icon?: string | null
  jobs_count?: number
}

export interface Industry {
  id: number
  name_en: string
  name_km: string
  slug: string
}

export interface Skill {
  id: number
  name: string
  category?: string | null
  proficiency_level?: string
}

export interface Company {
  id: number
  name: string
  slug: string
  logo_url?: string | null
  banner_url?: string | null
  description?: string | null
  website?: string | null
  industry?: string | null
  company_size?: string | null
  province?: string | null
  city?: string | null
  address?: string | null
  verification_status: 'pending' | 'verified' | 'rejected'
  verified_at?: string | null
  created_at: string
  jobs_count?: number
}

export interface Job {
  id: number
  company_id: number
  category_id?: number | null
  title: string
  title_km?: string | null
  slug: string
  description: string
  description_km?: string | null
  requirements?: string | null
  employment_type: EmploymentType
  workplace_type: WorkplaceType
  experience_level: ExperienceLevel
  education_level?: string | null
  province: string
  city?: string | null
  address?: string | null
  salary_min?: number | null
  salary_max?: number | null
  salary_currency: Currency
  is_salary_negotiable: boolean
  vacancies_count: number
  status: 'draft' | 'published' | 'closed' | 'expired' | 'suspended'
  moderation_status: 'pending' | 'approved' | 'rejected'
  published_at?: string | null
  created_at: string
  company_name?: string
  company_slug?: string
  company_logo?: string | null
  company_banner?: string | null
  company_description?: string | null
  company_website?: string | null
  company_verification?: string
  category_name_en?: string
  category_name_km?: string
  skills?: Skill[]
  related_jobs?: any[]
  is_saved?: boolean
  has_applied?: boolean
  applications_count?: number
}

export interface SeekerProfile {
  id: number
  user_id: number
  full_name?: string
  email?: string
  phone_number?: string | null
  headline?: string | null
  summary?: string | null
  date_of_birth?: string | null
  gender?: string | null
  province?: string | null
  city?: string | null
  address?: string | null
  current_salary?: number | null
  expected_salary?: number | null
  salary_currency: Currency
  avatar_url?: string | null
  educations?: Education[]
  work_experiences?: WorkExperience[]
  skills?: Skill[]
  resumes?: Resume[]
}

export interface Education {
  id: number
  seeker_id?: number
  institution: string
  degree: string
  field_of_study?: string | null
  start_date?: string | null
  end_date?: string | null
  is_current: boolean
  description?: string | null
}

export interface WorkExperience {
  id: number
  seeker_id?: number
  company_name: string
  job_title: string
  location?: string | null
  start_date?: string | null
  end_date?: string | null
  is_current: boolean
  description?: string | null
}

export interface Resume {
  id: number
  seeker_id?: number
  title: string
  file_path: string
  file_name: string
  file_size: number
  is_primary: boolean
  created_at: string
}

export interface Application {
  id: number
  job_id: number
  seeker_id: number
  resume_id?: number | null
  cover_letter?: string | null
  status: ApplicationStatus
  created_at: string
  updated_at: string
  job_title?: string
  job_slug?: string
  company_name?: string
  company_logo?: string | null
  applicant_name?: string
  applicant_email?: string
  applicant_phone?: string
  applicant_headline?: string
  resume_title?: string
  resume_path?: string
}

export interface PaginatedResponse<T> {
  count: number
  page: number
  page_size: number
  total_pages: number
  next: number | null
  previous: number | null
  results: T[]
}

export interface ApiResponse<T> {
  success: boolean
  message?: string
  data: T
  error?: string
  details?: any
}

// AI Job Agent & Career Chart Types
export interface AIMatchedJob extends Omit<Job, 'skills'> {
  skills?: string[]
  matched_skills?: string[]
  missing_skills?: string[]
  match_score: number
  verification_status?: string
}

export interface AISkillMatchItem {
  skill: string
  user_has: boolean
  match_percent: number
}

export interface AISalaryBenchmarkItem {
  label: string
  label_km?: string
  min: number
  avg: number
  max: number
  count?: number
  company?: string
}

export interface AIChartData {
  type: 'salary_benchmark' | 'skill_match' | 'category_distribution'
  title: string
  title_km?: string
  match_score?: number
  company?: string
  items: any[]
}

export interface AIChatMessage {
  id: string
  sender: 'user' | 'agent'
  text: string
  timestamp: string
  jobs?: AIMatchedJob[]
  chart?: AIChartData | null
  suggested_actions?: string[]
}

export interface AIChatResponse {
  reply: string
  matched_jobs: AIMatchedJob[]
  chart: AIChartData | null
  suggested_actions: string[]
  total_matches: number
}

// Global Website Settings & Branding
export interface SiteSettings {
  id?: number
  site_name: string
  site_name_km: string
  site_title: string
  site_title_km: string
  site_subtitle: string
  site_subtitle_km: string
  site_description: string
  site_description_km: string
  logo_url?: string | null
  favicon_url?: string | null
  hero_title: string
  hero_title_km: string
  hero_subtitle: string
  hero_subtitle_km: string
  hero_badge_text?: string | null
  hero_badge_text_km?: string | null
  contact_email: string
  contact_phone: string
  contact_address: string
  contact_address_km: string
  footer_text: string
  footer_text_km: string
  social_facebook?: string | null
  social_telegram?: string | null
  social_linkedin?: string | null
  social_twitter?: string | null
  announcement_enabled?: boolean
  announcement_text?: string | null
  announcement_text_km?: string | null
  announcement_url?: string | null
  updated_at?: string
}


