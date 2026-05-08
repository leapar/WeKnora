import type { ThinkingData } from '@/types/tool-results'

interface ThinkingDisplayProps {
  data: ThinkingData
}

export function ThinkingDisplay({ data }: ThinkingDisplayProps) {
  return (
    <div className="thinking-display">
      <div className="thinking-content">
        <div className="thinking-icon" aria-hidden="true">
          💭
        </div>
        <div className="thinking-text">{data.thought}</div>
      </div>
    </div>
  )
}