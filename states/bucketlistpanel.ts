import { create } from 'zustand'

interface BucketListPanelState {
  showBucketListPanel: boolean
  setShowBucketListPanel: (show: boolean) => void
  toggleBucketListPanel: () => void
}

export const useBucketListPanelStore = create<BucketListPanelState>((set) => ({
  showBucketListPanel: false,
  setShowBucketListPanel: (show) => set({ showBucketListPanel: show }),
  toggleBucketListPanel: () => set((state) => ({ showBucketListPanel: !state.showBucketListPanel })),
}))
