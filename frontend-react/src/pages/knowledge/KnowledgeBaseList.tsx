import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { listKnowledgeBases, createKnowledgeBase, deleteKnowledgeBase } from '@/api/knowledge-base'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Search, Trash2, FolderOpen, Loader2 } from 'lucide-react'
import type { KnowledgeBaseInfo } from '@/types'

export function KnowledgeBaseList() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { knowledgeBases, setKnowledgeBases, setCurrentKnowledgeBase } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [kbToDelete, setKbToDelete] = useState<KnowledgeBaseInfo | null>(null)
  const [newKbName, setNewKbName] = useState('')
  const [newKbDescription, setNewKbDescription] = useState('')
  const [creating, setCreating] = useState(false)

  const loadKnowledgeBases = async () => {
    setLoading(true)
    try {
      const response = await listKnowledgeBases()
      if (response.success && response.data) {
        setKnowledgeBases(response.data.knowledge_bases)
      }
    } catch (error) {
      console.error('Failed to load knowledge bases:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadKnowledgeBases()
  }, [])

  const handleCreateKB = async () => {
    if (!newKbName.trim()) return

    setCreating(true)
    try {
      const response = await createKnowledgeBase({
        name: newKbName.trim(),
        description: newKbDescription.trim(),
      })
      if (response.success) {
        setShowCreateDialog(false)
        setNewKbName('')
        setNewKbDescription('')
        loadKnowledgeBases()
      } else {
        alert(response.message || 'Failed to create knowledge base')
      }
    } catch (error) {
      console.error('Failed to create knowledge base:', error)
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteKB = async () => {
    if (!kbToDelete) return

    try {
      const response = await deleteKnowledgeBase(kbToDelete.id)
      if (response.success) {
        loadKnowledgeBases()
      } else {
        alert(response.message || 'Failed to delete knowledge base')
      }
    } catch (error) {
      console.error('Failed to delete knowledge base:', error)
    } finally {
      setShowDeleteDialog(false)
      setKbToDelete(null)
    }
  }

  const handleSelectKB = (kb: KnowledgeBaseInfo) => {
    setCurrentKnowledgeBase(kb)
    navigate(`/platform/knowledge-bases/${kb.id}`)
  }

  const filteredKBs = knowledgeBases.filter((kb) =>
    kb.name.toLowerCase().includes(searchKeyword.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-[var(--td-bg-color-page)] p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--td-text-color-primary)]">
              {t('knowledge.knowledgeBases')}
            </h1>
            <p className="text-sm text-[var(--td-text-color-secondary)] mt-1">
              {knowledgeBases.length} {t('knowledge.documents')}
            </p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus size={18} className="mr-2" />
            {t('knowledge.create')}
          </Button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--td-text-color-placeholder)]"
            />
            <input
              type="text"
              placeholder={t('common.search')}
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[var(--td-border-level-1-color)] bg-white focus:outline-none focus:border-[var(--td-brand-color)] text-sm"
            />
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-[var(--td-brand-color)]" size={32} />
          </div>
        ) : filteredKBs.length === 0 ? (
          <div className="bg-white rounded-lg border border-[var(--td-border-level-1-color)] p-12 text-center">
            <FolderOpen size={64} className="mx-auto mb-4 text-[var(--td-text-color-placeholder)]" />
            <h3 className="text-lg font-medium mb-2">{t('knowledge.noKnowledgeBases')}</h3>
            <p className="text-[var(--td-text-color-secondary)] mb-6">
              {searchKeyword ? 'No matching knowledge bases found' : 'Create your first knowledge base to get started'}
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus size={18} className="mr-2" />
              {t('knowledge.createFirst')}
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredKBs.map((kb) => (
              <div
                key={kb.id}
                className="bg-white rounded-lg border border-[var(--td-border-level-1-color)] p-5 hover:border-[var(--td-brand-color)] transition-colors cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3
                      className="font-medium text-lg truncate mb-1"
                      onClick={() => handleSelectKB(kb)}
                    >
                      {kb.name}
                    </h3>
                    <p className="text-sm text-[var(--td-text-color-secondary)] line-clamp-2 min-h-[40px]">
                      {kb.description || t('knowledge.noDescription')}
                    </p>
                  </div>
                  <div className="relative ml-2">
                    <button
                      className="p-1.5 rounded hover:bg-[var(--td-bg-color-secondarycontainer)] opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation()
                        setKbToDelete(kb)
                        setShowDeleteDialog(true)
                      }}
                    >
                      <Trash2 size={16} className="text-[var(--td-text-color-secondary)]" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs text-[var(--td-text-color-placeholder)]">
                  <span className="flex items-center gap-1">
                    <FolderOpen size={14} />
                    {kb.document_count || 0} {t('knowledge.documents')}
                  </span>
                  <span>{kb.chunk_count || 0} {t('knowledge.chunks')}</span>
                </div>

                <div className="mt-3 pt-3 border-t border-[var(--td-border-level-1-color)] flex items-center justify-between">
                  <span className="text-xs text-[var(--td-text-color-placeholder)]">
                    {new Date(kb.created_at).toLocaleDateString()}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSelectKB(kb)}
                    className="text-[var(--td-brand-color)]"
                  >
                    {t('common.confirm')}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('knowledge.createKnowledgeBase')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">{t('knowledge.name')} *</label>
              <Input
                value={newKbName}
                onChange={(e) => setNewKbName(e.target.value)}
                placeholder={t('knowledge.name')}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">{t('knowledge.description')}</label>
              <Textarea
                value={newKbDescription}
                onChange={(e) => setNewKbDescription(e.target.value)}
                placeholder={t('knowledge.description')}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleCreateKB} disabled={!newKbName.trim() || creating}>
              {creating && <Loader2 className="animate-spin mr-2" size={16} />}
              {t('knowledge.create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('common.confirm')}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-[var(--td-text-color-secondary)]">
              Are you sure you want to delete "{kbToDelete?.name}"? This action cannot be undone.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              {t('common.cancel')}
            </Button>
            <Button variant="destructive" onClick={handleDeleteKB}>
              {t('common.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
