// vitest.setup.ts
/* eslint-disable */
import { vi } from 'vitest'

// Ensure FFmpeg module is mocked correctly
vi.mock('@ffmpeg/ffmpeg', () => {
  // Simple mock implementation
  const mockFFmpeg = {
    load: vi.fn().mockResolvedValue(undefined),
    isLoaded: vi.fn().mockReturnValue(true),
    run: vi.fn().mockResolvedValue(undefined),
    exec: vi.fn().mockResolvedValue(undefined),
    FS: vi.fn().mockImplementation((command, filename, data) => {
      if (command === 'readFile') {
        return new Uint8Array(1024) // Mock audio data
      }
      return undefined
    }),
    writeFile: vi.fn().mockResolvedValue(undefined),
    readFile: vi.fn().mockResolvedValue(new Uint8Array(1024)),
    unlink: vi.fn(),
    setProgress: vi.fn(),
    on: vi.fn(),
  }

  return {
    createFFmpeg: vi.fn().mockReturnValue(mockFFmpeg),
    FFmpeg: vi.fn().mockImplementation(() => mockFFmpeg),
  }
})

// Mock the worker import - IMPORTANT: Use the correct path as seen in your screenshots
vi.mock(
  '../src/workers/audio-extraction.worker.ts?worker',
  () => {
    return {
      default: 'mock-worker-url',
    }
  },
  { virtual: true },
)

// Define MockWorker class
class MockWorker {
  onmessage: ((event: MessageEvent) => void) | null = null
  onerror: ((event: ErrorEvent) => void) | null = null

  constructor(stringUrl: string) {
    // Constructor implementation
  }

  postMessage(data: any): void {
    // Simulate worker response
    setTimeout(async () => {
      if (!this.onmessage) return

      if (data.type === 'EXTRACT_AUDIO') {
        const mockEvent = new MessageEvent('message', {
          data: {
            type: 'AUDIO_EXTRACTED',
            audioData: new ArrayBuffer(1024),
            format: data.payload?.outputFormat || 'wav',
            sampleRate: 44100,
          },
        })
        this.onmessage(mockEvent)
      } else if (data.type === 'generateWaveform') {
        const { generateWaveform } = await import(
          './src/lib/file/generateWaveform'
        )
        const peaks = await generateWaveform(data.file)
        const mockEvent = new MessageEvent('message', {
          data: {
            assetId: data.assetId,
            waveform: peaks,
            type: 'waveformResult',
          },
        })
        this.onmessage(mockEvent)
      } else if (data.type === 'generateThumbnail') {
        const { captureThumbnail } = await import(
          './src/lib/file/captureThumbnail'
        )
        const thumbnail = await captureThumbnail(data.file)
        const mockEvent = new MessageEvent('message', {
          data: {
            assetId: data.assetId,
            thumbnail,
            type: 'thumbnailResult',
          },
        })
        this.onmessage(mockEvent)
      }
    }, 10)
  }

  terminate(): void {
    // Cleanup
  }
}

// Define Worker globally if it doesn't exist
if (typeof Worker === 'undefined') {
  ;(globalThis as any).Worker = MockWorker
}

// Simple canvas context mock so components using canvas don't throw
if (typeof HTMLCanvasElement !== 'undefined') {
  // Override getContext with a simple mock implementation
  // @ts-ignore
  HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
    fillRect: vi.fn(),
    clearRect: vi.fn(),
    getImageData: vi.fn(() => ({ data: [] })),
    putImageData: vi.fn(),
    createImageData: vi.fn(),
    setTransform: vi.fn(),
    drawImage: vi.fn(),
    save: vi.fn(),
    fillText: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    stroke: vi.fn(),
    translate: vi.fn(),
    scale: vi.fn(),
    rotate: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    measureText: vi.fn(() => ({ width: 0 })),
    transform: vi.fn(),
    rect: vi.fn(),
    clip: vi.fn(),
  }))
}

// Polyfill ResizeObserver for component libraries
if (typeof global.ResizeObserver === 'undefined') {
  class MockResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  // @ts-ignore
  global.ResizeObserver = MockResizeObserver
}

// Mock URL.createObjectURL for tests
if (typeof window !== 'undefined') {
  if (!window.URL.createObjectURL) {
    window.URL.createObjectURL = vi.fn().mockReturnValue('mock-object-url')
  }
  if (!window.URL.revokeObjectURL) {
    window.URL.revokeObjectURL = vi.fn()
  }
  if (!('indexedDB' in window)) {
    class FakeDB {
      name: string
      objectStoreNames = new Set<string>()
      constructor(name: string) {
        this.name = name
      }
      createObjectStore(name: string) {
        this.objectStoreNames.add(name)
        return {}
      }
      close() {}
    }
    class FakeRequest {
      result: any
      onupgradeneeded: ((ev: any) => void) | null = null
      onsuccess: ((ev: any) => void) | null = null
      onerror: ((ev: any) => void) | null = null
      constructor(result: any) {
        this.result = result
        setTimeout(() => {
          this.onupgradeneeded?.({ target: { result } })
          this.onsuccess?.({ target: { result } })
        }, 0)
      }
    }
    ;(window as any).indexedDB = {
      open(name: string) {
        const db = new FakeDB(name)
        return new FakeRequest(db)
      },
    } as IDBFactory
  }
}

// CRITICAL: Mock extractAudioTrack to return the expected structure
vi.mock('../src/lib/file/extractAudioTrack', () => {
  return {
    extractAudioTrack: vi.fn().mockImplementation((videoFile, outputFormat, onProgress) => {
      // Call the progress callback if provided
      if (onProgress) {
        setTimeout(() => onProgress(0.5), 10)
        setTimeout(() => onProgress(1.0), 20)
      }

      // Return a promise that resolves to the expected structure
      return Promise.resolve({
        audioData: new ArrayBuffer(1024),
        format: outputFormat || 'raw',
        sampleRate: 44100,
      })
    }),
  }
})

// Mock waveform and thumbnail generation to keep tests fast
vi.mock('../src/lib/file/generateWaveform', () => ({
  generateWaveform: vi.fn().mockResolvedValue([0.1, 0.2, 0.3]),
}))

vi.mock('../src/lib/file/captureThumbnail', () => ({
  captureThumbnail: vi.fn().mockResolvedValue('data:image/png;base64,mock'),
}))

// Mock detectBeatsFromVideo with a proper implementation
vi.mock('../src/lib/file/detectBeatsFromVideo', () => {
  return {
    detectBeatsFromVideo: vi.fn().mockImplementation((videoFile, options, onProgress) => {
      // Call progress callback if provided
      if (onProgress) {
        onProgress('extractAudio', 0.1)
        onProgress('analyzePCM', 0.5)
        onProgress('complete', 1.0)
      }

      return Promise.resolve([0.5, 1.0, 1.5, 2.0, 2.5])
    }),
  }
})
