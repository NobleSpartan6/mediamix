import { describe, it, expect, afterEach } from 'vitest'
import { render, act } from '@testing-library/react'
import React from 'react'

import { TimeRuler } from '../../features/timeline/components/TimeRuler'
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

describe('TimeRuler in/out overlay', () => {
  afterEach(() => resetStore())

  it('renders overlay between in and out points', () => {
    act(() => {
      useTimelineStore.getState().setInPoint(1)
      useTimelineStore.getState().setOutPoint(3)
    })

    const scrollRef = React.createRef<HTMLDivElement>()
    const { getByTestId } = render(
      <div>
        <div ref={scrollRef} />
        <TimeRuler scrollContainerRef={scrollRef} pixelsPerSecond={100} duration={10} />
      </div>,
    )

    const overlay = getByTestId('inout-overlay') as HTMLElement
    expect(overlay.style.left).toBe('100px')
    expect(overlay.style.width).toBe('200px')
  })
})
