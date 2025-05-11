import { create } from 'zustand'
import type { MotifState, FileInfo, ClipSegment, BeatMarker } from './types'

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
    fileHandle: null
  },
  isFileLoading: false,
  fileError: null,

  beatMarkers: [],
  isBeatDetectionRunning: false,
  beatDetectionError: null,

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
      fileHandle: null
    },
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
  }))
}))

export default useMotifStore 