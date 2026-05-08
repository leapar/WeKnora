import { useState, useEffect, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Maximize2, Minimize2, AlertCircle, FileX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type PreviewType = 'pdf' | 'docx' | 'image' | 'excel' | 'text' | 'markdown' | 'pptx' | 'audio' | 'unsupported'

interface DocumentPreviewProps {
  knowledgeId: string
  fileType: string
  fileName: string
  active: boolean
}

const fileTypeMap: Record<string, PreviewType> = {}
;['pdf'].forEach(t => fileTypeMap[t] = 'pdf')
;['docx'].forEach(t => fileTypeMap[t] = 'docx')
;['pptx', 'ppt'].forEach(t => fileTypeMap[t] = 'pptx')
;['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'tiff', 'svg'].forEach(t => fileTypeMap[t] = 'image')
;['xlsx', 'xls', 'csv'].forEach(t => fileTypeMap[t] = 'excel')
;['md', 'markdown'].forEach(t => fileTypeMap[t] = 'markdown')
;['txt', 'json', 'xml', 'html', 'css', 'js', 'ts', 'py', 'java', 'go',
 'cpp', 'c', 'h', 'sh', 'yaml', 'yml', 'ini', 'conf', 'log', 'sql', 'rs', 'rb', 'php',
 'swift', 'kt', 'scala', 'r', 'lua', 'pl', 'toml'].forEach(t => fileTypeMap[t] = 'text')
;['mp3', 'wav', 'm4a', 'flac', 'ogg'].forEach(t => fileTypeMap[t] = 'audio')

const mimeTypeMap: Record<string, string> = {
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  doc: 'application/msword',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  ppt: 'application/vnd.ms-powerpoint',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  xls: 'application/vnd.ms-excel',
  csv: 'text/csv',
  jpg: 'image/jpeg', jpeg: 'image/jpeg',
  png: 'image/png', gif: 'image/gif', bmp: 'image/bmp',
  webp: 'image/webp', tiff: 'image/tiff', svg: 'image/svg+xml',
  txt: 'text/plain', md: 'text/markdown', markdown: 'text/markdown',
  json: 'application/json', xml: 'application/xml',
  html: 'text/html', css: 'text/css',
  js: 'text/javascript', ts: 'text/typescript',
  py: 'text/x-python', java: 'text/x-java', go: 'text/x-go',
  mp3: 'audio/mpeg', wav: 'audio/wav', m4a: 'audio/mp4',
  flac: 'audio/flac', ogg: 'audio/ogg',
}

function getMimeType(ft: string): string {
  return mimeTypeMap[ft?.toLowerCase()] || 'application/octet-stream'
}

function ensureBlobType(blob: Blob, ft: string): Blob {
  const expected = getMimeType(ft)
  if (blob.type === expected) return blob
  return new Blob([blob], { type: expected })
}

function resolvePreviewType(ft: string): PreviewType {
  return fileTypeMap[ft?.toLowerCase()] || 'unsupported'
}

async function previewKnowledgeFile(id: string): Promise<Blob> {
  const token = localStorage.getItem('weknora_token')
  const response = await fetch(`/api/v1/knowledge/${id}/preview`, {
    headers: {
      Authorization: `Bearer ${token || ''}`,
    },
  })
  if (!response.ok) {
    throw new Error('Failed to fetch file preview')
  }
  return response.blob()
}

export function DocumentPreview({
  knowledgeId,
  fileType,
  fileName,
  active,
}: DocumentPreviewProps) {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [previewType, setPreviewType] = useState<PreviewType>('unsupported')
  const [blobUrl, setBlobUrl] = useState('')
  const [highlightedCode, setHighlightedCode] = useState('')
  const [markdownHtml, setMarkdownHtml] = useState('')
  const [excelHtml, setExcelHtml] = useState('')
  const [pptxData, setPptxData] = useState<ArrayBuffer | null>(null)
  const [imageNaturalWidth, setImageNaturalWidth] = useState(0)
  const [imageNaturalHeight, setImageNaturalHeight] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const docxContainerRef = useRef<HTMLDivElement>(null)
  const loadedForIdRef = useRef('')

  const cleanup = useCallback(() => {
    if (blobUrl) {
      URL.revokeObjectURL(blobUrl)
      setBlobUrl('')
    }
    setHighlightedCode('')
    setMarkdownHtml('')
    setExcelHtml('')
    setPptxData(null)
    setImageNaturalWidth(0)
    setImageNaturalHeight(0)
    loadedForIdRef.current = ''
    if (docxContainerRef.current) {
      docxContainerRef.current.innerHTML = ''
    }
  }, [blobUrl])

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev)
  }, [])

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget
    setImageNaturalWidth(img.naturalWidth)
    setImageNaturalHeight(img.naturalHeight)
  }

  useEffect(() => {
    return () => {
      cleanup()
      document.body.style.overflow = ''
    }
  }, [cleanup])

  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
  }, [isFullscreen])

  useEffect(() => {
    if (!active || !knowledgeId) return
    if (loadedForIdRef.current === knowledgeId) return

    const loadPreview = async () => {
      cleanup()
      setLoading(true)
      setError('')
      const resolvedType = resolvePreviewType(fileType)
      setPreviewType(resolvedType)

      if (resolvedType === 'unsupported') {
        setLoading(false)
        return
      }

      try {
        const rawBlob = await previewKnowledgeFile(knowledgeId)
        const blob = ensureBlobType(rawBlob, fileType)
        loadedForIdRef.current = knowledgeId

        setLoading(false)

        switch (resolvedType) {
          case 'pdf':
          case 'image':
          case 'audio':
            setBlobUrl(URL.createObjectURL(blob))
            break
          case 'docx': {
            // docx-preview module not installed
            // const { renderAsync } = await import('docx-preview')
            // if (docxContainerRef.current) {
            //   docxContainerRef.current.innerHTML = ''
            //   await renderAsync(blob, docxContainerRef.current, undefined, {
            //     className: 'docx-preview-wrapper',
            //     inWrapper: true,
            //     ignoreWidth: false,
            //     ignoreHeight: false,
            //     ignoreFonts: false,
            //     breakPages: true,
            //     ignoreLastRenderedPageBreak: true,
            //     experimental: false,
            //     trimXmlDeclaration: true,
            //     useBase64URL: true,
            //   })
            // }
            break
          }
          case 'excel': {
            // xlsx module not installed
            // const XLSX = await import('xlsx')
            // const arrayBuffer = await blob.arrayBuffer()
            // let workbook
            // if (fileType?.toLowerCase() === 'csv') {
            //   const csvText = decodeCSVBlob(arrayBuffer)
            //   workbook = XLSX.read(csvText, { type: 'string' })
            // } else {
            //   workbook = XLSX.read(arrayBuffer, { type: 'array' })
            // }
            // let html = ''
            // workbook.SheetNames.forEach((name: string, sheetIdx: number) => {
            //   const sheet = workbook.Sheets[name]
            //   const sheetHtml = XLSX.utils.sheet_to_html(sheet, { id: `sheet-${sheetIdx}` })
            //   html += `<div class="excel-sheet">`
            //   if (workbook.SheetNames.length > 1) {
            //     html += `<div class="excel-sheet-name">${name}</div>`
            //   }
            //   html += sheetHtml
            //   html += `</div>`
            // })
            // setExcelHtml(html)
            break
          }
          case 'text': {
            const text = await blob.text()
            // Basic syntax highlighting would require hljs
            setHighlightedCode(text)
            break
          }
          case 'markdown': {
            const { marked } = await import('marked')
            const text = await blob.text()
            if (!text || typeof text !== 'string') {
              setMarkdownHtml('<p style="color: var(--td-text-color-disabled); text-align: center; padding: 20px;">Document content is empty</p>')
              return
            }
            const renderer = new marked.Renderer()
            renderer.code = function ({ text: codeText }) {
              if (!codeText || typeof codeText !== 'string') {
                codeText = ''
              }
              return `<pre><code class="hljs">${codeText}</code></pre>`
            }
            marked.use({ renderer })
            const rawHtml = marked.parse(text) as string
            setMarkdownHtml(rawHtml)
            break
          }
          case 'pptx': {
            const arrayBuffer = await blob.arrayBuffer()
            setPptxData(arrayBuffer)
            break
          }
        }
      } catch (err: any) {
        console.error('Document preview failed:', err)
        setError(err?.message || t('preview.loadFailed'))
      } finally {
        setLoading(false)
      }
    }

    loadPreview()
  }, [active, knowledgeId, fileType, cleanup, t])

  const renderUnsupported = () => (
    <div className="flex flex-col items-center justify-center py-[60px] gap-3 text-[var(--td-text-color-disabled)]">
      <FileX size={48} />
      <p className="m-0 text-sm text-[var(--td-text-color-secondary)]">{t('preview.unsupported')}</p>
      <p className="m-0 text-xs text-[var(--td-text-color-placeholder)]">{t('preview.unsupportedHint')}</p>
    </div>
  )

  const renderLoading = () => (
    <div className="flex flex-col items-center justify-center py-[60px] gap-4">
      <div className="animate-spin w-6 h-6 border-2 border-[var(--td-brand-color)] border-t-transparent rounded-full" />
      <span className="text-sm text-[var(--td-text-color-placeholder)]">{t('preview.loading')}</span>
    </div>
  )

  const renderError = () => (
    <div className="flex flex-col items-center justify-center py-[60px] gap-3">
      <AlertCircle size={48} className="text-[var(--td-error-color)]" />
      <p className="m-0 text-sm text-[var(--td-text-color-secondary)]">{error}</p>
      <Button variant="outline" size="sm" onClick={() => { loadedForIdRef.current = ''; }}>
        {t('preview.retry')}
      </Button>
    </div>
  )

  const renderToolbar = () => (
    <div className="absolute top-2 right-6 z-10 bg-[var(--td-bg-color-container)] border border-[var(--td-component-border)] rounded-[var(--td-radius-default)] shadow-sm p-1 opacity-60 hover:opacity-100 transition-opacity">
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleFullscreen}
        title={isFullscreen ? t('preview.exitFullscreen') : t('preview.fullscreen')}
      >
        {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
      </Button>
    </div>
  )

  return (
    <div className={cn('document-preview min-h-[200px] relative', { 'is-fullscreen': isFullscreen })}>
      {/* Toolbar */}
      {!loading && !error && previewType !== 'unsupported' && (
        renderToolbar()
      )}

      {/* Loading */}
      {loading && renderLoading()}

      {/* Error */}
      {!loading && error && renderError()}

      {/* Unsupported */}
      {!loading && !error && previewType === 'unsupported' && renderUnsupported()}

      {/* PDF */}
      {!loading && !error && previewType === 'pdf' && blobUrl && (
        <div className="w-full h-[calc(100vh-200px)] min-h-[500px]">
          <iframe src={blobUrl} className="w-full h-full border-0 rounded" />
        </div>
      )}

      {/* Image */}
      {!loading && !error && previewType === 'image' && blobUrl && (
        <div className="flex justify-center py-5">
          <div className="flex flex-col items-center gap-2">
            <img
              src={blobUrl}
              alt={fileName}
              onLoad={onImageLoad}
              className="max-w-full max-h-[calc(100vh-280px)] rounded border-0 shadow-sm object-contain"
              style={{ boxShadow: '0 2px 12px rgba(7, 192, 95, 0.08)' }}
            />
            {imageNaturalWidth > 0 && (
              <span className="text-xs text-[var(--td-text-color-placeholder)]">
                {imageNaturalWidth} × {imageNaturalHeight} px
              </span>
            )}
          </div>
        </div>
      )}

      {/* DOCX */}
      {!loading && !error && previewType === 'docx' && (
        <div className="docx-container border border-[var(--td-component-stroke)] rounded overflow-auto max-h-[calc(100vh-200px)] bg-white">
          <div ref={docxContainerRef} />
        </div>
      )}

      {/* PPTX */}
      {!loading && !error && previewType === 'pptx' && pptxData && (
        <div className="border border-[var(--td-component-stroke)] rounded overflow-auto max-h-[calc(100vh-200px)] min-h-[500px] bg-[var(--td-bg-color-container)]">
          {/* VueOfficePptx equivalent would need to be integrated */}
          <div className="p-4 text-center text-[var(--td-text-color-secondary)]">
            PPTX preview not available in React
          </div>
        </div>
      )}

      {/* Excel */}
      {!loading && !error && previewType === 'excel' && excelHtml && (
        <div
          className="excel-container border border-[var(--td-component-stroke)] rounded overflow-auto max-h-[calc(100vh-200px)] bg-white p-0"
          dangerouslySetInnerHTML={{ __html: excelHtml }}
        />
      )}

      {/* Markdown */}
      {!loading && !error && previewType === 'markdown' && markdownHtml && (
        <div
          className="markdown-body border border-[var(--td-component-stroke)] rounded overflow-auto max-h-[calc(100vh-200px)] bg-white p-5"
          dangerouslySetInnerHTML={{ __html: markdownHtml }}
        />
      )}

      {/* Text / Code */}
      {!loading && !error && previewType === 'text' && highlightedCode && (
        <pre className="code-preview border border-[var(--td-component-stroke)] rounded overflow-auto max-h-[calc(100vh-200px)] bg-[var(--td-bg-color-container)] p-4 m-0 text-[13px] leading-relaxed">
          <code>{highlightedCode}</code>
        </pre>
      )}

      {/* Audio */}
      {!loading && !error && previewType === 'audio' && blobUrl && (
        <div className="flex justify-center py-10">
          <div className="flex flex-col items-center gap-4 text-[var(--td-text-color-secondary)]">
            <FileX size={48} />
            <p className="m-0 text-sm text-[var(--td-text-color-primary)]">{fileName}</p>
            <audio controls src={blobUrl} className="w-full max-w-[480px]">
              {t('preview.audioNotSupported')}
            </audio>
          </div>
        </div>
      )}

      {/* Styles */}
      <style>{`
        .document-preview.is-fullscreen {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 2001;
          background: var(--td-bg-color-container);
          padding: 0;
          overflow-y: auto;
        }
        .document-preview.is-fullscreen .preview-toolbar {
          position: fixed;
          top: 12px;
          right: 32px;
          z-index: 2002;
        }
        .excel-sheet .excel-sheet-name {
          position: sticky;
          top: 0;
          background: var(--td-brand-color-light);
          padding: 8px 16px;
          font-weight: 600;
          font-size: 13px;
          color: var(--td-text-color-primary);
          border-bottom: 1px solid var(--td-component-stroke);
          z-index: 1;
        }
        .excel-sheet table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }
        .excel-sheet table th,
        .excel-sheet table td {
          border: 1px solid var(--td-component-stroke);
          padding: 6px 12px;
          text-align: left;
          white-space: nowrap;
          max-width: 300px;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .excel-sheet table th {
          background: var(--td-brand-color-light);
          font-weight: 600;
          color: var(--td-text-color-primary);
        }
        .markdown-body {
          font-size: 14px;
          line-height: 1.7;
          color: var(--td-text-color-primary);
          word-break: break-word;
        }
        .markdown-body h1,
        .markdown-body h2,
        .markdown-body h3,
        .markdown-body h4,
        .markdown-body h5,
        .markdown-body h6 {
          margin-top: 20px;
          margin-bottom: 10px;
          font-weight: 600;
          line-height: 1.4;
        }
        .markdown-body h1 { font-size: 24px; border-bottom: 1px solid var(--td-component-stroke); padding-bottom: 8px; }
        .markdown-body h2 { font-size: 20px; border-bottom: 1px solid var(--td-component-stroke); padding-bottom: 6px; }
        .markdown-body h3 { font-size: 17px; }
        .markdown-body p { margin: 8px 0; }
        .markdown-body blockquote {
          margin: 12px 0;
          padding: 8px 16px;
          border-left: 4px solid var(--td-brand-color);
          background: var(--td-bg-color-container);
          color: var(--td-text-color-secondary);
        }
        .markdown-body ul,
        .markdown-body ol { padding-left: 24px; margin: 8px 0; }
        .markdown-body li { margin: 4px 0; }
        .markdown-body pre {
          margin: 12px 0;
          padding: 14px;
          background: var(--td-bg-color-container);
          border-radius: 6px;
          overflow: auto;
          font-size: 13px;
          line-height: 1.5;
        }
        .markdown-body code {
          background: var(--td-bg-color-secondarycontainer);
          padding: 2px 6px;
          border-radius: 3px;
          font-size: 0.9em;
        }
        .markdown-body pre code { background: transparent; padding: 0; }
        .markdown-body img { max-width: 100%; border-radius: 4px; }
        .markdown-body hr { border: none; border-top: 1px solid var(--td-component-stroke); margin: 20px 0; }
        .markdown-body a { color: var(--td-brand-color); text-decoration: none; }
        .markdown-body a:hover { color: var(--td-brand-color-active); text-decoration: underline; }
        .docx-preview-wrapper {
          padding: 20px;
          max-width: 100%;
          width: 100%;
          box-sizing: border-box;
          overflow-x: auto;
        }
        .docx-preview-wrapper * {
          max-width: 100%;
          box-sizing: border-box;
        }
        .docx-preview-wrapper table {
          width: 100%;
          table-layout: auto;
          word-wrap: break-word;
        }
        .docx-preview-wrapper img {
          max-width: 100%;
          height: auto;
        }
      `}</style>
    </div>
  )
}
