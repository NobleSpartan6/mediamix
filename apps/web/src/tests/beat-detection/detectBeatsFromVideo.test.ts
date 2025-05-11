import { describe, it, expect, vi, afterEach } from 'vitest'

// Relative paths can be tricky with Vitest mocks when using Vite's ?worker suffix.
// We compute absolute module specifiers to ensure the mocks match the ones used
// inside detectBeatsFromVideo.ts.

// 1) Mock `extractAudioTrack` so we don't spawn the heavy audio-extraction worker.
vi.mock('../../lib/file/extractAudioTrack', () => {
  return {
    // The mock resolves with a tiny 4-byte PCM ArrayBuffer (two int16 samples)
    extractAudioTrack: vi.fn().mockResolvedValue({
      audioData: new ArrayBuffer(4),
      sampleRate: 44100,
    }),
  }
})

// 2) Mock the beat-detection worker module imported with `?worker` suffix.
// The import path in `detectBeatsFromVideo.ts` resolves to:
//   apps/web/src/workers/beat-detection.worker.ts?worker
// Using the absolute path makes the mock unambiguous.
vi.mock('../../workers/beat-detection.worker.ts?worker', () => {
  // Simple mock Worker class that immediately echoes a BEATS_DETECTED message
  class MockBeatWorker {
    // Using `onmessage` and `onerror` properties for compatibility
    public onmessage: ((ev: MessageEvent<any>) => void) | null = null
    public onerror: ((ev: ErrorEvent) => void) | null = null

    // `postMessage` responds async to simulate worker processing
    postMessage() {
      // Simulate a short async delay
      setTimeout(() => {
        this.onmessage?.({
          data: {
            type: 'BEATS_DETECTED',
            beats: [0.1, 0.5, 1.0],
          },
        } as unknown as MessageEvent)
      }, 0)
    }

    terminate() {
      /* noop */
    }
  }

  return {
    default: MockBeatWorker,
  }
})

// Import under test **after** mocks are in place
import { detectBeatsFromVideo } from '../../lib/file/detectBeatsFromVideo'

// Helper: tiny fake File instance
const createFakeFile = () => new File([new ArrayBuffer(8)], 'sample.mp4', { type: 'video/mp4' })

describe('detectBeatsFromVideo', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('resolves with beat timestamps and reports progress', async () => {
    const progressCalls: Array<{ stage: string; value?: number }> = []

    const beats = await detectBeatsFromVideo(createFakeFile(), (stage, value) => {
      progressCalls.push({ stage, value })
    })

    expect(beats).toEqual([0.1, 0.5, 1.0])

    // First call should mark start of audio extraction with 0 progress
    expect(progressCalls[0]).toEqual({ stage: 'extractAudio', value: 0 })
    // Next progress update should mark extraction completion (1)
    const last = progressCalls[progressCalls.length - 1]
    expect(last.stage).toBe('extractAudio')
    expect(last.value).toBe(1)
  })
}) 