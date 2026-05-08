import { useCallback, useRef } from 'react'
import { fetchEventSource } from '@microsoft/fetch-event-source'
import type { StreamChunk } from '@/types'

export interface StreamCallbacks {
  onChunk: (chunk: StreamChunk) => void
  onError: (error: string) => void
  onComplete: () => void
}

export interface StreamOptions {
  session_id?: string
  query: string
  knowledge_base_ids?: string[]
  agent_enabled?: boolean
  agent_id?: string
  web_search_enabled?: boolean
  enable_memory?: boolean
  temperature?: number
  model_id?: string
}

const BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

export function useChatStream() {
  const abortControllerRef = useRef<AbortController | null>(null)

  const startStream = useCallback(async (options: StreamOptions, callbacks: StreamCallbacks) => {
    const { session_id, query, knowledge_base_ids, agent_enabled, agent_id, web_search_enabled, enable_memory, temperature, model_id } = options

    abortControllerRef.current = new AbortController()

    const postBody: Record<string, any> = {
      query,
    }

    if (session_id) postBody.session_id = session_id
    if (knowledge_base_ids && knowledge_base_ids.length > 0) {
      postBody.knowledge_base_ids = knowledge_base_ids
    }
    if (agent_enabled !== undefined) postBody.agent_enabled = agent_enabled
    if (agent_id) postBody.agent_id = agent_id
    if (web_search_enabled !== undefined) postBody.web_search_enabled = web_search_enabled
    if (enable_memory !== undefined) postBody.enable_memory = enable_memory
    if (temperature !== undefined) postBody.temperature = temperature
    if (model_id) postBody.model_id = model_id

    const token = localStorage.getItem('weknora_token')

    try {
      await fetchEventSource(`${BASE_URL}/api/v1/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(postBody),
        signal: abortControllerRef.current.signal,
        onmessage: (event) => {
          if (event.data === '[DONE]') {
            callbacks.onComplete()
            return
          }

          try {
            const data = JSON.parse(event.data)
            const chunk: StreamChunk = {
              type: data.type || 'text',
              content: data.content,
              data: data.data,
            }
            callbacks.onChunk(chunk)
          } catch (e) {
            console.error('Failed to parse SSE data:', e)
          }
        },
        onerror: (error) => {
          callbacks.onError(error.message || 'Stream error')
        },
      })
    } catch (e) {
      if ((e as Error).name !== 'AbortError') {
        callbacks.onError((e as Error).message || 'Stream error')
      }
    }
  }, [])

  const stopStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
  }, [])

  return { startStream, stopStream }
}
