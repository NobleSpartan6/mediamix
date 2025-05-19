import { describe, it, expect, afterEach, vi } from 'vitest'
import React from 'react'
import { render, fireEvent, waitFor, screen } from '@testing-library/react'
import MediaIngest from '../features/import/MediaIngest'
import { useTimelineStore } from '../state/timelineStore'
import useMotifStore from '../lib/store'
import { useMediaStore } from '../state/mediaStore'
import { Clip } from '../features/timeline/components/Clip'

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
vi.mock('../lib/file/generateWaveform', () => ({
  generateWaveform: vi.fn().mockResolvedValue([0.1, 0.2]),
}))
vi.mock('../lib/file/captureThumbnail', () => ({
  captureThumbnail: vi.fn().mockResolvedValue('data:image/png;base64,test'),
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
  useMediaStore.setState({ assets: {} })
}

describe('MediaIngest', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    resetStores()
  })

  it('creates timeline clips when a file is imported', async () => {
    const file = new File(['dummy'], 'test.mp4', { type: 'video/mp4' })
    const handle = { getFile: vi.fn().mockResolvedValue(file) }
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
      const assets = useMediaStore.getState().assets
      const asset = assets[clips[0].assetId as string]
      expect(asset.waveform?.length).toBeGreaterThan(0)
      expect(asset.thumbnail).toContain('data:image')
    })

    const clips = Object.values(useTimelineStore.getState().clipsById)
    const videoClip = clips.find((c) => c.lane % 2 === 0)!
    const audioClip = clips.find((c) => c.lane % 2 === 1)!
    const { container: vCont } = render(
      <Clip clip={videoClip} pixelsPerSecond={100} type="video" />,
    )
    const videoDiv = vCont.querySelector('div') as HTMLDivElement
    expect(videoDiv.style.backgroundImage).toContain('data:image')
    const { container: aCont } = render(
      <Clip clip={audioClip} pixelsPerSecond={100} type="audio" />,
    )
    expect(aCont.querySelector('canvas')).not.toBeNull()
  })
})
