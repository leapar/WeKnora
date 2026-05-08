import { get, post } from '@/lib/api'
import type { UserInfo, TenantInfo } from '@/types'

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  success: boolean
  message?: string
  user?: UserInfo
  tenant?: TenantInfo
  token?: string
  refresh_token?: string
}

export interface OIDCAuthURLResponse {
  success: boolean
  authorization_url?: string
  state?: string
  message?: string
}

export interface OIDCConfigResponse {
  success: boolean
  enabled: boolean
  provider_display_name?: string
  message?: string
}

export interface RegisterRequest {
  username: string
  email: string
  password: string
}

export interface RegisterResponse {
  success: boolean
  message?: string
  data?: {
    user: {
      id: string
      username: string
      email: string
    }
    tenant: {
      id: string
      name: string
      api_key: string
    }
  }
}

export async function login(data: LoginRequest): Promise<LoginResponse> {
  try {
    const response = await post<LoginResponse>('/auth/login', data)
    return response
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Login failed',
    }
  }
}

export async function getOIDCAuthorizationURL(redirectURI: string): Promise<OIDCAuthURLResponse> {
  try {
    const response = await get<OIDCAuthURLResponse>(`/auth/oidc/url?redirect_uri=${encodeURIComponent(redirectURI)}`)
    return response
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to get OIDC URL',
    }
  }
}

export async function getOIDCConfig(): Promise<OIDCConfigResponse> {
  try {
    const response = await get<OIDCConfigResponse>('/auth/oidc/config')
    return response
  } catch (error: any) {
    return {
      success: false,
      enabled: false,
      message: error.message || 'Failed to get OIDC config',
    }
  }
}

export async function autoSetup(): Promise<LoginResponse> {
  try {
    const response = await post<LoginResponse>('/auth/auto-setup', {})
    return response
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Auto-setup unavailable',
    }
  }
}

export async function getCurrentUser(): Promise<{ success: boolean; data?: { user: UserInfo; tenant?: TenantInfo | null }; message?: string }> {
  try {
    const response = await get<{ success: boolean; data?: { user: UserInfo; tenant?: TenantInfo | null }; message?: string }>('/auth/me')
    return response
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to get current user',
    }
  }
}

export async function refreshToken(refreshTokenValue: string): Promise<{ success: boolean; data?: { token: string; refreshToken: string }; message?: string }> {
  try {
    const response = await post<any>('/auth/refresh', { refreshToken: refreshTokenValue })
    if (response && response.success) {
      return {
        success: true,
        data: {
          token: response.access_token || response.token,
          refreshToken: response.refresh_token,
        },
      }
    }
    return {
      success: false,
      message: response?.message || 'Failed to refresh token',
    }
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to refresh token',
    }
  }
}

export async function logout(): Promise<{ success: boolean; message?: string }> {
  try {
    await post('/auth/logout', {})
    return { success: true }
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Logout failed',
    }
  }
}

export async function register(data: RegisterRequest): Promise<RegisterResponse> {
  try {
    const response = await post<RegisterResponse>('/auth/register', data)
    return response
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Register failed',
    }
  }
}
