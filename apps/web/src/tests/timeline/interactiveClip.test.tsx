import { describe, it, expect, afterEach, vi } from 'vitest'

// Mock react-moveable before importing the component under test
let moveableProps: any = null
vi.mock('react-moveable', () => ({
  __esModule: true,
  default: (props: any) => {
    moveableProps = props
    return null
  },
}))

import { render, act, waitFor, cleanup } from '@testing-library/react'
import React from 'react'

import { InteractiveClip } from '../../features/timeline/components/InteractiveClip'
import { useTimelineStore } from '../../state/timelineStore'

// Polyfill ResizeObserver for JSDOM
class DummyResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
// @ts-ignore
global.ResizeObserver = DummyResizeObserver

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

describe('InteractiveClip', () => {
  afterEach(() => {
    resetStore()
    moveableProps = null
    cleanup()
  })

  it('updates clip start on drag end', async () => {
    const clip = { id: 'clip-1', start: 0, end: 5, lane: 0 }
    act(() => {
      useTimelineStore.setState({
        clipsById: { [clip.id]: clip },
        tracks: [],
        durationSec: 5,
        currentTime: 0,
        followPlayhead: true,
        inPoint: null,
        outPoint: null,
        beats: [],
      })
    })

    const { rerender } = render(
      <InteractiveClip clip={clip} pixelsPerSecond={100} type="video" />,
    )
    // Rerender so Moveable mounts once ref is set
    rerender(
      <InteractiveClip clip={{ ...clip }} pixelsPerSecond={100} type="video" />,
    )
    await waitFor(() => moveableProps !== null)

    act(() => {
      moveableProps.onDragStart()
      moveableProps.onDrag({ beforeTranslate: [100, 0] })
      moveableProps.onDragEnd({})
    })

    const updated = useTimelineStore.getState().clipsById[clip.id]
    expect(updated.start).toBeCloseTo(1)
    expect(updated.end).toBeCloseTo(6)
  })

  it('updates clip end on resize end', async () => {
    const clip = { id: 'clip-2', start: 0, end: 5, lane: 0 }
    act(() => {
      useTimelineStore.setState({
        clipsById: { [clip.id]: clip },
        tracks: [],
        durationSec: 5,
        currentTime: 0,
        followPlayhead: true,
        inPoint: null,
        outPoint: null,
        beats: [],
      })
    })

    const { rerender } = render(
      <InteractiveClip clip={clip} pixelsPerSecond={100} type="video" />,
    )
    rerender(
      <InteractiveClip clip={{ ...clip }} pixelsPerSecond={100} type="video" />,
    )
    await waitFor(() => moveableProps !== null)

    act(() => {
      moveableProps.onDragStart()
      moveableProps.onResizeEnd({
        width: 600,
        direction: [1, 0],
        drag: { beforeTranslate: [0, 0] },
      })
    })

    const updated = useTimelineStore.getState().clipsById[clip.id]
    expect(updated.end).toBeCloseTo(6)
    expect(updated.start).toBe(0)
  })

  it('snaps to the playhead time when dragging close', async () => {
    const clip = { id: 'clip-3', start: 0, end: 5, lane: 0 }
    act(() => {
      useTimelineStore.setState({
        clipsById: { [clip.id]: clip },
        tracks: [],
        durationSec: 5,
        currentTime: 2.9,
        followPlayhead: true,
        inPoint: null,
        outPoint: null,
        beats: [],
      })
    })

    const { rerender } = render(
      <InteractiveClip clip={clip} pixelsPerSecond={100} type="video" />,
    )
    rerender(
      <InteractiveClip clip={{ ...clip }} pixelsPerSecond={100} type="video" />,
    )
    await waitFor(() => moveableProps !== null)

    act(() => {
      moveableProps.onDragStart()
      moveableProps.onDrag({ beforeTranslate: [295, 0] })
      moveableProps.onDragEnd({})
    })

    const updated = useTimelineStore.getState().clipsById[clip.id]
    expect(updated.start).toBeCloseTo(2.9)
  })

  it('snaps to clips on other lanes', async () => {
    const clip = { id: 'clip-4', start: 0, end: 2, lane: 0 }
    const other = { id: 'clip-5', start: 3, end: 4, lane: 1 }
    act(() => {
      useTimelineStore.setState({
        clipsById: { [clip.id]: clip, [other.id]: other },
        tracks: [],
        durationSec: 4,
        currentTime: 0,
        followPlayhead: true,
        inPoint: null,
        outPoint: null,
        beats: [],
      })
    })

    const { rerender } = render(
      <InteractiveClip clip={clip} pixelsPerSecond={100} type="video" />,
    )
    rerender(
      <InteractiveClip clip={{ ...clip }} pixelsPerSecond={100} type="video" />,
    )
    await waitFor(() => moveableProps !== null)

    act(() => {
      moveableProps.onDragStart()
      moveableProps.onDrag({ beforeTranslate: [295, 0] })
      moveableProps.onDragEnd({})
    })

    const updated = useTimelineStore.getState().clipsById[clip.id]
    expect(updated.start).toBeCloseTo(3)
  })
})
