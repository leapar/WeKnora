import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ModelInfo } from '@/types'
import { BUILTIN_QUICK_ANSWER_ID } from '@/api/agent'

interface AgentConfig {
  selectedAgentId?: string
  selectedAgentSourceTenantId?: string | null
  allowedTools?: string[]
}

interface ModelConfig {
  chatModelId?: string
  embeddingModelId?: string
  rerankModelId?: string
  summaryModelId?: string
}

interface Settings {
  endpoint: string
  apiKey: string
  language: string
  theme: 'light' | 'dark' | 'auto'
  isAgentEnabled: boolean
  agentConfig: AgentConfig
  modelConfig: ModelConfig
  selectedKnowledgeBases: string[]
  selectedFiles: string[]
  webSearchEnabled: boolean
  memoryEnabled: boolean
  temperature: number
}

const defaultSettings: Settings = {
  endpoint: '',
  apiKey: '',
  language: 'zh-CN',
  theme: 'light',
  isAgentEnabled: false,
  agentConfig: {
    selectedAgentId: undefined,
    selectedAgentSourceTenantId: null,
    allowedTools: [],
  },
  modelConfig: {
    chatModelId: undefined,
    embeddingModelId: undefined,
    rerankModelId: undefined,
    summaryModelId: undefined,
  },
  selectedKnowledgeBases: [],
  selectedFiles: [],
  webSearchEnabled: false,
  memoryEnabled: false,
  temperature: 0.7,
}

interface SettingsState {
  settings: Settings
  chatModels: ModelInfo[]
  embeddingModels: ModelInfo[]
  rerankModels: ModelInfo[]
  vllmModels: ModelInfo[]

  getIsAgentEnabled: () => boolean
  getIsAgentReady: () => boolean

  saveSettings: (settings: Partial<Settings>) => void
  updateAgentConfig: (config: Partial<AgentConfig>) => void
  updateModelConfig: (config: Partial<ModelConfig>) => void
  selectAgent: (agentId: string, sourceTenantId?: string | null) => void
  selectKnowledgeBases: (kbIds: string[]) => void
  toggleAgent: (enabled: boolean) => void
  setWebSearchEnabled: (enabled: boolean) => void
  setMemoryEnabled: (enabled: boolean) => void
  setTemperature: (temp: number) => void
  setChatModels: (models: ModelInfo[]) => void
  setEmbeddingModels: (models: ModelInfo[]) => void
  setRerankModels: (models: ModelInfo[]) => void
  setVllmModels: (models: ModelInfo[]) => void
  resetSettings: () => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      settings: defaultSettings,
      chatModels: [],
      embeddingModels: [],
      rerankModels: [],
      vllmModels: [],

      getIsAgentEnabled: () => {
        return get().settings.isAgentEnabled
      },

      getIsAgentReady: () => {
        const state = get()
        const config = state.settings.agentConfig
        const models = state.settings.modelConfig
        return Boolean(
          (config.allowedTools && config.allowedTools.length > 0) &&
          models.summaryModelId &&
          models.rerankModelId
        )
      },

      saveSettings: (newSettings) => {
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        }))
      },

      updateAgentConfig: (config) => {
        set((state) => ({
          settings: {
            ...state.settings,
            agentConfig: { ...state.settings.agentConfig, ...config },
          },
        }))
      },

      updateModelConfig: (config) => {
        set((state) => ({
          settings: {
            ...state.settings,
            modelConfig: { ...state.settings.modelConfig, ...config },
          },
        }))
      },

      selectAgent: (agentId, sourceTenantId = null) => {
        const isAgentEnabled = agentId !== BUILTIN_QUICK_ANSWER_ID
        set((state) => ({
          settings: {
            ...state.settings,
            agentConfig: {
              ...state.settings.agentConfig,
              selectedAgentId: agentId,
              selectedAgentSourceTenantId: sourceTenantId,
            },
            isAgentEnabled,
            selectedKnowledgeBases: [],
            selectedFiles: [],
          },
        }))
      },

      selectKnowledgeBases: (kbIds) => {
        set((state) => ({
          settings: {
            ...state.settings,
            selectedKnowledgeBases: kbIds,
          },
        }))
      },

      toggleAgent: (enabled) => {
        set((state) => ({
          settings: {
            ...state.settings,
            isAgentEnabled: enabled,
          },
        }))
      },

      setWebSearchEnabled: (enabled) => {
        set((state) => ({
          settings: {
            ...state.settings,
            webSearchEnabled: enabled,
          },
        }))
      },

      setMemoryEnabled: (enabled) => {
        set((state) => ({
          settings: {
            ...state.settings,
            memoryEnabled: enabled,
          },
        }))
      },

      setTemperature: (temp) => {
        set((state) => ({
          settings: {
            ...state.settings,
            temperature: temp,
          },
        }))
      },

      setChatModels: (models) => {
        set({ chatModels: models })
      },

      setEmbeddingModels: (models) => {
        set({ embeddingModels: models })
      },

      setRerankModels: (models) => {
        set({ rerankModels: models })
      },

      setVllmModels: (models) => {
        set({ vllmModels: models })
      },

      resetSettings: () => {
        set({ settings: defaultSettings })
      },
    }),
    {
      name: 'WeKnora_settings',
    }
  )
)
