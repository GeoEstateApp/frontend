import { create } from 'zustand'

interface Suitability {
  isModalOpen: boolean
  setIsModalOpen: (isOpen: boolean) => void
}

export const useSuitability = create<Suitability>((set) => ({
  isModalOpen: false,
  setIsModalOpen: (isOpen) => set({ isModalOpen: isOpen }),
}))