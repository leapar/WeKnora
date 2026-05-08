import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, X, Check } from 'lucide-react'

interface KnowledgeBase {
  id: string
  name: string
  type?: 'document' | 'faq'
  knowledge_count?: number
  chunk_count?: number
  embedding_model_id?: string
  summary_model_id?: string
}

interface KnowledgeBaseSelectorProps {
  visible: boolean
  anchorEl?: HTMLElement | null
  selectedIds: string[]
  dropdownWidth?: number
  offsetY?: number
  onClose: () => void
  onChange: (ids: string[]) => void
}

// Mock API function - replace with actual API call
async function listKnowledgeBases(): Promise<KnowledgeBase[]> {
  // In a real implementation, this would call the API
  // const response = await get<any>('/knowledge-bases')
  // return response.data || []
  return []
}

export function KnowledgeBaseSelector({
  visible,
  anchorEl,
  selectedIds,
  dropdownWidth = 300,
  offsetY = 8,
  onClose,
  onChange,
}: KnowledgeBaseSelectorProps) {
  const { t } = useTranslation()
  const searchInputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([])
  const [loading, setLoading] = useState(false)
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({})

  // Filter: only show KBs with embedding & summary models initialized
  const filteredKnowledgeBases = knowledgeBases.filter(kb => {
    if (!kb.embedding_model_id || !kb.summary_model_id) return false
    if (!searchQuery) return true
    return kb.name.toLowerCase().includes(searchQuery.toLowerCase())
  })

  const isSelected = (id: string) => selectedIds.includes(id)

  const toggleKb = (id: string) => {
    if (isSelected(id)) {
      onChange(selectedIds.filter(i => i !== id))
    } else {
      onChange([...selectedIds, id])
    }
  }

  const selectAll = () => {
    onChange(filteredKnowledgeBases.map(kb => kb.id))
  }

  const clearAll = () => {
    onChange([])
  }

  const loadKnowledgeBases = async () => {
    setLoading(true)
    try {
      const data = await listKnowledgeBases()
      setKnowledgeBases(data)
    } catch (error) {
      console.error('Failed to load knowledge bases:', error)
    } finally {
      setLoading(false)
    }
  }

  // Update dropdown position
  const updateDropdownPosition = () => {
    if (!anchorEl) {
      // Fallback: center position
      const vw = window.innerWidth
      const topFallback = Math.max(80, window.innerHeight / 2 - 160)
      setDropdownStyle({
        position: 'fixed',
        width: `${dropdownWidth}px`,
        left: `${Math.round((vw - dropdownWidth) / 2)}px`,
        top: `${Math.round(topFallback)}px`,
      })
      return
    }

    const rect = anchorEl.getBoundingClientRect()
    const vh = window.innerHeight
    const vw = window.innerWidth

    let left = Math.floor(rect.left)
    const minLeft = 16
    const maxLeft = Math.max(16, vw - dropdownWidth - 16)
    left = Math.max(minLeft, Math.min(maxLeft, left))

    const preferredDropdownHeight = 280
    const minDropdownHeight = 200
    const topMargin = 20
    const spaceBelow = vh - rect.bottom
    const spaceAbove = rect.top

    let actualHeight: number
    let shouldOpenBelow: boolean

    if (spaceBelow >= minDropdownHeight + offsetY) {
      actualHeight = Math.min(preferredDropdownHeight, spaceBelow - offsetY - 16)
      shouldOpenBelow = true
    } else {
      const availableHeight = spaceAbove - offsetY - topMargin
      if (availableHeight >= preferredDropdownHeight) {
        actualHeight = preferredDropdownHeight
      } else {
        actualHeight = Math.max(minDropdownHeight, availableHeight)
      }
      shouldOpenBelow = false
    }

    if (shouldOpenBelow) {
      const top = Math.floor(rect.bottom + offsetY)
      setDropdownStyle({
        position: 'fixed',
        width: `${dropdownWidth}px`,
        left: `${left}px`,
        top: `${top}px`,
        maxHeight: `${actualHeight}px`,
      })
    } else {
      const bottom = vh - rect.top + offsetY
      setDropdownStyle({
        position: 'fixed',
        width: `${dropdownWidth}px`,
        left: `${left}px`,
        bottom: `${bottom}px`,
        maxHeight: `${actualHeight}px`,
      })
    }
  }

  useEffect(() => {
    if (visible) {
      loadKnowledgeBases()
      requestAnimationFrame(() => {
        updateDropdownPosition()
        setTimeout(updateDropdownPosition, 50)
      })
      setTimeout(() => searchInputRef.current?.focus(), 100)
    } else {
      setSearchQuery('')
    }
  }, [visible])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    const handleResize = () => {
      if (visible) updateDropdownPosition()
    }
    const handleScroll = () => {
      if (visible) updateDropdownPosition()
    }

    if (visible) {
      document.addEventListener('mousedown', handleClickOutside)
      window.addEventListener('resize', handleResize, { passive: true })
      window.addEventListener('scroll', handleScroll, { passive: true, capture: true })
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('scroll', handleScroll, { capture: true })
    }
  }, [visible, onClose])

  if (!visible) return null

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-[9999]"
        onClick={onClose}
        style={{ background: 'transparent', touchAction: 'none' }}
      />

      {/* Dropdown */}
      <div
        ref={dropdownRef}
        className="fixed bg-[var(--td-bg-color-container)] rounded-[10px] border border-[var(--td-component-border)] shadow-lg overflow-hidden flex flex-col animate-in fade-in-0 zoom-in-95 duration-150"
        style={dropdownStyle}
        onClick={e => e.stopPropagation()}
      >
        {/* Search */}
        <div className="px-2.5 py-2 border-b border-[var(--td-component-stroke)]">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--td-text-color-placeholder)]" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={t('knowledgeBase.searchPlaceholder')}
              className="w-full pl-8 pr-8 py-1.5 text-xs bg-[var(--td-bg-color-secondarycontainer)] border border-[var(--td-component-stroke)] rounded-md outline-none focus:border-[var(--td-success-color)] focus:bg-[var(--td-bg-color-container)] transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--td-text-color-placeholder)] hover:text-[var(--td-text-color-secondary)]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-2" style={{ maxHeight: '260px', overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch' }}>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <span className="text-xs text-[var(--td-text-color-placeholder)]">{t('common.loading')}</span>
            </div>
          ) : filteredKnowledgeBases.length === 0 ? (
            <div className="text-center text-xs text-[var(--td-text-color-placeholder)] py-8">
              {searchQuery ? t('knowledgeBase.noMatch') : t('knowledgeBase.noKnowledge')}
            </div>
          ) : (
            filteredKnowledgeBases.map(kb => (
              <div
                key={kb.id}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors mb-1 last:mb-0 ${
                  isSelected(kb.id)
                    ? 'bg-[var(--td-brand-color-light)]'
                    : 'hover:bg-[var(--td-bg-color-secondarycontainer)]'
                }`}
                onClick={() => toggleKb(kb.id)}
              >
                {/* Checkbox */}
                <div
                  className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                    isSelected(kb.id)
                      ? 'bg-[var(--td-success-color)] border-[var(--td-success-color)]'
                      : 'border-[var(--td-component-border)]'
                  }`}
                >
                  {isSelected(kb.id) && <Check className="w-2.5 h-2.5 text-white" />}
                </div>

                {/* Icon */}
                <div className="w-4 h-4 flex items-center justify-center flex-shrink-0 text-[var(--td-brand-color-active)]">
                  {kb.type === 'faq' ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M9 9a3 3 0 1 1 4 2.83V14" />
                      <circle cx="12" cy="17" r="0.5" fill="currentColor" />
                    </svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                    </svg>
                  )}
                </div>

                {/* Name */}
                <div className="flex-1 min-w-0 flex items-center gap-1">
                  <span className="text-xs text-[var(--td-text-color-primary)] truncate">
                    {kb.name}
                  </span>
                  <span className="text-[11px] text-[var(--td-text-color-placeholder)] flex-shrink-0">
                    ({kb.type === 'faq' ? (kb.chunk_count || 0) : (kb.knowledge_count || 0)})
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 px-2.5 py-2 border-t border-[var(--td-component-stroke)] bg-[var(--td-bg-color-secondarycontainer)]">
          <button
            onClick={selectAll}
            className="flex-1 px-2.5 py-1.5 text-xs rounded-md border border-[var(--td-component-stroke)] bg-[var(--td-bg-color-container)] text-[var(--td-text-color-secondary)] hover:border-[var(--td-success-color)] hover:text-[var(--td-success-color)] hover:bg-[var(--td-brand-color-light)] transition-colors"
          >
            {t('common.selectAll')}
          </button>
          <button
            onClick={clearAll}
            className="flex-1 px-2.5 py-1.5 text-xs rounded-md border border-[var(--td-component-stroke)] bg-[var(--td-bg-color-container)] text-[var(--td-text-color-secondary)] hover:border-[var(--td-success-color)] hover:text-[var(--td-success-color)] hover:bg-[var(--td-brand-color-light)] transition-colors"
          >
            {t('common.clear')}
          </button>
        </div>
      </div>
    </>
  )
}
