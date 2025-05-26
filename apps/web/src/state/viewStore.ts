import { create } from 'zustand'

interface ViewState {
  timelineZoom: number
  setTimelineZoom: (z: number) => void
}

export const useViewStore = create<ViewState>((set) => ({
  timelineZoom: 100,
  setTimelineZoom: (z) => set({ timelineZoom: z }),
}))
