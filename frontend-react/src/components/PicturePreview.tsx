import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { X } from 'lucide-react'

interface PicturePreviewProps {
  visible: boolean
  imageUrl?: string
  onClose: () => void
}

export function PicturePreview({
  visible,
  imageUrl,
  onClose,
}: PicturePreviewProps) {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(visible)
  const [images, setImages] = useState<string[]>([])

  useEffect(() => {
    setIsOpen(visible)
    if (visible && imageUrl) {
      setImages([imageUrl])
    }
  }, [visible, imageUrl])

  const handleClose = useCallback(() => {
    setIsOpen(false)
    onClose()
  }, [onClose])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClose()
    }
  }, [handleClose])

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, handleKeyDown])

  if (!isOpen || images.length === 0) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-[90vw] max-h-[90vh] p-0 bg-black/90 border-none">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition-colors"
          aria-label={t('common.close')}
        >
          <X size={20} />
        </button>

        {/* Image viewer */}
        <div className="flex items-center justify-center w-full h-full min-h-[60vh]">
          <img
            src={images[0]}
            alt={t('preview.imagePreview') || 'Preview'}
            className="max-w-full max-h-[85vh] object-contain"
            style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}
          />
        </div>

        {/* Footer info */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/70 text-sm">
          {t('preview.imagePreview', 'Image Preview')}
        </div>
      </DialogContent>
    </Dialog>
  )
}
