import { useTranslation } from 'react-i18next'
import { FileText, Link, Globe, Database, Search, Loader2, CheckCircle, XCircle } from 'lucide-react'
import type { AgentToolCall } from '@/types'

interface ToolResultRendererProps {
  toolCall: AgentToolCall
}

export function ToolResultRenderer({ toolCall }: ToolResultRendererProps) {

  const getStatusIcon = () => {
    switch (toolCall.status) {
      case 'completed':
        return <CheckCircle size={16} className="text-green-500" />
      case 'failed':
        return <XCircle size={16} className="text-red-500" />
      case 'running':
        return <Loader2 size={16} className="text-blue-500 animate-spin" />
      default:
        return <Loader2 size={16} className="text-gray-400 animate-spin" />
    }
  }

  const getToolIcon = (toolName: string) => {
    if (toolName.includes('search') || toolName.includes('Search')) {
      return <Search size={16} className="text-blue-500" />
    }
    if (toolName.includes('wiki') || toolName.includes('Wiki')) {
      return <Globe size={16} className="text-green-500" />
    }
    if (toolName.includes('database') || toolName.includes('Database')) {
      return <Database size={16} className="text-purple-500" />
    }
    if (toolName.includes('file') || toolName.includes('document')) {
      return <FileText size={16} className="text-orange-500" />
    }
    return <Link size={16} className="text-gray-500" />
  }

  const formatInput = (input: Record<string, any>) => {
    try {
      return JSON.stringify(input, null, 2)
    } catch {
      return String(input)
    }
  }

  const formatOutput = (output: string) => {
    try {
      const parsed = JSON.parse(output)
      return JSON.stringify(parsed, null, 2)
    } catch {
      return output
    }
  }

  return (
    <div className="border border-[var(--td-border-level-1-color)] rounded-lg bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-[var(--td-bg-color-secondarycontainer)] border-b border-[var(--td-border-level-1-color)]">
        <div className="flex items-center gap-2">
          {getToolIcon(toolCall.tool_name)}
          <span className="font-medium text-sm">{toolCall.tool_name}</span>
        </div>
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span className="text-xs text-[var(--td-text-color-secondary)]">{toolCall.status}</span>
        </div>
      </div>

      {/* Input */}
      {toolCall.tool_input && Object.keys(toolCall.tool_input).length > 0 && (
        <div className="px-4 py-2 border-b border-[var(--td-border-level-1-color)]">
          <p className="text-xs text-[var(--td-text-color-secondary)] mb-1">Input:</p>
          <pre className="text-xs bg-[var(--td-bg-color-secondarycontainer)] p-2 rounded overflow-x-auto">
            {formatInput(toolCall.tool_input)}
          </pre>
        </div>
      )}

      {/* Output */}
      {toolCall.tool_output && (
        <div className="px-4 py-2">
          <p className="text-xs text-[var(--td-text-color-secondary)] mb-1">Output:</p>
          <pre className="text-xs bg-[var(--td-bg-color-secondarycontainer)] p-2 rounded overflow-x-auto max-h-48">
            {formatOutput(toolCall.tool_output)}
          </pre>
        </div>
      )}
    </div>
  )
}

interface ToolCallDisplayProps {
  toolCalls: AgentToolCall[]
  isStreaming?: boolean
}

export function ToolCallsDisplay({ toolCalls, isStreaming }: ToolCallDisplayProps) {
  const { t } = useTranslation()

  if (toolCalls.length === 0) return null

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm text-[var(--td-text-color-secondary)]">
        <Database size={16} />
        <span>{t('chat.toolCalls', { count: toolCalls.length })}</span>
      </div>
      {toolCalls.map((toolCall, index) => (
        <ToolResultRenderer key={toolCall.id || index} toolCall={toolCall} />
      ))}
      {isStreaming && (
        <div className="flex items-center gap-2 text-sm text-[var(--td-brand-color)]">
          <Loader2 size={14} className="animate-spin" />
          <span>{t('chat.processing')}</span>
        </div>
      )}
    </div>
  )
}
