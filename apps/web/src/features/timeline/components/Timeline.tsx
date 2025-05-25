import * as React from 'react'

import { useTimelineStore } from '../../../state/timelineStore'
import type { Clip as ClipType } from '../../../state/timelineStore'
import { TimeRuler } from './TimeRuler'
import { Playhead } from './Playhead'
import { TrackRow } from './TrackRow'
import { useTransportStore } from '../../../state/transportStore'
import { usePlaybackTicker } from '../../../state/playbackTicker'
import { useBeatSlices } from '../hooks/useBeatSlices'
import { useClipsArray } from '../hooks/useClipsArray'
import { useTimelineKeyboard } from '../hooks/useTimelineKeyboard'
import { useZoomScroll } from '../hooks/useZoomScroll'
import { ZoomSlider } from './ZoomSlider'
import { Button } from '../../../components/ui/Button'

/** Props for the {@link Timeline} component. */
interface TimelineProps {
  /**
   * Initial zoom level – number of horizontal pixels that represent one second
   * of timeline time.
   */
  pixelsPerSecond?: number
}

/**
 * Main timeline container displaying tracks, clips and the playhead.
 *
 * @param pixelsPerSecond initial zoom level in pixels per second
 * @returns React element containing the entire timeline UI
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
  const beats = useTimelineStore((s) => s.beats)

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
  const playing = playRate !== 0
  const setCurrentTime = useTimelineStore((s) => s.setCurrentTime)
  const currentTime = useTimelineStore((s) => s.currentTime)
  const followPlayhead = useTimelineStore((s) => s.followPlayhead)
  const setFollowPlayhead = useTimelineStore((s) => s.setFollowPlayhead)
  const splitClipAt = useTimelineStore((s) => s.splitClipAt)
  const removeClip = useTimelineStore((s) => s.removeClip)
  const selectedIds = useTimelineStore((s) => s.selectedClipIds)
  const setSelected = useTimelineStore((s) => s.setSelectedClips)
  const playheadSeconds = React.useMemo(() => playheadFrame / 30, [playheadFrame])
  React.useEffect(() => {
    setCurrentTime(playheadSeconds)
  }, [playheadSeconds, setCurrentTime])

  // -- Scrubbing -------------------------------------------------------------
  const scrubRef = React.useRef(false)
  const scrub = React.useCallback(
    (e: PointerEvent | React.PointerEvent) => {
      if (!scrollRef.current) return
      const rect = scrollRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left + scrollRef.current.scrollLeft
      const time = x / zoom
      setCurrentTime(Math.max(0, time))
    },
    [setCurrentTime, zoom],
  )

  const stopScrub = React.useCallback(() => {
    if (!scrubRef.current) return
    scrubRef.current = false
    document.removeEventListener('pointermove', scrub)
    document.removeEventListener('pointerup', stopScrub)
  }, [scrub])

  const startScrub = React.useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0) return
      scrubRef.current = true
      scrub(e)
      document.addEventListener('pointermove', scrub)
      document.addEventListener('pointerup', stopScrub)
    },
    [scrub, stopScrub],
  )

  // Track scroll position for playhead overlay
  const scrollRaf = React.useRef<number>()
  const handleScroll = React.useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    if (scrollRaf.current) return
    scrollRaf.current = window.requestAnimationFrame(() => {
      setScrollLeft(el.scrollLeft)
      if (scrollRaf.current) {
        window.cancelAnimationFrame(scrollRaf.current)
        scrollRaf.current = undefined
      }
    })
  }, [])

  React.useEffect(() => {
    if (scrollRef.current) {
      setScrollLeft(scrollRef.current.scrollLeft)
    }
    return () => {
      if (scrollRaf.current) {
        window.cancelAnimationFrame(scrollRaf.current)
      }
    }
  }, [])

  // Compute timeline duration as the furthest clip end (fallback 60s)
  const duration = React.useMemo(() => {
    if (clips.length === 0) return 60
    return clips.reduce((max, c) => Math.max(max, c.end), 0)
  }, [clips])

  // Group clips by lane index
  const laneMap = React.useMemo(() => {
    const map = new Map<number, ClipType[]>()
    clips.forEach((clip) => {
      const arr = map.get(clip.lane) ?? []
      arr.push(clip)
      map.set(clip.lane, arr)
    })
    return map
  }, [clips])

  const renderedTracks = React.useMemo(
    () =>
      tracks.map((track, laneIndex) => (
        <TrackRow
          key={track.id}
          laneIndex={laneIndex}
          clips={laneMap.get(laneIndex) ?? []}
          pixelsPerSecond={zoom}
          track={track}
        />
      )),
    [tracks, laneMap, zoom],
  )

  // Track area height based on lane types (video lanes taller than audio)
  const trackAreaHeight = React.useMemo(
    () => tracks.reduce((sum, t) => sum + (t.type === 'video' ? 48 : 32), 0),
    [tracks],
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

  const handleSplit = React.useCallback(() => splitClipAt(currentTime), [splitClipAt, currentTime])

  const handleDelete = React.useCallback(() => {
    selectedIds.forEach((id) => removeClip(id))
    if (selectedIds.length > 0) setSelected([])
  }, [removeClip, selectedIds, setSelected])

  useTimelineKeyboard()
  usePlaybackTicker()

  return (
    <div className="w-full select-none relative">
      <div className="flex-1 overflow-hidden">
        {/* Numeric time ruler */}
        <TimeRuler scrollContainerRef={scrollRef} pixelsPerSecond={zoom} duration={duration} />
        {/* Labels and tracks share the same scroll container */}
        <div className="flex overflow-y-auto">
          {/* Left gutter: spacer for ruler then track labels */}
          <div className="flex flex-col shrink-0">
            <div className="h-6" />
            {tracks.map((track, laneIndex) => {
              const heightClass = track.type === 'video' ? 'h-12' : 'h-8'
              return (
                <div
                  key={track.id}
                  className={`${heightClass} flex items-center justify-center border-b border-white/10 text-xs text-gray-300 font-ui-medium`}
                >
                  {track.label}
                </div>
              )
            })}
          </div>
          {/* Track area with overlay */}
          <div className="relative flex-1" style={{ minHeight: trackAreaHeight }}>
            <div
              ref={scrollRef}
              className="relative h-full overflow-x-scroll bg-panel-bg cursor-grab"
              onPointerDown={startScrub}
              onScroll={handleScroll}
            >
              <div className="relative h-full flex flex-col" style={{ width: duration * zoom }}>
                {renderedTracks}
                {beats.map((b) => (
                  <div
                    key={b}
                    className="absolute top-0 bottom-0 w-px bg-accent/20 pointer-events-none"
                    style={{ transform: `translateX(${b * zoom}px)` }}
                  />
                ))}
              </div>
            </div>
            <Playhead
              positionSeconds={playheadSeconds}
              pixelsPerSecond={zoom}
              height="100%"
              offsetX={scrollLeft}
              onPointerDown={startScrub}
              interactive={!playing}
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
        <Button variant="secondary" className="px-2 py-1 text-xs" onClick={handleSplit}>
          Split
        </Button>
        <Button variant="secondary" className="px-2 py-1 text-xs" onClick={handleDelete}>
          Delete
        </Button>
        <Button variant="secondary" className="px-2 py-1 text-xs" onClick={() => setFollowPlayhead(!followPlayhead)}>
          {followPlayhead ? 'Unfollow' : 'Follow'}
        </Button>
      </div>
    </div>
  )
})

Timeline.displayName = 'Timeline'
