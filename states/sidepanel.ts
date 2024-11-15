import { create } from 'zustand'

interface SelectedPlace {
  placeId: string
  name: string
  lat: number
  lng: number
  address: string
  photosUrl: string[]
  rating: number
  types: string[]
}

interface SidePanelStore {
  showPanel: boolean
  setShowPanel: (showPanel: boolean) => void
  togglePanel: () => void

  selectedPlace: SelectedPlace | null
  setSidePanelPlace: (selectedPlace: SelectedPlace) => void
}

export const useSidePanelStore = create<SidePanelStore>((set) => ({
  showPanel: false,
  setShowPanel: (showPanel) => set({ showPanel }),
  togglePanel: () => set((state) => ({ showPanel: !state.showPanel })),

  selectedPlace: null,
  setSidePanelPlace: (selectedPlace) => set({ selectedPlace })
}))