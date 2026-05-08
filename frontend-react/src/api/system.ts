import { api } from '@/lib/api'

export interface SystemInfo {
  version: string
  edition?: string
  commit_id?: string
  build_time?: string
  go_version?: string
  keyword_index_engine?: string
  vector_store_engine?: string
  graph_database_engine?: string
  minio_enabled?: boolean
  db_version?: string
}

export interface ParserEngineInfo {
  Name: string
  Description: string
  FileTypes: string[]
  Available?: boolean
  UnavailableReason?: string
}

export interface ParserEngineConfig {
  docreader_addr?: string
  docreader_transport?: string
  mineru_endpoint?: string
  mineru_api_key?: string
  mineru_model?: string
  mineru_enable_formula?: boolean | null
  mineru_enable_table?: boolean | null
  mineru_enable_ocr?: boolean | null
  mineru_language?: string
  mineru_cloud_model?: string
  mineru_cloud_enable_formula?: boolean | null
  mineru_cloud_enable_table?: boolean | null
  mineru_cloud_enable_ocr?: boolean | null
  mineru_cloud_language?: string
}

export interface ParserEnginesResponse {
  data: ParserEngineInfo[]
  docreader_addr?: string
  docreader_transport?: string
  connected?: boolean
}

export async function getParserEngines(): Promise<ParserEnginesResponse> {
  const resp = await api.get('/system/parser-engines')
  return resp.data
}

export async function getParserEngineConfig(): Promise<{ data: ParserEngineConfig }> {
  const resp = await api.get('/tenants/kv/parser-engine-config')
  return resp.data
}

export async function updateParserEngineConfig(config: ParserEngineConfig): Promise<{ data: ParserEngineConfig }> {
  const resp = await api.put('/tenants/kv/parser-engine-config', config)
  return resp.data
}

export async function checkParserEngines(config: ParserEngineConfig): Promise<ParserEnginesResponse> {
  const resp = await api.post('/system/parser-engines/check', config)
  return resp.data
}

export async function getSystemInfo(): Promise<SystemInfo> {
  const resp = await api.get('/system/info')
  return resp.data.data || resp.data
}

// Storage Engine types
export interface StorageEngineLocalConfig {
  path_prefix: string
}

export interface StorageEngineMinioConfig {
  mode: 'docker' | 'remote'
  endpoint: string
  access_key_id: string
  secret_access_key: string
  bucket_name: string
  use_ssl: boolean
  path_prefix: string
}

export interface StorageEngineCosConfig {
  secret_id: string
  secret_key: string
  region: string
  bucket_name: string
  app_id: string
  path_prefix: string
}

export interface StorageEngineTosConfig {
  endpoint: string
  region: string
  access_key: string
  secret_key: string
  bucket_name: string
  path_prefix: string
}

export interface StorageEngineS3Config {
  endpoint: string
  region: string
  access_key: string
  secret_key: string
  bucket_name: string
  path_prefix: string
}

export interface StorageEngineOssConfig {
  endpoint: string
  region: string
  access_key: string
  secret_key: string
  bucket_name: string
  path_prefix: string
  use_temp_bucket: boolean
  temp_bucket_name: string
  temp_region: string
}

export interface StorageEngineKs3Config {
  endpoint: string
  region: string
  access_key: string
  secret_key: string
  bucket_name: string
  path_prefix: string
}

export interface StorageEngineConfig {
  default_provider: string
  local: StorageEngineLocalConfig
  minio: StorageEngineMinioConfig
  cos: StorageEngineCosConfig
  tos: StorageEngineTosConfig
  s3: StorageEngineS3Config
  oss: StorageEngineOssConfig
  ks3: StorageEngineKs3Config
}

export interface StorageEngineStatus {
  engines: Array<{
    name: string
    allowed: boolean
    available: boolean
  }>
  allowed_providers?: string[]
  minio_env_available?: boolean
}

export interface CheckStorageEngineResult {
  ok: boolean
  message: string
  bucket_created?: boolean
}

export async function getStorageEngineConfig(): Promise<{ data: StorageEngineConfig }> {
  const resp = await api.get('/tenants/kv/storage-engine-config')
  return resp.data
}

export async function updateStorageEngineConfig(config: StorageEngineConfig): Promise<{ data: StorageEngineConfig }> {
  const resp = await api.put('/tenants/kv/storage-engine-config', config)
  return resp.data
}

export async function getStorageEngineStatus(): Promise<StorageEngineStatus> {
  const resp = await api.get('/system/storage-engines/status')
  return resp.data.data || resp.data
}

export async function checkStorageEngine(params: {
  provider: string
  minio?: StorageEngineMinioConfig
  cos?: StorageEngineCosConfig
  tos?: StorageEngineTosConfig
  s3?: StorageEngineS3Config
  oss?: StorageEngineOssConfig
  ks3?: StorageEngineKs3Config
}): Promise<{ data: CheckStorageEngineResult }> {
  const resp = await api.post('/system/storage-engines/check', params)
  return resp.data
}
