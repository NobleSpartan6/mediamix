import { create } from 'zustand'
import { nanoid } from 'nanoid'

export interface MediaAsset {
  id: string
  fileName: string
  /** seconds */
  duration: number
  /** optional precomputed waveform peaks */
  waveform?: number[]
}

interface MediaState {
  assets: Record<string, MediaAsset>
  addAsset: (asset: Omit<MediaAsset, 'id'>) => string
  updateAsset: (id: string, delta: Partial<Omit<MediaAsset, 'id'>>) => void
  removeAsset: (id: string) => void
}

export const useMediaStore = create<MediaState>((set) => ({
  assets: {},

  addAsset: (assetInput) => {
    const id = nanoid()
    set((state) => ({ assets: { ...state.assets, [id]: { id, ...assetInput } } }))
    return id
  },

  updateAsset: (id, delta) =>
    set((state) => {
      const asset = state.assets[id]
      if (!asset) return {}
      return { assets: { ...state.assets, [id]: { ...asset, ...delta } } }
    }),

  removeAsset: (id) =>
    set((state) => {
      const { [id]: _removed, ...rest } = state.assets
      return { assets: rest }
    }),
}))

export const selectMediaArray = (state: MediaState): MediaAsset[] =>
  Object.values(state.assets)
