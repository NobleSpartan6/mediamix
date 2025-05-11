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

// Main store state type
export interface MotifState {
  // File section
  fileInfo: FileInfo
  isFileLoading: boolean
  fileError: string | null

  // Beat detection section
  beatMarkers: BeatMarker[]
  isBeatDetectionRunning: boolean
  beatDetectionError: string | null

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
} 