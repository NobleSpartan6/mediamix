import { describe, it, expect, beforeEach } from 'vitest'
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
  })
}

describe('timelineStore', () => {
  beforeEach(() => resetStore())

  it('addClip creates tracks with labels based on lane', () => {
    act(() => {
      useTimelineStore.getState().addClip({ id: undefined as never, start: 0, end: 1, lane: 0 })
      useTimelineStore.getState().addClip({ id: undefined as never, start: 0, end: 1, lane: 1 })
    })
    const labels = useTimelineStore.getState().tracks.map((t) => t.label)
    expect(labels).toEqual(['V1', 'A1'])
  })

  it('updateClip adjusts durationSec when end increases', () => {
    let id: string = ''
    act(() => {
      id = useTimelineStore.getState().addClip({ id: undefined as never, start: 0, end: 2, lane: 0 })
    })
    expect(useTimelineStore.getState().durationSec).toBe(2)
    act(() => {
      useTimelineStore.getState().updateClip(id, { end: 3 })
    })
    expect(useTimelineStore.getState().durationSec).toBe(3)
  })

  it('splitClipAt produces two clips abutting the original', () => {
    act(() => {
      useTimelineStore.getState().addClip({ id: undefined as never, start: 0, end: 4, lane: 0 })
    })
    act(() => {
      useTimelineStore.getState().splitClipAt(2)
    })
    const clips = Object.values(useTimelineStore.getState().clipsById).sort((a, b) => a.start - b.start)
    expect(clips.length).toBe(2)
    expect(clips[0]).toMatchObject({ start: 0, end: 2 })
    expect(clips[1]).toMatchObject({ start: 2, end: 4 })
  })
})
