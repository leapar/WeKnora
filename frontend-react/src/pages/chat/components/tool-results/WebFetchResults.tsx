import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown, ChevronUp, ExternalLink, AlertCircle } from 'lucide-react'
import type { WebFetchResultsData, WebFetchResultItem } from '@/types/tool-results'

interface WebFetchResultsProps {
  data: WebFetchResultsData
}

export function WebFetchResults({ data }: WebFetchResultsProps) {
  const { t } = useTranslation()
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set())
  const [expandedRaw, setExpandedRaw] = useState<Record<number, boolean>>({})

  const items: WebFetchResultItem[] = data.results || []

  useEffect(() => {
    const set = new Set<number>()
    items.forEach((_, idx) => {
      set.add(idx)
    })
    setExpandedCards(set)
    setExpandedRaw({})
  }, [items])

  const toggleCard = (index: number) => {
    setExpandedCards((prev) => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }

  const toggleRaw = (index: number) => {
    setExpandedRaw((prev) => ({
      ...prev,
      [index]: !prev[index],
    }))
  }

  const truncate = (content: string, maxLength = 480): string => {
    if (!content) return ''
    if (content.length <= maxLength) return content
    return `${content.substring(0, maxLength)}…`
  }

  const safeHostname = (url: string): string => {
    try {
      const urlObj = new URL(url)
      return urlObj.hostname
    } catch {
      return url
    }
  }

  const formatLength = (length: number): string => {
    if (!length || Number.isNaN(length)) return t('chat.lengthChars', { value: 0 })
    if (length >= 10000) {
      return t('chat.lengthTenThousands', { value: (length / 10000).toFixed(1) })
    }
    if (length >= 1000) {
      return t('chat.lengthThousands', { value: (length / 1000).toFixed(1) })
    }
    return t('chat.lengthChars', { value: length })
  }

  const formatMethod = (method: string): string => {
    if (!method) return ''
    if (method.toLowerCase() === 'chromedp') return 'Chromedp'
    if (method.toLowerCase() === 'http') return 'HTTP'
    return method
  }

  const indexKey = (index: number, item: WebFetchResultItem): string => {
    return `${index}-${item.url || 'unknown'}`
  }

  if (items.length === 0) {
    return <div className="empty-state">{t('chat.noWebContent')}</div>
  }

  return (
    <div className="web-fetch-results">
      <div className="results-list">
        {items.map((item, index) => {
          const isExpanded = expandedCards.has(index)
          const isRawExpanded = !!expandedRaw[index]

          return (
            <div key={indexKey(index, item)} className="result-card">
              <div className="result-header" onClick={() => toggleCard(index)}>
                <div className="result-title">
                  <span className="result-index">#{index + 1}</span>
                  {item.url ? (
                    <a
                      href={item.url}
                      className="result-link"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className="result-domain">{safeHostname(item.url)}</span>
                      <ExternalLink size={10} />
                    </a>
                  ) : (
                    <span className="result-domain">{t('chat.unknownLink')}</span>
                  )}
                </div>
                <div className="result-meta">
                  {item.method && <span className="meta-pill">{formatMethod(item.method)}</span>}
                  {item.content_length && (
                    <span className="meta-text">
                      {t('chat.contentLengthLabel', { value: formatLength(item.content_length) })}
                    </span>
                  )}
                  {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </div>
              </div>

              <div className={`result-content ${isExpanded ? 'expanded' : ''}`}>
                <div className="info-section">
                  <div className="info-field">
                    <span className="field-label">URL</span>
                    <span className="field-value">
                      {item.url ? (
                        <a href={item.url} target="_blank" rel="noopener noreferrer">
                          {item.url}
                        </a>
                      ) : (
                        t('chat.notProvided')
                      )}
                    </span>
                  </div>
                  {item.prompt && (
                    <div className="info-field">
                      <span className="field-label">{t('chat.promptLabel')}</span>
                      <span className="field-value">{item.prompt}</span>
                    </div>
                  )}
                </div>

                {item.error ? (
                  <div className="info-section">
                    <div className="info-section-title error">
                      <AlertCircle size={12} />
                      {t('chat.errorMessageLabel')}
                    </div>
                    <div className="full-content error-text">{item.error}</div>
                  </div>
                ) : (
                  <>
                    {item.summary && (
                      <div className="info-section">
                        <div className="info-section-title">{t('chat.summaryLabel')}</div>
                        <div className="full-content">{item.summary}</div>
                      </div>
                    )}

                    {item.raw_content && (
                      <div className="info-section">
                        <div className="info-section-title">
                          {t('chat.rawTextLabel')}
                          {item.content_length && (
                            <span className="raw-length">（{formatLength(item.content_length)}）</span>
                          )}
                        </div>
                        {isRawExpanded ? (
                          <div className="full-content">{item.raw_content}</div>
                        ) : (
                          <div className="content-preview">{truncate(item.raw_content)}</div>
                        )}
                        <button className="action-button" onClick={(e) => { e.stopPropagation(); toggleRaw(index) }}>
                          {isRawExpanded ? t('chat.collapseRaw') : t('chat.expandRaw')}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}