import { create } from 'zustand'

interface MapStore {
  selectedPlace: google.maps.places.PlaceResult | null;
  setSelectedPlace: (place: google.maps.places.PlaceResult | null) => void;
}

export const useMapStore = create<MapStore>((set) => ({
  selectedPlace: null,
  setSelectedPlace: (place) => set({ selectedPlace: place }),
}))