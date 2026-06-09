import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import rehypeHighlight from 'rehype-highlight'
import { Bot, Copy, Plus, AlertCircle } from 'lucide-react'
import type { ChatMessage } from '@/types'
import { AgentStreamDisplay } from './AgentStreamDisplay'
import { useUIStore } from '@/stores/uiStore'
import 'katex/dist/katex.min.css'
import 'highlight.js/styles/github.css'

interface BotMsgProps {
  content: string
  session: ChatMessage
  isStreaming?: boolean
  onScrollBottom?: () => void
}

export function BotMsg({ content, session, isStreaming, onScrollBottom }: BotMsgProps) {
  const { t } = useTranslation()
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (onScrollBottom && contentRef.current) {
      onScrollBottom()
    }
  }, [content, onScrollBottom])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content)
      alert(t('common.success'))
    } catch {
      console.error('Failed to copy')
    }
  }

  const handleAddToKnowledge = () => {
    const actualContent = content.trim()
    if (!actualContent) {
      alert(t('chat.emptyContentWarning'))
      return
    }

    const question = ((session as any).userQuery || '').trim()
    const manualTitle = question ? question.substring(0, 50) + (question.length > 50 ? '...' : '') : 'Untitled'
    const manualContent = `## ${manualTitle}\n\n${actualContent}`

    const uiStore = useUIStore.getState()
    uiStore.openManualEditor('create', undefined, undefined, manualTitle, manualContent, 'draft')
  }

  const isAgentMode = !!(session as any).isAgentMode || !!(session as any).agentEventStream?.length
  const mentionedItems = session.reference_docs || []
  const isFallback = (session as any).is_fallback
  const agentEventStream = (session as any).agentEventStream || []

  return (
    <div className="flex gap-3">
      <div className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center bg-[var(--td-brand-color-light)] text-[var(--td-brand-color)]">
        <Bot size={18} />
      </div>
      <div className="flex-1 max-w-[80%]">
        {/* Agent Mode - Show AgentStreamDisplay */}
        {isAgentMode ? (
          <AgentStreamDisplay
            session={{
              isAgentMode: true,
              agentEventStream: agentEventStream,
              knowledge_references: session.reference_docs,
            }}
            userQuery={(session as any).userQuery}
            isStreaming={isStreaming}
          />
        ) : (
          <>
            {/* Mentioned Items */}
            {mentionedItems.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {mentionedItems.map((item: any) => (
                  <span
                    key={item.id}
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${
                      item.type === 'kb'
                        ? item.kb_type === 'faq'
                          ? 'bg-blue-100 text-blue-600'
                          : 'bg-green-100 text-green-600'
                        : 'bg-orange-100 text-orange-600'
                    }`}
                  >
                    <span>{item.type === 'kb' ? (item.kb_type === 'faq' ? '?' : '📁') : '📄'}</span>
                    <span>{item.name || item.knowledge_name}</span>
                  </span>
                ))}
              </div>
            )}

            {/* Content */}
            {content && (
              <div className="inline-block px-4 py-3 rounded-lg bg-white border border-[var(--td-border-level-1-color)]">
                <div ref={contentRef} className="prose prose-sm max-w-none">
                  <ReactMarkdown
                    remarkPlugins={[remarkMath]}
                    rehypePlugins={[rehypeKatex, rehypeHighlight]}
                  >
                    {content}
                  </ReactMarkdown>
                </div>
              </div>
            )}

            {/* Loading indicator */}
            {isStreaming && (
              <div className="loading-indicator mt-2">
                <div className="flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-[var(--td-brand-color)] animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-[var(--td-brand-color)] animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-[var(--td-brand-color)] animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}

            {/* Toolbar */}
            {content && !isStreaming && (
              <div className="flex items-center gap-1 mt-2">
                <button
                  onClick={handleCopy}
                  className="p-1.5 rounded hover:bg-[var(--td-bg-color-secondarycontainer)] text-[var(--td-text-color-secondary)]"
                  title={t('agent.copy')}
                >
                  <Copy size={14} />
                </button>
                <button
                  onClick={handleAddToKnowledge}
                  className="p-1.5 rounded hover:bg-[var(--td-bg-color-secondarycontainer)] text-[var(--td-text-color-secondary)]"
                  title={t('agent.addToKnowledgeBase')}
                >
                  <Plus size={14} />
                </button>
                {isFallback && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-yellow-100 text-yellow-600">
                    <AlertCircle size={12} />
                    <span>{t('chat.fallbackHint')}</span>
                  </span>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}