import { api } from '@/lib/api'
import type { PreviewChunkingRequest, PreviewChunkingResponse } from '@/types/chunker'

export async function previewChunking(
  body: PreviewChunkingRequest
): Promise<{ success: boolean; data: PreviewChunkingResponse }> {
  const resp = await api.post('/api/v1/chunker/preview', body)
  return resp.data
}
