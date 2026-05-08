import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Cloud, Link, CheckCircle } from 'lucide-react'

interface WeKnoraCloudSettingsProps {
  cloudConnected?: boolean
  cloudUrl?: string
  onConnect?: () => void
  onDisconnect?: () => void
}

export function WeKnoraCloudSettings({
  cloudConnected = false,
  cloudUrl = 'https://cloud.weknora.com',
  onConnect,
  onDisconnect,
}: WeKnoraCloudSettingsProps) {
  const { t } = useTranslation()

  return (
    <div className="weknora-cloud-settings">
      <div className="section-header mb-6">
        <h2 className="text-lg font-medium">{t('weKnoraCloudSettings.title', 'WeKnora Cloud')}</h2>
        <p className="text-sm text-[var(--td-text-color-secondary)] mt-1">
          {t('weKnoraCloudSettings.description', 'Connect to WeKnora Cloud for sync and backup')}
        </p>
      </div>

      <div className="space-y-6">
        {/* Connection Status */}
        <div className="bg-white rounded-lg border border-[var(--td-border-level-1-color)] p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <Cloud size={24} className="text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium">{t('weKnoraCloudSettings.cloudService', 'WeKnora Cloud Service')}</h3>
                <p className="text-sm text-[var(--td-text-color-secondary)]">
                  {cloudConnected ? 'Connected' : 'Not Connected'}
                </p>
              </div>
            </div>
            <span className={`px-2 py-1 text-xs rounded ${
              cloudConnected ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
            }`}>
              {cloudConnected ? t('common.connected', 'Connected') : t('common.disconnected', 'Disconnected')}
            </span>
          </div>

          {cloudConnected ? (
            <div className="space-y-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-[var(--td-text-color-secondary)] mb-1">
                  {t('weKnoraCloudSettings.cloudUrl', 'Cloud URL')}
                </p>
                <div className="flex items-center gap-2">
                  <Link size={14} className="text-[var(--td-text-color-secondary)]" />
                  <span className="text-sm font-mono">{cloudUrl}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle size={16} />
                <span>{t('weKnoraCloudSettings.syncEnabled', 'Synchronization enabled')}</span>
              </div>

              <div className="flex justify-end">
                <Button variant="outline" onClick={onDisconnect}>
                  {t('weKnoraCloudSettings.disconnect', 'Disconnect')}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-[var(--td-text-color-secondary)]">
                {t('weKnoraCloudSettings.connectHint', 'Connect to WeKnora Cloud to sync your knowledge bases and settings across devices.')}
              </p>

              <div className="flex gap-3">
                <Button onClick={onConnect}>
                  <Cloud size={16} className="mr-2" />
                  {t('weKnoraCloudSettings.connect', 'Connect to Cloud')}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Features */}
        <div className="bg-white rounded-lg border border-[var(--td-border-level-1-color)] p-6">
          <h3 className="font-medium mb-4">{t('weKnoraCloudSettings.features', 'Cloud Features')}</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium mb-1">{t('weKnoraCloudSettings.syncKnowledge', 'Knowledge Sync')}</h4>
              <p className="text-xs text-[var(--td-text-color-secondary)]">
                Sync knowledge bases across devices
              </p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium mb-1">{t('weKnoraCloudSettings.backup', 'Auto Backup')}</h4>
              <p className="text-xs text-[var(--td-text-color-secondary)]">
                Automatic backup of all data
              </p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium mb-1">{t('weKnoraCloudSettings.teamSync', 'Team Sync')}</h4>
              <p className="text-xs text-[var(--td-text-color-secondary)]">
                Share with team members
              </p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium mb-1">{t('weKnoraCloudSettings.remoteAccess', 'Remote Access')}</h4>
              <p className="text-xs text-[var(--td-text-color-secondary)]">
                Access from anywhere
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
