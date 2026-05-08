import { get, post, put, del } from '@/lib/api'

// Wiki Page Types
export interface WikiPage {
  id: string
  tenant_id: number
  knowledge_base_id: string
  slug: string
  title: string
  page_type: string
  status: string
  content: string
  summary: string
  aliases: string[]
  source_refs: string[]
  in_links: string[]
  out_links: string[]
  page_metadata: Record<string, any>
  version: number
  created_at: string
  updated_at: string
}

export interface WikiPageListResponse {
  pages: WikiPage[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export interface WikiGraphData {
  nodes: { slug: string; title: string; page_type: string; link_count: number }[]
  edges: { source: string; target: string }[]
}

export interface WikiStats {
  total_pages: number
  pages_by_type: Record<string, number>
  total_links: number
  orphan_count: number
  recent_updates: WikiPage[]
  pending_tasks: number
  pending_issues: number
  is_active: boolean
}

export interface WikiPageIssue {
  id: string
  tenant_id: number
  knowledge_base_id: string
  slug: string
  issue_type: string
  description: string
  suspected_knowledge_ids: string[]
  status: string
  reported_by: string
  created_at: string
  updated_at: string
}

// encodeSlugPath encodes each segment of a hierarchical wiki slug (e.g.
// "foo/bar baz?") so the URL is safe while preserving the "/" separators
function encodeSlugPath(slug: string): string {
  return slug.split('/').map(encodeURIComponent).join('/')
}

export function listWikiPages(
  kbId: string,
  params?: {
    page_type?: string
    status?: string
    query?: string
    page?: number
    page_size?: number
    sort_by?: string
    sort_order?: string
  }
) {
  const query = new URLSearchParams()
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        query.set(key, String(value))
      }
    })
  }
  const qs = query.toString()
  return get<WikiPageListResponse>(`/knowledgebase/${kbId}/wiki/pages${qs ? '?' + qs : ''}`)
}

export function createWikiPage(kbId: string, data: Partial<WikiPage>) {
  return post(`/knowledgebase/${kbId}/wiki/pages`, data)
}

export function getWikiPage(kbId: string, slug: string) {
  return get<WikiPage>(`/knowledgebase/${kbId}/wiki/pages/${encodeSlugPath(slug)}`)
}

export function updateWikiPage(kbId: string, slug: string, data: Partial<WikiPage>) {
  return put(`/knowledgebase/${kbId}/wiki/pages/${encodeSlugPath(slug)}`, data)
}

export function deleteWikiPage(kbId: string, slug: string) {
  return del(`/knowledgebase/${kbId}/wiki/pages/${encodeSlugPath(slug)}`)
}

export function getWikiIndex(kbId: string) {
  return get<WikiPage>(`/knowledgebase/${kbId}/wiki/index`)
}

export function getWikiLog(kbId: string) {
  return get<WikiPage>(`/knowledgebase/${kbId}/wiki/log`)
}

export function getWikiGraph(kbId: string) {
  return get<WikiGraphData>(`/knowledgebase/${kbId}/wiki/graph`)
}

export function getWikiStats(kbId: string) {
  return get<WikiStats>(`/knowledgebase/${kbId}/wiki/stats`)
}

export function searchWikiPages(kbId: string, q: string, limit?: number) {
  const params = new URLSearchParams({ q })
  if (limit) params.set('limit', String(limit))
  return get<WikiPageListResponse>(`/knowledgebase/${kbId}/wiki/search?${params.toString()}`)
}

export function listWikiIssues(kbId: string, slug?: string, status?: string) {
  const params = new URLSearchParams()
  if (slug) params.set('slug', slug)
  if (status) params.set('status', status)
  return get<WikiPageIssue[]>(`/knowledgebase/${kbId}/wiki/issues?${params.toString()}`)
}

export function updateWikiIssueStatus(kbId: string, issueId: string, status: string) {
  return put(`/knowledgebase/${kbId}/wiki/issues/${issueId}/status`, { status })
}

export function rebuildWikiLinks(kbId: string) {
  return post(`/knowledgebase/${kbId}/wiki/rebuild-links`, {})
}