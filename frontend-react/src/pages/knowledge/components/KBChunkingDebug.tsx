import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ChevronDown, PlayCircle, AlertCircle, Loader2 } from 'lucide-react'
import { previewChunking } from '@/api/chunker'
import { CHUNKING_SAMPLES, DEFAULT_SAMPLE_ID } from './chunkingSamples'
import type { PreviewChunkingResponse, StrategyTier } from '@/types/chunker'

interface KBChunkingDebugProps {
  config: {
    chunkSize: number
    chunkOverlap: number
    separators: string[]
    strategy?: string
    tokenLimit?: number
    languages?: string[]
  }
}

const MAX_CHARS = 64 * 1024

export function KBChunkingDebug({ config }: KBChunkingDebugProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [sample, setSample] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<PreviewChunkingResponse | null>(null)
  const [expandedChunks, setExpandedChunks] = useState<Set<number>>(new Set())

  const samples = CHUNKING_SAMPLES

  useEffect(() => {
    if (open && sample.trim() === '') {
      loadSample(DEFAULT_SAMPLE_ID)
    }
  }, [open])

  const loadSample = (id: string) => {
    const preset = samples.find((s) => s.id === id)
    if (!preset) return
    setSample(preset.text)
    setResult(null)
    setError('')
    setExpandedChunks(new Set())
  }

  const fallbackWarning = result?.selected_tier === 'legacy' && (result.rejected?.length ?? 0) > 0

  const runPreview = async () => {
    setLoading(true)
    setError('')
    setResult(null)
    setExpandedChunks(new Set())
    try {
      const resp = await previewChunking({
        text: sample,
        chunking_config: {
          chunk_size: config.chunkSize,
          chunk_overlap: config.chunkOverlap,
          separators: config.separators,
          strategy: config.strategy ?? '',
          token_limit: config.tokenLimit ?? 0,
          languages: config.languages ?? [],
        },
      })
      if (!resp) {
        throw new Error('empty response')
      }
      if (resp.success !== true) {
        throw new Error((resp as any).error || 'preview failed')
      }
      if (!resp.data) {
        throw new Error('response missing data')
      }
      setResult(resp.data)
    } catch (e: any) {
      const msg = e?.message || (typeof e === 'string' ? e : '') || 'unknown error'
      setError(msg)
      console.error('[KBChunkingDebug] previewChunking failed:', e)
    } finally {
      setLoading(false)
    }
  }

  const toggleChunk = (seq: number) => {
    const next = new Set(expandedChunks)
    if (next.has(seq)) next.delete(seq)
    else next.add(seq)
    setExpandedChunks(next)
  }

  const normalizeTier = (tier: StrategyTier): StrategyTier =>
    tier === 'recursive' ? 'legacy' : tier

  const tierDisplay = (tier: StrategyTier) => {
    return t(`knowledgeEditor.chunking.strategies.${normalizeTier(tier)}.label`, tier)
  }

  const tierTheme = (tier: StrategyTier) => {
    switch (normalizeTier(tier)) {
      case 'heading':
      case 'heuristic':
        return 'success'
      case 'recursive':
        return 'primary'
      case 'legacy':
      default:
        return 'default'
    }
  }

  return (
    <div className="kb-chunking-debug flex-shrink-0">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        className="text-[var(--td-brand-color)] hover:text-[var(--td-brand-color-hover)] hover:bg-transparent px-0"
      >
        <PlayCircle size={16} className="mr-1" />
        {t('knowledgeEditor.chunking.debug.toggle', 'Debug Preview')}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>{t('knowledgeEditor.chunking.debug.toggle', 'Chunking Debug Preview')}</DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4">
            {/* Input section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{t('knowledgeEditor.chunking.debug.sampleLabel', 'Sample Text')}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[var(--td-text-color-placeholder)]">
                    {t('knowledgeEditor.chunking.debug.presetLabel', 'Presets')}:
                  </span>
                  {samples.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => loadSample(p.id)}
                      className="text-xs text-[var(--td-text-color-secondary)] hover:text-[var(--td-brand-color)] px-2 py-0.5"
                    >
                      {t(`knowledgeEditor.chunking.debug.${p.labelKey}`, p.id)}
                    </button>
                  ))}
                </div>
              </div>
              <Textarea
                value={sample}
                onChange={(e) => setSample(e.target.value)}
                placeholder={t('knowledgeEditor.chunking.debug.samplePlaceholder', 'Enter sample text to preview chunking...')}
                rows={6}
                maxLength={MAX_CHARS}
                className="resize-none font-mono text-sm"
              />
              <div className="flex justify-end">
                <Button
                  onClick={runPreview}
                  disabled={!sample || sample.length === 0 || loading}
                  loading={loading}
                >
                  <PlayCircle size={14} className="mr-1" />
                  {t('knowledgeEditor.chunking.debug.runButton', 'Run Preview')}
                </Button>
              </div>
            </div>

            {/* Loading state */}
            {loading && (
              <div className="flex items-center gap-2 py-3 px-4 bg-[var(--td-bg-color-container-hover)] rounded">
                <Loader2 size={14} className="animate-spin text-[var(--td-brand-color)]" />
                <span className="text-sm text-[var(--td-text-color-secondary)]">
                  {t('knowledgeEditor.chunking.debug.loading', 'Running chunking preview...')}
                </span>
              </div>
            )}

            {/* Error block */}
            {error && !loading && (
              <div className="flex items-start gap-2 py-3 px-4 bg-red-50 rounded text-sm">
                <AlertCircle size={14} className="text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-red-500">{t('knowledgeEditor.chunking.debug.errorPrefix', 'Error')}:</strong>
                  <span className="text-red-600 ml-1">{error}</span>
                </div>
              </div>
            )}

            {/* Result section */}
            {result && !loading && (
              <div className="space-y-4">
                {/* Tier summary */}
                <div className="pb-3 border-b border-dashed border-[var(--td-component-stroke)]">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-[var(--td-text-color-secondary)]">
                      {t('knowledgeEditor.chunking.debug.selectedTier', 'Selected Tier')}:
                    </span>
                    <span className={`inline-flex px-2 py-0.5 rounded text-xs ${
                      tierTheme(result.selected_tier) === 'success' ? 'bg-green-100 text-green-700' :
                      tierTheme(result.selected_tier) === 'primary' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {tierDisplay(result.selected_tier)}
                    </span>
                    {fallbackWarning && (
                      <span className="text-xs text-yellow-600">
                        {t('knowledgeEditor.chunking.debug.fallbackWarning', 'Fell back from rejected strategy')}
                      </span>
                    )}
                  </div>
                  {(result.rejected || []).length > 0 && (
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className="text-sm font-medium text-[var(--td-text-color-secondary)]">
                        {t('knowledgeEditor.chunking.debug.rejected', 'Rejected')}:
                      </span>
                      <div className="flex gap-1 flex-wrap">
                        {result.rejected?.map((r) => (
                          <span key={r.tier} className="inline-flex px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600">
                            {tierDisplay(r.tier)}: {r.reason}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Profile stats */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-px bg-[var(--td-component-stroke)] border border-[var(--td-component-stroke)] rounded overflow-hidden">
                  <div className="bg-white p-3 text-center">
                    <div className="text-lg font-semibold tabular-nums">{result.profile.total_lines}</div>
                    <div className="text-xs text-[var(--td-text-color-secondary)]">{t('knowledgeEditor.chunking.debug.profile.lines', 'Lines')}</div>
                  </div>
                  <div className="bg-white p-3 text-center">
                    <div className="text-lg font-semibold tabular-nums">{result.profile.total_chars}</div>
                    <div className="text-xs text-[var(--td-text-color-secondary)]">{t('knowledgeEditor.chunking.debug.profile.chars', 'Chars')}</div>
                  </div>
                  <div className="bg-white p-3 text-center">
                    <div className="text-lg font-semibold tabular-nums">{result.profile.md_heading_total}</div>
                    <div className="text-xs text-[var(--td-text-color-secondary)]">{t('knowledgeEditor.chunking.debug.profile.headings', 'Headings')}</div>
                  </div>
                  <div className="bg-white p-3 text-center">
                    <div className="text-lg font-semibold tabular-nums">{result.profile.form_feed_count}</div>
                    <div className="text-xs text-[var(--td-text-color-secondary)]">{t('knowledgeEditor.chunking.debug.profile.pageBreaks', 'Page Breaks')}</div>
                  </div>
                  <div className="bg-white p-3 text-center">
                    <div className="text-lg font-semibold tabular-nums">
                      {result.profile.german_chapter_count + result.profile.english_chapter_count + result.profile.chinese_chapter_count}
                    </div>
                    <div className="text-xs text-[var(--td-text-color-secondary)]">{t('knowledgeEditor.chunking.debug.profile.chapterMarkers', 'Chapter Mks')}</div>
                  </div>
                  <div className="bg-white p-3 text-center">
                    <div className="text-lg font-semibold tabular-nums">{(result.profile.detected_langs || []).join(', ') || '—'}</div>
                    <div className="text-xs text-[var(--td-text-color-secondary)]">{t('knowledgeEditor.chunking.debug.profile.languages', 'Languages')}</div>
                  </div>
                </div>

                {/* Chunk stats line */}
                <div className="flex flex-wrap items-baseline gap-2 py-2.5 px-3.5 bg-[var(--td-bg-color-container-hover)] rounded text-sm text-[var(--td-text-color-secondary)]">
                  <span>
                    <strong className="text-[var(--td-text-color-primary)] mr-1">{result.stats.count}</strong>
                    {t('knowledgeEditor.chunking.debug.stats.chunks', 'chunks')}
                  </span>
                  <span className="text-[var(--td-text-color-placeholder)]">·</span>
                  <span>Ø {result.stats.avg_chars}</span>
                  <span className="text-[var(--td-text-color-placeholder)]">·</span>
                  <span>σ {result.stats.stddev_chars}</span>
                  <span className="text-[var(--td-text-color-placeholder)]">·</span>
                  <span>min {result.stats.min_chars}</span>
                  <span className="text-[var(--td-text-color-placeholder)]">·</span>
                  <span>max {result.stats.max_chars}</span>
                  {result.stats.truncated_to && (
                    <span className="text-yellow-600 text-xs ml-auto">
                      {t('knowledgeEditor.chunking.debug.stats.truncated', { total: result.stats.truncated_to })}
                    </span>
                  )}
                </div>

                {/* Chunks list */}
                <ol className="space-y-2 list-none p-0 m-0">
                  {result.chunks.map((c) => (
                    <li
                      key={c.seq}
                      className={`border rounded overflow-hidden ${expandedChunks.has(c.seq) ? 'border-[var(--td-brand-color-light-active)] shadow-[0_0_0_1px_var(--td-brand-color-light)_inset]' : 'border-[var(--td-component-stroke)]'}`}
                    >
                      <button
                        type="button"
                        onClick={() => toggleChunk(c.seq)}
                        className="flex items-center gap-3 w-full px-3 py-2.5 bg-[var(--td-bg-color-container-hover)] border-none cursor-pointer text-left text-xs text-[var(--td-text-color-secondary)] hover:bg-[var(--td-bg-color-component-hover)]"
                      >
                        <span className="font-semibold text-[var(--td-text-color-primary)]">#{c.seq}</span>
                        <span className="text-[var(--td-text-color-primary)] tabular-nums">
                          {c.size_chars} {t('knowledgeEditor.chunking.characters', 'chars')}
                          <span className="text-[var(--td-text-color-secondary)] font-normal"> · ~{c.size_tokens_approx} tok</span>
                        </span>
                        <span className="text-[var(--td-text-color-placeholder)] tabular-nums font-mono">{c.start}–{c.end}</span>
                        {c.context_header && (
                          <span
                            className="flex-1 min-w-0 max-w-[240px] px-2 py-0.5 bg-[var(--td-brand-color-light)] text-[var(--td-brand-color)] rounded-full text-xs truncate font-mono"
                            title={c.context_header}
                          >
                            {c.context_header}
                          </span>
                        )}
                        <ChevronDown
                          size={16}
                          className={`ml-auto flex-shrink-0 transition-transform ${expandedChunks.has(c.seq) ? 'rotate-180' : ''}`}
                        />
                      </button>
                      <div className={`border-t border-[var(--td-component-stroke)] ${!expandedChunks.has(c.seq) ? 'max-h-16 overflow-hidden relative' : ''}`}>
                        <pre className="p-3 text-xs leading-relaxed whitespace-pre-wrap break-word font-mono text-[var(--td-text-color-primary)]">
                          {c.content}
                        </pre>
                        {!expandedChunks.has(c.seq) && (
                          <div className="absolute bottom-0 left-0 right-0 h-7 bg-gradient-to-t from-white to-transparent pointer-events-none" />
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
