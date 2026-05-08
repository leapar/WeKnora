import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Settings as SettingsIcon } from 'lucide-react'
import { GeneralSettings } from './components/GeneralSettings'
import { ModelSettings } from './components/ModelSettings'
import { OllamaSettings } from './components/OllamaSettings'
import { WeKnoraCloudSettings } from './components/WeKnoraCloudSettings'
import { WebSearchSettings } from './components/WebSearchSettings'
import { ChatHistorySettings } from './components/ChatHistorySettings'
import { VectorStoreSettings } from './components/VectorStoreSettings'
import { ParserEngineSettings } from './components/ParserEngineSettings'
import { StorageEngineSettings } from './components/StorageEngineSettings'
import { McpSettings } from './components/McpSettings'
import { SystemInfo } from './components/SystemInfo'
import { TenantInfo } from './components/TenantInfo'
import { ApiInfo } from './components/ApiInfo'

type SectionKey =
  | 'general'
  | 'ollama'
  | 'weknoracloud'
  | 'models'
  | 'websearch'
  | 'chathistory'
  | 'vectorstore'
  | 'parser'
  | 'storage'
  | 'mcp'
  | 'system'
  | 'tenant'
  | 'api'

interface NavItem {
  key: SectionKey
  icon: string
  label: string
}

export function Settings() {
  const { t } = useTranslation()
  const [currentSection, setCurrentSection] = useState<SectionKey>('general')

  const navItems: NavItem[] = [
    { key: 'general', icon: 'setting', label: t('general.title') },
    { key: 'ollama', icon: 'server', label: 'Ollama' },
    { key: 'weknoracloud', icon: '', label: 'WeKnora Cloud' },
    { key: 'models', icon: 'control-platform', label: t('settings.modelManagement') },
    { key: 'websearch', icon: 'search', label: t('settings.webSearchConfig') },
    { key: 'chathistory', icon: 'chat', label: t('chatHistorySettings.title') },
    { key: 'vectorstore', icon: 'data-base', label: t('settings.vectorStoreEngine') },
    { key: 'parser', icon: 'file-search', label: t('settings.parserEngine') },
    { key: 'storage', icon: 'cloud', label: t('settings.storageEngine') },
    { key: 'mcp', icon: 'tools', label: t('settings.mcpService') },
    { key: 'system', icon: 'info-circle', label: t('settings.systemSettings') },
    { key: 'tenant', icon: 'user-circle', label: t('settings.tenantInfo') },
    { key: 'api', icon: 'secured', label: t('settings.apiInfo') },
  ]

  const handleNavClick = (key: SectionKey) => {
    setCurrentSection(key)
  }

  const renderContent = () => {
    switch (currentSection) {
      case 'general':
        return <GeneralSettings onSave={async () => {}} />
      case 'ollama':
        return <OllamaSettings />
      case 'weknoracloud':
        return <WeKnoraCloudSettings />
      case 'models':
        return <ModelSettings />
      case 'websearch':
        return <WebSearchSettings />
      case 'chathistory':
        return <ChatHistorySettings />
      case 'vectorstore':
        return <VectorStoreSettings />
      case 'parser':
        return <ParserEngineSettings />
      case 'storage':
        return <StorageEngineSettings />
      case 'mcp':
        return <McpSettings />
      case 'system':
        return <SystemInfo />
      case 'tenant':
        return <TenantInfo />
      case 'api':
        return <ApiInfo />
      default:
        return <GeneralSettings onSave={async () => {}} />
    }
  }

  return (
    <div className="min-h-screen bg-[var(--td-bg-color-page)]">
      {/* Header */}
      <div className="bg-white border-b border-[var(--td-border-level-1-color)]">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <SettingsIcon size={24} className="text-[var(--td-brand-color)]" />
            <h1 className="text-2xl font-semibold text-[var(--td-text-color-primary)]">
              {t('general.settings')}
            </h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-6">
        <div className="bg-white rounded-lg border border-[var(--td-border-level-1-color)] overflow-hidden" style={{ display: 'flex', minHeight: '600px' }}>
          {/* Sidebar */}
          <div className="w-56 bg-[var(--td-bg-color-settings-modal)] border-r border-[var(--td-component-stroke)] flex flex-col">
            <div className="p-4 border-b border-[var(--td-component-stroke)]">
              <h2 className="text-base font-semibold text-[var(--td-text-color-primary)]">
                {t('general.settings')}
              </h2>
            </div>
            <nav className="flex-1 p-2 overflow-y-auto">
              {navItems.map((item) => (
                <button
                  key={item.key}
                  onClick={() => handleNavClick(item.key)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-md text-sm text-left transition-colors mb-1 ${
                    currentSection === item.key
                      ? 'bg-[var(--td-brand-color-light)] text-[var(--td-brand-color)] font-medium'
                      : 'text-[var(--td-text-color-secondary)] hover:bg-[var(--td-bg-color-secondarycontainer-hover)] hover:text-[var(--td-text-color-primary)]'
                  }`}
                >
                  {item.icon && <span className="text-base">{item.icon}</span>}
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto p-8">
            <div className="max-w-2xl">
              {renderContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}