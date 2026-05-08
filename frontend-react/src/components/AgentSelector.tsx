import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Check } from 'lucide-react'

interface Agent {
  id: string
  name: string
  description?: string
  is_builtin?: boolean
  icon?: string
  config?: {
    agent_mode?: 'smart-reasoning' | 'normal'
    kb_selection_mode?: 'none' | 'all' | 'selected'
    knowledge_bases?: string[]
    web_search_enabled?: boolean
    mcp_selection_mode?: 'none' | 'all' | 'selected'
    mcp_services?: string[]
    multi_turn_enabled?: boolean
  }
}

interface AgentSelectorProps {
  visible: boolean
  anchorEl?: HTMLElement | null
  currentAgentId: string
  agents?: Agent[]
  onClose: () => void
  onSelect: (agent: Agent, sourceTenantId?: string) => void
  onManageAgents?: () => void
}

const BUILTIN_QUICK_ANSWER_ID = 'builtin-quick-answer'
const BUILTIN_SMART_REASONING_ID = 'builtin-smart-reasoning'

export function AgentSelector({
  visible,
  anchorEl,
  currentAgentId,
  agents = [],
  onClose,
  onSelect,
  onManageAgents,
}: AgentSelectorProps) {
  const { t } = useTranslation()
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({})

  const builtinAgents = agents.filter(a => a.is_builtin).map(agent => {
    if (agent.id === BUILTIN_QUICK_ANSWER_ID) {
      return { ...agent, name: t('agent.mode.normal'), description: t('chat.normalModeDesc') }
    } else if (agent.id === BUILTIN_SMART_REASONING_ID) {
      return { ...agent, name: t('agent.mode.agent'), description: t('chat.agentModeDesc') }
    }
    return agent
  })

  const customAgents = agents.filter(a => !a.is_builtin)

  const isSelected = (agent: Agent) => currentAgentId === agent.id

  const handleSelect = (agent: Agent) => {
    onSelect(agent)
  }

  useEffect(() => {
    if (visible && anchorEl) {
      const rect = anchorEl.getBoundingClientRect()
      const dropdownWidth = 320
      const offsetY = 8
      const vh = window.innerHeight
      const vw = window.innerWidth

      let left = Math.floor(rect.left)
      const minLeft = 16
      const maxLeft = Math.max(16, vw - dropdownWidth - 16)
      left = Math.max(minLeft, Math.min(maxLeft, left))

      const preferredDropdownHeight = 320
      const minDropdownHeight = 100
      const topMargin = 20
      const spaceBelow = vh - rect.bottom
      const spaceAbove = rect.top

      let actualHeight: number

      if (spaceBelow >= minDropdownHeight + offsetY) {
        actualHeight = Math.min(preferredDropdownHeight, spaceBelow - offsetY - 16)
        const top = Math.floor(rect.bottom + offsetY)
        setDropdownStyle({
          position: 'fixed',
          width: `${dropdownWidth}px`,
          left: `${left}px`,
          top: `${top}px`,
          maxHeight: `${actualHeight}px`,
          zIndex: 9999,
        })
      } else {
        const availableHeight = spaceAbove - offsetY - topMargin
        actualHeight = availableHeight >= preferredDropdownHeight
          ? preferredDropdownHeight
          : Math.max(minDropdownHeight, availableHeight)
        const bottom = vh - rect.top + offsetY
        setDropdownStyle({
          position: 'fixed',
          width: `${dropdownWidth}px`,
          left: `${left}px`,
          bottom: `${bottom}px`,
          maxHeight: `${actualHeight}px`,
          zIndex: 9999,
        })
      }
    }
  }, [visible, anchorEl])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    if (visible) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [visible, onClose])

  if (!visible) return null

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-[9998]"
        onClick={onClose}
        style={{ background: 'transparent', touchAction: 'none' }}
      />

      {/* Dropdown */}
      <div
        ref={dropdownRef}
        className="fixed bg-[var(--td-bg-color-container)] rounded-[10px] border border-[var(--td-component-border)] shadow-lg overflow-hidden flex flex-col animate-in fade-in-0 zoom-in-95 duration-150"
        style={dropdownStyle}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--td-component-stroke)] bg-[var(--td-bg-color-container)]">
          <span className="text-xs font-medium text-[var(--td-text-color-secondary)]">
            {t('agent.selectAgent')}
          </span>
          {onManageAgents && (
            <button
              onClick={onManageAgents}
              className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-[var(--td-brand-color)] hover:bg-[var(--td-bg-color-secondarycontainer)] transition-colors"
            >
              <span className="text-sm">+</span>
              <span>{t('agent.manageAgents')}</span>
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-2" style={{ WebkitOverflowScrolling: 'touch' }}>
          {/* Built-in Agents */}
          {builtinAgents.length > 0 && (
            <div className="mb-2 pb-2 border-b border-[var(--td-component-stroke)]">
              <div className="text-[11px] text-[var(--td-text-color-placeholder)] px-2 py-1 font-medium">
                {t('agent.builtinAgents')}
              </div>
              {builtinAgents.map(agent => (
                <div
                  key={agent.id}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors mb-1 last:mb-0 ${
                    isSelected(agent)
                      ? 'bg-[var(--td-brand-color-light)]'
                      : 'hover:bg-[var(--td-bg-color-container-hover)]'
                  }`}
                  onClick={() => handleSelect(agent)}
                >
                  <div
                    className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0 ${
                      agent.config?.agent_mode === 'smart-reasoning'
                        ? 'bg-purple-100 text-purple-600'
                        : 'bg-[var(--td-brand-color-light)] text-[var(--td-brand-color-active)]'
                    }`}
                  >
                    {agent.config?.agent_mode === 'smart-reasoning' ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2L2 7l10 5 10-5-10-5z" />
                        <path d="M2 17l10 5 10-5" />
                        <path d="M2 12l10 5 10-5" />
                      </svg>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                    )}
                  </div>
                  <span className="text-xs text-[var(--td-text-color-primary)] flex-1 truncate">
                    {agent.name}
                  </span>
                  {isSelected(agent) && <Check className="w-3.5 h-3.5 text-[var(--td-success-color)] flex-shrink-0" />}
                </div>
              ))}
            </div>
          )}

          {/* Custom Agents */}
          {customAgents.length > 0 && (
            <div>
              <div className="text-[11px] text-[var(--td-text-color-placeholder)] px-2 py-1 font-medium">
                {t('agent.customAgents')}
              </div>
              {customAgents.map(agent => (
                <div
                  key={agent.id}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors mb-1 last:mb-0 ${
                    isSelected(agent)
                      ? 'bg-[var(--td-brand-color-light)]'
                      : 'hover:bg-[var(--td-bg-color-container-hover)]'
                  }`}
                  onClick={() => handleSelect(agent)}
                >
                  <div className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0 bg-[var(--td-bg-color-secondarycontainer)] text-[var(--td-text-color-secondary)] font-medium text-xs">
                    {agent.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs text-[var(--td-text-color-primary)] flex-1 truncate">
                    {agent.name}
                  </span>
                  {isSelected(agent) && <Check className="w-3.5 h-3.5 text-[var(--td-success-color)] flex-shrink-0" />}
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {builtinAgents.length === 0 && customAgents.length === 0 && (
            <div className="text-center text-[var(--td-text-color-disabled)] text-xs py-8">
              {t('agent.noAgents')}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
