import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Search, Upload, ArrowLeft, Trash2, FileText, Loader2, FolderOpen, Link, RefreshCw, File, Plus } from 'lucide-react'
import {
  getKnowledgeBaseById,
  listDocuments,
  uploadKnowledgeFile,
  deleteDocument,
  reparseDocument,
  createManualKnowledge,
  createKnowledgeFromURL,
} from '@/api/knowledge-base'
import type { KnowledgeBase } from '@/types'

// Extended document interface to match API response
interface KBDocument {
  id: string
  name: string
  size?: number
  type?: string
  file_type?: string
  status?: string
  parse_status?: string
  progress?: number
  created_at: string
  updated_at?: string
  chunk_count?: number
  tag_ids?: string[]
}

export function KnowledgeBase() {
  const { kbId } = useParams<{ kbId: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()

  const [kb, setKb] = useState<KnowledgeBase | null>(null)
  const [loading, setLoading] = useState(true)
  const [documents, setDocuments] = useState<KBDocument[]>([])
  const [total, setTotal] = useState(0)
  const [docLoading, setDocLoading] = useState(false)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Dialog states
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [showURLDialog, setShowURLDialog] = useState(false)
  const [showManualDialog, setShowManualDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showDocDetailSheet, setShowDocDetailSheet] = useState(false)

  // Form states
  const [urlForm, setUrlForm] = useState({ url: '' })
  const [manualForm, setManualForm] = useState({ title: '', content: '' })
  const [docToDelete, setDocToDelete] = useState<KBDocument | null>(null)
  const [selectedDoc, setSelectedDoc] = useState<KBDocument | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Pagination
  const [page, setPage] = useState(1)
  const [pageSize] = useState(35)

  const loadKB = useCallback(async () => {
    if (!kbId || kbId === 'new') return
    setLoading(true)
    try {
      const response = await getKnowledgeBaseById(kbId)
      if (response.success && response.data) {
        setKb(response.data)
      }
    } catch (error) {
      console.error('Failed to load knowledge base:', error)
    } finally {
      setLoading(false)
    }
  }, [kbId])

  const loadDocuments = useCallback(async () => {
    if (!kbId || kbId === 'new') return
    setDocLoading(true)
    try {
      const response = await listDocuments(kbId, 0, pageSize * page, searchKeyword || undefined)
      if (response.success && response.data) {
        setDocuments(response.data.documents || [])
        setTotal(response.data.total || 0)
      }
    } catch (error) {
      console.error('Failed to load documents:', error)
    } finally {
      setDocLoading(false)
    }
  }, [kbId, page, pageSize, searchKeyword])

  useEffect(() => {
    loadKB()
  }, [loadKB])

  useEffect(() => {
    if (kbId && kbId !== 'new') {
      loadDocuments()
    }
  }, [loadDocuments])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0 || !kbId) return

    setUploading(true)
    setUploadProgress(0)

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        await uploadKnowledgeFile(
          kbId,
          { file },
          (progressEvent) => {
            if (progressEvent.total) {
              const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
              setUploadProgress(progress)
            }
          }
        )
      }
      setShowUploadDialog(false)
      loadDocuments()
    } catch (error) {
      console.error('Failed to upload file:', error)
    } finally {
      setUploading(false)
      setUploadProgress(0)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleURLSubmit = async () => {
    if (!urlForm.url.trim() || !kbId) return
    setSubmitting(true)
    try {
      const response = await createKnowledgeFromURL(kbId, { url: urlForm.url.trim() })
      if (response.success) {
        setShowURLDialog(false)
        setUrlForm({ url: '' })
        loadDocuments()
      } else {
        alert(response.message || 'Failed to add URL')
      }
    } catch (error) {
      console.error('Failed to add URL:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleManualSubmit = async () => {
    if (!manualForm.title.trim() || !manualForm.content.trim() || !kbId) return
    setSubmitting(true)
    try {
      const response = await createManualKnowledge(kbId, {
        title: manualForm.title.trim(),
        content: manualForm.content.trim(),
      })
      if (response.success) {
        setShowManualDialog(false)
        setManualForm({ title: '', content: '' })
        loadDocuments()
      } else {
        alert(response.message || 'Failed to add content')
      }
    } catch (error) {
      console.error('Failed to add content:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteDoc = async () => {
    if (!docToDelete || !kbId) return
    try {
      const response = await deleteDocument(kbId, docToDelete.id)
      if (response.success) {
        setShowDeleteDialog(false)
        setDocToDelete(null)
        loadDocuments()
      } else {
        alert(response.message || 'Failed to delete document')
      }
    } catch (error) {
      console.error('Failed to delete document:', error)
    }
  }

  const handleReparse = async (doc: KBDocument) => {
    if (!kbId) return
    try {
      const response = await reparseDocument(kbId, doc.id)
      if (response.success) {
        loadDocuments()
      } else {
        alert(response.message || 'Failed to reparse document')
      }
    } catch (error) {
      console.error('Failed to reparse document:', error)
    }
  }

  const getFileIcon = (fileType: string) => {
    switch (fileType?.toLowerCase()) {
      case 'pdf':
        return <FileText size={20} className="text-red-500" />
      case 'docx':
      case 'doc':
        return <FileText size={20} className="text-blue-500" />
      case 'txt':
      case 'md':
        return <FileText size={20} className="text-gray-500" />
      default:
        return <File size={20} className="text-gray-400" />
    }
  }

  const getParseStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="px-2 py-0.5 text-xs rounded bg-green-100 text-green-700">{t('knowledge.status.completed')}</span>
      case 'processing':
        return <span className="px-2 py-0.5 text-xs rounded bg-yellow-100 text-yellow-700">{t('knowledge.status.processing')}</span>
      case 'failed':
        return <span className="px-2 py-0.5 text-xs rounded bg-red-100 text-red-700">{t('knowledge.status.failed')}</span>
      default:
        return <span className="px-2 py-0.5 text-xs rounded bg-gray-100 text-gray-600">{status}</span>
    }
  }

  const handleSearch = (value: string) => {
    setSearchKeyword(value)
    setPage(1)
  }

  if (kbId === 'new') {
    return (
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={() => navigate('/platform/knowledge-bases')}>
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-2xl font-semibold">{t('knowledge.createKnowledgeBase')}</h1>
        </div>
        <div className="bg-white rounded-lg border border-[var(--td-border-level-1-color)] p-6">
          <p className="text-[var(--td-text-color-secondary)]">{t('knowledge.createDescription')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--td-bg-color-page)]">
      {/* Header */}
      <div className="bg-white border-b border-[var(--td-border-level-1-color)]">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/platform/knowledge-bases')}>
              <ArrowLeft size={20} />
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-semibold text-[var(--td-text-color-primary)]">
                {loading ? t('common.loading') : (kb?.name || t('knowledge.knowledgeBase'))}
              </h1>
              {kb?.description && (
                <p className="text-sm text-[var(--td-text-color-secondary)] mt-1">{kb.description}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setShowURLDialog(true)}>
                <Link size={16} className="mr-2" />
                {t('knowledge.addFromURL')}
              </Button>
              <Button variant="outline" onClick={() => setShowManualDialog(true)}>
                <Plus size={16} className="mr-2" />
                {t('knowledge.addManually')}
              </Button>
              <Button onClick={() => setShowUploadDialog(true)}>
                <Upload size={16} className="mr-2" />
                {t('knowledge.upload')}
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6 text-sm">
            <span className="flex items-center gap-1 text-[var(--td-text-color-secondary)]">
              <FileText size={16} />
              {total} {t('knowledge.documents')}
            </span>
            <span className="text-[var(--td-text-color-placeholder)]">
              {kb?.chunk_count || 0} {t('knowledge.chunks')}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-6">
        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--td-text-color-placeholder)]"
            />
            <Input
              type="text"
              placeholder={t('common.search')}
              value={searchKeyword}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Document List */}
        {docLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-[var(--td-brand-color)]" size={32} />
          </div>
        ) : documents.length === 0 ? (
          <div className="bg-white rounded-lg border border-[var(--td-border-level-1-color)] p-12 text-center">
            <FolderOpen size={64} className="mx-auto mb-4 text-[var(--td-text-color-placeholder)]" />
            <h3 className="text-lg font-medium mb-2">{t('knowledge.noDocuments')}</h3>
            <p className="text-[var(--td-text-color-secondary)] mb-6">
              {searchKeyword ? 'No matching documents found' : 'Upload documents to get started'}
            </p>
            <Button onClick={() => setShowUploadDialog(true)}>
              <Upload size={18} className="mr-2" />
              {t('knowledge.upload')}
            </Button>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-[var(--td-border-level-1-color)] overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--td-border-level-1-color)] bg-[var(--td-bg-color-secondarycontainer)]">
                  <th className="text-left px-4 py-3 text-sm font-medium text-[var(--td-text-color-secondary)]">
                    {t('knowledge.documentName')}
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-[var(--td-text-color-secondary)]">
                    {t('knowledge.type')}
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-[var(--td-text-color-secondary)]">
                    {t('knowledge.status.title')}
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-[var(--td-text-color-secondary)]">
                    {t('knowledge.chunks')}
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-[var(--td-text-color-secondary)]">
                    {t('knowledge.createdAt')}
                  </th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-[var(--td-text-color-secondary)]">
                    {t('common.actions')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr
                    key={doc.id}
                    className="border-b border-[var(--td-border-level-1-color)] hover:bg-[var(--td-bg-color-secondarycontainer)] transition-colors cursor-pointer"
                    onClick={() => {
                      setSelectedDoc(doc)
                      setShowDocDetailSheet(true)
                    }}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {getFileIcon(doc.file_type || doc.type || '')}
                        <span className="font-medium text-[var(--td-text-color-primary)] truncate max-w-md">
                          {doc.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--td-text-color-secondary)]">
                      {(doc.file_type || doc.type || 'URL').toUpperCase()}
                    </td>
                    <td className="px-4 py-3">
                      {getParseStatusBadge(doc.parse_status || doc.status || '')}
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--td-text-color-secondary)]">
                      {doc.chunk_count || 0}
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--td-text-color-secondary)]">
                      {doc.created_at ? new Date(doc.created_at).toLocaleDateString() : '--'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleReparse(doc)
                          }}
                          title={t('knowledge.reparse')}
                        >
                          <RefreshCw size={16} className="text-[var(--td-text-color-secondary)]" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation()
                            setDocToDelete(doc)
                            setShowDeleteDialog(true)
                          }}
                          title={t('common.delete')}
                        >
                          <Trash2 size={16} className="text-[var(--td-error-color)]" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {total > pageSize && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--td-border-level-1-color)]">
                <span className="text-sm text-[var(--td-text-color-secondary)]">
                  {t('common.showing')} {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, total)} {t('common.of')} {total}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    {t('common.prev')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page * pageSize >= total}
                  >
                    {t('common.next')}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('knowledge.uploadDocuments')}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div
              className="border-2 border-dashed border-[var(--td-border-level-1-color)] rounded-lg p-8 text-center hover:border-[var(--td-brand-color)] transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={48} className="mx-auto mb-4 text-[var(--td-text-color-placeholder)]" />
              <p className="text-[var(--td-text-color-primary)] mb-2">
                {t('knowledge.dropFilesHere')}
              </p>
              <p className="text-sm text-[var(--td-text-color-secondary)]">
                {t('knowledge.supportedFormats')}
              </p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.docx,.doc,.pptx,.ppt,.txt,.md"
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>
            {uploading && (
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span>{t('common.uploading')}</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="h-2 bg-[var(--td-bg-color-secondarycontainer)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[var(--td-brand-color)] transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
              {t('common.cancel')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* URL Dialog */}
      <Dialog open={showURLDialog} onOpenChange={setShowURLDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('knowledge.addFromURL')}</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">{t('knowledge.url')}</label>
              <Input
                value={urlForm.url}
                onChange={(e) => setUrlForm({ url: e.target.value })}
                placeholder="https://example.com/article"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowURLDialog(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleURLSubmit} disabled={!urlForm.url.trim() || submitting}>
              {submitting && <Loader2 className="animate-spin mr-2" size={16} />}
              {t('common.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manual Dialog */}
      <Dialog open={showManualDialog} onOpenChange={setShowManualDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('knowledge.addManually')}</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">{t('knowledge.title')}</label>
              <Input
                value={manualForm.title}
                onChange={(e) => setManualForm({ ...manualForm, title: e.target.value })}
                placeholder={t('knowledge.titlePlaceholder')}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">{t('knowledge.content')}</label>
              <Textarea
                value={manualForm.content}
                onChange={(e) => setManualForm({ ...manualForm, content: e.target.value })}
                placeholder={t('knowledge.contentPlaceholder')}
                rows={6}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowManualDialog(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleManualSubmit} disabled={!manualForm.title.trim() || !manualForm.content.trim() || submitting}>
              {submitting && <Loader2 className="animate-spin mr-2" size={16} />}
              {t('common.confirm')}
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
              {t('knowledge.deleteConfirm', { name: docToDelete?.name })}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              {t('common.cancel')}
            </Button>
            <Button variant="destructive" onClick={handleDeleteDoc}>
              {t('common.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Document Detail Sheet */}
      <Sheet open={showDocDetailSheet} onOpenChange={setShowDocDetailSheet}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{selectedDoc?.name}</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            {selectedDoc && (
              <>
                <div className="text-sm">
                  <span className="text-[var(--td-text-color-secondary)]">{t('knowledge.type')}: </span>
                  <span>{(selectedDoc.file_type || selectedDoc.type || 'URL').toUpperCase()}</span>
                </div>
                <div className="text-sm">
                  <span className="text-[var(--td-text-color-secondary)]">{t('knowledge.status.title')}: </span>
                  {getParseStatusBadge(selectedDoc.parse_status || selectedDoc.status || '')}
                </div>
                <div className="text-sm">
                  <span className="text-[var(--td-text-color-secondary)]">{t('knowledge.chunks')}: </span>
                  <span>{selectedDoc.chunk_count || 0}</span>
                </div>
                <div className="text-sm">
                  <span className="text-[var(--td-text-color-secondary)]">{t('knowledge.createdAt')}: </span>
                  <span>{selectedDoc.created_at ? new Date(selectedDoc.created_at).toLocaleString() : '--'}</span>
                </div>
                {selectedDoc.size && (
                  <div className="text-sm">
                    <span className="text-[var(--td-text-color-secondary)]">{t('knowledge.size')}: </span>
                    <span>{(selectedDoc.size / 1024).toFixed(2)} KB</span>
                  </div>
                )}
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
