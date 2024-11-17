import { create } from 'zustand'

interface SelectedPlace {
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

  selectedPlace: SelectedPlace | null
  setSidePanelPlace: (selectedPlace: SelectedPlace | null) => void
}

export const useSidePanelStore = create<SidePanelStore>((set) => ({
  showPanel: false,
  setShowPanel: (showPanel) => set({ showPanel }),

  selectedPlace: null,
  setSidePanelPlace: (selectedPlace) => set({ selectedPlace })
}))