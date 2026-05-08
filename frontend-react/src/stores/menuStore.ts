import { create } from 'zustand'

interface MenuChild {
  id: string
  title: string
  icon?: string
  path: string
  children?: MenuChild[]
}

interface MenuItem {
  title: string
  titleKey?: string
  icon?: string
  path: string
  childrenPath?: string
  children?: MenuChild[]
}

interface MenuState {
  menuArr: MenuItem[]
  isFirstSession: boolean
  firstQuery: string
  prefillQuery: string

  visibleMenuArr: () => MenuItem[]
  updatemenuArr: (obj: MenuChild) => void
  updatesessionTitle: (id: string, title: string) => void
  updateprefillQuery: (query: string) => void
  clearMenuArr: () => void
  setFirstSession: (value: boolean) => void
}

const liteHiddenPaths = new Set(['logout', 'organizations'])

export const useMenuStore = create<MenuState>((set, get) => ({
  menuArr: [
    { title: '', titleKey: 'menu.knowledgeBase', icon: 'zhishiku', path: 'knowledge-bases' },
    { title: '', titleKey: 'menu.agents', icon: 'agent', path: 'agents' },
    { title: '', titleKey: 'menu.organizations', icon: 'organization', path: 'organizations' },
    { title: '', titleKey: 'menu.chat', icon: 'prefixIcon', path: 'creatChat', childrenPath: 'chat', children: [] },
    { title: '', titleKey: 'menu.settings', icon: 'setting', path: 'settings' },
    { title: '', titleKey: 'menu.logout', icon: 'logout', path: 'logout' },
  ],

  isFirstSession: true,
  firstQuery: '',
  prefillQuery: '',

  visibleMenuArr: () => {
    const state = get()
    const isLiteMode = localStorage.getItem('weknora_lite_mode') === 'true'
    if (isLiteMode) {
      return state.menuArr.filter((item) => !liteHiddenPaths.has(item.path))
    }
    return state.menuArr
  },

  updatemenuArr: (obj) => {
    set((state) => {
      const chatMenu = state.menuArr.find((m) => m.path === 'creatChat')
      if (!chatMenu) return state
      if (!chatMenu.children) chatMenu.children = []

      const exists = chatMenu.children.some((item) => item.id === obj.id)
      if (!exists) {
        chatMenu.children = [...chatMenu.children, obj]
      }
      return { menuArr: [...state.menuArr] }
    })
  },

  updatesessionTitle: (id, title) => {
    set((state) => {
      const chatMenu = state.menuArr.find((m) => m.path === 'creatChat')
      if (!chatMenu?.children) return state

      chatMenu.children = chatMenu.children.map((item) =>
        item.id === id ? { ...item, title } : item
      )
      return { menuArr: [...state.menuArr] }
    })
  },

  updateprefillQuery: (query) => {
    set({ prefillQuery: query })
  },

  clearMenuArr: () => {
    set((state) => {
      const chatMenu = state.menuArr.find((m) => m.path === 'creatChat')
      if (chatMenu) chatMenu.children = []
      return { menuArr: [...state.menuArr] }
    })
  },

  setFirstSession: (value) => {
    set({ isFirstSession: value })
  },
}))
