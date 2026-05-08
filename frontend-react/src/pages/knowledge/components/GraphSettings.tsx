import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'

interface GraphExtractConfig {
  enabled: boolean
  tags: string[]
  text?: string
  nodes?: Array<{
    name: string
    attributes: string[]
  }>
}

interface GraphSettingsProps {
  config: GraphExtractConfig
  isGraphDatabaseEnabled?: boolean
  modelAvailable?: boolean
  onUpdate: (config: GraphExtractConfig) => void
  onGenerateTags?: () => void
  onGenerateText?: () => void
}

export function GraphSettings({
  config,
  isGraphDatabaseEnabled = false,
  modelAvailable = true,
  onUpdate,
  onGenerateTags,
  onGenerateText,
}: GraphSettingsProps) {
  const { t } = useTranslation()

  const [localConfig, setLocalConfig] = useState<GraphExtractConfig>({
    enabled: config.enabled ?? false,
    tags: config.tags || [],
    text: config.text || '',
    nodes: config.nodes || [],
  })

  useEffect(() => {
    setLocalConfig({
      enabled: config.enabled ?? false,
      tags: config.tags || [],
      text: config.text || '',
      nodes: config.nodes || [],
    })
  }, [config])

  const handleEnabledChange = () => {
    const newConfig = { ...localConfig, enabled: !localConfig.enabled }
    setLocalConfig(newConfig)
    onUpdate(newConfig)
  }

  const handleTagsChange = (newTags: string[]) => {
    const newConfig = { ...localConfig, tags: newTags }
    setLocalConfig(newConfig)
    onUpdate(newConfig)
  }

  const handleTextChange = (text: string) => {
    const newConfig = { ...localConfig, text }
    setLocalConfig(newConfig)
    onUpdate(newConfig)
  }

  const handleNodesChange = (nodes: typeof localConfig.nodes) => {
    const newConfig = { ...localConfig, nodes }
    setLocalConfig(newConfig)
    onUpdate(newConfig)
  }

  const removeNode = (index: number) => {
    const newNodes = [...(localConfig.nodes || [])]
    newNodes.splice(index, 1)
    handleNodesChange(newNodes)
  }

  const removeAttribute = (nodeIndex: number, attrIndex: number) => {
    const newNodes = [...(localConfig.nodes || [])]
    newNodes[nodeIndex].attributes.splice(attrIndex, 1)
    handleNodesChange(newNodes)
  }

  const addNode = () => {
    const newNodes = [...(localConfig.nodes || []), { name: '', attributes: [] }]
    handleNodesChange(newNodes)
  }

  const addAttribute = (nodeIndex: number) => {
    const newNodes = [...(localConfig.nodes || [])]
    newNodes[nodeIndex].attributes.push('')
    handleNodesChange(newNodes)
  }

  if (!isGraphDatabaseEnabled) {
    return (
      <div className="graph-settings">
        <div className="section-header mb-6">
          <h2 className="text-lg font-medium">{t('graphSettings.title', 'Graph Settings')}</h2>
          <p className="text-sm text-[var(--td-text-color-secondary)] mt-1">
            {t('graphSettings.description', 'Configure entity and relationship extraction for knowledge graph')}
          </p>
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-700">
              {t('graphSettings.disabledWarning', 'Knowledge graph is not enabled. Please enable it in system settings.')}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="graph-settings">
      <div className="section-header mb-6">
        <h2 className="text-lg font-medium">{t('graphSettings.title', 'Graph Settings')}</h2>
        <p className="text-sm text-[var(--td-text-color-secondary)] mt-1">
          {t('graphSettings.description', 'Configure entity and relationship extraction for knowledge graph')}
        </p>
      </div>

      <div className="space-y-6">
        {/* Enable Toggle */}
        <div className="setting-row">
          <div className="setting-info">
            <label className="font-medium text-sm">
              {t('graphSettings.enableLabel', 'Enable Entity Extraction')}
            </label>
            <p className="text-xs text-[var(--td-text-color-secondary)] mt-0.5">
              {t('graphSettings.enableDescription', 'Extract entities and relationships from documents')}
            </p>
          </div>
          <div className="setting-control">
            <button
              type="button"
              onClick={handleEnabledChange}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                localConfig.enabled ? 'bg-[var(--td-brand-color)]' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  localConfig.enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Tags Configuration */}
        {localConfig.enabled && (
          <div className="setting-row flex-col">
            <div className="setting-info">
              <label className="font-medium text-sm">
                {t('graphSettings.tagsLabel', 'Entity Types')}
              </label>
              <p className="text-xs text-[var(--td-text-color-secondary)] mt-0.5">
                {t('graphSettings.tagsDescription', 'Select entity types to extract (e.g., Person, Organization, Location)')}
              </p>
            </div>
            <div className="setting-control w-full">
              <div className="flex gap-2 mb-2">
                {onGenerateTags && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onGenerateTags}
                    disabled={!modelAvailable}
                  >
                    {t('graphSettings.generateRandomTags', 'Generate Tags')}
                  </Button>
                )}
              </div>
              <input
                type="text"
                value={localConfig.tags.join(', ')}
                onChange={(e) => handleTagsChange(e.target.value.split(',').map(t => t.trim()).filter(Boolean))}
                placeholder={t('graphSettings.tagsPlaceholder', 'Enter tags separated by commas')}
                className="w-full px-3 py-2 rounded-lg border border-[var(--td-border-level-1-color)] bg-white text-sm"
              />
              {!modelAvailable && (
                <p className="text-xs text-[var(--td-text-color-placeholder)] mt-1">
                  {t('graphSettings.completeModelConfig', 'Please complete model configuration first')}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Sample Text */}
        {localConfig.enabled && (
          <div className="setting-row flex-col">
            <div className="setting-info">
              <label className="font-medium text-sm">
                {t('graphSettings.sampleTextLabel', 'Sample Text')}
              </label>
              <p className="text-xs text-[var(--td-text-color-secondary)] mt-0.5">
                {t('graphSettings.sampleTextDescription', 'Enter sample text to test entity extraction')}
              </p>
            </div>
            <div className="setting-control w-full">
              <div className="flex gap-2 mb-2">
                {onGenerateText && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onGenerateText}
                    disabled={!modelAvailable}
                  >
                    {t('graphSettings.generateRandomText', 'Generate Text')}
                  </Button>
                )}
              </div>
              <textarea
                value={localConfig.text || ''}
                onChange={(e) => handleTextChange(e.target.value)}
                placeholder={t('graphSettings.sampleTextPlaceholder', 'Enter sample text here...')}
                rows={6}
                maxLength={5000}
                className="w-full px-3 py-2 rounded-lg border border-[var(--td-border-level-1-color)] bg-white text-sm resize-none"
              />
              <p className="text-xs text-[var(--td-text-color-placeholder)] mt-1 text-right">
                {(localConfig.text || '').length}/5000
              </p>
            </div>
          </div>
        )}

        {/* Entity List */}
        {localConfig.enabled && localConfig.nodes && localConfig.nodes.length > 0 && (
          <div className="setting-row flex-col">
            <div className="setting-info">
              <label className="font-medium text-sm">
                {t('graphSettings.entityListLabel', 'Extracted Entities')}
              </label>
              <p className="text-xs text-[var(--td-text-color-secondary)] mt-0.5">
                {t('graphSettings.entityListDescription', 'Review and edit extracted entities')}
              </p>
            </div>
            <div className="setting-control w-full space-y-3">
              {localConfig.nodes.map((node, nodeIndex) => (
                <div key={nodeIndex} className="p-3 border border-[var(--td-border-level-1-color)] rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium">Entity:</span>
                    <input
                      type="text"
                      value={node.name}
                      onChange={(e) => {
                        const newNodes = [...(localConfig.nodes || [])]
                        newNodes[nodeIndex].name = e.target.value
                        handleNodesChange(newNodes)
                      }}
                      placeholder={t('graphSettings.nodeNamePlaceholder', 'Entity name')}
                      className="flex-1 px-2 py-1 border border-[var(--td-border-level-1-color)] rounded text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => removeNode(nodeIndex)}
                      className="p-1 text-red-500 hover:bg-red-50 rounded"
                    >
                      Delete
                    </button>
                  </div>
                  <div className="ml-4 space-y-1">
                    {node.attributes.map((attr, attrIndex) => (
                      <div key={attrIndex} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={attr}
                          onChange={(e) => {
                            const newNodes = [...(localConfig.nodes || [])]
                            newNodes[nodeIndex].attributes[attrIndex] = e.target.value
                            handleNodesChange(newNodes)
                          }}
                          placeholder={t('graphSettings.attributePlaceholder', 'Attribute')}
                          className="flex-1 px-2 py-1 border border-[var(--td-border-level-1-color)] rounded text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => removeAttribute(nodeIndex, attrIndex)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addAttribute(nodeIndex)}
                      className="text-sm text-[var(--td-brand-color)] hover:underline"
                    >
                      + Add Attribute
                    </button>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={addNode}
                className="w-full py-2 border border-dashed border-[var(--td-border-level-1-color)] rounded-lg text-sm text-[var(--td-text-color-secondary)] hover:border-[var(--td-brand-color)] hover:text-[var(--td-brand-color)]"
              >
                + Add Entity
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
