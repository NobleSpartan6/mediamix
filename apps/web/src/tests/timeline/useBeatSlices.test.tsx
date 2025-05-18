import { describe, it, expect, afterEach, vi } from 'vitest'
import { act, renderHook, render, waitFor } from '@testing-library/react'

import { useBeatSlices } from '../../features/timeline/hooks/useBeatSlices'
import { Timeline } from '../../features/timeline/components/Timeline'
import { useTimelineStore } from '../../state/timelineStore'

// Helper: reset Zustand store between tests for deterministic state
const resetStore = () => {
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
}

// Provide deterministic IDs so assertions are stable
vi.mock('crypto', () => ({
  randomUUID: () => 'uuid-mock',
}))

describe('useBeatSlices hook', () => {
  afterEach(() => {
    resetStore()
  })

  it('converts beats array into adjacent clip slices', () => {
    // Arrange – populate beats in store
    const beats = [0, 1, 2, 3]
    act(() => {
      useTimelineStore.getState().setBeats(beats)
    })

    // Act – invoke the hook via renderHook
    const { result } = renderHook(() => useBeatSlices())

    // Assert – produces beats.length - 1 slices with expected metadata
    expect(result.current.length).toBe(beats.length - 1)
    expect(result.current[0]).toMatchObject({ start: 0, end: 1, lane: 0 })
    expect(result.current[2]).toMatchObject({ start: 2, end: 3 })
  })
})

describe('Timeline auto-slice side-effect', () => {
  afterEach(() => {
    resetStore()
  })

  it('populates clips in the store when empty and beats are present', async () => {
    // Arrange – beats array present, no clips
    act(() => {
      useTimelineStore.getState().setBeats([0, 0.5, 1])
    })

    // Act – render Timeline component (in JSDOM)
    render(<Timeline pixelsPerSecond={100} />)

    // Assert – wait for effect to commit to store
    await waitFor(() => {
      const { clipsById } = useTimelineStore.getState()
      expect(Object.keys(clipsById).length).toBeGreaterThan(0)
    })
  })
})
