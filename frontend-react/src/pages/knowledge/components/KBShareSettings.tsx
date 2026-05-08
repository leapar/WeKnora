import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Loader2, Share, Trash2, Building2 } from 'lucide-react'
import { listMyOrganizations, listKBShares, shareKnowledgeBase, removeShare } from '@/api/organization'
import type { Organization } from '@/api/organization'

interface Share {
  id: string
  organization_id: string
  organization_name: string
  organization_avatar?: string
  permission: 'viewer' | 'editor'
  created_at: string
}

interface KBShareSettingsProps {
  kbId: string
  shares?: Share[]
  onShare?: (orgId: string, permission: 'viewer' | 'editor') => void
  onUnshare?: (shareId: string) => void
}

export function KBShareSettings({ kbId, shares = [], onShare, onUnshare }: KBShareSettingsProps) {
  const { t } = useTranslation()

  const [availableOrganizations, setAvailableOrganizations] = useState<Organization[]>([])
  const [localShares, setLocalShares] = useState<Share[]>([])
  const [selectedOrgId, setSelectedOrgId] = useState('')
  const [selectedPermission, setSelectedPermission] = useState<'viewer' | 'editor'>('viewer')
  const [loadingOrgs, setLoadingOrgs] = useState(false)
  const [loadingShares, setLoadingShares] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadOrganizations()
    loadShares()
  }, [kbId])

  const loadOrganizations = async () => {
    setLoadingOrgs(true)
    try {
      const response = await listMyOrganizations()
      if (response.success && response.data) {
        setAvailableOrganizations(response.data.organizations || [])
      }
    } catch (e) {
      console.error('Failed to load organizations:', e)
    } finally {
      setLoadingOrgs(false)
    }
  }

  const loadShares = async () => {
    setLoadingShares(true)
    try {
      const response = await listKBShares(kbId)
      if (response.success && response.data) {
        setLocalShares(response.data.shares || [])
      }
    } catch (e) {
      console.error('Failed to load shares:', e)
    } finally {
      setLoadingShares(false)
    }
  }

  const handleShare = async () => {
    if (!selectedOrgId) return
    setSubmitting(true)
    try {
      if (onShare) {
        await onShare(selectedOrgId, selectedPermission)
      } else {
        await shareKnowledgeBase(kbId, selectedOrgId, selectedPermission)
      }
      setSelectedOrgId('')
      setSelectedPermission('viewer')
      loadShares()
    } catch (e) {
      console.error('Failed to share:', e)
    } finally {
      setSubmitting(false)
    }
  }

  const handleUnshare = async (share: Share) => {
    if (!confirm(t('knowledgeEditor.share.unshareConfirm', 'Are you sure you want to unshare?'))) {
      return
    }
    try {
      if (onUnshare) {
        await onUnshare(share.id)
      } else {
        await removeShare(kbId, share.id)
      }
      loadShares()
    } catch (e) {
      console.error('Failed to unshare:', e)
    }
  }

  const displayShares = shares.length > 0 ? shares : localShares

  return (
    <div className="kb-share-settings">
      <div className="section-header mb-6">
        <h2 className="text-lg font-medium">{t('organization.share.title', 'Share Settings')}</h2>
        <p className="text-sm text-[var(--td-text-color-secondary)] mt-1">
          {t('knowledgeEditor.share.description', 'Share this knowledge base with organizations')}
        </p>
      </div>

      {/* Share Form */}
      <div className="bg-white rounded-lg border border-[var(--td-border-level-1-color)] p-4 mb-6">
        <div className="mb-4">
          <label className="text-sm font-medium mb-2 block">
            {t('organization.share.selectOrg', 'Select Organization')}
          </label>
          <div className="flex items-center gap-3">
            <select
              value={selectedOrgId}
              onChange={(e) => setSelectedOrgId(e.target.value)}
              disabled={loadingOrgs}
              className="flex-1 px-3 py-2 rounded-lg border border-[var(--td-border-level-1-color)] bg-white text-sm"
            >
              <option value="">
                {loadingOrgs ? t('common.loading') : t('organization.share.selectOrgPlaceholder', 'Select an organization...')}
              </option>
              {availableOrganizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name} {org.is_owner ? '(Owner)' : org.my_role ? `(${org.my_role})` : ''}
                </option>
              ))}
            </select>

            <select
              value={selectedPermission}
              onChange={(e) => setSelectedPermission(e.target.value as 'viewer' | 'editor')}
              className="px-3 py-2 rounded-lg border border-[var(--td-border-level-1-color)] bg-white text-sm"
            >
              <option value="viewer">{t('organization.share.permissionReadonly', 'View Only')}</option>
              <option value="editor">{t('organization.share.permissionEditable', 'Can Edit')}</option>
            </select>

            <Button
              onClick={handleShare}
              disabled={!selectedOrgId || submitting}
            >
              {submitting && <Loader2 className="animate-spin mr-2" size={16} />}
              {t('knowledgeEditor.share.addShare', 'Share')}
            </Button>
          </div>
          <p className="text-xs text-[var(--td-text-color-placeholder)] mt-2">
            {t('organization.share.permissionTip', 'Viewers can search. Editors can also upload and manage documents.')}
          </p>
        </div>
      </div>

      {/* Shared List */}
      <div className="bg-white rounded-lg border border-[var(--td-border-level-1-color)]">
        <div className="px-4 py-3 border-b border-[var(--td-border-level-1-color)] flex items-center justify-between">
          <span className="font-medium">
            {t('organization.share.sharedTo', 'Shared With')} ({displayShares.length})
          </span>
        </div>

        {loadingShares ? (
          <div className="flex items-center justify-center py-8 gap-2 text-[var(--td-text-color-secondary)]">
            <Loader2 className="animate-spin" size={16} />
            <span>{t('common.loading')}</span>
          </div>
        ) : displayShares.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-[var(--td-text-color-placeholder)]">
            <Share size={32} className="mb-2" />
            <span>{t('organization.share.noShares', 'Not shared with any organization')}</span>
          </div>
        ) : (
          <div className="divide-y divide-[var(--td-border-level-1-color)]">
            {displayShares.map((share) => (
              <div key={share.id} className="px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[var(--td-brand-color)] bg-opacity-10 flex items-center justify-center">
                    <Building2 size={16} className="text-[var(--td-brand-color)]" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{share.organization_name}</p>
                    <p className="text-xs text-[var(--td-text-color-secondary)]">
                      {share.permission === 'editor' ? t('organization.share.permissionEditable', 'Can Edit') : t('organization.share.permissionReadonly', 'View Only')}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleUnshare(share)}
                  className="text-red-500 hover:text-red-600 hover:bg-red-50"
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
