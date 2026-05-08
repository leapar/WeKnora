import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Select } from '@/components/ui/select'
import type { SelectProps } from '@/components/ui/select'

interface ModelConfig {
  id: string
  name: string
  type: 'KnowledgeQA' | 'Embedding' | 'Rerank' | 'VLLM' | 'ASR'
  source: 'local' | 'remote'
  description?: string
  is_default?: boolean
  is_builtin?: boolean
  parameters?: {
    provider?: string
  }
}

interface ModelSelectorProps {
  modelType: 'KnowledgeQA' | 'Embedding' | 'Rerank' | 'VLLM' | 'ASR'
  selectedModelId?: string
  disabled?: boolean
  placeholder?: string
  allModels?: ModelConfig[]
  onChange: (modelId: string) => void
  onAddModel?: () => void
}

export function ModelSelector({
  modelType,
  selectedModelId,
  disabled = false,
  placeholder,
  allModels,
  onChange,
  onAddModel,
}: ModelSelectorProps) {
  const { t } = useTranslation()
  const [models, setModels] = useState<ModelConfig[]>([])
  const [loading, setLoading] = useState(false)

  const placeholderText = placeholder || t('model.selectModelPlaceholder')

  // Load models from API or use provided allModels
  useEffect(() => {
    if (allModels && Array.isArray(allModels)) {
      setModels(allModels.filter(m => m.type === modelType))
    } else {
      loadModels()
    }
  }, [allModels, modelType])

  const loadModels = async () => {
    setLoading(true)
    try {
      // In a real implementation, this would call the API
      // const result = await listModels()
      // if (result && Array.isArray(result)) {
      //   setModels(result.filter(m => m.type === modelType))
      // }
      setModels([])
    } catch (error) {
      console.error('Failed to load models:', error)
      setModels([])
    } finally {
      setLoading(false)
    }
  }

  const handleChange: SelectProps['onChange'] = (e) => {
    const value = e.target.value
    if (value === '__add_model__') {
      onAddModel?.()
      return
    }
    onChange(value)
  }

  return (
    <div className="w-full">
      <Select
        value={selectedModelId || ''}
        onChange={handleChange}
        disabled={disabled || loading}
        className="w-full"
      >
        <option value="" disabled>
          {loading ? t('common.loading') : placeholderText}
        </option>
        {models.map(model => (
          <option key={model.id} value={model.id}>
            {model.name}
            {model.is_builtin && ` (${t('model.builtinTag')})`}
            {model.is_default && ` (${t('model.defaultTag')})`}
          </option>
        ))}
        {!disabled && (
          <option value="__add_model__">
            + {t('model.addModelInSettings')}
          </option>
        )}
      </Select>
    </div>
  )
}
