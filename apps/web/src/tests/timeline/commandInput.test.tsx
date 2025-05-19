import { describe, it, expect, afterEach } from 'vitest'
import { render, fireEvent, act } from '@testing-library/react'
import { CommandInput } from '../../features/timeline/components/CommandInput'
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

describe('CommandInput', () => {
  afterEach(() => resetStore())

  it('executes commands typed by the user', () => {
    act(() => {
      useTimelineStore.getState().addClip({ id: undefined as never, start: 0, end: 2, lane: 0 })
    })
    const { getByPlaceholderText } = render(<CommandInput />)
    const input = getByPlaceholderText(/enter command/i)
    fireEvent.change(input, { target: { value: 'split at 1s' } })
    fireEvent.submit(input.closest('form') as HTMLFormElement)

    const clips = Object.values(useTimelineStore.getState().clipsById)
    expect(clips.length).toBe(2)
  })
})
