import { get, post, put, del } from '@/lib/api'

export interface Organization {
  id: string
  name: string
  description: string
  avatar?: string
  owner_id: string
  invite_code?: string
  invite_code_expires_at?: string | null
  invite_code_validity_days?: number
  require_approval?: boolean
  searchable?: boolean
  member_limit?: number
  member_count?: number
  share_count?: number
  agent_share_count?: number
  pending_join_request_count?: number
  is_owner?: boolean
  my_role?: string
  has_pending_upgrade?: boolean
  created_at: string
  updated_at: string
}

export interface OrganizationPreview {
  id: string
  name: string
  description: string
  avatar?: string
  member_count: number
  share_count: number
  agent_share_count?: number
  is_already_member: boolean
  require_approval: boolean
  created_at: string
}

export interface SearchableOrganizationItem {
  id: string
  name: string
  description: string
  avatar?: string
  member_count: number
  member_limit: number
  share_count: number
  agent_share_count?: number
  is_already_member: boolean
  require_approval: boolean
}

export interface CreateOrganizationData {
  name: string
  description?: string
  avatar?: string
  invite_code_validity_days?: number
  member_limit?: number
}

export interface UpdateOrganizationData {
  name?: string
  description?: string
  avatar?: string
  require_approval?: boolean
  searchable?: boolean
  invite_code_validity_days?: number
  member_limit?: number
}

export interface ListOrganizationsResponse {
  success: boolean
  data?: {
    organizations: Organization[]
    total: number
  }
  message?: string
}

export async function listMyOrganizations(): Promise<ListOrganizationsResponse> {
  try {
    const response = await get<ListOrganizationsResponse>('/organizations')
    return response
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to list organizations',
    }
  }
}

export async function getOrganization(id: string): Promise<{ success: boolean; data?: Organization; message?: string }> {
  try {
    const response = await get<any>(`/organizations/${id}`)
    return response
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to get organization',
    }
  }
}

export async function createOrganization(data: CreateOrganizationData): Promise<{ success: boolean; data?: Organization; message?: string }> {
  try {
    const response = await post<any>('/organizations', data)
    return response
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to create organization',
    }
  }
}

export async function updateOrganization(id: string, data: UpdateOrganizationData): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await put<{ success: boolean; message?: string }>(`/organizations/${id}`, data)
    return response
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to update organization',
    }
  }
}

export async function deleteOrganization(id: string): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await del<{ success: boolean; message?: string }>(`/organizations/${id}`)
    return response
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to delete organization',
    }
  }
}

export async function joinOrganization(inviteCode: string): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await post<{ success: boolean; message?: string }>('/organizations/join', { invite_code: inviteCode })
    return response
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to join organization',
    }
  }
}

export async function previewOrganization(inviteCode: string): Promise<{ success: boolean; data?: OrganizationPreview; message?: string }> {
  try {
    const response = await get<any>(`/organizations/preview/${inviteCode}`)
    return response
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to preview organization',
    }
  }
}

export async function searchSearchableOrganizations(
  q: string = '',
  limit: number = 20
): Promise<{ success: boolean; data?: SearchableOrganizationItem[]; total?: number; message?: string }> {
  try {
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    params.set('limit', String(limit))
    const response = await get<any>(`/organizations/search?${params.toString()}`)
    return {
      success: response.success,
      data: response.data?.data || response.data || [],
      total: response.total,
      message: response.message,
    }
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to search organizations',
    }
  }
}

export async function joinOrganizationById(
  organizationId: string,
  message?: string,
  role?: 'admin' | 'editor' | 'viewer'
): Promise<{ success: boolean; message?: string }> {
  try {
    const body: { organization_id: string; message?: string; role?: string } = { organization_id: organizationId }
    if (message) body.message = message
    if (role) body.role = role
    const response = await post<{ success: boolean; message?: string }>('/organizations/join-by-id', body)
    return response
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to join organization',
    }
  }
}

export async function submitJoinRequest(
  inviteCode: string,
  message?: string,
  role?: 'admin' | 'editor' | 'viewer'
): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await post<{ success: boolean; message?: string }>('/organizations/join-request', {
      invite_code: inviteCode,
      message,
      role,
    })
    return response
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to submit join request',
    }
  }
}

export async function leaveOrganization(id: string): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await post<{ success: boolean; message?: string }>(`/organizations/${id}/leave`, {})
    return response
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to leave organization',
    }
  }
}

export async function generateInviteCode(id: string): Promise<{ success: boolean; data?: { invite_code: string }; message?: string }> {
  try {
    const response = await post<any>(`/organizations/${id}/invite-code`, {})
    return response
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to generate invite code',
    }
  }
}

// Shared resources APIs
export async function fetchSharedKnowledgeBases(): Promise<any[]> {
  try {
    const response = await get<any>('/organizations/shared-knowledge-bases')
    if (response.success && response.data) {
      return response.data
    }
    return []
  } catch {
    return []
  }
}

export async function fetchSharedAgents(): Promise<any[]> {
  try {
    const response = await get<any>('/organizations/shared-agents')
    if (response.success && response.data) {
      return response.data
    }
    return []
  } catch {
    return []
  }
}

// Knowledge Base Share APIs
export interface KnowledgeBaseShare {
  id: string
  organization_id: string
  organization_name: string
  organization_avatar?: string
  permission: 'viewer' | 'editor'
  shared_at: string
  shared_by_user_id: string
  shared_by_username?: string
}

export interface ListKBSharesResponse {
  shares: KnowledgeBaseShare[]
}

export async function listKBShares(kbId: string): Promise<{ success: boolean; data?: ListKBSharesResponse; message?: string }> {
  try {
    const response = await get<ListKBSharesResponse>(`/knowledge-bases/${kbId}/shares`)
    return response
  } catch (error: any) {
    return { success: false, message: error.message || 'Failed to list shares' }
  }
}

export async function shareKnowledgeBase(
  kbId: string,
  orgId: string,
  permission: 'viewer' | 'editor'
): Promise<{ success: boolean; data?: KnowledgeBaseShare; message?: string }> {
  try {
    const response = await post<KnowledgeBaseShare>(`/knowledge-bases/${kbId}/shares`, {
      organization_id: orgId,
      permission,
    })
    return response
  } catch (error: any) {
    return { success: false, message: error.message || 'Failed to share knowledge base' }
  }
}

export async function removeShare(
  kbId: string,
  shareId: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await del<void>(`/knowledge-bases/${kbId}/shares/${shareId}`)
    return response
  } catch (error: any) {
    return { success: false, message: error.message || 'Failed to remove share' }
  }
}