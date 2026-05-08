import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Loader2 } from 'lucide-react'
import { createMCPService, updateMCPService, type MCPService } from '@/api/mcp-service'

interface McpServiceDialogProps {
  visible: boolean
  service: MCPService | null
  mode: 'add' | 'edit'
  onClose: () => void
  onSuccess: () => void
}

export function McpServiceDialog({ visible, service, mode, onClose, onSuccess }: McpServiceDialogProps) {
  const { t } = useTranslation()
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    enabled: true,
    transport_type: 'sse' as 'sse' | 'http-streamable',
    url: '',
    auth_config: {
      api_key: '',
      token: ''
    },
    advanced_config: {
      timeout: 30,
      retry_count: 3,
      retry_delay: 1
    }
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (service) {
      const transportType = service.transport_type === 'stdio' ? 'sse' : (service.transport_type || 'sse')
      setFormData({
        name: service.name || '',
        description: service.description || '',
        enabled: service.enabled ?? true,
        transport_type: transportType as 'sse' | 'http-streamable',
        url: service.url || '',
        auth_config: {
          api_key: service.auth_config?.api_key || '',
          token: service.auth_config?.token || ''
        },
        advanced_config: {
          timeout: service.advanced_config?.timeout || 30,
          retry_count: service.advanced_config?.retry_count || 3,
          retry_delay: service.advanced_config?.retry_delay || 1
        }
      })
    } else {
      resetForm()
    }
  }, [service])

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      enabled: true,
      transport_type: 'sse',
      url: '',
      auth_config: {
        api_key: '',
        token: ''
      },
      advanced_config: {
        timeout: 30,
        retry_count: 3,
        retry_delay: 1
      }
    })
    setErrors({})
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = t('mcpServiceDialog.rules.nameRequired', 'Name is required')
    }

    if (!formData.url.trim()) {
      newErrors.url = t('mcpServiceDialog.rules.urlRequired', 'URL is required')
    } else {
      try {
        new URL(formData.url)
      } catch {
        newErrors.url = t('mcpServiceDialog.rules.urlInvalid', 'Invalid URL format')
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return

    setSubmitting(true)
    try {
      const data: Partial<MCPService> = {
        name: formData.name,
        description: formData.description,
        enabled: formData.enabled,
        transport_type: formData.transport_type,
        auth_config: {
          api_key: formData.auth_config.api_key || undefined,
          token: formData.auth_config.token || undefined
        },
        advanced_config: formData.advanced_config,
        url: formData.url || undefined
      }

      if (mode === 'add') {
        await createMCPService(data)
      } else {
        await updateMCPService(service!.id, data)
      }

      onSuccess()
      onClose()
    } catch (error) {
      console.error('Failed to save MCP service:', error)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={visible} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {mode === 'add' ? t('mcpServiceDialog.addTitle', 'Add MCP Service') : t('mcpServiceDialog.editTitle', 'Edit MCP Service')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              {t('mcpServiceDialog.name', 'Name')} <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder={t('mcpServiceDialog.namePlaceholder', 'Enter service name')}
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              {t('mcpServiceDialog.description', 'Description')}
            </label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder={t('mcpServiceDialog.descriptionPlaceholder', 'Enter description')}
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              {t('mcpServiceDialog.transportType', 'Transport Type')}
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={formData.transport_type === 'sse'}
                  onChange={() => setFormData({ ...formData, transport_type: 'sse' })}
                  className="rounded"
                />
                <span className="text-sm">{t('mcpServiceDialog.transport.sse', 'SSE')}</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={formData.transport_type === 'http-streamable'}
                  onChange={() => setFormData({ ...formData, transport_type: 'http-streamable' })}
                  className="rounded"
                />
                <span className="text-sm">{t('mcpServiceDialog.transport.httpStreamable', 'HTTP Streamable')}</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              {t('mcpServiceDialog.serviceUrl', 'Service URL')} <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              placeholder={t('mcpServiceDialog.serviceUrlPlaceholder', 'https://...')}
            />
            {errors.url && <p className="text-xs text-red-500 mt-1">{errors.url}</p>}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="enabled"
              checked={formData.enabled}
              onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
              className="rounded"
            />
            <label htmlFor="enabled" className="text-sm">{t('mcpServiceDialog.enableService', 'Enable Service')}</label>
          </div>

          <details className="border rounded p-3">
            <summary className="text-sm font-medium cursor-pointer">
              {t('mcpServiceDialog.authConfig', 'Authentication Config')}
            </summary>
            <div className="mt-3 space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1">{t('mcpServiceDialog.apiKey', 'API Key')}</label>
                <Input
                  type="password"
                  value={formData.auth_config.api_key}
                  onChange={(e) => setFormData({
                    ...formData,
                    auth_config: { ...formData.auth_config, api_key: e.target.value }
                  })}
                  placeholder={t('mcpServiceDialog.optional', 'Optional')}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">{t('mcpServiceDialog.bearerToken', 'Bearer Token')}</label>
                <Input
                  type="password"
                  value={formData.auth_config.token}
                  onChange={(e) => setFormData({
                    ...formData,
                    auth_config: { ...formData.auth_config, token: e.target.value }
                  })}
                  placeholder={t('mcpServiceDialog.optional', 'Optional')}
                />
              </div>
            </div>
          </details>

          <details className="border rounded p-3">
            <summary className="text-sm font-medium cursor-pointer">
              {t('mcpServiceDialog.advancedConfig', 'Advanced Config')}
            </summary>
            <div className="mt-3 space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1">{t('mcpServiceDialog.timeoutSec', 'Timeout (seconds)')}</label>
                <Input
                  type="number"
                  min={1}
                  max={300}
                  value={formData.advanced_config.timeout}
                  onChange={(e) => setFormData({
                    ...formData,
                    advanced_config: { ...formData.advanced_config, timeout: parseInt(e.target.value) || 30 }
                  })}
                  placeholder="30"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">{t('mcpServiceDialog.retryCount', 'Retry Count')}</label>
                <Input
                  type="number"
                  min={0}
                  max={10}
                  value={formData.advanced_config.retry_count}
                  onChange={(e) => setFormData({
                    ...formData,
                    advanced_config: { ...formData.advanced_config, retry_count: parseInt(e.target.value) || 0 }
                  })}
                  placeholder="3"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">{t('mcpServiceDialog.retryDelaySec', 'Retry Delay (seconds)')}</label>
                <Input
                  type="number"
                  min={0}
                  max={60}
                  value={formData.advanced_config.retry_delay}
                  onChange={(e) => setFormData({
                    ...formData,
                    advanced_config: { ...formData.advanced_config, retry_delay: parseInt(e.target.value) || 0 }
                  })}
                  placeholder="1"
                />
              </div>
            </div>
          </details>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose} disabled={submitting}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting && <Loader2 size={14} className="mr-1 animate-spin" />}
              {t('common.confirm', 'Confirm')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
