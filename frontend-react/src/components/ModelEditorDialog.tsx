import { useState, useEffect, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, X, Plus, RefreshCw, Info, AlertCircle, CheckCircle } from 'lucide-react'
import { useUIStore } from '@/stores/uiStore'
import { get, post } from '@/lib/api'

interface CustomHeaderItem {
  key: string
  value: string
}

interface ModelFormData {
  id: string
  name: string
  source: 'local' | 'remote'
  provider?: string
  modelName: string
  baseUrl?: string
  apiKey?: string
  dimension?: number
  interfaceType?: 'ollama' | 'openai'
  isDefault: boolean
  supportsVision?: boolean
  customHeaders?: CustomHeaderItem[]
}

interface ModelEditorDialogProps {
  visible: boolean
  modelType: 'chat' | 'embedding' | 'rerank' | 'vllm' | 'asr'
  modelData?: ModelFormData | null
  onClose: () => void
  onConfirm: (data: ModelFormData) => void
}

interface OllamaModelInfo {
  name: string
  size: number
  digest: string
  modified_at: string
}

interface ModelProviderOption {
  value: string
  label: string
  description: string
  defaultUrls: Record<string, string>
  modelTypes: string[]
}

// API functions
async function checkOllamaStatus(): Promise<{ available: boolean; version?: string; error?: string; baseUrl?: string }> {
  try {
    const response = await get<any>('/initialization/ollama/status')
    return response.data || { available: false }
  } catch {
    return { available: false, error: 'Failed to check Ollama status' }
  }
}

async function listOllamaModels(): Promise<OllamaModelInfo[]> {
  try {
    const response = await get<any>('/initialization/ollama/models')
    return response.data?.models || []
  } catch {
    return []
  }
}

async function downloadOllamaModel(modelName: string): Promise<{ taskId: string }> {
  const response = await post<any>('/initialization/ollama/models/download', { modelName })
  return response.data || { taskId: '' }
}

async function getDownloadProgress(taskId: string): Promise<{ status: string; progress: number; message?: string }> {
  const response = await get<any>(`/initialization/ollama/download/progress/${taskId}`)
  return response.data
}

async function checkRemoteModel(modelConfig: {
  modelName: string
  baseUrl?: string
  apiKey?: string
  provider?: string
  customHeaders?: Record<string, string>
}): Promise<{ available: boolean; message?: string }> {
  try {
    const response = await post<any>('/initialization/remote/check', modelConfig)
    return response.data || {}
  } catch {
    return { available: false }
  }
}

async function testEmbeddingModel(modelConfig: {
  source: 'local' | 'remote'
  modelName: string
  baseUrl?: string
  apiKey?: string
  dimension?: number
  provider?: string
  customHeaders?: Record<string, string>
}): Promise<{ available: boolean; message?: string; dimension?: number }> {
  try {
    const response = await post<any>('/initialization/embedding/test', modelConfig)
    return response.data || {}
  } catch {
    return { available: false }
  }
}

async function checkRerankModel(modelConfig: {
  modelName: string
  baseUrl?: string
  apiKey?: string
  provider?: string
  customHeaders?: Record<string, string>
}): Promise<{ available: boolean; message?: string }> {
  try {
    const response = await post<any>('/initialization/rerank/check', modelConfig)
    return response.data || {}
  } catch {
    return { available: false }
  }
}

async function checkASRModel(modelConfig: {
  modelName: string
  baseUrl?: string
  apiKey?: string
  provider?: string
  customHeaders?: Record<string, string>
}): Promise<{ available: boolean; message?: string }> {
  try {
    const response = await post<any>('/initialization/asr/check', modelConfig)
    return response.data || {}
  } catch {
    return { available: false }
  }
}

async function listModelProviders(modelType?: string): Promise<ModelProviderOption[]> {
  try {
    const url = modelType
      ? `/models/providers?model_type=${encodeURIComponent(modelType)}`
      : '/models/providers'
    const response = await get<any>(url)
    return response.data || []
  } catch {
    return []
  }
}

async function getWeKnoraCloudStatus(): Promise<{ needs_reinit: boolean; has_models: boolean }> {
  try {
    const response = await get<any>('/weknoracloud/status')
    return response.data || { needs_reinit: false, has_models: false }
  } catch {
    return { needs_reinit: false, has_models: false }
  }
}

function generateId() {
  return `model_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export function ModelEditorDialog({
  visible,
  modelType,
  modelData,
  onClose,
  onConfirm,
}: ModelEditorDialogProps) {
  const { t } = useTranslation()
  const uiStore = useUIStore()

  // Provider options (fallback when API unavailable)
  const fallbackProviderOptions: ModelProviderOption[] = [
    {
      value: 'openai',
      label: t('model.editor.providers.openai.label'),
      defaultUrls: {
        chat: 'https://api.openai.com/v1',
        embedding: 'https://api.openai.com/v1',
        rerank: 'https://api.openai.com/v1',
        vllm: 'https://api.openai.com/v1',
        asr: 'https://api.openai.com/v1',
      },
      description: t('model.editor.providers.openai.description'),
      modelTypes: ['chat', 'embedding', 'vllm', 'asr'],
    },
    {
      value: 'azure_openai',
      label: t('model.editor.providers.azure_openai.label'),
      defaultUrls: {
        chat: 'https://{resource}.openai.azure.com',
        embedding: 'https://{resource}.openai.azure.com',
        vllm: 'https://{resource}.openai.azure.com',
        asr: 'https://{resource}.openai.azure.com',
      },
      description: t('model.editor.providers.azure_openai.description'),
      modelTypes: ['chat', 'embedding', 'vllm', 'asr'],
    },
    {
      value: 'aliyun',
      label: t('model.editor.providers.aliyun.label'),
      defaultUrls: {
        chat: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
        embedding: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
        rerank: 'https://dashscope.aliyuncs.com/api/v1/services/rerank/text-rerank/text-rerank',
        vllm: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
      },
      description: t('model.editor.providers.aliyun.description'),
      modelTypes: ['chat', 'embedding', 'rerank', 'vllm'],
    },
    {
      value: 'zhipu',
      label: t('model.editor.providers.zhipu.label'),
      defaultUrls: {
        chat: 'https://open.bigmodel.cn/api/paas/v4',
        embedding: 'https://open.bigmodel.cn/api/paas/v4/embeddings',
        vllm: 'https://open.bigmodel.cn/api/paas/v4',
      },
      description: t('model.editor.providers.zhipu.description'),
      modelTypes: ['chat', 'embedding', 'vllm'],
    },
    {
      value: 'openrouter',
      label: t('model.editor.providers.openrouter.label'),
      defaultUrls: {
        chat: 'https://openrouter.ai/api/v1',
        embedding: 'https://openrouter.ai/api/v1',
      },
      description: t('model.editor.providers.openrouter.description'),
      modelTypes: ['chat', 'embedding'],
    },
    {
      value: 'siliconflow',
      label: t('model.editor.providers.siliconflow.label'),
      defaultUrls: {
        chat: 'https://api.siliconflow.cn/v1',
        embedding: 'https://api.siliconflow.cn/v1',
        rerank: 'https://api.siliconflow.cn/v1',
      },
      description: t('model.editor.providers.siliconflow.description'),
      modelTypes: ['chat', 'embedding', 'rerank'],
    },
    {
      value: 'jina',
      label: t('model.editor.providers.jina.label'),
      defaultUrls: {
        embedding: 'https://api.jina.ai/v1',
        rerank: 'https://api.jina.ai/v1',
      },
      description: t('model.editor.providers.jina.description'),
      modelTypes: ['embedding', 'rerank'],
    },
    {
      value: 'nvidia',
      label: t('model.editor.providers.nvidia.label'),
      defaultUrls: {
        chat: 'https://integrate.api.nvidia.com/v1',
        embedding: 'https://integrate.api.nvidia.com/v1',
        rerank: 'https://ai.api.nvidia.com/v1/retrieval/nvidia/reranking',
        vllm: 'https://integrate.api.nvidia.com/v1',
      },
      description: t('model.editor.providers.nvidia.description'),
      modelTypes: ['chat', 'embedding', 'rerank', 'vllm'],
    },
    {
      value: 'novita',
      label: t('model.editor.providers.novita.label'),
      defaultUrls: {
        chat: 'https://api.novita.ai/openai/v1',
        embedding: 'https://api.novita.ai/openai/v1',
        vllm: 'https://api.novita.ai/openai/v1',
      },
      description: t('model.editor.providers.novita.description'),
      modelTypes: ['chat', 'embedding', 'vllm'],
    },
    {
      value: 'generic',
      label: t('model.editor.providers.generic.label'),
      defaultUrls: {},
      description: t('model.editor.providers.generic.description'),
      modelTypes: ['chat', 'embedding', 'rerank', 'vllm', 'asr'],
    },
  ]

  const [apiProviderOptions, setApiProviderOptions] = useState<ModelProviderOption[]>([])
  const [loadingProviders, setLoadingProviders] = useState(false)

  const [saving, setSaving] = useState(false)
  const [checking, setChecking] = useState(false)
  const [remoteChecked, setRemoteChecked] = useState(false)
  const [remoteAvailable, setRemoteAvailable] = useState(false)
  const [remoteMessage, setRemoteMessage] = useState('')
  const [dimensionChecked, setDimensionChecked] = useState(false)
  const [dimensionSuccess, setDimensionSuccess] = useState(false)
  const [dimensionMessage, setDimensionMessage] = useState('')

  // Ollama state
  const [ollamaModelList, setOllamaModelList] = useState<OllamaModelInfo[]>([])
  const [loadingOllamaModels, setLoadingOllamaModels] = useState(false)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [downloading, setDownloading] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState(0)
  const [_currentDownloadModel, _setCurrentDownloadModel] = useState('')
  const downloadIntervalRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Ollama service status
  const [ollamaServiceStatus, setOllamaServiceStatus] = useState<boolean | null>(null)

  // WeKnoraCloud status
  const [wkcCredentialState, setWkcCredentialState] = useState<'loading' | 'unconfigured' | 'configured' | 'expired'>('loading')

  const [formData, setFormData] = useState<ModelFormData>({
    id: '',
    name: '',
    source: 'local',
    provider: 'openai',
    modelName: '',
    baseUrl: '',
    apiKey: '',
    dimension: undefined,
    interfaceType: 'ollama',
    isDefault: false,
    supportsVision: false,
    customHeaders: [],
  })

  const isEdit = !!modelData
  const lastOpenedModelIdRef = useRef<string | null>(null)

  const providerOptions = apiProviderOptions.length > 0
    ? apiProviderOptions.map((p) => ({
        ...p,
        label: p.label,
        description: p.description,
      }))
    : fallbackProviderOptions.filter((p) => p.modelTypes.includes(modelType))

  // Filtered Ollama models
  const filteredOllamaModels = searchKeyword
    ? ollamaModelList.filter((m) => m.name.toLowerCase().includes(searchKeyword.toLowerCase()))
    : ollamaModelList

  const showDownloadOption = useCallback(() => {
    if (!searchKeyword.trim()) return false
    return !ollamaModelList.some(
      (m) => m.name.toLowerCase() === searchKeyword.toLowerCase()
    )
  }, [searchKeyword, ollamaModelList])

  // Format model size
  function formatModelSize(bytes: number): string {
    if (!bytes || bytes === 0) return ''
    const gb = bytes / (1024 * 1024 * 1024)
    return gb >= 1 ? `${gb.toFixed(1)} GB` : `${(bytes / (1024 * 1024)).toFixed(0)} MB`
  }

  // Load providers
  const loadProviders = async () => {
    setLoadingProviders(true)
    try {
      const providers = await listModelProviders(modelType)
      if (providers.length > 0) {
        setApiProviderOptions(providers)
      }
    } catch (error) {
      console.error('Failed to load providers:', error)
    } finally {
      setLoadingProviders(false)
    }
  }

  // Check Ollama status
  const checkOllamaServiceStatus = async () => {
    setOllamaServiceStatus(null)
    try {
      const result = await checkOllamaStatus()
      setOllamaServiceStatus(result.available)
      // If Ollama unavailable and in create mode with local source, switch to remote
      if (!result.available && !isEdit && formData.source === 'local') {
        setFormData((prev) => ({ ...prev, source: 'remote' }))
      }
    } catch {
      setOllamaServiceStatus(false)
    }
  }

  // Check WeKnoraCloud credential
  const checkWkcCredentialStatus = async () => {
    setWkcCredentialState('loading')
    try {
      const status = await getWeKnoraCloudStatus()
      if (status.needs_reinit) {
        setWkcCredentialState('expired')
      } else if (status.has_models) {
        setWkcCredentialState('configured')
      } else {
        setWkcCredentialState('unconfigured')
      }
    } catch {
      setWkcCredentialState('unconfigured')
    }
  }

  // Load Ollama models
  const loadOllamaModels = async () => {
    if (formData.source !== 'local') return
    setLoadingOllamaModels(true)
    try {
      const models = await listOllamaModels()
      setOllamaModelList(models)
    } catch (error) {
      console.error('Failed to load Ollama models:', error)
    } finally {
      setLoadingOllamaModels(false)
    }
  }

  // Refresh Ollama models
  const refreshOllamaModels = async () => {
    setOllamaModelList([])
    await loadOllamaModels()
    alert(t('model.editor.listRefreshed'))
  }

  // Start download
  const startDownload = async (modelName: string) => {
    setDownloading(true)
    setDownloadProgress(0)
    _setCurrentDownloadModel(modelName)

    try {
      const result = await downloadOllamaModel(modelName)
      const taskId = result.taskId
      alert(t('model.editor.downloadStarted', { name: modelName }))

      downloadIntervalRef.current = setInterval(async () => {
        try {
          const progress = await getDownloadProgress(taskId)
          setDownloadProgress(progress.progress)

          if (progress.status === 'completed') {
            clearInterval(downloadIntervalRef.current!)
            downloadIntervalRef.current = null
            setDownloading(false)
            alert(t('model.editor.downloadCompleted', { name: modelName }))
            await loadOllamaModels()
            setFormData((prev) => ({ ...prev, modelName }))
            setDownloadProgress(0)
            _setCurrentDownloadModel('')
          } else if (progress.status === 'failed') {
            clearInterval(downloadIntervalRef.current!)
            downloadIntervalRef.current = null
            setDownloading(false)
            alert(progress.message || t('model.editor.downloadFailed', { name: modelName }))
            setDownloadProgress(0)
            _setCurrentDownloadModel('')
          }
        } catch (error) {
          console.error('Failed to get download progress:', error)
        }
      }, 1000)
    } catch (error) {
      setDownloading(false)
      setDownloadProgress(0)
      _setCurrentDownloadModel('')
      alert(t('model.editor.downloadStartFailed'))
    }
  }

  // Check Ollama dimension
  const checkOllamaDimension = async () => {
    if (!formData.modelName || formData.source !== 'local' || modelType !== 'embedding') return

    setChecking(true)
    setDimensionChecked(false)
    setDimensionMessage('')

    try {
      const result = await testEmbeddingModel({
        source: 'local',
        modelName: formData.modelName,
        dimension: formData.dimension,
      })

      setDimensionChecked(true)
      setDimensionSuccess(result.available || false)

      if (result.available && result.dimension) {
        setFormData((prev) => ({ ...prev, dimension: result.dimension }))
        setDimensionMessage(t('model.editor.dimensionDetected', { value: result.dimension }))
        alert(t('model.editor.dimensionDetected', { value: result.dimension }))
      } else {
        setDimensionMessage(t('model.editor.dimensionFailed'))
        alert(t('model.editor.dimensionFailed'))
      }
    } catch (error) {
      setDimensionChecked(true)
      setDimensionSuccess(false)
      setDimensionMessage(t('model.editor.dimensionFailed'))
      alert(t('model.editor.dimensionFailed'))
    } finally {
      setChecking(false)
    }
  }

  // Check remote API
  const checkRemoteAPI = async () => {
    if (!formData.modelName || (!formData.baseUrl && formData.provider !== 'weknoracloud')) {
      alert(t('model.editor.fillModelAndUrl'))
      return
    }

    setChecking(true)
    setRemoteChecked(false)
    setRemoteMessage('')

    // Build custom headers
    const customHeaders: Record<string, string> = {}
    if (Array.isArray(formData.customHeaders)) {
      for (const item of formData.customHeaders) {
        const key = (item?.key ?? '').trim()
        const value = (item?.value ?? '').trim()
        if (key && value) customHeaders[key] = value
      }
    }

    try {
      let result: { available: boolean; message?: string; dimension?: number } = { available: false }

      switch (modelType) {
        case 'chat':
          result = await checkRemoteModel({
            modelName: formData.modelName,
            baseUrl: formData.baseUrl,
            apiKey: formData.apiKey || '',
            provider: formData.provider,
            customHeaders: Object.keys(customHeaders).length > 0 ? customHeaders : undefined,
          })
          break
        case 'embedding':
          result = await testEmbeddingModel({
            source: 'remote',
            modelName: formData.modelName,
            baseUrl: formData.baseUrl,
            apiKey: formData.apiKey || '',
            dimension: formData.dimension,
            provider: formData.provider,
            customHeaders: Object.keys(customHeaders).length > 0 ? customHeaders : undefined,
          })
          if (result.available && result.dimension) {
            setFormData((prev) => ({ ...prev, dimension: result.dimension }))
            alert(t('model.editor.remoteDimensionDetected', { value: result.dimension }))
          }
          break
        case 'rerank':
          result = await checkRerankModel({
            modelName: formData.modelName,
            baseUrl: formData.baseUrl,
            apiKey: formData.apiKey || '',
            provider: formData.provider,
            customHeaders: Object.keys(customHeaders).length > 0 ? customHeaders : undefined,
          })
          break
        case 'vllm':
          result = await checkRemoteModel({
            modelName: formData.modelName,
            baseUrl: formData.baseUrl,
            apiKey: formData.apiKey || '',
            provider: formData.provider,
            customHeaders: Object.keys(customHeaders).length > 0 ? customHeaders : undefined,
          })
          break
        case 'asr':
          result = await checkASRModel({
            modelName: formData.modelName,
            baseUrl: formData.baseUrl,
            apiKey: formData.apiKey || '',
            provider: formData.provider,
            customHeaders: Object.keys(customHeaders).length > 0 ? customHeaders : undefined,
          })
          break
      }

      setRemoteChecked(true)
      setRemoteAvailable(result.available || false)
      setRemoteMessage(
        result.available
          ? t('model.editor.connectionSuccess')
          : t('model.editor.connectionFailed')
      )

      if (result.available) {
        alert(t('model.editor.connectionSuccess'))
      } else {
        alert(t('model.editor.connectionFailed'))
      }
    } catch (error) {
      setRemoteChecked(true)
      setRemoteAvailable(false)
      setRemoteMessage(t('model.editor.connectionConfigError'))
      alert(t('model.editor.connectionConfigError'))
    } finally {
      setChecking(false)
    }
  }

  // Handle provider change
  const handleProviderChange = (value: string) => {
    const provider = providerOptions.find((opt) => opt.value === value)
    if (provider && provider.defaultUrls) {
      const defaultUrl = provider.defaultUrls[modelType]
      if (defaultUrl) {
        setFormData((prev) => ({ ...prev, provider: value, baseUrl: defaultUrl }))
      }
    }
    setRemoteChecked(false)
    setRemoteAvailable(false)
    setRemoteMessage('')

    if (value === 'weknoracloud') {
      checkWkcCredentialStatus()
    }
  }

  // Reset form
  const resetForm = () => {
    setFormData({
      id: generateId(),
      name: '',
      source: 'local',
      provider: 'generic',
      modelName: '',
      baseUrl: '',
      apiKey: '',
      dimension: undefined,
      interfaceType: undefined,
      isDefault: false,
      supportsVision: false,
      customHeaders: [],
    })
    setRemoteChecked(false)
    setRemoteAvailable(false)
    setRemoteMessage('')
    setDimensionChecked(false)
    setDimensionSuccess(false)
    setDimensionMessage('')
  }

  // Go to Ollama settings
  const goToOllamaSettings = async () => {
    onClose()
    if (uiStore.showSettingsModal) {
      uiStore.closeSettings()
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
    uiStore.openSettings()
    // Navigate to ollama tab - would need to be handled by the settings component
  }

  // Go to WeKnoraCloud settings
  const goToWeKnoraCloudSettings = async () => {
    onClose()
    if (uiStore.showSettingsModal) {
      uiStore.closeSettings()
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
    uiStore.openSettings()
  }

  // Handle confirm
  const handleConfirm = async () => {
    // Validation
    if (!formData.modelName || !formData.modelName.trim()) {
      alert(t('model.editor.validation.modelNameRequired'))
      return
    }

    if (formData.modelName.trim().length > 100) {
      alert(t('model.editor.validation.modelNameMax'))
      return
    }

    if (formData.source === 'remote' && formData.provider !== 'weknoracloud') {
      if (!formData.baseUrl || !formData.baseUrl.trim()) {
        alert(t('model.editor.remoteBaseUrlRequired'))
        return
      }
      try {
        new URL(formData.baseUrl.trim())
      } catch {
        alert(t('model.editor.validation.baseUrlInvalid'))
        return
      }
    }

    setSaving(true)
    try {
      if (!formData.id) {
        setFormData((prev) => ({ ...prev, id: generateId() }))
      }
      onConfirm({ ...formData })
      onClose()
      resetForm()
      lastOpenedModelIdRef.current = null
    } catch (error) {
      console.error('Form validation failed:', error)
    } finally {
      setSaving(false)
    }
  }

  // Handle cancel
  const handleCancel = () => {
    resetForm()
    lastOpenedModelIdRef.current = null
    onClose()
  }

  // Add custom header
  const addCustomHeader = () => {
    setFormData((prev) => ({
      ...prev,
      customHeaders: [...(prev.customHeaders || []), { key: '', value: '' }],
    }))
  }

  // Remove custom header
  const removeCustomHeader = (idx: number) => {
    setFormData((prev) => ({
      ...prev,
      customHeaders: prev.customHeaders?.filter((_, i) => i !== idx) || [],
    }))
  }

  // Get model name placeholder
  const getModelNamePlaceholder = () => {
    if (modelType === 'vllm') {
      return formData.source === 'local'
        ? t('model.editor.modelNamePlaceholder.localVllm')
        : t('model.editor.modelNamePlaceholder.remoteVllm')
    }
    if (modelType === 'asr') {
      return t('model.editor.modelNamePlaceholder.remoteAsr')
    }
    return formData.source === 'local'
      ? t('model.editor.modelNamePlaceholder.local')
      : t('model.editor.modelNamePlaceholder.remote')
  }

  const getBaseUrlPlaceholder = () => {
    if (modelType === 'vllm') return t('model.editor.baseUrlPlaceholderVllm')
    if (modelType === 'asr') return t('model.editor.baseUrlPlaceholderAsr')
    return t('model.editor.baseUrlPlaceholder')
  }

  // Watch visible
  useEffect(() => {
    if (visible) {
      checkOllamaServiceStatus()
      loadProviders()

      // Reset check states
      setRemoteChecked(false)
      setRemoteAvailable(false)
      setRemoteMessage('')
      setDimensionChecked(false)
      setDimensionSuccess(false)
      setDimensionMessage('')

      const currentId = modelData?.id ?? null

      if (modelData) {
        setFormData({
          ...modelData,
          customHeaders: Array.isArray(modelData.customHeaders)
            ? modelData.customHeaders.map((h) => ({ key: h.key, value: h.value }))
            : [],
        })
      } else if (lastOpenedModelIdRef.current !== null || !formData.id) {
        resetForm()
      }

      lastOpenedModelIdRef.current = currentId

      // Rerank force remote
      if (modelType === 'rerank') {
        setFormData((prev) => ({ ...prev, source: 'remote' }))
      }

      // WeKnoraCloud check
      if (formData.provider === 'weknoracloud') {
        checkWkcCredentialStatus()
      }
    }
  }, [visible])

  // Watch model name for download
  useEffect(() => {
    if (formData.modelName?.startsWith('__download__')) {
      const modelName = formData.modelName.replace('__download__', '')
      setFormData((prev) => ({ ...prev, modelName: '' }))
      startDownload(modelName)
    }
  }, [formData.modelName])

  // Watch source changes
  useEffect(() => {
    // Reset check states on source change
    setRemoteChecked(false)
    setRemoteAvailable(false)
    setRemoteMessage('')
    setDimensionChecked(false)
    setDimensionSuccess(false)
    setDimensionMessage('')

    // Cleanup download
    if (downloadIntervalRef.current) {
      clearInterval(downloadIntervalRef.current)
      downloadIntervalRef.current = null
    }
    setDownloading(false)
    setDownloadProgress(0)
    _setCurrentDownloadModel('')
    setSearchKeyword('')
  }, [formData.source])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (downloadIntervalRef.current) {
        clearInterval(downloadIntervalRef.current)
      }
    }
  }, [])

  const isWkcDisabled = formData.provider === 'weknoracloud' && wkcCredentialState !== 'configured'

  return (
    <Dialog open={visible} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t('model.editor.editTitle') : t('model.editor.addTitle')}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4 space-y-6">
          {/* Source Selection */}
          <div className="form-item">
            <label className="block text-sm font-medium mb-2">
              {t('model.editor.sourceLabel')} <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="source"
                  value="local"
                  checked={formData.source === 'local'}
                  onChange={() => setFormData((prev) => ({ ...prev, source: 'local' }))}
                  disabled={ollamaServiceStatus === false || modelType === 'rerank'}
                  className="accent-[var(--td-brand-color)]"
                />
                <span className="text-sm">{t('model.editor.sourceLocal')}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="source"
                  value="remote"
                  checked={formData.source === 'remote'}
                  onChange={() => setFormData((prev) => ({ ...prev, source: 'remote' }))}
                  className="accent-[var(--td-brand-color)]"
                />
                <span className="text-sm">{t('model.editor.sourceRemote')}</span>
              </label>
            </div>

            {/* Ollama unavailable tip */}
            {modelType === 'rerank' ? (
              <div className="flex items-center gap-2 mt-3 p-3 bg-[var(--td-success-color-light)] border border-[var(--td-success-color-focus)] border-l-3 rounded-md">
                <Info className="w-4 h-4 text-[var(--td-brand-color)] flex-shrink-0" />
                <span className="text-sm text-[var(--td-success-color)]">
                  {t('model.editor.ollamaNotSupportRerank')}
                </span>
              </div>
            ) : ollamaServiceStatus === false ? (
              <div className="flex items-center gap-2 mt-3 p-3 bg-[var(--td-error-color-light)] border border-[var(--td-error-color-focus)] rounded-md">
                <AlertCircle className="w-4 h-4 text-[var(--td-error-color)] flex-shrink-0" />
                <span className="text-sm text-[var(--td-error-color)] flex-1">
                  {t('model.editor.ollamaUnavailable')}
                </span>
                <button
                  onClick={goToOllamaSettings}
                  className="text-sm text-[var(--td-brand-color)] font-medium hover:underline"
                >
                  {t('model.editor.goToOllamaSettings')}
                </button>
              </div>
            ) : null}
          </div>

          {/* Local: Ollama Model Select */}
          {formData.source === 'local' && (
            <div className="form-item">
              <label className="block text-sm font-medium mb-2">
                {t('model.modelName')} <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <select
                    value={formData.modelName}
                    onChange={(e) => setFormData((prev) => ({ ...prev, modelName: e.target.value }))}
                    disabled={loadingOllamaModels}
                    onFocus={loadOllamaModels}
                    className="w-full h-10 rounded-md border border-[var(--td-border-level-1-color)] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--td-brand-color)] disabled:opacity-50"
                  >
                    <option value="">
                      {loadingOllamaModels ? 'Loading...' : t('model.searchPlaceholder')}
                    </option>
                    {filteredOllamaModels.map((model) => (
                      <option key={model.name} value={model.name}>
                        {model.name} ({formatModelSize(model.size)})
                      </option>
                    ))}
                    {showDownloadOption() && (
                      <option value={`__download__${searchKeyword}`}>
                        {t('model.editor.downloadLabel', { keyword: searchKeyword })}
                      </option>
                    )}
                  </select>
                  {downloading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-md">
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      <span className="text-sm">{downloadProgress.toFixed(1)}%</span>
                    </div>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refreshOllamaModels}
                  disabled={loadingOllamaModels}
                >
                  <RefreshCw className={`w-4 h-4 ${loadingOllamaModels ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>
          )}

          {/* Remote: Provider & Config */}
          {formData.source === 'remote' && (
            <>
              {/* Provider */}
              <div className="form-item">
                <label className="block text-sm font-medium mb-2">
                  {t('model.editor.providerLabel')}
                </label>
                <select
                  value={formData.provider || 'generic'}
                  onChange={(e) => handleProviderChange(e.target.value)}
                  disabled={loadingProviders}
                  className="w-full h-10 rounded-md border border-[var(--td-border-level-1-color)] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--td-brand-color)]"
                >
                  {providerOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* WeKnoraCloud hint */}
              {formData.provider === 'weknoracloud' && (
                <>
                  {wkcCredentialState === 'configured' ? (
                    <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-md">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-green-700">
                        {t('settings.weknoraCloud.modelHintConfigured')}
                        <a
                          href="https://developers.weixin.qq.com/doc/aispeech/knowledge/atomic_capability/atomic_interface.html"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-1 text-[var(--td-brand-color)] hover:underline"
                        >
                          {t('settings.weknoraCloud.modelHintDocsLink')}
                        </a>
                      </div>
                    </div>
                  ) : wkcCredentialState !== 'loading' ? (
                    <div className="flex items-start gap-2 p-3 bg-orange-50 border border-orange-200 border-l-3 rounded-md">
                      <AlertCircle className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 text-sm text-orange-700">
                        {wkcCredentialState === 'expired'
                          ? t('settings.weknoraCloud.credentialExpired')
                          : t('settings.weknoraCloud.credentialUnconfigured')}
                        <div className="mt-2">
                          <button
                            onClick={goToWeKnoraCloudSettings}
                            className="text-sm text-[var(--td-brand-color)] font-medium hover:underline"
                          >
                            {t('settings.weknoraCloud.goToSettings')}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 p-3 text-sm text-[var(--td-text-color-placeholder)]">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {t('settings.weknoraCloud.checkingStatus')}
                    </div>
                  )}
                </>
              )}

              {/* Model Name */}
              <div className="form-item">
                <label className="block text-sm font-medium mb-2">
                  {t('model.modelName')} <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.modelName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, modelName: e.target.value }))}
                  placeholder={getModelNamePlaceholder()}
                  disabled={isWkcDisabled}
                />
              </div>

              {/* Base URL */}
              {formData.provider !== 'weknoracloud' && (
                <div className="form-item">
                  <label className="block text-sm font-medium mb-2">
                    {t('model.editor.baseUrlLabel')} <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={formData.baseUrl || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, baseUrl: e.target.value }))}
                    placeholder={getBaseUrlPlaceholder()}
                  />
                </div>
              )}

              {/* API Key */}
              {formData.provider !== 'weknoracloud' && (
                <div className="form-item">
                  <label className="block text-sm font-medium mb-2">
                    {t('model.editor.apiKeyOptional')}
                  </label>
                  <Input
                    type="password"
                    value={formData.apiKey || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, apiKey: e.target.value }))}
                    placeholder={t('model.editor.apiKeyPlaceholder')}
                  />
                </div>
              )}

              {/* Custom Headers */}
              {formData.provider !== 'weknoracloud' && (
                <div className="form-item">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium">
                      {t('model.editor.customHeadersLabel')}
                    </label>
                    <Button variant="ghost" size="sm" onClick={addCustomHeader}>
                      <Plus className="w-4 h-4 mr-1" />
                      {t('model.editor.customHeadersAdd')}
                    </Button>
                  </div>
                  <p className="text-xs text-[var(--td-text-color-placeholder)] mb-2">
                    {t('model.editor.customHeadersDesc')}
                  </p>
                  {formData.customHeaders?.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 mb-2">
                      <Input
                        value={item.key}
                        onChange={(e) => {
                          const newHeaders = [...(formData.customHeaders || [])]
                          newHeaders[idx].key = e.target.value
                          setFormData((prev) => ({ ...prev, customHeaders: newHeaders }))
                        }}
                        placeholder={t('model.editor.customHeadersKeyPlaceholder')}
                        className="flex-0 w-[38%]"
                      />
                      <Input
                        value={item.value}
                        onChange={(e) => {
                          const newHeaders = [...(formData.customHeaders || [])]
                          newHeaders[idx].value = e.target.value
                          setFormData((prev) => ({ ...prev, customHeaders: newHeaders }))
                        }}
                        placeholder={t('model.editor.customHeadersValuePlaceholder')}
                        className="flex-1"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeCustomHeader(idx)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Connection Test */}
              <div className="form-item">
                <label className="block text-sm font-medium mb-2">
                  {t('model.editor.connectionTest')}
                </label>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    onClick={checkRemoteAPI}
                    disabled={
                      checking ||
                      !formData.modelName ||
                      (!formData.baseUrl && formData.provider !== 'weknoracloud') ||
                      isWkcDisabled
                    }
                  >
                    {checking && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                    {!checking && remoteChecked && remoteAvailable && (
                      <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                    )}
                    {!checking && remoteChecked && !remoteAvailable && (
                      <X className="w-4 h-4 mr-2 text-red-500" />
                    )}
                    {checking ? t('model.editor.testing') : t('model.editor.testConnection')}
                  </Button>
                  {remoteChecked && (
                    <span
                      className={`text-sm ${
                        remoteAvailable
                          ? 'text-[var(--td-brand-color-active)]'
                          : 'text-[var(--td-error-color)]'
                      }`}
                    >
                      {remoteMessage}
                    </span>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Embedding: Dimension */}
          {modelType === 'embedding' && (
            <div className="form-item">
              <label className="block text-sm font-medium mb-2">
                {t('model.editor.dimensionLabel')}
              </label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={128}
                  max={4096}
                  value={formData.dimension || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      dimension: e.target.value ? parseInt(e.target.value) : undefined,
                    }))
                  }
                  disabled={formData.source === 'local' && checking}
                  placeholder={t('model.editor.dimensionPlaceholder')}
                  className="flex-1"
                />
                {formData.source === 'local' && formData.modelName && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={checkOllamaDimension}
                    disabled={checking}
                  >
                    <RefreshCw className={`w-4 h-4 mr-1 ${checking ? 'animate-spin' : ''}`} />
                    {t('model.editor.checkDimension')}
                  </Button>
                )}
              </div>
              {dimensionChecked && dimensionMessage && (
                <p
                  className={`text-sm mt-1 ${
                    dimensionSuccess ? 'text-[var(--td-brand-color)]' : 'text-[var(--td-error-color)]'
                  }`}
                >
                  {dimensionMessage}
                </p>
              )}
            </div>
          )}

          {/* Chat: Vision support */}
          {modelType === 'chat' && (
            <div className="form-item">
              <label className="block text-sm font-medium mb-2">
                {t('model.editor.supportsVisionLabel')}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.supportsVision || false}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, supportsVision: e.target.checked }))
                  }
                  className="accent-[var(--td-brand-color)]"
                />
                <span className="text-sm text-[var(--td-text-color-secondary)]">
                  {t('model.editor.supportsVisionDesc')}
                </span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={
              formData.provider === 'weknoracloud' && wkcCredentialState !== 'configured' || saving
            }
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            {t('common.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}