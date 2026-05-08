import { useTranslation } from 'react-i18next'
import { Loader2 } from 'lucide-react'

interface DeepThinkProps {
  content: string
  isStreaming?: boolean
}

export function DeepThink({ content, isStreaming }: DeepThinkProps) {
  const { t } = useTranslation()

  if (!content) return null

  return (
    <div className="border border-[var(--td-brand-color)] border-opacity-30 rounded-lg bg-[var(--td-brand-color)] bg-opacity-5 overflow-hidden mb-3">
      <div className="px-4 py-2 bg-[var(--td-brand-color)] bg-opacity-10 border-b border-[var(--td-brand-color)] border-opacity-20 flex items-center gap-2">
        <span className="text-sm font-medium text-[var(--td-brand-color)]">
          {t('chat.deepThinking')}
        </span>
        {isStreaming && <Loader2 size={14} className="animate-spin text-[var(--td-brand-color)]" />}
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