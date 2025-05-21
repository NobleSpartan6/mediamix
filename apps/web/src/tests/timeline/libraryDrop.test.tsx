import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, fireEvent, act, waitFor } from '@testing-library/react'

// Stub react-moveable used inside Timeline
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
global.ResizeObserver = DummyResizeObserver
import React from 'react'

import { Timeline } from '../../features/timeline/components/Timeline'
import { useTimelineStore } from '../../state/timelineStore'
import { useMediaStore } from '../../state/mediaStore'

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
    selectedClipIds: [],
  })
  useMediaStore.setState({ assets: {} })
}

describe.skip('TrackRow drop', () => {
  afterEach(() => resetStores())

  it('adds clips when an asset id is dropped on a track row', async () => {
    act(() => {
      useMediaStore.getState().addAsset({
        id: 'asset1',
        fileName: 'test.mp4',
        duration: 2,
      })
      useTimelineStore.getState().addClip({
        // dummy existing clip to create lanes
        id: undefined as never,
        start: 0,
        end: 1,
        lane: 0,
      })
      useTimelineStore.getState().addClip({
        id: undefined as never,
        start: 0,
        end: 1,
        lane: 1,
      })
    })

    const { container } = render(<Timeline pixelsPerSecond={100} />)
    const row = container.querySelectorAll(
      '.relative.w-full.border-b',
    )[0] as HTMLDivElement
    Object.defineProperty(row, 'getBoundingClientRect', {
      value: () => ({ left: 0, top: 0, width: 200, height: 48, right: 200, bottom: 48 }),
    })

    const dataTransfer = {
      getData: () => 'asset1',
      types: ['text/x-mediamix-asset'],
    } as unknown as DataTransfer

    act(() => {
      fireEvent.drop(row, { dataTransfer, clientX: 100 })
    })

    await waitFor(() => {
      const clips = Object.values(useTimelineStore.getState().clipsById)
      expect(clips.length).toBe(4)
    })

    const added = Object.values(useTimelineStore.getState().clipsById).filter(
      (c) => c.assetId === 'asset1',
    )
    expect(added.length).toBe(2)
    expect(added[0].start).toBeCloseTo(1)
  })
})
