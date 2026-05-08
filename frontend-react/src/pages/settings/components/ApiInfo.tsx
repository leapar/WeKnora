import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Copy, CheckCircle } from 'lucide-react'

interface ApiInfoProps {
  apiUrl?: string
  apiKey?: string
}

export function ApiInfo({ apiUrl = '/api/v1', apiKey }: ApiInfoProps) {
  const { t } = useTranslation()

  const [copied, setCopied] = useState(false)

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (e) {
      console.error('Failed to copy:', e)
    }
  }

  return (
    <div className="api-info">
      <div className="section-header mb-6">
        <h2 className="text-lg font-medium">{t('apiInfo.title', 'API Information')}</h2>
        <p className="text-sm text-[var(--td-text-color-secondary)] mt-1">
          {t('apiInfo.description', 'View your API credentials for integration')}
        </p>
      </div>

      <div className="space-y-6">
        {/* API URL */}
        <div className="bg-white rounded-lg border border-[var(--td-border-level-1-color)] p-4">
          <label className="text-sm font-medium mb-2 block">
            {t('apiInfo.apiUrl', 'API URL')}
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={apiUrl}
              readOnly
              className="flex-1 px-3 py-2 rounded-lg border border-[var(--td-border-level-1-color)] bg-gray-50 text-sm"
            />
            <Button variant="outline" size="sm" onClick={() => copyToClipboard(apiUrl)}>
              {copied ? <CheckCircle size={14} className="text-green-500" /> : <Copy size={14} />}
            </Button>
          </div>
        </div>

        {/* API Key */}
        {apiKey && (
          <div className="bg-white rounded-lg border border-[var(--td-border-level-1-color)] p-4">
            <label className="text-sm font-medium mb-2 block">
              {t('apiInfo.apiKey', 'API Key')}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="password"
                value={apiKey}
                readOnly
                className="flex-1 px-3 py-2 rounded-lg border border-[var(--td-border-level-1-color)] bg-gray-50 text-sm"
              />
              <Button variant="outline" size="sm" onClick={() => copyToClipboard(apiKey)}>
                {copied ? <CheckCircle size={14} className="text-green-500" /> : <Copy size={14} />}
              </Button>
            </div>
            <p className="text-xs text-[var(--td-text-color-placeholder)] mt-2">
              {t('apiInfo.apiKeyHint', 'Keep your API key secure and never share it publicly')}
            </p>
          </div>
        )}

        {/* Usage Example */}
        <div className="bg-white rounded-lg border border-[var(--td-border-level-1-color)] p-4">
          <label className="text-sm font-medium mb-2 block">
            {t('apiInfo.usageExample', 'Usage Example')}
          </label>
          <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs overflow-x-auto">
{`curl -X POST "${apiUrl}/chat/stream" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"query": "Hello", "kb_ids": []}'`}
          </pre>
        </div>

        {/* Documentation Link */}
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
          <p className="text-sm text-blue-800">
            {t('apiInfo.docsHint', 'For more API documentation and examples, visit our developer portal.')}
          </p>
        </div>
      </div>
    </div>
  )
}
