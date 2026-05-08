import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown, ChevronRight } from 'lucide-react'

interface ParserEngineRule {
  file_types: string[]
  engine: string
}

interface ChunkingConfig {
  chunkSize: number
  chunkOverlap: number
  separators: string[]
  parserEngineRules?: ParserEngineRule[]
  enableParentChild: boolean
  parentChunkSize: number
  childChunkSize: number
  strategy?: string
  tokenLimit?: number
  languages?: string[]
}

interface KBChunkingSettingsProps {
  config: ChunkingConfig
  onUpdate: (config: ChunkingConfig) => void
}

const STRATEGY_OPTIONS = [
  { label: 'Auto', value: 'auto', tooltip: 'Automatically determine the best chunking strategy based on content type' },
  { label: 'Heading', value: 'heading', tooltip: 'Split content based on headings and sections' },
  { label: 'Heuristic', value: 'heuristic', tooltip: 'Use language-specific heuristics for chunking' },
  { label: 'Legacy', value: 'legacy', tooltip: 'Use the legacy chunking algorithm' },
]

const SEPARATOR_OPTIONS = [
  { label: 'Double Newline', value: '\n\n' },
  { label: 'Single Newline', value: '\n' },
  { label: 'Chinese Period', value: '。' },
  { label: 'Chinese Exclamation', value: '！' },
  { label: 'Chinese Question', value: '？' },
  { label: 'Chinese Semicolon', value: '；' },
  { label: 'English Semicolon', value: ';' },
  { label: 'Space', value: ' ' },
]

const LANGUAGE_OPTIONS = [
  { label: 'German', value: 'de' },
  { label: 'English', value: 'en' },
  { label: 'Chinese', value: 'zh' },
]

export function KBChunkingSettings({ config, onUpdate }: KBChunkingSettingsProps) {
  const { t } = useTranslation()

  const [localChunkSize, setLocalChunkSize] = useState(config.chunkSize)
  const [localChunkOverlap, setLocalChunkOverlap] = useState(config.chunkOverlap)
  const [localSeparators, setLocalSeparators] = useState<string[]>([...config.separators])
  const [localEnableParentChild, setLocalEnableParentChild] = useState(config.enableParentChild ?? false)
  const [localParentChunkSize, setLocalParentChunkSize] = useState(config.parentChunkSize || 4096)
  const [localChildChunkSize, setLocalChildChunkSize] = useState(config.childChunkSize || 384)
  const [localStrategy, setLocalStrategy] = useState(config.strategy ?? '')
  const [localTokenLimit, setLocalTokenLimit] = useState(config.tokenLimit ?? 0)
  const [localLanguages, setLocalLanguages] = useState<string[]>([...(config.languages ?? [])])
  const [advancedOpen, setAdvancedOpen] = useState(false)

  useEffect(() => {
    setLocalChunkSize(config.chunkSize)
    setLocalChunkOverlap(config.chunkOverlap)
    setLocalSeparators([...config.separators])
    setLocalEnableParentChild(config.enableParentChild ?? false)
    setLocalParentChunkSize(config.parentChunkSize || 4096)
    setLocalChildChunkSize(config.childChunkSize || 384)
    setLocalStrategy(config.strategy ?? '')
    setLocalTokenLimit(config.tokenLimit ?? 0)
    setLocalLanguages([...(config.languages ?? [])])
  }, [config])

  const emitUpdate = () => {
    onUpdate({
      chunkSize: localChunkSize,
      chunkOverlap: localChunkOverlap,
      separators: [...localSeparators],
      parserEngineRules: config.parserEngineRules,
      enableParentChild: localEnableParentChild,
      parentChunkSize: localParentChunkSize,
      childChunkSize: localChildChunkSize,
      strategy: localStrategy,
      tokenLimit: localTokenLimit,
      languages: [...localLanguages],
    })
  }

  const overlapTooHigh = localChunkOverlap > 0 && localChunkOverlap >= localChunkSize / 2
  const advancedDisabled = localStrategy === 'legacy'

  const currentStrategyInfo = STRATEGY_OPTIONS.find(o => o.value === localStrategy)

  const handleSeparatorToggle = (sep: string) => {
    if (localSeparators.includes(sep)) {
      setLocalSeparators(localSeparators.filter(s => s !== sep))
    } else {
      setLocalSeparators([...localSeparators, sep])
    }
    setTimeout(emitUpdate, 0)
  }

  const handleLanguageToggle = (lang: string) => {
    if (localLanguages.includes(lang)) {
      setLocalLanguages(localLanguages.filter(l => l !== lang))
    } else {
      setLocalLanguages([...localLanguages, lang])
    }
    setTimeout(emitUpdate, 0)
  }

  return (
    <div className="kb-chunking-settings">
      <div className="section-header mb-6">
        <h2 className="text-lg font-medium">{t('knowledgeEditor.chunking.title', 'Chunking Settings')}</h2>
        <p className="text-sm text-[var(--td-text-color-secondary)] mt-1">
          {t('knowledgeEditor.chunking.description', 'Configure how documents are split into chunks for retrieval')}
        </p>
      </div>

      <div className="space-y-6">
        {/* Strategy */}
        <div className="setting-row">
          <div className="setting-info">
            <label className="font-medium text-sm">
              {t('knowledgeEditor.chunking.strategyLabel', 'Chunking Strategy')}
            </label>
            <p className="text-xs text-[var(--td-text-color-secondary)] mt-0.5">
              {t('knowledgeEditor.chunking.strategyDescription', 'Choose how to split documents into chunks')}
            </p>
          </div>
          <div className="setting-control">
            <select
              value={localStrategy}
              onChange={(e) => {
                setLocalStrategy(e.target.value)
                setTimeout(emitUpdate, 0)
              }}
              className="px-3 py-2 rounded-lg border border-[var(--td-border-level-1-color)] bg-white text-sm min-w-[280px]"
            >
              <option value="">Select strategy...</option>
              {STRATEGY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {t(`knowledgeEditor.chunking.strategies.${opt.value}.label`, opt.label)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Strategy explanation */}
        {currentStrategyInfo && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
            <strong>{currentStrategyInfo.label}:</strong> {currentStrategyInfo.tooltip}
          </div>
        )}

        {/* Chunk Size */}
        <div className="setting-row">
          <div className="setting-info">
            <label className="font-medium text-sm">
              {t('knowledgeEditor.chunking.sizeLabel', 'Chunk Size')}
            </label>
            <p className="text-xs text-[var(--td-text-color-secondary)] mt-0.5">
              {t('knowledgeEditor.chunking.sizeDescription', 'Target size for each chunk in characters')}
            </p>
          </div>
          <div className="setting-control">
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="100"
                max="4000"
                step="50"
                value={localChunkSize}
                onChange={(e) => {
                  setLocalChunkSize(Number(e.target.value))
                  setTimeout(emitUpdate, 0)
                }}
                className="w-48"
              />
              <span className="text-sm font-medium min-w-[80px]">
                {localChunkSize} {t('knowledgeEditor.chunking.characters', 'chars')}
              </span>
            </div>
            <div className="flex gap-2 mt-2 text-xs text-[var(--td-text-color-placeholder)]">
              <span>100</span>
              <span className="ml-16">1000</span>
              <span className="ml-16">2000</span>
              <span className="ml-16">4000</span>
            </div>
          </div>
        </div>

        {/* Chunk Overlap */}
        <div className="setting-row">
          <div className="setting-info">
            <label className="font-medium text-sm">
              {t('knowledgeEditor.chunking.overlapLabel', 'Chunk Overlap')}
            </label>
            <p className="text-xs text-[var(--td-text-color-secondary)] mt-0.5">
              {t('knowledgeEditor.chunking.overlapDescription', 'Overlap between adjacent chunks')}
            </p>
            {overlapTooHigh && (
              <p className="text-xs text-yellow-600 mt-1">
                {t('knowledgeEditor.chunking.overlapWarning', 'Overlap should be less than half of chunk size')}
              </p>
            )}
          </div>
          <div className="setting-control">
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="0"
                max="500"
                step="20"
                value={localChunkOverlap}
                onChange={(e) => {
                  setLocalChunkOverlap(Number(e.target.value))
                  setTimeout(emitUpdate, 0)
                }}
                className="w-48"
              />
              <span className="text-sm font-medium min-w-[80px]">
                {localChunkOverlap} {t('knowledgeEditor.chunking.characters', 'chars')}
              </span>
            </div>
            <div className="flex gap-2 mt-2 text-xs text-[var(--td-text-color-placeholder)]">
              <span>0</span>
              <span className="ml-20">250</span>
              <span className="ml-20">500</span>
            </div>
          </div>
        </div>

        {/* Separators */}
        <div className="setting-row">
          <div className="setting-info">
            <label className="font-medium text-sm">
              {t('knowledgeEditor.chunking.separatorsLabel', 'Separators')}
            </label>
            <p className="text-xs text-[var(--td-text-color-secondary)] mt-0.5">
              {t('knowledgeEditor.chunking.separatorsDescription', 'Characters that indicate a split point')}
            </p>
          </div>
          <div className="setting-control">
            <div className="flex flex-wrap gap-2 min-w-[280px]">
              {SEPARATOR_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleSeparatorToggle(opt.value)}
                  className={`px-3 py-1.5 rounded text-xs border transition-colors ${
                    localSeparators.includes(opt.value)
                      ? 'bg-[var(--td-brand-color)] text-white border-[var(--td-brand-color)]'
                      : 'bg-white text-[var(--td-text-color-primary)] border-[var(--td-border-level-1-color)] hover:border-[var(--td-brand-color)]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Parent-Child Chunking */}
        <div className="setting-row">
          <div className="setting-info">
            <label className="font-medium text-sm">
              {t('knowledgeEditor.chunking.parentChildLabel', 'Parent-Child Chunking')}
            </label>
            <p className="text-xs text-[var(--td-text-color-secondary)] mt-0.5">
              {t('knowledgeEditor.chunking.parentChildDescription', 'Enable hierarchical chunking with parent and child chunks')}
            </p>
          </div>
          <div className="setting-control">
            <button
              type="button"
              onClick={() => {
                setLocalEnableParentChild(!localEnableParentChild)
                setTimeout(emitUpdate, 0)
              }}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                localEnableParentChild ? 'bg-[var(--td-brand-color)]' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  localEnableParentChild ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Parent Chunk Size */}
        {localEnableParentChild && (
          <div className="setting-row">
            <div className="setting-info">
              <label className="font-medium text-sm">
                {t('knowledgeEditor.chunking.parentChunkSizeLabel', 'Parent Chunk Size')}
              </label>
              <p className="text-xs text-[var(--td-text-color-secondary)] mt-0.5">
                {t('knowledgeEditor.chunking.parentChunkSizeDescription', 'Size of parent chunks in characters')}
              </p>
            </div>
            <div className="setting-control">
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="512"
                  max="8192"
                  step="64"
                  value={localParentChunkSize}
                  onChange={(e) => {
                    setLocalParentChunkSize(Number(e.target.value))
                    setTimeout(emitUpdate, 0)
                  }}
                  className="w-48"
                />
                <span className="text-sm font-medium min-w-[80px]">
                  {localParentChunkSize} {t('knowledgeEditor.chunking.characters', 'chars')}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Child Chunk Size */}
        {localEnableParentChild && (
          <div className="setting-row">
            <div className="setting-info">
              <label className="font-medium text-sm">
                {t('knowledgeEditor.chunking.childChunkSizeLabel', 'Child Chunk Size')}
              </label>
              <p className="text-xs text-[var(--td-text-color-secondary)] mt-0.5">
                {t('knowledgeEditor.chunking.childChunkSizeDescription', 'Size of child chunks in characters')}
              </p>
            </div>
            <div className="setting-control">
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="64"
                  max="2048"
                  step="32"
                  value={localChildChunkSize}
                  onChange={(e) => {
                    setLocalChildChunkSize(Number(e.target.value))
                    setTimeout(emitUpdate, 0)
                  }}
                  className="w-48"
                />
                <span className="text-sm font-medium min-w-[80px]">
                  {localChildChunkSize} {t('knowledgeEditor.chunking.characters', 'chars')}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Advanced Section Toggle */}
        <button
          type="button"
          onClick={() => setAdvancedOpen(!advancedOpen)}
          className="flex items-center gap-2 text-sm font-medium text-[var(--td-text-color-primary)] hover:text-[var(--td-brand-color)]"
        >
          {advancedOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          {t('knowledgeEditor.chunking.advancedLabel', 'Advanced Options')}
        </button>

        {/* Advanced Section */}
        {advancedOpen && (
          <div className="space-y-6 pl-4 border-l-2 border-[var(--td-brand-color)]">
            {/* Token Limit */}
            <div className="setting-row">
              <div className="setting-info">
                <label className="font-medium text-sm">
                  {t('knowledgeEditor.chunking.tokenLimitLabel', 'Token Limit')}
                </label>
                <p className="text-xs text-[var(--td-text-color-secondary)] mt-0.5">
                  {t('knowledgeEditor.chunking.tokenLimitDescription', 'Maximum tokens per chunk (0 = no limit)')}
                </p>
              </div>
              <div className="setting-control">
                <input
                  type="number"
                  min="0"
                  max="8192"
                  step="64"
                  value={localTokenLimit}
                  disabled={advancedDisabled}
                  onChange={(e) => {
                    setLocalTokenLimit(Number(e.target.value))
                    setTimeout(emitUpdate, 0)
                  }}
                  className="px-3 py-2 rounded-lg border border-[var(--td-border-level-1-color)] bg-white text-sm w-32 disabled:opacity-50"
                />
              </div>
            </div>

            {/* Languages */}
            <div className="setting-row">
              <div className="setting-info">
                <label className="font-medium text-sm">
                  {t('knowledgeEditor.chunking.languagesLabel', 'Language Hints')}
                </label>
                <p className="text-xs text-[var(--td-text-color-secondary)] mt-0.5">
                  {t('knowledgeEditor.chunking.languagesDescription', 'Select languages for heuristic patterns')}
                </p>
              </div>
              <div className="setting-control">
                <div className="flex flex-wrap gap-2">
                  {LANGUAGE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleLanguageToggle(opt.value)}
                      disabled={advancedDisabled}
                      className={`px-3 py-1.5 rounded text-xs border transition-colors ${
                        localLanguages.includes(opt.value)
                          ? 'bg-[var(--td-brand-color)] text-white border-[var(--td-brand-color)]'
                          : 'bg-white text-[var(--td-text-color-primary)] border-[var(--td-border-level-1-color)] hover:border-[var(--td-brand-color)] disabled:opacity-50'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
