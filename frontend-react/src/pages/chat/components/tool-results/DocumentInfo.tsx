import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { DocumentInfoData, DocumentInfoDocument } from '@/types/tool-results'

interface DocumentInfoProps {
  data: DocumentInfoData
}

export function DocumentInfo({ data }: DocumentInfoProps) {
  const { t } = useTranslation()

  const documents = useMemo(() => data.documents ?? [], [data.documents])

  const channelLabelMap: Record<string, string> = {
    web: 'knowledgeBase.channelWeb',
    api: 'knowledgeBase.channelApi',
    browser_extension: 'knowledgeBase.channelBrowserExtension',
    wechat: 'knowledgeBase.channelWechat',
    wecom: 'knowledgeBase.channelWecom',
    feishu: 'knowledgeBase.channelFeishu',
    dingtalk: 'knowledgeBase.channelDingtalk',
    slack: 'knowledgeBase.channelSlack',
    im: 'knowledgeBase.channelIm',
  }

  const getChannelLabel = (channel: string) => {
    const key = channelLabelMap[channel]
    return key ? t(key) : t('knowledgeBase.channelUnknown')
  }

  const formatSource = (doc: DocumentInfoDocument) => {
    if (doc.type && doc.source) {
      return `${doc.type} · ${doc.source}`
    }
    return doc.source || doc.type || t('chat.notProvided')
  }

  const formatFileSize = (size?: number) => {
    if (!size || size <= 0) {
      return t('chat.notProvided')
    }
    const units = ['B', 'KB', 'MB', 'GB']
    let value = size
    let unitIndex = 0
    while (value >= 1024 && unitIndex < units.length - 1) {
      value /= 1024
      unitIndex += 1
    }
    const fixed = value >= 10 || unitIndex === 0 ? 0 : 1
    return `${value.toFixed(fixed)} ${units[unitIndex]}`
  }

  const formatMetadataValue = (value: unknown) => {
    if (value === null || value === undefined) {
      return t('chat.notProvided')
    }
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value)
      } catch {
        return String(value)
      }
    }
    return String(value)
  }

  if (documents.length === 0) {
    return <div className="empty-state">{t('chat.documentInfoEmpty')}</div>
  }

  return (
    <div className="document-info">
      <div className="documents-list">
        {documents.map((doc, index) => (
          <div key={doc.knowledge_id || index} className="result-card document-card">
            <div className="result-header document-header">
              <div className="result-title">
                <span className="doc-index">#{index + 1}</span>
                <span className="doc-title">{doc.title || t('chat.notProvided')}</span>
              </div>
              <div className="result-meta">
                {doc.chunk_count && (
                  <span className="meta-chip">
                    {t('chat.chunkCountValue', { count: doc.chunk_count })}
                  </span>
                )}
              </div>
            </div>
            <div className="result-content expanded">
              <div className="info-section">
                <div className="info-field">
                  <span className="field-label">{t('chat.documentIdLabel')}</span>
                  <span className="field-value">
                    <code>{doc.knowledge_id}</code>
                  </span>
                </div>
                {doc.description && (
                  <div className="info-field">
                    <span className="field-label">{t('chat.documentDescriptionLabel')}</span>
                    <span className="field-value">{doc.description}</span>
                  </div>
                )}
                {(doc.source || doc.type) && (
                  <div className="info-field">
                    <span className="field-label">{t('chat.documentSourceLabel')}</span>
                    <span className="field-value">{formatSource(doc)}</span>
                  </div>
                )}
                {doc.channel && doc.channel !== 'web' && (
                  <div className="info-field">
                    <span className="field-label">{t('knowledgeBase.channelLabel')}</span>
                    <span className="field-value">{getChannelLabel(doc.channel)}</span>
                  </div>
                )}
                {(doc.file_name || doc.file_type || doc.file_size) && (
                  <div className="info-field">
                    <span className="field-label">{t('chat.documentFileLabel')}</span>
                    <span className="field-value">
                      {doc.file_name}
                      {doc.file_type && ` (${doc.file_type})`}
                      {doc.file_size && ` · ${formatFileSize(doc.file_size)}`}
                    </span>
                  </div>
                )}
              </div>

              {doc.metadata && Object.keys(doc.metadata).length > 0 && (
                <div className="info-section metadata-section">
                  <div className="info-section-title">{t('chat.documentMetadataLabel')}</div>
                  <ul className="metadata-list">
                    {Object.entries(doc.metadata).map(([key, value]) => (
                      <li key={`${doc.knowledge_id}-${key}`}>
                        <span className="metadata-key">{key}:</span>
                        <span className="metadata-value">{formatMetadataValue(value)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}