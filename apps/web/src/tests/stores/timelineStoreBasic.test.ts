import { describe, it, beforeEach, expect } from 'vitest'
import { act } from '@testing-library/react'

import { useTimelineStore } from '../../stores/timelineStore'

const resetStore = () => {
  useTimelineStore.setState({ tracks: [], clips: {}, currentTime: 0, zoom: 100 })
}

describe('timeline store basic actions', () => {
  beforeEach(() => resetStore())

  it('addClip stores clip by id', () => {
    let id = ''
    act(() => {
      id = useTimelineStore.getState().addClip({
        trackId: 't1',
        start: 0,
        duration: 2,
        mediaId: 'm1',
      })
    })
    const clip = useTimelineStore.getState().clips[id]
    expect(clip).toMatchObject({ trackId: 't1', start: 0, duration: 2, mediaId: 'm1' })
  })

  it('updateClip modifies existing clip', () => {
    let id = ''
    act(() => {
      id = useTimelineStore.getState().addClip({ trackId: 't1', start: 0, duration: 2, mediaId: 'm1' })
    })
    act(() => {
      useTimelineStore.getState().updateClip(id, { start: 1 })
    })
    expect(useTimelineStore.getState().clips[id].start).toBe(1)
  })

  it('setCurrentTime clamps to zero', () => {
    act(() => {
      useTimelineStore.getState().setCurrentTime(-5)
    })
    expect(useTimelineStore.getState().currentTime).toBe(0)
  })
})
