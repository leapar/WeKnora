import { useTranslation } from 'react-i18next'
import { Checkbox } from '@/components/ui/checkbox'
import {
  FileText,
  MoreVertical,
  Edit,
  RefreshCw,
  Trash2,
  Loader2,
} from 'lucide-react'
import type { KBDocument } from '@/types'

interface DocumentListViewProps {
  documents: KBDocument[]
  selectedIds: Set<string>
  canEdit?: boolean
  loading?: boolean
  onSelect: (id: string, checked: boolean, shiftKey?: boolean) => void
  onSelectAll: (checked: boolean) => void
  onAction: (action: 'edit' | 'reparse' | 'delete', doc: KBDocument) => void
}

const formatFileSize = (bytes?: number | string): string => {
  if (!bytes) return '--'
  const num = typeof bytes === 'string' ? parseInt(bytes, 10) : bytes
  if (isNaN(num)) return '--'
  if (num < 1024) return `${num} B`
  if (num < 1024 * 1024) return `${(num / 1024).toFixed(1)} KB`
  if (num < 1024 * 1024 * 1024) return `${(num / (1024 * 1024)).toFixed(1)} MB`
  return `${(num / (1024 * 1024 * 1024)).toFixed(1)} GB`
}

const formatTime = (time?: string): string => {
  if (!time) return '--'
  const d = new Date(time)
  if (Number.isNaN(d.getTime())) return '--'
  const yy = String(d.getFullYear()).slice(2)
  const MM = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${yy}-${MM}-${dd} ${hh}:${mm}`
}

const getSourceIcon = (channel?: string, type?: string): string => {
  if (channel === 'feishu') return 'Feishu'
  if (channel === 'notion') return 'Notion'
  if (channel === 'yuque') return 'Yuque'
  if (channel === 'wecom') return 'WeCom'
  if (channel === 'dingtalk') return 'DingTalk'
  if (channel === 'slack') return 'Slack'
  if (type === 'url') return 'Link'
  if (type === 'manual') return 'Manual'
  return 'Upload'
}

export function DocumentListView({
  documents,
  selectedIds,
  canEdit = true,
  loading,
  onSelect,
  onSelectAll,
  onAction,
}: DocumentListViewProps) {
  const { t } = useTranslation()

  const getStatusInfo = (doc: KBDocument) => {
    if (doc.parse_status === 'pending' || doc.parse_status === 'processing') {
      return {
        label: t('knowledgeBase.statusProcessing', 'Processing'),
        class: 'bg-blue-100 text-blue-700',
        spinning: true,
      }
    }
    if (doc.parse_status === 'failed') {
      return {
        label: t('knowledgeBase.statusFailed', 'Failed'),
        class: 'bg-red-100 text-red-700',
        spinning: false,
      }
    }
    if (doc.parse_status === 'completed') {
      return {
        label: t('knowledgeBase.statusCompleted', 'Completed'),
        class: 'bg-green-100 text-green-700',
        spinning: false,
      }
    }
    return {
      label: doc.parse_status || 'Unknown',
      class: 'bg-gray-100 text-gray-700',
      spinning: false,
    }
  }

  const getFileIcon = (fileType?: string) => {
    switch (fileType?.toLowerCase()) {
      case 'pdf':
        return 'PDF'
      case 'docx':
      case 'doc':
        return 'DOC'
      case 'txt':
      case 'md':
        return 'TXT'
      default:
        return fileType?.toUpperCase() || 'FILE'
    }
  }

  const allSelected = documents.length > 0 && selectedIds.size === documents.length
  const someSelected = selectedIds.size > 0 && selectedIds.size < documents.length

  return (
    <div className="bg-white rounded-lg border border-[var(--td-border-level-1-color)] overflow-hidden">
      {/* Table Header */}
      <div className="flex items-center px-4 py-3 bg-gray-50 border-b border-[var(--td-border-level-1-color)] text-xs font-medium text-[var(--td-text-color-secondary)]">
        <div className="w-10 flex-shrink-0">
          <Checkbox
            checked={allSelected}
            ref={(el: any) => {
              if (el) {
                el.indeterminate = someSelected
              }
            }}
            onCheckedChange={(checked: boolean) => onSelectAll(!!checked)}
          />
        </div>
        <div className="flex-1 min-w-0 px-2">{t('knowledgeBase.fileName', 'File Name')}</div>
        <div className="w-20 px-2 text-center hidden md:block">{t('knowledgeBase.size', 'Size')}</div>
        <div className="w-24 px-2 text-center hidden lg:block">{t('knowledgeBase.status', 'Status')}</div>
        <div className="w-32 px-2 hidden xl:block">{t('knowledgeBase.source', 'Source')}</div>
        <div className="w-28 px-2 text-center hidden xl:block">{t('knowledgeBase.updatedAt', 'Updated')}</div>
        <div className="w-12 flex-shrink-0"></div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-[var(--td-brand-color)]" size={32} />
        </div>
      )}

      {/* Empty State */}
      {!loading && documents.length === 0 && (
        <div className="text-center py-12">
          <FileText size={48} className="mx-auto mb-4 text-[var(--td-text-color-placeholder)]" />
          <p className="text-[var(--td-text-color-secondary)]">
            {t('knowledgeBase.noDocuments', 'No documents')}
          </p>
        </div>
      )}

      {/* Document Rows */}
      {!loading &&
        documents.map((doc) => {
          const status = getStatusInfo(doc)
          const isSelected = selectedIds.has(doc.id)

          return (
            <div
              key={doc.id}
              className={`flex items-center px-4 py-3 border-b border-[var(--td-border-level-1-color)] last:border-b-0 hover:bg-gray-50 transition-colors ${
                isSelected ? 'bg-[var(--td-brand-color)]/5' : ''
              }`}
            >
              {/* Checkbox */}
              <div className="w-10 flex-shrink-0">
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={(checked: boolean) => onSelect(doc.id, !!checked)}
                />
              </div>

              {/* File Name */}
              <div className="flex-1 min-w-0 px-2 flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-[var(--td-brand-color)]/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-medium text-[var(--td-brand-color)]">
                    {getFileIcon(doc.file_type)}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{doc.name}</p>
                  {doc.chunk_count != null && (
                    <p className="text-xs text-[var(--td-text-color-placeholder)]">
                      {doc.chunk_count} chunks
                    </p>
                  )}
                </div>
              </div>

              {/* Size */}
              <div className="w-20 px-2 text-center text-xs text-[var(--td-text-color-secondary)] hidden md:block">
                {formatFileSize(doc.size)}
              </div>

              {/* Status */}
              <div className="w-24 px-2 text-center hidden lg:block">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${status.class}`}>
                  {status.spinning && <Loader2 size={10} className="animate-spin" />}
                  {status.label}
                </span>
              </div>

              {/* Source */}
              <div className="w-32 px-2 text-xs text-[var(--td-text-color-secondary)] hidden xl:block">
                {getSourceIcon(doc.source as any, doc.type)}
              </div>

              {/* Updated */}
              <div className="w-28 px-2 text-center text-xs text-[var(--td-text-color-secondary)] hidden xl:block">
                {formatTime(doc.updated_at)}
              </div>

              {/* Actions */}
              <div className="w-12 flex-shrink-0 flex justify-end">
                <div className="relative group">
                  <button className="p-1.5 rounded hover:bg-gray-200">
                    <MoreVertical size={16} />
                  </button>
                  {canEdit && (
                    <div className="absolute right-0 top-full mt-1 bg-white border border-[var(--td-border-level-1-color)] rounded-lg shadow-lg py-1 hidden group-hover:block z-10 min-w-[120px]">
                      <button
                        onClick={() => onAction('edit', doc)}
                        className="w-full px-3 py-1.5 text-left text-xs hover:bg-gray-50 flex items-center gap-2"
                      >
                        <Edit size={12} /> {t('common.edit', 'Edit')}
                      </button>
                      <button
                        onClick={() => onAction('reparse', doc)}
                        className="w-full px-3 py-1.5 text-left text-xs hover:bg-gray-50 flex items-center gap-2"
                      >
                        <RefreshCw size={12} /> {t('knowledgeBase.reparse', 'Reparse')}
                      </button>
                      <button
                        onClick={() => onAction('delete', doc)}
                        className="w-full px-3 py-1.5 text-left text-xs hover:bg-gray-50 text-red-500 flex items-center gap-2"
                      >
                        <Trash2 size={12} /> {t('common.delete', 'Delete')}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
    </div>
  )
}
