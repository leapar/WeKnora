import { get, post, put, del, postUpload } from '@/lib/api'
import type { ChatMessage, ChatSession } from '@/types'

// Message search types
export interface MessageSearchRequest {
  query: string
  mode?: 'keyword' | 'vector' | 'hybrid'
  limit?: number
  session_ids?: string[]
}

export interface MessageSearchGroupItem {
  request_id: string
  session_id: string
  session_title?: string
  query_content?: string
  answer_content?: string
  score?: number
}

export interface MessageSearchResult {
  items: MessageSearchGroupItem[]
  total: number
}

export interface GetSessionsResponse {
  success: boolean
  data?: {
    sessions: ChatSession[]
    total: number
  }
  message?: string
}

export interface GetSessionResponse {
  success: boolean
  data?: {
    session: ChatSession
    messages: ChatMessage[]
  }
  message?: string
}

export async function getSessionsList(
  offset = 0,
  limit = 20,
  keyword?: string
): Promise<GetSessionsResponse> {
  try {
    const params = new URLSearchParams()
    params.set('offset', String(offset))
    params.set('limit', String(limit))
    if (keyword) {
      params.set('keyword', keyword)
    }
    const response = await get<GetSessionsResponse>(`/chat/sessions?${params.toString()}`)
    return response
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to get sessions',
    }
  }
}

export async function getSession(
  sessionId: string,
  offset = 0,
  limit = 50
): Promise<GetSessionResponse> {
  try {
    const params = new URLSearchParams()
    params.set('offset', String(offset))
    params.set('limit', String(limit))
    const response = await get<GetSessionResponse>(`/chat/sessions/${sessionId}?${params.toString()}`)
    return response
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to get session',
    }
  }
}

export async function createSession(
  title?: string,
  agentId?: string,
  knowledgeBaseIds?: string[]
): Promise<{ success: boolean; data?: { id: string; session: ChatSession }; message?: string }> {
  try {
    const response = await post<any>('/chat/sessions', {
      title,
      agent_id: agentId,
      knowledge_base_ids: knowledgeBaseIds,
    })
    return response
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to create session',
    }
  }
}

export async function delSession(
  sessionId: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await del<{ success: boolean; message?: string }>(`/chat/sessions/${sessionId}`)
    return response
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to delete session',
    }
  }
}

export async function updateSessionTitle(
  sessionId: string,
  title: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await put<{ success: boolean; message?: string }>(`/chat/sessions/${sessionId}`, { title })
    return response
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to update session',
    }
  }
}

export async function clearSessions(): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await del<{ success: boolean; message?: string }>('/chat/sessions')
    return response
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to clear sessions',
    }
  }
}

export async function getMessages(
  sessionId: string,
  offset = 0,
  limit = 50
): Promise<{ success: boolean; data?: { messages: ChatMessage[]; total: number }; message?: string }> {
  try {
    const params = new URLSearchParams()
    params.set('offset', String(offset))
    params.set('limit', String(limit))
    const response = await get<any>(`/chat/sessions/${sessionId}/messages?${params.toString()}`)
    return response
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to get messages',
    }
  }
}

export async function deleteMessage(
  sessionId: string,
  messageId: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await del<{ success: boolean; message?: string }>(`/chat/sessions/${sessionId}/messages/${messageId}`)
    return response
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to delete message',
    }
  }
}

// Search messages across all sessions
export async function searchMessages(
  data: MessageSearchRequest
): Promise<{ success: boolean; data?: MessageSearchResult; message?: string }> {
  try {
    const response = await post<{ success: boolean; data?: MessageSearchResult; message?: string }>(
      '/messages/search',
      data
    )
    return response
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to search messages',
    }
  }
}

export async function uploadFile(
  sessionId: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<{ success: boolean; data?: { file_id: string; url: string }; message?: string }> {
  try {
    const formData = new FormData()
    formData.append('file', file)
    const response = await postUpload<any>(`/chat/sessions/${sessionId}/files`, formData, (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total)
        onProgress(percent)
      }
    })
    return response
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to upload file',
    }
  }
}
