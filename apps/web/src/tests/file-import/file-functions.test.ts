// @ts-nocheck
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import { selectVideoFile } from '../../lib/file/selectVideoFile'
import { extractVideoMetadata } from '../../lib/file/extractVideoMetadata'
import { checkCodecSupport } from '../../lib/file/checkCodecSupport'

// Helper: create a fresh File object for each test
const createTestFile = () => new File(['dummy'], 'sample.mp4', {
  type: 'video/mp4'
})

// Reset any globals patched during tests
afterEach(() => {
  vi.restoreAllMocks()
})

// ---------------------------------------------------------------------------
// selectVideoFile
// ---------------------------------------------------------------------------

describe('selectVideoFile', () => {
  it('returns selected file and handle when showOpenFilePicker is available', async () => {
    const testFile = createTestFile()

    // Stub FileSystemFileHandle-like object
    const fakeHandle = {
      getFile: vi.fn().mockResolvedValue(testFile),
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(window as any).showOpenFilePicker = vi.fn().mockResolvedValue([fakeHandle])

    const result = await selectVideoFile()

    expect(result).not.toBeNull()
    expect(result?.[0]?.file).toBe(testFile)
    // Ensure we propagate the original handle reference (for FS access API)
    expect(result?.[0]?.handle).toBe(fakeHandle)
  })
})

// ---------------------------------------------------------------------------
// extractVideoMetadata
// ---------------------------------------------------------------------------

describe('extractVideoMetadata', () => {
  it('returns null when running in a non-browser-like environment', async () => {
    // Temporarily remove window to simulate non-browser context
    const originalWindow = globalThis.window
    // @ts-ignore
    delete globalThis.window

    const testFile = createTestFile()
    const result = await extractVideoMetadata(testFile)

    expect(result).toBeNull()

    // Restore window
    // @ts-ignore
    globalThis.window = originalWindow
  })
})

// ---------------------------------------------------------------------------
// checkCodecSupport
// ---------------------------------------------------------------------------

describe('checkCodecSupport', () => {
  it('returns true for video/audio support when WebCodecs reports support', async () => {
    const isConfigSupported = vi.fn().mockResolvedValue({ supported: true })

    // Create minimal stubs for WebCodecs classes
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(window as any).VideoDecoder = { isConfigSupported }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(window as any).AudioDecoder = { isConfigSupported }

    const result = await checkCodecSupport()

    expect(result.videoSupported).toBe(true)
    expect(result.audioSupported).toBe(true)
  })

  it('returns nulls when WebCodecs is unavailable', async () => {
    // Remove decoders
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any).VideoDecoder
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any).AudioDecoder

    const result = await checkCodecSupport()

    expect(result.videoSupported).toBeNull()
    expect(result.audioSupported).toBeNull()
  })
}) 