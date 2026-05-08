import { useState, useRef, useEffect, useCallback } from 'react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface FAQTagTooltipProps {
  content: string
  placement?: 'top' | 'bottom' | 'left' | 'right'
  type?: 'answer' | 'similar' | 'negative'
  children: ReactNode
}

export function FAQTagTooltip({
  content,
  placement = 'top',
  type = 'answer',
  children,
}: FAQTagTooltipProps) {
  const [showTooltip, setShowTooltip] = useState(false)
  const [tooltipStyle, setTooltipStyle] = useState({ top: '0px', left: '0px' })
  const wrapperRef = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  const updatePosition = useCallback(() => {
    if (!wrapperRef.current || !tooltipRef.current) return

    const rect = wrapperRef.current.getBoundingClientRect()
    const tooltipRect = tooltipRef.current.getBoundingClientRect()
    const padding = 8

    let top = 0
    let left = 0

    switch (placement) {
      case 'top':
        top = rect.top - tooltipRect.height - 8
        left = rect.left + rect.width / 2 - tooltipRect.width / 2
        break
      case 'bottom':
        top = rect.bottom + 8
        left = rect.left + rect.width / 2 - tooltipRect.width / 2
        break
      case 'left':
        top = rect.top + rect.height / 2 - tooltipRect.height / 2
        left = rect.left - tooltipRect.width - 8
        break
      case 'right':
        top = rect.top + rect.height / 2 - tooltipRect.height / 2
        left = rect.right + 8
        break
    }

    // Boundary checks
    if (left < padding) left = padding
    if (left + tooltipRect.width > window.innerWidth - padding) {
      left = window.innerWidth - tooltipRect.width - padding
    }
    if (top < padding) {
      if (placement === 'top') {
        top = rect.bottom + 8
      } else {
        top = padding
      }
    }
    if (top + tooltipRect.height > window.innerHeight - padding) {
      top = window.innerHeight - tooltipRect.height - padding
    }

    setTooltipStyle({
      top: `${top}px`,
      left: `${left}px`,
    })
  }, [placement])

  useEffect(() => {
    if (showTooltip) {
      updatePosition()
      window.addEventListener('scroll', updatePosition, true)
      window.addEventListener('resize', updatePosition)
    }
    return () => {
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [showTooltip, updatePosition])

  const handleMouseEnter = () => {
    setShowTooltip(true)
  }

  const handleMouseLeave = () => {
    setShowTooltip(false)
  }

  const tooltipClass = cn(
    'faq-tag-tooltip',
    `tooltip-${type}`,
    `placement-${placement}`
  )

  return (
    <div
      ref={wrapperRef}
      className="faq-tag-wrapper"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {showTooltip && content && (
        <div
          ref={tooltipRef}
          className={tooltipClass}
          style={tooltipStyle}
        >
          <div className="tooltip-content">{content}</div>
        </div>
      )}
    </div>
  )
}
