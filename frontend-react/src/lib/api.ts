import axios, { type AxiosInstance, type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios'
import { generateRandomString } from './utils'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1'

export const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('weknora_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    const selectedTenantId = localStorage.getItem('weknora_selected_tenant_id')
    if (selectedTenantId) {
      config.headers['X-Tenant-ID'] = selectedTenantId
    }

    const lang = localStorage.getItem('i18nextLng') || navigator.language || 'zh-CN'
    config.headers['Accept-Language'] = lang.split('-')[0]

    config.headers['X-Request-ID'] = generateRandomString(12)

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response.data
  },
  async (error) => {
    const originalRequest = error.config

    // Handle 401 - Token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      const refreshToken = localStorage.getItem('weknora_refresh_token')
      if (refreshToken) {
        try {
          const response = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken })
          if (response.data?.success) {
            const newToken = response.data.access_token || response.data.token
            const newRefreshToken = response.data.refresh_token

            if (newToken) {
              localStorage.setItem('weknora_token', newToken)
            }
            if (newRefreshToken) {
              localStorage.setItem('weknora_refresh_token', newRefreshToken)
            }

            originalRequest.headers.Authorization = `Bearer ${newToken}`
            return api(originalRequest)
          }
        } catch (refreshError) {
          // Refresh failed, clear tokens and redirect to login
          localStorage.removeItem('weknora_token')
          localStorage.removeItem('weknora_refresh_token')
          window.location.href = '/login'
          return Promise.reject(refreshError)
        }
      } else {
        window.location.href = '/login'
      }
    }

    return Promise.reject(error)
  }
)

// Helper functions
export function get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
  return api.get(url, config)
}

export function post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
  return api.post(url, data, config)
}

export function put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
  return api.put(url, data, config)
}

export function del<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
  return api.delete(url, { data, ...config })
}

export function postUpload<T = any>(
  url: string,
  data: FormData,
  onUploadProgress?: (progressEvent: any) => void
): Promise<T> {
  return api.post(url, data, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress,
  })
}
