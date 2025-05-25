import { describe, it, expect, afterEach } from 'vitest'
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

describe('TimeRuler tooltip clamping', () => {
  afterEach(() => {
    resetStore()
  })

  it('clamps tooltip within container bounds', () => {
    const scrollRef = React.createRef<HTMLDivElement>()
    const { container } = render(
      <>
        <div ref={scrollRef} />
        <TimeRuler scrollContainerRef={scrollRef} pixelsPerSecond={100} duration={10} />
      </>
    )

    const rulerDiv = container.querySelector('canvas')!.parentElement!.parentElement as HTMLDivElement

    Object.defineProperty(rulerDiv, 'getBoundingClientRect', {
      value: () => ({ left: 0, top: 0, width: 100, height: 6, right: 100, bottom: 6 }),
    })
    Object.defineProperty(rulerDiv, 'clientWidth', { value: 100 })

    act(() => {
      fireEvent.mouseMove(rulerDiv, { clientX: 95 })
    })

    let tooltip = rulerDiv.querySelector('.pointer-events-none') as HTMLDivElement
    expect(tooltip).not.toBeNull()
    Object.defineProperty(tooltip, 'clientWidth', { value: 40 })

    act(() => {
      fireEvent.mouseMove(rulerDiv, { clientX: 95 })
    })

    tooltip = rulerDiv.querySelector('.pointer-events-none') as HTMLDivElement
    expect(tooltip.style.left).toBe('60px')
  })
})
