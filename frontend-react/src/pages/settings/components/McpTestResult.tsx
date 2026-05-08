import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { CheckCircle, XCircle, ChevronDown, ChevronUp, FileText, Link } from 'lucide-react'
import type { MCPTestResult, MCPTool, MCPResource } from '@/api/mcp-service'

interface McpTestResultDialogProps {
  visible: boolean
  result: MCPTestResult | null
  serviceName: string
  onClose: () => void
}

export function McpTestResultDialog({ visible, result, serviceName, onClose }: McpTestResultDialogProps) {
  const { t } = useTranslation()
  const [expandedToolIndex, setExpandedToolIndex] = useState<number | null>(null)

  const toggleTool = (index: number) => {
    if (expandedToolIndex === index) {
      setExpandedToolIndex(null)
    } else {
      setExpandedToolIndex(index)
    }
  }

  const formatSchema = (schema: any): string => {
    if (!schema) return ''
    return JSON.stringify(schema, null, 2)
  }

  const handleClose = () => {
    setExpandedToolIndex(null)
    onClose()
  }

  if (!result) return null

  return (
    <Dialog open={visible} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {t('mcp.testResult.title', 'Test Result: {{name}}', { name: serviceName })}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status Section */}
          <div className={`flex items-center gap-2 p-3 rounded ${
            result.success
              ? 'bg-green-50 text-green-700'
              : 'bg-red-50 text-red-700'
          }`}>
            {result.success ? (
              <CheckCircle size={20} className="text-green-600" />
            ) : (
              <XCircle size={20} className="text-red-600" />
            )}
            <span className="font-medium">
              {result.success
                ? t('mcp.testResult.connectionSuccess', 'Connection Successful')
                : t('mcp.testResult.connectionFailed', 'Connection Failed')}
            </span>
          </div>

          {result.message && (
            <p className="text-sm text-[var(--td-text-color-secondary)] p-3 bg-[var(--td-bg-color-secondarycontainer)] rounded">
              {result.message}
            </p>
          )}

          {/* Success Details */}
          {result.success && (
            <div className="space-y-6">
              {/* Tools Section */}
              {result.tools && result.tools.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="text-base font-semibold">{t('mcp.testResult.toolsTitle', 'Tools')}</h3>
                    <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700">
                      {result.tools.length}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {result.tools.map((tool: MCPTool, index: number) => (
                      <div
                        key={index}
                        className={`border rounded-lg overflow-hidden transition-all ${
                          expandedToolIndex === index
                            ? 'border-[var(--td-brand-color)] shadow-md'
                            : 'border-[var(--td-component-stroke)] hover:border-[var(--td-brand-color)]'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => toggleTool(index)}
                          className="flex items-center justify-between w-full p-3 text-left bg-[var(--td-bg-color-container-hover)]"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-[var(--td-brand-color)]">
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                              </svg>
                            </span>
                            <div>
                              <div className="font-medium text-sm">{tool.name}</div>
                              {tool.description && (
                                <div className="text-xs text-[var(--td-text-color-placeholder)] line-clamp-2">
                                  {tool.description}
                                </div>
                              )}
                            </div>
                          </div>
                          {expandedToolIndex === index ? (
                            <ChevronUp size={16} className="text-[var(--td-text-color-placeholder)]" />
                          ) : (
                            <ChevronDown size={16} className="text-[var(--td-text-color-placeholder)]" />
                          )}
                        </button>

                        {expandedToolIndex === index && (
                          <div className="p-3 border-t border-[var(--td-bg-color-secondarycontainer)] space-y-3">
                            {tool.description && (
                              <div>
                                <div className="text-xs font-medium text-[var(--td-text-color-placeholder)] uppercase mb-1">
                                  {t('mcp.testResult.descriptionLabel', 'Description')}
                                </div>
                                <div className="text-sm text-[var(--td-text-color-secondary)]">
                                  {tool.description}
                                </div>
                              </div>
                            )}
                            {tool.inputSchema && (
                              <div>
                                <div className="text-xs font-medium text-[var(--td-text-color-placeholder)] uppercase mb-1">
                                  {t('mcp.testResult.schemaLabel', 'Input Schema')}
                                </div>
                                <pre className="text-xs p-3 bg-[var(--td-bg-color-secondarycontainer)] rounded overflow-x-auto font-mono">
                                  {formatSchema(tool.inputSchema)}
                                </pre>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Resources Section */}
              {result.resources && result.resources.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="text-base font-semibold">{t('mcp.testResult.resourcesTitle', 'Resources')}</h3>
                    <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700">
                      {result.resources.length}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {result.resources.map((resource: MCPResource, index: number) => (
                      <div
                        key={index}
                        className="border border-[var(--td-component-stroke)] rounded-lg p-3 hover:border-[var(--td-brand-color)] transition-all"
                      >
                        <div className="flex items-start gap-3">
                          <FileText size={18} className="text-[var(--td-brand-color)] mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm">{resource.name || resource.uri}</div>
                            {resource.description && (
                              <div className="text-xs text-[var(--td-text-color-placeholder)] mt-1">
                                {resource.description}
                              </div>
                            )}
                            <div className="flex items-center gap-4 mt-2">
                              {resource.uri && (
                                <div className="flex items-center gap-1 text-xs text-[var(--td-text-color-placeholder)]">
                                  <Link size={12} />
                                  <span className="truncate max-w-[200px]">{resource.uri}</span>
                                </div>
                              )}
                              {resource.mimeType && (
                                <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                                  {resource.mimeType}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {(!result.tools || result.tools.length === 0) && (!result.resources || result.resources.length === 0) && (
                <div className="text-center py-8 text-[var(--td-text-color-secondary)]">
                  <p>{t('mcp.testResult.emptyDescription', 'No tools or resources available')}</p>
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-end pt-4 border-t">
            <Button variant="outline" onClick={handleClose}>
              {t('common.close', 'Close')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
