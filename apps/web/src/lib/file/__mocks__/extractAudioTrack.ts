// src/lib/file/__mocks__/extractAudioTrack.ts
import { vi } from 'vitest';

// Create a mock implementation that returns the proper structure
export const extractAudioTrack = vi.fn().mockImplementation(() => {
  return Promise.resolve({
    audioData: new Uint8Array(1024).buffer, // Return an ArrayBuffer (not Uint8Array)
    format: 'raw',
    sampleRate: 44100
  });
});