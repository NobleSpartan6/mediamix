import { create } from 'zustand'

import { generateId } from '../utils/id'

export type TrackType = 'video' | 'audio'

export interface Track {
  id: string
  name: string
  type: TrackType
  locked: boolean
  muted: boolean
}

export interface Clip {
  id: string
  trackId: string
  start: number
  duration: number
  mediaId: string
}

interface TimelineState {
  tracks: Track[]
  clips: Record<string, Clip>
  currentTime: number
  zoom: number
  addTrack: (name: string, type: TrackType) => string
  updateTrack: (id: string, delta: Partial<Omit<Track, 'id'>>) => void
  addClip: (clip: Omit<Clip, 'id'>) => string
  updateClip: (id: string, delta: Partial<Omit<Clip, 'id'>>) => void
  removeClip: (id: string) => void
  setCurrentTime: (seconds: number) => void
  setZoom: (pixelsPerSec: number) => void
}

export const useTimelineStore = create<TimelineState>((set) => ({
  tracks: [],
  clips: {},
  currentTime: 0,
  zoom: 100,

  addTrack: (name, type) => {
    const id = generateId()
    const track: Track = { id, name, type, locked: false, muted: false }
    set((state) => ({ tracks: [...state.tracks, track] }))
    return id
  },

  updateTrack: (id, delta) =>
    set((state) => ({
      tracks: state.tracks.map((t) => (t.id === id ? { ...t, ...delta } : t)),
    })),

  addClip: (clipInput) => {
    const id = generateId()
    const clip: Clip = { ...clipInput, id }
    set((state) => ({ clips: { ...state.clips, [id]: clip } }))
    return id
  },

  updateClip: (id, delta) =>
    set((state) => {
      const clip = state.clips[id]
      if (!clip) return {}
      return { clips: { ...state.clips, [id]: { ...clip, ...delta } } }
    }),

  removeClip: (id) =>
    set((state) => {
      if (!(id in state.clips)) return {}
      const clips = { ...state.clips }
      delete clips[id]
      return { clips }
    }),

  setCurrentTime: (seconds) => set({ currentTime: Math.max(0, seconds) }),

  setZoom: (pixelsPerSec) => set({ zoom: pixelsPerSec }),
}))
