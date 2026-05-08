import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { GrepResultsData } from '@/types/tool-results'

interface GrepResultsProps {
  data: GrepResultsData
}

export function GrepResults({ data }: GrepResultsProps) {
  const { t } = useTranslation()

  const results = useMemo(() => data.knowledge_results ?? [], [data.knowledge_results])

  if (results.length === 0) {
    return <div className="empty-state">{t('chat.noMatchFound')}</div>
  }

  return (
    <div className="grep-results">
      <div className="results-list">
        {results.map((result, index) => (
          <div key={result.knowledge_id} className="result-row">
            <div className="result-row__index">#{index + 1}</div>
            <div className="result-row__title">
              {result.knowledge_title || t('knowledge.untitledDocument')}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}