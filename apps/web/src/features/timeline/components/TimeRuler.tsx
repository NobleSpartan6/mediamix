import * as React from 'react'
import { useTimelineStore } from '../../../state/timelineStore'
import type { TimelineState } from '../../../state/timelineStore'

interface TimeRulerProps {
  /** Reference to the horizontal scroll container so we can sync tick offset */
  scrollContainerRef: React.RefObject<HTMLDivElement>
  /** Zoom factor – how many horizontal pixels represent one second */
  pixelsPerSecond: number
  /** Total timeline duration in seconds. Used to compute full ruler width. */
  duration: number
}

/* ------------------------------------------------------------------------ */
/* Utility: convert seconds → HH:MM:SS.FF (30 fps)                          */
/* ------------------------------------------------------------------------ */
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

/* ------------------------------------------------------------------------ */
/* TimeRuler: Canvas-based tick / timecode ruler                            */
/* ------------------------------------------------------------------------ */
export const TimeRuler: React.FC<TimeRulerProps> = ({
  scrollContainerRef,
  pixelsPerSecond,
  duration,
}) => {
  const beats = useTimelineStore((s: TimelineState) => s.beats)

  /* ------------------------------ state --------------------------------- */
  const [scrollLeft, setScrollLeft] = React.useState(0)
  const requestRef = React.useRef<number>()
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const containerRef = React.useRef<HTMLDivElement>(null)

  /* --------------------- keep scrollLeft in sync ------------------------ */
  React.useEffect(() => {
    const el = scrollContainerRef.current
    if (!el) return

    const onScroll = () => {
      if (requestRef.current) return
      requestRef.current = window.requestAnimationFrame(() => {
        setScrollLeft(el.scrollLeft)
        if (requestRef.current) {
          window.cancelAnimationFrame(requestRef.current)
          requestRef.current = undefined
        }
      })
    }

    /* initialise + listen */
    setScrollLeft(el.scrollLeft)
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      el.removeEventListener('scroll', onScroll)
      if (requestRef.current)
        window.cancelAnimationFrame(requestRef.current)
    }
  }, [scrollContainerRef])

  /* ----------------------------- draw loop ------------------------------ */
  const draw = React.useCallback(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const w = container.clientWidth
    const h = container.clientHeight
    const dpr = window.devicePixelRatio || 1

    /* resize backing canvas on DPI / container changes */
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

    /* style setup */
    ctx.font = '10px monospace'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'

    for (let s = firstVisibleSec; s <= lastVisibleSec; s += 1) {
      const x = s * pixelsPerSecond - scrollLeft + 0.5

      /* major tick */
      ctx.strokeStyle = '#4B5563' // gray-600
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, h)
      ctx.stroke()

      /* label */
      ctx.fillStyle = '#D1D5DB' // gray-300
      ctx.fillText(formatTimecode(s), x, 0)

      /* minor ticks (every 10 frames) when sufficiently zoomed */
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

    /* optional beat markers */
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

  /* schedule draw every frame */
  React.useEffect(() => {
    const id = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(id)
  }, [draw])

  /* ------------------------------ tooltip ------------------------------- */
  const [tooltip, setTooltip] = React.useState<{
    visible: boolean
    x: number
    time: number
  }>({ visible: false, x: 0, time: 0 })

  const handleMouseMove = React.useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect()
      const localX = e.clientX - rect.left
      const absoluteX = localX + scrollLeft
      const time = absoluteX / pixelsPerSecond
      setTooltip({ visible: true, x: localX, time })
    },
    [pixelsPerSecond, scrollLeft],
  )
  const handleMouseLeave = () =>
    setTooltip((t) => ({ ...t, visible: false }))

  /* ------------------------------ render -------------------------------- */
  return (
    <div
      ref={containerRef}
      className="relative h-6 select-none border-b border-white/10 bg-panel-bg"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
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
