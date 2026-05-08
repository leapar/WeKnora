import { get, post, put, del } from '@/lib/api'

// ===== Types =====

export interface VectorStoreEntity {
  id?: string
  name: string
  engine_type: string
  connection_config: Record<string, any>
  index_config: Record<string, any>
  source: 'env' | 'user'
  readonly: boolean
  tenant_id?: number
  created_at?: string
  updated_at?: string
}

export interface VectorStoreTypeInfo {
  type: string
  display_name: string
  connection_fields: FieldSchema[]
  index_fields: FieldSchema[]
}

export interface FieldSchema {
  name: string
  type: 'string' | 'number' | 'boolean'
  required: boolean
  sensitive?: boolean
  description?: string
  default?: any
}

export interface TestResult {
  success: boolean
  error?: string
}

// ===== API Functions =====

export async function listVectorStoreTypes(): Promise<VectorStoreTypeInfo[]> {
  const res = await get<{ success: boolean; data: VectorStoreTypeInfo[] }>('/vector-stores/types')
  return res.success && res.data ? res.data : []
}

export async function listVectorStores(): Promise<VectorStoreEntity[]> {
  const res = await get<{ success: boolean; data: VectorStoreEntity[] }>('/vector-stores')
  return res.success && res.data ? res.data : []
}

export async function createVectorStore(data: Partial<VectorStoreEntity>) {
  return post('/vector-stores', data)
}

export async function updateVectorStore(id: string, data: Partial<VectorStoreEntity>) {
  return put(`/vector-stores/${id}`, data)
}

export async function deleteVectorStore(id: string) {
  return del(`/vector-stores/${id}`)
}

export async function testVectorStoreRaw(data: {
  engine_type: string
  connection_config: any
}): Promise<TestResult> {
  return post('/vector-stores/test', data)
}

export async function testVectorStoreById(id: string): Promise<TestResult> {
  return post(`/vector-stores/${id}/test`, {})
}