import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2 } from 'lucide-react'

export function RetrievalSettings() {
  const { t } = useTranslation()
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    topK: 5,
    similarityThreshold: 0.5,
    rerankTopK: 10,
    rerankThreshold: 0.3,
  })

  const handleSave = async () => {
    setSaving(true)
    try {
      // In production, this would save to API
      alert(t('common.success'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">{t('settings.retrieval')}</h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">{t('settings.topK')}</label>
            <Input
              type="number"
              value={formData.topK}
              onChange={(e) => setFormData({ ...formData, topK: parseInt(e.target.value) || 5 })}
              min={1}
              max={20}
              className="max-w-xs"
            />
            <p className="text-xs text-[var(--td-text-color-secondary)] mt-1">
              {t('settings.topKDescription')}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">{t('settings.similarityThreshold')}</label>
            <Input
              type="number"
              value={formData.similarityThreshold}
              onChange={(e) => setFormData({ ...formData, similarityThreshold: parseFloat(e.target.value) || 0.5 })}
              min={0}
              max={1}
              step={0.1}
              className="max-w-xs"
            />
            <p className="text-xs text-[var(--td-text-color-secondary)] mt-1">
              {t('settings.similarityThresholdDescription')}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">{t('settings.rerankTopK') || 'Rerank Top K'}</label>
            <Input
              type="number"
              value={formData.rerankTopK}
              onChange={(e) => setFormData({ ...formData, rerankTopK: parseInt(e.target.value) || 10 })}
              min={1}
              max={50}
              className="max-w-xs"
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
