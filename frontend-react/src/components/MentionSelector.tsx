import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Folder, FileText, MessageCircleQuestion, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getKnowledgeBaseById } from '@/api/knowledge-base'
import { useSettingsStore } from '@/stores/settingsStore'

interface MentionItem {
  id: string
  name: string
  type: 'kb' | 'file'
  kbType?: 'document' | 'faq'
  count?: number
  kbName?: string
  orgName?: string
  kbId?: string
}

type DetailState = { loading: boolean; error?: string; data?: any }

interface MentionSelectorProps {
  visible: boolean
  style?: React.CSSProperties
  items: MentionItem[]
  activeIndex: number
  hasMore?: boolean
  loading?: boolean
  emptyHint?: string
  onSelect: (item: MentionItem) => void
  onActiveIndexChange: (index: number) => void
  onLoadMore?: () => void
}

// Knowledge base detail popup component
function KbDetailPopup({
  item,
  detail,
  onOrgClick,
  agentIdForDetail,
}: {
  item: MentionItem
  detail: DetailState
  onOrgClick: (orgName: string) => void
  agentIdForDetail?: string
}) {
  const { t } = useTranslation()

  return (
    <div className="mention-detail-popup-content">
      {detail.loading && (
        <div className="detail-loading">
          <Loader2 className="animate-spin" size={14} />
        </div>
      )}
      {detail.error && <div className="detail-error">{detail.error}</div>}
      {detail.data && (
        <>
          <div className="detail-header">
            <span className="detail-name">{detail.data.name}</span>
            <span
              className={cn(
                'detail-type-badge',
                detail.data.type === 'faq' ? 'faq' : 'doc'
              )}
            >
              {detail.data.type === 'faq'
                ? t('knowledgeEditor.basic.typeFAQ')
                : t('knowledgeEditor.basic.typeDocument')}
            </span>
          </div>
          {detail.data.description && (
            <p className="detail-desc">{detail.data.description}</p>
          )}
          <div className="detail-meta">
            <span>
              {detail.data.type === 'faq'
                ? t('mentionDetail.faqCount', {
                    count:
                      detail.data.chunk_count ??
                      detail.data.count ??
                      0,
                  })
                : t('mentionDetail.kbCount', {
                    count:
                      detail.data.knowledge_count ??
                      detail.data.count ??
                      0,
                  })}
            </span>
            {(detail.data.org_name || item.orgName) && (
              <span className="detail-org">
                <img
                  src="/assets/img/organization-green.svg"
                  className="detail-icon-img"
                  alt=""
                  aria-hidden="true"
                />
                <span className="detail-label">{t('mentionDetail.belongsToOrg')}</span>
                <span
                  className="detail-value clickable"
                  onClick={(e) => {
                    e.stopPropagation()
                    onOrgClick(detail.data.org_name || item.orgName)
                  }}
                >
                  {detail.data.org_name || item.orgName}
                </span>
              </span>
            )}
            {agentIdForDetail &&
              (detail.data.org_name || item.orgName) && (
                <span className="detail-readonly-hint">
                  {t('mentionDetail.readOnlyFromAgent')}
                </span>
              )}
          </div>
        </>
      )}
    </div>
  )
}

// File detail popup component
function FileDetailPopup({
  item,
  detail,
  onOrgClick,
  onKbClick,
}: {
  item: MentionItem
  detail: DetailState
  onOrgClick: (orgName: string) => void
  onKbClick?: (kbId: string | undefined) => void
}) {
  const { t } = useTranslation()

  return (
    <div className="mention-detail-popup-content">
      {detail.loading && (
        <div className="detail-loading">
          <Loader2 className="animate-spin" size={14} />
        </div>
      )}
      {detail.error && <div className="detail-error">{detail.error}</div>}
      {detail.data && (
        <>
          <div className="detail-header">
            <span className="detail-name">
              {detail.data.title || detail.data.file_name || item.name}
            </span>
          </div>
          {detail.data.description && (
            <p className="detail-desc">{detail.data.description}</p>
          )}
          <div className="detail-meta">
            {(detail.data.knowledge_base_name || item.kbName) && (
              <span className="detail-kb">
                <Folder size={14} className="detail-icon" />
                <span className="detail-label">{t('mentionDetail.belongsToKb')}</span>
                <span
                  className="detail-value clickable"
                  onClick={(e) => {
                    e.stopPropagation()
                    onKbClick?.(
                      detail.data.knowledge_base_id || (item as any).kbId
                    )
                  }}
                >
                  {detail.data.knowledge_base_name || item.kbName}
                </span>
              </span>
            )}
            {item.orgName && (
              <span className="detail-org">
                <img
                  src="/assets/img/organization-green.svg"
                  className="detail-icon-img"
                  alt=""
                  aria-hidden="true"
                />
                <span className="detail-label">{t('mentionDetail.belongsToOrg')}</span>
                <span
                  className="detail-value clickable"
                  onClick={(e) => {
                    e.stopPropagation()
                    onOrgClick(item.orgName || '')
                  }}
                >
                  {item.orgName}
                </span>
              </span>
            )}
          </div>
        </>
      )}
    </div>
  )
}

// Hover popup wrapper
function HoverPopup({
  children,
  content,
  disabled,
}: {
  children: React.ReactNode
  content: React.ReactNode
  disabled?: boolean
}) {
  const [visible, setVisible] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const triggerRef = useRef<HTMLDivElement>(null)
  const popupRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showPopup = useCallback(() => {
    if (disabled) return
    timeoutRef.current = setTimeout(() => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect()
        setPosition({
          top: rect.top,
          left: rect.right + 8,
        })
        setVisible(true)
      }
    }, 200)
  }, [disabled])

  const hidePopup = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    setVisible(false)
  }, [])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  if (disabled) {
    return <>{children}</>
  }

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={showPopup}
        onMouseLeave={hidePopup}
      >
        {children}
      </div>
      {visible && (
        <div
          ref={popupRef}
          className="mention-detail-popup"
          style={{
            position: 'fixed',
            top: position.top,
            left: position.left,
            zIndex: 10001,
          }}
          onMouseEnter={() => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current)
            setVisible(true)
          }}
          onMouseLeave={hidePopup}
        >
          <div className="mention-detail-popup-arrow" />
          <div className="mention-detail-popup-content-wrap">{content}</div>
        </div>
      )}
    </>
  )
}

export function MentionSelector({
  visible,
  style,
  items,
  activeIndex,
  hasMore = false,
  loading = false,
  emptyHint,
  onSelect,
  onActiveIndexChange,
  onLoadMore,
}: MentionSelectorProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const menuRef = useRef<HTMLDivElement>(null)
  const [detailCache, setDetailCache] = useState<Record<string, DetailState>>({})
  const [isScrolling, setIsScrolling] = useState(false)
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const settingsStore = useSettingsStore()

  // Shared agent context for KB/file detail requests
  const agentIdForDetail = useMemo(() => {
    const sourceTenantId = settingsStore.settings.agentConfig.selectedAgentSourceTenantId
    const agentId = settingsStore.settings.agentConfig.selectedAgentId
    return sourceTenantId && agentId ? agentId : undefined
  }, [
    settingsStore.settings.agentConfig.selectedAgentSourceTenantId,
    settingsStore.settings.agentConfig.selectedAgentId,
  ])

  const kbItems = useMemo(
    () => items.filter((item) => item.type === 'kb'),
    [items]
  )
  const fileItems = useMemo(
    () => items.filter((item) => item.type === 'file'),
    [items]
  )

  const fetchKbDetail = useCallback(
    async (item: { id: string }) => {
      if (detailCache[item.id]?.data || detailCache[item.id]?.loading) return
      setDetailCache((prev) => ({ ...prev, [item.id]: { loading: true } }))
      try {
        const opts = agentIdForDetail ? { agent_id: agentIdForDetail } : undefined
        const res: any = await getKnowledgeBaseById(item.id, opts)
        setDetailCache((prev) => ({
          ...prev,
          [item.id]: { loading: false, data: res?.data ?? res },
        }))
      } catch (e: any) {
        setDetailCache((prev) => ({
          ...prev,
          [item.id]: { loading: false, error: e?.message || 'Failed to load' },
        }))
      }
    },
    [agentIdForDetail, detailCache]
  )

  // Note: getKnowledgeDetails is not yet exported from the React API
  // For now, we'll use a placeholder or mock
  const fetchFileDetail = useCallback(
    async (item: MentionItem) => {
      if (detailCache[item.id]?.data || detailCache[item.id]?.loading) return
      setDetailCache((prev) => ({ ...prev, [item.id]: { loading: true } }))
      try {
        // TODO: Implement getKnowledgeDetails in api/knowledge-base.ts
        // const opts = agentIdForDetail ? { agent_id: agentIdForDetail } : undefined
        // const res: any = await getKnowledgeDetails(item.id, opts)
        // setDetailCache((prev) => ({
        //   ...prev,
        //   [item.id]: { loading: false, data: res?.data ?? res },
        // }))
        // Placeholder:
        setDetailCache((prev) => ({
          ...prev,
          [item.id]: { loading: false, data: { title: item.name } },
        }))
      } catch (e: any) {
        setDetailCache((prev) => ({
          ...prev,
          [item.id]: { loading: false, error: e?.message || 'Failed to load' },
        }))
      }
    },
    [agentIdForDetail, detailCache]
  )

  const handleKbClick = useCallback(
    (kbId: string | undefined) => {
      if (!kbId) return
      navigate(`/platform/knowledge-bases/${kbId}`)
    },
    [navigate]
  )

  const handleOrgClick = useCallback(
    (orgName: string) => {
      if (!orgName) return
      // Navigate to organizations page - the store doesn't have sharedKnowledgeBases
      // so we just navigate directly
      navigate('/platform/organizations')
    },
    [navigate]
  )

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      setIsScrolling(true)
      if (scrollTimerRef.current) {
        clearTimeout(scrollTimerRef.current)
      }
      scrollTimerRef.current = setTimeout(() => {
        setIsScrolling(false)
      }, 150)

      const target = e.target as HTMLDivElement
      const { scrollTop, scrollHeight, clientHeight } = target
      if (
        scrollHeight - scrollTop - clientHeight < 50 &&
        hasMore &&
        !loading
      ) {
        onLoadMore?.()
      }
    },
    [hasMore, loading, onLoadMore]
  )

  // Scroll to active item
  const scrollToItem = useCallback(
    (index: number) => {
      if (!menuRef.current) return

      const menuItems = menuRef.current.querySelectorAll('.mention-item')
      if (!menuItems || menuItems.length <= index) return

      const activeItem = menuItems[index] as HTMLElement
      const menu = menuRef.current

      if (activeItem) {
        const menuRect = menu.getBoundingClientRect()
        const itemRect = activeItem.getBoundingClientRect()

        // Check if above viewport
        if (itemRect.top < menuRect.top) {
          menu.scrollTop -= menuRect.top - itemRect.top
        }
        // Check if below viewport
        else if (itemRect.bottom > menuRect.bottom) {
          menu.scrollTop += itemRect.bottom - menuRect.bottom
        }
      }
    },
    []
  )

  // Watch activeIndex changes
  useEffect(() => {
    scrollToItem(activeIndex)
  }, [activeIndex, scrollToItem])

  // Reset scroll position when visible
  useEffect(() => {
    if (visible && menuRef.current) {
      menuRef.current.scrollTop = 0
      scrollToItem(activeIndex)
    }
  }, [visible, activeIndex, scrollToItem])

  // Cleanup scroll timer
  useEffect(() => {
    return () => {
      if (scrollTimerRef.current) {
        clearTimeout(scrollTimerRef.current)
      }
    }
  }, [])

  if (!visible) return null

  return (
    <div
      ref={menuRef}
      className="mention-menu"
      style={style}
      onScroll={handleScroll}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Knowledge Bases Group */}
      {kbItems.length > 0 && (
        <div className="mention-group">
          <div className="mention-group-header">
            {t('common.knowledgeBase')}
          </div>
          {kbItems.map((item, index) => (
            <HoverPopup
              key={item.id}
              content={
                <KbDetailPopup
                  item={item}
                  detail={detailCache[item.id] || { loading: false }}
                  onOrgClick={handleOrgClick}
                  agentIdForDetail={agentIdForDetail}
                />
              }
              disabled={isScrolling}
            >
              <div
                className={cn('mention-item', {
                  active: index === activeIndex,
                })}
                onClick={() => onSelect(item)}
                onMouseEnter={() => {
                  onActiveIndexChange(index)
                  fetchKbDetail(item)
                }}
              >
                <div className="icon-wrap">
                  <div
                    className={cn('icon', {
                      'faq-icon': item.kbType === 'faq',
                      'kb-icon': item.kbType !== 'faq',
                    })}
                  >
                    {item.kbType === 'faq' ? (
                      <MessageCircleQuestion size={16} />
                    ) : (
                      <Folder size={16} />
                    )}
                  </div>
                </div>
                <div className="item-main">
                  <span className="name">{item.name}</span>
                  <span className="count">({item.count || 0})</span>
                </div>
              </div>
            </HoverPopup>
          ))}
        </div>
      )}

      {/* Files Group */}
      {fileItems.length > 0 && (
        <div className="mention-group">
          <div className="mention-group-header">{t('common.file')}</div>
          {fileItems.map((item, index) => (
            <HoverPopup
              key={item.id}
              content={
                <FileDetailPopup
                  item={item}
                  detail={detailCache[item.id] || { loading: false }}
                  onKbClick={handleKbClick}
                  onOrgClick={handleOrgClick}
                />
              }
              disabled={isScrolling}
            >
              <div
                className={cn('mention-item', {
                  active: kbItems.length + index === activeIndex,
                })}
                onClick={() => onSelect(item)}
                onMouseEnter={() => {
                  onActiveIndexChange(kbItems.length + index)
                  fetchFileDetail(item)
                }}
              >
                <div className="icon-wrap">
                  <div className="icon file-icon">
                    <FileText size={16} />
                  </div>
                </div>
                <span className="name">{item.name}</span>
              </div>
            </HoverPopup>
          ))}
          {loading && (
            <div className="loading-more">
              <Loader2 className="animate-spin" size={16} />
            </div>
          )}
        </div>
      )}

      {items.length === 0 && !loading && (
        <div className="empty">{emptyHint || t('common.noResult')}</div>
      )}
    </div>
  )
}

export default MentionSelector