import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ExternalLink } from 'lucide-react'
import type { WebSearchResultsData, WebSearchResultItem } from '@/types/tool-results'

interface WebSearchResultsProps {
  data: WebSearchResultsData
}

interface Group {
  key: string
  label: string
  items: WebSearchResultItem[]
}

export function WebSearchResults({ data }: WebSearchResultsProps) {
  const { t } = useTranslation()

  const results = useMemo(() => data.results || [], [data.results])

  const groupedResults = useMemo<Group[]>(() => {
    const groupsMap: Record<string, Group> = {}
    for (const item of results) {
      const source = (item as unknown as { source?: string }).source
      let key = ''
      let label = ''
      if (source && source.trim()) {
        key = `src:${source.trim()}`
        label = source.trim()
      } else {
        const hostname = safeHostname(item.url)
        key = `dom:${hostname}`
        label = hostname
      }
      if (!groupsMap[key]) {
        groupsMap[key] = { key, label, items: [] }
      }
      groupsMap[key].items.push(item)
    }
    const ordered: Group[] = []
    const seen = new Set<string>()
    for (const item of results) {
      const source = (item as unknown as { source?: string }).source
      const hostname = safeHostname(item.url)
      const key = source && source.trim() ? `src:${source.trim()}` : `dom:${hostname}`
      if (!seen.has(key)) {
        seen.add(key)
        if (groupsMap[key]) ordered.push(groupsMap[key])
      }
    }
    return ordered
  }, [results])

  const safeHostname = (url: string): string => {
    try {
      const urlObj = new URL(url)
      return urlObj.hostname
    } catch {
      return t('chat.otherSource')
    }
  }

  const formatDate = (dateStr: string): string => {
    try {
      const date = new Date(dateStr)
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    } catch {
      return dateStr
    }
  }

  if (groupedResults.length === 0) {
    return <div className="empty-state">{t('chat.webSearchNoResults')}</div>
  }

  return (
    <div className="web-search-results">
      <div className="results-groups">
        {groupedResults.map((group) => (
          <div key={group.key} className="results-group">
            <div className="results-list">
              {group.items.map((result) => (
                <div key={result.result_index} className="result-item">
                  <div className="result-header">
                    <div className="result-index">#{result.result_index}</div>
                    {result.url ? (
                      <a
                        href={result.url}
                        title={result.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="result-title-link one-line"
                      >
                        <span className="result-title">{result.title}</span>
                        <ExternalLink size={10} />
                      </a>
                    ) : (
                      <div className="result-title-text one-line">
                        <span className="result-title">{result.title}</span>
                      </div>
                    )}
                  </div>

                  {result.published_at && (
                    <div className="result-meta">
                      <span className="meta-item">{formatDate(result.published_at)}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}