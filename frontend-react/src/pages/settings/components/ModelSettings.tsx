import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2 } from 'lucide-react'
import { useSettingsStore } from '@/stores/settingsStore'

export function ModelSettings() {
  const { t } = useTranslation()
  const { settings, updateModelConfig } = useSettingsStore()
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    chatModelId: settings.modelConfig?.chatModelId || '',
    embeddingModelId: settings.modelConfig?.embeddingModelId || '',
    rerankModelId: settings.modelConfig?.rerankModelId || '',
    summaryModelId: settings.modelConfig?.summaryModelId || '',
  })

  useEffect(() => {
    setFormData({
      chatModelId: settings.modelConfig?.chatModelId || '',
      embeddingModelId: settings.modelConfig?.embeddingModelId || '',
      rerankModelId: settings.modelConfig?.rerankModelId || '',
      summaryModelId: settings.modelConfig?.summaryModelId || '',
    })
  }, [settings.modelConfig])

  const handleSave = async () => {
    setSaving(true)
    try {
      updateModelConfig({
        chatModelId: formData.chatModelId,
        embeddingModelId: formData.embeddingModelId,
        rerankModelId: formData.rerankModelId,
      })
      alert(t('common.success'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">{t('settings.model')}</h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">{t('settings.chatModel')}</label>
            <Input
              value={formData.chatModelId}
              onChange={(e) => setFormData({ ...formData, chatModelId: e.target.value })}
              placeholder="gpt-4o-mini"
            />
            <p className="text-xs text-[var(--td-text-color-secondary)] mt-1">
              {t('settings.chatModelDescription')}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">{t('settings.embeddingModel')}</label>
            <Input
              value={formData.embeddingModelId}
              onChange={(e) => setFormData({ ...formData, embeddingModelId: e.target.value })}
              placeholder="text-embedding-3-small"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">{t('settings.rerankModel')}</label>
            <Input
              value={formData.rerankModelId}
              onChange={(e) => setFormData({ ...formData, rerankModelId: e.target.value })}
              placeholder="bge-reranker-base"
            />
          </div>
        </div>
      </div>
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="animate-spin mr-2" size={16} />}
          {t('common.save')}
        </Button>
      </div>
    </div>
  )
}
