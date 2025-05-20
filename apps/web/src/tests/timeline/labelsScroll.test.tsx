import { describe, it, afterEach, expect, vi } from 'vitest'
import { render, act } from '@testing-library/react'

// Stub react-moveable used by InteractiveClip
vi.mock('react-moveable', () => ({
  __esModule: true,
  default: () => null,
}))
import React from 'react'

import { Timeline } from '../../features/timeline/components/Timeline'
import { useTimelineStore } from '../../state/timelineStore'

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

describe('Timeline label scrolling', () => {
  afterEach(() => resetStore())

  it('keeps labels aligned while scrolling', () => {
    act(() => {
      for (let i = 0; i < 6; i++) {
        useTimelineStore.getState().addClip({
          id: undefined as never,
          start: 0,
          end: 1,
          lane: i,
        })
      }
    })

    const { container } = render(<Timeline pixelsPerSecond={100} />)
    const scroll = container.querySelector('div.overflow-y-auto') as HTMLDivElement
    expect(scroll).toBeTruthy()

    scroll.scrollTop = 40
    scroll.dispatchEvent(new Event('scroll'))

    expect(scroll.scrollTop).toBe(40)
    const label = scroll.querySelector('div.shrink-0') as HTMLDivElement
    const track = scroll.querySelector('.cursor-grab')!.parentElement as HTMLDivElement
    expect(label.parentElement).toBe(scroll)
    expect(track.parentElement).toBe(scroll)
  })
})
