import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { RelatedChunksData } from '@/types/tool-results'
import { ContentPopup } from './ContentPopup'

interface RelatedChunksProps {
  data: RelatedChunksData
}

export function RelatedChunks({ data }: RelatedChunksProps) {
  const { t } = useTranslation()
  const [activePopup, setActivePopup] = useState<string | null>(null)

  if (!data.chunks || data.chunks.length === 0) {
    return <div className="empty-state">{t('chat.noRelatedChunks')}</div>
  }

  return (
    <div className="related-chunks">
      <div className="chunks-list">
        {data.chunks.map((chunk) => (
          <div key={chunk.chunk_id} className="result-item">
            <div
              className="result-header"
              onClick={() => setActivePopup(activePopup === chunk.chunk_id ? null : chunk.chunk_id)}
              style={{ cursor: 'pointer' }}
            >
              <div className="result-title">
                <span className="chunk-index">
                  {t('chat.chunkIndexLabel', { index: chunk.index })}
                </span>
                <span className="chunk-position">
                  {t('chat.chunkPositionLabel', { position: chunk.chunk_index })}
                </span>
              </div>
            </div>
            {activePopup === chunk.chunk_id && (
              <div className="chunk-popup">
                <ContentPopup content={chunk.content} chunkId={chunk.chunk_id} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}