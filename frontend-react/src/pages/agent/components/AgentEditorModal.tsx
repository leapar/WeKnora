import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'

interface AgentEditorModalProps {
  visible: boolean
  mode: 'create' | 'edit'
  agent?: any
  onClose: () => void
  onSuccess: (agentId: string) => void
}

interface FormData {
  name: string
  description: string
  type: 'quick-answer' | 'smart-reasoning'
  agentType: string
  modelId: string
  temperature: number
  maxCompletionTokens: number
  thinkingEnabled: boolean
  systemPrompt: string
  contextTemplate: string
  // Multimodal
  imageUploadEnabled: boolean
  vlmModelId: string
  imageStorageProvider: string
  audioUploadEnabled: boolean
  asrModelId: string
  // Conversation
  multiTurnEnabled: boolean
  historyTurns: number
  enableRewrite: boolean
  rewritePromptSystem: string
  rewritePromptUser: string
  // Tools
  allowedTools: string[]
  maxIterations: number
  llmCallTimeout: number
  mcpSelectionMode: 'all' | 'selected' | 'none'
  mcpServices: string[]
  // Skills
  skillsSelectionMode: 'all' | 'selected' | 'none'
  selectedSkills: string[]
  // Knowledge
  kbSelectionMode: 'all' | 'selected' | 'none'
  knowledgeBases: string[]
  supportedFileTypes: string[]
  retrieveKbOnlyWhenMentioned: boolean
  rerankModelId: string
}

const DEFAULT_FORM_DATA: FormData = {
  name: '',
  description: '',
  type: 'quick-answer',
  agentType: '',
  modelId: '',
  temperature: 0.7,
  maxCompletionTokens: 4096,
  thinkingEnabled: false,
  systemPrompt: '',
  contextTemplate: '',
  imageUploadEnabled: false,
  vlmModelId: '',
  imageStorageProvider: '',
  audioUploadEnabled: false,
  asrModelId: '',
  multiTurnEnabled: false,
  historyTurns: 5,
  enableRewrite: false,
  rewritePromptSystem: '',
  rewritePromptUser: '',
  allowedTools: [],
  maxIterations: 10,
  llmCallTimeout: 120,
  mcpSelectionMode: 'all',
  mcpServices: [],
  skillsSelectionMode: 'all',
  selectedSkills: [],
  kbSelectionMode: 'all',
  knowledgeBases: [],
  supportedFileTypes: [],
  retrieveKbOnlyWhenMentioned: false,
  rerankModelId: '',
}

const NAV_ITEMS = [
  { key: 'basic', icon: 'ðŸ„¹', labelKey: 'agent.editor.basicInfo' },
  { key: 'model', icon: 'ðŸ�œ', labelKey: 'agent.editor.modelConfig' },
  { key: 'multimodal', icon: 'ðŸ–¼', labelKey: 'agentEditor.imageUpload.sectionTitle' },
  { key: 'conversation', icon: 'ðŸ’¬', labelKey: 'agent.editor.conversationSettings' },
  { key: 'tools', icon: 'ðŸ”§', labelKey: 'agent.editor.toolsConfig' },
  { key: 'skills', icon: 'ðŸŒŸ', labelKey: 'agent.editor.skillsConfig' },
  { key: 'knowledge', icon: 'ðŸ“š', labelKey: 'agent.editor.knowledgeConfig' },
]

export function AgentEditorModal({ visible, mode, agent, onClose, onSuccess }: AgentEditorModalProps) {
  const { t } = useTranslation()
  const [currentSection, setCurrentSection] = useState('basic')
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<FormData>(DEFAULT_FORM_DATA)
  const isBuiltinAgent = agent?.is_builtin === true
  const isAgentMode = formData.type === 'smart-reasoning'

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!visible) {
      setCurrentSection('basic')
      setFormData(DEFAULT_FORM_DATA)
      return
    }

    if (mode === 'edit' && agent) {
      setFormData({
        name: agent.name || '',
        description: agent.description || '',
        type: agent.type === 'agent' ? 'smart-reasoning' : 'quick-answer',
        agentType: agent.agent_type || '',
        modelId: agent.model_id || '',
        temperature: agent.temperature || 0.7,
        maxCompletionTokens: agent.max_completion_tokens || 4096,
        thinkingEnabled: agent.thinking_enabled || false,
        systemPrompt: agent.prompt || '',
        contextTemplate: agent.context_template || '',
        imageUploadEnabled: agent.config?.image_upload_enabled || false,
        vlmModelId: agent.config?.vlm_model_id || '',
        imageStorageProvider: agent.config?.image_storage_provider || '',
        audioUploadEnabled: agent.config?.audio_upload_enabled || false,
        asrModelId: agent.config?.asr_model_id || '',
        multiTurnEnabled: agent.config?.multi_turn_enabled || false,
        historyTurns: agent.config?.history_turns || 5,
        enableRewrite: agent.config?.enable_rewrite || false,
        rewritePromptSystem: agent.config?.rewrite_prompt_system || '',
        rewritePromptUser: agent.config?.rewrite_prompt_user || '',
        allowedTools: agent.config?.allowed_tools || [],
        maxIterations: agent.config?.max_iterations || 10,
        llmCallTimeout: agent.config?.llm_call_timeout || 120,
        mcpSelectionMode: agent.config?.mcp_services ? 'selected' : 'all',
        mcpServices: agent.config?.mcp_services || [],
        skillsSelectionMode: agent.config?.selected_skills ? 'selected' : 'all',
        selectedSkills: agent.config?.selected_skills || [],
        kbSelectionMode: agent.config?.knowledge_bases ? 'selected' : 'all',
        knowledgeBases: agent.config?.knowledge_bases || [],
        supportedFileTypes: agent.config?.supported_file_types || [],
        retrieveKbOnlyWhenMentioned: agent.config?.retrieve_kb_only_when_mentioned || false,
        rerankModelId: agent.config?.rerank_model_id || '',
      })
    } else {
      setFormData(DEFAULT_FORM_DATA)
    }
  }, [visible, mode, agent])

  const handleFormDataUpdate = useCallback((updates: Partial<FormData>) => {
    setFormData(prev => ({ ...prev, ...updates }))
  }, [])

  const handleSubmit = useCallback(async () => {
    // Validate
    if (!formData.name.trim() && !isBuiltinAgent) {
      alert(t('agent.nameRequired', 'Name is required'))
      return
    }

    if (!formData.modelId) {
      alert(t('agent.modelRequired', 'Model is required'))
      return
    }

    setSaving(true)
    try {
      // In production, call API
      console.log('Submitting agent form:', formData)
      await new Promise(resolve => setTimeout(resolve, 1000))

      const resultId = mode === 'edit' && agent?.id ? agent.id : 'new-agent-id'
      alert(mode === 'edit' ? t('agent.updateSuccess', 'Agent updated') : t('agent.createSuccess', 'Agent created'))
      onSuccess(resultId)
      onClose()
    } catch (e: any) {
      alert(t('common.operationFailed', 'Operation failed') + ': ' + (e?.message || ''))
    }
    setSaving(false)
  }, [formData, isBuiltinAgent, mode, agent, onSuccess, onClose, t])

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
                {mode === 'create' ? t('agent.editor.createTitle', 'Create Agent') : t('agent.editor.editTitle', 'Edit Agent')}
              </h2>
            </div>
            <nav className="flex-1 p-3 overflow-y-auto">
              {NAV_ITEMS.map(item => (
                <div
                  key={item.key}
                  onClick={() => setCurrentSection(item.key)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-md cursor-pointer transition-colors mb-1 text-sm ${
                    currentSection === item.key
                      ? 'bg-[var(--td-brand-color-light)] text-[var(--td-brand-color)] font-medium'
                      : 'text-[var(--td-text-color-secondary)] hover:bg-[var(--td-bg-color-secondarycontainer-hover)] hover:text-[var(--td-text-color-primary)]'
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span className="flex-1">{t(item.labelKey)}</span>
                </div>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6">
              {/* Basic Section */}
              {currentSection === 'basic' && (
                <div className="space-y-6">
                  <div className="section-header mb-6">
                    <h2 className="text-xl font-semibold">{t('agent.editor.basicInfo', 'Basic Information')}</h2>
                    <p className="text-sm text-[var(--td-text-color-secondary)] mt-1">
                      {t('agent.editor.basicInfoDesc', 'Configure basic agent settings')}
                    </p>
                  </div>

                  {/* Builtin agent notice */}
                  {isBuiltinAgent && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm">
                      <span>ðŸ info</span>
                      <span>{t('agentEditor.builtinHint', 'This is a built-in agent. Some settings cannot be modified.')}</span>
                    </div>
                  )}

                  {/* Mode */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {t('agent.editor.mode', 'Mode')} <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="agent-mode"
                          value="quick-answer"
                          checked={formData.type === 'quick-answer'}
                          onChange={() => handleFormDataUpdate({ type: 'quick-answer' })}
                          disabled={isBuiltinAgent}
                        />
                        <span className="text-sm">{t('agent.type.normal', 'Quick Answer')}</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="agent-mode"
                          value="smart-reasoning"
                          checked={formData.type === 'smart-reasoning'}
                          onChange={() => handleFormDataUpdate({ type: 'smart-reasoning' })}
                          disabled={isBuiltinAgent}
                        />
                        <span className="text-sm">{t('agent.type.agent', 'Smart Reasoning')}</span>
                      </label>
                    </div>
                    <p className="text-xs text-[var(--td-text-color-placeholder)] mt-1">
                      {isAgentMode
                        ? t('agent.editor.agentDesc', 'Enables tool use, multi-step reasoning, and knowledge base retrieval')
                        : t('agent.editor.normalDesc', 'Simple question answering with optional context')}
                    </p>
                  </div>

                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {t('agent.editor.name', 'Name')} {!isBuiltinAgent && <span className="text-red-500">*</span>}
                    </label>
                    <Input
                      value={formData.name}
                      onChange={e => handleFormDataUpdate({ name: e.target.value })}
                      placeholder={t('agent.editor.namePlaceholder', 'Enter agent name')}
                      disabled={isBuiltinAgent}
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {t('agent.editor.description', 'Description')}
                    </label>
                    <Textarea
                      value={formData.description}
                      onChange={e => handleFormDataUpdate({ description: e.target.value })}
                      placeholder={t('agent.editor.descriptionPlaceholder', 'Enter description')}
                      rows={2}
                      disabled={isBuiltinAgent}
                    />
                  </div>

                  {/* System Prompt */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {t('agent.editor.systemPrompt', 'System Prompt')} {!isBuiltinAgent && <span className="text-red-500">*</span>}
                    </label>
                    <Textarea
                      value={formData.systemPrompt}
                      onChange={e => handleFormDataUpdate({ systemPrompt: e.target.value })}
                      placeholder={t('agent.editor.systemPromptPlaceholder', 'Enter system prompt')}
                      rows={10}
                      disabled={isBuiltinAgent}
                    />
                  </div>

                  {/* Context Template (only for quick-answer mode) */}
                  {!isAgentMode && (
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        {t('agent.editor.contextTemplate', 'Context Template')} {!isBuiltinAgent && <span className="text-red-500">*</span>}
                      </label>
                      <Textarea
                        value={formData.contextTemplate}
                        onChange={e => handleFormDataUpdate({ contextTemplate: e.target.value })}
                        placeholder={t('agent.editor.contextTemplatePlaceholder', 'Enter context template')}
                        rows={8}
                        disabled={isBuiltinAgent}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Model Section */}
              {currentSection === 'model' && (
                <div className="space-y-6">
                  <div className="section-header mb-6">
                    <h2 className="text-xl font-semibold">{t('agent.editor.modelConfig', 'Model Configuration')}</h2>
                    <p className="text-sm text-[var(--td-text-color-secondary)] mt-1">
                      {t('agent.editor.modelConfigDesc', 'Configure AI model settings')}
                    </p>
                  </div>

                  {/* Model */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {t('agent.editor.model', 'Model')} <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.modelId}
                      onChange={e => handleFormDataUpdate({ modelId: e.target.value })}
                      className="w-full rounded border border-[var(--td-border-level-1-color)] px-3 py-2 text-sm focus:outline-none focus:border-[var(--td-brand-color)]"
                    >
                      <option value="">Select model...</option>
                    </select>
                  </div>

                  {/* Temperature */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {t('agent.editor.temperature', 'Temperature')}: {formData.temperature}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={formData.temperature}
                      onChange={e => handleFormDataUpdate({ temperature: parseFloat(e.target.value) })}
                      className="w-full"
                    />
                    <p className="text-xs text-[var(--td-text-color-placeholder)] mt-1">
                      {t('agentEditor.desc.temperature', 'Lower values make output more deterministic')}
                    </p>
                  </div>

                  {/* Max tokens (only for quick-answer mode) */}
                  {!isAgentMode && (
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        {t('agent.editor.maxCompletionTokens', 'Max Completion Tokens')}
                      </label>
                      <Input
                        type="number"
                        value={formData.maxCompletionTokens}
                        onChange={e => handleFormDataUpdate({ maxCompletionTokens: parseInt(e.target.value) || 4096 })}
                        min={100}
                        max={100000}
                      />
                    </div>
                  )}

                  {/* Thinking */}
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <label className="text-sm font-medium">{t('agent.editor.thinking', 'Thinking')}</label>
                      <p className="text-xs text-[var(--td-text-color-secondary)] mt-0.5">
                        {t('agentEditor.desc.thinking', 'Enable chain of thought reasoning')}
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.thinkingEnabled}
                      onChange={e => handleFormDataUpdate({ thinkingEnabled: e.target.checked })}
                      className="w-4 h-4"
                    />
                  </div>
                </div>
              )}

              {/* Multimodal Section */}
              {currentSection === 'multimodal' && (
                <div className="space-y-6">
                  <div className="section-header mb-6">
                    <h2 className="text-xl font-semibold">{t('agentEditor.imageUpload.sectionTitle', 'Multimodal Configuration')}</h2>
                    <p className="text-sm text-[var(--td-text-color-secondary)] mt-1">
                      {t('agentEditor.imageUpload.sectionDesc', 'Configure image and audio processing')}
                    </p>
                  </div>

                  {/* Image upload */}
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <label className="text-sm font-medium">{t('agentEditor.imageUpload.label', 'Image Upload')}</label>
                      <p className="text-xs text-[var(--td-text-color-secondary)] mt-0.5">
                        {t('agentEditor.imageUpload.desc', 'Allow uploading images for analysis')}
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.imageUploadEnabled}
                      onChange={e => handleFormDataUpdate({ imageUploadEnabled: e.target.checked })}
                      className="w-4 h-4"
                    />
                  </div>

                  {formData.imageUploadEnabled && (
                    <>
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          {t('agentEditor.imageUpload.vllmModel', 'VLLM Model')} <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={formData.vlmModelId}
                          onChange={e => handleFormDataUpdate({ vlmModelId: e.target.value })}
                          className="w-full rounded border border-[var(--td-border-level-1-color)] px-3 py-2 text-sm focus:outline-none focus:border-[var(--td-brand-color)]"
                        >
                          <option value="">Select VLLM model...</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">
                          {t('agentEditor.imageUpload.storageProvider', 'Storage Provider')}
                        </label>
                        <select
                          value={formData.imageStorageProvider}
                          onChange={e => handleFormDataUpdate({ imageStorageProvider: e.target.value })}
                          className="w-full rounded border border-[var(--td-border-level-1-color)] px-3 py-2 text-sm focus:outline-none focus:border-[var(--td-brand-color)]"
                        >
                          <option value="">Default</option>
                        </select>
                      </div>
                    </>
                  )}

                  {/* Audio upload */}
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <label className="text-sm font-medium">{t('agentEditor.audioUpload.label', 'Audio Upload')}</label>
                      <p className="text-xs text-[var(--td-text-color-secondary)] mt-0.5">
                        {t('agentEditor.audioUpload.desc', 'Allow uploading audio for transcription')}
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.audioUploadEnabled}
                      onChange={e => handleFormDataUpdate({ audioUploadEnabled: e.target.checked })}
                      className="w-4 h-4"
                    />
                  </div>

                  {formData.audioUploadEnabled && (
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        {t('agentEditor.audioUpload.asrModel', 'ASR Model')}
                      </label>
                      <select
                        value={formData.asrModelId}
                        onChange={e => handleFormDataUpdate({ asrModelId: e.target.value })}
                        className="w-full rounded border border-[var(--td-border-level-1-color)] px-3 py-2 text-sm focus:outline-none focus:border-[var(--td-brand-color)]"
                      >
                        <option value="">Select ASR model...</option>
                      </select>
                    </div>
                  )}
                </div>
              )}

              {/* Conversation Section */}
              {currentSection === 'conversation' && !isAgentMode && (
                <div className="space-y-6">
                  <div className="section-header mb-6">
                    <h2 className="text-xl font-semibold">{t('agent.editor.conversationSettings', 'Conversation Settings')}</h2>
                    <p className="text-sm text-[var(--td-text-color-secondary)] mt-1">
                      {t('agentEditor.desc.conversationSection', 'Configure multi-turn conversation behavior')}
                    </p>
                  </div>

                  {/* Multi-turn */}
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <label className="text-sm font-medium">{t('agent.editor.multiTurn', 'Multi-turn Conversation')}</label>
                      <p className="text-xs text-[var(--td-text-color-secondary)] mt-0.5">
                        {t('agentEditor.desc.multiTurn', 'Enable conversation history')}
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.multiTurnEnabled}
                      onChange={e => handleFormDataUpdate({ multiTurnEnabled: e.target.checked })}
                      className="w-4 h-4"
                    />
                  </div>

                  {formData.multiTurnEnabled && (
                    <>
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          {t('agent.editor.historyTurns', 'History Turns')}
                        </label>
                        <Input
                          type="number"
                          value={formData.historyTurns}
                          onChange={e => handleFormDataUpdate({ historyTurns: parseInt(e.target.value) || 5 })}
                          min={1}
                          max={20}
                        />
                        <p className="text-xs text-[var(--td-text-color-placeholder)] mt-1">
                          {t('agentEditor.desc.historyRounds', 'Number of conversation turns to remember')}
                        </p>
                      </div>

                      {/* Rewrite */}
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <label className="text-sm font-medium">{t('agent.editor.enableRewrite', 'Question Rewrite')}</label>
                          <p className="text-xs text-[var(--td-text-color-secondary)] mt-0.5">
                            {t('agentEditor.desc.rewrite', 'Rewrite questions for better retrieval')}
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={formData.enableRewrite}
                          onChange={e => handleFormDataUpdate({ enableRewrite: e.target.checked })}
                          className="w-4 h-4"
                        />
                      </div>

                      {formData.enableRewrite && (
                        <>
                          <div>
                            <label className="block text-sm font-medium mb-2">
                              {t('agent.editor.rewritePromptSystem', 'Rewrite System Prompt')}
                            </label>
                            <Textarea
                              value={formData.rewritePromptSystem}
                              onChange={e => handleFormDataUpdate({ rewritePromptSystem: e.target.value })}
                              rows={4}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2">
                              {t('agent.editor.rewritePromptUser', 'Rewrite User Prompt')}
                            </label>
                            <Textarea
                              value={formData.rewritePromptUser}
                              onChange={e => handleFormDataUpdate({ rewritePromptUser: e.target.value })}
                              rows={4}
                            />
                          </div>
                        </>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Tools Section */}
              {currentSection === 'tools' && isAgentMode && (
                <div className="space-y-6">
                  <div className="section-header mb-6">
                    <h2 className="text-xl font-semibold">{t('agent.editor.toolsConfig', 'Tools Configuration')}</h2>
                    <p className="text-sm text-[var(--td-text-color-secondary)] mt-1">
                      {t('agent.editor.toolsConfigDesc', 'Configure available tools for the agent')}
                    </p>
                  </div>

                  {/* Allowed Tools */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {t('agent.editor.allowedTools', 'Allowed Tools')}
                    </label>
                    <div className="space-y-2">
                      {['web_search', 'wiki', 'document', 'calculator'].map(tool => (
                        <label key={tool} className="flex items-center gap-2 cursor-pointer p-2 border rounded hover:bg-gray-50">
                          <Checkbox
                            checked={formData.allowedTools.includes(tool)}
                            onCheckedChange={checked => {
                              if (checked) {
                                handleFormDataUpdate({ allowedTools: [...formData.allowedTools, tool] })
                              } else {
                                handleFormDataUpdate({ allowedTools: formData.allowedTools.filter(t => t !== tool) })
                              }
                            }}
                          />
                          <span className="text-sm">{tool}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Max Iterations */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {t('agent.editor.maxIterations', 'Max Iterations')}
                    </label>
                    <Input
                      type="number"
                      value={formData.maxIterations}
                      onChange={e => handleFormDataUpdate({ maxIterations: parseInt(e.target.value) || 10 })}
                      min={1}
                      max={50}
                    />
                  </div>

                  {/* LLM Timeout */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {t('agentEditor.llmCallTimeout.label', 'LLM Call Timeout')} (s)
                    </label>
                    <Input
                      type="number"
                      value={formData.llmCallTimeout}
                      onChange={e => handleFormDataUpdate({ llmCallTimeout: parseInt(e.target.value) || 120 })}
                      min={0}
                      max={600}
                    />
                  </div>
                </div>
              )}

              {/* Skills Section */}
              {currentSection === 'skills' && isAgentMode && (
                <div className="space-y-6">
                  <div className="section-header mb-6">
                    <h2 className="text-xl font-semibold">{t('agent.editor.skillsConfig', 'Skills Configuration')}</h2>
                    <p className="text-sm text-[var(--td-text-color-secondary)] mt-1">
                      {t('agent.editor.skillsConfigDesc', 'Configure agent skills')}
                    </p>
                  </div>

                  {/* Skills Selection Mode */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {t('agent.editor.skillsSelection', 'Skills Selection')}
                    </label>
                    <div className="flex gap-3">
                      {(['all', 'selected', 'none'] as const).map(mode => (
                        <label key={mode} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="skills-mode"
                            value={mode}
                            checked={formData.skillsSelectionMode === mode}
                            onChange={() => handleFormDataUpdate({ skillsSelectionMode: mode })}
                          />
                          <span className="text-sm">{t(`agent.editor.skills${mode.charAt(0).toUpperCase() + mode.slice(1)}`, mode)}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Knowledge Section */}
              {currentSection === 'knowledge' && (
                <div className="space-y-6">
                  <div className="section-header mb-6">
                    <h2 className="text-xl font-semibold">{t('agent.editor.knowledgeConfig', 'Knowledge Base Configuration')}</h2>
                    <p className="text-sm text-[var(--td-text-color-secondary)] mt-1">
                      {t('agent.editor.knowledgeConfigDesc', 'Configure knowledge base access')}
                    </p>
                  </div>

                  {/* KB Selection Mode */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {t('agent.editor.knowledgeBases', 'Knowledge Bases')}
                    </label>
                    <div className="flex gap-3">
                      {(['all', 'selected', 'none'] as const).map(mode => (
                        <label key={mode} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="kb-mode"
                            value={mode}
                            checked={formData.kbSelectionMode === mode}
                            onChange={() => handleFormDataUpdate({ kbSelectionMode: mode })}
                          />
                          <span className="text-sm">
                            {mode === 'all' ? t('agent.editor.allKnowledgeBases', 'All') :
                             mode === 'selected' ? t('agent.editor.selectedKnowledgeBases', 'Selected') :
                             t('agent.editor.noKnowledgeBase', 'None')}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Retrieve only when mentioned */}
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <label className="text-sm font-medium">{t('agent.editor.retrieveKBOnlyWhenMentioned', 'Retrieve Only When Mentioned')}</label>
                      <p className="text-xs text-[var(--td-text-color-secondary)] mt-0.5">
                        {t('agent.editor.retrieveKBOnlyWhenMentionedDesc', 'Only retrieve from knowledge base when explicitly mentioned')}
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.retrieveKbOnlyWhenMentioned}
                      onChange={e => handleFormDataUpdate({ retrieveKbOnlyWhenMentioned: e.target.checked })}
                      className="w-4 h-4"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 p-4 border-t border-[var(--td-component-stroke)]">
              <Button variant="outline" onClick={onClose}>
                {t('common.cancel', 'Cancel')}
              </Button>
              <Button onClick={handleSubmit} disabled={saving}>
                {saving && <Loader2 size={14} className="animate-spin mr-2" />}
                {mode === 'create' ? t('agent.create', 'Create') : t('common.save', 'Save')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}