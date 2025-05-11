import { create } from 'zustand'
import { nanoid } from 'nanoid'

export interface Clip {
  id: string
  /** seconds from timeline origin */
  start: number
  /** seconds – exclusive end */
  end: number
  /** zero-based vertical lane index (0 = first video track) */
  lane: number
}

export interface TimelineState {
  /** Normalised dictionary of clips */
  clipsById: Record<string, Clip>
  /** Project duration in seconds (ceil of max clip end) */
  durationSec: number
  /** Replace all clips (normalised input) */
  setClips: (clips: Clip[]) => void
  addClip: (clip: Omit<Clip, 'id'>) => string
  updateClip: (id: string, delta: Partial<Omit<Clip, 'id'>>) => void
  /** array of beat timestamps in seconds (monotonically increasing) */
  beats: number[]
  setBeats: (beats: number[]) => void
}

const toDict = (arr: Clip[]) => Object.fromEntries(arr.map((c) => [c.id, c]))

export const useTimelineStore = create<TimelineState>((set) => ({
  clipsById: {},
  durationSec: 0,
  beats: [],

  // Replace entire clip collection
  setClips: (clips) =>
    set(() => ({
      clipsById: toDict(clips),
      durationSec: clips.reduce((m, c) => Math.max(m, c.end), 0),
    })),

  setBeats: (beats) => set({ beats }),

  addClip: (clipInput) => {
    const id = nanoid()
    const newClip: Clip = { id, ...clipInput }
    set((state) => {
      const clipsById = { ...state.clipsById, [id]: newClip }
      const durationSec = Math.max(state.durationSec, newClip.end)
      return { clipsById, durationSec }
    })
    return id
  },

  updateClip: (id, delta) =>
    set((state) => {
      const existing = state.clipsById[id]
      if (!existing) return {}
      const updated: Clip = { ...existing, ...delta }
      const clipsById = { ...state.clipsById, [id]: updated }
      const durationSec = Math.max(
        ...Object.values(clipsById).map((c) => c.end),
      )
      return { clipsById, durationSec }
    }),
}))

// ---- Selectors -----------------------------------------------------------

export const selectClipsArray = (state: TimelineState): Clip[] =>
  Object.values(state.clipsById) 