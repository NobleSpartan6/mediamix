import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, act } from '@testing-library/react'
import React from 'react'

import { useZoomScroll } from '../../features/timeline/hooks/useZoomScroll'

// Simple component using the hook with a scrollable div
function TestComponent() {
  const [zoom, setZoom] = React.useState(100)
  const ref = React.useRef<HTMLDivElement>(null)
  useZoomScroll(ref, zoom, setZoom, { minZoom: 50, maxZoom: 200, zoomStep: 0.01 })
  return (
    <div
      ref={ref}
      data-testid="scroll"
      data-zoom={zoom}
      style={{ width: '200px', overflowX: 'scroll' }}
    >
      <div style={{ width: '1000px', height: '20px' }} />
    </div>
  )
}

// Stub requestAnimationFrame so timers control updates
const rafStub = () => {
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    return setTimeout(() => cb(performance.now()), 16) as unknown as number
  })
  vi.stubGlobal('cancelAnimationFrame', (id: number) => clearTimeout(id))
}

const createPointerEvent = (type: string, options: PointerEventInit = {}) => {
  let event: Event
  if (typeof PointerEvent === 'function') {
    event = new PointerEvent(type, { bubbles: true, cancelable: true, ...options })
  } else {
    event = new MouseEvent(type, { bubbles: true, cancelable: true, ...options })
    Object.assign(event, { pointerId: options.pointerId })
  }
  return event
}

describe('useZoomScroll', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    rafStub()
    ;(HTMLElement.prototype as any).setPointerCapture = vi.fn()
    ;(HTMLElement.prototype as any).releasePointerCapture = vi.fn()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('updates zoom and keeps position under cursor on ctrl+wheel', () => {
    const { getByTestId } = render(<TestComponent />)
    const el = getByTestId('scroll') as HTMLDivElement
    // Provide bounding box for coordinate math
    el.getBoundingClientRect = () => ({
      left: 0,
      top: 0,
      width: 200,
      height: 20,
      right: 200,
      bottom: 20,
      x: 0,
      y: 0,
      toJSON() {},
    })
    el.scrollLeft = 50

    act(() => {
      el.dispatchEvent(
        new WheelEvent('wheel', {
          ctrlKey: true,
          deltaY: -50,
          clientX: 100,
          bubbles: true,
          cancelable: true,
        }),
      )
      vi.advanceTimersByTime(20)
    })

    expect(Number(el.dataset.zoom)).toBeCloseTo(150)
    expect(el.scrollLeft).toBeCloseTo(125)
  })

  it('pans horizontally on pointer drag', () => {
    const { getByTestId } = render(<TestComponent />)
    const el = getByTestId('scroll') as HTMLDivElement
    el.getBoundingClientRect = () => ({
      left: 0,
      top: 0,
      width: 200,
      height: 20,
      right: 200,
      bottom: 20,
      x: 0,
      y: 0,
      toJSON() {},
    })
    el.scrollLeft = 100

    act(() => {
      el.dispatchEvent(
        createPointerEvent('pointerdown', {
          clientX: 100,
          pointerId: 1,
          button: 0,
        }),
      )
      el.dispatchEvent(
        createPointerEvent('pointermove', {
          clientX: 50,
          pointerId: 1,
        }),
      )
      vi.advanceTimersByTime(20)
    })

    expect(el.scrollLeft).toBeCloseTo(150)
  })
})
