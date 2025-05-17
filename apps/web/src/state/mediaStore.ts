import { create } from 'zustand'

export interface MediaAsset {
  id: string
  url: string
  duration?: number
}

interface MediaState {
  assets: Record<string, MediaAsset>
  addAsset: (asset: MediaAsset) => void
}

export const useMediaStore = create<MediaState>((set) => ({
  assets: {},
  addAsset: (asset) =>
    set((state) => ({ assets: { ...state.assets, [asset.id]: asset } })),
}))

export const selectMediaArray = (state: MediaState): MediaAsset[] =>
  Object.values(state.assets)
