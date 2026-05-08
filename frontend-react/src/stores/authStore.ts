import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserInfo, TenantInfo, KnowledgeBaseInfo } from '@/types'

interface AuthState {
  user: UserInfo | null
  tenant: TenantInfo | null
  token: string
  refreshToken: string
  knowledgeBases: KnowledgeBaseInfo[]
  currentKnowledgeBase: KnowledgeBaseInfo | null
  selectedTenantId: number | null
  selectedTenantName: string | null
  allTenants: any[]
  isLiteMode: boolean

  // Computed
  isLoggedIn: () => boolean
  hasValidTenant: () => boolean
  currentTenantId: () => string
  currentUserId: () => string
  effectiveTenantId: () => number | null

  // Actions
  setUser: (user: UserInfo | null) => void
  setTenant: (tenant: TenantInfo | null) => void
  setToken: (token: string) => void
  setRefreshToken: (refreshToken: string) => void
  setKnowledgeBases: (kbList: KnowledgeBaseInfo[]) => void
  setCurrentKnowledgeBase: (kb: KnowledgeBaseInfo | null) => void
  setSelectedTenant: (tenantId: number | null, tenantName?: string | null) => void
  setAllTenants: (tenants: any[]) => void
  setLiteMode: (value: boolean) => void
  logout: () => void
  initFromStorage: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      tenant: null,
      token: '',
      refreshToken: '',
      knowledgeBases: [],
      currentKnowledgeBase: null,
      selectedTenantId: null,
      selectedTenantName: null,
      allTenants: [],
      isLiteMode: false,

      isLoggedIn: () => {
        const state = get()
        return !!state.token && !!state.user
      },

      hasValidTenant: () => {
        const state = get()
        return !!state.tenant && !!state.tenant.api_key
      },

      currentTenantId: () => {
        const state = get()
        return state.tenant?.id || ''
      },

      currentUserId: () => {
        const state = get()
        return state.user?.id || ''
      },

      effectiveTenantId: () => {
        const state = get()
        return state.selectedTenantId || (state.tenant?.id ? Number(state.tenant.id) : null)
      },

      setUser: (user) => {
        set({ user })
        if (user) {
          localStorage.setItem('weknora_user', JSON.stringify(user))
        } else {
          localStorage.removeItem('weknora_user')
        }
      },

      setTenant: (tenant) => {
        set({ tenant })
        if (tenant) {
          localStorage.setItem('weknora_tenant', JSON.stringify(tenant))
        } else {
          localStorage.removeItem('weknora_tenant')
        }
      },

      setToken: (token) => {
        set({ token })
        if (token) {
          localStorage.setItem('weknora_token', token)
        } else {
          localStorage.removeItem('weknora_token')
        }
      },

      setRefreshToken: (refreshToken) => {
        set({ refreshToken })
        if (refreshToken) {
          localStorage.setItem('weknora_refresh_token', refreshToken)
        } else {
          localStorage.removeItem('weknora_refresh_token')
        }
      },

      setKnowledgeBases: (kbList) => {
        const list = Array.isArray(kbList) ? kbList : []
        set({ knowledgeBases: list })
        localStorage.setItem('weknora_knowledge_bases', JSON.stringify(list))
      },

      setCurrentKnowledgeBase: (kb) => {
        set({ currentKnowledgeBase: kb })
        if (kb) {
          localStorage.setItem('weknora_current_kb', JSON.stringify(kb))
        } else {
          localStorage.removeItem('weknora_current_kb')
        }
      },

      setSelectedTenant: (tenantId, tenantName = null) => {
        set({ selectedTenantId: tenantId, selectedTenantName: tenantName || null })
        if (tenantId !== null) {
          localStorage.setItem('weknora_selected_tenant_id', String(tenantId))
          if (tenantName) {
            localStorage.setItem('weknora_selected_tenant_name', tenantName)
          }
        } else {
          localStorage.removeItem('weknora_selected_tenant_id')
          localStorage.removeItem('weknora_selected_tenant_name')
        }
      },

      setAllTenants: (tenants) => {
        set({ allTenants: tenants })
      },

      setLiteMode: (value) => {
        set({ isLiteMode: value })
        if (value) {
          localStorage.setItem('weknora_lite_mode', 'true')
        } else {
          localStorage.removeItem('weknora_lite_mode')
        }
      },

      logout: () => {
        set({
          user: null,
          tenant: null,
          token: '',
          refreshToken: '',
          knowledgeBases: [],
          currentKnowledgeBase: null,
          selectedTenantId: null,
          selectedTenantName: null,
          allTenants: [],
          isLiteMode: false,
        })

        localStorage.removeItem('weknora_user')
        localStorage.removeItem('weknora_tenant')
        localStorage.removeItem('weknora_token')
        localStorage.removeItem('weknora_refresh_token')
        localStorage.removeItem('weknora_knowledge_bases')
        localStorage.removeItem('weknora_current_kb')
        localStorage.removeItem('weknora_selected_tenant_id')
        localStorage.removeItem('weknora_selected_tenant_name')
        localStorage.removeItem('weknora_lite_mode')

        try {
          sessionStorage.removeItem('weknora_lite_last_path')
        } catch {
          // ignore
        }
      },

      initFromStorage: () => {
        const storedUser = localStorage.getItem('weknora_user')
        const storedTenant = localStorage.getItem('weknora_tenant')
        const storedToken = localStorage.getItem('weknora_token')
        const storedRefreshToken = localStorage.getItem('weknora_refresh_token')
        const storedKnowledgeBases = localStorage.getItem('weknora_knowledge_bases')
        const storedCurrentKb = localStorage.getItem('weknora_current_kb')
        const storedSelectedTenantId = localStorage.getItem('weknora_selected_tenant_id')
        const storedSelectedTenantName = localStorage.getItem('weknora_selected_tenant_name')

        if (storedUser) {
          try {
            set({ user: JSON.parse(storedUser) })
          } catch {
            // ignore parse error
          }
        }

        if (storedTenant) {
          try {
            set({ tenant: JSON.parse(storedTenant) })
          } catch {
            // ignore parse error
          }
        }

        if (storedToken) set({ token: storedToken })
        if (storedRefreshToken) set({ refreshToken: storedRefreshToken })

        if (storedKnowledgeBases) {
          try {
            const parsed = JSON.parse(storedKnowledgeBases)
            set({ knowledgeBases: Array.isArray(parsed) ? parsed : [] })
          } catch {
            set({ knowledgeBases: [] })
          }
        }

        if (storedCurrentKb) {
          try {
            set({ currentKnowledgeBase: JSON.parse(storedCurrentKb) })
          } catch {
            // ignore parse error
          }
        }

        if (storedSelectedTenantId) {
          try {
            set({
              selectedTenantId: Number(storedSelectedTenantId),
              selectedTenantName: storedSelectedTenantName || null,
            })
          } catch {
            set({ selectedTenantId: null, selectedTenantName: null })
          }
        }

        const isLiteMode = localStorage.getItem('weknora_lite_mode') === 'true'
        set({ isLiteMode })
      },
    }),
    {
      name: 'weknora-auth',
      partialize: (state) => ({
        user: state.user,
        tenant: state.tenant,
        token: state.token,
        refreshToken: state.refreshToken,
        knowledgeBases: state.knowledgeBases,
        currentKnowledgeBase: state.currentKnowledgeBase,
        selectedTenantId: state.selectedTenantId,
        selectedTenantName: state.selectedTenantName,
        isLiteMode: state.isLiteMode,
      }),
    }
  )
)

// Initialize from storage on module load
useAuthStore.getState().initFromStorage()
