import { useTranslation } from 'react-i18next'
import type { ReactNode } from 'react'

export interface IndexingStrategy {
  vectorEnabled: boolean
  keywordEnabled: boolean
  wikiEnabled: boolean
  graphEnabled: boolean
}

interface KBIndexingStrategyProps {
  modelValue: IndexingStrategy
  wikiSettingsSlot?: ReactNode
  graphSettingsSlot?: ReactNode
  onUpdate?: (value: IndexingStrategy) => void
}

export function KBIndexingStrategy({
  modelValue,
  wikiSettingsSlot,
  graphSettingsSlot,
  onUpdate,
}: KBIndexingStrategyProps) {
  const { t } = useTranslation()

  // Search = vector + keyword combined
  const searchEnabled = modelValue.vectorEnabled || modelValue.keywordEnabled

  const handleSearchToggle = () => {
    const newValue = !searchEnabled
    onUpdate?.({
      ...modelValue,
      vectorEnabled: newValue,
      keywordEnabled: newValue,
    })
  }

  const update = (field: keyof IndexingStrategy, value: boolean) => {
    onUpdate?.({
      ...modelValue,
      [field]: value,
    })
  }

  return (
    <div className="kb-multimodal-settings">
      <div className="section-header mb-6">
        <h2 className="text-lg font-medium">
          {t('knowledgeEditor.indexing.title', 'Indexing Strategy')}
        </h2>
        <p className="text-sm text-[var(--td-text-color-secondary)] mt-1">
          {t('knowledgeEditor.indexing.description', 'Configure indexing options for this knowledge base')}
        </p>
      </div>

      <div className="space-y-6">
        {/* Hybrid Search */}
        <div className="setting-row">
          <div className="setting-info">
            <label className="font-medium text-sm">
              {t('knowledgeEditor.indexing.searchTitle', 'Hybrid Search')}
            </label>
            <p className="text-xs text-[var(--td-text-color-secondary)] mt-0.5">
              {t('knowledgeEditor.indexing.searchDesc', 'Combine vector and keyword search for better results')}
            </p>
          </div>
          <div className="setting-control">
            <button
              type="button"
              onClick={handleSearchToggle}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                searchEnabled ? 'bg-[var(--td-brand-color)]' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  searchEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Wiki */}
        <div className="setting-row">
          <div className="setting-info">
            <label className="font-medium text-sm">
              {t('knowledgeEditor.indexing.wikiTitle', 'Wiki Synthesis')}
            </label>
            <p className="text-xs text-[var(--td-text-color-secondary)] mt-0.5">
              {t('knowledgeEditor.indexing.wikiDesc', 'Enable AI-powered wiki page generation from documents')}
            </p>
          </div>
          <div className="setting-control">
            <button
              type="button"
              onClick={() => update('wikiEnabled', !modelValue.wikiEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                modelValue.wikiEnabled ? 'bg-[var(--td-brand-color)]' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  modelValue.wikiEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Wiki Sub-settings */}
        {modelValue.wikiEnabled && wikiSettingsSlot && (
          <div className="ml-4 pl-4 border-l-2 border-[var(--td-brand-color)]">
            {wikiSettingsSlot}
          </div>
        )}

        {/* Knowledge Graph */}
        <div className="setting-row">
          <div className="setting-info">
            <label className="font-medium text-sm">
              {t('knowledgeEditor.indexing.graphTitle', 'Knowledge Graph')}
            </label>
            <p className="text-xs text-[var(--td-text-color-secondary)] mt-0.5">
              {t('knowledgeEditor.indexing.graphDesc', 'Extract entities and relationships for graph-based retrieval')}
            </p>
          </div>
          <div className="setting-control">
            <button
              type="button"
              onClick={() => update('graphEnabled', !modelValue.graphEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                modelValue.graphEnabled ? 'bg-[var(--td-brand-color)]' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  modelValue.graphEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Graph Sub-settings */}
        {modelValue.graphEnabled && graphSettingsSlot && (
          <div className="ml-4 pl-4 border-l-2 border-[var(--td-brand-color)]">
            {graphSettingsSlot}
          </div>
        )}
      </div>
    </div>
  )
}
