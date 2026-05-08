import React from 'react'
import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown, ChevronRight, Bot, Loader2, FileText, Search, Globe } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'

interface AgentEvent {
  type: 'thinking' | 'tool_call' | 'answer' | 'plan_task_change' | 'agent_complete' | 'stop'
  event_id?: string
  tool_call_id?: string
  tool_name?: string
  content?: string
  task?: string
  tool_data?: any
  output?: string
  arguments?: any
  display_type?: string
  pending?: boolean
  success?: boolean
  done?: boolean
  timestamp?: number
  total_duration_ms?: number
}

interface SessionData {
  isAgentMode?: boolean
  agentEventStream?: AgentEvent[]
  knowledge_references?: any[]
}

interface AgentStreamDisplayProps {
  session: SessionData
  userQuery?: string
  isStreaming?: boolean
}

const TOOL_NAME_KEYS: Record<string, string> = {
  search_knowledge: 'agentStream.tools.searchKnowledge',
  knowledge_search: 'agentStream.tools.searchKnowledge',
  grep_chunks: 'agentStream.tools.grepChunks',
  web_search: 'agentStream.tools.webSearch',
  web_fetch: 'agentStream.tools.webFetch',
  get_document_info: 'agentStream.tools.getDocumentInfo',
  list_knowledge_chunks: 'agentStream.tools.listKnowledgeChunks',
  get_related_documents: 'agentStream.tools.getRelatedDocuments',
  get_document_content: 'agentStream.tools.getDocumentContent',
  todo_write: 'agentStream.tools.todoWrite',
  knowledge_graph_extract: 'agentStream.tools.knowledgeGraphExtract',
  thinking: 'agentStream.tools.thinking',
  image_analysis: 'agentStream.tools.imageAnalysis',
  query_knowledge_graph: 'agentStream.tools.queryKnowledgeGraph',
  final_answer: 'agentStream.tools.finalAnswer',
}

const getLocalizedToolName = (toolName?: string): string => {
  if (!toolName) return 'Tool'
  const key = TOOL_NAME_KEYS[toolName]
  if (key) return key
  if (toolName.startsWith('mcp_')) {
    const parts = toolName.slice(4).split('_')
    return parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ')
  }
  return toolName
}

const getToolIcon = (toolName?: string): React.ReactElement => {
  if (toolName === 'thinking') {
    return <Bot size={14} className="text-purple-500" />
  }
  if (toolName === 'search_knowledge' || toolName === 'knowledge_search') {
    return <Search size={14} className="text-blue-500" />
  }
  if (toolName === 'web_search') {
    return <Globe size={14} className="text-green-500" />
  }
  if (toolName === 'get_document_info' || toolName === 'list_knowledge_chunks') {
    return <FileText size={14} className="text-orange-500" />
  }
  return <FileText size={14} className="text-gray-500" />
}

const formatDuration = (ms?: number): string => {
  if (!ms) return '0s'
  if (ms < 1000) return `${ms}ms`
  const seconds = Math.floor(ms / 1000)
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}m ${remainingSeconds}s`
}

export function AgentStreamDisplay({ session }: AgentStreamDisplayProps) {
  const { t } = useTranslation()
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set())
  const [showIntermediateSteps, setShowIntermediateSteps] = useState(false)
  const [hasAnswerStarted, setHasAnswerStarted] = useState(false)
  const [agentDurationMs, setAgentDurationMs] = useState(0)

  const rootRef = useRef<HTMLDivElement>(null)

  const eventStream = session?.agentEventStream || []

  // Check for answer start and agent_complete
  useEffect(() => {
    if (!eventStream || eventStream.length === 0) return

    // Check for agent_complete with duration
    const completeEvent = eventStream.find((e: any) => e.type === 'agent_complete' && e.total_duration_ms)
    if (completeEvent && agentDurationMs === 0 && completeEvent.total_duration_ms) {
      setAgentDurationMs(completeEvent.total_duration_ms)
    }

    // Check if answer has started
    if (!hasAnswerStarted) {
      const hasAnswer = eventStream.some((e: any) => e.type === 'answer' && e.content)
      if (hasAnswer) {
        setHasAnswerStarted(true)
      }
    }
  }, [eventStream, hasAnswerStarted, agentDurationMs])

  const isConversationDone = eventStream.some((e: any) => e.type === 'answer' && e.done === true) ||
    eventStream.some((e: any) => e.type === 'stop')

  // Build intermediate events (non-answer events)
  const intermediateEvents = eventStream.filter((e: any) =>
    e && e.type && e.type !== 'answer' && e.type !== 'agent_complete'
  )

  const intermediateStepsCount = intermediateEvents.filter((e: any) =>
    e.type === 'thinking' || e.type === 'tool_call'
  ).length

  const shouldShowCollapsedSteps = intermediateStepsCount > 0 && (hasAnswerStarted || isConversationDone)

  const toggleEvent = (eventId: string) => {
    setExpandedEvents(prev => {
      const next = new Set(prev)
      if (next.has(eventId)) {
        next.delete(eventId)
      } else {
        next.add(eventId)
      }
      return next
    })
  }

  const isEventExpanded = (eventId: string): boolean => expandedEvents.has(eventId)

  const hasResults = (event: AgentEvent): boolean => {
    if (!event.tool_data) return true
    const toolName = event.tool_name

    if (toolName === 'search_knowledge' || toolName === 'knowledge_search') {
      const count = event.tool_data.results?.length || event.tool_data.count || 0
      return count > 0
    }
    if (toolName === 'web_search') {
      const count = event.tool_data.results?.length || event.tool_data.count || 0
      return count > 0
    }
    if (toolName === 'grep_chunks') {
      const totalMatches = event.tool_data.total_matches || 0
      const resultCount = event.tool_data.result_count || 0
      return totalMatches > 0 || resultCount > 0
    }
    return true
  }

  const getThinkingSummary = (event: AgentEvent): string => {
    const content = event.content || event.tool_data?.thought || ''
    if (!content) return ''
    const cleaned = content
      .replace(/^#+\s+/gm, '')
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/`/g, '')
      .replace(/\n+/g, ' ')
      .trim()
    if (cleaned.length <= 50) return cleaned
    return cleaned.slice(0, 50) + '...'
  }

  const getToolTitle = (event: AgentEvent): string => {
    if (event.pending) {
      return getLocalizedToolName(event.tool_name)
    }
    return getLocalizedToolName(event.tool_name)
  }

  const getSearchResultsSummary = (event: AgentEvent): string => {
    if (!event.tool_data) return ''
    const count = event.tool_data.results?.length || event.tool_data.count || 0
    if (count === 0) return t('agentStream.search.noResults', 'No results')
    return t('agentStream.search.foundResults', { count: String(count) })
  }

  const renderMarkdownContent = (content: string): string => {
    if (!content) return ''
    return content
  }

  const handleActionHeaderClick = (event: AgentEvent) => {
    const eventId = event.tool_call_id || event.event_id
    if (hasResults(event) && eventId) {
      toggleEvent(eventId)
    }
  }

  const renderEvent = (event: AgentEvent, index: number) => {
    if (!event || !event.type) return null

    const eventId = event.tool_call_id || event.event_id || `event-${index}`

    // Plan task change
    if (event.type === 'plan_task_change') {
      return (
        <div key={eventId} className="plan-task-change-card my-2">
          <div className="px-3 py-2 rounded-lg bg-blue-50 border border-blue-200">
            <strong>{t('agent.taskLabel', 'Task')}</strong> {event.task}
          </div>
        </div>
      )
    }

    // Thinking event (streaming)
    if (event.type === 'thinking') {
      return (
        <div key={eventId} className="tool-event my-2">
          <div
            className={`action-card rounded-lg border border-[var(--td-border-level-1-color)] bg-white overflow-hidden ${isEventExpanded(eventId) ? 'expanded' : ''}`}
          >
            <div
              className="action-header flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-[var(--td-bg-color-secondarycontainer)]"
              onClick={() => toggleEvent(eventId)}
            >
              <div className="flex items-center gap-2">
                <Bot size={14} className="text-purple-500" />
                <span className="action-name text-sm">{t('agent.think', 'Think')}</span>
                {getThinkingSummary(event) && !isEventExpanded(eventId) && (
                  <span className="action-summary text-xs text-[var(--td-text-color-secondary)] truncate max-w-[200px]">
                    {getThinkingSummary(event)}
                  </span>
                )}
              </div>
              {event.content && (
                <div className="action-show-icon">
                  {isEventExpanded(eventId) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </div>
              )}
            </div>
            {event.content && isEventExpanded(eventId) && (
              <div className="action-details px-3 py-2 border-t border-[var(--td-border-level-1-color)]">
                <div className="thinking-detail-content text-sm">
                  <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                    {renderMarkdownContent(event.content)}
                  </ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        </div>
      )
    }

    // Thinking tool call
    if (event.type === 'tool_call' && event.tool_name === 'thinking') {
      return (
        <div key={eventId} className="tool-event my-2">
          <div
            className={`action-card rounded-lg border border-[var(--td-border-level-1-color)] bg-white overflow-hidden ${event.pending ? 'action-pending' : ''}`}
          >
            <div
              className="action-header flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-[var(--td-bg-color-secondarycontainer)]"
              onClick={() => toggleEvent(eventId)}
            >
              <div className="flex items-center gap-2">
                <Bot size={14} className="text-purple-500" />
                <span className="action-name text-sm">{t('agent.think', 'Think')}</span>
                {event.tool_data?.thought_number && (
                  <span className="action-badge text-xs px-1.5 py-0.5 rounded bg-purple-100 text-purple-600">
                    {event.tool_data.thought_number}/{event.tool_data.total_thoughts}
                  </span>
                )}
                {getThinkingSummary(event) && !isEventExpanded(eventId) && (
                  <span className="action-summary text-xs text-[var(--td-text-color-secondary)] truncate max-w-[200px]">
                    {getThinkingSummary(event)}
                  </span>
                )}
              </div>
              {event.tool_data?.thought && (
                <div className="action-show-icon">
                  {isEventExpanded(eventId) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </div>
              )}
            </div>
            {event.tool_data?.thought && isEventExpanded(eventId) && (
              <div className="action-details px-3 py-2 border-t border-[var(--td-border-level-1-color)]">
                <div className="thinking-detail-content text-sm">
                  <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                    {renderMarkdownContent(event.tool_data.thought)}
                  </ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        </div>
      )
    }

    // Tool call event (non-thinking)
    if (event.type === 'tool_call') {
      const isPending = event.pending
      const isError = event.success === false

      return (
        <div key={eventId} className="tool-event my-2">
          <div
            className={`action-card rounded-lg border bg-white overflow-hidden ${
              isPending ? 'border-yellow-300 bg-yellow-50' : isError ? 'border-red-300 bg-red-50' : 'border-[var(--td-border-level-1-color)]'
            }`}
          >
            <div
              className={`action-header flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-[var(--td-bg-color-secondarycontainer)] ${!hasResults(event) ? 'no-results' : ''}`}
              onClick={() => handleActionHeaderClick(event)}
            >
              <div className="flex items-center gap-2">
                {getToolIcon(event.tool_name)}
                <span className="action-name text-sm">{getToolTitle(event)}</span>
              </div>
              {!isPending && hasResults(event) && (
                <div className="action-show-icon">
                  {isEventExpanded(eventId) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </div>
              )}
            </div>

            {/* Search results summary */}
            {!isPending && (event.tool_name === 'search_knowledge' || event.tool_name === 'knowledge_search') && event.tool_data && (
              <div className="search-results-summary px-3 py-1 text-xs text-[var(--td-text-color-secondary)] border-t border-[var(--td-border-level-1-color)]">
                {getSearchResultsSummary(event)}
              </div>
            )}

            {/* Web search results summary */}
            {!isPending && event.tool_name === 'web_search' && event.tool_data && (
              <div className="search-results-summary px-3 py-1 text-xs text-[var(--td-text-color-secondary)] border-t border-[var(--td-border-level-1-color)]">
                {t('agent.webSearchFound', { count: event.tool_data.results?.length || event.tool_data.count || 0 })}
              </div>
            )}

            {/* Tool result details */}
            {!isPending && isEventExpanded(eventId) && hasResults(event) && (
              <div className="action-details px-3 py-2 border-t border-[var(--td-border-level-1-color)]">
                {event.tool_data && (
                  <div className="tool-result-wrapper text-sm">
                    <pre className="bg-[var(--td-bg-color-secondarycontainer)] p-2 rounded text-xs overflow-x-auto max-h-48">
                      {JSON.stringify(event.tool_data, null, 2)}
                    </pre>
                  </div>
                )}
                {event.output && !event.tool_data && (
                  <div className="tool-output-wrapper">
                    <div className="fallback-header text-xs text-[var(--td-text-color-secondary)] mb-1">
                      {t('chat.rawOutputLabel', 'Raw Output')}
                    </div>
                    <pre className="bg-[var(--td-bg-color-secondarycontainer)] p-2 rounded text-xs overflow-x-auto">
                      {event.output}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )
    }

    // Answer event
    if (event.type === 'answer') {
      if (!event.content?.trim()) return null
      return (
        <div key={eventId} className="answer-event my-2">
          <div className="answer-content px-4 py-3 rounded-lg bg-white border border-[var(--td-border-level-1-color)]">
            <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
              {event.content}
            </ReactMarkdown>
          </div>
        </div>
      )
    }

    return null
  }

  const displayEvents = eventStream.filter((e: any) => {
    if (!hasAnswerStarted && !isConversationDone) {
      return e && e.type && e.type !== 'agent_complete'
    }
    return e && e.type === 'answer'
  })

  return (
    <div ref={rootRef} className="agent-stream-display">
      {/* Collapsed intermediate steps (tree root) */}
      {shouldShowCollapsedSteps && (
        <div className="tree-container mb-3">
          <div
            className="tree-root flex items-center justify-between px-4 py-2 rounded-lg bg-[var(--td-bg-color-container)] border border-[var(--td-component-stroke)] cursor-pointer hover:bg-[rgba(7,192,95,0.04)]"
            onClick={() => setShowIntermediateSteps(!showIntermediateSteps)}
          >
            <div className="flex items-center gap-2">
              <Bot size={16} className="text-[var(--td-brand-color)]" />
              <span className="text-sm font-medium">
                {intermediateStepsCount} {t('agent.stepsCompleted', 'steps completed')}
                {agentDurationMs > 0 && ` · ${formatDuration(agentDurationMs)}`}
              </span>
            </div>
            <div className="text-[var(--td-brand-color)]">
              {showIntermediateSteps ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </div>
          </div>

          {/* Tree children */}
          {showIntermediateSteps && (
            <div className="tree-children mt-2 pl-4 border-l-2 border-[var(--td-brand-color)]">
              {intermediateEvents.map((event, index) => (
                <div key={`intermediate-${index}`} className="tree-child">
                  <div className="tree-branch" />
                  <div className="tree-child-content">
                    {renderEvent(event, index)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Streaming steps container */}
      <div className="streaming-steps-container">
        {displayEvents.map((event, index) => renderEvent(event, index))}

        {/* Loading indicator */}
        {!isConversationDone && eventStream.length > 0 && (
          <div className="loading-indicator flex items-center gap-2 px-4 py-2 text-sm text-[var(--td-text-color-secondary)]">
            <Loader2 size={14} className="animate-spin" />
            <span>{t('chat.processing', 'Processing...')}</span>
          </div>
        )}
      </div>
    </div>
  )
}
