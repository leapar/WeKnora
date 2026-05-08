import { useState, useEffect, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { X, ChevronRight, ChevronDown, Loader2, AlertCircle, CheckCircle, FileText } from 'lucide-react'

interface DataSource {
  id: string
  name: string
  type: string
  config?: {
    credentials?: Record<string, any>
    resource_ids?: string[]
    settings?: Record<string, any>
  }
  sync_schedule?: string
  sync_mode?: 'incremental' | 'full'
  conflict_strategy?: 'overwrite' | 'skip'
  sync_deletions?: boolean
}

interface Resource {
  external_id: string
  name: string
  type: string
  parent_id?: string
  has_children?: boolean
  description?: string
}

interface ConnectorDef {
  type: string
  available: boolean
  docUrl: string
  permissionDocUrl: string
  permissionPageUrl: string
  requiredPermissions: string[]
  fields: {
    key: string
    labelKey: string
    placeholder: string
    secret?: boolean
    optional?: boolean
    hintKey?: string
  }[]
}

interface DataSourceEditorDialogProps {
  visible: boolean
  kbId: string
  dataSource: DataSource | null
  onClose: () => void
  onSaved: () => void
}

// Mock API functions - in production these would come from an API module
const mockCreateDataSource = async (data: any) => {
  console.log('Creating data source:', data)
  return { success: true, data: { id: 'ds-' + Date.now(), ...data } }
}

const mockUpdateDataSource = async (id: string, data: any) => {
  console.log('Updating data source:', id, data)
  return { success: true }
}

const mockValidateCredentials = async (type: string, credentials: any) => {
  console.log('Validating credentials for:', type, credentials)
  return { success: true }
}

const mockValidateConnection = async (id: string) => {
  console.log('Validating connection for:', id)
  return { success: true }
}

const mockListResources = async (id: string) => {
  console.log('Listing resources for:', id)
  return {
    data: [
      { external_id: 'r1', name: 'Wiki Space 1', type: 'wiki_space', parent_id: undefined, has_children: true },
      { external_id: 'r2', name: 'Doc Category 1', type: 'doc_category', parent_id: 'r1', has_children: false },
      { external_id: 'r3', name: 'Book 1', type: 'book', parent_id: undefined, has_children: true },
      { external_id: 'r4', name: 'Chapter 1', type: 'doc_category', parent_id: 'r3', has_children: false },
    ]
  }
}

const mockTriggerSync = async (id: string) => {
  console.log('Triggering sync for:', id)
  return { success: true }
}

const mockDeleteDataSource = async (id: string) => {
  console.log('Deleting data source:', id)
  return { success: true }
}

// Connector definitions
const CONNECTOR_DEFS: ConnectorDef[] = [
  {
    type: 'feishu',
    available: true,
    docUrl: 'https://open.feishu.cn/app',
    permissionDocUrl: 'https://open.feishu.cn/document/server-docs/docs/wiki-v2/wiki-overview',
    permissionPageUrl: 'https://open.feishu.cn/app',
    requiredPermissions: ['wiki:wiki:readonly', 'drive:drive:readonly', 'drive:export:readonly', 'docx:document:readonly'],
    fields: [
      { key: 'app_id', labelKey: 'datasource.field.appId', placeholder: 'cli_xxxx' },
      { key: 'app_secret', labelKey: 'datasource.field.appSecret', placeholder: '', secret: true },
    ],
  },
  {
    type: 'notion',
    available: true,
    docUrl: 'https://www.notion.so/my-integrations',
    permissionDocUrl: '',
    permissionPageUrl: '',
    requiredPermissions: [],
    fields: [
      { key: 'api_key', labelKey: 'datasource.field.integrationToken', placeholder: 'ntn_xxxx', secret: true },
    ],
  },
  {
    type: 'yuque',
    available: true,
    docUrl: 'https://www.yuque.com/yuque/developer/api',
    permissionDocUrl: 'https://www.yuque.com/yuque/developer/api',
    permissionPageUrl: 'https://www.yuque.com/settings/tokens',
    requiredPermissions: ['repo:read', 'doc:read'],
    fields: [
      { key: 'api_token', labelKey: 'datasource.field.apiToken', placeholder: '', secret: true },
      { key: 'base_url', labelKey: 'datasource.field.baseUrl', placeholder: 'https://www.yuque.com', optional: true, hintKey: 'datasource.field.baseUrlHint' },
    ],
  },
]

const SCHEDULE_PRESETS = [
  { label: 'Every 30 min', value: '0 */30 * * * *' },
  { label: 'Every hour', value: '0 0 * * * *' },
  { label: 'Every 6 hours', value: '0 0 */6 * * *' },
  { label: 'Every 12 hours', value: '0 0 */12 * * *' },
  { label: 'Every 24 hours', value: '0 0 2 * * *' },
]

function DataSourceTypeIcon({ type }: { type: string }) {
  const iconProps = { size: 20, className: 'text-[var(--td-brand-color)]' }
  switch (type) {
    case 'feishu':
      return <span style={{ fontSize: 20 }}>ðźšť</span>
    case 'notion':
      return <span style={{ fontSize: 20 }}>ðŸ”µ</span>
    case 'yuque':
      return <span style={{ fontSize: 20 }}>ðŸ­Š</span>
    default:
      return <FileText {...iconProps} />
  }
}

export function DataSourceEditorDialog({ visible, kbId, dataSource, onClose, onSaved }: DataSourceEditorDialogProps) {
  const { t } = useTranslation()
  const isEdit = !!dataSource

  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<'success' | 'error' | ''>('')
  const [testErrorMsg, setTestErrorMsg] = useState('')
  const [prereqExpanded, setPrereqExpanded] = useState(false)

  const [form, setForm] = useState({
    name: '',
    type: '',
    config: {
      credentials: {} as Record<string, any>,
      resource_ids: [] as string[],
      settings: {} as Record<string, any>,
    },
    sync_schedule: '0 0 */6 * * *',
    sync_mode: 'incremental' as 'incremental' | 'full',
    conflict_strategy: 'overwrite' as 'overwrite' | 'skip',
    sync_deletions: true,
  })

  const [resources, setResources] = useState<Resource[]>([])
  const [loadingResources, setLoadingResources] = useState(false)
  const [selectedResourceIds, setSelectedResourceIds] = useState<string[]>([])
  const [expandedResourceIds, setExpandedResourceIds] = useState<Set<string>>(new Set())
  const [tempDsId, setTempDsId] = useState('')

  const stepTitles = useMemo(() => [
    t('datasource.step.selectType', 'Select Type'),
    t('datasource.step.credentials', 'Credentials'),
    t('datasource.step.resources', 'Resources'),
    t('datasource.step.strategy', 'Strategy'),
  ], [t])

  const currentDef = useMemo(() => CONNECTOR_DEFS.find(d => d.type === form.type), [form.type])

  // Reset state when dialog opens/closes or dataSource changes
  useEffect(() => {
    if (!visible) return

    setStep(isEdit ? 1 : 0)
    setTestResult('')
    setTestErrorMsg('')
    setTempDsId('')
    setPrereqExpanded(false)
    setResources([])
    setSelectedResourceIds([])
    setExpandedResourceIds(new Set())

    if (isEdit && dataSource) {
      setForm({
        name: dataSource.name || '',
        type: dataSource.type || '',
        config: { ...{ credentials: {}, resource_ids: [], settings: {} }, ...dataSource.config },
        sync_schedule: dataSource.sync_schedule || '0 0 */6 * * *',
        sync_mode: dataSource.sync_mode || 'incremental',
        conflict_strategy: dataSource.conflict_strategy || 'overwrite',
        sync_deletions: dataSource.sync_deletions ?? true,
      })
      setSelectedResourceIds(dataSource.config?.resource_ids || [])
      setTempDsId(dataSource.id)
    } else {
      setForm({
        name: '',
        type: '',
        config: { credentials: {}, resource_ids: [], settings: {} },
        sync_schedule: '0 0 */6 * * *',
        sync_mode: 'incremental',
        conflict_strategy: 'overwrite',
        sync_deletions: true,
      })
    }
  }, [visible, dataSource, isEdit])

  // Children/parent maps for tree rendering
  const childrenMap = useMemo(() => {
    const map = new Map<string, Resource[]>()
    for (const r of resources) {
      if (r.parent_id) {
        const siblings = map.get(r.parent_id)
        if (siblings) siblings.push(r)
        else map.set(r.parent_id, [r])
      }
    }
    return map
  }, [resources])

  const parentMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const r of resources) {
      if (r.parent_id) map.set(r.external_id, r.parent_id)
    }
    return map
  }, [resources])

  type CheckState = 'checked' | 'indeterminate' | 'unchecked'

  const checkStates = useMemo(() => {
    const states = new Map<string, CheckState>()
    const cover = new Set(selectedResourceIds)

    function walk(node: Resource, ancestorChecked: boolean): boolean {
      const selfChecked = ancestorChecked || cover.has(node.external_id)
      let descendantChecked = false
      for (const c of childrenMap.get(node.external_id) || []) {
        if (walk(c, selfChecked)) descendantChecked = true
      }
      if (selfChecked) states.set(node.external_id, 'checked')
      else states.set(node.external_id, descendantChecked ? 'indeterminate' : 'unchecked')
      return selfChecked || descendantChecked
    }
    for (const r of resources) {
      if (!r.parent_id) walk(r, false)
    }
    return states
  }, [resources, selectedResourceIds, childrenMap])

  const visibleTree = useMemo(() => {
    const roots = resources.filter(r => !r.parent_id)
    const result: { resource: Resource; depth: number }[] = []
    function walk(items: Resource[], depth: number) {
      for (const r of items) {
        result.push({ resource: r, depth })
        if (r.has_children && expandedResourceIds.has(r.external_id)) {
          walk(childrenMap.get(r.external_id) || [], depth + 1)
        }
      }
    }
    walk(roots, 0)
    return result
  }, [resources, expandedResourceIds, childrenMap])

  const toggleExpand = useCallback((id: string) => {
    setExpandedResourceIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const getDescendantIds = useCallback((id: string): string[] => {
    const ids: string[] = []
    const children = childrenMap.get(id) || []
    for (const c of children) {
      ids.push(c.external_id)
      ids.push(...getDescendantIds(c.external_id))
    }
    return ids
  }, [childrenMap])

  const getAncestorChain = useCallback((id: string): string[] => {
    const chain = [id]
    for (let p = parentMap.get(id); p; p = parentMap.get(p)) {
      chain.push(p)
    }
    return chain
  }, [parentMap])

  const isCovered = useCallback((id: string, cover: Set<string>): boolean => {
    for (let cur: string | undefined = id; cur; cur = parentMap.get(cur)) {
      if (cover.has(cur)) return true
    }
    return false
  }, [parentMap])

  const checkResource = useCallback((id: string, cover: Set<string>) => {
    if (isCovered(id, cover)) return
    const descendants = new Set(getDescendantIds(id))
    for (const d of [...cover]) {
      if (descendants.has(d)) cover.delete(d)
    }
    cover.add(id)
  }, [isCovered, getDescendantIds])

  const uncheckResource = useCallback((id: string, cover: Set<string>) => {
    const chain = getAncestorChain(id)
    let highestIdx = -1
    for (let i = chain.length - 1; i >= 0; i--) {
      if (cover.has(chain[i])) { highestIdx = i; break }
    }
    if (highestIdx > 0) {
      cover.delete(chain[highestIdx])
      for (let i = highestIdx; i > 0; i--) {
        const parent = chain[i]
        const next = chain[i - 1]
        for (const sib of childrenMap.get(parent) || []) {
          if (sib.external_id !== next) cover.add(sib.external_id)
        }
      }
    }
    cover.delete(id)
    const descendants = new Set(getDescendantIds(id))
    for (const d of [...cover]) {
      if (descendants.has(d)) cover.delete(d)
    }
  }, [getAncestorChain, childrenMap, getDescendantIds])

  const toggleResource = useCallback((id: string) => {
    const cover = new Set(selectedResourceIds)
    if ((checkStates.get(id) || 'unchecked') === 'unchecked') {
      checkResource(id, cover)
    } else {
      uncheckResource(id, cover)
    }
    setSelectedResourceIds([...cover])
  }, [selectedResourceIds, checkStates, checkResource, uncheckResource])

  const selectType = useCallback((def: ConnectorDef) => {
    if (!def.available) return
    setForm(prev => ({
      ...prev,
      type: def.type,
      name: t(`datasource.connector.${def.type}`, def.type),
    }))
    setStep(1)
  }, [t])

  const testConnection = useCallback(async () => {
    const fields = currentDef?.fields || []
    for (const f of fields) {
      if (f.optional) continue
      if (!form.config.credentials[f.key]) {
        alert(`${t(f.labelKey)} ${t('datasource.isRequired', 'is required')}`)
        return
      }
    }

    setTesting(true)
    setTestResult('')
    setTestErrorMsg('')
    try {
      if (isEdit && tempDsId) {
        await mockUpdateDataSource(tempDsId, { ...form, knowledge_base_id: kbId })
        await mockValidateConnection(tempDsId)
      } else {
        await mockValidateCredentials(form.type, form.config.credentials)
      }
      setTestResult('success')
      alert(t('datasource.testSuccess', 'Connection successful!'))
    } catch (e: any) {
      setTestResult('error')
      setTestErrorMsg(e?.message || e?.error || '')
      alert(t('datasource.testFailed', 'Connection failed'))
    }
    setTesting(false)
  }, [currentDef, form, isEdit, tempDsId, kbId, t])

  const loadResources = useCallback(async () => {
    setLoadingResources(true)
    try {
      let dsId = tempDsId
      if (!dsId) {
        const res = await mockCreateDataSource({ ...form, knowledge_base_id: kbId, status: 'paused' })
        const created = res?.data || res
        dsId = created.id
        setTempDsId(dsId)
      } else if (!isEdit) {
        await mockUpdateDataSource(dsId, { ...form, knowledge_base_id: kbId })
      }
      const res = await mockListResources(dsId)
      setResources(res?.data || res || [])
    } catch (e: any) {
      alert(e?.message || e?.error || t('datasource.resourceLoadFailed', 'Failed to load resources'))
    }
    setLoadingResources(false)
  }, [tempDsId, form, kbId, isEdit, t])

  const validateStep1Fields = useCallback((): boolean => {
    const fields = currentDef?.fields || []
    for (const f of fields) {
      if (f.optional) continue
      if (!form.config.credentials[f.key]) {
        alert(`${t(f.labelKey)} ${t('datasource.isRequired', 'is required')}`)
        return false
      }
    }
    return true
  }, [currentDef, form.config.credentials, t])

  const nextStep = useCallback(() => {
    if (step === 1) {
      if (!validateStep1Fields()) return
      if (testResult !== 'success') {
        alert(t('datasource.pleaseTestFirst', 'Please test the connection first'))
        return
      }
    }
    const nextStepNum = step + 1
    setStep(nextStepNum)
    if (nextStepNum === 2) {
      loadResources()
    }
  }, [step, validateStep1Fields, testResult, loadResources, t])

  const prevStep = useCallback(() => {
    setStep(s => s - 1)
  }, [])

  const handleSubmit = useCallback(async () => {
    setForm(prev => ({
      ...prev,
      config: { ...prev.config, resource_ids: selectedResourceIds }
    }))
    setSubmitting(true)
    try {
      let dsId = tempDsId

      if (tempDsId) {
        await mockUpdateDataSource(tempDsId, { ...form, config: { ...form.config, resource_ids: selectedResourceIds }, knowledge_base_id: kbId, status: 'active' })
      } else {
        const res = await mockCreateDataSource({ ...form, config: { ...form.config, resource_ids: selectedResourceIds }, knowledge_base_id: kbId, status: 'active' })
        const created = res?.data || res
        dsId = created.id
        setTempDsId(created.id)
      }

      if (isEdit) {
        alert(t('datasource.updateSuccess', 'Data source updated successfully'))
      } else {
        try {
          await mockTriggerSync(dsId!)
          alert(t('datasource.createAndSyncSuccess', 'Data source created and sync started'))
        } catch (e: any) {
          alert(t('datasource.createButSyncFailed', 'Created but sync failed') + ': ' + (e?.message || e?.error || ''))
        }
      }

      onSaved()
      onClose()
    } catch (e: any) {
      alert(t('datasource.saveFailed', 'Failed to save') + ': ' + (e?.message || e?.error || ''))
    }
    setSubmitting(false)
  }, [form, selectedResourceIds, tempDsId, kbId, isEdit, onSaved, onClose, t])

  const handleClose = useCallback(async () => {
    if (!isEdit && tempDsId) {
      try {
        await mockDeleteDataSource(tempDsId)
      } catch {
        // Ignore cleanup errors
      }
      setTempDsId('')
    }
    onClose()
  }, [isEdit, tempDsId, onClose])

  const resourceTypeLabelMap: Record<string, string> = {
    wiki_space: 'datasource.resourceType.wikiSpace',
    doc_category: 'datasource.resourceType.docCategory',
    book: 'datasource.resourceType.book',
  }

  const resourceTypeLabel = (type: string): string => {
    const key = resourceTypeLabelMap[type]
    return key ? t(key) : type
  }

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={handleClose} />
      <div className="relative z-50 w-full max-w-[640px] bg-white rounded-lg shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--td-border-level-1-color)]">
          <h2 className="text-lg font-medium">
            {isEdit ? t('datasource.editTitle', 'Edit Data Source') : t('datasource.createTitle', 'Create Data Source')}
          </h2>
          <button
            onClick={handleClose}
            className="p-1 rounded hover:bg-gray-100 transition-colors"
            aria-label={t('common.close', 'Close')}
          >
            <X size={20} />
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex gap-1 px-4 pt-4 pb-0 border-b border-[var(--td-border-level-1-color)]">
          {stepTitles.map((title, i) => (
            <div
              key={i}
              className={`flex-1 flex items-center gap-1.5 pb-3 text-sm ${
                step === i ? 'text-[var(--td-brand-color)] font-medium' : step > i ? 'text-green-600' : 'text-gray-400'
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs border ${
                step === i ? 'bg-[var(--td-brand-color)] text-white border-[var(--td-brand-color)]' :
                step > i ? 'bg-green-600 text-white border-green-600' :
                'border-current'
              }`}>
                {step > i ? '✓' : i + 1}
              </span>
              <span className="hidden sm:inline">{title}</span>
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="p-4 max-h-[60vh] overflow-y-auto">
          {/* Step 0: Select connector type */}
          {step === 0 && (
            <div className="ds-step-content">
              <div className="grid grid-cols-3 gap-2.5">
                {CONNECTOR_DEFS.map(def => (
                  <div
                    key={def.type}
                    onClick={() => selectType(def)}
                    className={`border rounded-lg p-3.5 cursor-pointer transition-all ${
                      def.available
                        ? 'hover:border-[var(--td-brand-color)] hover:bg-[var(--td-brand-color-light)]'
                        : 'opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <DataSourceTypeIcon type={def.type} />
                      <span className="text-sm font-medium">{t(`datasource.connector.${def.type}`, def.type)}</span>
                      {!def.available && (
                        <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                          {t('datasource.comingSoon', 'Coming Soon')}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-gray-500 leading-relaxed">
                      {t(`datasource.connectorDesc.${def.type}`, '')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 1: Credentials */}
          {step === 1 && currentDef && (
            <div className="ds-step-content space-y-4">
              {/* Collapsible prereq hint */}
              {currentDef.requiredPermissions.length > 0 && (
                <>
                  <div
                    onClick={() => setPrereqExpanded(!prereqExpanded)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-yellow-50 text-yellow-700 text-xs font-medium cursor-pointer"
                  >
                    <span>ðŸ›ˆ</span>
                    <span className="flex-1">
                      {t(`datasource.prereqBarText_${form.type}`, t('datasource.prereqBarText', 'Setup required permissions'))}
                    </span>
                    <span className="transform transition-transform">{prereqExpanded ? 'â¤´' : 'â¤µ'}</span>
                  </div>
                  {prereqExpanded && (
                    <div className="border rounded-lg p-3.5 space-y-3">
                      <div className="flex gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-[var(--td-brand-color)] text-white text-xs flex items-center justify-center flex-shrink-0">1</span>
                        <div>
                          <div className="text-sm font-medium">{t(`datasource.prereqStep1Brief_${form.type}`, t('datasource.prereqBotBrief', 'Create bot'))}</div>
                          <div className="text-xs text-gray-500 mt-0.5">{t(`datasource.prereqStep1Desc_${form.type}`, t('datasource.prereqBotDesc', ''))}</div>
                        </div>
                      </div>
                      <div className="flex gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-[var(--td-brand-color)] text-white text-xs flex items-center justify-center flex-shrink-0">2</span>
                        <div>
                          <div className="text-sm font-medium">{t(`datasource.prereqStep2Brief_${form.type}`, t('datasource.prereqPermBrief', 'Grant permissions'))}</div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            {currentDef.requiredPermissions.map(perm => (
                              <code key={perm} className="text-[11px] bg-gray-100 px-1 py-0.5 rounded mr-1">{perm}</code>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-[var(--td-brand-color)] text-white text-xs flex items-center justify-center flex-shrink-0">3</span>
                        <div>
                          <div className="text-sm font-medium">{t(`datasource.prereqStep3Brief_${form.type}`, t('datasource.prereqMemberBrief', 'Add to space'))}</div>
                          <div className="text-xs text-gray-500 mt-0.5">{t(`datasource.prereqStep3Desc_${form.type}`, t('datasource.prereqMemberDesc', ''))}</div>
                        </div>
                      </div>
                      <a href={currentDef.permissionPageUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-[var(--td-brand-color)] pl-7">
                        {t(`datasource.prereqOpenConsole_${form.type}`, t('datasource.prereqOpenConsole', 'Open console'))} â†—
                      </a>
                    </div>
                  )}
                </>
              )}

              {/* Name field */}
              <div>
                <label className="block text-sm font-medium mb-1.5">{t('datasource.nameLabel', 'Name')}</label>
                <Input
                  value={form.name}
                  onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder={t('datasource.namePlaceholder', 'Data source name')}
                />
              </div>

              {/* Doc link */}
              {currentDef.docUrl && (
                <div className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 rounded-md text-xs">
                  <span>ðŸ“–</span>
                  <span className="text-gray-600">{t('datasource.docHint', 'Documentation')}:</span>
                  <a href={currentDef.docUrl} target="_blank" rel="noopener noreferrer" className="text-[var(--td-brand-color)] break-all">
                    {currentDef.docUrl}
                  </a>
                </div>
              )}

              {/* Credential fields */}
              {currentDef.fields.map(field => (
                <div key={field.key}>
                  <label className="block text-sm font-medium mb-1.5">
                    {t(field.labelKey)}
                    {!field.optional && <span className="text-red-500 ml-0.5">*</span>}
                  </label>
                  <Input
                    type={field.secret ? 'password' : 'text'}
                    value={form.config.credentials[field.key] || ''}
                    onChange={e => setForm(prev => ({
                      ...prev,
                      config: { ...prev.config, credentials: { ...prev.config.credentials, [field.key]: e.target.value } }
                    }))}
                    placeholder={field.placeholder}
                  />
                  {field.hintKey && (
                    <p className="text-xs text-gray-500 mt-1">{t(field.hintKey)}</p>
                  )}
                </div>
              ))}

              {/* Test connection */}
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={testConnection} disabled={testing}>
                  {testing && <Loader2 size={14} className="animate-spin mr-2" />}
                  {t('datasource.testConnection', 'Test Connection')}
                </Button>
                {testResult === 'success' && (
                  <span className="flex items-center gap-1 text-green-600 text-sm">
                    <CheckCircle size={14} />
                    {t('datasource.connected', 'Connected')}
                  </span>
                )}
              </div>

              {/* Test error */}
              {testResult === 'error' && (
                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-red-50 text-red-600 text-sm">
                  <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium">{t('datasource.connectionFailed', 'Connection Failed')}</div>
                    {testErrorMsg && <div className="text-xs opacity-80 mt-0.5 break-words">{testErrorMsg}</div>}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Select resources */}
          {step === 2 && (
            <div className="ds-step-content">
              <p className="text-xs text-gray-500 mb-3">{t('datasource.resourceHint', 'Select the resources to sync')}</p>

              {loadingResources ? (
                <div className="text-center py-12">
                  <Loader2 className="animate-spin text-[var(--td-brand-color)] mx-auto" size={32} />
                </div>
              ) : resources.length > 0 ? (
                <div className="space-y-0.5 max-h-[300px] overflow-y-auto">
                  {visibleTree.map(({ resource: r, depth }) => (
                    <div
                      key={r.external_id}
                      onClick={() => toggleResource(r.external_id)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer transition-colors ${
                        checkStates.get(r.external_id) === 'checked' ? 'bg-[var(--td-brand-color-light)] border border-[var(--td-brand-color)]' : 'hover:bg-gray-50'
                      }`}
                      style={{ paddingLeft: `${12 + depth * 24}px` }}
                    >
                      {r.has_children ? (
                        <button
                          onClick={e => { e.stopPropagation(); toggleExpand(r.external_id) }}
                          className="w-5 h-5 flex items-center justify-center rounded hover:bg-gray-200"
                        >
                          {expandedResourceIds.has(r.external_id) ? (
                            <ChevronDown size={16} />
                          ) : (
                            <ChevronRight size={16} />
                          )}
                        </button>
                      ) : (
                        <span className="w-5" />
                      )}
                      <Checkbox
                        checked={checkStates.get(r.external_id) === 'checked'}
                        onChange={() => toggleResource(r.external_id)}
                        className="pointer-events-none"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium">{r.name || t('datasource.untitled', 'Untitled')}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px] bg-gray-100 px-1.5 py-0.5 rounded">
                            {resourceTypeLabel(r.type)}
                          </span>
                          {r.description && (
                            <span className="text-xs text-gray-500 truncate">{r.description}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm font-medium">{t('datasource.noResources', 'No resources found')}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {t(`datasource.noResourcesDesc_${form.type}`, t('datasource.noResourcesDesc', 'Check your permissions'))}
                  </p>
                  <Button variant="outline" size="sm" onClick={loadResources} className="mt-3">
                    {t('datasource.retryLoadResources', 'Retry')}
                  </Button>
                  {currentDef?.permissionDocUrl && (
                    <a href={currentDef.permissionDocUrl} target="_blank" rel="noopener noreferrer" className="block text-xs text-[var(--td-brand-color)] mt-2">
                      {t('datasource.permissionDocLink', 'Permission documentation')} â†—
                    </a>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Sync strategy */}
          {step === 3 && (
            <div className="ds-step-content space-y-4">
              {/* Sync schedule */}
              <div>
                <label className="block text-sm font-medium mb-1.5">{t('datasource.syncScheduleLabel', 'Sync Schedule')}</label>
                <select
                  value={form.sync_schedule}
                  onChange={e => setForm(prev => ({ ...prev, sync_schedule: e.target.value }))}
                  className="w-full rounded border border-[var(--td-border-level-1-color)] px-3 py-2 text-sm focus:outline-none focus:border-[var(--td-brand-color)]"
                >
                  {SCHEDULE_PRESETS.map(p => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>

              {/* Sync mode */}
              <div>
                <label className="block text-sm font-medium mb-1.5">{t('datasource.syncModeLabel', 'Sync Mode')}</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="sync_mode"
                      value="incremental"
                      checked={form.sync_mode === 'incremental'}
                      onChange={() => setForm(prev => ({ ...prev, sync_mode: 'incremental' }))}
                    />
                    <span className="text-sm">{t('datasource.syncMode.incremental', 'Incremental')}</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="sync_mode"
                      value="full"
                      checked={form.sync_mode === 'full'}
                      onChange={() => setForm(prev => ({ ...prev, sync_mode: 'full' }))}
                    />
                    <span className="text-sm">{t('datasource.syncMode.full', 'Full')}</span>
                  </label>
                </div>
              </div>

              {/* Conflict strategy */}
              <div>
                <label className="block text-sm font-medium mb-1.5">{t('datasource.conflictLabel', 'Conflict Resolution')}</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="conflict_strategy"
                      value="overwrite"
                      checked={form.conflict_strategy === 'overwrite'}
                      onChange={() => setForm(prev => ({ ...prev, conflict_strategy: 'overwrite' }))}
                    />
                    <span className="text-sm">{t('datasource.conflict.overwrite', 'Overwrite')}</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="conflict_strategy"
                      value="skip"
                      checked={form.conflict_strategy === 'skip'}
                      onChange={() => setForm(prev => ({ ...prev, conflict_strategy: 'skip' }))}
                    />
                    <span className="text-sm">{t('datasource.conflict.skip', 'Skip')}</span>
                  </label>
                </div>
              </div>

              {/* Sync deletions */}
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={form.sync_deletions}
                    onCheckedChange={checked => setForm(prev => ({ ...prev, sync_deletions: !!checked }))}
                  />
                  <span className="text-sm">{t('datasource.syncDeletions', 'Sync deletions')}</span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-4 border-t border-[var(--td-border-level-1-color)]">
          {step > 0 && (
            <Button variant="outline" onClick={prevStep}>
              {t('datasource.back', 'Back')}
            </Button>
          )}
          {step < 3 && (
            <Button onClick={nextStep}>
              {t('datasource.next', 'Next')}
            </Button>
          )}
          {step === 3 && (
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting && <Loader2 size={14} className="animate-spin mr-2" />}
              {isEdit ? t('datasource.save', 'Save') : t('datasource.createAndSync', 'Create & Sync')}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}