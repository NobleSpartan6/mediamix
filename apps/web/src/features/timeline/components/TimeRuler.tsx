import * as React from 'react'

interface TimeRulerProps {
  /** Reference to the horizontal scroll container so we can sync tick offset */
  scrollContainerRef: React.RefObject<HTMLDivElement>
  /** zoom factor – how many horizontal pixels represent one second */
  pixelsPerSecond: number
  /** Total timeline duration in seconds. Used to compute full ruler width. */
  duration: number
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

    // Minor ticks every 10 frames (approx 0.333s @ 30fps) only when zoomed in enough
    if (pixelsPerSecond >= 60) {
      for (let f = 1; f < 30; f += 10) {
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

  return (
    <div className="relative h-6 select-none border-b border-white/10 bg-panel-bg">
      {/* total width spacer to make ruler scrollable */}
      <div style={{ width: duration * pixelsPerSecond }}>
        {/* tick container absolutely positioned to avoid extra layout cost */}
        <div className="relative h-full w-full">{ticks}</div>
      </div>
    </div>
  )
}

TimeRuler.displayName = 'TimeRuler' 