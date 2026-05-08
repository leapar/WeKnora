import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Loader2 } from 'lucide-react'

interface StorageEngineStatusItem {
  name: string
  available?: boolean
  allowed?: boolean
}

interface KBStorageSettingsProps {
  storageProvider?: string
  hasFiles?: boolean
  onUpdate?: (provider: string) => void
  onGoToGlobalSettings?: () => void
}

interface EngineOption {
  value: string
  label: string
  desc: string
  allowed: boolean
  available: boolean
  disabled: boolean
}

export function KBStorageSettings({
  storageProvider = 'local',
  hasFiles = false,
  onUpdate,
  onGoToGlobalSettings,
}: KBStorageSettingsProps) {
  const { t } = useTranslation()

  const [localProvider, setLocalProvider] = useState(storageProvider || 'local')
  const [loading, setLoading] = useState(true)
  const [engineStatus, setEngineStatus] = useState<StorageEngineStatusItem[]>([])
  const [defaultProvider, setDefaultProvider] = useState('local')

  const engineOptions: EngineOption[] = [
    {
      value: 'local',
      label: t('kbSettings.storage.engineLocal', 'Local Storage'),
      desc: t('kbSettings.storage.engineLocalDesc', 'Store files on local filesystem'),
      allowed: true,
      available: true,
      disabled: false,
    },
    {
      value: 'minio',
      label: 'MinIO',
      desc: t('kbSettings.storage.engineMinioDesc', 'S3-compatible object storage'),
      allowed: engineStatus.find(e => e.name === 'minio')?.allowed !== false,
      available: engineStatus.find(e => e.name === 'minio')?.available ?? false,
      disabled: engineStatus.find(e => e.name === 'minio')?.allowed === false || engineStatus.find(e => e.name === 'minio')?.available === false,
    },
    {
      value: 'cos',
      label: t('kbSettings.storage.engineCos', 'COS'),
      desc: t('kbSettings.storage.engineCosDesc', 'Tencent Cloud Object Storage'),
      allowed: engineStatus.find(e => e.name === 'cos')?.allowed !== false,
      available: engineStatus.find(e => e.name === 'cos')?.available ?? false,
      disabled: engineStatus.find(e => e.name === 'cos')?.allowed === false || engineStatus.find(e => e.name === 'cos')?.available === false,
    },
    {
      value: 'tos',
      label: t('kbSettings.storage.engineTos', 'TOS'),
      desc: t('kbSettings.storage.engineTosDesc', 'ByteDance Object Storage'),
      allowed: engineStatus.find(e => e.name === 'tos')?.allowed !== false,
      available: engineStatus.find(e => e.name === 'tos')?.available ?? false,
      disabled: engineStatus.find(e => e.name === 'tos')?.allowed === false || engineStatus.find(e => e.name === 'tos')?.available === false,
    },
    {
      value: 's3',
      label: t('kbSettings.storage.engineS3', 'S3'),
      desc: t('kbSettings.storage.engineS3Desc', 'AWS S3 Compatible Storage'),
      allowed: engineStatus.find(e => e.name === 's3')?.allowed !== false,
      available: engineStatus.find(e => e.name === 's3')?.available ?? false,
      disabled: engineStatus.find(e => e.name === 's3')?.allowed === false || engineStatus.find(e => e.name === 's3')?.available === false,
    },
    {
      value: 'oss',
      label: t('kbSettings.storage.engineOss', 'OSS'),
      desc: t('kbSettings.storage.engineOssDesc', 'Alibaba Cloud Object Storage'),
      allowed: engineStatus.find(e => e.name === 'oss')?.allowed !== false,
      available: engineStatus.find(e => e.name === 'oss')?.available ?? false,
      disabled: engineStatus.find(e => e.name === 'oss')?.allowed === false || engineStatus.find(e => e.name === 'oss')?.available === false,
    },
    {
      value: 'ks3',
      label: t('kbSettings.storage.engineKs3', 'KS3'),
      desc: t('kbSettings.storage.engineKs3Desc', 'Kuaishou Object Storage'),
      allowed: engineStatus.find(e => e.name === 'ks3')?.allowed !== false,
      available: engineStatus.find(e => e.name === 'ks3')?.available ?? false,
      disabled: engineStatus.find(e => e.name === 'ks3')?.allowed === false || engineStatus.find(e => e.name === 'ks3')?.available === false,
    },
  ]

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    setLocalProvider(storageProvider || defaultProvider || 'local')
  }, [storageProvider, defaultProvider])

  const load = async () => {
    setLoading(true)
    try {
      // In production:
      // const [configRes, statusRes] = await Promise.all([
      //   getStorageEngineConfig(),
      //   getStorageEngineStatus(),
      // ])
      // setEngineStatus(statusRes?.data?.engines || [])
      // setDefaultProvider(configRes?.data?.default_provider || 'local')
      setEngineStatus([])
      setDefaultProvider('local')
    } catch {
      setEngineStatus([])
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (value: string) => {
    setLocalProvider(value)
    onUpdate?.(value)
  }

  const selectedOption = engineOptions.find(o => o.value === localProvider)
  const showGoSettings = engineOptions.some(o => o.disabled)

  return (
    <div className="kb-storage-settings">
      <div className="section-header mb-6">
        <h2 className="text-lg font-medium">{t('kbSettings.storage.title', 'Storage Settings')}</h2>
        <p className="text-sm text-[var(--td-text-color-secondary)] mt-1">
          {t('kbSettings.storage.description', 'Configure how files are stored for this knowledge base')}
        </p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-4 text-[var(--td-text-color-secondary)]">
          <Loader2 className="animate-spin" size={16} />
          <span>{t('kbSettings.storage.loading', 'Loading...')}</span>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="setting-row">
            <div className="setting-info">
              <label className="font-medium text-sm">
                {t('kbSettings.storage.engineLabel', 'Storage Engine')}
              </label>
              <p className="text-xs text-[var(--td-text-color-secondary)] mt-0.5">
                {t('kbSettings.storage.engineDesc', 'Choose where to store uploaded files')}
              </p>
            </div>
            <div className="setting-control">
              <select
                value={localProvider}
                onChange={(e) => handleChange(e.target.value)}
                className="w-full min-w-[220px] px-3 py-2 rounded-lg border border-[var(--td-border-level-1-color)] bg-white text-sm"
              >
                {engineOptions.map((opt) => (
                  <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                    {opt.label}
                    {opt.disabled ? ` (${t('kbSettings.storage.unavailable', 'Unavailable')})` : ''}
                  </option>
                ))}
              </select>

              {hasFiles && (
                <p className="text-xs text-yellow-600 mt-1">
                  {t('kbSettings.storage.changeWarning', 'Changing storage engine will affect existing files')}
                </p>
              )}
              {!hasFiles && selectedOption?.desc && (
                <p className="text-xs text-[var(--td-text-color-placeholder)] mt-1">
                  {selectedOption.desc}
                </p>
              )}

              {showGoSettings && (
                <button
                  onClick={onGoToGlobalSettings}
                  className="text-sm text-[var(--td-brand-color)] hover:underline mt-2"
                >
                  {t('kbSettings.storage.goGlobalSettings', 'Go to Global Storage Settings')}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
