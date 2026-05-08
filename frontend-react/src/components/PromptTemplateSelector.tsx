import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Loader2, RotateCcw, LayoutGrid } from 'lucide-react'

interface PromptTemplate {
  id: string
  name: string
  description?: string
  default?: boolean
  has_knowledge_base?: boolean
  has_web_search?: boolean
  mode?: 'model' | 'fixed'
}

interface PromptTemplatesConfig {
  system_prompt?: PromptTemplate[]
  context_template?: PromptTemplate[]
  rewrite?: PromptTemplate[]
  fallback?: PromptTemplate[]
  agent_system_prompt?: PromptTemplate[]
}

interface PromptTemplateSelectorProps {
  type: 'systemPrompt' | 'contextTemplate' | 'rewrite' | 'fallback' | 'agentSystemPrompt'
  hasKnowledgeBase?: boolean
  position?: 'inline' | 'corner'
  fallbackMode?: 'fixed' | 'model'
  onSelect: (template: PromptTemplate) => void
  onResetDefault: (template: PromptTemplate) => void
}

export function PromptTemplateSelector({
  type,
  hasKnowledgeBase: _hasKnowledgeBase = false,
  position = 'inline',
  fallbackMode,
  onSelect,
  onResetDefault,
}: PromptTemplateSelectorProps) {
  const { t } = useTranslation()
  const [popupVisible, setPopupVisible] = useState(false)
  const [loading, setLoading] = useState(false)
  const [resettingDefault, setResettingDefault] = useState(false)
  const [templatesConfig, setTemplatesConfig] = useState<PromptTemplatesConfig | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const templates = (): PromptTemplate[] => {
    if (!templatesConfig) return []

    let list: PromptTemplate[] = []
    switch (type) {
      case 'systemPrompt':
        list = templatesConfig.system_prompt || []
        break
      case 'contextTemplate':
        list = templatesConfig.context_template || []
        break
      case 'rewrite':
        list = templatesConfig.rewrite || []
        break
      case 'fallback':
        list = templatesConfig.fallback || []
        if (fallbackMode === 'model') {
          list = list.filter(t => t.mode === 'model')
        } else if (fallbackMode === 'fixed') {
          list = list.filter(t => !t.mode || t.mode !== 'model')
        }
        break
      case 'agentSystemPrompt':
        list = templatesConfig.agent_system_prompt || []
        break
    }
    return list
  }

  const loadTemplates = async () => {
    if (loading) return
    setLoading(true)
    try {
      // In a real implementation, this would call the API
      // const response = await getPromptTemplates()
      // setTemplatesConfig(response.data)
      setTemplatesConfig({})
    } catch (error) {
      console.error('Failed to load prompt templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleVisibleChange = async (visible: boolean) => {
    setPopupVisible(visible)
    if (visible && !templatesConfig) {
      await loadTemplates()
    }
  }

  const handleSelectTemplate = (template: PromptTemplate) => {
    onSelect(template)
    setPopupVisible(false)
  }

  const findDefaultTemplate = (list: PromptTemplate[]): PromptTemplate | null => {
    if (!list || list.length === 0) return null
    const defaultItem = list.find(t => t.default)
    return defaultItem || list[0]
  }

  const handleResetToDefault = async () => {
    if (!templatesConfig) {
      setResettingDefault(true)
      try {
        await loadTemplates()
      } finally {
        setResettingDefault(false)
      }
    }

    const templateList = templates()
    const defaultTpl = findDefaultTemplate(templateList)
    if (defaultTpl) {
      onResetDefault(defaultTpl)
    }
  }

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setPopupVisible(false)
      }
    }
    if (popupVisible) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [popupVisible])

  return (
    <div
      className={`inline-flex ${position === 'corner' ? 'absolute right-2 bottom-2 z-10' : ''}`}
      ref={dropdownRef}
    >
      <div className="inline-flex items-center gap-1">
        {/* Reset to Default Button */}
        <button
          onClick={handleResetToDefault}
          disabled={resettingDefault}
          className="inline-flex items-center gap-1 px-1.5 py-1 text-[12px] text-[var(--td-text-color-placeholder)] hover:text-[var(--td-brand-color)] transition-colors h-[26px]"
        >
          {resettingDefault ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <RotateCcw className="w-3.5 h-3.5" />
          )}
          <span>{t('promptTemplate.resetDefault')}</span>
        </button>

        {/* Template Selector Button */}
        <div className="relative">
          <button
            onClick={() => handleVisibleChange(!popupVisible)}
            disabled={loading}
            className="inline-flex items-center gap-1 px-2 py-1 text-[12px] text-[var(--td-text-color-secondary)] border border-[var(--td-component-stroke)] rounded-md bg-[var(--td-bg-color-container)] hover:text-[var(--td-brand-color)] hover:border-[var(--td-brand-color)] hover:bg-[var(--td-bg-color-secondarycontainer)] transition-colors h-[26px]"
          >
            {loading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <LayoutGrid className="w-3.5 h-3.5" />
            )}
            <span>{t('promptTemplate.useTemplate')}</span>
          </button>

          {/* Dropdown */}
          {popupVisible && (
            <div className="absolute top-full right-0 mt-1 w-[420px] max-h-[400px] bg-[var(--td-bg-color-container)] rounded-[10px] border border-[var(--td-component-border)] shadow-lg overflow-hidden z-50">
              {/* Header */}
              <div className="px-4 py-3 border-b border-[var(--td-component-stroke)]">
                <span className="text-sm font-medium text-[var(--td-text-color-primary)]">
                  {t('promptTemplate.selectTemplate')}
                </span>
              </div>

              {/* Content */}
              <div className="overflow-y-auto" style={{ maxHeight: '340px' }}>
                {loading ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 className="w-5 h-5 animate-spin text-[var(--td-text-color-placeholder)]" />
                  </div>
                ) : templates().length === 0 ? (
                  <div className="text-center text-[var(--td-text-color-placeholder)] text-sm py-10">
                    {t('promptTemplate.noTemplates')}
                  </div>
                ) : (
                  <div className="p-2">
                    {templates().map(template => (
                      <div
                        key={template.id}
                        className="p-3 rounded-lg cursor-pointer transition-colors mb-1 last:mb-0 hover:bg-[var(--td-bg-color-secondarycontainer)]"
                        onClick={() => handleSelectTemplate(template)}
                      >
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-[var(--td-text-color-primary)]">
                            {template.name}
                          </span>
                          {template.default && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] bg-yellow-100 text-yellow-700 font-medium">
                              {t('promptTemplate.default')}
                            </span>
                          )}
                          {template.has_knowledge_base && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] bg-[var(--td-brand-color-light)] text-[var(--td-brand-color)]">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                              </svg>
                              {t('promptTemplate.withKnowledgeBase')}
                            </span>
                          )}
                          {template.has_web_search && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] bg-[var(--td-success-color-light)] text-[var(--td-brand-color)]">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <path d="M2 12h20" />
                                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                              </svg>
                              {t('promptTemplate.withWebSearch')}
                            </span>
                          )}
                        </div>
                        {template.description && (
                          <p className="text-xs text-[var(--td-text-color-secondary)] mt-1.5 line-clamp-2">
                            {template.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
