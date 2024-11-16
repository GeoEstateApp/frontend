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
  selectedPlace: any
  togglePanel: () => void
  setShowPanel: (show: boolean) => void
  setSelectedPlace: (place: any) => void
}

export const useSidePanelStore = create<SidePanelStore>((set) => ({
  showPanel: false,
  selectedPlace: null,
  togglePanel: () => set((state) => ({ showPanel: !state.showPanel })),
  setShowPanel: (show) => set({ showPanel: show }),
  setSelectedPlace: (place) => set({ selectedPlace: place })
}))