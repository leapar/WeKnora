import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Plus, Loader2, Trash2, RefreshCw, Pause, Play, FileText, Link, Database } from 'lucide-react'

interface DataSource {
  id: string
  name: string
  type: string
  status?: string
  config?: any
  latest_sync_log?: {
    status: string
    started_at?: string
    finished_at?: string
    error?: string
  }
  created_at: string
}

interface DataSourceSettingsProps {
  kbId: string
  onCountChange?: (count: number) => void
}

// Mock data source types
const DATA_SOURCE_TYPES = [
  { value: 'web', label: 'Web URL', icon: Link },
  { value: 'database', label: 'Database', icon: Database },
  { value: 'file', label: 'File System', icon: FileText },
]

function DataSourceTypeIcon({ type }: { type: string }) {
  const config = DATA_SOURCE_TYPES.find(t => t.value === type)
  const Icon = config?.icon || FileText
  return <Icon size={16} className="text-[var(--td-brand-color)]" />
}

export function DataSourceSettings({ kbId, onCountChange }: DataSourceSettingsProps) {
  const { t } = useTranslation()

  const [dataSources, setDataSources] = useState<DataSource[]>([])
  const [loading] = useState(false)
  const [showEditor, setShowEditor] = useState(false)
  const [editingDs, setEditingDs] = useState<DataSource | null>(null)

  useEffect(() => {
    // In production, load from API
    // loadDataSources()
    setDataSources([])
  }, [kbId])

  useEffect(() => {
    onCountChange?.(dataSources.length)
  }, [dataSources.length, onCountChange])

  const handleCreate = () => {
    setEditingDs(null)
    setShowEditor(true)
  }

  const handleEdit = (ds: DataSource) => {
    setEditingDs(ds)
    setShowEditor(true)
  }

  const handleDelete = async (ds: DataSource) => {
    if (!confirm(t('datasource.deleteConfirm', 'Are you sure you want to delete this data source?'))) {
      return
    }
    try {
      // await deleteDataSource(ds.id)
      setDataSources(prev => prev.filter(d => d.id !== ds.id))
    } catch (e) {
      console.error('Failed to delete data source:', e)
    }
  }

  const handleSync = async (_ds: DataSource) => {
    try {
      // await triggerSync(_ds.id)
      // Reload to show updated status
    } catch (e) {
      console.error('Failed to trigger sync:', e)
    }
  }

  const handlePause = async (_ds: DataSource) => {
    try {
      // await pauseDataSource(_ds.id)
    } catch (e) {
      console.error('Failed to pause data source:', e)
    }
  }

  const handleResume = async (_ds: DataSource) => {
    try {
      // await resumeDataSource(ds.id)
    } catch (e) {
      console.error('Failed to resume data source:', e)
    }
  }

  const getSyncStatusBadge = (status?: string) => {
    switch (status) {
      case 'running':
        return <span className="px-2 py-0.5 text-xs rounded bg-blue-100 text-blue-700">Running</span>
      case 'completed':
        return <span className="px-2 py-0.5 text-xs rounded bg-green-100 text-green-700">Completed</span>
      case 'failed':
        return <span className="px-2 py-0.5 text-xs rounded bg-red-100 text-red-700">Failed</span>
      case 'paused':
        return <span className="px-2 py-0.5 text-xs rounded bg-yellow-100 text-yellow-700">Paused</span>
      default:
        return <span className="px-2 py-0.5 text-xs rounded bg-gray-100 text-gray-600">Idle</span>
    }
  }

  return (
    <div className="data-source-settings">
      <div className="section-header mb-6">
        <h2 className="text-lg font-medium">{t('datasource.title', 'Data Sources')}</h2>
        <p className="text-sm text-[var(--td-text-color-secondary)] mt-1">
          {t('datasource.description', 'Configure external data sources to sync content into this knowledge base')}
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-6">
        <div className="text-sm text-[var(--td-text-color-secondary)]">
          {dataSources.length} {t('datasource.sources', 'sources')}
        </div>
        <Button onClick={handleCreate}>
          <Plus size={16} className="mr-2" />
          {t('datasource.add', 'Add Data Source')}
        </Button>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-[var(--td-brand-color)]" size={32} />
        </div>
      ) : dataSources.length === 0 ? (
        /* Empty State */
        <div className="text-center py-12 bg-white rounded-lg border border-[var(--td-border-level-1-color)]">
          <Database size={48} className="mx-auto mb-4 text-[var(--td-text-color-placeholder)]" />
          <p className="text-[var(--td-text-color-secondary)] mb-4">
            {t('datasource.empty', 'No data sources configured')}
          </p>
          <Button onClick={handleCreate}>
            <Plus size={16} className="mr-2" />
            {t('datasource.addFirst', 'Add your first data source')}
          </Button>
        </div>
      ) : (
        /* Data Source List */
        <div className="space-y-3">
          {dataSources.map((ds) => (
            <div
              key={ds.id}
              className="bg-white rounded-lg border border-[var(--td-border-level-1-color)] p-4 hover:border-[var(--td-brand-color)] transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <DataSourceTypeIcon type={ds.type} />
                  <div>
                    <h4 className="font-medium">{ds.name}</h4>
                    <p className="text-xs text-[var(--td-text-color-secondary)]">
                      {ds.type} • Created {new Date(ds.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {getSyncStatusBadge(ds.latest_sync_log?.status)}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSync(ds)}
                    title={t('datasource.sync', 'Sync')}
                  >
                    <RefreshCw size={14} />
                  </Button>

                  {ds.latest_sync_log?.status === 'running' ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handlePause(ds)}
                      title={t('datasource.pause', 'Pause')}
                    >
                      <Pause size={14} />
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleResume(ds)}
                      title={t('datasource.resume', 'Resume')}
                    >
                      <Play size={14} />
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(ds)}
                    title={t('common.edit', 'Edit')}
                  >
                    Edit
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(ds)}
                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    title={t('common.delete', 'Delete')}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Editor Dialog - simplified placeholder */}
      {showEditor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium mb-4">
              {editingDs ? t('datasource.edit', 'Edit Data Source') : t('datasource.create', 'Create Data Source')}
            </h3>
            <p className="text-sm text-[var(--td-text-color-secondary)] mb-4">
              Data source editor would go here
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowEditor(false)}>
                {t('common.cancel', 'Cancel')}
              </Button>
              <Button onClick={() => setShowEditor(false)}>
                {t('common.save', 'Save')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
