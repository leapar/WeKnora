import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { X, Info, UserCheck, Edit, Eye, Check, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import { SpaceAvatar } from '@/components/SpaceAvatar'
import { useOrganizationStore } from '@/stores/organizationStore'
import {
  joinOrganization,
  previewOrganization,
  type OrganizationPreview,
} from '@/api/organization'

interface OrganizationEditorModalProps {
  visible: boolean
  mode: 'create' | 'join'
  onClose: () => void
  onSuccess?: () => void
}

interface NavItem {
  key: string
  label: string
  icon: typeof Info
}

export function OrganizationEditorModal({
  visible,
  mode,
  onClose,
  onSuccess,
}: OrganizationEditorModalProps) {
  const { t } = useTranslation()
  const orgStore = useOrganizationStore()

  const [currentSection, setCurrentSection] = useState('basic')
  const [submitting, setSubmitting] = useState(false)
  const [showJoinConfirm, setShowJoinConfirm] = useState(false)
  const [previewInfo, setPreviewInfo] = useState<OrganizationPreview | null>(null)
  const [joining, setJoining] = useState(false)

  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
  })

  const [joinForm, setJoinForm] = useState({
    invite_code: '',
  })

  // Reset form when modal opens or mode changes
  useEffect(() => {
    if (visible) {
      resetForm()
    }
  }, [visible, mode])

  const resetForm = () => {
    setCreateForm({ name: '', description: '' })
    setJoinForm({ invite_code: '' })
    setCurrentSection(mode === 'create' ? 'basic' : 'join')
    setShowJoinConfirm(false)
    setPreviewInfo(null)
  }

  const handleClose = () => {
    onClose()
    setTimeout(resetForm, 300)
  }

  const modalTitle = mode === 'create' ? t('organization.createOrg') : t('organization.joinOrg')

  const navItems: NavItem[] =
    mode === 'create'
      ? [
          { key: 'basic', label: t('organization.editor.navBasic', 'Basic Info'), icon: Info },
          { key: 'permissions', label: t('organization.editor.navPermissions', 'Permissions'), icon: UserCheck },
        ]
      : [{ key: 'join', label: t('organization.editor.navJoin', 'Join'), icon: UserPlus }]

  const handleSubmit = async () => {
    if (mode === 'create') {
      await handleCreate()
    } else {
      await handleJoin()
    }
  }

  const handleCreate = async () => {
    if (!createForm.name.trim()) {
      // Use alert as fallback since we don't have MessagePlugin
      alert(t('organization.nameRequired'))
      setCurrentSection('basic')
      return
    }

    setSubmitting(true)
    try {
      const result = await orgStore.create({
        name: createForm.name.trim(),
        description: createForm.description.trim(),
      })
      if (result) {
        alert(t('organization.createSuccess'))
        onSuccess?.()
        handleClose()
      } else {
        alert(orgStore.error || t('organization.createFailed'))
      }
    } catch (error: any) {
      alert(error?.message || t('organization.createFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleJoin = async () => {
    if (!joinForm.invite_code.trim()) {
      alert(t('organization.inviteCodeRequired'))
      return
    }

    setSubmitting(true)
    try {
      const response = await previewOrganization(joinForm.invite_code.trim())
      if (response.success && response.data) {
        setPreviewInfo(response.data)
        setShowJoinConfirm(true)
      } else {
        alert(response.message || t('organization.join.invalidCode'))
      }
    } catch (error: any) {
      alert(error?.message || t('organization.join.invalidCode'))
    } finally {
      setSubmitting(false)
    }
  }

  const confirmJoin = async () => {
    if (!joinForm.invite_code.trim()) return

    setJoining(true)
    try {
      const response = await joinOrganization(joinForm.invite_code.trim())
      if (response.success) {
        alert(t('organization.joinSuccess'))
        setShowJoinConfirm(false)
        onSuccess?.()
        handleClose()
      } else {
        alert(response.message || t('organization.joinFailed'))
      }
    } catch (error: any) {
      alert(error?.message || t('organization.joinFailed'))
    } finally {
      setJoining(false)
    }
  }

  if (!visible) return null

  return (
    <Dialog open={visible} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="!max-w-[900px] !max-h-[650px] !h-[80vh] p-0 overflow-hidden flex flex-col">
        {/* Close button */}
        <DialogClose className="absolute right-4 top-4 z-10">
          <X size={20} />
        </DialogClose>

        <div className="flex flex-1 overflow-hidden">
          {/* Left Sidebar */}
          <div className="w-[200px] bg-[var(--td-bg-color-secondarycontainer)] border-r border-[var(--td-component-stroke)] flex flex-col flex-shrink-0">
            <div className="p-6 border-b border-[var(--td-component-stroke)]">
              <h2 className="text-lg font-semibold text-[var(--td-text-color-primary)]">{modalTitle}</h2>
            </div>

            <nav className="flex-1 overflow-y-auto p-2">
              {navItems.map((item) => (
                <button
                  key={item.key}
                  onClick={() => setCurrentSection(item.key)}
                  className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-colors mb-1 ${
                    currentSection === item.key
                      ? 'bg-[var(--td-brand-color-light)] text-[var(--td-brand-color)] font-medium'
                      : 'text-[var(--td-text-color-secondary)] hover:bg-[var(--td-bg-color-secondarycontainer)]'
                  }`}
                >
                  <item.icon size={18} className="flex-shrink-0" />
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Right Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-8">
              {/* Create Organization - Basic Info */}
              {mode === 'create' && currentSection === 'basic' && (
                <div>
                  <div className="mb-6">
                    <h3 className="text-base font-semibold text-[var(--td-text-color-primary)] mb-1">
                      {t('organization.editor.basicTitle')}
                    </h3>
                    <p className="text-sm text-[var(--td-text-color-placeholder)]">
                      {t('organization.editor.basicDesc')}
                    </p>
                  </div>

                  <div className="space-y-6">
                    {/* Name */}
                    <div>
                      <label className="block text-sm font-medium text-[var(--td-text-color-primary)] mb-2">
                        {t('organization.name')} <span className="text-red-500">*</span>
                      </label>
                      <div className="flex items-center gap-3">
                        <SpaceAvatar name={createForm.name || '?'} size="medium" />
                        <Input
                          value={createForm.name}
                          onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                          placeholder={t('organization.namePlaceholder')}
                          maxLength={100}
                          className="flex-1"
                        />
                      </div>
                      <p className="text-xs text-[var(--td-text-color-placeholder)] mt-2">
                        {t('organization.editor.nameTip')}
                      </p>
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-sm font-medium text-[var(--td-text-color-primary)] mb-2">
                        {t('organization.description')}
                      </label>
                      <Textarea
                        value={createForm.description}
                        onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                        placeholder={t('organization.descriptionPlaceholder')}
                        maxLength={500}
                        rows={3}
                        className="resize-none"
                      />
                      <p className="text-xs text-[var(--td-text-color-placeholder)] mt-2">
                        {t('organization.editor.descriptionTip')}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Create Organization - Permissions */}
              {mode === 'create' && currentSection === 'permissions' && (
                <div>
                  <div className="mb-6">
                    <h3 className="text-base font-semibold text-[var(--td-text-color-primary)] mb-1">
                      {t('organization.editor.permissionsTitle')}
                    </h3>
                    <p className="text-sm text-[var(--td-text-color-placeholder)]">
                      {t('organization.editor.permissionsDesc')}
                    </p>
                  </div>

                  <div className="space-y-4">
                    {/* Admin Role */}
                    <div className="bg-[var(--td-bg-color-secondarycontainer)] rounded-lg p-4 border border-[var(--td-component-stroke)]">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[var(--td-brand-color)] to-[var(--td-brand-color-active)] flex items-center justify-center text-white">
                          <UserCheck size={20} />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-[var(--td-text-color-primary)]">
                            {t('organization.role.admin')}
                          </span>
                          <span className="px-1.5 py-0.5 text-xs rounded bg-[var(--td-brand-color-light)] text-[var(--td-brand-color)]">
                            {t('organization.editor.fullAccess')}
                          </span>
                        </div>
                      </div>
                      <ul className="space-y-1.5 text-xs text-[var(--td-text-color-secondary)]">
                        <li className="flex items-center gap-2">
                          <Check size={14} className="text-[var(--td-brand-color)]" />
                          {t('organization.editor.adminPerm1')}
                        </li>
                        <li className="flex items-center gap-2">
                          <Check size={14} className="text-[var(--td-brand-color)]" />
                          {t('organization.editor.adminPerm2')}
                        </li>
                        <li className="flex items-center gap-2">
                          <Check size={14} className="text-[var(--td-brand-color)]" />
                          {t('organization.editor.adminPerm3')}
                        </li>
                        <li className="flex items-center gap-2">
                          <Check size={14} className="text-[var(--td-brand-color)]" />
                          {t('organization.editor.adminPerm4')}
                        </li>
                        <li className="flex items-center gap-2">
                          <Check size={14} className="text-[var(--td-brand-color)]" />
                          {t('organization.editor.useSharedAgentsPerm')}
                        </li>
                      </ul>
                    </div>

                    {/* Editor Role */}
                    <div className="bg-[var(--td-bg-color-secondarycontainer)] rounded-lg p-4 border border-[var(--td-component-stroke)]">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[var(--td-warning-color)] to-[var(--td-warning-color-active)] flex items-center justify-center text-white">
                          <Edit size={20} />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-[var(--td-text-color-primary)]">
                            {t('organization.role.editor')}
                          </span>
                          <span className="px-1.5 py-0.5 text-xs rounded bg-yellow-100 text-yellow-700">
                            {t('organization.editor.editAccess')}
                          </span>
                        </div>
                      </div>
                      <ul className="space-y-1.5 text-xs text-[var(--td-text-color-secondary)]">
                        <li className="flex items-center gap-2">
                          <Check size={14} className="text-[var(--td-brand-color)]" />
                          {t('organization.editor.editorPerm1')}
                        </li>
                        <li className="flex items-center gap-2">
                          <Check size={14} className="text-[var(--td-brand-color)]" />
                          {t('organization.editor.editorPerm2')}
                        </li>
                        <li className="flex items-center gap-2">
                          <Check size={14} className="text-[var(--td-brand-color)]" />
                          {t('organization.editor.useSharedAgentsPerm')}
                        </li>
                        <li className="flex items-center gap-2">
                          <X size={14} className="text-[var(--td-error-color)]" />
                          {t('organization.editor.shareKBPerm')}
                        </li>
                        <li className="flex items-center gap-2">
                          <X size={14} className="text-[var(--td-error-color)]" />
                          {t('organization.editor.editorPerm3')}
                        </li>
                      </ul>
                    </div>

                    {/* Viewer Role */}
                    <div className="bg-[var(--td-bg-color-secondarycontainer)] rounded-lg p-4 border border-[var(--td-component-stroke)]">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-lg bg-[var(--td-bg-color-component-disabled)] flex items-center justify-center text-[var(--td-text-color-secondary)]">
                          <Eye size={20} />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-[var(--td-text-color-primary)]">
                            {t('organization.role.viewer')}
                          </span>
                          <span className="px-1.5 py-0.5 text-xs rounded bg-gray-100 text-gray-600">
                            {t('organization.editor.viewAccess')}
                          </span>
                        </div>
                      </div>
                      <ul className="space-y-1.5 text-xs text-[var(--td-text-color-secondary)]">
                        <li className="flex items-center gap-2">
                          <Check size={14} className="text-[var(--td-brand-color)]" />
                          {t('organization.editor.viewerPerm1')}
                        </li>
                        <li className="flex items-center gap-2">
                          <Check size={14} className="text-[var(--td-brand-color)]" />
                          {t('organization.editor.useSharedAgentsPerm')}
                        </li>
                        <li className="flex items-center gap-2">
                          <X size={14} className="text-[var(--td-error-color)]" />
                          {t('organization.editor.shareKBPerm')}
                        </li>
                        <li className="flex items-center gap-2">
                          <X size={14} className="text-[var(--td-error-color)]" />
                          {t('organization.editor.viewerPerm2')}
                        </li>
                        <li className="flex items-center gap-2">
                          <X size={14} className="text-[var(--td-error-color)]" />
                          {t('organization.editor.viewerPerm3')}
                        </li>
                      </ul>
                    </div>

                    {/* Owner Note */}
                    <div className="flex items-start gap-2 p-3 bg-[var(--td-brand-color-light)] rounded-lg text-[var(--td-brand-color)] text-xs">
                      <Info size={16} className="flex-shrink-0 mt-0.5" />
                      <span>{t('organization.editor.ownerNote')}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Join Organization */}
              {mode === 'join' && currentSection === 'join' && (
                <div>
                  <div className="mb-6">
                    <h3 className="text-base font-semibold text-[var(--td-text-color-primary)] mb-1">
                      {t('organization.editor.joinTitle')}
                    </h3>
                    <p className="text-sm text-[var(--td-text-color-placeholder)]">
                      {t('organization.editor.joinDesc')}
                    </p>
                  </div>

                  {/* Illustration */}
                  <div className="text-center py-6 mb-6">
                    <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-[var(--td-brand-color-light)] to-green-50 rounded-full flex items-center justify-center text-[var(--td-brand-color)]">
                      <UserPlus size={48} />
                    </div>
                    <p className="text-sm text-[var(--td-text-color-placeholder)]">
                      {t('organization.editor.joinIllustration')}
                    </p>
                  </div>

                  {/* Invite Code */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-[var(--td-text-color-primary)] mb-2">
                      {t('organization.inviteCode')} <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={joinForm.invite_code}
                      onChange={(e) => setJoinForm({ ...joinForm, invite_code: e.target.value })}
                      placeholder={t('organization.inviteCodePlaceholder')}
                      maxLength={32}
                      className="text-center text-base tracking-wider font-mono"
                    />
                    <p className="text-xs text-[var(--td-text-color-placeholder)] mt-2">
                      {t('organization.editor.inviteCodeTip')}
                    </p>
                  </div>

                  {/* Steps */}
                  <div className="p-5 bg-[var(--td-bg-color-secondarycontainer)] rounded-lg">
                    <div className="text-sm font-medium text-[var(--td-text-color-primary)] mb-4">
                      {t('organization.editor.howToGetCode')}
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-[var(--td-brand-color)] text-white text-xs font-semibold flex items-center justify-center flex-shrink-0">
                          1
                        </span>
                        <span className="text-xs text-[var(--td-text-color-secondary)]">
                          {t('organization.editor.step1')}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-[var(--td-brand-color)] text-white text-xs font-semibold flex items-center justify-center flex-shrink-0">
                          2
                        </span>
                        <span className="text-xs text-[var(--td-text-color-secondary)]">
                          {t('organization.editor.step2')}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-[var(--td-brand-color)] text-white text-xs font-semibold flex items-center justify-center flex-shrink-0">
                          3
                        </span>
                        <span className="text-xs text-[var(--td-text-color-secondary)]">
                          {t('organization.editor.step3')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-8 py-4 border-t border-[var(--td-component-stroke)] flex-shrink-0">
              <Button variant="outline" onClick={handleClose}>
                {t('common.cancel')}
              </Button>
              <Button onClick={handleSubmit} loading={submitting}>
                {mode === 'create' ? t('common.create') : t('organization.join.preview')}
              </Button>
            </div>
          </div>
        </div>

        {/* Join Confirmation Dialog */}
        <Dialog open={showJoinConfirm} onOpenChange={(open) => !open && setShowJoinConfirm(false)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{t('organization.join.confirmTitle')}</DialogTitle>
            </DialogHeader>

            {previewInfo && (
              <div className="space-y-4">
                {/* Organization Preview Card */}
                <div className="bg-[var(--td-bg-color-secondarycontainer)] rounded-lg p-4 border border-[var(--td-component-stroke)]">
                  <div className="flex gap-3 mb-4">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[var(--td-brand-color)] to-[var(--td-brand-color-active)] flex items-center justify-center text-white flex-shrink-0">
                      <UserPlus size={24} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-base font-semibold text-[var(--td-text-color-primary)] mb-1">
                        {previewInfo.name}
                      </h4>
                      <p className="text-xs text-[var(--td-text-color-placeholder)] line-clamp-2">
                        {previewInfo.description || t('organization.noDescription')}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-6 pt-3 border-t border-[var(--td-component-stroke)]">
                    <div className="flex items-center gap-1.5 text-xs text-[var(--td-text-color-secondary)]">
                      <UserCheck size={16} />
                      <span>{t('organization.join.memberCount', { count: previewInfo.member_count })}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-[var(--td-text-color-secondary)]">
                      <Eye size={16} />
                      <span>{t('organization.join.shareCount', { count: previewInfo.share_count })}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-[var(--td-text-color-secondary)]">
                      <img src="/agent.svg" className="w-4 h-4" alt="" />
                      <span>
                        {t('organization.join.agentShareCount', { count: previewInfo.agent_share_count ?? 0 })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Already Member Notice */}
                {previewInfo.is_already_member && (
                  <div className="flex items-center gap-2 p-3 bg-[var(--td-brand-color-light)] rounded-lg text-[var(--td-brand-color)] text-sm">
                    <Check size={18} />
                    <span>{t('organization.join.alreadyMember')}</span>
                  </div>
                )}
              </div>
            )}

            <DialogFooter>
              {previewInfo?.is_already_member ? (
                <Button onClick={() => setShowJoinConfirm(false)}>{t('common.close')}</Button>
              ) : (
                <>
                  <Button variant="outline" onClick={() => setShowJoinConfirm(false)}>
                    {t('common.cancel')}
                  </Button>
                  <Button onClick={confirmJoin} loading={joining}>
                    {t('organization.join.confirm')}
                  </Button>
                </>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  )
}