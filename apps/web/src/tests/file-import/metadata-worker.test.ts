import { describe, it, expect, vi, beforeEach } from 'vitest'
import ActualMetadataWorker from '../../workers/metadata.worker.ts?worker'

// Mock worker instance
const mockWorkerInstance = {
  onmessage: null as ((event: MessageEvent) => void) | null,
  onerror: null as ((event: ErrorEvent) => void) | null,
  postMessage: vi.fn(),
  terminate: vi.fn(),
}

vi.mock('../../workers/metadata.worker.ts?worker', () => ({
  default: vi.fn(() => mockWorkerInstance),
}))

import { extractMetadataFromHandles } from '../../lib/file/extractMetadataFromHandles'

const MetadataWorkerMock = vi.mocked(ActualMetadataWorker)

describe('extractMetadataFromHandles', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockWorkerInstance.onmessage = null
    mockWorkerInstance.onerror = null
  })

  it('resolves with metadata array from worker', async () => {
    const expected = [
      {
        duration: 5,
        width: 640,
        height: 480,
        videoCodec: 'mp4',
        audioCodec: null,
        frameRate: 30,
        sampleRate: 44100,
        channelCount: 2,
      },
    ]

    mockWorkerInstance.postMessage.mockImplementation(() => {
      if (mockWorkerInstance.onmessage) {
        setTimeout(() => {
          mockWorkerInstance.onmessage!({ data: expected } as MessageEvent)
        }, 0)
      }
    })

    const handles = [{} as unknown as FileSystemFileHandle]
    const result = await extractMetadataFromHandles(handles)

    expect(result).toEqual(expected)
    expect(MetadataWorkerMock).toHaveBeenCalledTimes(1)
    expect(mockWorkerInstance.postMessage).toHaveBeenCalledWith(handles)
    expect(mockWorkerInstance.terminate).toHaveBeenCalledTimes(1)
  })
})

