import { describe, it, afterEach, expect } from 'vitest'
import { render, fireEvent, act } from '@testing-library/react'
import React from 'react'

import { TrackRow } from '../../components/timeline/TrackRow'
import { useTimelineStore, type Track } from '../../stores/timelineStore'

const resetStore = () => {
  useTimelineStore.setState({ tracks: [], clips: {}, currentTime: 0, zoom: 100 })
}

describe('TrackRow', () => {
  afterEach(() => resetStore())

  it('toggles locked state when lock icon clicked', () => {
    const track: Track = { id: 't1', name: 'V1', type: 'video', locked: false, muted: false }
    act(() => {
      useTimelineStore.setState({ tracks: [track], clips: {}, currentTime: 0, zoom: 100 })
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
