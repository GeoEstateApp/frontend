import { create } from 'zustand'

interface BucketListPanelState {
  showPanel: boolean
  setShowPanel: (show: boolean) => void
}

export const useBucketListPanelStore = create<BucketListPanelState>((set) => ({
  showPanel: false,
  setShowPanel: (show) => set({ showPanel: show }),
}))
