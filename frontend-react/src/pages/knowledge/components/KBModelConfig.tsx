import { useTranslation } from 'react-i18next'

interface ModelConfig {
  llmModelId?: string
  embeddingModelId?: string
  vllmModelId?: string
  wikiSynthesisModelId?: string
}

interface KBModelConfigProps {
  config: ModelConfig
  hasFiles?: boolean
  wikiEnabled?: boolean
  ragEnabled?: boolean
  allModels?: Array<{
    id: string
    name: string
    type: string
  }>
  onUpdate: (config: ModelConfig) => void
  onAddModel?: () => void
}

export function KBModelConfig({
  config,
  hasFiles = false,
  wikiEnabled = false,
  ragEnabled = true,
  allModels = [],
  onUpdate,
  onAddModel,
}: KBModelConfigProps) {
  const { t } = useTranslation()

  const handleLLMChange = (modelId: string) => {
    onUpdate({
      ...config,
      llmModelId: modelId,
    })
  }

  const handleEmbeddingChange = (modelId: string) => {
    onUpdate({
      ...config,
      embeddingModelId: modelId,
    })
  }

  const handleWikiModelChange = (modelId: string) => {
    onUpdate({
      ...config,
      wikiSynthesisModelId: modelId,
    })
  }

  const llmModels = allModels.filter(m => m.type === 'KnowledgeQA' || m.type === 'chat')
  const embeddingModels = allModels.filter(m => m.type === 'Embedding' || m.type === 'embedding')

  return (
    <div className="kb-model-config">
      <div className="section-header mb-6">
        <h2 className="text-lg font-medium">{t('knowledgeEditor.models.title', 'Model Configuration')}</h2>
        <p className="text-sm text-[var(--td-text-color-secondary)] mt-1">
          {t('knowledgeEditor.models.description', 'Configure the AI models used for this knowledge base')}
        </p>
      </div>

      <div className="space-y-6">
        {/* LLM Model */}
        <div className="setting-row">
          <div className="setting-info">
            <label className="font-medium text-sm">
              {t('knowledgeEditor.models.llmLabel', 'LLM Model')} <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-[var(--td-text-color-secondary)] mt-0.5">
              {t('knowledgeEditor.models.llmDesc', 'Large language model for question answering')}
            </p>
          </div>
          <div className="setting-control">
            <div className="flex gap-2">
              <select
                value={config.llmModelId || ''}
                onChange={(e) => handleLLMChange(e.target.value)}
                className="px-3 py-2 rounded-lg border border-[var(--td-border-level-1-color)] bg-white text-sm min-w-[280px]"
              >
                <option value="">{t('knowledgeEditor.models.llmPlaceholder', 'Select LLM...')}</option>
                {llmModels.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ))}
              </select>
              {onAddModel && (
                <button
                  type="button"
                  onClick={onAddModel}
                  className="px-3 py-2 rounded-lg border border-[var(--td-border-level-1-color)] bg-white text-sm hover:border-[var(--td-brand-color)]"
                >
                  {t('common.add', 'Add')}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Embedding Model */}
        {ragEnabled !== false && (
          <div className="setting-row">
            <div className="setting-info">
              <label className="font-medium text-sm">
                {t('knowledgeEditor.models.embeddingLabel', 'Embedding Model')}
                {ragEnabled && <span className="text-red-500">*</span>}
              </label>
              <p className="text-xs text-[var(--td-text-color-secondary)] mt-0.5">
                {t('knowledgeEditor.models.embeddingDesc', 'Model for embedding documents and queries')}
              </p>
              {hasFiles && (
                <p className="text-xs text-yellow-600 mt-1">
                  {t('knowledgeEditor.models.embeddingLocked', 'Embedding model is locked because files have been uploaded')}
                </p>
              )}
            </div>
            <div className="setting-control">
              <div className="flex gap-2">
                <select
                  value={config.embeddingModelId || ''}
                  onChange={(e) => handleEmbeddingChange(e.target.value)}
                  disabled={hasFiles}
                  className="px-3 py-2 rounded-lg border border-[var(--td-border-level-1-color)] bg-white text-sm min-w-[280px] disabled:opacity-50"
                >
                  <option value="">{t('knowledgeEditor.models.embeddingPlaceholder', 'Select Embedding Model...')}</option>
                  {embeddingModels.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.name}
                    </option>
                  ))}
                </select>
                {!hasFiles && onAddModel && (
                  <button
                    type="button"
                    onClick={onAddModel}
                    className="px-3 py-2 rounded-lg border border-[var(--td-border-level-1-color)] bg-white text-sm hover:border-[var(--td-brand-color)]"
                  >
                    {t('common.add', 'Add')}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Wiki Synthesis Model */}
        {wikiEnabled && (
          <div className="setting-row">
            <div className="setting-info">
              <label className="font-medium text-sm">
                {t('knowledgeEditor.wiki.synthesisModelLabel', 'Wiki Synthesis Model')}
              </label>
              <p className="text-xs text-[var(--td-text-color-secondary)] mt-0.5">
                {t('knowledgeEditor.wiki.synthesisModelTip', 'Model for synthesizing wiki pages')}
              </p>
            </div>
            <div className="setting-control">
              <div className="flex gap-2">
                <select
                  value={config.wikiSynthesisModelId || ''}
                  onChange={(e) => handleWikiModelChange(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-[var(--td-border-level-1-color)] bg-white text-sm min-w-[280px]"
                >
                  <option value="">{t('knowledgeEditor.wiki.synthesisModelPlaceholder', 'Select Model...')}</option>
                  {llmModels.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.name}
                    </option>
                  ))}
                </select>
                {onAddModel && (
                  <button
                    type="button"
                    onClick={onAddModel}
                    className="px-3 py-2 rounded-lg border border-[var(--td-border-level-1-color)] bg-white text-sm hover:border-[var(--td-brand-color)]"
                  >
                    {t('common.add', 'Add')}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
