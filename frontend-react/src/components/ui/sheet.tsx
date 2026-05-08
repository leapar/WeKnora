import * as React from 'react'
import { cn } from '@/lib/utils'

interface SheetProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

const SheetContext = React.createContext<{ open: boolean; setOpen: (open: boolean) => void } | null>(null)

function useSheet() {
  const context = React.useContext(SheetContext)
  if (!context) {
    throw new Error('Sheet components must be used within a Sheet')
  }
  return context
}

function Sheet({ open = false, onOpenChange, children }: SheetProps) {
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

  return <SheetContext.Provider value={{ open: isOpen, setOpen }}>{children}</SheetContext.Provider>
}

interface SheetContentProps extends React.HTMLAttributes<HTMLDivElement> {
  side?: 'top' | 'bottom' | 'left' | 'right'
}

const SheetContent = React.forwardRef<HTMLDivElement, SheetContentProps>(
  ({ className, side = 'right', children, ...props }, ref) => {
    const { open, setOpen } = useSheet()

    React.useEffect(() => {
      if (open) {
        document.body.style.overflow = 'hidden'
      }
      return () => {
        document.body.style.overflow = ''
      }
    }, [open])

    if (!open) return null

    const sideClasses = {
      top: 'top-0 left-0 right-0 h-auto border-b',
      bottom: 'bottom-0 left-0 right-0 h-auto border-t',
      left: 'top-0 left-0 h-full w-3/4 border-r sm:max-w-sm',
      right: 'top-0 right-0 h-full w-3/4 border-l sm:max-w-sm',
    }

    return (
      <div className="fixed inset-0 z-50">
        <div className="fixed inset-0 bg-black/50" onClick={() => setOpen(false)} />
        <div
          ref={ref}
          className={cn(
            'fixed bg-white dark:bg-gray-800 shadow-lg transition-transform duration-300',
            sideClasses[side],
            side === 'top' && 'translate-y-0',
            side === 'bottom' && 'translate-y-0',
            side === 'left' && 'translate-x-0',
            side === 'right' && 'translate-x-0',
            className
          )}
          {...props}
        >
          <button
            className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100"
            onClick={() => setOpen(false)}
          >
            <span className="sr-only">Close</span>
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <path
                d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z"
                fill="currentColor"
              />
            </svg>
          </button>
          {children}
        </div>
      </div>
    )
  }
)
SheetContent.displayName = 'SheetContent'

const SheetHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col space-y-2 p-6', className)} {...props} />
  )
)
SheetHeader.displayName = 'SheetHeader'

const SheetTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h2 ref={ref} className={cn('text-lg font-semibold', className)} {...props} />
  )
)
SheetTitle.displayName = 'SheetTitle'

export { Sheet, SheetContent, SheetHeader, SheetTitle }
