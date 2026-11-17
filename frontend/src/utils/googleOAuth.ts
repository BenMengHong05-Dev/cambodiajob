

export const redirectToGoogleOAuth = (role: 'job_seeker' | 'employer' = 'job_seeker'): void => {
  const apiBase = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/v1').replace(/\/+$/, '')
  window.location.href = `${apiBase}/auth/google/login/?role=${role}`
}

// Deprecated stubs for legacy components
export const getGoogleClientId = (): string => ''
export const setGoogleClientId = (_id: string): void => {}
