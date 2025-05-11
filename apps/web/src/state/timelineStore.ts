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
  clips: Clip[]
  /** Replace the entire clip array */
  setClips: (clips: Clip[]) => void
  /** Append a new clip */
  addClip: (clip: Omit<Clip, 'id'>) => string
  /** Partial update of an existing clip */
  updateClip: (id: string, delta: Partial<Omit<Clip, 'id'>>) => void
  /** array of beat timestamps in seconds (monotonically increasing) */
  beats: number[]
  /** Replace beats array */
  setBeats: (beats: number[]) => void
}

export const useTimelineStore = create<TimelineState>((set) => ({
  clips: [],
  beats: [],

  setClips: (clips) => set({ clips }),

  setBeats: (beats) => set({ beats }),

  addClip: (clipInput) => {
    const id = nanoid()
    const newClip: Clip = { id, ...clipInput }
    set((state) => ({ clips: [...state.clips, newClip] }))
    return id
  },

  updateClip: (id, delta) =>
    set((state) => ({
      clips: state.clips.map((c) => (c.id === id ? { ...c, ...delta } : c)),
    })),
})) 