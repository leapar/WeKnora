import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { RefreshCw, MessageCircle } from 'lucide-react'
import { AgentAvatar } from './AgentAvatar'

// Platform logos sourced from iconify (simple-icons / logos / tdesign / remix icon).
// Bundled as static assets so they share the app's caching story.
import wecomLogo from '@/assets/img/im/wecom.svg'
import feishuLogo from '@/assets/img/im/feishu.svg'
import slackLogo from '@/assets/img/im/slack.svg'
import telegramLogo from '@/assets/img/im/telegram.svg'
import dingtalkLogo from '@/assets/img/im/dingtalk.svg'
import mattermostLogo from '@/assets/img/im/mattermost.svg'
import wechatLogo from '@/assets/img/im/wechat.svg'

const PLATFORM_LOGO: Record<string, string> = {
  wecom: wecomLogo,
  feishu: feishuLogo,
  slack: slackLogo,
  telegram: telegramLogo,
  dingtalk: dingtalkLogo,
  mattermost: mattermostLogo,
  wechat: wechatLogo,
}

export interface IMChannelOverview {
  id: string
  agent_id: string
  agent_name?: string
  name?: string
  platform: string
  enabled: boolean
}

export interface CustomAgent {
  id: string
  name: string
  is_builtin?: boolean
  avatar?: string
  config?: {
    agent_mode?: 'smart-reasoning' | 'normal'
  }
}

interface IMChannelPanelProps {
  active: boolean
  onClose: () => void
  onChannelsChanged?: (channels: IMChannelOverview[]) => void
}

// These would be imported from your API module
// import { listAllIMChannels, listAgents, toggleIMChannel } from '@/api/agent'

export function IMChannelPanel({ active, onClose, onChannelsChanged }: IMChannelPanelProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [channels, setChannels] = useState<IMChannelOverview[]>([])
  const [agentMap] = useState<Map<string, CustomAgent>>(new Map())
  const [loading, setLoading] = useState(false)
  const [togglingId, setTogglingId] = useState<string>('')
  const isActiveRef = useRef(active)
  const hasLoadedRef = useRef(false)

  // Reload only when transitioning into active
  useEffect(() => {
    if (active && !isActiveRef.current) {
      isActiveRef.current = true
      hasLoadedRef.current = false
      loadAll()
    } else if (!active) {
      isActiveRef.current = false
    }
  }, [active])

  const loadAll = useCallback(async () => {
    if (hasLoadedRef.current) return
    hasLoadedRef.current = true

    setLoading(true)
    try {
      // const [chanResp, agentResp] = await Promise.all([
      //   listAllIMChannels(),
      //   listAgents(),
      // ])
      // const chans = chanResp?.data || []
      // setChannels(chans)
      // const m = new Map<string, CustomAgent>()
      // ;(agentResp?.data || []).forEach((a: CustomAgent) => m.set(a.id, a))
      // setAgentMap(m)
      // onChannelsChanged?.(chans)

      // Placeholder data for demonstration
      const mockChannels: IMChannelOverview[] = []
      setChannels(mockChannels)
      onChannelsChanged?.(mockChannels)
    } catch (err) {
      console.error('Failed to load IM overview:', err)
    } finally {
      setLoading(false)
    }
  }, [onChannelsChanged])

  const handleToggle = useCallback(async (ch: IMChannelOverview) => {
    if (togglingId) return
    setTogglingId(ch.id)
    try {
      // await toggleIMChannel(ch.id)
      // const resp = await listAllIMChannels()
      // setChannels(resp?.data || [])
      // onChannelsChanged?.(channels)

      // Mock toggle
      setChannels(prev =>
        prev.map(c => c.id === ch.id ? { ...c, enabled: !c.enabled } : c)
      )
    } catch (err: any) {
      console.error('Failed to toggle IM channel:', err)
    } finally {
      setTogglingId('')
    }
  }, [togglingId, onChannelsChanged, channels])

  const gotoAgentEditor = useCallback((ch: IMChannelOverview) => {
    onClose()
    navigate({
      pathname: '/platform/agents',
      search: `?edit=${ch.agent_id}&section=im`,
    })
  }, [onClose, navigate])

  const platformLogo = (p: string) => PLATFORM_LOGO[p] || ''
  const platformLabel = (p: string) => t(`agentEditor.im.${p}`)
  const agentMeta = (agentId: string) => agentMap.get(agentId)

  return (
    <div className="im-submenu flex flex-col w-[300px] max-h-[520px] bg-[var(--td-bg-color-container)] rounded-lg shadow-[0_6px_24px_rgba(0,0,0,0.14)] border border-[var(--td-component-stroke)] overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 px-3 py-3 border-b border-[var(--td-component-stroke)]">
        <div className="min-w-0">
          <h4 className="m-0 text-[13px] font-semibold text-[var(--td-text-color-primary)] leading-[1.3]">
            {t('imOverview.pageTitle')}
          </h4>
          <p className="m-0 text-[11px] text-[var(--td-text-color-secondary)] leading-[1.4]">
            {t('imOverview.subtitle')}
          </p>
        </div>
        <button
          onClick={loadAll}
          disabled={loading}
          className="p-1 rounded text-[var(--td-text-color-secondary)] hover:bg-[var(--td-bg-color-container-hover)] disabled:opacity-50 transition-colors"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-1.5 flex flex-col gap-1">
        {loading && channels.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2.5 py-10 text-[var(--td-text-color-placeholder)]">
            <div className="animate-spin w-5 h-5 border-2 border-[var(--td-text-color-placeholder)] border-t-transparent rounded-full" />
          </div>
        ) : channels.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2.5 py-10 text-[var(--td-text-color-placeholder)]">
            <span className="text-xs">{t('imOverview.empty')}</span>
          </div>
        ) : (
          <div className="flex flex-col gap-0.5">
            {channels.map((ch) => (
              <div
                key={ch.id}
                className={`channel-item flex items-center gap-2 px-2.5 py-2 rounded-md cursor-pointer outline-none transition-colors ${!ch.enabled ? 'opacity-55' : ''} hover:bg-[var(--td-bg-color-container-hover)] focus-visible:bg-[var(--td-bg-color-container-hover)]`}
                role="button"
                tabIndex={0}
                title={t('imOverview.gotoAgentEditor')}
                onClick={() => gotoAgentEditor(ch)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    gotoAgentEditor(ch)
                  }
                }}
              >
                {/* Stacked rows: agent on top, IM channel below */}
                <div className="stack flex-1 min-w-0 flex flex-col gap-0.5">
                  {/* Agent row */}
                  <div className="stack-row flex items-center gap-2 min-w-0">
                    <span className="row-avatar inline-flex items-center justify-center w-5 h-5 rounded flex-shrink-0">
                      {agentMeta(ch.agent_id)?.is_builtin ? (
                        <span
                          className={`builtin-avatar flex items-center justify-center w-5 h-5 rounded text-[10px] ${
                            agentMeta(ch.agent_id)?.config?.agent_mode === 'smart-reasoning'
                              ? 'bg-[rgba(124,77,255,0.15)] text-[var(--td-brand-color)]'
                              : 'bg-[rgba(7,192,95,0.15)] text-[var(--td-brand-color-active)]'
                          }`}
                        >
                          {agentMeta(ch.agent_id)?.config?.agent_mode === 'smart-reasoning' && (
                            <MessageCircle size={12} />
                          )}
                        </span>
                      ) : agentMeta(ch.agent_id)?.avatar ? (
                        <span className="builtin-avatar-agent-emoji w-5 h-5 rounded flex items-center justify-center bg-[var(--td-bg-color-container-hover)] text-[13px] leading-none">
                          {agentMeta(ch.agent_id)!.avatar}
                        </span>
                      ) : (
                        <AgentAvatar name={ch.agent_name || ch.agent_id} size="small" />
                      )}
                    </span>
                    <span
                      className="row-label text-xs text-[var(--td-text-color-primary)] whitespace-nowrap overflow-hidden text-ellipsis min-w-0 leading-tight"
                      title={ch.agent_name || agentMeta(ch.agent_id)?.name || ''}
                    >
                      {ch.agent_name || agentMeta(ch.agent_id)?.name || t('imOverview.builtinAgent')}
                    </span>
                  </div>

                  {/* Channel row */}
                  <div className="stack-row flex items-center gap-2 min-w-0">
                    <span className="row-avatar platform-logo w-5 h-5 rounded flex-shrink-0 p-0.5">
                      <img
                        src={platformLogo(ch.platform)}
                        alt={platformLabel(ch.platform)}
                        className="w-full h-full object-contain"
                      />
                    </span>
                    <span
                      className="row-label text-xs text-[var(--td-text-color-primary)] whitespace-nowrap overflow-hidden text-ellipsis min-w-0 leading-tight"
                      title={ch.name || platformLabel(ch.platform)}
                    >
                      {ch.name || platformLabel(ch.platform)}
                    </span>
                  </div>
                </div>

                {/* Toggle switch */}
                <div className="ml-2 flex-shrink-0 inline-flex items-center" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => handleToggle(ch)}
                    disabled={togglingId === ch.id}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                      ch.enabled ? 'bg-[var(--td-brand-color)]' : 'bg-[var(--td-bg-color-component)]'
                    } disabled:opacity-50`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                        ch.enabled ? 'translate-x-[18px]' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}