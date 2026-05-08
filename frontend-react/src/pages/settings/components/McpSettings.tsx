import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Plus, Loader2, ExternalLink, Trash2 } from 'lucide-react'

interface MCPService {
  id: string
  name: string
  description?: string
  url?: string
  transport_type: string
  enabled: boolean
  is_builtin: boolean
}

interface McpSettingsProps {
  services?: MCPService[]
  loading?: boolean
  onLoad?: () => void
  onAdd?: () => void
  onEdit?: (service: MCPService) => void
  onDelete?: (service: MCPService) => void
  onToggle?: (service: MCPService) => void
  onTest?: (service: MCPService) => void
}

const getTransportTypeLabel = (type: string): string => {
  switch (type) {
    case 'stdio': return 'STDIO'
    case 'sse': return 'SSE'
    case 'http': return 'HTTP'
    default: return type.toUpperCase()
  }
}

export function McpSettings({
  services: initialServices = [],
  loading = false,
  onLoad,
  onAdd,
  onEdit,
  onDelete,
  onToggle,
  onTest,
}: McpSettingsProps) {
  const { t } = useTranslation()
  const [services, setServices] = useState<MCPService[]>(initialServices)

  useEffect(() => {
    setServices(initialServices)
  }, [initialServices])

  useEffect(() => {
    if (onLoad) {
      onLoad()
    }
  }, [onLoad])

  const handleToggleEnabled = (service: MCPService) => {
    if (onToggle) {
      onToggle(service)
    } else {
      setServices(prev =>
        prev.map(s =>
          s.id === service.id ? { ...s, enabled: !s.enabled } : s
        )
      )
    }
  }

  return (
    <div className="mcp-settings">
      <div className="section-header mb-6">
        <h2 className="text-lg font-medium">{t('mcpSettings.title', 'MCP Services')}</h2>
        <p className="text-sm text-[var(--td-text-color-secondary)] mt-1">
          {t('mcpSettings.description', 'Configure Model Context Protocol (MCP) services for extended capabilities')}
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-[var(--td-brand-color)]" size={32} />
        </div>
      ) : (
        <>
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-6 p-4 bg-white rounded-lg border border-[var(--td-border-level-1-color)]">
            <div>
              <h3 className="font-medium">{t('mcpSettings.configuredServices', 'Configured Services')}</h3>
              <p className="text-sm text-[var(--td-text-color-secondary)]">
                {t('mcpSettings.manageAndTest', 'Manage and test your MCP services')}
              </p>
            </div>
            <Button onClick={onAdd}>
              <Plus size={16} className="mr-2" />
              {t('mcpSettings.addService', 'Add Service')}
            </Button>
          </div>

          {/* Empty State */}
          {services.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-[var(--td-border-level-1-color)]">
              <p className="text-[var(--td-text-color-secondary)] mb-4">
                {t('mcpSettings.empty', 'No MCP services configured')}
              </p>
              <Button onClick={onAdd}>
                <Plus size={16} className="mr-2" />
                {t('mcpSettings.addFirst', 'Add your first service')}
              </Button>
            </div>
          ) : (
            /* Services Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {services.map((service) => (
                <div
                  key={service.id}
                  className="bg-white rounded-lg border border-[var(--td-border-level-1-color)] p-4"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-medium">{service.name}</h4>
                      {service.description && (
                        <p className="text-sm text-[var(--td-text-color-secondary)] mt-1">
                          {service.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Toggle */}
                      <button
                        onClick={() => handleToggleEnabled(service)}
                        disabled={service.is_builtin}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          service.enabled ? 'bg-[var(--td-brand-color)]' : 'bg-gray-300'
                        } ${service.is_builtin ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            service.enabled ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className="px-2 py-0.5 text-xs rounded bg-blue-100 text-blue-700">
                      {getTransportTypeLabel(service.transport_type)}
                    </span>
                    {service.is_builtin && (
                      <span className="px-2 py-0.5 text-xs rounded bg-yellow-100 text-yellow-700">
                        {t('mcpSettings.builtin', 'Built-in')}
                      </span>
                    )}
                    <span className={`px-2 py-0.5 text-xs rounded ${
                      service.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {service.enabled ? t('common.on', 'On') : t('common.off', 'Off')}
                    </span>
                  </div>

                  {/* URL */}
                  {service.url && (
                    <div className="flex items-center gap-1 text-xs text-[var(--td-text-color-secondary)] mb-3">
                      <ExternalLink size={12} />
                      <span className="truncate" title={service.url}>{service.url}</span>
                    </div>
                  )}

                  {/* Actions */}
                  {!service.is_builtin && (
                    <div className="flex items-center gap-2 pt-3 border-t border-[var(--td-border-level-1-color)]">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit?.(service)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onTest?.(service)}
                      >
                        Test
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete?.(service)}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
