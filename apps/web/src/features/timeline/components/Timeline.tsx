import * as React from 'react'

import { useTimelineStore } from '../../../state/timelineStore'
import type { Clip as ClipType } from '../../../state/timelineStore'
import { InteractiveClip } from './InteractiveClip'
import { TimeRuler } from './TimeRuler'
import { Playhead } from './Playhead'
import { TrackRow } from './TrackRow'
import { useTransportStore } from '../../../state/transportStore'
import { useBeatSlices } from '../hooks/useBeatSlices'
import { useClipsArray } from '../hooks/useClipsArray'
import { useTimelineKeyboard } from '../hooks/useTimelineKeyboard'
import { useZoomScroll } from '../hooks/useZoomScroll'
import { ZoomSlider } from './ZoomSlider'

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
  // Zoom and scroll: initialize state and scroll container ref
  const [zoom, setZoom] = React.useState(pixelsPerSecond)
  const initialZoom = React.useRef(pixelsPerSecond)
  const [showZoomIndicator, setShowZoomIndicator] = React.useState(false)
  const indicatorTimeout = React.useRef<number | null>(null)
  const scrollRef = React.useRef<HTMLDivElement>(null)
  useZoomScroll(scrollRef, zoom, setZoom, { minZoom: 20, maxZoom: 500, zoomStep: 0.002 })
  // Access clips via memoized selector hook
  const clips = useClipsArray()
  const setClips = useTimelineStore((state) => state.setClips)

  // Show zoom change indicator briefly
  React.useEffect(() => {
    setShowZoomIndicator(true)
    if (indicatorTimeout.current) {
      clearTimeout(indicatorTimeout.current)
    }
    indicatorTimeout.current = window.setTimeout(() => {
      setShowZoomIndicator(false)
      indicatorTimeout.current = null
    }, 800)
  }, [zoom])

  // Auto generate clip slices if clips are empty but beats are available
  const beatSlices = useBeatSlices()
  React.useEffect(() => {
    if (clips.length === 0 && beatSlices.length > 0) {
      // update store with generated slices
      setClips(beatSlices)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [beatSlices, clips.length])

  const playheadFrame = useTransportStore((s) => s.playheadFrame)
  const setCurrentTime = useTimelineStore((s) => s.setCurrentTime)
  const playheadSeconds = React.useMemo(() => playheadFrame / 30, [playheadFrame])
  React.useEffect(() => {
    setCurrentTime(playheadSeconds)
  }, [playheadSeconds, setCurrentTime])

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
          pixelsPerSecond={zoom}
          type={laneIndex % 2 === 0 ? 'video' : 'audio'}
        />
      )),
    [lanes, zoom],
  )

  // Track area height based on lane types (video lanes taller than audio)
  const trackAreaHeight = React.useMemo(
    () =>
      lanes.reduce(
        (sum, [laneIndex]) => sum + (laneIndex % 2 === 0 ? 48 : 32),
        0,
      ),
    [lanes],
  )

  useTimelineKeyboard()

  return (
    <div className="w-full select-none relative">
      <div className="flex">
        {/* Left gutter: spacer for ruler then track labels */}
        <div className="flex flex-col">
          {/* spacer matching ruler height */}
          <div className="h-6" />
          {lanes.map(([laneIndex]) => {
            const isVideo = laneIndex % 2 === 0
            const heightClass = isVideo ? 'h-12' : 'h-8'
            const pair = Math.floor(laneIndex / 2) + 1
            return (
              <div
                key={laneIndex}
                className={`${heightClass} flex items-center justify-center border-b border-white/10 text-xs text-gray-300 font-ui-medium`}
              >
                {isVideo ? `V${pair}` : `A${pair}`}
              </div>
            )
          })}
        </div>
        {/* Ruler and tracks */}
        <div className="flex-1 overflow-hidden">
          {/* Numeric time ruler */}
          <TimeRuler scrollContainerRef={scrollRef} pixelsPerSecond={zoom} duration={duration} />
          {/* Scrollable track area */}
          <div
            ref={scrollRef}
            className="relative overflow-x-scroll scrollbar-none bg-panel-bg cursor-grab"
            style={{ height: trackAreaHeight }}
          >
            <div className="relative h-full flex flex-col" style={{ width: duration * zoom }}>
              {renderedTracks}
              {/* Playhead overlay */}
              <Playhead positionSeconds={playheadSeconds} pixelsPerSecond={zoom} height="100%" />
            </div>
          </div>
        </div>
      </div>
      {/* Zoom level indicator */}
      {showZoomIndicator && (
        <div className="absolute top-2 right-2 bg-gray-800/80 px-2 py-1 rounded text-xs font-ui-medium">
          {Math.round((zoom / initialZoom.current) * 100)}%
        </div>
      )}
      {/* Zoom slider control */}
      <div className="absolute top-8 right-2">
        <ZoomSlider value={zoom} onChange={setZoom} />
      </div>
    </div>
  )
})

Timeline.displayName = 'Timeline'
