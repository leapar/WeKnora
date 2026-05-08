import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import ReactMarkdown from 'react-markdown'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  CodeSquare,
  Link,
  Image,
  Table,
  Minus,
  Edit3,
  Eye,
  Loader2,
} from 'lucide-react'
import { listKnowledgeBases, getKnowledgeDetails, createManualKnowledge, updateManualKnowledge } from '@/api/knowledge-base'
import type { KnowledgeDetailResponse } from '@/api/knowledge-base'
import { safeMarkdownToHTML } from '@/lib/security'
import { useUIStore } from '@/stores/uiStore'

interface KnowledgeBaseOption {
  label: string
  value: string
}

type ManualStatus = 'draft' | 'publish'

interface ManualKnowledgeEditorProps {
  visible: boolean
  onClose: () => void
}

export function ManualKnowledgeEditor({ visible, onClose }: ManualKnowledgeEditorProps) {
  const { t } = useTranslation()
  const uiStore = useUIStore()

  const mode = uiStore.manualEditorMode
  const knowledgeId = uiStore.manualEditorKnowledgeId

  const [form, setForm] = useState({
    kbId: '',
    title: '',
    content: '',
    status: 'draft' as ManualStatus,
  })

  const [initialLoaded, setInitialLoaded] = useState(false)
  const [kbOptions, setKbOptions] = useState<KnowledgeBaseOption[]>([])
  const [kbLoading, setKbLoading] = useState(false)
  const [contentLoading, setContentLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savingAction, setSavingAction] = useState<ManualStatus>('draft')
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit')
  const [lastUpdatedAt, setLastUpdatedAt] = useState('')

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const selectionRange = useRef({ start: 0, end: 0 })
  const textareaElement = useRef<HTMLTextAreaElement | null>(null)

  const selectionEvents = ['select', 'keyup', 'click', 'mouseup', 'input']

  const resolveTextareaElement = useCallback((): HTMLTextAreaElement | null => {
    const textarea = textareaRef.current
    if (textarea) return textarea
    return textareaElement.current
  }, [])

  const handleTextareaSelectionEvent = useCallback(() => {
    const textarea = resolveTextareaElement()
    if (!textarea) return
    selectionRange.current.start = textarea.selectionStart ?? 0
    selectionRange.current.end = textarea.selectionEnd ?? 0
  }, [resolveTextareaElement])

  const detachTextareaListeners = useCallback(() => {
    if (!textareaElement.current) return
    selectionEvents.forEach((eventName) => {
      textareaElement.current?.removeEventListener(eventName, handleTextareaSelectionEvent)
    })
    textareaElement.current = null
  }, [handleTextareaSelectionEvent])

  const attachTextareaListeners = useCallback(() => {
    setTimeout(() => {
      const textarea = resolveTextareaElement()
      if (!textarea) return
      if (textareaElement.current === textarea) return
      detachTextareaListeners()
      textareaElement.current = textarea
      selectionEvents.forEach((eventName) => {
        textarea.addEventListener(eventName, handleTextareaSelectionEvent)
      })
      handleTextareaSelectionEvent()
    }, 0)
  }, [resolveTextareaElement, detachTextareaListeners, handleTextareaSelectionEvent])

  const setSelectionRange = useCallback((start: number, end: number) => {
    selectionRange.current.start = start
    selectionRange.current.end = end
    setTimeout(() => {
      const textarea = resolveTextareaElement()
      if (!textarea || activeTab !== 'edit') return
      textarea.focus()
      textarea.setSelectionRange(start, end)
    }, 0)
  }, [resolveTextareaElement, activeTab])

  const getSelectionRange = useCallback(() => {
    return {
      start: selectionRange.current.start ?? 0,
      end: selectionRange.current.end ?? 0,
    }
  }, [])

  const clampRange = (start: number, end: number, length: number) => {
    let safeStart = Math.max(0, Math.min(start, length))
    let safeEnd = Math.max(0, Math.min(end, length))
    if (safeEnd < safeStart) {
      ;[safeStart, safeEnd] = [safeEnd, safeStart]
    }
    return { safeStart, safeEnd }
  }

  const updateContentWithSelection = useCallback((content: string, start: number, end: number) => {
    setForm((prev) => ({ ...prev, content }))
    setSelectionRange(start, end)
  }, [setSelectionRange])

  const findLineStart = (value: string, index: number) => {
    if (index <= 0) return 0
    const lastNewline = value.lastIndexOf('\n', index - 1)
    return lastNewline === -1 ? 0 : lastNewline + 1
  }

  const findLineEnd = (value: string, index: number) => {
    if (index >= value.length) return value.length
    const newlineIndex = value.indexOf('\n', index)
    return newlineIndex === -1 ? value.length : newlineIndex
  }

  const transformSelectedLines = useCallback((transformer: (line: string, index: number) => string) => {
    const value = form.content ?? ''
    const { start, end } = getSelectionRange()
    const { safeStart, safeEnd } = clampRange(start, end, value.length)
    const lineStart = findLineStart(value, safeStart)
    const lineEnd = findLineEnd(value, safeEnd)
    const selected = value.slice(lineStart, lineEnd)
    const lines = selected.split('\n')
    const transformed = lines.map((line, index) => transformer(line, index))
    const result = transformed.join('\n')
    const newContent = value.slice(0, lineStart) + result + value.slice(lineEnd)
    updateContentWithSelection(newContent, lineStart, lineStart + result.length)
  }, [form.content, getSelectionRange, updateContentWithSelection])

  const wrapSelection = useCallback((prefix: string, suffix: string, placeholder: string) => {
    const value = form.content ?? ''
    const { start, end } = getSelectionRange()
    const { safeStart, safeEnd } = clampRange(start, end, value.length)
    const hasSelection = safeEnd > safeStart
    const selectedText = hasSelection ? value.slice(safeStart, safeEnd) : placeholder
    const result =
      value.slice(0, safeStart) + prefix + selectedText + suffix + value.slice(safeEnd)
    const selectionStart = safeStart + prefix.length
    const selectionEnd = selectionStart + selectedText.length
    updateContentWithSelection(result, selectionStart, selectionEnd)
  }, [form.content, getSelectionRange, updateContentWithSelection])

  const insertBlock = useCallback((
    text: string,
    selectionStartOffset?: number,
    selectionEndOffset?: number,
  ) => {
    const value = form.content ?? ''
    const { start, end } = getSelectionRange()
    const { safeStart, safeEnd } = clampRange(start, end, value.length)
    const before = value.slice(0, safeStart)
    const after = value.slice(safeEnd)
    const result = before + text + after
    const base = safeStart
    const selectionStart =
      selectionStartOffset !== undefined ? base + selectionStartOffset : base + text.length
    const selectionEnd =
      selectionEndOffset !== undefined ? base + selectionEndOffset : selectionStart
    updateContentWithSelection(result, selectionStart, selectionEnd)
  }, [form.content, getSelectionRange, updateContentWithSelection])

  const applyHeading = useCallback((level: number) => {
    const hashes = '#'.repeat(level)
    transformSelectedLines((line) => {
      const trimmed = line.replace(/^#+\s*/, '').trim()
      const content = trimmed || t('manualEditor.placeholders.heading', { level })
      return `${hashes} ${content}`
    })
  }, [transformSelectedLines, t])

  const listPrefixPattern = /^(\s*(?:[-*+]|\d+\.)\s+|\s*-\s+\[[ xX]\]\s+)/

  const applyBulletList = useCallback(() => {
    transformSelectedLines((line) => {
      const trimmed = line.trim()
      const content = trimmed.replace(listPrefixPattern, '').trim()
      return `- ${content || t('manualEditor.placeholders.listItem')}`
    })
  }, [transformSelectedLines, t])

  const applyOrderedList = useCallback(() => {
    transformSelectedLines((line, index) => {
      const trimmed = line.trim()
      const content = trimmed.replace(listPrefixPattern, '').trim()
      return `${index + 1}. ${content || t('manualEditor.placeholders.listItem')}`
    })
  }, [transformSelectedLines, t])

  const applyTaskList = useCallback(() => {
    transformSelectedLines((line) => {
      const trimmed = line.trim()
      const content = trimmed.replace(listPrefixPattern, '').trim()
      return `- [ ] ${content || t('manualEditor.placeholders.taskItem')}`
    })
  }, [transformSelectedLines, t])

  const applyBlockquote = useCallback(() => {
    transformSelectedLines((line) => {
      const trimmed = line.trim().replace(/^>\s?/, '').trim()
      return `> ${trimmed || t('manualEditor.placeholders.quote')}`
    })
  }, [transformSelectedLines, t])

  const insertCodeBlock = useCallback(() => {
    const placeholder = t('manualEditor.placeholders.code')
    const block = `\n\`\`\`\n${placeholder}\n\`\`\`\n`
    const startOffset = block.indexOf(placeholder)
    insertBlock(block, startOffset, startOffset + placeholder.length)
  }, [insertBlock, t])

  const insertHorizontalRule = useCallback(() => {
    insertBlock('\n---\n\n')
  }, [insertBlock])

  const insertTable = useCallback(() => {
    const cell = t('manualEditor.table.cell')
    const template = `\n| ${t('manualEditor.table.column1')} | ${t('manualEditor.table.column2')} |\n| --- | --- |\n| ${cell} | ${cell} |\n`
    const placeholderIndex = template.indexOf(cell)
    insertBlock(template, placeholderIndex, placeholderIndex + cell.length)
  }, [insertBlock, t])

  const insertLink = useCallback(() => {
    const value = form.content ?? ''
    const { start, end } = getSelectionRange()
    const { safeStart, safeEnd } = clampRange(start, end, value.length)
    const selectedText =
      safeEnd > safeStart ? value.slice(safeStart, safeEnd) : t('manualEditor.placeholders.linkText')
    const urlPlaceholder = 'https://'
    const result =
      value.slice(0, safeStart) +
      `[${selectedText}](${urlPlaceholder})` +
      value.slice(safeEnd)
    const urlStart = safeStart + selectedText.length + 3
    const urlEnd = urlStart + urlPlaceholder.length
    updateContentWithSelection(result, urlStart, urlEnd)
  }, [form.content, getSelectionRange, updateContentWithSelection, t])

  const insertImage = useCallback(() => {
    const value = form.content ?? ''
    const { start, end } = getSelectionRange()
    const { safeStart, safeEnd } = clampRange(start, end, value.length)
    const altText = safeEnd > safeStart ? value.slice(safeStart, safeEnd) : t('manualEditor.placeholders.imageAlt')
    const urlPlaceholder = 'https://'
    const result =
      value.slice(0, safeStart) +
      `![${altText}](${urlPlaceholder})` +
      value.slice(safeEnd)
    const urlStart = safeStart + altText.length + 4
    const urlEnd = urlStart + urlPlaceholder.length
    updateContentWithSelection(result, urlStart, urlEnd)
  }, [form.content, getSelectionRange, updateContentWithSelection, t])

  type ToolbarAction = () => void
  type ToolbarButton = {
    key: string
    tooltip: string
    action: ToolbarAction
    icon: typeof Bold
  }
  type ToolbarGroup = {
    key: string
    buttons: ToolbarButton[]
  }

  const toolbarGroups = useMemo<ToolbarGroup[]>(() => [
    {
      key: 'format',
      buttons: [
        { key: 'bold', icon: Bold, tooltip: t('manualEditor.toolbar.bold'), action: () => wrapSelection('**', '**', t('manualEditor.placeholders.bold')) },
        { key: 'italic', icon: Italic, tooltip: t('manualEditor.toolbar.italic'), action: () => wrapSelection('*', '*', t('manualEditor.placeholders.italic')) },
        { key: 'strike', icon: Strikethrough, tooltip: t('manualEditor.toolbar.strike'), action: () => wrapSelection('~~', '~~', t('manualEditor.placeholders.strike')) },
        { key: 'inline-code', icon: Code, tooltip: t('manualEditor.toolbar.inlineCode'), action: () => wrapSelection('`', '`', t('manualEditor.placeholders.inlineCode')) },
      ],
    },
    {
      key: 'heading',
      buttons: [
        { key: 'h1', icon: Heading1, tooltip: t('manualEditor.toolbar.heading1'), action: () => applyHeading(1) },
        { key: 'h2', icon: Heading2, tooltip: t('manualEditor.toolbar.heading2'), action: () => applyHeading(2) },
        { key: 'h3', icon: Heading3, tooltip: t('manualEditor.toolbar.heading3'), action: () => applyHeading(3) },
      ],
    },
    {
      key: 'list',
      buttons: [
        { key: 'ul', icon: List, tooltip: t('manualEditor.toolbar.bulletList'), action: applyBulletList },
        { key: 'ol', icon: ListOrdered, tooltip: t('manualEditor.toolbar.orderedList'), action: applyOrderedList },
        { key: 'task', icon: CheckSquare, tooltip: t('manualEditor.toolbar.taskList'), action: applyTaskList },
        { key: 'quote', icon: Quote, tooltip: t('manualEditor.toolbar.blockquote'), action: applyBlockquote },
      ],
    },
    {
      key: 'insert',
      buttons: [
        { key: 'codeblock', icon: CodeSquare, tooltip: t('manualEditor.toolbar.codeBlock'), action: insertCodeBlock },
        { key: 'link', icon: Link, tooltip: t('manualEditor.toolbar.link'), action: insertLink },
        { key: 'image', icon: Image, tooltip: t('manualEditor.toolbar.image'), action: insertImage },
        { key: 'table', icon: Table, tooltip: t('manualEditor.toolbar.table'), action: insertTable },
        { key: 'hr', icon: Minus, tooltip: t('manualEditor.toolbar.horizontalRule'), action: insertHorizontalRule },
      ],
    },
  ], [t, wrapSelection, applyHeading, applyBulletList, applyOrderedList, applyTaskList, applyBlockquote, insertCodeBlock, insertLink, insertImage, insertTable, insertHorizontalRule])

  const isPreviewMode = activeTab === 'preview'
  const viewToggleTooltip = isPreviewMode
    ? t('manualEditor.view.toggleToEdit')
    : t('manualEditor.view.toggleToPreview')
  const viewToggleLabel = isPreviewMode
    ? t('manualEditor.view.editLabel')
    : t('manualEditor.view.previewLabel')

  const handleToolbarAction = useCallback((action: ToolbarAction) => {
    if (saving) return
    if (activeTab !== 'edit') {
      setActiveTab('edit')
      setTimeout(() => {
        attachTextareaListeners()
        action()
      }, 0)
    } else {
      attachTextareaListeners()
      action()
    }
  }, [saving, activeTab, attachTextareaListeners])

  const toggleEditorView = useCallback(() => {
    setActiveTab((prev) => (prev === 'edit' ? 'preview' : 'edit'))
  }, [])

  const previewContent = useMemo(() => {
    if (!form.content) {
      return <p className="empty-preview">{t('manualEditor.preview.empty')}</p>
    }
    const safeMarkdown = safeMarkdownToHTML(form.content)
    return <ReactMarkdown>{safeMarkdown}</ReactMarkdown>
  }, [form.content, t])

  const kbDisabled = mode === 'edit' && !!form.kbId

  const dialogTitle = mode === 'edit'
    ? t('manualEditor.title.edit')
    : t('manualEditor.title.create')

  const lastUpdatedText = lastUpdatedAt
    ? t('manualEditor.status.lastUpdated', { time: lastUpdatedAt })
    : ''

  const loadKnowledgeBases = async () => {
    setKbLoading(true)
    try {
      const res: any = await listKnowledgeBases()
      const allKbs = Array.isArray(res?.data) ? res.data : []

      const list: KnowledgeBaseOption[] = allKbs
        .filter((item: any) => {
          const isDocument = !item.type || item.type === 'document'
          return isDocument
        })
        .map((item: any) => ({ label: item.name, value: item.id }))

      setKbOptions(list)

      if (mode === 'create') {
        const presetKbId = uiStore.manualEditorKBId
        if (presetKbId) {
          const exists = list.find((item) => item.value === presetKbId)
          if (!exists) {
            setKbOptions((prev) => [
              { label: t('manualEditor.labels.currentKnowledgeBase'), value: presetKbId },
              ...prev,
            ])
          }
          setForm((prev) => ({ ...prev, kbId: presetKbId }))
        } else {
          setForm((prev) => ({ ...prev, kbId: list[0]?.value ?? '' }))
        }
      }
    } catch (error) {
      console.error('[ManualEditor] Failed to load knowledge base list:', error)
      setKbOptions([])
    } finally {
      setKbLoading(false)
    }
  }

  const parseManualMetadata = (
    metadata: any,
  ): { content: string; status: ManualStatus; updatedAt?: string } | null => {
    if (!metadata) return null
    try {
      let parsed = metadata
      if (typeof metadata === 'string') {
        parsed = JSON.parse(metadata)
      }
      if (parsed && typeof parsed === 'object') {
        const status = parsed.status === 'publish' ? 'publish' : 'draft'
        return {
          content: parsed.content || '',
          status,
          updatedAt: parsed.updated_at || parsed.updatedAt,
        }
      }
    } catch (error) {
      console.warn('[ManualEditor] Failed to parse manual metadata:', error)
    }
    return null
  }

  const loadKnowledgeContent = async () => {
    if (!knowledgeId) return
    setContentLoading(true)
    try {
      const res: any = await getKnowledgeDetails(knowledgeId)
      const data: KnowledgeDetailResponse | undefined = res?.data
      if (!data) {
        alert(t('manualEditor.error.fetchDetailFailed'))
        return
      }

      const meta = parseManualMetadata(data.metadata)
      setForm((prev) => ({
        ...prev,
        kbId: data.knowledge_base_id || prev.kbId,
        title: data.title || data.file_name?.replace(/\.md$/i, '') || uiStore.manualEditorInitialTitle || '',
        content: meta?.content || uiStore.manualEditorInitialContent || '',
        status: meta?.status || (data.parse_status === 'completed' ? 'publish' : 'draft'),
      }))
      if (meta?.updatedAt) {
        setLastUpdatedAt(meta.updatedAt)
      }

      setKbOptions((prev) => {
        if (form.kbId && !prev.find((item) => item.value === form.kbId)) {
          return [
            { label: t('manualEditor.labels.currentKnowledgeBase'), value: form.kbId },
            ...prev,
          ]
        }
        return prev
      })
    } catch (error) {
      console.error('[ManualEditor] Failed to load manual knowledge:', error)
      alert(t('manualEditor.error.fetchDetailFailed'))
    } finally {
      setContentLoading(false)
    }
  }

  const resetForm = () => {
    setForm({
      kbId: uiStore.manualEditorKBId || '',
      title: uiStore.manualEditorInitialTitle || '',
      content: uiStore.manualEditorInitialContent || '',
      status: uiStore.manualEditorInitialStatus || 'draft',
    })
    setActiveTab('edit')
    setLastUpdatedAt('')
    setInitialLoaded(false)
    selectionRange.current.start = 0
    selectionRange.current.end = 0
  }

  const generateDefaultTitle = () => {
    if (uiStore.manualEditorInitialTitle) {
      return uiStore.manualEditorInitialTitle
    }
    return `${t('manualEditor.defaultTitlePrefix')}-${new Date().toLocaleString()}`
  }

  const initialize = async () => {
    resetForm()
    await loadKnowledgeBases()

    if (mode === 'edit') {
      await loadKnowledgeContent()
    } else {
      const presetKbId = uiStore.manualEditorKBId
      if (presetKbId) {
        setForm((prev) => ({ ...prev, kbId: presetKbId }))
      } else {
        setForm((prev) => {
          if (!prev.kbId && kbOptions.length) {
            return { ...prev, kbId: kbOptions[0].value }
          }
          return prev
        })
      }
      setForm((prev) => ({
        ...prev,
        title: prev.title || generateDefaultTitle(),
        content: prev.content || '',
      }))
    }

    setInitialLoaded(true)
  }

  const validateForm = (targetStatus: ManualStatus): boolean => {
    if (!form.kbId) {
      alert(t('manualEditor.warning.selectKnowledgeBase'))
      return false
    }
    if (!form.title || !form.title.trim()) {
      alert(t('manualEditor.warning.enterTitle'))
      return false
    }
    if (!form.content || !form.content.trim()) {
      alert(t('manualEditor.warning.enterContent'))
      return false
    }
    if (targetStatus === 'publish' && form.content.trim().length < 10) {
      alert(t('manualEditor.warning.contentTooShort'))
      return false
    }
    return true
  }

  const handleSave = async (targetStatus: ManualStatus) => {
    if (saving || !validateForm(targetStatus)) return
    setSaving(true)
    setSavingAction(targetStatus)
    try {
      const payload: { title: string; content: string; status: string; tag_id?: string } = {
        title: form.title.trim(),
        content: form.content,
        status: targetStatus,
      }
      let response: any
      let knowledgeID = knowledgeId
      const kbId = form.kbId

      if (mode === 'edit' && knowledgeId) {
        response = await updateManualKnowledge(knowledgeId, payload)
      } else {
        const tagIdToUpload = uiStore.selectedTagId !== '__untagged__' ? uiStore.selectedTagId : undefined
        if (tagIdToUpload) {
          payload.tag_id = tagIdToUpload
        }
        response = await createManualKnowledge(form.kbId, payload)
        knowledgeID = response?.data?.id || knowledgeID
      }

      if (response?.success) {
        alert(
          targetStatus === 'draft'
            ? t('manualEditor.success.draftSaved')
            : t('manualEditor.success.published'),
        )
        if (knowledgeID) {
          uiStore.notifyManualEditorSuccess({
            kbId,
            knowledgeId: knowledgeID,
            status: targetStatus,
          })
        }
        onClose()
      } else {
        alert(response?.message || t('manualEditor.error.saveFailed'))
      }
    } catch (error: any) {
      const message = error?.error?.message || error?.message || t('manualEditor.error.saveFailed')
      alert(message)
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    if (visible) {
      initialize()
      setTimeout(() => attachTextareaListeners(), 0)
      const length = form.content ? form.content.length : 0
      setTimeout(() => setSelectionRange(length, length), 0)
    } else {
      detachTextareaListeners()
      resetForm()
    }
  }, [visible])

  useEffect(() => {
    if (activeTab === 'edit') {
      setTimeout(() => attachTextareaListeners(), 0)
    } else {
      detachTextareaListeners()
    }
  }, [activeTab, attachTextareaListeners, detachTextareaListeners])

  return (
    <Dialog open={visible} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[880px] top-[5%] p-0 max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader className="px-6 pt-5 pb-0">
          <DialogTitle>{dialogTitle}</DialogTitle>
        </DialogHeader>

        {initialLoaded ? (
          <div className="flex-1 overflow-y-auto px-6 pb-3 space-y-4">
            {/* Knowledge Base Select */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('manualEditor.form.knowledgeBaseLabel')}</label>
              <select
                className="flex h-10 w-full rounded border border-[var(--td-border-level-1-color)] bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-[var(--td-brand-color)] disabled:cursor-not-allowed disabled:opacity-50"
                value={form.kbId}
                onChange={(e) => setForm((prev) => ({ ...prev, kbId: e.target.value }))}
                disabled={kbDisabled || kbLoading}
              >
                <option value="">{t('manualEditor.form.knowledgeBasePlaceholder')}</option>
                {kbOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {kbOptions.length === 0 && (
                <div className="p-5 text-center text-[var(--td-text-color-placeholder)]">
                  {t('manualEditor.noDocumentKnowledgeBases')}
                </div>
              )}
            </div>

            {/* Title Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('manualEditor.form.titleLabel')}</label>
              <Input
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                maxLength={100}
                placeholder={t('manualEditor.form.titlePlaceholder')}
              />
            </div>

            {/* Status Row */}
            {mode === 'edit' && (
              <div className="flex items-center gap-3">
                {form.status === 'draft' ? (
                  <span className="px-2 py-1 text-xs rounded bg-yellow-100 text-yellow-700">
                    {t('manualEditor.status.draftTag')}
                  </span>
                ) : (
                  <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-700">
                    {t('manualEditor.status.publishedTag')}
                  </span>
                )}
                {lastUpdatedText && (
                  <span className="text-xs text-[var(--td-text-color-disabled)]">
                    {lastUpdatedText}
                  </span>
                )}
              </div>
            )}

            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-2 p-3 bg-[var(--td-bg-color-container)] border border-[var(--td-component-stroke)] rounded-lg overflow-x-auto">
              {toolbarGroups.map((group, groupIndex) => (
                <div key={group.key} className="flex items-center gap-1">
                  {group.buttons.map((btn) => (
                    <button
                      key={btn.key}
                      type="button"
                      title={btn.tooltip}
                      className="toolbar-btn"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => handleToolbarAction(btn.action)}
                    >
                      <btn.icon size={16} />
                    </button>
                  ))}
                  {groupIndex < toolbarGroups.length - 1 && (
                    <div className="w-px h-6 bg-[var(--td-bg-color-secondarycontainer)] mx-1" />
                  )}
                </div>
              ))}
            </div>

            {/* Editor Area */}
            <div className="min-h-[300px] max-h-[520px] overflow-hidden">
              {activeTab === 'edit' ? (
                contentLoading ? (
                  <div className="flex items-center justify-center min-h-[240px]">
                    <Loader2 className="animate-spin mr-2" size={16} />
                    <span>{t('manualEditor.loading.content')}</span>
                  </div>
                ) : (
                  <Textarea
                    ref={textareaRef}
                    value={form.content}
                    onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))}
                    placeholder={t('manualEditor.form.contentPlaceholder')}
                    className="min-h-[300px] font-mono leading-relaxed"
                  />
                )
              ) : (
                <div className="preview-container min-h-[300px] max-h-[520px] overflow-y-auto p-4 bg-[var(--td-bg-color-secondarycontainer)] text-sm leading-relaxed">
                  {previewContent}
                </div>
              )}
            </div>

            {/* Footer */}
            <DialogFooter className="pt-2">
              <div className="flex justify-between items-center w-full">
                <div />
                <div className="flex gap-4 items-center">
                  <button
                    type="button"
                    title={viewToggleTooltip}
                    className="toggle-view-btn"
                    onClick={toggleEditorView}
                  >
                    {isPreviewMode ? <Edit3 size={16} /> : <Eye size={16} />}
                    <span>{viewToggleLabel}</span>
                  </button>
                  <Button
                    variant="outline"
                    onClick={onClose}
                  >
                    {t('manualEditor.actions.cancel')}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleSave('draft')}
                    disabled={saving}
                  >
                    {saving && savingAction === 'draft' && <Loader2 className="animate-spin mr-2" size={14} />}
                    {t('manualEditor.actions.saveDraft')}
                  </Button>
                  <Button onClick={() => handleSave('publish')} disabled={saving}>
                    {saving && savingAction === 'publish' && <Loader2 className="animate-spin mr-2" size={14} />}
                    {t('manualEditor.actions.publish')}
                  </Button>
                </div>
              </div>
            </DialogFooter>
          </div>
        ) : (
          <div className="flex items-center justify-center min-h-[240px]">
            <Loader2 className="animate-spin mr-2" size={16} />
            <span>{t('manualEditor.loading.preparing')}</span>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
