import { create } from 'zustand'

const RECENT_KEY = 'weknora_cmdk_recent'
const RECENT_LIMIT = 4

interface CommandPaletteState {
  open: boolean
  initialQuery: string
  recentQueries: string[]

  openPalette: (query?: string) => void
  closePalette: () => void
  pushRecent: (q: string) => void
  clearRecent: () => void
  loadRecent: () => void
}

export const useCommandPaletteStore = create<CommandPaletteState>((set, get) => ({
  open: false,
  initialQuery: '',
  recentQueries: [],

  openPalette: (query = '') => {
    set({ open: true, initialQuery: query })
  },

  closePalette: () => {
    set({ open: false, initialQuery: '' })
  },

  pushRecent: (q: string) => {
    const trimmed = q.trim()
    if (!trimmed) return
    const recentQueries = [
      trimmed,
      ...get().recentQueries.filter((x) => x !== trimmed),
    ].slice(0, RECENT_LIMIT)
    set({ recentQueries })
    try {
      localStorage.setItem(RECENT_KEY, JSON.stringify(recentQueries))
    } catch {
      /* ignore quota errors */
    }
  },

  clearRecent: () => {
    set({ recentQueries: [] })
    try {
      localStorage.removeItem(RECENT_KEY)
    } catch {
      /* ignore */
    }
  },

  loadRecent: () => {
    try {
      const raw = localStorage.getItem(RECENT_KEY)
      set({ recentQueries: raw ? JSON.parse(raw) : [] })
    } catch {
      set({ recentQueries: [] })
    }
  },
}))

// Load recent queries on module initialization
useCommandPaletteStore.getState().loadRecent()