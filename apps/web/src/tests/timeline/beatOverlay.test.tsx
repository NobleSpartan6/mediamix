import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, act } from '@testing-library/react'
import React from 'react'

import { Timeline } from '../../features/timeline/components/Timeline'
import { useTimelineStore } from '../../state/timelineStore'

// Stub moveable which requires browser APIs
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
    selectedClipIds: [],
  })
}

describe('Timeline beat overlays', () => {
  afterEach(() => resetStore())

  it('renders beat indicators at the correct positions', () => {
    act(() => {
      useTimelineStore.getState().setBeats([1, 2])
    })

    const { container } = render(<Timeline pixelsPerSecond={100} />)

    const lines = container.querySelectorAll('div.w-px[class*="bg-accent/20"]')
    expect(lines).toHaveLength(2)
    expect((lines[0] as HTMLElement).style.transform).toBe('translateX(100px)')
    expect((lines[1] as HTMLElement).style.transform).toBe('translateX(200px)')
  })
})
