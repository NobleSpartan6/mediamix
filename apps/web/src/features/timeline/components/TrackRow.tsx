import * as React from 'react'
import type { Clip as ClipType, Track } from '../../../state/timelineStore'
import { useTimelineStore } from '../../../state/timelineStore'
import { Lock, Unlock, Eye, EyeOff, Volume2, VolumeX } from 'lucide-react'
import { insertAssetToTimeline } from '../utils'
import { InteractiveClip } from './InteractiveClip'
import { Clip } from './Clip'

/** Props for {@link TrackRow}. */
interface TrackRowProps {
  /** Zero-based lane index this row represents */
  laneIndex: number
  /** Clips belonging to this track */
  clips: ClipType[]
  /** Current zoom level in pixels per second */
  pixelsPerSecond: number
  /** Track metadata */
  track: Track
  /** Reference to the scrollable timeline container */
  timelineRef: React.RefObject<HTMLDivElement>
}

/**
 * Render a single track lane and its clips.
 *
 * @param laneIndex index of the track lane
 * @param clips clips to display
 * @param pixelsPerSecond zoom level used for clip sizing
 * @param type video or audio row styling
 */
export const TrackRow: React.FC<TrackRowProps> = React.memo(({
  laneIndex,
  clips,
  pixelsPerSecond,
  track,
  timelineRef,
}) => {
  const type = track.type
  const height = type === 'video' ? 48 : 32

  const updateTrack = useTimelineStore((s) => s.updateTrack)

  const isAudio = type === 'audio'

  const toggleLock = React.useCallback(() => {
    updateTrack(track.id, { locked: !track.locked })
  }, [updateTrack, track])

  const toggleMute = React.useCallback(() => {
    updateTrack(track.id, { muted: !track.muted })
  }, [updateTrack, track])

  const LockIcon = track.locked ? Lock : Unlock
  const MuteIcon = track.muted
    ? isAudio
      ? VolumeX
      : EyeOff
    : isAudio
      ? Volume2
      : Eye

  const renderedClips = React.useMemo(
    () =>
      clips.map((clip) =>
        track.locked ? (
          <Clip
            key={clip.id}
            clip={clip}
            pixelsPerSecond={pixelsPerSecond}
            type={type}
          />
        ) : (
          <InteractiveClip
            key={clip.id}
            clip={clip}
            pixelsPerSecond={pixelsPerSecond}
            type={type}
          />
        ),
      ),
    [clips, pixelsPerSecond, type, track.locked],
  )

  const handleDragOver = React.useCallback((e: React.DragEvent<HTMLDivElement>) => {
    if (e.dataTransfer.types.includes('text/x-mediamix-asset')) {
      e.preventDefault()
    }
  }, [])

  const handleDrop = React.useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      const assetId = e.dataTransfer.getData('text/x-mediamix-asset')
      if (assetId) {
        const timelineEl = timelineRef.current
        if (timelineEl) {
          const bounds = timelineEl.getBoundingClientRect()
          const scrollLeft = timelineEl.scrollLeft
          const dropX = e.clientX + scrollLeft - bounds.left
          const startSec = Math.max(0, dropX / pixelsPerSecond)
          insertAssetToTimeline(assetId, startSec)
        } else {
          insertAssetToTimeline(assetId)
        }
        e.preventDefault()
      }
    },
    [pixelsPerSecond, timelineRef]
  )

  return (
    <div
      className="relative w-full border-b border-white/10"
      style={{ height }}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="absolute left-1 top-1 flex gap-1 z-10">
        <button
          type="button"
          onClick={toggleLock}
          aria-label={track.locked ? 'Unlock track' : 'Lock track'}
          className={track.locked ? 'opacity-50' : ''}
        >
          <LockIcon className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={toggleMute}
          aria-label={
            track.muted ? (isAudio ? 'Unmute track' : 'Show track') : isAudio ? 'Mute track' : 'Hide track'
          }
          className={track.muted ? 'opacity-50' : ''}
        >
          <MuteIcon className="w-4 h-4" />
        </button>
      </div>
      {track.locked ? (
        <div className="pointer-events-none opacity-50">{renderedClips}</div>
      ) : (
        renderedClips
      )}
    </div>
  )
})

TrackRow.displayName = 'TrackRow' 
