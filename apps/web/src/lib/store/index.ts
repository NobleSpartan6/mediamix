import { create } from 'zustand'
import type { MotifState, FileInfo, ClipSegment, BeatMarker, MediaAsset } from './types'

import { generateId } from '../../utils/id'
import { nanoid } from '../../utils/nanoid'
import { useTimelineStore } from '../../state/timelineStore'

// Create the store
const useMotifStore = create<MotifState>((set) => ({
  // Initial state
  fileInfo: {
    fileName: null,
    fileSize: null,
    duration: null,
    width: null,
    height: null,
    videoCodec: null,
    audioCodec: null,
    fileHandle: null,
    frameRate: null,
    sampleRate: null,
    channelCount: null,
    videoSupported: null,
    audioSupported: null
  },
  isFileLoading: false,
  fileError: null,

  // Media assets library
  mediaAssets: [],

  beatMarkers: [],
  isBeatDetectionRunning: false,
  beatDetectionError: null,
  beatDetectionProgress: 0,
  beatDetectionStage: 'idle',

  timeline: {
    clips: [],
    selectedClipIds: [],
    playheadPosition: 0,
    zoom: 1,
    duration: 0
  },

  isExporting: false,
  exportProgress: 0,
  exportError: null,

  // Actions
  resetState: () => set((state) => ({
    ...state,
    fileInfo: {
      fileName: null,
      fileSize: null,
      duration: null,
      width: null,
      height: null,
      videoCodec: null,
      audioCodec: null,
      fileHandle: null,
      frameRate: null,
      sampleRate: null,
      channelCount: null,
      videoSupported: null,
      audioSupported: null
    },
    mediaAssets: [],
    beatMarkers: [],
    timeline: {
      clips: [],
      selectedClipIds: [],
      playheadPosition: 0,
      zoom: 1,
      duration: 0
    },
    isExporting: false,
    exportProgress: 0,
    exportError: null
  })),

  setFileInfo: (info: Partial<FileInfo>) => set((state) => ({
    fileInfo: { ...state.fileInfo, ...info }
  })),

  setIsFileLoading: (loading: boolean) => set(() => ({
    isFileLoading: loading
  })),

  setFileError: (error: string | null) => set(() => ({
    fileError: error
  })),

  /**
   * Add a new media asset and create paired timeline clips.
   * Clips span the asset duration on the next free video and audio lanes.
   */
  addMediaAsset: (assetInput) => {
    const id = generateId()
    set((state) => ({ mediaAssets: [...state.mediaAssets, { id, ...assetInput }] }))

    const timeline = useTimelineStore.getState()
    const maxLane = Object.values(timeline.clipsById).reduce(
      (m, c) => Math.max(m, c.lane),
      -1,
    )
    const baseLane = maxLane + 1
    const duration = assetInput.metadata.duration ?? 0
    const groupId = nanoid()
    timeline.addClip(
      { start: 0, end: duration, lane: baseLane, assetId: id },
      { trackType: 'video', groupId },
    )
    timeline.addClip(
      { start: 0, end: duration, lane: baseLane + 1, assetId: id },
      { trackType: 'audio', groupId },
    )
  },

  /** Replace all media assets */
  setMediaAssets: (assets) => set(() => ({ mediaAssets: assets })),

  setBeatMarkers: (markers: BeatMarker[]) => set(() => ({
    beatMarkers: markers
  })),

  addClip: (clip: ClipSegment) => set((state) => ({
    timeline: {
      ...state.timeline,
      clips: [...state.timeline.clips, clip]
    }
  })),

  updateClip: (id: string, updates: Partial<ClipSegment>) => set((state) => ({
    timeline: {
      ...state.timeline,
      clips: state.timeline.clips.map((clip) => 
        clip.id === id ? { ...clip, ...updates } : clip
      )
    }
  })),

  removeClip: (id: string) => set((state) => ({
    timeline: {
      ...state.timeline,
      clips: state.timeline.clips.filter((clip) => clip.id !== id)
    }
  })),

  setSelectedClips: (ids: string[]) => set((state) => ({
    timeline: {
      ...state.timeline,
      selectedClipIds: ids
    }
  })),

  setPlayheadPosition: (position: number) => set((state) => ({
    timeline: {
      ...state.timeline,
      playheadPosition: position
    }
  })),

  setZoom: (zoom: number) => set((state) => ({
    timeline: {
      ...state.timeline,
      zoom
    }
  })),

  setExportStatus: (isExporting: boolean, progress = 0, error = null) => set(() => ({
    isExporting,
    exportProgress: progress,
    exportError: error
  })),

  setIsBeatDetectionRunning: (running: boolean) => set(() => ({
    isBeatDetectionRunning: running,
  })),

  setBeatDetectionError: (error: string | null) => set(() => ({
    beatDetectionError: error,
  })),

  setBeatDetectionProgress: (progress: number) => set(() => ({
    beatDetectionProgress: progress,
  })),

  setBeatDetectionStage: (stage: 'idle' | 'extractAudio' | 'detectBeats') => set(() => ({
    beatDetectionStage: stage,
  })),
}))

export default useMotifStore 