import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Loader2, AlertCircle, HardDrive, Cloud, Database } from 'lucide-react'
import {
  getStorageEngineConfig,
  updateStorageEngineConfig,
  getStorageEngineStatus,
  checkStorageEngine,
  type StorageEngineConfig,
  type CheckStorageEngineResult,
} from '@/api/system'

const DEFAULT_CONFIG = (): StorageEngineConfig => ({
  default_provider: 'local',
  local: { path_prefix: '' },
  minio: {
    mode: 'docker',
    endpoint: '',
    access_key_id: '',
    secret_access_key: '',
    bucket_name: '',
    use_ssl: false,
    path_prefix: '',
  },
  cos: { secret_id: '', secret_key: '', region: '', bucket_name: '', app_id: '', path_prefix: '' },
  tos: { endpoint: '', region: '', access_key: '', secret_key: '', bucket_name: '', path_prefix: '' },
  s3: { endpoint: '', region: '', access_key: '', secret_key: '', bucket_name: '', path_prefix: '' },
  oss: {
    endpoint: '',
    region: '',
    access_key: '',
    secret_key: '',
    bucket_name: '',
    path_prefix: '',
    use_temp_bucket: false,
    temp_bucket_name: '',
    temp_region: '',
  },
  ks3: { endpoint: '', region: '', access_key: '', secret_key: '', bucket_name: '', path_prefix: '' },
})

interface CheckState {
  loading: boolean
  result: CheckStorageEngineResult | null
}

const ENGINE_META: Record<
  string,
  { labelKey: string; descKey: string; icon: React.ReactNode }
> = {
  local: {
    labelKey: 'settings.storage.localTitle',
    descKey: 'settings.storage.localDesc',
    icon: <HardDrive size={20} />,
  },
  minio: {
    labelKey: 'MinIO',
    descKey: 'settings.storage.minioDesc',
    icon: <Database size={20} />,
  },
  cos: {
    labelKey: 'settings.storage.cosTitle',
    descKey: 'settings.storage.cosDesc',
    icon: <Cloud size={20} />,
  },
  tos: {
    labelKey: 'settings.storage.tosTitle',
    descKey: 'settings.storage.tosDesc',
    icon: <Cloud size={20} />,
  },
  s3: {
    labelKey: 'AWS S3',
    descKey: 'settings.storage.s3Desc',
    icon: <Cloud size={20} />,
  },
  oss: {
    labelKey: 'settings.storage.ossTitle',
    descKey: 'settings.storage.ossDesc',
    icon: <Cloud size={20} />,
  },
  ks3: {
    labelKey: 'settings.storage.ks3Title',
    descKey: 'settings.storage.ks3Desc',
    icon: <Cloud size={20} />,
  },
}

export function StorageEngineSettings() {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [config, setConfig] = useState<StorageEngineConfig>(DEFAULT_CONFIG())
  const [allowedProviders, setAllowedProviders] = useState<string[] | null>(null)
  const [minioEnvAvailable, setMinioEnvAvailable] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [drawerVisible, setDrawerVisible] = useState(false)
  const [currentEngine, setCurrentEngine] = useState<string | null>(null)

  const [checkStates, setCheckStates] = useState<Record<string, CheckState>>({
    minio: { loading: false, result: null },
    cos: { loading: false, result: null },
    tos: { loading: false, result: null },
    s3: { loading: false, result: null },
    oss: { loading: false, result: null },
    ks3: { loading: false, result: null },
  })

  useEffect(() => {
    loadAll()
  }, [])

  function isProviderAllowed(provider: string) {
    if (allowedProviders === null) return true
    return allowedProviders.includes(provider)
  }

  function ensureAllowedDefaultProvider() {
    if (isProviderAllowed(config.default_provider)) return
    setConfig((prev) => ({
      ...prev,
      default_provider: allowedProviders?.[0] || 'local',
    }))
  }

  async function loadConfig() {
    try {
      const res = await getStorageEngineConfig()
      const d = res?.data
      if (d) {
        setConfig({
          default_provider: d.default_provider || 'local',
          local: d.local ? { path_prefix: d.local.path_prefix || '' } : { path_prefix: '' },
          minio: d.minio
            ? {
                mode: d.minio.mode || 'docker',
                endpoint: d.minio.endpoint || '',
                access_key_id: d.minio.access_key_id || '',
                secret_access_key: d.minio.secret_access_key || '',
                bucket_name: d.minio.bucket_name || '',
                use_ssl: d.minio.use_ssl ?? false,
                path_prefix: d.minio.path_prefix || '',
              }
            : DEFAULT_CONFIG().minio,
          cos: d.cos
            ? {
                secret_id: d.cos.secret_id || '',
                secret_key: d.cos.secret_key || '',
                region: d.cos.region || '',
                bucket_name: d.cos.bucket_name || '',
                app_id: d.cos.app_id || '',
                path_prefix: d.cos.path_prefix || '',
              }
            : DEFAULT_CONFIG().cos,
          tos: d.tos
            ? {
                endpoint: d.tos.endpoint || '',
                region: d.tos.region || '',
                access_key: d.tos.access_key || '',
                secret_key: d.tos.secret_key || '',
                bucket_name: d.tos.bucket_name || '',
                path_prefix: d.tos.path_prefix || '',
              }
            : DEFAULT_CONFIG().tos,
          s3: d.s3
            ? {
                endpoint: d.s3.endpoint || '',
                region: d.s3.region || '',
                access_key: d.s3.access_key || '',
                secret_key: d.s3.secret_key || '',
                bucket_name: d.s3.bucket_name || '',
                path_prefix: d.s3.path_prefix || '',
              }
            : DEFAULT_CONFIG().s3,
          oss: d.oss
            ? {
                endpoint: d.oss.endpoint || '',
                region: d.oss.region || '',
                access_key: d.oss.access_key || '',
                secret_key: d.oss.secret_key || '',
                bucket_name: d.oss.bucket_name || '',
                path_prefix: d.oss.path_prefix || '',
                use_temp_bucket: d.oss.use_temp_bucket ?? false,
                temp_bucket_name: d.oss.temp_bucket_name || '',
                temp_region: d.oss.temp_region || '',
              }
            : DEFAULT_CONFIG().oss,
          ks3: d.ks3
            ? {
                endpoint: d.ks3.endpoint || '',
                region: d.ks3.region || '',
                access_key: d.ks3.access_key || '',
                secret_key: d.ks3.secret_key || '',
                bucket_name: d.ks3.bucket_name || '',
                path_prefix: d.ks3.path_prefix || '',
              }
            : DEFAULT_CONFIG().ks3,
        })
      }
    } catch {
      setConfig(DEFAULT_CONFIG())
    }
  }

  async function loadStatus() {
    try {
      const res = await getStorageEngineStatus()
      const engines = res?.engines ?? []
      setAllowedProviders(
        res?.allowed_providers?.length
          ? res.allowed_providers
          : engines.filter((e) => e.allowed !== false).map((e) => e.name)
      )
      setMinioEnvAvailable(res?.minio_env_available ?? false)
    } catch {
      setAllowedProviders(['local', 'minio', 'cos', 'tos', 's3', 'oss'])
      setMinioEnvAvailable(false)
    }
  }

  async function loadAll() {
    setLoading(true)
    setError('')
    try {
      await loadConfig()
      await loadStatus()
      ensureAllowedDefaultProvider()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t('settings.storage.loadFailed'))
    } finally {
      setLoading(false)
    }
  }

  function openDrawer(engine: string) {
    if (!isProviderAllowed(engine)) return
    setCurrentEngine(engine)
    setDrawerVisible(true)
    setSaveMessage('')
    setCheckStates({
      minio: { loading: false, result: null },
      cos: { loading: false, result: null },
      tos: { loading: false, result: null },
      s3: { loading: false, result: null },
      oss: { loading: false, result: null },
      ks3: { loading: false, result: null },
    })
  }

  function buildPayload(): StorageEngineConfig {
    const mode = config.minio?.mode || 'docker'
    return {
      default_provider: config.default_provider || 'local',
      local: { path_prefix: (config.local?.path_prefix || '').trim() },
      minio: {
        mode,
        endpoint: mode === 'remote' ? (config.minio?.endpoint || '').trim() : '',
        access_key_id: mode === 'remote' ? (config.minio?.access_key_id || '').trim() : '',
        secret_access_key: mode === 'remote' ? (config.minio?.secret_access_key || '').trim() : '',
        bucket_name: (config.minio?.bucket_name || '').trim(),
        use_ssl: config.minio?.use_ssl ?? false,
        path_prefix: (config.minio?.path_prefix || '').trim(),
      },
      cos: {
        secret_id: (config.cos?.secret_id || '').trim(),
        secret_key: (config.cos?.secret_key || '').trim(),
        region: (config.cos?.region || '').trim(),
        bucket_name: (config.cos?.bucket_name || '').trim(),
        app_id: (config.cos?.app_id || '').trim(),
        path_prefix: (config.cos?.path_prefix || '').trim(),
      },
      tos: {
        endpoint: (config.tos?.endpoint || '').trim(),
        region: (config.tos?.region || '').trim(),
        access_key: (config.tos?.access_key || '').trim(),
        secret_key: (config.tos?.secret_key || '').trim(),
        bucket_name: (config.tos?.bucket_name || '').trim(),
        path_prefix: (config.tos?.path_prefix || '').trim(),
      },
      s3: {
        endpoint: (config.s3?.endpoint || '').trim(),
        region: (config.s3?.region || '').trim(),
        access_key: (config.s3?.access_key || '').trim(),
        secret_key: (config.s3?.secret_key || '').trim(),
        bucket_name: (config.s3?.bucket_name || '').trim(),
        path_prefix: (config.s3?.path_prefix || '').trim(),
      },
      oss: {
        endpoint: (config.oss?.endpoint || '').trim(),
        region: (config.oss?.region || '').trim(),
        access_key: (config.oss?.access_key || '').trim(),
        secret_key: (config.oss?.secret_key || '').trim(),
        bucket_name: (config.oss?.bucket_name || '').trim(),
        path_prefix: (config.oss?.path_prefix || '').trim(),
        use_temp_bucket: config.oss?.use_temp_bucket ?? false,
        temp_bucket_name: (config.oss?.temp_bucket_name || '').trim(),
        temp_region: (config.oss?.temp_region || '').trim(),
      },
      ks3: {
        endpoint: (config.ks3?.endpoint || '').trim(),
        region: (config.ks3?.region || '').trim(),
        access_key: (config.ks3?.access_key || '').trim(),
        secret_key: (config.ks3?.secret_key || '').trim(),
        bucket_name: (config.ks3?.bucket_name || '').trim(),
        path_prefix: (config.ks3?.path_prefix || '').trim(),
      },
    }
  }

  async function onSave() {
    setSaving(true)
    setSaveMessage('')
    try {
      ensureAllowedDefaultProvider()
      await updateStorageEngineConfig(buildPayload())
      await loadStatus()
      ensureAllowedDefaultProvider()
      setSaveSuccess(true)
      setSaveMessage(t('settings.storage.saveSuccess'))
      setDrawerVisible(false)
    } catch (e: unknown) {
      setSaveSuccess(false)
      setSaveMessage(e instanceof Error ? e.message : t('settings.storage.saveFailed'))
    } finally {
      setSaving(false)
    }
  }

  async function onCheck(provider: string) {
    setCheckStates((prev) => ({
      ...prev,
      [provider]: { loading: true, result: null },
    }))
    try {
      const payload = buildPayload()
      const res = await checkStorageEngine({
        provider,
        minio: payload.minio,
        cos: payload.cos,
        tos: payload.tos,
        s3: payload.s3,
        oss: payload.oss,
        ks3: payload.ks3,
      })
      setCheckStates((prev) => ({
        ...prev,
        [provider]: { loading: false, result: res?.data ?? { ok: false, message: t('settings.storage.unknownError') } },
      }))
    } catch (e: unknown) {
      setCheckStates((prev) => ({
        ...prev,
        [provider]: {
          loading: false,
          result: { ok: false, message: e instanceof Error ? e.message : t('settings.storage.requestFailed') },
        },
      }))
    }
  }

  const currentCheckState = currentEngine ? checkStates[currentEngine] || { loading: false, result: null } : { loading: false, result: null }

  const drawerTitle = currentEngine
    ? ENGINE_META[currentEngine]?.labelKey.startsWith('settings.')
      ? t(ENGINE_META[currentEngine].labelKey)
      : ENGINE_META[currentEngine]?.labelKey || currentEngine
    : ''

  const providerOptions = [
    { value: 'local', label: t('settings.storage.engineLocal'), allowed: isProviderAllowed('local') },
    { value: 'minio', label: 'MinIO', allowed: isProviderAllowed('minio') },
    { value: 'cos', label: t('settings.storage.engineCos'), allowed: isProviderAllowed('cos') },
    { value: 'tos', label: t('settings.storage.engineTos'), allowed: isProviderAllowed('tos') },
    { value: 's3', label: 'AWS S3', allowed: isProviderAllowed('s3') },
    { value: 'oss', label: t('settings.storage.engineOss'), allowed: isProviderAllowed('oss') },
    { value: 'ks3', label: t('settings.storage.engineKs3'), allowed: isProviderAllowed('ks3') },
  ]

  function updateMinioMode(mode: 'docker' | 'remote') {
    setConfig((prev) => ({
      ...prev,
      minio: { ...prev.minio, mode },
    }))
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="section-header">
          <h2 className="text-lg font-medium">{t('settings.storage.title')}</h2>
          <p className="text-sm text-[var(--td-text-color-secondary)] mt-1">
            {t('settings.storage.description')}
          </p>
        </div>
        <div className="flex items-center justify-center gap-2 py-12">
          <Loader2 size={20} className="animate-spin text-[var(--td-brand-color)]" />
          <span className="text-sm text-[var(--td-text-color-secondary)]">
            {t('settings.storage.loading')}
          </span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="section-header">
          <h2 className="text-lg font-medium">{t('settings.storage.title')}</h2>
          <p className="text-sm text-[var(--td-text-color-secondary)] mt-1">
            {t('settings.storage.description')}
          </p>
        </div>
        <div className="flex items-center gap-2 py-4">
          <AlertCircle size={16} className="text-red-500" />
          <span className="text-sm text-red-500">{error}</span>
          <Button variant="ghost" size="sm" onClick={loadAll}>
            {t('settings.storage.retry')}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="section-header">
        <h2 className="text-lg font-medium">{t('settings.storage.title')}</h2>
        <p className="text-sm text-[var(--td-text-color-secondary)] mt-1">
          {t('settings.storage.description')}
        </p>
      </div>

      <div className="py-4 border-b border-[var(--td-component-stroke)]">
        <div className="flex items-center justify-between">
          <div className="flex-1 max-w-[65%]">
            <label className="text-sm font-medium block mb-1">{t('settings.storage.defaultEngine')}</label>
            <p className="text-xs text-[var(--td-text-color-secondary)]">
              {t('settings.storage.defaultEngineDesc')}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={config.default_provider}
              disabled={!allowedProviders?.length}
              onChange={(e) => {
                setConfig((prev) => ({ ...prev, default_provider: e.target.value }))
                updateStorageEngineConfig({ ...buildPayload(), default_provider: e.target.value }).catch(() => {})
              }}
              className="h-10 px-3 rounded border border-[var(--td-border-level-1-color)] text-sm bg-white min-w-[200px]"
            >
              {providerOptions.map((opt) => (
                <option key={opt.value} value={opt.value} disabled={!opt.allowed}>
                  {opt.label}
                </option>
              ))}
            </select>
            {saveMessage && !drawerVisible && (
              <span className={`text-sm ${saveSuccess ? 'text-[var(--td-success-color)]' : 'text-[var(--td-error-color)]'}`}>
                {saveMessage}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        {(['local', 'minio', 'cos', 'tos', 's3', 'oss', 'ks3'] as const).map((engine) => {
          if (!isProviderAllowed(engine)) return null
          const meta = ENGINE_META[engine]
          const isActive = drawerVisible && currentEngine === engine
          const computedMinioAvailable =
            config.minio?.mode === 'remote'
              ? !!(config.minio?.endpoint && config.minio?.access_key_id && config.minio?.secret_access_key)
              : minioEnvAvailable

          return (
            <div
              key={engine}
              className={`border rounded-lg p-4 cursor-pointer transition-all hover:border-[var(--td-brand-color)] ${
                isActive
                  ? 'border-[var(--td-brand-color)] bg-[var(--td-brand-color)]/5'
                  : 'border-[var(--td-component-stroke)] bg-white'
              }`}
              onClick={() => openDrawer(engine)}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {meta.icon}
                  <h3 className="text-sm font-semibold">
                    {meta.labelKey.startsWith('settings.') ? t(meta.labelKey) : meta.labelKey}
                  </h3>
                </div>
                {engine === 'local' ? (
                  <span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-700">
                    {t('settings.storage.available')}
                  </span>
                ) : engine === 'minio' ? (
                  <span className={`text-xs px-2 py-0.5 rounded ${computedMinioAvailable ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                    {computedMinioAvailable ? t('settings.storage.available') : t('settings.storage.needsConfig')}
                  </span>
                ) : (
                  <span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-700">
                    {t('settings.storage.configurable')}
                  </span>
                )}
              </div>
              <p className="text-xs text-[var(--td-text-color-secondary)] line-clamp-2">
                {t(meta.descKey)}
              </p>
            </div>
          )
        })}
      </div>

      <Sheet open={drawerVisible} onOpenChange={setDrawerVisible}>
        <SheetContent side="right" className="w-[500px] sm:max-w-[500px]">
          <SheetHeader>
            <SheetTitle>{drawerTitle}</SheetTitle>
          </SheetHeader>

          <div className="mt-6 space-y-4 overflow-y-auto max-h-[calc(100vh-180px)] pr-2">
            {currentEngine === 'local' && (
              <div className="space-y-4">
                <p className="text-sm text-[var(--td-text-color-secondary)]">{t('settings.storage.localDesc')}</p>
                <div>
                  <label className="block text-sm font-medium mb-2">{t('settings.storage.pathPrefix')}</label>
                  <Input
                    value={config.local.path_prefix}
                    onChange={(e) => setConfig((prev) => ({ ...prev, local: { path_prefix: e.target.value } }))}
                    placeholder={t('settings.storage.pathPrefixPlaceholder')}
                  />
                </div>
              </div>
            )}

            {currentEngine === 'minio' && (
              <div className="space-y-4">
                <p className="text-sm text-[var(--td-text-color-secondary)]">{t('settings.storage.minioDesc')}</p>

                <div className="flex gap-2">
                  <div
                    className={`flex-1 flex items-center gap-2 px-4 py-2 border rounded cursor-pointer transition-all ${
                      config.minio.mode !== 'remote'
                        ? 'border-[var(--td-brand-color)] bg-[var(--td-brand-color)]/5'
                        : 'border-[var(--td-component-stroke)] bg-[var(--td-bg-color-secondarycontainer)]'
                    }`}
                    onClick={() => updateMinioMode('docker')}
                  >
                    <span className="text-sm font-medium">{t('settings.storage.minioDocker')}</span>
                    {minioEnvAvailable ? (
                      <span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-700">{t('settings.storage.detected')}</span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">{t('settings.storage.notDetected')}</span>
                    )}
                  </div>
                  <div
                    className={`flex-1 flex items-center gap-2 px-4 py-2 border rounded cursor-pointer transition-all ${
                      config.minio.mode === 'remote'
                        ? 'border-[var(--td-brand-color)] bg-[var(--td-brand-color)]/5'
                        : 'border-[var(--td-component-stroke)] bg-[var(--td-bg-color-secondarycontainer)]'
                    }`}
                    onClick={() => updateMinioMode('remote')}
                  >
                    <span className="text-sm font-medium">{t('settings.storage.minioRemote')}</span>
                  </div>
                </div>

                {config.minio.mode !== 'remote' ? (
                  <div className="space-y-4">
                    <div className={`text-sm px-4 py-3 rounded border ${minioEnvAvailable ? 'bg-[var(--td-success-color-light)] border-[var(--td-success-color-focus)]' : 'bg-[var(--td-bg-color-secondarycontainer)] border-[var(--td-component-stroke)]'}`}>
                      {minioEnvAvailable
                        ? t('settings.storage.minioDockerDetected')
                        : t('settings.storage.minioDockerNotDetected')}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">{t('settings.storage.bucketName')}</label>
                      <Input
                        value={config.minio.bucket_name}
                        onChange={(e) => setConfig((prev) => ({ ...prev, minio: { ...prev.minio, bucket_name: e.target.value } }))}
                        placeholder={t('settings.storage.bucketPlaceholder')}
                        disabled={!minioEnvAvailable}
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="text-sm font-medium">Use SSL</label>
                      <input
                        type="checkbox"
                        checked={config.minio.use_ssl}
                        onChange={(e) => setConfig((prev) => ({ ...prev, minio: { ...prev.minio, use_ssl: e.target.checked } }))}
                        className="rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">{t('settings.storage.pathPrefix')}</label>
                      <Input
                        value={config.minio.path_prefix}
                        onChange={(e) => setConfig((prev) => ({ ...prev, minio: { ...prev.minio, path_prefix: e.target.value } }))}
                        placeholder={t('settings.storage.prefixPlaceholder')}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-sm text-[var(--td-text-color-secondary)] px-4 py-3 bg-[var(--td-bg-color-secondarycontainer)] rounded border border-[var(--td-component-stroke)]">
                      {t('settings.storage.minioRemoteHint')}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Endpoint</label>
                      <Input
                        value={config.minio.endpoint}
                        onChange={(e) => setConfig((prev) => ({ ...prev, minio: { ...prev.minio, endpoint: e.target.value } }))}
                        placeholder="e.g. minio.example.com:9000"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Access Key ID</label>
                      <Input
                        value={config.minio.access_key_id}
                        onChange={(e) => setConfig((prev) => ({ ...prev, minio: { ...prev.minio, access_key_id: e.target.value } }))}
                        placeholder="MinIO Access Key"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Secret Access Key</label>
                      <Input
                        type="password"
                        value={config.minio.secret_access_key}
                        onChange={(e) => setConfig((prev) => ({ ...prev, minio: { ...prev.minio, secret_access_key: e.target.value } }))}
                        placeholder="MinIO Secret Key"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">{t('settings.storage.bucketName')}</label>
                      <Input
                        value={config.minio.bucket_name}
                        onChange={(e) => setConfig((prev) => ({ ...prev, minio: { ...prev.minio, bucket_name: e.target.value } }))}
                        placeholder={t('settings.storage.bucketPlaceholder')}
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="text-sm font-medium">Use SSL</label>
                      <input
                        type="checkbox"
                        checked={config.minio.use_ssl}
                        onChange={(e) => setConfig((prev) => ({ ...prev, minio: { ...prev.minio, use_ssl: e.target.checked } }))}
                        className="rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">{t('settings.storage.pathPrefix')}</label>
                      <Input
                        value={config.minio.path_prefix}
                        onChange={(e) => setConfig((prev) => ({ ...prev, minio: { ...prev.minio, path_prefix: e.target.value } }))}
                        placeholder={t('settings.storage.prefixPlaceholder')}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {currentEngine === 'cos' && (
              <div className="space-y-4">
                <p className="text-sm text-[var(--td-text-color-secondary)]">
                  {t('settings.storage.cosDesc')}
                </p>
                <div>
                  <label className="block text-sm font-medium mb-2">Secret ID</label>
                  <Input
                    value={config.cos.secret_id}
                    onChange={(e) => setConfig((prev) => ({ ...prev, cos: { ...prev.cos, secret_id: e.target.value } }))}
                    placeholder={t('settings.storage.cosSecretIdPlaceholder')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Secret Key</label>
                  <Input
                    type="password"
                    value={config.cos.secret_key}
                    onChange={(e) => setConfig((prev) => ({ ...prev, cos: { ...prev.cos, secret_key: e.target.value } }))}
                    placeholder={t('settings.storage.cosSecretKeyPlaceholder')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Region</label>
                  <Input
                    value={config.cos.region}
                    onChange={(e) => setConfig((prev) => ({ ...prev, cos: { ...prev.cos, region: e.target.value } }))}
                    placeholder="e.g. ap-guangzhou"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">{t('settings.storage.bucketName')}</label>
                  <Input
                    value={config.cos.bucket_name}
                    onChange={(e) => setConfig((prev) => ({ ...prev, cos: { ...prev.cos, bucket_name: e.target.value } }))}
                    placeholder={t('settings.storage.bucketPlaceholder')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">App ID</label>
                  <Input
                    value={config.cos.app_id}
                    onChange={(e) => setConfig((prev) => ({ ...prev, cos: { ...prev.cos, app_id: e.target.value } }))}
                    placeholder={t('settings.storage.cosAppIdPlaceholder')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">{t('settings.storage.pathPrefix')}</label>
                  <Input
                    value={config.cos.path_prefix}
                    onChange={(e) => setConfig((prev) => ({ ...prev, cos: { ...prev.cos, path_prefix: e.target.value } }))}
                    placeholder={t('settings.storage.prefixPlaceholder')}
                  />
                </div>
              </div>
            )}

            {currentEngine === 'tos' && (
              <div className="space-y-4">
                <p className="text-sm text-[var(--td-text-color-secondary)]">
                  {t('settings.storage.tosDesc')}
                </p>
                <div>
                  <label className="block text-sm font-medium mb-2">Endpoint</label>
                  <Input
                    value={config.tos.endpoint}
                    onChange={(e) => setConfig((prev) => ({ ...prev, tos: { ...prev.tos, endpoint: e.target.value } }))}
                    placeholder="e.g. https://tos-cn-beijing.volces.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Region</label>
                  <Input
                    value={config.tos.region}
                    onChange={(e) => setConfig((prev) => ({ ...prev, tos: { ...prev.tos, region: e.target.value } }))}
                    placeholder="e.g. cn-beijing"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Access Key</label>
                  <Input
                    value={config.tos.access_key}
                    onChange={(e) => setConfig((prev) => ({ ...prev, tos: { ...prev.tos, access_key: e.target.value } }))}
                    placeholder={t('settings.storage.tosAccessKeyPlaceholder')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Secret Key</label>
                  <Input
                    type="password"
                    value={config.tos.secret_key}
                    onChange={(e) => setConfig((prev) => ({ ...prev, tos: { ...prev.tos, secret_key: e.target.value } }))}
                    placeholder={t('settings.storage.tosSecretKeyPlaceholder')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">{t('settings.storage.bucketName')}</label>
                  <Input
                    value={config.tos.bucket_name}
                    onChange={(e) => setConfig((prev) => ({ ...prev, tos: { ...prev.tos, bucket_name: e.target.value } }))}
                    placeholder={t('settings.storage.bucketPlaceholder')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">{t('settings.storage.pathPrefix')}</label>
                  <Input
                    value={config.tos.path_prefix}
                    onChange={(e) => setConfig((prev) => ({ ...prev, tos: { ...prev.tos, path_prefix: e.target.value } }))}
                    placeholder={t('settings.storage.prefixPlaceholder')}
                  />
                </div>
              </div>
            )}

            {currentEngine === 's3' && (
              <div className="space-y-4">
                <p className="text-sm text-[var(--td-text-color-secondary)]">
                  {t('settings.storage.s3Desc')}
                </p>
                <div>
                  <label className="block text-sm font-medium mb-2">Endpoint</label>
                  <Input
                    value={config.s3.endpoint}
                    onChange={(e) => setConfig((prev) => ({ ...prev, s3: { ...prev.s3, endpoint: e.target.value } }))}
                    placeholder="e.g. https://s3.amazonaws.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Region</label>
                  <Input
                    value={config.s3.region}
                    onChange={(e) => setConfig((prev) => ({ ...prev, s3: { ...prev.s3, region: e.target.value } }))}
                    placeholder="e.g. us-east-1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Access Key</label>
                  <Input
                    value={config.s3.access_key}
                    onChange={(e) => setConfig((prev) => ({ ...prev, s3: { ...prev.s3, access_key: e.target.value } }))}
                    placeholder={t('settings.storage.s3AccessKeyPlaceholder')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Secret Key</label>
                  <Input
                    type="password"
                    value={config.s3.secret_key}
                    onChange={(e) => setConfig((prev) => ({ ...prev, s3: { ...prev.s3, secret_key: e.target.value } }))}
                    placeholder={t('settings.storage.s3SecretKeyPlaceholder')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">{t('settings.storage.bucketName')}</label>
                  <Input
                    value={config.s3.bucket_name}
                    onChange={(e) => setConfig((prev) => ({ ...prev, s3: { ...prev.s3, bucket_name: e.target.value } }))}
                    placeholder={t('settings.storage.bucketPlaceholder')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">{t('settings.storage.pathPrefix')}</label>
                  <Input
                    value={config.s3.path_prefix}
                    onChange={(e) => setConfig((prev) => ({ ...prev, s3: { ...prev.s3, path_prefix: e.target.value } }))}
                    placeholder={t('settings.storage.prefixPlaceholder')}
                  />
                </div>
              </div>
            )}

            {currentEngine === 'oss' && (
              <div className="space-y-4">
                <p className="text-sm text-[var(--td-text-color-secondary)]">
                  {t('settings.storage.ossDesc')}
                </p>
                <div>
                  <label className="block text-sm font-medium mb-2">Endpoint</label>
                  <Input
                    value={config.oss.endpoint}
                    onChange={(e) => setConfig((prev) => ({ ...prev, oss: { ...prev.oss, endpoint: e.target.value } }))}
                    placeholder="e.g. https://oss-cn-hangzhou.aliyuncs.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Region</label>
                  <Input
                    value={config.oss.region}
                    onChange={(e) => setConfig((prev) => ({ ...prev, oss: { ...prev.oss, region: e.target.value } }))}
                    placeholder="e.g. cn-hangzhou"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Access Key</label>
                  <Input
                    value={config.oss.access_key}
                    onChange={(e) => setConfig((prev) => ({ ...prev, oss: { ...prev.oss, access_key: e.target.value } }))}
                    placeholder={t('settings.storage.ossAccessKeyPlaceholder')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Secret Key</label>
                  <Input
                    type="password"
                    value={config.oss.secret_key}
                    onChange={(e) => setConfig((prev) => ({ ...prev, oss: { ...prev.oss, secret_key: e.target.value } }))}
                    placeholder={t('settings.storage.ossSecretKeyPlaceholder')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">{t('settings.storage.bucketName')}</label>
                  <Input
                    value={config.oss.bucket_name}
                    onChange={(e) => setConfig((prev) => ({ ...prev, oss: { ...prev.oss, bucket_name: e.target.value } }))}
                    placeholder={t('settings.storage.bucketPlaceholder')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">{t('settings.storage.pathPrefix')}</label>
                  <Input
                    value={config.oss.path_prefix}
                    onChange={(e) => setConfig((prev) => ({ ...prev, oss: { ...prev.oss, path_prefix: e.target.value } }))}
                    placeholder={t('settings.storage.prefixPlaceholder')}
                  />
                </div>
              </div>
            )}

            {currentEngine === 'ks3' && (
              <div className="space-y-4">
                <p className="text-sm text-[var(--td-text-color-secondary)]">
                  {t('settings.storage.ks3Desc')}
                </p>
                <div>
                  <label className="block text-sm font-medium mb-2">Endpoint</label>
                  <Input
                    value={config.ks3.endpoint}
                    onChange={(e) => setConfig((prev) => ({ ...prev, ks3: { ...prev.ks3, endpoint: e.target.value } }))}
                    placeholder={t('settings.storage.ks3EndpointPlaceholder')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Region</label>
                  <Input
                    value={config.ks3.region}
                    onChange={(e) => setConfig((prev) => ({ ...prev, ks3: { ...prev.ks3, region: e.target.value } }))}
                    placeholder={t('settings.storage.ks3RegionPlaceholder')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Access Key</label>
                  <Input
                    value={config.ks3.access_key}
                    onChange={(e) => setConfig((prev) => ({ ...prev, ks3: { ...prev.ks3, access_key: e.target.value } }))}
                    placeholder={t('settings.storage.ks3AccessKeyPlaceholder')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Secret Key</label>
                  <Input
                    type="password"
                    value={config.ks3.secret_key}
                    onChange={(e) => setConfig((prev) => ({ ...prev, ks3: { ...prev.ks3, secret_key: e.target.value } }))}
                    placeholder={t('settings.storage.ks3SecretKeyPlaceholder')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">{t('settings.storage.bucketName')}</label>
                  <Input
                    value={config.ks3.bucket_name}
                    onChange={(e) => setConfig((prev) => ({ ...prev, ks3: { ...prev.ks3, bucket_name: e.target.value } }))}
                    placeholder={t('settings.storage.bucketPlaceholder')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">{t('settings.storage.pathPrefix')}</label>
                  <Input
                    value={config.ks3.path_prefix}
                    onChange={(e) => setConfig((prev) => ({ ...prev, ks3: { ...prev.ks3, path_prefix: e.target.value } }))}
                    placeholder={t('settings.storage.prefixPlaceholder')}
                  />
                </div>
              </div>
            )}

            {currentEngine && currentEngine !== 'local' && (
              <div className="pt-4 border-t">
                <label className="block text-sm font-medium mb-2">{t('settings.storage.testConnection')}</label>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onCheck(currentEngine)}
                    disabled={currentCheckState.loading}
                  >
                    {currentCheckState.loading && <Loader2 size={14} className="mr-1 animate-spin" />}
                    {t('settings.storage.testConnection')}
                  </Button>
                  {currentCheckState.result && (
                    <span
                      className={`text-sm ${
                        currentCheckState.result.ok
                          ? currentCheckState.result.bucket_created
                            ? 'text-[var(--td-warning-color)]'
                            : 'text-[var(--td-brand-color-active)]'
                          : 'text-[var(--td-error-color)]'
                      }`}
                    >
                      {currentCheckState.result.message}
                    </span>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setDrawerVisible(false)}>
                {t('common.cancel')}
              </Button>
              <Button onClick={onSave} disabled={saving}>
                {saving && <Loader2 size={14} className="mr-1 animate-spin" />}
                {t('common.save')}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}