import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

interface AgentSettingsProps {
  isAgentReady?: boolean
  agentStatusMessage?: string
  needsModelConfig?: boolean
  maxIterations?: number
  temperature?: number
  systemPrompt?: string
  allowedTools?: Array<{ name: string; label: string; description?: string }>
  onUpdate?: (settings: {
    maxIterations?: number
    temperature?: number
    systemPrompt?: string
  }) => void
  onGoToModelSettings?: () => void
}

const AVAILABLE_PLACEHOLDERS = [
  { name: 'current_date', label: 'Current Date', description: 'Current system date' },
  { name: 'user_name', label: 'User Name', description: 'Current user name' },
  { name: 'kb_names', label: 'KB Names', description: 'Names of selected knowledge bases' },
]

export function AgentSettings({
  isAgentReady = false,
  agentStatusMessage = '',
  needsModelConfig = false,
  maxIterations = 10,
  temperature = 0.7,
  systemPrompt = '',
  allowedTools = [],
  onUpdate,
  onGoToModelSettings,
}: AgentSettingsProps) {
  const { t } = useTranslation()

  const [localMaxIterations, setLocalMaxIterations] = useState(maxIterations)
  const [localTemperature, setLocalTemperature] = useState(temperature)
  const [localSystemPrompt, setLocalSystemPrompt] = useState(systemPrompt)

  useEffect(() => {
    setLocalMaxIterations(maxIterations)
    setLocalTemperature(temperature)
    setLocalSystemPrompt(systemPrompt)
  }, [maxIterations, temperature, systemPrompt])

  const handleMaxIterationsChange = (value: number) => {
    setLocalMaxIterations(value)
    onUpdate?.({ maxIterations: value, temperature: localTemperature, systemPrompt: localSystemPrompt })
  }

  const handleTemperatureChange = (value: number) => {
    setLocalTemperature(value)
    onUpdate?.({ maxIterations: localMaxIterations, temperature: value, systemPrompt: localSystemPrompt })
  }

  const handleSystemPromptChange = (value: string) => {
    setLocalSystemPrompt(value)
    onUpdate?.({ maxIterations: localMaxIterations, temperature: localTemperature, systemPrompt: value })
  }

  return (
    <div className="agent-settings">
      <div className="section-header mb-6">
        <h2 className="text-lg font-medium">{t('settings.conversationStrategy', 'Conversation Strategy')}</h2>
        <p className="text-sm text-[var(--td-text-color-secondary)] mt-1">
          {t('conversationSettings.description', 'Configure how the AI agent handles conversations')}
        </p>
        <div className="mt-3 flex items-center gap-2 text-sm text-blue-600 bg-blue-50 p-3 rounded-lg">
          <span>i</span>
          <span>{t('agentSettings.globalConfigNotice', 'These are global settings that apply to all agents')}</span>
        </div>
      </div>

      <div className="space-y-6">
        {/* Agent Status */}
        <div className="setting-row">
          <div className="setting-info">
            <label className="font-medium text-sm">
              {t('agentSettings.status.label', 'Agent Status')}
            </label>
          </div>
          <div className="setting-control">
            <div className="flex items-center gap-2">
              <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                isAgentReady
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
              }`}>
                {isAgentReady ? (
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                )}
                <span>{isAgentReady
                  ? t('agentSettings.status.ready', 'Ready')
                  : t('agentSettings.status.notReady', 'Not Ready')
                }</span>
              </div>
            </div>
            {!isAgentReady && (
              <div className="mt-2">
                <p className="text-sm text-[var(--td-text-color-secondary)]">
                  {agentStatusMessage}
                  {needsModelConfig && (
                    <button
                      onClick={onGoToModelSettings}
                      className="ml-1 text-[var(--td-brand-color)] hover:underline"
                    >
                      {t('agentSettings.status.goConfigureModels', 'Configure Models')}
                    </button>
                  )}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Model Recommendation */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <span className="text-blue-600">i</span>
            <div>
              <p className="text-sm font-medium text-blue-800">
                {t('agentSettings.modelRecommendation.title', 'Model Recommendation')}
              </p>
              <p className="text-sm text-blue-700 mt-1">
                {t('agentSettings.modelRecommendation.content', 'For best agent performance, we recommend using GPT-4 or Claude 3 as the LLM model.')}
              </p>
            </div>
          </div>
        </div>

        {/* Max Iterations */}
        <div className="setting-row">
          <div className="setting-info">
            <label className="font-medium text-sm">
              {t('agentSettings.maxIterations.label', 'Max Iterations')}
            </label>
            <p className="text-xs text-[var(--td-text-color-secondary)] mt-0.5">
              {t('agentSettings.maxIterations.desc', 'Maximum number of tool-calling iterations before giving up')}
            </p>
          </div>
          <div className="setting-control">
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="1"
                max="30"
                step="1"
                value={localMaxIterations}
                onChange={(e) => handleMaxIterationsChange(Number(e.target.value))}
                className="w-48"
              />
              <span className="text-sm font-medium min-w-[40px]">{localMaxIterations}</span>
            </div>
            <div className="flex gap-4 text-xs text-[var(--td-text-color-placeholder)] mt-1">
              <span>1</span>
              <span className="ml-12">5</span>
              <span className="ml-12">10</span>
              <span className="ml-12">15</span>
              <span className="ml-12">20</span>
              <span className="ml-12">25</span>
              <span className="ml-12">30</span>
            </div>
          </div>
        </div>

        {/* Temperature */}
        <div className="setting-row">
          <div className="setting-info">
            <label className="font-medium text-sm">
              {t('agentSettings.temperature.label', 'Temperature')}
            </label>
            <p className="text-xs text-[var(--td-text-color-secondary)] mt-0.5">
              {t('agentSettings.temperature.desc', 'Controls randomness in responses. Lower = more focused, higher = more creative')}
            </p>
          </div>
          <div className="setting-control">
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={localTemperature}
                onChange={(e) => handleTemperatureChange(Number(e.target.value))}
                className="w-48"
              />
              <span className="text-sm font-medium min-w-[40px]">{localTemperature.toFixed(1)}</span>
            </div>
            <div className="flex gap-4 text-xs text-[var(--td-text-color-placeholder)] mt-1">
              <span>0</span>
              <span className="ml-20">0.5</span>
              <span className="ml-20">1</span>
            </div>
          </div>
        </div>

        {/* Allowed Tools */}
        <div className="setting-row flex-col">
          <div className="setting-info">
            <label className="font-medium text-sm">
              {t('agentSettings.allowedTools.label', 'Allowed Tools')}
            </label>
            <p className="text-xs text-[var(--td-text-color-secondary)] mt-0.5">
              {t('agentSettings.allowedTools.desc', 'Tools that agents are allowed to use')}
            </p>
          </div>
          <div className="setting-control w-full">
            {allowedTools.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {allowedTools.map((tool) => (
                  <div
                    key={tool.name}
                    className="px-3 py-2 rounded-lg border border-[var(--td-border-level-1-color)] bg-white"
                  >
                    <span className="text-sm font-medium">{tool.label}</span>
                    {tool.description && (
                      <p className="text-xs text-[var(--td-text-color-secondary)]">{tool.description}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[var(--td-text-color-placeholder)]">
                {t('agentSettings.allowedTools.empty', 'No tools configured')}
              </p>
            )}
          </div>
        </div>

        {/* System Prompt */}
        <div className="setting-row flex-col">
          <div className="setting-info">
            <label className="font-medium text-sm">
              {t('agentSettings.systemPrompt.label', 'System Prompt')}
            </label>
            <p className="text-xs text-[var(--td-text-color-secondary)] mt-0.5">
              {t('agentSettings.systemPrompt.desc', 'Instructions that guide agent behavior')}
            </p>
            <div className="mt-3 p-3 bg-gray-50 rounded-lg text-xs">
              <p className="font-medium mb-2">
                {t('agentSettings.systemPrompt.availablePlaceholders', 'Available Placeholders')}
              </p>
              <ul className="space-y-1">
                {AVAILABLE_PLACEHOLDERS.map((placeholder) => (
                  <li key={placeholder.name}>
                    <code className="bg-gray-200 px-1 rounded">{`{{${placeholder.name}}}`}</code>
                    {' - '}
                    {placeholder.label} ({placeholder.description})
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-[var(--td-text-color-placeholder)]">
                {t('agentSettings.systemPrompt.hintPrefix', 'Use')}{' '}
                <code>{'{{{'}</code>{' '}
                {t('agentSettings.systemPrompt.hintSuffix', 'to insert values')}
              </p>
            </div>
          </div>
          <div className="setting-control w-full">
            <textarea
              value={localSystemPrompt}
              onChange={(e) => handleSystemPromptChange(e.target.value)}
              rows={8}
              className="w-full px-3 py-2 rounded-lg border border-[var(--td-border-level-1-color)] bg-white text-sm resize-none"
              placeholder={t('agentSettings.systemPrompt.placeholder', 'Enter system prompt...')}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
