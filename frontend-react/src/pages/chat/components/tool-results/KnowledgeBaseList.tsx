import { useTranslation } from 'react-i18next'
import type { KnowledgeBaseListData } from '@/types/tool-results'

interface KnowledgeBaseListProps {
  data: KnowledgeBaseListData
}

export function KnowledgeBaseList({ data }: KnowledgeBaseListProps) {
  const { t } = useTranslation()

  if (!data.knowledge_bases || data.knowledge_bases.length === 0) {
    return <div className="empty-state">{t('chat.noKnowledgeBases')}</div>
  }

  return (
    <div className="knowledge-base-list">
      <div className="stats-card">
        <div className="stats-title">{t('chat.knowledgeBaseCount', { count: data.count })}</div>
      </div>

      <div className="card-grid">
        {data.knowledge_bases.map((kb) => (
          <div key={kb.id} className="kb-card">
            <div className="kb-header">
              <span className="kb-index">#{kb.index}</span>
              <span className="kb-name">{kb.name}</span>
            </div>
            <div className="kb-body">
              <div className="info-field">
                <span className="field-label">ID:</span>
                <span className="field-value">
                  <code>{kb.id}</code>
                </span>
              </div>
              {kb.description && <div className="kb-description">{kb.description}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}