import { useMemo } from 'react'
import type { ReactNode } from 'react'

interface ContentPopupProps {
  content?: string
  chunkId?: string
  knowledgeId?: string
  isHtml?: boolean
  children?: ReactNode
}

// Simple HTML sanitizer - in production, use a library like DOMPurify
function sanitizeHTML(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/on\w+='[^']*'/gi, '')
}

export function ContentPopup({ content, chunkId, knowledgeId, isHtml, children }: ContentPopupProps) {
  const hasInfo = !!(chunkId || knowledgeId)

  const processedContent = useMemo(() => {
    if (!content) return ''
    if (isHtml) {
      return sanitizeHTML(content)
    }
    return content
  }, [content, isHtml])

  return (
    <div className="popup-content">
      <div className="popup-content-wrapper">
        {content && (
          <div className="full-content" style={{ whiteSpace: 'pre-wrap' }}>
            {isHtml ? (
              <div
                className="html-content"
                dangerouslySetInnerHTML={{ __html: processedContent }}
                style={{ whiteSpace: 'normal' }}
              />
            ) : (
              processedContent
            )}
          </div>
        )}
        {children}
      </div>
      {hasInfo && (
        <div className="info-section">
          {chunkId && (
            <div className="info-field">
              <span className="field-label">Chunk ID:</span>
              <span className="field-value">
                <code>{chunkId}</code>
              </span>
            </div>
          )}
          {knowledgeId && (
            <div className="info-field">
              <span className="field-label">Document ID:</span>
              <span className="field-value">
                <code>{knowledgeId}</code>
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}