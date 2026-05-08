import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown, ChevronUp } from 'lucide-react'
import type { GraphQueryResultsData, RelevanceLevel } from '@/types/tool-results'

interface GraphQueryResultsProps {
  data: GraphQueryResultsData
}

export function GraphQueryResults({ data }: GraphQueryResultsProps) {
  const { t } = useTranslation()
  const [expandedResults, setExpandedResults] = useState<string[]>([])

  const toggleResult = (chunkId: string) => {
    setExpandedResults((prev) => {
      if (prev.includes(chunkId)) {
        return prev.filter((id) => id !== chunkId)
      }
      return [...prev, chunkId]
    })
  }

  const getRelevanceClass = (level: RelevanceLevel): string => {
    const classMap: Record<RelevanceLevel, string> = {
      'High Relevance': 'high',
      'Medium Relevance': 'medium',
      'Low Relevance': 'low',
      'Weak Relevance': 'weak',
    }
    return classMap[level] || 'weak'
  }

  const getRelevanceLabel = (level: RelevanceLevel): string => {
    const labelMap: Record<RelevanceLevel, string> = {
      'High Relevance': t('chat.relevanceHigh'),
      'Medium Relevance': t('chat.relevanceMedium'),
      'Low Relevance': t('chat.relevanceLow'),
      'Weak Relevance': t('chat.relevanceWeak'),
    }
    return labelMap[level] || level
  }

  if (!data.results || data.results.length === 0) {
    return <div className="empty-state">{t('chat.graphNoResults')}</div>
  }

  return (
    <div className="graph-query-results">
      {data.graph_config && (
        <div className="stats-card">
          <div className="stats-title">{t('chat.graphConfigTitle')}</div>
          <div className="info-field">
            <span className="field-label">{t('chat.entityTypesLabel')}</span>
            <span className="field-value">{data.graph_config.nodes.join(', ')}</span>
          </div>
          <div className="info-field">
            <span className="field-label">{t('chat.relationTypesLabel')}</span>
            <span className="field-value">{data.graph_config.relations.join(', ')}</span>
          </div>
        </div>
      )}

      <div className="results-list">
        <div className="results-header">
          {t('chat.graphResultsHeader', { count: data.count })}
        </div>

        {data.results.map((result) => {
          const isExpanded = expandedResults.includes(result.chunk_id)
          return (
            <div key={result.chunk_id} className="result-card">
              <div className="result-header" onClick={() => toggleResult(result.chunk_id)}>
                <div className="result-title">
                  <span className="result-index">#{result.result_index}</span>
                  <span className={`relevance-badge ${getRelevanceClass(result.relevance_level)}`}>
                    {getRelevanceLabel(result.relevance_level)}
                  </span>
                  <span className="knowledge-title">{result.knowledge_title}</span>
                </div>
                <div className="result-meta">
                  <span className="score">{(result.score * 100).toFixed(0)}%</span>
                  <span className="expand-icon">
                    {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </span>
                </div>
              </div>

              <div className={`result-content ${isExpanded ? 'expanded' : ''}`}>
                <div className="full-content">{result.content}</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}