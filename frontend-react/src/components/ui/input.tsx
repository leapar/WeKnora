import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-10 w-full rounded border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition-colors',
          'focus:border-primary focus:outline-none',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-400',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = 'Input'

export { Input }
