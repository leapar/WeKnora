import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Send, Square, Paperclip, AtSign, Image, X, ChevronDown, Bot, Search, Loader2 } from 'lucide-react'
import { useSettingsStore } from '@/stores/settingsStore'
import { listAgents } from '@/api/agent'
import { listKnowledgeBases } from '@/api/knowledge-base'
import type { Agent } from '@/types'

interface MentionItem {
  id: string
  name: string
  type: 'kb' | 'file'
  kbId?: string
  kbName?: string
}

interface ChatInputProps {
  onSend: (message: string, mentionedItems: MentionItem[]) => void
  onStop?: () => void
  disabled?: boolean
  isStreaming?: boolean
  placeholder?: string
}

export function ChatInput({
  onSend,
  onStop,
  disabled = false,
  isStreaming = false,
  placeholder,
}: ChatInputProps) {
  const { t } = useTranslation()
  const settingsStore = useSettingsStore()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)

  const [value, setValue] = useState('')

  // Agent selector state
  const [showAgentSelector, setShowAgentSelector] = useState(false)
  const [agents, setAgents] = useState<Agent[]>([])
  const [agentsLoading, setAgentsLoading] = useState(false)
  const agentButtonRef = useRef<HTMLButtonElement>(null)

  // Knowledge base selector state
  const [showKbSelector, setShowKbSelector] = useState(false)
  const [knowledgeBases, setKnowledgeBases] = useState<any[]>([])
  const [kbLoading, setKbLoading] = useState(false)
  const kbButtonRef = useRef<HTMLButtonElement>(null)

  // Mention panel state
  const [showMention, setShowMention] = useState(false)
  const [mentionItems, setMentionItems] = useState<MentionItem[]>([])
  const [mentionLoading, setMentionLoading] = useState(false)
  const [selectedKbIds, setSelectedKbIds] = useState<string[]>([])

  // Image upload state
  const [uploadedImages, setUploadedImages] = useState<Array<{ file: File; preview: string }>>([])

  // Attachment state
  const [attachments, setAttachments] = useState<Array<{ id: string; name: string; size: number }>>([])

  // Mention selected items for sending
  const [mentionedItems, setMentionedItems] = useState<MentionItem[]>([])

  // Selected agent
  const selectedAgentId = settingsStore.settings.agentConfig?.selectedAgentId || 'builtin-quick-answer'

  // Load agents on mount
  useEffect(() => {
    loadAgents()
    loadKnowledgeBases()
  }, [])

  const loadAgents = async () => {
    setAgentsLoading(true)
    try {
      const res = await listAgents()
      if (res.success && res.data?.agents) {
        setAgents(res.data.agents)
      }
    } catch (error) {
      console.error('Failed to load agents:', error)
    } finally {
      setAgentsLoading(false)
    }
  }

  const loadKnowledgeBases = async () => {
    setKbLoading(true)
    try {
      const res = await listKnowledgeBases({})
      if (res.success && res.data?.knowledge_bases) {
        setKnowledgeBases(res.data.knowledge_bases)
      }
    } catch (error) {
      console.error('Failed to load knowledge bases:', error)
    } finally {
      setKbLoading(false)
    }
  }

  // Handle textarea input
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    setValue(newValue)

    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px'
    }

    // Check for @ trigger
    const cursorPos = e.target.selectionStart
    const textBeforeCursor = newValue.substring(0, cursorPos)
    const atMatch = textBeforeCursor.match(/@(\w*)$/)

    if (atMatch) {
      setShowMention(true)
      loadMentionItems(atMatch[1])
    } else {
      setShowMention(false)
    }
  }

  // Load mention items (knowledge bases and files)
  const loadMentionItems = async (query: string) => {
    setMentionLoading(true)
    try {
      // Filter knowledge bases by query
      const filteredKbs = knowledgeBases.filter(kb =>
        kb.name.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 10)

      const items: MentionItem[] = filteredKbs.map(kb => ({
        id: kb.id,
        name: kb.name,
        type: 'kb' as const,
        kbId: kb.id,
        kbName: kb.name,
      }))

      setMentionItems(items)
    } catch (error) {
      console.error('Failed to load mention items:', error)
    } finally {
      setMentionLoading(false)
    }
  }

  // Handle mention selection
  const handleMentionSelect = (item: MentionItem) => {
    // Replace @query with @item.name in the text
    const cursorPos = textareaRef.current?.selectionStart || 0
    const textBeforeCursor = value.substring(0, cursorPos)
    const textAfterCursor = value.substring(cursorPos)

    const atIndex = textBeforeCursor.lastIndexOf('@')
    const newText = textBeforeCursor.substring(0, atIndex) + `@${item.name} ` + textAfterCursor

    setValue(newText)
    setShowMention(false)

    // Add to mentioned items if not already selected
    if (!mentionedItems.some(m => m.id === item.id && m.type === item.type)) {
      setMentionedItems([...mentionedItems, item])
    }

    // Focus back on textarea
    textareaRef.current?.focus()
  }

  // Remove mentioned item
  const handleRemoveMention = (item: MentionItem) => {
    setMentionedItems(mentionedItems.filter(m => !(m.id === item.id && m.type === item.type)))
    // Also remove from text
    setValue(value.replace(`@${item.name} `, ''))
  }

  // Handle send
  const handleSend = () => {
    if (!value.trim() || disabled || isStreaming) return

    onSend(value.trim(), mentionedItems)
    setValue('')
    setMentionedItems([])
    setUploadedImages([])
    setAttachments([])

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  // Handle key down
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
    if (e.key === 'Escape') {
      setShowMention(false)
    }
  }

  // Handle file select (attachments)
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target
    if (!input.files) return

    const newAttachments = Array.from(input.files).map(file => ({
      id: `${Date.now()}-${Math.random()}`,
      name: file.name,
      size: file.size,
    }))

    setAttachments([...attachments, ...newAttachments])
    input.value = ''
  }

  // Handle image select
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target
    if (!input.files) return

    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    const maxSize = 10 * 1024 * 1024

    const newImages = Array.from(input.files)
      .filter(file => allowed.includes(file.type))
      .filter(file => file.size <= maxSize)
      .map(file => ({
        file,
        preview: URL.createObjectURL(file),
      }))
      .slice(0, 5 - uploadedImages.length)

    setUploadedImages([...uploadedImages, ...newImages])
    input.value = ''
  }

  // Remove image
  const handleRemoveImage = (index: number) => {
    const removed = uploadedImages.splice(index, 1)
    if (removed[0]) {
      URL.revokeObjectURL(removed[0].preview)
      setUploadedImages([...uploadedImages])
    }
  }

  // Remove attachment
  const handleRemoveAttachment = (id: string) => {
    setAttachments(attachments.filter(a => a.id !== id))
  }

  // Handle agent selection
  const handleAgentSelect = (agentId: string) => {
    settingsStore.selectAgent(agentId)
    setShowAgentSelector(false)
  }

  // Handle KB selection
  const handleKbToggle = (kbId: string) => {
    let newSelectedKbIds: string[]
    if (selectedKbIds.includes(kbId)) {
      newSelectedKbIds = selectedKbIds.filter(id => id !== kbId)
    } else {
      newSelectedKbIds = [...selectedKbIds, kbId]
    }
    setSelectedKbIds(newSelectedKbIds)
    settingsStore.selectKnowledgeBases(newSelectedKbIds)
  }

  return (
    <div className="flex flex-col bg-white border-t border-[var(--td-border-level-1-color)]">
      {/* Selected items bar */}
      {(mentionedItems.length > 0 || uploadedImages.length > 0 || attachments.length > 0) && (
        <div className="flex flex-wrap gap-2 px-4 py-2 border-b border-[var(--td-border-level-1-color)]">
          {/* Mentioned KBs */}
          {mentionedItems.filter(m => m.type === 'kb').map(item => (
            <span
              key={item.id}
              className="inline-flex items-center gap-1 px-2 py-1 bg-[var(--td-bg-color-secondarycontainer)] rounded text-xs"
            >
              <Search size={12} />
              {item.name}
              <button onClick={() => handleRemoveMention(item)} className="hover:text-[var(--td-error-color)]">
                <X size={12} />
              </button>
            </span>
          ))}

          {/* Uploaded images */}
          {uploadedImages.map((img, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1 px-2 py-1 bg-[var(--td-bg-color-secondarycontainer)] rounded text-xs"
            >
              <Image size={12} />
              {img.file.name.substring(0, 15)}
              <button onClick={() => handleRemoveImage(idx)} className="hover:text-[var(--td-error-color)]">
                <X size={12} />
              </button>
            </span>
          ))}

          {/* Attachments */}
          {attachments.map(att => (
            <span
              key={att.id}
              className="inline-flex items-center gap-1 px-2 py-1 bg-[var(--td-bg-color-secondarycontainer)] rounded text-xs"
            >
              <Paperclip size={12} />
              {att.name.substring(0, 15)}
              <button onClick={() => handleRemoveAttachment(att.id)} className="hover:text-[var(--td-error-color)]">
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Main input area */}
      <div className="flex items-end gap-2 px-4 py-3">
        {/* Agent selector button */}
        <div className="relative">
          <button
            ref={agentButtonRef}
            onClick={() => setShowAgentSelector(!showAgentSelector)}
            className="flex items-center gap-1 px-2 py-2 rounded hover:bg-[var(--td-bg-color-secondarycontainer)] text-[var(--td-text-color-secondary)]"
            title={t('chat.selectAgent')}
          >
            <Bot size={18} />
            <ChevronDown size={14} />
          </button>

          {/* Agent dropdown */}
          {showAgentSelector && (
            <div className="absolute bottom-full left-0 mb-2 w-64 bg-white rounded-lg border border-[var(--td-component-border)] shadow-lg z-50 max-h-80 overflow-y-auto">
              <div className="p-2 border-b border-[var(--td-component-stroke)]">
                <span className="text-xs text-[var(--td-text-color-secondary)]">{t('chat.selectAgent')}</span>
              </div>
              {agentsLoading ? (
                <div className="p-4 text-center">
                  <Loader2 size={20} className="animate-spin mx-auto text-[var(--td-text-color-placeholder)]" />
                </div>
              ) : (
                agents.map(agent => (
                  <button
                    key={agent.id}
                    onClick={() => handleAgentSelect(agent.id)}
                    className={`w-full flex items-center gap-2 px-3 py-2 hover:bg-[var(--td-bg-color-container-hover)] text-left ${
                      agent.id === selectedAgentId ? 'bg-[var(--td-brand-color-light)]' : ''
                    }`}
                  >
                    <Bot size={16} className="text-[var(--td-brand-color)]" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm truncate">{agent.name}</div>
                      {agent.description && (
                        <div className="text-xs text-[var(--td-text-color-placeholder)] truncate">
                          {agent.description}
                        </div>
                      )}
                    </div>
                    {agent.id === selectedAgentId && (
                      <span className="text-[var(--td-brand-color)] text-xs">✓</span>
                    )}
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* KB selector button */}
        <div className="relative">
          <button
            ref={kbButtonRef}
            onClick={() => setShowKbSelector(!showKbSelector)}
            className="flex items-center gap-1 px-2 py-2 rounded hover:bg-[var(--td-bg-color-secondarycontainer)] text-[var(--td-text-color-secondary)]"
            title={t('chat.selectKnowledgeBase')}
          >
            <Search size={18} />
            {selectedKbIds.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-[var(--td-brand-color)] text-white text-[10px] rounded-full flex items-center justify-center">
                {selectedKbIds.length}
              </span>
            )}
            <ChevronDown size={14} />
          </button>

          {/* KB dropdown */}
          {showKbSelector && (
            <div className="absolute bottom-full left-0 mb-2 w-64 bg-white rounded-lg border border-[var(--td-component-border)] shadow-lg z-50 max-h-80 overflow-y-auto">
              <div className="p-2 border-b border-[var(--td-component-stroke)]">
                <span className="text-xs text-[var(--td-text-color-secondary)]">{t('chat.selectKnowledgeBase')}</span>
              </div>
              {kbLoading ? (
                <div className="p-4 text-center">
                  <Loader2 size={20} className="animate-spin mx-auto text-[var(--td-text-color-placeholder)]" />
                </div>
              ) : knowledgeBases.length === 0 ? (
                <div className="p-4 text-center text-xs text-[var(--td-text-color-placeholder)]">
                  {t('knowledge.noKnowledgeBase')}
                </div>
              ) : (
                knowledgeBases.map(kb => (
                  <button
                    key={kb.id}
                    onClick={() => handleKbToggle(kb.id)}
                    className={`w-full flex items-center gap-2 px-3 py-2 hover:bg-[var(--td-bg-color-container-hover)] text-left ${
                      selectedKbIds.includes(kb.id) ? 'bg-[var(--td-brand-color-light)]' : ''
                    }`}
                  >
                    <Search size={16} className="text-[var(--td-brand-color)]" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm truncate">{kb.name}</div>
                    </div>
                    {selectedKbIds.includes(kb.id) && (
                      <span className="text-[var(--td-brand-color)] text-xs">✓</span>
                    )}
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Attachment buttons */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-2 rounded hover:bg-[var(--td-bg-color-secondarycontainer)] text-[var(--td-text-color-secondary)]"
          title={t('chat.attachFile')}
        >
          <Paperclip size={20} />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.md,.csv"
          onChange={handleFileSelect}
          className="hidden"
        />

        <button
          onClick={() => imageInputRef.current?.click()}
          className="p-2 rounded hover:bg-[var(--td-bg-color-secondarycontainer)] text-[var(--td-text-color-secondary)]"
          title={t('chat.uploadImage')}
        >
          <Image size={20} />
        </button>
        <input
          ref={imageInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/gif,image/webp"
          onChange={handleImageSelect}
          className="hidden"
        />

        {/* Mention button */}
        <button
          onClick={() => {
            setShowMention(!showMention)
            if (!showMention) {
              loadMentionItems('')
            }
          }}
          className={`p-2 rounded hover:bg-[var(--td-bg-color-secondarycontainer)] ${
            showMention ? 'text-[var(--td-brand-color)]' : 'text-[var(--td-text-color-secondary)]'
          }`}
          title={t('chat.mentionKnowledgeBase')}
        >
          <AtSign size={20} />
        </button>

        {/* Text input */}
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

          {/* Mention dropdown */}
          {showMention && (
            <div className="absolute bottom-full left-0 mb-2 w-72 bg-white rounded-lg border border-[var(--td-component-border)] shadow-lg z-50 max-h-60 overflow-y-auto">
              <div className="p-2 border-b border-[var(--td-component-stroke)]">
                <span className="text-xs text-[var(--td-text-color-secondary)]">{t('chat.mentionKnowledgeBase')}</span>
              </div>
              {mentionLoading ? (
                <div className="p-4 text-center">
                  <Loader2 size={20} className="animate-spin mx-auto text-[var(--td-text-color-placeholder)]" />
                </div>
              ) : mentionItems.length === 0 ? (
                <div className="p-4 text-center text-xs text-[var(--td-text-color-placeholder)]">
                  {t('chat.noResults')}
                </div>
              ) : (
                mentionItems.map((item) => (
                  <button
                    key={`${item.type}-${item.id}`}
                    onClick={() => handleMentionSelect(item)}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[var(--td-bg-color-container-hover)] text-left"
                  >
                    <Search size={16} className="text-[var(--td-brand-color)]" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm truncate">{item.name}</div>
                      <div className="text-xs text-[var(--td-text-color-placeholder)]">
                        {item.type === 'kb' ? t('chat.knowledgeBase') : t('chat.file')}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Send/Stop button */}
        {isStreaming ? (
          <button
            onClick={onStop}
            className="p-2.5 rounded-lg border border-[var(--td-border-level-1-color)] hover:bg-[var(--td-bg-color-secondarycontainer)] text-[var(--td-text-color-secondary)]"
            title={t('chat.stop')}
          >
            <Square size={20} />
          </button>
        ) : (
          <button
            onClick={handleSend}
            disabled={!value.trim() || disabled}
            className="p-2.5 rounded-lg bg-[var(--td-brand-color)] hover:bg-[var(--td-brand-color-hover)] text-white disabled:opacity-50 disabled:cursor-not-allowed"
            title={t('chat.send')}
          >
            <Send size={20} />
          </button>
        )}
      </div>
    </div>
  )
}
