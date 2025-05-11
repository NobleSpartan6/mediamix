import * as React from 'react'

import { useTimelineStore } from '../../../state/timelineStore'
import type { Clip as ClipType } from '../../../state/timelineStore'
import { InteractiveClip } from './InteractiveClip'
import { TimeRuler } from './TimeRuler'
import { Playhead } from './Playhead'
import { TrackRow } from './TrackRow'
import { useBeatSlices } from '../hooks/useBeatSlices'
import { useTimelineKeyboard } from '../hooks/useTimelineKeyboard'

interface TimelineProps {
  /** zoom factor – how many horizontal pixels represent one second */
  pixelsPerSecond?: number
}

/**
 * Timeline container that renders clip segments horizontally.
 * The component itself has minimal logic – behaviour (drag/resize, playhead) is
 * added in later subtasks.
 */
export const Timeline: React.FC<TimelineProps> = React.memo(({ pixelsPerSecond = 100 }) => {
  const clips = useTimelineStore((state) => state.clips)
  const setClips = useTimelineStore((state) => state.setClips)

  // Auto generate clip slices if clips are empty but beats are available
  const beatSlices = useBeatSlices()
  React.useEffect(() => {
    if (clips.length === 0 && beatSlices.length > 0) {
      // update store with generated slices
      setClips(beatSlices)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [beatSlices, clips.length])

  const playheadSeconds = 0

  // Compute timeline duration as the furthest clip end (fallback 60s)
  const duration = React.useMemo(() => {
    if (clips.length === 0) return 60
    return clips.reduce((max, c) => Math.max(max, c.end), 0)
  }, [clips])

  // Group clips by lane index
  const lanes = React.useMemo(() => {
    const map = new Map<number, ClipType[]>()
    clips.forEach((clip) => {
      const arr = map.get(clip.lane) ?? []
      arr.push(clip)
      map.set(clip.lane, arr)
    })
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0]) // [[lane, clips]]
  }, [clips])

  const renderedTracks = React.useMemo(
    () =>
      lanes.map(([laneIndex, laneClips]) => (
        <TrackRow
          key={laneIndex}
          laneIndex={laneIndex}
          clips={laneClips}
          pixelsPerSecond={pixelsPerSecond}
          type={laneIndex === 0 ? 'video' : 'audio'}
        />
      )),
    [lanes, pixelsPerSecond],
  )

  // ref to horizontal scroll container so ruler can sync
  const scrollRef = React.useRef<HTMLDivElement>(null)

  // Track area height (exclude ruler height)
  const trackAreaHeight = 48 // px – single track for MVP

  useTimelineKeyboard()

  return (
    <div className="w-full select-none">
      {/* Time ruler aligned with scroll */}
      <TimeRuler scrollContainerRef={scrollRef} pixelsPerSecond={pixelsPerSecond} duration={duration} />

      {/* Scrollable track area */}
      <div
        ref={scrollRef}
        className="relative overflow-x-auto bg-panel-bg"
        style={{ height: trackAreaHeight }}
      >
        {/* content width spacer equal to timeline duration */}
        <div className="relative h-full flex flex-col" style={{ width: duration * pixelsPerSecond }}>
          {renderedTracks}
          {/* Playhead overlay */}
          <Playhead positionSeconds={playheadSeconds} pixelsPerSecond={pixelsPerSecond} height="100%" />
        </div>
      </div>
    </div>
  )
})

Timeline.displayName = 'Timeline' 