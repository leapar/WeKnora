import { useTranslation } from 'react-i18next'
import { FileText, Link, ThumbsUp } from 'lucide-react'
import type { ReferenceDoc } from '@/types'

interface SearchResultsProps {
  results: ReferenceDoc[]
  isLoading?: boolean
}

export function SearchResults({ results, isLoading }: SearchResultsProps) {
  const { t } = useTranslation()

  if (isLoading) {
    return (
      <div className="border border-[var(--td-border-level-1-color)] rounded-lg bg-white p-4">
        <div className="flex items-center gap-2 text-sm text-[var(--td-text-color-secondary)]">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-[var(--td-brand-color)] border-t-transparent" />
          <span>{t('common.loading')}</span>
        </div>
      </div>
    )
  }

  if (results.length === 0) {
    return null
  }

  return (
    <div className="border border-[var(--td-border-level-1-color)] rounded-lg bg-white overflow-hidden">
      <div className="px-4 py-2 bg-[var(--td-bg-color-secondarycontainer)] border-b border-[var(--td-border-level-1-color)]">
        <span className="text-sm font-medium">
          {t('chat.referenceDocs', { count: results.length })}
        </span>
      </div>
      <div className="divide-y divide-[var(--td-border-level-1-color)]">
        {results.map((doc, index) => (
          <div
            key={doc.id || index}
            className="p-3 hover:bg-[var(--td-bg-color-secondarycontainer)] transition-colors cursor-pointer"
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                {doc.is_file !== false ? (
                  <FileText size={16} className="text-orange-500" />
                ) : (
                  <Link size={16} className="text-blue-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm truncate">{doc.document_name}</span>
                  <div className="flex items-center gap-1 text-xs text-[var(--td-text-color-secondary)]">
                    <ThumbsUp size={12} />
                    <span>{(doc.similarity * 100).toFixed(0)}%</span>
                  </div>
                </div>
                <p className="text-sm text-[var(--td-text-color-secondary)] line-clamp-2">
                  {doc.content}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-[var(--td-text-color-placeholder)]">
                    {doc.knowledge_name}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

interface ThinkingDisplayProps {
  content: string
}

export function ThinkingDisplay({ content }: ThinkingDisplayProps) {
  const { t } = useTranslation()

  if (!content) return null

  return (
    <div className="border border-[var(--td-border-level-1-color)] rounded-lg bg-purple-50 overflow-hidden">
      <div className="px-4 py-2 bg-purple-100 border-b border-purple-200">
        <span className="text-sm font-medium text-purple-700">
          {t('chat.thinking')}
        </span>
      </div>
      <div className="px-4 py-3">
        <p className="text-sm text-purple-900 whitespace-pre-wrap">{content}</p>
      </div>
    </div>
  )
}

interface DeepThinkDisplayProps {
  content: string
  isStreaming?: boolean
}

export function DeepThinkDisplay({ content, isStreaming }: DeepThinkDisplayProps) {
  const { t } = useTranslation()

  if (!content) return null

  return (
    <div className="border border-[var(--td-brand-color)] border-opacity-30 rounded-lg bg-[var(--td-brand-color)] bg-opacity-5 overflow-hidden">
      <div className="px-4 py-2 bg-[var(--td-brand-color)] bg-opacity-10 border-b border-[var(--td-brand-color)] border-opacity-20">
        <span className="text-sm font-medium text-[var(--td-brand-color)]">
          {t('chat.deepThinking')}
        </span>
      </div>
      <div className="px-4 py-3">
        <p className="text-sm text-[var(--td-text-color-primary)] whitespace-pre-wrap">
          {content}
          {isStreaming && <span className="animate-pulse">▊</span>}
        </p>
      </div>
    </div>
  )
}
