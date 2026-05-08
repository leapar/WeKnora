import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { X, Building2, Users, Globe, Shield } from 'lucide-react'

interface OrganizationSettingsModalProps {
  visible: boolean
  organization?: {
    id: string
    name: string
    description?: string
    avatar?: string
    member_limit?: number
    require_approval?: boolean
    searchable?: boolean
  }
  isAdmin?: boolean
  onClose: () => void
  onSave?: (data: any) => void
}

const NAV_ITEMS = [
  { key: 'basic', label: 'Basic Info', icon: Building2 },
  { key: 'members', label: 'Members', icon: Users, badge: 0 },
  { key: 'sharedKb', label: 'Shared KBs', icon: Globe, badge: 0 },
  { key: 'sharedAgents', label: 'Shared Agents', icon: Globe, badge: 0 },
  { key: 'security', label: 'Security', icon: Shield },
]

export function OrganizationSettingsModal({
  visible,
  organization,
  isAdmin = true,
  onClose,
  onSave,
}: OrganizationSettingsModalProps) {
  const { t } = useTranslation()

  const [currentSection, setCurrentSection] = useState('basic')
  const [formData, setFormData] = useState({
    name: organization?.name || '',
    description: organization?.description || '',
    avatar: organization?.avatar || '',
    member_limit: organization?.member_limit || 10,
    require_approval: organization?.require_approval ?? false,
    searchable: organization?.searchable ?? true,
  })
  const [saving, setSaving] = useState(false)

  if (!visible) return null

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave?.(formData)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex">
        {/* Sidebar */}
        <div className="w-64 border-r border-[var(--td-border-level-1-color)] flex flex-col">
          <div className="p-4 border-b border-[var(--td-border-level-1-color)]">
            <h2 className="text-lg font-semibold">
              {organization?.name || t('organization.settings', 'Organization Settings')}
            </h2>
          </div>

          <nav className="flex-1 overflow-y-auto p-2">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.key}
                onClick={() => setCurrentSection(item.key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  currentSection === item.key
                    ? 'bg-[var(--td-brand-color)] text-white'
                    : 'text-[var(--td-text-color-primary)] hover:bg-[var(--td-bg-color-secondarycontainer)]'
                }`}
              >
                <item.icon size={18} />
                <span>{item.label}</span>
                {item.badge != null && item.badge > 0 && (
                  <span className="ml-auto px-2 py-0.5 text-xs rounded-full bg-[var(--td-brand-color-light)] text-[var(--td-brand-color)]">
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-semibold">
                  {currentSection === 'basic' && t('organization.editor.basicTitle', 'Basic Information')}
                  {currentSection === 'members' && t('organization.members', 'Members')}
                  {currentSection === 'sharedKb' && t('organization.sharedKb', 'Shared Knowledge Bases')}
                  {currentSection === 'sharedAgents' && t('organization.sharedAgents', 'Shared Agents')}
                  {currentSection === 'security' && t('organization.security', 'Security')}
                </h3>
                <p className="text-sm text-[var(--td-text-color-secondary)] mt-1">
                  {currentSection === 'basic' && t('organization.editor.basicDesc', 'Manage organization basic information')}
                  {currentSection === 'members' && t('organization.membersDesc', 'Manage organization members')}
                  {currentSection === 'security' && t('organization.securityDesc', 'Configure security settings')}
                </p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>

            {/* Basic Info Section */}
            {currentSection === 'basic' && (
              <div className="space-y-6">
                {/* Name */}
                <div className="setting-row">
                  <div className="setting-info">
                    <label className="text-sm font-medium">
                      {t('organization.name', 'Name')} <span className="text-red-500">*</span>
                    </label>
                    <p className="text-xs text-[var(--td-text-color-secondary)] mt-1">
                      {t('organization.editor.nameTip', 'Organization display name')}
                    </p>
                  </div>
                  <div className="setting-control">
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      disabled={!isAdmin}
                      className="w-full max-w-md px-3 py-2 rounded-lg border border-[var(--td-border-level-1-color)] text-sm disabled:opacity-50"
                      placeholder={t('organization.namePlaceholder', 'Enter organization name')}
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="setting-row">
                  <div className="setting-info">
                    <label className="text-sm font-medium">
                      {t('organization.description', 'Description')}
                    </label>
                    <p className="text-xs text-[var(--td-text-color-secondary)] mt-1">
                      {t('organization.editor.descriptionTip', 'Brief description of your organization')}
                    </p>
                  </div>
                  <div className="setting-control">
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      disabled={!isAdmin}
                      rows={3}
                      className="w-full max-w-md px-3 py-2 rounded-lg border border-[var(--td-border-level-1-color)] text-sm disabled:opacity-50 resize-none"
                      placeholder={t('organization.descriptionPlaceholder', 'Enter description')}
                    />
                  </div>
                </div>

                {/* Member Limit */}
                <div className="setting-row">
                  <div className="setting-info">
                    <label className="text-sm font-medium">
                      {t('organization.memberLimit', 'Member Limit')}
                    </label>
                    <p className="text-xs text-[var(--td-text-color-secondary)] mt-1">
                      {t('organization.editor.memberLimitTip', 'Maximum number of members allowed')}
                    </p>
                  </div>
                  <div className="setting-control">
                    <input
                      type="number"
                      value={formData.member_limit}
                      onChange={(e) => setFormData({ ...formData, member_limit: Number(e.target.value) })}
                      disabled={!isAdmin}
                      min={1}
                      max={1000}
                      className="w-full max-w-[120px] px-3 py-2 rounded-lg border border-[var(--td-border-level-1-color)] text-sm disabled:opacity-50"
                    />
                  </div>
                </div>

                {/* Require Approval */}
                <div className="setting-row">
                  <div className="setting-info">
                    <label className="text-sm font-medium">
                      {t('organization.requireApproval', 'Require Approval')}
                    </label>
                    <p className="text-xs text-[var(--td-text-color-secondary)] mt-1">
                      {t('organization.editor.requireApprovalTip', 'Require admin approval for new members')}
                    </p>
                  </div>
                  <div className="setting-control">
                    <button
                      type="button"
                      onClick={() => isAdmin && setFormData({ ...formData, require_approval: !formData.require_approval })}
                      disabled={!isAdmin}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        formData.require_approval ? 'bg-[var(--td-brand-color)]' : 'bg-gray-300'
                      } ${!isAdmin ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          formData.require_approval ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Searchable */}
                <div className="setting-row">
                  <div className="setting-info">
                    <label className="text-sm font-medium">
                      {t('organization.searchable', 'Searchable')}
                    </label>
                    <p className="text-xs text-[var(--td-text-color-secondary)] mt-1">
                      {t('organization.editor.searchableTip', 'Allow others to find this organization')}
                    </p>
                  </div>
                  <div className="setting-control">
                    <button
                      type="button"
                      onClick={() => isAdmin && setFormData({ ...formData, searchable: !formData.searchable })}
                      disabled={!isAdmin}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        formData.searchable ? 'bg-[var(--td-brand-color)]' : 'bg-gray-300'
                      } ${!isAdmin ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          formData.searchable ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Members Section */}
            {currentSection === 'members' && (
              <div className="text-center py-12">
                <Users size={48} className="mx-auto mb-4 text-[var(--td-text-color-placeholder)]" />
                <p className="text-[var(--td-text-color-secondary)]">
                  {t('organization.membersSection', 'Member management would be displayed here')}
                </p>
              </div>
            )}

            {/* Shared KBs Section */}
            {currentSection === 'sharedKb' && (
              <div className="text-center py-12">
                <Globe size={48} className="mx-auto mb-4 text-[var(--td-text-color-placeholder)]" />
                <p className="text-[var(--td-text-color-secondary)]">
                  {t('organization.sharedKbSection', 'Shared knowledge bases would be displayed here')}
                </p>
              </div>
            )}

            {/* Security Section */}
            {currentSection === 'security' && (
              <div className="space-y-6">
                <div className="text-center py-8">
                  <Shield size={48} className="mx-auto mb-4 text-[var(--td-text-color-placeholder)]" />
                  <p className="text-[var(--td-text-color-secondary)]">
                    {t('organization.securitySection', 'Security settings would be displayed here')}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[var(--td-border-level-1-color)]">
            <Button variant="outline" onClick={onClose}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button onClick={handleSave} disabled={saving || !isAdmin}>
              {saving ? 'Saving...' : t('common.save', 'Save')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
