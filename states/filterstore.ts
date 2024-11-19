import { create } from 'zustand'

interface FilterStore {
  selectedFilters: string[];
  setSelectedFilters: (filters: string[]) => void;
}

export const useFilterStore = create<FilterStore>((set) => ({
  selectedFilters: [],
  setSelectedFilters: (filters) => set({ selectedFilters: filters }),
}))