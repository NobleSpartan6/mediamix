import * as React from 'react'

import { useTimelineStore } from '../../../state/timelineStore'
import type { Clip as ClipType } from '../../../state/timelineStore'
import { InteractiveClip } from './InteractiveClip'
import { TimeRuler } from './TimeRuler'
import { Playhead } from './Playhead'
import { TrackRow } from './TrackRow'
import { GhostCuts } from './GhostCuts'
import { useTransportStore } from '../../../state/transportStore'
import { useBeatSlices } from '../hooks/useBeatSlices'
import { useClipsArray } from '../hooks/useClipsArray'
import { useTimelineKeyboard } from '../hooks/useTimelineKeyboard'
import { useZoomScroll } from '../hooks/useZoomScroll'
import { ZoomSlider } from './ZoomSlider'
import { Button } from '../../../components/ui/Button'

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
  const [scrollLeft, setScrollLeft] = React.useState(0)
  // Access clips via memoized selector hook
  const clips = useClipsArray()
  const setClips = useTimelineStore((state) => state.setClips)
  const tracks = useTimelineStore((s) => s.tracks)

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
  const playRate = useTransportStore((s) => s.playRate)
  const setCurrentTime = useTimelineStore((s) => s.setCurrentTime)
  const currentTime = useTimelineStore((s) => s.currentTime)
  const followPlayhead = useTimelineStore((s) => s.followPlayhead)
  const setFollowPlayhead = useTimelineStore((s) => s.setFollowPlayhead)
  const playheadSeconds = React.useMemo(() => playheadFrame / 30, [playheadFrame])
  React.useEffect(() => {
    setCurrentTime(playheadSeconds)
  }, [playheadSeconds, setCurrentTime])

  // Track scroll position for playhead overlay
  React.useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    let raf: number | undefined
    const handleScroll = () => {
      if (raf) return
      raf = window.requestAnimationFrame(() => {
        setScrollLeft(el.scrollLeft)
        raf && window.cancelAnimationFrame(raf)
        raf = undefined
      })
    }

    setScrollLeft(el.scrollLeft)
    el.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      el.removeEventListener('scroll', handleScroll)
      raf && window.cancelAnimationFrame(raf)
    }
  }, [])

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

  // Auto-scroll when playback is active
  React.useEffect(() => {
    const el = scrollRef.current
    if (!el || playRate === 0 || !followPlayhead) return
    const x = currentTime * zoom
    const start = el.scrollLeft
    const end = start + el.clientWidth
    const margin = 20
    if (x < start + margin) {
      el.scrollLeft = Math.max(0, x - margin)
    } else if (x > end - margin) {
      el.scrollLeft = x - el.clientWidth + margin
    }
  }, [currentTime, playRate, followPlayhead, zoom])

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
            const label = tracks[laneIndex]?.label ?? ''
            return (
              <div
                key={laneIndex}
                className={`${heightClass} flex items-center justify-center border-b border-white/10 text-xs text-gray-300 font-ui-medium`}
              >
                {label}
              </div>
            )
          })}
        </div>
        {/* Ruler and tracks */}
        <div className="flex-1 overflow-hidden">
          {/* Numeric time ruler */}
          <TimeRuler scrollContainerRef={scrollRef} pixelsPerSecond={zoom} duration={duration} />
          {/* Track area with overlay */}
          <div className="relative" style={{ height: trackAreaHeight }}>
            <div
              ref={scrollRef}
              className="relative h-full overflow-x-scroll overflow-y-auto bg-panel-bg cursor-grab"
            >
              <div className="relative h-full flex flex-col" style={{ width: duration * zoom }}>
                {renderedTracks}
                <GhostCuts pixelsPerSecond={zoom} height="100%" />
              </div>
            </div>
            <Playhead
              positionSeconds={playheadSeconds}
              pixelsPerSecond={zoom}
              height="100%"
              offsetX={scrollLeft}
            />
          </div>
        </div>
      </div>
      {/* Zoom level indicator */}
      {showZoomIndicator && (
        <div className="absolute top-2 right-2 bg-gray-800/80 px-2 py-1 rounded text-xs font-ui-medium">
          {Math.round((zoom / initialZoom.current) * 100)}%
        </div>
      )}
      {/* Zoom slider and follow toggle */}
      <div className="absolute top-8 right-2 flex items-center space-x-2">
        <ZoomSlider value={zoom} onChange={setZoom} />
        <Button
          variant="secondary"
          className="px-2 py-1 text-xs"
          onClick={() => setFollowPlayhead(!followPlayhead)}
        >
          {followPlayhead ? 'Unfollow' : 'Follow'}
        </Button>
      </div>
    </div>
  )
})

Timeline.displayName = 'Timeline'
