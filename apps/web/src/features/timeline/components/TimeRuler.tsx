import * as React from 'react'
import { useTimelineStore } from '../../../state/timelineStore'
import type { TimelineState } from '../../../state/timelineStore'

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

/** Props for {@link TimeRuler}. */
interface TimeRulerProps {
  /** Scroll container ref to stay in-sync with timeline scrolling */
  scrollContainerRef: React.RefObject<HTMLDivElement>
  /** How many horizontal pixels represent one second */
  pixelsPerSecond: number
  /** Total timeline duration in seconds (defines full ruler width) */
  duration: number
}

/* -------------------------------------------------------------------------- */
/* Hooks                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Keeps `scrollLeft` state in sync with a scroll container without
 * triggering excessive re-renders (throttled with `requestAnimationFrame`).
 *
 * @param ref reference to the scrollable element
 * @returns current scrollLeft value
 */
function useScrollLeft(ref: React.RefObject<HTMLDivElement>) {
  const [scrollLeft, setScrollLeft] = React.useState(0)
  const raf = React.useRef<number>()

  React.useEffect(() => {
    const el = ref.current
    if (!el) return

    const onScroll = () => {
      if (raf.current) return
      raf.current = requestAnimationFrame(() => {
        setScrollLeft(el.scrollLeft)
        if (raf.current) cancelAnimationFrame(raf.current)
        raf.current = undefined
      })
    }

    // initialise + listen
    setScrollLeft(el.scrollLeft)
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      el.removeEventListener('scroll', onScroll)
      if (raf.current) cancelAnimationFrame(raf.current)
    }
  }, [ref])

  return scrollLeft
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Convert seconds to a HH:MM:SS.FF timecode string at 30fps.
 *
 * @param seconds time in seconds
 * @returns formatted timecode
 */
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

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Canvas-based ruler displaying time ticks and optional beat markers.
 *
 * @param scrollContainerRef reference to the synced scroll container
 * @param pixelsPerSecond zoom scale for drawing ticks
 * @param duration total timeline duration in seconds
 * @returns React element with a canvas ruler
 */
export const TimeRuler: React.FC<TimeRulerProps> = ({
  scrollContainerRef,
  pixelsPerSecond,
  duration,
}) => {
  /* --------------- state & refs --------------------------------------- */
  const beats = useTimelineStore((s: TimelineState) => s.beats)
  const scrollLeft = useScrollLeft(scrollContainerRef)

  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const containerRef = React.useRef<HTMLDivElement>(null)

  const [tooltip, setTooltip] = React.useState<{
    visible: boolean
    x: number
    time: number
  }>({ visible: false, x: 0, time: 0 })

  /* --------------- drawing logic -------------------------------------- */
  const draw = React.useCallback(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const w = container.clientWidth
    const h = container.clientHeight
    const dpr = window.devicePixelRatio || 1

    /* Ensure backing resolution matches DPI / container size */
    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.width = w * dpr
      canvas.height = h * dpr
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
    }

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.save()
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, w, h)

    ctx.font = '10px monospace'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'

    const firstSec = Math.floor(scrollLeft / pixelsPerSecond)
    const lastSec = Math.ceil((scrollLeft + w) / pixelsPerSecond)

    for (let sec = firstSec; sec <= lastSec; sec++) {
      const x = sec * pixelsPerSecond - scrollLeft + 0.5

      /* major tick */
      ctx.strokeStyle = '#4B5563'
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, h)
      ctx.stroke()

      /* label */
      ctx.fillStyle = '#D1D5DB'
      ctx.fillText(formatTimecode(sec), x, 0)

      /* minor ticks (every 10 frames) if zoomed in enough */
      if (pixelsPerSecond >= 60) {
        ctx.strokeStyle = '#374151'
        for (let f = 10; f < 30; f += 10) {
          const subX = (sec + f / 30) * pixelsPerSecond - scrollLeft + 0.5
          ctx.beginPath()
          ctx.moveTo(subX, h / 2)
          ctx.lineTo(subX, h)
          ctx.stroke()
        }
      }
    }

    /* beat markers */
    if (beats?.length) {
      ctx.strokeStyle = 'rgba(78,140,255,0.2)'
      beats.forEach((b) => {
        const x = b * pixelsPerSecond - scrollLeft + 0.5
        if (x < 0 || x > w) return
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, h)
        ctx.stroke()
      })
    }

    ctx.restore()
  }, [beats, pixelsPerSecond, scrollLeft])

  /* Schedule draw each frame when dependencies change */
  React.useEffect(() => {
    const id = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(id)
  }, [draw])

  /* --------------- tooltip handlers ----------------------------------- */
  const onMouseMove = React.useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect()
      const localX = e.clientX - rect.left
      const absoluteX = localX + scrollLeft
      setTooltip({
        visible: true,
        x: localX,
        time: absoluteX / pixelsPerSecond,
      })
    },
    [pixelsPerSecond, scrollLeft],
  )

  /* --------------- render --------------------------------------------- */
  return (
    <div
      ref={containerRef}
      className="relative h-6 select-none border-b border-white/10 bg-panel-bg"
      onMouseMove={onMouseMove}
      onMouseLeave={() =>
        setTooltip((prev) => ({ ...prev, visible: false }))
      }
    >
      {/* spacer gives canvas its scrollable width */}
      <div style={{ width: duration * pixelsPerSecond }}>
        <canvas ref={canvasRef} className="block h-full w-full" />
      </div>

      {/* hover timecode tooltip */}
      {tooltip.visible && (
        <div
          className="pointer-events-none absolute -top-6 rounded bg-gray-800/90 px-1 py-0.5 font-mono text-[10px] text-white"
          style={{ left: tooltip.x }}
        >
          {formatTimecode(tooltip.time)}
        </div>
      )}
    </div>
  )
}

TimeRuler.displayName = 'TimeRuler'
