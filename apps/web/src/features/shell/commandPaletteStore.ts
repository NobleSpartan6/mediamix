import { create } from 'zustand'

interface PaletteState {
  open: boolean
  setOpen: (open: boolean) => void
}

export const useCommandPaletteStore = create<PaletteState>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
}))
