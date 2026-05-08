import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { WikiEditData } from '@/types/tool-results'

interface WikiEditResultProps {
  data: WikiEditData
}

export function WikiEditResult({ data }: WikiEditResultProps) {
  const { t } = useTranslation()

  const actionIcon = useMemo(() => {
    switch (data.display_type) {
      case 'wiki_write_page':
        return (data as unknown as { action?: string }).action === 'created' ? '✦' : '✎'
      case 'wiki_replace_text':
        return '⇄'
      case 'wiki_rename_page':
        return '↻'
      case 'wiki_delete_page':
        return '✕'
      default:
        return '•'
    }
  }, [data])

  const actionClass = useMemo(() => {
    switch (data.display_type) {
      case 'wiki_write_page':
        return (data as unknown as { action?: string }).action === 'created' ? 'created' : 'updated'
      case 'wiki_replace_text':
        return 'updated'
      case 'wiki_rename_page':
        return 'renamed'
      case 'wiki_delete_page':
        return 'deleted'
      default:
        return ''
    }
  }, [data])

  const actionLabel = useMemo(() => {
    switch (data.display_type) {
      case 'wiki_write_page':
        return (data as unknown as { action?: string }).action === 'created'
          ? t('chat.wikiActionCreated')
          : t('chat.wikiActionUpdated')
      case 'wiki_replace_text':
        return t('chat.wikiActionUpdated')
      case 'wiki_rename_page':
        return t('chat.wikiActionRenamed')
      case 'wiki_delete_page':
        return t('chat.wikiActionDeleted')
      default:
        return ''
    }
  }, [data, t])

  const headerTitle = useMemo(() => {
    switch (data.display_type) {
      case 'wiki_write_page':
        return t('chat.wikiWritePageTitle')
      case 'wiki_replace_text':
        return t('chat.wikiReplaceTextTitle')
      case 'wiki_rename_page':
        return t('chat.wikiRenamePageTitle')
      case 'wiki_delete_page':
        return t('chat.wikiDeletePageTitle')
      default:
        return 'Wiki'
    }
  }, [data, t])

  return (
    <div className="wiki-edit-result">
      <div className="result-card wiki-card">
        <div className="result-header wiki-header">
          <div className="result-title">
            <span className={`wiki-icon ${actionClass}`}>{actionIcon}</span>
            <span className="wiki-title-text">{headerTitle}</span>
          </div>
          <div className="result-meta">
            <span className={`action-badge ${actionClass}`}>{actionLabel}</span>
          </div>
        </div>
        <div className="result-content expanded">
          <div className="info-section">
            {data.display_type === 'wiki_write_page' && (
              <>
                <div className="info-field">
                  <span className="field-label">{t('chat.wikiFieldSlug')}</span>
                  <span className="field-value">
                    <code>{data.slug}</code>
                  </span>
                </div>
                <div className="info-field">
                  <span className="field-label">{t('chat.wikiFieldTitle')}</span>
                  <span className="field-value">{data.title}</span>
                </div>
                <div className="info-field">
                  <span className="field-label">{t('chat.wikiFieldPageType')}</span>
                  <span className="field-value">
                    <code>{data.page_type}</code>
                  </span>
                </div>
                <div className="info-field">
                  <span className="field-label">{t('chat.wikiFieldSummary')}</span>
                  <span className="field-value">{data.summary}</span>
                </div>
              </>
            )}

            {data.display_type === 'wiki_replace_text' && (
              <>
                <div className="info-field">
                  <span className="field-label">{t('chat.wikiFieldSlug')}</span>
                  <span className="field-value">
                    <code>{data.slug}</code>
                  </span>
                </div>
                {data.title && (
                  <div className="info-field">
                    <span className="field-label">{t('chat.wikiFieldTitle')}</span>
                    <span className="field-value">{data.title}</span>
                  </div>
                )}
                <div className="diff-block">
                  <div className="diff-line diff-old">
                    <span className="diff-marker">-</span>
                    <span className="diff-text">{data.old_text}</span>
                  </div>
                  <div className="diff-line diff-new">
                    <span className="diff-marker">+</span>
                    <span className="diff-text">{data.new_text}</span>
                  </div>
                </div>
              </>
            )}

            {data.display_type === 'wiki_rename_page' && (
              <>
                {data.title && (
                  <div className="info-field">
                    <span className="field-label">{t('chat.wikiFieldTitle')}</span>
                    <span className="field-value">{data.title}</span>
                  </div>
                )}
                <div className="rename-visual">
                  <code className="slug-old">{data.old_slug}</code>
                  <span className="rename-arrow">→</span>
                  <code className="slug-new">{data.new_slug}</code>
                </div>
                {data.updated_count > 0 && (
                  <div className="info-field">
                    <span className="field-label">{t('chat.wikiFieldAffectedPages')}</span>
                    <span className="field-value">
                      {t('chat.wikiAffectedCount', { count: data.updated_count })}
                    </span>
                  </div>
                )}
                {data.affected_pages && data.affected_pages.length > 0 && (
                  <div className="affected-list">
                    {data.affected_pages.map((slug) => (
                      <code key={slug} className="affected-slug">
                        {slug}
                      </code>
                    ))}
                  </div>
                )}
              </>
            )}

            {data.display_type === 'wiki_delete_page' && (
              <>
                <div className="info-field">
                  <span className="field-label">{t('chat.wikiFieldSlug')}</span>
                  <span className="field-value">
                    <code>{data.slug}</code>
                  </span>
                </div>
                {data.title && (
                  <div className="info-field">
                    <span className="field-label">{t('chat.wikiFieldTitle')}</span>
                    <span className="field-value">{data.title}</span>
                  </div>
                )}
                {data.updated_count > 0 && (
                  <div className="info-field">
                    <span className="field-label">{t('chat.wikiFieldAffectedPages')}</span>
                    <span className="field-value">
                      {t('chat.wikiAffectedCount', { count: data.updated_count })}
                    </span>
                  </div>
                )}
                {data.affected_pages && data.affected_pages.length > 0 && (
                  <div className="affected-list">
                    {data.affected_pages.map((slug) => (
                      <code key={slug} className="affected-slug">
                        {slug}
                      </code>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}