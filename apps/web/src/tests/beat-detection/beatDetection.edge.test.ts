import { describe, it, expect } from 'vitest';
import { detectBeats } from '../../utils/beatDetection';

// Edge case tests for detectBeats utility

describe('detectBeats (edge cases)', () => {
  it('returns an empty array for silent audio', () => {
    const sampleRate = 10240;
    const durationSec = 2;
    const samples = new Float32Array(sampleRate * durationSec); // all zeros

    const beats = detectBeats(samples, sampleRate);
    expect(beats).toEqual([]);
  });

  it('respects refractory gap by merging close impulses', () => {
    const sampleRate = 10240;
    const frameSize = 1024;
    const refractoryGapSec = 0.25; // default in util
    const durationSec = 2;
    const samples = new Float32Array(sampleRate * durationSec);

    // Two impulses 0.1s apart (within gap) starting at 0.5s
    const impulseOffsetsSec = [0.5, 0.6];
    impulseOffsetsSec.forEach((t) => {
      const idx = Math.floor(t * sampleRate);
      for (let i = 0; i < 256; i += 1) {
        samples[idx + i] = 1;
      }
    });
    // Another impulse at 1.0s (outside gap)
    const idxFar = Math.floor(1.0 * sampleRate);
    for (let i = 0; i < 256; i += 1) {
      samples[idxFar + i] = 1;
    }

    const beats = detectBeats(samples, sampleRate, { frameSize, refractoryGapSec });

    // Expect two beats: first cluster should produce one, then the far impulse
    expect(beats.length).toBe(2);
    expect(Math.abs(beats[0] - impulseOffsetsSec[0])).toBeLessThan(0.15);
    expect(Math.abs(beats[1] - 1.0)).toBeLessThan(0.15);
  });

  it('throws an error when sampleRate <= 0', () => {
    const samples = new Float32Array(1024);
    expect(() => detectBeats(samples, 0)).toThrow();
    expect(() => detectBeats(samples, -44100)).toThrow();
  });
}); 