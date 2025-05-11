// src/lib/file/__mocks__/detectBeatsFromVideo.ts
import { vi } from 'vitest';

// Mock implementation returns a simple array of beat times
export const detectBeatsFromVideo = vi.fn().mockResolvedValue([
  0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0
]);