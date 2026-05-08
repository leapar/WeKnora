import * as React from 'react'
import { cn } from '@/lib/utils'

interface DialogContextValue {
  open: boolean
  setOpen: (open: boolean) => void
}

const DialogContext = React.createContext<DialogContextValue | null>(null)

function useDialog() {
  const context = React.useContext(DialogContext)
  if (!context) {
    throw new Error('Dialog components must be used within a Dialog')
  }
  return context
}

interface DialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

function Dialog({ open = false, onOpenChange, children }: DialogProps) {
  const [isOpen, setIsOpen] = React.useState(open)

  React.useEffect(() => {
    setIsOpen(open)
  }, [open])

  const setOpen = React.useCallback(
    (newOpen: boolean) => {
      setIsOpen(newOpen)
      onOpenChange?.(newOpen)
    },
    [onOpenChange]
  )

  return <DialogContext.Provider value={{ open: isOpen, setOpen }}>{children}</DialogContext.Provider>
}

interface DialogTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
}

const DialogTrigger = React.forwardRef<HTMLButtonElement, DialogTriggerProps>(
  ({ className, children, asChild, ...props }, ref) => {
    const { setOpen } = useDialog()

    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement<any>, {
        onClick: () => setOpen(true),
      })
    }

    return (
      <button ref={ref} className={className} onClick={() => setOpen(true)} {...props}>
        {children}
      </button>
    )
  }
)
DialogTrigger.displayName = 'DialogTrigger'

interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
  onClose?: () => void
}

const DialogContent = React.forwardRef<HTMLDivElement, DialogContentProps>(
  ({ className, children, onClose, ...props }, ref) => {
    const { open, setOpen } = useDialog()

    React.useEffect(() => {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setOpen(false)
          onClose?.()
        }
      }
      if (open) {
        document.addEventListener('keydown', handleEscape)
        document.body.style.overflow = 'hidden'
      }
      return () => {
        document.removeEventListener('keydown', handleEscape)
        document.body.style.overflow = ''
      }
    }, [open, setOpen, onClose])

    if (!open) return null

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div
          className="fixed inset-0 bg-black/50"
          onClick={() => {
            setOpen(false)
            onClose?.()
          }}
        />
        <div
          ref={ref}
          className={cn(
            'relative z-50 w-full max-w-lg rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800',
            'animate-in fade-in-0 zoom-in-95 duration-200',
            className
          )}
          onClick={(e) => e.stopPropagation()}
          {...props}
        >
          {children}
        </div>
      </div>
    )
  }
)
DialogContent.displayName = 'DialogContent'

const DialogHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col space-y-1.5 text-center sm:text-left', className)} {...props} />
  )
)
DialogHeader.displayName = 'DialogHeader'

const DialogTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h2
      ref={ref}
      className={cn('text-lg font-semibold leading-none tracking-tight', className)}
      {...props}
    />
  )
)
DialogTitle.displayName = 'DialogTitle'

const DialogDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn('text-sm text-gray-500 dark:text-gray-400', className)} {...props} />
  )
)
DialogDescription.displayName = 'DialogDescription'

const DialogFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className)}
      {...props}
    />
  )
)
DialogFooter.displayName = 'DialogFooter'

const DialogClose = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, ...props }, ref) => {
    const { setOpen } = useDialog()
    return (
      <button
        ref={ref}
        className={cn(
          'absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100',
          className
        )}
        onClick={() => setOpen(false)}
        {...props}
      >
        <span className="sr-only">Close</span>
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z"
            fill="currentColor"
          />
        </svg>
      </button>
    )
  }
)
DialogClose.displayName = 'DialogClose'

export {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
}
