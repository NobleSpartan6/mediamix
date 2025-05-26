import * as React from 'react'
import type { Clip } from '../../state/timelineStore'
import { useTimelineStore } from '../../state/timelineStore'
import { useTransportStore } from '../../state/transportStore'
import { usePlaybackTicker } from '../../state/playbackTicker'
import { useClipsArray } from './hooks/useClipsArray'
import { useTimelineKeyboard } from './hooks/useTimelineKeyboard'
import { useZoomScroll } from './hooks/useZoomScroll'
import { useViewStore } from '../../state/viewStore'
import { TimeRuler } from './components/TimeRuler'
import { TracksContainer } from './TracksContainer'
import { TimelineToolbar } from './TimelineToolbar'

interface TimelinePanelProps {
  pixelsPerSecond?: number
}

export const TimelinePanel: React.FC<TimelinePanelProps> = React.memo(({ pixelsPerSecond = 100 }) => {
  const zoom = useViewStore((s) => s.timelineZoom)
  const setZoom = useViewStore((s) => s.setTimelineZoom)
  const scrollRef = React.useRef<HTMLDivElement>(null)
  useZoomScroll(scrollRef, zoom, setZoom, { minZoom: 20, maxZoom: 500, zoomStep: 0.002 })
  React.useEffect(() => {
    setZoom(pixelsPerSecond)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const [scrollLeft, setScrollLeft] = React.useState(0)

  const clips = useClipsArray()
  const tracks = useTimelineStore((s) => s.tracks)
  const beats = useTimelineStore((s) => s.beats)

  const playheadFrame = useTransportStore((s) => s.playheadFrame)
  const playRate = useTransportStore((s) => s.playRate)
  const playing = playRate !== 0
  const setCurrentTime = useTimelineStore((s) => s.setCurrentTime)
  const currentTime = useTimelineStore((s) => s.currentTime)
  const followPlayhead = useTimelineStore((s) => s.followPlayhead)
  const inPoint = useTimelineStore((s) => s.inPoint)
  const outPoint = useTimelineStore((s) => s.outPoint)

  const playheadSeconds = React.useMemo(() => playheadFrame / 30, [playheadFrame])
  React.useEffect(() => {
    setCurrentTime(playheadSeconds)
  }, [playheadSeconds, setCurrentTime])

  const laneMap = React.useMemo(() => {
    const map = new Map<number, Clip[]>()
    clips.forEach((clip) => {
      const arr = map.get(clip.lane) ?? []
      arr.push(clip)
      map.set(clip.lane, arr)
    })
    return map
  }, [clips])

  const handleBackgroundPointerDown = React.useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const target = e.target as HTMLElement
      if (!target.closest('.clip')) {
        useTimelineStore.getState().setSelectedClips([])
      }
      startScrub(e)
    },
    [],
  )

  // scrubbing logic
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
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.button !== 0) return
      scrubRef.current = true
      scrub(e)
      document.addEventListener('pointermove', scrub)
      document.addEventListener('pointerup', stopScrub)
    },
    [scrub, stopScrub],
  )

  const handleScroll = React.useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setScrollLeft(el.scrollLeft)
  }, [])

  React.useEffect(() => {
    if (scrollRef.current) {
      setScrollLeft(scrollRef.current.scrollLeft)
    }
  }, [])

  const duration = React.useMemo(() => {
    if (clips.length === 0) return 60
    return clips.reduce((max, c) => Math.max(max, c.end), 0)
  }, [clips])

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

  const [showZoomIndicator, setShowZoomIndicator] = React.useState(false)
  const indicatorTimeout = React.useRef<number | null>(null)
  React.useEffect(() => {
    setShowZoomIndicator(true)
    if (indicatorTimeout.current) clearTimeout(indicatorTimeout.current)
    indicatorTimeout.current = window.setTimeout(() => {
      setShowZoomIndicator(false)
      indicatorTimeout.current = null
    }, 800)
  }, [zoom])

  useTimelineKeyboard()
  usePlaybackTicker()

  return (
    <div className="w-full select-none relative">
      <div className="flex-1 overflow-hidden">
        <TimeRuler scrollContainerRef={scrollRef} pixelsPerSecond={zoom} duration={duration} />
        <div className="flex overflow-y-auto">
          <div className="flex flex-col shrink-0">
            <div className="h-6" />
            {tracks.map((track) => {
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
          <TracksContainer
            pixelsPerSecond={zoom}
            scrollRef={scrollRef}
            tracks={tracks}
            laneMap={laneMap}
            duration={duration}
            beats={beats}
            inPoint={inPoint}
            outPoint={outPoint}
            playheadSeconds={playheadSeconds}
            playing={playing}
            scrollLeft={scrollLeft}
            onBackgroundPointerDown={handleBackgroundPointerDown}
            onScrubStart={startScrub}
            onScroll={handleScroll}
          />
        </div>
      </div>
      {showZoomIndicator && (
        <div className="absolute top-2 right-2 bg-gray-800/80 px-2 py-1 rounded text-xs font-ui-medium">
          {Math.round((zoom / pixelsPerSecond) * 100)}%
        </div>
      )}
      <div className="absolute top-8 right-2">
        <TimelineToolbar zoom={zoom} onZoomChange={setZoom} />
      </div>
    </div>
  )
})

TimelinePanel.displayName = 'TimelinePanel'
