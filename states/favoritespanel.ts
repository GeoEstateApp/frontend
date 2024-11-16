import { create } from 'zustand'

interface FavoritesPanelStore {
  showPanel: boolean
  togglePanel: () => void
  setShowPanel: (show: boolean) => void
}

export const useFavoritesPanelStore = create<FavoritesPanelStore>((set) => ({
  showPanel: false,
  togglePanel: () => set((state) => ({ showPanel: !state.showPanel })),
  setShowPanel: (show) => set({ showPanel: show })
}))
