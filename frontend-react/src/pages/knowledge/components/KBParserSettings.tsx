import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { FileText, AlertTriangle, ChevronDown } from 'lucide-react'
import { getParserEngines } from '@/api/system'
import type { ParserEngineInfo } from '@/api/system'

export interface ParserEngineRule {
  file_types: string[]
  engine: string
}

interface KBParserSettingsProps {
  parserEngineRules?: ParserEngineRule[]
  onUpdate?: (rules: ParserEngineRule[]) => void
}

interface EngineOption {
  value: string
  selectLabel: string
  desc: string
  fileTypes: string[]
  disabled: boolean
  isDefault: boolean
  reason?: string
}

interface FileTypeGroup {
  key: string
  label: string
  icon: string
  extensions: string[]
}

function getEngineDisplayName(engineName: string, t: (key: string) => string): string {
  const key = `kbSettings.parser.engines.${engineName}.name`
  const translated = t(key)
  return translated !== key ? translated : engineName
}

function getEngineDisplayDesc(engineName: string, fallback: string, t: (key: string) => string): string {
  const key = `kbSettings.parser.engines.${engineName}.desc`
  const translated = t(key)
  return translated !== key ? translated : fallback
}

export function KBParserSettings({ parserEngineRules = [], onUpdate }: KBParserSettingsProps) {
  const { t } = useTranslation()
  const [parserEngines, setParserEngines] = useState<ParserEngineInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [localEngineRules, setLocalEngineRules] = useState<ParserEngineRule[]>([...parserEngineRules])

  useEffect(() => {
    loadEngines()
  }, [])

  useEffect(() => {
    setLocalEngineRules(parserEngineRules)
  }, [parserEngineRules])

  const allFileTypes = () => {
    const s = new Set<string>()
    for (const engine of parserEngines) {
      for (const ft of engine.FileTypes || []) {
        s.add(ft)
      }
    }
    return s
  }

  const fileTypeGroups = (): FileTypeGroup[] => {
    const ft = allFileTypes()
    const groups: FileTypeGroup[] = []

    const addIfExists = (key: string, label: string, icon: string, exts: string[]) => {
      const filtered = exts.filter(e => ft.has(e))
      if (filtered.length) groups.push({ key, label, icon, extensions: filtered })
    }

    addIfExists('pdf', t('kbSettings.parser.fileTypePdf', 'PDF'), 'file-pdf', ['pdf'])
    addIfExists('office', t('kbSettings.parser.fileTypeWord', 'Word'), 'file-word', ['docx', 'doc'])
    addIfExists('ppt', t('kbSettings.parser.fileTypePpt', 'PowerPoint'), 'file-powerpoint', ['pptx', 'ppt'])
    addIfExists('excel', t('kbSettings.parser.fileTypeExcel', 'Excel'), 'file-excel', ['xlsx', 'xls'])
    addIfExists('csv', t('kbSettings.parser.fileTypeCsv', 'CSV'), 'file-excel', ['csv'])
    addIfExists('markdown', 'Markdown', 'file-code', ['md', 'markdown'])
    addIfExists('text', t('kbSettings.parser.fileTypeText', 'Text'), 'file', ['txt'])
    addIfExists('json', t('kbSettings.parser.fileTypeJson', 'JSON'), 'file-code', ['json'])
    addIfExists('image', t('kbSettings.parser.fileTypeImage', 'Image'), 'image', ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'webp'])
    addIfExists('audiovisual', t('kbSettings.parser.fileTypeAudiovisual', 'Audio/Video'), 'sound', ['mp3', 'wav', 'm4a', 'flac', 'ogg'])

    return groups
  }

  const getEngineOptions = (extensions: string[]): EngineOption[] => {
    const raw: { name: string; desc: string; fileTypes: string[]; available: boolean; reason: string }[] = []
    for (const engine of parserEngines) {
      const supports = extensions.some(ext => (engine.FileTypes || []).includes(ext))
      if (supports) {
        raw.push({
          name: engine.Name,
          desc: engine.Description || engine.Name,
          fileTypes: engine.FileTypes || [],
          available: engine.Available !== false,
          reason: engine.UnavailableReason || '',
        })
      }
    }
    const defaultName = raw.find(e => e.available)?.name ?? ''
    return raw.map(e => ({
      value: e.name,
      selectLabel: `${getEngineDisplayName(e.name, t)}  —  ${getEngineDisplayDesc(e.name, e.desc, t)}`,
      desc: e.desc,
      fileTypes: e.fileTypes,
      disabled: !e.available,
      isDefault: defaultName !== '' && e.name === defaultName,
      reason: e.reason,
    }))
  }

  const hasAvailableEngine = (extensions: string[]): boolean => {
    return getEngineOptions(extensions).some(opt => !opt.disabled)
  }

  const getDefaultEngine = (extensions: string[]): string => {
    const opts = getEngineOptions(extensions)
    return opts.find(o => o.isDefault)?.value ?? ''
  }

  const getEngineForGroup = (extensions: string[]): string => {
    for (const rule of localEngineRules) {
      if (rule.file_types.some(ft => extensions.includes(ft))) {
        return rule.engine
      }
    }
    return getDefaultEngine(extensions)
  }

  const handleEngineChange = (extensions: string[], engine: string) => {
    const otherRules = localEngineRules.filter(
      r => !r.file_types.some(ft => extensions.includes(ft))
    )
    if (engine) {
      otherRules.push({ file_types: [...extensions], engine })
    }
    setLocalEngineRules(otherRules)
    onUpdate?.(buildCompleteRules(otherRules))
  }

  const buildCompleteRules = (rules: ParserEngineRule[]): ParserEngineRule[] => {
    const finalRules: ParserEngineRule[] = [...rules]
    for (const group of fileTypeGroups()) {
      const existing = finalRules.find(r => r.file_types.some(ft => group.extensions.includes(ft)))
      if (!existing) {
        const engine = getEngineForGroup(group.extensions)
        if (engine) {
          finalRules.push({ file_types: [...group.extensions], engine })
        }
      }
    }
    return finalRules
  }

  async function loadEngines() {
    setLoading(true)
    try {
      const resp = await getParserEngines()
      if (resp?.data && Array.isArray(resp.data)) {
        setParserEngines(resp.data)
      }
    } catch {
      setParserEngines([])
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="section-header">
          <h2 className="text-lg font-medium">{t('kbSettings.parser.title', 'Parser Settings')}</h2>
          <p className="text-sm text-[var(--td-text-color-secondary)] mt-1">
            {t('kbSettings.parser.description', 'Configure parser engines for different file types')}
          </p>
        </div>
        <div className="flex items-center gap-2 py-4">
          <div className="animate-spin h-4 w-4 border-2 border-[var(--td-brand-color)] border-t-transparent rounded-full" />
          <span className="text-sm text-[var(--td-text-color-secondary)]">
            {t('kbSettings.parser.loading', 'Loading parser engines...')}
          </span>
        </div>
      </div>
    )
  }

  if (fileTypeGroups().length === 0) {
    return (
      <div className="space-y-4">
        <div className="section-header">
          <h2 className="text-lg font-medium">{t('kbSettings.parser.title', 'Parser Settings')}</h2>
          <p className="text-sm text-[var(--td-text-color-secondary)] mt-1">
            {t('kbSettings.parser.description', 'Configure parser engines for different file types')}
          </p>
        </div>
        <div className="py-6 text-center">
          <p className="text-[var(--td-text-color-secondary)]">
            {t('kbSettings.parser.noEngineAvailable', 'No parser engines available')}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="section-header">
        <h2 className="text-lg font-medium">{t('kbSettings.parser.title', 'Parser Settings')}</h2>
        <p className="text-sm text-[var(--td-text-color-secondary)] mt-1">
          {t('kbSettings.parser.description', 'Configure parser engines for different file types')}
        </p>
      </div>

      <div className="space-y-0">
        {fileTypeGroups().map((group) => (
          <div
            key={group.key}
            className="flex items-start justify-between py-5 border-b border-[var(--td-component-stroke)] last:border-b-0"
          >
            <div className="flex-0 w-[40%] max-w-[40%] pr-6">
              <label className="flex items-center gap-1.5 text-sm font-medium text-[var(--td-text-color-primary)]">
                <FileText size={18} className="text-[var(--td-text-color-secondary)]" />
                {group.label}
              </label>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {group.extensions.map((ext) => (
                  <span
                    key={ext}
                    className="inline-block text-xs px-2 py-0.5 rounded bg-[var(--td-bg-color-secondarycontainer)] text-[var(--td-text-color-secondary)] font-mono"
                  >
                    .{ext}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex-0 w-[55%] max-w-[55%] flex flex-col items-end">
              <div className="relative">
                <select
                  value={getEngineForGroup(group.extensions) || ''}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleEngineChange(group.extensions, e.target.value)}
                  className="w-[280px] h-10 pl-3 pr-8 rounded border appearance-none bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--td-brand-color)]"
                  style={{
                    borderColor: hasAvailableEngine(group.extensions) ? 'var(--td-border-level-1-color)' : 'var(--td-warning-color)',
                  }}
                >
                  <option value="" disabled>
                    {t('kbSettings.parser.noEngine', 'Select engine')}
                  </option>
                  {getEngineOptions(group.extensions).map((opt) => (
                    <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                      {getEngineDisplayName(opt.value, t)}
                      {opt.isDefault ? ` (${t('kbSettings.parser.default', 'Default')})` : ''}
                      {opt.disabled ? ` - ${t('kbSettings.parser.unavailable', 'Unavailable')}` : ''}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={14}
                  className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--td-text-color-secondary)]"
                />
              </div>
              {!hasAvailableEngine(group.extensions) && (
                <div className="flex items-center gap-1 mt-2 text-xs text-yellow-600">
                  <AlertTriangle size={12} />
                  <span>{t('kbSettings.parser.goConfig', 'Configure parser in system settings')}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
