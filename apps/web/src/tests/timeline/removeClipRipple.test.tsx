import { describe, it, expect, afterEach } from 'vitest'
import { act } from '@testing-library/react'

import { useTimelineStore } from '../../state/timelineStore'

// Reset store after each test
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

describe('removeClip ripple option', () => {
  afterEach(() => resetStore())

  it('shifts subsequent clips when ripple is true', () => {
    act(() => {
      useTimelineStore.getState().addClip({ id: undefined as never, start: 0, end: 1, lane: 0 })
      useTimelineStore.getState().addClip({ id: undefined as never, start: 1, end: 2, lane: 0 })
    })
    const ids = Object.keys(useTimelineStore.getState().clipsById)
    const first = ids[0]
    const second = ids[1]

    act(() => {
      useTimelineStore.getState().removeClip(first, { ripple: true })
    })

    const secondClip = useTimelineStore.getState().clipsById[second]
    expect(secondClip.start).toBe(0)
    expect(secondClip.end).toBe(1)
  })
})
