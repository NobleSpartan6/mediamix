import { useEffect, useRef } from 'react'

/** Optional configuration for {@link useZoomScroll}. */
interface UseZoomScrollOptions {
  /** Minimum allowed zoom level */
  minZoom?: number
  /** Maximum allowed zoom level */
  maxZoom?: number
  /** Increment applied per wheel delta */
  zoomStep?: number
}

/**
 * Enable smooth zooming (Ctrl+wheel or pinch) and drag panning with inertia.
 *
 * @param containerRef ref to the scrollable container element
 * @param zoom current zoom level in pixels per second
 * @param setZoom callback to update the zoom level
 * @param options optional configuration
 */
export function useZoomScroll(
  containerRef: React.RefObject<HTMLElement>,
  zoom: number,
  setZoom: (newZoom: number) => void,
  options: UseZoomScrollOptions = {},
) {
  const { minZoom = 10, maxZoom = 1000, zoomStep = 0.002 } = options
  const frame = useRef<number | null>(null)
  const isDragging = useRef(false)
  const startX = useRef(0)
  const startScrollLeft = useRef(0)
  const velocity = useRef(0)
  const lastPos = useRef(0)
  const lastTime = useRef(0)
  const spacePressed = useRef(false)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        spacePressed.current = true
        e.preventDefault()
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        spacePressed.current = false
        e.preventDefault()
      }
    }

    // Handle zoom via Ctrl+Wheel or pinch gestures
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        // Zoom action: Ctrl/Cmd + wheel
        e.preventDefault()
        const rect = el.getBoundingClientRect()
        const x = e.clientX - rect.left
        const prevZoom = zoom
        let newZoom = prevZoom * (1 - e.deltaY * zoomStep)
        newZoom = Math.min(maxZoom, Math.max(minZoom, newZoom))
        // Maintain position under cursor
        const timeAtCursor = (el.scrollLeft + x) / prevZoom
        const newScrollLeft = timeAtCursor * newZoom - x
        if (frame.current === null) {
          frame.current = requestAnimationFrame(() => {
            setZoom(newZoom)
            el.scrollLeft = newScrollLeft
            frame.current = null
          })
        }
      } else {
        // Pan action: horizontal wheel deltas or Alt+wheel for mouse
        const panDelta = e.deltaX !== 0 ? -e.deltaX : e.deltaY
        if (e.deltaX !== 0 || e.altKey) {
          e.preventDefault()
          if (frame.current === null) {
            frame.current = requestAnimationFrame(() => {
              el.scrollLeft += panDelta
              frame.current = null
            })
          }
        }
        // else: allow default behavior (e.g., page scroll)
      }
    }

    // Handle click-and-drag scrolling
    const handlePointerDown = (e: PointerEvent) => {
      // Start dragging only with middle button or while holding space + left button
      if (!(e.button === 1 || (e.button === 0 && spacePressed.current))) return
      isDragging.current = true
      el.setPointerCapture(e.pointerId)
      startX.current = e.clientX
      startScrollLeft.current = el.scrollLeft
      lastPos.current = e.clientX
      lastTime.current = e.timeStamp
      el.style.cursor = 'grabbing'
      e.preventDefault()
    }

    const handlePointerMove = (e: PointerEvent) => {
      if (!isDragging.current) return
      const delta = e.clientX - startX.current
      // Calculate velocity
      const dt = e.timeStamp - lastTime.current
      if (dt > 0) {
        velocity.current = (lastPos.current - e.clientX) / dt
        lastPos.current = e.clientX
        lastTime.current = e.timeStamp
      }
      if (frame.current === null) {
        frame.current = requestAnimationFrame(() => {
          el.scrollLeft = startScrollLeft.current - delta
          frame.current = null
        })
      }
    }

    const handlePointerUp = (e: PointerEvent) => {
      if (!isDragging.current) return
      isDragging.current = false
      el.releasePointerCapture(e.pointerId)
      el.style.cursor = ''
      // Momentum scrolling
      const momentum = () => {
        velocity.current *= 0.95
        el.scrollLeft += velocity.current * 16
        if (Math.abs(velocity.current) > 0.02) {
          requestAnimationFrame(momentum)
        }
      }
      momentum()
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    el.addEventListener('wheel', handleWheel, { passive: false })
    el.addEventListener('pointerdown', handlePointerDown)
    el.addEventListener('pointermove', handlePointerMove)
    el.addEventListener('pointerup', handlePointerUp)
    el.addEventListener('pointercancel', handlePointerUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      el.removeEventListener('wheel', handleWheel)
      el.removeEventListener('pointerdown', handlePointerDown)
      el.removeEventListener('pointermove', handlePointerMove)
      el.removeEventListener('pointerup', handlePointerUp)
      el.removeEventListener('pointercancel', handlePointerUp)
      if (frame.current) cancelAnimationFrame(frame.current)
    }
  }, [containerRef, zoom, setZoom, minZoom, maxZoom, zoomStep])
} 