import { get, post, put, del } from '@/lib/api'
import type { Agent } from '@/types'

export const BUILTIN_QUICK_ANSWER_ID = 'builtin-quick-answer'
export const BUILTIN_SMART_REASONING_ID = 'builtin-smart-reasoning'

export interface ListAgentsResponse {
  success: boolean
  data?: {
    agents: Agent[]
    total: number
  }
  message?: string
}

export interface GetAgentResponse {
  success: boolean
  data?: Agent
  message?: string
}

export interface CreateAgentData {
  name: string
  description?: string
  type?: 'assistant' | 'agent'
  prompt?: string
  model_id?: string
  temperature?: number
  tools?: string[]
  allowed_tools?: string[]
}

export interface UpdateAgentData extends Partial<CreateAgentData> {
  status?: string
}

export async function listAgents(
  offset = 0,
  limit = 20,
  keyword?: string
): Promise<ListAgentsResponse> {
  try {
    const params = new URLSearchParams()
    params.set('offset', String(offset))
    params.set('limit', String(limit))
    if (keyword) params.set('keyword', keyword)
    const response = await get<ListAgentsResponse>(`/agents?${params.toString()}`)
    return response
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to list agents',
    }
  }
}

export async function getAgentById(id: string): Promise<GetAgentResponse> {
  try {
    const response = await get<GetAgentResponse>(`/agents/${id}`)
    return response
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to get agent',
    }
  }
}

export async function createAgent(data: CreateAgentData): Promise<{ success: boolean; data?: Agent; message?: string }> {
  try {
    const response = await post<any>('/agents', data)
    return response
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to create agent',
    }
  }
}

export async function updateAgent(
  id: string,
  data: UpdateAgentData
): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await put<{ success: boolean; message?: string }>(`/agents/${id}`, data)
    return response
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to update agent',
    }
  }
}

export async function deleteAgent(id: string): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await del<{ success: boolean; message?: string }>(`/agents/${id}`)
    return response
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to delete agent',
    }
  }
}

export async function getAgentTools(): Promise<{ success: boolean; data?: string[]; message?: string }> {
  try {
    const response = await get<any>('/agents/tools')
    return response
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to get agent tools',
    }
  }
}

export async function copyAgent(id: string): Promise<{ success: boolean; data?: Agent; message?: string }> {
  try {
    const response = await post<any>(`/agents/${id}/copy`, {})
    return response
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to copy agent',
    }
  }
}

export async function getSuggestedQuestions(
  agentId: string,
  options?: {
    knowledge_base_ids?: string[]
    knowledge_ids?: string[]
    limit?: number
  }
): Promise<{ success: boolean; data?: { questions: { question: string; source: string }[] }; message?: string }> {
  try {
    const params = new URLSearchParams()
    if (options?.knowledge_base_ids?.length) {
      params.set('knowledge_base_ids', options.knowledge_base_ids.join(','))
    }
    if (options?.knowledge_ids?.length) {
      params.set('knowledge_ids', options.knowledge_ids.join(','))
    }
    if (options?.limit) {
      params.set('limit', String(options.limit))
    }
    const url = params.toString() ? `/agents/${agentId}/suggested-questions?${params.toString()}` : `/agents/${agentId}/suggested-questions`
    const response = await get<any>(url)
    return response
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to get suggested questions',
    }
  }
}
