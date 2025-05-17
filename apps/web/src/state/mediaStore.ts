import { create } from 'zustand'

export interface MediaAsset {
  id: string
  url: string
  fileName?: string
  duration?: number
  waveform?: number[]
}

interface MediaState {
  assets: Record<string, MediaAsset>
  addAsset: (asset: MediaAsset) => void
  updateAsset: (id: string, delta: Partial<MediaAsset>) => void
  removeAsset: (id: string) => void
}

export const useMediaStore = create<MediaState>((set) => ({
  assets: {},
  addAsset: (asset) =>
    set((state) => ({ assets: { ...state.assets, [asset.id]: asset } })),
  updateAsset: (id, delta) =>
    set((state) => {
      const current = state.assets[id]
      if (!current) return {}
      return { assets: { ...state.assets, [id]: { ...current, ...delta } } }
    }),
  removeAsset: (id) =>
    set((state) => {
      const { [id]: _removed, ...rest } = state.assets
      return { assets: rest }
    }),
}))

export const selectMediaArray = (state: MediaState): MediaAsset[] =>
  Object.values(state.assets)
