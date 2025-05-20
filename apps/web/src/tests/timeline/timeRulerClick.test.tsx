import { describe, it, afterEach, expect } from 'vitest'
import { render, fireEvent, act } from '@testing-library/react'
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

describe('TimeRuler click', () => {
  afterEach(() => {
    resetStore()
  })

  it('updates currentTime when clicked', () => {
    const scrollRef = React.createRef<HTMLDivElement>()
    const { container } = render(
      <>
        <div ref={scrollRef} />
        <TimeRuler scrollContainerRef={scrollRef} pixelsPerSecond={100} duration={10} />
      </>,
    )

    const rulerDiv = container.querySelector('canvas')!.parentElement!.parentElement as HTMLDivElement

    Object.defineProperty(rulerDiv, 'getBoundingClientRect', {
      value: () => ({ left: 0, top: 0, width: 200, height: 6, right: 200, bottom: 6 }),
    })

    act(() => {
      fireEvent.click(rulerDiv, { clientX: 150 })
    })

    expect(useTimelineStore.getState().currentTime).toBeCloseTo(1.5)
  })
})
