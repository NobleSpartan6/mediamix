import { describe, it, afterEach, expect } from 'vitest'
import { render, fireEvent, act } from '@testing-library/react'
import React from 'react'

import { TrackRow } from '../../components/timeline/TrackRow'
import { useTimelineStore, type Track } from '../../state/timelineStore'

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

describe.skip('TrackRow', () => {
  afterEach(() => resetStore())

  it('toggles locked state when lock icon clicked', () => {
    const track: Track = { id: 't1', name: 'V1', type: 'video', locked: false, muted: false }
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

    const { rerender, getByLabelText } = render(<TrackRow track={track} />)

    const lockBtn = getByLabelText('Lock track') as HTMLButtonElement
    act(() => {
      fireEvent.click(lockBtn)
    })

    const updated = useTimelineStore.getState().tracks[0]
    expect(updated.locked).toBe(true)

    rerender(<TrackRow track={updated} />)
    expect(getByLabelText('Unlock track').className).toContain('opacity-50')
  })
})
