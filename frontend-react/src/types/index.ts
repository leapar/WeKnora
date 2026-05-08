// User and Auth Types
export interface UserInfo {
  id: string
  username: string
  email: string
  avatar?: string
  tenant_id: string
  can_access_all_tenants?: boolean
  created_at: string
  updated_at: string
}

export interface TenantInfo {
  id: string
  name: string
  description?: string
  api_key: string
  status?: string
  business?: string
  owner_id: string
  storage_quota?: number
  storage_used?: number
  created_at: string
  updated_at: string
  knowledge_bases?: KnowledgeBaseInfo[]
}

export interface KnowledgeBaseInfo {
  id: string
  name: string
  description: string
  tenant_id: string
  created_at: string
  updated_at: string
  document_count?: number
  chunk_count?: number
}

export interface ModelInfo {
  id: string
  name: string
  type: string
  source: string
  description?: string
  is_default?: boolean
  created_at: string
  updated_at: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  success: boolean
  message?: string
  user?: UserInfo
  tenant?: TenantInfo
  token?: string
  refresh_token?: string
}

// Chat Types
export interface ChatMessage {
  id: string
  session_id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  created_at: string
  updated_at?: string
  reference_docs?: ReferenceDoc[]
  agent_thought?: string
  agent_tool_calls?: AgentToolCall[]
}

export interface ReferenceDoc {
  id: string
  knowledge_id: string
  knowledge_name: string
  document_id: string
  document_name: string
  content: string
  similarity: number
  source?: string
  icon?: string
  is_file?: boolean
}

export interface AgentToolCall {
  id: string
  tool_name: string
  tool_input: Record<string, any>
  tool_output?: string
  status: 'pending' | 'running' | 'completed' | 'failed'
}

export interface ChatSession {
  id: string
  title: string
  agent_id?: string
  agent_name?: string
  created_at: string
  updated_at: string
  message_count?: number
}

export interface StreamChunk {
  type: 'text' | 'error' | 'done' | 'agent' | 'tool_call' | 'tool_result' | 'reference' | 'thinking'
  content?: string
  data?: any
}

// Knowledge Base Types
export interface KnowledgeBase {
  id: string
  name: string
  description: string
  type: 'document' | 'faq'
  tenant_id: string
  embedding_model_id?: string
  summary_model_id?: string
  chunking_config?: ChunkingConfig
  created_at: string
  updated_at: string
  document_count?: number
  chunk_count?: number
}

export interface ChunkingConfig {
  chunk_size: number
  chunk_overlap: number
  delimiter?: string
  from_type?: string
}

export interface Document {
  id: string
  name: string
  size: number
  type: string
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'draft'
  progress?: number
  created_at: string
  updated_at: string
  chunk_count?: number
  tag_ids?: string[]
}

export interface KBDocument {
  id: string
  name: string
  size?: number | string
  type?: string
  file_type?: string
  status?: string
  parse_status?: 'pending' | 'processing' | 'completed' | 'failed'
  chunk_count?: number
  source?: string
  created_at?: string
  updated_at?: string
}

export interface Tag {
  id: string
  name: string
  color?: string
  type?: string
}

// Agent Types
export interface Agent {
  id: string
  name: string
  description?: string
  icon?: string
  type: 'assistant' | 'agent'
  prompt?: string
  model_id?: string
  temperature?: number
  tools?: string[]
  allowed_tools?: string[]
  source_tenant_id?: string
  source_tenant_name?: string
  is_builtin?: boolean
  created_at: string
  updated_at: string
}

// Organization Types
export interface Organization {
  id: string
  name: string
  description?: string
  owner_id: string
  member_count?: number
  created_at: string
  updated_at: string
}

export interface OrganizationMember {
  id: string
  user_id: string
  username: string
  email: string
  role: 'owner' | 'admin' | 'editor' | 'viewer'
  joined_at: string
}

// Settings Types
export interface RetrievalConfig {
  embedding_top_k: number
  vector_threshold: number
  keyword_threshold: number
  rerank_top_k: number
  rerank_threshold: number
  rerank_model_id: string
}

export interface AppSettings {
  endpoint: string
  apiKey: string
  language: string
  theme: 'light' | 'dark' | 'auto'
  isAgentEnabled: boolean
  agentConfig: {
    selectedAgentId?: string
    selectedAgentSourceTenantId?: string | null
    allowedTools?: string[]
  }
  modelConfig: {
    chatModelId?: string
    embeddingModelId?: string
    rerankModelId?: string
  }
}
