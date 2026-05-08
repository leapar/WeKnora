import * as React from 'react'
import { cn } from '@/lib/utils'

type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'secondary' | 'outline' | 'light'
type BadgeTheme = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'secondary'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
  theme?: BadgeTheme
}

const themeStyles: Record<BadgeTheme, string> = {
  default: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  primary: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  success: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  warning: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  danger: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  secondary: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
}

const lightStyles: Record<BadgeTheme, string> = {
  default: 'bg-gray-50 text-gray-600 border border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700',
  primary: 'bg-blue-50 text-blue-600 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
  success: 'bg-green-50 text-green-600 border border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
  warning: 'bg-yellow-50 text-yellow-600 border border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800',
  danger: 'bg-red-50 text-red-600 border border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
  secondary: 'bg-purple-50 text-purple-600 border border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800',
}

export function Badge({ className, variant = 'default', theme = 'default', ...props }: BadgeProps) {
  const isLight = variant === 'light' || variant === 'outline'

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        isLight ? lightStyles[theme] : themeStyles[theme],
        className
      )}
      {...props}
    />
  )
}