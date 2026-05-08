import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronDown, ChevronRight, FileText, ArrowRight } from 'lucide-react'

interface KnowledgeReference {
  id: string
  knowledge_id?: string
  knowledge_title?: string
  knowledge_base_id?: string
  knowledge_filename?: string
  content?: string
  chunk_type?: string
  metadata?: {
    url?: string
    title?: string
  }
}

interface DocInfoProps {
  session: {
    knowledge_references?: KnowledgeReference[]
  }
}

export function DocInfo({ session }: DocInfoProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [showReferBox, setShowReferBox] = useState(false)
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})

  if (!session?.knowledge_references?.length) return null

  const webSearchRefs = session.knowledge_references.filter(item => item.chunk_type === 'web_search')
  const knowledgeRefs = session.knowledge_references.filter(item => item.chunk_type !== 'web_search')

  const groupedKnowledgeRefs = (() => {
    const groupMap = new Map<string, {
      key: string
      title: string
      knowledgeId?: string
      knowledgeBaseId?: string
      chunks: KnowledgeReference[]
    }>()
    for (const item of knowledgeRefs) {
      const key = item.knowledge_id || item.knowledge_title || item.id
      if (!groupMap.has(key)) {
        groupMap.set(key, {
          key,
          title: item.knowledge_title || item.knowledge_filename || key,
          knowledgeId: item.knowledge_id,
          knowledgeBaseId: item.knowledge_base_id,
          chunks: [],
        })
      }
      groupMap.get(key)!.chunks.push(item)
    }
    return Array.from(groupMap.values())
  })()

  const toggleGroup = (key: string) => {
    setExpandedGroups(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const navigateToDocument = (group: typeof groupedKnowledgeRefs[0]) => {
    if (!group.knowledgeBaseId) return
    navigate(`/platform/knowledge-bases/${group.knowledgeBaseId}`)
  }

  const getWebSearchUrl = (item: KnowledgeReference) => {
    if (item.metadata?.url) return item.metadata.url
    if (item.id && (item.id.startsWith('http://') || item.id.startsWith('https://'))) return item.id
    return '#'
  }

  const getWebSearchDisplayText = (item: KnowledgeReference) => {
    if (item.knowledge_title) return item.knowledge_title
    if (item.metadata?.title) return item.metadata.title
    const url = getWebSearchUrl(item)
    if (url && url !== '#') {
      try {
        const urlObj = new URL(url)
        return urlObj.hostname
      } catch {
        return url
      }
    }
    return 'Web Search Result'
  }

  const truncateContent = (content?: string, maxLen = 80) => {
    if (!content) return ''
    const text = content.replace(/\n/g, ' ').trim()
    if (text.length <= maxLen) return text
    return text.slice(0, maxLen) + '...'
  }

  const headerText = (() => {
    const total = session.knowledge_references?.length ?? 0
    const docCount = groupedKnowledgeRefs.length
    const webCount = webSearchRefs.length
    if (docCount > 0 && webCount > 0) {
      return `${docCount} documents, ${webCount} web results`
    }
    if (docCount > 0) {
      return `${docCount} ${t('chat.referenceDocs', { count: docCount })}`
    }
    return `${total} references`
  })()

  return (
    <div className="refer flex flex-col text-xs w-full rounded-lg bg-white border border-[var(--td-component-stroke)] shadow-sm mb-2 overflow-hidden transition-all duration-250">
      <div
        className="flex justify-between items-center px-3 py-1.5 cursor-pointer hover:bg-[rgba(7,192,95,0.04)]"
        onClick={() => setShowReferBox(!showReferBox)}
      >
        <div className="flex items-center gap-2">
          <img src="/img/ziliao.svg" alt="reference" className="w-4 h-4" />
          <span className="whitespace-nowrap text-sm">{headerText}</span>
        </div>
        <div className="text-[var(--td-brand-color)]">
          {showReferBox ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </div>
      </div>

      {showReferBox && (
        <div className="px-3 py-2 border-t border-[var(--td-bg-color-secondarycontainer)]">
          {webSearchRefs.map((item, index) => (
            <a
              key={`web-${index}`}
              href={getWebSearchUrl(item)}
              target="_blank"
              rel="noopener noreferrer"
              className="doc doc-web text-[var(--td-brand-color)] hover:bg-[rgba(7,192,95,0.08)] block py-0.5 border-b border-dashed border-[var(--td-brand-color)]"
            >
              {webSearchRefs.length < 2 ? getWebSearchDisplayText(item) : `${index + 1}. ${getWebSearchDisplayText(item)}`}
            </a>
          ))}

          {groupedKnowledgeRefs.map((group) => (
            <div key={group.key} className="mt-1">
              <div
                className="flex items-center justify-between px-1 py-1 rounded cursor-pointer hover:bg-[rgba(7,192,95,0.04)]"
                onClick={() => toggleGroup(group.key)}
              >
                <div className="flex items-center gap-1 min-w-0 flex-1">
                  {expandedGroups[group.key] ? (
                    <ChevronDown size={14} className="text-[var(--td-text-color-placeholder)] flex-shrink-0" />
                  ) : (
                    <ChevronRight size={14} className="text-[var(--td-text-color-placeholder)] flex-shrink-0" />
                  )}
                  <FileText size={14} className="text-[var(--td-brand-color)] flex-shrink-0" />
                  <span className="truncate max-w-[200px] text-[var(--td-text-color-primary)] font-medium">
                    {group.title}
                  </span>
                  <span className="text-[var(--td-text-color-placeholder)] text-xs flex-shrink-0">
                    {group.chunks.length} chunks
                  </span>
                </div>
                {group.knowledgeBaseId && (
                  <button
                    className="p-1 rounded hover:bg-[var(--td-brand-color-light)] text-[var(--td-brand-color)]"
                    onClick={(e) => {
                      e.stopPropagation()
                      navigateToDocument(group)
                    }}
                  >
                    <ArrowRight size={14} />
                  </button>
                )}
              </div>

              {expandedGroups[group.key] && (
                <div className="pl-5">
                  {group.chunks.map((chunk, cIdx) => (
                    <div
                      key={`chunk-${cIdx}`}
                      className="px-2 py-1 text-[var(--td-text-color-secondary)] text-xs rounded cursor-pointer hover:bg-[rgba(7,192,95,0.04)] hover:text-[var(--td-brand-color)] truncate"
                      title={chunk.content}
                    >
                      <span className="text-[var(--td-text-color-placeholder)] mr-1">#{cIdx + 1}</span>
                      {truncateContent(chunk.content, 80)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}