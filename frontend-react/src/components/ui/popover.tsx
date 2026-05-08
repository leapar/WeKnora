'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface PopoverContextValue {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const PopoverContext = React.createContext<PopoverContextValue | null>(null)

function usePopover() {
  const context = React.useContext(PopoverContext)
  if (!context) {
    throw new Error('Popover components must be used within a Popover')
  }
  return context
}

interface PopoverProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children?: React.ReactNode
}

function Popover({ open = false, onOpenChange, children }: PopoverProps) {
  const [isOpen, setIsOpen] = React.useState(open)

  React.useEffect(() => {
    setIsOpen(open)
  }, [open])

  const handleOpenChange = React.useCallback(
    (newOpen: boolean) => {
      setIsOpen(newOpen)
      onOpenChange?.(newOpen)
    },
    [onOpenChange]
  )

  return <PopoverContext.Provider value={{ open: isOpen, onOpenChange: handleOpenChange }}>{children}</PopoverContext.Provider>
}

interface PopoverTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
}

const PopoverTrigger = React.forwardRef<HTMLButtonElement, PopoverTriggerProps>(
  ({ children, asChild, ...props }, ref) => {
    const { onOpenChange } = usePopover()

    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement<any>, {
        onClick: (e: React.MouseEvent) => {
          onOpenChange(true)
          if ((children as React.ReactElement<any>).props.onClick) {
            (children as React.ReactElement<any>).props.onClick(e)
          }
        },
      })
    }

    return (
      <button ref={ref} type="button" onClick={() => onOpenChange(true)} {...props}>
        {children}
      </button>
    )
  }
)
PopoverTrigger.displayName = 'PopoverTrigger'

interface PopoverContentProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: 'start' | 'center' | 'end'
  sideOffset?: number
}

const PopoverContent = React.forwardRef<HTMLDivElement, PopoverContentProps>(
  ({ className, align = 'center', sideOffset = 4, children, ...props }, ref) => {
    const { open, onOpenChange } = usePopover()

    React.useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        const target = e.target as HTMLElement
        if (!target.closest('[data-popover-content]')) {
          onOpenChange(false)
        }
      }

      if (open) {
        document.addEventListener('click', handleClickOutside)
      }
      return () => {
        document.removeEventListener('click', handleClickOutside)
      }
    }, [open, onOpenChange])

    if (!open) return null

    const alignClasses = {
      start: 'left-0',
      center: 'left-1/2 -translate-x-1/2',
      end: 'right-0',
    }

    return (
      <>
        <div className="fixed inset-0 z-50" onClick={() => onOpenChange(false)} />
        <div
          ref={ref}
          data-popover-content
          className={cn(
            'fixed z-50 mt-2 min-w-[8rem] overflow-hidden rounded-md border border-[var(--td-border-level-1-color)] bg-[var(--td-bg-color-container)] p-1 shadow-lg animate-in fade-in-0 zoom-in-95',
            alignClasses[align],
            className
          )}
          style={{ top: `calc(100% + ${sideOffset}px)` }}
          onClick={(e) => e.stopPropagation()}
          {...props}
        >
          {children}
        </div>
      </>
    )
  }
)
PopoverContent.displayName = 'PopoverContent'

export { Popover, PopoverTrigger, PopoverContent }