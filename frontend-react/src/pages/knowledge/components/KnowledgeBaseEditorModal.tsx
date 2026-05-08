import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { X, Loader2, Info, Settings, FileSearch, Cloud, FileCopy, Image, Volume2, BarChart3, CloudDownload, Share2, HelpCircle, Gauge } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { KBModelConfig } from './KBModelConfig'
import { KBParserSettings } from './KBParserSettings'
import { KBStorageSettings } from './KBStorageSettings'
import { KBChunkingSettings } from './KBChunkingSettings'
import { KBAdvancedSettings } from './KBAdvancedSettings'
import { GraphSettings } from './GraphSettings'
import { KBShareSettings } from './KBShareSettings'
import { DataSourceSettings } from './DataSourceSettings'

interface KnowledgeBaseEditorModalProps {
  visible: boolean
  mode: 'create' | 'edit'
  kbId?: string
  initialType?: 'document' | 'faq'
  onClose: () => void
  onSuccess: (kbId: string) => void
}

interface FormData {
  type: 'document' | 'faq'
  name: string
  description: string
  faqConfig: {
    indexMode: 'question_only' | 'question_answer'
    questionIndexMode: 'combined' | 'separate'
  }
  modelConfig: {
    llmModelId: string
    embeddingModelId: string
    wikiSynthesisModelId: string
  }
  chunkingConfig: {
    chunkSize: number
    chunkOverlap: number
    separators: string[]
    parserEngineRules?: any[]
    enableParentChild: boolean
    parentChunkSize: number
    childChunkSize: number
    strategy: string
    tokenLimit: number
    languages: string[]
  }
  storageProvider: string
  multimodalConfig: {
    enabled: boolean
    vllmModelId: string
  }
  asrConfig: {
    enabled: boolean
    modelId: string
    language: string
  }
  nodeExtractConfig: {
    enabled: boolean
    text: string
    tags: string[]
    nodes: Array<{ name: string; attributes: string[] }>
    relations: Array<{ node1: string; node2: string; type: string }>
  }
  questionGenerationConfig: {
    enabled: boolean
    questionCount: number
  }
  wikiConfig: {
    synthesisModelId: string
    maxPagesPerIngest: number
    extractionGranularity: 'focused' | 'standard' | 'exhaustive'
  }
  indexingStrategy: {
    vectorEnabled: boolean
    keywordEnabled: boolean
    wikiEnabled: boolean
    graphEnabled: boolean
  }
}

const DEFAULT_FORM_DATA: FormData = {
  type: 'document',
  name: '',
  description: '',
  faqConfig: {
    indexMode: 'question_only',
    questionIndexMode: 'separate',
  },
  modelConfig: {
    llmModelId: '',
    embeddingModelId: '',
    wikiSynthesisModelId: '',
  },
  chunkingConfig: {
    chunkSize: 512,
    chunkOverlap: 80,
    separators: ['\n\n', '\n', '。', '！', '？', ';', '；'],
    parserEngineRules: undefined,
    enableParentChild: true,
    parentChunkSize: 4096,
    childChunkSize: 384,
    strategy: 'auto',
    tokenLimit: 0,
    languages: [],
  },
  storageProvider: '',
  multimodalConfig: {
    enabled: false,
    vllmModelId: '',
  },
  asrConfig: {
    enabled: false,
    modelId: '',
    language: '',
  },
  nodeExtractConfig: {
    enabled: false,
    text: '',
    tags: [],
    nodes: [],
    relations: [],
  },
  questionGenerationConfig: {
    enabled: true,
    questionCount: 3,
  },
  wikiConfig: {
    synthesisModelId: '',
    maxPagesPerIngest: 0,
    extractionGranularity: 'standard',
  },
  indexingStrategy: {
    vectorEnabled: true,
    keywordEnabled: true,
    wikiEnabled: false,
    graphEnabled: false,
  },
}

const NAV_ITEMS = [
  { key: 'basic', icon: 'info-circle', labelKey: 'knowledgeEditor.sidebar.basic' },
  { key: 'models', icon: 'control-platform', labelKey: 'knowledgeEditor.sidebar.models' },
  { key: 'parser', icon: 'file-search', labelKey: 'settings.parserEngine' },
  { key: 'storage', icon: 'cloud', labelKey: 'knowledgeEditor.sidebar.storage' },
  { key: 'chunking', icon: 'file-copy', labelKey: 'knowledgeEditor.sidebar.chunking' },
  { key: 'multimodal', icon: 'image', labelKey: 'knowledgeEditor.sidebar.multimodal' },
  { key: 'asr', icon: 'sound', labelKey: 'knowledgeEditor.sidebar.asr' },
  { key: 'graph', icon: 'chart-bubble', labelKey: 'knowledgeEditor.sidebar.graph' },
  { key: 'advanced', icon: 'setting', labelKey: 'knowledgeEditor.sidebar.advanced' },
  { key: 'datasource', icon: 'cloud-download', labelKey: 'knowledgeEditor.sidebar.datasource' },
  { key: 'share', icon: 'share', labelKey: 'knowledgeEditor.sidebar.share' },
]

export function KnowledgeBaseEditorModal({
  visible,
  mode,
  kbId,
  initialType = 'document',
  onClose,
  onSuccess,
}: KnowledgeBaseEditorModalProps) {
  const { t } = useTranslation()
  const [currentSection, setCurrentSection] = useState('basic')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)
  const [dsCount, setDsCount] = useState(0)
  const [formData, setFormData] = useState<FormData>(DEFAULT_FORM_DATA)

  const isFAQ = formData.type === 'faq'
  const hasFiles = false // In production, this would come from API

  // Get nav items based on current state
  const navItems = NAV_ITEMS.filter(item => {
    // FAQ type only shows basic, models, faq sections
    if (isFAQ && !['basic', 'models', 'faq'].includes(item.key)) {
      return false
    }
    // datasource and share only in edit mode
    if ((item.key === 'datasource' || item.key === 'share') && mode !== 'edit') {
      return false
    }
    return true
  })

  // Add FAQ nav item for FAQ type
  if (isFAQ && !navItems.find(item => item.key === 'faq')) {
    navItems.splice(2, 0, { key: 'faq', icon: 'help-circle', labelKey: 'knowledgeEditor.sidebar.faq' })
  }

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!visible) {
      setCurrentSection('basic')
      setFormData(DEFAULT_FORM_DATA)
      return
    }

    // Initialize form data
    if (mode === 'edit' && kbId) {
      // In production, load KB data from API
      setLoading(true)
      // simulate loading
      setTimeout(() => {
        setFormData({
          ...DEFAULT_FORM_DATA,
          type: initialType,
        })
        setLoading(false)
      }, 500)
    } else {
      setFormData({
        ...DEFAULT_FORM_DATA,
        type: initialType,
      })
    }
  }, [visible, mode, kbId, initialType])

  const handleFormDataUpdate = useCallback((updates: Partial<FormData>) => {
    setFormData(prev => ({ ...prev, ...updates }))
  }, [])

  const handleChunkingConfigUpdate = useCallback((config: Partial<FormData['chunkingConfig']>) => {
    setFormData(prev => ({
      ...prev,
      chunkingConfig: { ...prev.chunkingConfig, ...config },
    }))
  }, [])

  const handleModelConfigUpdate = useCallback((config: Partial<FormData['modelConfig']>) => {
    setFormData(prev => ({
      ...prev,
      modelConfig: { ...prev.modelConfig, ...config },
    }))
  }, [])

  const handleStorageProviderUpdate = useCallback((provider: string) => {
    setFormData(prev => ({ ...prev, storageProvider: provider || 'local' }))
  }, [])

  const handleMultimodalToggle = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      multimodalConfig: {
        ...prev.multimodalConfig,
        enabled: !prev.multimodalConfig.enabled,
        vllmModelId: !prev.multimodalConfig.enabled ? prev.multimodalConfig.vllmModelId : '',
      },
    }))
  }, [])

  const handleNodeExtractUpdate = useCallback((config: Partial<FormData['nodeExtractConfig']>) => {
    setFormData(prev => ({
      ...prev,
      nodeExtractConfig: { ...prev.nodeExtractConfig, ...config },
    }))
  }, [])

  const handleQuestionGenerationUpdate = useCallback((config: Partial<FormData['questionGenerationConfig']>) => {
    setFormData(prev => ({
      ...prev,
      questionGenerationConfig: { ...prev.questionGenerationConfig, ...config },
    }))
  }, [])

  const toggleVectorIndexing = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      indexingStrategy: {
        ...prev.indexingStrategy,
        vectorEnabled: !prev.indexingStrategy.vectorEnabled,
        keywordEnabled: !prev.indexingStrategy.vectorEnabled, // They toggle together
      },
    }))
  }, [])

  const toggleWikiIndexing = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      indexingStrategy: {
        ...prev.indexingStrategy,
        wikiEnabled: !prev.indexingStrategy.wikiEnabled,
      },
    }))
  }, [])

  const handleGranularityChange = useCallback((value: string) => {
    const next = value === 'focused' || value === 'exhaustive'
      ? value as 'focused' | 'exhaustive'
      : 'standard'
    setFormData(prev => ({
      ...prev,
      wikiConfig: {
        ...prev.wikiConfig,
        extractionGranularity: next,
      },
    }))
  }, [])

  const handleSubmit = useCallback(async () => {
    // Validate form
    if (!formData.name.trim()) {
      alert(t('knowledgeEditor.messages.nameRequired', 'Name is required'))
      setCurrentSection('basic')
      return
    }

    // Validate indexing strategy
    if (!isFAQ) {
      const s = formData.indexingStrategy
      if (!s.vectorEnabled && !s.keywordEnabled && !s.wikiEnabled && !s.graphEnabled) {
        alert(t('knowledgeEditor.indexing.atLeastOne', 'At least one indexing strategy must be enabled'))
        setCurrentSection('basic')
        return
      }
    }

    // Validate models
    const needsEmbedding = formData.indexingStrategy?.vectorEnabled || formData.indexingStrategy?.keywordEnabled
    if (needsEmbedding && !formData.modelConfig.embeddingModelId) {
      alert(t('knowledgeEditor.indexing.embeddingRequired', 'Embedding model is required when search is enabled'))
      setCurrentSection('models')
      return
    }

    if (!formData.modelConfig.llmModelId) {
      alert(t('knowledgeEditor.messages.summaryRequired', 'LLM model is required'))
      setCurrentSection('models')
      return
    }

    // Validate multimodal
    if (formData.multimodalConfig.enabled && !formData.multimodalConfig.vllmModelId) {
      alert(t('knowledgeEditor.messages.multimodalInvalid', 'VLLM model is required when multimodal is enabled'))
      setCurrentSection('multimodal')
      return
    }

    setSaving(true)
    try {
      // In production, call API to create/update KB
      console.log('Submitting form data:', formData)
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call

      const resultId = mode === 'edit' && kbId ? kbId : 'new-kb-id'
      alert(mode === 'edit' ? t('knowledgeEditor.messages.updateSuccess', 'Knowledge base updated') : t('knowledgeEditor.messages.createSuccess', 'Knowledge base created'))
      onSuccess(resultId)
      onClose()
    } catch (e: any) {
      alert(t('common.operationFailed', 'Operation failed') + ': ' + (e?.message || ''))
    }
    setSaving(false)
  }, [formData, isFAQ, mode, kbId, onSuccess, onClose, t])

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-50 w-full max-w-[1000px] h-[85vh] max-h-[750px] bg-white rounded-xl shadow-lg flex flex-col overflow-hidden">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-md bg-[var(--td-bg-color-secondarycontainer)] hover:bg-[var(--td-bg-color-secondarycontainer)] transition-colors z-10"
          aria-label={t('common.close', 'Close')}
        >
          <X size={18} />
        </button>

        {/* Container */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-[200px] bg-[var(--td-bg-color-settings-modal)] border-r border-[var(--td-component-stroke)] flex-shrink-0">
            <div className="p-6 border-b border-[var(--td-component-stroke)]">
              <h2 className="text-lg font-semibold">
                {mode === 'create' ? t('knowledgeEditor.titleCreate', 'Create Knowledge Base') : t('knowledgeEditor.titleEdit', 'Edit Knowledge Base')}
              </h2>
            </div>
            <nav className="flex-1 p-3 overflow-y-auto">
              {navItems.map(item => (
                <div
                  key={item.key}
                  onClick={() => setCurrentSection(item.key)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-md cursor-pointer transition-colors mb-1 text-sm ${
                    currentSection === item.key
                      ? 'bg-[var(--td-brand-color-light)] text-[var(--td-brand-color)] font-medium'
                      : 'text-[var(--td-text-color-secondary)] hover:bg-[var(--td-bg-color-secondarycontainer-hover)] hover:text-[var(--td-text-color-primary)]'
                  }`}
                >
                  <span className="text-lg">{getIcon(item.icon)}</span>
                  <span className="flex-1">{t(item.labelKey)}</span>
                  {item.key === 'datasource' && dsCount > 0 && (
                    <span className="text-xs bg-[var(--td-bg-color-component)] px-1.5 py-0.5 rounded-full">{dsCount}</span>
                  )}
                </div>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="animate-spin text-[var(--td-brand-color)]" size={32} />
                </div>
              ) : (
                <>
                  {/* Basic Section */}
                  {currentSection === 'basic' && (
                    <div className="space-y-6">
                      <div className="section-header mb-6">
                        <h2 className="text-xl font-semibold">{t('knowledgeEditor.basic.title', 'Basic Information')}</h2>
                        <p className="text-sm text-[var(--td-text-color-secondary)] mt-1">
                          {t('knowledgeEditor.basic.description', 'Configure basic settings for your knowledge base')}
                        </p>
                      </div>

                      {/* Type */}
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          {t('knowledgeEditor.basic.typeLabel', 'Type')} <span className="text-red-500">*</span>
                        </label>
                        <div className="flex gap-3">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="kb-type"
                              value="document"
                              checked={formData.type === 'document'}
                              onChange={() => handleFormDataUpdate({ type: 'document' })}
                              disabled={mode === 'edit'}
                            />
                            <span className="text-sm">{t('knowledgeEditor.basic.typeDocument', 'Document')}</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="kb-type"
                              value="faq"
                              checked={formData.type === 'faq'}
                              onChange={() => handleFormDataUpdate({ type: 'faq' })}
                              disabled={mode === 'edit'}
                            />
                            <span className="text-sm">{t('knowledgeEditor.basic.typeFAQ', 'FAQ')}</span>
                          </label>
                        </div>
                        <p className="text-xs text-[var(--td-text-color-placeholder)] mt-1">
                          {t('knowledgeEditor.basic.typeDescription', 'Document type supports rich content; FAQ type is for question-answer pairs')}
                        </p>
                      </div>

                      {/* Indexing Strategy (only for document type) */}
                      {!isFAQ && (
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            {t('knowledgeEditor.indexing.title', 'Indexing Strategy')} <span className="text-red-500">*</span>
                          </label>
                          <p className="text-xs text-[var(--td-text-color-placeholder)] mb-2">
                            {t('knowledgeEditor.indexing.description', 'Select how content will be indexed and retrieved')}
                          </p>
                          <div className="grid grid-cols-2 gap-3">
                            <div
                              onClick={toggleVectorIndexing}
                              className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                                formData.indexingStrategy.vectorEnabled
                                  ? 'border-[var(--td-brand-color)] bg-[var(--td-brand-color-light)]'
                                  : 'border-[var(--td-component-stroke)] hover:border-[var(--td-brand-color)]'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <Checkbox checked={formData.indexingStrategy.vectorEnabled} className="pointer-events-none" />
                                <span className="text-sm font-medium">{t('knowledgeEditor.indexing.searchTitle', 'Vector Search')}</span>
                              </div>
                              <p className="text-xs text-[var(--td-text-color-placeholder)] mt-1 ml-6">
                                {t('knowledgeEditor.indexing.searchDesc', 'Semantic search using embeddings')}
                              </p>
                            </div>
                            <div
                              onClick={toggleWikiIndexing}
                              className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                                formData.indexingStrategy.wikiEnabled
                                  ? 'border-[var(--td-brand-color)] bg-[var(--td-brand-color-light)]'
                                  : 'border-[var(--td-component-stroke)] hover:border-[var(--td-brand-color)]'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <Checkbox checked={formData.indexingStrategy.wikiEnabled} className="pointer-events-none" />
                                <span className="text-sm font-medium">
                                  {t('knowledgeEditor.indexing.wikiTitle', 'Wiki Index')}
                                  <span className="ml-1.5 text-[10px] bg-[var(--td-brand-color-light)] text-[var(--td-brand-color)] px-1.5 py-0.5 rounded font-medium">NEW</span>
                                </span>
                              </div>
                              <p className="text-xs text-[var(--td-text-color-placeholder)] mt-1 ml-6">
                                {t('knowledgeEditor.indexing.wikiDesc', 'Enhanced wiki parsing and retrieval')}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Wiki extraction granularity (only when wiki enabled) */}
                      {!isFAQ && formData.indexingStrategy.wikiEnabled && (
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            {t('knowledgeEditor.wiki.extractionGranularityLabel', 'Wiki Extraction Granularity')}
                          </label>
                          <div className="flex gap-3">
                            {(['focused', 'standard', 'exhaustive'] as const).map(g => (
                              <label key={g} className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="radio"
                                  name="granularity"
                                  value={g}
                                  checked={formData.wikiConfig.extractionGranularity === g}
                                  onChange={() => handleGranularityChange(g)}
                                />
                                <span className="text-sm">{t(`knowledgeEditor.wiki.granularity${g.charAt(0).toUpperCase() + g.slice(1)}`, g)}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Name */}
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          {t('knowledgeEditor.basic.nameLabel', 'Name')} <span className="text-red-500">*</span>
                        </label>
                        <Input
                          value={formData.name}
                          onChange={e => handleFormDataUpdate({ name: e.target.value })}
                          placeholder={t('knowledgeEditor.basic.namePlaceholder', 'Enter knowledge base name')}
                          maxLength={50}
                        />
                      </div>

                      {/* Description */}
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          {t('knowledgeEditor.basic.descriptionLabel', 'Description')}
                        </label>
                        <Textarea
                          value={formData.description}
                          onChange={e => handleFormDataUpdate({ description: e.target.value })}
                          placeholder={t('knowledgeEditor.basic.descriptionPlaceholder', 'Enter description')}
                          maxLength={200}
                          rows={3}
                        />
                      </div>
                    </div>
                  )}

                  {/* Models Section */}
                  {currentSection === 'models' && (
                    <KBModelConfig
                      config={formData.modelConfig}
                      hasFiles={hasFiles}
                      wikiEnabled={formData.indexingStrategy.wikiEnabled}
                      ragEnabled={formData.indexingStrategy.vectorEnabled || formData.indexingStrategy.keywordEnabled}
                      allModels={[]}
                      onUpdate={handleModelConfigUpdate}
                    />
                  )}

                  {/* FAQ Section (only for FAQ type) */}
                  {currentSection === 'faq' && isFAQ && (
                    <div className="space-y-6">
                      <div className="section-header mb-6">
                        <h2 className="text-xl font-semibold">{t('knowledgeEditor.faq.title', 'FAQ Settings')}</h2>
                        <p className="text-sm text-[var(--td-text-color-secondary)] mt-1">
                          {t('knowledgeEditor.faq.description', 'Configure FAQ indexing behavior')}
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">
                          {t('knowledgeEditor.faq.indexModeLabel', 'Index Mode')} <span className="text-red-500">*</span>
                        </label>
                        <div className="flex gap-3">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="faq-index-mode"
                              value="question_only"
                              checked={formData.faqConfig.indexMode === 'question_only'}
                              onChange={() => setFormData(prev => ({ ...prev, faqConfig: { ...prev.faqConfig, indexMode: 'question_only' } }))}
                            />
                            <span className="text-sm">{t('knowledgeEditor.faq.modes.questionOnly', 'Question Only')}</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="faq-index-mode"
                              value="question_answer"
                              checked={formData.faqConfig.indexMode === 'question_answer'}
                              onChange={() => setFormData(prev => ({ ...prev, faqConfig: { ...prev.faqConfig, indexMode: 'question_answer' } }))}
                            />
                            <span className="text-sm">{t('knowledgeEditor.faq.modes.questionAnswer', 'Question & Answer')}</span>
                          </label>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">
                          {t('knowledgeEditor.faq.questionIndexModeLabel', 'Question Index Mode')} <span className="text-red-500">*</span>
                        </label>
                        <div className="flex gap-3">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="faq-question-index-mode"
                              value="combined"
                              checked={formData.faqConfig.questionIndexMode === 'combined'}
                              onChange={() => setFormData(prev => ({ ...prev, faqConfig: { ...prev.faqConfig, questionIndexMode: 'combined' } }))}
                            />
                            <span className="text-sm">{t('knowledgeEditor.faq.modes.combined', 'Combined')}</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="faq-question-index-mode"
                              value="separate"
                              checked={formData.faqConfig.questionIndexMode === 'separate'}
                              onChange={() => setFormData(prev => ({ ...prev, faqConfig: { ...prev.faqConfig, questionIndexMode: 'separate' } }))}
                            />
                            <span className="text-sm">{t('knowledgeEditor.faq.modes.separate', 'Separate')}</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Parser Section */}
                  {currentSection === 'parser' && !isFAQ && (
                    <KBParserSettings
                      parserEngineRules={formData.chunkingConfig.parserEngineRules}
                      onUpdate={(rules) => handleChunkingConfigUpdate({ parserEngineRules: rules })}
                    />
                  )}

                  {/* Storage Section */}
                  {currentSection === 'storage' && !isFAQ && (
                    <KBStorageSettings
                      storageProvider={formData.storageProvider}
                      hasFiles={mode === 'edit' && hasFiles}
                      onUpdate={handleStorageProviderUpdate}
                    />
                  )}

                  {/* Chunking Section */}
                  {currentSection === 'chunking' && !isFAQ && (
                    <KBChunkingSettings
                      config={formData.chunkingConfig}
                      onUpdate={handleChunkingConfigUpdate}
                    />
                  )}

                  {/* Multimodal Section */}
                  {currentSection === 'multimodal' && !isFAQ && (
                    <div className="space-y-6">
                      <div className="section-header mb-6">
                        <h2 className="text-xl font-semibold">{t('knowledgeEditor.multimodal.title', 'Multimodal Settings')}</h2>
                        <p className="text-sm text-[var(--td-text-color-secondary)] mt-1">
                          {t('knowledgeEditor.multimodal.description', 'Configure multimodal content processing')}
                        </p>
                      </div>

                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <label className="text-sm font-medium">{t('knowledgeEditor.advanced.multimodal.label', 'Enable Multimodal')}</label>
                          <p className="text-xs text-[var(--td-text-color-secondary)] mt-0.5">
                            {t('knowledgeEditor.advanced.multimodal.description', 'Process images and videos in documents')}
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={formData.multimodalConfig.enabled}
                          onChange={handleMultimodalToggle}
                          className="w-4 h-4"
                        />
                      </div>

                      {formData.multimodalConfig.enabled && (
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            {t('knowledgeEditor.advanced.multimodal.vllmLabel', 'VLLM Model')} <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={formData.multimodalConfig.vllmModelId}
                            onChange={e => setFormData(prev => ({
                              ...prev,
                              multimodalConfig: { ...prev.multimodalConfig, vllmModelId: e.target.value }
                            }))}
                            className="w-full rounded border border-[var(--td-border-level-1-color)] px-3 py-2 text-sm focus:outline-none focus:border-[var(--td-brand-color)]"
                          >
                            <option value="">Select VLLM model...</option>
                          </select>
                          <p className="text-xs text-[var(--td-text-color-placeholder)] mt-1">
                            {t('knowledgeEditor.advanced.multimodal.vllmDescription', 'Vision-language model for image understanding')}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ASR Section */}
                  {currentSection === 'asr' && !isFAQ && (
                    <div className="space-y-6">
                      <div className="section-header mb-6">
                        <h2 className="text-xl font-semibold">{t('knowledgeEditor.asr.title', 'Audio Processing')}</h2>
                        <p className="text-sm text-[var(--td-text-color-secondary)] mt-1">
                          {t('knowledgeEditor.asr.description', 'Configure automatic speech recognition for audio files')}
                        </p>
                      </div>

                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <label className="text-sm font-medium">{t('knowledgeEditor.asr.label', 'Enable ASR')}</label>
                          <p className="text-xs text-[var(--td-text-color-secondary)] mt-0.5">
                            {t('knowledgeEditor.asr.desc', 'Transcribe audio to text')}
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={formData.asrConfig.enabled}
                          onChange={e => setFormData(prev => ({
                            ...prev,
                            asrConfig: { ...prev.asrConfig, enabled: e.target.checked }
                          }))}
                          className="w-4 h-4"
                        />
                      </div>

                      {formData.asrConfig.enabled && (
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            {t('knowledgeEditor.asr.modelLabel', 'ASR Model')} <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={formData.asrConfig.modelId}
                            onChange={e => setFormData(prev => ({
                              ...prev,
                              asrConfig: { ...prev.asrConfig, modelId: e.target.value }
                            }))}
                            className="w-full rounded border border-[var(--td-border-level-1-color)] px-3 py-2 text-sm focus:outline-none focus:border-[var(--td-brand-color)]"
                          >
                            <option value="">Select ASR model...</option>
                          </select>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Graph Section */}
                  {currentSection === 'graph' && !isFAQ && (
                    <GraphSettings
                      config={formData.nodeExtractConfig}
                      onUpdate={handleNodeExtractUpdate}
                    />
                  )}

                  {/* Advanced Section */}
                  {currentSection === 'advanced' && !isFAQ && (
                    <KBAdvancedSettings
                      questionGeneration={formData.questionGenerationConfig}
                      ragEnabled={formData.indexingStrategy.vectorEnabled || formData.indexingStrategy.keywordEnabled}
                      allModels={[]}
                      onUpdate={handleQuestionGenerationUpdate}
                    />
                  )}

                  {/* Datasource Section */}
                  {currentSection === 'datasource' && mode === 'edit' && kbId && (
                    <DataSourceSettings kbId={kbId} onCountChange={setDsCount} />
                  )}

                  {/* Share Section */}
                  {currentSection === 'share' && mode === 'edit' && kbId && (
                    <KBShareSettings kbId={kbId} />
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 p-4 border-t border-[var(--td-component-stroke)]">
              <Button variant="outline" onClick={onClose}>
                {t('common.cancel', 'Cancel')}
              </Button>
              <Button onClick={handleSubmit} disabled={saving}>
                {saving && <Loader2 size={14} className="animate-spin mr-2" />}
                {mode === 'create' ? t('knowledgeEditor.buttons.create', 'Create') : t('knowledgeEditor.buttons.save', 'Save')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function getIcon(iconName: string) {
  const icons: Record<string, React.ReactNode> = {
    'info-circle': <Info size={18} />,
    'control-platform': <Gauge size={18} />,
    'file-search': <FileSearch size={18} />,
    'cloud': <Cloud size={18} />,
    'file-copy': <FileCopy size={18} />,
    'image': <Image size={18} />,
    'sound': <Volume2 size={18} />,
    'chart-bubble': <BarChart3 size={18} />,
    'setting': <Settings size={18} />,
    'cloud-download': <CloudDownload size={18} />,
    'share': <Share2 size={18} />,
    'help-circle': <HelpCircle size={18} />,
  }
  return icons[iconName] || <Info size={18} />
}