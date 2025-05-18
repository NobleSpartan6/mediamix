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
export const TimeRuler: React.FC<TimeRulerProps> = ({
  scrollContainerRef,
  pixelsPerSecond,
  duration,
}) => {
  const [scrollLeft, setScrollLeft] = React.useState(0)
  const requestRef = React.useRef<number>()
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const containerRef = React.useRef<HTMLDivElement>(null)

  // Attach scroll listener to keep local scrollLeft state in sync
  React.useEffect(() => {
    const el = scrollContainerRef.current
    if (!el) return

    const handleScroll = () => {
      if (requestRef.current) return
      requestRef.current = window.requestAnimationFrame(() => {
        setScrollLeft(el.scrollLeft)
        requestRef.current &&
          window.cancelAnimationFrame(requestRef.current)
        requestRef.current = undefined
      })
    }

    setScrollLeft(el.scrollLeft)

    el.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      el.removeEventListener('scroll', handleScroll)
      requestRef.current && window.cancelAnimationFrame(requestRef.current)
    }
  }, [scrollContainerRef])

  const beats = useTimelineStore((state: TimelineState) => state.beats)

  const draw = React.useCallback(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const w = container.clientWidth
    const h = container.clientHeight
    const dpr = window.devicePixelRatio || 1
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

    const firstVisibleSec = Math.floor(scrollLeft / pixelsPerSecond)
    const lastVisibleSec = Math.ceil((scrollLeft + w) / pixelsPerSecond)

    ctx.strokeStyle = '#4B5563' // gray-600
    ctx.fillStyle = '#D1D5DB' // gray-300 for text
    ctx.font = '10px monospace'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'

    for (let s = firstVisibleSec; s <= lastVisibleSec; s += 1) {
      const x = s * pixelsPerSecond - scrollLeft + 0.5
      ctx.strokeStyle = '#4B5563'
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, h)
      ctx.stroke()

      ctx.fillStyle = '#D1D5DB'
      ctx.fillText(formatTimecode(s), x, 0)

      if (pixelsPerSecond >= 60) {
        ctx.strokeStyle = '#374151' // gray-700
        for (let f = 10; f < 30; f += 10) {
          const subX = (s + f / 30) * pixelsPerSecond - scrollLeft + 0.5
          ctx.beginPath()
          ctx.moveTo(subX, h / 2)
          ctx.lineTo(subX, h)
          ctx.stroke()
        }
      }
    }

    if (beats && beats.length > 0) {
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

  React.useEffect(() => {
    const id = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(id)
  }, [draw])

  // Tooltip state ------------------------------------------------------------
  const [tooltip, setTooltip] = React.useState<{ visible: boolean; x: number; time: number }>({
    visible: false,
    x: 0,
    time: 0,
  })

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
        <canvas ref={canvasRef} className="block h-full w-full" />
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
