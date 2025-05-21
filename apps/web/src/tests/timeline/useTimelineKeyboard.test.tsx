import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, fireEvent, act, waitFor } from '@testing-library/react'
import { Timeline } from '../../features/timeline/components/Timeline'
import { useTransportStore } from '../../state/transportStore'
import { useTimelineStore } from '../../state/timelineStore'

// Stub Moveable which requires browser APIs
vi.mock('react-moveable', () => ({
  __esModule: true,
  default: () => null,
}))

// Polyfill ResizeObserver for JSDOM
class DummyResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
// @ts-ignore
global.ResizeObserver = global.ResizeObserver || DummyResizeObserver

const resetStores = () => {
  useTimelineStore.setState({
    clipsById: {},
    tracks: [],
    durationSec: 0,
    currentTime: 0,
    followPlayhead: true,
    inPoint: null,
    outPoint: null,
    beats: [],
  })
  useTransportStore.setState({ playRate: 0, playheadFrame: 0 })
}

describe('useTimelineKeyboard', () => {
  afterEach(() => {
    resetStores()
    vi.restoreAllMocks()
  })

  it('updates stores based on keyboard shortcuts', async () => {
    act(() => {
      useTimelineStore.getState().addClip({ id: undefined as never, start: 0, end: 4, lane: 0 })
    })
    useTransportStore.setState({ playheadFrame: 30 })
    const splitSpy = vi.spyOn(useTimelineStore.getState(), 'splitClipAt')

    render(<Timeline pixelsPerSecond={100} />)

    fireEvent.keyDown(window, { key: 'l' })
    expect(useTransportStore.getState().playRate).toBeGreaterThan(0)

    fireEvent.keyDown(window, { key: 'j' })
    expect(useTransportStore.getState().playRate).toBeLessThan(0)

    fireEvent.keyDown(window, { key: 'k' })
    expect(useTransportStore.getState().playRate).toBe(0)

    fireEvent.keyDown(window, { key: ' ' })
    expect(useTransportStore.getState().playRate).toBe(1)

    fireEvent.keyDown(window, { key: ' ' })
    expect(useTransportStore.getState().playRate).toBe(0)

    fireEvent.keyDown(window, { key: 'ArrowRight' })
    // arrow right jogs the playhead by one frame
    await waitFor(() => {
      expect(useTransportStore.getState().playheadFrame).toBeGreaterThan(30)
    })

    fireEvent.keyDown(window, { key: 'i' })
    expect(useTimelineStore.getState().inPoint).toBeCloseTo(
      useTransportStore.getState().playheadFrame / 30,
    )

    useTransportStore.setState({ playheadFrame: 45 })
    await waitFor(() => {
      expect(useTransportStore.getState().playheadFrame).toBe(45)
    })
    fireEvent.keyDown(window, { key: 'o' })
    expect(useTimelineStore.getState().outPoint).toBeCloseTo(45 / 30)

    fireEvent.keyDown(window, { key: 'c' })
    expect(splitSpy).toHaveBeenCalledWith(45 / 30)
  })
})
