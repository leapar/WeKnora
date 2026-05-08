import type { CmdkCommand } from './types'
import type { NavigateFunction } from 'react-router-dom'

interface CommandContext {
  router: NavigateFunction
  t: (key: string) => string
  close: () => void
}

/**
 * Build the flat command list. Commands are intentionally static — dynamic
 * entities (KBs / agents / sessions) live in their own result groups.
 */
export function buildCommands(ctx: CommandContext): CmdkCommand[] {
  const { router, t, close } = ctx
  return [
    {
      id: 'new-chat',
      label: t('commandPalette.quick.newChat'),
      icon: 'MessageSquarePlus',
      keywords: ['new', 'chat', 'conversation', '新建', '对话', 'создать'],
      run: () => {
        close()
        router('/platform/creatChat')
      },
    },
    {
      id: 'open-kb-list',
      label: t('commandPalette.quick.knowledgeBases'),
      icon: 'Folder',
      keywords: ['kb', 'knowledge', 'base', '知识库', '文档'],
      run: () => {
        close()
        router('/platform/knowledge-bases')
      },
    },
    {
      id: 'open-agents',
      label: t('commandPalette.quick.agents'),
      icon: 'UserCircle',
      keywords: ['agent', 'bot', '智能体', '助手'],
      run: () => {
        close()
        router('/platform/agents')
      },
    },
    {
      id: 'open-organizations',
      label: t('commandPalette.quick.organizations'),
      icon: 'Users',
      keywords: ['org', 'organization', 'team', 'space', '组织', '共享'],
      run: () => {
        close()
        router('/platform/organizations')
      },
    },
    {
      id: 'open-settings',
      label: t('commandPalette.quick.settings'),
      icon: 'Settings',
      keywords: ['settings', 'preferences', 'config', '设置', '配置'],
      run: () => {
        close()
        router('/platform/settings')
      },
    },
  ]
}

/**
 * Filter commands by a free-text query. Matches on label OR any keyword,
 * case-insensitive. Empty query returns the full list unchanged so it can
 * double as a "default" empty-state listing.
 */
export function filterCommands(commands: CmdkCommand[], query: string): CmdkCommand[] {
  const q = (query || '').trim().toLowerCase()
  if (!q) return commands
  return commands.filter((cmd) => {
    if (cmd.label.toLowerCase().includes(q)) return true
    if (cmd.keywords) {
      for (const kw of cmd.keywords) {
        if (kw.toLowerCase().includes(q)) return true
      }
    }
    return false
  })
}