import * as React from 'react'
import { cn } from '@/lib/utils'

interface TabsContextValue {
  value: string
  onValueChange: (value: string) => void
}

const TabsContext = React.createContext<TabsContextValue | null>(null)

function useTabs() {
  const context = React.useContext(TabsContext)
  if (!context) {
    throw new Error('Tabs components must be used within a Tabs')
  }
  return context
}

interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
}

const Tabs = React.forwardRef<HTMLDivElement, TabsProps>(
  ({ className, value: controlledValue, defaultValue = '', onValueChange: onValueChangeProp, children, ...props }, ref) => {
    const [internalValue, setInternalValue] = React.useState(defaultValue)
    const value = controlledValue ?? internalValue

    const handleValueChange = React.useCallback(
      (newValue: string) => {
        setInternalValue(newValue)
        onValueChangeProp?.(newValue)
      },
      [onValueChangeProp]
    )

    return (
      <TabsContext.Provider value={{ value, onValueChange: handleValueChange }}>
        <div ref={ref} className={className} {...props}>
          {children}
        </div>
      </TabsContext.Provider>
    )
  }
)
Tabs.displayName = 'Tabs'

interface TabsListProps extends React.HTMLAttributes<HTMLDivElement> {}

const TabsList = React.forwardRef<HTMLDivElement, TabsListProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'inline-flex h-10 items-center justify-center rounded-lg bg-gray-100 p-1 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
        className
      )}
      {...props}
    />
  )
)
TabsList.displayName = 'TabsList'

interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string
}

const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ className, value: triggerValue, ...props }, ref) => {
    const { value, onValueChange } = useTabs()
    const isActive = value === triggerValue

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-all',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
          'disabled:pointer-events-none disabled:opacity-50',
          isActive
            ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-900 dark:text-gray-100'
            : 'hover:bg-white/50 hover:text-gray-900 dark:hover:bg-gray-900/50 dark:hover:text-gray-100',
          className
        )}
        onClick={() => onValueChange(triggerValue)}
        {...props}
      />
    )
  }
)
TabsTrigger.displayName = 'TabsTrigger'

interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string
}

const TabsContent = React.forwardRef<HTMLDivElement, TabsContentProps>(
  ({ className, value: contentValue, ...props }, ref) => {
    const { value } = useTabs()

    if (value !== contentValue) return null

    return (
      <div
        ref={ref}
        className={cn('mt-2 focus-visible:outline-none', className)}
        {...props}
      />
    )
  }
)
TabsContent.displayName = 'TabsContent'

export { Tabs, TabsList, TabsTrigger, TabsContent }
