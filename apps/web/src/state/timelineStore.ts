import { create } from 'zustand'

import { nanoid } from '../utils/nanoid'

import { generateId } from '../utils/id'

export interface Clip {
  id: string
  /** seconds from timeline origin */
  start: number
  /** seconds – exclusive end */
  end: number
  /** zero-based vertical lane index (0 = first video track) */
  lane: number
  /** id of source media asset */
  assetId?: string
}

export interface Track {
  id: string
  type: 'video' | 'audio'
  label: string
  /** identifier grouping related tracks (e.g. video+audio pair) */
  groupId: string
  /** id of the asset that originally created this track, if any */
  parentAsset?: string
}

export interface TimelineState {
  /** Normalised dictionary of clips */
  clipsById: Record<string, Clip>
  /** Track metadata */
  tracks: Track[]
  /** Project duration in seconds (ceil of max clip end) */
  durationSec: number
  /** Current playhead time in seconds */
  currentTime: number
  /** Auto-scroll timeline to keep playhead in view */
  followPlayhead: boolean
  /** Ids of currently selected clips */
  selectedClipIds: string[]
  /** Optional in/out points in seconds */
  inPoint: number | null
  outPoint: number | null
  /** Replace all clips (normalised input) */
  setClips: (clips: Clip[]) => void
  addClip: (
    clip: Omit<Clip, 'id'>,
    opts?: { trackType?: 'video' | 'audio'; groupId?: string },
  ) => string
  updateClip: (id: string, delta: Partial<Omit<Clip, 'id'>>) => void
  removeClip: (id: string, opts?: { ripple?: boolean }) => void
  splitClipAt: (time: number) => string | null
  /** array of beat timestamps in seconds (monotonically increasing) */
  beats: number[]
  setBeats: (beats: number[]) => void
  setCurrentTime: (time: number) => void
  setInPoint: (time: number | null) => void
  setOutPoint: (time: number | null) => void
  setFollowPlayhead: (follow: boolean) => void
  setSelectedClips: (ids: string[]) => void
}

const toDict = (arr: Clip[]) => Object.fromEntries(arr.map((c) => [c.id, c]))

const ensureTracks = (
  tracks: Track[],
  lane: number,
  opts?: { type?: 'video' | 'audio'; groupId?: string },
): Track[] => {
  const next = [...tracks]
  while (next.length <= lane) {
    const index = next.length
    const type = index === lane && opts?.type ? opts.type : index % 2 === 0 ? 'video' : 'audio'
    const countOfType = next.filter((t) => t.type === type).length + 1
    const label = type === 'video' ? `V${countOfType}` : `A${countOfType}`
    const groupId = opts?.groupId ?? `group-${Math.floor(index / 2)}`
    next.push({ id: `track-${index}`, type, label, groupId })
  }
  return next
}

const pruneTracks = (
  tracks: Track[],
  clipsById: Record<string, Clip>,
): Track[] => {
  const maxLane = Object.values(clipsById).reduce(
    (m, c) => Math.max(m, c.lane),
    -1,
  )
  const needed = ensureTracks(tracks, maxLane)
  return needed.slice(0, maxLane + 1)
}

export const useTimelineStore = create<TimelineState>((set) => ({
  clipsById: {},
  tracks: [],
  durationSec: 0,
  currentTime: 0,
  inPoint: null,
  outPoint: null,
  beats: [],
  followPlayhead: true,
  selectedClipIds: [],

  /**
   * Replace the entire clip collection with a new set.
   * Tracks and duration are updated accordingly.
   */
  setClips: (clips) =>
    set((state) => {
      const dict = toDict(clips)
      const maxLane = clips.reduce((m, c) => Math.max(m, c.lane), -1)
      const tracks = pruneTracks(
        ensureTracks(state.tracks, maxLane),
        dict,
      )
      return {
        clipsById: dict,
        durationSec: clips.reduce((m, c) => Math.max(m, c.end), 0),
        tracks,
      }
    }),

  /** Store beat timestamps in seconds */
  setBeats: (beats) => set({ beats }),

  /**
   * Add a new clip and return its generated id.
   * Track metadata is expanded to fit the clip lane.
   */
  addClip: (clipInput, opts) => {
    const id = generateId()
    const newClip: Clip = { ...clipInput, id }
    set((state) => {
      const clipsById = { ...state.clipsById, [id]: newClip }
      const durationSec = Math.max(state.durationSec, newClip.end)
      const tracks = pruneTracks(
        ensureTracks(state.tracks, newClip.lane, opts),
        clipsById,
      )
      return { clipsById, durationSec, tracks }
    })
    return id
  },

  /** Update an existing clip by id */
  updateClip: (id, delta) =>
    set((state) => {
      const existing = state.clipsById[id]
      if (!existing) return {}
      const updated: Clip = { ...existing, ...delta }
      const clipsById = { ...state.clipsById, [id]: updated }
      const durationSec = Math.max(
        ...Object.values(clipsById).map((c) => c.end),
      )
      const tracks = pruneTracks(
        ensureTracks(state.tracks, updated.lane),
        clipsById,
      )
      return { clipsById, durationSec, tracks }
    }),

  /**
   * Remove a clip. When `opts.ripple` is true, subsequent clips
   * on the same lane shift left to fill the gap.
   */
  removeClip: (id, opts) =>
    set((state) => {
      const clip = state.clipsById[id]
      if (!clip) return {}
      const { ripple } = opts ?? {}
      const { [id]: _removed, ...rest } = state.clipsById
      let clipsById: Record<string, Clip> = rest
      if (ripple) {
        const shift = clip.end - clip.start
        clipsById = Object.fromEntries(
          Object.entries(rest).map(([cid, c]) => {
            if (c.lane === clip.lane && c.start > clip.start) {
              const moved = { ...c, start: c.start - shift, end: c.end - shift }
              return [cid, moved]
            }
            return [cid, c]
          }),
        )
      }
      const durationSec = Math.max(
        0,
        ...Object.values(clipsById).map((c) => c.end),
      )

      const tracks = pruneTracks(state.tracks, clipsById)
      return { clipsById, durationSec, tracks }
    }),

  /**
   * Split the clip under `time` into two clips.
   * Returns the id of the new right-hand clip or null if none found.
   */
  splitClipAt: (time) => {
    let newId: string | null = null
    set((state) => {
      const entry = Object.entries(state.clipsById).find(([, c]) => c.start < time && c.end > time)
      if (!entry) return {}
      const [id, clip] = entry
      newId = generateId()
      const first: Clip = { ...clip, end: time }
      const second: Clip = { ...clip, id: newId, start: time }
      const clipsById = { ...state.clipsById, [id]: first, [newId]: second }
      const durationSec = Math.max(state.durationSec, second.end)
      const tracks = pruneTracks(state.tracks, clipsById)
      return { clipsById, durationSec, tracks }
    })
    return newId
  },

  /** Update the current playhead position (seconds) */
  setCurrentTime: (time) => set({ currentTime: time }),
  /** Set the in point for playback or export */
  setInPoint: (time) => set({ inPoint: time }),
  /** Set the out point for playback or export */
  setOutPoint: (time) => set({ outPoint: time }),
  /** Enable or disable auto-follow behavior */
  setFollowPlayhead: (follow) => set({ followPlayhead: follow }),
  /** Replace current selection */
  setSelectedClips: (ids) => set({ selectedClipIds: ids }),
}))

// ---- Selectors -----------------------------------------------------------

export const selectClipsArray = (state: TimelineState): Clip[] =>
  Object.values(state.clipsById)

export const selectTracks = (state: TimelineState): Track[] => state.tracks

export const selectSelectedClipIds = (state: TimelineState): string[] =>
  state.selectedClipIds

