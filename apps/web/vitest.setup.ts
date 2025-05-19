// vitest.setup.ts
import { vi } from 'vitest';

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
        return new Uint8Array(1024); // Mock audio data
      }
      return undefined;
    }),
    writeFile: vi.fn().mockResolvedValue(undefined),
    readFile: vi.fn().mockResolvedValue(new Uint8Array(1024)),
    unlink: vi.fn(),
    setProgress: vi.fn(),
    on: vi.fn()
  };

  return {
    createFFmpeg: vi.fn().mockReturnValue(mockFFmpeg),
    FFmpeg: vi.fn().mockImplementation(() => mockFFmpeg)
  };
});

// Mock the worker import - IMPORTANT: Use the correct path as seen in your screenshots
vi.mock('../src/workers/audio-extraction.worker.ts?worker', () => {
  return {
    default: 'mock-worker-url'
  };
}, { virtual: true });

// Define MockWorker class
class MockWorker {
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;
  
  constructor(stringUrl: string) {
    // Constructor implementation
    console.log(`MockWorker created with URL: ${stringUrl}`);
  }
  
  postMessage(data: any): void {
    // Simulate worker response
    setTimeout(() => {
      if (this.onmessage && data.type === 'EXTRACT_AUDIO') {
        const mockEvent = new MessageEvent('message', {
          data: {
            type: 'AUDIO_EXTRACTED',
            audioData: new ArrayBuffer(1024),
            format: data.payload?.outputFormat || 'wav',
            sampleRate: 44100
          }
        });
        this.onmessage(mockEvent);
      }
    }, 10);
  }
  
  terminate(): void {
    // Cleanup
  }
}

// Define Worker globally if it doesn't exist
if (typeof Worker === 'undefined') {
  (globalThis as any).Worker = MockWorker;
}

// Polyfill ResizeObserver for component libraries
if (typeof global.ResizeObserver === 'undefined') {
  class MockResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  // @ts-ignore
  global.ResizeObserver = MockResizeObserver;
}

// Mock URL.createObjectURL for tests
if (typeof window !== 'undefined') {
  if (!window.URL.createObjectURL) {
    window.URL.createObjectURL = vi.fn().mockReturnValue('mock-object-url');
  }
  if (!window.URL.revokeObjectURL) {
    window.URL.revokeObjectURL = vi.fn();
  }
}

// CRITICAL: Mock extractAudioTrack to return the expected structure
vi.mock('../src/lib/file/extractAudioTrack', () => {
  return {
    extractAudioTrack: vi.fn().mockImplementation((videoFile, outputFormat, onProgress) => {
      // Call the progress callback if provided
      if (onProgress) {
        setTimeout(() => onProgress(0.5), 10);
        setTimeout(() => onProgress(1.0), 20);
      }
      
      // Return a promise that resolves to the expected structure
      return Promise.resolve({
        audioData: new ArrayBuffer(1024),
        format: outputFormat || 'raw',
        sampleRate: 44100
      });
    })
  };
});

// Mock detectBeatsFromVideo with a proper implementation
vi.mock('../src/lib/file/detectBeatsFromVideo', () => {
  return {
    detectBeatsFromVideo: vi.fn().mockImplementation((videoFile, options, onProgress) => {
      // Call progress callback if provided
      if (onProgress) {
        onProgress('extractAudio', 0.1);
        onProgress('analyzePCM', 0.5);
        onProgress('complete', 1.0);
      }
      
      return Promise.resolve([0.5, 1.0, 1.5, 2.0, 2.5]);
    })
  };
});