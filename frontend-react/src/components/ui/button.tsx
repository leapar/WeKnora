import * as React from 'react'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  loading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', loading, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(
          'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50',
          {
            'bg-primary text-white hover:bg-primary-600': variant === 'default' || variant === 'primary',
            'bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-100':
              variant === 'secondary',
            'border border-gray-200 bg-white hover:bg-gray-100 hover:text-gray-900 dark:border-gray-700 dark:bg-gray-900':
              variant === 'outline',
            'hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-gray-100':
              variant === 'ghost',
            'bg-red-500 text-white hover:bg-red-600': variant === 'destructive',
          },
          {
            'h-10 px-4 py-2': size === 'default',
            'h-8 rounded px-3 text-xs': size === 'sm',
            'h-12 rounded-lg px-8 text-base': size === 'lg',
            'h-10 w-10 p-0': size === 'icon',
          },
          className
        )}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 size={14} className="animate-spin" />}
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'

export { Button }
