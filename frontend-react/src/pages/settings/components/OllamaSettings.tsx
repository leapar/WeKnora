import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Loader2, RefreshCw, CheckCircle, XCircle, HelpCircle, ExternalLink, Download } from 'lucide-react'

interface OllamaSettingsProps {
  baseUrl?: string
  connectionStatus?: boolean | null
  onTest?: () => void
  onDownload?: (modelName: string) => void
  onRefresh?: () => void
}

export function OllamaSettings({
  baseUrl = 'http://localhost:11434',
  connectionStatus = null,
  onTest,
  onDownload,
  onRefresh,
}: OllamaSettingsProps) {
  const { t } = useTranslation()

  const [testing, setTesting] = useState(false)
  const [downloadModelName, setDownloadModelName] = useState('')
  const [downloading, setDownloading] = useState(false)
  const [downloadProgress] = useState(0)

  const testConnection = async () => {
    setTesting(true)
    try {
      await onTest?.()
    } finally {
      setTesting(false)
    }
  }

  const downloadModel = async () => {
    if (!downloadModelName.trim()) return
    setDownloading(true)
    try {
      await onDownload?.(downloadModelName.trim())
      setDownloadModelName('')
    } finally {
      setDownloading(false)
    }
  }

  const getStatusBadge = () => {
    if (testing) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-gray-100 text-gray-600">
          <Loader2 size={12} className="animate-spin" />
          Testing...
        </span>
      )
    }
    if (connectionStatus === true) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-green-100 text-green-700">
          <CheckCircle size={12} />
          Available
        </span>
      )
    }
    if (connectionStatus === false) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-red-100 text-red-700">
          <XCircle size={12} />
          Unavailable
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-gray-100 text-gray-600">
        <HelpCircle size={12} />
        Not Tested
      </span>
    )
  }

  return (
    <div className="ollama-settings">
      <div className="section-header mb-6">
        <h2 className="text-lg font-medium">{t('ollamaSettings.title', 'Ollama Settings')}</h2>
        <p className="text-sm text-[var(--td-text-color-secondary)] mt-1">
          {t('ollamaSettings.description', 'Configure local LLM inference with Ollama')}
        </p>
      </div>

      <div className="space-y-6">
        {/* Connection Status */}
        <div className="setting-row">
          <div className="setting-info">
            <label className="font-medium text-sm">
              {t('ollamaSettings.status.label', 'Connection Status')}
            </label>
            <p className="text-xs text-[var(--td-text-color-secondary)] mt-0.5">
              {t('ollamaSettings.status.desc', 'Test connection to Ollama server')}
            </p>
          </div>
          <div className="setting-control">
            <div className="flex items-center gap-3">
              {getStatusBadge()}
              <Button variant="outline" size="sm" onClick={testConnection} disabled={testing}>
                {testing ? <Loader2 className="animate-spin mr-1" size={14} /> : <RefreshCw size={14} className="mr-1" />}
                {t('ollamaSettings.status.retest', 'Retest')}
              </Button>
            </div>
          </div>
        </div>

        {/* Server Address */}
        <div className="setting-row">
          <div className="setting-info">
            <label className="font-medium text-sm">
              {t('ollamaSettings.address.label', 'Server Address')}
            </label>
            <p className="text-xs text-[var(--td-text-color-secondary)] mt-0.5">
              {t('ollamaSettings.address.desc', 'Ollama server URL')}
            </p>
          </div>
          <div className="setting-control">
            <input
              type="text"
              value={baseUrl}
              disabled
              className="w-full max-w-md px-3 py-2 rounded-lg border border-[var(--td-border-level-1-color)] bg-gray-50 text-sm"
            />
            {connectionStatus === false && (
              <p className="text-xs text-yellow-600 mt-1">
                {t('ollamaSettings.address.failed', 'Failed to connect to Ollama server')}
              </p>
            )}
          </div>
        </div>

        {/* Download New Model */}
        {connectionStatus === true && (
          <div className="bg-white rounded-lg border border-[var(--td-border-level-1-color)] p-4">
            <div className="mb-4">
              <h3 className="font-medium text-sm mb-1">
                {t('ollamaSettings.download.title', 'Download New Model')}
              </h3>
              <p className="text-xs text-[var(--td-text-color-secondary)]">
                {t('ollamaSettings.download.descPrefix', 'Enter a model name to download from')}
                <a
                  href="https://ollama.com/search"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--td-brand-color)] hover:underline ml-1"
                >
                  Ollama Library
                  <ExternalLink size={10} className="inline ml-1" />
                </a>
              </p>
            </div>

            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={downloadModelName}
                onChange={(e) => setDownloadModelName(e.target.value)}
                placeholder={t('ollamaSettings.download.placeholder', 'e.g., llama3.2, codellama')}
                className="flex-1 px-3 py-2 rounded-lg border border-[var(--td-border-level-1-color)] text-sm"
              />
              <Button
                onClick={downloadModel}
                disabled={!downloadModelName.trim() || downloading}
              >
                {downloading ? <Loader2 className="animate-spin mr-1" size={14} /> : <Download size={14} className="mr-1" />}
                {t('ollamaSettings.download.download', 'Download')}
              </Button>
            </div>

            {downloadProgress > 0 && (
              <div className="mb-3">
                <div className="flex justify-between text-xs mb-1">
                  <span>Downloading {downloadModelName}</span>
                  <span>{downloadProgress.toFixed(1)}%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[var(--td-brand-color)] transition-all"
                    style={{ width: `${downloadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Installed Models */}
        {connectionStatus === true && (
          <div className="bg-white rounded-lg border border-[var(--td-border-level-1-color)] p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-medium text-sm mb-1">
                  {t('ollamaSettings.installed.title', 'Installed Models')}
                </h3>
                <p className="text-xs text-[var(--td-text-color-secondary)]">
                  {t('ollamaSettings.installed.desc', 'Models available on your Ollama server')}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={onRefresh}>
                <RefreshCw size={14} className="mr-1" />
                {t('common.refresh', 'Refresh')}
              </Button>
            </div>
            <p className="text-sm text-[var(--td-text-color-placeholder)]">
              Model list would be displayed here
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
