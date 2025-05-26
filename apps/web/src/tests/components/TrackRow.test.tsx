import { describe, it, afterEach, expect } from 'vitest'
import { render, fireEvent, act } from '@testing-library/react'
import React from 'react'

import { TrackRow } from '../../features/timeline/components/TrackRow'
import { useTimelineStore, type Track } from '../../state/timelineStore'

vi.mock('react-moveable', () => ({
  __esModule: true,
  default: () => null,
}))

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

describe('TrackRow', () => {
  afterEach(() => resetStore())

  it('toggles locked state when lock icon clicked', () => {
    const track: Track = {
      id: 't1',
      type: 'video',
      label: 'V1',
      groupId: 'g1',
      locked: false,
      muted: false,
    }
    act(() => {
      useTimelineStore.setState({
        clipsById: {},
        tracks: [track as never],
        durationSec: 0,
        currentTime: 0,
        followPlayhead: true,
        inPoint: null,
        outPoint: null,
        beats: [],
        selectedClipIds: [],
      })
    })

    const timelineRef = React.createRef<HTMLDivElement>()
    const { rerender, getByLabelText } = render(
      <TrackRow
        laneIndex={0}
        clips={[]}
        pixelsPerSecond={100}
        track={track}
        timelineRef={timelineRef}
      />,
    )

    const lockBtn = getByLabelText('Lock track') as HTMLButtonElement
    act(() => {
      fireEvent.click(lockBtn)
    })

    const updated = useTimelineStore.getState().tracks[0]
    expect(updated.locked).toBe(true)

    rerender(
      <TrackRow
        laneIndex={0}
        clips={[]}
        pixelsPerSecond={100}
        track={updated}
        timelineRef={timelineRef}
      />,
    )
    expect(getByLabelText('Unlock track').className).toContain('opacity-50')
  })

  it('renders clips disabled when track locked', () => {
    const track: Track = {
      id: 't1',
      type: 'video',
      label: 'V1',
      groupId: 'g1',
      locked: true,
      muted: false,
    }
    const clip = { id: 'c1', start: 0, end: 1, lane: 0 }
    act(() => {
      useTimelineStore.setState({
        clipsById: { [clip.id]: clip },
        tracks: [track as never],
        durationSec: 1,
        currentTime: 0,
        followPlayhead: true,
        inPoint: null,
        outPoint: null,
        beats: [],
        selectedClipIds: [],
      })
    })

    const timelineRef = React.createRef<HTMLDivElement>()
    const { container } = render(
      <TrackRow
        laneIndex={0}
        clips={[clip]}
        pixelsPerSecond={100}
        track={track}
        timelineRef={timelineRef}
      />,
    )

    expect(container.querySelector('.pointer-events-none')).not.toBeNull()
  })
})
