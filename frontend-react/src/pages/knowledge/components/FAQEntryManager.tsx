import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useUIStore } from '@/stores/uiStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import {
  Search,
  Plus,
  Download,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  Edit,
  Trash2,
  X,
  Check,
  Upload,
  FileText,
  Settings,
  Loader2,
  CheckCircle,
  AlertCircle,
  Clock,
} from 'lucide-react'
import {
  listFAQEntries,
  createFAQEntry,
  updateFAQEntry,
  updateFAQEntryFieldsBatch,
  deleteFAQEntries,
  searchFAQEntries,
  exportFAQEntries,
  listKnowledgeTags,
  updateFAQEntryTagBatch,
  createKnowledgeBaseTag,
  updateKnowledgeBaseTag,
  deleteKnowledgeBaseTag,
  getKnowledgeBaseById,
  getFAQImportProgress,
  upsertFAQEntries,
  type FAQEntry,
  type FAQEntryPayload,
  type KnowledgeTag,
} from '@/api/knowledge-base'

// Extended FAQEntry type with UI state
interface FAQEntryUI extends FAQEntry {
  showMore?: boolean
  score?: number
  match_type?: string
  matched_question?: string
  expanded?: boolean
  similarCollapsed?: boolean
  negativeCollapsed?: boolean
  answersCollapsed?: boolean
}

// Knowledge base info type
interface KBInfo {
  id: string
  name: string
  type?: string
  tenant_id?: string
  my_permission?: string
  updated_at?: string
}

interface FAQEntryManagerProps {
  kbId: string
}

// Permission helpers (stub since React store may not have these)
const usePermissions = (_kbId: string, kbInfo: KBInfo | null) => {
  const authStore = useAuthStore()

  const isOwner = useMemo(() => {
    if (!kbInfo) return false
    const userTenantId = authStore.effectiveTenantId()
    return kbInfo.tenant_id === String(userTenantId)
  }, [kbInfo, authStore.effectiveTenantId])

  const canEdit = useMemo(() => {
    // Stub: allow edit for now
    return true
  }, [])

  const canManage = useMemo(() => {
    // Stub: allow manage for now
    return true
  }, [])

  const effectiveKBPermission = useMemo(() => {
    return kbInfo?.my_permission || ''
  }, [kbInfo])

  const currentSharedKb = useMemo(() => {
    return null
  }, [])

  return { isOwner, canEdit, canManage, effectiveKBPermission, currentSharedKb }
}

export function FAQEntryManager({ kbId }: FAQEntryManagerProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const uiStore = useUIStore()

  // KB Info
  const [kbInfo, setKbInfo] = useState<KBInfo | null>(null)

  // Permission state
  const { canEdit, canManage } = usePermissions(kbId, kbInfo)

  // Entries state
  const [entries, setEntries] = useState<FAQEntryUI[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [_overallFAQTotal, _setOverallFAQTotal] = useState(0)
  const pageSize = 20

  // Selected entries
  const [selectedRowKeys, setSelectedRowKeys] = useState<number[]>([])
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Entry search
  const [entrySearchKeyword, setEntrySearchKeyword] = useState('')
  const entrySearchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Tags state
  const [tagList, setTagList] = useState<KnowledgeTag[]>([])
  const [tagLoading, setTagLoading] = useState(false)
  const [tagLoadingMore, setTagLoadingMore] = useState(false)
  const tagListRef = useRef<HTMLDivElement>(null)
  const [selectedTagId, setSelectedTagId] = useState<number>(0)
  const [tagSearchQuery, setTagSearchQuery] = useState('')
  const [tagPage, setTagPage] = useState(1)
  const [tagHasMore, setTagHasMore] = useState(false)
  const [, setTagTotal] = useState(0)
  const TAG_PAGE_SIZE = 20
  const tagSearchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Tag editing state
  const [creatingTag, setCreatingTag] = useState(false)
  const [creatingTagLoading, setCreatingTagLoading] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const [editingTagId, setEditingTagId] = useState<string | null>(null)
  const [editingTagName, setEditingTagName] = useState('')
  const [editingTagSubmitting, setEditingTagSubmitting] = useState(false)

  // Tag map helpers
  const tagMap = useMemo(() => {
    const map: Record<number, KnowledgeTag> = {}
    tagList.forEach((tag) => {
      map[tag.seq_id] = tag
    })
    return map
  }, [tagList])

  // Editor state
  const [editorVisible, setEditorVisible] = useState(false)
  const [editorMode, setEditorMode] = useState<'create' | 'edit'>('create')
  const [currentEntryId, setCurrentEntryId] = useState<number | null>(null)
  const [editorForm, setEditorForm] = useState<FAQEntryPayload>({
    standard_question: '',
    similar_questions: [],
    negative_questions: [],
    answers: [],
    tag_id: undefined,
  })
  const [savingEntry, setSavingEntry] = useState(false)
  const [answerInput, setAnswerInput] = useState('')
  const [similarInput, setSimilarInput] = useState('')
  const [negativeInput, setNegativeInput] = useState('')

  // Import state
  const [importVisible, setImportVisible] = useState(false)
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append')
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importPreview, setImportPreview] = useState<FAQEntryPayload[]>([])
  const [importing, setImporting] = useState(false)
  const [, setImportTaskId] = useState<string | null>(null)
  const [importTaskStatus, setImportTaskStatus] = useState<{
    status: string
    progress: number
    total: number
    processed: number
    error?: string
  } | null>(null)
  const importPollingRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Search test state
  const [searchDrawerVisible, setSearchDrawerVisible] = useState(false)
  const [searching, setSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [searchResults, setSearchResults] = useState<FAQEntryUI[]>([])
  const [searchForm, setSearchForm] = useState({
    query: '',
    vectorThreshold: 0.7,
    matchCount: 10,
  })

  // Batch tag dialog
  const [batchTagDialogVisible, setBatchTagDialogVisible] = useState(false)
  const [batchTagValue, setBatchTagValue] = useState<string>('')

  // Entry status loading
  const [entryStatusLoading, setEntryStatusLoading] = useState<Record<number, boolean>>({})

  // Load KB info
  const loadKnowledgeInfo = useCallback(async (id: string) => {
    if (!id) {
      setKbInfo(null)
      return null
    }
    try {
      const res = await getKnowledgeBaseById(id)
      if (res.success && res.data) {
        const data = res.data as any
        setKbInfo(data)
        return data
      }
    } catch (error) {
      console.error('Failed to load knowledge base info:', error)
    }
    setKbInfo(null)
    return null
  }, [])

  // Load entries
  const loadEntries = useCallback(async (append = false) => {
    if (!kbId) return

    if (append) {
      setLoadingMore(true)
    } else {
      setLoading(true)
      setCurrentPage(1)
      setEntries([])
      setSelectedRowKeys([])
      setEntryStatusLoading({})
    }

    try {
      const page = append ? currentPage + 1 : 1

      const res = await listFAQEntries(kbId, {
        page,
        page_size: pageSize,
        tag_id: selectedTagId || undefined,
        keyword: entrySearchKeyword ? entrySearchKeyword.trim() : undefined,
      })

      if (res.success && res.data) {
        const pageData = res.data
        const newEntries: FAQEntryUI[] = (pageData.data || []).map((entry) => ({
          ...entry,
          showMore: false,
          similarCollapsed: true,
          negativeCollapsed: true,
          answersCollapsed: true,
          is_enabled: entry.is_enabled !== false,
        }))

        if (append) {
          setEntries((prev) => [...prev, ...newEntries])
        } else {
          setEntries(newEntries)
        }

        setHasMore((pageData.data?.length || 0) < (pageData.total || 0))
        setCurrentPage(page)
      }
    } catch (error: any) {
      console.error('Failed to load entries:', error)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [kbId, currentPage, selectedTagId, entrySearchKeyword])

  // Load tags
  const loadTags = useCallback(async (reset = false) => {
    if (!kbId) {
      setTagList([])
      setTagTotal(0)
      setTagHasMore(false)
      setTagPage(1)
      return
    }

    const page = reset ? 1 : tagPage

    if (reset) {
      setTagPage(1)
      setTagList([])
      setTagTotal(0)
      setTagHasMore(false)
    }

    setTagLoading(page === 1)
    setTagLoadingMore(page > 1)

    try {
      const res = await listKnowledgeTags(kbId, {
        page,
        page_size: TAG_PAGE_SIZE,
        keyword: tagSearchQuery || undefined,
      })

      if (res.success && res.data) {
        const pageData = res.data
        const pageTags = (pageData.data || []).map((tag: any) => ({
          ...tag,
          id: String(tag.id),
        }))

        if (page === 1) {
          setTagList(pageTags)
        } else {
          setTagList((prev) => [...prev, ...pageTags])
        }

        setTagTotal(pageData.total || pageTags.length)
        setTagHasMore((page === 1 ? pageTags.length : tagList.length + pageTags.length) < pageData.total)
        if (pageData.total > (page === 1 ? pageTags.length : tagList.length + pageTags.length)) {
          setTagPage(page + 1)
        }
      }
    } catch (error) {
      console.error('Failed to load tags:', error)
    } finally {
      setTagLoading(false)
      setTagLoadingMore(false)
    }
  }, [kbId, tagPage, tagSearchQuery, tagList.length])

  // Tag list scroll handler
  const handleTagListScroll = useCallback(() => {
    if (!tagListRef.current || tagLoadingMore || !tagHasMore) return

    const container = tagListRef.current
    const { scrollTop, scrollHeight, clientHeight } = container
    if (scrollTop + clientHeight >= scrollHeight - 50) {
      setTagPage((p) => p + 1)
    }
  }, [tagListRef, tagLoadingMore, tagHasMore])

  // Tag list scroll effect
  useEffect(() => {
    const container = tagListRef.current
    if (!container) return

    const handleScroll = () => handleTagListScroll()
    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [tagListRef, handleTagListScroll])

  // Load tags when page changes
  useEffect(() => {
    if (kbId) {
      loadTags()
    }
  }, [tagPage, kbId])

  // Get tag name
  const getTagName = (tagId?: number) => {
    if (!tagId) return t('knowledgeBase.untagged')
    return tagMap[tagId]?.name || t('knowledgeBase.untagged')
  }

  // Handle tag row click
  const handleTagRowClick = (tagSeqId: number) => {
    if (editingTagId) {
      setEditingTagId(null)
      setEditingTagName('')
    }
    if (creatingTag) {
      setCreatingTag(false)
      setNewTagName('')
    }
    if (selectedTagId === tagSeqId) {
      setSelectedTagId(0)
      return
    }
    setSelectedTagId(tagSeqId)
  }

  // Start create tag
  const startCreateTag = () => {
    if (!kbId) return
    if (creatingTag) return
    setEditingTagId(null)
    setCreatingTag(true)
    setNewTagName('')
  }

  // Cancel create tag
  const cancelCreateTag = () => {
    setCreatingTag(false)
    setNewTagName('')
  }

  // Submit create tag
  const submitCreateTag = async () => {
    if (!kbId) return
    const name = newTagName.trim()
    if (!name) return

    setCreatingTagLoading(true)
    try {
      await createKnowledgeBaseTag(kbId, { name })
      cancelCreateTag()
      loadTags(true)
    } catch (error) {
      console.error('Failed to create tag:', error)
    } finally {
      setCreatingTagLoading(false)
    }
  }

  // Start edit tag
  const startEditTag = (tag: KnowledgeTag) => {
    setCreatingTag(false)
    setEditingTagId(tag.id)
    setEditingTagName(tag.name)
  }

  // Cancel edit tag
  const cancelEditTag = () => {
    setEditingTagId(null)
    setEditingTagName('')
  }

  // Submit edit tag
  const submitEditTag = async () => {
    if (!kbId || !editingTagId) return
    const name = editingTagName.trim()
    if (!name) return

    setEditingTagSubmitting(true)
    try {
      await updateKnowledgeBaseTag(kbId, editingTagId, { name })
      cancelEditTag()
      loadTags(true)
    } catch (error) {
      console.error('Failed to edit tag:', error)
    } finally {
      setEditingTagSubmitting(false)
    }
  }

  // Confirm delete tag
  const confirmDeleteTag = async (tag: KnowledgeTag) => {
    if (!kbId) return

    try {
      await deleteKnowledgeBaseTag(kbId, tag.seq_id, { force: true })
      if (selectedTagId === tag.seq_id) {
        setSelectedTagId(0)
      }
      loadTags(true)
      loadEntries()
    } catch (error) {
      console.error('Failed to delete tag:', error)
    }
  }

  // Handle card select
  const handleCardSelect = (entryId: number, checked: boolean) => {
    if (checked) {
      if (!selectedRowKeys.includes(entryId)) {
        setSelectedRowKeys((prev) => [...prev, entryId])
      }
    } else {
      setSelectedRowKeys((prev) => prev.filter((id) => id !== entryId))
    }
  }

  // Open editor
  const openEditor = (entry?: FAQEntryUI) => {
    if (entry) {
      setEditorMode('edit')
      setCurrentEntryId(entry.id)
      setEditorForm({
        standard_question: entry.standard_question,
        similar_questions: [...(entry.similar_questions || [])],
        negative_questions: [...(entry.negative_questions || [])],
        answers: [...(entry.answers || [])],
        tag_id: entry.tag_id || undefined,
      })
    } else {
      setEditorMode('create')
      setCurrentEntryId(null)
      setEditorForm({
        standard_question: '',
        similar_questions: [],
        negative_questions: [],
        answers: [],
        tag_id: undefined,
      })
    }
    setAnswerInput('')
    setSimilarInput('')
    setNegativeInput('')
    setEditorVisible(true)
  }

  // Reset editor form
  const resetEditorForm = () => {
    setEditorForm({
      standard_question: '',
      similar_questions: [],
      negative_questions: [],
      answers: [],
      tag_id: undefined,
    })
    setAnswerInput('')
    setSimilarInput('')
    setNegativeInput('')
  }

  // Add answer
  const addAnswer = () => {
    const trimmed = answerInput.trim()
    if (trimmed && editorForm.answers.length < 5 && !editorForm.answers.includes(trimmed)) {
      setEditorForm((prev) => ({
        ...prev,
        answers: [...prev.answers, trimmed],
      }))
      setAnswerInput('')
    }
  }

  // Remove answer
  const removeAnswer = (index: number) => {
    setEditorForm((prev) => ({
      ...prev,
      answers: prev.answers.filter((_, i) => i !== index),
    }))
  }

  // Add similar question
  const addSimilar = () => {
    const trimmed = similarInput.trim()
    if (trimmed && editorForm.similar_questions.length < 10 && !editorForm.similar_questions.includes(trimmed)) {
      setEditorForm((prev) => ({
        ...prev,
        similar_questions: [...prev.similar_questions, trimmed],
      }))
      setSimilarInput('')
    }
  }

  // Remove similar question
  const removeSimilar = (index: number) => {
    setEditorForm((prev) => ({
      ...prev,
      similar_questions: prev.similar_questions.filter((_, i) => i !== index),
    }))
  }

  // Add negative question
  const addNegative = () => {
    const trimmed = negativeInput.trim()
    if (trimmed && editorForm.negative_questions.length < 10 && !editorForm.negative_questions.includes(trimmed)) {
      setEditorForm((prev) => ({
        ...prev,
        negative_questions: [...prev.negative_questions, trimmed],
      }))
      setNegativeInput('')
    }
  }

  // Remove negative question
  const removeNegative = (index: number) => {
    setEditorForm((prev) => ({
      ...prev,
      negative_questions: prev.negative_questions.filter((_, i) => i !== index),
    }))
  }

  // Handle submit entry
  const handleSubmitEntry = async () => {
    if (!editorForm.standard_question.trim() || editorForm.answers.length === 0) return

    setSavingEntry(true)
    try {
      const payload: FAQEntryPayload = {
        standard_question: editorForm.standard_question,
        similar_questions: [...editorForm.similar_questions],
        negative_questions: [...editorForm.negative_questions],
        answers: [...editorForm.answers],
        tag_id: editorForm.tag_id || undefined,
      }

      if (editorMode === 'create') {
        await createFAQEntry(kbId, payload)
      } else if (currentEntryId) {
        await updateFAQEntry(kbId, currentEntryId, payload)
      }

      setEditorVisible(false)
      resetEditorForm()
      loadEntries()
    } catch (error) {
      console.error('Failed to save entry:', error)
    } finally {
      setSavingEntry(false)
    }
  }

  // Handle menu edit
  const handleMenuEdit = (entry: FAQEntryUI) => {
    entry.showMore = false
    openEditor(entry)
  }

  // Handle menu delete
  const handleMenuDelete = async (entry: FAQEntryUI) => {
    entry.showMore = false
    try {
      await deleteFAQEntries(kbId, [entry.id])
      loadEntries()
    } catch (error) {
      console.error('Failed to delete entry:', error)
    }
  }

  // Handle entry status change
  const handleEntryStatusChange = async (entry: FAQEntryUI, value: boolean) => {
    if (!kbId) return

    const previous = entry.is_enabled
    if (previous === value) return

    setEntryStatusLoading((prev) => ({ ...prev, [entry.id]: true }))
    try {
      await updateFAQEntryFieldsBatch(kbId, { by_id: { [entry.id]: { is_enabled: value } } })
      setEntries((prev) =>
        prev.map((e) => (e.id === entry.id ? { ...e, is_enabled: value } : e))
      )
    } catch (error) {
      console.error('Failed to update entry status:', error)
    } finally {
      setEntryStatusLoading((prev) => ({ ...prev, [entry.id]: false }))
    }
  }

  // Batch operations
  const handleBatchTag = async () => {
    if (!selectedRowKeys.length || !kbId) return

    try {
      const updates: Record<number, number | null> = {}
      selectedRowKeys.forEach((id) => {
        updates[id] = batchTagValue ? Number(batchTagValue) : null
      })
      await updateFAQEntryTagBatch(kbId, { updates })
      setBatchTagDialogVisible(false)
      setSelectedRowKeys([])
      loadEntries()
      loadTags()
    } catch (error) {
      console.error('Failed to batch update tags:', error)
    }
  }

  // Import handling
  const openImportDialog = () => {
    setImportVisible(true)
    setImportFile(null)
    setImportPreview([])
    setImportMode('append')
  }

  const processFile = async (file: File) => {
    setImportFile(file)

    try {
      let parsed: FAQEntryPayload[] = []
      const text = await file.text()

      if (file.name.endsWith('.json')) {
        const data = JSON.parse(text)
        parsed = Array.isArray(data) ? data.map(normalizePayload) : []
      } else if (file.name.endsWith('.csv')) {
        // Simple CSV parsing
        const lines = text.split('\n').filter((line) => line.trim())
        if (lines.length > 1) {
          const headers = lines[0].split('\t').map((h) => h.trim().replace(/"/g, ''))
          parsed = lines.slice(1).map((line) => {
            const values = line.split('\t').map((v) => v.trim().replace(/"/g, ''))
            const row: Record<string, string> = {}
            headers.forEach((h, i) => {
              row[h] = values[i] || ''
            })
            return normalizePayload({
              standard_question: row['问题'] || row['question'] || '',
              answers: splitByDelimiter(row['机器人回答'] || row['answers']),
              similar_questions: splitByDelimiter(row['相似问题'] || row['similar_questions']),
              negative_questions: splitByDelimiter(row['反例问题'] || row['negative_questions']),
              tag_name: row['分类'] || row['tag_name'] || '',
            })
          })
        }
      } else {
        console.warn('Unsupported file format')
        setImportPreview([])
        return
      }

      setImportPreview(parsed)
    } catch (error) {
      console.error('Failed to parse file:', error)
      setImportPreview([])
    }
  }

  const splitByDelimiter = (value?: string) => {
    if (!value) return []
    const trimmedValue = value.trim()
    if (!trimmedValue) return []
    if (trimmedValue.includes('##')) {
      return trimmedValue.split('##').map((item) => item.trim()).filter(Boolean)
    }
    return [trimmedValue]
  }

  const normalizePayload = (payload: Partial<FAQEntryPayload>): FAQEntryPayload => ({
    standard_question: payload.standard_question || '',
    answers: payload.answers?.filter(Boolean) || [],
    similar_questions: payload.similar_questions?.filter(Boolean) || [],
    negative_questions: payload.negative_questions?.filter(Boolean) || [],
    tag_id: payload.tag_id || undefined,
    tag_name: payload.tag_name || '',
    is_enabled: payload.is_enabled !== undefined ? payload.is_enabled : undefined,
  })

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    await processFile(file)
  }

  const handleFileDrop = async (event: React.DragEvent) => {
    event.preventDefault()
    const file = event.dataTransfer?.files[0]
    if (!file) return
    await processFile(file)
  }

  const stopPolling = () => {
    if (importPollingRef.current) {
      clearInterval(importPollingRef.current)
      importPollingRef.current = null
    }
  }

  const startPolling = (taskId: string) => {
    stopPolling()

    importPollingRef.current = setInterval(async () => {
      try {
        const res = await getFAQImportProgress(taskId)
        if (res.success && res.data) {
          const data = res.data
          let status = data.status
          if (status === 'processing') status = 'running'
          else if (status === 'completed') status = 'success'

          setImportTaskStatus({
            status,
            progress: data.progress || 0,
            total: data.total || 0,
            processed: data.processed || 0,
            error: data.error || '',
          })

          if (status === 'success' || status === 'failed') {
            stopPolling()
            if (status === 'success') {
              setSelectedTagId(0)
              setEntrySearchKeyword('')
              loadEntries()
              loadTags()
            }
          }
        }
      } catch (error) {
        console.error('Failed to poll task status:', error)
        stopPolling()
      }
    }, 3000)
  }

  const handleImport = async () => {
    if (!importFile || !importPreview.length) return

    setImporting(true)
    try {
      const res = await upsertFAQEntries(kbId, {
        entries: importPreview,
        mode: importMode,
      })

      if (res.success && res.data?.task_id) {
        setImportTaskId(res.data.task_id)
        setImportTaskStatus({
          status: 'pending',
          progress: 0,
          total: importPreview.length,
          processed: 0,
        })
        startPolling(res.data.task_id)
        setImportVisible(false)
      }

      setImportFile(null)
      setImportPreview([])
      setImporting(false)
    } catch (error) {
      console.error('Failed to import:', error)
      setImporting(false)
      stopPolling()
    }
  }

  const handleCancelImport = () => {
    stopPolling()
    setImporting(false)
    setImportTaskId(null)
    setImportTaskStatus(null)
    setImportVisible(false)
  }

  // Export handling
  const handleExportCSV = async () => {
    if (!kbId) return

    try {
      const blob = await exportFAQEntries(kbId)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `faq_export_${new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export failed:', error)
    }
  }

  // Search handling
  const handleSearch = async () => {
    if (!searchForm.query.trim()) return

    setSearching(true)
    setHasSearched(true)
    try {
      const res = await searchFAQEntries(kbId, {
        query_text: searchForm.query.trim(),
        vector_threshold: searchForm.vectorThreshold,
        match_count: searchForm.matchCount,
      })

      if (res.success && res.data) {
        const results: FAQEntryUI[] = (res.data as FAQEntry[]).map((entry) => ({
          ...entry,
          similarCollapsed: true,
          negativeCollapsed: true,
          answersCollapsed: true,
          expanded: false,
        }))
        setSearchResults(results.sort((a, b) => (b.score || 0) - (a.score || 0)))
      } else {
        setSearchResults([])
      }
    } catch (error) {
      console.error('Search failed:', error)
      setSearchResults([])
    } finally {
      setSearching(false)
    }
  }

  const toggleResult = (result: FAQEntryUI) => {
    setSearchResults((prev) =>
      prev.map((r) => (r.id === result.id ? { ...r, expanded: !r.expanded } : r))
    )
  }

  // FAQ action handler
  const handleFaqAction = (action: string) => {
    switch (action) {
      case 'create':
        openEditor()
        break
      case 'import':
        openImportDialog()
        break
      case 'search':
        setSearchDrawerVisible(true)
        break
      case 'export':
        handleExportCSV()
        break
    }
  }

  // Navigate handlers
  const handleNavigateToKbList = () => {
    navigate('/platform/knowledge-bases')
  }

  const handleNavigateToCurrentKB = () => {
    if (!kbId) return
    navigate(`/platform/knowledge-bases/${kbId}`)
  }

  const handleOpenKBSettings = () => {
    if (!kbId) return
    uiStore.openKBSettings(kbId)
  }

  // Scroll handler
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current
    if (!container || loadingMore || !hasMore) return

    const { scrollTop, scrollHeight, clientHeight } = container
    if (scrollTop + clientHeight >= scrollHeight - 200) {
      loadEntries(true)
    }
  }, [loadingMore, hasMore, loadEntries])

  // Debounced search
  useEffect(() => {
    if (entrySearchDebounceRef.current) {
      clearTimeout(entrySearchDebounceRef.current)
    }
    entrySearchDebounceRef.current = setTimeout(() => {
      loadEntries()
    }, 300)

    return () => {
      if (entrySearchDebounceRef.current) {
        clearTimeout(entrySearchDebounceRef.current)
      }
    }
  }, [entrySearchKeyword])

  // Debounced tag search
  useEffect(() => {
    if (tagSearchDebounceRef.current) {
      clearTimeout(tagSearchDebounceRef.current)
    }
    tagSearchDebounceRef.current = setTimeout(() => {
      loadTags(true)
    }, 300)

    return () => {
      if (tagSearchDebounceRef.current) {
        clearTimeout(tagSearchDebounceRef.current)
      }
    }
  }, [tagSearchQuery])

  // Selected tag change
  useEffect(() => {
    setCurrentPage(1)
    setEntries([])
    setSelectedRowKeys([])
    loadEntries()
  }, [selectedTagId])

  // Initial load
  useEffect(() => {
    if (kbId) {
      loadKnowledgeInfo(kbId)
      loadEntries()
      loadTags(true)
    }
  }, [kbId])

  // Cleanup
  useEffect(() => {
    return () => {
      stopPolling()
    }
  }, [])

  // Tag select options
  const tagSelectOptions = useMemo(() => {
    return tagList.map((tag) => ({ label: tag.name, value: tag.seq_id }))
  }, [tagList])

  return (
    <div className="faq-manager flex flex-col h-full">
      <div className="flex flex-col flex-1 min-h-0 gap-5">
        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-3 flex-shrink-0">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                className="breadcrumb-link"
                onClick={handleNavigateToKbList}
              >
                {t('menu.knowledgeBase')}
              </button>
              <ChevronRight size={14} className="text-gray-400" />
              <button
                type="button"
                className="breadcrumb-link"
                onClick={handleNavigateToCurrentKB}
                disabled={!kbId}
              >
                {kbInfo ? kbInfo.name : ''}
              </button>
              <ChevronRight size={14} className="text-gray-400" />
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                {t('knowledgeEditor.faq.title')}
              </span>
            </div>
            <p className="text-sm text-gray-500">{t('knowledgeEditor.faq.subtitle')}</p>
          </div>
          {canManage && (
            <button
              type="button"
              className="kb-settings-button"
              onClick={handleOpenKBSettings}
              title={t('knowledgeBase.settings')}
            >
              <Settings size={16} />
            </button>
          )}
        </div>

        {/* Import Progress Bar */}
        {importTaskStatus && (
          <div className="faq-import-progress-bar">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {importTaskStatus.status === 'running' && <Loader2 size={18} className="animate-spin text-green-600" />}
                {importTaskStatus.status === 'success' && <CheckCircle size={18} className="text-green-600" />}
                {importTaskStatus.status === 'failed' && <AlertCircle size={18} className="text-red-500" />}
                {importTaskStatus.status === 'pending' && <Clock size={18} className="text-gray-500" />}
                <span className="font-medium">
                  {importTaskStatus.status === 'running' && t('faqManager.import.importing')}
                  {importTaskStatus.status === 'success' && t('faqManager.import.importDone')}
                  {importTaskStatus.status === 'failed' && t('faqManager.import.importFailed')}
                  {importTaskStatus.status === 'pending' && t('faqManager.import.waiting')}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-500">
                  {importTaskStatus.processed}/{importTaskStatus.total} {t('faqManager.import.unit')}
                </span>
                {(importTaskStatus.status === 'success' || importTaskStatus.status === 'failed') && (
                  <button
                    type="button"
                    className="text-gray-400 hover:text-gray-600"
                    onClick={() => {
                      stopPolling()
                      setImportTaskId(null)
                      setImportTaskStatus(null)
                    }}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>
            <div className="mt-2 h-2 bg-green-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all duration-300"
                style={{ width: `${importTaskStatus.progress}%` }}
              />
            </div>
            {importTaskStatus.error && (
              <p className="mt-2 text-sm text-red-500">{importTaskStatus.error}</p>
            )}
          </div>
        )}

        {/* Main Content */}
        <div className="flex flex-1 min-h-0">
          {/* Tag Sidebar */}
          <aside className="w-[180px] flex-shrink-0 pr-4 border-r border-gray-200 dark:border-gray-700 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-baseline gap-1">
                <span className="text-sm font-semibold">{t('knowledgeBase.faqCategoryTitle')}</span>
                <span className="text-xs text-gray-400">({tagList.length})</span>
              </div>
              {canEdit && (
                <button
                  type="button"
                  className="create-tag-btn"
                  onClick={startCreateTag}
                  title={t('knowledgeBase.tagCreateAction')}
                >
                  <Plus size={16} />
                </button>
              )}
            </div>

            {/* Tag Search */}
            <div className="mb-3">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={tagSearchQuery}
                  onChange={(e) => setTagSearchQuery(e.target.value)}
                  placeholder={t('knowledgeBase.tagSearchPlaceholder')}
                  className="w-full pl-8 pr-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 border border-transparent rounded-md focus:outline-none focus:border-green-500"
                />
              </div>
            </div>

            {/* Tag List */}
            <div
              ref={tagListRef}
              className="flex-1 overflow-y-auto flex flex-col gap-1"
            >
              {/* Create Tag Input */}
              {creatingTag && (
                <div className="faq-tag-item tag-editing flex items-center gap-2 px-2 py-2">
                  <span className="text-gray-400">#</span>
                  <input
                    type="text"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') submitCreateTag()
                      if (e.key === 'Escape') cancelCreateTag()
                    }}
                    placeholder={t('knowledgeBase.tagNamePlaceholder')}
                    maxLength={40}
                    className="flex-1 bg-transparent border-none outline-none text-sm"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={submitCreateTag}
                    disabled={creatingTagLoading}
                    className="text-gray-400 hover:text-green-600"
                  >
                    <Check size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={cancelCreateTag}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}

              {/* Tag Items */}
              {tagList.map((tag) => (
                <div
                  key={tag.id}
                  className={`faq-tag-item ${selectedTagId === tag.seq_id ? 'active' : ''} ${editingTagId === tag.id ? 'editing' : ''}`}
                  onClick={() => handleTagRowClick(tag.seq_id)}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-gray-400">#</span>
                    {editingTagId === tag.id ? (
                      <input
                        type="text"
                        value={editingTagName}
                        onChange={(e) => setEditingTagName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') submitEditTag()
                          if (e.key === 'Escape') cancelEditTag()
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 bg-transparent border-none outline-none text-sm"
                        maxLength={40}
                        autoFocus
                      />
                    ) : (
                      <span className="truncate text-sm">{tag.name}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs text-gray-400">{tag.chunk_count || 0}</span>
                    {editingTagId === tag.id ? (
                      <>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            submitEditTag()
                          }}
                          disabled={editingTagSubmitting}
                          className="text-gray-400 hover:text-green-600"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            cancelEditTag()
                          }}
                          className="text-gray-400 hover:text-red-500"
                        >
                          <X size={14} />
                        </button>
                      </>
                    ) : (
                      canEdit && (
                        <div className="relative group/tag-more">
                          <button
                            type="button"
                            className="tag-more-btn"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal size={14} />
                          </button>
                          <div className="absolute right-0 top-full mt-1 hidden group-hover/tag-more:block z-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg">
                            <button
                              type="button"
                              className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                              onClick={(e) => {
                                e.stopPropagation()
                                startEditTag(tag)
                              }}
                            >
                              <Edit size={14} />
                              {t('knowledgeBase.tagEditAction')}
                            </button>
                            <button
                              type="button"
                              className="flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                              onClick={(e) => {
                                e.stopPropagation()
                                confirmDeleteTag(tag)
                              }}
                            >
                              <Trash2 size={14} />
                              {t('knowledgeBase.tagDeleteAction')}
                            </button>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              ))}

              {tagLoading && tagList.length === 0 && (
                <div className="text-center py-4 text-gray-400 text-xs">
                  {t('common.loading')}
                </div>
              )}

              {!tagLoading && tagList.length === 0 && (
                <div className="text-center py-4 text-gray-400 text-xs">
                  {t('knowledgeBase.tagEmptyResult')}
                </div>
              )}

              {tagLoadingMore && (
                <div className="text-center py-2">
                  <Loader2 size={16} className="animate-spin text-gray-400 mx-auto" />
                </div>
              )}
            </div>
          </aside>

          {/* Card Area */}
          <div className="flex-1 min-w-0 pl-4 flex flex-col">
            {/* Search Bar */}
            <div className="flex items-center gap-3 pb-3 flex-shrink-0">
              <div className="flex-1 relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={entrySearchKeyword}
                  onChange={(e) => setEntrySearchKeyword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && loadEntries()}
                  placeholder={t('knowledgeEditor.faq.searchPlaceholder')}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-gray-100 dark:bg-gray-800 border border-transparent rounded-md focus:outline-none focus:border-green-500"
                />
              </div>
              <div className="flex items-center gap-1">
                {canEdit && (
                  <button
                    type="button"
                    className="content-bar-icon-btn"
                    onClick={() => handleFaqAction('create')}
                    title={t('knowledgeEditor.faq.editorCreate')}
                  >
                    <Plus size={16} />
                  </button>
                )}
                <button
                  type="button"
                  className="content-bar-icon-btn"
                  onClick={() => handleFaqAction('export')}
                  title={t('knowledgeEditor.faqExport.exportButton')}
                >
                  <Download size={16} />
                </button>
                <button
                  type="button"
                  className="content-bar-icon-btn"
                  onClick={() => handleFaqAction('search')}
                  title={t('knowledgeEditor.faq.searchTest')}
                >
                  <Search size={16} />
                </button>
              </div>
            </div>

            {/* Card List Container */}
            <div
              ref={scrollContainerRef}
              className="flex-1 overflow-y-auto pr-1"
              onScroll={handleScroll}
            >
              {/* Loading Skeleton */}
              {loading && entries.length === 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="faq-card border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-white dark:bg-gray-800">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
                      <div className="space-y-1.5">
                        <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded w-full" />
                        <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded w-5/6" />
                        <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded w-4/6" />
                      </div>
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 flex gap-2">
                        <div className="h-5 bg-gray-100 dark:bg-gray-700 rounded w-16" />
                        <div className="h-5 bg-gray-100 dark:bg-gray-700 rounded w-12" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Card List */}
              {!loading && entries.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
                  {entries.map((entry) => (
                    <div
                      key={entry.id}
                      className={`faq-card border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-white dark:bg-gray-800 ${selectedRowKeys.includes(entry.id) ? 'selected' : ''}`}
                      onClick={() => handleCardSelect(entry.id, !selectedRowKeys.includes(entry.id))}
                    >
                      {/* Card Header */}
                      <div className="flex items-start gap-2 pb-2 border-b border-gray-200 dark:border-gray-700">
                        <div
                          className="flex-1 text-sm font-medium truncate"
                          title={entry.standard_question}
                        >
                          {entry.standard_question}
                        </div>
                        {canManage && (
                          <div className="relative flex-shrink-0">
                            <button
                              type="button"
                              className="card-more-btn"
                              onClick={(e) => {
                                e.stopPropagation()
                                setEntries((prev) =>
                                  prev.map((e) =>
                                    e.id === entry.id ? { ...e, showMore: !e.showMore } : e
                                  )
                                )
                              }}
                            >
                              <MoreHorizontal size={14} />
                            </button>
                            {entry.showMore && (
                              <div className="absolute right-0 top-full mt-1 z-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg">
                                <button
                                  type="button"
                                  className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 w-full"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleMenuEdit(entry)
                                  }}
                                >
                                  <Edit size={14} />
                                  {t('common.edit')}
                                </button>
                                <button
                                  type="button"
                                  className="flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 w-full"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleMenuDelete(entry)
                                  }}
                                >
                                  <Trash2 size={14} />
                                  {t('common.delete')}
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Card Body */}
                      <div className="py-2 space-y-2">
                        {/* Similar Questions */}
                        {entry.similar_questions?.length > 0 && (
                          <div>
                            <button
                              type="button"
                              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
                              onClick={(e) => {
                                e.stopPropagation()
                                setEntries((prev) =>
                                  prev.map((e) =>
                                    e.id === entry.id
                                      ? { ...e, similarCollapsed: !e.similarCollapsed }
                                      : e
                                  )
                                )
                              }}
                            >
                              <span>{t('knowledgeEditor.faq.similarQuestions')}</span>
                              <span className="text-gray-400">({entry.similar_questions.length})</span>
                              {entry.similarCollapsed ? (
                                <ChevronRight size={12} />
                              ) : (
                                <ChevronDown size={12} />
                              )}
                            </button>
                            {!entry.similarCollapsed && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {entry.similar_questions.map((q, i) => (
                                  <span
                                    key={i}
                                    className="inline-block px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 rounded"
                                    title={q}
                                  >
                                    {q}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Negative Questions */}
                        {entry.negative_questions?.length > 0 && (
                          <div>
                            <button
                              type="button"
                              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
                              onClick={(e) => {
                                e.stopPropagation()
                                setEntries((prev) =>
                                  prev.map((e) =>
                                    e.id === entry.id
                                      ? { ...e, negativeCollapsed: !e.negativeCollapsed }
                                      : e
                                  )
                                )
                              }}
                            >
                              <span>{t('knowledgeEditor.faq.negativeQuestions')}</span>
                              <span className="text-gray-400">({entry.negative_questions.length})</span>
                              {entry.negativeCollapsed ? (
                                <ChevronRight size={12} />
                              ) : (
                                <ChevronDown size={12} />
                              )}
                            </button>
                            {!entry.negativeCollapsed && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {entry.negative_questions.map((q, i) => (
                                  <span
                                    key={i}
                                    className="inline-block px-2 py-0.5 text-xs bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 rounded"
                                    title={q}
                                  >
                                    {q}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Answers */}
                        <div>
                          <button
                            type="button"
                            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
                            onClick={(e) => {
                              e.stopPropagation()
                              setEntries((prev) =>
                                prev.map((e) =>
                                  e.id === entry.id
                                    ? { ...e, answersCollapsed: !e.answersCollapsed }
                                    : e
                                )
                              )
                            }}
                          >
                            <span>{t('knowledgeEditor.faq.answers')}</span>
                            {entry.answers?.length > 0 && (
                              <span className="text-gray-400">({entry.answers.length})</span>
                            )}
                            {entry.answersCollapsed ? (
                              <ChevronRight size={12} />
                            ) : (
                              <ChevronDown size={12} />
                            )}
                          </button>
                          {!entry.answersCollapsed && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {entry.answers?.map((a, i) => (
                                <span
                                  key={i}
                                  className="inline-block px-2 py-0.5 text-xs bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded"
                                  title={a}
                                >
                                  {a}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Card Footer */}
                      <div className="pt-2 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                        <button
                          type="button"
                          className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {getTagName(entry.tag_id)}
                        </button>
                        <div className="flex items-center gap-2">
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={entry.is_enabled}
                              onChange={(e) => {
                                e.stopPropagation()
                                handleEntryStatusChange(entry, e.target.checked)
                              }}
                              disabled={entryStatusLoading[entry.id] || !canEdit}
                              className="sr-only peer"
                            />
                            <div className="w-8 h-4 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-green-500" />
                          </label>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Empty State */}
              {!loading && entries.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <FileText size={48} className="mb-4" />
                  <div className="text-lg font-medium">{t('knowledgeEditor.faq.emptyTitle')}</div>
                  <div className="text-sm">{t('knowledgeEditor.faq.emptyDesc')}</div>
                </div>
              )}

              {/* Loading More */}
              {loadingMore && (
                <div className="text-center py-4">
                  <Loader2 size={20} className="animate-spin text-gray-400 mx-auto" />
                </div>
              )}

              {/* No More */}
              {!hasMore && entries.length > 0 && (
                <div className="text-center py-4 text-gray-400 text-sm">
                  {t('common.noMoreData')}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Editor Drawer */}
      <Sheet open={editorVisible} onOpenChange={setEditorVisible}>
        <SheetContent side="right" className="w-[520px] sm:max-w-[520px]">
          <SheetHeader>
            <SheetTitle>
              {editorMode === 'create'
                ? t('knowledgeEditor.faq.editorCreate')
                : t('knowledgeEditor.faq.editorEdit')}
            </SheetTitle>
          </SheetHeader>
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              {/* Standard Question */}
              <div className="space-y-1">
                <label className="text-sm font-medium">
                  {t('knowledgeEditor.faq.standardQuestion')}
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <Input
                  value={editorForm.standard_question}
                  onChange={(e) =>
                    setEditorForm((prev) => ({ ...prev, standard_question: e.target.value }))
                  }
                  maxLength={200}
                  placeholder={t('knowledgeEditor.faq.standardQuestionDesc')}
                />
              </div>

              {/* Similar Questions */}
              <div className="space-y-1">
                <label className="text-sm font-medium">{t('knowledgeEditor.faq.similarQuestions')}</label>
                <p className="text-xs text-gray-500">{t('knowledgeEditor.faq.similarQuestionsDesc')}</p>
                <div className="flex gap-2">
                  <Input
                    value={similarInput}
                    onChange={(e) => setSimilarInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addSimilar()
                      }
                    }}
                    placeholder={t('knowledgeEditor.faq.similarPlaceholder')}
                    disabled={editorForm.similar_questions.length >= 10}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addSimilar}
                    disabled={!similarInput.trim() || editorForm.similar_questions.length >= 10}
                  >
                    <Plus size={16} />
                  </Button>
                </div>
                {editorForm.similar_questions.length > 0 && (
                  <div className="space-y-1">
                    {editorForm.similar_questions.map((q, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded">
                        <span className="flex-1 truncate">{q}</span>
                        <button
                          type="button"
                          onClick={() => removeSimilar(i)}
                          className="text-gray-400 hover:text-red-500"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Negative Questions */}
              <div className="space-y-1">
                <label className="text-sm font-medium">{t('knowledgeEditor.faq.negativeQuestions')}</label>
                <p className="text-xs text-gray-500">{t('knowledgeEditor.faq.negativeQuestionsDesc')}</p>
                <div className="flex gap-2">
                  <Input
                    value={negativeInput}
                    onChange={(e) => setNegativeInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addNegative()
                      }
                    }}
                    placeholder={t('knowledgeEditor.faq.negativePlaceholder')}
                    disabled={editorForm.negative_questions.length >= 10}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addNegative}
                    disabled={!negativeInput.trim() || editorForm.negative_questions.length >= 10}
                  >
                    <Plus size={16} />
                  </Button>
                </div>
                {editorForm.negative_questions.length > 0 && (
                  <div className="space-y-1">
                    {editorForm.negative_questions.map((q, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 rounded">
                        <span className="flex-1 truncate">{q}</span>
                        <button
                          type="button"
                          onClick={() => removeNegative(i)}
                          className="text-gray-400 hover:text-red-500"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Answers */}
              <div className="space-y-1">
                <label className="text-sm font-medium">
                  {t('knowledgeEditor.faq.answers')}
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <p className="text-xs text-gray-500">{t('knowledgeEditor.faq.answersDesc')}</p>
                <div className="flex gap-2">
                  <Textarea
                    value={answerInput}
                    onChange={(e) => setAnswerInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                        e.preventDefault()
                        addAnswer()
                      }
                    }}
                    placeholder={t('knowledgeEditor.faq.answerPlaceholder')}
                    disabled={editorForm.answers.length >= 5}
                    rows={3}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addAnswer}
                    disabled={!answerInput.trim() || editorForm.answers.length >= 5}
                    className="self-start"
                  >
                    <Plus size={16} />
                  </Button>
                </div>
                <div className="text-xs text-gray-400">{editorForm.answers.length}/5</div>
                {editorForm.answers.length > 0 && (
                  <div className="space-y-1">
                    {editorForm.answers.map((a, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded">
                        <span className="flex-1 truncate">{a}</span>
                        <button
                          type="button"
                          onClick={() => removeAnswer(i)}
                          className="text-gray-400 hover:text-red-500"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Category */}
              <div className="space-y-1">
                <label className="text-sm font-medium">{t('knowledgeBase.category')}</label>
                <p className="text-xs text-gray-500">{t('knowledgeEditor.faq.tagDesc')}</p>
                <select
                  value={editorForm.tag_id || ''}
                  onChange={(e) =>
                    setEditorForm((prev) => ({
                      ...prev,
                      tag_id: e.target.value ? Number(e.target.value) : undefined,
                    }))
                  }
                  className="w-full h-10 px-3 text-sm border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 focus:outline-none focus:border-green-500"
                >
                  <option value="">{t('knowledgeEditor.faq.tagPlaceholder')}</option>
                  {tagSelectOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="outline"
                onClick={() => {
                  setEditorVisible(false)
                  resetEditorForm()
                }}
              >
                {t('common.cancel')}
              </Button>
              <Button
                variant="default"
                onClick={handleSubmitEntry}
                loading={savingEntry}
                disabled={!editorForm.standard_question.trim() || editorForm.answers.length === 0}
              >
                {editorMode === 'create' ? t('knowledgeEditor.faq.editorCreate') : t('common.save')}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Import Dialog */}
      <Dialog open={importVisible} onOpenChange={setImportVisible}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('knowledgeEditor.faqImport.title')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Import Mode */}
            <div className="space-y-1">
              <label className="text-sm font-medium">{t('knowledgeEditor.faqImport.modeLabel')}</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  className={`px-3 py-1.5 text-sm rounded border ${
                    importMode === 'append'
                      ? 'bg-green-50 border-green-500 text-green-700'
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                  onClick={() => setImportMode('append')}
                >
                  {t('knowledgeEditor.faqImport.appendMode')}
                </button>
                <button
                  type="button"
                  className={`px-3 py-1.5 text-sm rounded border ${
                    importMode === 'replace'
                      ? 'bg-green-50 border-green-500 text-green-700'
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                  onClick={() => setImportMode('replace')}
                >
                  {t('knowledgeEditor.faqImport.replaceMode')}
                </button>
              </div>
            </div>

            {/* File Upload */}
            <div className="space-y-1">
              <label className="text-sm font-medium">{t('knowledgeEditor.faqImport.fileLabel')}</label>
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                  importFile ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-green-500'
                }`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleFileDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,.csv,.xlsx,.xls"
                  onChange={handleFileChange}
                  className="hidden"
                />
                {importFile ? (
                  <div className="text-sm font-medium text-green-600">{importFile.name}</div>
                ) : (
                  <>
                    <Upload size={32} className="mx-auto text-gray-400 mb-2" />
                    <div className="text-sm text-gray-500">{t('knowledgeEditor.faqImport.clickToUpload')}</div>
                    <div className="text-xs text-gray-400">{t('knowledgeEditor.faqImport.dragDropTip')}</div>
                  </>
                )}
              </div>
              <p className="text-xs text-gray-500">{t('knowledgeEditor.faqImport.fileTip')}</p>
            </div>

            {/* Preview */}
            {importPreview.length > 0 && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <FileText size={16} />
                  {t('knowledgeEditor.faqImport.previewCount', { count: importPreview.length })}
                </div>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {importPreview.slice(0, 5).map((item, i) => (
                    <div key={i} className="text-sm px-2 py-1 bg-gray-50 dark:bg-gray-800 rounded">
                      {item.standard_question}
                    </div>
                  ))}
                  {importPreview.length > 5 && (
                    <div className="text-xs text-gray-400">
                      {t('knowledgeEditor.faqImport.previewMore', { count: importPreview.length - 5 })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelImport}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="default"
              onClick={handleImport}
              disabled={!importFile || importPreview.length === 0}
              loading={importing}
            >
              {t('knowledgeEditor.faqImport.importButton')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Batch Tag Dialog */}
      <Dialog open={batchTagDialogVisible} onOpenChange={setBatchTagDialogVisible}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('knowledgeEditor.faq.batchUpdateTag')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-gray-500">
              {t('knowledgeEditor.faq.batchUpdateTagTip', { count: selectedRowKeys.length })}
            </p>
            <select
              value={batchTagValue}
              onChange={(e) => setBatchTagValue(e.target.value)}
              className="w-full h-10 px-3 text-sm border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 focus:outline-none focus:border-green-500"
            >
              <option value="">{t('knowledgeBase.tagPlaceholder')}</option>
              {tagSelectOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBatchTagDialogVisible(false)}>
              {t('common.cancel')}
            </Button>
            <Button variant="default" onClick={handleBatchTag}>
              {t('common.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Search Test Drawer */}
      <Sheet open={searchDrawerVisible} onOpenChange={setSearchDrawerVisible}>
        <SheetContent side="right" className="w-[420px] sm:max-w-[420px]">
          <SheetHeader>
            <SheetTitle>{t('knowledgeEditor.faq.searchTestTitle')}</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              {/* Query */}
              <div className="space-y-1">
                <label className="text-sm font-medium">{t('knowledgeEditor.faq.queryLabel')}</label>
                <p className="text-xs text-gray-500">{t('knowledgeEditor.faq.queryPlaceholder')}</p>
                <Input
                  value={searchForm.query}
                  onChange={(e) => setSearchForm((prev) => ({ ...prev, query: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSearch()
                  }}
                  placeholder={t('knowledgeEditor.faq.queryPlaceholder')}
                />
              </div>

              {/* Similarity Threshold */}
              <div className="space-y-1">
                <label className="text-sm font-medium">{t('knowledgeEditor.faq.similarityThresholdLabel')}</label>
                <p className="text-xs text-gray-500">{t('knowledgeEditor.faq.vectorThresholdDesc')}</p>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={searchForm.vectorThreshold}
                    onChange={(e) =>
                      setSearchForm((prev) => ({
                        ...prev,
                        vectorThreshold: parseFloat(e.target.value),
                      }))
                    }
                    className="flex-1"
                  />
                  <span className="text-sm w-12 text-right">{searchForm.vectorThreshold.toFixed(2)}</span>
                </div>
              </div>

              {/* Match Count */}
              <div className="space-y-1">
                <label className="text-sm font-medium">{t('knowledgeEditor.faq.matchCountLabel')}</label>
                <p className="text-xs text-gray-500">{t('knowledgeEditor.faq.matchCountDesc')}</p>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="1"
                    max="50"
                    step="1"
                    value={searchForm.matchCount}
                    onChange={(e) =>
                      setSearchForm((prev) => ({
                        ...prev,
                        matchCount: parseInt(e.target.value),
                      }))
                    }
                    className="flex-1"
                  />
                  <span className="text-sm w-12 text-right">{searchForm.matchCount}</span>
                </div>
              </div>

              {/* Search Button */}
              <Button variant="default" onClick={handleSearch} loading={searching} className="w-full">
                {searching ? t('knowledgeEditor.faq.searching') : t('knowledgeEditor.faq.searchButton')}
              </Button>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 || hasSearched ? (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <div className="text-sm font-medium mb-2">
                  {t('knowledgeEditor.faq.searchResults')} ({searchResults.length})
                </div>
                {searchResults.length === 0 ? (
                  <div className="text-sm text-gray-400">{t('knowledgeEditor.faq.noResults')}</div>
                ) : (
                  <div className="max-h-96 overflow-y-auto space-y-2">
                    {searchResults.map((result, index) => (
                      <div
                        key={result.id}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-2"
                      >
                        <button
                          type="button"
                          className="w-full text-left"
                          onClick={() => toggleResult(result)}
                        >
                          <div className="flex items-start gap-2">
                            <span className="text-sm font-medium">{index + 1}.</span>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium truncate">
                                {result.standard_question}
                              </div>
                              {result.matched_question && result.matched_question !== result.standard_question && (
                                <div className="text-xs text-gray-500 mt-1">
                                  <span className="text-gray-400">{t('knowledgeEditor.faq.matchedQuestion')}:</span>{' '}
                                  {result.matched_question}
                                </div>
                              )}
                            </div>
                            <span className="text-xs px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">
                              {(result.score || 0).toFixed(3)}
                            </span>
                            {result.expanded ? (
                              <ChevronUp size={14} className="flex-shrink-0" />
                            ) : (
                              <ChevronDown size={14} className="flex-shrink-0" />
                            )}
                          </div>
                        </button>
                        {result.expanded && (
                          <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 space-y-2">
                            {result.answers?.length > 0 && (
                              <div>
                                <div className="text-xs text-gray-500 mb-1">{t('knowledgeEditor.faq.answers')}</div>
                                <div className="flex flex-wrap gap-1">
                                  {result.answers.map((a, i) => (
                                    <span
                                      key={i}
                                      className="inline-block px-2 py-0.5 text-xs bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded"
                                    >
                                      {a}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            {result.similar_questions?.length > 0 && (
                              <div>
                                <div className="text-xs text-gray-500 mb-1">{t('knowledgeEditor.faq.similarQuestions')}</div>
                                <div className="flex flex-wrap gap-1">
                                  {result.similar_questions.map((q, i) => (
                                    <span
                                      key={i}
                                      className="inline-block px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 rounded"
                                    >
                                      {q}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}