import { PlaceInsight } from '@/api/insights';
import { create } from 'zustand'

interface InsightsStore {
  insights: PlaceInsight[] | null
  setInsights: (polygons: PlaceInsight[] | null) => void
  clearInsights: () => void
}

export const useInsightsStore = create<InsightsStore>((set) => ({
  insights: null,
  setInsights: (insights) => set({ insights }),
  clearInsights: () => set({ insights: null })
}))