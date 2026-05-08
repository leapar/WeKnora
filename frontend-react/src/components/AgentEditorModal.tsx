import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Loader2 } from 'lucide-react'
import { createAgent, updateAgent } from '@/api/agent'
import type { Agent } from '@/types'

interface AgentEditorModalProps {
  visible: boolean
  mode: 'create' | 'edit'
  agent?: Agent | null
  onClose: () => void
  onSuccess: () => void
}

export function AgentEditorModal({
  visible,
  mode,
  agent,
  onClose,
  onSuccess,
}: AgentEditorModalProps) {
  const { t } = useTranslation()
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'assistant' as 'assistant' | 'agent',
    prompt: '',
    model_id: '',
    temperature: 0.7,
  })

  useEffect(() => {
    if (visible) {
      if (mode === 'edit' && agent) {
        setFormData({
          name: agent.name || '',
          description: agent.description || '',
          type: agent.type || 'assistant',
          prompt: agent.prompt || '',
          model_id: agent.model_id || '',
          temperature: agent.temperature || 0.7,
        })
      } else {
        setFormData({
          name: '',
          description: '',
          type: 'assistant',
          prompt: '',
          model_id: '',
          temperature: 0.7,
        })
      }
    }
  }, [visible, mode, agent])

  const handleSubmit = async () => {
    if (!formData.name.trim()) return

    setSubmitting(true)
    try {
      let response
      if (mode === 'create') {
        response = await createAgent({
          name: formData.name.trim(),
          description: formData.description.trim(),
          type: formData.type,
          prompt: formData.prompt || undefined,
          model_id: formData.model_id || undefined,
          temperature: formData.temperature,
        })
      } else if (agent?.id) {
        response = await updateAgent(agent.id, {
          name: formData.name.trim(),
          description: formData.description.trim(),
          type: formData.type,
          prompt: formData.prompt || undefined,
          model_id: formData.model_id || undefined,
          temperature: formData.temperature,
        })
      }

      if (response?.success) {
        onSuccess()
        onClose()
      } else {
        alert(response?.message || 'Failed to save agent')
      }
    } catch (error) {
      console.error('Failed to save agent:', error)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={visible} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? t('agent.create') : t('common.edit')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Name */}
          <div className="form-item">
            <label className="text-sm font-medium mb-2 block">
              {t('knowledge.name')} *
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder={t('knowledge.name')}
            />
          </div>

          {/* Description */}
          <div className="form-item">
            <label className="text-sm font-medium mb-2 block">{t('knowledge.description')}</label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder={t('knowledge.description')}
              rows={3}
            />
          </div>

          {/* Type */}
          <div className="form-item">
            <label className="text-sm font-medium mb-2 block">{t('agent.type.label')}</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="agentType"
                  value="assistant"
                  checked={formData.type === 'assistant'}
                  onChange={() => setFormData({ ...formData, type: 'assistant' })}
                  className="accent-[var(--td-brand-color)]"
                />
                <span>{t('agent.mode.normal')}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="agentType"
                  value="agent"
                  checked={formData.type === 'agent'}
                  onChange={() => setFormData({ ...formData, type: 'agent' })}
                  className="accent-[var(--td-brand-color)]"
                />
                <span>{t('agent.mode.agent')}</span>
              </label>
            </div>
          </div>

          {/* System Prompt */}
          <div className="form-item">
            <label className="text-sm font-medium mb-2 block">{t('agent.prompt')}</label>
            <Textarea
              value={formData.prompt}
              onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
              placeholder={t('agent.promptPlaceholder')}
              rows={4}
            />
          </div>

          {/* Model ID */}
          <div className="form-item">
            <label className="text-sm font-medium mb-2 block">{t('settings.modelId')}</label>
            <Input
              value={formData.model_id}
              onChange={(e) => setFormData({ ...formData, model_id: e.target.value })}
              placeholder="gpt-4o-mini"
            />
          </div>

          {/* Temperature */}
          <div className="form-item">
            <label className="text-sm font-medium mb-2 block">{t('agent.temperature') || 'Temperature'}</label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min={0}
                max={1}
                step={0.1}
                value={formData.temperature}
                onChange={(e) => setFormData({ ...formData, temperature: parseFloat(e.target.value) })}
                className="flex-1 accent-[var(--td-brand-color)]"
              />
              <span className="text-sm w-12">{formData.temperature.toFixed(1)}</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={!formData.name.trim() || submitting}>
            {submitting && <Loader2 className="animate-spin mr-2" size={16} />}
            {t('common.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
