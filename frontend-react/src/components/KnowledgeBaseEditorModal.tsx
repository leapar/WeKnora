import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Loader2 } from 'lucide-react'
import { createKnowledgeBase, updateKnowledgeBase } from '@/api/knowledge-base'
import type { KnowledgeBase } from '@/types'

interface KnowledgeBaseEditorModalProps {
  visible: boolean
  mode: 'create' | 'edit'
  kbId?: string
  initialData?: Partial<KnowledgeBase>
  onClose: () => void
  onSuccess: (kb?: KnowledgeBase) => void
}

export function KnowledgeBaseEditorModal({
  visible,
  mode,
  kbId,
  initialData,
  onClose,
  onSuccess,
}: KnowledgeBaseEditorModalProps) {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState('basic')
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'document' as 'document' | 'faq',
    embedding_model_id: '',
    summary_model_id: '',
    chunking_config: {
      chunk_size: 256,
      chunk_overlap: 50,
    },
  })

  useEffect(() => {
    if (visible) {
      if (mode === 'edit' && initialData) {
        setFormData({
          name: initialData.name || '',
          description: initialData.description || '',
          type: (initialData as any).type || 'document',
          embedding_model_id: initialData.embedding_model_id || '',
          summary_model_id: initialData.summary_model_id || '',
          chunking_config: initialData.chunking_config || { chunk_size: 256, chunk_overlap: 50 },
        })
      } else {
        setFormData({
          name: '',
          description: '',
          type: 'document',
          embedding_model_id: '',
          summary_model_id: '',
          chunking_config: { chunk_size: 256, chunk_overlap: 50 },
        })
      }
      setActiveTab('basic')
    }
  }, [visible, mode, initialData])

  const handleSubmit = async () => {
    if (!formData.name.trim()) return

    setSubmitting(true)
    try {
      if (mode === 'create') {
        const response = await createKnowledgeBase({
          name: formData.name.trim(),
          description: formData.description.trim(),
          type: formData.type,
          embedding_model_id: formData.embedding_model_id || undefined,
          summary_model_id: formData.summary_model_id || undefined,
          chunking_config: formData.chunking_config,
        })
        if (response.success) {
          onSuccess(response.data)
          onClose()
        } else {
          alert(response.message || 'Failed to save knowledge base')
        }
      } else if (kbId) {
        const response = await updateKnowledgeBase(kbId, {
          name: formData.name.trim(),
          description: formData.description.trim(),
          embedding_model_id: formData.embedding_model_id || undefined,
          summary_model_id: formData.summary_model_id || undefined,
          chunking_config: formData.chunking_config,
        })
        if (response.success) {
          onSuccess(initialData as KnowledgeBase)
          onClose()
        } else {
          alert(response.message || 'Failed to save knowledge base')
        }
      }
    } catch (error) {
      console.error('Failed to save knowledge base:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const navItems = [
    { key: 'basic', label: t('knowledgeEditor.basic.title') },
    { key: 'models', label: t('knowledgeEditor.models.title') },
    { key: 'parser', label: t('knowledgeEditor.parser.title') },
    { key: 'storage', label: t('knowledgeEditor.storage.title') },
  ]

  const isFAQ = formData.type === 'faq'

  return (
    <Dialog open={visible} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? t('knowledgeEditor.titleCreate') : t('knowledgeEditor.titleEdit')}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex">
          {/* Sidebar */}
          <div className="w-48 bg-[var(--td-bg-color-settings-modal)] border-r border-[var(--td-border-level-1-color)] flex-shrink-0">
            <nav className="p-2">
              {navItems.map((item) => (
                <button
                  key={item.key}
                  onClick={() => setActiveTab(item.key)}
                  className={`w-full text-left px-4 py-2.5 rounded text-sm transition-colors ${
                    activeTab === item.key
                      ? 'bg-[var(--td-brand-color)] bg-opacity-10 text-[var(--td-brand-color)] font-medium'
                      : 'text-[var(--td-text-color-secondary)] hover:bg-[var(--td-bg-color-secondarycontainer)]'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'basic' && (
              <div className="space-y-6">
                <div className="section-header mb-4">
                  <h3 className="text-lg font-medium">{t('knowledgeEditor.basic.title')}</h3>
                  <p className="text-sm text-[var(--td-text-color-secondary)]">{t('knowledgeEditor.basic.description')}</p>
                </div>

                {/* Type Selection */}
                <div className="form-item">
                  <label className="text-sm font-medium mb-2 block">{t('knowledgeEditor.basic.typeLabel')}</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="type"
                        value="document"
                        checked={formData.type === 'document'}
                        onChange={() => setFormData({ ...formData, type: 'document' })}
                        className="accent-[var(--td-brand-color)]"
                      />
                      <span>{t('knowledgeEditor.basic.typeDocument')}</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="type"
                        value="faq"
                        checked={formData.type === 'faq'}
                        onChange={() => setFormData({ ...formData, type: 'faq' })}
                        className="accent-[var(--td-brand-color)]"
                      />
                      <span>{t('knowledgeEditor.basic.typeFAQ')}</span>
                    </label>
                  </div>
                  <p className="text-xs text-[var(--td-text-color-secondary)] mt-2">
                    {t('knowledgeEditor.basic.typeDescription')}
                  </p>
                </div>

                {/* Name */}
                <div className="form-item">
                  <label className="text-sm font-medium mb-2 block">
                    {t('knowledgeEditor.basic.nameLabel')} *
                  </label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder={t('knowledgeEditor.basic.namePlaceholder')}
                    maxLength={50}
                  />
                </div>

                {/* Description */}
                <div className="form-item">
                  <label className="text-sm font-medium mb-2 block">{t('knowledgeEditor.basic.descriptionLabel')}</label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder={t('knowledgeEditor.basic.descriptionPlaceholder')}
                    maxLength={200}
                    rows={3}
                  />
                </div>
              </div>
            )}

            {activeTab === 'models' && (
              <div className="space-y-6">
                <div className="section-header mb-4">
                  <h3 className="text-lg font-medium">{t('knowledgeEditor.models.title')}</h3>
                  <p className="text-sm text-[var(--td-text-color-secondary)]">{t('knowledgeEditor.models.description')}</p>
                </div>

                {!isFAQ && (
                  <div className="form-item">
                    <label className="text-sm font-medium mb-2 block">{t('knowledgeEditor.models.embeddingModel')}</label>
                    <Input
                      value={formData.embedding_model_id}
                      onChange={(e) => setFormData({ ...formData, embedding_model_id: e.target.value })}
                      placeholder="text-embedding-3-small"
                    />
                  </div>
                )}

                <div className="form-item">
                  <label className="text-sm font-medium mb-2 block">{t('knowledgeEditor.models.summaryModel')}</label>
                  <Input
                    value={formData.summary_model_id}
                    onChange={(e) => setFormData({ ...formData, summary_model_id: e.target.value })}
                    placeholder="gpt-4o-mini"
                  />
                </div>
              </div>
            )}

            {activeTab === 'parser' && !isFAQ && (
              <div className="space-y-6">
                <div className="section-header mb-4">
                  <h3 className="text-lg font-medium">{t('knowledgeEditor.parser.title')}</h3>
                  <p className="text-sm text-[var(--td-text-color-secondary)]">{t('knowledgeEditor.parser.description')}</p>
                </div>

                <div className="form-item">
                  <label className="text-sm font-medium mb-2 block">{t('knowledgeEditor.parser.chunkSize')}</label>
                  <Input
                    type="number"
                    value={formData.chunking_config.chunk_size}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        chunking_config: { ...formData.chunking_config, chunk_size: parseInt(e.target.value) || 256 },
                      })
                    }
                    min={64}
                    max={1024}
                  />
                </div>

                <div className="form-item">
                  <label className="text-sm font-medium mb-2 block">{t('knowledgeEditor.parser.chunkOverlap')}</label>
                  <Input
                    type="number"
                    value={formData.chunking_config.chunk_overlap}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        chunking_config: { ...formData.chunking_config, chunk_overlap: parseInt(e.target.value) || 50 },
                      })
                    }
                    min={0}
                    max={128}
                  />
                </div>
              </div>
            )}

            {activeTab === 'storage' && !isFAQ && (
              <div className="space-y-6">
                <div className="section-header mb-4">
                  <h3 className="text-lg font-medium">{t('knowledgeEditor.storage.title')}</h3>
                  <p className="text-sm text-[var(--td-text-color-secondary)]">{t('knowledgeEditor.storage.description')}</p>
                </div>

                <div className="p-4 bg-[var(--td-bg-color-secondarycontainer)] rounded-lg">
                  <p className="text-sm text-[var(--td-text-color-secondary)]">
                    {t('knowledgeEditor.storage.defaultDescription')}
                  </p>
                </div>
              </div>
            )}
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
