import { describe, it, expect, afterEach, vi } from 'vitest'

// ────────────────────────────
// Static mocks
// ────────────────────────────
vi.mock('../lib/file/generateWaveform')
vi.mock('../lib/file/captureThumbnail')
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

import { extractVideoMetadata } from '../lib/file/extractVideoMetadata'
import { generateWaveform } from '../lib/file/generateWaveform'
import { captureThumbnail } from '../lib/file/captureThumbnail'

import React from 'react'
import { render, fireEvent, waitFor, screen } from '@testing-library/react'
import MediaIngest from '../features/import/MediaIngest'
import { useTimelineStore } from '../state/timelineStore'
import useMotifStore from '../lib/store'
import { useMediaStore } from '../state/mediaStore'
import { Clip } from '../features/timeline/components/Clip'

// Helper to wipe Zustand stores between tests
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
  useMediaStore.setState({ assets: {} })
}

describe('MediaIngest', () => {
  beforeEach(() => {
    vi.mocked(extractVideoMetadata).mockResolvedValue({
      duration: 5,
      width: 640,
      height: 480,
      videoCodec: null,
      audioCodec: null,
      frameRate: null,
      sampleRate: null,
      channelCount: null,
    })
    vi.mocked(generateWaveform).mockResolvedValue([0.1, 0.2, 0.3])
    vi.mocked(captureThumbnail).mockResolvedValue('data:image/png;base64,mock')
  })

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
    ;(window as unknown as WithPicker).showOpenFilePicker = vi
      .fn()
      .mockResolvedValue([handle])

    render(<MediaIngest />)
    fireEvent.click(screen.getByRole('button', { name: /import media/i }))

    await waitFor(
      () => {
        const clips = Object.values(useTimelineStore.getState().clipsById)
        expect(clips.length).toBe(2)
        expect(clips[0].assetId).toBeDefined()
        expect(clips[1].assetId).toBeDefined()

        const assets = useMediaStore.getState().assets
        const asset = assets[clips[0].assetId as string]
        expect(asset.waveform).toEqual([0.1, 0.2, 0.3])
        expect(asset.thumbnail).toBe('data:image/png;base64,mock')
      },
      { timeout: 2000 },
    )

    // Render clips individually to verify waveform canvas & thumbnail bg
    const clips = Object.values(useTimelineStore.getState().clipsById)
    const videoClip = clips.find((c) => c.lane % 2 === 0)!
    const audioClip = clips.find((c) => c.lane % 2 === 1)!

    const { container: vCont } = render(
      <Clip clip={videoClip} pixelsPerSecond={100} type="video" />,
    )
    const videoDiv = vCont.querySelector('div') as HTMLDivElement
    expect(videoDiv.style.backgroundImage).toContain(
      'data:image/png;base64,mock',
    )

    const { container: aCont } = render(
      <Clip clip={audioClip} pixelsPerSecond={100} type="audio" />,
    )
    expect(aCont.querySelector('canvas')).not.toBeNull()
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
