import { Outlet } from 'react-router-dom'
import { Menu } from '@/components/Menu'
import { GlobalCommandPalette } from '@/components/GlobalCommandPalette'
import { useUIStore } from '@/stores/uiStore'

export function PlatformLayout() {
  const { sidebarCollapsed } = useUIStore()

  return (
    <div className="main flex h-screen w-full">
      <Menu />
      <GlobalCommandPalette />
      <div
        className={`platform-route-outlet flex-1 overflow-auto transition-all ${
          sidebarCollapsed ? 'ml-[60px]' : 'ml-[260px]'
        }`}
      >
        <Outlet />
      </div>
    </div>
  )
}
