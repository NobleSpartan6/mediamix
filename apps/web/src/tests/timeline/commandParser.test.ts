import { describe, it, expect, afterEach } from 'vitest'
import { act } from '@testing-library/react'

import { parseCommand, executeCommand } from '../../ai/commandParser'
import { useTimelineStore } from '../../state/timelineStore'

const resetStore = () => {
  useTimelineStore.setState({
    clipsById: {},
    tracks: [],
    durationSec: 0,
    currentTime: 0,
    inPoint: null,
    outPoint: null,
    beats: [],
  })
}

describe('commandParser', () => {
  afterEach(() => resetStore())

  it('parses split and delete commands', () => {
    expect(parseCommand('split at 5s')).toEqual({ type: 'split', time: 5 })
    expect(parseCommand('delete clip 2')).toEqual({
      type: 'delete',
      clipIndex: 2,
      ripple: false,
    })
    expect(parseCommand('ripple delete clip 1')).toEqual({
      type: 'delete',
      clipIndex: 1,
      ripple: true,
    })
  })

  it('executes split command', () => {
    act(() => {
      useTimelineStore.getState().addClip({ id: undefined as never, start: 0, end: 2, lane: 0 })
    })
    executeCommand('split at 1s')
    const clips = Object.values(useTimelineStore.getState().clipsById).sort((a, b) => a.start - b.start)
    expect(clips.length).toBe(2)
    expect(clips[0]).toMatchObject({ start: 0, end: 1 })
    expect(clips[1]).toMatchObject({ start: 1, end: 2 })
  })

  it('executes ripple delete clip command', () => {
    act(() => {
      useTimelineStore.getState().addClip({ id: undefined as never, start: 0, end: 1, lane: 0 })
      useTimelineStore.getState().addClip({ id: undefined as never, start: 1, end: 2, lane: 0 })
    })

    executeCommand('ripple delete clip 1')

    const clips = Object.values(useTimelineStore.getState().clipsById)
    expect(clips.length).toBe(1)
    expect(clips[0]).toMatchObject({ start: 0, end: 1 })
  })
})
