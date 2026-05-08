import * as React from 'react'
import { cn } from '@/lib/utils'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'flex min-h-[80px] w-full rounded border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition-colors',
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
Textarea.displayName = 'Textarea'

export { Textarea }
