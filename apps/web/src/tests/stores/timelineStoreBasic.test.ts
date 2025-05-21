import { describe, it, beforeEach, expect } from 'vitest'
import { act } from '@testing-library/react'

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
    selectedClipIds: [],
  })
}

describe('timeline store basic actions', () => {
  beforeEach(() => resetStore())

  it('addClip stores clip by id', () => {
    let id = ''
    act(() => {
      id = useTimelineStore.getState().addClip({
        start: 0,
        end: 2,
        lane: 0,
      })
    })
    const clip = useTimelineStore.getState().clipsById[id]
    expect(clip).toMatchObject({ start: 0, end: 2, lane: 0 })
  })

  it('updateClip modifies existing clip', () => {
    let id = ''
    act(() => {
      id = useTimelineStore.getState().addClip({ start: 0, end: 2, lane: 0 })
    })
    act(() => {
      useTimelineStore.getState().updateClip(id, { start: 1 })
    })
    expect(useTimelineStore.getState().clipsById[id].start).toBe(1)
  })

  it('setCurrentTime updates value', () => {
    act(() => {
      useTimelineStore.getState().setCurrentTime(-5)
    })
    expect(useTimelineStore.getState().currentTime).toBe(-5)
  })
})
