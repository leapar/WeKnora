import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useUIStore } from '@/stores/uiStore'
import { useMenuStore } from '@/stores/menuStore'
import { cn } from '@/lib/utils'
import {
  BookOpen,
  Bot,
  Building2,
  MessageCircle,
  Settings,
  LogOut,
  ChevronRight,
  Menu as MenuIcon,
} from 'lucide-react'

const iconMap: Record<string, React.ReactNode> = {
  zhishiku: <BookOpen size={20} />,
  agent: <Bot size={20} />,
  organization: <Building2 size={20} />,
  prefixIcon: <MessageCircle size={20} />,
  setting: <Settings size={20} />,
  logout: <LogOut size={20} />,
}

export function Menu() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isLiteMode, logout } = useAuthStore()
  const { sidebarCollapsed, toggleSidebar, openSettings } = useUIStore()
  const { visibleMenuArr } = useMenuStore()
  const [chatListOpen, setChatListOpen] = useState(true)

  const menuArr = visibleMenuArr()

  const handleMenuClick = (path: string) => {
    if (path === 'logout') {
      logout()
      navigate('/login')
      return
    }

    if (path === 'settings') {
      openSettings()
      return
    }

    if (path === 'creatChat') {
      setChatListOpen(!chatListOpen)
      return
    }

    navigate(`/platform/${path}`)
  }

  const isActive = (path: string) => {
    if (path === 'creatChat') {
      return location.pathname.includes('/chat/')
    }
    return location.pathname.includes(`/platform/${path}`)
  }

  const handleChatSessionClick = (sessionId: string) => {
    navigate(`/platform/chat/${sessionId}`)
  }

  const getActiveIcon = (item: typeof menuArr[0]) => {
    if (item.icon && iconMap[item.icon]) {
      return iconMap[item.icon]
    }
    return <BookOpen size={20} />
  }

  return (
    <div
      className={cn(
        'fixed left-0 top-0 h-screen bg-[var(--td-bg-color-sidebar)] border-r border-[var(--td-border-level-1-color)] transition-all z-40',
        sidebarCollapsed ? 'w-[60px]' : 'w-[260px]'
      )}
    >
      {/* Header */}
      <div className="flex items-center h-[60px] px-4 border-b border-[var(--td-border-level-1-color)]">
        {!sidebarCollapsed && (
          <span className="text-lg font-semibold text-[var(--td-text-color-primary)]">WeKnora</span>
        )}
        <button
          onClick={toggleSidebar}
          className={cn(
            'p-2 rounded hover:bg-[var(--td-bg-color-component)] transition-colors',
            sidebarCollapsed && 'mx-auto'
          )}
        >
          <MenuIcon size={20} />
        </button>
      </div>

      {/* Menu Items */}
      <div className="py-4">
        {menuArr.map((item) => (
          <div key={item.path}>
            <div
              onClick={() => handleMenuClick(item.path)}
              className={cn(
                'flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors',
                isActive(item.path)
                  ? 'bg-[var(--td-brand-color-light)] text-[var(--td-brand-color)]'
                  : 'text-[var(--td-text-color-secondary)] hover:bg-[var(--td-bg-color-container-hover)]',
                sidebarCollapsed && 'justify-center px-2'
              )}
            >
              <span className="flex-shrink-0">{getActiveIcon(item)}</span>
              {!sidebarCollapsed && (
                <>
                  <span className="flex-1 text-sm font-medium">{item.titleKey ? item.titleKey : item.title}</span>
                  {item.path === 'creatChat' && (
                    <ChevronRight
                      size={16}
                      className={cn('transition-transform', chatListOpen && 'rotate-90')}
                    />
                  )}
                </>
              )}
            </div>

            {/* Chat Sessions */}
            {!sidebarCollapsed && item.path === 'creatChat' && chatListOpen && item.children && item.children.length > 0 && (
              <div className="ml-4 border-l border-[var(--td-border-level-1-color)] pl-4">
                {item.children.map((chat) => (
                  <div
                    key={chat.id}
                    onClick={() => handleChatSessionClick(chat.id)}
                    className={cn(
                      'py-2 px-3 text-sm cursor-pointer rounded transition-colors',
                      location.pathname === `/platform/chat/${chat.id}`
                        ? 'bg-[var(--td-brand-color-light)] text-[var(--td-brand-color)]'
                        : 'text-[var(--td-text-color-secondary)] hover:bg-[var(--td-bg-color-container-hover)]'
                    )}
                  >
                    {chat.title}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* User Info (collapsed) */}
      {!sidebarCollapsed && (
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-[var(--td-border-level-1-color)]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[var(--td-brand-color)] flex items-center justify-center text-white text-sm">
              {useAuthStore.getState().user?.username?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-[var(--td-text-color-primary)] truncate">
                {useAuthStore.getState().user?.username || 'User'}
              </div>
              {!isLiteMode && (
                <div className="text-xs text-[var(--td-text-color-secondary)] truncate">
                  {useAuthStore.getState().tenant?.name || 'Tenant'}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
