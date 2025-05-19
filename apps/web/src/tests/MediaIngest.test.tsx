import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, fireEvent, waitFor, screen } from '@testing-library/react'
import MediaIngest from '../features/import/MediaIngest'
import { useTimelineStore } from '../state/timelineStore'
import useMotifStore from '../lib/store'

vi.mock('../lib/file/extractVideoMetadata', () => ({
  extractVideoMetadata: vi.fn().mockResolvedValue({
    duration: 5,
    width: 640,
    height: 480,
    videoCodec: null,
    audioCodec: null,
    frameRate: null,
    sampleRate: null,
    channelCount: null,
  }),
}))

const resetStores = () => {
  useMotifStore.getState().resetState()
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

describe('MediaIngest', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    resetStores()
  })

  it('creates timeline clips when a file is imported', async () => {
    const file = new File(['dummy'], 'test.mp4', { type: 'video/mp4' })
    const handle = { kind: 'file', getFile: vi.fn().mockResolvedValue(file) }
    type WithPicker = Window & {
      showOpenFilePicker: () => Promise<{ getFile: () => Promise<File> }[]>
    }
    ;(window as unknown as WithPicker).showOpenFilePicker = vi.fn().mockResolvedValue([handle])

    render(<MediaIngest />)
    fireEvent.click(screen.getByRole('button', { name: /import media/i }))

    await waitFor(() => {
      const clips = Object.values(useTimelineStore.getState().clipsById)
      expect(clips.length).toBe(2)
      expect(clips[0].assetId).toBeDefined()
      expect(clips[1].assetId).toBeDefined()
    })
  })

  it('imports files when dropped', async () => {
    const file = new File(['dummy'], 'drop.mp4', { type: 'video/mp4' })
    const handle = { kind: 'file', getFile: vi.fn().mockResolvedValue(file) }

    const dataTransfer = {
      items: [
        {
          kind: 'file',
          getAsFileSystemHandle: vi.fn().mockResolvedValue(handle),
        },
      ],
    } as unknown as DataTransfer

    render(<MediaIngest />)
    const dropZone = screen
      .getByRole('button', { name: /import media/i })
      .parentElement as HTMLElement

    fireEvent.drop(dropZone, { dataTransfer })

    await waitFor(() => {
      const clips = Object.values(useTimelineStore.getState().clipsById)
      expect(clips.length).toBe(2)
    })
  })
})
