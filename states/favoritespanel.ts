import { create } from 'zustand'

interface FavoritesPanelStore {
  showFavPanel: boolean
  toggleFavPanel: () => void
  setShowFavPanel: (show: boolean) => void
}

export const useFavoritesPanelStore = create<FavoritesPanelStore>((set) => ({
  showFavPanel: false,
  toggleFavPanel: () => set((state) => ({ showFavPanel: !state.showFavPanel })),
  setShowFavPanel: (show) => set({ showFavPanel: show })
}))
