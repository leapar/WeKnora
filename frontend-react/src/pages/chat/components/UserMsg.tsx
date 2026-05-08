import { User } from 'lucide-react'

interface UserMsgProps {
  content: string
  mentionedItems?: Array<{
    id: string
    name: string
    type: 'kb' | 'file'
    kb_type?: 'document' | 'faq'
  }>
  attachments?: Array<{
    id: string
    name: string
    url: string
    type: string
  }>
}

export function UserMsg({ content, mentionedItems, attachments }: UserMsgProps) {

  return (
    <div className="flex gap-3 justify-end">
      <div className="flex-1 max-w-[80%] text-right">
        <div className="inline-block px-4 py-3 rounded-lg bg-[var(--td-brand-color)] text-white text-left">
          {content && <p className="whitespace-pre-wrap">{content}</p>}
        </div>

        {/* Mentioned Items */}
        {mentionedItems && mentionedItems.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2 justify-end">
            {mentionedItems.map((item) => (
              <span
                key={item.id}
                className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${
                  item.type === 'kb'
                    ? item.kb_type === 'faq'
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-green-100 text-green-600'
                    : 'bg-orange-100 text-orange-600'
                }`}
              >
                <span className="text-xs">{item.type === 'kb' ? (item.kb_type === 'faq' ? '?' : '📁') : '📄'}</span>
                <span>{item.name}</span>
              </span>
            ))}
          </div>
        )}

        {/* Attachments */}
        {attachments && attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2 justify-end">
            {attachments.map((attachment) => (
              <a
                key={attachment.id}
                href={attachment.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-gray-100 text-gray-600 hover:bg-gray-200"
              >
                <span>📎</span>
                <span>{attachment.name}</span>
              </a>
            ))}
          </div>
        )}
      </div>
      <div className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center bg-[var(--td-bg-color-component)]">
        <User size={18} />
      </div>
    </div>
  )
}