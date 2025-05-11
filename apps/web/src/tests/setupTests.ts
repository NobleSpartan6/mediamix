// src/tests/setupTests.ts

import { vi } from 'vitest';

// Ensure FFmpeg module is mocked correctly
vi.mock('@ffmpeg/ffmpeg', () => {
  return import('../tests/__mocks__/@ffmpeg/ffmpeg.js');
});

// Mock the worker import
vi.mock('../../workers/audio-extraction.worker.ts?worker', () => {
  return {
    default: 'mock-worker-url'
  };
}, { virtual: true });

// Mock Worker API for tests
class MockWorker {
  private onmessageHandler: ((event: MessageEvent) => void) | null = null;
  
  constructor(stringUrl: string) {
    // This is a minimal implementation that just records the URL
    console.log(`MockWorker created with URL: ${stringUrl}`);
  }
  
  postMessage(data: any) {
    // Simulate a successful response after a short timeout
    setTimeout(() => {
      if (this.onmessageHandler) {
        // If this is an audio extraction request, return success
        if (data.type === 'EXTRACT_AUDIO') {
          const mockEvent = new MessageEvent('message', {
            data: {
              type: 'AUDIO_EXTRACTED',
              audioData: new ArrayBuffer(1024),
              format: data.payload?.outputFormat || 'wav',
              sampleRate: 44100
            }
          });
          this.onmessageHandler(mockEvent);
        }
      }
    }, 50);
  }
  
  set onmessage(handler: ((event: MessageEvent) => void) | null) {
    this.onmessageHandler = handler;
  }
  
  terminate() {
    // Clean up resources if needed
    this.onmessageHandler = null;
  }
}

// Polyfill Worker in the global scope if it doesn't exist (like in Node.js environment)
if (typeof Worker === 'undefined') {
  // Use globalThis instead of global for better TypeScript compatibility
  (globalThis as any).Worker = MockWorker;
}

// Mock window.URL.createObjectURL
if (typeof window !== 'undefined' && !window.URL.createObjectURL) {
  window.URL.createObjectURL = vi.fn(() => 'mock-object-url');
  window.URL.revokeObjectURL = vi.fn();
}

// Add this to your vitest.config.ts in the test section:
// setupFiles: ['./src/tests/setupTests.ts']