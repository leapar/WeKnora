'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { marked } from 'marked'
import {
  Search,
  ChevronDown,
  ChevronRight,
  ArrowLeft,
  Link,
  FileText,
  AlertCircle,
  AlertTriangle,
  Focus,
  Eye,
  EyeOff,
  BookOpen,
  History,
  File,
  ArrowRightCircle,
  Loader2,
  CircleDot,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { PicturePreview } from '@/components/PicturePreview'
import {
  listWikiPages,
  getWikiPage,
  getWikiGraph,
  getWikiStats,
  searchWikiPages,
  listWikiIssues,
  updateWikiIssueStatus,
  type WikiPage,
  type WikiGraphData,
  type WikiStats,
  type WikiPageIssue,
} from '@/api/wiki'
import { createSession } from '@/api/chat'

// Types
interface GNode {
  x: number
  y: number
  vx: number
  vy: number
  slug: string
  title: string
  type: string
  linkCount: number
  pinned: boolean
}

interface EdgeEl {
  line: SVGLineElement
  source: string
  target: string
  bidir: boolean
}

interface WikiBrowserProps {
  knowledgeBaseId: string
  view?: 'browser' | 'graph'
  initialSlug?: string
  onOpenSourceDoc?: (knowledgeId: string) => void
  onStatusChange?: (payload: { pendingTasks: number; isActive: boolean; pendingIssues: number }) => void
}

// Node color map
const nodeColorMap: Record<string, string> = {
  summary: '#0052d9',
  entity: '#2ba471',
  concept: '#e37318',
  synthesis: '#0594fa',
  comparison: '#d54941',
  index: '#8c8c8c',
  log: '#8c8c8c',
}

const typeOrder = ['summary', 'entity', 'concept', 'synthesis', 'comparison']

export function WikiBrowser({
  knowledgeBaseId,
  view = 'browser',
  initialSlug,
  onOpenSourceDoc,
  onStatusChange,
}: WikiBrowserProps) {
  const { t } = useTranslation()

  // State
  const [pages, setPages] = useState<WikiPage[]>([])
  const [selectedPage, setSelectedPage] = useState<WikiPage | null>(null)
  const [pageIssues, setPageIssues] = useState<WikiPageIssue[]>([])
  const [showIssuesBox, setShowIssuesBox] = useState(false)
  const [showFixDrawer, setShowFixDrawer] = useState(false)
  const [showGlobalIssuesDrawer, setShowGlobalIssuesDrawer] = useState(false)
  const [globalIssues, setGlobalIssues] = useState<WikiPageIssue[]>([])
  const [currentFixSessionId, setCurrentFixSessionId] = useState('')
  const [stats, setStats] = useState<WikiStats | null>(null)
  const [graphData, setGraphData] = useState<WikiGraphData | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [graphSearchValue, setGraphSearchValue] = useState('')
  const graphRef = useRef<HTMLDivElement>(null)
  const readerBodyRef = useRef<HTMLDivElement>(null)
  const drawerBodyRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(false)
  const [graphLoading, setGraphLoading] = useState(false)
  const [graphReady, setGraphReady] = useState(false)
  const [showArrows, setShowArrows] = useState(true)
  const [imagePreviewVisible, setImagePreviewVisible] = useState(false)
  const [imagePreviewUrl, setImagePreviewUrl] = useState('')
  const [navHistory, setNavHistory] = useState<WikiPage[]>([])
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({})
  const [graphDrawerVisible, setGraphDrawerVisible] = useState(false)
  const [graphDrawerPage, setGraphDrawerPage] = useState<WikiPage | null>(null)
  const [graphHighlightSlug, setGraphHighlightSlug] = useState<string | null>(null)
  const [graphSelectedSlug, setGraphSelectedSlug] = useState<string | null>(null)

  // Graph refs (persistent)
  const graphNodesRef = useRef<GNode[]>([])
  const graphNodeElsRef = useRef<{ g: SVGGElement; circle: SVGCircleElement; text: SVGTextElement; activeRing: SVGCircleElement; node: GNode }[]>([])
  const graphEdgeElsRef = useRef<EdgeEl[]>([])
  const graphAdjacencyRef = useRef(new Map<string, Set<string>>())
  const graphPanZoomRef = useRef<{
    setScale: (s: number) => void
    setTranslate: (x: number, y: number) => void
    apply: () => void
    flyTo: (x: number, y: number, s?: number, duration?: number) => void
    getScale: () => number
  } | null>(null)
  const graphAnimFrameRef = useRef(0)
  const graphHoverLeaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const statsTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Graph filter types
  const [graphFilterTypes, setGraphFilterTypes] = useState<Set<string>>(
    new Set(['summary', 'entity', 'concept', 'synthesis', 'comparison', 'index', 'log'])
  )

  // Derived state
  const indexPage = useMemo(() => pages.find((p) => p.page_type === 'index'), [pages])
  const logPage = useMemo(() => pages.find((p) => p.page_type === 'log'), [pages])
  const contentPages = useMemo(
    () => pages.filter((p) => p.page_type !== 'index' && p.page_type !== 'log'),
    [pages]
  )

  const groupedPages = useMemo(() => {
    const groups: { type: string; label: string; pages: WikiPage[] }[] = []
    const byType = new Map<string, WikiPage[]>()

    for (const page of contentPages) {
      const arr = byType.get(page.page_type) || []
      arr.push(page)
      byType.set(page.page_type, arr)
    }

    for (const type of typeOrder) {
      const groupPages = byType.get(type)
      if (groupPages && groupPages.length > 0) {
        groups.push({ type, label: getTypeLabel(type), pages: groupPages })
      }
    }

    for (const [type, groupPages] of byType) {
      if (!typeOrder.includes(type) && groupPages.length > 0) {
        groups.push({ type, label: getTypeLabel(type), pages: groupPages })
      }
    }

    return groups
  }, [contentPages])

  const parsedSourceRefs = useMemo(() => {
    if (!selectedPage?.source_refs?.length) return []
    return selectedPage.source_refs.map((ref) => {
      const pipeIdx = ref.indexOf('|')
      if (pipeIdx > 0) {
        return { id: ref.substring(0, pipeIdx), title: ref.substring(pipeIdx + 1) }
      }
      return { id: ref, title: ref.length > 20 ? ref.substring(0, 8) + '...' : ref }
    })
  }, [selectedPage])

  const graphSearchOptions = useMemo(() => {
    if (!graphData?.nodes) return []
    return graphData.nodes.map((n) => ({
      label: n.title,
      value: n.slug,
    }))
  }, [graphData])

  const graphDrawerContent = useMemo(() => {
    if (!graphDrawerPage) return ''
    return renderMarkdown(graphDrawerPage.content)
  }, [graphDrawerPage])

  const renderedContent = useMemo(() => {
    if (!selectedPage) return ''
    return renderMarkdown(selectedPage.content)
  }, [selectedPage])

  // Helper functions
  function getTypeLabel(type: string): string {
    const map: Record<string, string> = {
      summary: t('knowledgeEditor.wikiBrowser.filterSummary') || 'Summary',
      entity: t('knowledgeEditor.wikiBrowser.filterEntity') || 'Entity',
      concept: t('knowledgeEditor.wikiBrowser.filterConcept') || 'Concept',
      synthesis: t('knowledgeEditor.wikiBrowser.filterSynthesis') || 'Synthesis',
      comparison: t('knowledgeEditor.wikiBrowser.filterComparison') || 'Comparison',
      index: 'Index',
      log: 'Log',
    }
    return map[type] || type
  }

  function formatDate(dateStr: string): string {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  }

  function slugDisplayName(slug: string): string {
    const page = pages.find((p) => p.slug === slug)
    if (page) return page.title
    const parts = slug.split('/')
    return parts.length > 1 ? parts.slice(1).join('/') : slug
  }

  function renderMarkdown(content: string): string {
    let preprocessed = content.replace(/\[\[([^\]]+)\]\]/g, (_, inner: string) => {
      const pipeIdx = inner.indexOf('|')
      const slug = pipeIdx > 0 ? inner.substring(0, pipeIdx).trim() : inner.trim()
      const display = pipeIdx > 0 ? inner.substring(pipeIdx + 1).trim() : slugDisplayName(slug)
      return `<a href="#" class="wiki-content-link" data-slug="${slug}">${display}</a>`
    })
    return marked.parse(preprocessed, { breaks: true, async: false }) as string
  }

  function closeImagePreview() {
    setImagePreviewVisible(false)
    setImagePreviewUrl('')
  }

  // API functions
  async function loadPages() {
    setLoading(true)
    try {
      const PAGE_SIZE = 500
      const MAX_PAGES = 50
      const collected: WikiPage[] = []
      let page = 1
      let totalPages = 1

      while (page <= totalPages && page <= MAX_PAGES) {
        const res = await listWikiPages(knowledgeBaseId, { page, page_size: PAGE_SIZE })
        const body = res as any
        const batch: WikiPage[] = body?.pages || []
        collected.push(...batch)
        const reportedTotalPages = Number(body?.total_pages) || 0
        if (reportedTotalPages > 0) {
          totalPages = reportedTotalPages
        } else if (batch.length < PAGE_SIZE) {
          break
        } else {
          totalPages = page + 1
        }
        page++
      }

      setPages(collected)

      if (!selectedPage) {
        if (initialSlug) {
          await navigateToSlug(initialSlug)
        } else if (indexPage) {
          await selectPage(indexPage)
        }
      }
    } catch (e) {
      console.error('Failed to load wiki pages:', e)
    } finally {
      setLoading(false)
    }
  }

  async function loadStats() {
    try {
      const res = await getWikiStats(knowledgeBaseId)
      const statsData = (res as any).data || res as any
      setStats(statsData)

      if (onStatusChange && statsData) {
        onStatusChange({
          pendingTasks: statsData.pending_tasks || 0,
          isActive: !!statsData.is_active,
          pendingIssues: statsData.pending_issues || 0,
        })
      }

      if (statsData && (statsData.pending_tasks > 0 || statsData.is_active)) {
        if (!statsTimerRef.current) {
          statsTimerRef.current = setInterval(() => {
            loadStats()
          }, 5000)
        }
      } else if (statsTimerRef.current) {
        clearInterval(statsTimerRef.current)
        statsTimerRef.current = null
        loadPages()
        refreshSelectedPage()
        if (view === 'graph') {
          loadGraph()
        }
      }
    } catch (e) {
      /* ignore */
    }
  }

  async function refreshSelectedPage() {
    if (!selectedPage) return
    const slug = selectedPage.slug
    try {
      const res = await getWikiPage(knowledgeBaseId, slug)
      setSelectedPage((res as any).data || res as any)
      await loadPageIssues(slug)
    } catch (e) {
      console.error(`Failed to refresh wiki page ${slug}:`, e)
    }
  }

  async function loadGraph() {
    setGraphLoading(true)
    setGraphReady(false)
    try {
      const res = await getWikiGraph(knowledgeBaseId)
      setGraphData((res as any).data || res as any)
      await new Promise((resolve) => setTimeout(resolve, 0))
      renderGraph()
      if (initialSlug) {
        setGraphSelectedSlug(null)
        setTimeout(() => {
          handleGraphSearchSelect(initialSlug)
        }, 300)
      }
    } catch (e) {
      console.error('Failed to load graph:', e)
    } finally {
      setGraphLoading(false)
    }
  }

  async function loadPageIssues(slug: string) {
    try {
      const res = await listWikiIssues(knowledgeBaseId, slug, 'pending')
      setPageIssues((res as any).data || res as any || [])
      setShowIssuesBox(false)
    } catch (e) {
      console.error('Failed to load wiki issues:', e)
      setPageIssues([])
      setShowIssuesBox(false)
    }
  }

  async function selectPage(page: WikiPage) {
    try {
      if (selectedPage && selectedPage.id !== page.id) {
        setNavHistory((prev) => [...prev, selectedPage])
      }
      const res = await getWikiPage(knowledgeBaseId, page.slug)
      setSelectedPage((res as any).data || res as any)
      await loadPageIssues(page.slug)
    } catch (e) {
      console.error('Failed to load wiki page:', e)
    }
  }

  async function navigateToSlug(slug: string) {
    try {
      if (selectedPage && selectedPage.slug !== slug) {
        setNavHistory((prev) => [...prev, selectedPage])
      }
      const res = await getWikiPage(knowledgeBaseId, slug)
      setSelectedPage((res as any).data || res as any)
      await loadPageIssues(slug)
    } catch (e) {
      console.error(`Failed to navigate to ${slug}:`, e)
    }
  }

  function goBack() {
    const prev = navHistory[navHistory.length - 1]
    if (prev) {
      setNavHistory((prev) => prev.slice(0, -1))
      setSelectedPage(prev)
      loadPageIssues(prev.slug)
    }
  }

  async function handleIssueIgnore(issueId: string) {
    try {
      await updateWikiIssueStatus(knowledgeBaseId, issueId, 'ignored')
      if (selectedPage) {
        await loadPageIssues(selectedPage.slug)
      }
    } catch (e) {
      console.error('Failed to update issue status:', e)
    }
  }

  async function handleGlobalIssueIgnore(issueId: string) {
    try {
      await updateWikiIssueStatus(knowledgeBaseId, issueId, 'ignored')
      const res = await listWikiIssues(knowledgeBaseId, '', 'pending')
      setGlobalIssues((res as any).data || res as any || [])
      loadStats()
    } catch (e) {
      console.error('Failed to update issue status:', e)
    }
  }

  async function startFixSession(_prompt: string) {
    try {
      const res = await createSession(
        t('knowledgeEditor.wikiBrowser.fixAssistantTitle') || 'Fix Assistant',
        'builtin-wiki-fixer',
        [knowledgeBaseId]
      )
      if (res && res.data && res.data.id) {
        setCurrentFixSessionId(res.data.id)
        setShowFixDrawer(true)
        setShowIssuesBox(false)
      }
    } catch (e) {
      console.error('Failed to create fix session', e)
    }
  }

  function triggerFixIssue(issue: WikiPageIssue) {
    if (!selectedPage) return
    const prompt = `Fix issue for slug: ${selectedPage.slug}, issue ID: ${issue.id}`
    startFixSession(prompt)
  }

  function triggerAutoFix() {
    if (!selectedPage || pageIssues.length === 0) return
    let prompt = `Auto fix issues for slug: ${selectedPage.slug}\n\n`
    pageIssues.forEach((issue, idx) => {
      prompt += `${idx + 1}. Issue ID: ${issue.id}\n`
    })
    startFixSession(prompt)
  }

  async function doSearch() {
    if (!searchQuery.trim()) {
      loadPages()
      return
    }
    setLoading(true)
    try {
      const res = await searchWikiPages(knowledgeBaseId, searchQuery)
      setPages((res as any).data?.pages || (res as any).pages || [])
    } catch (e) {
      console.error('Wiki search failed:', e)
    } finally {
      setLoading(false)
    }
  }

  function toggleGroup(type: string) {
    setCollapsedGroups((prev) => ({ ...prev, [type]: !prev[type] }))
  }

  function toggleArrows() {
    setShowArrows((prev) => !prev)
    for (const e of graphEdgeElsRef.current) {
      if (showArrows) {
        e.line.setAttribute('marker-end', 'url(#arrow-end)')
        if (e.bidir) e.line.setAttribute('marker-start', 'url(#arrow-start)')
      } else {
        e.line.removeAttribute('marker-end')
        e.line.removeAttribute('marker-start')
      }
    }
  }

  function handleContentClick(e: React.MouseEvent) {
    const target = e.target as HTMLElement
    if (target.classList.contains('wiki-content-link')) {
      e.preventDefault()
      const slug = target.getAttribute('data-slug')
      if (slug) navigateToSlug(slug)
    } else if (target.tagName.toLowerCase() === 'img') {
      e.preventDefault()
      const src = target.getAttribute('src') || ''
      if (src) {
        setImagePreviewUrl(src)
        setImagePreviewVisible(true)
      }
    }
  }

  function handleGraphDrawerClick(e: React.MouseEvent) {
    const target = e.target as HTMLElement
    if (target.classList.contains('wiki-content-link')) {
      e.preventDefault()
      const slug = target.getAttribute('data-slug')
      if (slug) handleGraphSearchSelect(slug)
    } else if (target.tagName.toLowerCase() === 'img') {
      e.preventDefault()
      const src = target.getAttribute('src') || ''
      if (src) {
        setImagePreviewUrl(src)
        setImagePreviewVisible(true)
      }
    }
  }

  async function openGraphDrawer(slug: string) {
    try {
      const res = await getWikiPage(knowledgeBaseId, slug)
      setGraphDrawerPage((res as any).data || res as any)
      setGraphDrawerVisible(true)
    } catch (e) {
      console.error(`Failed to load page ${slug}:`, e)
    }
  }

  function toggleGraphFilterType(type: string) {
    const newSet = new Set(graphFilterTypes)
    if (newSet.has(type)) {
      newSet.delete(type)
    } else {
      newSet.add(type)
    }
    setGraphFilterTypes(newSet)
    applyGraphFilters()
  }

  function applyGraphFilters() {
    if (!graphReady) return

    const nodeMap = new Map<string, GNode>()
    for (const n of graphNodesRef.current) {
      nodeMap.set(n.slug, n)
    }

    for (const { g, node } of graphNodeElsRef.current) {
      if (graphFilterTypes.has(node.type)) {
        g.style.display = ''
      } else {
        g.style.display = 'none'
      }
    }

    for (const { line, source, target } of graphEdgeElsRef.current) {
      const sNode = nodeMap.get(source)
      const tNode = nodeMap.get(target)

      if (sNode && tNode && graphFilterTypes.has(sNode.type) && graphFilterTypes.has(tNode.type)) {
        line.style.display = ''
      } else {
        line.style.display = 'none'
      }
    }

    if (graphHighlightSlug || graphSelectedSlug) {
      const selectedStillVisible = graphSelectedSlug
        ? graphFilterTypes.has(nodeMap.get(graphSelectedSlug)?.type || '')
        : true

      if (!selectedStillVisible) {
        setGraphSelectedSlug(null)
        setGraphHighlightSlug(null)
        setGraphDrawerVisible(false)
      }
      clearHighlight(graphNodeElsRef.current, graphEdgeElsRef.current)
    }
  }

  function fitGraphToView() {
    if (!graphReady || !graphPanZoomRef.current || !graphRef.current || graphNodesRef.current.length === 0) return

    const container = graphRef.current
    const width = container.clientWidth
    const height = container.clientHeight

    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity
    let visibleCount = 0

    for (const node of graphNodesRef.current) {
      if (!graphFilterTypes.has(node.type)) continue

      minX = Math.min(minX, node.x)
      minY = Math.min(minY, node.y)
      maxX = Math.max(maxX, node.x)
      maxY = Math.max(maxY, node.y)
      visibleCount++
    }

    if (visibleCount === 0) return

    const cx = (minX + maxX) / 2
    const cy = (minY + maxY) / 2

    const padding = 60
    const boxWidth = Math.max(maxX - minX, 100) + padding * 2
    const boxHeight = Math.max(maxY - minY, 100) + padding * 2

    const scaleX = width / boxWidth
    const scaleY = height / boxHeight
    const targetScale = Math.max(0.2, Math.min(2, Math.min(scaleX, scaleY)))

    const targetCx = width / 2 - (graphDrawerVisible ? 240 : 0)
    const targetCy = height / 2

    const targetTx = targetCx - cx * targetScale
    const targetTy = targetCy - cy * targetScale

    graphPanZoomRef.current.flyTo(targetTx, targetTy, targetScale, 600)
  }

  function handleGraphSearchSelect(value: string) {
    if (!value) return

    const node = graphNodesRef.current.find((n) => n.slug === value)

    if (node && !graphFilterTypes.has(node.type)) {
      const newSet = new Set(graphFilterTypes)
      newSet.add(node.type)
      setGraphFilterTypes(newSet)
      applyGraphFilters()
    }

    if (node && graphPanZoomRef.current) {
      const container = graphRef.current
      if (container) {
        const width = container.clientWidth
        const height = container.clientHeight
        const currentScale = graphPanZoomRef.current.getScale()
        graphPanZoomRef.current.flyTo(
          width / 2 - node.x * currentScale - 240,
          height / 2 - node.y * currentScale
        )
      }
    }

    setGraphSelectedSlug(value)
    setGraphHighlightSlug(value)
    if (graphNodeElsRef.current.length > 0) {
      applyHighlight(value, graphAdjacencyRef.current, graphNodeElsRef.current, graphEdgeElsRef.current)
    }

    openGraphDrawer(value)

    setTimeout(() => setGraphSearchValue(''), 300)
  }

  // Graph rendering
  function renderGraph() {
    const container = graphRef.current
    const data = graphData
    if (!container) return
    if (!data || !data.nodes?.length) {
      container.innerHTML = ''
      return
    }

    if (graphAnimFrameRef.current) {
      cancelAnimationFrame(graphAnimFrameRef.current)
      graphAnimFrameRef.current = 0
    }
    if (graphHoverLeaveTimerRef.current) {
      clearTimeout(graphHoverLeaveTimerRef.current)
      graphHoverLeaveTimerRef.current = null
    }

    const width = container.clientWidth || 800
    const height = container.clientHeight || 600

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`)
    svg.style.width = '100%'
    svg.style.height = '100%'
    container.innerHTML = ''
    container.appendChild(svg)

    const rootG = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    rootG.setAttribute('class', 'graph-root')
    svg.appendChild(rootG)

    const edgeG = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    rootG.appendChild(edgeG)

    const nodeG = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    rootG.appendChild(nodeG)

    const adjacency = new Map<string, Set<string>>()
    for (const edge of data.edges) {
      if (!adjacency.has(edge.source)) adjacency.set(edge.source, new Set())
      if (!adjacency.has(edge.target)) adjacency.set(edge.target, new Set())
      adjacency.get(edge.source)!.add(edge.target)
      adjacency.get(edge.target)!.add(edge.source)
    }
    graphAdjacencyRef.current = adjacency

    const nodeMap = new Map<string, GNode>()
    graphNodesRef.current = data.nodes.map((n, i) => {
      const angle = (2 * Math.PI * i) / data.nodes.length
      const r = Math.min(width, height) * 0.35
      const node: GNode = {
        x: width / 2 + r * Math.cos(angle) + (Math.random() - 0.5) * 50,
        y: height / 2 + r * Math.sin(angle) + (Math.random() - 0.5) * 50,
        vx: 0,
        vy: 0,
        slug: n.slug,
        title: n.title,
        type: n.page_type,
        linkCount: n.link_count || 0,
        pinned: false,
      }
      nodeMap.set(n.slug, node)
      return node
    })

    function nodeRadius(n: GNode) {
      return Math.max(8, Math.min(24, 8 + Math.log(n.linkCount + 1) * 4))
    }

    // SVG defs
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs')

    const markerEnd = document.createElementNS('http://www.w3.org/2000/svg', 'marker')
    markerEnd.setAttribute('id', 'arrow-end')
    markerEnd.setAttribute('viewBox', '0 0 10 6')
    markerEnd.setAttribute('refX', '10')
    markerEnd.setAttribute('refY', '3')
    markerEnd.setAttribute('markerWidth', '8')
    markerEnd.setAttribute('markerHeight', '6')
    markerEnd.setAttribute('orient', 'auto')
    const arrowPath = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    arrowPath.setAttribute('d', 'M0,0 L10,3 L0,6 L2,3 Z')
    arrowPath.setAttribute('fill', '#c0c4cc')
    markerEnd.appendChild(arrowPath)
    defs.appendChild(markerEnd)

    const markerStart = document.createElementNS('http://www.w3.org/2000/svg', 'marker')
    markerStart.setAttribute('id', 'arrow-start')
    markerStart.setAttribute('viewBox', '0 0 10 6')
    markerStart.setAttribute('refX', '0')
    markerStart.setAttribute('refY', '3')
    markerStart.setAttribute('markerWidth', '8')
    markerStart.setAttribute('markerHeight', '6')
    markerStart.setAttribute('orient', 'auto')
    const arrowPathStart = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    arrowPathStart.setAttribute('d', 'M10,0 L0,3 L10,6 L8,3 Z')
    arrowPathStart.setAttribute('fill', '#c0c4cc')
    markerStart.appendChild(arrowPathStart)
    defs.appendChild(markerStart)

    for (const id of ['arrow-end-hl', 'arrow-start-hl']) {
      const m = document.createElementNS('http://www.w3.org/2000/svg', 'marker')
      m.setAttribute('id', id)
      m.setAttribute('viewBox', '0 0 10 6')
      m.setAttribute('refX', id.includes('end') ? '10' : '0')
      m.setAttribute('refY', '3')
      m.setAttribute('markerWidth', '8')
      m.setAttribute('markerHeight', '6')
      m.setAttribute('orient', 'auto')
      const p = document.createElementNS('http://www.w3.org/2000/svg', 'path')
      p.setAttribute('d', id.includes('end') ? 'M0,0 L10,3 L0,6 L2,3 Z' : 'M10,0 L0,3 L10,6 L8,3 Z')
      p.setAttribute('fill', '#0052d9')
      m.appendChild(p)
      defs.appendChild(m)
    }

    svg.appendChild(defs)

    const edgePairSet = new Set<string>()
    for (const edge of data.edges) {
      edgePairSet.add(`${edge.source}→${edge.target}`)
    }

    const edgeEls: EdgeEl[] = []
    const processedPairs = new Set<string>()

    for (const edge of data.edges) {
      const pairKey = [edge.source, edge.target].sort().join('↔')
      if (processedPairs.has(pairKey)) continue
      processedPairs.add(pairKey)

      const bidir = edgePairSet.has(`${edge.target}→${edge.source}`)

      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line')
      line.setAttribute('stroke', '#c0c4cc')
      line.setAttribute('stroke-width', '1.2')
      line.setAttribute('stroke-opacity', '0.4')
      line.setAttribute('marker-end', 'url(#arrow-end)')
      line.style.transition = 'stroke 0.2s, stroke-width 0.2s, stroke-opacity 0.2s'
      if (bidir) {
        line.setAttribute('marker-start', 'url(#arrow-start)')
      }
      edgeG.appendChild(line)
      edgeEls.push({ line, source: edge.source, target: edge.target, bidir })
    }

    const nodeEls: { g: SVGGElement; circle: SVGCircleElement; text: SVGTextElement; activeRing: SVGCircleElement; node: GNode }[] = []

    for (const n of graphNodesRef.current) {
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g')
      g.style.cursor = 'pointer'

      const r = nodeRadius(n)

      const activeRing = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
      activeRing.setAttribute('r', String(r + 5))
      activeRing.setAttribute('fill', 'none')
      activeRing.setAttribute('stroke', nodeColorMap[n.type] || '#8c8c8c')
      activeRing.setAttribute('stroke-width', '2')
      activeRing.style.opacity = '0'
      activeRing.style.transition = 'opacity 0.2s'
      activeRing.classList.add('node-active-ring')
      g.appendChild(activeRing)

      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
      circle.setAttribute('r', String(r))
      circle.setAttribute('fill', nodeColorMap[n.type] || '#8c8c8c')
      circle.setAttribute('stroke', '#fff')
      circle.setAttribute('stroke-width', '2')
      circle.style.transition = 'r 0.2s, stroke-width 0.2s, opacity 0.2s'
      g.appendChild(circle)

      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text')
      text.setAttribute('text-anchor', 'middle')
      text.setAttribute('dy', String(r + 14))
      text.setAttribute('font-size', '11')
      text.setAttribute('fill', 'var(--td-text-color-secondary)')
      text.setAttribute('pointer-events', 'none')
      text.style.transition = 'opacity 0.2s'
      text.style.textShadow =
        '0 1px 3px var(--td-bg-color-container), 0 -1px 3px var(--td-bg-color-container), 1px 0 3px var(--td-bg-color-container), -1px 0 3px var(--td-bg-color-container)'
      text.textContent = n.title.length > 14 ? n.title.substring(0, 14) + '…' : n.title
      g.appendChild(text)

      g.addEventListener('mouseenter', () => {
        if (graphHoverLeaveTimerRef.current) {
          clearTimeout(graphHoverLeaveTimerRef.current)
          graphHoverLeaveTimerRef.current = null
        }
        if (!graphSelectedSlug) {
          if (graphHighlightSlug === n.slug) return
          setGraphHighlightSlug(n.slug)
          applyHighlight(n.slug, adjacency, nodeEls, edgeEls)
        } else if (graphSelectedSlug !== n.slug) {
          if (graphHighlightSlug === n.slug) return
          setGraphHighlightSlug(n.slug)
          applyHighlight(graphSelectedSlug, adjacency, nodeEls, edgeEls, n.slug)
        }
      })

      g.addEventListener('mouseleave', () => {
        if (graphHoverLeaveTimerRef.current) clearTimeout(graphHoverLeaveTimerRef.current)
        graphHoverLeaveTimerRef.current = setTimeout(() => {
          graphHoverLeaveTimerRef.current = null
          if (!graphSelectedSlug) {
            setGraphHighlightSlug(null)
            clearHighlight(nodeEls, edgeEls)
          } else {
            setGraphHighlightSlug(null)
            applyHighlight(graphSelectedSlug, adjacency, nodeEls, edgeEls)
          }
        }, 60)
      })

      g.addEventListener('click', (e) => {
        e.stopPropagation()

        setGraphSelectedSlug(n.slug)
        applyHighlight(n.slug, adjacency, nodeEls, edgeEls)

        if (graphPanZoomRef.current) {
          const container = graphRef.current
          if (container) {
            const width = container.clientWidth
            const height = container.clientHeight
            graphPanZoomRef.current.flyTo(
              width / 2 - n.x * graphPanZoomRef.current.getScale() - 240,
              height / 2 - n.y * graphPanZoomRef.current.getScale()
            )
          }
        }

        openGraphDrawer(n.slug)
      })

      setupDrag(g, n, nodeMap, edgeEls, nodeEls, nodeRadius)

      nodeG.appendChild(g)
      nodeEls.push({ g, circle, text, activeRing, node: n })
    }

    graphNodeElsRef.current = nodeEls
    graphEdgeElsRef.current = edgeEls

    setupPanZoom(svg, rootG)

    let alpha = 1.0
    function tick() {
      alpha *= 0.985
      if (alpha < 0.02) {
        graphAnimFrameRef.current = 0
        return
      }

      const sortedNodes = [...graphNodesRef.current].sort((a, b) => a.x - b.x)
      const MAX_REPULSION_DIST = 300
      const MAX_REPULSION_DIST_SQ = MAX_REPULSION_DIST * MAX_REPULSION_DIST

      for (let i = 0; i < sortedNodes.length; i++) {
        const n1 = sortedNodes[i]
        for (let j = i + 1; j < sortedNodes.length; j++) {
          const n2 = sortedNodes[j]
          const dx = n2.x - n1.x

          if (dx > MAX_REPULSION_DIST) break

          const dy = n2.y - n1.y
          if (Math.abs(dy) > MAX_REPULSION_DIST) continue

          const distSq = dx * dx + dy * dy
          if (distSq > MAX_REPULSION_DIST_SQ) continue

          const dist = Math.sqrt(distSq) || 1
          const force = (200 * alpha) / Math.max(distSq, 100) * 60
          const fx = (dx / dist) * force
          const fy = (dy / dist) * force

          if (!n1.pinned) {
            n1.vx -= fx
            n1.vy -= fy
          }
          if (!n2.pinned) {
            n2.vx += fx
            n2.vy += fy
          }
        }
      }

      for (const edge of data?.edges ?? []) {
        const s = nodeMap.get(edge.source)
        const t = nodeMap.get(edge.target)
        if (!s || !t) continue
        const dx = t.x - s.x
        const dy = t.y - s.y
        const dist = Math.sqrt(dx * dx + dy * dy) || 1
        const force = (dist - 120) * 0.005 * alpha
        const fx = (dx / dist) * force
        const fy = (dy / dist) * force
        if (!s.pinned) {
          s.vx += fx
          s.vy += fy
        }
        if (!t.pinned) {
          t.vx -= fx
          t.vy -= fy
        }
      }

      const gravityStrength = Math.min(0.01, 0.001 + graphNodesRef.current.length * 0.00002)
      for (const n of graphNodesRef.current) {
        if (n.pinned) continue
        n.vx += ((width / 2 - n.x) * gravityStrength * alpha)
        n.vy += ((height / 2 - n.y) * gravityStrength * alpha)
      }

      for (const n of graphNodesRef.current) {
        if (n.pinned) continue
        n.vx *= 0.6
        n.vy *= 0.6
        const v = Math.sqrt(n.vx * n.vx + n.vy * n.vy)
        if (v > 20) {
          n.vx = (n.vx / v) * 20
          n.vy = (n.vy / v) * 20
        }
        n.x += n.vx
        n.y += n.vy
      }

      for (const { g, node } of nodeEls) {
        g.setAttribute('transform', `translate(${node.x},${node.y})`)
      }
      for (const e of edgeEls) {
        const s = nodeMap.get(e.source)
        const t = nodeMap.get(e.target)
        if (s && t) {
          setEdgePositions(e.line, s, t, nodeRadius)
        }
      }

      graphAnimFrameRef.current = requestAnimationFrame(tick)
    }

    for (const { g, node } of nodeEls) {
      g.setAttribute('transform', `translate(${node.x},${node.y})`)
    }
    for (const e of edgeEls) {
      const s = nodeMap.get(e.source)
      const t = nodeMap.get(e.target)
      if (s && t) {
        setEdgePositions(e.line, s, t, nodeRadius)
      }
    }

    applyGraphFilters()

    graphAnimFrameRef.current = requestAnimationFrame(tick)
    setGraphReady(true)
  }

  function setEdgePositions(line: SVGLineElement, s: GNode, t: GNode, nodeRadiusFn: (n: GNode) => number) {
    const dx = t.x - s.x
    const dy = t.y - s.y
    const dist = Math.sqrt(dx * dx + dy * dy) || 1
    const ux = dx / dist
    const uy = dy / dist

    const rS = nodeRadiusFn(s) + 4
    const rT = nodeRadiusFn(t) + 4

    line.setAttribute('x1', String(s.x + ux * rS))
    line.setAttribute('y1', String(s.y + uy * rS))
    line.setAttribute('x2', String(t.x - ux * rT))
    line.setAttribute('y2', String(t.y - uy * rT))
  }

  function setupDrag(
    g: SVGGElement,
    node: GNode,
    nodeMap: Map<string, GNode>,
    edgeEls: EdgeEl[],
    _nodeEls: { g: SVGGElement; circle: SVGCircleElement; text: SVGTextElement; activeRing: SVGCircleElement; node: GNode }[],
    nodeRadiusFn: (n: GNode) => number
  ) {
    let dragging = false
    let startX = 0,
      startY = 0

    function getPoint(e: MouseEvent | Touch) {
      const svg = g.ownerSVGElement
      if (!svg) return { x: e.clientX, y: e.clientY }
      const pt = svg.createSVGPoint()
      pt.x = e.clientX
      pt.y = e.clientY
      const rootG = svg.querySelector('.graph-root') as SVGGElement
      const ctm = rootG?.getCTM()?.inverse()
      if (ctm) {
        const svgP = pt.matrixTransform(ctm)
        return { x: svgP.x, y: svgP.y }
      }
      return { x: e.clientX, y: e.clientY }
    }

    function onStart(e: MouseEvent) {
      if (e.button !== 0) return
      e.stopPropagation()
      dragging = true
      node.pinned = true
      const p = getPoint(e)
      startX = p.x - node.x
      startY = p.y - node.y
      g.querySelector('circle')?.setAttribute('stroke', nodeColorMap[node.type] || '#8c8c8c')
      g.querySelector('circle')?.setAttribute('stroke-width', '3')
      window.addEventListener('mousemove', onMove)
      window.addEventListener('mouseup', onEnd)
    }

    function onMove(e: MouseEvent) {
      if (!dragging) return
      const p = getPoint(e)
      node.x = p.x - startX
      node.y = p.y - startY
      node.vx = 0
      node.vy = 0
      g.setAttribute('transform', `translate(${node.x},${node.y})`)
      for (const edge of edgeEls) {
        if (edge.source === node.slug || edge.target === node.slug) {
          const sn = nodeMap.get(edge.source)
          const tn = nodeMap.get(edge.target)
          if (sn && tn) setEdgePositions(edge.line, sn, tn, nodeRadiusFn)
        }
      }
    }

    function onEnd() {
      dragging = false
      g.querySelector('circle')?.setAttribute('stroke', '#fff')
      g.querySelector('circle')?.setAttribute('stroke-width', '2')
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onEnd)
    }

    g.addEventListener('mousedown', onStart)
  }

  function setupPanZoom(svg: SVGSVGElement, rootG: SVGGElement) {
    let scale = 1
    let translateX = 0,
      translateY = 0
    let panning = false
    let panStartX = 0,
      panStartY = 0
    let dragStartX = 0,
      dragStartY = 0

    function applyTransform() {
      rootG.setAttribute('transform', `translate(${translateX},${translateY}) scale(${scale})`)
      updateLabelsVisibility()
    }

    function updateLabelsVisibility() {
      for (const { text, node } of graphNodeElsRef.current) {
        if (node.slug === graphSelectedSlug || node.slug === graphHighlightSlug) {
          text.style.opacity = '1'
          continue
        }

        let visibilityThreshold = 0.5

        if (node.linkCount > 10) visibilityThreshold = 0.2
        else if (node.linkCount > 5) visibilityThreshold = 0.35
        else if (node.linkCount > 2) visibilityThreshold = 0.45

        if (scale < visibilityThreshold) {
          text.style.opacity = '0'
        } else {
          text.style.opacity = '1'
        }
      }
    }

    let animId = 0
    graphPanZoomRef.current = {
      setScale: (s: number) => {
        scale = s
      },
      setTranslate: (x: number, y: number) => {
        translateX = x
        translateY = y
      },
      apply: applyTransform,
      getScale: () => scale,
      flyTo: (tx: number, ty: number, s?: number, duration = 400) => {
        cancelAnimationFrame(animId)
        const startX = translateX,
          startY = translateY,
          startScale = scale
        const targetScale = s || scale
        const startTime = performance.now()
        const animate = (time: number) => {
          let t = (time - startTime) / duration
          if (t > 1) t = 1
          const ease = 1 - Math.pow(1 - t, 3)
          translateX = startX + (tx - startX) * ease
          translateY = startY + (ty - startY) * ease
          scale = startScale + (targetScale - startScale) * ease
          applyTransform()
          if (t < 1) animId = requestAnimationFrame(animate)
        }
        animId = requestAnimationFrame(animate)
      },
    }

    svg.addEventListener(
      'wheel',
      (e) => {
        e.preventDefault()
        const zoomFactor = e.deltaY > 0 ? 0.92 : 1.08
        const newScale = Math.max(0.2, Math.min(5, scale * zoomFactor))

        const rect = svg.getBoundingClientRect()
        const cx = e.clientX - rect.left
        const cy = e.clientY - rect.top
        translateX = cx - (cx - translateX) * (newScale / scale)
        translateY = cy - (cy - translateY) * (newScale / scale)
        scale = newScale
        applyTransform()
      },
      { passive: false }
    )

    svg.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return
      if ((e.target as Element).tagName === 'svg' || (e.target as Element).tagName === 'SVG') {
        panning = true
        panStartX = e.clientX - translateX
        panStartY = e.clientY - translateY
        dragStartX = e.clientX
        dragStartY = e.clientY
        svg.style.cursor = 'grabbing'
      }
    })

    window.addEventListener('mousemove', (e) => {
      if (!panning) return
      translateX = e.clientX - panStartX
      translateY = e.clientY - panStartY
      applyTransform()
    })

    window.addEventListener('mouseup', (e) => {
      if (panning) {
        panning = false
        svg.style.cursor = 'default'

        const dx = e.clientX - dragStartX
        const dy = e.clientY - dragStartY
        if (Math.abs(dx) < 5 && Math.abs(dy) < 5) {
          if ((e.target as Element).tagName === 'svg' || (e.target as Element).tagName === 'SVG') {
            setGraphSelectedSlug(null)
            setGraphDrawerVisible(false)
            clearHighlight(graphNodeElsRef.current, graphEdgeElsRef.current)
          }
        }
      }
    })
  }

  function applyHighlight(
    slug: string,
    adjacency: Map<string, Set<string>>,
    nodeEls: { g: SVGGElement; circle: SVGCircleElement; text: SVGTextElement; activeRing: SVGCircleElement; node: GNode }[],
    edgeEls: EdgeEl[],
    hoverSlug?: string
  ) {
    const neighbors = adjacency.get(slug) || new Set()
    const hoverNeighbors = hoverSlug ? adjacency.get(hoverSlug) || new Set() : new Set()

    const getRadius = (n: GNode) => Math.max(8, Math.min(24, 8 + Math.log(n.linkCount + 1) * 4))

    for (const { g, circle, activeRing, node } of nodeEls) {
      const r = getRadius(node)
      if (node.slug === slug) {
        circle.setAttribute('r', String(r + 3))
        circle.setAttribute('stroke-width', '3')
        g.style.opacity = '1'
      } else if (hoverSlug && node.slug === hoverSlug) {
        circle.setAttribute('r', String(r + 3))
        circle.setAttribute('stroke-width', '3')
        g.style.opacity = '1'
      } else if (neighbors.has(node.slug) || (hoverSlug && hoverNeighbors.has(node.slug))) {
        circle.setAttribute('r', String(r))
        circle.setAttribute('stroke-width', '2')
        g.style.opacity = '1'
      } else {
        circle.setAttribute('r', String(r))
        circle.setAttribute('stroke-width', '2')
        g.style.opacity = '0.2'
      }

      if (node.slug === graphSelectedSlug) {
        activeRing.style.opacity = '1'
      } else {
        activeRing.style.opacity = '0'
      }
    }

    for (const e of edgeEls) {
      if (e.source === slug || e.target === slug || (hoverSlug && (e.source === hoverSlug || e.target === hoverSlug))) {
        e.line.setAttribute('stroke-opacity', '0.9')
        e.line.setAttribute('stroke-width', '2')

        const focusSlug = hoverSlug && (e.source === hoverSlug || e.target === hoverSlug) ? hoverSlug : slug
        const hlColor = nodeColorMap[nodeEls.find((n) => n.node.slug === focusSlug)?.node.type || ''] || '#0052d9'

        e.line.setAttribute('stroke', hlColor)
        e.line.setAttribute('marker-end', 'url(#arrow-end-hl)')
        if (e.bidir) e.line.setAttribute('marker-start', 'url(#arrow-start-hl)')
      } else {
        e.line.setAttribute('stroke-opacity', '0.08')
        e.line.setAttribute('stroke-width', '1')
        e.line.setAttribute('marker-end', 'url(#arrow-end)')
        if (e.bidir) e.line.setAttribute('marker-start', 'url(#arrow-start)')
        else e.line.removeAttribute('marker-start')
      }
    }
  }

  function clearHighlight(
    nodeEls: { g: SVGGElement; circle: SVGCircleElement; text: SVGTextElement; activeRing: SVGCircleElement; node: GNode }[],
    edgeEls: EdgeEl[]
  ) {
    if (graphSelectedSlug) {
      applyHighlight(graphSelectedSlug, graphAdjacencyRef.current, nodeEls, edgeEls)
      return
    }

    const getRadius = (n: GNode) => Math.max(8, Math.min(24, 8 + Math.log(n.linkCount + 1) * 4))

    for (const { g, circle, activeRing, node } of nodeEls) {
      circle.setAttribute('r', String(getRadius(node)))
      circle.setAttribute('stroke-width', '2')
      g.style.opacity = '1'
      activeRing.style.opacity = '0'
    }
    for (const e of edgeEls) {
      e.line.setAttribute('stroke', '#c0c4cc')
      e.line.setAttribute('stroke-width', '1.2')
      e.line.setAttribute('stroke-opacity', '0.4')
      e.line.setAttribute('marker-end', 'url(#arrow-end)')
      if (e.bidir) e.line.setAttribute('marker-start', 'url(#arrow-start)')
      else e.line.removeAttribute('marker-start')
    }
  }

  async function navigateToSlugAndFix(slug: string) {
    setShowGlobalIssuesDrawer(false)
    if (view === 'graph') {
      handleGraphSearchSelect(slug)
    } else {
      await navigateToSlug(slug)
      setShowIssuesBox(true)
    }
  }

  // Effects
  useEffect(() => {
    loadPages()
    loadStats()
    if (view === 'graph') {
      loadGraph()
    }
  }, [knowledgeBaseId])

  useEffect(() => {
    if (view === 'graph') {
      loadGraph()
    }
  }, [view])

  useEffect(() => {
    if (showGlobalIssuesDrawer) {
      listWikiIssues(knowledgeBaseId, '', 'pending')
        .then((res) => {
          setGlobalIssues((res as any).data || res as any || [])
        })
        .catch((e) => {
          console.error('Failed to load global wiki issues:', e)
          setGlobalIssues([])
        })
    }
  }, [showGlobalIssuesDrawer])

  useEffect(() => {
    return () => {
      if (statsTimerRef.current) {
        clearInterval(statsTimerRef.current)
      }
      if (graphHoverLeaveTimerRef.current) {
        clearTimeout(graphHoverLeaveTimerRef.current)
      }
      if (graphAnimFrameRef.current) {
        cancelAnimationFrame(graphAnimFrameRef.current)
      }
    }
  }, [])

  // Graph View
  if (view === 'graph') {
    return (
      <div className="wiki-browser flex h-full min-h-0 bg-[var(--td-bg-color-container)]">
        <div className="wiki-graph flex-1 relative overflow-hidden w-full h-full">
          <div ref={graphRef} className="wiki-graph-canvas w-full h-full min-h-[500px]" />

          {/* Graph Search Overlay */}
          {graphReady && (
            <div className="wiki-graph-search-container absolute top-4 left-4 flex flex-col gap-3 z-10 w-[280px]">
              <div className="w-full shadow rounded bg-[var(--td-bg-color-container)] opacity-95">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--td-text-color-placeholder)]" />
                  <Input
                    value={graphSearchValue}
                    onChange={(e) => setGraphSearchValue(e.target.value)}
                    placeholder={t('knowledgeEditor.wikiBrowser.searchPlaceholder') || 'Search pages...'}
                    className="pl-9"
                  />
                  {graphSearchOptions.length > 0 && graphSearchValue && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--td-bg-color-container)] border border-[var(--td-border-level-1-color)] rounded shadow-lg max-h-60 overflow-y-auto z-50">
                      {graphSearchOptions
                        .filter((opt) =>
                          opt.label.toLowerCase().includes(graphSearchValue.toLowerCase()) ||
                          opt.value.toLowerCase().includes(graphSearchValue.toLowerCase())
                        )
                        .slice(0, 10)
                        .map((opt) => (
                          <div
                            key={opt.value}
                            className="px-3 py-2 cursor-pointer hover:bg-[var(--td-bg-color-container-hover)]"
                            onClick={() => handleGraphSearchSelect(opt.value)}
                          >
                            {opt.label}
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>
              {stats && stats.pending_issues > 0 && (
                <div
                  className="wiki-global-issues-status graph-issues-badge flex items-center gap-2 px-3 py-2 bg-[var(--td-warning-color-light)] rounded cursor-pointer opacity-95 shadow"
                  onClick={() => setShowGlobalIssuesDrawer(true)}
                >
                  <AlertCircle className="w-4 h-4 text-[var(--td-warning-color)]" />
                  <span className="text-sm font-medium text-[var(--td-warning-color-8)]">
                    {t('knowledgeEditor.wikiBrowser.globalIssuesCount', { count: stats.pending_issues })}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Legend Overlay */}
          {graphReady && (
            <div className="wiki-graph-legend absolute top-4 right-4 bg-[var(--td-bg-color-container)] border border-[var(--td-component-stroke)] rounded-md p-3 shadow flex flex-col gap-3 z-10 opacity-95">
              <div className="flex flex-col gap-2">
                {[
                  { type: 'summary', color: '#0052d9', label: t('knowledgeEditor.wikiBrowser.filterSummary') },
                  { type: 'entity', color: '#2ba471', label: t('knowledgeEditor.wikiBrowser.filterEntity') },
                  { type: 'concept', color: '#e37318', label: t('knowledgeEditor.wikiBrowser.filterConcept') },
                  { type: 'synthesis', color: '#0594fa', label: t('knowledgeEditor.wikiBrowser.filterSynthesis') },
                  { type: 'comparison', color: '#d54941', label: t('knowledgeEditor.wikiBrowser.filterComparison') },
                ].map(({ type, color, label }) => (
                  <div
                    key={type}
                    className={cn(
                      'legend-item flex items-center gap-2 text-xs cursor-pointer transition-colors',
                      graphFilterTypes.has(type)
                        ? 'text-[var(--td-text-color-secondary)]'
                        : 'text-[var(--td-text-color-placeholder)] line-through opacity-50'
                    )}
                    onClick={() => toggleGraphFilterType(type)}
                  >
                    <span className="legend-dot w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
                    {label}
                  </div>
                ))}
              </div>
              <div className="h-px bg-[var(--td-component-stroke)] -mx-3" />
              <div className="flex flex-col gap-2">
                <div
                  className="legend-action flex items-center gap-1.5 text-xs cursor-pointer text-[var(--td-text-color-secondary)] hover:text-[var(--td-brand-color)] transition-colors"
                  onClick={fitGraphToView}
                >
                  <Focus className="w-3.5 h-3.5" />
                  <span>{t('knowledgeEditor.wikiBrowser.fitView') || '适应屏幕'}</span>
                </div>
                <div
                  className="legend-action flex items-center gap-1.5 text-xs cursor-pointer text-[var(--td-text-color-secondary)] hover:text-[var(--td-brand-color)] transition-colors"
                  onClick={toggleArrows}
                >
                  {showArrows ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showArrows ? t('knowledgeEditor.wikiBrowser.hideArrows') : t('knowledgeEditor.wikiBrowser.showArrows')}</span>
                </div>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!graphReady && (
            <div className="wiki-reader-empty wiki-graph-empty absolute top-0 left-0 w-full h-full z-20 bg-[var(--td-bg-color-container)] flex flex-col items-center justify-center">
              {graphLoading ? (
                <Loader2 className="w-8 h-8 animate-spin text-[var(--td-brand-color)]" />
              ) : (
                <>
                  <div className="w-16 h-16 rounded-full bg-[var(--td-bg-color-secondarycontainer)] flex items-center justify-center mb-4">
                    <CircleDot className="w-8 h-8 text-[var(--td-text-color-placeholder)]" />
                  </div>
                  <p className="text-[var(--td-text-color-placeholder)]">
                    {graphLoading
                      ? t('knowledgeEditor.wikiBrowser.graphEmpty')
                      : t('knowledgeEditor.wikiBrowser.graphNoData')}
                  </p>
                </>
              )}
            </div>
          )}

          {/* Graph Page Detail Drawer */}
          <Sheet open={graphDrawerVisible} onOpenChange={setGraphDrawerVisible}>
            <SheetContent side="right" className="w-[480px] wiki-graph-drawer">
              <SheetHeader>
                <SheetTitle>{graphDrawerPage?.title || ''}</SheetTitle>
              </SheetHeader>
              <div className="p-4 overflow-y-auto">
                {graphDrawerPage && (
                  <>
                    <div className="flex items-center gap-2 mb-4">
                      <Badge
                        variant="outline"
                        theme={
                          graphDrawerPage.page_type === 'summary'
                            ? 'primary'
                            : graphDrawerPage.page_type === 'entity'
                              ? 'success'
                              : graphDrawerPage.page_type === 'concept'
                                ? 'warning'
                                : 'secondary'
                        }
                      >
                        {getTypeLabel(graphDrawerPage.page_type)}
                      </Badge>
                      <span className="text-sm text-[var(--td-text-color-placeholder)]">
                        {t('knowledgeEditor.wikiBrowser.version', { ver: graphDrawerPage.version })}
                      </span>
                    </div>
                    <div
                      ref={drawerBodyRef}
                      className="wiki-reader-body prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: graphDrawerContent }}
                      onClick={handleGraphDrawerClick}
                    />
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>

          {/* Global Issues Drawer in Graph View */}
          <Sheet open={showGlobalIssuesDrawer} onOpenChange={setShowGlobalIssuesDrawer}>
            <SheetContent side="right" className="w-[480px]">
              <SheetHeader>
                <SheetTitle>{t('knowledgeEditor.wikiBrowser.globalIssuesTitle')}</SheetTitle>
              </SheetHeader>
              <div className="p-4 overflow-y-auto">
                <div className="flex flex-col gap-3">
                  {globalIssues.map((issue) => (
                    <div key={issue.id} className="wiki-issue-popup-item border border-[var(--td-component-border)] rounded-md p-4">
                      <div className="flex flex-col gap-2">
                        <div className="flex flex-wrap gap-2">
                          {issue.issue_type === 'mixed_entities' && (
                            <Badge theme="warning" variant="light">
                              {t('knowledgeEditor.wikiBrowser.issueMixed')}
                            </Badge>
                          )}
                          {issue.issue_type === 'contradictory_facts' && (
                            <Badge theme="danger" variant="light">
                              {t('knowledgeEditor.wikiBrowser.issueConflict')}
                            </Badge>
                          )}
                          {issue.issue_type === 'out_of_date' && (
                            <Badge variant="light">
                              {t('knowledgeEditor.wikiBrowser.issueOutdated')}
                            </Badge>
                          )}
                          {!['mixed_entities', 'contradictory_facts', 'out_of_date'].includes(issue.issue_type) && (
                            <Badge theme="primary" variant="light">
                              {t('knowledgeEditor.wikiBrowser.issueAttention')}
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm">
                          <div
                            className="font-medium text-[var(--td-brand-color)] cursor-pointer flex items-center gap-1 mb-1"
                            onClick={() => navigateToSlugAndFix(issue.slug)}
                          >
                            <Link className="w-3 h-3" />
                            {t('knowledgeEditor.wikiBrowser.issuePagePrefix')}
                            {slugDisplayName(issue.slug)}
                          </div>
                          <div className="text-[var(--td-text-color-primary)] whitespace-pre-wrap">{issue.description}</div>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-dashed border-[var(--td-component-stroke)]">
                          <span className="text-xs text-[var(--td-text-color-placeholder)]">
                            {issue.reported_by === 'wiki-researcher-agent'
                              ? t('knowledgeEditor.wikiBrowser.issueAiLinter')
                              : t('knowledgeEditor.wikiBrowser.issueReportedBy', { reporter: issue.reported_by })}
                          </span>
                          <div className="flex items-center gap-3">
                            <span
                              className="text-sm font-medium text-[var(--td-brand-color)] cursor-pointer flex items-center gap-1"
                              onClick={() => navigateToSlugAndFix(issue.slug)}
                            >
                              <ArrowRightCircle className="w-3.5 h-3.5" />
                              {t('knowledgeEditor.wikiBrowser.issueGoFix')}
                            </span>
                            <span
                              className="text-sm text-[var(--td-text-color-placeholder)] cursor-pointer hover:opacity-80"
                              onClick={() => handleGlobalIssueIgnore(issue.id)}
                            >
                              {t('knowledgeEditor.wikiBrowser.issueIgnore')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {globalIssues.length === 0 && (
                    <div className="py-10 text-center text-[var(--td-text-color-placeholder)]">
                      {t('knowledgeEditor.wikiBrowser.globalIssuesEmpty')}
                    </div>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    )
  }

  // Browser View
  return (
    <div className="wiki-browser flex h-full min-h-0 bg-[var(--td-bg-color-container)]">
      {/* Left Sidebar */}
      <aside className="wiki-sidebar w-[280px] min-w-[240px] border-r border-[var(--td-component-stroke)] flex flex-col flex-shrink-0 bg-[var(--td-bg-color-container)]">
        <div className="wiki-sidebar-header p-4 pb-3 flex flex-col gap-3">
          {(stats?.pending_tasks ?? 0) > 0 || stats?.is_active ? (
            <div className="wiki-queue-status flex items-center gap-2 px-3 py-2 bg-[var(--td-bg-color-secondarycontainer)] rounded text-sm text-[var(--td-text-color-secondary)]">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="leading-tight">
                {t('knowledgeEditor.wikiBrowser.queueStatus', { count: stats?.pending_tasks || 0 })}
              </span>
            </div>
          ) : null}
          {stats && stats.pending_issues > 0 && (
            <div
              className="wiki-global-issues-status flex items-center gap-2 px-3 py-2 bg-[var(--td-warning-color-light)] rounded cursor-pointer hover:brightness-95 transition-all text-sm"
              onClick={() => setShowGlobalIssuesDrawer(true)}
            >
              <AlertCircle className="w-4 h-4 text-[var(--td-warning-color)]" />
              <span className="font-medium text-[var(--td-warning-color-8)] leading-tight">
                {t('knowledgeEditor.wikiBrowser.globalIssuesCount', { count: stats.pending_issues })}
              </span>
            </div>
          )}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--td-text-color-placeholder)]" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && doSearch()}
              placeholder={t('knowledgeEditor.wikiBrowser.searchPlaceholder') || 'Search pages...'}
              className="pl-9"
            />
          </div>
        </div>

        <div className="wiki-page-list flex-1 overflow-y-auto px-3 pb-3">
          {/* Index page */}
          {indexPage && (
            <div
              className={cn(
                'wiki-nav-item flex items-center gap-2 px-3 py-2 rounded cursor-pointer mb-1 transition-all',
                selectedPage?.id === indexPage.id
                  ? 'bg-[var(--td-brand-color-light)]'
                  : 'hover:bg-[var(--td-bg-color-container-hover)]'
              )}
              onClick={() => selectPage(indexPage)}
            >
              <BookOpen className="w-4 h-4 text-[var(--td-text-color-secondary)]" />
              <span className="text-sm font-medium text-[var(--td-text-color-primary)]">
                {t('knowledgeEditor.wikiBrowser.indexTitle')}
              </span>
            </div>
          )}

          {/* Log page */}
          {logPage && (
            <div
              className={cn(
                'wiki-nav-item flex items-center gap-2 px-3 py-2 rounded cursor-pointer mb-1 transition-all',
                selectedPage?.id === logPage.id
                  ? 'bg-[var(--td-brand-color-light)]'
                  : 'hover:bg-[var(--td-bg-color-container-hover)]'
              )}
              onClick={() => selectPage(logPage)}
            >
              <History className="w-4 h-4 text-[var(--td-text-color-secondary)]" />
              <span className="text-sm font-medium text-[var(--td-text-color-primary)]">
                {t('knowledgeEditor.wikiBrowser.logTitle')}
              </span>
            </div>
          )}

          {(indexPage || logPage) && <div className="h-px bg-[var(--td-component-stroke)] my-2 mx-3" />}

          {/* Grouped pages */}
          {groupedPages.map((group) => (
            <div key={group.type}>
              <div
                className="wiki-group-label flex items-center gap-1.5 px-2 py-3 pb-2 text-xs font-medium text-[var(--td-text-color-secondary)] cursor-pointer sticky top-0 z-10 bg-[var(--td-bg-color-container)] hover:text-[var(--td-text-color-primary)] transition-colors"
                onClick={() => toggleGroup(group.type)}
              >
                {collapsedGroups[group.type] ? (
                  <ChevronRight className="w-3.5 h-3.5 text-[var(--td-text-color-placeholder)]" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-[var(--td-text-color-placeholder)]" />
                )}
                {group.label}
                <span className="ml-auto text-xs text-[var(--td-text-color-placeholder)] bg-[var(--td-bg-color-secondarycontainer)] rounded-full px-2 py-0.5">
                  {group.pages.length}
                </span>
              </div>
              {!collapsedGroups[group.type] &&
                group.pages.map((page) => (
                  <div
                    key={page.id}
                    className={cn(
                      'wiki-page-item px-3 py-2.5 rounded cursor-pointer mb-0.5 transition-all',
                      selectedPage?.id === page.id
                        ? 'bg-[var(--td-brand-color-light)]'
                        : 'hover:bg-[var(--td-bg-color-container-hover)]'
                    )}
                    onClick={() => selectPage(page)}
                  >
                    <div className="text-sm font-medium text-[var(--td-text-color-primary)] truncate mb-1">
                      {page.title}
                    </div>
                    <div className="text-xs text-[var(--td-text-color-secondary)] line-clamp-2 mb-1.5">
                      {page.summary}
                    </div>
                    <div className="text-xs text-[var(--td-text-color-placeholder)]">{formatDate(page.updated_at)}</div>
                  </div>
                ))}
            </div>
          ))}

          {/* Empty state */}
          {contentPages.length === 0 && !loading && (
            <div className="wiki-empty-state flex flex-col items-center justify-center py-10 text-center">
              <div className="w-16 h-16 rounded-full bg-[var(--td-bg-color-secondarycontainer)] flex items-center justify-center mb-4">
                <FileText className="w-6 h-6 text-[var(--td-text-color-placeholder)]" />
              </div>
              <p className="text-sm font-medium text-[var(--td-text-color-secondary)] mb-1">
                {t('knowledgeEditor.wikiBrowser.emptyTitle')}
              </p>
              <p className="text-xs text-[var(--td-text-color-placeholder)]">
                {t('knowledgeEditor.wikiBrowser.emptyDesc')}
              </p>
            </div>
          )}
        </div>
      </aside>

      {/* Right Content */}
      <div className="wiki-content flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="wiki-reader flex-1 overflow-y-auto px-6 py-4">
          <div className="wiki-reader-inner w-full">
            {selectedPage ? (
              <>
                {/* Navigation */}
                {navHistory.length > 0 && (
                  <div className="wiki-nav-bar mb-4">
                    <a
                      href="#"
                      className="wiki-nav-back inline-flex items-center gap-1 text-sm text-[var(--td-text-color-secondary)] no-underline px-2 py-1 -ml-2 rounded hover:text-[var(--td-brand-color)] hover:bg-[var(--td-bg-color-container-hover)] transition-all"
                      onClick={(e) => {
                        e.preventDefault()
                        goBack()
                      }}
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>{navHistory[navHistory.length - 1].title}</span>
                    </a>
                  </div>
                )}

                {/* Page header */}
                <div className="wiki-reader-header mb-4">
                  <h2 className="text-2xl font-semibold text-[var(--td-text-color-primary)] mb-3 flex items-center">
                    {selectedPage.title}
                    {pageIssues.length > 0 && (
                      <Popover open={showIssuesBox} onOpenChange={setShowIssuesBox}>
                        <PopoverTrigger asChild>
                          <span className="wiki-issue-trigger ml-2 cursor-pointer flex items-center justify-center text-xl transition-opacity hover:opacity-80">
                            <AlertCircle className="w-5 h-5 text-[var(--td-warning-color)]" />
                          </span>
                        </PopoverTrigger>
                        <PopoverContent className="w-[560px] max-w-[90vw] p-0" align="start">
                          <div className="wiki-issue-popup-content">
                            <div className="wiki-issue-popup-header flex items-center justify-between px-4 py-3 bg-[var(--td-bg-color-secondarycontainer)] border-b border-[var(--td-component-stroke)]">
                              <span className="font-medium text-sm text-[var(--td-text-color-primary)]">
                                {t('knowledgeEditor.wikiBrowser.issueFixSuggestions', { count: pageIssues.length })}
                              </span>
                              <Button size="sm" onClick={triggerAutoFix}>
                                <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                                {t('knowledgeEditor.wikiBrowser.issueFixBtn')}
                              </Button>
                            </div>
                            <div className="max-h-[400px] overflow-y-auto p-3 flex flex-col gap-3">
                              {pageIssues.map((issue) => (
                                <div
                                  key={issue.id}
                                  className="wiki-issue-popup-item border border-[var(--td-component-border)] rounded-md p-4"
                                >
                                  <div className="flex flex-col gap-2">
                                    <div className="flex flex-wrap gap-2">
                                      {issue.issue_type === 'mixed_entities' && (
                                        <Badge theme="warning" variant="light">
                                          {t('knowledgeEditor.wikiBrowser.issueMixed')}
                                        </Badge>
                                      )}
                                      {issue.issue_type === 'contradictory_facts' && (
                                        <Badge theme="danger" variant="light">
                                          {t('knowledgeEditor.wikiBrowser.issueConflict')}
                                        </Badge>
                                      )}
                                      {issue.issue_type === 'out_of_date' && (
                                        <Badge variant="light">
                                          {t('knowledgeEditor.wikiBrowser.issueOutdated')}
                                        </Badge>
                                      )}
                                      {!['mixed_entities', 'contradictory_facts', 'out_of_date'].includes(
                                        issue.issue_type
                                      ) && (
                                        <Badge theme="primary" variant="light">
                                          {t('knowledgeEditor.wikiBrowser.issueAttention')}
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="text-sm text-[var(--td-text-color-primary)] whitespace-pre-wrap">
                                      {issue.description}
                                    </div>
                                    <div className="flex items-center justify-between pt-2 border-t border-dashed border-[var(--td-component-stroke)]">
                                      <span className="text-xs text-[var(--td-text-color-placeholder)]">
                                        {issue.reported_by === 'wiki-researcher-agent'
                                          ? t('knowledgeEditor.wikiBrowser.issueAiLinter')
                                          : t('knowledgeEditor.wikiBrowser.issueReportedBy', {
                                              reporter: issue.reported_by,
                                            })}
                                      </span>
                                      <div className="flex items-center gap-3">
                                        <span
                                          className="text-sm font-medium text-[var(--td-brand-color)] cursor-pointer flex items-center gap-1"
                                          onClick={() => triggerFixIssue(issue)}
                                        >
                                          <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                                          {t('knowledgeEditor.wikiBrowser.issueFixSingle')}
                                        </span>
                                        <span
                                          className="text-sm text-[var(--td-text-color-placeholder)] cursor-pointer hover:opacity-80"
                                          onClick={() => handleIssueIgnore(issue.id)}
                                        >
                                          {t('knowledgeEditor.wikiBrowser.issueIgnore')}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    )}
                  </h2>

                  {/* Aliases */}
                  {selectedPage.aliases && selectedPage.aliases.length > 0 && (
                    <div className="flex items-center flex-wrap gap-x-2 gap-y-1 mb-2.5 text-sm">
                      <span className="text-[var(--td-text-color-placeholder)]">
                        {t('knowledgeEditor.wikiBrowser.aliases')}:
                      </span>
                      {selectedPage.aliases.map((alias) => (
                        <Badge key={alias} variant="light" className="text-xs">
                          {alias}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Meta */}
                  <div className="flex items-center gap-3">
                    <Badge
                      variant="outline"
                      theme={
                        selectedPage.page_type === 'summary'
                          ? 'primary'
                          : selectedPage.page_type === 'entity'
                            ? 'success'
                            : selectedPage.page_type === 'concept'
                              ? 'warning'
                              : 'secondary'
                      }
                    >
                      {getTypeLabel(selectedPage.page_type)}
                    </Badge>
                    <span className="text-sm text-[var(--td-text-color-placeholder)]">
                      {t('knowledgeEditor.wikiBrowser.version', { ver: selectedPage.version })}
                    </span>
                    <span className="text-sm text-[var(--td-text-color-placeholder)]">
                      {formatDate(selectedPage.updated_at)}
                    </span>
                  </div>
                </div>

                {/* Backlinks */}
                {selectedPage.in_links && selectedPage.in_links.length > 0 && (
                  <div className="wiki-reader-backlinks flex flex-wrap items-center gap-2 pb-4 mb-6 border-b border-[var(--td-component-stroke)]">
                    <span className="inline-flex items-center gap-1 text-sm text-[var(--td-text-color-placeholder)] font-medium mr-1">
                      <Link className="w-3.5 h-3.5" />
                      {t('knowledgeEditor.wikiBrowser.linkedFrom')}
                    </span>
                    {selectedPage.in_links.map((link) => (
                      <a
                        key={'in-' + link}
                        href="#"
                        className="wiki-backlink-tag text-sm px-2 py-0.5 bg-[var(--td-bg-color-secondarycontainer)] rounded text-[var(--td-text-color-secondary)] no-underline hover:text-[var(--td-brand-color)] hover:bg-[var(--td-brand-color-light)] transition-all"
                        onClick={(e) => {
                          e.preventDefault()
                          navigateToSlug(link)
                        }}
                      >
                        {slugDisplayName(link)}
                      </a>
                    ))}
                  </div>
                )}

                {/* Content */}
                <div
                  ref={readerBodyRef}
                  className="wiki-reader-body"
                  dangerouslySetInnerHTML={{ __html: renderedContent }}
                  onClick={handleContentClick}
                />

                {/* Source refs */}
                {parsedSourceRefs.length > 0 && (
                  <div className="wiki-reader-sources mt-6 pt-4 border-t border-[var(--td-component-stroke)] flex flex-wrap items-center gap-2 text-sm">
                    <span className="text-[var(--td-text-color-secondary)] font-medium">
                      {t('knowledgeEditor.wikiBrowser.sources')}
                    </span>
                    {parsedSourceRefs.map((ref) => (
                      <a
                        key={ref.id}
                        href="#"
                        className="wiki-source-ref inline-flex items-center gap-1 px-2.5 py-0.5 bg-[var(--td-bg-color-secondarycontainer)] rounded text-[var(--td-brand-color)] text-xs no-underline hover:bg-[var(--td-brand-color-light)] transition-all"
                        onClick={(e) => {
                          e.preventDefault()
                          onOpenSourceDoc?.(ref.id)
                        }}
                      >
                        <File className="w-3.5 h-3.5" />
                        {ref.title}
                      </a>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="wiki-reader-empty flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-full bg-[var(--td-bg-color-secondarycontainer)] flex items-center justify-center mb-4">
                  <BookOpen className="w-8 h-8 text-[var(--td-text-color-placeholder)]" />
                </div>
                {contentPages.length > 0 ? (
                  <p className="text-sm font-medium text-[var(--td-text-color-secondary)]">
                    {t('knowledgeEditor.wikiBrowser.selectPageHint')}
                  </p>
                ) : (
                  <>
                    <p className="text-sm font-medium text-[var(--td-text-color-secondary)] mb-1">
                      {t('knowledgeEditor.wikiBrowser.emptyTitle')}
                    </p>
                    <p className="text-xs text-[var(--td-text-color-placeholder)]">
                      {t('knowledgeEditor.wikiBrowser.emptyDesc')}
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Image Preview */}
      <PicturePreview visible={imagePreviewVisible} imageUrl={imagePreviewUrl} onClose={closeImagePreview} />

      {/* Global Issues Drawer */}
      <Sheet open={showGlobalIssuesDrawer} onOpenChange={setShowGlobalIssuesDrawer}>
        <SheetContent side="right" className="w-[480px]">
          <SheetHeader>
            <SheetTitle>{t('knowledgeEditor.wikiBrowser.globalIssuesTitle')}</SheetTitle>
          </SheetHeader>
          <div className="p-4 overflow-y-auto">
            <div className="flex flex-col gap-3">
              {globalIssues.map((issue) => (
                <div key={issue.id} className="wiki-issue-popup-item border border-[var(--td-component-border)] rounded-md p-4">
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-wrap gap-2">
                      {issue.issue_type === 'mixed_entities' && (
                        <Badge theme="warning" variant="light">
                          {t('knowledgeEditor.wikiBrowser.issueMixed')}
                        </Badge>
                      )}
                      {issue.issue_type === 'contradictory_facts' && (
                        <Badge theme="danger" variant="light">
                          {t('knowledgeEditor.wikiBrowser.issueConflict')}
                        </Badge>
                      )}
                      {issue.issue_type === 'out_of_date' && (
                        <Badge variant="light">{t('knowledgeEditor.wikiBrowser.issueOutdated')}</Badge>
                      )}
                      {!['mixed_entities', 'contradictory_facts', 'out_of_date'].includes(issue.issue_type) && (
                        <Badge theme="primary" variant="light">
                          {t('knowledgeEditor.wikiBrowser.issueAttention')}
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm">
                      <div
                        className="font-medium text-[var(--td-brand-color)] cursor-pointer flex items-center gap-1 mb-1"
                        onClick={() => navigateToSlugAndFix(issue.slug)}
                      >
                        <Link className="w-3 h-3" />
                        {t('knowledgeEditor.wikiBrowser.issuePagePrefix')}
                        {slugDisplayName(issue.slug)}
                      </div>
                      <div className="text-[var(--td-text-color-primary)] whitespace-pre-wrap">{issue.description}</div>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-dashed border-[var(--td-component-stroke)]">
                      <span className="text-xs text-[var(--td-text-color-placeholder)]">
                        {issue.reported_by === 'wiki-researcher-agent'
                          ? t('knowledgeEditor.wikiBrowser.issueAiLinter')
                          : t('knowledgeEditor.wikiBrowser.issueReportedBy', { reporter: issue.reported_by })}
                      </span>
                      <div className="flex items-center gap-3">
                        <span
                          className="text-sm font-medium text-[var(--td-brand-color)] cursor-pointer flex items-center gap-1"
                          onClick={() => navigateToSlugAndFix(issue.slug)}
                        >
                          <ArrowRightCircle className="w-3.5 h-3.5" />
                          {t('knowledgeEditor.wikiBrowser.issueGoFix')}
                        </span>
                        <span
                          className="text-sm text-[var(--td-text-color-placeholder)] cursor-pointer hover:opacity-80"
                          onClick={() => handleGlobalIssueIgnore(issue.id)}
                        >
                          {t('knowledgeEditor.wikiBrowser.issueIgnore')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {globalIssues.length === 0 && (
                <div className="py-10 text-center text-[var(--td-text-color-placeholder)]">
                  {t('knowledgeEditor.wikiBrowser.globalIssuesEmpty')}
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Fix Chat Drawer */}
      <Sheet open={showFixDrawer} onOpenChange={setShowFixDrawer}>
        <SheetContent side="right" className="w-[700px] wiki-fix-drawer">
          <SheetHeader>
            <SheetTitle>{t('knowledgeEditor.wikiBrowser.fixAssistantTitle')}</SheetTitle>
          </SheetHeader>
          <div className="p-5 h-full overflow-hidden">
            {currentFixSessionId && (
              <div className="h-full flex flex-col">
                <div className="text-sm text-[var(--td-text-color-secondary)] mb-2">
                  {t('knowledgeEditor.wikiBrowser.fixAssistantDesc') || 'Chat session created. Connect to chat component to enable full functionality.'}
                </div>
                <div className="flex-1 bg-[var(--td-bg-color-secondarycontainer)] rounded flex items-center justify-center">
                  <p className="text-sm text-[var(--td-text-color-placeholder)]">
                    Session ID: {currentFixSessionId}
                  </p>
                </div>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}