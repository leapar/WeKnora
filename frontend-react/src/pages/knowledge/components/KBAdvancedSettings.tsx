import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

interface QuestionGenerationConfig {
  enabled: boolean
  questionCount: number
}

interface KBAdvancedSettingsProps {
  questionGeneration?: QuestionGenerationConfig
  ragEnabled?: boolean
  allModels?: any[]
  onUpdate?: (config: QuestionGenerationConfig) => void
}

export function KBAdvancedSettings({
  questionGeneration,
  ragEnabled = true,
  onUpdate,
}: KBAdvancedSettingsProps) {
  const { t } = useTranslation()

  const [localConfig, setLocalConfig] = useState<QuestionGenerationConfig>(
    questionGeneration || { enabled: false, questionCount: 3 }
  )

  useEffect(() => {
    if (questionGeneration) {
      setLocalConfig({ ...questionGeneration })
    }
  }, [questionGeneration])

  const handleToggle = () => {
    const newEnabled = !localConfig.enabled
    const newConfig = {
      ...localConfig,
      enabled: newEnabled,
      questionCount: newEnabled && localConfig.questionCount === 0 ? 3 : localConfig.questionCount,
    }
    setLocalConfig(newConfig)
    onUpdate?.(newConfig)
  }

  const handleCountChange = (count: number) => {
    const newConfig = { ...localConfig, questionCount: count }
    setLocalConfig(newConfig)
    onUpdate?.(newConfig)
  }

  if (ragEnabled === false) {
    return null
  }

  return (
    <div className="kb-advanced-settings">
      <div className="section-header mb-6">
        <h2 className="text-lg font-medium">
          {t('knowledgeEditor.advanced.title', 'Advanced Settings')}
        </h2>
        <p className="text-sm text-[var(--td-text-color-secondary)] mt-1">
          {t('knowledgeEditor.advanced.description', 'Configure advanced indexing and retrieval options')}
        </p>
      </div>

      <div className="space-y-6">
        {/* Question Generation */}
        <div className="setting-row">
          <div className="setting-info">
            <label className="font-medium text-sm">
              {t('knowledgeEditor.advanced.questionGeneration.label', 'Question Generation')}
            </label>
            <p className="text-xs text-[var(--td-text-color-secondary)] mt-0.5">
              {t('knowledgeEditor.advanced.questionGeneration.description', 'Generate Q&A pairs from documents to improve retrieval accuracy')}
            </p>
          </div>
          <div className="setting-control">
            <button
              type="button"
              onClick={handleToggle}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                localConfig.enabled ? 'bg-[var(--td-brand-color)]' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  localConfig.enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Question Generation Config */}
        {localConfig.enabled && (
          <div className="ml-4 pl-4 border-l-[3px] border-[var(--td-brand-color)] bg-[var(--td-bg-color-container)] rounded-r-lg p-4">
            <div className="setting-row py-0 border-b-0">
              <div className="setting-info">
                <label className="font-medium text-sm">
                  {t('knowledgeEditor.advanced.questionGeneration.countLabel', 'Questions per Chunk')}
                </label>
                <p className="text-xs text-[var(--td-text-color-secondary)] mt-0.5">
                  {t('knowledgeEditor.advanced.questionGeneration.countDescription', 'Number of Q&A pairs to generate per chunk')}
                </p>
              </div>
              <div className="setting-control">
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={localConfig.questionCount}
                  onChange={(e) => handleCountChange(Number(e.target.value))}
                  className="px-3 py-2 rounded-lg border border-[var(--td-border-level-1-color)] bg-white text-sm w-24"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
