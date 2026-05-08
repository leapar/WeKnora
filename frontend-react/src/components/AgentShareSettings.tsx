import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Loader2, Share2, Trash2, User, Bot } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { SpaceAvatar } from '@/components/SpaceAvatar'
import { useOrganizationStore } from '@/stores/organizationStore'
import { get, post, del } from '@/lib/api'
import type { Organization } from '@/api/organization'
import type { Agent } from '@/types'

interface AgentShare {
  id: string
  organization_id: string
  organization_name?: string
  permission: 'admin' | 'editor' | 'viewer'
  created_at: string
}

interface AgentShareSettingsProps {
  agentId: string
  agent?: Agent | null
}

interface ShareResponse {
  success: boolean
  message?: string
  data?: {
    shares: AgentShare[]
  }
}

async function shareAgent(
  agentId: string,
  data: { organization_id: string; permission: string }
): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await post<any>(`/agents/${agentId}/shares`, data)
    return { success: true, ...response }
  } catch (error: any) {
    return { success: false, message: error.message || 'Failed to share agent' }
  }
}

async function listAgentShares(agentId: string): Promise<ShareResponse> {
  try {
    const response = await get<any>(`/agents/${agentId}/shares`)
    return {
      success: true,
      data: response.data || { shares: [] },
    }
  } catch (error: any) {
    return { success: false, message: error.message || 'Failed to load shares' }
  }
}

async function removeAgentShare(
  agentId: string,
  shareId: string
): Promise<{ success: boolean; message?: string }> {
  try {
    await del<any>(`/agents/${agentId}/shares/${shareId}`)
    return { success: true }
  } catch (error: any) {
    return { success: false, message: error.message || 'Failed to remove share' }
  }
}

export function AgentShareSettings({ agentId, agent }: AgentShareSettingsProps) {
  const { t } = useTranslation()
  const orgStore = useOrganizationStore()

  const [loadingOrgs, setLoadingOrgs] = useState(false)
  const [loadingShares, setLoadingShares] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [selectedOrgId, setSelectedOrgId] = useState('')
  const [shares, setShares] = useState<(AgentShare & { organization_name?: string })[]>([])
  const selectRef = useRef<HTMLSelectElement>(null)

  // Available organizations: editor or admin role, exclude already shared
  const availableOrganizations = orgStore.organizations.filter((org) => {
    const alreadyShared = shares.some((s) => s.organization_id === org.id)
    return (
      !alreadyShared &&
      (org.is_owner === true || org.my_role === 'admin' || org.my_role === 'editor')
    )
  })

  useEffect(() => {
    if (agentId) {
      Promise.all([loadOrganizations(), loadShares()])
    }
  }, [agentId])

  async function loadOrganizations() {
    setLoadingOrgs(true)
    try {
      await orgStore.fetchOrganizations()
    } finally {
      setLoadingOrgs(false)
    }
  }

  async function loadShares() {
    if (!agentId) return
    setLoadingShares(true)
    try {
      const result = await listAgentShares(agentId)
      if (result.success && result.data) {
        const sharesList = result.data.shares || []
        setShares(
          sharesList.map((share: AgentShare) => ({
            ...share,
            organization_name:
              orgStore.organizations.find((o) => o.id === share.organization_id)?.name ||
              share.organization_id,
          }))
        )
      }
    } catch (e) {
      console.error('Failed to load agent shares:', e)
    } finally {
      setLoadingShares(false)
    }
  }

  async function handleShare() {
    if (!selectedOrgId) return
    setSubmitting(true)
    try {
      const result = await shareAgent(agentId, {
        organization_id: selectedOrgId,
        permission: 'viewer',
      })
      if (result.success) {
        alert(t('organization.share.shareSuccess') || 'Shared successfully')
        setSelectedOrgId('')
        await loadShares()
      } else {
        alert(result.message || t('organization.share.shareFailed') || 'Failed to share')
      }
    } catch (e: any) {
      alert(e?.message || t('organization.share.shareFailed') || 'Failed to share')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleUnshare(share: AgentShare) {
    if (!confirm(t('knowledgeEditor.share.unshareConfirm', { name: share.organization_name }))) {
      return
    }
    try {
      const result = await removeAgentShare(agentId, share.id)
      if (result.success) {
        alert(t('organization.share.unshareSuccess') || 'Unshared successfully')
        await loadShares()
      } else {
        alert(result.message || t('organization.share.unshareFailed') || 'Failed to unshare')
      }
    } catch (e: any) {
      alert(e?.message || t('organization.share.unshareFailed') || 'Failed to unshare')
    }
  }

  function getOrgForShare(organizationId: string): Organization | undefined {
    return orgStore.organizations.find((o) => o.id === organizationId)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-5">
        <h3 className="text-base font-semibold mb-2">{t('organization.share.title')}</h3>
        <p className="text-sm text-[var(--td-text-color-disabled)]">
          {t('organization.share.agentShareDesc')}
        </p>
      </div>

      {/* Share scope block - shown when agent config exists */}
      {(agent as any)?.config && (
        <div className="mb-6 p-4 bg-[var(--td-bg-color-container)] border border-green-200 rounded-lg">
          <h4 className="text-sm font-semibold text-[var(--td-text-color-primary)] mb-1.5">
            {t('agent.shareScope.title')}
          </h4>
          <p className="text-xs text-[var(--td-text-color-secondary)] leading-relaxed">
            {t('agent.shareScope.desc')}
          </p>
        </div>
      )}

      {/* Share form */}
      <div className="mb-6 pb-6 border-b border-[var(--td-component-stroke)]">
        <div>
          <label className="block text-sm font-medium mb-3">
            {t('organization.share.selectOrg')}
          </label>
          <div className="flex gap-3 items-center flex-wrap">
            <Select
              ref={selectRef}
              value={selectedOrgId}
              onChange={(e) => setSelectedOrgId(e.target.value)}
              disabled={loadingOrgs}
              className="flex-1 min-w-[240px]"
            >
              <option value="">
                {loadingOrgs ? 'Loading...' : t('organization.share.selectOrgPlaceholder')}
              </option>
              {availableOrganizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </Select>
            <Button
              variant="default"
              loading={submitting}
              disabled={!selectedOrgId}
              onClick={handleShare}
            >
              {t('knowledgeEditor.share.addShare')}
            </Button>
          </div>
        </div>
      </div>

      {/* Shares section */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-[15px] font-medium text-[var(--td-text-color-primary)]">
            {t('organization.share.sharedTo')}
          </span>
          <span className="px-2 py-0.5 bg-[var(--td-bg-color-secondarycontainer)] rounded-full text-xs text-[var(--td-text-color-disabled)]">
            {shares.length}
          </span>
        </div>

        {/* Loading state */}
        {loadingShares && (
          <div className="flex items-center justify-center gap-2 py-8 text-[var(--td-text-color-disabled)] text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>{t('common.loading')}</span>
          </div>
        )}

        {/* Empty state */}
        {!loadingShares && shares.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 py-10 px-5 bg-[var(--td-bg-color-secondarycontainer)] rounded-lg text-[var(--td-text-color-disabled)]">
            <Share2 className="w-8 h-8 opacity-50" />
            <span className="text-sm">{t('organization.share.noShares')}</span>
          </div>
        )}

        {/* Share list */}
        {!loadingShares && shares.length > 0 && (
          <div className="flex flex-col gap-2.5 max-h-[320px] overflow-y-auto">
            {shares.map((share) => {
              const org = getOrgForShare(share.organization_id)
              return (
                <div
                  key={share.id}
                  className="flex justify-between items-center gap-3 p-3.5 bg-[var(--td-bg-color-secondarycontainer)] border border-[var(--td-component-stroke)] rounded-lg hover:bg-[var(--td-bg-color-secondarycontainer)] transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <SpaceAvatar
                        name={share.organization_name || ''}
                        avatar={org?.avatar}
                        size="small"
                      />
                      <span className="text-sm font-medium text-[var(--td-text-color-primary)] truncate">
                        {share.organization_name}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-[var(--td-text-color-placeholder)]">
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-[var(--td-bg-color-secondarycontainer)] rounded">
                        <User className="w-3 h-3" />
                        {org?.member_count ?? 0}
                      </span>
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-[var(--td-bg-color-secondarycontainer)] rounded">
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                        </svg>
                        {org?.share_count ?? 0}
                      </span>
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-[var(--td-bg-color-secondarycontainer)] rounded">
                        <Bot className="w-3 h-3" />
                        {org?.agent_share_count ?? 0}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => handleUnshare(share)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}