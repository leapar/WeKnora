import { get, post, put, del, postUpload } from '@/lib/api'
import type { KnowledgeBase, Document, ChunkingConfig } from '@/types'

export interface ListKnowledgeBasesResponse {
  success: boolean
  data?: {
    knowledge_bases: KnowledgeBase[]
    total: number
  }
  message?: string
}

export interface GetKnowledgeBaseResponse {
  success: boolean
  data?: KnowledgeBase
  message?: string
}

export interface CreateKnowledgeBaseData {
  name: string
  description?: string
  type?: 'document' | 'faq'
  chunking_config?: ChunkingConfig
  embedding_model_id?: string
  summary_model_id?: string
}

export interface UpdateKnowledgeBaseData extends Partial<CreateKnowledgeBaseData> {
  status?: string
}

export async function listKnowledgeBases(params?: { agent_id?: string }): Promise<ListKnowledgeBasesResponse> {
  try {
    const searchParams = new URLSearchParams()
    if (params?.agent_id) {
      searchParams.set('agent_id', params.agent_id)
    }
    const url = searchParams.toString() ? `/knowledge-bases?${searchParams.toString()}` : '/knowledge-bases'
    const response = await get<ListKnowledgeBasesResponse>(url)
    return response
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to list knowledge bases',
    }
  }
}

export async function getKnowledgeBaseById(
  id: string,
  options?: { agent_id?: string }
): Promise<GetKnowledgeBaseResponse> {
  try {
    const searchParams = new URLSearchParams()
    if (options?.agent_id) {
      searchParams.set('agent_id', options.agent_id)
    }
    const url = searchParams.toString() ? `/knowledge-bases/${id}?${searchParams.toString()}` : `/knowledge-bases/${id}`
    const response = await get<GetKnowledgeBaseResponse>(url)
    return response
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to get knowledge base',
    }
  }
}

export async function createKnowledgeBase(
  data: CreateKnowledgeBaseData
): Promise<{ success: boolean; data?: KnowledgeBase; message?: string }> {
  try {
    const response = await post<any>('/knowledge-bases', data)
    return response
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to create knowledge base',
    }
  }
}

export async function updateKnowledgeBase(
  id: string,
  data: UpdateKnowledgeBaseData
): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await put<{ success: boolean; message?: string }>(`/knowledge-bases/${id}`, data)
    return response
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to update knowledge base',
    }
  }
}

export interface KnowledgeDetailResponse {
  id: string
  knowledge_base_id: string
  title?: string
  file_name?: string
  metadata?: any
  parse_status?: string
}

export async function getKnowledgeDetails(
  knowledgeId: string
): Promise<{ success: boolean; data?: KnowledgeDetailResponse; message?: string }> {
  try {
    const response = await get<{ success: boolean; data?: KnowledgeDetailResponse; message?: string }>(
      `/knowledge-bases/knowledge/${knowledgeId}`
    )
    return response
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to get knowledge details',
    }
  }
}

export async function updateManualKnowledge(
  knowledgeId: string,
  data: { title: string; content: string; status?: string }
): Promise<{ success: boolean; data?: { id: string }; message?: string }> {
  try {
    const response = await put<{ success: boolean; data?: { id: string }; message?: string }>(
      `/knowledge-bases/knowledge/${knowledgeId}`,
      data
    )
    return response
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to update manual knowledge',
    }
  }
}

export async function deleteKnowledgeBase(
  id: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await del<{ success: boolean; message?: string }>(`/knowledge-bases/${id}`)
    return response
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to delete knowledge base',
    }
  }
}

// Document APIs
export async function listDocuments(
  kbId: string,
  offset = 0,
  limit = 20,
  keyword?: string,
  status?: string
): Promise<{ success: boolean; data?: { documents: Document[]; total: number }; message?: string }> {
  try {
    const params = new URLSearchParams()
    params.set('offset', String(offset))
    params.set('limit', String(limit))
    if (keyword) params.set('keyword', keyword)
    if (status) params.set('status', status)
    const response = await get<any>(`/knowledge-bases/${kbId}/documents?${params.toString()}`)
    return response
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to list documents',
    }
  }
}

export async function uploadKnowledgeFile(
  kbId: string,
  data: { file: File; tag_id?: string; [key: string]: any },
  onProgress?: (progressEvent: any) => void
): Promise<{ success: boolean; data?: any; message?: string }> {
  try {
    const formData = new FormData()
    Object.keys(data).forEach((key) => {
      if (data[key] !== undefined) {
        formData.append(key, data[key])
      }
    })
    const response = await postUpload<any>(`/knowledge-bases/${kbId}/knowledge/file`, formData, onProgress)
    return response
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to upload file',
    }
  }
}

export async function createKnowledgeFromURL(
  kbId: string,
  data: { url: string; enable_multimodel?: boolean; tag_id?: string }
): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await post<{ success: boolean; message?: string }>(`/knowledge-bases/${kbId}/knowledge/url`, data)
    return response
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to create knowledge from URL',
    }
  }
}

export async function createManualKnowledge(
  kbId: string,
  data: { title: string; content: string; status?: string; tag_id?: string }
): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await post<{ success: boolean; message?: string }>(`/knowledge-bases/${kbId}/knowledge/manual`, data)
    return response
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to create manual knowledge',
    }
  }
}

export async function deleteDocument(
  kbId: string,
  documentId: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await del<{ success: boolean; message?: string }>(`/knowledge-bases/${kbId}/documents/${documentId}`)
    return response
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to delete document',
    }
  }
}

export async function reparseDocument(
  kbId: string,
  documentId: string,
  chunkingConfig?: ChunkingConfig
): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await post<{ success: boolean; message?: string }>(
      `/knowledge-bases/${kbId}/documents/${documentId}/reparse`,
      { chunking_config: chunkingConfig }
    )
    return response
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to reparse document',
    }
  }
}

// Search APIs
export async function searchKnowledge(
  keyword: string,
  offset = 0,
  limit = 20,
  fileTypes?: string[],
  options?: { agent_id?: string }
): Promise<{ success: boolean; data?: any; message?: string }> {
  try {
    const params = new URLSearchParams()
    params.set('keyword', keyword)
    params.set('offset', String(offset))
    params.set('limit', String(limit))
    if (fileTypes && fileTypes.length > 0) {
      params.set('file_types', fileTypes.join(','))
    }
    if (options?.agent_id) {
      params.set('agent_id', options.agent_id)
    }
    const response = await get<any>(`/knowledge/search?${params.toString()}`)
    return response
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to search knowledge',
    }
  }
}

export async function knowledgeSemanticSearch(data: {
  query: string
  knowledge_base_ids?: string[]
  knowledge_ids?: string[]
}): Promise<{ success: boolean; data?: any; message?: string }> {
  try {
    const response = await post<any>('/knowledge-search', data)
    return response
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to semantic search',
    }
  }
}

// FAQ Types
export interface FAQEntry {
  id: number
  chunk_id: string
  knowledge_id: string
  knowledge_base_id: string
  tag_id?: number
  is_enabled: boolean
  is_recommended: boolean
  standard_question: string
  similar_questions: string[]
  negative_questions: string[]
  answers: string[]
  updated_at: string
}

export interface FAQEntryPayload {
  standard_question: string
  similar_questions: string[]
  negative_questions: string[]
  answers: string[]
  tag_id?: number
  tag_name?: string
  is_enabled?: boolean
  is_recommended?: boolean
}

export interface KnowledgeTag {
  id: string
  seq_id: number
  name: string
  chunk_count?: number
}

// FAQ APIs
export async function listFAQEntries(
  kbId: string,
  params?: {
    page?: number
    page_size?: number
    tag_id?: number
    keyword?: string
  }
): Promise<{ success: boolean; data?: { data: FAQEntry[]; total: number }; message?: string }> {
  try {
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.set('page', String(params.page))
    if (params?.page_size) searchParams.set('page_size', String(params.page_size))
    if (params?.tag_id) searchParams.set('tag_id', String(params.tag_id))
    if (params?.keyword) searchParams.set('keyword', params.keyword)
    const url = `/knowledge-bases/${kbId}/faq-entries?${searchParams.toString()}`
    const response = await get<any>(url)
    return response
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to list FAQ entries',
    }
  }
}

export async function createFAQEntry(
  kbId: string,
  data: FAQEntryPayload
): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await post<{ success: boolean; message?: string }>(
      `/knowledge-bases/${kbId}/faq-entries`,
      data
    )
    return response
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to create FAQ entry',
    }
  }
}

export async function updateFAQEntry(
  kbId: string,
  entryId: number,
  data: FAQEntryPayload
): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await put<{ success: boolean; message?: string }>(
      `/knowledge-bases/${kbId}/faq-entries/${entryId}`,
      data
    )
    return response
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to update FAQ entry',
    }
  }
}

export async function deleteFAQEntries(
  kbId: string,
  entryIds: number[]
): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await del<{ success: boolean; message?: string }>(
      `/knowledge-bases/${kbId}/faq-entries?ids=${entryIds.join(',')}`
    )
    return response
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to delete FAQ entries',
    }
  }
}

export async function searchFAQEntries(
  kbId: string,
  data: {
    query_text: string
    vector_threshold?: number
    match_count?: number
  }
): Promise<{ success: boolean; data?: FAQEntry[]; message?: string }> {
  try {
    const response = await post<any>(`/knowledge-bases/${kbId}/faq-search`, data)
    return response
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to search FAQ entries',
    }
  }
}

export async function exportFAQEntries(kbId: string): Promise<Blob> {
  const response = await fetch(`/api/knowledge-bases/${kbId}/faq-export`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${localStorage.getItem('weknora_token') || ''}`,
    },
  })
  if (!response.ok) {
    throw new Error('Export failed')
  }
  return response.blob()
}

export async function upsertFAQEntries(
  kbId: string,
  data: {
    entries: FAQEntryPayload[]
    mode: 'append' | 'replace'
  }
): Promise<{ success: boolean; data?: { task_id: string }; message?: string }> {
  try {
    const response = await post<any>(`/knowledge-bases/${kbId}/faq-import`, data)
    return response
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to import FAQ entries',
    }
  }
}

export async function getFAQImportProgress(
  taskId: string
): Promise<{ success: boolean; data?: any; message?: string }> {
  try {
    const response = await get<any>(`/faq-import/${taskId}/progress`)
    return response
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to get import progress',
    }
  }
}

// Tag APIs
export async function listKnowledgeTags(
  kbId: string,
  params?: {
    page?: number
    page_size?: number
    keyword?: string
  }
): Promise<{ success: boolean; data?: { data: KnowledgeTag[]; total: number }; message?: string }> {
  try {
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.set('page', String(params.page))
    if (params?.page_size) searchParams.set('page_size', String(params.page_size))
    if (params?.keyword) searchParams.set('keyword', params.keyword)
    const url = `/knowledge-bases/${kbId}/tags?${searchParams.toString()}`
    const response = await get<any>(url)
    return response
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to list tags',
    }
  }
}

export async function createKnowledgeBaseTag(
  kbId: string,
  data: { name: string }
): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await post<{ success: boolean; message?: string }>(
      `/knowledge-bases/${kbId}/tags`,
      data
    )
    return response
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to create tag',
    }
  }
}

export async function updateKnowledgeBaseTag(
  kbId: string,
  tagId: string,
  data: { name: string }
): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await put<{ success: boolean; message?: string }>(
      `/knowledge-bases/${kbId}/tags/${tagId}`,
      data
    )
    return response
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to update tag',
    }
  }
}

export async function deleteKnowledgeBaseTag(
  kbId: string,
  tagSeqId: number,
  data: { force?: boolean }
): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await del<{ success: boolean; message?: string }>(
      `/knowledge-bases/${kbId}/tags/${tagSeqId}?force=${data.force || false}`
    )
    return response
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to delete tag',
    }
  }
}

export async function updateFAQEntryFieldsBatch(
  kbId: string,
  data: { by_id: Record<number, { is_enabled?: boolean; is_recommended?: boolean }> }
): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await put<{ success: boolean; message?: string }>(
      `/knowledge-bases/${kbId}/faq-entries/batch`,
      data
    )
    return response
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to batch update FAQ entries',
    }
  }
}

export async function updateFAQEntryTagBatch(
  kbId: string,
  data: { updates: Record<number, number | null> }
): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await put<{ success: boolean; message?: string }>(
      `/knowledge-bases/${kbId}/faq-entries/tag-batch`,
      data
    )
    return response
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to batch update FAQ entry tags',
    }
  }
}

// Sync Logs API
export interface SyncLog {
  id: string
  data_source_id: string
  status: 'running' | 'success' | 'partial' | 'failed' | 'canceled'
  started_at: string | null
  finished_at: string | null
  items_total: number
  items_created: number
  items_updated: number
  items_deleted: number
  items_skipped: number
  items_failed: number
  error_message: string
}

export async function getSyncLogs(
  dataSourceId: string,
  limit = 50,
  offset = 0
): Promise<SyncLog[]> {
  try {
    const response = await get<SyncLog[]>(`/datasource/${dataSourceId}/logs?limit=${limit}&offset=${offset}`)
    return response || []
  } catch {
    return []
  }
}
