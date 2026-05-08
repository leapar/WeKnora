import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Plus, Globe, Trash2, Edit, CheckCircle } from 'lucide-react'

interface WebSearchProvider {
  id: string
  name: string
  provider: string
  description?: string
  is_default?: boolean
  is_free?: boolean
  parameters?: {
    api_key?: string
    engine_id?: string
    proxy_url?: string
  }
}

interface WebSearchSettingsProps {
  providers?: WebSearchProvider[]
  onAdd?: () => void
  onEdit?: (provider: WebSearchProvider) => void
  onDelete?: (providerId: string) => void
  onSetDefault?: (providerId: string) => void
}

export function WebSearchSettings({
  providers = [],
  onEdit,
  onDelete,
  onSetDefault,
}: WebSearchSettingsProps) {
  const { t } = useTranslation()

  const [showAddDialog, setShowAddDialog] = useState(false)

  const handleSetDefault = (providerId: string) => {
    onSetDefault?.(providerId)
  }

  return (
    <div className="websearch-settings">
      <div className="section-header mb-6">
        <h2 className="text-lg font-medium">{t('webSearchSettings.title', 'Web Search Settings')}</h2>
        <p className="text-sm text-[var(--td-text-color-secondary)] mt-1">
          {t('webSearchSettings.description', 'Configure web search providers for agent and chat features')}
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-6 p-4 bg-white rounded-lg border border-[var(--td-border-level-1-color)]">
        <h3 className="font-medium">{t('webSearchSettings.providersTitle', 'Search Providers')}</h3>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus size={16} className="mr-2" />
          {t('webSearchSettings.addProvider', 'Add Provider')}
        </Button>
      </div>

      {/* Provider List */}
      {providers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {providers.map((provider) => (
            <div
              key={provider.id}
              className="bg-white rounded-lg border border-[var(--td-border-level-1-color)] p-4"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Globe size={20} className="text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">{provider.name}</h4>
                    <p className="text-xs text-[var(--td-text-color-secondary)]">{provider.provider}</p>
                  </div>
                </div>
              </div>

              {provider.description && (
                <p className="text-sm text-[var(--td-text-color-secondary)] mb-3">{provider.description}</p>
              )}

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="px-2 py-0.5 text-xs rounded bg-blue-100 text-blue-700">{provider.provider}</span>
                {provider.is_default && (
                  <span className="px-2 py-0.5 text-xs rounded bg-green-100 text-green-700 flex items-center gap-1">
                    <CheckCircle size={10} />
                    {t('webSearchSettings.default', 'Default')}
                  </span>
                )}
                {provider.is_free && (
                  <span className="px-2 py-0.5 text-xs rounded bg-yellow-100 text-yellow-700">
                    {t('webSearchSettings.free', 'Free')}
                  </span>
                )}
              </div>

              {/* Meta */}
              {provider.parameters?.proxy_url && (
                <p className="text-xs text-[var(--td-text-color-placeholder)] mb-3 truncate">
                  Proxy: {provider.parameters.proxy_url}
                </p>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 pt-3 border-t border-[var(--td-border-level-1-color)]">
                {!provider.is_default && (
                  <Button variant="ghost" size="sm" onClick={() => handleSetDefault(provider.id)}>
                    Set as Default
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={() => onEdit?.(provider)}>
                  <Edit size={14} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete?.(provider.id)}
                  className="text-red-500 hover:text-red-600 hover:bg-red-50"
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-12 bg-white rounded-lg border border-[var(--td-border-level-1-color)]">
          <Globe size={48} className="mx-auto mb-4 text-[var(--td-text-color-placeholder)]" />
          <p className="text-[var(--td-text-color-secondary)] mb-4">
            {t('webSearchSettings.noProvidersDesc', 'No search providers configured')}
          </p>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus size={16} className="mr-2" />
            {t('webSearchSettings.addProvider', 'Add Provider')}
          </Button>
        </div>
      )}

      {/* Add/Edit Dialog - simplified placeholder */}
      {showAddDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium mb-4">
              {t('webSearchSettings.addProvider', 'Add Search Provider')}
            </h3>
            <p className="text-sm text-[var(--td-text-color-secondary)] mb-4">
              Provider configuration dialog would go here
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                {t('common.cancel', 'Cancel')}
              </Button>
              <Button onClick={() => setShowAddDialog(false)}>
                {t('common.save', 'Save')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
