import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Loader2, Building2, Users, Calendar } from 'lucide-react'

interface TenantInfoProps {
  tenant?: {
    id?: string
    name?: string
    description?: string
    plan?: string
    memberLimit?: number
    memberCount?: number
    createdAt?: string
  }
  onUpdate?: (data: { name: string; description: string }) => void
}

export function TenantInfo({ tenant, onUpdate }: TenantInfoProps) {
  const { t } = useTranslation()

  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: tenant?.name || '',
    description: tenant?.description || '',
  })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await onUpdate?.(formData)
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      name: tenant?.name || '',
      description: tenant?.description || '',
    })
    setEditing(false)
  }

  return (
    <div className="tenant-info">
      <div className="section-header mb-6">
        <h2 className="text-lg font-medium">{t('tenantInfo.title', 'Organization Info')}</h2>
        <p className="text-sm text-[var(--td-text-color-secondary)] mt-1">
          {t('tenantInfo.description', 'View and manage your organization details')}
        </p>
      </div>

      <div className="bg-white rounded-lg border border-[var(--td-border-level-1-color)] p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-[var(--td-brand-color)] bg-opacity-10 flex items-center justify-center">
              <Building2 size={32} className="text-[var(--td-brand-color)]" />
            </div>
            <div>
              {editing ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="px-3 py-1.5 rounded-lg border border-[var(--td-border-level-1-color)] text-lg font-medium"
                    placeholder="Organization name"
                  />
                </div>
              ) : (
                <h3 className="text-xl font-semibold">{tenant?.name || 'Organization'}</h3>
              )}
              <p className="text-sm text-[var(--td-text-color-secondary)]">
                {tenant?.plan || 'Free Plan'}
              </p>
            </div>
          </div>

          {!editing && (
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
              Edit
            </Button>
          )}
        </div>

        {/* Description */}
        <div className="mb-6">
          {editing ? (
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('tenantInfo.description', 'Description')}</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-[var(--td-border-level-1-color)] text-sm resize-none"
                placeholder="Organization description"
              />
            </div>
          ) : (
            <p className="text-sm text-[var(--td-text-color-secondary)]">
              {tenant?.description || 'No description'}
            </p>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-gray-50 rounded-lg text-center">
            <Users size={20} className="mx-auto mb-2 text-[var(--td-text-color-secondary)]" />
            <p className="text-lg font-semibold">
              {tenant?.memberCount || 0} / {tenant?.memberLimit || 10}
            </p>
            <p className="text-xs text-[var(--td-text-color-secondary)]">
              {t('tenantInfo.members', 'Members')}
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg text-center">
            <Building2 size={20} className="mx-auto mb-2 text-[var(--td-text-color-secondary)]" />
            <p className="text-lg font-semibold">{tenant?.id?.slice(0, 8) || 'N/A'}</p>
            <p className="text-xs text-[var(--td-text-color-secondary)]">ID</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg text-center">
            <Calendar size={20} className="mx-auto mb-2 text-[var(--td-text-color-secondary)]" />
            <p className="text-lg font-semibold">
              {tenant?.createdAt ? new Date(tenant.createdAt).toLocaleDateString() : 'N/A'}
            </p>
            <p className="text-xs text-[var(--td-text-color-secondary)]">
              {t('tenantInfo.createdAt', 'Created')}
            </p>
          </div>
        </div>

        {/* Actions */}
        {editing && (
          <div className="flex justify-end gap-2 pt-4 border-t border-[var(--td-border-level-1-color)]">
            <Button variant="outline" onClick={handleCancel}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="animate-spin mr-2" size={14} />}
              {t('common.save', 'Save')}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
