import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { AlertCircle, Loader2 } from 'lucide-react'
import { getParserEngines, getParserEngineConfig, updateParserEngineConfig, checkParserEngines } from '@/api/system'
import type { ParserEngineInfo, ParserEngineConfig } from '@/api/system'

const DEFAULT_CONFIG: ParserEngineConfig = {
  mineru_endpoint: '',
  mineru_api_key: '',
  mineru_model: 'pipeline',
  mineru_enable_formula: true,
  mineru_enable_table: true,
  mineru_enable_ocr: true,
  mineru_language: 'ch',
  mineru_cloud_model: 'pipeline',
  mineru_cloud_enable_formula: true,
  mineru_cloud_enable_table: true,
  mineru_cloud_enable_ocr: true,
  mineru_cloud_language: 'ch',
}

const CONFIGURABLE_ENGINES = new Set(['mineru', 'mineru_cloud'])

const ENGINE_ORDER: Record<string, number> = {
  builtin: 0,
  weknoracloud: 1,
  simple: 2,
  markitdown: 3,
  mineru: 4,
  mineru_cloud: 5,
}

export function ParserEngineSettings() {
  const { t } = useTranslation()
  const [engines, setEngines] = useState<ParserEngineInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [connected, setConnected] = useState(false)
  const [drawerVisible, setDrawerVisible] = useState(false)
  const [currentEngine, setCurrentEngine] = useState<ParserEngineInfo | null>(null)
  const [config, setConfig] = useState<ParserEngineConfig>({ ...DEFAULT_CONFIG })
  const [saving, setSaving] = useState(false)
  const [checking, setChecking] = useState(false)
  const [checkMessage, setCheckMessage] = useState('')

  useEffect(() => {
    loadAll()
  }, [])

  async function loadAll() {
    setLoading(true)
    setError('')
    await Promise.all([loadEngines(), loadConfig()])
    setLoading(false)
  }

  async function loadEngines() {
    try {
      const res = await getParserEngines()
      setEngines(res?.data ?? [])
      setConnected(res?.connected ?? (res?.data?.length ?? 0) > 0)
    } catch (e: any) {
      setError(e?.message || 'Failed to load engines')
      setConnected(false)
    }
  }

  async function loadConfig() {
    try {
      const res = await getParserEngineConfig()
      const data = res?.data
      setConfig({
        mineru_endpoint: data?.mineru_endpoint ?? '',
        mineru_api_key: data?.mineru_api_key ?? '',
        mineru_model: data?.mineru_model ?? 'pipeline',
        mineru_enable_formula: data?.mineru_enable_formula ?? true,
        mineru_enable_table: data?.mineru_enable_table ?? true,
        mineru_enable_ocr: data?.mineru_enable_ocr ?? true,
        mineru_language: data?.mineru_language ?? 'ch',
        mineru_cloud_model: data?.mineru_cloud_model ?? 'pipeline',
        mineru_cloud_enable_formula: data?.mineru_cloud_enable_formula ?? true,
        mineru_cloud_enable_table: data?.mineru_cloud_enable_table ?? true,
        mineru_cloud_enable_ocr: data?.mineru_cloud_enable_ocr ?? true,
        mineru_cloud_language: data?.mineru_cloud_language ?? 'ch',
      })
    } catch {
      setConfig({ ...DEFAULT_CONFIG })
    }
  }

  const sortedEngines = [...engines].sort((a, b) => {
    const oa = ENGINE_ORDER[a.Name] ?? 100
    const ob = ENGINE_ORDER[b.Name] ?? 100
    if (oa !== ob) return oa - ob
    return a.Name.localeCompare(b.Name)
  })

  const hasBuiltinEngine = engines.some(e => e.Name === 'builtin')

  function openDrawer(engine: ParserEngineInfo) {
    setCurrentEngine(engine)
    setDrawerVisible(true)
    setCheckMessage('')
  }

  function hasConfigFields(engineName: string): boolean {
    return CONFIGURABLE_ENGINES.has(engineName)
  }

  function getEngineDisplayName(engineName: string): string {
    const key = `kbSettings.parser.engines.${engineName}.name`
    const translated = t(key)
    return translated !== key ? translated : engineName
  }

  function getEngineDisplayDesc(engineName: string, fallback: string): string {
    const key = `kbSettings.parser.engines.${engineName}.desc`
    const translated = t(key)
    return translated !== key ? translated : fallback
  }

  async function onCheck() {
    if (!connected) {
      setCheckMessage(t('settings.parser.ensureDocreaderConnected', 'Please ensure DocReader is connected'))
      return
    }
    setChecking(true)
    setCheckMessage('')
    try {
      const res = await checkParserEngines(config)
      setEngines(res?.data ?? [])
      if (res?.connected !== undefined) {
        setConnected(res.connected)
      }
      setCheckMessage(t('settings.parser.checkDone', 'Connection test completed'))
    } catch (e: any) {
      setCheckMessage(e?.message || t('settings.parser.checkFailed', 'Connection test failed'))
    } finally {
      setChecking(false)
    }
  }

  async function onSave() {
    setSaving(true)
    try {
      await updateParserEngineConfig(config)
      setDrawerVisible(false)
      loadEngines()
    } catch (e: any) {
      console.error('Save failed:', e)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="section-header">
          <h2 className="text-lg font-medium">{t('settings.parser.title', 'Parser Engine Settings')}</h2>
          <p className="text-sm text-[var(--td-text-color-secondary)] mt-1">
            {t('settings.parser.description', 'Configure document parsing engines')}
          </p>
        </div>
        <div className="flex items-center justify-center gap-2 py-12">
          <Loader2 size={20} className="animate-spin text-[var(--td-brand-color)]" />
          <span className="text-sm text-[var(--td-text-color-secondary)]">
            {t('settings.parser.loading', 'Loading...')}
          </span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="section-header">
          <h2 className="text-lg font-medium">{t('settings.parser.title', 'Parser Engine Settings')}</h2>
          <p className="text-sm text-[var(--td-text-color-secondary)] mt-1">
            {t('settings.parser.description', 'Configure document parsing engines')}
          </p>
        </div>
        <div className="flex items-center gap-2 py-4">
          <AlertCircle size={16} className="text-red-500" />
          <span className="text-sm text-red-500">{error}</span>
          <Button variant="ghost" size="sm" onClick={loadAll}>
            {t('settings.parser.retry', 'Retry')}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="section-header">
        <h2 className="text-lg font-medium">{t('settings.parser.title', 'Parser Engine Settings')}</h2>
        <p className="text-sm text-[var(--td-text-color-secondary)] mt-1">
          {t('settings.parser.description', 'Configure document parsing engines')}
        </p>
      </div>

      {engines.length === 0 && !hasBuiltinEngine ? (
        <div className="text-center py-12">
          <p className="text-[var(--td-text-color-secondary)]">
            {t('settings.parser.noEngineDetected', 'No parser engines detected')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {!hasBuiltinEngine && (
            <div
              className={`border rounded-lg p-4 cursor-pointer transition-all hover:border-[var(--td-brand-color)] ${
                drawerVisible && currentEngine?.Name === 'builtin' ? 'border-[var(--td-brand-color)] bg-[var(--td-brand-color)]/5' : 'border-[var(--td-component-stroke)] bg-white'
              }`}
              onClick={() => openDrawer({ Name: 'builtin' } as ParserEngineInfo)}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold font-mono">builtin</h3>
                <span className={`text-xs px-2 py-0.5 rounded ${
                  connected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {connected ? t('settings.parser.connected', 'Connected') : t('settings.parser.disconnected', 'Disconnected')}
                </span>
              </div>
              <p className="text-xs text-[var(--td-text-color-secondary)]">
                {t('settings.parser.builtinDesc', 'Built-in document parser')}
              </p>
            </div>
          )}

          {sortedEngines.map((engine) => (
            <div
              key={engine.Name}
              className={`border rounded-lg p-4 cursor-pointer transition-all hover:border-[var(--td-brand-color)] ${
                drawerVisible && currentEngine?.Name === engine.Name ? 'border-[var(--td-brand-color)] bg-[var(--td-brand-color)]/5' : 'border-[var(--td-component-stroke)] bg-white'
              }`}
              onClick={() => openDrawer(engine)}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold font-mono">{getEngineDisplayName(engine.Name)}</h3>
                {engine.Available ? (
                  <span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-700">
                    {t('settings.parser.available', 'Available')}
                  </span>
                ) : (
                  <span className="text-xs px-2 py-0.5 rounded bg-red-100 text-red-700">
                    {t('settings.parser.unavailable', 'Unavailable')}
                  </span>
                )}
              </div>
              <p className="text-xs text-[var(--td-text-color-secondary)] line-clamp-2">
                {getEngineDisplayDesc(engine.Name, engine.Description)}
              </p>
            </div>
          ))}
        </div>
      )}

      <Dialog open={drawerVisible} onOpenChange={setDrawerVisible}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{currentEngine ? getEngineDisplayName(currentEngine.Name) : ''}</DialogTitle>
          </DialogHeader>

          {currentEngine && (
            <div className="space-y-4">
              <p className="text-sm text-[var(--td-text-color-secondary)]">
                {getEngineDisplayDesc(currentEngine.Name, currentEngine.Description)}
              </p>

              {currentEngine.Name === 'builtin' && (
                <div className="p-3 bg-[var(--td-bg-color-secondarycontainer)] rounded">
                  <div className="flex items-center gap-2 mb-2">
                    {connected ? (
                      <span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-700">
                        {t('settings.parser.connected', 'Connected')}
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded bg-red-100 text-red-700">
                        {t('settings.parser.disconnected', 'Disconnected')}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--td-text-color-placeholder)]">
                    {t('settings.parser.envVarHint', 'Configure via environment variables')}
                  </p>
                </div>
              )}

              {currentEngine.FileTypes && currentEngine.FileTypes.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {currentEngine.FileTypes.map((ft) => (
                    <span key={ft} className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                      {ft}
                    </span>
                  ))}
                </div>
              )}

              {currentEngine.Name === 'mineru' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      {t('settings.parser.selfHostedEndpoint', 'Self-hosted Endpoint')}
                    </label>
                    <Input
                      value={config.mineru_endpoint || ''}
                      onChange={(e) => setConfig({ ...config, mineru_endpoint: e.target.value })}
                      placeholder={t('settings.parser.mineruEndpointPlaceholder', 'http://localhost:8080')}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Backend</label>
                    <select
                      value={config.mineru_model || 'pipeline'}
                      onChange={(e) => setConfig({ ...config, mineru_model: e.target.value })}
                      className="w-full h-10 px-3 rounded border border-[var(--td-border-level-1-color)] text-sm"
                    >
                      <option value="pipeline">pipeline</option>
                      <option value="vlm-auto-engine">vlm-auto-engine</option>
                      <option value="vlm-http-client">vlm-http-client</option>
                      <option value="hybrid-auto-engine">hybrid-auto-engine</option>
                      <option value="hybrid-http-client">hybrid-http-client</option>
                    </select>
                  </div>
                  <div className="flex flex-wrap gap-4">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={config.mineru_enable_formula ?? true}
                        onChange={(e) => setConfig({ ...config, mineru_enable_formula: e.target.checked })}
                        className="rounded"
                      />
                      {t('settings.parser.formulaRecognition', 'Formula Recognition')}
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={config.mineru_enable_table ?? true}
                        onChange={(e) => setConfig({ ...config, mineru_enable_table: e.target.checked })}
                        className="rounded"
                      />
                      {t('settings.parser.tableRecognition', 'Table Recognition')}
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={config.mineru_enable_ocr ?? true}
                        onChange={(e) => setConfig({ ...config, mineru_enable_ocr: e.target.checked })}
                        className="rounded"
                      />
                      OCR
                    </label>
                  </div>
                </div>
              )}

              {currentEngine.Name === 'mineru_cloud' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">API Key</label>
                    <Input
                      type="password"
                      value={config.mineru_api_key || ''}
                      onChange={(e) => setConfig({ ...config, mineru_api_key: e.target.value })}
                      placeholder={t('settings.parser.mineruCloudApiKeyPlaceholder', 'Enter API key')}
                    />
                  </div>
                  <div className="flex flex-wrap gap-4">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={config.mineru_cloud_enable_formula ?? true}
                        onChange={(e) => setConfig({ ...config, mineru_cloud_enable_formula: e.target.checked })}
                        className="rounded"
                      />
                      {t('settings.parser.formulaRecognition', 'Formula Recognition')}
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={config.mineru_cloud_enable_table ?? true}
                        onChange={(e) => setConfig({ ...config, mineru_cloud_enable_table: e.target.checked })}
                        className="rounded"
                      />
                      {t('settings.parser.tableRecognition', 'Table Recognition')}
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={config.mineru_cloud_enable_ocr ?? true}
                        onChange={(e) => setConfig({ ...config, mineru_cloud_enable_ocr: e.target.checked })}
                        className="rounded"
                      />
                      OCR
                    </label>
                  </div>
                </div>
              )}

              {(hasConfigFields(currentEngine.Name) || currentEngine.Name === 'builtin') && (
                <div className="pt-3 border-t">
                  <label className="block text-sm font-medium mb-2">
                    {t('settings.parser.testConnection', 'Test Connection')}
                  </label>
                  <div className="flex items-center gap-3">
                    <Button variant="outline" size="sm" onClick={onCheck} disabled={checking}>
                      {checking && <Loader2 size={14} className="mr-1 animate-spin" />}
                      {t('settings.parser.testConnection', 'Test Connection')}
                    </Button>
                    {checkMessage && (
                      <span className="text-xs text-[var(--td-text-color-secondary)]">{checkMessage}</span>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setDrawerVisible(false)}>
                  {t('common.cancel', 'Cancel')}
                </Button>
                <Button onClick={onSave} disabled={saving}>
                  {saving && <Loader2 size={14} className="mr-1 animate-spin" />}
                  {t('common.save', 'Save')}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
