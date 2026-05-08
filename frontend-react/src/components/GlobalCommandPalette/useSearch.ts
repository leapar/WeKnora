import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { listKnowledgeBases, knowledgeSemanticSearch } from '@/api/knowledge-base'
import { listAgents } from '@/api/agent'
import { searchMessages } from '@/api/chat'
import { useOrganizationStore } from '@/stores/organizationStore'
import { useMenuStore } from '@/stores/menuStore'
import type { CmdkKb, CmdkAgent, CmdkSessionItem, CmdkFileGroup, CmdkMsgGroup } from './types'
import type { MessageSearchGroupItem } from '@/api/chat'

interface UseSearchOptions {
  lockedKbIds?: () => string[]
  debounceMs?: number
}

export function useCmdkSearch(options: UseSearchOptions = {}) {
  const debounceMs = options.debounceMs ?? 350
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  // All KBs the current user can see (own + shared). Loaded lazily & cached.
  const [knowledgeBases, setKnowledgeBases] = useState<CmdkKb[]>([])
  const [kbsLoaded, setKbsLoaded] = useState(false)
  const kbsLoadingPromise = useRef<Promise<void> | null>(null)

  const [fileGroups, setFileGroups] = useState<CmdkFileGroup[]>([])
  const [messageGroups, setMessageGroups] = useState<CmdkMsgGroup[]>([])
  const [totalChunks, setTotalChunks] = useState(0)
  const [totalMessages, setTotalMessages] = useState(0)

  // Agents the current user can access (own + builtin + shared via orgs).
  const [agents, setAgents] = useState<CmdkAgent[]>([])
  const [agentsLoaded, setAgentsLoaded] = useState(false)
  const agentsLoadingPromise = useRef<Promise<void> | null>(null)

  const orgStore = useOrganizationStore()
  const menuStore = useMenuStore()

  const ensureKbs = useCallback(async (): Promise<void> => {
    if (kbsLoaded) return
    if (kbsLoadingPromise.current) return kbsLoadingPromise.current

    kbsLoadingPromise.current = (async () => {
      try {
        const [kbRes, shared] = await Promise.all([
          listKnowledgeBases(),
          orgStore.fetchSharedKnowledgeBases(),
        ])
        const own: CmdkKb[] = ((kbRes as any)?.data?.knowledge_bases || []).map((kb: any) => ({
          id: String(kb.id),
          name: kb.name || '',
          type: kb.type,
        }))
        const ownIds = new Set(own.map((k) => k.id))
        const sharedList: CmdkKb[] = (shared || [])
          .filter((s: any) => s?.knowledge_base != null)
          .map((s: any) => ({
            id: String(s.knowledge_base.id),
            name: s.knowledge_base.name || '',
            type: s.knowledge_base.type,
          }))
          .filter((k: CmdkKb) => !ownIds.has(k.id))
        setKnowledgeBases([...own, ...sharedList])
        setKbsLoaded(true)
      } catch (e) {
        console.error('[cmdk] failed to load knowledge bases', e)
      } finally {
        kbsLoadingPromise.current = null
      }
    })()

    return kbsLoadingPromise.current
  }, [kbsLoaded, orgStore])

  // Derived: KB name lookup
  const getKbName = useCallback(
    (kbId: string): string => {
      if (!kbId) return ''
      const kb = knowledgeBases.find((k) => k.id === kbId)
      return kb?.name || ''
    },
    [knowledgeBases]
  )

  // KB name hits (client-side, works even before a remote search returns).
  const kbMatches = useMemo<CmdkKb[]>(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return knowledgeBases.filter((k) => k.name.toLowerCase().includes(q)).slice(0, 4)
  }, [query, knowledgeBases])

  // Agents (own + shared). Lazily loaded & cached; no backend search endpoint
  // exists so we always filter client-side.
  const ensureAgents = useCallback(async (): Promise<void> => {
    if (agentsLoaded) return
    if (agentsLoadingPromise.current) return agentsLoadingPromise.current

    agentsLoadingPromise.current = (async () => {
      try {
        const [ownRes, shared] = await Promise.all([listAgents(), orgStore.fetchSharedAgents()])
        const own: CmdkAgent[] = ((ownRes as any)?.data?.agents || []).map((a: any) => ({
          id: String(a.id),
          name: a.name || '',
          description: a.description,
          avatar: a.avatar,
          isBuiltin: !!a.is_builtin,
          source: 'own' as const,
        }))
        const ownIds = new Set(own.map((a) => a.id))
        const sharedList: CmdkAgent[] = (shared || [])
          .filter((s: any) => s?.agent != null)
          .map((s: any) => ({
            id: String(s.agent.id),
            name: s.agent.name || '',
            description: s.agent.description,
            avatar: s.agent.avatar,
            isBuiltin: !!s.agent.is_builtin,
            source: 'shared' as const,
            orgName: s.org_name,
          }))
          .filter((a: CmdkAgent) => !ownIds.has(a.id))
        setAgents([...own, ...sharedList])
        setAgentsLoaded(true)
      } catch (e) {
        console.error('[cmdk] failed to load agents', e)
      } finally {
        agentsLoadingPromise.current = null
      }
    })()

    return agentsLoadingPromise.current
  }, [agentsLoaded, orgStore])

  const agentMatches = useMemo<CmdkAgent[]>(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return agents
      .filter((a) => {
        const name = (a.name || '').toLowerCase()
        const desc = (a.description || '').toLowerCase()
        return name.includes(q) || desc.includes(q)
      })
      .slice(0, 5)
  }, [query, agents])

  // Sessions: no dedicated list API; we re-use whatever menuStore already has
  // cached (the sidebar already paginates them).
  const sessionList = useMemo<CmdkSessionItem[]>(() => {
    const menuArr = menuStore.menuArr as any[]
    const chatMenu = menuArr.find((m: any) => m.path === 'creatChat')
    const children = (chatMenu?.children as any[]) || []
    return children.map((c: any) => ({
      id: String(c.id || ''),
      title: c.title || '',
    }))
  }, [menuStore.menuArr])

  const sessionMatches = useMemo<CmdkSessionItem[]>(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    // If a session already appears in the message-content group, suppress it here
    const coveredBySession = new Set(messageGroups.map((g) => g.sessionId))
    return sessionList
      .filter((s) => s.title && s.title.toLowerCase().includes(q))
      .filter((s) => !coveredBySession.has(s.id))
      .slice(0, 5)
  }, [query, sessionList, messageGroups])

  // Monotonic id to drop stale responses.
  const requestSeqRef = useRef(0)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearResults = useCallback(() => {
    setFileGroups([])
    setMessageGroups([])
    setTotalChunks(0)
    setTotalMessages(0)
    setHasSearched(false)
  }, [])

  const runSearch = useCallback(
    async (q: string, seq: number) => {
      setLoading(true)
      setHasSearched(true)

      // Determine knowledge_base_ids for chunk search.
      const locked = options.lockedKbIds?.() || []
      const scoped = locked.length > 0
      let kbIds: string[]
      if (scoped) {
        kbIds = locked
      } else {
        await ensureKbs()
        kbIds = knowledgeBases.map((k) => k.id)
      }

      const knowledgePromise =
        kbIds.length > 0
          ? knowledgeSemanticSearch({ query: q, knowledge_base_ids: kbIds })
              .then((res: any) => (res?.success && res.data ? res.data : []))
              .catch((e) => {
                console.error('[cmdk] knowledge search failed', e)
                return []
              })
          : Promise.resolve([])

      // Message search API call - need to check if it exists
      // For now, we'll use a placeholder since the API might not be in frontend-react
      const messagesPromise = scoped
        ? Promise.resolve({ items: [], total: 0 })
        : searchMessages({ query: q, mode: 'hybrid', limit: 30 })
            .then((res: any) => (res?.success && res.data ? res.data : { items: [], total: 0 }))
            .catch((e) => {
              console.error('[cmdk] message search failed', e)
              return { items: [], total: 0 }
            })

      const [chunks, msgRes] = await Promise.all([knowledgePromise, messagesPromise])

      // Stale response guard.
      if (seq !== requestSeqRef.current) return

      // Group chunks by knowledge_id.
      const fmap = new Map<string, CmdkFileGroup>()
      for (const item of chunks as any[]) {
        const kid = item.knowledge_id || 'unknown'
        if (!fmap.has(kid)) {
          fmap.set(kid, {
            knowledgeId: kid,
            kbId: item.knowledge_base_id || '',
            title: item.knowledge_title || item.knowledge_filename || kid,
            kbName: getKbName(item.knowledge_base_id),
            chunks: [],
          })
        }
        fmap.get(kid)!.chunks.push({
          id: item.id,
          chunk_index: item.chunk_index,
          knowledge_id: kid,
          knowledge_base_id: item.knowledge_base_id || '',
          knowledge_title: item.knowledge_title || '',
          kb_name: getKbName(item.knowledge_base_id),
          content: item.content || '',
          matched_content: item.matched_content,
          match_type: item.match_type || 'vector',
          score: item.score || 0,
        })
      }
      setFileGroups(Array.from(fmap.values()))
      setTotalChunks((chunks as any[]).length)

      // Group messages by session_id.
      const mmap = new Map<string, CmdkMsgGroup>()
      const items: MessageSearchGroupItem[] = (msgRes as any).items || []
      for (const m of items) {
        const sid = m.session_id || 'unknown'
        if (!mmap.has(sid)) {
          mmap.set(sid, {
            sessionId: sid,
            sessionTitle: m.session_title || '',
            items: [],
          })
        }
        mmap.get(sid)!.items.push(m)
      }
      setMessageGroups(Array.from(mmap.values()))
      setTotalMessages((msgRes as any).total || items.length)

      setLoading(false)
    },
    [options.lockedKbIds, ensureKbs, knowledgeBases, getKbName]
  )

  // Watch query changes (debounced).
  useEffect(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    const trimmed = query.trim()
    if (!trimmed) {
      requestSeqRef.current++
      setLoading(false)
      clearResults()
      return
    }
    debounceTimerRef.current = setTimeout(() => {
      const seq = ++requestSeqRef.current
      runSearch(trimmed, seq)
    }, debounceMs)

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    }
  }, [query, debounceMs, runSearch, clearResults])

  // Preload KB and agent lists on mount.
  useEffect(() => {
    ensureKbs()
    ensureAgents()
  }, [ensureKbs, ensureAgents])

  return {
    query,
    setQuery,
    loading,
    hasSearched,
    knowledgeBases,
    fileGroups,
    messageGroups,
    kbMatches,
    agents,
    agentMatches,
    sessionMatches,
    totalChunks,
    totalMessages,
    clearResults,
    ensureKbs,
    ensureAgents,
  }
}