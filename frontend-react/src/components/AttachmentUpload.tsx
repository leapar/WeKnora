import { useState, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { FileText, File, FileSpreadsheet, FilePen } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface AttachmentFile {
  file: File
  id: string
  name: string
  size: number
  type: string
  preview?: string
}

interface AttachmentUploadProps {
  maxFiles?: number
  maxSize?: number // in MB
  disabled?: boolean
  onFilesChange?: (files: AttachmentFile[]) => void
  onRemove?: (id: string) => void
}

const SUPPORTED_TYPES = [
  // Documents
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
  // Text
  '.txt', '.md', '.csv', '.json', '.xml', '.html',
  // Audio
  '.mp3', '.wav', '.m4a', '.flac', '.ogg', '.aac',
]

export function AttachmentUpload({
  maxFiles = 5,
  maxSize = 20,
  disabled = false,
  onFilesChange,
  onRemove,
}: AttachmentUploadProps) {
  const { t } = useTranslation()
  const [attachments, setAttachments] = useState<AttachmentFile[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const maxSizeBytes = maxSize * 1024 * 1024

  const triggerFileSelect = useCallback(() => {
    if (disabled) return
    fileInputRef.current?.click()
  }, [disabled])

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.target
    if (!input.files) return

    await addFiles(Array.from(input.files))
    input.value = '' // Reset input
  }

  const addFiles = async (files: File[]) => {
    if (disabled) return

    const newAttachments: AttachmentFile[] = []

    for (const file of files) {
      // Check max files limit
      if (attachments.length + newAttachments.length >= maxFiles) {
        alert(t('chat.attachmentTooMany', { max: maxFiles }))
        break
      }

      // Check file size
      if (file.size > maxSizeBytes) {
        alert(t('chat.attachmentTooLarge', { name: file.name, max: maxSize }))
        continue
      }

      // Check file type
      const ext = '.' + file.name.split('.').pop()?.toLowerCase()
      if (!SUPPORTED_TYPES.includes(ext)) {
        alert(t('chat.attachmentTypeNotSupported', { name: file.name }))
        continue
      }

      const attachment: AttachmentFile = {
        file,
        id: `${Date.now()}-${Math.random()}`,
        name: file.name,
        size: file.size,
        type: file.type || ext,
      }

      newAttachments.push(attachment)
    }

    if (newAttachments.length > 0) {
      const updated = [...attachments, ...newAttachments]
      setAttachments(updated)
      onFilesChange?.(updated)
    }
  }

  const removeAttachment = (id: string) => {
    const updated = attachments.filter(a => a.id !== id)
    setAttachments(updated)
    onFilesChange?.(updated)
    onRemove?.(id)
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const getFileExt = (fileName: string): string => {
    return fileName.split('.').pop()?.toUpperCase() || 'FILE'
  }

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase()
    if (['pdf'].includes(ext || '')) return 'file-pdf'
    if (['doc', 'docx'].includes(ext || '')) return 'file-word'
    if (['xls', 'xlsx'].includes(ext || '')) return 'file-excel'
    if (['ppt', 'pptx'].includes(ext || '')) return 'file-powerpoint'
    if (['txt', 'md'].includes(ext || '')) return 'file-text'
    if (['mp3', 'wav', 'm4a', 'flac', 'ogg', 'aac'].includes(ext || '')) return 'sound'
    return 'file'
  }

  return (
    <div className="attachment-upload">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={SUPPORTED_TYPES.join(',')}
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Attachment list */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 p-3 pt-1">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className={cn(
                'relative flex flex-row items-center gap-2.5 px-2.5 py-2 rounded-lg border max-w-[240px] min-w-[140px]',
                'border-[var(--td-border-level-1-color,#e7e7e7)] bg-[var(--td-bg-color-container,#fff)]',
                'cursor-default'
              )}
            >
              <div className="flex-shrink-0 flex items-center justify-center">
                {getFileIcon(attachment.name) === 'file-pdf' && (
                  <FileText className="w-8 h-8 text-red-500" />
                )}
                {getFileIcon(attachment.name) === 'file-word' && (
                  <FilePen className="w-8 h-8 text-blue-500" />
                )}
                {getFileIcon(attachment.name) === 'file-excel' && (
                  <FileSpreadsheet className="w-8 h-8 text-green-500" />
                )}
                {getFileIcon(attachment.name) === 'file-powerpoint' && (
                  <FileText className="w-8 h-8 text-orange-500" />
                )}
                {getFileIcon(attachment.name) === 'file-text' && (
                  <FileText className="w-8 h-8 text-gray-500" />
                )}
                {getFileIcon(attachment.name) === 'sound' && (
                  <File className="w-8 h-8 text-purple-500" />
                )}
                {getFileIcon(attachment.name) === 'file' && (
                  <File className="w-8 h-8 text-gray-500" />
                )}
              </div>
              <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                <div className="text-[13px] font-medium text-[var(--td-text-color-primary,#333)] truncate">
                  {attachment.name}
                </div>
                <div className="text-[11px] text-[var(--td-text-color-secondary,#999)] whitespace-nowrap">
                  {getFileExt(attachment.name)}&nbsp;·&nbsp;{formatFileSize(attachment.size)}
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeAttachment(attachment.id)}
                className={cn(
                  'absolute top-1 right-1.5 w-[18px] h-[18px rounded-full flex items-center justify-center text-[13px]',
                  'bg-black/20 text-white hover:bg-black/40 cursor-pointer leading-none'
                )}
                aria-label={t('common.remove')}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Trigger button - parent can use ref to access triggerFileSelect */}
      <button
        type="button"
        onClick={triggerFileSelect}
        disabled={disabled}
        className="hidden"
        ref={undefined}
      >
        {t('attachment.selectFiles')}
      </button>
    </div>
  )
}
