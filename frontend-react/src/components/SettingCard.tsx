import * as React from 'react'
import { MoreVertical } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DropdownOption {
  content: string
  value: string
  theme?: 'default' | 'success' | 'warning' | 'error' | 'primary'
}

interface SettingCardProps {
  title: string
  description?: string
  disabled?: boolean
  actions?: DropdownOption[]
  onAction?: (value: string) => void
  className?: string
}

interface DropdownMenuProps {
  options: DropdownOption[]
  onSelect: (value: string) => void
  children: React.ReactNode
}

function DropdownMenu({ options, onSelect, children }: DropdownMenuProps) {
  const [open, setOpen] = React.useState(false)
  const menuRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (value: string) => {
    onSelect(value)
    setOpen(false)
  }

  const themeClasses: Record<string, string> = {
    default: 'text-gray-900 dark:text-gray-100',
    success: 'text-green-600',
    warning: 'text-yellow-600',
    error: 'text-red-600',
    primary: 'text-blue-600',
  }

  return (
    <div ref={menuRef} className="relative">
      {React.Children.map(children, (child) =>
        React.isValidElement(child)
          ? React.cloneElement(child as React.ReactElement<{ onClick?: () => void }>, {
              onClick: () => setOpen(!open),
            })
          : child
      )}
      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 min-w-[120px] rounded-md border border-[var(--td-component-stroke)] bg-white dark:bg-gray-800 shadow-lg py-1">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => handleSelect(option.value)}
              className={cn(
                'w-full px-3 py-1.5 text-left text-sm hover:bg-[var(--td-bg-color-secondarycontainer)] transition-colors',
                themeClasses[option.theme || 'default']
              )}
            >
              {option.content}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function SettingCard({
  title,
  description = '',
  disabled = false,
  actions = [],
  onAction,
  className,
}: SettingCardProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-2 p-4 border rounded-lg transition-colors',
        disabled
          ? 'bg-[var(--td-bg-color-secondarycontainer)] border-[var(--td-component-stroke)]'
          : 'bg-[var(--td-bg-color-container)] border-[var(--td-component-stroke)] hover:border-[var(--td-brand-color)] hover:shadow-sm',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 min-w-0">
        <h3
          className={cn(
            'flex-1 min-w-0 text-[15px] font-semibold leading-tight truncate',
            disabled ? 'text-[var(--td-text-color-secondary)]' : 'text-[var(--td-text-color-primary)]'
          )}
          title={title}
        >
          {title}
        </h3>
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Additional controls slot */}
          <div className="flex items-center gap-1" />
          {actions.length > 0 && (
            <DropdownMenu options={actions} onSelect={onAction || (() => {})}>
              <button
                className={cn(
                  'p-1 rounded hover:bg-[var(--td-bg-color-secondarycontainer)] transition-colors',
                  disabled ? 'text-[var(--td-text-color-placeholder)]' : 'text-[var(--td-text-color-placeholder)] hover:text-[var(--td-text-color-primary)]'
                )}
              >
                <MoreVertical size={16} />
              </button>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Tags slot */}
      <div className="flex flex-wrap items-center gap-1.5 min-h-[20px]" />

      {/* Description */}
      {description && (
        <p className="text-[13px] leading-relaxed text-[var(--td-text-color-secondary)] line-clamp-2">
          {description}
        </p>
      )}

      {/* Meta slot */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--td-text-color-placeholder)]" />
    </div>
  )
}