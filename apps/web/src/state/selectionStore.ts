import { create } from 'zustand'

export type Selection =
  | { type: 'clip'; id: string }
  | { type: 'asset'; id: string }
  | null

interface SelectionState {
  currentSelection: Selection
  setSelection: (s: Selection) => void
}

export const useSelectionStore = create<SelectionState>((set) => ({
  currentSelection: null,
  setSelection: (s) => set({ currentSelection: s }),
}))
