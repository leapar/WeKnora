import { useState, useRef, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useSettingsStore } from '@/stores/settingsStore'
import { useMenuStore } from '@/stores/menuStore'
import { useChatStream } from '@/hooks/useChatStream'
import { getSession, createSession } from '@/api/chat'
import { getSuggestedQuestions } from '@/api/agent'
import { Button } from '@/components/ui/button'
import { Bot, Loader2, Plus, Settings, MessageSquare } from 'lucide-react'
import type { ChatMessage, StreamChunk } from '@/types'
import { UserMsg } from './components/UserMsg'
import { BotMsg } from './components/BotMsg'
import { DeepThink } from './components/DeepThink'
import { SearchResults } from './components/SearchResults'
import { ToolCallsDisplay } from './components/ToolResultRenderer'
import { ChatInput } from '@/components/ChatInput'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'

export function Chat() {
  const { chatid } = useParams<{ chatid: string }>()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { settings } = useSettingsStore()
  const { updatemenuArr } = useMenuStore()
  const { startStream, stopStream } = useChatStream()

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [currentThinking, setCurrentThinking] = useState('')
  const [currentContent, setCurrentContent] = useState('')
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(chatid || null)
  const [isCreatingSession, setIsCreatingSession] = useState(false)
  const [suggestedQuestions, setSuggestedQuestions] = useState<any[]>([])
  const [suggestedQuestionsLoading, setSuggestedQuestionsLoading] = useState(false)
  const [referenceDocs, setReferenceDocs] = useState<any[]>([])
  const [agentToolCalls, setAgentToolCalls] = useState<any[]>([])
  const [, setShowThink] = useState(false)
  const [, setIsAgentMode] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, currentContent, scrollToBottom])

  useEffect(() => {
    if (chatid) {
      setCurrentSessionId(chatid)
      loadSession(chatid)
    }
    fetchSuggestedQuestions()
  }, [chatid])

  const loadSession = async (sessionId: string) => {
    try {
      const sessionResponse = await getSession(sessionId)
      if (sessionResponse.success && sessionResponse.data) {
        setMessages(sessionResponse.data.messages || [])
      }
    } catch (error) {
      console.error('Failed to load session:', error)
    }
  }

  const fetchSuggestedQuestions = async () => {
    const agentId = settings.agentConfig?.selectedAgentId
    if (!agentId) return

    setSuggestedQuestionsLoading(true)
    try {
      const selectedKBs = settings.selectedKnowledgeBases || []
      const res = await getSuggestedQuestions(agentId, {
        knowledge_base_ids: selectedKBs.length > 0 ? selectedKBs : undefined,
        limit: 6,
      })
      if (res.success && res.data) {
        setSuggestedQuestions(res.data.questions || [])
      }
    } catch (error) {
      console.warn('Failed to fetch suggested questions:', error)
    } finally {
      setSuggestedQuestionsLoading(false)
    }
  }

  const handleCreateNewChat = async () => {
    setIsCreatingSession(true)
    try {
      const response = await createSession()
      if (response.success && response.data) {
        const newSessionId = response.data.id
        setCurrentSessionId(newSessionId)
        setMessages([])
        updatemenuArr({
          id: newSessionId,
          title: t('chat.newChat'),
          path: 'chat',
        })
        navigate(`/platform/chat/${newSessionId}`)
      }
    } catch (error) {
      console.error('Failed to create session:', error)
    } finally {
      setIsCreatingSession(false)
    }
  }

  const handleSendWithMessage = async (message: string, _mentionedItems: any[] = []) => {
    if (!message.trim() || isStreaming) return

    let sessionId = currentSessionId

    if (!sessionId) {
      setIsCreatingSession(true)
      try {
        const createResponse = await createSession()
        if (createResponse.success && createResponse.data) {
          sessionId = createResponse.data.id
          setCurrentSessionId(sessionId)
          updatemenuArr({
            id: sessionId,
            title: message.trim().substring(0, 30) + (message.length > 30 ? '...' : ''),
            path: 'chat',
          })
          navigate(`/platform/chat/${sessionId}`)
        } else {
          return
        }
      } catch (error) {
        console.error('Failed to create session:', error)
        return
      } finally {
        setIsCreatingSession(false)
      }
    }

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      session_id: sessionId,
      role: 'user',
      content: message.trim(),
      created_at: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMessage])
    setIsStreaming(true)
    setCurrentContent('')
    setCurrentThinking('')
    setReferenceDocs([])
    setAgentToolCalls([])
    setShowThink(false)
    setIsAgentMode(false)

    try {
      await startStream(
        {
          session_id: sessionId,
          query: message,
          knowledge_base_ids: settings.selectedKnowledgeBases,
          agent_enabled: settings.isAgentEnabled,
          agent_id: settings.agentConfig.selectedAgentId,
          web_search_enabled: settings.webSearchEnabled,
          enable_memory: settings.memoryEnabled,
          temperature: settings.temperature,
        },
        {
          onChunk: (chunk: StreamChunk) => {
            handleStreamChunk(chunk, sessionId!)
          },
          onError: (error) => {
            console.error('Stream error:', error)
            setIsStreaming(false)
          },
          onComplete: () => {
            setIsStreaming(false)
          },
        }
      )
    } catch (error) {
      console.error('Failed to send message:', error)
      setIsStreaming(false)
    }
  }

  const handleStreamChunk = (chunk: StreamChunk, sessionId: string) => {
    switch (chunk.type) {
      case 'text':
        setCurrentContent((prev) => prev + (chunk.content || ''))
        break
      case 'thinking':
        setCurrentThinking((prev) => prev + (chunk.content || ''))
        setShowThink(true)
        break
      case 'reference':
        if (chunk.data) {
          setReferenceDocs((prev) => [...prev, chunk.data])
        }
        break
      case 'tool_call':
        if (chunk.data) {
          setAgentToolCalls((prev) => [...prev, chunk.data])
          setIsAgentMode(true)
        }
        break
      case 'tool_result':
        if (chunk.data) {
          setAgentToolCalls((prev) =>
            prev.map((tc) =>
              tc.id === chunk.data?.id ? { ...tc, ...chunk.data } : tc
            )
          )
        }
        break
      case 'done':
        const botMessage: ChatMessage = {
          id: `bot-${Date.now()}`,
          session_id: sessionId,
          role: 'assistant',
          content: currentContent,
          created_at: new Date().toISOString(),
          reference_docs: referenceDocs,
          agent_tool_calls: agentToolCalls,
        }
        setMessages((prev) => [...prev, botMessage])
        setCurrentContent('')
        setCurrentThinking('')
        setReferenceDocs([])
        setAgentToolCalls([])
        break
      case 'error':
        console.error('Stream error:', chunk.content)
        break
    }
  }

  const handleStop = () => {
    stopStream()
    setIsStreaming(false)
  }

  const handleSuggestedQuestionClick = (question: string) => {
    handleSendWithMessage(question, [])
  }

  const handleScroll = () => {
    // Future: implement scroll to bottom button visibility
  }

  return (
    <div className="chat-container flex flex-col h-full bg-[var(--td-bg-color-page)]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--td-border-level-1-color)] bg-white">
        <div className="flex items-center gap-3">
          <MessageSquare size={24} className="text-[var(--td-brand-color)]" />
          <h1 className="text-lg font-semibold">
            {currentSessionId ? t('chat.conversation') : t('chat.startConversation')}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleCreateNewChat} disabled={isCreatingSession}>
            <Plus size={16} className="mr-1" />
            {t('chat.newChat')}
          </Button>
          <Button variant="ghost" size="icon">
            <Settings size={20} />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-6" onScroll={handleScroll}>
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Suggested Questions - only show when no messages */}
          {messages.length === 0 && !isStreaming && (
            <div className="mb-8">
              {(suggestedQuestionsLoading || suggestedQuestions.length > 0) && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-[var(--td-text-color-secondary)] mb-3">
                    {suggestedQuestionsLoading ? (
                      <Loader2 size={14} className="inline animate-spin mr-2" />
                    ) : null}
                    {t('chat.suggestedQuestions')}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {suggestedQuestions.map((item, index) => (
                      <button
                        key={index}
                        onClick={() => handleSuggestedQuestionClick(item.question)}
                        className="p-4 rounded-lg border border-[var(--td-border-level-1-color)] bg-white hover:border-[var(--td-brand-color)] hover:bg-[var(--td-brand-color)] hover:bg-opacity-5 text-left transition-all"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-sm text-[var(--td-text-color-primary)] flex-1">
                            {item.question}
                          </p>
                          {item.source === 'faq' && (
                            <span className="px-2 py-0.5 text-xs rounded bg-blue-100 text-blue-600 flex-shrink-0">
                              FAQ
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {messages.map((message) => (
            <div key={message.id}>
              {message.role === 'user' ? (
                <UserMsg content={message.content} />
              ) : (
                <BotMsg
                  content={message.content}
                  session={message}
                  isStreaming={false}
                />
              )}
            </div>
          ))}

          {/* Streaming Message */}
          {(isStreaming || currentContent || currentThinking) && (
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center bg-[var(--td-brand-color-light)] text-[var(--td-brand-color)]">
                <Bot size={18} />
              </div>
              <div className="flex-1 max-w-[80%]">
                {/* Deep Thinking */}
                {currentThinking && <DeepThink content={currentThinking} isStreaming={isStreaming} />}

                {/* Agent Tool Calls */}
                {agentToolCalls.length > 0 && (
                  <ToolCallsDisplay toolCalls={agentToolCalls} isStreaming={isStreaming} />
                )}

                {/* Reference Docs */}
                {referenceDocs.length > 0 && (
                  <SearchResults results={referenceDocs} isLoading={false} />
                )}

                {/* Content */}
                {currentContent && (
                  <div className="inline-block px-4 py-3 rounded-lg bg-white border border-[var(--td-border-level-1-color)]">
                    <div className="prose prose-sm max-w-none">
                      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                        {currentContent}
                      </ReactMarkdown>
                    </div>
                    {isStreaming && <Loader2 size={16} className="animate-spin mt-2 inline" />}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Empty State */}
          {messages.length === 0 && !isStreaming && suggestedQuestions.length === 0 && (
            <div className="text-center py-20">
              <Bot size={64} className="mx-auto mb-6 text-[var(--td-text-color-placeholder)]" />
              <h2 className="text-xl font-medium mb-2">{t('chat.startConversation')}</h2>
              <p className="text-[var(--td-text-color-secondary)] mb-6">{t('chat.selectAgentOrStart')}</p>
              <Button onClick={handleCreateNewChat} disabled={isCreatingSession}>
                {isCreatingSession ? (
                  <>
                    <Loader2 size={18} className="mr-2 animate-spin" />
                    {t('common.loading')}
                  </>
                ) : (
                  <>
                    <Plus size={18} className="mr-2" />
                    {t('chat.startChat')}
                  </>
                )}
              </Button>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <ChatInput
        onSend={(msg, mentionedItems) => {
          // Set input value for send
          handleSendWithMessage(msg, mentionedItems)
        }}
        onStop={handleStop}
        disabled={isCreatingSession}
        isStreaming={isStreaming}
        placeholder={t('chat.placeholder')}
      />
      <p className="text-xs text-[var(--td-text-color-placeholder)] py-2 text-center bg-white border-t border-[var(--td-border-level-1-color)]">
        {t('chat.disclaimer')}
      </p>
    </div>
  )
}