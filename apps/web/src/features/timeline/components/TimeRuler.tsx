import * as React from 'react'
import { useTimelineStore } from '../../../state/timelineStore'
import type { TimelineState } from '../../../state/timelineStore'

interface TimeRulerProps {
  /** Reference to the horizontal scroll container so we can sync tick offset */
  scrollContainerRef: React.RefObject<HTMLDivElement>
  /** zoom factor – how many horizontal pixels represent one second */
  pixelsPerSecond: number
  /** Total timeline duration in seconds. Used to compute full ruler width. */
  duration: number
}

// Utility to format seconds into HH:MM:SS.FF (30fps) timecode
const formatTimecode = (seconds: number) => {
  const fps = 30
  const totalFrames = Math.round(seconds * fps)
  const frames = totalFrames % fps
  const totalSeconds = Math.floor(totalFrames / fps)
  const secs = totalSeconds % 60
  const mins = Math.floor(totalSeconds / 60) % 60
  const hrs = Math.floor(totalSeconds / 3600)
  const pad = (n: number, l = 2) => n.toString().padStart(l, '0')
  return `${pad(hrs)}:${pad(mins)}:${pad(secs)}.${pad(frames)}`
}

/**
 * TimeRuler – draws tick-marks (major each second, minor each frame @ 30 fps) that
 * scroll in sync with the timeline content. The component is purely visual and
 * intentionally kept lightweight to avoid expensive re-renders. It re-computes
 * visible ticks at most once per rAF via a scroll listener.
 */
export const TimeRuler: React.FC<TimeRulerProps> = ({ scrollContainerRef, pixelsPerSecond, duration }) => {
  const [scrollLeft, setScrollLeft] = React.useState(0)
  const [width, setWidth] = React.useState(0)
  const requestRef = React.useRef<number>()

  // Attach scroll listener to keep local scrollLeft state in sync
  React.useEffect(() => {
    const el = scrollContainerRef.current
    if (!el) return

    const handleScroll = () => {
      // Throttle updates with rAF to avoid flooding React state updates
      if (requestRef.current) return
      requestRef.current = window.requestAnimationFrame(() => {
        setScrollLeft(el.scrollLeft)
        setWidth(el.clientWidth)
        requestRef.current && window.cancelAnimationFrame(requestRef.current)
        requestRef.current = undefined
      })
    }

    // initial measure
    setScrollLeft(el.scrollLeft)
    setWidth(el.clientWidth)

    el.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      el.removeEventListener('scroll', handleScroll)
      requestRef.current && window.cancelAnimationFrame(requestRef.current)
    }
  }, [scrollContainerRef])

  // Compute visible second range
  const firstVisibleSec = Math.floor(scrollLeft / pixelsPerSecond)
  const lastVisibleSec = Math.ceil((scrollLeft + width) / pixelsPerSecond)

  const ticks = [] as React.ReactElement[]

  for (let s = firstVisibleSec; s <= lastVisibleSec; s += 1) {
    const xPos = s * pixelsPerSecond
    // Major tick every 1 second (height 100%)
    ticks.push(
      <div
        key={`major-${s}`}
        className="absolute top-0 w-px bg-gray-600"
        style={{ height: '100%', transform: `translateX(${xPos}px)` }}
      />,
    )

    // Second label (mono 10px) – place slightly above the major tick
    ticks.push(
      <span
        key={`label-${s}`}
        className="absolute -top-0.5 translate-x-1/2 font-mono text-[10px] text-gray-300 select-none pointer-events-none"
        style={{ transform: `translateX(${xPos}px)` }}
      >
        {formatTimecode(s)}
      </span>,
    )

    // Minor ticks every 10 frames (approx 0.333s @ 30fps) only when zoomed in enough
    if (pixelsPerSecond >= 60) {
      for (let f = 10; f < 30; f += 10) {
        const subX = (s + f / 30) * pixelsPerSecond
        ticks.push(
          <div
            key={`minor-${s}-${f}`}
            className="absolute top-1/2 w-px bg-gray-700"
            style={{ height: '50%', transform: `translateX(${subX}px)` }}
          />,
        )
      }
    }
  }

  // --- Beat tick lines ------------------------------------------------------
  const beats = useTimelineStore((state: TimelineState) => state.beats)
  const beatElements = React.useMemo(() => {
    if (!beats || beats.length === 0) return []
    return beats.map((b: number) => (
      <div
        key={`beat-${b}`}
        className="absolute top-0 w-px bg-accent/20"
        style={{ height: '100%', transform: `translateX(${b * pixelsPerSecond}px)` }}
      />
    ))
  }, [beats, pixelsPerSecond])

  // Tooltip state ------------------------------------------------------------
  const [tooltip, setTooltip] = React.useState<{ visible: boolean; x: number; time: number }>({
    visible: false,
    x: 0,
    time: 0,
  })

  const containerRef = React.useRef<HTMLDivElement>(null)

  // Mouse move handler to update tooltip position/time
  const handleMouseMove = React.useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect()
      const x = e.clientX - rect.left + scrollLeft
      const time = x / pixelsPerSecond
      setTooltip({ visible: true, x: e.clientX - rect.left, time })
    },
    [pixelsPerSecond, scrollLeft],
  )
  const handleMouseLeave = () => setTooltip((t) => ({ ...t, visible: false }))

  return (
    <div
      ref={containerRef}
      className="relative h-6 select-none border-b border-white/10 bg-panel-bg"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* total width spacer to make ruler scrollable */}
      <div style={{ width: duration * pixelsPerSecond }}>
        {/* tick container */}
        <div className="relative h-full w-full">
          {ticks}
          {beatElements}
        </div>
      </div>
      {/* Hover tooltip */}
      {tooltip.visible && (
        <div
          className="pointer-events-none absolute -top-6 bg-gray-800/90 text-[10px] font-mono text-white px-1 py-0.5 rounded"
          style={{ left: tooltip.x }}
        >
          {formatTimecode(tooltip.time)}
        </div>
      )}
    </div>
  )
}

TimeRuler.displayName = 'TimeRuler' 
