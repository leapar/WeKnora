import { create } from 'zustand'

interface ManualEditorSuccessPayload {
  kbId: string
  knowledgeId: string
  status: 'draft' | 'publish'
}

interface UIState {
  showSettingsModal: boolean
  showKBEditorModal: boolean
  kbEditorMode: 'create' | 'edit'
  currentKBId: string | null
  manualEditorVisible: boolean
  manualEditorMode: 'create' | 'edit'
  manualEditorKnowledgeId: string | null
  manualEditorKBId: string | null
  manualEditorInitialTitle: string
  manualEditorInitialContent: string
  manualEditorInitialStatus: 'draft' | 'publish'
  selectedTagId: string | null
  sidebarCollapsed: boolean
  showCommandPalette: boolean
  uploadMaskVisible: boolean

  openSettings: () => void
  closeSettings: () => void
  openKBSettings: (kbId?: string) => void
  closeKBSettings: () => void
  openManualEditor: (mode?: 'create' | 'edit', knowledgeId?: string, kbId?: string, initialTitle?: string, initialContent?: string, initialStatus?: 'draft' | 'publish') => void
  closeManualEditor: () => void
  setSelectedTagId: (tagId: string | null) => void
  notifyManualEditorSuccess: (payload: ManualEditorSuccessPayload) => void
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  toggleCommandPalette: () => void
  setUploadMaskVisible: (visible: boolean) => void
}

export const useUIStore = create<UIState>((set) => ({
  showSettingsModal: false,
  showKBEditorModal: false,
  kbEditorMode: 'create',
  currentKBId: null,
  manualEditorVisible: false,
  manualEditorMode: 'create',
  manualEditorKnowledgeId: null,
  manualEditorKBId: null,
  manualEditorInitialTitle: '',
  manualEditorInitialContent: '',
  manualEditorInitialStatus: 'draft',
  selectedTagId: null,
  sidebarCollapsed: false,
  showCommandPalette: false,
  uploadMaskVisible: false,

  openSettings: () => set({ showSettingsModal: true }),

  closeSettings: () => set({ showSettingsModal: false }),

  openKBSettings: (kbId) => set({
    showKBEditorModal: true,
    kbEditorMode: kbId ? 'edit' : 'create',
    currentKBId: kbId || null,
  }),

  closeKBSettings: () => set({
    showKBEditorModal: false,
    currentKBId: null,
  }),

  openManualEditor: (mode = 'create', knowledgeId, kbId, initialTitle = '', initialContent = '', initialStatus = 'draft') => set({
    manualEditorVisible: true,
    manualEditorMode: mode,
    manualEditorKnowledgeId: knowledgeId || null,
    manualEditorKBId: kbId || null,
    manualEditorInitialTitle: initialTitle,
    manualEditorInitialContent: initialContent,
    manualEditorInitialStatus: initialStatus,
  }),

  closeManualEditor: () => set({
    manualEditorVisible: false,
    manualEditorKnowledgeId: null,
    manualEditorInitialTitle: '',
    manualEditorInitialContent: '',
  }),

  setSelectedTagId: (tagId) => set({ selectedTagId: tagId }),

  notifyManualEditorSuccess: (_payload: ManualEditorSuccessPayload) => {
    // This can be extended to trigger refresh or notifications
  },

  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

  toggleCommandPalette: () => set((state) => ({ showCommandPalette: !state.showCommandPalette })),

  setUploadMaskVisible: (visible) => set({ uploadMaskVisible: visible }),
}))
