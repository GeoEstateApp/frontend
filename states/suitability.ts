import { create } from 'zustand'

export interface RecommendationPlace {
  address: string
  lat: number
  lng: number
}

export interface Prefs {
  minBeds: number,
  minBaths: number,
  rentOrBuy: 'buy' | 'rent',
  priceMin: number,
  priceMax: number,
  age: number | null,
  homeValuePriority: boolean,
  filterByMedianAge: boolean,
  anchorAddresses: number[][],
  propsToReturn: number
}

export interface RecommendationProperties {
  property_id: number,
  address_line: string,
  coordinate_lat: number,
  coordinate_lon: number,
  size_sqft: number,
  property_type: string,
  price: string,
  status: string,
  zip_code_id: number,
  num_beds: number,
  num_baths: number,
  prop_url: string,
  img_url: string,
  geom: string
}

interface Suitability {
  isModalOpen: boolean
  setIsModalOpen: (isOpen: boolean) => void

  // Navigation
  currentPage: number
  setCurrentPage: (page: number) => void

  // Loading states
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
  isLoadingMore: boolean
  setIsLoadingMore: (loading: boolean) => void
  error: string | null
  setError: (error: string | null) => void
  
  // Pagination
  page: number
  setPage: (page: number) => void
  hasMore: boolean
  setHasMore: (hasMore: boolean) => void
  isRefreshing: boolean
  setIsRefreshing: (refreshing: boolean) => void

  // Properties
  recommendationProperties: RecommendationProperties[]
  setRecommendationProperties: (properties: RecommendationProperties[]) => void

  // Page One
  rentOrBuy: "rent" | "buy" | null
  setRentOrBuy: (value: "rent" | "buy" | null) => void

  // Page Two
  noOfBathrooms: number
  setNoOfBathrooms: (value: number) => void
  noOfBedrooms: number
  setNoOfBedrooms: (value: number) => void

  // Page Three
  minPrice: number
  setMinPrice: (value: number) => void
  maxPrice: number
  setMaxPrice: (value: number) => void

  // Page Four
  wantPropertyRecommendationAge: boolean | null
  setWantPropertyRecommendationAge: (value: boolean | null) => void
  propertyRecommendationAge: number | string
  setPropertyRecommendationAge: (value: number | string) => void

  // Page Five
  wantAnyRecommendedPlaces: boolean | null
  setWantAnyRecommendedPlaces: (value: boolean | null) => void
  recommendedPlaces: RecommendationPlace[]
  setRecommendedPlaces: (places: RecommendationPlace[]) => void
  searchText: string
  setSearchText: (text: string) => void

  // Reset
  resetStore: () => void
}

const initialState = {
  currentPage: 0,
  isLoading: false,
  isLoadingMore: false,
  error: null,
  page: 1,
  hasMore: true,
  isRefreshing: false,
  recommendationProperties: [],
  rentOrBuy: null,
  noOfBathrooms: 0,
  noOfBedrooms: 0,
  minPrice: 10000,
  maxPrice: 9999999,
  wantPropertyRecommendationAge: null,
  propertyRecommendationAge: '',
  wantAnyRecommendedPlaces: null,
  recommendedPlaces: [],
  searchText: '',
}

export const useSuitability = create<Suitability>((set) => ({
  isModalOpen: false,
  setIsModalOpen: (isOpen) => set({ isModalOpen: isOpen }),

  ...initialState,

  setCurrentPage: (page) => set({ currentPage: page }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setIsLoadingMore: (loading) => set({ isLoadingMore: loading }),
  setError: (error) => set({ error }),
  setPage: (page) => set({ page }),
  setHasMore: (hasMore) => set({ hasMore }),
  setIsRefreshing: (refreshing) => set({ isRefreshing: refreshing }),
  setRecommendationProperties: (properties) => set({ recommendationProperties: properties }),
  setRentOrBuy: (value) => set({ rentOrBuy: value }),
  setNoOfBathrooms: (value) => set({ noOfBathrooms: value }),
  setNoOfBedrooms: (value) => set({ noOfBedrooms: value }),
  setMinPrice: (value) => set({ minPrice: value }),
  setMaxPrice: (value) => set({ maxPrice: value }),
  setWantPropertyRecommendationAge: (value) => set({ wantPropertyRecommendationAge: value }),
  setPropertyRecommendationAge: (value) => set({ propertyRecommendationAge: value }),
  setWantAnyRecommendedPlaces: (value) => set({ wantAnyRecommendedPlaces: value }),
  setRecommendedPlaces: (places) => set({ recommendedPlaces: places }),
  setSearchText: (text) => set({ searchText: text }),

  resetStore: () => set(initialState)
}))