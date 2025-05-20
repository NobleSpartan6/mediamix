import * as React from 'react'
import type { Clip as ClipType } from '../../../state/timelineStore'
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

  return (
    <div className="relative w-full border-b border-white/10" style={{ height }}>
      {renderedClips}
    </div>
  )
})

TrackRow.displayName = 'TrackRow' 
