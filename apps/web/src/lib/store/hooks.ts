import { useCallback } from 'react'
import useMotifStore from './index.js'
import type { MotifState, ClipSegment } from './types.js'  

// Hook for accessing file-related state
export const useFileState = () => {
  return useMotifStore((state: MotifState) => ({
    fileInfo: state.fileInfo,
    isFileLoading: state.isFileLoading,
    fileError: state.fileError,
    setFileInfo: state.setFileInfo
  }))
}

// Hook for accessing beat detection-related state
export const useBeatDetection = () => {
  return useMotifStore((state: MotifState) => ({
    beatMarkers: state.beatMarkers,
    isBeatDetectionRunning: state.isBeatDetectionRunning,
    beatDetectionError: state.beatDetectionError,
    setBeatMarkers: state.setBeatMarkers
  }))
}

// Hook for accessing timeline-related state and operations
export const useTimeline = () => {
  // Access timeline properties individually to avoid unnecessary re-renders
  const clips = useMotifStore((state: MotifState) => state.timeline.clips)
  const selectedClipIds = useMotifStore((state: MotifState) => state.timeline.selectedClipIds)
  const playheadPosition = useMotifStore((state: MotifState) => state.timeline.playheadPosition)
  const zoom = useMotifStore((state: MotifState) => state.timeline.zoom)
  const duration = useMotifStore((state: MotifState) => state.timeline.duration)
  
  // Access actions
  const addClip = useMotifStore((state: MotifState) => state.addClip)
  const updateClip = useMotifStore((state: MotifState) => state.updateClip)
  const removeClip = useMotifStore((state: MotifState) => state.removeClip)
  const setSelectedClips = useMotifStore((state: MotifState) => state.setSelectedClips)
  const setPlayheadPosition = useMotifStore((state: MotifState) => state.setPlayheadPosition)
  const setZoom = useMotifStore((state: MotifState) => state.setZoom)
  
  return {
    clips,
    selectedClipIds,
    playheadPosition,
    zoom,
    duration,
    addClip,
    updateClip,
    removeClip,
    setSelectedClips,
    setPlayheadPosition,
    setZoom
  }
}

// Hook for accessing export-related state
export const useExportStatus = () => {
  return useMotifStore((state: MotifState) => ({
    isExporting: state.isExporting,
    exportProgress: state.exportProgress,
    exportError: state.exportError,
    setExportStatus: state.setExportStatus
  }))
}

// Custom hook for selecting specific clips
export const useSelectedClips = (): ClipSegment[] => {
  const { clips, selectedClipIds } = useTimeline()
  
  const selectedClips = useCallback(() => {
    return clips.filter((clip: ClipSegment) => selectedClipIds.includes(clip.id))
  }, [clips, selectedClipIds])
  
  return selectedClips()
}

// Hook for accessing the reset function
export const useResetStore = () => {
  return useMotifStore((state: MotifState) => state.resetState)
} 