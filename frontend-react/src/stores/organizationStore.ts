import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Organization } from '@/api/organization'
import { listMyOrganizations, createOrganization, updateOrganization, deleteOrganization, leaveOrganization, fetchSharedKnowledgeBases, fetchSharedAgents } from '@/api/organization'

interface OrganizationState {
  organizations: Organization[]
  loading: boolean
  error: string | null
  fetchOrganizations: () => Promise<void>
  create: (data: any) => Promise<boolean>
  update: (id: string, data: any) => Promise<boolean>
  remove: (id: string) => Promise<boolean>
  leave: (id: string) => Promise<boolean>
  fetchSharedKnowledgeBases: () => Promise<any[]>
  fetchSharedAgents: () => Promise<any[]>
}

export const useOrganizationStore = create<OrganizationState>()(
  persist(
    (set, get) => ({
      organizations: [],
      loading: false,
      error: null,

      fetchOrganizations: async () => {
        set({ loading: true, error: null })
        try {
          const response = await listMyOrganizations()
          if (response.success && response.data) {
            set({ organizations: response.data.organizations, loading: false })
          } else {
            set({ error: response.message || 'Failed to fetch organizations', loading: false })
          }
        } catch (error: any) {
          set({ error: error.message || 'Failed to fetch organizations', loading: false })
        }
      },

      create: async (data) => {
        try {
          const response = await createOrganization(data)
          if (response.success) {
            await get().fetchOrganizations()
            return true
          }
          set({ error: response.message || 'Failed to create organization' })
          return false
        } catch (error: any) {
          set({ error: error.message || 'Failed to create organization' })
          return false
        }
      },

      update: async (id, data) => {
        try {
          const response = await updateOrganization(id, data)
          if (response.success) {
            await get().fetchOrganizations()
            return true
          }
          set({ error: response.message || 'Failed to update organization' })
          return false
        } catch (error: any) {
          set({ error: error.message || 'Failed to update organization' })
          return false
        }
      },

      remove: async (id) => {
        try {
          const response = await deleteOrganization(id)
          if (response.success) {
            await get().fetchOrganizations()
            return true
          }
          set({ error: response.message || 'Failed to delete organization' })
          return false
        } catch (error: any) {
          set({ error: error.message || 'Failed to delete organization' })
          return false
        }
      },

      leave: async (id) => {
        try {
          const response = await leaveOrganization(id)
          if (response.success) {
            await get().fetchOrganizations()
            return true
          }
          set({ error: response.message || 'Failed to leave organization' })
          return false
        } catch (error: any) {
          set({ error: error.message || 'Failed to leave organization' })
          return false
        }
      },

      fetchSharedKnowledgeBases: async () => {
        return await fetchSharedKnowledgeBases()
      },

      fetchSharedAgents: async () => {
        return await fetchSharedAgents()
      },
    }),
    {
      name: 'weknora-organization',
      partialize: (state) => ({ organizations: state.organizations }),
    }
  )
)