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
      const rect = e.currentTarget.getBoundingClientRect()
      const parentScroll = e.currentTarget.parentElement?.parentElement as HTMLElement
      const scrollLeft = parentScroll?.scrollLeft ?? 0
      const x = e.clientX - rect.left + scrollLeft
      const start = Math.max(0, x / pixelsPerSecond)
      const duration = asset.duration
      const baseLane = laneIndex % 2 === 0 ? laneIndex : laneIndex - 1
      addClip({ start, end: start + duration, lane: baseLane, assetId })
      addClip({ start, end: start + duration, lane: baseLane + 1, assetId })
      e.preventDefault()
    },
    [assets, pixelsPerSecond, laneIndex, addClip],
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
