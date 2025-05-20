import { create } from 'zustand'

import { nanoid } from '../utils/nanoid'

import { generateId } from '../utils/id'


export interface MediaAsset {
  id: string
  fileName: string
  /** seconds */
  duration: number
  /** optional precomputed waveform peaks */
  waveform?: number[]
  /** optional thumbnail image as data URL */
  thumbnail?: string
  /** optional URL to a lower-resolution proxy video */
  proxyUrl?: string
}

interface MediaState {
  assets: Record<string, MediaAsset>
  addAsset: (asset: Omit<MediaAsset, 'id'> & { id?: string }) => string
  updateAsset: (id: string, delta: Partial<Omit<MediaAsset, 'id'>>) => void
  removeAsset: (id: string) => void
}

export const useMediaStore = create<MediaState>((set) => ({
  assets: {},

  /**
   * Add a new media asset and return its generated id.
   */
  addAsset: (assetInput) => {
    const { id: providedId, ...rest } = assetInput as any
    const id = providedId ?? generateId()
    set((state) => ({ assets: { ...state.assets, [id]: { id, ...rest } } }))
    return id
  },

  /** Update existing asset metadata */
  updateAsset: (id, delta) =>
    set((state) => {
      const asset = state.assets[id]
      if (!asset) return {}
      return { assets: { ...state.assets, [id]: { ...asset, ...delta } } }
    }),

  /** Remove an asset by id */
  removeAsset: (id) =>
    set((state) => {
      const { [id]: _removed, ...rest } = state.assets
      return { assets: rest }
    }),
}))

/** Retrieve assets as an array */
export const selectMediaArray = (state: MediaState): MediaAsset[] =>
  Object.values(state.assets)

