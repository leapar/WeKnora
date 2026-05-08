import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Plus, Search, Building2, Users, FolderOpen, Bot, Loader2, MoreVertical } from 'lucide-react'
import { useOrganizationStore } from '@/stores/organizationStore'
import type { Organization } from '@/api/organization'

interface OrganizationEditorModalProps {
  visible: boolean
  org?: Organization | null
  onClose: () => void
  onSuccess: () => void
}

export function OrganizationEditorModal({ visible, org, onClose, onSuccess }: OrganizationEditorModalProps) {
  const { t } = useTranslation()
  const { create, update } = useOrganizationStore()
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  })

  useEffect(() => {
    if (visible) {
      if (org) {
        setFormData({
          name: org.name || '',
          description: org.description || '',
        })
      } else {
        setFormData({ name: '', description: '' })
      }
    }
  }, [visible, org])

  const handleSubmit = async () => {
    if (!formData.name.trim()) return
    setSubmitting(true)
    try {
      let success
      if (org) {
        success = await update(org.id, formData)
      } else {
        success = await create(formData)
      }
      if (success) {
        onSuccess()
      } else {
        alert('Failed to save organization')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={visible} onOpenChange={() => onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {org ? t('organization.settings.editTitle') : t('organization.create')}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <label className="text-sm font-medium mb-2 block">{t('knowledge.name')} *</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder={t('knowledge.name')}
              maxLength={50}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">{t('knowledge.description')}</label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder={t('knowledge.description')}
              maxLength={200}
              rows={3}
            />
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

export function OrganizationList() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const organizationStore = useOrganizationStore()

  const [organizations, setOrganizations] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [orgToDelete, setOrgToDelete] = useState<any | null>(null)
  const [creating, setCreating] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
  })

  const loadOrganizations = useCallback(async () => {
    setLoading(true)
    try {
      await organizationStore.fetchOrganizations()
      setOrganizations(organizationStore.organizations)
    } catch (error) {
      console.error('Failed to load organizations:', error)
    } finally {
      setLoading(false)
    }
  }, [organizationStore])

  useEffect(() => {
    loadOrganizations()
  }, [loadOrganizations])

  const filteredOrganizations = organizations.filter((org) =>
    org.name.toLowerCase().includes(searchKeyword.toLowerCase())
  )

  const handleCreateOrg = async () => {
    if (!formData.name.trim()) return

    setCreating(true)
    try {
      const success = await organizationStore.create({
        name: formData.name.trim(),
        description: formData.description.trim(),
      })
      if (success) {
        await loadOrganizations()
        setShowCreateDialog(false)
        resetForm()
      } else {
        alert(organizationStore.error || 'Failed to create organization')
      }
    } catch (error) {
      console.error('Failed to create organization:', error)
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteOrg = async () => {
    if (!orgToDelete) return
    try {
      const success = await organizationStore.remove(orgToDelete.id)
      if (success) {
        await loadOrganizations()
      } else {
        alert(organizationStore.error || 'Failed to delete organization')
      }
    } catch (error) {
      console.error('Failed to delete organization:', error)
    } finally {
      setShowDeleteDialog(false)
      setOrgToDelete(null)
    }
  }

  const handleJoinOrg = () => {
    const inviteCode = prompt(t('organization.enterInviteCode') || 'Please enter organization invite code:')
    if (!inviteCode?.trim()) return
    organizationStore.join(inviteCode.trim()).then((success) => {
      if (success) {
        loadOrganizations()
      } else {
        alert(organizationStore.error || 'Failed to join organization')
      }
    })
  }

  const resetForm = () => {
    setFormData({ name: '', description: '' })
  }

  return (
    <div className="min-h-screen bg-[var(--td-bg-color-page)] p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--td-text-color-primary)]">
              {t('organization.organizations')}
            </h1>
            <p className="text-sm text-[var(--td-text-color-secondary)] mt-1">
              {organizations.length} {t('organization.organizations')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleJoinOrg}>
              <Plus size={16} className="mr-2" />
              {t('organization.joinOrg')}
            </Button>
            <Button onClick={() => { resetForm(); setShowCreateDialog(true) }}>
              <Building2 size={16} className="mr-2" />
              {t('organization.create')}
            </Button>
          </div>
        </div>

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

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-[var(--td-brand-color)]" size={32} />
          </div>
        ) : filteredOrganizations.length === 0 ? (
          <div className="bg-white rounded-lg border border-[var(--td-border-level-1-color)] p-12 text-center">
            <Building2 size={64} className="mx-auto mb-4 text-[var(--td-text-color-placeholder)]" />
            <h3 className="text-lg font-medium mb-2">{t('organization.noOrganizations')}</h3>
            <p className="text-[var(--td-text-color-secondary)] mb-6">
              {searchKeyword ? 'No matching organizations found' : 'Create your first organization to get started'}
            </p>
            <Button onClick={() => { resetForm(); setShowCreateDialog(true) }}>
              <Plus size={18} className="mr-2" />
              {t('organization.create')}
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredOrganizations.map((org) => (
              <div
                key={org.id}
                className="bg-white rounded-lg border border-[var(--td-border-level-1-color)] p-5 hover:border-[var(--td-brand-color)] transition-colors cursor-pointer group relative"
                onClick={() => navigate(`/platform/organizations/${org.id}`)}
              >
                <div className="absolute top-3 right-12 opacity-20">
                  <svg width="56" height="40" viewBox="0 0 56 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="10" cy="12" r="4" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.5"/>
                    <circle cx="28" cy="8" r="5" stroke="currentColor" strokeWidth="1.8" fill="none" opacity="0.7"/>
                    <circle cx="46" cy="14" r="4" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.5"/>
                    <path d="M14 13 L24 10 M32 10 L42 13" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.4"/>
                    <circle cx="28" cy="28" r="6" stroke="currentColor" strokeWidth="1.2" fill="none" opacity="0.35"/>
                    <path d="M28 14 L28 22 M20 18 L26 24 M36 18 L30 24" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.3"/>
                  </svg>
                </div>

                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-[var(--td-brand-color)] bg-opacity-10 flex items-center justify-center flex-shrink-0">
                      <Building2 size={20} className="text-[var(--td-brand-color)]" />
                    </div>
                    <h3 className="font-medium text-lg truncate">{org.name}</h3>
                  </div>
                  <button
                    className="p-1.5 rounded hover:bg-[var(--td-bg-color-secondarycontainer)] opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation()
                      setOrgToDelete(org)
                      setShowDeleteDialog(true)
                    }}
                  >
                    <MoreVertical size={16} className="text-[var(--td-text-color-secondary)]" />
                  </button>
                </div>

                <p className="text-sm text-[var(--td-text-color-secondary)] line-clamp-2 min-h-[40px] mb-3">
                  {org.description || t('knowledge.noDescription')}
                </p>

                <div className="flex items-center gap-3 text-xs text-[var(--td-text-color-placeholder)]">
                  <span className="flex items-center gap-1">
                    <Users size={14} />
                    {org.member_count || 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <FolderOpen size={14} />
                    {org.share_count ?? 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <Bot size={14} />
                    {org.agent_count || 0}
                  </span>
                </div>

                <div className="mt-3 pt-3 border-t border-[var(--td-border-level-1-color)]">
                  <span className="text-xs text-[var(--td-text-color-placeholder)]">
                    {org.is_owner ? t('organization.owner') : t('organization.member')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('organization.create')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">{t('knowledge.name')} *</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={t('knowledge.name')}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">{t('knowledge.description')}</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={t('knowledge.description')}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleCreateOrg} disabled={!formData.name.trim() || creating}>
              {creating && <Loader2 className="animate-spin mr-2" size={16} />}
              {t('common.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('common.confirm')}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-[var(--td-text-color-secondary)]">
              {t('organization.deleteConfirm', { name: orgToDelete?.name })}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              {t('common.cancel')}
            </Button>
            <Button variant="destructive" onClick={handleDeleteOrg}>
              {t('common.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
