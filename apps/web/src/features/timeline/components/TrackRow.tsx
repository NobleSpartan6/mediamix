import * as React from 'react'
import type { Clip as ClipType } from '../../../state/timelineStore'
import { useTimelineStore } from '../../../state/timelineStore'
import { useMediaStore } from '../../../state/mediaStore'
import { InteractiveClip } from './InteractiveClip'

/** Props for {@link TrackRow}. */
interface TrackRowProps {
  /** Zero-based lane index this row represents */
  laneIndex: number
  /** Clips belonging to this track */
  clips: ClipType[]
  /** Current zoom level in pixels per second */
  pixelsPerSecond: number
  /** Track media type to control styling */
  type: 'video' | 'audio'
}

/**
 * Render a single track lane and its clips.
 *
 * @param laneIndex index of the track lane
 * @param clips clips to display
 * @param pixelsPerSecond zoom level used for clip sizing
 * @param type video or audio row styling
 */
export const TrackRow: React.FC<TrackRowProps> = React.memo(({ laneIndex, clips, pixelsPerSecond, type }) => {
  const height = type === 'video' ? 48 : 32

  const addClip = useTimelineStore((s) => s.addClip)
  const clipsById = useTimelineStore((s) => s.clipsById)
  const assets = useMediaStore((s) => s.assets)

  const renderedClips = React.useMemo(
    () =>
      clips.map((clip) => (
        <InteractiveClip
          key={clip.id}
          clip={clip}
          pixelsPerSecond={pixelsPerSecond}
          type={type}
        />
      )),
    [clips, pixelsPerSecond, type],
  )

  const handleDragOver = React.useCallback((e: React.DragEvent<HTMLDivElement>) => {
    if (e.dataTransfer.types.includes('text/x-mediamix-asset')) {
      e.preventDefault()
    }
  }, [])

  const handleDrop = React.useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      const assetId = e.dataTransfer.getData('text/x-mediamix-asset')
      if (!assetId) return
      const asset = assets[assetId]
      if (!asset) return
      const ext = asset.fileName.split('.').pop()?.toLowerCase() ?? ''
      const audioRegex = /^(mp3|wav|flac|ogg|aac|m4a)$/
      const videoRegex = /^(mp4|mov|mkv|webm|avi|mpg|mpeg)$/
      const isAudio = audioRegex.test(ext)
      const isVideoFile = videoRegex.test(ext)
      const isAudioOnly = isAudio && !isVideoFile
      const isVideo = isVideoFile || (!isAudio && !isVideoFile)
      const rect = e.currentTarget.getBoundingClientRect()
      const parentScroll = e.currentTarget.parentElement?.parentElement as HTMLElement
      const scrollLeft = parentScroll?.scrollLeft ?? 0
      const x = e.clientX - rect.left + scrollLeft
      const initialStart = Math.max(0, x / pixelsPerSecond)
      const duration = asset.duration
      const initialEnd = initialStart + duration

      const allClipsArray = Object.values(clipsById)

      const baseLane = laneIndex % 2 === 0 ? laneIndex : laneIndex - 1
      const audioLane = baseLane + 1

      let videoStart = initialStart
      let audioStart = initialStart

      // Check for overlap on video lane (baseLane)
      const conflictingVideoClips = allClipsArray.filter(
        (clip: ClipType) =>
          clip.lane === baseLane &&
          clip.start < initialEnd &&
          clip.end > initialStart,
      )

      if (conflictingVideoClips.length > 0) {
        videoStart = Math.max(...conflictingVideoClips.map((clip: ClipType) => clip.end))
      }

      // Check for overlap on audio lane (audioLane)
      const conflictingAudioClips = allClipsArray.filter(
        (clip: ClipType) =>
          clip.lane === audioLane &&
          clip.start < initialEnd &&
          clip.end > initialStart,
      )

      if (conflictingAudioClips.length > 0) {
        audioStart = Math.max(...conflictingAudioClips.map((clip: ClipType) => clip.end))
      }

      if (isVideo) {
        addClip({ start: videoStart, end: videoStart + duration, lane: baseLane, assetId })
      }
      if (isVideo || isAudioOnly) {
        addClip({ start: audioStart, end: audioStart + duration, lane: audioLane, assetId })
      }
      e.preventDefault()
    },
    [assets, pixelsPerSecond, laneIndex, addClip, clipsById],
  )

  return (
    <div
      className="relative w-full border-b border-white/10"
      style={{ height }}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {renderedClips}
    </div>
  )
})

TrackRow.displayName = 'TrackRow' 
