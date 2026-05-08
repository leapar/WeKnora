import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'

interface DocumentBatchBarProps {
  count: number
  loading?: boolean
  onClear: () => void
  onDelete: () => void
}

export function DocumentBatchBar({ count, loading, onClear, onDelete }: DocumentBatchBarProps) {
  const { t } = useTranslation()

  if (count === 0) return null

  return (
    <div className="w-full max-w-[560px] mx-auto px-1">
      <div className="flex items-center justify-between gap-3 px-3 py-2 bg-white border border-[var(--td-component-stroke)] rounded-lg shadow-lg">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="text-sm font-medium text-[var(--td-text-color-secondary)]">
            {t('knowledgeBase.selectedCount', { count })}
          </span>
          <button
            onClick={onClear}
            className="text-xs text-[var(--td-text-color-secondary)] hover:text-[var(--td-brand-color)] whitespace-nowrap px-1"
          >
            {t('knowledgeBase.clearSelection', 'Clear Selection')}
          </button>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="destructive"
            size="sm"
            onClick={onDelete}
            loading={loading}
          >
            <Trash2 size={14} className="mr-1" />
            {t('knowledgeBase.batchDelete', 'Delete Selected')}
          </Button>
        </div>
      </div>
    </div>
  )
}
