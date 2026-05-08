import { get, post, put, del } from '@/lib/api'

export interface MCPService {
  id: string
  tenant_id?: number
  name: string
  description: string
  enabled: boolean
  transport_type: 'sse' | 'http-streamable' | 'stdio'
  url?: string
  headers?: Record<string, string>
  auth_config?: {
    api_key?: string
    token?: string
    custom_headers?: Record<string, string>
  }
  advanced_config?: {
    timeout?: number
    retry_count?: number
    retry_delay?: number
  }
  stdio_config?: {
    command: 'uvx' | 'npx'
    args: string[]
  }
  env_vars?: Record<string, string>
  is_builtin?: boolean
  created_at?: string
  updated_at?: string
}

export interface MCPTool {
  name: string
  description: string
  inputSchema: Record<string, any>
}

export interface MCPResource {
  uri: string
  name: string
  description?: string
  mimeType?: string
}

export interface MCPTestResult {
  success: boolean
  message?: string
  tools?: MCPTool[]
  resources?: MCPResource[]
}

export async function listMCPServices(): Promise<MCPService[]> {
  const resp = await get<{ data: MCPService[] }>('/api/v1/mcp-services')
  return resp?.data || []
}

export async function getMCPService(id: string): Promise<MCPService> {
  const resp = await get<{ data: MCPService }>(`/api/v1/mcp-services/${id}`)
  return resp?.data
}

export async function createMCPService(data: Partial<MCPService>): Promise<MCPService> {
  const resp = await post<{ data: MCPService }>('/api/v1/mcp-services', data)
  return resp?.data
}

export async function updateMCPService(id: string, data: Partial<MCPService>): Promise<MCPService> {
  const resp = await put<{ data: MCPService }>(`/api/v1/mcp-services/${id}`, data)
  return resp?.data
}

export async function deleteMCPService(id: string): Promise<void> {
  await del(`/api/v1/mcp-services/${id}`)
}

export async function testMCPService(id: string): Promise<MCPTestResult> {
  const resp = await post<{ data: MCPTestResult }>(`/api/v1/mcp-services/${id}/test`, {})
  if (resp?.data) {
    return resp.data
  }
  return resp as unknown as MCPTestResult
}

export async function getMCPServiceTools(id: string): Promise<MCPTool[]> {
  const resp = await get<{ data: MCPTool[] }>(`/api/v1/mcp-services/${id}/tools`)
  return resp?.data || []
}

export async function getMCPServiceResources(id: string): Promise<MCPResource[]> {
  const resp = await get<{ data: MCPResource[] }>(`/api/v1/mcp-services/${id}/resources`)
  return resp?.data || []
}
