import type { VideoMetadata } from '../file/extractVideoMetadata'

// Define types for different state slices
export type FileInfo = {
  fileName: string | null
  fileSize: number | null
  duration: number | null
  width: number | null
  height: number | null
  videoCodec: string | null
  audioCodec: string | null
  fileHandle: FileSystemFileHandle | null
  /** Frames per second. Use integer or fractional value when available. */
  frameRate: number | null
  /** Audio sample rate (Hz) when available */
  sampleRate: number | null
  /** Number of audio channels (1 = mono, 2 = stereo, etc.) */
  channelCount: number | null
  /** Browser support for the detected video codec (true=supported, false=unsupported, null=unknown) */
  videoSupported: boolean | null
  /** Browser support for the detected audio codec (true=supported, false=unsupported, null=unknown) */
  audioSupported: boolean | null
}

export type BeatMarker = {
  id: string
  timestamp: number // In seconds
  confidence: number // 0-1
}

export type ClipSegment = {
  id: string
  startTime: number // In seconds
  endTime: number // In seconds
  type: 'video' | 'audio'
  layer: number // Layer index (0-based)
  // More properties will be added as needed
}

export type TimelineData = {
  clips: ClipSegment[]
  selectedClipIds: string[]
  playheadPosition: number // In seconds
  zoom: number // Zoom level, 1 = normal
  duration: number // In seconds
}

// Possible stages for the beat-detection pipeline
export type BeatDetectionStage = 'idle' | 'extractAudio' | 'detectBeats'

export type BeatDetectionProgress = {
  /** Current progress value from 0 to 1 */
  beatDetectionProgress: number
  /** Current stage of the beat-detection pipeline */
  beatDetectionStage: BeatDetectionStage
}

// Main store state type
export interface MotifState {
  // File section
  fileInfo: FileInfo
  isFileLoading: boolean
  fileError: string | null

  /** Imported media assets */
  mediaAssets: MediaAsset[]
  /** Add a new media asset to the library */
  addMediaAsset: (asset: Omit<MediaAsset, 'id'>) => void
  /** Replace the entire media assets array */
  setMediaAssets: (assets: MediaAsset[]) => void

  // Beat detection section
  beatMarkers: BeatMarker[]
  isBeatDetectionRunning: boolean
  beatDetectionError: string | null

  /** Beat-detection progress (0-1) */
  beatDetectionProgress: number
  /** Pipeline stage */
  beatDetectionStage: BeatDetectionStage

  // Timeline section
  timeline: TimelineData

  // Export section
  isExporting: boolean
  exportProgress: number // 0-1
  exportError: string | null

  // Actions
  resetState: () => void
  setFileInfo: (info: Partial<FileInfo>) => void
  setBeatMarkers: (markers: BeatMarker[]) => void
  addClip: (clip: ClipSegment) => void
  updateClip: (id: string, updates: Partial<ClipSegment>) => void
  removeClip: (id: string) => void
  setSelectedClips: (ids: string[]) => void
  setPlayheadPosition: (position: number) => void
  setZoom: (zoom: number) => void
  setExportStatus: (isExporting: boolean, progress?: number, error?: string | null) => void
  setIsFileLoading: (loading: boolean) => void
  setFileError: (error: string | null) => void
  /** Toggle beat detection running flag */
  setIsBeatDetectionRunning: (running: boolean) => void
  /** Set error message (or clear) for beat detection */
  setBeatDetectionError: (error: string | null) => void
  /** Update beat-detection progress value (0-1) */
  setBeatDetectionProgress: (progress: number) => void
  /** Update beat-detection stage */
  setBeatDetectionStage: (stage: BeatDetectionStage) => void
}

export type MediaAsset = {
  id: string
  fileName: string
  fileHandle: FileSystemFileHandle | null
  metadata: VideoMetadata
} 