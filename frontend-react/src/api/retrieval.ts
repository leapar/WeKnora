import { get, put } from '@/lib/api'

export interface RetrievalConfig {
  embedding_top_k: number
  vector_threshold: number
  keyword_threshold: number
  rerank_top_k: number
  rerank_threshold: number
  rerank_model_id: string
}

export async function getTenantRetrievalConfig(): Promise<{ success: boolean; data?: RetrievalConfig }> {
  try {
    const response = await get<RetrievalConfig>('/tenants/kv/retrieval-config')
    return { success: true, data: response }
  } catch (error: any) {
    return { success: false, message: error.message }
  }
}

export async function updateTenantRetrievalConfig(config: RetrievalConfig): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await put<{ success: boolean; message?: string }>('/tenants/kv/retrieval-config', config)
    return response
  } catch (error: any) {
    return { success: false, message: error.message }
  }
}
