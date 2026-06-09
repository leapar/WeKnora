import { useState, useEffect, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertCircle, Loader2 } from 'lucide-react'
import { ModelSelector } from '@/components/ModelSelector'
import { getTenantRetrievalConfig, updateTenantRetrievalConfig, type RetrievalConfig } from '@/api/retrieval'
import { listModels } from '@/api/model'

const defaultConfig: RetrievalConfig = {
  embedding_top_k: 50,
  vector_threshold: 0.15,
  keyword_threshold: 0.3,
  rerank_top_k: 10,
  rerank_threshold: 0.2,
  rerank_model_id: '',
}

export function RetrievalSettings() {
  const { t } = useTranslation()
  const [config, setConfig] = useState<RetrievalConfig>({ ...defaultConfig })
  const [initialConfig, setInitialConfig] = useState<RetrievalConfig>({ ...defaultConfig })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const saveTimerRef = useRef<number | null>(null)
  const isInitializingRef = useRef(true)

  const loadConfig = useCallback(async () => {
    try {
      const response = await getTenantRetrievalConfig()
      if (response.success && response.data) {
        const cfg = response.data
        const newConfig: RetrievalConfig = {
          embedding_top_k: cfg.embedding_top_k || defaultConfig.embedding_top_k,
          vector_threshold: cfg.vector_threshold ?? defaultConfig.vector_threshold,
          keyword_threshold: cfg.keyword_threshold ?? defaultConfig.keyword_threshold,
          rerank_top_k: cfg.rerank_top_k || defaultConfig.rerank_top_k,
          rerank_threshold: cfg.rerank_threshold ?? defaultConfig.rerank_threshold,
          rerank_model_id: cfg.rerank_model_id || '',
        }
        setConfig(newConfig)
        setInitialConfig(newConfig)
      }
    } catch (error) {
      console.error('Failed to load retrieval config:', error)
    } finally {
      setLoading(false)
      setTimeout(() => {
        isInitializingRef.current = false
      }, 100)
    }
  }, [])

  useEffect(() => {
    loadConfig()
  }, [loadConfig])

  const hasConfigChanged = useCallback(() => {
    return JSON.stringify(config) !== JSON.stringify(initialConfig)
  }, [config, initialConfig])

  const saveConfig = useCallback(async () => {
    if (!hasConfigChanged()) return
    setSaving(true)
    setSaveError(null)
    try {
      const response = await updateTenantRetrievalConfig({ ...config })
      if (response.success) {
        setInitialConfig({ ...config })
      } else {
        setSaveError(response.message || 'Failed to save')
      }
    } catch (error: any) {
      setSaveError(error.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }, [config, hasConfigChanged])

  const debouncedSave = useCallback(() => {
    if (isInitializingRef.current) return
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
    }
    saveTimerRef.current = window.setTimeout(() => {
      saveConfig()
    }, 500)
  }, [saveConfig])

  const handleParamChange = useCallback((key: keyof RetrievalConfig, value: number) => {
    setConfig(prev => ({ ...prev, [key]: value }))
    debouncedSave()
  }, [debouncedSave])

  const handleModelChange = useCallback((modelId: string) => {
    setConfig(prev => ({ ...prev, rerank_model_id: modelId }))
    debouncedSave()
  }, [debouncedSave])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-[var(--td-brand-color)]" size={32} />
      </div>
    )
  }

  return (
    <div className="retrieval-settings">
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-1">{t('retrievalSettings.title')}</h2>
        <p className="text-sm text-[var(--td-text-color-secondary)]">
          {t('retrievalSettings.description')}
        </p>
      </div>

      {saveError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-600 text-sm">
          <AlertCircle size={16} />
          {saveError}
        </div>
      )}

      <div className="space-y-0">
        {/* Rerank Model */}
        <div className="py-4 border-b border-[var(--td-border-level-1-color)]">
          <div className="mb-2">
            <label className="text-sm font-medium">
              {t('retrievalSettings.rerankModelLabel')} <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-[var(--td-text-color-secondary)] mt-0.5">
              {t('retrievalSettings.rerankModelDescription')}
            </p>
            {!config.rerank_model_id && (
              <p className="text-xs text-yellow-600 mt-1">
                {t('retrievalSettings.rerankModelRequired')}
              </p>
            )}
          </div>
          <ModelSelector
            modelType="Rerank"
            selectedModelId={config.rerank_model_id}
            onChange={handleModelChange}
          />
        </div>

        {/* Embedding Top K */}
        <div className="py-4 border-b border-[var(--td-border-level-1-color)]">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium">{t('retrievalSettings.embeddingTopKLabel')}</label>
            <span className="text-sm font-semibold text-[var(--td-brand-color)]">{config.embedding_top_k}</span>
          </div>
          <input
            type="range"
            min={1}
            max={100}
            step={1}
            value={config.embedding_top_k}
            onChange={(e) => handleParamChange('embedding_top_k', parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[var(--td-brand-color)]"
          />
          <div className="flex justify-between text-xs text-[var(--td-text-color-placeholder)] mt-1">
            <span>1</span>
            <span>100</span>
          </div>
        </div>

        {/* Vector Threshold */}
        <div className="py-4 border-b border-[var(--td-border-level-1-color)]">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium">{t('retrievalSettings.vectorThresholdLabel')}</label>
            <span className="text-sm font-semibold text-[var(--td-brand-color)]">{config.vector_threshold.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={config.vector_threshold}
            onChange={(e) => handleParamChange('vector_threshold', parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[var(--td-brand-color)]"
          />
          <div className="flex justify-between text-xs text-[var(--td-text-color-placeholder)] mt-1">
            <span>0</span>
            <span>1</span>
          </div>
        </div>

        {/* Keyword Threshold */}
        <div className="py-4 border-b border-[var(--td-border-level-1-color)]">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium">{t('retrievalSettings.keywordThresholdLabel')}</label>
            <span className="text-sm font-semibold text-[var(--td-brand-color)]">{config.keyword_threshold.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={config.keyword_threshold}
            onChange={(e) => handleParamChange('keyword_threshold', parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[var(--td-brand-color)]"
          />
          <div className="flex justify-between text-xs text-[var(--td-text-color-placeholder)] mt-1">
            <span>0</span>
            <span>1</span>
          </div>
        </div>

        {/* Rerank Top K */}
        <div className="py-4 border-b border-[var(--td-border-level-1-color)]">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium">{t('retrievalSettings.rerankTopKLabel')}</label>
            <span className="text-sm font-semibold text-[var(--td-brand-color)]">{config.rerank_top_k}</span>
          </div>
          <input
            type="range"
            min={1}
            max={100}
            step={1}
            value={config.rerank_top_k}
            onChange={(e) => handleParamChange('rerank_top_k', parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[var(--td-brand-color)]"
          />
          <div className="flex justify-between text-xs text-[var(--td-text-color-placeholder)] mt-1">
            <span>1</span>
            <span>100</span>
          </div>
        </div>

        {/* Rerank Threshold */}
        <div className="py-4">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium">{t('retrievalSettings.rerankThresholdLabel')}</label>
            <span className="text-sm font-semibold text-[var(--td-brand-color)]">{config.rerank_threshold.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min={-10}
            max={10}
            step={0.1}
            value={config.rerank_threshold}
            onChange={(e) => handleParamChange('rerank_threshold', parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[var(--td-brand-color)]"
          />
          <div className="flex justify-between text-xs text-[var(--td-text-color-placeholder)] mt-1">
            <span>-10</span>
            <span>10</span>
          </div>
        </div>
      </div>
    </div>
  )
}
