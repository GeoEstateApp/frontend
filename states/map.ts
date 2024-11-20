import { PolygonCoordinates } from '@/api/osm';
import { create } from 'zustand'

interface MapStore {
  selectedPlace: google.maps.places.PlaceResult | null;
  setSelectedPlace: (place: google.maps.places.PlaceResult | null) => void;

  selectedPlacePolygonCoordinates: PolygonCoordinates[];
  setSelectedPlacePolygonCoordinates: (polygon: PolygonCoordinates[]) => void;

  goToPlace: number,
  setGoToPlace: (place: number) => void;
}

export const useMapStore = create<MapStore>((set) => ({
  selectedPlace: null,
  setSelectedPlace: (place) => set({ selectedPlace: place }),

  selectedPlacePolygonCoordinates: [],
  setSelectedPlacePolygonCoordinates: (polygon) => set({ selectedPlacePolygonCoordinates: polygon }),

  goToPlace: 0,
  setGoToPlace: (place) => set({ goToPlace: place })
}))