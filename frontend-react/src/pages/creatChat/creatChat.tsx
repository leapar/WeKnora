import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useSettingsStore } from '@/stores/settingsStore'
import { Button } from '@/components/ui/button'
import { Loader2, MessageCircle, Sparkles } from 'lucide-react'
import { getSuggestedQuestions, listAgents } from '@/api/agent'

export function CreatChat() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { settings, selectAgent } = useSettingsStore()

  const [agents, setAgents] = useState<any[]>([])
  const [suggestedQuestions, setSuggestedQuestions] = useState<any[]>([])
  const [suggestedQuestionsLoading, setSuggestedQuestionsLoading] = useState(false)

  const selectedAgentId = settings.agentConfig?.selectedAgentId

  const loadAgents = useCallback(async () => {
    try {
      const response = await listAgents()
      if (response.success && response.data) {
        setAgents(response.data.agents || [])
      }
    } catch (error) {
      console.error('Failed to load agents:', error)
    }
  }, [])

  const fetchSuggestedQuestions = useCallback(async () => {
    if (!selectedAgentId) return
    setSuggestedQuestionsLoading(true)
    try {
      const selectedKBs = settings.selectedKnowledgeBases || []
      const res = await getSuggestedQuestions(selectedAgentId, {
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
  }, [selectedAgentId, settings.selectedKnowledgeBases])

  useEffect(() => {
    loadAgents()
  }, [loadAgents])

  useEffect(() => {
    fetchSuggestedQuestions()
  }, [fetchSuggestedQuestions])

  const handleSuggestedQuestionClick = (_question: string) => {
    navigate('/platform/chat')
  }

  const handleSelectAgent = (agentId: string) => {
    selectAgent(agentId)
  }

  return (
    <div className="min-h-screen bg-[var(--td-bg-color-page)]">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--td-brand-color)] bg-opacity-10 mb-6">
            <MessageCircle size={32} className="text-[var(--td-brand-color)]" />
          </div>
          <h1 className="text-3xl font-semibold text-[var(--td-text-color-primary)] mb-4">
            {t('createChat.title')}
          </h1>
          <p className="text-[var(--td-text-color-secondary)]">
            {t('createChat.subtitle')}
          </p>
        </div>

        {/* Agent Selection */}
        <div className="mb-8">
          <h2 className="text-lg font-medium text-[var(--td-text-color-primary)] mb-4">
            {t('createChat.selectAgent')}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {agents.slice(0, 8).map((agent) => (
              <button
                key={agent.id}
                className={`p-4 rounded-lg border text-left transition-all ${
                  selectedAgentId === agent.id
                    ? 'border-[var(--td-brand-color)] bg-[var(--td-brand-color)] bg-opacity-5'
                    : 'border-[var(--td-border-level-1-color)] bg-white hover:border-[var(--td-brand-color)]'
                }`}
                onClick={() => handleSelectAgent(agent.id)}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    agent.type === 'agent'
                      ? 'bg-purple-100 text-purple-600'
                      : 'bg-green-100 text-green-600'
                  }`}>
                    {agent.type === 'agent' ? (
                      <Sparkles size={20} />
                    ) : (
                      <MessageCircle size={20} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{agent.name}</p>
                    <p className="text-xs text-[var(--td-text-color-secondary)]">
                      {agent.type === 'agent' ? t('agent.mode.agent') : t('agent.mode.normal')}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Suggested Questions */}
        {selectedAgentId && (
          <div className="mb-8">
            <h2 className="text-lg font-medium text-[var(--td-text-color-primary)] mb-4">
              {t('chat.suggestedQuestions')}
            </h2>
            {suggestedQuestionsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="animate-spin text-[var(--td-brand-color)]" size={24} />
              </div>
            ) : suggestedQuestions.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {suggestedQuestions.map((item, index) => (
                  <button
                    key={index}
                    className="p-4 rounded-lg border border-[var(--td-border-level-1-color)] bg-white hover:border-[var(--td-brand-color)] hover:bg-[var(--td-brand-color)] hover:bg-opacity-5 text-left transition-all group"
                    onClick={() => handleSuggestedQuestionClick(item.question)}
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
            ) : (
              <div className="text-center py-8 text-[var(--td-text-color-secondary)]">
                <p>{t('createChat.noSuggestions')}</p>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-center gap-4">
          <Button
            size="lg"
            onClick={() => navigate('/platform/chat')}
            disabled={!selectedAgentId}
          >
            <MessageCircle size={18} className="mr-2" />
            {t('chat.startChat')}
          </Button>
        </div>
      </div>
    </div>
  )
}
