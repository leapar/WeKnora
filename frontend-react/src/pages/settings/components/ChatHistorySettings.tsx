import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

interface ChatHistorySettingsProps {
  retentionDays?: number
  maxSessions?: number
  enableAutoDelete?: boolean
  onUpdate?: (settings: {
    retentionDays?: number
    maxSessions?: number
    enableAutoDelete?: boolean
  }) => void
}

export function ChatHistorySettings({
  retentionDays = 30,
  maxSessions = 100,
  enableAutoDelete = false,
  onUpdate,
}: ChatHistorySettingsProps) {
  const { t } = useTranslation()

  const [localRetentionDays, setLocalRetentionDays] = useState(retentionDays)
  const [localMaxSessions, setLocalMaxSessions] = useState(maxSessions)
  const [localEnableAutoDelete, setLocalEnableAutoDelete] = useState(enableAutoDelete)

  useEffect(() => {
    setLocalRetentionDays(retentionDays)
    setLocalMaxSessions(maxSessions)
    setLocalEnableAutoDelete(enableAutoDelete)
  }, [retentionDays, maxSessions, enableAutoDelete])

  const handleUpdate = (updates: Partial<{
    retentionDays: number
    maxSessions: number
    enableAutoDelete: boolean
  }>) => {
    if (updates.retentionDays !== undefined) setLocalRetentionDays(updates.retentionDays)
    if (updates.maxSessions !== undefined) setLocalMaxSessions(updates.maxSessions)
    if (updates.enableAutoDelete !== undefined) setLocalEnableAutoDelete(updates.enableAutoDelete)
    onUpdate?.({
      retentionDays: updates.retentionDays ?? localRetentionDays,
      maxSessions: updates.maxSessions ?? localMaxSessions,
      enableAutoDelete: updates.enableAutoDelete ?? localEnableAutoDelete,
    })
  }

  return (
    <div className="chat-history-settings">
      <div className="section-header mb-6">
        <h2 className="text-lg font-medium">{t('chatHistorySettings.title', 'Chat History Settings')}</h2>
        <p className="text-sm text-[var(--td-text-color-secondary)] mt-1">
          {t('chatHistorySettings.description', 'Configure how chat history is stored and managed')}
        </p>
      </div>

      <div className="space-y-6">
        {/* Enable Auto Delete */}
        <div className="setting-row">
          <div className="setting-info">
            <label className="font-medium text-sm">
              {t('chatHistorySettings.enableAutoDelete.label', 'Enable Auto-Delete')}
            </label>
            <p className="text-xs text-[var(--td-text-color-secondary)] mt-0.5">
              {t('chatHistorySettings.enableAutoDelete.desc', 'Automatically delete old chat sessions')}
            </p>
          </div>
          <div className="setting-control">
            <button
              type="button"
              onClick={() => handleUpdate({ enableAutoDelete: !localEnableAutoDelete })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                localEnableAutoDelete ? 'bg-[var(--td-brand-color)]' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  localEnableAutoDelete ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Retention Days */}
        {localEnableAutoDelete && (
          <div className="setting-row">
            <div className="setting-info">
              <label className="font-medium text-sm">
                {t('chatHistorySettings.retentionDays.label', 'Retention Period')}
              </label>
              <p className="text-xs text-[var(--td-text-color-secondary)] mt-0.5">
                {t('chatHistorySettings.retentionDays.desc', 'Number of days to keep chat history')}
              </p>
            </div>
            <div className="setting-control">
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="1"
                  max="365"
                  step="1"
                  value={localRetentionDays}
                  onChange={(e) => handleUpdate({ retentionDays: Number(e.target.value) })}
                  className="w-48"
                />
                <span className="text-sm font-medium min-w-[80px]">
                  {localRetentionDays} {t('chatHistorySettings.days', 'days')}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Max Sessions */}
        {localEnableAutoDelete && (
          <div className="setting-row">
            <div className="setting-info">
              <label className="font-medium text-sm">
                {t('chatHistorySettings.maxSessions.label', 'Maximum Sessions')}
              </label>
              <p className="text-xs text-[var(--td-text-color-secondary)] mt-0.5">
                {t('chatHistorySettings.maxSessions.desc', 'Maximum number of chat sessions to keep')}
              </p>
            </div>
            <div className="setting-control">
              <input
                type="number"
                min="1"
                max="10000"
                value={localMaxSessions}
                onChange={(e) => handleUpdate({ maxSessions: Number(e.target.value) })}
                className="px-3 py-2 rounded-lg border border-[var(--td-border-level-1-color)] bg-white text-sm w-32"
              />
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            {t('chatHistorySettings.info', 'Chat history is stored locally on your device. Clearing browser data will also remove chat history.')}
          </p>
        </div>
      </div>
    </div>
  )
}
