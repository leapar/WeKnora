import { useState, useRef, type KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Send, Square, Paperclip, AtSign } from 'lucide-react'

interface SendMsgProps {
  onSend: (message: string) => void
  onStop?: () => void
  disabled?: boolean
  isStreaming?: boolean
  placeholder?: string
}

export function SendMsg({
  onSend,
  onStop,
  disabled = false,
  isStreaming = false,
  placeholder,
}: SendMsgProps) {
  const { t } = useTranslation()
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSend = () => {
    if (!value.trim() || disabled || isStreaming) return
    onSend(value.trim())
    setValue('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value)
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px'
    }
  }

  return (
    <div className="flex items-end gap-2 px-4 py-3 bg-white border-t border-[var(--td-border-level-1-color)]">
      <div className="flex items-center gap-1">
        <button
          className="p-2 rounded hover:bg-[var(--td-bg-color-secondarycontainer)] text-[var(--td-text-color-secondary)] disabled:opacity-50"
          disabled={disabled || isStreaming}
          title="Attach files"
        >
          <Paperclip size={20} />
        </button>
        <button
          className="p-2 rounded hover:bg-[var(--td-bg-color-secondarycontainer)] text-[var(--td-text-color-secondary)] disabled:opacity-50"
          disabled={disabled || isStreaming}
          title="Mention knowledge base"
        >
          <AtSign size={20} />
        </button>
      </div>

      <div className="flex-1 relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || t('chat.placeholder')}
          disabled={disabled}
          className="w-full resize-none rounded-lg border border-[var(--td-border-level-1-color)] px-4 py-2.5 focus:outline-none focus:border-[var(--td-brand-color)] bg-white text-sm"
          style={{ minHeight: '40px', maxHeight: '120px' }}
          rows={1}
        />
      </div>

      {isStreaming ? (
        <button
          onClick={onStop}
          className="p-2.5 rounded-lg border border-[var(--td-border-level-1-color)] hover:bg-[var(--td-bg-color-secondarycontainer)] text-[var(--td-text-color-secondary)]"
          title="Stop generation"
        >
          <Square size={20} />
        </button>
      ) : (
        <button
          onClick={handleSend}
          disabled={!value.trim() || disabled}
          className="p-2.5 rounded-lg bg-[var(--td-brand-color)] hover:bg-[var(--td-brand-color-hover)] text-white disabled:opacity-50 disabled:cursor-not-allowed"
          title="Send message"
        >
          <Send size={20} />
        </button>
      )}
    </div>
  )
}