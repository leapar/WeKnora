import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Loader2, RefreshCw, CheckCircle } from 'lucide-react'

interface SystemInfoProps {
  version?: string
  environment?: string
  database?: string
  vectorStore?: string
  lastUpdated?: string
  onRefresh?: () => void
}

export function SystemInfo({
  version = '1.0.0',
  environment = 'production',
  database = 'PostgreSQL',
  vectorStore = 'Milvus',
  lastUpdated,
  onRefresh,
}: SystemInfoProps) {
  const { t } = useTranslation()

  const systemInfo = [
    { label: t('systemInfo.version', 'Version'), value: version },
    { label: t('systemInfo.environment', 'Environment'), value: environment },
    { label: t('systemInfo.database', 'Database'), value: database },
    { label: t('systemInfo.vectorStore', 'Vector Store'), value: vectorStore },
  ]

  return (
    <div className="system-info">
      <div className="section-header mb-6">
        <h2 className="text-lg font-medium">{t('systemInfo.title', 'System Information')}</h2>
        <p className="text-sm text-[var(--td-text-color-secondary)] mt-1">
          {t('systemInfo.description', 'View system configuration and status')}
        </p>
      </div>

      <div className="space-y-6">
        {/* System Status */}
        <div className="bg-white rounded-lg border border-[var(--td-border-level-1-color)] p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium">{t('systemInfo.systemStatus', 'System Status')}</h3>
            <Button variant="outline" size="sm" onClick={onRefresh}>
              {onRefresh ? <RefreshCw size={14} className="mr-1" /> : <Loader2 size={14} className="animate-spin mr-1" />}
              {t('common.refresh', 'Refresh')}
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {systemInfo.map((item) => (
              <div key={item.label} className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-[var(--td-text-color-secondary)] mb-1">{item.label}</p>
                <p className="font-medium">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Health Status */}
        <div className="bg-white rounded-lg border border-[var(--td-border-level-1-color)] p-4">
          <h3 className="font-medium mb-4">{t('systemInfo.healthStatus', 'Health Status')}</h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle size={16} className="text-green-500" />
                <span className="text-sm">{t('systemInfo.api', 'API Server')}</span>
              </div>
              <span className="px-2 py-0.5 text-xs rounded bg-green-100 text-green-700">
                {t('systemInfo.healthy', 'Healthy')}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle size={16} className="text-green-500" />
                <span className="text-sm">{t('systemInfo.database', 'Database')}</span>
              </div>
              <span className="px-2 py-0.5 text-xs rounded bg-green-100 text-green-700">
                {t('systemInfo.healthy', 'Healthy')}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle size={16} className="text-green-500" />
                <span className="text-sm">{t('systemInfo.vectorStore', 'Vector Store')}</span>
              </div>
              <span className="px-2 py-0.5 text-xs rounded bg-green-100 text-green-700">
                {t('systemInfo.healthy', 'Healthy')}
              </span>
            </div>
          </div>
        </div>

        {/* Last Updated */}
        {lastUpdated && (
          <p className="text-xs text-[var(--td-text-color-placeholder)] text-center">
            {t('systemInfo.lastUpdated', 'Last updated')}: {new Date(lastUpdated).toLocaleString()}
          </p>
        )}
      </div>
    </div>
  )
}
