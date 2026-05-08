import { useState, useEffect, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { RefreshCw, Loader2 } from 'lucide-react'
import { getSyncLogs, type SyncLog } from '@/api/knowledge-base'

interface DataSourceSyncLogsProps {
  visible: boolean
  onVisibleChange: (visible: boolean) => void
  dataSourceId: string
  dataSourceName?: string
}

function statusColor(status: string) {
  switch (status) {
    case 'success': return 'var(--td-success-color)'
    case 'running': return 'var(--td-brand-color)'
    case 'failed': return 'var(--td-error-color)'
    case 'partial': return 'var(--td-warning-color)'
    default: return 'var(--td-text-color-placeholder)'
  }
}

function formatTime(ts: string | null) {
  if (!ts) return '--'
  const d = new Date(ts)
  if (isNaN(d.getTime())) return '--'
  return d.toLocaleString(undefined, {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
}

function formatDate(ts: string | null) {
  if (!ts) return ''
  const d = new Date(ts)
  if (isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function formatHourMin(ts: string | null) {
  if (!ts) return ''
  const d = new Date(ts)
  if (isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function duration(log: SyncLog) {
  if (!log.started_at || !log.finished_at) return '--'
  const ms = new Date(log.finished_at).getTime() - new Date(log.started_at).getTime()
  if (ms < 0) return '--'
  if (ms < 1000) return '<1s'
  const sec = Math.round(ms / 1000)
  if (sec < 60) return `${sec}s`
  return `${Math.floor(sec / 60)}m${sec % 60}s`
}

function hasPills(log: SyncLog) {
  return log.items_created > 0 || log.items_updated > 0 || log.items_deleted > 0 || log.items_skipped > 0 || log.items_failed > 0
}

interface GroupedLogs {
  date: string
  logs: SyncLog[]
}

export function DataSourceSyncLogs({
  visible,
  onVisibleChange,
  dataSourceId,
  dataSourceName,
}: DataSourceSyncLogsProps) {
  const { t } = useTranslation()

  const [logs, setLogs] = useState<SyncLog[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [expandedId, setExpandedId] = useState('')
  const pageSize = 50

  const fetchLogs = useCallback(async (reset = true) => {
    if (!dataSourceId) return

    if (reset) {
      setLoading(true)
    } else {
      setLoadingMore(true)
    }

    try {
      const offset = reset ? 0 : logs.length
      const items = await getSyncLogs(dataSourceId, pageSize, offset)
      setLogs(reset ? items : [...logs, ...items])
      setHasMore(items.length === pageSize)
    } catch { /* ignore */ }

    if (reset) {
      setLoading(false)
    } else {
      setLoadingMore(false)
    }
  }, [dataSourceId, logs.length])

  useEffect(() => {
    if (!visible) return
    setExpandedId('')
    fetchLogs(true)
  }, [visible, fetchLogs])

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? '' : id)
  }

  const loadMore = () => {
    if (loading || loadingMore || !hasMore) return
    fetchLogs(false)
  }

  // Stats
  const stats = useMemo(() => {
    const total = logs.length
    const success = logs.filter(l => l.status === 'success').length
    const failed = logs.filter(l => l.status === 'failed').length
    const totalItems = logs.reduce((acc, l) => acc + (l.items_created || 0) + (l.items_updated || 0), 0)
    return { total, success, failed, totalItems }
  }, [logs])

  // Group logs by date
  const groupedLogs = useMemo<GroupedLogs[]>(() => {
    const groups: GroupedLogs[] = []
    let currentDate = ''
    for (const log of logs) {
      const d = formatDate(log.started_at)
      if (d !== currentDate) {
        currentDate = d
        groups.push({ date: d, logs: [] })
      }
      groups[groups.length - 1].logs.push(log)
    }
    return groups
  }, [logs])

  const title = dataSourceName
    ? `${t('datasource.syncHistory')} · ${dataSourceName}`
    : t('datasource.syncHistory')

  return (
    <Sheet open={visible} onOpenChange={onVisibleChange}>
      <SheetContent side="right" className="w-[480px] max-w-[480px] p-0">
        <SheetHeader className="px-6 py-5 border-b border-[var(--td-border-level-1-color)]">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-base font-semibold truncate">
              {title}
            </SheetTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => fetchLogs(true)}
              disabled={loading}
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </Button>
          </div>
        </SheetHeader>

        <div className="px-6 py-5 overflow-y-auto h-[calc(100vh-80px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-[var(--td-brand-color)]" size={32} />
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-[var(--td-text-color-placeholder)] text-sm">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" />
              </svg>
              <p className="mt-3">{t('datasource.noLogs')}</p>
            </div>
          ) : (
            <>
              {/* Summary */}
              <div className="flex gap-2 pb-6 mb-3 border-b border-[var(--td-border-level-1-color)]">
                <div className="flex-1 text-center p-4 rounded-xl bg-[var(--td-bg-color-container)] border border-[var(--td-border-level-1-color)] shadow-sm flex flex-col gap-1">
                  <span className="text-xl font-bold text-[var(--td-text-color-primary)] font-variant-numeric tabular-nums">
                    {stats.total}
                  </span>
                  <span className="text-xs font-medium uppercase tracking-wide text-[var(--td-text-color-placeholder)]">
                    {t('datasource.logSummary.total')}
                  </span>
                </div>
                <div className="flex-1 text-center p-4 rounded-xl bg-[var(--td-bg-color-container)] border border-[var(--td-border-level-1-color)] shadow-sm flex flex-col gap-1">
                  <span className="text-xl font-bold text-[var(--td-success-color)] font-variant-numeric tabular-nums">
                    {stats.success}
                  </span>
                  <span className="text-xs font-medium uppercase tracking-wide text-[var(--td-text-color-placeholder)]">
                    {t('datasource.logSummary.success')}
                  </span>
                </div>
                <div className="flex-1 text-center p-4 rounded-xl bg-[var(--td-bg-color-container)] border border-[var(--td-border-level-1-color)] shadow-sm flex flex-col gap-1">
                  <span className="text-xl font-bold text-[var(--td-error-color)] font-variant-numeric tabular-nums">
                    {stats.failed}
                  </span>
                  <span className="text-xs font-medium uppercase tracking-wide text-[var(--td-text-color-placeholder)]">
                    {t('datasource.logSummary.failed')}
                  </span>
                </div>
                <div className="flex-1 text-center p-4 rounded-xl bg-[var(--td-bg-color-container)] border border-[var(--td-border-level-1-color)] shadow-sm flex flex-col gap-1">
                  <span className="text-xl font-bold text-[var(--td-text-color-primary)] font-variant-numeric tabular-nums">
                    {stats.totalItems}
                  </span>
                  <span className="text-xs font-medium uppercase tracking-wide text-[var(--td-text-color-placeholder)]">
                    {t('datasource.logSummary.items')}
                  </span>
                </div>
              </div>

              {/* Timeline */}
              <div className="flex flex-col">
                {groupedLogs.map((group) => (
                  <div key={group.date} className="mb-2">
                    <div className="text-xs font-semibold text-[var(--td-text-color-placeholder)] px-6 py-3 sticky top-0 bg-[var(--td-bg-color-container)] z-10 uppercase tracking-wide">
                      {group.date}
                    </div>

                    {group.logs.map((log, idx) => (
                      <div
                        key={log.id}
                        className="flex cursor-pointer relative mb-1"
                        onClick={() => toggleExpand(log.id)}
                      >
                        {/* Dot column */}
                        <div className="flex flex-col items-center w-6 flex-shrink-0 relative">
                          {/* Vertical line */}
                          <div
                            className="absolute top-0 bottom-0 left-1/2 w-px bg-[var(--td-border-level-1-color)]"
                            style={{
                              display: idx === 0 && group === groupedLogs[groupedLogs.length - 1] ? 'none' : undefined,
                            }}
                          />
                          {/* Dot */}
                          <span
                            className="w-2 h-2 rounded-full flex-shrink-0 relative z-10 mt-[18px] shadow-[0_0_0_4px_var(--td-bg-color-container)]"
                            style={{ background: statusColor(log.status) }}
                          />
                          {log.status === 'running' && (
                            <Loader2
                              size={10}
                              className="absolute top-[18px] animate-spin text-[var(--td-brand-color)]"
                            />
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0 p-3 rounded-lg transition-colors hover:bg-[var(--td-bg-color-secondarycontainer)]">
                          <div className="flex items-center gap-2">
                            <span
                              className="text-sm font-medium"
                              style={{ color: statusColor(log.status) }}
                            >
                              {t(`datasource.logStatus.${log.status}`)}
                            </span>
                            <span className="text-xs text-[var(--td-text-color-placeholder)] font-variant-numeric tabular-nums">
                              {formatHourMin(log.started_at)}
                            </span>
                            {log.finished_at && (
                              <span className="ml-auto text-xs font-medium text-[var(--td-text-color-placeholder)] font-variant-numeric tabular-nums bg-[var(--td-bg-color-component)] px-1.5 py-0.5 rounded">
                                {duration(log)}
                              </span>
                            )}
                          </div>

                          {/* Pills */}
                          {hasPills(log) && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {log.items_created > 0 && (
                                <span className="text-xs px-1.5 py-0.5 rounded font-medium font-variant-numeric tabular-nums bg-[var(--td-success-color-1)] text-[var(--td-success-color)]">
                                  +{log.items_created}
                                </span>
                              )}
                              {log.items_updated > 0 && (
                                <span className="text-xs px-1.5 py-0.5 rounded font-medium font-variant-numeric tabular-nums bg-[var(--td-brand-color-light)] text-[var(--td-brand-color)]">
                                  ~{log.items_updated}
                                </span>
                              )}
                              {log.items_deleted > 0 && (
                                <span className="text-xs px-1.5 py-0.5 rounded font-medium font-variant-numeric tabular-nums bg-[var(--td-warning-color-1)] text-[var(--td-warning-color)]">
                                  -{log.items_deleted}
                                </span>
                              )}
                              {log.items_skipped > 0 && (
                                <span className="text-xs px-1.5 py-0.5 rounded font-medium font-variant-numeric tabular-nums bg-[var(--td-bg-color-component)] text-[var(--td-text-color-placeholder)]">
                                  {log.items_skipped} {t('datasource.logMetric.skipped')}
                                </span>
                              )}
                              {log.items_failed > 0 && (
                                <span className="text-xs px-1.5 py-0.5 rounded font-medium font-variant-numeric tabular-nums bg-[var(--td-error-color-1)] text-[var(--td-error-color)]">
                                  {log.items_failed} {t('datasource.logMetric.failed')}
                                </span>
                              )}
                            </div>
                          )}

                          {/* Expanded detail */}
                          {expandedId === log.id && (
                            <div
                              className="mt-3 pt-3 border-t border-dashed border-[var(--td-border-level-2-color)] flex flex-col gap-1.5"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="flex justify-between text-xs text-[var(--td-text-color-primary)]">
                                <span className="text-[var(--td-text-color-placeholder)]">
                                  {t('datasource.logDetail.startTime')}
                                </span>
                                <span>{formatTime(log.started_at)}</span>
                              </div>
                              <div className="flex justify-between text-xs text-[var(--td-text-color-primary)]">
                                <span className="text-[var(--td-text-color-placeholder)]">
                                  {t('datasource.logDetail.endTime')}
                                </span>
                                <span>{formatTime(log.finished_at)}</span>
                              </div>
                              {log.items_total > 0 && (
                                <div className="flex justify-between text-xs text-[var(--td-text-color-primary)]">
                                  <span className="text-[var(--td-text-color-placeholder)]">
                                    {t('datasource.logMetric.total')}
                                  </span>
                                  <span>{log.items_total}</span>
                                </div>
                              )}
                              {log.error_message && (
                                <div className="mt-2 p-2 rounded-md bg-[var(--td-error-color-1)] text-[var(--td-error-color)] text-xs leading-relaxed break-words">
                                  {log.error_message}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}

                {/* Load more */}
                <div className="py-4 text-center">
                  {hasMore ? (
                    <Button
                      variant="outline"
                      onClick={loadMore}
                      loading={loadingMore}
                    >
                      {t('common.loadMore')}
                    </Button>
                  ) : (
                    <span className="text-xs text-[var(--td-text-color-placeholder)]">
                      {t('common.noMoreData')}
                    </span>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}