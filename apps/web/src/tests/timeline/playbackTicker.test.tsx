import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'

import { usePlaybackTicker } from '../../state/playbackTicker'
import { useTransportStore } from '../../state/transportStore'

const resetStore = () => {
  useTransportStore.setState({ playRate: 0, playheadFrame: 0 })
}

// Helper to stub rAF using fake timers
const rafStub = () => {
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    return setTimeout(() => cb(performance.now()), 16) as unknown as number
  })
  vi.stubGlobal('cancelAnimationFrame', (id: number) => clearTimeout(id))
}

describe('usePlaybackTicker', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(0)
    rafStub()
    resetStore()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('advances playhead when playRate is non-zero', () => {
    const { unmount } = renderHook(() => usePlaybackTicker())

    act(() => {
      useTransportStore.getState().setPlayRate(1)
    })

    vi.advanceTimersByTime(70)

    expect(useTransportStore.getState().playheadFrame).toBeGreaterThan(0)
    unmount()
  })
})
