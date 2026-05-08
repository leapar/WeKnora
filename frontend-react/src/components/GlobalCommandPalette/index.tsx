import React, { useState, useEffect, useRef, useCallback, useMemo, useImperativeHandle, forwardRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Search, X, Settings, Folder, MessageSquare, UserCircle, History, FileText, Users, Plus } from 'lucide-react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useCommandPaletteStore } from '@/stores/commandPaletteStore'
import { useCmdkSearch } from './useSearch'
import { highlightText } from './utils'
import { buildCommands, filterCommands } from './commands'
import type { CmdkFileGroup, CmdkChunk, CmdkMsgGroup, MessageSearchGroupItem } from './types'

const CHUNK_LIMIT = 5
const MSG_LIMIT = 4

// ─── ResultItem Component ───
interface ResultItemProps {
  index: number
  selected: boolean
  icon: React.ReactNode
  title: React.ReactNode
  subtitle?: React.ReactNode
  badge?: string
  badgeVariant?: 'vector' | 'keyword' | 'default'
  score?: number
  shortcut?: number
  onClick: () => void
  onHover: (index: number) => void
}

const ResultItem = React.forwardRef<HTMLButtonElement, ResultItemProps>(
  ({ index, selected, icon, title, subtitle, badge, badgeVariant = 'default', score, shortcut, onClick, onHover }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        data-cmdk-index={index}
        className={cn('cmdk-item', selected && 'cmdk-item--selected')}
        onClick={onClick}
        onMouseMove={(e) => {
          const idx = Number((e.currentTarget as HTMLElement).dataset.cmdkIndex)
          if (!Number.isNaN(idx)) onHover(idx)
        }}
      >
        <div className="cmdk-item__icon">{icon}</div>
        <div className="cmdk-item__body">
          <div className="cmdk-item__title">
            {title}
            {badge && (
              <span className={cn('cmdk-item__badge', `cmdk-item__badge--${badgeVariant}`)}>{badge}</span>
            )}
            {score != null && <span className="cmdk-item__score">{(score * 100).toFixed(0)}%</span>}
          </div>
          {subtitle && <div className="cmdk-item__subtitle">{subtitle}</div>}
        </div>
        {shortcut != null && (
          <div className="cmdk-item__actions">
            <span className="cmdk-item__shortcut">
              <kbd>⌘</kbd>
              <kbd>{shortcut}</kbd>
            </span>
          </div>
        )}
      </button>
    )
  }
)
ResultItem.displayName = 'ResultItem'

// ─── ResultGroup Component ───
interface ResultGroupProps {
  label: string
  count?: number
  action?: string
  onAction?: () => void
  children: React.ReactNode
}

const ResultGroup = ({ label, count, action, onAction, children }: ResultGroupProps) => {
  return (
    <div className="cmdk-group">
      <div className="cmdk-group__header">
        <span className="cmdk-group__label">{label}</span>
        {count != null && <span className="cmdk-group__count">({count})</span>}
        <span className="cmdk-group__spacer" />
        {action && (
          <button type="button" className="cmdk-group__action" onClick={onAction}>
            {action}
          </button>
        )}
      </div>
      <div className="cmdk-group__body">{children}</div>
    </div>
  )
}

// ─── Main GlobalCommandPalette Component ───
export interface GlobalCommandPaletteRef {
  openPalette: (query?: string) => void
}

interface FlatChunkItem {
  kind: 'chunk'
  file: CmdkFileGroup
  chunk: CmdkChunk
}

interface FlatMsgItem {
  kind: 'msg'
  group: CmdkMsgGroup
  msg: MessageSearchGroupItem
}

interface FlatItem {
  key: string
  group: string
  run: (ev?: { cmd: boolean }) => void
}

export const GlobalCommandPalette = forwardRef<GlobalCommandPaletteRef>((_, ref) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const params = useParams()
  const commandPaletteStore = useCommandPaletteStore()
  const { open, initialQuery, recentQueries } = commandPaletteStore

  // Get current KB ID from route
  const kbIdFromRoute = typeof params.kbId === 'string' ? params.kbId : ''

  // Active KB scope
  const [activeKbScope, setActiveKbScope] = useState<{ id: string; name: string } | null>(null)
  const [drawerVisible, setDrawerVisible] = useState(false)

  const {
    query,
    setQuery,
    loading,
    hasSearched,
    fileGroups,
    messageGroups,
    kbMatches,
    knowledgeBases,
    agentMatches,
    sessionMatches,
    totalChunks,
    totalMessages,
    clearResults,
  } = useCmdkSearch({
    lockedKbIds: () => (activeKbScope ? [activeKbScope.id] : []),
  })

  const inputRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Selection state
  const [selectedKey, setSelectedKey] = useState<string | null>(null)

  // Expose openPalette method
  useImperativeHandle(ref, () => ({
    openPalette: (query?: string) => {
      commandPaletteStore.openPalette(query || '')
    },
  }))

  // Sync with store
  useEffect(() => {
    if (open) {
      setQuery(initialQuery || '')
      setSelectedKey(null)
      // Infer KB scope from current route
      if (kbIdFromRoute) {
        const match = knowledgeBases.find((k) => k.id === kbIdFromRoute)
        setActiveKbScope({
          id: kbIdFromRoute,
          name: match?.name || kbIdFromRoute,
        })
      } else {
        setActiveKbScope(null)
      }
    } else {
      clearResults()
      setQuery('')
      setDrawerVisible(false)
      setActiveKbScope(null)
    }
  }, [open, initialQuery, kbIdFromRoute, knowledgeBases, clearResults, setQuery])

  // Flattened items for keyboard navigation
  const flatChunkItems = useMemo<FlatChunkItem[]>(() => {
    const out: FlatChunkItem[] = []
    for (const f of fileGroups) {
      for (const c of f.chunks) {
        out.push({ kind: 'chunk', file: f, chunk: c })
        if (out.length >= CHUNK_LIMIT) return out
      }
    }
    return out
  }, [fileGroups])

  const flatMessageItems = useMemo<FlatMsgItem[]>(() => {
    const out: FlatMsgItem[] = []
    for (const g of messageGroups) {
      for (const m of g.items) {
        out.push({ kind: 'msg', group: g, msg: m })
        if (out.length >= MSG_LIMIT) return out
      }
    }
    return out
  }, [messageGroups])

  // Commands
  const allCommands = useMemo(
    () =>
      buildCommands({
        router: navigate,
        t,
        close: () => commandPaletteStore.closePalette(),
      }),
    [navigate, t]
  )

  const filteredCommands = useMemo(() => filterCommands(allCommands, query), [allCommands, query])

  // Group order
  const groupOrder = useMemo<readonly string[]>(() => {
    if (!query.trim()) {
      return ['recent', 'commands'] as const
    }
    if (activeKbScope) {
      return ['chunks'] as const
    }
    return ['chunks', 'messages', 'kbs', 'agents', 'sessions', 'commands'] as const
  }, [query, activeKbScope])

  const groupSizes = useMemo<Record<string, number>>(
    () => ({
      recent: recentQueries.length,
      commands: query.trim() ? filteredCommands.length : allCommands.length,
      chunks: flatChunkItems.length,
      messages: flatMessageItems.length,
      kbs: kbMatches.length,
      agents: agentMatches.length,
      sessions: sessionMatches.length,
    }),
    [recentQueries, query, filteredCommands, allCommands, flatChunkItems, flatMessageItems, kbMatches, agentMatches, sessionMatches]
  )

  const flatIndexFor = useCallback(
    (group: string, localIndex: number): number => {
      let base = 0
      for (const g of groupOrder) {
        if (g === group) return base + localIndex
        base += groupSizes[g] || 0
      }
      return base + localIndex
    },
    [groupOrder, groupSizes]
  )

  const flatItems = useMemo<FlatItem[]>(() => {
    const out: FlatItem[] = []
    for (const g of groupOrder) {
      if (g === 'recent') {
        recentQueries.forEach((q, i) => {
          out.push({
            key: `recent:${i}:${q}`,
            group: g,
            run: () => {
              setQuery(q)
            },
          })
        })
      } else if (g === 'commands') {
        const list = query.trim() ? filteredCommands : allCommands
        list.forEach((cmd) => {
          out.push({ key: `cmd:${cmd.id}`, group: g, run: () => cmd.run() })
        })
      } else if (g === 'chunks') {
        flatChunkItems.forEach((item) => {
          out.push({
            key: `chunk:${item.chunk.id}`,
            group: g,
            run: (ev) => (ev?.cmd ? cmdEnterChunk(item) : openChunk(item)),
          })
        })
      } else if (g === 'messages') {
        flatMessageItems.forEach((item) => {
          out.push({
            key: `msg:${item.msg.request_id}`,
            group: g,
            run: () => openMessage(item),
          })
        })
      } else if (g === 'kbs') {
        kbMatches.forEach((kb) => {
          out.push({ key: `kb:${kb.id}`, group: g, run: () => openKb(kb.id) })
        })
      } else if (g === 'agents') {
        agentMatches.forEach((a) => {
          out.push({ key: `agent:${a.id}`, group: g, run: () => openAgent(a.id) })
        })
      } else if (g === 'sessions') {
        sessionMatches.forEach((s) => {
          out.push({ key: `session:${s.id}`, group: g, run: () => openSession(s.id) })
        })
      }
    }
    return out
  }, [
    groupOrder,
    recentQueries,
    query,
    filteredCommands,
    allCommands,
    flatChunkItems,
    flatMessageItems,
    kbMatches,
    agentMatches,
    sessionMatches,
    setQuery,
  ])

  const totalItems = flatItems.length

  const selectedIndex = useMemo(() => {
    if (!selectedKey) return 0
    const idx = flatItems.findIndex((it) => it.key === selectedKey)
    return idx >= 0 ? idx : 0
  }, [selectedKey, flatItems])

  const hasAnyResults = useMemo(() => {
    for (const g of groupOrder) {
      if ((groupSizes[g] || 0) > 0) return true
    }
    return false
  }, [groupOrder, groupSizes])

  const isGroupVisible = useCallback((name: string): boolean => groupOrder.includes(name as never), [groupOrder])

  // Actions
  const primaryActionForSelected = useCallback(
    (ev?: { cmd: boolean }) => {
      const item = flatItems[selectedIndex]
      item?.run(ev)
    },
    [flatItems, selectedIndex]
  )

  const openChunk = useCallback(
    (item: FlatChunkItem) => {
      commandPaletteStore.pushRecent(query)
      commandPaletteStore.closePalette()
      if (!item.file.kbId) return
      if (kbIdFromRoute === item.file.kbId) {
        window.dispatchEvent(
          new CustomEvent('weknora:open-knowledge', {
            detail: { kbId: item.file.kbId, knowledgeId: item.file.knowledgeId },
          })
        )
        return
      }
      navigate(`/platform/knowledge-bases/${item.file.kbId}?knowledge_id=${item.file.knowledgeId}`)
    },
    [query, kbIdFromRoute, navigate, commandPaletteStore]
  )

  const cmdEnterChunk = useCallback(
    (item: FlatChunkItem) => {
      commandPaletteStore.pushRecent(query)
      commandPaletteStore.closePalette()
      // Start chat with the query and KB context
      navigate(`/platform/creatChat?q=${encodeURIComponent(query)}&kbIds=${item.file.kbId}&fileIds=${item.file.knowledgeId}`)
    },
    [query, navigate, commandPaletteStore]
  )

  const openMessage = useCallback(
    (item: FlatMsgItem) => {
      commandPaletteStore.pushRecent(query)
      commandPaletteStore.closePalette()
      if (item.group.sessionId) {
        navigate(`/platform/chat/${item.group.sessionId}`)
      }
    },
    [query, navigate, commandPaletteStore]
  )

  const openKb = useCallback(
    (kbId: string) => {
      commandPaletteStore.pushRecent(query)
      commandPaletteStore.closePalette()
      navigate(`/platform/knowledge-bases/${kbId}`)
    },
    [query, navigate, commandPaletteStore]
  )

  const openAgent = useCallback(
    (agentId: string) => {
      commandPaletteStore.pushRecent(query)
      commandPaletteStore.closePalette()
      navigate(`/platform/creatChat?agent_id=${agentId}`)
    },
    [query, navigate, commandPaletteStore]
  )

  const openSession = useCallback(
    (sessionId: string) => {
      if (!sessionId) return
      commandPaletteStore.pushRecent(query)
      commandPaletteStore.closePalette()
      navigate(`/platform/chat/${sessionId}`)
    },
    [query, navigate, commandPaletteStore]
  )

  const askAi = useCallback(() => {
    if (!query.trim()) return
    commandPaletteStore.pushRecent(query)
    commandPaletteStore.closePalette()
    navigate(`/platform/creatChat?q=${encodeURIComponent(query)}`)
  }, [query, navigate, commandPaletteStore])

  // Keyboard navigation
  const scrollSelectedIntoView = useCallback(() => {
    requestAnimationFrame(() => {
      const el = scrollRef.current?.querySelector<HTMLElement>(`[data-cmdk-index="${selectedIndex}"]`)
      el?.scrollIntoView({ block: 'nearest' })
    })
  }, [selectedIndex])

  const moveSelection = useCallback(
    (delta: number) => {
      const total = totalItems
      if (total === 0) return
      const next = (selectedIndex + delta + total) % total
      setSelectedKey(flatItems[next]?.key || null)
      scrollSelectedIntoView()
    },
    [totalItems, selectedIndex, flatItems, scrollSelectedIntoView]
  )

  const selectItemAt = useCallback(
    (idx: number) => {
      const item = flatItems[idx]
      if (!item) return
      setSelectedKey(item.key)
    },
    [flatItems]
  )

  const shortcutFor = useCallback((flatIndex: number): number | undefined => {
    if (flatIndex < 0 || flatIndex > 8) return undefined
    return flatIndex + 1
  }, [])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        moveSelection(1)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        moveSelection(-1)
      } else if ((e.metaKey || e.ctrlKey) && e.key >= '1' && e.key <= '9') {
        const n = parseInt(e.key, 10)
        const item = flatItems[n - 1]
        if (item) {
          e.preventDefault()
          item.run({ cmd: false })
        }
      } else if (e.key === 'Enter') {
        e.preventDefault()
        primaryActionForSelected({ cmd: e.metaKey || e.ctrlKey })
      } else if (e.key === 'Escape') {
        e.preventDefault()
        handleClose()
      }
    },
    [moveSelection, flatItems, primaryActionForSelected]
  )

  const handleInputKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Backspace' && !query && activeKbScope) {
        e.preventDefault()
        clearKbScope()
      }
    },
    [query, activeKbScope]
  )

  const handleClose = useCallback(() => {
    setDrawerVisible(false)
    commandPaletteStore.closePalette()
  }, [commandPaletteStore])

  const clearKbScope = useCallback(() => {
    setActiveKbScope(null)
    requestAnimationFrame(() => {
      inputRef.current?.focus()
    })
  }, [])

  // Global keyboard shortcut
  useEffect(() => {
    const isEditingElement = (el: EventTarget | null): boolean => {
      if (!el) return false
      const node = el as HTMLElement
      const tag = (node.tagName || '').toUpperCase()
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true
      if (node.isContentEditable) return true
      return false
    }

    const onGlobalKey = (e: KeyboardEvent) => {
      const isCmd = e.metaKey || e.ctrlKey
      if (isCmd && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        if (open) handleClose()
        else commandPaletteStore.openPalette('')
        return
      }
      if (e.key === '/' && !open && !isEditingElement(e.target)) {
        e.preventDefault()
        commandPaletteStore.openPalette('')
      }
    }

    window.addEventListener('keydown', onGlobalKey)
    return () => window.removeEventListener('keydown', onGlobalKey)
  }, [open, handleClose, commandPaletteStore])

  // Focus input when dialog opens
  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => {
        inputRef.current?.focus()
        if (inputRef.current?.value) {
          const len = inputRef.current.value.length
          inputRef.current.setSelectionRange(len, len)
        }
      })
    }
  }, [open])

  // Backfill scope name when KBs load
  useEffect(() => {
    if (activeKbScope && activeKbScope.name === activeKbScope.id) {
      const match = knowledgeBases.find((k) => k.id === activeKbScope.id)
      if (match) {
        setActiveKbScope({ id: match.id, name: match.name })
      }
    }
  }, [activeKbScope, knowledgeBases])

  return (
    <Dialog open={open} onOpenChange={(newOpen) => !newOpen && handleClose()}>
      <DialogContent className="cmdk-dialog p-0" onClose={handleClose}>
        <div className="cmdk" onKeyDown={handleKeyDown}>
          {/* Input row */}
          <div className="cmdk__input-row">
            <Search className="cmdk__input-icon" size={16} />
            {activeKbScope && (
              <span className="cmdk__scope-chip" title={activeKbScope.name}>
                <Folder size={12} />
                <span className="cmdk__scope-chip-name">{activeKbScope.name}</span>
                <button
                  type="button"
                  className="cmdk__scope-chip-x"
                  title={t('commandPalette.scope.remove')}
                  aria-label={t('commandPalette.scope.remove')}
                  onClick={clearKbScope}
                >
                  <X size={12} />
                </button>
              </span>
            )}
            <input
              ref={inputRef}
              type="text"
              className="cmdk__input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleInputKeyDown}
              placeholder={activeKbScope ? t('commandPalette.scope.placeholder') : t('commandPalette.placeholder')}
              autoFocus
              spellCheck={false}
            />
            {loading && (
              <span className="cmdk__input-spinner">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
              </span>
            )}
            <button
              type="button"
              className={cn('cmdk__icon-btn', drawerVisible && 'active')}
              title={t('commandPalette.retrieval')}
              onClick={() => setDrawerVisible(true)}
            >
              <Settings size={16} />
            </button>
            <button
              type="button"
              className="cmdk__icon-btn"
              aria-label={t('commandPalette.hotkey.esc')}
              onClick={handleClose}
            >
              <X size={16} />
            </button>
          </div>

          {/* Results */}
          <div ref={scrollRef} className="cmdk__results">
            {/* Empty idle state */}
            {!query.trim() && (
              <>
                {recentQueries.length > 0 && (
                  <ResultGroup
                    label={t('commandPalette.group.recent')}
                    action={t('commandPalette.clearRecent')}
                    onAction={() => commandPaletteStore.clearRecent()}
                  >
                    {recentQueries.map((q, i) => (
                      <ResultItem
                        key={`r-${q}`}
                        index={flatIndexFor('recent', i)}
                        selected={selectedIndex === flatIndexFor('recent', i)}
                        icon={<History size={14} />}
                        title={q}
                        shortcut={shortcutFor(flatIndexFor('recent', i))}
                        onClick={() => setQuery(q)}
                        onHover={selectItemAt}
                      />
                    ))}
                  </ResultGroup>
                )}

                <ResultGroup label={t('commandPalette.group.quickActions')}>
                  {allCommands.map((c, i) => (
                    <ResultItem
                      key={`cmd-${c.id}`}
                      index={flatIndexFor('commands', i)}
                      selected={selectedIndex === flatIndexFor('commands', i)}
                      icon={getCommandIcon(c.icon)}
                      title={c.label}
                      shortcut={shortcutFor(flatIndexFor('commands', i))}
                      onClick={c.run}
                      onHover={selectItemAt}
                    />
                  ))}
                </ResultGroup>
              </>
            )}

            {/* Active search results */}
            {query.trim() && (
              <>
                {/* Chunks */}
                {isGroupVisible('chunks') && flatChunkItems.length > 0 && (
                  <ResultGroup label={t('commandPalette.group.chunks')} count={totalChunks}>
                    {flatChunkItems.map((item, i) => (
                      <ResultItem
                        key={`c-${item.file.knowledgeId}-${item.chunk.id}`}
                        index={flatIndexFor('chunks', i)}
                        selected={selectedIndex === flatIndexFor('chunks', i)}
                        icon={<FileText size={14} />}
                        title={
                          <>
                            <span className="cmdk-chunk-title">{item.file.title}</span>
                            {item.file.kbName && (
                              <span className="cmdk-chunk-kb">{item.file.kbName}</span>
                            )}
                          </>
                        }
                        subtitle={
                          <span
                            dangerouslySetInnerHTML={{
                              __html: highlightText(
                                item.chunk.matched_content || item.chunk.content,
                                query
                              ),
                            }}
                          />
                        }
                        badge={
                          item.chunk.match_type === 'vector'
                            ? t('commandPalette.match.vector')
                            : t('commandPalette.match.keyword')
                        }
                        badgeVariant={item.chunk.match_type === 'vector' ? 'vector' : 'keyword'}
                        score={item.chunk.score}
                        shortcut={shortcutFor(flatIndexFor('chunks', i))}
                        onClick={() => openChunk(item)}
                        onHover={selectItemAt}
                      />
                    ))}
                  </ResultGroup>
                )}

                {/* Messages */}
                {isGroupVisible('messages') && flatMessageItems.length > 0 && (
                  <ResultGroup label={t('commandPalette.group.messages')} count={totalMessages}>
                    {flatMessageItems.map((item, i) => (
                      <ResultItem
                        key={`m-${item.msg.request_id}`}
                        index={flatIndexFor('messages', i)}
                        selected={selectedIndex === flatIndexFor('messages', i)}
                        icon={<MessageSquare size={14} />}
                        title={item.group.sessionTitle || t('commandPalette.untitledSession')}
                        subtitle={
                          <>
                            <span className="cmdk-msg-role">
                              {item.msg.query_content ? 'Q' : 'A'}
                            </span>
                            <span
                              dangerouslySetInnerHTML={{
                                __html: highlightText(
                                  item.msg.query_content || item.msg.answer_content || '',
                                  query
                                ),
                              }}
                            />
                          </>
                        }
                        score={item.msg.score}
                        shortcut={shortcutFor(flatIndexFor('messages', i))}
                        onClick={() => openMessage(item)}
                        onHover={selectItemAt}
                      />
                    ))}
                  </ResultGroup>
                )}

                {/* KBs */}
                {isGroupVisible('kbs') && kbMatches.length > 0 && (
                  <ResultGroup label={t('commandPalette.group.kbs')}>
                    {kbMatches.map((kb, i) => (
                      <ResultItem
                        key={`k-${kb.id}`}
                        index={flatIndexFor('kbs', i)}
                        selected={selectedIndex === flatIndexFor('kbs', i)}
                        icon={<Folder size={14} />}
                        title={kb.name}
                        shortcut={shortcutFor(flatIndexFor('kbs', i))}
                        onClick={() => openKb(kb.id)}
                        onHover={selectItemAt}
                      />
                    ))}
                  </ResultGroup>
                )}

                {/* Agents */}
                {isGroupVisible('agents') && agentMatches.length > 0 && (
                  <ResultGroup label={t('commandPalette.group.agents')}>
                    {agentMatches.map((a, i) => (
                      <ResultItem
                        key={`a-${a.id}`}
                        index={flatIndexFor('agents', i)}
                        selected={selectedIndex === flatIndexFor('agents', i)}
                        icon={<UserCircle size={14} />}
                        title={a.name}
                        subtitle={a.description}
                        shortcut={shortcutFor(flatIndexFor('agents', i))}
                        onClick={() => openAgent(a.id)}
                        onHover={selectItemAt}
                      />
                    ))}
                  </ResultGroup>
                )}

                {/* Sessions */}
                {isGroupVisible('sessions') && sessionMatches.length > 0 && (
                  <ResultGroup label={t('commandPalette.group.sessionsByTitle')}>
                    {sessionMatches.map((s, i) => (
                      <ResultItem
                        key={`s-${s.id}`}
                        index={flatIndexFor('sessions', i)}
                        selected={selectedIndex === flatIndexFor('sessions', i)}
                        icon={<MessageSquare size={14} />}
                        title={s.title}
                        shortcut={shortcutFor(flatIndexFor('sessions', i))}
                        onClick={() => openSession(s.id)}
                        onHover={selectItemAt}
                      />
                    ))}
                  </ResultGroup>
                )}

                {/* Commands */}
                {isGroupVisible('commands') && filteredCommands.length > 0 && (
                  <ResultGroup label={t('commandPalette.group.commands')}>
                    {filteredCommands.map((c, i) => (
                      <ResultItem
                        key={`fcmd-${c.id}`}
                        index={flatIndexFor('commands', i)}
                        selected={selectedIndex === flatIndexFor('commands', i)}
                        icon={getCommandIcon(c.icon)}
                        title={c.label}
                        shortcut={shortcutFor(flatIndexFor('commands', i))}
                        onClick={c.run}
                        onHover={selectItemAt}
                      />
                    ))}
                  </ResultGroup>
                )}

                {/* No results */}
                {!loading && !hasAnyResults && hasSearched && (
                  <div className="cmdk__empty">
                    <p>{t('commandPalette.empty.noResults')}</p>
                    <div className="cmdk__empty-actions">
                      <Button variant="outline" size="sm" onClick={askAi}>
                        <MessageSquare size={14} className="mr-2" />
                        {t('commandPalette.empty.askAi')}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setDrawerVisible(true)}>
                        <Settings size={14} className="mr-2" />
                        {t('commandPalette.empty.adjustRetrieval')}
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Hotkey footer */}
          <div className="cmdk__footer">
            <span className="cmdk__hotkey">
              <kbd>↑</kbd>
              <kbd>↓</kbd> {t('commandPalette.hotkey.select')}
            </span>
            <span className="cmdk__hotkey">
              <kbd>↵</kbd> {t('commandPalette.hotkey.enter')}
            </span>
            <span className="cmdk__hotkey">
              <kbd>⌘</kbd>
              <kbd>1</kbd>-<kbd>9</kbd> {t('commandPalette.hotkey.cmdNumber')}
            </span>
            <span className="cmdk__hotkey">
              <kbd>Esc</kbd> {t('commandPalette.hotkey.esc')}
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
})

GlobalCommandPalette.displayName = 'GlobalCommandPalette'

// Helper function to get icon component from icon name
function getCommandIcon(iconName: string): React.ReactNode {
  switch (iconName) {
    case 'MessageSquarePlus':
      return <Plus size={14} />
    case 'Folder':
      return <Folder size={14} />
    case 'UserCircle':
      return <UserCircle size={14} />
    case 'Users':
      return <Users size={14} />
    case 'Settings':
      return <Settings size={14} />
    default:
      return <MessageSquare size={14} />
  }
}

export default GlobalCommandPalette