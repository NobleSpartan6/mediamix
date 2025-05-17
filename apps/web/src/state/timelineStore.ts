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

export interface Track {
  id: string
  type: 'video' | 'audio'
  label: string
}

export interface TimelineState {
  /** Normalised dictionary of clips */
  clipsById: Record<string, Clip>
  /** Track metadata */
  tracks: Track[]
  /** Project duration in seconds (ceil of max clip end) */
  durationSec: number
  /** Current playhead time */
  currentTime: number
  /** Optional In/Out points */
  inPoint: number | null
  outPoint: number | null
  /** Replace all clips (normalised input) */
  setClips: (clips: Clip[]) => void
  addClip: (clip: Omit<Clip, 'id'>) => string
  updateClip: (id: string, delta: Partial<Omit<Clip, 'id'>>) => void
  removeClip: (id: string) => void
  /** array of beat timestamps in seconds (monotonically increasing) */
  beats: number[]
  setBeats: (beats: number[]) => void
  setCurrentTime: (t: number) => void
  setInPoint: (t: number | null) => void
  setOutPoint: (t: number | null) => void
}

const toDict = (arr: Clip[]) => Object.fromEntries(arr.map((c) => [c.id, c]))

const ensureTracks = (tracks: Track[], lane: number): Track[] => {
  const next = [...tracks]
  while (next.length <= lane) {
    const index = next.length
    const pair = Math.floor(index / 2) + 1
    const type = index % 2 === 0 ? 'video' : 'audio'
    const label = type === 'video' ? `V${pair}` : `A${pair}`
    next.push({ id: `track-${index}`, type, label })
  }
  return next
}

const pruneTracks = (
  tracks: Track[],
  clipsById: Record<string, Clip>,
): Track[] => {
  const highest = Math.max(
    -1,
    ...Object.values(clipsById).map((c) => c.lane),
  )
  return tracks.slice(0, highest + 1)
}

export const useTimelineStore = create<TimelineState>((set) => ({
  clipsById: {},
  tracks: [],
  durationSec: 0,
  currentTime: 0,
  inPoint: null,
  outPoint: null,
  beats: [],

  // Replace entire clip collection
  setClips: (clips) =>
    set((state) => {
      let tracks = state.tracks
      clips.forEach((c) => {
        tracks = ensureTracks(tracks, c.lane)
      })
      const clipsById = toDict(clips)
      tracks = pruneTracks(tracks, clipsById)
      return {
        clipsById,
        durationSec: clips.reduce((m, c) => Math.max(m, c.end), 0),
        tracks,
      }
    }),

  setBeats: (beats) => set({ beats }),

  addClip: (clipInput) => {
    const id = nanoid()
    const newClip: Clip = { id, ...clipInput }
    set((state) => {
      const clipsById = { ...state.clipsById, [id]: newClip }
      const durationSec = Math.max(state.durationSec, newClip.end)
      const tracks = ensureTracks(state.tracks, newClip.lane)
      return { clipsById, durationSec, tracks }
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
      let tracks = ensureTracks(state.tracks, updated.lane)
      tracks = pruneTracks(tracks, clipsById)
      return { clipsById, durationSec, tracks }
    }),

  removeClip: (id) =>
    set((state) => {
      const { [id]: removed, ...rest } = state.clipsById
      const durationSec = Math.max(
        0,
        ...Object.values(rest).map((c) => c.end),
      )
      const tracks = pruneTracks(state.tracks, rest)
      return { clipsById: rest, durationSec, tracks }
    }),

  setCurrentTime: (t) => set({ currentTime: Math.max(0, t) }),
  setInPoint: (t) => set({ inPoint: t }),
  setOutPoint: (t) => set({ outPoint: t }),
}))

// ---- Selectors -----------------------------------------------------------

export const selectClipsArray = (state: TimelineState): Clip[] =>
  Object.values(state.clipsById)

export const selectTracks = (state: TimelineState): Track[] => state.tracks
