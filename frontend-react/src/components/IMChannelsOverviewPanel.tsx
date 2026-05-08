import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Link,
  PlayCircle,
  Edit,
  Trash2,
  Plus,
  File,
} from 'lucide-react'

export interface IMChannel {
  id: string
  agent_id: string
  name?: string
  platform: string
  mode: 'websocket' | 'webhook' | 'longpoll'
  output_mode: 'stream' | 'full'
  session_mode?: 'user' | 'thread'
  enabled: boolean
  knowledge_base_id?: string
  credentials: Record<string, any>
}

interface KnowledgeBase {
  id: string
  name: string
}

interface IMChannelsOverviewPanelProps {
  agentId: string
}

const platformSupportsThread = (platform: string): boolean => {
  return ['slack', 'mattermost', 'feishu', 'telegram'].includes(platform)
}

const defaultCredentials = (): Record<string, any> => ({})

export function IMChannelsOverviewPanel({ agentId }: IMChannelsOverviewPanelProps) {
  const { t } = useTranslation()
  const [channels, setChannels] = useState<IMChannel[]>([])
  const [loading, setLoading] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingChannel, setEditingChannel] = useState<IMChannel | null>(null)
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([])

  const [formData, setFormData] = useState({
    platform: 'wecom' as 'wecom' | 'feishu' | 'slack' | 'telegram' | 'dingtalk' | 'mattermost' | 'wechat',
    name: '',
    mode: 'websocket' as 'webhook' | 'websocket' | 'longpoll',
    output_mode: 'stream' as 'stream' | 'full',
    session_mode: 'user' as 'user' | 'thread',
    knowledge_base_id: '',
    credentials: defaultCredentials(),
  })

  useEffect(() => {
    loadChannels()
  }, [agentId])

  const loadChannels = async () => {
    setLoading(true)
    try {
      // const [channelRes, kbRes] = await Promise.all([
      //   listIMChannels(agentId),
      //   listKnowledgeBases({ agent_id: agentId }),
      // ])
      // setChannels(channelRes.data || [])
      // setKnowledgeBases((kbRes.data || []).map((kb: any) => ({ id: kb.id, name: kb.name })))

      // Placeholder
      setChannels([])
      setKnowledgeBases([])
    } catch {
      setChannels([])
    } finally {
      setLoading(false)
    }
  }

  const platformLabel = (platform: string) => t(`agentEditor.im.${platform}`)

  const getCallbackUrl = (channel: IMChannel) => {
    const base = window.location.origin
    return `${base}/api/v1/im/callback/${channel.id}`
  }

  const copyUrl = async (channel: IMChannel) => {
    const text = getCallbackUrl(channel)
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      // Fallback
    }
  }

  const onPlatformChange = (val: string) => {
    setFormData(prev => ({
      ...prev,
      platform: val as typeof prev.platform,
      credentials: defaultCredentials(),
    }))

    if (val === 'wechat') {
      setFormData(prev => ({
        ...prev,
        mode: 'longpoll',
        output_mode: 'full',
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        mode: 'websocket',
        output_mode: 'stream',
      }))
    }
  }

  const editChannel = (channel: IMChannel) => {
    setEditingChannel(channel)
    setFormData({
      platform: channel.platform as typeof formData.platform,
      name: channel.name || '',
      mode: channel.mode,
      output_mode: channel.output_mode,
      session_mode: channel.session_mode || 'user',
      knowledge_base_id: channel.knowledge_base_id || '',
      credentials: { ...channel.credentials },
    })
    setShowCreateDialog(true)
  }

  const resetForm = () => {
    setEditingChannel(null)
    setFormData({
      platform: 'wecom',
      name: '',
      mode: 'websocket',
      output_mode: 'stream',
      session_mode: 'user',
      knowledge_base_id: '',
      credentials: defaultCredentials(),
    })
  }

  const handleSave = async () => {
    try {
      // if (formData.platform === 'wechat' && !formData.credentials.bot_token) {
      //   return
      // }
      // if (editingChannel) {
      //   await updateIMChannel(editingChannel.id, {
      //     name: formData.name,
      //     mode: formData.mode,
      //     output_mode: formData.output_mode,
      //     session_mode: formData.session_mode,
      //     knowledge_base_id: formData.knowledge_base_id,
      //     credentials: formData.credentials,
      //   })
      // } else {
      //   await createIMChannel(agentId, {
      //     platform: formData.platform,
      //     name: formData.name,
      //     mode: formData.mode,
      //     output_mode: formData.output_mode,
      //     session_mode: formData.session_mode,
      //     knowledge_base_id: formData.knowledge_base_id,
      //     credentials: formData.credentials,
      //   })
      // }
      setShowCreateDialog(false)
      resetForm()
      await loadChannels()
    } catch (e: any) {
      console.error(e)
    }
  }

  const handleToggle = async (_channel: IMChannel) => {
    try {
      // await toggleIMChannel(_channel.id)
      // await loadChannels()
    } catch (e: any) {
      console.error(e)
    }
  }

  const handleDelete = async (_id: string) => {
    try {
      // await deleteIMChannel(_id)
      // await loadChannels()
    } catch (e: any) {
      console.error(e)
    }
  }

  const renderPlatformBadge = (platform: string) => {
    const colors: Record<string, string> = {
      wecom: 'bg-[rgba(7,193,96,0.08)] text-[#07c160]',
      feishu: 'bg-[rgba(51,112,255,0.08)] text-[#3370ff]',
      slack: 'bg-[rgba(224,30,90,0.08)] text-[#e01e5a]',
      telegram: 'bg-[rgba(38,166,219,0.08)] text-[#26a6db]',
      dingtalk: 'bg-[rgba(23,126,251,0.08)] text-[#177efb]',
      mattermost: 'bg-[rgba(25,42,77,0.08)] text-[#192a4d]',
      wechat: 'bg-[rgba(7,193,96,0.08)] text-[#07c160]',
    }
    return (
      <span className={`platform-badge inline-block px-2 py-0.5 rounded text-[12px] font-medium leading-[18px] ${colors[platform] || ''}`}>
        {platformLabel(platform)}
      </span>
    )
  }

  return (
    <div className="section-content flex flex-col gap-4">
      {/* Channel list section */}
      <div className="channels-section mb-2">
        <div className="channels-header flex items-center gap-2 mb-4">
          <span className="channels-title text-sm font-medium text-[var(--td-text-color-primary)]">
            {t('agentEditor.im.addChannel')}
          </span>
          <span className="channels-count px-2 py-0.5 bg-[var(--td-bg-color-secondarycontainer)] rounded-[10px] text-xs text-[var(--td-text-color-disabled)]">
            {channels.length}
          </span>
        </div>

        {loading ? (
          <div className="channels-loading flex items-center justify-center gap-2 py-8 text-[var(--td-text-color-disabled)] text-sm">
            <div className="animate-spin w-5 h-5 border-2 border-current border-t-transparent rounded-full" />
            <span>{t('common.loading')}</span>
          </div>
        ) : channels.length === 0 ? (
          <div className="channels-empty flex flex-col items-center justify-center gap-3 py-10 px-5 bg-[var(--td-bg-color-secondarycontainer)] rounded-lg text-[var(--td-text-color-disabled)]">
            <File size={32} className="opacity-50" />
            <span>{t('agentEditor.im.empty')}</span>
          </div>
        ) : (
          <div className="channels-list grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4 max-h-[400px] overflow-y-auto">
            {channels.map((channel) => (
              <div key={channel.id} className="channel-item flex flex-col gap-4 p-4 bg-[var(--td-bg-color-container)] border border-[var(--td-component-stroke)] rounded-lg transition-all hover:border-[var(--td-brand-color)] hover:shadow-md">
                <div className="channel-item-header flex justify-between items-start gap-3">
                  <div className="channel-info-top flex items-center gap-3">
                    <div className="channel-main flex items-center gap-2">
                      {renderPlatformBadge(channel.platform)}
                      <span className="channel-name text-sm font-medium text-[var(--td-text-color-primary)]">
                        {channel.name || t('agentEditor.im.unnamed')}
                      </span>
                    </div>
                  </div>
                  <div className="channel-actions flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => handleToggle(channel)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                        channel.enabled ? 'bg-[var(--td-brand-color)]' : 'bg-[var(--td-bg-color-component)]'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                          channel.enabled ? 'translate-x-[18px]' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                    <div className="relative group">
                      <button className="p-1 rounded hover:bg-[var(--td-bg-color-container-hover)]">
                        <File size={16} />
                      </button>
                      <div className="hidden group-hover:block absolute right-0 top-full mt-1 py-1 bg-[var(--td-bg-color-container)] border border-[var(--td-component-stroke)] rounded-lg shadow-lg z-10 min-w-[100px]">
                        <button
                          onClick={() => editChannel(channel)}
                          className="w-full px-3 py-1.5 text-left text-sm hover:bg-[var(--td-bg-color-container-hover)] flex items-center gap-2"
                        >
                          <Edit size={14} />
                          {t('common.edit')}
                        </button>
                        <button
                          onClick={() => handleDelete(channel.id)}
                          className="w-full px-3 py-1.5 text-left text-sm hover:bg-[var(--td-bg-color-container-hover)] flex items-center gap-2 text-red-600"
                        >
                          <Trash2 size={14} />
                          {t('common.delete')}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="channel-info flex-1 min-w-0 flex flex-col gap-2">
                  <div className="channel-meta flex items-center gap-1.5 text-xs text-[var(--td-text-color-placeholder)]">
                    <span className="meta-tag inline-flex items-center gap-1 px-1.5 py-0.5 bg-[var(--td-bg-color-secondarycontainer)] rounded">
                      <Link size={12} />
                      {channel.mode}
                    </span>
                    <span className="meta-tag inline-flex items-center gap-1 px-1.5 py-0.5 bg-[var(--td-bg-color-secondarycontainer)] rounded">
                      <PlayCircle size={12} />
                      {channel.output_mode === 'stream' ? t('agentEditor.im.outputStream') : t('agentEditor.im.outputFull')}
                    </span>
                    {channel.session_mode === 'thread' && (
                      <span className="meta-tag inline-flex items-center gap-1 px-1.5 py-0.5 bg-[var(--td-bg-color-secondarycontainer)] rounded">
                        <File size={12} />
                        {t('agentEditor.im.sessionModeThread')}
                      </span>
                    )}
                  </div>
                  {channel.mode === 'webhook' && (
                    <div className="callback-url-row flex items-center gap-2 text-xs pt-1 border-t border-dashed border-[var(--td-component-stroke)]">
                      <span className="text-[var(--td-text-color-secondary)] whitespace-nowrap">{t('agentEditor.im.callbackUrl')}:</span>
                      <code className="url-value bg-[var(--td-bg-color-container)] px-2 py-0.5 rounded text-[11px] overflow-hidden text-ellipsis whitespace-nowrap flex-1 min-w-0">
                        {getCallbackUrl(channel)}
                      </code>
                      <button
                        onClick={() => copyUrl(channel)}
                        className="p-1 rounded hover:bg-[var(--td-bg-color-container-hover)]"
                      >
                        <File size={12} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add button */}
      <button
        onClick={() => setShowCreateDialog(true)}
        className="add-btn mt-1 w-full py-2 px-4 border border-dashed border-[var(--td-component-stroke)] rounded-lg text-sm text-[var(--td-text-color-secondary)] hover:border-[var(--td-brand-color)] hover:text-[var(--td-brand-color)] transition-colors flex items-center justify-center gap-1"
      >
        <Plus size={16} />
        {t('agentEditor.im.addChannel')}
      </button>

      {/* Create/Edit drawer */}
      {showCreateDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => { setShowCreateDialog(false); resetForm(); }} />
          <div className="relative z-10 w-[560px] max-h-[80vh] bg-[var(--td-bg-color-container)] rounded-lg shadow-xl overflow-hidden flex flex-col">
            {/* Drawer header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--td-component-stroke)]">
              <h3 className="text-base font-medium text-[var(--td-text-color-primary)]">
                {editingChannel ? t('agentEditor.im.editChannel') : t('agentEditor.im.addChannel')}
              </h3>
              <button
                onClick={() => { setShowCreateDialog(false); resetForm(); }}
                className="p-1 rounded hover:bg-[var(--td-bg-color-container-hover)]"
              >
                ×
              </button>
            </div>

            {/* Drawer body */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="drawer-form flex flex-col gap-4">
                {/* Platform */}
                <div className="form-item">
                  <label className="form-label block mb-2 text-sm font-medium text-[var(--td-text-color-primary)]">
                    {t('agentEditor.im.platform')}
                  </label>
                  <select
                    value={formData.platform}
                    onChange={(e) => onPlatformChange(e.target.value)}
                    disabled={!!editingChannel}
                    className="w-full px-3 py-2 bg-[var(--td-bg-color-container)] border border-[var(--td-component-stroke)] rounded-lg text-sm focus:outline-none focus:border-[var(--td-brand-color)] disabled:opacity-50"
                  >
                    <option value="wecom">{t('agentEditor.im.wecom')}</option>
                    <option value="feishu">{t('agentEditor.im.feishu')}</option>
                    <option value="slack">{t('agentEditor.im.slack')}</option>
                    <option value="telegram">{t('agentEditor.im.telegram')}</option>
                    <option value="dingtalk">{t('agentEditor.im.dingtalk')}</option>
                    <option value="mattermost">{t('agentEditor.im.mattermost')}</option>
                    <option value="wechat">{t('agentEditor.im.wechat')}</option>
                  </select>
                </div>

                {/* Name */}
                <div className="form-item">
                  <label className="form-label block mb-2 text-sm font-medium text-[var(--td-text-color-primary)]">
                    {t('agentEditor.im.channelName')}
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder={t('agentEditor.im.channelNamePlaceholder')}
                    className="w-full px-3 py-2 bg-[var(--td-bg-color-container)] border border-[var(--td-component-stroke)] rounded-lg text-sm focus:outline-none focus:border-[var(--td-brand-color)]"
                  />
                </div>

                {/* Mode (hidden for WeChat) */}
                {formData.platform !== 'wechat' && (
                  <div className="form-item">
                    <label className="form-label block mb-2 text-sm font-medium text-[var(--td-text-color-primary)]">
                      {t('agentEditor.im.mode')}
                    </label>
                    <div className="flex gap-2">
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="mode"
                          value="websocket"
                          checked={formData.mode === 'websocket'}
                          onChange={() => setFormData(prev => ({ ...prev, mode: 'websocket' }))}
                          disabled={formData.platform === 'mattermost'}
                          className="accent-[var(--td-brand-color)]"
                        />
                        <span className="text-sm">WebSocket</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="mode"
                          value="webhook"
                          checked={formData.mode === 'webhook'}
                          onChange={() => setFormData(prev => ({ ...prev, mode: 'webhook' }))}
                          className="accent-[var(--td-brand-color)]"
                        />
                        <span className="text-sm">Webhook</span>
                      </label>
                    </div>
                    <p className="form-hint mt-1.5 text-xs text-[var(--td-text-color-placeholder)] leading-4">
                      {formData.platform === 'mattermost' ? t('agentEditor.im.mattermostModeHint') : t('agentEditor.im.modeHint')}
                    </p>
                  </div>
                )}

                {/* Output mode (hidden for WeChat) */}
                {formData.platform !== 'wechat' && (
                  <div className="form-item">
                    <label className="form-label block mb-2 text-sm font-medium text-[var(--td-text-color-primary)]">
                      {t('agentEditor.im.outputMode')}
                    </label>
                    <div className="flex gap-2">
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="output_mode"
                          value="stream"
                          checked={formData.output_mode === 'stream'}
                          onChange={() => setFormData(prev => ({ ...prev, output_mode: 'stream' }))}
                          className="accent-[var(--td-brand-color)]"
                        />
                        <span className="text-sm">{t('agentEditor.im.outputStream')}</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="output_mode"
                          value="full"
                          checked={formData.output_mode === 'full'}
                          onChange={() => setFormData(prev => ({ ...prev, output_mode: 'full' }))}
                          className="accent-[var(--td-brand-color)]"
                        />
                        <span className="text-sm">{t('agentEditor.im.outputFull')}</span>
                      </label>
                    </div>
                  </div>
                )}

                {/* Session Mode */}
                <div className="form-item">
                  <label className="form-label block mb-2 text-sm font-medium text-[var(--td-text-color-primary)]">
                    {t('agentEditor.im.sessionMode')}
                  </label>
                  <div className="flex gap-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="session_mode"
                        value="user"
                        checked={formData.session_mode === 'user'}
                        onChange={() => setFormData(prev => ({ ...prev, session_mode: 'user' }))}
                        className="accent-[var(--td-brand-color)]"
                      />
                      <span className="text-sm">{t('agentEditor.im.sessionModeUser')}</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="session_mode"
                        value="thread"
                        checked={formData.session_mode === 'thread'}
                        onChange={() => setFormData(prev => ({ ...prev, session_mode: 'thread' }))}
                        disabled={!platformSupportsThread(formData.platform)}
                        className="accent-[var(--td-brand-color)] disabled:opacity-50"
                      />
                      <span className="text-sm">{t('agentEditor.im.sessionModeThread')}</span>
                    </label>
                  </div>
                  <p className="form-hint mt-1.5 text-xs text-[var(--td-text-color-placeholder)] leading-4">
                    {t('agentEditor.im.sessionModeHint')}
                  </p>
                </div>

                {/* Knowledge base */}
                <div className="form-item">
                  <label className="form-label block mb-2 text-sm font-medium text-[var(--td-text-color-primary)]">
                    {t('agentEditor.im.fileKnowledgeBase')}
                  </label>
                  <select
                    value={formData.knowledge_base_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, knowledge_base_id: e.target.value }))}
                    className="w-full px-3 py-2 bg-[var(--td-bg-color-container)] border border-[var(--td-component-stroke)] rounded-lg text-sm focus:outline-none focus:border-[var(--td-brand-color)]"
                  >
                    <option value="">--</option>
                    {knowledgeBases.map((kb) => (
                      <option key={kb.id} value={kb.id}>{kb.name}</option>
                    ))}
                  </select>
                  <p className="form-hint mt-1.5 text-xs text-[var(--td-text-color-placeholder)] leading-4">
                    {t('agentEditor.im.fileKnowledgeBaseHint')}
                  </p>
                </div>

                <div className="form-divider h-px bg-[var(--td-component-stroke)] my-1" />

                {/* Platform-specific credentials would go here - simplified for this example */}
                <div className="form-hint text-xs text-[var(--td-text-color-placeholder)]">
                  Platform-specific credentials configuration would appear here based on selected platform.
                </div>
              </div>
            </div>

            {/* Drawer footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[var(--td-component-stroke)]">
              <button
                onClick={() => { setShowCreateDialog(false); resetForm(); }}
                className="px-4 py-2 text-sm rounded-lg border border-[var(--td-component-stroke)] hover:bg-[var(--td-bg-color-container-hover)]"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 text-sm rounded-lg bg-[var(--td-brand-color)] text-white hover:opacity-90"
              >
                {t('common.save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}