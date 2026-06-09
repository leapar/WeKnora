import { get, post, put, del } from '@/lib/api'

export interface ModelConfig {
  id?: string
  tenant_id?: number
  name: string
  type: 'KnowledgeQA' | 'Embedding' | 'Rerank' | 'VLLM' | 'ASR'
  source: 'local' | 'remote'
  description?: string
  parameters: {
    base_url?: string
    api_key?: string
    provider?: string
    embedding_parameters?: {
      dimension?: number
      truncate_prompt_tokens?: number
    }
    interface_type?: 'ollama' | 'openai'
    parameter_size?: string
    extra_config?: Record<string, string>
    custom_headers?: Record<string, string>
    supports_vision?: boolean
  }
  is_default?: boolean
  is_builtin?: boolean
  status?: string
  created_at?: string
  updated_at?: string
  deleted_at?: string | null
}

export async function listModels(): Promise<ModelConfig[]> {
  try {
    const response = await get<{ success: boolean; data: ModelConfig[] }>('/models')
    if (response.success && response.data) {
      return response.data
    }
    return []
  } catch {
    return []
  }
}

export async function createModel(data: ModelConfig): Promise<{ success: boolean; data?: ModelConfig; message?: string }> {
  try {
    const response = await post<ModelConfig>('/models', data)
    return response
  } catch (error: any) {
    return { success: false, message: error.message || 'Failed to create model' }
  }
}

export async function updateModel(id: string, data: Partial<ModelConfig>): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await put<{ success: boolean; message?: string }>(`/models/${id}`, data)
    return response
  } catch (error: any) {
    return { success: false, message: error.message || 'Failed to update model' }
  }
}

export async function deleteModel(id: string): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await del<void>(`/models/${id}`)
    return response
  } catch (error: any) {
    return { success: false, message: error.message || 'Failed to delete model' }
  }
}

export type { ModelConfig as ModelConfigType }
