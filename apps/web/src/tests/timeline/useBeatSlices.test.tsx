import { describe, it, expect, afterEach, vi } from 'vitest'
import { act, renderHook, render, waitFor } from '@testing-library/react'

import { useBeatSlices } from '../../features/timeline/hooks/useBeatSlices'
import { Timeline } from '../../features/timeline/components/Timeline'

// Mock react-moveable to avoid dependency errors in tests
vi.mock('react-moveable', () => ({
  __esModule: true,
  default: () => null,
}))

// Polyfill ResizeObserver for JSDOM environment
class DummyResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
// @ts-ignore
global.ResizeObserver = DummyResizeObserver

import { useTimelineStore } from '../../state/timelineStore'

// Stub complex drag/resize library which requires React runtime during tests
vi.mock('react-moveable', () => ({ default: () => null }))


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

  it('distributes slices round-robin across video lanes', () => {
    // Arrange – two video tracks present
    act(() => {
      useTimelineStore.setState({
        tracks: [
          { id: 'track-0', type: 'video', label: 'V1' },
          { id: 'track-1', type: 'audio', label: 'A1' },
          { id: 'track-2', type: 'video', label: 'V2' },
          { id: 'track-3', type: 'audio', label: 'A2' },
        ],
      })
      useTimelineStore.getState().setBeats([0, 1, 2, 3])
    })

    // Act – invoke the hook via renderHook
    const { result } = renderHook(() => useBeatSlices())

    // Assert – lanes alternate between available video tracks
    expect(result.current.map((c) => c.lane)).toEqual([0, 2, 0])
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
