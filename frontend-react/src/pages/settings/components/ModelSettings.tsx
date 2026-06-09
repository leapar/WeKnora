import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Plus, Loader2, Link, Desktop, Trash2, Copy, Edit, AlertCircle } from 'lucide-react'
import { listModels, createModel, updateModel, deleteModel, type ModelConfig } from '@/api/model'
import { ModelEditorDialog } from '@/components/ModelEditorDialog'

type ModelType = 'chat' | 'embedding' | 'rerank' | 'vllm' | 'asr'
type FilterType = 'all' | ModelType

interface LegacyModelFormat {
  id: string
  name: string
  source: 'local' | 'remote'
  modelName: string
  baseUrl: string
  apiKey: string
  provider: string
  dimension?: number
  isBuiltin: boolean
  supportsVision: boolean
  customHeaders: { key: string; value: string }[]
  _modelType: ModelType
}

const backendTypeToModelType: Record<string, ModelType> = {
  KnowledgeQA: 'chat',
  Embedding: 'embedding',
  Rerank: 'rerank',
  VLLM: 'vllm',
  ASR: 'asr'
}

function getModelType(type: ModelType): ModelConfig['type'] {
  const typeMap: Record<ModelType, ModelConfig['type']> = {
    chat: 'KnowledgeQA',
    embedding: 'Embedding',
    rerank: 'Rerank',
    vllm: 'VLLM',
    asr: 'ASR'
  }
  return typeMap[type]
}

function convertToLegacyFormat(model: ModelConfig): LegacyModelFormat {
  return {
    id: model.id || '',
    name: model.name,
    source: model.source,
    modelName: model.name,
    baseUrl: model.parameters?.base_url || '',
    apiKey: model.parameters?.api_key || '',
    provider: model.parameters?.provider || '',
    dimension: model.parameters?.embedding_parameters?.dimension,
    isBuiltin: model.is_builtin || false,
    supportsVision: model.parameters?.supports_vision || false,
    customHeaders: model.parameters?.custom_headers
      ? Object.entries(model.parameters.custom_headers).map(([key, value]) => ({ key, value: String(value) }))
      : [],
    _modelType: backendTypeToModelType[model.type] || 'chat'
  }
}

export function ModelSettings() {
  const { t } = useTranslation()
  const [models, setModels] = useState<LegacyModelFormat[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTypeFilter, setActiveTypeFilter] = useState<FilterType>('all')
  const [showDialog, setShowDialog] = useState(false)
  const [currentModelType, setCurrentModelType] = useState<ModelType>('chat')
  const [editingModel, setEditingModel] = useState<any>(null)

  const loadModels = useCallback(async () => {
    setLoading(true)
    try {
      const data = await listModels()
      setModels(data.map(convertToLegacyFormat))
    } catch (error) {
      console.error('Failed to load models:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadModels()
  }, [loadModels])

  const filteredModels = activeTypeFilter === 'all'
    ? models
    : models.filter(m => m._modelType === activeTypeFilter)

  const countByType = (type: ModelType) => models.filter(m => m._modelType === type).length

  const typeLabel = (type: ModelType) => {
    const map: Record<ModelType, string> = {
      chat: t('modelSettings.typeShort.chat'),
      embedding: t('modelSettings.typeShort.embedding'),
      rerank: t('modelSettings.typeShort.rerank'),
      vllm: t('modelSettings.typeShort.vllm'),
      asr: t('modelSettings.typeShort.asr')
    }
    return map[type]
  }

  const sourceLabel = (type: ModelType) => {
    if (type === 'vllm' || type === 'asr') {
      return t('modelSettings.source.openaiCompatible')
    }
    return t('modelSettings.source.remote')
  }

  const openAddDialog = (type: ModelType) => {
    setCurrentModelType(type)
    setEditingModel(null)
    setShowDialog(true)
  }

  const editModel = (model: LegacyModelFormat) => {
    if (model.isBuiltin) {
      alert(t('modelSettings.toasts.builtinCannotEdit'))
      return
    }
    setCurrentModelType(model._modelType)
    setEditingModel(model)
    setShowDialog(true)
  }

  const copyModel = async (model: LegacyModelFormat) => {
    if (model.isBuiltin) {
      alert(t('modelSettings.toasts.builtinCannotCopy'))
      return
    }

    const suffix = t('modelSettings.copySuffix')
    const existingNames = new Set(models.map(m => m.name))
    let candidate = `${model.name}${suffix}`
    let counter = 2
    while (existingNames.has(candidate)) {
      candidate = `${model.name}${suffix} ${counter}`
      counter++
    }

    try {
      const newModelData: ModelConfig = {
        name: candidate,
        type: getModelType(model._modelType),
        source: model.source,
        description: '',
        parameters: {
          base_url: model.baseUrl,
          api_key: model.apiKey,
          provider: model.provider,
          custom_headers: model.customHeaders?.reduce((acc, { key, value }) => {
            if (key && value) acc[key] = value
            return acc
          }, {} as Record<string, string>),
        }
      }

      await createModel(newModelData)
      await loadModels()
    } catch (error: any) {
      alert(error.message || t('modelSettings.toasts.copyFailed'))
    }
  }

  const deleteModelHandler = async (model: LegacyModelFormat) => {
    if (model.isBuiltin) {
      alert(t('modelSettings.toasts.builtinCannotDelete'))
      return
    }

    if (!confirm(t('modelSettings.confirmDelete'))) return

    try {
      await deleteModel(model.id)
      await loadModels()
    } catch (error: any) {
      alert(error.message || t('modelSettings.toasts.deleteFailed'))
    }
  }

  const handleModelSave = async (modelData: any) => {
    try {
      const customHeadersMap: Record<string, string> = {}
      if (Array.isArray(modelData.customHeaders)) {
        for (const item of modelData.customHeaders) {
          const key = (item?.key ?? '').trim()
          const value = (item?.value ?? '').trim()
          if (key && value) {
            customHeadersMap[key] = value
          }
        }
      }

      const apiModelData: ModelConfig = {
        name: modelData.modelName.trim(),
        type: getModelType(currentModelType),
        source: modelData.source,
        description: '',
        parameters: {
          base_url: modelData.baseUrl?.trim() || '',
          api_key: modelData.apiKey?.trim() || '',
          provider: modelData.provider || '',
          ...(Object.keys(customHeadersMap).length > 0 ? { custom_headers: customHeadersMap } : {}),
          ...(currentModelType === 'embedding' && modelData.dimension ? {
            embedding_parameters: {
              dimension: modelData.dimension,
              truncate_prompt_tokens: 0
            }
          } : {}),
          ...(currentModelType === 'vllm' ? {
            supports_vision: true
          } : currentModelType === 'chat' ? {
            supports_vision: modelData.supportsVision ?? false
          } : {})
        }
      }

      if (editingModel && editingModel.id) {
        await updateModel(editingModel.id, apiModelData)
      } else {
        await createModel(apiModelData)
      }

      setShowDialog(false)
      await loadModels()
    } catch (error: any) {
      alert(error.message || t('modelSettings.toasts.saveFailed'))
    }
  }

  const typeTagColors: Record<ModelType, { bg: string; text: string }> = {
    chat: { bg: 'bg-blue-50', text: 'text-blue-600' },
    embedding: { bg: 'bg-purple-50', text: 'text-purple-600' },
    rerank: { bg: 'bg-orange-50', text: 'text-orange-600' },
    vllm: { bg: 'bg-red-50', text: 'text-red-600' },
    asr: { bg: 'bg-green-50', text: 'text-green-600' },
  }

  const tabs: { value: FilterType; label: string }[] = [
    { value: 'all', label: `${t('common.all')}(${models.length})` },
    { value: 'chat', label: `${typeLabel('chat')}(${countByType('chat')})` },
    { value: 'embedding', label: `${typeLabel('embedding')}(${countByType('embedding')})` },
    { value: 'rerank', label: `${typeLabel('rerank')}(${countByType('rerank')})` },
    { value: 'vllm', label: `${typeLabel('vllm')}(${countByType('vllm')})` },
    { value: 'asr', label: `${typeLabel('asr')}(${countByType('asr')})` },
  ]

  const addMenuItems: { value: ModelType; label: string }[] = [
    { value: 'chat', label: typeLabel('chat') },
    { value: 'embedding', label: typeLabel('embedding') },
    { value: 'rerank', label: typeLabel('rerank') },
    { value: 'vllm', label: typeLabel('vllm') },
    { value: 'asr', label: typeLabel('asr') },
  ]

  return (
    <div className="model-settings">
      <div className="mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold mb-1">{t('modelSettings.title')}</h2>
            <p className="text-sm text-[var(--td-text-color-secondary)]">
              {t('modelSettings.description')}
            </p>
          </div>
          <div className="relative group">
            <Button variant="outline" size="sm">
              <Plus size={16} className="mr-1" />
              {t('modelSettings.actions.addModel')}
            </Button>
            <div className="absolute right-0 top-full mt-1 bg-white border border-[var(--td-border-level-1-color)] rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 min-w-[140px]">
              {addMenuItems.map(item => (
                <button
                  key={item.value}
                  onClick={() => openAddDialog(item.value)}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-[var(--td-bg-color-secondarycontainer)] first:rounded-t-lg last:rounded-b-lg"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-[var(--td-bg-color-secondarycontainer)] rounded-lg p-3 mb-4">
          <p className="text-xs font-medium text-[var(--td-text-color-placeholder)] mb-1">
            {t('modelSettings.builtinModels.title')}
          </p>
          <p className="text-sm text-[var(--td-text-color-secondary)] mb-2">
            {t('modelSettings.builtinModels.description')}
          </p>
          <a
            href="https://github.com/Tencent/WeKnora/blob/main/docs/BUILTIN_MODELS.md"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-[var(--td-brand-color)] hover:underline inline-flex items-center gap-1"
          >
            {t('modelSettings.builtinModels.viewGuide')}
            <Link size={12} />
          </a>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[var(--td-border-level-1-color)] mb-6 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.value}
            onClick={() => setActiveTypeFilter(tab.value)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTypeFilter === tab.value
                ? 'border-[var(--td-brand-color)] text-[var(--td-brand-color)]'
                : 'border-transparent text-[var(--td-text-color-secondary)] hover:text-[var(--td-text-color-primary)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Model Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-[var(--td-brand-color)]" size={32} />
        </div>
      ) : filteredModels.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-[var(--td-text-color-placeholder)] mb-4">
            {activeTypeFilter === 'all'
              ? t('modelSettings.chat.empty')
              : activeTypeFilter === 'chat'
              ? t('modelSettings.chat.empty')
              : activeTypeFilter === 'embedding'
              ? t('modelSettings.embedding.empty')
              : activeTypeFilter === 'rerank'
              ? t('modelSettings.rerank.empty')
              : activeTypeFilter === 'vllm'
              ? t('modelSettings.vllm.empty')
              : t('modelSettings.asr.empty')}
          </p>
          <Button variant="outline" onClick={() => openAddDialog(activeTypeFilter === 'all' ? 'chat' : activeTypeFilter as ModelType)}>
            <Plus size={16} className="mr-1" />
            {t('modelSettings.actions.addModel')}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredModels.map(model => (
            <div
              key={`${model._modelType}-${model.id}`}
              className="bg-white rounded-lg border border-[var(--td-border-level-1-color)] p-4 hover:border-[var(--td-brand-color)] transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-medium truncate">{model.name}</h3>
                    {model.isBuiltin && (
                      <span className="px-1.5 py-0.5 text-xs bg-yellow-50 text-yellow-600 rounded">
                        {t('modelSettings.builtinTag')}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-2 py-0.5 text-xs rounded ${typeTagColors[model._modelType].bg} ${typeTagColors[model._modelType].text}`}>
                      {typeLabel(model._modelType)}
                    </span>
                    <span className="px-2 py-0.5 text-xs bg-gray-50 text-gray-600 rounded">
                      {model.source === 'local' ? 'Ollama' : sourceLabel(model._modelType)}
                    </span>
                  </div>
                </div>

                {!model.isBuiltin && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => editModel(model)}
                      className="p-1.5 rounded hover:bg-[var(--td-bg-color-secondarycontainer)] text-[var(--td-text-color-secondary)]"
                      title={t('common.edit')}
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      onClick={() => copyModel(model)}
                      className="p-1.5 rounded hover:bg-[var(--td-bg-color-secondarycontainer)] text-[var(--td-text-color-secondary)]"
                      title={t('common.copy')}
                    >
                      <Copy size={14} />
                    </button>
                    <button
                      onClick={() => deleteModelHandler(model)}
                      className="p-1.5 rounded hover:bg-red-50 text-red-500"
                      title={t('common.delete')}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>

              <div className="text-xs text-[var(--td-text-color-placeholder)] space-y-1">
                {model.baseUrl && (
                  <div className="flex items-center gap-1 truncate">
                    <Link size={10} />
                    <span className="truncate">{model.baseUrl}</span>
                  </div>
                )}
                {!model.baseUrl && model.source === 'local' && (
                  <div className="flex items-center gap-1">
                    <Desktop size={10} />
                    <span>Ollama local</span>
                  </div>
                )}
                {model._modelType === 'embedding' && model.dimension && (
                  <div>Dimension: {model.dimension}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Model Editor Dialog */}
      <ModelEditorDialog
        visible={showDialog}
        modelType={currentModelType}
        modelData={editingModel}
        onClose={() => setShowDialog(false)}
        onConfirm={handleModelSave}
      />
    </div>
  )
}
