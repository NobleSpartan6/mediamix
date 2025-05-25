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

  it('updateClip moves paired clips with same groupId', () => {
    let videoId = ''
    let audioId = ''
    act(() => {
      videoId = useTimelineStore.getState().addClip(
        { id: undefined as never, start: 0, end: 1, lane: 0 },
        { trackType: 'video', groupId: 'g1' },
      )
      audioId = useTimelineStore.getState().addClip(
        { id: undefined as never, start: 0, end: 1, lane: 1 },
        { trackType: 'audio', groupId: 'g1' },
      )
    })

    act(() => {
      useTimelineStore.getState().updateClip(videoId, { start: 1, end: 2, lane: 2 })
    })

    const v = useTimelineStore.getState().clipsById[videoId]
    const a = useTimelineStore.getState().clipsById[audioId]
    expect(v.start).toBe(1)
    expect(a.start).toBe(1)
    expect(v.lane).toBe(2)
    expect(a.lane).toBe(3)
  })

  it('removeClip deletes all clips in the same group', () => {
    let videoId = ''
    let audioId = ''
    act(() => {
      videoId = useTimelineStore.getState().addClip(
        { id: undefined as never, start: 0, end: 1, lane: 0 },
        { trackType: 'video', groupId: 'g2' },
      )
      audioId = useTimelineStore.getState().addClip(
        { id: undefined as never, start: 0, end: 1, lane: 1 },
        { trackType: 'audio', groupId: 'g2' },
      )
    })

    act(() => {
      useTimelineStore.getState().removeClip(videoId)
    })

    expect(useTimelineStore.getState().clipsById[videoId]).toBeUndefined()
    expect(useTimelineStore.getState().clipsById[audioId]).toBeUndefined()
  })
})
