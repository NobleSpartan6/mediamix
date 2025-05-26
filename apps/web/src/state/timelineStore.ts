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
  /** identifier grouping paired audio/video clips */
  groupId?: string
  /** horizontal position within preview canvas */
  x: number
  /** vertical position within preview canvas */
  y: number
  /** scale multiplier */
  scale: number
  /** rotation in degrees */
  rotation: number
  /** audio volume (0-1) */
  volume: number
  /** mute audio */
  muted: boolean
}

export interface Track {
  id: string
  type: 'video' | 'audio'
  label: string
  /** identifier grouping related tracks (e.g. video+audio pair) */
  groupId: string
  /** id of the asset that originally created this track, if any */
  parentAsset?: string
  /** disable edits when true */
  locked: boolean
  /** hide or silence the track */
  muted: boolean
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
  /** Enable snap-to references when dragging clips */
  snapping: boolean
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
  updateTrack: (id: string, delta: Partial<Omit<Track, 'id'>>) => void
  removeClip: (id: string, opts?: { ripple?: boolean }) => void
  removeClipsByAsset: (assetId: string) => void
  splitClipAt: (time: number) => string | null
  /** array of beat timestamps in seconds (monotonically increasing) */
  beats: number[]
  setBeats: (beats: number[]) => void
  /** Retrieve a clip by id */
  getClip: (id: string) => Clip | undefined
  setCurrentTime: (time: number) => void
  setInPoint: (time: number | null) => void
  setOutPoint: (time: number | null) => void
  setFollowPlayhead: (follow: boolean) => void
  setSnapping: (value: boolean) => void
  setSelectedClips: (ids: string[]) => void
}

const toDict = (arr: Clip[]) => Object.fromEntries(arr.map((c) => [c.id, c]))

const ensureTracks = (
  tracks: Track[],
  lane: number,
  opts?: { type?: 'video' | 'audio'; groupId?: string },
): Track[] => {
  const next = tracks.map((t) => ({
    locked: false,
    muted: false,
    ...t,
  }))
  while (next.length <= lane) {
    const index = next.length
    const type = index === lane && opts?.type ? opts.type : index % 2 === 0 ? 'video' : 'audio'
    const countOfType = next.filter((t) => t.type === type).length + 1
    const label = type === 'video' ? `V${countOfType}` : `A${countOfType}`
    const groupId = opts?.groupId ?? `group-${Math.floor(index / 2)}`
    next.push({
      id: `track-${index}`,
      type,
      label,
      groupId,
      locked: false,
      muted: false,
    })
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

export const useTimelineStore = create<TimelineState>((set, get) => ({
  clipsById: {},
  tracks: [],
  durationSec: 0,
  currentTime: 0,
  inPoint: null,
  outPoint: null,
  beats: [],
  followPlayhead: true,
  snapping: true,
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

  /** Retrieve a clip by id */
  getClip: (id) => get().clipsById[id],

  /**
   * Add a new clip and return its generated id.
   * Track metadata is expanded to fit the clip lane.
   */
  addClip: (clipInput, opts) => {
    const id = generateId()
    const newClip: Clip = {
      x: 0,
      y: 0,
      scale: 1,
      rotation: 0,
      volume: 1,
      muted: false,
      ...clipInput,
      id,
      groupId: opts?.groupId,
    }
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

  /** Update an existing clip by id. If the clip has a groupId, apply the same
   * time and lane delta to other clips in the group. */
  updateClip: (id, delta) =>
    set((state) => {
      const existing = state.clipsById[id]
      if (!existing) return {}
      const track = state.tracks[existing.lane]
      if (track?.locked) return {}

      const groupId = existing.groupId
      const startDiff =
        delta.start !== undefined ? delta.start - existing.start : 0
      const endDiff = delta.end !== undefined ? delta.end - existing.end : 0
      const laneDiff = delta.lane !== undefined ? delta.lane - existing.lane : 0
      const xDiff = delta.x !== undefined ? delta.x - existing.x : 0
      const yDiff = delta.y !== undefined ? delta.y - existing.y : 0
      const scaleDiff = delta.scale !== undefined ? delta.scale - existing.scale : 0
      const rotDiff = delta.rotation !== undefined ? delta.rotation - existing.rotation : 0
      const volDiff = delta.volume !== undefined ? delta.volume - existing.volume : 0

      const clipsById = { ...state.clipsById }

      const apply = (cid: string, clip: Clip) => {
        const upd: Clip = {
          ...clip,
          ...(delta.start !== undefined && { start: clip.start + startDiff }),
          ...(delta.end !== undefined && { end: clip.end + endDiff }),
          ...(delta.lane !== undefined && { lane: clip.lane + laneDiff }),
          ...(delta.x !== undefined && { x: clip.x + xDiff }),
          ...(delta.y !== undefined && { y: clip.y + yDiff }),
          ...(delta.scale !== undefined && { scale: clip.scale + scaleDiff }),
          ...(delta.rotation !== undefined && { rotation: clip.rotation + rotDiff }),
          ...(delta.volume !== undefined && { volume: clip.volume + volDiff }),
          ...(delta.muted !== undefined && { muted: delta.muted }),
        }
        clipsById[cid] = upd
      }

      apply(id, existing)

      if (groupId) {
        Object.entries(state.clipsById).forEach(([cid, c]) => {
          if (cid === id) return
          if (c.groupId === groupId) apply(cid, c)
        })
      }

      const durationSec = Math.max(
        ...Object.values(clipsById).map((c) => c.end),
      )

      const maxLane = Object.values(clipsById).reduce(
        (m, c) => Math.max(m, c.lane),
        -1,
      )
      const tracks = pruneTracks(ensureTracks(state.tracks, maxLane), clipsById)

      return { clipsById, durationSec, tracks }
    }),

  /** Update track properties like locked or muted */
  updateTrack: (id, delta) =>
    set((state) => {
      const index = state.tracks.findIndex((t) => t.id === id)
      if (index === -1) return {}
      const updated: Track = { ...state.tracks[index], ...delta }
      const tracks = [...state.tracks]
      tracks[index] = updated
      return { tracks }
    }),

  /**
   * Remove a clip. When `opts.ripple` is true, subsequent clips
   * on the same lane shift left to fill the gap.
   */
  removeClip: (id, opts) =>
    set((state) => {
      const clip = state.clipsById[id]
      if (!clip) return {}
      const track = state.tracks[clip.lane]
      if (track?.locked) return {}
      const { ripple } = opts ?? {}

      const targetIds = Object.entries(state.clipsById)
        .filter(([, c]) => c.groupId && c.groupId === clip.groupId)
        .map(([cid]) => cid)
      if (!targetIds.includes(id)) targetIds.push(id)

      let clipsById: Record<string, Clip> = { ...state.clipsById }

      targetIds.forEach((tid) => {
        const cl = clipsById[tid]
        if (!cl) return
        const { [tid]: _removed, ...rest } = clipsById
        clipsById = rest
        if (ripple) {
          const shift = cl.end - cl.start
          clipsById = Object.fromEntries(
            Object.entries(clipsById).map(([cid, c]) => {
              if (c.lane === cl.lane && c.start > cl.start) {
                const moved = { ...c, start: c.start - shift, end: c.end - shift }
                return [cid, moved]
              }
              return [cid, c]
            }),
          )
        }
      })

      const durationSec = Math.max(
        0,
        ...Object.values(clipsById).map((c) => c.end),
      )

      const tracks = pruneTracks(state.tracks, clipsById)
      return { clipsById, durationSec, tracks }
    }),

  /** Remove all clips that reference the given asset id */
  removeClipsByAsset: (assetId) =>
    set((state) => {
      const clipsById = Object.fromEntries(
        Object.entries(state.clipsById).filter(([, c]) => c.assetId !== assetId),
      )

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
  /** Toggle snapping during clip edits */
  setSnapping: (value) => set({ snapping: value }),
  /** Replace current selection */
  setSelectedClips: (ids) => set({ selectedClipIds: ids }),
}))

// ---- Selectors -----------------------------------------------------------

export const selectClipsArray = (state: TimelineState): Clip[] =>
  Object.values(state.clipsById)

export const selectTracks = (state: TimelineState): Track[] => state.tracks

export const selectSelectedClipIds = (state: TimelineState): string[] =>
  state.selectedClipIds

/** Return clips occupying the given lane, sorted by start time */
export const selectLaneClips =
  (lane: number) =>
  (state: TimelineState): Clip[] =>
    Object.values(state.clipsById)
      .filter((c) => c.lane === lane)
      .sort((a, b) => a.start - b.start)

/** Determine if a time range collides with any clip on the lane */
export const laneHasCollision =
  (
    lane: number,
    start: number,
    end: number,
    excludeId?: string,
  ) =>
  (state: TimelineState): boolean =>
    selectLaneClips(lane)(state).some(
      (c) => c.id !== excludeId && start < c.end && end > c.start,
    )

