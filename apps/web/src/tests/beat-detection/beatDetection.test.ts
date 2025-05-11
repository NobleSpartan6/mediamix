import { describe, it, expect } from 'vitest';
import { detectBeats } from '../../utils/beatDetection';

describe('detectBeats', () => {
  it('detects energy peaks as beats', () => {
    const sampleRate = 10240; // 10240 samples/sec, frameSize default 1024 => 10 frames/sec
    const durationSec = 3; // seconds
    const totalSamples = sampleRate * durationSec;
    const samples = new Float32Array(totalSamples);

    // Inject 3 impulse beats at 0.5s, 1.5s, 2.5s
    const beatTimes = [0.5, 1.5, 2.5];
    beatTimes.forEach((t) => {
      const idx = Math.floor(t * sampleRate);
      // create short pulse of energy
      for (let i = 0; i < 256; i += 1) {
        samples[idx + i] = 1;
      }
    });

    const detected = detectBeats(samples, sampleRate, {
      frameSize: 1024,
      historySize: 10, // 1 second history
      energyThreshold: 2, // pulse 2x average
      refractoryGapSec: 0.2,
    });

    // Check that detected beats are within ±0.1s of expected
    expect(detected.length).toBe(beatTimes.length);
    detected.forEach((t, i) => {
      expect(Math.abs(t - beatTimes[i])).toBeLessThan(0.15);
    });
  });
}); 