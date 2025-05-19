import { describe, it, expect, afterEach } from 'vitest'
import { render, act } from '@testing-library/react'

import { GhostCuts } from '../../features/timeline/components/GhostCuts'
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

describe('GhostCuts', () => {
  afterEach(() => resetStore())

  it('renders beat indicators at the correct positions', () => {
    act(() => {
      useTimelineStore.getState().setBeats([1, 2])
    })

    const { container } = render(
      <div data-testid="wrapper">
        <GhostCuts pixelsPerSecond={100} height={100} />
      </div>,
    )

    const lines = container.querySelectorAll('div.border-dashed')
    expect(lines).toHaveLength(2)
    expect((lines[0] as HTMLElement).style.transform).toBe('translateX(100px)')
    expect((lines[1] as HTMLElement).style.transform).toBe('translateX(200px)')
  })
})
