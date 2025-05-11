import { useCallback, useMemo } from 'react'
import useMotifStore from './index'
// import { shallow } from 'zustand/shallow' // (unused)
import type { MotifState, ClipSegment } from './types.js'  

// Hook for accessing file-related state
export const useFileState = () => {
  const fileInfo = useMotifStore((s: MotifState) => s.fileInfo)
  const isFileLoading = useMotifStore((s: MotifState) => s.isFileLoading)
  const fileError = useMotifStore((s: MotifState) => s.fileError)

  const setIsFileLoading = useMotifStore((s: MotifState) => s.setIsFileLoading)
  const setFileError = useMotifStore((s: MotifState) => s.setFileError)
  const setFileInfo = useMotifStore((s: MotifState) => s.setFileInfo)

  return useMemo(
    () => ({
      fileInfo,
      isFileLoading,
      fileError,
      setIsFileLoading,
      setFileError,
      setFileInfo,
    }),
    [fileInfo, isFileLoading, fileError, setIsFileLoading, setFileError, setFileInfo],
  )
}

// Hook for accessing beat detection-related state
export const useBeatDetection = () => {
  const beatMarkers = useMotifStore((s: MotifState) => s.beatMarkers)
  const isBeatDetectionRunning = useMotifStore((s: MotifState) => s.isBeatDetectionRunning)
  const beatDetectionError = useMotifStore((s: MotifState) => s.beatDetectionError)
  const beatDetectionProgress = useMotifStore((s: MotifState) => s.beatDetectionProgress)
  const beatDetectionStage = useMotifStore((s: MotifState) => s.beatDetectionStage)
  const setBeatMarkers = useMotifStore((s: MotifState) => s.setBeatMarkers)
  const setIsBeatDetectionRunning = useMotifStore((s: MotifState) => s.setIsBeatDetectionRunning)
  const setBeatDetectionError = useMotifStore((s: MotifState) => s.setBeatDetectionError)
  const setBeatDetectionProgress = useMotifStore((s: MotifState) => s.setBeatDetectionProgress)
  const setBeatDetectionStage = useMotifStore((s: MotifState) => s.setBeatDetectionStage)

  return useMemo(
    () => ({
      beatMarkers,
      isBeatDetectionRunning,
      beatDetectionError,
      beatDetectionProgress,
      beatDetectionStage,
      setBeatMarkers,
      setIsBeatDetectionRunning,
      setBeatDetectionError,
      setBeatDetectionProgress,
      setBeatDetectionStage,
    }),
    [beatMarkers, isBeatDetectionRunning, beatDetectionError, beatDetectionProgress, beatDetectionStage, setBeatMarkers, setIsBeatDetectionRunning, setBeatDetectionError, setBeatDetectionProgress, setBeatDetectionStage],
  )
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
  const isExporting = useMotifStore((s: MotifState) => s.isExporting)
  const exportProgress = useMotifStore((s: MotifState) => s.exportProgress)
  const exportError = useMotifStore((s: MotifState) => s.exportError)
  const setExportStatus = useMotifStore((s: MotifState) => s.setExportStatus)

  return useMemo(
    () => ({
      isExporting,
      exportProgress,
      exportError,
      setExportStatus,
    }),
    [isExporting, exportProgress, exportError, setExportStatus],
  )
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