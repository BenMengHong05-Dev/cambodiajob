/**
 * Google OAuth 2.0 Integration Utility (Google Identity Services GIS)
 * Enables real sign in with Google accounts via Google's official OAuth consent popup.
 */

declare global {
  interface Window {
    google?: any
  }
}

export interface GoogleUserProfile {
  email: string
  name: string
  picture?: string
  sub?: string
  accessToken: string
}

const STORAGE_KEY = 'cambodia_jobs_google_client_id'

export const getGoogleClientId = (): string => {
  const envId = (import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim()
  if (envId) return envId
  return (localStorage.getItem(STORAGE_KEY) || '').trim()
}

export const setGoogleClientId = (id: string): void => {
  if (id && id.trim()) {
    localStorage.setItem(STORAGE_KEY, id.trim())
  } else {
    localStorage.removeItem(STORAGE_KEY)
  }
}

/**
 * Dynamically loads the official Google Identity Services script.
 */
export const loadGoogleGISScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.oauth2) {
      resolve()
      return
    }

    const existingScript = document.getElementById('google-gis-script')
    if (existingScript) {
      const checkInterval = setInterval(() => {
        if (window.google?.accounts?.oauth2) {
          clearInterval(checkInterval)
          resolve()
        }
      }, 50)
      setTimeout(() => {
        clearInterval(checkInterval)
        if (window.google?.accounts?.oauth2) resolve()
        else reject(new Error('Google Identity Services script load timed out'))
      }, 5000)
      return
    }

    const script = document.createElement('script')
    script.id = 'google-gis-script'
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => {
      // Small timeout for window.google to initialize fully
      setTimeout(() => {
        if (window.google?.accounts?.oauth2) {
          resolve()
        } else {
          resolve() // May initialize momentarily
        }
      }, 50)
    }
    script.onerror = () => reject(new Error('Failed to load Google Identity Services library'))
    document.head.appendChild(script)
  })
}

/**
 * Triggers the official Google OAuth 2.0 popup and returns authenticated user info.
 */
export const triggerGoogleOAuth = async (clientId?: string): Promise<GoogleUserProfile> => {
  const activeClientId = clientId || getGoogleClientId()
  if (!activeClientId) {
    throw new Error('MISSING_CLIENT_ID')
  }

  await loadGoogleGISScript()

  if (!window.google?.accounts?.oauth2) {
    throw new Error('Google OAuth library could not be initialized.')
  }

  return new Promise<GoogleUserProfile>((resolve, reject) => {
    let resolved = false

    try {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: activeClientId,
        scope: 'email profile openid',
        callback: async (tokenResponse: any) => {
          if (resolved) return
          resolved = true

          if (tokenResponse.error) {
            reject(new Error(tokenResponse.error_description || tokenResponse.error))
            return
          }

          if (!tokenResponse.access_token) {
            reject(new Error('No access token returned from Google.'))
            return
          }

          try {
            // Retrieve verified user profile from Google OAuth2 API
            const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: {
                Authorization: `Bearer ${tokenResponse.access_token}`,
              },
            })

            if (!res.ok) {
              throw new Error(`Google API returned status ${res.status}`)
            }

            const profile = await res.json()
            resolve({
              email: profile.email,
              name: profile.name || profile.given_name || profile.email.split('@')[0],
              picture: profile.picture,
              sub: profile.sub,
              accessToken: tokenResponse.access_token,
            })
          } catch (fetchErr: any) {
            reject(new Error(fetchErr.message || 'Failed to fetch Google profile information.'))
          }
        },
        error_callback: (nonOAuthErr: any) => {
          if (resolved) return
          resolved = true
          reject(new Error(nonOAuthErr.message || 'Google OAuth window closed or cancelled.'))
        },
      })

      // Immediately requests Google sign-in consent popup
      client.requestAccessToken({ prompt: 'select_account' })
    } catch (err: any) {
      reject(err)
    }
  })
}

