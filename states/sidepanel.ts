import { create } from 'zustand'
import { RecommendationProperties } from './suitability'

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

export interface RealEstateProperty {
  property_id: number,
  address_line: string,
  coordinate_lat: number,
  coordinate_lon: number,
  size_sqft: number,
  property_type: string,
  price: string,
  status: string,
  num_beds: number,
  num_baths: number,
  prop_url: string,
  img_url: string,
  zip_code: number,
  city: string,
  state: string,
  county: string,
  population: number,
  median_age: number,
  median_age_male: number,
  median_age_female: number,
  male_pop: number,
  female_pop: number,
  vacancies_for_rent_percent: number,
  vacancies_for_sale_percent: number,
  home_value_forecast: number,
}

interface SidePanelStore {
  showPanel: boolean
  setShowPanel: (showPanel: boolean) => void
  toggleShowPanel: () => void

  selectedPlace: SelectedPlace | null
  setSidePanelPlace: (selectedPlace: SelectedPlace | null) => void

  realEstateProperties: RealEstateProperty[] | null,
  setRealEstateProperties: (properties: RealEstateProperty[] | null) => void

  selectedRealEstateProperty: RealEstateProperty | null | RecommendationProperties
  setSelectedRealEstateProperty: (properties: RealEstateProperty | null | RecommendationProperties) => void

  reset: () => void
}

export const useSidePanelStore = create<SidePanelStore>((set) => ({
  showPanel: false,
  setShowPanel: (showPanel) => set({ showPanel }),
  toggleShowPanel: () => set((state) => ({ showPanel: !state.showPanel })),

  selectedPlace: null,
  setSidePanelPlace: (selectedPlace) => set({ selectedPlace }),

  realEstateProperties: null,
  setRealEstateProperties: (realEstateProperties) => set({ realEstateProperties }),
  selectedRealEstateProperty: null,
  setSelectedRealEstateProperty: (selectedRealEstateProperty) => set({ selectedRealEstateProperty }),
  
  reset: () => set({
    showPanel: false,
    selectedPlace: null,
    realEstateProperties: null,
    selectedRealEstateProperty: null
  })
}))