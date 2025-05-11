import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

// Components under test
import VideoImportButton from '../../features/import/VideoImportButton'
import FileInfoCard from '../../features/import/FileInfoCard'

// Mock modules responsible for heavy lifting so we can focus on component behaviour
vi.mock('../../lib/file/selectVideoFile', () => {
  const file = new File(['dummy'], 'demo.mp4', { type: 'video/mp4' })
  return {
    selectVideoFile: vi.fn().mockResolvedValue({ file, handle: undefined }),
  }
})

vi.mock('../../lib/file/extractVideoMetadata', () => {
  return {
    extractVideoMetadata: vi.fn().mockResolvedValue({
      duration: 90,
      width: 1280,
      height: 720,
      videoCodec: 'avc1.42E01E',
      audioCodec: null,
      frameRate: 29.97,
      sampleRate: null,
      channelCount: null,
    }),
  }
})

vi.mock('../../lib/file/checkCodecSupport', () => {
  return {
    checkCodecSupport: vi.fn().mockResolvedValue({
      videoSupported: true,
      audioSupported: true,
    }),
  }
})

describe('Video import flow (integration)', () => {
  it('updates the FileInfoCard after successful import', async () => {
    render(
      <>
        <VideoImportButton />
        <FileInfoCard />
      </>
    )

    // Trigger import flow
    const btn = screen.getByRole('button', { name: /import video/i })
    fireEvent.click(btn)

    // Wait for FileInfoCard to appear with filename displayed
    await waitFor(() => {
      expect(screen.getByText('demo.mp4')).toBeDefined()
    })

    // Validate that codec support check indicator ✓ is shown
    expect(screen.getByText('✓')).toBeDefined()
  })
}) 