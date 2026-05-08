import { useTranslation } from 'react-i18next'
import { Check } from 'lucide-react'
import type { PlanData } from '@/types/tool-results'

interface PlanDisplayProps {
  data: PlanData
}

export function PlanDisplay({ data }: PlanDisplayProps) {
  const { t } = useTranslation()

  if (!data.steps || data.steps.length === 0) {
    return <div className="no-steps">{t('chat.noPlanSteps')}</div>
  }

  return (
    <div className="plan-display">
      <div className="plan-steps">
        {data.steps.map((step, index) => {
          const isCompleted = step.status === 'completed'
          const isInProgress = step.status === 'in_progress'

          return (
            <div key={step.id || index} className={`step-item status-${step.status}`}>
              <div
                className={`step-checkbox ${isCompleted ? 'checked' : ''} ${isInProgress ? 'in-progress' : ''}`}
              >
                {isCompleted ? (
                  <Check size={14} style={{ color: 'var(--td-brand-color)' }} />
                ) : (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <rect
                      x="1.5"
                      y="1.5"
                      width="11"
                      height="11"
                      rx="2"
                      stroke={isInProgress ? 'var(--td-brand-color)' : '#d1d5db'}
                      strokeWidth={isInProgress ? 2 : 1.5}
                      fill="none"
                    />
                  </svg>
                )}
              </div>
              <span className={`step-description ${isCompleted ? 'completed' : ''}`}>
                {step.description}
                {isInProgress && <span className="sparkle">✨</span>}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}