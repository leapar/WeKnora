import { useTranslation } from 'react-i18next'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'

interface SettingDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  width?: string
  confirmLoading?: boolean
  confirmDisabled?: boolean
  confirmText?: string
  cancelText?: string
  hideFooter?: boolean
  onConfirm?: () => void
  onCancel?: () => void
  children?: React.ReactNode
}

export function SettingDrawer({
  open,
  onOpenChange,
  title,
  description = '',
  width = '500px',
  confirmLoading = false,
  confirmDisabled = false,
  confirmText,
  cancelText,
  hideFooter = false,
  onConfirm,
  onCancel,
  children,
}: SettingDrawerProps) {
  const { t } = useTranslation()

  const handleConfirm = () => {
    onConfirm?.()
  }

  const handleCancel = () => {
    onCancel?.()
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex flex-col"
        style={{ maxWidth: width }}
      >
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-5">
          {description && (
            <p className="text-[13px] text-[var(--td-text-color-secondary)] leading-relaxed mb-5">
              {description}
            </p>
          )}
          {children}
        </div>

        {!hideFooter && (
          <div className="flex items-center justify-between gap-3 pt-4 border-t border-[var(--td-component-stroke)]">
            <div className="flex items-center gap-2 flex-1 min-w-0" />
            <div className="flex items-center gap-3 flex-shrink-0">
              <Button variant="outline" onClick={handleCancel}>
                {cancelText || t('common.cancel')}
              </Button>
              <Button
                variant="default"
                loading={confirmLoading}
                disabled={confirmDisabled}
                onClick={handleConfirm}
              >
                {confirmText || t('common.save')}
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}