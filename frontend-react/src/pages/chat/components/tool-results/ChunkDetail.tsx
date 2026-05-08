import { useTranslation } from 'react-i18next'
import { Copy } from 'lucide-react'
import type { ChunkDetailData } from '@/types/tool-results'

interface ChunkDetailProps {
  data: ChunkDetailData
}

export function ChunkDetail({ data }: ChunkDetailProps) {
  const { t } = useTranslation()

  const copyToClipboard = () => {
    const text = data.content
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(() => {
        fallbackCopy(text)
      })
    } else {
      fallbackCopy(text)
    }
  }

  const fallbackCopy = (text: string) => {
    const textArea = document.createElement('textarea')
    textArea.value = text
    textArea.style.position = 'fixed'
    textArea.style.opacity = '0'
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand('copy')
    document.body.removeChild(textArea)
  }

  return (
    <div className="chunk-detail">
      <div className="info-section">
        <div className="info-field">
          <span className="field-label">{t('chat.chunkIdLabel')}</span>
          <span className="field-value">
            <code>{data.chunk_id}</code>
          </span>
        </div>
        <div className="info-field">
          <span className="field-label">{t('chat.documentIdLabel')}</span>
          <span className="field-value">
            <code>{data.knowledge_id}</code>
          </span>
        </div>
        <div className="info-field">
          <span className="field-label">{t('chat.positionLabel')}</span>
          <span className="field-value">{t('chat.chunkPositionValue', { index: data.chunk_index })}</span>
        </div>
        {data.content_length && (
          <div className="info-field">
            <span className="field-label">{t('chat.contentLengthLabelSimple')}</span>
            <span className="field-value">{t('chat.lengthChars', { value: data.content_length })}</span>
          </div>
        )}
      </div>

      <div className="info-section">
        <div className="info-section-title">{t('chat.fullContentLabel')}</div>
        <div className="full-content">{data.content}</div>
      </div>

      <div className="info-section">
        <div className="action-buttons">
          <button className="action-button" onClick={copyToClipboard}>
            <Copy size={12} />
            {t('chat.copyContent')}
          </button>
        </div>
      </div>
    </div>
  )
}