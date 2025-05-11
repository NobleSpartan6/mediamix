import * as React from 'react'
import type { Clip as ClipType } from '../../../state/timelineStore'
import { InteractiveClip } from './InteractiveClip'

interface TrackRowProps {
  laneIndex: number
  clips: ClipType[]
  pixelsPerSecond: number
  type: 'video' | 'audio'
}

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