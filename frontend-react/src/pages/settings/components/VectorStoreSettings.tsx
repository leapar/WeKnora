import { useState, useEffect, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Loader2, Plus, Lock, X, Info, ChevronRight, ChevronDown } from 'lucide-react'
import {
  listVectorStores,
  listVectorStoreTypes,
  createVectorStore,
  updateVectorStore,
  deleteVectorStore,
  testVectorStoreRaw,
  testVectorStoreById,
  type VectorStoreEntity,
  type VectorStoreTypeInfo,
  type FieldSchema,
} from '@/api/vector-store'

interface TestResult {
  success: boolean
  message: string
}

const indexNamePattern = /^[a-zA-Z][a-zA-Z0-9_-]{0,127}$/
const replicaFieldNames = ['number_of_replicas', 'replication_factor', 'replica_number']

const isReplicaField = (name: string): boolean => replicaFieldNames.includes(name)

export function VectorStoreSettings() {
  const { t } = useTranslation()

  const [stores, setStores] = useState<VectorStoreEntity[]>([])
  const [storeTypes, setStoreTypes] = useState<VectorStoreTypeInfo[]>([])
  const [loading, setLoading] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const [editingStore, setEditingStore] = useState<VectorStoreEntity | null>(null)
  const [testing, setTesting] = useState(false)
  const [testingId, setTestingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [testResults, setTestResults] = useState<Record<string, TestResult | null>>({})
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  const [form, setForm] = useState({
    name: '',
    engine_type: '',
    connection_config: {} as Record<string, any>,
    index_config: {} as Record<string, any>,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const envStores = useMemo(() => stores.filter((s) => s.source === 'env'), [stores])
  const userStores = useMemo(() => stores.filter((s) => s.source === 'user'), [stores])
  const selectedType = useMemo(
    () => storeTypes.find((st) => st.type === form.engine_type),
    [storeTypes, form.engine_type]
  )

  const fieldLabel = useCallback(
    (name: string): string => {
      const key = `vectorStoreSettings.fields.${name}`
      const translated = t(key)
      return translated === key ? name : translated
    },
    [t]
  )

  const loadStores = async () => {
    try {
      const data = await listVectorStores()
      setStores(data)
    } catch (error) {
      console.error('Failed to load vector stores:', error)
    }
  }

  const loadStoreTypes = async () => {
    try {
      const data = await listVectorStoreTypes()
      setStoreTypes(data)
    } catch (error) {
      console.error('Failed to load vector store types:', error)
    }
  }

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      try {
        await Promise.all([loadStoreTypes(), loadStores()])
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  const getTestResult = (store: VectorStoreEntity): TestResult | null => {
    return store.id ? testResults[store.id] ?? null : null
  }

  const getStoreEndpoint = (store: VectorStoreEntity): string => {
    const cc = store.connection_config || {}
    return cc.addr || cc.host || ''
  }

  const openAddDialog = () => {
    setEditingStore(null)
    setShowAdvanced(false)
    setForm({
      name: '',
      engine_type: storeTypes[0]?.type || '',
      connection_config: {},
      index_config: {},
    })
    setErrors({})
    setShowDialog(true)
  }

  const editStore = (store: VectorStoreEntity) => {
    setEditingStore(store)
    setShowAdvanced(false)
    setForm({
      name: store.name,
      engine_type: store.engine_type,
      connection_config: { ...store.connection_config },
      index_config: { ...store.index_config },
    })
    setErrors({})
    setShowDialog(true)
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!form.name.trim()) {
      newErrors.name = t('vectorStoreSettings.validation.nameRequired')
    }

    if (!editingStore) {
      if (!form.engine_type) {
        newErrors.engine_type = t('vectorStoreSettings.validation.engineTypeRequired')
      }

      if (selectedType) {
        for (const field of selectedType.connection_fields) {
          if (field.required && !form.connection_config[field.name]) {
            newErrors[`connection_config.${field.name}`] = t(
              'vectorStoreSettings.validation.fieldRequired',
              { field: fieldLabel(field.name) }
            )
          }
        }

        for (const field of selectedType.index_fields || []) {
          if (field.type === 'string' && form.index_config[field.name]) {
            if (!indexNamePattern.test(form.index_config[field.name])) {
              newErrors[`index_config.${field.name}`] = t(
                'vectorStoreSettings.validation.indexNamePattern'
              )
            }
          }
        }
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const saveStore = async () => {
    if (!validate()) return

    setSaving(true)
    try {
      if (editingStore) {
        await updateVectorStore(editingStore.id!, { name: form.name.trim() })
        alert(t('vectorStoreSettings.toasts.storeUpdated'))
      } else {
        const data: Partial<VectorStoreEntity> = {
          name: form.name.trim(),
          engine_type: form.engine_type,
          connection_config: { ...form.connection_config },
          index_config: showAdvanced ? { ...form.index_config } : {},
        }
        await createVectorStore(data)
        alert(t('vectorStoreSettings.toasts.storeCreated'))
      }
      setShowDialog(false)
      await loadStores()
    } catch (error: any) {
      const msg = error?.message || t('vectorStoreSettings.toasts.errorGeneric')
      if (msg.toLowerCase().includes('already exists') || msg.toLowerCase().includes('duplicate')) {
        alert(t('vectorStoreSettings.toasts.duplicateName'))
      } else {
        alert(msg)
      }
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = async (store: VectorStoreEntity) => {
    if (!store.id) return
    try {
      await deleteVectorStore(store.id)
      alert(t('vectorStoreSettings.toasts.storeDeleted'))
      await loadStores()
    } catch (error: any) {
      alert(error?.message || t('vectorStoreSettings.toasts.errorGeneric'))
    }
    setDeleteConfirmId(null)
  }

  const clearTestResult = (store: VectorStoreEntity) => {
    if (store.id) {
      setTestResults((prev) => {
        const { [store.id!]: _, ...rest } = prev
        return rest
      })
    }
  }

  const testExisting = async (store: VectorStoreEntity) => {
    if (!store.id) return
    setTestingId(store.id)
    setTestResults((prev) => ({ ...prev, [store.id!]: null }))
    try {
      const res = await testVectorStoreById(store.id)
      setTestResults((prev) => ({
        ...prev,
        [store.id!]: {
          success: res.success,
          message: res.success
            ? t('vectorStoreSettings.toasts.testSuccess')
            : res.error || t('vectorStoreSettings.toasts.testFailed'),
        },
      }))
    } catch (error: any) {
      setTestResults((prev) => ({
        ...prev,
        [store.id!]: {
          success: false,
          message: error?.message || t('vectorStoreSettings.toasts.testFailed'),
        },
      }))
    } finally {
      setTestingId(null)
    }
  }

  const testFromDialog = async () => {
    setTesting(true)
    try {
      const data = {
        engine_type: form.engine_type,
        connection_config: { ...form.connection_config },
      }
      const res = await testVectorStoreRaw(data)
      if (res.success) {
        alert(t('vectorStoreSettings.toasts.testSuccess'))
      } else {
        alert(res.error || t('vectorStoreSettings.toasts.testFailed'))
      }
    } catch (error: any) {
      alert(error?.message || t('vectorStoreSettings.toasts.testFailed'))
    } finally {
      setTesting(false)
    }
  }

  const renderFormField = (field: FieldSchema) => {
    const value = field.type === 'boolean'
      ? form.connection_config[field.name]
      : form.connection_config[field.name] ?? ''

    const handleChange = (newValue: any) => {
      setForm((f) => ({
        ...f,
        connection_config: { ...f.connection_config, [field.name]: newValue },
      }))
      setErrors((e) => {
        const next = { ...e }
        delete next[`connection_config.${field.name}`]
        return next
      })
    }

    if (field.type === 'boolean') {
      return (
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={!!value}
            onChange={(e) => handleChange(e.target.checked)}
            className="w-4 h-4 rounded border-[var(--td-border-level-1-color)]"
          />
          <span className="text-sm">{fieldLabel(field.name)}</span>
        </label>
      )
    }

    if (field.type === 'number') {
      const maxVal = isReplicaField(field.name) ? 10 : 64
      return (
        <Input
          type="number"
          value={value}
          onChange={(e) => handleChange(parseInt(e.target.value) || undefined)}
          placeholder={field.default != null ? String(field.default) : ' '}
          min={1}
          max={maxVal}
        />
      )
    }

    if (field.sensitive) {
      return (
        <Input
          type="password"
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="********"
        />
      )
    }

    return (
      <Input
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={field.default?.toString() || ''}
      />
    )
  }

  const renderIndexField = (field: FieldSchema) => {
    const value = form.index_config[field.name] ?? ''

    const handleChange = (newValue: any) => {
      setForm((f) => ({
        ...f,
        index_config: { ...f.index_config, [field.name]: newValue },
      }))
      setErrors((e) => {
        const next = { ...e }
        delete next[`index_config.${field.name}`]
        return next
      })
    }

    if (field.type === 'number') {
      const maxVal = isReplicaField(field.name) ? 10 : 64
      return (
        <Input
          type="number"
          value={value}
          onChange={(e) => handleChange(parseInt(e.target.value) || undefined)}
          placeholder={field.default?.toString()}
          min={1}
          max={maxVal}
        />
      )
    }

    return (
      <Input
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={field.default?.toString() || ''}
        maxLength={128}
      />
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="animate-spin text-[var(--td-brand-color)]" size={24} />
      </div>
    )
  }

  return (
    <div className="vectorstore-settings">
      <div className="section-header mb-8">
        <h2 className="text-xl font-semibold mb-2">{t('vectorStoreSettings.title')}</h2>
        <p className="text-sm text-[var(--td-text-color-secondary)]">
          {t('vectorStoreSettings.description')}
        </p>
      </div>

      <div className="settings-group">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold">{t('vectorStoreSettings.storesTitle')}</h3>
          <Button onClick={openAddDialog} size="sm">
            <Plus size={14} className="mr-1" />
            {t('vectorStoreSettings.addStore')}
          </Button>
        </div>

        {/* Store List */}
        {userStores.length > 0 || envStores.length > 0 ? (
          <div className="space-y-2">
            {/* Env Stores */}
            {envStores.map((store) => (
              <div key={store.id} className="store-item store-item--env">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <Lock size={14} className="text-[var(--td-text-color-secondary)] flex-shrink-0" />
                    <span className="font-medium text-sm truncate">{store.name}</span>
                    <span className="px-2 py-0.5 text-xs rounded bg-yellow-50 text-yellow-700 border border-yellow-200">
                      {t('vectorStoreSettings.envTag')}
                    </span>
                    <span className="px-2 py-0.5 text-xs rounded border border-gray-200 text-gray-600">
                      {store.engine_type}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      loading={testingId === store.id}
                      onClick={() => testExisting(store)}
                    >
                      {t('vectorStoreSettings.testConnection')}
                    </Button>
                  </div>
                </div>
                {getTestResult(store) && (
                  <div
                    className={`mt-3 p-2 rounded text-xs flex items-center justify-between ${
                      getTestResult(store)!.success
                        ? 'bg-green-50 text-green-700'
                        : 'bg-red-50 text-red-700'
                    }`}
                  >
                    <span className="flex-1 break-all">{getTestResult(store)!.message}</span>
                    <button
                      onClick={() => clearTestResult(store)}
                      className="ml-2 opacity-60 hover:opacity-100"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}
              </div>
            ))}

            {/* User Stores */}
            {userStores.map((store) => (
              <div key={store.id} className="store-item">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">{store.name}</span>
                      <span className="px-2 py-0.5 text-xs rounded border border-gray-200 text-gray-600">
                        {store.engine_type}
                      </span>
                    </div>
                    <span className="text-xs text-[var(--td-text-color-secondary)] truncate">
                      {getStoreEndpoint(store)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      loading={testingId === store.id}
                      onClick={() => testExisting(store)}
                    >
                      {t('vectorStoreSettings.testConnection')}
                    </Button>
                    {deleteConfirmId === store.id ? (
                      <>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => confirmDelete(store)}
                        >
                          {t('common.delete')}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setDeleteConfirmId(null)}>
                          {t('common.cancel')}
                        </Button>
                      </>
                    ) : (
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => editStore(store)}>
                          <span className="text-xs">{t('common.edit')}</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteConfirmId(store.id!)}
                        >
                          <span className="text-xs text-red-600">{t('common.delete')}</span>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                {getTestResult(store) && (
                  <div
                    className={`mt-3 p-2 rounded text-xs flex items-center justify-between ${
                      getTestResult(store)!.success
                        ? 'bg-green-50 text-green-700'
                        : 'bg-red-50 text-red-700'
                    }`}
                  >
                    <span className="flex-1 break-all">{getTestResult(store)!.message}</span>
                    <button
                      onClick={() => clearTestResult(store)}
                      className="ml-2 opacity-60 hover:opacity-100"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-stores">
            <p>{t('vectorStoreSettings.emptyDesc')}</p>
          </div>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {editingStore
                ? t('vectorStoreSettings.editStore')
                : t('vectorStoreSettings.addStore')}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto pr-2 space-y-4">
            {/* Edit Mode: immutable info banner + readonly fields */}
            {editingStore && (
              <>
                <div className="flex items-start gap-2 p-3 rounded bg-green-50 text-green-700 text-sm">
                  <Info size={14} className="mt-0.5 flex-shrink-0" />
                  <span className="whitespace-pre-line">
                    {t('vectorStoreSettings.immutableNotice')}
                  </span>
                </div>
                <div className="p-3 rounded bg-gray-50 space-y-1">
                  <div className="flex items-baseline gap-2 text-xs">
                    <span className="text-gray-500 min-w-[80px]">
                      {t('vectorStoreSettings.engineTypeLabel')}
                    </span>
                    <span className="font-mono text-gray-900 break-all">
                      {selectedType?.display_name || editingStore.engine_type}
                    </span>
                  </div>
                  {selectedType &&
                    selectedType.connection_fields
                      .filter((f) => f.sensitive || form.connection_config[f.name])
                      .map((field) => (
                        <div key={field.name} className="flex items-baseline gap-2 text-xs">
                          <span className="text-gray-500 min-w-[80px]">{fieldLabel(field.name)}</span>
                          <span className="font-mono text-gray-900 break-all">
                            {field.sensitive ? '********' : String(form.connection_config[field.name])}
                          </span>
                        </div>
                      ))}
                  {selectedType?.index_fields?.length &&
                    selectedType.index_fields
                      .filter((f) => form.index_config[f.name])
                      .map((field) => (
                        <div key={field.name} className="flex items-baseline gap-2 text-xs">
                          <span className="text-gray-500 min-w-[80px]">{fieldLabel(field.name)}</span>
                          <span className="font-mono text-gray-900 break-all">
                            {String(form.index_config[field.name])}
                          </span>
                        </div>
                      ))}
                </div>
                <div className="h-px bg-[var(--td-component-border)] my-4" />
              </>
            )}

            {/* Form */}
            <div className="space-y-4">
              {/* Engine Type (only in create mode) */}
              {!editingStore && (
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    {t('vectorStoreSettings.engineTypeLabel')}
                  </label>
                  <Select
                    value={form.engine_type}
                    onChange={(e) => setForm((f) => ({ ...f, engine_type: e.target.value }))}
                  >
                    {storeTypes.map((st) => (
                      <option key={st.type} value={st.type}>
                        {st.display_name}
                      </option>
                    ))}
                  </Select>
                  {errors.engine_type && (
                    <p className="text-xs text-red-500 mt-1">{errors.engine_type}</p>
                  )}
                </div>
              )}

              {/* Name */}
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  {t('vectorStoreSettings.nameLabel')}
                </label>
                <Input
                  value={form.name}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, name: e.target.value }))
                    setErrors((err) => {
                      const next = { ...err }
                      delete next.name
                      return next
                    })
                  }}
                  placeholder={t('vectorStoreSettings.namePlaceholder')}
                />
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
              </div>

              {/* Connection fields (only in create mode) */}
              {!editingStore && selectedType && (
                <>
                  <div className="h-px bg-[var(--td-component-border)] my-4" />
                  <div className="text-sm font-medium text-[var(--td-text-color-secondary)] mb-3">
                    {t('vectorStoreSettings.connectionInfo')}
                  </div>

                  {selectedType.connection_fields.map((field) => (
                    <div key={field.name} className="mb-3">
                      <label className="block text-sm font-medium mb-1.5">
                        {fieldLabel(field.name)}
                      </label>
                      {renderFormField(field)}
                      {errors[`connection_config.${field.name}`] && (
                        <p className="text-xs text-red-500 mt-1">
                          {errors[`connection_config.${field.name}`]}
                        </p>
                      )}
                    </div>
                  ))}

                  {/* Advanced: index fields */}
                  {selectedType.index_fields?.length && (
                    <>
                      <div className="h-px bg-[var(--td-component-border)] my-4" />
                      <button
                        type="button"
                        className="flex items-center gap-1.5 text-sm text-[var(--td-text-color-secondary)] hover:text-[var(--td-brand-color)] cursor-pointer"
                        onClick={() => setShowAdvanced((v) => !v)}
                      >
                        {showAdvanced ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        <span>{t('vectorStoreSettings.advancedIndexConfig')}</span>
                      </button>

                      {showAdvanced && (
                        <div className="mt-3 space-y-3">
                          {selectedType.index_fields.map((field) => (
                            <div key={field.name}>
                              <label className="block text-sm font-medium mb-1.5">
                                {fieldLabel(field.name)}
                              </label>
                              {renderIndexField(field)}
                              {errors[`index_config.${field.name}`] && (
                                <p className="text-xs text-red-500 mt-1">
                                  {errors[`index_config.${field.name}`]}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          </div>

          <DialogFooter className="flex items-center justify-between pt-4 border-t">
            <div>
              {!editingStore && (
                <Button variant="outline" onClick={testFromDialog} disabled={testing}>
                  {testing && <Loader2 size={14} className="animate-spin mr-1" />}
                  {t('vectorStoreSettings.testConnection')}
                </Button>
              )}
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setShowDialog(false)}>{t('common.cancel')}</Button>
              <Button onClick={saveStore} loading={saving}>
                {t('common.save')}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}