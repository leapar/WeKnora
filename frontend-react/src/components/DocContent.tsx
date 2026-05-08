import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { marked } from 'marked'
import mermaid from 'mermaid'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Loader2, ChevronDown, ChevronRight, Link, HelpCircle, Download, ExternalLink } from 'lucide-react'

interface DocContentProps {
  visible: boolean
  details: any
  onCloseDoc: () => void
}

interface ProcessedChunk {
  original: any
  processedContent: string
  questions: Array<{ id: string; question: string }>
  meta: string
  hasParent: boolean
}

mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  securityLevel: 'strict',
  fontFamily: 'PingFang SC, Microsoft YaHei, sans-serif',
  flowchart: {
    useMaxWidth: true,
    htmlLabels: true,
    curve: 'basis',
  },
  sequence: {
    useMaxWidth: true,
    diagramMarginX: 8,
    diagramMarginY: 8,
    actorMargin: 50,
    width: 150,
    height: 65,
  },
  gantt: {
    useMaxWidth: true,
    leftPadding: 75,
    gridLineStartPadding: 35,
    barHeight: 20,
    barGap: 4,
    topPadding: 50,
  },
})

marked.use({
  breaks: true,
  gfm: true,
})

const audioExtensions = new Set(['mp3', 'wav', 'm4a', 'flac', 'ogg'])
const previewSupportedTypes = new Set([
  'pdf', 'docx', 'pptx', 'ppt', 'xlsx', 'xls', 'csv',
  'jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'tiff', 'svg',
  'txt', 'md', 'markdown', 'json', 'xml', 'html', 'css', 'js', 'ts',
  'py', 'java', 'go', 'cpp', 'c', 'h', 'sh', 'yaml', 'yml',
  'ini', 'conf', 'log', 'sql', 'rs', 'rb', 'php', 'swift', 'kt',
  'scala', 'r', 'lua', 'pl', 'toml',
  'mp3', 'wav', 'm4a', 'flac', 'ogg',
])

export function DocContent({
  visible,
  details,
  onCloseDoc,
}: DocContentProps) {
  const { t } = useTranslation()
  const [viewMode, setViewMode] = useState<'chunks' | 'merged' | 'preview'>('merged')
  const [audioBlobUrl] = useState('')
  const [audioLoading] = useState(false)

  const [expandedChunks, setExpandedChunks] = useState<Set<number>>(new Set())
  const [parentContextExpanded, setParentContextExpanded] = useState<Set<number>>(new Set())
  const [parentContextCache, setParentContextCache] = useState<Map<string, string>>(new Map())
  const [parentContextLoading, setParentContextLoading] = useState<Set<number>>(new Set())
  const [summaryExpanded] = useState(false)

  const isAudioFile = useCallback((fileType?: string) => {
    if (!fileType) return false
    return audioExtensions.has(fileType.toLowerCase())
  }, [])

  const canPreview = useCallback((): boolean => {
    if (details?.type !== 'file') return false
    const ft = details?.file_type?.toLowerCase()
    if (!ft) return false
    if (audioExtensions.has(ft)) return false
    return previewSupportedTypes.has(ft)
  }, [details])

  useEffect(() => {
    if (!visible) return
    if (isAudioFile(details?.file_type)) {
      setViewMode('merged')
    } else if (details?.type === 'file' && canPreview()) {
      setViewMode('preview')
    } else {
      setViewMode('merged')
    }
  }, [visible, details?.id, details?.file_type, details?.type, canPreview, isAudioFile])

  useEffect(() => {
    if (audioBlobUrl) {
      return () => {
        URL.revokeObjectURL(audioBlobUrl)
      }
    }
  }, [audioBlobUrl])

  const preprocessMathDelimiters = (rawText: string): string => {
    if (!rawText || typeof rawText !== 'string') return ''
    return rawText
      .replace(/\\\[([\s\S]*?)\\\]/g, '$$$$$1$$$$')
      .replace(/\\\(([\s\S]*?)\\\)/g, '$$$1$$')
  }

  const mergeChunks = useCallback((chunks: any[]): string => {
    if (!chunks || chunks.length === 0) return ''
    const sortedChunks = [...chunks].sort((a, b) => {
      const startA = a.start_at ?? a.chunk_index ?? 0
      const startB = b.start_at ?? b.chunk_index ?? 0
      return startA - startB
    })
    const mergedChunks: Array<{ content: string; start_at: number; end_at: number }> = [{
      content: sortedChunks[0].content || '',
      start_at: sortedChunks[0].start_at ?? 0,
      end_at: sortedChunks[0].end_at ?? 0
    }]
    for (let i = 1; i < sortedChunks.length; i++) {
      const currentChunk = sortedChunks[i]
      const lastChunk = mergedChunks[mergedChunks.length - 1]
      const currentStartAt = currentChunk.start_at ?? 0
      const currentEndAt = currentChunk.end_at ?? 0
      const currentContent = currentChunk.content || ''
      if (currentStartAt > lastChunk.end_at) {
        mergedChunks.push({ content: currentContent, start_at: currentStartAt, end_at: currentEndAt })
        continue
      }
      if (currentEndAt > lastChunk.end_at) {
        const contentRunes = Array.from(currentContent)
        const contentLength = contentRunes.length
        const offset = contentLength - (currentEndAt - lastChunk.end_at)
        const newContent = contentRunes.slice(offset).join('')
        lastChunk.content = lastChunk.content + newContent
        lastChunk.end_at = currentEndAt
      }
    }
    return mergedChunks.map(chunk => chunk.content).join('\n\n')
  }, [])

  const mergedContent = useCallback(() => {
    const newChunks = details?.md
    if (newChunks && newChunks.length > 0) {
      return mergeChunks(newChunks)
    }
    return ''
  }, [details?.md, mergeChunks])

  const getChunkMeta = (item: any): string => {
    if (!item) return ''
    const parts = []
    if (item.char_count) parts.push(`${item.char_count} ${t('knowledgeBase.characters')}`)
    if (item.token_count) parts.push(`${item.token_count} tokens`)
    return parts.join(' · ')
  }

  const getGeneratedQuestions = (item: any): Array<{ id: string; question: string }> => {
    if (!item || !item.metadata) return []
    try {
      const metadata = typeof item.metadata === 'string' ? JSON.parse(item.metadata) : item.metadata
      const questions = metadata.generated_questions || []
      return questions.map((q: any, index: number) => {
        if (typeof q === 'string') return { id: `legacy-${index}`, question: q }
        return q
      })
    } catch {
      return []
    }
  }

  const hasParentChunk = (item: any) => !!item?.parent_chunk_id

  const processedChunks = useCallback((): ProcessedChunk[] => {
    return (details?.md || []).map((item: any) => ({
      original: item,
      processedContent: processMarkdown(item.content),
      questions: getGeneratedQuestions(item),
      meta: getChunkMeta(item),
      hasParent: hasParentChunk(item),
    }))
  }, [details?.md, t])

  const processMarkdown = (markdownText: string): string => {
    if (!markdownText || typeof markdownText !== 'string') return ''
    let processedText = markdownText.replace(/^\s*---\r?\n[\s\S]*?\r?\n---\r?\n/, '')
    processedText = processedText
      .replace(/&#39;/g, "'").replace(/&#x27;/gi, "'").replace(/&apos;/g, "'")
      .replace(/&#34;/g, '"').replace(/&#x22;/gi, '"').replace(/&quot;/g, '"')
      .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
    processedText = processedText.replace(/<p>\s*(\|[\s\S]*?\|)\s*<\/p>/gi, '\n$1\n')
    const mathSafeText = preprocessMathDelimiters(processedText)
    const html = marked.parse(mathSafeText) as string
    return html.replace(/&lt;br\s*\/?&gt;/gi, '<br>')
  }

  const toggleQuestions = (index: number) => {
    setExpandedChunks(prev => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  const toggleParentContext = async (item: any, index: number) => {
    if (parentContextExpanded.has(index)) {
      setParentContextExpanded(prev => {
        const next = new Set(prev)
        next.delete(index)
        return next
      })
      return
    }
    const parentId = item.parent_chunk_id
    if (!parentContextCache.has(parentId)) {
      setParentContextLoading(prev => new Set(prev).add(index))
      try {
        const response = await fetch(`/api/chunk/${parentId}`)
        const result = await response.json()
        if (result.success && result.data) {
          setParentContextCache(prev => new Map(prev).set(parentId, result.data.content || ''))
        }
      } catch (err) {
        console.error('Failed to load parent context:', err)
      } finally {
        setParentContextLoading(prev => {
          const next = new Set(prev)
          next.delete(index)
          return next
        })
      }
    }
    setParentContextExpanded(prev => new Set(prev).add(index))
  }

  const getDisplayTitle = () => {
    if (!details?.title) return ''
    if (details?.type === 'file') {
      const lastDotIndex = details.title.lastIndexOf('.')
      return lastDotIndex > 0 ? details.title.substring(0, lastDotIndex) : details.title
    }
    return details.title
  }

  const getTypeLabel = () => {
    switch (details?.type) {
      case 'url': return t('knowledgeBase.typeURL')
      case 'manual': return t('knowledgeBase.typeManual')
      case 'file': return details?.file_type?.toUpperCase() || t('knowledgeBase.typeFile')
      default: return ''
    }
  }

  const getTypeTheme = () => {
    switch (details?.type) {
      case 'url': return 'primary'
      case 'manual': return 'success'
      case 'file': return 'default'
      default: return 'default'
    }
  }

  const getContentLabel = () => {
    switch (details?.type) {
      case 'url': return t('knowledgeBase.webContent')
      case 'manual': return t('knowledgeBase.documentContent')
      case 'file':
      default: return t('knowledgeBase.fileContent')
    }
  }

  const getTimeLabel = () => {
    switch (details?.type) {
      case 'url': return t('knowledgeBase.importTime')
      case 'manual': return t('knowledgeBase.createTime')
      case 'file':
      default: return t('knowledgeBase.uploadTime')
    }
  }

  const getChannelLabel = (channel: string) => {
    const labelMap: Record<string, string> = {
      web: 'knowledgeBase.channelWeb',
      api: 'knowledgeBase.channelApi',
      browser_extension: 'knowledgeBase.channelBrowserExtension',
      wechat: 'knowledgeBase.channelWechat',
      wecom: 'knowledgeBase.channelWecom',
      feishu: 'knowledgeBase.channelFeishu',
      dingtalk: 'knowledgeBase.channelDingtalk',
      slack: 'knowledgeBase.channelSlack',
      im: 'knowledgeBase.channelIm',
    }
    const key = labelMap[channel]
    return key ? t(key) : t('knowledgeBase.channelUnknown')
  }

  const handleClose = () => {
    onCloseDoc()
    setViewMode('merged')
  }

  const downloadFile = () => {
    if (!details?.id) return
    fetch(`/api/knowledge/${details.id}/download`)
      .then(res => res.blob())
      .then(blob => {
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = details.title
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      })
      .catch(err => console.error('Download failed:', err))
  }

  if (!visible) return null

  return (
    <Sheet open={visible} onOpenChange={(open) => !open && handleClose()}>
      <SheetContent side="right" className="w-[min(654px,85vw)] max-w-[654px] p-0">
        <SheetHeader className="px-6 py-4 border-b">
          <div className="flex items-center gap-2">
            <SheetTitle className="flex-1 text-base font-medium truncate">
              {getDisplayTitle()}
            </SheetTitle>
            {details?.type && (
              <span className={`
                px-2 py-0.5 text-xs rounded
                ${getTypeTheme() === 'primary' ? 'bg-blue-100 text-blue-700' : ''}
                ${getTypeTheme() === 'success' ? 'bg-green-100 text-green-700' : ''}
                ${getTypeTheme() === 'default' ? 'bg-gray-100 text-gray-700' : ''}
              `}>
                {getTypeLabel()}
              </span>
            )}
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-6">
          {/* File Type Section */}
          {details?.type === 'file' && (
            <div className="mb-6">
              <span className="block text-sm font-semibold mb-2">{t('knowledgeBase.fileName')}</span>
              <div className="flex items-center bg-[var(--td-bg-color-container-hover)] rounded px-3 py-1.5">
                <span className="flex-1 text-[13px] break-all">{details.title}</span>
                <button
                  onClick={downloadFile}
                  className="ml-3 text-[var(--td-brand-color)] cursor-pointer"
                  aria-label="Download"
                >
                  <Download size={16} />
                </button>
              </div>
            </div>
          )}

          {/* URL Type Section */}
          {details?.type === 'url' && (
            <div className="mb-6">
              <span className="block text-sm font-semibold mb-2">{t('knowledgeBase.urlSource')}</span>
              <div className="bg-[var(--td-bg-color-container-hover)] rounded p-3">
                <a
                  href={details.source}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-[var(--td-brand-color)]"
                >
                  <Link size={14} />
                  <span className="flex-1 text-[13px] break-all">{details.source}</span>
                  <ExternalLink size={14} />
                </a>
              </div>
            </div>
          )}

          {/* Manual Type Section */}
          {details?.type === 'manual' && (
            <div className="mb-6">
              <span className="block text-sm font-semibold mb-2">{t('knowledgeBase.documentTitle')}</span>
              <div className="flex items-center bg-[var(--td-bg-color-container-hover)] rounded px-3 py-1.5">
                <span className="flex-1 text-[13px] break-word">{details.title}</span>
                <button
                  onClick={downloadFile}
                  className="ml-3 text-[var(--td-brand-color)] cursor-pointer"
                  aria-label="Download"
                >
                  <Download size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Summary */}
          {details?.description && (
            <div className="mb-6">
              <span className="block text-sm font-semibold mb-2">{t('knowledgeBase.documentSummary')}</span>
              <div
                className={`bg-[var(--td-bg-color-container-hover)] rounded p-3 text-[13px] leading-relaxed ${
                  !summaryExpanded ? 'max-h-[4.5em] overflow-hidden' : ''
                }`}
              >
                {details.description}
              </div>
            </div>
          )}

          {/* Content Header */}
          <div className="mb-4 pb-3 border-b border-[var(--td-component-stroke)]">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">{getContentLabel()}</span>
                {details?.total > 0 && (
                  <span className="text-[12px] text-[var(--td-text-color-secondary)] bg-[var(--td-bg-color-container-hover)] px-2 py-0.5 rounded">
                    {t('knowledgeBase.chunkCount', { count: details.total })}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[12px] text-[var(--td-text-color-secondary)]">
                    {getTimeLabel()}：{details?.time}
                  </span>
                  {details?.channel && details.channel !== 'web' && (
                    <span className="px-2 py-0.5 text-[12px] bg-yellow-100 text-yellow-700 rounded">
                      {getChannelLabel(details.channel)}
                    </span>
                  )}
                </div>
                <div className="flex gap-1">
                  {canPreview() && (
                    <Button
                      size="sm"
                      variant={viewMode === 'preview' ? 'default' : 'outline'}
                      onClick={() => setViewMode('preview')}
                      className="h-7 min-w-[60px] text-xs"
                    >
                      {t('preview.tab')}
                    </Button>
                  )}
                  {!canPreview() && (
                    <Button
                      size="sm"
                      variant={viewMode === 'merged' ? 'default' : 'outline'}
                      onClick={() => setViewMode('merged')}
                      className="h-7 min-w-[60px] text-xs"
                    >
                      {t('knowledgeBase.viewMerged')}
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant={viewMode === 'chunks' ? 'default' : 'outline'}
                    onClick={() => setViewMode('chunks')}
                    className="h-7 min-w-[60px] text-xs"
                  >
                    {t('knowledgeBase.viewChunks')}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Audio Player */}
          {isAudioFile(details?.file_type) && (
            <div className="mb-4 p-4 bg-[var(--td-bg-color-container-hover)] rounded-md border border-[var(--td-component-border)]">
              {audioLoading ? (
                <div className="flex items-center gap-2 text-[var(--td-text-color-placeholder)] text-[13px]">
                  <Loader2 size={14} className="animate-spin" />
                  <span>{t('preview.audioLoading')}</span>
                </div>
              ) : audioBlobUrl ? (
                <audio controls className="w-full h-10" src={audioBlobUrl}>
                  {t('preview.audioNotSupported')}
                </audio>
              ) : null}
            </div>
          )}

          {/* Merged View */}
          {viewMode === 'merged' && (
            <div>
              {!mergedContent() ? (
                <div className="mt-3 text-[var(--td-text-color-disabled)] text-[13px] p-4 text-center">
                  {t('common.noData')}
                </div>
              ) : (
                <div
                  className="markdown-content break-words leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: processMarkdown(mergedContent()) }}
                />
              )}
            </div>
          )}

          {/* Chunks View */}
          {viewMode === 'chunks' && (
            <div className="flex flex-col gap-3">
              {!processedChunks().length ? (
                <div className="mt-3 text-[var(--td-text-color-disabled)] text-[13px] p-4 text-center">
                  {t('common.noData')}
                </div>
              ) : (
                processedChunks().map((chunk, index) => (
                  <div key={index} className="rounded p-4 bg-[var(--td-bg-color-container)] border border-[var(--td-component-border)]">
                    <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-[var(--td-component-stroke)]">
                      <span className="text-[12px] font-semibold text-[var(--td-text-color-placeholder)] tracking-wide">
                        {t('knowledgeBase.segment')} {index + 1}
                      </span>
                      <div className="flex items-center gap-2">
                        {chunk.hasParent && (
                          <span className="px-1.5 py-0.5 text-[11px] bg-blue-100 text-blue-700 rounded">
                            {t('knowledgeBase.childChunk')}
                          </span>
                        )}
                        {chunk.questions.length > 0 && (
                          <span className="px-1.5 py-0.5 text-[11px] bg-green-100 text-green-700 rounded">
                            {t('knowledgeBase.questions')} {chunk.questions.length}
                          </span>
                        )}
                        <span className="text-[11px] text-[var(--td-text-color-disabled)]">{chunk.meta}</span>
                      </div>
                    </div>
                    <div
                      className="markdown-content break-words"
                      dangerouslySetInnerHTML={{ __html: chunk.processedContent }}
                    />

                    {/* Parent Context */}
                    {chunk.hasParent && (
                      <div className="mt-2.5 pt-2 border-t border-dashed border-[var(--td-component-stroke)]">
                        <button
                          onClick={() => toggleParentContext(chunk.original, index)}
                          className="flex items-center gap-1.5 text-[var(--td-brand-color)] text-[12px] font-medium cursor-pointer"
                        >
                          {parentContextLoading.has(index) ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : parentContextExpanded.has(index) ? (
                            <ChevronDown size={14} />
                          ) : (
                            <ChevronRight size={14} />
                          )}
                          <span>{t('knowledgeBase.viewParentContext')}</span>
                        </button>
                        {parentContextExpanded.has(index) && (
                          <div className="mt-2 p-3 bg-[var(--td-brand-color-light)] border-l-3 border-[var(--td-brand-color)] rounded text-[13px] text-[var(--td-text-color-secondary)]">
                            <div
                              className="markdown-content"
                              dangerouslySetInnerHTML={{
                                __html: processMarkdown(parentContextCache.get(chunk.original.parent_chunk_id) || '')
                              }}
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Questions */}
                    {chunk.questions.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-dashed border-[var(--td-component-stroke)]">
                        <button
                          onClick={() => toggleQuestions(index)}
                          className="flex items-center gap-1.5 text-[var(--td-brand-color-active)] text-[12px] font-medium cursor-pointer"
                        >
                          {expandedChunks.has(index) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                          <span>{t('knowledgeBase.generatedQuestions')} ({chunk.questions.length})</span>
                        </button>
                        {expandedChunks.has(index) && (
                          <div className="mt-2 pl-1">
                            {chunk.questions.map((q) => (
                              <div
                                key={q.id}
                                className="flex items-start gap-2 p-1.5 mb-1 bg-green-50 rounded text-[13px] text-[var(--td-text-color-primary)] leading-relaxed"
                              >
                                <HelpCircle size={14} className="text-[var(--td-brand-color-active)] mt-0.5 flex-shrink-0" />
                                <span className="flex-1 break-word">{q.question}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* Preview View */}
          {viewMode === 'preview' && (
            <div className="h-96 flex items-center justify-center text-[var(--td-text-color-placeholder)]">
              {t('common.noData')}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}