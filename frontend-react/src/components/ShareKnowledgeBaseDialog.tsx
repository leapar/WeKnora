import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader2, Info, ChevronLeft, Settings, X, User, Bot } from 'lucide-react'
import { useOrganizationStore } from '@/stores/organizationStore'
import { get, post, del } from '@/lib/api'
import type { Organization } from '@/api/organization'

interface KnowledgeBaseShare {
  id: string
  knowledge_base_id: string
  knowledge_base_name?: string
  organization_id: string
  organization_name?: string
  permission: 'admin' | 'editor' | 'viewer'
  created_at: string
}

interface ShareKnowledgeBaseDialogProps {
  visible: boolean
  knowledgeBaseId: string
  knowledgeBaseName?: string
  onClose: () => void
  onShared: () => void
}

// Simple SpaceAvatar component
function SpaceAvatar({ name, avatar, size = 'small' }: { name: string; avatar?: string; size?: 'small' | 'medium' | 'large' }) {
  const gradients = [
    { from: '#07c05f', to: '#059669' },
    { from: '#11998e', to: '#38ef7d' },
    { from: '#43e97b', to: '#38f9d7' },
    { from: '#02aab0', to: '#00cdac' },
    { from: '#36d1dc', to: '#5b86e5' },
    { from: '#4facfe', to: '#00f2fe' },
    { from: '#667eea', to: '#764ba2' },
    { from: '#4776e6', to: '#8e54e9' },
    { from: '#56ab2f', to: '#a8e063' },
    { from: '#00b09b', to: '#96c93d' },
    { from: '#5ee7df', to: '#b490ca' },
    { from: '#614385', to: '#516395' },
  ]

  const hashCode = (str: string): number => {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return Math.abs(hash)
  }

  const letter = name?.trim()?.charAt(0)?.toUpperCase() || '?'
  const gradient = gradients[hashCode(name || '') % gradients.length]
  const isEmoji = avatar?.startsWith('emoji:')

  const sizeClass = size === 'small' ? 'w-[22px] h-[22px] text-[11px]' : size === 'large' ? 'w-12 h-12 text-[20px]' : 'w-8 h-8 text-[14px]'
  const borderRadius = size === 'small' ? 'rounded-[5px]' : size === 'large' ? 'rounded-xl' : 'rounded-lg'

  if (isEmoji) {
    return (
      <div className={`${sizeClass} ${borderRadius} flex items-center justify-center bg-[#f1f5f9] shadow-sm`}>
        <span className="text-sm">{avatar?.slice(6)}</span>
      </div>
    )
  }

  return (
    <div
      className={`${sizeClass} ${borderRadius} flex items-center justify-center relative shadow-sm overflow-hidden`}
      style={{ background: `linear-gradient(135deg, ${gradient.from} 0%, ${gradient.to} 100%)` }}
    >
      <svg className="absolute right-0 bottom-0 w-[55%] h-[55%] opacity-35 text-white" viewBox="0 0 56 40" fill="none">
        <circle cx="10" cy="12" r="4" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.5"/>
        <circle cx="28" cy="8" r="5" stroke="currentColor" strokeWidth="1.8" fill="none" opacity="0.7"/>
        <circle cx="46" cy="14" r="4" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.5"/>
      </svg>
      <span className="relative z-10 text-white font-semibold" style={{ textShadow: `0 1px 2px ${gradient.to}80` }}>
        {letter}
      </span>
    </div>
  )
}

// API functions for KB sharing
async function shareKnowledgeBase(kbId: string, data: { organization_id: string; permission: string }): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await post<any>(`/knowledge-bases/${kbId}/shares`, data)
    return { success: true, ...response }
  } catch (error: any) {
    return { success: false, message: error.message || 'Failed to share knowledge base' }
  }
}

async function listKBShares(kbId: string): Promise<{ success: boolean; data?: { shares: KnowledgeBaseShare[] }; message?: string }> {
  try {
    const response = await get<any>(`/knowledge-bases/${kbId}/shares`)
    return { success: true, data: response.data || { shares: [] } }
  } catch (error: any) {
    return { success: false, message: error.message || 'Failed to load shares' }
  }
}

async function removeShare(kbId: string, shareId: string): Promise<{ success: boolean; message?: string }> {
  try {
    await del<any>(`/knowledge-bases/${kbId}/shares/${shareId}`)
    return { success: true }
  } catch (error: any) {
    return { success: false, message: error.message || 'Failed to remove share' }
  }
}

export function ShareKnowledgeBaseDialog({
  visible,
  knowledgeBaseId,
  onClose,
  onShared,
}: ShareKnowledgeBaseDialogProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const orgStore = useOrganizationStore()

  const [showShareList, setShowShareList] = useState(false)
  const [loadingOrgs, setLoadingOrgs] = useState(false)
  const [loadingShares, setLoadingShares] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [shares, setShares] = useState<(KnowledgeBaseShare & { organization_name?: string })[]>([])

  const [shareForm, setShareForm] = useState({
    organization_id: '',
    permission: 'viewer' as 'admin' | 'editor' | 'viewer',
  })

  const selectRef = useRef<HTMLSelectElement>(null)

  // Available organizations: editor or admin role, exclude already shared
  const availableOrganizations: Organization[] = orgStore.organizations.filter((org) => {
    const alreadyShared = shares.some((s) => s.organization_id === org.id)
    return !alreadyShared && (org.is_owner === true || org.my_role === 'admin' || org.my_role === 'editor')
  })

  useEffect(() => {
    if (visible) {
      setShowShareList(false)
      setShareForm({ organization_id: '', permission: 'viewer' })
      Promise.all([loadOrganizations(), loadShares()])
    }
  }, [visible])

  async function loadOrganizations() {
    setLoadingOrgs(true)
    try {
      await orgStore.fetchOrganizations()
    } finally {
      setLoadingOrgs(false)
    }
  }

  async function loadShares() {
    if (!knowledgeBaseId) return
    setLoadingShares(true)
    try {
      const result = await listKBShares(knowledgeBaseId)
      if (result.success && result.data) {
        setShares(
          result.data.shares.map((share) => ({
            ...share,
            organization_name:
              orgStore.organizations.find((o) => o.id === share.organization_id)?.name ||
              share.organization_id,
          }))
        )
      }
    } catch (e) {
      console.error('Failed to load shares:', e)
    } finally {
      setLoadingShares(false)
    }
  }

  async function handleShare() {
    if (!shareForm.organization_id) return

    setSubmitting(true)
    try {
      const result = await shareKnowledgeBase(knowledgeBaseId, {
        organization_id: shareForm.organization_id,
        permission: shareForm.permission,
      })
      if (result.success) {
        alert(t('organization.share.shareSuccess') || 'Shared successfully')
        await loadShares()
        setShareForm({ organization_id: '', permission: 'viewer' })
        onShared()
      } else {
        alert(result.message || t('organization.share.shareFailed') || 'Failed to share')
      }
    } catch (e: any) {
      alert(e?.message || t('organization.share.shareFailed') || 'Failed to share')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleUnshare(share: KnowledgeBaseShare) {
    const result = await removeShare(knowledgeBaseId, share.id)
    if (result.success) {
      alert(t('organization.share.unshareSuccess') || 'Unshared successfully')
      await loadShares()
      onShared()
    } else {
      alert(result.message || t('organization.share.unshareFailed') || 'Failed to unshare')
    }
  }

  function handleGoToOrgSettings(orgId: string) {
    navigate('/platform/organizations', { state: { orgId } })
    onClose()
  }

  return (
    <Dialog open={visible} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{t('organization.share.title')}</DialogTitle>
        </DialogHeader>

        {!showShareList ? (
          <div className="py-2">
            {/* Organization Select */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                {t('organization.share.selectOrg')}
              </label>
              <select
                ref={selectRef}
                value={shareForm.organization_id}
                onChange={(e) => setShareForm({ ...shareForm, organization_id: e.target.value })}
                disabled={loadingOrgs}
                className="w-full h-10 rounded-md border border-[var(--td-border-level-1-color)] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--td-brand-color)] disabled:opacity-50"
              >
                <option value="">
                  {loadingOrgs ? 'Loading...' : t('organization.share.selectOrgPlaceholder')}
                </option>
                {availableOrganizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>

              {/* Organization option preview */}
              {shareForm.organization_id && (
                <div className="mt-3 p-3 bg-[var(--td-bg-color-secondarycontainer)] rounded-lg">
                  {(() => {
                    const selectedOrg = orgStore.organizations.find((o) => o.id === shareForm.organization_id)
                    if (!selectedOrg) return null
                    return (
                      <div className="flex items-center gap-3">
                        <SpaceAvatar name={selectedOrg.name} avatar={selectedOrg.avatar} size="small" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm truncate">{selectedOrg.name}</span>
                            {selectedOrg.is_owner && (
                              <span className="px-1.5 py-0.5 text-xs bg-[var(--td-brand-color-light)] text-[var(--td-brand-color)] rounded">
                                {t('organization.owner')}
                              </span>
                            )}
                            {selectedOrg.my_role && !selectedOrg.is_owner && (
                              <span className={`px-1.5 py-0.5 text-xs rounded ${
                                selectedOrg.my_role === 'admin'
                                  ? 'bg-yellow-50 text-yellow-600'
                                  : 'bg-gray-100 text-gray-600'
                              }`}>
                                {t(`organization.role.${selectedOrg.my_role}`)}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-[var(--td-text-color-placeholder)]">
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {selectedOrg.member_count ?? 0}
                            </span>
                            <span className="flex items-center gap-1">
                              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                              </svg>
                              {selectedOrg.share_count ?? 0}
                            </span>
                            <span className="flex items-center gap-1">
                              <Bot className="w-3 h-3" />
                              {selectedOrg.agent_share_count ?? 0}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })()}
                </div>
              )}
            </div>

            {/* Permission */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                {t('organization.share.permission')}
              </label>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="permission"
                    value="viewer"
                    checked={shareForm.permission === 'viewer'}
                    onChange={() => setShareForm({ ...shareForm, permission: 'viewer' })}
                    className="accent-[var(--td-brand-color)]"
                  />
                  <span className="text-sm">{t('organization.share.permissionReadonly')}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="permission"
                    value="editor"
                    checked={shareForm.permission === 'editor'}
                    onChange={() => setShareForm({ ...shareForm, permission: 'editor' })}
                    className="accent-[var(--td-brand-color)]"
                  />
                  <span className="text-sm">{t('organization.share.permissionEditable')}</span>
                </label>
              </div>
            </div>

            {/* Permission tip */}
            <div className="flex items-start gap-2 p-3 bg-[var(--td-bg-color-container-hover)] rounded-md mb-6">
              <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-[var(--td-text-color-secondary)]" />
              <span className="text-xs text-[var(--td-text-color-secondary)] leading-relaxed">
                {t('organization.share.permissionTip')}
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-4 border-t border-[var(--td-component-stroke)]">
              {shares.length > 0 && (
                <Button variant="outline" onClick={() => setShowShareList(true)}>
                  {t('organization.share.sharedTo')} ({shares.length})
                </Button>
              )}
              <div className="flex-1" />
              <Button variant="outline" onClick={onClose}>
                {t('common.cancel')}
              </Button>
              <Button onClick={handleShare} disabled={!shareForm.organization_id || submitting}>
                {submitting && <Loader2 className="animate-spin mr-2" size={14} />}
                {t('common.confirm')}
              </Button>
            </div>
          </div>
        ) : (
          <div>
            {/* Back button */}
            <button
              onClick={() => setShowShareList(false)}
              className="flex items-center gap-1 text-sm text-[var(--td-text-color-secondary)] hover:text-[var(--td-brand-color)] mb-4"
            >
              <ChevronLeft className="w-4 h-4" />
              {t('common.back')}
            </button>

            {/* Share list */}
            {loadingShares ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-[var(--td-text-color-secondary)]" />
              </div>
            ) : shares.length === 0 ? (
              <div className="text-center py-8 text-[var(--td-text-color-secondary)]">
                {t('organization.share.noShares')}
              </div>
            ) : (
              <div className="flex flex-col gap-2.5 max-h-[280px] overflow-y-auto">
                {shares.map((share) => (
                  <div
                    key={share.id}
                    className="flex justify-between items-center p-3.5 bg-[var(--td-bg-color-container-hover)] border border-[var(--td-component-stroke)] rounded-lg hover:bg-[var(--td-bg-color-container-active)] transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <SpaceAvatar
                        name={share.organization_name || ''}
                        avatar={orgStore.organizations.find((o) => o.id === share.organization_id)?.avatar}
                        size="small"
                      />
                      <span className="font-medium text-sm">{share.organization_name}</span>
                      <span className={`px-1.5 py-0.5 text-xs rounded ${
                        share.permission === 'editor'
                          ? 'bg-yellow-50 text-yellow-600'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {share.permission === 'editor'
                          ? t('organization.share.permissionEditable')
                          : t('organization.share.permissionReadonly')}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleGoToOrgSettings(share.organization_id)}
                        className="p-1.5 hover:bg-[var(--td-bg-color-secondarycontainer)] rounded text-[var(--td-text-color-secondary)] hover:text-[var(--td-brand-color)]"
                        title={t('organization.settings.editTitle')}
                      >
                        <Settings className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleUnshare(share)}
                        className="p-1.5 hover:bg-red-50 rounded text-[var(--td-text-color-secondary)] hover:text-red-500"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}