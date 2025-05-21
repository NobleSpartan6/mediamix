import { create } from 'zustand'

import { nanoid } from '../utils/nanoid'

import { generateId } from '../utils/id'
import { processMediaAsset } from '../lib/media-utils'


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
  /** Original file object, to be used by the worker, not stored long-term in state. */
  file?: File
}

interface MediaState {
  assets: Record<string, MediaAsset>
  addAsset: (asset: Omit<MediaAsset, 'id'> & { id?: string; file?: File }) => string
  updateAsset: (id: string, delta: Partial<Omit<MediaAsset, 'id'>>) => void
  removeAsset: (id: string) => void
}

export const useMediaStore = create<MediaState>((set) => ({
  assets: {},

  /**
   * Add a new media asset and return its generated id.
   * Also triggers background processing for waveform/thumbnail if a file is provided.
   */
  addAsset: (assetInput) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: providedId, file, ...rest } = assetInput as Omit<MediaAsset, 'id'> & { id?: string; file?: File }
    const id = providedId ?? generateId()
    // Store asset metadata (excluding the file object itself from the state)
    set((state) => ({ assets: { ...state.assets, [id]: { id, fileName: rest.fileName, duration: rest.duration } } }))

    if (file) {
      processMediaAsset(id, file)
    }
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

