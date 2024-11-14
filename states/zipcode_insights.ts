import { PolygonCoordinates } from '@/api/osm'
import { create } from 'zustand'

interface ZipcodeInsights {
  zipcode: string,
  polygon: PolygonCoordinates[]

  setZipcode: (zipcode: string) => void
  setPolygon: (polygon: PolygonCoordinates[]) => void
}

export const useZipcodeInsights = create<ZipcodeInsights>((set) => ({
  zipcode: '',
  polygon: [],

  setZipcode: (zipcode: string) => set({ zipcode }),
  setPolygon: (polygon: PolygonCoordinates[]) => set({ polygon }),
}))