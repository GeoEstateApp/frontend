import { PolygonCoordinates } from '@/api/osm'
import { create } from 'zustand'

interface ZipcodeInsights {
  zipcode: string
  zipcodes: ZipcodeData[],
  polygon: PolygonCoordinates[] | null
  polygons: PolygonCoordinates[][] | null

  setZipcode: (zipcode: string) => void
  setZipcodes: (zipcodes: ZipcodeData[]) => void
  setPolygon: (polygon: PolygonCoordinates[] | null) => void
  setPolygons: (polygons: PolygonCoordinates[][] | null) => void

  zipcodeInsights: ZipcodeInsight
  setZipcodeInsights: (zipcodeInsights: ZipcodeInsight) => void
}

export interface ZipcodeInsight {
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

export interface ZipcodeData {
  zipcode: string
  name: string
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
  zipcodes: [],
  polygon: [],
  polygons: [],

  setZipcode: (zipcode: string) => set({ zipcode }),
  setZipcodes: (zipcodes: ZipcodeData[]) => set({ zipcodes }),  
  setPolygon: (polygon: PolygonCoordinates[] | null) => set({ polygon }),
  setPolygons: (polygons: PolygonCoordinates[][] | null) => set({ polygons }),

  zipcodeInsights: {} as ZipcodeInsight,
  setZipcodeInsights: (zipcodeInsights: ZipcodeInsight) => set({ zipcodeInsights }),
}))