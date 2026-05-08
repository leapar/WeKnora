import * as React from 'react'
import { cn } from '@/lib/utils'

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  status?: 'default' | 'warning' | 'error'
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, status, children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={cn(
          'flex h-10 w-full rounded-md border border-[var(--td-border-level-1-color)] bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--td-brand-color)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          status === 'warning' && 'border-yellow-500 focus-visible:ring-yellow-500',
          status === 'error' && 'border-red-500 focus-visible:ring-red-500',
          className
        )}
        {...props}
      >
        {children}
      </select>
    )
  }
)
Select.displayName = 'Select'

export { Select }
