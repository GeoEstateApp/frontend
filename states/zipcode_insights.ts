import { PolygonCoordinates } from '@/api/osm'
import { create } from 'zustand'

interface ZipcodeInsights {
  zipcode: string
  polygon: PolygonCoordinates[]
  polygons: PolygonCoordinates[][]

  setZipcode: (zipcode: string) => void
  setPolygon: (polygon: PolygonCoordinates[]) => void
  setPolygons: (polygons: PolygonCoordinates[][]) => void

  zipcodeInsights: ZipcodeInsights
  setZipcodeInsights: (zipcodeInsights: ZipcodeInsights) => void
}

interface ZipcodeInsights {
  state: string,
  city: string,
  county: string,
  population: number,
  medianAge: number,
  medianAgeMale: number,
  medianAgeFemale: number,
  malePop: number,
  femalePop: number,
  vacanciesForRentPercent: number,
  vacanciesForSalePercent: number,
  homeValueForecast: number
}

export const useZipcodeInsights = create<ZipcodeInsights>((set) => ({
  state: '',
  city: '',
  county: '',
  population: 0,
  medianAge: 0,
  medianAgeMale: 0,
  medianAgeFemale: 0,
  malePop: 0,
  femalePop: 0,
  vacanciesForRentPercent: 0,
  vacanciesForSalePercent: 0,
  homeValueForecast: 0,

  zipcode: '',
  polygon: [],
  polygons: [],

  setZipcode: (zipcode: string) => set({ zipcode }),
  setPolygon: (polygon: PolygonCoordinates[]) => set({ polygon }),
  setPolygons: (polygons: PolygonCoordinates[][]) => set({ polygons }),

  zipcodeInsights: {} as ZipcodeInsights,
  setZipcodeInsights: (zipcodeInsights: ZipcodeInsights) => set({ zipcodeInsights }),
}))